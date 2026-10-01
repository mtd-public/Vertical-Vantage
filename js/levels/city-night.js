// Stage 3 — NEON RAIN. Neo-Tokyo at night, raining. More vertical, more hostile:
// live traffic lanes to hop across, a police cruiser on patrol carrying a drive,
// a pagoda on a skyscraper roof, and the exit 92 m up on a megatower's crown.
//
//   [megatower crown + EXIT] (-10, -155, 92 m) ← spiral from the 76 m roof
//      ↑ long car stair from T6           ↑ cars from the pagoda tower
//   [T6 46 m]+[neon sign DRIVE 1]   [T8 60 m + pagoda DRIVE 3 at 71 m]
//        ↑ cars                          ↑ cars          [police cruiser lane DRIVE 2]
//              [T1 34 m] ── cars ──→ [T7 38 m] → van → ↑
//               ↑ live traffic lanes (moving cars)
//   [T9 16 m PORTAL] ← drop    [T0 START 30 m]
import { tower, rect, disc, car, chain, spiral, skyline, bob, mv, billboard, adpad, laser } from './kit.js';

const plats = [];
const P = (...a) => plats.push(...a);

P(tower(0, 0, 14, 14, 30, { tint: 1 }), disc(0, 0, 5, 30.3, { thick: 0.3, style: 'helipad' })); // T0 start
P(tower(0, -40, 16, 16, 34, { tint: 2 })); // T1
// live traffic between T0 and T1: three lanes sliding across, one parked car as a fallback
P(car('taxi', 0, -14, 31.5, Math.PI / 2, { move: mv('x', 9, 6.5, 0), bob: bob(0.1, 3, 0) }));
P(car('sedan', 0, -21, 32.6, -Math.PI / 2, { move: mv('x', 9, 7.5, 0.5), bob: bob(0.1, 3, 0.3) }));
P(car('coupe', 0, -27.5, 33.4, Math.PI / 2, { move: mv('x', 8, 6, 0.25), bob: bob(0.1, 3, 0.6) }));
P(car('van', 11, -19, 32, 0.25, { bob: bob(0.2, 3.4, 0.2) }));
// west: T6 and the neon sign jutting from its face (DRIVE 1)
P(tower(-42, -60, 16, 20, 46, { tint: 3 }));
P(rect(-31.5, -60, 5, 14, 53, { thick: 12, style: 'sign', tint: 0 }));
P(...chain(31, { x: -8, y: 34, z: -44 }, { x: -34, y: 46, z: -54 }, { ads: 0.5 }));
// east: T7, a van, and the police cruiser's patrol lane (DRIVE 2)
P(tower(40, -40, 14, 14, 38, { tint: 4 }));
P(...chain(32, { x: 8, y: 34, z: -38 }, { x: 33, y: 38, z: -40 }));
P(car('van', 41, -53, 40.5, 0, { bob: bob(0.18, 3.2, 0.4) }));
P(car('police', 40, -75, 42, 0, { move: mv('z', 14, 11, 0), bob: bob(0.12, 3, 0.1) }));
// the pagoda tower (DRIVE 3 on its top tier)
P(tower(45, -112, 18, 18, 60, { tint: 5 }));
P(rect(45, -112, 13, 13, 65.5, { thick: 5.5, style: 'pagoda' }), rect(45, -112, 8, 8, 71, { thick: 5.5, style: 'pagoda' }));
P(...chain(33, { x: 47, y: 38, z: -47 }, { x: 48, y: 60, z: -103 }, { ads: 0.4 }));
// the megatower and its crown (EXIT), reached from the pagoda or by the long stair from T6
P(tower(-10, -155, 30, 30, 76, { tint: 6, style: 'arcology' }));
P(tower(-10, -155, 14, 14, 92, { tint: 7, style: 'crown' }));
P(...chain(34, { x: 36, y: 60, z: -116 }, { x: 5, y: 76, z: -148 }));
P(...chain(35, { x: -42, y: 46, z: -70 }, { x: -24, y: 76, z: -140 }, { maxRise: 3.4, ads: 0.5 }));
P(...spiral(36, -10, -155, 11.5, 76, 92, -Math.PI / 2, 0.8, { rise: 3.4 }));
// the PORTAL on a low roof west of the start, and a car stair back up to T1
P(tower(-40, -10, 12, 12, 16, { tint: 0 }));
P(...chain(37, { x: -34, y: 16, z: -12 }, { x: -8, y: 34, z: -36 }, { ads: 0.3 }));

// ---- scenery
P(tower(26, 4, 12, 12, 22, { tint: 6 }), tower(-24, -96, 12, 14, 40, { tint: 2 }), tower(14, -84, 10, 10, 30, { tint: 5 }));
P(tower(70, -70, 14, 16, 50, { tint: 1 }), tower(-70, -110, 16, 16, 62, { tint: 4 }), tower(30, -160, 14, 14, 58, { tint: 3 }));
P(...skyline(39, 0, -75, 110, 170, 30, 20, 120, [[-10, -155, 34]]));
P(car('bus', -20, -120, 52, 0.9, { move: mv('x', 6, 10, 0), bob: bob(0.12, 4, 0) }));

// billboards: the night belongs to the ads
P(billboard(-18, 6, 14, 36, 0.6, { ad: 1, tall: 9 }), billboard(20, -60, 14, 44, -0.2, { ad: 3 }), billboard(-16, -78, 12, 50, 0.3, { ad: 5, move: mv('y', 3, 8, 0) }));
P(billboard(64, -100, 22, 72, -0.4, { ad: 7, tall: 16 }), billboard(-56, -128, 24, 80, 0.7, { ad: 9, tall: 16 }), billboard(20, -186, 26, 96, 0, { ad: 11, tall: 18 }));
P(billboard(-60, -30, 18, 30, 1.1, { ad: 13, tall: 10 }), billboard(36, 16, 16, 28, -0.9, { ad: 15, tall: 10 }));
P(adpad(24, -96, 6, 5, 52, 0.2, { ad: 6, move: mv('z', 5, 7, 0) }), adpad(-34, -110, 5, 6, 66, -0.4, { ad: 2 }));

const lasers = [
  laser(0, 34, -35, 16, 2.4, 0, 2.6, 0.5, 0), // T1: a corridor of two curtains out of step
  laser(0, 34, -45, 16, 2.4, 0, 2.6, 0.5, 0.5),
  laser(-42, 46, -66, 16, 3, 0, 3, 0.55, 0.2), // T6 roof
  laser(40, 38, -40, 14, 2.4, Math.PI / 2, 2.4, 0.5, 0.7), // T7
  laser(45, 60, -104, 18, 2.6, 0, 3.6, 0.5, 0), // pagoda forecourt
  laser(45, 65.5, -112, 13, 4, Math.PI / 2, 3, 0.5, 0.4), // first tier
  laser(-10, 76, -141.5, 30, 3, 0, 4.4, 0.45, 0), // megatower roof: three curtains in a wave
  laser(-10, 76, -155, 30, 3, 0, 4.4, 0.45, 0.33),
  laser(-10, 76, -168.5, 30, 3, 0, 4.4, 0.45, 0.66),
];

export default {
  id: 'neon', name: 'NEON RAIN', sub: 'NEO-TOKYO · 02:40 · RAIN', theme: 'cityNight', music: 'ghostline',
  seed: 33, par: 360, killY: -24,
  start: { x: 0, y: 30.3, z: 3, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -31.5, y: 54.1, z: -60 },
    { x: 40, y: 43.1, z: -75 },
    { x: 45, y: 72.1, z: -112 },
  ],
  exit: { x: -10, y: 92, z: -155, yaw: 0 },
  portal: { x: -40, y: 17.4, z: -10 },
  enemies: [
    { type: 'guard', x: 4, y: 34, z: -44 },
    { type: 'walker', x: -4, y: 34, z: -36 },
    { type: 'guard', x: -46, y: 46, z: -64 },
    { type: 'walker', x: -40, y: 46, z: -56 },
    { type: 'guard', x: 44, y: 38, z: -36 },
    { type: 'walker', x: 40, y: 42, z: -75 },
    { type: 'guard', x: 50, y: 60, z: -106 },
    { type: 'walker', x: 45, y: 65.5, z: -116 },
    { type: 'guard', x: 0, y: 76, z: -145 },
    { type: 'guard', x: -20, y: 76, z: -165 },
    { type: 'drone', x: 0, y: 38, z: -20 },
    { type: 'drone', x: -24, y: 44, z: -50 },
    { type: 'drone', x: 24, y: 44, z: -48 },
    { type: 'drone', x: 40, y: 50, z: -90 },
    { type: 'drone', x: 30, y: 70, z: -125 },
    { type: 'drone', x: -30, y: 64, z: -110 },
    { type: 'drone', x: -10, y: 88, z: -138 },
    { type: 'drone', x: -40, y: 22, z: -18 },
  ],
  pickups: [
    { type: 'health', x: -5, y: 35, z: -44 },
    { type: 'rapid', x: 5, y: 35, z: -46 },
    { type: 'spread', x: -38, y: 47, z: -66 },
    { type: 'health', x: 37, y: 39, z: -44 },
    { type: 'rocket', x: 40, y: 61, z: -118 },
    { type: 'healthBig', x: -42, y: 17, z: -6 },
    { type: 'health', x: 4, y: 77, z: -164 },
    { type: 'overdrive', x: -31.5, y: 54, z: -65 },
    { type: 'slowmo', x: 4, y: 35, z: -36 },
  ],
};
