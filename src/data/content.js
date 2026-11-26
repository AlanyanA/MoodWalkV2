export const GOALS = [
  { id: 'calm', label: 'Calm down', sub: 'Lower the stress', w: { green: 1, quiet: 1, shade: 0.4, crowd: -0.8, simple: 0.4 }, playlist: 'calm' },
  { id: 'clear', label: 'Clear my mind', sub: 'Space to think', w: { simple: 1, views: 0.8, green: 0.7, quiet: 0.6 }, playlist: 'clear' },
  { id: 'energize', label: 'Feel energized', sub: 'Get the blood moving', w: { elevation: 1, lively: 0.6, views: 0.4 }, playlist: 'energize' },
  { id: 'explore', label: 'Explore something new', sub: 'Find a hidden corner', w: { novelty: 1, lively: 0.5, views: 0.3, simple: -0.4 }, playlist: 'explore' },
  { id: 'connected', label: 'Be around people', sub: 'Feel the life of the city', w: { lively: 1, crowd: 0.5, light: 0.3 }, playlist: 'connected' },
  { id: 'active', label: 'Stay active & healthy', sub: 'Build a walking habit', w: { exercise: 1, elevation: 0.6, green: 0.4 }, playlist: 'active' },
];
export const goalById = (id) => GOALS.find((g) => g.id === id) || GOALS[0];

export const FEELS = ['Very low', 'Low', 'Okay', 'Good', 'Great'];

export const TIMES = [
  { id: 'lt15', label: 'Less than 15 minutes', short: '< 15 min', min: 0, max: 15 },
  { id: '15-30', label: '15–30 minutes', short: '15–30 min', min: 15, max: 30 },
  { id: '30-60', label: '30–60 minutes', short: '30–60 min', min: 30, max: 60 },
  { id: '60+', label: 'Over 1 hour', short: '1 h +', min: 60, max: 999 },
];
export const timeById = (id) => TIMES.find((t) => t.id === id) || TIMES[1];

export const PREFS = [['green', 'Greenery'], ['quiet', 'Quiet streets'], ['lively', 'Lively areas'], ['views', 'Interesting views'], ['shade', 'Shade']];
export const ACCESS = [['stepfree', 'Step-free'], ['lit', 'Well-lit'], ['nocrowd', 'Avoid crowds']];

export const REASON = {
  green: 'Greenery', quiet: 'Quiet', lively: 'Lively', views: 'Views', novelty: 'Something new', elevation: 'Hills',
  simple: 'Easy to follow', light: 'Well-lit', shade: 'Shade', crowd: 'People around', exercise: 'Good workout',
};

/* Human factors notes shown by the optional "design notes" lens (Settings). */
export const HF = {
  gulfs: { t: 'Gulf of execution', src: 'Norman, The Design of Everyday Things', x: 'Goals are written in the user\'s own words ("Calm down"), not system terms. Six options in a 2 × 3 grid can be compared at a glance.' },
  hick: { t: 'Hick–Hyman law', src: 'Course readings on decision & attention', x: 'Decision time grows with the number of choices. The mood question has only five options and one tap moves you on.' },
  mapping: { t: 'Natural mapping', src: 'Norman, The Design of Everyday Things', x: 'Time ranges run from shortest to longest, and rating scales go from low on the left to high on the right.' },
  ud1: { t: 'UD 1 · Equitable use', src: 'Principles of Universal Design (NC State)', x: 'Step-free and well-lit are ordinary choices anyone can use, not a separate "accessible mode".' },
  hcai: { t: 'High automation, high human control', src: 'Shneiderman, Human-Centered AI', x: 'After sunset the app turns on "Well-lit" for you, says so, and lets you turn it off with one tap.' },
  simplicity: { t: 'Reducing clutter', src: 'Wickens, Attention in Perception & Display Space', x: 'Each route card shows only what is needed to choose: name, time, distance and match. Details are one tap away.' },
  pcp: { t: 'Proximity compatibility principle', src: 'Wickens, Attention in Perception & Display Space', x: 'When you need to compare, the table puts the routes side by side so values can be integrated in one glance.' },
  calib: { t: 'Calibrated trust', src: 'Lee & See, Trust in Automation', x: 'Confidence shows how many walkers reviewed a route, so users rely on well-reviewed suggestions and check new ones.' },
  disclose: { t: 'Progressive disclosure', src: 'Norman; Wickens (information access cost)', x: 'Safety layers and reviews are hidden behind one button: available when wanted, out of the way when not.' },
  swiss: { t: 'Swiss cheese model', src: 'Reason, Human Error: Models and Management', x: 'Well-lit routing, recent reports, eyes-up walk mode and sharing your ETA are separate layers of defence.' },
  frame: { t: 'Frames of reference', src: 'Wickens, Spatial Displays', x: 'Planning uses a north-up map. While walking you can choose track-up (the map turns with you) or a fixed direction.' },
  mrt: { t: 'Multiple resource theory', src: 'Wickens, Attention', x: 'Music uses the auditory channel, so alerts also arrive as vibration, which competes less with listening and looking.' },
  seev: { t: 'SEEV model of attention', src: 'Wickens, Attention in Perception & Display Space', x: 'The next instruction is the most salient element and sits where the eye expects it, so a glance is enough.' },
  slips: { t: 'Preventing slips', src: 'Norman; Reason, Human Error', x: 'Ending a walk asks for confirmation, so an accidental tap in a pocket does not end your walk.' },
  sdt: { t: 'Signal detection theory', src: 'Applications of Signal Detection Theory', x: 'Hazard alerts are a detection problem. You set the response criterion; confirmations from walkers raise sensitivity (d′).' },
  justculture: { t: 'Reporting culture', src: 'Reason, Human Error', x: 'Hazard reports are quick, anonymous and blame-free, because safe systems depend on people reporting problems.' },
  sem: { t: 'ML feedback loop', src: 'Amershi et al., Software Engineering for ML', x: 'Your "did it match?" answer and ratings feed back into future recommendations for you and others.' },
  equity: { t: 'AI for the public good', src: 'Stanford d.school, Human-Centered AI for Social Impact', x: 'Reviews describe the place, not the people, so neighbourhood ratings do not turn into bias.' },
  reflective: { t: 'Reflective level', src: 'Norman, Emotional Design', x: 'The postcard and journal turn each walk into part of a personal story, which keeps people coming back.' },
  visceral: { t: 'Visceral level', src: 'Norman, Emotional Design', x: 'The interface takes on the colour of the chosen goal: teal for calm, orange for energy.' },
  aging: { t: 'Designing for older adults', src: 'UX Design for All in the Aging World', x: 'Hyperlegible type, three text sizes, high contrast and large targets support changes in vision and motor control.' },
  offload: { t: 'Cognitive offloading', src: 'How Does AI Shape Human Intelligence?', x: 'Landmark mode gives fewer prompts so you build your own mental map instead of relying on turn-by-turn.' },
};
