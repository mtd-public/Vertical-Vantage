// Render side of pack OCEAN CORE: one night on the floating data haven (the blue hour at the
// plant, midnight over the server barges, the storm on the wind farm, the brine pool before dawn,
// and the bonus skies), the platform styles (ocean-styles.js), distant landmarks
// (ocean-backdrops.js) and KRAKEN-OS's model and animation (ocean-kraken.js).
import { STYLES } from './ocean-styles.js';
import { BACKDROPS } from './ocean-backdrops.js';
import { krakenModel, updateKraken } from './ocean-kraken.js';

// Open sea to most horizons; low in the north (arc) the lit skyline of the haven itself, its
// searchlights sweeping the sky. The backdrops supply the near landmarks.
const SEA = { city: 0.75, arc: [-1.57, 0.85], cityH: 0.42, pyramids: 0, rain: 0, cover: 0 };
const themes = {
  // INTAKE: the deep blue hour at the plant. The last ember of the sun under the western rim,
  // indigo overhead and the first stars; the sea mist glows teal on the horizon, the plant's
  // floodlights and LED trims already on.
  oceanBlueHour: {
    ...SEA, skyTop: '#050c38', skyBot: '#2a5a7c', sun: '#ff9468', sunDir: [-0.92, 0.03, -0.38], night: 0.75,
    fog: [50, 290], hemi: ['#7898dc', '#0e1c34', 1.6], key: ['#ffa488', 0.75],
    cloud: '#6a5a8a', cloudShade: '#1c2a52', cityCol: '#06102a', windows: 1, neon: 1.3,
    water: '#0e2c4c', stars: 0.4, beams: 0.45, cover: 0.15, haze: 0.3,
  },
  // COLD AISLE: midnight over the server barges: a clear violet night, the moon north-east, the
  // haven's skyline and its searchlights on the northern horizon, every rack blinking.
  oceanNight: {
    ...SEA, skyTop: '#04021a', skyBot: '#3e2268', sun: '#f0e8ff', sunDir: [0.55, 0.3, -0.62], night: 1,
    fog: [48, 280], hemi: ['#8a7ce4', '#140c28', 1.6], key: ['#c4b8ff', 0.95],
    cloud: '#3a2a66', cloudShade: '#1a1236', cityCol: '#0a0820', windows: 1, neon: 1.3,
    water: '#140f3a', stars: 0.75, beams: 0.6, cover: 0.12, haze: 0.3,
  },
  // STORM SURGE: night, rain, a low overcast lid, a black-green sea; the haven's searchlights.
  oceanStorm: {
    ...SEA, skyTop: '#02050c', skyBot: '#123a46', sun: '#c8d8ff', sunDir: [-0.3, 0.6, -0.5], night: 1,
    fog: [38, 240], hemi: ['#5a80b0', '#0c1822', 1.6], key: ['#9ab8e8', 1.05],
    cloud: '#1e303c', cloudShade: '#0a1218', cityCol: '#040a10', windows: 1, neon: 1.3, cover: 0.85,
    water: '#0b3038', rain: 1, beams: 1, stars: 0, haze: 0.3, city: 0.6,
  },
  // BRINE POOL: four in the morning on the desal platform: a crimson haze on the horizon under a
  // black sky, the pool glowing teal, the deck under white floodlights.
  oceanBrine: {
    ...SEA, skyTop: '#07030f', skyBot: '#521a3c', sun: '#ffe0ec', sunDir: [0.4, 0.42, -0.7], night: 1,
    fog: [44, 280], hemi: ['#a890d0', '#1c1020', 1.65], key: ['#ffd8cc', 1.2],
    cloud: '#42203e', cloudShade: '#1e0e1e', cityCol: '#0e0610', windows: 1, neon: 1.3, cover: 0.3, arc: [-2.07, 0.6],
    water: '#160c26', stars: 0.55, beams: 0.8, haze: 0.32,
  },
  // SERVER CORE bonus skies (the power sunburst over a night sea), one per stage.
  oceanBonusNight: {
    ...SEA, city: 0, skyTop: '#020c18', skyBot: '#0c4256', sun: '#e8ecff', sunDir: [-0.3, 0.5, -0.8], night: 1, power: 0.55,
    fog: [60, 260], hemi: ['#6ab8d8', '#0a1a26', 1.45], key: ['#b0e0ff', 0.95], cloud: '#1a4a5a', cloudShade: '#0a2a3a', cityCol: '#05121e', windows: 1, neon: 1.3, water: null, stars: 0.7,
  },
  oceanBonusViolet: {
    ...SEA, city: 0, skyTop: '#08041e', skyBot: '#4a2470', sun: '#ffd8f0', sunDir: [0.6, 0.25, -0.6], night: 1, power: 0.55,
    fog: [60, 260], hemi: ['#a088e8', '#1a1030', 1.45], key: ['#e0c0ff', 0.95], cloud: '#4a2c6a', cloudShade: '#22163c', cityCol: '#0e0a26', windows: 1, neon: 1.3, water: null, stars: 0.6,
  },
  oceanBonusStorm: {
    ...SEA, city: 0, skyTop: '#020a0c', skyBot: '#0e4a40', sun: '#d8fff0', sunDir: [-0.3, 0.55, -0.7], night: 1, power: 0.55,
    fog: [60, 260], hemi: ['#5ad0b0', '#08201c', 1.45], key: ['#b0ffe0', 0.95], cloud: '#1a4a40', cloudShade: '#0a2a24', cityCol: '#04100e', windows: 1, neon: 1.3, water: null, stars: 0.5,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { kraken: { model: (M) => krakenModel(M), update: (R, e, g, dt, t, P) => updateKraken(R, e, g, dt, t, P) } },
};
