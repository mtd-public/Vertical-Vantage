// Render side of the level packs: each pack file adds { themes, styles, backdrops, bosses }.
//   themes     theme name → theme (see render/themes.js for the fields)
//   styles     platform style → (K, p, th, rng, H) builds its pieces into Kit K (render/level-view.js)
//   backdrops  backdrop kind → (o, th, M, H) returns an Object3D: distant landmarks, render-only
//   bosses     boss kind → { model(M, e), update(R, e, g, dt, t, P) }
import ocean from './ocean.js';
import chicago from './chicago.js';
import sanfran from './sanfran.js';
import seattle from './seattle.js';
import shanghai from './shanghai.js';
import euro from './euro.js';
import fortress from './fortress.js';

const ALL = [ocean, chicago, sanfran, seattle, shanghai, euro, fortress];
const merge = (key) => Object.assign({}, ...ALL.map((p) => (p && p[key]) || {}));
export const PACK_THEMES = merge('themes');
export const PACK_STYLES = merge('styles');
export const PACK_BACKDROPS = merge('backdrops');
export const PACK_BOSS_VIEWS = merge('bosses');
