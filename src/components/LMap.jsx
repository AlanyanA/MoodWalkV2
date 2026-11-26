import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

export function tileLayer(dark) {
  return L.tileLayer(TILES, { maxZoom: 19, attribution: ATTR, className: dark ? 'tiles-dark' : 'tiles-light' });
}

export const pin = (label, cls = '') => L.divIcon({ className: `mw-pin ${cls}`, html: `<span>${label}</span>`, iconSize: [26, 26], iconAnchor: [13, 13] });

/* A Leaflet map showing one or more routes. `active` highlights one route and fits to it. */
export default function LMap({ routes, active, dark, interactive = true, attribution = true, onSelect, className, padding = 28, ariaLabel }) {
  const el = useRef();
  const map = useRef();
  const group = useRef();
  const tiles = useRef();
  const sel = useRef(onSelect);
  sel.current = onSelect;

  useEffect(() => {
    const m = L.map(el.current, {
      zoomControl: interactive, attributionControl: attribution, dragging: interactive, touchZoom: interactive,
      doubleClickZoom: interactive, scrollWheelZoom: false, boxZoom: false, keyboard: interactive, tap: false,
    });
    if (attribution) m.attributionControl.setPrefix(false);
    group.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; tiles.current = null; };
  }, [interactive, attribution]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    tiles.current = tileLayer(dark).addTo(m);
  }, [dark, interactive, attribution]);

  const key = routes.map((r) => r.id).join(',') + '|' + active;
  useEffect(() => {
    const m = map.current;
    const g = group.current;
    if (!m) return;
    g.clearLayers();
    const bounds = [];
    routes.forEach((r) => {
      const on = !active || active === r.id;
      L.polyline(r.coords, { color: '#ffffff', weight: on ? 9 : 5, opacity: on ? 0.9 : 0.4, interactive: false }).addTo(g);
      const line = L.polyline(r.coords, { color: r.color, weight: on ? 5.5 : 3, opacity: on ? 1 : 0.4, dashArray: r.dash || null, lineCap: 'round', lineJoin: 'round' }).addTo(g);
      if (interactive) line.bindTooltip(r.name, { sticky: true });
      line.on('click', () => sel.current?.(r.id));
      if (on) bounds.push(...r.coords);
      if (active === r.id && interactive) {
        L.marker(r.coords[0], { icon: pin('S', 'start'), interactive: false, keyboard: false }).addTo(g);
        const end = r.coords[r.coords.length - 1];
        if (Math.abs(end[0] - r.coords[0][0]) + Math.abs(end[1] - r.coords[0][1]) > 0.0004) L.marker(end, { icon: pin('E', 'end'), interactive: false, keyboard: false }).addTo(g);
      }
    });
    if (bounds.length) m.fitBounds(L.latLngBounds(bounds), { padding: [padding, padding], animate: false });
  }, [key, padding]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={className} role={interactive ? 'region' : 'img'} aria-label={ariaLabel || 'Map'} />;
}
