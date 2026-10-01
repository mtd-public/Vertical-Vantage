// Backdrops: distant landmarks outside the play space (render-only: the sim never sees them).
// A level lists them as level.backdrops = [{ kind, x, y, z, yaw, s, haze, … }]; each kind's builder
// returns an Object3D in its own units, placed here at (x, y, z), turned by yaw and scaled by s.
// They ignore the fog (they're far beyond it) and fade toward the horizon colour by `haze` instead
// (o.haze ?? theme.haze ?? 0.45): build them with B.c(hex) so the colours come out hazed.
// Stock kinds: mountain (a snow-capped cone: Rainier, Vesuvius, Fuji), hills (a rolling ridge),
// skyline (a block of far towers). Packs add their own (render/packs/*.js `backdrops`).
import * as THREE from 'three';
import { Kit, box, cyl, ball, part, prep } from './geo.js';
import { seg } from './retro.js';
import { mulberry32 } from '../sim/util.js';
import { PACK_BACKDROPS } from './packs/index.js';

const MATS = {};
function mats() {
  if (!MATS.solid) {
    MATS.solid = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false });
    MATS.glow = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  }
  return MATS;
}

// Helper bag for backdrop builders: geometry helpers, hazed colours, and merged meshes.
function helpers(o, th) {
  const k = o.haze ?? th.haze ?? 0.45, hor = new THREE.Color(th.skyBot), tmp = new THREE.Color();
  const c = (hex, extra = 0) => tmp.set(hex).lerp(hor, Math.min(1, k + extra)).getHex();
  const M = mats();
  const mesh = (kit) => { const g = new THREE.Group(); for (const [key, geo] of Object.entries(kit.build())) if (geo) g.add(new THREE.Mesh(geo, key === 'glow' ? M.glow : M.solid)); return g; };
  return { THREE, Kit, box, cyl, ball, part, prep, seg, c, mesh, rng: mulberry32(Math.round((o.x || 0) * 13 + (o.z || 0) * 7) | 0), night: th.night || 0 };
}

const STOCK = {
  // A volcano / mountain: o.r base radius, o.h height, o.snow (0..1 cap), o.crater.
  mountain(o, th, B) {
    const K = new B.Kit(), r = o.r ?? 160, h = o.h ?? 120;
    K.add('solid', B.part(new THREE.ConeGeometry(r, h, B.seg(18, 10), 3), { y: h / 2, color: B.c(o.color || '#5a6470') }));
    if (o.snow ?? 0.35) K.add('solid', B.part(new THREE.ConeGeometry(r * (o.snow ?? 0.35), h * (o.snow ?? 0.35), B.seg(18, 10), 1), { y: h - h * (o.snow ?? 0.35) / 2 + 0.5, color: B.c('#f4f6fa', -0.1) }));
    if (o.crater) K.add('solid', B.part(new THREE.CylinderGeometry(r * 0.12, r * 0.16, h * 0.06, B.seg(12, 8)), { y: h * 0.98, color: B.c('#3a3230') }));
    return B.mesh(K);
  },
  // A rolling ridge of hills along x: o.len, o.h, o.n bumps, o.color, o.houses (dots of colour).
  hills(o, th, B) {
    const K = new B.Kit(), len = o.len ?? 600, n = o.n ?? 7, h = o.h ?? 50;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1) - 0.5) * len, rr = len / n * (0.8 + B.rng() * 0.6), hh = h * (0.6 + B.rng() * 0.6);
      K.add('solid', B.part(new THREE.SphereGeometry(1, B.seg(14, 8), B.seg(8, 5), 0, Math.PI * 2, 0, Math.PI / 2), { x, sx: rr, sy: hh, sz: rr * 0.6, color: B.c(o.color || '#6a8a52') }));
      for (let j = 0; o.houses && j < o.houses; j++) {
        const a = B.rng() * Math.PI * 2, d = B.rng() * 0.8;
        const hx = x + Math.cos(a) * rr * d, hz = Math.sin(a) * rr * 0.6 * d, hy = hh * Math.sqrt(Math.max(0, 1 - d * d)) - 1;
        K.add('solid', B.box(5, 5, 5, { x: hx, y: hy + 2, z: hz, color: B.c(['#f0e0c8', '#e8b8a0', '#c8d8e8', '#f8f0e0'][j % 4]) }));
      }
    }
    return B.mesh(K);
  },
  // A block of distant towers: o.w × o.d footprint, o.n towers, heights o.hMin..o.hMax, lit windows at night.
  skyline(o, th, B) {
    const K = new B.Kit(), n = o.n ?? 14, W = o.w ?? 160, D = o.d ?? 60;
    for (let i = 0; i < n; i++) {
      const x = (B.rng() - 0.5) * W, z = (B.rng() - 0.5) * D, w = 10 + B.rng() * 14, hh = (o.hMin ?? 40) + B.rng() * ((o.hMax ?? 140) - (o.hMin ?? 40));
      K.add('solid', B.box(w, hh, w * (0.7 + B.rng() * 0.6), { x, y: hh / 2, z, color: B.c(o.color || '#8a94a8') }));
      if (B.night) for (let k = 0; k < 6; k++) K.add('glow', B.box(w * 0.8, 0.8, 0.3, { x, y: hh * (0.2 + k * 0.13), z: z + w * 0.36, color: '#ffd890' }));
    }
    return B.mesh(K);
  },
};

export function buildBackdrop(o, th, M) {
  const build = PACK_BACKDROPS[o.kind] || STOCK[o.kind];
  if (!build) return null;
  const obj = build(o, th, helpers(o, th), M);
  if (!obj) return null;
  obj.position.set(o.x || 0, o.y || 0, o.z || 0);
  obj.rotation.y = o.yaw || 0;
  obj.scale.setScalar(o.s || 1);
  obj.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; m.matrixAutoUpdate = false; } });
  obj.updateMatrixWorld(true);
  obj.traverse((m) => { if (m.isMesh) m.updateMatrix(); });
  return obj;
}
