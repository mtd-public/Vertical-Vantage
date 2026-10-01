// Where will I land? A pure look-ahead for the landing reticle, the arc dots and the HUD's drop
// readout. The sim never calls it; adapters do, once a frame (ports reuse it as is).
//
// It flies the player's current velocity under gravity, assuming the stick stays where it is: while
// it's held (P.steer) the velocity keeps turning toward what it asks for (P.tvx, P.tvz) at AIR_ACCEL,
// otherwise it bleeds with AIR_DRAG, exactly as in player.js. It checks
// the platforms as they stand now (movers frozen) and returns the first top it would come down on,
// or null if that's the void within maxT seconds. Running into the side of something stops the
// horizontal motion there (you slide down it), like the push-out in player.js.
import { T } from './tuning.js';
import { groundBelow, inside } from './plats.js';

export function predictLanding(plats, P, out, { step = 1 / 30, maxT = 4, killY = -Infinity, path = null } = {}) {
  let x = P.x, y = P.y, z = P.z, vx = P.vx, vy = P.vy, vz = P.vz;
  if (path) path.length = 0;
  for (let t = step; t <= maxT + 1e-9; t += step) {
    const y0 = y;
    vy = Math.max(-T.FALL_MAX, vy - T.GRAVITY * step);
    if (P.steer) {
      const dx = P.tvx - vx, dz = P.tvz - vz, d = Math.sqrt(dx * dx + dz * dz), dv = T.AIR_ACCEL * step;
      if (d <= dv || d < 1e-9) { vx = P.tvx; vz = P.tvz; } else { vx += (dx / d) * dv; vz += (dz / d) * dv; }
    } else { const k = Math.max(0, 1 - T.AIR_DRAG * step); vx *= k; vz *= k; }
    const nx = x + vx * step, nz = z + vz * step;
    y += vy * step;
    if (vy < 0) { // coming down onto a top this step?
      const g = groundBelow(plats, nx, nz, y0 + 0.01, 0.15);
      if (g && y <= g.h + g.oy) {
        out.x = nx; out.y = g.h + g.oy; out.z = nz; out.t = t; out.plat = g;
        if (path) path.push(nx, out.y, nz);
        return out;
      }
    }
    if (blocked(plats, nx, nz, y)) { vx = vz = 0; } else { x = nx; z = nz; } // into a wall: slide down it
    if (path) path.push(x, y, z);
    if (y < killY) return null;
  }
  return null;
}

// Would a body with feet at y stand inside the side of a platform at (x, z)?
function blocked(plats, x, z, y) {
  for (const p of plats) {
    const top = p.h + p.oy;
    if (y >= top - 0.05 || y + T.HEIGHT <= top - p.thick) continue;
    const dx = x - p.x - p.ox, dz = z - p.z - p.oz;
    if (dx * dx + dz * dz > (p.bound + T.RADIUS) * (p.bound + T.RADIUS)) continue;
    if (inside(p, x, z, T.RADIUS * 0.8)) return true;
  }
  return false;
}
