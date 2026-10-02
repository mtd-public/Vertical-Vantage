// AIR FORTRESS · stage 3 — BOMB BAY. Inside the carrier at night, under the hangar lamps. The bay
// doors stand open: a 30 × 70 m hole in the floor with the moonlit cloud sea far below. Over it hangs
// the GRAND SLAM, a 40 m bomb on its release cradle: climb the bomb racks, cross on its back. A
// gantry crane trucks its load to and fro across the doors, conveyor sleds shuttle munitions over
// them, and security curtains guard the racks and the launch gallery where the lift to the bridge waits.
//
// Map (north = −Z, up the page; floor y = 0, ceiling 28):
//
//                 [LAUNCH GALLERY 6 m: EXIT]  (deck guns either side)
//            ═══════ security curtains ═══════
//   [rack 8] ←── crane load (DRIVE 2) ──→ [rack 8]            ← overhead crane beam (22)
//   [rack 12] ⌐hook        ║ GRAND SLAM ║      hook¬ [rack 12: DRIVE 3 behind a curtain]
//   [rack 8]               ║ cradle 15  ║            [rack 8]
//   [rack 4]               ╚ tail: DRIVE 1          [rack 4]
//             ←── conveyor sleds ──→
//   maintenance catwalk under the west door edge (−8): PORTAL
//                       START (the open loading ramp, south)
import { rect, box, mv, bob, laser } from '../kit.js';
import { ammo, pod } from './fortress-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const floor = (x0, x1, z0, z1, tint) => box(x0, x1, z0, z1, 0, { thick: 3, style: 'fortress-bayfloor', tint });
const rack = (x0, x1, z0, z1, top, tint = 0) => box(x0, x1, z0, z1, top, { thick: top, style: 'fortress-bombrack', tint });

// ---- the hall: floor round the open bay doors (x −15 … 15, z −120 … −50), walls, ceiling
P(floor(-30, 30, -50, 12, 1), floor(-30, -15, -120, -50, 2), floor(15, 30, -120, -50, 3), floor(-30, 30, -170, -120, 4));
P(box(-34, -30, -174, 12, 30, { thick: 36, style: 'fortress-baywall', tint: 0 }), box(30, 34, -174, 12, 30, { thick: 36, style: 'fortress-baywall', tint: 1 }));
P(box(-30, 30, -174, -170, 30, { thick: 36, style: 'fortress-baywall', tint: 2 }));
P(box(-34, 34, -174, 12, 31, { thick: 3, style: 'fortress-bayceiling' }));

// ---- the GRAND SLAM on its release cradle (top 15), nose north; its tail box is a perch (DRIVE 1)
P(box(-4, 4, -100, -72, 15, { thick: 1.6, style: 'fortress-cradle' }));
P(box(-3.6, 3.6, -100, -72, 13.4, { thick: 7.2, style: 'fortress-megabomb' }));
P(box(-4.5, 4.5, -72, -64, 14.3, { thick: 9, style: 'fortress-bombtail' }));
// hoist hooks either side: the last step from the 12 m racks onto the cradle
P(pod(-11, -89, 13.5, { w: 3, d: 3, thick: 1.6, cable: 14.5, bob: bob(0.25, 3.8, 0.1) }), pod(11, -91, 13.5, { w: 3, d: 3, thick: 1.6, cable: 14.5, bob: bob(0.25, 4.2, 0.6) }));

// ---- bomb racks along both walkways: 4, 8, 12 m, and 8 m by the crane
P(rack(-26, -18, -66, -56, 4, 0), rack(-26, -18, -80, -70, 8, 1), rack(-26, -18, -94, -84, 12, 2), rack(-26, -18, -118, -108, 8, 3));
P(rack(18, 26, -66, -56, 4, 1), rack(18, 26, -82, -72, 8, 2), rack(18, 26, -98, -86, 12, 3), rack(18, 26, -118, -108, 8, 0));

// ---- the conveyor across the doors' south end: a rail and two sleds out of step
P(box(-15, 15, -58.3, -57.7, 0.8, { thick: 0.5, style: 'fortress-rail' }));
P(rect(0, -58, 4, 3, 1.7, { thick: 0.8, style: 'fortress-sled', move: mv('x', 11, 8, 0) }), rect(0, -58, 4, 3, 1.7, { thick: 0.8, style: 'fortress-sled', tint: 1, move: mv('x', 11, 8, 0.5) }));

// ---- the gantry cranes: the north one trucks its load right across the doors (DRIVE 2 rides it)
P(box(-30, 30, -114, -110, 22, { thick: 1.6, style: 'fortress-cranebeam' }));
P(rect(0, -112, 5, 5, 9, { thick: 1.2, style: 'fortress-craneload', tint: 13, move: mv('x', 13, 12, 0.25) }));
P(box(-30, 30, -38, -34, 22, { thick: 1.6, style: 'fortress-cranebeam' }));
P(rect(0, -36, 5, 5, 5, { thick: 1.2, style: 'fortress-craneload', tint: 17, move: mv('x', 20, 11, 0) }));
// wall ledges the south crane load swings to
P(box(-30, -26, -46, -26, 10, { thick: 0.8, style: 'fortress-catwalk', tint: 0 }), box(26, 30, -46, -26, 10, { thick: 0.8, style: 'fortress-catwalk', tint: 0 }));

// ---- under the west door edge: the maintenance catwalk (PORTAL) and its lift back up
P(box(-15, -10, -100, -70, -8, { thick: 0.6, style: 'fortress-catwalk', tint: 2 }));
P(rect(-12.5, -103.5, 4, 4, -4, { thick: 0.6, style: 'fortress-elevator', tint: 2, move: mv('y', 4.2, 7, 0) })); // −8.2 … 0.2

// ---- the north end: the launch gallery (EXIT) and crates up to it
P(box(-10, 10, -168, -156, 6, { thick: 6, style: 'fortress-gallery' }));
P(...ammo(-14, -158, 0, 1, { tint: 1 }), ...ammo(14, -158, 0, 2, { tint: 2 }), ...ammo(-22, -138, 0, 1, { tint: 3 }), ...ammo(22, -150, 0, 1, { tint: 0 }));
// munitions carts by the start (cover)
P(...ammo(-10, -16, 0, 1, { tint: 0, w: 5.2 }), ...ammo(12, -26, 0, 1, { tint: 2, d: 5.2 }), ...ammo(-20, -45, 0, 2, { tint: 1 }));

const lasers = [
  laser(22, 12, -89.5, 8, 2.6, 0, 3, 0.5, 0), // on the 12 m east rack, before DRIVE 3
  laser(0, 15, -74.5, 8, 2.8, 0, 3.4, 0.5, 0.3), // the cradle's arming curtain, before the tail
  laser(-22.5, 0, -104, 15, 3, 0, 3, 0.5, 0.2), // the west walkway
  laser(0, 0, -130, 60, 3, 0, 3.4, 0.5, 0), // security: two curtains out of step before the gallery
  laser(0, 0, -142, 60, 3, 0, 3.4, 0.5, 0.5),
];

export default {
  id: 'fortress-bay', name: 'BOMB BAY', sub: 'AIR FORTRESS · ORDNANCE HANGAR · 03:20 · RED ALERT', theme: 'fortressBay', song: 'netdive',
  seed: 7003, par: 300, killY: -20, cloudY: -100,
  start: { x: 0, y: 0, z: 6, yaw: 0 },
  plats, lasers,
  drives: [
    { x: 0, y: 15.4, z: -67 }, // the bomb's tail
    { x: 13, y: 10.1, z: -112 }, // riding the crane load
    { x: 22, y: 13.1, z: -95 }, // the east 12 m rack, behind its curtain
  ],
  exit: { x: 0, y: 6, z: -162, yaw: 0 },
  portal: { x: -12.5, y: -6.6, z: -78 },
  bonusStyle: { theme: 'fortressBonus3', music: 'serverRush', weapon: 'rocket', tag: 'Ω-3' },
  enemies: [
    { type: 'guard', x: -8, y: 0, z: -30 },
    { type: 'guard', x: -22, y: 0, z: -98 },
    { type: 'guard', x: 16.5, y: 0, z: -68 },
    { type: 'guard', x: 12, y: 0, z: -146 },
    { type: 'turret', x: -7, y: 6, z: -159 },
    { type: 'turret', x: 7, y: 6, z: -159 },
    { type: 'walker', x: -22, y: 8, z: -75 },
    { type: 'walker', x: 0, y: 15, z: -92 },
    { type: 'spiker', x: 22, y: 8, z: -77 },
    { type: 'drone', x: 0, y: 7, z: -56 },
    { type: 'drone', x: 0, y: 21, z: -84 },
    { type: 'drone', x: -6, y: 14, z: -116 },
    { type: 'drone', x: 10, y: 16, z: -134 },
  ],
  pickups: [
    { type: 'health', x: -4, y: 1, z: -20 },
    { type: 'spread', x: -22, y: 5, z: -61 },
    { type: 'rapid', x: 22, y: 5, z: -61 },
    { type: 'healthBig', x: -12.5, y: -7, z: -90 },
    { type: 'rocket', x: 0, y: 16, z: -96 },
    { type: 'health', x: -20, y: 1, z: -150 },
    { type: 'slowmo', x: -22, y: 9, z: -113 },
    { type: 'overdrive', x: 0, y: 23, z: -112 }, // up on the north crane's beam
  ],
  backdrops: [
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: -40, z: -85, r: 120, period: 50, phase: 0.1 }, // seen through the doors, far below
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: 10, z: 40, r: 260, period: 80, phase: 0.6, dir: -1 }, // seen past the open ramp
    { kind: 'fortress-escorts', x: -300, y: 40, z: 520, yaw: 2.6, s: 1.1 },
    { kind: 'fortress-carrier', x: 520, y: -30, z: 560, yaw: -2.4, s: 1.2, haze: 0.4 },
    { kind: 'fortress-cumulus', x: 260, y: -150, z: 600, s: 1.4 },
  ],
};
