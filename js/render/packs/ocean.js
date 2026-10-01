// Render side of pack OCEAN CORE: open-sea themes (sunrise, sunset, night storm, the brine pool at
// night, bonus skies), the platform styles (ocean-styles.js), distant landmarks (ocean-backdrops.js)
// and KRAKEN-OS's model and animation (ocean-kraken.js).
import { STYLES } from './ocean-styles.js';
import { BACKDROPS } from './ocean-backdrops.js';
import { krakenModel, updateKraken } from './ocean-kraken.js';

// No city skyline anywhere (city: 0): sea to every horizon; backdrops supply the far structures.
const SEA = { city: 0, arc: [0, 4], cityCol: '#8a9ab0', pyramids: 0, stars: 0, beams: 0, rain: 0 };
const themes = {
  // INTAKE: a clear, salt-hazed sunrise; low warm sun in the east.
  oceanDawn: {
    ...SEA, skyTop: '#3b8de2', skyBot: '#d4ecf4', sun: '#fff0c4', sunDir: [0.8, 0.28, -0.45], night: 0,
    fog: [110, 430], hemi: ['#eef8ff', '#4a6a80', 1.7], key: ['#ffe6c4', 2.3],
    cloud: '#ffffff', cloudShade: '#d4e2ee', windows: 0, neon: 0.5, water: '#1f84b8', haze: 0.55,
  },
  // COLD AISLE: sunset over the barges; the sun low in the west, violet overhead, copper water.
  oceanSunset: {
    ...SEA, skyTop: '#2c2a78', skyBot: '#ffa878', sun: '#ffd8a0', sunDir: [-0.92, 0.12, -0.32], night: 0.35,
    fog: [90, 380], hemi: ['#ffd8cc', '#3a3a6a', 1.5], key: ['#ffb070', 2.0],
    cloud: '#ffd0c0', cloudShade: '#c8687a', windows: 0.5, neon: 0.95, water: '#4a4a8a', stars: 0.15, haze: 0.5,
  },
  // STORM SURGE: night, rain, a low overcast lid, a black-green sea; searchlights from the spine.
  oceanStorm: {
    ...SEA, skyTop: '#05080f', skyBot: '#1e2e3c', sun: '#c8d8ff', sunDir: [-0.3, 0.6, -0.5], night: 1,
    fog: [40, 250], hemi: ['#7084a4', '#18222e', 1.65], key: ['#a8bce0', 1.1],
    cloud: '#2a3442', cloudShade: '#121a24', windows: 1, neon: 1.25, cover: 0.9, water: '#123a48', rain: 1, beams: 0.7, haze: 0.35,
  },
  // BRINE POOL: late night on the desal platform, sodium floodlights, a bruised violet sky.
  oceanBrine: {
    ...SEA, skyTop: '#0a0820', skyBot: '#3a1e3a', sun: '#ffe0c0', sunDir: [0.4, 0.5, -0.7], night: 0.9,
    fog: [45, 280], hemi: ['#9a8ac8', '#201828', 1.5], key: ['#ffc090', 1.2],
    cloud: '#3a2a50', cloudShade: '#20182e', windows: 0.9, neon: 1.2, cover: 0.35, water: '#0e2836', stars: 0.5, beams: 0.35, haze: 0.4,
  },
  // SERVER CORE bonus skies (the power sunburst), in the pack's teal.
  oceanBonus: {
    ...SEA, skyTop: '#1a8ad8', skyBot: '#bff4ff', sun: '#fff3c4', sunDir: [-0.4, 0.6, -0.6], night: 0, power: 1,
    fog: [80, 300], hemi: ['#ffffff', '#5a8aa0', 1.8], key: ['#fff6e0', 2.2], cloud: '#ffffff', cloudShade: '#d8f0ff', windows: 0, neon: 0.8, water: null,
  },
  oceanBonusDusk: {
    ...SEA, skyTop: '#3a2ad8', skyBot: '#ffb898', sun: '#ffd0a0', sunDir: [0.6, 0.25, -0.6], night: 0.4, power: 1,
    fog: [70, 280], hemi: ['#ffe0f0', '#3a3a6a', 1.6], key: ['#ffc8a0', 1.8], cloud: '#ffe6f0', cloudShade: '#e8a8c8', windows: 0.4, neon: 1, water: null, stars: 0.2,
  },
  oceanBonusNight: {
    ...SEA, skyTop: '#03101a', skyBot: '#0a3a4a', sun: '#e8ecff', sunDir: [-0.3, 0.5, -0.8], night: 1, power: 1,
    fog: [60, 260], hemi: ['#6ab8c8', '#0a1a26', 1.3], key: ['#b0e0ff', 0.9], cloud: '#1a4a5a', cloudShade: '#0a2a3a', windows: 1, neon: 1.3, water: null, stars: 0.6,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { kraken: { model: (M) => krakenModel(M), update: (R, e, g, dt, t, P) => updateKraken(R, e, g, dt, t, P) } },
};
