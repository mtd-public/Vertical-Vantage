// Render side of pack SHANGHAI: themes, platform styles (./shanghai-styles.js), distant landmarks
// (the Pudong skyline: the Pearl tower, the twisting tower, the bottle opener, the tiered tower) and
// the JADE DRAGON's view (./shanghai-dragon.js).
import * as THREE from 'three';
import { SHANGHAI_STYLES } from './shanghai-styles.js';
import { DRAGON_VIEW } from './shanghai-dragon.js';

const themes = {
  // THE BUND by night: the colonial row floodlit gold (the key light comes in low off the river),
  // Pudong's LED skyline across the water to the east, searchlights, the river full of lit boats.
  shanghaiBund: {
    skyTop: '#05061f', skyBot: '#3c1d5c', sun: '#fff2dc', sunDir: [0.85, 0.32, 0.25], night: 1,
    fog: [90, 400], hemi: ['#7c76d4', '#3a2030', 1.45], key: ['#ffb868', 1.25],
    cloud: '#3a2a5c', cloudShade: '#1c1434', city: 1, arc: [0, 1.25], cityCol: '#120e2c', cityH: 1.7, pyramids: 0, windows: 1, neon: 1.35,
    water: '#121a40', rain: 0, stars: 0.45, beams: 1, haze: 0.28,
  },
  // PUDONG HEIGHTS at 2 a.m.: LED-wrapped supertalls in a magenta smog, rain sheeting through
  shanghaiNeon: {
    skyTop: '#090520', skyBot: '#4a1f62', sun: '#efe6ff', sunDir: [0.35, 0.55, -0.6], night: 1,
    fog: [60, 300], hemi: ['#8070d0', '#2a0e30', 1.5], key: ['#a4bcff', 0.9],
    cloud: '#4a2a6a', cloudShade: '#22123a', city: 1, arc: [0, 4], cityCol: '#150c2a', cityH: 1.9, pyramids: 0, windows: 1, neon: 1.4,
    water: null, rain: 1, stars: 0.15, beams: 1, cover: 0.3, haze: 0.36,
  },
  // LANTERN NIGHT: the old town's red lanterns and neon, Pudong lit up to the north-east
  shanghaiLantern: {
    skyTop: '#0a0420', skyBot: '#5a1a40', sun: '#ffe6d6', sunDir: [0.3, 0.55, -0.75], night: 1,
    fog: [50, 260], hemi: ['#c27a9c', '#2a1020', 1.5], key: ['#ffb490', 0.95],
    cloud: '#4a2446', cloudShade: '#261430', city: 0.95, arc: [-1.2, 1.4], cityCol: '#180c24', cityH: 1.5, pyramids: 0, windows: 1, neon: 1.4,
    water: '#1a1034', rain: 0, stars: 0.5, beams: 0.8, haze: 0.28,
  },
  // PEARL TOWER at half past midnight, above a sea of hot-pink neon smog
  shanghaiPearl: {
    skyTop: '#0e0530', skyBot: '#9a2a7c', sun: '#ffe0f0', sunDir: [0.5, 0.4, 0.6], night: 1,
    fog: [70, 340], hemi: ['#d092d8', '#2c1034', 1.55], key: ['#ffc4e2', 1.0],
    cloud: '#6a3070', cloudShade: '#341640', city: 1, arc: [0, 4], cityCol: '#1c0e2c', cityH: 1.3, pyramids: 0, windows: 1, neon: 1.4,
    water: null, rain: 0, stars: 0.5, beams: 1, cloudSea: '#8a3a92', haze: 0.32,
  },
  // the pack's SERVER CORE bonus arenas: power skies over a night of gold, cyan and lantern red
  shanghaiBonusGold: {
    skyTop: '#0a0626', skyBot: '#5a2a5a', sun: '#ffe0b0', sunDir: [0.6, 0.3, -0.6], night: 1, power: 1,
    fog: [60, 270], hemi: ['#b08ad0', '#2a1428', 1.45], key: ['#ffc080', 1.0],
    cloud: '#5a3a6a', cloudShade: '#2a1a3a', city: 0, arc: [0, 4], cityCol: '#1a1026', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
  shanghaiBonusCyan: {
    skyTop: '#050a26', skyBot: '#1e2c6a', sun: '#e0f0ff', sunDir: [-0.4, 0.5, -0.6], night: 1, power: 1,
    fog: [60, 270], hemi: ['#7a9ae0', '#141a30', 1.45], key: ['#a8d0ff', 1.0],
    cloud: '#2a3a6a', cloudShade: '#141c3a', city: 0, arc: [0, 4], cityCol: '#101626', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
  shanghaiBonusRed: {
    skyTop: '#140418', skyBot: '#6a1a34', sun: '#ffd8c8', sunDir: [0.3, 0.5, -0.7], night: 1, power: 1,
    fog: [60, 270], hemi: ['#d08098', '#2a0e1a', 1.45], key: ['#ffb0a0', 1.0],
    cloud: '#5a2440', cloudShade: '#2c1024', city: 0, arc: [0, 4], cityCol: '#1e0c1a', windows: 1, neon: 1.35,
    water: null, rain: 0, stars: 0.6, beams: 0,
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
