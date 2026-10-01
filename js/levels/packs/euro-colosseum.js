// NEO EURO · boss — COLOSSEUM. Rome by moonlight: CENTURION, a gladiator mech with a tower shield,
// waits on the sand. The arena floor is an ellipse ringed by the podium (4 m) and two tiers of seats
// (8, 12 m) under the arcaded outer wall (20 m). Broken columns and fallen marble give cover and
// perches for a stomp on its crested helmet. The gate of death (east) opens when it falls.
//
//                 outer wall 20 m · tier 3 12 m · tier 2 8 m · podium 4 m
//              ┌──────────── [emperor's box 7 m] ───────────────┐
//            ╱      column        ruin               column      ╲
//   START → (            CENTURION                         EXIT ) ← the Porta Libitinensis
//            ╲      ruin          column              ruin       ╱
//              └────────────────────────────────────────────────┘
import { rect, disc } from '../kit.js';
import { ellipseRing } from './euro-kit.js';

const A = { x0: -37, x1: 37, z0: -27, z1: 27, floor: 0, ceil: 30 };
const plats = [];
const P = (...a) => plats.push(...a);
const ring = (a, b, deg) => ({ x: Math.cos((deg * Math.PI) / 180) * a, z: Math.sin((deg * Math.PI) / 180) * b });

// the sand (its rect corners hide under the podium), the podium, two tiers, the outer wall
P(rect(0, 0, 70, 50, A.floor, { thick: 4, style: 'arenaFloor' }));
P(...ellipseRing(0, 0, 36.5, 26.5, 5, 4, 28, { thick: 8, style: 'podium' }));
P(...ellipseRing(0, 0, 41.5, 31.5, 5, 8, 32, { thick: 12, style: 'cavea' }));
P(...ellipseRing(0, 0, 46.5, 36.5, 5, 12, 36, { thick: 16, style: 'cavea' }));
P(...ellipseRing(0, 0, 51, 41, 4, 20, 40, { thick: 24, style: 'colosseumWall' }));
// the emperor's box on the north podium, under an awning
P(rect(0, -27.5, 10, 4.5, 7, { thick: 11, style: 'pulvinar' }));
// broken columns (perches: a hop from the top reaches its helmet) and fallen marble (cover)
P(disc(-17, -10, 1.3, 4.5, { thick: 4.5, style: 'column', tint: 0 }), disc(16, 11, 1.3, 6.2, { thick: 6.2, style: 'column', tint: 1 }));
P(disc(-6, 15, 1.3, 3.2, { thick: 3.2, style: 'column', tint: 2 }), disc(9, -15, 1.3, 7, { thick: 7, style: 'column', tint: 3 }));
P(disc(-27, 13, 1.3, 5.6, { thick: 5.6, style: 'column', tint: 4 }), disc(25, -13, 1.3, 4, { thick: 4, style: 'column', tint: 5 }));
P(rect(-22, -12, 3.2, 5.5, 1.8, { thick: 1.8, yaw: 0.5, style: 'ruin', tint: 0 }), rect(20, 1, 4.5, 2.6, 2.2, { thick: 2.2, yaw: -0.3, style: 'ruin', tint: 1 }));
P(rect(3, 19, 4, 2.4, 1.6, { thick: 1.6, yaw: 0.2, style: 'ruin', tint: 2 }), rect(-8, -19, 2.6, 4.2, 2.0, { thick: 2.0, yaw: -0.6, style: 'ruin', tint: 3 }));

const pod = (deg, up = 1) => { const p = ring(36.5, 26.5, deg); return { x: p.x, y: 4 + up, z: p.z }; };
const t2 = (deg, up = 1) => { const p = ring(41.5, 31.5, deg); return { x: p.x, y: 8 + up, z: p.z }; };
const t3 = (deg, up = 1) => { const p = ring(46.5, 36.5, deg); return { x: p.x, y: 12 + up, z: p.z }; };

export default {
  id: 'euro-boss', name: 'COLOSSEUM', sub: 'ROMA · 23:40 · FULL MOON · BOSS', theme: 'euroRome', song: 'gladiator',
  seed: 6004, par: 220, killY: -10, objective: 'boss', bossName: 'CENTURION',
  arena: A,
  start: { x: -28, y: A.floor, z: 0, yaw: -Math.PI / 2 },
  plats,
  boss: { x: 8, y: A.floor, z: 0, kind: 'centurion' },
  drives: [],
  exit: { x: 30, y: A.floor, z: 0, yaw: Math.PI / 2 },
  portal: null,
  enemies: [
    { type: 'spiker', ...t2(180, 0) },
    { type: 'spiker', ...t2(0, 0) },
    { type: 'drone', x: -14, y: 10, z: -16 },
    { type: 'drone', x: 14, y: 10, z: 16 },
  ],
  pickups: [
    { type: 'health', ...pod(120), respawn: 20 },
    { type: 'health', ...pod(-60), respawn: 20 },
    { type: 'health', x: -27, y: 6.6, z: 13, respawn: 25 },
    { type: 'healthBig', x: 0, y: 8, z: -27.5, respawn: 45 },
    { type: 'spread', ...t2(150), respawn: 25 },
    { type: 'rapid', ...t2(-30), respawn: 25 },
    { type: 'rocket', ...t3(90), respawn: 30 },
    { type: 'rocket', ...t3(-120), respawn: 30 },
    { type: 'slowmo', x: 16, y: 7.2, z: 11, respawn: 35 },
    { type: 'overdrive', ...t3(30), respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'romeSkyline', x: 0, y: -2, z: 0, r: 260, seed: 64 },
    { kind: 'stPeters', x: -520, y: -2, z: -380, s: 1.2 },
    { kind: 'arch', x: -110, y: -2, z: 70, yaw: 0.4, s: 1 },
  ],
};
