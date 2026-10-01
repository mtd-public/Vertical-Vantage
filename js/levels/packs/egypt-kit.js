// EGYPT pack: level-building helpers shared by its four stages. Pure data (no three.js, no DOM).
// Built on js/levels/kit.js; every themed stepping stone keeps to the kit's jump envelope.
// Style names are the pack's own (render/packs/egypt-styles.js builds their looks).
import { rect, disc, box, bob, yawTo } from '../kit.js';
import { mulberry32 } from '../../sim/util.js';

const TAU = Math.PI * 2;
export const frac = (v) => v - Math.floor(v); // a phase in 0..1 (also for negative inputs)

// A hover felucca: a Nile sailboat on thrusters. The 3 × 8.5 m deck is what you stand on (nose along
// yaw); the lateen sail rides high over it (render only: its foot clears your head).
export function felucca(x, z, top, yaw = 0, o = {}) {
  return rect(x, z, 3.0, 8.5, top, { thick: 1.0, yaw, style: 'eg-felucca', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.14, 3.4, frac(x * 0.07 + z * 0.05)) : o.bob });
}
// A fanous: a Ramadan lantern the size of a car, hovering (a disc you land on; tint picks the glass).
export function fanous(x, z, top, o = {}) {
  return disc(x, z, o.r ?? 1.6, top, { thick: 0.8, style: 'eg-fanous', tint: o.tint ?? 0, move: o.move, bob: o.bob === undefined ? bob(0.2, 3.3, frac(x * 0.09 + z * 0.13)) : o.bob });
}
// For chain() / link(): o.make = makeFanous
export const makeFanous = (rng, x, z, top) => fanous(x, z, top, { tint: Math.floor(rng() * 6), bob: bob(0.16 + rng() * 0.1, 3 + rng() * 1.4, rng()) });

// A building block (house, shop, hall): its roof at `top`, solid down to `base` (default the street, 0).
export const block = (x0, x1, z0, z1, top, style, o = {}) => box(x0, x1, z0, z1, top, { thick: top - (o.base ?? 0), style, tint: o.tint ?? -1 });

// A block of Cairo rooftops: rows along x between z0 and z1, houses x0..x1 with alleys between them.
// Roof heights in [hMin, hMax] (snapped to 0.5 m). o.skip(x0, x1, z0, z1) leaves a house out (a hole
// for a fixed building). Returns the houses (style o.style, tint per house).
export function roofs(seed, x0, x1, z0, z1, hMin, hMax, o = {}) {
  const rng = mulberry32(seed), out = [];
  const rowMin = o.rowMin ?? 9.5, rowMax = o.rowMax ?? 13, wMin = o.wMin ?? 8, wMax = o.wMax ?? 12.5;
  let z = z0;
  while (z < z1 - 4) {
    const d = Math.min(z1 - z, rowMin + rng() * (rowMax - rowMin));
    let x = x0;
    while (x < x1 - 3) {
      const w = Math.min(x1 - x, wMin + rng() * (wMax - wMin));
      const top = Math.round((hMin + rng() * (hMax - hMin)) * 2) / 2;
      const za = z + rng() * 0.8, zb = z + d - rng() * 0.8; // ragged frontages
      if (!(o.skip && o.skip(x, x + w, za, zb))) out.push(box(x, x + w, za, zb, top, { thick: top - (o.base ?? 0), style: o.style || 'eg-roof', tint: Math.floor(rng() * 8) }));
      x += w + 1.2 + rng() * 1.3; // alleys 1.2–2.5 m: a hop, never a fall you didn't choose
    }
    z += d + 1.4 + rng() * 1.2;
  }
  return out;
}

// A flight of walkable stairs: n steps of `rise` (≤ 0.38: you walk up them), each `run` deep, `w` wide,
// climbing from (x, z) along the unit direction (dx, dz) from `base`. Each step is solid down to o.floor.
export function stairs(x, z, dx, dz, w, run, rise, n, base, o = {}) {
  const out = [], yaw = yawTo(dx, dz);
  for (let k = 1; k <= n; k++) {
    const t = (k - 0.5) * run, top = base + k * rise;
    out.push(rect(x + dx * t, z + dz * t, w, run + 0.02, top, { thick: top - (o.floor ?? 0), yaw, style: o.style || 'eg-steps', tint: o.tint ?? -1 }));
  }
  return out;
}

// Ledges spiralling up round a round shaft (a minaret, a sensor mast): n ledges w × d (w along the
// tangent), centred `rc` from (cx, cz), starting at angle a0 (radians, +x toward +z) and height y0,
// `da` and `rise` apart. Returns { plats, pts } (pts: each ledge's centre and top).
export function spiralLedges(cx, cz, rc, a0, da, y0, rise, n, o = {}) {
  const plats = [], pts = [];
  for (let k = 0; k < n; k++) {
    const a = a0 + da * k, x = cx + Math.cos(a) * rc, z = cz + Math.sin(a) * rc, y = y0 + rise * k;
    const tx = -Math.sin(a), tz = Math.cos(a);
    plats.push(rect(x, z, o.w ?? 3.0, o.d ?? 2.0, y, { thick: o.thick ?? 0.5, yaw: Math.atan2(-tz, tx), style: o.style || 'eg-ledge', tint: o.tint ?? k }));
    pts.push({ x, z, y, a });
  }
  return { plats, pts };
}

// A lattice ring round a shaft: n segments (each L long along the tangent, `depth` radially, centred
// rc out) at height `top`, starting at angle a0. The Cairo Tower's lotus lattice stacks these, each
// ring turned half a segment from the one below: you climb up through the gaps.
export function latticeRing(cx, cz, rc, n, L, depth, top, a0, o = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU, tx = -Math.sin(a), tz = Math.cos(a);
    out.push(rect(cx + Math.cos(a) * rc, cz + Math.sin(a) * rc, L, depth, top, { thick: o.thick ?? 0.4, yaw: Math.atan2(-tz, tx), style: o.style || 'eg-lattice', tint: o.tint ?? -1 }));
  }
  return out;
}

// A stepped pyramid: n nested square courses round (cx, cz), the first half-width hw0 with its top at
// `rise`, each next one `run` narrower and `rise` higher (solid down to o.base). The casing courses
// are the ledges you climb. Returns the courses, lowest first; tint carries the course number.
export function pyramid(cx, cz, hw0, run, rise, n, o = {}) {
  const out = [], base = o.base ?? 0;
  for (let k = 0; k < n; k++) {
    const hw = hw0 - run * k, top = base + rise * (k + 1);
    out.push(rect(cx, cz, hw * 2, hw * 2, top, { thick: top - base + (o.sink ?? 0.5), style: o.style || 'eg-course', tint: k + (o.tint0 ?? 0) }));
  }
  return out;
}

// Does the box x0..x1 × z0..z1 come within m of the box X0..X1 × Z0..Z1? (roofs() skip tests)
export const near = (x0, x1, z0, z1, X0, X1, Z0, Z1, m = 1.5) => x1 > X0 - m && x0 < X1 + m && z1 > Z0 - m && z0 < Z1 + m;

// A point on the ring of radius r round (cx, cz) at angle a (radians), at height y.
export const ringPt = (cx, cz, r, a, y = 0) => ({ x: cx + Math.cos(a) * r, y, z: cz + Math.sin(a) * r });
