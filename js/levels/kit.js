// Level-authoring kit. Pure data helpers (no three.js, no DOM): the game, the tools and the
// JSON exporter (tools/export-levels.mjs) all read the same output.
//
// Built on dr-mow's vocabulary (js/levels.js there): rect / disc blocks with a TOP height `h`,
// `box(x0, x1, z0, z1, h)` in edges, and `mv(axis, amp, period, phase)` movers. Added for a
// first-person platformer: yaw on rects, a hover `bob`, towers that drop into the fog, hover
// cars of fixed sizes, container stacks, and `chain()`, a seeded run of hover cars between two
// points spaced inside the jump envelope (tools/sim-check.mjs proves every level is reachable).
//
// Coordinates: metres, +Y up, yaw 0 faces -Z (north on the level maps).
import { mulberry32 } from '../sim/util.js';

export const DEEP = -140; // towers reach down to here: far into the fog, never seen ending

export const mv = (axis, amp, period, phase = 0) => ({ axis, amp, period, phase });
export function lane(dx, dy, dz, amp, period, phase = 0) {
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  return { dir: [dx / l, dy / l, dz / l], amp, period, phase };
}
export const bob = (amp = 0.22, period = 3.2, phase = 0) => ({ amp, period, phase });
// Round a circle: plane 'xz' (a carousel), 'xy' or 'zy' (a Ferris wheel's gondola). The platform's
// (x, h, z) is the circle's centre offset by +amp along the first axis at phase 0.
export const orbit = (plane, r, period, phase = 0) => ({ orbit: plane, amp: r, period, phase });

export function rect(x, z, w, d, h, o = {}) {
  return { kind: 'rect', x, z, w, d, h, thick: o.thick ?? 1.2, yaw: o.yaw || 0, style: o.style || 'deck', move: o.move || null, bob: o.bob || null, tint: o.tint ?? -1 };
}
// dr-mow's edge form: x0..x1, z0..z1
export const box = (x0, x1, z0, z1, h, o = {}) => rect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, h, o);
export function disc(x, z, r, h, o = {}) {
  return { kind: 'disc', x, z, r, h, thick: o.thick ?? 1.2, style: o.style || 'pad', move: o.move || null, bob: o.bob || null, tint: o.tint ?? -1 };
}
// A building whose roof is at h, rising out of the fog.
export const tower = (x, z, w, d, h, o = {}) => rect(x, z, w, d, h, { style: 'tower', ...o, thick: h - DEEP });

// Floating billboard: a big two-sided ad screen hovering on thrusters, with a catwalk along its
// top edge you can land on. `ad` picks the (satirical) advert, see js/render/ads.js.
export function billboard(x, z, w, top, yaw = 0, o = {}) {
  return rect(x, z, w, o.deep ?? 2.4, top, { thick: o.tall ?? 7, yaw, style: 'billboard', tint: o.ad ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.25, 4.2, (x * 0.13) % 1) : o.bob });
}
// A flat ad deck: the advert faces the sky, you run across it.
export function adpad(x, z, w, d, top, yaw = 0, o = {}) {
  return rect(x, z, w, d, top, { thick: 0.7, yaw, style: 'adpad', tint: o.ad ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.2, 3.6, (z * 0.17) % 1) : o.bob });
}
// Laser wall: a curtain `len` wide and `h` tall standing on the deck at (x, y, z), lit for `on`
// of every `period` seconds (it flickers a warning first). See js/sim/hazards.js.
export const laser = (x, y, z, len, h, yaw = 0, period = 3, on = 0.5, phase = 0) => ({ x, y, z, len, h, yaw, period, on, phase });

// Hover-car sizes: w = width (local x), d = length (local z, nose toward -Z), t = height.
export const CARS = {
  sedan: { w: 2.3, d: 4.8, t: 1.3 },
  coupe: { w: 2.2, d: 4.2, t: 1.2 },
  taxi: { w: 2.3, d: 4.8, t: 1.3 },
  police: { w: 2.3, d: 5.0, t: 1.3 },
  van: { w: 2.5, d: 5.6, t: 2.1 },
  truck: { w: 3.0, d: 9.0, t: 2.6 },
  bus: { w: 3.2, d: 11, t: 2.8 },
  barge: { w: 6.5, d: 13, t: 1.4 },
};
// A hover car whose ROOF is at `top`. yaw: the way its nose points (0 = north / -Z).
export function car(kind, x, z, top, yaw = 0, o = {}) {
  const C = CARS[kind];
  return rect(x, z, C.w, C.d, top, { thick: C.t, yaw, style: 'car:' + kind, bob: o.bob === undefined ? bob(0.2, 3) : o.bob, move: o.move, tint: o.tint });
}
// Heading → yaw for something whose nose points along (dx, dz).
export const yawTo = (dx, dz) => Math.atan2(-dx, -dz);

// Shipping containers: 2.44 m wide, 2.6 m tall, 6.1 m (20 ft) or 12.2 m (40 ft) long.
export const CONT = { w: 2.44, h: 2.6, short: 6.1, long: 12.2 };
export function stack(x, z, base, n, o = {}) {
  const out = [], len = o.long ? CONT.long : CONT.short;
  for (let i = 0; i < n; i++) {
    out.push(rect(x, z, CONT.w, len, base + CONT.h * (i + 1), { thick: CONT.h, yaw: o.yaw || 0, style: 'container', tint: ((o.tint ?? 0) + i * 3) % 8 }));
  }
  return out;
}

// A seeded run of hover cars from point a to point b (both on walkable tops, at the edges you
// leave from / arrive at). Spacing stays inside the double-jump envelope: centre gaps ≤ maxStep
// and rises ≤ maxRise per hop (see GAME_DESIGN.md §Movement numbers).
// o.make(rng, x, z, top, yaw, i): build each stepping stone yourself (a themed connector: boats,
// lanterns, crates, drones…) instead of a hover car; return one platform or an array.
export function chain(seed, a, b, o = {}) {
  const rng = mulberry32(seed);
  const kinds = o.kinds || ['sedan', 'coupe', 'sedan', 'van', 'taxi'];
  const maxStep = o.maxStep ?? 7.2, maxRise = o.maxRise ?? 3.8;
  const dx = b.x - a.x, dz = b.z - a.z, dy = b.y - a.y;
  const D = Math.sqrt(dx * dx + dz * dz) || 1;
  const n = Math.max(2, Math.ceil(D / maxStep), Math.ceil(Math.max(0, dy) / maxRise), Math.ceil(Math.max(0, -dy) / 10));
  const heading = yawTo(dx, dz), px = -dz / D, pz = dx / D;
  const out = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const wob = (rng() - 0.5) * 2 * (o.wobble ?? 1.4);
    const x = a.x + dx * t + px * wob, z = a.z + dz * t + pz * wob;
    const y = a.y + dy * t + (rng() - 0.5) * 0.3;
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const yaw = heading + (rng() - 0.5) * 0.7 + (o.cross ? Math.PI / 2 : 0);
    const b = bob(0.15 + rng() * 0.15, 2.6 + rng() * 1.8, rng());
    if (o.make) { const m = o.make(rng, x, z, y, yaw, i); if (Array.isArray(m)) out.push(...m); else if (m) out.push(m); }
    else if (rng() < (o.ads ?? 0)) out.push(adpad(x, z, 5, 4, y, yaw, { ad: Math.floor(rng() * 64), bob: b })); // a floating ad deck instead of a car
    else out.push(car(kind, x, z, y, yaw, { bob: b, tint: Math.floor(rng() * 8) }));
  }
  return out;
}

// A ring of hover cars spiralling up round a centre (tower climbs).
export function spiral(seed, cx, cz, r, y0, y1, a0, turns, o = {}) {
  const rng = mulberry32(seed);
  const kinds = o.kinds || ['sedan', 'coupe', 'van', 'taxi'];
  const rise = o.rise ?? 3.5;
  const n = Math.max(2, Math.ceil((y1 - y0) / rise));
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, a = a0 + turns * 2 * Math.PI * t;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    const kind = kinds[Math.floor(rng() * kinds.length)];
    // nose along the tangent (direction of travel round the spiral)
    const yaw = yawTo(-Math.sin(a) * Math.sign(turns), Math.cos(a) * Math.sign(turns));
    out.push(car(kind, x, z, y0 + (y1 - y0) * t, yaw, { bob: bob(0.15 + rng() * 0.12, 2.8 + rng() * 1.5, rng()), tint: Math.floor(rng() * 8) }));
  }
  return out;
}

// Filler skyline: seeded towers in a ring band round the play space (scenery you can still land on).
export function skyline(seed, cx, cz, r0, r1, n, hMin, hMax, avoid = []) {
  const rng = mulberry32(seed), out = [];
  for (let i = 0, tries = 0; i < n && tries < n * 30; tries++) {
    const a = rng() * Math.PI * 2, r = r0 + rng() * (r1 - r0);
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    const w = 10 + Math.floor(rng() * 4) * 4, d = 10 + Math.floor(rng() * 4) * 4;
    if (avoid.some(([ax, az, ar]) => (x - ax) * (x - ax) + (z - az) * (z - az) < (ar + Math.max(w, d) * 0.7) * (ar + Math.max(w, d) * 0.7))) continue;
    if (out.some((t) => Math.abs(t.x - x) < (t.w + w) / 2 + 6 && Math.abs(t.z - z) < (t.d + d) / 2 + 6)) continue;
    out.push(tower(x, z, w, d, hMin + rng() * (hMax - hMin), { tint: Math.floor(rng() * 8) }));
    i++;
  }
  return out;
}

// ------------------------------------------------------------------ composing levels
// The point on top of platform p nearest to (tx, tz), pulled `inset` metres in from the edge:
// where you'd leave p heading for (tx, tz). Handles yawed rects and discs.
export function edgeToward(p, tx, tz, inset = 0.9) {
  if (p.kind === 'disc') {
    const dx = tx - p.x, dz = tz - p.z, d = Math.sqrt(dx * dx + dz * dz) || 1, r = Math.max(0, p.r - inset);
    return { x: p.x + (dx / d) * r, y: p.h, z: p.z + (dz / d) * r };
  }
  const c = Math.cos(p.yaw || 0), s = Math.sin(p.yaw || 0);
  const dx = tx - p.x, dz = tz - p.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c; // world → local (same as plats.js toLocal)
  const hw = Math.max(0, p.w / 2 - inset), hd = Math.max(0, p.d / 2 - inset);
  const qx = Math.max(-hw, Math.min(hw, lx)), qz = Math.max(-hd, Math.min(hd, lz));
  return { x: p.x + qx * c + qz * s, y: p.h, z: p.z - qx * s + qz * c };
}
// A chain of stepping stones between two platforms, edge to edge (see chain() for o).
export function link(seed, a, b, o = {}) {
  const pa = edgeToward(a, b.x, b.z, o.inset), pb = edgeToward(b, a.x, a.z, o.inset);
  return chain(seed, pa, pb, o);
}
// A point standing on platform p, offset (dx, dz) from its centre (for drives, enemies, pickups):
// y is p's top plus `up`.
export const on = (p, dx = 0, dz = 0, up = 0) => ({ x: p.x + dx, y: p.h + up, z: p.z + dz });
// A plain hover pad (a disc on thrusters): the default themed stepping stone.
export const pad = (x, z, r, top, o = {}) => disc(x, z, r, top, { thick: o.thick ?? 0.6, style: o.style || 'pad', bob: o.bob === undefined ? bob(0.2, 3.4, (x * 0.07 + z * 0.05) % 1) : o.bob, move: o.move, tint: o.tint });
