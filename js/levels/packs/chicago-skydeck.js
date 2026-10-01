// NEO CHICAGO 3 — SKYDECK. A windy night among the supertalls. The black SEARS 312 is nine bundled
// tubes ending at different heights: a staircase of roofs you climb with window-washer gondolas,
// past the glass Skydeck ledges (DRIVE 2) to the antenna mast and its top deck (EXIT, 120 m).
// The tapered, X-braced JOHN 875 stands east (DRIVE 1 on its roof); a police cruiser patrols
// between the towers (DRIVE 3). Neon CHI signs, billboards and hover traffic fill the gaps.
//
//                         [mast top deck: EXIT 120]
//                  [N 100][NE 90]    ← washer gondola B → [Skydeck ledges 93: DRIVE 2]
//                [NW 80][C 100][E 80]       ← washer C (SE → E)
//                [W 68] [S 68] [SE 56]  ← washer A (SW → S), washer D (W → NW)
//                [SW 56]
//         cars ↑            ↑ cars             [JOHN 875: 48 → washer → 70 + DRIVE 1]
//   [T3 52]   ═══ police patrol (DRIVE 3) ═══ [T4 54]
//   [T5 40 PORTAL] ← cars ← [T1 48 + CHI sign]      [T2 50] → cars → (JOHN 875)
//                            [T0 START 44]
import { tower, rect, disc, car, chain, bob, mv, billboard, adpad, laser, skyline } from '../kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const WZ = -110; // SEARS 312's middle row
// the nine tubes: [col, row, roof] (col -1 west … 1 east, row 1 south … -1 north)
const TUBES = [[-1, 1, 56], [0, 1, 68], [1, 1, 56], [-1, 0, 68], [0, 0, 100], [1, 0, 80], [-1, -1, 80], [0, -1, 100], [1, -1, 90]];
const tube = (c, r) => ({ x: c * 9, z: WZ + r * 9 });
for (const [c, r, top] of TUBES) { const t = tube(c, r); P(tower(t.x, t.z, 9, 9, top, { style: 'chiSears', tint: c + 1 + (r + 1) * 3 })); }
// window-washer gondolas ride up the tube faces (tint = how far their cables reach up)
const washer = (x, z, yaw, lo, hi, period, phase, cable) => rect(x, z, 4, 1.8, (lo + hi) / 2, { thick: 0.5, yaw, style: 'chiWasher', tint: cable, move: mv('y', (hi - lo) / 2, period, phase), bob: null });
P(washer(-5.6, -101, Math.PI / 2, 57, 67.6, 9, 0.75, 44)); // A: SW roof → S roof (on S's west face)
P(washer(-9, -113.4, 0, 69, 79.6, 9, 0.25, 32)); // D: W roof → NW roof (on NW's south face)
P(washer(-5.6, -119, Math.PI / 2, 81, 93.8, 11, 0.75, 20)); // B: NW roof → beside the Skydeck ledges (N's west face)
P(washer(9, -104.4, 0, 57, 79.6, 14, 0.75, 44)); // C: SE roof → E roof (on E's south face)
// the Skydeck: glass boxes standing out of the west face at 93 m (DRIVE 2)
P(rect(-6, -107.9, 3, 3.6, 93, { thick: 0.4, style: 'chiLedge' }), rect(-6, -112.1, 3, 3.6, 93, { thick: 0.4, style: 'chiLedge' }));
// the antenna mast: maintenance pads spiral up it to the top deck (EXIT)
const MAST = { x: 0, z: -116 };
for (let i = 0; i < 5; i++) {
  const a = -Math.PI * 0.25 + i * Math.PI / 2;
  P(disc(MAST.x + Math.cos(a) * 4.2, MAST.z + Math.sin(a) * 4.2, 1.3, 103.4 + i * 3.4, { thick: 0.4, style: 'chiMastPad' }));
}
P(disc(MAST.x, MAST.z, 1, 119.8, { thick: 19.8, style: 'chiNone' }), disc(MAST.x, MAST.z, 3, 120.4, { thick: 0.6, style: 'chiMastTop' })); // the mast (drawn by its top deck)
P(disc(0, -106.5, 0.45, 140, { thick: 40, style: 'chiAntenna' })); // the second antenna (scenery)

// ---- the approach: roofs, a neon CHI sign, billboards, hover traffic
P(tower(0, 30, 16, 16, 44, { tint: 1, style: 'chiGlass' }), disc(0, 30, 5.5, 44.3, { thick: 0.3, style: 'helipad' })); // T0 START
P(tower(-24, -10, 14, 14, 48, { tint: 2, style: 'chiGlass' }));
P(rect(-24, -15, 12, 3, 53.5, { thick: 5.5, style: 'chiSign', tint: 0 })); // CHI on T1's roof
P(tower(22, -26, 12, 12, 50, { tint: 3, style: 'chiGlass' }));
P(tower(-8, -56, 16, 12, 52, { tint: 4, style: 'chiGlass' }));
P(tower(30, -70, 12, 12, 54, { tint: 5, style: 'chiGlass' }));
P(tower(-50, -40, 10, 10, 40, { tint: 6, style: 'chiGlass' })); // T5: the low roof with the PORTAL
P(...chain(2021, { x: -4, y: 44, z: 22 }, { x: -18, y: 48, z: -3 }, { ads: 0.3 }));
P(...chain(2022, { x: 6, y: 44, z: 22 }, { x: 20, y: 50, z: -20 }, { kinds: ['taxi', 'sedan', 'police'] }));
P(...chain(2023, { x: -20, y: 48, z: -17 }, { x: -10, y: 52, z: -50 }, { ads: 0.4 }));
P(...chain(2024, { x: 25, y: 50, z: -32 }, { x: 29, y: 54, z: -64 }));
P(...chain(2025, { x: -31, y: 48, z: -14 }, { x: -46, y: 40, z: -36 }, { kinds: ['coupe', 'van'] }));
P(...chain(2026, { x: -6, y: 52, z: -62 }, { x: -10, y: 56, z: -96 }, { ads: 0.3 }));
P(...chain(2027, { x: 28, y: 54, z: -76 }, { x: 10, y: 56, z: -96 }, { kinds: ['taxi', 'coupe'] }));
// the police cruiser on patrol between T3 and T4 (DRIVE 3 on its roof)
P(car('police', 11, -63, 55, Math.PI / 2, { move: mv('x', 9, 10, 0), bob: bob(0.12, 3, 0.2) }));

// ---- JOHN 875: tapered and X-braced; a washer gondola up its west face to the roof (DRIVE 1)
P(rect(70, -42, 20, 20, 48, { thick: 48 + 140, style: 'chiHancock', tint: 0 }), rect(70, -42, 14, 14, 70, { thick: 22.5, style: 'chiHancock', tint: 1 }));
P(washer(61.8, -42, Math.PI / 2, 49, 69.4, 12, 0.75, 6));
P(...chain(2028, { x: 28, y: 50, z: -28 }, { x: 60, y: 48, z: -38 }, { kinds: ['sedan', 'van', 'taxi'] }));
P(...chain(2029, { x: 70, y: 70, z: -49 }, { x: 13.5, y: 80, z: -108 }, { maxRise: 3.4, ads: 0.4 })); // the long way across to SEARS' east tube

// ---- billboards and ad decks: perches, short cuts, and the city's endless pitch
P(billboard(-30, -80, 16, 60, 0.5, { ad: 31, tall: 9 }), billboard(36, -100, 18, 66, -0.4, { ad: 29, tall: 10 }), billboard(-36, -130, 20, 86, 0.3, { ad: 27, tall: 12 }));
P(billboard(20, 2, 14, 54, -0.6, { ad: 25, tall: 8 }), billboard(48, -12, 14, 60, -0.9, { ad: 33, tall: 9 }));
P(adpad(-20, -96, 5, 6, 62, 0.2, { ad: 35 }));

// ---- the city: towers in a ring far below and around
P(tower(-60, 10, 16, 16, 34, { tint: 2 }), tower(56, 20, 14, 18, 38, { tint: 4 }), tower(-70, -90, 18, 16, 60, { tint: 6 }), tower(60, -140, 20, 16, 74, { tint: 1 }));
P(tower(-50, -160, 16, 16, 66, { tint: 3 }), tower(26, -170, 14, 14, 58, { tint: 5 }));
P(...skyline(2030, 0, -60, 115, 175, 28, 20, 110, [[0, -110, 30], [70, -42, 20]]).map((t) => ({ ...t, style: 'chiGlass' })));

const lasers = [
  laser(-8, 52, -56, 12, 2.6, 0, 3, 0.5, 0), // T3's roof
  laser(0, 68, -101, 9, 3, Math.PI / 2, 3.2, 0.5, 0.3), // S tube
  laser(-9, 80, -116.5, 9, 3, 0, 3, 0.5, 0.6), // NW tube, between the two washers
  laser(-3.5, 100, -110, 8, 3, Math.PI / 2, 3.6, 0.45, 0), // the main roof, just past the Skydeck
];

export default {
  id: 'chicago-skydeck', name: 'SKYDECK', sub: 'NEO CHICAGO · 23:50 · WIND', theme: 'chiNight', song: 'chiBullRush',
  seed: 2003, par: 360, killY: 26,
  start: { x: 0, y: 44.3, z: 33, yaw: 0 },
  plats, lasers,
  drives: [
    { x: 70, y: 71.1, z: -42 }, // JOHN 875's roof
    { x: -6, y: 94.1, z: -112.1 }, // the Skydeck ledge
    { x: 11, y: 56.1, z: -63 }, // the police cruiser
  ],
  exit: { x: MAST.x, y: 120.4, z: MAST.z, yaw: 0 },
  portal: { x: -50, y: 41.4, z: -40 },
  bonusStyle: { theme: 'chiBonus', music: 'chiBullRush', weapon: 'rocket', tag: 'SKYDECK' },
  enemies: [
    { type: 'drone', x: -12, y: 52, z: -2 },
    { type: 'guard', x: -20, y: 48, z: -6 },
    { type: 'walker', x: 22, y: 50, z: -26 },
    { type: 'turret', x: -12, y: 52, z: -60 },
    { type: 'guard', x: 32, y: 54, z: -66 },
    { type: 'drone', x: 58, y: 60, z: -52 },
    { type: 'turret', x: 78, y: 48, z: -50 },
    { type: 'walker', x: -9, y: 56, z: -101 },
    { type: 'guard', x: 2, y: 68, z: -98 },
    { type: 'turret', x: -12, y: 68, z: -112 },
    { type: 'drone', x: -16, y: 92, z: -110 },
    { type: 'walker', x: 0, y: 100, z: -108 },
    { type: 'drone', x: 8, y: 110, z: -116 },
  ],
  pickups: [
    { type: 'health', x: -27, y: 49, z: -6 },
    { type: 'spread', x: 22, y: 51, z: -22 },
    { type: 'rapid', x: -4, y: 53, z: -52 },
    { type: 'healthBig', x: 66, y: 71, z: -38 },
    { type: 'slowmo', x: 3, y: 69, z: -104 },
    { type: 'rocket', x: -11, y: 81, z: -121 },
    { type: 'health', x: 2, y: 101, z: -115 },
    { type: 'overdrive', x: -24, y: 54.5, z: -15 },
  ],
  backdrops: [
    { kind: 'chiWheelFar', x: 420, y: 0, z: -120, yaw: -1.2, s: 1.2 },
    { kind: 'chiSkylineFar', x: -320, y: 0, z: -100, yaw: 1.2, s: 1, n: 20, w: 260, d: 100 },
    { kind: 'chiSkylineFar', x: 120, y: 0, z: 300, yaw: -0.2, s: 1, n: 16, w: 240, d: 90 },
    { kind: 'chiMarinaFar', x: 200, y: 0, z: -360, yaw: 0, s: 1 },
    { kind: 'chiSkylineFar', x: -100, y: 0, z: -420, yaw: 0, s: 1, n: 18, w: 300, d: 90 },
  ],
};
