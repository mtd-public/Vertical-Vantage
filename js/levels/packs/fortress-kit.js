// AIR FORTRESS level helpers: the carrier's own building blocks. Pure data (no three.js, no DOM),
// built on js/levels/kit.js. Every style named here is drawn by js/render/packs/fortress.js.
import { rect, disc, bob } from '../kit.js';

// A point offset (lx, lz) in the local frame of something at (x, z) turned by yaw (yaw 0 = nose to −Z).
export function at(x, z, yaw, lx, lz) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + lx * c + lz * s, z - lx * s + lz * c];
}

// A parked VTOL fighter, nose along yaw. The fuselage (top 3.2) carries the whole model; the wings
// (top 2.4: one hop up from the deck) and the tailplane are invisible collision that matches it.
// Returns the platforms; v.wing / v.body give their tops for placing things.
export const VTOL = { body: 3.2, wing: 2.4, tail: 2.9 };
export function vtol(x, z, yaw, tint = 0, base = 0) {
  const [wx, wz] = at(x, z, yaw, 0, 1.2), [tx, tz] = at(x, z, yaw, 0, 5.6);
  return [
    rect(x, z, 2.8, 13, base + VTOL.body, { thick: 2.6, yaw, style: 'fortress-vtol', tint }),
    rect(wx, wz, 13, 3.6, base + VTOL.wing, { thick: 0.35, yaw, style: 'fortress-hidden' }),
    rect(tx, tz, 6.2, 1.8, base + VTOL.tail, { thick: 0.3, yaw, style: 'fortress-hidden' }),
  ];
}

// A ring of n short rects round (cx, cz): a lift-fan rim you can run round. r = centre line radius.
export function ring(cx, cz, r, n, top, o = {}) {
  const out = [], len = (2 * Math.PI * r) / n + (o.overlap ?? 0.35);
  for (let i = 0; i < n; i++) {
    const a = (i + 0.5) / n * Math.PI * 2;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    // the rect's long side (local x) along the tangent: local x = (cos yaw, −sin yaw) = (−sin a, cos a)
    out.push(rect(x, z, len, o.w ?? 1.3, top, { thick: o.thick ?? 1.6, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), style: o.style || 'fortress-fanrim', tint: o.tint ?? i }));
  }
  return out;
}

// A deck tug / tow tractor: a low stepping stone on the flight deck.
export const tug = (x, z, yaw = 0, base = 0) => rect(x, z, 2.4, 4.2, base + 1.6, { thick: 1.6, yaw, style: 'fortress-tug' });
// Munitions crates (2.6 m cubes), stacked n high.
export function ammo(x, z, base, n, o = {}) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(rect(x, z, o.w ?? 2.6, o.d ?? 2.6, base + 2.6 * (i + 1), { thick: 2.6, yaw: o.yaw || 0, style: 'fortress-ammo', tint: ((o.tint ?? 0) + i) % 4 }));
  return out;
}
// A hanging cargo pod on its cables (cable = how far up its hoist is): it swings / bobs.
export const pod = (x, z, top, o = {}) => rect(x, z, o.w ?? 4, o.d ?? 4, top, { thick: o.thick ?? 2.4, yaw: o.yaw || 0, style: 'fortress-cargopod', tint: o.cable ?? 10, bob: o.bob === undefined ? bob(0.35, 3.4 + ((x * 0.37 + z * 0.11) % 1.4), ((x * 0.13 - z * 0.07) % 1 + 1) % 1) : o.bob, move: o.move });
// A grated catwalk between (x0, z0) and (x1, z1) (axis-aligned), w wide. tint: 1 = hangs on rods from above.
export function walk(x0, z0, x1, z1, top, o = {}) {
  const w = o.w ?? 3.2;
  if (Math.abs(x1 - x0) >= Math.abs(z1 - z0)) return rect((x0 + x1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), w, top, { thick: o.thick ?? 0.6, style: 'fortress-catwalk', tint: o.tint ?? 0 });
  return rect((x0 + x1) / 2, (z0 + z1) / 2, w, Math.abs(z1 - z0), top, { thick: o.thick ?? 0.6, style: 'fortress-catwalk', tint: o.tint ?? 0 });
}
// A gun blister: a round armoured housing (a deck gun stands on it).
export const blister = (x, z, top, r = 2.6, o = {}) => disc(x, z, r, top, { thick: o.thick ?? 2.2, style: 'fortress-blister', bob: o.bob, move: o.move, tint: o.tint });
