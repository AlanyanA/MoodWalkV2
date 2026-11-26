import { useApp, HF, Face, Rate } from '../components/ui.jsx';
import LMap from '../components/LMap.jsx';
import { FEELS, goalById } from '../data/content.js';
import { routeById, ROUTES } from '../data/routes.js';

export function ReviewFields({ draft, set, idp = 'rv' }) {
  return (
    <div className="card stack hfwrap" style={{ gap: 14 }}>
      <HF k="mapping" />
      <div><h3>Rate the place for other walkers</h3><p className="small muted">Optional · 1 is low, 5 is high</p></div>
      <Rate id={`${idp}-noise`} label="Noise" low="Silent" high="Loud" value={draft.noise} onChange={(v) => set({ noise: v })} />
      <Rate id={`${idp}-green`} label="Greenery" low="None" high="Lush" value={draft.green} onChange={(v) => set({ green: v })} />
      <Rate id={`${idp}-safe`} label="Felt safe" low="Not at all" high="Very" value={draft.safe} onChange={(v) => set({ safe: v })} />
      <Rate id={`${idp}-crowd`} label="Crowding" low="Empty" high="Packed" value={draft.crowd} onChange={(v) => set({ crowd: v })} />
      <div className="optional hfwrap">
        <HF k="equity" />
        <label className="lbl" htmlFor={`${idp}-text`}>Anything others should know? <span className="optpill">Optional</span></label>
        <textarea id={`${idp}-text`} rows={3} placeholder="You can skip this. e.g. The stream path is muddy after rain" value={draft.text || ''} onChange={(e) => set({ text: e.target.value })} />
        <p className="small muted">Describe the place (lighting, paths, noise), not the people you saw.</p>
      </div>
    </div>
  );
}

export function PlaceSelect({ value, onChange }) {
  return (
    <select id="place" value={value} onChange={(e) => onChange(e.target.value)}>
      {ROUTES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
  );
}

export function Reflect() {
  const { plan, patchPlan, patchPost, saveReflection } = useApp();
  const p = plan.post;
  const r = routeById(p.route);
  const set = patchPost;
  const ready = p.fa && p.match;
  return (
    <div className="stack">
      <p className="eyebrow">{p.arrived ? 'Walk finished' : 'Walk ended early'} · {p.min} min</p>
      <h1>How do you feel now?</h1>
      <div className="feels" role="radiogroup" aria-label="How you feel now">
        {[5, 4, 3, 2, 1].map((v) => (
          <button type="button" key={v} className="feel" role="radio" aria-checked={p.fa === v} aria-pressed={p.fa === v} onClick={() => set({ fa: v })}>
            <Face v={v} size={40} /><span>{FEELS[v - 1]}</span>
          </button>
        ))}
      </div>
      <div className="card hfwrap">
        <HF k="sem" />
        <h3>Did {r.name} match what you hoped for?</h3>
        <div className="seg" style={{ marginTop: 10 }}>
          {[['yes', 'Yes'], ['somewhat', 'Somewhat'], ['no', 'No']].map(([v, l]) => <button type="button" key={v} aria-pressed={p.match === v} onClick={() => set({ match: v })}>{l}</button>)}
        </div>
      </div>
      <ReviewFields draft={p} set={set} />
      <button type="button" className="btn primary wide" disabled={!ready} onClick={saveReflection}>Save & see my postcard</button>
      {!ready && <p className="small muted center">Choose how you feel and whether it matched to save.</p>}
      <button type="button" className="btn ghost wide" onClick={() => patchPlan({ step: 'goal', post: null })}>Skip</button>
    </div>
  );
}

export function Postcard() {
  const { plan, journal, patchPlan, setTab, dark } = useApp();
  const e = journal.find((j) => j.id === plan.lastEntry);
  if (!e) return null;
  const r = routeById(e.route);
  const d = e.fa - e.fb;
  return (
    <div className="stack">
      <p className="eyebrow">Saved to your journal</p>
      <h1>{d > 0 ? 'Nice walk.' : d === 0 ? 'You showed up. That counts.' : 'Thanks for being honest.'}</h1>
      <div className="postcard hfwrap">
        <HF k="reflective" />
        <div className="pc-top"><p className="eyebrow">{new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} · {goalById(e.goal).label}</p><h2>{r.name}</h2><p className="small muted">{r.ko} · Gwanak-gu, Seoul</p></div>
        <LMap routes={[r]} active={r.id} dark={dark} interactive={false} attribution={false} className="pcmap" padding={16} ariaLabel={`Map of ${r.name}`} />
        <div className="pc-body">
          <div className="row" style={{ gap: 6 }}><Face v={e.fb} size={44} /><span className="arrowtxt">→</span><Face v={e.fa} size={44} /></div>
          <div><p className="delta">{d > 0 ? '+' : ''}{d}</p><p className="small muted">mood change</p></div>
          <div><p className="delta">{e.min}</p><p className="small muted">minutes</p></div>
        </div>
      </div>
      <button type="button" className="btn primary wide" onClick={() => { patchPlan({ step: 'goal' }); setTab('journal'); }}>Open my journal</button>
      <button type="button" className="btn ghost wide" onClick={() => patchPlan({ step: 'goal', goal: null, feel: null, shared: false })}>Plan another walk</button>
    </div>
  );
}
