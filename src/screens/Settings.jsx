import { useRef, useState } from 'react';
import { useApp, HF, Seg } from '../components/ui.jsx';
import { REASON } from '../data/content.js';
import { exportAll, importAll, eraseAll } from '../lib/store.js';
import { threshold } from '../lib/score.js';

const TUNE = ['green', 'quiet', 'lively', 'views', 'novelty', 'elevation'];
const tuneLabel = (v) => (v === 0 ? 'Ignore' : v < 1 ? 'Less' : v === 1 ? 'Normal' : v < 2 ? 'More' : 'A lot');

export default function Settings() {
  const { settings, patchSettings, tune, setTune, toast, journal, reviews, reports } = useApp();
  const [confirmErase, setConfirmErase] = useState(false);
  const file = useRef();
  const s = settings;

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `moodwalk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup saved to your downloads');
  };
  const doImport = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then((t) => { importAll(JSON.parse(t)); location.reload(); }).catch((err) => toast(err.message || 'That file could not be read.'));
  };

  return (
    <div className="stack">
      <div><p className="eyebrow">Settings</p><h1>Make MoodWalk yours</h1></div>

      <section className="card stack" style={{ gap: 16 }}>
        <h2>Display</h2>
        <div className="hfwrap"><HF k="aging" /><p className="lbl">Text size</p><Seg label="Text size" value={s.text} onChange={(v) => patchSettings({ text: v })} options={[['m', 'A'], ['l', 'A+'], ['xl', 'A++']]} /></div>
        <div><p className="lbl">Contrast</p><Seg label="Contrast" value={s.contrast} onChange={(v) => patchSettings({ contrast: v })} options={[['normal', 'Standard'], ['high', 'High']]} /></div>
        <div><p className="lbl">Theme</p><Seg label="Theme" value={s.theme} onChange={(v) => patchSettings({ theme: v })} options={[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']]} /></div>
        <div><p className="lbl">Motion</p><Seg label="Motion" value={s.motion} onChange={(v) => patchSettings({ motion: v })} options={[['auto', 'Normal'], ['reduce', 'Reduced']]} /></div>
      </section>

      <section className="card stack" style={{ gap: 16 }}>
        <h2>Walking</h2>
        <div className="hfwrap"><HF k="offload" /><p className="lbl">Directions</p><Seg label="Directions" value={s.guide} onChange={(v) => patchSettings({ guide: v })} options={[['turn', 'Turn-by-turn'], ['landmark', 'Landmarks only']]} />
          <p className="small muted" style={{ marginTop: 6 }}>Landmarks only gives fewer prompts and helps you learn the area yourself.</p></div>
        <div><p className="lbl">Map while walking</p>
          <select id="orient" value={s.orient} onChange={(e) => patchSettings({ orient: e.target.value })}>
            <option value="track">Track-up (turns with me)</option><option value="north">North up</option><option value="east">East up</option><option value="south">South up</option><option value="west">West up</option>
          </select></div>
        <div><p className="lbl">Follow my walk with</p><Seg label="Tracking" value={s.tracking} onChange={(v) => patchSettings({ tracking: v })} options={[['demo', 'Demo (simulated)'], ['gps', 'Phone GPS']]} />
          <p className="small muted" style={{ marginTop: 6 }}>Phone GPS works when you are actually on a route in Gwanak-gu.</p></div>
        <div className="hfwrap"><HF k="sdt" /><label className="lbl" htmlFor="sens">Hazard alerts</label>
          <input id="sens" type="range" min="0" max="1" step="0.01" value={s.sens} onChange={(e) => patchSettings({ sens: +e.target.value })} />
          <div className="scale"><span>Only confirmed</span><span>Everything reported</span></div>
          <p className="small muted">Shows reports with at least {Math.round(threshold(s.sens) * 100)}% confidence. {s.sens > 0.75 ? 'Expect some false alarms.' : s.sens < 0.25 ? 'You may miss new, unconfirmed hazards.' : 'A balance between catching hazards and false alarms.'}</p></div>
        <div><p className="lbl">Time of day</p><Seg label="Time of day" value={s.clock} onChange={(v) => patchSettings({ clock: v })} options={[['auto', 'Real time'], ['day', 'Day'], ['night', 'Night']]} />
          <p className="small muted" style={{ marginTop: 6 }}>At night MoodWalk prefers well-lit routes.</p></div>
      </section>

      <section className="card stack hfwrap" style={{ gap: 14 }}>
        <HF k="hcai" />
        <div><h2>What matters in recommendations</h2><p className="small muted">The app suggests, you stay in charge.</p></div>
        {TUNE.map((k) => (
          <div key={k}>
            <div className="row" style={{ justifyContent: 'space-between' }}><label className="lbl" htmlFor={`tn-${k}`} style={{ margin: 0 }}>{REASON[k]}</label><span className="small muted">{tuneLabel(tune[k] ?? 1)}</span></div>
            <input id={`tn-${k}`} type="range" min="0" max="2" step="0.25" value={tune[k] ?? 1} onChange={(e) => setTune({ ...tune, [k]: +e.target.value })} />
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setTune({})}>Reset to normal</button>
      </section>

      <section className="card stack" style={{ gap: 12 }}>
        <h2>Your data</h2>
        <p className="small">Everything is saved on this device: {journal.length} journal entr{journal.length === 1 ? 'y' : 'ies'}, {reviews.length} review{reviews.length === 1 ? '' : 's'}, {reports.length} report{reports.length === 1 ? '' : 's'}, your settings and any walk in progress. Nothing is sent to a server.</p>
        <button type="button" className="btn ghost" onClick={doExport}>Export backup file</button>
        <button type="button" className="btn ghost" onClick={() => file.current.click()}>Import backup file</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={doImport} />
        <button type="button" className="btn ghost dangertext" onClick={() => { if (!confirmErase) { setConfirmErase(true); setTimeout(() => setConfirmErase(false), 4000); return; } eraseAll(); location.reload(); }}>
          {confirmErase ? 'Tap again to erase everything' : 'Erase all my data'}
        </button>
      </section>

      <section className="card stack" style={{ gap: 12 }}>
        <h2>For the presentation</h2>
        <div className="row"><div style={{ flex: 1, minWidth: 0 }}><p className="lbl" style={{ margin: 0 }}>Show design notes</p><p className="small muted">Yellow "HF" tags explain which human factors principle shaped each part.</p></div>
          <div className="seg" style={{ width: 120 }}><button type="button" aria-pressed={s.lens} onClick={() => patchSettings({ lens: true })}>On</button><button type="button" aria-pressed={!s.lens} onClick={() => patchSettings({ lens: false })}>Off</button></div></div>
      </section>

      <p className="small muted">MoodWalk prototype · Human Factors & Engineering Psychology group project. Map and walking paths © OpenStreetMap contributors (routes calculated with OSRM). Routes and reviews are illustrative.</p>
    </div>
  );
}
