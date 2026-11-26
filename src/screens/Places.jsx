import { useState } from 'react';
import { useApp, HF, Chip } from '../components/ui.jsx';
import LMap from '../components/LMap.jsx';
import { ROUTES } from '../data/routes.js';
import { aggregate, hazardsFor } from '../lib/score.js';

const FILTERS = [['quiet', 'Quiet'], ['green', 'Green'], ['lively', 'Lively'], ['light', 'Well-lit'], ['views', 'Views']];

export default function Places() {
  const { dark, reviews, reports, confirms, openSheet, ui, setUi, deleteReview } = useApp();
  const [filter, setFilter] = useState(null);
  const open = ui.openPlace;
  const list = filter ? [...ROUTES].sort((a, b) => b[filter] - a[filter]) : ROUTES;
  return (
    <div className="stack">
      <div><p className="eyebrow">Gwanak-gu, Seoul</p><h1>Places, rated by walkers</h1></div>
      <div className="bigmap tall">
        <LMap routes={ROUTES} active={open || null} dark={dark} className="leaf" onSelect={(id) => setUi({ ...ui, openPlace: id })} ariaLabel="All routes in Gwanak-gu" />
      </div>
      <div className="chips" role="group" aria-label="Sort places by">
        {FILTERS.map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(filter === k ? null : k)}>{l}</Chip>)}
      </div>
      <div className="row">
        <button type="button" className="btn primary" style={{ flex: 1 }} onClick={() => openSheet({ kind: 'review' })}>Review a place</button>
        <div className="hfwrap" style={{ flex: 1 }}><HF k="justculture" /><button type="button" className="btn ghost wide" onClick={() => openSheet({ kind: 'report' })}>Report a hazard</button></div>
      </div>
      {list.map((r) => {
        const g = aggregate(r, reviews);
        const hz = hazardsFor(r, reports, confirms).sort((a, b) => b.conf - a.conf);
        const isOpen = open === r.id;
        return (
          <div className="card stack" style={{ gap: 8 }} key={r.id}>
            <button type="button" className="placehead" aria-expanded={isOpen} onClick={() => setUi({ ...ui, openPlace: isOpen ? null : r.id })}>
              <svg width="34" height="10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" stroke={r.color} strokeWidth="4" strokeDasharray={r.dash} strokeLinecap="round" /></svg>
              <span style={{ flex: 1, minWidth: 0 }}><b className="block">{r.name}</b><span className="small muted">{r.ko} · {r.min} min · {r.km} km</span></span>
              <span className="small muted">{g.n} reviews {isOpen ? '▴' : '▾'}</span>
            </button>
            <div className="row" style={{ gap: 6 }}>
              {[['Quiet', 6 - g.a.noise], ['Green', g.a.green], ['Feels safe', g.a.safe], ['Crowds', g.a.crowd]].map(([l, v]) => <span key={l} className="pill">{l} {v.toFixed(1)}</span>)}
            </div>
            {hz.length > 0 && <p className="small">⚠ {hz[0].t} <span className="muted">· {hz[0].age} · {hz[0].ok} confirmed</span></p>}
            {isOpen && g.list.slice().reverse().map((rv, i) => (
              <div className="review" key={rv.id || `s${i}`}>
                <div className="row small muted" style={{ gap: 6 }}>
                  <span>{rv.when}</span><span className={`pill${rv.sample ? ' sample' : ''}`}>{rv.sample ? 'Sample' : 'You'}</span>
                  <span>noise {rv.noise} · green {rv.green} · safe {rv.safe}</span>
                </div>
                <p>{rv.text || '(no comment)'}</p>
                {!rv.sample && <button type="button" className="linkbtn" onClick={() => deleteReview(rv.id)}>Delete my review</button>}
              </div>
            ))}
          </div>
        );
      })}
      <p className="small muted">Reviews marked "Sample" are example data for this prototype. Walking paths from OpenStreetMap.</p>
    </div>
  );
}
