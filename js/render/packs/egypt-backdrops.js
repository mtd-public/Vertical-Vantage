// EGYPT: backdrops, the distant landmarks (render-only, unfogged, hazed toward the horizon with B.c).
// Each returns an Object3D in its own units; js/render/backdrops.js places, turns and scales it.
// B = { THREE, Kit, box, cyl, ball, part, seg, c, mesh, rng, night }.
import { mulberry32 } from '../../sim/util.js';

const sandCols = ['#d8b07a', '#c89a68', '#e0bc88'];
const houseCols = ['#e0c8a0', '#d4a888', '#c8a080', '#e8d8b8', '#bca888'];

// A pyramid: a four-sided cone, base half-width hw, height h (o.casing: a smooth white cap on top;
// o.glow: a lit capstone; o.steps: dark course lines).
function pyramid(K, B, x, z, hw, h, o = {}) {
  const r = hw * Math.SQRT2;
  K.add('solid', B.part(new B.THREE.ConeGeometry(r, h, 4, 1), { x, y: h / 2, z, ry: Math.PI / 4, color: B.c(o.color || '#d0a86e') }));
  if (o.casing) K.add('solid', B.part(new B.THREE.ConeGeometry(r * o.casing, h * o.casing, 4, 1), { x, y: h - h * o.casing / 2 + 0.3, z, ry: Math.PI / 4, color: B.c('#f0e6d0', -0.05) }));
  for (let k = 1; o.steps && k < o.steps; k++) { const t = k / o.steps; K.add('solid', B.box(hw * 2 * (1 - t) + 0.6, 0.6, hw * 2 * (1 - t) + 0.6, { x, y: h * t, z, color: B.c('#a8844e') })); }
  if (o.glow) {
    K.add('glow', B.part(new B.THREE.ConeGeometry(r * 0.09, h * 0.09, 4, 1), { x, y: h * 0.955, z, ry: Math.PI / 4, color: '#fff0b0' }));
    K.add('glow', B.box(0.8, h * 1.6, 0.8, { x, y: h * 0.96 + h * 0.8, z, color: B.night ? '#ffd060' : '#ffe8a0' })); // the uplink beam
  }
  if (B.night) for (let k = 0; k < 4; k++) K.add('glow', B.box(hw * 2 * (0.9 - k * 0.2), 0.5, 0.5, { x, y: h * (0.08 + k * 0.2), z: z + hw * (1 - (0.08 + k * 0.2)) + 0.4, color: '#2be8ff' }));
}
function dome(K, B, x, z, r, y0, col) {
  K.add('solid', B.cyl(r, r, r * 0.6, B.seg(12, 8), { x, y: y0 + r * 0.3, z, color: B.c('#e8dcc8') }));
  K.add('solid', B.part(new B.THREE.SphereGeometry(r, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: y0 + r * 0.6, z, sy: 1.15, color: B.c(col) }));
}
function minaret(K, B, x, z, h, y0 = 0) {
  K.add('solid', B.cyl(1.2, 1.5, h, 8, { x, y: y0 + h / 2, z, color: B.c('#e8e0d0') }));
  K.add('solid', B.cyl(2.2, 1.4, 1.2, 8, { x, y: y0 + h * 0.75, z, color: B.c('#d8ccb8') }));
  K.add('solid', B.part(new B.THREE.ConeGeometry(1.4, h * 0.22, 8), { x, y: y0 + h + h * 0.11, z, color: B.c('#8a949c') }));
}

export const BACKDROPS = {
  // The Giza pyramids on the horizon: Khufu, Khafre (its casing cap), Menkaure, the queens; glowing capstones.
  'eg-giza'(o, th, B) {
    const K = new B.Kit();
    pyramid(K, B, 0, 0, 70, 138, { steps: 6, glow: o.glow });
    pyramid(K, B, -150, 110, 68, 136, { casing: 0.22, steps: 5, glow: o.glow, color: '#c89c62' });
    pyramid(K, B, -270, 220, 34, 66, { steps: 4, glow: o.glow, color: '#c8986a' });
    for (let k = 0; k < 3; k++) pyramid(K, B, 100, -60 + k * 50, 14, 28, { color: '#c8a070' });
    for (let k = 0; k < 3; k++) pyramid(K, B, -330 + k * 40, 260, 10, 20, { color: '#c8a070' });
    K.add('solid', B.box(900, 6, 500, { y: -2, color: B.c('#d8b07a', 0.1) })); // the plateau
    return B.mesh(K);
  },
  // Khafre's pyramid (or Menkaure's, o.small) in the haze, its smooth casing still on the top.
  'eg-khafre'(o, th, B) {
    const K = new B.Kit();
    pyramid(K, B, 0, 0, o.small ? 50 : 105, o.small ? 96 : 205, { casing: o.small ? 0 : 0.22, steps: 6, glow: 1, color: '#d0a46a' });
    for (let k = 0; k < (o.small ? 0 : 3); k++) pyramid(K, B, 140 + k * 46, 60, 16, 30, { color: '#c8a070' });
    return B.mesh(K);
  },
  // A ring of Islamic Cairo: flat-roofed houses, domes and minarets (o.towers: modern towers too);
  // o.avoidX keeps the river clear (local x band).
  'eg-cairoRing'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 81), r0 = o.r0 ?? 190, r1 = o.r1 ?? 300;
    for (let i = 0; i < (o.n ?? 80); i++) {
      const a = rng() * Math.PI * 2, r = r0 + rng() * (r1 - r0), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (o.avoidX && x > o.avoidX[0] && x < o.avoidX[1]) continue;
      const p = rng();
      if (p < 0.1) { dome(K, B, x, z, 8 + rng() * 6, 10 + rng() * 6, rng() < 0.5 ? '#8a949c' : '#5a9a7a'); minaret(K, B, x + 14, z, 38 + rng() * 14); }
      else if (p < 0.2) minaret(K, B, x, z, 30 + rng() * 20, 8);
      else if (o.towers && p < 0.45) {
        const w = 14 + rng() * 12, h = 40 + rng() * 70;
        K.add('solid', B.box(w, h, w, { x, y: h / 2, z, ry: rng(), color: B.c('#b8a890') }));
        K.add('glow', B.box(w + 0.4, 1.2, w + 0.4, { x, y: h - 3, z, ry: rng(), color: rng() < 0.5 ? '#2be8ff' : '#ff2bd6' }));
      } else {
        const w = 14 + rng() * 16, d = 12 + rng() * 14, h = 8 + rng() * 16;
        K.add('solid', B.box(w, h, d, { x, y: h / 2, z, ry: -a, color: B.c(houseCols[i % houseCols.length]) }));
        if (B.night || th.night > 0.05) for (let k = 0; k < 2; k++) K.add('glow', B.box(w * 0.5, 0.8, d * 1.02, { x, y: h * (0.35 + k * 0.3), z, ry: -a, color: rng() < 0.6 ? '#ffd890' : '#ff9a60' }));
      }
    }
    return B.mesh(K);
  },
  // The modern west bank (along local x): tall slabs and towers, a few with neon crowns.
  'eg-westBank'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 85), len = o.len ?? 500;
    for (let x = -len / 2; x < len / 2;) {
      const w = 16 + rng() * 20, h = (o.hMin ?? 20) + rng() * ((o.hMax ?? 56) - (o.hMin ?? 20)), zz = (rng() - 0.5) * 60;
      K.add('solid', B.box(w, h, 14 + rng() * 14, { x: x + w / 2, y: h / 2, z: zz, color: B.c(rng() < 0.5 ? '#c8b498' : '#a89880') }));
      for (let k = 1; k < h / 12; k++) K.add('glow', B.box(w * 0.85, 0.6, 0.5, { x: x + w / 2, y: k * 12, z: zz + 8, color: rng() < 0.7 ? '#ffd890' : '#8ae0ff' }));
      if (rng() < 0.3) K.add('glow', B.box(w + 0.5, 1.4, 1, { x: x + w / 2, y: h - 2, z: zz + 8, color: rng() < 0.5 ? '#ff2bd6' : '#2be8ff' }));
      x += w + 4 + rng() * 14;
    }
    return B.mesh(K);
  },
  // Dunes round the plateau: low sand ridges in a ring band.
  'eg-dunes'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 82), r0 = o.r0 ?? 260, r1 = o.r1 ?? 420;
    for (let i = 0; i < (o.n ?? 24); i++) {
      const a = (i / (o.n ?? 24)) * Math.PI * 2 + rng() * 0.2, r = r0 + rng() * (r1 - r0);
      const rr = 50 + rng() * 60;
      K.add('solid', B.part(new B.THREE.SphereGeometry(1, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x: Math.cos(a) * r, z: Math.sin(a) * r, sx: rr, sy: 12 + rng() * 22, sz: rr * 0.5, ry: -a + Math.PI / 2, color: B.c(sandCols[i % 3]) }));
    }
    return B.mesh(K);
  },
  // The Duat round the Hall of Judgment: obelisks, colossal seated kings, palms and far pyramids
  // under the lapis night, braziers burning.
  'eg-duatRing'(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 84), R = o.r ?? 230;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + rng() * 0.08, r = R + (rng() - 0.5) * 60, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const p = rng();
      if (p < 0.3) { // an obelisk with a gilded tip
        const h = 40 + rng() * 30;
        K.add('solid', B.cyl(1.8, 3, h, 4, { x, y: h / 2, z, ry: Math.PI / 4, color: B.c('#6a4a3a') }));
        K.add('glow', B.part(new B.THREE.ConeGeometry(2.6, 5, 4), { x, y: h + 2.5, z, ry: Math.PI / 4, color: '#ffc53a' }));
      } else if (p < 0.5) { // a colossus, seated, facing the hall
        const s = 1.4 + rng() * 0.6;
        K.add('solid', B.box(14 * s, 16 * s, 12 * s, { x, y: 8 * s, z, ry: -a, color: B.c('#7a5a40') }));
        K.add('solid', B.box(8 * s, 12 * s, 7 * s, { x, y: 22 * s, z, ry: -a, color: B.c('#8a6a4a') }));
        K.add('solid', B.box(6 * s, 6 * s, 6 * s, { x, y: 31 * s, z, ry: -a, color: B.c('#8a6a4a') }));
        K.add('solid', B.box(7 * s, 3 * s, 7 * s, { x, y: 34.5 * s, z, ry: -a, color: B.c('#1e46b4', 0.1) }));
        K.add('glow', B.box(4 * s, 0.6 * s, 6.2 * s, { x, y: 31.5 * s, z, ry: -a, color: '#2be8ff' }));
      } else if (p < 0.75) { // palms
        for (let k = 0; k < 3; k++) {
          const px = x + (rng() - 0.5) * 20, pz = z + (rng() - 0.5) * 20, h = 14 + rng() * 8;
          K.add('solid', B.cyl(0.5, 0.8, h, 5, { x: px, y: h / 2, z: pz, color: B.c('#3a2a20') }));
          K.add('solid', B.part(new B.THREE.SphereGeometry(5, 6, 3), { x: px, y: h, z: pz, sy: 0.35, color: B.c('#1a3a2a') }));
        }
      } else { // a brazier on a pylon stump
        K.add('solid', B.box(16, 18, 6, { x, y: 9, z, ry: -a, color: B.c('#6a5038') }));
        K.add('glow', B.part(new B.THREE.ConeGeometry(2.5, 5, 6), { x, y: 20.5, z, color: '#ff9a30' }));
      }
    }
    for (let k = 0; k < 5; k++) { const a = rng() * Math.PI * 2, r = R * 2.2; pyramid(K, B, Math.cos(a) * r, Math.sin(a) * r, 50 + rng() * 40, 100 + rng() * 60, { glow: 1, color: '#3a2a40' }); }
    return B.mesh(K);
  },
};
