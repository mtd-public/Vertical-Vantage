// EGYPT: platform styles for the INNER SANCTUM (limestone, granite, torchlight and cyan data glyphs)
// and the HALL OF JUDGMENT (basalt and gold, papyrus columns, canopic jars, the scales of Ma'at).
// Interior walls carry their side and their room's floor in tint (see egypt-kit.js walls()): the
// torches, glyph columns and friezes go on the inner face, at eye height.
import * as THREE from 'three';
import { COL, mix, shade, orient, strut, body, cap, bands, panel, archOn } from './egypt-styles.js';

const F = (K, ...g) => K.add('flat', ...g);
const G = (K, ...g) => K.add('glow', ...g);
const N = (K, ...g) => K.add('neon', ...g);
const SIDES = ['n', 's', 'w', 'e'];
const decode = (p) => { const t = p.tint >= 0 ? p.tint : 0; return { side: t % 4, floor: Math.floor(t / 4) - 40 }; };

// The inner face of a wall piece (its room is on that side): a face record like H.faces' entries.
function innerFace(p, H, side) {
  const fs = H.faces(p.w, p.d); // 0: -z, 1: +z, 2: +x, 3: -x
  return fs[[1, 0, 2, 3][side]]; // an 'n' wall (the room's -z side) faces +z into the room, and so on
}

// A hieroglyph, drawn in a few quads on face f (centred off along it, at height y, size s): bird,
// eye, reed, water, ankh, loaf, snake, sun. key 'neon' (cyan data glyphs) or 'flat' (painted).
function glyph(K, H, f, off, y, s, kind, col, key = 'neon', out = 0.04) {
  const q = (dx, dy, w, h) => panel(K, H, f, off + dx * s, y + dy * s, w * s, h * s, col, key, out);
  switch (kind % 8) {
    case 0: q(0, 0.05, 0.55, 0.32); q(0.3, 0.32, 0.22, 0.22); q(-0.05, -0.32, 0.08, 0.36); break; // a bird
    case 1: q(0, 0, 0.7, 0.16); q(0, 0, 0.22, 0.3); q(-0.15, -0.28, 0.08, 0.3); break; // the eye
    case 2: q(0, 0, 0.12, 0.9); q(0.12, 0.32, 0.22, 0.12); break; // a reed
    case 3: for (let k = 0; k < 4; k++) q(-0.3 + k * 0.2, (k % 2) * 0.1, 0.18, 0.08); break; // water
    case 4: q(0, -0.18, 0.12, 0.56); q(0, 0.12, 0.5, 0.1); q(0, 0.38, 0.32, 0.3); break; // the ankh
    case 5: q(0, 0, 0.6, 0.26); break; // a loaf
    case 6: q(-0.2, 0, 0.4, 0.1); q(0.05, 0.12, 0.1, 0.3); q(0.2, 0.25, 0.3, 0.1); break; // a snake
    default: q(0, 0, 0.42, 0.42); q(0, 0, 0.62, 0.08); break; // the sun
  }
}
// A column of glyphs from y0 down, n of them.
function glyphColumn(K, H, f, off, y0, n, s, seed, col, key = 'neon') {
  for (let k = 0; k < n; k++) glyph(K, H, f, off, y0 - k * s * 1.25, s, (seed * 7 + k * 3) % 8, col, key);
}
// A torch in a bracket on face f, its flame at height y.
function torch(K, H, f, off, y) {
  const x = f.nx * (f.half + 0.35) + f.tx * off, z = f.nz * (f.half + 0.35) + f.tz * off;
  F(K, H.box(f.tx ? 0.12 : 0.5, 0.12, f.tz ? 0.12 : 0.5, { x: f.nx * (f.half + 0.2) + f.tx * off, y: y - 0.55, z: f.nz * (f.half + 0.2) + f.tz * off, color: 0x2a2018 }));
  F(K, H.cyl(0.14, 0.08, 0.6, 6, { x, y: y - 0.35, z, color: COL.bronze }));
  G(K, H.part(new THREE.ConeGeometry(0.2, 0.55, 5), { x, y: y + 0.15, z, color: 0xffb040 }), H.part(new THREE.ConeGeometry(0.1, 0.32, 4), { x, y: y + 0.2, z, color: 0xfff0a0 }));
}
// Stars on a ceiling's underside (y): gold five-pointed stars as little crosses, spread by rng.
function stars(K, H, p, y, rng, n, col = 0xffd060) {
  for (let k = 0; k < n; k++) {
    const x = (rng() - 0.5) * (p.w - 1), z = (rng() - 0.5) * (p.d - 1), s = 0.3 + rng() * 0.25;
    G(K, H.box(s, 0.02, s * 0.25, { x, y, z, ry: rng() * 3, color: col }), H.box(s * 0.25, 0.02, s, { x, y, z, ry: rng() * 3, color: col }));
  }
}

// Decorate the inner face of an interior wall: a dado, glyph columns between torches, a frieze.
function tombDress(K, p, H, rng, o = {}) {
  const { side, floor } = decode(p), f = innerFace(p, H, side);
  if (f.width < 1.5) return;
  const y = (h) => floor + h - p.h; // a height above the room's floor, in the piece's local frame
  if (y(0) < -p.thick || y(1.0) > 0) return; // (a lintel over a door: nothing at eye height)
  panel(K, H, f, 0, y(0.45), f.width, 0.8, o.dado ?? 0x6a2a1a, 'flat', 0.02);
  if (y(4.6) < -0.3) {
    const fr = o.frieze ?? [COL.lapis, 0xc89030, 0xa83a2a];
    const n = Math.floor(f.width / 1.2);
    for (let k = 0; k < n; k++) panel(K, H, f, -f.width / 2 + (k + 0.5) * (f.width / n), y(4.6), f.width / n - 0.08, 0.5, fr[k % fr.length], 'flat', 0.025);
  }
  const step = o.torchEvery ?? 8;
  const nT = Math.max(1, Math.floor(f.width / step));
  for (let k = 0; k < nT; k++) {
    const off = -f.width / 2 + (k + 0.5) * (f.width / nT);
    if (o.torches !== false && f.width > 4) torch(K, H, f, off, y(2.7));
    for (const d of [-2.2, -1.2, 1.2, 2.2]) if (Math.abs(off + d) < f.width / 2 - 0.4 && rng() < 0.85) glyphColumn(K, H, f, off + d, y(3.6), 4, 0.42, Math.floor(rng() * 50), o.glyph ?? COL.cyan);
  }
}

export const TOMB = {
  // ================================================================ INNER SANCTUM
  'eg-tombFloor'(K, p, th, rng, H) {
    body(K, p, H, COL.limeDk);
    F(K, H.box(p.w, 0.05, p.d, { y: -0.025, color: 0xcab48a }));
    for (let x = -p.w / 2 + 2; x < p.w / 2; x += 2) F(K, H.box(0.05, 0.02, p.d, { x, y: 0.005, color: 0x9a8460 }));
    for (let z = -p.d / 2 + 3; z < p.d / 2; z += 3) F(K, H.box(p.w, 0.02, 0.05, { z, y: 0.005, color: 0x9a8460 }));
  },
  'eg-tombStep'(K, p, th, rng, H) { body(K, p, H, COL.limeDk); cap(K, p, H, 0xcab48a); },
  'eg-tombWall'(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    tombDress(K, p, H, rng);
  },
  'eg-tombCeil'(K, p, th, rng, H) { // the night sky of Nut: lapis and gold stars
    body(K, p, H, 0x2a2018);
    G(K, H.box(p.w, 0.05, p.d, { y: -p.thick - 0.02, color: 0x16225a }));
    stars(K, H, p, -p.thick - 0.06, rng, Math.min(60, Math.floor(p.w * p.d / 8)));
  },
  'eg-sarcophagus'(K, p, th, rng, H) { // a server sarcophagus: granite, a gilded lid, status lights along its flanks
    const t = p.tint >= 0 ? p.tint : 0;
    F(K, H.box(p.w - 0.1, p.thick - 0.3, p.d - 0.1, { y: -(p.thick + 0.3) / 2, color: COL.granite }));
    F(K, H.box(p.w + 0.1, 0.3, p.d + 0.1, { y: -0.15, color: COL.graniteDk }));
    F(K, H.box(p.w - 0.3, 0.06, p.d - 0.3, { y: 0.0, color: COL.gold }));
    const long = p.d > p.w;
    for (const f of H.faces(p.w - 0.1, p.d - 0.1)) {
      if (f.width < 2) { panel(K, H, f, 0, -0.9, 0.5, 0.7, COL.gold, 'flat', 0.02); continue; }
      const n = Math.floor(f.width / 0.5);
      for (let k = 0; k < n; k++) G(K, H.box(f.tx ? 0.14 : 0.04, 0.08, f.tz ? 0.14 : 0.04, { x: f.nx * (f.half + 0.03) + f.tx * (-f.width / 2 + (k + 0.5) * (f.width / n)), y: -0.7 - (k % 3) * 0.2, z: f.nz * (f.half + 0.03) + f.tz * (-f.width / 2 + (k + 0.5) * (f.width / n)), color: (k + t) % 4 ? 0x2bff9a : 0xff3a5a }));
      N(K, H.box(f.tx ? f.width - 0.2 : 0.04, 0.05, f.tz ? f.width - 0.2 : 0.04, { x: f.nx * (f.half + 0.03), y: -1.3, z: f.nz * (f.half + 0.03), color: COL.cyan }));
    }
    void long;
  },
  'eg-pedestal'(K, p, th, rng, H) {
    body(K, p, H, COL.granite);
    cap(K, p, H, COL.gold, COL.goldDk, 0.15);
    for (const f of H.faces(p.w, p.d)) glyph(K, H, f, 0, -0.7, 0.6, 4, COL.gold, 'neon');
  },
  'eg-slider'(K, p, th, rng, H) { // a sliding block: granite, carved glyphs relit cyan, glowing grooves
    body(K, p, H, COL.graniteDk);
    cap(K, p, H, COL.granite);
    for (const f of H.faces(p.w, p.d)) { glyph(K, H, f, 0, -p.thick / 2, Math.min(0.9, p.thick * 0.6), (p.tint >= 0 ? p.tint : 0) + f.ry * 2, COL.cyan); N(K, H.box(f.tx ? f.width : 0.05, 0.06, f.tz ? f.width : 0.05, { x: f.nx * (f.half + 0.02), y: -0.1, z: f.nz * (f.half + 0.02), color: COL.gold })); }
    G(K, H.box(p.w * 0.7, 0.05, p.d * 0.7, { y: -p.thick - 0.03, color: COL.cyan }));
  },
  'eg-galleryStep'(K, p, th, rng, H) { // a step of the Grand Gallery's floor; its riser faces down the slope
    body(K, p, H, COL.limeDk);
    F(K, H.box(p.w, 0.05, p.d, { y: -0.025, color: 0xcab48a }));
    for (const sx of [-1, 1]) F(K, H.box(0.6, 0.06, p.d, { x: sx * (p.w / 2 - 1.8), y: 0.0, color: 0x9a8460 })); // the ramp's slots
    const riser = H.faces(p.w, p.d)[1]; // +z: the downhill face
    for (let k = 0; k < 7; k++) glyph(K, H, riser, -p.w / 2 + 1 + k * 2, -1.2, 0.7, (p.tint >= 0 ? p.tint : 0) + k, COL.cyan);
    N(K, H.box(p.w, 0.06, 0.06, { y: -0.05, z: p.d / 2 + 0.03, color: COL.gold }));
  },
  'eg-corbel'(K, p, th, rng, H) { // a corbel shelf high up the gallery wall
    body(K, p, H, COL.lime);
    cap(K, p, H, 0xcab48a);
    const inner = p.x < 0 ? 2 : 3; // its free edge faces the gallery's middle
    const f = H.faces(p.w, p.d)[inner];
    N(K, H.box(0.05, 0.06, p.d, { x: f.nx * (f.half + 0.03), y: -p.thick + 0.06, color: COL.cyan }));
    F(K, H.box(0.06, 0.08, p.d, { x: f.nx * (f.half + 0.01), y: -0.04, color: COL.gold }));
  },
  'eg-galleryWall'(K, p, th, rng, H) { // the Grand Gallery's walls: seven corbelled courses climbing with the floor
    body(K, p, H, COL.lime);
    const { side } = decode(p), f = innerFace(p, H, side);
    if (side === 2 || side === 3) { // the long walls (x faces): per floor step, torches, glyphs and the corbel courses
      for (let i = 0; i < 10; i++) {
        const zm = -24 - 8 * i, floor = 4 + 2.4 * (i + 1), off = side === 2 ? p.z - zm : zm - p.z; // (west wall: its inner face runs toward -z)
        const y = (h) => floor + h - p.h;
        torch(K, H, f, off, y(2.8));
        for (const d of [-2.5, 2.5]) glyphColumn(K, H, f, off + d, y(4.6), 3, 0.45, i * 5 + d, COL.cyan);
        for (let c = 0; c < 6; c++) panel(K, H, f, off, y(8 + c * 1.1), 8.02, 0.9, c % 2 ? COL.lime : COL.limeSh, 'flat', 0.08 + c * 0.22); // the corbels step in
        panel(K, H, f, off, y(0.4), 8.02, 0.8, 0x6a2a1a, 'flat', 0.02);
      }
    } else if (f.width > 4) tombDress(K, p, H, rng);
  },
  'eg-galleryCeil'(K, p, th, rng, H) {
    body(K, p, H, 0x2a2018);
    G(K, H.box(10, 0.05, p.d, { y: -p.thick - 0.02, color: 0x16225a }));
    stars(K, H, { w: 10, d: p.d }, -p.thick - 0.06, rng, 10);
  },
  'eg-portcullis'(K, p, th, rng, H) { // a granite portcullis: grooved, a scanner line along its foot
    body(K, p, H, COL.granite);
    for (let x = -p.w / 2 + 0.8; x < p.w / 2; x += 1.6) for (const sz of [-1, 1]) F(K, H.box(0.18, p.thick - 0.4, 0.04, { x, y: -p.thick / 2, z: sz * (p.d / 2 + 0.01), color: COL.graniteDk }));
    for (const sz of [-1, 1]) { N(K, H.box(p.w, 0.1, 0.05, { y: -p.thick + 0.12, z: sz * (p.d / 2 + 0.03), color: 0xff2a5a })); glyph(K, H, H.faces(p.w, p.d)[sz < 0 ? 0 : 1], 0, -p.thick + 1.6, 1.0, 4, COL.gold, 'neon'); }
  },
  'eg-graniteFloor'(K, p, th, rng, H) {
    body(K, p, H, COL.graniteDk);
    F(K, H.box(p.w, 0.05, p.d, { y: -0.025, color: COL.granite }));
    for (let x = -p.w / 2 + 3.5; x < p.w / 2; x += 3.5) F(K, H.box(0.05, 0.02, p.d, { x, y: 0.005, color: COL.graniteDk }));
    for (let z = -p.d / 2 + 4; z < p.d / 2; z += 4) F(K, H.box(p.w, 0.02, 0.05, { z, y: 0.005, color: COL.graniteDk }));
    N(K, H.part(new THREE.RingGeometry(5.6, 5.8, H.seg(24, 14)), { rx: -Math.PI / 2, y: 0.02, color: COL.gold }));
  },
  'eg-graniteWall'(K, p, th, rng, H) {
    body(K, p, H, COL.granite);
    const { side, floor } = decode(p), f = innerFace(p, H, side);
    for (let y = floor + 2.2; y < p.h; y += 2.2) panel(K, H, f, 0, y - p.h, f.width, 0.05, COL.graniteDk, 'flat', 0.02); // the granite courses
    tombDress(K, p, H, rng, { dado: 0x3a1a1a, frieze: [COL.gold, COL.lapis], glyph: COL.cyan, torchEvery: 9 });
  },
  'eg-graniteCeil'(K, p, th, rng, H) {
    body(K, p, H, COL.graniteDk);
    for (let x = -p.w / 2 + 2.2; x < p.w / 2; x += 4) F(K, H.box(3.4, 0.4, p.d, { x, y: -p.thick - 0.2, color: COL.granite })); // the nine roof beams
    stars(K, H, p, -p.thick - 0.45, rng, 24, 0x7ae0ff);
  },
  'eg-kingServer'(K, p, th, rng, H) { // the king's server: a lidless granite coffer packed with glowing racks
    F(K, H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: COL.granite }));
    F(K, H.box(p.w - 0.6, 0.05, p.d - 0.6, { y: 0.0, color: 0x0c1020 }));
    for (let k = 0; k < 6; k++) G(K, H.box(p.w - 0.9, 0.04, 0.12, { y: 0.03, z: -p.d / 2 + 0.9 + k * ((p.d - 1.8) / 5), color: k % 2 ? COL.cyan : 0x2bff9a }));
    for (const f of H.faces(p.w, p.d)) { panel(K, H, f, 0, -p.thick / 2, Math.min(2.2, f.width - 0.4), 0.9, COL.gold, 'flat', 0.02); glyph(K, H, f, 0, -p.thick / 2, 0.55, 4, COL.lapis, 'flat', 0.05); }
    G(K, H.part(new THREE.TorusGeometry(0.35, 0.07, 3, 8), { y: 2.0, color: COL.cyan }), H.box(0.12, 1.0, 0.12, { y: 1.15, color: COL.cyan }), H.box(0.7, 0.12, 0.12, { y: 1.55, color: COL.cyan })); // a holographic ankh
  },
  'eg-beam'(K, p, th, rng, H) { // a relieving chamber's granite beam, data lines along it
    body(K, p, H, COL.granite);
    for (let x = -p.w / 2 + 3.5; x < p.w / 2; x += 3.5) F(K, H.box(0.06, p.thick + 0.02, p.d + 0.02, { x, y: -p.thick / 2, color: COL.graniteDk }));
    cap(K, p, H, mix(COL.granite, 0xffffff, 0.08));
    for (const sz of [-1, 1]) N(K, H.box(p.w, 0.06, 0.04, { y: -p.thick / 2, z: sz * (p.d / 2 + 0.02), color: (p.tint >= 0 ? p.tint : 0) % 2 ? COL.cyan : COL.magenta }));
  },
  'eg-shaftWall'(K, p, th, rng, H) {
    body(K, p, H, COL.lime);
    const f = innerFace(p, H, p.tint >= 0 ? p.tint % 4 : 0);
    for (let y = -2; y > -p.thick; y -= 2.6) N(K, H.box(f.tx ? f.width : 0.04, 0.05, f.tz ? f.width : 0.04, { x: f.nx * (f.half + 0.02), y, z: f.nz * (f.half + 0.02), color: COL.cyan }));
    if (f.width > 4) for (let y = -p.thick + 4.4 + (p.tint % 2) * 2.6; y < -2; y += 5.2) torch(K, H, f, 0, y); // torches all the way up the climb
  },
  'eg-shaftLedge'(K, p, th, rng, H) {
    body(K, p, H, COL.limeDk);
    cap(K, p, H, 0xcab48a);
    const free = H.faces(p.w, p.d)[p.x < 0 ? 2 : 3];
    N(K, H.box(0.05, 0.06, p.d, { x: free.nx * (free.half + 0.03), y: -0.06, color: (p.tint >= 0 ? p.tint : 0) % 2 ? COL.gold : COL.cyan }));
  },
  'eg-starFloor'(K, p, th, rng, H) {
    body(K, p, H, COL.limeDk);
    F(K, H.box(p.w, 0.05, p.d, { y: -0.025, color: 0x1a2a6a }));
    stars(K, H, p, 0.02, rng, 8);
  },
  'eg-starWall'(K, p, th, rng, H) {
    body(K, p, H, 0x1a2a6a);
    const { side } = decode(p), f = innerFace(p, H, side);
    for (let k = 0; k < Math.floor(f.width / 1.6); k++) for (let r = 0; r < 4; r++) G(K, H.box(f.tx ? 0.28 : 0.03, 0.28, f.tz ? 0.28 : 0.03, { x: f.nx * (f.half + 0.03) + f.tx * (-f.width / 2 + 0.8 + k * 1.6 + (r % 2) * 0.8), y: -1.2 - r * 2, z: f.nz * (f.half + 0.03) + f.tz * (-f.width / 2 + 0.8 + k * 1.6 + (r % 2) * 0.8), color: 0xffd060 }));
  },
  'eg-starCeil'(K, p, th, rng, H) { // the Star Chamber's roof: the capstone's light pours down the opening
    body(K, p, H, 0x101a50);
    G(K, H.box(p.w, 0.05, p.d, { y: -p.thick - 0.02, color: 0x16225a }));
    stars(K, H, p, -p.thick - 0.06, rng, 30);
    G(K, H.box(4.4, 0.05, 4.4, { y: -p.thick - 0.08, z: -4, color: 0xfff4c8 })); // the capstone's light, pouring in
    for (let k = 0; k < 4; k++) G(K, H.box(4.6 - k * 0.5, 0.04, 0.12, { y: -p.thick - 0.1, z: -4 - 2.4 - k * 0.5, color: 0xffd890 }), H.box(4.6 - k * 0.5, 0.04, 0.12, { y: -p.thick - 0.1, z: -4 + 2.4 + k * 0.5, color: 0xffd890 }));
  },
  'eg-rockFloor'(K, p, th, rng, H) {
    body(K, p, H, 0x6a5038);
    F(K, H.box(p.w, 0.05, p.d, { y: -0.025, color: 0x8a6a48 }));
    for (let k = 0; k < Math.floor(p.w * p.d / 20); k++) F(K, H.part(new THREE.DodecahedronGeometry(0.4 + rng() * 0.5, 0), { x: (rng() - 0.5) * (p.w - 1), y: -0.15, z: (rng() - 0.5) * (p.d - 1), sy: 0.4, color: 0x7a5a3e }));
  },
  'eg-rockWall'(K, p, th, rng, H) {
    body(K, p, H, 0x5a4230);
    const { side, floor } = decode(p), f = innerFace(p, H, side);
    for (let k = 0; k < Math.floor(f.width / 2.4); k++) F(K, H.part(new THREE.DodecahedronGeometry(1.0 + rng() * 0.8, 0), { x: f.nx * f.half + f.tx * (-f.width / 2 + 1.2 + k * 2.4), y: floor - p.h + 1 + rng() * 6, z: f.nz * f.half + f.tz * (-f.width / 2 + 1.2 + k * 2.4), color: 0x6a4e36 }));
    if (f.width > 8) torch(K, H, f, 0, floor - p.h + 2.6);
  },
  'eg-rockCeil'(K, p, th, rng, H) {
    body(K, p, H, 0x4a3628);
    for (let k = 0; k < 12; k++) F(K, H.part(new THREE.ConeGeometry(0.4 + rng() * 0.4, 1.2 + rng() * 1.4, 5), { x: (rng() - 0.5) * (p.w - 2), y: -p.thick - 0.8, z: (rng() - 0.5) * (p.d - 2), rx: Math.PI, color: 0x5a4230 }));
  },
  'eg-rock'(K, p, th, rng, H) { // the rough rock pillar in the bottomless pit (the portal waits on it)
    F(K, H.cyl(p.r, p.r * 1.3, p.thick, 7, { y: -p.thick / 2, color: 0x6a5038 }));
    for (let k = 0; k < 6; k++) F(K, H.part(new THREE.DodecahedronGeometry(0.9, 0), { x: Math.cos(k) * p.r, y: -1.5 - k * 1.8, z: Math.sin(k) * p.r, color: 0x7a5a3e }));
    cap(K, p, H, 0x8a6a48, null, 0, 7);
    N(K, H.cyl(p.r + 0.05, p.r + 0.05, 0.08, 7, { y: -0.3, color: COL.magenta }));
  },

  // ================================================================ HALL OF JUDGMENT
  'eg-judgmentFloor'(K, p, th, rng, H) { // basalt, a gold-inlaid aisle from the gate to the scales
    body(K, p, H, 0x1a1820);
    F(K, H.box(p.w, 0.05, p.d, { y: -0.025, color: 0x2a2630 }));
    for (let x = -p.w / 2 + 4; x < p.w / 2; x += 4) F(K, H.box(0.06, 0.02, p.d, { x, y: 0.005, color: 0x14121a }));
    for (let z = -p.d / 2 + 4; z < p.d / 2; z += 4) F(K, H.box(p.w, 0.02, 0.06, { z, y: 0.005, color: 0x14121a }));
    for (const sx of [-1, 1]) N(K, H.box(0.14, 0.03, 40, { x: sx * 3.5, y: 0.02, z: 6, color: COL.gold }));
    N(K, H.part(new THREE.RingGeometry(13.2, 13.6, H.seg(40, 24)), { rx: -Math.PI / 2, y: 0.02, z: -16, color: COL.gold }));
    N(K, H.part(new THREE.RingGeometry(12.2, 12.35, H.seg(40, 24)), { rx: -Math.PI / 2, y: 0.02, z: -16, color: COL.cyan }));
    for (let k = 0; k < 9; k++) F(K, H.part(new THREE.CircleGeometry(0.9, 4), { rx: -Math.PI / 2, y: 0.015, z: 22 - k * 3.6, color: k % 2 ? COL.lapis : COL.goldDk })); // lotus stones down the aisle
    for (const [x, z] of [[-30, -24], [30, -24], [-30, 24], [30, 24]]) { // braziers in the corners
      F(K, H.cyl(0.9, 0.5, 1.4, 6, { x, y: 0.7, z, color: COL.bronze }));
      G(K, H.part(new THREE.ConeGeometry(0.75, 1.3, 6), { x, y: 2.0, z, color: 0xff9a30 }), H.part(new THREE.ConeGeometry(0.4, 0.9, 5), { x, y: 2.1, z, color: 0xfff0a0 }));
    }
  },
  'eg-pylon'(K, p, th, rng, H) { // the hall's walls: sandstone reliefs, glyph columns, a winged sun over the gate
    body(K, p, H, 0x8a6e4e);
    const { side, floor } = decode(p), f = innerFace(p, H, side), y = (h) => floor + h - p.h;
    if (f.width < 2) return;
    bands(K, p, H, -0.5, -1.4, 1, 0x6a5038, 0.6, 0.06);
    const n = Math.floor(f.width / 3);
    for (let k = 0; k < n; k++) {
      const off = -f.width / 2 + (k + 0.5) * (f.width / n);
      glyphColumn(K, H, f, off, y(9.5), 6, 0.6, k + side * 13, k % 3 ? COL.cyan : COL.gold);
    }
    panel(K, H, f, 0, y(0.6), f.width, 1.2, 0x3a2a20, 'flat', 0.02);
    panel(K, H, f, 0, y(11.2), f.width, 0.5, COL.lapis, 'flat', 0.03);
    N(K, H.box(f.tx ? f.width : 0.05, 0.08, f.tz ? f.width : 0.05, { x: f.nx * (f.half + 0.05), y: y(10.8), z: f.nz * (f.half + 0.05), color: COL.gold }));
    if (side === 1 && Math.abs(p.x) < 1 && p.thick < 5) { // the gate's lintel: the winged sun disc
      G(K, H.cyl(0.9, 0.9, 0.1, 12, { x: 0, y: -1.4, z: f.nz * (f.half + 0.12), rx: Math.PI / 2, color: 0xffb030 }));
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) N(K, H.box(3.6 - k * 0.6, 0.18, 0.06, { x: sx * (2.6 + k * 0.1), y: -1.0 - k * 0.25, z: f.nz * (f.half + 0.1), color: k % 2 ? COL.lapis : COL.gold }));
    }
    for (let k = 0; k < Math.floor(f.width / 9); k++) { // braziers along the top of the walls
      const off = -f.width / 2 + 4.5 + k * 9;
      G(K, H.part(new THREE.ConeGeometry(0.6, 1.2, 5), { x: f.nx * (f.half - 1) + f.tx * off, y: 0.9, z: f.nz * (f.half - 1) + f.tz * off, color: 0xff8a2a }));
    }
  },
  'eg-dais'(K, p, th, rng, H) { // the throne dais, and Osiris enthroned against the north wall
    body(K, p, H, COL.graniteDk);
    for (let k = 1; k <= 3; k++) F(K, H.box(p.w + k * 0.8, p.thick * (k / 4), 0.8, { y: -p.thick + p.thick * (k / 8), z: p.d / 2 + (4 - k) * 0.4 - 0.4, color: k % 2 ? COL.granite : COL.graniteDk })); // steps down the front
    cap(K, p, H, 0x3a2a2a, COL.gold, 0.12);
    const z = -p.d / 2 - 0.4; // the god sits at the back, larger than life
    F(K, H.box(5, 3.2, 3, { y: 1.6, z: z + 0.4, color: COL.lapisDk }), H.box(5.4, 7, 0.6, { y: 3.5, z: z - 0.6, color: COL.goldDk })); // throne
    F(K, H.box(3, 4.2, 2.2, { y: 4.8, z: z + 0.2, color: 0xe8e4da })); // the wrapped body
    F(K, H.box(1.6, 1.7, 1.6, { y: 7.7, z: z + 0.3, color: 0x2a8a5a })); // the green face
    F(K, H.part(new THREE.ConeGeometry(0.9, 2.4, 6), { y: 9.7, z: z + 0.3, color: 0xf4f0e4 })); // the white crown
    for (const sx of [-1, 1]) F(K, H.part(new THREE.ConeGeometry(0.3, 2.0, 3), { x: sx * 1.0, y: 9.3, z: z + 0.3, rz: sx * 0.4, color: COL.white })); // its plumes
    F(K, H.box(0.18, 2.6, 0.18, { x: -0.9, y: 5.6, z: z + 1.4, rx: 0.4, color: COL.gold }), H.box(0.18, 2.6, 0.18, { x: 0.9, y: 5.6, z: z + 1.4, rx: 0.4, color: COL.lapis })); // crook and flail
    G(K, H.box(0.9, 0.12, 0.06, { y: 7.9, z: z + 1.12, color: COL.cyan }));
  },
  'eg-column'(K, p, th, rng, H) { // a papyrus column: painted bands, an open-flower capital, its abacus the perch
    const t = p.tint >= 0 ? p.tint : 0;
    F(K, H.cyl(p.r * 0.72, p.r * 0.8, p.thick - 2.2, 10, { y: -2.2 - (p.thick - 2.2) / 2, color: 0xc8a676 }));
    for (let y = -3, k = 0; y > -p.thick + 0.5; y -= 1.4, k++) F(K, H.cyl(p.r * 0.74, p.r * 0.74, 0.5, 10, { y, color: [COL.lapis, 0xa83a2a, COL.goldDk, 0x2a8a5a][(k + t) % 4] }));
    F(K, H.part(new THREE.CylinderGeometry(p.r * 1.05, p.r * 0.72, 1.8, 10, 1, true), { y: -1.3, color: 0x2a8a5a }));
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; F(K, H.box(0.1, 1.8, 0.1, { x: Math.cos(a) * p.r * 0.9, y: -1.3, z: Math.sin(a) * p.r * 0.9, ...orient(Math.cos(a) * 0.18, 1, Math.sin(a) * 0.18), color: COL.gold })); }
    F(K, H.cyl(p.r, p.r, 0.4, 10, { y: -0.2, color: COL.limeDk }));
    cap(K, p, H, 0xcab48a, null, 0, 10);
    N(K, H.cyl(p.r * 0.75, p.r * 0.75, 0.08, 10, { y: -p.thick + 0.6, color: COL.cyan }));
  },
  'eg-canopic'(K, p, th, rng, H) { // a canopic jar: alabaster, its lid a god's head (human, baboon, jackal, falcon)
    const t = p.tint >= 0 ? p.tint : 0, pts = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push(new THREE.Vector2(p.r * (0.55 + 0.45 * Math.sin(u * Math.PI * 0.9 + 0.2)), -p.thick + u * (p.thick - 1.0))); }
    F(K, H.part(new THREE.LatheGeometry(pts, 10), { color: COL.alabaster }));
    for (const y of [-p.thick + 0.8, -1.6]) N(K, H.cyl(p.r * 0.95, p.r * 0.95, 0.1, 10, { y, color: COL.gold }));
    glyph(K, H, { nx: 0, nz: 1, tx: -1, tz: 0, half: p.r * 0.98, ry: 0 }, 0, -p.thick * 0.5, 0.7, 4 + t, COL.lapis, 'flat', 0.02);
    const head = [0xd8a878, 0x8a6a4a, 0x1a1a22, 0x6a4a2a][t % 4];
    F(K, H.cyl(p.r * 0.75, p.r * 0.85, 1.0, 10, { y: -0.5, color: head }));
    cap(K, p, H, mix(head, 0xffffff, 0.1), null, 0, 10);
    if (t % 4 === 2) for (const sx of [-1, 1]) F(K, H.part(new THREE.ConeGeometry(0.2, 0.7, 3), { x: sx * 0.4, y: 0.3, z: -0.2, color: head })); // the jackal's ears
    if (t % 4 === 3) F(K, H.part(new THREE.ConeGeometry(0.22, 0.6, 4), { y: -0.4, z: p.r * 0.85, rx: Math.PI / 2, color: COL.goldDk })); // the falcon's beak
    F(K, H.box(p.r * 1.2, 0.12, 0.04, { y: -0.45, z: p.r * 0.83, color: COL.dark }));
    G(K, H.part(new THREE.RingGeometry(p.r * 1.2, p.r * 1.45, 10), { rx: -Math.PI / 2, y: -p.thick + 0.04, color: 0x3a6a8a }));
  },
  'eg-scalePost'(K, p, th, rng, H) { // the fulcrum post of the scales; the pivot rises over its top
    F(K, H.cyl(p.r * 0.8, p.r * 1.3, p.thick, 10, { y: -p.thick / 2, color: COL.goldDk }));
    for (let y = -2; y > -p.thick; y -= 2.4) F(K, H.cyl(p.r * 1.05, p.r * 1.05, 0.3, 10, { y, color: COL.lapis }));
    F(K, H.cyl(p.r * 2.2, p.r * 2.6, 1.0, 10, { y: -p.thick + 0.5, color: COL.graniteDk }));
    cap(K, p, H, COL.gold, null, 0, 10);
    F(K, H.box(0.22, 3.0, 0.22, { x: 0, y: 1.5, z: -0.7, color: COL.gold }), H.box(0.22, 3.0, 0.22, { x: 0, y: 1.5, z: 0.7, color: COL.gold }));
    N(K, H.cyl(p.r * 1.06, p.r * 1.06, 0.08, 10, { y: -1, color: COL.cyan }));
  },
  'eg-scalePan'(K, p, th, rng, H) { // a scale pan on three chains; the heart (left) or Ma'at's feather (right)
    const pts = [new THREE.Vector2(0.01, -p.thick), new THREE.Vector2(p.r * 0.6, -p.thick + 0.05), new THREE.Vector2(p.r, -0.1), new THREE.Vector2(p.r + 0.1, 0.05)];
    F(K, H.part(new THREE.LatheGeometry(pts, H.seg(18, 10)), { color: COL.gold }));
    F(K, H.cyl(p.r - 0.05, p.r - 0.05, 0.05, H.seg(18, 10), { y: -0.03, color: COL.goldDk }));
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; F(K, strut(H, [Math.cos(a) * (p.r - 0.1), 0.1, Math.sin(a) * (p.r - 0.1)], [0, 12, 0], 0.07, COL.goldDk)); }
    N(K, H.part(new THREE.TorusGeometry(p.r + 0.05, 0.05, 3, H.seg(18, 10)), { rx: Math.PI / 2, y: 0.05, color: COL.cyan }));
    if ((p.tint >= 0 ? p.tint : 0) === 0) { // the heart, in its jar
      F(K, H.part(new THREE.SphereGeometry(0.45, 6, 4), { x: p.r - 0.8, y: 0.45, color: 0xa81a2a }), H.box(0.3, 0.3, 0.3, { x: p.r - 0.8, y: 0.95, color: 0xa81a2a }));
      G(K, H.part(new THREE.SphereGeometry(0.2, 5, 3), { x: p.r - 0.8, y: 0.5, z: 0.35, color: 0xff3a5a }));
    } else { // the feather of Ma'at
      F(K, H.box(0.6, 2.2, 0.06, { x: p.r - 0.8, y: 1.1, rz: 0.25, color: 0xf4f0e4 }), H.box(0.06, 2.3, 0.08, { x: p.r - 0.8, y: 1.12, rz: 0.25, color: COL.gold }));
      G(K, H.box(0.5, 0.06, 0.08, { x: p.r - 0.55, y: 2.1, rz: 0.25, color: 0xfff8d0 }));
    }
  },
};
