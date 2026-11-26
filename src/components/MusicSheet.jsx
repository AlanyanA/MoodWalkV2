import { useEffect, useState } from 'react';
import { useApp, Sheet, Icon } from './ui.jsx';
import { PLAYLISTS, playlistById, music } from '../lib/music.js';
import { goalById } from '../data/content.js';

function Elapsed({ since, on }) {
  const [, tick] = useState(0);
  useEffect(() => { if (!on) return undefined; const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, [on]);
  const s = on ? Math.floor((Date.now() - since) / 1000) : 0;
  return <span>{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>;
}

export default function MusicSheet({ onClose }) {
  const { musicState: m, plan } = useApp();
  const pl = playlistById(m.playlist);
  const tr = pl.tracks[m.track] || pl.tracks[0];
  const rec = goalById(plan.goal).playlist;
  return (
    <Sheet title="Music" onClose={onClose} big>
      <div className="stack" style={{ gap: 18 }}>
        <div className="nowplaying">
          <span className={`disc large${m.playing ? ' spin' : ''}`} aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow">{m.playing ? 'Now playing' : 'Ready'} · {pl.name}</p>
            <h2>{tr.t}</h2>
            <p className="small muted">{tr.bpm} beats per minute · <Elapsed since={m.started} on={m.playing} /></p>
          </div>
        </div>
        <div className="transport">
          <button type="button" className="iconbtn lg" onClick={() => music.skip(-1)} aria-label="Previous track"><Icon.prev /></button>
          <button type="button" className="iconbtn xl primary" onClick={() => music.toggle()} aria-label={m.playing ? 'Pause' : 'Play'}>{m.playing ? <Icon.pause /> : <Icon.play />}</button>
          <button type="button" className="iconbtn lg" onClick={() => music.skip(1)} aria-label="Next track"><Icon.next /></button>
        </div>
        <div>
          <label className="lbl" htmlFor="vol">Volume</label>
          <input id="vol" type="range" min="0" max="1" step="0.05" value={m.volume} onChange={(e) => music.volume(+e.target.value)} />
          <p className="small muted">Keep it low enough to hear traffic and bicycles.</p>
        </div>
        <div>
          <p className="lbl">Playlists</p>
          <div className="playlists">
            {PLAYLISTS.map((p) => (
              <button type="button" key={p.id} className="plcard" aria-pressed={m.playlist === p.id} onClick={() => (m.playing ? music.play(p.id, 0) : music.load(p.id, 0))}>
                <b>{p.name}</b><small>{p.note}</small>
                {p.id === rec && <span className="pill">For your goal</span>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="lbl">Tracks in {pl.name}</p>
          <ol className="tracks">
            {pl.tracks.map((t, i) => (
              <li key={t.t}>
                <button type="button" aria-current={i === m.track ? 'true' : undefined} onClick={() => music.play(pl.id, i)}>
                  <span className="tn">{i === m.track && m.playing ? '♪' : i + 1}</span>
                  <span style={{ flex: 1 }}>{t.t}</span>
                  <span className="small muted">{t.bpm} bpm</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="small muted">Music is generated live on your phone, so it needs no internet connection.</p>
        </div>
      </div>
    </Sheet>
  );
}
