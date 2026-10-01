// Render side of the final pack, AIR FORTRESS: its four skies, the carrier's platform styles, the
// backdrops (the carrier's own wings and decks stretching away, escorts, turning fans) and
// DREADNOUGHT's view. The pieces live in fortress-styles.js, fortress-backdrops.js, fortress-boss.js.
import { STYLES } from './fortress-styles.js';
import { BACKDROPS } from './fortress-backdrops.js';
import { BOSS_VIEW } from './fortress-boss.js';

// 12 km up: a thin deep-blue sky, a bright horizon, and the cloud sea far below (level.cloudY).
const themes = {
  fortressDay: { // FLIGHT DECK: blazing high-altitude morning
    skyTop: '#0f3796', skyBot: '#cfe6ff', sun: '#fff6dc', sunDir: [0.55, 0.3, -0.78], night: 0,
    fog: [150, 560], hemi: ['#eef5ff', '#8a96b0', 1.65], key: ['#fff0d8', 2.3],
    cloud: '#ffffff', cloudShade: '#d4e0f2', city: 0, arc: [0, 4], cityCol: '#93a9c8', windows: 0, neon: 0.6,
    water: null, rain: 0, stars: 0, beams: 0, pyramids: 0, cloudSea: '#f2f6ff', haze: 0.5,
  },
  fortressDusk: { // HULL BREACH: sunset under the wing, the belly lit warm from the clouds below
    skyTop: '#2a1a66', skyBot: '#ff9a62', sun: '#ffd08a', sunDir: [0.85, 0.16, 0.35], night: 0.2,
    fog: [120, 480], hemi: ['#ffd8c0', '#b86e6a', 1.55], key: ['#ffb070', 1.9],
    cloud: '#ffc8a8', cloudShade: '#c46e80', city: 0, arc: [0, 4], cityCol: '#6a5a90', windows: 0.3, neon: 0.95,
    water: null, rain: 0, stars: 0.15, beams: 0, pyramids: 0, cloudSea: '#f6a882', haze: 0.45,
  },
  fortressNight: { // BOMB BAY: night, hangar lamps, the moonlit cloud sea through the open doors
    skyTop: '#03061a', skyBot: '#1a2650', sun: '#dfe8ff', sunDir: [-0.35, 0.55, -0.6], night: 1,
    fog: [50, 330], hemi: ['#8a96d8', '#2a2038', 1.5], key: ['#b4c4ff', 0.8],
    cloud: '#3a4672', cloudShade: '#1e2648', city: 0, arc: [0, 4], cityCol: '#1a1026', windows: 0.6, neon: 1.25,
    water: null, rain: 0, stars: 0.9, beams: 0.7, pyramids: 0, cloudSea: '#7484cc', haze: 0.35,
  },
  fortressBoss: { // COMMAND BRIDGE: the edge of space at noon, stars in a black-blue zenith
    skyTop: '#040a2e', skyBot: '#8ab8ff', sun: '#ffffff', sunDir: [0.42, 0.5, -0.75], night: 0.15,
    fog: [160, 620], hemi: ['#e4ecff', '#6a6a8e', 1.6], key: ['#fff4e0', 2.2],
    cloud: '#f4f0ff', cloudShade: '#b8b8e0', city: 0, arc: [0, 4], cityCol: '#6a7aa0', windows: 0, neon: 0.85,
    water: null, rain: 0, stars: 0.6, beams: 0, pyramids: 0, cloudSea: '#e8eeff', haze: 0.45,
  },
  fortressBonus: { // the SERVER CORE bonus arenas: a power sky over the clouds
    skyTop: '#3a1a9a', skyBot: '#ffb4e8', sun: '#fff0ff', sunDir: [0.4, 0.4, -0.7], night: 0.2, power: 1,
    fog: [80, 320], hemi: ['#ffe8ff', '#6a4a9a', 1.7], key: ['#ffe6f8', 2.0],
    cloud: '#ffe8ff', cloudShade: '#d8a0e8', city: 0, arc: [0, 4], cityCol: '#6a5a90', windows: 0, neon: 1,
    water: null, rain: 0, stars: 0.3, beams: 0, pyramids: 0, cloudSea: '#f4d0ff',
  },
};

export default { themes, styles: STYLES, backdrops: BACKDROPS, bosses: { dreadnought: BOSS_VIEW } };
