// SHANGHAI platform styles (render only). Each builds one platform's pieces into Kit K, in its local
// frame: origin at the centre, y = 0 at the top you stand on, footprint p.w × p.d (rect) or p.r (disc).
// Flat-shaded vertex colours, a few unlit lamps and neon lines; static ones get merged.
import * as THREE from 'three';
import { adUV } from '../ads.js';
import { SIGN_COLS } from '../textures.js';

const _c = new THREE.Color();
const shade = (hex, k) => _c.set(hex).multiplyScalar(k).getHex();
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ the Bund (stage 1)
const STONE = ['#d9c7a3', '#cbb894', '#e2d4b6', '#bfa982', '#d4bf98', '#c9b28c', '#c2b49a', '#d8cbb0'];
const COPPER = '#5fae96', COPPER_DK = '#3d8572', COPPER_HI = '#94d6bd', GOLD = '#e8b440';

// A row of windows on every face of a w × d block, floors every `step` m from y0 down to y1.
function windows(K, H, w, d, y0, y1, rng, litK, o = {}) {
  const step = o.step ?? 3.6, ww = o.ww ?? 1.3, wh = o.wh ?? 2.0, bay = o.bay ?? 3.2;
  for (const f of H.faces(w, d)) {
    const n = Math.max(1, Math.floor(f.width / bay));
    for (let y = y0; y > y1; y -= step) for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * f.width / n, lit = rng() < litK;
      K.add(lit ? 'glow' : 'flat', H.box(f.tx ? ww : 0.14, wh, f.tz ? ww : 0.14, { x: f.nx * (f.half + 0.04) + f.tx * off, y, z: f.nz * (f.half + 0.04) + f.tz * off, color: lit ? (rng() < 0.7 ? '#ffd28a' : '#fff0c8') : (o.dark ?? '#3a3226') }));
    }
  }
}
// A low balustrade round a w × d top (posts and a rail), inset a little.
function balustrade(K, H, w, d, color, h = 0.55, every = 1.1) {
  for (const f of H.faces(w, d)) {
    const n = Math.max(1, Math.round(f.width / every)), x0 = f.nx * (f.half - 0.12), z0 = f.nz * (f.half - 0.12);
    K.add('flat', H.box(f.tx ? f.width : 0.16, 0.12, f.tz ? f.width : 0.16, { x: x0, y: h, z: z0, color }));
    for (let k = 0; k <= n; k++) { const off = -f.width / 2 + k * f.width / n; K.add('flat', H.box(0.12, h, 0.12, { x: x0 + f.tx * off, y: h / 2, z: z0 + f.tz * off, color })); }
  }
}

function bund(K, p, th, rng, H) {
  const { w, d, thick: T } = p, t = p.tint >= 0 ? p.tint : 0, stone = STONE[t % STONE.length];
  const wl = -p.h; // the waterline, in the platform's frame
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: stone }));
  K.add('flat', H.box(w + 0.3, 3.2, d + 0.3, { y: wl + 1.2, color: shade(stone, 0.62) })); // rusticated base, flood-stained
  K.add('flat', H.box(w + 0.32, 0.25, d + 0.32, { y: wl + 0.2, color: '#3a4a3a' }));
  K.add('flat', H.box(w + 0.9, 0.55, d + 0.9, { y: -0.75, color: shade(stone, 1.12) })); // cornice
  K.add('flat', H.box(w + 0.5, 0.3, d + 0.5, { y: -1.2, color: shade(stone, 0.7) }));
  K.add('flat', H.box(w + 0.4, 0.35, d + 0.4, { y: -4.6, color: shade(stone, 1.05) })); // string course
  balustrade(K, H, w, d, shade(stone, 1.1));
  windows(K, H, w, d, -2.7, wl + 3.5, rng, 0.18 + (th.night || 0) * 0.6);
  // engaged columns on the wide faces: a two-storey colonnade under the cornice
  for (const f of H.faces(w, d)) {
    if (f.width < 12) continue;
    const n = Math.floor(f.width / 2.6);
    for (let k = 1; k < n; k++) {
      const off = -f.width / 2 + k * f.width / n, x = f.nx * (f.half + 0.12) + f.tx * off, z = f.nz * (f.half + 0.12) + f.tz * off;
      K.add('flat', H.cyl(0.32, 0.36, 6.4, 6, { x, y: -5.1, z, color: shade(stone, 1.15) }), H.box(0.9, 0.35, 0.9, { x, y: -1.75, z, color: shade(stone, 1.2) }));
    }
  }
  // a doorway and a flagpole on the biggest ones
  if (w * d > 300) {
    const f = H.faces(w, d)[2];
    K.add('flat', H.box(0.2, 3.4, 3, { x: f.nx * (f.half + 0.05), y: wl + 4.8, color: '#2a221a' }));
    K.add('flat', H.cyl(0.07, 0.07, 6, 4, { x: -w / 2 + 1, y: 3, z: -d / 2 + 1, color: '#3a3a3a' }));
    K.add('glow', H.box(1.6, 1, 0.05, { x: -w / 2 + 1.85, y: 5.4, z: -d / 2 + 1, color: '#e0303a' }));
  }
}

function portico(K, p, th, rng, H) {
  const { w, d, thick: T } = p, stone = STONE[2], wl = -p.h;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: shade(stone, 0.92) }));
  K.add('flat', H.box(w + 0.6, 0.5, d + 0.6, { y: -0.6, color: shade(stone, 1.15) }));
  K.add('flat', H.box(w + 0.35, 0.3, d + 0.35, { y: -1.05, color: shade(stone, 0.75) }));
  balustrade(K, H, w, d, shade(stone, 1.1));
  // columns across the front (+x, toward the promenade) and a dark doorway between them
  const n = Math.max(2, Math.floor(d / 2.4)), colH = -1.2 - (wl + 1);
  for (let k = 0; k <= n; k++) {
    const z = -d / 2 + 0.5 + k * (d - 1) / n;
    K.add('flat', H.cyl(0.34, 0.4, colH, 8, { x: w / 2 + 0.1, y: wl + 1 + colH / 2, z, color: '#f0e6d0' }), H.box(0.95, 0.35, 0.95, { x: w / 2 + 0.1, y: -1.4, z, color: '#f4ecdc' }));
  }
  K.add('flat', H.box(0.15, colH - 1.5, d - 2, { x: w / 2 + 0.03, y: wl + 1 + (colH - 1.5) / 2, color: '#3a2e22' }));
  K.add('flat', H.box(w + 0.3, 1.6, d + 0.3, { y: wl + 0.6, color: shade(stone, 0.6) }));
}

// The copper dome: a columned stone drum, copper tiers (each flaring out a little) and a lantern.
function copperDrum(K, p, th, rng, H) {
  const r = p.r, T = p.thick, n = H.seg(20, 14);
  K.add('flat', H.cyl(r, r, T, n, { y: -T / 2, color: STONE[2] }));
  K.add('flat', H.cyl(r + 0.25, r + 0.25, 0.4, n, { y: -0.2, color: COPPER }));
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; K.add('flat', H.cyl(0.22, 0.25, T - 0.4, 5, { x: Math.cos(a) * (r + 0.15), y: -T / 2 - 0.2, z: Math.sin(a) * (r + 0.15), color: '#f2e8d4' })); }
  for (let k = 0; k < 14; k++) { const a = (k + 0.5) / 14 * TAU; K.add('glow', H.box(0.7, 1.4, 0.7, { x: Math.cos(a) * (r - 0.25), y: -T / 2 - 0.2, z: Math.sin(a) * (r - 0.25), color: '#ffd28a' })); }
}
function copperDome(K, p, th, rng, H) {
  const r = p.r, T = p.thick, n = H.seg(20, 14);
  K.add('flat', H.cyl(r, r + 0.7, T, n, { y: -T / 2, color: p.tint === 1 ? COPPER_DK : COPPER }));
  K.add('flat', H.cyl(r + 0.08, r + 0.08, 0.18, n, { y: -0.09, color: COPPER_HI }));
  const ribs = Math.round(r * 2.2);
  for (let k = 0; k < ribs; k++) { const a = k / ribs * TAU; K.add('flat', H.box(0.16, T, 0.2, { x: Math.cos(a) * (r + 0.36), y: -T / 2, z: Math.sin(a) * (r + 0.36), ry: -a, rz: 0.19 * Math.cos(0), color: GOLD })); }
}
function copperLantern(K, p, th, rng, H) {
  const r = p.r, T = p.thick;
  K.add('flat', H.cyl(r + 0.3, r + 0.5, 0.5, 10, { y: -0.25, color: COPPER_DK }));
  K.add('glow', H.cyl(r - 0.6, r - 0.6, T - 0.5, 8, { y: -T / 2 - 0.25, color: '#ffe6a0' }));
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; K.add('flat', H.cyl(0.14, 0.14, T - 0.5, 4, { x: Math.cos(a) * (r - 0.25), y: -T / 2 - 0.25, z: Math.sin(a) * (r - 0.25), color: '#f4ecdc' })); }
  K.add('flat', H.cyl(r + 0.2, r + 0.2, 0.3, 10, { y: -T + 0.15, color: COPPER }));
}

function clockTower(K, p, th, rng, H) {
  const { w, d, thick: T } = p, stone = STONE[0];
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: stone }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    K.add('flat', H.box(1.2, T, 1.2, { x: sx * (w / 2 - 0.3), y: -T / 2, z: sz * (d / 2 - 0.3), color: shade(stone, 1.12) })); // corner piers
    K.add('flat', H.cyl(0.05, 0.35, 1.6, 4, { x: sx * (w / 2 - 0.4), y: 0.8, z: sz * (d / 2 - 0.4), color: COPPER })); // little copper pinnacles
    K.add('glow', H.box(0.2, 0.2, 0.2, { x: sx * (w / 2 - 0.4), y: 1.7, z: sz * (d / 2 - 0.4), color: '#ff3a2a' }));
  }
  K.add('flat', H.box(w + 0.8, 0.6, d + 0.8, { y: -0.6, color: shade(stone, 1.15) }), H.box(w + 0.5, 0.4, d + 0.5, { y: -9.6, color: shade(stone, 1.1) }));
  for (const f of H.faces(w, d)) {
    // the clock: a lit face, a gold ring, two hands (it's always 6:40)
    const cx = f.nx * (f.half + 0.12), cz = f.nz * (f.half + 0.12);
    K.add('glow', H.part(new THREE.CircleGeometry(2.2, H.seg(20, 12)), { x: cx, y: -4.6, z: cz, ry: f.ry, color: '#fff2cc' }));
    K.add('flat', H.part(new THREE.TorusGeometry(2.3, 0.2, 4, H.seg(20, 12)), { x: f.nx * (f.half + 0.15), y: -4.6, z: f.nz * (f.half + 0.15), ry: f.ry, color: GOLD }));
    const hx = f.nx * (f.half + 0.2), hz = f.nz * (f.half + 0.2);
    K.add('flat', H.box(f.tx ? 0.16 : 0.06, 1.7, f.tz ? 0.16 : 0.06, { x: hx + f.tx * 0.55, y: -4.6 - 0.55, z: hz + f.tz * 0.55, rx: f.tz ? 0.9 : 0, rz: f.tx ? -0.9 : 0, color: '#1a1a1a' }));
    K.add('flat', H.box(f.tx ? 0.16 : 0.06, 1.3, f.tz ? 0.16 : 0.06, { x: hx, y: -4.6 + 0.6, z: hz, color: '#1a1a1a' }));
    // belfry arches and slit windows down the shaft
    for (const off of [-2, 0, 2]) K.add('flat', H.box(f.tx ? 1.1 : 0.14, 2.6, f.tz ? 1.1 : 0.14, { x: f.nx * (f.half + 0.04) + f.tx * off, y: -8, z: f.nz * (f.half + 0.04) + f.tz * off, color: '#241c14' }));
    for (let y = -12; y > -T + 1; y -= 3.2) K.add(rng() < 0.3 ? 'glow' : 'flat', H.box(f.tx ? 0.8 : 0.14, 1.8, f.tz ? 0.8 : 0.14, { x: f.nx * (f.half + 0.04), y, z: f.nz * (f.half + 0.04), color: rng() < 0.3 ? '#ffd28a' : '#3a3226' }));
  }
  balustrade(K, H, w, d, shade(stone, 1.1), 0.6, 1.0);
}

function bundLedge(K, p, th, rng, H) {
  const { w, d, thick: T } = p, stone = STONE[2];
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: shade(stone, 1.05) }), H.box(w + 0.15, 0.12, d + 0.15, { y: -0.06, color: GOLD }));
  const long = w > d, n = Math.floor((long ? w : d) / 1.2);
  for (let k = 0; k <= n; k++) { const o = -(long ? w : d) / 2 + k * (long ? w : d) / n; K.add('flat', H.box(long ? 0.3 : w * 0.7, 0.8, long ? d * 0.7 : 0.3, { x: long ? o : 0, y: -T - 0.4, z: long ? 0 : o, color: shade(stone, 0.85) })); }
}

function copperPyramid(K, p, th, rng, H) {
  const { w, thick: T } = p, R = (w / 2) * Math.SQRT2, R1 = (w / 2 + 1) * Math.SQRT2;
  K.add('flat', H.cyl(R, R1, T, 4, { y: -T / 2, ry: Math.PI / 4, color: p.tint === 1 ? COPPER_HI : COPPER }));
  K.add('flat', H.cyl(R + 0.05, R + 0.05, 0.15, 4, { y: -0.075, ry: Math.PI / 4, color: GOLD }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.2, T * 1.05, 0.2, { x: sx * (w / 2 + 0.5), y: -T / 2, z: sz * (w / 2 + 0.5), rx: -sz * 0.27, rz: sx * 0.27, color: COPPER_DK }));
  if (p.tint === 1) K.add('flat', H.cyl(0.04, 0.2, 2.2, 4, { x: w / 2 - 0.3, y: 1.1, z: w / 2 - 0.3, color: GOLD }));
}

function pontoon(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T + 0.4, d, { y: -(T + 0.4) / 2, color: '#2a3550' }), H.box(w - 0.1, 0.12, d - 0.1, { y: -0.06, color: '#8a909a' }));
  K.add('hazard', H.box(w, 0.04, 0.35, { y: 0.01, z: -d / 2 + 0.2 }), H.box(w, 0.04, 0.35, { y: 0.01, z: d / 2 - 0.2 }));
  K.add('neon', H.box(w + 0.1, 0.12, d + 0.1, { y: -T + 0.6, color: '#2be8ff' }));
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 1.5; o < f.width / 2; o += 3) K.add('flat', H.cyl(0.35, 0.35, 0.7, 8, { x: f.nx * (f.half + 0.3) + f.tx * o, y: -T + 0.9, z: f.nz * (f.half + 0.3) + f.tz * o, rx: f.tx ? 0 : Math.PI / 2, rz: f.tx ? Math.PI / 2 : 0, color: '#151515' }));
  for (const [sx, sz] of [[-1, -1], [1, 1]]) {
    const x = sx * (w / 2 - 0.6), z = sz * (d / 2 - 0.6);
    K.add('flat', H.cyl(0.08, 0.1, 4, 5, { x, y: 2, z, color: '#20222a' }));
    for (const a of [0, 2.1, 4.2]) K.add('glow', H.box(0.32, 0.32, 0.32, { x: x + Math.cos(a) * 0.35, y: 4, z: z + Math.sin(a) * 0.35, color: '#fff0c8' }));
  }
  for (const sx of [-1, 1]) K.add('flat', H.cyl(0.2, 0.25, 0.5, 6, { x: sx * (w / 2 - 0.5), y: 0.25, color: '#2a2a30' }));
}

function ferry(K, p, th, rng, H) {
  const { w, d, thick: T } = p, hullY = -T + 1.4, col = p.tint === 1 ? '#2a6ab8' : '#c8302a';
  K.add('flat', H.box(w, 2.2, d, { y: -T + 0.8, color: '#e8e6de' }), H.box(w + 0.05, 0.6, d + 0.05, { y: -T - 0.1, color: '#1c2638' }));
  K.add('flat', H.box(w + 0.06, 0.35, d + 0.06, { y: hullY, color: col }));
  for (const sx of [-1, 1]) K.add('flat', H.cyl(d / 2, d / 2, 2.8, 8, { x: sx * w / 2, y: -T + 0.7, sz: 0.62, color: '#e8e6de' })); // rounded ends (a double-ended ferry)
  // the cabin under the sun deck: windows all round
  K.add('flat', H.box(w - 1.2, T - 2.3, d - 0.6, { y: -(T - 2.3) / 2, color: '#f2f0ea' }));
  for (const f of H.faces(w - 1.2, d - 0.6)) for (let o = -f.width / 2 + 0.9; o < f.width / 2 - 0.4; o += 1.5) K.add('glow', H.box(f.tx ? 1.0 : 0.08, 0.9, f.tz ? 1.0 : 0.08, { x: f.nx * (f.half + 0.03) + f.tx * o, y: -1.3, z: f.nz * (f.half + 0.03) + f.tz * o, color: '#ffe6a8' }));
  K.add('flat', H.box(w - 1, 0.12, d - 0.4, { y: -0.06, color: '#5a6a7a' }));
  balustrade(K, H, w - 1.2, d - 0.6, '#f4f4f0', 0.8, 1.4);
  K.add('neon', H.box(w - 1, 0.08, 0.08, { y: -2.3, z: d / 2 - 0.3, color: col === '#c8302a' ? '#ff5a2b' : '#2be8ff' }), H.box(w - 1, 0.08, 0.08, { y: -2.3, z: -d / 2 + 0.3, color: col === '#c8302a' ? '#ff5a2b' : '#2be8ff' }));
  K.add('flat', H.cyl(0.08, 0.08, 3, 4, { x: w / 2 - 1, y: 1.5, color: '#2a2a30' }));
  K.add('glow', H.box(0.25, 0.25, 0.25, { x: w / 2 - 1, y: 3.1, color: '#2bff7a' }), H.box(0.25, 0.25, 0.25, { x: -w / 2 + 1, y: 0.3, z: 0, color: '#ff2a2a' }));
}

function cruise(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, 2.4, d, { y: -T + 1, color: '#7a1a22' }), H.box(w * 0.6, 1.4, 3, { y: -T + 1.4, z: -d / 2 - 1.2, color: '#7a1a22' })); // hull, bow
  K.add('flat', H.box(w + 0.05, 0.5, d + 0.05, { y: -T - 0.05, color: '#1a1416' }));
  K.add('flat', H.box(w - 0.8, T - 2.4, d - 1.2, { y: -(T - 2.4) / 2, color: '#f0e2c4' }));
  for (const f of H.faces(w - 0.8, d - 1.2)) for (let o = -f.width / 2 + 0.8; o < f.width / 2 - 0.4; o += 1.6) {
    K.add('glow', H.box(f.tx ? 1.1 : 0.08, 1.1, f.tz ? 1.1 : 0.08, { x: f.nx * (f.half + 0.03) + f.tx * o, y: -1.7, z: f.nz * (f.half + 0.03) + f.tz * o, color: '#ffcf70' }));
  }
  // LED outlines (the Huangpu's boats are drawn in light), a gold rail, lanterns along the deck edge
  for (const y of [-0.15, -2.4, -T + 2.2]) for (const f of H.faces(w - (y > -1 ? 0.8 : 0), d - (y > -1 ? 1.2 : 0))) K.add('neon', H.box(f.tx ? f.width : 0.1, 0.1, f.tz ? f.width : 0.1, { x: f.nx * (f.half + 0.05), y, z: f.nz * (f.half + 0.05), color: y > -1 ? '#ffd23a' : '#ff2bd6' }));
  K.add('flat', H.box(w - 1, 0.1, d - 1.6, { y: -0.05, color: '#6a3a2a' }));
  for (let z = -d / 2 + 2; z < d / 2; z += 3.5) for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.08, 1.4, 0.08, { x: sx * (w / 2 - 0.5), y: 0.7, z, color: '#2a1a14' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.28, 6, 4), { x: sx * (w / 2 - 0.5), y: 1.15, z, sy: 1.25, color: '#ff3a2a' }));
  }
  // a little red pavilion roof at the stern
  K.add('flat', H.box(w - 2, 0.25, 3, { y: 2.1, z: d / 2 - 2, color: '#2a2a32' }), H.box(w - 1.4, 0.15, 3.6, { y: 1.95, z: d / 2 - 2, color: '#c8302a' }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.2, 2, 0.2, { x: sx * (w / 2 - 1.2), y: 1, z: d / 2 - 2 + sz * 1.2, color: '#c8302a' }));
}

function ledBarge(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T + 0.3, d, { y: -(T + 0.3) / 2, color: '#22252e' }), H.box(w - 0.2, 0.1, d - 0.2, { y: -0.05, color: '#3a3e4a' }));
  K.add('neon', H.box(w + 0.1, 0.14, d + 0.1, { y: -0.5, color: p.tint === 1 ? '#2be8ff' : '#ff2bd6' }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * (w / 2 - 0.9), z = sz * (d / 2 - 0.9);
    K.add('flat', H.cyl(0.5, 0.6, 0.8, 8, { x, y: 0.4, z, color: '#15151c' }));
    K.add('glow', H.cyl(0.42, 0.42, 0.05, 8, { x, y: 0.82, z, color: '#ffffff' }));
    K.add('neon', H.box(0.12, 26, 0.12, { x: x + sx * 3, y: 13.6, z: z + sz * 2, rx: sz * 0.12, rz: -sx * 0.22, color: ['#ff2bd6', '#2be8ff', '#ffe52b', '#7bff4a'][(sx + 1) + (sz + 1) / 2] })); // light-show beams
  }
}
function ledCabin(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#c8ccd4' }), H.box(w + 0.2, 0.15, d + 0.2, { y: -0.07, color: '#3a3c46' }));
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width - 0.8 : 0.06, 0.9, f.tz ? f.width - 0.8 : 0.06, { x: f.nx * (f.half + 0.02), y: -1.1, z: f.nz * (f.half + 0.02), color: '#7fd8ff' }));
  K.add('flat', H.cyl(0.04, 0.04, 2.2, 4, { x: w / 2 - 0.3, y: 1.1, z: d / 2 - 0.3, color: '#2a2a30' }));
  K.add('glow', H.box(0.15, 0.15, 0.15, { x: w / 2 - 0.3, y: 2.25, z: d / 2 - 0.3, color: '#ff2a2a' }));
}

function bundWalk(K, p, th, rng, H) {
  const { w, d, thick: T } = p, wl = -p.h;
  K.add('flat', H.box(w, T - 0.12, d, { y: -T / 2 - 0.06, color: '#8f857a' }));
  K.add('flat', H.box(w + 0.1, 0.6, d + 0.1, { y: wl + 0.3, color: '#4a4a3e' })); // the waterline
  for (let x = -w / 2; x < w / 2 - 0.01; x += 2.5) for (let z = -d / 2; z < d / 2 - 0.01; z += 2.5) { // granite paving
    const sw = Math.min(2.5, w / 2 - x), sd = Math.min(2.5, d / 2 - z), k = ((x + z) / 2.5) & 1;
    K.add('flat', H.box(sw - 0.06, 0.12, sd - 0.06, { x: x + sw / 2, y: -0.06, z: z + sd / 2, color: k ? '#cdc3b4' : '#bfb4a4' }));
  }
  // the river balustrade (east) with the Bund's cluster lamps; a low curb on the land side
  const rx = w / 2 - 0.15;
  K.add('flat', H.box(0.25, 0.14, d, { x: rx, y: 0.95, color: '#e6ddcc' }));
  for (let z = -d / 2 + 0.4; z < d / 2; z += 1.1) K.add('flat', H.box(0.16, 0.9, 0.16, { x: rx, y: 0.45, z, color: '#ddd2bf' }));
  K.add('flat', H.box(0.4, 0.3, d, { x: -w / 2 + 0.2, y: 0.15, color: '#a89e8e' }));
  for (let z = -d / 2 + 4; z < d / 2 - 1; z += 8) for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.45);
    K.add('flat', H.cyl(0.09, 0.12, 4.2, 5, { x, y: 2.1, z, color: '#1e1e22' }), H.box(1.2, 0.08, 0.08, { x, y: 3.9, z, color: '#1e1e22' }));
    for (const o of [-0.55, 0, 0.55]) K.add('glow', H.part(new THREE.SphereGeometry(0.22, 6, 4), { x: x + o, y: o ? 4.15 : 4.45, z, color: '#fff2cc' }));
  }
  // flower beds on the land side
  for (let z = -d / 2 + 8; z < d / 2 - 4; z += 8) K.add('flat', H.box(1.2, 0.5, 3, { x: -w / 2 + 1.4, y: 0.25, z, color: '#4a3a2a' }), H.box(1, 0.3, 2.8, { x: -w / 2 + 1.4, y: 0.6, z, color: p.tint % 2 ? '#e0507a' : '#e8c040' }));
}

// ------------------------------------------------------------------ Pudong (stage 2)
function glassBlock(K, H, w, h, d, y, tint, u0 = 0) {
  const g = H.meterBox(w, h, d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], color: tint, u0 });
  g.translate(0, y, 0);
  K.add('facade', g);
}
function swfc(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  glassBlock(K, H, w, T, d, -T / 2, '#c8d6e6');
  K.add('flat', H.box(w + 0.1, 0.4, d + 0.1, { y: -0.2, color: '#e8eef4' }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.5, T, 0.5, { x: sx * (w / 2), y: -T / 2, z: sz * (d / 2), color: '#eef2f6' }));
  for (let y = -6; y > -60; y -= 12) K.add('neon', H.box(w + 0.3, 0.2, d + 0.3, { y, color: '#7fd8ff' }));
  if (p.style === 'swfc') { // the sky deck floor inside the ring: a glowing glass strip
    K.add('glow', H.box(w - 12, 0.04, 2, { y: 0.02, color: '#9fe8ff' }));
    K.add('hazard', H.box(w - 10, 0.04, 0.3, { y: 0.03, z: -d / 2 + 0.3 }), H.box(w - 10, 0.04, 0.3, { y: 0.03, z: d / 2 - 0.3 }));
  }
}
function swfcPillar(K, p, th, rng, H) { const { w, d, thick: T } = p; glassBlock(K, H, w, T, d, -T / 2, '#c8d6e6', 3); for (const sz of [-1, 1]) K.add('flat', H.box(w + 0.2, T, 0.4, { y: -T / 2, z: sz * d / 2, color: '#eef2f6' })); }
function swfcTop(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  glassBlock(K, H, w, T, d, -T / 2, '#d6e2ee', 5);
  K.add('flat', H.box(w, 0.2, d, { y: -0.1, color: '#9aa4b0' }), H.box(w + 0.3, 0.5, d + 0.3, { y: -T + 0.25, color: '#eef2f6' }));
  K.add('glow', H.box(w - 2, 0.05, 1.6, { y: 0.02, color: '#9fe8ff' }));
  balustrade(K, H, w, d, '#e8eef4', 1.0, 2);
  K.add('glow', H.box(0.5, 0.5, 0.5, { x: w / 2 - 0.5, y: 1.4, z: d / 2 - 0.5, color: '#ff2a2a' }), H.box(0.5, 0.5, 0.5, { x: -w / 2 + 0.5, y: 1.4, z: -d / 2 + 0.5, color: '#ff2a2a' }));
}
function gondola(K, p, th, rng, H) {
  const { w, d } = p, col = p.tint === 1 ? '#f0f0ea' : '#f2b81a';
  K.add('flat', H.box(w, 0.25, d, { y: -0.125, color: col }), H.box(w, 0.6, d, { y: -0.9, color: '#3a3c46' }));
  balustrade(K, H, w, d, col, 1.1, 1);
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.06, 26, 0.06, { x: sx * (w / 2 - 0.2), y: 13, z: 0, color: '#2a2c34' })); // the hoist cables
    K.add('flat', H.box(0.5, 0.5, 0.5, { x: sx * (w / 2 - 0.2), y: 1.4, color: '#3a3c46' }));
  }
  K.add('glow', H.box(0.2, 0.2, 0.2, { x: w / 2 - 0.2, y: 1.8, color: '#ff8a1a' }));
}
function skybridge(K, p, th, rng, H) {
  const { w, d } = p;
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: '#8a94a4' }), H.box(w + 0.1, 0.4, d, { y: -2.7, color: '#4a5260' }));
  K.add('glass', H.box(w - 0.1, 2.0, d - 0.1, { y: -1.4 }));
  for (let z = -d / 2; z <= d / 2; z += 3) K.add('flat', H.box(w + 0.2, 2.8, 0.25, { y: -1.4, z, color: '#dfe5ec' }));
  K.add('neon', H.box(0.1, 0.1, d, { x: w / 2 + 0.06, y: -0.1, color: p.tint ? '#ff2bd6' : '#2be8ff' }), H.box(0.1, 0.1, d, { x: -w / 2 - 0.06, y: -0.1, color: p.tint ? '#ff2bd6' : '#2be8ff' }));
}
function jinmao(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  glassBlock(K, H, w, T, d, -T / 2, '#8e95a6', 7);
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 1; o < f.width / 2; o += 2) K.add('flat', H.box(f.tx ? 0.15 : 0.3, Math.min(T, 160), f.tz ? 0.15 : 0.3, { x: f.nx * (f.half + 0.1) + f.tx * o, y: -Math.min(T, 160) / 2, z: f.nz * (f.half + 0.1) + f.tz * o, color: '#c8ccd6' }));
  for (let y = -0.4; y > -70; y -= 8) K.add('flat', H.box(w + 0.8, 0.35, d + 0.8, { y, color: '#c8a85a' }));
}
function jinmaoTier(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  glassBlock(K, H, w, T, d, -T / 2, '#8e95a6', 7);
  K.add('flat', H.box(w + 0.7, 0.4, d + 0.7, { y: -0.3, color: '#d8b860' }), H.cyl((w / 2 + 0.5) * Math.SQRT2, (w / 2) * Math.SQRT2, 0.8, 4, { y: -0.9, ry: Math.PI / 4, color: '#a8acb8' }));
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 0.6; o < f.width / 2; o += 1.4) K.add('flat', H.box(f.tx ? 0.12 : 0.22, T - 1.2, f.tz ? 0.12 : 0.22, { x: f.nx * (f.half + 0.08) + f.tx * o, y: -T / 2 - 0.6, z: f.nz * (f.half + 0.08) + f.tz * o, color: '#c8ccd6' }));
  K.add('neon', H.box(w + 0.75, 0.08, d + 0.75, { y: -0.05, color: '#ffd23a' }));
}
function jinmaoSpire(K, p, th, rng, H) {
  const T = p.thick;
  K.add('flat', H.cyl(0.05, p.r + 0.1, T, 6, { y: -T / 2, color: '#d8dce4' }));
  for (let y = -2; y > -T + 1; y -= 2.2) K.add('flat', H.cyl(p.r * 1.6, p.r * 1.6, 0.2, 6, { y, color: '#b8bcc8' }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 0.15, color: '#ff2a2a' }));
}
function twistBase(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  glassBlock(K, H, w, T, d, -T / 2, '#a8d0d0', 2);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.6, T, 0.6, { x: sx * w / 2, y: -T / 2, z: sz * d / 2, color: '#e8f0f0' }));
}
function twistPlate(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lobby = p.style === 'twistLobby';
  glassBlock(K, H, w, T, d, -T / 2, lobby ? '#bfe0dc' : '#a8d0d0', (p.tint * 3) % 16);
  K.add('flat', H.box(w + 0.15, 0.3, d + 0.15, { y: -0.15, color: '#eef6f4' })); // the floor slab's edge
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 1.6; o < f.width / 2 - 0.5; o += 3.2) K.add('flat', H.box(f.tx ? 0.12 : 0.16, T - 0.3, f.tz ? 0.12 : 0.16, { x: f.nx * (f.half + 0.06) + f.tx * o, y: -T / 2 - 0.15, z: f.nz * (f.half + 0.06) + f.tz * o, color: '#dce8e6' }));
  // the corners are the way up: a lamp on each, and a stripe down the edge
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    K.add('glow', H.box(0.35, 0.35, 0.35, { x: sx * (w / 2 - 0.3), y: 0.17, z: sz * (d / 2 - 0.3), color: lobby ? '#ffd23a' : '#7ff6ff' }));
    K.add('neon', H.box(0.2, T - 0.4, 0.2, { x: sx * (w / 2 + 0.02), y: -T / 2, z: sz * (d / 2 + 0.02), color: '#2be8ff' }));
  }
  if (lobby) { K.add('neon', H.box(w + 0.3, 0.15, d + 0.3, { y: -T + 0.5, color: '#2be8ff' })); balustrade(K, H, w, d, '#e8f0f0', 1.0, 2.2); }
}
function twistCrown(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  glassBlock(K, H, w, T, d, -T / 2, '#c8e6e2', 9);
  K.add('flat', H.box(w + 0.2, 0.3, d + 0.2, { y: -0.15, color: '#eef6f4' }));
  for (const f of H.faces(w, d)) for (let o = -f.width / 2; o <= f.width / 2 + 0.01; o += f.width / 6) { // the open crown: fins rising round the edge
    const hgt = 3 + 2.5 * Math.cos(o / f.width * Math.PI);
    K.add('flat', H.box(f.tx ? 0.3 : 0.6, hgt, f.tz ? 0.3 : 0.6, { x: f.nx * (f.half + 0.2) + f.tx * o, y: hgt / 2, z: f.nz * (f.half + 0.2) + f.tz * o, color: '#e8f2f0' }));
  }
  K.add('neon', H.box(w + 0.5, 0.14, d + 0.5, { y: -0.4, color: '#2be8ff' }));
}
function blimp(K, p, th, rng, H) {
  const { w, d } = p, R = d / 2 + 0.2;
  K.add('flat', H.part(new THREE.SphereGeometry(1, H.seg(16, 10), H.seg(10, 7)), { y: -R + 0.1, sx: w / 2 + 1.2, sy: R, sz: R, color: '#e8eaee' }));
  K.add('flat', H.box(w - 2, 0.2, 2.4, { y: -0.1, color: '#8a92a0' })); // the catwalk along its back
  K.add('hazard', H.box(w - 2, 0.04, 0.25, { y: 0.01, z: -1.2 }), H.box(w - 2, 0.04, 0.25, { y: 0.01, z: 1.2 }));
  for (const sz of [-1, 1]) {
    K.add('ads', H.atlasQuad(w * 0.6, R * 0.95, adUV(40 + sz), { y: -R + 0.1, z: sz * (R + 0.02), ry: sz > 0 ? 0 : Math.PI }));
    K.add('flat', H.box(2.8, 0.2, 2.2, { x: -w / 2 - 0.4, y: -R + 0.1, z: sz * (R + 0.6), color: '#c83040' })); // tail fins
  }
  K.add('flat', H.box(2.8, 2.4, 0.2, { x: -w / 2 - 0.4, y: -R + 1.3, color: '#c83040' }), H.box(2.8, 2.0, 0.2, { x: -w / 2 - 0.4, y: -R * 2 + 0.6, color: '#c83040' }));
  K.add('flat', H.box(4, 1.2, 1.6, { y: -R * 2 - 0.3, color: '#3a3c46' }));
  K.add('glow', H.box(3.4, 0.5, 1.65, { y: -R * 2 - 0.2, color: '#7fd8ff' }));
  for (const sx of [-1, 1]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: sx * (w / 2 - 1), y: 0.2, color: sx > 0 ? '#2bff7a' : '#ff2a2a' }));
  K.add('neon', H.box(w * 0.62, 0.12, 0.12, { y: -R * 0.35, z: R * 0.94, color: '#ff2bd6' }), H.box(w * 0.62, 0.12, 0.12, { y: -R * 0.35, z: -R * 0.94, color: '#ff2bd6' }));
}

// ------------------------------------------------------------------ the old town (stage 3)
function stoneBank(K, p, th, rng, H) {
  const { w, d, thick: T } = p, wl = -p.h, plaza = p.style === 'stonePlaza';
  K.add('flat', H.box(w, T - 0.12, d, { y: -T / 2 - 0.06, color: '#5e5c64' }));
  K.add('flat', H.box(w + 0.1, 0.5, d + 0.1, { y: wl + 0.25, color: '#2e3a30' }));
  const tile = plaza ? 3 : 2.2;
  for (let x = -w / 2; x < w / 2 - 0.01; x += tile) for (let z = -d / 2; z < d / 2 - 0.01; z += tile) {
    const sw = Math.min(tile, w / 2 - x), sd = Math.min(tile, d / 2 - z), cx = x + sw / 2, cz = z + sd / 2;
    let col = (Math.floor(x / tile) + Math.floor(z / tile)) & 1 ? '#8e8c94' : '#82808a';
    if (plaza) { const r = Math.max(Math.abs(cx), Math.abs(cz + 3)); col = Math.floor(r / 3) % 2 ? '#8a8690' : '#a09aa0'; if (Math.abs(cx) < 2.2 && cz > 0) col = '#9a2a2a'; } // rings round the pagoda, a red carpet to it
    K.add('flat', H.box(sw - 0.05, 0.12, sd - 0.05, { x: cx, y: -0.06, z: cz, color: col }));
  }
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 2; o < f.width / 2 - 1; o += 6) {
    const x = f.nx * (f.half - 0.35) + f.tx * o, z = f.nz * (f.half - 0.35) + f.tz * o;
    if (((o / 6) | 0) % 2) { K.add('flat', H.box(0.4, 0.5, 0.4, { x, y: 0.25, z, color: '#6a6870' })); continue; } // a bollard
    K.add('flat', H.cyl(0.07, 0.09, 2.6, 4, { x, y: 1.3, z, color: '#2a1a14' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.32, 6, 4), { x, y: 2.75, z, sy: 1.3, color: '#ff3a24' }));
  }
}
function garden(K, p, th, rng, H) {
  const { w, d, thick: T } = p, wl = -p.h;
  K.add('flat', H.box(w, T - 0.1, d, { y: -T / 2 - 0.05, color: '#6a6870' }), H.box(w - 0.6, 0.12, d - 0.6, { y: -0.04, color: '#2f5a34' }));
  K.add('flat', H.box(w + 0.1, 0.5, d + 0.1, { y: wl + 0.25, color: '#2e3a30' }));
  for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width : 0.3, 0.2, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: 0.0, z: f.nz * (f.half - 0.15), color: '#9a98a0' }));
  for (let i = 0; i < 14; i++) { // shrubs and flowers round the edge
    const a = rng() * TAU, x = Math.cos(a) * (w / 2 - 1.2), z = Math.sin(a) * (d / 2 - 1.2);
    K.add('flat', H.part(new THREE.IcosahedronGeometry(0.7 + rng() * 0.5, 0), { x, y: 0.4, z, sy: 0.7, color: '#1f4a28' }));
    if (rng() < 0.5) K.add('glow', H.box(0.2, 0.2, 0.2, { x: x + 0.3, y: 0.85, z, color: rng() < 0.5 ? '#ff7ab0' : '#ffe07a' }));
  }
  for (const [sx, sz] of [[1, 1], [-1, -1]]) { // weeping willows at two corners
    const x = sx * (w / 2 - 2), z = sz * (d / 2 - 2);
    K.add('flat', H.cyl(0.25, 0.35, 4, 5, { x, y: 2, z, color: '#3a2a1e' }));
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; K.add('flat', H.cyl(0.5, 0.15, 3.4, 4, { x: x + Math.cos(a) * 1.4, y: 3, z: z + Math.sin(a) * 1.4, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3, color: '#4a8a3a' })); }
    K.add('flat', H.part(new THREE.IcosahedronGeometry(1.8, 0), { x, y: 4.6, z, sy: 0.6, color: '#3e7a34' }));
  }
}

const HALL_WALL = ['#e6dccb', '#e2d6c2', '#ddd0bc', '#b8382c', '#e6dccb', '#e2d6c2', '#c84a32', '#b8302a'];
function hall(K, p, th, rng, H) {
  const { w, d, thick: T } = p, t = p.tint >= 0 ? p.tint : 0, wall = HALL_WALL[t % 8], red = '#a8231c';
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: wall }), H.box(w + 0.2, 0.5, d + 0.2, { y: -T + 0.25, color: '#4a4650' }));
  for (const f of H.faces(w, d)) {
    const n = Math.max(1, Math.round(f.width / 3));
    for (let k = 0; k <= n; k++) { // red columns
      const off = -f.width / 2 + k * f.width / n;
      K.add('flat', H.box(0.36, T, 0.36, { x: f.nx * (f.half + 0.06) + f.tx * off, y: -T / 2, z: f.nz * (f.half + 0.06) + f.tz * off, color: red }));
    }
    for (let k = 0; k < n; k++) { // lattice windows, lit warm, with dark bars
      const off = -f.width / 2 + (k + 0.5) * f.width / n, x = f.nx * (f.half + 0.04) + f.tx * off, z = f.nz * (f.half + 0.04) + f.tz * off, ww = f.width / n - 0.9, wh = Math.min(T - 1.4, 2.2), y = -T / 2 + 0.1;
      K.add('glow', H.box(f.tx ? ww : 0.06, wh, f.tz ? ww : 0.06, { x, y, z, color: t === 3 ? '#ffcf7a' : '#ffb050' }));
      for (const g of [-0.25, 0, 0.25]) {
        K.add('flat', H.box(f.tx ? ww : 0.08, 0.06, f.tz ? ww : 0.08, { x: x + f.nx * 0.02, y: y + g * wh, z: z + f.nz * 0.02, color: '#3a1a10' }));
        K.add('flat', H.box(f.tx ? 0.06 : 0.08, wh, f.tz ? 0.06 : 0.08, { x: x + f.nx * 0.02 + f.tx * g * ww, y, z: z + f.nz * 0.02 + f.tz * g * ww, color: '#3a1a10' }));
      }
    }
  }
  if (t === 4 || t === 5) { // market: neon sign blades out of the facade, a cloth awning
    const f = H.faces(w, d)[t === 4 ? 3 : 1];
    for (const off of [-f.width / 3, f.width / 3]) {
      const cell = Math.floor(rng() * SIGN_COLS), r = [cell / SIGN_COLS, 0, (cell + 1) / SIGN_COLS, 1];
      const bx = f.nx * (f.half + 1.1) + f.tx * off, bz = f.nz * (f.half + 1.1) + f.tz * off;
      K.add('flat', H.box(f.tx ? 0.25 : 1.9, 4.2, f.tz ? 0.25 : 1.9, { x: bx, y: -T / 2 + 0.6, z: bz, color: '#15151c' }));
      K.add('signs', H.atlasQuad(1.6, 3.9, r, { x: bx + f.tx * 0.14, y: -T / 2 + 0.6, z: bz + f.tz * 0.14, ry: Math.atan2(f.tx, f.tz) }), H.atlasQuad(1.6, 3.9, r, { x: bx - f.tx * 0.14, y: -T / 2 + 0.6, z: bz - f.tz * 0.14, ry: Math.atan2(-f.tx, -f.tz) }));
    }
    K.add('flat', H.box(f.tx ? f.width * 0.8 : 1.6, 0.12, f.tz ? f.width * 0.8 : 1.6, { x: f.nx * (f.half + 0.8), y: -T + 2.6, z: f.nz * (f.half + 0.8), rx: f.tz ? 0 : 0, color: t === 4 ? '#c83a2a' : '#2a6a5a' }));
  }
}

// The curved-eave roof slab: dark tiles on top, a red fascia, upturned corners with a lantern under each.
const TILE = ['#3c3e48', '#34404a', '#3a3a42'], FASCIA = ['#a8231c', '#a8231c', '#e8e0d0'];
function eave(K, p, th, rng, H) {
  const { w, d, thick: T } = p, v = (p.tint >= 0 ? p.tint : 0) & 7, top = (p.tint & 8) !== 0, tile = TILE[v % 3];
  K.add('flat', H.box(w, T * 0.7, d, { y: -T * 0.35, color: tile }));
  for (let k = 1; k <= 3; k++) { // tile courses stepping in toward the ridge
    const ins = k * Math.min(w, d) * 0.09;
    for (const f of H.faces(w - ins * 2, d - ins * 2)) K.add('flat', H.box(f.tx ? f.width : 0.16, 0.07, f.tz ? f.width : 0.16, { x: f.nx * (f.half - 0.08), y: 0.02, z: f.nz * (f.half - 0.08), color: shade(tile, 1.35) }));
  }
  K.add('flat', H.box(w + 0.12, T * 0.35, d + 0.12, { y: -T * 0.8, color: FASCIA[v % 3] }));
  K.add('flat', H.box(w + 0.16, 0.08, d + 0.16, { y: -T * 0.6, color: v === 1 ? '#e8b440' : '#d8a23a' }));
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 0.8; o < f.width / 2 - 0.5; o += 1.4) K.add('flat', H.box(f.tx ? 0.3 : 0.5, 0.3, f.tz ? 0.3 : 0.5, { x: f.nx * (f.half - 0.25) + f.tx * o, y: -T - 0.15, z: f.nz * (f.half - 0.25) + f.tz * o, color: (o * 7 | 0) % 2 ? '#2a7a5a' : '#c83a2a' })); // brackets
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * w / 2, z = sz * d / 2, a = Math.atan2(sz, sx);
    K.add('flat', H.box(1.6, 0.3, 0.4, { x: x + sx * 0.3, y: 0.25, z: z + sz * 0.3, ry: -a, rz: 0.5, color: tile })); // the upturned horn
    K.add('flat', H.cyl(0.02, 0.14, 0.7, 4, { x: x + sx * 0.75, y: 0.75, z: z + sz * 0.75, rz: -sx * 0.5, rx: sz * 0.5, color: '#e8b440' }));
    K.add('flat', H.box(0.04, 0.8, 0.04, { x: x + sx * 0.3, y: -T - 0.4, z: z + sz * 0.3, color: '#1a1010' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.34, 6, 4), { x: x + sx * 0.3, y: -T - 1.05, z: z + sz * 0.3, sy: 1.3, color: '#ff3a24' }));
  }
  if (top && Math.min(w, d) > 6) K.add('flat', H.box(Math.max(w, d) > w ? 0.5 : w * 0.5, 0.35, Math.max(w, d) > w ? d * 0.5 : 0.5, { y: 0.17, color: shade(tile, 0.8) })); // a low ridge
}
function eaveTop(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#3c3e48' }), H.cyl((w / 2 + 0.9) * Math.SQRT2, (w / 2) * Math.SQRT2, T * 0.45, 4, { y: -T * 0.78, ry: Math.PI / 4, color: '#34363f' }));
  K.add('flat', H.box(w + 0.1, 0.12, d + 0.1, { y: -0.06, color: '#d8a23a' }));
  K.add('flat', H.cyl(0.08, 0.12, 0.8, 5, { y: 0.4, color: '#d8a23a' }));
  K.add('glow', H.part(new THREE.SphereGeometry(0.3, 6, 4), { y: 0.95, color: '#ffd23a' }));
}
function pagodaCap(K, p, th, rng, H) {
  eaveTop(K, p, th, rng, H);
  for (let k = 0; k < 6; k++) K.add('flat', H.cyl(0.45 - k * 0.05, 0.5 - k * 0.05, 0.25, 8, { y: 1.4 + k * 0.5, color: '#e8b440' }));
  K.add('flat', H.cyl(0.04, 0.12, 2.6, 5, { y: 5, color: '#e8b440' }));
  K.add('glow', H.part(new THREE.SphereGeometry(0.35, 6, 4), { y: 4.6, color: '#ffd23a' }));
}
function zigBridge(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#a8a49c' }), H.box(w - 0.2, 0.08, d - 0.2, { y: -0.04, color: '#c4c0b6' }));
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.18, 0.12, d - 0.4, { x: sx * (w / 2 - 0.12), y: 0.62, color: '#d8d4ca' }));
    for (let z = -d / 2 + 0.6; z < d / 2 - 0.3; z += 1.3) K.add('flat', H.box(0.22, 0.62, 0.22, { x: sx * (w / 2 - 0.12), y: 0.31, z, color: '#cfcbc0' }));
  }
}
function lantern(K, p, th, rng, H) {
  const r = p.r, T = p.thick, hang = p.tint === 1, cy = -T * 0.5;
  K.add('glow', H.part(new THREE.SphereGeometry(1, H.seg(12, 8), H.seg(8, 6)), { y: cy, sx: r * 1.05, sz: r * 1.05, sy: T * 0.62, color: hang ? '#ff4a2a' : '#ff3424' }));
  K.add('flat', H.cyl(r * 0.75, r * 0.85, 0.16, 8, { y: -0.08, color: '#2a1410' }), H.cyl(r * 0.6, r * 0.7, 0.16, 8, { y: -T + 0.08, color: '#2a1410' }));
  K.add('flat', H.cyl(r * 1.07, r * 1.07, 0.1, H.seg(12, 8), { y: cy, color: '#e8b440' }));
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; K.add('flat', H.box(0.05, T * 1.1, 0.05, { x: Math.cos(a) * r * 1.03, y: cy, z: Math.sin(a) * r * 1.03, color: '#7a1410' })); }
  K.add('flat', H.cyl(0.02, 0.12, 0.9, 4, { y: -T - 0.45, color: '#e8b440' }));
  if (hang) K.add('flat', H.box(0.05, 2.4, 0.05, { y: 1.2, color: '#1a1010' })); // its cord, up to the eave
}
function bigLantern(K, p, th, rng, H) {
  const r = p.r, T = p.thick, cy = -T * 0.55;
  K.add('glow', H.part(new THREE.SphereGeometry(1, H.seg(16, 10), H.seg(12, 8)), { y: cy, sx: r * 1.1, sz: r * 1.1, sy: T * 0.75, color: '#fff0b8' }));
  K.add('flat', H.cyl(r * 0.8, r * 0.9, 0.25, 12, { y: -0.12, color: '#a8231c' }), H.cyl(r * 0.5, r * 0.6, 0.25, 12, { y: -T + 0.1, color: '#a8231c' }));
  for (const y of [cy - T * 0.25, cy + T * 0.25]) K.add('flat', H.cyl(r * 1.02, r * 1.02, 0.12, H.seg(16, 10), { y, color: '#e8b440' }));
  for (let k = 0; k < 4; k++) K.add('flat', H.cyl(0.03, 0.18, 1.6, 4, { x: Math.cos(k * 1.57) * r * 0.5, y: -T - 0.8, z: Math.sin(k * 1.57) * r * 0.5, color: '#c8302a' }));
  K.add('neon', H.part(new THREE.TorusGeometry(r * 1.12, 0.07, 3, H.seg(20, 12)), { y: cy, rx: Math.PI / 2, color: '#ff2b5a' }));
}
function dragonBoat(K, p, th, rng, H) {
  const { w, d, thick: T } = p, gold = '#e8b440', hull = p.tint === 1 ? '#2a7a5a' : '#c8302a';
  K.add('flat', H.box(w, T + 0.5, d - 1.6, { y: -(T + 0.5) / 2, color: hull }), H.box(w * 0.7, T + 0.3, 1.6, { y: -(T + 0.3) / 2, z: d / 2 - 0.4, color: hull }));
  K.add('flat', H.box(w + 0.06, 0.12, d - 1.6, { y: -0.3, color: gold }));
  for (let z = -d / 2 + 1.5; z < d / 2 - 1.2; z += 0.8) for (const sx of [-1, 1]) K.add('flat', H.box(0.06, 0.25, 0.5, { x: sx * (w / 2 + 0.02), y: -0.7, z, color: (z * 5 | 0) % 2 ? gold : '#2a6a4a' })); // scales
  // the head at the prow (local -Z), the curled tail at the stern
  const hz = -d / 2 - 0.3;
  K.add('flat', H.box(0.9, 1.4, 1.0, { y: 0.4, z: hz + 0.2, rx: -0.3, color: hull }), H.box(0.7, 0.45, 1.1, { y: 0.75, z: hz - 0.45, color: hull }));
  K.add('flat', H.box(0.75, 0.25, 0.9, { y: 0.3, z: hz - 0.35, rx: 0.3, color: '#f0e6d0' }));
  for (const sx of [-1, 1]) {
    K.add('glow', H.box(0.18, 0.18, 0.18, { x: sx * 0.32, y: 1.0, z: hz - 0.2, color: '#fff27a' }));
    K.add('flat', H.cyl(0.03, 0.08, 0.9, 4, { x: sx * 0.25, y: 1.45, z: hz + 0.2, rx: 0.6, color: gold }));
  }
  K.add('flat', H.box(0.5, 1.4, 0.35, { y: 0.5, z: d / 2 - 0.2, rx: 0.5, color: hull }), H.box(0.9, 0.3, 0.5, { y: 1.15, z: d / 2 + 0.2, color: gold }));
  K.add('flat', H.cyl(0.4, 0.4, 0.5, 8, { y: 0.25, z: -1, color: '#c8302a' }), H.cyl(0.42, 0.42, 0.04, 8, { y: 0.51, z: -1, color: '#f0e6d0' }));
  for (let z = -d / 2 + 2.2; z < d / 2 - 1.5; z += 1.4) for (const sx of [-1, 1]) { // paddlers and their paddles
    K.add('flat', H.box(0.35, 0.5, 0.3, { x: sx * 0.6, y: 0.25, z, color: '#f2e4c0' }), H.box(0.24, 0.24, 0.24, { x: sx * 0.6, y: 0.62, z, color: '#2a1a14' }));
    K.add('flat', H.box(0.06, 1.3, 0.12, { x: sx * (w / 2 + 0.25), y: -0.5, z, rz: sx * 0.6, color: '#7a5a3a' }));
  }
  K.add('glow', H.part(new THREE.SphereGeometry(0.25, 6, 4), { y: 1.3, z: 0.5, color: '#ff3a24' }), H.box(0.04, 1.1, 0.04, { y: 0.6, z: 0.5, color: '#2a1a14' }));
}
function archBridge(K, p, th, rng, H) {
  const { w, d, thick: T } = p, stone = '#a8a49c';
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: stone }), H.box(w, 0.08, d - 0.3, { y: -0.04, color: '#c4c0b6' }));
  const R = w / 2, sy = 3.4 / R; // a flattened arch under the span: the boats pass under it
  K.add('flat', H.part(new THREE.TorusGeometry(R - 0.3, 0.45, 4, H.seg(16, 10), Math.PI), { y: -T - 0.1 - 3.3 + 0.1, sy, sz: d / 0.9, color: shade(stone, 0.9) }));
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(w, 0.12, 0.18, { y: 0.7, z: sx * (d / 2 - 0.12), color: '#d8d4ca' }));
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1.4) K.add('flat', H.box(0.22, 0.7, 0.22, { x, y: 0.35, z: sx * (d / 2 - 0.12), color: '#cfcbc0' }));
    K.add('flat', H.cyl(0.07, 0.07, 1.8, 4, { x: sx * (w / 2 - 0.3), y: 0.9, z: d / 2 - 0.15, color: '#2a1a14' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.3, 6, 4), { x: sx * (w / 2 - 0.3), y: 1.95, z: d / 2 - 0.15, sy: 1.3, color: '#ff3a24' }));
  }
}
function stoneStep(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#a8a49c' }));
  for (let k = 1; k < 3; k++) K.add('flat', H.box(w + 0.02, 0.06, d + 0.02, { y: -k * T / 3, color: '#8a8680' }));
}
function moonWall(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lintel = p.tint === 1;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#ece6da' }), H.box(w + 0.6, 0.35, d + 0.2, { y: -0.05, color: '#34363f' }), H.box(w + 0.7, 0.1, d + 0.2, { y: -0.3, color: '#2a2a32' }));
  if (!lintel) K.add('flat', H.box(w + 0.05, 0.5, d + 0.05, { y: -T + 0.25, color: '#5a5860' }));
  else for (const sx of [-1, 1]) { // the round moon gate's frame, on both faces of the wall
    K.add('flat', H.part(new THREE.TorusGeometry(1.75, 0.16, 4, H.seg(24, 14)), { x: sx * (w / 2 + 0.02), y: -T - 1.3, ry: Math.PI / 2, color: '#3a3a44' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.3, 6, 4), { x: sx * (w / 2 + 0.4), y: -T - 0.1, sy: 1.3, color: '#ff3a24' }));
  }
}
function rockery(K, p, th, rng, H) {
  const { w, d, thick: T } = p, col = ['#9a9a9e', '#8a8c92', '#a6a2a0', '#7e8088'][(p.tint >= 0 ? p.tint : 0) % 4];
  K.add('flat', H.part(new THREE.IcosahedronGeometry(1, 0), { y: -T / 2, sx: w * 0.55, sy: T / 2 + 0.15, sz: d * 0.55, color: col }));
  K.add('flat', H.part(new THREE.IcosahedronGeometry(1, 0), { x: w * 0.15, y: -0.1, z: -d * 0.1, sx: w * 0.42, sy: 0.3, sz: d * 0.42, color: shade(col, 1.12) }));
  for (let k = 0; k < 4; k++) K.add('flat', H.box(0.3, 0.3, 0.3, { x: (rng() - 0.5) * w * 0.9, y: -T * (0.3 + rng() * 0.5), z: (rng() - 0.5) * d * 0.9, color: '#2a2a30' }));
}

// ------------------------------------------------------------------ the Pearl Tower (boss)
const PINK = '#e8307a', PINK_HI = '#ff6aa8', PINK_DK = '#9a1a50';
function pearlDeck(K, p, th, rng, H) {
  const r = p.r, R = 17, cy = -Math.sqrt(R * R - r * r); // the sphere's centre, so it meets the deck's rim
  const t0 = Math.acos(-cy / R);
  K.add('flat', H.part(new THREE.SphereGeometry(R, H.seg(28, 18), H.seg(16, 12), 0, TAU, t0, Math.PI - t0), { y: cy, color: PINK }));
  for (const lat of [0.25, 0.55, 0.85]) { // window bands round the sphere
    const y = cy + Math.cos(t0 + (Math.PI - t0) * lat) * R, rr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))) + 0.05;
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; K.add('glow', H.box(0.7, 0.5, 0.1, { x: Math.cos(a) * rr, y, z: Math.sin(a) * rr, ry: -a + Math.PI / 2, color: k % 5 ? '#ffd6ea' : '#7ff6ff' })); }
  }
  K.add('flat', H.cyl(r, r, 0.25, H.seg(40, 24), { y: -0.125, color: '#2a2034' }));
  K.add('neon', H.part(new THREE.RingGeometry(r - 0.9, r - 0.6, H.seg(40, 24)), { rx: -Math.PI / 2, y: 0.02, color: '#ff2b8a' }), H.part(new THREE.RingGeometry(5.4, 5.7, H.seg(32, 20)), { rx: -Math.PI / 2, y: 0.02, color: '#2be8ff' }));
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; K.add('flat', H.box(0.15, 0.02, r - 6.5, { x: Math.cos(a) * (r + 5.5) / 2, y: 0.015, z: Math.sin(a) * (r + 5.5) / 2, ry: -a + Math.PI / 2, color: '#4a3a5a' })); }
  for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; K.add('flat', H.box(0.1, 0.7, 0.1, { x: Math.cos(a) * (r - 0.15), y: 0.35, z: Math.sin(a) * (r - 0.15), color: '#c8c8d4' })); }
  K.add('flat', H.part(new THREE.TorusGeometry(r - 0.15, 0.06, 3, H.seg(40, 24)), { rx: Math.PI / 2, y: 0.72, color: '#e8e8f0' }));
}
function pearlColumn(K, p, th, rng, H) {
  const T = p.thick, r = p.r;
  K.add('flat', H.cyl(r, r, T, H.seg(12, 8), { y: -T / 2, color: '#d8d8e2' }));
  for (let y = -2; y > -T; y -= 3) K.add('neon', H.cyl(r + 0.06, r + 0.06, 0.18, H.seg(12, 8), { y, color: (y / 3 | 0) % 2 ? '#ff2b8a' : '#c8d8ff' }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 0.15, color: '#ff2a2a' }));
}
function pearlRing(K, p, th, rng, H) {
  const r = p.r, small = p.tint === 1, R = r + 0.6, cy = -Math.sqrt(Math.max(0.1, R * R - r * r)), t0 = Math.acos(Math.min(1, -cy / R));
  K.add('flat', H.part(new THREE.SphereGeometry(R, H.seg(18, 12), H.seg(10, 8), 0, TAU, t0, Math.PI - t0), { y: cy, color: small ? PINK_HI : PINK }));
  K.add('flat', H.cyl(r, r, 0.2, H.seg(20, 14), { y: -0.1, color: '#2a2034' }));
  K.add('neon', H.part(new THREE.TorusGeometry(r - 0.2, 0.08, 3, H.seg(20, 14)), { rx: Math.PI / 2, y: 0.03, color: '#7ff6ff' }));
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; K.add('glow', H.box(0.4, 0.3, 0.1, { x: Math.cos(a) * (R - 0.1), y: cy * 0.35, z: Math.sin(a) * (R - 0.1), ry: -a + Math.PI / 2, color: '#ffd6ea' })); }
}
function pearlPad(K, p, th, rng, H) {
  const r = p.r, T = p.thick, v = p.tint >= 0 ? p.tint : 0;
  K.add('flat', H.part(new THREE.SphereGeometry(r, H.seg(16, 10), H.seg(8, 6), 0, TAU, Math.PI / 2, Math.PI / 2), { y: -0.15, sy: (T + r * 0.5) / r, color: [PINK, PINK_HI, PINK_DK][v % 3] }));
  K.add('flat', H.cyl(r, r, 0.3, H.seg(16, 10), { y: -0.15, color: '#f0e8f4' }));
  K.add('neon', H.part(new THREE.TorusGeometry(r * 0.72, 0.07, 3, H.seg(16, 10)), { rx: Math.PI / 2, y: 0.03, color: v === 1 ? '#ffe52b' : '#7ff6ff' }));
  K.add('glow', H.cyl(r * 0.35, r * 0.15, 0.6, 8, { y: -T - r * 0.5 - 0.1, color: '#ff8ad8' })); // its thruster glow
}
function pearlPod(K, p, th, rng, H) {
  const r = p.r, T = p.thick;
  K.add('flat', H.cyl(r, r + 0.3, T, H.seg(12, 8), { y: -T / 2, color: PINK_HI }), H.cyl(r + 0.05, r + 0.05, 0.12, H.seg(12, 8), { y: -0.06, color: '#f0e8f4' }));
  K.add('glow', H.cyl(r + 0.32, r + 0.32, 0.12, H.seg(12, 8), { y: -T + 0.3, color: '#7ff6ff' }));
}

export const SHANGHAI_STYLES = {
  bund, portico, copperDrum, copperDome, copperLantern, clockTower, bundLedge, copperPyramid, pontoon, ferry, cruise, ledBarge, ledCabin, bundWalk,
  swfc, swfcPillar, swfcTop, gondola, skybridge, jinmao, jinmaoTier, jinmaoSpire, twistBase, twistPlate, twistLobby: twistPlate, twistCrown, blimp,
  stoneBank, stonePlaza: stoneBank, garden, hall, eave, eaveTop, pagodaCap, zigBridge, lantern, bigLantern, dragonBoat, archBridge, stoneStep, moonWall, rockery,
  pearlDeck, pearlColumn, pearlRing, pearlPad, pearlPod,
};
