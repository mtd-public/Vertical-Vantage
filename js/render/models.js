// Procedural models (no files): built from primitives, merged per material.
// Conventions: metres, +Y up, models face -Z (the sim's yaw 0). Hover cars have their ROOF at
// y = 0 (the collider top) and hang below it.
import * as THREE from 'three';
import { Kit, box, cyl, ball, part, atlasQuad, prep } from './geo.js';
import { CARS } from '../levels/kit.js';
import { seg } from './retro.js';

// ------------------------------------------------------------------ hover cars
// Returns { paint, glow, glass } geometries for one car kind (instanced per kind by the renderer).
// Paint is white where the instance colour should show, coloured where it shouldn't.
export function carGeometry(kind) {
  const C = CARS[kind], { w, d, t } = C, K = new Kit();
  const dark = 0x2a2c34, trim = 0x55586a;
  if (kind === 'barge') {
    K.add('paint', box(w, t * 0.6, d, { y: -t * 0.3, color: 0xd8d4cc }));
    K.add('paint', box(w * 0.92, t * 0.4, d * 0.94, { y: -t * 0.8, color: 0x3a3e4a }));
    for (const sx of [-1, 1]) for (let k = -5; k <= 5; k++) K.add('paint', box(0.14, 0.04, d / 11 * 0.5, { x: sx * (w / 2 - 0.08), y: 0.01, z: k * d / 11, color: k % 2 ? 0x1a1a1a : 0xffcc1a }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      K.add('paint', cyl(0.7, 0.9, 0.9, 8, { x: sx * w * 0.32, y: -t - 0.3, z: sz * d * 0.36, color: dark }));
      K.add('glow', cyl(0.62, 0.62, 0.06, 8, { x: sx * w * 0.32, y: -t - 0.78, z: sz * d * 0.36, color: 0x5ff0ff }));
    }
    for (const sz of [-1, 1]) for (let k = -2; k <= 2; k++) K.add('paint', box(0.08, 0.9, 0.08, { x: k * w / 5, y: 0.45, z: sz * (d / 2 - 0.1), color: 0xffcc1a }));
    K.add('glow', box(0.3, 0.12, 0.3, { x: w / 2 - 0.3, y: 0.08, z: -d / 2 + 0.3, color: 0x3aff6a }), box(0.3, 0.12, 0.3, { x: -w / 2 + 0.3, y: 0.08, z: -d / 2 + 0.3, color: 0xff3a3a }));
    return K.build();
  }
  if (kind === 'bus' || kind === 'truck') {
    const bodyH = t * 0.82;
    K.add('paint', box(w, bodyH, d, { y: -bodyH / 2 - 0.02, color: 0xffffff }));
    K.add('paint', box(w * 0.96, 0.06, d * 0.96, { y: -0.03, color: 0xe8e8ee })); // roof deck
    K.add('paint', box(w * 0.9, t * 0.18, d * 0.9, { y: -t + t * 0.09, color: dark })); // skirt
    if (kind === 'bus') {
      for (const sx of [-1, 1]) K.add('glass', box(0.04, bodyH * 0.38, d * 0.82, { x: sx * w / 2, y: -bodyH * 0.38, z: 0.2 }));
      K.add('glass', box(w * 0.86, bodyH * 0.45, 0.04, { y: -bodyH * 0.4, z: -d / 2 }));
      for (let k = -3; k <= 3; k++) K.add('paint', box(w * 0.5, 0.3, 0.8, { y: 0.15, z: k * d / 8, color: 0xcfd2da })); // roof AC rails
    } else {
      K.add('glass', box(w * 0.86, bodyH * 0.4, 0.04, { y: -bodyH * 0.4, z: -d / 2 }));
      K.add('paint', box(w * 1.02, 0.12, d * 0.62, { y: -bodyH * 0.55, z: d * 0.15, color: 0xffcc1a }));
    }
    K.add('glow', box(w * 0.7, 0.12, 0.05, { y: -t * 0.6, z: -d / 2 - 0.02, color: 0xfff6d8 }), box(w * 0.8, 0.12, 0.05, { y: -t * 0.5, z: d / 2 + 0.02, color: 0xff2a3a }));
    for (const sz of [-1, 1]) for (const sx of [-1, 1]) K.add('glow', cyl(0.42, 0.42, 0.05, 8, { x: sx * w * 0.3, y: -t - 0.02, z: sz * d * 0.33, color: 0x5ff0ff }));
    return K.build();
  }
  // cars: a low hull, a glass cabin, a roof plate (the walkable top), fins, thruster pods
  const hullH = t * 0.68, cabH = t - hullH;
  const tall = kind === 'van';
  const cabLen = tall ? d * 0.82 : d * 0.62, cabZ = tall ? d * 0.06 : d * 0.08;
  const body = kind === 'taxi' ? 0xffcc1a : kind === 'police' ? 0x16161e : 0xffffff;
  K.add('paint', box(w, hullH, d * 0.94, { y: -t + hullH / 2, color: body }));
  K.add('paint', box(w * 0.92, hullH * 0.5, d * 0.08, { y: -t + hullH * 0.62, z: -d * 0.5, color: body })); // nose lip
  if (kind === 'police') K.add('paint', box(w * 1.01, hullH * 0.45, d * 0.6, { y: -t + hullH * 0.62, color: 0xf0f0f4 })); // two-tone doors
  if (kind === 'taxi') for (let k = -4; k <= 4; k++) K.add('paint', box(w * 1.01, 0.1, d * 0.05, { y: -t + hullH * 0.8, z: k * d * 0.1, color: k % 2 ? 0x111111 : 0xffcc1a }));
  K.add('glass', box(w * 0.84, cabH * 0.92, cabLen, { y: -cabH / 2 - 0.02, z: cabZ }));
  K.add('paint', box(w * 0.86, 0.07, cabLen * 0.9, { y: -0.035, z: cabZ, color: body })); // roof plate
  for (const sx of [-1, 1]) K.add('paint', box(0.08, 0.38, d * 0.22, { x: sx * (w / 2 - 0.08), y: -t + hullH + 0.12, z: d * 0.38, rx: -0.4, color: trim })); // tail fins
  // thruster pods + their glow
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    K.add('paint', cyl(0.24, 0.3, 0.3, 8, { x: sx * (w / 2 - 0.25), y: -t - 0.08, z: sz * d * 0.32, color: dark }));
    K.add('glow', cyl(0.22, 0.22, 0.04, 8, { x: sx * (w / 2 - 0.25), y: -t - 0.24, z: sz * d * 0.32, color: 0x5ff0ff }));
  }
  K.add('glow', box(w * 0.22, 0.09, 0.04, { x: -w * 0.3, y: -t + hullH * 0.7, z: -d * 0.47 - 0.02, color: 0xfff6d8 }), box(w * 0.22, 0.09, 0.04, { x: w * 0.3, y: -t + hullH * 0.7, z: -d * 0.47 - 0.02, color: 0xfff6d8 }));
  K.add('glow', box(w * 0.9, 0.07, 0.04, { y: -t + hullH * 0.75, z: d * 0.47 + 0.02, color: 0xff2a3a }));
  if (kind === 'police') { K.add('glow', box(0.5, 0.14, 0.24, { x: -0.3, y: 0.07, z: cabZ, color: 0xff2a3a }), box(0.5, 0.14, 0.24, { x: 0.3, y: 0.07, z: cabZ, color: 0x2a6aff })); }
  if (kind === 'taxi') K.add('glow', box(0.7, 0.24, 0.3, { y: 0.12, z: cabZ, color: 0xffe26a }));
  return K.build();
}

// ------------------------------------------------------------------ enemies
// Each returns a THREE.Group; animated parts are named children.
export function droneModel(M) {
  const g = new THREE.Group();
  const K = new Kit();
  K.add('paint', ball(0.42, { color: 0xe8ecf4 }, 1));
  K.add('paint', part(new THREE.TorusGeometry(0.44, 0.07, 4, seg(16, 10)), { color: 0x2a2c38 }));
  K.add('paint', box(1.5, 0.08, 0.16, { color: 0x3a3e4a }));
  for (const sx of [-1, 1]) K.add('paint', cyl(0.06, 0.06, 0.12, 6, { x: sx * 0.75, y: 0.08, color: 0x3a3e4a }));
  K.add('paint', cyl(0.02, 0.02, 0.35, 4, { y: 0.55, color: 0x3a3e4a }));
  const k = K.build();
  g.add(new THREE.Mesh(k.paint, M.paintFlat));
  const rotors = new THREE.Mesh(merge2([cyl(0.28, 0.28, 0.02, 8, { x: -0.75, y: 0.16 }), cyl(0.28, 0.28, 0.02, 8, { x: 0.75, y: 0.16 })]), M.ghost);
  rotors.name = 'rotors'; g.add(rotors);
  const eye = new THREE.Mesh(prep(new THREE.SphereGeometry(0.15, 8, 6), 0xff2a4a), M.glow);
  eye.position.set(0, 0, -0.36); eye.name = 'eye'; g.add(eye);
  return g;
}

export function walkerModel(M) {
  const g = new THREE.Group();
  const K = new Kit();
  K.add('paint', part(new THREE.SphereGeometry(0.55, seg(12, 8), seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.5, sy: 0.8, color: 0xff8a1a }));
  K.add('paint', cyl(0.56, 0.48, 0.22, seg(12, 8), { y: 0.42, color: 0x2a2c38 }));
  K.add('paint', box(0.5, 0.08, 0.12, { y: 0.98, color: 0x2a2c38 }));
  const k = K.build();
  g.add(new THREE.Mesh(k.paint, M.paintFlat));
  const eye = new THREE.Mesh(box(0.56, 0.1, 0.06, { color: 0x2be8ff }), M.glow);
  eye.position.set(0, 0.62, -0.42); eye.rotation.x = -0.35; eye.name = 'eye'; g.add(eye);
  const legGeo = merge2([box(0.1, 0.1, 0.55, { z: -0.27, color: 0x3a3e4a }), box(0.09, 0.5, 0.09, { y: -0.25, z: -0.55, color: 0x3a3e4a }), box(0.16, 0.06, 0.16, { y: -0.5, z: -0.55, color: 0xff8a1a })]);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const leg = new THREE.Mesh(legGeo, M.paintFlat);
    leg.position.set(Math.sin(a) * 0.35, 0.5, Math.cos(a) * 0.35);
    leg.rotation.y = a + Math.PI; leg.name = 'leg' + i;
    g.add(leg);
  }
  return g;
}

const COATS = [0x5a4a32, 0x1c1c24, 0x3a4a3a, 0x6a2a2a];
// The spiked crawler: a walker whose back is all spikes (red dome: don't land on it).
export function spikerModel(M) {
  const g = walkerModel(M);
  const body = g.children[0];
  const K = new Kit();
  K.add('s', part(new THREE.SphereGeometry(0.55, seg(12, 8), seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.5, sy: 0.8, color: 0xc81e3a }));
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2, r = k === 8 ? 0 : 0.34, rx = k === 8 ? 0 : Math.sin(a) * 0.6, rz = k === 8 ? 0 : -Math.cos(a) * 0.6;
    K.add('s', part(new THREE.ConeGeometry(0.1, 0.45, 4), { x: Math.cos(a) * r, y: 0.88 - (k === 8 ? -0.05 : 0.08), z: Math.sin(a) * r, rx: rz, rz: -rx, color: 0xd8dce8 }));
  }
  K.add('s', cyl(0.56, 0.48, 0.22, seg(12, 8), { y: 0.42, color: 0x2a2c38 }));
  body.geometry.dispose();
  body.geometry = K.build().s;
  return g;
}

// ARACHNE-9: the spider-mech boss. A low armoured hull, an eye cluster and laser emitter up front,
// a twin-barrel turret on its back, eight two-segment legs posed every frame by the renderer
// (unit boxes stretched between hip, knee and foot). Origin = body centre, faces -Z, up +Y.
// ARACHNE-9: an industrial spider mech in OmniCorp red. Faceted armour plates with dark seams and
// rivets over a gunmetal chassis, hip actuators, a segmented abdomen with heat vents and exhausts,
// a wedge sensor head with mandibles, and eight legs whose thighs and shins carry hydraulic rams.
const BOSS_COL = { red: 0xe0313a, redHi: 0xff5a52, redDk: 0x8e1820, gun: 0x353843, steel: 0x8a909c, chrome: 0xd2d6de, black: 0x15151a, hazard: 0xffcc1a, strut: 0x5c616e };
export function bossModel(M) {
  const C = BOSS_COL;
  const g = new THREE.Group();
  const body = new THREE.Group(); body.name = 'body'; g.add(body);
  const K = new Kit();
  const P = (...a) => K.add('p', ...a);
  // chassis: a gunmetal frame under the armour, with the hip ring the legs bolt onto
  P(box(2.9, 0.55, 3.2, { y: -0.45, color: C.gun }), box(2.4, 0.25, 2.6, { y: -0.82, color: C.black }));
  P(cyl(1.25, 1.25, 0.18, 8, { y: -0.98, color: C.steel })); // underside turntable
  // thorax armour: spine plate, two angled flank plates, a front glacis and a rear apron
  P(box(1.5, 0.22, 3.0, { y: 0.92, color: C.red }), box(0.34, 0.08, 2.9, { y: 1.06, color: C.redDk })); // spine + ridge
  for (const sx of [-1, 1]) {
    P(box(1.15, 0.2, 2.9, { x: sx * 1.12, y: 0.62, rz: -sx * 0.52, color: C.red })); // flank plate
    P(box(0.9, 0.16, 2.7, { x: sx * 1.68, y: 0.06, rz: -sx * 1.25, color: C.redDk })); // side skirt
    P(box(0.05, 0.05, 2.92, { x: sx * 0.76, y: 0.86, color: C.black })); // panel seam
    for (const z of [-1.2, -0.4, 0.4, 1.2]) P(box(0.1, 0.06, 0.1, { x: sx * 1.36, y: 0.48, z, color: C.chrome })); // rivets
    // running lights on the skirts are glow (below)
  }
  P(box(2.4, 0.2, 0.95, { y: 0.55, z: -1.75, rx: 0.62, color: C.redHi })); // glacis
  for (let k = -2; k <= 2; k++) P(box(0.36, 0.05, 0.5, { x: k * 0.44, y: 0.72, z: -1.85, rx: 0.62, color: k % 2 ? C.hazard : C.black })); // hazard band on the glacis
  P(box(2.2, 0.2, 0.7, { y: 0.55, z: 1.7, rx: -0.55, color: C.red }));
  // turret mount: a steel collar with bolts
  P(cyl(0.78, 0.86, 0.22, 8, { y: 1.12, color: C.steel }));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(box(0.1, 0.08, 0.1, { x: Math.cos(a) * 0.8, y: 1.24, z: Math.sin(a) * 0.8, color: C.chrome })); }
  // hip actuators: a housing and a red cap at every leg root
  for (const sx of [-1, 1]) for (const z of [-1.3, -0.45, 0.45, 1.3]) {
    P(cyl(0.3, 0.34, 0.6, 6, { x: sx * 1.55, y: 0.1, z, color: C.gun }), cyl(0.33, 0.33, 0.12, 6, { x: sx * 1.55, y: 0.44, z, color: C.red }));
    P(box(0.5, 0.18, 0.18, { x: sx * 1.3, y: -0.3, z, color: C.steel })); // drive link
  }
  // abdomen: three tapering plates trailing behind, dark gaps between them
  for (const [i, z, w, h] of [[0, 2.45, 2.3, 1.15], [1, 3.25, 1.9, 0.95], [2, 3.95, 1.4, 0.72]]) {
    P(box(w, h, 0.72, { y: 0.22 - i * 0.12, z, rx: -0.12, color: i === 1 ? C.redDk : C.red }));
    P(box(w * 0.86, h * 0.84, 0.12, { y: 0.22 - i * 0.12, z: z + 0.42, color: C.black }));
  }
  for (const sx of [-1, 1]) P(cyl(0.12, 0.15, 1.0, 6, { x: sx * 0.62, y: 1.0, z: 2.6, rx: -0.5, color: C.gun })); // exhaust stacks
  // head: an armoured wedge with a dark sensor visor, mandibles and the laser emitter
  P(box(1.6, 0.9, 1.15, { y: 0.0, z: -2.3, color: C.gun }));
  P(box(1.7, 0.28, 1.2, { y: 0.55, z: -2.3, rx: 0.18, color: C.red }), box(1.3, 0.2, 0.5, { y: 0.48, z: -2.95, rx: 0.45, color: C.redHi })); // brow armour
  P(box(1.36, 0.48, 0.1, { y: 0.12, z: -2.88, color: C.black })); // visor
  for (const sx of [-1, 1]) {
    P(box(0.2, 0.2, 0.75, { x: sx * 0.42, y: -0.55, z: -2.95, rx: 0.35, ry: -sx * 0.25, color: C.steel })); // mandible
    P(box(0.14, 0.32, 0.16, { x: sx * 0.5, y: -0.82, z: -3.2, rx: -0.4, color: C.red })); // mandible tip
    P(box(0.1, 0.5, 0.1, { x: sx * 0.74, y: 0.95, z: -2.2, rz: sx * 0.2, color: C.black })); // antenna
  }
  P(cyl(0.22, 0.3, 0.7, 8, { y: -0.32, z: -2.9, rx: Math.PI / 2, color: C.black }), cyl(0.3, 0.3, 0.1, 8, { y: -0.32, z: -3.12, rx: Math.PI / 2, color: C.steel }));
  body.add(new THREE.Mesh(K.build().p, M.paintFlat));
  // glow: sensor lenses (hot amber, so they read against the red) and the emitter, as their own mesh
  // centred on the visor so the telegraph flare scales them in place
  const E = new Kit();
  for (const [x, y, r] of [[-0.42, 0.08, 0.15], [0.42, 0.08, 0.15], [-0.17, 0.17, 0.09], [0.17, 0.17, 0.09], [-0.6, -0.08, 0.08], [0.6, -0.08, 0.08]]) E.add('e', ball(r, { x, y, color: 0xffd86a }, 0));
  E.add('e', cyl(0.13, 0.13, 0.08, 8, { y: -0.42, z: -0.33, rx: Math.PI / 2, color: 0xff5a2a }));
  const eyes = new THREE.Mesh(E.build().e, M.glow); eyes.name = 'eye'; eyes.position.set(0, 0.1, -2.95); body.add(eyes);
  // running lights, exhaust glow, heat vents and the thruster ring
  const L = new Kit();
  for (const sx of [-1, 1]) {
    for (const z of [-1.1, -0.35, 0.35, 1.1]) L.add('l', box(0.06, 0.1, 0.32, { x: sx * 1.98, y: -0.2, z, color: 0xffb02b }));
    L.add('l', cyl(0.1, 0.1, 0.06, 6, { x: sx * 0.62, y: 1.44, z: 2.86, rx: -0.5, color: 0xff7a1a }));
  }
  for (const [z, w, y] of [[2.86, 1.7, 0.22], [3.66, 1.4, 0.1]]) for (let k = 0; k < 3; k++) L.add('l', box(w, 0.05, 0.04, { y: y - 0.25 + k * 0.2, z, color: 0xff6a1a }));
  L.add('l', part(new THREE.TorusGeometry(1.45, 0.07, 3, seg(16, 10)), { rx: Math.PI / 2, y: -1.08, sz: 1.3, color: 0xff4a1a }));
  const lights = new THREE.Mesh(L.build().l, M.glow); lights.name = 'lights'; body.add(lights);
  // turret on its back (barrels along +Z so lookAt() aims it)
  const turret = new THREE.Group(); turret.name = 'turret'; turret.position.y = 1.3; body.add(turret);
  const TK = new Kit();
  TK.add('t', cyl(0.58, 0.66, 0.3, 8, { color: C.gun }), box(0.86, 0.44, 0.9, { y: 0.34, color: C.red }), box(0.9, 0.12, 0.5, { y: 0.6, z: -0.1, color: C.redDk }));
  TK.add('t', box(0.3, 0.3, 0.42, { x: 0.58, y: 0.3, z: -0.1, color: C.gun })); // ammo feed
  for (const sx of [-1, 1]) {
    TK.add('t', cyl(0.07, 0.07, 1.25, 6, { x: sx * 0.2, y: 0.38, z: 0.9, rx: Math.PI / 2, color: C.black }));
    TK.add('t', cyl(0.11, 0.11, 0.2, 6, { x: sx * 0.2, y: 0.38, z: 1.5, rx: Math.PI / 2, color: C.steel })); // muzzle brake
  }
  turret.add(new THREE.Mesh(TK.build().t, M.paintFlat));
  // legs: 8 × (thigh, shin, knee hub). Thigh and shin are unit segments (y −0.5 → +0.5 from root to
  // tip, z = the outer side of the bend) that the renderer stretches between joints.
  const thighGeo = merge2([
    box(1, 0.9, 1, { color: C.red }), box(1.06, 0.06, 1.06, { y: 0.1, color: C.redDk }), // armour shell + seam band
    box(0.62, 1.0, 0.62, { color: C.gun }), // the frame showing at both ends
    cyl(0.2, 0.2, 0.5, 6, { z: 0.82, y: -0.2, color: C.gun }), cyl(0.1, 0.1, 0.42, 6, { z: 0.82, y: 0.24, color: C.chrome }), // hydraulic ram
  ]);
  const shinGeo = merge2([
    box(1.2, 0.5, 1.2, { y: -0.24, color: C.red }), box(1.24, 0.05, 1.24, { y: -0.04, color: C.redDk }),
    box(0.62, 0.5, 0.62, { y: 0.2, color: C.strut }),
    cyl(0.16, 0.16, 0.36, 6, { z: 0.78, y: -0.2, color: C.gun }), cyl(0.08, 0.08, 0.34, 6, { z: 0.78, y: 0.12, color: C.chrome }),
    part(new THREE.ConeGeometry(0.42, 0.12, 4), { y: 0.5, rx: Math.PI, color: C.steel }), // the claw
  ]);
  const kneeGeo = merge2([cyl(0.28, 0.28, 0.5, 8, { rz: Math.PI / 2, color: C.gun }), cyl(0.2, 0.2, 0.54, 8, { rz: Math.PI / 2, color: C.chrome })]);
  const legs = [];
  const zs = [-1.3, -0.45, 0.45, 1.3];
  for (const side of [-1, 1]) zs.forEach((z, i) => {
    const thigh = new THREE.Mesh(thighGeo, M.paintFlat), shin = new THREE.Mesh(shinGeo, M.paintFlat), knee = new THREE.Mesh(kneeGeo, M.paintFlat);
    g.add(thigh, shin, knee);
    legs.push({ side, i, hip: new THREE.Vector3(side * 1.55, 0.1, z), rest: new THREE.Vector3(side * 3.6, 0, z * 1.7), thigh, shin, knee });
  });
  g.userData.legs = legs;
  return g;
}

export function guardModel(M, variant = 0) {
  const g = new THREE.Group();
  const K = new Kit();
  const coat = COATS[variant % COATS.length], skin = [0xe0b090, 0xb07a50, 0x8a5a3a, 0xf0c8a8][variant % 4];
  K.add('paint', box(0.16, 0.55, 0.18, { x: -0.11, y: 0.28, color: 0x22222a }), box(0.16, 0.55, 0.18, { x: 0.11, y: 0.28, color: 0x22222a }));
  K.add('paint', box(0.2, 0.08, 0.3, { x: -0.11, y: 0.04, z: -0.05, color: 0x111111 }), box(0.2, 0.08, 0.3, { x: 0.11, y: 0.04, z: -0.05, color: 0x111111 }));
  K.add('paint', cyl(0.27, 0.36, 1.0, seg(8, 6), { y: 0.95, color: coat })); // long coat
  K.add('paint', box(0.56, 0.18, 0.32, { y: 1.42, color: coat })); // shoulders
  K.add('paint', box(0.36, 0.1, 0.2, { y: 1.5, color: 0x22222a })); // collar
  K.add('paint', box(0.24, 0.28, 0.26, { y: 1.66, color: skin }));
  K.add('paint', box(0.27, 0.1, 0.29, { y: 1.83, color: 0x15151a })); // hair / cap
  // arms forward holding the rifle
  K.add('paint', box(0.13, 0.13, 0.5, { x: 0.27, y: 1.3, z: -0.22, rx: 0.15, color: coat }), box(0.13, 0.13, 0.46, { x: -0.18, y: 1.28, z: -0.3, ry: 0.5, rx: 0.15, color: coat }));
  K.add('paint', box(0.08, 0.12, 0.85, { x: 0.12, y: 1.32, z: -0.55, color: 0x2a2c34 }), box(0.06, 0.16, 0.12, { x: 0.12, y: 1.22, z: -0.42, color: 0x2a2c34 }));
  const k = K.build();
  g.add(new THREE.Mesh(k.paint, M.paintFlat));
  const visor = new THREE.Mesh(box(0.26, 0.06, 0.04, { color: 0x2be8ff }), M.glow);
  visor.position.set(0, 1.7, -0.13); visor.name = 'eye'; g.add(visor);
  // laser sight (scaled to the target distance by the renderer)
  const sight = new THREE.Mesh(box(0.03, 0.03, 1, { z: 0.5, color: 0xff2a3a }), M.glow); // +Z long: the renderer lookAt()s the target
  sight.position.set(0.12, 1.36, -0.95); sight.name = 'sight'; sight.visible = false; g.add(sight);
  return g;
}

export function serverModel(M) {
  const g = new THREE.Group();
  const K = new Kit();
  K.add('paint', box(1.2, 2.2, 0.8, { y: 1.1, color: 0x22252e }));
  K.add('paint', box(1.3, 0.12, 0.9, { y: 2.26, color: 0x3a3e4a }), box(1.3, 0.12, 0.9, { y: 0.06, color: 0x3a3e4a }));
  g.add(new THREE.Mesh(K.build().paint, M.paintFlat));
  const face = merge2([part(new THREE.PlaneGeometry(1.0, 1.95), { y: 1.12, z: -0.41, ry: Math.PI }), part(new THREE.PlaneGeometry(1.0, 1.95), { y: 1.12, z: 0.41 })]);
  g.add(new THREE.Mesh(face, M.server));
  const led = new THREE.Mesh(box(1.0, 0.06, 0.92, { y: 2.34, color: 0x2bff7a }), M.glow);
  led.name = 'eye'; g.add(led);
  return g;
}

function merge2(list) { const K = new Kit(); K.add('x', ...list); return K.build().x; }

// ------------------------------------------------------------------ pickups and objectives
export const PICKUP_COL = { health: 0x3dff7a, healthBig: 0x3dff7a, spread: 0xff7a2b, rapid: 0x2be8ff, rocket: 0xff3b5c, hyper: 0x7bff4a, overdrive: 0xffb02b, time: 0xffe52b, slowmo: 0x8fb8ff };
export const PICKUP_ICON = { health: 0, healthBig: 0, spread: 1, rapid: 2, rocket: 3, hyper: 4, overdrive: 5, time: 6, slowmo: 8 };
const ICON_LOCK = 9, ICONS = 16;

export function pickupModel(M, type) {
  const g = new THREE.Group(), col = PICKUP_COL[type];
  const spin = new THREE.Group(); spin.name = 'spin'; g.add(spin);
  if (type === 'health' || type === 'healthBig') {
    const s = type === 'healthBig' ? 1.35 : 1;
    spin.add(new THREE.Mesh(merge2([cyl(0.32 * s, 0.32 * s, 0.7 * s, seg(10, 8), { color: 0xf4f4f8 }), cyl(0.34 * s, 0.34 * s, 0.1 * s, seg(10, 8), { y: 0.33 * s, color: 0x3a3e4a })]), M.paintFlat));
    spin.add(new THREE.Mesh(merge2([box(0.36 * s, 0.12 * s, 0.05, { z: 0.33 * s, color: col }), box(0.12 * s, 0.36 * s, 0.05, { z: 0.33 * s, color: col }), box(0.36 * s, 0.12 * s, 0.05, { z: -0.33 * s, color: col }), box(0.12 * s, 0.36 * s, 0.05, { z: -0.33 * s, color: col })]), M.glow));
  } else if (type === 'spread' || type === 'rapid' || type === 'rocket') {
    spin.add(new THREE.Mesh(box(0.7, 0.5, 0.7, { color: 0x22252e }), M.paintFlat));
    spin.add(new THREE.Mesh(merge2([box(0.74, 0.08, 0.74, { y: 0.21, color: col }), box(0.74, 0.08, 0.74, { y: -0.21, color: col })]), M.glow));
  } else {
    spin.add(new THREE.Mesh(part(new THREE.OctahedronGeometry(0.5, 0), { color: col }), M.glow));
  }
  const ic = new THREE.Mesh(iconQuad(PICKUP_ICON[type]), M.icons);
  ic.position.y = 0.85; ic.name = 'icon';
  g.add(ic);
  return g;
}
function iconQuad(i) { const u0 = i / ICONS; return atlasQuad(0.6, 0.6, [u0, 0, u0 + 1 / ICONS, 1]); }

export function iconAtlasPaint(g) { // 512 × 32: 16 cells: + S P R H O T D ⧗ 🔒
  const glyphs = ['+', 'S', 'P', 'R', 'H', 'O', 'T', 'D', '', ''];
  const cols = ['#3dff7a', '#ff7a2b', '#2be8ff', '#ff3b5c', '#7bff4a', '#ffb02b', '#ffe52b', '#ffd23a', '#8fb8ff', '#ff2a3a'];
  g.clearRect(0, 0, 512, 32);
  glyphs.forEach((ch, i) => {
    const x = i * 32;
    g.fillStyle = 'rgba(10,10,20,0.75)'; g.fillRect(x + 3, 3, 26, 26);
    g.strokeStyle = cols[i]; g.lineWidth = 2; g.strokeRect(x + 3, 3, 26, 26);
    g.fillStyle = cols[i]; g.strokeStyle = cols[i];
    if (i === 8) { // hourglass (slow-mo)
      g.beginPath(); g.moveTo(x + 9, 8); g.lineTo(x + 23, 8); g.lineTo(x + 16, 16); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x + 16, 16); g.lineTo(x + 23, 24); g.lineTo(x + 9, 24); g.closePath(); g.stroke();
      g.fillRect(x + 12, 21, 8, 3);
    } else if (i === 9) { // padlock (the exit is locked)
      g.lineWidth = 3; g.beginPath(); g.arc(x + 16, 14, 5, Math.PI, 0); g.stroke(); g.fillRect(x + 9, 14, 14, 10);
    } else { g.font = 'bold 20px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x + 16, 17); }
  });
}

export function driveModel(M) {
  const g = new THREE.Group();
  const spin = new THREE.Group(); spin.name = 'spin'; g.add(spin);
  spin.add(new THREE.Mesh(box(0.95, 0.24, 1.3, { color: 0xb9c0cc }), M.paintFlat));
  const lab = new THREE.Mesh(merge2([part(new THREE.PlaneGeometry(0.9, 1.25), { y: 0.125, rx: -Math.PI / 2 }), part(new THREE.PlaneGeometry(0.9, 1.25), { y: -0.125, rx: Math.PI / 2 })]), M.driveLabel);
  spin.add(lab);
  spin.add(new THREE.Mesh(merge2([box(1.02, 0.06, 1.36, { y: 0.0, color: 0xffd23a })]), M.glow));
  spin.rotation.x = 0.5;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 160, 6, 1, true), M.beamGold);
  beam.position.y = 80; beam.name = 'beam'; g.add(beam);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), M.haloGold);
  halo.name = 'halo'; g.add(halo);
  return g;
}

// Torii gate in neon tubes: the exit. Locked = red, open = cyan with a swirling portal.
export function exitModel(M) {
  const g = new THREE.Group();
  const tubes = merge2([
    box(0.45, 6, 0.45, { x: -2.7, y: 3 }), box(0.45, 6, 0.45, { x: 2.7, y: 3 }),
    box(8, 0.5, 0.7, { y: 6.2 }), box(1.4, 0.4, 0.7, { x: -4.3, y: 6.45, rz: 0.25 }), box(1.4, 0.4, 0.7, { x: 4.3, y: 6.45, rz: -0.25 }),
    box(6.6, 0.32, 0.4, { y: 5.1 }), box(0.5, 1.0, 0.3, { y: 5.65 }),
  ]);
  const mat = M.exitTube;
  g.add(new THREE.Mesh(tubes, mat));
  const base = merge2([box(1.2, 0.4, 1.2, { x: -2.7, y: 0.2, color: 0x1a1a22 }), box(1.2, 0.4, 1.2, { x: 2.7, y: 0.2, color: 0x1a1a22 }), box(6.4, 0.12, 3, { y: 0.06, color: 0x2a2c38 })]);
  g.add(new THREE.Mesh(base, M.paintFlat));
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.8), M.exitPortal);
  portal.position.y = 2.5; portal.name = 'portal'; g.add(portal);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 260, 10, 1, true), M.exitBeam); // starts above the gate: you never stand inside it
  beam.position.y = 138; beam.name = 'beam'; g.add(beam);
  const lock = new THREE.Mesh(iconQuad(ICON_LOCK), M.icons);
  lock.position.set(0, 3, 0.05); lock.scale.setScalar(2.4); lock.name = 'lock'; g.add(lock);
  return g;
}

export function portalModel(M) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(part(new THREE.TorusGeometry(1.4, 0.16, 5, seg(20, 12)), { color: 0xff2bd6 }), M.glow);
  ring.name = 'ring'; ring.position.y = 1.6; g.add(ring);
  const ring2 = new THREE.Mesh(part(new THREE.TorusGeometry(1.0, 0.08, 4, seg(16, 10)), { color: 0x2be8ff }), M.glow);
  ring2.name = 'ring2'; ring2.position.y = 1.6; g.add(ring2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, seg(20, 12)), M.portalSwirl);
  disc.name = 'disc'; disc.position.y = 1.6; g.add(disc);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.2, 14, 6, 1, true), M.beamPink); // short: the portal is a secret
  beam.position.y = 7; g.add(beam);
  return g;
}

// ------------------------------------------------------------------ the player
// Robot legs, seen when you look down. Pivots: hips at y 0.92.
export function legsModel(M) {
  // No pelvis: looking straight down you see two legs either side of the landing ring.
  const g = new THREE.Group();
  const white = 0xe8ecf4, blue = 0x2a5ad8, orange = 0xff8a1a;
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sx * 0.3, 0.9, -0.14); hip.name = 'hip' + (sx < 0 ? 'L' : 'R');
    hip.add(new THREE.Mesh(merge2([box(0.17, 0.4, 0.19, { y: -0.22, color: white }), box(0.19, 0.06, 0.21, { y: -0.03, color: 0x9aa6bc }), box(0.05, 0.3, 0.2, { x: sx * 0.07, y: -0.22, color: blue })]), M.paintFlat));
    const knee = new THREE.Group(); knee.position.y = -0.42; knee.name = 'knee';
    knee.add(new THREE.Mesh(merge2([box(0.15, 0.42, 0.17, { y: -0.21, color: white }), box(0.19, 0.14, 0.1, { y: 0, z: -0.1, color: orange }), box(0.26, 0.11, 0.46, { y: -0.43, z: -0.1, color: 0x3a3e4a }), box(0.24, 0.05, 0.1, { y: -0.36, z: -0.3, color: blue })]), M.paintFlat));
    knee.add(new THREE.Mesh(box(0.04, 0.28, 0.04, { x: sx * 0.085, y: -0.2, z: -0.08, color: 0x2be8ff }), M.glow));
    hip.add(knee);
    g.add(hip);
  }
  return g;
}

// The arm cannon in camera space (drawn in its own pass on top of the world).
export function cannonModel(M) {
  const g = new THREE.Group();
  const body = merge2([
    box(0.16, 0.16, 0.42, { z: 0.05, color: 0xe8ecf4 }), box(0.2, 0.08, 0.3, { y: 0.11, z: 0.02, color: 0x2a5ad8 }),
    cyl(0.07, 0.08, 0.34, seg(10, 6), { z: -0.28, rx: Math.PI / 2, color: 0x3a3e4a }), cyl(0.085, 0.085, 0.06, seg(10, 6), { z: -0.44, rx: Math.PI / 2, color: 0xff8a1a }),
    box(0.06, 0.1, 0.14, { x: -0.1, y: -0.05, z: 0.14, color: 0x3a3e4a }),
  ]);
  g.add(new THREE.Mesh(body, M.vmPaint));
  const strip = new THREE.Mesh(merge2([box(0.02, 0.03, 0.34, { x: 0.085, y: 0.03, z: 0.02 }), box(0.02, 0.03, 0.34, { x: -0.085, y: 0.03, z: 0.02 })]), M.vmGlow);
  strip.name = 'strip'; g.add(strip);
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), M.vmFlash);
  flash.position.z = -0.52; flash.name = 'flash'; flash.visible = false; g.add(flash);
  return g;
}
