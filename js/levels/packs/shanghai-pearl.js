// SHANGHAI boss stage — PEARL TOWER. The JADE DRAGON coils round the Oriental Pearl's spire above
// a sea of neon smog. You fight on the flattened top of the great pink sphere: a 15 m deck round
// three columns, a ring of pearl pads at two heights outside it, three high perches, and the spire's
// two rings above (it won't dive at those: it breathes fire and spits pearls instead).
//
//   (plan, north = -Z; the dragon flies a loop 28–34 m out, outside every pad)
//
//            pad 4.5 (330°)     EXIT (deck, north)      pad 1.5 (270°)
//      perch 9.5 (300°)                                       ·
//                       step pod 5.5   [columns + rings 11 / 19]   step pod 5.5
//      pad 1.5 (210°)        low pod 1.8        DECK r 15        low pod 1.8      pad 1.5 (30°)
//      perch 9.5 (180°)                        START                       perch 9.5 (60°)
//            pad 4.5 (150°)                  pad 4.5 (90°, south)
import { disc } from '../kit.js';

const A = { x0: -42, x1: 42, z0: -42, z1: 42, floor: 0, ceil: 40 };
const plats = [];
const P = (...a) => plats.push(...a);
const at = (r, deg) => [Math.cos(deg * Math.PI / 180) * r, Math.sin(deg * Math.PI / 180) * r];

// the sphere's flattened top: the main deck
P(disc(0, 0, 15, A.floor, { thick: 6, style: 'pearlDeck' }));
// the spire: three columns (cover from the fire breath) and two rings round them
for (const a of [90, 210, 330]) { const [x, z] = at(2.6, a); P(disc(x, z, 1.3, 36, { thick: 36, style: 'pearlColumn' })); }
P(disc(0, 0, 4.8, 11, { thick: 2.6, style: 'pearlRing' }));
P(disc(0, 0, 3.0, 19, { thick: 2.4, style: 'pearlRing', tint: 1 }));
// step pods up to the lower ring, and low pods on the deck (cover, and a step for a higher jump)
for (const a of [60, 180, 300]) { const [x, z] = at(8, a); P(disc(x, z, 1.3, 5.5, { thick: 1, style: 'pearlPad', tint: 2 })); }
for (const a of [0, 120, 240]) { const [x, z] = at(10, a); P(disc(x, z, 1.5, 1.8, { thick: 1.8, style: 'pearlPod' })); }
// the ring of pearl pads outside the deck (alternately 1.5 and 4.5 m) and three high perches
const pads = [30, 90, 150, 210, 270, 330].map((a, i) => { const [x, z] = at(22, a); const p = disc(x, z, 3.4, i % 2 ? 4.5 : 1.5, { thick: 1.4, style: 'pearlPad' }); P(p); return p; });
const perches = [60, 180, 300].map((a) => { const [x, z] = at(20, a); const p = disc(x, z, 2.6, 9.5, { thick: 1.2, style: 'pearlPad', tint: 1 }); P(p); return p; });
const on = (p, up = 1) => ({ x: p.x, y: p.h + up, z: p.z });

export default {
  id: 'shanghai-boss', name: 'PEARL TOWER', sub: 'ORIENTAL PEARL · 00:30 · NEON SMOG · BOSS', theme: 'shanghaiPearl', song: 'jadeDragon',
  seed: 5004, par: 230, killY: -26, cloudY: -32, objective: 'boss', bossName: 'JADE DRAGON',
  arena: A,
  start: { x: 0, y: A.floor, z: 12.5, yaw: 0 },
  plats,
  boss: { x: 0, y: 12, z: -31, kind: 'dragon', cx: 0, cz: 0 },
  drives: [],
  exit: { x: 0, y: A.floor, z: -12.5, yaw: 0 },
  portal: null,
  enemies: [
    { type: 'turret', x: pads[5].x, y: pads[5].h, z: pads[5].z },
    { type: 'drone', x: -16, y: 9, z: 12 },
  ],
  pickups: [
    { type: 'health', ...on(pads[0]), respawn: 22 },
    { type: 'health', ...on(pads[3]), respawn: 22 },
    { type: 'health', x: -9, y: 1, z: 5, respawn: 25 },
    { type: 'healthBig', x: -3.1, y: 12, z: 1.8, respawn: 45 },
    { type: 'rapid', ...on(pads[1]), respawn: 25 },
    { type: 'spread', ...on(pads[2]), respawn: 25 },
    { type: 'rocket', ...on(pads[4]), respawn: 30 },
    { type: 'slowmo', ...on(perches[0]), respawn: 35 },
    { type: 'rocket', ...on(perches[1]), respawn: 30 },
    { type: 'overdrive', x: 0, y: 20, z: -2, respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'pearlUpper', x: 0, y: 36, z: 0 },
    { kind: 'pearlLegs', x: 0, y: -6, z: 0 },
    { kind: 'twistTower', x: -170, y: -40, z: -300, s: 1.1 },
    { kind: 'bottleOpener', x: -40, y: -40, z: -360, s: 1.05 },
    { kind: 'jinmaoTower', x: -250, y: -40, z: -200, s: 1 },
    { kind: 'bundRow', x: 380, y: -40, z: 40, yaw: -Math.PI / 2, s: 1.2 },
    { kind: 'ledTowers', x: -260, y: -40, z: -360, w: 260, d: 90, n: 18, hMin: 50, hMax: 150 },
    { kind: 'ledTowers', x: 120, y: -40, z: -420, w: 280, d: 90, n: 16, hMin: 40, hMax: 130 },
    { kind: 'ledTowers', x: -380, y: -40, z: 120, w: 90, d: 280, n: 14, hMin: 40, hMax: 120 },
  ],
};
