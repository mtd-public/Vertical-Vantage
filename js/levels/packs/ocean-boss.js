// OCEAN CORE · Boss — BRINE POOL. The heart of the desal platform: a round pool of hot brine
// ringed by eight pump decks and the catwalks between them, open sea all round. KRAKEN-OS lives in
// the pool: it surfaces at the rim (bubbles and a red ring warn where), slams tentacles onto the
// deck you stand on, sweeps its eye laser, spits water-cannon bolts, calls drones, and dives to
// move. Bounce off its dome when it's up; shoot the eye. The exit gate on the north deck opens
// when it dies.
//
//                 N deck: EXIT
//        NW pillar  ╲   |   ╱  NE pillar
//     W deck+pillar ═══ gantry 13 m over the pool ═══ E deck+pillar
//        SW pillar  ╱   |   ╲  SE pillar
//                 S deck: START
import { rect, disc } from '../kit.js';
import { away } from './ocean-kit.js';

const FLOOR = 4, POOL = 14, RING = 18;
const A = { x0: -26, x1: 26, z0: -26, z1: 26, floor: FLOOR, ceil: 30, pool: POOL, rim: 10.5, water: 0 };
const plats = [];
const P = (...a) => plats.push(...a);
const at = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];

// eight pump decks (inner edge on the pool rim) and the catwalks bridging the gaps between them
for (let k = 0; k < 8; k++) {
  const a = (k * Math.PI) / 4, [x, z] = at(a, RING);
  P(rect(x, z, 11, 8, FLOOR, { thick: FLOOR + 1, yaw: Math.PI / 2 - a, style: 'oc-pumpdeck', tint: k % 2 }));
  const b = a + Math.PI / 8, [bx, bz] = at(b, RING);
  P(rect(bx, bz, 7, 2.8, FLOOR - 0.04, { thick: 0.5, yaw: Math.PI / 2 - b, style: 'oc-catwalk' }));
}
// pump stacks: cover from the eye laser and the bolts, and perches (5.5 m up)
const PILLAR = FLOOR + 5.5;
const pillars = [0, 1, 3, 4, 5, 7].map((k) => { const [x, z] = at((k * Math.PI) / 4, k % 4 === 0 ? 20 : 19.5); return rect(x, z, 2.6, 2.6, PILLAR, { thick: 5.6, yaw: Math.PI / 2 - (k * Math.PI) / 4, style: 'oc-pillar' }); });
P(...pillars);
// the gantry over the pool, pillar to pillar (stomp it from above when it surfaces in the middle)
P(rect(0, 0, 35, 3, 13, { thick: 0.7, style: 'oc-gantry' }));
// low cover: valve skids on the north and south decks
P(rect(-5, 19, 2.4, 3, FLOOR + 1.6, { thick: 1.6, style: 'oc-skid' }), rect(4.5, -15.4, 3, 2.4, FLOOR + 1.6, { thick: 1.6, style: 'oc-skid', tint: 1 }));
// the pool itself (render only: its surface is drawn at the sea line; the slab sits below killY)
P(disc(0, 0, 1.5, -3, { thick: 0.5, style: 'oc-brine' }));

const [px1, pz1] = at(Math.PI / 4, 19.5), [px3, pz3] = at((3 * Math.PI) / 4, 19.5), [px5, pz5] = at((5 * Math.PI) / 4, 19.5), [px7, pz7] = at((7 * Math.PI) / 4, 19.5);

export default {
  id: 'ocean-boss', name: 'BRINE POOL', sub: 'DESAL PLANT 7 · 04:10 · BOSS', theme: 'oceanBrine', song: 'krakenOS',
  seed: 1044, par: 220, killY: -0.6, water: 0, objective: 'boss', bossName: 'KRAKEN-OS',
  arena: A,
  start: { x: 0, y: FLOOR, z: 20, yaw: 0 },
  plats,
  boss: { x: 0, y: 0, z: -A.rim, kind: 'kraken' },
  drives: [],
  exit: { x: 0, y: FLOOR, z: -19.5, yaw: 0 },
  portal: null,
  enemies: [
    { type: 'walker', x: 18, y: FLOOR, z: 2.5 },
    { type: 'walker', x: -18, y: FLOOR, z: -2.5 },
    { type: 'drone', x: -12, y: 12, z: 16 },
  ],
  pickups: [
    { type: 'health', x: 17, y: FLOOR + 1, z: 6, respawn: 20 },
    { type: 'health', x: -17, y: FLOOR + 1, z: -6, respawn: 20 },
    { type: 'health', x: 4, y: FLOOR + 1, z: 21, respawn: 25 },
    { type: 'healthBig', x: 0, y: 14, z: 0, respawn: 45 },
    { type: 'spread', x: px1, y: PILLAR + 1, z: pz1, respawn: 25 },
    { type: 'rapid', x: px5, y: PILLAR + 1, z: pz5, respawn: 25 },
    { type: 'rocket', x: px3, y: PILLAR + 1, z: pz3, respawn: 30 },
    { type: 'rocket', x: px7, y: PILLAR + 1, z: pz7, respawn: 30 },
    { type: 'slowmo', x: 20, y: PILLAR + 1, z: 0, respawn: 35 },
    { type: 'overdrive', x: -20, y: PILLAR + 1, z: 0, respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'oc-plant', x: -300, y: 0, z: -380, yaw: 0.5 },
    { kind: 'oc-spire', x: 260, y: 0, z: -560, s: 1.2 },
    { kind: 'oc-windfarm', x: 520, y: 0, z: 120, yaw: away(520, 120, 0, 0), n: 12 },
    { kind: 'oc-ship', x: -420, y: 0, z: 260, yaw: 1.2 },
    { kind: 'oc-rig', x: 300, y: 0, z: 420, yaw: -0.5 },
    { kind: 'oc-haven', x: -420, y: 0, z: -760, yaw: away(-420, -760, 0, 0), n: 14, w: 440, s: 0.7 },
  ],
};
