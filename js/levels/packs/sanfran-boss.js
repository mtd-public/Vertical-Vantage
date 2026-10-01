// NEW SAN FRANCISCO · boss — FAULT LINE. Bernal Hill at golden hour, the fog sea below and the Golden
// Gate's towers standing out of it on the horizon. TREMOR, a drilling mole mech, tunnels under the lawn.
// Stay off the open grass when the ground starts to rumble, or get up high: boulders, two stone terraces,
// the cypress canopies and the radio mast. The exit opens on the north lawn when it dies.
//
//   north: summit rock + radio mast (perch)          EXIT (0, -22)
//   [west terrace 4 m]   boulders · cypress     TREMOR      boulders · cypress   [east terrace 4 m]
//   [upper tier 8 m NW]                                                          [upper tier 8 m SE]
//                                   START (0, 22)
//   south: a low stone wall, then the slope down into the fog
import { rect } from '../kit.js';

const A = { x0: -30, x1: 30, z0: -26, z1: 26, floor: 0, ceil: 30 };
const plats = [];
const P = (...a) => plats.push(...a);
const boulder = (x, z, w, d, top, tint = 0) => rect(x, z, w, d, top, { thick: top + 1, style: 'sfBoulder', tint });

P(rect(0, 0, 80, 72, A.floor, { thick: 14, style: 'sfMeadow' })); // the lawn (x ±40, z ±36)
// terraces outside the fight box (it can't climb them), with stone steps up
P(rect(-35.5, 2, 9, 46, 4, { thick: 18, style: 'sfTerrace' }), rect(35.5, -2, 9, 46, 4, { thick: 18, style: 'sfTerrace' }));
P(rect(-36.5, -16, 7, 10, 8, { thick: 4, style: 'sfTerrace', tint: 1 }), rect(36.5, 16, 7, 10, 8, { thick: 4, style: 'sfTerrace', tint: 1 }));
P(boulder(-28.2, 12, 3, 3.2, 2), boulder(28.2, -12, 3, 3.2, 2, 1));
// the summit rock and the radio mast to the north, a low wall to the south
P(rect(10, -33.5, 24, 5, 5.5, { thick: 20, style: 'sfRock' }), rect(16, -33.5, 3, 3, 13.5, { thick: 8, style: 'sfMast' }));
P(rect(0, 34.5, 64, 1.2, 1.2, { thick: 1.6, style: 'sfWall' }));
// boulders for cover in the fight box (it works its way round them; it never surfaces inside one)
P(boulder(-12, 8, 4, 3, 2.6, 2), boulder(13, -6, 3.5, 4, 3, 1), boulder(-8, -14, 3, 3, 2.2), boulder(10, 14, 4, 3, 2.4, 2), boulder(-21, -4, 3, 5, 3.2, 1), boulder(21, 5, 3, 3, 2, 0));
// Monterey cypresses: a solid trunk, a flat wind-sheared canopy you can stand on
for (const [x, z, h] of [[18, -18, 9], [-17, 18, 9.5], [-35, 20, 13], [35, -21, 13]]) {
  P(rect(x, z, 1.3, 1.3, h - 3, { thick: h - 3 + (Math.abs(x) > 31 ? -4 : 0), style: 'sfTrunk' }));
  P(rect(x, z, 6.5, 6, h, { thick: 2.2, style: 'sfCanopy' }));
}

export default {
  id: 'sanfran-boss', name: 'FAULT LINE', sub: 'BERNAL HILL · 17:40 · BOSS', theme: 'sfPark', song: 'bossfight',
  seed: 3004, par: 210, killY: -12, cloudY: -26, objective: 'boss', bossName: 'TREMOR',
  arena: A,
  start: { x: 0, y: A.floor, z: 22, yaw: 0 },
  plats,
  boss: { x: 0, y: A.floor, z: -6, kind: 'tremor' },
  drives: [],
  exit: { x: 0, y: A.floor, z: -23, yaw: 0 },
  portal: null,
  enemies: [
    { type: 'spiker', x: -35.5, y: 4, z: 14 },
    { type: 'drone', x: 24, y: 9, z: 20 },
  ],
  pickups: [
    { type: 'health', x: -35.5, y: 5, z: -6, respawn: 20 },
    { type: 'health', x: 35.5, y: 5, z: 6, respawn: 20 },
    { type: 'health', x: 0, y: 1, z: 28, respawn: 25 },
    { type: 'healthBig', x: 16, y: 14.5, z: -33.5, respawn: 45 },
    { type: 'spread', x: -12, y: 3.6, z: 8, respawn: 25 },
    { type: 'rapid', x: 13, y: 4, z: -6, respawn: 25 },
    { type: 'rocket', x: -36.5, y: 9, z: -16, respawn: 30 },
    { type: 'rocket', x: 36.5, y: 9, z: 16, respawn: 30 },
    { type: 'slowmo', x: 18, y: 10, z: -18, respawn: 35 },
    { type: 'slowmo', x: -17, y: 10.5, z: 18, respawn: 35 },
    { type: 'overdrive', x: 35, y: 14, z: -21, respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'goldenGate', x: -270, y: -30, z: -540, yaw: 0.46, s: 0.36, orange: -0.2 },
    { kind: 'sfSkyline', x: 360, y: -34, z: -260, w: 200, d: 120, n: 18, hMin: 40, hMax: 120, salesforce: true },
    { kind: 'transamerica', x: 300, y: -34, z: -330, s: 0.5 },
    { kind: 'sutro', x: -420, y: -40, z: 60, s: 0.5 },
    { kind: 'alcatraz', x: 60, y: -26, z: -620, yaw: 0.2, s: 0.6 },
    { kind: 'hills', x: -60, y: -30, z: -900, len: 1200, h: 110, n: 7, color: '#8a8460' },
    { kind: 'fogBank', x: -520, y: -24, z: -240, yaw: 1.2, s: 1.4 },
    { kind: 'fogBank', x: 420, y: -24, z: 200, yaw: -1, s: 1.3 },
  ],
};
