import geo from './geo.json';
import { cumul } from '../lib/geo.js';

/* Walking geometry and turn steps come from OpenStreetMap via the OSRM foot router.
   Atmosphere scores are our own estimates for the prototype (0 = low, 1 = high). */
const META = [
  { id: 'office', name: 'Gwanak-ro Quick Loop', ko: '관악로 한 바퀴', type: 'Loop', color: '#0F766E', dash: '',
    marks: ['SNU Station exit 1', 'Gwanak-gu Office', 'SNU Station exit 4'],
    a: { green: 0.25, quiet: 0.25, lively: 0.55, views: 0.3, novelty: 0.2, elevation: 0.05, simple: 0.95, light: 0.95, crowd: 0.55, shade: 0.4 },
    stepFree: true, rating: 4.1, reviews: 34,
    desc: 'A ten-minute reset along Gwanak-ro, past Gwanak-gu Office and back to SNU Station. Flat, bright and easy.',
    hazards: [{ at: 0.45, t: 'Sidewalk works outside Gwanak-gu Office', conf: 0.6, ok: 4, age: '3 days ago' }] },
  { id: 'streamShort', name: 'Dorimcheon Short Stretch', ko: '도림천 산책', type: 'One way', color: '#2563EB', dash: '2 8',
    marks: ['Sillim Station', 'Dorimcheon stream path'],
    a: { green: 0.65, quiet: 0.7, lively: 0.3, views: 0.55, novelty: 0.25, elevation: 0.05, simple: 1, light: 0.8, crowd: 0.35, shade: 0.35 },
    stepFree: true, rating: 4.5, reviews: 41,
    desc: 'Drop down from Sillim Station to the Dorimcheon stream path. Water, herons and willows, ten minutes from the busiest crossing in Gwanak.',
    hazards: [{ at: 0.6, t: 'Path floods after heavy rain, use the upper road', conf: 0.85, ok: 12, age: '1 week ago' }] },
  { id: 'sharosu', name: 'Sharosu-gil Food Street', ko: '샤로수길', type: 'Loop', color: '#EA580C', dash: '10 5',
    marks: ['SNU Station', 'Sharosu-gil', 'Gwanak-ro 14-gil', 'Gwanak-gu Office', 'SNU Station'],
    a: { green: 0.15, quiet: 0.2, lively: 0.95, views: 0.3, novelty: 0.75, elevation: 0.1, simple: 0.7, light: 0.95, crowd: 0.8, shade: 0.2 },
    stepFree: true, rating: 4.6, reviews: 88,
    desc: 'SNU Station\'s famous food alley: small restaurants, cafés and dessert shops along Gwanak-ro 14-gil. Busy at lunch and in the evening.',
    hazards: [{ at: 0.3, t: 'Scooters parked across the narrow sidewalk', conf: 0.5, ok: 3, age: 'yesterday' }] },
  { id: 'sillim', name: 'Sillim Night Market Lights', ko: '신림 순대타운 · 신원시장', type: 'Loop', color: '#DB2777', dash: '6 3 2 3',
    marks: ['Sillim Station', 'Sundae Town', 'Sinwon Market', 'Sillim Station'],
    a: { green: 0.1, quiet: 0.1, lively: 0.9, views: 0.3, novelty: 0.65, elevation: 0.05, simple: 0.6, light: 0.9, crowd: 0.85, shade: 0.3 },
    stepFree: true, rating: 4.3, reviews: 57,
    desc: 'Sillim Station\'s Sundae Town and Sinwon Market: neon signs, food stalls and evening crowds.',
    hazards: [{ at: 0.55, t: 'Delivery trucks unloading at the market entrance', conf: 0.45, ok: 2, age: '5 hours ago' }] },
  { id: 'stream', name: 'Dorimcheon Stream Walk', ko: '도림천 · 별빛내린천', type: 'One way', color: '#0284C7', dash: '',
    marks: ['Sillim Station', 'Dorimcheon stream', 'Seorim-dong stream path', 'Gwanaksan entrance'],
    a: { green: 0.7, quiet: 0.7, lively: 0.35, views: 0.6, novelty: 0.35, elevation: 0.15, simple: 0.95, light: 0.75, crowd: 0.4, shade: 0.4 },
    stepFree: true, rating: 4.7, reviews: 63,
    desc: 'Follows Dorimcheon stream, lit up at night as "Byeolbit Naerincheon", from Sillim Station toward the Gwanaksan entrance by Seoul National University.',
    hazards: [{ at: 0.4, t: 'Cyclists pass fast on the shared section', conf: 0.8, ok: 9, age: '4 days ago' }] },
  { id: 'valley', name: 'Gwanaksan Valley Loop', ko: '관악산 계곡길', type: 'Loop', color: '#15803D', dash: '14 6',
    marks: ['Gwanaksan entrance', 'Gwanaksan valley', 'SNU main gate', 'Gwanaksan entrance'],
    a: { green: 0.95, quiet: 0.85, lively: 0.15, views: 0.7, novelty: 0.45, elevation: 0.5, simple: 0.7, light: 0.35, crowd: 0.3, shade: 0.85 },
    stepFree: false, rating: 4.8, reviews: 72,
    desc: 'From the Gwanaksan park entrance next to SNU\'s main gate into the forested valley along the mountain stream. Cool shade in summer, colour in autumn.',
    hazards: [{ at: 0.35, t: 'Loose stones on the valley steps', conf: 0.7, ok: 6, age: '2 days ago' }] },
  { id: 'nakseongdae', name: 'Nakseongdae Park & Shrine', ko: '낙성대공원', type: 'Loop', color: '#65A30D', dash: '4 4',
    marks: ['Nakseongdae Station', 'Nakseongdae Park', 'General Gang Gam-chan statue', 'Nakseongdae Station'],
    a: { green: 0.8, quiet: 0.75, lively: 0.25, views: 0.4, novelty: 0.6, elevation: 0.25, simple: 0.8, light: 0.6, crowd: 0.25, shade: 0.7 },
    stepFree: true, rating: 4.6, reviews: 49,
    desc: 'Nakseongdae, birthplace of General Gang Gam-chan: a shrine, a quiet pine grove and the bronze horseback statue.',
    hazards: [] },
  { id: 'inheon', name: 'Inheon Market & Back Alleys', ko: '인헌시장 골목길', type: 'One way', color: '#A16207', dash: '12 4 2 4',
    marks: ['Nakseongdae Station', 'Inheon Market', 'Gwaneumsa temple', 'Nakseongdae-dong alleys', 'SNU Station'],
    a: { green: 0.2, quiet: 0.45, lively: 0.7, views: 0.35, novelty: 0.9, elevation: 0.3, simple: 0.3, light: 0.6, crowd: 0.5, shade: 0.4 },
    stepFree: false, rating: 4.4, reviews: 9,
    desc: 'Inheon Market\'s covered food alley, a small hillside temple and the winding back streets of Nakseongdae-dong, ending at SNU Station.',
    hazards: [{ at: 0.65, t: 'Broken streetlight in the alley behind the temple', conf: 0.35, ok: 1, age: '3 weeks ago' }] },
  { id: 'cheongnyong', name: 'Cheongnyongsan Forest Path', ko: '청룡산 숲길', type: 'Loop', color: '#047857', dash: '8 4',
    marks: ['Gwanak-gu Office', 'Cheongnyongsan peak', 'Cheongnyongsan forest', 'Gwanak-gu Office'],
    a: { green: 0.85, quiet: 0.8, lively: 0.1, views: 0.8, novelty: 0.5, elevation: 0.75, simple: 0.55, light: 0.3, crowd: 0.15, shade: 0.75 },
    stepFree: false, rating: 4.7, reviews: 26,
    desc: 'From Gwanak-gu Office up Cheongnyongsan, a small forested hill with views over Bongcheon-dong, and back down through the trees.',
    hazards: [{ at: 0.5, t: 'Unlit forest section after sunset', conf: 0.75, ok: 5, age: '1 week ago' }] },
  { id: 'kkachi', name: 'Kkachisan Ridge Climb', ko: '까치산 능선', type: 'One way', color: '#B91C1C', dash: '1 6',
    marks: ['Nakseongdae Station', 'Kkachisan peak', 'SNU Station'],
    a: { green: 0.7, quiet: 0.6, lively: 0.2, views: 0.85, novelty: 0.5, elevation: 0.9, simple: 0.5, light: 0.35, crowd: 0.2, shade: 0.6 },
    stepFree: false, rating: 4.5, reviews: 18,
    desc: 'A steady climb from Nakseongdae Station up Kkachisan, with city views toward Sadang and Gangnam, then down to SNU Station.',
    hazards: [] },
  { id: 'grand', name: 'Gwanak Grand Loop', ko: '관악 한 바퀴', type: 'Loop', color: '#7C3AED', dash: '16 4 4 4',
    marks: ['SNU Station', 'Nakseongdae Park', 'SNU main gate', 'Dorimcheon stream', 'Bongcheon Station', 'SNU Station'],
    a: { green: 0.6, quiet: 0.5, lively: 0.5, views: 0.65, novelty: 0.5, elevation: 0.5, simple: 0.5, light: 0.6, crowd: 0.4, shade: 0.5 },
    stepFree: true, rating: 4.7, reviews: 15,
    desc: 'The big one: Nakseongdae Park, SNU\'s main gate, down the Dorimcheon stream and back through Bongcheon. For a long, active walk.',
    hazards: [] },
];

export const ROUTES = META.map((m) => {
  const g = geo[m.id];
  const exercise = Math.min(1, g.km / 6) * 0.6 + m.a.elevation * 0.4;
  return { ...m, ...m.a, exercise, km: g.km, min: g.min, coords: g.coords, steps: g.steps, cd: cumul(g.coords) };
});
export const routeById = (id) => ROUTES.find((r) => r.id === id);

/* Example reviews shipped with the prototype; the app labels them "Sample". */
export const SAMPLE_REVIEWS = [
  { route: 'sharosu', when: 'yesterday', noise: 5, green: 1, safe: 4, crowd: 5, text: 'Loud and fun on a Friday night. Great dessert cafés, but not a quiet walk.' },
  { route: 'sharosu', when: '1 week ago', noise: 4, green: 2, safe: 5, crowd: 4, text: 'Bright until late, felt safe walking alone.' },
  { route: 'stream', when: '3 days ago', noise: 2, green: 4, safe: 4, crowd: 3, text: 'The stream lights at night are beautiful. Watch for bikes.' },
  { route: 'streamShort', when: '5 days ago', noise: 2, green: 4, safe: 4, crowd: 2, text: 'Hard to believe this is right next to Sillim Station. Saw a heron.' },
  { route: 'valley', when: '2 days ago', noise: 1, green: 5, safe: 3, crowd: 2, text: 'Only sound was the water. Exactly what I needed after an exam.' },
  { route: 'valley', when: '3 weeks ago', noise: 1, green: 5, safe: 3, crowd: 3, text: 'Autumn leaves were stunning. Busy with hikers on weekends.' },
  { route: 'nakseongdae', when: '4 days ago', noise: 2, green: 4, safe: 4, crowd: 2, text: 'Peaceful pine grove, lots of benches. Good with my knee.' },
  { route: 'sillim', when: '2 days ago', noise: 5, green: 1, safe: 4, crowd: 5, text: 'Smells amazing. Very crowded around 7 pm.' },
  { route: 'inheon', when: '1 month ago', noise: 3, green: 1, safe: 3, crowd: 3, text: 'Found a tiny temple I never knew existed. Some steep stairs.' },
  { route: 'cheongnyong', when: '1 week ago', noise: 1, green: 5, safe: 3, crowd: 1, text: 'Great view at the top. Bring a light in the evening.' },
  { route: 'kkachi', when: '5 days ago', noise: 2, green: 4, safe: 3, crowd: 1, text: 'Legs burning, mood great. Nice view of the city.' },
  { route: 'office', when: '2 days ago', noise: 4, green: 2, safe: 5, crowd: 3, text: 'Nothing special, but perfect for a quick break from studying.' },
  { route: 'grand', when: '2 weeks ago', noise: 3, green: 4, safe: 4, crowd: 3, text: 'Took me almost two hours with breaks. Saw a bit of everything.' },
];

export const SAMPLE_JOURNAL = [
  { id: 'ex1', example: true, date: '2026-11-17', route: 'valley', goal: 'calm', fb: 2, fa: 4, match: 'yes', min: 44 },
  { id: 'ex2', example: true, date: '2026-11-19', route: 'sharosu', goal: 'connected', fb: 3, fa: 4, match: 'yes', min: 21 },
  { id: 'ex3', example: true, date: '2026-11-21', route: 'kkachi', goal: 'energize', fb: 3, fa: 5, match: 'somewhat', min: 65 },
  { id: 'ex4', example: true, date: '2026-11-23', route: 'office', goal: 'clear', fb: 2, fa: 3, match: 'no', min: 11 },
];
