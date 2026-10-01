// EGYPT · stage 2 — DATA PYRAMID. The Giza plateau at noon in a sandstorm: the Great Pyramid, its
// chambers packed with servers, cooled by stacks on the west and fed by a solar field to the south-west.
// Climb its flank (the casing courses are the ledges) past the laser-grid scanners to the glass
// capstone, where the exit waits. The Sphinx wears a sensor array on its head; Khufu's solar barque,
// rebuilt as a hover barge, cruises its boat pit.
//
// Map (north = -Z, up the page):
//
//       [cooling stacks]      ┌──────── GREAT PYRAMID ────────┐     [queen]
//        tower 3 18 m         │  16 courses, 2.5 m each        │     [queen]
//        tower 2 13.5         │  scanners: S face c4, E face c9 │     [queen]
//        tower 1 9            │  summit 40 m: EXIT (capstone)   │
//                             └────────────────────────────────┘ ╲ causeway (laser)
//                   ══════ BOAT PIT (the barque: DRIVE 3) ══════     ╲
//   SOLAR FIELD     panels                                      [SPHINX: back 11 · head 21 ·
//    tower 30 m (DRIVE 2)                                        sensor mast 34.6 (DRIVE 1)
//    drones orbit it                                             stela between the paws: PORTAL]
//                         START (south, on the sand)
import { rect, disc, box, mv, orbit, laser, yawTo } from '../kit.js';
import { block, pyramid, spiralLedges } from './egypt-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);

// ---- the plateau (sand), cut by the boat pit along the pyramid's south side
const PIT = { x0: -40, x1: 40, z0: -28, z1: -20 };
const sand = (x0, x1, z0, z1) => box(x0, x1, z0, z1, 0, { thick: 3, style: 'eg-desert' });
P(sand(-640, 640, PIT.z1, 640), sand(-640, 640, -640, PIT.z0), sand(-640, PIT.x0, PIT.z0, PIT.z1), sand(PIT.x1, 640, PIT.z0, PIT.z1));
P(box(PIT.x0, PIT.x1, PIT.z0, PIT.z1, -9, { thick: 1, style: 'eg-pitFloor' })); // (far below killY: the cables glow down there)
const BARQUE = rect(0, -24, 3.2, 12, -1.5, { thick: 1.2, yaw: Math.PI / 2, style: 'eg-barque', move: mv('x', 26, 20, 0) });
P(BARQUE);

// ---- the GREAT PYRAMID: 16 courses (2.1 m ledges, 2.5 m risers) to a 13 m summit at 40
const PYR = { x: 0, z: -80 }, HW0 = 38, RUN = 2.1, RISE = 2.5, N = 16;
const C = pyramid(PYR.x, PYR.z, HW0, RUN, RISE, N, { style: 'eg-course' });
P(...C);
const SUMMIT = C[N - 1].h;
const hw = (k) => HW0 - RUN * k; // course k's half-width
const ledge = (k) => hw(k) - RUN / 2; // the middle of course k's ledge, out from the centre
C[N - 1].style = 'eg-summit'; // (the top course carries the glass capstone)

// ---- the queens' pyramids east of it, the causeway up from the Sphinx
const QP = [-104, -80, -56].map((z, i) => pyramid(60, z, 8, 2.0, 2.5, 4, { style: 'eg-course', tint0: 20 + i * 4 }));
for (const q of QP) P(...q);
const CW = { x0: 62, z0: 8, x1: 31, z1: -42 };
const cwLen = Math.sqrt((CW.x1 - CW.x0) * (CW.x1 - CW.x0) + (CW.z1 - CW.z0) * (CW.z1 - CW.z0)), cwYaw = yawTo(CW.x1 - CW.x0, CW.z1 - CW.z0);
const cwAt = (t) => ({ x: CW.x0 + (CW.x1 - CW.x0) * t, z: CW.z0 + (CW.z1 - CW.z0) * t });
P(rect((CW.x0 + CW.x1) / 2, (CW.z0 + CW.z1) / 2, 6, cwLen, 2.5, { thick: 2.5, yaw: cwYaw, style: 'eg-causeway' }));

// ---- the SPHINX, facing east: rump, back, chest, the nemes lappets, the head; paws with the Dream
// Stela between them (the PORTAL); a sensor mast on its head (DRIVE 1 on top)
P(block(30, 38, 14, 26, 4.2, 'eg-dune'));
P(block(38, 48, 13, 27, 8.5, 'eg-sphinx', { tint: 0 }), block(48, 78, 12, 28, 11, 'eg-sphinx', { tint: 1 }), block(78, 86, 12, 28, 13, 'eg-sphinx', { tint: 2 }));
P(block(86, 106, 12, 17, 3.6, 'eg-sphinxPaw'), block(86, 106, 23, 28, 3.6, 'eg-sphinxPaw', { tint: 1 }));
P(block(82, 92, 11, 16, 7.6, 'eg-sphinx', { tint: 3 }), block(82, 92, 24, 29, 7.6, 'eg-sphinx', { tint: 3 }));
P(block(80, 86, 12.4, 15, 17, 'eg-nemes'), block(80, 86, 25, 27.6, 17, 'eg-nemes', { tint: 1 }));
const HEAD = { x: 84, z: 20, top: 21 };
P(block(80, 88, 15, 25, HEAD.top, 'eg-sphinxHead'));
P(rect(89.5, 20, 1.4, 4.4, 5.2, { thick: 5.2, style: 'eg-stela' }));
const MAST = 34.6;
P(disc(HEAD.x, HEAD.z, 0.8, MAST - 0.6, { thick: MAST - 0.6 - HEAD.top, style: 'eg-mastCore' }));
const ARMS = spiralLedges(HEAD.x, HEAD.z, 3.4, -Math.PI / 2, (100 * Math.PI) / 180, 24.5, 3.4, 3, { style: 'eg-sensorArm', w: 3.0, d: 2.0 });
P(...ARMS.plats);
P(disc(HEAD.x, HEAD.z, 2.6, MAST, { thick: 0.6, style: 'eg-sensorDeck' }));

// ---- the SOLAR FIELD: panel rows round a solar tower; service drones orbit it, a rising stair
// that turns (DRIVE 2 on the receiver)
const ST = { x: -78, z: 34, top: 30 };
for (const x of [-112, -98, -58, -44]) for (const z of [10, 20, 30, 40, 50, 60]) P(rect(x, z, 10, 3.4, 1.6, { thick: 1.6, style: 'eg-solar', tint: (x + z) & 3 }));
for (const z of [10, 20, 48, 58]) P(rect(ST.x, z, 10, 3.4, 1.6, { thick: 1.6, style: 'eg-solar', tint: 1 }));
P(disc(ST.x, ST.z, 3.2, ST.top, { thick: ST.top, style: 'eg-solarTower' }));
for (let i = 0; i < 5; i++) P(disc(ST.x, ST.z, 1.7, 4 + 5.5 * i, { thick: 0.6, style: 'eg-serviceDrone', tint: i, move: orbit('xz', 7, 14, i * 0.1) }));

// ---- the COOLING YARD west of the pyramid: vent stacks up to three cooling towers
P(rect(-55, -108, 5, 5, 4.5, { thick: 4.5, style: 'eg-vent' }));
P(disc(-66, -100, 6, 9, { thick: 9, style: 'eg-cooling', tint: 0 }), disc(-70, -86, 6, 13.5, { thick: 13.5, style: 'eg-cooling', tint: 1 }), disc(-66, -72, 5.5, 18, { thick: 18, style: 'eg-cooling', tint: 2 }));

const L4 = ledge(4), L9 = ledge(9);
const lasers = [
  laser(PYR.x, C[4].h, PYR.z + L4, 24, 7.6, 0, 3.4, 0.5, 0), // scanner grid on the south face (course 4): three courses tall
  laser(PYR.x + L9, C[9].h, PYR.z, 20, 7.6, Math.PI / 2, 3.2, 0.5, 0.5), // …and on the east face (course 9)
  laser(PYR.x, C[14].h, PYR.z + ledge(14), 14, 2.6, 0, 2.8, 0.5, 0.25), // the capstone's last check (course 14, south)
  laser(cwAt(0.35).x, 2.5, cwAt(0.35).z, 6, 2.6, cwYaw, 3, 0.5, 0.3), // across the causeway
  laser(62, 11, 20, 16, 2.6, Math.PI / 2, 3, 0.5, 0), // across the Sphinx's back
];

export default {
  id: 'egypt-pyramid', name: 'DATA PYRAMID', sub: 'GIZA PLATEAU · 12:40 · SANDSTORM', theme: 'egyptHaze', song: 'nileBreak',
  seed: 8002, par: 320, killY: -6,
  start: { x: 4, y: 0, z: 34, yaw: 0.05 },
  plats, lasers,
  drives: [
    { x: HEAD.x + 1.6, y: MAST + 1.1, z: HEAD.z }, // the top of the Sphinx's sensor mast
    { x: ST.x, y: ST.top + 1.1, z: ST.z }, // the solar tower's receiver
    { x: BARQUE.x + 3, y: BARQUE.h + 1.1, z: BARQUE.z }, // riding the solar barque in the boat pit
  ],
  exit: { x: PYR.x, y: SUMMIT, z: PYR.z + 2, yaw: 0 },
  portal: { x: 89.5, y: 5.2 + 1.4, z: 20 },
  bonusStyle: { theme: 'egyptBonusHaze', weapon: 'rapid', tag: 'GIZA' },
  enemies: [
    { type: 'guard', x: -14, y: 0, z: 6 },
    { type: 'guard', x: cwAt(0.6).x, y: 2.5, z: cwAt(0.6).z },
    { type: 'turret', x: PYR.x + ledge(3), y: C[3].h, z: PYR.z + ledge(3) },
    { type: 'turret', x: PYR.x - ledge(6), y: C[6].h, z: PYR.z + ledge(6) },
    { type: 'guard', x: PYR.x, y: C[9].h, z: PYR.z + ledge(9) },
    { type: 'walker', x: PYR.x + ledge(12), y: C[12].h, z: PYR.z },
    { type: 'turret', x: PYR.x - 4, y: SUMMIT, z: PYR.z - 4 },
    { type: 'walker', x: 60, y: QP[1][3].h, z: -80 },
    { type: 'guard', x: 54, y: 11, z: 20 },
    { type: 'spiker', x: -70, y: 13.5, z: -86 },
    { type: 'drone', x: ST.x + 6, y: 18, z: ST.z + 10 },
    { type: 'drone', x: 22, y: 28, z: -52 },
    { type: 'drone', x: -30, y: 34, z: -92 },
    { type: 'drone', x: 76, y: 27, z: 20 },
  ],
  pickups: [
    { type: 'health', x: 10, y: 1, z: 30 },
    { type: 'spread', x: cwAt(0.15).x, y: 3.5, z: cwAt(0.15).z },
    { type: 'rapid', x: 60, y: QP[0][3].h + 1, z: -104 },
    { type: 'rocket', x: -66, y: 19, z: -72 },
    { type: 'healthBig', x: 81.5, y: HEAD.top + 1, z: 17.5 },
    { type: 'slowmo', x: BARQUE.x - 3, y: BARQUE.h + 1, z: BARQUE.z },
    { type: 'overdrive', x: PYR.x, y: C[13].h + 1, z: PYR.z - ledge(13) },
    { type: 'health', x: PYR.x - ledge(8), y: C[8].h + 1, z: PYR.z },
  ],
  backdrops: [
    { kind: 'eg-khafre', x: -330, y: -2, z: 250, s: 0.6 },
    { kind: 'eg-khafre', x: -520, y: -2, z: 470, s: 0.5, small: 1 },
    { kind: 'eg-dunes', x: 0, y: -1, z: 0, r0: 260, r1: 420, n: 26, seed: 82 },
    { kind: 'eg-cairoRing', x: 700, y: -1, z: -500, r0: 0, r1: 260, n: 40, seed: 83, towers: 1 },
  ],
};
