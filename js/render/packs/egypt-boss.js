// MECHA ANUBIS's look: a 9.6 m jackal-headed mech in black lacquer and gold, lapis bands, a broad
// collar, a striped shendyt kilt, eyes that glow cyan (red when it winds up) and the was-sceptre.
// Built facing +Z with its feet at y = 0; the view poses the joints from the sim's state every frame
// (js/sim/bosses/anubis.js). It also draws what only it knows about: the shockwave rings running out
// across the floor, the sand swirl where it will rise, the glowing jars, the ankh ward, and the beam
// of the scales of Ma'at see-sawing with the pans.
import * as THREE from 'three';
import { Kit, box, cyl, part } from '../geo.js';

const C = { black: 0x16161c, blackHi: 0x2a2a34, gold: 0xffc53a, goldDk: 0xc8901a, lapis: 0x1e46b4, turq: 0x2ad0c0, cyan: 0x2be8ff, red: 0xff2a3a, white: 0xf2eee4, sand: 0xd8b07a };

function mesh(M, build) {
  const K = new Kit(); build((...g) => K.add('p', ...g), (...g) => K.add('g', ...g));
  const geo = K.build(), grp = new THREE.Group();
  if (geo.p) grp.add(new THREE.Mesh(geo.p, M.paintFlat));
  if (geo.g) grp.add(new THREE.Mesh(geo.g, M.glow));
  return grp;
}
const joint = (parent, x, y, z, name) => { const j = new THREE.Group(); j.position.set(x, y, z); j.name = name; parent.add(j); return j; };
const own = (m) => { m.userData.own = true; return m; }; // (disposed with the level)
const add = (o) => own(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, ...o }));

export function anubisModel(M) {
  const g = new THREE.Group();
  const body = joint(g, 0, 0, 0, 'body');
  const J = { body };
  // ---- legs: hips at 4.3 m; black thighs, gold knee plates, shins with lapis greaves, gold-toed feet
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const leg = joint(body, s * 0.95, 4.3, 0, 'leg' + n);
    leg.add(mesh(M, (P, G) => { P(box(1.0, 2.1, 1.1, { y: -1.0, color: C.black }), box(1.1, 0.5, 1.2, { y: -0.3, color: C.blackHi }), box(0.3, 1.4, 0.2, { x: s * 0.55, y: -1.1, color: C.goldDk })); G(box(0.08, 1.5, 0.06, { x: -s * 0.25, y: -1.1, z: 0.57, color: C.cyan }), box(1.12, 0.06, 1.22, { y: -0.56, color: C.gold })); }));
    const knee = joint(leg, 0, -2.1, 0, 'knee' + n);
    knee.add(mesh(M, (P, G) => {
      P(part(new THREE.IcosahedronGeometry(0.55, 0), { color: C.gold }));
      P(box(0.85, 2.0, 0.9, { y: -1.05, color: C.black }), box(0.9, 1.5, 0.3, { y: -1.0, z: 0.4, color: C.lapis }), box(0.95, 0.14, 0.95, { y: -0.3, color: C.gold }));
      P(box(1.0, 0.45, 1.9, { y: -2.15, z: 0.35, color: C.black }), box(1.02, 0.18, 0.5, { y: -2.2, z: 1.2, color: C.gold }));
      G(box(0.06, 1.2, 0.06, { x: s * 0.46, y: -1.0, z: 0.3, color: C.cyan }));
    }));
    J['leg' + n] = leg; J['knee' + n] = knee;
  }
  // ---- pelvis: a gold belt and the striped shendyt kilt, a lapis apron in front
  const pelvis = joint(body, 0, 4.4, 0, 'pelvis');
  pelvis.add(mesh(M, (P) => {
    P(box(2.7, 0.5, 1.7, { color: C.gold }));
    P(cyl(1.35, 1.6, 1.4, 10, { y: -0.9, sz: 0.72, color: C.white }));
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; P(box(0.12, 1.36, 0.05, { x: Math.cos(a) * 1.5, y: -0.9, z: Math.sin(a) * 1.08, ry: -a + Math.PI / 2, color: C.goldDk })); }
    P(box(0.9, 1.6, 0.1, { y: -0.95, z: 1.2, color: C.lapis }), box(0.95, 0.14, 0.12, { y: -0.3, z: 1.22, color: C.gold }), box(0.95, 0.14, 0.12, { y: -1.7, z: 1.22, color: C.gold }));
  }));
  pelvis.add(mesh(M, (P, G) => { G(part(new THREE.TorusGeometry(1.0, 0.05, 3, 20), { y: -1.62, rx: Math.PI / 2, sx: 1.6, sy: 1.15, color: C.gold }), box(0.06, 1.3, 0.05, { y: -0.95, z: 1.27, color: C.cyan })); })); // a gold LED hem, a cyan seam down the apron
  // ---- torso: black plate, the broad collar (gold, lapis, turquoise), a glowing ankh core in the chest
  const torso = joint(body, 0, 4.7, 0, 'torso');
  torso.add(mesh(M, (P, G) => {
    P(box(2.4, 1.4, 1.5, { y: 0.6, color: C.black }), box(3.1, 1.5, 1.7, { y: 1.9, color: C.black }), box(3.3, 0.6, 1.8, { y: 2.8, color: C.blackHi }));
    for (let k = 0; k < 4; k++) P(part(new THREE.CylinderGeometry(1.75 - k * 0.12, 1.85 - k * 0.12, 0.26, 12, 1, true, -Math.PI * 0.55, Math.PI * 1.1), { y: 2.7 - k * 0.26, z: 0.1, color: [C.gold, C.lapis, C.turq, C.gold][k] }));
    G(box(0.16, 0.8, 0.08, { y: 1.3, z: 0.88, color: C.cyan }), box(0.6, 0.14, 0.08, { y: 1.6, z: 0.88, color: C.cyan }));
    G(part(new THREE.TorusGeometry(0.22, 0.06, 3, 8), { y: 1.95, z: 0.88, color: C.cyan }));
    for (const s of [-1, 1]) { P(part(new THREE.SphereGeometry(0.85, 8, 5), { x: s * 1.75, y: 2.6, sy: 0.8, color: C.black })); P(box(0.6, 0.12, 1.0, { x: s * 1.95, y: 2.95, color: C.gold })); }
    P(cyl(0.45, 0.55, 0.7, 8, { y: 3.2, color: C.blackHi }));
    G(part(new THREE.CylinderGeometry(1.86, 1.86, 0.06, 12, 1, true, -Math.PI * 0.55, Math.PI * 1.1), { y: 2.84, z: 0.1, color: C.cyan })); // the collar's rim, lit
    for (const s of [-1, 1]) G(box(0.62, 0.05, 1.02, { x: s * 1.95, y: 3.03, color: C.cyan }));
    for (const s of [-1, 1]) G(box(0.3, 0.12, 0.06, { x: s * 0.7, y: 2.0, z: -0.88, color: 0xff8a2a })); // back vents (the ward's power: the open back)
    G(box(1.4, 1.0, 0.06, { y: 1.4, z: -0.78, color: 0x2a6aff }));
  }));
  // ---- head: the jackal: a long snout, tall ears with gold linings, eyes that glow
  const head = joint(torso, 0, 3.4, 0.15, 'head');
  head.add(mesh(M, (P, G) => {
    P(box(1.3, 1.2, 1.4, { y: 0.5, color: C.black }), box(1.35, 0.15, 1.45, { y: 1.05, color: C.goldDk }));
    P(part(new THREE.CylinderGeometry(0.28, 0.55, 1.6, 6), { y: 0.25, z: 1.3, rx: Math.PI / 2, sx: 0.9, sz: 0.85, color: C.black })); // the snout
    P(box(0.32, 0.18, 0.2, { y: 0.32, z: 2.1, color: C.blackHi }));
    for (const s of [-1, 1]) {
      P(part(new THREE.ConeGeometry(0.38, 1.9, 4), { x: s * 0.42, y: 1.9, z: -0.15, rz: -s * 0.12, sz: 0.45, color: C.black }));
      P(part(new THREE.ConeGeometry(0.24, 1.4, 4), { x: s * 0.42, y: 1.85, z: 0.03, rz: -s * 0.12, sz: 0.25, color: C.gold }));
      G(box(0.12, 0.12, 0.12, { x: s * 0.53, y: 2.84, z: -0.15, color: C.cyan }));
    }
    G(box(1.36, 0.05, 1.46, { y: 1.13, color: C.gold })); // the headband
    P(box(1.4, 0.8, 0.12, { y: -0.2, z: -0.7, color: C.lapis })); // a lapis neck guard
  }));
  const eyes = mesh(M, (P, G) => { for (const s of [-1, 1]) G(box(0.34, 0.12, 0.08, { x: s * 0.36, y: 0, z: 0, rz: s * 0.25, color: C.cyan })); });
  eyes.position.set(0, 0.68, 0.72); eyes.name = 'eyes'; head.add(eyes);
  const eyesRed = mesh(M, (P, G) => { for (const s of [-1, 1]) G(box(0.42, 0.16, 0.09, { x: s * 0.36, y: 0, z: 0, rz: s * 0.25, color: C.red })); });
  eyesRed.position.set(0, 0.68, 0.73); eyesRed.name = 'eyesRed'; eyesRed.visible = false; head.add(eyesRed);
  // stars over its head (the punish windows)
  const stars = mesh(M, (P, G) => { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; G(box(0.34, 0.34, 0.34, { x: Math.cos(a) * 1.3, z: Math.sin(a) * 1.3, ry: a, rz: 0.78, color: 0xffe040 })); } });
  stars.position.y = 3.0; stars.name = 'stars'; stars.visible = false; head.add(stars);
  // ---- arms: shoulder → elbow → hand; gold bracers
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const arm = joint(torso, s * 1.95, 2.7, 0, 'arm' + n);
    arm.add(mesh(M, (P) => { P(box(0.8, 1.8, 0.85, { y: -0.85, color: C.black }), box(0.86, 0.3, 0.9, { y: -0.2, color: C.gold })); }));
    const elbow = joint(arm, 0, -1.75, 0, 'elbow' + n);
    elbow.add(mesh(M, (P, G) => { P(part(new THREE.IcosahedronGeometry(0.42, 0), { color: C.blackHi }), box(0.7, 1.5, 0.72, { y: -0.75, color: C.black }), box(0.76, 0.6, 0.78, { y: -0.9, color: C.gold }), box(0.62, 0.55, 0.62, { y: -1.7, color: C.black })); G(box(0.78, 0.06, 0.8, { y: -0.9, color: C.cyan })); }));
    J['arm' + n] = arm; J['elbow' + n] = elbow;
  }
  // ---- the was-sceptre in the right hand: a long staff, the forked foot, the beast's head at the top
  const staff = joint(J.elbowR, 0, -1.75, 0, 'staff');
  staff.add(mesh(M, (P, G) => {
    P(cyl(0.13, 0.13, 8.2, 6, { y: -2.1, color: C.gold }));
    for (let y = 1.2; y > -6; y -= 1.4) P(cyl(0.17, 0.17, 0.22, 6, { y, color: C.lapis }));
    P(box(0.5, 0.3, 0.9, { y: 2.15, z: 0.25, rx: -0.4, color: C.gold }), box(0.25, 0.5, 0.25, { y: 2.45, z: -0.1, color: C.gold })); // the beast's head
    for (const s of [-1, 1]) P(box(0.12, 0.8, 0.12, { x: s * 0.2, y: -6.5, rz: s * 0.4, color: C.gold })); // the forked foot
    G(box(0.06, 7.4, 0.06, { y: -2.0, z: 0.14, color: C.cyan }));
  }));
  J.staff = staff;
  Object.assign(J, { pelvis, torso, head, eyes, eyesRed, stars });
  g.userData.J = J;
  g.userData.pose = null;
  return g;
}

// ------------------------------------------------------------------ the things in the world it owns
// (created once, under the level root, on the first update)
function worldBits(g, M) {
  const W = { group: new THREE.Group() };
  g.parent.add(W.group);
  const gold = add({ color: 0xffc53a, opacity: 0.55 }), sand = own(new THREE.MeshLambertMaterial({ color: C.sand, flatShading: true }));
  W.waves = [];
  for (let i = 0; i < 4; i++) { // shockwave rings: a wall of gold light 0.9 m tall, and a band of sand at its foot
    const r = new THREE.Group();
    r.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.9, 40, 1, true), gold));
    const foot = new THREE.Mesh(new THREE.RingGeometry(0.94, 1.0, 40), add({ color: 0xff9a3a, opacity: 0.5 })); foot.rotation.x = -Math.PI / 2; foot.position.y = -0.4; r.add(foot);
    r.visible = false; W.group.add(r); W.waves.push(r);
  }
  // the sand swirl: a spiral of grains and a dark eye
  W.swirl = new THREE.Group();
  const K = new Kit();
  for (let arm = 0; arm < 3; arm++) for (let k = 0; k < 16; k++) { // three arms of streaming sand, curling into a dark eye
    const a = arm * (Math.PI * 2 / 3) + k * 0.32, rr = 0.9 + k * 0.21;
    K.add('p', box(0.5 + k * 0.05, 0.06, 0.22, { x: Math.cos(a) * rr, y: 0.05 + (k % 2) * 0.03, z: Math.sin(a) * rr, ry: -a, color: k % 3 ? C.sand : 0xe8c890 }));
  }
  W.swirl.add(new THREE.Mesh(K.build().p, sand));
  const eye = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), own(new THREE.MeshBasicMaterial({ color: 0x1a120a }))); eye.rotation.x = -Math.PI / 2; eye.position.y = 0.04; W.swirl.add(eye);
  const lip = new THREE.Mesh(new THREE.RingGeometry(3.9, 4.2, 32), add({ color: 0xffc53a, opacity: 0.6 })); lip.rotation.x = -Math.PI / 2; lip.position.y = 0.06; W.swirl.add(lip);
  W.swirl.visible = false; W.group.add(W.swirl);
  // the jars' glow when it calls the scarabs
  W.jarGlow = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7, 12, 1, true), add({ color: 0x2bff9a, opacity: 0.35 })); m.visible = false; W.group.add(m); W.jarGlow.push(m); }
  // the ankh ward: a golden shell over its front and sides (its back stays open), a great ankh
  // turning behind its head (kept out of the model so the hit flash leaves it alone)
  W.ward = new THREE.Group(); W.ward.visible = false;
  W.shellMat = add({ color: 0xffc53a, opacity: 0.22 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(5.6, 18, 10, Math.PI / 2 + Math.PI / 3, Math.PI * 4 / 3, 0, Math.PI * 0.62), W.shellMat);
  shell.position.y = 4.5; shell.scale.set(1, 1.15, 1); W.ward.add(shell);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.07, 3, 24, Math.PI * 4 / 3), add({ color: 0x2be8ff, opacity: 0.8 }));
  rim.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + Math.PI / 3); rim.position.y = 0.4; W.ward.add(rim);
  W.ankh = mesh(M, (P, G) => { G(box(0.45, 3.2, 0.2, { y: -0.5, color: C.gold }), box(2.4, 0.42, 0.2, { y: 1.0, color: C.gold })); G(part(new THREE.TorusGeometry(0.8, 0.2, 4, 12), { y: 2.0, sy: 1.25, color: C.gold })); });
  W.ankh.position.set(0, 10.6, -1.8); W.ward.add(W.ankh);
  W.group.add(W.ward);
  // the beam of the scales (pivots over the post; the pans hang 12 m below its ends)
  W.scale = mesh(M, (P, G) => {
    P(box(18.6, 0.4, 0.5, { color: C.gold }), box(0.7, 0.7, 0.7, { color: C.goldDk }));
    for (const s of [-1, 1]) P(box(0.5, 0.6, 0.6, { x: s * 9, color: C.goldDk }));
    G(box(18.6, 0.08, 0.1, { y: -0.24, z: 0.26, color: C.cyan }));
    P(box(0.2, 1.4, 0.2, { y: 0.9, color: C.gold }));
    G(box(0.9, 0.5, 0.1, { y: 1.75, color: C.gold })); // the plumb's needle
  });
  W.scale.visible = false; W.group.add(W.scale);
  return W;
}

// ------------------------------------------------------------------ posing
const TELE = new Set(['sweepTele', 'backTele', 'slamTele', 'beamCharge', 'boltTele', 'summonTele', 'sinkTele']);
const OPEN = new Set(['recover', 'stuck', 'vent', 'shake', 'reel']);
const lerp = (a, b, k) => a + (b - a) * k;

function target(e, t) {
  const k = e.dur > 0 ? Math.min(1, e.st / e.dur) : 1, s = e.state;
  const ph = e.gait * 1.3, sw = Math.sin(ph);
  const T = { y: Math.abs(Math.cos(ph)) * 0.1, lean: 0.08, twist: 0, roll: 0, headX: 0, headY: 0,
    armR: [-0.35, 0, -0.15], elbowR: -0.5, armL: [sw * 0.3, 0, 0.2], elbowL: -0.4, staff: 0.5,
    legL: sw * 0.4, kneeL: Math.max(0, sw) * 0.7, legR: -sw * 0.4, kneeR: Math.max(0, -sw) * 0.7, rate: 9 };
  switch (s) {
    case 'intro': case 'roar': Object.assign(T, { headX: -0.5, armR: [-0.6, 0, -0.9], armL: [-0.6, 0, 1.0], elbowR: -0.2, elbowL: -0.2, legL: 0, legR: 0, kneeL: 0, kneeR: 0, lean: -0.12, staff: 0.8 }); break;
    case 'sweepTele': Object.assign(T, { y: -0.8, lean: 0.3, twist: -1.0, armR: [-0.3, 0, -1.4], elbowR: 0, staff: 1.5, legL: -0.5, kneeL: 0.8, legR: 0.3, kneeR: 0.6, rate: 7 }); break;
    case 'sweep': Object.assign(T, { y: -0.8, lean: 0.3, twist: lerp(-1.0, 2.6, k), armR: [-0.3, 0, -1.4], elbowR: 0, staff: 1.5, legL: -0.5, kneeL: 0.8, legR: 0.3, kneeR: 0.6, rate: 30 }); break;
    case 'backTele': Object.assign(T, { y: -0.2, lean: 0.05, twist: 2.4, armR: [-1.6, 0, -1.2], elbowR: -0.2, staff: 1.0, rate: 8 }); break;
    case 'backswing': Object.assign(T, { y: -0.2, twist: lerp(2.4, -1.4, k), armR: [-1.6, 0, -1.2], elbowR: -0.2, staff: 1.0, rate: 30 }); break;
    case 'slamTele': Object.assign(T, { lean: -0.2, headX: -0.2, armR: [-3.0 * Math.min(1, k * 1.6), 0, -0.2], elbowR: -0.3, armL: [-2.9 * Math.min(1, k * 1.6), 0, 0.3], elbowL: -0.4, staff: 0.3, legL: -0.3, legR: 0.25, kneeL: 0.3, kneeR: 0.2, rate: 8 }); break;
    case 'stuck': { const tug = Math.sin(t * 7) * 0.08; Object.assign(T, { y: -0.6, lean: 0.55 + tug, headX: 0.3, armR: [-1.2, 0, -0.1], elbowR: -0.1, armL: [-1.1, 0, 0.2], elbowL: -0.1, staff: 0.0, legL: -0.6, kneeL: 0.9, legR: 0.4, kneeR: 0.5, rate: 10 }); break; }
    case 'beamCharge': case 'beam': Object.assign(T, { lean: 0.15, headX: -Math.asin(Math.max(-1, Math.min(1, e.beam.dy || 0))) * 0.8 - 0.1, armR: [-0.2, 0, -0.5], armL: [-0.4, 0, 0.6], elbowL: -0.8, legL: -0.25, legR: 0.25, kneeL: 0.25, kneeR: 0.25, rate: s === 'beam' ? 14 : 7 }); break;
    case 'vent': Object.assign(T, { y: -1.4, lean: 0.4, headX: 0.6, armR: [-0.4, 0, -0.2], armL: [-0.6, 0, 0.3], legL: -1.2, kneeL: 2.0, legR: 0.3, kneeR: 1.6, rate: 5 }); break;
    case 'boltTele': case 'bolts': Object.assign(T, { lean: -0.05, armR: [-2.2, 0, -0.3], elbowR: -0.1, staff: 0.2, armL: [-1.3, 0, 0.5], elbowL: -0.2, legL: -0.25, legR: 0.25, rate: 9 }); break;
    case 'summonTele': case 'summon': Object.assign(T, { y: -0.3, lean: -0.1, headX: -0.45, armR: [-0.5, 0, -0.35], elbowR: -0.5, staff: 0.9, armL: [-2.6, 0, 0.6], elbowL: -0.1, rate: 6 }); break;
    case 'sinkTele': case 'sinking': case 'under': case 'rise': Object.assign(T, { y: -0.5, lean: 0.25, armR: [-0.6, 0, -0.6], armL: [-0.6, 0, 0.6], elbowL: -0.6, staff: 0.8, legL: -0.4, kneeL: 0.9, legR: -0.4, kneeR: 0.9, roll: Math.sin(t * 13) * 0.05, rate: 8 }); break;
    case 'recover': case 'shake': case 'reel': {
      const wob = Math.sin(t * (s === 'reel' ? 9 : 5));
      Object.assign(T, { y: -0.45, lean: s === 'reel' ? -0.3 : 0.35, roll: wob * 0.14, headX: s === 'reel' ? -0.5 : 0.5, headY: wob * 0.3, armR: [0.1, 0, -0.5], elbowR: -0.2, armL: [-0.8, 0, 0.5], elbowL: -1.6, staff: 0.6, legL: -0.2, legR: 0.25, kneeL: 0.5, kneeR: 0.35, rate: 6 });
      break;
    }
    case 'dying': Object.assign(T, { y: -1.4, lean: 0.6, roll: 0.35, headX: 0.7, armR: [0.4, 0, -0.6], armL: [0.3, 0, 0.7], legL: -0.6, kneeL: 1.5, legR: -0.3, kneeR: 1.2, rate: 2 }); break;
    default: break;
  }
  return T;
}

export function anubisUpdate(R, e, g, dt, t, P) {
  const J = g.userData.J;
  g.position.set(e.cx, e.cy - e.bodyH, e.cz);
  g.rotation.y = Math.atan2(e.fx, e.fz);
  R.flashModel(g, e.flash > 0 || (e.state === 'dying' && Math.sin(t * 30) > 0));
  const T = target(e, t);
  let S = g.userData.pose;
  if (!S) S = g.userData.pose = JSON.parse(JSON.stringify(T));
  const k = Math.min(1, dt * T.rate);
  for (const key in T) {
    if (key === 'rate') continue;
    if (Array.isArray(T[key])) for (let i = 0; i < 3; i++) S[key][i] += (T[key][i] - S[key][i]) * k;
    else S[key] += (T[key] - S[key]) * k;
  }
  J.body.position.y = S.y;
  J.body.rotation.set(0, 0, S.roll);
  J.torso.rotation.set(S.lean, S.twist, 0);
  J.pelvis.rotation.set(0, S.twist * 0.25, 0);
  J.head.rotation.set(S.headX, S.headY, 0);
  J.legL.rotation.set(S.legL, 0, 0.05); J.kneeL.rotation.set(S.kneeL, 0, 0);
  J.legR.rotation.set(S.legR, 0, -0.05); J.kneeR.rotation.set(S.kneeR, 0, 0);
  J.armR.rotation.set(...S.armR); J.elbowR.rotation.set(S.elbowR, 0, 0);
  J.armL.rotation.set(...S.armL); J.elbowL.rotation.set(S.elbowL, 0, 0);
  J.staff.rotation.set(S.staff, 0, 0);
  // telegraphs: the eyes flare red; punish windows: stars round its head
  const tele = TELE.has(e.state) || e.state === 'beam';
  J.eyes.visible = !tele; J.eyesRed.visible = tele;
  if (tele) J.eyesRed.scale.setScalar(1 + Math.sin(t * 40) * 0.25 * R.flashK);
  const open = OPEN.has(e.state);
  J.stars.visible = open;
  if (open) J.stars.rotation.y = t * 4;
  if (e.state === 'dying') g.position.x += Math.sin(t * 60) * 0.1 * R.motion;

  // ---- the world bits
  const W = g.userData.W || (g.parent ? (g.userData.W = worldBits(g, R.M)) : null);
  if (!W) return;
  const floor = 0;
  // the ankh ward (phase 3): its shell fades in round its front, the ankh turns slowly behind its head
  const wk = e.wardK || 0;
  W.ward.visible = wk > 0.02 && e.state !== 'dying';
  if (W.ward.visible) {
    W.ward.position.copy(g.position); W.ward.rotation.y = g.rotation.y;
    W.shellMat.opacity = (0.26 + 0.1 * Math.sin(t * 6)) * wk * (R.flashK < 1 ? 0.7 : 1); W.ankh.rotation.y = t * 0.8; W.ward.scale.setScalar(0.6 + 0.4 * wk);
  }
  W.waves.forEach((m, i) => {
    const q = e.waves && e.waves[i];
    m.visible = !!q && e.state !== 'dying';
    if (!m.visible) return;
    m.position.set(q.x, floor + 0.45, q.z); m.scale.set(q.r, 1, q.r);
  });
  const under = e.state === 'under', sinking = e.state === 'sinkTele' || e.state === 'sinking' || e.state === 'rise';
  W.swirl.visible = under || sinking;
  if (W.swirl.visible) {
    if (under) W.swirl.position.set(e.riseX, floor + 0.02, e.riseZ); else W.swirl.position.set(e.cx, floor + 0.02, e.cz);
    W.swirl.rotation.y = -t * (under ? 4 + (1 - Math.max(0, e.timer) / Math.max(0.01, e.dur)) * 8 : 6);
    W.swirl.scale.setScalar(under ? 1.0 + Math.sin(t * 10) * 0.04 : 0.8);
  }
  (e.jars || []).forEach((j, i) => {
    const m = W.jarGlow[i]; if (!m) return;
    const gl = (e.glow && e.glow[i]) || 0;
    m.visible = gl > 0.02 && e.state !== 'dying';
    if (m.visible) { m.position.set(j.x, floor + 3.5, j.z); m.material.opacity = Math.min(1, gl) * (0.3 + 0.15 * Math.sin(t * 20)) * (R.flashK < 1 ? 0.6 : 1); }
  });
  if (e.scale) {
    W.scale.visible = true;
    W.scale.position.set(e.scale.x, 17, e.scale.z);
    W.scale.rotation.set(0, 0, -Math.asin(Math.max(-1, Math.min(1, (e.tilt || 0) / e.scale.span))));
  }
}
