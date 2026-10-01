// Enemies and projectiles. Pure (no three.js, no DOM).
//   drone   small hover robot: bobs at its post, drifts toward you, eye-flare telegraph, slow dodgeable bolt
//   walker  little crawler robot: patrols its platform (rides it if it moves), scuttles at you, contact damage
//   guard   security officer in a long coat: laser-sight telegraph, then a 3-round burst
//   server  bonus-stage target: a rack you shoot (or stomp) to pieces
import { T, ENEMIES, ENEMY_BOLT } from './tuning.js';
import { clamp, pointVSegDist2 } from './util.js';
import { raycast, groundBelow, toLocal, toWorld } from './plats.js';
import { hurtPlayer } from './player.js';
import { bossKind } from './bosses/index.js';
import { updateZones } from './bosses/common.js';

const _l = [0, 0], _w = [0, 0];

// Hook a thing (enemy, pickup, drive, exit…) to the platform under it, so it rides movers.
// Sets o.host (platform or null) and its local offset. maxDrop: how far below it the deck may be.
export function attach(plats, o, maxDrop = 4) {
  const g = groundBelow(plats, o.x, o.z, o.y + 0.6);
  if (g && g.h + g.oy >= o.y - maxDrop) {
    o.host = g;
    toLocal(g, o.x, o.z, _l);
    o.lx = _l[0]; o.lz = _l[1]; o.ly = o.y - (g.h + g.oy);
  } else o.host = null;
}
export function place(o) {
  const g = o.host;
  if (!g) return;
  toWorld(g, o.lx, o.lz, _w);
  o.x = _w[0]; o.z = _w[1]; o.y = g.h + g.oy + o.ly;
}

export function makeEnemy(w, d) {
  const S = ENEMIES[d.type];
  const e = {
    id: w.nextId++, type: d.type, x: d.x, y: d.y, z: d.z, yaw: d.yaw || 0,
    hp: S.hp, maxHp: S.hp, r: S.r, top: S.top,
    ax: d.x, ay: d.y, az: d.z, // drone post
    host: null, lx: 0, ly: 0, lz: 0,
    state: 'idle', timer: 0.6 + w.rng() * 1.5, burst: 0,
    dead: false, deadT: 0, flash: 0, seen: false, losT: w.rng() * 0.2,
    dir: w.rng() < 0.5 ? -1 : 1, phase: w.rng() * 6.283, t: 0,
    aimX: 0, aimY: 0, aimZ: 0, // where the laser sight / eye points (render)
  };
  if (e.type === 'boss') { e.kind = d.kind || 'arachne'; bossKind(e).init(w, e, d); }
  else if (e.type !== 'drone') { attach(w.plats, e, 6); if (e.host) e.ly = 0; place(e); }
  return e;
}

export function updateEnemies(w, dt) {
  const P = w.player;
  const px = P.x, py = P.y + 1.0, pz = P.z;
  for (const e of w.enemies) {
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    if (e.dead) { e.deadT += dt; continue; }
    const S = ENEMIES[e.type];
    if (e.type === 'boss') { bossKind(e).update(w, e, dt); if (e.state !== 'dying' && e.state !== 'intro' && !e.noContact) contact(w, e); continue; }
    if (e.type !== 'drone') place(e);
    const dx = px - e.x, dz = pz - e.z, ey = e.y + e.top * 0.7, dy = py - ey;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    // line of sight, refreshed a few times a second (cheap enough for phones)
    e.losT -= dt;
    if (e.losT <= 0) {
      e.losT = 0.2;
      if (dist < (S.range || 0) && !P.dead) {
        const hit = raycast(w.plats, e.x, ey, e.z, dx, dy, dz, 0.97);
        e.seen = !hit;
      } else e.seen = false;
    }
    e.aimX = px; e.aimY = py; e.aimZ = pz;
    if (e.type === 'drone') drone(w, e, S, dt, dx, dz, dist);
    else if (e.type === 'walker' || e.type === 'spiker') walker(w, e, S, dt);
    else if (e.type === 'guard' || e.type === 'turret') guard(w, e, S, dt, dx, dz, dist);
    // stomps, and contact damage (walkers bite, drones bump, guards shove)
    contact(w, e);
  }
  if (w.zones.length) updateZones(w, dt); // boss danger zones landing
}

// Spawn a regular enemy mid-stage (boss minions). Returns it.
export function spawnEnemy(w, d) {
  const e = makeEnemy(w, d);
  w.enemies.push(e);
  return e;
}

function faceToward(e, dx, dz, rate, dt) {
  const want = Math.atan2(-dx, -dz); // yaw that looks down (dx, dz) with -Z forward
  let d = want - e.yaw;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  e.yaw += clamp(d, -rate * dt, rate * dt);
}

function drone(w, e, S, dt, dx, dz, dist) {
  // drift toward you inside a leash round its post, bob, and keep its altitude
  const alert = e.seen && dist < S.range;
  let tx = e.ax, tz = e.az;
  if (alert) {
    const hd = Math.sqrt(dx * dx + dz * dz) || 1;
    const lead = Math.min(S.leash, Math.max(0, hd - 7)); // never closer than ~7 m
    tx = e.ax + (dx / hd) * lead; tz = e.az + (dz / hd) * lead;
    tx = clamp(tx, e.ax - S.leash, e.ax + S.leash); tz = clamp(tz, e.az - S.leash, e.az + S.leash);
  }
  const k = Math.min(1, S.chase * dt);
  e.x += (tx - e.x) * k; e.z += (tz - e.z) * k;
  e.y = e.ay + Math.sin(e.t * 1.7 + e.phase) * 0.45;
  if (alert) faceToward(e, dx, dz, 4, dt); else e.yaw += dt * 0.6;
  // fire: idle → telegraph (eye flares) → shot
  if (!alert) { if (e.state === 'tele') e.state = 'idle'; e.timer = Math.max(e.timer, 0.8); return; }
  e.timer -= dt;
  if (e.state === 'idle' && e.timer <= S.tele) { e.state = 'tele'; w.events.push({ type: 'tele', id: e.id, x: e.x, y: e.y, z: e.z }); }
  if (e.timer <= 0) {
    shootBolt(w, e, e.x, e.y + 0.1, e.z, S.bolt);
    e.state = 'idle';
    e.timer = S.fireMin + w.rng() * (S.fireMax - S.fireMin);
  }
}

function walker(w, e, S, dt) {
  const P = w.player, g = e.host;
  if (!g) return;
  // chase when you stand on its deck (or are close and level with it), else patrol
  const sameDeck = P.ground === g;
  const near = Math.abs(P.y - e.y) < 1.2 && (P.x - e.x) * (P.x - e.x) + (P.z - e.z) * (P.z - e.z) < S.range * S.range;
  const limX = g.kind === 'disc' ? g.r * 0.7 : Math.max(0, g.w / 2 - 0.9);
  const limZ = g.kind === 'disc' ? g.r * 0.7 : Math.max(0, g.d / 2 - 0.9);
  let vx = 0, vz = 0;
  if ((sameDeck || near) && !P.dead) {
    toLocal(g, P.x, P.z, _l);
    const ddx = _l[0] - e.lx, ddz = _l[1] - e.lz, d = Math.sqrt(ddx * ddx + ddz * ddz);
    if (d > 0.3) { vx = (ddx / d) * S.run; vz = (ddz / d) * S.run; }
    e.state = 'chase';
  } else {
    // patrol along the deck's long axis
    const alongX = g.kind === 'disc' || g.w >= g.d;
    if (alongX) vx = e.dir * S.patrol; else vz = e.dir * S.patrol;
    e.state = 'patrol';
  }
  e.lx += vx * dt; e.lz += vz * dt;
  if (e.lx > limX) { e.lx = limX; e.dir = -1; } else if (e.lx < -limX) { e.lx = -limX; e.dir = 1; }
  if (e.lz > limZ) { e.lz = limZ; e.dir = -1; } else if (e.lz < -limZ) { e.lz = -limZ; e.dir = 1; }
  if (vx || vz) { // face the way it walks (local → world heading)
    const wx = vx * g.c + vz * g.s, wz = -vx * g.s + vz * g.c;
    faceToward(e, wx, wz, 8, dt);
  }
  place(e);
}

function guard(w, e, S, dt, dx, dz, dist) {
  const alert = e.seen && dist < S.range;
  if (alert || e.state !== 'idle') faceToward(e, dx, dz, 3.5, dt);
  e.timer -= dt;
  if (e.state === 'idle') {
    if (alert && e.timer <= 0) { e.state = 'aim'; e.timer = S.aim; w.events.push({ type: 'aim', id: e.id, x: e.x, y: e.y + 1.5, z: e.z }); }
  } else if (e.state === 'aim') {
    if (!alert) { e.state = 'idle'; e.timer = 0.5; }
    else if (e.timer <= 0) { e.state = 'burst'; e.burst = S.burst; e.timer = 0; }
  } else if (e.state === 'burst') {
    if (e.timer <= 0) {
      const f = Math.sin(e.yaw), c = Math.cos(e.yaw);
      shootBolt(w, e, e.x - f * 0.5 + c * 0.25, e.y + 1.35, e.z - c * 0.5 - f * 0.25, S.bolt);
      e.burst--; e.timer = S.gap;
      if (e.burst <= 0) { e.state = 'cool'; e.timer = S.cool; }
    }
  } else if (e.state === 'cool') {
    if (e.timer <= 0) { e.state = 'idle'; e.timer = 0.2; }
  }
}

function contact(w, e) {
  const P = w.player;
  if (P.dead) return;
  const dx = P.x - e.x, dz = P.z - e.z, rr = e.r + T.RADIUS * 0.8;
  if (dx * dx + dz * dz > rr * rr) return;
  const feet = P.y, top = e.y + e.top, S = ENEMIES[e.type];
  // landing on its head / back (a boss only when its kind says so: ARACHNE-9 while it's on the floor)
  const K = e.type === 'boss' ? bossKind(e) : null;
  const onBack = !K || (K.stompable ? K.stompable(e) : e.surf === 'floor');
  if (P.vy < -0.5 && feet <= top + 0.4 && feet >= top - 0.75 && onBack) {
    if (S.spiked) { // spikes: it hurts, and you pop back up
      P.vy = T.SPIKE_BOUNCE; P.ground = null;
      P.inv = 0; hurtPlayer(w, T.SPIKE_DMG);
      w.events.push({ type: 'spiked', x: e.x, y: top, z: e.z });
      return;
    }
    // a free bounce; small robots die from it alone
    damageEnemy(w, e, S.stomp * (e.vuln || 1), true);
    P.vy = T.STOMP_BOUNCE; P.ground = null;
    if (T.STOMP_REFUND) P.jumps = 1;
    w.stats.stomps++;
    w.events.push({ type: 'stomp', x: e.x, y: top, z: e.z, kind: e.type });
    // still standing (or the boss)? the view snaps down onto it and the gun fires: bounce → aim → shoot
    if (!e.dead && e.hp > 0) { P.lock = e; P.lockT = T.STOMP_AIM; P.autoShoot = T.STOMP_SHOOT; }
    return;
  }
  // body contact (vertical overlap)
  if (e.type === 'server') return;
  if (feet < top - 0.1 && feet + T.HEIGHT > e.y) hurtPlayer(w, 1, e.x, e.z, T.KNOCKBACK);
}

function shootBolt(w, e, x, y, z, speed) {
  const P = w.player;
  const tx = P.x, ty = P.y + 1.0, tz = P.z;
  let dx = tx - x, dy = ty - y, dz = tz - z;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  dx /= d; dy /= d; dz /= d;
  w.bolts.push({ id: w.nextId++, x, y, z, vx: dx * speed, vy: dy * speed, vz: dz * speed, life: ENEMY_BOLT.life, from: e.type });
  w.events.push({ type: 'enemyFire', from: e.type, x, y, z });
}

export function damageEnemy(w, e, dmg, stomp = false, shot = null) {
  if (e.dead) return;
  if (e.type === 'boss') {
    if (e.state === 'dying' || e.state === 'intro') return;
    const K = bossKind(e);
    if (e.vuln === 0 || (shot && K.blocks && K.blocks(w, e, shot))) { // shielded: it glances off
      w.events.push({ type: 'impact', x: e.x, y: e.y + e.top * 0.5, z: e.z, nx: 0, ny: 1, nz: 0, kind: 'shield' });
      return;
    }
    dmg *= e.vuln ?? 1; // stunned after a slam: ×1.5
  }
  e.hp -= dmg; e.flash = 0.12;
  w.stats.hits++;
  if (e.type === 'boss') {
    if (e.hp <= 0) bossKind(e).down(w, e);
    else w.events.push({ type: 'hit', kind: 'boss', x: e.x, y: e.y + e.top * 0.5, z: e.z });
    return;
  }
  if (e.type === 'guard' && e.state === 'idle') { e.state = 'aim'; e.timer = ENEMIES.guard.aim * 0.6; } // shot? it turns on you
  if (e.hp <= 0) {
    e.dead = true; e.deadT = 0;
    const base = T.SCORE[e.type] || 100;
    const pts = base * (stomp ? T.SCORE.stompMul : 1);
    w.score += pts;
    w.stats.kills++;
    w.events.push({ type: e.type === 'server' ? 'serverDown' : 'kill', kind: e.type, x: e.x, y: e.y + e.top * 0.5, z: e.z, pts, stomp });
  } else w.events.push({ type: 'hit', kind: e.type, x: e.x, y: e.y + e.top * 0.5, z: e.z });
}

// ------------------------------------------------------------------ projectiles
export function updateShots(w, dt) {
  const shots = w.shots;
  let n = 0;
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    s.life -= dt;
    let alive = s.life > 0;
    if (alive) {
      const sx = s.vx * dt, sy = s.vy * dt, sz = s.vz * dt;
      let bestT = 1, target = null;
      const hit = raycast(w.plats, s.x, s.y, s.z, sx, sy, sz, 1);
      let nx = 0, ny = 1, nz = 0;
      if (hit) { bestT = hit.t; nx = hit.nx; ny = hit.ny; nz = hit.nz; }
      const L2 = sx * sx + sy * sy + sz * sz;
      for (const e of w.enemies) {
        if (e.dead) continue;
        const cy = e.y + e.top * 0.5, rr = e.r + s.r + (e.type === 'guard' ? 0.1 : 0);
        // vertical stretch for tall guards / servers: test against their axis
        const half = Math.max(0, e.top * 0.5 - e.r);
        const fx = s.x - e.x, fz = s.z - e.z;
        if (fx * fx + fz * fz > (rr + Math.sqrt(L2) + 2) * (rr + Math.sqrt(L2) + 2)) continue;
        // param of closest approach to the centre column (sampled: 4 points along the segment)
        for (let k = 1; k <= 4; k++) {
          const t = k / 4;
          if (t > bestT) break;
          const qx = s.x + sx * t, qy = s.y + sy * t, qz = s.z + sz * t;
          if (pointVSegDist2(qx, qy, qz, e.x, cy - half, cy + half, e.z) < rr * rr) { bestT = t; target = e; break; }
        }
      }
      const hx = s.x + sx * bestT, hy = s.y + sy * bestT, hz = s.z + sz * bestT;
      if (target) {
        damageEnemy(w, target, s.dmg, false, s);
        if (s.splash) explode(w, hx, hy, hz, s.splash, s.splashDmg, target);
        alive = false;
      } else if (hit) {
        if (s.splash) explode(w, hx, hy, hz, s.splash, s.splashDmg, null);
        else w.events.push({ type: 'impact', x: hx, y: hy, z: hz, nx, ny, nz, kind: s.kind });
        alive = false;
      } else { s.x = hx; s.y = hy; s.z = hz; }
    } else if (s.splash) explode(w, s.x, s.y, s.z, s.splash, s.splashDmg, null);
    if (alive) shots[n++] = s;
  }
  shots.length = n;
}

function explode(w, x, y, z, r, dmg, skip) {
  w.events.push({ type: 'explode', x, y, z, r });
  for (const e of w.enemies) {
    if (e.dead || e === skip) continue;
    const dx = e.x - x, dy = e.y + e.top * 0.5 - y, dz = e.z - z;
    if (dx * dx + dy * dy + dz * dz < r * r) damageEnemy(w, e, dmg);
  }
}

export function updateBolts(w, dt) {
  const P = w.player, bolts = w.bolts, R = T.RADIUS + ENEMY_BOLT.r;
  let n = 0;
  for (let i = 0; i < bolts.length; i++) {
    const b = bolts[i];
    b.life -= dt;
    let alive = b.life > 0;
    if (alive) {
      const sx = b.vx * dt, sy = b.vy * dt, sz = b.vz * dt;
      const hit = raycast(w.plats, b.x, b.y, b.z, sx, sy, sz, 1);
      const t = hit ? hit.t : 1;
      const mx = b.x + sx * t * 0.5, my = b.y + sy * t * 0.5, mz = b.z + sz * t * 0.5;
      const ex = b.x + sx * t, ey = b.y + sy * t, ez = b.z + sz * t;
      const y0 = P.y + T.RADIUS, y1 = P.y + T.HEIGHT - T.RADIUS * 0.5;
      if (!P.dead && (pointVSegDist2(ex, ey, ez, P.x, y0, y1, P.z) < R * R || pointVSegDist2(mx, my, mz, P.x, y0, y1, P.z) < R * R)) {
        if (P.inv <= 0) hurtPlayer(w, ENEMY_BOLT.dmg, b.x, b.z, 0);
        w.events.push({ type: 'impact', x: ex, y: ey, z: ez, nx: 0, ny: 1, nz: 0, kind: 'bolt' });
        alive = false;
      } else if (hit) {
        w.events.push({ type: 'impact', x: ex, y: ey, z: ez, nx: hit.nx, ny: hit.ny, nz: hit.nz, kind: 'bolt' });
        alive = false;
      } else { b.x = ex; b.y = ey; b.z = ez; }
    }
    if (alive) bolts[n++] = b;
  }
  bolts.length = n;
}

