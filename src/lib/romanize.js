/* Simplified Revised Romanization of Korean, good enough for street names. */
const INI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const MED = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const FIN = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

export function rom(str) {
  const syl = [];
  for (const ch of str) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) { syl.push({ raw: ch }); continue; }
    syl.push({ i: INI[Math.floor(c / 588)], v: MED[Math.floor((c % 588) / 28)], f: FIN[c % 28] });
  }
  for (let k = 1; k < syl.length; k++) {
    const p = syl[k - 1];
    const s = syl[k];
    if (p.raw || s.raw) continue;
    if (s.i === 'r' && (p.f === 'n' || p.f === 'l')) { p.f = 'l'; s.i = 'l'; }
    else if (s.i === 'r' && p.f) s.i = 'n';
  }
  return syl.map((s) => s.raw ?? s.i + s.v + s.f).join('');
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function street(name) {
  if (!name) return '';
  const m = name.match(/^(.+?)(대로|로)?(\d+)?(가)?(길)?$/);
  if (!m) return cap(rom(name));
  const [, base, ro, num, ga, gil] = m;
  let s = cap(rom(base));
  if (ro) s += ro === '대로' ? '-daero' : '-ro';
  if (num) s += ` ${num}${ga ? 'ga' : ''}${gil ? '-gil' : ''}`;
  else if (gil) s += '-gil';
  return s;
}
