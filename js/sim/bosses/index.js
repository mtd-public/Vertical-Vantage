// Boss kinds. A level's boss: { x, y, z, kind } (kind defaults to 'arachne'). A boss module's
// default export: { init(w, e, d), update(w, e, dt), down(w, e), stompable?(e), blocks?(w, e, shot) }.
//   init       set up the pose and fields (bosses/common.js initPose)
//   update     one step (world clock, slow-mo aware); handle 'dying' (common.js dyingTick)
//   down       health hit 0 (common.js down)
//   stompable  may you bounce off its back right now? (default: on the floor)
//   blocks     does this shot hit a shield instead? (default: never)
import { initBoss, updateBoss, bossDown } from '../boss.js';
import kraken from './kraken.js';
import taurus from './taurus.js';
import tremor from './tremor.js';
import stormcrow from './stormcrow.js';
import dragon from './dragon.js';
import centurion from './centurion.js';
import dreadnought from './dreadnought.js';

const arachne = { init: initBoss, update: updateBoss, down: bossDown, stompable: (e) => e.surf === 'floor' };
export const BOSS_KINDS = Object.fromEntries(Object.entries({ arachne, kraken, taurus, tremor, stormcrow, dragon, centurion, dreadnought }).filter(([, v]) => v));
export const bossKind = (e) => BOSS_KINDS[e.kind] || arachne;
