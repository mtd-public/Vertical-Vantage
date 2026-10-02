// KRAKEN-OS's view: an armoured dome head with one big eye, a jaw of water cannons, barnacles and
// dangling cables, red danger lights, and six segmented tentacles posed every frame from the sim's
// arm slots (e.arms: rising out of the brine on a telegraph, slamming onto the ring, lying there,
// sliding back). Idle arms curl over the pool round the head. Bubbles boil where it will surface.
//
// The group stays at the origin: the head is a child posed in world space, and the tentacles are
// instanced meshes whose matrices are world space too.
import * as THREE from 'three';
import { Kit, box, cyl, part } from '../geo.js';
import { mulberry32 } from '../../sim/util.js';

const ARMS = 6, SEGS = 12;
const COL = { armour: 0x2f4a56, armourDk: 0x1a2a34, plate: 0x3e5e6a, red: 0xd8302a, redDk: 0x7a1818, steel: 0x8a929e, black: 0x111318, barnacle: 0xd8d0bc, sucker: 0xe8b0a8, hazard: 0xffcc1a, cable: 0x22252e };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _x = new THREE.Vector3(), _z = new THREE.Vector3(), _d = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0), _X = new THREE.Vector3(1, 0, 0), _b = new THREE.Matrix4();
const v3 = () => new THREE.Vector3();

export function krakenModel(M) {
  const g = new THREE.Group();
  const head = new THREE.Group(); head.name = 'head'; g.add(head);
  const K = new Kit(), P = (...a) => K.add('p', ...a);
  // the dome: a faceted hemisphere squashed to a 2.2 m crown, armour ridges, a hazard ring on the
  // crown (land there), the red collar and the neck going down into the brine
  P(part(new THREE.SphereGeometry(2.7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { sy: 0.82, color: COL.armour }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    for (const [el, w] of [[0.3, 1.0], [0.75, 0.8], [1.15, 0.55]]) {
      const r = 2.72, x = Math.cos(el) * Math.cos(a) * r, y = Math.sin(el) * r * 0.82, z = Math.cos(el) * Math.sin(a) * r;
      P(box(w, 0.16, 0.7, { x, y, z, ry: -a, rz: 0, rx: 0, color: k % 2 ? COL.red : COL.plate }));
    }
  }
  P(part(new THREE.TorusGeometry(1.15, 0.13, 3, 14), { rx: Math.PI / 2, y: 2.05, color: COL.hazard }));
  P(cyl(0.75, 0.95, 0.3, 8, { y: 2.12, color: COL.armourDk }), cyl(0.3, 0.3, 0.5, 6, { y: 2.4, color: COL.steel }));
  P(cyl(2.78, 2.78, 0.5, 14, { y: -0.12, color: COL.red }), cyl(2.62, 2.15, 4.2, 12, { y: -2.5, color: COL.armourDk }));
  // the jaw: three water-cannon nozzles under the eye
  P(box(2.8, 0.55, 1.2, { y: -1.25, z: -2.2, color: COL.steel }));
  for (const x of [-0.85, 0, 0.85]) P(cyl(0.24, 0.32, 0.9, 6, { x, y: -1.25, z: -2.75, rx: Math.PI / 2, color: COL.black }));
  // the eye turret: a heavy housing standing out of the dome's front, a black rim, the brow armour
  P(cyl(1.2, 1.32, 1.0, 14, { y: 0.3, z: -2.55, rx: Math.PI / 2, color: COL.armourDk }));
  P(part(new THREE.TorusGeometry(1.08, 0.2, 4, 14), { y: 0.3, z: -3.04, color: COL.black }));
  for (const sx of [-1, 1]) P(box(0.3, 0.3, 0.9, { x: sx * 1.35, y: 0.3, z: -2.6, color: COL.steel }));
  P(box(2.8, 0.34, 1.2, { y: 1.55, z: -2.3, rx: 0.5, color: COL.red }), box(0.5, 0.5, 0.5, { x: -1.55, y: 1.1, z: -2.25, color: COL.redDk }), box(0.5, 0.5, 0.5, { x: 1.55, y: 1.1, z: -2.25, color: COL.redDk }));
  // heat vents on the back, antennas
  for (let k = 0; k < 4; k++) P(box(1.0, 0.1, 0.5, { y: 0.55 + k * 0.32, z: 2.25 - k * 0.22, rx: -0.6, color: COL.black }));
  P(box(0.08, 1.6, 0.08, { x: 0.9, y: 2.6, z: 0.9, rz: -0.25, color: COL.cable }), box(0.08, 1.2, 0.08, { x: -1.0, y: 2.4, z: 0.7, rz: 0.3, color: COL.cable }));
  // barnacles on the lower dome and the neck, cables hanging into the brine
  const rng = mulberry32(17);
  for (let i = 0; i < 34; i++) {
    const a = rng() * Math.PI * 2, el = -0.9 + rng() * 1.3, r = el < 0 ? 2.45 : 2.7;
    const x = Math.cos(Math.max(0, el)) * Math.cos(a) * r, z = Math.cos(Math.max(0, el)) * Math.sin(a) * r, y = el < 0 ? el * 2.6 : Math.sin(el) * r * 0.82;
    if (z < -1.2 && Math.abs(x) < 1.6 && y > -1.6) continue; // keep the eye and the jaw clear
    P(part(new THREE.ConeGeometry(0.16 + rng() * 0.16, 0.28 + rng() * 0.2, 5), { x, y, z, rx: Math.cos(a) * 0.6, rz: -Math.sin(a) * 0.6, color: rng() < 0.3 ? 0xa89c88 : COL.barnacle }));
  }
  for (let k = 0; k < 5; k++) { const a = 0.6 + k * 1.15; P(cyl(0.07, 0.07, 3.6, 4, { x: Math.cos(a) * 2.85, y: -1.9, z: Math.sin(a) * 2.85, rz: Math.cos(a) * 0.12, color: COL.cable })); }
  const body = new THREE.Mesh(K.build().p, M.paintFlat); body.name = 'body'; head.add(body);
  // the eye: its own material, so it can change colour (amber idle, white-hot charging, red firing)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb02b }); eyeMat.userData.own = true;
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.98, 16), eyeMat); eye.rotation.y = Math.PI; eye.position.set(0, 0.3, -3.08); eye.name = 'eye'; head.add(eye);
  const pupil = new THREE.Mesh(box(0.22, 1.3, 0.04, { color: 0x111111 }), M.paintFlat); pupil.position.set(0, 0.3, -3.12); pupil.name = 'pupil'; head.add(pupil);
  // danger lights (blinking) and the cannon vents (they flare before a volley)
  const L = new Kit();
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; L.add('l', box(0.26, 0.26, 0.26, { x: Math.cos(a) * 2.82, y: 0.1, z: Math.sin(a) * 2.82, color: 0xff2a2a })); }
  L.add('l', box(0.3, 0.3, 0.3, { x: 0.9, y: 3.4, z: 0.9, color: 0xff2a2a }));
  const lights = new THREE.Mesh(L.build().l, M.glow); lights.name = 'lights'; head.add(lights);
  // LED seams (always on, so its silhouette reads against the night): a cyan line round the dome's
  // rim above the red collar, LED studs up the seams between the armour ridges, a ring round the eye
  const S = new Kit();
  S.add('s', part(new THREE.TorusGeometry(2.74, 0.06, 3, 18), { rx: Math.PI / 2, y: 0.2, color: 0x2be8ff }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    for (const el of [0.45, 0.8, 1.12]) { const r = 2.72, x = Math.cos(el) * Math.cos(a) * r, y = Math.sin(el) * r * 0.82, z = Math.cos(el) * Math.sin(a) * r; S.add('s', box(0.14, 0.14, 0.14, { x, y, z, color: 0x2bffd0 })); }
  }
  S.add('s', part(new THREE.TorusGeometry(1.36, 0.05, 3, 16), { y: 0.3, z: -3.06, color: 0x2be8ff }));
  const seams = new THREE.Mesh(S.build().s, M.glow); seams.name = 'seams'; head.add(seams);
  const V = new Kit();
  for (const x of [-0.85, 0, 0.85]) V.add('v', cyl(0.2, 0.2, 0.05, 8, { x, y: -1.25, z: -3.22, rx: Math.PI / 2, color: 0x7ff6ff }));
  const vents = new THREE.Mesh(V.build().v, M.glow); vents.name = 'vents'; head.add(vents);
  // foam round its neck at the waterline (world space, positioned per frame)
  const foam = new THREE.Mesh(part(new THREE.RingGeometry(2.6, 3.6, 16), { rx: -Math.PI / 2, color: 0xc8f4ff }), M.glow); foam.name = 'foam'; g.add(foam);
  // the surfacing warning: a red plume of spray climbing out of the brine where it will come up
  // (tall enough to see over the deck edge, which hides the water near your own deck)
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xff4a2a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); plumeMat.userData.own = true;
  const plume = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.6, 1, 10, 1, true).translate(0, 0.5, 0), plumeMat); plume.name = 'plume'; plume.frustumCulled = false; g.add(plume);
  // the tentacles: one instanced segment (unit length along +y, unit radius) and an instanced claw
  const SK = new Kit();
  SK.add('s', part(new THREE.CylinderGeometry(0.86, 1, 1, 8, 1), { y: 0.5, color: COL.armour }));
  SK.add('s', part(new THREE.CylinderGeometry(1.06, 1.06, 0.2, 8, 1), { y: 0.88, color: COL.red }));
  for (const y of [0.3, 0.62]) SK.add('s', part(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 6), { y, z: -0.88, rx: Math.PI / 2, color: COL.sucker }));
  SK.add('s', box(0.5, 0.5, 0.3, { y: 0.5, z: 0.9, color: COL.plate }));
  const arms = new THREE.InstancedMesh(SK.build().s, M.paintFlat, ARMS * SEGS); arms.frustumCulled = false; arms.name = 'arms'; g.add(arms);
  const TK = new Kit();
  TK.add('t', part(new THREE.ConeGeometry(1, 2.4, 6), { y: 1.2, color: COL.armourDk }), part(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 6), { y: 0.1, color: COL.red }));
  const tips = new THREE.InstancedMesh(TK.build().t, M.paintFlat, ARMS); tips.frustumCulled = false; tips.name = 'tips'; g.add(tips);
  const lamps = new THREE.InstancedMesh(box(1, 1, 1, { color: 0xff2a2a }), M.glow, ARMS * 2); lamps.frustumCulled = false; lamps.name = 'lamps'; g.add(lamps);
  const pts = Array.from({ length: SEGS + 1 }, v3);
  g.userData = { head, eye, eyeMat, pupil, lights, vents, foam, plume, plumeMat, arms, tips, lamps, pts, last: '', bubT: 0, armPose: Array.from({ length: ARMS }, () => ({ B: v3(), C1: v3(), C2: v3(), T: v3(), init: false })) };
  return g;
}

// A cubic Bézier into pts.
function bez(pts, B, C1, C2, T) {
  const n = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    pts[i].set(a * B.x + b * C1.x + c * C2.x + d * T.x, a * B.y + b * C1.y + c * C2.y + d * T.y, a * B.z + b * C1.z + c * C2.z + d * T.z);
  }
}
// One segment's matrix: from a to b, radius r (local y along the segment, local -z toward `belly`).
function segMatrix(a, b, r, out) {
  _d.subVectors(b, a);
  const len = _d.length() || 1e-3;
  _d.multiplyScalar(1 / len);
  _x.crossVectors(_d, _Y); if (_x.lengthSq() < 1e-6) _x.crossVectors(_d, _X);
  _x.normalize(); _z.crossVectors(_x, _d);
  _b.makeBasis(_x, _d, _z); _q.setFromRotationMatrix(_b);
  _s.set(r, len * 1.04, r);
  return out.compose(a, _q, _s);
}

const _B = v3(), _C1 = v3(), _C2 = v3(), _T = v3(), _H = v3(), _o = v3();
export function updateKraken(R, e, g, dt, t, P) {
  const U = g.userData, head = U.head, up = e.up ?? 1, water = 0;
  // the head: at the sim's pose, facing you; it slumps forward when stunned and shakes when dying
  const slump = e.crouch ? 1 : 0;
  head.position.set(e.cx, e.cy - slump * 0.45, e.cz);
  if (e.state === 'dying') head.position.x += Math.sin(t * 50) * 0.15 * R.motion;
  head.rotation.set(slump * 0.35 + (e.state === 'rise' ? Math.sin(t * 9) * 0.06 : 0), Math.atan2(-e.fx, -e.fz), e.state === 'reel' ? Math.sin(t * 14) * 0.12 * R.motion : 0, 'YXZ');
  head.visible = up > 0.02;
  R.flashModel(g, e.flash > 0 || (e.state === 'dying' && Math.sin(t * 30) > 0));
  // eye: off under water, amber watching, flickering white → red charging, red firing, dim when stunned
  const ph = e.phase || 1;
  let col = 0xffb02b, sc = 1;
  if (e.state === 'charge') { col = Math.sin(t * 40) > 0 || R.flashK < 1 ? 0xffffff : 0xff2a3a; sc = 1.15 + Math.sin(t * 30) * 0.1 * R.flashK; }
  else if (e.state === 'laser') { col = 0xff2a3a; sc = 1.25; }
  else if (e.state === 'reel' || e.state === 'recover') { col = 0x5a1010; sc = 0.7; }
  else if (e.state === 'dying') { col = Math.sin(t * 20) > 0 ? 0xff2a3a : 0x220000; }
  U.eyeMat.color.setHex(col); U.eye.scale.setScalar(sc); U.pupil.scale.set(e.state === 'charge' || e.state === 'laser' ? 0.4 : 1, sc, 1);
  U.lights.visible = Math.sin(t * (4 + ph * 2)) > -0.2;
  const vt = e.state === 'volleyTele' ? 1.6 + Math.sin(t * 40) * 0.4 * R.flashK : e.state === 'volley' ? 1.3 : 0.6;
  U.vents.scale.set(vt, vt, 1);
  const boil = e.state === 'under' || (e.state === 'dive' && up < 0.3); // the foam marks where it will come up
  if (boil) { U.foam.position.set(e.sx ?? e.cx, water + 0.3, e.sz ?? e.cz); U.foam.scale.setScalar(0.6 + 0.35 * Math.abs(Math.sin(t * 6))); }
  else { U.foam.position.set(e.cx, water + 0.3, e.cz); U.foam.scale.setScalar(0.9 + Math.sin(t * 3) * 0.06); }
  U.foam.visible = boil || (up > 0.15 && e.state !== 'dying');
  U.plume.visible = boil;
  if (boil) {
    const k = e.state === 'under' ? Math.min(1, (U.boilT = (U.boilT || 0) + dt) / 0.4) : 0.3;
    U.plume.position.set(e.sx ?? e.cx, 0, e.sz ?? e.cz);
    U.plume.scale.set(1 + 0.15 * Math.sin(t * 13), 11 * k * (0.9 + 0.1 * Math.sin(t * 9)), 1 + 0.15 * Math.cos(t * 11));
    U.plumeMat.opacity = (0.35 + 0.25 * Math.abs(Math.sin(t * 8))) * (R.flashK < 1 ? 0.7 : 1);
  } else U.boilT = 0;
  // bubbles where it will surface, a splash when it breaks the surface or goes down
  if (e.state !== U.last) {
    if (e.state === 'rise' || e.state === 'dive') { R.fx.burst(e.cx, water + 0.5, e.cz, 34, 0x9fe8ff, 9, 0.3, 1.0, 14); R.fx.shockwave(e.cx, water + 0.1, e.cz, 5, 0.6 * R.flashK); }
    U.last = e.state;
  }
  if (e.state === 'under' || (e.state === 'dive' && up < 0.4)) {
    U.bubT -= dt;
    if (U.bubT <= 0) {
      U.bubT = e.timer < 0.6 ? 0.03 : 0.07;
      const sx = e.sx ?? e.cx, sz = e.sz ?? e.cz;
      R.fx.burst(sx + (Math.random() - 0.5) * 3.5, water + 0.3, sz + (Math.random() - 0.5) * 3.5, e.timer < 0.6 ? 6 : 3, 0xe8fcff, 5, 0.34, 1.1, -9);
    }
  }
  // tentacles
  const A = e.arms || [], pts = U.pts, sink = (1 - up) * 8;
  const toC = Math.atan2((e.czA ?? 0) - e.cz, (e.cxA ?? 0) - e.cx), atCentre = Math.abs((e.cxA ?? 0) - e.cx) + Math.abs((e.czA ?? 0) - e.cz) < 1;
  let n = 0;
  for (let i = 0; i < ARMS; i++) {
    const a = A[i], pose = U.armPose[i];
    if (a && a.on) {
      _B.set(a.bx, water - 1.2, a.bz);
      _o.set(a.tx - a.bx, 0, a.tz - a.bz); const hl = _o.length() || 1; _o.multiplyScalar(1 / hl); // base → target, flat
      if (a.t > 0.14) { // rising and coiling above its ring
        const k = 1 - a.t / a.max, wob = Math.sin(t * 7 + i) * 0.5 * R.motion;
        _H.set(a.tx - _o.x * 1.6, a.ty + 5.5 + 2.2 * k, a.tz - _o.z * 1.6);
        _T.copy(_H).addScaledVector(_o, 0.8 + wob * 0.3); _T.y += 0.6;
        _C1.copy(_B).addScaledVector(_o, 0.6); _C1.y = water + 5 + 2 * k;
        _C2.copy(_H).addScaledVector(_o, -1.6); _C2.y += 3.2 + wob;
      } else if (a.t > 0) { // the slam: whips down onto the ring
        const k = 1 - a.t / 0.14;
        _T.set(a.tx - _o.x * 1.6 * (1 - k), a.ty + 0.35 + (5.5 + 2.2) * (1 - k) * (1 - k), a.tz - _o.z * 1.6 * (1 - k));
        _C1.copy(_B).addScaledVector(_o, 1.0); _C1.y = water + 5 - k * 1.5;
        _C2.copy(_T).addScaledVector(_o, -2.2); _C2.y = Math.max(_T.y, a.ty) + 3.2 - k * 1.2;
      } else { // lying on the deck, then sliding back into the brine
        const k = Math.max(0, (a.hit - 0.9) / 0.5);
        _T.set(a.tx + (a.bx - a.tx) * k, a.ty + 0.35 - k * (a.ty + 2), a.tz + (a.bz - a.tz) * k);
        _C1.copy(_B).addScaledVector(_o, 1.0); _C1.y = water + 3.2 - k * 3;
        _C2.copy(_T).addScaledVector(_o, -2.0); _C2.y = Math.max(_T.y, a.ty) + 1.6 - k * 2;
      }
    } else { // idle: curled over the pool round the head, swaying
      const spread = (i / (ARMS - 1) - 0.5) * (atCentre ? Math.PI * 2 * (ARMS - 1) / ARMS : 2.8);
      const ang = (atCentre ? 0 : toC) + spread, ox = Math.cos(ang), oz = Math.sin(ang);
      const sw = Math.sin(t * 1.3 + i * 1.7) * R.motion, lift = (e.state === 'dying' ? -3 : 0) - sink;
      _B.set(e.cx + ox * 2.2, water - 1.0, e.cz + oz * 2.2);
      _T.set(e.cx + ox * (5.2 + sw * 0.6) - oz * sw * 1.2, water + 2.6 + Math.sin(t * 1.9 + i) * 0.8 + lift, e.cz + oz * (5.2 + sw * 0.6) + ox * sw * 1.2);
      _C1.set(e.cx + ox * 3.2, water + 3.4 + lift, e.cz + oz * 3.2);
      _C2.set(_T.x - ox * 1.6, _T.y + 2.0, _T.z - oz * 1.6);
    }
    // ease the control points so a slot switching between idle and attack doesn't snap
    const kE = pose.init ? Math.min(1, dt * (a && a.on ? 18 : 6)) : 1; pose.init = true;
    pose.B.lerp(_B, kE); pose.C1.lerp(_C1, kE); pose.C2.lerp(_C2, kE); pose.T.lerp(_T, kE);
    bez(pts, pose.B, pose.C1, pose.C2, pose.T);
    for (let s = 0; s < SEGS; s++) {
      const r = 0.95 - (s / SEGS) * 0.62;
      U.arms.setMatrixAt(i * SEGS + s, segMatrix(pts[s], pts[s + 1], r, _m));
    }
    U.tips.setMatrixAt(i, segMatrix(pts[SEGS], _p.copy(pts[SEGS]).addScaledVector(_d.subVectors(pts[SEGS], pts[SEGS - 1]).normalize(), 1), 0.36, _m));
    for (const s of [4, 8]) { _p.copy(pts[s]); _p.y += 0.62 - s * 0.03; U.lamps.setMatrixAt(n++, _m.compose(_p, _q.identity(), _s.setScalar(U.lights.visible ? 0.22 : 0.001))); }
  }
  U.arms.instanceMatrix.needsUpdate = true; U.tips.instanceMatrix.needsUpdate = true; U.lamps.instanceMatrix.needsUpdate = true;
}
