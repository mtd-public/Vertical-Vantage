// The boss toolkit: what every boss module builds on. Pure (no three.js, no DOM).
//
// A boss is an enemy with type 'boss' and a `kind` (see bosses/index.js). Every boss keeps the
// same POSE fields, so the generic enemy code, the HUD and the renderer can read any of them:
//   cx, cy, cz   body centre               fx, fz   heading on its surface (unit)
//   nx, ny, nz   its "up" (surface normal)  surf     'floor' | 'wall' | 'ceil' | 'air'
//   state, timer, phase (1..3 by health), vuln (damage ×; 0 = invulnerable), crouch (0..1 squat)
//   beam         a laser: { on, sight, ox, oy, oz, dx, dy, dz, len, a, rate } (the renderer draws it)
// syncPose() copies the centre into e.x / e.y / e.z (feet = centre − top / 2) for shots and stomps.
//
// Danger zones: zone() puts a telegraphed circle on the ground (the renderer draws a red ring
// filling in); when its delay runs out it hits whoever stands in it. Tentacle slams, lightning,
// drill bursts, bombs and sword sweeps are all zones.
import { T } from '../tuning.js';
import { clamp } from '../util.js';
import { pushOut, raycast } from '../plats.js';
import { hurtPlayer } from '../player.js';
import { spawnEnemy } from '../enemies.js';

export { syncGeneric as syncPose, face, aimBeam, beamHit } from '../boss.js';

// Fill in the standard fields. o: { hp, r, top, bodyH (centre above the floor), intro (s) }.
export function initPose(w, e, d, o) {
  const A = w.level.arena || { floor: d.y ?? 0 };
  Object.assign(e, {
    hp: o.hp, maxHp: o.hp, r: o.r, top: o.top,
    cx: d.x, cy: (d.y ?? A.floor) + (o.bodyH ?? o.top / 2), cz: d.z,
    nx: 0, ny: 1, nz: 0, fx: 0, fz: 1, surf: 'floor', vx: 0, vy: 0, vz: 0,
    state: 'intro', timer: o.intro ?? 2, phase: 1, lastPhase: 1, vuln: 1, crouch: 0,
    turretT: 2.5, turretN: 0, turretGap: 0, gait: 0, boomT: 0, bodyH: o.bodyH ?? o.top / 2,
    beam: { on: false, sight: false, dx: 0, dy: 0, dz: 0, len: 0, ox: 0, oy: 0, oz: 0, a: 0, rate: 0 },
  });
  e.x = e.cx; e.z = e.cz; e.y = e.cy - e.top / 2;
}

// Phase by health (1 > cuts[0] > 2 > cuts[1] > 3). Emits bossPhase once per change; returns true then.
export function phaseTick(w, e, cuts = [0.6, 0.3]) {
  const k = e.hp / e.maxHp;
  e.phase = k > cuts[0] ? 1 : k > cuts[1] ? 2 : 3;
  if (e.phase === e.lastPhase) return false;
  e.lastPhase = e.phase;
  w.events.push({ type: 'bossPhase', phase: e.phase, x: e.cx, y: e.cy, z: e.cz });
  return true;
}

// The intro hold, then the roar. Returns true while still in the intro.
export function introTick(w, e, dt, next = 'idle', t = 1) {
  if (e.state !== 'intro') return false;
  e.timer -= dt;
  if (e.timer <= 0) { e.state = next; e.timer = t; w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); }
  return true;
}

// Seeded weighted pick: opts = [[name, weight], …].
export function pick(w, opts) {
  let tot = 0; for (const o of opts) tot += o[1];
  let r = w.rng() * tot;
  for (const [k, wt] of opts) if ((r -= wt) <= 0) return k;
  return opts[opts.length - 1][0];
}

// Turn the heading toward (tx, tz) and walk there on the floor, kept inside the arena, pushed out
// of solids (crates, columns…) with a sidestep so it works round them. R: body radius.
export function stride(w, e, tx, tz, speed, dt, R, margin = 3) {
  const A = w.level.arena;
  turnTo(e, tx, tz, 2.6, dt);
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1.2) return d;
  e.cx += e.fx * speed * dt; e.cz += e.fz * speed * dt;
  if (A && A.x0 !== undefined) { e.cx = clamp(e.cx, A.x0 + margin, A.x1 - margin); e.cz = clamp(e.cz, A.z0 + margin, A.z1 - margin); }
  pushSolids(w, e, R, dx / d, dz / d, speed * dt * 0.7);
  e.gait += speed * dt;
  return d;
}

export function turnTo(e, tx, tz, rate, dt) {
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1e-6) return;
  const wx = dx / d, wz = dz / d;
  const cross = e.fx * wz - e.fz * wx, dot = e.fx * wx + e.fz * wz;
  const ang = Math.atan2(cross, dot), step = clamp(ang, -rate * dt, rate * dt);
  const c = Math.cos(step), s = Math.sin(step);
  const nfx = e.fx * c - e.fz * s, nfz = e.fx * s + e.fz * c;
  const l = Math.sqrt(nfx * nfx + nfz * nfz) || 1;
  e.fx = nfx / l; e.fz = nfz / l;
}

// Solids at body height inside the arena (crates, pillars, statues); the arena shell is excluded.
export function solidAt(w, p, y0, y1) {
  const A = w.level.arena;
  const top = p.h + p.oy;
  if (top <= y0 + 0.3 || top - p.thick >= y1) return false;
  if (!A || A.x0 === undefined) return true;
  const x = p.x + p.ox, z = p.z + p.oz;
  return x >= A.x0 && x <= A.x1 && z >= A.z0 && z <= A.z1;
}
export function pushSolids(w, e, R, gx = 0, gz = 0, side = 0) {
  const y0 = e.cy - e.top / 2, y1 = e.cy + e.top / 2;
  for (let pass = 0; pass < 2; pass++) {
    for (const p of w.plats) {
      if (!solidAt(w, p, y0, y1)) continue;
      const r = pushOut(p, e.cx, e.cz, R);
      if (!r) continue;
      e.cx += r[0] * r[2]; e.cz += r[1] * r[2];
      if (side > 0) {
        let tx = -r[1], tz = r[0];
        if (tx * gx + tz * gz < 0) { tx = -tx; tz = -tz; }
        e.cx += tx * side; e.cz += tz * side; side = 0;
      }
    }
  }
}
// The nearest point to (x, z) where a body of radius R fits on the floor.
export function openSpot(w, x, z, R, out, y0 = 0, y1 = 3) {
  out[0] = x; out[1] = z;
  for (let pass = 0; pass < 3; pass++) {
    for (const p of w.plats) {
      if (!solidAt(w, p, y0, y1)) continue;
      const r = pushOut(p, out[0], out[1], R + 0.3);
      if (r) { out[0] += r[0] * r[2]; out[1] += r[1] * r[2]; }
    }
  }
  return out;
}

// One bolt from (ox, oy, oz) at the player, leading them by `lead` s; `spread` radians of seeded
// jitter. Bolts are the shared enemy projectile (ENEMY_BOLT): 1 damage, blocked by geometry.
export function fireAt(w, e, ox, oy, oz, speed, lead = 0.25, spread = 0) {
  const P = w.player;
  const ax = P.x + P.vx * lead, ay = P.y + 1, az = P.z + P.vz * lead;
  let dx = ax - ox, dy = ay - oy, dz = az - oz;
  if (spread) { dx += (w.rng() - 0.5) * 2 * spread * 10; dy += (w.rng() - 0.5) * spread * 10; dz += (w.rng() - 0.5) * 2 * spread * 10; }
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  w.bolts.push({ id: w.nextId++, x: ox, y: oy, z: oz, vx: dx / l * speed, vy: dy / l * speed, vz: dz / l * speed, life: 4, from: 'boss' });
  w.events.push({ type: 'enemyFire', from: 'boss', x: ox, y: oy, z: oz });
}
// A fan of n bolts across `arc` radians (in the horizontal plane), aimed at the player.
export function fan(w, e, ox, oy, oz, speed, n, arc) {
  const P = w.player;
  const bx = P.x - ox, by = P.y + 1 - oy, bz = P.z - oz;
  const base = Math.atan2(bz, bx), hd = Math.sqrt(bx * bx + bz * bz) || 1, pitch = Math.atan2(by, hd);
  for (let i = 0; i < n; i++) {
    const a = base + (n > 1 ? (i / (n - 1) - 0.5) * arc : 0);
    const c = Math.cos(pitch);
    w.bolts.push({ id: w.nextId++, x: ox, y: oy, z: oz, vx: Math.cos(a) * c * speed, vy: Math.sin(pitch) * speed, vz: Math.sin(a) * c * speed, life: 4, from: 'boss' });
  }
  w.events.push({ type: 'enemyFire', from: 'boss', x: ox, y: oy, z: oz });
}

// A telegraphed danger circle on the ground at (x, y, z), radius r, landing after `delay` s.
// o: { dmg = 1, knock = 9, kind = 'slam', height = 2.5 (how far above y it still reaches) }.
// Returns the zone (the boss can move it while it's pending, e.g. to track you).
export function zone(w, x, y, z, r, delay, o = {}) {
  const Z = { x, y, z, r, t: delay, max: delay, dmg: o.dmg ?? 1, knock: o.knock ?? 9, kind: o.kind || 'slam', height: o.height ?? 2.5 };
  w.zones.push(Z);
  w.events.push({ type: 'zoneTele', kind: Z.kind, x, y, z, r });
  return Z;
}
// Called once a step from updateEnemies (any stage). Uses the world clock you pass (slow-mo aware).
export function updateZones(w, dt) {
  const P = w.player;
  let n = 0;
  for (const Z of w.zones) {
    Z.t -= dt;
    if (Z.t > 0) { w.zones[n++] = Z; continue; }
    const dx = P.x - Z.x, dz = P.z - Z.z;
    if (!P.dead && dx * dx + dz * dz < Z.r * Z.r && P.y < Z.y + Z.height && P.y + T.HEIGHT > Z.y - 0.5) hurtPlayer(w, Z.dmg, Z.x, Z.z, Z.knock);
    w.events.push({ type: 'zoneHit', kind: Z.kind, x: Z.x, y: Z.y, z: Z.z, r: Z.r });
  }
  w.zones.length = n;
}

// Spawn a regular enemy mid-fight (minions: drones, turrets). d: { type, x, y, z, … }.
export function spawn(w, d) { return spawnEnemy(w, d); }

// The standard defeat: down() starts 'dying' (2.2 s of explosions; it falls to the floor if it was
// up somewhere), then dyingTick() — call it from your update while state === 'dying' — finishes
// it: score, kill event, exit open.
export function down(w, e) {
  if (e.state === 'dying') return;
  e.hp = 0; e.state = 'dying'; e.timer = 2.2; e.beam.on = e.beam.sight = false;
  if (e.surf !== 'floor') { e.surf = 'air'; e.vx = e.vz = 0; e.vy = 0; e.nx = 0; e.ny = 1; e.nz = 0; }
  w.zones.length = 0;
  w.events.push({ type: 'bossDying', x: e.cx, y: e.cy, z: e.cz });
}

// Line of sight from (ox, oy, oz) to the player's chest (geometry blocks it).
export function sees(w, ox, oy, oz) {
  const P = w.player;
  const dx = P.x - ox, dy = P.y + 1 - oy, dz = P.z - oz;
  return !raycast(w.plats, ox, oy, oz, dx, dy, dz, 0.97);
}

export function dyingTick(w, e, dt) {
  const A = w.level.arena, floor = A ? A.floor : 0;
  e.timer -= dt;
  if (e.surf === 'air') { e.vy -= 30 * dt; e.cy += e.vy * dt; if (e.cy <= floor + e.bodyH) { e.cy = floor + e.bodyH; e.surf = 'floor'; e.vy = 0; } }
  e.boomT -= dt;
  if (e.boomT <= 0) {
    e.boomT = 0.22;
    const s = Math.max(2, e.r * 1.6);
    w.events.push({ type: 'explode', x: e.cx + (w.rng() - 0.5) * s, y: e.cy + (w.rng() - 0.3) * e.top * 0.6, z: e.cz + (w.rng() - 0.5) * s, r: 2.5 });
  }
  e.x = e.cx; e.z = e.cz; e.y = e.cy - e.top / 2;
  if (e.timer <= 0 && !e.dead) {
    e.dead = true; e.deadT = 0;
    w.score += T.SCORE.boss; w.stats.kills++;
    w.events.push({ type: 'kill', kind: 'boss', x: e.cx, y: e.cy, z: e.cz, pts: T.SCORE.boss, stomp: false });
    w.events.push({ type: 'explode', x: e.cx, y: e.cy, z: e.cz, r: 7 });
    if (!w.exitOpen) { w.exitOpen = true; w.events.push({ type: 'exitOpen', x: w.exit?.x, y: w.exit?.y, z: w.exit?.z }); }
  }
}
