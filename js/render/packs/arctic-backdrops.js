// ARCTIC VAULT: backdrops (render-only; the sim never sees them). Two kinds:
//   far (unfogged, hazed toward the horizon with B.c): the aurora, the mountains round the fjord, the
//     satellite station's far domes, the ice cap, icebergs, the fjord seen from the mountain
//   near (the level's fogged materials M, or their own): the tramway's cables, the town beyond the play
//     space, the snowfall that follows the camera, the camp beacon's strobe, the cavern's crystals
// The aurora and the snow move: their own shaders, timed by onBeforeRender (render time only).
import * as THREE from 'three';
import { Kit, box, cyl, part } from '../geo.js';
import { mulberry32 } from '../../sim/util.js';

const now = () => performance.now() / 1000;
const own = (m) => { m.userData.own = true; return m; };
const meshes = (K, M, parent = new THREE.Group()) => { for (const [key, geo] of Object.entries(K.build())) if (geo) parent.add(new THREE.Mesh(geo, key === 'g' || key === 'glow' ? M.glow : M.paintFlat)); return parent; };
// A thin cylinder from a to b (cables, struts).
function rod(a, b, r, color, n = 4) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const g = cyl(r, r, L, n, { color });
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L));
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(1, 1, 1)));
  return g;
}
// A craggy cone / a flat-topped Svalbard mountain, jittered so its silhouette is ragged.
function crag(B, rng, r, h, top, seg, color, jit) {
  const g = new THREE.CylinderGeometry(r * top, r, h, seg, 3);
  const pos = g.attributes.position, shift = new Map();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (y < -h / 2 + 1e-3) continue;
    if (!shift.has(key)) shift.set(key, [1 + (rng() - 0.5) * jit, (rng() - 0.5) * jit * h * 0.3]);
    const [k, dy] = shift.get(key);
    pos.setXYZ(i, x * k, y + (y > h / 2 - 1e-3 ? dy * 0.3 : dy), z * k);
  }
  return B.part(g, { y: h / 2, color });
}

// ------------------------------------------------------------------ the aurora
const AURORA_VERT = /* glsl */ `
  attribute vec2 cur; // (along the curtain 0..1, up the curtain 0..1)
  uniform float uT;
  varying vec2 vUV;
  void main() {
    vUV = cur;
    vec3 p = position;
    float w = sin(cur.x * 18.0 + uT * 0.35) * 0.6 + sin(cur.x * 47.0 - uT * 0.8) * 0.25;
    p.xz += normalize(p.xz) * w * 14.0 * (0.4 + cur.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const AURORA_FRAG = /* glsl */ `
  uniform float uT, uK;
  varying vec2 vUV;
  void main() {
    float u = vUV.x, v = vUV.y;
    float rays = 0.55 + 0.45 * sin(u * 140.0 + uT * 1.7 + sin(u * 23.0 - uT * 0.5) * 3.0);
    float sweep = 0.6 + 0.4 * sin(u * 9.0 - uT * 0.45);
    float ends = smoothstep(0.0, 0.12, u) * smoothstep(1.0, 0.88, u);
    float hem = smoothstep(0.0, 0.07, v) * (1.0 - smoothstep(0.25, 1.0, v));
    vec3 green = vec3(0.25, 1.0, 0.55), magenta = vec3(0.85, 0.25, 0.9);
    vec3 col = mix(green, magenta, smoothstep(0.35, 0.95, v)) * (1.2 - v * 0.6);
    col += vec3(0.6, 1.0, 0.8) * smoothstep(0.08, 0.0, abs(v - 0.06)) * 0.6; // the bright lower hem
    gl_FragColor = vec4(col * rays * sweep * ends * hem * uK, 1.0);
    #include <colorspace_fragment>
  }`;
function aurora(o, th) {
  const rng = mulberry32(o.seed ?? 911), r = o.r ?? 520, n = o.n ?? 5;
  const pos = [], uv2 = [], idx = [];
  for (let c = 0; c < n; c++) {
    const a0 = rng() * Math.PI * 2, span = 0.5 + rng() * 0.7, rr = r * (0.8 + rng() * 0.35), y0 = r * (0.18 + rng() * 0.12), hgt = r * (0.22 + rng() * 0.18), steps = 40;
    const base = pos.length / 3;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, a = a0 + span * t, wob = Math.sin(t * 7 + c) * r * 0.05;
      const x = Math.cos(a) * (rr + wob), z = Math.sin(a) * (rr + wob);
      pos.push(x, y0, z, x * 1.04, y0 + hgt, z * 1.04);
      uv2.push(t, 0, t, 1);
      if (i < steps) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('cur', new THREE.Float32BufferAttribute(uv2, 2));
  g.setIndex(idx);
  const mat = own(new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: o.k ?? 0.9 } }, vertexShader: AURORA_VERT, fragmentShader: AURORA_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = -50;
  m.onBeforeRender = () => { mat.uniforms.uT.value = now(); };
  return m;
}

// ------------------------------------------------------------------ snow that follows the camera
const SNOW_VERT = /* glsl */ `
  attribute float seed;
  uniform float uT, uWind, uSize, uZMin;
  varying float vA;
  void main() {
    vec3 p = position;
    float fall = 1.6 + seed * 1.6 + uWind * 1.5;
    p.y = mod(p.y - uT * fall, 40.0) - 18.0;
    p.x += uT * uWind * (6.0 + seed * 4.0) + sin(uT * (0.7 + seed) + seed * 40.0) * 0.8;
    p.z += sin(uT * (0.5 + seed * 0.6) + seed * 17.0) * 0.8 + uT * uWind * 1.5;
    p.x = mod(p.x - cameraPosition.x + 30.0, 60.0) - 30.0 + cameraPosition.x;
    p.z = mod(p.z - cameraPosition.z + 30.0, 60.0) - 30.0 + cameraPosition.z;
    p.y += cameraPosition.y;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vA = (0.55 + seed * 0.45) * step(uZMin, p.z);
    gl_PointSize = clamp(uSize * (1.0 + seed) * 30.0 / max(1.0, -mv.z), 1.0, 5.0);
    gl_Position = projectionMatrix * mv;
  }`;
const SNOW_FRAG = /* glsl */ `
  uniform float uK;
  varying float vA;
  void main() { if (vA < 0.01) discard; gl_FragColor = vec4(vec3(0.95, 0.98, 1.0), vA * uK); }`;
// Exported for the boss view too (the blizzard): returns Points; set .material.uniforms.uK for density.
export function makeSnow(n, o = {}) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n), rng = mulberry32(o.seed ?? 77);
  for (let i = 0; i < n; i++) { pos[i * 3] = rng() * 60 - 30; pos[i * 3 + 1] = rng() * 40; pos[i * 3 + 2] = rng() * 60 - 30; seed[i] = rng(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = own(new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uWind: { value: o.wind ?? 0.2 }, uSize: { value: o.size ?? 1 }, uK: { value: o.k ?? 0.9 }, uZMin: { value: o.zMin ?? -1e5 } }, vertexShader: SNOW_VERT, fragmentShader: SNOW_FRAG, transparent: true, depthWrite: false, fog: false }));
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 6;
  pts.onBeforeRender = () => { mat.uniforms.uT.value = now(); };
  return pts;
}

// ------------------------------------------------------------------ the kinds
export const BACKDROPS = {
  'arc-aurora': (o, th) => aurora(o, th),
  'arc-snowfall': (o) => makeSnow(o.n ?? 900, { wind: o.wind ?? 0.2, size: o.size ?? 1, k: o.k ?? 0.9, zMin: o.zMin }),

  // Mountains all round the fjord: flat-topped plateau mountains and a few sharper peaks, snow on top.
  // o.r0..o.r1 radius band, o.n, o.skip = [azimuth, half-width] left open (the fjord mouth).
  'arc-peaks'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 912), n = o.n ?? 20, r0 = o.r0 ?? 300, r1 = o.r1 ?? 420;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng() * 0.2;
      if (o.skip) { let d = Math.abs(((a - o.skip[0] + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < o.skip[1]) continue; }
      const r = r0 + rng() * (r1 - r0), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const flat = rng() < 0.65, rr = 70 + rng() * 80, h = 70 + rng() * 90;
      const m = crag(B, rng, rr, h, flat ? 0.45 + rng() * 0.2 : 0.06, B.seg(12, 8), B.c(rng() < 0.5 ? '#3a4150' : '#454c5a'), 0.14);
      m.translate(x, 0, z); K.add('solid', m);
      const cap = crag(B, rng, rr * (flat ? 0.62 : 0.3), h * (flat ? 0.12 : 0.3), flat ? 0.75 : 0.08, B.seg(12, 8), B.c('#e8f0f8', -0.15), 0.08);
      cap.translate(x, h * (flat ? 0.89 : 0.7), z); K.add('solid', cap);
      for (let k = 0; k < 3; k++) { const ga = rng() * Math.PI * 2; K.add('solid', B.box(6 + rng() * 6, h * 0.6, 4, { x: x + Math.cos(ga) * rr * 0.7, y: h * 0.4, z: z + Math.sin(ga) * rr * 0.7, ry: -ga, rx: 0.3, color: B.c('#d8e2ee', -0.1) })); } // snow gullies
    }
    return B.mesh(K);
  },
  // The coal tramway's cables: the loaded cable each bucket rides (on alternate sides of the trestles),
  // and the return cable on the other side with empty buckets hanging from it.
  'arc-cables'(o, th, B, M) {
    const K = new Kit(), spans = o.spans || [], off = o.off ?? 2.9, hang = o.hang ?? 3.4;
    for (let i = 0; i < spans.length - 1; i++) {
      const [xa, ya, za] = spans[i], [xb, yb, zb] = spans[i + 1], s = i % 2 ? -1 : 1;
      K.add('p', rod([xa, ya - 0.6 + hang, za + off * s], [xb, yb - 1.4 + hang, zb + off * s], 0.06, 0x1a1c20));
      const a = [xa, ya + hang - 0.2, za - off * s], b = [xb, yb + hang - 0.8, zb - off * s];
      K.add('p', rod(a, b, 0.05, 0x1a1c20));
      for (const t of [0.35, 0.7]) {
        const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t;
        K.add('p', box(0.12, hang * 0.8, 0.12, { x, y: y - hang * 0.4, z, color: 0x30343c }), part(new THREE.CylinderGeometry(1.2, 0.8, 1.1, 4, 1), { x, y: y - hang * 0.8 - 0.5, z, ry: Math.PI / 4, color: 0x6a3420 }));
      }
    }
    return meshes(K, { glow: M.glow, paintFlat: M.paintFlat });
  },
  // Longyearbyen beyond the play space: rows of stilt houses with lit windows and street lamps on the
  // valley floor (fogged like the level), and the valley floor running on under them.
  'arc-townlights'(o, th, B, M) {
    const K = new Kit(), rng = mulberry32(o.seed ?? 913), cols = [0xc8362e, 0xe0a830, 0x2a8a8a, 0x2a5ab0, 0x4a8a3a, 0xd86a8a, 0xc87a30, 0x8a6ab8];
    K.add('p', box(560, 2, 260, { x: 40, y: -0.02, z: 388, color: 0xdfe8f2 }));
    for (let i = 0; i < 70; i++) {
      const x = -170 + rng() * 360, z = 268 + rng() * 120, w = 6 + rng() * 4, d = 7 + rng() * 4, h = 4 + rng() * 3, y = 1 + 1.8;
      K.add('p', box(w, h, d, { x, y: y + h / 2, z, ry: Math.floor(rng() * 2) * Math.PI / 2, color: cols[Math.floor(rng() * cols.length)] }), box(w + 0.4, 0.3, d + 0.4, { x, y: y + h + 0.1, z, color: 0xeef4fa }));
      for (let k = 0; k < 2; k++) if (rng() < 0.75) K.add('g', box(0.9, 1.0, 0.2, { x: x + (k - 0.5) * w * 0.5, y: y + h * 0.5, z: z - d / 2 - 0.1, color: 0xffd48a }));
    }
    for (let i = 0; i < 24; i++) { const x = -150 + i * 15, z = 262; K.add('p', box(0.15, 6, 0.15, { x, y: 4, z, color: 0x30343c })); K.add('g', box(0.8, 0.3, 0.5, { x, y: 7, z, color: 0xffc070 })); }
    return meshes(K, { glow: M.glow, paintFlat: M.paintFlat });
  },
  // The satellite station's far field of radomes on the next ridge.
  'arc-radomes'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 914);
    K.add('solid', B.box(260, 30, 160, { y: -15, color: B.c('#3e4552') }), B.box(262, 1, 162, { y: 0.2, color: B.c('#e8f0f8', -0.1) }));
    for (let i = 0; i < (o.n ?? 9); i++) {
      const x = (rng() - 0.5) * 230, z = (rng() - 0.5) * 130, R = 5 + rng() * 9;
      K.add('solid', B.part(new THREE.IcosahedronGeometry(R, 1), { x, y: 3 + R * 0.85, z, color: B.c('#f4f6f8', -0.2) }), B.cyl(R * 0.9, R, 3, 10, { x, y: 1.5, z, color: B.c('#8e959e') }));
      if (B.night) K.add('glow', B.box(1, 1, 1, { x, y: 3 + R * 1.85, z, color: '#ff3030' }));
    }
    for (let i = 0; i < 5; i++) { const x = (rng() - 0.5) * 200, z = (rng() - 0.5) * 100; K.add('solid', B.part(new THREE.SphereGeometry(7, 8, 4, 0, Math.PI * 2, 0, 1.1), { x, y: 12, z, rx: -0.9, color: B.c('#d8dde3', -0.1) }), B.box(1.4, 10, 1.4, { x, y: 5, z, color: B.c('#6f7884') })); }
    return B.mesh(K);
  },
  // The ice cap behind the glacier front: a long white plateau and dark nunataks.
  'arc-icefield'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 921), len = o.len ?? 1400, h = o.h ?? 60;
    K.add('solid', B.box(len, h, 500, { y: h / 2 - 30, color: B.c('#dfe9f2', -0.1) }));
    for (let i = 0; i < 9; i++) { const m = crag(B, rng, 40 + rng() * 50, 50 + rng() * 60, 0.1, 7, B.c('#3a4150'), 0.2); m.translate((rng() - 0.5) * len * 0.9, h - 35, (rng() - 0.5) * 300); K.add('solid', m); }
    return B.mesh(K);
  },
  // Icebergs scattered out to sea (low, white, hazed into the whiteout).
  'arc-bergs'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 922), n = o.n ?? 24, r0 = o.r0 ?? 220, r1 = o.r1 ?? 420;
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2, r = r0 + rng() * (r1 - r0), w = 20 + rng() * 50, d = 15 + rng() * 40, h = 8 + rng() * 26;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z < -100 && Math.abs(x) < 300) continue; // (the glacier is there)
      K.add('solid', B.box(w, h, d, { x, y: h / 2 - 2, z, ry: rng() * 3, color: B.c(rng() < 0.5 ? '#e8f2f8' : '#bfe0ee') }));
      if (rng() < 0.5) K.add('solid', B.box(w * 0.4, h * 0.6, d * 0.4, { x: x + w * 0.2, y: h + h * 0.3 - 2, z, color: B.c('#f4f8fb') }));
    }
    return B.mesh(K);
  },
  // From the vault's door, far below: the fjord, the lights of the town and the airport's runway.
  'arc-fjordview'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 933);
    K.add('solid', B.box(1400, 2, 500, { y: -1, color: B.c('#14263a') }), B.box(1400, 2, 200, { y: 0, z: -330, color: B.c('#c8d4e0', -0.2) }));
    for (let i = 0; i < 160; i++) K.add('glow', B.box(1.6, 1.6, 1.6, { x: -200 + rng() * 260, y: 2, z: -300 + rng() * 120, color: rng() < 0.8 ? '#ffd48a' : '#a8e0ff' }));
    for (let i = 0; i < 30; i++) K.add('glow', B.box(1.2, 1, 1.2, { x: 120 + i * 8, y: 2, z: -280, color: i % 2 ? '#ffffff' : '#5af06a' }));
    return B.mesh(K);
  },
  // The camp beacon's strobe: unfogged and additive, so you find the camp through the whiteout.
  'arc-beaconlight'(o) {
    const g = new THREE.Group(), mat = own(new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), mat), halo = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), own(new THREE.MeshBasicMaterial({ color: 0x3ab8ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
    g.add(core, halo);
    core.onBeforeRender = () => { const t = now(), f = (t % 1.2) < 0.18 ? 1 : 0.25; mat.opacity = f; halo.material.opacity = f * 0.35; halo.scale.setScalar(1 + f * 0.6); };
    return g;
  },
  // The cavern: crystal clusters in the walls, frozen cryo pods in the ice, a frozen waterfall (fogged, near).
  'arc-cavern'(o, th, B, M) {
    const K = new Kit(), rng = mulberry32(o.seed ?? 941);
    const cluster = (x, z, s, col) => { for (let k = 0; k < 5; k++) { const h = (2 + rng() * 4) * s, a = rng() * Math.PI * 2; K.add('g', part(new THREE.ConeGeometry(0.5 * s, h, 4), { x: x + Math.cos(a) * s, y: h / 2, z: z + Math.sin(a) * s, rz: Math.cos(a) * 0.4, rx: Math.sin(a) * 0.4, color: col })); } };
    for (const [x, z] of [[-36.5, -27], [36.5, -27], [-36.5, 27], [36.5, 27], [-37, -20], [-37, 20], [37, -14], [37, 16]]) cluster(x, z, 1.4, rng() < 0.5 ? 0x5fe8ff : 0x9affe8);
    for (let i = 0; i < 6; i++) { // cryo pods frozen into the north and south walls
      const x = -26 + i * 10, z = i % 2 ? -28.6 : 28.6;
      K.add('p', cyl(1.3, 1.3, 4, 10, { x, y: 3.5, z, color: 0x8a96a2 }));
      K.add('g', cyl(1.33, 1.33, 1.6, 10, { x, y: 3.5, z, color: 0x5fe8ff }));
    }
    K.add('p', box(8, 26, 2, { x: 0, y: 14, z: -28.6, color: 0xa8d8ea }), box(6, 22, 2.2, { x: 0, y: 12, z: -28.4, color: 0xc8eaf6 })); // a frozen waterfall
    return meshes(K, { glow: M.glow, paintFlat: M.paintFlat });
  },
};
