// NEO EURO: backdrops, the distant landmarks (render-only, unfogged, hazed toward the horizon with B.c).
// Each returns an Object3D in its own units; js/render/backdrops.js places, turns and scales it.
// B = { THREE, Kit, box, cyl, ball, part, seg, c, mesh, rng, night }.
import { mulberry32 } from '../../sim/util.js';

const roofCols = ['#c8643c', '#b85a34', '#d27448', '#a84e30'];
const wallCols = ['#f0d8b0', '#e8c090', '#f4e4c8', '#e0b080', '#f0ccb0'];

// A little house with a hipped terracotta roof (x, z centre; w × d; wall height h).
function house(K, B, x, z, w, d, h, rng, y0 = 0) {
  K.add('solid', B.box(w, h, d, { x, y: y0 + h / 2, z, color: B.c(wallCols[Math.floor(rng() * wallCols.length)]) }));
  K.add('solid', B.part(new B.THREE.ConeGeometry(Math.max(w, d) * 0.72, Math.min(w, d) * 0.45, 4), { x, y: y0 + h + Math.min(w, d) * 0.22, z, ry: Math.PI / 4, sz: d / w, color: B.c(roofCols[Math.floor(rng() * roofCols.length)]) }));
  if (B.night) K.add('glow', B.box(w * 0.3, 0.8, 0.2, { x, y: y0 + h * 0.55, z: z + d / 2 + 0.1, color: '#ffd890' }));
}
// A bell tower: a shaft and a pointed cap.
function campanile(K, B, x, z, s, h, col, cap, y0 = 0) {
  K.add('solid', B.box(s, h, s, { x, y: y0 + h / 2, z, color: B.c(col) }));
  K.add('solid', B.box(s * 1.1, s * 0.8, s * 1.1, { x, y: y0 + h - s * 0.5, z, color: B.c('#f0ece0') }));
  K.add('solid', B.part(new B.THREE.ConeGeometry(s * 0.75, s * 1.6, 4), { x, y: y0 + h + s * 0.8, z, ry: Math.PI / 4, color: B.c(cap) }));
}
function cypress(K, B, x, z, h, y0 = 0) {
  K.add('solid', B.part(new B.THREE.ConeGeometry(h * 0.13, h, 5), { x, y: y0 + h / 2, z, color: B.c('#2e4a2a') }));
}
function domeOn(K, B, x, z, r, y0, col, lantern = true) {
  K.add('solid', B.cyl(r, r, r * 0.6, B.seg(14, 8), { x, y: y0 + r * 0.3, z, color: B.c('#ece4d4') }));
  K.add('solid', B.part(new B.THREE.SphereGeometry(r, B.seg(14, 8), B.seg(8, 5), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: y0 + r * 0.6, z, sy: 1.1, color: B.c(col) }));
  if (lantern) K.add('solid', B.cyl(r * 0.16, r * 0.2, r * 0.5, 6, { x, y: y0 + r * 1.85, z, color: B.c('#ece4d4') }));
}

export const BACKDROPS = {
  // Tuscan hills: rolling green-ochre ridges, rows of cypresses, farmhouses and a hill town (along x).
  tuscanHills(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 611), len = o.len ?? 1100;
    for (let i = 0; i < 9; i++) {
      const x = (i / 8 - 0.5) * len, rr = len / 8 * (0.8 + rng() * 0.5), hh = 40 + rng() * 60, z = (rng() - 0.5) * 120;
      K.add('solid', B.part(new B.THREE.SphereGeometry(1, B.seg(14, 8), B.seg(8, 5), 0, Math.PI * 2, 0, Math.PI / 2), { x, z, sx: rr, sy: hh, sz: rr * 0.55, color: B.c(i % 2 ? '#8aa04a' : '#a8a050') }));
      for (let k = 0; k < 6; k++) { const a = rng() * Math.PI, d = rng() * 0.75; cypress(K, B, x + Math.cos(a) * rr * d, z + Math.sin(a) * rr * 0.4 * d + 10, 14 + rng() * 8, hh * Math.sqrt(Math.max(0, 1 - d * d)) - 4); }
      if (rng() < 0.6) { const hx = x + (rng() - 0.5) * rr * 0.6; house(K, B, hx, z, 14, 10, 8, rng, hh * 0.8); }
    }
    const tx = len * 0.18; // the hill town with its tower
    for (let k = 0; k < 10; k++) house(K, B, tx + (rng() - 0.5) * 60, (rng() - 0.5) * 40, 10 + rng() * 6, 8 + rng() * 6, 8 + rng() * 6, rng, 70);
    campanile(K, B, tx, 0, 7, 40, '#c8a070', '#9a4a2c', 70);
    return B.mesh(K);
  },
  // A ring of terracotta-roofed town round the play space: houses, towers, a dome or two.
  euroRoofs(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 61), r0 = o.r0 ?? 150, r1 = o.r1 ?? 250;
    for (let i = 0; i < (o.n ?? 60); i++) {
      const a = rng() * Math.PI * 2, r = r0 + rng() * (r1 - r0), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const w = 12 + rng() * 14, d = 10 + rng() * 12, h = 6 + rng() * 12;
      if (rng() < 0.08) campanile(K, B, x, z, 6, 30 + rng() * 20, '#c09070', '#8a4a2a');
      else if (rng() < 0.04) domeOn(K, B, x, z, 10, 14, '#c8643c');
      else house(K, B, x, z, w, d, h, rng);
    }
    return B.mesh(K);
  },
  // The Amalfi coast: cliffs plunging into the sea, pastel villages clinging to them (along x).
  amalfiCoast(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 621), len = o.len ?? 700;
    for (let i = 0; i < 8; i++) {
      const x = (i / 7 - 0.5) * len, hh = 90 + rng() * 120, rr = len / 7 * 0.75;
      K.add('solid', B.part(new B.THREE.ConeGeometry(rr, hh, 6, 1), { x, y: hh / 2 - 6, z: (rng() - 0.5) * 40, sz: 0.6, color: B.c(i % 2 ? '#7a8a5a' : '#8a8060') }));
      for (let k = 0; k < 9; k++) {
        const t = rng(), y = t * hh * 0.45, xx = x + (rng() - 0.5) * rr * (1 - t) * 1.1;
        K.add('solid', B.box(7 + rng() * 6, 6 + rng() * 4, 6, { x: xx, y: y + 3, z: rr * 0.6 * (1 - t) * 0.5 + 6, color: B.c(['#f2d18a', '#f2a98a', '#f0e6d2', '#e88a6a', '#a8d0e0', '#f4c4c4'][k % 6]) }));
      }
      if (rng() < 0.5) domeOn(K, B, x, rr * 0.25, 7, hh * 0.15, '#2a8a5a', true);
    }
    return B.mesh(K);
  },
  // Venice across the water: a long low band of houses, campanili and the odd dome (along x).
  lagoonTown(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 631), len = o.len ?? 420;
    for (let x = -len / 2; x < len / 2;) {
      const w = 10 + rng() * 12;
      house(K, B, x + w / 2, (rng() - 0.5) * 30, w, 12 + rng() * 10, 10 + rng() * 10, rng);
      x += w + rng() * 3;
    }
    for (let k = 0; k < 4; k++) campanile(K, B, (rng() - 0.5) * len, (rng() - 0.5) * 20, 6, 40 + rng() * 25, '#a8503a', '#5a9a7a');
    domeOn(K, B, (rng() - 0.5) * len * 0.6, -10, 12, 18, '#8a949c');
    return B.mesh(K);
  },
  // San Giorgio Maggiore on its island: white Palladian facade, the dome, the campanile.
  sanGiorgio(o, th, B) {
    const K = new B.Kit();
    K.add('solid', B.box(120, 3, 60, { y: 1.5, color: B.c('#c8bca8') }));
    K.add('solid', B.box(30, 26, 40, { y: 16, color: B.c('#f4f0e6') }), B.box(18, 34, 4, { y: 20, z: 21, color: B.c('#ffffff') }));
    K.add('solid', B.part(new B.THREE.ConeGeometry(10, 8, 3), { y: 41, z: 21, ry: Math.PI, sz: 0.3, color: B.c('#ffffff') }));
    domeOn(K, B, 0, -6, 11, 29, '#8a949c');
    campanile(K, B, 26, -12, 7, 62, '#c8b8a0', '#5a9a7a');
    if (B.night) for (let k = -2; k <= 2; k++) K.add('glow', B.box(1.6, 3, 0.3, { x: k * 5, y: 10, z: 23, color: '#ffd890' }));
    return B.mesh(K);
  },
  // Rome round the Colosseum: apartment blocks, domes, umbrella pines, the lit windows of the night.
  romeSkyline(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 64), R = o.r ?? 260;
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + rng() * 0.05, r = R + (rng() - 0.5) * 80, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const pick = rng();
      if (pick < 0.12) domeOn(K, B, x, z, 10 + rng() * 8, 16 + rng() * 10, rng() < 0.5 ? '#8a949c' : '#c8643c');
      else if (pick < 0.32) { // umbrella pines: a tall bare trunk and a flat dark crown
        const h = 16 + rng() * 8;
        K.add('solid', B.cyl(0.7, 0.9, h, 5, { x, y: h / 2, z, color: B.c('#5a4030') }));
        K.add('solid', B.part(new B.THREE.SphereGeometry(9, 8, 4), { x, y: h + 1, z, sy: 0.35, color: B.c('#2a3a22') }));
      } else {
        const w = 16 + rng() * 18, h = 14 + rng() * 22;
        K.add('solid', B.box(w, h, w * 0.7, { x, y: h / 2, z, ry: -a, color: B.c(wallCols[i % wallCols.length]) }));
        if (B.night) for (let k = 0; k < 3; k++) K.add('glow', B.box(w * 0.7, 0.8, w * 0.72, { x, y: h * (0.3 + k * 0.22), z, ry: -a, color: rng() < 0.5 ? '#ffd890' : '#ff9a60' }));
      }
    }
    return B.mesh(K);
  },
  // St Peter's: the great dome on its drum over the facade, far across the city.
  stPeters(o, th, B) {
    const K = new B.Kit();
    K.add('solid', B.box(120, 46, 30, { y: 23, z: 30, color: B.c('#e8dcc0') }), B.box(140, 30, 90, { y: 15, z: -20, color: B.c('#dccfb0') }));
    K.add('solid', B.cyl(28, 28, 26, B.seg(18, 10), { y: 58, z: -20, color: B.c('#e8dcc0') }));
    K.add('solid', B.part(new B.THREE.SphereGeometry(27, B.seg(18, 10), B.seg(10, 6), 0, Math.PI * 2, 0, Math.PI / 2), { y: 71, z: -20, sy: 1.25, color: B.c('#8a9aa8') }));
    K.add('solid', B.cyl(4, 5, 14, 8, { y: 112, z: -20, color: B.c('#e8dcc0') }));
    if (B.night) K.add('glow', B.part(new B.THREE.TorusGeometry(28.5, 0.8, 3, 18), { rx: Math.PI / 2, y: 70, z: -20, color: '#ffd890' }));
    return B.mesh(K);
  },
  // The Arch of Constantine: three arches in a travertine block, an attic on top.
  arch(o, th, B) {
    const K = new B.Kit(), col = B.c('#d8c8a0'), dk = B.c('#2a2228');
    K.add('solid', B.box(26, 21, 7.4, { y: 10.5, color: col }), B.box(26.4, 6, 7.8, { y: 24, color: B.c('#c8b890') }));
    K.add('solid', B.box(6.5, 11, 7.6, { y: 5.5, color: dk }), B.box(3.4, 7, 7.6, { x: -8.2, y: 3.5, color: dk }), B.box(3.4, 7, 7.6, { x: 8.2, y: 3.5, color: dk }));
    for (const x of [-11.2, -5, 5, 11.2]) K.add('solid', B.cyl(0.6, 0.6, 12, 6, { x, y: 9, z: 3.9, color: B.c('#f0e8d8') }));
    return B.mesh(K);
  },
};
