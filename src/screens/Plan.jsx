import { useEffect, useMemo, useState } from 'react';
import { useApp, HF, Face, GoalIcon, Icon, Chip } from '../components/ui.jsx';
import LMap from '../components/LMap.jsx';
import { GOALS, FEELS, TIMES, PREFS, ACCESS, goalById, timeById } from '../data/content.js';
import { routeById } from '../data/routes.js';
import { ranked, CONF, aggregate, hazardsFor, threshold } from '../lib/score.js';
import { playlistById } from '../lib/music.js';

const STEPS = ['Goal', 'Mood', 'Time', 'Routes'];
function Stepper({ n, back }) {
  return (
    <div className="row" style={{ gap: 10 }}>
      {back && <button type="button" className="iconbtn" onClick={back} aria-label="Back"><Icon.back /></button>}
      <div className="stepper" aria-label={`Step ${n} of 4: ${STEPS[n - 1]}`}>
        {STEPS.map((s, i) => <i key={s} className={i < n ? 'on' : ''} />)}
        <span>{n} of 4</span>
      </div>
    </div>
  );
}

export function isNight(clock) {
  if (clock === 'day') return false;
  if (clock === 'night') return true;
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

function greeting() {
  const h = new Date().getHours();
  return `${h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'} · ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}`;
}

function Goal() {
  const { plan, patchPlan } = useApp();
  return (
    <div className="stack">
      <Stepper n={1} />
      <div className="stack" style={{ gap: 4 }}>
        <p className="eyebrow">{greeting()}</p>
        <h1>How do you want to feel after your walk?</h1>
      </div>
      <div className="goals hfwrap">
        <HF k="gulfs" />
        {GOALS.map((g) => (
          <button type="button" key={g.id} className="goal" style={{ '--mc': `var(--m-${g.id})` }} aria-pressed={plan.goal === g.id}
            onClick={() => patchPlan({ goal: g.id, step: 'feel' })}>
            {GoalIcon[g.id]}
            <b>{g.label}</b>
            <small>{g.sub}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function Feel() {
  const { plan, patchPlan } = useApp();
  const [picked, setPicked] = useState(plan.feel);
  const pick = (v) => { setPicked(v); setTimeout(() => patchPlan({ feel: v, step: 'prefs' }), 180); };
  return (
    <div className="stack">
      <Stepper n={2} back={() => patchPlan({ step: 'goal' })} />
      <h1>How do you feel right now?</h1>
      <div className="feels hfwrap" role="radiogroup" aria-label="Current mood">
        <HF k="hick" />
        {[5, 4, 3, 2, 1].map((v) => (
          <button type="button" key={v} className="feel" role="radio" aria-checked={picked === v} aria-pressed={picked === v} onClick={() => pick(v)}>
            <Face v={v} size={44} /><span>{FEELS[v - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Prefs() {
  const { plan, patchPlan, settings } = useApp();
  useEffect(() => {
    if (isNight(settings.clock) && !plan.nightDecided) {
      patchPlan({ nightDecided: true, nightAuto: !plan.access.includes('lit'), access: plan.access.includes('lit') ? plan.access : [...plan.access, 'lit'] });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (key, id) => {
    const arr = plan[key];
    const on = arr.includes(id);
    patchPlan({ [key]: on ? arr.filter((x) => x !== id) : [...arr, id], ...(id === 'lit' && on ? { nightAuto: false } : {}) });
  };
  return (
    <div className="stack">
      <Stepper n={3} back={() => patchPlan({ step: 'feel' })} />
      <h1>How much time do you have?</h1>
      <div className="times hfwrap" role="radiogroup" aria-label="Time">
        <HF k="mapping" />
        {TIMES.map((t) => (
          <button type="button" key={t.id} className="time" role="radio" aria-checked={plan.time === t.id} aria-pressed={plan.time === t.id} onClick={() => patchPlan({ time: t.id })}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="card">
        <h3>I'd enjoy</h3>
        <p className="small muted">Optional</p>
        <div className="chips" style={{ marginTop: 10 }}>
          {PREFS.map(([id, l]) => <Chip key={id} on={plan.prefs.includes(id)} onClick={() => toggle('prefs', id)}>{l}</Chip>)}
        </div>
      </div>
      <div className="card hfwrap">
        <HF k="ud1" />
        <h3>I need</h3>
        <p className="small muted">Optional</p>
        <div className="chips" style={{ marginTop: 10 }}>
          {ACCESS.map(([id, l]) => <Chip key={id} on={plan.access.includes(id)} onClick={() => toggle('access', id)}>{l}</Chip>)}
        </div>
        {plan.nightAuto && plan.access.includes('lit') && (
          <div className="banner hfwrap" style={{ marginTop: 12 }}>
            <HF k="hcai" />
            <Icon.moon />
            <span>It's after sunset, so we turned on <b>Well-lit</b>. Tap it to turn it off.</span>
          </div>
        )}
      </div>
      <div className="card row">
        <div style={{ flex: 1, minWidth: 0 }}><h3>Suggest music</h3><p className="small muted">Matched to your goal and pace</p></div>
        <div className="seg" style={{ width: 128 }}>
          <button type="button" aria-pressed={plan.music} onClick={() => patchPlan({ music: true })}>On</button>
          <button type="button" aria-pressed={!plan.music} onClick={() => patchPlan({ music: false })}>Off</button>
        </div>
      </div>
      <button type="button" className="btn primary wide" onClick={() => patchPlan({ step: 'results', compare: false })}>Show my routes</button>
    </div>
  );
}

const dots = (v) => '●'.repeat(Math.round(v * 4) + 1) + '○'.repeat(4 - Math.round(v * 4));

function Results() {
  const { plan, patchPlan, tune, journal, dark } = useApp();
  const top = useMemo(() => ranked(plan, tune, journal).slice(0, 3), [plan, tune, journal]);
  const g = goalById(plan.goal);
  const summary = [g.label, timeById(plan.time).short, ...plan.prefs.map((p) => PREFS.find((x) => x[0] === p)[1]), ...plan.access.map((p) => ACCESS.find((x) => x[0] === p)[1])];
  return (
    <div className="stack">
      <Stepper n={4} back={() => patchPlan({ step: 'prefs' })} />
      <div className="row" style={{ gap: 6 }}>
        {summary.map((s) => <span key={s} className="pill">{s}</span>)}
        <button type="button" className="linkbtn" onClick={() => patchPlan({ step: 'prefs' })}>Edit</button>
      </div>
      <h1>Walks for you</h1>
      <div className="stack hfwrap" style={{ gap: 12 }}>
        <HF k="simplicity" />
        {top.map((x, i) => (
          <button type="button" key={x.r.id} className="rcard" onClick={() => patchPlan({ step: 'detail', route: x.r.id, reveal: false })}>
            {i === 0 && <span className="rank">Best match</span>}
            <LMap routes={[x.r]} active={x.r.id} dark={dark} interactive={false} attribution={false} className="mini" padding={8} ariaLabel={`Map of ${x.r.name}`} />
            <div className="rinfo">
              <h3>{x.r.name}</h3>
              <p className="meta">{x.r.min} min · {x.r.km} km · {x.r.type}</p>
              <div className="match" aria-label={`${x.pct} percent match`}><div className="bar"><i style={{ width: `${x.pct}%` }} /></div><b>{x.pct}%</b></div>
              {x.warn.length > 0 && <p className="small warntext">{x.warn.join(' · ')}</p>}
            </div>
          </button>
        ))}
      </div>
      <div className={`card compare hfwrap${plan.compare ? ' open' : ''}`}>
        <HF k="pcp" />
        <button type="button" className="comparebtn" aria-expanded={!!plan.compare} onClick={() => patchPlan({ compare: !plan.compare })}>
          <span>Compare side by side</span><Icon.chevron open={plan.compare} />
        </button>
        {plan.compare && (
          <div className="stack" style={{ gap: 12, marginTop: 12 }}>
            <div className="tbl">
              <table>
                <thead><tr><th /> {top.map((x) => <th key={x.r.id} style={{ color: x.r.color }}>{x.r.name.split(' ').slice(0, 2).join(' ')}</th>)}</tr></thead>
                <tbody>
                  {[
                    ['Time', (x) => `${x.r.min} min`], ['Distance', (x) => `${x.r.km} km`], ['Match', (x) => `${x.pct}%`],
                    ['Greenery', (x) => dots(x.r.green)], ['Quiet', (x) => dots(x.r.quiet)], ['Lively', (x) => dots(x.r.lively)],
                    ['Views', (x) => dots(x.r.views)], ['Well-lit', (x) => dots(x.r.light)], ['Hills', (x) => dots(x.r.elevation)],
                    ['Step-free', (x) => (x.r.stepFree ? 'Yes' : 'No')], ['Rating', (x) => `★ ${x.r.rating}`],
                    ['Confidence', (x) => <span className={`conf ${x.conf}`}>{CONF[x.conf]}<br /><small>{x.r.reviews} reviews</small></span>],
                  ].map(([l, f]) => <tr key={l}><td>{l}</td>{top.map((x) => <td key={x.r.id}>{f(x)}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
            <div className="note hfwrap">
              <HF k="calib" />
              <p><b>These are suggestions.</b> Confidence depends on how many walkers reviewed a route. Low-confidence routes may surprise you, and your review helps the next walker.</p>
            </div>
          </div>
        )}
      </div>
      <p className="small muted">Map data © OpenStreetMap contributors</p>
    </div>
  );
}

function Detail() {
  const { plan, patchPlan, dark, reviews, reports, confirms, settings, openSheet, startWalk, musicState } = useApp();
  const r = routeById(plan.route);
  const agg = aggregate(r, reviews);
  const hz = hazardsFor(r, reports, confirms).filter((h) => h.conf >= threshold(settings.sens));
  const night = isNight(settings.clock);
  const pl = playlistById(musicState.playlist);
  return (
    <div className="stack">
      <div className="row"><button type="button" className="iconbtn" onClick={() => patchPlan({ step: 'results' })} aria-label="Back to routes"><Icon.back /></button><span className="eyebrow">{r.type} · {r.ko}</span></div>
      <div className="stack" style={{ gap: 6 }}><h1>{r.name}</h1><p className="muted">{r.desc}</p></div>
      <div className="bigmap hfwrap">
        <HF k="frame" />
        <LMap routes={[r]} active={r.id} dark={dark} className="leaf" ariaLabel={`Map of ${r.name}, north up`} />
      </div>
      <p className="small muted">Starts at <b>{r.marks[0]}</b>{r.type === 'One way' ? <> · ends at <b>{r.marks[r.marks.length - 1]}</b></> : ' · returns to the start'}</p>
      <div className="facts">
        <div className="fact"><b>{r.min}</b><small>minutes</small></div>
        <div className="fact"><b>{r.km}</b><small>km</small></div>
        <div className="fact"><b>★ {r.rating}</b><small>{agg.n} reviews</small></div>
      </div>
      {plan.music && (
        <button type="button" className="card musicrow hfwrap" onClick={() => openSheet({ kind: 'music' })}>
          <HF k="mrt" />
          <span className={`disc${musicState.playing ? ' spin' : ''}`} aria-hidden="true" />
          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><span className="eyebrow">Music for this walk</span><b className="block">{pl.name}</b><span className="small muted">{pl.note}</span></span>
          <span className="iconbtn" aria-hidden="true"><Icon.music /></span>
        </button>
      )}
      <div className="hfwrap">
        <HF k="disclose" />
        <button type="button" className="btn ghost wide" aria-expanded={!!plan.reveal} onClick={() => patchPlan({ reveal: !plan.reveal })}>
          {plan.reveal ? 'Hide safety & reviews' : 'Show safety & reviews'} <Icon.chevron open={plan.reveal} />
        </button>
      </div>
      {plan.reveal && (
        <>
          <div className="card stack hfwrap" style={{ gap: 10 }}>
            <HF k="swiss" />
            <h3>Safety layers for this walk</h3>
            <div className="layers">
              <div className="layer"><span className={`dot${r.light >= 0.6 ? '' : ' off'}`}>{r.light >= 0.6 ? '✓' : '!'}</span><span>{r.light >= 0.6 ? 'Well-lit for most of the route' : `Some dark sections${night ? ' (it is after sunset)' : ''}`}</span></div>
              <div className="layer"><span className="dot">✓</span><span>{hz.length ? `${hz.length} recent report${hz.length > 1 ? 's' : ''}: ${hz[0].t}` : 'No recent hazard reports'}</span></div>
              <div className="layer"><span className="dot">✓</span><span>Eyes-up walk mode with vibration before turns</span></div>
              <div className="layer"><span className={`dot${plan.shared ? '' : ' off'}`}>{plan.shared ? '✓' : '+'}</span><span>{plan.shared ? 'ETA shared with someone' : 'Share your ETA with someone'}</span>
                {!plan.shared && <button type="button" className="linkbtn" style={{ marginLeft: 'auto' }} onClick={() => openSheet({ kind: 'share' })}>Share</button>}</div>
            </div>
          </div>
          <div className="card stack" style={{ gap: 10 }}>
            <h3>What walkers say</h3>
            {agg.list.slice(-3).reverse().map((rv, i) => (
              <div className="review" key={rv.id || i}>
                <div className="row small muted" style={{ gap: 6 }}><span>{rv.when}</span><span className={`pill${rv.sample ? ' sample' : ''}`}>{rv.sample ? 'Sample' : 'You'}</span></div>
                <p>{rv.text || '(no comment)'}</p>
              </div>
            ))}
            {!agg.list.length && <p className="small muted">No reviews yet.</p>}
          </div>
        </>
      )}
      <div className="sticky-cta"><button type="button" className="btn primary wide big" onClick={startWalk}>Start walk · {r.min} min</button></div>
    </div>
  );
}

export default function Plan() {
  const { plan } = useApp();
  if (plan.step === 'feel' && plan.goal) return <Feel />;
  if (plan.step === 'prefs' && plan.goal) return <Prefs />;
  if (plan.step === 'results' && plan.goal) return <Results />;
  if (plan.step === 'detail' && plan.route) return <Detail />;
  return <Goal />;
}
