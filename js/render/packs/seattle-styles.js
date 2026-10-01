// SEATTLE pack platform styles. Each builds into Kit K in the platform's local frame: origin at its
// centre, y = 0 at its top (where you stand), footprint p.w × p.d (rect) or radius p.r (disc).
// Retro: flat-shaded primitives, vertex colours, a few neon accents (the pack's emerald).
import * as THREE from 'three';
import { strut, struts, lathe, text } from './seattle-kit.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
export const EMERALD = 0x3ad88a;
export const CONCRETE = 0xb4b8ae, DARK = 0x2c3236, STEEL = 0x5a6064, WHITE = 0xe2e4de;
export const ring = (H, r0, r1, y, color, n = 32) => H.part(new THREE.RingGeometry(r0, r1, H.seg(n, Math.max(12, n >> 1))), { rx: -Math.PI / 2, y, color });
export const circle = (H, r, y, color, n = 32) => H.part(new THREE.CircleGeometry(r, H.seg(n, Math.max(12, n >> 1))), { rx: -Math.PI / 2, y, color });
export const torus = (H, r, t, o) => H.part(new THREE.TorusGeometry(r, t, 3, H.seg(32, 16)), { rx: Math.PI / 2, ...o });

// A conifer in a planter (render only; kept to the edges of decks).
export function tree(K, H, x, z, h = 4) {
  K.add('flat', H.box(1.5, 0.6, 1.5, { x, y: 0.3, z, color: 0x5a5e58 }));
  K.add('flat', H.cyl(0.12, 0.16, 1, 5, { x, y: 1, z, color: 0x4a3a2a }));
  K.add('flat', H.part(new THREE.ConeGeometry(1.1, h * 0.55, 6), { x, y: 1.1 + h * 0.27, z, color: 0x2f5a3c }));
  K.add('flat', H.part(new THREE.ConeGeometry(0.8, h * 0.45, 6), { x, y: 1.1 + h * 0.62, z, color: 0x264a32 }));
}
export function lamp(K, H, x, z, h = 3.6) {
  K.add('flat', H.cyl(0.07, 0.09, h, 5, { x, y: h / 2, z, color: 0x3a4044 }));
  K.add('glow', H.box(0.36, 0.22, 0.36, { x, y: h + 0.1, z, color: 0xf4f0d6 }));
}
// a low railing round a rect top (posts + a rail), on the faces listed
export function railing(K, H, w, d, faces = [0, 1, 2, 3], col = 0x5a6064, hgt = 1.0) {
  const F = H.faces(w, d);
  for (const i of faces) {
    const f = F[i];
    K.add('flat', H.box(f.tx ? f.width : 0.06, 0.06, f.tz ? f.width : 0.06, { x: f.nx * (f.half - 0.05), y: hgt, z: f.nz * (f.half - 0.05), color: col }));
    for (let k = 0; k <= Math.floor(f.width / 2); k++) {
      const off = -f.width / 2 + k * (f.width / Math.max(1, Math.floor(f.width / 2)));
      K.add('flat', H.box(0.06, hgt, 0.06, { x: f.nx * (f.half - 0.05) + f.tx * off, y: hgt / 2, z: f.nz * (f.half - 0.05) + f.tz * off, color: col }));
    }
  }
}
// slab body: concrete sides down to `depth`, a moss line at the water
export function slab(K, H, p, color = CONCRETE, depth = p.thick) {
  const g = H.meterBox(p.w, depth, p.d, 6, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color });
  g.translate(0, -depth / 2, 0);
  K.add('concrete', g);
}

// ------------------------------------------------------------------ stage 1: Seattle Center
export function seaPlaza(K, p, th, rng, H) {
  const { w, d } = p;
  slab(K, H, p);
  for (let x = -w / 2 + 4; x < w / 2 - 1; x += 4) K.add('flat', H.box(0.08, 0.02, d - 0.6, { x, y: 0.012, color: 0x7a8078 }));
  for (let z = -d / 2 + 4; z < d / 2 - 1; z += 4) K.add('flat', H.box(w - 0.6, 0.02, 0.08, { y: 0.012, z, color: 0x7a8078 }));
  for (let i = 0; i < 5; i++) K.add('flat', H.box(1.5 + rng() * 3, 0.02, 1 + rng() * 2.5, { x: (rng() - 0.5) * (w - 6), y: 0.02, z: (rng() - 0.5) * (d - 6), ry: rng(), color: 0x6c7e84 })); // puddles
  for (const f of H.faces(w, d)) K.add('neon', H.box(f.tx ? f.width : 0.12, 0.12, f.tz ? f.width : 0.12, { x: f.nx * (f.half + 0.04), y: -0.45, z: f.nz * (f.half + 0.04), color: EMERALD }));
  K.add('flat', H.box(w + 0.08, 0.7, d + 0.08, { y: -p.h + 0.25, color: 0x3c4c40 })); // moss at the waterline
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tree(K, H, sx * (w / 2 - 1.3), sz * (d / 2 - 1.3), 4 + rng() * 1.5);
  for (let z = -d / 2 + 6; z < d / 2 - 4; z += 8) { lamp(K, H, -w / 2 + 0.6, z); lamp(K, H, w / 2 - 0.6, z); }
}

export function seaKiosk(K, p, th, rng, H) {
  const { w, d, thick } = p, cols = [0x2f7a5a, 0xc8483a, 0x2a6a8a, 0xd8b070], col = cols[(p.tint >= 0 ? p.tint : 0) % 4];
  K.add('flat', H.box(w, 0.16, d, { y: -0.08, color: 0xe6e2d6 }));
  K.add('flat', H.box(w * 0.84, thick * 0.62, d * 0.84, { y: -0.2 - thick * 0.31, color: col }));
  K.add('flat', H.box(w * 0.6, thick * 0.3, 0.05, { y: -thick * 0.42, z: d * 0.42 + 0.01, color: 0x1a2024 })); // service hatch
  K.add('glow', H.box(w * 0.6, 0.08, 0.06, { y: -thick * 0.25, z: d * 0.42 + 0.03, color: 0xfff0c0 }));
  for (const f of H.faces(w, d)) { // striped awning skirt under the counter
    const n = 4;
    for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * (f.width / n);
      K.add('flat', H.box(f.tx ? f.width / n : 0.08, 0.34, f.tz ? f.width / n : 0.08, { x: f.nx * (f.half + 0.02) + f.tx * off, y: -0.36, z: f.nz * (f.half + 0.02) + f.tz * off, color: k % 2 ? 0xf2efe6 : col }));
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    K.add('flat', H.cyl(0.22, 0.28, 0.3, 6, { x: sx * w * 0.3, y: -thick - 0.1, z: sz * d * 0.3, color: DARK }));
    K.add('glow', H.cyl(0.2, 0.2, 0.04, 6, { x: sx * w * 0.3, y: -thick - 0.27, z: sz * d * 0.3, color: 0x7ff6d0 }));
  }
}

export function monoStation(K, p, th, rng, H) {
  const { w, d, thick } = p;
  const g = H.meterBox(w, 1.4, d, 4, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: 0xa8aca4 }); g.translate(0, -0.7, 0); K.add('concrete', g);
  for (const sz of [-1, 1]) K.add('hazard', H.box(w - 0.2, 0.03, 0.5, { y: 0.015, z: sz * (d / 2 - 0.3) }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('flat', H.box(1, thick - 1.4, 1, { x: sx * (w / 2 - 1.2), y: -1.4 - (thick - 1.4) / 2, z: sz * (d / 2 - 1.5), color: 0x7a7e78 }));
  K.add('flat', H.box(w - 1, 0.6, 1, { y: -1.7, z: 0, color: 0x6a6e68 }));
  // the station sign on two posts at an edge you don't jump from, lettered in emerald
  const west = (p.tint || 0) === 0, name = west ? 'WESTLAKE' : 'CENTER';
  const sign = (x, z, ry) => {
    const c = Math.cos(ry), s = Math.sin(ry);
    for (const u of [-2.4, 2.4]) K.add('flat', H.box(0.12, 2.8, 0.12, { x: x + u * c, y: 1.4, z: z - u * s, color: STEEL }));
    K.add('flat', H.box(5.6, 0.9, 0.16, { x, y: 3.0, z, ry, color: 0x1c2226 }));
    K.add('glow', ...text(name, { px: 0.1, depth: 0.04, x: x + s * 0.1, y: 3.0, z: z + c * 0.1, ry, color: EMERALD }));
    K.add('glow', ...text(name, { px: 0.1, depth: 0.04, x: x - s * 0.1, y: 3.0, z: z - c * 0.1, ry: ry + Math.PI, color: EMERALD }));
  };
  if (west) sign(w / 2 - 0.3, 2, Math.PI / 2); else sign(0, -d / 2 + 0.3, 0);
  for (const z of [-4, 4]) K.add('flat', H.box(0.5, 0.45, 1.8, { x: -w / 2 + 0.6, y: 0.22, z, color: 0x4a6a58 })); // benches
  lamp(K, H, -w / 2 + 0.4, -d / 2 + 0.4, 3); lamp(K, H, -w / 2 + 0.4, d / 2 - 0.4, 3);
}

export function monoBeam(K, p, th, rng, H) {
  const { w, d, thick } = p;
  const g = H.meterBox(w, thick, d, 4, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: 0xc4c8c0 }); g.translate(0, -thick / 2, 0); K.add('concrete', g);
  for (const sx of [-1, 1]) K.add('flat', H.box(0.1, 0.05, d, { x: sx * (w / 2 - 0.1), y: 0.02, color: 0x5a5e5a }));
  const down = p.h + 1; // to the water and below
  for (let z = -d / 2 + 6; z < d / 2; z += 12) {
    K.add('flat', H.box(1.3, down - thick, 1.6, { y: -thick - (down - thick) / 2, z, color: 0xa4a8a0 }));
    K.add('flat', H.box(3.4, 0.9, 1.8, { y: -thick - 0.45, z, color: 0x9a9e96 }));
  }
}

export function monorail(K, p, th, rng, H) {
  const { w, d } = p, L = d * 0.82;
  K.add('flat', H.box(w * 0.96, 0.14, L, { y: -0.07, color: 0xdedfdc })); // roof (you stand here)
  K.add('flat', H.box(w, 1.2, L, { y: -0.74, color: 0xc4c8cc }));
  K.add('glass', H.box(w + 0.05, 0.62, L - 0.6, { y: -0.92 }));
  K.add('flat', H.box(w + 0.04, 1.1, L, { y: -1.88, color: 0xc0302c }));
  K.add('flat', H.box(w + 0.07, 0.14, L, { y: -1.38, color: 0xe8b03a }));
  K.add('flat', H.box(w * 0.86, 1.5, L - 0.4, { y: -3.15, color: 0x2a4a8a })); // the skirt that straddles the beam
  K.add('flat', H.box(w + 0.06, 0.06, 0.12, { y: -1.0, color: 0x1a1c20 })); // the gap between the two cars
  for (const sz of [-1, 1]) { // streamlined noses
    const z0 = sz * L / 2;
    K.add('flat', H.box(w * 0.92, 2.3, 1.4, { y: -1.2, z: z0 + sz * 0.55, rx: sz * 0.42, color: 0xc0302c }));
    K.add('flat', H.box(w * 0.8, 0.9, 1.2, { y: -0.45, z: z0 + sz * 0.45, rx: sz * 0.62, color: 0xc4c8cc }));
    K.add('glass', H.box(w * 0.7, 0.5, 0.1, { y: -0.7, z: z0 + sz * 0.95, rx: sz * 0.62 }));
    for (const sx of [-1, 1]) K.add('glow', H.box(0.36, 0.2, 0.1, { x: sx * w * 0.3, y: -1.6, z: z0 + sz * 1.22, color: sz < 0 ? 0xfff6d8 : 0xff3a3a }));
  }
  for (const sx of [-1, 1]) K.add('glow', ...text('MONORAIL', { px: 0.13, depth: 0.04, x: sx * (w / 2 + 0.03), y: -2.05, z: 0, ry: sx * Math.PI / 2, color: 0xfff2d0 }));
}

const BLOB = [0x7a4fb8, 0xd8a838, 0xc83a3a, 0x8aa8c8, 0xc84a9a];
// A faceted blob (an icosphere squashed to rx × ry × rz, turned), sliced flat at y = cut.
export function blob(H, rx, ry, rz, o, cut = -0.06) {
  const g = H.part(new THREE.IcosahedronGeometry(1, 1), { ...o, sx: rx, sy: ry, sz: rz });
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) > cut) pos.setY(i, cut);
  return g;
}
const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();
const tintTo = (c, c2, k) => new THREE.Color(c).lerp(new THREE.Color(c2), k).getHex();
// MoPOP: Gehry's crumpled sheet-metal blobs. A stalk into the water, a squashed cap sliced flat where
// you stand, lumps of the neighbouring colours bulging off its sides, and ribbons curling round it.
export function mopop(K, p, th, rng, H) {
  const r = p.r, t = p.tint >= 0 ? p.tint : 0, col = BLOB[t % 5], n = H.seg(18, 11);
  K.add('flat', lathe([[r * 0.8, -2.4], [r * 0.62, -Math.max(3, p.thick * 0.55)], [r * 0.74, -p.thick]], n, { color: shade(col, 0.78) }));
  K.add('flat', blob(H, r * 1.12, 3.2, r * 1.12, { y: -1.15, ry: rng() * 3, color: col }));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + rng() * 1.2, c = BLOB[(t + 1 + k) % 5], y = -2.4 - rng() * Math.max(1, p.thick * 0.35);
    K.add('flat', blob(H, r * (0.5 + rng() * 0.25), 1.6 + rng() * 1.8, r * (0.4 + rng() * 0.2), { x: Math.cos(a) * r * 0.75, y, z: Math.sin(a) * r * 0.75, ry: -a, rz: (rng() - 0.5) * 0.9, color: c }, -0.4));
  }
  K.add('flat', circle(H, r * 0.99, 0.004, tintTo(col, 0xffffff, 0.3), 18));
  K.add('flat', ring(H, r * 0.6, r * 0.66, 0.012, shade(col, 0.6), 18));
  for (let k = 0; k < 2; k++) { // ribbons of sheet metal curling off the hull
    const a = rng() * TAU, c = BLOB[(t + 3 + k) % 5];
    K.add('flat', H.part(new THREE.TorusGeometry(r * (1.0 + rng() * 0.25), 0.32, 3, H.seg(12, 7), Math.PI * (0.5 + rng() * 0.3)), { x: Math.cos(a) * r * 0.2, y: -1.4 - rng() * 1.5, z: Math.sin(a) * r * 0.2, ry: a, rx: 0.5 + rng() * 0.6, color: c }));
  }
}

export function fountain(K, p, th, rng, H) {
  const r = p.r, n = 40;
  K.add('flat', H.cyl(r, r * 1.02, p.thick, H.seg(n, 20), { y: -p.thick / 2, color: 0xa8aca4 }));
  K.add('flat', circle(H, r, 0.004, 0xc6c9c0, n));
  for (const [a, b, c] of [[r * 0.92, r, 0x6e8a7a], [r * 0.48, r * 0.54, 0x8a8e88], [r * 0.7, r * 0.72, 0x8a8e88]]) K.add('flat', ring(H, a, b, 0.01, c, n));
  for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; K.add('flat', H.box(r * 0.36, 0.02, 0.08, { x: Math.cos(a) * r * 0.74, y: 0.012, z: Math.sin(a) * r * 0.74, ry: -a, color: 0x8a8e88 })); }
  K.add('neon', torus(H, r + 0.02, 0.08, { y: -0.5, color: EMERALD }));
}
export function fountainDome(K, p, th, rng, H) {
  const r = p.r;
  K.add('flat', lathe([[r * 0.72, 0], [r * 0.9, -0.6], [r, -1.4], [r * 1.03, -p.thick]], H.seg(20, 12), { color: 0xd2d8de }));
  K.add('flat', circle(H, r * 0.72, 0.004, 0xc0c8d0, 20));
  for (let k = 0; k < 10; k++) { // nozzles and their jets (a frozen moment of the show)
    const a = (k / 10) * TAU, x = Math.cos(a) * r * 0.95, z = Math.sin(a) * r * 0.95;
    K.add('flat', H.cyl(0.12, 0.12, 0.3, 5, { x, y: -1.2, z, color: 0x4a5058 }));
    const h = 1.0 + (k % 3) * 0.5;
    K.add('glow', H.part(new THREE.ConeGeometry(0.32, h, 5), { x: x * 1.12, y: -1.2 + h / 2, z: z * 1.12, rx: Math.PI, color: 0xd8eef8 }));
  }
}

// ------------------------------------------------------------------ the Space Needle
// Leg pairs (azimuths, degrees from +x toward +z) and the shape of the hourglass, in world heights:
// foot on the base (3 m), the waist (22 m), under the saucer (49 m).
const LEGS = [90, 210, 330];
export function needleBase(K, p, th, rng, H) {
  const r = p.r, n = 40;
  K.add('flat', H.cyl(r, r, p.thick, H.seg(n, 20), { y: -p.thick / 2, color: 0x8a8e88 }));
  K.add('glass', H.cyl(r + 0.06, r + 0.06, 1.3, H.seg(n, 20), { y: -1.5 }));
  K.add('flat', circle(H, r, 0.004, 0xbcbeb6, n));
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; K.add('flat', H.box(r * 0.7, 0.02, 0.1, { x: Math.cos(a) * r * 0.55, y: 0.012, z: Math.sin(a) * r * 0.55, ry: -a, color: 0x7e827c })); }
  K.add('neon', ring(H, r - 0.5, r - 0.3, 0.014, EMERALD, n));
  for (const L of LEGS) for (const s of [-6, 6]) { const a = (L + s) * D2R; K.add('flat', H.box(1.3, 0.7, 1.3, { x: Math.cos(a) * 10, y: 0.35, z: Math.sin(a) * 10, ry: -a, color: 0x5a5e5c })); }
}
export function needleCore(K, p, th, rng, H) {
  const r = p.r, top = p.h, Y = (yw) => yw - top; // world height → local
  K.add('flat', H.cyl(r, r, p.thick, H.seg(16, 10), { y: -p.thick / 2, color: 0xd6d8d2 }));
  for (let yw = 8; yw < top; yw += 6) K.add('flat', H.cyl(r + 0.04, r + 0.04, 0.3, H.seg(16, 10), { y: Y(yw), color: 0xa8aaa4 }));
  for (const z of [-0.6, 0.6]) K.add('flat', H.box(0.12, 19, 0.12, { x: r + 0.08, y: Y(12.9), z, color: 0xffcc1a })); // lift guides
  const col = 0xeceee8;
  for (const L of LEGS) {
    for (const s of [-1, 1]) {
      const pt = (rad, yw, spread) => { const a = (L + s * spread) * D2R; return [Math.cos(a) * rad, Y(yw), Math.sin(a) * rad]; };
      K.add('flat', ...struts([pt(10, 3.4, 6), pt(6.4, 11, 8), pt(3.2, 22, 14), pt(4.8, 33, 9), pt(7.6, 43, 7), pt(9.6, 49.2, 6)], 0.75, col));
    }
    // cross braces between the pair
    for (const [rad, yw, sp] of [[8.4, 6.5, 7], [4.4, 16, 11], [4.4, 28, 11], [7.2, 41.5, 7]]) {
      const a0 = (L - sp) * D2R, a1 = (L + sp) * D2R;
      K.add('flat', strut([Math.cos(a0) * rad, Y(yw), Math.sin(a0) * rad], [Math.cos(a1) * rad, Y(yw), Math.sin(a1) * rad], 0.3, 0xc8cac4));
    }
  }
}
export function needleRing(K, p, th, rng, H) {
  const r = p.r, n = 28;
  K.add('flat', H.cyl(r, r * 0.98, p.thick, H.seg(n, 16), { y: -p.thick / 2, color: 0xb8bab4 }));
  K.add('flat', circle(H, r, 0.004, 0x9ea4a0, n));
  K.add('flat', ring(H, r - 0.6, r - 0.45, 0.01, 0xffcc1a, n));
  K.add('neon', torus(H, r + 0.03, 0.07, { y: -p.thick + 0.1, color: EMERALD }));
  for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU; K.add('flat', H.box(0.06, 1, 0.06, { x: Math.cos(a) * (r - 0.12), y: 0.5, z: Math.sin(a) * (r - 0.12), color: STEEL })); }
  K.add('flat', torus(H, r - 0.12, 0.04, { y: 1.0, color: STEEL }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; K.add('flat', strut([Math.cos(a) * (r - 0.4), -p.thick, Math.sin(a) * (r - 0.4)], [Math.cos(a) * 2.7, -p.thick - 3, Math.sin(a) * 2.7], 0.22, 0x9a9c96)); }
}
export function needleLift(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, thick, d, { y: -thick / 2, color: 0x3a3e44 }));
  K.add('hazard', H.box(w, 0.03, 0.3, { y: 0.015, z: -d / 2 + 0.15 }), H.box(w, 0.03, 0.3, { y: 0.015, z: d / 2 - 0.15 }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    K.add('flat', H.box(0.1, 1.1, 0.1, { x: sx * (w / 2 - 0.05), y: 0.55, z: sz * (d / 2 - 0.05), color: 0xffcc1a }));
    K.add('glow', H.box(0.18, 0.18, 0.18, { x: sx * (w / 2 - 0.05), y: 1.15, z: sz * (d / 2 - 0.05), color: 0xffb02b }));
  }
  K.add('flat', H.box(0.06, 0.06, d, { x: w / 2 - 0.05, y: 1.1, color: 0xffcc1a }));
  K.add('glow', H.cyl(0.8, 0.8, 0.05, 8, { y: -thick - 0.03, color: 0x7ff6d0 }));
}
export function needlePad(K, p, th, rng, H) {
  H.deck(K, p, th);
  K.add('neon', torus(H, p.r + 0.02, 0.06, { y: -0.25, color: EMERALD }));
  K.add('flat', H.cyl(0.3, 0.45, 0.5, 6, { y: -p.thick - 0.45, color: DARK }));
  K.add('glow', H.cyl(0.32, 0.32, 0.04, 6, { y: -p.thick - 0.72, color: 0x7ff6d0 }));
}
export function needleSaucer(K, p, th, rng, H) {
  const r = p.r, n = 48;
  K.add('flat', circle(H, r, 0.004, 0xc6cac4, n));
  for (const rr of [r * 0.45, r * 0.75]) K.add('flat', ring(H, rr, rr + 0.12, 0.01, 0x8e928c, n));
  for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; K.add('flat', H.box(r * 0.5, 0.02, 0.07, { x: Math.cos(a) * r * 0.72, y: 0.012, z: Math.sin(a) * r * 0.72, ry: -a, color: 0x9a9e98 })); }
  K.add('flat', lathe([[r, 0], [r + 0.35, -0.5], [r + 0.6, -1.5], [r + 0.3, -2.4], [r - 0.6, -3.1], [r * 0.5, -p.thick]], H.seg(n, 20), { color: 0xc0c4be }));
  K.add('glass', H.cyl(r + 0.5, r + 0.62, 0.8, H.seg(n, 20), { y: -1.95 }));
  for (let k = 0; k < 36; k++) { // the halo ribs flaring under the rim, and the rim lights
    const a = (k / 36) * TAU, c = Math.cos(a), s = Math.sin(a);
    K.add('flat', strut([c * r * 0.55, -p.thick - 0.2, s * r * 0.55], [c * (r + 1.0), -0.8, s * (r + 1.0)], 0.16, 0xe2e4de));
    if (k % 2 === 0) K.add('glow', H.box(0.2, 0.14, 0.2, { x: c * (r + 0.36), y: -0.45, z: s * (r + 0.36), color: k % 6 === 0 ? 0xff4a3a : 0xf4f6e8 }));
  }
  for (let k = 0; k < 40; k++) { const a = (k / 40) * TAU; K.add('flat', H.box(0.06, 1, 0.06, { x: Math.cos(a) * (r - 0.2), y: 0.5, z: Math.sin(a) * (r - 0.2), color: STEEL })); }
  K.add('flat', torus(H, r - 0.2, 0.05, { y: 1.0, color: STEEL }));
  K.add('neon', torus(H, r + 0.62, 0.09, { y: -1.5, color: EMERALD }));
}
export function needleCap(K, p, th, rng, H) {
  const r = p.r;
  K.add('flat', lathe([[r * 0.86, 0], [r, -0.6], [r * 1.06, -2.4], [r, -p.thick]], H.seg(28, 14), { color: 0xd2d4ce }));
  K.add('flat', circle(H, r * 0.86, 0.004, 0xb4b8b2, 24));
  K.add('flat', H.cyl(0.08, 0.36, 16, 6, { y: 8, color: 0xdadad4 }));
  K.add('flat', H.cyl(0.5, 0.6, 0.6, 6, { y: 0.3, color: STEEL }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 16.2, color: 0xff2a2a }));
  for (const a of [0.6, 2.7, 4.6]) K.add('glow', H.box(0.2, 0.2, 0.2, { x: Math.cos(a) * r * 0.8, y: 0.15, z: Math.sin(a) * r * 0.8, color: 0xff3a3a }));
}

export function glasshouse(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, 1.2, d, { y: -thick + 0.6, color: 0x8a8e88 }));
  K.add('glass', H.box(w - 0.1, thick - 1.3, d - 0.1, { y: -(thick - 1.2) / 2 - 0.05 }));
  K.add('glass', H.box(w, 0.12, d, { y: -0.06 }));
  for (let x = -w / 2; x <= w / 2 + 0.01; x += 2) for (const sz of [-1, 1]) K.add('flat', H.box(0.08, thick - 1.2, 0.08, { x, y: -(thick - 1.2) / 2, z: sz * d / 2, color: 0x2a3034 }));
  for (let z = -d / 2; z <= d / 2 + 0.01; z += 2) for (const sx of [-1, 1]) K.add('flat', H.box(0.08, thick - 1.2, 0.08, { x: sx * w / 2, y: -(thick - 1.2) / 2, z, color: 0x2a3034 }));
  for (let x = -w / 2 + 2; x < w / 2; x += 2) K.add('flat', H.box(0.06, 0.03, d, { x, y: 0.02, color: 0x2a3034 }));
  K.add('flat', H.box(w, 0.08, 0.08, { y: -2.4, z: d / 2, color: 0x2a3034 }), H.box(w, 0.08, 0.08, { y: -2.4, z: -d / 2, color: 0x2a3034 }));
  const GLASS = [0xff5a2a, 0x2be8ff, 0xffd23a, 0xff2bd6, 0x7bff4a];
  for (let k = 0; k < 9; k++) { // the glass garden round the house: blown-glass blooms on stalks
    const a = (k / 9) * TAU, x = Math.cos(a) * (w / 2 + 1.4), z = Math.sin(a) * (d / 2 + 1.4), hgt = 1.5 + rng() * 2.5, c = GLASS[k % 5];
    K.add('flat', H.cyl(0.06, 0.1, hgt, 4, { x, y: -thick + 1.2 + hgt / 2, z, color: 0x2a4a32 }));
    K.add('glow', H.part(new THREE.IcosahedronGeometry(0.45 + rng() * 0.3, 0), { x, y: -thick + 1.2 + hgt, z, color: c }));
  }
}

export function arenaRoof(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, 1.2, d, { y: -0.6, color: 0xa4aaa6 }));
  for (let x = -w / 2 + 2; x < w / 2; x += 2.6) K.add('flat', H.box(0.06, 0.02, d - 0.4, { x, y: 0.012, color: 0x7e8480 }));
  K.add('flat', H.box(w + 0.6, 0.5, d + 0.6, { y: -1.0, color: 0x3a4046 })); // fascia
  K.add('glass', H.box(w - 2, thick - 1.4, d - 2, { y: -1.2 - (thick - 1.4) / 2 }));
  for (let x = -w / 2 + 1; x <= w / 2 - 1; x += 2.4) for (const sz of [-1, 1]) K.add('flat', H.box(0.1, thick - 1.4, 0.1, { x, y: -1.2 - (thick - 1.4) / 2, z: sz * (d / 2 - 1), color: 0x2a3034 }));
  for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('flat', H.box(4, 0.4, 1.2, { x: sx * (w / 2 - 1), y: 0.9, z: sz * (d / 2 + 0.2), rz: sx * 0.35, color: 0x3a4046 })); // the swooping corners
  K.add('glow', ...text('OFFSET ARENA', { px: 0.34, depth: 0.06, x: 0, y: -1.0, z: d / 2 + 0.33, color: EMERALD }));
  K.add('glow', ...text('NET ZERO*', { px: 0.2, depth: 0.06, x: 0, y: -3.0, z: d / 2 - 0.9, color: 0xe8f4ec }));
  K.add('flat', H.box(w + 0.1, 0.7, d + 0.1, { y: -p.h + 0.25, color: 0x3c4c40 }));
}
