// SEATTLE pack styles, stage 3 (RAINIER RAIN) and the boss arena (ABOVE THE NEEDLE): bare floor slabs,
// construction hoists, glass towers, the skybridge, a window-washing cradle, tower cranes (mast, deck,
// jib, counter-jib, loads), steel on hover pallets, the pedestal tower; the storm deck, its stem and pads.
import * as THREE from 'three';
import { strut, text } from './seattle-kit.js';
import { EMERALD, TEAL, N_AMBER, N_RED, WARM, DARK, STEEL, ring, circle, torus, railing } from './seattle-styles.js';
import { edgeRect, edgeDisc, pool, paint, dots } from './sanfran-night.js';

const TAU = Math.PI * 2;
const YEL = 0xf0b02a, YEL2 = 0xd8901a, RUST = 0x9a4a2a;

// A bare floor slab: raw concrete, edge barriers, columns down to the floor below, rebar at the top.
export function skelSlab(K, p, th, rng, H) {
  const { w, d, thick } = p, top = p.tint === 1;
  K.add('flat', H.box(w, thick, d, { y: -thick / 2, color: 0xa8aaa4 }));
  K.add('flat', H.box(w - 0.6, 0.02, d - 0.6, { y: 0.012, color: 0x9a9c96 }));
  for (const f of H.faces(w, d)) K.add('hazard', H.box(f.tx ? f.width : 0.06, 0.2, f.tz ? f.width : 0.06, { x: f.nx * (f.half + 0.03), y: -0.25, z: f.nz * (f.half + 0.03) }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const x = sx * (w / 2 - 0.5), z = sz * (d / 2 - 0.5);
    K.add('flat', H.box(0.6, 3.4, 0.6, { x, y: -thick - 1.7, z, color: 0x8e908a }));
    if (top && (sx && sz)) for (let k = 0; k < 4; k++) K.add('flat', H.box(0.05, 1.2, 0.05, { x: x + (k % 2 - 0.5) * 0.3, y: 0.6, z: z + ((k >> 1) - 0.5) * 0.3, color: RUST }));
  }
  if (top) K.add('neon', ...text('SEATTLE RISING', { px: 0.1, depth: 0.05, y: -0.75, z: d / 2 + 0.1, color: EMERALD }));
  // night: amber LED along the slab's edges, work lamps under it (lighting the floor below), a string
  // of construction bulbs across the top
  edgeRect(K, H, w + 0.06, d + 0.06, N_AMBER, { y: -0.08, t: 0.08 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('glow', H.box(0.5, 0.2, 0.5, { x: sx * (w / 2 - 1.4), y: -thick - 0.12, z: sz * (d / 2 - 1.4), color: 0xfff0d0 }));
  dots(K, H, [-w / 2 + 0.6, 2.4, -d / 2 + 0.6], [w / 2 - 0.6, 2.4, d / 2 - 0.6], 9, 0.16, WARM);
  for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('flat', H.box(0.08, 2.4, 0.08, { x: sx * (w / 2 - 0.6), y: 1.2, z: sz * (d / 2 - 0.6), color: 0x3a3c40 }));
  for (let k = 0; k < 3; k++) K.add('flat', H.box(1.2 + rng(), 0.5, 0.9, { x: (rng() - 0.5) * (w - 4), y: 0.25, z: (rng() - 0.5) * (d - 4), ry: rng() * 3, color: [0x6a6e74, RUST, 0x4a6a8a][k] })); // pallets of stuff
}
// The finished floors under the slabs: glass curtain wall into the fog.
export function skelCore(K, p, th, rng, H) {
  const g = H.meterBox(p.w, p.thick, p.d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: Math.floor(rng() * 8) * 2, color: 0x8aa4b0 });
  g.translate(0, -p.thick / 2, 0); K.add('facade', g);
  K.add('flat', H.box(p.w, 0.3, p.d, { y: -0.15, color: 0x5a5e62 }));
}
// A construction hoist: a cage on its rack (the building side, local -x or +z, stays open).
export function hoist(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, thick, d, { y: -thick / 2, color: 0x4a4e54 }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('flat', H.box(0.1, 2.2, 0.1, { x: sx * (w / 2 - 0.05), y: 1.1, z: sz * (d / 2 - 0.05), color: YEL }));
  for (const y of [1.1, 2.2]) for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width : 0.06, 0.06, f.tz ? f.width : 0.06, { x: f.nx * (f.half - 0.05), y, z: f.nz * (f.half - 0.05), color: YEL }));
  K.add('glow', H.box(0.2, 0.2, 0.2, { y: 2.3, color: 0xffb02b }));
  K.add('glow', H.cyl(0.9, 0.9, 0.05, 8, { y: -thick - 0.03, color: 0x7ff6d0 }));
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width : 0.07, 0.07, f.tz ? f.width : 0.07, { x: f.nx * (f.half + 0.02), y: -0.08, z: f.nz * (f.half + 0.02), color: N_AMBER }));
}
export function hoistMast(K, p, th, rng, H) {
  const { w, d } = p, n = Math.min(40, Math.floor(70 / 2));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('flat', H.box(0.12, 72, 0.12, { x: sx * (w / 2 - 0.06), y: -36, z: sz * (d / 2 - 0.06), color: 0x8a8e92 }));
  for (let k = 0; k < n; k++) K.add('flat', H.box(w, 0.08, 0.08, { y: -k * 2, color: 0x8a8e92 }), H.box(0.08, 0.08, d, { y: -k * 2 - 1, color: 0x8a8e92 }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 0.3, color: 0xff2a2a }));
}

// A finished glass tower: blue-green curtain wall, mullion bands, a lit crown.
export function glassTower(K, p, th, rng, H) {
  const { w, d, thick } = p;
  const g = H.meterBox(w, thick, d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: Math.floor(rng() * 8) * 2, v0: Math.floor(rng() * 4) * 4, color: 0x7ea8b4 });
  g.translate(0, -thick / 2, 0); K.add('facade', g);
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: 0x4a4e54 }));
  for (const f of H.faces(w, d)) {
    K.add('flat', H.box(f.tx ? f.width : 0.3, 0.9, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: 0.45, z: f.nz * (f.half - 0.15), color: 0x5e646a }));
    K.add('neon', H.box(f.tx ? f.width + 0.2 : 0.12, 0.14, f.tz ? f.width + 0.2 : 0.12, { x: f.nx * (f.half + 0.06), y: -0.8, z: f.nz * (f.half + 0.06), color: 0xdff8ec }));
    for (let y = -6; y > -60; y -= 12) K.add('flat', H.box(f.tx ? f.width + 0.1 : 0.1, 0.3, f.tz ? f.width + 0.1 : 0.1, { x: f.nx * (f.half + 0.04), y, z: f.nz * (f.half + 0.04), color: 0x3a4a52 }));
  }
  K.add('flat', H.cyl(0.1, 0.14, 6, 5, { x: w / 2 - 1, y: 3, z: -d / 2 + 1, color: 0x3a3c40 }));
  K.add('glow', H.box(0.24, 0.24, 0.24, { x: w / 2 - 1, y: 6.1, z: -d / 2 + 1, color: 0xff2a2a }));
  edgeRect(K, H, w, d, TEAL, { y: 0.92, t: 0.08, out: -0.08 }); // the parapet's lit cap
}
// The pedestal tower: a block of offices balanced on a tapering stalk (Rainier Square's oddest).
export function pedestalTower(K, p, th, rng, H) {
  const { w, d } = p, body = 30, stalk = 50;
  const g = H.meterBox(w, body, d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: 4, color: 0xc8c0b0 });
  g.translate(0, -body / 2, 0); K.add('facade', g);
  K.add('flat', H.part(new THREE.CylinderGeometry(w * 0.707, w * 0.25, stalk, 4, 1), { y: -body - stalk / 2, ry: Math.PI / 4, color: 0xb8b0a0 }));
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: 0x5a5e62 }));
  for (const f of H.faces(w, d)) {
    K.add('flat', H.box(f.tx ? f.width : 0.3, 0.8, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: 0.4, z: f.nz * (f.half - 0.15), color: 0x7a7468 }));
    K.add('neon', H.box(f.tx ? f.width + 0.2 : 0.12, 0.14, f.tz ? f.width + 0.2 : 0.12, { x: f.nx * (f.half + 0.06), y: -body + 0.2, z: f.nz * (f.half + 0.06), color: 0xffb070 }));
  }
  edgeRect(K, H, w, d, EMERALD, { y: 0.82, t: 0.08, out: -0.08 });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; K.add('glow', H.box(0.3, stalk * 0.9, 0.3, { x: Math.cos(a) * w * 0.42, y: -body - stalk * 0.47, z: Math.sin(a) * w * 0.42, color: 0xffd8a0 })); } // the stalk's lit seams
}
// The glass skybridge between A and B: you walk its roof.
export function skyBridge(K, p, th, rng, H) {
  const { w, d, thick } = p, along = w > d, L = along ? w : d, W = along ? d : w;
  const bx = (l, h, wd, o) => H.box(along ? l : wd, h, along ? wd : l, o);
  K.add('flat', bx(L, 0.25, W, { y: -0.125, color: 0x6a7076 }));
  K.add('glow', bx(L, thick - 0.6, W - 0.2, { y: -0.25 - (thick - 0.6) / 2, color: 0x2a5a62 })); // the glass, lit inside
  K.add('flat', bx(L, 0.35, W, { y: -thick + 0.17, color: 0x4a4e54 }));
  for (let t = -L / 2; t <= L / 2; t += 2.5) K.add('flat', H.box(along ? 0.14 : W + 0.06, thick - 0.4, along ? W + 0.06 : 0.14, { x: along ? t : 0, y: -thick / 2, z: along ? 0 : t, color: 0x3a3e44 }));
  for (const s of [-1, 1]) K.add('neon', H.box(along ? L : 0.1, 0.1, along ? 0.1 : L, { x: along ? 0 : s * W / 2, y: -thick + 0.4, z: along ? s * W / 2 : 0, color: EMERALD }));
  edgeRect(K, H, w, d, TEAL, { y: -0.08, t: 0.08 });
}
// A window-washing cradle hung off a roof.
export function bmuCradle(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, thick, d, { y: -thick / 2, color: 0x5a5e64 }));
  railing(K, H, w, d, [0, 1, 2, 3], YEL, 1.0);
  for (const sx of [-1, 1]) K.add('flat', H.box(0.05, 8, 0.05, { x: sx * (w / 2 - 0.2), y: 4.5, color: 0x2a2c30 }));
  K.add('flat', H.box(0.5, 0.4, 0.6, { x: -w / 2 + 0.8, y: 0.2, color: 0x2a6a8a })); // a bucket and a squeegee, naturally
  K.add('glow', H.box(0.2, 0.2, 0.2, { x: w / 2 - 0.3, y: 1.1, color: 0xffb02b }));
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width : 0.07, 0.07, f.tz ? f.width : 0.07, { x: f.nx * (f.half + 0.02), y: -0.08, z: f.nz * (f.half + 0.02), color: N_AMBER }));
}

// ---- tower cranes
// The mast: a yellow lattice, four chords and braces, fading down into the fog.
export function tcMast(K, p, th, rng, H) {
  const { w } = p, h = 72, hw = w / 2 - 0.1;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('flat', H.box(0.2, h, 0.2, { x: sx * hw, y: -h / 2, z: sz * hw, color: YEL }));
  for (let y = 0; y > -h; y -= 2.4) {
    for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) K.add('flat', strut([ax * hw, y, az * hw], [bx * hw, y - 2.4, bz * hw], 0.09, YEL2));
  }
  for (let y = -14; y > -h; y -= 18) K.add('glow', H.box(0.35, 0.35, 0.35, { x: hw + 0.1, y, z: hw + 0.1, color: N_RED }), H.box(0.35, 0.35, 0.35, { x: -hw - 0.1, y, z: -hw - 0.1, color: N_RED }));
}
// The slewing deck: the platform the jibs meet on, the operator's cab under it, the A-frame above.
export function tcDeck(K, p, th, rng, H) {
  const { w, d, thick } = p, exitCrane = p.tint === 1;
  K.add('flat', H.box(w, thick, d, { y: -thick / 2, color: YEL }));
  K.add('flat', H.box(w - 0.2, 0.02, d - 0.2, { y: 0.012, color: 0x5a5e62 }));
  K.add('flat', H.box(2.4, 2.2, 2.4, { x: w / 2 + 1.1, y: -thick - 0.6, z: d / 2 - 1.4, color: 0xe8eae6 }));
  K.add('glass', H.box(2.45, 1.0, 2.45, { x: w / 2 + 1.1, y: -thick - 0.3, z: d / 2 - 1.4 }));
  K.add('glow', H.box(1.6, 0.1, 1.6, { x: w / 2 + 1.1, y: -thick - 1.2, z: d / 2 - 1.4, color: 0xfff0c0 }));
  // the A-frame stands off to the counter-jib side so you can stand (and the exit gate can) in the middle
  const ax = exitCrane ? w / 2 - 0.4 : 0, az = exitCrane ? 0 : -d / 2 + 0.4, top = 9;
  for (const s of [-1, 1]) K.add('flat', strut([exitCrane ? ax : s * (w / 2 - 0.3), 0, exitCrane ? s * (d / 2 - 0.3) : az], [ax, top, az], 0.28, YEL));
  K.add('glow', H.box(0.4, 0.4, 0.4, { x: ax, y: top + 0.3, z: az, color: 0xff2a2a }));
  if (exitCrane) K.add('neon', ...text('TOP OUT', { px: 0.12, depth: 0.05, x: 0, y: -1.2, z: d / 2 + 0.1, color: EMERALD }));
  edgeRect(K, H, w, d, N_AMBER, { y: -0.1 });
  for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('glow', H.box(0.6, 0.35, 0.6, { x: sx * (w / 2 + 0.3), y: -thick - 0.3, z: sz * (d / 2 + 0.3), color: 0xfff0d0 })); // floodlights under the deck
}
// The jib: a lattice girder you walk along (the top chord), rails, lights to the tip; long axis = the longer side.
export function tcJib(K, p, th, rng, H) {
  const { w, d, thick } = p, along = w > d, L = along ? w : d, W = along ? d : w;
  const P3 = (t, y, s) => (along ? [t, y, s] : [s, y, t]);
  const bx = (l, h, wd, o) => H.box(along ? l : wd, h, along ? wd : l, o);
  K.add('flat', bx(L, 0.2, W, { y: -0.1, color: YEL }));
  K.add('flat', bx(L, 0.02, W * 0.5, { y: 0.012, color: 0x4a4e52 }));
  for (const s of [-1, 1]) K.add('flat', bx(L, 0.2, 0.2, { x: along ? 0 : s * W * 0.45, y: -thick - 0.6, z: along ? s * W * 0.45 : 0, color: YEL }));
  for (let t = -L / 2; t < L / 2; t += 2) for (const s of [-1, 1]) K.add('flat', strut(P3(t, -0.15, s * W * 0.45), P3(t + 2, -thick - 0.6, s * W * 0.45), 0.08, YEL2));
  for (const s of [-1, 1]) K.add('flat', bx(L, 0.05, 0.05, { x: along ? 0 : s * (W / 2 - 0.04), y: 1.0, z: along ? s * (W / 2 - 0.04) : 0, color: 0xff8a1a }));
  for (let t = -L / 2; t <= L / 2; t += 3) for (const s of [-1, 1]) K.add('flat', H.box(0.05, 1.0, 0.05, { x: along ? t : s * (W / 2 - 0.04), y: 0.5, z: along ? s * (W / 2 - 0.04) : t, color: 0xff8a1a }));
  for (let t = -L / 2 + 4; t < L / 2; t += 8) K.add('hazard', bx(1.6, 0.03, W * 0.8, { x: along ? t : 0, y: 0.016, z: along ? 0 : t }));
  // night: the walkway's amber edge lights, work lamps hung under the girder, red at the tip
  for (const s2 of [-1, 1]) K.add('neon', bx(L, 0.07, 0.07, { x: along ? 0 : s2 * (W / 2 + 0.02), y: -0.06, z: along ? s2 * (W / 2 + 0.02) : 0, color: N_AMBER }));
  for (let t = -L / 2 + 3; t < L / 2; t += 6) K.add('glow', bx(0.6, 0.18, 0.5, { x: along ? t : 0, y: -thick - 0.75, z: along ? 0 : t, color: 0xfff0d0 }));
  for (const e of [-1, 1]) K.add('glow', H.box(0.35, 0.35, 0.35, { x: along ? e * (L / 2 - 0.2) : 0, y: 1.2, z: along ? 0 : e * (L / 2 - 0.2), color: N_RED }));
}
// The counter-jib: a short girder with the concrete counterweights slung under its end.
export function tcCounter(K, p, th, rng, H) {
  const { w, d, thick } = p, along = w > d, L = along ? w : d, W = along ? d : w;
  const bx = (l, h, wd, o) => H.box(along ? l : wd, h, along ? wd : l, o);
  K.add('flat', bx(L, thick, W, { y: -thick / 2, color: YEL }));
  K.add('flat', bx(L, 0.02, W * 0.6, { y: 0.012, color: 0x4a4e52 }));
  const sign = (p.tint === 1 ? 1 : -1), end = sign * (L / 2 - 2.2);
  for (let k = 0; k < 3; k++) K.add('flat', H.box(along ? 1.2 : W + 0.8, 2.6, along ? W + 0.8 : 1.2, { x: along ? end - sign * k * 1.3 : 0, y: -thick - 1.3, z: along ? 0 : end - sign * k * 1.3, color: 0x8a8c88 }));
  edgeRect(K, H, w, d, N_AMBER, { y: -0.1, t: 0.08 });
}
// A load slung from a jib: a bundle of steel I-beams on a cable. tint 0: straight up 12 m to the jib
// overhead; tint 1: up and over 4.5 m to a jib beside it.
export function craneLoad(K, p, th, rng, H) {
  const { w, d, thick } = p;
  beams(K, H, w, d, thick);
  const dz = p.tint === 1 ? -4.5 : 0, up = p.tint === 1 ? 6 : 12;
  for (const sx of [-0.35, 0.35]) K.add('flat', strut([sx * w, 0, 0], [0, 1.4, 0], 0.05, 0x2a2c30));
  K.add('flat', strut([0, 1.4, 0], [0, up - 0.6, dz], 0.07, 0x1a1c20));
  K.add('flat', H.box(0.5, 0.6, 0.5, { y: 1.6, color: YEL }));
  K.add('glow', H.box(0.2, 0.2, 0.2, { y: 1.98, color: N_AMBER }));
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width : 0.06, 0.06, f.tz ? f.width : 0.06, { x: f.nx * (f.half + 0.04), y: -0.08, z: f.nz * (f.half + 0.04), color: TEAL }));
}
function beams(K, H, w, d, thick) {
  const n = Math.max(2, Math.round(w / 0.75));
  for (let k = 0; k < n; k++) {
    const x = -w / 2 + (k + 0.5) * (w / n), c = k % 2 ? RUST : 0xb85a2a;
    K.add('flat', H.box(w / n - 0.06, 0.1, d, { x, y: -0.05, color: c }), H.box(0.1, thick - 0.2, d, { x, y: -thick / 2, color: c }), H.box(w / n - 0.06, 0.1, d, { x, y: -thick + 0.05, color: c }));
  }
  for (const z of [-d * 0.3, d * 0.3]) K.add('flat', H.box(w + 0.06, thick + 0.04, 0.12, { y: -thick / 2, z, color: 0xe8b03a }));
}
// Steel on a hover pallet: the building site's stepping stones.
export function steelLoad(K, p, th, rng, H) {
  const { w, d, thick } = p;
  beams(K, H, w, d, thick * 0.7);
  K.add('flat', H.box(w + 0.3, 0.25, d + 0.3, { y: -thick * 0.7 - 0.12, color: 0x3a3e44 }));
  for (const sz of [-1, 1]) {
    K.add('flat', H.cyl(0.3, 0.36, 0.3, 6, { y: -thick - 0.1, z: sz * d * 0.3, color: DARK }));
    K.add('glow', H.cyl(0.28, 0.28, 0.04, 6, { y: -thick - 0.27, z: sz * d * 0.3, color: 0x7ff6d0 }));
  }
  for (const f of H.faces(w + 0.3, d + 0.3)) K.add('glow', H.box(f.tx ? f.width : 0.07, 0.07, f.tz ? f.width : 0.07, { x: f.nx * f.half, y: -thick * 0.7 - 0.12, z: f.nz * f.half, color: TEAL })); // the pallet's lit edge
}

// ---- the boss arena
// The saucer's roof in the storm: wet dark metal, hazard edge, red rim lights, the halo ribs below.
export function stormDeck(K, p, th, rng, H) {
  const r = p.r, n = 48;
  K.add('flat', circle(H, r, 0.004, 0x545c62, n));
  for (const rr of [r * 0.3, r * 0.62]) K.add('flat', ring(H, rr, rr + 0.14, 0.01, 0x3a4248, n));
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; K.add('flat', H.box(r * 0.62, 0.02, 0.08, { x: Math.cos(a) * r * 0.62, y: 0.012, z: Math.sin(a) * r * 0.62, ry: -a, color: 0x40484e })); }
  for (let k = 0; k < 6; k++) { const a = rng() * TAU, rr = 2 + rng() * (r - 4); K.add('flat', H.box(1.4 + rng() * 2, 0.02, 0.8 + rng() * 1.4, { x: Math.cos(a) * rr, y: 0.02, z: Math.sin(a) * rr, ry: rng() * 3, color: 0x6e7c88 })); } // puddles
  K.add('hazard', ring(H, r - 0.6, r - 0.05, 0.014, 0xffffff, n));
  K.add('flat', H.cyl(1.0, 1.2, 0.5, 8, { y: 0.25, color: 0x3a4046 })); // a hatch
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 0.65, color: 0xff2a2a }));
  const lathe = (pts) => H.part(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)).reverse(), H.seg(n, 20)), { color: 0x8a9096 });
  K.add('flat', lathe([[r, 0], [r + 0.35, -0.5], [r + 0.6, -1.5], [r + 0.3, -2.4], [r - 0.6, -3.1], [r * 0.5, -p.thick]]));
  K.add('glass', H.cyl(r + 0.5, r + 0.62, 0.8, H.seg(n, 20), { y: -1.95 }));
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * TAU, c = Math.cos(a), s = Math.sin(a);
    K.add('flat', strut([c * r * 0.55, -p.thick - 0.2, s * r * 0.55], [c * (r + 1.0), -0.8, s * (r + 1.0)], 0.16, 0xb8bcc0));
    if (k % 3 === 0) K.add('glow', H.box(0.24, 0.16, 0.24, { x: c * (r + 0.4), y: -0.45, z: s * (r + 0.4), color: 0xff3a2a }));
  }
  K.add('neon', torus(H, r + 0.62, 0.09, { y: -1.5, color: EMERALD }));
  K.add('glow', H.cyl(r + 0.5, r + 0.62, 0.8, H.seg(n, 20), { y: -1.95, color: 0xffd8a0 })); // the restaurant below, lit
  edgeDisc(K, H, r - 0.05, TEAL, { key: 'glow', y: -0.1, n: 48, t: 0.09 });
}
// Below the saucer: the core and the legs flaring in under it, down into the murk.
export function needleStem(K, p, th, rng, H) {
  K.add('flat', H.cyl(p.r, p.r, 70, 10, { y: -35, color: 0x9a9e9a }));
  for (const L of [90, 210, 330]) for (const s of [-1, 1]) {
    const pt = (rad, y, sp) => { const a = (L + s * sp) * Math.PI / 180; return [Math.cos(a) * rad, y, Math.sin(a) * rad]; };
    K.add('flat', strut(pt(9.6, 4.8, 6), pt(7, -10, 8), 0.8, 0xc8ccc8), strut(pt(7, -10, 8), pt(4.2, -28, 11), 0.8, 0xc8ccc8), strut(pt(4.2, -28, 11), pt(3.2, -60, 14), 0.8, 0xc8ccc8));
  }
  for (let y = -6; y > -60; y -= 9) K.add('glow', H.box(0.3, 0.3, 0.3, { x: p.r + 0.1, y, color: 0xff3a2a }));
  for (let y = -12; y > -66; y -= 12) K.add('glow', H.cyl(p.r + 0.05, p.r + 0.05, 0.3, 10, { y, color: 0xd8f0ff })); // lit bands down the core
}
const PAD_LIGHT = [EMERALD, 0xffb02b, 0x7ff6ff, 0xff6ad8];
export function stormPad(K, p, th, rng, H) {
  H.deck(K, p, th);
  const c = PAD_LIGHT[(p.tint >= 0 ? p.tint : 0) % 4];
  K.add('neon', torus(H, p.r + 0.02, 0.07, { y: -0.25, color: c }));
  K.add('glow', ring(H, p.r * 0.35, p.r * 0.45, 0.02, c, 16));
  K.add('flat', H.cyl(0.4, 0.55, 0.6, 6, { y: -p.thick - 0.5, color: DARK }));
  K.add('glow', H.cyl(0.4, 0.4, 0.04, 6, { y: -p.thick - 0.82, color: 0x7ff6d0 }));
}
