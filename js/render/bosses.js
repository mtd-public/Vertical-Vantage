// Boss views: kind → { model(M, e) → Object3D, update(R, e, g, dt, t, P) }. R is the GameRenderer
// (R.flashModel(g, on) swaps in the hit-flash material; R.theme is the stage's theme). The laser
// beam (e.beam) and the danger zones (w.zones) are drawn by the renderer for every kind.
import * as MD from './models.js';
import { PACK_BOSS_VIEWS } from './packs/index.js';

export const BOSS_VIEWS = {
  arachne: { model: (M) => MD.bossModel(M), update: (R, e, g, dt, t, P) => R.updateArachne(e, g, dt, t, P) },
  ...PACK_BOSS_VIEWS,
};
