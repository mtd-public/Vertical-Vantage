// The player robot: run, triple jump, auto look-down, stomp, shoot. Pure (no three.js, no DOM).
//
// Control object for one step (built by js/input, or by tools for golden traces):
//   { mx, my,            move stick, -1..1 (my > 0 = forward)
//     yaw, pitch,        look deltas to apply this step, radians (pitch > 0 = up)
//     jump,              true on the step the jump button went down (edge)
//     fire,              held
//     swap }             -1 / 0 / +1 on the step a weapon-cycle button went down
import { T, WEAPONS, WEAPON_ORDER, OVERDRIVE_RATE } from './tuning.js';
import { clamp, forward } from './util.js';
import { pushOut, groundBelow, toLocal, toWorld, inside } from './plats.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y, z: start.z, vx: 0, vy: 0, vz: 0,
    px: start.x, py: start.y, pz: start.z, // previous step (render interpolation)
    yaw: start.yaw || 0, pitch: start.pitch ?? -0.12, auto: 0, autoOff: false, grab: 0, autoPitch: T.AUTO_PITCH,
    lock: null, lockT: 0, autoShoot: 0, // stomp → aim-down lock on whatever you bounced off
    ground: null, coyote: 0, buffer: 0, jumps: 0, air: 0, landT: 9, lastVy: 0,
    hp: T.HP_MAX, inv: 0, dead: false,
    weapon: 'blaster', ammo: { spread: 0, rapid: 0, rocket: 0 }, cool: 0, shotN: 0,
    hyper: 0, over: 0,
    stride: 0, // walk-cycle phase for the legs
    steer: 0, tvx: 0, tvz: 0, // stick held (1/0) and the horizontal velocity it asks for: the landing look-ahead uses them
    safe: null, safeT: 0, // { pid, lx, lz } last solid footing, for respawns
    hurtT: 9, // seconds since last hurt (HUD flash)
  };
}

// The pitch actually used for the camera and the gun.
export function viewPitch(P) { return P.pitch * (1 - P.auto) + P.autoPitch * P.auto; }

export function eye(P) { return P.y + T.EYE; }

const _l = [0, 0], _w = [0, 0];

export function updatePlayer(w, c, dt) {
  const P = w.player;
  P.px = P.x; P.py = P.y; P.pz = P.z;
  P.inv = Math.max(0, P.inv - dt);
  P.hurtT += dt;
  P.hyper = Math.max(0, P.hyper - dt);
  P.over = Math.max(0, P.over - dt);

  // ---- look (applied first, so this step's shots go where you just aimed)
  P.yaw += c.yaw || 0;
  if (P.yaw > Math.PI) P.yaw -= 2 * Math.PI; else if (P.yaw < -Math.PI) P.yaw += 2 * Math.PI;
  const dp = c.pitch || 0;
  if (dp !== 0 && P.auto > 0.02) P.grab += Math.abs(dp);
  if (P.auto > 0.02 && P.grab > 0.06) { // a deliberate look mid-tilt takes over from the auto look-down
    P.pitch = viewPitch(P) + dp; P.auto = 0; P.autoOff = true; P.grab = 0;
  } else P.pitch += dp;
  P.pitch = clamp(P.pitch, T.PITCH_MIN, T.PITCH_MAX);
  if (P.autoOff) P.lock = null; // a deliberate look cancels the stomp lock too

  // ---- stomp lock: after bouncing off something that's still standing, swing the view onto it
  let autoTarget = T.AUTO_PITCH;
  const L = P.lock;
  if (L && (P.lockT -= dt) > 0 && !L.dead && L.hp > 0) {
    const ex = L.x - P.x, ey = L.y + L.top * 0.5 - (P.y + T.EYE), ez = L.z - P.z;
    const yawT = Math.atan2(-ex, -ez);
    let dyaw = yawT - P.yaw;
    while (dyaw > Math.PI) dyaw -= 2 * Math.PI;
    while (dyaw < -Math.PI) dyaw += 2 * Math.PI;
    const r = T.STOMP_AIM_RATE * dt;
    P.yaw += clamp(dyaw, -r, r);
    autoTarget = clamp(Math.atan2(ey, Math.sqrt(ex * ex + ez * ez)), T.PITCH_MIN, 0.3);
    P.auto = Math.min(1, P.auto + r);
  } else if (L) { P.lock = null; }
  P.autoPitch += (autoTarget - P.autoPitch) * Math.min(1, (P.lock ? T.STOMP_AIM_RATE : 6) * dt);

  // ---- ride the platform under us (before anything else moves us)
  const G = P.ground;
  if (G) { P.x += G.dx; P.y += G.dy; P.z += G.dz; }

  // ---- run / air control
  const mx = clamp(c.mx || 0, -1, 1), my = clamp(c.my || 0, -1, 1);
  let m = Math.sqrt(mx * mx + my * my);
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  // stick → world: forward is (-sin yaw, -cos yaw), right is (cos yaw, -sin yaw)
  let wx = mx * cy - my * sy, wz = -mx * sy - my * cy;
  if (m > 1) { wx /= m; wz /= m; m = 1; }
  const grounded = !!P.ground;
  const tx = wx * T.RUN, tz = wz * T.RUN;
  P.steer = m > 0.05 ? 1 : 0; P.tvx = tx; P.tvz = tz;
  if (grounded) {
    const rate = m > 0.05 ? T.GROUND_ACCEL : T.GROUND_FRICTION;
    approach(P, tx, tz, rate * dt);
  } else if (m > 0.05) {
    approach(P, tx, tz, T.AIR_ACCEL * dt);
  } else {
    const k = Math.max(0, 1 - T.AIR_DRAG * dt);
    P.vx *= k; P.vz *= k;
  }

  // ---- jump (snap vertical speed, Jumping Flash: each air jump launches harder)
  if (c.jump) P.buffer = T.JUMP_BUFFER;
  else P.buffer = Math.max(0, P.buffer - dt);
  if (P.buffer > 0) {
    let stage = -1;
    if (grounded || P.coyote > 0) stage = 0;
    else if (P.jumps < T.JUMP_V.length && c.jump) stage = Math.max(1, P.jumps);
    if (stage >= 0) {
      P.vy = T.JUMP_V[stage] * (P.hyper > 0 ? T.HYPER_K : 1);
      P.jumps = stage + 1;
      P.ground = null; P.coyote = 0; P.buffer = 0;
      P.autoOff = false;
      w.events.push({ type: 'jump', stage, x: P.x, y: P.y, z: P.z });
    }
  }

  // ---- gravity
  if (!P.ground || P.vy > 0) {
    P.vy = Math.max(-T.FALL_MAX, P.vy - T.GRAVITY * dt);
  }

  // ---- integrate + collide (sub-stepped so a fast fall can't tunnel a thin deck)
  const wasGround = P.ground;
  P.lastVy = P.vy;
  const travel = Math.max(Math.abs(P.vx), Math.abs(P.vy), Math.abs(P.vz)) * dt;
  const n = Math.max(1, Math.ceil(travel / 0.2));
  const h = dt / n;
  let landed = null;
  for (let i = 0; i < n; i++) {
    const r = moveAndCollide(w, P, h, wasGround);
    if (r) landed = r;
  }

  if (landed) {
    if (!wasGround) {
      const impact = -P.lastVy;
      if (P.air > 0.12) w.events.push({ type: 'land', x: P.x, y: P.y, z: P.z, impact });
      P.landT = 0;
    }
    P.ground = landed; P.jumps = 0; P.coyote = T.COYOTE; P.air = 0;
    P.autoOff = false; P.grab = 0; P.lock = null;
    // remember solid footing well inside the edge (respawn point after a fall)
    P.safeT += dt;
    if (P.safeT > 0.25 && !landed.move && inside(landed, P.x, P.z, -0.8)) {
      toLocal(landed, P.x, P.z, _l);
      P.safe = { pid: landed.id, lx: _l[0], lz: _l[1], yaw: P.yaw };
    }
  } else {
    if (wasGround) P.coyote = T.COYOTE;
    P.ground = null; P.safeT = 0;
    P.coyote = Math.max(0, P.coyote - dt);
    if (P.coyote <= 0 && P.jumps === 0) P.jumps = 1; // walked off: the ground jump is spent
    P.air += dt;
  }
  P.landT += dt;

  // ---- auto look-down (Jumping Flash): tip the view toward your feet, starting mid-rise on every jump
  const launch = T.JUMP_V[clamp(P.jumps - 1, 0, T.JUMP_V.length - 1)] * (P.hyper > 0 ? T.HYPER_K : 1);
  const wantAuto = w.opts.autoLook && !P.ground && !P.autoOff && P.vy < launch * T.AUTO_RISE && P.air > 0.12;
  if (P.lock) { /* the stomp lock owns the view */ }
  else if (wantAuto) P.auto = Math.min(1, P.auto + (1 - P.auto) * Math.min(1, T.AUTO_IN * dt));
  else P.auto = Math.max(0, P.auto - P.auto * Math.min(1, T.AUTO_OUT * dt) - (P.ground ? dt * 0.2 : 0));

  // walk cycle for the legs
  const sp = Math.sqrt(P.vx * P.vx + P.vz * P.vz);
  if (P.ground) P.stride += sp * dt * 0.9;

  // ---- weapons
  if (c.swap) cycleWeapon(w, P, c.swap);
  P.cool -= dt;
  P.autoShoot = Math.max(0, P.autoShoot - dt);
  if ((c.fire || P.autoShoot > 0) && P.cool <= 0 && !P.dead) fire(w, P);
}

function approach(P, tx, tz, maxDv) {
  const dx = tx - P.vx, dz = tz - P.vz, d = Math.sqrt(dx * dx + dz * dz);
  if (d <= maxDv || d < 1e-9) { P.vx = tx; P.vz = tz; return; }
  P.vx += (dx / d) * maxDv; P.vz += (dz / d) * maxDv;
}

// One sub-step. Returns the platform we are standing on after it, or null.
function moveAndCollide(w, P, h, wasGround) {
  const prevY = P.y;
  P.x += P.vx * h; P.y += P.vy * h; P.z += P.vz * h;
  let stand = null;
  const R = T.RADIUS, H = T.HEIGHT;
  for (const p of w.plats) {
    const top = p.h + p.oy, bot = top - p.thick;
    if (P.y >= top + 0.001 || P.y + H <= bot) continue; // no vertical overlap
    const bx = P.x - p.x - p.ox, bz = P.z - p.z - p.oz, br = p.bound + R;
    if (bx * bx + bz * bz > br * br) continue;
    const push = pushOut(p, P.x, P.z, R * 0.999);
    if (!push) continue;
    const prevTop = top - p.dy;
    // landing on top: we were above its (previous) top a moment ago
    const walkOn = P.y >= top - T.STEP_UP && P.vy <= 0.5 && (wasGround || P.ground); // walking onto a kerb, a step, the next deck
    if (prevY >= prevTop - 0.03 || walkOn) {
      // only stand if the feet are over the footprint (not just the radius grazing a side). Walking on, the
      // radius touching it is enough: the side push below holds you a full radius out, so the feet never get closer.
      if (inside(p, P.x, P.z, walkOn ? R : R * 0.55)) {
        P.y = top;
        if (P.vy < 0) P.vy = 0;
        stand = p;
        continue;
      }
    }
    // head bump from below
    if (P.vy > 0 && prevY + H <= bot + p.dy + 0.05) {
      P.y = bot - H; P.vy = 0;
      w.events.push({ type: 'bonk', x: P.x, y: P.y + H, z: P.z });
      continue;
    }
    // side: push out horizontally and kill the velocity into the wall
    const nx = push[0], nz = push[1], depth = push[2];
    P.x += nx * depth; P.z += nz * depth;
    const vn = P.vx * nx + P.vz * nz;
    if (vn < 0) { P.vx -= vn * nx; P.vz -= vn * nz; }
  }
  return stand;
}

// ------------------------------------------------------------------ weapons
export function cycleWeapon(w, P, dir) {
  const owned = WEAPON_ORDER.filter((k) => k === 'blaster' || P.ammo[k] > 0);
  let i = owned.indexOf(P.weapon);
  if (i < 0) i = 0;
  const next = owned[(i + dir + owned.length) % owned.length];
  if (next !== P.weapon) { P.weapon = next; P.cool = Math.max(P.cool, 0.12); w.events.push({ type: 'swap', weapon: next }); }
}

function fire(w, P) {
  const W = WEAPONS[P.weapon];
  P.cool = W.rate * (P.over > 0 ? OVERDRIVE_RATE : 1);
  const pitch = viewPitch(P);
  const ey = P.y + T.EYE;
  for (let k = 0; k < W.pellets; k++) {
    let yaw = P.yaw, pt = pitch;
    if (W.pellets > 1) { // a fixed fan (fair and readable) plus a little jitter
      const a = (k / (W.pellets - 1) - 0.5) * 2;
      yaw += a * W.spread * 1.6 + (w.rng() - 0.5) * W.spread * 0.3;
      pt += (w.rng() - 0.5) * W.spread * 0.8;
    } else if (W.spread) { yaw += (w.rng() - 0.5) * W.spread; pt += (w.rng() - 0.5) * W.spread; }
    const f = forward(yaw, pt);
    w.shots.push({
      x: P.x + f[0] * 0.4, y: ey + f[1] * 0.4 - 0.05, z: P.z + f[2] * 0.4,
      vx: f[0] * W.speed, vy: f[1] * W.speed, vz: f[2] * W.speed,
      life: W.life, dmg: W.dmg * (P.over > 0 ? 2 : 1), r: W.r, kind: P.weapon, splash: W.splash || 0, splashDmg: W.splashDmg || 0, id: w.nextId++,
    });
  }
  P.shotN++;
  w.stats.shots++;
  w.events.push({ type: 'fire', weapon: P.weapon, side: P.shotN & 1 });
  if (W.ammo !== Infinity) {
    P.ammo[P.weapon] -= 1;
    if (P.ammo[P.weapon] <= 0) { P.ammo[P.weapon] = 0; w.events.push({ type: 'empty', weapon: P.weapon }); cycleWeapon(w, P, 1); }
  }
}

// ------------------------------------------------------------------ damage, falls, respawn
export function hurtPlayer(w, dmg, fromX, fromZ, knock = 0) {
  const P = w.player;
  if (P.inv > 0 || P.dead || w.phase !== 'play') return false;
  P.hp = Math.max(0, P.hp - dmg);
  P.inv = T.INVULN; P.hurtT = 0;
  w.stats.damage += dmg;
  if (knock && fromX !== undefined) {
    const dx = P.x - fromX, dz = P.z - fromZ, d = Math.sqrt(dx * dx + dz * dz) || 1;
    P.vx = (dx / d) * knock; P.vz = (dz / d) * knock; P.vy = Math.max(P.vy, 5); P.ground = null;
  }
  w.events.push({ type: 'hurt', dmg, hp: P.hp, x: fromX ?? P.x, z: fromZ ?? P.z });
  if (P.hp <= 0) { P.dead = true; w.phase = 'dead'; w.events.push({ type: 'dead' }); }
  return true;
}

export function respawn(w) {
  const P = w.player;
  let x = w.level.start.x, y = w.level.start.y, z = w.level.start.z, yaw = P.yaw;
  if (P.safe) {
    const p = w.plats[P.safe.pid];
    toWorld(p, P.safe.lx, P.safe.lz, _w);
    x = _w[0]; z = _w[1]; y = p.h + p.oy; yaw = P.safe.yaw;
  } else {
    const g = groundBelow(w.plats, x, z, y + 1);
    if (g) y = g.h + g.oy;
  }
  P.x = P.px = x; P.y = P.py = y + 0.05; P.z = P.pz = z; P.yaw = yaw;
  P.vx = P.vy = P.vz = 0; P.ground = null; P.jumps = 0; P.auto = 0; P.air = 0;
}
