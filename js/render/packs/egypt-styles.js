// EGYPT: platform styles for the city (CAIRO) and the plateau (DATA PYRAMID). Each builds a platform's
// look into Kit K in its local frame (y = 0 is the top you stand on, the footprint is p.w × p.d or
// radius p.r, solid down to -p.thick). Flat-shaded vertex colours, gold and lapis, a few cyan/magenta
// neon accents; dressing on walkable tops stays small and near the edges.
import * as THREE from 'three';

// ------------------------------------------------------------------ palette
export const COL = {
  sand: 0xd8b07a, sandDk: 0xb88c58, sandLt: 0xead0a0, lime: 0xe6d6b4, limeDk: 0xc0aa84, limeSh: 0xd2be96,
  stone: 0xc8a676, stoneDk: 0x9a7c54, alabaster: 0xe8e4da, alabSh: 0xc8c4ba, lead: 0x8a949c, leadDk: 0x5e666e,
  gold: 0xffc53a, goldDk: 0xc8901a, bronze: 0xb07a3a, lapis: 0x1e46b4, lapisDk: 0x14286a, turq: 0x2ad0c0,
  wood: 0x6a4428, woodDk: 0x3e2614, wood2: 0x8a5a34, black: 0x1a1a22, dark: 0x2a2228, white: 0xf2eee4,
  green: 0x5a8a3a, greenDk: 0x3e6a2a, palm: 0x4a7a2a, trunk: 0x7a5a3a, red: 0xc8302a, rust: 0xa8502a,
  cyan: 0x2be8ff, magenta: 0xff2bd6, amber: 0xffb43a, glass: 0x9ad8e8, winDk: 0x3a2a24, warm: 0xffc870,
  granite: 0xa8706a, graniteDk: 0x6e4444, concrete: 0xc8bca8, steel: 0x8a929c, steelDk: 0x4a5058, panel: 0x1a2a5a,
};
const PLASTER = [0xe8d4b4, 0xd8ac84, 0xe6c49a, 0xc89c7c, 0xf0e2c8, 0xd4a48c, 0xbcb898, 0xe0b888];
const CLOTH = [0xd8302a, 0x2a5ad8, 0xf0c830, 0x2aa88a, 0xf2eee4, 0xd84a9a, 0xff8a2a, 0x8a3ad8];
const NEONS = [COL.cyan, COL.magenta, 0xffd23a, 0x7bff4a];

// ------------------------------------------------------------------ helpers
const F = (K, ...g) => K.add('flat', ...g);
const G = (K, ...g) => K.add('glow', ...g);
const N = (K, ...g) => K.add('neon', ...g);
const _c = new THREE.Color(), _c2 = new THREE.Color();
export const mix = (a, b, k) => _c.set(a).lerp(_c2.set(b), k).getHex();
export const shade = (a, k) => _c.set(a).multiplyScalar(k).getHex();
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
// Euler angles turning +Y onto the direction (dx, dy, dz) (cones, struts, poles).
export function orient(dx, dy, dz) {
  _v.set(dx, dy, dz).normalize(); _q.setFromUnitVectors(_up, _v); _e.setFromQuaternion(_q);
  return { rx: _e.x, ry: _e.y, rz: _e.z };
}
// A strut (thin box) from a to b ([x, y, z]), t thick.
export function strut(H, a, b, t, color) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01;
  return H.box(t, l, t, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ...orient(dx, dy, dz), color });
}

// The block body: a box (rect) or a cylinder (disc) from the top down to -thick.
export function body(K, p, H, col, o = {}) {
  const t = o.thick ?? p.thick, y = (o.y0 ?? 0) - t / 2, g = o.grow || 0;
  if (p.kind === 'disc') F(K, H.cyl(p.r + g, p.r + g + (o.flare || 0), t, o.seg || H.seg(24, 14), { y, color: col }));
  else F(K, H.box(p.w + g * 2, t, p.d + g * 2, { y, color: col }));
}
// A thin top surface (a different colour from the sides) and an optional rim band just under it.
export function cap(K, p, H, col, rim = null, rimH = 0.25, seg = null) {
  if (p.kind === 'disc') F(K, H.cyl(p.r + 0.02, p.r + 0.02, 0.06, seg || H.seg(24, 14), { y: -0.03, color: col }));
  else F(K, H.box(p.w + 0.04, 0.06, p.d + 0.04, { y: -0.03, color: col }));
  if (rim !== null) {
    if (p.kind === 'disc') F(K, H.cyl(p.r + 0.12, p.r + 0.12, rimH, seg || H.seg(24, 14), { y: -0.06 - rimH / 2, color: rim }));
    else F(K, H.box(p.w + 0.24, rimH, p.d + 0.24, { y: -0.06 - rimH / 2, color: rim }));
  }
}
// Horizontal bands round a block every `step` m from y0 down to y1.
export function bands(K, p, H, y0, y1, step, col, h = 0.18, grow = 0.03, key = 'flat') {
  for (let y = y0; y > y1; y -= step) {
    if (p.kind === 'disc') K.add(key, H.cyl(p.r + grow, p.r + grow, h, H.seg(24, 14), { y, color: col }));
    else K.add(key, H.box(p.w + grow * 2, h, p.d + grow * 2, { y, color: col }));
  }
}
// A flat panel on face f (from H.faces): centred `off` along the face at height y, w × h, standing `out` off it.
export function panel(K, H, f, off, y, w, h, col, key = 'flat', out = 0.03) {
  K.add(key, H.part(new THREE.PlaneGeometry(w, h), { x: f.nx * (f.half + out) + f.tx * off, y, z: f.nz * (f.half + out) + f.tz * off, ry: f.ry, color: col }));
}
// A pointed arch (window, door, niche) on face f: a rectangle with a pointed head; yBot its sill.
export function archOn(K, H, f, off, yBot, w, h, col, key = 'flat', out = 0.03) {
  const hr = Math.max(0.05, h - w * 0.55);
  panel(K, H, f, off, yBot + hr / 2, w, hr, col, key, out);
  K.add(key, H.part(new THREE.CircleGeometry(w / 2, 4, 0, Math.PI), { x: f.nx * (f.half + out) + f.tx * off, y: yBot + hr, z: f.nz * (f.half + out) + f.tz * off, ry: f.ry, sy: 1.1, color: col }));
}
// Arches round a disc at radius rr (n of them), each w wide, h tall from yBot.
function ringArches(K, H, rr, n, yBot, h, w, col, key = 'flat') {
  for (let k = 0; k < n; k++) {
    const a = ((k + 0.5) / n) * Math.PI * 2, f = { nx: Math.cos(a), nz: Math.sin(a), tx: -Math.sin(a), tz: Math.cos(a), half: rr, ry: Math.PI / 2 - a };
    archOn(K, H, f, 0, yBot, w, h, col, key, 0.02);
  }
}
// Crenellations (merlons) along the edges of a rect top.
function merlons(K, p, H, col, edges = [0, 1, 2, 3], size = 0.7, gap = 1.6, h = 0.8) {
  const fs = H.faces(p.w, p.d);
  for (const i of edges) {
    const f = fs[i], n = Math.floor(f.width / gap);
    for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * (f.width / n);
      F(K, H.box(f.tx ? size : 0.4, h, f.tz ? size : 0.4, { x: f.nx * (f.half - 0.2) + f.tx * off, y: h / 2, z: f.nz * (f.half - 0.2) + f.tz * off, color: col }));
    }
  }
}
// Little hover jets under a floating thing (unlit discs).
function jets(K, H, pts, y, r = 0.32, col = COL.cyan) { for (const [x, z] of pts) G(K, H.cyl(r, r * 0.8, 0.08, 8, { x, y, z, color: col })); }
// A date palm at (x, y, z): a ringed trunk and a crown of drooping fronds.
export function palm(K, H, x, y, z, h, rng) {
  const lean = (rng() - 0.5) * 0.25;
  F(K, H.cyl(0.18, 0.28, h, 5, { x: x + lean * h * 0.5, y: y + h / 2, z, rz: -lean, color: COL.trunk }));
  const tx = x + lean * h, ty = y + h;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + rng();
    F(K, H.box(0.5, 0.06, 2.6, { x: tx + Math.cos(a) * 1.1, y: ty - 0.3, z: z + Math.sin(a) * 1.1, ry: -a + Math.PI / 2, rx: 0.5, color: k % 2 ? COL.palm : COL.greenDk }));
  }
  F(K, H.part(new THREE.IcosahedronGeometry(0.35, 0), { x: tx, y: ty, z, color: COL.greenDk }));
}

// ------------------------------------------------------------------ Cairo: rooftop dressing
function satDish(K, H, x, y, z, a, s = 1) {
  F(K, H.cyl(0.05, 0.05, 0.9 * s, 4, { x, y: y + 0.45 * s, z, color: COL.steel }));
  const d = [Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8]; // it looks up at the satellites, a little to one side
  F(K, H.part(new THREE.ConeGeometry(0.62 * s, 0.24 * s, 8, 1, true), { x, y: y + 1.0 * s, z, ...orient(-d[0], -d[1], -d[2]), color: 0xeceae4 }));
  F(K, strut(H, [x, y + 1.0 * s, z], [x + d[0] * 0.55 * s, y + 1.0 * s + d[1] * 0.55 * s, z + d[2] * 0.55 * s], 0.04, COL.steel));
}
function waterTank(K, H, x, y, z, rng) {
  const c = rng() < 0.5 ? 0x2a4a8a : rng() < 0.5 ? 0x1a1a22 : 0xd8d4c8;
  F(K, H.box(1.3, 0.5, 1.3, { x, y: y + 0.25, z, color: COL.steelDk }));
  F(K, H.cyl(0.6, 0.6, 1.2, 8, { x, y: y + 1.1, z, color: c }));
}
function laundry(K, H, x0, z0, x1, z1, y, rng) {
  F(K, H.box(0.08, 1.9, 0.08, { x: x0, y: y + 0.95, z: z0, color: COL.wood }), H.box(0.08, 1.9, 0.08, { x: x1, y: y + 0.95, z: z1, color: COL.wood }));
  F(K, strut(H, [x0, y + 1.85, z0], [x1, y + 1.85, z1], 0.03, 0x3a3a3a));
  const n = 3 + Math.floor(rng() * 3), ry = -Math.atan2(z1 - z0, x1 - x0);
  for (let k = 0; k < n; k++) {
    const t = (k + 0.7) / (n + 0.4), w = 0.45 + rng() * 0.35, h = 0.5 + rng() * 0.5;
    F(K, H.box(w, h, 0.03, { x: x0 + (x1 - x0) * t, y: y + 1.82 - h / 2, z: z0 + (z1 - z0) * t, ry, color: CLOTH[Math.floor(rng() * CLOTH.length)] }));
  }
}

// A Cairo house: plaster walls, windows with shutters, a parapet, and on the roof (near the edges)
// a satellite dish, a water tank, a laundry line; now and then a pigeon tower or a painted ad.
function house(K, p, th, rng, H, o = {}) {
  const col = o.col ?? PLASTER[(p.tint >= 0 ? p.tint : 0) % PLASTER.length], hw = p.w / 2, hd = p.d / 2, T = p.thick;
  F(K, H.box(p.w, T, p.d, { y: -T / 2, color: col }));
  F(K, H.box(p.w + 0.06, 0.1, p.d + 0.06, { y: -0.05, color: shade(col, 0.82) }));
  F(K, H.box(p.w + 0.12, 0.18, p.d + 0.12, { y: -T + 3.4, color: shade(col, 0.78) })); // the ground-floor cornice
  const fs = H.faces(p.w, p.d);
  for (const f of fs) F(K, H.box(f.tx ? f.width : 0.22, 0.5, f.tz ? f.width : 0.22, { x: f.nx * (f.half - 0.11), y: 0.25, z: f.nz * (f.half - 0.11), color: mix(col, 0xffffff, 0.12) }));
  const floors = Math.min(o.tall ? 6 : 3, Math.floor((T - 3.4) / 3.1));
  const night = th.night || 0;
  for (const f of fs) {
    const n = Math.max(1, Math.floor(f.width / 3.4));
    for (let fl = 0; fl < floors; fl++) {
      const y = -1.8 - fl * 3.1;
      for (let k = 0; k < n; k++) {
        if (rng() < 0.12) continue;
        const off = (k - (n - 1) / 2) * (f.width / n), lit = rng() < 0.05 + night * 0.4;
        if (rng() < 0.5) archOn(K, H, f, off, y - 0.8, 0.95, 1.7, lit ? COL.warm : COL.winDk, lit ? 'glow' : 'flat');
        else panel(K, H, f, off, y, 0.95, 1.4, lit ? COL.warm : COL.winDk, lit ? 'glow' : 'flat');
        if (rng() < 0.25) panel(K, H, f, off, y, 1.5, 1.4, shade(col, 0.6), 'flat', 0.06); // open shutters' frame
        else if (rng() < 0.12) F(K, H.box(f.tx ? 0.8 : 0.5, 0.5, f.tz ? 0.8 : 0.5, { x: f.nx * (f.half + 0.25) + f.tx * off, y: y - 1.0, z: f.nz * (f.half + 0.25) + f.tz * off, color: 0xd8d8d0 })); // an AC unit
      }
    }
  }
  if (rng() < 0.16 && T > 6) { // a painted wall ad (the city sells you things even here)
    const f = fs[Math.floor(rng() * 4)];
    if (f.width >= 7) { const aw = Math.min(8, f.width - 1.5), ah = aw / 2; K.add('ads', H.atlasQuad(aw, ah, adCell(Math.floor(rng() * 18)), { x: f.nx * (f.half + 0.05), y: -1.2 - ah / 2, z: f.nz * (f.half + 0.05), ry: f.ry })); }
  }
  // roof dressing at the corners
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].sort(() => rng() - 0.5);
  const cx = (s) => s * (hw - 0.9), cz = (s) => s * (hd - 0.9);
  if (rng() < 0.75) satDish(K, H, cx(corners[0][0]), 0, cz(corners[0][1]), rng() * Math.PI * 2, 0.9 + rng() * 0.4);
  if (rng() < 0.6) waterTank(K, H, cx(corners[1][0]), 0, cz(corners[1][1]), rng);
  if (rng() < 0.45 && p.w > 6) { const s = corners[2][1]; laundry(K, H, -hw + 1, cz(s), hw - 1, cz(s), 0, rng); }
  if (rng() < 0.08) { // a pigeon tower
    const [sx, sz] = corners[3];
    F(K, H.cyl(0.5, 1.0, 3.2, 6, { x: cx(sx), y: 1.6, z: cz(sz), color: 0xc8a070 }));
    for (let k = 0; k < 4; k++) F(K, H.box(0.9, 0.08, 0.9, { x: cx(sx), y: 0.6 + k * 0.7, z: cz(sz), ry: k * 0.4, color: COL.wood }));
  } else if (rng() < 0.3) satDish(K, H, cx(corners[3][0]), 0, cz(corners[3][1]), rng() * Math.PI * 2, 0.7);
}
// (ad atlas cells: the stock satirical adverts, js/render/ads.js; 18 of them in a 4 × 8 atlas)
function adCell(i) { const col = i % 4, row = Math.floor(i / 4); return [col / 4, 1 - (row + 1) / 8, (col + 1) / 4, 1 - row / 8]; }

// ------------------------------------------------------------------ the styles
export const STYLES = {
  // ================================================================ CAIRO
  'eg-street'(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 8, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: p.tint === 1 ? 0xc8a47a : 0xb89a78 });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
  },
  'eg-corniche'(K, p, th, rng, H) {
    const river = p.tint === 1 ? 1 : -1; // which long side faces the Nile (local x)
    body(K, p, H, COL.stone);
    bands(K, p, H, -0.9, -p.thick, 0.9, COL.stoneDk, 0.08, 0.03);
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0xd0c0a0 }));
    F(K, H.box(0.5, 0.25, p.d, { x: river * (p.w / 2 - 0.25), y: 0.12, color: COL.lime })); // the kerb on the river side
    for (let z = -p.d / 2 + 2; z < p.d / 2; z += 4) { // balustrade
      const wz = p.z + z;
      if (wz < -240 || wz > 140) continue;
      F(K, H.box(0.18, 0.9, 0.18, { x: river * (p.w / 2 - 0.2), y: 0.45, z, color: COL.lime }));
    }
    F(K, H.box(0.24, 0.12, Math.min(p.d, 380), { x: river * (p.w / 2 - 0.2), y: 0.92, z: -50 - p.z, color: COL.lime }));
    for (let z = -p.d / 2 + 6; z < p.d / 2; z += 12) { // lamps and palms along the promenade
      const wz = p.z + z;
      if (wz < -230 || wz > 130) continue;
      F(K, H.box(0.14, 4.2, 0.14, { x: river * (p.w / 2 - 0.8), y: 2.1, z, color: 0x2a2a30 }));
      G(K, H.box(0.5, 0.35, 0.5, { x: river * (p.w / 2 - 0.8), y: 4.3, z, color: 0xffe0a0 }));
      if (Math.round(wz / 12) % 2 === 0) palm(K, H, -river * (p.w / 2 - 1.4), 0, z + 6, 6 + rng() * 2.5, rng);
    }
  },
  'eg-houseboat'(K, p, th, rng, H) { // a dahabiya: white hull, a striped canopy on the top deck
    const t = p.tint >= 0 ? p.tint : 0;
    F(K, H.box(p.w, p.thick, p.d - 1.2, { y: -p.thick / 2, color: COL.white }));
    F(K, H.part(new THREE.CylinderGeometry(0.01, p.w / 2, 2.4, 4, 1), { y: -p.thick / 2, z: -p.d / 2 + 0.6, rx: -Math.PI / 2, ry: Math.PI / 4, sz: p.thick / p.w * 1.3, color: COL.white }));
    F(K, H.box(p.w + 0.05, 0.3, p.d - 1.2, { y: -p.thick + 0.3, color: [COL.lapis, COL.turq, COL.red, COL.goldDk][t % 4] }));
    F(K, H.box(p.w - 0.2, 0.05, p.d - 1.4, { y: -0.02, color: COL.wood2 }));
    for (const sx of [-1, 1]) for (let z = -p.d / 2 + 1.4; z <= p.d / 2 - 0.6; z += 2.2) F(K, H.box(0.08, 2.5, 0.08, { x: sx * (p.w / 2 - 0.1), y: 1.25, z, color: COL.wood }));
    for (let k = 0; k < 6; k++) F(K, H.box(p.w / 6, 0.06, p.d - 1.4, { x: -p.w / 2 + (k + 0.5) * (p.w / 6), y: 2.5, color: k % 2 ? COL.white : [COL.lapis, COL.red, COL.turq, COL.goldDk][t % 4] }));
    for (let z = -p.d / 2 + 2; z < p.d / 2 - 1; z += 2.4) G(K, H.box(0.5, 0.5, 0.06, { x: p.w / 2 + 0.01, y: -0.55, z, color: COL.warm }), H.box(0.5, 0.5, 0.06, { x: -p.w / 2 - 0.01, y: -0.55, z, color: COL.warm }));
  },
  'eg-roof'(K, p, th, rng, H) { house(K, p, th, rng, H); },
  'eg-roofTall'(K, p, th, rng, H) { house(K, p, th, rng, H, { tall: true }); N(K, H.box(p.w + 0.2, 0.12, p.d + 0.2, { y: -0.7, color: COL.magenta })); },
  'eg-modern'(K, p, th, rng, H) { // the far bank's tower blocks: concrete and glass, a neon crown
    const tint = H.TOWER_TINT[(p.tint >= 0 ? p.tint : 0) % H.TOWER_TINT.length];
    const fac = H.meterBox(p.w, p.thick, p.d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: Math.floor(rng() * 8) * 2, v0: Math.floor(rng() * 4) * 4, color: mix(tint, 0xe8c8a0, 0.35) });
    fac.translate(0, -p.thick / 2, 0); K.add('facade', fac);
    cap(K, p, H, 0x8a8478, 0x5a564e, 0.4);
    N(K, H.box(p.w + 0.2, 0.2, p.d + 0.2, { y: -1.0, color: NEONS[(p.tint >= 0 ? p.tint : 0) % NEONS.length] }));
    satDish(K, H, p.w / 2 - 1.2, 0, p.d / 2 - 1.2, rng() * 6, 1.6);
    waterTank(K, H, -p.w / 2 + 1.4, 0, -p.d / 2 + 1.4, rng);
  },
  'eg-shop'(K, p, th, rng, H) { // a souk shop: a house over an open shopfront onto al-Muizz street
    house(K, p, th, rng, H, { col: PLASTER[((p.tint >= 0 ? p.tint : 0) + 3) % PLASTER.length] });
    const f = H.faces(p.w, p.d)[p.x < 38 ? 2 : 3]; // the street side (+x for the west row)
    const n = Math.max(1, Math.floor(f.width / 3.2));
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * (f.width / n), y0 = -p.thick;
      archOn(K, H, f, off, y0 + 0.02, 2.4, 3.0, 0x2a1810, 'flat', 0.05);
      G(K, H.box(0.3, 0.4, 0.3, { x: f.nx * (f.half + 0.5) + f.tx * off, y: y0 + 2.6, z: f.nz * (f.half + 0.5) + f.tz * off, color: [COL.warm, 0xff8a40, 0x8ae0ff][k % 3] })); // a hanging lamp
      for (let j = 0; j < 3; j++) F(K, H.box(f.tx ? 0.5 : 0.5, 0.4 + rng() * 0.6, f.tz ? 0.5 : 0.5, { x: f.nx * (f.half + 0.35) + f.tx * (off - 0.7 + j * 0.7), y: y0 + 0.4, z: f.nz * (f.half + 0.35) + f.tz * (off - 0.7 + j * 0.7), color: CLOTH[Math.floor(rng() * CLOTH.length)] })); // goods
    }
    const nc = NEONS[(p.tint >= 0 ? p.tint : 0) % NEONS.length]; // a neon sign over the shopfronts
    N(K, H.box(f.tx ? f.width * 0.6 : 0.08, 0.14, f.tz ? f.width * 0.6 : 0.08, { x: f.nx * (f.half + 0.1), y: -p.thick + 3.7, z: f.nz * (f.half + 0.1), color: nc }));
    for (let k = 0; k < 4; k++) N(K, H.box(f.tx ? 0.12 : 0.08, 0.3 + (k % 2) * 0.25, f.tz ? 0.12 : 0.08, { x: f.nx * (f.half + 0.1) + f.tx * (k - 1.5) * 0.7, y: -p.thick + 4.05, z: f.nz * (f.half + 0.1) + f.tz * (k - 1.5) * 0.7, color: nc }));
  },
  'eg-awning'(K, p, th, rng, H) { // a striped canvas awning across the street, lanterns under it
    const t = p.tint >= 0 ? p.tint : 0, cols = [[COL.red, COL.white], [COL.lapis, COL.white], [0x2a8a5a, COL.sandLt], [COL.goldDk, COL.red], [COL.turq, COL.white]][t % 5];
    const n = 10;
    for (let k = 0; k < n; k++) F(K, H.box(p.w / n + 0.01, p.thick, p.d, { x: -p.w / 2 + (k + 0.5) * (p.w / n), y: -p.thick / 2, color: cols[k % 2] }));
    for (const sz of [-1, 1]) for (let k = 0; k < n; k++) F(K, H.part(new THREE.CircleGeometry(p.w / n / 2, 3, Math.PI, Math.PI), { x: -p.w / 2 + (k + 0.5) * (p.w / n), y: -p.thick, z: sz * (p.d / 2 + 0.01), ry: sz > 0 ? 0 : Math.PI, color: cols[k % 2] }));
    for (const x of [-2.2, 2.2]) { F(K, H.box(0.03, 0.6, 0.03, { x, y: -p.thick - 0.3, color: 0x2a2a2a })); G(K, H.cyl(0.18, 0.12, 0.4, 6, { x, y: -p.thick - 0.75, color: x < 0 ? COL.warm : 0xff9a50 })); }
  },
  'eg-soukRoof'(K, p, th, rng, H) { // the covered souk: a stone vault, lanterns hanging inside
    body(K, p, H, COL.stone);
    cap(K, p, H, COL.limeDk);
    for (let z = -p.d / 2 + 1; z < p.d / 2; z += 3) F(K, H.part(new THREE.TorusGeometry(p.w / 2 - 0.4, 0.22, 3, 8, Math.PI), { y: -p.thick - 0.1 - (p.w / 2 - 0.4) * 0.15, z, sy: 0.35, rz: 0, color: COL.stoneDk }));
    for (let z = -p.d / 2 + 2.5; z < p.d / 2; z += 5) { F(K, H.box(0.03, 0.8, 0.03, { y: -p.thick - 0.4, z, color: 0x2a2a2a })); G(K, H.cyl(0.22, 0.16, 0.5, 6, { y: -p.thick - 1.0, z, color: [COL.warm, 0x40c0ff, 0xff70c0][Math.abs(Math.round(z)) % 3] })); }
    for (const sz of [-1, 1]) archOn(K, H, H.faces(p.w, p.d)[sz < 0 ? 0 : 1], 0, -p.thick - 5.6, 7.2, 6.4, 0x6a4a30, 'flat', 0.02);
  },
  'eg-gate'(K, p, th, rng, H) { // Bab Zuweila's towers: ablaq stone courses, slits, a crenellated top
    body(K, p, H, COL.stone);
    bands(K, p, H, -0.9, -p.thick, 1.2, COL.lime, 0.6, 0.03);
    for (const f of H.faces(p.w, p.d)) for (const y of [-3, -6.5]) panel(K, H, f, 0, y, 0.25, 1.4, COL.dark, 'flat', 0.04);
    F(K, H.box(p.w + 0.5, 0.5, p.d + 0.5, { y: -0.7, color: COL.limeDk }));
    cap(K, p, H, 0xb8a080);
    merlons(K, p, H, COL.stone, [0, 1, 2, 3], 0.6, 1.5, 0.7);
  },
  'eg-gateArch'(K, p, th, rng, H) {
    body(K, p, H, COL.stone);
    bands(K, p, H, -0.6, -p.thick, 1.2, COL.lime, 0.6, 0.03);
    cap(K, p, H, 0xb8a080);
    for (const i of [0, 1]) { const f = H.faces(p.w, p.d)[i]; F(K, H.part(new THREE.TorusGeometry(p.w / 2 - 0.2, 0.3, 3, 8, Math.PI), { x: 0, y: -p.thick, z: f.nz * (f.half + 0.05), color: COL.limeDk })); N(K, H.part(new THREE.TorusGeometry(p.w / 2 - 0.6, 0.07, 3, 10, Math.PI), { y: -p.thick, z: f.nz * (f.half + 0.1), color: COL.gold })); }
  },
  'eg-gateMinaret'(K, p, th, rng, H) { // slim octagonal shafts with a balcony and a gilded top
    F(K, H.cyl(p.r, p.r, p.thick, 8, { y: -p.thick / 2, color: COL.lime }));
    for (let y = -1.2; y > -p.thick; y -= 2.2) F(K, H.cyl(p.r + 0.06, p.r + 0.06, 0.25, 8, { y, color: COL.stone }));
    F(K, H.cyl(p.r + 0.6, p.r + 0.2, 0.4, 8, { y: -3.2, color: COL.limeDk }));
    N(K, H.cyl(p.r + 0.62, p.r + 0.62, 0.08, 8, { y: -3.0, color: COL.cyan }));
    cap(K, p, H, COL.goldDk, null, 0, 8);
    F(K, H.cyl(0.05, 0.05, 1.4, 4, { y: 0.7, color: COL.gold }));
    F(K, H.part(new THREE.TorusGeometry(0.28, 0.06, 3, 8, Math.PI * 1.4), { y: 1.55, rz: -0.6, color: COL.gold }));
  },
  'eg-citadel'(K, p, th, rng, H) { // the Citadel's walls: dressed stone, towers on the faces, crenellations
    body(K, p, H, COL.stone);
    bands(K, p, H, -1.2, -p.thick, 1.6, COL.stoneDk, 0.1, 0.03);
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0xc8b490 }));
    merlons(K, p, H, COL.stone, [0, 1, 2, 3], 0.7, 1.8, 0.8);
    for (const f of H.faces(p.w, p.d)) for (let off = -f.width / 2 + 10; off < f.width / 2 - 4; off += 18) {
      F(K, H.cyl(2.4, 2.6, p.thick, H.seg(12, 8), { x: f.nx * f.half + f.tx * off, y: -p.thick / 2, z: f.nz * f.half + f.tz * off, color: shade(COL.stone, 0.94) }));
      for (const y of [-3, -6]) panel(K, H, f, off, y, 0.25, 1.2, COL.dark, 'flat', 2.5);
    }
  },
  'eg-steps'(K, p, th, rng, H) { body(K, p, H, COL.stoneDk); cap(K, p, H, COL.lime); },
  'eg-mosque'(K, p, th, rng, H) { // Muhammad Ali's prayer hall: alabaster, two tiers of arched windows
    body(K, p, H, COL.alabaster);
    for (const f of H.faces(p.w, p.d)) {
      const n = Math.floor(f.width / 3.5);
      for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * 3.5; archOn(K, H, f, off, -p.thick + 1.2, 1.5, 3.2, 0x3a3440); archOn(K, H, f, off, -5.4, 1.1, 2.2, th.night > 0.3 ? COL.warm : 0x4a4450, th.night > 0.3 ? 'glow' : 'flat'); }
    }
    bands(K, p, H, -0.6, -1.2, 1, COL.alabSh, 0.5, 0.15);
    F(K, H.box(p.w + 0.6, 0.4, p.d + 0.6, { y: -p.thick + 0.2, color: COL.alabSh }));
    N(K, H.box(p.w + 0.36, 0.08, p.d + 0.36, { y: -1.25, color: COL.gold }));
    cap(K, p, H, COL.lead);
  },
  'eg-riwaq'(K, p, th, rng, H) { // the courtyard's arcades
    body(K, p, H, COL.alabaster);
    for (const f of H.faces(p.w, p.d)) { const n = Math.floor(f.width / 2.6); for (let k = 0; k < n; k++) archOn(K, H, f, (k - (n - 1) / 2) * 2.6, -p.thick + 0.1, 1.7, 3.4, 0x3a3440); }
    F(K, H.box(p.w + 0.3, 0.3, p.d + 0.3, { y: -0.25, color: COL.alabSh }));
    cap(K, p, H, COL.lead);
  },
  'eg-fountain'(K, p, th, rng, H) { // the ablution kiosk: an octagon of arches under a green dome
    F(K, H.cyl(p.r - 0.3, p.r - 0.3, p.thick - 1.2, 8, { y: -1.2 - (p.thick - 1.2) / 2, color: COL.alabaster }));
    ringArches(K, H, p.r - 0.3, 8, -p.thick + 0.1, 1.9, 1.0, 0x3a3440);
    F(K, H.cyl(p.r * 0.62, p.r, 1.2, 12, { y: -0.6, color: 0x4a8a6a }));
    cap(K, p, H, 0x5a9a7a, null, 0, 12);
    N(K, H.cyl(p.r + 0.04, p.r + 0.04, 0.08, 12, { y: -1.2, color: COL.gold }));
  },
  'eg-dome'(K, p, th, rng, H) { // a terrace of the great dome (lead, gold rims); tint 5: a little corner dome
    if (p.tint === 5) {
      F(K, H.cyl(p.r, p.r, p.thick - 1.0, H.seg(16, 10), { y: -1.0 - (p.thick - 1.0) / 2, color: COL.alabaster }));
      ringArches(K, H, p.r, 8, -p.thick + 0.2, 1.0, 0.6, 0x3a3440);
      F(K, H.cyl(p.r * 0.55, p.r, 1.0, H.seg(16, 10), { y: -0.5, color: COL.lead }));
      cap(K, p, H, COL.lead, null, 0, H.seg(16, 10));
      return;
    }
    if (p.tint === 0) { // the drum: windows all round
      F(K, H.cyl(p.r, p.r, p.thick, H.seg(32, 18), { y: -p.thick / 2, color: COL.alabaster }));
      ringArches(K, H, p.r, 20, -p.thick + 0.4, 1.8, 0.8, th.night > 0.3 ? COL.warm : 0x3a3440, th.night > 0.3 ? 'glow' : 'flat');
      cap(K, p, H, COL.lead, COL.gold, 0.12, H.seg(32, 18));
      return;
    }
    F(K, H.cyl(p.r, p.r + 0.35, p.thick, H.seg(28, 16), { y: -p.thick / 2, color: COL.lead }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; F(K, H.box(0.18, p.thick, 0.18, { x: Math.cos(a) * (p.r + 0.2), y: -p.thick / 2, z: Math.sin(a) * (p.r + 0.2), color: COL.leadDk })); }
    cap(K, p, H, 0x9aa4ac, COL.gold, 0.1, H.seg(28, 16));
  },
  'eg-domeLantern'(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r + 0.2, p.thick, 8, { y: -p.thick / 2, color: COL.alabaster }));
    ringArches(K, H, p.r + 0.1, 8, -p.thick + 0.2, 1.1, 0.4, COL.warm, 'glow');
    cap(K, p, H, COL.gold, null, 0, 8);
  },
  'eg-minaret'(K, p, th, rng, H) { // a pencil minaret's shaft: fluted alabaster, gilded rings
    F(K, H.cyl(p.r, p.r * 1.15, p.thick, H.seg(16, 10), { y: -p.thick / 2, color: COL.alabaster }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; F(K, H.box(0.12, p.thick - 2, 0.12, { x: Math.cos(a) * (p.r + 0.03), y: -p.thick / 2 - 1, z: Math.sin(a) * (p.r + 0.03), color: COL.alabSh })); }
    for (const y of [-2, -p.thick * 0.4, -p.thick + 2]) F(K, H.cyl(p.r + 0.12, p.r + 0.12, 0.3, H.seg(16, 10), { y, color: COL.gold }));
    F(K, H.cyl(p.r + 0.9, p.r + 0.15, 0.6, H.seg(16, 10), { y: -p.thick * 0.4 + 0.5, color: COL.alabSh })); // the lower balcony
    N(K, H.cyl(p.r + 0.92, p.r + 0.92, 0.08, H.seg(16, 10), { y: -p.thick * 0.4 + 0.85, color: COL.cyan }));
  },
  'eg-minaretBalcony'(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r, p.thick, H.seg(20, 12), { y: -p.thick / 2, color: COL.alabaster }));
    for (let k = 0; k < 3; k++) F(K, H.cyl(p.r - 0.35 - k * 0.35, p.r - 0.35 - k * 0.35, 0.3, H.seg(20, 12), { y: -p.thick - 0.15 - k * 0.3, color: k % 2 ? COL.alabSh : COL.alabaster })); // muqarnas
    F(K, H.part(new THREE.TorusGeometry(p.r - 0.08, 0.05, 3, H.seg(20, 12)), { rx: Math.PI / 2, y: 0.85, color: COL.gold }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; F(K, H.box(0.05, 0.85, 0.05, { x: Math.cos(a) * (p.r - 0.08), y: 0.42, z: Math.sin(a) * (p.r - 0.08), color: COL.gold })); }
    cap(K, p, H, 0xd8d0c0, null, 0, H.seg(20, 12));
    N(K, H.cyl(p.r + 0.03, p.r + 0.03, 0.06, H.seg(20, 12), { y: -p.thick + 0.05, color: COL.cyan }));
  },
  'eg-minaretCap'(K, p, th, rng, H) { // the pencil: a lead cone above the balcony, a crescent on top
    F(K, H.cyl(p.r, p.r, p.thick, 10, { y: -p.thick / 2, color: COL.alabaster }));
    F(K, H.part(new THREE.ConeGeometry(p.r + 0.15, 5.5, 10), { y: 2.75, color: COL.lead }));
    F(K, H.cyl(0.06, 0.06, 1.0, 4, { y: 6.0, color: COL.gold }));
    F(K, H.part(new THREE.TorusGeometry(0.34, 0.08, 3, 10, Math.PI * 1.35), { y: 6.75, rz: -0.75, color: COL.gold }));
  },
  'eg-mashrabiya'(K, p, th, rng, H) { // a turned-wood lattice balcony, bracketed off the minaret
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.wood }));
    F(K, H.box(p.w - 0.1, 0.05, p.d - 0.1, { y: -0.02, color: COL.wood2 }));
    for (let k = -4; k <= 4; k++) F(K, H.box(0.06, 1.1, 0.06, { x: k * (p.w / 9), y: -p.thick - 0.55, z: -p.d / 2 + 0.03, color: COL.woodDk })); // the lattice under its lip
    for (let y = -0.8; y > -1.8; y -= 0.25) F(K, H.box(p.w, 0.05, 0.06, { y: y - p.thick * 0.2, z: -p.d / 2 + 0.03, color: COL.woodDk }));
    for (const sx of [-1, 1]) F(K, strut(H, [sx * (p.w / 2 - 0.3), -p.thick, p.d / 2 - 0.2], [sx * 0.3, -p.thick - 1.6, p.d / 2 + 1.1], 0.14, COL.woodDk));
    G(K, H.box(0.2, 0.25, 0.2, { x: 0, y: -p.thick - 0.2, z: -p.d / 2 + 0.3, color: COL.warm }));
  },
  'eg-felucca'(K, p, th, rng, H) { // a hover felucca: a white hull, a lateen sail high over the deck
    const t = p.tint >= 0 ? p.tint : 0, hd = p.d / 2, stripe = [COL.lapis, COL.red, COL.turq, COL.goldDk][t % 4];
    F(K, H.box(p.w, p.thick, p.d - 1.6, { y: -p.thick / 2, z: 0.6, color: COL.white }));
    F(K, H.part(new THREE.CylinderGeometry(0.02, p.w / 2, 2.6, 4, 1), { y: -p.thick / 2 + 0.05, z: -hd + 1.05, rx: -Math.PI / 2, ry: Math.PI / 4, sx: 1.0, sz: 0.55, color: COL.white })); // the bow
    F(K, H.box(p.w + 0.05, 0.22, p.d - 1.6, { y: -0.35, z: 0.6, color: stripe }));
    F(K, H.box(p.w - 0.25, 0.05, p.d - 2.0, { y: -0.02, z: 0.6, color: COL.wood2 }));
    F(K, H.box(0.12, 6.8, 0.12, { y: 3.4, z: -hd + 2.2, color: COL.woodDk })); // the mast near the bow
    F(K, strut(H, [0, 1.9, -hd + 0.6], [0, 10.2, hd - 0.4], 0.12, COL.woodDk)); // the long yard
    const sail = new THREE.BufferGeometry();
    const v = [0, 2.3, -hd + 1.2, 0, 9.8, hd - 0.6, 0, 2.3, hd - 0.9]; // tack, peak, clew: the foot clears your head
    sail.setAttribute('position', new THREE.Float32BufferAttribute([...v, v[0], v[1], v[2], v[6], v[7], v[8], v[3], v[4], v[5]], 3));
    F(K, H.part(sail, { x: 0.08, color: t % 2 ? 0xf4ecd8 : 0xf8f4ec }));
    F(K, strut(H, [0.1, 2.3, -hd + 1.2], [0.1, 2.3, hd - 0.9], 0.06, COL.woodDk)); // the boom
    N(K, H.box(p.w + 0.06, 0.06, 0.06, { y: -p.thick + 0.1, z: hd - 0.3, color: COL.cyan }));
    jets(K, H, [[-0.8, -2], [0.8, -2], [-0.8, 2.5], [0.8, 2.5]], -p.thick - 0.03);
  },
  'eg-fanous'(K, p, th, rng, H) { // a Ramadan lantern: a brass deck over coloured glass, a pointed foot
    const glass = [0xff5a3a, 0x3ad0ff, 0xffd23a, 0x6aff6a, 0xff4ad8, 0xffa03a][(p.tint >= 0 ? p.tint : 0) % 6];
    F(K, H.cyl(p.r, p.r * 0.9, 0.3, 6, { y: -0.15, color: COL.goldDk }));
    F(K, H.cyl(p.r * 0.92, p.r * 0.92, 0.04, 6, { y: 0.0, color: 0xd8a040 }));
    G(K, H.cyl(p.r * 0.72, p.r * 0.6, 1.5, 6, { y: -1.05, color: glass }));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; F(K, strut(H, [Math.cos(a) * p.r * 0.85, -0.3, Math.sin(a) * p.r * 0.85], [Math.cos(a) * p.r * 0.62, -1.8, Math.sin(a) * p.r * 0.62], 0.07, COL.goldDk)); }
    F(K, H.cyl(p.r * 0.66, p.r * 0.66, 0.16, 6, { y: -1.85, color: COL.goldDk }));
    F(K, H.part(new THREE.ConeGeometry(p.r * 0.55, 1.1, 6), { y: -2.5, rx: Math.PI, color: COL.goldDk }));
    G(K, H.part(new THREE.SphereGeometry(0.16, 5, 3), { y: -3.15, color: glass }));
  },
  'eg-gezira'(K, p, th, rng, H) { // Gezira island: dry lawns, gravel paths, palms round the edge
    body(K, p, H, COL.stone);
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0x8a9a4a }));
    F(K, H.box(3, 0.08, p.d - 2, { x: 0, y: 0.0, color: 0xd8c8a0 }), H.box(p.w - 2, 0.08, 3, { y: 0.0, z: 4, color: 0xd8c8a0 }));
    F(K, H.part(new THREE.RingGeometry(6.2, 7.6, H.seg(24, 14)), { rx: -Math.PI / 2, y: 0.02, x: 0, z: 4, color: 0xd8c8a0 }));
    for (const f of H.faces(p.w, p.d)) for (let off = -f.width / 2 + 3; off < f.width / 2 - 2; off += 7) {
      const x = f.nx * (f.half - 1.2) + f.tx * off, z = f.nz * (f.half - 1.2) + f.tz * off;
      if (Math.abs(x) < 9 && Math.abs(z - 4) < 9) continue;
      palm(K, H, x, 0, z, 6 + rng() * 3, rng);
    }
    bands(K, p, H, -0.6, -p.thick, 0.8, COL.stoneDk, 0.1, 0.03);
  },
  'eg-jetty'(K, p, th, rng, H) {
    for (let x = -p.w / 2 + 0.25; x < p.w / 2; x += 0.5) F(K, H.box(0.46, 0.12, p.d, { x, y: -0.06, color: (Math.round(x * 2) % 2) ? COL.wood2 : COL.wood }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, H.cyl(0.14, 0.14, p.thick + 1.2, 5, { x: sx * (p.w / 2 - 0.3), y: -(p.thick + 1.2) / 2 + 0.3, z: sz * (p.d / 2 - 0.2), color: COL.woodDk }));
  },
  'eg-towerBase'(K, p, th, rng, H) {
    body(K, p, H, COL.concrete, { seg: H.seg(24, 14) });
    cap(K, p, H, 0xb8ae9a, 0x8a8478, 0.2);
    N(K, H.cyl(p.r + 0.15, p.r + 0.15, 0.08, H.seg(24, 14), { y: -0.5, color: COL.gold }));
  },
  'eg-cairoShaft'(K, p, th, rng, H) { // the Cairo Tower's shaft under its lotus lattice
    F(K, H.cyl(p.r, p.r, p.thick, H.seg(16, 10), { y: -p.thick / 2, color: 0xd0c4a8 }));
    const n = 10;
    for (let k = 0; k < n; k++) { // the diagonal weave: two helices of ribs
      for (const s of [-1, 1]) {
        const a0 = (k / n) * Math.PI * 2;
        for (let y = -2; y > -p.thick + 2; y -= 7) {
          const a1 = a0 + s * 0.65;
          F(K, strut(H, [Math.cos(a0) * (p.r + 0.12), y, Math.sin(a0) * (p.r + 0.12)], [Math.cos(a1) * (p.r + 0.12), y - 7, Math.sin(a1) * (p.r + 0.12)], 0.22, 0xe8dcc0));
        }
      }
    }
    for (let y = -3.5; y > -p.thick; y -= 7) N(K, H.cyl(p.r + 0.18, p.r + 0.18, 0.08, H.seg(16, 10), { y, color: COL.cyan }));
  },
  'eg-lattice'(K, p, th, rng, H) { // a lattice knot: a curved concrete lotus-leaf beam, struts back to the shaft
    const rc = p.d > 1.9 ? (p.w > 3.8 ? 7.8 : 6.2) : 4.0, inner = rc - 3.0; // (local +z points at the shaft)
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xe2d6bc }));
    F(K, H.box(p.w - 0.3, 0.05, p.d - 0.3, { y: -0.01, color: 0xc8bca0 }));
    N(K, H.box(p.w, 0.08, 0.08, { y: -p.thick, z: -p.d / 2, color: (p.tint >= 0 ? p.tint : 0) % 2 ? COL.cyan : COL.gold }));
    for (const sx of [-1, 1]) F(K, strut(H, [sx * (p.w / 2 - 0.2), -p.thick, -p.d / 2 + 0.2], [sx * 0.6, -p.thick - 2.4, inner], 0.24, 0xe8dcc0));
    if (inner > p.d / 2 + 0.3) F(K, H.box(0.5, 0.35, inner - p.d / 2, { y: -p.thick / 2, z: (inner + p.d / 2) / 2, color: 0xe2d6bc }));
  },
  'eg-lotusCrown'(K, p, th, rng, H) { // the crown: a glazed restaurant level and the lotus petals
    F(K, H.cyl(p.r, p.r * 0.75, 0.6, H.seg(24, 14), { y: -p.thick + 0.3, color: 0xd0c4a8 }));
    K.add('glass', H.cyl(p.r - 0.1, p.r - 0.3, p.thick - 0.9, H.seg(24, 14), { y: -p.thick / 2 - 0.15 }));
    G(K, H.cyl(p.r - 0.35, p.r - 0.5, p.thick - 1.2, H.seg(24, 14), { y: -p.thick / 2 - 0.15, color: 0xffd890 }));
    cap(K, p, H, 0xc8bca0, 0xe0d4b8, 0.3);
    for (let k = 0; k < 16; k++) { // the lotus petals cup the deck
      const a = (k / 16) * Math.PI * 2, r = p.r + 0.3;
      F(K, H.part(new THREE.ConeGeometry(0.7, 3.4, 4), { x: Math.cos(a) * r, y: -0.6, z: Math.sin(a) * r, ry: -a, rz: 0, ...orient(Math.cos(a) * 0.55, 1, Math.sin(a) * 0.55), sz: 0.25, color: k % 2 ? 0x6a9a5a : 0x5a8a4a }));
    }
    N(K, H.cyl(p.r + 0.35, p.r + 0.35, 0.1, H.seg(24, 14), { y: -p.thick + 0.05, color: COL.gold }));
  },
  'eg-kiosk'(K, p, th, rng, H) {
    body(K, p, H, PLASTER[((p.tint >= 0 ? p.tint : 0) + 4) % 8]);
    cap(K, p, H, 0x8a6a4a);
    const f = H.faces(p.w, p.d)[1];
    panel(K, H, f, 0, -1.0, p.w * 0.7, 0.9, COL.warm, 'glow');
    for (let k = 0; k < 6; k++) F(K, H.box(p.w / 6, 0.08, 1.0, { x: -p.w / 2 + (k + 0.5) * (p.w / 6), y: -0.3, z: p.d / 2 + 0.5, rx: 0.3, color: k % 2 ? COL.white : COL.red }));
  },
  'eg-dish'(K, p, th, rng, H) { // a giant satellite dish: a grille deck across its rim, the bowl under it
    F(K, H.part(new THREE.CylinderGeometry(p.r + 0.2, 0.6, 1.6, H.seg(20, 12), 1, true), { y: -0.85, color: 0xeceae4 }));
    F(K, H.part(new THREE.CylinderGeometry(p.r + 0.1, 0.55, 1.5, H.seg(20, 12), 1, true), { y: -0.8, rx: Math.PI, color: 0xc8c8c4 }));
    for (let k = -3; k <= 3; k++) F(K, H.box(0.1, 0.06, 2 * Math.sqrt(Math.max(0.1, p.r * p.r - (k * 1.2) * (k * 1.2))), { x: k * 1.2, y: -0.03, color: COL.steel }));
    for (let k = -3; k <= 3; k++) F(K, H.box(2 * Math.sqrt(Math.max(0.1, p.r * p.r - (k * 1.2) * (k * 1.2))), 0.06, 0.1, { z: k * 1.2, y: -0.03, color: COL.steel }));
    F(K, H.cyl(0.25, 0.3, 5.5, 6, { y: -4.2, color: COL.steelDk }));
    N(K, H.part(new THREE.TorusGeometry(p.r + 0.18, 0.06, 3, H.seg(20, 12)), { rx: Math.PI / 2, y: 0.0, color: COL.magenta }));
  },

  // ================================================================ DATA PYRAMID
  'eg-desert'(K, p, th, rng, H) { // sand: flat ochre, darker drifts, wind-blown ridges near the play space
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xdcb27a }));
    const cx = -p.x, cz = -80 - p.z; // (the pyramid's centre, in this slab's frame)
    for (let k = 0; k < 40; k++) {
      const x = cx + (rng() - 0.5) * 360, z = cz + (rng() - 0.5) * 360;
      if (Math.abs(x) > p.w / 2 - 8 || Math.abs(z) > p.d / 2 - 8) continue;
      F(K, H.box(6 + rng() * 22, 0.02, 3 + rng() * 10, { x, y: 0.01, z, ry: rng() * 3, color: rng() < 0.5 ? 0xd0a46c : 0xe6c08a }));
    }
    for (let k = 0; k < 24; k++) { // wind-blown sand ridges near the play space
      const x = cx + (rng() - 0.5) * 320, z = cz + (rng() - 0.5) * 320;
      if (Math.abs(x) > p.w / 2 - 10 || Math.abs(z) > p.d / 2 - 10 || (Math.abs(x - cx) < 46 && Math.abs(z - cz) < 46)) continue;
      F(K, H.part(new THREE.SphereGeometry(1, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), { x, y: -0.05, z, sx: 4 + rng() * 6, sy: 0.35 + rng() * 0.5, sz: 1.5 + rng() * 2, ry: rng() * 3, color: 0xe8c48c }));
    }
  },
  'eg-pitFloor'(K, p, th, rng, H) { // far down the boat pit: cable trays glowing in the dark
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x1a1410 }));
    for (let k = 0; k < 5; k++) N(K, H.box(p.w, 0.12, 0.25, { y: 0.06, z: -p.d / 2 + 1 + k * 1.5, color: k % 2 ? COL.cyan : COL.magenta }));
  },
  'eg-barque': barque,
  'eg-course'(K, p, th, rng, H) { course(K, p, th, rng, H); },
  'eg-summit'(K, p, th, rng, H) { // the top course and, hovering over it, the glass capstone
    course(K, p, th, rng, H);
    const cy = 11.5, r = 6.2, h = 7.5;
    G(K, H.part(new THREE.ConeGeometry(r, h, 4), { y: cy, ry: Math.PI / 4, color: 0xfff2c0 })); // glowing glass
    G(K, H.part(new THREE.ConeGeometry(r, h * 0.35, 4), { y: cy - h / 2 - h * 0.175, rx: Math.PI, ry: Math.PI / 4, color: 0xffc860 }));
    for (let k = 1; k < 5; k++) N(K, H.part(new THREE.TorusGeometry(r * (1 - k / 5) * 1.0, 0.07, 3, 4), { rx: Math.PI / 2, y: cy - h / 2 + h * (k / 5), rz: Math.PI / 4, color: COL.cyan })); // its data courses
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + (k / 4) * Math.PI * 2; N(K, strut(H, [Math.cos(a) * r, cy - h / 2, Math.sin(a) * r], [0, cy + h / 2, 0], 0.16, COL.gold)); }
    N(K, H.part(new THREE.TorusGeometry(r * 0.98, 0.1, 3, 4), { rx: Math.PI / 2, y: cy - h / 2, rz: Math.PI / 4, color: COL.cyan }));
    G(K, H.cyl(0.25, 0.25, 4.5, 6, { y: 8.2 - h / 2 - 1.2, color: 0xfff0b0 })); // the data downlink
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { // cooling vents at the corners
      F(K, H.box(1.6, 1.0, 1.6, { x: sx * (p.w / 2 - 1.2), y: 0.5, z: sz * (p.d / 2 - 1.2), color: COL.steelDk }));
      G(K, H.box(1.2, 0.05, 1.2, { x: sx * (p.w / 2 - 1.2), y: 1.02, z: sz * (p.d / 2 - 1.2), color: 0xff8a3a }));
    }
  },
  'eg-causeway'(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    bands(K, p, H, -0.7, -p.thick, 0.8, COL.limeDk, 0.08, 0.03);
    cap(K, p, H, 0xd8c498);
    for (const sx of [-1, 1]) {
      F(K, H.box(0.5, 0.6, p.d, { x: sx * (p.w / 2 - 0.25), y: 0.3, color: COL.limeDk }));
      for (let z = -p.d / 2 + 4; z < p.d / 2; z += 8) { F(K, H.box(0.18, 2.8, 0.18, { x: sx * (p.w / 2 - 0.25), y: 2.0, z, color: COL.steelDk })); G(K, H.box(0.4, 0.3, 0.4, { x: sx * (p.w / 2 - 0.25), y: 3.5, z, color: COL.cyan })); }
    }
  },
  'eg-dune'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xe2b880 }));
    for (const f of H.faces(p.w, p.d)) F(K, H.part(new THREE.CylinderGeometry(0.01, p.thick * 0.9, f.width, 3, 1), { x: f.nx * (f.half + p.thick * 0.2), y: -p.thick * 0.55, z: f.nz * (f.half + p.thick * 0.2), rz: f.tx ? Math.PI / 2 : 0, rx: f.tz ? Math.PI / 2 : 0, ry: 0, color: 0xe8c08a }));
    cap(K, p, H, 0xeac890);
  },
  'eg-sphinx': sphinxBody,
  'eg-sphinxPaw'(K, p, th, rng, H) {
    sphinxBody(K, p, th, rng, H);
    for (let k = 0; k < 4; k++) F(K, H.part(new THREE.SphereGeometry(0.75, 6, 4), { x: p.w / 2 - 0.2, y: -p.thick + 0.75, z: -p.d / 2 + 0.7 + k * ((p.d - 1.4) / 3), sx: 1.3, color: COL.sand }));
    N(K, H.box(0.08, 0.08, p.d, { x: p.w / 2 + 0.05, y: -0.4, color: COL.cyan }));
  },
  'eg-nemes'(K, p, th, rng, H) { // the headdress's lappets: gold and lapis stripes
    for (let y = 0, k = 0; y > -p.thick; y -= 0.55, k++) F(K, H.box(p.w + (k % 2) * 0.06, 0.55, p.d + (k % 2) * 0.06, { y: y - 0.275, color: k % 2 ? COL.lapis : COL.gold }));
    cap(K, p, H, COL.gold);
  },
  'eg-sphinxHead': sphinxHead,
  'eg-stela'(K, p, th, rng, H) { // the Dream Stela, its carving relit in neon
    body(K, p, H, COL.granite);
    F(K, H.part(new THREE.CylinderGeometry(p.d / 2, p.d / 2, p.w, 10, 1, false, 0, Math.PI), { y: -0.01, rz: Math.PI / 2, ry: Math.PI / 2, color: COL.granite }));
    const f = H.faces(p.w, p.d)[2];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) panel(K, H, f, -1.3 + c * 0.86, -1.2 - r * 0.9, 0.5, 0.5, (r + c) % 3 ? COL.cyan : COL.gold, 'neon', 0.02);
  },
  'eg-mastCore'(K, p, th, rng, H) {
    F(K, H.cyl(p.r * 0.7, p.r, p.thick, 6, { y: -p.thick / 2, color: COL.steelDk }));
    for (let y = -1.5; y > -p.thick; y -= 3) { F(K, H.cyl(p.r + 0.15, p.r + 0.15, 0.2, 6, { y, color: COL.steel })); G(K, H.box(0.2, 0.2, 0.2, { x: p.r + 0.1, y: y - 0.4, color: 0xff2a2a })); }
    N(K, H.box(0.08, p.thick, 0.08, { x: p.r * 0.8, y: -p.thick / 2, color: COL.cyan }));
  },
  'eg-sensorArm'(K, p, th, rng, H) { // an antenna arm: a grating, a strut, a dish hung under its tip
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.steel }));
    for (let x = -p.w / 2 + 0.3; x < p.w / 2; x += 0.6) F(K, H.box(0.06, 0.04, p.d, { x, y: 0.0, color: COL.steelDk }));
    F(K, strut(H, [0, -p.thick, -p.d / 2 + 0.2], [0, -p.thick - 2.0, p.d / 2 + 1.4], 0.18, COL.steelDk));
    F(K, H.part(new THREE.ConeGeometry(0.8, 0.3, 8, 1, true), { y: -p.thick - 0.6, z: -p.d / 2 - 0.4, rx: -1.0, color: 0xe8e8e4 }));
    G(K, H.box(0.18, 0.18, 0.18, { x: p.w / 2 - 0.1, y: 0.15, z: -p.d / 2 + 0.1, color: 0xff3a3a }));
    N(K, H.box(p.w, 0.06, 0.06, { y: -p.thick, z: -p.d / 2, color: COL.cyan }));
  },
  'eg-sensorDeck'(K, p, th, rng, H) { // the array's crown: a radar dish turned to the sky, beacons
    F(K, H.cyl(p.r, p.r * 0.8, p.thick, 12, { y: -p.thick / 2, color: COL.steel }));
    cap(K, p, H, COL.steelDk, null, 0, 12);
    F(K, H.part(new THREE.ConeGeometry(0.75, 0.3, 10, 1, true), { x: -1.6, y: 1.1, rx: Math.PI * 0.85, rz: 0.4, color: 0xf0f0ec }));
    F(K, H.cyl(0.06, 0.06, 1.0, 4, { x: -1.6, y: 0.5, color: COL.steelDk }));
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 1; F(K, H.cyl(0.04, 0.04, 2.4, 3, { x: Math.cos(a) * (p.r - 0.2), y: 1.2, z: Math.sin(a) * (p.r - 0.2), color: COL.steel })); G(K, H.box(0.16, 0.16, 0.16, { x: Math.cos(a) * (p.r - 0.2), y: 2.45, z: Math.sin(a) * (p.r - 0.2), color: 0xff2a2a })); }
    N(K, H.cyl(p.r + 0.04, p.r + 0.04, 0.08, 12, { y: -0.3, color: COL.cyan }));
  },
  'eg-solar'(K, p, th, rng, H) { // a photovoltaic table, nearly flat, on steel legs
    F(K, H.box(p.w, 0.14, p.d, { y: -0.08, rx: 0.08, color: COL.panel }));
    for (let x = -p.w / 2 + 1; x < p.w / 2; x += 1) F(K, H.box(0.04, 0.02, p.d, { x, y: 0.0, rx: 0.08, color: 0x8aa0c8 }));
    F(K, H.box(p.w, 0.02, 0.04, { y: 0.0, color: 0x8aa0c8 }));
    for (const sx of [-1, 1]) F(K, H.box(0.12, p.thick, 0.12, { x: sx * (p.w / 2 - 0.6), y: -p.thick / 2, color: COL.steel }));
  },
  'eg-solarTower'(K, p, th, rng, H) { // the solar tower: a tapering shaft, the receiver glowing white-gold
    F(K, H.cyl(p.r, p.r + 1.4, p.thick - 4, H.seg(16, 10), { y: -4 - (p.thick - 4) / 2, color: COL.concrete }));
    G(K, H.cyl(p.r + 0.5, p.r + 0.5, 3.2, H.seg(16, 10), { y: -2.1, color: 0xfff0b0 }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; F(K, H.box(0.12, 3.2, 0.12, { x: Math.cos(a) * (p.r + 0.56), y: -2.1, z: Math.sin(a) * (p.r + 0.56), color: 0xc89a3a })); }
    cap(K, p, H, COL.steelDk, COL.steel, 0.3, H.seg(16, 10));
    for (let y = -6; y > -p.thick; y -= 6) N(K, H.cyl(p.r + 0.6 + (-y / p.thick) * 1.3, p.r + 0.6 + (-y / p.thick) * 1.3, 0.1, H.seg(16, 10), { y, color: COL.gold }));
  },
  'eg-serviceDrone'(K, p, th, rng, H) { // a maintenance drone: a pad on four rotors
    F(K, H.cyl(p.r, p.r * 0.85, p.thick, 10, { y: -p.thick / 2, color: COL.steelDk }));
    cap(K, p, H, 0xe0a030, null, 0, 10);
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k / 4) * Math.PI * 2, x = Math.cos(a) * (p.r + 0.7), z = Math.sin(a) * (p.r + 0.7);
      F(K, H.box(1.0, 0.12, 0.2, { x: Math.cos(a) * (p.r + 0.2), y: -0.25, z: Math.sin(a) * (p.r + 0.2), ry: -a, color: COL.steel }));
      F(K, H.cyl(0.65, 0.65, 0.04, 10, { x, y: -0.15, z, color: 0x3a3a40 }));
    }
    G(K, H.cyl(0.4, 0.3, 0.1, 8, { y: -p.thick - 0.05, color: COL.cyan }));
    N(K, H.part(new THREE.TorusGeometry(p.r - 0.15, 0.05, 3, 10), { rx: Math.PI / 2, y: 0.02, color: COL.cyan }));
  },
  'eg-vent'(K, p, th, rng, H) {
    body(K, p, H, COL.steelDk);
    for (const f of H.faces(p.w, p.d)) for (let y = -0.6; y > -p.thick + 0.5; y -= 0.45) panel(K, H, f, 0, y, f.width - 0.6, 0.12, COL.steel, 'flat', 0.04);
    F(K, H.box(p.w - 0.4, 0.05, p.d - 0.4, { y: 0.0, color: 0x3a3a40 }));
    G(K, H.cyl(p.w * 0.3, p.w * 0.3, 0.04, 10, { y: 0.03, color: 0xff8a3a }));
  },
  'eg-cooling'(K, p, th, rng, H) { // a hyperboloid cooling tower, its fan deck on top
    const pts = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, y = -p.thick + t * p.thick, r = p.r * (1 - 0.28 * Math.sin(t * Math.PI * 0.85)); pts.push(new THREE.Vector2(r, y)); }
    F(K, H.part(new THREE.LatheGeometry(pts, H.seg(16, 10)), { color: 0xd8d0c0 }));
    F(K, H.cyl(p.r * 0.92, p.r * 0.92, 0.3, H.seg(16, 10), { y: -0.15, color: COL.steelDk }));
    cap(K, p, H, 0x5a5a60, null, 0, H.seg(16, 10));
    for (let k = 0; k < 3; k++) F(K, H.box(p.r * 1.7, 0.08, 0.35, { y: 0.06, ry: (k / 3) * Math.PI, color: COL.steel }));
    G(K, H.cyl(p.r * 0.25, p.r * 0.25, 0.05, 8, { y: 0.1, color: 0xff7a3a }));
    for (let y = -2; y > -p.thick; y -= 4) N(K, H.cyl(p.r * (1 - 0.28 * Math.sin((1 + y / p.thick) * Math.PI * 0.85)) + 0.05, p.r * (1 - 0.28 * Math.sin((1 + y / p.thick) * Math.PI * 0.85)) + 0.05, 0.1, H.seg(16, 10), { y, color: (p.tint >= 0 ? p.tint : 0) % 2 ? COL.cyan : COL.magenta }));
  },
};

// ------------------------------------------------------------------ the pyramid's courses
// A casing course: only its exposed band (the riser above the course below) is drawn: limestone
// blocks of varying shade, an LED strip at the lip, server bays and vent grilles in some risers.
function course(K, p, th, rng, H) {
  const k = p.tint >= 0 ? p.tint : 0, rise = 2.5, queen = k >= 20;
  F(K, H.box(p.w - 0.1, 0.08, p.d - 0.1, { y: -0.04, color: queen ? 0xe0c898 : 0xe4d0a4 }));
  for (const f of H.faces(p.w, p.d)) {
    const n = Math.max(1, Math.round(f.width / 4)), bw = f.width / n;
    for (let i = 0; i < n; i++) {
      const off = -f.width / 2 + (i + 0.5) * bw, c = mix(0xf0e2c0, COL.limeDk, rng() * 0.35);
      F(K, H.box(f.tx ? bw - 0.06 : 0.3, rise - 0.06, f.tz ? bw - 0.06 : 0.3, { x: f.nx * (f.half - 0.15) + f.tx * off, y: -rise / 2, z: f.nz * (f.half - 0.15) + f.tz * off, color: c }));
    }
    if (queen) continue;
    N(K, H.box(f.tx ? f.width : 0.06, 0.07, f.tz ? f.width : 0.06, { x: f.nx * (f.half + 0.02), y: -0.12, z: f.nz * (f.half + 0.02), color: k % 3 === 2 ? COL.gold : COL.cyan }));
    // server bays (racks glowing behind glass) and vent grilles, here and there
    for (let i = 0; i < n; i++) {
      const r = rng(), off = -f.width / 2 + (i + 0.5) * bw;
      if (r < 0.06) {
        panel(K, H, f, off, -rise / 2, 2.6, 1.7, 0x1a2438, 'flat', 0.03);
        for (let j = 0; j < 4; j++) panel(K, H, f, off - 0.9 + j * 0.6, -rise / 2, 0.36, 1.4, j % 2 ? 0x2bff9a : COL.cyan, 'glow', 0.05);
      } else if (r < 0.1) {
        panel(K, H, f, off, -rise / 2, 2.4, 1.5, 0x6a6458, 'flat', 0.03);
        for (let j = 0; j < 5; j++) panel(K, H, f, off, -rise / 2 - 0.6 + j * 0.3, 2.2, 0.08, 0x8a8a90, 'flat', 0.05);
      }
    }
  }
}

// ------------------------------------------------------------------ Khufu's solar barque (a hover barge)
function barque(K, p, th, rng, H) {
  const hd = p.d / 2;
  F(K, H.box(p.w, p.thick, p.d - 3, { y: -p.thick / 2, color: 0x9a6a3a }));
  for (const s of [-1, 1]) { // the papyrus-bundle prow and stern curling up
    F(K, H.part(new THREE.CylinderGeometry(0.05, p.w / 2, 2.0, 6), { y: -p.thick / 2, z: s * (hd - 1.0), rx: s * Math.PI / 2, sz: 0.6, color: 0x9a6a3a }));
    for (let k = 0; k < 6; k++) { const t = k / 5; F(K, H.box(0.5 - t * 0.25, 0.5, 0.5, { y: -0.2 + t * 2.6, z: s * (hd - 0.4 + t * 0.4 - t * t * 1.2), rx: s * t * 0.8, color: k % 2 ? COL.goldDk : 0xb88a4a })); }
  }
  F(K, H.box(p.w - 0.2, 0.05, p.d - 3.2, { y: -0.02, color: 0xb8864a }));
  for (const sx of [-1, 1]) for (let z = -hd + 3; z <= hd - 3; z += 3) F(K, H.box(0.08, 2.3, 0.08, { x: sx * (p.w / 2 - 0.15), y: 1.15, z, color: COL.woodDk }));
  F(K, H.box(p.w, 0.08, p.d - 6, { y: 2.35, color: COL.white }), H.box(p.w + 0.1, 0.1, 0.1, { y: 2.3, z: -(hd - 3), color: COL.gold }), H.box(p.w + 0.1, 0.1, 0.1, { y: 2.3, z: hd - 3, color: COL.gold }));
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) F(K, strut(H, [sx * p.w / 2, -0.3, -hd + 3 + k * 2], [sx * (p.w / 2 + 2.2), -1.4, -hd + 2 + k * 2], 0.1, COL.wood)); // oars
  N(K, H.box(p.w + 0.06, 0.08, p.d - 3, { y: -p.thick + 0.15, color: COL.cyan }));
  jets(K, H, [[0, -hd + 3], [0, 0], [0, hd - 3]], -p.thick - 0.03, 0.5);
}

// ------------------------------------------------------------------ the Sphinx (tint: 0 rump, 1 back, 2 chest, 3 forelegs)
function sphinxBody(K, p, th, rng, H) {
  const t = p.tint >= 0 ? p.tint : 0;
  body(K, p, H, COL.sand);
  for (let y = -1.6, k = 0; y > -p.thick; y -= 1.6, k++) F(K, H.box(p.w + 0.06, 0.3, p.d + 0.06, { y, color: k % 2 ? mix(COL.sand, COL.sandDk, 0.6) : mix(COL.sand, COL.sandDk, 0.3) })); // the rock's strata
  cap(K, p, H, COL.sandLt);
  if (t <= 2 && p.thick > 6) for (const sz of [-1, 1]) F(K, H.part(new THREE.CylinderGeometry(1.4, 1.4, p.w, 6, 1, false, 0, Math.PI), { y: -1.4, z: sz * (p.d / 2 - 0.2), rz: Math.PI / 2, ry: sz > 0 ? Math.PI : 0, color: COL.sand })); // rounded flanks
  if (t === 0) { // the rump: haunches and the tail curled along the right flank
    for (const sz of [-1, 1]) F(K, H.part(new THREE.SphereGeometry(1, 8, 5), { x: -1, y: -p.thick * 0.55, z: sz * (p.d / 2 - 0.6), sx: p.w * 0.45, sy: p.thick * 0.42, sz: 1.6, color: COL.sand }));
    for (let k = 0; k < 8; k++) F(K, H.box(1.4, 0.45, 0.45, { x: -p.w / 2 + 1 + k * 1.4, y: -p.thick + 0.6 + Math.sin(k * 0.6) * 0.4, z: p.d / 2 + 0.25, color: COL.sandDk }));
  }
  if (t === 1) for (let x = -p.w / 2 + 4; x < p.w / 2 - 2; x += 6) N(K, H.box(0.08, 0.06, p.d * 0.6, { x, y: 0.02, color: COL.cyan })); // data seams on its back
  if (t === 2) { // the chest: the broad collar, gold and lapis, threaded with circuits
    const f = H.faces(p.w, p.d)[2];
    for (let k = 0; k < 5; k++) panel(K, H, f, 0, -1.4 - k * 0.7, p.d * (0.95 - k * 0.12), 0.6, k % 2 ? COL.lapis : COL.gold, 'flat', 0.06);
    for (let k = 0; k < 4; k++) panel(K, H, f, (k - 1.5) * 3, -3.3, 0.12, 2.8, COL.cyan, 'neon', 0.1);
  }
}
function sphinxHead(K, p, th, rng, H) { // the face looks east (+x): kohl eyes behind a cyan visor band, the uraeus
  F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.sand }));
  for (let y = -0.4, k = 0; y > -p.thick + 2; y -= 0.6, k++) { // the nemes, striped, over the top, sides and back
    F(K, H.box(p.w - 1.4, 0.6, p.d + 0.3, { x: -0.7, y: y - 0.3, color: k % 2 ? COL.lapis : COL.gold }));
  }
  F(K, H.box(p.w - 1.4, 0.3, p.d + 0.32, { x: -0.7, y: -0.15, color: COL.gold }));
  F(K, H.box(1.6, p.thick - 1.2, p.d - 2.6, { x: p.w / 2 - 0.55, y: -p.thick / 2 - 0.4, color: mix(COL.sand, 0xffffff, 0.08) })); // the face
  for (const sz of [-1, 1]) {
    F(K, H.box(0.2, 0.6, 1.4, { x: p.w / 2 + 0.3, y: -3.0, z: sz * 1.6, color: COL.dark })); // eyes
    F(K, H.box(0.25, 0.14, 2.0, { x: p.w / 2 + 0.32, y: -2.45, z: sz * 1.6, color: COL.lapisDk })); // brows
  }
  N(K, H.box(0.1, 0.35, p.d - 2.2, { x: p.w / 2 + 0.45, y: -3.0, color: COL.cyan })); // the visor band
  F(K, H.box(0.9, 1.8, 0.8, { x: p.w / 2 + 0.5, y: -4.4, color: COL.sandDk })); // the nose
  F(K, H.box(0.3, 0.3, 2.0, { x: p.w / 2 + 0.3, y: -5.8, color: 0x8a5a3a })); // the mouth
  F(K, H.box(0.8, 1.2, 0.9, { x: p.w / 2 + 0.2, y: -7.2, color: COL.sandDk })); // the beard's root
  F(K, H.box(0.5, 0.9, 0.5, { x: p.w / 2 - 0.2, y: -0.9, color: COL.gold }), H.box(0.6, 0.35, 0.8, { x: p.w / 2 - 0.1, y: -0.35, color: COL.gold })); // the uraeus
  G(K, H.box(0.12, 0.16, 0.16, { x: p.w / 2 + 0.1, y: -0.4, color: COL.cyan }));
  cap(K, p, H, COL.gold);
}
