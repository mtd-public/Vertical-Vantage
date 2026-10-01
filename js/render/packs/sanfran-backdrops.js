// NEW SAN FRANCISCO backdrops: render-only landmarks 300–800 m out, unfogged and hazed toward the
// horizon with B.c(hex). Each is built in real-world-ish metres; the level scales it with `s`.
//   goldenGate    the bridge: two art-deco towers, main cables swooping between them, suspenders,
//                 the deck and its truss, side spans, anchorages and approach viaducts (along local x)
//   alcatraz      the island: cliffs, the cellhouse, the lighthouse, the water tower, the dock
//   fogBank       Karl the Fog: a bank of white cloud rolling over the water / the hills
//   sutro         Sutro Tower: the red-and-white three-legged mast on its hill
//   transamerica  the pyramid and its spire

// A rod from a to b (backdrop units), radius r.
function rod(B, a, b, r, color, n = 5) {
  const T = B.THREE, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-3;
  const g = B.prep(new T.CylinderGeometry(r, r, len, n), color);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}

function goldenGate(o, th, B) {
  const K = new B.Kit(), T = B.THREE;
  const k = o.orange ?? -0.14; // the bridge cuts through the haze a little better than the hills
  const or = B.c('#c0362c', k), orHi = B.c('#d8503a', k), orDk = B.c('#8c2820', k), con = B.c('#d6cec0', k);
  const DECK = 67, TOP = 227, X = 640, SIDE = 345, ZL = 16, END = X + SIDE;
  // the deck and its stiffening truss, out to both shores
  K.add('solid', B.box(2 * (END + 260), 3.5, 27, { y: DECK - 1.75, color: orHi }));
  K.add('solid', B.box(2 * (END + 260), 7.6, 24, { y: DECK - 7.3, color: orDk }));
  for (let x = -END - 240; x <= END + 240; x += 24) K.add('solid', B.box(2, 7.6, 25, { x, y: DECK - 7.3, color: or }));
  // the approach viaducts: concrete piers, and the steel arch over Fort Point at the south end
  for (let x = END + 30; x < END + 260; x += 45) for (const sx of [-1, 1]) K.add('solid', B.box(8, DECK - 8, 8, { x: sx * x, y: (DECK - 8) / 2, color: con }));
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI, a1 = ((i + 1) / 12) * Math.PI, R = 110, cx = END + 120, y0 = DECK - 52;
    for (const sz of [-10, 10]) K.add('solid', rod(B, [cx + Math.cos(a0) * R, y0 + Math.sin(a0) * 42, sz], [cx + Math.cos(a1) * R, y0 + Math.sin(a1) * 42, sz], 3, or));
  }
  // the towers: four stepped sections per leg, five portal struts, a fender at the waterline
  for (const tx of [-X, X]) {
    for (const sz of [-1, 1]) {
      for (const [y0, y1, w, d] of [[0, 75, 13, 19], [75, 135, 12, 17], [135, 185, 11, 15], [185, TOP, 10, 13]]) {
        K.add('solid', B.box(w, y1 - y0, d, { x: tx, y: (y0 + y1) / 2, z: sz * ZL, color: or }));
        K.add('solid', B.box(w + 1, 2.5, d + 1, { x: tx, y: y1 - 1.2, z: sz * ZL, color: orHi }));
      }
      K.add('solid', B.box(13.4, TOP - 30, 2.2, { x: tx, y: TOP / 2, z: sz * (ZL + 9.6), color: orDk })); // the fluting on the outer faces
      K.add('glow', B.box(3, 3, 3, { x: tx, y: TOP + 2, z: sz * ZL, color: '#ff4030' }));
    }
    for (const [y, h] of [[DECK - 10, 9], [116, 10], [162, 9], [204, 9], [TOP - 7, 14]]) {
      K.add('solid', B.box(9, h, 2 * ZL - 10, { x: tx, y, color: or }));
      K.add('solid', B.box(9.4, h * 0.45, 2 * ZL - 14, { x: tx, y: y - h * 0.5 - h * 0.2, color: orDk })); // the stepped art-deco portal under it
    }
    K.add('solid', B.box(44, 14, 70, { x: tx, y: 3, color: con }));
  }
  // main cables and suspenders: the main span is a parabola saddle to saddle; the side spans sag to the anchorages
  const yMain = (x) => DECK + 6 + (TOP + 2 - DECK - 6) * (x / X) * (x / X);
  const ySide = (x) => { const t = (END - Math.abs(x)) / SIDE; return DECK + 6 + (TOP + 2 - DECK - 6) * Math.pow(t, 1.35); };
  const yAt = (x) => (Math.abs(x) <= X ? yMain(x) : ySide(x));
  for (const sz of [-1, 1]) {
    const z = sz * ZL;
    const N = 48;
    for (let i = 0; i < N; i++) { const xa = -END + (2 * END * i) / N, xb = -END + (2 * END * (i + 1)) / N; K.add('solid', rod(B, [xa, yAt(xa), z], [xb, yAt(xb), z], 3.6, or)); }
    for (let x = -END + 20; x < END - 10; x += 22) {
      if (Math.abs(Math.abs(x) - X) < 14) continue;
      const top = yAt(x) - 3;
      if (top - DECK < 6) continue;
      K.add('solid', B.box(1.6, top - DECK, 1.6, { x, y: (top + DECK) / 2, z, color: orHi }));
    }
  }
  for (const sx of [-1, 1]) { // anchorages
    K.add('solid', B.box(48, 34, 60, { x: sx * (END + 18), y: 17, color: con }), B.box(52, 4, 64, { x: sx * (END + 18), y: 35, color: B.c('#b8ae9c', k) }));
  }
  return B.mesh(K);
}

function alcatraz(o, th, B) {
  const K = new B.Kit(), T = B.THREE;
  const rock = B.c('#7a6c58'), cliff = B.c('#94846a'), green = B.c('#5e6c3e'), wall = B.c('#e6dece'), dark = B.c('#4a4a52');
  K.add('solid', B.part(new T.SphereGeometry(1, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { sx: 150, sy: 34, sz: 60, color: cliff }));
  K.add('solid', B.part(new T.SphereGeometry(1, B.seg(10, 7), B.seg(5, 3), 0, Math.PI * 2, 0, Math.PI / 2), { x: 40, y: 8, sx: 90, sy: 32, sz: 42, color: rock }));
  K.add('solid', B.part(new T.SphereGeometry(1, B.seg(10, 7), B.seg(5, 3), 0, Math.PI * 2, 0, Math.PI / 2), { x: -70, y: 2, sx: 60, sy: 22, sz: 40, color: green }));
  K.add('solid', B.box(110, 20, 26, { x: 10, y: 44, color: wall }), B.box(112, 3, 28, { x: 10, y: 55, color: dark }));
  for (let x = -40; x <= 60; x += 9) K.add('solid', B.box(4, 6, 0.6, { x, y: 46, z: 13.3, color: dark }));
  K.add('solid', B.box(7, 36, 7, { x: -52, y: 52, color: wall }), B.box(5, 5, 5, { x: -52, y: 72, color: dark }));
  K.add('glow', B.box(4, 3, 4, { x: -52, y: 72, color: '#fff2b0' }));
  K.add('solid', B.cyl(9, 9, 12, B.seg(10, 7), { x: 80, y: 62, z: -12, color: wall }));
  for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) K.add('solid', B.box(1.5, 26, 1.5, { x: 80 + dx, y: 43, z: -12 + dz, color: dark }));
  K.add('solid', B.box(50, 14, 20, { x: 110, y: 7, z: 30, color: wall }), B.box(40, 2, 18, { x: -120, y: 6, z: 36, color: dark }));
  return B.mesh(K);
}

function fogBank(o, th, B) {
  const K = new B.Kit(), T = B.THREE;
  const n = o.n ?? 9, len = o.len ?? 520;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1) - 0.5) * len + (B.rng() - 0.5) * 30, rx = 50 + B.rng() * 60, ry = 14 + B.rng() * 22, rz = 40 + B.rng() * 40;
    K.add('solid', B.part(new T.SphereGeometry(1, B.seg(12, 8), B.seg(7, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: o.y0 ?? 0, z: (B.rng() - 0.5) * 60, sx: rx, sy: ry, sz: rz, color: B.c(B.rng() < 0.4 ? '#e6e8ec' : '#f8f6f2', -0.25) }));
  }
  return B.mesh(K);
}

function sutro(o, th, B) {
  const K = new B.Kit();
  const red = B.c('#d23a2e', -0.1), white = B.c('#f0ece6', -0.1), hill = B.c(o.hill || '#6a7a4c');
  if (o.hill !== false) K.add('solid', B.part(new B.THREE.SphereGeometry(1, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { y: -20, sx: 170, sy: 70, sz: 140, color: hill }));
  const legAt = (i, r, y) => { const a = (i / 3) * Math.PI * 2 + Math.PI / 2; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const prof = [[44, 40], [30, 110], [18, 170], [22, 220], [30, 290]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < prof.length - 1; j++) {
    const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], steps = 4;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      K.add('solid', rod(B, legAt(i, r0 + (r1 - r0) * t0, y0 + (y1 - y0) * t0), legAt(i, r0 + (r1 - r0) * t1, y0 + (y1 - y0) * t1), 3.2, (j * steps + s) % 2 ? white : red));
    }
  }
  for (const [r, y] of [[30, 110], [18, 170], [22, 220], [30, 290]]) for (let i = 0; i < 3; i++) K.add('solid', rod(B, legAt(i, r, y), legAt((i + 1) % 3, r, y), 1.8, white));
  for (let i = 0; i < 3; i++) { const t = legAt(i, 30, 290); K.add('solid', rod(B, t, [t[0], 330, t[2]], 2, red)); K.add('glow', B.box(4, 4, 4, { x: t[0], y: 332, z: t[2], color: '#ff3a2a' })); }
  return B.mesh(K);
}

function transamerica(o, th, B) {
  const K = new B.Kit(), T = B.THREE;
  const white = B.c('#ece8de', -0.05), shade = B.c('#c8c4bc', -0.05);
  K.add('solid', B.part(new T.ConeGeometry(48 * Math.SQRT2, 250, 4, 1), { y: 125, ry: Math.PI / 4, color: white }));
  for (const sx of [-1, 1]) K.add('solid', B.box(12, 200, 16, { x: sx * 26, y: 100, color: shade }));
  K.add('solid', B.part(new T.ConeGeometry(7, 70, 4, 1), { y: 278, ry: Math.PI / 4, color: white }));
  if (B.night) for (let y = 20; y < 220; y += 12) K.add('glow', B.box(Math.max(2, (1 - y / 250) * 92), 1.4, Math.max(2, (1 - y / 250) * 92) + 0.4, { y, color: '#ffe0a0' }));
  K.add('glow', B.box(3, 3, 3, { y: 314, color: '#ff3a2a' }));
  return B.mesh(K);
}

// the rest of the city: rolling hills carpeted with little pastel houses in rows (o.len along x, o.dep
// along z, o.n hills of height o.h), on a low ground slab so no water shows through
const SPRAWL = ['#f2c8d4', '#c8e2ee', '#f4e6b0', '#d0e8c4', '#dcd0f0', '#f6d2b4', '#e8e4dc', '#c8d4e8'];
function sfSprawl(o, th, B) {
  const K = new B.Kit(), T = B.THREE, len = o.len ?? 600, dep = o.dep ?? 200, n = o.n ?? 5, h = o.h ?? 40;
  K.add('solid', B.box(len + 40, 2, dep + 40, { y: 0.2, color: B.c('#9a968a') }));
  const hills = [];
  for (let i = 0; i < n; i++) hills.push({ x: (i / Math.max(1, n - 1) - 0.5) * len * 0.9, z: (B.rng() - 0.5) * dep * 0.4, r: len / n * (0.7 + B.rng() * 0.5), h: h * (0.5 + B.rng() * 0.6) });
  const ground = (x, z) => { let y = 0; for (const H of hills) { const u = ((x - H.x) * (x - H.x)) / (H.r * H.r) + ((z - H.z) * (z - H.z)) / (H.r * H.r * 0.36); if (u < 1) y = Math.max(y, H.h * Math.sqrt(1 - u)); } return y; };
  for (const H of hills) K.add('solid', B.part(new T.SphereGeometry(1, B.seg(14, 9), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x: H.x, z: H.z, sx: H.r, sy: H.h, sz: H.r * 0.6, color: B.c('#8a9a6a') }));
  for (let z = -dep / 2 + 6; z < dep / 2; z += 15) for (let x = -len / 2 + 5; x < len / 2; x += 9) {
    if (B.rng() < 0.12) continue;
    const y = ground(x, z), hgt = 7 + B.rng() * 5;
    K.add('solid', B.box(7, hgt, 10, { x, y: y + hgt / 2 - 1, z, color: B.c(SPRAWL[Math.floor(B.rng() * SPRAWL.length)]) }));
  }
  return B.mesh(K);
}

// downtown: office towers striped with glass and spandrel bands (lit at dusk), optionally the
// Salesforce tower's rounded crown; footprint o.w × o.d, o.n towers between o.hMin and o.hMax
const TOWER = ['#d8dce4', '#c8ccd4', '#e4e0d8', '#b8c2d0', '#d4ccc0'];
function sfSkyline(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 16, W = o.w ?? 160, D = o.d ?? 80;
  const glass = B.c(B.night ? '#2a3448' : '#5a6a84'), lit = '#ffd890';
  const tower = (x, z, w, d, hh, col, crown) => {
    K.add('solid', B.box(w, hh, d, { x, y: hh / 2, z, color: B.c(col) }));
    for (let y = 4; y < hh - 2; y += 4.5) {
      K.add('solid', B.box(w + 0.6, 2, d + 0.6, { x, y, z, color: glass }));
      if (B.night && B.rng() < 0.45) K.add('glow', B.box(w * (0.3 + B.rng() * 0.5), 1.4, d + 0.8, { x: x + (B.rng() - 0.5) * w * 0.3, y, z, color: lit }));
    }
    if (crown) K.add('solid', B.part(new B.THREE.SphereGeometry(w * 0.62, B.seg(10, 7), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: hh, z, sy: 1.4, color: B.c(col) }));
    else K.add('solid', B.box(w * 0.6, 3, d * 0.6, { x, y: hh + 1.5, z, color: B.c('#8a8e98') }));
  };
  for (let i = 0; i < n; i++) {
    const x = (B.rng() - 0.5) * W, z = (B.rng() - 0.5) * D, w = 12 + B.rng() * 12;
    tower(x, z, w, w * (0.7 + B.rng() * 0.5), (o.hMin ?? 40) + B.rng() * ((o.hMax ?? 120) - (o.hMin ?? 40)), TOWER[i % TOWER.length], false);
  }
  if (o.salesforce) tower(0, 0, 18, 18, (o.hMax ?? 120) * 1.5, '#d8d4cc', true);
  return B.mesh(K);
}

export default { goldenGate, alcatraz, fogBank, sutro, transamerica, sfSprawl, sfSkyline };
