import { createContext, useContext, useEffect, useRef } from 'react';
import { HF as NOTES } from '../data/content.js';

export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

/* Small yellow "HF" tag, shown only when design notes are on in Settings. */
export function HF({ k }) {
  const { settings, openSheet } = useApp();
  if (!settings.lens || !NOTES[k]) return null;
  return (
    <button type="button" className="hfb" aria-label={`Design note: ${NOTES[k].t}`}
      onClick={(e) => { e.stopPropagation(); openSheet({ kind: 'hf', k }); }}>HF</button>
  );
}

export function Face({ v, size = 40 }) {
  const my = 22 + (v - 3) * 4.6;
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} aria-hidden="true">
      <circle cx="18" cy="18" r="15.5" style={{ fill: `color-mix(in srgb, var(--mood) ${8 + v * 9}%, var(--surface))` }} stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="12.5" cy="14.5" r="1.9" fill="var(--ink)" />
      <circle cx="23.5" cy="14.5" r="1.9" fill="var(--ink)" />
      <path d={`M11 23Q18 ${my} 25 23`} fill="none" stroke="var(--ink)" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const Icon = {
  back: () => <svg viewBox="0 0 24 24" {...P} strokeWidth="2.4"><path d="M15 5l-7 7 7 7" /></svg>,
  close: () => <svg viewBox="0 0 24 24" {...P} strokeWidth="2.4"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  play: () => <svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>,
  pause: () => <svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>,
  next: () => <svg viewBox="0 0 24 24"><path d="M5 5l10 7-10 7zM17 5h2v14h-2z" fill="currentColor" /></svg>,
  prev: () => <svg viewBox="0 0 24 24"><path d="M19 5L9 12l10 7zM5 5h2v14H5z" fill="currentColor" /></svg>,
  music: () => <svg viewBox="0 0 24 24" {...P}><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>,
  compass: () => <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" /></svg>,
  trash: () => <svg viewBox="0 0 24 24" {...P}><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></svg>,
  moon: () => <svg viewBox="0 0 24 24" {...P}><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z" /></svg>,
  info: () => <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" /></svg>,
  chevron: ({ open }) => <svg viewBox="0 0 24 24" {...P} strokeWidth="2.4" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="m6 9 6 6 6-6" /></svg>,
};

export const GoalIcon = {
  calm: <svg viewBox="0 0 36 36" {...P} stroke="var(--mc)" strokeWidth="2.6"><path d="M4 14c4-4 8 4 12 0s8-4 12 0 4 0 4 0" /><path d="M4 22c4-4 8 4 12 0s8-4 12 0 4 0 4 0" opacity=".55" /></svg>,
  clear: <svg viewBox="0 0 36 36" {...P} stroke="var(--mc)" strokeWidth="2.6"><circle cx="18" cy="18" r="6" /><path d="M18 4v4M18 28v4M4 18h4M28 18h4M8 8l3 3M25 25l3 3M8 28l3-3M25 11l3-3" /></svg>,
  energize: <svg viewBox="0 0 36 36"><path d="M20 3 8 20h9l-2 13 13-18h-9z" fill="var(--mc)" /></svg>,
  explore: <svg viewBox="0 0 36 36" {...P} stroke="var(--mc)" strokeWidth="2.6"><circle cx="18" cy="18" r="13" /><path d="m23 13-3 7-7 3 3-7z" fill="var(--mc)" /></svg>,
  connected: <svg viewBox="0 0 36 36" {...P} stroke="var(--mc)" strokeWidth="2.6"><circle cx="13" cy="13" r="5" /><circle cx="25" cy="15" r="4" /><path d="M4 30c1-6 5-9 9-9s8 3 9 9M23 23c4 0 8 2 9 7" /></svg>,
  active: <svg viewBox="0 0 36 36" {...P} stroke="var(--mc)" strokeWidth="2.6"><path d="M18 31S5 23 5 13.5A6.5 6.5 0 0 1 18 10a6.5 6.5 0 0 1 13 3.5C31 23 18 31 18 31z" /><path d="M8 18h6l2-4 3 8 2-4h7" /></svg>,
};

export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, l]) => (
        <button type="button" key={v} role="radio" aria-checked={value === v} aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children }) {
  return <button type="button" className="chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Rate({ value, onChange, low, high, label, id }) {
  return (
    <div>
      <p className="lbl" id={id}>{label}</p>
      <div className="rate" role="radiogroup" aria-labelledby={id}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button type="button" key={v} role="radio" aria-checked={value === v} aria-pressed={value === v} onClick={() => onChange(v)}>{v}</button>
        ))}
      </div>
      <div className="scale"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export function Sheet({ title, onClose, children, big }) {
  const ref = useRef();
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    ref.current?.querySelector('button, input, select, textarea')?.focus();
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={`sheet${big ? ' big' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="grab" />
        <div className="sheethead"><h2>{title}</h2><button type="button" className="iconbtn" onClick={onClose} aria-label="Close"><Icon.close /></button></div>
        {children}
      </div>
    </>
  );
}

export function Modal({ title, children }) {
  return (
    <>
      <div className="scrim" />
      <div className="modal" role="alertdialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </>
  );
}

export function buzz(p) {
  try { navigator.vibrate?.(p); } catch { /* not supported */ }
}
