const rad = (x) => (x * Math.PI) / 180;

export function hav(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export function cumul(c) {
  const d = [0];
  for (let i = 1; i < c.length; i++) d.push(d[i - 1] + hav(c[i - 1], c[i]));
  return d;
}

export function bearing(a, b) {
  const y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
  const x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/* Position and heading at a given distance (m) along the route. */
export function pointAt(c, cd, dist) {
  const total = cd[cd.length - 1];
  const d = Math.max(0, Math.min(total, dist));
  let i = 1;
  while (i < cd.length - 1 && cd[i] < d) i++;
  const seg = cd[i] - cd[i - 1] || 1;
  const f = (d - cd[i - 1]) / seg;
  const a = c[i - 1];
  const b = c[i];
  return { pos: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], brg: bearing(a, b), i };
}

/* Closest vertex on the route to a GPS position. */
export function nearest(c, cd, p) {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < c.length; i++) {
    const d = hav(c[i], p);
    if (d < bd) { bd = d; best = i; }
  }
  return { dist: cd[best], off: bd };
}
