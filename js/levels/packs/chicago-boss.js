// NEO CHICAGO 4 — BULL PEN. A rooftop arena at sundown, home of TAURUS-312: an armoured bull mech that
// paws the deck, then CHARGES in a straight line. Stand in front of a floodlight pylon, a crate or the
// stands and sidestep at the last moment: it crashes, it's stunned (×1.5 damage), and its back is
// yours to stomp. Close in, it tosses its horns; far off, it leaps and slams; up high, it fires its
// shoulder pods. The exit gate (north floor) opens when it dies.
//
//   ═══════ north stands: three tiers up to the 6.6 m ring ═══════
//   ║ west     [pylon]                       [pylon]      east ║
//   ║ stands          crate      TAURUS-312      crates          ║
//   ║ (tiers)              [jumbotron hangs at 13 m]       (tiers)
//   ║          [pylon]        START            [pylon]           ║
//   ═══════ south stands ══════════════════════════════════════════
import { rect } from '../kit.js';

const A = { x0: -28, x1: 28, z0: -24, z1: 24, floor: 0, ceil: 30 };
const plats = [];
const P = (...a) => plats.push(...a);
const crate = (x, z, top, tint = 0) => rect(x, z, 2.4, 2.4, top, { thick: 2.4, style: 'crate', tint });

// the deck, the parapet round the roof
P(rect(0, 0, 80, 72, A.floor, { thick: 4, style: 'chiArenaFloor' }));
P(rect(0, -37, 82, 2, 9, { thick: 13, style: 'chiArenaWall' }), rect(0, 37, 82, 2, 9, { thick: 13, style: 'chiArenaWall' }));
P(rect(-40, 0, 2, 72, 9, { thick: 13, style: 'chiArenaWall' }), rect(40, 0, 2, 72, 9, { thick: 13, style: 'chiArenaWall' }));
// the stands: three tiers on every side, the top tier a ring all the way round (out of its reach)
for (const s of [-1, 1]) {
  for (let k = 0; k < 3; k++) {
    P(rect(0, s * (26.5 + k * 3), 78 - (2 - k) * 0, 3, 2.2 * (k + 1), { thick: 2.2 * (k + 1), style: 'chiBleacher', tint: k })); // north / south
    P(rect(s * (30.5 + k * 3), 0, 3, 50, 2.2 * (k + 1), { thick: 2.2 * (k + 1), style: 'chiBleacher', tint: k + 3 })); // west / east
  }
}
// four floodlight pylons: what it crashes into (their tops are perches)
for (const [x, z] of [[-15, -11], [15, -11], [-15, 11], [15, 11]]) P(rect(x, z, 3, 3, 12, { thick: 12, style: 'chiPylon' }));
// the jumbotron hanging over centre court (a high perch; it charges right under it)
P(rect(0, 0, 8, 6, 13, { thick: 3.5, style: 'chiJumbo' }));
// crates: low cover from the pods, steps onto its back, and more things to crash into
P(crate(-21, 15, 2.4, 0), crate(-21, 15, 4.8, 3), crate(22, -16, 2.4, 1), crate(24.4, -16, 2.4, 5), crate(5, 19, 2.4, 2));

export default {
  id: 'chicago-boss', name: 'BULL PEN', sub: 'NEO CHICAGO · 19:12 · BOSS', theme: 'chiArena', song: 'chiBullRush',
  seed: 2004, par: 220, killY: -10, objective: 'boss', bossName: 'TAURUS-312',
  arena: A,
  start: { x: 0, y: 0, z: 20, yaw: 0 },
  plats,
  boss: { x: 0, y: A.floor, z: -8, kind: 'taurus' },
  drives: [],
  exit: { x: 0, y: 0, z: -20, yaw: 0 },
  portal: null,
  enemies: [
    { type: 'drone', x: -18, y: 9, z: 0 },
    { type: 'drone', x: 18, y: 9, z: 0 },
    { type: 'spiker', x: 10, y: 2.2, z: -26.5 },
  ],
  pickups: [
    { type: 'health', x: -15, y: 13, z: -11, respawn: 22 },
    { type: 'health', x: 15, y: 13, z: 11, respawn: 22 },
    { type: 'health', x: -30.5, y: 3.2, z: 14, respawn: 25 },
    { type: 'healthBig', x: 0, y: 14, z: 0, respawn: 45 },
    { type: 'spread', x: -21, y: 5.8, z: 15, respawn: 25 },
    { type: 'rapid', x: 30.5, y: 3.2, z: -14, respawn: 25 },
    { type: 'rocket', x: 15, y: 13, z: -11, respawn: 30 },
    { type: 'rocket', x: -15, y: 13, z: 11, respawn: 30 },
    { type: 'slowmo', x: -36.5, y: 7.6, z: -20, respawn: 35 },
    { type: 'slowmo', x: 36.5, y: 7.6, z: 20, respawn: 35 },
    { type: 'overdrive', x: 0, y: 7.6, z: 32.5, respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'chiWillisFar', x: -260, y: -40, z: -260, yaw: 0.5, s: 1 },
    { kind: 'chiHancockFar', x: 240, y: -40, z: -300, yaw: 0.2, s: 1 },
    { kind: 'chiSkylineFar', x: 0, y: -40, z: -330, yaw: 0, s: 1, n: 12, w: 420, d: 90 },
    { kind: 'chiSkylineFar', x: -330, y: -40, z: 60, yaw: 1.4, s: 1, n: 9, w: 300, d: 90 },
    { kind: 'chiSkylineFar', x: 330, y: -40, z: 40, yaw: -1.4, s: 1, n: 9, w: 300, d: 90 },
  ],
};
