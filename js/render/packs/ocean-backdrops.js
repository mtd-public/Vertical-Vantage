// OCEAN CORE backdrops: distant landmarks on the open sea (render only, hazed toward the horizon).
// (o, th, B, M) → Object3D in metres, sea level at y = 0. B: { THREE, Kit, box, cyl, ball, part, seg,
// c (hazed colour), mesh(kit), rng, night }. 'solid' is lit, 'glow' is unlit (lights at night).
// Placed with yaw = away(...) their local -z faces the level: the light they throw on the sea runs
// that way, toward you, in broken streaks.
import * as THREE from 'three';
import { Kit, atlasQuad } from '../geo.js';
import { adUV } from '../ads.js';

const _c = new THREE.Color();
const dk = (hex, k) => _c.set(hex).multiplyScalar(k).getHex();
// Light on the sea: broken streaks from (x, z) running toward local -z for L metres, w wide.
function streaks(K, B, x, z, w, L, color, k0 = 0.55, n = 7) {
  for (let i = 0; i < n; i++) {
    const t = i / n, k = k0 * (1 - t * 0.8), len = 1.5 + B.rng() * (L / n) * 0.7;
    K.add('glow', B.box(w * (0.35 + B.rng() * 0.65) * (1 - t * 0.5), 0.2, len, { x: x + (B.rng() - 0.5) * w * 0.5, y: 0.25, z: z - 2 - t * L - B.rng() * (L / n) * 0.4, color: dk(color, k) }));
  }
}
// An advert screen (the haven's own fog-free copy of the ad atlas material).
function adMesh(M, quads) {
  if (!M || !M.ads || !quads.length) return null;
  const mat = M.ads.clone(); mat.fog = false; mat.userData.own = true;
  const K = new Kit();
  for (const q of quads) K.add('a', q);
  return new THREE.Mesh(K.build().a, mat);
}

// An offshore wind farm: o.n turbines in two staggered rows along x, blades locked at seeded angles,
// red aviation lights on every nacelle and halfway up, the transition pieces lit yellow.
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
    if (B.night) {
      K.add('glow', B.box(3, 3, 3, { x, y: h + 5.5, z: z + 3, color: '#ff2a2a' }), B.box(2.2, 2.2, 2.2, { x, y: h * 0.5, z, color: '#ff2a2a' }));
      K.add('glow', B.cyl(4.7, 4.7, 1.2, 6, { x, y: 6.4, z, color: dk('#ffb02b', 0.8) }));
      streaks(K, B, x, z, 7, 70, '#ffb02b', 0.4, 5);
    }
  }
  return B.mesh(K);
}

// A container ship steaming past: dark hull with a red boot, stacked boxes, the white bridge aft;
// at night deck floods over the stacks, lit bridge decks, nav and mast lights.
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
    for (let bay = 0; bay < 12; bay += 2) K.add('glow', B.box(1.2, 1.2, 1.2, { x: -88 + bay * 14, y: 30, z: 0, color: '#fff4d8' }), B.cyl(0.3, 0.3, 14, 4, { x: -88 + bay * 14, y: 22, z: 0, color: '#3a3a40' }));
    for (let x = -100; x < 84; x += 9) K.add('glow', B.box(2, 0.6, 0.4, { x, y: 12, z: 16.3, color: dk('#ffd890', 0.85) }), B.box(2, 0.6, 0.4, { x, y: 12, z: -16.3, color: dk('#ffd890', 0.85) }));
    K.add('glow', B.box(2, 2, 2, { x: 92, y: 44, color: '#ffffff' }), B.box(1.6, 1.6, 1.6, { x: -108, y: 16, color: '#3dff7a' }), B.box(1.6, 1.6, 1.6, { x: 102, y: 43, color: '#ff2a2a' }));
    K.add('glow', B.cyl(0.4, 0.4, 20, 4, { x: 80, y: 50, color: '#3a3a40' }), B.box(1.4, 1.4, 1.4, { x: 80, y: 60.5, color: '#ff2a2a' }));
    streaks(K, B, 92, 0, 16, 90, '#ffe0a0', 0.5, 6);
    streaks(K, B, -10, 0, 120, 60, '#ffd890', 0.25, 5);
  } else K.add('solid', B.box(16.2, 1.2, 30.2, { x: 92, y: 36, color: B.c('#3a4a5a') }));
  return B.mesh(K);
}

// A sister floating plant: a deck on giant columns, tanks, an intake tower, a crane; at night its
// deck edge in cyan LEDs, the tanks floodlit with neon bands, the tower's lamp, red beacons.
function plant(o, th, B) {
  const K = new B.Kit(), grey = B.c('#8a929e'), dark = B.c('#4a5260');
  for (const [x, z] of [[-70, -45], [70, -45], [-70, 45], [70, 45], [0, -45], [0, 45]]) K.add('solid', B.cyl(7, 8, 16, 8, { x, y: 7, z, color: dark }));
  K.add('solid', B.box(180, 8, 120, { y: 18, color: grey }), B.box(181, 2, 121, { y: 14.5, color: B.c('#b8582e') }));
  for (let i = 0; i < 6; i++) {
    const r = 9 + B.rng() * 5, h = 14 + B.rng() * 14, x = -60 + i * 22, z = (i % 2 ? -1 : 1) * 25;
    K.add('solid', B.cyl(r, r, h, 10, { x, y: 22 + h / 2, z, color: B.c(i % 3 === 1 ? '#b8582e' : '#e4e8ec') }));
    if (B.night) K.add('glow', B.cyl(r + 0.4, r + 0.4, 1.2, 10, { x, y: 22 + h - 2, z, color: i % 2 ? '#2be8ff' : '#2bffd0' }));
  }
  K.add('solid', B.box(60, 14, 30, { x: 40, y: 29, z: 30, color: B.c('#dadfe4') }));
  for (let k = 0; k < 12; k++) K.add('solid', B.cyl(9, 9, 6, 12, { x: -50, y: 25 + k * 6, z: 40, color: B.c(k % 2 ? '#d8343c' : '#eef0f2') }));
  K.add('solid', B.box(3, 60, 3, { x: 70, y: 52, z: -30, color: B.c('#f2a81a') }), B.box(70, 3, 3, { x: 45, y: 82, z: -30, color: B.c('#f2a81a') }));
  if (B.night) {
    for (let k = 0; k < 14; k++) K.add('glow', B.box(3, 3, 3, { x: -85 + k * 13, y: 23, z: -60.5, color: '#ffd890' }));
    K.add('glow', B.box(182, 0.8, 0.6, { y: 21.5, z: -60.6, color: '#2be8ff' }), B.box(182, 0.8, 0.6, { y: 21.5, z: 60.6, color: '#2be8ff' }));
    K.add('glow', B.box(60.4, 1.2, 0.5, { x: 40, y: 31, z: 14.8, color: dk('#d8f4ff', 0.8) }), B.box(60.4, 1.2, 0.5, { x: 40, y: 27, z: 14.8, color: dk('#d8f4ff', 0.7) }));
    K.add('glow', B.ball(4, { x: -50, y: 101, z: 40, color: '#fff4c0' }), B.box(2, 2, 2, { x: 70, y: 84, z: -30, color: '#ff2a2a' }), B.box(2, 2, 2, { x: 10, y: 84, z: -30, color: '#ff2a2a' }));
    streaks(K, B, 0, -60, 150, 90, '#2be8ff', 0.4, 7);
  }
  return B.mesh(K);
}

// The data haven's spire on the horizon: a tapering dark tower ringed with cyan light, magenta crown
// bands, a halo ring round its top, a beacon; at night its light pools on the sea.
function spire(o, th, B) {
  const K = new B.Kit();
  let y = 0;
  for (const [w, h] of [[60, 60], [44, 90], [32, 110], [22, 90], [12, 60]]) {
    K.add('solid', B.box(w, h, w, { y: y + h / 2, color: B.c('#1a2230', -0.1) }));
    for (let k = 1; k * 15 < h; k++) K.add('glow', B.box(w + 0.6, 1.4, w + 0.6, { y: y + k * 15, color: B.night ? (k % 3 === 0 ? '#ff2bd6' : '#2bd6ff') : B.c('#7ad8f0', -0.2) }));
    if (B.night) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) K.add('glow', B.box(0.8, h - 4, 0.8, { x: s * (w / 2 + 0.3), y: y + h / 2, z: (k - 1) * w * 0.3, color: dk('#3a7bff', 0.9) }));
    y += h;
  }
  K.add('solid', B.cyl(1, 2, 60, 6, { y: y + 30, color: B.c('#c8ccd2') }));
  K.add('glow', B.ball(4, { y: y + 62, color: B.night ? '#ff2a2a' : '#ffffff' }));
  if (B.night) {
    K.add('glow', B.part(new B.THREE.TorusGeometry(30, 0.9, 3, B.seg(32, 20)), { y: y - 30, rx: Math.PI / 2, color: '#2bd6ff' }), B.part(new B.THREE.TorusGeometry(22, 0.7, 3, B.seg(32, 20)), { y: y - 10, rx: Math.PI / 2, color: '#ff2bd6' }));
    streaks(K, B, 0, -30, 50, 160, '#2bd6ff', 0.45, 8);
  }
  return B.mesh(K);
}

// An offshore rig: four legs, two decks, a derrick, a helideck and a flare boom; at night its deck
// lights, a lit derrick, the flare burning and pooling on the sea.
function rig(o, th, B) {
  const K = new B.Kit(), THREE = B.THREE, steel = B.c('#5a6272'), yel = B.c('#f2c21a');
  for (const [x, z] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) K.add('solid', B.cyl(4, 5, 40, 6, { x, y: 18, z, color: yel }));
  K.add('solid', B.box(80, 6, 80, { y: 40, color: steel }), B.box(70, 10, 60, { y: 48, color: B.c('#e4e8ec') }), B.box(50, 4, 50, { y: 56, color: steel }));
  K.add('solid', B.part(new THREE.CylinderGeometry(2, 9, 60, 4, 1), { x: 10, y: 88, ry: Math.PI / 4, color: B.c('#d8d8d0') }));
  K.add('solid', B.cyl(16, 16, 2, 10, { x: -38, y: 62, z: 20, color: B.c('#3a5a3a') }));
  K.add('solid', B.box(50, 2, 2, { x: 60, y: 62, z: -20, rz: 0.35, color: steel }));
  K.add('glow', B.ball(4, { x: 84, y: 71, z: -20, color: '#ff8a2a' }), B.ball(2.4, { x: 84, y: 76, z: -20, color: '#ffd060' }));
  if (B.night) {
    for (let k = 0; k < 8; k++) K.add('glow', B.box(2, 2, 2, { x: -35 + k * 10, y: 54, z: 30.5, color: '#ffd890' }), B.box(2, 2, 2, { x: -35 + k * 10, y: 44, z: -30.5, color: '#ffd890' }));
    for (let k = 0; k < 6; k++) K.add('glow', B.box(1.4, 1.4, 1.4, { x: 10, y: 62 + k * 9, z: 4.5 - k * 0.6, color: k === 5 ? '#ff2a2a' : '#fff0c0' }));
    K.add('glow', B.part(new THREE.TorusGeometry(15, 0.5, 3, 16), { x: -38, y: 63.2, z: 20, rx: Math.PI / 2, color: '#3dff7a' }));
    streaks(K, B, 84, -20, 12, 90, '#ff8a2a', 0.55, 6);
    streaks(K, B, 0, -30, 60, 50, '#ffd890', 0.3, 4);
  }
  return B.mesh(K);
}

// The haven itself: a floating city on the horizon. A dark raft of server barges under a stand of
// towers, every floor a band of lit windows, neon crowns, antenna masts with red beacons, giant
// advert screens, and all of it smeared across the sea toward you (the sky's searchlights sweep
// from behind it).
// o.n towers across o.w metres.
function haven(o, th, B, M) {
  const K = new B.Kit(), n = o.n ?? 14, W = o.w ?? 420, D = 110, night = B.night;
  const NEONS = ['#2be8ff', '#ff2bd6', '#2bffd0', '#3a7bff', '#ffb02b'];
  K.add('solid', B.box(W + 40, 8, D, { y: 2, color: B.c('#141a26', -0.1) }));
  if (night) K.add('glow', B.box(W + 40.4, 0.8, 0.6, { y: 5.5, z: -D / 2 - 0.1, color: '#2be8ff' }), B.box(W + 40.4, 0.6, 0.6, { y: 1.8, z: -D / 2 - 0.1, color: dk('#ff2bd6', 0.8) }));
  const ads = [];
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1) - 0.5) * W + (B.rng() - 0.5) * 18, z = (B.rng() - 0.5) * (D - 40), w = 16 + B.rng() * 18, d = w * (0.7 + B.rng() * 0.5);
    const h = 40 + B.rng() * B.rng() * 170 + (Math.abs(x) < W * 0.18 ? 50 : 0), neon = NEONS[Math.floor(B.rng() * NEONS.length)];
    K.add('solid', B.box(w, h, d, { x, y: 6 + h / 2, z, color: B.c(['#1a2234', '#202838', '#16202c'][i % 3], -0.1) }));
    if (B.rng() < 0.5) K.add('solid', B.box(w * 0.6, h * 0.12, d * 0.6, { x, y: 6 + h + h * 0.06, z, color: B.c('#1a2234', -0.1) }));
    if (!night) continue;
    for (let y = 12; y < h - 4; y += 6) { // lit floors: window bands on the faces toward the sea (and the sides)
      if (B.rng() < 0.18) continue;
      const col = B.rng() < 0.7 ? dk('#ffd8a0', 0.75 + B.rng() * 0.25) : dk('#9ff0ff', 0.8);
      K.add('glow', B.box(w * (0.5 + B.rng() * 0.45), 1.6, 0.4, { x: x + (B.rng() - 0.5) * w * 0.2, y: 6 + y, z: z - d / 2 - 0.2, color: col }));
      if (B.rng() < 0.5) K.add('glow', B.box(0.4, 1.6, d * (0.4 + B.rng() * 0.4), { x: x + (B.rng() < 0.5 ? -1 : 1) * (w / 2 + 0.2), y: 6 + y, z, color: col }));
    }
    K.add('glow', B.box(w + 0.8, 1.4, d + 0.8, { x, y: 6 + h - 1.5, z, color: neon }));
    if (B.rng() < 0.5) K.add('glow', B.box(w + 0.8, 0.9, d + 0.8, { x, y: 6 + h * 0.55, z, color: dk(neon, 0.85) }));
    if (B.rng() < 0.4) for (const s of [-1, 1]) K.add('glow', B.box(0.9, h * 0.8, 0.9, { x: x + s * (w / 2 + 0.3), y: 6 + h * 0.45, z: z - d / 2 - 0.3, color: dk(neon, 0.8) }));
    if (B.rng() < 0.55) { const mh = 14 + B.rng() * 26; K.add('solid', B.cyl(0.5, 0.9, mh, 4, { x: x + w * 0.25, y: 6 + h + mh / 2, z, color: B.c('#9aa2ae') })); K.add('glow', B.box(1.8, 1.8, 1.8, { x: x + w * 0.25, y: 6 + h + mh + 1, z, color: '#ff2a2a' })); }
    if (h > 90 && ads.length < 4 && B.rng() < 0.7) { const aw = Math.min(w - 2, 22); ads.push(atlasQuad(aw, aw / 2, adUV(Math.floor(B.rng() * 64)), { x, y: 6 + h * 0.7, z: z - d / 2 - 0.8, ry: Math.PI })); K.add('glow', B.box(aw + 1, 0.8, 0.6, { x, y: 6 + h * 0.7 - aw / 4 - 0.6, z: z - d / 2 - 0.7, color: '#2be8ff' })); }
    streaks(K, B, x, -D / 2, w * 0.8, 150, B.rng() < 0.5 ? '#ffd8a0' : neon, 0.32, 6);
  }
  const g = B.mesh(K);
  const ad = night ? adMesh(M, ads) : null;
  if (ad) g.add(ad);
  return g;
}

export const BACKDROPS = { 'oc-windfarm': windfarm, 'oc-ship': ship, 'oc-plant': plant, 'oc-spire': spire, 'oc-rig': rig, 'oc-haven': haven };
