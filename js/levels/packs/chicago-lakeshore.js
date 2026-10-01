// NEO CHICAGO 2 — LAKESHORE. A bright summer day on Lake Michigan: the beach, the lakefront trail,
// Millennium Park with Cloud Gate (the Bean) and the Crown Fountain, Navy Pier and its Ferris wheel,
// hover boats and a party raft on the lake, and the harbour light out on the breakwater.
//
//    [ballroom + dome]═══════ NAVY PIER ═══[WHEEL: DRIVE 1 rides a gondola]═══[headhouse]
//          ↓ buoys / boats                                                         ║ lakefront
//    [breakwater]                                   [PRITZKER ribbons]              ║ trail
//    [HARBOR LIGHT + EXIT]   ~ party raft (DRIVE 2) ~   [THE BEAN: DRIVE 3 on top,  ║
//          ↑ hover boats    ~ jet skis ~                  PORTAL under the arch]    ║
//                                                    [Crown Fountain]   [plaza]    ║
//              (lake)                                         [BEACH + START] ═════╝
import { rect, disc, bob, mv, orbit, chain, laser, billboard } from '../kit.js';
import { boat } from './chicago-kit.js';

const SAND = 1, PATH = 2, PIER = 3;
const plats = [];
const P = (...a) => plats.push(...a);

// ---- the beach (START), its lifeguard tower, umbrellas, a beach house and a jet-ski dock
P(rect(-8, 40, 64, 44, SAND, { thick: 2.5, style: 'chiSand' })); // x -40..24, z 18..62
P(rect(14, 34, 3, 3, 4.6, { thick: 1.2, style: 'chiLifeguard' }));
P(disc(-20, 44, 1.8, 3.4, { thick: 0.3, style: 'chiUmbrella', tint: 0 }), disc(-28, 30, 1.8, 3.6, { thick: 0.3, style: 'chiUmbrella', tint: 1 }), disc(2, 28, 1.8, 3.3, { thick: 0.3, style: 'chiUmbrella', tint: 2 }), disc(-4, 46, 1.8, 3.5, { thick: 0.3, style: 'chiUmbrella', tint: 3 }));
P(rect(-30, 54, 12, 7, 5.2, { thick: 4.2, style: 'chiBeachHouse' }));
P(rect(34, 40, 20, 3.2, 1.7, { thick: 2, style: 'chiDock' })); // x 24..44
// jet skis shuttle up the shore toward the pier (hover boats you hop between)
P(boat(52, 30, 3.4, 1.6, 1.5, 0, { style: 'chiJetski', tint: 0, move: mv('z', 9, 9, 0) }));
P(boat(58, 18, 3.4, 1.6, 1.6, 0, { style: 'chiJetski', tint: 1, move: mv('x', 4, 7, 0.3) }));

// ---- the lakefront trail north to the pier, Millennium Park west of it
P(rect(-28, -49, 16, 134, PATH, { thick: 3.5, style: 'chiTrail' })); // x -36..-20, z -116..18
P(rect(-70, -45, 68, 70, PATH, { thick: 3.5, style: 'chiPlaza' })); // x -104..-36, z -80..-10
// Cloud Gate: a top you can stand on and two hidden lobes; you walk under its arch (the PORTAL)
P(rect(-74, -40, 12, 5, 11, { thick: 3.2, style: 'chiBean' }));
P(rect(-82, -40, 4, 6, 7.8, { thick: 5.8, style: 'chiNone' }), rect(-66, -40, 4, 6, 7.8, { thick: 5.8, style: 'chiNone' }));
// Pritzker Pavilion: a stage and its steel ribbons curling up beside the Bean
P(rect(-74, -70, 22, 10, 3.2, { thick: 1.4, style: 'chiStage' }));
for (let i = 0; i < 4; i++) {
  const a = Math.PI * (1.15 - i * 0.28), r = 9;
  P(rect(-74 + Math.cos(a) * r, -64 + Math.sin(a) * r, 6.5, 2.6, 6.2 + i * 3.2, { thick: 0.5, yaw: -a + Math.PI / 2, style: 'chiRibbon', tint: i }));
}
// the Crown Fountain: two glass-block towers that face each other across a shallow pool
P(rect(-96, -40, 10, 30, PATH + 0.05, { thick: 0.4, style: 'chiPool' }));
P(rect(-96, -20, 7, 4, 13.5, { thick: 11.5, style: 'chiCrown', tint: 0 }), rect(-96, -60, 7, 4, 13.5, { thick: 11.5, style: 'chiCrown', tint: 1 }));
P(rect(-87, -30, 3, 3, 5.6, { thick: 3.6, style: 'chiKiosk', tint: 2 }), rect(-92, -26.5, 3, 3, 9.2, { thick: 7.2, style: 'chiKiosk', tint: 3 })); // info booths step up to each tower
P(rect(-87, -50, 3, 3, 5.6, { thick: 3.6, style: 'chiKiosk', tint: 1 }), rect(-92, -53.5, 3, 3, 9.2, { thick: 7.2, style: 'chiKiosk', tint: 0 }));

// ---- NAVY PIER: boardwalk east into the lake, split round the Ferris wheel's pit
P(rect(2, -128, 76, 24, PIER, { thick: 4, style: 'chiPier' })); // x -36..40
P(rect(105, -128, 90, 24, PIER, { thick: 4, style: 'chiPier' })); // x 60..150
P(rect(50, -136, 20, 8, PIER, { thick: 4, style: 'chiPier' }), rect(50, -120, 20, 8, PIER, { thick: 4, style: 'chiPier' }));
P(rect(-28, -130, 12, 14, 11, { thick: 8, style: 'chiHeadhouse' }), rect(-28, -135, 4, 4, 15, { thick: 4, style: 'chiHeadTower' }), rect(-28, -125, 4, 4, 15, { thick: 4, style: 'chiHeadTower' }));
P(rect(12, -136, 26, 6, 8, { thick: 5, style: 'chiShed', tint: 0 }), rect(100, -120, 26, 6, 8, { thick: 5, style: 'chiShed', tint: 1 }));
// the Centennial-style wheel: hub at (50, 24.4, -128), radius 17; twelve gondolas, evenly phased
const HUB = { x: 50, y: 24.4, z: -128 }, R = 17, HANG = 2.4, NG = 12;
P(disc(HUB.x, HUB.z, 1.6, HUB.y + 0.6, { thick: 1.2, style: 'chiWheel' }));
for (let i = 0; i < NG; i++) P(rect(HUB.x, HUB.z, 3.2, 3.2, HUB.y - HANG, { thick: 0.5, style: 'chiGondola', tint: i, move: orbit('xy', R, 30, i / NG), bob: null }));
// the grand ballroom at the pier's end, its stepped dome
P(rect(138, -128, 22, 20, 12, { thick: 9, style: 'chiBallroom' }));
P(disc(138, -128, 7, 16.5, { thick: 4.5, style: 'chiDome', tint: 0 }), disc(138, -128, 4.4, 20, { thick: 3.5, style: 'chiDome', tint: 1 }), disc(138, -128, 2, 23, { thick: 3, style: 'chiDome', tint: 2 }));
P(billboard(82, -144, 16, 14, 0, { ad: 19, tall: 7 }));

// ---- the lake: a party raft circling (DRIVE 2), hover boats, buoys out to the breakwater
P(disc(78, -46, 3.2, 1.5, { thick: 1.2, style: 'chiRaft', move: orbit('xz', 12, 20, 0), bob: bob(0.15, 3, 0) }));
P(...chain(2011, { x: 44, y: 1.7, z: 40 }, { x: 72, y: 1.5, z: -32 }, { make: (rng, x, z, top, yaw, i) => boat(x, z, 6.5, 2.6, 1.5 + (i % 2) * 0.2, yaw, { tint: i % 4, bob: bob(0.15, 3 + rng(), rng()) }) }));
P(...chain(2012, { x: 92, y: 1.5, z: -48 }, { x: 146.5, y: 2.4, z: -38 }, { make: (rng, x, z, top, yaw, i) => boat(x, z, 6.5, 2.6, 1.6, yaw + Math.PI / 2 * (i % 2), { tint: (i + 2) % 4, bob: bob(0.15, 3 + rng(), rng()) }) }));
P(...chain(2013, { x: 146, y: PIER, z: -116 }, { x: 150, y: 2.4, z: -86 }, { make: (rng, x, z, top, yaw, i) => disc(x, z, 1.5, 2.6 + (i % 2) * 0.4, { thick: 2.6, style: 'chiBuoy', tint: i % 2, bob: bob(0.18, 2.6 + rng(), rng()) }) }));
P(boat(110, -90, 12, 3.6, 1.8, 0.4, { style: 'chiSailboat', tint: 0 }), boat(36, -70, 12, 3.6, 1.8, -0.3, { style: 'chiSailboat', tint: 1 }));
// the breakwater and the harbour light (EXIT on its gallery)
P(rect(150, -60, 7, 52, 2.4, { thick: 3, style: 'chiBreakwater' })); // z -86..-34
P(rect(150, -50, 7, 8, 7, { thick: 4.6, style: 'chiFogHouse' }), rect(147.5, -51, 2.2, 2.4, 11.5, { thick: 4.5, style: 'chiBelfry' }));
P(disc(150, -42, 3.2, 18, { thick: 15.6, style: 'chiLighthouse' }));

const lasers = [
  laser(-28, PATH, -62, 16, 2.4, 0, 3, 0.5, 0), // across the trail
  laser(30, PIER, -128, 24, 2.4, Math.PI / 2, 3.2, 0.5, 0), // across the pier, either side of the wheel
  laser(78, PIER, -128, 24, 2.4, Math.PI / 2, 3.2, 0.5, 0.5),
  laser(150, 2.4, -66, 7, 2.6, 0, 2.6, 0.5, 0.3), // on the breakwater
];

export default {
  id: 'chicago-lakeshore', name: 'LAKESHORE', sub: 'NEO CHICAGO · 13:15 · SUMMER', theme: 'chiLake', song: 'chiJuke',
  seed: 2002, par: 320, killY: -0.6, water: 0,
  start: { x: -8, y: SAND, z: 54, yaw: -0.3 },
  plats, lasers,
  drives: [
    { x: HUB.x + R, y: HUB.y - HANG + 1.1, z: HUB.z }, // riding gondola 0 (level with the hub at the start)
    { x: 78 + 12, y: 2.6, z: -46 }, // on the party raft
    { x: -74, y: 12.1, z: -40 }, // on top of the Bean
  ],
  exit: { x: 150, y: 18, z: -42, yaw: 0 },
  portal: { x: -74, y: PATH + 1.4, z: -40 }, // under Cloud Gate's arch
  bonusStyle: { theme: 'chiBonus', music: 'chiJuke', weapon: 'rapid', tag: 'LAKESHORE' },
  enemies: [
    { type: 'spiker', x: -14, y: SAND, z: 32 },
    { type: 'walker', x: -28, y: PATH, z: -10 },
    { type: 'guard', x: -58, y: PATH, z: -28 },
    { type: 'turret', x: -96, y: 13.5, z: -20 },
    { type: 'drone', x: -74, y: 17, z: -46 },
    { type: 'guard', x: 4, y: PIER, z: -122 },
    { type: 'walker', x: 12, y: 8, z: -136 },
    { type: 'drone', x: 68, y: 20, z: -118 },
    { type: 'guard', x: 104, y: PIER, z: -130 },
    { type: 'turret', x: 131, y: 12, z: -135 },
    { type: 'drone', x: 104, y: 8, z: -62 },
    { type: 'walker', x: 150, y: 2.4, z: -74 },
    { type: 'drone', x: 140, y: 14, z: -46 },
  ],
  pickups: [
    { type: 'health', x: -30, y: 6.2, z: 54 },
    { type: 'spread', x: -28, y: PATH + 1, z: -30 },
    { type: 'rapid', x: -62, y: PATH + 1, z: -48 },
    { type: 'healthBig', x: -96, y: 14.5, z: -60 },
    { type: 'overdrive', x: HUB.x, y: HUB.y + 1.6, z: HUB.z },
    { type: 'rocket', x: 112, y: PIER + 1, z: -126 },
    { type: 'health', x: 150, y: 3.4, z: -80 },
    { type: 'slowmo', x: 138, y: 24, z: -128 },
  ],
  backdrops: [
    { kind: 'chiWillisFar', x: -420, y: 0, z: -40, yaw: 0.1, s: 1 },
    { kind: 'chiHancockFar', x: -300, y: 0, z: -260, yaw: 0.4, s: 1 },
    { kind: 'chiSkylineFar', x: -330, y: 0, z: 60, yaw: 1.4, s: 1, n: 18, w: 260, d: 90 },
    { kind: 'chiSkylineFar', x: -280, y: 0, z: -180, yaw: 1.0, s: 1, n: 16, w: 220, d: 90 },
    { kind: 'chiCribFar', x: 520, y: 0, z: -160, yaw: 0, s: 1 },
    { kind: 'chiSailsFar', x: 380, y: 0, z: 120, yaw: 0, s: 1 },
  ],
};
