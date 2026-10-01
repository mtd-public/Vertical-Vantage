// Stage 1 — HARBOR 9. Future docks, daytime. The on-ramp: teaches hops, the triple jump,
// riding hover cars and barges, stomping, and looking down to land.
//
// Map (north = -Z, up the page):
//
//          [control tower + EXIT]  (0, -110)  ← hover-car spiral up from the jetty end
//                    |
//   [ship]  ~barge~  |jetty|     [crane boom ======== DRIVE 3]
//   PORTAL           |     |       [container stairs → DRIVE 1]
//   (bridge top)  DRIVE 2 on the     [quay C]
//                 moving barge   cars
//                  [pier A] START
import { box, rect, car, stack, chain, bob, mv, CONT, yawTo, billboard, adpad, laser } from './kit.js';
import { mulberry32 } from '../sim/util.js';

const PIER = 2; // concrete deck height above the water
const plats = [];
const P = (...a) => plats.push(...a);

// ---- concrete: pier A (start), the long jetty north, quay C east (container yard)
P(box(-14, 14, -8, 16, PIER, { thick: 7, style: 'pier' }));
P(box(-4, 4, -100, -8, PIER, { thick: 7, style: 'pier' }));
P(box(26, 86, -72, -4, PIER, { thick: 7, style: 'pier' }));
// two hover cars bridge the water from pier A to the quay (the first hop of the game)
P(car('sedan', 18, -6, 3.1, Math.PI / 2, { bob: bob(0.15, 3.1, 0) }));
P(car('coupe', 22.2, -5, 3.3, Math.PI / 2, { bob: bob(0.15, 2.7, 0.4) }));

// ---- container stairs to DRIVE 1: each stack one container taller (a single jump each)
const stairs = [[34, -20, 1], [38.5, -26, 2], [43, -32, 3], [47.5, -38, 4], [52, -44, 5]];
stairs.forEach(([x, z, n], i) => P(...stack(x, z, PIER, n, { tint: i * 2 })));
const top5 = PIER + CONT.h * 5; // 15.0
// container yard dressing (cover, alternate routes), seeded, kept off the stair line
{
  const rng = mulberry32(91);
  for (let i = 0; i < 16; i++) {
    const x = 30 + Math.floor(rng() * 6) * 9, z = -66 + Math.floor(rng() * 6) * 9.5;
    if (Math.abs((x - 34) * 6 / 18 + (z + 20)) < 9 && x < 58) continue; // the stair diagonal
    if (x > 64 && z < -40) continue; // crane footprint
    const n = 1 + Math.floor(rng() * 3);
    P(...stack(x, z, PIER, n, { long: rng() < 0.5, yaw: rng() < 0.5 ? 0 : Math.PI / 2, tint: Math.floor(rng() * 8) }));
  }
}

// ---- the gantry crane on the quay's east edge, its boom reaching out over the water
const BOOM = 32;
for (const [x, z] of [[70, -56], [80, -56], [70, -46], [80, -46]]) P(rect(x, z, 1.6, 1.6, BOOM - 2.2, { thick: BOOM - 2.2 - PIER, style: 'crane-leg' }));
P(rect(75, -51, 14, 13, BOOM - 2.2, { thick: 1.2, style: 'crane-cab' })); // machinery deck under the boom
P(rect(98, -51, 56, 3.2, BOOM, { thick: 1.8, style: 'crane-boom' })); // x 70 → 126
// hover cars climb from the top of the stairs to the boom
P(...chain(7, { x: 53.5, y: top5, z: -47 }, { x: 72, y: BOOM, z: -49.5 }, { maxRise: 3.6 }));

// ---- DRIVE 2: a hover barge shuttling along the west side; cars lead out to it
P(car('sedan', -10, -50, 3.6, 0.3, { bob: bob(0.2, 3.3, 0.1) }));
P(car('van', -16.5, -45, 4.4, -0.4, { bob: bob(0.2, 2.9, 0.5) }));
P(car('coupe', -22, -51, 3.8, 0.9, { bob: bob(0.2, 3.6, 0.8) }));
P(car('barge', -31, -55, 3.2, 0, { move: mv('z', 16, 16, 0), bob: bob(0.12, 4, 0) }));
// the container ship beyond it (deck 8 m), its bridge on the stern (16 m) holds the PORTAL
P(box(-72, -46, -96, -28, 8, { thick: 13, style: 'hull' }));
P(box(-64, -52, -94, -84, 17, { thick: 9, style: 'bridge' }));
P(car('sedan', -40.5, -66, 5.6, 0.2, { bob: bob(0.18, 3, 0.3) })); // stepping stone barge → ship
P(...stack(-52, -74, 8, 2, { tint: 5 }), ...stack(-66, -60, 8, 1, { long: true, tint: 1 }), ...stack(-56, -46, 8, 1, { long: true, tint: 6 }));

// ---- the EXIT on the harbour control tower at the jetty's end; cars spiral up to it
P(rect(0, -112, 11, 11, 23, { thick: 28, style: 'control' }));
P(car('sedan', -8.5, -103, 6.6, yawTo(-1, -1), { bob: bob(0.16, 3, 0) }));
P(car('van', -12, -111, 10.4, yawTo(0, -1), { bob: bob(0.16, 3.4, 0.3) }));
P(car('coupe', -8, -120, 14.2, yawTo(1, -0.4), { bob: bob(0.16, 2.8, 0.6) }));
P(car('taxi', 1, -124, 17.8, yawTo(1, 0.3), { bob: bob(0.16, 3.2, 0.2) }));
P(car('sedan', 9.5, -119, 20.8, yawTo(0, 1), { bob: bob(0.16, 3.1, 0.7) }));

// ---- a few sky cars over the yard: optional routes and a rest stop with a health pack
P(car('bus', 60, -18, 9, Math.PI / 2, { move: mv('x', 6, 12, 0.25), bob: bob(0.2, 4, 0) }));
P(car('van', 64, -30, 13.5, 0.4, { bob: bob(0.2, 3.3, 0.2) }));

// ---- floating billboards: an alternate hop over the water, a step up beside the tower, and dressing
P(billboard(-11, -80, 12, 8.5, Math.PI / 2, { ad: 3 }));
P(adpad(-12, -91, 6, 5, 11.5, 0.2, { ad: 9 }));
P(billboard(13, -98, 11, 13, 0.35, { ad: 1 }));
P(billboard(30, -92, 22, 30, 0.15, { ad: 5, tall: 12 }), billboard(-34, 14, 18, 17, -0.5, { ad: 7, tall: 9 }), billboard(96, -20, 20, 24, -0.6, { ad: 11, tall: 11 }));
P(adpad(22, -40, 6, 5, 6.5, 0.1, { ad: 2 })); // ad deck over the quay: a rest stop on the way to the stairs

// ---- laser walls (time them, or jump them)
const lasers = [
  laser(0, PIER, -56, 8, 2.3, 0, 3, 0.5, 0), // across the jetty: a single jump clears it
  laser(0, PIER, -84, 8, 2.3, 0, 3, 0.5, 0.5),
  laser(88, BOOM, -51, 3.2, 4, Math.PI / 2, 2.6, 0.55, 0), // along the crane boom: wait for the gap
  laser(106, BOOM, -51, 3.2, 4, Math.PI / 2, 2.6, 0.55, 0.5),
  laser(-58, 8, -79, 12, 9, 0, 4, 0.5, 0.25), // ship deck → bridge
  laser(47.5, PIER + CONT.h * 4, -38, 2.44, 2, 0, 2.2, 0.5, 0), // on the 4th stair step
];

export default {
  id: 'docks', name: 'HARBOR 9', sub: 'FUTURE DOCKS · 14:20 · CLEAR', theme: 'docks', music: 'jumpstart',
  seed: 9, par: 240, killY: -0.6, water: 0,
  start: { x: 0, y: PIER, z: 10, yaw: 0 },
  plats, lasers,
  drives: [
    { x: 52, y: top5 + 1.1, z: -44 }, // top of the container stairs
    { x: -31, y: 4.4, z: -55 }, // riding the barge
    { x: 121, y: BOOM + 1.1, z: -51 }, // end of the crane boom
  ],
  exit: { x: 0, y: 23, z: -112, yaw: 0 },
  portal: { x: -58, y: 18.4, z: -89 },
  enemies: [
    { type: 'guard', x: 0, y: PIER, z: -70 },
    { type: 'guard', x: 62, y: PIER, z: -26 },
    { type: 'guard', x: -60, y: 8, z: -40 },
    { type: 'walker', x: 43, y: PIER + CONT.h * 3, z: -32 },
    { type: 'walker', x: -31, y: 3.2, z: -51 },
    { type: 'walker', x: 98, y: BOOM, z: -51 },
    { type: 'drone', x: 0, y: 8, z: -45 },
    { type: 'drone', x: -24, y: 9, z: -62 },
    { type: 'drone', x: 112, y: BOOM + 4, z: -55, fly: true },
    { type: 'drone', x: 40, y: 13, z: -58 },
    { type: 'drone', x: 4, y: 16, z: -100 },
  ],
  pickups: [
    { type: 'health', x: 0, y: PIER + 1, z: -40 },
    { type: 'spread', x: 43, y: PIER + CONT.h * 3 + 1, z: -30 },
    { type: 'rapid', x: 76, y: PIER + 1, z: -36 },
    { type: 'rocket', x: -60, y: 9, z: -50 },
    { type: 'healthBig', x: -58, y: 18, z: -86 },
    { type: 'health', x: 64, y: 14.5, z: -30 },
    { type: 'health', x: 75, y: BOOM - 1.2, z: -55.5 },
  ],
};
