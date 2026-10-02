// The JADE DRAGON's view: an armoured jade-and-gold head (horns, glowing eyes, cable whiskers, a jaw
// that opens to breathe) and body segments (each its own boss entity in the sim: kind 'dragon',
// seg = 1..N) with gold dorsal fins, clawed legs on two of them and a tail fin on the last.
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from '../geo.js';

const JADE = 0x2fa86a, JADE_DK = 0x146a48, JADE_HI = 0x8ee0b0, GOLD = 0xe8b830, RED = 0xe0303a, BELLY = 0xe8dcb0;
const mesh = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); if (name) m.name = name; return m; };

function headModel(M) {
  const g = new THREE.Group(), K = new Kit(), E = new Kit(), J = new Kit();
  // skull and snout (the model faces -Z)
  K.add('p', box(2.2, 1.5, 2.4, { y: 0.1, z: 0.2, color: JADE }), box(1.6, 1.0, 2.0, { y: 0.15, z: -1.7, color: JADE }));
  K.add('p', box(2.4, 0.35, 2.6, { y: 0.95, z: 0.1, color: GOLD }), box(1.7, 0.3, 2.1, { y: 0.72, z: -1.7, rx: -0.12, color: JADE_DK })); // brow plate
  K.add('p', box(1.2, 0.4, 0.5, { y: 0.5, z: -2.75, color: JADE_HI })); // nose
  for (const sx of [-1, 1]) {
    K.add('p', cyl(0.06, 0.22, 2.6, 5, { x: sx * 0.75, y: 1.9, z: 1.3, rx: -1.0, rz: sx * 0.35, color: GOLD })); // horns, swept back
    K.add('p', cyl(0.04, 0.12, 1.2, 4, { x: sx * 1.05, y: 2.4, z: 1.0, rx: -0.3, rz: sx * 0.9, color: GOLD }));
    K.add('p', box(0.5, 0.9, 1.3, { x: sx * 1.15, y: -0.1, z: 0.6, ry: sx * 0.3, color: JADE_DK })); // cheek armour
    for (let k = 0; k < 4; k++) K.add('p', box(0.12, 0.9, 0.35, { x: sx * (0.55 + k * 0.18), y: 1.2 - k * 0.2, z: 1.5 + k * 0.25, rx: -0.8, color: RED })); // mane spikes
    E.add('e', box(0.42, 0.24, 0.3, { x: sx * 0.62, y: 0.55, z: -0.75, color: 0x7bffd8 }));
    E.add('e', box(0.16, 0.12, 0.12, { x: sx * 0.4, y: 0.42, z: -2.95, color: 0xffa040 })); // nostril glow
    // whiskers: cables trailing back from the snout
    for (let k = 0; k < 5; k++) K.add('p', box(0.07, 0.07, 0.9, { x: sx * (0.7 + k * 0.45), y: 0.25 - k * 0.22, z: -2.4 + k * 0.75, ry: sx * 0.55, rx: 0.25, color: 0x3a3a44 }));
  }
  g.add(mesh(K.build().p, M.paintFlat));
  // jade seams down the snout and round the brow, gold-lit horn tips: it reads against the night smog
  const S = new Kit();
  S.add('s', box(0.1, 0.08, 2.1, { y: 0.88, z: -1.6, rx: -0.12, color: 0x7bffd8 }), box(2.45, 0.08, 0.1, { y: 1.12, z: -1.15, color: 0x7bffd8 }));
  for (const sx of [-1, 1]) S.add('s', box(0.1, 0.1, 0.4, { x: sx * 1.05, y: 2.9, z: 1.85, rx: -1.0, rz: sx * 0.35, color: 0xffd23a }), box(0.07, 0.07, 1.2, { x: sx * 1.12, y: 0.15, z: 0.6, ry: sx * 0.3, color: 0x7bffd8 }));
  g.add(mesh(S.build().s, M.glow));
  const eyes = mesh(E.build().e, M.glow, 'eye'); g.add(eyes);
  // the jaw (opens to breathe fire and spit pearls), with teeth and a glowing throat
  const jaw = new THREE.Group(); jaw.name = 'jaw'; jaw.position.set(0, -0.55, -0.6); g.add(jaw);
  J.add('p', box(1.5, 0.45, 2.3, { y: -0.15, z: -1.0, color: JADE_DK }), box(1.3, 0.12, 2.1, { y: 0.12, z: -1.0, color: BELLY }));
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) J.add('p', part(new THREE.ConeGeometry(0.08, 0.3, 4), { x: sx * 0.55, y: 0.3, z: -1.9 + k * 0.4, color: 0xf8f4e8 }));
  jaw.add(mesh(J.build().p, M.paintFlat));
  const throat = mesh(ball(0.45, { color: 0xffa040 }, 0), M.glow, 'throat'); throat.position.set(0, -0.2, -1.6); throat.scale.set(1.4, 0.6, 2.4); g.add(throat);
  return g;
}

function segModel(M, e, n) {
  const g = new THREE.Group(), K = new Kit(), r = 1, k = e.seg;
  K.add('p', part(new THREE.CylinderGeometry(r, r * 0.92, 2.3, 8), { rx: Math.PI / 2, ry: Math.PI / 8, color: k % 2 ? JADE : JADE_DK })); // body ring, along z
  K.add('p', part(new THREE.CylinderGeometry(r * 0.7, r * 0.7, 2.32, 8), { rx: Math.PI / 2, y: -r * 0.42, sx: 1.05, sy: 0.6, color: BELLY })); // belly plates
  K.add('p', box(r * 1.5, 0.18, 2.0, { y: r * 0.9, color: GOLD })); // the armour's top plate
  K.add('p', part(new THREE.ConeGeometry(0.5, 1.4, 4), { y: r + 0.6, z: 0.3, rx: 0.5, sx: 0.3, color: GOLD })); // dorsal fin
  for (const sx of [-1, 1]) K.add('p', box(0.12, 0.7, 1.2, { x: sx * r * 1.0, y: 0.1, z: 0.4, rz: sx * 0.5, color: RED })); // side fins
  if (k === 2 || k === 9) for (const sx of [-1, 1]) { // a pair of clawed legs
    K.add('p', box(0.4, 1.4, 0.4, { x: sx * r * 1.0, y: -r * 1.0, z: 0.3, rz: -sx * 0.5, rx: 0.4, color: JADE_DK }), box(0.35, 1.2, 0.35, { x: sx * r * 1.4, y: -r * 1.9, z: 0.9, rx: -0.6, color: JADE }));
    for (const c of [-0.2, 0, 0.2]) K.add('p', part(new THREE.ConeGeometry(0.08, 0.5, 4), { x: sx * r * 1.4 + c, y: -r * 2.4, z: 1.35, rx: -1.2, color: GOLD }));
  }
  if (k === n) K.add('p', box(0.15, 2.4, 2.2, { y: 0.3, z: 1.6, rx: 0.4, color: RED }), box(0.12, 1.4, 1.4, { y: 1.2, z: 2.2, rx: 0.9, color: GOLD })); // the tail fin
  g.add(mesh(K.build().p, M.paintFlat));
  const L = new Kit();
  for (const sx of [-1, 1]) L.add('l', box(0.08, 0.12, 1.6, { x: sx * r * 0.98, y: -0.25, color: 0x7bffd8 })); // glowing seams
  L.add('l', box(0.12, 0.06, 1.7, { y: r * 0.9 + 0.1, color: 0xffd23a })); // a gold line down the spine
  g.add(mesh(L.build().l, M.glow));
  g.scale.setScalar(e.rr || 1);
  return g;
}

const TELE = { breathTele: 1, diveTele: 1, rage: 1 };
export const DRAGON_VIEW = {
  model(M, e) { return e.seg ? segModel(M, e, 16) : headModel(M); },
  update(R, e, g, dt, t, P) {
    const H = e.seg ? e.head : e;
    const dying = H && H.state === 'dying';
    R.flashModel(g, !!H && (H.flash > 0 || (dying && Math.sin(t * 30) > 0)));
    if (e.seg) {
      g.position.set(e.cx, e.cy, e.cz);
      g.rotation.order = 'YXZ';
      g.rotation.set(Math.asin(Math.max(-1, Math.min(1, e.hy))), Math.atan2(-e.hx, -e.hz), Math.sin(t * 3 + e.seg * 0.7) * 0.15 * R.motion);
      return;
    }
    g.position.set(e.cx, e.cy - e.crouch * 0.4, e.cz);
    g.rotation.order = 'YXZ';
    g.rotation.set(e.fp, Math.atan2(-e.fx, -e.fz), dying ? Math.sin(t * 20) * 0.3 : 0);
    const open = e.state === 'breath' ? 0.75 : e.state === 'breathTele' || e.orbTele > 0 ? 0.45 : e.state === 'stunned' ? 0.25 : 0.08;
    const jaw = g.getObjectByName('jaw'); jaw.rotation.x += (open - jaw.rotation.x) * Math.min(1, dt * 10);
    const tele = TELE[e.state] || e.orbTele > 0;
    g.getObjectByName('eye').scale.setScalar(tele ? 1.4 + Math.sin(t * 40) * 0.3 : e.state === 'stunned' ? 0.5 : 1);
    const th = g.getObjectByName('throat'); th.visible = e.state === 'breath' || e.state === 'breathTele' || e.orbTele > 0;
    if (th.visible) th.scale.set(1.4, 0.6, 2.4).multiplyScalar(e.state === 'breath' ? 1.2 + Math.sin(t * 50) * 0.15 : 0.6 + Math.sin(t * 30) * 0.2);
  },
};
