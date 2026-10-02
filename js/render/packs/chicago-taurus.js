// TAURUS-312's look: a hulking armoured bull mech in Bulls red and black. Plated hump and shoulders
// with missile pods under the pauldrons, big ivory horns, glowing nostril vents (and a gold nose
// ring), piston legs that gallop, "312" stencilled on its flanks. Origin = the ground under its
// middle, facing -Z. The body pivots at the hips so it can rear up and dip its head to charge.
// Its charge lane is painted on the deck while it paws (named 'sight', so the hit flash skips it).
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from '../geo.js';
import { seg } from '../retro.js';

const C = { red: 0xd8202a, redHi: 0xff4a3a, redDk: 0x8a1420, black: 0x15151a, gun: 0x3a3c44, chrome: 0xc8ccd4, horn: 0xece6d8, hornTip: 0x3a3430, gold: 0xffc23a, white: 0xf0ece0 };
const HIPZ = 1.9, BODYY = 2.25; // the body pivot (over the hind hips)
const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); if (name) m.name = name; return m; };
const build = (fill) => { const K = new Kit(); fill(K); return K.build(); };

// 7-segment digits for the flank stencil
const SEGS = { 3: 'abcdg', 1: 'bc', 2: 'abdeg' };
function digit(K, ch, x, y, z, right, s = 1, key = 'p', color = C.white) { // right: unit z-direction of "reading right" on this flank
  const w = 0.5 * s, h = 0.9 * s, t = 0.09 * s;
  const at = { a: [0, h / 2, w, t], b: [w / 2, h / 4, t, h / 2], c: [w / 2, -h / 4, t, h / 2], d: [0, -h / 2, w, t], e: [-w / 2, -h / 4, t, h / 2], f: [-w / 2, h / 4, t, h / 2], g: [0, 0, w, t] };
  for (const k of SEGS[ch]) { const [u, v, sw, sh] = at[k]; K.add(key, box(0.04, sh, sw, { x, y: y + v, z: z + u * right, color })); }
}

export function taurusModel(M) {
  const g = new THREE.Group();
  const body = new THREE.Group(); body.name = 'body'; body.position.set(0, BODYY, HIPZ); g.add(body);
  const Z = (z) => z - HIPZ, Y = (y) => y - BODYY; // build in "standing" coords, offset into the hip frame
  // ---- torso: chest and hump up front, a barrel, the hips; armour plates over a gunmetal frame
  const T = build((K) => {
    const P = (...a) => K.add('p', ...a);
    P(box(2.9, 1.9, 2.4, { y: Y(2.75), z: Z(-1.1), color: C.red })); // chest
    P(box(2.5, 0.9, 2.1, { y: Y(3.55), z: Z(-1.0), rx: 0.08, color: C.redDk })); // the hump
    P(box(2.5, 1.55, 2.6, { y: Y(2.6), z: Z(1.15), color: C.red })); // barrel
    P(box(2.6, 1.45, 1.3, { y: Y(2.75), z: Z(2.45), color: C.red })); // hips
    P(box(2.2, 0.5, 4.8, { y: Y(1.75), z: Z(0.6), color: C.black })); // belly plating
    P(box(2.6, 0.12, 5.6, { y: Y(2.05), z: Z(0.4), color: C.gun })); // the frame seam
    for (let k = 0; k < 6; k++) P(box(0.9 - k * 0.05, 0.22, 0.75, { y: Y(3.98 - k * 0.12), z: Z(-1.6 + k * 0.82), rx: -0.1, color: k % 2 ? C.black : C.gun })); // spine plates (its back)
    for (const sx of [-1, 1]) {
      P(box(1.0, 1.7, 2.3, { x: sx * 1.55, y: Y(3.25), z: Z(-1.15), rz: -sx * 0.32, color: C.red })); // pauldron
      P(box(1.04, 0.12, 2.34, { x: sx * 1.6, y: Y(3.1), z: Z(-1.15), rz: -sx * 0.32, color: C.gold })); // its gold trim
      P(box(0.08, 0.8, 2.4, { x: sx * 1.27, y: Y(2.55), z: Z(1.15), color: C.redDk })); // flank plate
      for (const z of [-0.2, 0.6, 1.4, 2.2]) P(box(0.1, 0.1, 0.1, { x: sx * 1.3, y: Y(3.25), z: Z(z), color: C.chrome })); // rivets
      P(cyl(0.16, 0.2, 0.9, 6, { x: sx * 0.75, y: Y(3.55), z: Z(2.6), rx: -0.7, color: C.gun })); // exhausts
    }
    P(box(2.0, 1.0, 0.9, { y: Y(2.9), z: Z(-2.35), color: C.gun })); // the neck yoke
    // the tail: a segmented cable and a plug
    for (let k = 0; k < 4; k++) P(box(0.22, 0.22, 0.5, { y: Y(3.1 - k * 0.32), z: Z(3.15 + k * 0.28), rx: 0.7 + k * 0.15, color: C.black }));
    P(box(0.4, 0.4, 0.4, { y: Y(1.9), z: Z(4.0), color: C.red }));
  });
  body.add(mesh(T.p, M.paintFlat));
  const L = build((K) => { // running lights and exhaust glow, the flank "312" in neon, gold trim lights
    for (const sx of [-1, 1]) {
      const right = sx > 0 ? -1 : 1, x = sx * 1.32;
      ['3', '1', '2'].forEach((ch, i) => digit(K, ch, x, Y(2.65), Z(1.15) + (i - 1) * 0.72 * right, right, 1, 'g', 0xfff0f0));
      K.add('g', box(1.06, 0.05, 2.36, { x: sx * 1.62, y: Y(3.17), z: Z(-1.15), rz: -sx * 0.32, color: 0xffc23a })); // the pauldron's trim, lit
      K.add('g', box(0.06, 0.12, 1.8, { x: sx * 1.33, y: Y(2.05), z: Z(0.6), color: 0xff7a1a }));
      K.add('g', cyl(0.12, 0.12, 0.05, 6, { x: sx * 0.75, y: Y(3.9), z: Z(2.95), rx: -0.7, color: 0xff6a1a }));
    }
  });
  body.add(mesh(L.g, M.glow));
  // the back vents: they open and glow while it's stunned (stomp here)
  const vents = mesh(build((K) => { for (let k = 0; k < 3; k++) K.add('g', box(0.75, 0.12, 0.35, { y: Y(4.12 - k * 0.24), z: Z(-0.9 + k * 1.3), color: 0xffd23a })); }).g, M.glow, 'vents');
  vents.visible = false; body.add(vents);
  // ---- the head on its neck pivot
  const head = new THREE.Group(); head.name = 'head'; head.position.set(0, Y(2.85), Z(-2.6)); body.add(head);
  const Hd = build((K) => {
    const P = (...a) => K.add('p', ...a);
    P(box(1.5, 1.25, 1.5, { y: -0.15, z: -0.75, color: C.red })); // skull
    P(box(1.65, 0.35, 1.05, { y: 0.55, z: -0.8, rx: -0.12, color: C.black })); // brow plate
    P(box(1.15, 0.85, 1.0, { y: -0.55, z: -1.75, color: C.gun })); // snout
    P(box(1.2, 0.2, 1.05, { y: -0.08, z: -1.75, rx: 0.1, color: C.redDk })); // nose ridge
    P(box(0.9, 0.3, 0.8, { y: -1.05, z: -1.55, color: C.black })); // jaw
    P(part(new THREE.TorusGeometry(0.28, 0.06, 4, 10), { y: -1.0, z: -2.3, color: C.gold })); // the nose ring
    for (const sx of [-1, 1]) {
      P(box(0.5, 0.4, 0.3, { x: sx * 0.85, y: 0.4, z: -0.4, rz: sx * 0.4, color: C.black })); // ears
      // horns: out from the brow, then sweeping forward and up to dark tips
      P(cyl(0.3, 0.36, 0.7, 6, { x: sx * 0.95, y: 0.4, z: -0.85, rz: -sx * Math.PI / 2, color: C.horn }));
      P(cyl(0.22, 0.3, 1.0, 6, { x: sx * 1.6, y: 0.62, z: -1.0, rz: -sx * 1.05, rx: -0.2, color: C.horn }));
      P(cyl(0.12, 0.22, 0.9, 6, { x: sx * 1.98, y: 1.0, z: -1.45, rx: -0.95, rz: -sx * 0.3, color: C.horn }));
      P(part(new THREE.ConeGeometry(0.12, 0.6, 6), { x: sx * 2.05, y: 1.25, z: -1.95, rx: -1.1, color: C.hornTip }));
    }
  });
  head.add(mesh(Hd.p, M.paintFlat));
  const eyes = mesh(build((K) => { for (const sx of [-1, 1]) K.add('g', box(0.32, 0.12, 0.06, { x: sx * 0.5, y: 0.18, z: -1.52, rz: sx * 0.25, color: 0xff3a2a })); }).g, M.glow, 'eyes');
  head.add(eyes);
  const nostrils = new THREE.Group(); nostrils.name = 'nostrils'; nostrils.position.set(0, -0.55, -2.27); head.add(nostrils);
  nostrils.add(mesh(build((K) => { for (const sx of [-1, 1]) K.add('g', cyl(0.16, 0.16, 0.05, 8, { x: sx * 0.28, rx: Math.PI / 2, color: 0xff7a1a })); }).g, M.glow));
  // ---- shoulder missile pods (rise from under the pauldrons)
  const pods = new THREE.Group(); pods.name = 'pods'; pods.position.set(0, Y(3.6), Z(-1.2)); body.add(pods);
  for (const sx of [-1, 1]) {
    const pod = new THREE.Group(); pod.position.set(sx * 1.45, 0, 0); pods.add(pod);
    pod.add(mesh(build((K) => { K.add('p', box(0.85, 0.75, 1.3, { color: C.gun }), box(0.9, 0.12, 1.34, { y: 0.4, color: C.redDk })); }).p, M.paintFlat));
    const tubes = mesh(build((K) => { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) K.add('g', cyl(0.1, 0.1, 0.05, 6, { x: (i - 1) * 0.25, y: (j - 0.5) * 0.3, z: -0.66, rx: Math.PI / 2, color: 0xff5a1a })); }).g, M.glow, 'tubes');
    pod.add(tubes);
  }
  // ---- legs: armoured thighs on hip pivots, chrome pistons below the knee, black hooves
  const thighGeo = build((K) => { K.add('p', box(0.8, 1.15, 0.95, { y: -0.5, color: C.red }), box(0.84, 0.12, 0.99, { y: -0.2, color: C.black }), box(0.5, 0.4, 0.5, { y: -1.05, color: C.gun })); }).p;
  const shinGeo = build((K) => { K.add('p', cyl(0.3, 0.3, 0.35, 8, { y: -0.05, rz: Math.PI / 2, color: C.gun }), cyl(0.2, 0.2, 0.6, 8, { y: -0.35, color: C.black }), cyl(0.13, 0.13, 0.5, 8, { y: -0.75, color: C.chrome }), box(0.62, 0.32, 0.78, { y: -1.0, z: -0.06, color: C.black }), box(0.64, 0.08, 0.8, { y: -0.88, z: -0.06, color: C.gold })); }).p;
  const legs = [];
  for (const [sx, front, ph] of [[-1, true, 0], [1, true, 0.15], [-1, false, 0.55], [1, false, 0.7]]) {
    const hip = new THREE.Group(); hip.position.set(sx * 1.1, Y(2.15), Z(front ? -1.3 : 2.3)); body.add(hip);
    hip.add(mesh(thighGeo, M.paintFlat));
    const knee = new THREE.Group(); knee.position.set(0, -1.1, 0); hip.add(knee);
    knee.add(mesh(shinGeo, M.paintFlat));
    legs.push({ hip, knee, sx, front, ph });
  }
  // ---- dizzy stars over its head (stunned)
  const stars = new THREE.Group(); stars.name = 'stars'; stars.position.set(0, 1.6, -1.0); head.add(stars);
  for (let k = 0; k < 3; k++) { const s = mesh(part(new THREE.OctahedronGeometry(0.22, 0), { color: 0xffe14a }), M.glow); const a = (k / 3) * Math.PI * 2; s.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9); stars.add(s); }
  stars.visible = false;
  // ---- the charge lane painted on the deck ahead of it (world-ish: a child of g, not of the body)
  const laneMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  laneMat.userData.own = true;
  const lane = new THREE.Group(); lane.name = 'lane'; g.add(lane);
  const strip = new THREE.Mesh(box(2.8, 0.02, 1, { z: -0.5 }), laneMat); strip.name = 'sight'; lane.add(strip);
  const chev = new THREE.Mesh(build((K) => { for (const s of [-1, 1]) K.add('p', box(0.35, 0.03, 1.8, { x: s * 0.6, z: 0, ry: s * 0.6 })); }).p, laneMat); chev.name = 'sight'; lane.add(chev);
  const endBar = new THREE.Mesh(box(4.2, 0.03, 0.5, {}), laneMat); endBar.name = 'sight'; lane.add(endBar);
  lane.visible = false;
  g.userData = { body, head, eyes, nostrils, pods, legs, vents, stars, lane, strip, chev, endBar, laneMat, ph: 0, puff: 0, dust: 0, crashed: false };
  return g;
}

const _v = new THREE.Vector3();
export function taurusUpdate(R, e, g, dt, t, P) {
  const U = g.userData, st = e.state, motion = R.motion ?? 1;
  g.position.set(e.cx, e.cy - e.top / 2, e.cz);
  g.rotation.y = Math.atan2(-e.fx, -e.fz);
  if (st === 'dying') { g.position.x += Math.sin(t * 60) * 0.12; g.position.z += Math.cos(t * 47) * 0.1; }
  R.flashModel(g, e.flash > 0 || (st === 'dying' && Math.sin(t * 30) > 0));
  // gait: the legs cycle with its real speed; a gallop when charging, a plod when stalking
  const v = e.v || 0, gallop = v > 8, stride = gallop ? 6.2 : 3.0;
  U.ph += dt * v / stride * Math.PI * 2;
  // the body: crouch, pitch (head down to charge, rear up to roar), roll (stunned), bob
  const B = U.body, stun = e.stunK || 0, rear = e.rearK || 0;
  let pitch = 0, roll = 0, drop = e.crouch * 0.55 + stun * 0.45;
  if (st === 'charge') pitch = -0.12 + Math.sin(U.ph * 2) * 0.05 * motion;
  else if (st === 'skid') pitch = 0.16;
  else if (st === 'paw') pitch = -0.08 + Math.sin(t * 9) * 0.02 * motion;
  else if (st === 'leap') pitch = Math.max(-0.35, Math.min(0.35, (e.vy || 0) * 0.025));
  if (st === 'dying') { pitch = -0.15; roll = 0.35; drop = 0.6; }
  pitch += rear * 0.55; roll += stun * 0.22 * (1 + Math.sin(t * 3) * 0.3 * motion);
  B.rotation.set(pitch, 0, roll);
  B.position.y = BODYY - drop + (gallop ? Math.abs(Math.sin(U.ph)) * 0.18 * motion : v > 0 ? Math.abs(Math.sin(U.ph)) * 0.06 : 0);
  // the head: down to charge or toss, up when the horns sweep and when it roars
  U.head.rotation.x = (e.headK || 0) > 0 ? e.headK * 0.7 : e.headK * 0.45;
  U.head.rotation.z = stun * Math.sin(t * 2.4) * 0.25;
  // legs
  for (const L of U.legs) {
    const a = U.ph + L.ph * Math.PI * 2;
    let hip = 0, knee = 0, splay = 0;
    if (st === 'leap') { hip = L.front ? -0.7 : 0.7; knee = L.front ? 1.0 : -0.6; }
    else if (st === 'skid') { hip = L.front ? -0.55 : 0.25; knee = L.front ? 0.2 : -0.3; }
    else if (st === 'paw' && L.front && L.sx > 0) { const s = Math.sin(t * 9); hip = s * 0.55 * motion; knee = Math.max(0, -s) * 0.9 * motion; } // the scrape
    else if (rear > 0.1 && L.front) { hip = -0.9 * rear + Math.sin(t * 10 + L.sx) * 0.4 * rear * motion; knee = 1.1 * rear; }
    else if (v > 0.2) { hip = Math.sin(a) * (gallop ? 0.75 : 0.4); knee = Math.max(0, Math.sin(a + Math.PI / 2)) * (gallop ? 1.1 : 0.6) * (L.front ? 1 : -1); }
    if (stun > 0.1 || st === 'dying') { splay = L.sx * 0.25 * Math.max(stun, st === 'dying' ? 1 : 0); }
    if (rear > 0.1 && !L.front) hip = -0.55 * rear; // the hind legs plant under it as it rears
    L.hip.rotation.set(hip - pitch * (L.front ? 0 : 1), 0, splay);
    L.knee.rotation.x = knee;
  }
  // nostrils flare while it paws and roars; eyes blaze as it charges
  const flare = 1 + (e.pawK || 0) * 0.9 + rear * 0.6 + (st === 'charge' ? 0.5 : 0);
  U.nostrils.scale.setScalar(flare * (1 + Math.sin(t * 25) * 0.12 * (e.pawK || 0)));
  U.eyes.scale.set(1 + (st === 'charge' || st === 'paw' ? 0.5 : 0), 1 + (st === 'charge' ? 0.8 : 0), 1);
  U.eyes.visible = st !== 'stun' || Math.sin(t * 14) > 0;
  // pods rise out of the pauldrons and glow
  const pk = e.pods || 0;
  U.pods.position.y = (3.6 - BODYY) + pk * 0.55; U.pods.rotation.x = pk * 0.35;
  for (const pod of U.pods.children) pod.getObjectByName('tubes').visible = pk > 0.3 && (st !== 'pods' || e.timer < 0 || Math.sin(t * 30) > -0.2);
  // stunned: back vents open (stomp them), stars wheel over its head
  U.vents.visible = stun > 0.25; U.vents.scale.y = 1 + stun * 1.5;
  U.stars.visible = stun > 0.3 && st !== 'dying'; U.stars.rotation.y = t * 4;
  // the charge lane on the deck: pulsing while it aims, solid (and brighter) once it locks
  const show = (st === 'paw' || st === 'charge') && e.lane > 0.5;
  U.lane.visible = show;
  if (show) {
    const len = e.lane + 2.3;
    U.lane.position.set(0, 0.07, 0);
    U.strip.position.z = -1.5; U.strip.scale.z = Math.max(0.1, len - 1.5);
    U.chev.position.z = -1.5 - ((t * 9) % Math.max(1, len - 2));
    U.endBar.position.z = -len;
    const lock = e.locked || st === 'charge';
    U.laneMat.color.setHex(lock ? 0xff8a2a : 0xff2a2a);
    U.laneMat.opacity = (lock ? 0.95 : 0.5 + 0.25 * Math.sin(t * 16)) * (R.flashK < 1 ? 0.8 : 1);
  }
  // puffs of steam from the nostrils, dust under the hooves, sparks when it crashes
  const fx = R.fx;
  if (fx) {
    U.puff -= dt; U.dust -= dt;
    if (U.puff <= 0 && (st === 'paw' || st === 'rage' || st === 'snort' || st === 'stun')) {
      U.puff = st === 'stun' ? 0.5 : 0.18;
      U.nostrils.getWorldPosition(_v);
      fx.burst(_v.x, _v.y, _v.z, st === 'stun' ? 3 : 4, st === 'stun' ? 0x9a9a9a : 0xf0f0f0, 2.5, 0.16, 0.5, -1);
    }
    if (U.dust <= 0 && (st === 'charge' || st === 'skid' || (st === 'paw' && e.pawK > 0.5))) {
      U.dust = st === 'charge' ? 0.07 : 0.15;
      fx.burst(e.cx - e.fx * 1.5, e.cy - e.top / 2 + 0.2, e.cz - e.fz * 1.5, st === 'skid' ? 6 : 3, 0xb8a890, 3, 0.25, 0.5, 2);
    }
    if (e.crashT > 0 && !U.crashed) { U.crashed = true; fx.burst(e.cx + e.fx * 2.6, e.cy + 0.6, e.cz + e.fz * 2.6, 22, 0xffd23a, 9, 0.12, 0.6, 8); fx.shake = Math.max(fx.shake, 0.5 * motion); }
    if (e.crashT <= 0) U.crashed = false;
  }
}
