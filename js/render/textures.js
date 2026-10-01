// Procedural textures: tiny canvases, point-sampled (retro). No image files.
import * as THREE from 'three';
import { retroTex } from './retro.js';
import { mulberry32 } from '../sim/util.js';

export function canvasTex(w, h, paint, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = retroTex(new THREE.CanvasTexture(c));
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Facade: 128 × 128 px = 16 m × 16 m (8 px/m). Floors 4 m, window bays 2 m.
// map = the daytime look (glass + panels); emissive = which windows are lit at night.
export const FACADE_M = 16;
export function facadeTextures(seed = 1) {
  const rng = mulberry32(seed);
  const lit = [];
  for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 8; bx++) lit.push(rng());
  const tint = [];
  for (let k = 0; k < 32; k++) tint.push(rng());
  const map = canvasTex(128, 128, (g) => {
    g.fillStyle = '#9aa0ab'; g.fillRect(0, 0, 128, 128);
    for (let fy = 0; fy < 4; fy++) {
      const y = fy * 32;
      g.fillStyle = '#7b818e'; g.fillRect(0, y + 26, 128, 6); // floor slab band
      for (let bx = 0; bx < 8; bx++) {
        const x = bx * 16;
        // glass: sky-reflective blue gradient, a few with blinds
        const grd = g.createLinearGradient(0, y + 3, 0, y + 25);
        grd.addColorStop(0, '#cfe6ff'); grd.addColorStop(1, '#46658f');
        g.fillStyle = grd; g.fillRect(x + 2, y + 3, 12, 22);
        if (tint[fy * 8 + bx] < 0.25) { g.fillStyle = 'rgba(230,220,190,0.8)'; g.fillRect(x + 2, y + 3, 12, 9); }
        g.fillStyle = '#5b6170'; g.fillRect(x + 7, y + 3, 2, 22); // mullion
      }
    }
  });
  const emissive = canvasTex(128, 128, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128);
    const cols = ['#ffd38a', '#ffe9b8', '#8ff0ff', '#ff9ad8', '#b7a6ff'];
    for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 8; bx++) {
      const r = lit[fy * 8 + bx];
      if (r < 0.42) continue;
      g.fillStyle = cols[Math.floor(tint[fy * 8 + bx] * cols.length)];
      g.fillRect(bx * 16 + 2, fy * 32 + 3, 12, 22);
      if (r > 0.9) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(bx * 16 + 4, fy * 32 + 14, 4, 11); } // a silhouette at the window
    }
  });
  return { map, emissive };
}

// Pseudo-kanji: random stroke glyphs on a 5×5 lattice. Reads as "Japanese signage" at 240p
// without needing a CJK font on the player's device.
export function glyph(g, x, y, s, rng) {
  const P = (i) => (i / 4) * s;
  const n = 3 + Math.floor(rng() * 4);
  g.beginPath();
  for (let k = 0; k < n; k++) {
    const t = rng();
    if (t < 0.4) { const yy = P(Math.floor(rng() * 5)), x0 = P(Math.floor(rng() * 2)), x1 = P(3 + Math.floor(rng() * 2)); g.moveTo(x + x0, y + yy); g.lineTo(x + x1, y + yy); }
    else if (t < 0.75) { const xx = P(Math.floor(rng() * 5)), y0 = P(Math.floor(rng() * 2)), y1 = P(3 + Math.floor(rng() * 2)); g.moveTo(x + xx, y + y0); g.lineTo(x + xx, y + y1); }
    else if (t < 0.9) { g.moveTo(x + P(1), y + P(1)); g.lineTo(x + P(4), y + P(4)); }
    else { g.moveTo(x + P(3), y + P(0)); g.lineTo(x + P(0), y + P(3)); }
  }
  g.stroke();
}

// Vertical neon signs: 16 signs of 32 × 128 px in one 512 × 128 atlas.
export const SIGN_COLS = 16;
export function signAtlas(seed = 7) {
  const rng = mulberry32(seed);
  const neon = ['#ff2bd6', '#2be8ff', '#ffe52b', '#ff5a2b', '#7bff4a', '#b45bff', '#ffffff', '#ff3b5c'];
  return canvasTex(512, 128, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 512, 128);
    for (let i = 0; i < SIGN_COLS; i++) {
      const x = i * 32, col = neon[i % neon.length];
      g.fillStyle = i % 3 === 0 ? '#1a0b1e' : '#0b0d18'; g.fillRect(x + 1, 1, 30, 126);
      g.strokeStyle = col; g.lineWidth = 2; g.strokeRect(x + 3, 3, 26, 122);
      g.lineWidth = 2.5; g.lineCap = 'square';
      for (let k = 0; k < 4; k++) glyph(g, x + 8, 10 + k * 29, 16, rng);
    }
  }, false);
}

export function containerTex() {
  return canvasTex(32, 64, (g) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 64);
    for (let x = 0; x < 32; x += 4) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 2, 64); } // corrugation
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, 0, 32, 2); g.fillRect(0, 62, 32, 2);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(4, 8, 10, 2); g.fillRect(4, 11, 7, 1); // stencil lettering
    g.fillStyle = 'rgba(80,40,20,0.25)'; g.fillRect(0, 50, 32, 14); // rust at the base
  });
}

export function concreteTex(seed = 3) {
  const rng = mulberry32(seed);
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#b8b4ac'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 260; i++) { const v = 150 + Math.floor(rng() * 70); g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(Math.floor(rng() * 64), Math.floor(rng() * 64), 2, 2); }
    g.fillStyle = '#8e8a82'; g.fillRect(0, 31, 64, 2); g.fillRect(31, 0, 2, 64); // slab joints
  });
}

export function hazardTex() {
  return canvasTex(32, 8, (g) => {
    g.fillStyle = '#ffcc1a'; g.fillRect(0, 0, 32, 8);
    g.fillStyle = '#1a1a1a';
    for (let x = -8; x < 40; x += 8) { g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 4, 8); g.lineTo(x + 8, 0); g.lineTo(x + 4, 0); g.fill(); }
  });
}

export function deckTex() { // metal deck plate with a grid of rivets / tread
  return canvasTex(32, 32, (g) => {
    g.fillStyle = '#8a92a0'; g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#6c7482';
    for (let y = 2; y < 32; y += 8) for (let x = 2 + ((y / 8) % 2) * 4; x < 32; x += 8) { g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y - 1, 1, 3); }
    g.fillStyle = '#5a6170'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32);
  });
}

// A sea of cloud seen from above (the air fortress): soft white puffs on a pale blue-grey.
export function cloudSeaTex() {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#c8d4e4'; g.fillRect(0, 0, 128, 128);
    const rng = mulberry32(11);
    for (let i = 0; i < 70; i++) {
      const x = rng() * 128, y = rng() * 128, r = 6 + rng() * 16, sh = rng();
      for (const [dx, dy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) {
        g.fillStyle = sh < 0.3 ? '#aebcd0' : sh < 0.75 ? '#e8eef6' : '#ffffff';
        g.beginPath(); g.arc(x + dx, y + dy, r, 0, Math.PI * 2); g.fill();
      }
    }
  });
}

export function waterTex() {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#2a7fb8'; g.fillRect(0, 0, 64, 64);
    const rng = mulberry32(5);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rng() * 64), y = Math.floor(rng() * 64), l = 4 + Math.floor(rng() * 10);
      g.fillStyle = rng() < 0.5 ? '#5fb3e6' : '#9fd8ff';
      g.fillRect(x, y, l, 1);
      if (x + l > 64) g.fillRect(x - 64, y, l, 1);
    }
  });
}

export function helipadTex() {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#3a3f4a'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#ffd23a'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 27, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(20, 18, 6, 28); g.fillRect(38, 18, 6, 28); g.fillRect(20, 29, 24, 6);
  }, false);
}

export function serverTex() { // rack front: rows of drive bays and LEDs (map + emissive in one: LEDs bright)
  const rng = mulberry32(11);
  return canvasTex(32, 64, (g) => {
    g.fillStyle = '#15171f'; g.fillRect(0, 0, 32, 64);
    for (let y = 3; y < 62; y += 6) {
      g.fillStyle = '#2a2e3c'; g.fillRect(2, y, 28, 4);
      for (let x = 4; x < 28; x += 4) { const r = rng(); g.fillStyle = r < 0.45 ? '#2bff7a' : r < 0.6 ? '#ffb02b' : r < 0.7 ? '#2be8ff' : '#0d2a1a'; g.fillRect(x, y + 1, 2, 2); }
    }
  }, false);
}

export function driveLabelTex() { // the hard drive's top: label + platter window
  return canvasTex(32, 48, (g) => {
    g.fillStyle = '#b9c0cc'; g.fillRect(0, 0, 32, 48);
    g.fillStyle = '#ffd23a'; g.fillRect(3, 3, 26, 16);
    g.fillStyle = '#1a1a22'; g.font = 'bold 7px monospace'; g.fillText('SECTION', 4, 10); g.fillText('9 DATA', 5, 17);
    g.fillStyle = '#7d8696'; g.beginPath(); g.arc(16, 32, 11, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8dee8'; g.beginPath(); g.arc(16, 32, 3, 0, Math.PI * 2); g.fill();
  }, false);
}

// Soft round glow for billboards and halos (fades to the same colour at alpha 0: no dark halo, doc 14 #19).
export function glowTex() {
  return canvasTex(32, 32, (g) => {
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  }, false);
}

export function ringTex() { // landing marker
  return canvasTex(32, 32, (g) => {
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(16, 16, 12, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(15, 2, 2, 6); g.fillRect(15, 24, 2, 6); g.fillRect(2, 15, 6, 2); g.fillRect(24, 15, 6, 2);
  }, false);
}
