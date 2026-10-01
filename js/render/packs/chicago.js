// Render side of NEO CHICAGO: its themes (an overcast Loop morning, a bright lakeshore afternoon, a
// windy Skydeck night, a red sundown over the BULL PEN, and the bonus core), its platform styles
// (render/packs/chicago-styles.js), distant landmarks (chicago-backdrops.js) and TAURUS-312's view
// (chicago-taurus.js).
import { STYLES } from './chicago-styles.js';
import { BACKDROPS } from './chicago-backdrops.js';
import { taurusModel, taurusUpdate } from './chicago-taurus.js';

const themes = {
  chiLoop: { // overcast morning over the drowned grid; the canals run green
    skyTop: '#8796a8', skyBot: '#d8dcde', sun: '#fff4dc', sunDir: [0.55, 0.35, -0.5], night: 0,
    fog: [90, 340], hemi: ['#e6ecf2', '#5a6470', 1.75], key: ['#fff0dc', 1.5],
    cloud: '#eef0f2', cloudShade: '#aab4c0', city: 1, arc: [0, 4], cityCol: '#7a8696', windows: 0.05, neon: 0.5,
    water: '#3e7268', rain: 0, stars: 0, beams: 0, cover: 0.7, cityH: 1.3, pyramids: 0, haze: 0.5,
  },
  chiLake: { // a bright summer afternoon on Lake Michigan; the city stands west
    skyTop: '#2a78e8', skyBot: '#c6e6ff', sun: '#fff6d0', sunDir: [0.45, 0.62, -0.55], night: 0,
    fog: [110, 440], hemi: ['#f4f8ff', '#6a7a6a', 1.75], key: ['#fff4dc', 2.3],
    cloud: '#ffffff', cloudShade: '#dbe8f8', city: 1, arc: [Math.PI, 1.5], cityCol: '#9aaabe', windows: 0, neon: 0.4,
    water: '#2a8cc0', rain: 0, stars: 0, beams: 0, cover: 0.12, cityH: 1.4, pyramids: 0, haze: 0.45,
  },
  chiNight: { // a windy night among the supertalls: smog racing, searchlights, every window lit
    skyTop: '#05061a', skyBot: '#2a2048', sun: '#e8ecff', sunDir: [-0.3, 0.45, -0.8], night: 1,
    fog: [70, 300], hemi: ['#6a72c0', '#120e22', 1.25], key: ['#a8b8ff', 0.75],
    cloud: '#3a3458', cloudShade: '#1e1a34', city: 1, arc: [0, 4], cityCol: '#141022', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.5, beams: 1, cover: 0.3, cityH: 1.5, pyramids: 0, haze: 0.4,
  },
  chiArena: { // sundown over the BULL PEN: a red sky behind the stands
    skyTop: '#2a1650', skyBot: '#ff8c52', sun: '#ffb070', sunDir: [-0.8, 0.15, -0.45], night: 0.25,
    fog: [70, 300], hemi: ['#ffd8c0', '#4a3048', 1.6], key: ['#ffc090', 1.9],
    cloud: '#ffc8a0', cloudShade: '#c86a7a', city: 1, arc: [0, 4], cityCol: '#4a3050', windows: 0.6, neon: 1.0,
    water: null, rain: 0, stars: 0.1, beams: 0, cover: 0.2, cityH: 1.2, pyramids: 0, haze: 0.4,
  },
  chiBonus: { // SERVER CORE, NEO CHICAGO: a red power sky
    skyTop: '#a8102a', skyBot: '#ffc8a0', sun: '#fff0c0', sunDir: [0.4, 0.5, -0.7], night: 0.2, power: 1,
    fog: [80, 300], hemi: ['#fff0e8', '#6a3040', 1.7], key: ['#fff0dc', 2.0],
    cloud: '#ffe8e0', cloudShade: '#e89aa0', city: 0, arc: [0, 4], cityCol: '#6a3040', windows: 0.3, neon: 1,
    water: null, rain: 0, stars: 0.1, beams: 0,
  },
};

export default {
  themes,
  styles: STYLES,
  backdrops: BACKDROPS,
  bosses: { taurus: { model: (M, e) => taurusModel(M, e), update: (R, e, g, dt, t, P) => taurusUpdate(R, e, g, dt, t, P) } },
};
