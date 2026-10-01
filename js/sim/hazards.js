// Laser walls: vertical curtains of beams that cycle on and off. Platform around them: wait for
// the gap, or jump them (short ones) or over them (tall ones need the triple jump). Pure.
//
// Level data: { x, y, z, len, h, yaw, period, on, phase }
//   (x, y, z)  the base centre (y = the deck it stands on; it rides that deck if it moves)
//   len        width of the curtain (along its local X), h = height
//   period     seconds per cycle; on = fraction of the cycle it is lit; phase 0..1 offsets it
// A lit curtain hurts (1 cell + knockback away from it). It flickers for WARN seconds before lighting.
import { T } from './tuning.js';
import { attach, place } from './enemies.js';
import { hurtPlayer } from './player.js';

export const LASER = { WARN: 0.6, DMG: 1, KNOCK: 9 };

export function makeLaser(w, d) {
  const o = {
    id: w.nextId++, x: d.x, y: d.y, z: d.z, len: d.len, h: d.h, yaw: d.yaw || 0,
    c: Math.cos(d.yaw || 0), s: Math.sin(d.yaw || 0),
    period: d.period || 3, on: d.on ?? 0.5, phase: d.phase || 0,
    host: null, lx: 0, ly: 0, lz: 0, state: 'off', k: 0, // k: 0..1 position in the cycle
  };
  attach(w.plats, o, 3);
  if (o.host) o.ly = 0;
  place(o);
  return o;
}

// 'on' | 'warn' | 'off' at time t (pure: renderer and tools can ask too)
export function laserState(o, t) {
  const k = ((t / o.period + o.phase) % 1 + 1) % 1;
  if (k < o.on) return 'on';
  const toOn = (1 - k) * o.period;
  return toOn < LASER.WARN ? 'warn' : 'off';
}

export function updateLasers(w) {
  const P = w.player;
  for (const o of w.lasers) {
    place(o);
    const prev = o.state;
    o.k = ((w.pt / o.period + o.phase) % 1 + 1) % 1; // the world clock: lasers slow down in slow-mo too
    o.state = laserState(o, w.pt);
    if (o.state === 'on' && prev !== 'on') w.events.push({ type: 'laserOn', id: o.id, x: o.x, y: o.y, z: o.z });
    if (o.state !== 'on' || P.dead) continue;
    // player cylinder vs the curtain: a segment in XZ, a span in Y
    if (P.y > o.y + o.h || P.y + T.HEIGHT < o.y) continue;
    const dx = P.x - o.x, dz = P.z - o.z;
    // local: along = projection on the curtain's X axis (c, -s), across = on its normal (s, c)
    const along = dx * o.c - dz * o.s, across = dx * o.s + dz * o.c;
    const half = o.len / 2;
    const ex = Math.max(0, Math.abs(along) - half);
    const d2 = ex * ex + across * across, r = T.RADIUS + 0.08;
    if (d2 > r * r) continue;
    if (P.inv > 0) continue;
    // shove out along the normal, away from the side we came from
    const side = across >= 0 ? 1 : -1;
    const fx = P.x - o.s * side, fz = P.z - o.c * side;
    hurtPlayer(w, LASER.DMG, fx, fz, LASER.KNOCK);
    w.events.push({ type: 'zap', x: P.x, y: P.y + 1, z: P.z });
  }
}
