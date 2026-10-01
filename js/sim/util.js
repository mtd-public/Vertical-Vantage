// Small pure helpers shared by the sim, the levels and the tools. No three.js, no DOM.
// Port note: written with plain sqrt/sin/cos (no Math.hypot, no x**2) so C#/GDScript
// ports can match the float results (dr-mow-godot WORK_GUIDE §5).

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const len2 = (x, z) => Math.sqrt(x * x + z * z);
export const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const TAU = Math.PI * 2;

// Seeded RNG (gig-ambulance / sub-sinkers / dr-mow). The sim never calls Math.random.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// View direction for a yaw/pitch pair. Yaw 0, pitch 0 looks down -Z.
export function forward(yaw, pitch) {
  const cp = Math.cos(pitch);
  return [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
}

// Closest distance² between segment AB and point P.
export function segPointDist2(ax, ay, az, bx, by, bz, px, py, pz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const L = dx * dx + dy * dy + dz * dz;
  let t = L > 1e-12 ? ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / L : 0;
  t = clamp(t, 0, 1);
  const qx = ax + dx * t - px, qy = ay + dy * t - py, qz = az + dz * t - pz;
  return qx * qx + qy * qy + qz * qz;
}

// Distance² from point P to a vertical segment (x, y0..y1, z): the player's capsule axis.
export function pointVSegDist2(px, py, pz, x, y0, y1, z) {
  const cy = clamp(py, y0, y1);
  const dx = px - x, dy = py - cy, dz = pz - z;
  return dx * dx + dy * dy + dz * dz;
}
