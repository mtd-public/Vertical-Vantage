// TREMOR's view: a drilling mole mech. Origin = body centre (1.7 m above the lawn), faces -Z, up +Y.
//   body     a segmented, mustard-yellow armoured carapace on two tread units, a sloped face with two
//            headlamps, the rock-bolt launcher and exhaust stacks on its back
//   drill    the big spiral cone on its nose (spins; glows red-hot when it overheats after a spin)
//   arms     two clawed digger arms (paddle as it crawls, dig like mad before it burrows, rear up to fire)
//   mound    the dust mound that crawls over the lawn while it's underground (not pitched with the body)
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from '../geo.js';
import { seg } from '../retro.js';

const C = { yel: 0xd8a028, yelHi: 0xf0c040, yelDk: 0x9a6a14, gun: 0x2e3038, steel: 0x8a909c, chrome: 0xd2d6de, black: 0x16161a, rust: 0x9a4a22, dirt: 0x8a6a46, dirtDk: 0x5e4630 };
const merge = (list) => { const K = new Kit(); K.add('x', ...list); return K.build().x; };

export function model(M) {
  const g = new THREE.Group();
  const body = new THREE.Group(); body.name = 'body'; g.add(body);
  const K = new Kit(), P = (...a) => K.add('p', ...a);
  // carapace: three overlapping armour segments, each a box under a rounded shell, dark seams between
  for (const [z, w, h, l] of [[-0.7, 3.1, 1.5, 1.7], [0.9, 3.3, 1.7, 1.7], [2.4, 2.8, 1.3, 1.5]]) {
    P(box(w, h, l, { y: 0.05, z, color: C.yel }));
    P(part(new THREE.CylinderGeometry(w / 2, w / 2, l, seg(10, 7)), { y: 0.05 + h / 2 - 0.2, z, rx: Math.PI / 2, sy: 1, sx: 1, sz: 0.55, color: C.yel }));
    P(box(w + 0.06, 0.12, 0.14, { y: 0.55, z: z + l / 2, color: C.gun }));
    for (const sx of [-1, 1]) P(box(0.1, 0.1, 0.1, { x: sx * (w / 2 - 0.1), y: 0.5, z, color: C.chrome }));
  }
  for (let k = -3; k <= 3; k++) P(box(0.4, 0.06, 0.3, { x: k * 0.42, y: 0.83, z: -1.55, rx: 0.5, color: k % 2 ? C.black : C.yelHi })); // hazard band
  P(box(3.2, 0.5, 4.6, { y: -0.85, z: 0.8, color: C.gun })); // belly pan
  // the face: a sloped plate with two headlamp housings and a sensor slit, above the drill collar
  P(box(2.4, 1.0, 0.9, { y: 0.55, z: -1.75, rx: -0.45, color: C.yelDk }), box(1.6, 0.18, 0.1, { y: 0.75, z: -2.2, rx: -0.45, color: C.black }));
  for (const sx of [-1, 1]) P(cyl(0.34, 0.4, 0.4, 8, { x: sx * 0.75, y: 0.35, z: -2.15, rx: Math.PI / 2, color: C.gun }));
  P(cyl(1.0, 1.15, 0.6, seg(12, 8), { y: -0.15, z: -1.95, rx: Math.PI / 2, color: C.gun }), cyl(1.05, 1.05, 0.16, seg(12, 8), { y: -0.15, z: -2.2, rx: Math.PI / 2, color: C.yelHi }));
  // the back: exhaust stacks, a four-tube rock-bolt launcher, a tail stabiliser
  for (const sx of [-1, 1]) P(cyl(0.16, 0.2, 1.1, 6, { x: sx * 0.9, y: 1.3, z: 2.0, rx: -0.3, color: C.gun }), cyl(0.2, 0.2, 0.12, 6, { x: sx * 0.9, y: 1.85, z: 2.2, rx: -0.3, color: C.rust }));
  P(box(1.3, 0.5, 1.0, { y: 1.15, z: 0.6, color: C.gun }));
  for (const [x, y] of [[-0.3, 1.45], [0.3, 1.45], [-0.3, 1.1], [0.3, 1.1]]) P(cyl(0.16, 0.16, 0.9, 6, { x, y, z: 0.2, rx: Math.PI / 2 - 0.35, color: C.black }));
  P(box(0.2, 0.7, 1.0, { y: 0.9, z: 3.2, rx: 0.3, color: C.yelDk }));
  body.add(new THREE.Mesh(K.build().p, M.paintFlat));
  // treads: housings with road wheels; the teeth are separate meshes (top run and bottom run) that slide
  const TK = new Kit();
  for (const sx of [-1, 1]) {
    TK.add('t', box(0.9, 1.0, 4.4, { x: sx * 1.8, y: -1.1, z: 0.8, color: C.gun }));
    for (const z of [-1.2, 0.1, 1.4, 2.7]) TK.add('t', cyl(0.42, 0.42, 0.95, 8, { x: sx * 1.8, y: -1.15, z, rz: Math.PI / 2, color: C.steel }));
    TK.add('t', box(0.95, 0.25, 4.0, { x: sx * 1.8, y: -0.5, z: 0.8, color: C.yel }));
  }
  body.add(new THREE.Mesh(TK.build().t, M.paintFlat));
  const teethGeo = merge(Array.from({ length: 10 }, (_, i) => box(1.0, 0.14, 0.22, { z: -1.5 + i * 0.5, color: C.black })));
  const teeth = [];
  for (const sx of [-1, 1]) for (const [y, dir] of [[-0.55, -1], [-1.66, 1]]) {
    const m = new THREE.Mesh(teethGeo, M.paintFlat); m.position.set(sx * 1.8, y, 0.8); m.userData.dir = dir; body.add(m); teeth.push(m);
  }
  // the drill: a spiral cone on its nose, tip toward -Z; spun round its axis by the view
  const drill = new THREE.Group(); drill.name = 'drill'; drill.position.set(0, -0.15, -2.25); body.add(drill);
  const DK = new Kit();
  DK.add('d', part(new THREE.ConeGeometry(1.0, 3.2, seg(10, 8), 3), { z: -1.6, rx: -Math.PI / 2, color: C.chrome }));
  for (let h = 0; h < 2; h++) for (let i = 0; i < 12; i++) { // two helical flutes
    const u = i / 12, a = u * Math.PI * 4 + h * Math.PI, r = 1.0 * (1 - u) + 0.08, z = -u * 3.2 - 0.05;
    DK.add('d', box(0.22, 0.28, 0.5, { x: Math.cos(a) * r, y: Math.sin(a) * r, z, rz: a, rx: 0.3, color: h ? C.steel : C.gun }));
  }
  DK.add('d', cyl(0.5, 0.5, 0.25, 8, { z: 0.05, rx: Math.PI / 2, color: C.rust }));
  drill.add(new THREE.Mesh(DK.build().d, M.paintFlat));
  const heat = new THREE.Mesh(part(new THREE.ConeGeometry(1.08, 3.3, seg(10, 8), 1), { z: -1.6, rx: -Math.PI / 2, color: 0xff5a1a }), M.glow);
  heat.name = 'heat'; heat.visible = false; drill.add(heat);
  // digger arms: shoulder at the front corners; upper arm, forearm and a three-clawed shovel
  const armGeo = merge([
    box(0.5, 0.5, 1.4, { z: -0.6, color: C.yelDk }), cyl(0.32, 0.32, 0.6, 8, { rz: Math.PI / 2, color: C.gun }),
    box(0.4, 0.4, 1.3, { y: -0.35, z: -1.5, rx: 0.5, color: C.yel }),
    box(1.1, 0.16, 0.7, { y: -0.75, z: -2.1, rx: 0.9, color: C.steel }),
    ...[-0.38, 0, 0.38].map((x) => part(new THREE.ConeGeometry(0.13, 0.6, 4), { x, y: -1.05, z: -2.45, rx: -Math.PI / 2 - 0.9, color: C.chrome })),
  ]);
  const arms = [];
  for (const sx of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(sx * 1.75, 0.0, -1.2); body.add(a);
    a.add(new THREE.Mesh(armGeo, M.paintFlat)); arms.push(a);
  }
  // glow: headlamps (the "eyes", flared on every telegraph), vents and the launcher's muzzles
  const E = new Kit();
  for (const sx of [-1, 1]) E.add('e', cyl(0.28, 0.28, 0.08, 8, { x: sx * 0.75, rx: Math.PI / 2, color: 0xfff2b0 }));
  E.add('e', box(1.2, 0.08, 0.05, { y: 0.42, z: -0.05, color: 0xff3a2a }));
  const lamps = new THREE.Mesh(E.build().e, M.glow); lamps.name = 'eye'; lamps.position.set(0, 0.35, -2.37); body.add(lamps);
  const V = new Kit();
  for (const z of [0.4, 1.3]) for (const sx of [-1, 1]) V.add('v', box(0.06, 0.12, 0.6, { x: sx * 1.66, y: 0.3, z, color: 0xff7a1a }));
  for (const [x, y] of [[-0.3, 1.45], [0.3, 1.45], [-0.3, 1.1], [0.3, 1.1]]) V.add('v', cyl(0.1, 0.1, 0.05, 6, { x, y: y + 0.15, z: -0.22, rx: Math.PI / 2 - 0.35, color: 0xffb02b }));
  // night accents (so it reads on the dark lawn): amber light lines in the armour seams, cyan strips
  // down the tread housings, hot exhaust tips, a red tail light
  for (const [z, w, l] of [[-0.7, 3.1, 1.7], [0.9, 3.3, 1.7], [2.4, 2.8, 1.5]]) V.add('v', box(w + 0.1, 0.05, 0.05, { y: 0.63, z: z + l / 2 + 0.05, color: 0xffa020 }));
  for (const sx of [-1, 1]) {
    V.add('v', box(0.05, 0.08, 4.0, { x: sx * 2.27, y: -0.78, z: 0.8, color: 0x2be8ff }));
    V.add('v', cyl(0.17, 0.17, 0.05, 6, { x: sx * 0.9, y: 1.92, z: 2.22, rx: -0.3, color: 0xff6a1a }));
  }
  V.add('v', box(0.3, 0.16, 0.08, { y: 1.15, z: 3.72, color: 0xff2a1a }));
  body.add(new THREE.Mesh(V.build().v, M.glow));
  // the dust mound (stays level while the body pitches; placed on the lawn each frame)
  const mound = new THREE.Group(); mound.name = 'mound'; g.add(mound);
  const MK = new Kit();
  MK.add('m', part(new THREE.SphereGeometry(1, seg(12, 8), seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { sx: 2.6, sy: 0.9, sz: 3.0, color: C.dirt }));
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; MK.add('m', ball(0.35 + (i % 3) * 0.15, { x: Math.cos(a) * 2.4, y: 0.15, z: Math.sin(a) * 2.7, color: i % 2 ? C.dirtDk : 0x7a7064 })); }
  MK.add('m', part(new THREE.CylinderGeometry(3.2, 3.4, 0.08, seg(16, 10)), { y: 0.02, color: C.dirtDk }));
  mound.add(new THREE.Mesh(MK.build().m, M.paintFlat));
  g.userData = { body, drill, heat, arms, teeth, lamps, mound, spin: 0, pitch: 0, dustT: 0 };
  return g;
}

const UP = { burrow: 1, emergeTele: 1 };
export function update(R, e, g, dt, t, P) {
  const U = g.userData, st = e.state, depth = e.depth || 0;
  g.position.set(e.cx, e.cy, e.cz);
  g.rotation.y = Math.atan2(-e.fx, -e.fz);
  if (st === 'dying') { g.position.x += Math.sin(t * 60) * 0.12; g.position.z += Math.cos(t * 47) * 0.08; }
  // pitch: noses down to dig, bursts up nose-high, bobs while it crawls, wobbles when dizzy
  let pitch = 0, roll = 0;
  if (st === 'digTele') pitch = -0.22 + Math.sin(t * 22) * 0.03 * R.motion;
  else if (st === 'dig') pitch = -0.65;
  else if (st === 'emerge') pitch = 0.55;
  else if (st === 'stuck') { pitch = -0.18 + Math.sin(t * 9) * 0.06; roll = Math.sin(t * 6) * 0.1; }
  else if (st === 'stunned') { pitch = -0.08; roll = Math.sin(t * 14) * 0.04; }
  else if (st === 'boltTele' || st === 'bolts') pitch = 0.18;
  else if (st === 'crawl') { pitch = Math.sin(e.gait * 2.2) * 0.04; roll = Math.sin(e.gait * 1.1) * 0.05; }
  U.pitch += (pitch - U.pitch) * Math.min(1, dt * 10);
  U.body.rotation.set(-U.pitch, 0, roll);
  U.body.position.y = -e.crouch * 0.35;
  U.body.visible = depth < 0.98;
  // the drill: idles, screams before a dig or a spin, coasts when it's dizzy, glows when it overheats
  const want = { crawl: 5, digTele: 28, dig: 40, emerge: 40, stuck: 2, spinTele: 12 + (1 - Math.max(0, e.timer) / 0.9) * 50, stunned: 0, boltTele: 4, bolts: 4, cool: 3, dying: 0, intro: 1 }[st] ?? 6;
  U.spin += (want - U.spin) * Math.min(1, dt * 4);
  U.drill.rotation.z += U.spin * dt;
  U.heat.visible = st === 'stunned' || (st === 'spinTele' && Math.sin(t * 30) > 0.3);
  // arms: paddle as it crawls, dig like mad before it burrows, rear up to launch, brace for the spin
  U.arms.forEach((a, i) => {
    let rx = 0;
    if (st === 'crawl') rx = Math.sin(e.gait * 2.2 + i * Math.PI) * 0.45;
    else if (st === 'digTele' || st === 'dig') rx = Math.sin(t * 18 + i * Math.PI) * 0.7 + 0.2;
    else if (st === 'boltTele' || st === 'bolts') rx = -1.1 + Math.sin(t * 6) * 0.05;
    else if (st === 'spinTele') rx = 0.5;
    else if (st === 'stuck' || st === 'stunned') rx = 0.7 + Math.sin(t * 3 + i) * 0.1;
    a.rotation.x += (-rx - a.rotation.x) * Math.min(1, dt * 12);
  });
  // treads: the top run slides back, the bottom run forward
  const tread = st === 'crawl' ? e.gait : st === 'digTele' ? t * 6 : 0;
  for (const m of U.teeth) m.position.z = 0.8 + ((tread * m.userData.dir * 0.6) % 0.5);
  // headlamps flare on every telegraph
  const tele = st === 'digTele' || st === 'spinTele' || st === 'boltTele' || st === 'intro';
  U.lamps.scale.setScalar(tele ? 1.25 + Math.sin(t * 40) * 0.25 : 1);
  // the mound: on the lawn over it while it's under, swelling as it's about to burst out
  const showMound = (st === 'dig' && depth > 0.3) || UP[st] || (st === 'emerge' && depth > 0.15);
  U.mound.visible = !!showMound;
  if (showMound) {
    const fl = e.floorY ?? 0;
    U.mound.position.set(0, fl - e.cy + 0.02, 0);
    U.mound.rotation.set(0, 0, 0);
    const k = st === 'emergeTele' ? 1.15 + Math.sin(t * 30) * 0.12 * R.motion : st === 'burrow' ? 0.9 + Math.sin(t * 12) * 0.08 : 0.8;
    U.mound.scale.set(k, k * (st === 'emergeTele' ? 1.3 : 1), k);
    U.dustT -= dt;
    if (U.dustT <= 0) {
      U.dustT = st === 'emergeTele' ? 0.05 : 0.09;
      R.fx.burst(e.cx + (Math.random() - 0.5) * 2, fl + 0.4, e.cz + (Math.random() - 0.5) * 2, st === 'emergeTele' ? 4 : 3, 0x9a7a52, 3, 0.22, 0.6, 9);
    }
  }
  if (st === 'stunned' && Math.random() < dt * 10) R.fx.burst(e.cx + e.fx * 3, e.cy + 0.2, e.cz + e.fz * 3, 2, 0xd8d8d8, 1.5, 0.25, 0.8, -3); // steam off the hot drill
  R.flashModel(g, e.flash > 0 || (st === 'dying' && Math.sin(t * 30) > 0));
}

export default { model: (M, e) => model(M, e), update };
