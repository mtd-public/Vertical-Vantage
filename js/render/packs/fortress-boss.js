// DREADNOUGHT's view: the armoured command core on its plinth. A plated drum on a heavy skirt, a
// visor band with the red eye-slit, six dome petals that hinge open to bare the glowing heart, a
// stompable crown, shoulder missile pods, radar dishes, antenna masts, warning beacons, heat vents,
// and a violet wireframe shield while its flak pods live. Its bombing runs bring a bomber over.
// The group sits at the world origin; the core and the bomber are placed inside it every frame.
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from '../geo.js';
import { seg } from '../retro.js';
import { C, strut } from './fortress-styles.js';

const own = (m) => { m.userData.own = true; return m; };
const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); if (name) m.name = name; return m; };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function model(M) {
  const g = new THREE.Group(), core = new THREE.Group();
  g.add(core);
  // ---- fixed armour: skirt, drum, visor band, antenna masts, launcher pods, dish arms
  const K = new Kit(), A = (...a) => K.add('p', ...a), L = (...a) => K.add('l', ...a);
  A(cyl(3.95, 4.2, 1.0, 12, { y: 0.5, color: 0x2c3038 }));
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; A(box(1.0, 0.3, 0.12, { x: Math.cos(a) * 4.02, y: 0.85, z: Math.sin(a) * 4.02, ry: -a + Math.PI / 2, color: i % 2 ? C.black : C.yellow })); }
  A(cyl(3.55, 3.8, 2.0, 12, { y: 2.0, color: 0x4f5764 }));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    A(box(0.5, 2.1, 0.4, { x: Math.cos(a) * 3.66, y: 2.0, z: Math.sin(a) * 3.66, ry: -a + Math.PI / 2, color: 0x3a414c })); // ribs
    A(box(0.16, 0.16, 0.16, { x: Math.cos(a) * 3.85, y: 2.75, z: Math.sin(a) * 3.85, color: 0xc8ccd4 })); // bolts
  }
  A(cyl(3.62, 3.58, 0.95, 16, { y: 3.45, color: 0x2a2e36 }));
  A(box(3.2, 0.3, 0.9, { y: 3.98, z: -3.3, color: 0x3a414c })); // the brow over the eye-slit
  for (const [x, z, h] of [[0.9, 2.4, 7.5], [-1.1, 2.2, 9.5], [0.1, 2.9, 5.5]]) A(cyl(0.07, 0.12, h, 5, { x, y: 3.9 + h / 2, z, color: 0x9aa2ae }), box(0.5, 0.08, 0.08, { x, y: 3.9 + h * 0.7, z, color: 0x9aa2ae }));
  for (const sx of [-1, 1]) {
    A(box(1.5, 1.3, 2.2, { x: sx * 2.75, y: 4.6, z: -0.8, color: 0x4a515c }), box(1.56, 0.25, 2.26, { x: sx * 2.75, y: 5.3, z: -0.8, color: C.yellow }));
    for (const [dx, dy] of [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]]) A(cyl(0.22, 0.22, 0.2, 6, { x: sx * 2.75 + dx, y: 4.6 + dy, z: -1.92, rx: Math.PI / 2, color: 0x15171c }));
    A(box(1.2, 0.3, 0.3, { x: sx * 3.6, y: 4.3, z: 0.6, color: 0x3a414c })); // dish arm
    L(box(0.12, 1.2, 0.5, { x: sx * 3.82, y: 1.6, z: 0, color: 0xff6a1a })); // side vents (always a little warm)
  }
  A(box(2.4, 1.6, 0.3, { y: 1.7, z: 3.72, color: 0x23262c })); // the hangar hatch (back)
  // night accents (always lit): a light down every rib, rings round the skirt and the visor band,
  // lit rims on the launcher pods, so the core reads against the night
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + Math.PI / 12; L(box(0.12, 1.5, 0.06, { x: Math.cos(a) * 3.89, y: 2.0, z: Math.sin(a) * 3.89, ry: -a + Math.PI / 2, color: i % 3 ? 0x2be8ff : 0xb45bff })); }
  L(part(new THREE.TorusGeometry(4.13, 0.07, 3, 24), { rx: Math.PI / 2, y: 0.32, color: 0xffb02b }));
  L(part(new THREE.TorusGeometry(3.66, 0.06, 3, 24), { rx: Math.PI / 2, y: 2.98, color: 0xb45bff }), part(new THREE.TorusGeometry(3.63, 0.06, 3, 24), { rx: Math.PI / 2, y: 3.93, color: 0xb45bff }));
  for (const sx of [-1, 1]) {
    for (const [w, h, dx, dy] of [[1.56, 0.07, 0, 0.62], [1.56, 0.07, 0, -0.62], [0.07, 1.3, 0.76, 0], [0.07, 1.3, -0.76, 0]]) L(box(w, h, 0.06, { x: sx * 2.75 + dx, y: 4.6 + dy, z: -1.93, color: 0xffb02b }));
    L(box(0.2, 0.2, 0.2, { x: sx * 4.2, y: 4.3, z: 0.6, color: 0xff3a3a }));
  }
  for (const sx of [-1, 1]) A(strut([sx * 1.4, 0.95, 3.7], [sx * 1.4, 2.5, 3.7], 0.18, C.yellow));
  const k = K.build();
  core.add(mesh(k.p, M.paintFlat), mesh(k.l, M.glow));
  // ---- the heart (bared when the petals open), the eye-slit, the crown
  const heartMat = own(new THREE.MeshBasicMaterial({ color: 0x9a3aff }));
  const heart = new THREE.Group(); heart.name = 'heart'; heart.position.y = 4.4;
  heart.add(mesh(ball(1.75, { color: 0xffffff }, 1), heartMat), mesh(ball(1.05, { color: 0xffffff }, 0), own(new THREE.MeshBasicMaterial({ color: 0xffe8ff }))));
  core.add(heart);
  const eyeMat = own(new THREE.MeshBasicMaterial({ color: 0xff2a3a }));
  const eye = mesh(box(2.5, 0.34, 0.3, { color: 0xffffff }), eyeMat, 'eye'); eye.position.set(0, 3.62, -3.52); core.add(eye);
  const crown = new THREE.Group(); crown.position.y = 5.1;
  const CK = new Kit();
  CK.add('p', cyl(1.9, 2.25, 0.5, 8, { y: 0.25, color: 0x5a626e }), cyl(1.5, 1.5, 0.06, 8, { y: 0.52, color: 0x3a414c }));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; CK.add('p', box(0.8, 0.07, 0.3, { x: Math.cos(a) * 1.2, y: 0.53, z: Math.sin(a) * 1.2, ry: -a + Math.PI / 2, color: i % 2 ? C.black : C.yellow })); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; CK.add('l', box(0.2, 0.16, 0.2, { x: Math.cos(a) * 2.12, y: 0.3, z: Math.sin(a) * 2.12, color: 0xffb02b })); }
  const ck = CK.build(); crown.add(mesh(ck.p, M.paintFlat), mesh(ck.l, M.glow));
  const crownRing = mesh(part(new THREE.TorusGeometry(2.0, 0.12, 3, 16), { rx: Math.PI / 2, color: 0xffffff }), own(new THREE.MeshBasicMaterial({ color: 0xffd23a })), 'crownRing');
  crownRing.position.y = 0.05; crown.add(crownRing);
  core.add(crown);
  // ---- six dome petals on hinges round the visor band
  const petals = [];
  const PK = new Kit();
  PK.add('p', box(3.25, 2.05, 0.45, { y: 1.02, color: 0x5c6573 }), box(3.0, 0.2, 0.5, { y: 1.95, color: 0x3a414c }), box(0.3, 1.6, 0.5, { y: 0.9, color: 0x3a414c }));
  PK.add('g', box(2.2, 0.12, 0.47, { y: 0.35, color: C.violet }), box(3.27, 0.06, 0.47, { y: 2.06, color: 0x2be8ff }));
  const pk = PK.build();
  for (let i = 0; i < 6; i++) {
    const turn = new THREE.Group(); turn.rotation.y = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const hinge = new THREE.Group(); hinge.position.set(0, 3.9, -2.9);
    hinge.add(mesh(pk.p, M.paintFlat), mesh(pk.g, M.glow));
    turn.add(hinge); core.add(turn); petals.push(hinge);
  }
  // ---- radar dishes, launcher doors, hatch, vents, beacons (animated bits)
  const dishes = [];
  for (const sx of [-1, 1]) {
    const d = new THREE.Group(); d.position.set(sx * 4.3, 4.6, 0.6);
    const DK = new Kit();
    DK.add('p', part(new THREE.CylinderGeometry(1.35, 0.25, 0.5, seg(12, 8), 1, true), { z: -0.3, rx: -Math.PI / 2, color: 0xe0e4ea }), part(new THREE.CylinderGeometry(1.35, 0.25, 0.5, seg(12, 8), 1, true), { z: -0.3, rx: -Math.PI / 2, sx: -1, color: 0x9aa2ae }), cyl(0.12, 0.12, 0.6, 5, { y: -0.4, color: 0x3a414c }));
    d.add(mesh(DK.build().p, M.paintFlat)); core.add(d); dishes.push(d);
  }
  const glowBox = (w, h, d, o, name) => { const m = mesh(box(w, h, d, { color: o.color }), M.glow, name); m.position.set(o.x || 0, o.y || 0, o.z || 0); m.rotation.y = o.ry || 0; return m; };
  const launch = [-1, 1].map((sx) => { const m = glowBox(1.2, 1.0, 0.1, { x: sx * 2.75, y: 4.6, z: -1.98, color: 0xff7a2a }, 'launch'); core.add(m); return m; });
  const hatch = glowBox(2.0, 1.2, 0.1, { y: 1.7, z: 3.9, color: 0x2be8ff }, 'hatch'); core.add(hatch);
  const VK = new Kit();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; VK.add('v', box(0.6, 1.4, 0.1, { x: Math.cos(a) * 3.79, y: 2.0, z: Math.sin(a) * 3.79, ry: -a + Math.PI / 2, color: 0xff8a2a })); }
  const vents = mesh(VK.build().v, M.glow, 'vents'); core.add(vents);
  const BK = new Kit();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; BK.add('b', cyl(0.18, 0.18, 0.3, 6, { x: Math.cos(a) * 3.95, y: 1.2, z: Math.sin(a) * 3.95, color: C.amber })); }
  for (const [x, z, h] of [[0.9, 2.4, 7.5], [-1.1, 2.2, 9.5], [0.1, 2.9, 5.5]]) BK.add('b', box(0.3, 0.3, 0.3, { x, y: 3.9 + h + 0.1, z, color: C.navRed }));
  const blink = mesh(BK.build().b, M.glow, 'blink'); core.add(blink);
  // ---- the shield: a violet wireframe bubble and a faint skin
  const shield = new THREE.Group(); shield.position.y = 2.9;
  shield.add(mesh(new THREE.IcosahedronGeometry(5.0, 1), own(new THREE.MeshBasicMaterial({ color: 0xa070ff, wireframe: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }))));
  shield.add(mesh(new THREE.IcosahedronGeometry(4.95, 1), own(new THREE.MeshBasicMaterial({ color: 0x6a3aff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))));
  g.add(shield);
  // ---- the bomber that flies its bombing runs
  const bomber = new THREE.Group();
  const WK = new Kit();
  for (const sx of [-1, 1]) WK.add('p', box(15, 0.9, 6, { x: sx * 7, z: 3.4, ry: sx * 0.55, color: 0x3a414c }), box(5, 0.7, 3, { x: sx * 14.5, z: 7.5, ry: sx * 0.55, color: 0x2c3038 }));
  WK.add('p', box(4.5, 2, 12, { z: 1, color: 0x4a515c }), part(new THREE.ConeGeometry(2.25, 4, 4), { z: -6.8, rx: -Math.PI / 2, ry: Math.PI / 4, color: 0x4a515c }));
  for (const sx of [-1, 1]) WK.add('g', box(1.4, 0.6, 0.3, { x: sx * 2.2, z: 7.2, color: 0xff8a3a }), box(0.9, 0.3, 0.32, { x: sx * 2.2, z: 7.25, color: 0xfff0c0 }), box(0.6, 0.6, 0.6, { x: sx * 16.5, z: 8.6, color: sx < 0 ? C.navRed : C.green }));
  WK.add('g', box(2.2, 0.5, 1.6, { y: 1.1, z: -3.6, color: 0x2bd8c8 }), box(0.4, 0.4, 0.4, { y: -1.1, z: 1, color: C.navRed }), box(9, 0.12, 0.12, { y: 0.5, z: 1.6, color: C.violet }));
  const wk = WK.build(); bomber.add(mesh(wk.p, M.paintFlat), mesh(wk.g, M.glow));
  bomber.visible = false; g.add(bomber);
  g.userData = { core, heart, heartMat, eye, eyeMat, crown, crownRing, petals, dishes, launch, hatch, vents, blink, shield, bomber, yaw: 0, k: 0 };
  return g;
}

function update(R, e, g, dt, t, P) {
  const U = g.userData, core = U.core, dying = e.state === 'dying';
  const shake = dying ? 0.12 : e.state === 'stagger' ? 0.06 : e.state === 'seal' ? 0.04 : 0;
  core.position.set(e.cx + (shake ? Math.sin(t * 61) * shake : 0), e.y + (shake ? Math.sin(t * 47) * shake * 0.5 : 0), e.cz);
  const want = Math.atan2(-e.fx, -e.fz);
  U.yaw += wrap(want - U.yaw) * Math.min(1, dt * (e.beam.on ? 30 : 10));
  core.rotation.y = U.yaw;
  // petals hinge open with openK (eased), the crown lifts a little, the heart shows
  const k = e.openK * e.openK * (3 - 2 * e.openK);
  U.petals.forEach((h, i) => {
    const wob = e.state === 'stagger' ? Math.sin(t * 30 + i) * 0.08 : 0;
    h.rotation.x = 0.78 - k * 1.25 + wob;
    h.position.set(0, 3.9 - k * 0.5, -2.9 - k * 0.7);
  });
  U.crown.position.y = 5.1 + k * 0.08;
  U.crownRing.visible = e.open && !dying && (R.flashK < 1 || Math.sin(t * 8) > -0.4);
  const charge = e.state === 'charge', firing = e.beam.on;
  const pulse = 0.5 + 0.5 * Math.sin(t * (e.open ? 6 : 2.5));
  U.heart.scale.setScalar((0.82 + k * 0.18) * (1 + pulse * 0.06 + (charge ? 0.12 : 0)));
  U.heart.rotation.y += dt * (0.6 + k * 2);
  U.heartMat.color.setHex(dying ? 0xffffff : e.state === 'stagger' ? (Math.sin(t * 40) > 0 ? 0xffffff : 0xff3a8a) : charge || firing ? 0xffd8ff : e.open ? 0xc04aff : 0x5a1a8a);
  // the eye-slit flares while it charges and fires
  const flare = charge ? 1.25 + Math.sin(t * 40) * 0.25 * R.flashK : firing ? 1.5 : 1;
  U.eye.scale.set(1, flare, 1);
  U.eyeMat.color.setHex(charge || firing ? 0xffd0d0 : e.state === 'stagger' ? 0x5a1018 : 0xff2a3a);
  // launcher doors glow through the salvo telegraph and while it fires; the hatch before drones launch
  const salvo = e.misT > 0 || e.misN > 0;
  U.launch.forEach((m, i) => { m.visible = salvo && (e.misT > 0 ? Math.sin(t * 28) > -0.2 : (i === 0 ? e.misSide < 0 : e.misSide > 0) || e.misGap > 0.3); });
  U.hatch.visible = e.droneT > 0 && Math.sin(t * 24) > -0.3;
  U.vents.visible = e.state === 'vent' || e.state === 'stagger' || dying;
  U.blink.visible = Math.sin(t * (e.state === 'seal' || e.state === 'unseal' || e.state === 'arm' ? 18 : 4)) > 0;
  for (const d of U.dishes) d.rotation.y = t * 1.8;
  // the shield, while it's sealed
  U.shield.visible = e.vuln === 0 && !dying && e.state !== 'unseal';
  if (U.shield.visible) { U.shield.position.set(e.cx, e.y + 2.9, e.cz); U.shield.rotation.y = t * 0.3; U.shield.scale.setScalar(1 + Math.sin(t * 3) * 0.015); }
  // the bomber, along its run
  const B = U.bomber;
  B.visible = e.bombT > 0 && !dying;
  if (B.visible) {
    const q = 1 - e.bombT / (e.bombMax || 1);
    B.position.set(e.bx0 + (e.bx1 - e.bx0) * q, 26 + Math.sin(q * 3) * 1.5, e.bz0 + (e.bz1 - e.bz0) * q);
    B.rotation.y = Math.atan2(-(e.bx1 - e.bx0), -(e.bz1 - e.bz0));
  }
  R.flashModel(core, e.flash > 0 || (dying && Math.sin(t * 30) > 0));
}

export const BOSS_VIEW = { model, update };
