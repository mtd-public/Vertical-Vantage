// ARCTIC VAULT: platform styles. Each builds a platform's look into Kit K in its local frame (y = 0 is the
// top you stand on, the footprint is p.w × p.d or radius p.r, solid down to -p.thick). Flat-shaded vertex
// colours, cold glow accents; walkable tops stay clear (dressing hangs off the edges or sits below).
import * as THREE from 'three';

// ------------------------------------------------------------------ palette
export const COL = {
  snow: 0xeef4fa, snowSh: 0xc6d4e2, snowDk: 0x9aaabd, ice: 0xbfe6f2, iceMid: 0x8ccbe0, iceDk: 0x3f8fb4, iceDeep: 0x1d4f72,
  rock: 0x464b56, rockDk: 0x30343d, rockLt: 0x5d626e, wood: 0x5a3a26, woodDk: 0x3a2618, woodLt: 0x7a5232,
  concrete: 0x8e959e, concreteDk: 0x5f666f, steel: 0x6f7884, steelDk: 0x3a414c, steelLt: 0xaab4c0,
  white: 0xf2f4f6, offwhite: 0xd8dde3, red: 0xc8302a, redDk: 0x8a2018, yellow: 0xf0b81a, black: 0x1a1d22,
  warm: 0xffd48a, cyan: 0x5fe8ff, aqua: 0x2be8d0, green: 0x5aff9a, blue: 0x4a8cff, magenta: 0xff5ad8, beacon: 0xff2a2a,
};
const HOUSE = [0xc8362e, 0xe0a830, 0x2a8a8a, 0x2a5ab0, 0x4a8a3a, 0xd86a8a, 0xc87a30, 0x8a6ab8];
const CRATE = [0x8a6a3a, 0xd8762a, 0x3a6aa8, 0x4a7a3a, 0xc8402e, 0x9aa4ae, 0xe0b030, 0x5a5f6a];
const MOBILE = [0xd8302a, 0x2a6ad8, 0xf0b81a, 0x1a1d22, 0x2ab8a8, 0xe8e8ec];

// ------------------------------------------------------------------ helpers
const F = (K, ...g) => K.add('flat', ...g);
const G = (K, ...g) => K.add('glow', ...g);

// The block body (a box, or a cylinder for a disc) from y0 (default the top) down `thick`.
function body(K, H, p, col, o = {}) {
  const t = o.thick ?? p.thick, y = (o.y0 ?? 0) - t / 2, g = o.grow || 0;
  if (p.kind === 'disc') F(K, H.cyl(p.r + g, p.r + g, t, o.seg || H.seg(20, 12), { y, color: col }));
  else F(K, H.box(p.w + g * 2, t, p.d + g * 2, { y, color: col }));
}
// A thin top layer (snow, a deck plate), slightly proud of the sides.
function cap(K, H, p, col, h = 0.12, grow = 0.04) {
  if (p.kind === 'disc') F(K, H.cyl(p.r + grow, p.r + grow, h, H.seg(20, 12), { y: -h / 2 + 0.005, color: col }));
  else F(K, H.box(p.w + grow * 2, h, p.d + grow * 2, { y: -h / 2 + 0.005, color: col }));
}
// A ring of horizontal bands round a block, every `step` metres from y0 down to y1.
function bands(K, H, p, y0, y1, step, col, h = 0.16, grow = 0.03) {
  for (let y = y0; y > y1; y -= step) {
    if (p.kind === 'disc') F(K, H.cyl(p.r + grow, p.r + grow, h, H.seg(20, 12), { y, color: col }));
    else F(K, H.box(p.w + grow * 2, h, p.d + grow * 2, { y, color: col }));
  }
}
// Rows of windows on the faces listed (0 -z, 1 +z, 2 +x, 3 -x): a frame and a lit (or dark) pane.
function windows(K, H, p, which, rows, spacing, o = {}) {
  const fs = H.faces(p.w, p.d), lit = o.lit ?? COL.warm, frame = o.frame ?? COL.white, ww = o.w ?? 1.0, wh = o.h ?? 1.2;
  for (const i of which) {
    const f = fs[i], n = Math.max(1, Math.floor((f.width - (o.pad ?? 1.2)) / spacing));
    for (const y of rows) for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * spacing;
      const x = f.nx * (f.half + 0.03) + f.tx * off, z = f.nz * (f.half + 0.03) + f.tz * off;
      F(K, H.box(f.tx ? ww + 0.2 : 0.06, wh + 0.2, f.tz ? ww + 0.2 : 0.06, { x, y, z, color: frame }));
      const on = o.dark ? false : ((k * 7 + Math.round(y * 3)) % 5) < (o.on ?? 3);
      const g = H.box(f.tx ? ww : 0.08, wh, f.tz ? ww : 0.08, { x: x + f.nx * 0.02, y, z: z + f.nz * 0.02, color: on ? lit : 0x22303e });
      if (on) G(K, g); else F(K, g);
    }
  }
}
// Railings along the edges of a rect top (posts and a rail), optionally skipping faces.
function rails(K, H, p, col, which = [0, 1, 2, 3], h = 1.0) {
  const fs = H.faces(p.w, p.d);
  for (const i of which) {
    const f = fs[i], ex = f.nx * (f.half - 0.06), ez = f.nz * (f.half - 0.06);
    F(K, H.box(f.tx ? f.width : 0.07, 0.07, f.tz ? f.width : 0.07, { x: ex, y: h, z: ez, color: col }));
    for (let k = 0; k <= Math.floor(f.width / 2); k++) {
      const off = -f.width / 2 + k * (f.width / Math.max(1, Math.floor(f.width / 2)));
      F(K, H.box(0.06, h, 0.06, { x: ex + f.tx * off, y: h / 2, z: ez + f.tz * off, color: col }));
    }
  }
}
// Little hover jets under a floating thing.
function jets(K, H, pts, y, r = 0.32, col = COL.cyan) { for (const [x, z] of pts) G(K, H.cyl(r, r * 0.8, 0.08, 8, { x, y, z, color: col })); }
// Lumpy jitter on a geometry's vertices (ice chunks, rocks): deterministic from the platform's rng.
function lumpy(geo, rng, amt, keepTop = true) {
  const pos = geo.attributes.position, shift = new Map();
  let top = -Infinity; for (let i = 0; i < pos.count; i++) top = Math.max(top, pos.getY(i));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (keepTop && y > top - 1e-3) continue;
    if (!shift.has(key)) shift.set(key, [(rng() - 0.5) * amt, (rng() - 0.5) * amt * 0.6, (rng() - 0.5) * amt]);
    const [a, b, c] = shift.get(key);
    pos.setXYZ(i, x + a, y + b, z + c);
  }
  geo.computeVertexNormals();
  return geo;
}
// Icicles hanging under an edge: n cones along a face.
function icicles(K, H, p, rng, y, n, maxLen = 1.4, col = COL.ice) {
  const fs = H.faces(p.w, p.d);
  for (const f of fs) for (let k = 0; k < n; k++) {
    const off = (rng() - 0.5) * (f.width - 0.6), len = 0.4 + rng() * maxLen;
    F(K, H.part(new THREE.ConeGeometry(0.14 + rng() * 0.12, len, 4), { x: f.nx * (f.half - 0.15) + f.tx * off, y: y - len / 2, z: f.nz * (f.half - 0.15) + f.tz * off, rx: Math.PI, color: col }));
  }
}

// ------------------------------------------------------------------ the styles
export const STYLES = {
  'arc-hidden'() {}, // collision only (a radome's tiers, a crane's counterweight…): drawn by its neighbour

  // ---- ground and rock
  'arc-snow'(K, p, th, rng, H) {
    body(K, H, p, COL.snowSh);
    cap(K, H, p, COL.snow, 0.1);
    for (let k = 0; k < Math.min(40, p.w * p.d / 400); k++) { // sastrugi: wind-carved ridges, a shade darker
      const x = (rng() - 0.5) * (p.w - 8), z = (rng() - 0.5) * (p.d - 8), l = 3 + rng() * 8;
      F(K, H.box(l, 0.04, 0.5 + rng() * 0.8, { x, y: 0.01, z, ry: 0.4 + rng() * 0.3, color: 0xdde7f1 }));
    }
    bands(K, H, p, -0.7, -p.thick, 1.4, COL.snowDk, 0.12);
  },
  'arc-plateau'(K, p, th, rng, H) {
    body(K, H, p, COL.rock);
    cap(K, H, p, COL.snow, 0.5, 0.25);
    F(K, H.box(p.w + 0.3, 0.6, p.d + 0.3, { y: -0.7, color: COL.snowSh })); // the snow cornice
    bands(K, H, p, -4, -p.thick + 1, 5.5, COL.rockDk, 0.9, 0.12); // strata
    for (const f of H.faces(p.w, p.d)) { // rock buttresses and snow gullies down the faces
      const n = Math.floor(f.width / 14);
      for (let k = 0; k < n; k++) {
        const off = -f.width / 2 + (k + 0.5) * (f.width / n) + (rng() - 0.5) * 4, h = Math.min(p.thick - 1, 8 + rng() * 20), w = 3 + rng() * 5;
        F(K, H.box(f.tx ? w : 1.6, h, f.tz ? w : 1.6, { x: f.nx * (f.half + 0.5) + f.tx * off, y: -1.4 - h / 2, z: f.nz * (f.half + 0.5) + f.tz * off, color: k % 3 ? COL.rockLt : COL.snowSh }));
      }
    }
  },
  'arc-rockledge'(K, p, th, rng, H) {
    F(K, lumpy(H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.rockLt }), rng, 0.6));
    cap(K, H, p, COL.snow, 0.14);
    F(K, H.part(new THREE.ConeGeometry(p.w * 0.45, 2.6, 5), { y: -p.thick - 1.2, rx: Math.PI, color: COL.rockDk }));
  },
  'arc-boulder'(K, p, th, rng, H) {
    F(K, lumpy(H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: p.tint === 1 ? COL.rockLt : COL.rock }), rng, 0.9));
    cap(K, H, p, COL.snow, 0.16);
  },

  // ---- LONGYEAR: the town
  'arc-house'(K, p, th, rng, H) {
    const col = HOUSE[(p.tint >= 0 ? p.tint : 0) % 8], stilt = Math.floor(Math.max(0, p.tint) / 8) / 4, h = p.thick;
    const fs = H.faces(p.w, p.d);
    F(K, H.box(p.w, h - 0.35, p.d, { y: -h / 2 - 0.175, color: col }));
    for (const f of fs) for (let k = 0; k <= Math.floor(f.width / 1.2); k++) { // vertical boarding
      const off = -f.width / 2 + k * 1.2;
      F(K, H.box(f.tx ? 0.08 : 0.05, h - 0.5, f.tz ? 0.08 : 0.05, { x: f.nx * (f.half + 0.02) + f.tx * off, y: -h / 2 - 0.2, z: f.nz * (f.half + 0.02) + f.tz * off, color: 0x000000 + ((col >> 1) & 0x7f7f7f) }));
    }
    F(K, H.box(p.w + 0.5, 0.35, p.d + 0.5, { y: -0.18, color: COL.offwhite })); // the eaves trim
    cap(K, H, p, COL.snow, 0.14, 0.3); // snow on the flat roof
    F(K, H.box(p.w + 0.6, 0.12, 0.3, { y: -0.36, z: p.d / 2 + 0.2, color: COL.snowSh }), H.box(p.w + 0.6, 0.12, 0.3, { y: -0.36, z: -p.d / 2 - 0.2, color: COL.snowSh }));
    windows(K, H, p, [0, 1], [-h * 0.42, -h * 0.78].filter((y) => y > -h + 0.9), 2.2, { w: 1.0, h: 1.1 });
    windows(K, H, p, [2, 3], [-h * 0.5], 2.6, { w: 0.9, h: 1.0 });
    // the stilts (permafrost: the house never touches the ground) and a stair up to the door
    const sx = p.w / 2 - 0.5, sz = p.d / 2 - 0.5;
    for (const x of [-sx, 0, sx]) for (const z of [-sz, sz]) F(K, H.box(0.32, stilt + 0.4, 0.32, { x, y: -h - stilt / 2 + 0.2, z, color: COL.woodDk }));
    F(K, H.box(p.w - 0.6, 0.16, 0.16, { y: -h - stilt * 0.5, z: sz, color: COL.wood }), H.box(p.w - 0.6, 0.16, 0.16, { y: -h - stilt * 0.5, z: -sz, color: COL.wood }));
    F(K, H.box(1.6, 0.2, 1.6, { x: sx - 1.2, y: -h + 0.05, z: p.d / 2 + 0.8, color: COL.woodLt })); // the porch
    for (let k = 1; k <= Math.ceil(stilt / 0.4); k++) F(K, H.box(1.2, 0.12, 0.4, { x: sx - 1.2, y: -h - k * 0.4 + 0.05, z: p.d / 2 + 1.6 + k * 0.4, color: COL.woodLt }));
    F(K, H.box(0.9, 1.9, 0.08, { x: sx - 1.2, y: -h + 1.05, z: p.d / 2 + 0.03, color: COL.woodDk }));
    G(K, H.box(0.3, 0.3, 0.3, { x: sx - 0.3, y: -h + 2.3, z: p.d / 2 + 0.2, color: COL.warm })); // the porch lamp
    F(K, H.cyl(0.18, 0.18, 1.2, 6, { x: -sx + 0.4, y: 0.6, z: -sz + 0.4, color: COL.steelDk })); // a stove pipe at the corner
  },
  'arc-centre'(K, p, th, rng, H) { // LOMPEN: dark timber cladding, a glass shop front, a lit sign
    body(K, H, p, 0x3a2a24);
    for (const f of H.faces(p.w, p.d)) for (let k = 0; k <= Math.floor(f.width / 2); k++) F(K, H.box(f.tx ? 0.1 : 0.06, p.thick - 1, f.tz ? 0.1 : 0.06, { x: f.nx * (f.half + 0.03) + f.tx * (-f.width / 2 + k * 2), y: -p.thick / 2 - 0.3, z: f.nz * (f.half + 0.03) + f.tz * (-f.width / 2 + k * 2), color: 0x5a4234 }));
    cap(K, H, p, COL.snow, 0.2, 0.3);
    F(K, H.box(p.w + 0.6, 0.5, p.d + 0.6, { y: -0.4, color: COL.offwhite }));
    G(K, H.box(p.w - 4, 2.4, 0.1, { y: -p.thick + 1.6, z: p.d / 2 + 0.06, color: 0xffe0a8 }), H.box(0.1, 2.4, p.d - 6, { x: p.w / 2 + 0.06, y: -p.thick + 1.6, color: 0xffe0a8 }));
    F(K, H.box(10, 1.6, 0.4, { y: -2.2, z: p.d / 2 + 0.3, color: COL.black }));
    G(K, H.box(9.2, 1.0, 0.1, { y: -2.2, z: p.d / 2 + 0.52, color: COL.cyan }));
    windows(K, H, p, [0, 3], [-4.2], 3, { w: 1.6, h: 1.2 });
  },
  'arc-church'(K, p, th, rng, H) { // Svalbard kirke: red timber, white trim, a steep roof line
    body(K, H, p, 0x9a2a22, { thick: p.thick });
    cap(K, H, p, COL.snow, 0.14, 0.3);
    F(K, H.box(p.w + 0.5, 0.3, p.d + 0.5, { y: -0.2, color: COL.white }));
    for (const f of H.faces(p.w, p.d)) for (const s of [-1, 1]) F(K, H.box(0.3, p.thick, 0.3, { x: f.nx * f.half + f.tx * s * (f.width / 2), y: -p.thick / 2, z: f.nz * f.half + f.tz * s * (f.width / 2), color: COL.white }));
    windows(K, H, p, [2, 3], [-3.5], 3.2, { w: 1.1, h: 2.4, frame: COL.white, on: 4 });
    windows(K, H, p, [1], [-4.8], 3.4, { w: 1.4, h: 1.4, frame: COL.white });
  },
  'arc-churchtower'(K, p, th, rng, H) {
    body(K, H, p, 0x9a2a22);
    cap(K, H, p, COL.snow, 0.12, 0.1);
    F(K, H.box(p.w + 0.3, 2.2, p.d + 0.3, { y: -1.4, color: COL.white })); // the belfry
    for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? 1.4 : 0.1, 1.2, f.tz ? 1.4 : 0.1, { x: f.nx * (f.half + 0.18), y: -1.4, z: f.nz * (f.half + 0.18), color: COL.black }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.part(new THREE.ConeGeometry(0.45, 1.6, 4), { x: sx * (p.w / 2 - 0.3), y: 0.8, z: sz * (p.d / 2 - 0.3), ry: Math.PI / 4, color: 0x9a2a22 }));
    G(K, H.box(0.5, 0.5, 0.5, { x: p.w / 2 - 0.3, y: 1.9, z: p.d / 2 - 0.3, color: COL.warm }));
    windows(K, H, p, [0, 1, 2, 3], [-5, -9], 2, { w: 0.8, h: 1.6, frame: COL.white, on: 2 });
  },
  'arc-steps'(K, p, th, rng, H) { body(K, H, p, COL.woodDk); cap(K, H, p, COL.snow, 0.06, 0.02); F(K, H.box(p.w, 0.06, 0.12, { y: -0.03, z: -p.d / 2 + 0.06, color: COL.yellow })); },
  'arc-bridge'(K, p, th, rng, H) {
    body(K, H, p, COL.steel);
    cap(K, H, p, COL.snowSh, 0.08);
    rails(K, H, p, COL.yellow, p.w > p.d ? [0, 1] : [2, 3], 1.0);
    for (const x of [-p.w / 2 + 1, p.w / 2 - 1]) for (const z of [-p.d / 2 + 1, p.d / 2 - 1]) F(K, H.box(0.6, 3, 0.6, { x, y: -p.thick - 1.5, z, color: COL.concreteDk }));
    G(K, H.box(0.3, 0.3, 0.3, { x: 0, y: 1.6, z: p.d / 2 - 0.1, color: COL.warm }));
  },
  'arc-bearsign'(K, p, th, rng, H) { // ⚠ polar bears: the triangle, the bear, the white plate (GJELDER HELE SVALBARD)
    F(K, H.box(p.w, p.thick, 0.12, { y: -p.thick / 2, color: COL.white }));
    for (const s of [-1, 1]) F(K, H.box(0.14, 3.9, 0.14, { x: s * (p.w / 2 - 0.3), y: -p.thick - 1.2, color: COL.steelDk }));
    for (const s of [-1, 1]) {
      const z = s * 0.08;
      F(K, H.box(p.w - 0.3, 0.08, 0.04, { y: -p.thick + 0.15, z, color: COL.red }));
      for (const r of [-1, 1]) F(K, H.box(0.08, 1.45, 0.04, { x: r * 0.66, y: -0.68, z, rz: r * 0.5, color: COL.red }));
      // the bear: body, head, legs
      F(K, H.box(0.9, 0.36, 0.04, { y: -0.95, z: z * 1.4, color: COL.black }), H.box(0.32, 0.26, 0.04, { x: 0.55, y: -0.86, z: z * 1.4, color: COL.black }));
      for (const lx of [-0.35, -0.15, 0.15, 0.35]) F(K, H.box(0.1, 0.26, 0.04, { x: lx, y: -1.18, z: z * 1.4, color: COL.black }));
    }
  },
  'arc-snowmobile'(K, p, th, rng, H) {
    const col = MOBILE[(p.tint >= 0 ? p.tint : 0) % MOBILE.length];
    F(K, H.box(p.w, p.thick * 0.7, p.d, { y: -p.thick * 0.35, color: col }));
    F(K, H.box(p.w * 0.7, 0.08, p.d * 0.6, { y: 0.005, z: 0.3, color: COL.black })); // the seat pad (flush)
    F(K, H.box(p.w + 0.1, 0.25, 0.8, { y: -p.thick * 0.55, z: -p.d / 2 + 0.3, color: COL.black }));
    K.add('glass', H.box(p.w * 0.8, 0.45, 0.08, { y: 0.15, z: -p.d / 2 + 0.2, rx: -0.5 }));
    for (const s of [-1, 1]) F(K, H.box(0.18, 0.12, p.d + 0.5, { x: s * (p.w / 2 - 0.1), y: -p.thick + 0.06, z: -0.1, color: COL.steelDk }));
    G(K, H.box(0.5, 0.2, 0.06, { y: -0.35, z: -p.d / 2 - 0.02, color: COL.warm }), H.box(0.9, 0.12, 0.06, { y: -0.3, z: p.d / 2 + 0.02, color: COL.beacon }));
    jets(K, H, [[0, -p.d * 0.3], [0, p.d * 0.3]], -p.thick - 0.02, 0.38);
  },
  'arc-sled'(K, p, th, rng, H) {
    F(K, H.box(p.w, 0.3, p.d, { y: -0.15, color: COL.woodLt }));
    for (let z = -p.d / 2 + 0.4; z < p.d / 2; z += 0.8) F(K, H.box(p.w + 0.06, 0.06, 0.12, { y: 0.0, z, color: COL.wood }));
    F(K, H.box(p.w - 0.4, p.thick - 0.3, p.d - 0.4, { y: -0.3 - (p.thick - 0.3) / 2, color: COL.steelDk }));
    for (const s of [-1, 1]) F(K, H.box(0.16, 0.16, p.d + 0.8, { x: s * (p.w / 2 - 0.2), y: -p.thick + 0.1, z: -0.2, color: COL.steelLt }));
    F(K, H.box(0.2, 0.2, 1.6, { y: -0.5, z: -p.d / 2 - 0.8, color: COL.steelDk }));
    G(K, H.box(p.w * 0.6, 0.1, 0.06, { y: -0.2, z: p.d / 2 + 0.02, color: COL.beacon }));
    jets(K, H, [[-p.w * 0.25, -p.d * 0.3], [p.w * 0.25, -p.d * 0.3], [-p.w * 0.25, p.d * 0.3], [p.w * 0.25, p.d * 0.3]], -p.thick - 0.02);
  },
  'arc-crate'(K, p, th, rng, H) {
    const col = CRATE[(p.tint >= 0 ? p.tint : 0) % 8];
    if (p.tint === 1 || p.tint === 6) { // fuel drums on a pallet
      F(K, H.box(p.w, 0.2, p.d, { y: -p.thick + 0.1, color: COL.woodLt }));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, H.cyl(p.w * 0.23, p.w * 0.23, p.thick - 0.25, 8, { x: sx * p.w * 0.24, y: -(p.thick - 0.2) / 2 + 0.02, z: sz * p.d * 0.24, color: col }));
      F(K, H.box(p.w - 0.1, 0.06, p.d - 0.1, { y: -0.03, color: COL.steelDk }));
    } else {
      body(K, H, p, col);
      for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width + 0.05 : 0.06, 0.14, f.tz ? f.width + 0.05 : 0.06, { x: f.nx * (f.half + 0.02), y: -p.thick / 2, z: f.nz * (f.half + 0.02), color: 0x2a2a2a }));
    }
    cap(K, H, p, COL.snow, 0.08, 0.02);
  },
  'arc-quay'(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 8, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: 0x9aa2ac });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    F(K, H.box(p.w + 0.05, 0.08, p.d + 0.05, { y: 0.005, color: COL.snowSh }));
    for (const f of H.faces(p.w, p.d)) {
      const n = Math.floor(f.width / 2);
      for (let k = 0; k < n; k++) F(K, H.box(f.tx ? f.width / n : 0.4, 0.06, f.tz ? f.width / n : 0.4, { x: f.nx * (f.half - 0.2) + f.tx * (-f.width / 2 + (k + 0.5) * f.width / n), y: 0.04, z: f.nz * (f.half - 0.2) + f.tz * (-f.width / 2 + (k + 0.5) * f.width / n), color: k % 2 ? COL.black : COL.yellow }));
      for (let k = 0; k < Math.floor(f.width / 6); k++) F(K, H.cyl(0.6, 0.6, 1.2, 8, { x: f.nx * (f.half + 0.3) + f.tx * (-f.width / 2 + 3 + k * 6), y: -1.4, z: f.nz * (f.half + 0.3) + f.tz * (-f.width / 2 + 3 + k * 6), rz: f.tz ? Math.PI / 2 : 0, rx: f.tx ? Math.PI / 2 : 0, color: COL.black }));
    }
    for (const [x, z] of [[-p.w / 2 + 1.5, -p.d / 2 + 4], [p.w / 2 - 1.5, -p.d / 2 + 14], [-p.w / 2 + 1.5, p.d / 2 - 10]]) { F(K, H.box(0.2, 6, 0.2, { x, y: 3, z, color: COL.steelDk })); G(K, H.box(0.9, 0.3, 0.6, { x, y: 6, z, color: COL.warm })); }
  },

  // ---- the coal tramway
  'arc-tramcentral'(K, p, th, rng, H) { // TAUBANESENTRALEN: a timber station on a timber trestle
    const stilt = Math.max(0, p.tint) / 10;
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.wood }));
    for (const f of H.faces(p.w, p.d)) for (let k = 0; k <= Math.floor(f.width / 0.9); k++) F(K, H.box(f.tx ? 0.1 : 0.05, p.thick, f.tz ? 0.1 : 0.05, { x: f.nx * (f.half + 0.02) + f.tx * (-f.width / 2 + k * 0.9), y: -p.thick / 2, z: f.nz * (f.half + 0.02) + f.tz * (-f.width / 2 + k * 0.9), color: COL.woodDk }));
    cap(K, H, p, COL.snow, 0.16, 0.4);
    F(K, H.box(0.3, 4, 5, { x: -p.w / 2 - 0.1, y: -3.4, color: COL.black })); // the cable mouth (west)
    windows(K, H, p, [0, 1], [-2.6], 3.4, { w: 1.4, h: 0.9, frame: COL.woodLt });
    const leg = (x, z) => F(K, H.box(0.5, stilt, 0.5, { x, y: -p.thick - stilt / 2, z, color: COL.woodDk }));
    for (let x = -p.w / 2 + 0.5; x <= p.w / 2; x += (p.w - 1) / 3) for (const z of [-p.d / 2 + 0.5, p.d / 2 - 0.5]) leg(x, z);
    for (let y = -p.thick - 1.5; y > -p.thick - stilt; y -= 2.2) for (const z of [-p.d / 2 + 0.5, p.d / 2 - 0.5]) F(K, H.box(p.w - 1, 0.2, 0.2, { y, z, rz: 0.25, color: COL.woodLt }));
    G(K, H.box(0.5, 0.5, 0.5, { x: p.w / 2 - 0.4, y: 0.6, z: p.d / 2 - 0.4, color: COL.beacon }));
  },
  'arc-minestation'(K, p, th, rng, H) { // the mine's top station, half buried in the mountain snow
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.woodDk }));
    for (const f of H.faces(p.w, p.d)) for (let k = 0; k <= Math.floor(f.width / 1.1); k++) F(K, H.box(f.tx ? 0.12 : 0.05, p.thick - 0.4, f.tz ? 0.12 : 0.05, { x: f.nx * (f.half + 0.02) + f.tx * (-f.width / 2 + k * 1.1), y: -p.thick / 2, z: f.nz * (f.half + 0.02) + f.tz * (-f.width / 2 + k * 1.1), color: COL.wood }));
    cap(K, H, p, COL.snow, 0.2, 0.4);
    F(K, H.box(0.3, 3.6, 6, { x: p.w / 2 + 0.05, y: -2.6, z: 2, color: COL.black })); // where the cable comes in (east)
    windows(K, H, p, [1, 3], [-3.2], 3, { w: 1.2, h: 1.0, frame: COL.woodLt });
    F(K, H.box(p.w + 1.5, 1.6, p.d + 1.5, { y: -p.thick + 0.6, color: COL.snowSh })); // drifted snow round its foot
    F(K, H.box(4, 0.8, 1.2, { y: -1.0, z: -p.d / 2 - 0.4, color: COL.white }), H.box(3.4, 0.4, 0.06, { y: -1.0, z: -p.d / 2 - 1.02, color: COL.black }));
    G(K, H.box(3.2, 0.25, 0.08, { y: -1.0, z: -p.d / 2 - 1.06, color: COL.warm }));
  },
  'arc-trestle'(K, p, th, rng, H) { // a timber trestle of the coal tramway, the deck on top, the cable arm above it
    const Ht = Math.max(4, p.tint), spread = 0.09 * Ht;
    F(K, H.box(p.w, 0.3, p.d, { y: -0.15, color: COL.woodLt }), H.box(p.w + 0.1, 0.06, p.d + 0.1, { y: 0.0, color: COL.snow }));
    const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [sx, sz] of legs) {
      const x0 = sx * (p.w / 2 - 0.2), z0 = sz * (p.d / 2 - 0.2), x1 = sx * (p.w / 2 - 0.2 + spread), z1 = sz * (p.d / 2 - 0.2 + spread);
      const len = Math.sqrt((x1 - x0) * (x1 - x0) + Ht * Ht + (z1 - z0) * (z1 - z0));
      F(K, H.box(0.3, len, 0.3, { x: (x0 + x1) / 2, y: -Ht / 2, z: (z0 + z1) / 2, rz: Math.atan2(x1 - x0, Ht), rx: -Math.atan2(z1 - z0, Ht), color: COL.woodDk }));
    }
    for (let y = -2.5; y > -Ht + 0.5; y -= 3.2) { // braces: a frame and an X each storey
      const k = -y / Ht, hw = p.w / 2 - 0.2 + spread * k, hd = p.d / 2 - 0.2 + spread * k;
      for (const sz of [-1, 1]) F(K, H.box(hw * 2, 0.18, 0.18, { y, z: sz * hd, color: COL.wood }));
      for (const sx of [-1, 1]) F(K, H.box(0.18, 0.18, hd * 2, { x: sx * hw, y, color: COL.wood }));
      for (const sz of [-1, 1]) F(K, H.box(hw * 2.3, 0.12, 0.12, { y: y - 1.5, z: sz * hd, rz: (sz > 0 ? 1 : -1) * 0.75, color: COL.woodLt }));
    }
    // the cross-arm with sheaves for the cable on both sides, and a lamp
    F(K, H.box(0.4, 2.6, 0.4, { y: 1.3, color: COL.woodDk }), H.box(0.4, 0.4, 7.2, { y: 2.5, color: COL.woodDk }));
    for (const s of [-1, 1]) F(K, H.cyl(0.45, 0.45, 0.2, 10, { y: 2.2, z: s * 2.9, rz: Math.PI / 2, color: COL.steelDk }));
    G(K, H.box(0.3, 0.3, 0.3, { y: 2.9, color: COL.warm }));
  },
  'arc-bucket'(K, p, th, rng, H) { // a coal hopper hanging from the cable (you ride in its coal)
    const hang = Math.abs(p.tint) / 10, side = p.tint < 0 ? -1 : 1;
    F(K, H.part(new THREE.CylinderGeometry(1.7, 1.15, p.thick, 4, 1), { y: -p.thick / 2, ry: Math.PI / 4, color: 0x7a3a24 }));
    F(K, H.box(p.w - 0.2, 0.1, p.d - 0.2, { y: -0.12, color: COL.black })); // the coal (where you stand)
    F(K, H.box(p.w, 0.12, 0.12, { y: -0.02, z: p.d / 2 - 0.06, color: 0x5a2a18 }), H.box(p.w, 0.12, 0.12, { y: -0.02, z: -p.d / 2 + 0.06, color: 0x5a2a18 }));
    F(K, H.box(0.12, 0.12, p.d, { x: p.w / 2 - 0.06, y: -0.02, color: 0x5a2a18 }), H.box(0.12, 0.12, p.d, { x: -p.w / 2 + 0.06, y: -0.02, color: 0x5a2a18 }));
    // the hanger: a bar up the outer side (away from the trestles), over to the carriage riding the cable above
    const hz = side * (p.d / 2 + 0.15);
    F(K, H.box(0.14, hang, 0.14, { y: hang / 2, z: hz, color: COL.steelDk }), H.box(0.14, 0.14, Math.abs(hz), { y: hang, z: hz / 2, color: COL.steelDk }));
    F(K, H.box(1.6, 0.4, 0.3, { y: hang + 0.1, color: COL.steelDk }));
    for (const s of [-1, 1]) F(K, H.cyl(0.25, 0.25, 0.12, 8, { x: s * 0.6, y: hang + 0.3, rx: Math.PI / 2, color: COL.steel }));
  },

  // ---- the satellite station on the plateau
  'arc-radome'(K, p, th, rng, H) { // a white radome: a faceted sphere of radius R on its drum (the tiers are hidden collision)
    const R = Math.floor(p.tint / 1000) / 10, drum = (p.tint % 1000) / 10;
    F(K, H.part(new THREE.IcosahedronGeometry(R, 2), { y: -R, color: COL.white }));
    F(K, H.cyl(R + 0.02, R + 0.25, drum + 0.4, H.seg(24, 14), { y: -R - drum / 2 - 0.2, color: COL.concrete }));
    F(K, H.cyl(R + 0.35, R + 0.35, 0.3, H.seg(24, 14), { y: -R - 0.1, color: COL.offwhite }));
    F(K, H.box(1.4, 2.2, 0.3, { y: -R - drum + 1.1, z: R + 0.2, color: COL.steelDk })); // the door
    G(K, H.box(0.35, 0.35, 0.35, { y: 0.2, color: COL.beacon }));
    G(K, H.box(0.6, 0.2, 0.2, { y: -R - drum + 2.4, z: R + 0.3, color: COL.warm }));
  },
  'arc-ops'(K, p, th, rng, H) {
    body(K, H, p, COL.offwhite);
    cap(K, H, p, COL.snow, 0.16, 0.2);
    bands(K, H, p, -0.6, -p.thick, 2.8, COL.concreteDk, 0.2);
    windows(K, H, p, [0, 1, 2, 3], [-2.2, -5.0], 2.4, { w: 1.6, h: 1.0, lit: 0x9ad8ff, frame: COL.steelDk });
    for (const [x, z] of [[-p.w / 2 + 1.5, -p.d / 2 + 1.5], [p.w / 2 - 1.5, p.d / 2 - 1.5]]) { F(K, H.box(0.12, 4, 0.12, { x, y: 2, z, color: COL.steelDk })); G(K, H.box(0.25, 0.25, 0.25, { x, y: 4.1, z, color: COL.beacon })); }
  },
  'arc-mast'(K, p, th, rng, H) { // a lattice antenna mast: legs, bracing, dishes, red lights
    const Ht = p.thick;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.box(0.18, Ht, 0.18, { x: sx * (p.w / 2 - 0.1), y: -Ht / 2, z: sz * (p.d / 2 - 0.1), color: COL.steelLt }));
    for (let y = -1.5; y > -Ht; y -= 2.4) for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width * 1.3 : 0.07, 0.07, f.tz ? f.width * 1.3 : 0.07, { x: f.nx * (f.half - 0.1), y, z: f.nz * (f.half - 0.1), rz: f.tx ? 0.6 : 0, rx: f.tz ? 0.6 : 0, color: COL.steel }));
    F(K, H.box(p.w, 0.15, p.d, { y: -0.08, color: COL.steelDk }));
    for (const [y, a] of [[-5, 0.4], [-9, 2.2], [-13, 4.1]]) F(K, H.part(new THREE.SphereGeometry(1.2, 8, 4, 0, Math.PI * 2, 0, 1.0), { x: Math.cos(a) * 1.8, y, z: Math.sin(a) * 1.8, rz: Math.PI / 2, ry: -a, color: COL.white }));
    for (const y of [0.4, -6, -12]) G(K, H.box(0.3, 0.3, 0.3, { y, x: p.w / 2, color: COL.beacon }));
  },

  // ---- ships: the coast guard icebreaker (tint 0) and the research icebreaker (tint 1)
  'arc-hull'(K, p, th, rng, H) {
    const cg = p.tint !== 1, hullCol = cg ? 0x3c4552 : COL.red;
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: hullCol }));
    F(K, H.box(p.w + 0.06, 1.2, p.d + 0.06, { y: -p.thick + 2.4, color: cg ? COL.redDk : COL.black })); // the boot-topping at the waterline
    F(K, H.box(p.w - 0.1, 0.06, p.d - 0.1, { y: 0.005, color: 0x4a5a52 })); // the deck (non-slip green)
    rails(K, H, p, COL.white, [2, 3], 0.9);
    for (const sx of [-1, 1]) for (let z = -p.d / 2 + 3; z < p.d / 2 - 2; z += 3.2) G(K, H.cyl(0.18, 0.18, 0.06, 6, { x: sx * (p.w / 2 + 0.03), y: -1.6, z, rz: Math.PI / 2, color: COL.warm }));
    if (cg) for (const sx of [-1, 1]) for (const [c, o] of [[COL.red, 0], [COL.white, 0.9], [0x2a4ab0, 1.6]]) F(K, H.box(0.06, 4.6, 0.7, { x: sx * (p.w / 2 + 0.04 + o * 0.001), y: -2.6, z: -p.d / 2 + 6 + o * 0.9, rx: 0.55, color: c })); // the diagonal stripe
    else for (const sx of [-1, 1]) F(K, H.box(0.06, 0.5, p.d * 0.7, { x: sx * (p.w / 2 + 0.03), y: -1.0, color: COL.white }));
  },
  'arc-aftdeck'(K, p, th, rng, H) {
    STYLES['arc-hull'](K, p, th, rng, H);
    for (let x = -p.w / 2 + 1.5; x < p.w / 2; x += 3) F(K, H.box(0.12, 0.02, p.d - 1, { x, y: 0.02, color: COL.yellow }));
  },
  'arc-bow'(K, p, th, rng, H) { // the forecastle and the raked ice-breaking bow (nose toward -z)
    const g = new THREE.BoxGeometry(p.w, p.thick, p.d, 1, 1, 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i), y = pos.getY(i);
      if (z < -p.d * 0.49) { pos.setX(i, pos.getX(i) * 0.25); if (y < 0) pos.setZ(i, z + p.d * 0.35); } // the stem, raked back under the water
      else if (z < 0.01 && z > -0.01) pos.setX(i, pos.getX(i) * 0.92);
    }
    g.computeVertexNormals();
    F(K, H.part(g, { y: -p.thick / 2, color: p.tint === 1 ? COL.red : 0x3c4552 }));
    F(K, H.box(p.w * 0.6, 0.06, p.d * 0.5, { y: 0.005, z: p.d * 0.2, color: 0x4a5a52 }));
    F(K, H.box(1.2, 0.8, 1.2, { y: -0.4 + 0.4, z: p.d / 2 - 2, color: COL.steelDk })); // the anchor winch (at the aft edge)
    G(K, H.box(0.3, 0.3, 0.3, { y: 1.4, z: -p.d / 2 + 1.2, color: COL.white }));
  },
  'arc-helideck'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x2e3a36 }));
    F(K, H.part(new THREE.TorusGeometry(Math.min(p.w, p.d) * 0.38, 0.18, 3, H.seg(24, 14)), { rx: Math.PI / 2, y: 0.03, color: COL.yellow }));
    F(K, H.box(0.6, 0.04, 3.2, { x: -0.9, y: 0.03, color: COL.white }), H.box(0.6, 0.04, 3.2, { x: 0.9, y: 0.03, color: COL.white }), H.box(1.4, 0.04, 0.5, { y: 0.03, color: COL.white }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; G(K, H.box(0.2, 0.1, 0.2, { x: Math.cos(a) * (p.w / 2 - 0.4), y: 0.06, z: Math.sin(a) * (p.d / 2 - 0.4), color: k % 2 ? COL.green : COL.cyan })); }
    for (const sx of [-1, 1]) F(K, H.box(0.3, 2.2, 0.3, { x: sx * (p.w / 2 - 1), y: -p.thick - 1.1, z: p.d / 2 - 1.5, rx: 0.5, color: COL.steelDk }));
  },
  'arc-superstructure'(K, p, th, rng, H) {
    body(K, H, p, COL.white);
    F(K, H.box(p.w + 0.1, 1.3, p.d + 0.1, { y: -1.0, color: 0x1e2a36 })); // the bridge windows band
    G(K, H.box(p.w + 0.14, 0.12, p.d + 0.14, { y: -1.0, color: 0x9ad8ff }));
    cap(K, H, p, COL.snowSh, 0.08, 0.05);
    windows(K, H, p, [0, 1, 2, 3], [-3.4, -5.6], 2.2, { w: 0.9, h: 0.8, frame: COL.offwhite });
    if (p.tint === 0) F(K, H.box(p.w + 0.08, 0.4, p.d + 0.08, { y: -2.4, color: COL.red }));
    rails(K, H, p, COL.white, [0, 1, 2, 3], 0.9);
  },
  'arc-bridgewing'(K, p, th, rng, H) { body(K, H, p, COL.white); F(K, H.box(p.w + 0.06, 1.0, p.d + 0.06, { y: -0.8, color: 0x1e2a36 })); G(K, H.box(0.3, 0.3, 0.3, { x: p.tint === 1 ? p.w / 2 : -p.w / 2, y: 0.3, color: p.tint === 1 ? 0x2aff6a : COL.beacon })); },
  'arc-bridgetop'(K, p, th, rng, H) {
    body(K, H, p, COL.white); F(K, H.box(p.w + 0.1, 1.2, p.d + 0.1, { y: -1.3, color: 0x1e2a36 })); G(K, H.box(p.w + 0.14, 0.1, p.d + 0.14, { y: -1.3, color: 0x9ad8ff }));
    rails(K, H, p, COL.white, [0, 1, 2, 3], 0.9);
    for (const [x, z] of [[-p.w / 2 + 0.6, p.d / 2 - 0.6], [p.w / 2 - 0.6, p.d / 2 - 0.6]]) F(K, H.box(0.12, 2.4, 0.12, { x, y: 1.2, z, color: COL.steelDk }), H.box(1.6, 0.15, 0.3, { x, y: 2.4, z, color: COL.steelDk }));
  },
  'arc-funnel'(K, p, th, rng, H) {
    body(K, H, p, p.tint === 1 ? COL.red : 0x9aa4ae);
    F(K, H.box(p.w + 0.06, 0.9, p.d + 0.06, { y: -1.6, color: p.tint === 1 ? COL.white : COL.red }));
    F(K, H.box(p.w + 0.1, 0.5, p.d + 0.1, { y: -0.25, color: COL.black }));
  },
  'arc-mastpole'(K, p, th, rng, H) { // the mast rises on above its own collision top, through the platforms
    const up = p.tint === 1 ? 6.4 : 10;
    F(K, H.box(p.w * 0.6, p.thick + up, p.d * 0.6, { y: (up - p.thick) / 2, color: COL.offwhite }));
    F(K, H.box(4.4, 0.25, 0.4, { y: up - 1.2, color: COL.steelDk }), H.box(0.15, 1.6, 0.15, { y: up + 0.8, color: COL.steelDk }));
    G(K, H.box(0.35, 0.35, 0.35, { y: up + 1.7, color: COL.beacon }), H.box(0.25, 0.25, 0.25, { x: 2.0, y: up - 0.9, color: 0x2aff6a }), H.box(0.25, 0.25, 0.25, { x: -2.0, y: up - 0.9, color: COL.beacon }));
  },
  'arc-mastdeck'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.steelDk }));
    F(K, H.box(p.w - 0.1, 0.04, p.d - 0.1, { y: 0.0, color: COL.steel }));
    rails(K, H, p, COL.yellow, [0, 1, 2, 3], 0.8);
    G(K, H.box(0.25, 0.25, 0.25, { x: p.w / 2, y: -0.3, z: p.d / 2, color: COL.warm }));
  },
  'arc-aframe'(K, p, th, rng, H) { // the research ship's stern A-frame (its legs stand on the aft deck)
    const leg = 7.4;
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xf08a1a }));
    for (const s of [-1, 1]) F(K, H.box(0.9, leg, 0.9, { x: s * (p.w / 2 - 0.5), y: -p.thick - leg / 2 + 0.2, z: -1.2, rx: -0.3, color: 0xf08a1a }));
    F(K, H.box(0.12, 4, 0.12, { y: -p.thick - 2, color: COL.steelDk }), H.box(0.8, 0.6, 0.8, { y: -p.thick - 4.2, color: COL.yellow }));
    G(K, H.box(0.4, 0.3, 0.3, { y: 0.2, x: p.w / 2 - 0.4, color: COL.warm }), H.box(0.4, 0.3, 0.3, { y: 0.2, x: -p.w / 2 + 0.4, color: COL.warm }));
  },
  'arc-cranejib'(K, p, th, rng, H) { // a deck crane's jib swung out over the ice (its boom runs back down to the deck)
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.yellow }));
    for (let z = -p.d / 2 + 1; z < p.d / 2; z += 2) F(K, H.box(p.w * 0.9, 0.08, 0.3, { y: 0.01, z, color: COL.black }));
    F(K, H.box(0.5, 4.6, 0.5, { y: -2.4, z: p.d / 2 + 1.0, rx: -0.4, color: COL.yellow })); // the boom to the pedestal
    F(K, H.box(0.08, 3, 0.08, { y: -1.5 - p.thick, z: -p.d / 2 + 0.4, color: COL.steelDk }), H.box(0.6, 0.5, 0.6, { y: -3.2 - p.thick, z: -p.d / 2 + 0.4, color: COL.red }));
    G(K, H.box(0.3, 0.3, 0.3, { y: 0.2, z: -p.d / 2 + 0.2, color: COL.warm }));
  },
  'arc-winch'(K, p, th, rng, H) {
    body(K, H, p, COL.yellow);
    for (const s of [-1, 1]) F(K, H.cyl(1.0, 1.0, 1.0, 10, { x: s * (p.w / 2 + 0.5), y: -1.2, rz: Math.PI / 2, color: COL.steelDk }));
    F(K, H.box(p.w + 0.05, 0.4, p.d + 0.05, { y: -p.thick + 0.2, color: COL.black }));
    windows(K, H, p, [0, 1], [-1.2], 2.4, { w: 1.2, h: 0.7 });
  },

  // ---- ice: floes, bergs, seracs, the glacier
  'arc-floe'(K, p, th, rng, H) {
    const top = p.tint % 2 ? COL.snow : 0xe4eef6;
    if (p.kind === 'disc') {
      F(K, lumpy(H.cyl(p.r, p.r * 1.06, p.thick, 7, { y: -p.thick / 2, color: COL.iceMid }), rng, 0.4));
      F(K, H.cyl(p.r + 0.05, p.r + 0.05, 0.14, 7, { y: -0.06, color: top }));
    } else {
      F(K, lumpy(H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.iceMid }), rng, 0.45));
      F(K, H.box(p.w + 0.08, 0.14, p.d + 0.08, { y: -0.06, color: top }));
      for (let k = 0; k < 3; k++) F(K, lumpy(H.box(0.8 + rng() * 1.2, 0.6, 0.8 + rng() * 1.2, { x: (rng() - 0.5) * p.w, y: -0.55, z: (rng() > 0.5 ? 1 : -1) * (p.d / 2 + 0.3), color: COL.ice }), rng, 0.3, false));
    }
    F(K, H.box(p.kind === 'disc' ? p.r * 2.1 : p.w + 0.4, 0.3, p.kind === 'disc' ? p.r * 2.1 : p.d + 0.4, { y: -0.7, color: COL.iceDk })); // the sea-line slush
  },
  'arc-berg'(K, p, th, rng, H) {
    F(K, lumpy(H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: p.tint ? COL.iceMid : COL.ice }), rng, p.tint ? 1.2 : 0.6));
    cap(K, H, p, COL.snow, 0.3, 0.05);
    bands(K, H, p, -1.2, -p.thick + 1, 2.3, COL.iceDk, 0.18, 0.08);
    for (let k = 0; k < 4; k++) F(K, lumpy(H.box(1.5 + rng() * 2, 2 + rng() * 3, 1.5 + rng() * 2, { x: (rng() - 0.5) * p.w, y: -p.thick + 1.8, z: (rng() - 0.5) * p.d, color: COL.iceMid }), rng, 0.6, false));
  },
  'arc-serac'(K, p, th, rng, H) {
    F(K, lumpy(H.cyl(p.r, p.r * 1.15, p.thick, 7, { y: -p.thick / 2, color: [COL.ice, COL.iceMid, 0xa8dcee][p.tint % 3] }), rng, 0.5));
    F(K, H.cyl(p.r + 0.04, p.r + 0.04, 0.12, 7, { y: -0.05, color: COL.snow }));
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + rng(); F(K, H.part(new THREE.ConeGeometry(0.35, 1.0, 4), { x: Math.cos(a) * (p.r + 0.15), y: -0.3, z: Math.sin(a) * (p.r + 0.15), rz: Math.cos(a) * 0.5, rx: -Math.sin(a) * 0.5, color: COL.ice })); }
  },
  'arc-glacier'(K, p, th, rng, H) { // a block of the glacier: snow on top, blue ice walls with strata, darker in the deep
    const g = H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.iceMid });
    H.bandColors(g, 0, [[1.2, COL.snowSh], [8, 0x9ad4e8], [20, COL.iceMid], [32, COL.iceDk], [999, COL.iceDeep]]);
    F(K, g);
    cap(K, H, p, COL.snow, 0.6, 0.1);
    bands(K, H, p, -3.5, -p.thick + 2, 4.3, 0xcfeaf4, 0.4, 0.06); // pale strata
    bands(K, H, p, -10.5, -p.thick + 2, 9, 0x5f7f90, 0.5, 0.07); // dirty moraine bands
    for (const f of H.faces(p.w, p.d)) { // vertical seracs and runnels in the walls
      const n = Math.floor(f.width / 7);
      for (let k = 0; k < n; k++) {
        const off = -f.width / 2 + (k + 0.5) * (f.width / n) + (rng() - 0.5) * 3, h = 6 + rng() * Math.min(26, p.thick - 6), w = 1.5 + rng() * 3;
        F(K, H.box(f.tx ? w : 0.7, h, f.tz ? w : 0.7, { x: f.nx * (f.half + 0.2) + f.tx * off, y: -0.8 - h / 2 - rng() * 4, z: f.nz * (f.half + 0.2) + f.tz * off, color: rng() < 0.5 ? 0xa8dcee : COL.iceMid }));
      }
      for (let k = 0; k < Math.floor(f.width / 12); k++) G(K, H.box(f.tx ? 2 + rng() * 3 : 0.1, 0.3 + rng() * 0.5, f.tz ? 2 + rng() * 3 : 0.1, { x: f.nx * (f.half + 0.12) + f.tx * (rng() - 0.5) * (f.width - 4), y: -12 - rng() * Math.max(1, p.thick - 16), z: f.nz * (f.half + 0.12) + f.tz * (rng() - 0.5) * (f.width - 4), color: 0x2a9ac8 })); // light glowing through the ice
    }
  },
  'arc-icecave'(K, p, th, rng, H) { // the cave floor in the ice front: blue ice, glowing crystals along the walls
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.iceMid }));
    F(K, H.box(p.w + 0.05, 0.1, p.d + 0.05, { y: -0.03, color: 0xb8e2f0 }));
    for (let k = 0; k < 14; k++) {
      const s = k % 2 ? 1 : -1, z = -p.d / 2 + 2 + (k / 14) * (p.d - 4), h = 1 + rng() * 2.4;
      G(K, H.part(new THREE.ConeGeometry(0.3 + rng() * 0.3, h, 4), { x: s * (p.w / 2 - 0.4), y: h / 2, z, rz: -s * 0.3, color: k % 3 ? 0x6af0ff : 0xa0ffe0 }));
    }
  },
  'arc-ledge'(K, p, th, rng, H) { // a shelf of blue ice on the calving face, icicles under it
    F(K, lumpy(H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: p.tint === 1 ? 0x9ad4e8 : COL.ice }), rng, 0.35));
    cap(K, H, p, COL.snow, 0.12, 0.02);
    icicles(K, H, p, rng, -p.thick, Math.max(1, Math.floor(p.w / 2)), 1.6);
    F(K, H.part(new THREE.ConeGeometry(Math.min(p.w, 6) * 0.4, 2.2, 4), { y: -p.thick - 1, rx: Math.PI, ry: Math.PI / 4, color: COL.iceMid }));
  },
  'arc-snowbridge'(K, p, th, rng, H) { // a crust of snow over the crevasse (it sags a little in the middle)
    F(K, H.box(p.w, 0.5, p.d, { y: -0.25, color: COL.snow }));
    F(K, H.box(p.w * 0.85, p.thick - 0.5, p.d * 0.9, { y: -0.5 - (p.thick - 0.5) / 2, color: COL.snowSh }));
    F(K, H.box(p.w * 0.7, 0.8, p.d * 0.5, { y: -p.thick - 0.3, color: COL.snowDk })); // the sag
    F(K, H.box(0.06, 0.02, p.d * 0.7, { x: p.w * 0.15, y: 0.01, rz: 0, ry: 0.1, color: COL.snowDk })); // a crack
    icicles(K, H, p, rng, -p.thick, 2, 1.2);
  },

  // ---- the drilling camp on the glacier
  'arc-drillhut'(K, p, th, rng, H) {
    body(K, H, p, 0xd8402a);
    for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width + 0.04 : 0.06, 0.16, f.tz ? f.width + 0.04 : 0.06, { x: f.nx * (f.half + 0.02), y: -p.thick * 0.5, z: f.nz * (f.half + 0.02), color: COL.white }));
    cap(K, H, p, COL.snow, 0.16, 0.15);
    windows(K, H, p, [1, 2], [-1.6], 2.6, { w: 1.0, h: 0.8 });
    F(K, H.cyl(0.25, 0.25, 1.4, 6, { x: -p.w / 2 + 0.6, y: 0.7, z: -p.d / 2 + 0.6, color: COL.steelDk }));
  },
  'arc-derrick'(K, p, th, rng, H) { // the ice-core drill: its floor, and the lattice derrick standing over the decks above
    body(K, H, p, COL.steelDk);
    F(K, H.box(p.w - 0.1, 0.06, p.d - 0.1, { y: 0.0, color: COL.steel }));
    const up = 11.4, top = 1.2;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x0 = sx * (p.w / 2 - 0.15), z0 = sz * (p.d / 2 - 0.15), x1 = sx * top, z1 = sz * top;
      const len = Math.sqrt((x1 - x0) * (x1 - x0) + up * up + (z1 - z0) * (z1 - z0));
      F(K, H.box(0.22, len, 0.22, { x: (x0 + x1) / 2, y: up / 2, z: (z0 + z1) / 2, rz: -Math.atan2(x1 - x0, up), rx: Math.atan2(z1 - z0, up), color: 0xf08a1a }));
    }
    for (let y = 2.4; y < up; y += 2.8) { const k = y / up, hw = (p.w / 2 - 0.15) * (1 - k) + top * k; for (const s of [-1, 1]) F(K, H.box(hw * 2, 0.12, 0.12, { y, z: s * hw, color: 0xf08a1a }), H.box(0.12, 0.12, hw * 2, { x: s * hw, y, color: 0xf08a1a })); }
    F(K, H.cyl(0.25, 0.25, 9, 6, { y: 4.5, color: COL.steelLt })); // the drill string
    G(K, H.box(0.3, 0.3, 0.3, { x: p.w / 2, y: 0.3, z: p.d / 2, color: COL.warm }));
  },
  'arc-derricktop'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.steelDk }));
    rails(K, H, p, COL.yellow, [0, 1, 2, 3], 0.8);
    F(K, H.cyl(0.6, 0.6, 0.3, 10, { y: 1.4, rz: Math.PI / 2, color: COL.steel }), H.box(0.15, 1.3, 0.15, { x: -0.8, y: 0.65, color: COL.steelDk }), H.box(0.15, 1.3, 0.15, { x: 0.8, y: 0.65, color: COL.steelDk }));
    G(K, H.box(0.35, 0.35, 0.35, { y: 2.0, color: COL.beacon }));
  },
  'arc-hut'(K, p, th, rng, H) { // a research hut on skids
    const col = [0xd8402a, 0xf08a1a, 0x3a8a5a][p.tint % 3];
    F(K, H.box(p.w, p.thick - 0.6, p.d, { y: -(p.thick - 0.6) / 2, color: col }));
    for (const s of [-1, 1]) F(K, H.box(0.3, 0.6, p.d + 1.2, { x: s * (p.w / 2 - 0.6), y: -p.thick + 0.3, color: COL.steelDk }));
    cap(K, H, p, COL.snow, 0.2, 0.2);
    windows(K, H, p, [0, 1, 2], [-1.5], 2.4, { w: 0.9, h: 0.8 });
    F(K, H.box(0.9, 1.8, 0.06, { x: p.w / 4, y: -p.thick + 1.6, z: p.d / 2 + 0.04, color: COL.steelDk }));
    F(K, H.box(p.w * 0.6, 1.4, 1.6, { x: -p.w * 0.2, y: -p.thick + 0.5, z: -p.d / 2 - 0.6, color: COL.snowSh })); // the drift on the windward side
    F(K, H.box(0.08, 2.6, 0.08, { x: p.w / 2 - 0.3, y: 1.3, z: -p.d / 2 + 0.3, color: COL.steelDk }));
    G(K, H.box(0.2, 0.2, 0.2, { x: p.w / 2 - 0.3, y: 2.7, z: -p.d / 2 + 0.3, color: COL.beacon }));
  },
  'arc-beacon'(K, p, th, rng, H) { // the camp's beacon mast (its strobe is a backdrop that the snow can't hide)
    STYLES['arc-mast'](K, p, th, rng, H);
    G(K, H.box(1.2, 0.6, 1.2, { y: 0.4, color: COL.cyan }));
  },
  'arc-helipad'(K, p, th, rng, H) { H.helipad(K, p); F(K, H.cyl(p.r + 0.6, p.r + 0.8, 0.2, H.seg(24, 14), { y: -p.thick + 0.1, color: COL.snowSh })); },

  // ---- THE VAULT: the entrance wedge and the mountain
  'arc-slab'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.concreteDk }));
    cap(K, H, p, COL.snow, 0.3, 0.1);
    for (let z = -p.d / 2 + 2; z < p.d / 2; z += 4) G(K, H.box(p.w * 0.5, 0.08, 0.3, { y: -p.thick - 0.04, z, color: 0xd8f0ff }));
  },
  'arc-wedgewall'(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 4, { faces: ['px', 'nx', 'pz', 'nz'], color: 0xa4abb4 });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    for (let y = -1; y > -p.thick; y -= 1.2) F(K, H.box(p.w + 0.04, 0.05, p.d + 0.04, { y, color: 0x8a919a }));
    if (p.tint === 1) G(K, H.box(0.08, 0.12, 6, { x: -p.w / 2 - 0.03, y: -p.thick + 3.2, z: p.d / 2 - 4, color: 0xd8f0ff })); // the corridor light
  },
  'arc-wedge'(K, p, th, rng, H) { // the entrance wedge's roof steps; the prow (tint 3) carries the light installation
    const g = H.meterBox(p.w, p.thick, p.d, 4, { faces: ['px', 'nx', 'pz', 'nz'], color: 0xa4abb4 });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    F(K, H.box(p.w + 0.04, 0.1, p.d + 0.04, { y: -0.05, color: 0xb8c0c8 }));
    // the installation: a strip of mirror-steel and prism tiles down the ridge, lit turquoise, green and white
    const cols = [0x5af0e0, 0x8affb0, 0xe8fbff, 0x3ac8ff];
    const pick = (n) => cols[((n % 4) + 4) % 4];
    for (let z = -p.d / 2 + 0.5; z < p.d / 2; z += 0.9) for (const x of [-0.9, 0, 0.9]) G(K, H.box(0.7, 0.04, 0.7, { x, y: 0.02, z, color: pick(Math.round(z * 3) + Math.round(x * 2)) }));
    for (const s of [-1, 1]) G(K, H.box(0.08, 0.14, p.d, { x: s * (p.w / 2 + 0.03), y: -0.25, color: 0x5af0e0 }));
    if (p.tint === 3) { // the prow: a glowing panel of prisms on the front face, over the door
      for (let y = -0.6; y > -p.thick + 0.8; y -= 0.6) for (let x = -p.w / 2 + 0.5; x < p.w / 2; x += 0.6) G(K, H.box(0.45, 0.45, 0.08, { x, y, z: p.d / 2 + 0.05, color: pick(Math.round(x * 5) + Math.round(y * 7)) }));
      F(K, H.box(4.4, 0.3, 0.3, { y: -p.thick - 0.15, z: p.d / 2 - 0.7, color: COL.steelDk })); // the door lintel
    }
  },
  'arc-floodmast'(K, p, th, rng, H) {
    F(K, H.box(p.w, 0.3, p.d, { y: -0.15, color: COL.steelDk }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.box(0.18, p.thick, 0.18, { x: sx * (p.w / 2 - 0.1), y: -p.thick / 2, z: sz * (p.d / 2 - 0.1), color: COL.steel }));
    for (let y = -1.5; y > -p.thick; y -= 2) for (const f of H.faces(p.w, p.d)) F(K, H.box(f.tx ? f.width : 0.06, 0.06, f.tz ? f.width : 0.06, { x: f.nx * (f.half - 0.1), y, z: f.nz * (f.half - 0.1), color: COL.steel }));
    for (const s of [-1, 1]) { F(K, H.box(0.9, 0.6, 0.5, { x: s * 0.8, y: -0.45, z: p.d / 2 + 0.2, rx: 0.5, color: COL.steelDk })); G(K, H.box(0.7, 0.4, 0.06, { x: s * 0.8, y: -0.55, z: p.d / 2 + 0.47, rx: 0.5, color: 0xfff4d8 })); }
  },
  // ---- the tunnel and the halls
  'arc-tunnelfloor'(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 6, { faces: ['py', 'pz', 'nz'], color: 0x8a929c });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    for (const s of [-1, 1]) F(K, H.box(0.18, 0.02, p.d, { x: s * (p.w / 2 - 0.6), y: 0.01, color: COL.yellow }));
    for (const s of [-1, 1]) F(K, H.box(0.5, 0.35, p.d, { x: s * (p.w / 2 - 0.25), y: 0.17, color: COL.steelDk })); // cable trays along the foot of the walls
    for (let z = -p.d / 2 + 2; z < p.d / 2; z += 4) F(K, H.box(1.2, 0.02, 0.6, { y: 0.01, z, color: 0x4a525c })); // drain grates
    F(K, H.box(p.w * 0.6, 0.012, p.d - 0.4, { y: 0.008, color: 0xdde8f2 })); // a skin of frost
  },
  'arc-tunnelstep'(K, p, th, rng, H) { body(K, H, p, 0x7a828c); F(K, H.box(p.w, 0.03, 0.14, { y: 0.0, z: -p.d / 2 + 0.07, color: COL.yellow })); },
  'arc-vaultceil'(K, p, th, rng, H) { // the underside: frosted concrete, cold light tubes, ducts
    const B = -p.thick;
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x6a737e }));
    const long = p.d >= p.w, L = long ? p.d : p.w, W = long ? p.w : p.d;
    for (let k = 0; k < Math.max(1, Math.floor(W / 6)); k++) {
      const off = -W / 2 + (k + 0.5) * (W / Math.max(1, Math.floor(W / 6)));
      for (let s = -L / 2 + 2; s < L / 2 - 1; s += 5) G(K, H.box(long ? 0.25 : 3, 0.1, long ? 3 : 0.25, { x: long ? off : s, y: B - 0.06, z: long ? s : off, color: 0xd8f2ff }));
    }
    F(K, H.cyl(0.4, 0.4, L, 8, { x: long ? W / 2 - 1 : 0, y: B - 0.5, z: long ? 0 : W / 2 - 1, rx: long ? Math.PI / 2 : 0, rz: long ? 0 : Math.PI / 2, color: COL.steel }));
  },
  'arc-vaultwall'(K, p, th, rng, H) { // frosted concrete; cold light strips at head height, rime creeping up from the floor
    const g = H.meterBox(p.w, p.thick, p.d, 4, { faces: ['px', 'nx', 'pz', 'nz'], color: [0x7f8894, 0x8a939e, 0x6f7884][p.tint % 3] });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    const loc = (yw) => yw - p.h; // world height → this wall's frame (every wall in THE VAULT tops out at 9 m)
    const tunnel = p.d > p.w * 4 && Math.abs(p.x) < 8; // the tunnel's side walls: the floor steps down along them
    const floorAt = (zw) => Math.max(-9, Math.min(0, (zw - 26) * 9 / 73));
    for (const f of H.faces(p.w, p.d)) {
      if (f.width < 1) continue;
      const ox = f.nx * (f.half + 0.03), oz = f.nz * (f.half + 0.03);
      if (tunnel && f.tz) { // a stepped light line that follows the flights down the tunnel
        for (let lz = -p.d / 2 + 2; lz < p.d / 2 - 1; lz += 4) G(K, H.box(0.06, 0.14, 3.4, { x: ox, y: loc(floorAt(p.z + lz) + 3.4), z: lz, color: 0xbfeaff }));
        for (let lz = -p.d / 2 + 4; lz < p.d / 2; lz += 8) F(K, H.cyl(0.16, 0.16, 2.2, 6, { x: f.nx * (f.half + 0.3), y: loc(floorAt(p.z + lz) + 5.2), z: lz, rx: Math.PI / 2, color: COL.steelLt }));
        continue;
      }
      if (tunnel) continue;
      G(K, H.box(f.tx ? f.width - 0.4 : 0.06, 0.16, f.tz ? f.width - 0.4 : 0.06, { x: ox, y: loc(-5.6), z: oz, color: 0xbfeaff }));
      F(K, H.box(f.tx ? f.width : 0.08, 1.0, f.tz ? f.width : 0.08, { x: f.nx * (f.half + 0.04), y: loc(-8.5), z: f.nz * (f.half + 0.04), color: 0xd8e6f0 })); // rime
      if (p.thick > 40) for (const yw of [-19, -30]) G(K, H.box(f.tx ? f.width - 0.4 : 0.06, 0.12, f.tz ? f.width - 0.4 : 0.06, { x: ox, y: loc(yw), z: oz, color: 0x3a8ab8 })); // down the shaft
      if (f.width > 8) for (let k = 0; k < Math.floor(f.width / 8); k++) F(K, H.cyl(0.18, 0.18, 2.2, 6, { x: f.nx * (f.half + 0.3) + f.tx * (-f.width / 2 + 4 + k * 8), y: loc(-1.5), z: f.nz * (f.half + 0.3) + f.tz * (-f.width / 2 + 4 + k * 8), color: COL.steelLt }));
    }
  },
  'arc-vaultfloor'(K, p, th, rng, H) {
    const g = H.meterBox(p.w, p.thick, p.d, 6, { faces: ['py', 'px', 'nx', 'pz', 'nz'], color: 0x9aa3ad });
    g.translate(0, -p.thick / 2, 0); K.add('concrete', g);
    F(K, H.box(p.w * 0.94, 0.012, p.d * 0.94, { y: 0.007, color: 0xd4e2ee }));
    for (const f of H.faces(p.w, p.d)) {
      const n = Math.floor(f.width / 1.6);
      for (let k = 0; k < n; k++) F(K, H.box(f.tx ? f.width / n : 0.3, 0.02, f.tz ? f.width / n : 0.3, { x: f.nx * (f.half - 0.15) + f.tx * (-f.width / 2 + (k + 0.5) * f.width / n), y: 0.012, z: f.nz * (f.half - 0.15) + f.tz * (-f.width / 2 + (k + 0.5) * f.width / n), color: k % 2 ? COL.black : COL.yellow }));
    }
  },
  'arc-pump'(K, p, th, rng, H) {
    body(K, H, p, 0x3a6a8a);
    for (let x = -p.w / 2 + 0.8; x < p.w / 2; x += 1.6) F(K, H.cyl(0.35, 0.35, p.d + 1.2, 8, { x, y: -p.thick * 0.6, rx: Math.PI / 2, color: COL.steelLt }));
    for (let k = 0; k < 4; k++) G(K, H.box(0.3, 0.3, 0.06, { x: -p.w / 2 + 0.8 + k * 1.1, y: -0.6, z: p.d / 2 + 0.04, color: k % 2 ? COL.green : COL.cyan }));
  },
  'arc-cabinet'(K, p, th, rng, H) { // a transformer cabinet: grey-green, louvres, a warning plate, status lights
    body(K, H, p, 0x5a6a62);
    for (let y = -0.4; y > -p.thick + 0.3; y -= 0.3) F(K, H.box(p.w + 0.04, 0.06, p.d * 0.6, { y, color: 0x44524c }));
    F(K, H.box(0.6, 0.5, 0.04, { y: -0.6, z: p.d / 2 + 0.02, color: COL.yellow }));
    for (let k = 0; k < 3; k++) G(K, H.box(0.12, 0.12, 0.06, { x: -0.4 + k * 0.4, y: -0.25, z: p.d / 2 + 0.03, color: [COL.green, COL.green, 0xff8a2a][(k + p.tint) % 3] }));
  },
  'arc-catwalk'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.steelDk }));
    F(K, H.box(p.w - 0.1, 0.04, p.d - 0.1, { y: 0.0, color: 0x8a949e }));
    rails(K, H, p, COL.yellow, p.w > p.d ? [0, 1] : [2, 3], 1.0);
    const long = p.d > p.w, L = long ? p.d : p.w;
    for (let s = -L / 2 + 2; s < L / 2; s += 5) F(K, H.box(long ? p.w : 0.2, 2.2, long ? 0.2 : p.d, { x: long ? 0 : s, y: -p.thick - 1.1, z: long ? s : 0, color: COL.steelDk }));
  },
  'arc-gantry'(K, p, th, rng, H) { // the hall's travelling gantry crane: a yellow box girder, a trolley and its hook
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.yellow }));
    F(K, H.box(p.w + 0.05, 0.05, p.d - 1, { y: 0.0, color: 0xd89a10 }));
    for (const s of [-1, 1]) { for (let k = 0; k < 5; k++) F(K, H.box(p.w + 0.06, 0.06, 0.4, { y: 0.02, z: s * (p.d / 2 - 0.3 - k * 0.8), color: k % 2 ? COL.black : COL.yellow })); F(K, H.box(p.w + 1, 1.0, 1.4, { y: -p.thick - 0.2, z: s * (p.d / 2 - 0.7), color: COL.steelDk })); }
    F(K, H.box(p.w + 0.6, 1.2, 2.4, { y: -p.thick - 0.6, color: COL.steelDk }), H.box(0.08, 5, 0.08, { y: -p.thick - 3.6, color: COL.black }), H.box(0.7, 0.8, 0.5, { y: -p.thick - 6.2, color: COL.red }));
    G(K, H.box(0.4, 0.2, 0.4, { y: -p.thick - 1.3, color: 0xffb030 }));
  },
  'arc-seedrack'(K, p, th, rng, H) { // seed-vault shelving: grey steel, shelves of sealed seed boxes (the top shelf stays clear)
    const Ht = p.thick, boxes = [0x1e2228, 0x2e3440, 0x5a4a3a, 0x3a5a7a, 0x7a3a3a, 0x4a6a3a, 0xc8c8c0];
    for (const sx of [-1, 1]) for (let z = -p.d / 2 + 0.15; z <= p.d / 2; z += Math.max(1.5, (p.d - 0.3) / Math.max(1, Math.round(p.d / 2.4)))) F(K, H.box(0.14, Ht, 0.14, { x: sx * (p.w / 2 - 0.08), y: -Ht / 2, z, color: COL.steelLt }));
    for (let y = 0; y > -Ht + 0.4; y -= 1.8) {
      F(K, H.box(p.w, 0.1, p.d, { y: y - 0.05, color: 0x8a96a2 }));
      if (y === 0) { F(K, H.box(p.w + 0.04, 0.03, p.d + 0.04, { y: 0.01, color: 0xdfeaf2 })); continue; }
      for (let z = -p.d / 2 + 0.4; z < p.d / 2 - 0.5;) {
        const bw = 0.7 + rng() * 0.7, bh = 0.6 + rng() * 0.6;
        if (z + bw > p.d / 2 - 0.2) break;
        F(K, H.box(p.w - 0.3, bh, bw - 0.08, { y: y - 1.8 + 0.1 + bh / 2, z: z + bw / 2, color: boxes[Math.floor(rng() * boxes.length)] }));
        if (rng() < 0.4) F(K, H.box(0.02, 0.2, 0.3, { x: p.w / 2 - 0.14, y: y - 1.8 + 0.1 + bh * 0.6, z: z + bw / 2, color: COL.white })); // a label
        z += bw + 0.06;
      }
    }
    for (const sx of [-1, 1]) G(K, H.box(0.04, 0.06, p.d - 0.4, { x: sx * (p.w / 2 + 0.02), y: -0.4, color: 0x8ad8ff }));
  },
  'arc-taperack'(K, p, th, rng, H) { // data-tape and film racks: black cabinets, rows of status lights, a frosted top
    const Ht = Math.min(p.thick, 14);
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x1a1e26 }));
    F(K, H.box(p.w + 0.04, 0.06, p.d + 0.04, { y: 0.0, color: 0xdfeaf2 }));
    for (const f of H.faces(p.w, p.d)) {
      if (f.width < 2) continue;
      const n = Math.floor(f.width / 1.2);
      for (let k = 0; k < n; k++) for (let y = -0.8; y > -Ht + 0.6; y -= 0.9) {
        const off = -f.width / 2 + (k + 0.5) * (f.width / n);
        F(K, H.box(f.tx ? 0.9 : 0.04, 0.6, f.tz ? 0.9 : 0.04, { x: f.nx * (f.half + 0.02) + f.tx * off, y, z: f.nz * (f.half + 0.02) + f.tz * off, color: 0x3a404c }));
        if ((k + Math.round(y * 3)) % 3 === 0) G(K, H.box(f.tx ? 0.5 : 0.05, 0.05, f.tz ? 0.5 : 0.05, { x: f.nx * (f.half + 0.05) + f.tx * off, y: y - 0.22, z: f.nz * (f.half + 0.05) + f.tz * off, color: [0x2aff8a, 0x5fe8ff, 0x4a8cff][(k + p.tint) % 3] }));
      }
    }
    if (p.thick > 20) for (const f of H.faces(p.w, p.d)) G(K, H.box(f.tx ? f.width : 0.05, 0.12, f.tz ? f.width : 0.05, { x: f.nx * (f.half + 0.04), y: -1.4, z: f.nz * (f.half + 0.04), color: 0x5fe8ff })); // islands in the shaft: a lit rim
  },
  'arc-cryopod'(K, p, th, rng, H) {
    F(K, H.cyl(p.r, p.r, p.thick, H.seg(16, 10), { y: -p.thick / 2, color: COL.steelLt }));
    G(K, H.cyl(p.r + 0.03, p.r + 0.03, p.thick * 0.45, H.seg(16, 10), { y: -p.thick * 0.5, color: p.tint ? 0x5fe8ff : 0x8affd0 }));
    for (const y of [-0.15, -p.thick + 0.2]) F(K, H.cyl(p.r + 0.1, p.r + 0.1, 0.3, H.seg(16, 10), { y, color: COL.steelDk }));
    F(K, H.cyl(p.r * 0.5, p.r * 0.5, 0.05, 10, { y: 0.01, color: 0xdfeaf2 }));
  },
  'arc-chest'(K, p, th, rng, H) { // the world archive's chest: steel, brass corners, a green seam of light
    body(K, H, p, 0x4a525e);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) F(K, H.box(0.5, p.thick + 0.05, 0.5, { x: sx * (p.w / 2 - 0.2), y: -p.thick / 2, z: sz * (p.d / 2 - 0.2), color: 0xc8a040 }));
    G(K, H.box(p.w + 0.04, 0.08, p.d + 0.04, { y: -0.6, color: 0x5aff9a }));
    F(K, H.box(p.w * 0.6, 0.04, p.d * 0.5, { y: 0.01, color: 0xdfeaf2 }));
  },
  'arc-shuttle'(K, p, th, rng, H) { // an archive shuttle: a hover pallet that slides across the shaft
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x2e3440 }));
    F(K, H.box(p.w - 0.2, 0.04, p.d - 0.2, { y: 0.0, color: 0x6a7480 }));
    for (const f of H.faces(p.w, p.d)) for (let k = 0; k < 4; k++) F(K, H.box(f.tx ? f.width / 4 : 0.25, 0.05, f.tz ? f.width / 4 : 0.25, { x: f.nx * (f.half - 0.12) + f.tx * (-f.width / 2 + (k + 0.5) * f.width / 4), y: 0.02, z: f.nz * (f.half - 0.12) + f.tz * (-f.width / 2 + (k + 0.5) * f.width / 4), color: k % 2 ? COL.black : COL.yellow }));
    G(K, H.box(p.w + 0.06, 0.1, p.d + 0.06, { y: -p.thick + 0.2, color: [0x5fe8ff, 0x8affd0, 0x4a8cff, 0x5fe8ff][p.tint % 4] }));
    jets(K, H, [[-1, -1], [1, -1], [-1, 1], [1, 1]], -p.thick - 0.02, 0.4);
  },

  // ---- COLD STORAGE: the ice cavern
  'arc-icefloor'(K, p, th, rng, H) {
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.iceDk }));
    F(K, H.box(p.w, 0.06, p.d, { y: -0.03, color: 0xa8d8ea }));
    for (let k = 0; k < 26; k++) { // cracks in the ice, and snow blown into drifts
      const x = (rng() - 0.5) * (p.w - 6), z = (rng() - 0.5) * (p.d - 6);
      F(K, H.box(2 + rng() * 6, 0.02, 0.12, { x, y: 0.01, z, ry: rng() * Math.PI, color: 0x6aaecc }));
      if (k % 3 === 0) F(K, H.box(2 + rng() * 4, 0.03, 1 + rng() * 2, { x: (rng() - 0.5) * (p.w - 4), y: 0.012, z: (rng() - 0.5) * (p.d - 4), ry: rng() * Math.PI, color: COL.snow }));
    }
    F(K, H.part(new THREE.RingGeometry(12, 12.4, H.seg(48, 24)), { rx: -Math.PI / 2, y: 0.02, color: 0x8ad8f0 }));
  },
  'arc-cavewall'(K, p, th, rng, H) { // the cavern wall: dark rock sheeted with blue ice, crystals jutting out
    const g = H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.rock });
    H.bandColors(g, 0, [[6, COL.rockDk], [16, 0x2e4a62], [26, 0x3a6a8a], [999, 0x4a7a96]]);
    F(K, g);
    for (const f of H.faces(p.w, p.d)) {
      const n = Math.floor(f.width / 3);
      for (let k = 0; k < n; k++) {
        const off = -f.width / 2 + (k + 0.5) * (f.width / n) + (rng() - 0.5) * 2, h = 4 + rng() * 14, w = 1.5 + rng() * 2.5;
        F(K, H.box(f.tx ? w : 0.8, h, f.tz ? w : 0.8, { x: f.nx * (f.half + 0.3) + f.tx * off, y: -2 - h / 2 - rng() * 12, z: f.nz * (f.half + 0.3) + f.tz * off, color: rng() < 0.5 ? COL.iceDk : 0x5a9ab8 }));
        if (k % 3 === 0) { const ch = 1.5 + rng() * 2.5; G(K, H.part(new THREE.ConeGeometry(0.4 + rng() * 0.4, ch, 4), { x: f.nx * (f.half + 0.6) + f.tx * off, y: -p.thick + 4 + ch / 2 + rng() * 2, z: f.nz * (f.half + 0.6) + f.tz * off, rz: f.nx * -0.5, rx: f.nz * 0.5, color: k % 2 ? 0x5fe8ff : 0x9affe8 })); }
      }
    }
  },
  'arc-caveceil'(K, p, th, rng, H) { // the cavern roof: icicles and frozen stalactites (high above the fight)
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x2a3e52 }));
    for (let k = 0; k < 60; k++) {
      const x = (rng() - 0.5) * (p.w - 4), z = (rng() - 0.5) * (p.d - 4), len = 1 + rng() * 3.4;
      F(K, H.part(new THREE.ConeGeometry(0.3 + rng() * 0.6, len, 4), { x, y: -p.thick - len / 2, z, rx: Math.PI, color: rng() < 0.6 ? COL.iceMid : COL.ice }));
    }
    for (let k = 0; k < 10; k++) G(K, H.box(0.5, 0.2, 0.5, { x: (rng() - 0.5) * (p.w - 10), y: -p.thick - 0.1, z: (rng() - 0.5) * (p.d - 10), color: 0x9ae8ff }));
  },
  'arc-iceledge'(K, p, th, rng, H) {
    F(K, lumpy(H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: [0x6aaecc, 0x8ccbe0, 0x5a9ab8, 0x7abcd8][p.tint % 4] }), rng, 0.3));
    cap(K, H, p, COL.snow, 0.12, 0.04);
    icicles(K, H, p, rng, -p.thick, Math.max(1, Math.floor(Math.max(p.w, p.d) / 3)), 1.4);
    for (const f of H.faces(p.w, p.d)) G(K, H.box(f.tx ? f.width - 0.4 : 0.05, 0.08, f.tz ? f.width - 0.4 : 0.05, { x: f.nx * (f.half + 0.03), y: -0.3, z: f.nz * (f.half + 0.03), color: 0x5fe8ff }));
  },
  'arc-icecolumn'(K, p, th, rng, H) { // a column of ice from floor to roof (cover from the frost breath)
    F(K, lumpy(H.cyl(p.r, p.r * 1.08, p.thick, 7, { y: -p.thick / 2, color: 0x9ad4ea }), rng, 0.35));
    F(K, H.cyl(p.r * 1.35, p.r * 1.1, 2.4, 7, { y: -p.thick + 1.2, color: 0xc8eaf6 }), H.cyl(p.r * 1.05, p.r * 1.45, 3, 7, { y: -1.5, color: 0x7ab8d8 }));
    for (let k = 0; k < 6; k++) G(K, H.box(0.06, 2 + rng() * 4, 0.06, { x: Math.cos(k * 1.05) * (p.r + 0.02), y: -p.thick * (0.2 + rng() * 0.6), z: Math.sin(k * 1.05) * (p.r + 0.02), color: 0x6af0ff }));
  },
  'arc-icestump'(K, p, th, rng, H) {
    F(K, lumpy(H.cyl(p.r, p.r * 1.2, p.thick, 7, { y: -p.thick / 2, color: [0x9ad4ea, 0x8ccbe0, 0xa8dcee][p.tint % 3] }), rng, 0.3));
    F(K, H.cyl(p.r + 0.04, p.r + 0.04, 0.1, 7, { y: -0.04, color: COL.snow }));
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + p.tint; F(K, H.part(new THREE.ConeGeometry(0.22, 0.6 + (k % 3) * 0.25, 4), { x: Math.cos(a) * (p.r + 0.05), y: 0.1, z: Math.sin(a) * (p.r + 0.05), rz: Math.cos(a) * 0.6, rx: -Math.sin(a) * 0.6, color: COL.ice })); }
    G(K, H.cyl(p.r * 0.4, p.r * 0.4, 0.04, 7, { y: 0.02, color: 0x8af0ff }));
  },
  'arc-deepdoor'(K, p, th, rng, H) { // the deep door: a round steel vault door set in the ice wall (it faces the arena, west)
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.rockDk }));
    F(K, H.cyl(4.2, 4.2, 0.8, H.seg(24, 14), { x: -p.w / 2 - 0.3, y: -p.thick / 2, rz: Math.PI / 2, color: COL.steel }));
    F(K, H.part(new THREE.TorusGeometry(4.3, 0.3, 4, H.seg(24, 14)), { x: -p.w / 2 - 0.7, y: -p.thick / 2, ry: Math.PI / 2, color: COL.steelDk }));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; F(K, H.box(0.3, 0.7, 0.7, { x: -p.w / 2 - 0.8, y: -p.thick / 2 + Math.sin(a) * 3.2, z: Math.cos(a) * 3.2, color: COL.steelLt })); }
    G(K, H.part(new THREE.TorusGeometry(2.0, 0.12, 4, H.seg(24, 14)), { x: -p.w / 2 - 0.75, y: -p.thick / 2, ry: Math.PI / 2, color: 0x5fe8ff }));
  },
};
