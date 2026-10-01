// NEO EURO: platform styles. Each builds a platform's look into Kit K in its local frame (y = 0 is the
// top you stand on, the footprint is p.w × p.d or radius p.r, solid down to -p.thick). Flat-shaded
// vertex colours, a few neon accents; walkable tops stay clear (dressing sits on the edges).
import * as THREE from 'three';

// ------------------------------------------------------------------ palette
export const COL = {
  marble: 0xf0eee6, marbleSh: 0xd6d2c6, marbleDk: 0xb8b4aa, stripe: 0xaab0b6, lead: 0x8a949c, leadDk: 0x5e666e,
  terracotta: 0xc8643c, terraDk: 0x9a4a2c, roof: 0xb85a3a, ochre: 0xe0a848, gold: 0xe8b830, bronze: 0xa8743a,
  lawn: 0x5aa83a, lawnDk: 0x4a9030, gravel: 0xe8e0cc, stone: 0xc8b08a, stoneDk: 0x9a8668, dark: 0x2a2630, shadow: 0x3c3640,
  brick: 0xa8503a, brickDk: 0x7a3628, istrian: 0xf2eee2, trachyte: 0x7e7a72, copper: 0x5a9a7a, lime: 0xf4f0e6,
  rock: 0xb4a488, rockDk: 0x8a7a64, scrub: 0x5a7a3a, sand: 0xd8b878, sandDk: 0xb89858, travertine: 0xdccca4, travDk: 0xa8987a,
  win: 0x2a2a36, warm: 0xffd890, cyan: 0x2be8ff, magenta: 0xff2bd6, red: 0xd8302a,
};
const PASTEL = [0xf2d18a, 0xf2a98a, 0xf0e6d2, 0xe88a6a, 0xa8d0e0, 0xf4c4c4, 0xd8e8b0, 0xfaf6ee];
const PALAZZO = [0xe0b070, 0xe8a090, 0xc8684a, 0xefe8da, 0xf0a070, 0xf0d890, 0xb84a3a, 0xe8b8b0];
const VESPA = [0x7fd8c0, 0xd8343c, 0xf0e8d0, 0x7ab8f0, 0xf0c830, 0xf09ac0, 0x9ad070, 0xff8a3a];

// ------------------------------------------------------------------ helpers
const F = (K, ...g) => K.add('flat', ...g);
const G = (K, ...g) => K.add('glow', ...g);
const N = (K, ...g) => K.add('neon', ...g);

// The block body: a box (rect) or a cylinder (disc) from the top down to -thick.
function body(K, p, H, col, o = {}) {
  const t = o.thick ?? p.thick, y = (o.y0 ?? 0) - t / 2;
  if (p.kind === 'disc') F(K, H.cyl(p.r + (o.grow || 0), p.r + (o.grow || 0), t, o.seg || H.seg(28, 16), { y, color: col }));
  else F(K, H.box(p.w + (o.grow || 0) * 2, t, p.d + (o.grow || 0) * 2, { y, color: col }));
}
// A thin top surface (a different colour from the sides) and an optional rim band just under it.
function cap(K, p, H, col, rim = null, rimH = 0.25) {
  if (p.kind === 'disc') F(K, H.cyl(p.r + 0.02, p.r + 0.02, 0.06, H.seg(28, 16), { y: -0.03, color: col }));
  else F(K, H.box(p.w + 0.04, 0.06, p.d + 0.04, { y: -0.03, color: col }));
  if (rim !== null) {
    if (p.kind === 'disc') F(K, H.cyl(p.r + 0.12, p.r + 0.12, rimH, H.seg(28, 16), { y: -0.06 - rimH / 2, color: rim }));
    else F(K, H.box(p.w + 0.24, rimH, p.d + 0.24, { y: -0.06 - rimH / 2, color: rim }));
  }
}
// Horizontal bands round a block (Pisan marble stripes, strata): every `step` m from y0 down to y1.
function bands(K, p, H, y0, y1, step, col, h = 0.18, grow = 0.03) {
  for (let y = y0; y > y1; y -= step) {
    if (p.kind === 'disc') F(K, H.cyl(p.r + grow, p.r + grow, h, H.seg(28, 16), { y, color: col }));
    else F(K, H.box(p.w + grow * 2, h, p.d + grow * 2, { y, color: col }));
  }
}
// An arch-headed opening on a face, drawn as a dark slab with a round top (a window, a blind arch, a door).
function arch(K, H, f, off, yBot, w, h, col, out = 0.04, key = 'flat') {
  const x = f.nx * (f.half + out) + f.tx * off, z = f.nz * (f.half + out) + f.tz * off;
  const rect = H.box(f.tx ? w : 0.08, h - w / 2, f.tz ? w : 0.08, { x, y: yBot + (h - w / 2) / 2, z, color: col });
  const top = H.cyl(w / 2, w / 2, 0.08, 8, { x, y: yBot + h - w / 2, z, rx: f.tz ? 0 : Math.PI / 2, rz: f.tz ? Math.PI / 2 : 0, color: col });
  K.add(key, rect, top);
}
// A row of arches along every face in `which` (indices into H.faces: 0 = -z, 1 = +z, 2 = +x, 3 = -x).
function arcade(K, p, H, which, yBot, h, spacing, col, o = {}) {
  const fs = H.faces(p.w, p.d);
  for (const i of which) {
    const f = fs[i], n = Math.max(1, Math.floor((f.width - (o.pad ?? 1)) / spacing));
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * spacing;
      arch(K, H, f, off, yBot, o.w ?? spacing * 0.55, h, col, o.out ?? 0.04, o.key || 'flat');
      if (o.pilaster != null) F(K, H.box(f.tx ? 0.3 : 0.2, h + 0.4, f.tz ? 0.3 : 0.2, { x: f.nx * (f.half + 0.08) + f.tx * (off + spacing / 2), y: yBot + h / 2, z: f.nz * (f.half + 0.08) + f.tz * (off + spacing / 2), color: o.pilaster }));
    }
  }
}
// Columns round a disc at radius rr, from yBot to yTop.
function colonnade(K, H, rr, n, yBot, yTop, cr, col) {
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    F(K, H.cyl(cr, cr, yTop - yBot, 5, { x: Math.cos(a) * rr, y: (yTop + yBot) / 2, z: Math.sin(a) * rr, color: col }));
  }
}
// Dark arch recesses round a disc at radius rr (n of them), each w wide and h tall from yBot.
function ringArches(K, H, rr, n, yBot, h, w, col, key = 'flat') {
  for (let k = 0; k < n; k++) {
    const a = ((k + 0.5) / n) * Math.PI * 2, x = Math.cos(a) * rr, z = Math.sin(a) * rr, ry = -a + Math.PI / 2;
    K.add(key, H.box(w, h - w / 2, 0.1, { x, y: yBot + (h - w / 2) / 2, z, ry, color: col }));
    K.add(key, H.cyl(w / 2, w / 2, 0.1, 8, { x, y: yBot + h - w / 2, z, rz: Math.PI / 2, ry: Math.PI - a, color: col })); // (Rz first: the disc faces outward)
  }
}
// Shear every geometry added to K so far by (sx, sz) per metre of height (the Leaning Tower).
function shearKit(K, sx, sz) {
  const m = new THREE.Matrix4().set(1, sx, 0, 0, 0, 1, 0, 0, 0, sz, 1, 0, 0, 0, 0, 1);
  for (const key in K.parts) for (const g of K.parts[key]) g.applyMatrix4(m);
}
// Merlons (crenellations) along the long edges of a rect top.
function merlons(K, p, H, col, edges = [0, 1, 2, 3], size = 0.7, gap = 1.4, h = 0.9) {
  const fs = H.faces(p.w, p.d);
  for (const i of edges) {
    const f = fs[i], n = Math.floor(f.width / gap);
    for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * (f.width / n);
      F(K, H.box(f.tx ? size : 0.4, h, f.tz ? size : 0.4, { x: f.nx * (f.half - 0.2) + f.tx * off, y: h / 2, z: f.nz * (f.half - 0.2) + f.tz * off, color: col }));
    }
  }
}
// Little hover jets under a floating stepping stone (unlit discs, cyan).
function jets(K, H, pts, y, r = 0.32, col = COL.cyan) { for (const [x, z] of pts) G(K, H.cyl(r, r * 0.8, 0.08, 8, { x, y, z, color: col })); }

// ------------------------------------------------------------------ the styles
export const STYLES = {
  // ---- generic
  steps(K, p, th, rng, H) { body(K, p, H, COL.marbleSh); cap(K, p, H, COL.marble); },

  // ---- PISA
  euroStreet(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 6, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: 0xc8b49a });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
  },
  lawn(K, p, th, rng, H) {
    body(K, p, H, COL.stone, { thick: p.thick });
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: COL.lawn }));
    // mown stripes, then gravel paths: the south gate to the Duomo, a ring round the buildings
    for (let x = -p.w / 2 + 6; x < p.w / 2; x += 12) F(K, H.box(6, 0.02, p.d - 1, { x, y: 0.005, color: COL.lawnDk }));
    const path = (x, z, w, d) => F(K, H.box(w, 0.04, d, { x, y: 0.01, z, color: COL.gravel }));
    path(0, 40, 6, 40); path(-20, 18, 120, 5); path(-74, -16, 5, 70); path(30, -2, 5, 30); path(-12, -46, 110, 5);
    // a white kerb round the lawn
    for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width : 0.6, 0.3, f.tz ? f.width : 0.6, { x: f.nx * (f.half - 0.3), y: 0.0, z: f.nz * (f.half - 0.3), color: COL.marble }));
  },
  cityWall(K, p, th, rng, H) {
    body(K, p, H, COL.stone);
    bands(K, p, H, -2, -p.thick, 2.2, COL.stoneDk, 0.12);
    cap(K, p, H, 0xb09878);
    const long = p.w > p.d ? [0, 1] : [2, 3];
    merlons(K, p, H, COL.stone, long);
    const fs = H.faces(p.w, p.d);
    for (const i of long) { const f = fs[i]; for (let o = -f.width / 2 + 4; o < f.width / 2 - 2; o += 7) F(K, H.box(f.tx ? 0.3 : 0.1, 1.4, f.tz ? 0.3 : 0.1, { x: f.nx * (f.half + 0.03) + f.tx * o, y: -4, z: f.nz * (f.half + 0.03) + f.tz * o, color: COL.dark })); }
  },
  wallTower(K, p, th, rng, H) {
    body(K, p, H, 0xc0a682);
    bands(K, p, H, -3, -p.thick, 3, COL.stoneDk, 0.14);
    cap(K, p, H, 0xa89070, COL.stoneDk, 0.4);
    merlons(K, p, H, 0xc0a682, [0, 1, 2, 3], 0.8, 1.6, 1.0);
    for (const f of H.faces(p.w, p.d)) arch(K, H, f, 0, -7, 1.0, 2.2, COL.dark);
    G(K, H.box(0.3, 0.3, 0.3, { x: p.w / 2 - 0.4, y: 1.4, z: p.d / 2 - 0.4, color: 0xff3a2a }));
  },
  vespa(K, p, th, rng, H) {
    const c = VESPA[(p.tint >= 0 ? p.tint : 0) % VESPA.length], hw = p.w / 2, hd = p.d / 2;
    F(K, H.box(p.w, 0.12, p.d - 0.3, { y: -0.06, color: 0xd8d0c0 })); // the footboard you land on
    F(K, H.box(p.w - 0.2, 0.62, p.d - 0.6, { y: -0.43, color: c })); // the body
    for (const sx of [-1, 1]) F(K, H.box(0.5, 0.55, 1.5, { x: sx * (hw - 0.15), y: -0.45, z: hd - 1.0, color: c })); // the round rear cowls
    F(K, H.box(p.w - 0.4, 0.3, 0.3, { y: 0.15, z: -hd + 0.2, color: c })); // the leg shield's lip at the nose
    F(K, H.box(1.4, 0.08, 0.1, { y: 0.42, z: -hd + 0.25, color: 0xc8ccd4 })); // handlebar
    G(K, H.cyl(0.22, 0.22, 0.1, 8, { y: 0.1, z: -hd - 0.02, rx: Math.PI / 2, color: 0xfff4c0 })); // headlight
    G(K, H.box(0.5, 0.12, 0.06, { y: -0.3, z: hd - 0.02, color: 0xff2a3a })); // tail light
    N(K, H.box(p.w + 0.02, 0.06, 0.06, { y: -0.12, z: hd - 0.4, color: COL.cyan }), H.box(0.06, 0.06, p.d - 0.8, { x: hw - 0.02, y: -0.12, color: COL.magenta }), H.box(0.06, 0.06, p.d - 0.8, { x: -hw + 0.02, y: -0.12, color: COL.magenta }));
    F(K, H.box(p.w - 0.6, 0.2, p.d - 1.2, { y: -0.85, color: 0x3a3c46 }));
    jets(K, H, [[-0.6, -1], [0.6, -1], [-0.6, 1], [0.6, 1]], -0.97);
  },
  baptistery(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -1, -p.thick + 0.5, 1.1, COL.stripe, 0.12);
    ringArches(K, H, p.r + 0.02, 20, -p.thick + 0.4, 6.5, 1.4, 0x6a6a70); // blind arcade
    colonnade(K, H, p.r + 0.15, 40, -4.2, -1.0, 0.1, COL.marble); // the loggia
    F(K, H.cyl(p.r + 0.25, p.r + 0.25, 0.4, H.seg(32, 18), { y: -0.8, color: COL.marbleSh }));
    F(K, H.cyl(p.r - 1.5, p.r - 1.5, 3.4, H.seg(32, 18), { y: -2.6, color: 0x5a5a62 }));
    cap(K, p, H, COL.lead);
    G(K, H.box(1.6, 3, 0.1, { y: -p.thick + 1.5, z: p.r + 0.1, color: 0x6a4a2a }));
  },
  baptisteryUpper(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -0.6, -p.thick, 0.9, COL.stripe, 0.1);
    for (let k = 0; k < 12; k++) { // gothic gables round the rim (low, so the walk round stays clear)
      const a = (k / 12) * Math.PI * 2, x = Math.cos(a) * (p.r + 0.1), z = Math.sin(a) * (p.r + 0.1);
      F(K, H.part(new THREE.ConeGeometry(0.9, 1.8, 3), { x, y: -1.2, z, ry: -a, color: COL.marbleSh }));
      F(K, H.part(new THREE.ConeGeometry(0.14, 1.1, 4), { x: Math.cos(a + 0.26) * (p.r - 0.1), y: 0.5, z: Math.sin(a + 0.26) * (p.r - 0.1), color: COL.marble }));
    }
    cap(K, p, H, COL.lead);
  },
  dome(K, p, th, rng, H) { // a step of a dome: lead and terracotta ribs (0: the Baptistery, 1: the Duomo)
    const base = p.tint === 1 ? COL.lead : COL.terracotta, rib = p.tint === 1 ? COL.marble : COL.lead;
    body(K, p, H, base, { seg: H.seg(24, 14) });
    F(K, H.part(new THREE.TorusGeometry(p.r - 0.12, 0.22, 4, H.seg(24, 14)), { rx: Math.PI / 2, y: -0.12, color: base }));
    const n = p.r > 4 ? 12 : 8;
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; F(K, H.box(0.3, p.thick, 0.3, { x: Math.cos(a) * (p.r + 0.04), y: -p.thick / 2, z: Math.sin(a) * (p.r + 0.04), ry: -a, color: rib })); }
    cap(K, p, H, p.tint === 1 ? 0x9aa4ac : 0xd07848);
  },
  lantern(K, p, th, rng, H) {
    body(K, p, H, COL.marble, { seg: 10 });
    colonnade(K, H, p.r + 0.08, 8, -p.thick + 0.2, -0.3, 0.08, COL.marbleSh);
    F(K, H.cyl(p.r + 0.2, p.r + 0.2, 0.2, 10, { y: -0.1, color: COL.gold }));
    G(K, H.cyl(p.r - 0.4, p.r - 0.4, p.thick - 0.6, 10, { y: -p.thick / 2, color: 0xffe0a0 }));
  },
  duomo(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -0.9, -p.thick, 1.0, COL.stripe, 0.1);
    arcade(K, p, H, [0, 1], -p.thick + 0.6, 7, 3.2, 0x8a8c90, { pilaster: COL.marble });
    arcade(K, p, H, [0, 1], -6.2, 3.4, 1.6, 0x5a5c64, { w: 0.8 });
    F(K, H.box(p.w + 0.5, 0.5, p.d + 0.5, { y: -0.35, color: COL.marbleSh }));
    cap(K, p, H, COL.lead);
    N(K, H.box(p.w + 0.6, 0.08, 0.08, { y: -0.62, z: p.d / 2 + 0.27, color: COL.cyan }), H.box(p.w + 0.6, 0.08, 0.08, { y: -0.62, z: -p.d / 2 - 0.27, color: COL.cyan }));
  },
  duomoAisle(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -0.8, -p.thick, 1.0, COL.stripe, 0.1);
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 0.6, 6.2, 3.0, 0x8a8c90, { pilaster: COL.marble });
    F(K, H.box(p.w + 0.4, 0.4, p.d + 0.4, { y: -0.3, color: COL.marbleSh }));
    cap(K, p, H, COL.lead);
  },
  transept(K, p, th, rng, H) { STYLES.duomoAisle(K, p, th, rng, H); arcade(K, p, H, [0, 1], -5.5, 3, 1.6, 0x5a5c64, { w: 0.8 }); },
  duomoFacade(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -0.7, -p.thick, 1.0, COL.stripe, 0.1);
    const fs = H.faces(p.w, p.d), west = fs[3], east = fs[2];
    for (let k = 0; k < 7; k++) arch(K, H, west, (k - 3) * 3.6, -p.thick + 0.6, 2.6, 8.5, 0x7a7c80); // the blind arches below
    for (const k of [-1, 0, 1]) arch(K, H, west, k * 7.2, -p.thick + 0.6, 2.2, 5.2, COL.bronze, 0.08); // three bronze doors
    for (let tier = 0; tier < 4; tier++) { // four tiers of little open galleries
      const y = -p.thick + 10.5 + tier * 2.5, n = tier < 2 ? 16 : tier === 2 ? 10 : 6;
      F(K, H.box(0.5, 0.25, p.d * (1 - tier * 0.2), { x: -p.w / 2 - 0.25, y: y - 0.1, color: COL.marbleSh }));
      for (let k = 0; k < n; k++) arch(K, H, west, (k - (n - 1) / 2) * (p.d * (1 - tier * 0.2) / n), y, 0.7, 2.0, 0x4a4a52, 0.3);
    }
    for (const k of [-1, 1]) F(K, H.part(new THREE.ConeGeometry(0.4, 1.6, 4), { x: -p.w / 2 + 0.6, y: 0.8, z: k * (p.d / 2 - 0.5), color: COL.marble }));
    F(K, H.box(0.6, 2.4, 0.5, { x: -p.w / 2 + 0.6, y: 1.2, color: COL.gold })); // the Madonna on the gable
    for (let k = 0; k < 4; k++) arch(K, H, east, (k - 1.5) * 5, -p.thick + 12, 1.2, 3, 0x5a5c64);
    cap(K, p, H, COL.lead);
  },
  domeDrum(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -0.5, -p.thick, 0.8, COL.stripe, 0.08);
    ringArches(K, H, p.r + 0.03, 16, -p.thick + 0.8, 2.2, 0.8, 0x3a3c44);
    F(K, H.cyl(p.r + 0.2, p.r + 0.2, 0.3, H.seg(28, 16), { y: -0.2, color: COL.marbleSh }));
    cap(K, p, H, COL.lead);
  },
  apse(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    bands(K, p, H, -0.9, -p.thick, 1.0, COL.stripe, 0.1);
    ringArches(K, H, p.r + 0.03, 14, -p.thick + 0.6, 7, 2.2, 0x8a8c90);
    colonnade(K, H, p.r + 0.15, 28, -3.6, -0.8, 0.09, COL.marble);
    F(K, H.cyl(p.r + 0.25, p.r + 0.25, 0.4, H.seg(28, 16), { y: -0.6, color: COL.marbleSh }));
    cap(K, p, H, COL.lead);
  },
  camposanto(K, p, th, rng, H) {
    body(K, p, H, COL.marble);
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 0.5, 7.2, 2.2, 0x9a9ca0, { pilaster: COL.marbleSh });
    F(K, H.box(p.w + 0.4, 0.5, p.d + 0.4, { y: -0.4, color: COL.marbleSh }));
    cap(K, p, H, COL.lead);
    // the gothic tabernacle over the south door
    F(K, H.box(4, 3, 1.2, { y: -p.thick + 6.5, z: p.d / 2 + 0.6, color: COL.marble }), H.part(new THREE.ConeGeometry(2.4, 2, 4), { y: -p.thick + 9, z: p.d / 2 + 0.6, ry: Math.PI / 4, color: COL.marbleSh }));
    arch(K, H, H.faces(p.w, p.d)[1], 0, -p.thick + 0.3, 2, 4.6, COL.bronze, 0.7);
  },
  pisa(K, p, th, rng, H) { // a storey of the Leaning Tower: an open gallery of columns round a shadowed core
    const r = p.r, t = p.thick, base = t > 6;
    if (base) { // the ground storey: a tall blind arcade, engaged columns
      F(K, H.cyl(r, r, t, H.seg(32, 18), { y: -t / 2, color: COL.marble }));
      ringArches(K, H, r + 0.02, 15, -t + 0.6, t - 2.2, 2.4, 0x9a9890);
      colonnade(K, H, r + 0.12, 15, -t, -1.2, 0.18, COL.marble);
      G(K, H.box(1.6, 3.2, 0.1, { y: -t + 1.6, z: r + 0.12, color: 0x6a4a2a }));
    } else {
      F(K, H.cyl(r - 1.0, r - 1.0, t, H.seg(28, 16), { y: -t / 2, color: 0x7a786e })); // the core in shadow
      ringArches(K, H, r - 0.95, 30, -t + 0.4, t - 1.4, 0.8, 0x3c3a40); // doors and windows on the core
      colonnade(K, H, r - 0.3, H.seg(30, 20), -t + 0.25, -0.95, 0.15, COL.marble);
      F(K, H.part(new THREE.TorusGeometry(r - 0.3, 0.32, 4, H.seg(30, 20)), { rx: Math.PI / 2, y: -1.0, color: COL.marble })); // the arches' band
      F(K, H.cyl(r - 0.05, r - 0.05, 0.25, H.seg(30, 20), { y: -t + 0.12, color: COL.marbleSh })); // plinth
    }
    F(K, H.cyl(r + 0.18, r + 0.18, 0.5, H.seg(32, 18), { y: -0.3, color: COL.marbleSh })); // the gallery floor's cornice
    F(K, H.cyl(r + 0.05, r + 0.05, 0.1, H.seg(32, 18), { y: -0.6, color: COL.stripe }));
    cap(K, p, H, COL.marble);
    N(K, H.part(new THREE.TorusGeometry(r + 0.2, 0.05, 3, H.seg(32, 18)), { rx: Math.PI / 2, y: -0.56, color: COL.cyan }));
    if (!base && p.tint > 1000) { const a = (Math.floor(p.tint / 1000) * Math.PI) / 180, s = (p.tint % 1000) / 100; shearKit(K, Math.cos(a) * s, Math.sin(a) * s); }
  },
  pisaBelfry(K, p, th, rng, H) {
    const r = p.r, t = p.thick;
    F(K, H.cyl(r, r, t, H.seg(24, 14), { y: -t / 2, color: COL.marble }));
    ringArches(K, H, r + 0.03, 6, -t + 0.5, 3.2, 1.8, 0x2e2c34); // the bell openings
    for (let k = 0; k < 6; k++) { const a = ((k + 0.5) / 6) * Math.PI * 2; G(K, H.part(new THREE.ConeGeometry(0.6, 0.9, 6), { x: Math.cos(a) * (r - 0.6), y: -t + 2.2, z: Math.sin(a) * (r - 0.6), color: 0xd8a040 })); }
    F(K, H.cyl(r + 0.25, r + 0.25, 0.45, H.seg(24, 14), { y: -0.25, color: COL.marbleSh }));
    cap(K, p, H, COL.marble);
    N(K, H.part(new THREE.TorusGeometry(r + 0.28, 0.07, 3, H.seg(24, 14)), { rx: Math.PI / 2, y: -0.5, color: COL.magenta }));
    if (p.tint > 1000) { const a = (Math.floor(p.tint / 1000) * Math.PI) / 180, s = (p.tint % 1000) / 100; shearKit(K, Math.cos(a) * s, Math.sin(a) * s); }
  },
  pisaLedge(K, p, th, rng, H) { // a marble balcony on a bracket, its rail on the outer edge
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.marbleSh }));
    cap(K, p, H, COL.marble);
    F(K, H.box(p.w * 0.6, 1.2, 0.5, { y: -p.thick - 0.5, z: p.d / 2 - 0.4, rx: -0.6, color: COL.marbleDk })); // the bracket
    for (let k = -2; k <= 2; k++) F(K, H.box(0.12, 0.7, 0.12, { x: k * (p.w / 5), y: 0.35, z: -p.d / 2 + 0.1, color: COL.marble }));
    F(K, H.box(p.w, 0.1, 0.18, { y: 0.72, z: -p.d / 2 + 0.1, color: COL.marble }));
    N(K, H.box(p.w, 0.06, 0.06, { y: -p.thick + 0.05, z: -p.d / 2 - 0.02, color: COL.cyan }));
  },
  kiosk(K, p, th, rng, H) {
    const c = [0xd8302a, 0x2a6ab8, 0x3a9a4a][(p.tint >= 0 ? p.tint : 0) % 3];
    F(K, H.box(p.w - 0.4, p.thick, p.d - 0.4, { y: -p.thick / 2, color: 0xf0ece0 }));
    for (let k = 0; k < 6; k++) F(K, H.box(p.w / 6, 0.12, p.d, { x: -p.w / 2 + (k + 0.5) * (p.w / 6), y: -0.06, color: k % 2 ? 0xffffff : c })); // the striped awning roof
    G(K, H.box(p.w - 1, 0.5, 0.06, { y: -1.0, z: p.d / 2 - 0.15, color: 0xffd23a }));
    for (let k = 0; k < 5; k++) F(K, H.cyl(0.12, 0.12, 0.6, 5, { x: -1.5 + k * 0.75, y: -1.9, z: p.d / 2 - 0.1, rz: 0.15, color: COL.marble })); // little leaning towers for sale
  },
  fountain(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r + 0.2, p.thick, 16, { y: -p.thick / 2, color: COL.marble }));
    G(K, H.cyl(p.r - 0.4, p.r - 0.4, 0.06, 16, { y: -0.02, color: 0x6ad8ff }));
    F(K, H.part(new THREE.TorusGeometry(p.r - 0.2, 0.2, 4, 16), { rx: Math.PI / 2, y: 0, color: COL.marbleSh }));
  },

  // ---- AMALFI
  molo(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 6, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: 0xd8ccb4 }); g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    for (const sx of [-1, 1]) for (let z = -p.d / 2 + 3; z < p.d / 2; z += 6) {
      F(K, H.cyl(0.22, 0.26, 0.5, 6, { x: sx * (p.w / 2 - 0.4), y: 0.25, z, color: 0x3a3a40 })); // bollards
      F(K, H.part(new THREE.TorusGeometry(0.45, 0.18, 4, 8), { x: sx * (p.w / 2 + 0.1), y: -1.2, z: z + 3, ry: Math.PI / 2, color: 0x1a1a1e })); // tyres
    }
    for (let z = -p.d / 2 + 6; z < p.d / 2; z += 12) { F(K, H.cyl(0.08, 0.08, 3.6, 5, { x: p.w / 2 - 0.4, y: 1.8, z, color: 0x2a3a4a })); G(K, H.box(0.4, 0.3, 0.4, { x: p.w / 2 - 0.4, y: 3.7, z, color: COL.warm })); }
  },
  marina(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 4, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: 0xe0cfa8 }); g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    F(K, H.box(p.w, 0.5, 0.5, { y: 0.25, z: p.d / 2 - 0.25, color: COL.lime })); // the sea wall's parapet
    for (let x = -p.w / 2 + 8; x < p.w / 2; x += 14) { // palms and lamps along the front
      F(K, H.cyl(0.18, 0.26, 6, 5, { x, y: 3, z: p.d / 2 - 1.4, rz: 0.08, color: 0x7a5a3a }));
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; F(K, H.box(2.4, 0.08, 0.5, { x: x + Math.cos(a) * 1.1 + 0.4, y: 5.9, z: p.d / 2 - 1.4 + Math.sin(a) * 1.1, ry: -a, rz: -0.35, color: 0x3a8a3a })); }
      G(K, H.box(0.35, 0.35, 0.35, { x: x + 7, y: 3.4, z: p.d / 2 - 0.6, color: COL.warm }));
      F(K, H.cyl(0.07, 0.07, 3.3, 5, { x: x + 7, y: 1.65, z: p.d / 2 - 0.6, color: 0x2a3a4a }));
    }
    for (let x = -p.w / 2 + 3; x < p.w / 2; x += 9) F(K, H.box(4, 0.04, 2, { x, y: 0.02, z: -p.d / 2 + 2, color: 0xd8b878 })); // café terraces' rugs
  },
  boat(K, p, th, rng, H) { // a gozzo: a wooden fishing boat, pointed at both ends
    const c = [0x2a6ab8, 0xd8302a, 0x2a9a6a, 0xf0c830, 0x2ab8d8, 0xe86a2a, 0x9a3ab8, 0xf0f0f0][(p.tint >= 0 ? p.tint : 0) % 8];
    const hw = p.w / 2, hd = p.d / 2, t = p.thick;
    F(K, H.box(p.w, t, p.d - 2, { y: -t / 2, color: 0xf4f0e6 }));
    for (const s of [-1, 1]) F(K, H.part(new THREE.ConeGeometry(hw, 1.6, 4), { z: s * (hd - 0.8), y: -t / 2, rx: s * Math.PI / 2, ry: Math.PI / 4, sx: 1, sz: t / p.w * 1.4, color: 0xf4f0e6 }));
    F(K, H.box(p.w + 0.06, 0.22, p.d - 2, { y: -0.2, color: c }));
    F(K, H.box(p.w - 0.3, 0.06, p.d - 2.2, { y: -0.03, color: 0xb88a5a })); // the deck
    for (const s of [-1, 1]) F(K, H.box(0.14, 0.7, 0.14, { y: 0.2, z: s * (hd - 0.4), color: c }));
  },
  waterTaxi(K, p, th, rng, H) {
    const hd = p.d / 2, t = p.thick;
    F(K, H.box(p.w, t, p.d - 1.4, { y: -t / 2, color: 0xf8f8f4 }));
    F(K, H.part(new THREE.ConeGeometry(p.w / 2, 1.8, 4), { z: -hd + 0.6, y: -t / 2, rx: -Math.PI / 2, ry: Math.PI / 4, sz: 0.6, color: 0xf8f8f4 }));
    F(K, H.box(p.w - 0.3, 0.06, p.d - 1.6, { y: -0.03, color: 0xa87848 }));
    F(K, H.box(p.w + 0.04, 0.2, p.d - 1.4, { y: -0.35, color: 0x1a5aa8 }));
    N(K, H.box(p.w + 0.06, 0.08, p.d - 1.4, { y: -0.55, color: COL.cyan }));
    F(K, H.box(p.w - 0.4, 0.5, 0.2, { y: 0.25, z: hd - 0.6, color: 0x2a2a30 }));
    G(K, H.box(0.3, 0.3, 0.3, { y: 1.0, z: hd - 0.4, color: 0xffd23a }));
    F(K, H.cyl(0.05, 0.05, 1.4, 4, { y: 0.4, z: hd - 0.4, color: 0xc8c8c8 }));
  },
  scalinata(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.marbleSh }));
    F(K, H.box(p.w, 0.08, p.d, { y: -0.04, color: COL.lime }));
    F(K, H.box(p.w + 0.1, 0.08, 0.08, { y: -0.36, z: p.d / 2, color: COL.marbleDk }));
    for (const s of [-1, 1]) F(K, H.box(0.5, 0.9, p.d + 0.02, { x: s * (p.w / 2 + 0.25), y: 0.1, color: COL.lime })); // the side walls
  },
  atrium(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0xd8d0bc }));
    for (let x = -p.w / 2 + 1; x < p.w / 2; x += 2) F(K, H.box(0.9, 0.02, p.d - 0.4, { x, y: 0.01, color: 0xc8bea8 }));
    arcade(K, p, H, [1], -p.thick + 0.4, 5, 4, 0xa89c88);
  },
  amalfiDuomo(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    const fs = H.faces(p.w, p.d), south = fs[1];
    for (let y = -p.thick + 9; y < -0.5; y += 1.2) F(K, H.box(p.w + 0.06, 0.6, 0.1, { y, z: p.d / 2 + 0.03, color: 0x4a5a4a })); // the striped facade
    for (let k = 0; k < 6; k++) arch(K, H, south, (k - 2.5) * 3.8, -p.thick + 8.1, 2.6, 6.2, 0x3a3238, 0.4); // the portico's pointed arches
    F(K, H.box(p.w, 0.5, 1.2, { y: -p.thick + 14.6, z: p.d / 2 + 0.5, color: COL.lime }));
    G(K, H.box(4, 2.2, 0.1, { y: -p.thick + 11.6, z: p.d / 2 + 0.45, color: 0xffc040 }));
    arcade(K, p, H, [2, 3], -p.thick + 9, 5, 4, 0x5a5048);
    cap(K, p, H, COL.roof, 0xe8e0d0, 0.3);
  },
  amalfiFacade(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    for (let y = -0.8; y > -p.thick; y -= 1.0) F(K, H.box(p.w + 0.06, 0.45, 0.1, { y, z: p.d / 2 + 0.03, color: 0x3a5a4a }));
    G(K, H.box(10, 3.2, 0.12, { y: -2.4, z: p.d / 2 + 0.1, color: 0xe8b830 })); // the gold mosaic
    G(K, H.box(4, 1.8, 0.14, { y: -2.4, z: p.d / 2 + 0.12, color: 0x2a6ae8 }));
    for (const s of [-1, 1]) F(K, H.part(new THREE.ConeGeometry(0.4, 1.4, 4), { x: s * (p.w / 2 - 0.4), y: 0.7, z: p.d / 2 - 0.4, color: COL.lime }));
    cap(K, p, H, 0xe0d8c8);
  },
  chiostro(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 0.5, 4.6, 1.6, 0x8a8478, { w: 1.0, pilaster: COL.lime });
    cap(K, p, H, COL.roof, COL.lime, 0.3);
  },
  amalfiCampanile(K, p, th, rng, H) {
    body(K, p, H, 0xd8c8a8);
    bands(K, p, H, -6, -p.thick, 6, 0xb8a888, 0.3);
    const fs = H.faces(p.w, p.d);
    for (const f of fs) {
      for (const y of [-9, -15, -21]) { arch(K, H, f, -0.8, y, 0.9, 2.4, 0x2a2630); arch(K, H, f, 0.8, y, 0.9, 2.4, 0x2a2630); }
      for (let k = -2; k <= 2; k++) arch(K, H, f, k * 1.25, -3.6, 1.0, 2.6, k % 2 ? 0xe8c030 : 0x2a8a5a, 0.06); // the coloured interlaced arches
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { // corner turrets
      F(K, H.cyl(0.55, 0.55, 1.2, 6, { x: sx * (p.w / 2 - 0.55), y: 0.6, z: sz * (p.d / 2 - 0.55), color: 0xe8dcc0 }));
      F(K, H.part(new THREE.ConeGeometry(0.6, 0.9, 6), { x: sx * (p.w / 2 - 0.55), y: 1.65, z: sz * (p.d / 2 - 0.55), color: 0x2a8a5a }));
    }
    cap(K, p, H, 0xc8b898);
  },
  majolica(K, p, th, rng, H) {
    const n = 16;
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; F(K, H.box(p.r * 0.42, p.thick, 0.3, { x: Math.cos(a) * (p.r - 0.12), y: -p.thick / 2, z: Math.sin(a) * (p.r - 0.12), ry: -a + Math.PI / 2, color: k % 2 ? 0xe8c030 : 0x2a8a5a })); }
    F(K, H.cyl(p.r - 0.2, p.r - 0.2, p.thick, 16, { y: -p.thick / 2, color: 0x2a8a5a }));
    cap(K, p, H, 0xe8c030);
  },
  majolicaLantern(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r, p.thick, 8, { y: -p.thick / 2, color: 0xe8dcc0 }));
    ringArches(K, H, p.r + 0.02, 4, -p.thick + 0.3, 1.3, 0.5, 0x2a2630);
    cap(K, p, H, 0x2a8a5a);
    F(K, H.part(new THREE.TorusGeometry(p.r, 0.1, 4, 10), { rx: Math.PI / 2, y: 0, color: COL.gold }));
  },
  casa(K, p, th, rng, H) { // a pastel house: shuttered windows on the sea side, a flat roof terrace
    const c = PASTEL[(p.tint >= 0 ? p.tint : 0) % PASTEL.length], t = p.thick;
    body(K, p, H, c);
    const fs = H.faces(p.w, p.d), south = fs[1];
    const nx = Math.max(1, Math.floor((p.w - 1) / 2.6));
    for (let y = -2.4; y > Math.max(-t + 1, -10); y -= 3) for (let k = 0; k < nx; k++) { // the upper floors show over the row below
      const off = (k - (nx - 1) / 2) * 2.6, z = p.d / 2 + 0.05;
      F(K, H.box(0.8, 1.3, 0.08, { x: off, y, z, color: COL.win }));
      F(K, H.box(0.4, 1.4, 0.06, { x: off - 0.62, y, z: z + 0.03, color: 0x2a7a4a }), H.box(0.4, 1.4, 0.06, { x: off + 0.62, y, z: z + 0.03, color: 0x2a7a4a }));
      if (rng() < 0.3) F(K, H.box(1.6, 0.12, 0.6, { x: off, y: y - 0.75, z: z + 0.3, color: 0xe8e0d0 })); // a balcony
    }
    for (const f of [fs[2], fs[3]]) if (f.width > 4) F(K, H.box(0.08, 1.3, 0.8, { x: f.nx * (f.half + 0.05), y: -2.4, color: COL.win }));
    cap(K, p, H, rng() < 0.5 ? 0xd88a6a : 0xf0ece4, 0xffffff, 0.22);
    if (rng() < 0.4) { const sx = rng() < 0.5 ? -1 : 1; F(K, H.box(0.6, 1.0, 0.6, { x: sx * (p.w / 2 - 0.5), y: 0.5, z: -p.d / 2 + 0.5, color: 0xe8e0d0 })); } // a chimney at the back
    if (rng() < 0.35) { G(K, H.box(0.9, 1.1, 0.06, { x: (rng() - 0.5) * (p.w - 2), y: -2.4, z: p.d / 2 + 0.1, color: COL.warm })); }
  },
  lane(K, p, th, rng, H) { // the hillside under a row of houses: stone-paved lanes and steps
    body(K, p, H, 0xb8a888);
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0xc8bca0 }));
    for (let x = -p.w / 2 + 1; x < p.w / 2; x += 2.2) F(K, H.box(0.12, 0.02, p.d - 0.4, { x, y: 0.01, color: 0xa89878 }));
  },
  lemons(K, p, th, rng, H) { // a terrace: a drystone retaining wall, soil, lemon trees along the back
    body(K, p, H, 0x9a8a72);
    for (let y = -0.6; y > -p.thick; y -= 0.9) F(K, H.box(p.w + 0.06, 0.12, 0.1, { y, z: p.d / 2 + 0.03, color: 0x7a6a56 }));
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0x7a5a3a }));
    F(K, H.box(p.w, 0.03, p.d * 0.45, { y: 0.0, z: p.d * 0.25, color: 0x6a9a3a }));
    for (let x = -p.w / 2 + 2; x < p.w / 2 - 1; x += 3.2) {
      const z = -p.d / 2 + 1.1, hgt = 1.6 + rng() * 0.6;
      F(K, H.cyl(0.1, 0.14, hgt, 4, { x, y: hgt / 2, z, color: 0x6a4a2a }));
      F(K, H.part(new THREE.IcosahedronGeometry(1.1, 0), { x, y: hgt + 0.5, z, sy: 0.8, color: 0x2a7a2a }));
      for (let k = 0; k < 4; k++) F(K, H.box(0.24, 0.24, 0.24, { x: x + (rng() - 0.5) * 1.6, y: hgt + 0.2 + rng() * 0.8, z: z + 0.8 + rng() * 0.3, color: 0xf8e040 }));
    }
    for (let x = -p.w / 2 + 1; x < p.w / 2; x += 6) F(K, H.cyl(0.07, 0.07, 2.6, 4, { x, y: 1.3, z: p.d / 2 - 0.3, color: 0x8a6a4a })); // pergola poles
    N(K, H.box(p.w, 0.06, 0.06, { y: -0.2, z: p.d / 2 + 0.06, color: 0xffe52b }));
  },
  cliff(K, p, th, rng, H) {
    body(K, p, H, COL.rock);
    for (let y = -3; y > -p.thick; y -= 4 + rng() * 3) F(K, H.box(p.w + 0.1, 0.8 + rng(), p.d + 0.1, { y, color: rng() < 0.5 ? COL.rockDk : 0xc0b090 }));
    const fs = H.faces(p.w, p.d);
    for (const f of fs) for (let k = 0; k < Math.floor(f.width / 9); k++) { // crags and scrub on the faces
      const off = (rng() - 0.5) * (f.width - 4), y = -2 - rng() * (p.thick * 0.6);
      F(K, H.part(new THREE.DodecahedronGeometry(1.5 + rng() * 2, 0), { x: f.nx * (f.half + 0.4) + f.tx * off, y, z: f.nz * (f.half + 0.4) + f.tz * off, sx: 1.4, color: rng() < 0.6 ? COL.rockDk : COL.scrub }));
    }
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0x8a9a5a }));
    for (const f of fs) F(K, H.box(f.tx ? f.width : 1.2, 0.1, f.tz ? f.width : 1.2, { x: f.nx * (f.half - 0.6), y: 0.0, z: f.nz * (f.half - 0.6), color: 0xb8a888 }));
  },
  infinity(K, p, th, rng, H) { // the Terrace of Infinity: a balustrade of marble busts over the sea
    body(K, p, H, 0xd8ccb0);
    arcade(K, p, H, [1], -p.thick + 0.5, 5.5, 3.2, 0x6a6058);
    for (let x = -p.w / 2 + 1; x < p.w / 2; x += 2) for (let z = -p.d / 2 + 1; z < p.d / 2; z += 2) F(K, H.box(1.9, 0.04, 1.9, { x, y: 0.0, z, color: ((x + z) / 2) % 2 === 0 ? 0xe8e4dc : 0xb8b0a0 }));
    F(K, H.box(p.w, 0.9, 0.35, { y: 0.45, z: p.d / 2 - 0.2, color: COL.lime }));
    for (let x = -p.w / 2 + 1.5; x < p.w / 2; x += 3.2) {
      F(K, H.box(0.5, 0.6, 0.5, { x, y: 1.2, z: p.d / 2 - 0.2, color: 0xe8e4dc }));
      F(K, H.part(new THREE.IcosahedronGeometry(0.34, 0), { x, y: 1.75, z: p.d / 2 - 0.2, sy: 1.25, color: 0xf4f2ec }));
    }
    N(K, H.box(p.w, 0.08, 0.08, { y: -0.4, z: p.d / 2 + 0.06, color: COL.magenta }));
  },
  gardenStair(K, p, th, rng, H) { F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xa89c88 })); F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0xd8d0c0 })); for (const s of [-1, 1]) F(K, H.box(0.4, 0.8, p.d + 0.02, { x: s * (p.w / 2 + 0.2), y: 0.1, color: 0xc8bca8 })); },
  cliffPath(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.rockDk }));
    cap(K, p, H, 0xb8a888);
    for (let x = -p.w / 2; x <= p.w / 2; x += 1.5) F(K, H.box(0.08, 0.9, 0.08, { x, y: 0.45, z: p.d / 2 - 0.1, color: 0x6a4a2a }));
    F(K, H.box(p.w, 0.08, 0.08, { y: 0.9, z: p.d / 2 - 0.1, color: 0x6a4a2a }));
    G(K, H.box(0.3, 0.3, 0.3, { x: p.w / 2 - 0.3, y: 1.1, z: p.d / 2 - 0.1, color: COL.warm }));
  },
  villa(K, p, th, rng, H) {
    body(K, p, H, 0xf0c8b8);
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 1, 3.2, 3, 0x3a3238);
    arcade(K, p, H, [0, 1], -5, 2.2, 3, 0x3a3238, { w: 1 });
    cap(K, p, H, COL.roof, 0xf8f0e8, 0.3);
    F(K, H.box(5, 5, 5, { x: p.w / 2 - 3, y: 2.5, z: 0, color: 0xf0c8b8 }), H.part(new THREE.ConeGeometry(3.6, 2, 4), { x: p.w / 2 - 3, y: 6, ry: Math.PI / 4, color: COL.roof }));
    for (let k = -2; k <= 2; k++) F(K, H.part(new THREE.ConeGeometry(0.7, 6, 5), { x: k * 5, y: -p.thick + 3, z: p.d / 2 + 2.5, color: 0x2a4a2a }));
  },
  rock(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r * 1.25, p.thick, 7, { y: -p.thick / 2, color: COL.rockDk }));
    for (let k = 0; k < 4; k++) { const a = rng() * Math.PI * 2; F(K, H.part(new THREE.DodecahedronGeometry(p.r * 0.5, 0), { x: Math.cos(a) * p.r, y: -p.thick * (0.3 + rng() * 0.5), z: Math.sin(a) * p.r, color: COL.rock })); }
    F(K, H.cyl(p.r + 0.02, p.r + 0.02, 0.06, 7, { y: -0.03, color: 0xb8a888 }));
  },
  seaStack(K, p, th, rng, H) { // the Faraglione: a tall rock with a sea arch through its foot
    F(K, H.cyl(p.r, p.r * 1.35, p.thick, 9, { y: -p.thick / 2, color: COL.rock }));
    for (let y = -2; y > -p.thick; y -= 3) F(K, H.cyl(p.r * (1 + (-y / p.thick) * 0.35) + 0.05, p.r * (1 + (-y / p.thick) * 0.35) + 0.05, 0.6, 9, { y, color: COL.rockDk }));
    F(K, H.box(p.r * 3, 4, 3, { y: -p.thick + 3.5, color: 0x1a2a3a })); // the arch (dark through the rock)
    for (let k = 0; k < 5; k++) { const a = rng() * Math.PI * 2; F(K, H.part(new THREE.IcosahedronGeometry(0.9, 0), { x: Math.cos(a) * (p.r - 0.6), y: 0.3, z: Math.sin(a) * (p.r - 0.6), sy: 0.5, color: COL.scrub })); }
    F(K, H.cyl(p.r + 0.02, p.r + 0.02, 0.06, 9, { y: -0.03, color: 0xa8b078 }));
  },

  // ---- VENICE
  fondamenta(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 3, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: 0x9a948a }); g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width : 0.5, 0.12, f.tz ? f.width : 0.5, { x: f.nx * (f.half - 0.25), y: 0.0, z: f.nz * (f.half - 0.25), color: COL.istrian }));
    const along = p.d > p.w, len = Math.max(p.w, p.d), side = along ? Math.sign(-p.x || 1) : 0;
    for (let o = -len / 2 + 5; o < len / 2; o += 10) { // lamps on the canal side
      const x = along ? side * (p.w / 2 - 0.4) : o, z = along ? o : p.d / 2 - 0.4;
      F(K, H.cyl(0.07, 0.09, 3.2, 5, { x, y: 1.6, z, color: 0x1a1a22 }));
      G(K, H.box(0.36, 0.5, 0.36, { x, y: 3.4, z, color: 0xffd890 }));
    }
    if (along) for (let z = -p.d / 2 + 3; z < p.d / 2; z += 7) for (const dz of [0, 1.1]) { // mooring poles in the water
      const x = side * (p.w / 2 + 1.6), col = (Math.floor(z) + dz) % 2 ? 0x2a4ab8 : 0xd83a2a;
      F(K, H.cyl(0.16, 0.16, 4.2, 5, { x, y: -p.thick + 2, z: z + dz, color: 0xf0f0f0 }));
      for (let y = -p.thick + 0.8; y < 0.8; y += 0.8) F(K, H.cyl(0.17, 0.17, 0.35, 5, { x, y, z: z + dz, color: col }));
    }
  },
  pontile(K, p, th, rng, H) { // the vaporetto stop: a floating wooden deck, the yellow-and-white shelter at the back
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x5a4a3a }));
    for (let x = -p.w / 2 + 0.5; x < p.w / 2; x += 1) F(K, H.box(0.9, 0.06, p.d - 0.2, { x, y: -0.03, color: 0x8a6a4a }));
    for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width : 0.3, 0.6, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: -0.3, z: f.nz * (f.half - 0.15), color: 0x1a1a22 }));
    const z = p.d / 2 - 2;
    for (const sx of [-1, 1]) F(K, H.box(0.2, 3, 0.2, { x: sx * 6, y: 1.5, z, color: 0xf0f0f0 }));
    F(K, H.box(13, 0.4, 3.4, { y: 3.1, z, color: 0xffd23a }), H.box(13.2, 0.12, 3.6, { y: 3.35, z, color: 0xf0f0f0 }));
    G(K, H.box(4, 0.7, 0.1, { y: 2.5, z: z - 1.75, color: 0xffd23a }));
    N(K, H.box(p.w, 0.08, 0.08, { y: -p.thick + 0.1, z: -p.d / 2, color: COL.cyan }));
  },
  palazzo(K, p, th, rng, H) { // Venetian gothic: tinted plaster, Istrian stone trims, pointed windows lit at dusk
    const c = PALAZZO[(p.tint >= 0 ? p.tint : 0) % PALAZZO.length], t = p.thick;
    body(K, p, H, c);
    const fs = H.faces(p.w, p.d), canal = p.x < 0 ? fs[2] : fs[3]; // the face toward the Grand Canal
    for (let y = -3.2; y > -t + 2.5; y -= 3.4) F(K, H.box(p.w + 0.12, 0.2, p.d + 0.12, { y: y + 1.6, color: COL.istrian }));
    const floors = Math.floor((t - 3) / 3.4);
    for (const f of fs) {
      const isCanal = f === canal, n = Math.max(1, Math.floor((f.width - 2) / (isCanal ? 2.0 : 3.2)));
      for (let fl = 0; fl < floors; fl++) {
        const y = -2.8 - fl * 3.4 - 1.1, noble = isCanal && fl === Math.floor(floors / 2) - 1;
        for (let k = 0; k < n; k++) {
          if (isCanal && !noble && (k === 0 || k === n - 1) && fl % 2) continue;
          const lit = rng() < (th.night > 0.2 ? 0.45 : 0.1);
          arch(K, H, f, (k - (n - 1) / 2) * (isCanal ? 2.0 : 3.2), y, noble ? 1.2 : 0.9, noble ? 2.4 : 1.9, lit ? 0xffc870 : 0x2a2632, 0.06, lit ? 'glow' : 'flat');
        }
        if (noble) F(K, H.box(f.tx ? n * 2.0 : 0.6, 0.15, f.tz ? n * 2.0 : 0.6, { x: f.nx * (f.half + 0.3), y: y - 0.15, z: f.nz * (f.half + 0.3), color: COL.istrian })); // the balcony
      }
    }
    arch(K, H, canal, 0, -t + 0.4, 2.6, 3.6, 0x1a1a22, 0.06); // the water door
    cap(K, p, H, COL.roof, COL.istrian, 0.3);
    for (let k = -3; k <= 3; k++) F(K, H.part(new THREE.ConeGeometry(0.25, 0.7, 4), { x: canal.nx * (canal.half - 0.2) + canal.tx * k * (canal.width / 7), y: 0.35, z: canal.nz * (canal.half - 0.2) + canal.tz * k * (canal.width / 7), color: COL.istrian }));
    const back = p.x < 0 ? -p.w / 2 + 0.8 : p.w / 2 - 0.8;
    for (let k = 0; k < 2; k++) { const z = (rng() - 0.5) * (p.d - 3); F(K, H.cyl(0.25, 0.25, 1.4, 5, { x: back, y: 0.7, z, color: c }), H.part(new THREE.ConeGeometry(0.6, 0.8, 5), { x: back, y: 1.8, z, rx: Math.PI, color: 0x9a4a3a })); } // funnel chimneys
    N(K, H.box(canal.tx ? canal.width : 0.08, 0.08, canal.tz ? canal.width : 0.08, { x: canal.nx * (canal.half + 0.08), y: -t + 3.4, z: canal.nz * (canal.half + 0.08), color: rng() < 0.5 ? COL.magenta : COL.cyan }));
  },
  palazzoBack(K, p, th, rng, H) {
    const c = PALAZZO[(p.tint >= 0 ? p.tint : 0) % PALAZZO.length];
    body(K, p, H, c);
    for (const f of H.faces(p.w, p.d)) { const n = Math.floor(f.width / 3); for (let fl = 0; fl < 3; fl++) for (let k = 0; k < n; k++) { const lit = rng() < (th.night > 0.2 ? 0.4 : 0.08); arch(K, H, f, (k - (n - 1) / 2) * 3, -3 - fl * 3.2, 0.8, 1.7, lit ? 0xffc870 : 0x2a2632, 0.05, lit ? 'glow' : 'flat'); } }
    cap(K, p, H, COL.roof, COL.istrian, 0.25);
  },
  altana(K, p, th, rng, H) {
    F(K, H.box(p.w, 0.3, p.d, { y: -0.15, color: 0x8a6a4a }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.box(0.25, p.thick, 0.25, { x: sx * (p.w / 2 - 0.2), y: -p.thick / 2, z: sz * (p.d / 2 - 0.2), color: 0x6a4a2a }));
    for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width : 0.08, 0.08, f.tz ? f.width : 0.08, { x: f.nx * (f.half - 0.05), y: 0.9, z: f.nz * (f.half - 0.05), color: 0x6a4a2a }));
    G(K, H.box(p.w - 1, 0.05, 0.05, { y: 1.6, color: 0xffd890 }));
  },
  rialto(K, p, th, rng, H) { // one step of the bridge: Istrian stone, a balustrade on each edge
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xe8e2d2 }));
    F(K, H.box(p.w, 0.06, p.d - 0.4, { y: -0.03, color: COL.istrian }));
    F(K, H.box(p.w + 0.02, p.thick * 0.5, 0.1, { y: -p.thick * 0.75, z: p.d / 2 + 0.03, color: 0xc8c0ae }), H.box(p.w + 0.02, p.thick * 0.5, 0.1, { y: -p.thick * 0.75, z: -p.d / 2 - 0.03, color: 0xc8c0ae }));
    for (const s of [-1, 1]) {
      F(K, H.box(p.w + 0.02, 0.14, 0.3, { y: 1.0, z: s * (p.d / 2 - 0.15), color: COL.istrian }));
      F(K, H.cyl(0.1, 0.12, 0.85, 5, { y: 0.45, z: s * (p.d / 2 - 0.15), color: 0xe8e2d2 }));
    }
    F(K, H.box(p.w + 0.02, 0.12, p.d + 0.1, { y: -p.thick + 0.06, color: 0xb8b09e }));
  },
  rialtoPortico(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.istrian }));
    F(K, H.box(p.w + 0.4, 0.4, p.d + 0.4, { y: -0.2, color: 0xe0dace }));
    cap(K, p, H, COL.lead);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.box(0.7, 4.6, 0.7, { x: sx * (p.w / 2 - 0.35), y: -p.thick - 2.2, z: sz * (p.d / 2 - 0.45), color: COL.istrian }));
    for (const s of [-1, 1]) { // the pediment outline on each canal face
      F(K, H.box(p.w * 0.62, 0.18, 0.12, { x: -p.w * 0.17, y: -0.9, z: s * (p.d / 2 + 0.06), rz: 0.32, color: 0xc8c0ae }), H.box(p.w * 0.62, 0.18, 0.12, { x: p.w * 0.17, y: -0.9, z: s * (p.d / 2 + 0.06), rz: -0.32, color: 0xc8c0ae }));
      G(K, H.box(1.4, 0.8, 0.1, { y: -1.6, z: s * (p.d / 2 + 0.08), color: 0xffd890 }));
    }
    N(K, H.box(p.w + 0.5, 0.08, 0.08, { y: -p.thick, z: p.d / 2, color: COL.magenta }), H.box(p.w + 0.5, 0.08, 0.08, { y: -p.thick, z: -p.d / 2, color: COL.magenta }));
  },
  gondola(K, p, th, rng, H) { // black lacquer, a silver ferro at the bow, a red-and-gold seat
    const hd = p.d / 2, t = p.thick;
    F(K, H.box(p.w, t, p.d - 1.6, { y: -t / 2, color: 0x141418 }));
    for (const s of [-1, 1]) F(K, H.box(p.w * 0.5, 0.4, 1.8, { y: 0.0 + 0.15, z: s * (hd - 0.6), rx: s * 0.45, color: 0x141418 }));
    F(K, H.box(0.12, 1.1, 0.5, { y: 0.6, z: -hd + 0.1, color: 0xd8dce4 })); // the ferro
    for (let k = 0; k < 3; k++) F(K, H.box(0.5, 0.08, 0.1, { x: 0.25, y: 0.3 + k * 0.25, z: -hd + 0.1, color: 0xd8dce4 }));
    F(K, H.box(p.w - 0.4, 0.06, p.d - 2.4, { y: -0.03, color: 0x6a1a22 }));
    F(K, H.box(p.w - 0.4, 0.06, 0.8, { y: -0.02, color: COL.gold }));
    N(K, H.box(p.w + 0.04, 0.05, p.d - 1.6, { y: -t + 0.1, color: COL.magenta }));
  },
  vaporetto(K, p, th, rng, H) { // a water-bus: white hull, a yellow band, a lit cabin; its roof is the deck you ride
    const t = p.thick, hd = p.d / 2;
    F(K, H.box(p.w + 0.4, 1.0, p.d + 1, { y: -t + 0.5, color: 0xf0f0ec }));
    F(K, H.box(p.w + 0.44, 0.3, p.d + 1.04, { y: -t + 1.1, color: 0xffd23a }));
    F(K, H.box(p.w, t - 1.2, p.d, { y: -(t - 1.2) / 2, color: 0xe8e8e4 }));
    G(K, H.box(p.w + 0.04, 0.8, p.d - 2, { y: -1.0, color: 0xfff0c0 })); // the lit cabin windows
    for (let z = -hd + 1.5; z < hd - 1; z += 1.6) F(K, H.box(p.w + 0.08, 0.8, 0.14, { y: -1.0, z, color: 0x3a3a40 }));
    cap(K, p, H, 0xc8ccd0, 0x3a3a40, 0.12);
    G(K, H.box(1.6, 0.5, 0.08, { y: -2.0, z: -hd - 0.5, color: 0xffd23a }));
    F(K, H.box(1.4, 0.8, 1.2, { y: 0.4, z: hd - 0.8, color: 0xf0f0ec })); // the wheelhouse at the stern
    N(K, H.box(p.w + 0.46, 0.08, p.d + 1.06, { y: -t + 0.15, color: COL.cyan }));
  },
  mask(K, p, th, rng, H) { // a floating carnival mask, face up: you land on its brow
    const m = (p.tint >= 0 ? p.tint : 0) % 6, r = p.r;
    const face = [0xf8f4ea, 0xd8302a, 0x1a1a22, 0x3a6ae8, 0xf0f0f0, 0x2a9a5a][m], trim = [COL.gold, COL.gold, COL.gold, 0xd8dce4, COL.red, COL.gold][m];
    F(K, H.cyl(r, r * 0.9, p.thick, H.seg(16, 10), { y: -p.thick / 2, color: face }));
    F(K, H.part(new THREE.TorusGeometry(r - 0.05, 0.1, 3, H.seg(16, 10)), { rx: Math.PI / 2, y: 0.0, color: trim }));
    for (const s of [-1, 1]) F(K, H.box(0.7, 0.04, 0.32, { x: s * 0.55, y: 0.01, z: -0.25, ry: s * 0.25, color: 0x0a0a10 })); // the eye holes
    F(K, H.box(0.2, 0.05, 0.6, { y: 0.02, z: 0.35, color: trim }));
    if (m === 4) for (let k = 0; k < 4; k++) F(K, H.box(0.5, 0.03, 0.5, { x: (k - 1.5) * 0.45, y: 0.02, z: 0.75, ry: Math.PI / 4, color: k % 2 ? COL.red : 0x1a1a22 }));
    for (let k = 0; k < 3; k++) F(K, H.box(0.18, 1.6 - k * 0.3, 0.06, { x: r * 0.7 + k * 0.15, y: 0.6, z: -r * 0.55, rz: -0.4 - k * 0.15, color: [COL.magenta, 0xffd23a, COL.cyan][k] })); // plumes
    G(K, H.part(new THREE.TorusGeometry(r * 0.6, 0.08, 3, 12), { rx: Math.PI / 2, y: -p.thick - 0.02, color: COL.magenta }));
  },
  piazza(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 2, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: 0x8a867e }); g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    for (let x = -p.w / 2 + 4; x < p.w / 2; x += 8) F(K, H.box(0.4, 0.03, p.d - 1, { x, y: 0.01, color: COL.istrian }));
    for (let z = -p.d / 2 + 6; z < p.d / 2; z += 12) F(K, H.box(p.w - 1, 0.03, 0.4, { y: 0.01, z, color: COL.istrian }));
  },
  procuratie(K, p, th, rng, H) {
    body(K, p, H, COL.istrian);
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 0.2, 4.4, 3.2, 0x3a3640, { pilaster: 0xe0dace });
    for (const y of [-6.6, -3]) arcade(K, p, H, [0, 1, 2, 3], y, 2.2, 3.2, th.night > 0.2 ? 0xffc870 : 0x3a3640, { w: 1.1, key: th.night > 0.2 ? 'glow' : 'flat' });
    bands(K, p, H, -0.4, -p.thick, 3.6, 0xe0dace, 0.3, 0.12);
    cap(K, p, H, 0xb8b0a0);
  },
  dogePalace(K, p, th, rng, H) {
    body(K, p, H, 0xf0c8c0);
    for (let y = -1.2; y > -p.thick * 0.5; y -= 1.4) for (const f of H.faces(p.w, p.d)) for (let o = -f.width / 2 + 0.7; o < f.width / 2; o += 1.4) F(K, H.box(f.tx ? 0.55 : 0.06, 0.55, f.tz ? 0.55 : 0.06, { x: f.nx * (f.half + 0.03) + f.tx * o, y: y - ((Math.round(o / 1.4) % 2) * 0.7), z: f.nz * (f.half + 0.03) + f.tz * o, rx: f.tx ? 0 : Math.PI / 4, rz: f.tz ? 0 : Math.PI / 4, color: 0xf8f0ea })); // the diamond pattern
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 0.2, 4.6, 2.4, 0x3a3238, { pilaster: COL.istrian });
    arcade(K, p, H, [0, 1, 2, 3], -p.thick + 5.2, 3.4, 1.2, 0x3a3238, { w: 0.7 });
    F(K, H.box(p.w + 0.3, 0.6, p.d + 0.3, { y: -p.thick + 8.6, color: COL.istrian }));
    merlons(K, p, H, COL.istrian, [0, 1, 2, 3], 0.4, 1.8, 0.8);
    cap(K, p, H, 0xb8a898);
  },
  stMarkCampanile(K, p, th, rng, H) { // red brick, white pilasters, the open belfry at the top
    body(K, p, H, COL.brick);
    for (const f of H.faces(p.w, p.d)) for (let k = -2; k <= 2; k++) F(K, H.box(f.tx ? 0.5 : 0.12, p.thick - 7, f.tz ? 0.5 : 0.12, { x: f.nx * (f.half + 0.05) + f.tx * k * (f.width / 5), y: -6.5 - (p.thick - 7) / 2, z: f.nz * (f.half + 0.05) + f.tz * k * (f.width / 5), color: COL.brickDk }));
    F(K, H.box(p.w + 0.6, 0.8, p.d + 0.6, { y: -6.4, color: COL.istrian }));
    const fs = H.faces(p.w, p.d);
    for (const f of fs) for (let k = 0; k < 4; k++) arch(K, H, f, (k - 1.5) * 2.0, -5.6, 1.3, 4.4, 0x1a1620);
    for (const f of fs) for (let k = 0; k < 4; k++) G(K, H.part(new THREE.ConeGeometry(0.5, 0.7, 6), { x: f.nx * (f.half - 1.2) + f.tx * (k - 1.5) * 2.0, y: -3.4, z: f.nz * (f.half - 1.2) + f.tz * (k - 1.5) * 2.0, color: 0xd8a040 }));
    F(K, H.box(p.w + 0.5, 0.5, p.d + 0.5, { y: -0.25, color: COL.istrian }));
    cap(K, p, H, COL.istrian);
    N(K, H.box(p.w + 0.7, 0.08, p.d + 0.7, { y: -6.9, color: COL.magenta }));
  },
  stMarkAttic(K, p, th, rng, H) {
    body(K, p, H, 0xe8dcc8);
    for (const f of H.faces(p.w, p.d)) G(K, H.box(f.tx ? 2.4 : 0.1, 1.8, f.tz ? 2.4 : 0.1, { x: f.nx * (f.half + 0.06), y: -2.5, z: f.nz * (f.half + 0.06), color: COL.gold })); // the lion of St Mark
    cap(K, p, H, COL.istrian, 0xd8ccb8, 0.3);
  },
  stMarkSpire(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r + 0.6, p.thick, 4, { y: -p.thick / 2, ry: Math.PI / 4, color: COL.copper }));
    cap(K, p, H, 0x6aaa8a);
    if (p.tint === 1) { F(K, H.cyl(0.06, 0.06, 2.2, 4, { x: 0.9, y: 1.1, color: COL.gold })); G(K, H.box(0.5, 0.9, 0.12, { x: 0.9, y: 2.4, color: COL.gold }), H.box(1.2, 0.2, 0.08, { x: 0.9, y: 2.6, color: COL.gold })); } // the golden angel
  },
  gondolaLift(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x141418 }));
    F(K, H.box(p.w - 0.3, 0.06, p.d - 0.4, { y: -0.03, color: 0x6a1a22 }));
    for (const sz of [-1, 1]) F(K, H.box(0.12, 2.2, 0.12, { x: p.w / 2 - 0.1, y: 1.1, z: sz * (p.d / 2 - 0.1), color: COL.gold }));
    F(K, H.box(0.12, 0.12, p.d, { x: p.w / 2 - 0.1, y: 2.2, color: COL.gold }));
    jets(K, H, [[0, -2], [0, 0], [0, 2]], -p.thick - 0.03, 0.45, COL.magenta);
  },
  basilica(K, p, th, rng, H) {
    body(K, p, H, 0xe8dcc8);
    const south = H.faces(p.w, p.d)[1];
    for (let k = 0; k < 5; k++) { // upper facade: gold mosaic lunettes under ogee arches, above the loggia
      const off = (k - 2) * 9.5;
      arch(K, H, south, off, -6.4, 5.6, 6, k === 2 ? 0xffd040 : 0xe8b830, 0.08, 'glow');
      F(K, H.part(new THREE.ConeGeometry(0.5, 2.4, 4), { x: off + 4.7, y: 0.6, z: p.d / 2 - 0.3, color: COL.istrian }));
    }
    arcade(K, p, H, [0, 2, 3], -p.thick + 0.5, 6, 4.4, 0x5a4a40);
    cap(K, p, H, COL.lead, COL.istrian, 0.3);
  },
  basilicaLoggia(K, p, th, rng, H) {
    body(K, p, H, 0xe8dcc8);
    const south = H.faces(p.w, p.d)[1];
    for (let k = 0; k < 5; k++) arch(K, H, south, (k - 2) * 9.5, -p.thick + 0.3, k === 2 ? 5.6 : 4.4, 8, 0xe8b830, 0.08, 'glow'); // the five portals' gold mosaics
    for (let k = 0; k < 12; k++) F(K, H.cyl(0.25, 0.25, 7.4, 6, { x: (k - 5.5) * 4.2, y: -p.thick / 2 - 0.3, z: p.d / 2 + 0.4, color: 0xa86a5a }));
    cap(K, p, H, 0xd8ccb8);
    F(K, H.box(p.w, 0.8, 0.3, { y: 0.4, z: p.d / 2 - 0.15, color: COL.istrian }));
    for (const x of [-10.5, -7, 7, 10.5]) { // the four bronze horses
      F(K, H.box(0.7, 0.8, 2.0, { x, y: 1.2, z: 0.6, color: COL.bronze }), H.box(0.5, 0.9, 0.6, { x, y: 1.75, z: -0.4, rx: -0.5, color: COL.bronze }));
      for (const [dx, dz] of [[-0.25, -0.7], [0.25, -0.7], [-0.25, 0.7], [0.25, 0.7]]) F(K, H.box(0.16, 0.9, 0.16, { x: x + dx, y: 0.45, z: 0.6 + dz, color: COL.bronze }));
    }
  },
  stMarkDome(K, p, th, rng, H) {
    const drum = p.tint === 0;
    body(K, p, H, drum ? 0xe8dcc8 : COL.lead, { seg: H.seg(20, 12) });
    if (drum) ringArches(K, H, p.r + 0.03, 12, -p.thick + 0.6, 2.2, 0.8, 0x2a2632);
    else { F(K, H.part(new THREE.TorusGeometry(p.r - 0.1, 0.2, 4, H.seg(20, 12)), { rx: Math.PI / 2, y: -0.1, color: COL.lead })); for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; F(K, H.box(0.18, p.thick, 0.18, { x: Math.cos(a) * (p.r + 0.03), y: -p.thick / 2, z: Math.sin(a) * (p.r + 0.03), color: COL.leadDk })); } }
    cap(K, p, H, drum ? COL.lead : 0x9aa4ac);
  },
  onion(K, p, th, rng, H) {
    F(K, H.part(new THREE.SphereGeometry(p.r, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), { y: -p.thick, sy: p.thick / p.r, color: COL.gold }));
    F(K, H.cyl(p.r * 0.8, p.r, p.thick * 0.4, 8, { y: -p.thick * 0.8, color: COL.gold }));
    cap(K, p, H, 0xf0c840);
    F(K, H.box(0.08, 1.2, 0.08, { y: 0.6, color: COL.gold }), H.box(0.5, 0.08, 0.08, { y: 0.85, color: COL.gold }));
  },

  // ---- ROME: the Colosseum
  arenaFloor(K, p, th, rng, H) {
    body(K, p, H, COL.sandDk);
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: COL.sand }));
    F(K, H.part(new THREE.RingGeometry(0.93, 1.0, H.seg(48, 28)), { rx: -Math.PI / 2, sx: 34, sy: 24, y: 0.01, color: COL.sandDk }));
    F(K, H.part(new THREE.RingGeometry(0.0, 0.5, H.seg(32, 20)), { rx: -Math.PI / 2, sx: 34, sy: 24, y: 0.008, color: 0xd0b070 }));
    for (let x = -24; x <= 24; x += 6) F(K, H.box(0.18, 0.02, 30, { x, y: 0.015, color: 0xb89a60 })); // the hypogeum's trapdoor lines
    for (let z = -12; z <= 12; z += 6) F(K, H.box(46, 0.02, 0.18, { y: 0.015, z, color: 0xb89a60 }));
    N(K, H.part(new THREE.RingGeometry(0.985, 1.0, H.seg(48, 28)), { rx: -Math.PI / 2, sx: 33.6, sy: 23.6, y: 0.03, color: COL.red }));
  },
  podium(K, p, th, rng, H) { // the podium wall faces the sand: niches, a marble parapet, torches
    body(K, p, H, COL.travertine);
    const inner = H.faces(p.w, p.d)[1]; // local +z faces the arena (ellipseRing builds them that way round)
    arch(K, H, inner, 0, -p.thick + 4.2, 2.2, 3.4, 0x2a2228);
    F(K, H.box(p.w, 0.5, 0.4, { y: 0.25, z: p.d / 2 - 0.2, color: COL.marble }));
    F(K, H.box(p.w, 0.3, 0.1, { y: -1.6, z: p.d / 2 + 0.06, color: 0x8a1a22 }));
    G(K, H.box(0.3, 0.5, 0.3, { x: p.w / 2 - 0.5, y: -1.0, z: p.d / 2 + 0.2, color: 0xff8a2a }));
    cap(K, p, H, 0xe0d4b4);
    for (let k = 0; k < 3; k++) F(K, H.box(p.w, 0.04, 0.12, { y: 0.0, z: -p.d / 2 + 1 + k * 1.2, color: COL.travDk }));
  },
  cavea(K, p, th, rng, H) { // a tier of seats: stepped rows on top, an arched riser wall toward the sand
    body(K, p, H, COL.travertine);
    const inner = H.faces(p.w, p.d)[1];
    arch(K, H, inner, 0, -3.6, 1.6, 3.2, 0x2a2228);
    for (let k = 0; k < 4; k++) F(K, H.box(p.w, 0.05, 0.14, { y: 0.0, z: p.d / 2 - 0.6 - k * 1.1, color: COL.travDk }));
    cap(K, p, H, 0xe4d8b8);
    F(K, H.box(p.w, 0.25, 0.3, { y: -0.12, z: p.d / 2 + 0.05, color: COL.marble }));
    if ((p.tint >= 0 ? p.tint : 0) % 4 === 0) G(K, H.box(0.35, 0.35, 0.35, { y: -1.2, z: p.d / 2 + 0.2, color: 0xffa040 }));
  },
  colosseumWall(K, p, th, rng, H) { // the outer ring: travertine arcades in tiers, the attic, floodlights
    body(K, p, H, COL.travertine);
    const fs = H.faces(p.w, p.d);
    for (const f of [fs[0], fs[1]]) for (let tier = 0; tier < 3; tier++) arch(K, H, f, 0, -p.thick + 4.5 + tier * 6.2, 2.8, 4.8, 0x2a2228);
    bands(K, p, H, -p.thick + 10.2, -p.thick + 3, 6.2, COL.travDk, 0.5, 0.15);
    F(K, H.box(p.w + 0.2, 0.6, p.d + 0.2, { y: -0.3, color: COL.travDk }));
    cap(K, p, H, 0xd0c098);
    if ((p.tint >= 0 ? p.tint : 0) % 3 === 0) { G(K, H.box(0.6, 0.4, 0.6, { y: 0.4, z: p.d / 2 - 0.4, color: 0xff3050 })); N(K, H.box(p.w, 0.1, 0.1, { y: -2.5, z: p.d / 2 + 0.1, color: COL.magenta })); }
  },
  pulvinar(K, p, th, rng, H) { // the emperor's box: marble, purple drapes, an awning on gilded poles
    body(K, p, H, COL.marble);
    F(K, H.box(p.w + 0.1, 2.4, 0.1, { y: -1.6, z: p.d / 2 + 0.05, color: 0x6a1a6a }));
    G(K, H.box(1.4, 1.2, 0.12, { y: -1.6, z: p.d / 2 + 0.12, color: COL.gold }));
    cap(K, p, H, 0xe8e0d0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.cyl(0.1, 0.1, 4.2, 5, { x: sx * (p.w / 2 - 0.2), y: 2.1, z: sz * (p.d / 2 - 0.2), color: COL.gold }));
    for (let k = 0; k < 5; k++) F(K, H.box(p.w / 5, 0.1, p.d, { x: -p.w / 2 + (k + 0.5) * (p.w / 5), y: 4.2, color: k % 2 ? 0x8a1a8a : 0xe8d8a0 }));
  },
  column(K, p, th, rng, H) { // a broken column: fluted marble, a jagged top
    F(K, H.cyl(p.r * 0.85, p.r, p.thick, 10, { y: -p.thick / 2, color: COL.marble }));
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; F(K, H.box(0.08, p.thick, 0.08, { x: Math.cos(a) * p.r * 0.9, y: -p.thick / 2, z: Math.sin(a) * p.r * 0.9, color: COL.marbleDk })); }
    F(K, H.cyl(p.r * 1.25, p.r * 1.3, 0.5, 10, { y: -p.thick + 0.25, color: COL.marbleSh }));
    cap(K, p, H, 0xe0dcd0);
    F(K, H.part(new THREE.DodecahedronGeometry(0.5, 0), { x: p.r * 0.5, y: 0.15, z: -p.r * 0.3, sy: 0.6, color: COL.marbleSh }));
  },
  ruin(K, p, th, rng, H) { // fallen entablature: a marble block with a carved frieze
    body(K, p, H, COL.marbleSh);
    for (let k = 0; k < 3; k++) F(K, H.box(p.w + 0.04, 0.12, p.d + 0.04, { y: -0.3 - k * 0.45, color: COL.marbleDk }));
    cap(K, p, H, COL.marble);
  },
};
