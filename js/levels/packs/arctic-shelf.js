// ARCTIC VAULT · stage 2 — ICE SHELF. A blizzard on the glacier front: you can barely see the next
// floe. Ice drifts on black freezing water, a research icebreaker is stuck in the pack, and the
// calving front of the glacier rises 38 m out of the sea. Climb its ice ledges (an ice cave halfway
// up), cross the crevasses on snow bridges, and find the drilling camp on the ice.
//
// Map (north = -Z, up the page):
//
//                         [CAMP: huts, beacon mast, helipad EXIT]                       block D 39.5
//   ════════════ crevasse 3 (snow bridges) ═══════════════════════════════════════════
//      [DRILL RIG: derrick crown DRIVE 2]                                             block C 39
//   ════════════ crevasse 2 (wide: the bridges, or a long leap) ═════════════════════
//                                                                                      block B 38.5
//   ════════════ crevasse 1 ═══════════════════════════════════════════════════════════
//   GLACIER TOP 38  ┌── ICE CAVE (12 m, DRIVE 3 behind a curtain) ──┐                     block A 38
//   ═══ the calving front (z -60): ice ledges zig-zag up, west and east, to the mid shelf (20) ═══
//      seracs              tabular berg     [PINNACLE BERG 21: PORTAL]
//   ~~~~~~~~~ floes drifting on the current ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//                                             RESEARCH ICEBREAKER (bow north): mast DRIVE 1
//   START (the landing floe)  ~~ floes ~~>   stern A-frame, aft deck
import { rect, disc, box, mv, lane, bob, laser, chain, link, stack } from '../kit.js';
import { ground, floe, floeR, makeFloe, sled, snowmobile, ledge, snowBridge, walk, crate } from './arctic-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const FRONT = -60; // the calving face (its foot is the sea)

// ---- the start: the landing floe with a parked snow-cat sled
const START = floe(-60, 80, 16, 14, 1.2, { amp: 0.06, period: 6, tint: 3 });
P(START, sled(-64, 76, 3.4, 0.3, { bob: null, tint: 0 }));

// ---- the RESEARCH ICEBREAKER, beset in the pack (bow north). Aft working deck with the A-frame,
//      main deck, the superstructure, the bridge and its mast (DRIVE 1), the bow.
const MAIN = 6, AFT = 4.6;
P(box(38, 54, 24, 70, MAIN, { thick: MAIN + 3, style: 'arc-hull', tint: 1 }));
P(box(38, 54, 70, 88, AFT, { thick: AFT + 3, style: 'arc-aftdeck', tint: 1 }));
P(box(41, 51, 6, 24, 8, { thick: 11, style: 'arc-bow', tint: 1 }));
P(box(40, 52, 32, 52, 13, { thick: 7, style: 'arc-superstructure', tint: 1 }));
P(box(42, 50, 33, 41, 16, { thick: 3, style: 'arc-bridgetop', tint: 1 }));
P(rect(46, 37, 1.2, 1.2, 18.6, { thick: 2.6, style: 'arc-mastpole', tint: 1 }));
P(rect(45, 37, 4.4, 3, 19.6, { thick: 0.6, style: 'arc-mastdeck' }), rect(48.4, 37, 2.6, 2.6, 23.4, { thick: 0.6, style: 'arc-mastdeck' }));
P(rect(46, 87, 15, 1.4, 12, { thick: 1, style: 'arc-aframe' })); // the stern A-frame's crossbeam
P(...stack(42, 60, MAIN, 1, { tint: 2 }), ...stack(50, 62, MAIN, 2, { tint: 7 })); // lab containers on the main deck
P(walk(36, 58, 22, 58, 10, 2, { style: 'arc-cranejib' })); // the crane's jib, swung out over the ice
P(rect(46, 79, 6, 5, 7.2, { thick: 2.6, style: 'arc-winch' })); // the winch house on the aft deck
// the pack ice round the hull, and floes out to the landing floe (some ride the current)
P(floe(31, 80, 8, 10, 0.8, { tint: 1 }), floe(30, 44, 9, 12, 0.8, { tint: 2 }), floe(62, 40, 9, 14, 0.8), floe(61, 74, 8, 9, 0.8, { tint: 3 }));
P(...chain(9121, { x: -52, y: 1.2, z: 80 }, { x: 27, y: 0.8, z: 80 }, { make: makeFloe(), maxStep: 7.2, wobble: 3 }));
P(floe(-20, 68, 6, 5, 0.8, { move: mv('x', 9, 14, 0) }), floe(4, 92, 5, 6, 0.8, { move: mv('x', 10, 16, 0.5), tint: 2 }));

// ---- the open lead between the ship and the glacier: drifting floes, a tabular berg, the pinnacle berg
const TAB = rect(-14, -18, 16, 12, 7, { thick: 9, style: 'arc-berg', tint: 0 });
const PIN = rect(28, -38, 7, 7, 21, { thick: 23, style: 'arc-berg', tint: 2 }); // the pinnacle (PORTAL on top)
P(TAB, PIN, rect(30, -22, 6, 5, 6.5, { thick: 8.5, style: 'arc-berg', tint: 1 }), rect(23, -30, 6, 5, 11.5, { thick: 13.5, style: 'arc-berg', tint: 1 }), rect(34, -28, 5, 5, 15, { thick: 17, style: 'arc-berg', tint: 1 }));
P(...chain(9122, { x: 46, y: 8, z: 7 }, { x: -6, y: 7, z: -12.5 }, { make: makeFloe({ amp: 0.2 }), maxStep: 6.8, wobble: 2.5 })); // bow → the tabular berg
P(floe(10, -6, 5, 5, 0.8, { move: mv('x', 14, 12, 0), tint: 1 }), floe(-36, 6, 6, 5, 0.8, { move: mv('z', 10, 13, 0.3), tint: 2 }));
P(floe(-6, -44, 6, 5, 0.8, { move: mv('x', 18, 15, 0.25), tint: 3 }), floeR(-48, -30, 3.2, 0.8, { move: mv('x', 10, 11, 0.6) }));
P(...chain(9123, { x: -22, y: 7, z: -18 }, { x: -36, y: 2.6, z: -55.6 }, { make: makeFloe(), maxStep: 6.5, wobble: 2 })); // the berg → the foot of the west climb
P(...chain(9124, { x: 46, y: 8, z: 6 }, { x: 36, y: 2.6, z: -55.6 }, { make: makeFloe(), maxStep: 6.5, wobble: 1.6 })); // the bow → the foot of the east climb
// seracs: ice towers that broke off the face, standing in the sea
P(disc(-82, -48, 2.6, 13, { thick: 15, style: 'arc-serac' }), disc(-90, -40, 2.2, 8.5, { thick: 10.5, style: 'arc-serac', tint: 1 }), disc(72, -50, 2.4, 17, { thick: 19, style: 'arc-serac', tint: 2 }));

// ---- the GLACIER: the calving front's blocks, split by crevasses that drop to the sea.
//      Block A carries an ICE CAVE in its face (floor 12, roof 24, 16 wide, 34 deep).
const glacier = (x0, x1, z0, z1, top, tint = 0) => box(x0, x1, z0, z1, top, { thick: top + 4, style: 'arc-glacier', tint });
P(glacier(-130, -8, -95, FRONT, 38), glacier(8, 130, -95, FRONT, 38, 1));
P(box(-8, 8, -95, FRONT, 38, { thick: 14, style: 'arc-glacier', tint: 2 })); // over the cave
P(box(-8, 8, -95, FRONT, 12, { thick: 16, style: 'arc-icecave' })); // the cave floor
P(glacier(-130, 130, -133, -101, 38.5, 1));
P(glacier(-130, 130, -170, -143, 39, 2));
P(glacier(-130, 130, -280, -177, 39.5, 0));

// the climb: ice ledges zig-zagging up the face, west and east, to the mid shelf (20); then the upper
// face up to the cave and the top
const shelf = (x0, x1, top) => box(x0, x1, FRONT, FRONT + 4, top, { thick: 2.4, style: 'arc-ledge', tint: 1 });
const L = (x, top, w = 5) => ledge(x, FRONT + 1.8, w, 3.6, top, { thick: 1.2 });
P(L(-36, 2.6, 6), L(-44, 6.0), L(-36, 9.4, 4.4), L(-44, 12.8), L(-36, 16.2, 4.4), shelf(-32, 32, 20)); // the west climb
P(L(36, 2.6, 6), L(44, 6.2), L(36, 9.8, 4.2), L(44, 13.4), L(36, 16.8, 4.2)); // the east climb
P(L(-24, 23.6, 4.4), L(-16, 27.0, 4.2), L(-24, 30.4, 4.2), L(-16, 33.8, 4.4)); // the upper face, west of the cave mouth
P(L(24, 23.6, 4.4), L(16, 27.0, 4.2), L(24, 30.4, 4.2), L(16, 33.8, 4.4)); // …and east of it
// a snowmobile shuttling along the foot of the face (catch it from the floes)
P(snowmobile(0, -55, 2.2, Math.PI / 2, { move: mv('x', 24, 11, 0), tint: 2 }));

// ---- on the glacier: snow bridges over the crevasses, the drill rig, the camp
P(snowBridge(-60, -94, -60, -102, 38.2, 2.6), snowBridge(24, -94, 24, -102, 38.2, 2.2), snowBridge(80, -94, 80, -102, 38.2, 2.4));
P(snowBridge(-20, -132, -20, -144, 38.8, 2.2), snowBridge(56, -132, 56, -144, 38.8, 1.8));
P(snowBridge(-70, -169, -70, -178, 39.3, 2.4), snowBridge(10, -169, 10, -178, 39.3, 2.2), snowBridge(70, -169, 70, -178, 39.3, 2.6));
P(snowmobile(0, -116, 40, Math.PI / 2, { move: mv('x', 40, 14, 0.25), tint: 4 }), snowmobile(30, -156, 40.6, -Math.PI / 2, { move: mv('x', 34, 12, 0.6), tint: 1 }));
// the drilling camp: the drill hut, the derrick (DRIVE 2 on its crown), core boxes
P(rect(-46, -154, 9, 7, 42.6, { thick: 3.6, style: 'arc-drillhut' }));
P(rect(-46, -161.5, 6, 6, 45.6, { thick: 6.6, style: 'arc-derrick' })); // the drill floor
P(rect(-43.6, -163, 2.8, 2.8, 49.2, { thick: 0.6, style: 'arc-mastdeck' }), rect(-48, -161, 2.6, 2.6, 52.8, { thick: 0.6, style: 'arc-mastdeck' }), rect(-46, -161.5, 2.6, 2.6, 56.4, { thick: 0.6, style: 'arc-derricktop' }));
P(crate(-36, -150, 41.4, 2.4, { tint: 3 }), crate(-33.4, -150, 41.4, 2.4, { tint: 4 }), crate(-36, -147.4, 43.8, 2.4, { tint: 5 }));
// the camp on block D: huts on skids, a fuel depot, the beacon mast, the helipad (EXIT)
P(rect(-28, -205, 10, 6, 43.5, { thick: 4, style: 'arc-hut', tint: 0 }), rect(30, -200, 8, 6, 43, { thick: 3.5, style: 'arc-hut', tint: 1 }), rect(-6, -232, 12, 7, 44, { thick: 4.5, style: 'arc-hut', tint: 2 }));
P(rect(26, -222, 2.6, 2.6, 58, { thick: 18.5, style: 'arc-beacon' }));
P(disc(0, -212, 7, 40.1, { thick: 0.6, style: 'arc-helipad' }));
P(crate(-50, -196, 41.9, 2.4, { tint: 6 }), crate(-47.4, -196, 41.9, 2.4, { tint: 6 }), crate(-48.7, -196, 44.3, 2.4, { tint: 7 }));

const lasers = [
  laser(-20, 38.8, -138, 3, 2.6, 0, 3, 0.5, 0), // the western snow bridge over crevasse 2
  laser(0, 12, -86, 14, 3, 0, 3.2, 0.5, 0.3), // across the ice cave, before DRIVE 3
  laser(46, MAIN, 55, 14, 2.6, 0, 3, 0.5, 0.6), // across the main deck, aft of the superstructure
  laser(-46, 45.6, -160.2, 5.6, 2.4, 0, 2.6, 0.5, 0.2), // the drill floor
];

export default {
  id: 'arctic-shelf', name: 'ICE SHELF', sub: 'NORDAUSTLANDET · CALVING FRONT · BLIZZARD', theme: 'arcticWhiteout', song: 'permafrost',
  seed: 9002, par: 360, killY: -0.6, water: 0,
  start: { x: -62, y: 1.2, z: 84, yaw: -1.0 },
  plats, lasers,
  drives: [
    { x: 48.4, y: 23.4 + 1.1, z: 37 }, // the icebreaker's mast
    { x: -46, y: 56.4 + 1.1, z: -161.5 }, // the derrick's crown
    { x: 0, y: 12 + 1.1, z: -91 }, // the back of the ice cave, behind the curtain
  ],
  exit: { x: 0, y: 40.1, z: -212, yaw: 0 }, // the camp helipad
  portal: { x: PIN.x, y: PIN.h + 1.4, z: PIN.z }, // the pinnacle berg
  bonusStyle: { theme: 'arcticBonus', weapon: 'spread', tag: 'FRONT' },
  enemies: [
    { type: 'turret', x: 46, y: 16, z: 39 },
    { type: 'turret', x: 46, y: 7.2, z: 79 },
    { type: 'guard', x: 40, y: MAIN, z: 30 },
    { type: 'spiker', x: -44, y: 12.8, z: FRONT + 1.8 },
    { type: 'spiker', x: 44, y: 13.4, z: FRONT + 1.8 },
    { type: 'walker', x: -20, y: 20, z: FRONT + 2 },
    { type: 'walker', x: 40, y: 38.5, z: -116 },
    { type: 'guard', x: -46, y: 42.6, z: -152 },
    { type: 'guard', x: -28, y: 43.5, z: -205 },
    { type: 'turret', x: 30, y: 43, z: -200 },
    { type: 'drone', x: 10, y: 10, z: 30 },
    { type: 'drone', x: -30, y: 12, z: -30 },
    { type: 'drone', x: 0, y: 30, z: -52 },
    { type: 'drone', x: 20, y: 45, z: -150 },
  ],
  pickups: [
    { type: 'health', x: 41, y: 13, z: 87 },
    { type: 'spread', x: -14, y: 8, z: -18 },
    { type: 'rapid', x: 0, y: 21, z: FRONT + 2 },
    { type: 'rocket', x: -4, y: 13, z: -70 },
    { type: 'healthBig', x: -100, y: 39.5, z: -116 },
    { type: 'slowmo', x: 56, y: 39.8, z: -138 },
    { type: 'overdrive', x: 8, y: 41, z: -232 },
    { type: 'health', x: -82, y: 14, z: -48 },
  ],
  backdrops: [
    { kind: 'arc-snowfall', x: 0, y: 0, z: 0, n: 1800, wind: 1 },
    { kind: 'arc-icefield', x: 0, y: 30, z: -560, len: 1400, h: 60, seed: 921 },
    { kind: 'arc-bergs', x: 0, y: 0, z: 0, r0: 220, r1: 420, n: 26, seed: 922 },
  ],
};
