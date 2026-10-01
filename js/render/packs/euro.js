// Render side of pack 'euro' (NEO EURO): themes, platform styles, backdrops and CENTURION's view.
// The styles live in euro-styles.js, the distant landmarks in euro-backdrops.js, the boss in euro-boss.js.
import { STYLES } from './euro-styles.js';
import { BACKDROPS } from './euro-backdrops.js';
import { centurionModel, centurionUpdate } from './euro-boss.js';

// Sun-drenched Mediterranean: noon white, golden afternoon, lagoon dusk, and Rome by moonlight.
const themes = {
  euroNoon: { // Pisa: a high white sun, a deep blue sky, a far terracotta town
    skyTop: '#2a7ee8', skyBot: '#d8ecff', sun: '#fff6d0', sunDir: [0.25, 0.8, 0.55], night: 0,
    fog: [130, 460], hemi: ['#fff8ec', '#7a8a62', 1.75], key: ['#fff2d6', 2.4],
    cloud: '#ffffff', cloudShade: '#e2ecf8', city: 0.25, arc: [0, 4], cityCol: '#c8a88a', cityH: 0.3, pyramids: 0,
    windows: 0, neon: 0.5, water: null, rain: 0, stars: 0, beams: 0, haze: 0.5,
  },
  euroGolden: { // Amalfi: a low sun over the sea to the south-west, warm light on pastel walls
    skyTop: '#3a78d0', skyBot: '#ffd8a0', sun: '#ffe0a0', sunDir: [-0.6, 0.3, 0.65], night: 0,
    fog: [120, 460], hemi: ['#fff0d8', '#7a6050', 1.6], key: ['#ffd49a', 2.4],
    cloud: '#fff4e0', cloudShade: '#f0c8a0', city: 0, arc: [0, 4], cityCol: '#c8a07a', cityH: 0.3, pyramids: 0,
    windows: 0, neon: 0.5, water: '#1a7aa8', rain: 0, stars: 0, beams: 0, haze: 0.42,
  },
  euroDusk: { // Venice: the sun just down behind St Mark's, a violet sky, lit windows on the water
    skyTop: '#26246e', skyBot: '#ff9a70', sun: '#ffb070', sunDir: [-0.35, 0.1, -0.93], night: 0.45,
    fog: [80, 340], hemi: ['#ffd4c4', '#3a2a5a', 1.4], key: ['#ffb07a', 1.6],
    cloud: '#ffc0a0', cloudShade: '#a06088', city: 0.25, arc: [0, 4], cityCol: '#3a2a4a', cityH: 0.3, pyramids: 0,
    windows: 0.8, neon: 1.0, water: '#2a3a6a', rain: 0, stars: 0.15, beams: 0, haze: 0.4,
  },
  euroRome: { // the Colosseum at night: a full moon, floodlights, searchlights sweeping the clouds
    skyTop: '#05071a', skyBot: '#3a1830', sun: '#f4f2ff', sunDir: [0.3, 0.45, -0.85], night: 1,
    fog: [60, 280], hemi: ['#a098d8', '#3a2a28', 1.45], key: ['#d0d8ff', 1.0],
    cloud: '#3a3050', cloudShade: '#1a1428', city: 0.5, arc: [0, 4], cityCol: '#1a1020', cityH: 0.35, pyramids: 0,
    windows: 1, neon: 1.2, water: null, rain: 0, stars: 0.7, beams: 1, haze: 0.35,
  },
  // the SERVER CORE bonus arenas, Mediterranean-tinted
  euroBonusNoon: {
    skyTop: '#1a6cff', skyBot: '#ffe8b0', sun: '#fff3c4', sunDir: [-0.4, 0.6, -0.6], night: 0, power: 1,
    fog: [80, 300], hemi: ['#ffffff', '#7a8a6a', 1.8], key: ['#fff6e0', 2.2],
    cloud: '#ffffff', cloudShade: '#ffe8d0', city: 0, arc: [0, 4], cityCol: '#c8a88a', windows: 0, neon: 0.8,
    water: null, rain: 0, stars: 0, beams: 0,
  },
  euroBonusGold: {
    skyTop: '#2a58d8', skyBot: '#ffc070', sun: '#ffe0a0', sunDir: [0.6, 0.3, -0.6], night: 0.1, power: 1,
    fog: [70, 280], hemi: ['#fff0d0', '#6a4a3a', 1.7], key: ['#ffd8a0', 2.0],
    cloud: '#fff0d8', cloudShade: '#f0b890', city: 0, arc: [0, 4], cityCol: '#c8a07a', windows: 0.2, neon: 0.9,
    water: null, rain: 0, stars: 0, beams: 0,
  },
  euroBonusDusk: {
    skyTop: '#2a1a6a', skyBot: '#ff8a7a', sun: '#ffc090', sunDir: [0.6, 0.2, -0.6], night: 0.5, power: 1,
    fog: [60, 260], hemi: ['#ffd8e8', '#3a2a5a', 1.5], key: ['#ffb8a0', 1.7],
    cloud: '#ffd0e0', cloudShade: '#c07090', city: 0, arc: [0, 4], cityCol: '#3a2a4a', windows: 0.6, neon: 1.1,
    water: null, rain: 0, stars: 0.3, beams: 0,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { centurion: { model: (M, e) => centurionModel(M, e), update: (R, e, g, dt, t, P) => centurionUpdate(R, e, g, dt, t, P) } },
};
