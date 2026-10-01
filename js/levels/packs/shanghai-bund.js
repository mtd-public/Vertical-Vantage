// SHANGHAI stage 1 — THE BUND. Golden dusk on the flooded waterfront: the old granite promenade
// (broken by the river in three places), the colonial banks and hotels rising out of the water with
// their green copper domes, and the Huangpu full of ferries, cruise boats and light-show barges.
// Across the river, Pudong's skyline (render-only backdrops). The exit is on the Customs House
// clock tower: climb its cornice ledges round the tower.
//
// Map (north = -Z; the river is east, +X):
//
//   [Peace Hotel + green pyramid]  W4 |  [P3 pontoon] ←ferry F2→ [barge B2: screen top DRIVE 3, laser]
//          billboard ↑                |                                   ↑ cruise boat T1 (north–south)
//   [Customs House + CLOCK TOWER EXIT] W3 |                          [P2 Pudong pontoon: PORTAL]
//          ↑ ledges spiral up         |                                   ↑
//   [HSBC dome: DRIVE 1 on the lantern] W2 |              [barge B1: screen]
//          ↑ roofs                    |                   ↑
//   [C2] [C1] ← portico ← START W1 → [P1 pontoon] ←ferry F1 (DRIVE 2 rides it)→
import { box, rect, disc, chain, mv, billboard, laser } from '../kit.js';

const PROM = 3.5; // the promenade's top (the flood wall)
const plats = [];
const P = (...a) => plats.push(...a);
const bund = (x0, x1, z0, z1, top, tint) => box(x0, x1, z0, z1, top, { thick: top + 6, style: 'bund', tint });

// ---- the promenade: four granite stretches, the river pouring through the gaps between them
const W1 = box(-5, 5, -8, 30, PROM, { thick: 9, style: 'bundWalk' });
const W2 = box(-5, 5, -50, -14, PROM, { thick: 9, style: 'bundWalk', tint: 1 });
const W3 = box(-5, 5, -92, -56, PROM, { thick: 9, style: 'bundWalk', tint: 2 });
const W4 = box(-5, 5, -140, -98, PROM, { thick: 9, style: 'bundWalk', tint: 3 });
P(W1, W2, W3, W4);

// ---- the colonial row, west, standing in the flood: porticoes, roofs, domes, the clock tower
P(box(-11.5, -8, 6, 16, 8, { thick: 14, style: 'portico' })); // Q1: a columned porch up from W1
P(bund(-28, -12, 2, 22, 13, 0)); // C1
P(bund(-30, -12, -30, -3, 17, 1)); // C2
P(bund(-34, -12, -66, -36, 20, 2)); // C3: the bank with the dome
// the dome: a columned drum, two copper tiers and a lantern (DRIVE 1 on top)
P(disc(-24, -51, 8, 23, { thick: 3, style: 'copperDrum' }));
P(disc(-24, -51, 6, 26.5, { thick: 3.5, style: 'copperDome' }));
P(disc(-24, -51, 4, 29.5, { thick: 3, style: 'copperDome', tint: 1 }));
P(disc(-24, -51, 2.2, 32, { thick: 2.5, style: 'copperLantern' }));
// C4: the Customs House, and its clock tower with cornice ledges spiralling up it (EXIT on top)
P(bund(-31, -13, -96, -72, 22, 3));
P(rect(-22, -84, 9, 9, 44, { thick: 22, style: 'clockTower' }));
P(rect(-16.3, -84, 2.4, 6, 26.5, { thick: 1.2, style: 'bundLedge' })); // east face
P(rect(-22, -89.7, 6, 2.4, 30.5, { thick: 1.2, style: 'bundLedge' })); // north
P(rect(-27.7, -84, 2.4, 6, 34.5, { thick: 1.2, style: 'bundLedge' })); // west
P(rect(-22, -78.3, 6, 2.4, 38.5, { thick: 1.2, style: 'bundLedge' })); // south
P(rect(-16.3, -84, 2.4, 6, 42, { thick: 1.2, style: 'bundLedge' })); // east again, under the top
// a second way up the Customs House from W3: a porch, then a bay standing out of its east face
P(box(-11.5, -8, -86, -76, 9.5, { thick: 15.5, style: 'portico' }));
P(box(-13.5, -10.5, -96, -87, 15.5, { thick: 21.5, style: 'bund', tint: 6 }));
// hover cars from the dome's tier across to the clock tower's west ledge (a shortcut)
P(...chain(5101, { x: -26, y: 26.5, z: -56.5 }, { x: -27.7, y: 34.5, z: -80.5 }, { maxRise: 3.2 }));
// C5: the Peace Hotel with its green pyramid, and its lower annex on the water
P(box(-13.5, -8, -128, -116, 9, { thick: 15, style: 'bund', tint: 5 }));
P(bund(-30, -14, -134, -110, 15, 4));
P(rect(-22, -122, 11, 11, 18.5, { thick: 3.5, style: 'copperPyramid' }));
P(rect(-22, -122, 7, 7, 22, { thick: 3.5, style: 'copperPyramid' }));
P(rect(-22, -122, 3.6, 3.6, 25.5, { thick: 3.5, style: 'copperPyramid', tint: 1 }));
// a floating screen between the Peace Hotel and the Customs House
P(billboard(-21, -103, 8, 20, Math.PI / 2, { ad: 21 }));

// ---- the river: pontoons, ferries, light-show barges, a cruise boat
const P1 = box(8, 22, 0, 22, 2.2, { thick: 3, style: 'pontoon' });
const P2 = box(96, 112, -66, -40, 2.2, { thick: 3, style: 'pontoon', tint: 1 }); // the Pudong pier (PORTAL)
const P3 = box(8, 22, -114, -88, 2.2, { thick: 3, style: 'pontoon', tint: 2 });
P(P1, P2, P3);
const F1 = rect(43.5, 11, 18, 7, 4.6, { thick: 4.6, style: 'ferry', move: mv('x', 12, 16, 0) }); // shuttles P1 ⇄ B1
const F2 = rect(47, -96, 18, 7, 4.6, { thick: 4.6, style: 'ferry', tint: 1, move: mv('x', 15.5, 18, 0.5) }); // P3 ⇄ B2
const T1 = rect(86, -40, 10, 30, 5.4, { thick: 5.4, style: 'cruise', move: mv('z', 20, 30, 0.25) }); // up and down the river
P(F1, F2, T1);
const B1 = box(67, 77, -24, 6, 2.4, { thick: 2.6, style: 'ledBarge' });
const B2 = box(72, 82, -112, -82, 2.4, { thick: 2.6, style: 'ledBarge', tint: 1 });
P(B1, B2);
P(billboard(72, -9, 22, 12.5, Math.PI / 2, { ad: 30, tall: 8, bob: null })); // the light-show screens (walk their tops)
P(billboard(77, -97, 22, 12.5, Math.PI / 2, { ad: 31, tall: 8, bob: null }));
P(rect(69, -21, 3.5, 4, 6.4, { thick: 4, style: 'ledCabin' }), rect(74, -86, 3.5, 4, 6.4, { thick: 4, style: 'ledCabin' })); // cabins: steps up to them

const lasers = [
  laser(0, PROM, -38, 10, 2.4, 0, 3, 0.5, 0), // across W2
  laser(0, PROM, -74, 10, 2.4, 0, 3, 0.5, 0.5), // across W3
  laser(0, PROM, -118, 10, 2.4, 0, 2.6, 0.5, 0.2), // across W4
  laser(-22, 22, -92.3, 18, 2.6, 0, 3.4, 0.5, 0.3), // the Customs House roof, north of the tower
  laser(77, 12.5, -98, 3, 3, 0, 2.8, 0.5, 0), // on the B2 screen's catwalk, before the drive
];

export default {
  id: 'shanghai-bund', name: 'THE BUND', sub: 'HUANGPU RIVERFRONT · 18:40 · GOLDEN DUSK', theme: 'shanghaiDusk', song: 'bundBreak',
  seed: 5001, par: 270, killY: -0.6, water: 0,
  start: { x: 0, y: PROM, z: 24, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -24, y: 33.1, z: -51 }, // on the dome's lantern
    { x: 43.5, y: 5.7, z: 11 }, // riding ferry F1
    { x: 77, y: 13.6, z: -104 }, // on B2's screen, past the laser
  ],
  exit: { x: -22, y: 44, z: -84, yaw: 0 },
  portal: { x: 104, y: 3.6, z: -53 },
  bonusStyle: { theme: 'bonusDusk', music: 'bundBreak', weapon: 'spread', tag: 'HUANGPU' },
  enemies: [
    { type: 'guard', x: 1, y: PROM, z: -30 },
    { type: 'guard', x: -2, y: PROM, z: -64 },
    { type: 'guard', x: 2, y: PROM, z: -130 },
    { type: 'walker', x: -20, y: 13, z: 12 },
    { type: 'walker', x: -22, y: 17, z: -16 },
    { type: 'spiker', x: -15, y: 20, z: -40 },
    { type: 'guard', x: -15, y: 22, z: -93 },
    { type: 'guard', x: -26, y: 15, z: -114 },
    { type: 'turret', x: 72, y: 2.4, z: 3 },
    { type: 'turret', x: 108, y: 2.2, z: -44 },
    { type: 'walker', x: 86, y: 5.4, z: -20 }, // rides the cruise boat (where it is at t = 0)
    { type: 'drone', x: 40, y: 10, z: -20 },
    { type: 'drone', x: -12, y: 30, z: -58 },
    { type: 'drone', x: -10, y: 38, z: -86 },
    { type: 'drone', x: 8, y: 10, z: -120 },
  ],
  pickups: [
    { type: 'health', x: -2, y: PROM + 1, z: -22 },
    { type: 'spread', x: -24, y: 18, z: -24 },
    { type: 'rapid', x: 69, y: 3.4, z: -10 },
    { type: 'rocket', x: -22, y: 26.5, z: -122 },
    { type: 'healthBig', x: 100, y: 3.2, z: -60 },
    { type: 'health', x: -29, y: 23, z: -75 },
    { type: 'slowmo', x: -22, y: 31.5, z: -89.7 },
    { type: 'overdrive', x: -21.5, y: 30.5, z: -51 },
  ],
  backdrops: [
    { kind: 'pearlTower', x: 380, z: -30, s: 1 },
    { kind: 'jinmaoTower', x: 470, z: -125, s: 1 },
    { kind: 'twistTower', x: 520, z: -185, s: 1 },
    { kind: 'bottleOpener', x: 560, z: -95, s: 1 },
    { kind: 'pudongBank', x: 300, z: -60, len: 900 },
    { kind: 'skyline', x: 440, z: 90, w: 220, d: 90, n: 18, hMin: 40, hMax: 150, color: '#6a5a8a' },
    { kind: 'skyline', x: 620, z: -40, w: 160, d: 160, n: 16, hMin: 60, hMax: 200, color: '#6a5a8a' },
    { kind: 'skyline', x: 430, z: -300, w: 200, d: 100, n: 14, hMin: 40, hMax: 130, color: '#6a5a8a' },
  ],
};
