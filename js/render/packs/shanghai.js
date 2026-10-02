// Render side of pack SHANGHAI: themes, platform styles (./shanghai-styles.js), distant landmarks
// (./shanghai-backdrops.js: the Pudong skyline after dark, the Bund floodlit, the river's tour boats) and
// the JADE DRAGON's view (./shanghai-dragon.js).
import { SHANGHAI_STYLES } from './shanghai-styles.js';
import { DRAGON_VIEW } from './shanghai-dragon.js';
import { SHANGHAI_BACKDROPS } from './shanghai-backdrops.js';

const themes = {
  // THE BUND by night: the colonial row floodlit gold (the key light comes in low off the river),
  // Pudong's LED skyline across the water to the east, searchlights, the river full of lit boats.
  shanghaiBund: {
    skyTop: '#05061f', skyBot: '#3c1d5c', sun: '#fff2dc', sunDir: [0.85, 0.32, 0.25], night: 1,
    fog: [90, 400], hemi: ['#7c76d4', '#3a2030', 1.45], key: ['#ffb868', 1.25],
    cloud: '#3a2a5c', cloudShade: '#1c1434', city: 1, arc: [0, 1.25], cityCol: '#120e2c', cityH: 1.7, pyramids: 0, windows: 1, neon: 1.35,
    water: '#1e2a5e', rain: 0, stars: 0.45, beams: 1, haze: 0.28,
  },
  // PUDONG HEIGHTS at 2 a.m.: LED-wrapped supertalls in a magenta smog, rain sheeting through
  shanghaiNeon: {
    skyTop: '#090520', skyBot: '#4a1f62', sun: '#efe6ff', sunDir: [0.35, 0.55, -0.6], night: 1,
    fog: [60, 300], hemi: ['#8070d0', '#2a0e30', 1.5], key: ['#a4bcff', 0.9],
    cloud: '#4a2a6a', cloudShade: '#22123a', city: 1, arc: [0, 4], cityCol: '#150c2a', cityH: 1.9, pyramids: 0, windows: 1, neon: 1.4,
    water: null, rain: 1, stars: 0.15, beams: 1, cover: 0.3, haze: 0.36,
  },
  // LANTERN NIGHT: the old town's red lanterns and neon, Pudong lit up to the north-east
  shanghaiLantern: {
    skyTop: '#0a0420', skyBot: '#5a1a40', sun: '#ffe6d6', sunDir: [0.3, 0.55, -0.75], night: 1,
    fog: [50, 260], hemi: ['#c27a9c', '#2a1020', 1.5], key: ['#ffb490', 0.95],
    cloud: '#4a2446', cloudShade: '#261430', city: 0.95, arc: [-1.2, 1.4], cityCol: '#180c24', cityH: 1.5, pyramids: 0, windows: 1, neon: 1.4,
    water: '#1a1034', rain: 0, stars: 0.5, beams: 0.8, haze: 0.28,
  },
  // PEARL TOWER at half past midnight, above a sea of hot-pink neon smog
  shanghaiPearl: {
    skyTop: '#0e0530', skyBot: '#9a2a7c', sun: '#ffe0f0', sunDir: [0.5, 0.4, 0.6], night: 1,
    fog: [70, 340], hemi: ['#d092d8', '#2c1034', 1.55], key: ['#ffc4e2', 1.0],
    cloud: '#6a3070', cloudShade: '#341640', city: 1, arc: [0, 4], cityCol: '#1c0e2c', cityH: 1.3, pyramids: 0, windows: 1, neon: 1.4,
    water: null, rain: 0, stars: 0.5, beams: 1, cloudSea: '#8a3a92', haze: 0.32,
  },
  // the pack's SERVER CORE bonus arenas: power skies over a night of gold, cyan and lantern red
  shanghaiBonusGold: {
    skyTop: '#0a0626', skyBot: '#5a2a5a', sun: '#ffe0b0', sunDir: [0.6, 0.3, -0.6], night: 1, power: 1,
    fog: [60, 270], hemi: ['#b08ad0', '#2a1428', 1.45], key: ['#ffc080', 1.0],
    cloud: '#5a3a6a', cloudShade: '#2a1a3a', city: 0, arc: [0, 4], cityCol: '#1a1026', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
  shanghaiBonusCyan: {
    skyTop: '#050a26', skyBot: '#1e2c6a', sun: '#e0f0ff', sunDir: [-0.4, 0.5, -0.6], night: 1, power: 1,
    fog: [60, 270], hemi: ['#7a9ae0', '#141a30', 1.45], key: ['#a8d0ff', 1.0],
    cloud: '#2a3a6a', cloudShade: '#141c3a', city: 0, arc: [0, 4], cityCol: '#101626', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
  shanghaiBonusRed: {
    skyTop: '#140418', skyBot: '#6a1a34', sun: '#ffd8c8', sunDir: [0.3, 0.5, -0.7], night: 1, power: 1,
    fog: [60, 270], hemi: ['#d08098', '#2a0e1a', 1.45], key: ['#ffb0a0', 1.0],
    cloud: '#5a2440', cloudShade: '#2c1024', city: 0, arc: [0, 4], cityCol: '#1e0c1a', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
};

export default {
  themes,
  styles: SHANGHAI_STYLES,
  backdrops: SHANGHAI_BACKDROPS,
  bosses: { dragon: DRAGON_VIEW },
};
