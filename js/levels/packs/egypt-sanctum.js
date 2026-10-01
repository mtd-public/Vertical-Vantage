// EGYPT · stage 3 — INNER SANCTUM. Inside the Great Pyramid: torch-lit granite and limestone, every
// wall crawling with cyan data glyphs, the royal servers sealed in their sarcophagi. Up the Ascending
// Passage into the Grand Gallery (a tall corbelled slope with two pits and sliding stone bridges),
// through the Antechamber's rising portcullises into the King's Chamber, then up the north air
// shaft toward the light: the exit waits in the Star Chamber at its top.
//
// Map (north = -Z, up the page; floors in brackets):
//
//                       [STAR CHAMBER 67: EXIT]
//                        │ north air shaft: ledges 30.6 → 64.4
//              ┌──── KING'S CHAMBER [28] ─────┐  relieving beams 33 · 36.5 · 40 · 43.5 (DRIVE 3)
//              │ server sarcophagus           │
//              └──────── ANTECHAMBER [28]: three portcullises ──┘
//                        │
//                   GRAND GALLERY  floor steps 6.4 → 28, pits at the 4th and 7th steps (sliding
//                        │         bridges), corbel shelves up both walls (DRIVE 2 at the top, east)
//                   ascending passage (stairs 0 → 4)
//   QUEEN'S CHAMBER [0] ═ corridor ═ ENTRANCE HALL [0] ═ descending passage ↘ SUBTERRANEAN CHAMBER [-8]
//   pit · sliding blocks · DRIVE 1          START                               pit · rock: PORTAL
import { rect, disc, box, mv, laser } from '../kit.js';
import { stairs, walls, ceiling } from './egypt-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const DEEP = -22; // walls and pit sides run down to here (killY is -16: the pits are bottomless)
const floorBox = (x0, x1, z0, z1, top, o = {}) => box(x0, x1, z0, z1, top, { thick: top - (o.base ?? top - 3), style: o.style || 'eg-tombFloor', tint: o.tint ?? -1 });

// ---- the ENTRANCE HALL (START): floor 0, ceiling 10
P(floorBox(-10, 10, 0, 26, 0));
P(...walls(-10, 10, 0, 26, -3, 10, [
  { side: 'n', a0: -3, a1: 3, bot: 0, top: 7 }, // the ascending passage
  { side: 'w', a0: 4, a1: 10, bot: 0, top: 4.5 }, // the Queen's corridor
  { side: 'e', a0: 16, a1: 22, bot: -9, top: 4.5 }, // the descending passage
], { floor: 0 }));
P(ceiling(-10, 10, 0, 26, 10));
P(rect(-7, 18, 2.2, 5, 1.6, { thick: 1.6, style: 'eg-sarcophagus', tint: 0 }), rect(7, 8, 2.2, 5, 1.6, { thick: 1.6, style: 'eg-sarcophagus', tint: 1 }), rect(-6, 3, 5, 2.2, 1.6, { thick: 1.6, style: 'eg-sarcophagus', tint: 2 }));

// ---- the QUEEN'S CORRIDOR and CHAMBER: a bottomless pit across the chamber, two stone blocks
// sliding over it; DRIVE 1 on a pedestal beyond
P(floorBox(-22, -10, 4, 10, 0));
P(...walls(-20, -12, 4, 10, -3, 4.5, [], { sides: ['n', 's'], floor: 0 }));
P(ceiling(-20, -12, 4, 10, 4.5));
const QC = { x0: -48, x1: -22, z0: -10, z1: 20, pit0: -40, pit1: -28 };
P(floorBox(QC.pit1, QC.x1, QC.z0, QC.z1, 0, { base: DEEP }), floorBox(QC.x0, QC.pit0, QC.z0, QC.z1, 0, { base: DEEP }));
P(...walls(QC.x0, QC.x1, QC.z0, QC.z1, DEEP, 15, [{ side: 'e', a0: 4, a1: 10, bot: 0, top: 4.5 }], { floor: 0 }));
P(ceiling(QC.x0, QC.x1, QC.z0, QC.z1, 15, { tint: 1 }));
P(rect(-34, 1, 4, 5, 0, { thick: 1.4, style: 'eg-slider', move: mv('x', 4, 6, 0) }), rect(-34, 13, 4, 5, 0, { thick: 1.4, style: 'eg-slider', tint: 1, move: mv('x', 4, 6.5, 0.5) }));
P(rect(-44, 5, 3, 3, 1.4, { thick: 1.4, style: 'eg-pedestal' }));
P(rect(-25, -5, 2.2, 5, 1.6, { thick: 1.6, style: 'eg-sarcophagus', tint: 3 }), rect(-25, 16, 2.2, 5, 1.6, { thick: 1.6, style: 'eg-sarcophagus', tint: 4 }), rect(-45, 15, 3.6, 2.2, 1.6, { thick: 1.6, style: 'eg-sarcophagus', tint: 5 }));

// ---- the ASCENDING PASSAGE: stairs 0 → 4 up to the gallery
P(...stairs(0, -2, 0, -1, 6, 1.6, 0.4, 10, 0, { floor: -3, style: 'eg-tombStep' }));
P(...walls(-3, 3, -18, -2, -3, 9.5, [], { sides: ['w', 'e'], floor: 2 }));
P(ceiling(-3, 3, -18, -2, 9.5));

// ---- the GRAND GALLERY: ten floor steps (8 m long, 2.4 m up), pits at steps 3 and 6 (a stone block
// slides across each), corbel shelves 6.5 m up both walls all the way (the high road), a corbelled
// ceiling 14 m over each step
const G = { x0: -7, x1: 7, z0: -100, z1: -20 };
const gz0 = (i) => G.z1 - 8 * i, gz1 = (i) => G.z1 - 8 * (i + 1), gzm = (i) => G.z1 - 8 * i - 4; // (gz0 > gz1: south → north)
const gf = (i) => 4 + 2.4 * (i + 1);
const PITS = [3, 6];
for (let i = 0; i < 10; i++) {
  if (!PITS.includes(i)) P(floorBox(G.x0, G.x1, gz1(i), gz0(i), gf(i), { base: DEEP, style: 'eg-galleryStep', tint: i }));
  else P(rect(0, gzm(i), 4, 8, gf(i), { thick: 1.5, style: 'eg-slider', tint: i, move: mv('x', 5, 7, i * 0.17) }));
  for (const [a, b] of [[G.x0, G.x0 + 1.6], [G.x1 - 1.6, G.x1]]) P(box(a, b, gz1(i), gz0(i), gf(i) + 6.5, { thick: 1.0, style: 'eg-corbel', tint: i }));
  P(box(G.x0 - 2, G.x1 + 2, gz1(i), gz0(i), gf(i) + 16, { thick: 2, style: 'eg-galleryCeil', tint: i }));
}
P(...walls(G.x0, G.x1, G.z0, G.z1, DEEP, 46, [
  { side: 's', a0: -3, a1: 3, bot: 4, top: 9.5 },
  { side: 'n', a0: -3, a1: 3, bot: gf(9), top: gf(9) + 5 },
], { style: 'eg-galleryWall' }));

// ---- the ANTECHAMBER: three granite portcullises rise and fall (pass under while they're up)
const AF = gf(9); // 28
P(floorBox(-5, 5, -112, -102, AF));
P(...walls(-5, 5, -112, -102, AF - 3, AF + 6, [], { sides: ['w', 'e'], floor: AF }));
P(ceiling(-5, 5, -112, -102, AF + 6));
for (const [z, ph] of [[-104.5, 0], [-107, 0.3], [-109.5, 0.6]]) P(rect(0, z, 10, 1.0, AF + 7.4, { thick: 6, style: 'eg-portcullis', move: mv('y', 1.4, 5, ph) }));

// ---- the KING'S CHAMBER: the royal server's sarcophagus, the relieving chambers' granite beams
// climbing to the roof (DRIVE 3 on the top one), the north air shaft's door
const K = { x0: -14, x1: 14, z0: -138, z1: -114 };
P(floorBox(K.x0, K.x1, K.z0, K.z1, AF, { style: 'eg-graniteFloor' }));
P(...walls(K.x0, K.x1, K.z0, K.z1, AF - 3, 48, [
  { side: 's', a0: -3, a1: 3, bot: AF, top: AF + 5 },
  { side: 'n', a0: -3, a1: 3, bot: AF, top: AF + 5 },
], { style: 'eg-graniteWall', floor: AF }));
P(ceiling(K.x0, K.x1, K.z0, K.z1, 48, { style: 'eg-graniteCeil' }));
P(rect(-9, -126, 3.6, 7.5, AF + 2.2, { thick: 2.2, style: 'eg-kingServer' }));
const BEAMS = [[-118, 33], [-123, 36.5], [-128, 40], [-133, 43.5]].map(([z, top], i) => rect(0, z, 28, 2.0, top, { thick: 1.2, style: 'eg-beam', tint: i }));
P(...BEAMS);

// ---- the NORTH AIR SHAFT: ledges on alternate sides all the way up; the STAR CHAMBER at the top
const SH = { x0: -3, x1: 3, z0: -146, z1: -140 };
P(floorBox(SH.x0, SH.x1, SH.z0, SH.z1, AF));
P(box(-5, -3, SH.z0, SH.z1, 67, { thick: 67 - AF + 3, style: 'eg-shaftWall', tint: 2 }), box(3, 5, SH.z0, SH.z1, 67, { thick: 67 - AF + 3, style: 'eg-shaftWall', tint: 3 }));
P(box(-3, 3, -140, -138, 67, { thick: 67 - AF - 5, style: 'eg-shaftWall', tint: 1 })); // over the King's north door, up to the Star Chamber
const LEDGES = [];
for (let k = 0; k < 14; k++) { const s = k % 2 ? 1 : -1; LEDGES.push(rect(s * 1.7, (SH.z0 + SH.z1) / 2, 2.6, 6, 30.6 + 2.6 * k, { thick: 0.5, style: 'eg-shaftLedge', tint: k })); }
P(...LEDGES);
const STAR = 67;
P(floorBox(-8, 8, -160, SH.z0, STAR, { base: AF, style: 'eg-starFloor' }), floorBox(-8, -3, SH.z0, -138, STAR, { base: AF, style: 'eg-starFloor' }), floorBox(3, 8, SH.z0, -138, STAR, { base: AF, style: 'eg-starFloor' }));
P(...walls(-8, 8, -160, -138, STAR - 1, STAR + 9, [], { style: 'eg-starWall', floor: STAR }));
P(ceiling(-8, 8, -160, -138, STAR + 9, { style: 'eg-starCeil' }));

// ---- the DESCENDING PASSAGE and the SUBTERRANEAN CHAMBER (rough rock, a pit, the PORTAL on a rock)
P(...stairs(10, 19, 1, 0, 6, 0.8, -0.4, 20, 0, { floor: -12, style: 'eg-tombStep' }));
P(...walls(12, 28, 16, 22, -12, 5, [], { sides: ['n', 's'], floor: -3 }));
P(box(10, 20, 14, 24, 7, { thick: 2, style: 'eg-tombCeil' }), box(20, 28, 14, 24, 3, { thick: 2, style: 'eg-tombCeil' }));
const SC = { x0: 28, x1: 50, z0: 4, z1: 34 };
P(floorBox(SC.x0, 34, SC.z0, SC.z1, -8, { base: DEEP, style: 'eg-rockFloor' }), floorBox(44, SC.x1, SC.z0, SC.z1, -8, { base: DEEP, style: 'eg-rockFloor' }));
P(floorBox(34, 44, SC.z0, 12, -8, { base: DEEP, style: 'eg-rockFloor' }), floorBox(34, 44, 26, SC.z1, -8, { base: DEEP, style: 'eg-rockFloor' }));
P(...walls(SC.x0, SC.x1, SC.z0, SC.z1, DEEP, 2, [{ side: 'w', a0: 16, a1: 22, bot: -8, top: 1 }], { style: 'eg-rockWall', floor: -8 }));
P(ceiling(SC.x0, SC.x1, SC.z0, SC.z1, 2, { style: 'eg-rockCeil' }));
const ROCK = disc(39, 19, 2.4, -4.5, { thick: 14, style: 'eg-rock' });
P(ROCK);

const lasers = [
  laser(-15, 0, 7, 6, 3.2, Math.PI / 2, 2.8, 0.5, 0.2), // the Queen's corridor
  laser(0, gf(2), gzm(2), 14, 3.0, 0, 3, 0.5, 0), // hieroglyph curtains across the gallery, before each pit
  laser(0, gf(5), gzm(5), 14, 3.0, 0, 3, 0.5, 0.5),
  laser(0, AF, -139, 6, 3.0, 0, 3, 0.5, 0.4), // the air shaft's door
  laser(19.2, -4.8, 19, 6, 3.0, Math.PI / 2, 3, 0.5, 0), // half-way down the descending passage
];

const E9 = { x: G.x1 - 0.8, y: gf(9) + 6.5, z: gzm(9) };
export default {
  id: 'egypt-sanctum', name: 'INNER SANCTUM', sub: 'THE GREAT PYRAMID · INSIDE · TORCHLIGHT', theme: 'egyptTomb', song: 'tombHard',
  seed: 8003, par: 320, killY: -16,
  start: { x: 0, y: 0, z: 22, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -44, y: 1.4 + 1.1, z: 5 }, // on the pedestal past the Queen's Chamber's pit
    { x: E9.x, y: E9.y + 1.1, z: E9.z - 1 }, // the top of the gallery's east corbel shelf
    { x: 9, y: 43.5 + 1.1, z: -133 }, // the highest relieving beam
  ],
  exit: { x: 0, y: STAR, z: -153, yaw: 0 },
  portal: { x: ROCK.x, y: ROCK.h + 1.4, z: ROCK.z },
  bonusStyle: { theme: 'egyptBonusTomb', weapon: 'rocket', tag: 'KA' },
  enemies: [
    { type: 'walker', x: 4, y: 0, z: 14 },
    { type: 'guard', x: -18, y: 0, z: 7 },
    { type: 'spiker', x: -25, y: 0, z: 6 },
    { type: 'turret', x: -45, y: 0, z: -6 },
    { type: 'guard', x: 0, y: gf(1), z: gzm(1) },
    { type: 'turret', x: -3, y: gf(5), z: gzm(5) - 2.5 },
    { type: 'walker', x: G.x1 - 0.8, y: gf(6) + 6.5, z: gzm(6) },
    { type: 'guard', x: 2, y: gf(8), z: gzm(8) },
    { type: 'turret', x: -9, y: AF + 2.2, z: -126 },
    { type: 'walker', x: -6, y: 36.5, z: -123 },
    { type: 'guard', x: 8, y: AF, z: -118 },
    { type: 'spiker', x: 46, y: -8, z: 30 },
    { type: 'drone', x: 0, y: gf(4) + 9, z: gzm(4) },
    { type: 'drone', x: 0, y: 42, z: -122 },
    { type: 'drone', x: 4, y: STAR + 4, z: -156 },
  ],
  pickups: [
    { type: 'health', x: -6, y: 1, z: 22 },
    { type: 'spread', x: -13, y: 1, z: 7 },
    { type: 'rapid', x: 4, y: gf(4) + 1, z: gzm(4) },
    { type: 'slowmo', x: 0, y: AF + 1, z: -102.8 },
    { type: 'rocket', x: 10, y: AF + 1, z: -130 },
    { type: 'overdrive', x: -9, y: 41, z: -128 },
    { type: 'health', x: LEDGES[7].x, y: LEDGES[7].h + 1, z: LEDGES[7].z },
    { type: 'healthBig', x: 31, y: -7, z: 30 },
  ],
  backdrops: [],
};
