// AIR FORTRESS · BOSS — COMMAND BRIDGE. The roof of the carrier's bridge tower, the deck a long
// way below, nothing above but sky. DREADNOUGHT, the fortress's armoured command core, sits on its
// plinth in the middle. Its shield stays shut while its FLAK PODS live: phase 1 raises four on the
// pedestals, phase 2 three on the flak towers, phase 3 two on the hover sponsons that circle the
// deck. Kill the pods, and while the core is open shoot it and stomp its armoured crown.
//
// Map (north = −Z; deck y = 0, radius 24, a low parapet round the edge):
//
//                  [EXIT pad]  (north, opens when the core dies)
//          [mast 9]      [flak tower 6]      [mast 9]
//              [pedestal]           [pedestal]
//                      ( CORE on its plinth )
//              [pedestal]           [pedestal]
//          [flak tower 6]                 [flak tower 6]
//                         START
//      ◦ two hover sponsons (3.2) orbit the deck at r 19.8 ◦
import { rect, disc, orbit } from '../kit.js';

const A = { x0: -24, x1: 24, z0: -24, z1: 24, floor: 0, ceil: 30 };
const plats = [];
const P = (...a) => plats.push(...a);
const polar = (r, deg) => [Math.cos((deg * Math.PI) / 180) * r, Math.sin((deg * Math.PI) / 180) * r];

// the bridge roof (the tower drops away under it) and the exit pad off its north edge
P(disc(0, 0, 24, 0, { thick: 46, style: 'fortress-bridgetop' })); // down to the flight deck 46 m below
P(rect(0, -29.5, 12, 11, 0.4, { thick: 4, style: 'fortress-exitpad' }));
// the core's plinth
P(disc(0, 0, 5.5, 1.2, { thick: 1.4, style: 'fortress-plinth' }));
// phase 1 pods: four pedestals on the diagonals
const PED = [45, 135, 225, 315].map((d) => polar(9.5, d));
for (const [x, z] of PED) P(rect(x, z, 3.6, 3.6, 2.4, { thick: 2.6, style: 'fortress-pedestal' }));
// phase 2 pods: three flak towers (cover, and 6 m perches)
const TOW = [30, 150, 270].map((d) => polar(13.5, d));
for (const [x, z] of TOW) P(rect(x, z, 4.6, 4.6, 6, { thick: 6.2, style: 'fortress-flaktower' }));
// two antenna masts with 9 m perches (dive onto the core's crown from up here)
for (const d of [210, 330]) { const [x, z] = polar(13.5, d); P(rect(x, z, 3, 3, 9, { thick: 9.2, style: 'fortress-antenna' })); }
// phase 3 pods: two hover sponsons orbiting the deck (you can ride them too)
const SPON = [];
for (const ph of [0.125, 0.625]) { SPON.push(plats.length); P(rect(0, 0, 4, 4, 3.2, { thick: 1, style: 'fortress-sponson', move: orbit('xz', 19.8, 28, ph) })); }
// the parapet: a low wall round the edge (a gap for the exit pad)
for (let i = 0; i < 24; i++) {
  const a = ((i + 0.5) / 24) * Math.PI * 2;
  if (Math.abs(a - Math.PI * 1.5) < 0.3) continue;
  const x = Math.cos(a) * 23.6, z = Math.sin(a) * 23.6;
  P(rect(x, z, 6.4, 0.7, 1.1, { thick: 1.4, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), style: 'fortress-parapet' }));
}

const on = ([x, z], y, dx = 0, dz = 0) => ({ x: x + dx, y, z: z + dz });
export default {
  id: 'fortress-boss', name: 'COMMAND BRIDGE', sub: 'AIR FORTRESS · BRIDGE TOWER · 12 400 M · 04:10 · BOSS', theme: 'fortressBoss', song: 'dreadnought',
  seed: 7004, par: 240, killY: -14, cloudY: -160, objective: 'boss', bossName: 'DREADNOUGHT',
  arena: A,
  start: { x: 0, y: 0, z: 15.5, yaw: 0 },
  plats,
  boss: {
    x: 0, y: 1.2, z: 0, kind: 'dreadnought',
    // where each phase raises its flak pods: [x, z] spots on decks, or platform indices (the sponsons)
    pods: [PED, TOW, SPON],
  },
  drives: [],
  exit: { x: 0, y: 0.4, z: -30, yaw: 0 },
  portal: null,
  enemies: [],
  pickups: [
    { type: 'health', x: -17, y: 1, z: -3, respawn: 20 },
    { type: 'health', x: 17, y: 1, z: -3, respawn: 20 },
    { type: 'health', x: 0, y: 1, z: 19, respawn: 25 },
    { type: 'healthBig', ...on(TOW[2], 7, 1.5, -1.5), respawn: 45 },
    { type: 'spread', x: -6, y: 1, z: 13, respawn: 25 },
    { type: 'rapid', x: 6, y: 1, z: 13, respawn: 25 },
    { type: 'rocket', ...on(polar(13.5, 210), 10), respawn: 30 },
    { type: 'rocket', ...on(polar(13.5, 330), 10), respawn: 30 },
    { type: 'slowmo', ...on(TOW[0], 7, 1.5, 1.5), respawn: 35 },
    { type: 'overdrive', ...on(TOW[1], 7, -1.5, 1.5), respawn: 40 },
  ],
  lasers: [],
  backdrops: [
    { kind: 'fortress-deckbelow', x: 30, y: -46, z: 10, yaw: 0, haze: 0.18 }, // the carrier, stretching away under the tower
    { kind: 'fortress-wing', x: -34, y: -60, z: 20, side: -1, haze: 0.3 },
    { kind: 'fortress-wing', x: 94, y: -60, z: 20, side: 1, haze: 0.3 },
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: 14, z: 0, r: 70, period: 34, phase: 0 }, // gunships circling the tower
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: 30, z: 0, r: 110, period: 48, phase: 0.5, dir: -1 },
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: -8, z: 0, r: 150, period: 60, phase: 0.25 },
    { kind: 'fortress-carrier', x: -620, y: -60, z: -300, yaw: 0.6, s: 1.4, haze: 0.5 },
    { kind: 'fortress-carrier', x: 560, y: -90, z: 520, yaw: -2.2, s: 1.1, haze: 0.55 },
    { kind: 'fortress-escorts', x: 300, y: 80, z: -520, yaw: -0.4, s: 1.2 },
    { kind: 'fortress-cumulus', x: 700, y: -180, z: -100, s: 1.8 },
    { kind: 'fortress-cumulus', x: -500, y: -180, z: 600, s: 1.6 },
    // the night: searchlights from the deck below and the wings, AA tracers, flak, the city through the clouds
    { kind: 'fortress-searchlights', x: 0, y: -45, z: -200, aim: 0.3, pitch: 0.75, sweep: 0.6, n: 3, gap: 12 },
    { kind: 'fortress-searchlights', x: 0, y: -45, z: 160, aim: Math.PI - 0.3, pitch: 0.7, sweep: 0.6, n: 3, gap: 12, phase: 2 },
    { kind: 'fortress-searchlights', x: -150, y: -52, z: 40, aim: 1.6, pitch: 0.6, sweep: 0.7, n: 2, phase: 1 },
    { kind: 'fortress-searchlights', x: 210, y: -52, z: 40, aim: -1.6, pitch: 0.6, sweep: 0.7, n: 2, phase: 3 },
    { kind: 'fortress-tracers', x: -26, y: -44, z: -150, aim: 0.9, pitch: 0.8, phase: 0.5 },
    { kind: 'fortress-tracers', x: 30, y: -44, z: 100, aim: -2.4, pitch: 0.75, phase: 2.2, col: 0xff5a3a },
    { kind: 'fortress-tracers', x: 30, y: -44, z: -60, aim: -1.2, pitch: 0.6, phase: 4 },
    { kind: 'fortress-flak', x: 60, y: 60, z: -380, w: 460, h: 140, d: 200 },
    { kind: 'fortress-flak', x: -360, y: 30, z: 120, w: 200, h: 120, d: 420, phase: 0.7 },
    { kind: 'fortress-citygap', x: -330, y: -159, z: -280, r: 140, coast: 0.8 },
    { kind: 'fortress-citygap', x: 360, y: -159, z: -160, r: 110 },
    { kind: 'fortress-citygap', x: 220, y: -159, z: 380, r: 120, coast: 3.6 },
    { kind: 'fortress-citygap', x: -250, y: -159, z: 330, r: 100 },
  ],
};
