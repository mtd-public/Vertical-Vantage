// EGYPT · stage 1 — CAIRO. Neo-Cairo at golden hour, 2099: the rooftops of the old city (satellite
// dishes, water tanks, laundry lines), the souk under its awnings, the Citadel's mosque with its pencil
// minarets, and over the Nile, on Gezira island, the Cairo Tower: climb its lotus lattice to the
// exit in the crown. Hover feluccas ferry you over the river; the pyramids glow on the horizon.
//
// Map (north = -Z, up the page):
//
//   west  |      |  GEZIRA        |      | corniche |  [block D]      CITADEL plateau 8 m
//   bank  | west |  CAIRO TOWER   | east |          |                 courtyard ─ PRAYER HALL 18 + DOME 30
//         | chan.|  lotus lattice | chan.|          |                 MINARET 34 (DRIVE 1)
//         |  ↕   |  → crown 41.5  |  ⇄   |  [block C ════ citadel road ═══ stairs ↗ ════════════
//         | felucca  (EXIT)       | felucca  rooftops |  SOUK: covered section (DRIVE 2 between lasers)
//         | DRIVE 3|              |      |  DISH 21.5|  awnings over al-Muizz      [block B]
//         |      |  jetties       |      | (PORTAL)  |  ──────────────────────────────────────────
//         |      |                |      |          |  BAB ZUWEILA (twin minarets)  [block A] START
import { rect, disc, box, mv, bob, laser, link, car, billboard, on, yawTo } from '../kit.js';
import { felucca, fanous, makeFanous, roofs, stairs, spiralLedges, latticeRing, near } from './egypt-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const Q = 1.2; // the corniche (quay) height; the river's surface is at 0

// ---- the ground: the old city's streets (east bank), the corniche, the far bank
P(box(-12, 122, -164, 64, 0, { thick: 3, style: 'eg-street' }));
P(box(-20, -12, -164, 64, Q, { thick: 4, style: 'eg-corniche' }));
P(box(-98, -82, -164, 64, Q, { thick: 4, style: 'eg-corniche', tint: 1 }));
// houseboats moored along the east bank
for (const z of [46, 20, -132, -152]) P(rect(-22.2, z, 3.6, 13, 1.0, { thick: 1.6, style: 'eg-houseboat', tint: Math.abs(z) % 4 }));

// ---- the rooftops. Block A (the start), block B (east), block C (between the corniche and the souk),
// block D (under the Citadel). Fixed buildings punch holes in the seeded blocks.
const CAFE = box(60, 72, 44, 56, 6, { thick: 6, style: 'eg-roof', tint: 2 }); // the rooftop café: START
const DISHT = box(2, 14, -60, -48, 15, { thick: 15, style: 'eg-roofTall', tint: 1 }); // the tall block under the dish
P(CAFE, DISHT);
const A = roofs(8101, 54, 118, 12, 60, 5, 9.5, { skip: (a, b, c, d) => near(a, b, c, d, 60, 72, 44, 56) });
const B = roofs(8102, 54, 118, -86, 6, 5, 10.5);
const C = roofs(8103, -10, 22, -160, 60, 6, 11.5, { wMin: 8, wMax: 11, skip: (a, b, c, d) => near(a, b, c, d, 2, 14, -60, -48, 2.5) });
const D = roofs(8104, 26, 46, -160, -96, 6, 10);
P(...A, ...B, ...C, ...D);
// the giant dish over the tall block (the PORTAL), a fanous up to it
const DISH = disc(8, -54, 4.2, 21.5, { thick: 1.2, style: 'eg-dish' });
P(DISH, fanous(13.5, -62.2, 18.4, { tint: 3 }));

// ---- the SOUK: al-Muizz street (x 34–42) between rows of shops, awnings over it, a covered section
// (DRIVE 2 inside, a laser at each end) and Bab Zuweila's twin minarets at its south end
const shops = [];
for (const [x0, x1, s] of [[26, 34, 811], [42, 50, 812]]) {
  let z = 38, k = s;
  while (z > -86) {
    const d = 6 + ((k * 7919) % 30) / 10, top = 5.5 + ((k * 104729) % 21) / 10;
    shops.push(box(x0, x1, Math.max(-86, z - d), z, top, { thick: top, style: 'eg-shop', tint: k % 6 }));
    z -= d + 1.3; k += 3;
  }
}
P(...shops);
const SOUK = { z0: -44, z1: -24, top: 7.6 };
P(box(33.6, 42.4, SOUK.z0, SOUK.z1, SOUK.top, { thick: 1.0, style: 'eg-soukRoof' }));
for (const z of [31, 23, 15, 7, -1, -9, -17, -51, -59, -67, -75]) P(rect(38, z, 8.8, 3.6, 4.4, { thick: 0.3, style: 'eg-awning', tint: Math.abs(z) % 5 }));
P(box(26, 34, 38, 46, 11, { thick: 11, style: 'eg-gate' }), box(42, 50, 38, 46, 11, { thick: 11, style: 'eg-gate', tint: 1 }));
P(box(34, 42, 38, 46, 11, { thick: 4, style: 'eg-gateArch' }));
P(disc(30, 42, 1.6, 21, { thick: 10, style: 'eg-gateMinaret' }), disc(46, 42, 1.6, 21, { thick: 10, style: 'eg-gateMinaret' }));
// hover taxis parked in the streets (a way back up from the street)
P(car('sedan', 52, 26, 2.2, 0, { tint: 3 }), car('sedan', 52, -40, 2.4, 0, { tint: 0 }), car('van', 24, -70, 2.6, Math.PI, { tint: 0 }), car('sedan', 80, 9, 2.2, Math.PI / 2, { tint: 3 }));

// ---- the CITADEL: a plateau at 8 m, stairs up along its south wall, the courtyard and its arcades,
// the prayer hall (18), its stepped dome (to 30.4) and two pencil minarets (DRIVE 1 on the north one)
const CIT = 8;
P(box(50, 116, -162, -96, CIT, { thick: CIT + 3, style: 'eg-citadel' }));
P(...stairs(58, -93, 1, 0, 4, 0.8, 0.4, 20, 0, { style: 'eg-steps' }));
const HALL = { x: 94, z: -136 };
P(box(80, 108, -150, -122, 18, { thick: 10, style: 'eg-mosque' }));
P(box(56, 80, -150, -146, 12.5, { thick: 4.5, style: 'eg-riwaq' }), box(56, 80, -126, -122, 12.5, { thick: 4.5, style: 'eg-riwaq' }), box(56, 60, -146, -126, 12.5, { thick: 4.5, style: 'eg-riwaq', tint: 1 }));
P(disc(68, -136, 3.2, 11.5, { thick: 3.5, style: 'eg-fountain' }));
const domeStep = (r, top, thick, i) => disc(HALL.x, HALL.z, r, top, { thick, style: i === 4 ? 'eg-domeLantern' : 'eg-dome', tint: i });
P(domeStep(11, 21, 3, 0), domeStep(8.6, 24, 3, 1), domeStep(6.2, 26.6, 2.6, 2), domeStep(3.6, 28.8, 2.2, 3), domeStep(1.4, 30.4, 1.6, 4));
for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P(disc(HALL.x + sx * 10.5, HALL.z + sz * 10.5, 3.4, 20.6, { thick: 2.6, style: 'eg-dome', tint: 5 }));
const MIN = [{ x: 76, z: -155 }, { x: 76, z: -117 }];
for (const M of MIN) {
  P(disc(M.x, M.z, 1.6, 33.5, { thick: 25.5, style: 'eg-minaret' }));
  P(disc(M.x, M.z, 3.0, 34, { thick: 0.5, style: 'eg-minaretBalcony' }));
  P(disc(M.x, M.z, 0.9, 40, { thick: 6, style: 'eg-minaretCap' }));
}
// mashrabiya balconies spiral up the north minaret from the courtyard side
const SPIRAL = spiralLedges(MIN[0].x, MIN[0].z, 3.8, (118 * Math.PI) / 180, (50 * Math.PI) / 180, 10.6, 2.6, 9, { style: 'eg-mashrabiya' });
P(...SPIRAL.plats);
// fanous lanterns from the dome's lantern to the minaret's balcony (the other way up)
const LANTERN = plats.find((p) => p.style === 'eg-domeLantern');
const BALC = plats.find((p) => p.style === 'eg-minaretBalcony');
P(...link(8105, LANTERN, BALC, { make: makeFanous, wobble: 1.2 }));

// ---- the NILE: feluccas ferry across the east channel; the west channel's felucca sails up and down
// past two jetties (DRIVE 3 rides it)
P(felucca(-30, -44, 1.6, Math.PI / 2, { move: mv('x', 5.2, 10, 0), tint: 0 }));
P(felucca(-30, -88, 1.6, Math.PI / 2, { move: mv('x', 5.2, 11, 0.5), tint: 1 }));
P(felucca(-30, -14, 1.6, Math.PI / 2, { move: mv('x', 5.2, 9.5, 0.25), tint: 3 }));
const NILEBOAT = felucca(-72, -62, 1.6, 0, { move: mv('z', 34, 24, 0), tint: 2 });
P(NILEBOAT);

// ---- GEZIRA island and the CAIRO TOWER: a shaft wrapped in a lotus lattice. Lattice rings of four
// segments climb it, each ring turned 45° from the one below (jump up through the gaps); the top two
// flare out under the crown (41.5: the EXIT)
const ISL = 1.0, TX = -51, TZ = -64;
P(box(-62, -40, -120, -8, ISL, { thick: 3, style: 'eg-gezira' }));
P(box(-69, -62, -50, -46, Q, { thick: 2.4, style: 'eg-jetty' }), box(-69, -62, -86, -82, Q, { thick: 2.4, style: 'eg-jetty' }));
P(disc(TX, TZ, 5.4, 1.8, { thick: 1.4, style: 'eg-towerBase' }));
P(disc(TX, TZ, 3.0, 40, { thick: 39.6, style: 'eg-cairoShaft' }));
const RINGS = [];
for (let k = 0; k < 10; k++) {
  const f = k === 8 ? 1 : k === 9 ? 2 : 0;
  const rc = [4.0, 6.2, 7.8][f], L = [3.2, 3.6, 4.0][f], depth = [1.8, 2.0, 2.0][f];
  const top = 4.2 + 3.5 * k, a0 = Math.PI / 8 + (k % 2) * (Math.PI / 4);
  const ring = latticeRing(TX, TZ, rc, 4, L, depth, top, a0, { tint: k });
  RINGS.push(ring); P(...ring);
}
const CROWN = 41.5;
P(disc(TX, TZ, 5.8, CROWN, { thick: 2.2, style: 'eg-lotusCrown' }));
// palms and a kiosk on the island (cover, a hop up)
P(rect(-46, -30, 5, 3.4, 2.8, { thick: 1.8, style: 'eg-kiosk' }), rect(-56, -100, 5, 3.4, 2.8, { thick: 1.8, style: 'eg-kiosk', tint: 1 }));

// ---- the floating ads over the corniche (you can land on their catwalks)
P(billboard(-16, -8, 12, 13, Math.PI / 2, { ad: 14 }), billboard(-16, -118, 12, 12, Math.PI / 2, { ad: 5 }));

const lasers = [
  laser(38, 0, SOUK.z1 + 0.6, 8, 3.2, 0, 3, 0.5, 0), // the covered souk's two gates, out of step
  laser(38, 0, SOUK.z0 - 0.6, 8, 3.2, 0, 3, 0.5, 0.5),
  laser(65.6, 4.0, -93, 4, 2.6, Math.PI / 2, 3.2, 0.5, 0.25), // half-way up the Citadel stairs
  laser(68, 12.5, -148, 4, 2.4, Math.PI / 2, 2.8, 0.5, 0.6), // along the north arcade's roof
  laser(-16, Q, -102, 8, 2.6, 0, 3.2, 0.5, 0.25), // across the corniche
];

const S = SPIRAL.pts, R4 = RINGS[4][1];
export default {
  id: 'egypt-cairo', name: 'CAIRO', sub: 'NEO-CAIRO · 17:20 · GOLDEN HOUR', theme: 'egyptGolden', song: 'nileBreak',
  seed: 8001, par: 330, killY: -0.6, water: 0,
  start: { x: 66, y: 6, z: 52, yaw: yawTo(-1, -0.6) },
  plats, lasers,
  drives: [
    { x: MIN[0].x + 2.0, y: 34 + 1.1, z: MIN[0].z }, // the north minaret's balcony
    { x: 38, y: 1.1, z: (SOUK.z0 + SOUK.z1) / 2 }, // inside the covered souk, between its lasers
    { x: NILEBOAT.x, y: 1.6 + 1.1, z: NILEBOAT.z - 2.5 }, // riding the felucca up the west channel
  ],
  exit: { x: TX, y: CROWN, z: TZ, yaw: 0 },
  portal: { x: DISH.x, y: DISH.h + 1.4, z: DISH.z },
  bonusStyle: { theme: 'egyptBonusGold', weapon: 'spread', tag: 'NILE' },
  enemies: [
    { type: 'guard', ...on(A[4]) },
    { type: 'guard', x: 38, y: 11, z: 42 },
    { type: 'walker', x: 38, y: 4.4, z: 7 },
    { type: 'turret', x: 38, y: 0, z: SOUK.z0 + 3 },
    { type: 'spiker', x: 38, y: SOUK.top, z: -30 },
    { type: 'turret', x: 78, y: CIT, z: -100 },
    { type: 'guard', x: 66, y: CIT, z: -140 },
    { type: 'turret', x: 94, y: 18, z: -123.5 },
    { type: 'guard', x: -16, y: Q, z: -60 },
    { type: 'guard', x: -46, y: ISL, z: -24 },
    { type: 'drone', x: 38, y: 13, z: -4 },
    { type: 'drone', x: 70, y: 30, z: -146 },
    { type: 'drone', x: -30, y: 9, z: -64 },
    { type: 'drone', x: TX - 9, y: 26, z: TZ - 8 },
  ],
  pickups: [
    { type: 'health', x: 63, y: 7, z: 46 },
    { type: 'spread', ...on(shops[3], 0, 0, 1) },
    { type: 'rapid', x: 86, y: CIT + 1, z: -104 },
    { type: 'overdrive', x: HALL.x, y: 31.4, z: HALL.z },
    { type: 'health', x: S[4].x, y: S[4].y + 1, z: S[4].z },
    { type: 'rocket', x: -46, y: ISL + 1, z: -96 },
    { type: 'slowmo', x: -22.2, y: 2, z: -132 },
    { type: 'healthBig', x: R4.x, y: R4.h + 1, z: R4.z },
  ],
  backdrops: [
    { kind: 'eg-giza', x: -620, y: -2, z: 330, yaw: 0.9, s: 1.15, glow: 1 },
    { kind: 'eg-cairoRing', x: 30, y: -0.5, z: -50, r0: 190, r1: 300, n: 90, seed: 81, skipW: [2.2, 0.8] },
    { kind: 'eg-westBank', x: -150, y: 0, z: -50, yaw: Math.PI / 2, len: 260 },
    { kind: 'hills', x: 520, y: -4, z: -80, yaw: Math.PI / 2, len: 700, h: 70, n: 8, color: '#c8986a' }, // the Mokattam hills
  ],
};
