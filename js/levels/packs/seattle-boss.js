// SEATTLE · Boss — ABOVE THE NEEDLE. A thunderstorm over the Space Needle's saucer, 160 m above the
// drowned city. STORMCROW, a bird-drone the size of a bus with a storm coil on its back, circles the
// halo: it dives through you, fans feather-missiles, calls lightning onto the pads, and after a dive
// it may land on the saucer to recover (stomp its back). The drop all round is death (well, −2).
//
//          outer perch (r 29, 11 m)             EXIT (opens when it dies) on the north rim
//     pad ring (r 20, 2–7 m)     [ SAUCER r 13 at 0 m ]     inner drone pads (r 8.5, 6.5–8 m)
//          STORMCROW orbits at r ≈ 22–24, 13–15 m up
import { disc, bob } from '../kit.js';

const A = { x0: -32, x1: 32, z0: -32, z1: 32, floor: 0, ceil: 26 };
const plats = [];
const P = (...a) => { plats.push(...a); return a[0]; };
const D = Math.PI / 180;
const polar = (deg, r) => ({ x: Math.cos(deg * D) * r, z: Math.sin(deg * D) * r });

// the saucer (the halo deck) and the stem below it, down into the storm
P(disc(0, 0, 13, A.floor, { thick: 4.5, style: 'stormDeck' }));
P(disc(0, 0, 2.6, -5, { thick: 140, style: 'needleStem' }));
// the ring of hover pads round it, at different heights
const RING = [[0, 2.5], [45, 5], [90, 3], [135, 6.5], [180, 2], [225, 5.5], [270, 3.5], [315, 7]];
const ring = RING.map(([a, h], i) => { const p = polar(a + 22.5, 20); return P(disc(p.x, p.z, 2.6, h, { thick: 0.8, style: 'stormPad', tint: i % 2, bob: bob(0.18, 3.2 + (i % 3) * 0.4, i / 8) })); });
// four little drone pads hovering over the saucer: height for stomps, cover from the feathers
const INNER = [[0, 7], [90, 8], [180, 6.5], [270, 7.5]];
const inner = INNER.map(([a, h], i) => { const p = polar(a + 45, 8.5); return P(disc(p.x, p.z, 1.9, h, { thick: 0.6, style: 'stormPad', tint: 2, bob: bob(0.15, 3.6, i / 4 + 0.1) })); });
// outer perches: high and far, with the good pickups
const OUTER = [[0, 11], [120, 12], [240, 10.5]];
const outer = OUTER.map(([a, h], i) => { const p = polar(a + 60, 29); return P(disc(p.x, p.z, 2.4, h, { thick: 0.8, style: 'stormPad', tint: 3, bob: bob(0.2, 3.9, i / 3) })); });
const top = (p, up = 1) => ({ x: p.x, y: p.h + up, z: p.z });

export default {
  id: 'seattle-boss', name: 'ABOVE THE NEEDLE', sub: 'SPACE NEEDLE · 23:10 · THUNDERSTORM · BOSS', theme: 'seaStorm', song: 'stormcrow',
  seed: 4004, par: 210, killY: -12, objective: 'boss', bossName: 'STORMCROW',
  arena: A,
  start: { x: 0, y: A.floor, z: 3, yaw: 0 },
  plats,
  boss: { x: 0, y: 14, z: -23, kind: 'stormcrow' },
  drives: [],
  exit: { x: 0, y: A.floor, z: 10.5, yaw: Math.PI }, // on the south rim, behind you as the fight starts
  portal: null,
  enemies: [
    { type: 'drone', x: outer[0].x, y: 15, z: outer[0].z },
    { type: 'drone', x: outer[2].x, y: 14, z: outer[2].z },
  ],
  pickups: [
    { type: 'health', ...top(ring[1]), respawn: 22 },
    { type: 'health', ...top(ring[5]), respawn: 22 },
    { type: 'health', x: -4, y: A.floor + 1, z: -4, respawn: 28 },
    { type: 'healthBig', ...top(outer[1]), respawn: 45 },
    { type: 'spread', ...top(ring[3]), respawn: 25 },
    { type: 'rapid', ...top(ring[7]), respawn: 25 },
    { type: 'rocket', ...top(inner[1]), respawn: 30 },
    { type: 'slowmo', ...top(outer[0]), respawn: 35 },
    { type: 'overdrive', ...top(outer[2]), respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'rainier', x: 560, y: -200, z: 620, r: 460, h: 330, snow: 0.5, color: '#2e3540', haze: 0.5, glow: 1, snowColor: '#8a98aa' }, // Rainier, ghostly in the storm
    { kind: 'skyline', x: 40, y: -190, z: 260, w: 340, d: 120, n: 26, hMin: 50, hMax: 170, color: '#1a2028', haze: 0.35 }, // downtown, lit, far below
    { kind: 'skyline', x: -240, y: -190, z: -120, w: 140, d: 240, n: 14, hMin: 30, hMax: 90, color: '#1a2028', haze: 0.35 },
  ],
};
