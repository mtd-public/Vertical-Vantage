// EGYPT: backdrops, the distant landmarks (render-only, unfogged, hazed toward the horizon with B.c).
// Each returns an Object3D in its own units; js/render/backdrops.js places, turns and scales it.
// B = { THREE, Kit, box, cyl, ball, part, seg, c, mesh, rng, night }.
import * as THREE from 'three';
import { mulberry32 } from '../../sim/util.js';

const sandCols = ['#d8b07a', '#c89a68', '#e0bc88'];
const houseCols = ['#e0c8a0', '#d4a888', '#c8a080', '#e8d8b8', '#bca888'];
const LEDS = ['#ffc53a', '#2be8ff', '#ff2bd6', '#4a7aff'];
const own = (m) => { m.userData.own = true; return m; }; // (disposed with the level)
const now = () => performance.now() / 1000;

// Additive light: beams, laser fans and light cones (their own material, unfogged).
function beamMat(col, op) { return own(new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); }
// A laser from (x, y, z) along the unit direction d, length L, w wide (a crossed pair of quads).
function laserGeo(x, y, z, d, L, w) {
  const g = new THREE.BufferGeometry(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d).normalize());
  const pts = [], m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
  for (const [ax, az] of [[1, 0], [0, 1]]) {
    const a = [-w / 2 * ax, 0, -w / 2 * az], b = [w / 2 * ax, 0, w / 2 * az], c = [w * 0.15 * ax, L, w * 0.15 * az], e = [-w * 0.15 * ax, L, -w * 0.15 * az];
    pts.push(...a, ...b, ...c, ...a, ...c, ...e);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.applyMatrix4(m);
  return g;
}
// A group of laser beams (o.beams: [[x, y, z, dx, dy, dz, L, w], …]) in one additive colour, flickering a little.
function lasers(list, col, op = 0.5) {
  const geos = list.map(([x, y, z, dx, dy, dz, L, w]) => laserGeo(x, y, z, [dx, dy, dz], L, w));
  const g = new THREE.BufferGeometry(), pos = [];
  for (const q of geos) { pos.push(...q.attributes.position.array); q.dispose(); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = beamMat(col, op), m = new THREE.Mesh(g, mat);
  m.renderOrder = 4;
  const ph = Math.random() * 10;
  m.onBeforeRender = () => { mat.opacity = op * (0.8 + 0.2 * Math.sin(now() * 3.1 + ph)); };
  return m;
}

// Square-Kufic-styled lettering and a framed holo sign on a plane at (cx, cy, cz) turned ry (its front
// faces (sin ry, cos ry)), w × h; glow quads only.
function holo(K, B, cx, cy, cz, ry, w, h, rng, frame, text) {
  const tx = Math.cos(ry), tz = -Math.sin(ry), nx = Math.sin(ry), nz = Math.cos(ry);
  const q = (u, v, qw, qh, col, d) => K.add('glow', B.part(new THREE.PlaneGeometry(qw, qh), { x: cx + tx * u + nx * d, y: cy + v, z: cz + tz * u + nz * d, ry, color: col }));
  q(0, 0, w, h, '#0a0c22', 0);
  for (const s of [-1, 1]) { q(0, s * h / 2, w + h * 0.08, h * 0.06, frame, 0.1); q(s * w / 2, 0, h * 0.06, h, frame, 0.1); }
  const t = h * 0.09, n = Math.max(3, Math.round(w / (h * 0.32))), cw = (w * 0.84) / n, y0 = -h * 0.2;
  q(0, y0, w * 0.8, t, text, 0.12);
  for (let i = 0; i < n; i++) {
    const u = -w * 0.42 + (i + 0.5) * cw, r = rng();
    if (r < 0.4) { const hh = h * (0.3 + rng() * 0.3); q(u, y0 + hh / 2, t, hh, text, 0.12); }
    else if (r < 0.65) { const hh = h * (0.18 + rng() * 0.14); q(u - cw * 0.25, y0 + hh / 2, t, hh, text, 0.12); q(u, y0 + hh, cw * 0.6, t, text, 0.12); }
    else if (r < 0.85) q(u, y0 + h * (0.22 + rng() * 0.2), t * 1.2, t * 1.2, text, 0.12);
  }
}

// A pyramid: a four-sided cone, base half-width hw, height h (o.casing: a smooth white cap on top;
// o.glow: a lit capstone; o.steps: dark course lines). At night its courses are LED-lined, its arrises
// gold, and o.glow sends a fan of uplink lasers into the sky (returned for the caller to add).
function pyramid(K, B, x, z, hw, h, o = {}) {
  const r = hw * Math.SQRT2;
  K.add('solid', B.part(new B.THREE.ConeGeometry(r, h, 4, 1), { x, y: h / 2, z, ry: Math.PI / 4, color: B.c(o.color || '#d0a86e') }));
  if (o.casing) K.add('solid', B.part(new B.THREE.ConeGeometry(r * o.casing, h * o.casing, 4, 1), { x, y: h - h * o.casing / 2 + 0.3, z, ry: Math.PI / 4, color: B.c('#f0e6d0', -0.05) }));
  for (let k = 1; o.steps && k < o.steps; k++) { const t = k / o.steps; K.add('solid', B.box(hw * 2 * (1 - t) + 0.6, 0.6, hw * 2 * (1 - t) + 0.6, { x, y: h * t, z, color: B.c('#a8844e') })); }
  if (o.glow) {
    K.add('glow', B.part(new B.THREE.ConeGeometry(r * 0.09, h * 0.09, 4, 1), { x, y: h * 0.955, z, ry: Math.PI / 4, color: '#fff0b0' }));
    if (!B.night) K.add('glow', B.box(0.8, h * 1.6, 0.8, { x, y: h * 0.96 + h * 0.8, z, color: '#ffe8a0' })); // the uplink beam
  }
  if (B.night) {
    const n = o.leds ?? Math.max(4, o.steps || 6), lw = Math.max(0.5, hw * 0.012);
    for (let k = 0; k < n; k++) { // LED course lines, all four faces
      const t = (k + 0.5) / n * 0.92, s = hw * (1 - t), col = k % 3 === 2 ? '#ffc53a' : '#2be8ff';
      for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) K.add('glow', B.box(dz ? s * 2 : lw, lw, dx ? s * 2 : lw, { x: x + dx * (s + lw * 0.5), y: h * t, z: z + dz * (s + lw * 0.5), color: col }));
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { // gold arrises
      const a = [x + sx * hw, 0, z + sz * hw], b = [x, h * 0.95, z], L = Math.sqrt(hw * hw * 2 + h * h * 0.9);
      const g = B.box(lw * 1.2, L, lw * 1.2, { color: '#ffd060' }), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize());
      g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1)));
      K.add('glow', g);
    }
    if (o.glow && o.beams) { for (let k = 0; k < (o.fan ?? 4); k++) { const a = k * Math.PI / 2 + 0.4; o.beams.push([x, h * 0.98, z, Math.cos(a) * 0.22, 1, Math.sin(a) * 0.22, h * 5, hw * 0.05]); } o.beams.push([x, h * 0.98, z, 0, 1, 0, h * 6, hw * 0.07]); }
  }
}
function dome(K, B, x, z, r, y0, col) {
  K.add('solid', B.cyl(r, r, r * 0.6, B.seg(12, 8), { x, y: y0 + r * 0.3, z, color: B.c('#e8dcc8') }));
  K.add('solid', B.part(new B.THREE.SphereGeometry(r, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: y0 + r * 0.6, z, sy: 1.15, color: B.c(col) }));
  if (B.night) { // a neon drum ring, lit windows, a gold finial
    K.add('glow', B.cyl(r + 0.3, r + 0.3, 0.6, B.seg(12, 8), { x, y: y0 + r * 0.6, z, color: '#2be8ff' }));
    K.add('glow', B.cyl(r + 0.1, r + 0.1, r * 0.18, B.seg(12, 8), { x, y: y0 + r * 0.3, z, color: '#a8742c' }));
    K.add('glow', B.box(0.9, 3.6, 0.9, { x, y: y0 + r * 1.75 + 1.8, z, color: '#ffd060' }));
  }
}
function minaret(K, B, x, z, h, y0 = 0) {
  K.add('solid', B.cyl(1.2, 1.5, h, 8, { x, y: y0 + h / 2, z, color: B.c('#e8e0d0') }));
  K.add('solid', B.cyl(2.2, 1.4, 1.2, 8, { x, y: y0 + h * 0.75, z, color: B.c('#d8ccb8') }));
  K.add('solid', B.part(new B.THREE.ConeGeometry(1.4, h * 0.22, 8), { x, y: y0 + h + h * 0.11, z, color: B.c('#8a949c') }));
  if (B.night) { // neon-lined: a ring at the balcony, one at the top, a lit tip
    K.add('glow', B.cyl(2.3, 2.3, 0.5, 8, { x, y: y0 + h * 0.75 + 0.4, z, color: '#2be8ff' }), B.cyl(1.3, 1.3, 0.5, 8, { x, y: y0 + h - 0.3, z, color: '#ffc53a' }));
    K.add('glow', B.cyl(1.3, 1.3, 0.4, 8, { x, y: y0 + h * 0.4, z, color: '#ffc53a' }));
    K.add('glow', B.box(0.6, 1.4, 0.6, { x, y: y0 + h * 1.25, z, color: '#ffe080' }));
  }
}
// A tower (backdrop): a box with window bands at night, a neon crown, sometimes a holo sign, a beacon.
function tower(K, B, rng, x, z, w, d, h, ry, face) {
  K.add('solid', B.box(w, h, d, { x, y: h / 2, z, ry, color: B.c(rng() < 0.5 ? '#b8a890' : '#9a8c7c') }));
  if (!B.night) return;
  for (let y = 5; y < h - 4; y += 4.2) if (rng() < 0.8) K.add('glow', B.box(w + 0.3, 1.1, d * (0.4 + rng() * 0.5), { x, y, z, ry, color: rng() < 0.75 ? '#ffd890' : (rng() < 0.5 ? '#8ae0ff' : '#ff9ad8') }));
  K.add('glow', B.box(w + 0.8, 1.2, d + 0.8, { x, y: h - 2.5, z, ry, color: LEDS[Math.floor(rng() * LEDS.length)] }));
  K.add('glow', B.box(0.8, 0.8, 0.8, { x, y: h + 3, z, color: '#ff2a2a' }));
  if (face !== undefined && rng() < 0.55) { const sw = Math.min(w * 1.3, 24), sh = sw * 0.42; holo(K, B, x + Math.sin(face) * (d / 2 + 1), h * (0.45 + rng() * 0.3), z + Math.cos(face) * (d / 2 + 1), face, sw, sh, rng, LEDS[Math.floor(rng() * LEDS.length)], rng() < 0.6 ? '#ffc53a' : '#2be8ff'); }
}

// ------------------------------------------------------------------ dust that follows the camera
const DUST_VERT = /* glsl */ `
  attribute float seed;
  uniform float uT, uWind, uSize;
  varying float vA;
  void main() {
    vec3 p = position;
    p.x += uT * uWind * (9.0 + seed * 7.0);
    p.z += uT * uWind * (2.0 + seed * 2.0) + sin(uT * (0.6 + seed) + seed * 23.0) * 1.2;
    p.y += sin(uT * (0.9 + seed * 0.7) + seed * 40.0) * 1.4 - uT * (0.3 + seed * 0.4);
    p.x = mod(p.x - cameraPosition.x + 35.0, 70.0) - 35.0 + cameraPosition.x;
    p.z = mod(p.z - cameraPosition.z + 35.0, 70.0) - 35.0 + cameraPosition.z;
    p.y = mod(p.y - cameraPosition.y + 18.0, 36.0) - 18.0 + cameraPosition.y;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vA = (0.35 + seed * 0.5) * (1.0 - smoothstep(20.0, 34.0, -mv.z));
    gl_PointSize = clamp(uSize * (1.0 + seed) * 26.0 / max(1.0, -mv.z), 1.0, 4.0);
    gl_Position = projectionMatrix * mv;
  }`;
const DUST_FRAG = /* glsl */ `
  uniform vec3 uCol;
  uniform float uK;
  varying float vA;
  void main() { if (vA < 0.01) discard; gl_FragColor = vec4(uCol, vA * uK); }`;
function dust(n, o = {}) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n), rng = mulberry32(o.seed ?? 87);
  for (let i = 0; i < n; i++) { pos[i * 3] = rng() * 70 - 35; pos[i * 3 + 1] = rng() * 36 - 18; pos[i * 3 + 2] = rng() * 70 - 35; seed[i] = rng(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = own(new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uWind: { value: o.wind ?? 0.6 }, uSize: { value: o.size ?? 1 }, uK: { value: o.k ?? 0.7 }, uCol: { value: new THREE.Color(o.color ?? '#e8b890') } }, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, fog: false }));
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  pts.onBeforeRender = () => { mat.uniforms.uT.value = now(); };
  return pts;
}

export const BACKDROPS = {
  // The Giza pyramids on the horizon: Khufu, Khafre (its casing cap), Menkaure, the queens; glowing capstones.
  'eg-giza'(o, th, B) {
    const K = new B.Kit(), beams = [];
    pyramid(K, B, 0, 0, 70, 138, { steps: 6, glow: o.glow, beams });
    pyramid(K, B, -150, 110, 68, 136, { casing: 0.22, steps: 5, glow: o.glow, color: '#c89c62', beams });
    pyramid(K, B, -270, 220, 34, 66, { steps: 4, glow: o.glow, color: '#c8986a', beams });
    for (let k = 0; k < 3; k++) pyramid(K, B, 100, -60 + k * 50, 14, 28, { color: '#c8a070', leds: 2 });
    for (let k = 0; k < 3; k++) pyramid(K, B, -330 + k * 40, 260, 10, 20, { color: '#c8a070', leds: 2 });
    K.add('solid', B.box(900, 6, 500, { y: -2, color: B.c('#d8b07a', 0.1) })); // the plateau
    if (B.night) for (let k = 0; k < 40; k++) K.add('glow', B.box(6, 1.5, 6, { x: -420 + B.rng() * 600, y: 1.5, z: -180 + B.rng() * 480, color: B.rng() < 0.6 ? '#ffc870' : '#2be8ff' })); // the plateau's work lights
    const g = B.mesh(K);
    if (beams.length) g.add(lasers(beams, 0x5ff0ff, 0.42));
    return g;
  },
  // Khafre's pyramid (or Menkaure's, o.small) in the haze, its smooth casing still on the top.
  'eg-khafre'(o, th, B) {
    const K = new B.Kit(), beams = [];
    pyramid(K, B, 0, 0, o.small ? 50 : 105, o.small ? 96 : 205, { casing: o.small ? 0 : 0.22, steps: 6, glow: 1, color: '#d0a46a', beams });
    for (let k = 0; k < (o.small ? 0 : 3); k++) pyramid(K, B, 140 + k * 46, 60, 16, 30, { color: '#c8a070', leds: 2 });
    const g = B.mesh(K);
    if (beams.length) g.add(lasers(beams, o.small ? 0xff6ad8 : 0x5ff0ff, 0.38));
    return g;
  },
  // A ring of Islamic Cairo: flat-roofed houses, domes and minarets (o.towers: modern towers too);
  // o.avoidX keeps the river clear (local x band). At night: lit windows, LED roof lines, neon-lined
  // domes and minarets, holo billboards in Kufic on the towers, red beacons.
  'eg-cairoRing'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 81), r0 = o.r0 ?? 190, r1 = o.r1 ?? 300;
    for (let i = 0; i < (o.n ?? 80); i++) {
      const a = rng() * Math.PI * 2, r = r0 + rng() * (r1 - r0), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (o.avoidX && x > o.avoidX[0] && x < o.avoidX[1]) continue;
      const p = rng(), face = Math.atan2(-x, -z);
      if (p < 0.1) { dome(K, B, x, z, 8 + rng() * 6, 10 + rng() * 6, rng() < 0.5 ? '#8a949c' : '#5a9a7a'); minaret(K, B, x + 14, z, 38 + rng() * 14); }
      else if (p < 0.2) minaret(K, B, x, z, 30 + rng() * 20, 8);
      else if ((o.towers && p < 0.45) || (B.night && p < 0.3)) {
        const w = 14 + rng() * 12, h = (o.towers ? 40 : 30) + rng() * 70;
        tower(K, B, rng, x, z, w, w * (0.7 + rng() * 0.4), h, face, face);
      } else {
        const w = 14 + rng() * 16, d = 12 + rng() * 14, h = 8 + rng() * 16;
        K.add('solid', B.box(w, h, d, { x, y: h / 2, z, ry: -a, color: B.c(houseCols[i % houseCols.length]) }));
        if (B.night || th.night > 0.05) for (let k = 0; k < 2; k++) K.add('glow', B.box(w * 0.5, 0.8, d * 1.02, { x, y: h * (0.35 + k * 0.3), z, ry: -a, color: rng() < 0.6 ? '#ffd890' : '#ff9a60' }));
        if (B.night) K.add('glow', B.box(w + 0.4, 0.5, d + 0.4, { x, y: h - 0.2, z, ry: -a, color: LEDS[Math.floor(rng() * LEDS.length)] })); // its LED roof line
      }
    }
    return B.mesh(K);
  },
  // The modern west bank (along local x, its front facing local +z): towers, lit, neon crowns, holo billboards.
  'eg-westBank'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 85), len = o.len ?? 500;
    for (let x = -len / 2; x < len / 2;) {
      const w = 16 + rng() * 20, h = (o.hMin ?? 20) + rng() * ((o.hMax ?? 56) - (o.hMin ?? 20)) * (B.night ? 1.6 : 1), zz = (rng() - 0.5) * 60, d = 14 + rng() * 14;
      if (B.night) tower(K, B, rng, x + w / 2, zz, w, d, h, 0, 0);
      else {
        K.add('solid', B.box(w, h, d, { x: x + w / 2, y: h / 2, z: zz, color: B.c(rng() < 0.5 ? '#c8b498' : '#a89880') }));
        for (let k = 1; k < h / 12; k++) K.add('glow', B.box(w * 0.85, 0.6, 0.5, { x: x + w / 2, y: k * 12, z: zz + 8, color: rng() < 0.7 ? '#ffd890' : '#8ae0ff' }));
      }
      x += w + 4 + rng() * 14;
    }
    return B.mesh(K);
  },
  // A fan of uplink lasers from a point (the data pyramid's capstone): o.n beams, o.spread, o.h long.
  'eg-uplink'(o, th, B) {
    const g = new THREE.Group(), n = o.n ?? 5, s = o.spread ?? 0.25, L = o.h ?? 420, w = o.w ?? 1.2, cyan = [], gold = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + 0.3; (k % 2 ? gold : cyan).push([0, 0, 0, Math.cos(a) * s, 1, Math.sin(a) * s, L, w]); }
    cyan.push([0, 0, 0, 0, 1, 0, L * 1.2, w * 1.6]);
    g.add(lasers(cyan, 0x5ff0ff, 0.5), lasers(gold, 0xffb840, 0.45));
    return g;
  },
  // Dust blowing through the night (follows the camera): warm specks streaming downwind.
  'eg-dust': (o) => dust(o.n ?? 900, o),
  // Dunes round the plateau: low sand ridges in a ring band.
  'eg-dunes'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 82), r0 = o.r0 ?? 260, r1 = o.r1 ?? 420;
    for (let i = 0; i < (o.n ?? 24); i++) {
      const a = (i / (o.n ?? 24)) * Math.PI * 2 + rng() * 0.2, r = r0 + rng() * (r1 - r0);
      const rr = 50 + rng() * 60;
      K.add('solid', B.part(new B.THREE.SphereGeometry(1, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x: Math.cos(a) * r, z: Math.sin(a) * r, sx: rr, sy: 12 + rng() * 22, sz: rr * 0.5, ry: -a + Math.PI / 2, color: B.c(sandCols[i % 3]) }));
    }
    return B.mesh(K);
  },
  // The Duat round the Hall of Judgment: obelisks, colossal seated kings, palms and far pyramids
  // under the lapis night, braziers burning.
  'eg-duatRing'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 84), R = o.r ?? 230, beams = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + rng() * 0.08, r = R + (rng() - 0.5) * 60, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const p = rng();
      if (p < 0.3) { // an obelisk with a gilded tip
        const h = 40 + rng() * 30;
        K.add('solid', B.cyl(1.8, 3, h, 4, { x, y: h / 2, z, ry: Math.PI / 4, color: B.c('#6a4a3a') }));
        K.add('glow', B.part(new B.THREE.ConeGeometry(2.6, 5, 4), { x, y: h + 2.5, z, ry: Math.PI / 4, color: '#ffc53a' }));
        if (B.night) for (let k = 0; k < 4; k++) K.add('glow', B.box(3.4 - k * 0.3, 0.6, 3.4 - k * 0.3, { x, y: h * (0.2 + k * 0.2), z, ry: Math.PI / 4, color: k % 2 ? '#ffc53a' : '#2be8ff' })); // LED bands
      } else if (p < 0.5) { // a colossus, seated, facing the hall
        const s = 1.4 + rng() * 0.6;
        K.add('solid', B.box(14 * s, 16 * s, 12 * s, { x, y: 8 * s, z, ry: -a, color: B.c('#7a5a40') }));
        K.add('solid', B.box(8 * s, 12 * s, 7 * s, { x, y: 22 * s, z, ry: -a, color: B.c('#8a6a4a') }));
        K.add('solid', B.box(6 * s, 6 * s, 6 * s, { x, y: 31 * s, z, ry: -a, color: B.c('#8a6a4a') }));
        K.add('solid', B.box(7 * s, 3 * s, 7 * s, { x, y: 34.5 * s, z, ry: -a, color: B.c('#1e46b4', 0.1) }));
        K.add('glow', B.box(4 * s, 0.6 * s, 6.2 * s, { x, y: 31.5 * s, z, ry: -a, color: '#2be8ff' }));
      } else if (p < 0.75) { // palms
        for (let k = 0; k < 3; k++) {
          const px = x + (rng() - 0.5) * 20, pz = z + (rng() - 0.5) * 20, h = 14 + rng() * 8;
          K.add('solid', B.cyl(0.5, 0.8, h, 5, { x: px, y: h / 2, z: pz, color: B.c('#3a2a20') }));
          K.add('solid', B.part(new B.THREE.SphereGeometry(5, 6, 3), { x: px, y: h, z: pz, sy: 0.35, color: B.c('#1a3a2a') }));
        }
      } else { // a brazier on a pylon stump
        K.add('solid', B.box(16, 18, 6, { x, y: 9, z, ry: -a, color: B.c('#6a5038') }));
        K.add('glow', B.part(new B.THREE.ConeGeometry(2.5, 5, 6), { x, y: 20.5, z, color: '#ff9a30' }));
        if (B.night) K.add('glow', B.box(16.4, 0.7, 6.4, { x, y: 17.6, z, ry: -a, color: '#2be8ff' }), B.box(16.4, 0.5, 6.4, { x, y: 2, z, ry: -a, color: '#ffc53a' }));
      }
    }
    for (let k = 0; k < 5; k++) { const a = rng() * Math.PI * 2, r = R * 2.2; pyramid(K, B, Math.cos(a) * r, Math.sin(a) * r, 50 + rng() * 40, 100 + rng() * 60, { glow: 1, color: '#3a2a40', beams, fan: 1 }); }
    const g = B.mesh(K);
    if (beams.length) g.add(lasers(beams, 0x8a6aff, 0.4));
    return g;
  },
};
