// NEO CHICAGO 1 — THE LOOP. The drowned grid on an overcast morning: the lake rose, the streets are
// canals, and the city lives on its sidewalks, its rooftops and the L. The elevated Loop is the
// stage's spine: four legs of steel track at 10 m with a train shuttling along every one, and the
// Wells branch striding north over the river on a truss to the north bank.
//
//                        [GREEN-AND-GOLD DECO TOWER + EXIT 42 m]  (0, -138)
//                                  ↑ billboard ↑ limestone 21 m
//   [MARINA CORNCOB + DRIVE 2]  [Merchandise Mart stn]  [brick + stone roofs]     [lift towers + beam]
//   ─ north riverwalk ──────────────── Wells L truss ──────────────────────────────── lift bridge ─
//   ~~~~~~~~ RIVER ~~~~ (tour boat + PORTAL) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ (DRIVE 3 on the beam)
//   ─ south riverwalk ═══════════ north leg of the Loop (train + DRIVE 1) ════════════════════════
//      ║ west leg ║   [brick + water towers]   [limestone]   ║ east leg ║
//      ║  train   ║   [brick]                  [stone]       ║  train   ║
//                 ═══════════ south leg (train) ═══════════
//                    [VAN BUREN station: START]  kiosk steps down to the start block
import { tower, rect, disc, car, chain, bob, mv, billboard, laser, yawTo } from '../kit.js';
import { track, train, station, block, brick, stone, waterTower, deco, boat } from './chicago-kit.js';

const ISL = 2; // sidewalk top above the canals
const EL = 10; // the L walkway
const ROOF = EL + 3.3; // train roofs
const plats = [];
const P = (...a) => plats.push(...a);

// ---- the drowned grid: city blocks (islands) between canals, the riverwalks either side of the river
P(block(-34, 34, 38, 58)); // the start block under Van Buren station
P(block(-31, -5, 3, 25), block(5, 31, 3, 25), block(-31, -5, -27, -5), block(5, 31, -27, -5)); // inside the Loop
P(block(-72, -46, -27, 30), block(46, 72, -27, 30)); // west and east of it
P(block(-84, 84, -40, -27, ISL, 'chiRiverwalk', 0), block(-84, 84, -80, -68, ISL, 'chiRiverwalk', 1));
P(block(-72, -46, -118, -84), block(-32, 20, -116, -84), block(30, 72, -116, -84), block(-24, 24, -160, -122)); // north bank

// ---- the Loop: four legs of elevated track (the north-south legs run through the corners)
P(track(0, 32, 67.5, EL, Math.PI / 2), track(0, -33.5, 67.5, EL, Math.PI / 2));
P(track(-38, -0.75, 74, EL), track(38, -0.75, 74, EL));
// the Wells branch north: a truss over the river, then on to Merchandise Mart station
P(track(-38, -53.875, 32.25, EL, 0, 'chiTruss'), track(-38, -99, 58, EL));
// trains on the outer lanes (ride their roofs: DRIVE 1 is on the north leg's)
P(...train(0, 34.1, ROOF, 'x', 18, 16, 0.75, 0)); // red line, south leg (pulls in to Van Buren a few seconds in)
P(...train(0, -35.6, ROOF, 'x', 18, 17, 0.5, 2)); // brown line, north leg
P(...train(40.1, -0.75, ROOF, 'z', 20, 18, 0.25, 4)); // orange line, east leg
P(...train(-40.1, -0.75, ROOF, 'z', 20, 18, 0.75, 1)); // blue line, west leg
P(...train(-40.1, -82.5, ROOF, 'z', 28, 24, 0.1, 5)); // pink line, over the river and back
// stations: Van Buren (START), State/Lake on the riverwalk, Merchandise Mart up north
P(station(0, 38.75, 26, 5, EL, 0), station(0, -40.25, 22, 5, EL, 3), station(-44.25, -100, 4, 26, EL, 2));
// kiosk roofs step from the start block up to the station
P(rect(20, 47, 4, 3, 4.6, { thick: 2.6, style: 'chiKiosk', tint: 0 }), rect(22.5, 42.5, 3, 3, 7.4, { thick: 5.4, style: 'chiKiosk', tint: 1 }));

// ---- buildings: brick walk-ups with water towers, limestone Chicago-school offices
P(brick(-26, 20, 8, 9, 14, 0, ISL), brick(-18, 20, 8, 9, 16, 1, ISL), brick(-10, 20, 8, 9, 15, 2, ISL), waterTower(-18, 20, 16));
P(stone(-18, 8.5, 20, 9, 20, 0, ISL));
P(stone(18, 14, 18, 16, 22, 1, ISL));
P(brick(-24, -12, 10, 12, 13, 3, ISL), brick(-12, -20, 10, 10, 17, 1, ISL), waterTower(-12, -20, 17));
P(brick(12, -16, 10, 18, 15, 2, ISL), stone(25, -16, 9, 18, 19, 2, ISL));
P(brick(-60, 12, 18, 14, 18, 0, ISL), brick(-58, -12, 14, 16, 14, 1, ISL), waterTower(-55, -12, 14, 2));
P(brick(58, 15, 14, 16, 16, 2, ISL), stone(58, -15, 12, 18, 18, 1, ISL));
P(brick(-22, 53, 16, 9, 15, 1, ISL), brick(-6, 54, 10, 8, 12, 3, ISL), brick(26, 53, 12, 9, 12, 2, ISL));

// ---- the river: a vertical-lift bridge (rides 2 ↔ 12 m), a fixed bascule, a tour boat (the PORTAL)
P(rect(56, -54, 9, 28, 7, { thick: 1.4, style: 'chiLiftSpan', move: mv('y', 5, 14, 0.75) }));
for (const z of [-36, -72]) {
  P(rect(49.5, z, 3, 3, 20, { thick: 18, style: 'chiLiftTower' }), rect(62.5, z, 3, 3, 20, { thick: 18, style: 'chiLiftTower' }));
  P(rect(56, z, 16, 3.4, 22, { thick: 2, style: 'chiLiftBeam' })); // the machinery deck on top (DRIVE 3, south)
}
P(rect(-62, -54, 10, 28, 2.3, { thick: 1.6, style: 'chiBascule' }));
P(boat(0, -54, 18, 5.5, 1.4, Math.PI / 2, { move: mv('x', 30, 28, 0), tint: 0 }));
P(boat(-22, -44.5, 9, 3.4, 1.5, Math.PI / 2, { tint: 1 })); // a water taxi moored at the riverwalk

// ---- north bank: Marina City's corncob (balconies spiral up to DRIVE 2), roofs to the deco tower
P(disc(-59, -101, 8, 34, { thick: 32, style: 'chiCorncob' }));
for (let i = 0; i < 9; i++) {
  const a = -Math.PI / 2 - i * (40 * Math.PI / 180), y = 5 + i * 3.2;
  P(disc(-59 + Math.cos(a) * 10.2, -101 + Math.sin(a) * 10.2, 1.8, y, { thick: 0.6, style: 'chiPetal' }));
}
P(brick(-24, -92, 10, 12, 14, 2, ISL), brick(-24, -108, 10, 10, 16, 0, ISL), stone(-6, -100, 18, 14, 18, 1, ISL));
P(brick(12, -92, 12, 12, 13, 3, ISL), waterTower(12, -92, 13));
P(stone(0, -114, 12, 8, 21, 2, ISL));
P(billboard(0, -122.5, 10, 22.5, 0, { ad: 21 }));
P(...deco(0, -138, [[22, 22, 24], [16, 16, 30], [11, 11, 36], [7, 7, 42]], ISL));
P(brick(-18, -150, 8, 14, 17, 1, ISL), brick(18, -150, 8, 14, 15, 3, ISL));
P(brick(50, -100, 14, 12, 15, 0, ISL), stone(64, -95, 10, 18, 26, 0, ISL));

// ---- hover traffic: police cruisers and a cab rank make two optional short cuts
P(...chain(2001, { x: 27, y: 22, z: 8 }, { x: 52, y: 16, z: 18 }, { kinds: ['police', 'taxi', 'sedan'] }));
P(...chain(2002, { x: 2.2, y: 18, z: -96 }, { x: 43.8, y: 15, z: -98 }, { kinds: ['taxi', 'police', 'coupe'] }));
P(car('bus', 0, 12, 13, Math.PI / 2, { move: mv('x', 4, 9, 0), bob: bob(0.15, 4, 0) })); // a hover bus over the Loop's cross canal
P(billboard(-50, 40, 14, 18, 0.4, { ad: 17, tall: 8 }), billboard(70, -50, 16, 24, -0.6, { ad: 23, tall: 9 }));

// ---- the city beyond: towers in a ring, dropping into the canals
const glass = (x, z, w, d, top, tint) => tower(x, z, w, d, top, { tint, style: 'chiGlass' });
P(glass(-100, -40, 18, 18, 46, 5), glass(100, -20, 16, 20, 40, 7), glass(-96, 40, 16, 16, 30, 1), glass(96, 46, 18, 14, 34, 3));
P(glass(-80, -160, 18, 18, 56, 6), glass(70, -160, 16, 16, 48, 2), glass(0, 96, 24, 14, 28, 4));

const lasers = [
  laser(16, EL, 29.9, 4.2, 2.4, Math.PI / 2, 3, 0.5, 0), // across the south leg's walkway
  laser(-14, EL, -31.4, 4.2, 2.4, Math.PI / 2, 3.2, 0.5, 0.5), // the north leg
  laser(-35.9, EL, -84, 4.2, 2.6, 0, 2.8, 0.5, 0.2), // the Wells branch, north of the river
  laser(0, 24, -129.5, 20, 3, 0, 3.4, 0.5, 0), // the deco tower's first setback
];

export default {
  id: 'chicago-loop', name: 'THE LOOP', sub: 'NEO CHICAGO · 07:40 · OVERCAST', theme: 'chiLoop', song: 'chiJuke',
  seed: 2001, par: 300, killY: -0.6, water: 0,
  start: { x: 4, y: EL, z: 39.5, yaw: -0.12 },
  plats, lasers,
  drives: [
    { x: 0, y: ROOF + 1.1, z: -35.6 }, // riding the brown-line train's roof
    { x: -59, y: 35.1, z: -101 }, // the top of the corncob
    { x: 56, y: 23.1, z: -36 }, // the lift bridge's machinery deck
  ],
  exit: { x: 0, y: 42, z: -138, yaw: 0 },
  portal: { x: 0, y: 2.8, z: -54 }, // on the river tour boat
  bonusStyle: { theme: 'chiBonus', music: 'chiJuke', weapon: 'spread', tag: 'LOOP' },
  enemies: [
    { type: 'walker', x: -20, y: EL, z: 29.9 },
    { type: 'guard', x: 18, y: 22, z: 14 },
    { type: 'drone', x: 0, y: 17, z: 0 },
    { type: 'turret', x: 25, y: 19, z: -16 },
    { type: 'walker', x: 35.9, y: EL, z: -10 },
    { type: 'spiker', x: 20, y: ISL, z: -31 },
    { type: 'drone', x: 10, y: 8, z: -54 },
    { type: 'drone', x: 56, y: 17, z: -50 },
    { type: 'guard', x: -44.25, y: EL, z: -106 },
    { type: 'walker', x: -6, y: 18, z: -100 },
    { type: 'guard', x: 6, y: 24, z: -134 },
    { type: 'turret', x: -5, y: 30, z: -143 },
    { type: 'drone', x: -46, y: 28, z: -96 },
  ],
  pickups: [
    { type: 'spread', x: 8, y: EL + 1, z: 39 },
    { type: 'health', x: -18, y: 17, z: 17 },
    { type: 'rapid', x: -24, y: 14, z: -12 },
    { type: 'slowmo', x: 50, y: ISL + 1, z: -31 },
    { type: 'rocket', x: -44.25, y: EL + 1, z: -94 },
    { type: 'healthBig', x: -59 + Math.cos(-Math.PI / 2 - 4 * (40 * Math.PI / 180)) * 10.2, y: 5 + 4 * 3.2 + 1, z: -101 + Math.sin(-Math.PI / 2 - 4 * (40 * Math.PI / 180)) * 10.2 },
    { type: 'health', x: 4, y: 31, z: -135 },
    { type: 'overdrive', x: -12, y: 24.2, z: -20 },
  ],
  backdrops: [
    { kind: 'chiWillisFar', x: -330, y: 0, z: 70, yaw: 0.3, s: 1 },
    { kind: 'chiHancockFar', x: 150, y: 0, z: -430, yaw: 0.2, s: 1 },
    { kind: 'chiWheelFar', x: 430, y: 0, z: -250, yaw: -0.6, s: 1 },
    { kind: 'chiSkylineFar', x: -280, y: 0, z: -200, yaw: 0.6, s: 1, n: 16, w: 220, d: 90 },
    { kind: 'chiSkylineFar', x: 300, y: 0, z: 140, yaw: -0.4, s: 1, n: 14, w: 220, d: 80 },
    { kind: 'chiSkylineFar', x: -60, y: 0, z: 330, yaw: 0, s: 1, n: 12, w: 260, d: 70 },
  ],
};
