// OCEAN CORE backdrops: distant landmarks on the open sea (render only, hazed toward the horizon).
// (o, th, B) → Object3D in metres, sea level at y = 0. B: { THREE, Kit, box, cyl, ball, part, seg,
// c (hazed colour), mesh(kit), rng, night }. 'solid' is lit, 'glow' is unlit (lights at night).

// An offshore wind farm: o.n turbines in two staggered rows along x, blades locked at seeded angles.
function windfarm(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 12, THREE = B.THREE;
  const white = B.c('#e8ecf0'), grey = B.c('#9aa2ae', 0.05), yellow = B.c('#f2c21a', 0.05);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 70 + (i % 2) * 20, z = (i % 2) * 90 + (B.rng() - 0.5) * 20, h = 85 + B.rng() * 15;
    K.add('solid', B.cyl(2.6, 3.8, h, 6, { x, y: h / 2, z, color: white }), B.cyl(4.5, 4.5, 6, 6, { x, y: 3, z, color: yellow }));
    K.add('solid', B.box(5, 5, 14, { x, y: h + 2, z: z + 3, color: white }));
    const a0 = B.rng() * Math.PI * 2;
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * Math.PI * 2) / 3, L = 52;
      K.add('solid', B.part(new THREE.BoxGeometry(1.4, L, 3), { x: x + Math.cos(a) * (L / 2 + 2), y: h + 2 + Math.sin(a) * (L / 2 + 2), z: z - 4.5, rz: a - Math.PI / 2, color: k ? white : grey }));
    }
    if (B.night) K.add('glow', B.box(2, 2, 2, { x, y: h + 5.5, z: z + 3, color: '#ff2a2a' }), B.box(1.5, 1.5, 1.5, { x, y: h * 0.5, z, color: '#ff2a2a' }));
  }
  return B.mesh(K);
}

// A container ship steaming past: dark hull with a red boot, stacked boxes, the white bridge aft.
function ship(o, th, B) {
  const K = new B.Kit(), THREE = B.THREE;
  K.add('solid', B.box(220, 16, 32, { y: 6, color: B.c('#262a36') }), B.box(221, 4, 33, { y: 0.5, color: B.c('#a83a2a') }));
  K.add('solid', B.part(new THREE.CylinderGeometry(16, 16, 16, 3, 1), { x: -112, y: 6, rz: Math.PI / 2, ry: 0, sz: 1, sx: 1, color: B.c('#262a36') }));
  const cols = ['#c8402e', '#2a6ab8', '#e8a020', '#3a8a4a', '#8a3a7a', '#d8d4cc', '#2a8aa0'];
  for (let bay = 0; bay < 12; bay++) for (let row = -2; row <= 2; row++) {
    const tiers = 2 + Math.floor(B.rng() * 4);
    for (let tr = 0; tr < tiers; tr++) K.add('solid', B.box(12.6, 2.6, 5.2, { x: -88 + bay * 14, y: 15.3 + tr * 2.7, z: row * 5.6, color: B.c(cols[Math.floor(B.rng() * cols.length)]) }));
  }
  K.add('solid', B.box(16, 26, 30, { x: 92, y: 27, color: B.c('#eef0f2') }), B.box(18, 2, 34, { x: 92, y: 40, color: B.c('#eef0f2') }), B.box(6, 10, 6, { x: 102, y: 37, color: B.c('#c8302a') }));
  if (B.night) {
    for (let k = 0; k < 5; k++) K.add('glow', B.box(16.2, 0.8, 30.2, { x: 92, y: 18 + k * 4.2, color: '#ffe0a0' }));
    K.add('glow', B.box(2, 2, 2, { x: 92, y: 44, color: '#ffffff' }), B.box(1.6, 1.6, 1.6, { x: -108, y: 16, color: '#3dff7a' }));
  } else K.add('solid', B.box(16.2, 1.2, 30.2, { x: 92, y: 36, color: B.c('#3a4a5a') }));
  return B.mesh(K);
}

// A sister floating plant: a deck on giant columns, tanks, an intake tower, a crane, lit at night.
function plant(o, th, B) {
  const K = new B.Kit(), grey = B.c('#8a929e'), dark = B.c('#4a5260');
  for (const [x, z] of [[-70, -45], [70, -45], [-70, 45], [70, 45], [0, -45], [0, 45]]) K.add('solid', B.cyl(7, 8, 16, 8, { x, y: 7, z, color: dark }));
  K.add('solid', B.box(180, 8, 120, { y: 18, color: grey }), B.box(181, 2, 121, { y: 14.5, color: B.c('#b8582e') }));
  for (let i = 0; i < 6; i++) { const r = 9 + B.rng() * 5, h = 14 + B.rng() * 14, x = -60 + i * 22, z = (i % 2 ? -1 : 1) * 25; K.add('solid', B.cyl(r, r, h, 10, { x, y: 22 + h / 2, z, color: B.c(i % 3 === 1 ? '#b8582e' : '#e4e8ec') })); }
  K.add('solid', B.box(60, 14, 30, { x: 40, y: 29, z: 30, color: B.c('#dadfe4') }));
  for (let k = 0; k < 12; k++) K.add('solid', B.cyl(9, 9, 6, 12, { x: -50, y: 25 + k * 6, z: 40, color: B.c(k % 2 ? '#d8343c' : '#eef0f2') }));
  K.add('solid', B.box(3, 60, 3, { x: 70, y: 52, z: -30, color: B.c('#f2a81a') }), B.box(70, 3, 3, { x: 45, y: 82, z: -30, color: B.c('#f2a81a') }));
  if (B.night) {
    for (let k = 0; k < 14; k++) K.add('glow', B.box(3, 3, 3, { x: -85 + k * 13, y: 23, z: -60.5, color: '#ffd890' }));
    K.add('glow', B.ball(4, { x: -50, y: 101, z: 40, color: '#fff4c0' }), B.box(2, 2, 2, { x: 70, y: 84, z: -30, color: '#ff2a2a' }));
  }
  return B.mesh(K);
}

// The data haven's spire on the horizon: a tapering dark tower ringed with cyan light, a beacon on top.
function spire(o, th, B) {
  const K = new B.Kit();
  let y = 0;
  for (const [w, h] of [[60, 60], [44, 90], [32, 110], [22, 90], [12, 60]]) {
    K.add('solid', B.box(w, h, w, { y: y + h / 2, color: B.c('#1a2230', -0.1) }));
    for (let k = 1; k * 15 < h; k++) K.add('glow', B.box(w + 0.6, 1.4, w + 0.6, { y: y + k * 15, color: B.night ? '#2bd6ff' : B.c('#7ad8f0', -0.2) }));
    y += h;
  }
  K.add('solid', B.cyl(1, 2, 60, 6, { y: y + 30, color: B.c('#c8ccd2') }));
  K.add('glow', B.ball(4, { y: y + 62, color: B.night ? '#ff2a2a' : '#ffffff' }));
  return B.mesh(K);
}

// An offshore rig: four legs, two decks, a derrick, a helideck and a flare boom.
function rig(o, th, B) {
  const K = new B.Kit(), THREE = B.THREE, steel = B.c('#5a6272'), yel = B.c('#f2c21a');
  for (const [x, z] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) K.add('solid', B.cyl(4, 5, 40, 6, { x, y: 18, z, color: yel }));
  K.add('solid', B.box(80, 6, 80, { y: 40, color: steel }), B.box(70, 10, 60, { y: 48, color: B.c('#e4e8ec') }), B.box(50, 4, 50, { y: 56, color: steel }));
  K.add('solid', B.part(new THREE.CylinderGeometry(2, 9, 60, 4, 1), { x: 10, y: 88, ry: Math.PI / 4, color: B.c('#d8d8d0') }));
  K.add('solid', B.cyl(16, 16, 2, 10, { x: -38, y: 62, z: 20, color: B.c('#3a5a3a') }));
  K.add('solid', B.box(50, 2, 2, { x: 60, y: 62, z: -20, rz: 0.35, color: steel }));
  K.add('glow', B.ball(4, { x: 84, y: 71, z: -20, color: '#ff8a2a' }));
  if (B.night) for (let k = 0; k < 8; k++) K.add('glow', B.box(2, 2, 2, { x: -35 + k * 10, y: 54, z: 30.5, color: '#ffd890' }));
  return B.mesh(K);
}

export const BACKDROPS = { 'oc-windfarm': windfarm, 'oc-ship': ship, 'oc-plant': plant, 'oc-spire': spire, 'oc-rig': rig };
