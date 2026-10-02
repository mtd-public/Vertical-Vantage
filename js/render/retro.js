// Retro mode: a PlayStation-era look (Jumping Flash, 1995), lifted from dr-mow's js/retro.js.
//
//   * low internal resolution (240 lines by default), upscaled with hard pixels (CSS pixelated)
//   * vertex snapping to that pixel grid (the PS1 "wobble")
//   * 15-bit colour (5 bits per channel) with a 4×4 ordered dither
//   * point-sampled textures, flat-ish shading, linear distance fog (renderer.js)
//
// It patches three.js's shared shader chunks, so it must be imported before any material
// compiles (main.js imports it first). The choice lives in Settings (art: 'retro' | 'hd' | 'smooth');
// `?art=` overrides it. Switching reloads the page.
import * as THREE from 'three';

const ARTS = ['retro', 'hd', 'smooth'];
function readSettings() { try { return JSON.parse(localStorage.getItem('vertical-vantage.settings')) || {}; } catch (_) { return {}; } }
function readArt() {
  const q = /[?&]art=([a-z]+)\b/.exec(location.search);
  if (q && ARTS.includes(q[1])) return q[1];
  const s = readSettings(); return ARTS.includes(s.art) ? s.art : 'retro';
}
// PS1 vertex wobble (vertices snapped to the pixel grid). Off by default: on thin, far detail it reads as
// flicker. Options → "PS1 wobble", or ?wobble=1 / ?wobble=0.
function readWobble() {
  const q = /[?&]wobble=([01])\b/.exec(location.search);
  if (q) return q[1] === '1';
  return readSettings().wobble === true;
}

export const ART = typeof location !== 'undefined' ? readArt() : 'retro';
export const WOBBLE = typeof location !== 'undefined' ? readWobble() : false;
export const RETRO = ART !== 'smooth';
export const RETRO_LINES = ART === 'hd' ? 400 : 240; // internal vertical resolution (the shorter side)

// Segment count helper: full detail when smooth, PS1 budgets when retro.
export const seg = (smooth, retro) => (RETRO ? retro : smooth);

// Snap clip-space xy to a grid of ~RETRO_LINES pixels; the x grid scales by aspect so it is square.
export const SNAP_GLSL = `
  #ifdef RETRO_SNAP
  {
    float snapAsp = abs(projectionMatrix[1][1] / projectionMatrix[0][0]);
    vec2 snapGrid = vec2(${(RETRO_LINES / 2).toFixed(1)} * max(snapAsp, 1.0), ${(RETRO_LINES / 2).toFixed(1)} * max(1.0 / snapAsp, 1.0));
    gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapGrid + 0.5) / snapGrid * gl_Position.w;
  }
  #endif`;

// 4×4 Bayer as arithmetic (GLSL ES 1.0 has no array initialisers): 15-bit colour + dither.
const DITHER15 = `
  {
    vec2 bq = mod(floor(gl_FragCoord.xy), 4.0), lo = mod(bq, 2.0), hi = floor(bq / 2.0);
    float bayer = 4.0 * mod(2.0 * lo.x + 3.0 * lo.y, 4.0) + mod(2.0 * hi.x + 3.0 * hi.y, 4.0);
    float d = (bayer / 16.0 - 0.5) / 31.0;
    gl_FragColor.rgb = floor(clamp(gl_FragColor.rgb + d, 0.0, 1.0) * 31.0 + 0.5) / 31.0;
  }`;

if (RETRO) {
  const C = THREE.ShaderChunk;
  if (WOBBLE) C.project_vertex = `${C.project_vertex}\n#define RETRO_SNAP\n${SNAP_GLSL}`;
  C.colorspace_fragment = `${C.colorspace_fragment}${DITHER15}`;
}

// Retro textures are point-sampled up close (the chunky PS1 texel) but mipmapped in the distance, so far
// facades, windows and deck planks don't shimmer and crawl as you move (they did with no mipmaps).
export function retroTex(t) {
  t.colorSpace = THREE.SRGBColorSpace;
  if (!RETRO) { t.anisotropy = 4; return t; }
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}
