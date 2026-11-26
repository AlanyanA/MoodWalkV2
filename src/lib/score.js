import { ROUTES, SAMPLE_REVIEWS } from '../data/routes.js';
import { goalById, timeById } from '../data/content.js';

export function scoreRoute(r, plan, tune, journal) {
  const g = goalById(plan.goal);
  let s = 0;
  let ws = 0;
  for (const k in g.w) {
    const w = g.w[k] * (tune[k] ?? 1);
    const v = w >= 0 ? r[k] : 1 - r[k];
    s += Math.abs(w) * v;
    ws += Math.abs(w);
  }
  const base = ws ? s / ws : 0.5;
  let boost = 0;
  const warn = [];
  plan.prefs.forEach((p) => { boost += 0.1 * (r[p] - 0.5) * 2; });
  if (plan.access.includes('stepfree') && !r.stepFree) { boost -= 0.35; warn.push('Has steps'); }
  if (plan.access.includes('lit') && r.light < 0.6) { boost -= 0.3; warn.push('Dark sections'); }
  if (plan.access.includes('nocrowd') && r.crowd > 0.6) { boost -= 0.25; warn.push('Often crowded'); }
  const t = timeById(plan.time);
  if (r.min > t.max + 5 || r.min < t.min - 3) { boost -= 0.35; warn.push(`About ${r.min} min`); }
  // personal learning: how much this route lifted your mood before
  const mine = journal.filter((j) => j.route === r.id && !j.example);
  if (mine.length) boost += (mine.reduce((a, j) => a + (j.fa - j.fb), 0) / mine.length) * 0.04;
  // small "hidden gem" boost so popular routes do not take over (feedback loop)
  if (r.reviews < 20) boost += 0.03;
  const pct = Math.max(5, Math.min(99, Math.round((base + boost) * 100)));
  const conf = r.reviews >= 30 ? 'hi' : r.reviews >= 12 ? 'med' : 'lo';
  return { r, pct, conf, warn };
}

export const ranked = (plan, tune, journal) =>
  ROUTES.map((r) => scoreRoute(r, plan, tune, journal)).sort((a, b) => b.pct - a.pct);

export const CONF = { hi: 'High', med: 'Medium', lo: 'Low' };

export function aggregate(r, reviews) {
  const list = [...SAMPLE_REVIEWS.filter((x) => x.route === r.id).map((x) => ({ ...x, sample: true })), ...reviews.filter((x) => x.route === r.id)];
  const base = { noise: 1 + 4 * (1 - r.quiet), green: 1 + 4 * r.green, safe: 1 + 4 * (r.light * 0.6 + 0.3), crowd: 1 + 4 * r.crowd };
  const out = {};
  for (const k in base) {
    const sum = list.reduce((a, x) => a + (x[k] || 3), 0);
    out[k] = (base[k] * r.reviews + sum) / (r.reviews + list.length);
  }
  return { a: out, list, n: r.reviews + reviews.filter((x) => x.route === r.id).length };
}

/* Each hazard report has a confidence from confirmations and age; alerts show above the user's criterion. */
export function hazardsFor(r, reports, confirms) {
  const own = reports.filter((x) => x.route === r.id).map((x) => ({ ...x, conf: 0.4, ok: 0, age: x.when || 'recently', mine: true }));
  return [...r.hazards, ...own].map((h, i) => {
    const key = `${r.id}:${h.id || i}`;
    const c = confirms[key];
    const conf = Math.max(0.05, Math.min(0.98, h.conf + (c === 'yes' ? 0.1 : c === 'no' ? -0.2 : 0)));
    return { ...h, key, conf, ok: h.ok + (c === 'yes' ? 1 : 0) };
  });
}

export const threshold = (sens) => 0.85 - 0.6 * sens;
