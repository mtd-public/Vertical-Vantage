// Stage 4 — WAREHOUSE 13. OmniCorp's logistics hall at night: ARACHNE-9, a spider mech, waits in
// the middle. It chases, pounces, sweeps a laser, climbs the long walls and crawls the ceiling.
// The exit gate on the east floor opens when it dies.
//
//   north wall (it climbs here) ─────────────────────────────
//   [rack]                                            [rack]
//   catwalk 8 m (west)        ARACHNE-9           catwalk 8 m (east)
//   + upper catwalk 15 m        (centre)              EXIT gate (floor, east)
//   lift ↕            crates (cover)          lift ↕
//   [rack]                    START                   [rack]
//   south wall (it climbs here) ─────────────────────────────
import { rect, bob, mv } from './kit.js';

const A = { x0: -30, x1: 30, z0: -26, z1: 26, floor: 0, ceil: 22, climbX: [-14, 14] }; // climbX: wall lane clear of the corner racks
const plats = [];
const P = (...a) => plats.push(...a);
const crate = (x, z, top, s = 2.4, tint = 0) => rect(x, z, s, s, top, { thick: s, style: 'crate', tint });

// the shell: floor, four walls, ceiling (solid: the boss crawls all of it)
P(rect(0, 0, 66, 58, A.floor, { thick: 4, style: 'floor' }));
P(rect(0, A.z0 - 1.5, 66, 3, 24, { thick: 26, style: 'wall', tint: 0 }), rect(0, A.z1 + 1.5, 66, 3, 24, { thick: 26, style: 'wall', tint: 1 }));
P(rect(A.x0 - 1.5, 0, 3, 52, 24, { thick: 26, style: 'wall', tint: 2 }), rect(A.x1 + 1.5, 0, 3, 52, 24, { thick: 26, style: 'wall', tint: 3 }));
P(rect(0, 0, 66, 58, A.ceil + 2, { thick: 2, style: 'ceiling' }));
// catwalks along the short walls (the boss never climbs those)
P(rect(-27.6, 0, 4.4, 40, 8, { thick: 0.4, style: 'catwalk' }), rect(27.6, 0, 4.4, 40, 8, { thick: 0.4, style: 'catwalk' }));
P(rect(-27.6, 0, 4.4, 22, 15, { thick: 0.4, style: 'catwalk' }));
// shelving racks in the corners (their tops are perches)
for (const [x, z] of [[-23, -21.5], [23, -21.5], [-23, 21.5], [23, 21.5]]) P(rect(x, z, 9, 3, 10, { thick: 10, style: 'rack' }));
// crate steps up to the catwalks
P(crate(-22, -9, 2.4, 2.4, 1), crate(-24.6, -11.5, 2.4, 2.4, 2), crate(-24.6, -11.5, 4.8, 2.4, 3));
P(crate(22, 9, 2.4, 2.4, 4), crate(24.6, 11.5, 2.4, 2.4, 5), crate(24.6, 11.5, 4.8, 2.4, 6));
// hover-pallet lifts: floor ↕ catwalk
P(rect(-21, 6, 3.6, 3.6, 4.8, { thick: 0.6, style: 'pad', move: mv('y', 3.9, 7, 0), bob: null }));
P(rect(21, -6, 3.6, 3.6, 4.8, { thick: 0.6, style: 'pad', move: mv('y', 3.9, 7, 0.5), bob: null }));
// low cover from the laser, out of the boss's middle
P(crate(-11, 9, 2.4, 2.4, 2), crate(-9.2, 10.4, 1.6, 1.6, 4), crate(11, -9, 2.4, 2.4, 5), crate(9.4, -10.6, 1.6, 1.6, 0));
P(crate(-12, -12, 2.4, 3, 6), crate(12, 12, 2.4, 3, 3));

export default {
  id: 'warehouse', name: 'WAREHOUSE 13', sub: 'OMNICORP LOGISTICS · 03:50 · BOSS', theme: 'warehouse', music: 'arachne',
  seed: 44, par: 200, killY: -10, objective: 'boss', bossName: 'ARACHNE-9',
  arena: A,
  start: { x: 0, y: 0, z: 20, yaw: 0 },
  plats,
  boss: { x: 0, y: A.floor, z: -6 },
  drives: [],
  exit: { x: 25, y: 0, z: 0, yaw: Math.PI / 2 },
  portal: null,
  enemies: [
    { type: 'spiker', x: -27.6, y: 8, z: 8 },
    { type: 'spiker', x: 27.6, y: 8, z: -8 },
    { type: 'drone', x: -10, y: 13, z: 18 },
  ],
  pickups: [
    { type: 'health', x: -27.6, y: 9, z: 16, respawn: 20 },
    { type: 'health', x: 27.6, y: 9, z: -16, respawn: 20 },
    { type: 'health', x: -16, y: 1, z: 20, respawn: 25 },
    { type: 'healthBig', x: -27.6, y: 16, z: 0, respawn: 45 },
    { type: 'spread', x: -11, y: 3.4, z: 9, respawn: 25 },
    { type: 'rapid', x: 11, y: 3.4, z: -9, respawn: 25 },
    { type: 'rocket', x: 23, y: 11, z: -21.5, respawn: 30 },
    { type: 'rocket', x: -23, y: 11, z: 21.5, respawn: 30 },
    { type: 'slowmo', x: 27.6, y: 9, z: 12, respawn: 35 },
    { type: 'slowmo', x: -23, y: 11, z: -21.5, respawn: 35 },
    { type: 'overdrive', x: 23, y: 11, z: 21.5, respawn: 40 },
  ],
  lasers: [],
};
