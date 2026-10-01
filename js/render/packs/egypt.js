// Render side of pack 'egypt' (EGYPT: THE DATA DYNASTY): themes, platform styles, backdrops and
// MECHA ANUBIS's view. The city and plateau styles live in egypt-styles.js, the tomb and the Hall of
// Judgment in egypt-tomb.js, the distant landmarks in egypt-backdrops.js, the boss in egypt-boss.js.
import { STYLES } from './egypt-styles.js';
import { TOMB } from './egypt-tomb.js';
import { BACKDROPS } from './egypt-backdrops.js';
import { anubisModel, anubisUpdate } from './egypt-boss.js';

// Gold and lapis: a low sun over the Nile, a white-hot noon in the sand, torchlight underground, and
// the Duat's lapis night with gold stars.
const themes = {
  egyptGolden: { // CAIRO: 17:20, the sun low in the west over Giza, the old city glowing ochre
    skyTop: '#2f5cb8', skyBot: '#ffbf7a', sun: '#ffd08a', sunDir: [-0.86, 0.2, 0.46], night: 0.08,
    fog: [140, 520], hemi: ['#ffe6c4', '#7a5638', 1.55], key: ['#ffc27a', 2.4],
    cloud: '#ffe2b8', cloudShade: '#e89a68', city: 0.3, arc: [0, 4], cityCol: '#b88a62', cityH: 0.45, pyramids: 0,
    windows: 0.2, neon: 0.75, water: '#3a7088', rain: 0, stars: 0, beams: 0, haze: 0.4,
  },
  egyptHaze: { // DATA PYRAMID: noon with a sandstorm blowing in, the sun a white disc, the distance ochre
    skyTop: '#a8946a', skyBot: '#f0d4a4', sun: '#fff6e0', sunDir: [0.3, 0.86, 0.42], night: 0,
    fog: [90, 380], hemi: ['#fff2dc', '#b88a5a', 1.85], key: ['#fff0d0', 2.3],
    cloud: '#f6e2c0', cloudShade: '#e0bc90', cover: 0.15, city: 0, arc: [0, 4], cityCol: '#c8a070', pyramids: 0,
    windows: 0, neon: 0.85, water: null, rain: 0, stars: 0, beams: 0, haze: 0.62,
  },
  egyptTomb: { // INNER SANCTUM: no sky at all, torchlight on limestone, cyan data glyphs
    skyTop: '#0a0605', skyBot: '#20120a', sun: '#ffb46a', sunDir: [0.3, 0.85, 0.25], night: 1,
    fog: [22, 120], hemi: ['#ffc88c', '#3a2416', 1.55], key: ['#ffae64', 0.95],
    cloud: '#1a100a', cloudShade: '#100a06', city: 0, arc: [0, 4], cityCol: '#1a100a', pyramids: 0,
    windows: 0, neon: 1.25, water: null, rain: 0, stars: 0, beams: 0, haze: 0.3,
  },
  egyptDuat: { // HALL OF JUDGMENT: the Duat's lapis night, gold stars, braziers
    skyTop: '#030620', skyBot: '#2a1a52', sun: '#c8d4ff', sunDir: [-0.25, 0.62, -0.74], night: 1,
    fog: [70, 330], hemi: ['#9a96e8', '#3a2818', 1.5], key: ['#ffc070', 1.05],
    cloud: '#2a2860', cloudShade: '#141034', city: 0, arc: [0, 4], cityCol: '#141034', pyramids: 0,
    windows: 0.6, neon: 1.25, water: null, rain: 0, stars: 1, beams: 0.35, haze: 0.35,
  },
  // the SERVER CORE bonus arenas, gilded
  egyptBonusGold: {
    skyTop: '#1a3ab8', skyBot: '#ffc870', sun: '#ffe0a0', sunDir: [-0.6, 0.3, 0.6], night: 0.1, power: 1,
    fog: [80, 300], hemi: ['#fff0d0', '#6a4a3a', 1.75], key: ['#ffd8a0', 2.1],
    cloud: '#fff0d8', cloudShade: '#f0b080', city: 0, arc: [0, 4], cityCol: '#c8a07a', windows: 0.2, neon: 0.9,
    water: null, rain: 0, stars: 0, beams: 0, pyramids: 0,
  },
  egyptBonusHaze: {
    skyTop: '#c8803a', skyBot: '#ffe4b0', sun: '#fff8e0', sunDir: [0.3, 0.8, -0.5], night: 0, power: 1,
    fog: [70, 280], hemi: ['#fff4e0', '#a0784a', 1.8], key: ['#fff0d0', 2.1],
    cloud: '#ffe8c8', cloudShade: '#e0a870', city: 0, arc: [0, 4], cityCol: '#c8a070', windows: 0, neon: 0.9,
    water: null, rain: 0, stars: 0, beams: 0, pyramids: 0,
  },
  egyptBonusTomb: {
    skyTop: '#06082a', skyBot: '#5a2a1a', sun: '#ffc890', sunDir: [0.4, 0.5, -0.7], night: 0.7, power: 1,
    fog: [60, 260], hemi: ['#ffd8b0', '#3a2a5a', 1.55], key: ['#ffb880', 1.6],
    cloud: '#5a3a5a', cloudShade: '#2a1a3a', city: 0, arc: [0, 4], cityCol: '#2a1a3a', windows: 0.6, neon: 1.2,
    water: null, rain: 0, stars: 0.6, beams: 0, pyramids: 0,
  },
};

export default {
  themes,
  styles: { ...STYLES, ...TOMB },
  backdrops: BACKDROPS,
  bosses: { anubis: { model: (M, e) => anubisModel(M, e), update: (R, e, g, dt, t, P) => anubisUpdate(R, e, g, dt, t, P) } },
};
