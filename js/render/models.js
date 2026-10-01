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
export const PICKUP_COL = { health: 0x3dff7a, healthBig: 0x3dff7a, spread: 0xff7a2b, rapid: 0x2be8ff, rocket: 0xff3b5c, hyper: 0x7bff4a, overdrive: 0xffb02b, time: 0xffe52b };
export const PICKUP_ICON = { health: 0, healthBig: 0, spread: 1, rapid: 2, rocket: 3, hyper: 4, overdrive: 5, time: 6 };

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
function iconQuad(i) { const u0 = i / 8; return atlasQuad(0.6, 0.6, [u0, 0, u0 + 1 / 8, 1]); }

export function iconAtlasPaint(g) { // 256 × 32: + S P R H O T D
  const glyphs = ['+', 'S', 'P', 'R', 'H', 'O', 'T', 'D'];
  const cols = ['#3dff7a', '#ff7a2b', '#2be8ff', '#ff3b5c', '#7bff4a', '#ffb02b', '#ffe52b', '#ffd23a'];
  g.clearRect(0, 0, 256, 32);
  glyphs.forEach((ch, i) => {
    g.fillStyle = 'rgba(10,10,20,0.75)'; g.fillRect(i * 32 + 3, 3, 26, 26);
    g.strokeStyle = cols[i]; g.lineWidth = 2; g.strokeRect(i * 32 + 3, 3, 26, 26);
    g.fillStyle = cols[i]; g.font = 'bold 20px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, i * 32 + 16, 17);
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
  const lock = new THREE.Mesh(iconQuad(7), M.icons);
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
