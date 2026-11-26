import { useApp, HF, Face, Icon } from '../components/ui.jsx';
import { FEELS, goalById } from '../data/content.js';
import { routeById, SAMPLE_JOURNAL } from '../data/routes.js';

export default function Journal() {
  const { journal, setJournal, toast, patchPlan, setTab } = useApp();
  const J = [...journal].sort((a, b) => (a.date < b.date ? -1 : 1));
  const plan = () => { patchPlan({ step: 'goal', goal: null, feel: null }); setTab('walk'); };

  if (!J.length) {
    return (
      <div className="stack">
        <div><p className="eyebrow">Your walking journal</p><h1>No walks yet</h1></div>
        <div className="card stack" style={{ gap: 10 }}>
          <p>After each walk you'll rate how you feel. Your journal shows how walking changes your mood over time, and which kinds of walks work best for you.</p>
          <button type="button" className="btn primary" onClick={plan}>Plan my first walk</button>
          <button type="button" className="btn ghost" onClick={() => setJournal(SAMPLE_JOURNAL)}>Show example walks</button>
        </div>
      </div>
    );
  }

  const lift = J.reduce((a, j) => a + (j.fa - j.fb), 0) / J.length;
  const byGoal = {};
  J.forEach((j) => { (byGoal[j.goal] = byGoal[j.goal] || []).push(j.fa - j.fb); });
  const best = Object.entries(byGoal).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]).sort((a, b) => b[1] - a[1])[0];
  const minutes = J.reduce((a, j) => a + j.min, 0);
  const W = 330;
  const H = 40 + J.length * 34;
  const x = (v) => 120 + (v - 1) * 50;

  const remove = (id) => {
    const old = journal;
    setJournal(journal.filter((j) => j.id !== id));
    toast('Entry deleted', () => setJournal(old));
  };

  return (
    <div className="stack">
      <div><p className="eyebrow">Your walking journal</p><h1>Walking lifts your mood by <span className="accent">{lift > 0 ? '+' : ''}{lift.toFixed(1)}</span> on average</h1></div>
      {J.some((j) => j.example) && (
        <div className="banner"><Icon.info /><span>Showing example walks. <button type="button" className="linkbtn inline" onClick={() => { const old = journal; setJournal(journal.filter((j) => !j.example)); toast('Examples removed', () => setJournal(old)); }}>Remove examples</button></span></div>
      )}
      <div className="facts">
        <div className="fact"><b>{J.length}</b><small>walks</small></div>
        <div className="fact"><b>{minutes}</b><small>minutes</small></div>
        <div className="fact"><b>{J.filter((j) => j.match === 'yes').length}</b><small>matched</small></div>
      </div>
      <div className="card hfwrap">
        <HF k="reflective" />
        <h3>Before → after each walk</h3>
        <p className="small muted" style={{ marginBottom: 8 }}>Hollow dot: before. Filled dot: after.</p>
        <div className="tbl">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 300 }} role="img" aria-label="Mood before and after each walk">
            {[1, 2, 3, 4, 5].map((v) => (
              <g key={v}>
                <line x1={x(v)} y1="18" x2={x(v)} y2={H - 8} stroke="var(--line)" />
                <text x={x(v)} y="12" textAnchor="middle" fontSize="9.5" fill="var(--muted)">{FEELS[v - 1]}</text>
              </g>
            ))}
            {J.map((j, i) => {
              const y = 36 + i * 34;
              return (
                <g key={j.id}>
                  <text x="0" y={y + 4} fontSize="11" fill="var(--ink)">{routeById(j.route).name.split(' ').slice(0, 2).join(' ')}</text>
                  <line x1={x(j.fb)} y1={y} x2={x(j.fa)} y2={y} stroke="var(--mood)" strokeWidth="4" strokeLinecap="round" />
                  <circle cx={x(j.fb)} cy={y} r="6" fill="var(--surface)" stroke="var(--muted)" strokeWidth="2" />
                  <circle cx={x(j.fa)} cy={y} r="6" fill="var(--mood)" />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {best && <div className="card"><p className="eyebrow">What works for you</p><p style={{ marginTop: 4 }}><b>{goalById(best[0]).label}</b> walks give you the biggest lift ({best[1] > 0 ? '+' : ''}{best[1].toFixed(1)}). MoodWalk uses your ratings to rank routes for you.</p></div>}
      <div className="stack" style={{ gap: 10 }}>
        {[...J].reverse().map((j) => (
          <div className="card row" style={{ gap: 12 }} key={j.id}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="eyebrow">{j.date} · {j.min} min{j.example ? ' · example' : ''}</p>
              <h3>{routeById(j.route).name}</h3>
              <p className="small muted">{goalById(j.goal).label} · matched: {j.match}</p>
            </div>
            <div className="row" style={{ gap: 2 }}><Face v={j.fb} size={30} /><span className="small">→</span><Face v={j.fa} size={30} /></div>
            <button type="button" className="iconbtn" onClick={() => remove(j.id)} aria-label={`Delete ${routeById(j.route).name} entry`}><Icon.trash /></button>
          </div>
        ))}
      </div>
      <button type="button" className="btn primary wide" onClick={plan}>Plan a walk</button>
    </div>
  );
}
