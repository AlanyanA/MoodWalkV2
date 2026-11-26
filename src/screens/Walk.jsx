import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp, HF, Icon, Modal, buzz } from '../components/ui.jsx';
import { tileLayer, pin } from '../components/LMap.jsx';
import { routeById } from '../data/routes.js';
import { pointAt, nearest } from '../lib/geo.js';
import { street } from '../lib/romanize.js';
import { hazardsFor, threshold } from '../lib/score.js';

const ORIENT = [
  ['track', 'Track-up', 'Map turns with you'],
  ['north', 'North up', 'N'],
  ['east', 'East up', 'E'],
  ['south', 'South up', 'S'],
  ['west', 'West up', 'W'],
];
const FIXED = { north: 0, east: -90, south: 180, west: 90 };
const VERB = { left: 'Turn left', right: 'Turn right', 'slight left': 'Bear left', 'slight right': 'Bear right', 'sharp left': 'Turn sharp left', 'sharp right': 'Turn sharp right', uturn: 'Turn around', straight: 'Go straight' };
const SPEEDS = [1, 20, 60];

const A = { fill: 'none', stroke: 'currentColor', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ARROW = {
  left: <svg viewBox="0 0 52 52" {...A}><path d="M34 44V24c0-4-3-6-6-6H12" /><path d="M20 9 11 18l9 9" /></svg>,
  right: <svg viewBox="0 0 52 52" {...A}><path d="M18 44V24c0-4 3-6 6-6h16" /><path d="m32 9 9 9-9 9" /></svg>,
  straight: <svg viewBox="0 0 52 52" {...A}><path d="M26 46V8" /><path d="m16 18 10-10 10 10" /></svg>,
  uturn: <svg viewBox="0 0 52 52" {...A}><path d="M18 46V20a8 8 0 0 1 16 0v8" /><path d="m26 22 8 8 8-8" /></svg>,
  arrive: <svg viewBox="0 0 52 52" {...A}><path d="M26 46s14-13 14-24a14 14 0 0 0-28 0c0 11 14 24 14 24z" /><circle cx="26" cy="22" r="5" /></svg>,
  landmark: <svg viewBox="0 0 52 52" {...A} strokeWidth="4.5"><circle cx="26" cy="26" r="19" /><path d="m33 19-4 10-10 4 4-10z" /></svg>,
};
const arrowFor = (mod) => (mod?.includes('left') ? 'left' : mod?.includes('right') ? 'right' : mod === 'uturn' ? 'uturn' : 'straight');
const round = (m, s) => Math.max(s, Math.round(m / s) * s);

function instruction(r, dist, guide) {
  const total = r.cd[r.cd.length - 1];
  const end = r.marks[r.marks.length - 1];
  if (dist >= total - 3) return { key: 'arrive', icon: 'arrive', main: `You've arrived at ${end}`, sub: `${r.km} km walked` };
  const steps = r.steps;
  const nextI = steps.findIndex((s) => s.at > dist + 3 && s.type !== 'depart');
  const next = steps[nextI];
  const prev = [...steps].reverse().find((s) => s.at <= dist + 3) || steps[0];
  const leg = (next || prev).leg;
  const toward = r.marks[Math.min(r.marks.length - 1, leg + 1)];
  if (guide === 'landmark') return { key: `lm${leg}`, icon: 'landmark', main: `Head toward ${toward}`, sub: 'Landmark mode · find your own way' };
  if (next && next.at - dist <= 70) {
    const name = street(next.name);
    if (next.type === 'arrive') return { key: `n${nextI}`, turn: true, icon: 'arrive', main: `Arriving at ${end}`, sub: `In ${round(next.at - dist, 5)} m` };
    return { key: `n${nextI}`, turn: true, icon: arrowFor(next.mod), main: `${VERB[next.mod] || 'Continue'}${name ? ` onto ${name}` : ''}`, sub: `In ${round(next.at - dist, 5)} m` };
  }
  const cur = street(prev.name);
  return { key: `c${nextI}`, icon: 'straight', main: cur ? `Continue on ${cur}` : `Continue toward ${toward}`, sub: next ? `Next turn in ${round(next.at - dist, 10)} m` : `${round(total - dist, 10)} m to go` };
}

export default function Walk() {
  const { walk, setWalk, settings, patchSettings, dark, openSheet, finishWalk, reports, confirms, setConfirms, musicState } = useApp();
  const r = routeById(walk.route);
  const total = r.cd[r.cd.length - 1];
  const wrap = useRef();
  const mapEl = useRef();
  const st = useRef({ dist: walk.dist || 0, rot: 0, speed: walk.speed || 20, paused: false, alerted: {}, lastKey: '' });
  const [ui, setUi] = useState({ instr: instruction(r, walk.dist || 0, settings.guide), dist: walk.dist || 0 });
  const [alert, setAlert] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [orientOpen, setOrientOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(st.current.speed);
  const [gps, setGps] = useState(null);
  const cfg = useRef(settings);
  cfg.current = settings;
  const hz = useRef([]);
  hz.current = hazardsFor(r, reports, confirms);

  useEffect(() => {
    const s = st.current;
    const m = L.map(mapEl.current, { zoomControl: false, attributionControl: true, dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, keyboard: false, boxZoom: false, tap: false, zoomSnap: 0 });
    m.attributionControl.setPrefix(false);
    tileLayer(dark).addTo(m);
    L.polyline(r.coords, { color: '#fff', weight: 12, opacity: 0.9 }).addTo(m);
    L.polyline(r.coords, { color: r.color, weight: 7, opacity: 0.55, dashArray: r.dash || null }).addTo(m);
    const walked = L.polyline([], { color: r.color, weight: 7, opacity: 1 }).addTo(m);
    L.marker(r.coords[r.coords.length - 1], { icon: pin('E', 'end'), interactive: false }).addTo(m);
    hz.current.filter((h) => h.conf >= threshold(cfg.current.sens)).forEach((h) => {
      L.marker(pointAt(r.coords, r.cd, h.at * total).pos, { icon: pin('!', 'hazard'), interactive: false }).addTo(m);
    });
    const me = L.marker(r.coords[0], { icon: L.divIcon({ className: 'mw-me', html: '<div class="me-rot"><svg viewBox="0 0 40 40"><path d="M20 3 29 16H11z" fill="var(--mood)"/><circle cx="20" cy="22" r="9" fill="var(--mood)" stroke="#fff" stroke-width="3"/></svg></div>', iconSize: [40, 40], iconAnchor: [20, 22] }), interactive: false, zIndexOffset: 1000 }).addTo(m);
    m.setView(r.coords[0], 17.3, { animate: false });

    const size = () => {
      const w = wrap.current.clientWidth;
      const h = wrap.current.clientHeight;
      const d = Math.ceil(Math.hypot(w, h));
      Object.assign(mapEl.current.style, { width: `${d}px`, height: `${d}px`, left: `${(w - d) / 2}px`, top: `${(h - d) / 2}px` });
      m.invalidateSize({ animate: false });
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(wrap.current);

    let last = performance.now();
    let lastPan = 0;
    let lastSave = 0;
    let lastUi = 0;
    let raf;
    let arriveT;
    const tick = (now) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const c = cfg.current;
      if (!s.paused && c.tracking === 'demo') s.dist = Math.min(total, s.dist + dt * s.speed * 1.25);
      const p = pointAt(r.coords, r.cd, s.dist);
      const target = c.orient === 'track' ? -p.brg : FIXED[c.orient] ?? 0;
      const diff = ((target - s.rot + 540) % 360) - 180;
      s.rot += c.motion === 'reduce' ? diff : diff * Math.min(1, dt * 4);
      mapEl.current.style.transform = `rotate(${s.rot.toFixed(2)}deg)`;
      me.setLatLng(p.pos);
      const el = me.getElement()?.firstChild;
      if (el) el.style.transform = `rotate(${p.brg.toFixed(1)}deg)`;
      if (now - lastPan > 90) {
        lastPan = now;
        m.setView(p.pos, m.getZoom(), { animate: false });
        walked.setLatLngs([...r.coords.slice(0, p.i), p.pos]);
      }
      if (now - lastUi > 250) {
        lastUi = now;
        const ins = instruction(r, s.dist, c.guide);
        if (ins.key !== s.lastKey) { if (ins.turn) buzz([80, 60, 80]); s.lastKey = ins.key; }
        setUi({ instr: ins, dist: s.dist });
        hz.current.forEach((h) => {
          const hd = h.at * total;
          if (h.conf >= threshold(c.sens) && !s.alerted[h.key] && s.dist > hd - 120 && s.dist < hd) {
            s.alerted[h.key] = true;
            buzz([200, 100, 200]);
            setAlert(h);
          }
        });
      }
      if (now - lastSave > 1000) { lastSave = now; setWalk((w) => (w ? { ...w, dist: s.dist, speed: s.speed } : w)); }
      if (s.dist >= total - 2 && !arriveT) arriveT = setTimeout(() => finishWalk(true, s.dist), 1800);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let watch;
    if (cfg.current.tracking === 'gps' && navigator.geolocation) {
      watch = navigator.geolocation.watchPosition(
        (pos) => {
          const n = nearest(r.coords, r.cd, [pos.coords.latitude, pos.coords.longitude]);
          setGps({ off: Math.round(n.off) });
          if (n.off < 80) s.dist = Math.max(s.dist, n.dist);
        },
        () => setGps({ error: true }),
        { enableHighAccuracy: true, maximumAge: 3000 },
      );
    }
    return () => { cancelAnimationFrame(raf); clearTimeout(arriveT); ro.disconnect(); if (watch != null) navigator.geolocation.clearWatch(watch); m.remove(); };
  }, [dark]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = (v) => { st.current.paused = v; setPaused(v); };
  const askEnd = () => { setConfirmEnd(true); pause(true); };
  const left = Math.max(0, Math.ceil(r.min * (1 - ui.dist / total)));
  const o = ORIENT.find((x) => x[0] === settings.orient) || ORIENT[0];
  const demo = settings.tracking === 'demo';

  return (
    <section className="walk" aria-label="Walk in progress">
      <div className="wtop">
        <div className="t"><span className="eyebrow">{left} min left · {(ui.dist / 1000).toFixed(2)} of {r.km} km</span><b>{r.name}</b></div>
        <div className="hfwrap">
          <HF k="frame" />
          <button type="button" className="iconbtn" aria-haspopup="true" aria-expanded={orientOpen} onClick={() => setOrientOpen(!orientOpen)}><Icon.compass /><span className="small">{o[1]}</span></button>
        </div>
        <div className="hfwrap">
          <HF k="mrt" />
          <button type="button" className={`iconbtn${musicState.playing ? ' on' : ''}`} onClick={() => openSheet({ kind: 'music' })}><Icon.music /><span className="small">Music</span></button>
        </div>
      </div>
      {orientOpen && (
        <div className="orientmenu" role="radiogroup" aria-label="Map orientation">
          {ORIENT.map(([id, l, hint]) => (
            <button type="button" key={id} role="radio" aria-checked={settings.orient === id} aria-pressed={settings.orient === id}
              onClick={() => { patchSettings({ orient: id }); setOrientOpen(false); }}>
              <span className="oicon">{id === 'track' ? <Icon.compass /> : hint}</span>{l}
            </button>
          ))}
        </div>
      )}
      <div className="wprog" aria-hidden="true"><i style={{ width: `${(ui.dist / total) * 100}%` }} /></div>
      <div className="wmap hfwrap" ref={wrap}>
        <HF k="seev" />
        <div className="wleaf" ref={mapEl} />
        {settings.orient !== 'track' && <div className="compass" style={{ transform: `rotate(${FIXED[settings.orient]}deg)` }} aria-hidden="true"><i />N</div>}
        {alert && (
          <div className="alertc hfwrap" role="alert">
            <HF k="sdt" />
            <b>Ahead: {alert.t}</b>
            <p className="small muted">Reported {alert.age} · {alert.ok} walker{alert.ok === 1 ? '' : 's'} confirmed</p>
            <div className="row"><span className="small" style={{ flex: 1 }}>Is it still there?</span>
              <button type="button" className="btn" onClick={() => { setConfirms((c) => ({ ...c, [alert.key]: 'yes' })); setAlert(null); }}>Yes</button>
              <button type="button" className="btn" onClick={() => { setConfirms((c) => ({ ...c, [alert.key]: 'no' })); setAlert(null); }}>No</button>
            </div>
          </div>
        )}
        {!demo && gps && <div className="gpsnote">{gps.error ? 'Location unavailable. Check permissions.' : gps.off > 80 ? `You are ${gps.off} m from the route` : 'GPS: on route'}</div>}
      </div>
      <div className="instr" aria-live="polite">
        {ARROW[ui.instr.icon]}
        <div><b>{ui.instr.main}</b><small>{ui.instr.sub}</small></div>
      </div>
      <div className="wctl">
        {demo ? (
          <button type="button" className="btn" onClick={() => { const n = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; st.current.speed = n; setSpeed(n); }} aria-label="Demo speed">Speed ×{speed}</button>
        ) : <span />}
        <button type="button" className="btn" onClick={() => pause(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
        <div className="hfwrap">
          <HF k="slips" />
          <button type="button" className="btn danger wide" onClick={askEnd}>End</button>
        </div>
      </div>
      {confirmEnd && (
        <Modal title="End this walk?">
          <p>You've walked {(ui.dist / 1000).toFixed(2)} of {r.km} km. You can still rate how you feel afterwards.</p>
          <div className="row" style={{ marginTop: 16 }}>
            <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={() => { setConfirmEnd(false); pause(false); }}>Keep walking</button>
            <button type="button" className="btn danger" style={{ flex: 1 }} onClick={() => finishWalk(false, st.current.dist)}>End walk</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
