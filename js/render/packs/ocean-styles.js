// OCEAN CORE platform styles: (K, p, th, rng, H) → pieces in p's local frame (y = 0 at its top,
// footprint p.w × p.d or radius p.r). The sea is at world y = 0, so locally the waterline is at
// y = -p.h. Flat-shaded primitives with vertex colours; the haven runs all night, so every piece
// carries its own light: LED edge strips on what you stand on, rack blinkenlights, cyan coolant
// bands, floodlit towers, red aviation beacons, and the neon smeared across the sea under them.
// Material keys: 'flat' (most things), 'glow' (unlit lights), 'neon' (unlit, dims by day),
// 'glass', 'deck' (metal tread texture), 'hazard' (yellow/black stripes), 'concrete', 'facade'
// (lit windows), 'ads' (the city's adverts). Moving pieces stick to flat / deck / glow so each
// mover stays a few draw calls.
import * as THREE from 'three';
import { adUV } from '../ads.js';

const STEEL = '#39414e', STEEL_LT = '#5a6272', RUST = '#b8582e', GROWTH = '#24382e', YELLOW = '#f2c21a', WHITE = '#e4e8ec';
// the haven's light palette
const CYAN = '#2be8ff', TEAL = '#2bffd0', BLUE = '#3a7bff', MAGENTA = '#ff2bd6', AMBER = '#ffb02b', RED = '#ff2a2a', GREEN = '#3dff7a', WARMW = '#ffe8b0', COOLW = '#d8f4ff';
const LEDS = [GREEN, GREEN, CYAN, GREEN, AMBER, GREEN, CYAN, RED, GREEN, BLUE];

const _c = new THREE.Color();
const dim = (hex, k) => _c.set(hex).multiplyScalar(k).getHex(); // a light's colour at k of full
// The four faces of a w × d footprint (outward normal n, tangent t, half depth, face width).
const faces = (w, d) => [
  { nx: 0, nz: -1, tx: 1, tz: 0, half: d / 2, width: w, ry: Math.PI },
  { nx: 0, nz: 1, tx: -1, tz: 0, half: d / 2, width: w, ry: 0 },
  { nx: 1, nz: 0, tx: 0, tz: -1, half: w / 2, width: d, ry: Math.PI / 2 },
  { nx: -1, nz: 0, tx: 0, tz: 1, half: w / 2, width: d, ry: -Math.PI / 2 },
];
// A box on face f: centred `along` the face at height y, `out` metres outside it; sw wide, sh tall, sd deep.
function fbox(H, f, along, y, out, sw, sh, sd, o = {}) {
  return H.box(f.tx ? sw : sd, sh, f.tz ? sw : sd, { x: f.nx * (f.half + out) + f.tx * along, y, z: f.nz * (f.half + out) + f.tz * along, ...o });
}
// A flat quad on face f, facing out of it (windows, LED dots, screens).
function fquad(H, f, along, y, out, sw, sh, color) {
  return H.part(new THREE.PlaneGeometry(sw, sh), { x: f.nx * (f.half + out) + f.tx * along, y, z: f.nz * (f.half + out) + f.tz * along, ry: f.ry, color });
}
// Scale a part's vertex colours by f(y): a light wash baked in (floodlit from below, fading up).
function wash(g, f) {
  const p = g.attributes.position, c = g.attributes.color;
  for (let i = 0; i < p.count; i++) { const k = f(p.getY(i)); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }
  return g;
}

// A hazard strip (stripes run along it) of length L along local x, rotated by ry.
function stripe(K, H, L, x, y, z, ry = 0, wid = 0.32) {
  const g = H.meterBox(L, 0.04, wid, 1.2, { faces: ['py'] });
  g.rotateY(ry); g.translate(x, y, z);
  K.add('hazard', g);
}
// Hazard edging all round a w × d top.
function edge(K, H, w, d, inset = 0.17) {
  stripe(K, H, w, 0, 0.025, -d / 2 + inset); stripe(K, H, w, 0, 0.025, d / 2 - inset);
  stripe(K, H, d - inset * 4, -w / 2 + inset, 0.026, 0, Math.PI / 2); stripe(K, H, d - inset * 4, w / 2 - inset, 0.026, 0, Math.PI / 2);
}
// A metal-tread top plate (thickness t) over a w × d footprint.
function plate(K, H, w, d, t = 0.3, color = '#8c96a4', tile = 4) {
  const g = H.meterBox(w, t, d, tile, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color });
  g.translate(0, -t / 2, 0);
  K.add('deck', g);
}
// Railing along one edge: from (x0, z0) to (x1, z1) at the top, posts every ~1.6 m.
function rail(K, H, x0, z0, x1, z1, color = YELLOW, hgt = 1.0) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz), ry = Math.atan2(-dz, dx);
  const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
  K.add('flat', H.box(L, 0.07, 0.07, { x: mx, y: hgt, z: mz, ry, color }), H.box(L, 0.05, 0.05, { x: mx, y: hgt * 0.5, z: mz, ry, color }));
  const n = Math.max(1, Math.round(L / 1.6));
  for (let i = 0; i <= n; i++) K.add('flat', H.box(0.07, hgt, 0.07, { x: x0 + (dx * i) / n, y: hgt / 2, z: z0 + (dz * i) / n, color }));
}
// Thin glowing strips along the four top edges (night readability: where a walkway ends).
function outline(K, H, w, d, color, y = -0.06, t = 0.09) {
  for (const f of faces(w, d)) K.add('glow', H.box(f.tx ? f.width + t : t, t, f.tz ? f.width + t : t, { x: f.nx * (f.half + t * 0.3), y, z: f.nz * (f.half + t * 0.3), color }));
}
// Neon on the water: broken streaks of a light's colour lying on the sea along a w × d hull (wl =
// the local waterline), fading out from it: the haven's lights smeared across the swell.
function sheen(K, H, w, d, wl, color, rng, o = {}) {
  const n = o.n ?? 3, k0 = o.k ?? 0.5;
  for (const f of faces(w, d)) {
    if (f.width < 3 || (o.skip && o.skip(f))) continue;
    for (let i = 0; i < n; i++) {
      const k = k0 * (1 - i * 0.3), out = 0.45 + i * 1.25 + rng() * 0.3, deep = 0.2 + i * 0.08;
      for (let a = -f.width / 2 + rng() * 1.4; a < f.width / 2 - 0.6;) {
        const len = Math.min(f.width / 2 - a, 0.7 + rng() * (2.8 - i * 0.6));
        K.add('glow', fbox(H, f, a + len / 2, wl + 0.07, out, len, 0.03, deep, { color: dim(color, k * (0.75 + rng() * 0.5)) }));
        a += len + 0.35 + rng() * (1.2 + i);
      }
    }
  }
}
// The same round a round hull: broken arcs of light on the water.
function sheenDisc(K, H, r, wl, color, rng, k0 = 0.5) {
  for (let i = 0; i < 3; i++) {
    const r0 = r + 0.4 + i * 1.2, k = k0 * (1 - i * 0.3);
    for (let a = rng() * 0.6; a < Math.PI * 2 - 0.2;) {
      const len = 0.15 + rng() * 0.5;
      K.add('glow', H.part(new THREE.RingGeometry(r0, r0 + 0.22 + i * 0.08, 3, 1, a, len), { rx: -Math.PI / 2, y: wl + 0.07, color: dim(color, k * (0.75 + rng() * 0.5)) }));
      a += len + 0.12 + rng() * 0.5;
    }
  }
}
// A floodlight head on a short arm (lens facing `face`): the lamp housing and its lit lens.
function flood(K, H, x, y, z, ry, color = COOLW) {
  K.add('flat', H.box(0.7, 0.45, 0.35, { x, y, z, ry, color: '#22252e' }));
  K.add('glow', H.box(0.58, 0.34, 0.05, { x: x + Math.sin(ry) * 0.19, y, z: z + Math.cos(ry) * 0.19, ry, color }));
}
// A mast with a red aviation beacon (and a blue-white strobe halfway).
function beaconMast(K, H, x, z, h, y0 = 0) {
  K.add('flat', H.cyl(0.05, 0.09, h, 4, { x, y: y0 + h / 2, z, color: '#c8ccd2' }));
  K.add('glow', H.box(0.28, 0.28, 0.28, { x, y: y0 + h + 0.1, z, color: RED }));
  if (h > 4) K.add('glow', H.box(0.14, 0.14, 0.14, { x, y: y0 + h * 0.55, z, color: RED }));
}
// Marine growth / waterline band round a box body.
function waterline(K, H, w, d, wl) { K.add('flat', H.box(w + 0.08, 0.7, d + 0.08, { y: wl + 0.15, color: GROWTH })); }
function waterlineDisc(K, H, r, wl) { K.add('flat', H.cyl(r + 0.05, r + 0.05, 0.7, H.seg(16, 10), { y: wl + 0.15, color: GROWTH })); }
// Turn a prepped (non-indexed) surface inside out: seen from within (a pool wall).
function inward(g) {
  for (const key of ['position', 'normal', 'uv', 'color']) {
    const a = g.attributes[key].array, k = g.attributes[key].itemSize;
    for (let t = 0; t < a.length; t += 3 * k) for (let j = 0; j < k; j++) { const q = a[t + k + j]; a[t + k + j] = a[t + 2 * k + j]; a[t + 2 * k + j] = q; }
  }
  const n = g.attributes.normal.array;
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  return g;
}
const longAxis = (p) => (p.d >= p.w ? { L: p.d, W: p.w, along: 'z' } : { L: p.w, W: p.d, along: 'x' });
// An advert panel on face f (the haven sells itself to the sea): a dark frame and the ad.
function adPanel(K, H, f, along, y, aw, ad) {
  K.add('flat', fbox(H, f, along, y, 0.1, aw + 0.5, aw / 2 + 0.5, 0.2, { color: '#14161e' }));
  K.add('ads', H.atlasQuad(aw, aw / 2, adUV(ad), { x: f.nx * (f.half + 0.22) + f.tx * along, y, z: f.nz * (f.half + 0.22) + f.tz * along, ry: f.ry }));
  K.add('glow', fbox(H, f, along, y - aw / 4 - 0.3, 0.25, aw + 0.5, 0.1, 0.1, { color: CYAN }));
}

export const STYLES = {
  // ---------------------------------------------------------------- shared offshore pieces
  // A steel offshore deck standing in the sea on its pontoon body: tread top, hazard edges, a cyan
  // LED strip under the lip (where the deck ends), a rust band, legs round the edge with amber
  // lamps, floodlight masts on two corners, marine growth at the waterline, light on the water.
  'oc-deck'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h, led = p.tint ? TEAL : CYAN;
    plate(K, H, w, d, 0.3, p.tint ? '#7e9aa4' : '#8c96a4');
    edge(K, H, w, d);
    K.add('flat', H.box(w - 0.5, T - 0.3, d - 0.5, { y: -0.3 - (T - 0.3) / 2, color: STEEL }));
    K.add('flat', H.box(w + 0.05, 0.4, d + 0.05, { y: -0.5, color: RUST }));
    outline(K, H, w, d, led, -0.34, 0.11);
    for (const f of faces(w, d)) {
      const n = Math.max(1, Math.round(f.width / 9));
      for (let k = 0; k <= n; k++) {
        const off = -f.width / 2 + 0.6 + (k * (f.width - 1.2)) / n;
        const x = f.nx * (f.half + 0.05) + f.tx * off, z = f.nz * (f.half + 0.05) + f.tz * off;
        K.add('flat', H.cyl(0.45, 0.45, T + 0.6, 6, { x, y: -0.7 - (T - 0.4) / 2, z, color: '#4a5260' }));
      }
      if (p.h > 2) for (let k = 1; k < f.width / 7; k++) K.add('glow', H.box(0.2, 0.2, 0.2, { x: f.nx * (f.half + 0.1) + f.tx * (-f.width / 2 + k * 7), y: -0.9, z: f.nz * (f.half + 0.1) + f.tz * (-f.width / 2 + k * 7), color: AMBER }));
      if (p.h > 2.5 && f.width > 12) K.add('glow', fbox(H, f, 0, wl + 0.9, 0.08, f.width * 0.5, 0.12, 0.06, { color: dim(led, 0.7) })); // a hull light line
    }
    if (w >= 10 && d >= 10) for (const [sx, sz] of [[-1, -1], [1, 1]]) { // floodlight masts on two corners, aimed in
      const x = sx * (w / 2 + 0.25), z = sz * (d / 2 + 0.25), hh = 5.5;
      K.add('flat', H.cyl(0.08, 0.12, hh + 0.6, 5, { x, y: hh / 2 - 0.3, z, color: '#4a5260' }));
      flood(K, H, x - sx * 0.3, hh, z - sz * 0.3, Math.atan2(-sx, -sz));
      K.add('glow', H.box(0.2, 0.2, 0.2, { x, y: hh + 0.6, z, color: RED }));
    }
    if (wl > -T) { waterline(K, H, w - 0.4, d - 0.4, wl); sheen(K, H, w, d, wl, led, rng, { k: 0.42 }); }
  },
  // An orange (or yellow) float: black fenders, cleats, a beacon, and LED strips down both long
  // sides so you can see it bob in the dark.
  'oc-pontoon'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = ['#e8762a', '#e8c02a', '#d8dce2'][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, T - 0.2, d, { y: -0.2 - (T - 0.2) / 2, color: col }));
    plate(K, H, w - 0.2, d - 0.2, 0.2, '#6a7280', 2);
    const { L, along } = longAxis(p);
    for (const s of [-1, 1]) {
      const x = along === 'z' ? s * (w / 2 + 0.18) : 0, z = along === 'z' ? 0 : s * (d / 2 + 0.18);
      K.add('flat', H.box(along === 'z' ? 0.36 : L * 0.8, 0.36, along === 'z' ? L * 0.8 : 0.36, { x, y: -0.45, z, color: '#16181e' }));
    }
    for (const [sx, sz] of [[-1, -1], [1, 1], [1, -1], [-1, 1]]) K.add('flat', H.box(0.25, 0.18, 0.25, { x: sx * (w / 2 - 0.35), y: 0.09, z: sz * (d / 2 - 0.35), color: '#22252e' }));
    outline(K, H, w, d, p.tint === 1 ? AMBER : CYAN, -0.12, 0.09);
    K.add('glow', H.box(0.18, 0.18, 0.18, { x: w / 2 - 0.3, y: 0.2, z: -d / 2 + 0.3, color: '#ffe26a' }));
  },
  // A mooring buoy: banded float, a flat cap you land on with a lit rim, a beacon post on its rim
  // and a holographic marker turning above it (a ring and a diamond in the buoy's colour).
  'oc-buoy'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(14, 9), t = (p.tint >= 0 ? p.tint : 0) % 3;
    const [a, b] = [['#d8343c', '#f0f0ea'], ['#f2c21a', '#22252e'], ['#2aa86a', '#f0f0ea']][t];
    const lamp = t === 2 ? GREEN : t === 1 ? '#ffe26a' : '#ff3a3a', holo = t === 2 ? TEAL : t === 1 ? AMBER : CYAN;
    const bands = Math.max(2, Math.round(T / 0.7));
    for (let i = 0; i < bands; i++) { const h = T / bands; K.add('flat', H.cyl(r, r * (i === bands - 1 ? 0.8 : 1), h, n, { y: -h * (i + 0.5), color: i % 2 ? b : a })); }
    K.add('flat', H.cyl(r * 0.92, r, 0.16, n, { y: -0.08, color: '#4a505c' }));
    K.add('glow', H.part(new THREE.TorusGeometry(r + 0.02, 0.06, 3, n), { rx: Math.PI / 2, y: -0.12, color: holo }));
    K.add('flat', H.part(new THREE.TorusGeometry(r + 0.05, 0.12, 4, n), { rx: Math.PI / 2, y: -0.35, color: '#16181e' }));
    K.add('flat', H.box(0.16, 0.5, 0.16, { x: r * 0.8, y: 0.25, color: '#22252e' }));
    K.add('glow', H.box(0.28, 0.28, 0.28, { x: r * 0.8, y: 0.62, color: lamp }));
    K.add('glow', H.part(new THREE.TorusGeometry(0.42, 0.035, 3, 10), { x: r * 0.8, y: 1.35, color: holo }), H.part(new THREE.OctahedronGeometry(0.2, 0), { x: r * 0.8, y: 1.35, sy: 1.6, color: holo }));
  },
  // A small service pad on a pole out of the sea, with a red valve wheel under it and a lit rim.
  'oc-valve'(K, p, th, rng, H) {
    const { w, d } = p, wl = -p.h;
    plate(K, H, w, d, 0.25, '#7a8492', 2);
    edge(K, H, w, d, 0.12);
    K.add('flat', H.box(w * 0.5, 0.3, d * 0.5, { y: -0.35, color: STEEL }));
    outline(K, H, w, d, p.tint ? AMBER : TEAL, -0.2, 0.08);
    K.add('flat', H.cyl(0.28, 0.32, -wl + 0.2, 6, { y: (wl - 0.2) / 2, color: p.tint ? '#c8642a' : STEEL_LT }));
    for (let y = -2.5; y > wl + 1; y -= 3) K.add('glow', H.cyl(0.33, 0.33, 0.12, 6, { y, color: p.tint ? dim(AMBER, 0.8) : dim(TEAL, 0.8) }));
    K.add('flat', H.part(new THREE.TorusGeometry(0.45, 0.07, 3, 8), { y: -1.1, rx: Math.PI / 2, color: '#d8343c' }));
    if (wl < -2) { waterlineDisc(K, H, 0.32, wl); sheenDisc(K, H, 0.5, wl, p.tint ? AMBER : TEAL, rng, 0.35); }
    K.add('glow', H.box(0.16, 0.16, 0.16, { x: w / 2 - 0.2, y: 0.1, z: d / 2 - 0.2, color: TEAL }));
  },
  // A service landing bolted round a tower (local +x points at the tower): grating, an outer rail,
  // a strut back, an LED strip along its outer edge and a lamp.
  'oc-landing'(K, p, th, rng, H) {
    const { w, d } = p, led = p.tint ? TEAL : AMBER;
    plate(K, H, w, d, 0.2, '#8a929e', 1.5);
    K.add('flat', H.box(w, 0.18, 0.12, { y: -0.3, z: -d / 2 + 0.06, color: YELLOW }), H.box(w, 0.18, 0.12, { y: -0.3, z: d / 2 - 0.06, color: YELLOW }));
    rail(K, H, -w / 2 + 0.05, -d / 2 + 0.1, -w / 2 + 0.05, d / 2 - 0.1);
    K.add('glow', H.box(0.1, 0.1, d, { x: -w / 2 - 0.02, y: -0.12, color: led }), H.box(w, 0.08, 0.08, { y: -0.16, z: -d / 2 - 0.03, color: dim(led, 0.8) }), H.box(w, 0.08, 0.08, { y: -0.16, z: d / 2 + 0.03, color: dim(led, 0.8) }));
    for (const sz of [-1, 1]) K.add('flat', H.box(4.6, 0.22, 0.22, { x: 1.9, y: -1.4, z: sz * (d / 2 - 0.3), rz: 0.42, color: STEEL_LT }));
    K.add('glow', H.box(0.16, 0.16, 0.16, { x: -w / 2 + 0.1, y: 1.1, z: 0, color: p.tint ? TEAL : AMBER }));
  },
  // A grating catwalk (either axis long) with rails on both long sides, stringers under it and LED
  // kick strips along both edges.
  'oc-catwalk'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p);
    plate(K, H, p.w, p.d, 0.12, '#a8b0bc', 1.2);
    for (const s of [-1, 1]) {
      const o = s * (W / 2 - 0.05);
      if (along === 'z') { rail(K, H, o, -L / 2, o, L / 2); K.add('flat', H.box(0.2, 0.35, L, { x: s * (W / 2 - 0.1), y: -0.3, color: STEEL })); K.add('glow', H.box(0.06, 0.08, L, { x: s * (W / 2 + 0.01), y: -0.1, color: CYAN })); }
      else { rail(K, H, -L / 2, o, L / 2, o); K.add('flat', H.box(L, 0.35, 0.2, { z: s * (W / 2 - 0.1), y: -0.3, color: STEEL })); K.add('glow', H.box(L, 0.08, 0.06, { z: s * (W / 2 + 0.01), y: -0.1, color: CYAN })); }
    }
  },
  // A big pipe you run along (crown at y = 0): flanges ringed with glowing coolant bands (cyan on
  // the cooling runs, amber on the brine outfall), a tread strip on top lit at both edges,
  // trestles to the sea.
  'oc-pipe'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p), r = W / 2, wl = -p.h, col = p.tint ? '#d8d8d0' : '#2e6aa8', band = p.tint ? AMBER : CYAN;
    const rot = along === 'z' ? { rx: Math.PI / 2 } : { rz: Math.PI / 2 };
    K.add('flat', H.cyl(r, r, L, H.seg(12, 8), { y: -r, ...rot, color: col }));
    const n = Math.max(1, Math.floor(L / 6));
    for (let k = 0; k <= n; k++) {
      const o = -L / 2 + 0.4 + (k * (L - 0.8)) / n, at = along === 'z' ? { z: o } : { x: o };
      K.add('flat', H.cyl(r + 0.14, r + 0.14, 0.35, H.seg(12, 8), { y: -r, ...rot, ...at, color: '#22385a' }));
      if (k < n) K.add('glow', H.cyl(r + 0.05, r + 0.05, 0.16, H.seg(12, 8), { y: -r, ...rot, ...(along === 'z' ? { z: o + (L - 0.8) / n / 2 } : { x: o + (L - 0.8) / n / 2 }), color: dim(band, 0.85) }));
      if (k % 2 === 0 && wl < -W - 0.5) { // a trestle down to the water
        const hh = -wl - W + 0.5;
        for (const s of [-1, 1]) K.add('flat', H.box(0.3, hh, 0.3, { y: -W - hh / 2 + 0.2, ...(along === 'z' ? { x: s * r * 0.8, z: o } : { z: s * r * 0.8, x: o }), color: STEEL_LT }));
        K.add('flat', H.box(along === 'z' ? W + 0.4 : 0.4, 0.3, along === 'z' ? 0.4 : W + 0.4, { y: -W - 0.1, ...at, color: STEEL }));
      }
    }
    K.add('deck', H.box(along === 'z' ? 0.9 : L, 0.06, along === 'z' ? L : 0.9, { y: 0.0, color: '#9aa2ae' }));
    for (const s of [-1, 1]) K.add('glow', H.box(along === 'z' ? 0.05 : L, 0.07, along === 'z' ? L : 0.05, { ...(along === 'z' ? { x: s * 0.47 } : { z: s * 0.47 }), y: 0.0, color: dim(band, 0.9) }));
  },
  // A pump house: panelled walls, lit louvres, a door under a lamp, a pipe out of the side with a
  // coolant band, a roof fan (its ring lit) flush with the roof, a neon parapet.
  'oc-pump'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = ['#c8cfd6', '#d8b04a', '#8aa4b8'][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, T - 0.25, d, { y: -0.25 - (T - 0.25) / 2, color: col }));
    plate(K, H, w + 0.2, d + 0.2, 0.25, '#7a8290', 2);
    const fr = Math.min(w, d) * 0.28;
    K.add('flat', H.cyl(fr, fr, 0.08, 10, { y: 0.0, color: '#22252e' }));
    K.add('glow', H.part(new THREE.RingGeometry(fr, fr + 0.14, 12), { rx: -Math.PI / 2, y: 0.045, color: CYAN }));
    K.add('flat', H.box(Math.min(w, d) * 0.5, 0.1, 0.1, { y: 0.05, color: '#5a6272' }), H.box(0.1, 0.1, Math.min(w, d) * 0.5, { y: 0.05, color: '#5a6272' }));
    for (const f of faces(w, d)) {
      K.add('flat', fbox(H, f, 0, -1.0, 0.03, f.width * 0.6, 0.5, 0.06, { color: '#3a404c' }));
      K.add('glow', fbox(H, f, 0, -1.0, 0.06, f.width * 0.56, 0.08, 0.02, { color: dim(AMBER, 0.7) }), fbox(H, f, 0, -0.84, 0.06, f.width * 0.56, 0.08, 0.02, { color: dim(AMBER, 0.55) }));
      K.add('flat', fbox(H, f, 0, -1.25, 0.05, f.width * 0.6, 0.08, 0.06, { color: '#22252e' }));
      K.add('neon', fbox(H, f, 0, -0.32, 0.12, f.width + 0.2, 0.1, 0.06, { color: p.tint === 1 ? AMBER : CYAN }));
    }
    K.add('flat', H.box(1.2, 2.1, 0.08, { y: -T + 1.05, z: d / 2 + 0.04, color: '#2a3a5a' }));
    K.add('glow', H.box(1.0, 0.06, 0.05, { y: -T + 2.0, z: d / 2 + 0.09, color: dim(COOLW, 0.6) })); // light round the door
    K.add('flat', H.cyl(0.45, 0.45, 2.2, 8, { x: w / 2 + 1.0, y: -T * 0.55, rz: Math.PI / 2, color: '#3a7ab8' }));
    K.add('glow', H.cyl(0.48, 0.48, 0.16, 8, { x: w / 2 + 1.3, y: -T * 0.55, rz: Math.PI / 2, color: CYAN }));
    K.add('glow', H.box(0.3, 0.14, 0.14, { y: -T + 2.4, z: d / 2 + 0.1, color: '#ffe26a' }));
    if (w >= 5) for (let k = 0; k < 5; k++) K.add('glow', H.box(0.1, 0.1, 0.03, { x: -w / 2 + 0.6 + k * 0.22, y: -T + 1.6, z: d / 2 + 0.05, color: LEDS[(k * 3 + 1) % LEDS.length] })); // a status panel
  },
  // An equipment skid: a frame with a pump motor and pipework; its top is the motor's cover; status
  // LEDs on the casing and a lit frame edge.
  'oc-skid'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = ['#4a8a5a', '#c8642a', '#3a6ab8'][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, 0.25, d, { y: -T + 0.12, color: '#22252e' }));
    K.add('flat', H.box(w - 0.3, T - 0.45, d - 0.3, { y: -T / 2 - 0.1, color: col }));
    plate(K, H, w, d, 0.2, '#6a7280', 2);
    outline(K, H, w, d, AMBER, -0.16, 0.07);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.18, T, 0.18, { x: sx * (w / 2 - 0.09), y: -T / 2, z: sz * (d / 2 - 0.09), color: YELLOW }));
    K.add('flat', H.cyl(0.25, 0.25, d + 0.6, 6, { x: w / 2 + 0.25, y: -T * 0.6, rx: Math.PI / 2, color: '#d8d8d0' }));
    const f = faces(w, d)[1];
    for (let k = 0; k < 4; k++) K.add('glow', fquad(H, f, -w * 0.25 + k * 0.28, -T * 0.45, 0.02, 0.14, 0.14, LEDS[(k + Math.floor(p.x)) % LEDS.length]));
  },
  // ---------------------------------------------------------------- stage 1: the desal plant
  // A storage tank: banded cylinder (fresh water white/blue, brine rust, chemicals teal), a ladder
  // with lamps, a glowing level gauge up its side, a neon band under the lid, the lid's painted ring
  // lit (you land on it), red lights round the rim.
  'oc-tank'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(22, 12), tint = (p.tint >= 0 ? p.tint : 0) % 3;
    const [body, band, lid] = [[WHITE, '#2a6ab8', '#c8ced6'], ['#b8582e', '#5a2a1a', '#8a6a5a'], ['#6a8a90', '#2a3a40', '#9aaeb4']][tint];
    const light = tint === 1 ? AMBER : tint === 2 ? TEAL : CYAN;
    K.add('flat', H.cyl(r, r, T - 0.25, n, { y: -0.25 - (T - 0.25) / 2, color: body }));
    for (let y = -2.5; y > -T + 1; y -= 3) K.add('flat', H.cyl(r + 0.08, r + 0.08, 0.25, n, { y, color: band }));
    K.add('neon', H.cyl(r + 0.1, r + 0.1, 0.16, n, { y: -0.75, color: light }));
    K.add('flat', H.cyl(r + 0.1, r + 0.1, 0.25, n, { y: -0.125, color: lid }));
    K.add('glow', H.part(new THREE.RingGeometry(r * 0.55, r * 0.68, n), { rx: -Math.PI / 2, y: 0.02, color: tint === 1 ? '#ffcc1a' : light }));
    K.add('flat', H.cyl(0.6, 0.6, 0.14, 8, { y: 0.07, color: '#3a404c' }));
    const la = rng() * Math.PI * 2, ga = la + Math.PI;
    K.add('flat', H.box(0.7, T - 0.4, 0.12, { x: Math.cos(la) * (r + 0.12), y: -T / 2 - 0.2, z: Math.sin(la) * (r + 0.12), ry: -la + Math.PI / 2, color: '#22252e' }));
    for (let y = -3; y > -T + 2; y -= 4) K.add('glow', H.box(0.2, 0.2, 0.2, { x: Math.cos(la) * (r + 0.3), y, z: Math.sin(la) * (r + 0.3), color: AMBER }));
    const gh = Math.max(2, (T - 3) * (tint === 1 ? 0.45 : 0.7)), gy = -T + 1.5; // the level gauge: lit up to the fill line
    K.add('flat', H.box(0.5, T - 2.2, 0.12, { x: Math.cos(ga) * (r + 0.08), y: -T / 2 - 0.6, z: Math.sin(ga) * (r + 0.08), ry: -ga + Math.PI / 2, color: '#16181e' }));
    K.add('glow', H.box(0.3, gh, 0.06, { x: Math.cos(ga) * (r + 0.15), y: gy + gh / 2, z: Math.sin(ga) * (r + 0.15), ry: -ga + Math.PI / 2, color: light }));
    const nr = r > 6 ? 6 : 4;
    for (let k = 0; k < nr; k++) { const a = (k / nr) * Math.PI * 2 + 0.4; K.add('glow', H.box(0.3, 0.3, 0.3, { x: Math.cos(a) * (r - 0.3), y: 0.2, z: Math.sin(a) * (r - 0.3), color: RED })); }
    waterlineDisc(K, H, r, -p.h);
    sheenDisc(K, H, r, -p.h, light, rng, 0.4);
  },
  // The reverse-osmosis membrane hall: white panelled walls whose window bands glow with the lit
  // membrane racks inside, big blue pipes along the walls ringed with coolant bands, a tread roof
  // with lit skylight strips, a neon cornice, advert screens on the long walls, light on the water.
  'oc-hall'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h, wall = p.tint ? '#c8d4d8' : '#dadfe4';
    K.add('flat', H.box(w, T - 0.3, d, { y: -0.3 - (T - 0.3) / 2, color: wall }));
    plate(K, H, w + 0.3, d + 0.3, 0.3, '#9aa4ae', 4);
    edge(K, H, w + 0.3, d + 0.3, 0.2);
    for (const s of [-1, 1]) K.add('glow', H.box(1.4, 0.06, d - 6, { x: s * w * 0.22, y: 0.02, color: '#2a6a84' }));
    const lo = Math.max(wl + 1, -T);
    for (const f of faces(w, d)) {
      if (f.width < 8) continue;
      for (const y of [-2.2, -5.4]) if (y > lo + 1) {
        K.add('flat', fbox(H, f, 0, y, 0.02, f.width - 1.6, 1.5, 0.1, { color: '#3a4250' }));
        const n = Math.floor((f.width - 3) / 1.6);
        for (let k = 0; k < n; k++) { // a lit pane per membrane rack, a few dark
          const o = -f.width / 2 + 2 + k * 1.6, lit = rng() < 0.85;
          K.add(lit ? 'glow' : 'flat', fquad(H, f, o, y, 0.08, 1.3, 1.1, lit ? dim(rng() < 0.2 ? '#9ff0ff' : COOLW, 0.72 + rng() * 0.2) : '#1a2430'));
          if (lit) K.add('flat', fquad(H, f, o, y - 0.05, 0.09, 0.5, 0.8, '#5a6a78')); // the membrane vessel's silhouette
        }
      }
      K.add('flat', H.cyl(0.55, 0.55, f.width - 1, 8, { x: f.nx * (f.half + 0.6), y: Math.max(lo + 1.2, -T + 1.4), z: f.nz * (f.half + 0.6), rz: f.tx ? Math.PI / 2 : 0, rx: f.tz ? Math.PI / 2 : 0, color: '#2a6ab8' }));
      for (let a = -f.width / 2 + 3; a < f.width / 2 - 1; a += 6) K.add('glow', fbox(H, f, a, Math.max(lo + 1.2, -T + 1.4), 0.6, 0.18, 1.18, 1.18, { color: dim(CYAN, 0.9) }));
      K.add('neon', H.box(f.tx ? f.width + 0.3 : 0.12, 0.14, f.tz ? f.width + 0.3 : 0.12, { x: f.nx * (f.half + 0.1), y: -0.55, z: f.nz * (f.half + 0.1), color: CYAN }));
      if (f.width > 30) adPanel(K, H, f, f.width * 0.18 * (p.tint ? -1 : 1), -3.8, 7, Math.floor(rng() * 64));
    }
    if (wl > -T) { waterline(K, H, w, d, wl); sheen(K, H, w, d, wl, COOLW, rng, { k: 0.35 }); }
  },
  // The intake tower: red and white bands washed in floodlight from the base and the gallery
  // (unlit: it glows against the night), lit portholes, intake grilles at the waterline, a gallery
  // deck with a railing, a neon ring under it and floodlights round its foot.
  'oc-tower'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(24, 12);
    const lightK = (y) => Math.min(1, 0.32 + 0.62 * Math.exp(-(y + T) / 9) + 0.42 * Math.exp(y / 5)); // floods at the foot, downlights under the gallery
    for (let y = 0, i = 0; y > -T; y -= 6, i++) { const h = Math.min(6, T + y); K.add('glow', wash(H.cyl(r, r, h, n, { y: y - h / 2, color: i % 2 ? '#d8343c' : '#eef0f2' }), lightK)); }
    K.add('flat', H.cyl(r + 0.35, r + 0.35, 0.5, n, { y: -0.25, color: '#5a6272' }));
    K.add('neon', H.part(new THREE.TorusGeometry(r + 0.38, 0.1, 3, n), { rx: Math.PI / 2, y: -0.55, color: CYAN }));
    K.add('flat', H.part(new THREE.RingGeometry(r * 0.62, r + 0.35, n), { rx: -Math.PI / 2, y: 0.01, color: '#8a929e' }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; K.add('flat', H.box(0.08, 1.0, 0.08, { x: Math.cos(a) * (r + 0.25), y: 0.5, z: Math.sin(a) * (r + 0.25), color: '#ffcc1a' })); }
    K.add('flat', H.part(new THREE.TorusGeometry(r + 0.25, 0.05, 3, n), { rx: Math.PI / 2, y: 1.0, color: '#ffcc1a' }));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; K.add('glow', H.box(0.16, 0.16, 0.16, { x: Math.cos(a) * (r + 0.25), y: 1.05, z: Math.sin(a) * (r + 0.25), color: AMBER })); }
    for (let k = 0; k < 9; k++) { const a = k * 2.4, y = -4 - k * 3.2; if (y < -T + 2) break; K.add('glow', H.box(0.7, 0.9, 0.3, { x: Math.cos(a) * (r + 0.02), y, z: Math.sin(a) * (r + 0.02), ry: -a + Math.PI / 2, color: '#ffe8a8' })); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.add('flat', H.box(2.4, 1.6, 0.3, { x: Math.cos(a) * (r + 0.1), y: -T + 1.2, z: Math.sin(a) * (r + 0.1), ry: -a + Math.PI / 2, color: '#16181e' })); }
    for (let k = 0; k < 6; k++) { // floodlights round the foot, aimed up the tower
      const a = (k / 6) * Math.PI * 2 + 0.5, x = Math.cos(a) * (r + 0.9), z = Math.sin(a) * (r + 0.9);
      K.add('flat', H.box(0.8, 0.5, 0.8, { x, y: -T + 0.45, z, ry: -a, color: '#22252e' }));
      K.add('glow', H.box(0.66, 0.06, 0.66, { x, y: -T + 0.72, z, ry: -a, color: COOLW }));
    }
  },
  // The lantern room on the gallery: a glass drum with the lamp inside, a red roof you can stand on
  // with a lit rim, the beacon mast.
  'oc-lantern'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(16, 10);
    K.add('glass', H.cyl(r - 0.3, r - 0.3, T - 1.2, n, { y: -T / 2 - 0.3 }));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.add('flat', H.box(0.15, T - 1, 0.15, { x: Math.cos(a) * (r - 0.25), y: -T / 2 - 0.4, z: Math.sin(a) * (r - 0.25), color: '#22252e' })); }
    K.add('glow', H.part(new THREE.IcosahedronGeometry(1.1, 1), { y: -T / 2 - 0.3, color: '#fff4c0' }));
    for (let k = 0; k < 2; k++) K.add('glow', H.box(0.5, 0.5, r * 2.4, { y: -T / 2 - 0.3, ry: k * Math.PI / 2 + 0.4, color: '#fff0a8' })); // the lens throwing its light out
    K.add('flat', H.cyl(r, r + 0.2, 0.6, n, { y: -0.3, color: '#c8302a' }), H.cyl(r + 0.2, r + 0.2, 0.6, n, { y: -T + 0.3, color: '#3a404c' }));
    K.add('glow', H.part(new THREE.TorusGeometry(r + 0.22, 0.07, 3, n), { rx: Math.PI / 2, y: -0.05, color: AMBER }));
    K.add('flat', H.box(0.12, 4, 0.12, { x: r - 0.4, y: 2, color: '#22252e' }));
    K.add('glow', H.box(0.3, 0.3, 0.3, { x: r - 0.4, y: 4.1, color: RED }), H.box(0.18, 0.18, 0.18, { x: r - 0.4, y: 2.4, color: RED }));
  },
  // The work boat: a hull with a lit rubbing strake, a deck you ride, a tiny wheelhouse with lit
  // windows at the stern, nav lights and a mast lamp.
  'oc-boat'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w, T - 0.2, d, { y: -0.2 - (T - 0.2) / 2, color: '#e8762a' }));
    K.add('flat', H.part(new THREE.ConeGeometry(w / 2, 2.4, 4, 1), { z: -d / 2 - 1.0, y: -T / 2 - 0.1, rx: -Math.PI / 2, ry: Math.PI / 4, sx: 1, sz: 0.6, color: '#e8762a' }));
    plate(K, H, w - 0.3, d - 0.3, 0.2, '#5a6270', 2);
    K.add('flat', H.box(w + 0.2, 0.3, d + 0.2, { y: -0.6, color: '#16181e' }));
    outline(K, H, w + 0.2, d + 0.2, CYAN, -0.42, 0.08);
    K.add('flat', H.box(w * 0.7, 1.1, 1.4, { y: 0.55, z: d / 2 - 0.8, color: WHITE }), H.box(w * 0.72, 0.12, 1.5, { y: 1.15, z: d / 2 - 0.8, color: '#c8302a' }));
    K.add('glow', H.box(w * 0.72, 0.45, 0.05, { y: 0.75, z: d / 2 - 1.52, color: dim(WARMW, 0.8) }), H.box(0.05, 0.4, 1.0, { x: w * 0.36, y: 0.75, z: d / 2 - 0.8, color: dim(WARMW, 0.7) }), H.box(0.05, 0.4, 1.0, { x: -w * 0.36, y: 0.75, z: d / 2 - 0.8, color: dim(WARMW, 0.7) }));
    K.add('flat', H.box(0.08, 1.6, 0.08, { y: 2.0, z: d / 2 - 0.6, color: '#22252e' }));
    K.add('glow', H.box(0.18, 0.18, 0.18, { y: 2.85, z: d / 2 - 0.6, color: '#ffffff' }));
    K.add('glow', H.box(0.2, 0.2, 0.2, { x: -w / 2 + 0.2, y: 0.25, z: -d / 2 + 0.4, color: '#ff3a3a' }), H.box(0.2, 0.2, 0.2, { x: w / 2 - 0.2, y: 0.25, z: -d / 2 + 0.4, color: GREEN }));
  },
  // ---------------------------------------------------------------- stage 2: the server barges
  // A barge hull: navy topsides with a row of lit portholes, red antifouling under a white boot
  // stripe, bollards and a cyan LED strip round the deck edge, the halls' light on the water.
  'oc-barge'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h;
    plate(K, H, w, d, 0.25, '#6a7a72', 4);
    edge(K, H, w, d, 0.2);
    K.add('flat', H.box(w, T - 0.25, d, { y: -0.25 - (T - 0.25) / 2, color: '#1e2a44' }));
    K.add('flat', H.box(w + 0.06, 0.25, d + 0.06, { y: wl + 0.55, color: '#f0f0ea' }), H.box(w + 0.05, 1.0, d + 0.05, { y: wl, color: '#a83a2a' }));
    outline(K, H, w, d, CYAN, -0.3, 0.1);
    for (const s of [-1, 1]) for (let z = -d / 2 + 3; z < d / 2 - 2; z += 9) K.add('flat', H.cyl(0.22, 0.25, 0.5, 6, { x: s * (w / 2 - 0.4), y: 0.25, z, color: '#16181e' }));
    for (let z = -d / 2 + 2; z < d / 2 - 1; z += 3) for (const s of [-1, 1]) K.add('glow', H.box(0.06, 0.3, 0.45, { x: s * (w / 2 + 0.03), y: -1.25, z, color: rng() < 0.75 ? dim(WARMW, 0.8) : dim(CYAN, 0.8) }));
    for (const s of [-1, 1]) K.add('glow', H.box(0.05, 0.05, d * 0.9, { x: s * (w / 2 + 0.035), y: wl + 0.75, color: dim(MAGENTA, 0.7) }));
    sheen(K, H, w, d, wl, MAGENTA, rng, { k: 0.38 });
  },
  // A data hall: graphite walls ribbed with cooling fins, rows of rack blinkenlights between them,
  // two LED bands, a neon crown, antenna masts with red beacons on the corners, an advert screen
  // on each end, and a roof of flush fan grilles ringed in light. tint picks the neon (cyan,
  // magenta, green, amber).
  'oc-dc'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, neon = [CYAN, MAGENTA, GREEN, AMBER][(p.tint >= 0 ? p.tint : 0) % 4];
    K.add('flat', H.box(w, T - 0.3, d, { y: -0.3 - (T - 0.3) / 2, color: '#262c38' }));
    plate(K, H, w + 0.2, d + 0.2, 0.3, '#5a6474', 3);
    const fr = Math.min(w * 0.3, 1.4);
    for (let z = -d / 2 + 4; z < d / 2 - 2; z += 8) {
      K.add('flat', H.cyl(fr, fr, 0.06, 10, { y: 0.02, z, color: '#16181e' }));
      K.add('glow', H.part(new THREE.RingGeometry(fr, fr + 0.12, 10), { rx: -Math.PI / 2, y: 0.056, z, color: dim(neon, 0.85) }));
    }
    for (const f of faces(w, d)) {
      const n = Math.floor(f.width / 1.2);
      if (f.width > 8) for (let k = 0; k < n; k++) { const o = -f.width / 2 + 0.6 + k * 1.2; K.add('flat', fbox(H, f, o, -T / 2 - 0.5, 0.15, 0.12, T - 1.6, 0.35, { color: '#3e4656' })); }
      for (const y of [-2.2, -4.0]) if (y > -T + 1) for (let k = 0; k < Math.floor(f.width / 2.4); k++) {
        const o = -f.width / 2 + 1.2 + k * 2.4, c = [GREEN, CYAN, GREEN, AMBER, GREEN][(k + (y < -3 ? 2 : 0)) % 5];
        K.add('glow', fbox(H, f, o, y, 0.33, 0.9, 0.12, 0.06, { color: c }));
      }
      // rack blinkenlights: a grid of tiny LEDs in every bay between the fins
      if (f.width > 8) for (let k = 0; k < n - 1; k++) {
        const o = -f.width / 2 + 1.2 + k * 1.2;
        for (let y = -1.4; y > -T + 1.2; y -= 0.45) {
          if (Math.abs(y + 2.2) < 0.2 || Math.abs(y + 4.0) < 0.2 || rng() < 0.35) continue;
          K.add('glow', fquad(H, f, o + (rng() - 0.5) * 0.5, y, 0.03, 0.12, 0.08, LEDS[Math.floor(rng() * LEDS.length)]));
        }
      }
      K.add('neon', fbox(H, f, 0, -0.45, 0.12, f.width + 0.4, 0.18, 0.14, { color: neon }));
      if (f.width < 8 && T > 5) adPanel(K, H, f, 0, -T * 0.45, Math.min(4.2, f.width - 0.6), Math.floor(rng() * 64));
    }
    for (const [sx, sz] of [[-1, -1], [1, 1]]) beaconMast(K, H, sx * (w / 2 - 0.3), sz * (d / 2 - 0.4), 3.5 + rng() * 2.5);
  },
  // The hot aisle: a trench floor of grating with red heat glowing along its sides and up through
  // the grates between its slats.
  'oc-aisle'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    plate(K, H, w, d, 0.2, '#4a3a3a', 1.5);
    K.add('flat', H.box(w - 0.2, T - 0.2, d - 0.2, { y: -T / 2 - 0.1, color: '#22252e' }));
    for (const s of [-1, 1]) K.add('neon', H.box(0.12, 0.08, d - 0.4, { x: s * (w / 2 - 0.1), y: 0.04, color: '#ff4a2a' }));
    for (let z = -d / 2 + 3; z < d / 2; z += 6) {
      K.add('flat', H.box(w * 0.6, 0.04, 1.2, { y: 0.02, z, color: '#16181e' }));
      K.add('glow', H.box(w * 0.5, 0.03, 0.1, { y: 0.03, z: z - 0.45, color: '#8a2414' }), H.box(w * 0.5, 0.03, 0.1, { y: 0.03, z: z + 0.45, color: '#8a2414' }));
    }
  },
  // A rooftop / deck chiller: grey casing, a colour stripe, fan grilles flush with its top, each
  // ringed in blue light, a status strip.
  'oc-chiller'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = p.tint ? '#b8c4cc' : '#d8dce2';
    K.add('flat', H.box(w, T - 0.2, d, { y: -0.2 - (T - 0.2) / 2, color: col }));
    plate(K, H, w, d, 0.2, '#7a8290', 2);
    const n = Math.max(1, Math.floor(Math.max(w, d) / 2.4));
    for (let k = 0; k < n; k++) {
      const o = -Math.max(w, d) / 2 + (k + 0.5) * (Math.max(w, d) / n), at = w > d ? { x: o } : { z: o };
      K.add('flat', H.cyl(0.9, 0.9, 0.06, 10, { y: 0.02, ...at, color: '#22252e' }));
      K.add('glow', H.part(new THREE.RingGeometry(0.9, 1.0, 10), { rx: -Math.PI / 2, y: 0.055, ...at, color: dim(p.tint ? BLUE : CYAN, 0.85) }));
    }
    for (const f of faces(w, d)) {
      K.add('flat', H.box(f.tx ? f.width + 0.02 : 0.04, 0.3, f.tz ? f.width + 0.02 : 0.04, { x: f.nx * (f.half + 0.01), y: -0.6, z: f.nz * (f.half + 0.01), color: p.tint ? '#2a6ab8' : '#c8302a' }));
      K.add('glow', fbox(H, f, 0, -0.95, 0.03, f.width * 0.5, 0.07, 0.03, { color: dim(GREEN, 0.8) }));
    }
  },
  // The heat-exchanger stack: finned tiers whose hot vents glow orange, hot pipes up two faces with
  // glowing bands, red lights on the corners and a lit rim.
  'oc-stack'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w - 0.6, T, d - 0.6, { y: -T / 2, color: '#3a404c' }));
    for (let y = -1.2; y > -T + 1; y -= 1.1) {
      const hot = (Math.round(-y / 1.1) % 4) === 0;
      K.add('flat', H.box(w, 0.35, d, { y, color: hot ? '#c8642a' : '#8a929e' }));
      if (hot) K.add('glow', H.box(w - 0.4, 0.5, d + 0.02, { y: y - 0.45, color: dim('#ff6a2a', 0.75) }), H.box(w + 0.02, 0.5, d - 0.4, { y: y - 0.45, color: dim('#ff6a2a', 0.75) }));
    }
    plate(K, H, w, d, 0.3, '#7a8290', 2);
    edge(K, H, w, d);
    outline(K, H, w, d, AMBER, -0.24, 0.09);
    for (const [sx, sz] of [[1, 0], [0, 1]]) for (const o of [-1.4, 1.4]) {
      const x = sx * (w / 2 + 0.35) + (sz ? o : 0), z = sz * (d / 2 + 0.35) + (sx ? o : 0);
      K.add('flat', H.cyl(0.32, 0.32, T, 6, { x, y: -T / 2, z, color: '#d8402a' }));
      for (let y = -3; y > -T + 2; y -= 5) K.add('glow', H.cyl(0.35, 0.35, 0.18, 6, { x, y, z, color: dim('#ff4a2a', 0.9) }));
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: sx * (w / 2 - 0.2), y: 0.25, z: sz * (d / 2 - 0.2), color: RED }));
  },
  // A cooling tower: a concrete hyperboloid (the collider is its rim's cylinder) with a fan deck on
  // top (an annulus of tread round a big fan grille, flush), neon rings at the rim and at its
  // waist, LED risers up the shell, aviation lights round the rim, its light on the water.
  'oc-cooling'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(24, 12);
    const prof = [], kAt = (t) => 1 - 0.14 * Math.sin(Math.PI * Math.min(1, t * 1.3)) + 0.06 * t;
    for (let i = 0; i <= 8; i++) { const t = i / 8; prof.push(new THREE.Vector2(r * kAt(t), -T * t)); }
    K.add('flat', H.part(new THREE.LatheGeometry(prof.reverse(), n), { color: '#c8c4bc' }));
    K.add('flat', H.cyl(r + 0.05, r + 0.05, 1.2, n, { y: -1.0, color: '#c8302a' }), H.cyl(r + 0.06, r + 0.06, 0.4, n, { y: -2.0, color: '#eef0f2' }));
    K.add('deck', H.part(new THREE.RingGeometry(r * 0.62, r + 0.05, n), { rx: -Math.PI / 2, y: 0.0, color: '#a8b0bc' }));
    K.add('flat', H.part(new THREE.CircleGeometry(r * 0.62, n), { rx: -Math.PI / 2, y: -0.02, color: '#2e3540' }));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; K.add('flat', H.box(r * 0.56, 0.06, r * 0.16, { x: Math.cos(a) * r * 0.3, z: -Math.sin(a) * r * 0.3, y: -0.015, ry: a + 0.25, color: '#7a8492' })); } // the fan's blades under the grille
    for (const rr of [0.2, 0.4]) K.add('flat', H.part(new THREE.RingGeometry(r * rr, r * rr + 0.12, n), { rx: -Math.PI / 2, y: 0.01, color: '#9aa2ae' }));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.add('flat', H.box(r * 1.24, 0.08, 0.3, { y: 0.0, ry: a, color: '#9aa2ae' })); }
    K.add('flat', H.cyl(r * 0.12, r * 0.12, 0.1, 8, { y: 0.0, color: '#c8302a' }));
    K.add('glow', H.part(new THREE.RingGeometry(r * 0.56, r * 0.6, n), { rx: -Math.PI / 2, y: 0.005, color: dim(CYAN, 0.5) })); // the fan's light coming up through the grille
    K.add('hazard', H.part(new THREE.RingGeometry(r * 0.62, r * 0.62 + 0.4, n), { rx: -Math.PI / 2, y: 0.02 }));
    K.add('neon', H.part(new THREE.TorusGeometry(r + 0.12, 0.12, 3, n), { rx: Math.PI / 2, y: -0.4, color: CYAN }));
    const wt = 0.62, wy = -T * wt; // the waist ring and the risers
    K.add('neon', H.part(new THREE.TorusGeometry(r * kAt(wt) + 0.1, 0.14, 3, n), { rx: Math.PI / 2, y: wy, color: MAGENTA }));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.78;
      for (let i = 1; i < 8; i++) { const t0 = i / 8, y = -T * t0, rr = r * kAt(t0) + 0.06; if (y < -p.h + 1) break; K.add('glow', H.box(0.18, T / 8 - 0.5, 0.08, { x: Math.cos(a) * rr, y, z: Math.sin(a) * rr, ry: -a + Math.PI / 2, color: dim(CYAN, 0.8) })); }
    }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; K.add('glow', H.box(0.28, 0.28, 0.28, { x: Math.cos(a) * (r + 0.15), y: -1.0, z: Math.sin(a) * (r + 0.15), color: RED })); }
    waterlineDisc(K, H, r * 1.06, -p.h);
    sheenDisc(K, H, r * 1.06, -p.h, CYAN, rng, 0.42);
  },
  // A cable tray: a channel of cable bundles you run along (two of them lit fibre trunks), orange
  // lips, hangers under it with status lamps.
  'oc-tray'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p), A = (a, b) => (along === 'z' ? a : b);
    K.add('flat', H.box(A(W, L), 0.3, A(L, W), { y: -0.18, color: '#7a828e' }));
    const cols = ['#2a6ab8', CYAN, '#16181e', MAGENTA, '#3a8a4a'];
    for (let i = 0; i < 5; i++) { const o = -W / 2 + 0.3 + (i * (W - 0.6)) / 4; K.add(i === 1 || i === 3 ? 'glow' : 'flat', H.cyl(0.14, 0.14, L - 0.4, 5, { ...(along === 'z' ? { x: o, rx: Math.PI / 2 } : { z: o, rz: Math.PI / 2 }), y: -0.06, color: i === 1 || i === 3 ? dim(cols[i], 0.8) : cols[i] })); }
    for (const s of [-1, 1]) K.add('flat', H.box(A(0.12, L), 0.3, A(L, 0.12), { ...(along === 'z' ? { x: s * (W / 2 - 0.06) } : { z: s * (W / 2 - 0.06) }), y: 0.0, color: '#ff8a1a' }));
    for (let k = -L / 2 + 2; k < L / 2; k += 5) {
      K.add('flat', H.box(A(W + 0.3, 0.2), 0.2, A(0.2, W + 0.3), { ...(along === 'z' ? { z: k } : { x: k }), y: -0.45, color: STEEL }));
      K.add('glow', H.box(0.14, 0.14, 0.14, { ...(along === 'z' ? { z: k, x: W / 2 + 0.2 } : { x: k, z: W / 2 + 0.2 }), y: -0.45, color: GREEN }));
    }
  },
  // A cargo drone (you ride its back): a deck slab with a lit edge, four rotor arms with LED rings,
  // a server rack slung under it, its rack lights blinking.
  'oc-cargo'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.35, '#5a6270', 2);
    edge(K, H, w, d, 0.12);
    outline(K, H, w, d, CYAN, -0.32, 0.08);
    K.add('flat', H.box(w * 0.7, 0.5, d * 0.7, { y: -0.6, color: '#2a2e38' }));
    K.add('glow', H.box(w * 0.5, 0.05, d * 0.5, { y: -0.87, color: dim(CYAN, 0.7) }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const ax = sx * (w / 2 + 0.9), az = sz * (d / 2 + 0.9);
      K.add('flat', H.box(1.6, 0.18, 0.18, { x: sx * (w / 2 + 0.2), y: -0.25, z: sz * (d / 2 + 0.2), ry: sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4, color: '#3a3e4a' }));
      K.add('flat', H.cyl(0.18, 0.18, 0.35, 6, { x: ax, y: -0.15, z: az, color: '#22252e' }));
      K.add('glow', H.part(new THREE.TorusGeometry(0.95, 0.05, 3, 12), { x: ax, y: 0.0, z: az, rx: Math.PI / 2, color: sx > 0 ? GREEN : '#ff3a3a' }));
    }
    for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('flat', H.box(0.05, 1.6, 0.05, { x: sx * 0.6, y: -1.6, z: sz * 0.4, color: '#16181e' }));
    K.add('flat', H.box(1.3, 2.2, 0.9, { y: -3.4, color: '#22252e' }));
    for (let k = 0; k < 6; k++) K.add('glow', H.box(1.0, 0.06, 0.05, { y: -2.6 - k * 0.3, z: -0.47, color: k % 3 === 1 ? AMBER : GREEN }), H.box(1.0, 0.06, 0.05, { y: -2.6 - k * 0.3, z: 0.47, color: k % 3 === 2 ? CYAN : GREEN }));
  },
  // ---------------------------------------------------------------- stage 3: the wind farm
  // A turbine's transition piece: the yellow access platform with its railing and rim light, on a
  // yellow foundation going down into the sea, lit by two floodlights, its glow on the water.
  'oc-tp'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(20, 10);
    K.add('deck', H.part(new THREE.CylinderGeometry(r, r, 0.35, n), { y: -0.18, color: '#d8b020' }));
    K.add('flat', H.part(new THREE.CylinderGeometry(r, 2.6, 2.2, n), { y: -1.45, color: YELLOW }));
    K.add('glow', wash(H.cyl(2.62, 2.62, Math.max(0.5, T - 2.5), n, { y: -2.5 - (T - 2.5) / 2, color: '#d8b020' }), (y) => 0.22 + 0.5 * Math.exp((y + 2.5) / 3)));
    K.add('flat', H.cyl(2.65, 2.65, 3, n, { y: -p.h - 1.0, color: '#3a404c' }));
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; if (k % 7 === 3) continue; K.add('flat', H.box(0.08, 1.0, 0.08, { x: Math.cos(a) * (r - 0.1), y: 0.5, z: Math.sin(a) * (r - 0.1), color: '#ffcc1a' })); }
    K.add('flat', H.part(new THREE.TorusGeometry(r - 0.1, 0.05, 3, n), { rx: Math.PI / 2, y: 1.0, color: '#ffcc1a' }));
    K.add('glow', H.box(0.25, 0.25, 0.25, { x: r - 0.3, y: 1.2, color: '#ffe26a' }), H.box(0.25, 0.25, 0.25, { x: -r + 0.3, y: 1.2, color: '#ffe26a' }));
    K.add('glow', H.part(new THREE.TorusGeometry(r + 0.03, 0.08, 3, n), { rx: Math.PI / 2, y: -0.08, color: AMBER })); // rim light
    K.add('glow', H.part(new THREE.TorusGeometry(r * 0.75, 0.06, 3, n), { rx: Math.PI / 2, y: -1.6, color: dim(CYAN, 0.8) }));
    sheenDisc(K, H, 2.7, -p.h, AMBER, rng, 0.45);
  },
  // A turbine tower: a white tube, a grey band at its foot, red aviation lights at mid-height, a
  // lit service door.
  'oc-mast'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(16, 10);
    K.add('flat', H.cyl(r * 0.9, r, T, n, { y: -T / 2, color: '#e8ecf0' }));
    K.add('flat', H.cyl(r + 0.02, r + 0.02, 1.2, n, { y: -T + 0.6, color: '#8a929e' }));
    K.add('flat', H.box(0.9, 2.0, 0.12, { x: 0, y: -T + 1.2, z: r + 0.01, color: '#5a6272' }));
    K.add('glow', H.box(0.7, 0.08, 0.06, { x: 0, y: -T + 2.35, z: r + 0.05, color: COOLW }));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; K.add('glow', H.box(0.3, 0.3, 0.3, { x: Math.cos(a) * r * 0.95, y: -T * 0.5, z: Math.sin(a) * r * 0.95, color: RED })); }
  },
  // A nacelle (its roof walkable, its edge lit) with the locked, feathered rotor at its local -Z end;
  // red lights on the roof corners and on each blade tip.
  'oc-nacelle'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w, T - 0.2, d, { y: -T / 2 - 0.1, color: '#eef0f2' }));
    plate(K, H, w, d, 0.2, '#c8ccd2', 2);
    K.add('hazard', H.box(w - 0.6, 0.03, 2.4, { y: 0.02, z: d / 2 - 1.6 }));
    K.add('flat', H.box(w + 0.1, 0.25, d + 0.1, { y: -T + 0.1, color: '#8a929e' }));
    const hz = -d / 2 - 1.2, hy = -T / 2;
    K.add('flat', H.part(new THREE.ConeGeometry(1.5, 2.6, H.seg(12, 8)), { z: hz, y: hy, rx: -Math.PI / 2, color: '#eef0f2' }));
    K.add('flat', H.cyl(1.55, 1.55, 0.5, H.seg(12, 8), { z: hz + 1.2, y: hy, rx: Math.PI / 2, color: '#c8ccd2' }));
    for (let k = 0; k < 3; k++) { // blades in a Y: one up, two down and out
      const a = Math.PI / 2 + (k * 2 * Math.PI) / 3, L = 24;
      K.add('flat', H.part(new THREE.BoxGeometry(0.5, L, 1.6), { x: Math.cos(a) * (L / 2 + 1.2), y: hy + Math.sin(a) * (L / 2 + 1.2), z: hz + 0.3, rz: a - Math.PI / 2, sx: 1, color: '#e8ecf0' }));
      K.add('flat', H.part(new THREE.BoxGeometry(0.52, 3, 1.62), { x: Math.cos(a) * (L + 0.4), y: hy + Math.sin(a) * (L + 0.4), z: hz + 0.3, rz: a - Math.PI / 2, color: '#d8343c' }));
      K.add('glow', H.box(0.4, 0.4, 0.4, { x: Math.cos(a) * (L + 2.0), y: hy + Math.sin(a) * (L + 2.0), z: hz + 0.3, color: RED }));
    }
    for (const z of [-d / 2 + 0.4, d / 2 - 0.4]) K.add('glow', H.box(0.35, 0.35, 0.35, { x: w / 2 - 0.4, y: 0.3, z, color: RED }));
    K.add('glow', H.box(0.06, 0.3, d * 0.6, { x: -w / 2 - 0.04, y: -T * 0.55, color: dim(CYAN, 0.8) }), H.box(0.06, 0.3, d * 0.6, { x: w / 2 + 0.04, y: -T * 0.55, color: dim(CYAN, 0.8) })); // a light line down its flanks
    outline(K, H, w, d, '#ff6a4a', -0.08, 0.07);
  },
  // The service hoist up a turbine tower: a cage floor with low corner posts, a beacon, lit edges.
  'oc-hoist'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.3, '#d8b020', 1.5);
    K.add('flat', H.box(w * 0.8, 0.4, d * 0.8, { y: -0.5, color: '#22252e' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.1, 0.9, 0.1, { x: sx * (w / 2 - 0.05), y: 0.45, z: sz * (d / 2 - 0.05), color: YELLOW }));
    K.add('glow', H.box(0.25, 0.25, 0.25, { x: w / 2 - 0.05, y: 1.0, z: d / 2 - 0.05, color: AMBER }));
    outline(K, H, w, d, '#ffe26a', -0.15);
    K.add('glow', H.box(w * 0.5, 0.05, d * 0.5, { y: -0.72, color: dim(AMBER, 0.6) }));
  },
  // A junction platform at access-platform height: a deck on a steel jacket, switch cabinets in a
  // corner with lit status panels, an LED edge and floodlights on the jacket.
  'oc-junction'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    plate(K, H, w, d, 0.3, '#8c96a4', 3);
    edge(K, H, w, d);
    outline(K, H, w, d, CYAN, -0.32, 0.1);
    K.add('flat', H.box(w - 1, 2.0, d - 1, { y: -1.3, color: STEEL }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      K.add('flat', H.cyl(0.4, 0.5, T, 6, { x: sx * (w / 2 - 0.6), y: -T / 2, z: sz * (d / 2 - 0.6), color: YELLOW }));
      K.add('flat', H.box(0.2, 6, 0.2, { x: sx * (w / 2 - 0.6), y: -5, z: 0, rx: sz * 0.7, color: STEEL_LT }));
      K.add('glow', H.cyl(0.43, 0.43, 0.14, 6, { x: sx * (w / 2 - 0.6), y: -4, z: sz * (d / 2 - 0.6), color: dim(AMBER, 0.85) }));
    }
    K.add('flat', H.box(1.6, 1.8, 0.9, { x: -w / 2 + 1.0, y: 0.9, z: -d / 2 + 0.6, color: '#c8ccd2' }));
    K.add('glow', H.box(1.0, 0.12, 0.05, { x: -w / 2 + 1.0, y: 1.3, z: -d / 2 + 1.07, color: GREEN }));
    for (let k = 0; k < 4; k++) K.add('glow', H.box(0.12, 0.12, 0.05, { x: -w / 2 + 0.55 + k * 0.3, y: 1.0, z: -d / 2 + 1.07, color: LEDS[(k * 3) % LEDS.length] }));
    sheen(K, H, w, d, -p.h, AMBER, rng, { k: 0.3, n: 2 });
  },
  // A power gantry: grating over a truss, rails both sides, either axis long; lit edges (you can
  // see where it ends at night) and lamps along the truss.
  'oc-gantry'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p), A = (a, b) => (along === 'z' ? a : b);
    plate(K, H, p.w, p.d, 0.15, '#9aa2ae', 1.2);
    for (const s of [-1, 1]) {
      const o = s * (W / 2 - 0.05);
      if (along === 'z') rail(K, H, o, -L / 2, o, L / 2, '#ffcc1a'); else rail(K, H, -L / 2, o, L / 2, o, '#ffcc1a');
      K.add('flat', H.box(A(0.2, L), 0.2, A(L, 0.2), { ...(along === 'z' ? { x: s * (W / 2 - 0.1) } : { z: s * (W / 2 - 0.1) }), y: -1.4, color: STEEL_LT }));
      for (let k = -L / 2 + 1; k < L / 2 - 1; k += 2.4) K.add('flat', H.box(A(0.12, 1.8), 0.12, A(1.8, 0.12), { ...(along === 'z' ? { x: s * (W / 2 - 0.1), z: k + 0.6 } : { z: s * (W / 2 - 0.1), x: k + 0.6 }), y: -0.7, ...(along === 'z' ? { rx: 0.7 } : { rz: 0.7 }), color: STEEL_LT }));
      K.add('glow', H.box(A(0.06, L), 0.06, A(L, 0.06), { ...(along === 'z' ? { x: s * (W / 2 + 0.02) } : { z: s * (W / 2 + 0.02) }), y: -1.4, color: dim(CYAN, 0.75) }));
    }
    K.add('flat', H.box(A(0.3, L), 0.3, A(L, 0.3), { ...(along === 'z' ? { x: W / 2 - 0.4 } : { z: W / 2 - 0.4 }), y: -0.3, color: '#16181e' }));
    outline(K, H, p.w, p.d, AMBER, -0.1);
  },
  // The comms mast: a red-and-white lattice of four legs with braces, dishes with lit feeds, red
  // beacons up it, and a cyan LED down each leg.
  'oc-lattice'(K, p, th, rng, H) {
    const { w } = p, T = p.thick, h = w / 2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (let y = 0, i = 0; y > -T; y -= 6, i++) K.add('flat', H.box(0.22, Math.min(6, T + y), 0.22, { x: sx * h, y: y - Math.min(6, T + y) / 2, z: sz * h, color: i % 2 ? '#d8343c' : '#eef0f2' }));
    for (let y = -1.5; y > -T; y -= 3) for (const f of faces(w, w)) K.add('flat', H.box(f.tx ? w * 1.4 : 0.1, 0.1, f.tz ? w * 1.4 : 0.1, { x: f.nx * h, y, z: f.nz * h, ...(f.tx ? { rz: (Math.round(y) % 2 ? 0.75 : -0.75) } : { rx: (Math.round(y) % 2 ? 0.75 : -0.75) }), color: '#c8ccd2' }));
    for (const [y, a] of [[-12, 0.4], [-20, 2.6], [-27, 4.4]]) if (y > -T) {
      K.add('flat', H.part(new THREE.CylinderGeometry(1.4, 0.4, 0.6, 10), { x: Math.cos(a) * 1.8, y, z: Math.sin(a) * 1.8, rz: Math.PI / 2, ry: -a, color: '#eef0f2' }));
      K.add('glow', H.box(0.2, 0.2, 0.2, { x: Math.cos(a) * 2.3, y, z: Math.sin(a) * 2.3, color: GREEN }));
    }
    for (let y = -4; y > -T; y -= 9) K.add('glow', H.box(0.34, 0.34, 0.34, { x: h, y, z: h, color: RED }), H.box(0.34, 0.34, 0.34, { x: -h, y: y - 4.5, z: -h, color: RED }));
    for (const [sx, sz] of [[1, -1], [-1, 1]]) K.add('glow', H.box(0.06, T - 2, 0.06, { x: sx * (h + 0.13), y: -T / 2 - 1, z: sz * (h + 0.13), color: dim(CYAN, 0.7) }));
  },
  // The mast's top platform: grating, a lit edge, whip antennas at the corners, red beacons.
  'oc-masttop'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.3, '#8a929e', 1.5);
    edge(K, H, w, d, 0.12);
    outline(K, H, w, d, TEAL, -0.28, 0.09);
    for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('flat', H.box(0.08, 5, 0.08, { x: sx * (w / 2 - 0.15), y: 2.5, z: sz * (d / 2 - 0.15), color: '#c8ccd2' }));
    K.add('glow', H.box(0.4, 0.4, 0.4, { x: -w / 2 + 0.15, y: 5.1, z: -d / 2 + 0.15, color: RED }), H.box(0.4, 0.4, 0.4, { x: w / 2 - 0.15, y: 5.1, z: d / 2 - 0.15, color: RED }));
  },
  // The data haven's spine: a dark glass tower full of lit floors (the facade's windows), striped
  // with LED risers, floor bands every 6 m, advert screens and a holographic ring at the crown, the
  // roof (the exit) ringed in neon, and the lit spire mast in one corner.
  'oc-spine'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    const fac = H.meterBox(w, T, d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: 6, v0: 2, color: '#4a5a7a' });
    fac.translate(0, -T / 2, 0); K.add('facade', fac);
    plate(K, H, w + 0.4, d + 0.4, 0.4, '#3a4252', 4);
    for (const f of faces(w, d)) {
      for (let o = -f.width / 2 + 1.8; o < f.width / 2 - 1; o += 3.6) K.add('glow', H.box(f.tx ? 0.18 : 0.06, T - 3, f.tz ? 0.18 : 0.06, { x: f.nx * (f.half + 0.03) + f.tx * o, y: -T / 2 - 1.5, z: f.nz * (f.half + 0.03) + f.tz * o, color: (Math.round(o) % 3) ? CYAN : BLUE }));
      for (let y = -6; y > -T + 2; y -= 6) K.add('flat', H.box(f.tx ? f.width + 0.6 : 0.3, 0.45, f.tz ? f.width + 0.6 : 0.3, { x: f.nx * (f.half + 0.15), y, z: f.nz * (f.half + 0.15), color: '#2a3242' }));
      K.add('neon', H.box(f.tx ? f.width + 0.6 : 0.16, 0.25, f.tz ? f.width + 0.6 : 0.16, { x: f.nx * (f.half + 0.22), y: -0.6, z: f.nz * (f.half + 0.22), color: '#2bd6ff' }));
      K.add('neon', H.box(f.tx ? f.width + 0.9 : 0.2, 0.35, f.tz ? f.width + 0.9 : 0.2, { x: f.nx * (f.half + 0.3), y: -T * 0.25, z: f.nz * (f.half + 0.3), color: MAGENTA }));
      if (f.nz !== 1) adPanel(K, H, f, 0, -T * 0.25 - 6, 12, Math.floor(rng() * 64)); // (the south face is the blade bay)
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', H.box(0.4, 0.4, 0.4, { x: sx * (w / 2 + 0.1), y: 0.3, z: sz * (d / 2 + 0.1), color: RED }));
    const mx = -w / 2 + 1.5, mz = -d / 2 + 1.5;
    K.add('flat', H.box(1.2, 1.2, 1.2, { x: mx, y: 0.6, z: mz, color: '#3a4252' }), H.cyl(0.25, 0.45, 26, 6, { x: mx, y: 13, z: mz, color: '#c8ccd2' }));
    for (let y = 4; y < 26; y += 5) K.add('glow', H.box(0.5, 0.25, 0.5, { x: mx, y, z: mz, color: RED }));
    K.add('glow', H.part(new THREE.IcosahedronGeometry(0.7, 0), { x: mx, y: 26.5, z: mz, color: '#ffffff' }));
    K.add('glow', H.part(new THREE.TorusGeometry(2.2, 0.08, 3, 16), { x: mx, y: 20, z: mz, rx: Math.PI / 2, color: CYAN }), H.part(new THREE.TorusGeometry(1.6, 0.06, 3, 16), { x: mx, y: 22.5, z: mz, rx: Math.PI / 2, color: MAGENTA }));
    K.add('neon', H.part(new THREE.RingGeometry(3.4, 3.8, H.seg(24, 12)), { rx: -Math.PI / 2, y: 0.03, color: '#2bd6ff' }));
    edge(K, H, w + 0.4, d + 0.4, 0.2);
    outline(K, H, w + 0.4, d + 0.4, '#2bd6ff', -0.2, 0.12);
    // the blade bay on the south face (local +z): a lit panel behind the hot-swap blades and an amber
    // guide rail under each blade's track (heights as in ocean-storm.js: 38 m → 75 m in 11 steps, roof 78 m)
    const bayH = 40, bayW = 15;
    K.add('flat', H.box(bayW, bayH, 0.2, { y: -bayH / 2, z: d / 2 + 0.1, color: '#1e2c44' }));
    for (let k = 0; k < 7; k++) for (let y = -2; y > -bayH + 1; y -= 0.9) if (rng() < 0.5) K.add('glow', H.box(0.14, 0.08, 0.04, { x: -bayW / 2 + 1 + k * 2.1 + rng() * 0.8, y, z: d / 2 + 0.22, color: LEDS[Math.floor(rng() * LEDS.length)] }));
    for (const sx of [-1, 1]) K.add('glow', H.box(0.25, bayH, 0.12, { x: sx * bayW / 2, y: -bayH / 2, z: d / 2 + 0.22, color: AMBER }));
    for (let i = 0; i < 11; i++) { const y = 38 + (i + 1) * (37 / 11) - 78; K.add('glow', H.box(bayW - 0.4, 0.12, 0.12, { y: y - 0.75, z: d / 2 + 0.24, color: '#ff8a2a' })); }
    sheen(K, H, w, d, -p.h, CYAN, rng, { k: 0.4 });
  },
  // A terrace on the spine: grating with a neon edge on its outer sides and lamps under it.
  'oc-balcony'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.3, '#5a6272', 2);
    K.add('flat', H.box(w - 0.4, 0.6, d - 0.4, { y: -0.6, color: '#2a303c' }));
    for (const f of faces(w, d)) K.add('neon', H.box(f.tx ? f.width : 0.1, 0.1, f.tz ? f.width : 0.1, { x: f.nx * (f.half - 0.05), y: 0.05, z: f.nz * (f.half - 0.05), color: p.tint ? MAGENTA : '#2bd6ff' }));
    for (const f of faces(w, d)) if (f.width > 6) for (let o = -f.width / 2 + 1; o < f.width / 2; o += 2) K.add('glow', H.box(0.1, 0.1, 0.1, { x: f.nx * (f.half - 0.1) + f.tx * o, y: -0.9, z: f.nz * (f.half - 0.1) + f.tz * o, color: '#ffe8a8' }));
  },
  // A hot-swap server blade sliding along the spine's face: a bright steel slab, an LED front,
  // handles, and glowing edges so you can read it against the dark tower.
  'oc-blade'(K, p, th, rng, H) {
    const { w, d } = p, led = [GREEN, CYAN, AMBER][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, p.thick, d, { y: -p.thick / 2, color: '#8a929e' }));
    plate(K, H, w, d, 0.1, '#d8dce2', 1.5);
    for (let k = 0; k < 6; k++) K.add('glow', H.box(0.3, 0.12, 0.05, { x: -w / 2 + 0.5 + k * 0.6, y: -0.35, z: d / 2 + 0.02, color: k % 3 === 2 ? '#ffffff' : led }));
    for (const sx of [-1, 1]) K.add('flat', H.box(0.12, 0.12, 0.6, { x: sx * (w / 2 - 0.4), y: -0.3, z: d / 2 + 0.3, color: '#22252e' }));
    outline(K, H, w, d, led, -0.05, 0.1);
  },
  // ---------------------------------------------------------------- the boss: BRINE POOL
  // A pump deck on the pool's rim (local -z faces the pool): tread, a hazard lip on the pool edge with
  // a concrete wall down to the brine, pump motors on its outer edge with lit bands, a railing and
  // an LED strip on the sea side, a floodlight mast aimed at the pool.
  'oc-pumpdeck'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h;
    plate(K, H, w, d, 0.3, p.tint ? '#7e8c9a' : '#8c96a4', 4);
    stripe(K, H, w, 0, 0.025, -d / 2 + 0.25, 0, 0.5);
    K.add('flat', H.box(w, T - 0.3, d - 0.4, { y: -0.3 - (T - 0.3) / 2, z: 0.2, color: STEEL }));
    const cw = H.meterBox(w, -wl - 1.0, 0.4, 3, { faces: ['nz', 'px', 'nx'], color: '#a8a49c' }); cw.translate(0, (wl - 1.0) / 2 - 0.0, -d / 2 + 0.2); K.add('concrete', cw);
    K.add('neon', H.box(w - 0.4, 0.12, 0.12, { y: -0.35, z: -d / 2 - 0.05, color: TEAL }));
    K.add('glow', H.box(w - 0.6, 0.08, 0.08, { y: -0.2, z: d / 2 + 0.04, color: CYAN }));
    for (const s of [-1, 1]) K.add('glow', H.box(0.08, 0.08, d - 0.6, { x: s * (w / 2 + 0.04), y: -0.2, color: dim(CYAN, 0.8) }));
    rail(K, H, -w / 2 + 0.3, d / 2 - 0.1, w / 2 - 0.3, d / 2 - 0.1, '#ffcc1a');
    for (const x of [-w * 0.3, w * 0.3]) {
      K.add('flat', H.cyl(0.9, 0.9, 2.2, 10, { x, y: -1.4, z: d / 2 + 1.0, rz: Math.PI / 2, color: '#3a6ab8' }), H.box(2.6, 1.6, 1.8, { x, y: -1.4, z: d / 2 + 1.0, color: '#2a303c' }));
      K.add('glow', H.cyl(0.93, 0.93, 0.16, 10, { x: x - 0.7, y: -1.4, z: d / 2 + 1.0, rz: Math.PI / 2, color: CYAN }), H.cyl(0.93, 0.93, 0.16, 10, { x: x + 0.7, y: -1.4, z: d / 2 + 1.0, rz: Math.PI / 2, color: CYAN }));
      K.add('flat', H.cyl(0.45, 0.45, -wl + 1, 8, { x, y: wl / 2 - 1.2, z: d / 2 + 1.0, color: '#4a5260' }));
      K.add('glow', H.box(0.3, 0.3, 0.3, { x, y: -0.4, z: d / 2 + 1.95, color: RED }));
    }
    if (p.tint === 0) { // a floodlight mast on the sea edge of every other deck, aimed at the pool
      K.add('flat', H.cyl(0.1, 0.14, 7, 5, { x: w / 2 - 0.3, y: 3.2, z: d / 2 + 0.3, color: '#4a5260' }));
      for (const dx of [-0.5, 0.5]) flood(K, H, w / 2 - 0.3 + dx, 6.6, d / 2 + 0.0, Math.PI);
      K.add('glow', H.box(0.2, 0.2, 0.2, { x: w / 2 - 0.3, y: 7.2, z: d / 2 + 0.3, color: RED }));
    }
    waterline(K, H, w, d - 0.4, wl);
    sheen(K, H, w, d, wl, CYAN, rng, { k: 0.35, n: 2, skip: (f) => f.nz === -1 });
  },
  // A pump stack (cover and a perch): a banded column (its bands lit cyan between the red), pipes,
  // red danger lights on top, a lit rim.
  'oc-pillar'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#4a5260' }));
    for (let y = -1, i = 0; y > -T; y -= 1.4, i++) K.add(i % 2 ? 'glow' : 'flat', H.box(w + 0.12, 0.3, d + 0.12, { y, color: i % 2 ? dim(CYAN, 0.75) : '#c8302a' }));
    plate(K, H, w + 0.2, d + 0.2, 0.3, '#7a8290', 2);
    edge(K, H, w + 0.2, d + 0.2, 0.12);
    outline(K, H, w + 0.2, d + 0.2, AMBER, -0.24, 0.08);
    K.add('flat', H.cyl(0.3, 0.3, T, 6, { x: w / 2 + 0.3, y: -T / 2, color: '#d8d8d0' }), H.cyl(0.3, 0.3, T, 6, { z: d / 2 + 0.3, y: -T / 2, color: '#3a7ab8' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: sx * (w / 2 + 0.05), y: 0.2, z: sz * (d / 2 + 0.05), color: RED }));
  },
  // The brine pool (render only; the slab itself sits under killY): a glowing teal surface at the
  // sea line with darker circulation rings, an intake grate in the middle, the pool's inner wall
  // with a ring of underwater lamps.
  'oc-brine'(K, p, th, rng, H) {
    const R = 14.2, up = -p.h, n = H.seg(40, 20); // (the pool radius: arena.pool in ocean-boss.js)
    K.add('neon', H.part(new THREE.CircleGeometry(R, n), { rx: -Math.PI / 2, y: up + 0.12, color: '#13b89a' }));
    for (const [r0, r1] of [[3.0, 3.6], [6.2, 6.7], [9.4, 9.8], [12.4, 12.7]]) K.add('neon', H.part(new THREE.RingGeometry(r0, r1, n), { rx: -Math.PI / 2, y: up + 0.14, color: '#0c7a6a' }));
    K.add('flat', H.part(new THREE.CircleGeometry(2.2, 12), { rx: -Math.PI / 2, y: up + 0.16, color: '#16181e' }));
    for (let k = 0; k < 4; k++) K.add('flat', H.box(4.4, 0.1, 0.2, { y: up + 0.2, ry: (k * Math.PI) / 4, color: '#5a6272' }));
    K.add('concrete', inward(H.part(new THREE.CylinderGeometry(R + 0.2, R + 0.2, 3.2, n, 1, true), { y: up + 1.5, color: '#9a968e' })));
    K.add('neon', H.part(new THREE.TorusGeometry(R + 0.1, 0.1, 3, n), { rx: Math.PI / 2, y: up + 0.3, color: '#2bffd0' }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; K.add('glow', H.box(0.5, 0.3, 0.1, { x: Math.cos(a) * (R + 0.08), y: up + 1.2, z: Math.sin(a) * (R + 0.08), ry: -a + Math.PI / 2, color: '#9ffff0' })); }
  },
};
