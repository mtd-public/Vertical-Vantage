// ARCTIC VAULT · stage 3 — THE VAULT. Platåberget, inside: the seed vault and the world archive.
// Outside, the concrete entrance wedge juts out of the snowy mountainside, its roof and prow lit by
// the light installation. Inside, a long tunnel steps down into the permafrost past transformer
// cabinets and frost-laser curtains, to the cross hall and its three vaults: the SEED VAULT (racks to
// climb), the DATA ARCHIVE (cryo pods, data-tape racks, three curtains) and the DEEP ARCHIVE, where
// archive shuttles slide across a shaft that drops into the dark. The exit is at the bottom of it.
//
// Map (north = -Z, up the page; floors in metres):
//
//        [SEED VAULT -9]          [DATA ARCHIVE -9]          [DEEP ARCHIVE: landing -14, EXIT]
//        racks climb to            pods, tape racks,           ~~~ shaft: shuttles, islands ~~~
//        DRIVE 1 (5.4)             3 curtains, DRIVE 2          (island: DRIVE 3)
//   ┌────┤door├──────────────────────┤door├──────────────────────┤door├────┐
//   │   CROSS HALL -9 (18 m tall): gantry crane ⇄, catwalks, crates       │
//   └──────────────────────────────┐ tunnel ┌─────────────────────────────┘
//                         0 → -9 m in five flights │ ║ │ ← pump room (east)
//                                                  │ ║ │
//                         mountainside 9 ══ [ENTRANCE WEDGE: roof 9.6 → 14.4, PORTAL on the prow]
//                                        apron 0, START
import { rect, disc, box, mv, laser } from '../kit.js';
import { ground, steps, crate, sled, snowmobile, walk } from './arctic-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const wall = (x0, x1, z0, z1, top, bottom, tint = 0) => box(x0, x1, z0, z1, top, { thick: top - bottom, style: 'arc-vaultwall', tint });
const ceil = (x0, x1, z0, z1, bottom, tint = 0) => box(x0, x1, z0, z1, bottom + 2, { thick: 2, style: 'arc-vaultceil', tint });
const floor = (x0, x1, z0, z1, top, tint = 0) => box(x0, x1, z0, z1, top, { thick: 4, style: 'arc-vaultfloor', tint });

// ---- outside: the apron, the mountainside, and the ENTRANCE WEDGE (its roof steps up to the lit prow)
P(ground(-110, 110, 38, 170, 0, { thick: 4 }));
P(box(-160, -5, 20, 38, 9, { thick: 50, style: 'arc-plateau' }), box(5, 160, 20, 38, 9, { thick: 50, style: 'arc-plateau' }));
P(box(-5, 5, 20, 38, 9, { thick: 2, style: 'arc-slab' })); // the slope over the tunnel's first stretch
P(box(-160, 160, -30, 20, 22, { thick: 13, style: 'arc-plateau', tint: 1 }), box(-160, 160, -320, -30, 36, { thick: 22, style: 'arc-plateau', tint: 2 }));
P(box(-6, -2, 38, 62, 4.6, { thick: 4.6, style: 'arc-wedgewall' }), box(2, 6, 38, 62, 4.6, { thick: 4.6, style: 'arc-wedgewall', tint: 1 }));
const WEDGE = [[38, 44, 9.6], [44, 50, 11.2], [50, 56, 12.8], [56, 62.6, 14.4]];
WEDGE.forEach(([z0, z1, top], i) => P(box(-6, 6, z0, z1, top, { thick: top - 4.6, style: 'arc-wedge', tint: i })));
P(sled(20, 84, 1.8, 0.25, { bob: null, tint: 0 }), sled(-22, 92, 1.8, -0.4, { bob: null, tint: 2 }), crate(-16, 70, 2.4, 2.4, { tint: 3 }), crate(-13.4, 70, 2.4, 2.4, { tint: 4 }), crate(-14.7, 70, 4.8, 2.4, { tint: 5 }));
P(snowmobile(30, 60, 2, 0, { move: mv('z', 16, 10, 0), tint: 3 }), rect(-24, 48, 3, 3, 7.2, { thick: 7.2, style: 'arc-floodmast' }));
P(crate(-24, 54, 2.4, 2.4, { tint: 6 }), crate(-24, 54, 4.8, 2.4, { tint: 1 })); // up the flood-light mast onto the slope
P(rect(12, 30, 4, 4, 12.4, { thick: 3.4, style: 'arc-boulder' }), rect(16, 24, 3.6, 3.6, 16.2, { thick: 7.2, style: 'arc-boulder', tint: 1 })); // boulders up to the high slope

// ---- the TUNNEL: 10 m wide, five flights of steps down from 0 to -9 m; its ceiling 7 m over each landing
const LV = [0, -1.8, -3.6, -5.4, -7.2, -9.0];
const FLAT = [[26, 38], [9, 21], [-8, 4], [-25, -13], [-42, -30], [-62, -47]]; // [z0, z1] per landing
FLAT.forEach(([z0, z1], i) => P(box(-5, 5, z0, z1, LV[i], { thick: 3, style: 'arc-tunnelfloor', tint: i })));
for (let i = 0; i < 5; i++) P(...steps(0, FLAT[i][0], 0, -1, 10, 1, -0.36, 5, LV[i], { thick: 3, style: 'arc-tunnelstep' }));
// ceilings: each landing's ceiling runs on over the next flight down (the slab covers z 20…38)
for (let i = 1; i < 6; i++) P(ceil(-5, 5, i < 5 ? FLAT[i + 1][1] : -64, Math.min(20, FLAT[i][1]), LV[i] + 7, i));
P(wall(-7, -5, -64, 20, 9, -24), wall(5, 7, -64, -26, 9, -24, 1), wall(5, 7, -12, 20, 9, -24, 1));
// the pump room off the east side (z -26 … -12)
P(floor(5, 17, -26, -12, -5.4, 1), ceil(5, 17, -26, -12, 1.6, 1), wall(17, 19, -28, -10, 9, -24), wall(5, 19, -28, -26, 9, -24), wall(5, 19, -12, -10, 9, -24));
P(rect(13, -19, 5, 8, -2.6, { thick: 2.8, style: 'arc-pump' }));
// transformer cabinets and cable drums along the tunnel (hop them, take cover behind them)
for (const [x, z, base, h, w, d] of [[-3.4, 31, 0, 2.2, 2.6, 4], [3.4, 18, -1.8, 2.2, 2.6, 3.6], [-3.6, -2, -3.6, 1.6, 2.4, 2.4], [3.6, -32.5, -7.2, 2.2, 2.6, 4], [-3.2, -55, -9, 2.4, 2.6, 3]]) {
  P(rect(x, z, w, d, base + h, { thick: h, style: 'arc-cabinet', tint: Math.round(Math.abs(z)) % 3 }));
}

// ---- the CROSS HALL: 132 m long, 18 m tall, the tunnel in the south wall, three vault doors in the north
P(floor(-66, 66, -88, -62, -9), ceil(-68, 68, -88, -62, 9));
P(wall(-68, -5, -64, -62, 9, -9), wall(5, 68, -64, -62, 9, -9), wall(-5, 5, -64, -62, 9, -2)); // south wall (the tunnel mouth)
P(wall(-68, -66, -88, -62, 9, -9, 1), wall(66, 68, -88, -62, 9, -9, 1));
P(wall(-68, -50, -88, -86, 9, -9), wall(-38, -6, -88, -86, 9, -9), wall(6, 38, -88, -86, 9, -9), wall(50, 68, -88, -86, 9, -9));
P(wall(-50, -38, -88, -86, 9, 1, 2), wall(-6, 6, -88, -86, 9, 1, 2), wall(38, 50, -88, -86, 9, 1, 2)); // the lintels over the vault doors
// catwalks along the south wall (on brackets), crates of seed boxes, the overhead gantry crane
P(walk(-64, -65.5, -12, -65.5, -1, 2.6), walk(12, -65.5, 64, -65.5, -1, 2.6));
P(crate(-20, -72, -6.6, 2.4, { tint: 1 }), crate(-17.4, -72, -6.6, 2.4, { tint: 2 }), crate(-18.7, -72, -4.2, 2.4, { tint: 3 }), crate(-18.7, -74.6, -6.6, 2.4, { tint: 4 }));
P(crate(22, -78, -6.6, 2.4, { tint: 5 }), crate(24.6, -78, -6.6, 2.4, { tint: 6 }), crate(23.3, -78, -4.2, 2.4, { tint: 7 }));
P(crate(-60, -70, -6.6, 2.4, { tint: 2 }), crate(-60, -72.6, -4.2, 2.4, { tint: 3 }), crate(60, -70, -6.6, 2.4, { tint: 4 }), crate(60, -72.6, -4.2, 2.4, { tint: 1 }));
P(rect(0, -75, 3.2, 20, 3.4, { thick: 1.4, style: 'arc-gantry', move: mv('x', 44, 20, 0) })); // the gantry bridge (ride it the length of the hall)
P(sled(-30, -80, -7.4, Math.PI / 2, { move: mv('x', 12, 7, 0), tint: 1 }), sled(32, -68, -7.4, Math.PI / 2, { move: mv('x', 14, 8, 0.5), tint: 3 }));

// ---- VAULT 1, the SEED VAULT: shelving racks of seed boxes, rising toward the back (DRIVE 1 on top)
P(floor(-60, -28, -150, -88, -9, 1), ceil(-62, -26, -152, -88, 9, 1), wall(-62, -60, -152, -86, 9, -9), wall(-28, -26, -152, -88, 9, -9), wall(-62, -26, -152, -150, 9, -9));
const rack = (x, z, d, top, tint = 0) => rect(x, z, 2.6, d, top, { thick: top + 9, style: 'arc-seedrack', tint });
P(rack(-55, -103, 12, -5.4), rack(-55, -119, 12, -1.8, 1), rack(-55, -135, 14, 1.8, 2));
P(rack(-48, -110, 14, -3.6, 1), rack(-48, -128, 12, 0, 2), rack(-48, -143, 10, 3.6, 3));
P(rack(-40, -103, 12, -5.4, 2), rack(-40, -119, 12, -1.8, 3), rack(-40, -135, 14, 1.8));
P(rack(-33, -110, 14, -3.6, 3), rack(-33, -128, 12, 0, 1), rack(-33, -143, 10, 3.6, 2));
P(rect(-44, -145.5, 4.8, 5, 5.4, { thick: 14.4, style: 'arc-seedrack', tint: 4 })); // the top shelf at the back
P(crate(-44, -96, -6.6, 2.4, { tint: 2 }), crate(-51.5, -96, -6.6, 2.4, { tint: 5 }));

// ---- VAULT 2, the DATA ARCHIVE: data-tape racks along the walls, cryo pods, three frost curtains;
//      the archive chest at the back (DRIVE 2)
P(floor(-16, 16, -150, -88, -9, 2), ceil(-18, 18, -152, -88, 9, 2), wall(-18, -16, -152, -88, 9, -9, 1), wall(16, 18, -152, -88, 9, -9, 1), wall(-18, 18, -152, -150, 9, -9, 1));
const tape = (x, z, d, top, tint = 0) => rect(x, z, 3, d, top, { thick: top + 9, style: 'arc-taperack', tint });
P(tape(-13.5, -100, 12, -1), tape(-13.5, -118, 14, -1, 1), tape(-13.5, -137, 14, -1, 2), tape(13.5, -100, 12, -1, 1), tape(13.5, -118, 14, -1, 2), tape(13.5, -137, 14, -1));
for (const [x, z] of [[-5, -96], [5, -96], [-5, -112], [5, -112], [-5, -129], [5, -129]]) P(disc(x, z, 1.7, -5.4, { thick: 3.6, style: 'arc-cryopod', tint: (x > 0 ? 1 : 0) }));
P(rect(0, -146, 7, 4, -6.4, { thick: 2.6, style: 'arc-chest' }));

// ---- VAULT 3, the DEEP ARCHIVE: a shaft (a fall) crossed by archive shuttles and rack islands; the far
//      landing (-14) and the EXIT at the bottom of the mountain
P(floor(28, 60, -104, -88, -9, 3), floor(28, 60, -202, -176, -14, 3), ceil(26, 62, -204, -88, 9, 3));
P(wall(26, 28, -202, -88, 9, -44, 2), wall(60, 62, -202, -88, 9, -44, 2), wall(26, 62, -204, -202, 9, -44, 2));
const shuttle = (x, z, top, move, tint = 0) => rect(x, z, 4, 4, top, { thick: 1.4, style: 'arc-shuttle', tint, move });
const island = (x, z, w, d, top, tint = 0) => rect(x, z, w, d, top, { thick: top + 40, style: 'arc-taperack', tint });
P(shuttle(36, -114, -9.4, mv('z', 7, 8, 0.25)));
P(island(36, -130, 5, 5, -9, 1));
P(shuttle(44, -140, -10.5, mv('x', 8, 7.5, 0.75), 1));
const I2 = island(52, -150, 6, 6, -11, 2);
P(I2);
P(shuttle(52, -162, -12.5, mv('z', 6, 7, 0.25), 2));
// the maintenance catwalk along the east wall: the long way round, high up (broken in places)
P(crate(56, -96, -6.6, 2.4, { tint: 1 }), crate(56, -98.6, -4.2, 2.4, { tint: 2 }));
P(walk(57.5, -102, 57.5, -122, -2.6, 2.6), walk(57.5, -127, 57.5, -146, -3.4, 2.6), walk(57.5, -151, 57.5, -172, -4.2, 2.6));

const lasers = [
  laser(0, -1.8, 14, 10, 3, 0, 3, 0.5, 0), // the second landing
  laser(0, -7.2, -36, 10, 3, 0, 2.8, 0.5, 0.5), // the fifth landing
  laser(0, -9, -104, 24, 3.4, 0, 3.2, 0.5, 0), // the data archive: three curtains between the racks, out of step
  laser(0, -9, -121, 24, 3.4, 0, 3.2, 0.5, 0.33),
  laser(0, -9, -139, 24, 3.4, 0, 3.2, 0.5, 0.66),
  laser(57.5, -3.4, -136, 2.6, 2.6, 0, 2.6, 0.5, 0.2), // the east catwalk
];

export default {
  id: 'arctic-vault', name: 'THE VAULT', sub: 'PLATÅBERGET · SEED VAULT + WORLD ARCHIVE · -6 °C', theme: 'arcticVault', song: 'permafrost',
  seed: 9003, par: 330, killY: -40,
  start: { x: 0, y: 0, z: 100, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -44, y: 5.4 + 1.1, z: -145.5 }, // the top shelf of the seed vault
    { x: 0, y: -6.4 + 1.1, z: -146 }, // the archive chest, behind three curtains
    { x: I2.x, y: I2.h + 1.1, z: I2.z }, // a rack island in the middle of the shaft
  ],
  exit: { x: 44, y: -14, z: -194, yaw: 0 },
  portal: { x: 0, y: 14.4 + 1.4, z: 59.5 }, // on the wedge's lit prow
  bonusStyle: { theme: 'arcticBonus', weapon: 'rocket', tag: 'VAULT' },
  enemies: [
    { type: 'turret', x: -3.4, y: 2.2, z: 31 },
    { type: 'guard', x: 2, y: -3.6, z: -6 },
    { type: 'guard', x: 11, y: -2.6, z: -19 },
    { type: 'turret', x: -3.2, y: -6.6, z: -55 },
    { type: 'drone', x: 0, y: 2.4, z: 2 },
    { type: 'guard', x: -30, y: -1, z: -65.5 },
    { type: 'walker', x: 40, y: -9, z: -76 },
    { type: 'drone', x: 0, y: 2, z: -76 },
    { type: 'spiker', x: -48, y: 0, z: -128 },
    { type: 'drone', x: -44, y: 0, z: -112 },
    { type: 'turret', x: -13.5, y: -1, z: -118 },
    { type: 'turret', x: 13.5, y: -1, z: -137 },
    { type: 'drone', x: 44, y: -6, z: -130 },
    { type: 'drone', x: 40, y: -9, z: -165 },
  ],
  pickups: [
    { type: 'health', x: 15, y: -4.4, z: -14 },
    { type: 'spread', x: 0, y: -8, z: -58 },
    { type: 'rapid', x: -18.7, y: -3.2, z: -72 },
    { type: 'rocket', x: 13.5, y: 0, z: -100 },
    { type: 'healthBig', x: -55, y: 2.8, z: -135 },
    { type: 'slowmo', x: 36, y: -8, z: -130 },
    { type: 'health', x: 57.5, y: -1.6, z: -112 },
    { type: 'overdrive', x: 14, y: 23, z: 10 },
  ],
  backdrops: [
    { kind: 'arc-aurora', x: 0, y: 0, z: 0, r: 520, seed: 931 },
    { kind: 'arc-peaks', x: 0, y: -2, z: 0, r0: 320, r1: 460, n: 20, seed: 932, skip: [1.2, 0.8] },
    { kind: 'arc-fjordview', x: 0, y: -60, z: 520, seed: 933 },
    { kind: 'arc-snowfall', x: 0, y: 0, z: 0, n: 600, wind: 0.3, k: 0.8, zMin: 36 }, // (outside only)
  ],
};
