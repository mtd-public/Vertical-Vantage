// Night kit shared by the NEW SAN FRANCISCO and SEATTLE render modules (render-only).
//   styles:    LED edge strips round walkable tops (so footing reads in the dark), rows of lights,
//              lit window grids, light pools, hue ramps for iridescent neon
//   backdrops: blinking aviation beacons, sweeping searchlight / lighthouse beams, lit hills
// Style helpers build into a Kit with H (level-view's helper bag); backdrop builders take (o, th, B).
// Animated pieces (beacons, beams) own their materials (userData.own, so the level disposes them) and
// move in onBeforeRender, so the level stays a few merged meshes.
import * as THREE from 'three';

const _c = new THREE.Color(), _d = new THREE.Color();

// ------------------------------------------------------------------ style helpers
// An LED strip round the top edge of a w × d footprint, just under the lip and proud of the faces.
export function edgeRect(K, H, w, d, color, o = {}) {
  const y = o.y ?? -0.1, t = o.t ?? 0.1, out = o.out ?? 0.05, key = o.key ?? 'neon';
  const F = H.faces(w, d);
  for (const i of o.faces || [0, 1, 2, 3]) {
    const f = F[i];
    K.add(key, H.box(f.tx ? f.width + 2 * out : t, t, f.tz ? f.width + 2 * out : t, { x: f.nx * (f.half + out - t / 2), y, z: f.nz * (f.half + out - t / 2), color }));
  }
}
// The same round a disc (a thin ring just under the rim).
export function edgeDisc(K, H, r, color, o = {}) {
  K.add(o.key ?? 'neon', H.part(new THREE.TorusGeometry(r + (o.out ?? 0.04), o.t ?? 0.07, 3, H.seg(o.n ?? 28, Math.max(10, (o.n ?? 28) >> 1))), { rx: Math.PI / 2, y: o.y ?? -0.1, color }));
}
// A row of n little lights from a to b ([x, y, z]); size s; every light the same colour or cols[i % len].
export function dots(K, H, a, b, n, s, color, key = 'glow') {
  const cols = Array.isArray(color) ? color : [color];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    K.add(key, H.box(s, s, s, { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, z: a[2] + (b[2] - a[2]) * t, color: cols[i % cols.length] }));
  }
}
// A flat panel (one quad) on face f (from H.faces), `off` along the face, centred at height y, `out`
// proud of it: lit windows, signs, light strips that only need to be seen from outside.
export function quad(K, H, key, f, off, y, w, h, color, out = 0.03) {
  K.add(key, H.part(new THREE.PlaneGeometry(w, h), { x: f.nx * (f.half + out) + f.tx * off, y, z: f.nz * (f.half + out) + f.tz * off, ry: f.ry, color }));
}
// A grid of lit windows on face f between heights y0 and y1 (local), some dark.
//   o.cols / o.rows (or o.bay / o.floor spacing), o.ww × o.wh window size, o.lit (0..1), o.palette
export const WARM = [0xffd890, 0xffe6b8, 0xffc070, 0xfff0d0];
export function windowGrid(K, H, f, y0, y1, rng, o = {}) {
  const bay = o.bay ?? 2.2, floor = o.floor ?? 3.2, ww = o.ww ?? 1.0, wh = o.wh ?? 1.4, lit = o.lit ?? 0.55, pal = o.palette || WARM, out = o.out ?? 0.03;
  const nc = o.cols ?? Math.max(1, Math.floor((f.width - 0.6) / bay)), nr = o.rows ?? Math.max(1, Math.floor((y1 - y0) / floor));
  const sx = f.width / nc, sy = (y1 - y0) / nr;
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
    const on = rng() < lit;
    if (!on && !o.dark) continue;
    quad(K, H, on ? 'glow' : 'flat', f, -f.width / 2 + (c + 0.5) * sx, y0 + (r + 0.5) * sy, ww, wh, on ? pal[Math.floor(rng() * pal.length)] : o.dark, out);
  }
}
// A soft pool of light on the ground: an unlit disc a hair above the top, `color` at its centre fading
// to o.rim (a night-ground dark) at its edge, so it reads as light rather than a decal.
export function pool(K, H, x, z, r, color, y = 0.025, rim = 0x1c1a2c) {
  const g = H.part(new THREE.CircleGeometry(r, H.seg(12, 8)), { rx: -Math.PI / 2, x, y, z });
  const c0 = new THREE.Color(color), c1 = new THREE.Color(rim);
  K.add('glow', paint(g, (px, py, pz) => { const k = Math.min(1, Math.sqrt((px - x) * (px - x) + (pz - z) * (pz - z)) / r); return _d.copy(c0).lerp(c1, k).getHex(); }));
}
// A puddle holding the neon: a soft unlit ellipse (rx × rz, turned ry), `color` at its heart fading to
// the wet ground's dark at its edge.
export function puddle(K, H, x, z, rx, rz, ry, color, y = 0.022, rim = 0x16202a) {
  const g = H.part(new THREE.CircleGeometry(1, H.seg(14, 9)), { rx: -Math.PI / 2 });
  const c0 = new THREE.Color(color), c1 = new THREE.Color(rim);
  paint(g, (px, py, pz) => _d.copy(c0).lerp(c1, Math.min(1, Math.sqrt(px * px + pz * pz))).getHex());
  g.scale(rx, 1, rz); g.rotateY(ry); g.translate(x, y, z);
  K.add('glow', g);
}
// Hue ramp for iridescent neon: t in 0..1 round magenta → violet → cyan → green → gold → magenta.
const IRI = [0xff3ad8, 0x9a5bff, 0x2be8ff, 0x3aff9a, 0xffd23a, 0xff3ad8];
export function iri(t) {
  t = ((t % 1) + 1) % 1;
  const k = t * (IRI.length - 1), i = Math.floor(k);
  return _c.set(IRI[i]).lerp(_d.set(IRI[i + 1]), k - i).getHex();
}
// Recolour a prepped geometry's vertices with fn(x, y, z) → hex.
export function paint(g, fn) {
  const pos = g.attributes.position, col = g.attributes.color;
  for (let i = 0; i < pos.count; i++) { _c.set(fn(pos.getX(i), pos.getY(i), pos.getZ(i))); col.setXYZ(i, _c.r, _c.g, _c.b); }
  col.needsUpdate = true;
  return g;
}

// ------------------------------------------------------------------ backdrops
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
function ownBasic(o = {}) {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, ...o });
  m.userData.own = true;
  return m;
}

// Blinking aviation beacons: o.pts = [[x, y, z], …] (backdrop units, before o.s), o.size, o.color,
// o.rate (blinks a second), o.phase. Two groups blink in turn (o.alt: every other light).
export function beacons(o, th, B) {
  const g = new THREE.Group(), size = o.size ?? 3, rate = o.rate ?? 0.75;
  for (let k = 0; k < (o.alt ? 2 : 1); k++) {
    const K = new B.Kit();
    o.pts.forEach((p, i) => { if (!o.alt || i % 2 === k) K.add('glow', B.box(size, size, size, { x: p[0], y: p[1], z: p[2], color: o.color || '#ff2a1a' })); });
    const geo = K.build().glow;
    if (!geo) continue;
    const mat = ownBasic(), m = new THREE.Mesh(geo, mat), ph = (o.phase ?? 0) + k * 0.5;
    m.onBeforeRender = () => { const f = (now() * rate + ph) % 1; mat.color.setScalar(f < 0.35 ? 1 : 0.1); };
    g.add(m);
  }
  return g;
}

// Searchlight beams: additive cones from o.pts that sweep. o.len, o.r (mouth radius), o.color,
// o.tilt (from vertical), o.speed, o.mode 'sweep' (lean and swing, from a city) | 'spin' (a
// lighthouse: flat, turning round the vertical).
export function searchlights(o, th, B) {
  const g = new THREE.Group(), len = o.len ?? 260, r = o.r ?? 14;
  const geo = new THREE.CylinderGeometry(r, 0.6, len, B.seg(10, 8), 1, true);
  geo.translate(0, len / 2, 0);
  const cols = geo.attributes.position.count, col = new Float32Array(cols * 3), base = new THREE.Color(o.color || '#c8d8ff');
  for (let i = 0; i < cols; i++) { const k = 1 - geo.attributes.position.getY(i) / len; col.set([base.r * k, base.g * k, base.b * k], i * 3); }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = ownBasic({ transparent: true, opacity: o.opacity ?? 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const pts = o.pts || [[0, 0, 0]], speed = o.speed ?? 0.35, tilt = o.tilt ?? 0.35;
  pts.forEach((p, i) => {
    const m = new THREE.Mesh(geo, mat), ph = i * 2.3 + (o.phase ?? 0);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    m.onBeforeRender = () => {
      const t = now() * speed + ph;
      if (o.mode === 'spin') e.set(0, t * 2, Math.PI / 2 - 0.05, 'YXZ');
      else e.set(Math.sin(t * 0.7) * tilt * 0.6, t * 0.5 + Math.sin(t) * 0.8, tilt + Math.sin(t * 1.3) * tilt * 0.4, 'YXZ');
      q.setFromEuler(e);
      v.set(p[0], p[1], p[2]).applyMatrix4(m.parent.matrixWorld);
      m4.compose(v, q, one.setScalar(m.parent.matrixWorld.getMaxScaleOnAxis()));
      m.matrixWorld.copy(m4);
    };
    g.add(m);
  });
  return g;
}

// Hills at night: the stock ridge (same shape rules), dark, freckled with lit windows and strung
// with streetlights along their contours. o.len, o.h, o.n, o.color, o.lights (per hill), o.warm.
export function litHills(o, th, B) {
  const K = new B.Kit(), len = o.len ?? 600, n = o.n ?? 7, h = o.h ?? 50, L = o.lights ?? 40;
  const pal = o.palette || ['#ffd890', '#ffc070', '#fff0d0', '#ffb0d8', '#9ff0ff'];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1) - 0.5) * len, rr = len / n * (0.8 + B.rng() * 0.6), hh = h * (0.6 + B.rng() * 0.6);
    K.add('solid', B.part(new THREE.SphereGeometry(1, B.seg(14, 8), B.seg(8, 5), 0, Math.PI * 2, 0, Math.PI / 2), { x, sx: rr, sy: hh, sz: rr * 0.6, color: B.c(o.color || '#2a3040') }));
    for (let j = 0; j < L; j++) { // windows scattered over the dome
      const a = B.rng() * Math.PI * 2, d = Math.sqrt(B.rng()) * 0.92;
      const hx = x + Math.cos(a) * rr * d, hz = Math.sin(a) * rr * 0.6 * d, hy = hh * Math.sqrt(Math.max(0, 1 - d * d));
      K.add('glow', B.box(2.2, 1.6, 2.2, { x: hx, y: hy + 0.6, z: hz, color: pal[Math.floor(B.rng() * pal.length)] }));
    }
    for (const d of [0.45, 0.8]) for (let j = 0; j < 14; j++) { // streetlights strung round two contours
      const a = (j / 14) * Math.PI * 2, hx = x + Math.cos(a) * rr * d, hz = Math.sin(a) * rr * 0.6 * d, hy = hh * Math.sqrt(1 - d * d);
      K.add('glow', B.box(1.6, 1.6, 1.6, { x: hx, y: hy + 1, z: hz, color: o.warm || '#ffb050' }));
    }
  }
  return B.mesh(K);
}
