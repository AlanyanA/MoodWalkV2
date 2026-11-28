import { useState } from 'react';
import { useApp, HF, Face, Rate, Icon } from '../components/ui.jsx';
import LMap from '../components/LMap.jsx';
import { FEELS, goalById } from '../data/content.js';
import { routeById, ROUTES } from '../data/routes.js';

/* The rating questions. `bare` renders them without their own card and heading (used inside the fold). */
export function ReviewFields({ draft, set, idp = 'rv', bare = false }) {
  const fields = (
    <>
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
    </>
  );
  if (bare) return fields;
  return (
    <div className="card stack hfwrap" style={{ gap: 14 }}>
      <HF k="mapping" />
      <div><h3>Rate the place for other walkers</h3><p className="small muted">1 is low, 5 is high</p></div>
      {fields}
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
  const { plan, patchPost, saveReflection, skipReflection } = useApp();
  const [open, setOpen] = useState(false);
  const p = plan.post;
  const r = routeById(p.route);
  const answered = ['match', 'noise', 'green', 'safe', 'crowd'].filter((k) => p[k]).length + (p.text ? 1 : 0);
  return (
    <div className="stack">
      <p className="eyebrow">{p.arrived ? 'Walk finished' : 'Walk ended early'} · {p.min} min</p>
      <h1>How do you feel now?</h1>
      <div className="feels" role="radiogroup" aria-label="How you feel now">
        {[5, 4, 3, 2, 1].map((v) => (
          <button type="button" key={v} className="feel" role="radio" aria-checked={p.fa === v} aria-pressed={p.fa === v} onClick={() => patchPost({ fa: v })}>
            <Face v={v} size={40} /><span>{FEELS[v - 1]}</span>
          </button>
        ))}
      </div>

      <div className={`card fold hfwrap${open ? ' open' : ''}`}>
        <HF k="disclose" />
        <button type="button" className="foldbtn" aria-expanded={open} aria-controls="ratefold" onClick={() => setOpen(!open)}>
          <span className="foldtitle">
            <span className="row" style={{ gap: 8 }}><b>Rate the place for other walkers</b><span className="optpill">Optional</span></span>
            <span className="small muted">{answered ? `${answered} answered · tap to ${open ? 'close' : 'edit'}` : 'Helps others pick a route · about 30 seconds'}</span>
          </span>
          <Icon.chevron open={open} />
        </button>
        {open && (
          <div className="stack foldbody" id="ratefold" style={{ gap: 16 }}>
            <div className="hfwrap">
              <HF k="sem" />
              <p className="lbl">Did {r.name} match what you hoped for?</p>
              <div className="seg">
                {[['yes', 'Yes'], ['somewhat', 'Somewhat'], ['no', 'No']].map(([v, l]) => <button type="button" key={v} aria-pressed={p.match === v} onClick={() => patchPost({ match: v })}>{l}</button>)}
              </div>
            </div>
            <p className="small muted">For each: 1 is low, 5 is high.</p>
            <ReviewFields draft={p} set={patchPost} idp="rf" bare />
          </div>
        )}
      </div>

      <button type="button" className="btn primary wide" disabled={!p.fa} onClick={saveReflection}>Save</button>
      {!p.fa && <p className="small muted center">Choose how you feel to save.</p>}
      <button type="button" className="btn ghost wide" onClick={skipReflection}>Skip</button>
    </div>
  );
}

export function Postcard() {
  const { plan, patchPlan, dark } = useApp();
  const e = plan.lastWalk;
  if (!e) return null;
  const r = routeById(e.route);
  const d = e.fa - e.fb;
  return (
    <div className="stack">
      <p className="eyebrow">Walk saved</p>
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
      <button type="button" className="btn primary wide" onClick={() => patchPlan({ step: 'goal', goal: null, feel: null, shared: false })}>Plan another walk</button>
    </div>
  );
}
