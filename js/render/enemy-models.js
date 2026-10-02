// The regular enemies: OmniCorp security hardware. Hard-surface two-tone armour (light plates over a
// gunmetal chassis) with neon accents, so every type reads by day and as a pattern of lights at night:
//   drone   a floating sensor pod: one big lens, a pink waist band, two vectoring thruster nacelles
//   walker  a low amber crawler: a smooth dome with a lit landing ring on top (safe to stomp), four legs
//   spiker  its crimson cousin: a spinning crown of chrome spikes with red-hot tips (don't land on it)
//   guard   a security officer: visor helmet, armoured long coat with a lit hem, a carbine
//   turret  a hazard-striped pedestal, a swivel head with a slit sensor, twin recoiling barrels
// Conventions: metres, +Y up, models face -Z (the sim's yaw 0), origin at the feet (drone: its centre).
// Each animated part is ONE mesh: lit paint and its lights share a geometry (a per-vertex 'glow' flag)
// and one material per enemy (enemyMaterial), so a whole enemy is 3–6 draw calls. Lights come in two
// kinds: fixed colours, and 'state' lights (eyes, visors) tinted by the enemy's alert colour every
// frame. Geometry is built once per type and shared; parts also carry a chunk id, so a death can
// throw the model apart in pieces (userData.chunks).
import * as THREE from 'three';
import { box, cyl, part } from './geo.js';
import { mergeGeometries } from '../vendor/addons/BufferGeometryUtils.js';
import { seg } from './retro.js';

// ------------------------------------------------------------------ the palette
export const EC = {
  armor: 0xdde2ea, armor2: 0xaab3c2, gun: 0x353a47, dark: 0x1b1e26, steel: 0x8c95a5, black: 0x101117,
  haz: 0xffc21a, pink: 0xff2a8a, amber: 0xffa21a, red: 0xff2238, white: 0xfff4f8,
  orange: 0xff8a1a, orangeDk: 0xc85a10, crimson: 0xc41a34, crimsonDk: 0x7a0e1e,
};
// Guards vary by id: coat, trim light, chest plate.
export const COATS = [0x2c3240, 0x4a3e2c, 0x24392f, 0x5a2228];
export const TRIMS = [0x2be8ff, 0xffa21a, 0x7bff4a, 0xff2bd6];
const PLATES = [0xdde2ea, 0xc8ccd2, 0xd2d8cc, 0xe0d6d0];

// ------------------------------------------------------------------ the material
// Lambert, flat, vertex-coloured, plus: glow 1 = unlit (lights), glow 2 = unlit × uEye (state lights),
// a rim term (uRim, per theme: silhouettes lift out of the dark at night; stronger with distance,
// plus a faint fill far away, uFar, so a far enemy is a shape and not a hole), and a hit flash (uFlash).
export const ENEMY_SHARED = { uRim: { value: new THREE.Color(0, 0, 0) }, uFar: { value: 0 } };
function patch(sh) {
  const u = this.userData.u;
  sh.uniforms.uRim = ENEMY_SHARED.uRim; sh.uniforms.uFar = ENEMY_SHARED.uFar;
  sh.uniforms.uEye = u.uEye; sh.uniforms.uFlash = u.uFlash; sh.uniforms.uFlashCol = u.uFlashCol; sh.uniforms.uGlowK = u.uGlowK;
  sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute float glow;\nvarying float vGlow;\nvoid main() {\n\tvGlow = glow;');
  sh.fragmentShader = sh.fragmentShader
    .replace('void main() {', 'uniform vec3 uRim;\nuniform float uFar;\nuniform vec3 uEye;\nuniform float uFlash;\nuniform vec3 uFlashCol;\nuniform float uGlowK;\nvarying float vGlow;\nvoid main() {')
    .replace('#include <opaque_fragment>', `{
      float gl = clamp(vGlow, 0.0, 1.0), st = clamp(vGlow - 1.0, 0.0, 1.0);
      float rim = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
      float far = smoothstep(6.0, 40.0, length(vViewPosition)); // far away: a stronger outline and a faint fill
      outgoingLight += uRim * (rim * rim * (1.0 + far) + uFar * far) * (1.0 - gl);
      outgoingLight = mix(outgoingLight, diffuseColor.rgb * mix(vec3(uGlowK), uEye, st), gl);
      outgoingLight = mix(outgoingLight, uFlashCol, uFlash);
    }
    #include <opaque_fragment>`);
}
export function enemyMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  m.userData.u = { uEye: { value: new THREE.Color(EC.red) }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) }, uGlowK: { value: 1 } };
  m.userData.own = true; // disposed with the stage
  m.onBeforeCompile = patch;
  return m;
}

// ------------------------------------------------------------------ building blocks
// EKit: parts with a glow kind (0 paint, 1 light, 2 state light) and a chunk id (-1: none).
class EKit {
  constructor() { this.parts = []; }
  add(geo, glow, c) {
    geo.setAttribute('glow', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(glow), 1));
    this.parts.push([geo, c]);
    return this;
  }
  p(c, ...g) { for (const x of g) this.add(x, 0, c); return this; }
  g(c, ...g) { for (const x of g) this.add(x, 1, c); return this; }
  s(c, ...g) { for (const x of g) this.add(x, 2, c); return this; }
  // → { geo, chunks: [{ geo, x, y, z }] } (chunk geometry centred on its own middle, offset in this frame)
  build() {
    const geo = mergeGeometries(this.parts.map((p) => p[0]), false);
    const ids = [...new Set(this.parts.map((p) => p[1]).filter((c) => c >= 0))];
    const chunks = ids.map((c) => {
      const g = mergeGeometries(this.parts.filter((p) => p[1] === c).map((p) => p[0]), false);
      g.computeBoundingBox();
      const m = g.boundingBox.getCenter(new THREE.Vector3());
      g.translate(-m.x, -m.y, -m.z);
      g.computeBoundingSphere();
      return { geo: g, x: m.x, y: m.y, z: m.z };
    });
    for (const [g] of this.parts) g.dispose();
    geo.computeBoundingSphere();
    return { geo, chunks };
  }
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _Y = new THREE.Vector3(0, 1, 0), _s1 = new THREE.Vector3(1, 1, 1);
// A box w × |b−a| × d stretched from point a to point b.
function beam(a, b, w, d, color) {
  _a.set(...a); _b.set(...b);
  const len = _a.distanceTo(_b);
  const g = part(new THREE.BoxGeometry(w, len, d), { color });
  _q.setFromUnitVectors(_Y, _b.clone().sub(_a).normalize());
  _m.compose(_a.add(_b).multiplyScalar(0.5), _q, _s1);
  g.applyMatrix4(_m);
  return g;
}
// A cone of height h standing on point base, pointing along dir (a spike).
function cone(r, h, base, dir, color, sides = 4) {
  const g = part(new THREE.ConeGeometry(r, h, sides).translate(0, h / 2, 0), { color });
  _b.set(...dir).normalize();
  _q.setFromUnitVectors(_Y, _b);
  _m.compose(_a.set(...base), _q, _s1);
  g.applyMatrix4(_m);
  return g;
}
// A spike with a red-hot tip (the tip is a light).
function spike(K, c, r, h, base, dir, col, tip) {
  const l = Math.hypot(...dir), d = dir.map((v) => v / l);
  K.p(c, cone(r, h, base, d, col));
  K.g(c, cone(r * 0.42, h * 0.34, base.map((v, i) => v + d[i] * h * 0.66), d, tip));
}
// A box hanging from its top edge (coat panels): pivot = top centre, then rotated and placed.
function panel(w, h, d, o) { return part(new THREE.BoxGeometry(w, h, d).translate(0, -h / 2, 0), o); }
// Turn a part inside out (a lining you see from inside): swap each triangle's winding.
function flip(g) {
  for (const k of ['position', 'normal', 'color', 'uv']) {
    const at = g.attributes[k];
    if (!at) continue;
    const n = at.itemSize, a = at.array;
    for (let i = 0; i < at.count; i += 3) for (let j = 0; j < n; j++) { const t = a[(i + 1) * n + j]; a[(i + 1) * n + j] = a[(i + 2) * n + j]; a[(i + 2) * n + j] = t; }
  }
  return g;
}
// Recolour a built part per triangle: fn(centroid x, y, z) → colour (or null to keep).
const _c = new THREE.Color();
function facets(g, fn) {
  const p = g.attributes.position, col = g.attributes.color;
  for (let i = 0; i < p.count; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const c = fn(x, y, z);
    if (c == null) continue;
    _c.set(c);
    for (let k = 0; k < 3; k++) col.setXYZ(i + k, _c.r, _c.g, _c.b);
  }
  return g;
}
const R2 = Math.PI / 2, O8 = Math.PI / 8; // O8: turn an octagon so a flat face looks down -Z

// ------------------------------------------------------------------ geometry cache (per type)
const CACHE = new Map();
const cached = (key, make) => { let v = CACHE.get(key); if (!v) { v = make(); CACHE.set(key, v); } return v; };

// Make a mesh for a built part, register its chunks against it, add it to a parent.
function mount(g, parent, built, mat, name) {
  const m = new THREE.Mesh(built.geo, mat);
  m.name = name;
  parent.add(m);
  for (const c of built.chunks) g.userData.chunks.push({ ...c, mesh: m });
  return m;
}
function shell(kind) {
  const g = new THREE.Group();
  g.userData = { kind, chunks: [], mat: enemyMaterial() };
  return g;
}

// ------------------------------------------------------------------ drone
// Centre at y = 0 (the sim's hover point), r 0.75. Parts: 'body' (banks and bobs), 'pods' (both
// nacelles, tilt about X for thrust vectoring), 'eye' (the lens, tracks you). Anchors in userData:
// jets (nacelle exhausts, in pods' frame), eye centre (in eye's frame).
function droneParts() {
  const C = EC;
  const B = new EKit();
  // the pod: an octagonal capsule, light armour over a gunmetal belly
  B.p(0, cyl(0.4, 0.4, 0.3, 8, { ry: O8, color: C.armor }), cyl(0.25, 0.4, 0.16, 8, { y: 0.23, ry: O8, color: C.armor }), cyl(0.2, 0.25, 0.05, 8, { y: 0.335, ry: O8, color: C.armor2 }));
  B.p(1, cyl(0.4, 0.22, 0.2, 8, { y: -0.25, ry: O8, color: C.gun }), cyl(0.2, 0.14, 0.08, 8, { y: -0.38, ry: O8, color: C.dark }));
  B.p(0, box(0.06, 0.22, 0.36, { y: 0.42, z: 0.06, color: C.armor2 }), box(0.07, 0.05, 0.3, { y: 0.52, z: 0.08, color: C.gun })); // dorsal fin
  B.p(0, cyl(0.015, 0.015, 0.3, 4, { x: 0.12, y: 0.47, z: 0.14, color: C.gun })); // antenna
  B.s(0, box(0.05, 0.05, 0.05, { x: 0.12, y: 0.63, z: 0.14 })); // its beacon (state)
  B.g(1, cyl(0.405, 0.405, 0.06, 8, { y: -0.08, ry: O8, color: C.pink })); // the faction band
  B.g(1, cyl(0.15, 0.15, 0.02, 8, { y: -0.425, color: C.pink })); // under-light
  // the lens socket (a hood round the eye) and cheek vents
  B.p(1, cyl(0.24, 0.26, 0.16, 8, { y: 0.03, z: -0.36, rx: R2, color: C.dark }));
  B.p(0, box(0.5, 0.06, 0.14, { y: 0.27, z: -0.3, rx: 0.5, color: C.armor2 })); // brow
  for (const sx of [-1, 1]) {
    B.p(sx < 0 ? 2 : 6, box(0.34, 0.1, 0.2, { x: sx * 0.52, color: C.gun }), box(0.3, 0.035, 0.22, { x: sx * 0.52, y: 0.065, color: C.armor2 })); // pylon
    B.p(1, box(0.03, 0.12, 0.14, { x: sx * 0.33, y: -0.12, z: -0.18, ry: sx * 0.5, color: C.black }));
  }
  const body = B.build();
  const P = new EKit();
  const jets = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.76, c = sx < 0 ? 3 : 4;
    P.p(c, cyl(0.17, 0.14, 0.42, 8, { x, color: C.gun }), cyl(0.12, 0.17, 0.08, 8, { x, y: 0.25, color: C.armor }), cyl(0.09, 0.09, 0.03, 8, { x, y: 0.3, color: C.black }));
    P.p(c, cyl(0.176, 0.176, 0.07, 8, { x, y: 0.08, color: C.haz }), cyl(0.14, 0.12, 0.08, 8, { x, y: -0.25, color: C.dark })); // hazard band, nozzle
    P.p(c, box(0.035, 0.3, 0.22, { x: x + sx * 0.17, y: 0.02, z: 0.04, color: C.armor2 })); // outer fin
    P.g(c, box(0.04, 0.24, 0.035, { x: x + sx * 0.19, y: 0.02, z: -0.08, color: C.pink })); // its edge light
    P.g(c, cyl(0.11, 0.11, 0.02, 8, { x, y: -0.3, color: 0xffb0e8 })); // the exhaust
    jets.push([x, -0.3, 0]);
  }
  const pods = P.build();
  const E = new EKit();
  E.p(5, cyl(0.2, 0.2, 0.08, 10, { rx: R2, color: C.gun }), cyl(0.205, 0.205, 0.025, 10, { z: -0.035, rx: R2, color: C.steel }));
  E.s(5, cyl(0.145, 0.145, 0.03, 10, { z: -0.045, rx: R2, color: 0xffffff })); // iris (state)
  E.p(5, cyl(0.07, 0.07, 0.02, 8, { z: -0.062, rx: R2, color: C.black })); // pupil ring
  E.g(5, cyl(0.04, 0.04, 0.02, 6, { z: -0.07, rx: R2, color: C.white })); // glint
  const eye = E.build();
  return { body, pods, eye, jets };
}
export function droneModel() {
  const D = cached('drone', droneParts);
  const g = shell('drone'), mat = g.userData.mat;
  const body = new THREE.Group(); body.name = 'bodyG'; g.add(body);
  mount(g, body, D.body, mat, 'body');
  const pods = mount(g, body, D.pods, mat, 'pods');
  const eye = mount(g, body, D.eye, mat, 'eye'); eye.position.set(0, 0.03, -0.42);
  g.userData.parts = { body, pods, eye };
  g.userData.jets = D.jets;
  return g;
}

// ------------------------------------------------------------------ walker / spiker
// A low crawler: a domed hull on four two-segment legs. 'body' (bobs, leans), 'leg0..3' (pivot at
// the hip, the leg lies along local +X: the renderer swings it about Y and lifts it about Z).
const HIP_R = 0.44, HIP_Y = 0.5;
export const LEG_DIRS = [[1, -1], [-1, -1], [-1, 1], [1, 1]].map(([x, z]) => [x / Math.SQRT2, z / Math.SQRT2]); // FR, FL, BL, BR
function crawlerParts(spiky) {
  const C = EC;
  const shellC = spiky ? C.crimson : C.orange, shellDk = spiky ? C.crimsonDk : C.orangeDk, band = spiky ? C.red : C.amber;
  const B = new EKit();
  // chassis: a tapered belly and a waist ring with the light band
  B.p(1, cyl(0.52, 0.36, 0.22, 8, { y: 0.38, ry: O8, color: C.gun }), cyl(0.3, 0.3, 0.06, 8, { y: 0.25, ry: O8, color: C.dark }));
  B.p(1, cyl(0.6, 0.56, 0.12, 8, { y: 0.54, ry: O8, color: C.gun }));
  B.g(1, cyl(0.615, 0.615, 0.05, 8, { y: 0.54, ry: O8, color: band }));
  for (const [dx, dz] of LEG_DIRS) B.p(1, cyl(0.13, 0.13, 0.18, 8, { x: dx * (HIP_R - 0.04), y: HIP_Y, z: dz * (HIP_R - 0.04), color: C.dark }), cyl(0.14, 0.14, 0.05, 8, { x: dx * (HIP_R - 0.04), y: HIP_Y + 0.11, z: dz * (HIP_R - 0.04), color: C.steel }));
  // the dome: faceted, two-tone panels, a light stripe down the spine (walker) / warning chevrons (spiker)
  const dome = part(new THREE.SphereGeometry(0.58, seg(10, 8), 3, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.6, sy: 0.72, ry: O8, color: shellC });
  facets(dome, (x, y, z) => (Math.abs(x) < 0.13 && !spiky ? C.armor : y < 0.78 && Math.abs(x) > 0.28 ? shellDk : null));
  B.p(0, dome);
  // the front sensor head: a wedge with a wide visor (state light) and two lamps
  B.p(2, box(0.52, 0.2, 0.24, { y: 0.66, z: -0.47, rx: -0.15, color: C.gun }), box(0.56, 0.06, 0.28, { y: 0.78, z: -0.47, rx: -0.15, color: shellC }));
  B.s(2, box(0.44, 0.075, 0.04, { y: 0.67, z: -0.6, rx: -0.15 }));
  B.g(2, box(0.08, 0.06, 0.03, { x: -0.19, y: 0.57, z: -0.58, color: 0xfff0c8 }), box(0.08, 0.06, 0.03, { x: 0.19, y: 0.57, z: -0.58, color: 0xfff0c8 }));
  // tail: two vents and a red tail light
  for (const sx of [-1, 1]) B.p(0, cyl(0.06, 0.07, 0.16, 6, { x: sx * 0.16, y: 0.72, z: 0.46, rx: 0.9, color: C.gun }));
  B.g(1, box(0.22, 0.05, 0.03, { y: 0.5, z: 0.6, color: C.red }));
  if (!spiky) {
    // the landing ring on top: a lit hatch says "land here"
    B.p(0, cyl(0.27, 0.3, 0.06, 8, { y: 1.0, ry: O8, color: C.armor2 }));
    B.g(0, cyl(0.24, 0.24, 0.02, 8, { y: 1.035, ry: O8, color: C.amber }));
    B.p(0, cyl(0.19, 0.19, 0.03, 8, { y: 1.04, ry: O8, color: C.armor }));
  } else {
    // a skirt of short spikes round the rim (static), the crown spins (below)
    for (let k = 0; k < 10; k++) {
      const a = (k + 0.5) / 10 * Math.PI * 2, x = Math.sin(a), z = Math.cos(a);
      if (z < -0.75) continue; // keep the visor clear
      spike(B, 0, 0.065, 0.28, [x * 0.52, 0.68, z * 0.52], [x, 0.45, z], C.steel, C.red);
    }
    B.p(0, cyl(0.3, 0.38, 0.1, 8, { y: 0.96, ry: O8, color: C.dark }));
  }
  const body = B.build();
  // a leg: coxa, thigh up to the knee, shin down to a foot on the deck (local +X outward, y 0 = hip)
  const L = new EKit(), armorC = spiky ? C.crimson : C.orange;
  L.p(0, box(0.18, 0.14, 0.16, { x: 0.06, color: C.gun }));
  L.p(0, beam([0.08, 0.02, 0], [0.36, 0.3, 0], 0.13, 0.14, armorC), beam([0.1, -0.04, 0], [0.38, 0.24, 0], 0.06, 0.08, C.dark));
  L.p(0, cyl(0.08, 0.08, 0.17, 8, { x: 0.36, y: 0.3, rx: R2, color: C.steel }));
  L.p(0, beam([0.36, 0.3, 0], [0.6, -0.44, 0], 0.09, 0.1, C.gun), beam([0.39, 0.22, 0], [0.55, -0.24, 0], 0.05, 0.12, spiky ? C.crimsonDk : C.armor));
  if (spiky) L.p(0, part(new THREE.ConeGeometry(0.06, 0.2, 4), { x: 0.6, y: -0.42, rz: Math.PI, color: C.steel }), part(new THREE.ConeGeometry(0.035, 0.16, 4), { x: 0.42, y: 0.4, rz: -0.6, color: C.steel }));
  else L.p(0, box(0.18, 0.06, 0.18, { x: 0.6, y: -0.47, color: C.dark }), box(0.1, 0.04, 0.12, { x: 0.6, y: -0.43, color: C.steel }));
  L.g(0, beam([0.05, 0.12, 0], [0.25, 0.32, 0], 0.035, 0.06, band)); // a light along the thigh
  const leg = L.build();
  let crown = null;
  if (spiky) {
    const K = new EKit();
    K.p(0, cyl(0.24, 0.3, 0.08, 8, { y: 0, color: C.steel }));
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, x = Math.sin(a), z = Math.cos(a); spike(K, 0, 0.075, 0.4, [x * 0.2, 0.02, z * 0.2], [x * 0.55, 1, z * 0.55], C.armor, C.red); }
    spike(K, 0, 0.1, 0.54, [0, 0.02, 0], [0, 1, 0], C.armor, C.red);
    crown = K.build();
  }
  return { body, leg, crown };
}
function crawler(kind) {
  const D = cached(kind, () => crawlerParts(kind === 'spiker'));
  const g = shell(kind), mat = g.userData.mat;
  const body = new THREE.Group(); body.name = 'bodyG'; g.add(body);
  mount(g, body, D.body, mat, 'body');
  const legs = LEG_DIRS.map(([dx, dz], i) => {
    const m = mount(g, g, D.leg, mat, 'leg' + i);
    m.position.set(dx * HIP_R, HIP_Y, dz * HIP_R);
    m.rotation.order = 'YZX';
    m.userData.yaw = Math.atan2(-dz, dx); m.userData.side = Math.sign(dx);
    m.rotation.y = m.userData.yaw;
    return m;
  });
  let crown = null;
  if (D.crown) { crown = mount(g, body, D.crown, mat, 'crown'); crown.position.y = 1.0; }
  g.userData.parts = { body, legs, crown };
  return g;
}
export const walkerModel = () => crawler('walker');
export const spikerModel = () => crawler('spiker');

// ------------------------------------------------------------------ guard
// A security officer: 'body' (from the feet: boots, armour, visor helmet; sways), 'coat' (the long
// coat's skirt, pivot at the waist: swings), 'arms' (both arms and the carbine, pivot at the
// shoulders: low-ready → aim). Anchors: muzzle (arms frame).
export const GUARD = { waist: 1.04, shoulder: 1.42, muzzle: [0.16, -0.06, -1.04] };
function guardParts(v) {
  const C = EC, coat = COATS[v], trim = TRIMS[v], plate = PLATES[v];
  const B = new EKit();
  for (const sx of [-1, 1]) {
    const x = sx * 0.12, c = sx < 0 ? 3 : 4;
    B.p(c, box(0.18, 0.15, 0.31, { x, y: 0.075, z: -0.03, color: C.dark }), box(0.18, 0.07, 0.1, { x, y: 0.11, z: -0.15, color: C.steel })); // boot + toe cap
    B.p(c, box(0.16, 0.38, 0.18, { x, y: 0.33, color: C.gun }), box(0.13, 0.26, 0.04, { x, y: 0.36, z: -0.1, color: plate }), box(0.14, 0.07, 0.06, { x, y: 0.54, z: -0.08, color: plate })); // greave, knee
    B.p(c, box(0.17, 0.42, 0.19, { x, y: 0.75, color: C.dark }));
  }
  B.p(0, cyl(0.24, 0.24, 0.12, 8, { y: 0.98, ry: O8, sz: 0.75, color: C.gun }), box(0.1, 0.08, 0.06, { y: 0.98, z: -0.18, color: C.steel }), box(0.12, 0.12, 0.08, { x: 0.2, y: 0.95, z: -0.08, color: C.dark }));
  B.p(0, cyl(0.27, 0.23, 0.5, 8, { y: 1.27, ry: O8, sz: 0.72, color: coat })); // torso (the coat's body)
  B.p(0, box(0.4, 0.3, 0.08, { y: 1.33, z: -0.16, rx: -0.1, color: plate }), box(0.32, 0.12, 0.07, { y: 1.13, z: -0.15, color: C.gun }), box(0.26, 0.05, 0.08, { y: 1.47, z: -0.15, rx: -0.1, color: C.gun })); // chest plate
  B.g(0, beam([-0.1, 1.41, -0.205], [0, 1.31, -0.215], 0.04, 0.02, C.pink), beam([0.1, 1.41, -0.205], [0, 1.31, -0.215], 0.04, 0.02, C.pink)); // the OmniCorp chevron
  B.g(0, box(0.28, 0.03, 0.02, { y: 1.135, z: -0.19, color: trim }));
  for (const sx of [-1, 1]) {
    B.p(0, cyl(0.15, 0.17, 0.26, 6, { x: sx * 0.31, y: 1.45, rz: R2, color: plate }), cyl(0.12, 0.12, 0.3, 6, { x: sx * 0.31, y: 1.45, rz: R2, color: C.gun })); // pauldron
    B.g(0, cyl(0.173, 0.173, 0.03, 6, { x: sx * 0.43, y: 1.45, rz: R2, color: trim }));
  }
  // a standing collar round the back of the neck, the neck
  B.p(0, box(0.34, 0.2, 0.06, { y: 1.6, z: 0.1, rx: 0.2, color: coat }));
  for (const sx of [-1, 1]) B.p(0, box(0.06, 0.18, 0.2, { x: sx * 0.16, y: 1.59, z: 0.0, rz: sx * 0.15, color: coat }));
  B.p(0, box(0.12, 0.1, 0.12, { y: 1.6, color: C.dark }));
  B.p(0, box(0.3, 0.36, 0.13, { y: 1.3, z: 0.2, color: C.gun }), box(0.22, 0.08, 0.06, { y: 1.5, z: 0.25, color: C.dark })); // power pack
  B.g(0, box(0.04, 0.24, 0.02, { x: 0.08, y: 1.3, z: 0.27, color: trim }), box(0.04, 0.24, 0.02, { x: -0.08, y: 1.3, z: 0.27, color: trim }));
  // the visor helmet: a gunmetal shell, a light dome, a wraparound visor (state), a jaw guard
  B.p(1, cyl(0.15, 0.16, 0.22, 8, { y: 1.74, ry: O8, color: C.gun }));
  B.p(1, part(new THREE.SphereGeometry(0.162, 8, 2, 0, Math.PI * 2, 0, Math.PI / 2), { y: 1.85, ry: O8, sy: 0.8, color: plate }));
  B.p(1, box(0.05, 0.05, 0.3, { y: 1.97, z: 0.02, color: C.gun })); // crest
  B.p(1, part(new THREE.CylinderGeometry(0.172, 0.172, 0.09, 8, 1, true, Math.PI * 0.62, Math.PI * 0.76), { y: 1.76, color: C.black })); // visor glass
  B.s(1, part(new THREE.CylinderGeometry(0.18, 0.18, 0.045, 8, 1, true, Math.PI * 0.66, Math.PI * 0.68), { y: 1.76 }));
  B.p(1, box(0.2, 0.09, 0.08, { y: 1.64, z: -0.11, color: C.gun }), cyl(0.03, 0.03, 0.05, 6, { x: -0.055, y: 1.63, z: -0.16, rx: R2, color: C.steel }), cyl(0.03, 0.03, 0.05, 6, { x: 0.055, y: 1.63, z: -0.16, rx: R2, color: C.steel }));
  for (const sx of [-1, 1]) B.p(1, cyl(0.055, 0.055, 0.04, 8, { x: sx * 0.165, y: 1.73, z: 0.03, rz: R2, color: C.steel }));
  B.p(1, cyl(0.012, 0.012, 0.24, 4, { x: 0.15, y: 1.9, z: 0.08, color: C.gun }));
  B.g(1, box(0.035, 0.035, 0.035, { x: 0.15, y: 2.02, z: 0.08, color: trim }));
  const body = B.build();
  // the coat skirt, hanging from the waist (y 0 = waist): an octagonal flare open at the front, lined,
  // with a lit hem and lit front edges
  const K = new EKit(), hem = 0.78, gap = 0.95, t0 = Math.PI + gap / 2, tl = Math.PI * 2 - gap, rt = 0.25, rb = 0.42;
  K.p(6, part(new THREE.CylinderGeometry(rt, rb, hem, 8, 1, true, t0, tl), { y: -hem / 2, color: coat }));
  K.p(6, flip(part(new THREE.CylinderGeometry(rt * 0.94, rb * 0.95, hem - 0.02, 8, 1, true, t0, tl), { y: -hem / 2, color: C.dark })));
  K.g(6, part(new THREE.CylinderGeometry(rb + 0.006, rb + 0.008, 0.05, 8, 1, true, t0, tl), { y: -hem + 0.025, color: trim }));
  for (const th of [t0, t0 + tl]) {
    const sx = Math.sin(th), sz = Math.cos(th);
    K.g(6, beam([sx * (rt + 0.008), -0.02, sz * (rt + 0.008)], [sx * (rb + 0.008), -hem + 0.04, sz * (rb + 0.008)], 0.035, 0.03, trim));
  }
  K.p(6, cyl(0.26, 0.26, 0.08, 8, { y: -0.03, ry: O8, sz: 0.75, color: coat })); // the waist
  K.p(6, box(0.03, hem * 0.7, 0.03, { y: -hem * 0.6, z: rb * 0.85, rx: 0.2, color: C.dark })); // back vent
  const coatP = K.build();
  // arms + carbine (y 0 = shoulders, aim pose: the barrel level)
  const A = new EKit();
  A.p(2, beam([0.31, -0.02, 0], [0.29, -0.28, -0.1], 0.14, 0.15, coat), beam([0.29, -0.28, -0.1], [0.17, -0.12, -0.33], 0.12, 0.13, coat), box(0.1, 0.1, 0.11, { x: 0.17, y: -0.12, z: -0.35, color: C.dark }));
  A.p(2, beam([-0.31, -0.02, 0], [-0.26, -0.25, -0.16], 0.14, 0.15, coat), beam([-0.26, -0.25, -0.16], [0.11, -0.12, -0.58], 0.12, 0.13, coat), box(0.1, 0.1, 0.11, { x: 0.11, y: -0.12, z: -0.6, color: C.dark }));
  A.p(2, box(0.13, 0.08, 0.13, { x: 0.29, y: -0.29, z: -0.1, color: plate }), box(0.13, 0.08, 0.13, { x: -0.26, y: -0.26, z: -0.16, color: plate })); // elbow guards
  A.p(2, beam([0.22, -0.2, -0.22], [0.17, -0.13, -0.3], 0.135, 0.06, C.gun), beam([-0.1, -0.2, -0.36], [0.06, -0.14, -0.5], 0.135, 0.06, C.gun)); // vambraces
  // the carbine: stock in the shoulder, body, shroud, emitter (light), sight (state), magazine
  A.p(5, box(0.08, 0.12, 0.22, { x: 0.16, y: -0.08, z: -0.08, color: C.dark }), box(0.09, 0.14, 0.5, { x: 0.16, y: -0.06, z: -0.42, color: C.gun }), box(0.095, 0.05, 0.4, { x: 0.16, y: 0.02, z: -0.44, color: C.armor2 }));
  A.p(5, box(0.065, 0.07, 0.34, { x: 0.16, y: -0.06, z: -0.82, color: C.dark }), box(0.08, 0.08, 0.05, { x: 0.16, y: -0.06, z: -0.98, color: C.steel }), box(0.06, 0.16, 0.08, { x: 0.16, y: -0.18, z: -0.38, rx: 0.2, color: C.dark }));
  A.g(5, box(0.05, 0.05, 0.03, { x: 0.16, y: -0.06, z: -1.015, color: C.pink }), box(0.07, 0.02, 0.24, { x: 0.16, y: -0.015, z: -0.7, color: C.pink }));
  A.p(5, box(0.04, 0.06, 0.14, { x: 0.16, y: 0.07, z: -0.36, color: C.black }));
  A.s(5, box(0.03, 0.035, 0.02, { x: 0.16, y: 0.07, z: -0.435 }));
  const arms = A.build();
  return { body, coat: coatP, arms };
}
export function guardModel(M, variant = 0) {
  const v = ((variant % COATS.length) + COATS.length) % COATS.length;
  const D = cached('guard' + v, () => guardParts(v));
  const g = shell('guard'), mat = g.userData.mat;
  const body = new THREE.Group(); body.name = 'bodyG'; g.add(body);
  mount(g, body, D.body, mat, 'body');
  const coat = mount(g, body, D.coat, mat, 'coat'); coat.position.y = GUARD.waist;
  const arms = mount(g, body, D.arms, mat, 'arms'); arms.position.y = GUARD.shoulder;
  g.userData.parts = { body, coat, arms };
  g.userData.trim = TRIMS[v];
  return g;
}

// ------------------------------------------------------------------ turret
// 'base' (doesn't turn), 'head' (yaw, pivot y 1.0), 'gun' (a group in the head: pitch), 'barrelL/R'
// (recoil along +Z). Anchors: muzzles (barrel frames).
export const TURRET = { headY: 1.0, gunY: 0.3, gunZ: -0.36, barrelX: 0.17, muzzleZ: -0.84 };
function turretParts() {
  const C = EC;
  const B = new EKit();
  B.p(0, cyl(0.8, 0.86, 0.14, 8, { y: 0.07, ry: O8, color: C.dark }));
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; B.p(0, box(0.08, 0.05, 0.08, { x: Math.sin(a) * 0.74, y: 0.16, z: Math.cos(a) * 0.74, color: C.steel })); }
  const collar = cyl(0.64, 0.72, 0.26, 8, { y: 0.27, ry: O8, color: C.haz });
  facets(collar, (x, y, z) => (Math.abs(y - 0.27) > 0.12 ? null : Math.floor((Math.atan2(x, z) / (Math.PI * 2) + 1) * 8 + 0.5) % 2 ? C.black : C.haz));
  B.p(0, collar);
  B.g(1, cyl(0.6, 0.6, 0.045, 8, { y: 0.42, ry: O8, color: C.amber }));
  B.p(1, cyl(0.38, 0.48, 0.5, 8, { y: 0.66, ry: O8, color: C.gun }));
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2; B.p(1, box(0.08, 0.44, 0.12, { x: Math.sin(a) * 0.43, y: 0.66, z: Math.cos(a) * 0.43, ry: a, color: C.steel })); }
  B.p(1, cyl(0.5, 0.5, 0.08, 8, { y: 0.95, ry: O8, color: C.dark }));
  B.g(1, cyl(0.51, 0.51, 0.03, 8, { y: 0.95, ry: O8, color: C.pink }));
  const base = B.build();
  // the head (y 0 = its pivot): a truncated pyramid housing, cheek armour, slit sensor, mantlet
  const H = new EKit();
  H.p(2, part(new THREE.CylinderGeometry(0.4, 0.56, 0.4, 4), { y: 0.24, ry: Math.PI / 4, sz: 1.08, color: C.armor }));
  H.p(2, part(new THREE.CylinderGeometry(0.3, 0.4, 0.1, 4), { y: 0.49, ry: Math.PI / 4, sz: 1.08, color: C.armor2 }));
  H.p(2, box(0.66, 0.07, 0.6, { y: 0.06, color: C.gun }));
  for (const sx of [-1, 1]) {
    H.p(2, box(0.08, 0.34, 0.62, { x: sx * 0.44, y: 0.24, rz: sx * 0.18, color: C.gun }));
    H.g(2, box(0.09, 0.26, 0.035, { x: sx * 0.445, y: 0.25, z: -0.3, rz: sx * 0.18, color: C.pink }));
  }
  H.p(2, box(0.44, 0.14, 0.08, { y: 0.44, z: -0.34, rx: -0.35, color: C.black })); // visor frame
  H.s(2, box(0.36, 0.065, 0.04, { y: 0.44, z: -0.385, rx: -0.35 }));
  for (const sx of [-1, 1]) H.p(2, box(0.08, 0.06, 0.66, { x: sx * 0.15, y: 0.55, color: C.haz }));
  H.p(2, box(0.5, 0.28, 0.16, { y: TURRET.gunY, z: -0.34, color: C.dark })); // mantlet
  H.p(2, cyl(0.015, 0.015, 0.3, 4, { x: -0.22, y: 0.66, z: 0.2, color: C.gun }));
  H.s(2, box(0.045, 0.045, 0.045, { x: -0.22, y: 0.82, z: 0.2 }));
  const head = H.build();
  // a barrel (y 0, z 0 = the trunnion): shroud with vents, barrel, muzzle brake, a pink coil
  const K = new EKit();
  K.p(0, cyl(0.06, 0.06, 0.66, 8, { z: -0.5, rx: R2, color: C.dark }));
  K.p(0, cyl(0.1, 0.1, 0.34, 8, { z: -0.16, rx: R2, color: C.gun }));
  for (const z of [-0.1, -0.2]) K.p(0, cyl(0.105, 0.105, 0.03, 8, { z, rx: R2, color: C.black }));
  K.p(0, cyl(0.085, 0.085, 0.1, 8, { z: -0.79, rx: R2, color: C.steel }));
  K.g(0, cyl(0.072, 0.072, 0.04, 8, { z: -0.52, rx: R2, color: C.pink }));
  K.p(0, box(0.03, 0.03, 0.2, { y: 0.1, z: -0.2, color: C.steel })); // ram
  const barrel = K.build();
  return { base, head, barrel };
}
export function turretModel() {
  const D = cached('turret', turretParts);
  const g = shell('turret'), mat = g.userData.mat;
  mount(g, g, D.base, mat, 'base');
  const head = new THREE.Group(); head.name = 'headG'; head.position.y = TURRET.headY; g.add(head);
  mount(g, head, D.head, mat, 'head');
  const gun = new THREE.Group(); gun.name = 'gun'; gun.position.set(0, TURRET.gunY, TURRET.gunZ); head.add(gun);
  const barrels = [-1, 1].map((sx) => {
    const m = mount(g, gun, D.barrel, mat, sx < 0 ? 'barrelL' : 'barrelR');
    m.position.x = sx * TURRET.barrelX;
    return m;
  });
  g.userData.parts = { head, gun, barrels };
  return g;
}
