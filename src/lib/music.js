/* Generative music made in the browser with the Web Audio API.
   Every track is a recipe (tempo, scale, sound) played by a seeded random melody,
   so the same track always sounds the same. No audio files or streaming needed. */

const SCALES = {
  majp: [0, 2, 4, 7, 9],
  minp: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
};

const T = (t, bpm, root, scale, extra = {}) => ({ t, bpm, root, scale, lead: 'triangle', density: 0.6, pad: true, bass: false, kick: false, hat: false, ...extra });

export const PLAYLISTS = [
  { id: 'calm', name: 'Still Water', note: 'Slow ambient pads for lowering stress', tracks: [
    T('Morning Mist', 60, 57, 'majp', { lead: 'sine', density: 0.35 }),
    T('Willow Shade', 56, 55, 'lydian', { lead: 'sine', density: 0.3 }),
    T('Slow Current', 64, 52, 'majp', { lead: 'sine', density: 0.4, bass: true }),
    T('Paper Lanterns', 58, 60, 'dorian', { lead: 'sine', density: 0.3 }),
  ] },
  { id: 'clear', name: 'Open Sky', note: 'Sparse piano-like tones, space to think', tracks: [
    T('Blank Page', 76, 60, 'major', { density: 0.45 }),
    T('High Ridge', 72, 62, 'lydian', { density: 0.4 }),
    T('Long Horizon', 80, 57, 'majp', { density: 0.5, bass: true }),
    T('Quiet Desk', 70, 59, 'dorian', { density: 0.4 }),
  ] },
  { id: 'energize', name: 'Stride', note: 'Upbeat, around brisk walking cadence', tracks: [
    T('Uphill', 122, 62, 'minp', { lead: 'square', density: 0.75, kick: true, hat: true, bass: true, pad: false }),
    T('Stair Runner', 126, 57, 'dorian', { lead: 'sawtooth', density: 0.7, kick: true, hat: true, bass: true, pad: false }),
    T('Green Light', 118, 60, 'majp', { lead: 'square', density: 0.8, kick: true, hat: true, bass: true }),
    T('Ridge Line', 124, 64, 'minp', { lead: 'square', density: 0.7, kick: true, hat: true, bass: true, pad: false }),
  ] },
  { id: 'explore', name: 'Side Streets', note: 'Curious lo-fi for wandering', tracks: [
    T('Back Alley', 92, 59, 'dorian', { density: 0.55, kick: true, bass: true }),
    T('Hidden Temple', 88, 62, 'minp', { density: 0.5, kick: true }),
    T('Corner Shop', 96, 57, 'lydian', { density: 0.6, kick: true, hat: true, bass: true }),
    T('Wrong Turn', 100, 60, 'dorian', { density: 0.55, kick: true, hat: true }),
  ] },
  { id: 'connected', name: 'Corner Café', note: 'Warm groove for busy streets', tracks: [
    T('Night Market', 108, 60, 'majp', { density: 0.65, kick: true, hat: true, bass: true }),
    T('Neon Signs', 112, 57, 'dorian', { lead: 'square', density: 0.6, kick: true, hat: true, bass: true }),
    T('Dessert Street', 104, 64, 'major', { density: 0.6, kick: true, bass: true }),
    T('Station Crowd', 110, 62, 'minp', { density: 0.7, kick: true, hat: true, bass: true }),
  ] },
  { id: 'active', name: 'Steady Steps', note: 'Even tempo for a long, healthy walk', tracks: [
    T('Daily Habit', 112, 60, 'majp', { density: 0.6, kick: true, bass: true }),
    T('Long Loop', 116, 57, 'major', { density: 0.6, kick: true, hat: true, bass: true }),
    T('Ten Thousand', 114, 62, 'lydian', { density: 0.55, kick: true, bass: true }),
    T('Second Wind', 120, 59, 'dorian', { lead: 'square', density: 0.65, kick: true, hat: true, bass: true }),
  ] },
  { id: 'nature', name: 'Just Nature', note: 'Very soft, mostly silence', tracks: [
    T('Stream Bed', 50, 52, 'majp', { lead: 'sine', density: 0.2 }),
    T('Pine Needles', 54, 57, 'lydian', { lead: 'sine', density: 0.2 }),
  ] },
];
export const playlistById = (id) => PLAYLISTS.find((p) => p.id === id) || PLAYLISTS[0];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const freq = (m) => 440 * 2 ** ((m - 69) / 12);

class Engine {
  constructor() {
    this.state = { playing: false, playlist: 'calm', track: 0, volume: 0.6, started: 0 };
    this.subs = new Set();
  }
  subscribe = (f) => { this.subs.add(f); return () => this.subs.delete(f); };
  get = () => this.state;
  set(p) { this.state = { ...this.state, ...p }; this.subs.forEach((f) => f()); }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.05;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    this.ctx.resume?.();
    this.master.gain.value = 0.18 * this.state.volume;
    return true;
  }

  load(playlist, track) { this.set({ playlist, track }); }

  play(playlist = this.state.playlist, track = this.state.track) {
    if (!this.ensure()) return;
    this.stopVoices();
    const tr = playlistById(playlist).tracks[track];
    const c = this.ctx;
    const out = c.createGain();
    out.gain.value = 1;
    out.connect(this.master);
    this.out = out;
    const r = rng(hash(tr.t));
    const sc = SCALES[tr.scale];
    const step = 60 / tr.bpm / 2;
    const notes = [];
    for (let o = 0; o < 2; o++) sc.forEach((x) => notes.push(tr.root + x + o * 12));
    let n = 0;
    let idx = 3;
    let next = c.currentTime + 0.05;
    const voice = (m, t, len, type, vol) => {
      const o = c.createOscillator();
      const e = c.createGain();
      o.type = type;
      o.frequency.value = freq(m);
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(vol, t + Math.min(0.04, len / 4));
      e.gain.exponentialRampToValueAtTime(0.001, t + len);
      o.connect(e); e.connect(out);
      o.start(t); o.stop(t + len + 0.05);
    };
    const kick = (t) => {
      const o = c.createOscillator();
      const e = c.createGain();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      e.gain.setValueAtTime(0.9, t);
      e.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(e); e.connect(out); o.start(t); o.stop(t + 0.25);
    };
    const hat = (t) => {
      const s = c.createBufferSource();
      const f = c.createBiquadFilter();
      const e = c.createGain();
      s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 7000;
      e.gain.setValueAtTime(0.25, t); e.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      s.connect(f); f.connect(e); e.connect(out); s.start(t);
    };
    const leadVol = tr.lead === 'sine' ? 0.22 : tr.lead === 'triangle' ? 0.18 : 0.06;
    this.timer = setInterval(() => {
      while (next < c.currentTime + 0.25) {
        const bar = n % 16;
        if (tr.pad && bar === 0) {
          const chordRoot = [0, 3, 4, 2][Math.floor(n / 16) % 4];
          [0, 2, 4].forEach((k) => voice(notes[(chordRoot + k) % sc.length] - 12, next, step * 16, 'sine', 0.12));
        }
        if (tr.bass && (bar === 0 || bar === 8 || (bar === 11 && r() < 0.5))) voice(notes[[0, 3, 4, 2][Math.floor(n / 16) % 4]] - 24, next, step * 3, 'triangle', 0.3);
        if (r() < tr.density) {
          idx = Math.max(0, Math.min(notes.length - 1, idx + Math.round((r() - 0.5) * 4)));
          voice(notes[idx], next, step * (tr.bpm < 70 ? 5 : 1.8), tr.lead, leadVol);
        }
        if (tr.kick && n % 2 === 0 && (tr.bpm > 100 || n % 4 === 0)) kick(next);
        if (tr.hat && n % 2 === 1) hat(next);
        next += step;
        n++;
      }
    }, 50);
    this.set({ playing: true, playlist, track, started: Date.now() });
  }

  stopVoices() {
    clearInterval(this.timer);
    if (this.out) {
      const o = this.out;
      try { o.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08); } catch { /* ignore */ }
      setTimeout(() => o.disconnect(), 600);
      this.out = null;
    }
  }

  stop() { this.stopVoices(); this.set({ playing: false }); }
  toggle() { this.state.playing ? this.stop() : this.play(); }
  skip(d) {
    const pl = playlistById(this.state.playlist);
    const t = (this.state.track + d + pl.tracks.length) % pl.tracks.length;
    if (this.state.playing) this.play(this.state.playlist, t); else this.set({ track: t });
  }
  volume(v) {
    this.set({ volume: v });
    if (this.master) this.master.gain.value = 0.18 * v;
  }
}

export const music = new Engine();
