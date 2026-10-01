// The stage list, pack by pack. Pure data: the game, the tools and the JSON exporter read this.
//   PACKS   [{ id, name, sub, color, stages: [3 stages + a boss stage] }] in play order
//   STAGES  every stage in play order; stage.pack is its pack's id, stage.packIdx its slot (0..3)
//   BONUS   stage id → its SERVER CORE bonus arena (stages with a portal)
import { PACKS } from './packs/index.js';
import { BONUS as TOKYO_BONUS, makeBonus } from './bonus.js';

export { PACKS };
export const STAGES = [];
for (const pk of PACKS) pk.stages.forEach((s, i) => { s.pack = pk.id; s.packIdx = i; STAGES.push(s); });
export const BONUS = { ...TOKYO_BONUS };
STAGES.forEach((s, i) => { if (s.portal && !BONUS[s.id]) BONUS[s.id] = makeBonus(s, i); });
export const bonusFor = (stage) => BONUS[stage.id] || null;
export const packOf = (stage) => PACKS.find((p) => p.id === stage.pack) || PACKS[0];
