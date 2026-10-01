// OCEAN CORE platform styles: (K, p, th, rng, H) → pieces in p's local frame (y = 0 at its top,
// footprint p.w × p.d or radius p.r). The sea is at world y = 0, so locally the waterline is at
// y = -p.h. Flat-shaded primitives with vertex colours, a few neon accents.
// Material keys: 'flat' (most things), 'glow' (unlit lights), 'neon' (unlit, dims by day),
// 'glass', 'deck' (metal tread texture), 'hazard' (yellow/black stripes), 'concrete'.

const STEEL = '#39414e', STEEL_LT = '#5a6272', RUST = '#b8582e', GROWTH = '#24382e', YELLOW = '#f2c21a', WHITE = '#e4e8ec';

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
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width + t : t, t, f.tz ? f.width + t : t, { x: f.nx * (f.half + t * 0.3), y, z: f.nz * (f.half + t * 0.3), color }));
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

export const STYLES = {
  // ---------------------------------------------------------------- shared offshore pieces
  // A steel offshore deck standing in the sea on its pontoon body: tread top, hazard edges, a rust
  // band under the lip, legs round the edge and marine growth at the waterline.
  'oc-deck'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h;
    plate(K, H, w, d, 0.3, p.tint ? '#7e9aa4' : '#8c96a4');
    edge(K, H, w, d);
    K.add('flat', H.box(w - 0.5, T - 0.3, d - 0.5, { y: -0.3 - (T - 0.3) / 2, color: STEEL }));
    K.add('flat', H.box(w + 0.05, 0.4, d + 0.05, { y: -0.5, color: RUST }));
    for (const f of H.faces(w, d)) {
      const n = Math.max(1, Math.round(f.width / 9));
      for (let k = 0; k <= n; k++) {
        const off = -f.width / 2 + 0.6 + (k * (f.width - 1.2)) / n;
        const x = f.nx * (f.half + 0.05) + f.tx * off, z = f.nz * (f.half + 0.05) + f.tz * off;
        K.add('flat', H.cyl(0.45, 0.45, T + 0.6, 6, { x, y: -0.7 - (T - 0.4) / 2, z, color: '#4a5260' }));
      }
      if (p.h > 2) for (let k = 1; k < f.width / 7; k++) K.add('glow', H.box(0.2, 0.2, 0.2, { x: f.nx * (f.half + 0.1) + f.tx * (-f.width / 2 + k * 7), y: -0.9, z: f.nz * (f.half + 0.1) + f.tz * (-f.width / 2 + k * 7), color: '#ffb02b' }));
    }
    if (wl > -T) waterline(K, H, w - 0.4, d - 0.4, wl);
  },
  // An orange (or yellow) float with black fenders and cleats.
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
    K.add('glow', H.box(0.18, 0.18, 0.18, { x: w / 2 - 0.3, y: 0.2, z: -d / 2 + 0.3, color: '#ffe26a' }));
  },
  // A mooring buoy: banded float, a flat cap you land on, a beacon on its rim.
  'oc-buoy'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(14, 9);
    const [a, b] = [['#d8343c', '#f0f0ea'], ['#f2c21a', '#22252e'], ['#2aa86a', '#f0f0ea']][(p.tint >= 0 ? p.tint : 0) % 3];
    const bands = Math.max(2, Math.round(T / 0.7));
    for (let i = 0; i < bands; i++) { const h = T / bands; K.add('flat', H.cyl(r, r * (i === bands - 1 ? 0.8 : 1), h, n, { y: -h * (i + 0.5), color: i % 2 ? b : a })); }
    K.add('flat', H.cyl(r * 0.92, r, 0.16, n, { y: -0.08, color: '#4a505c' }));
    K.add('flat', H.part(new H.THREE.TorusGeometry(r + 0.05, 0.12, 4, n), { rx: Math.PI / 2, y: -0.35, color: '#16181e' }));
    K.add('flat', H.box(0.16, 0.5, 0.16, { x: r * 0.8, y: 0.25, color: '#22252e' }));
    K.add('glow', H.box(0.28, 0.28, 0.28, { x: r * 0.8, y: 0.62, color: (p.tint % 3) === 2 ? '#3dff7a' : (p.tint % 3) === 1 ? '#ffe26a' : '#ff3a3a' }));
  },
  // A small service pad on a pole out of the sea, with a red valve wheel under it.
  'oc-valve'(K, p, th, rng, H) {
    const { w, d } = p, wl = -p.h;
    plate(K, H, w, d, 0.25, '#7a8492', 2);
    edge(K, H, w, d, 0.12);
    K.add('flat', H.box(w * 0.5, 0.3, d * 0.5, { y: -0.35, color: STEEL }));
    K.add('flat', H.cyl(0.28, 0.32, -wl + 0.2, 6, { y: (wl - 0.2) / 2, color: p.tint ? '#c8642a' : STEEL_LT }));
    K.add('flat', H.part(new H.THREE.TorusGeometry(0.45, 0.07, 3, 8), { y: -1.1, rx: Math.PI / 2, color: '#d8343c' }));
    if (wl < -2) waterlineDisc(K, H, 0.32, wl);
    K.add('glow', H.box(0.16, 0.16, 0.16, { x: w / 2 - 0.2, y: 0.1, z: d / 2 - 0.2, color: '#2bffd0' }));
  },
  // A service landing bolted round a tower (local +x points at the tower): grating, an outer rail, a strut back.
  'oc-landing'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.2, '#8a929e', 1.5);
    K.add('flat', H.box(w, 0.18, 0.12, { y: -0.3, z: -d / 2 + 0.06, color: YELLOW }), H.box(w, 0.18, 0.12, { y: -0.3, z: d / 2 - 0.06, color: YELLOW }));
    rail(K, H, -w / 2 + 0.05, -d / 2 + 0.1, -w / 2 + 0.05, d / 2 - 0.1);
    for (const sz of [-1, 1]) K.add('flat', H.box(4.6, 0.22, 0.22, { x: 1.9, y: -1.4, z: sz * (d / 2 - 0.3), rz: 0.42, color: STEEL_LT }));
    K.add('glow', H.box(0.16, 0.16, 0.16, { x: -w / 2 + 0.1, y: 1.1, z: 0, color: p.tint ? '#2bffd0' : '#ffb02b' }));
  },
  // A grating catwalk (either axis long) with rails on both long sides and stringers under it.
  'oc-catwalk'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p);
    plate(K, H, p.w, p.d, 0.12, '#a8b0bc', 1.2);
    for (const s of [-1, 1]) {
      const o = s * (W / 2 - 0.05);
      if (along === 'z') { rail(K, H, o, -L / 2, o, L / 2); K.add('flat', H.box(0.2, 0.35, L, { x: s * (W / 2 - 0.1), y: -0.3, color: STEEL })); }
      else { rail(K, H, -L / 2, o, L / 2, o); K.add('flat', H.box(L, 0.35, 0.2, { z: s * (W / 2 - 0.1), y: -0.3, color: STEEL })); }
    }
  },
  // A big pipe you run along (crown at y = 0): flanges, a tread strip on top, trestles to the sea.
  'oc-pipe'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p), r = W / 2, wl = -p.h, col = p.tint ? '#d8d8d0' : '#3a7ab8';
    const rot = along === 'z' ? { rx: Math.PI / 2 } : { rz: Math.PI / 2 };
    K.add('flat', H.cyl(r, r, L, H.seg(12, 8), { y: -r, ...rot, color: col }));
    const n = Math.max(1, Math.floor(L / 6));
    for (let k = 0; k <= n; k++) {
      const o = -L / 2 + 0.4 + (k * (L - 0.8)) / n, at = along === 'z' ? { z: o } : { x: o };
      K.add('flat', H.cyl(r + 0.14, r + 0.14, 0.35, H.seg(12, 8), { y: -r, ...rot, ...at, color: '#22385a' }));
      if (k % 2 === 0 && wl < -W - 0.5) { // a trestle down to the water
        const hh = -wl - W + 0.5;
        for (const s of [-1, 1]) K.add('flat', H.box(0.3, hh, 0.3, { y: -W - hh / 2 + 0.2, ...(along === 'z' ? { x: s * r * 0.8, z: o } : { z: s * r * 0.8, x: o }), color: STEEL_LT }));
        K.add('flat', H.box(along === 'z' ? W + 0.4 : 0.4, 0.3, along === 'z' ? 0.4 : W + 0.4, { y: -W - 0.1, ...at, color: STEEL }));
      }
    }
    K.add('deck', H.box(along === 'z' ? 0.9 : L, 0.06, along === 'z' ? L : 0.9, { y: 0.0, color: '#9aa2ae' }));
  },
  // A pump house: panelled walls, louvres, a door, a pipe out of the side, a roof fan flush with the roof.
  'oc-pump'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = ['#c8cfd6', '#d8b04a', '#8aa4b8'][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, T - 0.25, d, { y: -0.25 - (T - 0.25) / 2, color: col }));
    plate(K, H, w + 0.2, d + 0.2, 0.25, '#7a8290', 2);
    K.add('flat', H.cyl(Math.min(w, d) * 0.28, Math.min(w, d) * 0.28, 0.08, 10, { y: 0.0, color: '#22252e' }));
    K.add('flat', H.box(Math.min(w, d) * 0.5, 0.1, 0.1, { y: 0.05, color: '#5a6272' }), H.box(0.1, 0.1, Math.min(w, d) * 0.5, { y: 0.05, color: '#5a6272' }));
    for (const f of H.faces(w, d)) {
      K.add('flat', H.box(f.tx ? f.width * 0.6 : 0.06, 0.5, f.tz ? f.width * 0.6 : 0.06, { x: f.nx * (f.half + 0.03), y: -1.0, z: f.nz * (f.half + 0.03), color: '#3a404c' }));
      K.add('flat', H.box(f.tx ? f.width * 0.6 : 0.06, 0.08, f.tz ? f.width * 0.6 : 0.06, { x: f.nx * (f.half + 0.05), y: -1.25, z: f.nz * (f.half + 0.05), color: '#22252e' }));
    }
    K.add('flat', H.box(1.2, 2.1, 0.08, { y: -T + 1.05, z: d / 2 + 0.04, color: '#2a3a5a' }));
    K.add('flat', H.cyl(0.45, 0.45, 2.2, 8, { x: w / 2 + 1.0, y: -T * 0.55, rz: Math.PI / 2, color: '#3a7ab8' }));
    K.add('glow', H.box(0.3, 0.14, 0.14, { y: -T + 2.4, z: d / 2 + 0.1, color: '#ffe26a' }));
  },
  // An equipment skid: a frame with a pump motor and pipework; its top is the motor's cover.
  'oc-skid'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = ['#4a8a5a', '#c8642a', '#3a6ab8'][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, 0.25, d, { y: -T + 0.12, color: '#22252e' }));
    K.add('flat', H.box(w - 0.3, T - 0.45, d - 0.3, { y: -T / 2 - 0.1, color: col }));
    plate(K, H, w, d, 0.2, '#6a7280', 2);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.18, T, 0.18, { x: sx * (w / 2 - 0.09), y: -T / 2, z: sz * (d / 2 - 0.09), color: YELLOW }));
    K.add('flat', H.cyl(0.25, 0.25, d + 0.6, 6, { x: w / 2 + 0.25, y: -T * 0.6, rx: Math.PI / 2, color: '#d8d8d0' }));
  },
  // ---------------------------------------------------------------- stage 1: the desal plant
  // A storage tank: banded cylinder (fresh water white/blue, brine rust, chemicals teal), a ladder,
  // a flat lid with a painted ring, red lights round the rim.
  'oc-tank'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(22, 12), tint = (p.tint >= 0 ? p.tint : 0) % 3;
    const [body, band, lid] = [[WHITE, '#2a6ab8', '#c8ced6'], ['#b8582e', '#5a2a1a', '#8a6a5a'], ['#6a8a90', '#2a3a40', '#9aaeb4']][tint];
    K.add('flat', H.cyl(r, r, T - 0.25, n, { y: -0.25 - (T - 0.25) / 2, color: body }));
    for (let y = -2.5; y > -T + 1; y -= 3) K.add('flat', H.cyl(r + 0.08, r + 0.08, 0.25, n, { y, color: band }));
    K.add('flat', H.cyl(r + 0.1, r + 0.1, 0.25, n, { y: -0.125, color: lid }));
    K.add('flat', H.part(new H.THREE.RingGeometry(r * 0.55, r * 0.68, n), { rx: -Math.PI / 2, y: 0.02, color: tint === 1 ? '#ffcc1a' : '#2be8ff' }));
    K.add('flat', H.cyl(0.6, 0.6, 0.14, 8, { y: 0.07, color: '#3a404c' }));
    const la = rng() * Math.PI * 2;
    K.add('flat', H.box(0.7, T - 0.4, 0.12, { x: Math.cos(la) * (r + 0.12), y: -T / 2 - 0.2, z: Math.sin(la) * (r + 0.12), ry: -la + Math.PI / 2, color: '#22252e' }));
    if (r > 6) for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.4; K.add('glow', H.box(0.3, 0.3, 0.3, { x: Math.cos(a) * (r - 0.3), y: 0.2, z: Math.sin(a) * (r - 0.3), color: '#ff3a3a' })); }
    waterlineDisc(K, H, r, -p.h);
  },
  // The reverse-osmosis membrane hall: white panelled walls with window bands (rows of membrane
  // vessels behind), big blue pipes along the walls, a tread roof with glass skylight strips.
  'oc-hall'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h, wall = p.tint ? '#c8d4d8' : '#dadfe4';
    K.add('flat', H.box(w, T - 0.3, d, { y: -0.3 - (T - 0.3) / 2, color: wall }));
    plate(K, H, w + 0.3, d + 0.3, 0.3, '#9aa4ae', 4);
    edge(K, H, w + 0.3, d + 0.3, 0.2);
    for (const s of [-1, 1]) K.add('glass', H.box(1.4, 0.06, d - 6, { x: s * w * 0.22, y: 0.02 }));
    const lo = Math.max(wl + 1, -T);
    for (const f of H.faces(w, d)) {
      if (f.width < 8) continue;
      for (const y of [-2.2, -5.4]) if (y > lo + 1) {
        K.add('glass', H.box(f.tx ? f.width - 2 : 0.1, 1.2, f.tz ? f.width - 2 : 0.1, { x: f.nx * (f.half + 0.02), y, z: f.nz * (f.half + 0.02) }));
        const n = Math.floor((f.width - 3) / 1.6);
        for (let k = 0; k < n; k++) { const o = -f.width / 2 + 2 + k * 1.6; K.add('flat', H.cyl(0.3, 0.3, 0.9, 6, { x: f.nx * (f.half - 0.2) + f.tx * o, y, z: f.nz * (f.half - 0.2) + f.tz * o, rx: f.tz ? Math.PI / 2 : 0, rz: f.tx ? Math.PI / 2 : 0, color: '#f4f6f8' })); }
      }
      K.add('flat', H.cyl(0.55, 0.55, f.width - 1, 8, { x: f.nx * (f.half + 0.6), y: Math.max(lo + 1.2, -T + 1.4), z: f.nz * (f.half + 0.6), rz: f.tx ? Math.PI / 2 : 0, rx: f.tz ? Math.PI / 2 : 0, color: '#2a6ab8' }));
      K.add('neon', H.box(f.tx ? f.width + 0.3 : 0.12, 0.14, f.tz ? f.width + 0.3 : 0.12, { x: f.nx * (f.half + 0.1), y: -0.55, z: f.nz * (f.half + 0.1), color: '#2be8ff' }));
    }
    if (wl > -T) waterline(K, H, w, d, wl);
  },
  // The intake tower (a lighthouse): red and white bands, porthole windows, intake grilles at the
  // waterline, and a gallery deck with a railing on top.
  'oc-tower'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(24, 12);
    for (let y = 0, i = 0; y > -T; y -= 6, i++) { const h = Math.min(6, T + y); K.add('flat', H.cyl(r, r, h, n, { y: y - h / 2, color: i % 2 ? '#d8343c' : '#eef0f2' })); }
    K.add('flat', H.cyl(r + 0.35, r + 0.35, 0.5, n, { y: -0.25, color: '#5a6272' }));
    K.add('flat', H.part(new H.THREE.RingGeometry(r * 0.62, r + 0.35, n), { rx: -Math.PI / 2, y: 0.01, color: '#8a929e' }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; K.add('flat', H.box(0.08, 1.0, 0.08, { x: Math.cos(a) * (r + 0.25), y: 0.5, z: Math.sin(a) * (r + 0.25), color: '#ffcc1a' })); }
    K.add('flat', H.part(new H.THREE.TorusGeometry(r + 0.25, 0.05, 3, n), { rx: Math.PI / 2, y: 1.0, color: '#ffcc1a' }));
    for (let k = 0; k < 9; k++) { const a = k * 2.4, y = -4 - k * 3.2; if (y < -T + 2) break; K.add('glow', H.box(0.7, 0.9, 0.3, { x: Math.cos(a) * (r + 0.02), y, z: Math.sin(a) * (r + 0.02), ry: -a + Math.PI / 2, color: '#ffe8a8' })); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.add('flat', H.box(2.4, 1.6, 0.3, { x: Math.cos(a) * (r + 0.1), y: -T + 1.2, z: Math.sin(a) * (r + 0.1), ry: -a + Math.PI / 2, color: '#16181e' })); }
  },
  // The lantern room on the gallery: a glass drum with the lamp inside, a red roof you can stand on.
  'oc-lantern'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(16, 10);
    K.add('glass', H.cyl(r - 0.3, r - 0.3, T - 1.2, n, { y: -T / 2 - 0.3 }));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.add('flat', H.box(0.15, T - 1, 0.15, { x: Math.cos(a) * (r - 0.25), y: -T / 2 - 0.4, z: Math.sin(a) * (r - 0.25), color: '#22252e' })); }
    K.add('glow', H.part(new H.THREE.IcosahedronGeometry(1.1, 1), { y: -T / 2 - 0.3, color: '#fff4c0' }));
    K.add('flat', H.cyl(r, r + 0.2, 0.6, n, { y: -0.3, color: '#c8302a' }), H.cyl(r + 0.2, r + 0.2, 0.6, n, { y: -T + 0.3, color: '#3a404c' }));
    K.add('flat', H.box(0.12, 4, 0.12, { x: r - 0.4, y: 2, color: '#22252e' }));
    K.add('glow', H.box(0.3, 0.3, 0.3, { x: r - 0.4, y: 4.1, color: '#ff3a3a' }));
  },
  // The work boat: a hull with a rubbing strake, a deck you ride, a tiny wheelhouse at the stern.
  'oc-boat'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w, T - 0.2, d, { y: -0.2 - (T - 0.2) / 2, color: '#e8762a' }));
    K.add('flat', H.part(new H.THREE.ConeGeometry(w / 2, 2.4, 4, 1), { z: -d / 2 - 1.0, y: -T / 2 - 0.1, rx: -Math.PI / 2, ry: Math.PI / 4, sx: 1, sz: 0.6, color: '#e8762a' }));
    plate(K, H, w - 0.3, d - 0.3, 0.2, '#5a6270', 2);
    K.add('flat', H.box(w + 0.2, 0.3, d + 0.2, { y: -0.6, color: '#16181e' }));
    K.add('flat', H.box(w * 0.7, 1.1, 1.4, { y: 0.55, z: d / 2 - 0.8, color: WHITE }), H.box(w * 0.72, 0.12, 1.5, { y: 1.15, z: d / 2 - 0.8, color: '#c8302a' }));
    K.add('glass', H.box(w * 0.72, 0.45, 0.05, { y: 0.75, z: d / 2 - 1.52 }));
    K.add('glow', H.box(0.2, 0.2, 0.2, { x: -w / 2 + 0.2, y: 0.25, z: -d / 2 + 0.4, color: '#ff3a3a' }), H.box(0.2, 0.2, 0.2, { x: w / 2 - 0.2, y: 0.25, z: -d / 2 + 0.4, color: '#3dff7a' }));
  },
  // ---------------------------------------------------------------- stage 2: the server barges
  // A barge hull: navy topsides, red antifouling under a white boot stripe, bollards on the deck.
  'oc-barge'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h;
    plate(K, H, w, d, 0.25, '#6a7a72', 4);
    edge(K, H, w, d, 0.2);
    K.add('flat', H.box(w, T - 0.25, d, { y: -0.25 - (T - 0.25) / 2, color: '#1e2a44' }));
    K.add('flat', H.box(w + 0.06, 0.25, d + 0.06, { y: wl + 0.55, color: '#f0f0ea' }), H.box(w + 0.05, 1.0, d + 0.05, { y: wl, color: '#a83a2a' }));
    for (const s of [-1, 1]) for (let z = -d / 2 + 3; z < d / 2 - 2; z += 9) K.add('flat', H.cyl(0.22, 0.25, 0.5, 6, { x: s * (w / 2 - 0.4), y: 0.25, z, color: '#16181e' }));
    for (let z = -d / 2 + 6; z < d / 2; z += 12) for (const s of [-1, 1]) K.add('glow', H.box(0.12, 0.25, 0.4, { x: s * (w / 2 + 0.04), y: -1.2, z, color: '#ffe26a' }));
  },
  // A data hall: graphite walls ribbed with cooling fins, bands of rack LEDs, a neon crown, a roof
  // with flush fan grilles. tint picks the neon (cyan, magenta, green, amber).
  'oc-dc'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, neon = ['#2be8ff', '#ff2bd6', '#3dff7a', '#ffb02b'][(p.tint >= 0 ? p.tint : 0) % 4];
    K.add('flat', H.box(w, T - 0.3, d, { y: -0.3 - (T - 0.3) / 2, color: '#2a303c' }));
    plate(K, H, w + 0.2, d + 0.2, 0.3, '#5a6474', 3);
    for (let z = -d / 2 + 4; z < d / 2 - 2; z += 8) K.add('flat', H.cyl(Math.min(w * 0.3, 1.4), Math.min(w * 0.3, 1.4), 0.06, 10, { y: 0.02, z, color: '#16181e' }));
    for (const f of H.faces(w, d)) {
      const n = Math.floor(f.width / 1.2);
      if (f.width > 8) for (let k = 0; k < n; k++) { const o = -f.width / 2 + 0.6 + k * 1.2; K.add('flat', H.box(f.tx ? 0.12 : 0.35, T - 1.6, f.tz ? 0.12 : 0.35, { x: f.nx * (f.half + 0.15) + f.tx * o, y: -T / 2 - 0.5, z: f.nz * (f.half + 0.15) + f.tz * o, color: '#4a5262' })); }
      for (const y of [-2.2, -4.0]) if (y > -T + 1) for (let k = 0; k < Math.floor(f.width / 2.4); k++) {
        const o = -f.width / 2 + 1.2 + k * 2.4, c = ['#3dff7a', '#2be8ff', '#3dff7a', '#ffb02b', '#3dff7a'][(k + (y < -3 ? 2 : 0)) % 5];
        K.add('glow', H.box(f.tx ? 0.9 : 0.06, 0.12, f.tz ? 0.9 : 0.06, { x: f.nx * (f.half + 0.33) + f.tx * o, y, z: f.nz * (f.half + 0.33) + f.tz * o, color: c }));
      }
      K.add('neon', H.box(f.tx ? f.width + 0.4 : 0.14, 0.18, f.tz ? f.width + 0.4 : 0.14, { x: f.nx * (f.half + 0.12), y: -0.45, z: f.nz * (f.half + 0.12), color: neon }));
    }
  },
  // The hot aisle: a trench floor of grating with red heat glow along its sides.
  'oc-aisle'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    plate(K, H, w, d, 0.2, '#4a3a3a', 1.5);
    K.add('flat', H.box(w - 0.2, T - 0.2, d - 0.2, { y: -T / 2 - 0.1, color: '#22252e' }));
    for (const s of [-1, 1]) K.add('neon', H.box(0.12, 0.08, d - 0.4, { x: s * (w / 2 - 0.1), y: 0.04, color: '#ff4a2a' }));
    for (let z = -d / 2 + 3; z < d / 2; z += 6) K.add('flat', H.box(w * 0.6, 0.04, 1.2, { y: 0.02, z, color: '#16181e' }));
  },
  // A rooftop / deck chiller: grey casing, a colour stripe, fan grilles flush with its top.
  'oc-chiller'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, col = p.tint ? '#b8c4cc' : '#d8dce2';
    K.add('flat', H.box(w, T - 0.2, d, { y: -0.2 - (T - 0.2) / 2, color: col }));
    plate(K, H, w, d, 0.2, '#7a8290', 2);
    const n = Math.max(1, Math.floor(Math.max(w, d) / 2.4));
    for (let k = 0; k < n; k++) { const o = -Math.max(w, d) / 2 + (k + 0.5) * (Math.max(w, d) / n); K.add('flat', H.cyl(0.9, 0.9, 0.06, 10, { y: 0.02, ...(w > d ? { x: o } : { z: o }), color: '#22252e' })); }
    for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width + 0.02 : 0.04, 0.3, f.tz ? f.width + 0.02 : 0.04, { x: f.nx * (f.half + 0.01), y: -0.6, z: f.nz * (f.half + 0.01), color: p.tint ? '#2a6ab8' : '#c8302a' }));
  },
  // The heat-exchanger stack: finned tiers, hot pipes up two faces, red lights on the corners.
  'oc-stack'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w - 0.6, T, d - 0.6, { y: -T / 2, color: '#3a404c' }));
    for (let y = -1.2; y > -T + 1; y -= 1.1) K.add('flat', H.box(w, 0.35, d, { y, color: (Math.round(-y / 1.1) % 4) === 0 ? '#c8642a' : '#8a929e' }));
    plate(K, H, w, d, 0.3, '#7a8290', 2);
    edge(K, H, w, d);
    for (const [sx, sz] of [[1, 0], [0, 1]]) for (const o of [-1.4, 1.4]) K.add('flat', H.cyl(0.32, 0.32, T, 6, { x: sx * (w / 2 + 0.35) + (sz ? o : 0), y: -T / 2, z: sz * (d / 2 + 0.35) + (sx ? o : 0), color: '#d8402a' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: sx * (w / 2 - 0.2), y: 0.25, z: sz * (d / 2 - 0.2), color: '#ff3a3a' }));
  },
  // A cooling tower: a concrete hyperboloid (the collider is its rim's cylinder) with a fan deck on
  // top (an annulus of tread round a big fan grille, flush), a neon ring.
  'oc-cooling'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(24, 12), THREE = H.THREE;
    const prof = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, y = -T * t, k = 1 - 0.14 * Math.sin(Math.PI * Math.min(1, t * 1.3)) + 0.06 * t; prof.push(new THREE.Vector2(r * k, y)); }
    K.add('flat', H.part(new THREE.LatheGeometry(prof.reverse(), n), { color: '#d8d4cc' }));
    K.add('flat', H.cyl(r + 0.05, r + 0.05, 1.2, n, { y: -1.0, color: '#c8302a' }), H.cyl(r + 0.06, r + 0.06, 0.4, n, { y: -2.0, color: '#eef0f2' }));
    K.add('deck', H.part(new THREE.RingGeometry(r * 0.62, r + 0.05, n), { rx: -Math.PI / 2, y: 0.0, color: '#a8b0bc' }));
    K.add('flat', H.part(new THREE.CircleGeometry(r * 0.62, n), { rx: -Math.PI / 2, y: -0.02, color: '#2e3540' }));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; K.add('flat', H.box(r * 0.56, 0.06, r * 0.16, { x: Math.cos(a) * r * 0.3, z: -Math.sin(a) * r * 0.3, y: -0.015, ry: a + 0.25, color: '#7a8492' })); } // the fan's blades under the grille
    for (const rr of [0.2, 0.4]) K.add('flat', H.part(new THREE.RingGeometry(r * rr, r * rr + 0.12, n), { rx: -Math.PI / 2, y: 0.01, color: '#9aa2ae' }));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.add('flat', H.box(r * 1.24, 0.08, 0.3, { y: 0.0, ry: a, color: '#9aa2ae' })); }
    K.add('flat', H.cyl(r * 0.12, r * 0.12, 0.1, 8, { y: 0.0, color: '#c8302a' }));
    K.add('hazard', (() => { const g = H.part(new THREE.RingGeometry(r * 0.62, r * 0.62 + 0.4, n), { rx: -Math.PI / 2, y: 0.02 }); return g; })());
    K.add('neon', H.part(new THREE.TorusGeometry(r + 0.12, 0.12, 3, n), { rx: Math.PI / 2, y: -0.4, color: '#2be8ff' }));
    waterlineDisc(K, H, r * 1.06, -p.h);
  },
  // A cable tray: a channel of cable bundles you run along, orange lips, hangers under it.
  'oc-tray'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p), A = (a, b) => (along === 'z' ? a : b);
    K.add('flat', H.box(A(W, L), 0.3, A(L, W), { y: -0.18, color: '#7a828e' }));
    const cols = ['#2a6ab8', '#c8302a', '#16181e', '#f2c21a', '#3a8a4a'];
    for (let i = 0; i < 5; i++) { const o = -W / 2 + 0.3 + (i * (W - 0.6)) / 4; K.add('flat', H.cyl(0.14, 0.14, L - 0.4, 5, { ...(along === 'z' ? { x: o, rx: Math.PI / 2 } : { z: o, rz: Math.PI / 2 }), y: -0.06, color: cols[i] })); }
    for (const s of [-1, 1]) K.add('flat', H.box(A(0.12, L), 0.3, A(L, 0.12), { ...(along === 'z' ? { x: s * (W / 2 - 0.06) } : { z: s * (W / 2 - 0.06) }), y: 0.0, color: '#ff8a1a' }));
    for (let k = -L / 2 + 2; k < L / 2; k += 5) K.add('flat', H.box(A(W + 0.3, 0.2), 0.2, A(0.2, W + 0.3), { ...(along === 'z' ? { z: k } : { x: k }), y: -0.45, color: STEEL }));
  },
  // A cargo drone (you ride its back): a deck slab, four rotor arms, a server rack slung under it.
  'oc-cargo'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.35, '#5a6270', 2);
    edge(K, H, w, d, 0.12);
    K.add('flat', H.box(w * 0.7, 0.5, d * 0.7, { y: -0.6, color: '#2a2e38' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const ax = sx * (w / 2 + 0.9), az = sz * (d / 2 + 0.9);
      K.add('flat', H.box(1.6, 0.18, 0.18, { x: sx * (w / 2 + 0.2), y: -0.25, z: sz * (d / 2 + 0.2), ry: sx * sz > 0 ? -Math.PI / 4 : Math.PI / 4, color: '#3a3e4a' }));
      K.add('flat', H.cyl(0.18, 0.18, 0.35, 6, { x: ax, y: -0.15, z: az, color: '#22252e' }));
      K.add('glow', H.part(new H.THREE.TorusGeometry(0.95, 0.05, 3, 12), { x: ax, y: 0.0, z: az, rx: Math.PI / 2, color: sx > 0 ? '#3dff7a' : '#ff3a3a' }));
    }
    for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('flat', H.box(0.05, 1.6, 0.05, { x: sx * 0.6, y: -1.6, z: sz * 0.4, color: '#16181e' }));
    K.add('flat', H.box(1.3, 2.2, 0.9, { y: -3.4, color: '#22252e' }));
    for (let k = 0; k < 6; k++) K.add('glow', H.box(1.0, 0.06, 0.05, { y: -2.6 - k * 0.3, z: -0.47, color: k % 3 === 1 ? '#ffb02b' : '#3dff7a' }));
  },
  // ---------------------------------------------------------------- stage 3: the wind farm
  // A turbine's transition piece: the yellow access platform with its railing, on a yellow
  // foundation going down into the sea.
  'oc-tp'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(20, 10);
    K.add('deck', H.part(new H.THREE.CylinderGeometry(r, r, 0.35, n), { y: -0.18, color: '#d8b020' }));
    K.add('flat', H.part(new H.THREE.CylinderGeometry(r, 2.6, 2.2, n), { y: -1.45, color: YELLOW }));
    K.add('flat', H.cyl(2.6, 2.6, Math.max(0.5, T - 2.5), n, { y: -2.5 - (T - 2.5) / 2, color: YELLOW }));
    K.add('flat', H.cyl(2.65, 2.65, 3, n, { y: -p.h - 1.0, color: '#3a404c' }));
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; if (k % 7 === 3) continue; K.add('flat', H.box(0.08, 1.0, 0.08, { x: Math.cos(a) * (r - 0.1), y: 0.5, z: Math.sin(a) * (r - 0.1), color: '#ffcc1a' })); }
    K.add('flat', H.part(new H.THREE.TorusGeometry(r - 0.1, 0.05, 3, n), { rx: Math.PI / 2, y: 1.0, color: '#ffcc1a' }));
    K.add('glow', H.box(0.25, 0.25, 0.25, { x: r - 0.3, y: 1.2, color: '#ffe26a' }), H.box(0.25, 0.25, 0.25, { x: -r + 0.3, y: 1.2, color: '#ffe26a' }));
    K.add('glow', H.part(new H.THREE.TorusGeometry(r + 0.03, 0.06, 3, n), { rx: Math.PI / 2, y: -0.08, color: '#ffb02b' })); // rim light
  },
  // A turbine tower: a white tube, a grey band at its foot, red aviation lights at mid-height.
  'oc-mast'(K, p, th, rng, H) {
    const r = p.r, T = p.thick, n = H.seg(16, 10);
    K.add('flat', H.cyl(r * 0.9, r, T, n, { y: -T / 2, color: '#e8ecf0' }));
    K.add('flat', H.cyl(r + 0.02, r + 0.02, 1.2, n, { y: -T + 0.6, color: '#8a929e' }));
    K.add('flat', H.box(0.9, 2.0, 0.12, { x: 0, y: -T + 1.2, z: r + 0.01, color: '#5a6272' }));
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; K.add('glow', H.box(0.22, 0.22, 0.22, { x: Math.cos(a) * r * 0.95, y: -T * 0.5, z: Math.sin(a) * r * 0.95, color: '#ff2a2a' })); }
  },
  // A nacelle (its roof walkable) with the locked, feathered rotor at its local -Z end.
  'oc-nacelle'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, THREE = H.THREE;
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
    }
    for (const z of [-d / 2 + 0.4, d / 2 - 0.4]) K.add('glow', H.box(0.35, 0.35, 0.35, { x: w / 2 - 0.4, y: 0.3, z, color: '#ff2a2a' }));
    outline(K, H, w, d, '#ff6a4a', -0.08, 0.07);
  },
  // The service hoist up a turbine tower: a cage floor with low corner posts and a beacon.
  'oc-hoist'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.3, '#d8b020', 1.5);
    K.add('flat', H.box(w * 0.8, 0.4, d * 0.8, { y: -0.5, color: '#22252e' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.1, 0.9, 0.1, { x: sx * (w / 2 - 0.05), y: 0.45, z: sz * (d / 2 - 0.05), color: YELLOW }));
    K.add('glow', H.box(0.25, 0.25, 0.25, { x: w / 2 - 0.05, y: 1.0, z: d / 2 - 0.05, color: '#ffb02b' }));
    outline(K, H, w, d, '#ffe26a', -0.15);
  },
  // A junction platform at access-platform height: a deck on a steel jacket, cabinets in a corner.
  'oc-junction'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    plate(K, H, w, d, 0.3, '#8c96a4', 3);
    edge(K, H, w, d);
    K.add('flat', H.box(w - 1, 2.0, d - 1, { y: -1.3, color: STEEL }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      K.add('flat', H.cyl(0.4, 0.5, T, 6, { x: sx * (w / 2 - 0.6), y: -T / 2, z: sz * (d / 2 - 0.6), color: YELLOW }));
      K.add('flat', H.box(0.2, 6, 0.2, { x: sx * (w / 2 - 0.6), y: -5, z: 0, rx: sz * 0.7, color: STEEL_LT }));
    }
    K.add('flat', H.box(1.6, 1.8, 0.9, { x: -w / 2 + 1.0, y: 0.9, z: -d / 2 + 0.6, color: '#c8ccd2' }));
    K.add('glow', H.box(1.0, 0.12, 0.05, { x: -w / 2 + 1.0, y: 1.3, z: -d / 2 + 1.07, color: '#3dff7a' }));
  },
  // A power gantry: grating over a truss, rails both sides, either axis long.
  'oc-gantry'(K, p, th, rng, H) {
    const { L, W, along } = longAxis(p), A = (a, b) => (along === 'z' ? a : b);
    plate(K, H, p.w, p.d, 0.15, '#9aa2ae', 1.2);
    for (const s of [-1, 1]) {
      const o = s * (W / 2 - 0.05);
      if (along === 'z') rail(K, H, o, -L / 2, o, L / 2, '#ffcc1a'); else rail(K, H, -L / 2, o, L / 2, o, '#ffcc1a');
      K.add('flat', H.box(A(0.2, L), 0.2, A(L, 0.2), { ...(along === 'z' ? { x: s * (W / 2 - 0.1) } : { z: s * (W / 2 - 0.1) }), y: -1.4, color: STEEL_LT }));
      for (let k = -L / 2 + 1; k < L / 2 - 1; k += 2.4) K.add('flat', H.box(A(0.12, 1.8), 0.12, A(1.8, 0.12), { ...(along === 'z' ? { x: s * (W / 2 - 0.1), z: k + 0.6 } : { z: s * (W / 2 - 0.1), x: k + 0.6 }), y: -0.7, ...(along === 'z' ? { rx: 0.7 } : { rz: 0.7 }), color: STEEL_LT }));
    }
    K.add('flat', H.box(A(0.3, L), 0.3, A(L, 0.3), { ...(along === 'z' ? { x: W / 2 - 0.4 } : { z: W / 2 - 0.4 }), y: -0.3, color: '#16181e' }));
    outline(K, H, p.w, p.d, '#ffb02b', -0.1); // edge lights: you can see where it ends at night
  },
  // The comms mast: a red-and-white lattice of four legs with braces, dishes and whips on it.
  'oc-lattice'(K, p, th, rng, H) {
    const { w } = p, T = p.thick, h = w / 2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) for (let y = 0, i = 0; y > -T; y -= 6, i++) K.add('flat', H.box(0.22, Math.min(6, T + y), 0.22, { x: sx * h, y: y - Math.min(6, T + y) / 2, z: sz * h, color: i % 2 ? '#d8343c' : '#eef0f2' }));
    for (let y = -1.5; y > -T; y -= 3) for (const f of H.faces(w, w)) K.add('flat', H.box(f.tx ? w * 1.4 : 0.1, 0.1, f.tz ? w * 1.4 : 0.1, { x: f.nx * h, y, z: f.nz * h, ...(f.tx ? { rz: (Math.round(y) % 2 ? 0.75 : -0.75) } : { rx: (Math.round(y) % 2 ? 0.75 : -0.75) }), color: '#c8ccd2' }));
    for (const [y, a] of [[-12, 0.4], [-20, 2.6], [-27, 4.4]]) if (y > -T) {
      K.add('flat', H.part(new H.THREE.CylinderGeometry(1.4, 0.4, 0.6, 10), { x: Math.cos(a) * 1.8, y, z: Math.sin(a) * 1.8, rz: Math.PI / 2, ry: -a, color: '#eef0f2' }));
    }
    for (let y = -4; y > -T; y -= 9) K.add('glow', H.box(0.3, 0.3, 0.3, { x: h, y, z: h, color: '#ff2a2a' }));
  },
  // The mast's top platform: grating, whip antennas at the corners, a red beacon.
  'oc-masttop'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.3, '#8a929e', 1.5);
    edge(K, H, w, d, 0.12);
    for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('flat', H.box(0.08, 5, 0.08, { x: sx * (w / 2 - 0.15), y: 2.5, z: sz * (d / 2 - 0.15), color: '#c8ccd2' }));
    K.add('glow', H.box(0.4, 0.4, 0.4, { x: -w / 2 + 0.15, y: 5.1, z: -d / 2 + 0.15, color: '#ff2a2a' }), H.box(0.4, 0.4, 0.4, { x: w / 2 - 0.15, y: 5.1, z: d / 2 - 0.15, color: '#ff2a2a' }));
  },
  // The data haven's spine: a dark glass tower striped with LED risers, floor bands every 6 m, the
  // roof (the exit) ringed in neon, and the lit spire mast in one corner.
  'oc-spine'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#141c2a' }));
    plate(K, H, w + 0.4, d + 0.4, 0.4, '#3a4252', 4);
    for (const f of H.faces(w, d)) {
      for (let o = -f.width / 2 + 1.8; o < f.width / 2 - 1; o += 3.6) K.add('glow', H.box(f.tx ? 0.18 : 0.06, T - 3, f.tz ? 0.18 : 0.06, { x: f.nx * (f.half + 0.03) + f.tx * o, y: -T / 2 - 1.5, z: f.nz * (f.half + 0.03) + f.tz * o, color: (Math.round(o) % 3) ? '#2be8ff' : '#3a7bff' }));
      for (let y = -6; y > -T + 2; y -= 6) K.add('flat', H.box(f.tx ? f.width + 0.6 : 0.3, 0.45, f.tz ? f.width + 0.6 : 0.3, { x: f.nx * (f.half + 0.15), y, z: f.nz * (f.half + 0.15), color: '#3a4252' }));
      K.add('neon', H.box(f.tx ? f.width + 0.6 : 0.16, 0.25, f.tz ? f.width + 0.6 : 0.16, { x: f.nx * (f.half + 0.22), y: -0.6, z: f.nz * (f.half + 0.22), color: '#2bd6ff' }));
    }
    const mx = -w / 2 + 1.5, mz = -d / 2 + 1.5;
    K.add('flat', H.box(1.2, 1.2, 1.2, { x: mx, y: 0.6, z: mz, color: '#3a4252' }), H.cyl(0.25, 0.45, 26, 6, { x: mx, y: 13, z: mz, color: '#c8ccd2' }));
    for (let y = 4; y < 26; y += 5) K.add('glow', H.box(0.5, 0.25, 0.5, { x: mx, y, z: mz, color: '#ff2a2a' }));
    K.add('glow', H.part(new H.THREE.IcosahedronGeometry(0.7, 0), { x: mx, y: 26.5, z: mz, color: '#ffffff' }));
    K.add('neon', H.part(new H.THREE.RingGeometry(3.4, 3.8, H.seg(24, 12)), { rx: -Math.PI / 2, y: 0.03, color: '#2bd6ff' }));
    edge(K, H, w + 0.4, d + 0.4, 0.2);
    outline(K, H, w + 0.4, d + 0.4, '#2bd6ff', -0.2, 0.12);
    // the blade bay on the south face (local +z): a lit panel behind the hot-swap blades and an amber
    // guide rail under each blade's track (heights as in ocean-storm.js: 38 m → 75 m in 11 steps, roof 78 m)
    const bayH = 40, bayW = 15;
    K.add('flat', H.box(bayW, bayH, 0.2, { y: -bayH / 2, z: d / 2 + 0.1, color: '#2a3c56' }));
    for (const sx of [-1, 1]) K.add('glow', H.box(0.25, bayH, 0.12, { x: sx * bayW / 2, y: -bayH / 2, z: d / 2 + 0.22, color: '#ffb02b' }));
    for (let i = 0; i < 11; i++) { const y = 38 + (i + 1) * (37 / 11) - 78; K.add('glow', H.box(bayW - 0.4, 0.12, 0.12, { y: y - 0.75, z: d / 2 + 0.24, color: '#ff8a2a' })); }
  },
  // A terrace on the spine: grating with a neon edge on its outer sides.
  'oc-balcony'(K, p, th, rng, H) {
    const { w, d } = p;
    plate(K, H, w, d, 0.3, '#5a6272', 2);
    K.add('flat', H.box(w - 0.4, 0.6, d - 0.4, { y: -0.6, color: '#2a303c' }));
    for (const f of H.faces(w, d)) K.add('neon', H.box(f.tx ? f.width : 0.1, 0.1, f.tz ? f.width : 0.1, { x: f.nx * (f.half - 0.05), y: 0.05, z: f.nz * (f.half - 0.05), color: p.tint ? '#ff2bd6' : '#2bd6ff' }));
    for (const f of H.faces(w, d)) if (f.width > 6) for (let o = -f.width / 2 + 1; o < f.width / 2; o += 2) K.add('glow', H.box(0.1, 0.1, 0.1, { x: f.nx * (f.half - 0.1) + f.tx * o, y: -0.9, z: f.nz * (f.half - 0.1) + f.tz * o, color: '#ffe8a8' }));
  },
  // A hot-swap server blade sliding along the spine's face: a bright steel slab, an LED front,
  // handles, and glowing edges so you can read it against the dark tower.
  'oc-blade'(K, p, th, rng, H) {
    const { w, d } = p, led = ['#3dff7a', '#2be8ff', '#ffb02b'][(p.tint >= 0 ? p.tint : 0) % 3];
    K.add('flat', H.box(w, p.thick, d, { y: -p.thick / 2, color: '#8a929e' }));
    plate(K, H, w, d, 0.1, '#d8dce2', 1.5);
    for (let k = 0; k < 6; k++) K.add('glow', H.box(0.3, 0.12, 0.05, { x: -w / 2 + 0.5 + k * 0.6, y: -0.35, z: d / 2 + 0.02, color: k % 3 === 2 ? '#ffffff' : led }));
    for (const sx of [-1, 1]) K.add('flat', H.box(0.12, 0.12, 0.6, { x: sx * (w / 2 - 0.4), y: -0.3, z: d / 2 + 0.3, color: '#22252e' }));
    outline(K, H, w, d, led, -0.05, 0.1);
  },
  // ---------------------------------------------------------------- the boss: BRINE POOL
  // A pump deck on the pool's rim (local -z faces the pool): tread, a hazard lip on the pool edge with
  // a concrete wall down to the brine, pump motors on its outer edge, a railing on the sea side.
  'oc-pumpdeck'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick, wl = -p.h;
    plate(K, H, w, d, 0.3, p.tint ? '#7e8c9a' : '#8c96a4', 4);
    stripe(K, H, w, 0, 0.025, -d / 2 + 0.25, 0, 0.5);
    K.add('flat', H.box(w, T - 0.3, d - 0.4, { y: -0.3 - (T - 0.3) / 2, z: 0.2, color: STEEL }));
    const cw = H.meterBox(w, -wl - 1.0, 0.4, 3, { faces: ['nz', 'px', 'nx'], color: '#a8a49c' }); cw.translate(0, (wl - 1.0) / 2 - 0.0, -d / 2 + 0.2); K.add('concrete', cw);
    K.add('neon', H.box(w - 0.4, 0.12, 0.12, { y: -0.35, z: -d / 2 - 0.05, color: '#2bffd0' }));
    rail(K, H, -w / 2 + 0.3, d / 2 - 0.1, w / 2 - 0.3, d / 2 - 0.1, '#ffcc1a');
    for (const x of [-w * 0.3, w * 0.3]) {
      K.add('flat', H.cyl(0.9, 0.9, 2.2, 10, { x, y: -1.4, z: d / 2 + 1.0, rz: Math.PI / 2, color: '#3a6ab8' }), H.box(2.6, 1.6, 1.8, { x, y: -1.4, z: d / 2 + 1.0, color: '#2a303c' }));
      K.add('flat', H.cyl(0.45, 0.45, -wl + 1, 8, { x, y: wl / 2 - 1.2, z: d / 2 + 1.0, color: '#4a5260' }));
      K.add('glow', H.box(0.3, 0.3, 0.3, { x, y: -0.4, z: d / 2 + 1.95, color: '#ff2a2a' }));
    }
    waterline(K, H, w, d - 0.4, wl);
  },
  // A pump stack (cover and a perch): a banded column with pipes, red danger lights on top.
  'oc-pillar'(K, p, th, rng, H) {
    const { w, d } = p, T = p.thick;
    K.add('flat', H.box(w, T, d, { y: -T / 2, color: '#4a5260' }));
    for (let y = -1; y > -T; y -= 1.4) K.add('flat', H.box(w + 0.12, 0.3, d + 0.12, { y, color: (Math.round(-y) % 2) ? '#c8302a' : '#2a303c' }));
    plate(K, H, w + 0.2, d + 0.2, 0.3, '#7a8290', 2);
    edge(K, H, w + 0.2, d + 0.2, 0.12);
    K.add('flat', H.cyl(0.3, 0.3, T, 6, { x: w / 2 + 0.3, y: -T / 2, color: '#d8d8d0' }), H.cyl(0.3, 0.3, T, 6, { z: d / 2 + 0.3, y: -T / 2, color: '#3a7ab8' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: sx * (w / 2 + 0.05), y: 0.2, z: sz * (d / 2 + 0.05), color: '#ff2a2a' }));
  },
  // The brine pool (render only; the slab itself sits under killY): a glowing teal surface at the
  // sea line with darker circulation rings, an intake grate in the middle, the pool's inner wall.
  'oc-brine'(K, p, th, rng, H) {
    const R = 14.2, up = -p.h, n = H.seg(40, 20), THREE = H.THREE; // (the pool radius: arena.pool in ocean-boss.js)
    K.add('neon', H.part(new THREE.CircleGeometry(R, n), { rx: -Math.PI / 2, y: up + 0.12, color: '#13b89a' }));
    for (const [r0, r1] of [[3.0, 3.6], [6.2, 6.7], [9.4, 9.8], [12.4, 12.7]]) K.add('neon', H.part(new THREE.RingGeometry(r0, r1, n), { rx: -Math.PI / 2, y: up + 0.14, color: '#0c7a6a' }));
    K.add('flat', H.part(new THREE.CircleGeometry(2.2, 12), { rx: -Math.PI / 2, y: up + 0.16, color: '#16181e' }));
    for (let k = 0; k < 4; k++) K.add('flat', H.box(4.4, 0.1, 0.2, { y: up + 0.2, ry: (k * Math.PI) / 4, color: '#5a6272' }));
    K.add('concrete', inward(H.part(new THREE.CylinderGeometry(R + 0.2, R + 0.2, 3.2, n, 1, true), { y: up + 1.5, color: '#9a968e' })));
    K.add('neon', H.part(new THREE.TorusGeometry(R + 0.1, 0.1, 3, n), { rx: Math.PI / 2, y: up + 0.3, color: '#2bffd0' }));
  },
};
