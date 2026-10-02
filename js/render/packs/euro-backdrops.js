// NEO EURO: backdrops, the distant landmarks (render-only, unfogged, hazed toward the horizon with B.c).
// Each returns an Object3D in its own units; js/render/backdrops.js places, turns and scales it.
// B = { THREE, Kit, box, cyl, ball, part, seg, c, mesh, rng, night }. After dark (B.night) the towns light
// their windows, the hilltops grow masts with red beacons, the monuments are floodlit and outlined in neon.
import { mulberry32 } from '../../sim/util.js';

const roofCols = ['#c8643c', '#b85a34', '#d27448', '#a84e30'];
const wallCols = ['#f0d8b0', '#e8c090', '#f4e4c8', '#e0b080', '#f0ccb0'];
const NEON = ['#2be8ff', '#ff2bd6', '#ffd23a', '#7a3aff', '#ff6ab8'];
const lit = (B) => B.night > 0.2;

// Recolour a placed geometry by height: c0 at y0 → c1 at y1 (floodlight washes).
function grad(B, g, y0, y1, c0, c1) {
  const pos = g.attributes.position, col = g.attributes.color, a = new B.THREE.Color(c0), b = new B.THREE.Color(c1), c = new B.THREE.Color();
  for (let i = 0; i < pos.count; i++) { const t = Math.max(0, Math.min(1, (pos.getY(i) - y0) / (y1 - y0))); c.copy(a).lerp(b, t); col.setXYZ(i, c.r, c.g, c.b); }
  return g;
}
// A mast with a red beacon (and one half way up).
function mast(K, B, x, z, y0, h) {
  K.add('solid', B.cyl(0.35, 0.6, h, 4, { x, y: y0 + h / 2, z, color: B.c('#3a3a44') }));
  K.add('glow', B.box(1.4, 1.4, 1.4, { x, y: y0 + h, z, color: '#ff2a2a' }), B.box(1, 1, 1, { x, y: y0 + h * 0.55, z, color: '#ff2a2a' }));
}
// A little house with a hipped terracotta roof (x, z centre; w × d; wall height h). At night its windows
// glow, and now and then a neon sign or a dish on the roof.
function house(K, B, x, z, w, d, h, rng, y0 = 0) {
  K.add('solid', B.box(w, h, d, { x, y: y0 + h / 2, z, color: B.c(wallCols[Math.floor(rng() * wallCols.length)]) }));
  K.add('solid', B.part(new B.THREE.ConeGeometry(Math.max(w, d) * 0.72, Math.min(w, d) * 0.45, 4), { x, y: y0 + h + Math.min(w, d) * 0.22, z, ry: Math.PI / 4, sz: d / w, color: B.c(roofCols[Math.floor(rng() * roofCols.length)]) }));
  if (!lit(B)) return;
  const r = rng();
  K.add('glow', B.box(w * 0.3, 0.8, 0.2, { x, y: y0 + h * 0.55, z: z + d / 2 + 0.1, color: r < 0.75 ? '#ffd890' : '#bfe8ff' }));
  if (r < 0.5) K.add('glow', B.box(0.2, 0.8, d * 0.25, { x: x + w / 2 + 0.1, y: y0 + h * 0.45, z, color: '#ffc870' }));
  if (r > 0.9) K.add('glow', B.box(w * 0.7, 1.2, 0.3, { x, y: y0 + h + 0.8, z: z + d / 2 - 0.5, color: NEON[Math.floor(rng() * NEON.length)] })); // a rooftop sign
}
// A bell tower: a shaft and a pointed cap (lit belfry and a neon outline at night).
function campanile(K, B, x, z, s, h, col, cap, y0 = 0) {
  K.add('solid', B.box(s, h, s, { x, y: y0 + h / 2, z, color: B.c(col) }));
  K.add('solid', B.box(s * 1.1, s * 0.8, s * 1.1, { x, y: y0 + h - s * 0.5, z, color: B.c('#f0ece0') }));
  K.add('solid', B.part(new B.THREE.ConeGeometry(s * 0.75, s * 1.6, 4), { x, y: y0 + h + s * 0.8, z, ry: Math.PI / 4, color: B.c(cap) }));
  if (!lit(B)) return;
  K.add('glow', B.box(s * 1.12, s * 0.4, s * 1.12, { x, y: y0 + h - s * 0.5, z, color: '#ffd890' }));
  K.add('glow', grad(B, B.box(s * 1.02, h - s, s * 1.02, { x, y: y0 + (h - s) / 2, z }), y0, y0 + h - s, '#ffc070', '#3a2a40'));
}
function cypress(K, B, x, z, h, y0 = 0) {
  K.add('solid', B.part(new B.THREE.ConeGeometry(h * 0.13, h, 5), { x, y: y0 + h / 2, z, color: B.c('#2e4a2a') }));
}
function domeOn(K, B, x, z, r, y0, col, lantern = true) {
  K.add('solid', B.cyl(r, r, r * 0.6, B.seg(14, 8), { x, y: y0 + r * 0.3, z, color: B.c('#ece4d4') }));
  K.add('solid', B.part(new B.THREE.SphereGeometry(r, B.seg(14, 8), B.seg(8, 5), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: y0 + r * 0.6, z, sy: 1.1, color: B.c(col) }));
  if (lantern) K.add('solid', B.cyl(r * 0.16, r * 0.2, r * 0.5, 6, { x, y: y0 + r * 1.85, z, color: B.c('#ece4d4') }));
  if (lit(B)) K.add('glow', B.part(new B.THREE.TorusGeometry(r * 1.01, r * 0.05, 3, 16), { x, y: y0 + r * 0.6, z, rx: Math.PI / 2, color: '#ffd890' }), B.cyl(r * 1.02, r * 1.02, r * 0.12, B.seg(14, 8), { x, y: y0 + r * 0.3, z, color: '#ffc070' }));
}

export const BACKDROPS = {
  // Tuscan hills: rolling green-ochre ridges, rows of cypresses, farmhouses and a hill town (along x).
  // After dark: farm lights, the hill town lit up, and masts with red beacons on the ridges.
  tuscanHills(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 611), len = o.len ?? 1100;
    for (let i = 0; i < 9; i++) {
      const x = (i / 8 - 0.5) * len, rr = len / 8 * (0.8 + rng() * 0.5), hh = 40 + rng() * 60, z = (rng() - 0.5) * 120;
      K.add('solid', B.part(new B.THREE.SphereGeometry(1, B.seg(14, 8), B.seg(8, 5), 0, Math.PI * 2, 0, Math.PI / 2), { x, z, sx: rr, sy: hh, sz: rr * 0.55, color: B.c(i % 2 ? '#8aa04a' : '#a8a050') }));
      for (let k = 0; k < 6; k++) { const a = rng() * Math.PI, d = rng() * 0.75; cypress(K, B, x + Math.cos(a) * rr * d, z + Math.sin(a) * rr * 0.4 * d + 10, 14 + rng() * 8, hh * Math.sqrt(Math.max(0, 1 - d * d)) - 4); }
      if (rng() < 0.6) { const hx = x + (rng() - 0.5) * rr * 0.6; house(K, B, hx, z, 14, 10, 8, rng, hh * 0.8); }
      if (lit(B)) {
        if (i % 2 === 0) mast(K, B, x + rr * 0.1, z, hh - 2, 26 + (i % 3) * 8);
        for (let k = 0; k < 5; k++) { const a = rng() * Math.PI, d = 0.3 + rng() * 0.6; K.add('glow', B.box(2, 1.4, 2, { x: x + Math.cos(a) * rr * d, y: hh * Math.sqrt(Math.max(0, 1 - d * d)) - 1, z: z + Math.sin(a) * rr * 0.4 * d + 12, color: rng() < 0.7 ? '#ffd890' : '#bfe8ff' })); }
      }
    }
    const tx = len * 0.18; // the hill town with its tower
    for (let k = 0; k < 10; k++) house(K, B, tx + (rng() - 0.5) * 60, (rng() - 0.5) * 40, 10 + rng() * 6, 8 + rng() * 6, 8 + rng() * 6, rng, 70);
    campanile(K, B, tx, 0, 7, 40, '#c8a070', '#9a4a2c', 70);
    return B.mesh(K);
  },
  // A ring of terracotta-roofed town round the play space: houses, towers, a dome or two (masts, dishes
  // and neon at night: the old town wired for 2099).
  euroRoofs(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 61), r0 = o.r0 ?? 150, r1 = o.r1 ?? 250;
    for (let i = 0; i < (o.n ?? 60); i++) {
      const a = rng() * Math.PI * 2, r = r0 + rng() * (r1 - r0), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const w = 12 + rng() * 14, d = 10 + rng() * 12, h = 6 + rng() * 12;
      if (rng() < 0.08) campanile(K, B, x, z, 6, 30 + rng() * 20, '#c09070', '#8a4a2a');
      else if (rng() < 0.04) domeOn(K, B, x, z, 10, 14, '#c8643c');
      else house(K, B, x, z, w, d, h, rng);
      if (lit(B) && i % 9 === 4) mast(K, B, x, z, h + 2, 14 + rng() * 10);
      if (lit(B) && i % 13 === 7) K.add('glow', grad(B, B.part(new B.THREE.PlaneGeometry(10, 5), { x: x - Math.cos(a) * 8, y: h + 8, z: z - Math.sin(a) * 8, ry: Math.atan2(-Math.cos(a), -Math.sin(a)) }), h + 5.5, h + 10.5, NEON[i % NEON.length], '#ffffff')); // a holo billboard facing the Campo
    }
    return B.mesh(K);
  },
  // The Amalfi coast: cliffs plunging into the sea, pastel villages clinging to them (along x), lit at night.
  amalfiCoast(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 621), len = o.len ?? 700;
    for (let i = 0; i < 8; i++) {
      const x = (i / 7 - 0.5) * len, hh = 90 + rng() * 120, rr = len / 7 * 0.75;
      K.add('solid', B.part(new B.THREE.ConeGeometry(rr, hh, 6, 1), { x, y: hh / 2 - 6, z: (rng() - 0.5) * 40, sz: 0.6, color: B.c(i % 2 ? '#7a8a5a' : '#8a8060') }));
      for (let k = 0; k < 9; k++) {
        const t = rng(), y = t * hh * 0.45, xx = x + (rng() - 0.5) * rr * (1 - t) * 1.1, bw = 7 + rng() * 6, bz = rr * 0.6 * (1 - t) * 0.5 + 6;
        K.add('solid', B.box(bw, 6 + rng() * 4, 6, { x: xx, y: y + 3, z: bz, color: B.c(['#f2d18a', '#f2a98a', '#f0e6d2', '#e88a6a', '#a8d0e0', '#f4c4c4'][k % 6]) }));
        if (lit(B)) { K.add('glow', B.box(bw * 0.6, 1.2, 0.3, { x: xx, y: y + 3.6, z: bz + 3.1, color: rng() < 0.8 ? '#ffd890' : '#ff9ad0' })); if (rng() < 0.15) K.add('glow', B.box(bw * 0.8, 0.5, 0.3, { x: xx, y: y + 6.4, z: bz + 3.1, color: NEON[k % NEON.length] })); }
      }
      if (rng() < 0.5) domeOn(K, B, x, rr * 0.25, 7, hh * 0.15, '#2a8a5a', true);
      if (lit(B) && i % 3 === 1) mast(K, B, x, 0, hh - 8, 30);
    }
    return B.mesh(K);
  },
  // Towns strung along a far shore (along x, o.len long): clusters of lit windows climbing the hill behind
  // the water, the odd neon tower and red-lit mast. Only drawn after dark (the Bay of Naples, the lagoon).
  shoreLights(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 641), len = o.len ?? 900, n = o.n ?? 9;
    if (!lit(B)) return B.mesh(K);
    for (let t = 0; t < n; t++) {
      const cx = (t / Math.max(1, n - 1) - 0.5) * len + (rng() - 0.5) * 40, spread = 30 + rng() * 50, rise = 10 + rng() * (o.rise ?? 40);
      for (let k = 0; k < 26; k++) {
        const u = rng(), x = cx + (rng() - 0.5) * spread * (1.2 - u * 0.6), y = 2 + u * rise, z = (rng() - 0.5) * 20 - u * 30;
        K.add('glow', B.box(2.6, 1.8, 1, { x, y, z, color: rng() < 0.8 ? '#ffd890' : rng() < 0.5 ? '#bfe8ff' : '#ff8a4a' }));
      }
      K.add('glow', B.box(spread * 0.9, 0.8, 1, { x: cx, y: 1.2, z: 12, color: '#ffc070' })); // the waterfront
      if (rng() < 0.5) { const h = 30 + rng() * 40; K.add('solid', B.box(6, h, 6, { x: cx + 10, y: h / 2, z: -20, color: B.c('#1a1830') })); K.add('glow', B.box(6.4, 1.2, 6.4, { x: cx + 10, y: h * 0.8, z: -20, color: NEON[t % NEON.length] }), B.box(6.4, 1.2, 6.4, { x: cx + 10, y: h * 0.5, z: -20, color: NEON[(t + 2) % NEON.length] })); }
      if (rng() < 0.6) mast(K, B, cx - 15, -30, rise, 20 + rng() * 20);
    }
    return B.mesh(K);
  },
  // Venice across the water: a long low band of houses, campanili and the odd dome (along x), lit at night.
  lagoonTown(o, th, B) {
    const K = new B.Kit(), rng = mulberry32(o.seed ?? 631), len = o.len ?? 420;
    for (let x = -len / 2; x < len / 2;) {
      const w = 10 + rng() * 12, d = 12 + rng() * 10, z = (rng() - 0.5) * 30, h = 10 + rng() * 10;
      house(K, B, x + w / 2, z, w, d, h, rng);
      if (lit(B)) K.add('glow', B.box(w * 0.9, 0.5, 1.2, { x: x + w / 2, y: 0.6, z: z + d / 2 + 6, color: rng() < 0.5 ? '#ffd890' : '#ff9a60' })); // lamps along the fondamenta
      x += w + rng() * 3;
    }
    for (let k = 0; k < 4; k++) campanile(K, B, (rng() - 0.5) * len, (rng() - 0.5) * 20, 6, 40 + rng() * 25, '#a8503a', '#5a9a7a');
    domeOn(K, B, (rng() - 0.5) * len * 0.6, -10, 12, 18, '#8a949c');
    return B.mesh(K);
  },
  // San Giorgio Maggiore on its island: white Palladian facade, the dome, the campanile (floodlit at night).
  sanGiorgio(o, th, B) {
    const K = new B.Kit();
    K.add('solid', B.box(120, 3, 60, { y: 1.5, color: B.c('#c8bca8') }));
    K.add('solid', B.box(30, 26, 40, { y: 16, color: B.c('#f4f0e6') }), B.box(18, 34, 4, { y: 20, z: 21, color: B.c('#ffffff') }));
    K.add('solid', B.part(new B.THREE.ConeGeometry(10, 8, 3), { y: 41, z: 21, ry: Math.PI, sz: 0.3, color: B.c('#ffffff') }));
    domeOn(K, B, 0, -6, 11, 29, '#8a949c');
    campanile(K, B, 26, -12, 7, 62, '#c8b8a0', '#5a9a7a');
    if (lit(B)) {
      for (let k = -2; k <= 2; k++) K.add('glow', B.box(1.6, 3, 0.3, { x: k * 5, y: 10, z: 23, color: '#ffd890' }));
      K.add('glow', grad(B, B.part(new B.THREE.PlaneGeometry(18, 34), { y: 20, z: 23.1 }), 3, 37, '#ffe8b8', '#7a5a6a'));
      K.add('glow', B.box(120.4, 0.6, 60.4, { y: 2.6, color: '#2be8ff' }));
      for (let k = 0; k < 10; k++) K.add('glow', B.box(9, 0.3, 0.3, { x: -54 + k * 12, y: 3.2, z: 34 + (k % 3) * 6, color: k % 2 ? '#ffd890' : '#ff8a4a' })); // its lights on the water
    }
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
        if (lit(B)) {
          for (let k = 0; k < 3; k++) K.add('glow', B.box(w * 0.7, 0.8, w * 0.72, { x, y: h * (0.3 + k * 0.22), z, ry: -a, color: rng() < 0.5 ? '#ffd890' : '#ff9a60' }));
          if (i % 7 === 3) mast(K, B, x, z, h, 12 + rng() * 10);
          if (i % 11 === 5) K.add('glow', B.box(w * 0.75, 2.2, w * 0.74, { x, y: h + 1.4, z, ry: -a, color: NEON[i % NEON.length] })); // a neon rooftop sign
        }
      }
    }
    return B.mesh(K);
  },
  // St Peter's: the great dome on its drum over the facade, far across the city (floodlit at night).
  stPeters(o, th, B) {
    const K = new B.Kit();
    K.add('solid', B.box(120, 46, 30, { y: 23, z: 30, color: B.c('#e8dcc0') }), B.box(140, 30, 90, { y: 15, z: -20, color: B.c('#dccfb0') }));
    K.add('solid', B.cyl(28, 28, 26, B.seg(18, 10), { y: 58, z: -20, color: B.c('#e8dcc0') }));
    K.add('solid', B.part(new B.THREE.SphereGeometry(27, B.seg(18, 10), B.seg(10, 6), 0, Math.PI * 2, 0, Math.PI / 2), { y: 71, z: -20, sy: 1.25, color: B.c('#8a9aa8') }));
    K.add('solid', B.cyl(4, 5, 14, 8, { y: 112, z: -20, color: B.c('#e8dcc0') }));
    if (lit(B)) {
      K.add('glow', B.part(new B.THREE.TorusGeometry(28.5, 0.8, 3, 18), { rx: Math.PI / 2, y: 70, z: -20, color: '#ffd890' }));
      K.add('glow', grad(B, B.part(new B.THREE.PlaneGeometry(120, 46), { y: 23, z: 45.1 }), 0, 46, '#ffe0a0', '#8a6a5a'));
      K.add('glow', grad(B, B.cyl(28.3, 28.3, 26, B.seg(18, 10), { y: 58, z: -20 }), 45, 71, '#ffd890', '#a07a5a'));
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; K.add('glow', B.part(new B.THREE.TorusGeometry(27.2, 0.45, 3, 12, Math.PI / 2), { y: 71, z: -20, ry: a, sy: 1.25, color: '#fff0c8' })); } // the ribs in light
    }
    return B.mesh(K);
  },
  // The Arch of Constantine: three arches in a travertine block, an attic on top (floodlit and outlined at night).
  arch(o, th, B) {
    const K = new B.Kit(), col = B.c('#d8c8a0'), dk = B.c('#2a2228');
    K.add('solid', B.box(26, 21, 7.4, { y: 10.5, color: col }), B.box(26.4, 6, 7.8, { y: 24, color: B.c('#c8b890') }));
    K.add('solid', B.box(6.5, 11, 7.6, { y: 5.5, color: dk }), B.box(3.4, 7, 7.6, { x: -8.2, y: 3.5, color: dk }), B.box(3.4, 7, 7.6, { x: 8.2, y: 3.5, color: dk }));
    for (const x of [-11.2, -5, 5, 11.2]) K.add('solid', B.cyl(0.6, 0.6, 12, 6, { x, y: 9, z: 3.9, color: B.c('#f0e8d8') }));
    if (lit(B)) {
      for (const s of [-1, 1]) { // the attic and the outer piers floodlit (the arches stay dark)
        K.add('glow', grad(B, B.part(new B.THREE.PlaneGeometry(26.4, 6), { y: 24, z: s * 3.95, ry: s > 0 ? 0 : Math.PI }), 21, 27, '#ffd890', '#8a6a5a'));
        for (const x of [-11.9, 11.9]) K.add('glow', grad(B, B.part(new B.THREE.PlaneGeometry(2.2, 21), { x, y: 10.5, z: s * 3.75, ry: s > 0 ? 0 : Math.PI }), 0, 21, '#ffe0a0', '#7a5a5a'));
      }
      K.add('glow', B.box(26.8, 0.4, 8.2, { y: 27.1, color: '#ff2bd6' }), B.box(26.8, 0.4, 8.2, { y: 21, color: '#2be8ff' }));
      for (const x of [-11.2, -5, 5, 11.2]) K.add('glow', B.cyl(0.62, 0.62, 12, 6, { x, y: 9, z: 4.05, color: '#fff0c8' }));
    }
    return B.mesh(K);
  },
};
