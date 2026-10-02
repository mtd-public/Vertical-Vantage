// AIR FORTRESS platform styles. Each builds one platform's pieces into Kit K in its local frame:
// origin at the centre of its top, y = 0 at the top (you stand there), footprint p.w × p.d (local x × z)
// or radius p.r, p.thick deep. Flat-shaded primitives and vertex colours: 'flat' (lit), 'glow' (unlit
// lights), 'neon' (unlit, dimmed by day), 'glass', 'deck' (riveted plate texture, metre UVs).
// The fortress fights at night: walkable tops carry PS1-style baked light (vertex colours brighter
// than their paint, pools under the lamps) and lit edge trims, so every landing reads in the dark.
import * as THREE from 'three';
import { box, cyl, part, meterBox } from '../geo.js';
import { seg } from '../retro.js';

// the carrier's paint, and its lights
export const C = {
  hull: 0x5c6573, hullDk: 0x3a414c, hullLt: 0x8a94a3, deck: 0x4a5059, deckDk: 0x2c3038, steel: 0x6b7480, dark: 0x1c1f26,
  white: 0xe8ecf0, yellow: 0xffcc1a, black: 0x18181c, red: 0xe0313a, violet: 0xb45bff, cyan: 0x2be8ff, amber: 0xffb02b,
  olive: 0x56603e, oliveDk: 0x3c4430, orange: 0xe8742a, green: 0x3aff6a, navRed: 0xff3a3a,
  lamp: 0xfff2d0, sodium: 0xffc070, ice: 0xbfe6ff, hot: 0xff7a2a, port: 0xffe2a8, magenta: 0xff2bd6, teal: 0x2bffd0,
};
const F = (K, ...g) => K.add('flat', ...g);
const G = (K, ...g) => K.add('glow', ...g);
const N = (K, ...g) => K.add('neon', ...g);

// ------------------------------------------------------------------ night lighting helpers
// A walkable top plate (the riveted 'deck' texture, metre UVs at `tile` m) with baked light: each
// vertex is the paint × o.amb (tops read brighter than the dark flanks under them), plus pools under
// the lamps, o.lamps = [{ x, z, r, c, k }] in the plate's local frame. Values over 1 are fine: they
// brighten the texture where a floodlight lands.
const LIFT = 1.7; // the default night lift for tops
const _lc = new THREE.Color(), _bc = new THREE.Color();
export function litTop(K, w, d, col, tile = 4, o = {}) {
  const st = o.step ?? 3, nx = Math.max(1, Math.round(w / st)), nz = Math.max(1, Math.round(d / st));
  const g = new THREE.PlaneGeometry(w, d, nx, nz);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, uv = g.attributes.uv, n = pos.count, cols = new Float32Array(n * 3);
  const amb = o.amb ?? LIFT, lamps = o.lamps || [];
  _bc.set(col);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    uv.setXY(i, (x + w / 2) / tile, (d / 2 - z) / tile);
    let r = amb, gg = amb, b = amb;
    for (const L of lamps) {
      const dx = x - L.x, dz = z - L.z, q = 1 - (dx * dx + dz * dz) / (L.r * L.r);
      if (q <= 0) continue;
      _lc.set(L.c); const k = (L.k ?? 1.6) * q * q;
      r += _lc.r * k; gg += _lc.g * k; b += _lc.b * k;
    }
    cols[i * 3] = _bc.r * r; cols[i * 3 + 1] = _bc.g * gg; cols[i * 3 + 2] = _bc.b * b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  K.add('deck', part(g, { y: o.y ?? 0 }));
}
// The same light on a round top (a disc of radius r), centre pool optional.
function litDisc(K, r, col, tile = 4, o = {}) {
  const n = seg(o.n ?? 24, Math.max(10, Math.round((o.n ?? 24) / 2))), rings = o.rings ?? Math.max(1, Math.round(r / 3));
  const g = new THREE.RingGeometry(0.001, r, n, rings);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, uv = g.attributes.uv, cnt = pos.count, cols = new Float32Array(cnt * 3);
  const amb = o.amb ?? LIFT, lamps = o.lamps || [];
  _bc.set(col);
  for (let i = 0; i < cnt; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    uv.setXY(i, x / tile, -z / tile);
    let rr = amb, gg = amb, b = amb;
    for (const L of lamps) {
      const dx = x - L.x, dz = z - L.z, q = 1 - (dx * dx + dz * dz) / (L.r * L.r);
      if (q <= 0) continue;
      _lc.set(L.c); const k = (L.k ?? 1.6) * q * q;
      rr += _lc.r * k; gg += _lc.g * k; b += _lc.b * k;
    }
    cols[i * 3] = _bc.r * rr; cols[i * 3 + 1] = _bc.g * gg; cols[i * 3 + 2] = _bc.b * b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  K.add('deck', part(g, { y: o.y ?? 0 }));
}
// A lit top plate and a slab body under it.
function slab(K, p, top = C.deck, side = C.hull, tile = 4, o = {}) {
  litTop(K, p.w, p.d, top, tile, o);
  F(K, box(p.w, p.thick - 0.04, p.d, { y: -p.thick / 2 - 0.04, color: side }));
}
// A lit edge trim round a w × d top: glow strips on the side faces just under the lip, outlining the
// footing at night. o.skip: sides to leave dark ('n' −z, 's' +z, 'e' +x, 'w' −x); o.dash: a
// hazard light bar instead (lit segments o.dash m long, dark gaps between); o.y, o.h its band.
function trim(K, w, d, col, o = {}) {
  const y = o.y ?? -0.13, h = o.h ?? 0.1, t = o.t ?? 0.05, hw = w / 2, hd = d / 2, skip = o.skip || '';
  for (const [s, x, z, len, ax] of [['n', 0, -hd - t / 2, w + 2 * t, 'x'], ['s', 0, hd + t / 2, w + 2 * t, 'x'], ['e', hw + t / 2, 0, d, 'z'], ['w', -hw - t / 2, 0, d, 'z']]) {
    if (skip.includes(s)) continue;
    if (!o.dash) { G(K, box(ax === 'x' ? len : t, h, ax === 'z' ? len : t, { x, y, z, color: col })); continue; }
    const n = Math.max(1, Math.round(len / (o.dash * 2))), step = len / n;
    for (let i = 0; i < n; i++) {
      const c = -len / 2 + (i + 0.25) * step;
      G(K, box(ax === 'x' ? step / 2 : t, h, ax === 'z' ? step / 2 : t, { x: ax === 'x' ? c : x, y, z: ax === 'z' ? c : z, color: col }));
      if (o.gap) F(K, box(ax === 'x' ? step / 2 : t, h, ax === 'z' ? step / 2 : t, { x: ax === 'x' ? c + step / 2 : x, y, z: ax === 'z' ? c + step / 2 : z, color: o.gap }));
    }
  }
}
// A glowing ring round a disc top (just under the lip).
const discTrim = (K, r, col, o = {}) => G(K, part(new THREE.TorusGeometry(r + 0.03, o.t ?? 0.07, 3, seg(o.n ?? 24, 12)), { rx: Math.PI / 2, y: o.y ?? -0.13, color: col }));
// Alternating stripes from (x0, z0) to (x1, z1) (axis-aligned), width wd, at height y: hazard edging.
function stripes(K, x0, z0, x1, z1, y, wd, len = 1.2, a = C.yellow, b = C.black) {
  const along = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = along ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  const n = Math.max(1, Math.round(L / len)), step = L / n;
  for (let i = 0; i < n; i++) {
    const t = -L / 2 + (i + 0.5) * step, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    F(K, box(along ? step : wd, 0.04, along ? wd : step, { x: along ? cx + t : cx, y: y + 0.02, z: along ? cz : cz + t, color: i % 2 ? b : a }));
  }
}
// Lights every `every` metres along a line (glow cubes).
function lights(K, x0, z0, x1, z1, y, every, col, s = 0.22, col2) {
  const dx = x1 - x0, dz = z1 - z0, L = Math.sqrt(dx * dx + dz * dz), n = Math.max(1, Math.floor(L / every));
  for (let i = 0; i <= n; i++) { const t = i / n; G(K, box(s, s * 0.6, s, { x: x0 + dx * t, y, z: z0 + dz * t, color: col2 && i % 2 ? col2 : col })); }
}
// A floodlight head: a dark housing and its lit lens, aimed along (ax, az) and tilted down.
function flood(K, x, y, z, ax, az, col = C.lamp, s = 1) {
  const ry = Math.atan2(ax, az), aim = (g, dz) => { g.translate(0, 0, dz); g.rotateX(0.55); g.rotateY(ry); return g; };
  F(K, part(aim(new THREE.BoxGeometry(1.3 * s, 0.9 * s, 0.6 * s), 0), { x, y, z, color: C.dark }));
  G(K, part(aim(new THREE.BoxGeometry(1.1 * s, 0.7 * s, 0.08), 0.32 * s), { x, y, z, color: col }));
}
// A deck crewman in a coloured jersey, waving two light wands (green: shooter, orange: director…).
function crew(K, x, z, ry, vest, wand, base = 0, pose = 0) {
  const c = Math.cos(ry), s = Math.sin(ry), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  for (const sx of [-1, 1]) { const [lx, lz] = at(sx * 0.16, 0); F(K, box(0.18, 0.85, 0.22, { x: lx, y: base + 0.43, z: lz, ry, color: 0x24262c })); }
  F(K, box(0.52, 0.62, 0.3, { x, y: base + 1.15, z, ry, color: vest }));
  F(K, box(0.3, 0.3, 0.3, { x, y: base + 1.62, z, ry, color: vest }), box(0.32, 0.12, 0.32, { x, y: base + 1.72, z, ry, color: C.white }));
  for (const sx of [-1, 1]) {
    const up = pose ? (sx < 0 ? 2.4 : 0.7) : 2.0; // arms raised in a signal
    const [ax, az] = at(sx * 0.42, 0), [hx, hz] = at(sx * (0.42 + Math.sin(up) * 0.55), 0);
    F(K, box(0.13, 0.62, 0.13, { x: ax + (hx - ax) * 0.5, y: base + 1.35 - Math.cos(up) * 0.3, z: az + (hz - az) * 0.5, ry, rz: sx * up * 0.9, color: vest }));
    G(K, box(0.09, 0.7, 0.09, { x: hx, y: base + 1.4 - Math.cos(up) * 0.75 + 0.3, z: hz, ry, rz: sx * (up * 0.9 - 0.3), color: wand }));
  }
}

// A thin bar from a to b ([x, y, z]): cables, struts.
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _a = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);
export function strut(a, b, th, color) {
  _a.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _a.length() || 0.01;
  _q.setFromUnitVectors(_Y, _a.multiplyScalar(1 / len)); _e.setFromQuaternion(_q, 'XYZ');
  return box(th, len, th, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, rx: _e.x, ry: _e.y, rz: _e.z, color });
}
// An inside-out open cylinder (seen from within: wells, ducts).
const well = (r, h, n, o) => part(new THREE.CylinderGeometry(r, r, h, n, 1, true), { ...o, sx: -1 });
const ring = (r, tube, o, n = 24) => part(new THREE.TorusGeometry(r, tube, 3, seg(n, Math.max(10, n / 2))), { rx: Math.PI / 2, ...o });
const disk = (r, o, n = 24) => part(new THREE.CircleGeometry(r, seg(n, Math.max(10, n / 2))), { rx: -Math.PI / 2, ...o });

// ------------------------------------------------------------------ stage 1: the flight deck
const RUN_X = 8; // the runway centre line (world x)
// Where the deck's floodlights land (world x, z): the island's floods, the bow and stern floods,
// the lift fans glowing hot from below, the landing spots.
const DECK_LAMPS = [
  { x: 5, z: -74, r: 15, c: C.lamp, k: 1.5 }, { x: 4, z: -90, r: 15, c: C.lamp, k: 1.5 }, { x: 8, z: -106, r: 13, c: C.lamp, k: 1.2 },
  { x: 8, z: -172, r: 16, c: C.ice, k: 1.4 }, { x: -2, z: -190, r: 10, c: C.ice, k: 1.1 },
  { x: 8, z: 28, r: 16, c: C.ice, k: 1.2 }, { x: -12, z: 38, r: 10, c: C.lamp, k: 1.0 },
  { x: -10, z: -14, r: 12, c: C.hot, k: 1.3 }, { x: -12, z: -126, r: 12, c: C.hot, k: 1.3 },
  { x: -14, z: -40, r: 8, c: C.cyan, k: 0.9 }, { x: -14, z: -54, r: 8, c: C.cyan, k: 0.9 },
  { x: 19, z: -30, r: 9, c: C.sodium, k: 1.1 }, { x: -14, z: -96, r: 10, c: C.sodium, k: 1.1 }, { x: -18, z: -160, r: 10, c: C.sodium, k: 1.1 },
  { x: 12, z: -2, r: 10, c: C.sodium, k: 0.9 }, { x: 20, z: -126, r: 10, c: C.lamp, k: 1.0 }, { x: -20, z: -70, r: 9, c: C.lamp, k: 0.8 },
];
const localLamps = (p, list) => list.filter((L) => Math.abs(L.x - p.x) < p.w / 2 + L.r && Math.abs(L.z - p.z) < p.d / 2 + L.r).map((L) => ({ ...L, x: L.x - p.x, z: L.z - p.z }));
// The deck crew (world x, z, facing, jersey, wands): shooters by the catapults, directors by the
// VTOLs, ordnance by the guns, the landing signal officer at the stern.
const CREW = [
  [1.5, -150, Math.PI, 0xffcc1a, C.green, 1], [10.5, -146, Math.PI * 0.9, 0xffcc1a, C.green, 0],
  [12, -42, -1.3, 0xffcc1a, 0xff8a2a, 1], [10, -60, -1.6, 0x3a6aff, 0xff8a2a, 0], [-7, -86, 1.4, 0xffcc1a, 0xff8a2a, 1],
  [-21, -105, 0.5, 0xe0313a, 0xff3a3a, 0], [-21, 34, 0.8, 0xe8ecf0, 0xff3a3a, 1], [-7, -170, 2.6, 0x3aa84a, C.green, 1],
];
function runway(K, p) {
  const { w, d } = p, f = p.tint >= 0 ? p.tint : 0, hw = w / 2, hd = d / 2, lx = RUN_X - p.x;
  slab(K, p, 0x5c6678, C.hullDk, 4, { lamps: localLamps(p, DECK_LAMPS) });
  // gallery band under the deck edge: a darker strip with two rows of lit ports and a violet panel line
  F(K, box(w + 0.1, 1.2, d + 0.1, { y: -2.2, color: 0x2a2f38 }));
  // expansion joints across the deck
  for (let z = -hd + 12; z < hd; z += 12) F(K, box(w, 0.03, 0.12, { y: 0.015, z, color: C.deckDk }));
  if (f & 1) { // the runway: edge lines, centre-line dashes and LEDs, edge lights
    for (const ex of [lx - 12, lx + 12]) if (Math.abs(ex) < hw - 0.3) F(K, box(0.4, 0.04, d, { x: ex, y: 0.02, color: C.white }));
    if (Math.abs(lx) < hw - 0.5) {
      for (let z = -hd + 3; z < hd - 2; z += 9) F(K, box(0.6, 0.04, 4.5, { x: lx, y: 0.02, z, color: C.white }));
      for (let z = -hd + 1.5; z < hd; z += 3) G(K, box(0.22, 0.06, 0.5, { x: lx, y: 0.03, z: z + 6, color: ((z + p.z) | 0) % 2 ? C.ice : 0xffffff })); // centreline LEDs
    }
    for (const ex of [lx - 12.6, lx + 12.6]) if (Math.abs(ex) < hw - 0.2) lights(K, ex, -hd + 1, ex, hd - 1, 0.05, 4, 0xfff2c8, 0.3, C.ice);
  }
  if (f & 2) { // the stern: threshold bars, aiming marks, green threshold lights, touchdown-zone bars, four arresting wires
    for (let k = -3; k <= 3; k++) F(K, box(1.3, 0.04, 7, { x: lx + k * 2.6, y: 0.02, z: hd - 5.5, color: C.white }));
    for (const sx of [-1, 1]) F(K, box(3, 0.04, 12, { x: lx + sx * 6.5, y: 0.02, z: hd - 20, color: C.white }));
    for (let k = -11; k <= 11; k += 1.4) G(K, box(0.5, 0.08, 0.3, { x: lx + k, y: 0.04, z: hd - 1.2, color: C.green }));
    for (const z of [hd - 12, hd - 26]) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) G(K, box(0.3, 0.06, 0.3, { x: lx + sx * (3 + k * 0.9), y: 0.03, z, color: 0xffffff }));
    for (const wz of [-6, -2, 2, 6]) { // wires lie across the deck between sheave housings
      const z = wz - 2;
      F(K, cyl(0.07, 0.07, 42, 5, { y: 0.07, z, rz: Math.PI / 2, color: 0x23262c }));
      for (const sx of [-1, 1]) F(K, box(1.2, 0.5, 1.6, { x: sx * 21.2, y: 0.25, z, color: C.yellow }), box(1.24, 0.12, 1.64, { x: sx * 21.2, y: 0.5, z, color: C.black })), G(K, box(0.3, 0.2, 0.3, { x: sx * 21.2, y: 0.62, z, color: C.amber }));
    }
  }
  if (f & 4) { // landing spots: yellow rings with a white cross, a ring of cyan deck lights round each
    for (const [x, z] of [[-14, -40], [-14, -54]]) {
      const sx = x - p.x, sz = z - p.z;
      if (Math.abs(sx) > hw - 5 || Math.abs(sz) > hd - 5) continue;
      F(K, part(new THREE.RingGeometry(3.4, 3.8, seg(32, 16)), { rx: -Math.PI / 2, x: sx, y: 0.03, z: sz, color: C.yellow }));
      F(K, box(0.5, 0.04, 3, { x: sx, y: 0.02, z: sz, color: C.white }), box(3, 0.04, 0.5, { x: sx, y: 0.02, z: sz, color: C.white }));
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; G(K, box(0.22, 0.06, 0.22, { x: sx + Math.cos(a) * 4.3, y: 0.03, z: sz + Math.sin(a) * 4.3, color: C.cyan })); }
    }
  }
  if (f & 8) { // the bow catapults: slots with a glowing rail, hazard borders, launch arrows, red end lights
    for (const cx of [4, 14]) {
      const sx = cx - p.x;
      if (Math.abs(sx) > hw - 1) continue;
      F(K, box(0.9, 0.05, d, { x: sx, y: 0.005, color: 0x101216 }));
      G(K, box(0.16, 0.06, d - 0.4, { x: sx, y: 0.03, color: C.cyan }));
      lights(K, sx, -hd + 1, sx, hd - 1, 0.05, 2, 0xffffff, 0.2);
      for (const s of [-1, 1]) stripes(K, sx + s * 1.3, -hd + 0.5, sx + s * 1.3, hd - 0.5, 0, 0.3, 1.5);
      for (let z = -hd + 4; z < hd - 2; z += 10) for (const s of [-1, 1]) F(K, box(0.3, 0.04, 2.2, { x: sx + s * 0.9, y: 0.02, z, ry: s * 0.6, color: C.white }));
    }
    if (f & 64) for (let x = -hw + 1; x < hw; x += 1.6) G(K, box(0.5, 0.08, 0.3, { x, y: 0.04, z: -hd + 1.2, color: C.navRed })); // runway end
  }
  // deck edges: hazard light bars on the lip, deck-edge lights, a toe board and safety nets slung out
  // below, the gallery's lit ports, a violet panel line, red / green navigation lights to port / starboard
  const edges = [[16, -hw, 0, 'x'], [32, hw, 0, 'x'], [64, 0, -hd, 'z'], [128, 0, hd, 'z']];
  for (const [bit, ex, ez, ax] of edges) {
    if (!(f & bit)) continue;
    if (ax === 'x') {
      const s = Math.sign(ex);
      stripes(K, ex - s * 0.35, -hd, ex - s * 0.35, hd, 0, 0.5, 2.4);
      trim(K, w, d, C.amber, { skip: s > 0 ? 'nsw' : 'nse', dash: 0.9, gap: C.black, y: -0.25, h: 0.3 });
      lights(K, ex - s * 0.9, -hd + 1, ex - s * 0.9, hd - 1, 0.06, 6, C.amber, 0.26);
      F(K, box(1.6, 0.08, d, { x: ex + s * 0.8, y: -0.9, rz: s * 0.25, color: 0x3a3f48 })); // the net
      for (let z = -hd + 2; z < hd; z += 3) for (const y of [-1.75, -2.6]) G(K, box(0.1, 0.32, 0.7, { x: ex + s * 0.08, y, z: z + (y < -2 ? 1.5 : 0), color: (z + p.z + y * 7) % 9 < 4 ? C.port : 0x8ad8ff }));
      G(K, box(0.12, 0.14, d, { x: ex + s * 0.1, y: -3.0, color: C.violet }));
      for (let z = -hd + 6; z < hd; z += 18) G(K, box(0.3, 0.3, 0.3, { x: ex + s * 0.7, y: -0.6, z, color: s < 0 ? C.navRed : C.green }));
    } else {
      const s = Math.sign(ez);
      stripes(K, -hw, ez - s * 0.35, hw, ez - s * 0.35, 0, 0.5, 2.4);
      trim(K, w, d, C.amber, { skip: s > 0 ? 'new' : 'sew', dash: 0.9, gap: C.black, y: -0.25, h: 0.3 });
      lights(K, -hw + 1, ez - s * 0.9, hw - 1, ez - s * 0.9, 0.06, 6, C.amber, 0.26);
      for (let x = -hw + 2; x < hw; x += 3) G(K, box(0.7, 0.32, 0.1, { x, y: -1.75, z: ez + s * 0.08, color: C.port }));
      G(K, box(w, 0.14, 0.12, { y: -3.0, z: ez + s * 0.1, color: C.violet }));
    }
  }
  // the crew on this piece of deck
  for (const [x, z, ry, vest, wand, pose] of CREW) if (Math.abs(x - p.x) < hw - 0.5 && Math.abs(z - p.z) < hd - 0.5) crew(K, x - p.x, z - p.z, ry, vest, wand, 0, pose);
}

// A lift-fan well: deck plate round a round hole, a grille over it (walkable), the duct below glowing hot.
function fanwell(K, p) {
  const R = 7.95, { w, d } = p;
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, -d / 2); sh.lineTo(w / 2, -d / 2); sh.lineTo(w / 2, d / 2); sh.lineTo(-w / 2, d / 2); sh.lineTo(-w / 2, -d / 2);
  const hole = new THREE.Path(); hole.absarc(0, 0, R, 0, Math.PI * 2, true); sh.holes.push(hole);
  const top = new THREE.ShapeGeometry(sh, seg(24, 12));
  const uv = top.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
  // baked: the plate glows orange toward the hole (the fan's heat light)
  const pos = top.attributes.position, cols = new Float32Array(pos.count * 3); _bc.set(0x5c6678); _lc.set(C.hot);
  for (let i = 0; i < pos.count; i++) { const r = Math.sqrt(pos.getX(i) ** 2 + pos.getY(i) ** 2), k = Math.max(0, 1 - (r - R) / 5) * 1.6; cols[i * 3] = _bc.r * (LIFT + _lc.r * k); cols[i * 3 + 1] = _bc.g * (LIFT + _lc.g * k); cols[i * 3 + 2] = _bc.b * (LIFT + _lc.b * k); }
  top.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  K.add('deck', part(top, { rx: -Math.PI / 2 }));
  // the slab sides
  for (const f of [[0, d / 2, w, 0.3], [0, -d / 2, w, 0.3], [w / 2, 0, 0.3, d], [-w / 2, 0, 0.3, d]]) F(K, box(f[2], p.thick, f[3], { x: f[0] - Math.sign(f[0]) * 0.15, y: -p.thick / 2 - 0.02, z: f[1] - Math.sign(f[1]) * 0.15, color: C.hullDk }));
  // the grille: radial bars and three rings, just under the top
  const n = 18;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; F(K, box(0.16, 0.1, R - 1.2, { x: Math.cos(a) * (R / 2 + 0.6), y: -0.05, z: Math.sin(a) * (R / 2 + 0.6), ry: -a + Math.PI / 2, color: 0x2a2e36 })); }
  for (const r of [2.2, 4.6, 6.9]) F(K, ring(r, 0.08, { y: -0.05, color: 0x2a2e36 }, 32));
  F(K, cyl(1.2, 1.2, 0.12, seg(16, 8), { y: -0.06, color: C.yellow }));
  G(K, ring(1.25, 0.06, { y: -0.02, color: C.amber }, 16));
  // the duct: an inside-out cylinder, hot glow at the bottom, the hub, lights round the lip
  F(K, well(R, 6, seg(28, 14), { y: -3, color: 0x2a2d35 }));
  for (const y of [-1.4, -3.2]) F(K, well(R - 0.05, 0.25, seg(28, 14), { y, color: C.yellow }));
  G(K, well(R - 0.06, 0.3, seg(28, 14), { y: -5, color: 0xff9a3a }));
  G(K, disk(R, { y: -5.9, color: 0xa8401a }, 28));
  G(K, ring(R * 0.55, 0.35, { y: -5.7, color: 0xffb04a }, 24), ring(R * 0.3, 0.3, { y: -5.7, color: 0xffe0a0 }, 16));
  F(K, cyl(1.5, 1.8, 3.5, seg(12, 8), { y: -3, color: 0x3a3f48 }));
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; G(K, box(0.24, 0.2, 0.24, { x: Math.cos(a) * (R - 0.1), y: -0.3, z: Math.sin(a) * (R - 0.1), color: i % 2 ? C.cyan : C.violet })); }
  G(K, ring(R + 0.02, 0.06, { y: -0.12, color: C.cyan }, 32));
}

// A lift-fan rim segment: a steel lip with a hazard top and a lit outer edge.
function fanrim(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: C.steel }));
  F(K, box(p.w * 0.98, 0.04, p.d * 0.45, { y: 0.02, color: p.tint % 2 ? C.black : C.yellow }));
  trim(K, p.w, p.d, p.tint % 2 ? C.cyan : C.violet, { skip: 'ew', y: -0.12 });
  G(K, box(0.3, 0.16, 0.1, { y: -0.6, z: p.d / 2 + 0.04, color: C.amber }), box(0.3, 0.16, 0.1, { y: -0.6, z: -p.d / 2 - 0.04, color: C.cyan }));
}

// A parked VTOL fighter, drawn round its fuselage collider (top 0 = 3.2 m up; wings at −0.8, tail −0.3).
const VT_PAINT = [[0x8a93a0, 0x5e6774], [0x5e6a80, 0x3c4454], [0xb3a68a, 0x7d735e]];
function vtolStyle(K, p) {
  const [body, trim2] = VT_PAINT[(p.tint >= 0 ? p.tint : 0) % VT_PAINT.length];
  // fuselage, nose, spine, intakes; the cockpit lit from inside
  F(K, box(2.6, 2.2, 11, { y: -1.1, z: 0.5, color: body }));
  F(K, part(new THREE.ConeGeometry(1.35, 3.4, 4), { y: -1.1, z: -6.6, rx: -Math.PI / 2, ry: Math.PI / 4, sx: 0.95, sz: 0.8, color: body }));
  F(K, box(1.0, 0.25, 7, { y: 0.0, z: 1.6, color: trim2 }));
  K.add('glass', box(1.1, 0.32, 2.6, { y: 0.1, z: -3.6 }));
  G(K, box(0.8, 0.1, 1.2, { y: 0.02, z: -3.3, color: 0x2bd8a8 }));
  // formation lights: lit strips down the spine and the flanks (the fuselage top reads in the dark)
  for (const sx of [-1, 1]) G(K, box(0.06, 0.1, 6, { x: sx * 1.31, y: -0.2, z: 1.2, color: 0x6affb0 }));
  G(K, box(0.12, 0.08, 4.5, { y: 0.15, z: 2.2, color: 0x6affb0 }));
  for (const sx of [-1, 1]) {
    F(K, box(0.5, 1.2, 2.4, { x: sx * 1.5, y: -1.2, z: -1.4, color: C.dark })); // intake
    F(K, cyl(0.55, 0.65, 3.4, 8, { x: sx * 2.3, y: -1.7, z: 2.6, rx: Math.PI / 2, color: trim2 })); // engine pod
    G(K, cyl(0.48, 0.48, 0.1, 8, { x: sx * 2.3, y: -1.7, z: 4.32, rx: Math.PI / 2, color: 0x5fe8ff }), cyl(0.25, 0.25, 0.12, 6, { x: sx * 2.3, y: -1.7, z: 4.34, rx: Math.PI / 2, color: 0xe0ffff })); // nozzle glow
  }
  // wings with wing-tip lift fans, the violet chevrons of the fleet, nav lights
  F(K, box(13, 0.35, 3.6, { y: -0.975, z: 1.2, color: body }));
  F(K, box(12.6, 0.36, 0.5, { y: -0.97, z: -0.4, color: trim2 }));
  G(K, box(12.8, 0.08, 0.08, { y: -1.1, z: -0.62, color: C.violet }));
  for (const sx of [-1, 1]) {
    F(K, cyl(1.05, 1.05, 0.55, seg(12, 8), { x: sx * 5.4, y: -1.0, z: 1.2, color: trim2 }));
    G(K, ring(0.85, 0.07, { x: sx * 5.4, y: -0.7, z: 1.2, color: C.cyan }, 12));
    F(K, box(1.6, 0.04, 0.6, { x: sx * 3.2, y: -0.78, z: 1.4, ry: sx * 0.5, color: C.violet }));
    G(K, box(0.26, 0.2, 0.26, { x: sx * 6.5, y: -0.9, z: 1.2, color: sx < 0 ? C.navRed : C.green }));
  }
  // tailplane and the twin fins, a white strobe on top
  F(K, box(6.2, 0.3, 1.8, { y: -0.45, z: 5.6, color: body }));
  for (const sx of [-1, 1]) F(K, box(0.18, 2.0, 1.9, { x: sx * 1.9, y: 0.5, z: 5.5, rz: sx * 0.25, color: trim2 }), box(0.2, 0.3, 0.6, { x: sx * 2.1, y: 1.2, z: 5.9, rz: sx * 0.25, color: C.violet }));
  G(K, box(0.22, 0.22, 0.22, { x: 2.15, y: 1.55, z: 6.1, color: 0xffffff }), box(0.22, 0.22, 0.22, { x: -2.15, y: 1.55, z: 6.1, color: 0xffffff }));
  // landing gear down to the deck (3.2 below the top), a red anti-collision light under the belly
  for (const [x, z] of [[0, -4.6], [-1.6, 2.4], [1.6, 2.4]]) F(K, box(0.18, 1.0, 0.18, { x, y: -2.7, z, color: C.dark }), cyl(0.3, 0.3, 0.25, 8, { x, y: -3.05, z, rz: Math.PI / 2, color: C.black }));
  G(K, box(0.3, 0.16, 0.3, { y: -2.25, z: 0.5, color: C.navRed }));
}

// A deck tug: a low yellow tow tractor with an amber beacon, headlights and a lit top edge.
function tugStyle(K, p) {
  F(K, box(p.w, p.thick - 0.35, p.d, { y: -(p.thick - 0.35) / 2, color: C.yellow }));
  stripes(K, -p.w / 2 + 0.1, -p.d / 2 + 0.2, -p.w / 2 + 0.1, p.d / 2 - 0.2, -0.04, 0.12, 0.5);
  F(K, box(p.w * 0.9, 0.06, p.d * 0.4, { y: 0.0, z: p.d * 0.2, color: C.black }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, cyl(0.38, 0.38, 0.32, 8, { x: sx * (p.w / 2 - 0.05), y: -p.thick + 0.38, z: sz * p.d * 0.3, rz: Math.PI / 2, color: C.black }));
  trim(K, p.w, p.d, C.amber, { y: -0.08, h: 0.08 });
  for (const sx of [-1, 1]) G(K, box(0.4, 0.25, 0.06, { x: sx * 0.7, y: -0.6, z: -p.d / 2 - 0.03, color: 0xfff4d8 }), box(0.3, 0.2, 0.06, { x: sx * 0.75, y: -0.6, z: p.d / 2 + 0.03, color: C.navRed }));
  G(K, cyl(0.16, 0.16, 0.26, 6, { x: p.w / 2 - 0.3, y: 0.13, z: -p.d / 2 + 0.3, color: C.amber }));
}

// Munitions crates: drab boxes with banded stencils, an LED status strip, a lit top edge.
const AMMO = [C.olive, 0x4a5a64, 0x7a5a3a, 0x5a5a62];
const AMMO_LED = [C.green, C.cyan, C.amber, C.green];
function ammoStyle(K, p) {
  const t = (p.tint >= 0 ? p.tint : 0) % AMMO.length, col = AMMO[t];
  F(K, box(p.w, p.thick - 0.03, p.d, { y: -p.thick / 2 - 0.015, color: col }));
  litTop(K, p.w, p.d, col, 2.6, { amb: 1.6, step: 9 });
  F(K, box(p.w + 0.04, 0.3, p.d + 0.04, { y: -p.thick * 0.35, color: C.yellow }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, box(0.16, p.thick + 0.02, 0.16, { x: sx * (p.w / 2 - 0.06), y: -p.thick / 2, z: sz * (p.d / 2 - 0.06), color: C.oliveDk }));
  F(K, box(p.w * 0.5, 0.03, p.d * 0.2, { y: 0.012, color: 0xd8d4c0 }));
  trim(K, p.w, p.d, AMMO_LED[t], { y: -0.1, h: 0.07 });
  G(K, box(p.w * 0.36, 0.12, 0.05, { x: -p.w * 0.18, y: -p.thick * 0.62, z: p.d / 2 + 0.03, color: AMMO_LED[t] }), box(p.w * 0.36, 0.12, 0.05, { x: p.w * 0.18, y: -p.thick * 0.62, z: -p.d / 2 - 0.03, color: AMMO_LED[t] }));
}

// A deck elevator: a hazard-bordered plate with a hazard light bar round its lip, corner beacons, on a piston column.
function elevator(K, p) {
  litTop(K, p.w, p.d, 0x7a8394, 3, { lamps: [{ x: 0, z: 0, r: Math.max(p.w, p.d) * 0.6, c: C.lamp, k: 0.8 }] });
  F(K, box(p.w, p.thick - 0.04, p.d, { y: -p.thick / 2 - 0.04, color: C.hullDk }));
  const hw = p.w / 2, hd = p.d / 2;
  stripes(K, -hw + 0.3, -hd, -hw + 0.3, hd, 0, 0.6, 1.2); stripes(K, hw - 0.3, -hd, hw - 0.3, hd, 0, 0.6, 1.2);
  stripes(K, -hw, -hd + 0.3, hw, -hd + 0.3, 0, 0.6, 1.2); stripes(K, -hw, hd - 0.3, hw, hd - 0.3, 0, 0.6, 1.2);
  trim(K, p.w, p.d, C.amber, { dash: 0.6, gap: C.black, y: -0.25, h: 0.3 });
  G(K, box(p.w + 0.12, 0.08, p.d + 0.12, { y: -p.thick + 0.1, color: C.cyan }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) G(K, cyl(0.2, 0.2, 0.34, 6, { x: sx * (hw - 0.5), y: 0.17, z: sz * (hd - 0.5), color: C.amber }));
  const L = p.tint === 1 ? 10 : 14;
  for (const sx of [-1, 1]) F(K, cyl(0.35, 0.35, L, 8, { x: sx * hw * 0.5, y: -p.thick - L / 2, color: 0xc8ccd4 }), cyl(0.55, 0.55, 0.6, 8, { x: sx * hw * 0.5, y: -p.thick - 0.3, color: C.dark }));
}

// The control island: grey superstructure banded with lit windows, the fleet's violet stripe, floods
// aimed at the deck, a holo targeting display and radar screens, beacons.
const WIN = [C.port, 0x9ad8ff, C.port, 0xfff6e0, 0x7ae8ff, C.sodium];
function island(K, p) {
  const { w, d, thick: H } = p, t = p.tint;
  slab(K, p, 0x6a7282, 0x737d8b, 3, { lamps: [{ x: 0, z: 0, r: Math.max(w, d) * 0.55, c: C.lamp, k: 0.7 }] });
  F(K, box(w + 0.06, 0.6, d + 0.06, { y: -0.3, color: 0x4d5560 }));
  trim(K, w, d, C.cyan, { y: -0.62, h: 0.1, t: 0.08 });
  if (t === 0) { // tier 1: rows of lit windows, the stripe, the hull number, floods and the holo display
    let k = 0;
    for (const y of [-2.2, -3.6, -5.0, -8.2]) for (const f of [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, 0, d], [-w / 2, 0, 0, d]]) {
      if (y < -6 && f[0] < 0) continue; // the west face's lower half carries the display
      const n = Math.floor((f[2] || f[3]) / 1.6);
      for (let i = 0; i < n; i++) {
        k = (k * 7 + 3) % 11;
        const o = -(f[2] || f[3]) / 2 + (i + 0.5) * ((f[2] || f[3]) / n);
        if (k === 4) continue; // a dark one now and then
        G(K, box(f[2] ? 0.9 : 0.06, 0.6, f[3] ? 0.9 : 0.06, { x: f[2] ? o : f[0] + Math.sign(f[0]) * 0.02, y, z: f[3] ? o : f[1] + Math.sign(f[1]) * 0.02, color: WIN[k % WIN.length] }));
      }
    }
    G(K, box(w + 0.1, 0.45, d + 0.1, { y: -6.2, color: C.violet }));
    G(K, box(w + 0.1, 0.12, d + 0.1, { y: -1.2, color: C.cyan }));
    F(K, box(0.1, 2.8, 4.4, { x: -w / 2 - 0.05, y: -8.2, z: 9, color: C.white }), box(0.12, 2.2, 1.1, { x: -w / 2 - 0.08, y: -8.2, z: 7.9, color: C.dark }), box(0.12, 2.2, 1.1, { x: -w / 2 - 0.08, y: -8.2, z: 10.1, color: C.dark }));
    // floods on the west lip, aimed down at the deck
    for (const z of [-11, -2, 8]) flood(K, -w / 2 - 0.4, -0.5, z, -1, 0, C.lamp, 1.2);
    // the holo targeting display on the west face: a frame of cyan, a radar sweep, target boxes
    holo(K, -w / 2 - 0.15, -8.3, -3, 10, 3.2, -Math.PI / 2);
  } else { // the bridge / PRI-FLY: a raked glass band all round, screens glowing behind it
    const gy = t === 1 ? -2.4 : -2.2, gh = t === 1 ? 1.8 : 2.4;
    F(K, box(w + 0.1, gh, d + 0.1, { y: gy, color: 0x15181e }));
    let k = 0;
    for (const [len, nx, nz] of [[w, 0, 1], [w, 0, -1], [d, 1, 0], [d, -1, 0]]) for (let u = -len / 2 + 0.75; u < len / 2; u += 1.5) {
      k = (k * 5 + 2) % 13;
      const col = k < 5 ? 0x1a3a5a : k < 8 ? C.port : k < 10 ? 0x2be8ff : k < 12 ? 0x7bff4a : C.amber;
      G(K, box(nx ? 0.05 : 1.3, gh * 0.8, nz ? 0.05 : 1.3, { x: nx ? nx * (w / 2 + 0.08) : u, y: gy, z: nz ? nz * (d / 2 + 0.08) : u, color: col }));
    }
    F(K, box(w + 0.7, 0.25, d + 0.7, { y: gy - gh / 2 - 0.15, color: 0x3a414c }));
    G(K, box(w + 0.74, 0.08, d + 0.74, { y: gy - gh / 2 - 0.3, color: C.amber }));
    for (let x = -w / 2 + 1.5; x < w / 2; x += 3) F(K, box(0.12, gh, d + 0.26, { x, y: gy, color: 0x3a414c }));
    if (t === 2) for (const [sx, sz] of [[-1, -1], [1, 1], [-1, 1]]) F(K, cyl(0.08, 0.1, 4, 5, { x: sx * (w / 2 - 0.4), y: 2, z: sz * (d / 2 - 0.4), color: 0x2a2e36 })), G(K, box(0.3, 0.3, 0.3, { x: sx * (w / 2 - 0.4), y: 4.1, z: sz * (d / 2 - 0.4), color: C.navRed }));
    if (t === 1) for (const z of [-7, 3]) flood(K, -w / 2 - 0.3, -0.4, z, -0.9, 0.2, C.lamp, 1);
  }
  stripes(K, -w / 2, -d / 2 + 0.3, w / 2, -d / 2 + 0.3, 0, 0.35, 1.5); stripes(K, -w / 2, d / 2 - 0.3, w / 2, d / 2 - 0.3, 0, 0.35, 1.5);
  if (H > 12) for (let y = -12; y > -H + 2; y -= 4) F(K, box(w + 0.08, 0.15, d + 0.08, { y, color: 0x4d5560 })); // plating bands down to the deck
}
// A holographic display (glow): a frame, a radar scope with a sweep and rings, target boxes, a bar
// graph. Centred at (x, y, z), w × h, facing out along ry.
function holo(K, x, y, z, w, h, ry) {
  const c = Math.cos(ry), s = Math.sin(ry), at = (lx, ly, out = 0) => ({ x: x + lx * c + out * s, y: y + ly, z: z - lx * s + out * c, ry });
  F(K, box(w + 0.4, h + 0.4, 0.1, { ...at(0, 0, -0.06), color: 0x0c1420 }));
  for (const [lx, ly, ww, hh] of [[0, h / 2, w, 0.1], [0, -h / 2, w, 0.1], [w / 2, 0, 0.1, h], [-w / 2, 0, 0.1, h]]) G(K, box(ww, hh, 0.04, { ...at(lx, ly), color: C.cyan }));
  const rx = -w * 0.22, rr = h * 0.38;
  for (const k of [1, 0.66, 0.33]) G(K, part(new THREE.RingGeometry(rr * k - 0.05, rr * k, seg(24, 12)), { ...at(rx, 0, 0.02), color: 0x2bffb0 }));
  G(K, box(rr, 0.08, 0.03, { ...at(rx + rr * 0.35, rr * 0.2, 0.03), rz: 0.5, color: 0xb0ffd8 }));
  for (const [bx, by] of [[0.3, 0.4], [-0.5, -0.2], [0.2, -0.55]]) G(K, box(0.22, 0.22, 0.03, { ...at(rx + bx * rr, by * rr, 0.03), color: C.navRed }));
  for (let i = 0; i < 5; i++) { const bh = h * (0.2 + ((i * 37) % 7) / 10); G(K, box(w * 0.06, bh, 0.03, { ...at(w * 0.12 + i * w * 0.075, -h / 2 + 0.3 + bh / 2, 0.02), color: i === 3 ? C.amber : C.cyan })); }
  G(K, box(w * 0.36, 0.12, 0.03, { ...at(w * 0.27, h / 2 - 0.5, 0.02), color: C.amber }));
}

// The island's radar platform (tint 0) and mast (tint 1): lattice towers, a grated top, beacons.
function mast(K, p) {
  const { w, d, thick: H } = p, hw = w / 2 - 0.15, hd = d / 2 - 0.15;
  litTop(K, w, d, 0x5a6270, 1.5, { step: 9 });
  F(K, box(w, 0.3, d, { y: -0.17, color: 0x3e444e }));
  stripes(K, -w / 2, -d / 2 + 0.15, w / 2, -d / 2 + 0.15, 0, 0.25, 0.6); stripes(K, -w / 2, d / 2 - 0.15, w / 2, d / 2 - 0.15, 0, 0.25, 0.6);
  trim(K, w, d, C.amber, { y: -0.2, h: 0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, box(0.2, H, 0.2, { x: sx * hw, y: -H / 2, z: sz * hd, color: 0x8a93a0 }));
  for (let y = -1.5; y > -H; y -= 2) {
    F(K, box(w - 0.2, 0.12, 0.12, { y, z: hd, color: 0x6b7480 }), box(w - 0.2, 0.12, 0.12, { y, z: -hd, color: 0x6b7480 }));
    F(K, box(0.12, 0.12, d - 0.2, { x: hw, y, color: 0x6b7480 }), box(0.12, 0.12, d - 0.2, { x: -hw, y, color: 0x6b7480 }));
    F(K, box(0.08, 2.4, 0.08, { x: hw, y: y - 1, rx: 0.7, color: 0x6b7480 }), box(0.08, 2.4, 0.08, { x: -hw, y: y - 1, rx: -0.7, color: 0x6b7480 }));
  }
  for (let y = -3; y > -H; y -= 4) G(K, box(0.2, 0.2, 0.2, { x: hw + 0.12, y, z: hd + 0.12, color: C.navRed }));
  if (p.tint === 1) G(K, box(0.36, 0.36, 0.36, { x: hw, y: 0.2, z: hd, color: C.navRed }));
}

// A gantry landing: a grated plate, toe boards, an amber lit edge, under-bracing.
function gantry(K, p) {
  litTop(K, p.w, p.d, 0x6a7280, 1.5, { step: 4 });
  F(K, box(p.w, p.thick - 0.03, p.d, { y: -p.thick / 2 - 0.03, color: 0x353a42 }));
  for (const [x, z, w, d] of [[0, p.d / 2 - 0.05, p.w, 0.1], [0, -p.d / 2 + 0.05, p.w, 0.1], [p.w / 2 - 0.05, 0, 0.1, p.d], [-p.w / 2 + 0.05, 0, 0.1, p.d]]) F(K, box(w, 0.16, d, { x, y: 0.08, z, color: C.yellow }));
  trim(K, p.w, p.d, C.amber, { y: -0.12, h: 0.1 });
  for (const sx of [-1, 1]) F(K, box(0.16, 2.2, 0.16, { x: sx * (p.w / 2 - 0.4), y: -p.thick - 0.9, rz: sx * 0.5, color: 0x2a2e36 }));
  G(K, box(0.26, 0.26, 0.26, { x: p.w / 2 - 0.2, y: 0.25, z: p.d / 2 - 0.2, color: C.amber }));
}

// A deck-gun mount (tint 0: a round armoured sponson; tint 1: the hull's gun sponson).
function gunmount(K, p) {
  if (p.tint === 1) {
    slab(K, p, 0x5e6672, 0x4a515c, 3, { lamps: [{ x: 0, z: 0, r: 6, c: C.sodium, k: 0.8 }] });
    stripes(K, -p.w / 2, p.d / 2 - 0.3, p.w / 2, p.d / 2 - 0.3, 0, 0.5); stripes(K, -p.w / 2, -p.d / 2 + 0.3, p.w / 2, -p.d / 2 + 0.3, 0, 0.5);
    trim(K, p.w, p.d, C.amber, { dash: 0.6, gap: C.black, y: -0.22, h: 0.26 });
    F(K, part(new THREE.SphereGeometry(p.w * 0.45, seg(12, 8), seg(6, 4), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { y: -p.thick, color: C.hullDk }));
    for (let z = -p.d / 2 + 1; z < p.d / 2; z += 2) G(K, box(0.12, 0.12, 0.6, { x: p.w / 2 + 0.03, y: -1.2, z, color: C.amber }));
    return;
  }
  const r = Math.min(p.w, p.d) / 2;
  F(K, cyl(r, r + 0.3, p.thick - 0.02, 8, { y: -p.thick / 2 - 0.01, color: 0x4a515c, ry: Math.PI / 8 }));
  litDisc(K, r - 0.2, 0x5a6270, 2, { n: 8, lamps: [{ x: 0, z: 0, r: r, c: C.navRed, k: 0.9 }] });
  F(K, ring(r - 0.6, 0.12, { y: 0.06, color: C.yellow }, 16));
  G(K, part(new THREE.TorusGeometry(r + 0.02, 0.09, 3, 8), { rx: Math.PI / 2, ry: Math.PI / 8, y: -0.15, color: C.navRed }));
  for (const [x, z] of [[-r * 0.55, r * 0.4], [r * 0.5, r * 0.45]]) F(K, box(1.0, 0.5, 0.7, { x, y: 0.25, z, color: C.olive }));
  G(K, cyl(0.16, 0.16, 0.3, 6, { x: r - 0.4, y: 0.15, z: -r + 0.6, color: C.amber }));
}

// A jet blast deflector: a raised panel, raked back, on hydraulic struts, warning lights along its top.
function jbd(K, p) {
  F(K, box(p.w, 0.5, 3.0, { y: -0.95, z: 0.55, rx: -1.0, color: 0x6a7380 }));
  for (let x = -p.w / 2 + 0.6; x < p.w / 2; x += 1.2) F(K, box(0.16, 0.12, 2.9, { x, y: -0.8, z: 0.45, rx: -1.0, color: 0x50565f }));
  F(K, box(p.w, 0.3, p.d, { y: -0.15, color: 0x50565f }));
  stripes(K, -p.w / 2, 0, p.w / 2, 0, 0, 0.5, 0.8);
  trim(K, p.w, p.d, C.amber, { dash: 0.5, gap: C.black, y: -0.15, h: 0.2 });
  for (let x = -p.w / 2 + 0.5; x < p.w / 2; x += 1.5) G(K, box(0.3, 0.2, 0.2, { x, y: 0.12, z: -p.d / 2 + 0.2, color: C.navRed }));
  for (const sx of [-1, 0, 1]) F(K, box(0.25, 2.4, 0.25, { x: sx * p.w * 0.35, y: -1.4, z: 1.6, rx: 0.6, color: 0xc8ccd4 }));
}

// A catapult shuttle: a low yellow sled with a glowing tow bar and a lit outline.
function shuttle(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: C.yellow }));
  F(K, box(p.w * 0.6, 0.05, p.d * 0.9, { y: 0.0, color: C.black }));
  F(K, part(new THREE.ConeGeometry(p.w / 2, 1.0, 4), { y: -p.thick / 2, z: -p.d / 2 - 0.45, rx: -Math.PI / 2, ry: Math.PI / 4, sy: 1, sz: 0.4, color: C.yellow }));
  trim(K, p.w, p.d, C.cyan, { y: -0.1, h: 0.1 });
  G(K, box(0.3, 0.2, 1.4, { y: 0.08, z: -p.d / 2 + 0.6, color: C.cyan }));
}

// The hull under the flight deck: plated flanks, banded, long rows of lit ports, panel lines,
// navigation lights, the stern exhausts glowing hot.
function hullside(K, p) {
  const { w, d, thick: H } = p;
  F(K, box(w, H, d, { y: -H / 2, color: 0x4f5764 }));
  for (let y = -4; y > -H; y -= 6) F(K, box(w + 0.12, 0.3, d + 0.12, { y, color: 0x3c434e }));
  let k = 0;
  for (const sx of [-1, 1]) for (let z = -d / 2 + 3; z < d / 2; z += 2.5) for (const y of [-6, -9, -14, -20, -26]) { k = (k * 13 + 5) % 17; if (k < 4) continue; G(K, box(0.1, 0.45, 0.9, { x: sx * (w / 2 + 0.05), y, z, color: k % 3 ? C.port : 0x8ad8ff })); }
  for (const sx of [-1, 1]) for (const y of [-11, -17, -32]) G(K, box(0.14, 0.18, d, { x: sx * (w / 2 + 0.08), y, color: y === -17 ? C.cyan : C.violet }));
  for (const sx of [-1, 1]) for (let z = -d / 2 + 10; z < d / 2; z += 30) G(K, box(0.5, 0.5, 0.5, { x: sx * (w / 2 + 0.3), y: -3, z, color: sx < 0 ? C.navRed : C.green }));
  for (const sx of [-0.6, -0.2, 0.2, 0.6]) { // stern engine nozzles (south face)
    F(K, cyl(3.2, 3.6, 3, seg(12, 8), { x: sx * w, y: -H * 0.55, z: d / 2 + 1.5, rx: Math.PI / 2, color: 0x2c3038 }));
    G(K, disk(2.8, { x: sx * w, y: -H * 0.55, z: d / 2 + 3.05, rx: 0, color: 0x3ac8ff }, 12), disk(1.5, { x: sx * w, y: -H * 0.55, z: d / 2 + 3.1, rx: 0, color: 0xe8ffff }, 10));
    G(K, ring(3.3, 0.18, { x: sx * w, y: -H * 0.55, z: d / 2 + 3.0, rx: 0, color: C.hot }, 12));
  }
}

// ------------------------------------------------------------------ stage 2: under the wing
// A grated catwalk. tint: 0 plain, 1 hung on rods from the belly 12 m up, 2 from a deck 7.5 m up,
// 3 the weapons-hatch platform (rods, and a big hatch).
function catwalk(K, p) {
  const g = meterBox(p.w, 0.2, p.d, 1.5, { faces: ['py'], color: 0x4e545d }); g.translate(0, -0.1, 0); K.add('deck', g);
  F(K, box(p.w, p.thick - 0.03, p.d, { y: -p.thick / 2 - 0.03, color: 0x2e3239 }));
  const along = p.w >= p.d, L = along ? p.w : p.d, hw = p.w / 2, hd = p.d / 2;
  // edge rails (low: you can jump straight off), posts
  for (const s of [-1, 1]) F(K, box(along ? L : 0.08, 0.08, along ? 0.08 : L, { x: along ? 0 : s * (hw - 0.05), y: 0.45, z: along ? s * (hd - 0.05) : 0, color: C.yellow }));
  for (let t = -L / 2; t <= L / 2 + 0.01; t += 2.5) for (const s of [-1, 1]) F(K, box(0.07, 0.45, 0.07, { x: along ? t : s * (hw - 0.05), y: 0.22, z: along ? s * (hd - 0.05) : t, color: C.yellow }));
  const rod = p.tint === 1 || p.tint === 3 ? 12 : p.tint === 2 ? 7.5 : 0;
  if (rod) for (let t = -L / 2 + 1; t <= L / 2 - 0.9; t += Math.max(4, L / Math.max(1, Math.round(L / 6)))) for (const s of [-1, 1]) {
    const x = along ? t : s * (hw - 0.15), z = along ? s * (hd - 0.15) : t;
    F(K, box(0.12, rod, 0.12, { x, y: rod / 2, z, color: 0x50565f }));
  }
  if (p.tint === 3) { // the weapons hatch: a big square door with hazard edging and lamps
    F(K, box(7, 0.04, 7, { y: 0.02, z: 2, color: 0x23262c }));
    stripes(K, -3.6, -1.6, 3.6, -1.6, 0.01, 0.4, 0.9); stripes(K, -3.6, 5.6, 3.6, 5.6, 0.01, 0.4, 0.9);
    for (const sx of [-1, 1]) G(K, box(0.3, 0.2, 0.3, { x: sx * 3.4, y: 0.1, z: -1.4, color: C.navRed }));
  }
  for (const s of [-1, 1]) G(K, box(0.18, 0.12, 0.18, { x: along ? s * (L / 2 - 0.4) : hw - 0.2, y: -p.thick - 0.06, z: along ? hd - 0.2 : s * (L / 2 - 0.4), color: C.amber }));
}

// A hanging cargo pod: a ribbed container, its sling cables up to a hoist block p.tint metres above.
const POD = [0xd0762a, 0x5c6573, 0x3a6aa8, 0xc8c4b8];
function cargopod(K, p) {
  const col = POD[Math.abs(Math.round(p.x * 0.7 + p.z * 0.3)) % POD.length], { w, d, thick: H } = p;
  F(K, box(w, H, d, { y: -H / 2, color: col }));
  for (let x = -w / 2 + 0.5; x < w / 2; x += 1) F(K, box(0.12, H - 0.2, d + 0.06, { x, y: -H / 2, color: 0x2e3239 }));
  F(K, box(w + 0.06, 0.2, d + 0.06, { y: -0.1, color: 0x2e3239 }));
  stripes(K, -w / 2 + 0.1, -d / 2 + 0.15, w / 2 - 0.1, -d / 2 + 0.15, 0, 0.18, 0.6); stripes(K, -w / 2 + 0.1, d / 2 - 0.15, w / 2 - 0.1, d / 2 - 0.15, 0, 0.18, 0.6);
  const L = p.tint > 0 ? p.tint : 10, hy = Math.min(3, L * 0.3);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, strut([sx * (w / 2 - 0.2), 0, sz * (d / 2 - 0.2)], [0, hy, 0], 0.07, 0x1c1f26)); // slings to the hook block
  F(K, box(0.5, 0.6, 0.5, { y: hy + 0.3, color: C.yellow }));
  if (L > hy + 0.6) F(K, box(0.1, L - hy - 0.6, 0.1, { y: hy + 0.6 + (L - hy - 0.6) / 2, color: 0x1c1f26 }));
  G(K, box(0.2, 0.2, 0.2, { x: w / 2 - 0.2, y: -H + 0.1, z: d / 2 - 0.2, color: C.navRed }));
}

// A gun blister: a round armoured housing with a rounded belly, hazard ring on top.
function blisterStyle(K, p) {
  const r = p.r;
  F(K, cyl(r, r, p.thick * 0.6, seg(14, 10), { y: -p.thick * 0.3, color: 0x4f5764 }));
  F(K, part(new THREE.SphereGeometry(r, seg(14, 10), seg(6, 4), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), { y: -p.thick * 0.6, sy: 0.6, color: 0x3e4550 }));
  F(K, disk(r - 0.05, { y: 0.005, color: 0x454b55 }, 14));
  F(K, ring(r - 0.35, 0.1, { y: 0.05, color: C.yellow }, 14));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; G(K, box(0.16, 0.16, 0.16, { x: Math.cos(a) * r, y: -p.thick * 0.35, z: Math.sin(a) * r, color: C.amber })); }
  F(K, box(0.3, 6, 0.3, { y: 3, color: 0x3a414c })); // the hanger strut to the belly
}

// The port wing: its belly (a ceiling, the view up for the whole stage), its leading-edge flank, its top.
function wing(K, p) {
  const { w, d, thick: H } = p, hw = w / 2, hd = d / 2, B = -H;
  F(K, box(w, H - 0.1, d, { y: -H / 2 - 0.05, color: 0x4b525e }));
  const top = meterBox(w, 0.2, d, 6, { faces: ['py'], color: 0x8a93a2 }); top.translate(0, -0.1, 0); K.add('deck', top);
  // belly panels: a grid of slightly proud plates, alternate shades; light strips and hard points
  for (let x = -hw + 6; x < hw - 3; x += 11) for (let z = -hd + 6; z < hd - 3; z += 11) {
    const k = (Math.round(x / 11) + Math.round(z / 11)) & 1;
    F(K, box(10.4, 0.2, 10.4, { x, y: B - 0.1, z, color: k ? 0x4a515c : 0x555d69 }));
    if (((Math.round(x / 11) * 7 + Math.round(z / 11) * 3) % 5) === 0) F(K, box(3, 0.5, 6, { x, y: B - 0.35, z, color: 0x30353d }), box(2.6, 0.1, 5.6, { x, y: B - 0.62, z, color: 0x23272e }));
  }
  for (let x = -hw + 17; x < hw; x += 22) G(K, box(0.5, 0.12, d - 8, { x, y: B - 0.26, color: 0xffd08a }));
  for (let z = -hd + 9; z < hd; z += 18) G(K, box(w - 8, 0.12, 0.4, { y: B - 0.26, z, color: 0xffd08a }));
  N(K, box(3, 0.1, d - 4, { x: hw - 10, y: B - 0.25, color: C.violet }), box(1, 0.1, d - 4, { x: hw - 14, y: B - 0.25, color: C.violet }));
  // the flank (east face): plating bands, ports, hazard band under the top edge, the hull number
  for (let y = -3; y > -H; y -= 4) F(K, box(0.3, 0.35, d, { x: hw + 0.1, y, color: 0x3c434e }));
  for (let z = -hd + 4; z < hd; z += 5) G(K, box(0.12, 0.5, 1.2, { x: hw + 0.07, y: -8, z, color: 0xfff0c0 }));
  stripes(K, hw + 0.12, -hd, hw + 0.12, hd, -1.4, 0.06, 3);
  F(K, box(0.2, 0.9, d, { x: hw + 0.12, y: -1.2, color: C.yellow }));
  for (const [z, s] of [[-40, 1], [-70, -1]]) for (let k = 0; k < 2; k++) F(K, box(0.2, 8, 2.4, { x: hw + 0.15, y: -H / 2, z: z + k * 3.6 * s, color: C.white }));
  // the top: walkway lines, vents, edge lights
  for (const lx of [hw - 4, hw - 30]) F(K, box(0.4, 0.04, d, { x: lx, y: 0.02, color: C.yellow }));
  for (let z = -hd + 10; z < hd; z += 20) F(K, box(4, 0.4, 2, { x: hw - 17, y: 0.2, z, color: 0x3a414c }));
  lights(K, hw - 0.6, -hd + 2, hw - 0.6, hd - 2, 0.08, 10, C.navRed, 0.3);
}

// The engine nacelle: a chunky boxy pod, its intake (north) and glowing exhaust (south).
function nacelle(K, p) {
  const { w, d, thick: H } = p, hw = w / 2, hd = d / 2;
  slab(K, p, 0x5e6673, 0x59616d, 3);
  F(K, box(w + 0.3, 1.2, d * 0.98, { y: -H * 0.45, color: 0x464d58 }));
  for (let z = -hd + 5; z < hd; z += 5) F(K, box(w + 0.1, H - 1, 0.25, { y: -H / 2, z, color: 0x4b525d }));
  // intake: a dark round mouth in the north face with a lip ring (the fan turns inside it)
  F(K, ring(H * 0.44, 0.35, { y: -H / 2, z: -hd - 0.2, rx: 0, color: 0xc8ccd4 }, 20));
  F(K, well(H * 0.44, 3, seg(20, 12), { y: -H / 2, z: -hd + 1.4, rx: Math.PI / 2, color: 0x1a1d23 }));
  // exhaust: a nozzle ring and the afterglow
  F(K, part(new THREE.CylinderGeometry(H * 0.36, H * 0.46, 3, seg(16, 10), 1, true), { y: -H / 2, z: hd + 1.5, rx: Math.PI / 2, color: 0x2c3038 }));
  G(K, disk(H * 0.34, { y: -H / 2, z: hd + 1.2, rx: 0, color: 0xff8a3a }, 16));
  G(K, disk(H * 0.2, { y: -H / 2, z: hd + 1.3, rx: 0, color: 0xfff0b0 }, 12));
  for (const sx of [-1, 1]) {
    stripes(K, sx * (hw - 0.3), -hd, sx * (hw - 0.3), hd, 0, 0.4, 2);
    for (let z = -hd + 3; z < hd; z += 6) G(K, box(0.12, 0.3, 0.6, { x: sx * (hw + 0.17), y: -H * 0.45, z, color: C.amber }));
  }
  N(K, box(w + 0.2, 0.6, 3, { y: -H * 0.25, z: -hd + 4, color: C.violet }));
}
function pylon(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x4f5764 }));
  for (let z = -p.d / 2 + 2; z < p.d / 2; z += 4) F(K, box(p.w + 0.12, p.thick, 0.3, { y: -p.thick / 2, z, color: 0x3c434e }));
  for (const sx of [-1, 1]) F(K, cyl(0.25, 0.25, p.thick, 6, { x: sx * (p.w / 2 + 0.2), y: -p.thick / 2, z: p.d * 0.3, color: 0x2a2e36 }));
  stripes(K, -p.w / 2, -p.d / 2 + 0.2, p.w / 2, -p.d / 2 + 0.2, 0, 0.3, 0.75);
}
// The lift-fan hub (the carousel's axle) and its rotor pods.
function rotorhub(K, p) {
  const r = p.r;
  F(K, cyl(r, r * 0.8, p.thick, seg(16, 10), { y: -p.thick / 2, color: 0x4f5764 }));
  F(K, part(new THREE.ConeGeometry(r * 0.8, 2.5, seg(16, 10)), { y: -p.thick - 1.25, rx: Math.PI, color: 0x3a414c }));
  F(K, disk(r - 0.05, { y: 0.005, color: 0x454b55 }, 16));
  F(K, ring(r - 0.4, 0.12, { y: 0.06, color: C.yellow }, 16));
  F(K, ring(1.2, 0.1, { y: 0.06, color: C.yellow }, 12));
  G(K, ring(r + 0.05, 0.1, { y: -0.8, color: C.cyan }, 16));
  F(K, box(0.5, 15, 0.5, { y: 7.5, color: 0x3a414c })); // the drive shaft up to the belly
}
function rotorpod(K, p) {
  const r = p.r;
  F(K, cyl(r, r * 0.85, p.thick, seg(12, 8), { y: -p.thick / 2, color: 0x6b7480 }));
  F(K, disk(r - 0.05, { y: 0.005, color: 0x50565f }, 12));
  F(K, box(r * 1.2, 0.04, 0.4, { y: 0.02, color: C.yellow }), box(0.4, 0.04, r * 1.2, { y: 0.02, color: C.yellow }));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; F(K, cyl(0.4, 0.5, 0.6, 6, { x: Math.cos(a) * r * 0.6, y: -p.thick - 0.3, z: Math.sin(a) * r * 0.6, color: 0x2a2e36 })); G(K, disk(0.35, { x: Math.cos(a) * r * 0.6, y: -p.thick - 0.62, z: Math.sin(a) * r * 0.6, rx: Math.PI / 2, color: C.cyan }, 8)); }
  G(K, ring(r + 0.02, 0.08, { y: -0.4, color: C.violet }, 12));
}
// The radar dome and the dorsal spine on the wing top.
function dome(K, p) {
  const r = p.r;
  F(K, cyl(r * 0.72, r, p.thick, seg(16, 10), { y: -p.thick / 2, color: 0xd8dce4 }));
  F(K, disk(r * 0.72, { y: 0.005, color: 0xc8ccd4 }, 16));
  F(K, ring(r * 0.55, 0.12, { y: 0.05, color: C.yellow }, 16));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; F(K, box(0.12, p.thick * 1.02, 0.12, { x: Math.cos(a) * r * 0.86, y: -p.thick / 2, z: Math.sin(a) * r * 0.86, rz: Math.cos(a) * 0.4, rx: -Math.sin(a) * 0.4, color: 0x9aa2ae })); }
  G(K, box(0.3, 0.3, 0.3, { y: 0.2, color: C.navRed }));
}
function spine(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x5a6270 }));
  for (let z = -p.d / 2 + 8; z < p.d / 2; z += 16) F(K, box(0.4, 5, 5, { y: 2.5, z, rz: 0, color: 0x4b525e }), box(0.42, 0.6, 5.1, { y: 4.7, z, color: C.violet }));
  lights(K, 0, -p.d / 2 + 2, 0, p.d / 2 - 2, 0.1, 12, C.navRed, 0.3);
}

// ------------------------------------------------------------------ stage 3: the bomb bay
// Floor plate. tint 1: the south apron (the open loading ramp beyond its south edge), 2: west walkway
// (the bay doors along its east edge), 3: east walkway (doors on its west edge), 4: the north apron.
function bayfloor(K, p) {
  const { w, d, thick: H } = p, hw = w / 2, hd = d / 2, t = p.tint;
  slab(K, p, 0x5a606a, 0x3a3f48, 3);
  // guide lines
  for (const lx of [-hw + 3, hw - 3]) F(K, box(0.25, 0.04, d - 2, { x: lx, y: 0.02, color: C.yellow }));
  for (let z = -hd + 6; z < hd - 2; z += 12) F(K, box(w - 4, 0.04, 0.2, { y: 0.02, z, color: 0x8a8f98 }));
  // the edge on the doors: hazard stripes, edge lights, a door leaf hanging open below
  const door = (x0, z0, x1, z1, nx, nz) => {
    stripes(K, x0 - nx * 0.6, z0 - nz * 0.6, x1 - nx * 0.6, z1 - nz * 0.6, 0, 1.0, 1.6);
    lights(K, x0 - nx * 1.4, z0 - nz * 1.4, x1 - nx * 1.4, z1 - nz * 1.4, 0.05, 4, C.amber, 0.2);
    const L = Math.abs(x1 - x0) + Math.abs(z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    F(K, box(nx ? 0.4 : L, 12, nz ? 0.4 : L, { x: cx - nx * 2.4, y: -H - 6, z: cz - nz * 2.4, rz: nx * 0.35, rx: -nz * 0.35, color: 0x3e444e }));
    for (let k = -L / 2 + 3; k < L / 2; k += 6) F(K, box(nx ? 0.5 : 0.4, 12, nz ? 0.5 : 0.4, { x: cx - nx * 2.3 + (nz ? k : 0), y: -H - 6, z: cz - nz * 2.3 + (nx ? k : 0), rz: nx * 0.35, rx: -nz * 0.35, color: 0x2c3038 }));
  };
  if (t === 2) door(hw, -hd, hw, hd, 1, 0);
  if (t === 3) door(-hw, -hd, -hw, hd, -1, 0);
  if (t === 1) { // north edge opens on the doors (x −15 … 15); south edge: the ramp, down and out
    stripes(K, -15, -hd + 0.6, 15, -hd + 0.6, 0, 1.0, 1.6); lights(K, -15, -hd + 1.4, 15, -hd + 1.4, 0.05, 4, C.amber, 0.2);
    F(K, box(w - 4, 0.6, 14, { y: -6.5, z: hd + 6.4, rx: 0.55, color: 0x464c56 }));
    for (let x = -hw + 4; x < hw - 2; x += 4) F(K, box(0.3, 0.7, 14, { x, y: -6.4, z: hd + 6.4, rx: 0.55, color: C.yellow }));
    stripes(K, -hw, hd - 0.6, hw, hd - 0.6, 0, 1.0, 1.6);
  }
  if (t === 4) { stripes(K, -15, hd - 0.6, 15, hd - 0.6, 0, 1.0, 1.6); lights(K, -15, hd - 1.4, 15, hd - 1.4, 0.05, 4, C.amber, 0.2); }
  for (let x = -hw + 2; x < hw; x += 4) F(K, box(0.4, 1.2, d, { x, y: -H - 0.6, color: 0x2a2e36 })); // ribs under the floor
}
// Interior walls: hull ribs, pipes, lamps, the violet stripe. tint 0 west (faces +x), 1 east (−x), 2 north (+z).
function baywall(K, p) {
  const { w, d, thick: H } = p, t = p.tint;
  F(K, box(w, H, d, { y: -H / 2, color: 0x3c424c }));
  const nx = t === 0 ? 1 : t === 1 ? -1 : 0, nz = t === 2 ? 1 : 0;
  const face = nx ? nx * w / 2 : nz * d / 2, L = nx ? d : w;
  const at = (k, y, o, sz) => ({ x: nx ? face + nx * o : k, y, z: nz ? face + nz * o : k, ...sz });
  for (let k = -L / 2 + 3; k < L / 2; k += 6) F(K, box(nx ? 0.8 : 1.0, 30, nx ? 1.0 : 0.8, at(k, -15, 0.4, { color: 0x50565f }))); // ribs
  for (const y of [-6, -9, -21]) F(K, box(nx ? 0.5 : L, 0.5, nx ? L : 0.5, at(0, y, 0.6, { color: y === -9 ? 0x8a5a2a : 0x4a5058 }))); // pipes
  N(K, box(nx ? 0.15 : L, 0.4, nx ? L : 0.15, at(0, -16, 0.95, { color: C.violet })));
  stripes(K, nx ? face + nx * 0.2 : -L / 2, nz ? face + nz * 0.2 : -L / 2, nx ? face + nx * 0.2 : L / 2, nz ? face + nz * 0.2 : L / 2, -29.6, 0.3, 1.5);
  for (let k = -L / 2 + 6; k < L / 2; k += 12) {
    G(K, box(nx ? 0.2 : 2.2, 0.5, nx ? 2.2 : 0.2, at(k, -11.5, 0.9, { color: 0xffe0a0 })));
    G(K, box(nx ? 0.1 : 3.4, 2.2, nx ? 3.4 : 0.1, at(k + 3, -4.5, 0.05, { color: 0x14204a }))); // windows on the night
  }
}
function bayceiling(K, p) {
  const { w, d, thick: H } = p, B = -H;
  F(K, box(w, 0.4, d, { y: B + 0.2, color: 0x23262d }));
  for (let x = -w / 2 + 4; x < w / 2; x += 6) F(K, box(0.7, 1.2, d, { x, y: B - 0.6, color: 0x3a3f48 }));
  for (let z = -d / 2 + 6; z < d / 2; z += 12) F(K, box(w, 0.8, 0.5, { y: B - 0.4, z, color: 0x343840 }));
  for (let x = -24; x <= 24; x += 12) for (let z = -d / 2 + 12; z < d / 2 - 4; z += 16) {
    F(K, box(0.06, 2.6, 0.06, { x, y: B - 1.3, z, color: 0x18181c }));
    G(K, box(1.6, 0.3, 0.7, { x, y: B - 2.7, z, color: (x / 12 + Math.round(z / 16)) % 2 ? 0xffe2a8 : 0xd8ecff }));
  }
}
// The GRAND SLAM's release cradle, the bomb itself, and its box tail.
function cradle(K, p) {
  const { w, d, thick: H } = p;
  F(K, box(w, H, d, { y: -H / 2, color: 0x3a3f48 }));
  stripes(K, -w / 2 + 0.3, -d / 2, -w / 2 + 0.3, d / 2, 0, 0.5, 1.4); stripes(K, w / 2 - 0.3, -d / 2, w / 2 - 0.3, d / 2, 0, 0.5, 1.4);
  for (const z of [-d / 2 + 3, -d / 6, d / 6, d / 2 - 3]) {
    for (const sx of [-1, 1]) F(K, box(0.4, 13, 0.4, { x: sx * (w / 2 - 0.6), y: 6.5, z, color: 0x50565f }));
    F(K, box(w, 0.6, 0.8, { y: -H - 0.3, z, color: 0x2a2e36 }), box(0.8, 1.2, 0.8, { y: -H - 0.9, z, color: C.yellow })); // release hooks
  }
  for (const sz of [-1, 1]) G(K, box(0.3, 0.3, 0.3, { x: 0, y: 0.15, z: sz * (d / 2 - 0.3), color: C.navRed }));
}
function megabomb(K, p) {
  const r = 3.6, L = p.d, y = -r;
  F(K, part(new THREE.CylinderGeometry(r, r, L, seg(16, 12)), { y, rx: Math.PI / 2, color: C.olive }));
  F(K, part(new THREE.ConeGeometry(r, 6, seg(16, 12)), { y, z: -L / 2 - 3, rx: -Math.PI / 2, color: C.olive }));
  F(K, part(new THREE.CylinderGeometry(r + 0.04, r + 0.04, 1.2, seg(16, 12)), { y, z: -L / 2 + 2.2, rx: Math.PI / 2, color: C.yellow }));
  F(K, part(new THREE.CylinderGeometry(r + 0.04, r + 0.04, 0.6, seg(16, 12)), { y, z: -L / 2 + 4, rx: Math.PI / 2, color: C.yellow }));
  for (let z = -L / 2 + 8; z < L / 2; z += 6) F(K, part(new THREE.CylinderGeometry(r + 0.02, r + 0.02, 0.12, seg(16, 12)), { y, z, rx: Math.PI / 2, color: C.oliveDk }));
  for (const sx of [-1, 1]) F(K, box(0.1, 1.2, 9, { x: sx * (r + 0.01), y, z: 2, color: 0xd8d4c0 })); // the stencil block
  G(K, box(0.5, 0.5, 0.2, { y, z: -L / 2 - 5.8, color: C.navRed }));
}
function bombtail(K, p) {
  const { w, d, thick: H } = p, t = 0.35;
  for (const [x, y, ww, hh] of [[0, -t / 2, w, t], [0, -H + t / 2, w, t], [w / 2 - t / 2, -H / 2, t, H], [-w / 2 + t / 2, -H / 2, t, H]]) F(K, box(ww, hh, d, { x, y, color: C.olive }));
  F(K, box(t, H - 0.2, d, { y: -H / 2, rz: Math.PI / 4, sy: 1.38, color: C.oliveDk }), box(t, H - 0.2, d, { y: -H / 2, rz: -Math.PI / 4, sy: 1.38, color: C.oliveDk }));
  F(K, part(new THREE.CylinderGeometry(1.6, 3.4, d + 0.5, seg(14, 10)), { y: -H / 2, rx: Math.PI / 2, color: C.olive }));
  stripes(K, -w / 2, -d / 2 + 0.2, w / 2, -d / 2 + 0.2, 0, 0.3, 1.0); stripes(K, -w / 2, d / 2 - 0.2, w / 2, d / 2 - 0.2, 0, 0.3, 1.0);
  F(K, box(w * 0.6, 0.04, 1.2, { y: 0.02, color: C.yellow }));
}
// A bomb rack: steel posts and shelves of bombs, the top shelf a grated perch.
const BOMBS = [[C.olive, C.yellow], [0x5a6068, 0xe0313a], [0x6a5a3a, C.yellow], [0x3a4048, C.cyan]];
function bombrack(K, p) {
  const { w, d, thick: H } = p, hw = w / 2, hd = d / 2, [bc, band] = BOMBS[(p.tint >= 0 ? p.tint : 0) % BOMBS.length];
  const g = meterBox(w, 0.2, d, 1.5, { faces: ['py'], color: 0x50565f }); g.translate(0, -0.1, 0); K.add('deck', g);
  for (const sx of [-1, 1]) for (const sz of [-1, 0, 1]) F(K, box(0.3, H, 0.3, { x: sx * (hw - 0.15), y: -H / 2, z: sz * (hd - 0.15), color: 0xe8742a }));
  stripes(K, -hw, -hd + 0.2, hw, -hd + 0.2, 0, 0.3, 0.8); stripes(K, -hw, hd - 0.2, hw, hd - 0.2, 0, 0.3, 0.8);
  for (let y = 0; y > -H + 0.5; y -= 4) {
    F(K, box(w, 0.25, d, { y: y - 0.12, color: 0x3a3f48 })); // a shelf; bombs lie along z on the level below it
    const by = Math.max(y - 4, -H) + 0.75;
    for (let x = -hw + 1.2; x < hw - 0.8; x += 1.6) {
      F(K, part(new THREE.CylinderGeometry(0.6, 0.6, d - 3.2, seg(8, 6)), { x, y: by, z: 0.4, rx: Math.PI / 2, color: bc }));
      F(K, part(new THREE.ConeGeometry(0.6, 1.3, seg(8, 6)), { x, y: by, z: -hd + 1.85, rx: -Math.PI / 2, color: bc }));
      F(K, part(new THREE.CylinderGeometry(0.63, 0.63, 0.35, seg(8, 6)), { x, y: by, z: -hd + 3.2, rx: Math.PI / 2, color: band }));
      F(K, box(1.3, 1.3, 0.12, { x, y: by, z: hd - 1.4, color: bc }));
    }
  }
}
function rail(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x6b7480 }));
  F(K, box(p.w, 0.15, p.d * 2.4, { y: -p.thick - 0.075, color: 0x3a3f48 }));
  lights(K, -p.w / 2 + 1, 0, p.w / 2 - 1, 0, 0.04, 3, C.cyan, 0.14);
}
function sled(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: p.tint === 1 ? C.orange : C.yellow }));
  stripes(K, -p.w / 2, -p.d / 2 + 0.2, p.w / 2, -p.d / 2 + 0.2, 0, 0.3, 0.5); stripes(K, -p.w / 2, p.d / 2 - 0.2, p.w / 2, p.d / 2 - 0.2, 0, 0.3, 0.5);
  for (const sx of [-1, 1]) F(K, cyl(0.25, 0.25, 0.8, 8, { x: sx * p.w * 0.3, y: -p.thick - 0.05, rx: Math.PI / 2, color: C.dark }));
  G(K, box(0.2, 0.2, 0.2, { x: p.w / 2 - 0.2, y: 0.12, z: 0, color: C.amber }));
}
function cranebeam(K, p) {
  const { w, d, thick: H } = p;
  F(K, box(w, H, d, { y: -H / 2, color: C.yellow }));
  stripes(K, -w / 2, -d / 2 + 0.2, w / 2, -d / 2 + 0.2, 0, 0.3, 1.2); stripes(K, -w / 2, d / 2 - 0.2, w / 2, d / 2 - 0.2, 0, 0.3, 1.2);
  for (let x = -w / 2 + 2; x < w / 2; x += 4) F(K, box(0.25, 2.2, 0.25, { x, y: -H - 1.0, z: 0, rz: (x / 4) % 2 ? 0.7 : -0.7, color: 0x8a6a1a }));
  F(K, box(w, 0.3, 0.3, { y: -H - 2, color: 0x8a6a1a }));
  for (const sx of [-1, 1]) F(K, box(2, 3, d + 1, { x: sx * (w / 2 - 1), y: -H / 2 - 0.5, color: 0x3a3f48 }));
}
function craneload(K, p) {
  const { w, d, thick: H } = p, L = p.tint > 0 ? p.tint : 12;
  F(K, box(w, H, d, { y: -H / 2, color: 0x6a5a3a }));
  stripes(K, -w / 2, -d / 2 + 0.25, w / 2, -d / 2 + 0.25, 0, 0.4, 0.8); stripes(K, -w / 2, d / 2 - 0.25, w / 2, d / 2 - 0.25, 0, 0.4, 0.8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F(K, strut([sx * (w / 2 - 0.3), 0, sz * (d / 2 - 0.3)], [0, 3.1, 0], 0.08, 0x1c1f26));
  F(K, box(0.8, 0.8, 0.5, { y: 3.4, color: C.yellow }));
  F(K, box(0.14, L - 3.8, 0.14, { y: 3.8 + (L - 3.8) / 2, color: 0x1c1f26 }));
  F(K, box(3, 1.4, 4.2, { y: L + 0.7, color: 0x3a3f48 })); // the trolley on the beam
  G(K, box(0.3, 0.3, 0.3, { x: w / 2 - 0.3, y: 0.15, z: d / 2 - 0.3, color: C.amber }));
}
function gallery(K, p) {
  const { w, d, thick: H } = p;
  slab(K, p, 0x5a606a, 0x3a3f48, 3);
  stripes(K, -w / 2, d / 2 - 0.4, w / 2, d / 2 - 0.4, 0, 0.6, 1.2);
  for (let x = -w / 2 + 2; x < w / 2 - 1; x += 3) { // consoles along the back wall, screens lit
    F(K, box(2.4, 1.1, 1.0, { x, y: 0.55, z: -d / 2 + 0.6, color: 0x2a2e36 }));
    G(K, box(2.0, 0.6, 0.06, { x, y: 1.0, z: -d / 2 + 1.12, rx: -0.4, color: (x / 3) % 2 ? 0x2be8ff : 0x7bff4a }));
  }
  G(K, box(w, 0.4, 0.2, { y: -H + 0.4, z: d / 2 + 0.05, color: C.violet }));
  for (let x = -w / 2 + 1; x < w / 2; x += 2) G(K, box(0.12, 0.4, 0.12, { x, y: -1.5, z: d / 2 + 0.05, color: 0xffe0a0 }));
}

// ------------------------------------------------------------------ the boss arena
function bridgetop(K, p) {
  const r = p.r;
  const top = new THREE.CircleGeometry(r, seg(48, 24));
  const uv = top.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - 0.5) * r * 2 / 4, (uv.getY(i) - 0.5) * r * 2 / 4);
  K.add('deck', part(top, { rx: -Math.PI / 2, color: 0x535a64 }));
  // the tower: the bridge's window band just under the roof, then plated drum down to the deck
  F(K, cyl(r, r, 2.6, seg(48, 24), { y: -1.32, color: 0x4a515c }));
  K.add('glass', cyl(r - 0.3, r - 0.3, 2.4, seg(48, 24), { y: -4.0 }));
  for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; F(K, box(0.5, 2.5, 0.5, { x: Math.cos(a) * (r - 0.15), y: -4.0, z: Math.sin(a) * (r - 0.15), ry: -a, color: 0x2a2e36 })); }
  F(K, cyl(r + 0.6, r - 0.3, 1.2, seg(48, 24), { y: -5.8, color: 0x3a414c }));
  F(K, cyl(r - 0.6, r * 0.75, p.thick - 6.4, seg(32, 16), { y: -6.4 - (p.thick - 6.4) / 2, color: 0x4f5764 }));
  for (let y = -10; y > -p.thick + 2; y -= 6) G(K, ring(r * (0.97 - (-y - 6.4) / (p.thick - 6.4) * 0.22), 0.12, { y, color: (y / 6) % 2 ? C.amber : C.violet }, 32));
  // markings: a hazard ring round the plinth, guide spokes, the fleet's violet sigil, edge lights
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; F(K, box(1.9, 0.04, 0.6, { x: Math.cos(a) * 7, y: 0.02, z: Math.sin(a) * 7, ry: -a + Math.PI / 2, color: i % 2 ? C.black : C.yellow })); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; F(K, box(0.35, 0.04, 8, { x: Math.cos(a) * 15, y: 0.02, z: Math.sin(a) * 15, ry: -a + Math.PI / 2, color: C.white })); }
  N(K, part(new THREE.RingGeometry(17.2, 17.8, seg(48, 24)), { rx: -Math.PI / 2, y: 0.03, color: C.violet }));
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; G(K, box(0.3, 0.12, 0.3, { x: Math.cos(a) * (r - 1.6), y: 0.06, z: Math.sin(a) * (r - 1.6), color: i % 2 ? C.amber : C.cyan })); }
}
function exitpad(K, p) {
  slab(K, p, 0x535a64, 0x3a414c, 3);
  F(K, part(new THREE.RingGeometry(3.6, 4.1, seg(32, 16)), { rx: -Math.PI / 2, y: 0.03, z: 0.5, color: C.cyan }));
  stripes(K, -p.w / 2, -p.d / 2 + 0.3, p.w / 2, -p.d / 2 + 0.3, 0, 0.5, 1.2);
  for (const sx of [-1, 1]) stripes(K, sx * (p.w / 2 - 0.3), -p.d / 2, sx * (p.w / 2 - 0.3), p.d / 2, 0, 0.5, 1.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) G(K, box(0.3, 0.3, 0.3, { x: sx * (p.w / 2 - 0.6), y: 0.15, z: sz * (p.d / 2 - 0.6), color: C.cyan }));
}
function plinth(K, p) {
  const r = p.r;
  F(K, cyl(r, r + 0.4, p.thick, seg(24, 12), { y: -p.thick / 2, color: 0x3a3f48 }));
  F(K, disk(r - 0.05, { y: 0.005, color: 0x2c3038 }, 24));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; N(K, box(1.6, 0.06, 0.3, { x: Math.cos(a) * (r - 0.9), y: 0.03, z: Math.sin(a) * (r - 0.9), ry: -a, color: C.violet })); }
  G(K, ring(r + 0.15, 0.1, { y: -0.5, color: C.violet }, 24));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; F(K, box(1.2, p.thick, 0.8, { x: Math.cos(a) * (r + 0.3), y: -p.thick / 2, z: Math.sin(a) * (r + 0.3), ry: -a, color: C.yellow })); }
}
function pedestal(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x4a515c }));
  F(K, box(p.w + 0.3, 0.6, p.d + 0.3, { y: -p.thick + 0.3, color: 0x3a3f48 }));
  stripes(K, -p.w / 2, -p.d / 2 + 0.2, p.w / 2, -p.d / 2 + 0.2, 0, 0.35, 0.6); stripes(K, -p.w / 2, p.d / 2 - 0.2, p.w / 2, p.d / 2 - 0.2, 0, 0.35, 0.6);
  F(K, cyl(1.2, 1.2, 0.06, 8, { y: 0.02, color: 0x23262c }));
  for (const sx of [-1, 1]) G(K, box(0.12, 0.8, 0.12, { x: sx * (p.w / 2 + 0.02), y: -1.2, z: 0, color: C.navRed }));
}
function flaktower(K, p) {
  const { w, d, thick: H } = p;
  F(K, box(w, H, d, { y: -H / 2, color: 0x4f5764 }));
  F(K, box(w + 0.5, 0.5, d + 0.5, { y: -0.25, color: 0x3a414c }));
  for (let y = -2; y > -H + 1; y -= 2) F(K, box(w + 0.1, 0.12, d + 0.1, { y, color: 0x3c434e }));
  for (const f of [[0, d / 2], [0, -d / 2], [w / 2, 0], [-w / 2, 0]]) G(K, box(f[0] ? 0.08 : 2.2, 0.25, f[1] ? 0.08 : 2.2, { x: f[0] * 1.01, y: -1.4, z: f[1] * 1.01, color: 0xffb02b }));
  stripes(K, -w / 2, -d / 2 + 0.25, w / 2, -d / 2 + 0.25, 0, 0.4, 0.75); stripes(K, -w / 2, d / 2 - 0.25, w / 2, d / 2 - 0.25, 0, 0.4, 0.75);
  F(K, cyl(1.3, 1.3, 0.06, 8, { y: 0.02, color: 0x23262c }));
  for (let y = -0.8; y > -H; y -= 0.6) F(K, box(0.6, 0.06, 0.08, { x: w / 2 + 0.2, y, color: 0x9aa2ae })); // ladder rungs
}
function antenna(K, p) {
  mast(K, { ...p, tint: 0 });
  for (const [x, z, h] of [[0, 0, 6], [0.8, -0.6, 4], [-0.7, 0.7, 3]]) F(K, cyl(0.05, 0.08, h, 4, { x, y: h / 2, z, color: 0x9aa2ae })), G(K, box(0.22, 0.22, 0.22, { x, y: h + 0.1, z, color: C.navRed }));
  F(K, part(new THREE.CylinderGeometry(0.9, 0.2, 0.4, 8, 1, true), { x: -0.6, y: 1.4, z: -0.6, rx: 0.6, color: 0xd8dce4 }));
}
function sponson(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x4f5764 }));
  stripes(K, -p.w / 2, -p.d / 2 + 0.2, p.w / 2, -p.d / 2 + 0.2, 0, 0.35, 0.6); stripes(K, -p.w / 2, p.d / 2 - 0.2, p.w / 2, p.d / 2 - 0.2, 0, 0.35, 0.6);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { F(K, cyl(0.5, 0.6, 0.6, 8, { x: sx * 1.3, y: -p.thick - 0.3, z: sz * 1.3, color: 0x2a2e36 })); G(K, disk(0.45, { x: sx * 1.3, y: -p.thick - 0.62, z: sz * 1.3, rx: Math.PI / 2, color: C.cyan }, 8)); }
  G(K, box(p.w + 0.1, 0.12, 0.12, { y: -0.6, z: p.d / 2 + 0.02, color: C.violet }), box(p.w + 0.1, 0.12, 0.12, { y: -0.6, z: -p.d / 2 - 0.02, color: C.violet }));
}
function parapet(K, p) {
  F(K, box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0x3a414c }));
  F(K, box(p.w, 0.06, p.d * 0.6, { y: 0.03, color: C.yellow }));
  G(K, box(0.2, 0.12, 0.12, { y: -0.4, z: p.d / 2 + 0.02, color: C.navRed }));
}

export const STYLES = {
  'fortress-hidden': () => {},
  'fortress-runway': runway, 'fortress-fanwell': fanwell, 'fortress-fanrim': fanrim, 'fortress-vtol': vtolStyle,
  'fortress-tug': tugStyle, 'fortress-ammo': ammoStyle, 'fortress-elevator': elevator, 'fortress-island': island,
  'fortress-mast': mast, 'fortress-gantry': gantry, 'fortress-gunmount': gunmount, 'fortress-jbd': jbd,
  'fortress-shuttle': shuttle, 'fortress-hullside': hullside,
  'fortress-catwalk': catwalk, 'fortress-cargopod': cargopod, 'fortress-blister': blisterStyle, 'fortress-wing': wing,
  'fortress-nacelle': nacelle, 'fortress-pylon': pylon, 'fortress-rotorhub': rotorhub, 'fortress-rotorpod': rotorpod,
  'fortress-dome': dome, 'fortress-spine': spine,
  'fortress-bayfloor': bayfloor, 'fortress-baywall': baywall, 'fortress-bayceiling': bayceiling, 'fortress-cradle': cradle,
  'fortress-megabomb': megabomb, 'fortress-bombtail': bombtail, 'fortress-bombrack': bombrack, 'fortress-rail': rail,
  'fortress-sled': sled, 'fortress-cranebeam': cranebeam, 'fortress-craneload': craneload, 'fortress-gallery': gallery,
  'fortress-bridgetop': bridgetop, 'fortress-exitpad': exitpad, 'fortress-plinth': plinth, 'fortress-pedestal': pedestal,
  'fortress-flaktower': flaktower, 'fortress-antenna': antenna, 'fortress-sponson': sponson, 'fortress-parapet': parapet,
};
