// STORMCROW's view: an armoured crow drone, black with teal plates, a glowing yellow eye, wings that
// flap (and sweep back for the dive, spread for the telegraphs, droop when it perches), talons that
// drop for landing, a fanned tail, and a storm coil on its back that sparks. It also draws the
// lightning: a bolt from the sky for every strike that lands (and some far off, for the storm),
// with a sky flash. Model faces -Z, origin = body centre (the sim's cx, cy, cz).
import * as THREE from 'three';
import { Kit, box, cyl, part, prep } from '../geo.js';

// blue-black so the facets still read against a storm sky; teal armour; glowing teal edges
const C = { black: 0x2a303a, dark: 0x3a424e, gun: 0x5e6672, teal: 0x2aa49c, tealHi: 0x4adccc, beak: 0x474e58, eye: 0xffe03a, coil: 0x9ff8ff, edge: 0x3af0e0 };
const merge = (list) => { const K = new Kit(); K.add('x', ...list); return K.build().x; };
const addMat = (color) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }); m.userData.own = true; return m; };

function wing(M, sx) {
  const g = new THREE.Group(); g.name = sx > 0 ? 'wingR' : 'wingL';
  g.position.set(sx * 0.7, 0.42, -0.5);
  g.add(new THREE.Mesh(merge([
    box(3.0, 0.22, 1.5, { x: sx * 1.5, color: C.black }),
    box(2.7, 0.1, 1.0, { x: sx * 1.4, y: 0.14, z: -0.15, color: C.teal }),
    box(1.2, 0.1, 0.5, { x: sx * 0.9, y: 0.2, z: -0.45, color: C.tealHi }),
    box(3.1, 0.3, 0.26, { x: sx * 1.5, y: 0.02, z: -0.78, color: C.gun }),
    box(2.4, 0.1, 0.7, { x: sx * 1.6, y: -0.12, z: 0.7, rx: 0.15, color: C.dark }), // secondaries
  ]), M.paintFlat));
  const hand = new THREE.Group(); hand.name = 'hand'; hand.position.set(sx * 3.0, 0, -0.2); g.add(hand);
  const P = [box(1.2, 0.16, 1.2, { x: sx * 0.5, color: C.black }), box(1.0, 0.1, 0.6, { x: sx * 0.45, y: 0.12, z: -0.2, color: C.teal })];
  // primaries fanned back from the wrist: a box len long, its inner end at the wrist, turned by a about y
  const at = (x, z, a) => ({ x: x * Math.cos(a) + z * Math.sin(a), z: -x * Math.sin(a) + z * Math.cos(a) });
  for (let k = 0; k < 5; k++) {
    const a = -sx * (k * 0.16 - 0.1), len = 2.8 - k * 0.25, z0 = -0.4 + k * 0.2;
    const c = at(sx * (0.5 + len / 2), z0, a), e = at(sx * (0.5 + len * 0.45), z0 - 0.17, a);
    P.push(box(len, 0.08, 0.42, { x: c.x, z: c.z, ry: a, color: k % 2 ? C.dark : C.black }));
    if (k === 0 || k === 3) P.push(box(len * 0.8, 0.1, 0.08, { x: e.x, y: 0.04, z: e.z, ry: a, color: C.tealHi }));
  }
  hand.add(new THREE.Mesh(merge(P), M.paintFlat));
  // glowing leading edges, so the wing shape reads in the dark
  g.add(new THREE.Mesh(merge([box(3.0, 0.08, 0.08, { x: sx * 1.5, y: 0.1, z: -0.93, color: C.edge })]), M.glow));
  hand.add(new THREE.Mesh(merge([box(2.7, 0.07, 0.07, { x: sx * 1.85, y: 0.06, z: -0.6, ry: sx * 0.1, color: C.edge })]), M.glow));
  g.userData.hand = hand;
  return g;
}

function boltGeo(n) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 12 * 3), 3));
  g.userData.n = n;
  return g;
}
// A jagged bolt from a to b, `w` wide: each segment two crossed quads.
function setBolt(geo, ax, ay, az, bx, by, bz, jag, w) {
  const n = geo.userData.n, pos = geo.attributes.position.array, pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, j = i === 0 || i === n ? 0 : jag;
    pts.push([ax + (bx - ax) * t + (Math.random() - 0.5) * j, ay + (by - ay) * t, az + (bz - az) * t + (Math.random() - 0.5) * j]);
  }
  let o = 0;
  const quad = (p, q, ox, oz) => {
    const v = [[p[0] - ox, p[1], p[2] - oz], [p[0] + ox, p[1], p[2] + oz], [q[0] + ox, q[1], q[2] + oz], [p[0] - ox, p[1], p[2] - oz], [q[0] + ox, q[1], q[2] + oz], [q[0] - ox, q[1], q[2] - oz]];
    for (const x of v) { pos[o++] = x[0]; pos[o++] = x[1]; pos[o++] = x[2]; }
  };
  for (let i = 0; i < n; i++) { const ww = w * (1 - i / (n * 1.6)); quad(pts[i], pts[i + 1], ww, 0); quad(pts[i], pts[i + 1], 0, ww); }
  geo.attributes.position.needsUpdate = true;
  geo.computeBoundingSphere();
}

export const stormcrow = {
  model(M) {
    const g = new THREE.Group();
    const body = new THREE.Group(); body.name = 'body'; g.add(body);
    body.add(new THREE.Mesh(merge([
      part(new THREE.CylinderGeometry(0.7, 1.0, 3.0, 6), { z: -0.1, rx: Math.PI / 2, sx: 1.1, sz: 0.78, color: C.black }), // torso
      box(1.5, 0.14, 1.5, { y: 0.62, z: -0.9, rx: 0.22, color: C.teal }), box(0.5, 0.1, 1.2, { y: 0.72, z: -0.85, rx: 0.22, color: C.tealHi }), // chest plate
      box(1.3, 0.16, 1.9, { y: 0.66, z: 0.65, rx: -0.08, color: C.dark }), // back plate
      box(1.2, 0.32, 2.3, { y: -0.6, z: 0, color: C.dark }), box(0.9, 0.12, 1.6, { y: -0.78, z: 0.1, color: C.teal }), // belly
      part(new THREE.CylinderGeometry(0.35, 0.65, 1.6, 6), { z: 1.9, rx: Math.PI / 2, sz: 0.7, color: C.black }), // rump
      box(1.0, 0.86, 1.15, { y: 0.32, z: -2.0, color: C.black }), // head
      box(0.42, 0.1, 0.62, { x: 0.32, y: 0.8, z: -2.15, rz: -0.32, color: C.teal }), box(0.42, 0.1, 0.62, { x: -0.32, y: 0.8, z: -2.15, rz: 0.32, color: C.teal }), // brows
      part(new THREE.ConeGeometry(0.34, 1.8, 4), { y: 0.22, z: -3.35, rx: -Math.PI / 2, ry: Math.PI / 4, color: C.beak }), // beak
      part(new THREE.ConeGeometry(0.22, 1.1, 4), { y: -0.06, z: -2.95, rx: -Math.PI / 2 - 0.12, ry: Math.PI / 4, color: C.dark }), // lower beak
      ...[-1, 1].flatMap((s) => [
        part(new THREE.ConeGeometry(0.2, 0.9, 4), { x: s * 0.55, y: 0.55, z: -1.45, rz: -s * 1.0, rx: 0.4, color: C.black }), // neck ruff
        part(new THREE.ConeGeometry(0.18, 0.8, 4), { x: s * 0.4, y: 0.75, z: -1.2, rz: -s * 0.5, rx: 0.8, color: C.dark }),
        box(0.08, 0.5, 1.6, { x: s * 0.86, y: 0.1, z: -0.4, color: C.gun }), // side seams
      ]),
    ]), M.paintFlat));
    const eye = new THREE.Mesh(merge([box(0.3, 0.2, 0.14, { x: 0.46, color: C.eye }), box(0.3, 0.2, 0.14, { x: -0.46, color: C.eye }), box(0.8, 0.06, 0.06, { y: 0.13, z: -0.05, color: 0xffb020 })]), M.glow);
    eye.name = 'eye'; eye.position.set(0, 0.42, -2.42); body.add(eye);
    // glowing seams: a chevron on the chest, lines down the flanks, the tail fins' edges
    body.add(new THREE.Mesh(merge([
      box(0.9, 0.06, 0.06, { x: 0.38, y: 0.72, z: -1.35, ry: -0.5, color: C.edge }), box(0.9, 0.06, 0.06, { x: -0.38, y: 0.72, z: -1.35, ry: 0.5, color: C.edge }),
      box(0.06, 0.06, 2.4, { x: 0.9, y: -0.1, z: -0.2, color: C.edge }), box(0.06, 0.06, 2.4, { x: -0.9, y: -0.1, z: -0.2, color: C.edge }),
    ]), M.glow));
    // the storm coil on its back
    const coil = new THREE.Group(); coil.name = 'coil'; coil.position.set(0, 0.75, 0.35); body.add(coil);
    coil.add(new THREE.Mesh(merge([cyl(0.48, 0.55, 0.36, 6, { y: 0.18, color: C.gun }), cyl(0.22, 0.26, 1.5, 6, { y: 1.0, color: C.dark }), box(0.9, 0.12, 0.2, { y: 0.4, color: C.teal })]), M.paintFlat));
    const rings = new THREE.Mesh(merge([0.55, 0.85, 1.15, 1.45].map((y, i) => part(new THREE.TorusGeometry(0.42 - i * 0.04, 0.06, 3, 8), { y, rx: Math.PI / 2, color: C.coil })).concat([part(new THREE.IcosahedronGeometry(0.3, 0), { y: 1.85, color: 0xe8ffff })])), M.glow);
    rings.name = 'rings'; coil.add(rings);
    const sparkMat = addMat(0xbff8ff);
    const sparks = [];
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(boltGeo(4), sparkMat); s.frustumCulled = false; s.visible = false; coil.add(s); sparks.push(s); }
    // wings, tail, talons
    const wl = wing(M, -1), wr = wing(M, 1); body.add(wl, wr);
    const tail = new THREE.Group(); tail.name = 'tail'; tail.position.set(0, 0.05, 2.5); body.add(tail);
    tail.add(new THREE.Mesh(merge([0, 1, 2, 3, 4].flatMap((k) => {
      const a = (k - 2) * 0.24, out = [box(0.5, 0.08, 2.6, { x: Math.sin(a) * 1.3, z: Math.cos(a) * 1.3, ry: a, color: k % 2 ? C.dark : C.black })];
      if (k === 0 || k === 4) out.push(box(0.1, 0.5, 1.4, { x: Math.sin(a) * 1.5, y: 0.25, z: Math.cos(a) * 1.4, ry: a, color: C.teal })); // tail fins
      return out;
    })), M.paintFlat));
    tail.add(new THREE.Mesh(merge([-0.48, 0.48].map((a) => box(0.06, 0.06, 1.4, { x: Math.sin(a) * 1.5, y: 0.52, z: Math.cos(a) * 1.4, ry: a, color: C.edge }))), M.glow));
    const legs = new THREE.Group(); legs.name = 'legs'; legs.position.set(0, -0.62, 0.25); body.add(legs);
    legs.add(new THREE.Mesh(merge([-1, 1].flatMap((s) => [
      box(0.18, 0.9, 0.18, { x: s * 0.45, y: -0.45, color: C.gun }), box(0.26, 0.24, 0.26, { x: s * 0.45, y: -0.9, color: C.dark }),
      ...[-0.5, 0, 0.5].map((a) => part(new THREE.ConeGeometry(0.08, 0.55, 4), { x: s * 0.45 + Math.sin(a) * 0.2, y: -1.0, z: -Math.cos(a) * 0.28, rx: -Math.PI / 2 + 0.5, ry: a, color: C.beak })),
      part(new THREE.ConeGeometry(0.07, 0.4, 4), { x: s * 0.45, y: -1.0, z: 0.25, rx: Math.PI / 2 - 0.5, color: C.beak }),
    ])), M.paintFlat));
    g.userData = { body, eye, coil, rings, sparks, wl, wr, tail, legs, yaw: null, bank: 0, pitch: 0, fold: 0, spread: 0, droop: 0, legK: 0, sparkT: 0, bolts: null, ambT: 3, flash: 0, seen: new Set() };
    g.scale.setScalar(0.92);
    return g;
  },

  update(R, e, g, dt, t, P) {
    const U = g.userData, body = U.body;
    const yaw = Math.atan2(-e.fx, -e.fz);
    if (U.yaw === null) U.yaw = yaw;
    let dy = yaw - U.yaw; dy -= Math.round(dy / (Math.PI * 2)) * Math.PI * 2;
    U.yaw += dy * Math.min(1, dt * 10);
    const turn = dt > 0 ? dy / Math.max(dt, 1e-3) : 0;
    const hv = Math.sqrt(e.vx * e.vx + e.vz * e.vz);
    const perched = e.state === 'perch' || e.state === 'gust';
    const dying = e.state === 'dying';
    const wantBank = perched ? 0 : Math.max(-0.6, Math.min(0.6, -turn * 0.18 * Math.min(1, hv / 6)));
    const wantPitch = perched ? 0.05 : Math.max(-1.0, Math.min(0.5, Math.atan2(e.vy, Math.max(hv, 2)) * 0.8));
    U.bank += (wantBank - U.bank) * Math.min(1, dt * 4);
    U.pitch += (wantPitch - U.pitch) * Math.min(1, dt * 5);
    g.position.set(e.cx, e.cy - (perched ? 0.15 : 0), e.cz);
    g.rotation.order = 'YXZ';
    g.rotation.set(U.pitch, U.yaw, U.bank);
    if (dying) { g.rotation.z += t * 4; g.rotation.x += Math.sin(t * 7) * 0.3; }
    R.flashModel(g, e.flash > 0 || (dying && Math.sin(t * 30) > 0));
    // wing poses: sweep back in the dive, spread wide for the telegraphs, droop on the perch
    const tele = e.state === 'diveTele' || e.state === 'fanTele' || e.state === 'stormTele' || e.state === 'gust';
    const fold = e.state === 'dive' ? 1 : 0, spread = tele ? 1 : 0, droop = perched && e.state !== 'gust' ? 1 : 0;
    const k = Math.min(1, dt * 6);
    U.fold += (fold - U.fold) * k; U.spread += (spread - U.spread) * k; U.droop += (droop - U.droop) * k;
    const flapAmp = (e.state === 'gust' ? 0.9 : 0.55) * (1 - U.fold * 0.8) * (1 - U.droop * 0.85) * (R.motion ? 1 : 0.6);
    const f = Math.sin(e.flap * Math.PI * 2);
    for (const [w, sx] of [[U.wl, -1], [U.wr, 1]]) {
      w.rotation.z = sx * (f * flapAmp + U.spread * 0.35 - U.droop * 0.55 + 0.05);
      w.rotation.y = -sx * (U.fold * 0.95 + U.droop * 0.75 - U.spread * 0.1);
      w.userData.hand.rotation.z = sx * (Math.sin(e.flap * Math.PI * 2 - 0.6) * flapAmp * 0.7 - U.droop * 0.5);
      w.userData.hand.rotation.y = -sx * (U.fold * 0.7 + U.droop * 1.1);
    }
    U.tail.rotation.x = -U.pitch * 0.4 + Math.sin(t * 2.3) * 0.05;
    U.tail.rotation.y = Math.max(-0.4, Math.min(0.4, turn * 0.06));
    const legWant = perched || e.state === 'land' ? 1 : 0;
    U.legK += (legWant - U.legK) * Math.min(1, dt * 5);
    U.legs.rotation.x = (1 - U.legK) * 1.25;
    // the eye flares on every telegraph; the coil sparks before lightning
    U.eye.scale.setScalar(1 + e.tele * (0.8 + Math.sin(t * 40) * 0.25) - (perched ? 0.35 : 0) + (dying ? Math.sin(t * 50) * 0.3 : 0));
    const coilK = Math.max(e.coil, 0.15);
    U.rings.scale.set(1 + Math.sin(t * 18) * 0.08 * coilK, 1, 1 + Math.sin(t * 18) * 0.08 * coilK);
    U.sparkT -= dt;
    if (U.sparkT <= 0) {
      U.sparkT = 0.06;
      for (const s of U.sparks) {
        s.visible = Math.random() < (e.coil > 0.1 ? 0.95 : 0.12) * (perched ? 0.4 : 1);
        if (s.visible) { const a = Math.random() * Math.PI * 2, r = 1.0 + Math.random() * 1.6 * (0.4 + e.coil); setBolt(s.geometry, 0, 1.85, 0, Math.cos(a) * r, 1.4 + Math.random() * 1.6, Math.sin(a) * r, 0.5, 0.05); }
      }
    }
    // lightning: a bolt from the sky for every strike that lands, and now and then one far off
    if (!U.bolts) {
      U.bolts = [];
      const mat = addMat(0xd8f4ff);
      for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(boltGeo(10), mat); m.frustumCulled = false; m.visible = false; m.userData.life = 0; R.level.root.add(m); U.bolts.push(m); }
    }
    const strike = (x0, y0, z0, x1, y1, z1, w) => {
      const b = U.bolts.find((m) => !m.visible) || U.bolts[0];
      setBolt(b.geometry, x0, y0, z0, x1, y1, z1, 3.5, w); b.visible = true; b.userData.life = 0.2;
    };
    for (const s of e.strikes || []) {
      if (U.seen.has(s)) continue;
      U.seen.add(s);
      strike(s.x + (Math.random() - 0.5) * 6, s.y + 46, s.z + (Math.random() - 0.5) * 6, s.x, s.y, s.z, 0.32);
      U.flash = Math.max(U.flash, 0.5 + 0.25 * e.phase); // brighter as the storm builds
    }
    if (U.seen.size > 40) U.seen = new Set(e.strikes || []);
    U.ambT -= dt;
    if (U.ambT <= 0 && !dying) {
      U.ambT = 2.5 + Math.random() * (7 - e.phase * 1.5);
      const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 110;
      strike(P.x + Math.cos(a) * r, 70, P.z + Math.sin(a) * r, P.x + Math.cos(a) * r + (Math.random() - 0.5) * 20, -60, P.z + Math.sin(a) * r + (Math.random() - 0.5) * 20, 0.9);
      U.flash = Math.max(U.flash, 0.35);
    }
    for (const b of U.bolts) if (b.visible) { b.userData.life -= dt; b.material.opacity = 0.95; if (b.userData.life <= 0) b.visible = false; }
    // the sky flash (dimmed by the reduced-flash option), back to the theme as it fades
    U.flash = Math.max(0, U.flash - dt * 3.5);
    const th = R.theme, fl = (dying ? 0 : U.flash) * R.flashK;
    if (th) {
      R.hemi.intensity = th.hemi[2] * (1 + fl * 1.4);
      R.sky.u.uTop.value.set(th.skyTop).lerp(_white, Math.min(0.7, fl * 0.55));
    }
  },
};
const _white = new THREE.Color(0xdde8ff);
