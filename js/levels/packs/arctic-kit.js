// ARCTIC VAULT: level pieces shared by the pack's four stages. Pure data (no three.js, no DOM), built
// on js/levels/kit.js. Every style named here ('arc-…') is drawn by js/render/packs/arctic-styles.js;
// a few pack numbers ride in `tint` (stilt heights, radome sizes, cable drops) for the renderer.
import { rect, disc, box, bob, yawTo } from '../kit.js';
import { mulberry32 } from '../../sim/util.js';

const frac = (v) => v - Math.floor(v); // a phase in 0..1 (negative inputs too)
const ph = (x, z) => frac(x * 0.071 + z * 0.053);

// A snowfield / rock bench from x0..x1, z0..z1 with its top at `top` (solid down to top - thick).
export const ground = (x0, x1, z0, z1, top, o = {}) => box(x0, x1, z0, z1, top, { thick: o.thick ?? top + 3, style: o.style || 'arc-snow', tint: o.tint ?? 0 });

// A Longyearbyen house on stilts (permafrost: nothing touches the ground). Its body is h tall with the
// flat roof at base + stilt + h; you can walk under it. tint = colour (0..7) + 8 × stilt in quarter-metres.
export function house(x, z, w, d, base, stilt, h, col, o = {}) {
  return rect(x, z, w, d, base + stilt + h, { thick: h, yaw: o.yaw || 0, style: o.style || 'arc-house', tint: (col % 8) + 8 * Math.round(stilt * 4) });
}
// A row of stilt houses along x (fronts on z1), seeded colours and roof heights.
export function houseRow(seed, x0, x1, z0, z1, base, o = {}) {
  const rng = mulberry32(seed), out = [];
  const wMin = o.wMin ?? 6.5, wMax = o.wMax ?? 9, gMin = o.gMin ?? 2.2, gMax = o.gMax ?? 3.6;
  let x = x0;
  while (x < x1 - 4) {
    const w = Math.min(x1 - x, wMin + rng() * (wMax - wMin));
    const d = (z1 - z0) - rng() * 1.5;
    const stilt = o.stilt ?? 1.8 + Math.floor(rng() * 3) * 0.25;
    const h = Math.round((o.hMin ?? 4.5) * 2 + rng() * ((o.hMax ?? 7) - (o.hMin ?? 4.5)) * 2) / 2;
    out.push(house(x + w / 2, z1 - d / 2, w, d, base, stilt, h, Math.floor(rng() * 8)));
    x += w + gMin + rng() * (gMax - gMin);
  }
  return out;
}

// A hover snowmobile (deck 1.8 × 3.4, nose along yaw) / a cargo sled (2.8 × 6) / a tracked snow-cat.
export function snowmobile(x, z, top, yaw = 0, o = {}) {
  return rect(x, z, 1.9, 3.4, top, { thick: 1.0, yaw, style: 'arc-snowmobile', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.14, 2.6, ph(x, z)) : o.bob });
}
export function sled(x, z, top, yaw = 0, o = {}) {
  return rect(x, z, o.w ?? 2.8, o.d ?? 6, top, { thick: 1.1, yaw, style: 'arc-sled', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.16, 3.1, ph(x, z)) : o.bob });
}
export const makeSnowmobile = (rng, x, z, top, yaw) => snowmobile(x, z, top, yaw, { tint: Math.floor(rng() * 6), bob: bob(0.12 + rng() * 0.08, 2.4 + rng() * 1.4, rng()) });

// Sea ice: a floe (rect or round) riding the swell; `thick` keeps it 1.6 m deep under the water line.
export function floe(x, z, w, d, top, o = {}) {
  return rect(x, z, w, d, top, { thick: o.thick ?? top + 1.6, yaw: o.yaw || 0, style: 'arc-floe', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(o.amp ?? 0.16, o.period ?? 4.2, ph(x, z)) : o.bob });
}
export function floeR(x, z, r, top, o = {}) {
  return disc(x, z, r, top, { thick: o.thick ?? top + 1.6, style: 'arc-floe', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(o.amp ?? 0.16, o.period ?? 4.2, ph(x, z)) : o.bob });
}
export const makeFloe = (o = {}) => (rng, x, z, top, yaw, i) => (i % 2 && !o.rect
  ? floeR(x, z, o.r ?? 2.4 + rng() * 0.8, top, { tint: Math.floor(rng() * 4), amp: o.amp })
  : floe(x, z, o.w ?? 4 + rng() * 1.5, o.d ?? 3.4 + rng() * 1.2, top, { yaw, tint: Math.floor(rng() * 4), amp: o.amp }));

// The coal tramway (taubane): a timber trestle tower with a little deck on top (3 × 3), solid down to `base`
// (tint = its height in metres, for the lattice legs). Buckets ride the cable between two towers.
export const trestle = (x, z, top, base, o = {}) => rect(x, z, o.w ?? 3, o.d ?? 3, top, { thick: top - base, yaw: o.yaw || 0, style: 'arc-trestle', tint: Math.round(top - base) });
// A tram bucket (the hopper you ride, 2.4 × 2.4): `move` slides it along the cable; tint = hanger length (dm).
export const bucket = (x, z, top, move, o = {}) => rect(x, z, 2.4, 2.4, top, { thick: 1.6, yaw: o.yaw || 0, style: 'arc-bucket', tint: Math.round((o.hang ?? 3.2) * 10), move, bob: null });

// A white radome on its drum: a sphere of radius R whose equator stands `drum` above `base`. Collision:
// the drum, then thin tiers circumscribing the upper hemisphere (you stand on the dome, never in it).
// The top tier carries the look (tint = R in dm × 1000 + the drum's height in dm); the rest are hidden.
export function radome(x, z, R, base, drum = 2.4, o = {}) {
  const out = [], c = base + drum, s = o.step ?? 0.6, n = Math.ceil(R / s);
  out.push(disc(x, z, R, c, { thick: drum, style: 'arc-hidden' }));
  for (let k = 0; k < n; k++) {
    const y0 = c + k * s, y1 = Math.min(c + R, y0 + s), dy = y0 - c;
    const r = Math.sqrt(Math.max(0, R * R - dy * dy));
    const last = k === n - 1;
    out.push(disc(x, z, Math.max(1.2, r), y1, { thick: y1 - y0, style: last ? 'arc-radome' : 'arc-hidden', tint: last ? Math.round(R * 10) * 1000 + Math.round(drum * 10) : -1 }));
  }
  return out;
}

// A flight of walkable steps (rise ≤ 0.38) from (x, z) along the unit direction (dx, dz), n steps from `base`.
export function steps(x, z, dx, dz, w, run, rise, n, base, o = {}) {
  const out = [], yaw = yawTo(dx, dz);
  for (let k = 1; k <= n; k++) {
    const t = (k - 0.5) * run, top = base + k * rise;
    out.push(rect(x + dx * t, z + dz * t, w, run + 0.02, top, { thick: o.thick ?? top - (o.floor ?? base), yaw, style: o.style || 'arc-steps', tint: o.tint ?? -1 }));
  }
  return out;
}

// An ice ledge on the calving cliff: a shelf of blue ice sticking out of the face.
export const ledge = (x, z, w, d, top, o = {}) => rect(x, z, w, d, top, { thick: o.thick ?? 1.6, yaw: o.yaw || 0, style: o.style || 'arc-ledge', tint: o.tint ?? 0 });
// A snow bridge over a crevasse: a narrow crust of snow (it holds… this time).
export const snowBridge = (x0, z0, x1, z1, top, w = 2.2) => {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz);
  return rect((x0 + x1) / 2, (z0 + z1) / 2, w, L, top, { thick: 1.4, yaw: yawTo(dx, dz), style: 'arc-snowbridge' });
};
// A grated catwalk from (x0, z0) to (x1, z1) at `top`.
export function walk(x0, z0, x1, z1, top, w = 2.4, o = {}) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz);
  return rect((x0 + x1) / 2, (z0 + z1) / 2, w, L, top, { thick: o.thick ?? 0.5, yaw: yawTo(dx, dz), style: o.style || 'arc-catwalk', tint: o.tint ?? 0, move: o.move, bob: o.bob });
}
// A crate of cargo / a fuel drum pallet (2.4 m).
export const crate = (x, z, top, s = 2.4, o = {}) => rect(x, z, s, o.d ?? s, top, { thick: o.thick ?? s, yaw: o.yaw || 0, style: 'arc-crate', tint: o.tint ?? 0 });

// Points round a circle: n points from angle a0 by da, radius r, rising from y0 by `rise` each.
export function arcPts(cx, cz, r, a0, da, y0, rise, n) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = a0 + da * k; out.push({ x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, y: y0 + rise * k, a }); }
  return out;
}
