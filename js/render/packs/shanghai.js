// Render side of pack SHANGHAI: themes, platform styles (./shanghai-styles.js), distant landmarks
// (the Pudong skyline: the Pearl tower, the twisting tower, the bottle opener, the tiered tower) and
// the JADE DRAGON's view (./shanghai-dragon.js).
import * as THREE from 'three';
import { SHANGHAI_STYLES } from './shanghai-styles.js';
import { DRAGON_VIEW } from './shanghai-dragon.js';

const themes = {
  shanghaiDusk: { // the Bund: a golden dusk, Pudong across the river catching the last light
    skyTop: '#3b2f6e', skyBot: '#ffb36b', sun: '#ffd48a', sunDir: [-0.8, 0.16, 0.25], night: 0.3,
    fog: [90, 420], hemi: ['#ffd8b0', '#5a4a6a', 1.5], key: ['#ffc080', 1.9],
    cloud: '#ffd0b0', cloudShade: '#d88a7a', city: 0.9, arc: [0, 1.2], cityCol: '#7a6a96', cityH: 1.5, pyramids: 0, windows: 0.45, neon: 0.8,
    water: '#3a5f8a', rain: 0, stars: 0.05, beams: 0.25, haze: 0.4,
  },
  shanghaiSmog: { // Lujiazui at noon: bright, hazy, beige smog on the horizon
    skyTop: '#8fa8c4', skyBot: '#e6d9c2', sun: '#fff2d0', sunDir: [0.35, 0.7, -0.4], night: 0,
    fog: [60, 280], hemi: ['#f4eee4', '#7a7a80', 1.6], key: ['#fff0dc', 2.0],
    cloud: '#f2ece2', cloudShade: '#d4ccc0', city: 1, arc: [0, 4], cityCol: '#a8a6a8', cityH: 1.6, pyramids: 0, windows: 0, neon: 0.5,
    water: null, rain: 0, stars: 0, beams: 0, cover: 0.35, haze: 0.55,
  },
  shanghaiLantern: { // the old town at night: red lanterns, neon, Pudong lit up to the north-east
    skyTop: '#090620', skyBot: '#4a1a3a', sun: '#ffe0d0', sunDir: [0.3, 0.55, -0.75], night: 1,
    fog: [45, 240], hemi: ['#a0607a', '#1a0f20', 1.3], key: ['#ffb090', 0.8],
    cloud: '#4a2a44', cloudShade: '#2a1a30', city: 0.9, arc: [-1.2, 1.4], cityCol: '#1e1028', cityH: 1.4, pyramids: 0, windows: 1, neon: 1.3,
    water: '#1c1a34', rain: 0, stars: 0.4, beams: 0.6, haze: 0.3,
  },
  shanghaiPearl: { // high on the Pearl tower above a sea of neon smog
    skyTop: '#140a34', skyBot: '#8a2a6a', sun: '#ffd0e8', sunDir: [0.5, 0.35, 0.6], night: 0.85,
    fog: [60, 320], hemi: ['#c088c0', '#2a1430', 1.4], key: ['#ffc0d8', 1.0],
    cloud: '#6a3a6a', cloudShade: '#3a1a40', city: 1, arc: [0, 4], cityCol: '#2a1838', cityH: 1.2, pyramids: 0, windows: 1, neon: 1.2,
    water: null, rain: 0, stars: 0.3, beams: 1, cloudSea: '#7a4a8a', haze: 0.35,
  },
};

// ------------------------------------------------------------------ distant landmarks
const PINK = '#ff4a9a', SILVER = '#c8c8d4';
function pearlTower(o, th, B) {
  const K = new B.Kit(), lit = B.night > 0.2;
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2;
    K.add('solid', B.part(new THREE.CylinderGeometry(3, 4, 95, 6), { x: Math.cos(a) * 24, y: 40, z: Math.sin(a) * 24, rz: Math.cos(a) * 0.5, rx: -Math.sin(a) * 0.5, color: B.c(SILVER) }));
    K.add('solid', B.cyl(3.2, 3.2, 210, 8, { x: Math.cos(a + 1) * 6, y: 105, z: Math.sin(a + 1) * 6, color: B.c(SILVER) }));
  }
  const sphere = (y, r, col) => { K.add('solid', B.ball(r, { y, color: B.c(col) }, 1)); if (lit) K.add('glow', B.part(new THREE.TorusGeometry(r * 1.01, r * 0.06, 3, 16), { y, rx: Math.PI / 2, color: '#ffb0e0' })); };
  sphere(70, 19, PINK);
  for (const y of [105, 120, 135, 150]) sphere(y, 5, PINK);
  sphere(178, 14, PINK); sphere(214, 5.5, PINK);
  K.add('solid', B.cyl(0.8, 2.5, 60, 6, { y: 248, color: B.c(SILVER) }));
  K.add('glow', B.box(2, 2, 2, { y: 279, color: '#ff2a2a' }));
  return B.mesh(K);
}
function pearlUpper(o, th, B) { // over the boss arena: the columns go on up to the upper sphere and the spire
  const K = new B.Kit();
  for (const a of [90, 210, 330]) { const r = a * Math.PI / 180; K.add('solid', B.cyl(1.3, 1.3, 40, 8, { x: Math.cos(r) * 2.6, y: 20, z: Math.sin(r) * 2.6, color: B.c(SILVER) })); }
  for (const y of [6, 14, 22]) K.add('solid', B.ball(3.2, { y, color: B.c(PINK) }, 1));
  K.add('solid', B.ball(11, { y: 46, color: B.c(PINK) }, 1));
  K.add('glow', B.part(new THREE.TorusGeometry(11.1, 0.5, 3, 24), { y: 46, rx: Math.PI / 2, color: '#ffb0e0' }));
  K.add('solid', B.ball(4, { y: 64, color: B.c(PINK) }, 1), B.cyl(0.4, 1.4, 40, 6, { y: 88, color: B.c(SILVER) }));
  K.add('glow', B.box(1, 1, 1, { y: 108, color: '#ff2a2a' }));
  return B.mesh(K);
}
function pearlLegs(o, th, B) { // under the deck: the sphere's tripod legs and columns, down into the smog
  const K = new B.Kit();
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + 0.5;
    K.add('solid', B.part(new THREE.CylinderGeometry(2.4, 3, 90, 6), { x: Math.cos(a) * 26, y: -40, z: Math.sin(a) * 26, rz: Math.cos(a) * 0.55, rx: -Math.sin(a) * 0.55, color: B.c(SILVER) }));
    K.add('solid', B.cyl(1.3, 1.3, 80, 8, { x: Math.cos(a + 1.57) * 2.6, y: -40, z: Math.sin(a + 1.57) * 2.6, color: B.c(SILVER) }));
  }
  return B.mesh(K);
}
function twistTower(o, th, B) {
  const K = new B.Kit(), n = 26;
  for (let i = 0; i < n; i++) {
    const t = i / n, r = 34 * (1 - t * 0.42);
    K.add('solid', B.part(new THREE.CylinderGeometry(r, r, 13.5, 3), { y: i * 13 + 6.5, ry: t * 2.2, color: B.c(i % 2 ? '#8cbcc0' : '#7aaeb4') }));
    if (B.night > 0.2 && i % 3 === 0) K.add('glow', B.part(new THREE.CylinderGeometry(r + 0.3, r + 0.3, 0.8, 3), { y: i * 13, ry: t * 2.2, color: '#7ff6ff' }));
  }
  for (let k = 0; k < 6; k++) K.add('solid', B.box(2, 30, 2, { x: Math.cos(k) * 17, y: n * 13 + 12, z: Math.sin(k) * 17, color: B.c('#d8ecec') }));
  return B.mesh(K);
}
function bottleOpener(o, th, B) {
  const K = new B.Kit(), col = B.c('#a8b8c8');
  K.add('solid', B.box(52, 280, 22, { y: 140, color: col }));
  K.add('solid', B.box(9, 60, 20, { x: -21.5, y: 310, color: col }), B.box(9, 60, 20, { x: 21.5, y: 310, color: col }), B.box(52, 12, 20, { y: 346, color: col }));
  K.add('solid', B.box(10, 10, 20, { x: -12, y: 285, rz: 0.7, color: col }), B.box(10, 10, 20, { x: 12, y: 285, rz: -0.7, color: col })); // the hole's sloped sides
  if (B.night > 0.2) for (let y = 30; y < 280; y += 30) K.add('glow', B.box(52.4, 1, 22.4, { y, color: '#9fd8ff' }));
  return B.mesh(K);
}
function jinmaoTower(o, th, B) {
  const K = new B.Kit();
  let y = 0, w = 40;
  for (let i = 0; i < 16; i++) {
    const h = 34 - i * 1.4;
    K.add('solid', B.box(w, h, w, { y: y + h / 2, color: B.c('#8a8f9a') }), B.box(w + 3, 1.6, w + 3, { y: y + h, color: B.c('#b8a06a') }));
    if (B.night > 0.2) K.add('glow', B.box(w + 0.4, 0.8, w + 0.4, { y: y + h * 0.5, color: '#ffd890' }));
    y += h; w *= 0.93;
  }
  K.add('solid', B.cyl(0.5, 3, 50, 6, { y: y + 25, color: B.c(SILVER) }));
  return B.mesh(K);
}
function bundRow(o, th, B) { // the colonial waterfront, seen from across the river
  const K = new B.Kit(), stone = ['#d9c7a3', '#cbb894', '#e2d4b6', '#bfa982'];
  for (let i = 0; i < 10; i++) {
    const x = (i - 4.5) * 30, h = 30 + B.rng() * 30, w = 24 + B.rng() * 4;
    K.add('solid', B.box(w, h, 24, { x, y: h / 2, color: B.c(stone[i % 4]) }));
    if (i === 3) K.add('solid', B.ball(10, { x, y: h, color: B.c('#5fae96') }, 1));
    if (i === 6) K.add('solid', B.box(10, 30, 10, { x, y: h + 15, color: B.c(stone[0]) }), B.cyl(0.5, 7, 10, 4, { x, y: h + 35, ry: Math.PI / 4, color: B.c('#5fae96') }));
    if (B.night > 0.2) for (let k = 0; k < 4; k++) K.add('glow', B.box(w * 0.8, 1.2, 0.4, { x, y: 8 + k * (h - 10) / 4, z: 12.2, color: '#ffd28a' }));
  }
  return B.mesh(K);
}
function pudongBank(o, th, B) { // the far bank: a low promenade, trees and lamps
  const K = new B.Kit(), len = o.len ?? 800;
  K.add('solid', B.box(30, 4, len, { y: 2, color: B.c('#6a6070') }));
  for (let z = -len / 2; z < len / 2; z += 18) { K.add('solid', B.ball(4, { y: 7, z, color: B.c('#3a5a3a') }, 0)); K.add('glow', B.box(1, 1, 1, { x: -14, y: 5, z: z + 9, color: '#fff0c8' })); }
  return B.mesh(K);
}

export default {
  themes,
  styles: SHANGHAI_STYLES,
  backdrops: { pearlTower, pearlUpper, pearlLegs, twistTower, bottleOpener, jinmaoTower, bundRow, pudongBank },
  bosses: { dragon: DRAGON_VIEW },
};
