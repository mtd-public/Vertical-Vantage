// NEW SAN FRANCISCO platform styles. Each builds pieces into Kit K in the platform's local frame:
// origin at its centre, y = 0 at its (walkable) top, footprint p.w × p.d (or radius p.r), body
// p.thick deep. H is level-view's helper bag (box, cyl, part, prep, meterBox, seg, THREE…).
// Material keys: 'flat' (flat-shaded vertex colour: most things), 'glow' (unlit), 'neon' (unlit,
// theme-dimmed), 'glass', 'concrete', 'deck' (metal plate), 'container'.
// Night: the pack is lit for after dark: International Orange neon and sodium amber on the bridge,
// warm windows and neon outlines in the streets, LED edge strips on every walkable top.
import { GG, cableY } from '../../levels/packs/sanfran-shared.js';
import { adUV } from '../ads.js';
import { text } from './seattle-kit.js';
import { edgeRect, edgeDisc, dots, windowGrid, pool, paint, quad } from './sanfran-night.js';

const OR = 0xc0362c, OR_HI = 0xd84a34, OR_DK = 0x7e2219; // International Orange
const N_OR = 0xff6a2a, N_AMBER = 0xffb040, N_PINK = 0xff2bd6, N_CYAN = 0x2be8ff, N_RED = 0xff2a1a, SODIUM = 0xffc070, WHITE_L = 0xfff0d0;
// a floodlit face: unlit orange, brightest at the water (world y 0) and fading toward the tower tops
const flood = (wy) => { const k = Math.max(0, Math.min(1, wy / 66)); return lerpHex(0xff8a48, 0x7a2416, k); };
function lerpHex(a, b, k) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
}
const ASPHALT = 0x45474e, PAVE = 0xb2ada4, LINE = 0xe8e4d8, YELLOW = 0xe8c040;
const ROCK = [0x8a7458, 0x9c8462, 0x7a664e], GRASS = [0x6c8a3e, 0x7e9a48, 0x5e7a36], SHRUB = 0x3e5a2a;
const BRICK = 0xa4513a, BRICK_DK = 0x6e3426, CREAM = 0xf0e6d0;
export const PASTEL = [0xf2a7c3, 0x9fd6e8, 0xf6dd8a, 0xb6e2a8, 0xc9b3ec, 0xf7b98a, 0xa8c8f0, 0xf4f0e4];
export const TRIM = [0x7a2a5a, 0x2a5a7a, 0x8a5a1a, 0x2a6a3a, 0x4a2a7a, 0x9a3a1a, 0x2a3a8a, 0x6a5a4a];

// A cylinder from a to b (local [x, y, z]), radius r, n sides.
function rod(H, a, b, r, n, color) {
  const T = H.THREE, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-3;
  const g = H.prep(new T.CylinderGeometry(r, r, len, n), color);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}
// A railing along local z (length len) at x, posts every `gap` m, top rail at height h.
function railZ(K, H, x, len, h, color, gap = 2.5, z0 = 0) {
  K.add('flat', H.box(0.1, 0.1, len, { x, y: h, z: z0, color }), H.box(0.06, 0.06, len, { x, y: h * 0.5, z: z0, color }));
  for (let z = -len / 2; z <= len / 2 + 0.01; z += gap) K.add('flat', H.box(0.08, h, 0.08, { x, y: h / 2, z: z0 + z, color }));
}
function railX(K, H, z, len, h, color, gap = 2.5, x0 = 0) {
  K.add('flat', H.box(len, 0.1, 0.1, { x: x0, y: h, z, color }), H.box(len, 0.06, 0.06, { x: x0, y: h * 0.5, z, color }));
  for (let x = -len / 2; x <= len / 2 + 0.01; x += gap) K.add('flat', H.box(0.08, h, 0.08, { x: x0 + x, y: h / 2, z, color }));
}

// ------------------------------------------------------------------ stage 1: the Golden Gate
function ggDeck(K, p, th, rng, H) {
  const { w, d } = p, hw = w / 2, hd = d / 2;
  K.add('flat', H.box(w - 3, 0.3, d, { y: -0.15, color: ASPHALT }));
  for (const sx of [-1, 1]) K.add('flat', H.box(1.5, 0.34, d, { x: sx * (hw - 0.75), y: -0.16, color: PAVE }));
  for (let z = -hd + 1; z < hd - 3; z += 7) for (const x of [-6.6, -3.3, 3.3, 6.6]) K.add('flat', H.box(0.18, 0.02, 3.2, { x, y: 0.01, z: z + 1.6, color: LINE }));
  for (const x of [-0.18, 0.18]) K.add('flat', H.box(0.12, 0.02, d, { x, y: 0.01, color: YELLOW }));
  // the deck slab and the stiffening truss under it
  K.add('flat', H.box(w, 1.3, d, { y: -0.95, color: OR_DK }));
  const panel = 5, n = Math.max(1, Math.round(d / panel)), pz = d / n;
  for (const sx of [-1, 1]) {
    const x = sx * (hw - 0.3);
    K.add('flat', H.box(0.5, 0.5, d, { x, y: -1.85, color: OR }), H.box(0.5, 0.5, d, { x, y: -4.6, color: OR }));
    for (let i = 0; i <= n; i++) {
      const z = -hd + i * pz;
      K.add('flat', H.box(0.32, 2.6, 0.32, { x, y: -3.2, z, color: OR }));
      if (i < n) K.add('flat', H.box(0.22, Math.sqrt(pz * pz + 2.6 * 2.6), 0.22, { x, y: -3.2, z: z + pz / 2, rx: (i % 2 ? 1 : -1) * Math.atan2(pz, 2.6), color: OR_HI }));
    }
  }
  for (let i = 0; i <= n; i += 2) K.add('flat', H.box(w - 0.8, 0.4, 0.5, { y: -4.6, z: -hd + i * pz, color: OR_DK }));
  // night: orange LED curbs, cat's-eye reflectors down the lanes, the deck's lit edge, sodium lamps
  // under the truss (the deck reads from the cable, the towers and the water)
  for (const sx of [-1, 1]) {
    K.add('neon', H.box(0.1, 0.06, d, { x: sx * (hw - 1.55), y: 0.02, color: N_OR }));
    K.add('neon', H.box(0.12, 0.14, d, { x: sx * (hw + 0.04), y: -0.45, color: N_OR }));
    for (let z = -hd + 2; z < hd; z += 10) K.add('glow', H.box(0.5, 0.3, 0.5, { x: sx * (hw - 0.3), y: -5.0, z, color: SODIUM }));
  }
  for (let z = -hd + 1; z < hd - 3; z += 7) for (const x of [-6.6, -3.3, 3.3, 6.6]) K.add('glow', H.box(0.22, 0.05, 0.22, { x, y: 0.03, z: z + 3.4, color: x > 0 ? 0xff4a3a : WHITE_L }));
  for (let z = -hd + 1.75; z < hd; z += 3.5) K.add('glow', H.box(0.2, 0.05, 0.2, { y: 0.03, z, color: N_AMBER }));
  if (cableY(p.z) === null) { // an approach viaduct: concrete piers down to the water
    for (let z = -hd + 4; z < hd; z += 16) for (const sx of [-1, 1]) {
      const hh = p.h + 2;
      K.add('concrete', H.box(2.4, hh, 2.4, { x: sx * 7, y: -1.6 - hh / 2, z, color: 0xd6d0c4 }));
      K.add('flat', H.box(3.2, 0.8, 3.2, { x: sx * 7, y: -2.2, z, color: 0xb8b0a2 }));
      K.add('glow', H.box(2.6, 0.3, 2.6, { x: sx * 7, y: -p.h + 0.4, z, color: SODIUM })); // uplights at the waterline
    }
    K.add('flat', H.box(16, 1.2, 1.6, { y: -2.2, z: -hd + 4, color: 0xb8b0a2 }));
    return;
  }
  // the main cables over this span, and the suspenders hanging to the deck edge
  const rel = (wz) => cableY(wz) - p.h, step = 4;
  for (const sx of [-1, 1]) {
    const x = sx * GG.legX;
    for (let z = -hd; z < hd - 0.01; z += step) {
      const z1 = Math.min(hd, z + step);
      K.add('flat', rod(H, [x, rel(p.z + z), z], [x, rel(p.z + z1), z1], GG.r, 6, OR));
    }
    // the cable lights: a necklace of warm lamps riding the cable
    for (let wz = Math.ceil((p.z - hd) / 6) * 6 + 3; wz <= p.z + hd; wz += 6) {
      if (Math.abs(wz - GG.zS) < GG.legD / 2 + 1 || Math.abs(wz - GG.zN) < GG.legD / 2 + 1) continue;
      K.add('glow', H.box(0.42, 0.42, 0.42, { x: x + sx * 0.55, y: rel(wz), z: wz - p.z, color: WHITE_L }));
    }
    for (let wz = Math.ceil((p.z - hd) / 7.5) * 7.5; wz <= p.z + hd; wz += 7.5) {
      const top = rel(wz) - GG.r, z = wz - p.z;
      if (top < 1.4 || Math.abs(wz - GG.zS) < GG.legD / 2 + 1 || Math.abs(wz - GG.zN) < GG.legD / 2 + 1) continue;
      K.add('flat', H.box(0.14, top + 0.8, 0.14, { x: x - sx * 0.2, y: (top - 0.8) / 2, z, color: OR_HI }), H.box(0.14, top + 0.8, 0.14, { x: x + sx * 0.2, y: (top - 0.8) / 2, z, color: OR_HI }));
      K.add('flat', H.box(2.8, 0.4, 0.6, { x: sx * (GG.legX - 1.2), y: -0.8, z, color: OR_DK }));
      K.add('flat', H.box(0.5, 0.5, 0.7, { x, y: top + 0.05, z, color: OR_DK })); // the cable band
    }
    // the anchorage housing where the cable comes down to the deck
    for (const za of [GG.zA, GG.zB]) if (Math.abs(za - p.z) <= hd + 0.01) {
      const z = za - p.z, out = Math.sign(z);
      K.add('concrete', H.box(4, 6, 6, { x, y: 1.4, z: z - out * 1, color: 0xd8d0c0 }));
      K.add('flat', H.box(4.4, 0.6, 6.4, { x, y: 4.6, z: z - out * 1, color: 0xb8ae9c }));
    }
  }
}

function ggRail(K, p, th, rng, H) {
  const d = p.d, h = p.thick;
  K.add('flat', H.box(0.3, 0.16, d, { y: -0.08, color: OR }), H.box(0.2, 0.08, d, { y: -0.55, color: OR }));
  for (let z = -d / 2; z <= d / 2; z += 2.2) K.add('flat', H.box(0.18, h, 0.18, { y: -h / 2, z, color: OR_DK }));
  // art-deco lamp posts
  const side = Math.sign(p.x) || 1;
  for (let z = -d / 2 + 12; z < d / 2 - 4; z += 26) {
    K.add('flat', H.box(0.2, 4.8, 0.2, { y: 2.4, z, color: OR_DK }), H.box(1.6, 0.16, 0.2, { x: -side * 0.7, y: 4.8, z, color: OR_DK }));
    K.add('glow', H.box(0.5, 0.25, 0.4, { x: -side * 1.4, y: 4.65, z, color: 0xfff0c0 }));
    pool(K, H, -side * 2.4, z, 2.0, 0x3a2a1c, -p.thick + 0.04); // its light on the roadway
  }
  K.add('neon', H.box(0.12, 0.06, d, { y: 0.02, color: N_OR })); // the rail's lit top: the deck's edge at night
}

// a tower leg: International Orange, art-deco setbacks and recessed fluting, joints every 7 m. At
// night it's floodlit: unlit orange panels on the faces, brightest at the water, the flutes and joints
// dark between them, red aviation lights up the outer corners.
function ggLeg(K, p, th, rng, H) {
  const { w, d, thick: T } = p, side = Math.sign(p.x) || 1, top = p.h;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: OR }));
  // setbacks: lower sections step out on the outer, south and north faces (never into the deck)
  const secs = [[0, -15, 0]];
  for (const [y0, out] of [[-15, 0.35], [-29, 0.7], [-43, 1.05]]) {
    const hh = T + y0, ww = w + out, dd = d + out * 2;
    K.add('flat', H.box(ww, hh, dd, { x: side * out / 2, y: y0 - hh / 2, color: OR }));
    K.add('flat', H.box(ww + 0.08, 0.5, dd + 0.08, { x: side * out / 2, y: y0 - 0.25, color: OR_HI }));
    K.add('neon', H.box(ww + 0.16, 0.14, dd + 0.16, { x: side * out / 2, y: y0 - 0.55, color: N_OR }));
    secs[secs.length - 1][1] = y0; secs.push([y0, null, out]);
  }
  secs[secs.length - 1][1] = -T;
  for (const [ya, yb, out] of secs) { // the floodlit panels, section by section
    const hh = ya - yb - 0.7, yc = (ya + yb) / 2 - 0.35, cx = side * out / 2, ww = w + out, dd = d + out * 2;
    const panel = (g) => paint(g, (x, y) => flood(top + y));
    for (const sz of [-1, 1]) K.add('glow', panel(H.box(ww - 0.3, hh, 0.04, { x: cx, y: yc, z: sz * (dd / 2 + 0.015) })));
    K.add('glow', panel(H.box(0.04, hh, dd - 0.3, { x: side * (w / 2 + out + 0.015), y: yc })));
    K.add('glow', panel(H.box(0.04, hh, d - 0.3, { x: -side * (w / 2 + 0.015), y: yc })));
  }
  // recessed vertical flutes on the south / north faces and the outer face
  for (const sz of [-1, 1]) for (const fx of [-0.35, 0.35]) K.add('flat', H.box(0.35, T - 3, 0.12, { x: fx * w, y: -T / 2 - 1, z: sz * (d / 2 + 0.03), color: OR_DK }));
  for (const fz of [-0.3, 0, 0.3]) K.add('flat', H.box(0.12, T - 3, 0.35, { x: side * (w / 2 + 0.03), y: -T / 2 - 1, z: fz * d, color: OR_DK }));
  for (let y = -7; y > -T + 2; y -= 7) K.add('flat', H.box(w + 0.1, 0.14, d + 0.1, { y, color: OR_DK }));
  // aviation lights on the outer corners of the top, and down the outer edge
  for (const sz of [-1, 1]) K.add('glow', H.box(0.35, 0.3, 0.35, { x: side * (w / 2 - 0.3), y: 0.15, z: sz * (d / 2 - 0.3), color: N_RED }));
  for (const y of [-12, -26, -40]) K.add('glow', H.box(0.4, 0.4, 0.4, { x: side * (w / 2 + 0.25), y, z: d / 2 + 0.2, color: N_RED }), H.box(0.4, 0.4, 0.4, { x: side * (w / 2 + 0.25), y, z: -d / 2 - 0.2, color: N_RED }));
  edgeRect(K, H, w, d, N_AMBER, { y: -0.18 });
}

function ggStrut(K, p, th, rng, H) {
  const { w, d, thick: T } = p, top = p.tint === 1;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: OR }));
  // the stepped portal arch under it, and recessed art-deco panels on its faces (floodlit at night)
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(2.4, 1.4, d, { x: sx * (w / 2 - 1.2), y: -T - 0.7, color: OR }), H.box(1.2, 1.2, d, { x: sx * (w / 2 - 3), y: -T - 0.6, color: OR }));
    K.add('flat', H.box(1.2, 2.6, d, { x: sx * (w / 2 - 0.6), y: -T - 1.3, color: OR }));
  }
  const n = top ? 7 : 5, lit = flood(p.h - T / 2);
  for (let i = 0; i < n; i++) for (const sz of [-1, 1]) {
    const x = (i - (n - 1) / 2) * (w / n);
    K.add('glow', H.box(w / n - 0.8, T - 1.1, 0.12, { x, y: -T / 2, z: sz * (d / 2 + 0.03), color: lit }));
    if (top) K.add('flat', H.box(0.4, T - 1.1, 0.14, { x, y: -T / 2, z: sz * (d / 2 + 0.04), color: OR_HI }));
  }
  K.add('flat', H.box(w + 0.1, 0.2, d + 0.1, { y: -0.1, color: OR_HI }));
  for (const sz of [-1, 1]) K.add('neon', H.box(w - 1, 0.12, 0.1, { y: -T - 0.05, z: sz * (d / 2 - 0.2), color: N_OR })); // the soffit's light line
  edgeRect(K, H, w, d, N_AMBER, { y: -0.26, faces: [0, 1] });
  if (top) for (const x of [-w / 2 + 0.6, 0, w / 2 - 0.6]) K.add('flat', H.box(0.4, 0.3, 0.4, { x, y: 0.15, z: -d / 2 + 0.3, color: 0x3a0e0a })); // beacon housings (their lights blink: sfBeacons)
}

function ggSaddle(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T - 0.3, d, { y: -T / 2 - 0.15, color: OR }), H.box(w + 0.2, 0.3, d + 0.2, { y: -0.15, color: OR_HI }));
  K.add('flat', H.box(w - 0.6, 0.6, d + 0.3, { y: -T + 0.7, color: OR_DK }));
  const cy = GG.TT + GG.ride - (GG.TT + T); // where the cable enters, relative to the top
  for (const sz of [-1, 1]) K.add('flat', rod(H, [0, cy, sz * d / 2], [0, cy - 0.9, sz * (d / 2 + 1)], GG.r + 0.05, 6, OR));
  edgeRect(K, H, w, d, N_AMBER, { y: -0.36 });
  for (const sz of [-1, 1]) K.add('glow', H.box(0.3, 0.3, 0.3, { x: w / 2 - 0.25, y: 0.15, z: sz * (d / 2 - 0.25), color: N_RED }));
}

function ggLedge(K, p, th, rng, H) {
  const { w, d } = p, t = p.tint; // 0: on a south face (leg at -z), 1: north (leg at +z), 2: leg at +x, 3: leg at -x
  K.add('deck', H.box(w, 0.08, d, { y: -0.04, color: 0xb8b4ae }));
  K.add('flat', H.box(w, 0.4, d, { y: -0.28, color: OR_DK }));
  const toLeg = [[0, -1], [0, 1], [1, 0], [-1, 0]][t] || [0, -1];
  // railings on the three open sides, a bracket under it back to the leg
  if (toLeg[1] !== 1) railX(K, H, d / 2 - 0.05, w, 1.0, OR, 1.6);
  if (toLeg[1] !== -1) railX(K, H, -d / 2 + 0.05, w, 1.0, OR, 1.6);
  if (toLeg[0] !== 1) railZ(K, H, w / 2 - 0.05, d, 1.0, OR, 1.6);
  if (toLeg[0] !== -1) railZ(K, H, -w / 2 + 0.05, d, 1.0, OR, 1.6);
  K.add('flat', rod(H, [-toLeg[0] * w * 0.35, -0.45, -toLeg[1] * d * 0.35], [toLeg[0] * w * 0.5, -2.4, toLeg[1] * d * 0.5], 0.12, 4, OR_DK));
  // amber LED round the open edges, a work lamp on the rail
  const NRM = [[0, -1], [0, 1], [1, 0], [-1, 0]];
  edgeRect(K, H, w, d, N_AMBER, { y: -0.14, faces: [0, 1, 2, 3].filter((i) => NRM[i][0] !== toLeg[0] || NRM[i][1] !== toLeg[1]) });
  K.add('glow', H.box(0.2, 0.2, 0.2, { x: -toLeg[0] * (w / 2 - 0.05) + (toLeg[0] ? 0 : w / 2 - 0.1), y: 1.12, z: -toLeg[1] * (d / 2 - 0.05) + (toLeg[1] ? 0 : d / 2 - 0.1), color: N_AMBER }));
}

function ggCable(K, p, th, rng, H) {
  const { w, d } = p;
  K.add('deck', H.box(w, 0.08, d, { y: -0.04, color: 0xb0aca6 }));
  K.add('flat', H.box(w - 0.3, 0.27, d - 0.2, { y: -0.2, color: OR_DK }));
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.08, 0.08, d, { x: sx * (w / 2 - 0.1), y: 1.05, color: OR_HI }));
    for (const sz of [-1, 1]) K.add('flat', H.box(0.08, 1.05, 0.08, { x: sx * (w / 2 - 0.1), y: 0.52, z: sz * (d / 2 - 0.1), color: OR_DK }));
    K.add('neon', H.box(0.08, 0.08, d - 0.2, { x: sx * (w / 2 - 0.02), y: -0.12, color: N_CYAN })); // a cyan tread light down each side
  }
}

function ggFender(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  const g = H.meterBox(w, T, d, 8, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: 0xcfc8ba });
  g.translate(0, -T / 2, 0); K.add('concrete', g);
  K.add('flat', H.box(w + 0.1, 1.2, d + 0.1, { y: -T + 0.4 + 2.6, color: 0x4a5048 })); // the waterline stain
  for (let x = -w / 2 + 2; x < w / 2; x += 6) for (const sz of [-1, 1]) K.add('flat', H.box(0.6, 0.7, 0.6, { x, y: 0.35, z: sz * (d / 2 - 0.6), color: 0x2a2c30 }));
  edgeRect(K, H, w, d, N_AMBER, { y: -0.2 });
  for (let x = -w / 2 + 4; x < w / 2; x += 8) for (const sz of [-1, 1]) K.add('glow', H.box(0.8, 0.3, 0.2, { x, y: -T + 4.2, z: sz * (d / 2 + 0.08), color: SODIUM })); // fender lamps over the tide
}

function ggPlaza(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: ASPHALT }));
  for (let x = -20; x <= 20; x += 4) if (x) K.add('flat', H.box(0.18, 0.02, d - 4, { x, y: 0.01, color: LINE }));
  K.add('flat', H.box(w, 2, d, { y: -1.3, color: 0x9a948a }));
  rock(K, H, w, d, T - 2.3, -2.3, rng); // the headland under it
  // the gantry over the plaza with the sign
  for (const sx of [-1, 1]) K.add('flat', H.box(0.6, 12, 0.6, { x: sx * 22, y: 6, z: -d / 2 + 1.5, color: OR_DK }));
  K.add('flat', H.box(45, 1.1, 0.7, { y: 12.2, z: -d / 2 + 1.5, color: OR }));
  for (let x = -18; x <= 18; x += 4) K.add('glow', H.box(2.4, 0.7, 0.1, { x, y: 12.2, z: -d / 2 + 1.1, color: (x / 4) % 2 ? 0x3aff8a : 0xffe26a }));
  // the gantry's crown: GOLDEN GATE in International Orange neon, both ways, on a dark fascia
  K.add('flat', H.box(30, 2.2, 0.4, { y: 14.0, z: -d / 2 + 1.5, color: 0x1a1418 }));
  for (const [sz, ry] of [[-1, Math.PI], [1, 0]]) K.add('glow', ...text('GOLDEN GATE', { px: 0.28, depth: 0.08, y: 14.0, z: -d / 2 + 1.5 + sz * 0.24, ry, color: N_OR }));
  K.add('neon', H.box(45.2, 0.12, 0.12, { y: 11.6, z: -d / 2 + 1.1, color: N_OR }), H.box(30.2, 0.12, 0.12, { y: 15.15, z: -d / 2 + 1.5, color: N_OR }));
  for (let x = -20; x <= 20; x += 4) K.add('glow', H.box(1.2, 0.08, 0.5, { x, y: 11.62, z: -d / 2 + 1.5, color: WHITE_L })); // lane lamps under the gantry
  for (const x of [-26, 26]) for (const z of [-d / 2 + 2, 0, d / 2 - 3]) {
    K.add('flat', H.box(0.2, 5, 0.2, { x, y: 2.5, z, color: 0x3a3c44 }));
    K.add('glow', H.box(0.6, 0.3, 0.6, { x, y: 5.1, z, color: 0xfff0c0 }));
    pool(K, H, x + Math.sign(-x) * 1.5, z, 3, 0x2e2420, 0.035);
  }
  // holo ads on masts either side of the plaza (the bridge is sponsored now)
  for (const [x, ad, ry] of [[-31, 7, Math.PI / 2], [31, 22, -Math.PI / 2]]) {
    K.add('flat', H.box(0.4, 10, 0.4, { x, y: 5, z: 4, color: 0x2a2c34 }), H.box(0.5, 4.6, 8.6, { x, y: 9.2, z: 4, color: 0x14141a }));
    K.add('ads', H.atlasQuad(8, 4, adUV(ad), { x: x + Math.sign(-x) * 0.3, y: 9.2, z: 4, ry }));
    K.add('neon', H.box(0.12, 0.12, 8.8, { x: x + Math.sign(-x) * 0.3, y: 6.8, z: 4, color: N_PINK }), H.box(0.12, 0.12, 8.8, { x: x + Math.sign(-x) * 0.3, y: 11.6, z: 4, color: N_CYAN }));
  }
  edgeRect(K, H, w, d, N_OR, { y: -0.2, faces: [1, 2, 3] });
}

function ggBooth(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w * 0.8, T - 0.4, d * 0.8, { y: -T / 2 - 0.2, color: CREAM }));
  K.add('glass', H.box(w * 0.82, 0.9, d * 0.82, { y: -T + 1.6 }));
  for (const sx of [-1, 1]) K.add('glow', H.box(0.06, 0.6, d * 0.5, { x: sx * (w * 0.41 + 0.01), y: -T + 1.6, color: 0xffd090 })); // the attendant's lit windows
  K.add('flat', H.box(w + 0.6, 0.4, d + 0.6, { y: -0.2, color: OR }));
  edgeRect(K, H, w + 0.6, d + 0.6, N_CYAN, { y: -0.38 });
  K.add('glow', H.box(0.4, 0.3, 0.2, { x: -0.5, y: -0.55, z: -d / 2 - 0.32, color: 0x3aff6a }), H.box(0.4, 0.3, 0.2, { x: 0.5, y: -0.55, z: -d / 2 - 0.32, color: 0xff3a3a }));
}

// rock with a grass top: a body, a few jagged chunks on the faces, shrubs round the edge
function rock(K, H, w, d, T, y0, rng, disc = 0) {
  if (disc) {
    K.add('flat', H.cyl(disc * 0.92, disc, T, H.seg(10, 7), { y: y0 - T / 2, color: ROCK[0] }));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rng(); K.add('flat', H.box(2 + rng() * 2, T * (0.4 + rng() * 0.4), 2, { x: Math.cos(a) * disc * 0.85, y: y0 - T * 0.4, z: Math.sin(a) * disc * 0.85, ry: -a, rz: (rng() - 0.5) * 0.3, color: ROCK[i % 3] })); }
    return;
  }
  K.add('flat', H.box(w, T, d, { y: y0 - T / 2, color: ROCK[0] }));
  const n = Math.max(2, Math.round((w + d) / 7));
  for (let i = 0; i < n; i++) for (const f of H.faces(w, d)) {
    const off = (i / n - 0.5 + 0.5 / n) * f.width, hh = Math.min(T * 0.8, 3 + rng() * T * 0.5);
    K.add('flat', H.box(f.tx ? 2.5 + rng() * 2 : 1.2, hh, f.tz ? 2.5 + rng() * 2 : 1.2, { x: f.nx * (f.half + 0.2) + f.tx * off, y: y0 - 0.6 - hh / 2 - rng() * Math.max(0, T - hh - 1), z: f.nz * (f.half + 0.2) + f.tz * off, rx: (rng() - 0.5) * 0.25, rz: (rng() - 0.5) * 0.25, color: ROCK[(i + 1) % 3] }));
  }
}
function sfRock(K, p, th, rng, H) {
  const g = GRASS[Math.floor(rng() * 3)];
  if (p.kind === 'disc') {
    K.add('flat', H.cyl(p.r, p.r, 0.5, H.seg(14, 9), { y: -0.25, color: g }));
    rock(K, H, 0, 0, p.thick - 0.5, -0.5, rng, p.r);
    return;
  }
  K.add('flat', H.box(p.w, 0.5, p.d, { y: -0.25, color: g }));
  rock(K, H, p.w, p.d, p.thick - 0.5, -0.5, rng);
  const n = Math.floor(p.w * p.d / 60);
  for (let i = 0; i < n; i++) { // shrubs along the edges (never in the middle of a landing)
    const e = rng() < 0.5, x = e ? (rng() < 0.5 ? -1 : 1) * (p.w / 2 - 0.8) : (rng() - 0.5) * (p.w - 1.6), z = e ? (rng() - 0.5) * (p.d - 1.6) : (rng() < 0.5 ? -1 : 1) * (p.d / 2 - 0.8);
    K.add('flat', H.box(1 + rng(), 0.5 + rng() * 0.4, 1 + rng(), { x, y: 0.3, z, color: SHRUB }));
  }
  bollards(K, H, p.w, p.d);
}
// path-light bollards at the corners of a walkable top (amber heads, a faint pool round each)
function bollards(K, H, w, d, col = N_AMBER, inset = 0.7) {
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * (w / 2 - inset), z = sz * (d / 2 - inset);
    K.add('flat', H.box(0.22, 0.6, 0.22, { x, y: 0.3, z, color: 0x2a2c34 }));
    K.add('glow', H.box(0.26, 0.16, 0.26, { x, y: 0.66, z, color: col }));
    pool(K, H, x, z, 1.3, 0x2a2018, 0.03);
  }
}

function fortPoint(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: BRICK }));
  K.add('flat', H.box(w + 0.2, 0.3, d + 0.2, { y: -0.15, color: 0xc8b8a0 }));
  if (p.tint === 1) return; // the inner stair block
  // two tiers of arched casemate openings on the long faces, a darker plinth
  for (const f of H.faces(w, d)) {
    if (f.width < 6) continue;
    const n = Math.floor(f.width / 3.2);
    for (let i = 0; i < n; i++) for (const y of [-3, -7.5]) {
      const off = (i - (n - 1) / 2) * (f.width / n);
      const lit = rng() < 0.45; // casemates: some lit (a museum after hours), the rest dark
      K.add(lit ? 'glow' : 'flat', H.box(f.tx ? 1.2 : 0.1, 1.8, f.tz ? 1.2 : 0.1, { x: f.nx * (f.half + 0.02) + f.tx * off, y, z: f.nz * (f.half + 0.02) + f.tz * off, color: lit ? (rng() < 0.5 ? 0xffb060 : 0xd88a48) : 0x2a1a16 }));
      K.add('flat', H.box(f.tx ? 1.6 : 0.12, 0.3, f.tz ? 1.6 : 0.12, { x: f.nx * (f.half + 0.03) + f.tx * off, y: y + 1.05, z: f.nz * (f.half + 0.03) + f.tz * off, color: 0xc8b8a0 }));
    }
    K.add('flat', H.box(f.tx ? f.width + 0.2 : 0.2, 2, f.tz ? f.width + 0.2 : 0.2, { x: f.nx * (f.half + 0.05), y: -T + 1, z: f.nz * (f.half + 0.05), color: BRICK_DK }));
    K.add('glow', H.box(f.tx ? f.width + 0.3 : 0.12, 0.2, f.tz ? f.width + 0.3 : 0.12, { x: f.nx * (f.half + 0.12), y: -T + 2.1, z: f.nz * (f.half + 0.12), color: SODIUM })); // floodlights along the plinth
  }
  edgeRect(K, H, w + 0.2, d + 0.2, N_AMBER, { y: -0.36 });
}
function fortYard(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: 0x9a9080 }));
  for (let x = -w / 2 + 2; x < w / 2; x += 2) K.add('flat', H.box(0.06, 0.02, d, { x, y: 0.01, color: 0x8a8070 }));
  K.add('flat', H.box(0.15, 9, 0.15, { x: -w / 2 + 2, y: 4.5, z: d / 2 - 2, color: 0xe0e0e0 }));
  K.add('flat', H.box(0.05, 1.4, 2.2, { x: -w / 2 + 2, y: 8.2, z: d / 2 - 3.2, color: 0x2a4aa8 }), H.box(0.06, 0.4, 2.2, { x: -w / 2 + 2, y: 7.6, z: d / 2 - 3.2, color: 0xd8302a }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { x: -w / 2 + 2, y: 9.1, z: d / 2 - 2, color: N_RED }));
  for (const [x, z] of [[w / 2 - 1.2, -d / 2 + 1.2], [-w / 2 + 1.2, -d / 2 + 1.2]]) { // yard lamps
    K.add('flat', H.box(0.16, 3.6, 0.16, { x, y: 1.8, z, color: 0x2a2c34 }));
    K.add('glow', H.box(0.45, 0.3, 0.45, { x, y: 3.7, z, color: 0xfff0c0 }));
    pool(K, H, x, z, 3.2, 0x30261c, 0.03);
  }
}

function sfShipBridge(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: 0xf0f0ec }), H.box(w + 0.2, 0.25, d + 0.2, { y: -0.12, color: 0x3a3c46 }));
  K.add('glow', H.box(w + 0.06, 1.2, d + 0.06, { y: -1.4, color: 0x9ae8ff })); // the lit wheelhouse windows
  K.add('flat', H.box(w + 3, 0.3, 2, { y: -0.9, z: -d / 2 + 1, color: 0xf0f0ec })); // bridge wings
  K.add('flat', H.box(2, 2.2, 2.4, { x: w / 2 - 1.4, y: 1.1, z: d / 2 - 1.6, color: 0x1a1a22 }), H.box(2.05, 0.7, 2.45, { x: w / 2 - 1.4, y: 1.6, z: d / 2 - 1.6, color: 0xd8302a })); // funnel
  railZ(K, H, -w / 2 + 0.1, d, 1, 0xf0f0ec, 2);
  K.add('glow', H.box(0.3, 0.3, 0.3, { x: w / 2 - 1.4, y: 2.4, z: d / 2 - 1.6, color: 0xff2a2a }));
  K.add('glow', H.box(0.3, 0.3, 0.3, { x: -w / 2 - 1.5, y: -0.6, z: -d / 2 + 1, color: 0xff2a2a }), H.box(0.3, 0.3, 0.3, { x: w / 2 + 1.5, y: -0.6, z: -d / 2 + 1, color: 0x2aff6a })); // port and starboard
  for (const f of H.faces(w + 0.2, d + 0.2)) K.add('glow', H.box(f.tx ? f.width : 0.08, 0.08, f.tz ? f.width : 0.08, { x: f.nx * f.half, y: -0.28, z: f.nz * f.half, color: N_CYAN })); // the roof's edge
}

function sfLighthouse(K, p, th, rng, H) {
  const r = p.r, T = p.thick, n = H.seg(16, 10);
  if (p.tint === 1) { // the lamp room: glass, a red cap you stand on
    K.add('flat', H.cyl(r * 0.8, r * 0.8, 0.6, n, { y: -T + 0.3, color: 0x2a2c34 }));
    K.add('glow', H.cyl(r * 0.75, r * 0.75, T - 1.3, n, { y: -T / 2 - 0.05, color: 0x8a7a48 })); // the lamp room, lit through the glass
    K.add('glow', H.cyl(0.7, 0.7, 1.3, 8, { y: -T / 2, color: 0xfff6c0 }));
    K.add('flat', H.cyl(r, r, 0.5, n, { y: -0.25, color: 0xc8302a }));
    edgeDisc(K, H, r, N_PINK, { y: -0.3 });
    return;
  }
  K.add('flat', H.cyl(r * 0.85, r, T, n, { y: -T / 2, color: 0xf2f0ea }), H.cyl(r * 0.92, r * 0.94, 0.9, n, { y: -T * 0.45, color: 0xc8302a }));
  K.add('flat', H.cyl(r + 0.1, r + 0.1, 0.25, n, { y: -0.12, color: 0x2a2c34 }));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; K.add('flat', H.box(0.08, 1, 0.08, { x: Math.cos(a) * r, y: 0.5, z: Math.sin(a) * r, color: 0x2a2c34 })); }
  edgeDisc(K, H, r + 0.1, N_CYAN, { y: -0.2 });
  for (const a of [0.5, 2.6, 4.7]) K.add('glow', H.box(0.5, 0.9, 0.5, { x: Math.cos(a) * r * 0.95, y: -T * 0.7, z: Math.sin(a) * r * 0.95, ry: -a, color: 0xffd890 })); // slit windows
}

const SAILS = [0xffffff, 0xff5a8a, 0xffd84a, 0x5ad8ff, 0xa87aff, 0x7aff9a];
function sfYacht(K, p, th, rng, H) {
  const { w, d } = p, T = H.THREE;
  K.add('flat', H.box(w, 0.12, d * 0.86, { y: -0.06, z: d * 0.07, color: 0xb88c58 }));
  K.add('flat', H.box(w, 1.1, d * 0.86, { y: -0.67, z: d * 0.07, color: 0xf4f4f0 }), H.box(w * 0.7, 1.1, d * 0.2, { y: -0.67, z: -d * 0.43, color: 0xf4f4f0 }));
  K.add('flat', H.box(w + 0.05, 0.25, d * 0.86, { y: -1.0, z: d * 0.07, color: 0x2a5aa8 }));
  K.add('flat', H.box(0.14, 9, 0.14, { y: 4.5, z: -d * 0.12, color: 0xd8d8d8 }));
  const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 8.2); sh.lineTo(d * 0.62, 0.3); sh.lineTo(0, 0);
  K.add('flat', H.part(new T.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }), { x: -0.04, y: 0.7, z: -d * 0.12, ry: -Math.PI / 2, color: SAILS[(p.tint >= 0 ? p.tint : 0) % SAILS.length] }));
  for (const sz of [-0.3, 0.3]) K.add('glow', H.cyl(0.5, 0.5, 0.06, 8, { y: -1.25, z: sz * d, color: 0x5ff0ff }));
  // night: a neon stripe down the hull in the sail's colour, the masthead light, portholes
  const nc = [N_CYAN, N_PINK, N_AMBER, N_CYAN, 0xb45bff, 0x7bff4a][(p.tint >= 0 ? p.tint : 0) % 6];
  for (const sx of [-1, 1]) K.add('glow', H.box(0.06, 0.12, d * 0.84, { x: sx * (w / 2 + 0.04), y: -0.45, z: d * 0.07, color: nc }));
  K.add('glow', H.box(w * 0.7 + 0.06, 0.12, 0.06, { y: -0.45, z: -d * 0.53, color: nc }));
  K.add('glow', H.box(0.25, 0.25, 0.25, { y: 9.1, z: -d * 0.12, color: WHITE_L }));
  for (let z = -0.2; z < 0.4; z += 0.2) for (const sx of [-1, 1]) K.add('glow', H.box(0.06, 0.2, 0.3, { x: sx * (w / 2 + 0.03), y: -0.8, z: z * d, color: 0xffd890 }));
}

// ------------------------------------------------------------------ stage 2: the steep streets
const WALLS = [0xd8d0c0, 0xc8c0b4, 0xe0d4bc, 0xcfc6ba, 0xd4ccc4, 0xc4bcb0, 0xb8b4ac, 0xdcd2c2];
const TERRACE = 0x3a8ac8, SHOP = [N_PINK, N_CYAN, 0xb45bff, N_AMBER], WARMWIN = [0xffd890, 0xffc070, 0xffe6b8, 0xffb0a0];
// the Painted Ladies' neon: each house outlined in its own colour
const LADY_NEON = [0xff2bd6, 0x2be8ff, 0xffd23a, 0x7bff4a, 0xb45bff, 0xff7a2a, 0x4a8bff, 0xff3b8c];
function tree(K, H, x, z, s = 1, kind = 0) {
  K.add('flat', H.box(0.3 * s, 2.2 * s, 0.3 * s, { x, y: 1.1 * s, z, color: 0x5a4030 }));
  if (kind) K.add('flat', H.part(new H.THREE.ConeGeometry(1.3 * s, 4 * s, 6), { x, y: 3.8 * s, z, color: 0x2e5a2a }));
  else K.add('flat', H.part(new H.THREE.IcosahedronGeometry(1.4 * s, 0), { x, y: 3.1 * s, z, color: 0x4a7a32 }));
}
// a 20 m city lot: a street on its west and south edges (the neighbours draw the others), sidewalks,
// and a yard; the sides are retaining walls where the hill steps down
function sfLot(K, p, th, rng, H) {
  const { w, d, thick: T } = p, t = p.tint;
  const g = H.meterBox(w, T, d, 6, { faces: ['px', 'nx', 'pz', 'nz'], color: WALLS[(t >= 0 ? t : 0) % WALLS.length] });
  g.translate(0, -T / 2, 0); K.add('concrete', g);
  K.add('flat', H.box(w + 0.1, 0.3, d + 0.1, { y: -0.15, color: 0x9a968e }));
  // night: a cool light line under each terrace's lip (so every step of the hill reads), garages
  // and corner shops lit in the retaining walls where the hill drops away
  edgeRect(K, H, w + 0.1, d + 0.1, TERRACE, { y: -0.36, t: 0.08 });
  if (T > 7) for (const f of H.faces(w, d)) for (let off = -f.width / 2 + 2.2; off < f.width / 2 - 1.5; off += 3.4) {
    if (rng() < 0.45) {
      quad(K, H, 'flat', f, off, -2.7, 2.3, 1.6, 0x2a2630, 0.03);
      quad(K, H, 'glow', f, off, -2.75, 1.9, 1.15, rng() < 0.3 ? SHOP[Math.floor(rng() * SHOP.length)] & 0xbfbfbf : 0xe8b070, 0.05);
    }
  }
  if (t === 6) { // Market Street: a wide boulevard with streetcar rails and palms
    K.add('flat', H.box(w, 0.32, 12, { y: -0.14, z: 0, color: ASPHALT }));
    for (const z of [-3.6, -2.2, 2.2, 3.6]) K.add('flat', H.box(w, 0.04, 0.12, { y: 0.03, z, color: 0x8a8c94 }));
    for (const z of [-2.9, 2.9]) K.add('neon', H.box(w, 0.04, 0.1, { y: 0.03, z, color: N_CYAN })); // the streetcar's lit guideway
    for (let x = -w / 2 + 4; x < w / 2; x += 6) K.add('flat', H.box(3, 0.02, 0.2, { x, y: 0.03, z: 0, color: YELLOW }));
    for (let x = -w / 2 + 6; x < w / 2; x += 16) if (Math.abs(x) > 12) for (const z of [-7.5, 7.5]) {
      K.add('flat', H.box(0.35, 6, 0.35, { x, y: 3, z, color: 0x7a6040 }));
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; K.add('flat', H.box(2.6, 0.12, 0.6, { x: x + Math.cos(a) * 1.1, y: 5.9, z: z + Math.sin(a) * 1.1, ry: -a, rz: -0.3, color: 0x3e7a2e })); }
      K.add('glow', H.box(0.9, 0.2, 0.9, { x, y: 0.1, z, color: N_PINK })); // uplit palms
      pool(K, H, x, z, 1.8, 0x3a1838, 0.035);
    }
    for (let x = -w / 2 + 14; x < w / 2; x += 16) for (const z of [-6.2, 6.2]) { // streetlights down the boulevard
      K.add('flat', H.box(0.16, 4.6, 0.16, { x, y: 2.3, z, color: 0x2a2c34 }), H.box(1.2, 0.12, 0.16, { x, y: 4.6, z: z * 0.92, color: 0x2a2c34 }));
      K.add('glow', H.box(0.6, 0.2, 0.4, { x, y: 4.5, z: z * 0.85, color: 0xfff0c0 }));
      pool(K, H, x, z * 0.8, 2.6, 0x302818, 0.035);
    }
    return;
  }
  if (w < 16) { K.add('flat', H.box(w, 0.32, 4, { y: -0.14, z: -d / 2 + 2, color: PAVE })); return; }
  // streets on the west and south edges, a crosswalk at the corner, sidewalks inside them
  K.add('flat', H.box(4.4, 0.32, d, { x: -w / 2 + 2.2, y: -0.14, color: ASPHALT }), H.box(w - 4.4, 0.32, 4.4, { x: 2.2, y: -0.14, z: d / 2 - 2.2, color: ASPHALT }));
  K.add('flat', H.box(0.15, 0.02, d - 6, { x: -w / 2 + 2.2, y: 0.03, z: -3, color: YELLOW }), H.box(w - 6, 0.02, 0.15, { x: 3, y: 0.03, z: d / 2 - 2.2, color: YELLOW }));
  for (let k = 0; k < 5; k++) K.add('flat', H.box(0.5, 0.02, 3.6, { x: -w / 2 + 5.2 + k * 0.9, y: 0.03, z: d / 2 - 2.2, color: LINE }));
  K.add('flat', H.box(1.6, 0.36, d - 4.4, { x: -w / 2 + 5.2, y: -0.12, z: -2.2, color: PAVE }), H.box(w - 6, 0.36, 1.6, { x: 3, y: -0.12, z: d / 2 - 5.2, color: PAVE }));
  const yard = t % 2 ? 0x6e8a46 : 0xa8a298;
  K.add('flat', H.box(w - 6, 0.34, d - 6, { x: 3, y: -0.13, z: -3, color: yard }));
  tree(K, H, -w / 2 + 5.2, d / 2 - 5.2, 0.8);
  if (t % 3 === 0) tree(K, H, w / 2 - 1.5, -d / 2 + 1.5, 0.9, t % 2);
  for (const z of [-d / 2 + 4, 2]) {
    K.add('flat', H.box(0.15, 4.2, 0.15, { x: -w / 2 + 4.6, y: 2.1, z, color: 0x3a3c44 })); K.add('glow', H.box(0.4, 0.3, 0.4, { x: -w / 2 + 4.6, y: 4.3, z, color: 0xfff0c0 }));
    pool(K, H, -w / 2 + 3.6, z, 2.6, 0x302818, 0.04);
  }
}

// a Victorian: pastel clapboard, a cornice (Italianate) or a gable outline (Queen Anne), a bay window
// over the garage, tall trimmed windows, a door up a stoop. The roof is flat and walkable.
function victorian(K, p, th, rng, H) {
  const { w, d, thick: T } = p, t = (p.tint >= 0 ? p.tint : 0) % 8, col = PASTEL[t], trim = TRIM[t], white = 0xf8f4ec;
  const storeys = Math.max(1, Math.round((T - 0.6) / 3.1)), fz = -d / 2;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: col }));
  K.add('flat', H.box(w - 0.4, 0.06, d - 0.4, { y: 0.01, color: 0x8a8076 }));
  K.add('flat', H.box(w + 0.5, 0.55, 0.7, { y: -0.3, z: fz - 0.2, color: trim }), H.box(w + 0.6, 0.12, 0.8, { y: 0, z: fz - 0.25, color: white }));
  for (let x = -w / 2 + 0.4; x <= w / 2 - 0.3; x += (w - 0.8) / 4) K.add('flat', H.box(0.18, 0.5, 0.35, { x, y: -0.75, z: fz - 0.1, color: white })); // cornice brackets
  if (t % 2) { // Queen Anne: a gable outline over the top storey's window
    for (const sx of [-1, 1]) K.add('flat', H.box(w * 0.62, 0.22, 0.12, { x: sx * w * 0.24, y: -1.6, z: fz - 0.06, rz: sx * -0.55, color: white }));
    K.add('flat', H.box(0.9, 0.9, 0.08, { y: -1.9, z: fz - 0.05, color: trim }));
  }
  // the bay window over the garage, the windows and the stoop on the other side
  const bx = -w / 4, bayH = (storeys - 1) * 3.1 - 0.4;
  K.add('flat', H.box(w * 0.5, bayH, 0.8, { x: bx, y: -T + 3.1 + bayH / 2, z: fz - 0.4, color: col }), H.box(w * 0.5 + 0.2, 0.25, 1.0, { x: bx, y: -T + 3.1 + bayH + 0.1, z: fz - 0.45, color: trim }));
  // windows: most of them lit warm (it's 21:30), the odd one dark or blue with a screen
  const win = (o) => { const r = rng(); return r < 0.62 ? ['glow', { ...o, color: WARMWIN[Math.floor(rng() * WARMWIN.length)] }] : r < 0.72 ? ['glow', { ...o, color: 0x8ac8ff }] : ['glass', o]; };
  const addWin = (gw, gh, o) => { const [k, oo] = win(o); K.add(k, H.box(gw, gh, 0.06, oo)); };
  for (let s = 1; s < storeys; s++) {
    const y = -T + 3.1 * s + 1.5;
    addWin(w * 0.42, 1.6, { x: bx, y, z: fz - 0.82 });
    K.add('flat', H.box(w * 0.46, 0.14, 0.1, { x: bx, y: y + 0.9, z: fz - 0.84, color: white }), H.box(w * 0.46, 0.14, 0.1, { x: bx, y: y - 0.9, z: fz - 0.84, color: white }));
    addWin(0.8, 1.7, { x: w / 4 - 0.1, y, z: fz - 0.04 });
    K.add('flat', H.box(1.0, 0.16, 0.1, { x: w / 4 - 0.1, y: y + 1.0, z: fz - 0.06, color: trim }));
  }
  if (storeys >= 2) for (const sx of [-0.45, 0.45]) addWin(0.7, 1.7, { x: sx * w * 0.5, y: -1.8 - (t % 2 ? 0.2 : 0), z: fz - 0.04 });
  K.add('flat', H.box(w * 0.42, 2.2, 0.06, { x: bx, y: -T + 1.1, z: fz - 0.04, color: white })); // the garage door
  K.add('flat', H.box(0.9, 2.1, 0.08, { x: w / 4, y: -T + 1.6, z: fz - 0.05, color: trim }));
  K.add('glow', H.box(0.3, 0.3, 0.1, { x: w / 4 + 0.75, y: -T + 2.4, z: fz - 0.08, color: 0xffd890 })); // the porch light
  for (let k = 0; k < 3; k++) K.add('flat', H.box(1.3, 0.18, 0.4, { x: w / 4, y: -T + 0.1 + k * 0.18, z: fz - 0.2 - (2 - k) * 0.35, color: 0xe8e4dc }));
  const F = H.faces(w, d); // the back and the sides: rows of windows, some lit
  for (const i of [1, 2, 3]) windowGrid(K, H, F[i], -T + 1.2, -0.8, rng, { bay: 2.4, floor: 3.1, ww: 0.8, wh: 1.4, lit: 0.5, palette: WARMWIN, dark: 0x3a4250 });
  // the neon outline: under the cornice, down the corners, round the bay, the gable, the roof's edges
  const nc = LADY_NEON[t];
  K.add('neon', H.box(w + 0.7, 0.1, 0.1, { y: -0.62, z: fz - 0.6, color: nc }));
  for (const sx of [-1, 1]) {
    K.add('neon', H.box(0.1, T - 0.9, 0.1, { x: sx * (w / 2 + 0.04), y: -T / 2 - 0.4, z: fz - 0.04, color: nc }));
    K.add('neon', H.box(0.08, 0.08, d - 0.2, { x: sx * (w / 2 + 0.04), y: -0.12, z: 0.1, color: nc }));
    K.add('neon', H.box(0.08, bayH, 0.08, { x: bx + sx * w * 0.25, y: -T + 3.1 + bayH / 2, z: fz - 0.82, color: nc }));
  }
  K.add('neon', H.box(w + 0.1, 0.08, 0.08, { y: -0.12, z: -fz + 0.04, color: nc }));
  K.add('neon', H.box(w * 0.5 + 0.1, 0.08, 0.08, { x: bx, y: -T + 3.0, z: fz - 0.84, color: nc }));
  if (t % 2) for (const sx of [-1, 1]) K.add('neon', H.box(w * 0.62, 0.08, 0.08, { x: sx * w * 0.24, y: -1.6, z: fz - 0.14, rz: sx * -0.55, color: nc }));
}

function vicPorch(K, p, th, rng, H) {
  const t = (p.tint >= 0 ? p.tint : 0) % 8;
  K.add('flat', H.box(p.w, 0.35, p.d, { y: -0.17, color: TRIM[t] }), H.box(p.w + 0.2, 0.1, p.d + 0.2, { y: 0, color: 0xf8f4ec }));
  for (const sx of [-1, 1]) K.add('flat', H.box(0.22, 3.1, 0.22, { x: sx * (p.w / 2 - 0.2), y: -1.9, z: -p.d / 2 + 0.2, color: 0xf8f4ec }));
  edgeRect(K, H, p.w + 0.2, p.d + 0.2, LADY_NEON[t], { y: -0.2, faces: [0, 2, 3] });
  K.add('glow', H.box(0.5, 0.12, 0.5, { y: -0.4, color: 0xffd890 })); // the porch lamp under it
}
function vicBay(K, p, th, rng, H) {
  const t = (p.tint >= 0 ? p.tint : 0) % 8;
  K.add('flat', H.box(p.w + 0.2, 0.3, p.d + 0.2, { y: -0.15, color: TRIM[t] }));
  K.add('flat', H.box(p.w, 2.9, p.d, { y: -1.75, color: PASTEL[t] }));
  K.add('glow', H.box(p.w - 0.4, 1.6, p.d + 0.04, { y: -1.7, color: 0xffd08a }), H.box(p.w + 0.04, 1.6, p.d - 0.5, { y: -1.7, color: 0xffc070 }));
  edgeRect(K, H, p.w + 0.2, p.d + 0.2, LADY_NEON[t], { y: -0.2, faces: [0, 2, 3] });
}
function vicTurret(K, p, th, rng, H) {
  const t = (p.tint >= 0 ? p.tint : 0) % 8, n = H.seg(12, 8);
  K.add('flat', H.cyl(p.r, p.r, p.thick, n, { y: -p.thick / 2, color: PASTEL[(t + 3) % 8] }), H.cyl(p.r + 0.15, p.r + 0.15, 0.3, n, { y: -0.15, color: TRIM[t] }));
  K.add('glow', H.cyl(p.r + 0.03, p.r + 0.03, 1.1, n, { y: -1.3, color: 0xffd08a }));
  K.add('flat', H.box(0.08, 3, 0.08, { x: p.r - 0.2, y: 1.5, color: 0x3a3c44 }), H.box(0.05, 0.7, 1.1, { x: p.r - 0.2, y: 2.6, z: 0.55, color: 0xff4a8a }));
  edgeDisc(K, H, p.r + 0.15, LADY_NEON[t], { y: -0.32, n: 16 });
  K.add('glow', H.box(0.2, 0.2, 0.2, { x: p.r - 0.2, y: 3.1, color: N_RED }));
}

// one step of the Powell Street grade: the hover cable cars' glowing slots, sidewalks either side
function sfStreet(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('concrete', H.box(w, T, d, { y: -T / 2, color: 0xc8c0b4 }));
  K.add('flat', H.box(12, 0.12, d + 0.02, { y: -0.05, color: ASPHALT }));
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(4, 0.14, d + 0.02, { x: sx * 8, y: -0.04, color: PAVE }));
    K.add('flat', H.box(0.1, 0.03, d + 0.02, { x: sx * 3.2 - 0.75, y: 0.02, color: 0x8a8c94 }), H.box(0.1, 0.03, d + 0.02, { x: sx * 3.2 + 0.75, y: 0.02, color: 0x8a8c94 }));
    K.add('neon', H.box(0.12, 0.03, d + 0.02, { x: sx * 3.2, y: 0.02, color: 0x2be8ff }));
  }
  K.add('flat', H.box(0.14, 0.03, d * 0.6, { y: 0.02, color: YELLOW }));
}
function sfPlaza(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  const g = H.meterBox(w, T, d, 4, { faces: ['px', 'nx', 'py', 'pz', 'nz'], color: 0xd8d2c6 });
  g.translate(0, -T / 2, 0); K.add('concrete', g);
  if (p.tint === 1) { // a lookout with a balustrade and a coin telescope
    railX(K, H, -d / 2 + 0.1, w, 0.9, 0xe8e2d6, 0.6); railZ(K, H, -w / 2 + 0.1, d, 0.9, 0xe8e2d6, 0.6); railZ(K, H, w / 2 - 0.1, d, 0.9, 0xe8e2d6, 0.6);
    K.add('flat', H.box(0.2, 1.1, 0.2, { x: 2, y: 0.55, z: -d / 2 + 1, color: 0x3a3c44 }), H.box(0.3, 0.3, 0.8, { x: 2, y: 1.2, z: -d / 2 + 1, rx: 0.3, color: 0x2a6a5a }));
    edgeRect(K, H, w, d, N_CYAN, { y: -0.12 });
    for (const sx of [-1, 1]) K.add('glow', H.box(0.2, 0.2, 0.2, { x: sx * (w / 2 - 0.1), y: 0.98, z: -d / 2 + 0.1, color: N_AMBER }));
    return;
  }
  for (let x = -w / 2 + 2; x < w / 2; x += 4) for (const z of [-d / 2 + 1.5, d / 2 - 1.5]) {
    K.add('flat', H.box(0.15, 4.2, 0.15, { x, y: 2.1, z, color: 0x2a2c34 }));
    K.add('glow', H.box(0.35, 0.35, 0.35, { x, y: 4.3, z, color: 0xfff0c0 }));
  }
  for (const z of [-d / 2 + 2.5, d / 2 - 2.5]) { pool(K, H, 0, z, 4, 0x302818, 0.03); pool(K, H, -6, z, 3, 0x302818, 0.031); pool(K, H, 6, z, 3, 0x302818, 0.031); }
  edgeRect(K, H, w, d, TERRACE, { y: -0.12 });
}
function sfTurntable(K, p, th, rng, H) {
  const n = H.seg(20, 12);
  K.add('flat', H.cyl(p.r, p.r, p.thick, n, { y: -p.thick / 2, color: 0x7a5a3a }), H.cyl(p.r + 0.1, p.r + 0.1, 0.06, n, { y: -0.02, color: 0x8a8c94 }));
  for (const x of [-3.95, -2.45, 2.45, 3.95]) K.add('flat', H.box(0.1, 0.04, p.r * 1.9, { x: x * 0.5, y: 0.02, color: 0x8a8c94 }));
  K.add('neon', H.part(new H.THREE.RingGeometry(p.r - 0.35, p.r - 0.2, H.seg(28, 16)), { rx: -Math.PI / 2, y: 0.03, color: N_AMBER }));
}
// the hover cable car: maroon and cream, gold trim, open ends with grab poles, a walkable roof
function cableCar(K, p, th, rng, H) {
  const { w, d, thick: T } = p, maroon = p.tint ? 0x1a4a8a : 0x9a1a24, gold = 0xd8a83a, cream = 0xf0e6d0;
  K.add('flat', H.box(w + 0.3, 0.22, d + 0.5, { y: -0.11, color: 0x6a5040 }), H.box(w - 0.6, 0.3, d - 1.6, { y: -0.3, color: cream }));
  K.add('flat', H.box(w, 1.0, d, { y: -T + 0.5, color: maroon }), H.box(w + 0.04, 0.12, d + 0.04, { y: -T + 1.0, color: gold }));
  K.add('flat', H.box(w, T - 1.3, d * 0.5, { y: -T + 1 + (T - 1.3) / 2, color: cream }));
  K.add('glow', H.box(w + 0.04, 0.8, d * 0.44, { y: -0.85, color: 0xffd890 })); // lit windows
  // neon trim: cyan along the roof's edges, pink round the ends, a destination sign
  for (const sx of [-1, 1]) K.add('neon', H.box(0.08, 0.08, d + 0.5, { x: sx * (w / 2 + 0.16), y: -0.12, color: N_CYAN }), H.box(0.06, 0.06, d, { x: sx * (w / 2 + 0.03), y: -T + 1.12, color: N_PINK }));
  for (const sz of [-1, 1]) K.add('neon', H.box(w + 0.3, 0.08, 0.08, { y: -0.12, z: sz * (d / 2 + 0.26), color: N_PINK }));
  K.add('glow', ...text('POWELL', { px: 0.07, depth: 0.03, y: -0.45, z: -d / 2 + 0.02, ry: Math.PI, color: N_AMBER }));
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) K.add('flat', H.box(0.08, T - 1.2, 0.08, { x: sx * (w / 2 - 0.1), y: -T / 2 + 0.3, z: sz * (d / 2 - 0.2), color: gold }), H.box(0.08, T - 1.2, 0.08, { x: sx * (w / 2 - 0.1), y: -T / 2 + 0.3, z: sz * d * 0.33, color: gold }));
    K.add('flat', H.box(w + 0.1, 0.35, 0.3, { y: -T + 0.3, z: sz * (d / 2 + 0.1), color: 0x2a2a30 }), H.box(w * 0.6, 0.6, 0.06, { y: -0.75, z: sz * (d / 2 - 0.05), color: maroon }));
    K.add('glow', H.box(0.4, 0.3, 0.1, { y: -T + 1.4, z: sz * (d / 2 + 0.02), color: sz < 0 ? 0xfff0c0 : 0xff3a3a }));
  }
  K.add('flat', H.box(0.25, 0.2, d * 0.9, { x: w / 2 + 0.15, y: -T + 0.6, color: 0x5a4030 }), H.box(0.25, 0.2, d * 0.9, { x: -w / 2 - 0.15, y: -T + 0.6, color: 0x5a4030 }));
  K.add('flat', H.cyl(0.18, 0.22, 0.3, 6, { y: 0.15, z: -d * 0.3, color: gold })); // the bell
  for (const sz of [-0.3, 0.3]) K.add('glow', H.cyl(0.5, 0.5, 0.05, 8, { y: -T - 0.02, z: sz * d, color: 0x5ff0ff }));
  K.add('neon', H.box(0.12, 0.8, 0.5, { y: -T - 0.4, color: 0x2be8ff })); // the grip, down into the slot
}
// a terrace of the crooked street: a red-brick lane between hydrangea beds, turning at alternate ends
function lombard(K, p, th, rng, H) {
  const { w, d, thick: T } = p, k = p.tint;
  K.add('concrete', H.box(w, T, d, { y: -T / 2, color: 0xc8bca8 }));
  K.add('flat', H.box(2.2, 0.32, d - 3, { y: -0.14, z: k % 2 ? 1.5 : -1.5, color: 0xa84a3a }));
  K.add('flat', H.box(w, 0.32, 3, { y: -0.14, z: (k % 2 ? -1 : 1) * (d / 2 - 1.5), color: 0xa84a3a }));
  for (let z = -d / 2 + 0.5; z < d / 2; z += 1) K.add('flat', H.box(2.2, 0.02, 0.06, { y: 0.03, z, color: 0x8a3a2e }));
  const FL = [0xe86aa8, 0xb05ad8, 0x6a8aff, 0xff5a6a];
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.5, 0.36, d - 4, { x: sx * (w / 2 - 0.3), y: -0.05, z: k % 2 ? 1.5 : -1.5, color: 0x3e6a2e }));
    for (let z = -d / 2 + 3; z < d / 2 - 2; z += 1.6) K.add('flat', H.box(0.36, 0.2, 0.5, { x: sx * (w / 2 - 0.3), y: 0.18, z: z + (k % 2 ? 1.5 : -1.5) * 0, color: FL[Math.floor(rng() * 4)] }));
    for (let z = -d / 2 + 4; z < d / 2 - 2; z += 4) K.add('glow', H.box(0.16, 0.3, 0.16, { x: sx * (w / 2 - 0.62), y: 0.15, z, color: 0xffd890 })); // path lights in the beds
  }
  edgeRect(K, H, w, d, 0xff5aa8, { y: -0.3, t: 0.08 });
}
function sfPark(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  rock(K, H, w, d, T - 0.5, -0.5, rng);
  K.add('flat', H.box(w, 0.5, d, { y: -0.25, color: 0x6e9244 }));
  if (p.tint === 1) { // Pioneer Park: a paved ring round the tower base
    K.add('flat', H.cyl(8.5, 8.5, 0.52, H.seg(24, 14), { y: -0.24, color: 0xc8c0b0 }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tree(K, H, sx * (w / 2 - 1.2), sz * (d / 2 - 1.2), 1.1, 1);
    K.add('neon', H.part(new H.THREE.RingGeometry(8.3, 8.5, H.seg(40, 20)), { rx: -Math.PI / 2, y: 0.03, color: N_AMBER })); // the ring's light line
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; K.add('glow', H.box(0.5, 0.12, 0.5, { x: Math.cos(a) * 7.6, y: 0.03, z: Math.sin(a) * 7.6, color: 0xfff0c0 })); } // uplights round the tower
    edgeRect(K, H, w, d, TERRACE, { y: -0.36, t: 0.08 });
    return;
  }
  K.add('flat', H.box(2, 0.52, d, { y: -0.24, color: 0xc8b88e }), H.box(w, 0.52, 2, { y: -0.24, color: 0xc8b88e }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tree(K, H, sx * (w / 2 - 2), sz * (d / 2 - 2), 1.2, (sx + sz) & 1);
  for (const sx of [-1, 1]) K.add('flat', H.box(1.6, 0.45, 0.5, { x: sx * 3, y: 0.22, z: 2, color: 0x6a4a30 }));
  for (const [x, z] of [[1.6, 1.6], [-1.6, -1.6]]) { // lamps where the paths cross
    K.add('flat', H.box(0.14, 3.8, 0.14, { x, y: 1.9, z, color: 0x1e2e26 }));
    K.add('glow', H.part(new H.THREE.IcosahedronGeometry(0.28, 0), { x, y: 3.95, z, color: 0xffe4a0 }));
    pool(K, H, x, z, 3, 0x302818, 0.03);
  }
  edgeRect(K, H, w, d, TERRACE, { y: -0.36, t: 0.08 });
}
// Coit Tower: a fluted concrete column, arched windows round the top, a parapet you stand inside
function coitTower(K, p, th, rng, H) {
  const r = p.r, T = p.thick, n = H.seg(20, 12), c = 0xe8e0cc;
  K.add('flat', H.cyl(r, r * 1.04, T, n, { y: -T / 2, color: c }));
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; K.add('flat', H.box(0.5, T - 6, 0.3, { x: Math.cos(a) * (r + 0.08), y: -T / 2 - 2, z: Math.sin(a) * (r + 0.08), ry: -a + Math.PI / 2, color: 0xd4ccb6 })); }
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; K.add('flat', H.box(0.9, 2.4, 0.2, { x: Math.cos(a) * (r + 0.05), y: -2.4, z: Math.sin(a) * (r + 0.05), ry: -a + Math.PI / 2, color: 0x2a2c34 })); }
  K.add('flat', H.cyl(r + 0.3, r + 0.3, 0.6, n, { y: -0.6, color: 0xd8d0bc }), H.cyl(r + 0.4, r + 0.5, 0.8, n, { y: -T + 0.4, color: 0xc8c0aa }));
  for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; K.add('flat', H.box(0.5, 0.9, 0.3, { x: Math.cos(a) * (r - 0.15), y: 0.45, z: Math.sin(a) * (r - 0.15), ry: -a + Math.PI / 2, color: c })); }
  // floodlit: the shafts between the flutes glow warm, brightest at the foot; the arched windows lit,
  // a neon crown under the parapet, a red beacon
  for (let i = 0; i < 16; i++) {
    const a = (i + 0.5) / 16 * Math.PI * 2;
    K.add('glow', paint(H.box(0.5, T - 7, 0.06, { x: Math.cos(a) * (r + 0.03), y: -T / 2 - 2.5, z: Math.sin(a) * (r + 0.03), ry: -a + Math.PI / 2 }), (x, y) => lerpHex(0xffd8a0, 0x6a5a48, (y + T) / T)));
  }
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; K.add('glow', H.box(0.6, 1.8, 0.2, { x: Math.cos(a) * (r + 0.1), y: -2.6, z: Math.sin(a) * (r + 0.1), ry: -a + Math.PI / 2, color: 0xffc880 })); }
  edgeDisc(K, H, r + 0.3, N_AMBER, { y: -0.95, t: 0.09, n: 32 });
  K.add('glow', H.box(0.4, 0.4, 0.4, { x: r - 0.5, y: 1.1, color: N_RED }));
}
function coitLedge(K, p, th, rng, H) {
  const { w, d } = p, c = 0xe0d8c4;
  K.add('flat', H.box(w, 0.6, d, { y: -0.3, color: c }), H.box(w - 0.4, 0.04, d - 0.4, { y: 0.01, color: 0xc8c0aa }));
  railZ(K, H, w / 2 - 0.1, d, 0.8, c, 0.5); railX(K, H, -d / 2 + 0.1, w, 0.8, c, 0.5); railX(K, H, d / 2 - 0.1, w, 0.8, c, 0.5);
  K.add('flat', H.box(1.2, 1.4, 1.2, { x: -w / 2 + 0.6, y: -1.2, rz: 0.5, color: 0xd0c8b4 }));
  edgeRect(K, H, w, d, N_AMBER, { y: -0.2, faces: [0, 1, 2] });
}
function sfPier(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, 0.4, d, { y: -0.2, color: 0x8a6a4a }));
  for (let z = -d / 2 + 0.5; z < d / 2; z += 1) K.add('flat', H.box(w, 0.03, 0.06, { y: 0.01, z, color: 0x6a5038 }));
  for (let z = -d / 2 + 1; z < d / 2; z += 4) for (const sx of [-1, 0, 1]) K.add('flat', H.box(0.5, T, 0.5, { x: sx * (w / 2 - 0.4), y: -T / 2, z, color: 0x4a3a2c }));
  railZ(K, H, w / 2 - 0.1, d, 1, 0x5a4636, 2); railZ(K, H, -w / 2 + 0.1, d, 1, 0x5a4636, 2);
  // string lights along both rails, lamp posts, a lit edge at the water
  for (const sx of [-1, 1]) {
    dots(K, H, [sx * (w / 2 - 0.1), 1.12, -d / 2 + 0.5], [sx * (w / 2 - 0.1), 1.12, d / 2 - 0.5], Math.round(d / 1.2), 0.16, [0xffd890, N_PINK, 0xffd890, N_CYAN]);
    for (let z = -d / 2 + 4; z < d / 2; z += 10) {
      K.add('flat', H.box(0.15, 4, 0.15, { x: sx * (w / 2 - 0.5), y: 2, z, color: 0x2a2c34 }));
      K.add('glow', H.box(0.4, 0.3, 0.4, { x: sx * (w / 2 - 0.5), y: 4.1, z, color: 0xfff0c0 }));
      pool(K, H, sx * (w / 2 - 1.5), z, 2.4, 0x2e2418, 0.03);
    }
  }
  edgeRect(K, H, w, d, N_CYAN, { y: -0.3, t: 0.08 });
}
function sfShed(K, p, th, rng, H) {
  const { w, d, thick: T } = p, c = p.tint ? 0x3a8a8a : 0xd8a83a;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: c }), H.box(w + 0.4, 0.3, d + 0.4, { y: -0.15, color: 0x5a4636 }));
  K.add('glow', H.box(w + 0.04, 1.2, d * 0.7, { y: -T + 1.5, color: 0xffd890 }));
  K.add('glow', H.box(w * 0.8, 0.8, 0.1, { y: -0.9, z: -d / 2 - 0.06, color: p.tint ? 0xff5a8a : 0x2be8ff }));
  K.add('flat', ...text(p.tint ? 'PIER 39' : 'CRAB', { px: 0.13, depth: 0.04, y: -0.9, z: -d / 2 - 0.13, ry: Math.PI, color: 0x14141a }));
  edgeRect(K, H, w + 0.4, d + 0.4, p.tint ? N_PINK : N_CYAN, { y: -0.34 });
}
// a whole block of row houses (the city fringe): three facades a side, bays and cornices, a flat roof
function sfBlock(K, p, th, rng, H) {
  const { w, d, thick: T } = p, t0 = p.tint >= 0 ? p.tint : 0, hh = Math.min(T, 12);
  K.add('concrete', H.box(w, T - hh, d, { y: -hh - (T - hh) / 2, color: WALLS[t0 % 8] }));
  K.add('flat', H.box(w, 0.2, d, { y: -0.1, color: 0x8a8076 }));
  let n = t0;
  for (const f of H.faces(w, d)) for (let k = 0; k < 3; k++) {
    const off = (k - 1) * (f.width / 3), col = PASTEL[n % 8], tr = TRIM[n % 8], fw = f.width / 3 - 0.2; n += 3;
    const at = (out, y, ww, hgt, dep, color) => K.add('flat', H.box(f.tx ? ww : dep, hgt, f.tz ? ww : dep, { x: f.nx * (f.half + out) + f.tx * off, y, z: f.nz * (f.half + out) + f.tz * off, color }));
    at(-0.3, -hh / 2, fw, hh, 0.6, col);
    at(0.15, -0.35, fw + 0.2, 0.5, 0.5, tr);
    at(0.35, -hh * 0.45, fw * 0.45, hh * 0.55, 0.7, col);
    for (const y of [-hh * 0.3, -hh * 0.6]) { // windows: mostly lit
      for (const [o2, ww, hgt] of [[0.72, fw * 0.36, 1.4], [0.05, 0.7, 1.5]]) {
        const r = rng();
        K.add(r < 0.7 ? 'glow' : 'flat', H.box(f.tx ? ww : 0.06, hgt, f.tz ? ww : 0.06, { x: f.nx * (f.half + o2) + f.tx * off, y, z: f.nz * (f.half + o2) + f.tz * off, color: r < 0.62 ? WARMWIN[Math.floor(rng() * 4)] : r < 0.7 ? 0x8ac8ff : 0x2a3448 }));
      }
    }
    at(0.05, -hh + 1.1, fw * 0.4, 2.2, 0.06, 0xf8f4ec);
    K.add('neon', H.box(f.tx ? fw + 0.3 : 0.08, 0.08, f.tz ? fw + 0.3 : 0.08, { x: f.nx * (f.half + 0.42) + f.tx * off, y: -0.62, z: f.nz * (f.half + 0.42) + f.tz * off, color: LADY_NEON[n % 8] }));
  }
}
function sfFloat(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: 0xd8d4cc }), H.box(w + 0.1, 0.12, d + 0.1, { y: -T + 0.1, color: 0x3a3c44 }));
  if (rng() < 0.7) for (let k = 0; k < 2; k++) { // a basking sea lion (scenery)
    const x = (rng() - 0.5) * (w - 1.6), z = (rng() - 0.5) * (d - 2);
    K.add('flat', H.box(0.7, 0.45, 1.8, { x, y: 0.22, z, ry: rng() * 3, color: 0x5a4030 }), H.box(0.45, 0.4, 0.5, { x, y: 0.5, z: z - 0.7, color: 0x6a4a36 }));
  }
  for (const f of H.faces(w + 0.12, d + 0.12)) K.add('glow', H.box(f.tx ? f.width : 0.08, 0.08, f.tz ? f.width : 0.08, { x: f.nx * f.half, y: -0.1, z: f.nz * f.half, color: N_CYAN }));
}

// ------------------------------------------------------------------ stage 3: Twin Peaks in the fog
// a hilltop rising out of the fog (disc): 0 dry-grass peak, 1 rocky summit, 2 park (trees round the rim),
// 3 the lookout (paving, telescopes, a radio mast), 4 Corona Heights' red chert
function sfPeak(K, p, th, rng, H) {
  const r = p.r, T = p.thick, t = p.tint >= 0 ? p.tint : 0, n = H.seg(18, 11);
  const top = [0xd0b874, 0xb4a282, 0x6e9a46, 0xc4bca4, 0xb8704a][t] ?? 0xd0b874;
  const body = t === 4 ? 0x8a4a32 : t === 2 ? 0x6a5a40 : 0x8a7a5a;
  K.add('flat', H.cyl(r, r, 0.5, n, { y: -0.25, color: top }));
  K.add('flat', H.cyl(r * 0.98, r * 1.5, T - 0.5, n, { y: -0.5 - (T - 0.5) / 2, color: body }));
  for (let i = 0; i < Math.round(r * 0.8); i++) { // boulders round the rim, below the edge
    const a = rng() * Math.PI * 2, s = 1 + rng() * 1.6, R = r * (1 + rng() * 0.15);
    K.add('flat', H.part(new H.THREE.DodecahedronGeometry(s, 0), { x: Math.cos(a) * R, y: -s - 0.6 - rng() * 4, z: Math.sin(a) * R, rx: rng(), ry: rng(), color: t === 4 ? 0x9a5238 : ROCK[i % 3] }));
  }
  if (t === 2) for (let i = 0, m = Math.round(r / 3); i < m; i++) { // slender eucalyptus round the rim
    const a = (i / m) * Math.PI * 2 + rng() * 0.3, R = r - 0.9, hgt = 7 + rng() * 3;
    K.add('flat', H.box(0.3, hgt, 0.3, { x: Math.cos(a) * R, y: hgt / 2, z: Math.sin(a) * R, color: 0xd8ccb4 }));
    K.add('flat', H.part(new H.THREE.OctahedronGeometry(1.2, 0), { x: Math.cos(a) * R, y: hgt + 0.6, z: Math.sin(a) * R, sy: 2.2, color: i % 2 ? 0x5a7a5a : 0x6a8a62 }));
  } else if (t === 1) {
    K.add('flat', H.box(1.2, 1.4, 1.2, { y: 0.7, color: 0x9a948a }), H.box(1.6, 0.2, 1.6, { y: 1.45, color: 0x7a746a }));
  } else if (t === 3) {
    K.add('flat', H.cyl(r - 1, r - 1, 0.52, n, { y: -0.24, color: 0x9a9690 }));
    for (const a of [0.4, 2.2, 4]) {
      K.add('flat', H.box(0.2, 1.1, 0.2, { x: Math.cos(a) * (r - 2), y: 0.55, z: Math.sin(a) * (r - 2), color: 0x3a3c44 }), H.box(0.3, 0.3, 0.9, { x: Math.cos(a) * (r - 2), y: 1.2, z: Math.sin(a) * (r - 2), ry: -a, color: 0x2a5a8a }));
      K.add('glow', H.box(0.12, 0.12, 0.12, { x: Math.cos(a) * (r - 2), y: 1.45, z: Math.sin(a) * (r - 2), color: N_CYAN }));
    }
    K.add('flat', H.box(0.3, 14, 0.3, { x: -r + 2.5, y: 7, z: 1, color: 0xd8d0c8 }));
    K.add('glow', H.box(0.5, 0.5, 0.5, { x: -r + 2.5, y: 14.2, z: 1, color: 0xff2a2a }), H.box(0.4, 0.4, 0.4, { x: -r + 2.5, y: 7.2, z: 1, color: 0xff2a2a }));
    K.add('neon', H.part(new H.THREE.RingGeometry(r - 1.15, r - 1, H.seg(36, 18)), { rx: -Math.PI / 2, y: 0.04, color: N_CYAN })); // the lookout's lit kerb
  } else if (t === 0) {
    for (let i = 0; i < 6; i++) { const a = rng() * Math.PI * 2, R = r * (0.6 + rng() * 0.32); K.add('flat', H.box(0.9, 0.35, 0.9, { x: Math.cos(a) * R, y: 0.15, z: Math.sin(a) * R, color: 0x7a7a4a })); }
  }
  // night: a light line under the rim and path lights round it, so every hilltop's edge reads over the fog
  edgeDisc(K, H, r, [N_AMBER, N_CYAN, 0x7bff9a, N_CYAN, N_PINK][t] ?? N_AMBER, { y: -0.42, n: 36, t: 0.09 });
  for (let i = 0, m = Math.max(5, Math.round(r * 0.55)); i < m; i++) {
    const a = (i + 0.5) / m * Math.PI * 2, R = r - 0.55;
    K.add('flat', H.box(0.18, 0.5, 0.18, { x: Math.cos(a) * R, y: 0.25, z: Math.sin(a) * R, color: 0x2a2c34 }));
    K.add('glow', H.box(0.22, 0.14, 0.22, { x: Math.cos(a) * R, y: 0.56, z: Math.sin(a) * R, color: 0xffd890 }));
  }
}
function sfRoad(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: ASPHALT }), H.box(w + 0.6, T - 0.3, d, { y: -0.3 - (T - 0.3) / 2, color: 0x7a6a50 }));
  if (p.tint === 1) { K.add('flat', H.box(0.2, 1.1, 0.2, { x: 1, y: 0.55, color: 0x3a3c44 }), H.box(0.3, 0.3, 0.9, { x: 1, y: 1.2, rx: 0.2, color: 0x2a5a8a })); edgeRect(K, H, w, d, N_OR, { y: -0.2 }); return; }
  K.add('flat', H.box(0.14, 0.02, d, { x: -0.1, y: 0.01, color: YELLOW }), H.box(0.14, 0.02, d, { x: 0.1, y: 0.01, color: YELLOW }));
  for (let z = -d / 2 + 1.5; z < d / 2; z += 3) K.add('glow', H.box(0.18, 0.05, 0.18, { y: 0.03, z, color: N_AMBER })); // cat's eyes
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.12, 0.12, d, { x: sx * (w / 2 - 0.1), y: 0.7, color: 0xb8b8b8 }));
    K.add('neon', H.box(0.06, 0.05, d, { x: sx * (w / 2 - 0.1), y: 0.79, color: N_OR })); // the guardrail's light line
    for (let z = -d / 2 + 1; z < d / 2; z += 3) K.add('flat', H.box(0.15, 0.75, 0.15, { x: sx * (w / 2 - 0.1), y: 0.37, z, color: 0x6a5a48 }));
  }
}
// the hover gondola circling Corona Heights: an open round deck, a glass rail, thrusters under the bowl
function sfPod(K, p, th, rng, H) {
  const r = p.r, n = H.seg(18, 12);
  K.add('deck', H.cyl(r, r, 0.12, n, { y: -0.06, color: 0xc8c4bc }));
  K.add('flat', H.cyl(r, r * 0.7, p.thick, n, { y: -p.thick / 2 - 0.1, color: 0xb81e2a }), H.cyl(r + 0.1, r + 0.1, 0.25, n, { y: -0.2, color: 0xf0e6d0 }));
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; K.add('flat', H.box(0.08, 1, 0.08, { x: Math.cos(a) * (r - 0.1), y: 0.5, z: Math.sin(a) * (r - 0.1), color: 0xd8a83a })); }
  K.add('flat', H.part(new H.THREE.TorusGeometry(r - 0.1, 0.06, 3, n), { y: 1, rx: Math.PI / 2, color: 0xd8a83a }));
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; K.add('glow', H.cyl(0.4, 0.4, 0.06, 8, { x: Math.cos(a) * r * 0.5, y: -p.thick - 0.15, z: Math.sin(a) * r * 0.5, color: 0x5ff0ff })); }
  K.add('glow', H.box(0.3, 0.3, 0.3, { x: r - 0.2, y: 1.3, color: 0xffd23a }));
  edgeDisc(K, H, r + 0.1, N_PINK, { key: 'glow', y: -0.36, n: 18 });
  K.add('glow', H.part(new H.THREE.TorusGeometry(r - 0.1, 0.04, 3, n), { y: 1.06, rx: Math.PI / 2, color: N_AMBER })); // the rail's lit top
}
// Sutro Tower: lattice legs banded red and white, lattice beams with grating decks, the crown deck
const SU_RED = 0xd23a2e, SU_WHITE = 0xf0ece4, STEEL = 0x5a5e68;
function sutroLeg(K, p, th, rng, H) {
  const { w, d, thick: T } = p, seg = 6;
  K.add('flat', H.box(w * 0.5, T, d * 0.5, { y: -T / 2, color: STEEL }));
  for (let y = 0, i = 0; y > -T; y -= seg, i++) {
    const col = i % 2 ? SU_WHITE : SU_RED, hh = Math.min(seg, T + y);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.45, hh, 0.45, { x: sx * (w / 2 - 0.22), y: y - hh / 2, z: sz * (d / 2 - 0.22), color: col }));
    K.add('flat', H.box(w + 0.05, 0.3, d + 0.05, { y: y - 0.15, color: col }));
    for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? Math.sqrt(w * w + hh * hh) * 0.98 : 0.14, 0.14, f.tz ? Math.sqrt(d * d + hh * hh) * 0.98 : 0.14, { x: f.nx * (f.half - 0.05), y: y - hh / 2, z: f.nz * (f.half - 0.05), rz: f.tx ? Math.atan2(hh, w) * (i % 2 ? 1 : -1) : 0, rx: f.tz ? Math.atan2(hh, d) * (i % 2 ? 1 : -1) : 0, color: col }));
    if (i % 3 === 1) for (const [sx, sz] of [[-1, -1], [1, 1]]) K.add('glow', H.box(0.4, 0.4, 0.4, { x: sx * (w / 2 + 0.05), y: y - 0.3, z: sz * (d / 2 + 0.05), color: N_RED })); // obstruction lights
  }
}
function sutroBeam(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('deck', H.box(w, 0.1, d, { y: -0.05, color: 0xb0aca6 }));
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.3, 0.3, d, { x: sx * (w / 2 - 0.15), y: -0.25, color: SU_RED }), H.box(0.3, 0.3, d, { x: sx * (w / 2 - 0.15), y: -T, color: SU_RED }));
    for (let z = -d / 2; z < d / 2 - 0.1; z += 2) K.add('flat', H.box(0.12, Math.sqrt(4 + T * T), 0.12, { x: sx * (w / 2 - 0.15), y: -T / 2 - 0.1, z: z + 1, rx: Math.atan2(2, T) * ((z / 2) % 2 ? 1 : -1), color: SU_WHITE }));
    K.add('flat', H.box(0.08, 0.08, d, { x: sx * (w / 2 - 0.05), y: 1, color: SU_WHITE }));
    for (let z = -d / 2; z <= d / 2; z += 3) K.add('flat', H.box(0.08, 1, 0.08, { x: sx * (w / 2 - 0.05), y: 0.5, z, color: SU_WHITE }));
    K.add('neon', H.box(0.08, 0.08, d, { x: sx * (w / 2 + 0.02), y: -0.12, color: N_AMBER }));
    for (let z = -d / 2 + 2; z < d / 2; z += 5) K.add('glow', H.box(0.3, 0.15, 0.3, { x: sx * (w / 2 - 0.15), y: -T - 0.2, z, color: SODIUM })); // work lamps under the grating
  }
}
function sutroDeck(K, p, th, rng, H) {
  const r = p.r, n = H.seg(24, 14);
  K.add('deck', H.cyl(r, r, 0.12, n, { y: -0.06, color: 0xc0bcb4 }));
  K.add('flat', H.cyl(r, r * 0.8, p.thick - 0.1, n, { y: -0.12 - (p.thick - 0.1) / 2, color: SU_RED }));
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; K.add('flat', H.box(0.1, 1.1, 0.1, { x: Math.cos(a) * (r - 0.1), y: 0.55, z: Math.sin(a) * (r - 0.1), color: SU_WHITE })); }
  K.add('flat', H.part(new H.THREE.TorusGeometry(r - 0.1, 0.07, 3, n), { y: 1.1, rx: Math.PI / 2, color: SU_WHITE }));
  for (let k = 0; k < 3; k++) { // the antenna masts over the legs
    const a = Math.PI / 2 + k * 2 * Math.PI / 3, x = Math.cos(a) * 13, z = Math.sin(a) * 13;
    for (let i = 0; i < 4; i++) K.add('flat', H.box(0.5, 4.5, 0.5, { x, y: 2.25 + i * 4.5, z, color: i % 2 ? SU_WHITE : SU_RED }));
    K.add('flat', H.box(0.7, 0.5, 0.7, { x, y: 18.3, z, color: 0x3a0e0a })); // the beacon housing (its light blinks: sfBeacons)
    K.add('glow', H.box(0.55, 0.55, 0.55, { x, y: 9.2, z, color: 0xff2a2a }));
    K.add('glow', H.box(0.8, 0.3, 0.8, { x: x * 0.88, y: 0.15, z: z * 0.88, color: 0xfff0d0 })); // floodlights at the masts' feet
  }
  edgeDisc(K, H, r, N_RED, { y: -0.2, n: 32, t: 0.09 });
  K.add('glow', H.part(new H.THREE.TorusGeometry(r - 0.1, 0.05, 3, n), { y: 1.16, rx: Math.PI / 2, color: N_AMBER }));
}
function sutroLift(K, p, th, rng, H) {
  const r = p.r, n = H.seg(14, 10);
  K.add('deck', H.cyl(r, r, 0.12, n, { y: -0.06, color: 0xc8c4bc }), H.cyl(r, r, p.thick - 0.1, n, { y: -0.12 - (p.thick - 0.1) / 2, color: 0x3a3c46 }));
  K.add('neon', H.part(new H.THREE.TorusGeometry(r, 0.08, 3, n), { y: -0.1, rx: Math.PI / 2, color: 0xffd23a }));
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.78; K.add('flat', H.box(0.12, 1.1, 0.12, { x: Math.cos(a) * (r - 0.15), y: 0.55, z: Math.sin(a) * (r - 0.15), color: 0xffd23a })); }
  K.add('glow', H.cyl(0.6, 0.6, 0.05, 8, { y: -p.thick - 0.05, color: 0x5ff0ff }));
}
function sutroLedge(K, p, th, rng, H) {
  const { w, d } = p;
  K.add('deck', H.box(w, 0.1, d, { y: -0.05, color: 0xb0aca6 }), H.box(w, 0.35, d, { y: -0.3, color: SU_RED }));
  railX(K, H, d / 2 - 0.05, w, 0.9, SU_WHITE, 1.1); railZ(K, H, w / 2 - 0.05, d, 0.9, SU_WHITE, 1.1);
  edgeRect(K, H, w, d, N_AMBER, { y: -0.15 });
}
// downtown: the pyramid's plaza block, a little redwood park, office podium facades with lit windows
function sfDowntown(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  const g = H.meterBox(w, T, d, H.FACADE_M, { faces: ['px', 'nx', 'pz', 'nz'], u0: 4, v0: 8, color: 0xd8d4cc });
  g.translate(0, -T / 2, 0); K.add('facade', g);
  K.add('flat', H.box(w, 0.4, d, { y: -0.2, color: 0xb8b2a6 }));
  for (let x = -w / 2 + 3; x < w / 2; x += 3) K.add('flat', H.box(0.05, 0.02, d, { x, y: 0.01, color: 0x9a948a }));
  for (const [x, z] of [[-w / 2 + 3, -d / 2 + 3], [-w / 2 + 6, -d / 2 + 4], [-w / 2 + 3.5, -d / 2 + 7]]) {
    K.add('flat', H.box(0.6, 3, 0.6, { x, y: 1.5, z, color: 0x7a4a30 }), H.part(new H.THREE.ConeGeometry(1.6, 9, 6), { x, y: 7, z, color: 0x2e4a2a }));
    K.add('glow', H.box(0.5, 0.15, 0.5, { x: x + 0.7, y: 0.08, z, color: 0x9affc8 })); // uplit redwoods
  }
  for (const sx of [-1, 1]) for (const z of [-d / 4, d / 4]) {
    K.add('flat', H.box(0.2, 4.5, 0.2, { x: sx * (w / 2 - 1), y: 2.25, z, color: 0x2a2c34 })); K.add('glow', H.box(0.5, 0.4, 0.5, { x: sx * (w / 2 - 1), y: 4.6, z, color: 0xfff0c0 }));
    pool(K, H, sx * (w / 2 - 2), z, 3, 0x302818, 0.03);
  }
  edgeRect(K, H, w, d, N_CYAN, { y: -0.45 });
  for (const f of H.faces(w, d)) K.add('neon', H.box(f.tx ? f.width + 0.1 : 0.1, 0.12, f.tz ? f.width + 0.1 : 0.1, { x: f.nx * (f.half + 0.05), y: -4.2, z: f.nz * (f.half + 0.05), color: N_PINK })); // the podium's light band
}
// one setback of the Transamerica pyramid: white precast quartz, narrow slot windows (some lit),
// the elevator wings on the east and west faces of the middle setbacks
function transamerica(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: 0xf2eee6 }), H.box(w + 0.25, 0.3, d + 0.25, { y: -0.15, color: 0xfaf8f2 }));
  for (const f of H.faces(w, d)) {
    const n = Math.max(2, Math.floor(f.width / 1.6));
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * (f.width / n), lit = rng() < 0.5;
      K.add(lit ? 'glow' : 'flat', H.box(f.tx ? 0.45 : 0.06, T - 1.2, f.tz ? 0.45 : 0.06, { x: f.nx * (f.half + 0.02) + f.tx * off, y: -T / 2 - 0.2, z: f.nz * (f.half + 0.02) + f.tz * off, color: lit ? 0xffd8a0 : 0x3a4250 }));
    }
  }
  if (p.tint >= 2 && p.tint <= 6) for (const sx of [-1, 1]) K.add('flat', H.box(2.4, T, 6, { x: sx * (w / 2 + 1.2), y: -T / 2, color: 0xe4e0d6 }), H.box(0.06, T - 1, 1.2, { x: sx * (w / 2 + 2.42), y: -T / 2, color: 0x3a4250 }));
  if (p.tint >= 2 && p.tint <= 6) for (const sx of [-1, 1]) K.add('glow', H.box(0.06, T - 1, 0.5, { x: sx * (w / 2 + 2.44), y: -T / 2, color: 0xfff0d0 })); // the lift shafts' lit slots
  edgeRect(K, H, w + 0.25, d + 0.25, 0xfff0d0, { y: -0.36, key: 'glow', t: 0.12 }); // each setback traced in light: the pyramid's outline
}
function taSpire(K, p, th, rng, H) {
  const T = p.thick;
  K.add('glow', paint(H.part(new H.THREE.ConeGeometry(1.6, T + 4, 4), { y: -T / 2 + 2, ry: Math.PI / 4 }), (x, y) => lerpHex(0xfff0d0, 0xff8a5a, (y + T) / (T + 4)))); // the spire, lit
  K.add('glow', H.box(0.4, 0.4, 0.4, { y: 4.2, color: 0xff2a2a }));
}
function sfCross(K, p, th, rng, H) {
  const { w, d, thick: T } = p, c = 0xd8d2c4;
  K.add('flat', H.box(w, T, d, { y: -T / 2, color: c }), H.box(w + 0.2, 0.3, d + 0.2, { y: -0.15, color: 0xe8e2d4 }));
  if (p.tint === 1) for (const sx of [-1, 1]) K.add('flat', H.box(0.6, T + 0.4, d + 0.2, { x: sx * (w / 2 - 0.3), y: -T / 2, color: 0xc8c2b4 }));
  else { K.add('flat', H.box(w + 1.2, 3, d + 1.2, { y: -T + 1.5, color: 0xc0baac })); K.add('neon', H.box(0.2, T * 0.7, d + 0.1, { x: 0, y: -T * 0.45, color: 0xffe0a0 })); }
  // floodlit from its foot: glowing faces, brightest low; a light line round the top you stand on
  for (const sz of [-1, 1]) K.add('glow', paint(H.box(w - 0.3, T - 0.6, 0.04, { y: -T / 2 - 0.3, z: sz * (d / 2 + 0.02) }), (x, y) => lerpHex(0xfff0c8, 0x8a7a68, (y + T) / T)));
  edgeRect(K, H, w + 0.2, d + 0.2, N_AMBER, { y: -0.36 });
}
// a floating street lamp: a green iron disc on a hover pad, a lamp post at its rim, a glowing globe
function sfLamp(K, p, th, rng, H) {
  const r = p.r, n = H.seg(12, 8);
  K.add('flat', H.cyl(r, r, 0.15, n, { y: -0.07, color: 0x5a6a5a }), H.cyl(r * 0.95, r * 0.5, p.thick, n, { y: -p.thick / 2 - 0.1, color: 0x2e4a3a }));
  K.add('flat', H.box(0.14, 3, 0.14, { x: r - 0.25, y: 1.5, color: 0x1e2e26 }), H.box(0.5, 0.15, 0.5, { x: r - 0.25, y: 3, color: 0x1e2e26 }));
  K.add('glow', H.part(new H.THREE.IcosahedronGeometry(0.32, 0), { x: r - 0.25, y: 3.35, color: 0xffe4a0 }));
  K.add('glow', H.cyl(r * 0.3, r * 0.3, 0.05, 8, { y: -p.thick - 0.15, color: 0x5ff0ff }));
  edgeDisc(K, H, r, 0xffc070, { key: 'glow', y: -0.12, n: 14, t: 0.06 });
  pool(K, H, 0, 0, r * 0.9, 0x3a2e1c, 0.025);
}

// ------------------------------------------------------------------ the boss: Bernal Hill park
// the lawn: mowing stripes, gravel paths, the fault line itself scarred across the grass, the hill under it
function sfMeadow(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  for (let i = 0; i < 10; i++) K.add('flat', H.box(w / 10, 0.5, d, { x: -w / 2 + (i + 0.5) * (w / 10), y: -0.25, color: i % 2 ? 0x6e9a42 : 0x7aa64a }));
  K.add('flat', H.box(3, 0.52, d - 8, { x: -w / 2 + 6, y: -0.24, color: 0xc8b48a }), H.box(w - 12, 0.52, 3, { y: -0.24, z: d / 2 - 6, color: 0xc8b48a }), H.box(w - 12, 0.52, 3, { y: -0.24, z: -d / 2 + 6, color: 0xc8b48a }));
  let x = -w / 2 + 2, z = -6;
  while (x < w / 2 - 2) { // the fault: a jagged scar of dark earth, west to east
    const nx = x + 3 + rng() * 3, nz = clampN(z + (rng() - 0.5) * 6, -14, 10), len = Math.sqrt((nx - x) * (nx - x) + (nz - z) * (nz - z));
    K.add('flat', H.box(len + 0.4, 0.53, 0.7 + rng() * 0.5, { x: (x + nx) / 2, y: -0.23, z: (z + nz) / 2, ry: -Math.atan2(nz - z, nx - x), color: 0x4a3626 }));
    K.add('glow', H.box(len + 0.1, 0.03, 0.18, { x: (x + nx) / 2, y: 0.045, z: (z + nz) / 2, ry: -Math.atan2(nz - z, nx - x), color: 0xc8501a })); // the fault glows in its crack
    x = nx; z = nz;
  }
  rock(K, H, w, d, T - 0.5, -0.5, rng);
  for (const [sx, sz] of [[-1, 1], [1, 1]]) for (let k = 0; k < 3; k++) K.add('flat', H.box(1.8, 0.45, 0.5, { x: sx * (8 + k * 6), y: 0.22, z: sz * (d / 2 - 3.2), color: 0x7a5a3a })); // benches
  // park lamps along the north and south paths, path lights down the west one, a lit edge round the hilltop
  for (const sz of [-1, 1]) for (let lx = -w / 2 + 12; lx < w / 2 - 8; lx += 12) {
    const lz = sz * (d / 2 - 4.2);
    K.add('flat', H.box(0.14, 3.6, 0.14, { x: lx, y: 1.8, z: lz, color: 0x1e2e26 }));
    K.add('glow', H.part(new H.THREE.IcosahedronGeometry(0.3, 0), { x: lx, y: 3.75, z: lz, color: 0xffe4a0 }));
    pool(K, H, lx, sz * (d / 2 - 6), 3, 0x2c2a1c, 0.04);
  }
  for (let pz = -d / 2 + 8; pz < d / 2 - 6; pz += 6) for (const sx of [-1, 1]) K.add('glow', H.box(0.2, 0.25, 0.2, { x: -w / 2 + 6 + sx * 1.7, y: 0.12, z: pz, color: 0xffd890 }));
  edgeRect(K, H, w, d, 0x3a9ac8, { y: -0.3, t: 0.1 });
}
const clampN = (v, a, b) => (v < a ? a : v > b ? b : v);
function sfTerrace(K, p, th, rng, H) {
  const { w, d, thick: T } = p;
  const g = H.meterBox(w, T, d, 3, { faces: ['px', 'nx', 'pz', 'nz'], color: 0xb8ae98 });
  g.translate(0, -T / 2, 0); K.add('concrete', g);
  K.add('flat', H.box(w, 0.4, d, { y: -0.2, color: 0x6e9a42 }), H.box(w + 0.3, 0.35, d + 0.3, { y: -0.55, color: 0xa89e88 }));
  for (let i = 0; i < Math.floor(d / 4); i++) K.add('flat', H.box(0.9, 0.6, 0.9, { x: (rng() - 0.5) * (w - 2), y: 0.3, z: -d / 2 + 2 + i * 4, color: SHRUB }));
  if (p.tint === 1) for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width : 0.3, 0.9, f.tz ? f.width : 0.3, { x: f.nx * (f.half - 0.15), y: 0.45, z: f.nz * (f.half - 0.15), color: 0xd8d0bc }));
  edgeRect(K, H, w + 0.3, d + 0.3, N_AMBER, { y: -0.78 });
  for (const f of H.faces(w, d)) for (let off = -f.width / 2 + 3; off < f.width / 2 - 1; off += 6) K.add('glow', H.box(f.tx ? 0.6 : 0.2, 0.2, f.tz ? 0.6 : 0.2, { x: f.nx * (f.half + 0.1) + f.tx * off, y: -T + 4.6, z: f.nz * (f.half + 0.1) + f.tz * off, color: SODIUM })); // wall uplights
}
function sfBoulder(K, p, th, rng, H) {
  const { w, d, thick: T } = p, c = [0x8a8274, 0x7a7466, 0x9a8a72][(p.tint >= 0 ? p.tint : 0) % 3];
  K.add('flat', H.box(w * 0.92, T, d * 0.92, { y: -T / 2, color: c }), H.box(w * 0.75, 0.3, d * 0.75, { y: -0.12, color: 0x7a8a52 }));
  for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width * 0.7 : 0.8, T * 0.7, f.tz ? f.width * 0.7 : 0.8, { x: f.nx * (f.half - 0.3), y: -T * 0.45, z: f.nz * (f.half - 0.3), rx: f.tz ? 0.2 * f.nz : 0, rz: f.tx ? -0.2 * f.nx : 0, color: c }));
  K.add('flat', H.part(new H.THREE.DodecahedronGeometry(Math.min(w, d) * 0.35, 0), { x: w * 0.3, y: -T + 0.4, z: d * 0.35, color: c }));
  edgeRect(K, H, w * 0.92, d * 0.92, 0x2ab8c8, { y: -0.14, t: 0.08 }); // a seismic sensor strip round the top
  K.add('glow', H.box(0.16, 0.16, 0.16, { x: w * 0.3, y: 0.1, z: -d * 0.3, color: N_CYAN }));
}
function sfMast(K, p, th, rng, H) { // the Bernal Hill microwave tower: a lattice mast, dishes, a tall aerial
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w * 0.6, T, d * 0.6, { y: -T / 2, color: 0x6a6e78 }), H.box(w, 0.3, d, { y: -0.15, color: 0xb8bcc4 }));
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('flat', H.box(0.25, T, 0.25, { x: sx * (w / 2 - 0.12), y: -T / 2, z: sz * (d / 2 - 0.12), color: 0xd8dce4 }));
  for (let y = -1.5; y > -T; y -= 2) K.add('flat', H.box(w, 0.15, d, { y, color: 0xd8dce4 }));
  for (const [a, y] of [[0.4, -2.5], [2.6, -4.5], [4.4, -3.2]]) K.add('flat', H.part(new H.THREE.CylinderGeometry(0.9, 0.9, 0.25, 10), { x: Math.cos(a) * (w / 2 + 0.3), y, z: Math.sin(a) * (d / 2 + 0.3), rz: Math.PI / 2, ry: -a, color: 0xe8e8e8 }));
  K.add('flat', H.box(0.15, 12, 0.15, { x: w / 2 - 0.2, y: 6, z: d / 2 - 0.2, color: 0xd23a2e }));
  K.add('glow', H.box(0.4, 0.4, 0.4, { x: w / 2 - 0.2, y: 12.2, z: d / 2 - 0.2, color: 0xff2a2a }), H.box(0.3, 0.3, 0.3, { x: w / 2 - 0.2, y: 6, z: d / 2 - 0.2, color: 0xff2a2a }));
  for (const [a, y] of [[0.4, -2.5], [2.6, -4.5], [4.4, -3.2]]) K.add('glow', H.box(0.2, 0.2, 0.2, { x: Math.cos(a) * (w / 2 + 0.75), y, z: Math.sin(a) * (d / 2 + 0.75), color: N_CYAN })); // the dishes' feed lights
  edgeRect(K, H, w, d, N_AMBER, { y: -0.2 });
}
function sfWall(K, p, th, rng, H) {
  K.add('flat', H.box(p.w, p.thick, p.d, { y: -p.thick / 2, color: 0xb0a690 }), H.box(p.w + 0.1, 0.15, p.d + 0.2, { y: -0.07, color: 0xc8bea8 }));
  edgeRect(K, H, p.w + 0.1, p.d + 0.2, N_AMBER, { y: -0.22, t: 0.08 });
}
function sfTrunk(K, p, th, rng, H) {
  const T = p.thick;
  K.add('flat', H.box(p.w * 0.8, T, p.d * 0.8, { y: -T / 2, color: 0x5a4232 }));
  for (let i = 0; i < 3; i++) K.add('flat', H.box(0.35, 2.4, 0.35, { x: (i - 1) * 0.6, y: -1.2 + 0.5, z: (i % 2 ? 0.5 : -0.5), rz: (i - 1) * 0.6, color: 0x4a3626 }));
  K.add('flat', H.box(p.w * 1.6, 0.4, p.d * 1.6, { y: -T + 0.2, color: 0x4a3626 }));
}
function sfCanopy(K, p, th, rng, H) { // a wind-sheared Monterey cypress: flat, layered, darker underneath
  const { w, d, thick: T } = p;
  K.add('flat', H.box(w, 0.5, d, { y: -0.25, color: 0x3e6a32 }));
  K.add('flat', H.box(w * 1.15, T - 0.6, d * 0.9, { x: w * 0.12, y: -0.5 - (T - 0.6) / 2, color: 0x2e5226 }), H.box(w * 0.8, 0.8, d * 1.1, { x: -w * 0.1, y: -T + 0.2, color: 0x264420 }));
  for (let i = 0; i < 5; i++) K.add('flat', H.box(1.4, 0.6, 1.2, { x: (rng() - 0.5) * w, y: -0.05, z: (rng() < 0.5 ? -1 : 1) * (d / 2 - 0.4), color: 0x4a7a3a }));
  // fairy lights strung round the canopy's edge (warm, with the odd pink one)
  for (const f of H.faces(w + 0.1, d + 0.1)) {
    const n = Math.round(f.width / 0.8);
    for (let i = 0; i < n; i++) { const off = -f.width / 2 + (i + 0.5) * (f.width / n); K.add('glow', H.box(0.14, 0.14, 0.14, { x: f.nx * f.half + f.tx * off, y: -0.35 - Math.sin((i / n) * Math.PI * 4) ** 2 * 0.25, z: f.nz * f.half + f.tz * off, color: i % 5 ? 0xffd890 : N_PINK })); }
  }
}

export default { ggDeck, ggRail, ggLeg, ggStrut, ggSaddle, ggLedge, ggCable, ggFender, ggPlaza, ggBooth, sfRock, fortPoint, fortYard, sfShipBridge, sfLighthouse, sfYacht,
  sfMeadow, sfTerrace, sfBoulder, sfMast, sfWall, sfTrunk, sfCanopy,
  sfPeak, sfRoad, sfPod, sutroLeg, sutroBeam, sutroDeck, sutroLift, sutroLedge, sfDowntown, transamerica, taSpire, sfCross, sfLamp,
  sfLot, victorian, vicPorch, vicBay, vicTurret, sfStreet, sfPlaza, sfTurntable, cableCar, lombard, sfPark, coitTower, coitLedge, sfPier, sfShed, sfFloat, sfBlock };
export { rod, railX, railZ, rock, OR, OR_HI, OR_DK, ASPHALT, PAVE, LINE, YELLOW, ROCK, GRASS, SHRUB, BRICK, CREAM };
