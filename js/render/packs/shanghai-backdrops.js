// SHANGHAI backdrops: the distant landmarks (render-only, unfogged, hazed toward the horizon with B.c).
// The Pudong skyline after dark: the Pearl in hot pink, LED-wrapped supertalls drawn in static bands of
// coloured light, the twisting tower's white spiral, the Bund's colonial row floodlit gold across the
// water, and the river full of lit tour boats. B = { THREE, Kit, box, cyl, ball, part, seg, c, mesh, rng, night }.
import * as THREE from 'three';

const PINK = '#ff4a9a', SILVER = '#c8c8d4';
const LED = ['#2be8ff', '#ff2bd6', '#ffd23a', '#7bff4a', '#b45bff', '#ff5a2b', '#ffffff', '#4a8bff'];
const _c = new THREE.Color(), _a = new THREE.Color(), _b = new THREE.Color();
// Recolour a placed geometry by height: c0 at y0 → c1 at y1.
function grad(g, y0, y1, c0, c1) {
  const pos = g.attributes.position, col = g.attributes.color;
  _a.set(c0); _b.set(c1);
  for (let i = 0; i < pos.count; i++) { const t = Math.max(0, Math.min(1, (pos.getY(i) - y0) / (y1 - y0))); _c.copy(_a).lerp(_b, t); col.setXYZ(i, _c.r, _c.g, _c.b); }
  return g;
}
// Glow lines along the four vertical edges of a w × d box from y0 to y1, centred on (x, z).
function edges(K, B, x, z, w, d, y0, y1, color, t = 0.8) {
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', B.box(t, y1 - y0, t, { x: x + sx * (w / 2 + t * 0.3), y: (y0 + y1) / 2, z: z + sz * (d / 2 + t * 0.3), color }));
}
// A ring of glow round a w × d box at height y.
function band(K, B, x, z, w, d, y, color, h = 0.9) { K.add('glow', B.box(w + 0.5, h, d + 0.5, { x, y, z, color })); }

function pearlTower(o, th, B) {
  const K = new B.Kit(), lit = B.night > 0.2;
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    K.add('solid', B.part(new THREE.CylinderGeometry(3, 4, 95, 6), { x: ca * 24, y: 40, z: sa * 24, rz: ca * 0.5, rx: -sa * 0.5, color: B.c(SILVER) }));
    K.add('solid', B.cyl(3.2, 3.2, 210, 8, { x: Math.cos(a + 1) * 6, y: 105, z: Math.sin(a + 1) * 6, color: B.c(SILVER) }));
    if (lit) { // magenta LED lines up the columns and the tripod legs
      K.add('glow', B.box(1.0, 210, 1.0, { x: Math.cos(a + 1) * 9.3, y: 105, z: Math.sin(a + 1) * 9.3, color: '#ff4ad0' }));
      K.add('glow', B.part(new THREE.CylinderGeometry(0.7, 0.7, 95, 4), { x: ca * 25.5, y: 40, z: sa * 25.5, rz: ca * 0.5, rx: -sa * 0.5, color: '#ff8ae0' }));
    }
  }
  // the spheres: deep pink shells inside a cage of hot-pink LED rings
  const sphere = (y, r, col, rings) => {
    K.add('solid', B.ball(r, { y, color: B.c(lit ? '#c0186a' : col) }, 1));
    if (!lit) return;
    for (let k = -rings; k <= rings; k++) {
      const la = (k / (rings + 1)) * Math.PI / 2, rr = r * Math.cos(la) * 1.02;
      K.add('glow', B.part(new THREE.TorusGeometry(rr, Math.max(0.3, r * 0.05), 3, B.seg(20, 14)), { y: y + Math.sin(la) * r, rx: Math.PI / 2, color: k === 0 ? '#ffd0f0' : k % 2 ? '#ff2bd6' : '#ff6ab8' }));
    }
    for (let m = 0; m < 4; m++) K.add('glow', B.part(new THREE.TorusGeometry(r * 1.015, Math.max(0.25, r * 0.035), 3, B.seg(20, 14)), { y, ry: (m / 4) * Math.PI, color: '#ff4ab8' }));
  };
  sphere(70, 19, PINK, 2);
  for (const y of [105, 120, 135, 150]) sphere(y, 5, PINK, 0);
  sphere(178, 14, PINK, 2); sphere(214, 5.5, PINK, 1);
  K.add('solid', B.cyl(0.8, 2.5, 60, 6, { y: 248, color: B.c(SILVER) }));
  if (lit) K.add('glow', grad(B.cyl(0.9, 2.6, 58, 6, { y: 248 }), 220, 278, '#ff8ae0', '#ffffff'));
  K.add('glow', B.box(2, 2, 2, { y: 279, color: '#ff2a2a' }));
  return B.mesh(K);
}
function pearlUpper(o, th, B) { // over the boss arena: the columns go on up to the upper sphere and the spire
  const K = new B.Kit(), lit = B.night > 0.2;
  for (const a of [90, 210, 330]) {
    const r = a * Math.PI / 180;
    K.add('solid', B.cyl(1.3, 1.3, 40, 8, { x: Math.cos(r) * 2.6, y: 20, z: Math.sin(r) * 2.6, color: B.c(SILVER) }));
    if (lit) K.add('glow', B.box(0.3, 40, 0.3, { x: Math.cos(r) * 3.95, y: 20, z: Math.sin(r) * 3.95, color: '#ff4ad0' }));
  }
  for (const y of [6, 14, 22]) {
    K.add('solid', B.ball(3.2, { y, color: B.c(lit ? '#c0186a' : PINK) }, 1));
    if (lit) K.add('glow', B.part(new THREE.TorusGeometry(3.25, 0.18, 3, 14), { y, rx: Math.PI / 2, color: '#ff6ab8' }));
  }
  K.add('solid', B.ball(11, { y: 46, color: B.c(lit ? '#c0186a' : PINK) }, 1));
  K.add('glow', B.part(new THREE.TorusGeometry(11.1, 0.5, 3, 24), { y: 46, rx: Math.PI / 2, color: '#ffd0f0' }));
  if (lit) {
    for (const [dy, rr] of [[5.5, 9.6], [-5.5, 9.6], [9.5, 5.6], [-9.5, 5.6]]) K.add('glow', B.part(new THREE.TorusGeometry(rr, 0.35, 3, 20), { y: 46 + dy, rx: Math.PI / 2, color: Math.abs(dy) > 7 ? '#ff2bd6' : '#ff6ab8' }));
    for (let m = 0; m < 4; m++) K.add('glow', B.part(new THREE.TorusGeometry(11.15, 0.3, 3, 24), { y: 46, ry: (m / 4) * Math.PI, color: '#ff4ab8' }));
  }
  K.add('solid', B.ball(4, { y: 64, color: B.c(lit ? '#c0186a' : PINK) }, 1), B.cyl(0.4, 1.4, 40, 6, { y: 88, color: B.c(SILVER) }));
  if (lit) K.add('glow', B.part(new THREE.TorusGeometry(4.1, 0.2, 3, 14), { y: 64, rx: Math.PI / 2, color: '#ffd0f0' }), grad(B.cyl(0.45, 1.45, 38, 6, { y: 88 }), 69, 107, '#ff8ae0', '#ffffff'));
  K.add('glow', B.box(1, 1, 1, { y: 108, color: '#ff2a2a' }));
  return B.mesh(K);
}
function pearlLegs(o, th, B) { // under the deck: the sphere's tripod legs and columns, down into the smog
  const K = new B.Kit(), lit = B.night > 0.2;
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + 0.5, ca = Math.cos(a), sa = Math.sin(a);
    K.add('solid', B.part(new THREE.CylinderGeometry(2.4, 3, 90, 6), { x: ca * 26, y: -40, z: sa * 26, rz: ca * 0.55, rx: -sa * 0.55, color: B.c(SILVER) }));
    K.add('solid', B.cyl(1.3, 1.3, 80, 8, { x: Math.cos(a + 1.57) * 2.6, y: -40, z: Math.sin(a + 1.57) * 2.6, color: B.c(SILVER) }));
    if (lit) K.add('glow', B.part(new THREE.CylinderGeometry(0.5, 0.5, 90, 4), { x: ca * 27.6, y: -40, z: sa * 27.6, rz: ca * 0.55, rx: -sa * 0.55, color: '#ff6ad0' }));
  }
  return B.mesh(K);
}
function twistTower(o, th, B) { // the Shanghai Tower: a twisting glass triangle, white LED seams spiralling up it
  const K = new B.Kit(), n = 26, lit = B.night > 0.2;
  for (let i = 0; i < n; i++) {
    const t = i / n, r = 34 * (1 - t * 0.42);
    K.add('solid', B.part(new THREE.CylinderGeometry(r, r, 13.5, 3), { y: i * 13 + 6.5, ry: t * 2.2, color: B.c(lit ? (i % 2 ? '#2a4a6a' : '#22405e') : i % 2 ? '#8cbcc0' : '#7aaeb4') }));
    if (lit) {
      K.add('glow', B.part(new THREE.CylinderGeometry(r + 0.3, r + 0.3, i % 4 === 0 ? 1.2 : 0.5, 3), { y: i * 13, ry: t * 2.2, color: i % 4 === 0 ? '#c8ffff' : '#4ac8ff' }));
      for (let k = 0; k < 3; k++) { const a = -t * 2.2 + (k / 3) * Math.PI * 2 + Math.PI / 2; K.add('glow', B.box(1.2, 13.5, 1.2, { x: Math.cos(a) * (r + 0.2), y: i * 13 + 6.5, z: Math.sin(a) * (r + 0.2), color: '#e8ffff' })); } // the corner seams
    }
  }
  for (let k = 0; k < 6; k++) K.add(lit ? 'glow' : 'solid', B.box(2, 30, 2, { x: Math.cos(k) * 17, y: n * 13 + 12, z: Math.sin(k) * 17, color: lit ? '#7ff6ff' : B.c('#d8ecec') }));
  if (lit) K.add('glow', B.box(2.4, 2.4, 2.4, { y: n * 13 + 30, color: '#ff2a2a' }));
  return B.mesh(K);
}
function bottleOpener(o, th, B) { // the SWFC: a slab with a trapezoid hole, its edges and the hole drawn in blue-white LEDs
  const K = new B.Kit(), lit = B.night > 0.2, col = B.c(lit ? '#2a3a58' : '#a8b8c8');
  K.add('solid', B.box(52, 280, 22, { y: 140, color: col }));
  K.add('solid', B.box(9, 60, 20, { x: -21.5, y: 310, color: col }), B.box(9, 60, 20, { x: 21.5, y: 310, color: col }), B.box(52, 12, 20, { y: 346, color: col }));
  K.add('solid', B.box(10, 10, 20, { x: -12, y: 285, rz: 0.7, color: col }), B.box(10, 10, 20, { x: 12, y: 285, rz: -0.7, color: col })); // the hole's sloped sides
  if (lit) {
    for (let y = 18; y < 280; y += 14) band(K, B, 0, 0, 52, 22, y, y % 56 === 18 ? '#c8f0ff' : '#5ab8ff', 0.7);
    edges(K, B, 0, 0, 52, 22, 0, 352, '#e8f8ff', 1.0);
    for (const sx of [-1, 1]) K.add('glow', B.box(1, 56, 21, { x: sx * 16.6, y: 316, color: '#9fe0ff' })); // the hole's lit jambs
    K.add('glow', B.box(34, 1, 21, { y: 339.5, color: '#9fe0ff' }), B.box(53, 1.2, 23, { y: 352.4, color: '#ffffff' }));
    for (const sx of [-1, 1]) K.add('glow', B.box(1.6, 1.6, 1.6, { x: sx * 24, y: 354, color: '#ff2a2a' }));
  }
  return B.mesh(K);
}
function jinmaoTower(o, th, B) { // the tiered pagoda tower: gold light on every setback
  const K = new B.Kit(), lit = B.night > 0.2;
  let y = 0, w = 40;
  for (let i = 0; i < 16; i++) {
    const h = 34 - i * 1.4;
    K.add('solid', B.box(w, h, w, { y: y + h / 2, color: B.c(lit ? '#3a3a4a' : '#8a8f9a') }), B.box(w + 3, 1.6, w + 3, { y: y + h, color: lit ? '#ffcf60' : B.c('#b8a06a') }));
    if (lit) { K.add('glow', B.box(w + 3.2, 0.5, w + 3.2, { y: y + h - 0.9, color: '#ff9a2a' })); edges(K, B, 0, 0, w, w, y, y + h, '#ffd890', 0.7); }
    y += h; w *= 0.93;
  }
  K.add(lit ? 'glow' : 'solid', B.cyl(0.5, 3, 50, 6, { y: y + 25, color: lit ? '#ffe0a0' : B.c(SILVER) }));
  if (lit) K.add('glow', B.box(1.6, 1.6, 1.6, { y: y + 51, color: '#ff2a2a' }));
  return B.mesh(K);
}
function bundRow(o, th, B) { // the colonial waterfront, seen from across the river (floodlit gold at night)
  const K = new B.Kit(), stone = ['#d9c7a3', '#cbb894', '#e2d4b6', '#bfa982'], lit = B.night > 0.2;
  for (let i = 0; i < 10; i++) {
    const x = (i - 4.5) * 30, h = 30 + B.rng() * 30, w = 24 + B.rng() * 4;
    K.add('solid', B.box(w, h, 24, { x, y: h / 2, color: B.c(stone[i % 4]) }));
    if (i === 3) {
      K.add('solid', B.ball(10, { x, y: h, color: B.c('#5fae96') }, 1));
      if (lit) K.add('glow', B.part(new THREE.TorusGeometry(10.1, 0.4, 3, 16), { x, y: h + 0.5, rx: Math.PI / 2, color: '#6affd0' }));
    }
    if (i === 6) {
      K.add('solid', B.box(10, 30, 10, { x, y: h + 15, color: B.c(stone[0]) }), B.cyl(0.5, 7, 10, 4, { x, y: h + 35, ry: Math.PI / 4, color: B.c('#5fae96') }));
      if (lit) K.add('glow', grad(B.box(10.4, 30, 0.4, { x, y: h + 15, z: 5.1 }), h, h + 30, '#ffd890', '#a86a30'), B.part(new THREE.CircleGeometry(3, 12), { x, y: h + 22, z: 5.4, color: '#fff2cc' }));
    }
    if (lit) { // the gold wash up the river front, a lit cornice, the windows
      K.add('glow', grad(B.part(new THREE.PlaneGeometry(w, h), { x, y: h / 2, z: 12.05 }), 0, h, '#ffc66e', '#6a3c22'));
      K.add('glow', B.box(w + 1, 1.2, 25, { x, y: h - 1.5, color: '#ffe2a2' }));
      for (let k = 0; k < 4; k++) K.add('glow', B.box(w * 0.8, 1.2, 0.4, { x, y: 8 + k * (h - 10) / 4, z: 12.3, color: '#fff0c0' }));
    }
  }
  return B.mesh(K);
}
function pudongBank(o, th, B) { // the far bank: a low promenade, trees and lamps, an LED edge along the water
  const K = new B.Kit(), len = o.len ?? 800, lit = B.night > 0.2;
  K.add('solid', B.box(30, 4, len, { y: 2, color: B.c('#6a6070') }));
  if (lit) K.add('glow', B.box(0.8, 0.8, len, { x: -15.2, y: 3.6, color: '#2be8ff' }), B.box(0.6, 0.6, len, { x: -15.2, y: 0.8, color: '#ff2bd6' }));
  for (let z = -len / 2; z < len / 2; z += 18) { K.add('solid', B.ball(4, { y: 7, z, color: B.c('#3a5a3a') }, 0)); K.add('glow', B.box(1, 1, 1, { x: -14, y: 5, z: z + 9, color: '#fff0c8' })); }
  if (lit) { // the skyline's colours shivering on the river toward you: columns of broken dashes
    const R = B.rng, reach = o.reach ?? 120;
    for (let z = -len / 2; z < len / 2; z += 8) {
      const col = LED[Math.floor(R() * LED.length)], warm = R() < 0.35;
      for (let r = 2 + R() * 6; r < reach; r += 8 + R() * 14) {
        const t = r / reach;
        if (R() < 0.2 + t * 0.5) continue;
        _c.set(warm ? '#ffd890' : col).lerp(_a.set(th.water || '#121a40'), t * 0.85);
        const L = (8 + R() * 18) * (1 - t * 0.4);
        K.add('glow', B.part(new THREE.PlaneGeometry(1.2 + R() * 1.4, L), { x: -15 - r - L / 2, y: 1.0, z: z + (R() - 0.5) * 3, rx: -Math.PI / 2, rz: Math.PI / 2, color: _c.getHex() }));
      }
    }
  }
  return B.mesh(K);
}

// A district of LED-wrapped towers (o.w × o.d, o.n towers, heights o.hMin..o.hMax): dark glass shafts
// wrapped in static bands of coloured light (the scrolling bars, frozen), lit edges, crowns and beacons.
function ledTowers(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 16, W = o.w ?? 200, D = o.d ?? 100, lit = B.night > 0.2, R = B.rng;
  const pal = o.pal || LED;
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * W, z = (R() - 0.5) * D, w = 14 + R() * 16, d = w * (0.7 + R() * 0.6);
    const h = (o.hMin ?? 50) + R() * ((o.hMax ?? 160) - (o.hMin ?? 50)), kind = Math.floor(R() * 4);
    const glass = B.c(lit ? ['#161a34', '#1c1430', '#122030'][i % 3] : o.color || '#8a94a8');
    K.add('solid', B.box(w, h, d, { x, y: h / 2, z, color: glass }));
    if (!lit) continue;
    const c1 = pal[Math.floor(R() * pal.length)], c2 = pal[Math.floor(R() * pal.length)];
    if (kind === 0) { // horizontal ticker bars: lengths and colours vary floor by floor
      for (let y = 6; y < h - 2; y += 4 + Math.floor(R() * 3)) {
        const f = R(), len = 0.3 + R() * 0.7, col = R() < 0.6 ? c1 : c2;
        if (f < 0.25) continue;
        K.add('glow', B.box(w * len + 0.4, 1.0, 0.4, { x: x + (R() - 0.5) * w * (1 - len), y, z: z + d / 2 + 0.2, color: col }));
        K.add('glow', B.box(0.4, 1.0, d * len + 0.4, { x: x + w / 2 + 0.2, y, z: z + (R() - 0.5) * d * (1 - len), color: col }));
        K.add('glow', B.box(0.4, 1.0, d * len + 0.4, { x: x - w / 2 - 0.2, y, z: z + (R() - 0.5) * d * (1 - len), color: col }));
        K.add('glow', B.box(w * len + 0.4, 1.0, 0.4, { x: x + (R() - 0.5) * w * (1 - len), y, z: z - d / 2 - 0.2, color: col }));
      }
    } else if (kind === 1) { // vertical LED stripes, a gradient from one colour to the next
      const m = Math.max(2, Math.floor(w / 5));
      for (let k = 0; k < m; k++) {
        const ox = -w / 2 + (k + 0.5) * w / m;
        K.add('glow', grad(B.box(0.7, h * 0.9, 0.4, { x: x + ox, y: h * 0.47, z: z + d / 2 + 0.2 }), 0, h, c1, c2));
        K.add('glow', grad(B.box(0.7, h * 0.9, 0.4, { x: x - ox, y: h * 0.47, z: z - d / 2 - 0.2 }), 0, h, c1, c2));
      }
      band(K, B, x, z, w, d, h - 1.5, c2, 1.4);
    } else if (kind === 2) { // window floors (warm) with lit corner edges
      for (let y = 5; y < h - 3; y += 3.5) if (R() < 0.75) K.add('glow', B.box(w * (0.5 + R() * 0.4), 0.9, d + 0.3, { x, y, z, color: R() < 0.7 ? '#ffd890' : '#bfe8ff' }));
      edges(K, B, x, z, w, d, 0, h, c1, 0.7);
    } else { // a whole face as a giant screen: a gradient panel, framed
      const sh = Math.min(h * 0.5, 60), sy = h - sh / 2 - 6;
      K.add('glow', grad(B.part(new THREE.PlaneGeometry(w * 0.86, sh), { x, y: sy, z: z + d / 2 + 0.25 }), sy - sh / 2, sy + sh / 2, c1, c2));
      K.add('glow', grad(B.part(new THREE.PlaneGeometry(w * 0.86, sh), { x, y: sy, z: z - d / 2 - 0.25, ry: Math.PI }), sy - sh / 2, sy + sh / 2, c2, c1));
      for (let y = 5; y < sy - sh / 2; y += 4) if (R() < 0.6) K.add('glow', B.box(w * 0.7, 0.8, d + 0.3, { x, y, z, color: '#ffd890' }));
    }
    if (R() < 0.6) band(K, B, x, z, w, d, h, R() < 0.5 ? c1 : '#ffffff', 0.8); // the crown outline
    if (R() < 0.5) { const mh = 8 + R() * 18; K.add('solid', B.cyl(0.4, 0.8, mh, 4, { x, y: h + mh / 2, z, color: B.c('#3a3a44') })); K.add('glow', B.box(1.4, 1.4, 1.4, { x, y: h + mh, z, color: '#ff2a2a' })); }
  }
  return B.mesh(K);
}

// Tour boats on the Huangpu (along x, spread over o.len × o.d): long low hulls drawn in light.
function riverBoats(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 6, L = o.len ?? 300, D = o.d ?? 80, R = B.rng;
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * D, z = (i / Math.max(1, n - 1) - 0.5) * L + (R() - 0.5) * 20, len = 24 + R() * 18, wid = 6 + R() * 2;
    const c = ['#ff2bd6', '#ffd23a', '#2be8ff', '#ff5a2b'][i % 4];
    K.add('solid', B.box(wid, 2.4, len, { x, y: 1.2, z, color: B.c('#1a1420') }));
    K.add('solid', B.box(wid - 1.4, 2.6, len * 0.7, { x, y: 3.6, z, color: B.c('#d8d0c0') }), B.box(wid - 2.4, 2.2, len * 0.4, { x, y: 6, z, color: B.c('#c8302a') }));
    K.add('glow', B.box(wid + 0.3, 0.4, len + 0.3, { x, y: 2.5, z, color: c }), B.box(wid - 1.1, 0.3, len * 0.7 + 0.3, { x, y: 4.9, z, color: '#ffd23a' }), B.box(wid - 2.1, 0.3, len * 0.4 + 0.3, { x, y: 7.1, z, color: c }));
    K.add('glow', B.box(wid - 1.3, 1.0, len * 0.66, { x, y: 3.5, z, color: '#ffe0a0' }));
    K.add('glow', B.box(wid * 0.9, 0.1, len * 1.25, { x, y: 0.7, z, color: c })); // its reflection on the water
  }
  return B.mesh(K);
}

export const SHANGHAI_BACKDROPS = { pearlTower, pearlUpper, pearlLegs, twistTower, bottleOpener, jinmaoTower, bundRow, pudongBank, ledTowers, riverBoats };
