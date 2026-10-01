// Bonus stages — SERVER CORE. Reached through the hidden portal in each stage (Jumping Flash's
// bonus rounds): a cluster of floating pads far from the city, a rack of servers on them, and
// 30 seconds to blow every one of them up. Power-ups float between the pads.
// Three layouts (one per stage), all built from the same pure recipe.
import { disc, rect, bob, mv } from './kit.js';

function arena(seed, o) {
  const plats = [], servers = [], pickups = [];
  const P = (...a) => plats.push(...a);
  // centre pad (the start)
  P(disc(0, 0, 7, 0, { thick: 1.6, style: 'core' }));
  // lower ring: pads at alternating heights
  const n = o.ring;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + o.twist;
    const r = 16, h = o.heights[i % o.heights.length];
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const moving = o.movers && i % 3 === 1;
    P(disc(x, z, 3.4, h, { thick: 1.2, style: 'pad', bob: bob(0.25, 3 + (i % 3) * 0.4, i / n), move: moving ? mv('y', 1.6, 5, i / n) : null }));
    servers.push({ x, y: h + 2, z, yaw: -a + Math.PI / 2 }); // (y above the pad's highest bob: attach snaps it down)
  }
  // upper decks: long slabs between the ring and the core (servers in pairs)
  for (let i = 0; i < o.upper; i++) {
    const a = (i / o.upper) * Math.PI * 2 + o.twist + Math.PI / n;
    const r = 9.5, h = 9 + (i % 2) * 3.5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    P(rect(x, z, 3.6, 7, h, { thick: 1, yaw: -a, style: 'deck', bob: bob(0.2, 3.6, i / o.upper) }));
    servers.push({ x: x + Math.cos(a + Math.PI / 2) * 1.6, y: h + 2, z: z + Math.sin(a + Math.PI / 2) * 1.6, yaw: -a });
    servers.push({ x: x - Math.cos(a + Math.PI / 2) * 1.6, y: h + 2, z: z - Math.sin(a + Math.PI / 2) * 1.6, yaw: -a });
  }
  // a high crow's-nest pad over the core with the best power-up
  P(disc(0, 0, 2.6, 17.5, { thick: 0.8, style: 'pad', bob: bob(0.3, 3.8, 0) }));
  servers.push({ x: 0, y: 19.5, z: 0, yaw: 0 });
  // power-ups: time first (always on the lower ring), then the stage's flavour
  const pick = (i, h) => { const a = (i / n) * Math.PI * 2 + o.twist + Math.PI / n; return { x: Math.cos(a) * 15, y: h, z: Math.sin(a) * 15 }; };
  pickups.push({ type: 'time', ...pick(0, 4.5), fly: true }, { type: 'time', ...pick(Math.floor(n / 2), 5), fly: true });
  pickups.push({ type: o.power, ...pick(Math.floor(n / 4), 6), fly: true });
  pickups.push({ type: o.weapon, x: 0, y: 1, z: -3.5 }); // ahead of the start, never on it
  pickups.push({ type: 'overdrive', x: 0, y: 18.6, z: 0 });
  return {
    bonus: true, seed, time: 30, killY: -14,
    start: { x: 0, y: 0, z: 4.5, yaw: 0 },
    plats, servers, pickups, enemies: [], drives: [],
  };
}

export const BONUS = {
  docks: { id: 'bonus-docks', name: 'SERVER CORE α', sub: 'BONUS · DESTROY EVERY SERVER', theme: 'bonusDay', music: 'boulder',
    ...arena(101, { ring: 8, heights: [0, 3, 1, 5], twist: 0, upper: 3, power: 'hyper', weapon: 'spread', movers: false }) },
  skyway: { id: 'bonus-skyway', name: 'SERVER CORE β', sub: 'BONUS · DESTROY EVERY SERVER', theme: 'bonusDusk', music: 'sprint',
    ...arena(202, { ring: 8, heights: [2, 0, 4, 1, 6, 2], twist: 0.4, upper: 4, power: 'hyper', weapon: 'rapid', movers: true }) },
  neon: { id: 'bonus-neon', name: 'SERVER CORE γ', sub: 'BONUS · DESTROY EVERY SERVER', theme: 'bonusNight', music: 'netdive',
    ...arena(303, { ring: 9, heights: [0, 4, 2, 6, 1, 5], twist: 0.2, upper: 4, power: 'hyper', weapon: 'rocket', movers: true }) },
};
