// Per-boss sim-checks (tools/sim-check.mjs runs the generic boss checks for every boss stage,
// then the kind's own checks from here, if it has any).
import kraken from './kraken.mjs';
import taurus from './taurus.mjs';
import tremor from './tremor.mjs';
import stormcrow from './stormcrow.mjs';
import dragon from './dragon.mjs';
import centurion from './centurion.mjs';
import dreadnought from './dreadnought.mjs';

export const BOSS_CHECKS = { kraken, taurus, tremor, stormcrow, dragon, centurion, dreadnought };
