// AIR FORTRESS backdrops: render-only scenery (the sim never sees it).
//   near (fogged like the level, built with the renderer's materials M): the lift fans and turbines
//   turning, the radar, the carrier's own wings and engines stretching away, the deck far below,
//   searchlights sweeping the night and tracer fire climbing out of the gun tubs
//   far (unfogged, hazed toward the horizon, B's materials): sister carriers, escort formations,
//   gunships circling, towering cumulus, flak bursting, and the city's lights through gaps in the cloud
// A few of them move: a mesh's onBeforeRender turns its pivot (render time only, never the sim's).
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from '../geo.js';
import { seg } from '../retro.js';
import { C, litTop } from './fortress-styles.js';

const now = () => performance.now() / 1000;
// Call fn(t) once a frame (from the first mesh under g, just before it's drawn).
function animate(g, fn) {
  let mesh = null;
  g.traverse((m) => { if (!mesh && m.isMesh) mesh = m; });
  if (mesh) mesh.onBeforeRender = () => fn(now());
}
// Merge a kit into meshes with the level's (fogged) materials.
function meshes(K, M, parent) {
  for (const [key, geo] of Object.entries(K.build())) if (geo) parent.add(new THREE.Mesh(geo, key === 'glow' ? M.glow : key === 'glass' ? M.glass : key === 'deck' ? M.deck : M.paintFlat));
  return parent;
}
// A material this backdrop owns (the level disposes it when it unloads).
const own = (m) => { m.userData.own = true; return m; };
// Additive light (searchlight beams, glows): vertex colours fade it out toward the far end.
const lightMat = () => own(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
// A searchlight beam along −z from the origin: a long open cone, bright at the lamp, gone at the tip.
function beamGeo(len, r, col, k) {
  const g = new THREE.CylinderGeometry(r, 0.5, len, seg(10, 7), 6, true);
  g.translate(0, len / 2, 0);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, cols = new Float32Array(pos.count * 3), c = new THREE.Color(col);
  for (let i = 0; i < pos.count; i++) { const f = Math.pow(Math.max(0, 1 + pos.getZ(i) / len), 1.6) * k; cols[i * 3] = c.r * f; cols[i * 3 + 1] = c.g * f; cols[i * 3 + 2] = c.b * f; }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

// ------------------------------------------------------------------ things that turn
// A lift fan under its grille: o.r blade radius, spinning about y, its hub and blade tips lit.
function fan(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit(), r = o.r ?? 7.5, n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    K.add('p', box(1.5, 0.12, r - 1.2, { x: Math.cos(a) * (r / 2 + 0.5), z: Math.sin(a) * (r / 2 + 0.5), ry: -a + Math.PI / 2, rz: 0.45, color: 0xaab2bd }));
    K.add('glow', box(1.2, 0.14, 0.4, { x: Math.cos(a) * (r - 0.6), z: Math.sin(a) * (r - 0.6), ry: -a + Math.PI / 2, color: 0xffb060 }));
  }
  K.add('p', cyl(1.4, 1.6, 0.6, 10, { color: 0x3a3f48 }), cyl(0.5, 0.5, 0.2, 8, { y: 0.35, color: C.yellow }));
  K.add('glow', part(new THREE.TorusGeometry(1.5, 0.1, 3, 12), { rx: Math.PI / 2, y: 0.3, color: C.cyan }));
  meshes(K, M, pivot); g.add(pivot);
  animate(g, (t) => { pivot.rotation.y = t * 3.2; });
  return g;
}
// An engine's intake fan, facing north (−z), spinning about z.
function turbine(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit(), r = o.r ?? 4.3, n = 16;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; K.add('p', box(0.7, r - 0.6, 0.08, { x: Math.cos(a) * (r / 2 + 0.3), y: Math.sin(a) * (r / 2 + 0.3), rz: a - Math.PI / 2, ry: 0.5, color: 0xc0c6d0 })); }
  K.add('p', part(new THREE.ConeGeometry(1.1, 1.8, 10), { z: -0.6, rx: -Math.PI / 2, color: 0xd8dce4 }), part(new THREE.CircleGeometry(0.5, 8), { z: -1.52, ry: Math.PI, color: 0x1c1f26 }));
  K.add('glow', part(new THREE.TorusGeometry(1.15, 0.08, 3, 12), { z: -0.3, color: C.cyan }));
  meshes(K, M, pivot); g.add(pivot);
  animate(g, (t) => { pivot.rotation.z = t * 7; });
  return g;
}
// The lift fan's big rotor under its hub (spinning about y), its tips lit cyan.
function rotor(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit(), r = o.r ?? 8;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; K.add('p', box(1.1, 0.14, r, { x: Math.cos(a) * r / 2, z: Math.sin(a) * r / 2, ry: -a + Math.PI / 2, rz: 0.3, color: 0x8a93a0 })); K.add('g', box(0.6, 0.18, 1.4, { x: Math.cos(a) * (r - 0.6), z: Math.sin(a) * (r - 0.6), ry: -a + Math.PI / 2, color: C.cyan })); }
  const k = K.build(); pivot.add(new THREE.Mesh(k.p, M.paintFlat), new THREE.Mesh(k.g, M.glow)); g.add(pivot);
  animate(g, (t) => { pivot.rotation.y = -t * 4.5; });
  return g;
}
// The island's radar: a dish on a yoke, sweeping round, a lit scan bar and a beacon.
function radar(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), K = new Kit();
  K.add('p', cyl(0.25, 0.3, 1.4, 6, { y: -0.7, color: 0x6b7480 }), box(3.2, 0.25, 0.4, { color: 0x6b7480 }));
  K.add('p', part(new THREE.CylinderGeometry(2.6, 0.5, 0.9, seg(14, 8), 1, true), { y: 0.6, z: -0.3, rx: -1.3, color: 0xe0e4ea }));
  K.add('p', part(new THREE.CylinderGeometry(2.6, 0.5, 0.9, seg(14, 8), 1, true), { y: 0.6, z: -0.3, rx: -1.3, sx: -1, color: 0x9aa2ae }));
  K.add('p', box(0.12, 0.12, 2.4, { y: 0.9, z: -1.4, color: 0x3a3f48 }));
  K.add('glow', box(4.6, 0.12, 0.12, { y: 1.3, z: 0.2, color: C.cyan }), box(0.3, 0.3, 0.3, { y: 0.9, z: -2.6, color: C.amber }));
  meshes(K, M, pivot); g.add(pivot);
  const L = new Kit(); L.add('glow', box(0.4, 0.4, 0.4, { y: 2.4, color: C.navRed })); meshes(L, M, g);
  animate(g, (t) => { pivot.rotation.y = t * 1.3; });
  g.scale.setScalar(o.s || 1);
  return g;
}

// ------------------------------------------------------------------ the night war (light and fire)
// Searchlights on an emplacement at (x, y, z): o.n beams o.gap apart, o.len long, sweeping ±o.sweep
// round o.yaw (0 = north), raised o.pitch, out of step. o.col tints them.
function searchlights(o, th, B, M) {
  const g = new THREE.Group(), n = o.n ?? 2, len = o.len ?? 240, gap = o.gap ?? 6, mat = lightMat();
  const geo = beamGeo(len, o.r ?? 7, o.col ?? 0xb0c4ff, o.k ?? 0.13), L = new Kit(), beams = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * gap, pv = new THREE.Group();
    pv.rotation.order = 'YXZ'; pv.position.x = x;
    pv.add(new THREE.Mesh(geo, mat)); g.add(pv); beams.push(pv);
    L.add('glow', box(1.6, 1.6, 0.4, { x, color: 0xffffff }));
    L.add('p', cyl(1.1, 1.3, 1.6, 8, { x, y: -1.4, color: 0x2a2e36 }));
  }
  meshes(L, M, g);
  const yaw = o.aim ?? 0, sw = o.sweep ?? 0.6, pitch = o.pitch ?? 0.5, sp = o.speed ?? 0.25, ph = o.phase ?? 0;
  animate(g, (t) => beams.forEach((b, i) => { b.rotation.y = yaw + Math.sin(t * sp + i * 2.1 + ph) * sw; b.rotation.x = pitch + Math.sin(t * sp * 0.63 + i * 1.3 + ph) * 0.18; }));
  return g;
}
// Tracer fire: a stream of glowing rounds climbing out of a gun at (x, y, z) along yaw / pitch, fired
// in bursts, the gun traversing as it tracks. o.col, o.len, o.speed.
function tracers(o, th, B, M) {
  const g = new THREE.Group(), pivot = new THREE.Group(), flow = new THREE.Group(), K = new Kit(), len = o.len ?? 260, sp = o.space ?? 9;
  for (let z = 0; z < len; z += sp) K.add('glow', box(0.45, 0.45, 4, { z: -z, color: o.col ?? 0xffa040 }), box(0.25, 0.25, 1.4, { z: -z - 1.2, color: 0xfff0c0 }));
  const G2 = new Kit(); G2.add('glow', ball(0.9, { color: 0xffd080 })); G2.add('p', cyl(0.7, 0.9, 1.6, 6, { y: -1, color: 0x2a2e36 })); meshes(G2, M, g); // (first: it drives the animation)
  flow.add(new THREE.Mesh(K.build().glow, M.glow));
  pivot.rotation.order = 'YXZ'; pivot.add(flow); g.add(pivot);
  const yaw = o.aim ?? 0, pitch = o.pitch ?? 0.6, speed = o.speed ?? 160, ph = o.phase ?? 0, sw = o.sweep ?? 0.35;
  animate(g, (t) => {
    flow.position.z = -((t * speed) % sp);
    pivot.rotation.y = yaw + Math.sin(t * 0.37 + ph) * sw;
    pivot.rotation.x = pitch + Math.sin(t * 0.53 + ph * 2) * 0.12;
    flow.visible = Math.sin(t * 1.9 + ph * 5) > -0.35; // bursts
  });
  return g;
}
// A field of flak: o.n bursts scattered through o.w × o.h × o.d round (x, y, z). Smoke puffs hang
// there; their flashes go off in staggered salvos.
function flak(o, th, B) {
  const g = new THREE.Group(), n = o.n ?? 22, W = o.w ?? 320, H = o.h ?? 90, D = o.d ?? 320, rng = B.rng;
  const S = new B.Kit(), salvos = [new B.Kit(), new B.Kit(), new B.Kit(), new B.Kit(), new B.Kit()];
  const smoke = B.c('#4a4660', 0.55), smoke2 = B.c('#5a5470', 0.5);
  for (let i = 0; i < n; i++) {
    const x = (rng() - 0.5) * W, y = (rng() - 0.5) * H, z = (rng() - 0.5) * D, r = 3 + rng() * 3;
    S.add('solid', B.ball(r * (0.7 + rng() * 0.4), { x: x + (rng() - 0.5) * r, y: y + (rng() - 0.5) * r * 0.6, z: z + (rng() - 0.5) * r, color: rng() < 0.5 ? smoke : smoke2 }, 0));
    const F = salvos[i % salvos.length];
    F.add('glow', B.ball(r * 1.15, { x, y, z, color: '#ff9a3a' }, 1), B.ball(r * 0.6, { x, y, z, color: '#fff2c0' }, 0));
    for (const [rx, rz] of [[0, 0], [1.2, 0], [0, 1.2]]) F.add('glow', B.box(0.5, r * 3.4, 0.5, { x, y, z, rx, rz, color: '#ffd080' }));
  }
  g.add(B.mesh(S));
  const meshes2 = salvos.map((F) => { const m = B.mesh(F); g.add(m); return m; });
  const per = [1.7, 2.3, 1.3, 2.9, 1.9], ph = o.phase ?? 0;
  animate(g, (t) => meshes2.forEach((m, i) => { m.visible = ((t + ph + i * 0.37) / per[i]) % 1 < 0.09; }));
  return g;
}
// Lights far below through a gap in the cloud sea (lie it on the clouds: y = level.cloudY + 1): a
// dark ragged hole, its rim lit by the city, streets and highways glittering inside. o.r its size,
// o.coast: the sea fills one side (a coastline).
function citygap(o, th, B) {
  const K = new B.Kit(), r = o.r ?? 110, rng = B.rng, n = 16, rim = [];
  for (let i = 0; i < n; i++) rim.push(r * (0.72 + rng() * 0.38));
  const shape = (k, dy = 0) => { const s = new THREE.Shape(); for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, rr = rim[i % n] * k; if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } return new THREE.ShapeGeometry(s); };
  K.add('glow', B.part(shape(1.12), { rx: -Math.PI / 2, y: 0, color: B.c(th.cloudSea || '#8090d0', 0.05) }));
  K.add('glow', B.part(shape(1.0), { rx: -Math.PI / 2, y: 0.3, color: B.c('#3a3448', -0.1) }));
  K.add('glow', B.part(shape(0.9), { rx: -Math.PI / 2, y: 0.6, color: B.c('#06070e', -0.2) }));
  const inner = Math.min(...rim) * 0.82, coast = o.coast ?? 0, cols = ['#ffb050', '#ffb050', '#ffc878', '#fff0d0', '#7ae8ff', '#ff6a5a'];
  const sea = (x, z) => coast && x * Math.cos(coast) + z * Math.sin(coast) > inner * 0.25 + Math.sin(z * 0.05) * 10;
  K.add('glow', B.part(shape(0.7), { rx: -Math.PI / 2, y: 0.7, color: B.c('#1e1428', -0.2) })); // the city's glow on the haze
  for (let x = -inner; x <= inner; x += 9) for (let z = -inner; z <= inner; z += 9) {
    if (x * x + z * z > inner * inner || sea(x, z) || rng() > 0.55) continue;
    const s = 3 + rng() * 4;
    K.add('glow', B.part(new THREE.PlaneGeometry(s, s), { rx: -Math.PI / 2, x: x + (rng() - 0.5) * 4, y: 0.9, z: z + (rng() - 0.5) * 4, color: B.c(cols[Math.floor(rng() * cols.length)], -0.3) }));
  }
  for (let k = 0; k < 3; k++) { // highways: chains of amber light
    const a = rng() * Math.PI, ca = Math.cos(a), sa = Math.sin(a), off = (rng() - 0.5) * inner * 0.6;
    for (let t = -inner; t <= inner; t += 6) {
      const x = ca * t - sa * off, z = sa * t + ca * off;
      if (x * x + z * z > inner * inner || sea(x, z)) continue;
      K.add('glow', B.part(new THREE.PlaneGeometry(5, 2.6), { rx: -Math.PI / 2, rz: -a, x, y: 1, z, color: B.c(k ? '#ffa040' : '#ff5a4a', -0.3) }));
    }
  }
  return B.mesh(K);
}

// ------------------------------------------------------------------ escorts (far, hazed)
function gunshipKit(B, K) {
  const hull = B.c('#4c5463'), dk = B.c('#262a32'), vio = B.c('#b45bff', -0.4);
  K.add('solid', B.box(3.4, 3.0, 16, { color: hull }), B.box(2.6, 1.6, 4, { y: 1.2, z: -6, color: dk }));
  K.add('solid', B.part(new THREE.ConeGeometry(1.7, 4, 4), { z: -9.8, rx: -Math.PI / 2, ry: Math.PI / 4, color: hull }));
  K.add('solid', B.box(16, 0.5, 3.4, { y: 0.6, z: 1, color: hull }), B.box(0.5, 4, 3, { y: 2.6, z: 7, color: hull }), B.box(7, 0.4, 2, { y: 1, z: 7.5, color: hull }));
  K.add('glow', B.box(16.2, 0.3, 0.4, { y: 0.62, z: -0.5, color: vio }));
  K.add('glow', B.box(2.0, 0.6, 1.6, { y: 1.5, z: -6.6, color: '#2bd8c8' })); // the cockpit
  for (let z = -4; z < 6; z += 1.6) for (const sx of [-1, 1]) K.add('glow', B.box(0.1, 0.4, 0.6, { x: sx * 1.72, y: 0.3, z, color: '#ffd8a0' }));
  for (const sx of [-1, 1]) {
    K.add('solid', B.cyl(1.3, 1.3, 5, 8, { x: sx * 8, y: 0.6, z: 1, rx: Math.PI / 2, color: dk }));
    K.add('glow', B.cyl(1.05, 1.05, 0.3, 8, { x: sx * 8, y: 0.6, z: 3.6, rx: Math.PI / 2, color: '#7fe8ff' }), B.cyl(0.5, 0.5, 0.35, 6, { x: sx * 8, y: 0.6, z: 3.65, rx: Math.PI / 2, color: '#ffffff' }));
    K.add('glow', B.box(0.7, 0.7, 0.7, { x: sx * 8.4, y: 0.9, z: -1.2, color: sx < 0 ? '#ff3a3a' : '#3aff6a' }));
  }
  K.add('glow', B.box(0.6, 0.6, 0.6, { y: 4.8, z: 7, color: '#ffffff' }), B.box(0.6, 0.4, 0.6, { y: -1.6, z: 0, color: '#ff3a3a' }));
}
// A gunship circling (o.x, o.y, o.z) at radius o.r, a lap every o.period s (o.dir −1: the other way),
// its belly searchlight raking the clouds.
function gunship(o, th, B) {
  const g = new THREE.Group(), ship = new THREE.Group(), K = new B.Kit();
  gunshipKit(B, K);
  ship.add(B.mesh(K));
  if (o.light !== false) { // the belly searchlight, angled down and ahead
    const beam = new THREE.Mesh(beamGeo(o.beam ?? 60, 5, 0xc8d8ff, 0.09), lightMat());
    beam.position.set(0, -1.6, -2); beam.rotation.x = -0.75; ship.add(beam);
  }
  const dir = o.dir || 1, r = o.r ?? 200, per = o.period ?? 60, ph = (o.phase || 0) * Math.PI * 2;
  ship.position.x = r; ship.rotation.y = dir > 0 ? 0 : Math.PI; ship.rotation.z = dir * 0.28;
  ship.scale.setScalar(o.ss || 1.4);
  g.add(ship);
  animate(g, (t) => { g.rotation.y = ph + dir * (t / per) * Math.PI * 2; ship.position.y = Math.sin(t * 0.6 + ph) * 3; });
  return g;
}
// A V of five escort fighters, afterburners lit, nav lights and strobes.
function escorts(o, th, B) {
  const K = new B.Kit(), hull = B.c('#5a6474'), dk = B.c('#2c313b');
  for (const [x, y, z] of [[0, 0, 0], [-22, -3, 18], [22, -3, 18], [-44, -6, 36], [44, -6, 36]]) {
    K.add('solid', B.box(2.2, 1.6, 14, { x, y, z, color: hull }));
    K.add('solid', B.part(new THREE.ConeGeometry(1.1, 4, 4), { x, y, z: z - 9, rx: -Math.PI / 2, ry: Math.PI / 4, color: hull }));
    for (const sx of [-1, 1]) {
      K.add('solid', B.box(7, 0.3, 4, { x: x + sx * 3.8, y, z: z + 2, ry: sx * 0.55, color: dk }), B.box(0.3, 2.4, 2.2, { x: x + sx * 0.8, y: y + 1.6, z: z + 5.5, rz: sx * 0.3, color: dk }));
      K.add('glow', B.box(0.7, 0.7, 0.7, { x: x + sx * 7, y, z: z + 4, color: sx < 0 ? '#ff3a3a' : '#3aff6a' }));
    }
    K.add('glow', B.cyl(0.8, 0.8, 0.4, 8, { x, y, z: z + 7.2, rx: Math.PI / 2, color: '#9ff0ff' }), B.part(new THREE.ConeGeometry(0.7, 5, 6), { x, y, z: z + 9.8, rx: Math.PI / 2, color: '#4ab8ff' }));
    K.add('glow', B.box(1.0, 0.4, 1.6, { x, y: y + 0.9, z: z - 4, color: '#2bd8c8' }));
  }
  return B.mesh(K);
}
// A sister air fortress: a vast flying wing with a flight deck and an island, lit up for the night:
// runway lights, rows of ports, engines aglow, navigation lights.
function carrier(o, th, B) {
  const K = new B.Kit(), hull = B.c('#3e4552'), top = B.c('#4e5664'), dk = B.c('#22262e'), rng = B.rng;
  const port = B.c('#ffd8a0', -0.3), cyan = B.c('#7ae8ff', -0.3);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { // stepped, swept wing segments
    const x = sx * (40 + k * 34), w = 34, chord = 150 - k * 30, z = 10 + k * 22, t = 14 - k * 2.5;
    K.add('solid', B.box(w, t, chord, { x, z, color: hull }));
    K.add('solid', B.box(w + 0.2, 0.4, chord * 0.98, { x, y: t / 2, z, color: top }));
    K.add('glow', B.box(w, 0.8, 0.8, { x, y: t / 2 - 1, z: z - chord / 2, color: B.c('#b45bff', -0.3) }));
    for (let e = 0; e < 2; e++) K.add('glow', B.box(6, 3, 0.5, { x: x + (e - 0.5) * 14, y: -2, z: z + chord / 2 + 0.3, color: B.c('#5fd8ff', -0.4) }), B.box(3, 1.4, 0.6, { x: x + (e - 0.5) * 14, y: -2, z: z + chord / 2 + 0.4, color: '#ffffff' }));
    for (let zz = z - chord / 2 + 6; zz < z + chord / 2; zz += 7) if (rng() < 0.75) K.add('glow', B.box(1.2, 1.2, 2.4, { x: x + sx * (w / 2 + 0.1), y: -1, z: zz, color: rng() < 0.7 ? port : cyan }));
  }
  K.add('solid', B.box(64, 26, 220, { y: 4, color: hull }), B.box(56, 0.6, 210, { y: 17.3, color: top }));
  for (const sx of [-1, 1]) for (const y of [-2, 4, 10]) for (let z = -104; z < 104; z += 4.5) if (rng() < 0.7) K.add('glow', B.box(0.6, 1.1, 2, { x: sx * 32.2, y, z, color: rng() < 0.75 ? port : cyan }));
  K.add('solid', B.box(10, 24, 30, { x: 22, y: 30, z: -10, color: B.c('#5a6472') }), B.box(10.4, 3, 30.4, { x: 22, y: 38, z: -10, color: dk }));
  for (const y of [22, 26, 30, 34]) for (let z = -23; z < 4; z += 2.5) if (rng() < 0.8) K.add('glow', B.box(10.6, 1, 1.4, { x: 22, y, z, color: rng() < 0.6 ? port : cyan }));
  for (let z = -100; z < 100; z += 8) K.add('glow', B.box(1.2, 0.8, 1.2, { x: -27, y: 18, z, color: '#ffd08a' }), B.box(1.2, 0.8, 1.2, { x: 27, y: 18, z, color: '#ffd08a' }), B.box(0.8, 0.6, 2.4, { x: 0, y: 17.8, z: z + 4, color: '#ffffff' }));
  K.add('glow', B.box(5, 5, 5, { x: -175, y: 4, z: 76, color: '#ff3a3a' }), B.box(5, 5, 5, { x: 175, y: 4, z: 76, color: '#3aff6a' }), B.box(3, 3, 3, { x: 22, y: 44, z: -10, color: '#ff3a3a' }));
  return B.mesh(K);
}
// A towering cumulus rising out of the cloud sea, moonlit on top (theme cloud colours).
function cumulus(o, th, B) {
  const K = new B.Kit(), lo = new THREE.Color(th.cloudShade || '#c8d0e0'), hi = new THREE.Color(th.cloudSea || th.cloud || '#ffffff'), c = new THREE.Color();
  const rng = B.rng;
  for (let i = 0; i < 26; i++) {
    const k = i / 26, y = k * 150, spread = 70 * (1 - k * 0.6), r = 26 + rng() * 22 - k * 10;
    const a = rng() * Math.PI * 2, d = rng() * spread;
    c.copy(lo).lerp(hi, Math.min(1, k * 1.2 + 0.1));
    K.add('solid', B.ball(r, { x: Math.cos(a) * d, y, z: Math.sin(a) * d, color: B.c('#' + c.getHexString(), -0.2) }, 1));
  }
  return B.mesh(K);
}

// ------------------------------------------------------------------ the carrier itself (near, fogged)
// A wing stretching out from the hull at (x, y, z) toward o.side (−1 port, +1 starboard): stepped
// taper, engines slung under it glowing hot, rows of lit ports, a nav light at the tip.
function wing(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), s = o.side || 1;
  for (let k = 0; k < 5; k++) {
    const x = s * (36 + k * 72), chord = 210 - k * 34, z = k * 26, t = 16 - k * 2.4;
    K.add('p', box(72, t, chord, { x, z, color: 0x434a57 }), box(72.2, 0.4, chord - 2, { x, y: t / 2, z, color: 0x58606e }));
    K.add('p', box(72.4, 1.2, 3, { x, y: t / 2 - 0.8, z: z - chord / 2 + 1.5, color: C.yellow }));
    K.add('glow', box(72.4, 0.5, 0.6, { x, y: -t / 2 + 1, z: z - chord / 2 - 0.1, color: C.violet }));
    K.add('glow', box(4, 0.6, chord - 20, { x: x - s * 30, y: t / 2 + 0.4, z, color: 0xffd08a }));
    for (let zz = z - chord / 2 + 10; zz < z + chord / 2 - 6; zz += 6) K.add('glow', box(0.8, 0.4, 0.8, { x: x + s * 30, y: t / 2 + 0.3, z: zz, color: (zz / 6) % 2 ? C.amber : 0xffffff }));
    for (let xx = x - 32; xx < x + 32; xx += 4) K.add('glow', box(1.4, 0.8, 0.2, { x: xx, y: 0, z: z - chord / 2 - 0.1, color: ((xx * 7) | 0) % 5 ? C.port : 0x8ad8ff }));
    if (k < 4) for (const e of [-1, 1]) { // engines under the wing, exhausts glowing at the trailing edge
      const ex = x + e * 18, ez = z + 10;
      K.add('p', box(12, 10, 44, { x: ex, y: -t / 2 - 7, z: ez, color: 0x4b525e }), box(3, 6, 30, { x: ex, y: -t / 2 - 2, z: ez, color: 0x3f4550 }));
      K.add('glow', box(9, 7, 0.4, { x: ex, y: -t / 2 - 7, z: ez + 22.3, color: 0x3ac8ff }), box(5, 3.6, 0.5, { x: ex, y: -t / 2 - 7, z: ez + 22.4, color: 0xe8ffff }));
      K.add('glow', box(12.2, 0.4, 0.4, { x: ex, y: -t / 2 - 7, z: ez - 22.1, color: C.hot }), box(0.3, 0.4, 40, { x: ex + 6.1, y: -t / 2 - 6, z: ez, color: C.amber }), box(0.3, 0.4, 40, { x: ex - 6.1, y: -t / 2 - 6, z: ez, color: C.amber }));
    }
  }
  K.add('glow', box(5, 5, 5, { x: s * 390, z: 104, color: s < 0 ? 0xff3a3a : 0x3aff6a }), box(3, 3, 3, { x: s * 390, y: 4, z: 110, color: 0xffffff }));
  meshes(K, M, g);
  return g;
}
// Stage 2: the wing carrying on beyond the stage's own slab (tucked 0.3 m inside it where they meet),
// burning where the breach tore it open.
function wingfar(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), len = o.len ?? 520;
  // local origin = (o.x, o.y, o.z); the stage slab spans x 0 … 132, y 0 … 20, z −110 … 110 here
  K.add('p', box(len + 131.7, 19.4, 720, { x: (131.7 - len) / 2, y: 10, z: 0, color: 0x3e4450 }));
  for (let x = -len + 20; x < 120; x += 44) K.add('glow', box(0.6, 0.14, 700, { x, y: 0.22, color: 0xffd08a }));
  for (let z = -340; z < 340; z += 36) K.add('glow', box(len, 0.14, 0.5, { x: -len / 2, y: 0.22, z, color: 0xffd08a }));
  for (let x = -len + 10; x < 0; x += 22) for (let z = -330; z < 330; z += 36) K.add('glow', box(1.2, 0.2, 1.2, { x, y: 0.24, z: z + 18, color: ((x + z) | 0) % 3 ? C.cyan : C.violet }));
  for (const z of [-200, 180]) for (const x of [-140, -300]) { // more engines along the span
    K.add('p', box(12, 10, 40, { x, y: -12, z, color: 0x4b525e }), box(3, 16, 28, { x, y: -4, z, color: 0x434a57 }));
    K.add('glow', box(9, 7, 0.4, { x, y: -12, z: z + 20.3, color: 0x3ac8ff }), box(5, 3.6, 0.5, { x, y: -12, z: z + 20.4, color: 0xe8ffff }), box(12.2, 0.4, 0.4, { x, y: -12, z: z - 20.1, color: C.hot }));
  }
  // fires along the torn belly: glowing gashes, burning debris hanging off them
  for (const [x, z, w] of [[-60, -120, 26], [-180, 40, 34], [-260, -260, 22], [-110, 200, 18]]) {
    K.add('glow', box(w, 0.3, 5, { x, y: -0.1, z, ry: 0.4, color: 0xff6a1a }), box(w * 0.7, 0.35, 2.4, { x, y: -0.15, z, ry: 0.4, color: 0xffd060 }));
    for (let i = 0; i < 5; i++) K.add('glow', box(1.2 + (i % 3), 2 + (i % 2) * 3, 1.2, { x: x + (i - 2) * w * 0.18, y: -1.5 - (i % 2) * 1.5, z: z + ((i * 7) % 5) - 2, ry: i, color: i % 2 ? 0xff8a2a : 0xffc040 }));
  }
  meshes(K, M, g);
  return g;
}
// Another engine nacelle hanging under the stage's wing (its pylon reaches up to the belly at 30).
function nacelle(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), py = 30 - (o.y || 0) - 10;
  K.add('p', box(12, 10, 40, { y: 5, color: 0x4f5764 }), box(12.3, 1.2, 39, { y: 5.5, color: 0x3c434e }));
  K.add('p', box(3, py, 28, { y: 10 + py / 2, color: 0x434a57 }));
  K.add('p', part(new THREE.TorusGeometry(4.3, 0.35, 3, 16), { y: 5, z: -20.2, color: 0xc8ccd4 }), part(new THREE.CircleGeometry(4.2, 16), { y: 5, z: -20.1, ry: Math.PI, color: 0x15171c }));
  K.add('glow', part(new THREE.TorusGeometry(4.75, 0.15, 3, 16), { y: 5, z: -20.3, color: C.cyan }));
  K.add('glow', part(new THREE.CircleGeometry(3.4, 12), { y: 5, z: 20.4, color: 0x3ac8ff }), part(new THREE.CircleGeometry(1.8, 10), { y: 5, z: 20.5, color: 0xe8ffff }), part(new THREE.TorusGeometry(3.7, 0.25, 3, 12), { y: 5, z: 20.3, color: C.hot }));
  for (let z = -17; z < 20; z += 6) K.add('glow', box(0.12, 0.3, 0.6, { x: 6.2, y: 4.5, z, color: C.amber }), box(0.12, 0.3, 0.6, { x: -6.2, y: 4.5, z, color: C.amber }));
  K.add('glow', box(12.4, 0.2, 0.3, { y: 2, z: -12, color: C.violet }), box(12.4, 0.2, 0.3, { y: 2, z: 12, color: C.violet }));
  meshes(K, M, g);
  return g;
}
// The boss stage: the carrier's flight deck 46 m under the bridge tower, stretching away fore and aft,
// lit for night operations.
function deckbelow(o, th, B, M) {
  const g = new THREE.Group(), K = new Kit(), x0 = -56, x1 = 32, z0 = -230, z1 = 170, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, D = z1 - z0;
  const lamps = [[-16, -150], [-16, -60], [-16, 40], [-16, 130], [-40, -110], [-40, 100], [16, -40], [16, 80]].map(([x, z], i) => ({ x: x - cx, z: z - cz, r: 22, c: i % 3 ? C.lamp : C.ice, k: 1.4 }));
  litTop(K, W, D, 0x5c6678, 4, { step: 8, lamps, y: 0.0 });
  K.parts.deck = K.parts.deck.map((geo) => geo.translate(cx, 0, cz));
  K.add('p', box(W, 6, D, { x: cx, y: -3.05, z: cz, color: 0x3e4450 }), box(W - 16, 40, D - 20, { x: cx, y: -26, z: cz, color: 0x434a57 }));
  K.add('p', box(0.6, 0.1, D, { x: -28, y: 0.05, z: cz, color: C.white }), box(0.6, 0.1, D, { x: -4, y: 0.05, z: cz, color: C.white }));
  for (let z = z0 + 8; z < z1; z += 10) K.add('p', box(0.8, 0.1, 5, { x: -16, y: 0.05, z, color: C.white }));
  for (let z = z0 + 4; z < z1; z += 5) K.add('glow', box(0.5, 0.2, 1.0, { x: -16, y: 0.12, z: z + 2.5, color: 0xffffff }));
  for (const ex of [-28.6, -3.4]) for (let z = z0 + 2; z < z1; z += 5) K.add('glow', box(0.6, 0.3, 0.6, { x: ex, y: 0.15, z, color: (z / 5) % 2 ? 0xfff2c8 : C.ice }));
  for (const sx of [x0, x1]) for (let z = z0 + 2; z < z1; z += 4) K.add('glow', box(0.6, 0.3, 0.6, { x: sx + (sx < 0 ? 0.6 : -0.6), y: 0.2, z, color: C.amber }));
  for (const sx of [x0, x1]) { K.add('glow', box(0.3, 0.3, D, { x: sx + (sx < 0 ? -0.1 : 0.1), y: -0.4, z: cz, color: C.amber }), box(0.3, 0.4, D, { x: sx + (sx < 0 ? -0.1 : 0.1), y: -3.2, z: cz, color: C.violet })); for (let z = z0 + 3; z < z1; z += 3) for (const y of [-1.4, -2.2]) K.add('glow', box(0.15, 0.4, 0.9, { x: sx + (sx < 0 ? -0.08 : 0.08), y, z: z + (y < -2 ? 1.5 : 0), color: ((z * 3) | 0) % 7 < 2 ? 0x8ad8ff : C.port })); }
  for (let x = x0 + 1; x < x1; x += 1.6) K.add('glow', box(0.5, 0.2, 0.4, { x, y: 0.1, z: z1 - 1, color: C.green }), box(0.5, 0.2, 0.4, { x, y: 0.1, z: z0 + 1, color: C.navRed }));
  for (const [x, z] of [[-34, -120], [-34, 110]]) { // lift-fan rings, glowing hot
    K.add('p', part(new THREE.TorusGeometry(8.6, 0.7, 3, 20), { x, y: 0.6, z, rx: Math.PI / 2, color: 0x6b7480 }), part(new THREE.CircleGeometry(7.9, 16), { x, y: 0.05, z, rx: -Math.PI / 2, color: 0x23262c }));
    K.add('glow', part(new THREE.RingGeometry(4, 4.6, 16), { x, y: 0.08, z, rx: -Math.PI / 2, color: 0xff7a2a }), part(new THREE.RingGeometry(1.5, 2.4, 12), { x, y: 0.09, z, rx: -Math.PI / 2, color: 0xffc060 }), part(new THREE.TorusGeometry(9.4, 0.18, 3, 20), { x, y: 0.4, z, rx: Math.PI / 2, color: C.cyan }));
  }
  for (const [x, z, a] of [[-44, -60, 0.5], [-44, -36, 0.5], [-44, 50, -0.4], [8, -150, 2.6], [12, 120, 2.2], [-12, -190, 0]]) { // parked VTOLs
    K.add('p', box(2.6, 2.2, 12, { x, y: 1.8, z, ry: a, color: 0x8a93a0 }), box(13, 0.4, 3.6, { x, y: 2.2, z, ry: a, color: 0x8a93a0 }), box(0.3, 2, 1.8, { x, y: 3.4, z: z + 5, ry: a, color: 0x5e6774 }));
    const c = Math.cos(a), s = Math.sin(a);
    for (const sx of [-1, 1]) K.add('glow', box(0.6, 0.5, 0.6, { x: x + sx * 6.5 * c, y: 2.3, z: z - sx * 6.5 * s, color: sx < 0 ? C.navRed : C.green }));
    K.add('glow', box(1, 0.4, 1.6, { x: x - 3.5 * s, y: 3.0, z: z - 3.5 * c, ry: a, color: 0x2bd8a8 }));
  }
  for (const [x, z] of [[-8, -100], [-30, 20], [20, 60]]) K.add('p', box(2.4, 1.6, 4.2, { x, y: 0.8, z, color: C.yellow })), K.add('glow', box(0.4, 0.4, 0.4, { x, y: 1.8, z, color: C.amber }));
  meshes(K, M, g);
  return g;
}

export const BACKDROPS = {
  'fortress-fan': fan, 'fortress-turbine': turbine, 'fortress-rotor': rotor, 'fortress-radar': radar,
  'fortress-searchlights': searchlights, 'fortress-tracers': tracers, 'fortress-flak': flak, 'fortress-citygap': citygap,
  'fortress-gunship': gunship, 'fortress-escorts': escorts, 'fortress-carrier': carrier, 'fortress-cumulus': cumulus,
  'fortress-wing': wing, 'fortress-wingfar': wingfar, 'fortress-nacelle': nacelle, 'fortress-deckbelow': deckbelow,
};
