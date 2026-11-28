import { useEffect, useState } from 'react';

/* All user data lives in this browser's localStorage under one prefix.
   GitHub Pages has no server, so there is no shared database. Settings → Export
   saves a backup file that can be imported on another device. */
const P = 'moodwalk:v1:';
export const KEYS = ['settings', 'plan', 'reviews', 'reports', 'confirms', 'tune', 'music', 'walk', 'ui'];

export function load(k, d) {
  try {
    const v = localStorage.getItem(P + k);
    return v == null ? d : JSON.parse(v);
  } catch {
    return d;
  }
}

export function save(k, v) {
  try {
    if (v === undefined || v === null) localStorage.removeItem(P + k);
    else localStorage.setItem(P + k, JSON.stringify(v));
  } catch { /* storage full or blocked */ }
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

export function usePersisted(k, init) {
  const [v, setV] = useState(() => {
    const d = typeof init === 'function' ? init() : init;
    const l = load(k, d);
    return isObj(d) && isObj(l) ? { ...d, ...l } : l;
  });
  useEffect(() => { save(k, v); }, [k, v]);
  return [v, setV];
}

export function exportAll() {
  const o = { app: 'MoodWalk', version: 1, exported: new Date().toISOString() };
  KEYS.forEach((k) => { o[k] = load(k, null); });
  return o;
}

export function importAll(o) {
  if (!o || o.app !== 'MoodWalk') throw new Error('This file is not a MoodWalk backup.');
  KEYS.forEach((k) => { if (o[k] != null) save(k, o[k]); });
}

export function eraseAll() {
  KEYS.forEach((k) => save(k, null));
}
