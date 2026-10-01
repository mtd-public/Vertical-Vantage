// NEO EURO · stage 3 — VENEZIA. The Grand Canal at dusk: palazzi with lit gothic windows, gondolas
// ferrying across, a vaporetto water-bus running under the Rialto, carnival masks hanging in the air,
// and at the far end St Mark's: the campanile to climb and the basilica's golden domes.
//
// Map (north = -Z):
//
//        [BASILICA: five domes]  loggia (EXIT 9.5 m)
//   [Procuratie]        PIAZZA SAN MARCO        [CAMPANILE → spire, DRIVE 1]  [Doge's palace]
//   ═══════════════════ molo ═══════════════════  ↑ gondola lift + masks
//   [W6]  |  gondola ⇄ traghetto  |  [E6]
//   [W5]  |   vaporetto ↕ (DRIVE 2)|  [E5]
//   [W4] ═╪══ RIALTO (portico: DRIVE 3) ═╪═ [E4]
//   [W3]  |     Grand Canal        |  [E3 + altana: PORTAL]
//   [W2] ~~ masks ~~~~~~~~~~~~~~~~~~ [E2]
//   [W1]  |  gondola ⇄ traghetto  |  [E1]
//                  START (the vaporetto stop)
import { rect, disc, box, link, bob, mv, laser } from '../kit.js';
import { mulberry32 } from '../../sim/util.js';
import { makeMask, mask, boat } from './euro-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const Q = 1.2; // the fondamenta (quay) height

// ---- the quays along the Grand Canal (water between x -12 and 12) and the molo at its north end
P(box(-16, -12, -100, 58, Q, { thick: 3, style: 'fondamenta' }), box(12, 16, -100, 58, Q, { thick: 3, style: 'fondamenta' }));
P(box(-62, 62, -110, -100, Q, { thick: 3, style: 'fondamenta' }));
P(box(-18, 18, 58, 80, Q, { thick: 2.4, style: 'pontile' })); // the vaporetto stop at the canal mouth: START

// ---- palazzi on both banks (walkable roofs), side canals (rii) between them, a second row behind
const rng = mulberry32(6030);
const PAL = {};
const palazzo = (name, x0, x1, z0, z1) => { const top = Math.round((13 + rng() * 7) * 2) / 2; const p = box(x0, x1, z0, z1, top, { thick: top + 0.5, style: 'palazzo', tint: Math.floor(rng() * 8) }); PAL[name] = p; P(p); return p; };
palazzo('W1', -36, -16, 36, 56); palazzo('W2', -36, -16, 12, 32); palazzo('W3', -36, -16, -14, 8); palazzo('W4', -36, -16, -40, -18); palazzo('W5', -36, -16, -66, -44); palazzo('W6', -36, -16, -98, -70);
palazzo('E1', 16, 36, 40, 56); palazzo('E2', 16, 36, 18, 36); palazzo('E3', 16, 36, -8, 14); palazzo('E4', 16, 36, -34, -12); palazzo('E5', 16, 36, -62, -38); palazzo('E6', 16, 36, -98, -66);
for (const sx of [-1, 1]) for (let z = 54; z > -96; z -= 14 + Math.floor(rng() * 3) * 4) {
  const d = 10 + Math.floor(rng() * 3) * 2, top = Math.round((10 + rng() * 8) * 2) / 2;
  P(rect(sx * 50, z - d / 2, 22, d, top, { thick: top + 0.5, style: 'palazzoBack', tint: Math.floor(rng() * 8) }));
}
// the Ca' d'Oro's altana (a rooftop deck): the PORTAL
const E3 = PAL.E3, ALTANA = E3.h + 2.6;
P(rect(30, 2, 5, 5, ALTANA, { thick: 2.6, style: 'altana' }));

// ---- the RIALTO: a stone arch of walkable steps over the canal, a portico on top (DRIVE 3)
const RZ = -20, RW = 9, PEAK = 7.4, RISE = 0.38, RUN = 0.9, SOFFIT = 5.8, SPAN = 12;
const soffit = (x) => (Math.abs(x) >= SPAN ? null : SOFFIT * Math.sqrt(1 - (x / SPAN) * (x / SPAN)));
P(rect(0, RZ, 3, RW, PEAK, { thick: PEAK - SOFFIT, style: 'rialto' }));
for (let k = 1; k <= 16; k++) for (const sx of [-1, 1]) {
  const outer = 1.5 + RUN * k, x = sx * (1.5 + RUN * (k - 0.5)), top = PEAK - RISE * k, sf = soffit(outer);
  P(rect(x, RZ, RUN + 0.02, RW, top, { thick: sf === null ? top - Q + 0.3 : top - sf, style: 'rialto' }));
}
const PORTICO = box(-3.5, 3.5, RZ - RW / 2, RZ + RW / 2, 11.8, { thick: 2.4, style: 'rialtoPortico' });
P(PORTICO);
P(...link(6031, PAL.W4, PORTICO, { make: makeMask, wobble: 0.8 }), ...link(6032, PAL.E4, PORTICO, { make: makeMask, wobble: 0.8 }));

// ---- on the water: traghetto gondolas crossing, gondolas moored, the vaporetto (DRIVE 2) running the canal
const gondola = (x, z, o = {}) => boat(x, z, 0.9, o.yaw ?? Math.PI / 2, { w: 2.2, d: 7.5, thick: 0.9, style: 'gondola', tint: o.tint ?? 0, move: o.move, bob: o.bob });
P(gondola(0, 34, { move: mv('x', 4.5, 9, 0), tint: 1 }), gondola(0, 44, { move: mv('x', 4.5, 10, 0.5), tint: 2 }));
P(gondola(0, -76, { move: mv('x', 4.5, 9, 0.25), tint: 3 }), gondola(0, -88, { move: mv('x', 4.5, 11, 0.75), tint: 4 }));
for (const [x, z] of [[-9.2, 18], [9.2, 6], [-9.2, -44], [9.2, -40], [-9.2, -64], [9.2, 26]]) P(gondola(x, z, { yaw: 0, tint: Math.abs(z) % 5 }));
P(rect(0, RZ, 4.6, 14, 3.4, { thick: 3.2, style: 'vaporetto', move: mv('z', 38, 30, 0), bob: bob(0.08, 3.6, 0) }));
// carnival masks strung across the canal between the roofs
P(...link(6033, PAL.W2, PAL.E2, { make: makeMask, wobble: 1.5 }), ...link(6034, PAL.W5, PAL.E5, { make: makeMask, wobble: 1.5 }));

// ---- PIAZZA SAN MARCO
P(box(-52, 52, -166, -110, Q, { thick: 3, style: 'piazza' }));
P(box(-52, -40, -160, -112, 13, { thick: 13, style: 'procuratie' }), box(40, 52, -164, -134, 13, { thick: 13, style: 'procuratie' }));
P(box(56, 86, -150, -100, 18, { thick: 18, style: 'dogePalace' }));
// the campanile: brick shaft and belfry (40 m), the attic, the spire (DRIVE 1). A hover-gondola lift
// rides up its west face; masks lead from the top of the lift to the belfry.
const CX = 28, CZ = -124;
P(rect(CX, CZ, 9, 9, 40, { thick: 40, style: 'stMarkCampanile' }));
P(rect(CX, CZ, 5.6, 5.6, 45, { thick: 5, style: 'stMarkAttic' }));
P(disc(CX, CZ, 2.6, 48.5, { thick: 3.5, style: 'stMarkSpire', tint: 0 }), disc(CX, CZ, 1.2, 51.5, { thick: 3, style: 'stMarkSpire', tint: 1 }));
P(rect(CX - 7.8, CZ, 2.6, 6, 18, { thick: 0.8, style: 'gondolaLift', move: mv('y', 14, 16, 0) }));
P(mask(CX - 7.5, CZ - 7.8, 34.8, { tint: 2 }), mask(CX - 1.5, CZ - 9.5, 37.8, { tint: 4 }));
// the basilica: the loggia over the portals (EXIT), the roof, five domes; masks up from the piazza
P(box(-26, 26, -198, -168, 16, { thick: 16, style: 'basilica' }), box(-26, 26, -168, -162, 9.5, { thick: 9.5, style: 'basilicaLoggia' }));
const dome = (x, z, rs, tops) => rs.forEach((r, i) => P(disc(x, z, r, tops[i], { thick: i === 0 ? 4 : tops[i] - tops[i - 1], style: i === rs.length - 1 ? 'onion' : 'stMarkDome', tint: i })));
dome(0, -183, [5.6, 4.4, 2.6, 1.1], [20, 23, 25.4, 27.4]);
for (const [x, z] of [[0, -173.5], [0, -192.5], [-15, -183], [15, -183]]) dome(x, z, [4, 3, 1], [19, 21.4, 23.2]);
for (const sx of [-1, 1]) P(mask(sx * 8, -154, 4.4, { tint: sx > 0 ? 1 : 3 }), mask(sx * 4, -158.6, 7.6, { tint: sx > 0 ? 5 : 0 }));

const lasers = [
  laser(-5.55, PEAK - RISE * 5, RZ, RW, 2.6, Math.PI / 2, 3, 0.5, 0), // the Rialto's steps, either side
  laser(5.55, PEAK - RISE * 5, RZ, RW, 2.6, Math.PI / 2, 3, 0.5, 0.5),
  laser(0, Q, -150, 30, 2.6, 0, 3.4, 0.5, 0), // the piazza before the basilica
  laser(-46, 13, -124, 12, 2.6, 0, 3, 0.5, 0.3), // along the Procuratie roof
  laser(14, Q, -60, 4, 2.4, 0, 2.6, 0.5, 0.6), // across the east quay
];

const W2 = PAL.W2, W4 = PAL.W4, E5 = PAL.E5;
export default {
  id: 'euro-venice', name: 'VENEZIA', sub: 'CANAL GRANDE · 19:30 · DUSK', theme: 'euroDusk', song: 'neonHard',
  seed: 6003, par: 320, killY: -0.6, water: 0,
  start: { x: 0, y: Q, z: 72, yaw: 0 },
  plats, lasers,
  drives: [
    { x: CX, y: 51.5 + 1.1, z: CZ }, // the top of St Mark's campanile
    { x: 0, y: 3.4 + 1.1, z: RZ + 4 }, // on the vaporetto's roof
    { x: 0, y: 11.8 + 1.1, z: RZ }, // on the Rialto's portico
  ],
  exit: { x: 0, y: 9.5, z: -165, yaw: 0 },
  portal: { x: 30, y: ALTANA + 1.4, z: 2 },
  bonusStyle: { theme: 'euroBonusDusk', weapon: 'rocket', tag: 'LAGUNA' },
  enemies: [
    { type: 'guard', x: -14, y: Q, z: 10 },
    { type: 'guard', x: 14, y: Q, z: -50 },
    { type: 'guard', x: -10, y: Q, z: -140 },
    { type: 'turret', x: W4.x, y: W4.h, z: W4.z },
    { type: 'turret', x: -46, y: 13, z: -138 },
    { type: 'walker', x: 0, y: 3.4, z: RZ - 3 },
    { type: 'walker', x: 14, y: 9.5, z: -165 },
    { type: 'spiker', x: E5.x, y: E5.h, z: E5.z },
    { type: 'drone', x: 0, y: 9, z: 30 },
    { type: 'drone', x: 0, y: 14, z: -62 },
    { type: 'drone', x: -6, y: 20, z: -8 },
    { type: 'drone', x: 16, y: 30, z: -116 },
    { type: 'drone', x: 38, y: 44, z: -132 },
    { type: 'drone', x: 0, y: 15, z: -146 },
  ],
  pickups: [
    { type: 'health', x: -14, y: Q + 1, z: 30 },
    { type: 'spread', x: 14, y: Q + 1, z: 0 },
    { type: 'rapid', x: W2.x, y: W2.h + 1, z: W2.z },
    { type: 'rocket', x: -46, y: 14, z: -150 },
    { type: 'healthBig', x: 22, y: E3.h + 1, z: -4 },
    { type: 'health', x: CX + 3.6, y: 41, z: CZ },
    { type: 'slowmo', x: 16, y: Q + 1, z: -116 },
    { type: 'overdrive', x: 70, y: 19, z: -125 },
  ],
  backdrops: [
    { kind: 'lagoonTown', x: -170, y: 0, z: -40, yaw: Math.PI / 2, s: 1 },
    { kind: 'lagoonTown', x: 170, y: 0, z: -60, yaw: -Math.PI / 2, s: 1 },
    { kind: 'sanGiorgio', x: 120, y: 0, z: -330, yaw: 0.3, s: 1.1 },
    { kind: 'mountain', x: -120, y: -6, z: -900, r: 420, h: 260, snow: 0.42, color: '#6a6488' }, // the Dolomites at dusk
    { kind: 'mountain', x: 420, y: -6, z: -860, r: 300, h: 220, snow: 0.45, color: '#6a6488' },
  ],
};
