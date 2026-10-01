// SHANGHAI stage 3 — LANTERN NIGHT. The old town on its canals during the lantern festival: a zigzag
// bridge across the garden pond to the mid-lake teahouse, curved-eave roofs to hop, dragon boats on
// the canal, neon signs, a moon-gate garden, red lanterns drifting over everything (they bob: ride
// them), and the pagoda at the north end: climb its eaves to the EXIT on top.
//
//                       [PAGODA: six eaves, EXIT on top] (0, -148)
//        ↖ lanterns from the drum tower          plaza (lasers)
//   [sign tower DRIVE 1] [H4]   ~~canal~~ arch bridge   [drum tower]  ← lanterns from the moon lantern
//   [H3 two storeys]            dragon boats (DRIVE 2)  [shop]
//   [H2] [H1]           ~~canal~~ arch bridge   [market M2, M1]          (MOON LANTERN, DRIVE 3)
//          ↖ zigzag           [TEAHOUSE]      ~lanterns~ [garden + moon gate + PORTAL] ← lantern stair up
//   rocks ↑      zigzag bridge ↑                        rocks ↗
//                       START (south bank)
import { box, rect, disc, chain, bob, mv, yawTo, laser } from '../kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const BANK = 1.4;
const bank = (x0, x1, z0, z1, top = BANK, style = 'stoneBank', tint = 0) => box(x0, x1, z0, z1, top, { thick: top + 4, style, tint });
// A hall with a curved-eave roof slab over it (the eave overhangs by `over`); floors stack:
// floors = [[hall w, hall d, eave top], …] from `base` up.
function building(x, z, base, floors, o = {}) {
  let top = base;
  floors.forEach(([w, d, eave], i) => {
    const over = o.over ?? 1.6;
    P(rect(x, z, w, d, eave - 1, { thick: eave - 1 - top, style: 'hall', tint: o.tint ?? 0 }));
    P(rect(x, z, w + over * 2, d + over * 2, eave, { thick: 1, style: 'eave', tint: (o.eaveTint ?? 0) + (i === floors.length - 1 ? 8 : 0) }));
    top = eave;
  });
}
// A zigzag bridge through points [[x, z], …]: stone slabs, overlapping at the turns.
function zigzag(pts, top, wide = 2.6) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, L = Math.sqrt(dx * dx + dz * dz);
    P(rect((ax + bx) / 2, (az + bz) / 2, wide, L + wide, top, { thick: top, yaw: yawTo(dx, dz), style: 'zigBridge' }));
  }
}
const lantern = (x, z, top, ph = 0) => disc(x, z, 1.35, top, { thick: 1.1, style: 'lantern', bob: bob(0.3, 3.4, ph) });
// Lanterns hanging at an eave's corners, just off it: the steps up a roof whose eave overhangs your
// head. From the floor below, a single jump onto the lantern; from the lantern, a single jump in over
// the eave's corner. corners: indices into NE, SE, SW, NW; e: the eave's size (w, d); floor: the top below.
function cornerLanterns(x, z, ew, ed, floor, corners, eaveTop) {
  const sx = [1, 1, -1, -1], sz = [-1, 1, 1, -1];
  // (its bottom hangs below head height off the floor: walk into it and it stops you, it never bonks your head)
  const top = (floor + eaveTop) / 2, thick = Math.max(0.8, top - floor - 1.3);
  for (const k of corners) P(disc(x + sx[k] * (ew / 2 + 0.75), z + sz[k] * (ed / 2 + 0.75), 0.95, top, { thick, style: 'lantern', tint: 1 }));
}
const lanternMake = (rng, x, z, top, yaw, i) => lantern(x, z, top, rng());
const rockMake = (rng, x, z, top) => rect(x, z, 2.2 + rng(), 2.2 + rng(), top + rng() * 0.4, { thick: top + 1, yaw: rng() * 3, style: 'rockery', tint: Math.floor(rng() * 4) });

// ---- the south bank, the zigzag bridge and the teahouse in the pond
P(bank(-30, 30, 20, 36));
zigzag([[0, 21], [5, 15], [0, 9], [5, 3], [0, -3], [5, -9], [2, -15]], 1.6);
P(bank(-8, 12, -34, -14, 1.6));
building(2, -24, 1.6, [[13, 13, 7], [9, 9, 12]], { over: 2, eaveTint: 1 });
P(rect(2, -24, 5, 5, 14.6, { thick: 2.6, style: 'eaveTop' }));
cornerLanterns(2, -24, 17, 17, 1.6, [1, 3], 7);
cornerLanterns(2, -24, 13, 13, 7, [0, 2], 12);
zigzag([[-6, -32], [-10, -38], [-12, -44]], 1.6); // on to the west bank
// taihu rocks across the pond, both sides (other ways round)
P(...chain(5301, { x: -22, y: BANK, z: 21 }, { x: -20, y: BANK, z: -42 }, { make: rockMake, maxStep: 6.5 }));
P(...chain(5302, { x: 25, y: BANK, z: 21 }, { x: 36, y: 1.6, z: -10 }, { make: rockMake, maxStep: 6.5 }));

// ---- the canal banks: west (old houses), east (the market), split by a side canal
const WB1 = bank(-28, -7, -72, -42), EB1 = bank(7, 28, -72, -42), WB2 = bank(-28, -7, -112, -78), EB2 = bank(7, 28, -112, -78);
P(WB1, EB1, WB2, EB2);
building(-18, -50, BANK, [[12, 10, 6.4]], { tint: 0 }); // H1
building(-19, -64, BANK, [[10, 10, 8.6]], { tint: 1 }); // H2
P(lantern(-19, -75.5, 9.6, 0.3)); // a lantern over the side canal, between the roofs
building(-16, -88, BANK, [[12, 12, 7.4], [8, 8, 12.4]], { tint: 2 }); // H3
cornerLanterns(-16, -88, 15.2, 15.2, BANK, [0, 1], 7.4);
cornerLanterns(-16, -88, 11.2, 11.2, 7.4, [1, 3], 12.4);
building(-15, -104, BANK, [[10, 8, 6.4]], { tint: 0 }); // H4
P(rect(-25.5, -104, 3, 12, 18, { thick: 18 - BANK, style: 'sign', tint: 2 })); // the sign tower (DRIVE 1 on top)
building(18, -48, BANK, [[12, 8, 6.4]], { tint: 4 }); // M1: market, neon blades
building(18, -62, BANK, [[12, 10, 7.6]], { tint: 5 }); // M2
P(rect(27, -46, 3, 8, 12, { thick: 12 - BANK, style: 'sign', tint: 5 }));
building(23, -84, BANK, [[8, 8, 5.4]], { tint: 4, over: 1.5 }); // the shop by the drum tower
building(17, -95, BANK, [[12, 12, 10], [8, 8, 15]], { tint: 3, over: 2 }); // the drum tower
P(rect(17, -95, 5, 5, 18, { thick: 3, style: 'eaveTop', tint: 1 }));
cornerLanterns(17, -95, 16, 16, 5.4, [1], 10); // up from the shop's roof
cornerLanterns(17, -95, 12, 12, 10, [0, 2], 15);
// arched bridges over the canal (high enough for the dragon boats), with steps up from the banks
for (const z of [-58, -96]) P(rect(0, z, 14.4, 4, 4.6, { thick: 1, style: 'archBridge' }), rect(-9, z, 3.6, 4, 3, { thick: 1.6, style: 'stoneStep' }), rect(9, z, 3.6, 4, 3, { thick: 1.6, style: 'stoneStep' }));
// lanterns across the canal, high over the boats
P(lantern(-2.6, -48, 5.2, 0.1), lantern(2.8, -52.5, 5.6, 0.6));
// the dragon boats, up and down the canal (DRIVE 2 rides the first)
P(rect(-3, -76, 2.6, 13, 1, { thick: 1, style: 'dragonBoat', move: mv('z', 24, 20, 0) }));
P(rect(3, -80, 2.6, 13, 1, { thick: 1, yaw: Math.PI, style: 'dragonBoat', tint: 1, move: mv('z', 24, 26, 0.5) }));

// ---- the moon-gate garden (east), the lanterns to it, and the lantern stair up to the moon lantern
P(bank(30, 54, -36, -10, 1.6, 'garden'));
P(rect(42, -27.15, 1.2, 5.7, 5.6, { thick: 4, style: 'moonWall' }), rect(42, -18.85, 1.2, 5.7, 5.6, { thick: 4, style: 'moonWall' }));
P(rect(42, -23, 1.2, 2.6, 5.6, { thick: 1.4, style: 'moonWall', tint: 1 })); // the lintel over the round gate
building(35, -14, 1.6, [[5, 5, 5.6]], { tint: 6, over: 1.4 }); // a little pavilion
P(lantern(16.5, -22, 2.8, 0.2), lantern(21.5, -25, 3.4, 0.5), lantern(26.5, -21, 2.9, 0.8));
P(lantern(46, -39.5, 5.2, 0.1), lantern(40.5, -43, 8.8, 0.4), lantern(42, -49.5, 12.4, 0.7), lantern(46, -53, 15.6, 0.2));
P(disc(51.5, -54, 3.2, 18.5, { thick: 2.4, style: 'bigLantern', bob: bob(0.25, 5, 0) })); // the moon lantern (DRIVE 3)
// lantern bridges: the moon lantern → the drum tower → the pagoda's fourth eave
P(...chain(5303, { x: 48.5, y: 18.5, z: -57 }, { x: 22, y: 15, z: -88.5 }, { make: lanternMake, maxStep: 6.5 }));
P(...chain(5304, { x: 15, y: 18, z: -97.5 }, { x: 6.5, y: 20.4, z: -141 }, { make: lanternMake, maxStep: 6.5 }));

// ---- the pagoda plaza and the pagoda: six halls under six eaves, a cap with a golden finial
P(bank(-26, 26, -172, -118, 1.6, 'stonePlaza'));
const PAG = { x: 0, z: -148 }, halls = [22, 18.4, 14.8, 11.2, 7.8, 5];
building(PAG.x, PAG.z, 1.6, halls.map((h, k) => [h, h, 6.6 + 4.6 * k]), { tint: 7, over: 1.6, eaveTint: 2 });
P(rect(PAG.x, PAG.z, 3, 3, 32, { thick: 2.4, style: 'pagodaCap' }));
halls.forEach((h, k) => cornerLanterns(PAG.x, PAG.z, h + 3.2, h + 3.2, k ? 6.6 + 4.6 * (k - 1) : 1.6, k % 2 ? [0, 2] : [1, 3], 6.6 + 4.6 * k)); // a lantern stair up its corners

const lasers = [
  laser(2.5, 1.6, 6, 3.4, 2.4, yawTo(5, -6), 3, 0.5, 0), // across the zigzag bridge
  laser(0, 1.6, -126.5, 40, 2.6, 0, 3.6, 0.5, 0), // the plaza: two curtains out of step
  laser(0, 1.6, -131, 40, 2.6, 0, 3.6, 0.5, 0.5),
  laser(17, 10, -89, 16, 2.4, 0, 3, 0.5, 0.3), // the drum tower's first eave
];

export default {
  id: 'shanghai-lanterns', name: 'LANTERN NIGHT', sub: 'OLD TOWN CANALS · 23:15 · LANTERN FESTIVAL', theme: 'shanghaiLantern', song: 'neonHard',
  seed: 5003, par: 300, killY: -0.6, water: 0,
  start: { x: 0, y: BANK, z: 30, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -25.5, y: 19.1, z: -105 }, // on the sign tower
    { x: -3, y: 2.1, z: -76 }, // riding the first dragon boat
    { x: 51.5, y: 19.6, z: -54 }, // on the moon lantern
  ],
  exit: { x: 0, y: 29.6, z: -145.4, yaw: 0 },
  portal: { x: 47, y: 3, z: -23 },
  bonusStyle: { theme: 'bonusNight', music: 'neonHard', weapon: 'rocket', tag: 'LANTERN' },
  enemies: [
    { type: 'guard', x: -5, y: 1.6, z: -31 },
    { type: 'drone', x: 2, y: 10, z: -36 },
    { type: 'spiker', x: 7, y: 12, z: -24 },
    { type: 'guard', x: -9, y: BANK, z: -66 },
    { type: 'walker', x: -19, y: 8.6, z: -64 },
    { type: 'guard', x: 9.5, y: BANK, z: -70 },
    { type: 'walker', x: 18, y: 6.4, z: -48 },
    { type: 'turret', x: 17, y: 18, z: -95 },
    { type: 'guard', x: -12, y: 1.6, z: -125 },
    { type: 'guard', x: 12, y: 1.6, z: -125 },
    { type: 'guard', x: 0, y: 11.2, z: -138.5 },
    { type: 'drone', x: 0, y: 8, z: -85 },
    { type: 'drone', x: 42, y: 21, z: -60 },
    { type: 'drone', x: 14, y: 24, z: -150 },
  ],
  pickups: [
    { type: 'health', x: 10.5, y: 2.6, z: -16 },
    { type: 'spread', x: -10, y: 2.4, z: -46 },
    { type: 'rapid', x: 9, y: 2.4, z: -46 },
    { type: 'healthBig', x: 33, y: 2.6, z: -20 },
    { type: 'rocket', x: -16, y: 13.4, z: -88 },
    { type: 'slowmo', x: 51.5, y: 19.5, z: -55.5 },
    { type: 'health', x: 0, y: 2.6, z: -121 },
    { type: 'overdrive', x: 0, y: 21.4, z: -142.4 },
  ],
  backdrops: [
    { kind: 'pearlTower', x: 170, y: 0, z: -400, s: 1 },
    { kind: 'jinmaoTower', x: 60, y: 0, z: -470, s: 1 },
    { kind: 'twistTower', x: 280, y: 0, z: -460, s: 1 },
    { kind: 'bottleOpener', x: 200, y: 0, z: -520, s: 1 },
    { kind: 'skyline', x: 120, y: 0, z: -420, w: 360, d: 120, n: 22, hMin: 40, hMax: 160, color: '#2a1a3a' },
    { kind: 'skyline', x: -260, y: 0, z: -300, w: 200, d: 120, n: 14, hMin: 30, hMax: 100, color: '#2a1a3a' },
    { kind: 'skyline', x: 380, y: 0, z: -120, w: 120, d: 240, n: 12, hMin: 30, hMax: 110, color: '#2a1a3a' },
  ],
};
