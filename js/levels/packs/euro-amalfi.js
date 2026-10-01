// NEO EURO · stage 2 — AMALFI. The coast on a golden afternoon: a town of pastel houses stepping up
// a ravine from the sea, lemon groves on terraces, the striped cathedral up its grand stair and the
// bell tower's majolica cupola, boats in the cove, and the Terrace of Infinity on the cliff top.
//
// Map (north = -Z):
//
//            [villa]    plateau 32 m        ┌ garden stair ┐
//   [cliff]    ═══ TERRACE OF INFINITY 40 m (EXIT) ═══ [ledge]      [cliff]
//     Vespas ↗   row 4 houses 26–28        [lemon T6 28.5]
//   [CAMPANILE 30 → cupola, DRIVE 1]  rows of pastel houses   [lemon T5 + lasers, DRIVE 3]
//   [cathedral 18][cloister]  rows 1–3                         [lemon T1–T4]
//        grand stair ↑        row 0
//   ═══════════════ MARINA 1.6 m ════════════════════════════════════
//    boats ~ water-taxi (DRIVE 2) ~       PIER (START)
//      rocks ↗ [SEA STACK + PORTAL]
import { rect, disc, box, link, bob, mv, laser, yawTo } from '../kit.js';
import { vespa, makeVespa, boat, stairs, houseRow } from './euro-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const DOCK = 1.6;

// ---- the waterfront: the pier you start on, the marina, moored boats
P(box(-6, 6, 8, 46, DOCK, { thick: 4, style: 'molo' }));
P(box(-58, 76, -8, 8, DOCK, { thick: 4, style: 'marina' }));
P(boat(-40, 12.6, 1.3, Math.PI / 2, { tint: 1 }), boat(-22, 12.8, 1.3, Math.PI / 2, { tint: 3 }), boat(16, 12.6, 1.3, Math.PI / 2, { tint: 5 }), boat(34, 13, 1.3, Math.PI / 2, { tint: 6 }));

// ---- the cathedral: the grand stair (walk up it), the atrium, the striped facade, nave roof 18 m, the cloister
P(...stairs(-28, -8, 0, -1, 16, 0.85, 0.38, 17, DOCK, { style: 'scalinata' }));
const ATRIUM = DOCK + 17 * 0.38;
P(box(-40, -16, -30, -22.45, ATRIUM, { thick: ATRIUM, style: 'atrium' }));
P(box(-40, -16, -56, -30, 18, { thick: 18, style: 'amalfiDuomo' }));
P(box(-40, -16, -33, -30, 22.5, { thick: 6, style: 'amalfiFacade' }));
P(box(-16, -8, -50, -30, 12.5, { thick: 12.5, style: 'chiostro' }));
// the bell tower and its majolica cupola (DRIVE 1), Vespas up from the nave roof
const CAMP = rect(-46, -42, 7, 7, 30, { thick: 30, style: 'amalfiCampanile' });
P(CAMP, disc(-46, -42, 3.1, 33, { thick: 3, style: 'majolica' }), disc(-46, -42, 1.3, 35.2, { thick: 2.2, style: 'majolicaLantern' }));
P(vespa(-44.5, -31, 21.6, 0, { tint: 0 }), vespa(-53, -35, 25.2, yawTo(-0.3, -1), { tint: 2 }), vespa(-53.5, -46, 28.4, yawTo(0.4, -1), { tint: 4 }));

// ---- the town: rows of pastel houses stepping up the ravine (flat roof terraces)
P(...houseRow(6021, -6, 34, -20, -8, 5.5, 8.5));
P(...houseRow(6022, -6, 34, -32, -20, 10.5, 13.5));
P(...houseRow(6023, -6, 34, -44, -32, 15.5, 18.5));
const ROW3 = houseRow(6024, -6, 34, -56, -44, 20.5, 23.5);
P(...ROW3);
P(...houseRow(6025, -6, 34, -64, -56, 25.5, 28, { dJit: 0.8 }));
// the hillside under each row: stepped lanes, so a slip into an alley is a short hop back up, not the sea
for (const [z0, z1, top] of [[-20, -8, DOCK], [-32, -20, 6.5], [-44, -32, 11.5], [-56, -44, 16.5], [-64, -56, 21.5]]) P(box(-7, 36, z0, z1, top, { thick: top + 0.5, style: 'lane' }));

// ---- the lemon groves: six terraces up the east side of the ravine
const LEMON = [[-18, -8, 6], [-28, -18, 10.5], [-38, -28, 15], [-48, -38, 19.5], [-58, -48, 24], [-66, -58, 28.5]];
for (const [z0, z1, top] of LEMON) P(box(38, 74, z0, z1, top, { thick: top, style: 'lemons' }));

// ---- the cliffs: the ravine walls and the plateau on top (32 m)
P(box(-92, -58, -70, -8, 22, { thick: 30, style: 'cliff' }), box(76, 112, -70, -8, 26, { thick: 34, style: 'cliff' }));
P(box(-92, 112, -132, -70, 32, { thick: 40, style: 'cliff' }));
// the Terrace of Infinity (EXIT) on the cliff edge, the villa garden's stair up to it, a cliff-path ledge
const BELV = box(-20, 20, -79, -70, 40, { thick: 8, style: 'infinity' });
P(BELV);
P(...stairs(0, -97, 0, 1, 10, 0.85, 0.38, 21, 32, { floor: 30, style: 'gardenStair' }));
P(box(20, 26, -70, -67, 35.5, { thick: 1.2, style: 'cliffPath' }));
P(box(-14, 14, -112, -100, 46, { thick: 14, style: 'villa' }));
// Vespas from the bell tower across to the terrace's west end
P(...link(6026, CAMP, BELV, { make: makeVespa, wobble: 1.2 }));

// ---- the cove: boats and rocks out to the sea stack (PORTAL); the water-taxi (DRIVE 2) crosses the cove
P(boat(-11.5, 30, 1.3, yawTo(-1, 0.3), { tint: 2 }), boat(-18.5, 36, 1.3, yawTo(-1, 0.4), { tint: 4 }), boat(-25.5, 42, 1.3, yawTo(-1, 0.2), { tint: 0 }));
P(disc(-33, 48, 2.8, 4.4, { thick: 6, style: 'rock' }), disc(-38.5, 54, 2.4, 7.8, { thick: 10, style: 'rock' }), disc(-44.6, 57.6, 2.2, 11.2, { thick: 14, style: 'rock' }));
P(disc(-52, 62, 6, 15, { thick: 20, style: 'seaStack' }));
P(boat(-30, 22, 1.8, 0, { w: 3, d: 8, style: 'waterTaxi', tint: 7, move: mv('x', 14, 13, 0) }));

const lasers = [
  laser(0, DOCK, 22, 12, 2.4, 0, 3.4, 0.5, 0), // across the pier: hop it
  laser(-28, ATRIUM, -26, 24, 2.4, 0, 3.2, 0.5, 0.5), // the atrium, top of the grand stair
  laser(56, 15, -33, 10, 2.4, Math.PI / 2, 3, 0.5, 0), // lemon terrace 3
  laser(58, 24, -53, 10, 2.4, Math.PI / 2, 2.8, 0.5, 0.2), // lemon terrace 5: two curtains guard DRIVE 3
  laser(64, 24, -53, 10, 2.4, Math.PI / 2, 2.8, 0.5, 0.7),
];

const mid3 = ROW3[Math.floor(ROW3.length / 2)];
export default {
  id: 'euro-amalfi', name: 'AMALFI', sub: 'COSTIERA · 16:40 · GOLDEN', theme: 'euroGolden', song: 'grandTour',
  seed: 6002, par: 300, killY: -0.6, water: 0,
  start: { x: 0, y: DOCK, z: 40, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -46, y: 35.2 + 1.1, z: -42 }, // the campanile's majolica lantern
    { x: -30, y: 1.8 + 1.1, z: 22 }, // riding the water-taxi across the cove
    { x: 70, y: 24 + 1.1, z: -53 }, // the top lemon terrace, behind the lasers
  ],
  exit: { x: 0, y: 40, z: -74.5, yaw: 0 },
  portal: { x: -52, y: 15 + 1.4, z: 62 },
  bonusStyle: { theme: 'euroBonusGold', weapon: 'rapid', tag: 'LIMONE' },
  enemies: [
    { type: 'guard', x: -22, y: ATRIUM, z: -28.5 },
    { type: 'guard', x: 12, y: 40, z: -76 },
    { type: 'turret', x: -28, y: 18, z: -46 },
    { type: 'turret', x: mid3.x, y: mid3.h, z: mid3.z },
    { type: 'walker', x: 56, y: 10.5, z: -23 },
    { type: 'walker', x: 50, y: 19.5, z: -43 },
    { type: 'spiker', x: 46, y: 15, z: -33 },
    { type: 'drone', x: -30, y: 7, z: 36 },
    { type: 'drone', x: -54, y: 28, z: -34 },
    { type: 'drone', x: 12, y: 24, z: -36 },
    { type: 'drone', x: -44, y: 20, z: 70 },
    { type: 'drone', x: -4, y: 46, z: -62 },
  ],
  pickups: [
    { type: 'health', x: 20, y: DOCK + 1, z: 0 },
    { type: 'spread', x: -34, y: ATRIUM + 1, z: -28 },
    { type: 'rapid', x: 68, y: 16, z: -33 },
    { type: 'rocket', x: -12, y: 13.5, z: -40 },
    { type: 'healthBig', x: -50, y: 16, z: 58 },
    { type: 'health', x: -49, y: 31, z: -45 },
    { type: 'slowmo', x: 60, y: 7, z: -13 },
    { type: 'overdrive', x: 23, y: 36.5, z: -68.5 },
  ],
  backdrops: [
    { kind: 'mountain', x: -640, y: -4, z: 560, r: 330, h: 220, snow: 0, crater: true, color: '#6e5a54' }, // Vesuvius across the bay
    { kind: 'hills', x: 180, y: -8, z: 720, len: 420, h: 120, n: 4, color: '#5e7050', houses: 4 }, // Capri
    { kind: 'amalfiCoast', x: -430, y: 0, z: -60, yaw: Math.PI / 2 },
    { kind: 'amalfiCoast', x: 470, y: 0, z: -20, yaw: -Math.PI / 2 },
    { kind: 'hills', x: 0, y: 0, z: -470, len: 1000, h: 230, n: 6, color: '#56664a', houses: 2 }, // the Lattari mountains
  ],
};
