// NEO CHICAGO's distant landmarks (render only, far outside the play space; hazed, not fogged):
// the black bundled-tube SEARS 312, the tapered JOHN 875, the Navy Pier wheel, Marina City, the
// water-intake crib and sails on the lake, and blocks of Chicago skyline (deco crowns, slabs).
// At night the skyline is a wall of lights: every tower banded with lit floors on all four faces,
// crowns floodlit or ringed in neon, red beacons on the spires.
// Built with the backdrop helper bag B (render/backdrops.js): 'solid' is lit, 'glow' is unlit.
import * as THREE from 'three';

const _c = new THREE.Color();
const dk = (hex, k) => _c.set(hex).multiplyScalar(k).getHex();
const WIN = ['#ffd890', '#ffe6b8', '#ffc878', '#fff2d8', '#8ff0ff', '#ffd890'];
// Lit floors on all four faces of a w × d × h block at (x, y0, z): one quad per floor and face,
// a few dark; `fh` metres a floor.
function floors(K, B, x, y0, z, w, d, h, o = {}) {
  const fh = o.fh ?? 5, lit = o.lit ?? 0.72, k = o.k ?? 1;
  for (const [nx, nz, fw] of [[0, 1, w], [0, -1, w], [1, 0, d], [-1, 0, d]]) {
    const ry = Math.atan2(nx, nz), ox = nx * (w / 2 + 0.25), oz = nz * (d / 2 + 0.25);
    for (let y = y0 + 6; y < y0 + h - 3; y += fh) {
      if (B.rng() > lit) continue;
      const seg = fw * (0.45 + B.rng() * 0.5), off = (B.rng() - 0.5) * (fw - seg) * 0.8;
      K.add('glow', B.part(new THREE.PlaneGeometry(seg, fh * 0.42), { x: x + ox + (nz ? off : 0), y, z: z + oz + (nx ? off : 0), ry, color: dk(o.col || WIN[Math.floor(B.rng() * WIN.length)], k * (0.7 + B.rng() * 0.3)) }));
    }
  }
}
// A neon or floodlit ring round a block's top (x, y, z), w × d.
const crownRing = (K, B, x, y, z, w, d, col, t = 1.4) => K.add('glow', B.box(w + 0.8, t, d + 0.8, { x, y, z, color: col }));

// SEARS 312: nine bundled tubes ending at different heights, belts, twin antennas; at night its
// floors lit, red beacon rows on the belts, white strobes on the antenna tips.
function chiWillisFar(o, th, B) {
  const K = new B.Kit(), s = 22, dark = B.c('#1c1c22'), belt = B.c('#0e0e12');
  const H = [[160, 215, 160], [215, 335, 265], [265, 335, 295]]; // [row][col], row 0 = south
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const h = H[r][c], x = (c - 1) * s, z = (1 - r) * s;
    K.add('solid', B.box(s, h, s, { x, y: h / 2, z, color: dark }));
    for (const by of [70, 150, 230, 300]) if (by < h - 4) {
      K.add('solid', B.box(s + 0.8, 5, s + 0.8, { x, y: by, z, color: belt }));
      if (B.night) K.add('glow', B.box(s + 1, 0.9, s + 1, { x, y: by - 2, z, color: dk('#ff2a3a', 0.85) }));
    }
    if (B.night) { floors(K, B, x, 0, z, s, s, h, { fh: 6, lit: 0.62, k: 0.85 }); K.add('glow', B.box(s + 0.6, 1.2, s + 0.6, { x, y: h - 1, z, color: '#fff4e0' })); }
  }
  for (const x of [-7, 7]) {
    K.add('solid', B.cyl(1.2, 2.2, 110, 6, { x, y: 335 + 55, z: -s * 0.4, color: B.c('#d8d8d8', -0.1) }));
    K.add('glow', B.ball(2.2, { x, y: 446, z: -s * 0.4, color: B.night ? '#ffffff' : '#ff3030' }));
    if (B.night) for (let y = 360; y < 440; y += 20) K.add('glow', B.box(2.6, 2.6, 2.6, { x, y, z: -s * 0.4, color: '#ff2a2a' }));
  }
  return B.mesh(K);
}
// JOHN 875: a black tapering box, X-braced, two antennas; at night a white crown band, lit floors.
function chiHancockFar(o, th, B) {
  const K = new B.Kit(), h = 340, rb = 34, rt = 22, dark = B.c('#202026'), brace = B.c('#6a6a74');
  K.add('solid', B.part(new B.THREE.CylinderGeometry(rt, rb, h, 4, 1), { y: h / 2, ry: Math.PI / 4, color: dark }));
  const sec = 5, hh = h / sec;
  for (let k = 0; k < sec; k++) {
    const y0 = k * hh, y1 = y0 + hh, w0 = (rb + (rt - rb) * (y0 / h)) * Math.SQRT2, w1 = (rb + (rt - rb) * (y1 / h)) * Math.SQRT2;
    const wm = (w0 + w1) / 2, L = Math.sqrt(wm * wm + hh * hh), a = Math.atan2(hh, wm);
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const off = wm / 2 + 1.2;
      for (const s of [-1, 1]) K.add('solid', B.box(nz ? L : 1.6, 2.2, nz ? 1.6 : L, { x: nx * off, y: (y0 + y1) / 2, z: nz * off, [nz ? 'rz' : 'rx']: s * a, color: brace }));
      K.add('solid', B.box(nz ? w1 : 1.6, 2.4, nz ? 1.6 : w1, { x: nx * (w1 / 2 + 1.2), y: y1, z: nz * (w1 / 2 + 1.2), color: brace }));
      if (B.night) for (let y = y0 + 4; y < y1 - 2; y += 7) if (B.rng() < 0.7) { // lit floors between the braces
        const wy = (rb + (rt - rb) * (y / h)) * Math.SQRT2;
        K.add('glow', B.part(new THREE.PlaneGeometry(wy * (0.3 + B.rng() * 0.5), 2.6), { x: nx * (wy / 2 + 0.6) + (nz ? (B.rng() - 0.5) * wy * 0.4 : 0), y, z: nz * (wy / 2 + 0.6) + (nx ? (B.rng() - 0.5) * wy * 0.4 : 0), ry: Math.atan2(nx, nz), color: dk(WIN[Math.floor(B.rng() * WIN.length)], 0.8) }));
      }
    }
  }
  if (B.night) K.add('glow', B.box(rt * Math.SQRT2 + 2.4, 6, rt * Math.SQRT2 + 2.4, { y: h - 5, color: '#e8f0ff' }));
  for (const x of [-9, 9]) {
    K.add('solid', B.cyl(0.9, 1.6, 100, 6, { x, y: h + 50, z: -6, color: B.c('#e0e0e0', -0.1) }));
    K.add('glow', B.ball(2.0, { x, y: h + 101, z: -6, color: '#ff3030' }));
    if (B.night) for (let y = h + 20; y < h + 95; y += 25) K.add('glow', B.box(2.2, 2.2, 2.2, { x, y, z: -6, color: '#ff2a2a' }));
  }
  return B.mesh(K);
}
// The Navy Pier wheel: rim, spokes, lights, A-frame legs, gondola dots; at night its spokes lit in
// colour and the pier strung with lights.
function chiWheelFar(o, th, B) {
  const K = new B.Kit(), R = 42, hub = R + 12, white = B.c('#eef0f4', -0.1);
  const SP = ['#ff2bd6', '#2be8ff', '#ffd23a', '#ff5a2b'];
  for (const z of [-3, 3]) {
    K.add('solid', B.part(new B.THREE.TorusGeometry(R, 0.7, 4, B.seg(48, 32)), { y: hub, z, color: white }));
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; K.add(B.night ? 'glow' : 'solid', B.cyl(0.25, 0.25, R, 4, { x: Math.cos(a) * R / 2, y: hub + Math.sin(a) * R / 2, z, rz: a - Math.PI / 2, color: B.night ? dk(SP[k % 4], 0.8) : white })); }
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    K.add('solid', B.box(3, 3, 5, { x: Math.cos(a) * R, y: hub + Math.sin(a) * R - 2.5, color: B.c(['#ff5a2b', '#2be8ff', '#ffd23a', '#ff2bd6'][k % 4]) }));
    if (B.night) K.add('glow', B.box(1.2, 1.2, 7, { x: Math.cos(a) * (R + 1.2), y: hub + Math.sin(a) * (R + 1.2), color: k % 2 ? '#ffffff' : '#ff5a2b' }));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add('solid', B.box(2, hub * 1.08, 2, { x: sx * hub * 0.2, y: hub / 2, z: sz * 8, rz: -sx * 0.38, color: white }));
  K.add('solid', B.box(140, 6, 30, { x: -40, y: 3, z: 0, color: B.c('#8a7a68') })); // the pier
  if (B.night) {
    K.add('glow', B.ball(4, { y: hub, color: '#fff0d0' }));
    for (let x = -108; x < 28; x += 6) for (const z of [-15.5, 15.5]) K.add('glow', B.box(1.2, 1.2, 1.2, { x, y: 7.5, z, color: x % 12 ? '#ffd890' : '#ff6ad8' }));
    K.add('glow', B.box(60, 8, 0.6, { x: -70, y: 12, z: 15.4, color: dk('#ffd890', 0.7) }), B.box(60, 8, 0.6, { x: -70, y: 12, z: -15.4, color: dk('#ffd890', 0.7) }));
  }
  return B.mesh(K);
}
// Marina City: two corncobs, their balconies lit.
function chiMarinaFar(o, th, B) {
  const K = new B.Kit(), r = 12, h = 180;
  for (const x of [-18, 18]) {
    K.add('solid', B.cyl(r, r, h, 10, { x, y: h / 2, color: B.c('#d8d4cc') }));
    for (let y = 8; y < h; y += 12) K.add('solid', B.cyl(r + 2.2, r + 2.2, 1.6, 10, { x, y, color: B.c('#f0ece4') }));
    if (B.night) {
      for (let y = 62; y < h - 4; y += 6) for (let k = 0; k < 10; k++) if (B.rng() < 0.55) { const a = (k / 10) * Math.PI * 2; K.add('glow', B.box(4.5, 2.4, 0.5, { x: x + Math.cos(a) * (r + 0.4), y, z: Math.sin(a) * (r + 0.4), ry: -a + Math.PI / 2, color: dk(WIN[k % WIN.length], 0.85) })); }
      for (let y = 10; y < 60; y += 12) K.add('glow', B.cyl(r + 0.3, r + 0.3, 1.2, 10, { x, y: y + 3, color: dk('#ffc070', 0.7) }));
      K.add('glow', B.box(2, 2, 2, { x, y: h + 2, color: '#ff2a2a' }));
    }
  }
  return B.mesh(K);
}
// The water-intake crib out on the lake: a round fort with a keeper's house and a light.
function chiCribFar(o, th, B) {
  const K = new B.Kit();
  K.add('solid', B.cyl(26, 28, 9, B.seg(18, 12), { y: 4.5, color: B.c('#a8a49a') }));
  K.add('solid', B.box(18, 10, 14, { y: 14, color: B.c('#e8e0d0') }), B.part(new B.THREE.ConeGeometry(13, 7, 4), { y: 22.5, ry: Math.PI / 4, color: B.c('#b8302a') }));
  K.add('solid', B.cyl(2, 2.6, 16, 8, { x: 14, y: 17, color: B.c('#f0f0ec') }));
  K.add('glow', B.ball(2.2, { x: 14, y: 26, color: '#ffd060' }));
  if (B.night) {
    for (const z of [-7.3, 7.3]) K.add('glow', B.box(10, 2.4, 0.4, { y: 14, z, color: '#ffd890' }));
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; K.add('glow', B.box(1.4, 1.4, 1.4, { x: Math.cos(a) * 27.5, y: 9.5, z: Math.sin(a) * 27.5, color: '#ffc070' })); }
  }
  return B.mesh(K);
}
// Sails on the lake (at night: mast lights and lit cabins).
function chiSailsFar(o, th, B) {
  const K = new B.Kit();
  for (let k = 0; k < 7; k++) {
    const x = (B.rng() - 0.5) * 260, z = (B.rng() - 0.5) * 200, h = 18 + B.rng() * 10;
    K.add('solid', B.box(4, 2, 12, { x, y: 1, z, color: B.c('#f4f4f0') }));
    const g = new B.THREE.BufferGeometry();
    g.setAttribute('position', new B.THREE.Float32BufferAttribute([x, 2, z - 4, x, 2 + h, z - 1, x, 2, z + 5, x, 2, z - 4, x, 2, z + 5, x, 2 + h, z - 1], 3));
    g.computeVertexNormals();
    K.add('solid', B.part(g, { color: B.c(k % 3 ? '#f8f8f4' : '#ff5a2b') }));
    if (B.night) K.add('glow', B.box(0.9, 0.9, 0.9, { x, y: 2.6 + h, z: z - 1, color: '#ffffff' }), B.box(4.2, 0.8, 6, { x, y: 1.6, z: z + 2, color: '#ffd890' }), B.box(0.8, 0.8, 0.8, { x: x - 2.1, y: 1.5, z: z - 5, color: '#ff3a3a' }), B.box(0.8, 0.8, 0.8, { x: x + 2.1, y: 1.5, z: z - 5, color: '#3aff6a' }));
  }
  return B.mesh(K);
}
// A block of Chicago skyline: limestone deco crowns, dark glass, a white slab, a few spires. At
// night a wall of lights: lit floors on every face, crowns floodlit white or ringed in neon, red
// beacons on the spires and masts.
function chiSkylineFar(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 14, W = o.w ?? 200, D = o.d ?? 70;
  const cols = ['#8a94a8', '#b8b0a0', '#5a6070', '#d8d4cc', '#7a6a5a', '#9aa4b4'];
  const CROWN = ['#fff4e0', '#ff2b4a', '#2be8ff', '#3aff9a', '#ffd23a', '#ff2bd6', '#fff4e0'];
  for (let i = 0; i < n; i++) {
    const x = (B.rng() - 0.5) * W, z = (B.rng() - 0.5) * D, w = 14 + B.rng() * 16, d = w * (0.7 + B.rng() * 0.5), h = 50 + B.rng() * 170;
    const kind = Math.floor(B.rng() * 4), col = B.c(B.night ? ['#2a2c38', '#34303a', '#20242e', '#3a3a44', '#2c2830', '#303844'][Math.floor(B.rng() * 6)] : cols[Math.floor(B.rng() * cols.length)]);
    K.add('solid', B.box(w, h, d, { x, y: h / 2, z, color: col }));
    K.add('solid', B.box(w + 0.6, 3, d + 0.6, { x, y: h - 1.5, z, color: B.c('#3a3c44') })); // a dark crown band
    if (kind === 0) { K.add('solid', B.box(w * 0.7, h * 0.12, d * 0.7, { x, y: h + h * 0.06, z, color: col }), B.box(w * 0.4, h * 0.1, d * 0.4, { x, y: h * 1.17, z, color: col })); } // deco setbacks
    else if (kind === 1) K.add('solid', B.part(new B.THREE.ConeGeometry(w * 0.6, h * 0.18, 4), { x, y: h + h * 0.09, z, ry: Math.PI / 4, color: B.c('#3a6a5a') })); // a copper pyramid
    else if (kind === 2) K.add('solid', B.cyl(0.6, 1.2, h * 0.25, 5, { x, y: h + h * 0.125, z, color: B.c('#d8d8d8') })); // a spire
    if (!B.night) continue;
    floors(K, B, x, 0, z, w, d, h, { fh: 5, lit: 0.7 });
    const cc = CROWN[Math.floor(B.rng() * CROWN.length)];
    crownRing(K, B, x, h - 1.5, z, w, d, cc, 1.6);
    if (kind === 0) { // floodlit deco setbacks
      K.add('glow', B.box(w * 0.7 + 0.4, h * 0.12 * 0.4, d * 0.7 + 0.4, { x, y: h + h * 0.03, z, color: dk('#fff0d0', 0.8) }));
      K.add('glow', B.box(w * 0.4 + 0.4, h * 0.1 * 0.5, d * 0.4 + 0.4, { x, y: h * 1.14, z, color: dk(cc, 0.9) }));
    } else if (kind === 1) K.add('glow', B.box(w * 1.1, 1.2, d * 1.1, { x, y: h + 0.8, z, color: '#3aff9a' })); // the copper pyramid's lit rim
    else if (kind === 2) for (let y = h + 4; y < h * 1.25; y += 9) K.add('glow', B.box(1.6, 1.6, 1.6, { x, y, z, color: '#ff2a2a' }));
    else if (B.rng() < 0.6) { const mh = 10 + B.rng() * 20; K.add('solid', B.cyl(0.4, 0.7, mh, 4, { x: x + w * 0.3, y: h + mh / 2, z, color: B.c('#9aa2ae') })); K.add('glow', B.box(1.5, 1.5, 1.5, { x: x + w * 0.3, y: h + mh + 0.8, z, color: '#ff2a2a' })); }
    if (B.rng() < 0.3) for (const s of [-1, 1]) K.add('glow', B.box(0.7, h * 0.85, 0.7, { x: x + s * (w / 2 + 0.2), y: h * 0.45, z: z + d / 2 + 0.2, color: dk(cc, 0.8) })); // LED risers up the corners
  }
  return B.mesh(K);
}

export const BACKDROPS = { chiWillisFar, chiHancockFar, chiWheelFar, chiMarinaFar, chiCribFar, chiSailsFar, chiSkylineFar };
