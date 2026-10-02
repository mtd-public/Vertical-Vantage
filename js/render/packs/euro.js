// Render side of pack 'euro' (NEO EURO): themes, platform styles, backdrops and CENTURION's view.
// The styles live in euro-styles.js, the distant landmarks in euro-backdrops.js, the boss in euro-boss.js.
import { STYLES } from './euro-styles.js';
import { BACKDROPS } from './euro-backdrops.js';
import { centurionModel, centurionUpdate } from './euro-boss.js';
import shanghai from './shanghai.js';
import seattle from './seattle.js';

// Techy Italy, 2099, after dark: Pisa's marble projection-mapped under the moon, Amalfi at blue hour,
// the Grand Canal at one in the morning, and Rome's Colosseum in neon by moonlight.
const themes = {
  euroPisa: { // the Field of Miracles at night: white marble, neon projections, a high moon
    skyTop: '#03061c', skyBot: '#1c2a5e', sun: '#f2f4ff', sunDir: [0.3, 0.62, 0.5], night: 1,
    fog: [110, 430], hemi: ['#8a9ae4', '#1c2028', 1.55], key: ['#c4d2ff', 1.05],
    cloud: '#28305e', cloudShade: '#141a3a', city: 0.35, arc: [0, 4], cityCol: '#0c1024', cityH: 0.35, pyramids: 0,
    windows: 1, neon: 1.35, water: null, rain: 0, stars: 0.8, beams: 0.8, haze: 0.38,
  },
  euroAmalfi: { // the coast at blue hour: the last violet light over the sea, the town lit up the ravine
    skyTop: '#081448', skyBot: '#6a4888', sun: '#ffb89a', sunDir: [-0.62, 0.1, 0.7], night: 0.85,
    fog: [110, 450], hemi: ['#9096e0', '#2a2034', 1.6], key: ['#ff9c84', 0.85],
    cloud: '#4a3a7a', cloudShade: '#241c4a', city: 0, arc: [0, 4], cityCol: '#1a1430', cityH: 0.3, pyramids: 0,
    windows: 1, neon: 1.3, water: '#0e2656', rain: 0, stars: 0.4, beams: 0.35, haze: 0.36,
  },
  euroVenice: { // the Grand Canal at one in the morning: lit palazzi, neon on the water, a lagoon mist
    skyTop: '#050822', skyBot: '#2c2456', sun: '#eef0ff', sunDir: [0.4, 0.55, -0.7], night: 1,
    fog: [60, 300], hemi: ['#7c82cc', '#22182c', 1.5], key: ['#b2c2ff', 0.9],
    cloud: '#2a2a4c', cloudShade: '#161832', city: 0.3, arc: [0, 4], cityCol: '#0e0c1e', cityH: 0.3, pyramids: 0,
    windows: 1, neon: 1.4, water: '#1e2858', rain: 0, stars: 0.5, beams: 0.6, cover: 0.2, haze: 0.34,
  },
  euroRome: { // the Colosseum at night: a full moon, neon projections, searchlights sweeping the clouds
    skyTop: '#04061c', skyBot: '#34183e', sun: '#f4f2ff', sunDir: [0.3, 0.45, -0.85], night: 1,
    fog: [60, 290], hemi: ['#a098e0', '#34202e', 1.5], key: ['#d0d8ff', 1.05],
    cloud: '#3a3052', cloudShade: '#1a1428', city: 0.5, arc: [0, 4], cityCol: '#160e20', cityH: 0.35, pyramids: 0,
    windows: 1, neon: 1.35, water: null, rain: 0, stars: 0.7, beams: 1, haze: 0.33,
  },
  // the SERVER CORE bonus arenas: night power skies in marble blue, lemon and lagoon magenta
  euroBonusPisa: {
    skyTop: '#040a2a', skyBot: '#20306e', sun: '#e8f0ff', sunDir: [-0.4, 0.6, -0.6], night: 1, power: 1,
    fog: [60, 270], hemi: ['#8aa0e8', '#141a2c', 1.5], key: ['#c0d4ff', 1.05],
    cloud: '#2a3466', cloudShade: '#141c3a', city: 0, arc: [0, 4], cityCol: '#0e1226', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
  euroBonusAmalfi: {
    skyTop: '#0a0c30', skyBot: '#4a3a6a', sun: '#fff0b0', sunDir: [0.6, 0.3, -0.6], night: 1, power: 1,
    fog: [60, 270], hemi: ['#a8a0d8', '#2a2420', 1.5], key: ['#ffe090', 1.0],
    cloud: '#4a3a6a', cloudShade: '#241c3a', city: 0, arc: [0, 4], cityCol: '#1a1426', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
  euroBonusVenice: {
    skyTop: '#0e0428', skyBot: '#5a1e64', sun: '#ffd0f0', sunDir: [0.6, 0.2, -0.6], night: 1, power: 1,
    fog: [60, 260], hemi: ['#c08ad8', '#24102e', 1.5], key: ['#ffb8e0', 1.0],
    cloud: '#5a2a6a', cloudShade: '#2a123a', city: 0, arc: [0, 4], cityCol: '#1c0e26', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
};

// Style names this pack shares with packs merged before it (render/packs/index.js: the later pack wins
// the merge, so the earlier pack's stages would draw with ours). Each shared name picks by the stage's
// theme: ours, SHANGHAI's or SEATTLE's own look, looked up when the style runs.
const OWN = new Set(Object.values(themes)), SHANGHAI = new Set(Object.values(shanghai.themes)), SEATTLE = new Set(Object.values(seattle.themes || {}));
const shared = (name) => (K, p, th, rng, H) => {
  const f = OWN.has(th) ? STYLES[name] : SHANGHAI.has(th) ? shanghai.styles[name] : SEATTLE.has(th) ? seattle.styles && seattle.styles[name] : null;
  return (f || STYLES[name])(K, p, th, rng, H);
};

export default {
  themes,
  styles: { ...STYLES, lantern: shared('lantern'), gondola: shared('gondola'), fountain: shared('fountain') },
  backdrops: BACKDROPS,
  bosses: { centurion: { model: (M, e) => centurionModel(M, e), update: (R, e, g, dt, t, P) => centurionUpdate(R, e, g, dt, t, P) } },
};
