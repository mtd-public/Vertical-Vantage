// ARCTIC VAULT · stage 1 — LONGYEAR. Svalbard in the polar night, 2099: the aurora over a coal town
// on stilts. Colourful houses stand clear of the permafrost, hover snowmobiles run the streets, the old
// coal-mine aerial tramway climbs on timber trestles to the mine on the mountain, the satellite domes
// of the station glow white on the plateau, and a coast-guard icebreaker waits in the fjord.
//
// Map (north = -Z, up the page):
//
//                  ICEBREAKER (bow north): mast + crow's nest DRIVE 3, helideck EXIT
//   ~~~~~~~ fjord ~~~ [QUAY] ~~~ sea ice, floes, hover sleds ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//   PLATEAU 34 m     ║ shore                                 ║ river
//   RADOME FIELD     ║  [row D houses]                       ║   [LOMPEN centre]
//   (PORTAL on the   ║  [row C houses]  snowmobiles ⇄       ═╬═ bridge
//    big dome)       ║  [row B houses]                       ║   snowmobile on the river: DRIVE 2
//   ledges ↑ (north) ║  [row A houses]                      ═╬═ bridge
//   [MINE STATION 41: DRIVE 1] ← buckets ← trestles ← [TRAM CENTRAL 13]     [CHURCH on its hill]
//                                                                              START (south road)
import { rect, disc, box, mv, lane, bob, laser, link, chain, stack } from '../kit.js';
import { mulberry32 } from '../../sim/util.js';
import { ground, house, houseRow, snowmobile, sled, floe, floeR, makeFloe, trestle, bucket, radome, steps, crate, makeSnowmobile } from './arctic-kit.js';

const G = 1.0, PLAT = 34; // the valley floor and the plateau (Platåberget)
const plats = [];
const P = (...a) => plats.push(...a);

// ---- the ground: the valley's two banks either side of the river (open water: a fall), the plateau,
//      and the fjord to the north (the water at y 0 is a fall too)
P(ground(-122, 2, -72, 260, G, { thick: 4 }), ground(14, 200, -72, 260, G, { thick: 4 }));
P(ground(-280, -122, -104, 260, PLAT, { thick: PLAT + 4, style: 'arc-plateau' }));
P(box(0, 16, 36, 44, 2.2, { thick: 1.2, style: 'arc-bridge' }), box(0, 16, -34, -26, 2.2, { thick: 1.2, style: 'arc-bridge' }));

// ---- the town on the west bank: four rows of stilt houses (walkable flat roofs, you can run underneath)
const ROWS = [];
for (const [seed, z0, z1] of [[9101, 50, 62], [9102, 20, 32], [9103, -10, 2], [9104, -42, -30]]) {
  const row = houseRow(seed, -104, -8, z0, z1, G, { hMin: 4.5, hMax: 7.5 });
  ROWS.push(row); P(...row);
}
// the east bank: LOMPEN (the shopping centre), a pair of houses, the church on its hill
const LOMPEN = box(24, 52, -12, 18, 9, { thick: 8, style: 'arc-centre' });
P(LOMPEN);
P(house(30, 34, 8, 10, G, 2, 5.5, 3), house(44, 36, 9, 9, G, 2.25, 7, 6), house(64, 6, 8, 10, G, 2, 6, 1), house(66, -24, 9, 9, G, 1.75, 5, 4));
P(ground(56, 96, 64, 104, 6, { thick: 5.5, style: 'arc-snow', tint: 1 })); // the church hill
const CHURCH = rect(76, 84, 10, 18, 14, { thick: 8, style: 'arc-church' });
P(CHURCH, rect(76, 72, 5, 5, 23, { thick: 17, style: 'arc-churchtower' }));
P(...steps(42, 84, 1, 0, 6, 1.0, 5 / 14, 14, G)); // steps up the hill to the church door
P(rect(36, 116, 3.2, 0.5, G + 3.9, { thick: 1.4, style: 'arc-bearsign' })); // the polar-bear warning sign by the road

// ---- hover snowmobiles and sleds: street traffic (stepping stones up to the roofs)
P(snowmobile(-56, 11, G + 2.2, Math.PI / 2, { move: mv('x', 34, 11, 0), tint: 1 }));
P(snowmobile(-40, -14, G + 2.6, -Math.PI / 2, { move: mv('x', 30, 10, 0.5), tint: 3 }));
P(snowmobile(-80, 41, G + 1.8, Math.PI / 2, { move: mv('x', 22, 8, 0.25), tint: 0 }));
P(sled(30, 52, G + 2.4, Math.PI / 2, { move: mv('x', 20, 12, 0), tint: 2 }));
// the sled lift up to Lompen's roof (it rides up and down beside the centre)
P(sled(57, 4, G + 4.6, 0, { move: mv('y', 3.6, 7, 0), bob: null, tint: 1 }));
// DRIVE 2 rides this one, up and down the river between the bridges
const RIVER_SM = snowmobile(8, 3, 1.5, 0, { move: mv('z', 22, 12, 0), tint: 5 });
P(RIVER_SM);

// ---- the coal tramway (taubane): TRAM CENTRAL on its trestle stilts, five timber trestles climbing
//      west, and the MINE STATION on the plateau's edge (DRIVE 1 on its roof). A hopper bucket rides
//      each span, on alternate sides of the trestles.
const STATION = rect(-30, 92, 16, 12, 13, { thick: 6.5, style: 'arc-tramcentral', tint: 55 }); // tint: its trestle stilts (dm)
P(STATION);
P(house(-14, 98, 8, 9, G, 2, 6.5, 5), crate(-20, 90, G + 2.4, 2.4, { tint: 1 }), crate(-20, 90, G + 4.8, 2.4, { tint: 2 })); // the way up: a crate stack, a house
const MINE = box(-144, -126, 92, 108, 41, { thick: 7, style: 'arc-minestation' });
P(MINE);
const TOWERS = [];
for (let i = 1; i <= 4; i++) {
  const x = -30 - 20.4 * i, top = 13 + 5.6 * i, z = 92 + 1.6 * i;
  const T = trestle(x, z, top, G);
  TOWERS.push(T); P(T);
}
// span ends: beside the station's west wall, each trestle, beside the mine station's east wall
const SPANS = [[-39.6, 13, 92], ...TOWERS.map((T) => [T.x, T.h, T.z]), [-124.6, 41, 100]];
for (let i = 0; i < SPANS.length - 1; i++) {
  const [ax, ya, za] = SPANS[i], [bx, yb, zb] = SPANS[i + 1];
  const off = 2.9 * (i % 2 ? -1 : 1); // the cable runs beside the trestles' decks, alternate sides
  const y0 = ya - 0.6, y1 = yb - 1.4; // step down onto it at the low end, hop up off it at the high end
  const dx = bx - ax, dy = y1 - y0, dz = zb - za, L = Math.sqrt(dx * dx + dy * dy + dz * dz);
  P(bucket((ax + bx) / 2, (za + zb) / 2 + off, (y0 + y1) / 2, lane(dx, dy, dz, L / 2, 9 + i * 0.6, 0.75), { hang: 3.4, side: off > 0 ? 1 : -1 }));
}

// ---- the plateau: the ledges up its north-east corner (the hard way up), the radome field, a mast
const LEDGES = [[-119.5, -48, 4.6], [-116, -40, 8.2], [-119.5, -31, 11.8], [-116, -22, 15.4], [-119.5, -13, 19], [-116, -4, 22.6], [-119.5, 5, 26.2], [-117, 13, 29.8]];
for (const [x, z, top] of LEDGES) P(rect(x, z, 5, 5, top, { thick: 2.2, style: 'arc-rockledge' }));
const DOMES = [];
for (const [x, z, R] of [[-160, -22, 7], [-188, -48, 8.5], [-150, -62, 5.5], [-208, -12, 6.5], [-176, 8, 5], [-218, -76, 7.5]]) {
  const d = radome(x, z, R, PLAT, 2.4);
  DOMES.push({ x, z, R, top: PLAT + 2.4 + R }); P(...d);
}
const OPS = box(-176, -152, -96, -84, 41, { thick: 7, style: 'arc-ops' }); // the station's operations building
P(OPS);
P(rect(-196, -26, 2.6, 2.6, 52, { thick: 18, style: 'arc-mast' })); // the antenna mast between the big domes
P(rect(-140, -36, 4, 4, 38.5, { thick: 4.5, style: 'arc-crate', tint: 3 }), rect(-134, -10, 3, 3, 36.4, { thick: 2.4, style: 'arc-crate', tint: 1 }));
P(snowmobile(-140, 40, PLAT + 1.6, 0, { move: mv('z', 30, 12, 0), tint: 2 })); // a patrol along the plateau's edge

// ---- the harbour: the quay (Bykaia), sea ice on the fjord, and the coast-guard icebreaker
const QUAY = box(-62, -46, -112, -72, 2.4, { thick: 4, style: 'arc-quay' });
P(QUAY);
P(...stack(-56, -90, 2.4, 2, { tint: 3 }), ...stack(-52, -102, 2.4, 1, { tint: 5 }));
const HULL = 6.5;
const SHIP = { x0: -42, x1: -26, z0: -150, z1: -100 };
P(box(SHIP.x0, SHIP.x1, SHIP.z0, SHIP.z1, HULL, { thick: HULL + 2.5, style: 'arc-hull', tint: 0 }));
P(box(-39, -29, -168, -150, 8.5, { thick: 10.5, style: 'arc-bow', tint: 0 })); // the forecastle and the ice-breaking bow
const HELI = box(-43, -25, -102, -92, 8, { thick: 1.4, style: 'arc-helideck' });
P(HELI);
P(box(-40, -28, -128, -108, 14, { thick: 7.5, style: 'arc-superstructure', tint: 0 }));
P(box(-44, -40, -128, -124, 14, { thick: 1.4, style: 'arc-bridgewing' }), box(-28, -24, -128, -124, 14, { thick: 1.4, style: 'arc-bridgewing', tint: 1 }));
P(box(-36.5, -31.5, -113, -107, 19, { thick: 5, style: 'arc-funnel', tint: 0 }));
const MAST = [[-34, -136, 18.5, 4, 3], [-34, -136, 22.5, 3, 3], [-34, -136, 26.5, 2.6, 2.6]];
P(rect(-34, -136, 1.4, 1.4, 17.3, { thick: 10.8, style: 'arc-mastpole' }));
for (const [x, z, top, w, d] of MAST) P(rect(x + (top === 22.5 ? 2.2 : 0), z + (top === 22.5 ? -0.5 : 0), w, d, top, { thick: 0.6, style: 'arc-mastdeck' }));
P(...stack(-37, -143, HULL, 1, { tint: 1 }), ...stack(-31, -143, HULL, 2, { tint: 6, long: false }));
// the sea ice: floes from the shore out to the ship, and hover sleds working the ice
P(...chain(9111, { x: -12, y: G, z: -73 }, { x: -18, y: 0.7, z: -116 }, { make: makeFloe(), maxStep: 6.8, wobble: 2.2 }));
P(floe(-16, -124, 6, 7, 0.7, { tint: 2 }), floeR(-15, -138, 3, 0.7, { tint: 1 }));
P(sled(-22.6, -119, 3.2, 0, { move: mv('y', 2.2, 6, 0), bob: null, tint: 3 })); // the work sled hoisting along the ship's side
P(floe(-6, -98, 5, 5, 0.7, { move: mv('x', 6, 13, 0) }), floe(4, -86, 4.5, 6, 0.7, { move: mv('z', 5, 11, 0.4), tint: 3 }));
P(...chain(9112, { x: -63, y: 2.4, z: -100 }, { x: -96, y: G, z: -73 }, { make: makeFloe(), maxStep: 6.5, wobble: 1.8 })); // the quay ↔ the west shore
P(snowmobile(-12, -150, 1.6, Math.PI / 2, { move: mv('x', 14, 10, 0.2), tint: 4 }));

const drives = [
  { x: -135, y: 41 + 1.1, z: 100 }, // the MINE STATION roof, top of the tramway
  { x: RIVER_SM.x, y: RIVER_SM.h + 1.1, z: RIVER_SM.z }, // riding the snowmobile up and down the river
  { x: -34, y: 26.5 + 1.1, z: -136 }, // the icebreaker's crow's nest
];

const lasers = [
  laser(-34, 14, -126.5, 12, 2.6, 0, 3.2, 0.5, 0), // across the bridge roof, before the mast
  laser(-34, HULL, -147.8, 14, 2.6, 0, 3, 0.5, 0.5), // across the foredeck
  laser(-32, 13, 92, 12, 2.6, Math.PI / 2, 2.8, 0.5, 0.25), // across TRAM CENTRAL's roof
  laser(-168, PLAT, -36, 14, 2.6, Math.PI / 4, 3, 0.5, 0), // between the big domes
];

export default {
  id: 'arctic-town', name: 'LONGYEAR', sub: 'SVALBARD · 78°N · POLAR NIGHT · AURORA', theme: 'arcticAurora', song: 'permafrost',
  seed: 9001, par: 330, killY: -0.6, water: 0,
  start: { x: 40, y: G, z: 122, yaw: 0 },
  plats, lasers, drives,
  exit: { x: -34, y: 8, z: -97, yaw: Math.PI }, // on the icebreaker's helideck, facing the town
  portal: { x: -188, y: PLAT + 2.4 + 8.5 + 1.4, z: -48 }, // on top of the big radome
  bonusStyle: { theme: 'arcticBonus', weapon: 'rapid', tag: '78°N' },
  enemies: [
    { type: 'guard', x: -30, y: 13, z: 96 },
    { type: 'guard', x: 38, y: 9, z: 4 },
    { type: 'guard', x: -40, y: 8, z: -95 },
    { type: 'guard', x: -164, y: 41, z: -90 },
    { type: 'turret', x: -38.5, y: 14, z: -110 },
    { type: 'turret', x: -142, y: 41, z: 96 },
    { type: 'walker', x: -54, y: 2.4, z: -82 },
    { type: 'walker', x: -150, y: PLAT, z: -40 },
    { type: 'spiker', x: ROWS[1][2].x, y: ROWS[1][2].h, z: ROWS[1][2].z },
    { type: 'drone', x: -60, y: 16, z: 30 },
    { type: 'drone', x: -20, y: 14, z: -10 },
    { type: 'drone', x: -82, y: 30, z: 88 },
    { type: 'drone', x: -10, y: 9, z: -110 },
    { type: 'drone', x: -175, y: 46, z: -30 },
  ],
  pickups: [
    { type: 'health', x: -60, y: G + 1, z: 40 },
    { type: 'spread', x: 46, y: 10, z: 12 },
    { type: 'rapid', x: -24, y: 14, z: 88 },
    { type: 'rocket', x: -164, y: 42, z: -88 },
    { type: 'healthBig', x: -117, y: 30.8, z: 13 },
    { type: 'slowmo', x: -160, y: PLAT + 2.4 + 7 + 1, z: -22 },
    { type: 'health', x: -38, y: 15, z: -118 },
    { type: 'hyper', x: 76, y: 15, z: 88 },
  ],
  backdrops: [
    { kind: 'arc-aurora', x: 0, y: 0, z: 0, r: 520, seed: 911 },
    { kind: 'arc-peaks', x: 0, y: -2, z: 0, r0: 300, r1: 420, n: 22, seed: 912, skip: [-2.3, -0.9] }, // mountains all round but the fjord mouth
    { kind: 'arc-cables', x: 0, y: 0, z: 0, spans: SPANS, off: 2.9, hang: 3.4 },
    { kind: 'arc-snowfall', x: 0, y: 0, z: 0, n: 500, wind: 0.15, k: 0.7 },
    { kind: 'arc-townlights', x: 0, y: 0, z: 0, seed: 913 },
    { kind: 'arc-radomes', x: -320, y: 30, z: -140, n: 9, seed: 914 },
  ],
};
