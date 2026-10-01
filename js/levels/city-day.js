// Stage 2 — SKYWAY. Neo-Tokyo rooftops by day. No ground: the streets are somewhere far below
// in the haze. Hover cars are the islands between towers; a shuttle bus runs a lane between two.
//
//            [ARCOLOGY tier 2 + EXIT]  (0, -125, 70 m) ← cars spiral up from tier 1 (50 m)
//   [billboard deck + DRIVE 3]                         [spire + DRIVE 1] (64, -82, 58 m)
//        ↑ cars                                          ↑ cars   [T2b 41 m]
//   [T4 22 m] ====bus lane (DRIVE 2)==== [T1 24 m] → cars → [T2 30 m]
//                                          ↑ cars
//                                       [T0 START 20 m]       [T5 6 m + PORTAL] ↗ cars back up to T2
import { tower, rect, disc, car, chain, spiral, skyline, bob, mv, billboard, adpad, laser } from './kit.js';

const plats = [];
const P = (...a) => plats.push(...a);

// ---- the route
P(tower(0, 0, 16, 16, 20, { tint: 0 }), disc(0, 0, 5.5, 20.3, { thick: 0.3, style: 'helipad' })); // T0 start
P(tower(0, -42, 14, 18, 24, { tint: 1 })); // T1
P(...chain(21, { x: 0, y: 20, z: -8 }, { x: 0.5, y: 24, z: -33 }, { ads: 0.4 }));
P(tower(40, -32, 12, 12, 30, { tint: 2 })); // T2
P(...chain(22, { x: 7, y: 24, z: -38 }, { x: 34, y: 30, z: -34 }));
P(tower(52, -58, 10, 10, 41, { tint: 3 })); // T2b
P(...chain(23, { x: 46, y: 30, z: -38 }, { x: 48, y: 41, z: -53 }));
P(tower(64, -82, 6, 6, 58, { tint: 4, style: 'spire' })); // the spire: DRIVE 1
P(...chain(24, { x: 57, y: 41, z: -63 }, { x: 62, y: 58, z: -79 }, { maxRise: 3.5 }));
// shuttle bus lane T1 ⇄ T4 (DRIVE 2 rides on its roof)
P(tower(-52, -42, 14, 14, 22, { tint: 5 })); // T4
P(car('bus', -26, -42, 23, Math.PI / 2, { move: mv('x', 13, 13, 0), bob: bob(0.1, 4, 0) }));
// billboard deck (DRIVE 3) on a frame north of T4
P(rect(-62, -92, 18, 5, 38, { thick: 9, style: 'billboard' }));
P(...chain(25, { x: -52, y: 22, z: -49 }, { x: -60, y: 38, z: -89 }, { ads: 0.5 }));
// the arcology: a 50 m podium and a 70 m crown with the EXIT gate
P(tower(0, -125, 34, 30, 50, { tint: 6, style: 'arcology' }));
P(tower(0, -125, 16, 16, 70, { tint: 7, style: 'crown' }));
P(...chain(26, { x: -53, y: 38, z: -92 }, { x: -17, y: 50, z: -118 }, { ads: 0.4 }));
P(...spiral(27, 0, -125, 12.5, 50, 70, Math.PI, 0.85, { rise: 3.4 }));
// the low roof with the PORTAL (south-east), and a car stair back up to T2
P(tower(34, 18, 12, 12, 6, { tint: 3 }));
P(...chain(28, { x: 34, y: 6, z: 12 }, { x: 40, y: 30, z: -26 }, { ads: 0.3 }));

// ---- scenery you can still land on: a few near towers and a ring of far ones
P(tower(-30, 8, 12, 12, 12, { tint: 2 }), tower(26, -72, 10, 14, 18, { tint: 4 }), tower(-26, -78, 12, 10, 28, { tint: 1 }));
P(tower(32, -112, 10, 10, 34, { tint: 5 }), tower(-40, -130, 14, 12, 44, { tint: 3 }), tower(70, -20, 14, 14, 26, { tint: 6 }));
P(...skyline(29, 0, -60, 105, 165, 26, 10, 80, [[0, -125, 30]]));
// sky traffic parked in the air: optional shortcuts
P(car('van', -24, -14, 17, 0.6, { bob: bob(0.2, 3.3, 0.3) }), car('truck', 22, -96, 30, -0.3, { move: mv('x', 5, 9, 0), bob: bob(0.15, 4, 0.1) }));

// floating billboards: shortcuts, perches and the city's endless sales pitch
P(billboard(19, -12, 13, 23, -0.4, { ad: 2 }), billboard(-27, -24, 14, 27, 0.5, { ad: 4 }));
P(billboard(24, -128, 18, 47, 0.1, { ad: 6, tall: 10 }), billboard(-22, -104, 13, 44, 0, { ad: 8, move: mv('x', 6, 10, 0) }));
P(billboard(46, -102, 22, 64, -0.3, { ad: 10, tall: 14 }), billboard(-78, -40, 22, 40, 1.2, { ad: 12, tall: 14 }), billboard(60, 30, 20, 32, -0.8, { ad: 13, tall: 12 }));
P(adpad(52, -70, 5, 6, 45, 0.3, { ad: 14 }));

const lasers = [
  laser(0, 24, -44, 14, 2.4, 0, 3.2, 0.5, 0), // across T1
  laser(52, 41, -58, 10, 2.4, Math.PI / 2, 2.8, 0.5, 0.3), // T2b
  laser(-52, 22, -42, 14, 3.2, Math.PI / 2, 3.4, 0.5, 0.6), // T4: stand clear of the bus stop
  laser(0, 50, -112.5, 18, 5, 0, 4, 0.45, 0), // arcology podium: two curtains in step
  laser(0, 50, -137.5, 18, 5, 0, 4, 0.45, 0.5),
  laser(-56.5, 38, -92, 5, 3, Math.PI / 2, 2.4, 0.5, 0.2), // billboard deck, beside the drive
];

export default {
  id: 'skyway', name: 'SKYWAY', sub: 'NEO-TOKYO · 11:05 · HAZE', theme: 'cityDay', music: 'hedgerow',
  seed: 22, par: 300, killY: -24,
  start: { x: 0, y: 20.3, z: 3, yaw: 0 },
  plats, lasers,
  drives: [
    { x: 64, y: 59.1, z: -82 },
    { x: -26, y: 24.2, z: -42 },
    { x: -62, y: 39.1, z: -92 },
  ],
  exit: { x: 0, y: 70, z: -125, yaw: 0 },
  portal: { x: 36, y: 7.4, z: 20 },
  enemies: [
    { type: 'walker', x: 0, y: 24, z: -46 },
    { type: 'guard', x: 42, y: 30, z: -30 },
    { type: 'guard', x: -54, y: 22, z: -44 },
    { type: 'walker', x: -62, y: 38, z: -92 },
    { type: 'guard', x: 10, y: 50, z: -114 },
    { type: 'guard', x: -10, y: 50, z: -134 },
    { type: 'walker', x: 52, y: 41, z: -58 },
    { type: 'drone', x: 58, y: 54, z: -76 },
    { type: 'drone', x: -26, y: 28, z: -46 },
    { type: 'drone', x: -40, y: 34, z: -70 },
    { type: 'drone', x: -30, y: 48, z: -108 },
    { type: 'drone', x: 8, y: 62, z: -112 },
    { type: 'drone', x: 34, y: 14, z: 6 },
  ],
  pickups: [
    { type: 'health', x: 3, y: 25, z: -38 },
    { type: 'spread', x: 38, y: 31, z: -34 },
    { type: 'rapid', x: -50, y: 23, z: -38 },
    { type: 'rocket', x: 12, y: 51, z: -130 },
    { type: 'healthBig', x: 32, y: 7, z: 16 },
    { type: 'health', x: -58, y: 39, z: -92 },
    { type: 'health', x: 52, y: 42, z: -61 },
    { type: 'slowmo', x: -4, y: 51, z: -116 },
  ],
};
