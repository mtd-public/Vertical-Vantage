// EGYPT · boss — HALL OF JUDGMENT. In the Duat under a lapis night: a hypostyle hall of papyrus
// columns, the throne of Osiris on its dais, four canopic jars (the scarabs crawl out of them) and,
// in the north, the giant scales of the Weighing of the Heart: two pans see-saw between 2 and 8 m,
// lifts up to a stomp on MECHA ANUBIS's head. The gate in the south wall opens when it falls.
//
//               north wall · THRONE DAIS 4.5 · the scales: post 14, pans ↕ 2–8 m
//   [column]  [jar]                                                [jar]  [column]
//   [column]                       MECHA ANUBIS                           [column]
//   [column]  [jar]                                                [jar]  [column]
//   [column]                          START → EXIT (south gate)            [column]
import { rect, disc, box, mv } from '../kit.js';
import { walls } from './egypt-kit.js';

const A = { x0: -34, x1: 34, z0: -28, z1: 26, floor: 0, ceil: 30 };
const plats = [];
const P = (...a) => plats.push(...a);

// the hall: its floor (the inlaid judgment floor), the pylon walls (the south gate in the middle)
P(rect(0, -1, 72, 58, A.floor, { thick: 4, style: 'eg-judgmentFloor' }));
P(...walls(-36, 36, -30, 28, -4, 14, [{ side: 's', a0: -6, a1: 6, bot: 0, top: 11 }], { style: 'eg-pylon', floor: 0 }));
// the throne of Osiris on its dais against the north wall (cover, a perch)
P(box(-8, 8, -30, -24, 4.5, { thick: 4.5, style: 'eg-dais' }));
// papyrus columns down both sides (perches of different heights: shoot down on it, or drop onto its head)
const COLS = [];
for (const [x, z, top] of [[-27, -17, 8.5], [-27, -5, 10.5], [-27, 7, 7.5], [-27, 19, 9.5], [27, -17, 9.5], [27, -5, 7.5], [27, 7, 10.5], [27, 19, 8.5]]) {
  const c = disc(x, z, 1.7, top, { thick: top, style: 'eg-column', tint: COLS.length });
  COLS.push(c); P(c);
}
// the canopic jars (cover; the scarab minions crawl out of them)
const JARS = [[-17, -9], [17, -9], [-17, 13], [17, 13]];
JARS.forEach(([x, z], i) => P(disc(x, z, 1.4, 3.6, { thick: 3.6, style: 'eg-canopic', tint: i })));
// the scales of the Weighing of the Heart: the fulcrum post (a perch at 14) and two pans see-sawing
// (opposed: one is always low enough to hop on from the floor)
const SCALE = { x: 0, z: -17, span: 9 };
P(disc(SCALE.x, SCALE.z, 1.1, 14, { thick: 14, style: 'eg-scalePost' }));
const PANS = [plats.length, plats.length + 1];
P(disc(SCALE.x - SCALE.span, SCALE.z, 3.0, 5, { thick: 0.6, style: 'eg-scalePan', tint: 0, move: mv('y', 3, 7, 0) }));
P(disc(SCALE.x + SCALE.span, SCALE.z, 3.0, 5, { thick: 0.6, style: 'eg-scalePan', tint: 1, move: mv('y', 3, 7, 0.5) }));

export default {
  id: 'egypt-boss', name: 'HALL OF JUDGMENT', sub: 'THE DUAT · 00:00 · THE HOUR OF MAAT · BOSS', theme: 'egyptDuat', song: 'weighingHeart',
  seed: 8004, par: 240, killY: -10, objective: 'boss', bossName: 'MECHA ANUBIS',
  arena: A,
  start: { x: 0, y: A.floor, z: 19, yaw: 0 },
  plats,
  boss: { x: 0, y: A.floor, z: -3, kind: 'anubis', jars: JARS, pans: PANS, scale: SCALE },
  drives: [],
  exit: { x: 0, y: A.floor, z: 22, yaw: 0 },
  portal: null,
  enemies: [
    { type: 'drone', x: -18, y: 11, z: 2 },
    { type: 'drone', x: 18, y: 11, z: 2 },
  ],
  pickups: [
    { type: 'health', x: COLS[1].x, y: COLS[1].h + 1, z: COLS[1].z, respawn: 20 },
    { type: 'health', x: COLS[6].x, y: COLS[6].h + 1, z: COLS[6].z, respawn: 20 },
    { type: 'health', x: -5, y: 5.5, z: -26, respawn: 25 },
    { type: 'healthBig', x: SCALE.x, y: 15, z: SCALE.z, respawn: 45 },
    { type: 'spread', x: JARS[2][0], y: 4.6, z: JARS[2][1], respawn: 25 },
    { type: 'rapid', x: JARS[1][0], y: 4.6, z: JARS[1][1], respawn: 25 },
    { type: 'rocket', x: COLS[3].x, y: COLS[3].h + 1, z: COLS[3].z, respawn: 30 },
    { type: 'rocket', x: COLS[4].x, y: COLS[4].h + 1, z: COLS[4].z, respawn: 30 },
    { type: 'slowmo', x: 5, y: 5.5, z: -26, respawn: 35 },
    { type: 'overdrive', x: COLS[0].x, y: COLS[0].h + 1, z: COLS[0].z, respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'eg-duatRing', x: 0, y: -2, z: 0, r: 230, seed: 84 },
    { kind: 'eg-giza', x: 40, y: -6, z: -620, yaw: 0, s: 1.3, glow: 1, night: 1 },
  ],
};
