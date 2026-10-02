// Render side of pack 'egypt' (EGYPT: THE DATA DYNASTY): themes, platform styles, backdrops and
// MECHA ANUBIS's view. The city and plateau styles live in egypt-styles.js, the tomb and the Hall of
// Judgment in egypt-tomb.js, the distant landmarks in egypt-backdrops.js, the boss in egypt-boss.js.
import { STYLES } from './egypt-styles.js';
import { TOMB } from './egypt-tomb.js';
import { BACKDROPS } from './egypt-backdrops.js';
import { anubisModel, anubisUpdate } from './egypt-boss.js';

// Neo-Cairo after dark, the data dynasty in gold, lapis and cyan: the city's neon under a lapis sky,
// the Giza plateau's dust glowing over the lit data pyramid, the sanctum's data light, and the
// Duat's lapis night. Every stage is night, and so are the bonus arenas.
const themes = {
  egyptNight: { // CAIRO 23:40: a lapis sky over the neon city, the moon over Giza, searchlights
    skyTop: '#02051c', skyBot: '#2e2152', sun: '#f4ead2', sunDir: [-0.62, 0.36, 0.7], night: 1,
    fog: [70, 330], hemi: ['#6a72c8', '#6a4430', 1.25], key: ['#a8bcff', 0.75],
    cloud: '#3a2c5c', cloudShade: '#1a1434', cover: 0.12, city: 1, arc: [0, 4], cityCol: '#120c26', cityH: 0.55, pyramids: 0,
    windows: 1, neon: 1.3, water: '#0a1432', rain: 0, stars: 0.6, beams: 0.8, haze: 0.36,
  },
  egyptDust: { // DATA PYRAMID 02:10: dust hanging over the plateau, lit gold and magenta by the data centre
    skyTop: '#030620', skyBot: '#33264a', sun: '#ffe8c8', sunDir: [0.12, 0.34, -0.93], night: 1,
    fog: [60, 300], hemi: ['#6c7ad8', '#5a3a2a', 1.25], key: ['#c0ccff', 0.8],
    cloud: '#4a3a62', cloudShade: '#241a3a', cover: 0.35, city: 0.6, arc: [-0.62, 0.75], cityCol: '#160e22', cityH: 0.5, pyramids: 0,
    windows: 0.9, neon: 1.3, water: null, rain: 0, stars: 0.45, beams: 0.7, haze: 0.5,
  },
  egyptTomb: { // INNER SANCTUM 03:00: no sky at all; torchlight on limestone, a lapis dark, cyan data light
    skyTop: '#01020a', skyBot: '#0a1028', sun: '#ffb46a', sunDir: [0.3, 0.85, 0.25], night: 1,
    fog: [22, 118], hemi: ['#c8a08a', '#161c44', 1.15], key: ['#ffa864', 0.85],
    cloud: '#0a1028', cloudShade: '#060a18', city: 0, arc: [0, 4], cityCol: '#0a1028', pyramids: 0,
    windows: 0, neon: 1.3, water: null, rain: 0, stars: 0, beams: 0, haze: 0.3,
  },
  egyptDuat: { // HALL OF JUDGMENT: the Duat's lapis night, gold stars, braziers, data light
    skyTop: '#02041a', skyBot: '#261a54', sun: '#c8d4ff', sunDir: [-0.25, 0.62, -0.74], night: 1,
    fog: [70, 330], hemi: ['#9a96e8', '#2a2030', 1.5], key: ['#ffc070', 1.05],
    cloud: '#2a2860', cloudShade: '#141034', city: 0, arc: [0, 4], cityCol: '#141034', pyramids: 0,
    windows: 0.6, neon: 1.3, water: null, rain: 0, stars: 1, beams: 0.5, haze: 0.35,
  },
  // the SERVER CORE bonus arenas: a gilded power sky at night
  egyptBonusNight: {
    skyTop: '#040a30', skyBot: '#3a2a6a', sun: '#ffe0a0', sunDir: [-0.6, 0.3, 0.6], night: 1, power: 0.45,
    fog: [70, 280], hemi: ['#a09ae8', '#201a3a', 1.45], key: ['#ffd8a0', 1.1],
    cloud: '#4a3a78', cloudShade: '#241a44', city: 0, arc: [0, 4], cityCol: '#1a1430', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.7, beams: 0, pyramids: 0,
  },
  egyptBonusDust: {
    skyTop: '#0a0626', skyBot: '#5a2a44', sun: '#fff0d8', sunDir: [0.3, 0.6, -0.5], night: 1, power: 0.45,
    fog: [70, 280], hemi: ['#c8a0d8', '#2a1a26', 1.45], key: ['#ffe0c0', 1.1],
    cloud: '#6a3a5a', cloudShade: '#341a30', city: 0, arc: [0, 4], cityCol: '#1a1020', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.5, beams: 0, pyramids: 0,
  },
  egyptBonusTomb: {
    skyTop: '#02061e', skyBot: '#14305a', sun: '#a8f0ff', sunDir: [0.4, 0.5, -0.7], night: 1, power: 0.45,
    fog: [60, 260], hemi: ['#a8d0e8', '#1a2240', 1.45], key: ['#ffb880', 1.1],
    cloud: '#1a3a5a', cloudShade: '#0c1a34', city: 0, arc: [0, 4], cityCol: '#0c1a34', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.8, beams: 0, pyramids: 0,
  },
};

export default {
  themes,
  styles: { ...STYLES, ...TOMB },
  backdrops: BACKDROPS,
  bosses: { anubis: { model: (M, e) => anubisModel(M, e), update: (R, e, g, dt, t, P) => anubisUpdate(R, e, g, dt, t, P) } },
};
