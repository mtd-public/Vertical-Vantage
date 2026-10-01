// NEO CHICAGO's platform styles (render only). Each builds its pieces into Kit K in the platform's
// local frame: origin at its centre, y = 0 at its top (where you stand), footprint p.w × p.d or p.r.
// Flat-shaded vertex colours for almost everything; 'glow' for lights, LED screens and lit windows.
import * as THREE from 'three';
import { box, cyl, ball, part, meterBox, atlasQuad } from '../geo.js';
import { seg } from '../retro.js';
import { adUV } from '../ads.js';
import { FACADE_M } from '../textures.js';

export const LINE = [0xc8102e, 0x00a1de, 0x62361b, 0x009b3a, 0xf9461c, 0xe27ea6]; // the CTA's line colours
const BRICK = [0x8c3b2a, 0xa5583a, 0x6b3328, 0x9b6a4a];
const STONE = [0xd6cdb6, 0xbfb6a2, 0xe0d6c0, 0xc8c0ae];
const WARM = [0xffd38a, 0xffe9b8, 0xffc070, 0xfff0d0, 0x8ff0ff];
const STEEL = 0x3e4a44, RUST = 0x7a4a32, IRON = 0x22262a;
const GOLD = 0xd4af37, DECO = 0x1f3d2e;

// The four faces of a w × d footprint (outward normal n, tangent t, half depth, face width).
const faces = (w, d) => [
  { nx: 0, nz: -1, tx: 1, tz: 0, half: d / 2, width: w, ry: Math.PI },
  { nx: 0, nz: 1, tx: -1, tz: 0, half: d / 2, width: w, ry: 0 },
  { nx: 1, nz: 0, tx: 0, tz: -1, half: w / 2, width: d, ry: Math.PI / 2 },
  { nx: -1, nz: 0, tx: 0, tz: 1, half: w / 2, width: d, ry: -Math.PI / 2 },
];
// A box on face f: `along` the face, at height y, its centre `out` metres outside the face plane;
// sw wide (along the face), sh tall, sd deep (out of the face).
function fbox(f, along, y, out, sw, sh, sd, o = {}) {
  return box(f.tx ? sw : sd, sh, f.tz ? sw : sd, { x: f.nx * (f.half + out) + f.tx * along, y, z: f.nz * (f.half + out) + f.tz * along, ...o });
}
// A flat quad on face f (2 triangles: windows, planks, panels), facing out of the face.
function fquad(f, along, y, out, sw, sh, color) {
  return part(new THREE.PlaneGeometry(sw, sh), { x: f.nx * (f.half + out) + f.tx * along, y, z: f.nz * (f.half + out) + f.tz * along, ry: f.ry, color });
}
const night = (th) => (th.night || 0) > 0.5;
// A grid of windows on every face: floors every fh metres from y0 down to the base, n per face.
function windows(K, p, th, rng, o) {
  const base = -p.thick + (o.foot ?? 0);
  for (const f of faces(p.w, p.d)) {
    const n = Math.max(1, Math.floor((f.width - (o.margin ?? 1.4)) / o.sp));
    for (let y = o.y0; y - o.wh / 2 > base + 0.3; y -= o.fh) {
      for (let k = 0; k < n; k++) {
        const a = (k - (n - 1) / 2) * o.sp, lit = night(th) && rng() < (o.lit ?? 0.45);
        if (o.frame != null) K.add('flat', fquad(f, a, y - 0.05, 0.03, o.ww + 0.34, o.wh + 0.4, o.frame));
        K.add(lit ? 'glow' : 'flat', fquad(f, a, y, 0.05, o.ww, o.wh, lit ? WARM[Math.floor(rng() * WARM.length)] : o.glass));
      }
    }
  }
}
// A Chicago lamp post (dark green, a lantern head) standing at (x, z) on the top.
function lamp(K, th, x, z, h = 4.2, y0 = 0) {
  K.add('flat', box(0.16, h, 0.16, { x, y: y0 + h / 2, z, color: 0x1e3a2a }));
  K.add('glow', box(0.32, 0.4, 0.32, { x, y: y0 + h + 0.3, z, color: night(th) ? 0xffd890 : 0xf4ecd8 }));
}
// A low railing along a straight edge from (x0, z0) to (x1, z1), posts every `step`.
function railing(K, x0, z0, x1, z1, h = 1.0, color = IRON, step = 2) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz), ry = Math.atan2(dx, dz);
  K.add('flat', box(0.07, 0.07, L, { x: (x0 + x1) / 2, y: h, z: (z0 + z1) / 2, ry, color }));
  for (let s = 0; s <= L + 0.01; s += step) K.add('flat', box(0.06, h, 0.06, { x: x0 + dx * s / L, y: h / 2, z: z0 + dz * s / L, color }));
}

// ================================================================== stage 1: the drowned Loop
function chiBlock(K, p, th, rng) {
  const { w, d, thick } = p;
  const top = meterBox(w, 0.3, d, 8, { faces: ['py'], color: 0xbcb6aa }); top.translate(0, -0.15, 0); K.add('concrete', top);
  K.add('flat', box(w, thick - 0.3, d, { y: -0.3 - (thick - 0.3) / 2, color: 0x6e675e }));
  K.add('flat', box(w + 0.08, 0.6, d + 0.08, { y: -p.h + 0.15, color: 0x2c3a33 })); // the water line, mossy
  for (const f of faces(w, d)) K.add('flat', fbox(f, 0, 0.05, -0.2, f.width, 0.16, 0.4, { color: 0xdcd6c8 })); // the curb
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) lamp(K, th, sx * (w / 2 - 0.7), sz * (d / 2 - 0.7));
  for (let k = 0; k < Math.floor((w + d) / 14); k++) { // hydrants and newspaper boxes along the curb
    const f = faces(w, d)[Math.floor(rng() * 4)], a = (rng() - 0.5) * (f.width - 4);
    K.add('flat', fbox(f, a, 0.4, -0.9, 0.45, 0.8, 0.45, { color: rng() < 0.5 ? 0xc81e1e : 0x2a5ab8 }));
  }
}
function chiRiverwalk(K, p, th, rng) {
  chiBlock(K, p, th, rng);
  const sz = p.tint === 1 ? 1 : -1, z = sz * (p.d / 2 - 0.25);
  railing(K, -p.w / 2, z, p.w / 2, z, 1.05, 0x1e2a24, 4);
  for (let x = -p.w / 2 + 6; x < p.w / 2; x += 12) { lamp(K, th, x, z - sz * 0.6); K.add('flat', box(1.8, 0.45, 0.5, { x: x + 4, y: 0.25, z: z - sz * 1.4, color: 0x6a4a2a })); } // lamps and benches
  for (let x = -p.w / 2 + 3; x < p.w / 2; x += 14) K.add('flat', box(1.4, 0.7, 1.4, { x, y: 0.35, z: -z * 0.6, color: 0x5a5e58 }), ball(0.9, { x, y: 1.2, z: -z * 0.6, color: 0x3a7a3a })); // planters
}
// The L: a riveted steel deck carrying two tracks, bents down to the water every 12 m.
function lDeck(K, p, th) {
  const { w, d } = p, hw = w / 2;
  K.add('flat', box(w - 0.6, 0.35, d, { y: -0.4, color: 0x4a4a46 })); // deck plate
  K.add('flat', box(0.5, 0.06, d, { y: -0.03, color: 0x8a8a84 })); // the centre walkway plank
  for (const sx of [-1, 1]) {
    K.add('flat', box(0.45, 1.5, d, { x: sx * (hw - 0.22), y: -0.6, color: STEEL })); // edge girder
    K.add('flat', box(0.55, 0.12, d, { x: sx * (hw - 0.22), y: 0.12, color: 0x2e3834 })); // its flange
    for (const lx of [sx * 2.1 - 0.72, sx * 2.1 + 0.72]) K.add('flat', box(0.12, 0.16, d, { x: lx, y: 0.02, color: 0x9aa0a6 })); // rails
    K.add('flat', box(0.22, 0.12, d, { x: sx * 3.5, y: 0.0, color: 0x5a5048 })); // third rail cover
  }
  for (let z = -d / 2 + 0.5; z < d / 2; z += 1.6) K.add('flat', box(w - 1.4, 0.1, 0.26, { y: -0.08, z, color: 0x3a2a20 })); // ties
  // bents: two columns, a cross girder, knee braces, down past the water line
  const down = p.h + 1.5;
  for (let z = -d / 2 + 4; z < d / 2 - 2; z += 12) {
    K.add('flat', box(w + 0.4, 0.8, 0.6, { y: -1.3, z, color: STEEL }));
    for (const sx of [-1, 1]) {
      K.add('flat', box(0.55, down, 0.55, { x: sx * (hw - 0.6), y: -1.2 - down / 2, z, color: STEEL }));
      K.add('flat', box(0.18, 2.2, 0.18, { x: sx * (hw - 1.4), y: -2.2, z, rz: sx * 0.6, color: STEEL }));
      K.add('flat', box(0.65, 0.3, 0.65, { x: sx * (hw - 0.6), y: -2.6, z, color: RUST })); // a riveted collar
    }
  }
}
function chiTrack(K, p, th) { lDeck(K, p, th); }
function chiTruss(K, p, th) { // the river span: a Pratt through-truss (you walk between its sides)
  lDeck(K, p, th);
  const { w, d } = p, hw = w / 2 - 0.2, H = 6, n = Math.round(d / 4);
  for (const sx of [-1, 1]) {
    K.add('flat', box(0.4, 0.4, d, { x: sx * hw, y: H, color: STEEL }));
    for (let i = 0; i <= n; i++) {
      const z = -d / 2 + i * d / n;
      K.add('flat', box(0.3, H, 0.3, { x: sx * hw, y: H / 2, z, color: STEEL }));
      if (i < n) { const L = Math.sqrt(H * H + (d / n) * (d / n)); K.add('flat', box(0.22, L, 0.22, { x: sx * hw, y: H / 2, z: z + d / n / 2, rx: (i < n / 2 ? 1 : -1) * Math.atan2(d / n, H), color: STEEL })); }
    }
  }
  for (let i = 0; i <= n; i += 2) K.add('flat', box(w - 0.4, 0.3, 0.3, { y: H, z: -d / 2 + i * d / n, color: STEEL })); // overhead bracing
  K.add('flat', box(1.2, p.h + 1.5, 6, { y: -1.2 - (p.h + 1.5) / 2, z: 0, color: 0x6e675e })); // the river pier
}
// An L car: stainless body, a line-colour stripe, a glass band, lit destination signs.
function chiTrain(K, p) {
  const { w, d } = p, col = LINE[(p.tint >= 0 ? p.tint : 0) % LINE.length];
  K.add('flat', box(w - 0.1, 0.22, d - 0.2, { y: -0.11, color: 0xb4b8be })); // roof (you ride it)
  for (const z of [-d / 4, d / 4]) K.add('flat', box(w * 0.6, 0.1, 1.6, { y: 0.03, z, color: 0x8a8e94 })); // AC hatches
  K.add('flat', box(w, 2.35, d, { y: -1.4, color: 0xc8ccd2 })); // body
  K.add('flat', box(w + 0.05, 0.24, d + 0.02, { y: -2.15, color: col })); // stripe
  K.add('glass', box(w + 0.06, 0.75, d - 2.4, { y: -0.95 }));
  for (let z = -d / 2 + 1.2; z <= d / 2 - 1.2; z += 2.4) K.add('flat', box(w + 0.1, 0.8, 0.12, { y: -0.95, z, color: 0x9ea2a8 })); // window posts
  for (const z of [-d / 4, d / 4]) for (const sx of [-1, 1]) K.add('flat', box(0.06, 1.9, 1.3, { x: sx * (w / 2 + 0.02), y: -1.5, z, color: 0x7a7e86 })); // doors
  for (const sz of [-1, 1]) {
    K.add('glow', box(1.5, 0.32, 0.06, { y: -0.5, z: sz * (d / 2 + 0.02), color: col }));
    K.add('glow', box(0.3, 0.2, 0.06, { x: -0.9, y: -2.3, z: sz * (d / 2 + 0.02), color: 0xfff6d8 }), box(0.3, 0.2, 0.06, { x: 0.9, y: -2.3, z: sz * (d / 2 + 0.02), color: 0xfff6d8 }));
    K.add('flat', box(w * 0.8, 0.45, 2.4, { y: -p.thick + 0.25, z: sz * (d / 2 - 2.2), color: 0x23262a })); // trucks
    for (const z of [-0.7, 0.7]) for (const sx of [-1, 1]) K.add('flat', cyl(0.38, 0.38, 0.16, 8, { x: sx * 0.7, y: -p.thick + 0.15, z: sz * (d / 2 - 2.2) + z, rz: Math.PI / 2, color: 0x3a3a3a }));
  }
}
function chiStation(K, p, th) {
  const { w, d } = p, col = LINE[(p.tint >= 0 ? p.tint : 0) % LINE.length];
  K.add('flat', box(w, p.thick, d, { y: -p.thick / 2, color: 0x6a6460 }));
  K.add('flat', box(w + 0.05, 0.05, d + 0.05, { y: 0.0, color: 0x8a7a60 })); // planks
  for (const f of faces(w, d)) if (f.width > 6) K.add('flat', fbox(f, 0, 0.02, -0.3, f.width, 0.05, 0.6, { color: 0xffd23a })); // the yellow edge strip
  const long = w > d, L = long ? w : d;
  for (let s = -L / 2 + 3; s < L / 2; s += 8) {
    const x = long ? s : 0, z = long ? 0 : s;
    lamp(K, th, x, z, 3.4);
    K.add('flat', box(long ? 2.2 : 0.4, 0.45, long ? 0.4 : 2.2, { x: long ? x + 3 : 0, y: 0.25, z: long ? 0 : z + 3, color: 0x6a4a2a })); // bench
  }
  // the station sign: a CTA-blue panel on two posts, line-colour band
  for (const s of [-L / 4, L / 4]) {
    const x = long ? s : 0, z = long ? 0 : s;
    K.add('flat', box(0.1, 2.8, 0.1, { x: x - (long ? 1.1 : 0), y: 1.4, z: z - (long ? 0 : 1.1), color: IRON }), box(0.1, 2.8, 0.1, { x: x + (long ? 1.1 : 0), y: 1.4, z: z + (long ? 0 : 1.1), color: IRON }));
    K.add('glow', box(long ? 2.6 : 0.14, 0.6, long ? 0.14 : 2.6, { x, y: 2.7, z, color: 0x1a4a8a }), box(long ? 2.62 : 0.16, 0.14, long ? 0.16 : 2.62, { x, y: 2.35, z, color: col }));
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', box(0.4, p.h, 0.4, { x: sx * (w / 2 - 0.4), y: -p.h / 2, z: sz * (d / 2 - 0.4), color: STEEL })); // stilts
}
function chiKiosk(K, p, th) {
  const cols = [0x1e5a3a, 0x2a4a8a, 0xb83a2a, 0x7a5a2a];
  const c = cols[(p.tint >= 0 ? p.tint : 0) % cols.length];
  K.add('flat', box(p.w, 0.25, p.d, { y: -0.12, color: 0x2a2e30 }), box(p.w + 0.3, 0.12, p.d + 0.3, { y: -0.3, color: 0x2a2e30 }));
  K.add('flat', box(p.w - 0.3, p.thick - 0.4, p.d - 0.3, { y: -0.4 - (p.thick - 0.4) / 2, color: c }));
  for (const f of faces(p.w, p.d)) K.add(night(th) ? 'glow' : 'flat', fbox(f, 0, -0.8, -0.12, f.width - 0.6, 0.5, 0.06, { color: night(th) ? 0xffe6a0 : 0xf0e8d0 }));
}
function chiBrick(K, p, th, rng) {
  const { w, d, thick } = p, c = BRICK[(p.tint >= 0 ? p.tint : 0) % BRICK.length];
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: c }));
  K.add('flat', box(w + 0.6, 0.45, d + 0.6, { y: -0.4, color: 0x3a2a24 }), box(w + 0.3, 0.2, d + 0.3, { y: -0.75, color: 0xd8ccb0 })); // cornice
  K.add('flat', box(w - 0.4, 0.12, d - 0.4, { y: -0.05, color: 0x4a4440 })); // tar roof
  windows(K, p, th, rng, { y0: -2.2, fh: 3.4, sp: 2.5, ww: 1.1, wh: 1.7, glass: 0x26303c, frame: 0xe4dcc8, foot: 3.6, lit: 0.5 });
  // the ground floor: a shop front and an awning on one face
  const f = faces(w, d)[(p.tint >= 0 ? p.tint : 0) % 4], gy = -thick + 1.6;
  K.add(night(th) ? 'glow' : 'flat', fbox(f, 0, gy, 0.04, f.width - 1.4, 2.2, 0.08, { color: night(th) ? 0xffc890 : 0x3a4656 }));
  K.add('flat', fbox(f, 0, gy + 1.5, 0.6, f.width - 1.0, 0.18, 1.2, { color: [0x1e5a3a, 0xb8302a, 0x2a3a6a, 0xd8a020][Math.floor(rng() * 4)] }));
  // a fire escape on the face opposite (Chicago walk-ups wear them on the alley side)
  const g = faces(w, d)[((p.tint >= 0 ? p.tint : 0) + 1) % 4];
  if (g.width >= 7) for (let y = -3.4, k = 0; y > -thick + 4; y -= 3.3, k++) {
    K.add('flat', fbox(g, 0, y, 0.55, 3.2, 0.08, 1.1, { color: IRON }));
    K.add('flat', fbox(g, 0, y + 0.5, 1.08, 3.2, 0.06, 0.06, { color: IRON }));
    K.add('flat', box(g.tx ? 3.4 : 0.1, 0.1, g.tz ? 3.4 : 0.1, { x: g.nx * (g.half + 0.55) + g.tx * 0.1, y: y - 1.65, z: g.nz * (g.half + 0.55) + g.tz * 0.1, rz: g.tx ? (k % 2 ? 0.75 : -0.75) : 0, rx: g.tz ? (k % 2 ? 0.75 : -0.75) : 0, color: IRON }));
  }
}
function chiStone(K, p, th, rng) {
  const { w, d, thick } = p, c = STONE[(p.tint >= 0 ? p.tint : 0) % STONE.length];
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: c }));
  K.add('flat', box(w + 0.8, 0.6, d + 0.8, { y: -0.5, color: 0x8a8274 }), box(w + 0.2, 0.3, d + 0.2, { y: -1.1, color: 0xa8a090 })); // cornice
  K.add('flat', box(w - 0.4, 0.12, d - 0.4, { y: -0.05, color: 0x5a5650 }));
  // Chicago windows: wide glass bands between stone piers, a spandrel per floor
  for (const f of faces(w, d)) {
    const n = Math.max(1, Math.round(f.width / 4.2)), bay = f.width / n;
    for (let y = -2.6; y > -thick + 5; y -= 3.6) {
      for (let k = 0; k < n; k++) {
        const a = -f.width / 2 + (k + 0.5) * bay, lit = night(th) && rng() < 0.5;
        K.add(lit ? 'glow' : 'flat', fquad(f, a, y, 0.04, bay - 0.9, 2.3, lit ? WARM[Math.floor(rng() * 4)] : 0x34404c));
      }
    }
    for (let k = 0; k <= n; k++) K.add('flat', fbox(f, -f.width / 2 + k * bay, -thick / 2 - 0.6, 0.12, 0.7, thick - 1.4, 0.3, { color: c }));
    K.add('flat', fbox(f, 0, -thick + 2.2, 0.15, f.width, 2.6, 0.3, { color: 0x9a9284 })); // a rusticated base
  }
}
function chiWaterTower(K, p, th) {
  const r = p.r, H = p.thick, legs = p.tint > 0 ? p.tint : 2.8;
  K.add('flat', cyl(r, r, H - 0.2, seg(14, 10), { y: -H / 2 - 0.1, color: 0x7a5434 }));
  for (let y = -0.6; y > -H; y -= 0.8) K.add('flat', cyl(r + 0.05, r + 0.05, 0.1, seg(14, 10), { y, color: 0x2a2420 })); // hoops
  K.add('flat', part(new THREE.ConeGeometry(r + 0.25, 0.55, seg(14, 10)), { y: 0.1, color: 0x4a4038 })); // the lid
  K.add('flat', ball(0.22, { y: 0.45, color: 0x4a4038 }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * r * 0.62, z = sz * r * 0.62;
    K.add('flat', box(0.18, legs + 0.2, 0.18, { x, y: -H - legs / 2, z, color: IRON }));
  }
  for (const [ax, az] of [[1, 0], [0, 1]]) for (const s of [-1, 1]) K.add('flat', box(ax ? r * 1.4 : 0.08, 0.08, az ? r * 1.4 : 0.08, { x: az ? s * r * 0.62 : 0, y: -H - legs / 2, z: ax ? s * r * 0.62 : 0, rz: ax ? 0.7 : 0, rx: az ? 0.7 : 0, color: IRON })); // X braces
  K.add('flat', box(0.5, H + legs, 0.06, { x: 0, y: -(H + legs) / 2, z: r + 0.1, color: IRON })); // ladder
}
// The green-and-gold deco tower: dark green terracotta, gold piers, gold-crowned setbacks.
function chiDeco(K, p, th, rng) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: DECO }));
  K.add('flat', box(w + 0.3, 0.5, d + 0.3, { y: -0.25, color: GOLD }), box(w + 0.1, 0.25, d + 0.1, { y: -0.8, color: 0x13261c }));
  for (const f of faces(w, d)) {
    const n = Math.max(2, Math.round(f.width / 2.2)), bay = f.width / n;
    for (let k = 1; k < n; k++) K.add('flat', fbox(f, -f.width / 2 + k * bay, -thick / 2 - 0.5, 0.08, 0.32, thick - 1.4, 0.16, { color: k % 2 ? 0x2c5a40 : GOLD })); // piers
    for (let y = -2.2; y > -thick + 1; y -= 3.4) for (let k = 0; k < n; k++) {
      const lit = night(th) && rng() < 0.5;
      K.add(lit ? 'glow' : 'flat', fquad(f, -f.width / 2 + (k + 0.5) * bay, y, 0.04, bay - 0.6, 2.1, lit ? 0xffe0a0 : 0x0e1a14));
    }
    for (const s of [-1, 1]) K.add('flat', part(new THREE.ConeGeometry(0.35, 1.2, 4), { x: f.nx * (f.half - 0.2) + f.tx * s * (f.width / 2 - 0.2), y: 0.6, z: f.nz * (f.half - 0.2) + f.tz * s * (f.width / 2 - 0.2), color: GOLD })); // corner finials
  }
  if (p.tint === 0) { // the base: a gold-framed entrance on the south side
    const f = faces(w, d)[1];
    K.add('flat', fbox(f, 0, -thick + 3, 0.2, 5, 6, 0.4, { color: GOLD }), fbox(f, 0, -thick + 2.6, 0.42, 3.6, 5, 0.1, { color: 0x101010 }));
  }
}
function chiDecoCrown(K, p, th) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0x2c5a40 }));
  for (const f of faces(w, d)) {
    for (let k = -2; k <= 2; k++) K.add('flat', fbox(f, k * (f.width / 5), -thick / 2, 0.15, 0.4, thick - 0.6, 0.3, { color: GOLD })); // gold fluting
    K.add(night(th) ? 'glow' : 'flat', fbox(f, 0, -thick + 1.4, 0.1, f.width - 1, 0.6, 0.1, { color: 0xffd060 }));
  }
  K.add('flat', box(w + 0.4, 0.4, d + 0.4, { y: -0.2, color: GOLD }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', part(new THREE.ConeGeometry(0.4, 2.6, 4), { x: sx * (w / 2 - 0.3), y: 1.3, z: sz * (d / 2 - 0.3), color: GOLD }));
}
// Marina City's corncob: a round core ringed with scalloped balconies, parking at the bottom.
function chiCorncob(K, p, th, rng) {
  const r = p.r, H = p.thick, n = 14;
  K.add('flat', cyl(r - 0.6, r - 0.6, H, seg(20, 14), { y: -H / 2, color: 0xd4d0c8 }));
  for (let y = -0.4, fl = 0; y > -H + 0.5; y -= 3.0, fl++) {
    const park = y < -H * 0.62;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, x = Math.cos(a) * (r - 0.5), z = Math.sin(a) * (r - 0.5);
      K.add('flat', cyl(1.75, 1.75, 0.3, 5, { x, y, z, ry: a, color: 0xe8e4dc }));
      if (!park) { const lit = night(th) && rng() < 0.45; K.add(lit ? 'glow' : 'flat', part(new THREE.PlaneGeometry(2.2, 2.0), { x: Math.cos(a) * (r - 0.55), y: y - 1.3, z: Math.sin(a) * (r - 0.55), ry: -a + Math.PI / 2, color: lit ? WARM[k % 4] : 0x3a4654 })); }
      else if (fl % 2 === 0 && rng() < 0.6) K.add('flat', box(1.0, 0.7, 1.6, { x: Math.cos(a) * (r - 0.9), y: y - 0.5, z: Math.sin(a) * (r - 0.9), ry: -a, color: [0xc81e1e, 0x2a5ab8, 0xe8e4dc, 0x1a1a1a][k % 4] })); // parked cars
    }
  }
  K.add('flat', cyl(r + 0.1, r + 0.1, 0.3, seg(20, 14), { y: -0.15, color: 0xbab4aa }));
  K.add('flat', cyl(2.2, 2.2, 1.2, 8, { x: 0, y: 0.1, z: 0, color: 0x8a8680 })); // rooftop machine room (low)
  K.add('glow', ball(0.25, { y: 0.9, color: 0xff2a2a }));
}
function chiPetal(K, p) {
  K.add('flat', cyl(p.r, p.r, 0.3, 8, { y: -0.15, color: 0xe8e4dc }), cyl(p.r * 0.9, p.r * 0.95, 0.3, 8, { y: -0.45, color: 0xb8b4ac }));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.add('flat', box(0.06, 0.9, 0.06, { x: Math.cos(a) * (p.r - 0.1), y: 0.45, z: Math.sin(a) * (p.r - 0.1), color: 0xd8d4cc })); }
  K.add('flat', part(new THREE.TorusGeometry(p.r - 0.1, 0.05, 3, 10), { rx: Math.PI / 2, y: 0.9, color: 0xd8d4cc }));
}
// The vertical-lift bridge: a truss span that rides between its towers.
function chiLiftSpan(K, p) {
  const { w, d } = p;
  K.add('flat', box(w, p.thick, d, { y: -p.thick / 2, color: 0x5a6a62 }));
  K.add('flat', box(w - 2.4, 0.04, d, { y: 0.0, color: 0x3a3a3c })); // roadway
  for (let z = -d / 2 + 1; z < d / 2; z += 3) K.add('flat', box(0.18, 0.05, 1.4, { y: 0.02, z, color: 0xf0e070 }));
  for (const sx of [-1, 1]) {
    K.add('flat', box(0.35, 0.35, d, { x: sx * (w / 2 - 0.2), y: 2.2, color: 0x4a5a52 }));
    for (let z = -d / 2; z <= d / 2; z += 3.5) {
      K.add('flat', box(0.25, 2.2, 0.25, { x: sx * (w / 2 - 0.2), y: 1.1, z, color: 0x4a5a52 }));
      if (z < d / 2) K.add('flat', box(0.18, 2.9, 0.18, { x: sx * (w / 2 - 0.2), y: 1.1, z: z + 1.75, rx: 0.9, color: 0x4a5a52 }));
    }
  }
}
function chiLiftTower(K, p) {
  const { w, d, thick } = p;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', box(0.35, thick, 0.35, { x: sx * (w / 2 - 0.2), y: -thick / 2, z: sz * (d / 2 - 0.2), color: 0x4a5a52 }));
  for (let y = -1.5; y > -thick; y -= 3) for (const f of faces(w, d)) {
    K.add('flat', fbox(f, 0, y, -0.2, f.width, 0.2, 0.2, { color: 0x4a5a52 }));
    K.add('flat', box(f.tx ? f.width * 1.25 : 0.12, 0.12, f.tz ? f.width * 1.25 : 0.12, { x: f.nx * (f.half - 0.2), y: y - 1.5, z: f.nz * (f.half - 0.2), rz: f.tx ? 0.78 : 0, rx: f.tz ? 0.78 : 0, color: 0x4a5a52 }));
  }
  K.add('flat', box(w * 0.6, 4, d * 0.6, { y: -6, color: 0x7a7a74 })); // counterweight
}
function chiLiftBeam(K, p, th) {
  const { w, d } = p;
  K.add('flat', box(w, p.thick, d, { y: -p.thick / 2, color: 0x4a5a52 }));
  K.add('deck', box(w - 0.2, 0.06, d - 0.2, { y: 0.0 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    K.add('flat', cyl(1.6, 1.6, 0.3, seg(16, 10), { x: sx * 6.5, y: -0.6, z: sz * (d / 2 + 0.3), rx: Math.PI / 2, color: 0x2e3634 })); // sheave wheels
    K.add('flat', cyl(0.3, 0.3, 0.5, 8, { x: sx * 6.5, y: -0.6, z: sz * (d / 2 + 0.3), rx: Math.PI / 2, color: 0xd8b030 }));
  }
  railing(K, -w / 2, -d / 2 + 0.1, w / 2, -d / 2 + 0.1, 1.0, 0xd8b030, 2); railing(K, -w / 2, d / 2 - 0.1, w / 2, d / 2 - 0.1, 1.0, 0xd8b030, 2);
  K.add('glow', box(0.4, 0.4, 0.4, { x: -w / 2 + 0.3, y: 1.2, color: 0xff2a2a }), box(0.4, 0.4, 0.4, { x: w / 2 - 0.3, y: 1.2, color: 0xff2a2a }));
}
function chiBascule(K, p) {
  const { w, d } = p;
  K.add('flat', box(w, p.thick, d, { y: -p.thick / 2, color: 0x3a3a3c }));
  for (let z = -d / 2 + 1; z < d / 2; z += 3) K.add('flat', box(0.18, 0.05, 1.4, { y: 0.01, z, color: 0xf0e070 }));
  for (const sx of [-1, 1]) {
    K.add('flat', box(0.5, 1.1, d, { x: sx * (w / 2 - 0.25), y: 0.15, color: 0xb83a2a })); // red girders
    for (let z = -d / 2; z <= d / 2; z += 2.5) K.add('flat', box(0.52, 0.12, 0.12, { x: sx * (w / 2 - 0.25), y: 0.72, z, color: 0x8a2a20 }));
    for (const sz of [-1, 1]) { // tender houses on the banks
      K.add('flat', box(2.2, 3.2, 2.2, { x: sx * (w / 2 + 1.4), y: 1.6 - 0.3, z: sz * (d / 2 + 1.6), color: 0xc8b48a }), box(2.6, 0.5, 2.6, { x: sx * (w / 2 + 1.4), y: 3.2, z: sz * (d / 2 + 1.6), color: 0x2a5a3a }));
    }
  }
  K.add('flat', box(w * 0.8, 0.4, 0.6, { y: -p.thick - 0.2, color: 0x2a2a2c }));
}
// Boats: hull, deck, a stripe; tour boat / water taxi / speedboat by tint.
function chiBoat(K, p) {
  const { w, d } = p, t = p.tint >= 0 ? p.tint : 0;
  const hull = [0xf2f2ec, 0xf0c020, 0xe8e8e8, 0x1a2a4a][t % 4], stripe = [0x1a3a8a, 0x1a1a1a, 0xc8102e, 0xf0f0f0][t % 4];
  const H = Math.min(p.thick, 2.2);
  K.add('flat', box(w, H, d * 0.86, { y: -H / 2, z: d * 0.07, color: hull }));
  K.add('flat', part(new THREE.CylinderGeometry(0.01, w / 2, d * 0.2, 4, 1), { y: -H / 2, z: -d * 0.43, rx: -Math.PI / 2, ry: Math.PI / 4, sx: 1, sz: H / w * 1.4, color: hull })); // the bow
  K.add('flat', box(w + 0.04, 0.22, d * 0.86, { y: -H * 0.55, z: d * 0.07, color: stripe }));
  K.add('flat', box(w - 0.3, 0.06, d * 0.8, { y: 0.0, z: d * 0.08, color: 0x9a7a50 })); // deck
  for (let z = -d * 0.2; z < d * 0.4; z += 1.6) K.add('flat', box(w * 0.7, 0.35, 0.4, { y: 0.18, z, color: 0x2a4a8a })); // benches
  K.add('flat', box(w * 0.8, 0.5, 0.1, { y: 0.25, z: -d * 0.28, rx: -0.4, color: 0x9ab8d0 })); // windscreen
}
function chiJetski(K, p) {
  const c = [0xffd23a, 0xff2b6a][(p.tint >= 0 ? p.tint : 0) % 2];
  K.add('flat', box(p.w, 0.6, p.d * 0.8, { y: -0.3, z: p.d * 0.1, color: c }), part(new THREE.ConeGeometry(p.w / 2, p.d * 0.3, 4), { y: -0.3, z: -p.d * 0.42, rx: -Math.PI / 2, ry: Math.PI / 4, color: c }));
  K.add('flat', box(0.5, 0.25, 1.2, { y: 0.1, z: 0.3, color: 0x1a1a1a }), box(0.9, 0.08, 0.08, { y: 0.55, z: -0.6, color: 0x1a1a1a }));
  K.add('glow', box(0.6, 0.1, 0.6, { y: -0.65, z: 0.8, color: 0x5ff0ff }));
}
function chiSailboat(K, p) {
  chiBoat(K, { ...p, tint: 2 });
  K.add('flat', cyl(0.08, 0.1, 11, 6, { y: 5.5, z: -p.d * 0.05, color: 0xd8d8d8 }));
  const s1 = new THREE.BufferGeometry(); // mainsail and jib: two flat triangles in the boat's plane (x = 0)
  s1.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.2, -p.d * 0.05, 0, 10.4, -p.d * 0.05, 0, 1.2, p.d * 0.35, 0, 1.2, -p.d * 0.05, 0, 1.2, p.d * 0.35, 0, 10.4, -p.d * 0.05], 3));
  s1.computeVertexNormals(); K.add('flat', part(s1, { color: p.tint === 1 ? 0xffd8d0 : 0xf8f8f4 }));
  const s2 = new THREE.BufferGeometry();
  s2.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.0, -p.d * 0.45, 0, 9.0, -p.d * 0.07, 0, 1.0, -p.d * 0.08, 0, 1.0, -p.d * 0.45, 0, 1.0, -p.d * 0.08, 0, 9.0, -p.d * 0.07], 3));
  s2.computeVertexNormals(); K.add('flat', part(s2, { color: p.tint === 1 ? 0xc8102e : 0x2a5ab8 }));
}

// ================================================================== stage 2: the lakeshore
function chiSand(K, p, th, rng) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xe6d29a }));
  K.add('flat', box(w + 0.6, 0.12, d + 0.6, { y: -p.h + 0.06, color: 0xf8f8f0 })); // the foam line
  for (let k = 0; k < 14; k++) { // towels and dunes
    const x = (rng() - 0.5) * (w - 6), z = (rng() - 0.5) * (d - 6);
    if (rng() < 0.6) K.add('flat', box(1.0, 0.04, 1.9, { x, y: 0.02, z, ry: rng() * 3, color: [0xff5a2b, 0x2be8ff, 0xffd23a, 0xff2bd6, 0x7bff4a][k % 5] }));
    else K.add('flat', part(new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), { x, y: -0.05, z, sx: 2 + rng() * 2, sy: 0.25, sz: 1.5 + rng() * 2, color: 0xd8c488 }));
  }
  for (const sx of [-1, 1]) K.add('flat', cyl(0.08, 0.08, 2.4, 6, { x: -12 + sx * 4, y: 1.2, z: 12, color: 0xe8e8e8 }));
  K.add('flat', box(8, 0.9, 0.04, { x: -12, y: 1.9, z: 12, color: 0xf0f0f0 })); // volleyball net
}
function chiLifeguard(K, p) {
  const { w, d } = p;
  K.add('flat', box(w, p.thick, d, { y: -p.thick / 2, color: 0xd8302a }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', box(0.18, p.h, 0.18, { x: sx * (w / 2 - 0.2), y: -p.h / 2, z: sz * (d / 2 - 0.2), rz: sx * 0.08, color: 0xf0f0f0 }));
  K.add('flat', box(w + 0.1, 0.9, 0.08, { y: -p.thick - 0.6, z: d / 2, color: 0xf0f0f0 }), box(0.8, 3.4, 0.08, { y: -p.h / 2 - 1.2, z: d / 2 + 0.6, rx: 0.35, color: 0xe0e0e0 }));
  K.add('flat', box(w * 0.7, 0.5, 0.08, { y: -0.8, z: -d / 2 - 0.05, color: 0xf0f0f0 }), box(w * 0.5, 0.12, 0.1, { y: -0.8, z: -d / 2 - 0.08, color: 0xd8302a }));
}
function chiUmbrella(K, p) {
  const cols = [[0xff5a2b, 0xf8f8f0], [0x2be8ff, 0xf8f8f0], [0xffd23a, 0x2a5ab8], [0xff2bd6, 0xf8f8f0]][(p.tint >= 0 ? p.tint : 0) % 4];
  for (let k = 0; k < 8; k++) K.add('flat', part(new THREE.CylinderGeometry(0.02, p.r + 0.2, 0.5, 1, 1, false, (k / 8) * Math.PI * 2, Math.PI / 4), { y: -0.2, color: cols[k % 2] }));
  K.add('flat', cyl(0.05, 0.05, p.h, 5, { y: -p.h / 2, color: 0xe8e8e8 }));
}
function chiBeachHouse(K, p, th) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xf0e6d0 }));
  K.add('flat', box(w + 0.4, 0.3, d + 0.4, { y: -0.15, color: 0x2a6a8a }));
  for (const f of faces(w, d)) {
    for (let k = -1; k <= 1; k++) K.add('flat', fbox(f, k * f.width / 3, -thick / 2 - 0.3, 0.04, f.width / 4, 1.4, 0.06, { color: 0x3a5a6a }));
    for (let k = 0; k < Math.floor(f.width / 1.2); k++) K.add('flat', fbox(f, -f.width / 2 + 0.6 + k * 1.2, -1.0, 0.7, 1.2, 0.12, 1.4, { color: k % 2 ? 0xff5a2b : 0xf8f8f0 })); // striped awnings
  }
}
function chiDock(K, p) {
  K.add('flat', box(p.w, 0.3, p.d, { y: -0.15, color: 0x8a6a48 }));
  for (let x = -p.w / 2 + 0.5; x < p.w / 2; x += 1.0) K.add('flat', box(0.06, 0.04, p.d, { x, y: 0.0, color: 0x5a4430 }));
  for (let x = -p.w / 2 + 1; x < p.w / 2; x += 4) for (const sz of [-1, 1]) K.add('flat', cyl(0.18, 0.18, p.h + 1.5, 6, { x, y: -(p.h + 1.5) / 2 + 0.4, z: sz * (p.d / 2 - 0.1), color: 0x4a3a2a }));
}
function chiTrail(K, p, th) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0x8a8478 }));
  K.add('flat', box(w * 0.5, 0.05, d, { y: 0.0, color: 0x6a6660 }), box(1.4, 0.06, d, { x: w * 0.12, y: 0.005, color: 0x2a6ab8 })); // path + bike lane
  for (let z = -d / 2 + 1; z < d / 2; z += 4) K.add('flat', box(0.15, 0.07, 1.8, { x: -w * 0.06, y: 0.01, z, color: 0xf0e070 }));
  K.add('flat', box(w * 0.22, 0.08, d, { x: -w * 0.38, y: 0.0, color: 0x4a8a3a }), box(w * 0.18, 0.08, d, { x: w * 0.4, y: 0.0, color: 0x5a9a42 })); // grass
  for (let s = 0; s < 3; s++) K.add('flat', box(1.2, 0.5, d, { x: w / 2 + 0.6 + s * 1.2, y: -0.6 - s * 0.6, color: 0xb8b2a6 })); // the lakeside revetment steps
  for (let z = -d / 2 + 6; z < d / 2; z += 16) { lamp(K, th, -w / 2 + 1.2, z); K.add('flat', cyl(0.2, 0.3, 2.4, 6, { x: -w / 2 + 2.6, y: 1.2, z: z + 7, color: 0x5a4430 }), ball(1.4, { x: -w / 2 + 2.6, y: 3.2, z: z + 7, color: 0x3a8a3a })); }
}
function chiPlaza(K, p, th, rng) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xc4bcae }));
  for (let x = -w / 2 + 6; x < w / 2; x += 6) K.add('flat', box(0.12, 0.03, d, { x, y: 0.0, color: 0x9a9286 }));
  for (let z = -d / 2 + 6; z < d / 2; z += 6) K.add('flat', box(w, 0.03, 0.12, { y: 0.0, z, color: 0x9a9286 }));
  for (const f of faces(w, d)) for (let a = -f.width / 2 + 5; a < f.width / 2; a += 9) { // trees in planters round the edge
    const x = f.nx * (f.half - 1.5) + f.tx * a, z = f.nz * (f.half - 1.5) + f.tz * a;
    K.add('flat', box(1.6, 0.6, 1.6, { x, y: 0.3, z, color: 0x7a7468 }), cyl(0.18, 0.25, 2.6, 6, { x, y: 1.6, z, color: 0x5a4430 }), ball(1.7, { x, y: 3.6, z, color: [0x3a8a3a, 0x4a9a3a, 0x2f7a35][Math.floor(rng() * 3)] }));
  }
}
// Cloud Gate: a squashed, boxy blob of sky-coloured chrome with an arch underneath.
function chiBean(K, p, th) {
  const g = new THREE.SphereGeometry(1, seg(32, 22), seg(18, 12));
  const pos = g.attributes.position, RX = 11, RY = 4.7, RZ = 5.6, CY = -4.6;
  const sgnPow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let ny = sgnPow(y, 0.75) * RY;
    if (y < 0) { const ax = Math.abs(x); if (ax < 0.62) ny = Math.max(ny, -RY + (RY * 0.95) * (1 - (ax / 0.62) * (ax / 0.62))); } // the omphalos arch
    pos.setXYZ(i, sgnPow(x, 0.8) * RX, CY + ny, sgnPow(z, 0.8) * RZ);
  }
  g.computeVertexNormals();
  const geo = part(g, {}), n = geo.attributes.normal, col = geo.attributes.color;
  // baked reflections (unlit chrome): sky overhead, a white horizon band, the plaza and its people below
  const sky = new THREE.Color(th.skyTop), hor = new THREE.Color(th.skyBot), grd = new THREE.Color(0x7a7268), white = new THREE.Color(0xffffff), c = new THREE.Color();
  for (let i = 0; i < n.count; i++) {
    const ny = n.getY(i), nx = n.getX(i);
    if (ny > 0.55) c.copy(hor).lerp(white, 0.35).lerp(sky, Math.min(1, (ny - 0.55) * 1.2));
    else if (ny > 0.05) c.copy(sky).lerp(hor, (0.55 - ny) * 1.6);
    else if (ny > -0.12) c.copy(white).lerp(hor, 0.25); // the horizon glint
    else c.copy(grd).lerp(hor, 0.25 + 0.2 * Math.sin(nx * 9));
    c.multiplyScalar(0.92);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  K.add('glow', geo);
}
function chiStage(K, p) {
  const { w, d } = p;
  K.add('flat', box(w, p.thick, d, { y: -p.thick / 2, color: 0x6a4a32 }), box(w - 0.4, 0.05, d - 0.4, { y: 0, color: 0x9a7a50 }));
  K.add('flat', box(w, 6, 0.6, { y: 3, z: -d / 2 + 0.3, color: 0xd8dce4 })); // the back wall
}
function chiRibbon(K, p) {
  const { w, d } = p, steel = 0xd8dce4;
  K.add('flat', box(w, 0.25, d, { y: -0.12, color: steel }), box(w + 0.1, 0.1, d * 0.5, { y: -0.3, color: 0xa8acb4 }));
  // the plate curls up and back past its far end
  let x = w / 2, y = 0, a = 0;
  for (let k = 0; k < 4; k++) { a += 0.45; const L = 1.6; K.add('flat', box(L, 0.2, d, { x: x + Math.cos(a) * L / 2, y: y + Math.sin(a) * L / 2, rz: a, color: steel })); x += Math.cos(a) * L; y += Math.sin(a) * L; }
  K.add('flat', box(0.25, p.h, 0.25, { x: -w / 2 + 0.5, y: -p.h / 2, color: 0x8a8e96 })); // its strut
}
function chiPool(K, p) {
  K.add('flat', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x3a3a3a }), box(p.w - 0.6, 0.02, p.d - 0.6, { y: 0.01, color: 0x7ab8d8 }));
}
// The Crown Fountain: a glass-block tower whose inner face is an LED screen with a face on it.
function chiCrown(K, p, th) {
  const { w, d, thick } = p, sz = p.tint === 1 ? 1 : -1;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xd8e6ee }));
  for (let y = -1; y > -thick; y -= 1.2) K.add('flat', box(w + 0.04, 0.06, d + 0.04, { y, color: 0xb8c8d4 }));
  const f = { nx: 0, nz: sz, tx: -sz, tz: 0, half: d / 2, width: w };
  K.add('glow', fbox(f, 0, -thick / 2, 0.05, w - 0.6, thick - 1.2, 0.05, { color: 0xe0b090 })); // the face, lit
  for (const s of [-1, 1]) K.add('glow', fbox(f, s * 1.3, -thick / 2 + 1.5, 0.1, 1.1, 0.6, 0.05, { color: 0x3a2418 })); // eyes
  K.add('glow', fbox(f, 0, -thick / 2 - 2.2, 0.1, 1.2, 0.9, 0.05, { color: 0x6a2a24 })); // mouth
  K.add('glow', fbox(f, 0, -thick / 2 - 2.8, 1.4, 0.3, 0.3, 2.6, { color: 0xbfe8ff })); // the spout
}
function chiPier(K, p, th) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0x9a948a }));
  K.add('flat', box(w - 0.6, 0.04, d - 0.6, { y: 0.0, color: 0x8a6a48 })); // boardwalk
  for (let x = -w / 2 + 1; x < w / 2; x += 1.5) K.add('flat', part(new THREE.PlaneGeometry(0.08, d - 0.6), { x, y: 0.015, rx: -Math.PI / 2, color: 0x6a4e34 }));
  for (const sz of [-1, 1]) {
    if (d > 12) railing(K, -w / 2, sz * (d / 2 - 0.2), w / 2, sz * (d / 2 - 0.2), 1.0, 0x2a3a4a, 4);
    for (let x = -w / 2 + 4; x < w / 2; x += 10) {
      if (d > 12) lamp(K, th, x, sz * (d / 2 - 0.8), 4.4);
      K.add('flat', cyl(0.35, 0.35, p.h + 2, 6, { x, y: -thick - (p.h + 2 - thick) / 2 + 1, z: sz * (d / 2 - 0.4), color: 0x4a3a2a }));
    }
  }
}
function chiHeadhouse(K, p, th, rng) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xd8c08a }));
  K.add('flat', box(w + 0.5, 0.5, d + 0.5, { y: -0.25, color: 0xa04a30 }));
  for (const f of faces(w, d)) for (let a = -f.width / 2 + 2; a < f.width / 2 - 1; a += 3) {
    const lit = night(th) && rng() < 0.5;
    K.add(lit ? 'glow' : 'flat', fbox(f, a, -thick / 2, 0.03, 1.6, thick * 0.55, 0.06, { color: lit ? 0xffd890 : 0x3a4656 }));
    K.add('flat', part(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 8, 1, false, 0, Math.PI), { x: f.nx * (f.half + 0.05) + f.tx * a, y: -thick / 2 + thick * 0.275, z: f.nz * (f.half + 0.05) + f.tz * a, rx: Math.PI / 2, rz: f.tx ? 0 : Math.PI / 2, color: 0xa04a30 }));
  }
}
function chiHeadTower(K, p) {
  K.add('flat', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xd8c08a }), box(p.w + 0.3, 0.3, p.d + 0.3, { y: -0.15, color: 0x4a8a6a }));
  for (const f of faces(p.w, p.d)) K.add('flat', fbox(f, 0, -p.thick / 2, 0.03, 1.2, 2.2, 0.06, { color: 0x3a4656 }));
}
function chiShed(K, p, th) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xe8e8ec }));
  K.add('glass', box(w - 1, thick - 1.4, d + 0.06, { y: -thick / 2 - 0.2 }));
  for (let x = -w / 2 + 2; x < w / 2; x += 4) K.add('flat', box(0.3, thick, d + 0.1, { x, y: -thick / 2, color: 0xf0f0f4 }));
  const ban = [0xff5a2b, 0x2be8ff, 0xffd23a, 0xff2bd6];
  for (let x = -w / 2 + 4, k = 0; x < w / 2; x += 8, k++) K.add('flat', box(1.2, 2.4, 0.06, { x, y: -1.6, z: (p.tint === 1 ? -1 : 1) * (d / 2 + 0.1), color: ban[k % 4] }));
}
// The wheel: hub, two rims of lights, 24 spokes a side, splayed A-frame legs down to the pier.
function chiWheel(K, p, th) {
  const R = 17, hubY = -0.6, legTo = -(p.h - 3) - 0.0, white = 0xe8eaf0;
  for (const sz of [-1.5, 1.5]) {
    K.add('flat', part(new THREE.TorusGeometry(R, 0.22, 4, seg(64, 40)), { y: hubY, z: sz, color: white }));
    K.add('flat', part(new THREE.TorusGeometry(R - 1.2, 0.12, 3, seg(64, 40)), { y: hubY, z: sz, color: white }));
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; K.add('flat', cyl(0.07, 0.07, R, 4, { x: Math.cos(a) * R / 2, y: hubY + Math.sin(a) * R / 2, z: sz * 0.9, rz: a - Math.PI / 2, color: 0xc8ccd4 })); }
  }
  for (let k = 0; k < 48; k++) { const a = (k / 48) * Math.PI * 2; K.add('glow', box(0.35, 0.35, 3.4, { x: Math.cos(a) * (R + 0.15), y: hubY + Math.sin(a) * (R + 0.15), color: [0xffffff, 0xff5a2b, 0x2be8ff, 0xffd23a][k % 4] })); }
  K.add('flat', cyl(1.1, 1.1, 4.4, 10, { y: hubY, rx: Math.PI / 2, color: 0xc8302a }), cyl(1.6, 1.6, 0.5, 10, { y: hubY, z: 0, rx: Math.PI / 2, color: 0xd8dce4 }));
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) { // legs
    const L = Math.sqrt(legTo * legTo + 9 * 9), a = Math.atan2(9 * sx, -legTo);
    K.add('flat', box(0.7, L, 0.7, { x: sx * 4.5, y: hubY + legTo / 2, z: sz * 4.2, rz: a, rx: sz * 0.2, color: white }));
  }
}
function chiGondola(K, p) {
  const { w, d } = p, cols = [0xff5a2b, 0x2be8ff, 0xffd23a, 0xff2bd6, 0x7bff4a, 0xb45bff];
  const c = cols[(p.tint >= 0 ? p.tint : 0) % cols.length];
  K.add('flat', box(w, 0.4, d, { y: -0.2, color: 0xe8eaf0 }), box(w + 0.1, 0.12, d + 0.1, { y: -0.42, color: c }));
  for (const sx of [-1, 1]) K.add('flat', box(0.08, 0.08, d, { x: sx * (w / 2 - 0.05), y: 0.85, color: c }), box(0.08, 0.85, 0.08, { x: sx * (w / 2 - 0.05), y: 0.42, z: -d / 2 + 0.1, color: c }), box(0.08, 0.85, 0.08, { x: sx * (w / 2 - 0.05), y: 0.42, z: d / 2 - 0.1, color: c }));
  K.add('flat', box(0.14, 2.4, 0.14, { x: 0, y: 1.2, z: -d / 2 - 0.1, color: 0xc8ccd4 }), box(0.14, 2.4, 0.14, { x: 0, y: 1.2, z: d / 2 + 0.1, color: 0xc8ccd4 })); // hangers to the rim pivot
  K.add('glow', box(0.6, 0.12, 0.6, { y: -0.5, color: 0xfff0b0 }));
}
function chiBallroom(K, p, th, rng) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xe0d0b0 }));
  K.add('flat', box(w + 0.6, 0.5, d + 0.6, { y: -0.25, color: 0xa04a30 }), box(w + 0.2, 0.3, d + 0.2, { y: -thick + 2.5, color: 0xa04a30 }));
  for (const f of faces(w, d)) for (let a = -f.width / 2 + 2.5; a < f.width / 2 - 1; a += 3.4) {
    const lit = night(th) && rng() < 0.6;
    K.add(lit ? 'glow' : 'flat', fbox(f, a, -thick / 2 - 0.2, 0.03, 2.0, thick * 0.5, 0.06, { color: lit ? 0xffd890 : 0x3a5a7a }));
  }
}
function chiDome(K, p, th) {
  const t = p.tint >= 0 ? p.tint : 0, r = p.r, H = p.thick;
  if (t === 0) { // the drum, ringed with arched windows
    K.add('flat', cyl(r, r, H, seg(24, 16), { y: -H / 2, color: 0xe8dcc0 }), cyl(r + 0.35, r + 0.35, 0.4, seg(24, 16), { y: -0.2, color: 0xa04a30 }));
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; K.add('flat', box(1.2, H * 0.55, 0.1, { x: Math.cos(a) * (r + 0.02), y: -H / 2, z: Math.sin(a) * (r + 0.02), ry: -a + Math.PI / 2, color: 0x3a5a7a })); }
  } else if (t === 1) { // the green copper cap, ribbed
    K.add('flat', cyl(r, r + 2.4, H, seg(24, 16), { y: -H / 2, color: 0x5a9a7a }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; K.add('flat', box(0.25, H + 0.1, 0.4, { x: Math.cos(a) * (r + 1.2), y: -H / 2, z: Math.sin(a) * (r + 1.2), ry: -a, rz: 0, color: 0x3a7a5a })); }
  } else { // the lantern
    K.add('flat', cyl(r, r + 1.6, H, 8, { y: -H / 2, color: 0x5a9a7a }), cyl(r + 0.15, r + 0.15, 0.3, 8, { y: -0.15, color: GOLD }));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; K.add('glow', box(0.5, 1.4, 0.1, { x: Math.cos(a) * (r + 0.5), y: -H / 2, z: Math.sin(a) * (r + 0.5), ry: -a + Math.PI / 2, color: 0xffe6a0 })); }
  }
}
function chiRaft(K, p) {
  K.add('flat', part(new THREE.TorusGeometry(p.r - 0.45, 0.5, 6, seg(20, 12)), { rx: Math.PI / 2, y: -0.45, color: 0xff2b6a }));
  K.add('flat', cyl(p.r - 0.5, p.r - 0.5, 0.3, seg(20, 12), { y: -0.15, color: 0xffd23a }));
  K.add('flat', cyl(0.05, 0.05, 2.2, 5, { x: 1.4, y: 1.1, z: 1.0, color: 0xe8e8e8 }));
  for (let k = 0; k < 6; k++) K.add('flat', part(new THREE.CylinderGeometry(0.02, 1.3, 0.4, 1, 1, false, (k / 6) * Math.PI * 2, Math.PI / 3), { x: 1.4, y: 2.2, z: 1.0, color: k % 2 ? 0xffffff : 0x2be8ff }));
  K.add('glow', cyl(p.r - 0.6, p.r - 0.6, 0.05, seg(20, 12), { y: -1.0, color: 0x5ff0ff }));
}
function chiBuoy(K, p) {
  const c = p.tint === 1 ? 0x2a9a3a : 0xd82a2a;
  K.add('flat', cyl(p.r * 0.7, p.r, p.thick, 8, { y: -p.thick / 2, color: c }), cyl(p.r + 0.05, p.r + 0.05, 0.3, 8, { y: -p.thick * 0.6, color: 0xf0f0f0 }));
  K.add('flat', box(0.12, 1.4, 0.12, { x: p.r * 0.55, y: 0.7, color: 0x2a2a2a }));
  K.add('glow', ball(0.22, { x: p.r * 0.55, y: 1.5, color: p.tint === 1 ? 0x5aff7a : 0xff4a4a }));
}
function chiBreakwater(K, p, th, rng) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xa8a49a }));
  for (let z = -d / 2; z < d / 2; z += 2.2) for (const sx of [-1, 1]) K.add('flat', ball(1.0 + rng() * 0.5, { x: sx * (w / 2 + 0.6), y: -p.h + 0.3, z, ry: rng() * 3, color: [0x6a6660, 0x7a766e, 0x5a5650][Math.floor(rng() * 3)] }));
  for (let z = -d / 2 + 4; z < d / 2; z += 10) K.add('flat', cyl(0.25, 0.3, 0.7, 6, { x: w / 2 - 0.6, y: 0.35, z, color: 0x2a2a2a })); // bollards
}
function chiFogHouse(K, p, th) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0xf0f0ec }), box(w + 0.6, 0.4, d + 0.6, { y: -0.2, color: 0xc0302a }));
  for (const f of faces(w, d)) K.add(night(th) ? 'glow' : 'flat', fbox(f, 0, -thick / 2, 0.03, 1.4, 1.6, 0.06, { color: night(th) ? 0xffd890 : 0x3a4656 }));
}
function chiBelfry(K, p) {
  K.add('flat', box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xf0f0ec }), box(p.w + 0.3, 0.3, p.d + 0.3, { y: -0.15, color: 0xc0302a }));
  K.add('flat', cyl(0.5, 0.7, 0.8, 8, { y: -1.4, z: p.d / 2 + 0.5, color: 0x8a6a2a }));
}
function chiLighthouse(K, p, th) {
  const r = p.r, H = p.thick;
  K.add('flat', cyl(r - 0.7, r, H - 0.6, seg(16, 10), { y: -0.6 - (H - 0.6) / 2, color: 0xf4f4f0 }));
  K.add('flat', cyl(r - 0.65, r - 0.6, 1.2, seg(16, 10), { y: -1.6, color: 0xc0302a }));
  K.add('flat', cyl(r, r, 0.6, seg(16, 10), { y: -0.3, color: 0x2a2a2a }));
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; K.add('flat', box(0.06, 1.0, 0.06, { x: Math.cos(a) * (r - 0.1), y: 0.5, z: Math.sin(a) * (r - 0.1), color: 0xc0302a })); }
  K.add('flat', part(new THREE.TorusGeometry(r - 0.1, 0.05, 3, seg(16, 10)), { rx: Math.PI / 2, y: 1.0, color: 0xc0302a }));
  for (let k = 0; k < 4; k++) K.add('flat', box(0.5, 1.0, 0.1, { x: Math.cos(k * 1.7) * (r - 0.45), y: -4 - k * 3, z: Math.sin(k * 1.7) * (r - 0.45), ry: -k * 1.7 + Math.PI / 2, color: 0x2a3a4a }));
}

// ================================================================== stage 3: the Skydeck
// SEARS 312's tubes: bronze-black curtain wall (lit windows at night), mechanical belts, red beacons.
function chiSears(K, p, th) {
  const { w, d, thick: H } = p;
  const fac = meterBox(w, H, d, FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: (p.tint % 4) * 4, v0: (p.tint % 3) * 4, color: 0x4a4440 });
  fac.translate(0, -H / 2, 0); K.add('facade', fac);
  K.add('flat', box(w, 0.4, d, { y: -0.2, color: 0x1a1a1e }));
  for (const f of faces(w, d)) {
    K.add('flat', fbox(f, 0, 0.15, -0.15, f.width, 0.3, 0.3, { color: 0x2a2a30 }));
    for (const wy of [30, 54, 78, 96]) { const y = wy - p.h; if (y < -2 && y > -H) K.add('flat', fbox(f, 0, y, 0.12, f.width + 0.2, 1.6, 0.24, { color: 0x15151a })); } // mechanical belts
    for (let a = -f.width / 2; a <= f.width / 2 + 0.01; a += f.width / 4) K.add('flat', fbox(f, a, -Math.min(H, 70) / 2, 0.1, 0.18, Math.min(H, 70), 0.2, { color: 0x101014 })); // mullions
  }
  for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('glow', box(0.3, 0.3, 0.3, { x: sx * (w / 2 - 0.4), y: 0.4, z: sz * (d / 2 - 0.4), color: 0xff2a2a }));
}
function chiWasher(K, p, th) {
  const { w, d } = p, cable = p.tint > 0 ? p.tint : 20;
  K.add('flat', box(w, 0.3, d, { y: -0.15, color: 0xd8d8d0 }), box(w + 0.1, 0.2, d + 0.1, { y: -0.4, color: 0xf0a020 }));
  K.add('flat', box(w, 0.06, 0.06, { y: 1.0, z: d / 2 - 0.05, color: 0xd8d8d0 }), box(w, 0.06, 0.06, { y: 1.0, z: -d / 2 + 0.05, color: 0xd8d8d0 }));
  for (const sx of [-1, 1]) {
    K.add('flat', box(0.5, 0.6, d, { x: sx * (w / 2 - 0.25), y: 0.3, color: 0x3a3a3a })); // hoist motors
    K.add('flat', box(0.05, cable, 0.05, { x: sx * (w / 2 - 0.25), y: cable / 2 + 0.6, color: 0x8a8a8a })); // cables
  }
  K.add('glow', box(0.5, 0.2, 0.3, { y: -0.55, color: night(th) ? 0xfff0b0 : 0xffe080 }));
}
function chiLedge(K, p, th) {
  const { w, d } = p, H = 3, frame = 0x2a2a30;
  K.add('glass', box(w, 0.3, d, { y: -0.15 }));
  K.add('glow', box(w + 0.04, 0.06, d + 0.04, { y: -0.32, color: 0x8ff0ff }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', box(0.1, H, 0.1, { x: sx * (w / 2 - 0.05), y: H / 2, z: sz * (d / 2 - 0.05), color: frame }));
  for (const y of [0.05, H]) for (const f of faces(w, d)) K.add('flat', fbox(f, 0, y, -0.05, f.width, 0.1, 0.1, { color: frame }));
  K.add(night(th) ? 'glow' : 'flat', box(w * 0.5, 0.06, d * 0.6, { y: H - 0.05, color: 0xfff6e0 }));
}
function chiMastPad(K, p) {
  K.add('flat', cyl(p.r, p.r, 0.2, 8, { y: -0.1, color: 0xc0c4cc }), cyl(p.r * 0.6, p.r * 0.8, 0.3, 8, { y: -0.35, color: 0x3a3a40 }));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; K.add('flat', box(0.05, 0.8, 0.05, { x: Math.cos(a) * (p.r - 0.08), y: 0.4, z: Math.sin(a) * (p.r - 0.08), color: 0xf0a020 })); }
  K.add('glow', cyl(p.r * 0.5, p.r * 0.5, 0.05, 8, { y: -0.52, color: 0x5ff0ff }));
}
function chiMastTop(K, p, th) {
  const r = p.r, down = p.h - 100 + 0.6; // the lattice mast drawn down to the main roof (100 m)
  K.add('flat', cyl(r, r, 0.4, 10, { y: -0.2, color: 0xc0c4cc }));
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; K.add('flat', box(0.06, 1.0, 0.06, { x: Math.cos(a) * (r - 0.1), y: 0.5, z: Math.sin(a) * (r - 0.1), color: 0xff2a3a })); }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; K.add('flat', box(0.14, down, 0.14, { x: Math.cos(a) * 0.8, y: -0.4 - down / 2, z: Math.sin(a) * 0.8, color: k ? 0xd8d8d8 : 0xc0302a })); }
  for (let y = -1.5; y > -down; y -= 2) { K.add('flat', cyl(0.85, 0.85, 0.08, 3, { y, color: 0xd8d8d8 })); K.add('flat', box(0.06, 2.2, 0.06, { x: 0.4, y: y - 1, z: 0.4, rx: 0.6, color: 0xd8d8d8 })); }
  for (let y = -3; y > -down; y -= 6) K.add('flat', cyl(1.0, 1.0, 1.0, 6, { y, color: 0xc0302a })); // red bands
  K.add('glow', ball(0.35, { x: r - 0.4, y: 1.4, z: 0, color: 0xff2a2a }), ball(0.35, { x: -r + 0.4, y: 1.4, z: 0, color: 0xff2a2a }));
}
function chiAntenna(K, p) {
  const H = p.thick;
  K.add('flat', cyl(0.18, 0.5, H, 6, { y: -H / 2, color: 0xd8d8d8 }));
  for (let y = -4; y > -H; y -= 6) K.add('flat', cyl(0.45, 0.45, 2, 6, { y, color: 0xc0302a }));
  K.add('glow', ball(0.4, { y: 0.2, color: 0xff2a2a }));
}
// Glass towers of the night city: curtain wall, a crown of LED strips, rooftop plant.
function chiGlass(K, p, th, rng) {
  const { w, d, thick: H } = p, tints = [0x8a9ab0, 0x9aa8b8, 0x6a7a90, 0xa8b0c0, 0x7a8aa0, 0xb0b8c4, 0x5a6a80, 0x9098a8];
  const fac = meterBox(w, H, d, FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: Math.floor(rng() * 8) * 2, v0: Math.floor(rng() * 4) * 4, color: tints[(p.tint >= 0 ? p.tint : 0) % 8] });
  fac.translate(0, -H / 2, 0); K.add('facade', fac);
  K.add('flat', box(w, 0.3, d, { y: -0.15, color: 0x3a3c46 }));
  const neon = [0xff2b4a, 0x2be8ff, 0xffd23a, 0xff5a2b][Math.floor(rng() * 4)];
  for (const f of faces(w, d)) {
    K.add('flat', fbox(f, 0, 0.2, -0.15, f.width, 0.4, 0.3, { color: 0x4a4c56 }));
    K.add('neon', fbox(f, 0, -0.6, 0.06, f.width + 0.2, 0.18, 0.12, { color: neon }));
    if (rng() < 0.5) K.add('neon', fbox(f, (rng() - 0.5) * (f.width - 2), -12, 0.1, 0.25, 20, 0.12, { color: neon }));
  }
  K.add('flat', box(w * 0.3, 1.2, d * 0.25, { x: w * 0.25, y: 0.6, z: -d * 0.25, color: 0x5a5c66 })); // plant room
  K.add('glow', box(0.25, 0.25, 0.25, { x: -w / 2 + 0.5, y: 0.4, z: d / 2 - 0.5, color: 0xff2a2a }));
}
// The CHI sign: a steel frame with three neon letters on each face; walk along its top.
function chiSign(K, p, th) {
  const { w, d, thick: H } = p, red = 0xff2b4a, cyan = 0x2be8ff;
  K.add('flat', box(w, 0.3, d, { y: -0.15, color: 0x5a5c66 }));
  K.add('flat', box(w - 0.4, H - 0.3, 0.4, { y: -H / 2 - 0.15, color: 0x15151c }));
  for (const sx of [-1, 1]) K.add('flat', box(0.4, H, d, { x: sx * (w / 2 - 0.2), y: -H / 2, color: 0x3a3c46 }));
  const L = (x0, y0, segs, z, col) => { for (const [x, y, sw, sh] of segs) K.add('neon', box(sw, sh, 0.12, { x: x0 + x, y: y0 + y, z, color: col })); };
  const C = [[-1.1, 0, 0.45, 3.6], [0, 1.6, 2.6, 0.45], [0, -1.6, 2.6, 0.45]];
  const Hh = [[-1.1, 0, 0.45, 3.6], [1.1, 0, 0.45, 3.6], [0, 0, 2.2, 0.45]];
  const I = [[0, 0, 0.45, 3.6], [0, 1.6, 1.6, 0.4], [0, -1.6, 1.6, 0.4]];
  for (const sz of [-1, 1]) {
    const z = sz * 0.28, yc = -H / 2;
    L(-3.4, yc, C, z, red); L(0, yc, Hh, z, red); L(3.4, yc, I, z, red);
    K.add('neon', box(w - 0.6, 0.12, 0.12, { y: -0.6, z, color: cyan }), box(w - 0.6, 0.12, 0.12, { y: -H + 0.3, z, color: cyan }));
  }
}
// JOHN 875: black, X-braced, tapering; twin antennas on the roof.
function chiHancock(K, p, th) {
  const { w, d, thick: H } = p, upper = p.tint === 1;
  const fac = meterBox(w, H, d, FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], color: 0x3a3a40 });
  fac.translate(0, -H / 2, 0); K.add('facade', fac);
  K.add('flat', box(w + 0.2, 0.5, d + 0.2, { y: -0.25, color: 0x1a1a1e }));
  const span = upper ? H - 1 : 22; // the X-braces on each face, one storey-band at a time
  for (const f of faces(w, d)) {
    for (let top = -0.5; top > -Math.min(H, upper ? H : 60) + 1; top -= span) {
      const L = Math.sqrt(f.width * f.width + span * span), a = Math.atan2(span, f.width);
      for (const s of [-1, 1]) K.add('flat', fbox(f, 0, top - span / 2, 0.15, L, 0.45, 0.25, { color: 0x6a6a70, [f.tx ? 'rz' : 'rx']: s * a * (f.tx ? 1 : -1) }));
      K.add('flat', fbox(f, 0, top - span, 0.15, f.width, 0.5, 0.25, { color: 0x6a6a70 }));
    }
    for (const s of [-1, 1]) K.add('flat', fbox(f, s * (f.width / 2 - 0.2), -Math.min(H, 60) / 2, 0.15, 0.5, Math.min(H, 60), 0.3, { color: 0x6a6a70 }));
  }
  if (upper) for (const sx of [-1, 1]) {
    K.add('flat', cyl(0.25, 0.45, 22, 6, { x: sx * (w / 2 - 1.2), y: 11, z: -d / 2 + 1.2, color: 0xe8e8e8 }));
    for (let y = 4; y < 22; y += 5) K.add('flat', cyl(0.5, 0.5, 1.2, 6, { x: sx * (w / 2 - 1.2), y, z: -d / 2 + 1.2, color: 0xc0302a }));
    K.add('glow', ball(0.4, { x: sx * (w / 2 - 1.2), y: 22.3, z: -d / 2 + 1.2, color: 0xff2a2a }));
  }
  if (!upper) K.add('neon', box(w + 0.3, 0.2, d + 0.3, { y: -1.0, color: 0xff2b4a }));
}

// ================================================================== the boss arena
function chiArenaFloor(K, p) {
  const { w, d, thick } = p;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0x34343c }));
  K.add('flat', box(56, 0.04, 48, { y: 0.0, color: 0xa81c2a })); // the court
  const W = 0xf0ece0, line = (x, z, sw, sd) => K.add('flat', box(sw, 0.05, sd, { x, y: 0.01, z, color: W }));
  line(0, -24, 56, 0.3); line(0, 24, 56, 0.3); line(-28, 0, 0.3, 48); line(28, 0, 0.3, 48); line(0, 0, 56, 0.25);
  K.add('flat', part(new THREE.RingGeometry(5.6, 6.0, seg(40, 24)), { rx: -Math.PI / 2, y: 0.02, color: W }));
  // the bull's head at centre court: a black wedge with white horns
  K.add('flat', part(new THREE.CircleGeometry(5.5, seg(40, 24)), { rx: -Math.PI / 2, y: 0.015, color: 0x15151a }));
  K.add('flat', box(3.2, 0.05, 4.2, { y: 0.03, z: 0.5, color: 0xa81c2a }), box(2.0, 0.05, 1.4, { y: 0.03, z: 3.0, color: 0xa81c2a }));
  for (const s of [-1, 1]) K.add('flat', box(1.0, 0.05, 3.2, { x: s * 2.4, y: 0.035, z: -1.6, ry: s * 0.7, color: W }), box(0.7, 0.05, 1.6, { x: s * 3.3, y: 0.035, z: -3.4, ry: -s * 0.3, color: W }));
  for (const sz of [-1, 1]) { // the keys at each end
    K.add('flat', box(10, 0.045, 9, { y: 0.012, z: sz * 19.5, color: 0x8a1420 }));
    K.add('flat', part(new THREE.RingGeometry(3.4, 3.7, seg(32, 20), 1, 0, Math.PI), { rx: -Math.PI / 2, rz: sz > 0 ? Math.PI : 0, y: 0.02, z: sz * 15, color: W }));
  }
  for (let x = -27; x <= 27; x += 2) K.add('hazard', box(1.0, 0.05, 0.4, { x, y: 0.02, z: -23.6 }), box(1.0, 0.05, 0.4, { x, y: 0.02, z: 23.6 })); // charge-lane warning stripes
}
function chiArenaWall(K, p, th, rng) {
  const { w, d, thick } = p, long = w > d;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0x4a4a52 }));
  K.add('glow', box(long ? w : d + 0.04, 0.4, long ? d + 0.04 : 0.4, { y: -0.6, color: 0xff2b4a }));
  const n = Math.floor((long ? w : d) / 14), f = faces(w, d)[long ? (p.z < 0 ? 1 : 0) : (p.x < 0 ? 2 : 3)];
  for (let k = 0; k < n; k++) {
    const a = -f.width / 2 + (k + 0.5) * (f.width / n);
    K.add('ads', atlasQuad(9, 3.2, adUV(Math.floor(rng() * 64)), { x: f.nx * (f.half + 0.05) + f.tx * a, y: -2.6, z: f.nz * (f.half + 0.05) + f.tz * a, ry: f.ry }));
  }
}
function chiBleacher(K, p, th, rng) {
  const { w, d, thick } = p, long = w > d, L = long ? w : d;
  K.add('flat', box(w, thick, d, { y: -thick / 2, color: 0x6a6670 }));
  for (let s = -L / 2, k = 0; s < L / 2 - 0.1; s += 6.5, k++) { // seat blocks with aisles between
    const len = Math.min(6, L / 2 - s);
    K.add('flat', box(long ? len : 1.0, 0.3, long ? 1.0 : len, { x: long ? s + len / 2 : 0, y: 0.05, z: long ? 0 : s + len / 2, color: k % 2 ? 0xa81c2a : 0x8a1420 }));
    K.add('flat', box(long ? len : 0.25, 0.45, long ? 0.25 : len, { x: long ? s + len / 2 : -Math.sign(p.x) * -0.4, y: 0.25, z: long ? -Math.sign(p.z) * -0.4 : s + len / 2, color: k % 2 ? 0xc02030 : 0xa01828 })); // seat backs
  }
  K.add('flat', box(long ? w : 0.15, 0.15, long ? 0.15 : d, { x: long ? 0 : -Math.sign(p.x) * (w / 2 - 0.07), y: -0.08, z: long ? -Math.sign(p.z) * (d / 2 - 0.07) : 0, color: 0xffcc1a })); // nosing
}
function chiPylon(K, p, th) {
  const { w, d, thick: H } = p;
  K.add('flat', box(w, H, d, { y: -H / 2, color: 0x7a7a82 }));
  for (let y = -H + 0.3; y < -H + 3; y += 0.6) K.add('hazard', box(w + 0.06, 0.3, d + 0.06, { y })); // where it hits
  for (let y = -4; y > -H + 3.5; y -= 3) K.add('flat', box(w + 0.12, 0.2, d + 0.12, { y, color: 0x5a5a62 }));
  K.add('flat', box(w + 0.4, 0.3, d + 0.4, { y: -0.15, color: 0x3a3a42 }));
  for (const f of faces(w, d)) { // floodlight heads hung outside the top, aimed down at the court
    K.add('flat', fbox(f, 0, -0.9, 0.5, w + 0.6, 1.4, 0.4, { color: 0x2a2a30 }));
    for (const a of [-0.8, 0, 0.8]) for (const y of [-0.6, -1.2]) K.add('glow', fbox(f, a, y, 0.72, 0.5, 0.45, 0.05, { color: 0xfff6e0 }));
  }
  K.add('glow', ball(0.25, { x: w / 2 - 0.3, y: 0.3, z: d / 2 - 0.3, color: 0xff2a2a }));
}
function chiJumbo(K, p, th, rng) {
  const { w, d, thick: H } = p;
  K.add('flat', box(w, H, d, { y: -H / 2, color: 0x15151a }), box(w + 0.3, 0.3, d + 0.3, { y: -0.15, color: 0x3a3a42 }));
  for (const f of faces(w, d)) K.add('ads', atlasQuad(f.width - 0.6, H - 1.0, adUV(Math.floor(rng() * 64)), { x: f.nx * (f.half + 0.03), y: -H / 2, z: f.nz * (f.half + 0.03), ry: f.ry }));
  K.add('glow', box(w + 0.1, 0.25, d + 0.1, { y: -0.4, color: 0xff2b4a }), box(w + 0.1, 0.25, d + 0.1, { y: -H + 0.2, color: 0xff2b4a }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', box(0.06, 30, 0.06, { x: sx * (w / 2 - 0.3), y: 15, z: sz * (d / 2 - 0.3), color: 0x2a2a30 })); // its cables
  K.add('flat', box(w + 1.2, 0.5, d + 1.2, { y: -H - 0.3, color: 0x2a2a30 }));
}
function chiNone() {}

export const STYLES = {
  chiBlock, chiRiverwalk, chiTrack, chiTruss, chiTrain, chiStation, chiKiosk, chiBrick, chiStone, chiWaterTower, chiDeco, chiDecoCrown,
  chiCorncob, chiPetal, chiLiftSpan, chiLiftTower, chiLiftBeam, chiBascule, chiBoat, chiJetski, chiSailboat,
  chiSand, chiLifeguard, chiUmbrella, chiBeachHouse, chiDock, chiTrail, chiPlaza, chiBean, chiStage, chiRibbon, chiPool, chiCrown,
  chiPier, chiHeadhouse, chiHeadTower, chiShed, chiWheel, chiGondola, chiBallroom, chiDome, chiRaft, chiBuoy, chiBreakwater, chiFogHouse, chiBelfry, chiLighthouse,
  chiSears, chiWasher, chiLedge, chiMastPad, chiMastTop, chiAntenna, chiGlass, chiSign, chiHancock,
  chiArenaFloor, chiArenaWall, chiBleacher, chiPylon, chiJumbo, chiNone,
};
