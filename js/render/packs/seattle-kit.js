// Small geometry helpers for the SEATTLE pack's render module: struts between two points, lathed
// (round) shapes and a 5×7 pixel font for neon lettering. Every helper returns a prepped geometry
// (geo.js `prep`: non-indexed, vertex-coloured) ready for Kit.add().
import * as THREE from 'three';
import { prep, box } from '../geo.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);

// A square beam of thickness t from a = [x, y, z] to b.
export function strut(a, b, t, color, t2 = t) {
  _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]);
  _d.subVectors(_b, _a);
  const len = _d.length() || 1e-3;
  const g = prep(new THREE.BoxGeometry(t, 1, t2), color);
  _q.setFromUnitVectors(Y, _d.multiplyScalar(1 / len));
  _p.addVectors(_a, _b).multiplyScalar(0.5);
  _s.set(1, len, 1);
  _m.compose(_p, _q, _s);
  g.applyMatrix4(_m);
  return g;
}
// A polyline of struts.
export function struts(pts, t, color) { const out = []; for (let i = 1; i < pts.length; i++) out.push(strut(pts[i - 1], pts[i], t, color)); return out; }

// A lathed shape: profile [[radius, y], …] from top to bottom, n sides (flat-shaded facets).
export function lathe(profile, n, o = {}) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y)).reverse(); // (three wants bottom → top)
  const g = new THREE.LatheGeometry(pts, n);
  const out = prep(g, o.color ?? 0xffffff);
  if (o.x || o.y || o.z || o.sx || o.sz) { _m.makeScale(o.sx ?? 1, 1, o.sz ?? 1); _m.setPosition(o.x || 0, o.y || 0, o.z || 0); out.applyMatrix4(_m); }
  return out;
}

// 5×7 pixel font (rows top → bottom, 5 bits each).
const FONT = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110', 2: '01110 10001 00001 00010 00100 01000 11111',
  3: '11110 00001 00001 01110 00001 00001 11110', 4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000', 8: '01110 10001 10001 01110 10001 10001 01110',
  9: '01110 10001 10001 01111 00001 00010 01100', '-': '00000 00000 00000 11111 00000 00000 00000', '.': '00000 00000 00000 00000 00000 00000 00100',
  '!': '00100 00100 00100 00100 00100 00000 00100', '·': '00000 00000 00000 00100 00000 00000 00000', "'": '00100 00100 01000 00000 00000 00000 00000',
  '#': '01010 11111 01010 01010 01010 11111 01010', '/': '00001 00010 00010 00100 01000 01000 10000', ' ': '00000 00000 00000 00000 00000 00000 00000',
};
const ROWS = Object.fromEntries(Object.entries(FONT).map(([k, v]) => [k, v.split(' ')]));

// Lettering: a list of geometries (one box per run of lit pixels). The text is centred on (x, y, z),
// faces +Z before the turn ry (readable from the front), px = pixel size, depth = how far it stands out.
export function text(str, o = {}) {
  const px = o.px ?? 0.3, depth = o.depth ?? 0.12, color = o.color ?? 0xffffff, ry = o.ry || 0;
  const adv = 6 * px, wTot = str.length * adv - px, c = Math.cos(ry), s = Math.sin(ry);
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const rows = ROWS[str[i].toUpperCase()] || ROWS[' '];
    for (let r = 0; r < 7; r++) {
      const row = rows[r];
      for (let k = 0; k < 5;) {
        if (row[k] !== '1') { k++; continue; }
        let e = k; while (e < 5 && row[e] === '1') e++;
        const u = -wTot / 2 + i * adv + ((k + e) / 2) * px, v = (3 - r) * px;
        out.push(box((e - k) * px, px, depth, { x: (o.x || 0) + u * c, y: (o.y || 0) + v, z: (o.z || 0) - u * s, ry, color }));
        k = e;
      }
    }
  }
  return out;
}
export const textWidth = (str, px = 0.3) => str.length * 6 * px - px;
