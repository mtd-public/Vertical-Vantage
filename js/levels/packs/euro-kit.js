// NEO EURO pack: level-building helpers shared by its four stages. Pure data (no three.js, no DOM).
// Built on js/levels/kit.js; every themed stepping stone here keeps to the kit's jump envelope.
import { rect, disc, bob, yawTo } from '../kit.js';
import { mulberry32 } from '../../sim/util.js';

const TAU = Math.PI * 2;
const frac = (v) => v - Math.floor(v); // a phase in 0..1 (also for negative inputs)

// A tourist hover-Vespa: the pack's stepping stone (2.4 × 3.8 m deck, nose along yaw), bobbing.
export function vespa(x, z, top, yaw = 0, o = {}) {
  return rect(x, z, 2.4, 3.8, top, { thick: 1.1, yaw, style: 'vespa', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.15, 3, frac(x * 0.11 + z * 0.07)) : o.bob });
}
// For chain() / link(): o.make = makeVespa
export const makeVespa = (rng, x, z, top, yaw) => vespa(x, z, top, yaw, { tint: Math.floor(rng() * 6), bob: bob(0.12 + rng() * 0.1, 2.6 + rng() * 1.6, rng()) });

// A boat moored or bobbing on the water (deck top at `top`): fishing gozzo, water taxi, gondola…
export function boat(x, z, top, yaw = 0, o = {}) {
  return rect(x, z, o.w ?? 2.8, o.d ?? 7, top, { thick: o.thick ?? 1.4, yaw, style: o.style || 'boat', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.12, 3.6, frac(x * 0.05 + z * 0.09)) : o.bob });
}
export const makeBoat = (rng, x, z, top, yaw) => boat(x, z, top, yaw, { tint: Math.floor(rng() * 8) });

// A floating carnival mask (a disc you land on), bobbing; tint picks the mask.
export function mask(x, z, top, o = {}) {
  return disc(x, z, o.r ?? 1.9, top, { thick: 0.6, style: 'mask', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.22, 3.4, frac(x * 0.07 + z * 0.13)) : o.bob });
}
export const makeMask = (rng, x, z, top) => mask(x, z, top, { tint: Math.floor(rng() * 6), bob: bob(0.18 + rng() * 0.1, 3 + rng() * 1.4, rng()) });

// A flight of walkable stairs: n steps of `rise` (≤ 0.38: you walk up them), each `run` deep, `w` wide,
// climbing from (x, z) along the unit direction (dx, dz) from the height `base`. Each step is a block
// down to `floor` (or `thick` if given). Returns the steps; the last one's top is base + n·rise.
export function stairs(x, z, dx, dz, w, run, rise, n, base, o = {}) {
  const out = [], yaw = yawTo(dx, dz);
  for (let k = 1; k <= n; k++) {
    const t = (k - 0.5) * run, top = base + k * rise;
    out.push(rect(x + dx * t, z + dz * t, w, run + 0.02, top, { thick: o.thick ?? top - (o.floor ?? 0), yaw, style: o.style || 'steps', tint: o.tint ?? -1 }));
  }
  return out;
}

// Points round a circle (cx, cz) radius r from angle a0 (radians, from +x toward +z) by `da` per step,
// rising from y0 by `rise`: returns [{ x, z, y, a }] (spiral climbs round towers).
export function spiralPts(cx, cz, r, a0, da, y0, rise, n) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = a0 + da * k; out.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: y0 + rise * k, a }); }
  return out;
}

// A ring of blocks round an ellipse (semi-axes a × b to the ring's middle line): n segments, each
// `depth` deep (radially), top at `top`, solid `thick` down (default to the floor at 0).
// Used for the Colosseum's tiers. o.skip(i) leaves a segment out (gates).
export function ellipseRing(cx, cz, a, b, depth, top, n, o = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    if (o.skip && o.skip(i)) continue;
    const t0 = (i / n) * TAU, t1 = ((i + 1) / n) * TAU, tm = (t0 + t1) / 2;
    const x0 = Math.cos(t0) * a, z0 = Math.sin(t0) * b, x1 = Math.cos(t1) * a, z1 = Math.sin(t1) * b;
    const len = Math.sqrt((x1 - x0) * (x1 - x0) + (z1 - z0) * (z1 - z0));
    const x = Math.cos(tm) * a, z = Math.sin(tm) * b;
    // the tangent direction: the segment runs along local x, so yaw turns local x onto (x1 - x0, z1 - z0)
    const yaw = -Math.atan2(z1 - z0, x1 - x0);
    out.push(rect(cx + x, cz + z, len + (o.overlap ?? 1.2), depth, top, { thick: o.thick ?? top - (o.floor ?? 0), yaw, style: o.style || 'deck', tint: o.tint ?? i }));
  }
  return out;
}

// Seeded houses along a row: x from x0 to x1, z band z0..z1, tops in [hMin, hMax], widths in [wMin, wMax],
// alleys of [gMin, gMax] between them. thick: down to `floor`. Returns rects with style / tint per house.
export function houseRow(seed, x0, x1, z0, z1, hMin, hMax, o = {}) {
  const rng = mulberry32(seed), out = [];
  const wMin = o.wMin ?? 7, wMax = o.wMax ?? 10, gMin = o.gMin ?? 1.2, gMax = o.gMax ?? 2.4;
  let x = x0;
  while (x < x1 - 3) {
    const w = Math.min(x1 - x, wMin + rng() * (wMax - wMin));
    const d = (z1 - z0) - rng() * (o.dJit ?? 1.5);
    const top = Math.round((hMin + rng() * (hMax - hMin)) * 4) / 4;
    out.push(rect(x + w / 2, z1 - d / 2, w, d, top, { thick: top - (o.floor ?? 0), style: o.style || 'casa', tint: Math.floor(rng() * 8) })); // fronts line up on z1 (the sea side)
    x += w + gMin + rng() * (gMax - gMin);
  }
  return out;
}
