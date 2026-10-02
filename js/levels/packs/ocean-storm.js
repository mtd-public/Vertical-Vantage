// OCEAN CORE · Stage 3 — STORM SURGE. Night, rain and a big swell. Offshore wind turbines (locked
// and feathered for the storm), power gantries strung between their access platforms, wave-tossed
// buoys, a comms mast, and the data haven's spine tower: climb its hot-swap server blades sliding
// in and out along the face, up to the exit on the roof under the lit spire.
//
// Map (north = -Z, up the page):
//
//                  [SPINE TOWER roof 78 m: EXIT]  ← server blades sliding along the south face (41 → 75 m)
//                  [south terrace 38 m] ← gantry ← [COMMS MAST: landings 6 → 38 m, top 48.5 m: PORTAL]
//    [spine base deck 6 m]                                       ~surge buoy: DRIVE 3~
//          ↑ gantry (storm-broken)
//    [T3 turbine]                        [T2 turbine: nacelle 34 m: DRIVE 2]
//                 ╲                    ╱ gantry
//    ~wave buoy:     [junction box 11 m]
//     DRIVE 1~  ╱ gantry
//    [T1 turbine]
//              ↖ buoys     [crew transfer vessel: START]
import { rect, disc, chain, link, mv, bob, laser } from '../kit.js';
import { deck, buoy, pontoon, block, walk, landings, buoyField, makeBuoy, makeValve, away } from './ocean-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const TP = 11, NAC = 34; // turbine access platform and nacelle roof heights

// A wind turbine: the yellow access platform (TP) on its foundation, the tower, the nacelle (its
// roof is walkable; the locked rotor faces west), the service hoist up the tower's north side, and a
// boat landing with brackets spiralling up the foundation from the water (landing: its angle).
function turbine(x, z, o = {}) {
  const out = [];
  out.push(disc(x, z, 4.6, TP, { thick: TP + 1, style: 'oc-tp' }));
  out.push(disc(x, z, 1.8, NAC - 2.5, { thick: NAC - 2.5 - TP, style: 'oc-mast' }));
  out.push(rect(x, z, 4.4, 10, NAC, { thick: 2.5, yaw: Math.PI / 2, style: 'oc-nacelle' }));
  out.push(rect(x, z - 4, 3, 3, (12 + 29.5) / 2, { thick: 0.6, style: 'oc-hoist', move: mv('y', (29.5 - 12) / 2, o.liftT ?? 12, o.liftPh ?? 0) }));
  if (o.landing !== undefined) {
    const a = o.landing;
    out.push(pontoon(x + Math.cos(a) * 7.6, z + Math.sin(a) * 7.6, 3.2, 4, 1.5, -a, { amp: 0.25, tint: 1 }));
    out.push(...landings(x, z, 6.6, 1.5, 8.6, a, 0.32, { rise: 2.4, size: 2.8, len: 2.8, tint: 1 }));
  }
  return out;
}
const gantry = (x0, z0, x1, z1) => walk(x0, z0, x1, z1, TP - 0.04, 2.4, 'oc-gantry');

// ---- the start: the crew transfer vessel, riding the swell
const SHIP_BOB = bob(0.3, 4.6, 0);
P(rect(0, 10, 9, 24, 3.6, { thick: 4.6, style: 'hull', bob: SHIP_BOB }), rect(0, 18, 7, 6, 7.6, { thick: 4, style: 'bridge', bob: SHIP_BOB }));

// ---- the turbines and the power gantries between them
P(...turbine(-24, -40, { landing: Math.PI * 0.6, liftPh: 0 }));
P(...turbine(24, -64, { landing: Math.PI * 0.75, liftPh: 0.4 }));
P(...turbine(-20, -100, { landing: Math.PI * 1.1, liftPh: 0.7 }));
const J1 = rect(0, -52, 8, 8, TP, { thick: TP + 1, style: 'oc-junction' });
P(J1);
const G1 = gantry(-20, -42, -3.5, -50), G2 = gantry(3.5, -54, 20, -62), G3 = gantry(-3, -56, -15.5, -86);
P(G1, G2, G3, gantry(-16.5, -89, -19, -96)); // T1 → junction → T2, and junction → T3 (the storm tore a 3 m gap out of that one)
P(gantry(-17, -103.5, -16, -122), gantry(-15.5, -128, -13, -140)); // T3 → the spine base deck (another gap)
// buoys from the ship to T1's boat landing, and the wave-tossed run out to DRIVE 1
P(...chain(1031, { x: -2, y: 3.6, z: -2.5 }, { x: -24.5, y: 1.5, z: -30.5 }, { make: makeBuoy({ amp: 0.35 }), maxStep: 6.2, wobble: 1.5 }));
P(...chain(1032, { x: -28.5, y: 1.5, z: -33.5 }, { x: -53.5, y: 1.4, z: -55.5 }, { make: makeBuoy({ amp: 0.6, tint: 1 }), maxStep: 6.0, wobble: 1.8 }));
const D1B = buoy(-56, -57, 1.4, { r: 2.4, amp: 0.85, period: 2.7 });
P(D1B);
P(...buoyField(1033, 34, 64, -130, -20, 5, [[24, -64, 12]]), ...buoyField(1034, -62, -36, -130, -72, 4, [[-20, -100, 12]]));

// ---- the spine base deck, the comms mast and the spine tower
const SB = deck(-22, 22, -192, -140, 6);
P(SB);
P(block(-14, -150, 6, 4, 8.6, 6, 'oc-pump', { tint: 2 }), block(15, -186, 5, 5, 8.2, 6, 'oc-pump', { tint: 1 })); // cover on the base deck
const MX = 16, MZ = -146;
P(rect(MX, MZ, 2.2, 2.2, 48, { thick: 42, style: 'oc-lattice' }));
P(...landings(MX, MZ, 5.5, 6, 38, 0.403, -1.4, { rise: 3.3, size: 3.2, len: 3.2, style: 'oc-landing', tint: 1 })); // the last one faces the spine
P(rect(MX, MZ, 5, 5, 48.5, { thick: 0.8, style: 'oc-masttop' }));
P(walk(13.2, -151.5, 11, -155.5, 38 - 0.04, 2.4, 'oc-gantry')); // top landing → the spine's south terrace
const SPINE = block(0, -170, 22, 22, 78, 6, 'oc-spine');
P(SPINE);
P(rect(0, -157, 26, 4, 38, { thick: 1, style: 'oc-balcony' }), rect(13, -171, 4, 24, 38, { thick: 1, style: 'oc-balcony', tint: 1 }));
// hot-swap server blades: ledges sliding along the south face, each the other way to the last
for (let i = 0; i < 11; i++) {
  const y = 38 + (i + 1) * ((75 - 38) / 11);
  P(rect(0, -157.2, 4, 3.6, y, { thick: 0.6, style: 'oc-blade', tint: i % 3, move: mv('x', 4.2, 6 + (i % 3) * 0.8, i % 2 ? 0.5 : 0) }));
}
// ---- the east route: a gantry from T2 to the offshore substation, pontoons on to the base deck
P(deck(30, 48, -120, -102, 9, { tint: 1 }), block(42, -114, 6, 6, 13, 9, 'oc-pump', { tint: 1 }));
P(gantry(28.4, -65.5, 34, -103));
P(...chain(1035, { x: 36, y: 9, z: -120.5 }, { x: 23, y: 6, z: -141 }, { make: makeValve({ tint: 1 }), maxStep: 6.4, wobble: 1 }));
// ---- DRIVE 3 on the surge buoy drifting off the base deck's east edge (a pontoon to step back up)
P(buoy(33, -160, 1.5, { r: 2.4, amp: 0.9, period: 2.5, move: mv('z', 6, 9, 0) }));
P(pontoon(26.5, -150, 3, 4.5, 3.2, 0, { amp: 0.3 }));

const lasers = [
  laser(G1.x, G1.h, G1.z, 2.4, 2.4, G1.yaw, 2.8, 0.5, 0), // gantry T1 → junction
  laser(G2.x, G2.h, G2.z, 2.4, 2.4, G2.yaw, 2.8, 0.5, 0.5), // gantry junction → T2
  laser(G3.x, G3.h, G3.z, 2.4, 2.4, G3.yaw, 3, 0.5, 0.25), // gantry junction → T3
  laser(0, 6, -152, 18, 2.6, 0, 3.4, 0.5, 0), // across the base deck, south of the spine
  laser(0, 38, -157, 4, 3, Math.PI / 2, 3, 0.5, 0.3), // the south terrace, mid-span
];

export default {
  id: 'ocean-storm', name: 'STORM SURGE', sub: 'WIND FARM · 02:15 · GALE', theme: 'oceanStorm', song: 'wetware',
  seed: 1033, par: 330, killY: -0.6, water: 0,
  start: { x: 0, y: 3.6, z: 6, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -56, y: 2.5, z: -57 }, // the wave-tossed buoy out west
    { x: 24, y: NAC + 1.1, z: -64 }, // T2's nacelle
    { x: 33, y: 2.6, z: -160 }, // the surge buoy off the spine base
  ],
  exit: { x: 0, y: 78, z: -170, yaw: 0 },
  portal: { x: MX, y: 49.9, z: MZ },
  bonusStyle: { theme: 'oceanBonusStorm', music: 'serverRush', weapon: 'rocket', tag: 'SURGE' },
  enemies: [
    { type: 'drone', x: 0, y: 9, z: -14 },
    { type: 'turret', x: -21, y: TP, z: -40 },
    { type: 'walker', x: -24, y: NAC, z: -40 },
    { type: 'drone', x: -48, y: 7, z: -50 },
    { type: 'guard', x: 2, y: TP, z: -50 },
    { type: 'turret', x: 27, y: TP, z: -64 },
    { type: 'drone', x: 30, y: 38, z: -70 },
    { type: 'spiker', x: -17, y: TP, z: -100 },
    { type: 'drone', x: -6, y: 15, z: -136 },
    { type: 'guard', x: -10, y: 6, z: -146 },
    { type: 'spiker', x: 8, y: 6, z: -186 },
    { type: 'guard', x: -8, y: 38, z: -157 },
    { type: 'drone', x: -16, y: 58, z: -152 },
    { type: 'turret', x: -7, y: 78, z: -177 },
  ],
  pickups: [
    { type: 'spread', x: -26, y: TP + 1, z: -37 },
    { type: 'health', x: 0, y: TP + 1, z: -54 },
    { type: 'rocket', x: -23, y: TP + 1, z: -100 },
    { type: 'healthBig', x: 8, y: 7, z: -146 },
    { type: 'health', x: 10, y: 39, z: -157 },
    { type: 'slowmo', x: 13, y: 39, z: -168 },
    { type: 'rapid', x: 22, y: TP + 1, z: -67 },
    { type: 'overdrive', x: MX + 1.6, y: 49.5, z: MZ + 1.6 },
  ],
  backdrops: [
    { kind: 'oc-windfarm', x: 520, y: 0, z: -120, yaw: away(520, -120, 0, -90), n: 12, s: 1.1 },
    { kind: 'oc-windfarm', x: -560, y: 0, z: -300, yaw: away(-560, -300, 0, -90), n: 12 },
    { kind: 'oc-plant', x: 360, y: 0, z: -520, yaw: 0.4 },
    { kind: 'oc-ship', x: -300, y: 0, z: 360, yaw: 0.9, s: 1.1 },
    { kind: 'oc-rig', x: 40, y: 0, z: 520, yaw: 0.1 },
    { kind: 'oc-haven', x: -60, y: 0, z: -720, yaw: away(-60, -720, 0, -90), n: 16, w: 480 },
    { kind: 'oc-spire', x: 90, y: 0, z: -820, s: 0.9 },
  ],
};
