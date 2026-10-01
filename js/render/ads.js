// The city's adverts: satirical, original parody brands (in the spirit of The Simpsons' and
// Cyberpunk 2077's ad breaks; no real brands). Painted once into one canvas atlas so every
// billboard, ad deck and facade poster in a stage shares a single texture.
//
// Atlas: 1024×1024, 4 columns × 8 rows of 256×128 ads. adUV(i) gives the cell for ad i.
import * as THREE from 'three';
import { retroTex } from './retro.js';

export const ADS = [
  { brand: 'SYNTH-COLA', line: 'NOW WITH 40% LESS DREAD', jp: 'シンセ', bg: ['#d8202f', '#ff6a3d'], fg: '#fff6e8', icon: 'can' },
  { brand: 'BUDGET CLONES', line: 'WHY BE YOU WHEN YOU CAN BE TWO?', jp: 'クローン', bg: ['#2bb3c0', '#bff4ea'], fg: '#10283a', icon: 'twins' },
  { brand: 'NOODLE-BOT 9000', line: 'RAMEN SO GOOD IT’S ILLEGAL IN 3 SECTORS', jp: 'ラーメン', bg: ['#ffcc2e', '#ff8a1a'], fg: '#3a1500', icon: 'bowl' },
  { brand: 'OMNICORP INSURANCE', line: 'WE OWN YOUR THOUGHTS*   *TERMS APPLY', jp: '保険', bg: ['#0c1a3c', '#2c5ad8'], fg: '#e8f0ff', icon: 'eye' },
  { brand: 'FORGET-ME-NOW™', line: 'MEMORY WIPES · WALK-INS WELCOME', jp: '忘却', bg: ['#ff8fc8', '#ffe1f0'], fg: '#4a0f36', icon: 'brain' },
  { brand: 'AIR+ PREMIUM', line: 'BREATHE BETTER. MONTHLY PLAN.', jp: '空気', bg: ['#7fe0ff', '#e6fbff'], fg: '#09324a', icon: 'bubbles' },
  { brand: 'ROBO-LAWYER', line: 'SUE FIRST. THINK NEVER.', jp: '弁護士', bg: ['#1b1b22', '#55556a'], fg: '#ffd54a', icon: 'robot' },
  { brand: 'OVERTIME PILLS®', line: 'SLEEP IS FOR THE POOR', jp: '残業', bg: ['#6a1fd0', '#ff4fd8'], fg: '#fff2ff', icon: 'pill' },
  { brand: 'SPYTOAST PRO', line: 'YOUR TOASTER IS LISTENING. MAKE IT LISTEN BETTER.', jp: '監視', bg: ['#f4efe2', '#d9cdb0'], fg: '#2a2016', icon: 'toaster' },
  { brand: 'CHROME-U', line: 'WHY HAVE ARMS WHEN YOU CAN HAVE ARMS+?', jp: '義体', bg: ['#2a3140', '#9aa8c0'], fg: '#e9fbff', icon: 'arm' },
  { brand: 'KAWAII KILLBOT', line: 'NOW IN PLUSH! (MOSTLY DISARMED)', jp: 'かわいい', bg: ['#ffd0e6', '#a8f0ff'], fg: '#d01a6a', icon: 'cutebot' },
  { brand: 'MEGA-MART', line: 'EVERYTHING. FOREVER. ON CREDIT.', jp: '何でも', bg: ['#16a34a', '#b9f27c'], fg: '#062b12', icon: 'cart' },
  { brand: 'RE-ELECT MAYOR-BOT', line: 'HE’S NOT A ROBOT (HE IS)', jp: '市長', bg: ['#e8e8f0', '#c22d3a'], fg: '#14204a', icon: 'mayor' },
  { brand: 'DRONE DELIVERY', line: 'WE KNOW WHERE YOU LIVE ♥', jp: '配達', bg: ['#ff6f3c', '#ffd1a8'], fg: '#2a0d00', icon: 'drone' },
  { brand: 'CORP-CRED™', line: 'YOUR SOUL IS PRE-APPROVED', jp: '信用', bg: ['#111111', '#c9a227'], fg: '#ffe9a6', icon: 'card' },
  { brand: 'ZEN-O-MATIC', line: 'INNER PEACE IN 4 EASY PAYMENTS', jp: '禅', bg: ['#8be3b5', '#e9fff4'], fg: '#0f3d2a', icon: 'zen' },
  { brand: 'GRAV-SHOES', line: 'FALL WITH CONFIDENCE. REFUNDS NOT POSSIBLE.', jp: '重力', bg: ['#3a2ad8', '#00d4ff'], fg: '#ffffff', icon: 'shoe' },
  { brand: 'MOOD UPGRADE', line: 'HAPPINESS: NOW A SUBSCRIPTION', jp: '幸福', bg: ['#ffe34a', '#ff9de0'], fg: '#4a1a5a', icon: 'smile' },
];
export const AD_COUNT = ADS.length;

// UV rect [u0, v0, u1, v1] of ad i in the atlas (v up, three.js convention).
export function adUV(i) {
  const k = ((i % AD_COUNT) + AD_COUNT) % AD_COUNT, col = k % 4, row = Math.floor(k / 4);
  return [col / 4, 1 - (row + 1) / 8, (col + 1) / 4, 1 - row / 8];
}

let atlas = null;
export function adAtlas() {
  if (atlas) return atlas;
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024);
  ADS.forEach((ad, i) => { g.save(); g.translate((i % 4) * 256, Math.floor(i / 4) * 128); paintAd(g, ad, i); g.restore(); });
  atlas = retroTex(new THREE.CanvasTexture(c));
  return atlas;
}

function paintAd(g, ad, i) {
  const W = 256, H = 128;
  const grd = g.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, ad.bg[0]); grd.addColorStop(1, ad.bg[1]);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // halftone corner dots + a starburst behind the icon (cheap-print energy)
  g.fillStyle = 'rgba(255,255,255,0.18)';
  for (let y = 4; y < H; y += 8) for (let x = 4 + ((y / 8) % 2) * 4; x < 90; x += 8) { const r = 2.6 * (1 - x / 90); if (r > 0.3) { g.beginPath(); g.arc(W - x, y, r, 0, 7); g.fill(); } }
  g.save(); g.translate(204, 62); g.fillStyle = 'rgba(255,255,255,0.28)';
  for (let k = 0; k < 12; k++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(70, -12); g.lineTo(70, 12); g.closePath(); g.fill(); }
  g.restore();
  icon(g, ad.icon, 204, 62, ad);
  // brand
  g.fillStyle = ad.fg;
  g.textBaseline = 'top';
  fitText(g, ad.brand, 10, 10, 160, 30, '900', 'Impact, "Arial Black", "DejaVu Sans", sans-serif');
  // tagline, word-wrapped
  g.font = 'bold 13px "Arial Narrow", "DejaVu Sans Condensed", "DejaVu Sans", sans-serif';
  wrap(g, ad.line, 10, 50, 160, 15);
  // the Japanese stamp (a red hanko block) and the fine print
  g.fillStyle = '#e8202a'; g.fillRect(10, 98, 46, 20);
  g.fillStyle = '#fff'; g.font = 'bold 14px sans-serif'; g.textBaseline = 'middle'; g.fillText(ad.jp, 13, 109, 40);
  g.fillStyle = ad.fg; g.globalAlpha = 0.7; g.font = '8px sans-serif'; g.textBaseline = 'top';
  g.fillText(['A DIVISION OF OMNICORP', 'NOT A CULT', 'SIDE EFFECTS MAY INCLUDE', 'NO REFUNDS. NO REGRETS.', 'PROPERTY OF THE CITY'][i % 5], 62, 106, 110);
  g.globalAlpha = 1;
  // frame
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4);
}

function fitText(g, s, x, y, maxW, size, weight, family) {
  let px = size;
  do { g.font = `${weight} ${px}px ${family}`; px -= 1; } while (g.measureText(s).width > maxW && px > 10);
  g.fillText(s, x, y);
}

function wrap(g, s, x, y, maxW, lh) {
  const words = s.split(' ');
  let line = '';
  for (const wd of words) {
    const t = line ? line + ' ' + wd : wd;
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = t;
  }
  if (line) g.fillText(line, x, y);
}

// Simple, chunky pictograms (they read at 240p).
function icon(g, kind, x, y, ad) {
  g.save(); g.translate(x, y);
  const ink = '#141018', white = '#ffffff';
  const circ = (cx, cy, r, f) => { g.fillStyle = f; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); };
  const rect = (rx, ry, w, h, f) => { g.fillStyle = f; g.fillRect(rx, ry, w, h); };
  switch (kind) {
    case 'can': rect(-16, -34, 32, 66, white); rect(-16, -34, 32, 8, '#bbb'); rect(-16, -8, 32, 18, '#d8202f'); g.fillStyle = white; g.font = 'bold 9px sans-serif'; g.fillText('DREAD', -14, -4); rect(-16, 26, 32, 6, '#bbb'); break;
    case 'twins': for (const s of [-18, 18]) { circ(s, -4, 20, '#ffd84a'); circ(s - 7, -9, 3, ink); circ(s + 7, -9, 3, ink); g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.arc(s, -2, 11, 0.2, Math.PI - 0.2); g.stroke(); } break;
    case 'bowl': g.fillStyle = white; g.beginPath(); g.arc(0, 0, 32, 0, Math.PI); g.fill(); rect(-34, -4, 68, 6, '#d8202f'); g.strokeStyle = '#ffe9a6'; g.lineWidth = 3; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 8, -4); g.quadraticCurveTo(k * 8 + 6, -24, k * 8, -38); g.stroke(); } rect(10, -46, 4, 44, '#7a4a1a'); rect(18, -46, 4, 44, '#7a4a1a'); break;
    case 'eye': g.fillStyle = white; g.beginPath(); g.ellipse(0, 0, 38, 20, 0, 0, Math.PI * 2); g.fill(); circ(0, 0, 16, '#2c5ad8'); circ(0, 0, 8, ink); circ(-4, -4, 3, white); break;
    case 'brain': circ(-10, -2, 20, '#ff8fc8'); circ(12, -4, 20, '#ff8fc8'); g.strokeStyle = '#a0306a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(6, -4, -2, 16); g.stroke(); rect(14, 10, 26, 12, '#ffe34a'); rect(30, 10, 10, 12, '#ff6a8a'); break;
    case 'bubbles': for (const [bx, by, r] of [[-14, 8, 16], [12, -8, 13], [20, 18, 9], [-6, -24, 8]]) { circ(bx, by, r, 'rgba(255,255,255,0.85)'); circ(bx - r * 0.35, by - r * 0.35, r * 0.25, white); } break;
    case 'robot': case 'mayor': rect(-24, -30, 48, 40, '#c8ccd8'); rect(-16, -20, 10, 10, ad.fg); rect(6, -20, 10, 10, ad.fg); rect(-12, -2, 24, 4, ink); rect(-2, -40, 4, 10, '#c8ccd8'); circ(0, -42, 4, '#ff3a3a'); rect(-30, 12, 60, 22, kind === 'mayor' ? '#14204a' : '#333'); rect(-4, 12, 8, 20, kind === 'mayor' ? '#c22d3a' : '#ffd54a'); break;
    case 'pill': g.save(); g.rotate(-0.5); rect(-30, -12, 30, 24, white); rect(0, -12, 30, 24, '#ff4fd8'); circ(-30, 0, 12, white); circ(30, 0, 12, '#ff4fd8'); g.restore(); break;
    case 'toaster': rect(-30, -16, 60, 40, '#c0c4cc'); rect(-20, -24, 14, 10, ink); rect(6, -24, 14, 10, ink); g.fillStyle = white; g.beginPath(); g.ellipse(0, 6, 12, 8, 0, 0, 7); g.fill(); circ(0, 6, 5, '#d8202f'); break;
    case 'arm': g.fillStyle = '#e0e8f4'; g.beginPath(); g.moveTo(-36, 20); g.lineTo(-10, 6); g.lineTo(18, -20); g.lineTo(30, -10); g.lineTo(0, 18); g.lineTo(-30, 30); g.closePath(); g.fill(); circ(24, -18, 10, '#9fb4d0'); g.strokeStyle = '#5a6a80'; g.lineWidth = 2; g.stroke(); break;
    case 'cutebot': rect(-26, -24, 52, 44, white); circ(-10, -4, 6, ink); circ(10, -4, 6, ink); circ(-16, 8, 4, '#ff8fc8'); circ(16, 8, 4, '#ff8fc8'); rect(-30, -30, 8, 10, '#d01a6a'); rect(22, -30, 8, 10, '#d01a6a'); break;
    case 'cart': g.strokeStyle = ink; g.lineWidth = 5; g.beginPath(); g.moveTo(-36, -24); g.lineTo(-24, -24); g.lineTo(-14, 10); g.lineTo(26, 10); g.lineTo(32, -14); g.lineTo(-20, -14); g.stroke(); circ(-10, 22, 6, ink); circ(22, 22, 6, ink); break;
    case 'drone': rect(-20, -6, 40, 14, '#333'); rect(-40, -14, 24, 4, '#333'); rect(16, -14, 24, 4, '#333'); circ(0, 1, 5, '#ff3a3a'); g.fillStyle = '#d8202f'; g.beginPath(); g.moveTo(0, 36); g.bezierCurveTo(-22, 20, -10, 6, 0, 16); g.bezierCurveTo(10, 6, 22, 20, 0, 36); g.fill(); break;
    case 'card': rect(-36, -22, 72, 46, '#c9a227'); rect(-26, -10, 16, 12, '#fff3c0'); g.fillStyle = ink; g.font = 'bold 9px monospace'; g.fillText('6666 0000', -24, 12); break;
    case 'zen': circ(0, -22, 10, '#c8ccd8'); rect(-12, -12, 24, 22, '#c8ccd8'); g.fillStyle = '#c8ccd8'; g.beginPath(); g.ellipse(0, 18, 30, 9, 0, 0, 7); g.fill(); circ(-4, -24, 2, ink); circ(4, -24, 2, ink); g.strokeStyle = '#ffd54a'; g.lineWidth = 2; g.beginPath(); g.arc(0, -22, 16, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); break;
    case 'shoe': g.fillStyle = white; g.beginPath(); g.moveTo(-34, 10); g.lineTo(-30, -12); g.lineTo(-8, -12); g.lineTo(4, 0); g.lineTo(32, 4); g.lineTo(34, 16); g.lineTo(-34, 16); g.closePath(); g.fill(); rect(-34, 16, 68, 6, '#00d4ff'); g.fillStyle = '#ffe34a'; g.beginPath(); g.moveTo(-20, 26); g.lineTo(-10, 40); g.lineTo(0, 26); g.fill(); break;
    case 'smile': circ(0, 0, 32, '#ffe34a'); circ(-11, -9, 5, ink); circ(11, -9, 5, ink); g.strokeStyle = ink; g.lineWidth = 4; g.beginPath(); g.arc(0, 2, 18, 0.25, Math.PI - 0.25); g.stroke(); g.fillStyle = '#d8202f'; g.font = 'bold 10px sans-serif'; g.fillText('$9.99/MO', -24, 40); break;
    default: break;
  }
  g.restore();
}
