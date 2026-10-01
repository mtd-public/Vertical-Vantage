// POLARIS's look: a 9 m polar-bear warden mech. White armour plates over a frosted grey chassis,
// glacier-blue light strips along every seam, a visor across its eyes (its own unfogged material: in
// the blizzard it's all you see), frost vents on its back that open after the breath, and an orange
// core that shows between the plates whenever they lift (the punish window). Built facing +Z, feet at
// y = 0; the view poses the joints from the sim (js/sim/bosses/polaris.js) and draws its effects in
// world space: the frost-breath cone, the slide lane, the spike rings, the thrown ice blocks, and the
// blizzard (snow round the camera, the fog closing in).
import * as THREE from 'three';
import { Kit, box, cyl, part } from '../geo.js';
import { tuning as PT } from '../../sim/bosses/polaris-tuning.js';
import { makeSnow } from './arctic-backdrops.js';

const C = { white: 0xf2f5f7, whiteSh: 0xd2dae2, chassis: 0x8e9aa8, chassisDk: 0x5a6674, joint: 0x3a424e, claw: 0xc8d2dc, nose: 0x1a1e24, strip: 0x46d6ff, core: 0xffa040 };
const own = (m) => { m.userData.own = true; return m; };
function mergeVisor(list) { const K = new Kit(); K.add('v', ...list); return K.build().v; }

function mesh(M, build) {
  const K = new Kit(); build((...g) => K.add('p', ...g), (...g) => K.add('g', ...g));
  const geo = K.build(), grp = new THREE.Group();
  if (geo.p) { const m = new THREE.Mesh(geo.p, M.paintFlat); m.name = 'paint'; grp.add(m); }
  if (geo.g) { const m = new THREE.Mesh(geo.g, M.glow); m.name = 'strip'; grp.add(m); }
  return grp;
}
const joint = (parent, x, y, z, name) => { const j = new THREE.Group(); j.position.set(x, y, z); j.name = name; parent.add(j); return j; };

export function polarisModel(M) {
  const g = new THREE.Group();
  const body = joint(g, 0, 0, 0, 'body');
  const J = { body };
  // ---- hind legs: big armoured haunches
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const leg = joint(body, s * 1.3, 2.5, -2.3, 'hind' + n);
    leg.add(mesh(M, (P, G) => {
      P(box(1.3, 1.7, 1.8, { y: -0.6, color: C.chassis }), box(1.45, 1.3, 1.9, { x: s * 0.06, y: -0.3, color: C.white }));
      G(box(0.06, 1.0, 1.5, { x: s * 0.76, y: -0.4, color: C.strip }));
    }));
    const knee = joint(leg, 0, -1.4, 0.2, 'hindKnee' + n);
    knee.add(mesh(M, (P) => {
      P(box(0.95, 1.1, 1.0, { y: -0.45, color: C.chassisDk }), box(1.0, 0.7, 0.9, { y: -0.3, z: 0.15, color: C.white }));
      P(box(1.25, 0.45, 1.6, { y: -1.0, z: 0.3, color: C.chassisDk }), box(1.3, 0.2, 1.65, { y: -0.8, z: 0.3, color: C.white }));
      for (const c of [-0.4, 0, 0.4]) P(part(new THREE.ConeGeometry(0.1, 0.45, 4), { x: c, y: -1.1, z: 1.15, rx: Math.PI / 2 + 0.4, color: C.claw }));
    }));
    J['hind' + n] = leg; J['hindKnee' + n] = knee;
  }
  // ---- the torso pivots at the hips (it rears up round them)
  const hips = joint(body, 0, 2.5, -2.6, 'hips');
  hips.add(mesh(M, (P, G) => {
    P(box(2.8, 2.2, 5.6, { y: 0.5, z: 2.2, color: C.chassis })); // the frosted chassis
    P(box(2.4, 0.5, 5.0, { y: -0.7, z: 2.2, color: C.chassisDk })); // the belly
    for (const s of [-1, 1]) {
      P(box(0.28, 1.5, 4.8, { x: s * 1.5, y: 0.55, z: 2.1, color: C.white })); // flank plates
      G(box(0.06, 0.08, 4.6, { x: s * 1.66, y: -0.15, z: 2.1, color: C.strip }), box(0.06, 0.08, 4.6, { x: s * 1.66, y: 1.25, z: 2.1, color: C.strip }));
      P(box(1.2, 1.8, 1.9, { x: s * 1.45, y: 0.9, z: 4.4, color: C.white }), box(1.0, 0.3, 1.7, { x: s * 1.5, y: 1.9, z: 4.4, color: C.whiteSh })); // shoulder plates
      G(box(0.06, 1.4, 0.08, { x: s * 2.06, y: 0.9, z: 4.4, color: C.strip }));
    }
    P(box(1.6, 1.5, 1.7, { y: 1.1, z: 5.4, rx: -0.3, color: C.chassis }), box(1.7, 0.4, 1.5, { y: 1.85, z: 5.3, rx: -0.3, color: C.white })); // the neck
    P(box(1.4, 1.0, 1.0, { y: 0.9, z: -0.7, color: C.white }), box(0.6, 0.5, 0.6, { y: 1.1, z: -1.2, color: C.white })); // rump and stub tail
  }));
  // the back plates (they lift in the punish windows), the core under them, the frost vents
  const plates = joint(hips, 0, 1.65, 2.2, 'plates');
  plates.add(mesh(M, (P, G) => {
    for (let k = 0; k < 4; k++) {
      const z = -2.2 + k * 1.45;
      P(box(3.1, 0.34, 1.6, { y: 0.1 + (k % 2) * 0.06, z, rx: -0.08, color: C.white }), box(2.6, 0.22, 1.5, { y: 0.32 + (k % 2) * 0.06, z, rx: -0.08, color: C.white }));
      G(box(3.0, 0.06, 0.08, { y: 0.0, z: z + 0.78, color: C.strip }));
    }
  }));
  const core = mesh(M, (P, G) => { G(box(2.3, 0.12, 5.0, { color: C.core })); for (let k = 0; k < 4; k++) G(box(2.6, 0.3, 0.12, { y: 0.1, z: -2.2 + k * 1.45 + 0.75, color: C.core })); });
  core.position.set(0, 1.62, 2.2); core.name = 'core'; core.visible = false; hips.add(core);
  const vents = [];
  for (const s of [-1, 1]) {
    const v = joint(hips, s * 0.7, 2.15, 1.0, 'vent');
    v.add(mesh(M, (P, G) => { P(box(0.9, 0.12, 1.4, { color: C.joint })); G(box(0.7, 0.04, 1.2, { y: 0.07, color: 0xbff4ff })); }));
    vents.push(v);
  }
  // ---- the head: helmet, snout, ears, the visor, the jaw
  const head = joint(hips, 0, 1.25, 6.0, 'head');
  head.add(mesh(M, (P, G) => {
    P(box(1.6, 1.2, 1.6, { color: C.white }), box(1.45, 0.25, 1.4, { y: 0.68, color: C.whiteSh }));
    P(box(1.7, 0.22, 0.5, { y: 0.62, z: 0.62, color: C.white })); // the brow plate over the visor
    P(box(1.0, 0.72, 1.7, { y: -0.3, z: 1.35, color: C.white }), box(0.86, 0.2, 1.5, { y: 0.08, z: 1.4, color: C.whiteSh }), box(0.46, 0.32, 0.22, { y: -0.05, z: 2.22, color: C.nose }));
    for (const s of [-1, 1]) { P(box(0.42, 0.42, 0.22, { x: s * 0.62, y: 0.82, z: -0.45, color: C.white }), box(0.22, 0.22, 0.1, { x: s * 0.62, y: 0.82, z: -0.33, color: C.chassisDk })); G(box(0.06, 0.5, 0.06, { x: s * 0.82, y: -0.25, z: 0.75, color: C.strip })); }
  }));
  const visorMat = own(new THREE.MeshBasicMaterial({ color: 0xbff8ff, fog: false }));
  const visor = new THREE.Mesh(mergeVisor([box(1.66, 0.3, 0.12, { y: 0.36, z: 0.82 }), box(0.1, 0.26, 0.9, { x: 0.82, y: 0.36, z: 0.4 }), box(0.1, 0.26, 0.9, { x: -0.82, y: 0.36, z: 0.4 })]), visorMat); // wraps round the front
  visor.name = 'visor'; head.add(visor);
  const haloMat = own(new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const halo = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), haloMat); // the visor's glow in the snow
  halo.name = 'visor'; halo.position.set(0, 0.36, 0.9); halo.scale.set(1.4, 0.6, 0.5); head.add(halo);
  const jaw = joint(head, 0, -0.55, 0.6, 'jaw');
  jaw.add(mesh(M, (P, G) => { P(box(1.0, 0.32, 1.6, { z: 0.7, color: C.chassisDk })); G(box(0.8, 0.06, 1.2, { y: 0.17, z: 0.7, color: 0xbff4ff })); }));
  const stars = mesh(M, (P, G) => { for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; G(box(0.32, 0.32, 0.32, { x: Math.cos(a) * 1.3, z: Math.sin(a) * 1.3, ry: a, rz: 0.78, color: k % 2 ? 0xbff8ff : 0xffe040 })); } });
  stars.position.y = 1.6; stars.name = 'stars'; stars.visible = false; head.add(stars);
  // ---- front legs: shoulder → elbow → paw (claws forward)
  for (const [s, n] of [[1, 'L'], [-1, 'R']]) {
    const leg = joint(hips, s * 1.35, 0.1, 4.6, 'front' + n);
    leg.add(mesh(M, (P, G) => { P(box(1.05, 2.0, 1.15, { y: -0.85, color: C.chassis }), box(1.15, 1.2, 1.25, { y: -0.4, color: C.white })); G(box(0.06, 1.1, 0.06, { x: s * 0.6, y: -0.7, z: 0.5, color: C.strip })); }));
    const elbow = joint(leg, 0, -1.85, 0, 'elbow' + n);
    elbow.add(mesh(M, (P) => {
      P(box(0.95, 1.4, 1.0, { y: -0.6, color: C.chassisDk }), box(1.0, 0.8, 1.05, { y: -0.45, z: 0.06, color: C.white }));
      P(box(1.3, 0.42, 1.7, { y: -1.35, z: 0.35, color: C.chassisDk }), box(1.35, 0.18, 1.75, { y: -1.17, z: 0.35, color: C.white }));
      for (const c of [-0.42, -0.14, 0.14, 0.42]) P(part(new THREE.ConeGeometry(0.1, 0.55, 4), { x: c, y: -1.45, z: 1.35, rx: Math.PI / 2 + 0.3, color: C.claw }));
    }));
    J['front' + n] = leg; J['elbow' + n] = elbow;
  }
  Object.assign(J, { hips, plates, core, vents, head, visor, visorMat, halo, haloMat, jaw, stars });
  g.userData.J = J;
  g.userData.pose = null;
  return g;
}

// ------------------------------------------------------------------ posing
const TELE = new Set(['rearTele', 'breathTele', 'slideTele', 'poundTele', 'hurlTele', 'lungeTele', 'blizzardTele', 'shakeTele']);
const DIZZY = new Set(['beached', 'crash', 'dazed', 'reel']);
const BELLY = new Set(['slideTele', 'slide', 'beached', 'crash']);
const lerp = (a, b, k) => a + (b - a) * k;

function target(e, t) {
  const k = e.dur > 0 ? Math.min(1, e.st / e.dur) : 1, s = e.state;
  const ph = e.gait * 0.9, sw = Math.sin(ph), sw2 = Math.sin(ph + Math.PI);
  const T = { y: Math.abs(Math.cos(ph)) * 0.08, pitch: 0, roll: 0, headX: 0.12, headY: 0, jaw: 0,
    fL: sw * 0.45, eL: Math.max(0, -sw) * 0.5, fR: sw2 * 0.45, eR: Math.max(0, -sw2) * 0.5, fZL: 0, fZR: 0,
    hL: sw2 * 0.4, kL: Math.max(0, sw2) * 0.5, hR: sw * 0.4, kR: Math.max(0, sw) * 0.5, splay: 0, rate: 9 };
  const rear = (p, up) => Object.assign(T, { pitch: p, y: 0, hL: 0.55, kL: -0.5, hR: 0.55, kR: -0.5, fL: up, fR: up, eL: -0.4, eR: -0.4, headX: -0.25, rate: 7 });
  switch (s) {
    case 'intro': case 'roar': rear(-0.85, -1.4); Object.assign(T, { jaw: 0.6, headX: -0.5, fZL: -0.5, fZR: 0.5 }); break;
    case 'rearTele': rear(-1.0, -1.7); Object.assign(T, { fZR: -0.9, jaw: 0.35 }); break;
    case 'swipe1': rear(-0.9, -1.4); Object.assign(T, { fR: -1.2, fZR: lerp(-0.9, 1.1, Math.min(1, k * 2)), rate: 26 }); break;
    case 'swipe2': rear(-0.75, -1.2); Object.assign(T, { fR: -0.6, fZR: 0.6, fL: -1.4, fZL: lerp(0.9, -1.1, Math.min(1, k * 2)), rate: 26 }); break;
    case 'poundTele': rear(-1.25, -2.6); Object.assign(T, { jaw: 0.5, headX: -0.4 }); break;
    case 'pound': Object.assign(T, { pitch: 0.12, y: -0.4, fL: -0.3, fR: -0.3, eL: 0.2, eR: 0.2, headX: 0.4, rate: 30 }); break;
    case 'blizzardTele': rear(-0.95, -1.8); Object.assign(T, { jaw: 0.7, headX: -0.6, fZL: -0.6, fZR: 0.6 }); break;
    case 'hurlTele': rear(-0.8, -2.7); Object.assign(T, { eL: -0.6, eR: -0.6 }); break;
    case 'hurl': { const q = Math.min(1, e.st / 0.25); rear(lerp(-0.8, -0.3, q), lerp(-2.7, -0.6, q)); T.rate = 22; break; }
    case 'winded': case 'recover': case 'vent': Object.assign(T, { y: -0.25 + Math.sin(t * 8) * 0.06, pitch: 0.08, headX: 0.45, fL: -0.2, fR: 0.15, hL: 0.1, hR: -0.1, rate: 6 }); if (s === 'vent') T.jaw = 0.2; break;
    case 'breathTele': Object.assign(T, { y: 0.1, pitch: -0.08, headX: -0.15 - k * 0.15, jaw: k * 0.4, fL: 0.25, fR: -0.25, hL: -0.15, hR: 0.15, rate: 6 }); break;
    case 'breath': Object.assign(T, { y: 0, pitch: -0.05, headX: -(e.breathPitch || 0) + 0.05, jaw: 0.65, fL: 0.3, fR: -0.3, rate: 12 }); break;
    case 'slideTele': Object.assign(T, { y: -1.45 + Math.sin(t * 14) * 0.05, pitch: 0.06, splay: 1, fL: -1.35, fR: -1.35, eL: 0, eR: 0, hL: 1.25, hR: 1.25, kL: 0, kR: 0, headX: -0.05, rate: 7 }); break;
    case 'slide': case 'beached': case 'crash': Object.assign(T, { y: -1.45, pitch: 0.06, splay: 1, fL: -1.45, fR: -1.45, eL: 0, eR: 0, hL: 1.3, hR: 1.3, kL: 0, kR: 0, headX: s === 'slide' ? -0.05 : 0.25, roll: s === 'slide' ? 0 : Math.sin(t * 5) * 0.08, rate: 10 }); break;
    case 'getUp': Object.assign(T, { y: -0.6, rate: 6 }); break;
    case 'lungeTele': Object.assign(T, { y: -0.7, pitch: 0.05, fL: 0.4, fR: 0.4, eL: 0.8, eR: 0.8, hL: -0.5, kL: 0.9, hR: -0.5, kR: 0.9, headX: -0.1, jaw: 0.3, rate: 8 }); break;
    case 'lunge': Object.assign(T, { y: 0, pitch: -0.25, fL: -1.3, fR: -1.3, eL: -0.2, eR: -0.2, hL: 1.0, hR: 1.0, kL: 0, kR: 0, jaw: 0.6, rate: 14 }); break;
    case 'maul': Object.assign(T, { y: -0.3, pitch: 0.18, fL: lerp(-1.6, 0.2, Math.min(1, k * 3)), fR: lerp(-1.6, 0.2, Math.min(1, k * 3)), jaw: 0.5, headX: 0.35, rate: 20 }); break;
    case 'dazed': case 'reel': Object.assign(T, { y: -0.3, roll: Math.sin(t * (s === 'reel' ? 9 : 4)) * 0.12, pitch: s === 'reel' ? -0.15 : 0.1, headX: 0.5, headY: Math.sin(t * 3) * 0.3, fL: 0.2, fR: -0.15, rate: 6 }); break;
    case 'shakeTele': Object.assign(T, { y: 0.1, roll: Math.sin(t * 38) * 0.22, headY: Math.sin(t * 38 + 1) * 0.35, rate: 30 }); break;
    case 'dying': Object.assign(T, { y: -1.3, roll: 0.35, pitch: 0.1, headX: 0.7, splay: 1, fL: -1.2, fR: -0.8, hL: 1.1, hR: 0.9, kL: 0, kR: 0, rate: 2 }); break;
    case 'hurlEnd': case 'prowl': case 'stalk': default: break;
  }
  return T;
}

// ------------------------------------------------------------------ world-space effects
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
const DECAL = { transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }; // (red on white ice: normal blending reads, additive washes out)
function effects(g, R, e) {
  const U = g.userData;
  if (U.fx) return U;
  const fx = new THREE.Group(); fx.name = 'polarisFx';
  g.parent.add(fx);
  const range = PT.breath.range, rad = range * Math.tan(PT.breath.half);
  const coneGeo = new THREE.ConeGeometry(rad, range, 18, 1, true); coneGeo.rotateX(-Math.PI / 2); coneGeo.translate(0, 0, range / 2); // apex at the mouth, opening along +z
  U.coneMat = own(new THREE.MeshBasicMaterial({ color: 0xbff4ff, opacity: 0.3, ...ADD }));
  U.cone = new THREE.Mesh(coneGeo, U.coneMat); U.cone.visible = false; U.cone.renderOrder = 6; fx.add(U.cone);
  U.laneMat = own(new THREE.MeshBasicMaterial({ color: 0xff2a3a, opacity: 0.3, ...DECAL }));
  const laneGeo = new THREE.PlaneGeometry(1, 1); laneGeo.rotateX(-Math.PI / 2); laneGeo.translate(0, 0, 0.5);
  U.lane = new THREE.Mesh(laneGeo, U.laneMat); U.lane.visible = false; U.lane.renderOrder = 5; fx.add(U.lane);
  // the spike rings: one annulus and one ring of ice spikes per band
  U.rings = PT.pound.band.map(([r0, r1], i) => {
    const mat = own(new THREE.MeshBasicMaterial({ color: 0xff2a3a, opacity: 0.4, ...DECAL }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 56), mat); ring.rotation.x = -Math.PI / 2; ring.renderOrder = 5;
    const K = new Kit(), n = Math.round(r1 * 3.2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + i, r = r0 + 0.4 + ((k * 37) % 10) / 10 * (r1 - r0 - 0.8), h = 1.8 + ((k * 13) % 7) * 0.22;
      K.add('p', part(new THREE.ConeGeometry(0.5, h, 4), { x: Math.cos(a) * r, y: h / 2 - 0.1, z: Math.sin(a) * r, rx: Math.sin(a + k) * 0.25, rz: Math.cos(a + k) * 0.25, color: k % 3 ? 0xeafcff : 0x7fd8f0 }));
    }
    const spikes = new THREE.Mesh(K.build().p, own(new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, flatShading: true })));
    ring.visible = spikes.visible = false;
    fx.add(ring, spikes);
    return { ring, spikes, mat, r0 };
  });
  // the thrown blocks of ice (and the one it holds overhead before it throws)
  const blockGeo = box(1.9, 1.5, 1.7, { color: 0xbfe6f2 });
  const blockMat = own(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  U.lobs = [0, 1, 2].map(() => { const m = new THREE.Mesh(blockGeo, blockMat); m.visible = false; fx.add(m); return m; });
  U.held = new THREE.Mesh(blockGeo, blockMat); U.held.visible = false; fx.add(U.held);
  // the blizzard: thick snow round the camera, and the fog closing in
  U.snow = makeSnow(1700, { wind: 0.9, size: 1.4, k: 0, seed: 941 }); U.snow.visible = false; fx.add(U.snow);
  const f = R.scene.fog; U.fog0 = f ? { near: f.near, far: f.far, color: f.color.clone() } : null;
  U.fogWhite = new THREE.Color(0xa8bccc);
  U.fx = fx; U.puff = 0;
  return U;
}

const _v = new THREE.Vector3();
export function polarisUpdate(R, e, g, dt, t, P) {
  const J = g.userData.J, U = effects(g, R, e), s = e.state;
  g.position.set(e.cx, e.y, e.cz);
  g.rotation.y = Math.atan2(e.fx, e.fz);
  R.flashModel(g, e.flash > 0 || (s === 'dying' && Math.sin(t * 30) > 0));
  // ---- pose
  const T = target(e, t);
  let S = g.userData.pose;
  if (!S) S = g.userData.pose = { ...T };
  const k = Math.min(1, dt * T.rate);
  for (const key in T) if (key !== 'rate') S[key] += (T[key] - S[key]) * k;
  J.body.position.y = S.y;
  J.body.rotation.set(0, 0, S.roll);
  J.hips.rotation.set(S.pitch, 0, 0);
  J.head.rotation.set(S.headX - S.pitch * 0.6, S.headY, 0);
  J.jaw.rotation.set(S.jaw, 0, 0);
  J.frontL.rotation.set(S.fL, 0, S.fZL - S.splay * 0.5); J.elbowL.rotation.set(S.eL, 0, 0);
  J.frontR.rotation.set(S.fR, 0, S.fZR + S.splay * 0.5); J.elbowR.rotation.set(S.eR, 0, 0);
  J.hindL.rotation.set(S.hL, 0, -S.splay * 0.4); J.hindKneeL.rotation.set(S.kL, 0, 0);
  J.hindR.rotation.set(S.hR, 0, S.splay * 0.4); J.hindKneeR.rotation.set(S.kR, 0, 0);
  // ---- the plates lift and the core glows while it's open to punishment; the vents open after the breath
  const open = e.vuln > 1 && s !== 'dying';
  J.plates.position.y = 1.65 + (open ? 0.35 + Math.sin(t * 10) * 0.04 : 0);
  J.core.visible = open;
  for (const v of J.vents) v.rotation.x = -1.1 * Math.min(1, e.vent * 1.5);
  // ---- the visor: cold white normally, hot magenta on every tell, a beacon in the blizzard
  const tele = TELE.has(s) || s === 'roar';
  J.visorMat.color.setHex(tele ? (Math.sin(t * 30) > -0.2 || R.flashK < 1 ? 0xff3a7a : 0xffa0c0) : 0xbff8ff);
  J.visor.scale.set(1 + (s === 'lungeTele' ? 0.5 + Math.sin(t * 25) * 0.3 * R.flashK : 0), 1 + (e.bliz > 0.3 ? 0.6 : 0), 1);
  J.haloMat.opacity = Math.min(1, e.bliz) * (s === 'lungeTele' ? 0.9 : 0.55) + (tele ? 0.15 : 0);
  J.haloMat.color.setHex(tele ? 0xff4a8a : 0x8ff0ff);
  J.stars.visible = DIZZY.has(s);
  if (J.stars.visible) J.stars.rotation.y = t * 4;
  // ---- the blizzard: the snow comes in, the fog closes, the body is lost in it (only the visor shows)
  const bk = s === 'dying' || e.dead ? 0 : Math.min(1, e.bliz);
  if (U.fog0 && R.scene.fog) {
    const f = R.scene.fog;
    f.near = lerp(U.fog0.near, 3, bk); f.far = lerp(U.fog0.far, 30, bk);
    f.color.copy(U.fog0.color).lerp(U.fogWhite, bk * 0.85);
  }
  U.snow.visible = bk > 0.02; U.snow.material.uniforms.uK.value = bk * 0.95;
  const hidden = bk > 0.55 && (s === 'stalk' || s === 'lungeTele' || s === 'blizzardTele');
  g.traverse((m) => { if (m.isMesh && m.name !== 'visor' && (m.name === 'paint' || m.name === 'strip')) m.visible = !hidden; });
  // ---- the frost-breath cone (faint where the sweep will start, solid while it breathes)
  const breathing = s === 'breath', aiming = s === 'breathTele';
  U.cone.visible = breathing || aiming;
  if (U.cone.visible) {
    const a = breathing ? e.breathA : e.breathA0, p = e.breathPitch || 0;
    const mx = e.cx + e.fx * PT.breath.mouth, my = e.floorY + PT.breath.mouthY, mz = e.cz + e.fz * PT.breath.mouth;
    U.cone.position.set(mx, my, mz);
    U.cone.lookAt(_v.set(mx + Math.cos(a) * Math.cos(p), my + Math.sin(p), mz + Math.sin(a) * Math.cos(p)));
    U.coneMat.opacity = breathing ? 0.32 + Math.sin(t * 40) * 0.05 * R.flashK : 0.08 + 0.06 * Math.sin(t * 12);
    if (breathing && R.fx && (U.puff -= dt) <= 0) { // frost pouring out along the cone
      U.puff = 0.03;
      const d = 2 + Math.random() * 14;
      R.fx.burst(mx + Math.cos(a) * d, my + Math.sin(p) * d, mz + Math.sin(a) * d, 2, 0xdff8ff, 3, 0.35, 0.6, -2);
    }
  }
  // ---- the slide lane: dim while it aims, solid once locked, on along its line while it slides
  const laning = s === 'slideTele' || s === 'slide';
  U.lane.visible = laning;
  if (laning) {
    const locked = e.laneLen > 0, len = locked ? e.laneLen + 4 : 14, dx = locked ? e.sx : e.fx, dz = locked ? e.sz : e.fz;
    U.lane.position.set(e.cx, e.floorY + 0.06, e.cz);
    U.lane.rotation.y = Math.atan2(dx, dz);
    U.lane.scale.set(5.2, 1, len);
    U.laneMat.opacity = (locked ? 0.42 : 0.16) * (s === 'slide' ? 0.6 : 1) + (locked ? Math.sin(t * 24) * 0.06 * R.flashK : 0);
    if (s === 'slide' && R.fx && (U.puff -= dt) <= 0) { U.puff = 0.04; R.fx.burst(e.cx - e.sx * 3, e.floorY + 0.4, e.cz - e.sz * 3, 3, 0xe8f4ff, 4, 0.3, 0.5, 6); }
  }
  // ---- the spike rings
  for (const V of U.rings) { V.ring.visible = false; V.spikes.visible = false; }
  for (const Rg of e.rings || []) {
    const V = U.rings.find((q) => Math.abs(q.r0 - Rg.r0) < 0.01);
    if (!V) continue;
    if (!Rg.burst) {
      V.ring.visible = true; V.ring.position.set(Rg.x, Rg.y + 0.07, Rg.z);
      const fill = 1 - Math.max(0, Rg.t) / (Rg.max || 1);
      V.mat.opacity = 0.12 + fill * 0.4 + Math.sin(t * (10 + fill * 30)) * 0.08 * R.flashK;
    } else {
      V.spikes.visible = true; V.spikes.position.set(Rg.x, Rg.y, Rg.z);
      const grow = Math.min(1, (PT.pound.linger - Rg.life) * 10), sink = Math.min(1, Rg.life / 0.25);
      V.spikes.scale.set(1, Math.max(0.05, Math.min(grow, sink)), 1);
    }
  }
  // ---- the ice blocks: held overhead while it winds up, then lobbed onto their rings
  U.held.visible = s === 'hurlTele' || (s === 'hurl' && e.left > 0);
  if (U.held.visible) { U.held.position.set(e.cx + e.fx * 1.6, e.floorY + PT.rearTop + 0.1, e.cz + e.fz * 1.6); U.held.rotation.set(0, t, 0); }
  U.lobs.forEach((m, i) => {
    const L = (e.lobs || [])[i];
    m.visible = !!L && L.t > 0;
    if (!m.visible) return;
    const q = 1 - L.t / L.max;
    m.position.set(lerp(L.x0, L.x, q), lerp(L.y0, L.y + 0.8, q) + 7 * 4 * q * (1 - q), lerp(L.z0, L.z, q));
    m.rotation.set(q * 6, q * 4, 0);
  });
  // ---- frost puffs from the open vents, snow shaken off
  if (R.fx && s === 'vent' && Math.random() < dt * 14) R.fx.burst(e.cx, e.floorY + 4.6, e.cz, 3, 0xe8fbff, 2.5, 0.4, 0.8, -3);
  if (R.fx && s === 'shakeTele' && Math.random() < dt * 30) R.fx.burst(e.cx + (Math.random() - 0.5) * 4, e.floorY + 4, e.cz + (Math.random() - 0.5) * 4, 2, 0xffffff, 6, 0.25, 0.6, 10);
  if (s === 'dying') g.position.x += Math.sin(t * 60) * 0.1 * R.motion;
}
