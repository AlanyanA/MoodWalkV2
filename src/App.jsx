import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Ctx, Sheet, Chip, Icon, buzz, useApp as useCtx } from './components/ui.jsx';
import MusicSheet from './components/MusicSheet.jsx';
import Plan from './screens/Plan.jsx';
import { Reflect, Postcard, ReviewFields, PlaceSelect } from './screens/Reflect.jsx';
import Walk from './screens/Walk.jsx';
import Places from './screens/Places.jsx';
import Settings from './screens/Settings.jsx';
import { usePersisted, save } from './lib/store.js';
import { music } from './lib/music.js';
import { HF as NOTES, goalById } from './data/content.js';
import { routeById, ROUTES } from './data/routes.js';

const DEFAULT_SETTINGS = { text: 'm', contrast: 'normal', theme: 'system', motion: 'auto', guide: 'turn', orient: 'track', sens: 0.5, clock: 'auto', tracking: 'demo', lens: false };
const DEFAULT_PLAN = { step: 'goal', goal: null, feel: null, time: '15-30', prefs: [], access: [], music: true, route: null, compare: false, reveal: false, nightDecided: false, nightAuto: false, shared: false, post: null, lastWalk: null, remind: null };

// wait before suggesting a rating after a skipped review (15–30 s)
const REMIND_DELAY = 20000;
save('journal', null); // the journal feature was removed; clear old data

const TABS = [
  ['walk', 'Walk', <path key="p" d="M13 4a2 2 0 1 1 0 .1M10 21l2-6 3 3v3M9 12l2-4 3 1 2 3 3 1M11 8l-2 5" />],
  ['places', 'Places', <g key="p"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></g>],
  ['settings', 'Settings', <g key="p"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></g>],
];

function useDark(theme) {
  const q = useMemo(() => window.matchMedia?.('(prefers-color-scheme: dark)'), []);
  const [sys, setSys] = useState(!!q?.matches);
  useEffect(() => {
    if (!q) return undefined;
    const f = (e) => setSys(e.matches);
    q.addEventListener('change', f);
    return () => q.removeEventListener('change', f);
  }, [q]);
  return theme === 'dark' || (theme === 'system' && sys);
}

export default function App() {
  const [settings, setSettings] = usePersisted('settings', DEFAULT_SETTINGS);
  const [plan, setPlan] = usePersisted('plan', DEFAULT_PLAN);
  const [reviews, setReviews] = usePersisted('reviews', []);
  const [reports, setReports] = usePersisted('reports', []);
  const [confirms, setConfirms] = usePersisted('confirms', {});
  const [tune, setTune] = usePersisted('tune', {});
  const [musicPrefs, setMusicPrefs] = usePersisted('music', { playlist: 'calm', track: 0, volume: 0.6 });
  const [walk, setWalk] = usePersisted('walk', null);
  const [ui, setUi] = usePersisted('ui', { tab: 'walk', openPlace: null });
  const [sheet, setSheet] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [nudge, setNudge] = useState(null);
  const toastTimer = useRef();
  const dark = useDark(settings.theme);
  const musicState = useSyncExternalStore(music.subscribe, music.get);

  // restore music choices once, then keep them saved
  useEffect(() => { music.set({ playlist: musicPrefs.playlist, track: musicPrefs.track, volume: musicPrefs.volume }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMusicPrefs({ playlist: musicState.playlist, track: musicState.track, volume: musicState.volume }); }, [musicState.playlist, musicState.track, musicState.volume, setMusicPrefs]);

  const patchPlan = useCallback((p) => setPlan((s) => ({ ...s, ...p })), [setPlan]);
  const patchPost = useCallback((x) => setPlan((s) => ({ ...s, post: { ...s.post, ...x } })), [setPlan]);
  const patchSettings = useCallback((p) => setSettings((s) => ({ ...s, ...p })), [setSettings]);
  const setTab = useCallback((tab) => { setUi((u) => ({ ...u, tab })); window.scrollTo(0, 0); }, [setUi]);
  const openSheet = useCallback((s) => setSheet(s), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  const toast = useCallback((msg, undo) => {
    setToastMsg({ msg, undo, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), undo ? 6000 : 2800);
  }, []);

  // theme, text size and goal colour live on the root element
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.text = settings.text;
    el.dataset.contrast = settings.contrast;
    el.dataset.motion = settings.motion;
    el.dataset.mood = plan.goal || 'calm';
    if (settings.theme === 'system') delete el.dataset.theme; else el.dataset.theme = settings.theme;
    document.body.classList.toggle('lens', !!settings.lens);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0E1512' : '#E9EFEC');
  }, [settings, plan.goal, dark]);

  useEffect(() => { window.scrollTo(0, 0); }, [plan.step]);

  const startWalk = useCallback(() => {
    const r = routeById(plan.route);
    setWalk({ route: r.id, dist: 0, speed: 20, startedAt: Date.now(), goal: plan.goal, feel: plan.feel });
    if (plan.music && !music.get().playing) {
      const g = goalById(plan.goal);
      music.play(music.get().playlist === g.playlist ? music.get().playlist : g.playlist, music.get().playlist === g.playlist ? music.get().track : 0);
    }
    buzz(30);
  }, [plan, setWalk]);

  const finishWalk = useCallback((arrived, dist) => {
    setWalk((w) => {
      if (!w) return null;
      const r = routeById(w.route);
      const total = r.cd[r.cd.length - 1];
      const min = Math.max(1, Math.round(r.min * Math.min(1, dist / total)));
      setPlan((p) => ({ ...p, step: 'reflect', goal: w.goal || p.goal, post: { route: r.id, min, fb: w.feel || p.feel || 3, fa: null, match: null, arrived } }));
      return null;
    });
    music.stop();
    setUi((u) => ({ ...u, tab: 'walk' }));
    buzz([30, 40, 30]);
  }, [setWalk, setPlan, setUi]);

  const saveReflection = useCallback(() => {
    const p = plan.post;
    const date = new Date().toISOString().slice(0, 10);
    const rated = !!(p.match || p.noise || p.green || p.safe || p.crowd || p.text);
    if (rated) {
      setReviews((rv) => [...rv, { id: `r${Date.now()}`, route: p.route, when: 'just now', date, match: p.match || null, noise: p.noise || 3, green: p.green || 3, safe: p.safe || 3, crowd: p.crowd || 3, text: p.text || '' }]);
    }
    const lastWalk = { route: p.route, goal: plan.goal || 'calm', fb: p.fb, fa: p.fa, min: p.min, date };
    patchPlan({ step: 'postcard', post: null, lastWalk, shared: false, remind: rated ? null : { route: p.route, at: Date.now() + REMIND_DELAY } });
  }, [plan, setReviews, patchPlan]);

  const skipReflection = useCallback(() => {
    patchPlan({ step: 'goal', post: null, remind: { route: plan.post.route, at: Date.now() + REMIND_DELAY } });
  }, [plan, patchPlan]);

  // Gentle "rate the route" reminder: waits, never shows during a walk or over an open sheet, hides itself.
  useEffect(() => {
    const r = plan.remind;
    if (!r || walk || sheet) return undefined;
    const t = setTimeout(() => { setNudge(r); patchPlan({ remind: null }); }, Math.max(1500, r.at - Date.now()));
    return () => clearTimeout(t);
  }, [plan.remind, walk, sheet, patchPlan]);
  useEffect(() => {
    if (!nudge) return undefined;
    const t = setTimeout(() => setNudge(null), 12000);
    return () => clearTimeout(t);
  }, [nudge]);

  const deleteReview = useCallback((id) => {
    const old = reviews;
    setReviews(reviews.filter((x) => x.id !== id));
    toast('Review deleted', () => setReviews(old));
  }, [reviews, setReviews, toast]);

  const ctx = {
    settings, patchSettings, plan, patchPlan, patchPost, reviews, setReviews, reports, setReports, confirms, setConfirms,
    tune, setTune, walk, setWalk, ui, setUi, setTab, openSheet, closeSheet, toast, dark, musicState, startWalk, finishWalk, saveReflection, skipReflection, deleteReview,
  };

  const tab = ui.tab;
  let view;
  if (tab === 'places') view = <Places />;
  else if (tab === 'settings') view = <Settings />;
  else if (plan.step === 'reflect' && plan.post) view = <Reflect />;
  else if (plan.step === 'postcard') view = <Postcard />;
  else view = <Plan />;

  return (
    <Ctx.Provider value={ctx}>
      <div className="app">
        <header className="top">
          <div className="brand">
            <svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="var(--mood)" /><path d="M7 21c4-8 7 2 10-5s5-6 8-3" fill="none" stroke="var(--surface)" strokeWidth="2.6" strokeLinecap="round" /><circle cx="25" cy="13" r="2.4" fill="var(--surface)" /></svg>
            MoodWalk
          </div>
          <span className="place">Gwanak-gu</span>
        </header>
        <main>{view}</main>
      </div>
      <nav className="tabs" aria-label="Main">
        <div className="in">
          {TABS.map(([id, l, p]) => (
            <button type="button" key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p}</svg>{l}
            </button>
          ))}
        </div>
      </nav>
      {walk && routeById(walk.route) && <Walk />}
      {nudge && !walk && !sheet && routeById(nudge.route) && (
        <div className="nudge" role="status" aria-live="polite">
          <span className="nudgedot" aria-hidden="true" />
          <span className="nudgetext"><b>Rate {routeById(nudge.route).name}?</b><span className="small muted">Takes 30 seconds and helps the next walker.</span></span>
          <button type="button" className="btn primary sm" onClick={() => { openSheet({ kind: 'review', route: nudge.route }); setNudge(null); }}>Rate</button>
          <button type="button" className="iconbtn sm" aria-label="Dismiss" onClick={() => setNudge(null)}><Icon.close /></button>
        </div>
      )}
      {sheet && <SheetHost sheet={sheet} onClose={closeSheet} />}
      {toastMsg && (
        <div className="toast" role="status" key={toastMsg.id}>
          <span>{toastMsg.msg}</span>
          {toastMsg.undo && <button type="button" onClick={() => { toastMsg.undo(); setToastMsg(null); }}>Undo</button>}
        </div>
      )}
    </Ctx.Provider>
  );
}

function SheetHost({ sheet, onClose }) {
  if (sheet.kind === 'hf') {
    const n = NOTES[sheet.k];
    return <Sheet title={n.t} onClose={onClose}><p>{n.x}</p><p className="small muted" style={{ marginTop: 12 }}>Source: {n.src}</p></Sheet>;
  }
  if (sheet.kind === 'music') return <MusicSheet onClose={onClose} />;
  if (sheet.kind === 'review') return <ReviewSheet onClose={onClose} route={sheet.route} />;
  if (sheet.kind === 'report') return <ReportSheet onClose={onClose} />;
  if (sheet.kind === 'share') return <ShareSheet onClose={onClose} />;
  return null;
}

function ReviewSheet({ onClose, route }) {
  const { setReviews, toast, setUi } = useCtx();
  const [d, setD] = useState({ route: route || 'sharosu' });
  const upd = (x) => setD((s) => ({ ...s, ...x }));
  const post = () => {
    const rv = { id: `r${Date.now()}`, route: d.route, when: 'just now', date: new Date().toISOString().slice(0, 10), noise: d.noise || 3, green: d.green || 3, safe: d.safe || 3, crowd: d.crowd || 3, text: d.text || '' };
    setReviews((x) => [...x, rv]);
    setUi((u) => ({ ...u, openPlace: rv.route }));
    onClose();
    toast('Review posted', () => setReviews((x) => x.filter((y) => y.id !== rv.id)));
  };
  return (
    <Sheet title="Review a place" onClose={onClose} big>
      <div className="stack" style={{ gap: 14 }}>
        <div><label className="lbl" htmlFor="place">Place</label><PlaceSelect value={d.route} onChange={(v) => upd({ route: v })} /></div>
        <ReviewFields draft={d} set={upd} idp="sh" />
        <button type="button" className="btn primary" onClick={post}>Post review</button>
      </div>
    </Sheet>
  );
}

function ReportSheet({ onClose }) {
  const { setReports, toast } = useCtx();
  const [route, setRoute] = useState(ROUTES[0].id);
  const [type, setType] = useState('Broken streetlight');
  const send = () => {
    const rp = { id: `p${Date.now()}`, route, t: `${type} (your report)`, at: 0.5, when: 'just now' };
    setReports((x) => [...x, rp]);
    onClose();
    toast('Report sent. Other walkers will be asked to confirm it.', () => setReports((x) => x.filter((y) => y.id !== rp.id)));
  };
  return (
    <Sheet title="Report a hazard" onClose={onClose}>
      <div className="stack" style={{ gap: 14 }}>
        <p className="small muted">Anonymous and quick. Reports start unconfirmed until other walkers confirm them.</p>
        <div><label className="lbl" htmlFor="place">Where</label><PlaceSelect value={route} onChange={setRoute} /></div>
        <div className="chips" role="radiogroup" aria-label="Type of hazard">
          {['Broken streetlight', 'Uneven path', 'Flooding', 'Construction', 'Blocked path'].map((t) => <Chip key={t} on={type === t} onClick={() => setType(t)}>{t}</Chip>)}
        </div>
        <button type="button" className="btn primary" onClick={send}>Send report</button>
      </div>
    </Sheet>
  );
}

function ShareSheet({ onClose }) {
  const { plan, patchPlan, toast } = useCtx();
  const r = routeById(plan.route);
  const eta = new Date(Date.now() + r.min * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const msg = `I'm walking ${r.name} (${r.ko}) in Gwanak-gu, ${r.km} km. Back around ${eta}.`;
  const ta = useRef();
  const done = (m) => { patchPlan({ shared: true }); onClose(); toast(m); };
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ text: msg }); done('Shared'); return; }
      await navigator.clipboard.writeText(msg);
      done('Copied. Paste it in a message to a friend.');
    } catch {
      ta.current?.select();
    }
  };
  return (
    <Sheet title="Share your ETA" onClose={onClose}>
      <div className="stack" style={{ gap: 12 }}>
        <p className="small muted">Send this to someone you trust.</p>
        <textarea ref={ta} rows={3} readOnly value={msg} />
        <button type="button" className="btn primary" onClick={share}>{navigator.share ? 'Share message' : 'Copy message'}</button>
      </div>
    </Sheet>
  );
}

