// Builds a stage's visuals from the sim's platform list (render-only: owns no game state).
//   * static platforms → their pieces are merged into one mesh per material (a few draw calls)
//   * hover cars       → one InstancedMesh per car kind and material, matrices updated per frame
//   * other movers     → a group per platform (billboards, ad decks, bonus pads), moved per frame
// Every piece is built in the platform's local frame: origin at its centre, y = 0 at its top.
import * as THREE from 'three';
import { Kit, box, cyl, part, meterBox, atlasQuad, footprintShape, slab, bandColors, prep, placeGeo } from './geo.js';
import { carGeometry } from './models.js';
import { CARS } from '../levels/kit.js';
import { FACADE_M, SIGN_COLS } from './textures.js';
import { adUV } from './ads.js';
import { CAR_PAINT, CONTAINER_PAINT, TOWER_TINT, NEON } from './themes.js';
import { mulberry32 } from '../sim/util.js';
import { seg } from './retro.js';

const _o = new THREE.Object3D(), _c = new THREE.Color();

export function buildLevelView(w, th, M, root) {
  const rng = mulberry32((w.level.seed || 1) * 7919);
  const world = new Kit();
  const movers = [];
  const cars = {};
  for (const p of w.plats) {
    if (p.style.startsWith('car:')) { (cars[p.style.slice(4)] ||= []).push(p); continue; }
    const K = pieces(p, th, rng);
    if (p.move || p.bob) {
      const g = new THREE.Group();
      for (const [key, geo] of Object.entries(K.build())) if (geo) g.add(meshFor(geo, key, M));
      g.rotation.y = p.yaw;
      root.add(g);
      movers.push({ p, g });
    } else {
      for (const key in K.parts) for (const geo of K.parts[key]) world.add(key, placeGeo(geo, p.x, p.h, p.z, p.yaw));
    }
  }
  const statics = [];
  for (const [key, geo] of Object.entries(world.build())) if (geo) { const m = meshFor(geo, key, M); m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); statics.push(m); }

  // hover cars: instanced per kind
  const fleets = [];
  for (const kind in cars) {
    const list = cars[kind], geo = carGeometry(kind), n = list.length;
    const meshes = [];
    for (const [key, g] of Object.entries(geo)) {
      if (!g) continue;
      const mat = key === 'paint' ? M.paintFlat : key === 'glow' ? M.glow : M.glass;
      const im = new THREE.InstancedMesh(g, mat, n);
      if (key === 'paint') { for (let i = 0; i < n; i++) im.setColorAt(i, _c.set(CAR_PAINT[(list[i].tint >= 0 ? list[i].tint : i) % CAR_PAINT.length])); }
      im.frustumCulled = false;
      root.add(im); meshes.push(im);
    }
    fleets.push({ list, meshes });
  }

  function update(t) {
    for (const m of movers) { const p = m.p; m.g.position.set(p.x + p.ox, p.h + p.oy, p.z + p.oz); }
    for (const f of fleets) {
      f.list.forEach((p, i) => {
        // bank a little into lateral motion (visual only)
        const lat = (p.dx * p.c - p.dz * p.s) * 120;
        _o.position.set(p.x + p.ox, p.h + p.oy, p.z + p.oz);
        _o.rotation.set(0, p.yaw, Math.max(-0.12, Math.min(0.12, -lat * 0.02)));
        _o.updateMatrix();
        for (const im of f.meshes) im.setMatrixAt(i, _o.matrix);
      });
      for (const im of f.meshes) im.instanceMatrix.needsUpdate = true;
    }
  }
  update(0);
  return { update, statics, movers, fleets };
}

function meshFor(geo, key, M) {
  const mat = { facade: M.facade, paint: M.paint, flat: M.paintFlat, glow: M.glow, neon: M.neon, glass: M.glass, concrete: M.concrete, container: M.container, deck: M.deck, ads: M.ads, signs: M.signs, helipad: M.helipad, hazard: M.hazard }[key] || M.paint;
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = key !== 'facade';
  return m;
}

// ------------------------------------------------------------------ per-style pieces
function pieces(p, th, rng) {
  const K = new Kit(), s = p.style;
  if (s === 'tower' || s === 'arcology' || s === 'crown' || s === 'spire') tower(K, p, th, rng);
  else if (s === 'helipad') helipad(K, p);
  else if (s === 'pier') pier(K, p);
  else if (s === 'container') container(K, p);
  else if (s.startsWith('crane')) crane(K, p);
  else if (s === 'hull' || s === 'bridge' || s === 'control') ship(K, p);
  else if (s === 'billboard') billboard(K, p);
  else if (s === 'adpad') adpad(K, p);
  else if (s === 'sign') neonSign(K, p);
  else if (s === 'pagoda') pagoda(K, p);
  else if (s === 'floor') floor(K, p);
  else if (s === 'wall') wall(K, p, rng);
  else if (s === 'ceiling') ceiling(K, p);
  else if (s === 'catwalk') catwalk(K, p);
  else if (s === 'rack') rack(K, p, rng);
  else if (s === 'crate') crate(K, p);
  else deck(K, p, th);
  return K;
}

// A face of a w × d footprint: centre point on the face, outward normal, tangent, face width.
function faces(w, d) {
  return [
    { nx: 0, nz: -1, tx: 1, tz: 0, half: d / 2, width: w, ry: Math.PI },
    { nx: 0, nz: 1, tx: -1, tz: 0, half: d / 2, width: w, ry: 0 },
    { nx: 1, nz: 0, tx: 0, tz: -1, half: w / 2, width: d, ry: Math.PI / 2 },
    { nx: -1, nz: 0, tx: 0, tz: 1, half: w / 2, width: d, ry: -Math.PI / 2 },
  ];
}

function tower(K, p, th, rng) {
  const { w, d, thick: H } = p, tint = TOWER_TINT[(p.tint >= 0 ? p.tint : 0) % TOWER_TINT.length];
  const neon = NEON[Math.floor(rng() * NEON.length)];
  const fac = meterBox(w, H, d, FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: Math.floor(rng() * 8) * 2, v0: Math.floor(rng() * 4) * 4, color: tint });
  fac.translate(0, -H / 2, 0);
  K.add('facade', fac);
  K.add('paint', box(w, 0.3, d, { y: -0.15, color: 0x4a4c56 }));
  for (const f of faces(w, d)) { // parapet + neon trim
    K.add('paint', box(f.tx ? f.width : 0.3, 0.3, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: 0.15, z: f.nz * (f.half - 0.15), color: 0x5a5c66 }));
    K.add('neon', box(f.tx ? f.width + 0.2 : 0.14, 0.16, f.tz ? f.width + 0.2 : 0.14, { x: f.nx * (f.half + 0.06), y: -0.55, z: f.nz * (f.half + 0.06), color: neon }));
  }
  // corner antennas with red tips (off the walkable middle)
  for (const [sx, sz] of [[-1, -1], [1, 1]]) {
    if (rng() < 0.5) continue;
    const hgt = 2 + rng() * 4;
    K.add('paint', cyl(0.06, 0.08, hgt, 4, { x: sx * (w / 2 - 0.5), y: hgt / 2, z: sz * (d / 2 - 0.5), color: 0x3a3c46 }));
    K.add('glow', box(0.2, 0.2, 0.2, { x: sx * (w / 2 - 0.5), y: hgt + 0.1, z: sz * (d / 2 - 0.5), color: 0xff2a2a }));
  }
  // signs: blades sticking out of the facade (Blade Runner) or flat panels
  const nSigns = s => s === 'spire' ? 0 : 1 + Math.floor(rng() * 2.4);
  for (let k = nSigns(p.style); k > 0; k--) {
    const f = faces(w, d)[Math.floor(rng() * 4)];
    if (f.width < 6) continue;
    const off = (rng() - 0.5) * (f.width - 4), y = -5 - rng() * 22, cell = Math.floor(rng() * SIGN_COLS);
    const r = [cell / SIGN_COLS, 0, (cell + 1) / SIGN_COLS, 1];
    const cx = f.nx * f.half + f.tx * off, cz = f.nz * f.half + f.tz * off;
    if (rng() < 0.6) { // blade: perpendicular to the wall, readable from along the street
      const out = 1.5;
      const bx = cx + f.nx * out, bz = cz + f.nz * out;
      K.add('paint', box(f.tx ? 0.3 : 2.8, 9.2, f.tz ? 0.3 : 2.8, { x: bx, y, z: bz, color: 0x15151c }));
      K.add('signs', atlasQuad(2.4, 8.8, r, { x: bx + f.tx * 0.25, y, z: bz + f.tz * 0.25, ry: Math.atan2(f.tx, f.tz) }));
      K.add('signs', atlasQuad(2.4, 8.8, r, { x: bx - f.tx * 0.25, y, z: bz - f.tz * 0.25, ry: Math.atan2(-f.tx, -f.tz) }));
    } else { // flat on the facade
      K.add('signs', atlasQuad(2.6, 9.6, r, { x: cx + f.nx * 0.2, y, z: cz + f.nz * 0.2, ry: f.ry }));
    }
  }
  // a big poster ad on some towers (the city is mostly ads)
  if (rng() < 0.45) {
    const f = faces(w, d)[Math.floor(rng() * 4)];
    if (f.width >= 10) {
      const aw = Math.min(16, f.width - 2), ah = aw / 2, y = -3 - ah / 2 - rng() * 18, ad = Math.floor(rng() * 64);
      K.add('paint', box(f.tx ? aw + 0.6 : 0.3, ah + 0.6, f.tz ? aw + 0.6 : 0.3, { x: f.nx * (f.half + 0.15), y, z: f.nz * (f.half + 0.15), color: 0x1a1a22 }));
      K.add('ads', atlasQuad(aw, ah, adUV(ad), { x: f.nx * (f.half + 0.45), y, z: f.nz * (f.half + 0.45), ry: f.ry }));
    }
  }
  if (p.style === 'arcology' || p.style === 'crown') { // glowing bands up the megastructures
    for (let y = -2; y > -90; y -= p.style === 'crown' ? 6 : 10) for (const f of faces(w, d)) {
      K.add('neon', box(f.tx ? f.width + 0.3 : 0.2, 0.3, f.tz ? f.width + 0.3 : 0.2, { x: f.nx * (f.half + 0.1), y, z: f.nz * (f.half + 0.1), color: p.style === 'crown' ? 0xff2bd6 : 0x2be8ff }));
    }
  }
  if (p.style === 'spire') for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('neon', box(0.18, 60, 0.18, { x: sx * (w / 2 + 0.05), y: -30, z: sz * (d / 2 + 0.05), color: 0x7bff4a }));
}

function helipad(K, p) {
  K.add('helipad', part(new THREE.CircleGeometry(p.r, seg(24, 14)), { rx: -Math.PI / 2, y: 0.03 }));
  K.add('paint', cyl(p.r + 0.1, p.r + 0.1, p.thick, seg(24, 14), { y: -p.thick / 2 - 0.004, color: 0x2a2e38 }));
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; K.add('glow', box(0.18, 0.1, 0.18, { x: Math.cos(a) * (p.r - 0.3), y: 0.05, z: Math.sin(a) * (p.r - 0.3), color: k % 2 ? 0x2be8ff : 0xffd23a })); }
}

function pier(K, p) {
  const g = meterBox(p.w, p.thick, p.d, 8, { faces: ['px', 'nx', 'py', 'pz', 'nz'] });
  g.translate(0, -p.thick / 2, 0);
  K.add('concrete', g);
  for (const f of faces(p.w, p.d)) {
    const n = Math.max(1, Math.floor(f.width / 2));
    for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * (f.width / n);
      K.add('paint', box(f.tx ? f.width / n : 0.4, 0.06, f.tz ? f.width / n : 0.4, { x: f.nx * (f.half - 0.2) + f.tx * off, y: 0.02, z: f.nz * (f.half - 0.2) + f.tz * off, color: k % 2 ? 0x1a1a1a : 0xffcc1a }));
    }
    for (let k = 0; k <= Math.floor(f.width / 8); k++) { // pilings
      const off = -f.width / 2 + k * 8;
      K.add('paint', cyl(0.4, 0.4, p.thick + 2, 6, { x: f.nx * (f.half + 0.3) + f.tx * off, y: -p.thick / 2 - 1, z: f.nz * (f.half + 0.3) + f.tz * off, color: 0x4a4038 }));
    }
  }
}

function container(K, p) {
  const g = meterBox(p.w, p.thick, p.d, 2.6, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: CONTAINER_PAINT[(p.tint >= 0 ? p.tint : 0) % CONTAINER_PAINT.length] });
  g.translate(0, -p.thick / 2, 0);
  K.add('container', g);
  K.add('paint', box(p.w + 0.04, 0.12, 0.12, { y: -0.06, z: -p.d / 2 + 0.06, color: 0x3a3a3a }), box(p.w + 0.04, 0.12, 0.12, { y: -0.06, z: p.d / 2 - 0.06, color: 0x3a3a3a }));
}

function crane(K, p) {
  const yel = 0xf2a81a, dark = 0x2a2a30;
  if (p.style === 'crane-leg') {
    K.add('paint', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: yel }));
    for (let y = -2; y > -p.thick; y -= 3) K.add('paint', box(p.w + 0.06, 0.25, p.d + 0.06, { y, color: dark }));
    return;
  }
  if (p.style === 'crane-cab') {
    K.add('paint', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: yel }));
    K.add('paint', box(4, 3, 4, { x: -3, y: -p.thick - 1.5, color: 0xe8e4dc }));
    K.add('glass', box(4.05, 0.9, 4.05, { x: -3, y: -p.thick - 1.1 }));
    return;
  }
  // the boom: a girder you walk along, rails at the edges, a lattice under it, a lamp at the tip
  K.add('paint', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: yel }));
  for (let x = -p.w / 2 + 2; x < p.w / 2; x += 4) {
    K.add('paint', box(0.2, p.thick * 1.6, 0.2, { x, y: -p.thick * 1.3, z: 0, rz: 0.6, color: dark }));
    K.add('hazard', box(1.8, 0.05, 0.25, { x, y: 0.01, z: p.d / 2 - 0.2 }));
  }
  for (const sz of [-1, 1]) K.add('paint', box(p.w, 0.08, 0.08, { y: 0.9, z: sz * (p.d / 2 - 0.05), color: 0xff8a1a }));
  for (let x = -p.w / 2; x <= p.w / 2; x += 3) for (const sz of [-1, 1]) K.add('paint', box(0.08, 0.9, 0.08, { x, y: 0.45, z: sz * (p.d / 2 - 0.05), color: 0xff8a1a }));
  K.add('glow', box(0.5, 0.5, 0.5, { x: p.w / 2 - 0.3, y: 1.2, color: 0xff2a2a }));
}

function ship(K, p) {
  if (p.style === 'hull') {
    K.add('paint', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x8a2a22 }));
    K.add('paint', box(p.w + 0.05, 2, p.d + 0.05, { y: -1, color: 0x1a1a22 }));
    K.add('paint', box(p.w - 0.3, 0.06, p.d - 0.3, { y: 0.0, color: 0x5a6a5a }));
    for (let z = -p.d / 2 + 4; z < p.d / 2; z += 6) K.add('glow', box(0.25, 0.25, 0.25, { x: -p.w / 2 - 0.1, y: -1.2, z, color: 0xfff0b0 }), box(0.25, 0.25, 0.25, { x: p.w / 2 + 0.1, y: -1.2, z, color: 0xfff0b0 }));
  } else if (p.style === 'bridge') {
    K.add('paint', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xf0f0ec }));
    K.add('glass', box(p.w + 0.06, 1.3, p.d + 0.06, { y: -1.6 }));
    K.add('paint', cyl(0.15, 0.2, 7, 6, { x: 0, y: 3.5, z: p.d / 2 - 0.8, color: 0x3a3c46 }), box(3, 0.2, 0.3, { y: 6, z: p.d / 2 - 0.8, color: 0x3a3c46 }));
    K.add('glow', box(0.3, 0.3, 0.3, { y: 7.1, z: p.d / 2 - 0.8, color: 0xff2a2a }));
  } else { // harbour control tower
    K.add('concrete', (() => { const g = meterBox(p.w, p.thick, p.d, 8, { faces: ['px', 'nx', 'pz', 'nz'], color: 0xe8e4dc }); g.translate(0, -p.thick / 2, 0); return g; })());
    K.add('paint', box(p.w, 0.3, p.d, { y: -0.15, color: 0x3a3c46 }));
    K.add('glass', box(p.w + 0.1, 2.2, p.d + 0.1, { y: -2.4 }));
    K.add('paint', box(p.w + 0.6, 0.4, p.d + 0.6, { y: -3.7, color: 0xd8302a }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', box(0.4, 0.4, 0.4, { x: sx * (p.w / 2 - 0.3), y: 0.3, z: sz * (p.d / 2 - 0.3), color: 0xff2a2a }));
  }
}

function billboard(K, p) {
  const { w, d, thick: H } = p, ad = p.tint >= 0 ? p.tint : 0;
  K.add('paint', box(w + 0.4, H, d * 0.45, { y: -H / 2, color: 0x1d1f28 }));
  K.add('paint', box(w + 0.4, 0.16, d, { y: -0.08, color: 0x8a92a0 }));
  K.add('hazard', box(w + 0.4, 0.04, 0.3, { y: 0.01, z: -d / 2 + 0.15 }), box(w + 0.4, 0.04, 0.3, { y: 0.01, z: d / 2 - 0.15 }));
  K.add('ads', atlasQuad(w - 0.2, H - 0.6, adUV(ad), { y: -H / 2 - 0.1, z: -d * 0.225 - 0.12, ry: Math.PI }));
  K.add('ads', atlasQuad(w - 0.2, H - 0.6, adUV(ad + 5), { y: -H / 2 - 0.1, z: d * 0.225 + 0.12 }));
  K.add('neon', box(w + 0.5, 0.14, 0.14, { y: -H - 0.05, z: -d * 0.23, color: 0x2be8ff }), box(w + 0.5, 0.14, 0.14, { y: -H - 0.05, z: d * 0.23, color: 0xff2bd6 }));
  for (const sx of [-1, 1]) {
    K.add('paint', cyl(0.5, 0.7, 0.8, 8, { x: sx * w * 0.32, y: -H - 0.4, color: 0x2a2c34 }));
    K.add('glow', cyl(0.45, 0.45, 0.05, 8, { x: sx * w * 0.32, y: -H - 0.83, color: 0x5ff0ff }));
  }
}

function adpad(K, p) {
  const ad = p.tint >= 0 ? p.tint : 0;
  K.add('paint', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x1d1f28 }));
  K.add('ads', atlasQuad(p.w - 0.3, p.d - 0.3, adUV(ad), { y: 0.04, rx: -Math.PI / 2, rz: Math.PI / 2 }));
  K.add('neon', box(p.w + 0.1, 0.12, 0.12, { y: -0.3, z: -p.d / 2, color: 0xffe52b }), box(p.w + 0.1, 0.12, 0.12, { y: -0.3, z: p.d / 2, color: 0xffe52b }));
  for (const sx of [-1, 1]) K.add('glow', cyl(0.4, 0.4, 0.05, 8, { x: sx * p.w * 0.3, y: -p.thick - 0.02, color: 0x5ff0ff }));
}

function neonSign(K, p) {
  const { w, d, thick: H } = p;
  K.add('paint', box(w, H, d, { y: -H / 2, color: 0x15151c }));
  K.add('paint', box(w, 0.16, d, { y: -0.08, color: 0x8a92a0 }));
  const n = 4;
  for (let k = 0; k < n; k++) {
    const cell = (k * 5 + 3) % SIGN_COLS, r = [cell / SIGN_COLS, 0, (cell + 1) / SIGN_COLS, 1];
    const z = -d / 2 + (k + 0.5) * (d / n);
    K.add('signs', atlasQuad(d / n - 0.3, H - 1, r, { x: w / 2 + 0.1, y: -H / 2, z, ry: Math.PI / 2 }));
    K.add('signs', atlasQuad(d / n - 0.3, H - 1, r, { x: -w / 2 - 0.1, y: -H / 2, z: -z, ry: -Math.PI / 2 }));
  }
  K.add('neon', box(w + 0.2, 0.2, d + 0.2, { y: -H, color: 0xff2bd6 }));
}

function pagoda(K, p) {
  const { w, d, thick: H } = p;
  K.add('paint', box(w - 2.6, H - 0.6, d - 2.6, { y: -H / 2 - 0.3, color: 0xc8302a }));
  K.add('paint', box(w, 0.6, d, { y: -0.3, color: 0x2a2a34 }));
  K.add('paint', box(w + 0.1, 0.12, d + 0.1, { y: -0.62, color: 0xd8a23a }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    K.add('paint', box(0.35, 0.9, 0.35, { x: sx * (w / 2 - 0.2), y: 0.2, z: sz * (d / 2 - 0.2), rx: -sz * 0.4, rz: sx * 0.4, color: 0xd8a23a }));
    K.add('glow', box(0.45, 0.7, 0.45, { x: sx * (w / 2 - 0.6), y: -1.4, z: sz * (d / 2 - 0.6), color: 0xff6a2a }));
  }
}

// dr-mow's floating block: a bevelled lip slab over a banded body, plus an underglow.
function deck(K, p, th) {
  const lipCol = p.style === 'core' ? 0xd8e4f0 : 0x9aa8b8;
  const lip = prep(slab(footprintShape(p, 0, 0.1), 0.18, 0.1, (x, z, yRel) => yRel), lipCol);
  K.add('deck', lip);
  const thick = Math.max(0.8, p.thick);
  const body = prep(slab(footprintShape(p, -0.25, 0.18), thick - 0.6, 0.18, (x, z, yRel) => yRel - 0.38));
  bandColors(body, -0.38, [[0.25, 0xff8a1a], [0.5, 0x4a5262], [99, 0x23252e]]);
  K.add('flat', body);
  const glowCol = p.style === 'core' ? 0x2bff7a : 0x2be8ff;
  if (p.kind === 'disc') {
    K.add('neon', part(new THREE.TorusGeometry(p.r - 0.35, 0.09, 3, seg(24, 14)), { rx: Math.PI / 2, y: -thick + 0.1, color: glowCol }));
    if (p.style === 'core') K.add('neon', part(new THREE.RingGeometry(p.r * 0.55, p.r * 0.62, seg(24, 14)), { rx: -Math.PI / 2, y: 0.02, color: glowCol }));
  } else {
    for (const f of faces(p.w, p.d)) K.add('neon', box(f.tx ? f.width - 0.4 : 0.1, 0.1, f.tz ? f.width - 0.4 : 0.1, { x: f.nx * (f.half - 0.3), y: -thick + 0.1, z: f.nz * (f.half - 0.3), color: glowCol }));
  }
}

// ------------------------------------------------------------------ the warehouse (stage 4)
function floor(K, p) {
  const g = meterBox(p.w, p.thick, p.d, 6, { faces: ['py'], color: 0xb8b4ac });
  g.translate(0, -p.thick / 2, 0);
  K.add('concrete', g);
  // the boss pen: a hazard circle and spokes painted on the concrete
  K.add('paint', part(new THREE.RingGeometry(9.4, 10, seg(48, 24)), { rx: -Math.PI / 2, y: 0.02, color: 0xffcc1a }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.add('paint', box(0.35, 0.02, 3, { x: Math.cos(a) * 11.6, y: 0.02, z: Math.sin(a) * 11.6, ry: -a + Math.PI / 2, color: k % 2 ? 0x1a1a1a : 0xffcc1a })); }
  for (let z = -22; z <= 22; z += 11) K.add('paint', box(0.25, 0.02, 6, { x: 19, y: 0.02, z, color: 0xe8e4dc }), box(0.25, 0.02, 6, { x: -19, y: 0.02, z, color: 0xe8e4dc }));
  for (let z = -4; z <= 4; z += 1) K.add('paint', box(1.5, 0.02, 0.5, { x: 25, y: 0.02, z, color: z % 2 ? 0x1a1a1a : 0xffcc1a })); // loading-bay stripes at the exit
}

function wall(K, p, rng) {
  const long = p.w > p.d;
  const nx = long ? 0 : -Math.sign(p.x), nz = long ? -Math.sign(p.z) : 0; // inward normal
  const half = long ? p.d / 2 : p.w / 2, span = long ? p.w : p.d;
  const tint = [0x7a8296, 0x8a7f7a, 0x707a88, 0x7c8478][(p.tint >= 0 ? p.tint : 0) % 4];
  const g = meterBox(p.w, p.thick, p.d, 2.6, { faces: ['px', 'nx', 'pz', 'nz'], color: tint });
  g.translate(0, -p.thick / 2, 0);
  K.add('container', g);
  const ry = Math.atan2(nx, nz), tx = long ? 1 : 0, tz = long ? 0 : 1;
  // high window band, glowing blue
  K.add('glow', atlasQuadSolid(span - 6, 2.2, { x: nx * (half + 0.05), y: -4.5, z: nz * (half + 0.05), ry, color: 0x2a4a8a }));
  // pipes along the wall
  for (const y of [-7.5, -20.5]) K.add('paint', part(new THREE.CylinderGeometry(0.25, 0.25, span - 2, 6), { x: nx * (half + 0.4), y, z: nz * (half + 0.4), rz: long ? Math.PI / 2 : 0, rx: long ? 0 : Math.PI / 2, color: 0x4a4038 }));
  // adverts (the corp advertises to its own warehouse)
  const n = long ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * (span / n), ad = Math.floor(rng() * 64), aw = 9, ah = 4.5, y = -12;
    K.add('paint', box(tx ? aw + 0.5 : 0.25, ah + 0.5, tz ? aw + 0.5 : 0.25, { x: nx * (half + 0.12) + tx * off, y, z: nz * (half + 0.12) + tz * off, color: 0x15151c }));
    K.add('ads', atlasQuad(aw, ah, adUV(ad), { x: nx * (half + 0.4) + tx * off, y, z: nz * (half + 0.4) + tz * off, ry }));
  }
  if (long) { // neon blade signs either side
    for (const off of [-span * 0.42, span * 0.42]) {
      const cell = Math.floor(rng() * SIGN_COLS), r = [cell / SIGN_COLS, 0, (cell + 1) / SIGN_COLS, 1];
      const bx = off, bz = nz * (half + 1.5);
      K.add('paint', box(0.3, 9.2, 2.8, { x: bx, y: -9, z: bz, color: 0x15151c }));
      K.add('signs', atlasQuad(2.4, 8.8, r, { x: bx + 0.25, y: -9, z: bz, ry: Math.PI / 2 }), atlasQuad(2.4, 8.8, r, { x: bx - 0.25, y: -9, z: bz, ry: -Math.PI / 2 }));
    }
  }
}

function ceiling(K, p) {
  const B = -p.thick; // underside, relative to the top
  K.add('paint', box(p.w, 0.2, p.d, { y: B + 0.1, color: 0x1c1e26 }));
  for (let x = -p.w / 2 + 3; x < p.w / 2; x += 6) K.add('paint', box(0.5, 0.8, p.d, { x, y: B - 0.4, color: 0x3a3c46 })); // girders
  for (let z = -p.d / 2 + 6; z < p.d / 2; z += 12) K.add('paint', box(p.w, 0.5, 0.3, { y: B - 0.25, z, color: 0x34363f }));
  for (const x of [-18, 0, 18]) K.add('glow', atlasQuadSolid(7, 30, { x, y: B - 0.02, rx: Math.PI / 2, color: 0x2a3e70 })); // skylights (night sky)
  for (let x = -24; x <= 24; x += 12) for (let z = -18; z <= 18; z += 12) { // hanging sodium lamps
    K.add('paint', box(0.05, 2.4, 0.05, { x, y: B - 1.2, z, color: 0x222222 }));
    K.add('glow', box(1.2, 0.25, 0.5, { x, y: B - 2.5, z, color: 0xffcf7a }));
  }
}

function catwalk(K, p) {
  const nx = -Math.sign(p.x); // the arena side
  const g = meterBox(p.w, p.thick, p.d, 1.5, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: 0x9aa4b4 });
  g.translate(0, -p.thick / 2, 0);
  K.add('deck', g);
  const ex = nx * (p.w / 2 - 0.08);
  K.add('paint', box(0.08, 0.08, p.d, { x: ex, y: 1.0, color: 0xffcc1a }), box(0.06, 0.06, p.d, { x: ex, y: 0.5, color: 0xffcc1a }));
  for (let z = -p.d / 2; z <= p.d / 2; z += 2.5) {
    K.add('paint', box(0.08, 1.0, 0.08, { x: ex, y: 0.5, z, color: 0xffcc1a }));
    K.add('paint', box(0.14, 2.6, 0.14, { x: -nx * (p.w / 2 - 0.6), y: -1.4, z, rz: nx * 0.6, color: 0x3a3c46 })); // wall bracket
  }
}

function rack(K, p, rng) {
  const H = p.thick, cols = [0xd8a23a, 0x8a5a2a, 0x2a6ab8, 0x3a8a4a, 0xc8402e, 0xd8d4cc];
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) K.add('paint', box(0.22, H, 0.22, { x: sx * (p.w / 2 - 0.15), y: -H / 2, z: sz * (p.d / 2 - 0.15), color: 0xff8a1a }));
  for (let y = 0; y > -H; y -= 3.4) {
    K.add('paint', box(p.w, 0.16, p.d, { y: y - 0.08, color: 0x2a5ad8 }));
    if (y === 0) continue; // the top shelf is a perch: keep it clear
    for (let x = -p.w / 2 + 0.9; x < p.w / 2 - 0.6;) { // cargo on the shelf below
      const bw = 1 + rng() * 1.4, bh = 1 + rng() * 1.6;
      if (x + bw > p.w / 2 - 0.3) break;
      K.add('paint', box(bw - 0.1, bh, p.d - 0.5, { x: x + bw / 2, y: y - 3.4 + 0.08 + bh / 2, color: cols[Math.floor(rng() * cols.length)] }));
      x += bw + 0.15;
    }
  }
}

function crate(K, p) {
  const g = meterBox(p.w, p.thick, p.d, p.w, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: CONTAINER_PAINT[(p.tint >= 0 ? p.tint : 0) % CONTAINER_PAINT.length] });
  g.translate(0, -p.thick / 2, 0);
  K.add('container', g);
  K.add('paint', box(p.w + 0.04, 0.1, p.d + 0.04, { y: -0.05, color: 0x2a2a2a }), box(p.w + 0.04, 0.1, p.d + 0.04, { y: -p.thick + 0.05, color: 0x2a2a2a }));
}

// A plain (untextured) quad, for glowing panels.
function atlasQuadSolid(w, h, o) { return part(new THREE.PlaneGeometry(w, h), o); }
