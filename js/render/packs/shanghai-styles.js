// SHANGHAI platform styles (render only). Each builds one platform's pieces into Kit K, in its local
// frame: origin at the centre, y = 0 at the top you stand on, footprint p.w × p.d (rect) or p.r (disc).
// Flat-shaded vertex colours, a few unlit lamps and neon lines; static ones get merged.
import * as THREE from 'three';
import { adUV } from '../ads.js';
import { SIGN_COLS } from '../textures.js';

const _c = new THREE.Color(), _a = new THREE.Color(), _b = new THREE.Color();
const shade = (hex, k) => _c.set(hex).multiplyScalar(k).getHex();
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ night helpers
// Recolour a placed geometry by height: c0 at y0 → c1 at y1 (floodlight washes, uplit columns).
function grad(g, y0, y1, c0, c1) {
  const pos = g.attributes.position, col = g.attributes.color;
  _a.set(c0); _b.set(c1);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, (pos.getY(i) - y0) / (y1 - y0)));
    _c.copy(_a).lerp(_b, t);
    col.setXYZ(i, _c.r, _c.g, _c.b);
  }
  return g;
}
// An LED strip round a w × d footprint at height y (the walkable edge reads at night).
function edgeLED(K, H, w, d, y, color, o = {}) {
  const t = o.t ?? 0.1, out = o.out ?? 0.06;
  for (const f of H.faces(w, d)) K.add(o.key || 'neon', H.box(f.tx ? f.width + out * 2 : t, t, f.tz ? f.width + out * 2 : t, { x: f.nx * (f.half + out), y, z: f.nz * (f.half + out), color }));
}
// A floodlight wash over each face of a w × d block, from y0 (bright) up to y1 (dim), just proud of the wall.
function wash(K, H, w, d, y0, y1, c0, c1, which = [0, 1, 2, 3], out = 0.025) {
  const fs = H.faces(w, d);
  for (const i of which) {
    const f = fs[i], g = H.part(new THREE.PlaneGeometry(f.width, y1 - y0), { x: f.nx * (f.half + out), y: (y0 + y1) / 2, z: f.nz * (f.half + out), ry: f.ry });
    K.add('glow', grad(g, y0, y1, c0, c1));
  }
}
// A mast with a red aviation beacon (and a smaller one half way up).
function mast(K, H, x, z, y0, h, col = '#ff2a2a') {
  K.add('flat', H.cyl(0.05, 0.09, h, 4, { x, y: y0 + h / 2, z, color: '#2a2a32' }));
  K.add('glow', H.box(0.26, 0.26, 0.26, { x, y: y0 + h + 0.1, z, color: col }), H.box(0.16, 0.16, 0.16, { x, y: y0 + h * 0.55, z, color: col }));
}
// A holographic ad on a pole: an ad-atlas panel both ways, a neon frame, a glowing emitter at its foot.
function holoAd(K, H, x, z, y0, w, h, ad, ry, frame) {
  const y = y0 + 1.6 + h / 2;
  K.add('flat', H.cyl(0.06, 0.08, 1.6, 4, { x, y: y0 + 0.8, z, color: '#1e1e26' }));
  K.add('glow', H.cyl(0.22, 0.22, 0.08, 6, { x, y: y0 + 1.6, z, color: frame }));
  const nx = Math.sin(ry), nz = Math.cos(ry);
  K.add('ads', H.atlasQuad(w, h, adUV(ad), { x: x + nx * 0.03, y, z: z + nz * 0.03, ry }), H.atlasQuad(w, h, adUV(ad + 7), { x: x - nx * 0.03, y, z: z - nz * 0.03, ry: ry + Math.PI }));
  const tx = Math.cos(ry), tz = -Math.sin(ry);
  for (const s of [-1, 1]) K.add('neon', H.box(0.07, h + 0.14, 0.07, { x: x + tx * s * (w / 2 + 0.04), y, z: z + tz * s * (w / 2 + 0.04), color: frame }));
  K.add('neon', H.box(Math.abs(tx) * (w + 0.15) + 0.07, 0.07, Math.abs(tz) * (w + 0.15) + 0.07, { x, y: y + h / 2 + 0.04, z, color: frame }), H.box(Math.abs(tx) * (w + 0.15) + 0.07, 0.07, Math.abs(tz) * (w + 0.15) + 0.07, { x, y: y - h / 2 - 0.04, z, color: frame }));
}
// Light reflected on the water at height wy off the faces in `which`: columns of broken dashes trailing
// out from the wall, bright near it and fading (a static shimmer: wide along the wall, thin across).
function reflect(K, H, w, d, wy, c0, c1, rng, which = [0, 1, 2, 3], reach = 8, every = 2) {
  const fs = H.faces(w, d);
  for (const i of which) {
    const f = fs[i], n = Math.max(1, Math.floor(f.width / every));
    for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * f.width / n;
      for (let r = 0.4 + rng() * 0.5; r < reach; r += 0.7 + rng() * 0.9) {
        const t = r / reach;
        if (rng() < 0.25 + t * 0.45) continue;
        const dw = (0.8 + rng() * 1.3) * (1 - t * 0.45), dd = 0.3 + rng() * 0.5;
        _c.set(c0).lerp(_b.set(c1), t * 0.8);
        K.add('glow', H.box(f.tx ? dw : dd, 0.02, f.tz ? dw : dd, { x: f.nx * (f.half + r) + f.tx * (off + (rng() - 0.5) * 0.6), y: wy, z: f.nz * (f.half + r) + f.tz * (off + (rng() - 0.5) * 0.6), color: _c.getHex() }));
      }
    }
  }
}
// An LED wrap: rows of light bars running round a w × d facade from y0 down to y1, each row's bars
// shifted a little along the perimeter so they spiral round the tower (a scrolling ticker, frozen).
// o: step (row spacing), len (bar length), period (spacing of bars along the perimeter), shift (per row),
// h (bar height), color(row) → hex.
function ledWrap(K, H, w, d, y0, y1, o) {
  const P = 2 * (w + d), step = o.step ?? 2.4, len = o.len ?? 6, period = o.period ?? P / 3, shift = o.shift ?? 1.2, h = o.h ?? 0.35, out = o.out ?? 0.07;
  const sides = [[w, (s) => [-w / 2 + s, d / 2 + out], 1, 0], [d, (s) => [w / 2 + out, d / 2 - s], 0, 1], [w, (s) => [w / 2 - s, -d / 2 - out], 1, 0], [d, (s) => [-w / 2 - out, -d / 2 + s], 0, 1]];
  const piece = (a, b, y, color) => { // [a, b) along the perimeter, cut at the corners
    let c = 0;
    for (const [L, at, ax, az] of sides) {
      const lo = Math.max(a, c), hi = Math.min(b, c + L);
      if (hi - lo > 0.05) { const [x, z] = at((lo + hi) / 2 - c); K.add('glow', H.box(ax ? hi - lo : 0.08, h, az ? hi - lo : 0.08, { x, y, z, color })); }
      c += L;
    }
  };
  let row = 0;
  for (let y = y0; y > y1; y -= step, row++) {
    const color = o.color(row);
    if (!color) continue;
    for (let s0 = (row * shift) % period; s0 < P; s0 += period) { piece(s0, Math.min(P, s0 + len), y, color); if (s0 + len > P) piece(0, s0 + len - P, y, color); }
  }
}
const GOLD_LO = '#ffd27a', GOLD_HI = '#9a5a26', LED_GOLD = '#ffc640';

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
  const wl = -p.h, lit = (th.night || 0) > 0.5; // the waterline, in the platform's frame; floodlit after dark
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: stone }));
  K.add('flat', H.box(w + 0.3, 3.2, d + 0.3, { y: wl + 1.2, color: shade(stone, 0.62) })); // rusticated base, flood-stained
  K.add('flat', H.box(w + 0.32, 0.25, d + 0.32, { y: wl + 0.2, color: '#3a4a3a' }));
  K.add(lit ? 'glow' : 'flat', H.box(w + 0.9, 0.55, d + 0.9, { y: -0.75, color: lit ? '#ffe2a2' : shade(stone, 1.12) })); // cornice (lit: the gold outline under the roof)
  K.add('flat', H.box(w + 0.5, 0.3, d + 0.5, { y: -1.2, color: shade(stone, 0.7) }));
  K.add(lit ? 'glow' : 'flat', H.box(w + 0.4, 0.35, d + 0.4, { y: -4.6, color: lit ? '#f4b45a' : shade(stone, 1.05) })); // string course
  balustrade(K, H, w, d, shade(stone, 1.1));
  windows(K, H, w, d, -2.7, wl + 3.5, rng, 0.18 + (th.night || 0) * 0.6);
  if (lit) { // the floodlights: a row of lamps along the base throwing a gold wash up every face
    wash(K, H, w, d, wl + 2.8, -1.35, '#ffc66e', '#6a3c22');
    reflect(K, H, w + 0.3, d + 0.3, wl + 0.4, '#ffd27a', '#4a2c1a', rng, [0, 1, 2, 3], 8);
    for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 1.5; o < f.width / 2; o += 3.5) K.add('glow', H.box(f.tx ? 0.6 : 0.3, 0.25, f.tz ? 0.6 : 0.3, { x: f.nx * (f.half + 0.3) + f.tx * o, y: wl + 2.95, z: f.nz * (f.half + 0.3) + f.tz * o, color: '#fff6dc' }));
  }
  // engaged columns on the wide faces: a two-storey colonnade under the cornice (uplit at night)
  for (const f of H.faces(w, d)) {
    if (f.width < 12) continue;
    const n = Math.floor(f.width / 2.6);
    for (let k = 1; k < n; k++) {
      const off = -f.width / 2 + k * f.width / n, x = f.nx * (f.half + 0.12) + f.tx * off, z = f.nz * (f.half + 0.12) + f.tz * off;
      if (lit) K.add('glow', grad(H.cyl(0.32, 0.36, 6.4, 6, { x, y: -5.1, z }), -8.3, -1.9, '#fff2cc', '#c88a48'), H.box(0.9, 0.35, 0.9, { x, y: -1.75, z, color: '#ffe0a0' }));
      else K.add('flat', H.cyl(0.32, 0.36, 6.4, 6, { x, y: -5.1, z, color: shade(stone, 1.15) }), H.box(0.9, 0.35, 0.9, { x, y: -1.75, z, color: shade(stone, 1.2) }));
    }
  }
  // a doorway and a flagpole on the biggest ones; a rooftop mast; a neon blade on some river fronts
  if (w * d > 300) {
    const f = H.faces(w, d)[2];
    K.add(lit ? 'glow' : 'flat', H.box(0.2, 3.4, 3, { x: f.nx * (f.half + 0.05), y: wl + 4.8, color: lit ? '#ffb85a' : '#2a221a' }));
    K.add('flat', H.cyl(0.07, 0.07, 6, 4, { x: -w / 2 + 1, y: 3, z: -d / 2 + 1, color: '#3a3a3a' }));
    K.add('glow', H.box(1.6, 1, 0.05, { x: -w / 2 + 1.85, y: 5.4, z: -d / 2 + 1, color: '#e0303a' }));
    mast(K, H, -w / 2 + 1.2, d / 2 - 1.2, 0, 5 + rng() * 4);
  }
  if (lit && t % 3 === 1) { // a vertical neon sign on the river front, readable from the promenade
    const f = H.faces(w, d)[2], cell = Math.floor(rng() * SIGN_COLS), r = [cell / SIGN_COLS, 0, (cell + 1) / SIGN_COLS, 1], off = (rng() - 0.5) * (f.width - 6);
    const bx = f.nx * (f.half + 1.3), bz = off, y = -6.5;
    K.add('flat', H.box(2.4, 8.4, 0.25, { x: bx, y, z: bz, color: '#15151c' }));
    K.add('signs', H.atlasQuad(2.1, 8, r, { x: bx, y, z: bz + 0.14 }), H.atlasQuad(2.1, 8, r, { x: bx, y, z: bz - 0.14, ry: Math.PI }));
    K.add('neon', H.box(2.5, 0.1, 0.32, { x: bx, y: y + 4.25, z: bz, color: '#ff2b8a' }), H.box(2.5, 0.1, 0.32, { x: bx, y: y - 4.25, z: bz, color: '#ff2b8a' }));
  }
}

function portico(K, p, th, rng, H) {
  const { w, d, thick: T } = p, stone = STONE[2], wl = -p.h, lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: shade(stone, 0.92) }));
  K.add(lit ? 'glow' : 'flat', H.box(w + 0.6, 0.5, d + 0.6, { y: -0.6, color: lit ? '#ffe2a2' : shade(stone, 1.15) }));
  K.add('flat', H.box(w + 0.35, 0.3, d + 0.35, { y: -1.05, color: shade(stone, 0.75) }));
  balustrade(K, H, w, d, shade(stone, 1.1));
  if (lit) wash(K, H, w, d, wl + 1.4, -1.25, '#ffc66e', '#6a3c22', [0, 1, 3]);
  if (lit) reflect(K, H, w + 0.3, d + 0.3, wl + 0.4, '#ffd27a', '#4a2c1a', rng, [0, 1, 2], 3, 2.2);
  // columns across the front (+x, toward the promenade) and a doorway between them (lit at night)
  const n = Math.max(2, Math.floor(d / 2.4)), colH = -1.2 - (wl + 1);
  for (let k = 0; k <= n; k++) {
    const z = -d / 2 + 0.5 + k * (d - 1) / n;
    if (lit) K.add('glow', grad(H.cyl(0.34, 0.4, colH, 8, { x: w / 2 + 0.1, y: wl + 1 + colH / 2, z }), wl + 1, -1.2, '#fff6dc', '#d0965a'), H.box(0.95, 0.35, 0.95, { x: w / 2 + 0.1, y: -1.4, z, color: '#ffe8b8' }));
    else K.add('flat', H.cyl(0.34, 0.4, colH, 8, { x: w / 2 + 0.1, y: wl + 1 + colH / 2, z, color: '#f0e6d0' }), H.box(0.95, 0.35, 0.95, { x: w / 2 + 0.1, y: -1.4, z, color: '#f4ecdc' }));
  }
  K.add(lit ? 'glow' : 'flat', H.box(0.15, colH - 1.5, d - 2, { x: w / 2 + 0.03, y: wl + 1 + (colH - 1.5) / 2, color: lit ? '#7a4a26' : '#3a2e22' }));
  K.add('flat', H.box(w + 0.3, 1.6, d + 0.3, { y: wl + 0.6, color: shade(stone, 0.6) }));
}

// The copper dome: a columned stone drum, copper tiers (each flaring out a little) and a lantern.
function copperDrum(K, p, th, rng, H) {
  const r = p.r, T = p.thick, n = H.seg(20, 14), lit = (th.night || 0) > 0.5;
  K.add('flat', H.cyl(r, r, T, n, { y: -T / 2, color: STONE[2] }));
  K.add('flat', H.cyl(r + 0.25, r + 0.25, 0.4, n, { y: -0.2, color: COPPER }));
  if (lit) K.add('neon', H.part(new THREE.TorusGeometry(r + 0.3, 0.08, 3, n), { rx: Math.PI / 2, y: -0.02, color: LED_GOLD }));
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * TAU, x = Math.cos(a) * (r + 0.15), z = Math.sin(a) * (r + 0.15);
    if (lit) K.add('glow', grad(H.cyl(0.22, 0.25, T - 0.4, 5, { x, y: -T / 2 - 0.2, z }), -T, 0, '#fff4d8', '#d09a58'));
    else K.add('flat', H.cyl(0.22, 0.25, T - 0.4, 5, { x, y: -T / 2 - 0.2, z, color: '#f2e8d4' }));
  }
  for (let k = 0; k < 14; k++) { const a = (k + 0.5) / 14 * TAU; K.add('glow', H.box(0.7, 1.4, 0.7, { x: Math.cos(a) * (r - 0.25), y: -T / 2 - 0.2, z: Math.sin(a) * (r - 0.25), color: '#ffd28a' })); }
}
function copperDome(K, p, th, rng, H) {
  const r = p.r, T = p.thick, n = H.seg(20, 14), lit = (th.night || 0) > 0.5;
  K.add('flat', H.cyl(r, r + 0.7, T, n, { y: -T / 2, color: p.tint === 1 ? COPPER_DK : COPPER }));
  K.add('flat', H.cyl(r + 0.08, r + 0.08, 0.18, n, { y: -0.09, color: COPPER_HI }));
  if (lit) K.add('neon', H.part(new THREE.TorusGeometry(r + 0.1, 0.08, 3, n), { rx: Math.PI / 2, y: -0.02, color: '#6affd0' })); // the lip in light: footing
  const ribs = Math.round(r * 2.2);
  for (let k = 0; k < ribs; k++) { const a = k / ribs * TAU; K.add(lit ? 'glow' : 'flat', H.box(0.16, T, 0.2, { x: Math.cos(a) * (r + 0.36), y: -T / 2, z: Math.sin(a) * (r + 0.36), ry: -a, rz: 0.19 * Math.cos(0), color: lit ? '#ffcf60' : GOLD })); }
}
function copperLantern(K, p, th, rng, H) {
  const r = p.r, T = p.thick;
  K.add('flat', H.cyl(r + 0.3, r + 0.5, 0.5, 10, { y: -0.25, color: COPPER_DK }));
  K.add('glow', H.cyl(r - 0.6, r - 0.6, T - 0.5, 8, { y: -T / 2 - 0.25, color: '#ffe6a0' }));
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; K.add('flat', H.cyl(0.14, 0.14, T - 0.5, 4, { x: Math.cos(a) * (r - 0.25), y: -T / 2 - 0.25, z: Math.sin(a) * (r - 0.25), color: '#f4ecdc' })); }
  K.add('flat', H.cyl(r + 0.2, r + 0.2, 0.3, 10, { y: -T + 0.15, color: COPPER }));
  if ((th.night || 0) > 0.5) K.add('neon', H.part(new THREE.TorusGeometry(r + 0.42, 0.07, 3, 12), { rx: Math.PI / 2, y: -0.05, color: '#6affd0' }));
}

function clockTower(K, p, th, rng, H) {
  const { w, d, thick: T } = p, stone = STONE[0], lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: stone }));
  if (lit) { // floodlit shaft, a gold LED outline round the top, a beacon mast
    wash(K, H, w - 2.4, d - 2.4, -T, -0.9, '#ffc66e', '#7a4a26', [0, 1, 2, 3], 1.22);
    edgeLED(K, H, w + 0.8, d + 0.8, -0.32, LED_GOLD, { t: 0.12 });
    mast(K, H, w / 2 - 1.3, -d / 2 + 1.3, 0, 7);
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    if (lit) K.add('glow', grad(H.box(1.2, T, 1.2, { x: sx * (w / 2 - 0.3), y: -T / 2, z: sz * (d / 2 - 0.3) }), -T, 0, '#fff0c8', '#c88a48')); // corner piers, uplit
    else K.add('flat', H.box(1.2, T, 1.2, { x: sx * (w / 2 - 0.3), y: -T / 2, z: sz * (d / 2 - 0.3), color: shade(stone, 1.12) })); // corner piers
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
  if ((th.night || 0) > 0.5) { edgeLED(K, H, w + 0.15, d + 0.15, -0.16, LED_GOLD, { t: 0.09 }); K.add('glow', H.box(w * (long ? 0.9 : 0.5), 0.12, d * (long ? 0.5 : 0.9), { y: -T - 0.86, color: '#fff0c8' })); } // edge LEDs, an uplight under the bracket
}

function copperPyramid(K, p, th, rng, H) {
  const { w, thick: T } = p, R = (w / 2) * Math.SQRT2, R1 = (w / 2 + 1) * Math.SQRT2, lit = (th.night || 0) > 0.5;
  K.add('flat', H.cyl(R, R1, T, 4, { y: -T / 2, ry: Math.PI / 4, color: p.tint === 1 ? COPPER_HI : COPPER }));
  K.add(lit ? 'neon' : 'flat', H.cyl(R + 0.05, R + 0.05, 0.15, 4, { y: -0.075, ry: Math.PI / 4, color: lit ? LED_GOLD : GOLD }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add(lit ? 'neon' : 'flat', H.box(0.2, T * 1.05, 0.2, { x: sx * (w / 2 + 0.5), y: -T / 2, z: sz * (w / 2 + 0.5), rx: -sz * 0.27, rz: sx * 0.27, color: lit ? '#6affd0' : COPPER_DK })); // the ridges, drawn in light at night
  if (p.tint === 1) K.add('flat', H.cyl(0.04, 0.2, 2.2, 4, { x: w / 2 - 0.3, y: 1.1, z: w / 2 - 0.3, color: GOLD }));
  if (p.tint === 1 && lit) mast(K, H, -w / 2 + 0.4, -w / 2 + 0.4, 0, 6);
}

function pontoon(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T + 0.4, d, { y: -(T + 0.4) / 2, color: '#2a3550' }), H.box(w - 0.1, 0.12, d - 0.1, { y: -0.06, color: '#8a909a' }));
  K.add('hazard', H.box(w, 0.04, 0.35, { y: 0.01, z: -d / 2 + 0.2 }), H.box(w, 0.04, 0.35, { y: 0.01, z: d / 2 - 0.2 }));
  K.add('neon', H.box(w + 0.1, 0.12, d + 0.1, { y: -T + 0.6, color: '#2be8ff' }));
  edgeLED(K, H, w, d, -0.14, '#2be8ff', { t: 0.08, out: 0.04 }); // the deck edge, lit
  reflect(K, H, w, d, -p.h + 0.4, '#2be8ff', '#14204a', rng, [0, 1, 2, 3], 4, 3);
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 2; o < f.width / 2 - 1; o += 4) K.add('glow', H.box(f.tx ? 0.5 : 0.12, 0.12, f.tz ? 0.5 : 0.12, { x: f.nx * (f.half + 0.05) + f.tx * o, y: -T + 1.3, z: f.nz * (f.half + 0.05) + f.tz * o, color: '#fff2c0' })); // portholes
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
  edgeLED(K, H, w - 1, d - 0.4, -0.1, col === '#c8302a' ? '#ffb02a' : '#2be8ff', { t: 0.08, out: 0.02 }); // the sun deck's edge in light
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
  edgeLED(K, H, w - 0.2, d - 0.2, -0.08, '#fff0c8', { t: 0.08, out: 0.04 });
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
  edgeLED(K, H, w + 0.2, d + 0.2, -0.17, '#ff2bd6', { t: 0.08, out: 0.03 });
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
  if ((th.night || 0) > 0.5) {
    // the river rail lit gold, an LED line along the flood wall's lip, light seams in the paving
    K.add('glow', H.box(0.27, 0.06, d, { x: rx, y: 1.04, color: '#ffd890' }));
    reflect(K, H, w + 0.1, d, wl + 0.4, '#fff0c8', '#2a3a6a', rng, [2], 11, 2); reflect(K, H, w + 0.1, d, wl + 0.4, '#ffc66e', '#4a3020', rng, [3], 3, 3);
    for (const sx of [-1, 1]) K.add('neon', H.box(0.1, 0.1, d + 0.1, { x: sx * (w / 2 + 0.06), y: -0.12, color: sx > 0 ? '#2be8ff' : LED_GOLD }));
    K.add('neon', H.box(w + 0.1, 0.1, 0.1, { y: -0.12, z: -d / 2 - 0.06, color: LED_GOLD }), H.box(w + 0.1, 0.1, 0.1, { y: -0.12, z: d / 2 + 0.06, color: LED_GOLD }));
    for (let z = -d / 2 + 6; z < d / 2 - 2; z += 12) K.add('glow', H.box(w - 3, 0.02, 0.14, { x: -0.6, y: 0.005, z, color: '#7fe8ff' }));
    // holographic ad totems on the land side, between the flower beds
    for (let z = -d / 2 + 12; z < d / 2 - 6; z += 16) holoAd(K, H, -w / 2 + 1.0, z, 0, 2.2, 1.4, (p.tint * 5 + (z | 0)) & 63, Math.PI / 2, p.tint % 2 ? '#ff2bd6' : '#2be8ff');
  }
}

// ------------------------------------------------------------------ Pudong (stage 2)
function glassBlock(K, H, w, h, d, y, tint, u0 = 0) {
  const g = H.meterBox(w, h, d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], color: tint, u0 });
  g.translate(0, y, 0);
  K.add('facade', g);
}
// the SWFC's LED wrap: blue-white bars spiralling up the slab
const SWFC_LED = (row) => (row % 9 === 0 ? '#ffffff' : ['#9fe8ff', '#4ab0ff', '#2b6aff', null, '#7fd8ff', '#c8f4ff'][row % 6]);
function swfc(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, lit ? '#8aa0c8' : '#c8d6e6');
  K.add('flat', H.box(w + 0.1, 0.4, d + 0.1, { y: -0.2, color: '#e8eef4' }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add(lit ? 'glow' : 'flat', H.box(0.5, T, 0.5, { x: sx * (w / 2), y: -T / 2, z: sz * (d / 2), color: lit ? '#d8f4ff' : '#eef2f6' }));
  if (lit) ledWrap(K, H, w, d, -3, -72, { step: 1.8, len: 7, period: (w + d) / 2, shift: 1.6, h: 0.42, color: SWFC_LED });
  else for (let y = -6; y > -60; y -= 12) K.add('neon', H.box(w + 0.3, 0.2, d + 0.3, { y, color: '#7fd8ff' }));
  if (p.style === 'swfc') { // the sky deck floor inside the ring: a glowing glass strip
    K.add('glow', H.box(w - 12, 0.04, 2, { y: 0.02, color: '#9fe8ff' }));
    K.add('hazard', H.box(w - 10, 0.04, 0.3, { y: 0.03, z: -d / 2 + 0.3 }), H.box(w - 10, 0.04, 0.3, { y: 0.03, z: d / 2 - 0.3 }));
    if (lit) edgeLED(K, H, w + 0.1, d + 0.1, -0.42, '#ffffff', { t: 0.12 });
  }
}
function swfcPillar(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, lit ? '#8aa0c8' : '#c8d6e6', 3);
  for (const sz of [-1, 1]) K.add('flat', H.box(w + 0.2, T, 0.4, { y: -T / 2, z: sz * d / 2, color: '#eef2f6' }));
  if (lit) { // the hole's jambs drawn in light
    for (const sx of [-1, 1]) K.add('glow', H.box(0.14, T, 0.14, { x: sx * (w / 2 + 0.05), y: -T / 2, z: d / 2 + 0.22, color: '#9fe8ff' }), H.box(0.14, T, 0.14, { x: sx * (w / 2 + 0.05), y: -T / 2, z: -d / 2 - 0.22, color: '#9fe8ff' }));
    for (let y = -1.5; y > -T; y -= 1.8) K.add('glow', H.box(w + 0.12, 0.3, 0.1, { y, z: d / 2 + 0.22, color: SWFC_LED(Math.round(-y / 1.8)) || '#2b6aff' }), H.box(w + 0.12, 0.3, 0.1, { y, z: -d / 2 - 0.22, color: SWFC_LED(Math.round(-y / 1.8) + 3) || '#2b6aff' }));
  }
}
function swfcTop(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, lit ? '#9ab0d0' : '#d6e2ee', 5);
  K.add('flat', H.box(w, 0.2, d, { y: -0.1, color: '#9aa4b0' }), H.box(w + 0.3, 0.5, d + 0.3, { y: -T + 0.25, color: '#eef2f6' }));
  K.add('glow', H.box(w - 2, 0.05, 1.6, { y: 0.02, color: '#9fe8ff' }));
  balustrade(K, H, w, d, '#e8eef4', 1.0, 2);
  K.add('glow', H.box(0.5, 0.5, 0.5, { x: w / 2 - 0.5, y: 1.4, z: d / 2 - 0.5, color: '#ff2a2a' }), H.box(0.5, 0.5, 0.5, { x: -w / 2 + 0.5, y: 1.4, z: -d / 2 + 0.5, color: '#ff2a2a' }));
  if (lit) { // the top beam outlined in white light; the hole's lit lintel under it
    edgeLED(K, H, w + 0.1, d + 0.1, -0.25, '#ffffff', { t: 0.14 });
    edgeLED(K, H, w + 0.3, d + 0.3, -T + 0.05, '#9fe8ff', { t: 0.12 });
    ledWrap(K, H, w, d, -1.2, -T + 0.6, { step: 1.1, len: 9, period: (w + d) / 2, shift: 3, h: 0.3, color: SWFC_LED });
    mast(K, H, w / 2 - 1.5, 0, 0, 9); mast(K, H, -w / 2 + 1.5, 0, 0, 9);
  }
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
  edgeLED(K, H, w, d, -0.3, p.tint === 1 ? '#2be8ff' : '#ffb02a', { t: 0.1, out: 0.04 }); // the cradle's edge
  K.add('glow', H.box(w * 0.7, 0.12, d * 0.6, { y: -1.25, color: '#fff4d0' })); // a work light under it
}
function skybridge(K, p, th, rng, H) {
  const { w, d } = p, c = p.tint ? '#ff2bd6' : '#2be8ff';
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: '#8a94a4' }), H.box(w + 0.1, 0.4, d, { y: -2.7, color: '#4a5260' }));
  K.add('glass', H.box(w - 0.1, 2.0, d - 0.1, { y: -1.4 }));
  for (let z = -d / 2; z <= d / 2; z += 3) K.add('flat', H.box(w + 0.2, 2.8, 0.25, { y: -1.4, z, color: '#dfe5ec' }));
  K.add('neon', H.box(0.1, 0.1, d, { x: w / 2 + 0.06, y: -0.1, color: c }), H.box(0.1, 0.1, d, { x: -w / 2 - 0.06, y: -0.1, color: c }));
  if ((th.night || 0) > 0.5) { // light under the deck, a lit strip down the walk
    K.add('neon', H.box(0.12, 0.12, d, { x: w / 2 + 0.08, y: -2.9, color: c }), H.box(0.12, 0.12, d, { x: -w / 2 - 0.08, y: -2.9, color: c }));
    for (let z = -d / 2 + 1.5; z < d / 2; z += 3) K.add('glow', H.box(w - 1.2, 0.02, 0.12, { y: 0.01, z, color: '#bfefff' }));
  }
}
function jinmao(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, '#8e95a6', 7);
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 1; o < f.width / 2; o += 2) K.add('flat', H.box(f.tx ? 0.15 : 0.3, Math.min(T, 160), f.tz ? 0.15 : 0.3, { x: f.nx * (f.half + 0.1) + f.tx * o, y: -Math.min(T, 160) / 2, z: f.nz * (f.half + 0.1) + f.tz * o, color: '#c8ccd6' }));
  for (let y = -0.4; y > -70; y -= 8) K.add(lit ? 'glow' : 'flat', H.box(w + 0.8, 0.35, d + 0.8, { y, color: lit ? (y > -1 ? '#ffe2a0' : '#ffb84a') : '#c8a85a' }));
  if (lit) for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', grad(H.box(0.4, 70, 0.4, { x: sx * (w / 2 + 0.25), y: -35, z: sz * (d / 2 + 0.25) }), -70, 0, '#5a2a10', '#ffd890')); // gold corner lines, brightest at the top
}
function jinmaoTier(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, '#8e95a6', 7);
  K.add(lit ? 'glow' : 'flat', H.box(w + 0.7, 0.4, d + 0.7, { y: -0.3, color: lit ? '#ffd27a' : '#d8b860' }));
  K.add('flat', H.cyl((w / 2 + 0.5) * Math.SQRT2, (w / 2) * Math.SQRT2, 0.8, 4, { y: -0.9, ry: Math.PI / 4, color: '#a8acb8' }));
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 0.6; o < f.width / 2; o += 1.4) K.add('flat', H.box(f.tx ? 0.12 : 0.22, T - 1.2, f.tz ? 0.12 : 0.22, { x: f.nx * (f.half + 0.08) + f.tx * o, y: -T / 2 - 0.6, z: f.nz * (f.half + 0.08) + f.tz * o, color: '#c8ccd6' }));
  K.add('neon', H.box(w + 0.75, 0.08, d + 0.75, { y: -0.05, color: '#ffd23a' }));
  if (lit) { // the setback's corners flare up in gold, an uplight wash under each eave
    wash(K, H, w, d, -T + 0.2, -1.2, '#ffb84a', '#4a2a1a', [0, 1, 2, 3], 0.2);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: sx * (w / 2 + 0.2), y: 0.15, z: sz * (d / 2 + 0.2), color: '#fff0c0' }));
  }
}
function jinmaoSpire(K, p, th, rng, H) {
  const T = p.thick, lit = (th.night || 0) > 0.5;
  if (lit) K.add('glow', grad(H.cyl(0.05, p.r + 0.1, T, 6, { y: -T / 2 }), -T, 0, '#ffd890', '#ffffff'));
  else K.add('flat', H.cyl(0.05, p.r + 0.1, T, 6, { y: -T / 2, color: '#d8dce4' }));
  for (let y = -2; y > -T + 1; y -= 2.2) K.add(lit ? 'neon' : 'flat', H.cyl(p.r * 1.6, p.r * 1.6, 0.2, 6, { y, color: lit ? '#ffc640' : '#b8bcc8' }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 0.15, color: '#ff2a2a' }));
}
function twistBase(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, '#a8d0d0', 2);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add(lit ? 'glow' : 'flat', H.box(0.6, T, 0.6, { x: sx * w / 2, y: -T / 2, z: sz * d / 2, color: lit ? '#c8ffff' : '#e8f0f0' }));
}
// A big holographic ad hung on a facade (face f, offset along it, centre height y), framed in neon.
function holoSign(K, H, f, off, y, w, h, ad, frame) {
  const x = f.nx * (f.half + 0.35) + f.tx * off, z = f.nz * (f.half + 0.35) + f.tz * off;
  K.add('ads', H.atlasQuad(w, h, adUV(ad), { x, y, z, ry: f.ry }));
  K.add('neon', H.box(f.tx ? w + 0.3 : 0.1, 0.1, f.tz ? w + 0.3 : 0.1, { x, y: y + h / 2 + 0.08, z, color: frame }), H.box(f.tx ? w + 0.3 : 0.1, 0.1, f.tz ? w + 0.3 : 0.1, { x, y: y - h / 2 - 0.08, z, color: frame }));
}
function twistPlate(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lobby = p.style === 'twistLobby', lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, lobby ? '#bfe0dc' : '#a8d0d0', (p.tint * 3) % 16);
  K.add('flat', H.box(w + 0.15, 0.3, d + 0.15, { y: -0.15, color: '#eef6f4' })); // the floor slab's edge
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 1.6; o < f.width / 2 - 0.5; o += 3.2) K.add('flat', H.box(f.tx ? 0.12 : 0.16, T - 0.3, f.tz ? 0.12 : 0.16, { x: f.nx * (f.half + 0.06) + f.tx * o, y: -T / 2 - 0.15, z: f.nz * (f.half + 0.06) + f.tz * o, color: '#dce8e6' }));
  if (lit) edgeLED(K, H, w + 0.15, d + 0.15, -0.34, (p.tint % 4) === 0 ? '#ffffff' : '#7ff6ff', { t: 0.09, out: 0.04 }); // each floor's edge drawn in light: the spiral reads at night
  // the corners are the way up: a lamp on each, and a stripe down the edge
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    K.add('glow', H.box(0.35, 0.35, 0.35, { x: sx * (w / 2 - 0.3), y: 0.17, z: sz * (d / 2 - 0.3), color: lobby ? '#ffd23a' : '#7ff6ff' }));
    K.add('neon', H.box(0.2, T - 0.4, 0.2, { x: sx * (w / 2 + 0.02), y: -T / 2, z: sz * (d / 2 + 0.02), color: '#2be8ff' }));
  }
  if (lobby) {
    K.add('neon', H.box(w + 0.3, 0.15, d + 0.3, { y: -T + 0.5, color: '#2be8ff' })); balustrade(K, H, w, d, '#e8f0f0', 1.0, 2.2);
    if (lit) for (const i of [0, 2]) { const f = H.faces(w, d)[i]; holoSign(K, H, f, f.width * 0.3, -T / 2 - 0.2, 7, 3.2, 33 + i, '#2be8ff'); }
  }
}
function twistCrown(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  glassBlock(K, H, w, T, d, -T / 2, '#c8e6e2', 9);
  K.add('flat', H.box(w + 0.2, 0.3, d + 0.2, { y: -0.15, color: '#eef6f4' }));
  for (const f of H.faces(w, d)) for (let o = -f.width / 2; o <= f.width / 2 + 0.01; o += f.width / 6) { // the open crown: fins rising round the edge (lit white at night)
    const hgt = 3 + 2.5 * Math.cos(o / f.width * Math.PI), at = { x: f.nx * (f.half + 0.2) + f.tx * o, y: hgt / 2, z: f.nz * (f.half + 0.2) + f.tz * o };
    if (lit) K.add('glow', grad(H.box(f.tx ? 0.3 : 0.6, hgt, f.tz ? 0.3 : 0.6, at), 0, hgt, '#4ab8ff', '#ffffff'));
    else K.add('flat', H.box(f.tx ? 0.3 : 0.6, hgt, f.tz ? 0.3 : 0.6, { ...at, color: '#e8f2f0' }));
  }
  K.add('neon', H.box(w + 0.5, 0.14, d + 0.5, { y: -0.4, color: '#2be8ff' }));
  if (lit) mast(K, H, w / 2 - 1, d / 2 - 1, 0, 8);
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
  K.add('neon', H.box(w - 2, 0.08, 0.08, { y: -0.06, z: -1.26, color: '#2be8ff' }), H.box(w - 2, 0.08, 0.08, { y: -0.06, z: 1.26, color: '#2be8ff' })); // the catwalk's edges
  K.add('neon', H.box(w * 0.62, 0.12, 0.12, { y: -R * 1.65, z: R * 0.7, color: '#2be8ff' }), H.box(w * 0.62, 0.12, 0.12, { y: -R * 1.65, z: -R * 0.7, color: '#2be8ff' }));
}

// ------------------------------------------------------------------ the old town (stage 3)
// A festoon of little lights strung along a w × d edge at height y, sagging between the corners.
function festoon(K, H, w, d, y, sag, cols, every = 0.7, r = 0.11) {
  for (const f of H.faces(w, d)) {
    const n = Math.max(2, Math.round(f.width / every));
    for (let k = 0; k <= n; k++) {
      const t = k / n, off = -f.width / 2 + t * f.width;
      K.add('glow', H.box(r * 2, r * 2, r * 2, { x: f.nx * (f.half + 0.05) + f.tx * off, y: y - sag * Math.sin(t * Math.PI), z: f.nz * (f.half + 0.05) + f.tz * off, color: cols[k % cols.length] }));
    }
  }
}
function stoneBank(K, p, th, rng, H) {
  const { w, d, thick: T } = p, wl = -p.h, plaza = p.style === 'stonePlaza', lit = (th.night || 0) > 0.5;
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
    if (((o / 6) | 0) % 2) { K.add('flat', H.box(0.4, 0.5, 0.4, { x, y: 0.25, z, color: '#6a6870' })); if (lit) K.add('glow', H.box(0.42, 0.08, 0.42, { x, y: 0.42, z, color: '#ffb050' })); continue; } // a bollard (a lit cap at night)
    K.add('flat', H.cyl(0.07, 0.09, 2.6, 4, { x, y: 1.3, z, color: '#2a1a14' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.32, 6, 4), { x, y: 2.75, z, sy: 1.3, color: '#ff3a24' }));
  }
  if (lit) { // the bank's edge in warm light, the lanterns trembling on the canal
    edgeLED(K, H, w, d, -0.14, '#ffb050', { t: 0.08, out: 0.04 });
    reflect(K, H, w + 0.1, d + 0.1, wl + 0.4, '#ff6a3a', '#2a1030', rng, [0, 1, 2, 3], 4, 3);
    if (plaza) for (const r of [12, 18, 24]) K.add('glow', H.part(new THREE.RingGeometry((r - 0.15) * Math.SQRT2, r * Math.SQRT2, 4, 1), { rx: -Math.PI / 2, rz: Math.PI / 4, y: 0.01, z: -3, color: '#ffb050' })); // lit squares round the pagoda
  }
}
function garden(K, p, th, rng, H) {
  const { w, d, thick: T } = p, wl = -p.h, lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T - 0.1, d, { y: -T / 2 - 0.05, color: '#6a6870' }), H.box(w - 0.6, 0.12, d - 0.6, { y: -0.04, color: '#2f5a34' }));
  K.add('flat', H.box(w + 0.1, 0.5, d + 0.1, { y: wl + 0.25, color: '#2e3a30' }));
  for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width : 0.3, 0.2, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: 0.0, z: f.nz * (f.half - 0.15), color: '#9a98a0' }));
  for (let i = 0; i < 14; i++) { // shrubs and flowers round the edge
    const a = rng() * TAU, x = Math.cos(a) * (w / 2 - 1.2), z = Math.sin(a) * (d / 2 - 1.2);
    K.add('flat', H.part(new THREE.IcosahedronGeometry(0.7 + rng() * 0.5, 0), { x, y: 0.4, z, sy: 0.7, color: '#1f4a28' }));
    if (rng() < 0.5) K.add('glow', H.box(0.2, 0.2, 0.2, { x: x + 0.3, y: 0.85, z, color: rng() < 0.5 ? '#ff7ab0' : '#ffe07a' }));
  }
  for (const [sx, sz] of [[1, 1], [-1, -1]]) { // weeping willows at two corners (uplit at night)
    const x = sx * (w / 2 - 2), z = sz * (d / 2 - 2);
    K.add('flat', H.cyl(0.25, 0.35, 4, 5, { x, y: 2, z, color: '#3a2a1e' }));
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; K.add('flat', H.cyl(0.5, 0.15, 3.4, 4, { x: x + Math.cos(a) * 1.4, y: 3, z: z + Math.sin(a) * 1.4, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3, color: '#4a8a3a' })); }
    K.add('flat', H.part(new THREE.IcosahedronGeometry(1.8, 0), { x, y: 4.6, z, sy: 0.6, color: '#3e7a34' }));
    if (lit) { K.add('glow', H.cyl(0.5, 0.6, 0.12, 6, { x, y: 0.08, z, color: '#7fffb0' })); for (let k = 0; k < 7; k++) { const a = (k + 0.5) / 7 * TAU; K.add('glow', H.box(0.12, 0.12, 0.12, { x: x + Math.cos(a) * 1.7, y: 2.2 + (k % 3) * 0.5, z: z + Math.sin(a) * 1.7, color: k % 2 ? '#fff0a0' : '#7fffd0' })); } } // fairy lights in the willow
  }
  if (lit) { edgeLED(K, H, w, d, -0.12, '#ffb050', { t: 0.08, out: 0.04 }); reflect(K, H, w + 0.1, d + 0.1, wl + 0.4, '#ff8a4a', '#2a1030', rng, [0, 1, 2, 3], 3, 3); }
}

const HALL_WALL = ['#e6dccb', '#e2d6c2', '#ddd0bc', '#b8382c', '#e6dccb', '#e2d6c2', '#c84a32', '#b8302a'];
function hall(K, p, th, rng, H) {
  const { w, d, thick: T } = p, t = p.tint >= 0 ? p.tint : 0, wall = HALL_WALL[t % 8], red = '#a8231c', lit = (th.night || 0) > 0.5;
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
      if (lit && k % 2 === 0 && T > 3) { // a red lantern hung under the eave in front of every other bay
        const lx = f.nx * (f.half + 0.9) + f.tx * off, lz = f.nz * (f.half + 0.9) + f.tz * off;
        K.add('flat', H.box(0.03, 0.5, 0.03, { x: lx, y: -0.45, z: lz, color: '#1a1010' }));
        K.add('glow', H.part(new THREE.SphereGeometry(0.28, 6, 4), { x: lx, y: -0.95, z: lz, sy: 1.25, color: (k / 2) % 2 ? '#ff4a2a' : '#ff2a3a' }));
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
      if (lit) K.add('neon', H.box(f.tx ? 0.3 : 2.0, 0.1, f.tz ? 0.3 : 2.0, { x: bx, y: -T / 2 + 2.75, z: bz, color: '#ff2bd6' }), H.box(f.tx ? 0.3 : 2.0, 0.1, f.tz ? 0.3 : 2.0, { x: bx, y: -T / 2 - 1.55, z: bz, color: '#2be8ff' }));
    }
    K.add('flat', H.box(f.tx ? f.width * 0.8 : 1.6, 0.12, f.tz ? f.width * 0.8 : 1.6, { x: f.nx * (f.half + 0.8), y: -T + 2.6, z: f.nz * (f.half + 0.8), rx: f.tz ? 0 : 0, color: t === 4 ? '#c83a2a' : '#2a6a5a' }));
    if (lit) K.add('neon', H.box(f.tx ? f.width * 0.8 : 0.08, 0.08, f.tz ? f.width * 0.8 : 0.08, { x: f.nx * (f.half + 1.62), y: -T + 2.56, z: f.nz * (f.half + 1.62), color: '#ffe52b' })); // the awning's lit hem
  } else if (lit && t !== 7 && (t + Math.floor(w)) % 3 === 0) { // a small vertical neon sign on a plain house
    const f = H.faces(w, d)[(t + 1) % 4], cell = Math.floor(rng() * SIGN_COLS), r = [cell / SIGN_COLS, 0, (cell + 1) / SIGN_COLS, 1];
    const bx = f.nx * (f.half + 0.7) + f.tx * f.width * 0.35, bz = f.nz * (f.half + 0.7) + f.tz * f.width * 0.35, h = Math.min(3.2, T - 0.8);
    K.add('flat', H.box(f.tx ? 0.2 : 1.1, h + 0.2, f.tz ? 0.2 : 1.1, { x: bx, y: -T / 2, z: bz, color: '#15151c' }));
    K.add('signs', H.atlasQuad(0.95, h, r, { x: bx + f.tx * 0.11, y: -T / 2, z: bz + f.tz * 0.11, ry: Math.atan2(f.tx, f.tz) }), H.atlasQuad(0.95, h, r, { x: bx - f.tx * 0.11, y: -T / 2, z: bz - f.tz * 0.11, ry: Math.atan2(-f.tx, -f.tz) }));
  }
}

// The curved-eave roof slab: dark tiles on top, a red fascia, upturned corners with a lantern under each.
// At night the fascia is outlined in neon (the roof's edge reads for the jump) and a festoon of little
// lights sags along it.
const TILE = ['#3c3e48', '#34404a', '#3a3a42'], FASCIA = ['#a8231c', '#a8231c', '#e8e0d0'];
function eave(K, p, th, rng, H) {
  const { w, d, thick: T } = p, v = (p.tint >= 0 ? p.tint : 0) & 7, top = (p.tint & 8) !== 0, tile = TILE[v % 3], lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T * 0.7, d, { y: -T * 0.35, color: tile }));
  for (let k = 1; k <= 3; k++) { // tile courses stepping in toward the ridge
    const ins = k * Math.min(w, d) * 0.09;
    for (const f of H.faces(w - ins * 2, d - ins * 2)) K.add('flat', H.box(f.tx ? f.width : 0.16, 0.07, f.tz ? f.width : 0.16, { x: f.nx * (f.half - 0.08), y: 0.02, z: f.nz * (f.half - 0.08), color: shade(tile, 1.35) }));
  }
  K.add('flat', H.box(w + 0.12, T * 0.35, d + 0.12, { y: -T * 0.8, color: FASCIA[v % 3] }));
  K.add(lit ? 'neon' : 'flat', H.box(w + 0.16, 0.08, d + 0.16, { y: -T * 0.6, color: v === 1 ? '#e8b440' : lit ? '#ffc640' : '#d8a23a' }));
  if (lit) {
    edgeLED(K, H, w + 0.12, d + 0.12, -T * 0.98, v === 2 ? '#ffd23a' : '#ff3a3a', { t: 0.1, out: 0.04 });
    edgeLED(K, H, w, d, 0.0, v === 2 ? '#fff0c0' : '#ffb050', { t: 0.07, out: 0.02, key: 'glow' }); // the walkable lip
    festoon(K, H, w + 0.4, d + 0.4, -T - 0.25, 0.45, v === 2 ? ['#ffe07a', '#fff4d0'] : ['#ffcf60', '#ff4a2a', '#ffe07a'], 0.8);
  }
  for (const f of H.faces(w, d)) for (let o = -f.width / 2 + 0.8; o < f.width / 2 - 0.5; o += 1.4) K.add('flat', H.box(f.tx ? 0.3 : 0.5, 0.3, f.tz ? 0.3 : 0.5, { x: f.nx * (f.half - 0.25) + f.tx * o, y: -T - 0.15, z: f.nz * (f.half - 0.25) + f.tz * o, color: (o * 7 | 0) % 2 ? '#2a7a5a' : '#c83a2a' })); // brackets
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * w / 2, z = sz * d / 2, a = Math.atan2(sz, sx);
    K.add('flat', H.box(1.6, 0.3, 0.4, { x: x + sx * 0.3, y: 0.25, z: z + sz * 0.3, ry: -a, rz: 0.5, color: tile })); // the upturned horn
    K.add(lit ? 'glow' : 'flat', H.cyl(0.02, 0.14, 0.7, 4, { x: x + sx * 0.75, y: 0.75, z: z + sz * 0.75, rz: -sx * 0.5, rx: sz * 0.5, color: lit ? '#ffd23a' : '#e8b440' }));
    K.add('flat', H.box(0.04, 0.8, 0.04, { x: x + sx * 0.3, y: -T - 0.4, z: z + sz * 0.3, color: '#1a1010' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.34, 6, 4), { x: x + sx * 0.3, y: -T - 1.05, z: z + sz * 0.3, sy: 1.3, color: '#ff3a24' }));
  }
  if (top && Math.min(w, d) > 6) K.add('flat', H.box(Math.max(w, d) > w ? 0.5 : w * 0.5, 0.35, Math.max(w, d) > w ? d * 0.5 : 0.5, { y: 0.17, color: shade(tile, 0.8) })); // a low ridge
}
function eaveTop(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#3c3e48' }), H.cyl((w / 2 + 0.9) * Math.SQRT2, (w / 2) * Math.SQRT2, T * 0.45, 4, { y: -T * 0.78, ry: Math.PI / 4, color: '#34363f' }));
  K.add(lit ? 'neon' : 'flat', H.box(w + 0.1, 0.12, d + 0.1, { y: -0.06, color: lit ? '#ffc640' : '#d8a23a' }));
  if (lit) K.add('neon', H.cyl((w / 2 + 0.95) * Math.SQRT2, (w / 2 + 0.95) * Math.SQRT2, 0.1, 4, { y: -T + 0.02, ry: Math.PI / 4, color: '#ff3a3a' }));
  K.add('flat', H.cyl(0.08, 0.12, 0.8, 5, { y: 0.4, color: '#d8a23a' }));
  K.add('glow', H.part(new THREE.SphereGeometry(0.3, 6, 4), { y: 0.95, color: '#ffd23a' }));
}
function pagodaCap(K, p, th, rng, H) {
  eaveTop(K, p, th, rng, H);
  const lit = (th.night || 0) > 0.5;
  for (let k = 0; k < 6; k++) K.add(lit ? 'glow' : 'flat', H.cyl(0.45 - k * 0.05, 0.5 - k * 0.05, 0.25, 8, { y: 1.4 + k * 0.5, color: lit ? (k % 2 ? '#ffd23a' : '#ffb030') : '#e8b440' }));
  K.add(lit ? 'glow' : 'flat', H.cyl(0.04, 0.12, 2.6, 5, { y: 5, color: lit ? '#fff0b0' : '#e8b440' }));
  K.add('glow', H.part(new THREE.SphereGeometry(0.35, 6, 4), { y: 4.6, color: '#ffd23a' }));
  if (lit) K.add('glow', H.box(0.3, 0.3, 0.3, { y: 6.4, color: '#ff2a2a' }));
}
function zigBridge(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#a8a49c' }), H.box(w - 0.2, 0.08, d - 0.2, { y: -0.04, color: '#c4c0b6' }));
  for (const sx of [-1, 1]) {
    K.add(lit ? 'glow' : 'flat', H.box(0.18, 0.12, d - 0.4, { x: sx * (w / 2 - 0.12), y: 0.62, color: lit ? '#ffd890' : '#d8d4ca' })); // the rail (lit warm at night)
    for (let z = -d / 2 + 0.6; z < d / 2 - 0.3; z += 1.3) K.add('flat', H.box(0.22, 0.62, 0.22, { x: sx * (w / 2 - 0.12), y: 0.31, z, color: '#cfcbc0' }));
  }
  if (lit) for (const sx of [-1, 1]) K.add('neon', H.box(0.08, 0.08, d - 0.3, { x: sx * (w / 2 + 0.03), y: -0.1, color: '#ff4a6a' }));
}
function lantern(K, p, th, rng, H) {
  const r = p.r, T = p.thick, hang = p.tint === 1, cy = -T * 0.5, lit = (th.night || 0) > 0.5;
  K.add('glow', H.part(new THREE.SphereGeometry(1, H.seg(12, 8), H.seg(8, 6)), { y: cy, sx: r * 1.05, sz: r * 1.05, sy: T * 0.62, color: hang ? '#ff4a2a' : '#ff3424' }));
  K.add('flat', H.cyl(r * 0.75, r * 0.85, 0.16, 8, { y: -0.08, color: '#2a1410' }), H.cyl(r * 0.6, r * 0.7, 0.16, 8, { y: -T + 0.08, color: '#2a1410' }));
  if (lit) K.add('neon', H.part(new THREE.TorusGeometry(r * 0.8, 0.06, 3, 10), { rx: Math.PI / 2, y: 0.01, color: '#ffd23a' })); // the top's rim: the landing ring
  K.add(lit ? 'neon' : 'flat', H.cyl(r * 1.07, r * 1.07, 0.1, H.seg(12, 8), { y: cy, color: lit ? '#ffd23a' : '#e8b440' }));
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
  if ((th.night || 0) > 0.5) K.add('neon', H.part(new THREE.TorusGeometry(r * 0.82, 0.07, 3, H.seg(20, 12)), { y: 0.02, rx: Math.PI / 2, color: '#ffd23a' }));
}
function dragonBoat(K, p, th, rng, H) {
  const { w, d, thick: T } = p, gold = '#e8b440', hull = p.tint === 1 ? '#2a7a5a' : '#c8302a', lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T + 0.5, d - 1.6, { y: -(T + 0.5) / 2, color: hull }), H.box(w * 0.7, T + 0.3, 1.6, { y: -(T + 0.3) / 2, z: d / 2 - 0.4, color: hull }));
  K.add(lit ? 'neon' : 'flat', H.box(w + 0.06, 0.12, d - 1.6, { y: -0.3, color: lit ? '#ffd23a' : gold }));
  if (lit) K.add('neon', H.box(w + 0.08, 0.08, d - 1.6, { y: -T - 0.35, color: p.tint === 1 ? '#2bffb0' : '#ff3a5a' })); // its waterline in light
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
  const { w, d, thick: T } = p, stone = '#a8a49c', lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: stone }), H.box(w, 0.08, d - 0.3, { y: -0.04, color: '#c4c0b6' }));
  const R = w / 2, sy = 3.4 / R; // a flattened arch under the span: the boats pass under it
  K.add('flat', H.part(new THREE.TorusGeometry(R - 0.3, 0.45, 4, H.seg(16, 10), Math.PI), { y: -T - 0.1 - 3.3 + 0.1, sy, sz: d / 0.9, color: shade(stone, 0.9) }));
  if (lit) for (const sz of [-1, 1]) K.add('neon', H.part(new THREE.TorusGeometry(R - 0.3, 0.09, 3, H.seg(16, 10), Math.PI), { y: -T - 3.3, z: sz * (d / 2 + 0.06), sy, color: '#ff3a5a' })); // the arch drawn in red light on both faces
  for (const sx of [-1, 1]) {
    K.add(lit ? 'glow' : 'flat', H.box(w, 0.12, 0.18, { y: 0.7, z: sx * (d / 2 - 0.12), color: lit ? '#ffd890' : '#d8d4ca' }));
    for (let x = -w / 2 + 0.6; x < w / 2; x += 1.4) K.add('flat', H.box(0.22, 0.7, 0.22, { x, y: 0.35, z: sx * (d / 2 - 0.12), color: '#cfcbc0' }));
    K.add('flat', H.cyl(0.07, 0.07, 1.8, 4, { x: sx * (w / 2 - 0.3), y: 0.9, z: d / 2 - 0.15, color: '#2a1a14' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.3, 6, 4), { x: sx * (w / 2 - 0.3), y: 1.95, z: d / 2 - 0.15, sy: 1.3, color: '#ff3a24' }));
  }
}
function stoneStep(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#a8a49c' }));
  for (let k = 1; k < 3; k++) K.add('flat', H.box(w + 0.02, 0.06, d + 0.02, { y: -k * T / 3, color: '#8a8680' }));
  if ((th.night || 0) > 0.5) edgeLED(K, H, w, d, -0.1, '#ffb050', { t: 0.07, out: 0.03 });
}
function moonWall(K, p, th, rng, H) {
  const { w, d, thick: T } = p, lintel = p.tint === 1, lit = (th.night || 0) > 0.5;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#ece6da' }), H.box(w + 0.6, 0.35, d + 0.2, { y: -0.05, color: '#34363f' }), H.box(w + 0.7, 0.1, d + 0.2, { y: -0.3, color: '#2a2a32' }));
  if (lit) edgeLED(K, H, w + 0.6, d + 0.2, -0.22, '#ffd23a', { t: 0.07, out: 0.03 });
  if (!lintel) K.add('flat', H.box(w + 0.05, 0.5, d + 0.05, { y: -T + 0.25, color: '#5a5860' }));
  else for (const sx of [-1, 1]) { // the round moon gate's frame, on both faces of the wall (a full moon in light at night)
    K.add(lit ? 'neon' : 'flat', H.part(new THREE.TorusGeometry(1.75, 0.16, 4, H.seg(24, 14)), { x: sx * (w / 2 + 0.02), y: -T - 1.3, ry: Math.PI / 2, color: lit ? '#fff0c0' : '#3a3a44' }));
    K.add('glow', H.part(new THREE.SphereGeometry(0.3, 6, 4), { x: sx * (w / 2 + 0.4), y: -T - 0.1, sy: 1.3, color: '#ff3a24' }));
  }
}
function rockery(K, p, th, rng, H) {
  const { w, d, thick: T } = p, col = ['#9a9a9e', '#8a8c92', '#a6a2a0', '#7e8088'][(p.tint >= 0 ? p.tint : 0) % 4];
  K.add('flat', H.part(new THREE.IcosahedronGeometry(1, 0), { y: -T / 2, sx: w * 0.55, sy: T / 2 + 0.15, sz: d * 0.55, color: col }));
  K.add('flat', H.part(new THREE.IcosahedronGeometry(1, 0), { x: w * 0.15, y: -0.1, z: -d * 0.1, sx: w * 0.42, sy: 0.3, sz: d * 0.42, color: shade(col, 1.12) }));
  for (let k = 0; k < 4; k++) K.add('flat', H.box(0.3, 0.3, 0.3, { x: (rng() - 0.5) * w * 0.9, y: -T * (0.3 + rng() * 0.5), z: (rng() - 0.5) * d * 0.9, color: '#2a2a30' }));
  if ((th.night || 0) > 0.5) { // a pond light at the rock's foot, a little glowing ring on its top so you can find it
    K.add('glow', H.box(0.3, 0.2, 0.3, { x: w * 0.42, y: -p.h + 0.45, z: d * 0.2, color: '#7fe8ff' }));
    K.add('neon', H.part(new THREE.TorusGeometry(Math.min(w, d) * 0.3, 0.05, 3, 10), { rx: Math.PI / 2, x: w * 0.15, y: 0.21, z: -d * 0.1, color: '#7fe8ff' }));
  }
}

// ------------------------------------------------------------------ the Pearl Tower (boss)
const PINK = '#e8307a', PINK_HI = '#ff6aa8', PINK_DK = '#9a1a50';
// LED meridians down a sphere of radius R centred at cy, below its cut at polar angle t0 (n of them).
function meridians(K, H, R, cy, t0, n, color, tube = 0.08) {
  for (let k = 0; k < n; k++) K.add('glow', H.part(new THREE.TorusGeometry(R + 0.04, tube, 3, H.seg(16, 10), Math.PI - t0), { y: cy, rz: -Math.PI / 2, ry: (k / n) * TAU, color }));
}
function pearlDeck(K, p, th, rng, H) {
  const r = p.r, R = 17, cy = -Math.sqrt(R * R - r * r), lit = (th.night || 0) > 0.5; // the sphere's centre, so it meets the deck's rim
  const t0 = Math.acos(-cy / R);
  K.add('flat', H.part(new THREE.SphereGeometry(R, H.seg(28, 18), H.seg(16, 12), 0, TAU, t0, Math.PI - t0), { y: cy, color: lit ? '#c0186a' : PINK }));
  for (const lat of [0.25, 0.55, 0.85]) { // window bands round the sphere
    const y = cy + Math.cos(t0 + (Math.PI - t0) * lat) * R, rr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))) + 0.05;
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; K.add('glow', H.box(0.7, 0.5, 0.1, { x: Math.cos(a) * rr, y, z: Math.sin(a) * rr, ry: -a + Math.PI / 2, color: k % 5 ? '#ffd6ea' : '#7ff6ff' })); }
  }
  if (lit) { // the hot-pink LED cage: meridians and two rings
    meridians(K, H, R, cy, t0, 16, '#ff4ab8', 0.1);
    for (const lat of [0.4, 0.7]) { const y = cy + Math.cos(t0 + (Math.PI - t0) * lat) * R, rr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))) + 0.06; K.add('glow', H.part(new THREE.TorusGeometry(rr, 0.12, 3, H.seg(40, 24)), { rx: Math.PI / 2, y, color: '#ff2bd6' })); }
  }
  K.add('flat', H.cyl(r, r, 0.25, H.seg(40, 24), { y: -0.125, color: lit ? '#5e4c76' : '#2a2034' }));
  K.add('neon', H.part(new THREE.RingGeometry(r - 0.9, r - 0.6, H.seg(40, 24)), { rx: -Math.PI / 2, y: 0.02, color: '#ff2b8a' }), H.part(new THREE.RingGeometry(5.4, 5.7, H.seg(32, 20)), { rx: -Math.PI / 2, y: 0.02, color: '#2be8ff' }));
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; K.add('flat', H.box(0.15, 0.02, r - 6.5, { x: Math.cos(a) * (r + 5.5) / 2, y: 0.015, z: Math.sin(a) * (r + 5.5) / 2, ry: -a + Math.PI / 2, color: lit ? '#806c98' : '#4a3a5a' })); }
  for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; K.add('flat', H.box(0.1, 0.7, 0.1, { x: Math.cos(a) * (r - 0.15), y: 0.35, z: Math.sin(a) * (r - 0.15), color: '#c8c8d4' })); }
  K.add(lit ? 'glow' : 'flat', H.part(new THREE.TorusGeometry(r - 0.15, 0.06, 3, H.seg(40, 24)), { rx: Math.PI / 2, y: 0.72, color: lit ? '#ffd0f0' : '#e8e8f0' })); // the rail (lit: the deck's edge reads)
}
function pearlColumn(K, p, th, rng, H) {
  const T = p.thick, r = p.r;
  K.add('flat', H.cyl(r, r, T, H.seg(12, 8), { y: -T / 2, color: '#d8d8e2' }));
  for (let y = -2; y > -T; y -= 3) K.add('neon', H.cyl(r + 0.06, r + 0.06, 0.18, H.seg(12, 8), { y, color: (y / 3 | 0) % 2 ? '#ff2b8a' : '#c8d8ff' }));
  if ((th.night || 0) > 0.5) for (const a of [0, 2.1, 4.2]) K.add('glow', H.box(0.1, T, 0.1, { x: Math.cos(a) * (r + 0.05), y: -T / 2, z: Math.sin(a) * (r + 0.05), color: '#ff8ad8' }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 0.15, color: '#ff2a2a' }));
}
function pearlRing(K, p, th, rng, H) {
  const r = p.r, small = p.tint === 1, R = r + 0.6, cy = -Math.sqrt(Math.max(0.1, R * R - r * r)), t0 = Math.acos(Math.min(1, -cy / R)), lit = (th.night || 0) > 0.5;
  K.add('flat', H.part(new THREE.SphereGeometry(R, H.seg(18, 12), H.seg(10, 8), 0, TAU, t0, Math.PI - t0), { y: cy, color: lit ? (small ? '#e0307a' : '#c0186a') : small ? PINK_HI : PINK }));
  K.add('flat', H.cyl(r, r, 0.2, H.seg(20, 14), { y: -0.1, color: lit ? '#5e4c76' : '#2a2034' }));
  K.add('neon', H.part(new THREE.TorusGeometry(r - 0.2, 0.08, 3, H.seg(20, 14)), { rx: Math.PI / 2, y: 0.03, color: '#7ff6ff' }));
  for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; K.add('glow', H.box(0.4, 0.3, 0.1, { x: Math.cos(a) * (R - 0.1), y: cy * 0.35, z: Math.sin(a) * (R - 0.1), ry: -a + Math.PI / 2, color: '#ffd6ea' })); }
  if (lit) meridians(K, H, R, cy, t0, 8, '#ff4ab8', 0.06);
}
function pearlPad(K, p, th, rng, H) {
  const r = p.r, T = p.thick, v = p.tint >= 0 ? p.tint : 0;
  K.add('flat', H.part(new THREE.SphereGeometry(r, H.seg(16, 10), H.seg(8, 6), 0, TAU, Math.PI / 2, Math.PI / 2), { y: -0.15, sy: (T + r * 0.5) / r, color: [PINK, PINK_HI, PINK_DK][v % 3] }));
  K.add('flat', H.cyl(r, r, 0.3, H.seg(16, 10), { y: -0.15, color: '#f0e8f4' }));
  K.add('neon', H.part(new THREE.TorusGeometry(r * 0.72, 0.07, 3, H.seg(16, 10)), { rx: Math.PI / 2, y: 0.03, color: v === 1 ? '#ffe52b' : '#7ff6ff' }));
  if ((th.night || 0) > 0.5) K.add('neon', H.part(new THREE.TorusGeometry(r + 0.02, 0.06, 3, H.seg(16, 10)), { rx: Math.PI / 2, y: -0.28, color: '#ff4ab8' })); // the rim, lit from below
  K.add('glow', H.cyl(r * 0.35, r * 0.15, 0.6, 8, { y: -T - r * 0.5 - 0.1, color: '#ff8ad8' })); // its thruster glow
}
function pearlPod(K, p, th, rng, H) {
  const r = p.r, T = p.thick;
  K.add('flat', H.cyl(r, r + 0.3, T, H.seg(12, 8), { y: -T / 2, color: PINK_HI }), H.cyl(r + 0.05, r + 0.05, 0.12, H.seg(12, 8), { y: -0.06, color: '#f0e8f4' }));
  K.add('glow', H.cyl(r + 0.32, r + 0.32, 0.12, H.seg(12, 8), { y: -T + 0.3, color: '#7ff6ff' }));
  if ((th.night || 0) > 0.5) K.add('neon', H.part(new THREE.TorusGeometry(r + 0.06, 0.05, 3, H.seg(12, 8)), { rx: Math.PI / 2, y: -0.02, color: '#ffd0f0' }));
}

export const SHANGHAI_STYLES = {
  bund, portico, copperDrum, copperDome, copperLantern, clockTower, bundLedge, copperPyramid, pontoon, ferry, cruise, ledBarge, ledCabin, bundWalk,
  swfc, swfcPillar, swfcTop, gondola, skybridge, jinmao, jinmaoTier, jinmaoSpire, twistBase, twistPlate, twistLobby: twistPlate, twistCrown, blimp,
  stoneBank, stonePlaza: stoneBank, garden, hall, eave, eaveTop, pagodaCap, zigBridge, lantern, bigLantern, dragonBoat, archBridge, stoneStep, moonWall, rockery,
  pearlDeck, pearlColumn, pearlRing, pearlPad, pearlPod,
};
