// Render side of pack 'arctic' (ARCTIC VAULT): themes, platform styles (arctic-styles.js), distant
// landmarks and the moving sky things (arctic-backdrops.js) and POLARIS's view (arctic-boss.js).
import { STYLES } from './arctic-styles.js';
import { BACKDROPS } from './arctic-backdrops.js';
import { polarisModel, polarisUpdate } from './arctic-boss.js';

// The polar night with the aurora, the blizzard whiteout on the glacier, the vault in the mountain,
// and the ice cavern under it.
const themes = {
  arcticAurora: { // LONGYEAR: polar night, a low moon, stars, the aurora (a backdrop) over a teal horizon
    skyTop: '#02060f', skyBot: '#0e3040', sun: '#e8f4ff', sunDir: [0.55, 0.28, -0.75], night: 1,
    fog: [80, 340], hemi: ['#8ab8e0', '#1c2638', 1.55], key: ['#b8d8ff', 0.95],
    cloud: '#163248', cloudShade: '#0a1828', city: 0, arc: [0, 4], cityCol: '#0a1020', cityH: 0, pyramids: 0,
    windows: 1, neon: 1.2, water: '#071824', rain: 0, stars: 1, beams: 0, cover: 0.1, haze: 0.28,
  },
  arcticWhiteout: { // ICE SHELF: the blizzard: a white lid, the world fading out in 150 m, black water
    skyTop: '#9aa8b6', skyBot: '#d8e2ea', sun: '#ffffff', sunDir: [0.2, 0.6, -0.6], night: 0,
    fog: [22, 165], hemi: ['#f2f8ff', '#8a9aac', 1.85], key: ['#eef4ff', 1.05],
    cloud: '#e6edf3', cloudShade: '#b4c0cc', city: 0, arc: [0, 4], cityCol: '#9aa8b6', cityH: 0, pyramids: 0,
    windows: 0.2, neon: 0.8, water: '#0a1a24', rain: 0, stars: 0, beams: 0, cover: 1, haze: 0.82,
  },
  arcticVault: { // THE VAULT: a clear polar night outside; inside, cold light and a deep blue dark
    skyTop: '#01040c', skyBot: '#0a2032', sun: '#e8f4ff', sunDir: [-0.4, 0.3, 0.85], night: 1,
    fog: [30, 175], hemi: ['#9ac8f0', '#18202e', 1.6], key: ['#c0e0ff', 0.85],
    cloud: '#10283a', cloudShade: '#081420', city: 0, arc: [0, 4], cityCol: '#0a1020', cityH: 0, pyramids: 0,
    windows: 0.9, neon: 1.25, water: null, rain: 0, stars: 0.9, beams: 0, cover: 0.05, haze: 0.3,
  },
  arcticCavern: { // COLD STORAGE: the ice cavern under the mountain, lit from within the ice
    skyTop: '#020810', skyBot: '#0c2434', sun: '#c8f0ff', sunDir: [0.2, 0.9, 0.3], night: 1,
    fog: [42, 165], hemi: ['#a8e0f8', '#1a2c3e', 1.7], key: ['#d0f2ff', 1.05],
    cloud: '#10283a', cloudShade: '#081420', city: 0, arc: [0, 4], cityCol: '#0a1020', cityH: 0, pyramids: 0,
    windows: 0.6, neon: 1.2, water: null, rain: 0, stars: 0, beams: 0, cover: 0, haze: 0.3,
  },
  arcticBonus: { // the SERVER CORE bonus arenas: an ice-blue power sky
    skyTop: '#1a5ab8', skyBot: '#c8f8ff', sun: '#ffffff', sunDir: [-0.4, 0.6, -0.6], night: 0.2, power: 1,
    fog: [70, 280], hemi: ['#f0fbff', '#4a6a8a', 1.75], key: ['#f0faff', 2.0],
    cloud: '#f0fbff', cloudShade: '#a8d8f0', city: 0, arc: [0, 4], cityCol: '#93a9c8', windows: 0, neon: 1,
    water: null, rain: 0, stars: 0.2, beams: 0,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { polaris: { model: (M, e) => polarisModel(M, e), update: (R, e, g, dt, t, P) => polarisUpdate(R, e, g, dt, t, P) } },
};
