// AIR FORTRESS backdrops: render-only scenery (the sim never sees it).
//   near (fogged like the level, built with the renderer's materials M): the lift fans and turbines
//   turning, the radar, the carrier's own wings and engines stretching away, the deck far below
//   far (unfogged, hazed toward the horizon, B's materials): sister carriers, escort formations,
//   gunships circling, towering cumulus
// A few of them move: a mesh's onBeforeRender turns its pivot (render time only, never the sim's).
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from '../geo.js';
import { seg } from '../retro.js';
import { C } from './fortress-styles.js';

const now = () => performance.now() / 1000;
// Call fn(t) once a frame (from the first mesh under g, just before it's drawn).
function animate(g, fn) {
  let mesh = null;
  g.traverse((m) => { if (!mesh && m.isMesh) mesh = m; });
  if (mesh) mesh.onBeforeRender = () => fn(now());
}
// Merge a kit into meshes with the level's (fogged) materials.
function meshes(K, M, parent) {
  for (const [key, geo] of Object.entries(K.build())) if (geo) parent.add(new THREE.Mesh(geo, key === 'glow' ? M.glow : key === 'glass' ? M.glass : M.paintFlat));
  return parent;
}

// ------------------------------------------------------------------ things that turn
// A lift fan under its grille: o.r blade radius, spinning about y.
function fan(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit(), r = o.r ?? 7.5, n = 9;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; K.add('p', box(1.5, 0.12, r - 1.2, { x: Math.cos(a) * (r / 2 + 0.5), z: Math.sin(a) * (r / 2 + 0.5), ry: -a + Math.PI / 2, rz: 0.45, color: 0xaab2bd })); }
  K.add('p', cyl(1.4, 1.6, 0.6, 10, { color: 0x3a3f48 }), cyl(0.5, 0.5, 0.2, 8, { y: 0.35, color: C.yellow }));
  meshes(K, M, pivot); g.add(pivot);
  animate(g, (t) => { pivot.rotation.y = t * 3.2; });
  return g;
}
// An engine's intake fan, facing north (−z), spinning about z.
function turbine(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit(), r = o.r ?? 4.3, n = 16;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; K.add('p', box(0.7, r - 0.6, 0.08, { x: Math.cos(a) * (r / 2 + 0.3), y: Math.sin(a) * (r / 2 + 0.3), rz: a - Math.PI / 2, ry: 0.5, color: 0xc0c6d0 })); }
  K.add('p', part(new THREE.ConeGeometry(1.1, 1.8, 10), { z: -0.6, rx: -Math.PI / 2, color: 0xd8dce4 }), part(new THREE.CircleGeometry(0.5, 8), { z: -1.52, ry: Math.PI, color: 0x1c1f26 }));
  meshes(K, M, pivot); g.add(pivot);
  animate(g, (t) => { pivot.rotation.z = t * 7; });
  return g;
}
// The lift fan's big rotor under its hub (spinning about y).
function rotor(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit(), r = o.r ?? 8;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; K.add('p', box(1.1, 0.14, r, { x: Math.cos(a) * r / 2, z: Math.sin(a) * r / 2, ry: -a + Math.PI / 2, rz: 0.3, color: 0x8a93a0 })); K.add('g', box(0.5, 0.16, 0.5, { x: Math.cos(a) * (r - 0.3), z: Math.sin(a) * (r - 0.3), color: C.cyan })); }
  const k = K.build(); pivot.add(new THREE.Mesh(k.p, M.paintFlat), new THREE.Mesh(k.g, M.glow)); g.add(pivot);
  animate(g, (t) => { pivot.rotation.y = -t * 4.5; });
  return g;
}
// The island's radar: a dish on a yoke, sweeping round.
function radar(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit();
  K.add('p', cyl(0.25, 0.3, 1.4, 6, { y: -0.7, color: 0x6b7480 }), box(3.2, 0.25, 0.4, { color: 0x6b7480 }));
  K.add('p', part(new THREE.CylinderGeometry(2.6, 0.5, 0.9, seg(14, 8), 1, true), { y: 0.6, z: -0.3, rx: -1.3, color: 0xe0e4ea }));
  K.add('p', part(new THREE.CylinderGeometry(2.6, 0.5, 0.9, seg(14, 8), 1, true), { y: 0.6, z: -0.3, rx: -1.3, sx: -1, color: 0x9aa2ae }));
  K.add('p', box(0.12, 0.12, 2.4, { y: 0.9, z: -1.4, color: 0x3a3f48 }));
  meshes(K, M, pivot); g.add(pivot);
  const L = new Kit(); L.add('glow', box(0.3, 0.3, 0.3, { y: 2.4, color: C.navRed })); meshes(L, M, g);
  animate(g, (t) => { pivot.rotation.y = t * 1.3; });
  g.scale.setScalar(o.s || 1);
  return g;
}

// ------------------------------------------------------------------ escorts (far, hazed)
function gunshipKit(B, K) {
  const hull = B.c('#5c6573'), dk = B.c('#2c3038'), vio = B.c('#b45bff', -0.3);
  K.add('solid', B.box(3.4, 3.0, 16, { color: hull }), B.box(2.6, 1.6, 4, { y: 1.2, z: -6, color: dk }));
  K.add('solid', B.part(new THREE.ConeGeometry(1.7, 4, 4), { z: -9.8, rx: -Math.PI / 2, ry: Math.PI / 4, color: hull }));
  K.add('solid', B.box(16, 0.5, 3.4, { y: 0.6, z: 1, color: hull }), B.box(0.5, 4, 3, { y: 2.6, z: 7, color: hull }), B.box(7, 0.4, 2, { y: 1, z: 7.5, color: hull }));
  K.add('solid', B.box(16.2, 0.52, 0.6, { y: 0.62, z: -0.3, color: vio }));
  for (const sx of [-1, 1]) {
    K.add('solid', B.cyl(1.3, 1.3, 5, 8, { x: sx * 8, y: 0.6, z: 1, rx: Math.PI / 2, color: dk }));
    K.add('glow', B.cyl(1.0, 1.0, 0.3, 8, { x: sx * 8, y: 0.6, z: 3.6, rx: Math.PI / 2, color: '#7fe8ff' }));
    K.add('glow', B.box(0.5, 0.5, 0.5, { x: sx * 8.4, y: 0.9, z: -1.2, color: sx < 0 ? '#ff3a3a' : '#3aff6a' }));
  }
  K.add('glow', B.box(0.4, 0.4, 0.4, { y: 4.7, z: 7, color: '#ffffff' }));
}
// A gunship circling (o.x, o.y, o.z) at radius o.r, a lap every o.period s (o.dir −1: the other way).
function gunship(o, th, B) {
  const g = new THREE.Group(), ship = new THREE.Group(), K = new B.Kit();
  gunshipKit(B, K);
  ship.add(B.mesh(K));
  const dir = o.dir || 1, r = o.r ?? 200, per = o.period ?? 60, ph = (o.phase || 0) * Math.PI * 2;
  ship.position.x = r; ship.rotation.y = dir > 0 ? 0 : Math.PI; ship.rotation.z = dir * 0.28;
  ship.scale.setScalar(o.ss || 1.4);
  g.add(ship);
  animate(g, (t) => { g.rotation.y = ph + dir * (t / per) * Math.PI * 2; ship.position.y = Math.sin(t * 0.6 + ph) * 3; });
  return g;
}
// A V of five escort fighters.
function escorts(o, th, B) {
  const K = new B.Kit(), hull = B.c('#7a8494'), dk = B.c('#353b46');
  for (const [x, y, z] of [[0, 0, 0], [-22, -3, 18], [22, -3, 18], [-44, -6, 36], [44, -6, 36]]) {
    K.add('solid', B.box(2.2, 1.6, 14, { x, y, z, color: hull }));
    K.add('solid', B.part(new THREE.ConeGeometry(1.1, 4, 4), { x, y, z: z - 9, rx: -Math.PI / 2, ry: Math.PI / 4, color: hull }));
    for (const sx of [-1, 1]) K.add('solid', B.box(7, 0.3, 4, { x: x + sx * 3.8, y, z: z + 2, ry: sx * 0.55, color: dk }), B.box(0.3, 2.4, 2.2, { x: x + sx * 0.8, y: y + 1.6, z: z + 5.5, rz: sx * 0.3, color: dk }));
    K.add('glow', B.cyl(0.7, 0.7, 0.4, 8, { x, y, z: z + 7.2, rx: Math.PI / 2, color: '#9ff0ff' }));
  }
  return B.mesh(K);
}
// A sister air fortress: a vast flying wing with a flight deck and an island, engines aglow.
function carrier(o, th, B) {
  const K = new B.Kit(), hull = B.c('#4f5764'), top = B.c('#646c78'), dk = B.c('#2c3038');
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { // stepped, swept wing segments
    const x = sx * (40 + k * 34), w = 34, chord = 150 - k * 30, z = 10 + k * 22;
    K.add('solid', B.box(w, 14 - k * 2.5, chord, { x, z, color: hull }));
    K.add('solid', B.box(w + 0.2, 0.4, chord * 0.98, { x, y: 7 - k * 1.25, z, color: top }));
    for (let e = 0; e < 2; e++) K.add('glow', B.box(6, 3, 0.5, { x: x + (e - 0.5) * 14, y: -2, z: z + chord / 2 + 0.3, color: '#ffb070' }));
  }
  K.add('solid', B.box(64, 26, 220, { y: 4, color: hull }), B.box(56, 0.6, 210, { y: 17.3, color: top }));
  K.add('solid', B.box(10, 24, 30, { x: 22, y: 30, z: -10, color: B.c('#737d8b') }), B.box(10.4, 3, 30.4, { x: 22, y: 38, z: -10, color: dk }));
  for (let z = -100; z < 100; z += 12) K.add('glow', B.box(0.8, 0.6, 0.8, { x: -27, y: 18, z, color: '#ffd08a' }), B.box(0.8, 0.6, 0.8, { x: 27, y: 18, z, color: '#ffd08a' }));
  K.add('glow', B.box(3, 3, 3, { x: -175, y: 4, z: 76, color: '#ff3a3a' }), B.box(3, 3, 3, { x: 175, y: 4, z: 76, color: '#3aff6a' }));
  return B.mesh(K);
}
// A towering cumulus rising out of the cloud sea (theme cloud colours: pink at dusk, slate at night).
function cumulus(o, th, B) {
  const K = new B.Kit(), lo = new THREE.Color(th.cloudShade || '#c8d0e0'), hi = new THREE.Color(th.cloud || '#ffffff'), c = new THREE.Color();
  const rng = B.rng;
  for (let i = 0; i < 26; i++) {
    const k = i / 26, y = k * 150, spread = 70 * (1 - k * 0.6), r = 26 + rng() * 22 - k * 10;
    const a = rng() * Math.PI * 2, d = rng() * spread;
    c.copy(lo).lerp(hi, Math.min(1, k * 1.4 + 0.15));
    K.add('solid', B.ball(r, { x: Math.cos(a) * d, y, z: Math.sin(a) * d, color: B.c('#' + c.getHexString(), -0.2) }, 1));
  }
  return B.mesh(K);
}

// ------------------------------------------------------------------ the carrier itself (near, fogged)
// A wing stretching out from the hull at (x, y, z) toward o.side (−1 port, +1 starboard): stepped
// taper, engines slung under it, a nav light at the tip.
function wing(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), s = o.side || 1;
  for (let k = 0; k < 5; k++) {
    const x = s * (36 + k * 72), chord = 210 - k * 34, z = k * 26, t = 16 - k * 2.4;
    K.add('p', box(72, t, chord, { x, z, color: 0x4f5764 }), box(72.2, 0.4, chord - 2, { x, y: t / 2, z, color: 0x646c78 }));
    K.add('p', box(72.4, 1.2, 3, { x, y: t / 2 - 0.8, z: z - chord / 2 + 1.5, color: C.yellow }));
    K.add('glow', box(4, 0.6, chord - 20, { x: x - s * 30, y: t / 2 + 0.4, z, color: 0xffd08a }));
    if (k < 4) for (const e of [-1, 1]) { // engines under the wing, exhausts at the trailing edge
      const ex = x + e * 18, ez = z + 10;
      K.add('p', box(12, 10, 44, { x: ex, y: -t / 2 - 7, z: ez, color: 0x59616d }), box(3, 6, 30, { x: ex, y: -t / 2 - 2, z: ez, color: 0x4b525d }));
      K.add('glow', box(9, 7, 0.4, { x: ex, y: -t / 2 - 7, z: ez + 22.3, color: 0xff8a3a }));
    }
  }
  K.add('glow', box(4, 4, 4, { x: s * 390, z: 104, color: s < 0 ? 0xff3a3a : 0x3aff6a }));
  meshes(K, M, g);
  return g;
}
// Stage 2: the wing carrying on beyond the stage's own slab (tucked 0.3 m inside it where they meet).
function wingfar(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), len = o.len ?? 520;
  // local origin = (o.x, o.y, o.z); the stage slab spans x 0 … 132, y 0 … 20, z −110 … 110 here
  K.add('p', box(len + 131.7, 19.4, 720, { x: (131.7 - len) / 2, y: 10, z: 0, color: 0x4b525e }));
  for (let x = -len + 20; x < 120; x += 44) K.add('glow', box(0.6, 0.14, 700, { x, y: 0.22, color: 0xffd08a }));
  for (let z = -340; z < 340; z += 36) K.add('glow', box(len, 0.14, 0.5, { x: -len / 2, y: 0.22, z, color: 0xffd08a }));
  for (const z of [-200, 180]) for (const x of [-140, -300]) { // more engines along the span
    K.add('p', box(12, 10, 40, { x, y: -12, z, color: 0x59616d }), box(3, 16, 28, { x, y: -4, z, color: 0x4f5764 }));
    K.add('glow', box(9, 7, 0.4, { x, y: -12, z: z + 20.3, color: 0xff8a3a }));
  }
  meshes(K, M, g);
  return g;
}
// Another engine nacelle hanging under the stage's wing (its pylon reaches up to the belly at 30).
function nacelle(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), py = 30 - (o.y || 0) - 10;
  K.add('p', box(12, 10, 40, { y: 5, color: 0x59616d }), box(12.3, 1.2, 39, { y: 5.5, color: 0x464d58 }));
  K.add('p', box(3, py, 28, { y: 10 + py / 2, color: 0x4f5764 }));
  K.add('p', part(new THREE.TorusGeometry(4.3, 0.35, 3, 16), { y: 5, z: -20.2, color: 0xc8ccd4 }), part(new THREE.CircleGeometry(4.2, 16), { y: 5, z: -20.1, ry: Math.PI, color: 0x15171c }));
  K.add('glow', part(new THREE.CircleGeometry(3.4, 12), { y: 5, z: 20.4, color: 0xff8a3a }));
  for (let z = -17; z < 20; z += 6) K.add('glow', box(0.12, 0.3, 0.6, { x: 6.2, y: 4.5, z, color: C.amber }), box(0.12, 0.3, 0.6, { x: -6.2, y: 4.5, z, color: C.amber }));
  meshes(K, M, g);
  return g;
}
// The boss stage: the carrier's flight deck 46 m under the bridge tower, stretching away fore and aft.
function deckbelow(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), x0 = -56, x1 = 32, z0 = -230, z1 = 170, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, D = z1 - z0;
  K.add('p', box(W, 6, D, { x: cx, y: -3, z: cz, color: 0x4a5059 }), box(W - 16, 40, D - 20, { x: cx, y: -26, z: cz, color: 0x4f5764 }));
  K.add('p', box(0.6, 0.1, D, { x: -28, y: 0.05, z: cz, color: C.white }), box(0.6, 0.1, D, { x: -4, y: 0.05, z: cz, color: C.white }));
  for (let z = z0 + 8; z < z1; z += 10) K.add('p', box(0.8, 0.1, 5, { x: -16, y: 0.05, z, color: C.white }));
  for (const sx of [x0, x1]) for (let z = z0 + 2; z < z1; z += 8) K.add('glow', box(0.5, 0.3, 0.5, { x: sx + (sx < 0 ? 0.6 : -0.6), y: 0.2, z, color: C.amber }));
  for (const [x, z] of [[-34, -120], [-34, 110]]) { // lift-fan rings
    K.add('p', part(new THREE.TorusGeometry(8.6, 0.7, 3, 20), { x, y: 0.6, z, rx: Math.PI / 2, color: 0x6b7480 }), part(new THREE.CircleGeometry(7.9, 16), { x, y: 0.05, z, rx: -Math.PI / 2, color: 0x23262c }));
    K.add('glow', part(new THREE.RingGeometry(4, 4.6, 16), { x, y: 0.08, z, rx: -Math.PI / 2, color: 0xff7a2a }));
  }
  for (const [x, z, a] of [[-44, -60, 0.5], [-44, -36, 0.5], [-44, 50, -0.4], [8, -150, 2.6], [12, 120, 2.2], [-12, -190, 0]]) { // parked VTOLs
    K.add('p', box(2.6, 2.2, 12, { x, y: 1.8, z, ry: a, color: 0x8a93a0 }), box(13, 0.4, 3.6, { x, y: 2.2, z, ry: a, color: 0x8a93a0 }), box(0.3, 2, 1.8, { x, y: 3.4, z: z + 5, ry: a, color: 0x5e6774 }));
  }
  for (const [x, z] of [[-8, -100], [-30, 20], [20, 60]]) K.add('p', box(2.4, 1.6, 4.2, { x, y: 0.8, z, color: C.yellow }));
  meshes(K, M, g);
  return g;
}

export const BACKDROPS = {
  'fortress-fan': fan, 'fortress-turbine': turbine, 'fortress-rotor': rotor, 'fortress-radar': radar,
  'fortress-gunship': gunship, 'fortress-escorts': escorts, 'fortress-carrier': carrier, 'fortress-cumulus': cumulus,
  'fortress-wing': wing, 'fortress-wingfar': wingfar, 'fortress-nacelle': nacelle, 'fortress-deckbelow': deckbelow,
};
