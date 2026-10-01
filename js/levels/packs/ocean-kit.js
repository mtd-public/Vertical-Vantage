// OCEAN CORE's level pieces: pure data builders on top of js/levels/kit.js (no three.js, no DOM).
// Everything floats on (or stands in) the open sea at y = 0. A fall into the water is a fall
// (stages use killY ≈ -0.6), so every deck rises out of it and the stepping stones are things
// that float: buoys, pontoons, work boats, cargo drones.
//
// Style names are all prefixed 'oc-' (render/packs/ocean.js builds their looks).
import { rect, disc, box, bob, yawTo } from '../kit.js';
import { mulberry32 } from '../../sim/util.js';

const ph = (x, z) => (((x * 0.071 + z * 0.053) % 1) + 1) % 1; // a bob phase from the position

// A steel offshore deck from x0..x1, z0..z1, its top at `top`, standing in the water.
export const deck = (x0, x1, z0, z1, top, o = {}) => box(x0, x1, z0, z1, top, { thick: o.thick ?? top + 1, style: o.style || 'oc-deck', tint: o.tint ?? 0 });
// A navigation / mooring buoy you can stand on (a disc that rides the swell).
export const buoy = (x, z, top, o = {}) => disc(x, z, o.r ?? 1.7, top, { thick: o.thick ?? Math.max(1.4, top + 0.8), style: 'oc-buoy', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(o.amp ?? 0.28, o.period ?? 3.4, ph(x, z)) : o.bob });
// A maintenance pontoon: a float with fenders.
export const pontoon = (x, z, w, d, top, yaw = 0, o = {}) => rect(x, z, w, d, top, { thick: o.thick ?? Math.max(1.2, top + 0.6), yaw, style: 'oc-pontoon', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(o.amp ?? 0.18, o.period ?? 3.8, ph(x, z)) : o.bob });
// A big cylindrical tank (fresh water 0, brine 1, chemicals 2) rising out of the sea.
export const tank = (x, z, r, top, tint = 0) => disc(x, z, r, top, { thick: top + 1, style: 'oc-tank', tint });
// A building block (hall, pump house, chiller): style + its top, thick down to `base`.
export const block = (x, z, w, d, top, base, style, o = {}) => rect(x, z, w, d, top, { thick: top - base, yaw: o.yaw || 0, style, tint: o.tint ?? 0, move: o.move, bob: o.bob });
// A big pipe you can run along: from (x0, z0) to (x1, z1), its crown at `top`, diameter w.
export function pipe(x0, z0, x1, z1, top, w = 2.6, o = {}) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz);
  return rect((x0 + x1) / 2, (z0 + z1) / 2, w, L, top, { thick: w, yaw: yawTo(dx, dz), style: o.style || 'oc-pipe', tint: o.tint ?? 0 });
}
// A catwalk / cable tray / gantry: a narrow walkway from (x0, z0) to (x1, z1) at `top`.
export function walk(x0, z0, x1, z1, top, w = 2.4, style = 'oc-catwalk', o = {}) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz);
  return rect((x0 + x1) / 2, (z0 + z1) / 2, w, L, top, { thick: o.thick ?? 0.5, yaw: yawTo(dx, dz), style, tint: o.tint ?? 0, move: o.move, bob: o.bob });
}
// A small valve / service pad on a pole (the pole is scenery): a themed stepping stone.
export const valve = (x, z, top, o = {}) => rect(x, z, o.w ?? 3.2, o.d ?? 3.2, top, { thick: 0.6, yaw: o.yaw || 0, style: 'oc-valve', tint: o.tint ?? 0 });

// A backdrop's yaw that turns its long side (local x) to face the level centred (cx, cz): wind-farm
// rows then run across the view instead of marching up to the play space.
export const away = (x, z, cx, cz) => Math.PI / 2 - Math.atan2(z - cz, x - cx);

// chain() / link() makers (o.make): buoys at water level, service pads up structures.
export const makeBuoy = (o = {}) => (rng, x, z, top, yaw, i) => buoy(x, z, top, { tint: (o.tint ?? 0) + (i % 2), amp: o.amp, r: o.r });
export const makeValve = (o = {}) => (rng, x, z, top, yaw, i) => valve(x, z, top, { yaw, tint: o.tint ?? 0 });
export const makePontoon = (o = {}) => (rng, x, z, top, yaw) => pontoon(x, z, o.w ?? 3.2, o.d ?? 5, top, yaw + Math.PI / 2, { tint: o.tint ?? 0 });

// Service landings spiralling up round a round or square tower centred (cx, cz): n pads from y0
// (exclusive) to y1 (inclusive) over `turns`, at radius r, each `size` square, tangent to the turn.
export function landings(cx, cz, r, y0, y1, a0, turns, o = {}) {
  const rise = o.rise ?? 3.4, n = Math.max(2, Math.ceil((y1 - y0) / rise)), out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, a = a0 + turns * 2 * Math.PI * t;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    out.push(rect(x, z, o.size ?? 3.4, o.len ?? 3.4, y0 + (y1 - y0) * t, { thick: 0.6, yaw: yawTo(-Math.sin(a), Math.cos(a)), style: o.style || 'oc-landing', tint: o.tint ?? 0 }));
  }
  return out;
}

// A seeded scatter of drifting buoys inside a box (scenery you can still land on).
export function buoyField(seed, x0, x1, z0, z1, n, avoid = []) {
  const rng = mulberry32(seed), out = [];
  for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
    const x = x0 + rng() * (x1 - x0), z = z0 + rng() * (z1 - z0);
    if (avoid.some(([ax, az, ar]) => (x - ax) * (x - ax) + (z - az) * (z - az) < ar * ar)) continue;
    if (out.some((b) => (b.x - x) * (b.x - x) + (b.z - z) * (b.z - z) < 36)) continue;
    out.push(buoy(x, z, 1.1 + rng() * 0.4, { tint: Math.floor(rng() * 3), amp: 0.3 + rng() * 0.15 }));
    k++;
  }
  return out;
}
