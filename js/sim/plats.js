// Platforms: the solid world. Pure (no three.js, no DOM).
//
// The vocabulary is dr-mow's (js/levels.js), extended for a first-person platformer:
//   rect  { x, z, w, d, h, thick, yaw }  a block whose TOP is at height h (yaw: hover cars turn)
//   disc  { x, z, r, h, thick }           a round island
//   move  { axis: 'x'|'y'|'z', amp, period, phase }  dr-mow's mv(): offset = amp·sin(2π(t/period + phase))
//         or { dir: [dx, dy, dz], amp, period, phase } along any direction (hover-car traffic lanes)
//   bob   { amp, period, phase }           extra vertical hover bob (hover cars never sit still)
// `style` is a render hint only ('tower', 'car:sedan', 'deck', 'container'...). Physics never reads it.

import { clamp, TAU } from './util.js';

export const DEFAULT_THICK = 1.2;

// Build the runtime platform list from level data. Level data is never mutated (dr-mow WORK_GUIDE).
export function makePlats(defs) {
  return defs.map((d, id) => {
    const yaw = d.yaw || 0;
    const p = {
      id, kind: d.kind || 'rect', style: d.style || 'deck',
      x: d.x, z: d.z, h: d.h, thick: d.thick ?? DEFAULT_THICK,
      w: d.w || 0, d: d.d || 0, r: d.r || 0,
      yaw, c: Math.cos(yaw), s: Math.sin(yaw),
      move: d.move || null, bob: d.bob || null,
      ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: 0,
      bound: 0, // XZ bounding radius for the broadphase
      tint: d.tint ?? -1, // render hint
    };
    p.bound = p.kind === 'disc' ? p.r : Math.sqrt(p.w * p.w + p.d * p.d) / 2;
    if (p.move) p.bound += Math.abs(p.move.amp);
    return p;
  });
}

// Offset of a platform at time t (mover + bob). Pure function of time, so the
// renderer, the tools and the ports can all evaluate it without stepping.
export function platOffset(p, t, out) {
  let ox = 0, oy = 0, oz = 0;
  const m = p.move;
  if (m) {
    const k = m.amp * Math.sin(TAU * (t / m.period + (m.phase || 0)));
    if (m.dir) { ox = m.dir[0] * k; oy = m.dir[1] * k; oz = m.dir[2] * k; }
    else if (m.axis === 'x') ox = k;
    else if (m.axis === 'y') oy = k;
    else oz = k;
  }
  const b = p.bob;
  if (b) oy += b.amp * Math.sin(TAU * (t / b.period + (b.phase || 0)));
  out[0] = ox; out[1] = oy; out[2] = oz;
  return out;
}

const _o = [0, 0, 0];
export function updatePlats(plats, t) {
  for (const p of plats) {
    if (!p.move && !p.bob) { p.dx = p.dy = p.dz = 0; continue; }
    platOffset(p, t, _o);
    p.dx = _o[0] - p.ox; p.dy = _o[1] - p.oy; p.dz = _o[2] - p.oz;
    p.ox = _o[0]; p.oy = _o[1]; p.oz = _o[2];
  }
}

// Set every platform to its pose at time t with zero deltas (world creation, respawn, tools).
export function posePlats(plats, t) {
  for (const p of plats) {
    platOffset(p, t, _o);
    p.ox = _o[0]; p.oy = _o[1]; p.oz = _o[2];
    p.dx = p.dy = p.dz = 0;
  }
}

export const topOf = (p) => p.h + p.oy;
export const cxOf = (p) => p.x + p.ox;
export const czOf = (p) => p.z + p.oz;

// World → platform-local XZ (undo yaw). Yaw follows the camera convention: local -Z is "forward".
export function toLocal(p, x, z, out) {
  const dx = x - p.x - p.ox, dz = z - p.z - p.oz;
  out[0] = dx * p.c - dz * p.s;
  out[1] = dx * p.s + dz * p.c;
  return out;
}
export function toWorld(p, lx, lz, out) {
  out[0] = p.x + p.ox + lx * p.c + lz * p.s;
  out[1] = p.z + p.oz - lx * p.s + lz * p.c;
  return out;
}

const _l = [0, 0];
// Is (x, z) over the footprint (grown by margin)?
export function inside(p, x, z, margin = 0) {
  toLocal(p, x, z, _l);
  if (p.kind === 'disc') return _l[0] * _l[0] + _l[1] * _l[1] <= (p.r + margin) * (p.r + margin);
  return Math.abs(_l[0]) <= p.w / 2 + margin && Math.abs(_l[1]) <= p.d / 2 + margin;
}

// The highest platform top at or below y under (x, z). Returns the platform or null.
export function groundBelow(plats, x, z, y, margin = 0) {
  let best = null, bh = -Infinity;
  for (const p of plats) {
    const top = p.h + p.oy;
    if (top > y || top <= bh) continue;
    const dx = x - p.x - p.ox, dz = z - p.z - p.oz;
    if (dx * dx + dz * dz > (p.bound + margin) * (p.bound + margin)) continue;
    if (!inside(p, x, z, margin)) continue;
    bh = top; best = p;
  }
  return best;
}

// Push a vertical cylinder (feet y, height H, radius R) out of one platform, horizontally.
// Returns [nx, nz, depth] in world space, or null when they don't overlap in XZ.
const _push = [0, 0, 0];
export function pushOut(p, x, z, R) {
  toLocal(p, x, z, _l);
  const lx = _l[0], lz = _l[1];
  let nx, nz, depth;
  if (p.kind === 'disc') {
    const d = Math.sqrt(lx * lx + lz * lz);
    depth = p.r + R - d;
    if (depth <= 0) return null;
    if (d > 1e-6) { nx = lx / d; nz = lz / d; } else { nx = 1; nz = 0; }
  } else {
    const hw = p.w / 2, hd = p.d / 2;
    const qx = clamp(lx, -hw, hw), qz = clamp(lz, -hd, hd);
    const ex = lx - qx, ez = lz - qz, d = Math.sqrt(ex * ex + ez * ez);
    if (d > 1e-6) {
      depth = R - d;
      if (depth <= 0) return null;
      nx = ex / d; nz = ez / d;
    } else { // centre inside the footprint: leave by the nearest side
      const px = hw - Math.abs(lx), pz = hd - Math.abs(lz);
      if (px < pz) { nx = lx < 0 ? -1 : 1; nz = 0; depth = px + R; }
      else { nx = 0; nz = lz < 0 ? -1 : 1; depth = pz + R; }
    }
  }
  // back to world: rotate (nx, nz) by +yaw
  _push[0] = nx * p.c + nz * p.s;
  _push[1] = -nx * p.s + nz * p.c;
  _push[2] = depth;
  return _push;
}

// Ray vs platform (slab test in local space). Returns hit distance along the
// unit-ish direction (0..maxT) or -1. Sets RAY_N to the hit normal (world).
export const RAY_N = [0, 1, 0];
export function rayPlat(p, ox, oy, oz, dx, dy, dz, maxT) {
  const top = p.h + p.oy, bot = top - p.thick;
  // quick reject on the bounding sphere/column
  const cx = p.x + p.ox, cz = p.z + p.oz;
  const fx = ox - cx, fz = oz - cz;
  // local origin + direction
  const lox = fx * p.c - fz * p.s, loz = fx * p.s + fz * p.c;
  const ldx = dx * p.c - dz * p.s, ldz = dx * p.s + dz * p.c;
  let t0 = 0, t1 = maxT, axis = -1, sgn = 0;
  // Y slab
  if (Math.abs(dy) < 1e-9) { if (oy < bot || oy > top) return -1; }
  else {
    let a = (bot - oy) / dy, b = (top - oy) / dy;
    if (a > b) { const q = a; a = b; b = q; }
    if (a > t0) { t0 = a; axis = 1; sgn = dy > 0 ? -1 : 1; }
    if (b < t1) t1 = b;
    if (t0 > t1) return -1;
  }
  if (p.kind === 'disc') {
    // infinite cylinder along Y
    const A = ldx * ldx + ldz * ldz, B = 2 * (lox * ldx + loz * ldz), C = lox * lox + loz * loz - p.r * p.r;
    if (A < 1e-12) { if (C > 0) return -1; }
    else {
      const disc = B * B - 4 * A * C;
      if (disc < 0) return -1;
      const sq = Math.sqrt(disc);
      const a = (-B - sq) / (2 * A), b = (-B + sq) / (2 * A);
      if (a > t0) { t0 = a; axis = 3; }
      if (b < t1) t1 = b;
      if (t0 > t1) return -1;
    }
    if (axis === 3) {
      const hx = lox + ldx * t0, hz = loz + ldz * t0, n = Math.sqrt(hx * hx + hz * hz) || 1;
      const nx = hx / n, nz = hz / n;
      RAY_N[0] = nx * p.c + nz * p.s; RAY_N[1] = 0; RAY_N[2] = -nx * p.s + nz * p.c;
    } else { RAY_N[0] = 0; RAY_N[1] = sgn || 1; RAY_N[2] = 0; }
    return t0;
  }
  const hw = p.w / 2, hd = p.d / 2;
  // X slab
  if (Math.abs(ldx) < 1e-9) { if (lox < -hw || lox > hw) return -1; }
  else {
    let a = (-hw - lox) / ldx, b = (hw - lox) / ldx;
    const sx = ldx > 0 ? -1 : 1;
    if (a > b) { const q = a; a = b; b = q; }
    if (a > t0) { t0 = a; axis = 0; sgn = sx; }
    if (b < t1) t1 = b;
    if (t0 > t1) return -1;
  }
  // Z slab
  if (Math.abs(ldz) < 1e-9) { if (loz < -hd || loz > hd) return -1; }
  else {
    let a = (-hd - loz) / ldz, b = (hd - loz) / ldz;
    const sz = ldz > 0 ? -1 : 1;
    if (a > b) { const q = a; a = b; b = q; }
    if (a > t0) { t0 = a; axis = 2; sgn = sz; }
    if (b < t1) t1 = b;
    if (t0 > t1) return -1;
  }
  if (axis === 0) { RAY_N[0] = sgn * p.c; RAY_N[1] = 0; RAY_N[2] = -sgn * p.s; }
  else if (axis === 2) { RAY_N[0] = sgn * p.s; RAY_N[1] = 0; RAY_N[2] = sgn * p.c; }
  else { RAY_N[0] = 0; RAY_N[1] = sgn || 1; RAY_N[2] = 0; }
  return t0;
}

// Nearest platform hit along a segment. dir need not be unit: t is in units of dir.
// Returns { t, p } (shared object) or null.
const _hit = { t: 0, p: null, nx: 0, ny: 0, nz: 0 };
export function raycast(plats, ox, oy, oz, dx, dy, dz, maxT) {
  let best = maxT, bp = null, nx = 0, ny = 0, nz = 0;
  const L = Math.sqrt(dx * dx + dy * dy + dz * dz) * maxT;
  for (const p of plats) {
    // broadphase: distance from the segment's XZ midpoint to the platform column
    const mx = ox + dx * maxT * 0.5 - p.x - p.ox, mz = oz + dz * maxT * 0.5 - p.z - p.oz;
    const reach = p.bound + L * 0.5 + 0.01;
    if (mx * mx + mz * mz > reach * reach) continue;
    const t = rayPlat(p, ox, oy, oz, dx, dy, dz, best);
    if (t >= 0 && t < best) { best = t; bp = p; nx = RAY_N[0]; ny = RAY_N[1]; nz = RAY_N[2]; }
  }
  if (!bp) return null;
  _hit.t = best; _hit.p = bp; _hit.nx = nx; _hit.ny = ny; _hit.nz = nz;
  return _hit;
}

// Height of the highest top in the whole level (tools / camera bounds).
export function maxTop(plats) { let m = -Infinity; for (const p of plats) m = Math.max(m, p.h + Math.abs(p.move?.axis === 'y' ? p.move.amp : 0)); return m; }
