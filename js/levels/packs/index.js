// The level packs, in play order. A pack = 3 stages + a boss stage around one theme. Pure data:
// the game, the tools and the JSON exporter read this (via js/levels/index.js).
// Each pack lives in its own file; packs with no stages yet are skipped.
import tokyo from './tokyo.js';
import ocean from './ocean.js';
import chicago from './chicago.js';
import sanfran from './sanfran.js';
import seattle from './seattle.js';
import shanghai from './shanghai.js';
import euro from './euro.js';
import fortress from './fortress.js';

export const PACKS = [tokyo, ocean, chicago, sanfran, seattle, shanghai, euro, fortress].filter((p) => p && p.stages && p.stages.length);
