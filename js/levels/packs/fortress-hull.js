// AIR FORTRESS · stage 2 — HULL BREACH. Outside the ship at sunset, under the port wing: the wing's
// belly is a ceiling 30 m up (no triple jumps under it), catwalks hang from it on rods, cargo pods
// sway on their cables, and a colossal engine nacelle hangs on its pylon. A lift-fan hub turns its
// rotor pods round like a carousel. Then out past the wing's edge and up its flank to the top.
//
// Map (north = −Z, up the page; the wing covers x < 22 from y 30 to 50):
//
//            [ENGINE NACELLE 14 m]                       │ flank: landings 17 → 27.5,
//      DRIVE 2 ↑ curtain   ‖ pylon ‖     ( lift-fan hub ) │ gun sponson 31, hanging pods,
//                [blister]        ◦ rotor pods ◦ DRIVE 1  │ gantries 45 / 48.5 → WING TOP 50, EXIT
//          pods ↑                                         │
//   START ── catwalk ── [J1] ── catwalk ═curtain═ ── [J2] │  (the wing's edge, x 22)
//                pods ↓                         deep pod ↓ (PORTAL)
//         [weapons hatch: DRIVE 3 behind a curtain]
import { rect, box, disc, mv, orbit, laser } from '../kit.js';
import { walk, pod, blister } from './fortress-kit.js';

const BELLY = 30, TOP = 50, CAT = 18;
const plats = [];
const P = (...a) => plats.push(...a);
const hang = (x, z, top, o = {}) => pod(x, z, top, { ...o, cable: BELLY - top }); // a cargo pod hanging from the belly

// ---- the port wing: its belly is the ceiling, its top is where you finish
P(box(-110, 22, -170, 50, TOP, { thick: TOP - BELLY, style: 'fortress-wing' }));

// ---- the belly catwalks (18 m), hung from the wing on rods
P(box(-74, -58, -8, 8, CAT, { thick: 2, style: 'fortress-catwalk', tint: 1 })); // the access hatch landing (START)
P(walk(-54, 0, -36, 0, CAT, { tint: 1 }));
P(box(-34, -24, -5, 5, CAT, { thick: 1.2, style: 'fortress-catwalk', tint: 1 })); // junction 1
P(walk(-20, 0, 2, 0, CAT, { tint: 1 }));
P(box(6, 16, -5, 5, CAT, { thick: 1.2, style: 'fortress-catwalk', tint: 1 })); // junction 2
// cargo pods: junction 1 → the nacelle (north), → the weapons hatch (south)
P(hang(-29, -11, 17), hang(-30, -17.5, 15.5));
P(hang(-29, 11, 18.5), hang(-28, 18.5, 19));
P(box(-36, -20, 26, 40, CAT, { thick: 1.2, style: 'fortress-catwalk', tint: 3 })); // the weapons hatch (DRIVE 3)
// the deep pod under junction 2 (PORTAL) and the pods back up
P(hang(11, 14, 7, { w: 5, d: 5 }), hang(17, 20, 10.5), hang(20, 13, 14), hang(19.5, 4, 17.5));

// ---- the ENGINE NACELLE (top 14) on its pylon; the pylon splits its back into two lanes
P(box(-36, -24, -64, -24, 14, { thick: 10, style: 'fortress-nacelle' }));
P(box(-31.5, -28.5, -62, -28, BELLY, { thick: BELLY - 14, style: 'fortress-pylon' }));
// a gun blister hanging east of it, then the lift-fan hub and its four rotor pods (a carousel)
P(blister(-17, -40, 14.5));
P(disc(2, -36, 4, 15, { thick: 3, style: 'fortress-rotorhub' }));
for (let k = 0; k < 4; k++) P(disc(2, -36, 2.4, 15.5, { thick: 0.8, style: 'fortress-rotorpod', move: orbit('xz', 11, 18, k / 4) }));
// pods along the wing's edge, carousel → the flank lift
P(hang(19, -44, 16.5), hang(18.5, -53, 17), hang(19, -62, 17), hang(19.5, -71, 17.5), hang(20, -80, 17.5), hang(19.5, -89, 17.5));

// ---- the FLANK: landings climbing north along the wing's edge, a lift, the gun sponson at 31
const gant = (z0, z1, top, x0 = 23, x1 = 30) => box(x0, x1, z0, z1, top, { thick: 1, style: 'fortress-gantry' });
P(gant(-40, -32, 17), gant(-50, -44, 20.5, 23, 29), gant(-60, -54, 24, 23, 29), gant(-70, -64, 27.5, 23, 29));
P(box(23, 31, -84, -74, 31, { thick: 3, style: 'fortress-gunmount', tint: 1 })); // the gun sponson
P(rect(26.5, -89, 6, 6, 24.25, { thick: 1, style: 'fortress-elevator', tint: 2, move: mv('y', 6.75, 11, 0.75) })); // 17.5 … 31
// pods slung from crane arms on the wing's top edge, then two gantries to the top
const sling = (x, z, top) => pod(x, z, top, { cable: TOP + 2 - top });
P(sling(34, -72, 34.5), sling(33, -62, 38), sling(32, -52, 41.5));
P(gant(-46, -38, 45), gant(-36, -28, 48.5, 23, 29));

// ---- the wing top: a radar dome, the dorsal spine, and the EXIT
P(disc(-10, -64, 6, TOP + 3.5, { thick: 4, style: 'fortress-dome' }));
P(box(-40, -36, -110, -20, TOP + 2.5, { thick: 3, style: 'fortress-spine' }));

const lasers = [
  laser(-9, CAT, 0, 3.2, 2.6, Math.PI / 2, 3, 0.5, 0), // across catwalk 2
  laser(-33.75, 14, -52, 4.5, 2.8, 0, 3.2, 0.5, 0), // the nacelle's west lane, before DRIVE 2
  laser(-28, CAT, 27.5, 16, 2.6, 0, 3.2, 0.5, 0.4), // the weapons hatch
  laser(26.5, 45, -42, 7, 2.6, 0, 3, 0.5, 0.2), // the last gantry
];

export default {
  id: 'fortress-hull', name: 'HULL BREACH', sub: 'AIR FORTRESS · UNDER THE PORT WING · 02:30 · FLAK', theme: 'fortressHull', song: 'sprint',
  seed: 7002, par: 300, killY: -10, cloudY: -110,
  start: { x: -66, y: CAT, z: 2, yaw: -Math.PI / 2 },
  plats, lasers,
  drives: [
    { x: 13, y: 16.6, z: -36 }, // riding a rotor pod of the lift fan
    { x: -33.75, y: 15.1, z: -60 }, // the nacelle's intake, behind the curtain
    { x: -28, y: CAT + 1.1, z: 36 }, // the weapons hatch
  ],
  exit: { x: 6, y: TOP, z: -32, yaw: -Math.PI / 2 }, // on the wing top, facing the flank you climb
  portal: { x: 11, y: 8.4, z: 14 }, // the deep pod under junction 2
  bonusStyle: { theme: 'fortressBonus2', music: 'serverRush', weapon: 'spread', tag: 'Ω-2' },
  enemies: [
    { type: 'turret', x: -27, y: CAT, z: 3 },
    { type: 'turret', x: -17, y: 14.5, z: -40 },
    { type: 'turret', x: 27, y: 31, z: -79 },
    { type: 'turret', x: 8, y: TOP, z: -50 },
    { type: 'guard', x: 12, y: CAT, z: -3 },
    { type: 'guard', x: -24, y: CAT, z: 33 },
    { type: 'guard', x: 26, y: 24, z: -57 },
    { type: 'walker', x: -26, y: 14, z: -40 },
    { type: 'walker', x: -34, y: 14, z: -38 },
    { type: 'spiker', x: 2, y: 15, z: -36 },
    { type: 'drone', x: -12, y: 22, z: -16 },
    { type: 'drone', x: 8, y: 23, z: -52 },
    { type: 'drone', x: 37, y: 40, z: -60 },
    { type: 'drone', x: -44, y: 21, z: 18 },
  ],
  pickups: [
    { type: 'health', x: -30, y: CAT + 1, z: -2 },
    { type: 'spread', x: -5, y: CAT + 1, z: 0 },
    { type: 'rapid', x: 12, y: CAT + 1, z: 3 },
    { type: 'rocket', x: -26, y: 15, z: -60 },
    { type: 'healthBig', x: 12.5, y: 8, z: 12.5 },
    { type: 'health', x: 25, y: 32, z: -76 },
    { type: 'slowmo', x: 2, y: 16, z: -33 },
  ],
  backdrops: [
    { kind: 'fortress-wingfar', x: -110, y: BELLY, z: -60, len: 520, side: -1 }, // the wing running on to the west…
    { kind: 'fortress-turbine', x: -30, y: 9, z: -64.3, r: 4.3 }, // the nacelle's intake fan
    { kind: 'fortress-rotor', x: 2, y: 13.2, z: -36, r: 8 }, // the lift fan's rotor, under its hub
    { kind: 'fortress-nacelle', x: -84, y: 4, z: -44, haze: 0.25 }, // the other engines along the wing
    { kind: 'fortress-nacelle', x: -84, y: 4, z: 22, haze: 0.3 },
    { kind: 'fortress-carrier', x: 620, y: 10, z: -380, yaw: -0.7, s: 1.2, haze: 0.5 },
    { kind: 'fortress-gunship', haze: 0.15, x: 30, y: 6, z: -40, r: 150, period: 60, phase: 0.2 },
    { kind: 'fortress-gunship', haze: 0.15, x: 30, y: 60, z: -40, r: 230, period: 85, phase: 0.7, dir: -1 },
    { kind: 'fortress-escorts', x: 460, y: 70, z: 160, yaw: 2.2, s: 1.1 },
    { kind: 'fortress-cumulus', x: 560, y: -130, z: -200, s: 1.6 },
    { kind: 'fortress-cumulus', x: 420, y: -130, z: 380, s: 1.2 },
    { kind: 'fortress-cumulus', x: -300, y: -130, z: 700, s: 1.5 },
    // the night: searchlights off the leading edge and raking the clouds from the belly, tracers, flak, the city below
    { kind: 'fortress-searchlights', x: 26, y: 26, z: -128, aim: -1.7, pitch: 0.35, sweep: 0.6, n: 2 },
    { kind: 'fortress-searchlights', x: 26, y: 26, z: 30, aim: -1.4, pitch: 0.45, sweep: 0.6, n: 2, phase: 2.5 },
    { kind: 'fortress-searchlights', x: -86, y: 28, z: -20, aim: 1.9, pitch: -0.45, sweep: 0.7, n: 2, phase: 1, len: 300 },
    { kind: 'fortress-searchlights', x: -40, y: 28, z: -150, aim: 0.4, pitch: -0.35, sweep: 0.7, n: 2, phase: 3.5, len: 300 },
    { kind: 'fortress-tracers', x: 30, y: 33, z: -79, aim: -1.6, pitch: 0.45, phase: 0.4 },
    { kind: 'fortress-tracers', x: -96, y: 26, z: -110, aim: 2.3, pitch: 0.1, phase: 2, col: 0xff5a3a },
    { kind: 'fortress-tracers', x: -30, y: 52, z: -150, aim: 0.4, pitch: 0.8, phase: 3.3 },
    { kind: 'fortress-flak', x: 320, y: 40, z: -60, w: 200, h: 140, d: 420 },
    { kind: 'fortress-flak', x: -40, y: 20, z: 340, w: 380, h: 120, d: 180, phase: 0.6 },
    { kind: 'fortress-flak', x: 160, y: 110, z: -380, w: 360, h: 100, d: 200, phase: 1.3 },
    { kind: 'fortress-citygap', x: 330, y: -109, z: -100, r: 130, coast: 3.5 },
    { kind: 'fortress-citygap', x: 250, y: -109, z: 280, r: 95 },
    { kind: 'fortress-citygap', x: -220, y: -109, z: 360, r: 110, coast: 1.2 },
    { kind: 'fortress-citygap', x: 100, y: -109, z: -440, r: 110 },
  ],
};
