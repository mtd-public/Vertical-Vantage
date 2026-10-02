// SEATTLE · Stage 3 — RAINIER RAIN. Downtown at dusk in the rain: glass towers going up, tower
// cranes over them, their loads trundling along the jibs, and Mount Rainier huge in the south-east.
// Climb the bare floor slabs of two towers under construction (or ride their hoists), cross the
// skybridge, walk out along the jibs, and leave from the top of the tallest crane.
//
//   T0 START (-70,-70) 30 m
//      ↘ loads
//   [A: slabs 22–50, hoist; DRIVE 1 on top] ══ skybridge 46 ══ [B glass tower 46 m; window cradle + PORTAL]
//                                                                  ↓ loads
//                                                  [crane C1: deck 56, jib south → DRIVE 2 at its tip] → loads → [R pedestal tower 50; DRIVE 3]
//                                                                  ↓ jump
//                                                  [D: slabs 40–72, hoist] → load on C3's jib → C3 jib 84 → C3 deck: EXIT
import { rect, disc, tower, link, chain, bob, mv, lane, laser, yawTo, DEEP } from '../kit.js';

const plats = [];
const P = (...a) => { plats.push(...a); return a[0]; };
// a bundle of steel on a hover pallet: the stepping stone of the building site
const load = (rng, x, z, top, yaw) => rect(x, z, 2.6, 4.6, top, { thick: 1.0, yaw, style: 'steelLoad', tint: Math.floor(rng() * 3), bob: bob(0.12, 3.4 + rng(), rng()) });

// A tower under construction: n bare floor slabs every 4 m from y0, w × w, staggered ±2.4 m along
// `axis` so you zigzag up their edges; plus a construction hoist on one face.
function skeleton(cx, cz, w, y0, n, axis, flip = 1) {
  const slabs = [];
  for (let k = 0; k < n; k++) {
    const o = (k % 2 ? -2.4 : 2.4) * flip;
    slabs.push(P(rect(cx + (axis === 'x' ? o : 0), cz + (axis === 'z' ? o : 0), w, w, y0 + 4 * k, { thick: 0.6, style: 'skelSlab', tint: k === n - 1 ? 1 : 0 })));
  }
  return slabs;
}

// ---- T0: the start, a finished tower's helipad
const t0 = P(tower(-70, -70, 14, 14, 30, { tint: 2, style: 'seaTower' }));
P(disc(-70, -70, 5, 30.3, { thick: 0.3, style: 'helipad' }));

// ---- A: under construction, x-staggered slabs 22 → 50 (DRIVE 1 on top), a hoist on its north face
const A = skeleton(-36, -44, 15, 22, 8, 'x', -1); // even slabs sit west, odd east
P(rect(-36, -53.6, 3, 3, 36.5, { thick: 0.5, style: 'hoist', move: mv('y', 14, 18, 0.75) })); // 22.5 ↕ 50.5
P(rect(-36, -55.7, 0.8, 0.8, 53, { thick: 53 - DEEP, style: 'hoistMast' }));
P(rect(-38.4, -44, 15, 15, 21.4, { thick: 21.4 - DEEP, style: 'skelCore' })); // the finished floors below
P(...link(4031, t0, A[2], { make: load }));

// ---- B: a finished glass tower; the skybridge from A's 46 m slab; a window-washing cradle on its north face
const B = P(tower(8, -44, 18, 18, 46, { tint: 0, style: 'glassTower' }));
P(rect(-15.95, -44, 29.9, 3, 46, { thick: 2.5, style: 'skyBridge' }));
const CRADLE = { x: 8, z: -54, y: 30, amp: 10, period: 18 };
P(rect(CRADLE.x, CRADLE.z, 6, 1.8, CRADLE.y, { thick: 0.6, style: 'bmuCradle', move: mv('y', CRADLE.amp, CRADLE.period, 0) }));
P(...chain(4032, { x: -26.5, y: 34, z: -51 }, { x: 4.5, y: 30, z: -54 }, { make: load }));

// ---- crane C1 south of B: the slewing deck at 56 m, the jib running south (DRIVE 2 at its tip)
const C1 = { x: 8, z: -16, y: 56 };
P(rect(C1.x, C1.z, 2.2, 2.2, C1.y - 2.5, { thick: C1.y - 2.5 - DEEP, style: 'tcMast' }));
const c1deck = P(rect(C1.x, C1.z, 5, 5, C1.y, { thick: 2.5, style: 'tcDeck' }));
P(rect(C1.x, C1.z + 21.5, 2.2, 38, C1.y, { thick: 1.6, style: 'tcJib' })); // z -13.5 → 24.5
P(rect(C1.x, C1.z - 8.25, 2.6, 11.5, C1.y, { thick: 1.6, style: 'tcCounter' }));
P(rect(C1.x, C1.z + 20, 3, 3, C1.y - 12, { thick: 1.4, style: 'craneLoad', tint: 0, move: lane(0, 0, 1, 12, 16, 0) })); // the trolley's load, under the jib
P(rect(14, -29, 2.6, 4.6, 50.5, { thick: 1.0, style: 'steelLoad', tint: 1, bob: bob(0.12, 3.6, 0.2) })); // B's roof → C1's deck, clear of the counter-jib
P(rect(13, -21.5, 2.6, 4.6, 54, { thick: 1.0, style: 'steelLoad', tint: 2, bob: bob(0.12, 3.9, 0.7) }));

// ---- R: the pedestal tower (DRIVE 3 on its roof), reached by loads off C1's jib
const R = P(tower(46, -12, 14, 14, 50, { tint: 5, style: 'pedestalTower' }));
P(...chain(4034, { x: 9.5, y: C1.y, z: -4 }, { x: 38.5, y: 50, z: -10 }, { make: load }));

// ---- D: under construction, z-staggered slabs 40 → 72, a hoist on its west face
const D = skeleton(24, 36, 15, 40, 9, 'z', 1); // even slabs sit south, odd north
P(rect(14.4, 36, 3, 3, 56.5, { thick: 0.5, style: 'hoist', move: mv('y', 16, 20, 0.25) })); // 40.5 ↕ 72.5
P(rect(12.5, 36, 0.8, 0.8, 75, { thick: 75 - DEEP, style: 'hoistMast' }));
P(rect(24, 38.4, 15, 15, 39.4, { thick: 39.4 - DEEP, style: 'skelCore' }));
P(...link(4035, R, D[3], { make: load }));

// ---- crane C3: the tallest. Deck at 84 m with the EXIT; its jib runs west over D, a load trundling along it
const C3 = { x: 52, z: 46, y: 84 };
P(rect(C3.x, C3.z, 2.2, 2.2, C3.y - 2.5, { thick: C3.y - 2.5 - DEEP, style: 'tcMast' }));
P(rect(C3.x, C3.z, 6, 6, C3.y, { thick: 2.5, style: 'tcDeck', tint: 1 }));
P(rect(30, C3.z, 38, 2.2, C3.y, { thick: 1.6, style: 'tcJib', tint: 1 })); // x 11 → 49
P(rect(C3.x + 10.5, C3.z, 15, 2.6, C3.y, { thick: 1.6, style: 'tcCounter', tint: 1 }));
P(rect(26, C3.z + 4.5, 3, 4, C3.y - 6, { thick: 1.4, style: 'craneLoad', tint: 1, move: mv('x', 5, 9, 0) })); // hangs 4.5 m off the jib's south side

// ---- the skyline round the site: finished towers you can still land on (dark glass, lit windows)
for (const [x, z, w, d, h, t, s] of [[-60, -10, 16, 16, 34, 1, 'seaTower'], [-20, 10, 14, 18, 26, 3, 'glassTower'], [-6, 44, 16, 14, 38, 4, 'seaTower'], [50, -60, 18, 16, 40, 6, 'seaTower'],
  [80, 0, 16, 16, 58, 2, 'glassTower'], [84, 60, 18, 18, 66, 7, 'seaTower'], [40, 90, 16, 16, 48, 0, 'glassTower'], [-30, 70, 18, 16, 30, 5, 'seaTower'], [-90, -30, 16, 16, 24, 3, 'glassTower'],
  [-40, -100, 18, 18, 40, 1, 'seaTower'], [20, -96, 16, 16, 54, 4, 'glassTower'], [100, -50, 16, 18, 70, 5, 'seaTower']]) P(tower(x, z, w, d, h, { tint: t, style: s }));

export default {
  id: 'seattle-rainier', name: 'RAINIER RAIN', sub: 'DOWNTOWN · 20:50 · BLUE HOUR RAIN', theme: 'seaRainier', song: 'emeraldDrizzle',
  seed: 4003, par: 330, killY: -24, water: -60,
  start: { x: -70, y: 30.3, z: -66, yaw: yawTo(1, 0.6) },
  plats,
  lasers: [
    laser(-34, 50, -44, 15, 2.6, Math.PI / 2, 3, 0.5, 0), // across A's top slab, beside DRIVE 1
    laser(-15.95, 46, -44, 3, 2.6, Math.PI / 2, 2.6, 0.5, 0.5), // halfway along the skybridge
    laser(C1.x, C1.y, 12, 2.2, 3, 0, 2.6, 0.55, 0.2), // out on C1's jib
    laser(24, 64, 38, 15, 2.6, 0, 3.2, 0.5, 0.35), // D's 64 m slab
    laser(8, 46, -40, 18, 2.6, 0, 3.6, 0.5, 0.7), // B's roof
  ],
  drives: [
    { x: -29, y: 50 + 1.1, z: -42 }, // the top of A, past the curtain
    { x: C1.x, y: C1.y + 1.1, z: 22.5 }, // the tip of C1's jib
    { x: 46, y: 50 + 1.1, z: -12 }, // the pedestal tower's roof
  ],
  exit: { x: C3.x, y: C3.y, z: C3.z, yaw: Math.PI / 2 },
  portal: { x: CRADLE.x, y: CRADLE.y + 1.4, z: CRADLE.z },
  bonusStyle: { theme: 'seaBonus', music: 'serverRush', weapon: 'rocket', tag: 'EMERALD γ' },
  enemies: [
    { type: 'drone', x: -56, y: 34, z: -60 },
    { type: 'walker', x: -42, y: 30, z: -46 },
    { type: 'guard', x: -31, y: 42, z: -40 },
    { type: 'turret', x: -39, y: 50, z: -49 },
    { type: 'drone', x: -16, y: 52, z: -50 },
    { type: 'guard', x: 13, y: 46, z: -48 },
    { type: 'drone', x: 15, y: 62, z: -2 },
    { type: 'walker', x: C1.x, y: C1.y, z: 2 },
    { type: 'guard', x: 50, y: 50, z: -8 },
    { type: 'spiker', x: 24, y: 56, z: 40 },
    { type: 'turret', x: 28, y: 72, z: 42 },
    { type: 'drone', x: 40, y: 88, z: 38 },
    { type: 'drone', x: -50, y: 26, z: -24 },
  ],
  pickups: [
    { type: 'health', x: -73, y: 31.3, z: -73 },
    { type: 'spread', x: -32, y: 27, z: -40 },
    { type: 'rapid', x: 2, y: 47, z: -48 },
    { type: 'rocket', x: 42, y: 51, z: -16 },
    { type: 'healthBig', x: CRADLE.x + 2, y: CRADLE.y + 1, z: CRADLE.z },
    { type: 'slowmo', x: 20, y: 65, z: 31 },
    { type: 'health', x: C1.x, y: C1.y + 1, z: C1.z },
  ],
  backdrops: [
    { kind: 'rainier', x: 520, y: -60, z: 600, r: 440, h: 340, snow: 0.52, color: '#2a3042', haze: 0.3, glow: 1, snowColor: '#9a7a98', rim: '#ffc8b0' }, // Rainier, the last light on its summit, the whole south-east
    { kind: 'ferryLights', x: -300, y: -60, z: 40, n: 4, haze: 0.3 }, // the Sound, west
    { kind: 'spaceNeedle', x: -160, y: -64, z: -520, s: 0.7 }, // the Needle, north
    { kind: 'seaSkyline', x: 0, y: -60, z: 300, w: 400, d: 120, n: 26, hMin: 60, hMax: 160 },
    { kind: 'portCranes', x: -120, y: -60, z: 360, n: 5, haze: 0.45 },
  ],
};
