// Render side of NEO CHICAGO: its night themes (the Loop in the rain, the lakeshore on a summer
// night, a windy Skydeck night, the BULL PEN under its floodlights, and the bonus core), its
// platform styles (render/packs/chicago-styles.js), distant landmarks (chicago-backdrops.js) and
// TAURUS-312's view (chicago-taurus.js).
import { STYLES } from './chicago-styles.js';
import { BACKDROPS } from './chicago-backdrops.js';
import { taurusModel, taurusUpdate } from './chicago-taurus.js';

const themes = {
  chiLoop: { // the drowned Loop at one in the morning: rain, a magenta-amber smog lit from below,
    // every window on, searchlights raking the cloud; the canals black and full of neon
    skyTop: '#0a0516', skyBot: '#5a2444', sun: '#ffe0c8', sunDir: [0.3, 0.55, -0.75], night: 1,
    fog: [40, 250], hemi: ['#b48cd0', '#1c1018', 1.55], key: ['#ffb07a', 0.8],
    cloud: '#6a3058', cloudShade: '#2e1228', city: 1, arc: [0, 4], cityCol: '#14081a', windows: 1, neon: 1.3,
    water: '#24162e', rain: 1, stars: 0, beams: 1, cover: 0.72, cityH: 1.45, pyramids: 0, haze: 0.38,
  },
  chiLake: { // a clear summer night on Lake Michigan: the moon over the water, stars, the city a
    // wall of lights to the west, the pier and its wheel lit up
    skyTop: '#020720', skyBot: '#22407a', sun: '#eef2ff', sunDir: [0.72, 0.28, -0.3], night: 1,
    fog: [60, 340], hemi: ['#7090e0', '#0e1830', 1.55], key: ['#c0d0ff', 1.0],
    cloud: '#2a3c70', cloudShade: '#121c3c', city: 1, arc: [Math.PI, 1.5], cityCol: '#080c1c', windows: 1, neon: 1.3,
    water: '#0c1c46', rain: 0, stars: 0.85, beams: 0.7, cover: 0.08, cityH: 1.5, pyramids: 0, haze: 0.32,
  },
  chiNight: { // a windy night among the supertalls: smog racing, searchlights, every window lit
    skyTop: '#05061a', skyBot: '#2e2252', sun: '#e8ecff', sunDir: [-0.3, 0.45, -0.8], night: 1,
    fog: [70, 300], hemi: ['#7078cc', '#120e22', 1.35], key: ['#a8b8ff', 0.8],
    cloud: '#3a3458', cloudShade: '#1e1a34', city: 1, arc: [0, 4], cityCol: '#141022', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.5, beams: 1, cover: 0.3, cityH: 1.5, pyramids: 0, haze: 0.38,
  },
  chiArena: { // the BULL PEN on a game night: a crimson haze over the city, white floodlights on the
    // court, the skyline lit all round the stands
    skyTop: '#0b0410', skyBot: '#561828', sun: '#fff0e8', sunDir: [-0.45, 0.6, -0.55], night: 1,
    fog: [60, 300], hemi: ['#d0a8c4', '#2a1420', 1.7], key: ['#fff2e4', 1.35],
    cloud: '#4a2034', cloudShade: '#220e1a', city: 1, arc: [0, 4], cityCol: '#12060e', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.3, beams: 1, cover: 0.35, cityH: 1.3, pyramids: 0, haze: 0.35,
  },
  chiBonus: { // SERVER CORE, NEO CHICAGO: a red power sky over the night
    skyTop: '#160410', skyBot: '#6a1830', sun: '#ffe0d0', sunDir: [0.4, 0.5, -0.7], night: 1, power: 0.55,
    fog: [70, 280], hemi: ['#e0a8b8', '#2a0e18', 1.5], key: ['#ffe0d0', 1.0],
    cloud: '#5a2034', cloudShade: '#2a0c18', city: 0, arc: [0, 4], cityCol: '#160610', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.5, beams: 0,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { taurus: { model: (M, e) => taurusModel(M, e), update: (R, e, g, dt, t, P) => taurusUpdate(R, e, g, dt, t, P) } },
};
