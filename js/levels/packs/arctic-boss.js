// ARCTIC VAULT · boss — COLD STORAGE. The ice cavern under the mountain where the archive's spare
// cooling is a glacier: POLARIS, the vault's polar-bear warden mech, guards the deep door. Columns of
// ice from floor to roof are the only cover from its frost breath; broken stumps, frozen crates and
// ledges along the cavern walls are perches (and the way onto its back). The door east opens when it falls.
//
//           north ledges 9 / 12 m              perch 16 (NE)
//    ┌──────────────────────────────────────────────────────┐
//    │  stump      ║col║         stump          crate        │
//  W │                     ║col║                  ║col║     │ E
//  ledge 6 START →            POLARIS                 EXIT ← the deep door
//    │  crate          ║col║          stump                  │
//    │         stump                       stump    crate    │
//    └──────────────────────────────────────────────────────┘
//           south ledges 12 / 7.5 m            perch 16 (SW)
import { rect, disc, box } from '../kit.js';

const A = { x0: -34, x1: 34, z0: -26, z1: 26, floor: 0, ceil: 28 };
const plats = [];
const P = (...a) => plats.push(...a);

// the shell: the ice floor, the cavern walls, the roof
P(rect(0, 0, 76, 60, A.floor, { thick: 4, style: 'arc-icefloor' }));
P(box(-40, 40, -32, -28, 30, { thick: 34, style: 'arc-cavewall', tint: 0 }), box(-40, 40, 28, 32, 30, { thick: 34, style: 'arc-cavewall', tint: 1 }));
P(box(-40, -36, -28, 28, 30, { thick: 34, style: 'arc-cavewall', tint: 2 }), box(36, 40, -28, 28, 30, { thick: 34, style: 'arc-cavewall', tint: 3 }));
P(rect(0, 0, 80, 64, 30, { thick: 2, style: 'arc-caveceil' }));
// ledges along the walls (perches above its reach) and two high perches in the corners
P(box(-36, -31, -16, 16, 6, { thick: 6, style: 'arc-iceledge' }));
P(box(-28, -8, -28, -24, 9, { thick: 1.6, style: 'arc-iceledge', tint: 1 }), box(8, 28, -28, -24, 12, { thick: 1.6, style: 'arc-iceledge', tint: 2 }));
P(box(-28, -4, 24, 28, 12, { thick: 1.6, style: 'arc-iceledge', tint: 2 }), box(4, 28, 24, 28, 7.5, { thick: 1.6, style: 'arc-iceledge', tint: 1 }));
P(box(30, 36, -28, -22, 16, { thick: 1.6, style: 'arc-iceledge', tint: 3 }), box(-36, -30, 22, 28, 16, { thick: 1.6, style: 'arc-iceledge', tint: 3 }));
// ice columns floor to roof: cover from the breath
const COLS = [[-15, -9, 2.3], [15, 9, 2.3], [-5, 15, 2.1], [7, -15, 2.1]];
for (const [x, z, r] of COLS) P(disc(x, z, r, 28, { thick: 28, style: 'arc-icecolumn' }));
// broken stumps (perches: a hop from the top lands on its back) and frozen crates (low cover)
const STUMPS = [[-24, 5, 1.6, 4.5], [-11, -19, 1.5, 3.6], [22, -15, 1.6, 6.5], [12, 19, 1.5, 4.8], [26, 12, 1.4, 7.4], [-24, -14, 1.4, 5.6]];
STUMPS.forEach(([x, z, r, top], i) => P(disc(x, z, r, top, { thick: top, style: 'arc-icestump', tint: i })));
P(rect(-6, -2, 3.2, 2.2, 2, { thick: 2, yaw: 0.4, style: 'arc-crate', tint: 2 }), rect(18, -2, 2.4, 3.4, 2.2, { thick: 2.2, yaw: -0.3, style: 'arc-crate', tint: 4 }));
P(rect(-18, 20, 3, 2.4, 1.8, { thick: 1.8, yaw: 0.2, style: 'arc-crate', tint: 5 }), rect(2, 22, 2.6, 2.6, 2.4, { thick: 2.4, style: 'arc-crate', tint: 6 }));
P(rect(29, 20, 2.4, 2.4, 2.4, { thick: 2.4, style: 'arc-crate', tint: 1 }), rect(29, -19, 2.4, 2.4, 3.2, { thick: 3.2, style: 'arc-crate', tint: 3 }));
// the deep door in the east wall (scenery: the exit gate stands in front of it)
P(rect(35, 0, 2, 10, 9, { thick: 9, style: 'arc-deepdoor' }));

export default {
  id: 'arctic-boss', name: 'COLD STORAGE', sub: 'PLATÅBERGET · -40 M · -18 °C · BOSS', theme: 'arcticCavern', song: 'polaris',
  seed: 9004, par: 240, killY: -10, objective: 'boss', bossName: 'POLARIS',
  arena: A,
  start: { x: -28, y: A.floor, z: 0, yaw: -Math.PI / 2 },
  plats,
  boss: { x: 8, y: A.floor, z: 0, kind: 'polaris' },
  drives: [],
  exit: { x: 30, y: A.floor, z: 0, yaw: Math.PI / 2 },
  portal: null,
  enemies: [
    { type: 'spiker', x: -18, y: 9, z: -26 },
    { type: 'spiker', x: 16, y: 7.5, z: 26 },
    { type: 'drone', x: -14, y: 12, z: 18 },
  ],
  pickups: [
    { type: 'health', x: -33.5, y: 7, z: 10, respawn: 20 },
    { type: 'health', x: 18, y: 13, z: -26, respawn: 22 },
    { type: 'health', x: -24, y: 5.5, z: 5, respawn: 25 },
    { type: 'healthBig', x: -33, y: 17, z: 25, respawn: 45 },
    { type: 'spread', x: -20, y: 13, z: 26, respawn: 25 },
    { type: 'rapid', x: 22, y: 7.5, z: -15, respawn: 25 },
    { type: 'rocket', x: 33, y: 17, z: -25, respawn: 30 },
    { type: 'rocket', x: -11, y: 4.6, z: -19, respawn: 30 },
    { type: 'slowmo', x: 26, y: 8.4, z: 12, respawn: 35 },
    { type: 'overdrive', x: -14, y: 10, z: -26, respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'arc-cavern', x: 0, y: 0, z: 0, seed: 941 },
  ],
};
