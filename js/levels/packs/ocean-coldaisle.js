// OCEAN CORE · Stage 2 — COLD AISLE. The floating server barges at sunset: three long data-hall
// barges moored side by side, cooling towers standing in the channels between them, cable trays
// strung across, and cargo drones ferrying server racks. The exit is on the fan deck of the giant
// cooling tower at the north end.
//
// Map (north = -Z, up the page):
//
//                              [GIANT COOLING TOWER 30 m: EXIT on the fan deck]
//          high cable tray ↗         ↑ cargo-drone lift (9 → 25 m)
//   [HEAT STACK 27 m: DRIVE 1]   [chiller island 4 m]
//   [barge W: hall 8.6 m]   CT3   [barge C: HOT AISLE trench 7 m, DRIVE 3]   CT2   [barge E: hall 9.4 m]
//        ═══ cable tray ═══ (PORTAL on a pontoon below it)    ~cargo drone shuttle: DRIVE 2~
//   CT1                              [C's loading deck 3 m]
//                                  [START tender dock 2.2 m]
import { rect, disc, chain, link, mv, lane, orbit, bob, laser, stack } from '../kit.js';
import { deck, buoy, pontoon, block, walk, valve, landings, buoyField, makeBuoy, makeValve, away } from './ocean-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const HULL = 3;
const barge = (x, z, w, d) => rect(x, z, w, d, HULL, { thick: HULL + 1, style: 'oc-barge' });
const cool = (x, z, r, top) => disc(x, z, r, top, { thick: top + 1, style: 'oc-cooling' });
const chiller = (x, z, w, d, top, base, tint = 0) => block(x, z, w, d, top, base, 'oc-chiller', { tint });
const drone = (x, z, w, d, top, move, b = null) => rect(x, z, w, d, top, { thick: 1.2, style: 'oc-cargo', move, bob: b });

// ---- the start: a tender dock and a pontoon over to barge C's loading deck
P(deck(-7, 7, -4, 12, 2.2, { thick: 3.2 }));
P(pontoon(0.5, -10, 6, 4, 1.6, 0.1));

// ---- barge C: the long data hall, split down the middle by the HOT AISLE (a trench at 7 m)
P(barge(0, -64, 18, 96));
P(block(-4, -62, 5, 60, 10, HULL, 'oc-dc'), block(4, -62, 5, 60, 10, HULL, 'oc-dc', { tint: 1 }));
P(block(0, -62, 3, 60, 7, HULL, 'oc-aisle'));
P(chiller(-4, -28, 4, 4, 6.2, HULL), chiller(5, -24, 5, 4, 5.2, HULL, 1)); // the loading deck: steps up to the roof
P(...stack(-6, -102, HULL, 1, { yaw: Math.PI / 2, tint: 3 }), ...stack(5, -104, HULL, 2, { yaw: Math.PI / 2, tint: 6 }));

// ---- barge W: a lower hall, the heat-exchanger stack at its north end (DRIVE 1 on top)
P(barge(-40, -74, 16, 88));
P(block(-40, -72, 12, 52, 8.6, HULL, 'oc-dc', { tint: 2 }));
P(chiller(-43, -52, 4, 6, 10.8, 8.6, 1), chiller(-37, -88, 5, 4, 10.4, 8.6));
const STACK = block(-40, -107, 8, 8, 27, -1, 'oc-stack');
P(STACK);
P(...landings(-40, -107, 7.4, 8.6, 24.2, Math.PI * 0.5, -0.78, { rise: 3.2, style: 'oc-landing', tint: 1 }));

// ---- barge E: a hall with rooftop chillers and turrets
P(barge(40, -58, 16, 88));
P(block(40, -60, 12, 52, 9.4, HULL, 'oc-dc', { tint: 3 }));
P(chiller(37, -44, 5, 5, 11.6, 9.4), chiller(43, -76, 5, 6, 11.8, 9.4, 1));

// ---- the channels: cooling towers standing in the water, a cable tray, cargo drones
P(cool(-20, -24, 5.5, 14), cool(20, -98, 5.5, 16), cool(-20, -96, 4.5, 12));
P(walk(-34, -60, -6.5, -60, 9.3, 2.2, 'oc-tray')); // W hall ⇄ C hall at roof height
P(drone(19.5, -64, 4, 4.5, 11, mv('x', 7.5, 9, 0), bob(0.12, 2.2, 0))); // the rack shuttle C ⇄ E (DRIVE 2 rides it)
P(drone(20, -34, 4, 4, 7.5, mv('z', 6, 8, 0.3), bob(0.12, 2.4, 0.5))); // a slow one along the east channel
P(drone(-20, -78, 4, 4, 6.4, orbit('xz', 5, 12, 0), bob(0.1, 2.6, 0.2))); // circling CT3
// buoys: a way back up out of the channels
P(...chain(1021, { x: -9.5, y: HULL, z: -40 }, { x: -31.5, y: HULL, z: -46 }, { make: makeBuoy(), maxStep: 6.5, wobble: 1.2 }));
P(...chain(1022, { x: 9.5, y: HULL, z: -24 }, { x: 31.5, y: HULL, z: -24 }, { make: makeBuoy({ tint: 1 }), maxStep: 6.5, wobble: 1.2 }));
P(...buoyField(1023, -70, -54, -110, -20, 4, []), ...buoyField(1024, 54, 72, -100, -20, 4, []));

// ---- the PORTAL: a maintenance pontoon low in the west channel, under the cable tray
const PONT = pontoon(-20, -66, 5, 7, 1.6, 0, { amp: 0.12 });
P(PONT, buoy(-27.5, -70, 1.4, { amp: 0.25 }), buoy(-14, -72, 1.3, { tint: 1, amp: 0.25 }));

// ---- the north: a chiller island, a lift drone, the high tray and the giant cooling tower
P(deck(-6, 16, -128, -116, 4, { tint: 1 }));
P(chiller(-1, -122, 5, 5, 7.4, 4, 1));
P(drone(10, -134, 4, 4, 17, mv('y', 8, 11, 0))); // up and down beside the tower: 9 → 25 m
P(walk(-36, -111, -11, -143, 27.35, 2.2, 'oc-tray')); // the high tray: stack top → tower rim
const BIG = cool(0, -150, 13, 30);
P(BIG);

const lasers = [
  laser(0, 7, -50, 3, 2.6, 0, 2.6, 0.5, 0), // the hot aisle: DRIVE 3 sits between these
  laser(0, 7, -74, 3, 2.6, 0, 2.6, 0.5, 0.5),
  laser(-20, 9.3, -60, 2.2, 2.4, Math.PI / 2, 3, 0.5, 0.25), // the cable tray
  laser(-23.5, 27.35, -127, 2.2, 2.4, -0.663, 2.8, 0.5, 0), // the high tray
  laser(40, 9.4, -60, 12, 2.4, 0, 3.4, 0.5, 0.7), // across barge E's roof
];

export default {
  id: 'ocean-coldaisle', name: 'COLD AISLE', sub: 'SERVER BARGES · 23:50 · CLEAR', theme: 'oceanNight', song: 'netdive',
  seed: 1022, par: 300, killY: -0.6, water: 0,
  start: { x: 0, y: 2.2, z: 6, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -40, y: 28.1, z: -107 }, // the heat-exchanger stack
    { x: 19.5, y: 12.1, z: -64 }, // riding the rack shuttle
    { x: 0, y: 8.1, z: -62 }, // down in the hot aisle
  ],
  exit: { x: 0, y: 30, z: -150, yaw: 0 },
  portal: { x: -20, y: 3.0, z: -66 },
  bonusStyle: { theme: 'oceanBonusViolet', music: 'serverRush', weapon: 'rapid', tag: 'COLD AISLE' },
  enemies: [
    { type: 'guard', x: 2, y: HULL, z: -20 },
    { type: 'turret', x: -4, y: 10, z: -36 },
    { type: 'turret', x: 4, y: 10, z: -88 },
    { type: 'spiker', x: 0, y: 7, z: -84 },
    { type: 'walker', x: -26, y: 9.3, z: -60 },
    { type: 'turret', x: 40, y: 9.4, z: -48 },
    { type: 'guard', x: 42, y: 9.4, z: -82 },
    { type: 'guard', x: -42, y: 8.6, z: -66 },
    { type: 'walker', x: -28, y: 27.35, z: -121.2 },
    { type: 'guard', x: 10, y: 4, z: -120 },
    { type: 'drone', x: -20, y: 18, z: -50 },
    { type: 'drone', x: 22, y: 16, z: -60 },
    { type: 'drone', x: -36, y: 30, z: -98 },
    { type: 'drone', x: 8, y: 26, z: -132 },
  ],
  pickups: [
    { type: 'health', x: -3, y: HULL + 1, z: -20 },
    { type: 'rapid', x: -4, y: 11, z: -46 },
    { type: 'health', x: 40, y: 10.4, z: -36 },
    { type: 'rocket', x: -40, y: 9.6, z: -94 },
    { type: 'healthBig', x: -21.5, y: 2.6, z: -63 },
    { type: 'spread', x: 4, y: 11, z: -76 },
    { type: 'health', x: 0, y: 5, z: -126 },
    { type: 'slowmo', x: -18, y: 28.4, z: -134 },
  ],
  backdrops: [
    { kind: 'oc-windfarm', x: -620, y: 0, z: -160, yaw: away(-620, -160, 0, -70), n: 12 },
    { kind: 'oc-ship', x: 420, y: 0, z: -360, yaw: 0.3, s: 1.3 },
    { kind: 'oc-plant', x: 480, y: 0, z: 160, yaw: -0.8 },
    { kind: 'oc-spire', x: -60, y: 0, z: -800, s: 0.75 },
    { kind: 'oc-haven', x: 110, y: 0, z: -700, yaw: away(110, -700, 0, -70), n: 14, w: 440 },
    { kind: 'oc-rig', x: -420, y: 0, z: 380, yaw: 0.4 },
  ],
};
