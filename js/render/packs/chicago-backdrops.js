// NEO CHICAGO's distant landmarks (render only, far outside the play space; hazed, not fogged):
// the black bundled-tube SEARS 312, the tapered JOHN 875, the Navy Pier wheel, Marina City, the
// water-intake crib and sails on the lake, and blocks of Chicago skyline (deco crowns, slabs).
// Built with the backdrop helper bag B (render/backdrops.js): 'solid' is lit, 'glow' is unlit.

// SEARS 312: nine bundled tubes ending at different heights, belts, twin antennas.
function chiWillisFar(o, th, B) {
  const K = new B.Kit(), s = 22, dark = B.c('#1c1c22'), belt = B.c('#0e0e12');
  const H = [[160, 215, 160], [215, 335, 265], [265, 335, 295]]; // [row][col], row 0 = south
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const h = H[r][c], x = (c - 1) * s, z = (1 - r) * s;
    K.add('solid', B.box(s, h, s, { x, y: h / 2, z, color: dark }));
    for (const by of [70, 150, 230, 300]) if (by < h - 4) K.add('solid', B.box(s + 0.8, 5, s + 0.8, { x, y: by, z, color: belt }));
    if (B.night) for (let k = 0; k < 14; k++) K.add('glow', B.box(s * 0.7, 1.2, 0.5, { x: x + (B.rng() - 0.5) * 4, y: 10 + B.rng() * (h - 20), z: z + s / 2 + 0.3, color: B.rng() < 0.7 ? '#ffd890' : '#8ff0ff' }));
  }
  for (const x of [-7, 7]) {
    K.add('solid', B.cyl(1.2, 2.2, 110, 6, { x, y: 335 + 55, z: -s * 0.4, color: B.c('#d8d8d8', -0.1) }));
    K.add('glow', B.ball(2.2, { x, y: 446, z: -s * 0.4, color: '#ff3030' }));
  }
  return B.mesh(K);
}
// JOHN 875: a black tapering box, X-braced, two antennas.
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
    }
  }
  for (const x of [-9, 9]) {
    K.add('solid', B.cyl(0.9, 1.6, 100, 6, { x, y: h + 50, z: -6, color: B.c('#e0e0e0', -0.1) }));
    K.add('glow', B.ball(2.0, { x, y: h + 101, z: -6, color: '#ff3030' }));
  }
  if (B.night) for (let k = 0; k < 30; k++) K.add('glow', B.box(10, 1, 0.6, { x: (B.rng() - 0.5) * 30, y: 10 + B.rng() * (h - 30), z: 26 - (B.rng() * 0), color: '#ffd890' }));
  return B.mesh(K);
}
// The Navy Pier wheel: rim, spokes, lights, A-frame legs, gondola dots.
function chiWheelFar(o, th, B) {
  const K = new B.Kit(), R = 42, hub = R + 12, white = B.c('#eef0f4', -0.1);
  for (const z of [-3, 3]) {
    K.add('solid', B.part(new B.THREE.TorusGeometry(R, 0.7, 4, B.seg(48, 32)), { y: hub, z, color: white }));
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; K.add('solid', B.cyl(0.25, 0.25, R, 4, { x: Math.cos(a) * R / 2, y: hub + Math.sin(a) * R / 2, z, rz: a - Math.PI / 2, color: white })); }
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    K.add('solid', B.box(3, 3, 5, { x: Math.cos(a) * R, y: hub + Math.sin(a) * R - 2.5, color: B.c(['#ff5a2b', '#2be8ff', '#ffd23a', '#ff2bd6'][k % 4]) }));
    if (B.night) K.add('glow', B.box(1.2, 1.2, 7, { x: Math.cos(a) * (R + 1.2), y: hub + Math.sin(a) * (R + 1.2), color: k % 2 ? '#ffffff' : '#ff5a2b' }));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add('solid', B.box(2, hub * 1.08, 2, { x: sx * hub * 0.2, y: hub / 2, z: sz * 8, rz: -sx * 0.38, color: white }));
  K.add('solid', B.box(140, 6, 30, { x: -40, y: 3, z: 0, color: B.c('#8a7a68') })); // the pier
  return B.mesh(K);
}
// Marina City: two corncobs.
function chiMarinaFar(o, th, B) {
  const K = new B.Kit(), r = 12, h = 180;
  for (const x of [-18, 18]) {
    K.add('solid', B.cyl(r, r, h, 10, { x, y: h / 2, color: B.c('#d8d4cc') }));
    for (let y = 8; y < h; y += 12) K.add('solid', B.cyl(r + 2.2, r + 2.2, 1.6, 10, { x, y, color: B.c('#f0ece4') }));
    if (B.night) for (let k = 0; k < 18; k++) K.add('glow', B.box(3, 2, 0.5, { x: x + (B.rng() - 0.5) * 12, y: 60 + B.rng() * (h - 70), z: r + 2.5, color: '#ffd890' }));
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
  return B.mesh(K);
}
// Sails on the lake.
function chiSailsFar(o, th, B) {
  const K = new B.Kit();
  for (let k = 0; k < 7; k++) {
    const x = (B.rng() - 0.5) * 260, z = (B.rng() - 0.5) * 200, h = 18 + B.rng() * 10;
    K.add('solid', B.box(4, 2, 12, { x, y: 1, z, color: B.c('#f4f4f0') }));
    const g = new B.THREE.BufferGeometry();
    g.setAttribute('position', new B.THREE.Float32BufferAttribute([x, 2, z - 4, x, 2 + h, z - 1, x, 2, z + 5, x, 2, z - 4, x, 2, z + 5, x, 2 + h, z - 1], 3));
    g.computeVertexNormals();
    K.add('solid', B.part(g, { color: B.c(k % 3 ? '#f8f8f4' : '#ff5a2b') }));
  }
  return B.mesh(K);
}
// A block of Chicago skyline: limestone deco crowns, dark glass, a white slab, a few spires.
function chiSkylineFar(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 14, W = o.w ?? 200, D = o.d ?? 70;
  const cols = ['#8a94a8', '#b8b0a0', '#5a6070', '#d8d4cc', '#7a6a5a', '#9aa4b4'];
  for (let i = 0; i < n; i++) {
    const x = (B.rng() - 0.5) * W, z = (B.rng() - 0.5) * D, w = 14 + B.rng() * 16, d = w * (0.7 + B.rng() * 0.5), h = 50 + B.rng() * 170;
    const kind = Math.floor(B.rng() * 4), col = B.c(cols[Math.floor(B.rng() * cols.length)]);
    K.add('solid', B.box(w, h, d, { x, y: h / 2, z, color: col }));
    K.add('solid', B.box(w + 0.6, 3, d + 0.6, { x, y: h - 1.5, z, color: B.c('#3a3c44') })); // a dark crown band
    if (kind === 0) { K.add('solid', B.box(w * 0.7, h * 0.12, d * 0.7, { x, y: h + h * 0.06, z, color: col }), B.box(w * 0.4, h * 0.1, d * 0.4, { x, y: h * 1.17, z, color: col })); } // deco setbacks
    else if (kind === 1) K.add('solid', B.part(new B.THREE.ConeGeometry(w * 0.6, h * 0.18, 4), { x, y: h + h * 0.09, z, ry: Math.PI / 4, color: B.c('#3a6a5a') })); // a copper pyramid
    else if (kind === 2) K.add('solid', B.cyl(0.6, 1.2, h * 0.25, 5, { x, y: h + h * 0.125, z, color: B.c('#d8d8d8') })); // a spire
    if (B.night) for (let k = 0; k < 4; k++) K.add('glow', B.box(w * 0.8, 1, 0.4, { x, y: h * (0.15 + k * 0.2), z: z + d / 2 + 0.2, color: B.rng() < 0.75 ? '#ffd890' : '#8ff0ff' }));
  }
  return B.mesh(K);
}

export const BACKDROPS = { chiWillisFar, chiHancockFar, chiWheelFar, chiMarinaFar, chiCribFar, chiSailsFar, chiSkylineFar };
