// Render side of pack 'arctic' (ARCTIC VAULT): themes, platform styles (arctic-styles.js), distant
// landmarks and the moving sky things (arctic-backdrops.js) and POLARIS's view (arctic-boss.js).
import { STYLES } from './arctic-styles.js';
import { BACKDROPS } from './arctic-backdrops.js';
import { polarisModel, polarisUpdate } from './arctic-boss.js';

// Polar night all the way down, in ice blue, cyan and magenta: the aurora over neon Longyearbyen, a night
// blizzard on the glacier front cut by floodlights, the vault in the mountain, the ice cavern lit from within.
const themes = {
  arcticAurora: { // LONGYEAR 22:10: polar night, a low moon, stars, the aurora (a backdrop) over a teal-violet horizon,
    // the new port's lights across the fjord, the station's searchlights
    skyTop: '#01030f', skyBot: '#14304e', sun: '#e8f4ff', sunDir: [0.55, 0.28, -0.75], night: 1,
    fog: [80, 340], hemi: ['#6a8ed0', '#2a2444', 0.95], key: ['#a8c8ff', 0.6],
    cloud: '#1a3654', cloudShade: '#0c1a30', city: 0.55, arc: [-1.57, 0.85], cityCol: '#08101e', cityH: 0.35, pyramids: 0,
    windows: 1, neon: 1.3, water: '#06142a', rain: 0, stars: 1, beams: 0.45, cover: 0.1, haze: 0.28,
  },
  arcticBlizzard: { // ICE SHELF 01:30: a night blizzard: snow lit blue-grey by the camp's floodlights, the world
    // fading out in 150 m, black water, searchlights sweeping the cloud
    skyTop: '#060e1c', skyBot: '#20364c', sun: '#d8ecff', sunDir: [0.2, 0.6, -0.6], night: 1,
    fog: [22, 150], hemi: ['#7a9ad0', '#2a2c48', 1.1], key: ['#b8d0ff', 0.6],
    cloud: '#2e4460', cloudShade: '#16223a', city: 0, arc: [0, 4], cityCol: '#0a1424', cityH: 0, pyramids: 0,
    windows: 0.9, neon: 1.3, water: '#06101c', rain: 0, stars: 0, beams: 0.6, cover: 1, haze: 0.75,
  },
  arcticVault: { // THE VAULT 00:40: a clear polar night outside, the lit port far below; inside, a deep blue dark
    // cut by cold light strips and status LEDs
    skyTop: '#01030c', skyBot: '#0c1e38', sun: '#e8f4ff', sunDir: [-0.4, 0.3, 0.85], night: 1,
    fog: [30, 170], hemi: ['#6a96d8', '#1a1838', 0.62], key: ['#a8c8ff', 0.45],
    cloud: '#10283a', cloudShade: '#081420', city: 0.4, arc: [1.57, 0.7], cityCol: '#060c18', cityH: 0.3, pyramids: 0,
    windows: 1, neon: 1.3, water: null, rain: 0, stars: 0.9, beams: 0.3, cover: 0.05, haze: 0.3,
  },
  arcticCavern: { // COLD STORAGE 03:00: the ice cavern under the mountain, lit from within the ice, cyan and magenta
    skyTop: '#020610', skyBot: '#0c1a34', sun: '#c8f0ff', sunDir: [0.2, 0.9, 0.3], night: 1,
    fog: [38, 160], hemi: ['#5a9ad8', '#3a1a4c', 0.68], key: ['#a8eeff', 0.5],
    cloud: '#10283a', cloudShade: '#081420', city: 0, arc: [0, 4], cityCol: '#0a1020', cityH: 0, pyramids: 0,
    windows: 0.6, neon: 1.3, water: null, rain: 0, stars: 0, beams: 0, cover: 0, haze: 0.3,
  },
  arcticBonus: { // the SERVER CORE bonus arenas: an ice-blue power sky in the polar night
    skyTop: '#020a2a', skyBot: '#1a3a62', sun: '#e8f8ff', sunDir: [-0.4, 0.6, -0.6], night: 1, power: 0.45,
    fog: [70, 280], hemi: ['#a8d8f8', '#2a2a4c', 1.5], key: ['#e0f4ff', 1.15],
    cloud: '#2a4a6a', cloudShade: '#14243e', city: 0, arc: [0, 4], cityCol: '#0a1424', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.9, beams: 0,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { polaris: { model: (M, e) => polarisModel(M, e), update: (R, e, g, dt, t, P) => polarisUpdate(R, e, g, dt, t, P) } },
};
