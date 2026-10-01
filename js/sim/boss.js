// ARACHNE-9: the spider-mech boss of the warehouse. Pure (no three.js, no DOM).
//
// It lives on the INSIDE of the warehouse box: the floor, the two long walls (north/south) and the
// ceiling. Its pose is a body centre plus a surface normal ("up") and a heading on that surface,
// so the renderer can stand it on a wall or hang it from the ceiling.
//
//   chase ──┬─ crouch (telegraph) → leap → slam (shockwave) → recover (stunned, takes ×1.5)
//           ├─ charge (laser sight) → laser (a sweeping beam; cover blocks it) → cool
//           └─ toWall → climb → ceiling crawl → dropTele → drop → slam → recover      (phase 2+)
//   a back turret fires bursts at you on its own timer, whatever the legs are doing
//   phases by health: 1 (> 60 %), 2 (> 30 %: climbs, faster), 3 (frantic)
import { T, BOSS } from './tuning.js';
import { clamp } from './util.js';
import { raycast, pushOut } from './plats.js';
import { hurtPlayer } from './player.js';

export function initBoss(w, e, d) {
  const A = w.level.arena;
  Object.assign(e, {
    hp: BOSS.hp, maxHp: BOSS.hp, r: BOSS.r, top: BOSS.top,
    cx: d.x, cy: A.floor + BOSS.bodyH, cz: d.z, // body centre
    nx: 0, ny: 1, nz: 0, // surface normal (its "up")
    fx: 0, fz: 1, // heading on the floor (unit, horizontal)
    surf: 'floor', vx: 0, vy: 0, vz: 0,
    state: 'intro', timer: 2.0, phase: 1, vuln: 1, crouch: 0,
    turretT: 3, turretN: 0, turretGap: 0, turretYaw: 0,
    beam: { on: false, sight: false, dx: 0, dy: 0, dz: 0, len: 0, ox: 0, oy: 0, oz: 0, a: 0, rate: 0 },
    gait: 0, wallZ: 0, slamR: 0, lastPhase: 1,
  });
  syncGeneric(e);
}

// The generic enemy code (shots, explosions, stomps, contact) sees a capsule with feet at y.
function syncGeneric(e) { e.x = e.cx; e.z = e.cz; e.y = e.cy - e.top / 2; }

const G = 30; // its own gravity: heavy, fast leaps

export function updateBoss(w, e, dt) {
  const A = w.level.arena, P = w.player, S = BOSS;
  e.t += dt;
  e.flash = Math.max(0, e.flash - dt);
  e.crouch = Math.max(0, e.crouch - dt * 3);
  if (e.state === 'dying') { dying(w, e, dt); return; }
  // phase by health
  const k = e.hp / e.maxHp;
  e.phase = k > 0.6 ? 1 : k > 0.3 ? 2 : 3;
  if (e.phase !== e.lastPhase) {
    e.lastPhase = e.phase;
    w.events.push({ type: 'bossPhase', phase: e.phase, x: e.cx, y: e.cy, z: e.cz });
    if (e.surf === 'floor' && ['chase', 'cool', 'recover'].includes(e.state)) goWall(w, e);
  }
  const speed = S.speed[e.phase - 1];
  const px = P.x, py = P.y + 1, pz = P.z;
  e.timer -= dt;
  e.beam.on = false; e.beam.sight = false;
  e.vuln = 1;

  switch (e.state) {
    case 'intro': if (e.timer <= 0) { e.state = 'chase'; e.timer = 1.5; w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); } break;
    case 'chase': { // to the open floor nearest you (up on a crate, it waits beside it)
      freeSpot(w, px, pz, _spot);
      walkToward(e, _spot[0], _spot[1], speed, dt, A, S.margin, w);
      if (e.timer <= 0) decide(w, e);
      break;
    }
    case 'crouch': {
      face(e, px, pz, 6, dt);
      e.crouch = 1;
      if (e.timer <= 0) leap(w, e, A);
      break;
    }
    case 'leap': case 'drop': {
      e.vy -= G * dt;
      e.cx += e.vx * dt; e.cy += e.vy * dt; e.cz += e.vz * dt;
      e.cx = clamp(e.cx, A.x0 + S.margin, A.x1 - S.margin); e.cz = clamp(e.cz, A.z0 + S.margin, A.z1 - S.margin);
      if (e.cy <= A.floor + S.bodyH && e.vy < 0) { e.cy = A.floor + S.bodyH; e.vx = e.vy = e.vz = 0; e.surf = 'floor'; e.nx = 0; e.ny = 1; e.nz = 0; clearSolids(w, e, 0, 0, 0); slam(w, e); }
      break;
    }
    case 'recover': e.vuln = 1.5; e.crouch = 0.6; if (e.timer <= 0) { e.state = 'chase'; e.timer = 1.2 + w.rng() * 1.2; } break;
    case 'charge': {
      face(e, px, pz, 5, dt);
      e.beam.sight = true; aimBeam(w, e, px, py, pz, 0);
      if (e.timer <= 0) { e.state = 'laser'; e.timer = S.laserTime; e.beam.a = -S.sweep * e.beam.rate; w.events.push({ type: 'bossLaser', x: e.cx, y: e.cy, z: e.cz }); }
      break;
    }
    case 'laser': {
      e.beam.a += e.beam.rate * S.sweepRate * dt;
      e.beam.on = true;
      aimBeam(w, e, px, py, pz, e.beam.a);
      beamHit(w, e);
      if (e.timer <= 0) { e.state = e.surf === 'ceil' ? 'ceil' : 'cool'; e.timer = e.surf === 'ceil' ? 1.2 : 0.7; }
      break;
    }
    case 'cool': if (e.timer <= 0) { e.state = 'chase'; e.timer = 1.4 + w.rng() * 1.2; } break;
    case 'toWall': {
      const tz = e.wallZ - Math.sign(e.wallZ - (A.z0 + A.z1) / 2) * (S.bodyH + 0.05);
      walkToward(e, clamp(px, ...climbLane(A)), tz, speed * 1.2, dt, A, S.bodyH, w); // up a lane clear of the racks
      const lane = climbLane(A);
      if (Math.abs(e.cz - tz) < 1.3 && e.cx > lane[0] - 0.5 && e.cx < lane[1] + 0.5) { // onto the wall: up becomes the wall's inward normal
        e.surf = 'wall'; e.nz = e.wallZ < 0 ? 1 : -1; e.nx = 0; e.ny = 0;
        e.cz = e.wallZ + e.nz * S.bodyH; e.state = 'climb';
      }
      break;
    }
    case 'climb': {
      e.cy += speed * 1.1 * dt;
      e.cx = clamp(e.cx + clamp(px - e.cx, -1, 1) * speed * 0.5 * dt, ...climbLane(A));
      if (e.cy >= A.ceil - S.bodyH) { // over the lip onto the ceiling
        e.cy = A.ceil - S.bodyH; e.surf = 'ceil'; e.nx = 0; e.ny = -1; e.nz = 0;
        e.cz = e.wallZ + (e.wallZ < 0 ? 1 : -1) * (S.bodyH + 0.3);
        e.state = 'ceil'; e.timer = S.ceilTime + w.rng() * 1.5;
        w.events.push({ type: 'bossCeil', x: e.cx, y: e.cy, z: e.cz });
      }
      break;
    }
    case 'ceil': { // it hangs over open floor near you, never over a rack or crate it would drop into
      freeSpot(w, px, pz, _spot);
      walkToward(e, _spot[0], _spot[1], speed * 1.15, dt, A);
      const dx = px - e.cx, dz = pz - e.cz;
      if (e.timer <= 0 || (dx * dx + dz * dz < 6 && e.timer < S.ceilTime - 1)) {
        if (w.rng() < 0.35 && e.phase >= 2 && !e.didCeilLaser) { e.didCeilLaser = true; startCharge(w, e); }
        else { e.state = 'dropTele'; e.timer = S.dropTele; w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); }
      }
      break;
    }
    case 'dropTele': e.crouch = 1; freeSpot(w, px, pz, _spot); walkToward(e, _spot[0], _spot[1], speed * 0.4, dt, A); if (e.timer <= 0) drop(w, e); break;
    default: e.state = 'chase'; e.timer = 1;
  }
  if (e.surf === 'floor') clearSolids(w, e, 0, 0, 0); // e.g. a lift coming down on it
  // the back turret: bursts at you on its own clock
  turret(w, e, dt);
  e.gait += (e.state === 'chase' || e.state === 'toWall' || e.state === 'climb' || e.state === 'ceil' ? speed : e.state === 'charge' ? 1 : 0) * dt;
  syncGeneric(e);
}

function decide(w, e) {
  const P = w.player, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz, dist = Math.sqrt(dx * dx + dz * dz);
  const high = P.y > A.floor + 3.5; // up on a catwalk or crates: it can't reach you with a leap
  const opts = [];
  if (!high && dist < 26) opts.push(['pounce', dist < 6 ? 5 : 3]); // right on top of you? it springs straight up and comes down
  if (dist > 7) opts.push(['laser', high ? 4 : 2.2]);
  if (e.phase >= 2) opts.push(['climb', e.phase === 3 ? 3 : 2 + (high ? 2 : 0)]);
  opts.push(['chase', 1]);
  let tot = 0; for (const o of opts) tot += o[1];
  let r = w.rng() * tot, pick = 'chase';
  for (const [k, wt] of opts) { if ((r -= wt) <= 0) { pick = k; break; } }
  if (pick === 'pounce') { e.state = 'crouch'; e.timer = BOSS.crouch[e.phase - 1]; w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); }
  else if (pick === 'laser') startCharge(w, e);
  else if (pick === 'climb') goWall(w, e);
  else e.timer = 1 + w.rng();
}

function startCharge(w, e) {
  e.state = 'charge'; e.timer = BOSS.charge;
  e.beam.rate = w.rng() < 0.5 ? -1 : 1;
  w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
}

function goWall(w, e) {
  const A = w.level.arena;
  e.wallZ = e.cz < (A.z0 + A.z1) / 2 ? A.z0 : A.z1;
  e.state = 'toWall'; e.didCeilLaser = false;
}

function leap(w, e, A) {
  const P = w.player;
  // lead the target a little: it springs at where you're going
  freeSpot(w, clamp(P.x + P.vx * 0.35, A.x0 + BOSS.margin, A.x1 - BOSS.margin), clamp(P.z + P.vz * 0.35, A.z0 + BOSS.margin, A.z1 - BOSS.margin), _spot);
  const tx = _spot[0], tz = _spot[1]; // lands beside a crate, not in it
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  const Tf = clamp(d / 15, 0.7, 1.25);
  e.vx = dx / Tf; e.vz = dz / Tf; e.vy = 0.5 * G * Tf;
  e.state = 'leap'; e.surf = 'air';
  w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz });
}

function drop(w, e) {
  const P = w.player;
  e.state = 'drop'; e.surf = 'air';
  freeSpot(w, P.x, P.z, _spot);
  e.vx = clamp(_spot[0] - e.cx, -4, 4); e.vz = clamp(_spot[1] - e.cz, -4, 4); e.vy = -2;
  e.nx = 0; e.ny = 1; e.nz = 0; // it flips over on the way down
  w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz });
}

function slam(w, e) {
  const P = w.player, S = BOSS;
  w.events.push({ type: 'bossSlam', x: e.cx, y: e.cy - S.bodyH, z: e.cz, r: S.slamR });
  const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  const low = P.y < e.cy - S.bodyH + 1.2;
  if (d < S.crushR && P.y < e.cy + 1.5) hurtPlayer(w, 2, e.cx, e.cz, 12); // landed on you
  else if (d < S.slamR && low && P.ground) hurtPlayer(w, 1, e.cx, e.cz, 10); // the shockwave runs along the floor: jump it
  e.state = 'recover'; e.timer = S.recover;
}

// Walk on the current surface toward a target (x, z) — on the floor and ceiling that's the plane;
// on a wall it only slides along x. Heading turns at a limited rate so it arcs like a creature.
// On the floor (w given) it also slides round crates, racks and low lifts instead of through them.
function walkToward(e, tx, tz, speed, dt, A, zMargin = BOSS.margin, w = null) {
  face(e, tx, tz, 2.6, dt);
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1.2) return;
  const m = BOSS.margin;
  e.cx = clamp(e.cx + e.fx * speed * dt, A.x0 + m, A.x1 - m);
  if (e.surf !== 'wall') e.cz = clamp(e.cz + e.fz * speed * dt, A.z0 + zMargin, A.z1 - zMargin);
  if (w && e.surf === 'floor') clearSolids(w, e, dx / d, dz / d, speed * dt * 0.7);
}

// Solids in its way on the floor: any platform inside the arena whose box overlaps its body band
// (crates, racks, a lift near the bottom). The shell (floor slab, walls, ceiling, catwalks overhead)
// is outside that band or outside the arena box, which the clamps already handle.
function isSolid(A, p) {
  const top = p.h + p.oy;
  if (top <= A.floor + 0.3 || top - p.thick >= A.floor + BOSS.bodyH + 1.2) return false;
  const x = p.x + p.ox, z = p.z + p.oz;
  return x >= A.x0 && x <= A.x1 && z >= A.z0 && z <= A.z1;
}

// Push its body circle out of every solid. When something pushed it, it also sidesteps along the
// face toward (gx, gz) at `side` metres, so it works round a crate rather than stalling on it.
function clearSolids(w, e, gx, gz, side) {
  const A = w.level.arena, m = BOSS.margin;
  for (let pass = 0; pass < 2; pass++) {
    for (const p of w.plats) {
      if (!isSolid(A, p)) continue;
      const r = pushOut(p, e.cx, e.cz, BOSS.bodyR);
      if (!r) continue;
      const nx = r[0], nz = r[1];
      e.cx += nx * r[2]; e.cz += nz * r[2];
      if (side > 0) {
        let tx = -nz, tz = nx;
        if (tx * gx + tz * gz < 0) { tx = -tx; tz = -tz; }
        e.cx += tx * side; e.cz += tz * side;
        side = 0;
      }
    }
    e.cx = clamp(e.cx, A.x0 + m, A.x1 - m); e.cz = clamp(e.cz, A.z0 + BOSS.bodyH, A.z1 - BOSS.bodyH);
  }
}

// The nearest point to (x, z) where its body fits on the floor.
const _spot = [0, 0];
function freeSpot(w, x, z, out) {
  const A = w.level.arena;
  out[0] = x; out[1] = z;
  for (let pass = 0; pass < 3; pass++) {
    for (const p of w.plats) {
      if (!isSolid(A, p)) continue;
      const r = pushOut(p, out[0], out[1], BOSS.bodyR + 0.3);
      if (r) { out[0] += r[0] * r[2]; out[1] += r[1] * r[2]; }
    }
  }
  return out;
}

// Where along a long wall it may climb: clear of the corner racks (level data), else 8 m in.
const climbLane = (A) => A.climbX || [A.x0 + 8, A.x1 - 8];

function face(e, tx, tz, rate, dt) {
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1e-6) return;
  const wx = dx / d, wz = dz / d;
  // rotate (fx, fz) toward (wx, wz) by at most rate·dt
  const cross = e.fx * wz - e.fz * wx, dot = e.fx * wx + e.fz * wz;
  const ang = Math.atan2(cross, dot), step = clamp(ang, -rate * dt, rate * dt);
  const c = Math.cos(step), s = Math.sin(step);
  const nfx = e.fx * c - e.fz * s, nfz = e.fx * s + e.fz * c;
  const l = Math.sqrt(nfx * nfx + nfz * nfz) || 1;
  e.fx = nfx / l; e.fz = nfz / l;
}

// The beam leaves the eye cluster at the front of the body, aimed at you, swept by angle a round world Y.
function aimBeam(w, e, px, py, pz, a) {
  const B = e.beam;
  B.ox = e.cx + e.fx * 1.9 + e.nx * 0.3; B.oy = e.cy + e.ny * 0.3; B.oz = e.cz + e.fz * 1.9 + e.nz * 0.3;
  let dx = px - B.ox, dy = py - B.oy, dz = pz - B.oz;
  const c = Math.cos(a), s = Math.sin(a);
  const rx = dx * c - dz * s, rz = dx * s + dz * c;
  dx = rx; dz = rz;
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  B.dx = dx / l; B.dy = dy / l; B.dz = dz / l;
  const hit = raycast(w.plats, B.ox, B.oy, B.oz, B.dx, B.dy, B.dz, BOSS.beamLen);
  B.len = hit ? hit.t : BOSS.beamLen;
}

function beamHit(w, e) {
  const P = w.player, B = e.beam;
  if (P.dead || P.inv > 0) return;
  // closest distance between the beam segment and the player's axis (sampled along the beam)
  const R = T.RADIUS + 0.45;
  for (let k = 0; k <= 40; k++) {
    const t = (k / 40) * B.len;
    const x = B.ox + B.dx * t, y = B.oy + B.dy * t, z = B.oz + B.dz * t;
    const cy = clamp(y, P.y + 0.2, P.y + T.HEIGHT - 0.2);
    const ddx = x - P.x, ddy = y - cy, ddz = z - P.z;
    if (ddx * ddx + ddy * ddy + ddz * ddz < R * R) {
      hurtPlayer(w, 1, B.ox, B.oz, 6);
      w.events.push({ type: 'zap', x: P.x, y: P.y + 1, z: P.z });
      return;
    }
  }
}

function turret(w, e, dt) {
  const P = w.player, S = BOSS;
  // the turret swivels toward you whatever the legs do
  const tx = P.x - e.cx, tz = P.z - e.cz;
  e.turretYaw = Math.atan2(-tx, -tz);
  if (e.state === 'leap' || e.state === 'drop' || e.state === 'intro' || P.dead) return;
  if (e.turretN > 0) {
    e.turretGap -= dt;
    if (e.turretGap <= 0) {
      e.turretN--; e.turretGap = S.turretGap;
      const ox = e.cx + e.nx * 1.8, oy = e.cy + e.ny * 1.8, oz = e.cz + e.nz * 1.8;
      const ax = P.x + P.vx * 0.25, ay = P.y + 1, az = P.z + P.vz * 0.25;
      let dx = ax - ox, dy = ay - oy, dz = az - oz;
      const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      dx /= l; dy /= l; dz /= l;
      w.bolts.push({ id: w.nextId++, x: ox, y: oy, z: oz, vx: dx * S.turretSpeed, vy: dy * S.turretSpeed, vz: dz * S.turretSpeed, life: 4, from: 'boss' });
      w.events.push({ type: 'enemyFire', from: 'boss', x: ox, y: oy, z: oz });
    }
    return;
  }
  e.turretT -= dt;
  if (e.turretT <= 0) {
    e.turretN = S.turretBurst[e.phase - 1]; e.turretGap = 0;
    e.turretT = (S.turretEvery[0] + w.rng() * (S.turretEvery[1] - S.turretEvery[0])) / (e.surf === 'ceil' ? 1.5 : 1);
  }
}

// Called by damageEnemy when its health runs out.
export function bossDown(w, e) {
  if (e.state === 'dying') return;
  e.hp = 0; e.state = 'dying'; e.timer = BOSS.dyingTime; e.beam.on = e.beam.sight = false;
  if (e.surf !== 'floor') { e.state = 'dying'; e.surf = 'air'; e.vx = e.vz = 0; e.vy = 0; e.nx = 0; e.ny = 1; e.nz = 0; }
  w.events.push({ type: 'bossDying', x: e.cx, y: e.cy, z: e.cz });
}

function dying(w, e, dt) {
  const A = w.level.arena;
  e.timer -= dt;
  if (e.surf === 'air') { e.vy -= G * dt; e.cy += e.vy * dt; if (e.cy <= A.floor + BOSS.bodyH) { e.cy = A.floor + BOSS.bodyH; e.surf = 'floor'; e.vy = 0; } }
  e.boomT = (e.boomT || 0) - dt;
  if (e.boomT <= 0) {
    e.boomT = 0.22;
    w.events.push({ type: 'explode', x: e.cx + (w.rng() - 0.5) * 4, y: e.cy + (w.rng() - 0.3) * 2, z: e.cz + (w.rng() - 0.5) * 4, r: 2.5 });
  }
  syncGeneric(e);
  if (e.timer <= 0) {
    e.dead = true; e.deadT = 0;
    w.score += T.SCORE.boss; w.stats.kills++;
    w.events.push({ type: 'kill', kind: 'boss', x: e.cx, y: e.cy, z: e.cz, pts: T.SCORE.boss, stomp: false });
    w.events.push({ type: 'explode', x: e.cx, y: e.cy, z: e.cz, r: 7 });
    if (!w.exitOpen) { w.exitOpen = true; w.events.push({ type: 'exitOpen', x: w.exit?.x, y: w.exit?.y, z: w.exit?.z }); }
  }
}
