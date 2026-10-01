// CENTURION's look: an 8 m legionary mech. Crested galea with a transverse red plume and a glowing
// visor, lorica segmentata bands, red tunic and leather pteruges, gold greaves, a big red-and-gold
// scutum and a long gladius with a neon edge. Built facing +Z with its feet at y = 0; the view poses
// the joints from the sim's state every frame (js/sim/bosses/centurion.js).
import * as THREE from 'three';
import { Kit, box, cyl, part } from '../geo.js';

const C = { steel: 0xb8bcc8, steelHi: 0xd8dce4, steelDk: 0x6a6e7a, dark: 0x24262e, red: 0xc8202a, redDk: 0x8a1820, gold: 0xe8b830, bronze: 0xb07a3a, leather: 0x6a3a22, plume: 0xff2a36, cyan: 0x2be8ff };

function mesh(M, build) {
  const K = new Kit(); build((...g) => K.add('p', ...g), (...g) => K.add('g', ...g));
  const geo = K.build(), grp = new THREE.Group();
  if (geo.p) grp.add(new THREE.Mesh(geo.p, M.paintFlat));
  if (geo.g) grp.add(new THREE.Mesh(geo.g, M.glow));
  return grp;
}
const joint = (parent, x, y, z, name) => { const j = new THREE.Group(); j.position.set(x, y, z); j.name = name; parent.add(j); return j; };

export function centurionModel(M) {
  const g = new THREE.Group();
  const body = joint(g, 0, 0, 0, 'body');
  const J = { body };
  // ---- legs: hip joints at 3.5 m; thigh, knee, shin with a gold greave, boot
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const leg = joint(body, s * 0.8, 3.5, 0, 'leg' + n);
    leg.add(mesh(M, (P) => {
      P(box(0.95, 1.8, 1.0, { y: -0.9, color: C.steelDk }), box(1.05, 0.9, 1.08, { y: -0.6, color: C.steel }), box(0.4, 0.3, 0.3, { x: s * 0.5, y: -0.2, color: C.dark }));
    }));
    const knee = joint(leg, 0, -1.8, 0, 'knee' + n);
    knee.add(mesh(M, (P, G) => {
      P(cyl(0.42, 0.42, 0.8, 8, { rz: Math.PI / 2, color: C.dark }));
      P(box(0.8, 1.6, 0.85, { y: -0.85, color: C.steelDk }), box(0.88, 1.5, 0.3, { y: -0.85, z: 0.38, color: C.gold }), box(0.95, 0.12, 0.92, { y: -0.2, color: C.bronze }));
      P(box(1.0, 0.4, 1.6, { y: -1.75, z: 0.25, color: C.dark }), box(1.02, 0.08, 1.2, { y: -1.45, z: 0.2, color: C.leather }));
      G(box(0.06, 1.2, 0.06, { x: s * 0.43, y: -0.85, z: 0.3, color: C.cyan }));
    }));
    J['leg' + n] = leg; J['knee' + n] = knee;
  }
  // ---- pelvis: belt with gold studs, a red tunic hem, leather strips
  const pelvis = joint(body, 0, 3.6, 0, 'pelvis');
  pelvis.add(mesh(M, (P) => {
    P(box(2.5, 0.45, 1.6, { y: 0, color: C.leather }));
    for (let k = -4; k <= 4; k++) P(box(0.16, 0.16, 0.06, { x: k * 0.27, y: 0, z: 0.82, color: C.gold }));
    P(cyl(1.25, 1.42, 0.8, 10, { y: -0.6, sz: 0.72, color: C.red }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; P(box(0.32, 1.1, 0.07, { x: Math.cos(a) * 1.35, y: -0.95, z: Math.sin(a) * 0.95, ry: -a + Math.PI / 2, color: k % 2 ? C.leather : C.bronze })); }
  }));
  // ---- torso: lorica segmentata bands, chest core, pauldrons, cape
  const torso = joint(body, 0, 3.75, 0, 'torso');
  torso.add(mesh(M, (P, G) => {
    for (let i = 0; i < 5; i++) P(box(2.5 + i * 0.06, 0.42, 1.55 + i * 0.03, { y: 0.25 + i * 0.45, color: i % 2 ? C.steel : C.steelHi }));
    P(box(2.7, 0.55, 1.7, { y: 2.45, color: C.steelHi }), box(1.0, 0.5, 0.3, { y: 2.6, z: 0.75, color: C.steel }));
    for (let i = 0; i < 4; i++) G(box(2.2, 0.05, 0.05, { y: 0.47 + i * 0.45, z: 0.8 + i * 0.015, color: C.cyan }));
    G(cyl(0.32, 0.32, 0.1, 8, { y: 1.45, z: 0.86, rx: Math.PI / 2, color: 0xff3a2a }));
    P(part(new THREE.TorusGeometry(0.42, 0.07, 4, 10), { y: 1.45, z: 0.86, color: C.gold }));
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) P(box(1.15, 0.24, 1.6, { x: s * (1.5 + j * 0.06), y: 2.5 - j * 0.3, rz: s * -(0.35 + j * 0.18), color: j % 2 ? C.steel : C.steelHi }));
    P(cyl(0.38, 0.45, 0.5, 8, { y: 2.9, color: C.dark }));
    P(box(2.3, 3.4, 0.12, { y: 0.9, z: -0.92, rx: 0.1, color: C.red }), box(2.32, 0.2, 0.14, { y: -0.75, z: -1.08, rx: 0.1, color: C.gold })); // the cape
    for (const s of [-1, 1]) G(box(0.3, 0.12, 0.05, { x: s * 0.6, y: 1.9, z: -1.0, color: 0xff8a2a })); // exhaust vents
  }));
  // ---- head: the galea, cheek guards, the visor slit, the transverse crest
  const head = joint(torso, 0, 3.0, 0, 'head');
  head.add(mesh(M, (P) => {
    P(part(new THREE.SphereGeometry(0.8, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), { y: 0.05, sz: 1.08, color: C.steelHi }));
    P(cyl(0.8, 0.8, 0.5, 8, { y: -0.2, sz: 1.08, color: C.steel }));
    P(box(1.7, 0.16, 0.25, { y: 0.12, z: 0.78, color: C.gold }), box(1.2, 0.75, 0.12, { y: -0.3, z: 0.8, color: C.dark }));
    for (const s of [-1, 1]) P(box(0.14, 0.8, 0.7, { x: s * 0.8, y: -0.45, z: 0.25, rz: s * 0.08, color: C.steel }));
    P(box(1.5, 0.5, 0.15, { y: -0.45, z: -0.8, rx: -0.5, color: C.steel }));
    P(box(0.25, 0.25, 1.9, { y: 0.85, color: C.gold }));
    for (let k = 0; k < 13; k++) { const a = ((k / 12) - 0.5) * 2.9; P(box(0.24, 0.8, 0.2, { x: Math.sin(a) * 1.0, y: 0.55 + Math.cos(a) * 0.62, rz: -a, color: k % 2 ? C.plume : 0xd81824 })); }
  }));
  const visor = mesh(M, (P, G) => G(box(1.0, 0.13, 0.08, { color: C.cyan }), box(0.13, 0.4, 0.08, { y: -0.2, color: C.cyan })));
  visor.position.set(0, -0.18, 0.88); visor.name = 'visor'; head.add(visor);
  const visorRed = mesh(M, (P, G) => G(box(1.1, 0.18, 0.09, { color: 0xff2a2a }), box(0.16, 0.45, 0.09, { y: -0.22, color: 0xff2a2a })));
  visorRed.position.set(0, -0.18, 0.89); visorRed.name = 'visorRed'; visorRed.visible = false; head.add(visorRed);
  // dizzy stars over the helmet (the punish window)
  const stars = mesh(M, (P, G) => { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; G(box(0.3, 0.3, 0.3, { x: Math.cos(a) * 1.1, z: Math.sin(a) * 1.1, ry: a, rz: 0.78, color: 0xffe040 })); } });
  stars.position.y = 1.9; stars.name = 'stars'; stars.visible = false; head.add(stars);
  // ---- arms: shoulder → elbow → fist. The right fist holds the gladius as an extension of the forearm.
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const arm = joint(torso, s * 1.7, 2.25, 0, 'arm' + n);
    arm.add(mesh(M, (P) => { P(box(0.78, 1.5, 0.82, { y: -0.7, color: C.steelDk }), box(0.86, 0.3, 0.9, { y: -0.35, color: C.red })); }));
    const elbow = joint(arm, 0, -1.45, 0, 'elbow' + n);
    elbow.add(mesh(M, (P) => { P(cyl(0.36, 0.36, 0.7, 8, { rz: Math.PI / 2, color: C.dark }), box(0.66, 1.25, 0.72, { y: -0.65, color: C.steel }), box(0.72, 0.35, 0.78, { y: -1.0, color: C.gold }), box(0.62, 0.55, 0.62, { y: -1.45, color: C.dark })); }));
    J['arm' + n] = arm; J['elbow' + n] = elbow;
  }
  const sword = joint(J.elbowR, 0, -1.45, 0, 'sword');
  sword.add(mesh(M, (P, G) => {
    P(box(1.0, 0.16, 0.3, { y: -0.3, color: C.gold }), cyl(0.12, 0.12, 0.5, 6, { y: 0.0, color: C.leather }), part(new THREE.IcosahedronGeometry(0.2, 0), { y: 0.35, color: C.gold }));
    P(box(0.48, 4.2, 0.1, { y: -2.45, color: C.steelHi }), part(new THREE.ConeGeometry(0.34, 0.8, 4), { y: -4.95, rx: Math.PI, ry: Math.PI / 4, sz: 0.3, color: C.steelHi }));
    G(box(0.05, 4.2, 0.12, { x: 0.25, y: -2.45, color: C.cyan }), box(0.05, 4.2, 0.12, { x: -0.25, y: -2.45, color: C.cyan }));
  }));
  J.sword = sword;
  // ---- the scutum (posed against the body, not the arm: it lerps between guard, side and overhead)
  const shield = joint(body, 0.45, 3.4, 1.75, 'shield');
  shield.add(mesh(M, (P, G) => {
    P(box(2.6, 4.5, 0.26, { color: C.red }));
    for (const s of [-1, 1]) P(box(0.3, 4.5, 0.28, { x: s * 1.38, z: -0.14, ry: s * 0.45, color: C.redDk }));
    P(box(2.9, 0.18, 0.3, { y: 2.25, color: C.gold }), box(2.9, 0.18, 0.3, { y: -2.25, color: C.gold }));
    P(part(new THREE.SphereGeometry(0.42, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), { z: 0.13, rx: Math.PI / 2, color: C.gold }));
    for (const s of [-1, 1]) { G(box(1.1, 0.18, 0.08, { x: s * 0.7, y: 0.9, z: 0.16, rz: s * 0.5, color: 0xffd040 }), box(1.1, 0.18, 0.08, { x: s * 0.7, y: -0.9, z: 0.16, rz: -s * 0.5, color: 0xffd040 })); } // the eagle's wings
    G(box(0.1, 1.6, 0.08, { y: 1.5, z: 0.16, color: 0xffd040 }), box(0.1, 1.6, 0.08, { y: -1.5, z: 0.16, color: 0xffd040 }));
    for (const s of [-1, 1]) G(box(0.06, 4.4, 0.06, { x: s * 1.52, z: -0.05, color: C.cyan }));
  }));
  J.shield = shield;
  const jav = mesh(M, (P, G) => { P(cyl(0.07, 0.07, 4.4, 5, { rx: Math.PI / 2, color: C.leather })); G(part(new THREE.ConeGeometry(0.16, 0.7, 4), { z: 2.5, rx: Math.PI / 2, color: 0xffb040 })); });
  jav.name = 'javelin'; jav.visible = false; body.add(jav); J.javelin = jav;
  Object.assign(J, { pelvis, torso, head, visor, visorRed, stars });
  g.userData.J = J;
  g.userData.pose = null;
  return g;
}

// ------------------------------------------------------------------ posing
const UP = { p: [0.45, 3.4, 1.75], r: [0, 0, 0] }, DOWN = { p: [2.2, 2.3, 0.2], r: [0.12, -1.3, 0.15] }, OVER = { p: [0.2, 8.7, 0.2], r: [-1.42, 0, 0] };
const TELE = new Set(['sweepTele', 'stompTele', 'chargeTele', 'throwTele', 'spinTele', 'shrugTele']);
const OPEN = new Set(['recover', 'stagger', 'dizzy', 'reel']);
const lerp = (a, b, k) => a + (b - a) * k;

function target(e, t) {
  const k = e.dur > 0 ? Math.min(1, e.st / e.dur) : 1, s = e.state;
  const ph = e.gait * 1.5, sw = Math.sin(ph);
  const T = { y: Math.abs(Math.cos(ph)) * 0.08, lean: 0.06, twist: 0, roll: 0, headX: 0, armR: [-1.0, 0, 0.12], elbowR: -0.55, armL: [-0.9, 0, -0.25], elbowL: -0.7,
    legL: sw * 0.42, kneeL: Math.max(0, sw) * 0.7, legR: -sw * 0.42, kneeR: Math.max(0, -sw) * 0.7, over: 0, rate: 9 };
  switch (s) {
    case 'intro': case 'roar': Object.assign(T, { headX: -0.35, armR: [-0.3, 0, 1.1 * -1], armL: [-0.3, 0, 1.1], elbowR: -0.3, elbowL: -0.3, legL: 0, legR: 0, kneeL: 0, kneeR: 0, lean: -0.1 }); break;
    case 'sweepTele': Object.assign(T, { y: -0.6, lean: 0.25, twist: -0.5, armR: [0, -1.0, -0.75], elbowR: 0, legL: -0.4, kneeL: 0.6, legR: 0.3, kneeR: 0.5, rate: 6 }); break;
    case 'sweep': Object.assign(T, { y: -0.6, lean: 0.25, twist: lerp(-0.5, 0.9, k), armR: [0, lerp(-1.0, 2.8, k), -0.75], elbowR: 0, legL: -0.4, kneeL: 0.6, legR: 0.3, kneeR: 0.5, rate: 30 }); break;
    case 'stompTele': Object.assign(T, { lean: -0.12, legR: -1.15 * k, kneeR: 1.5 * k, legL: 0.05, kneeL: 0.15, armR: [-0.4, 0, -0.6], armL: [-0.9, 0, 0.3], rate: 8 }); break;
    case 'stomp': Object.assign(T, { y: -0.35, lean: 0.15, legR: 0, kneeR: 0.2, legL: 0.1, kneeL: 0.4, rate: 30 }); break;
    case 'chargeTele': Object.assign(T, { y: -0.7, lean: 0.4, legL: -0.7, kneeL: 1.2, legR: 0.5, kneeR: 0.9, armR: [-0.2, 0, -0.3], elbowR: -0.4, rate: 7 }); break;
    case 'charge': { const r = Math.sin(e.gait * 0.9); Object.assign(T, { y: -0.4, lean: 0.5, legL: r * 0.9, kneeL: Math.max(0, r) * 1.2, legR: -r * 0.9, kneeR: Math.max(0, -r) * 1.2, armR: [0.3, 0, -0.3], elbowR: -0.5, rate: 20 }); break; }
    case 'skid': Object.assign(T, { y: -0.6, lean: 0.25, legL: -0.6, kneeL: 1.0, legR: 0.6, kneeR: 0.4 }); break;
    case 'throwTele': Object.assign(T, { lean: -0.12, twist: -0.35, armR: [2.5, 0, -0.15], elbowR: -0.4, legL: -0.25, legR: 0.2, kneeL: 0.2, kneeR: 0.2, rate: 7 }); break;
    case 'throw': { const q = Math.min(1, e.st / 0.25); Object.assign(T, { lean: lerp(-0.12, 0.25, q), twist: lerp(-0.35, 0.3, q), armR: [lerp(2.5, 0.2, q), 0, -0.15], elbowR: lerp(-0.4, 0, q), legL: -0.25, legR: 0.2, rate: 25 }); break; }
    case 'spinTele': case 'spin': Object.assign(T, { y: -0.3, lean: 0.1, armR: [0, 0, -0.85], elbowR: 0, armL: [0, 0, 1.1], elbowL: 0, rate: s === 'spin' ? 20 : 8 }); break;
    case 'recover': case 'stagger': case 'dizzy': case 'reel': {
      const wob = Math.sin(t * (s === 'reel' ? 9 : 4));
      Object.assign(T, { y: -0.35, lean: s === 'reel' ? -0.25 : 0.32, roll: wob * 0.12, headX: 0.45, armR: [0.15, 0, -0.35], elbowR: -0.1, armL: [0.1, 0, 0.45], elbowL: -0.1, legL: -0.15, legR: 0.2, kneeL: 0.4, kneeR: 0.3, rate: 6 });
      break;
    }
    case 'shrugTele': Object.assign(T, { y: -0.2, lean: -0.1, headX: -0.3, armL: [-2.9, 0, 0.2], elbowL: -0.2, armR: [-2.6, 0, -0.3], elbowR: -0.3, over: k, rate: 10 }); break;
    case 'dying': Object.assign(T, { y: -0.9, lean: 0.55, roll: 0.3, headX: 0.6, armR: [0.4, 0, -0.5], armL: [0.3, 0, 0.6], legL: -0.5, kneeL: 1.3, legR: -0.3, kneeR: 1.1, rate: 2 }); break;
    default: break;
  }
  return T;
}

const _p = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler();
export function centurionUpdate(R, e, g, dt, t, P) {
  const J = g.userData.J;
  g.position.set(e.cx, e.cy - e.bodyH, e.cz);
  g.rotation.y = Math.atan2(e.fx, e.fz) + (e.state === 'spin' ? e.spinA : 0);
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
  J.pelvis.rotation.set(0, S.twist * 0.3, 0);
  J.head.rotation.set(S.headX, 0, 0);
  J.legL.rotation.set(S.legL, 0, 0.04); J.kneeL.rotation.set(S.kneeL, 0, 0);
  J.legR.rotation.set(S.legR, 0, -0.04); J.kneeR.rotation.set(S.kneeR, 0, 0);
  J.armR.rotation.set(...S.armR); J.elbowR.rotation.set(S.elbowR, 0, 0);
  J.armL.rotation.set(...S.armL); J.elbowL.rotation.set(S.elbowL, 0, 0);
  // the shield: down at its side ↔ up in front (e.shield), and overhead for the shrug
  const sh = Math.max(0, Math.min(1, e.shield)), ov = S.over;
  _p.set(lerp(DOWN.p[0], UP.p[0], sh), lerp(DOWN.p[1], UP.p[1], sh), lerp(DOWN.p[2], UP.p[2], sh));
  _q1.setFromEuler(_e.set(DOWN.r[0], DOWN.r[1], DOWN.r[2])); _q2.setFromEuler(_e.set(UP.r[0], UP.r[1], UP.r[2])); _q1.slerp(_q2, sh);
  if (ov > 0.001) { _p.lerp(new THREE.Vector3(...OVER.p), ov); _q1.slerp(_q2.setFromEuler(_e.set(...OVER.r)), ov); }
  J.shield.position.copy(_p); J.shield.quaternion.copy(_q1);
  // the javelin, raised by the right shoulder while it winds up
  const javOn = e.state === 'throwTele' || (e.state === 'throw' && e.left > 0 && e.st > 0.15);
  J.javelin.visible = javOn;
  if (javOn) { J.javelin.position.set(-1.8, 7.6, -0.3); J.javelin.rotation.set(-0.12, 0, 0); }
  // telegraphs: the visor flares red; open windows: stars over the helmet
  const tele = TELE.has(e.state);
  J.visor.visible = !tele; J.visorRed.visible = tele;
  if (tele) J.visorRed.scale.setScalar(1 + Math.sin(t * 40) * 0.25 * R.flashK);
  const open = OPEN.has(e.state);
  J.stars.visible = open;
  if (open) J.stars.rotation.y = t * 4;
  if (e.state === 'dying') g.position.x += Math.sin(t * 60) * 0.1 * R.motion;
}
