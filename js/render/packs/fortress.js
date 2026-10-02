// Render side of the final pack, AIR FORTRESS: its four skies, the carrier's platform styles, the
// backdrops (the carrier's own wings and decks stretching away, escorts, turning fans) and
// DREADNOUGHT's view. The pieces live in fortress-styles.js, fortress-backdrops.js, fortress-boss.js.
import { STYLES } from './fortress-styles.js';
import { BACKDROPS } from './fortress-backdrops.js';
import { BOSS_VIEW } from './fortress-boss.js';

// 12 km up, at night: a night assault over a moonlit sea of cloud (level.cloudY), the city's lights
// glittering through the gaps, searchlights sweeping, flak and tracers, the carrier lit up like a
// city block. Each stage gets its own colour of night; the bonus arenas are power skies at night.
const NIGHT = { night: 1, water: null, rain: 0, stars: 1, beams: 1, pyramids: 0, arc: [0, 4], cityCol: '#06060e', windows: 0.7 };
const themes = {
  fortressDeck: { ...NIGHT, // FLIGHT DECK: moonlight, an electric-blue horizon, the coast's lights to the north-east
    skyTop: '#02041a', skyBot: '#21356f', sun: '#e8f0ff', sunDir: [-0.55, 0.42, -0.72],
    fog: [110, 560], hemi: ['#8c9cf0', '#2a1c48', 1.9], key: ['#b4c6ff', 1.25],
    cloud: '#5a6cb0', cloudShade: '#26306a', city: 0.04, cityH: 0.05, arc: [-1.1, 0.9], neon: 1.4,
    cloudSea: '#8292e0', haze: 0.3,
  },
  fortressHull: { ...NIGHT, // HULL BREACH: under the burning wing, the horizon red with fire and flak
    skyTop: '#090320', skyBot: '#51204e', sun: '#ffe8f0', sunDir: [0.7, 0.35, 0.55],
    fog: [100, 520], hemi: ['#a890e0', '#3a1a30', 1.8], key: ['#ffb0a0', 0.9],
    cloud: '#7a4a8a', cloudShade: '#3a1c48', city: 0.04, cityH: 0.05, arc: [0.6, 0.8], neon: 1.4,
    cloudSea: '#a682c4', haze: 0.3,
  },
  fortressBay: { ...NIGHT, // BOMB BAY: inside under sodium and cyan lamps; the teal night through the doors
    skyTop: '#01040f', skyBot: '#163a5c', sun: '#e4f4ff', sunDir: [-0.35, 0.55, -0.6],
    fog: [60, 360], hemi: ['#9aa8e0', '#3a3048', 1.9], key: ['#ffd8a8', 1.0],
    cloud: '#3a5a86', cloudShade: '#1a2a4c', city: 0.04, cityH: 0.05, arc: [1.6, 1.0], neon: 1.4,
    cloudSea: '#6e92d0', haze: 0.3, beams: 0.8,
  },
  fortressBoss: { ...NIGHT, // COMMAND BRIDGE: the top of the tower at 04:10, a violet night, a huge moon
    skyTop: '#04021a', skyBot: '#3c1f72', sun: '#f4eeff', sunDir: [0.42, 0.3, -0.85],
    fog: [140, 620], hemi: ['#a49cf4', '#2a1a40', 1.9], key: ['#c8c0ff', 1.2],
    cloud: '#6a4aa8', cloudShade: '#2c1e5a', city: 0.04, cityH: 0.05, arc: [2.6, 1.0], neon: 1.4,
    cloudSea: '#8e86dc', haze: 0.32,
  },
  // the SERVER CORE bonus arenas: night power skies over the clouds (cyan, magenta, violet)
  fortressBonus: { ...NIGHT, power: 0.22,
    skyTop: '#040a2a', skyBot: '#1e5a8a', sun: '#e8fcff', sunDir: [0.4, 0.4, -0.7],
    fog: [80, 320], hemi: ['#a0c0ff', '#1a1838', 1.8], key: ['#c0e8ff', 1.2],
    cloud: '#2a4478', cloudShade: '#141e46', city: 0, neon: 1.4, stars: 1, beams: 0.8, cloudSea: '#5a76c0',
  },
  fortressBonus2: { ...NIGHT, power: 0.22,
    skyTop: '#12041e', skyBot: '#6a1e62', sun: '#ffe8f8', sunDir: [0.4, 0.4, -0.7],
    fog: [80, 320], hemi: ['#e0a8f0', '#2a1030', 1.8], key: ['#ffc0e8', 1.1],
    cloud: '#5a2a6a', cloudShade: '#2a1238', city: 0, neon: 1.4, stars: 1, beams: 0.8, cloudSea: '#9a6ab8',
  },
  fortressBonus3: { ...NIGHT, power: 0.22,
    skyTop: '#06021e', skyBot: '#3a2280', sun: '#f0e8ff', sunDir: [0.4, 0.4, -0.7],
    fog: [80, 320], hemi: ['#b8a8ff', '#1e1438', 1.8], key: ['#d8c8ff', 1.1],
    cloud: '#44328a', cloudShade: '#1e1446', city: 0, neon: 1.4, stars: 1, beams: 0.8, cloudSea: '#7a6ad0',
  },
};

export default { themes, styles: STYLES, backdrops: BACKDROPS, bosses: { dreadnought: BOSS_VIEW } };
