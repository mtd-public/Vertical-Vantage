// STORMCROW: the SEATTLE pack's boss. A bird-drone the size of a bus with a storm coil on its back,
// flying circles round the Space Needle's saucer in a thunderstorm. Pure (no three.js, no DOM).
//
//   orbit ──┬─ diveTele (screech, eye flare, a red sight line through you; ≥ 0.62 s)
//           │     → dive (straight down that line, skims through where you stood, climbs out)
//           │         → [phase 2+: a second dive] → land on the saucer → perch (stunned ×1.5, stomp
//           │           its back) → [phase 2+: gust ring telegraph] → takeoff → orbit
//           │         └ or straight back up → orbit
//           ├─ fanTele (wings spread) → a fan of feather-missiles (phase 3: two fans)
//           └─ stormTele (the coil sparks) → lightning: telegraphed strike rings on you and on the pads
//   phases by health: 1 (> 60 %), 2 (> 30 %: double dives, gusts, more lightning, two drones),
//   3 (faster, shorter telegraphs, double fans, two more drones)
// It never touches the ground except to perch: the drop below the saucer is the real danger.
import { T } from '../tuning.js';
import { clamp } from '../util.js';
import { raycast, groundBelow } from '../plats.js';
import { hurtPlayer } from '../player.js';
import { initPose, introTick, phaseTick, pick, turnTo, fan, zone, spawn, down as stdDown, dyingTick, syncPose } from './common.js';

// Every number, and why.
export const tuning = {
  hp: 300, // the blaster does ~6.7/s: 45 s of clean hits; perches (×1.5) and stomps make it a 2–3 minute fight
  r: 2.3, top: 2.6, bodyH: 1.3, // its body capsule (wings are wider, but you dodge the body); perched, its back is 2.6 m up: one jump
  orbitR: [23, 22, 21], // circles just outside the pad ring (r 20), inside the outer perches (r 29)
  orbitH: [14, 13.5, 13], // high enough to clear every pad, low enough to shoot at
  orbitW: [0.34, 0.4, 0.46], // rad/s: 7.8 → 9.7 m/s round the arena (you run 8.5)
  think: [[2.4, 3.4], [2.0, 3.0], [1.6, 2.6]], // seconds of circling between attacks, by phase
  diveTele: [0.85, 0.72, 0.62], // screech + eye flare + sight line through you, then it commits (spec: ≥ 0.6 s)
  diveTele2: 0.65, // the second dive of a double, from wherever the first one left it
  diveSpeed: [19, 22, 25], // m/s once it's up to speed (it eases in): side-step 3 m and it misses
  diveEase: 30, // m/s² ramp from its glide speed, so the first metres of a dive are readable
  diveOut: 14, diveClimb: 10, // after skimming through you it carries on 14 m and climbs 10 m
  diveLead: [0, 0.35, 0.6], // phase 2+: it aims ahead of where you're running (the sight line shows where): change direction
  diveDmg: 2, diveKnock: 7, // a direct hit hurts more than a bolt (the big attack); the shove rarely throws you off the saucer
  landSpeed: 18, // gliding in to perch
  doubleDive: [0, 0.5, 0.8], // chance of a second dive straight after the first, by phase
  perchChance: [0.75, 0.6, 0.5], // after a dive it often lands on the saucer to recover…
  perchTime: [3.2, 2.7, 2.2], // …this long: the punish window (×1.5 damage, stompable back)
  perchR: 6, perchClear: 6, // it lands 6 m from the saucer's centre, never within 6 m of you
  perchVuln: 1.5,
  gustTele: 0.7, gustR: 4.8, gustKnock: 12, // phase 2+: before it takes off, a ring of wind telegraphs, then knocks you off its back
  fanTele: [0.65, 0.55, 0.5], // wings spread wide, then the feathers fly
  fanN: [5, 7, 9], fanArc: [0.5, 0.65, 0.8], fanSpeed: [14, 15.5, 17], // dodge sideways or duck behind a pad
  stormTele: 0.6, // the coil on its back sparks before the strikes are placed
  strikes: [2, 3, 5], strikeDelay: [1.2, 1.05, 0.95], strikeR: 3.0, strikeH: 3.5, // the rings fill, then lightning: step out
  minions: [0, 1, 1], maxDrones: 3, // seagull drones it calls in at the start of phases 2 and 3 (never more than 3 up)
  takeoff: 1.1, // seconds from perch back up to its orbit
};
const S = tuning;

const center = (A) => ({ x: (A.x0 + A.x1) / 2, z: (A.z0 + A.z1) / 2 });

export function init(w, e, d) {
  initPose(w, e, d, { hp: S.hp, r: S.r, top: S.top, bodyH: S.bodyH, intro: 2.0 });
  const A = w.level.arena, C = center(A);
  e.cy = d.y ?? (A.floor + S.orbitH[0]); // it starts in the air (the level gives its altitude)
  e.surf = 'air'; e.ny = 1;
  e.oa = Math.atan2(e.cz - C.z, e.cx - C.x); // orbit angle
  e.odir = 1; e.flap = 0; e.tele = 0; e.coil = 0; e.gust = 0; e.chain = 0; e.last = '';
  e.dive = { sx: 0, sy: 0, sz: 0, tx: 0, ty: 0, tz: 0, ex: 0, ey: 0, ez: 0, seg: 0, v: 0 };
  e.perch = { x: 0, z: 0 }; e.myZones = []; e.strikes = []; e.spawned = 0;
  const dx = w.player.x - e.cx, dz = w.player.z - e.cz, l = Math.sqrt(dx * dx + dz * dz) || 1;
  e.fx = dx / l; e.fz = dz / l;
  syncPose(e);
}

const ph = (e, arr) => arr[e.phase - 1];
function orbitPt(w, e, a, out) {
  const A = w.level.arena, C = center(A);
  out.x = C.x + Math.cos(a) * ph(e, S.orbitR); out.z = C.z + Math.sin(a) * ph(e, S.orbitR);
  out.y = A.floor + ph(e, S.orbitH) + Math.sin(e.t * 0.9) * 0.6;
  return out;
}
const _o = { x: 0, y: 0, z: 0 };

// Fly toward (tx, ty, tz) at up to `speed`, steering (accel-limited), heading along the motion.
function fly(e, tx, ty, tz, speed, dt, accel = 26, brake = 2.2) {
  const dx = tx - e.cx, dy = ty - e.cy, dz = tz - e.cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const want = d > 1e-4 ? Math.min(speed, d * brake) / d : 0;
  const ax = dx * want - e.vx, ay = dy * want - e.vy, az = dz * want - e.vz, al = Math.sqrt(ax * ax + ay * ay + az * az), k = al > accel * dt ? (accel * dt) / al : 1;
  e.vx += ax * k; e.vy += ay * k; e.vz += az * k;
  e.cx += e.vx * dt; e.cy += e.vy * dt; e.cz += e.vz * dt;
  const hv = Math.sqrt(e.vx * e.vx + e.vz * e.vz);
  if (hv > 0.5) turnTo(e, e.cx + e.vx, e.cz + e.vz, 3.2, dt);
  return d;
}

// The eye, at the front of the head.
const eyeX = (e) => e.cx + e.fx * 2.2, eyeY = (e) => e.cy + 0.35, eyeZ = (e) => e.cz + e.fz * 2.2;
function clearLine(w, x, y, z) {
  const P = w.player, dx = P.x - x, dy = P.y + 1 - y, dz = P.z - z;
  return !raycast(w.plats, x, y, z, dx, dy, dz, 0.97);
}
// Where it means to pass: you, or (phase 2+) a little ahead of where you're running, ≤ 7 m.
const _aim = { x: 0, y: 0, z: 0 };
function aimPoint(w, e) {
  const P = w.player, dx = P.x - e.cx, dz = P.z - e.cz;
  const tHit = Math.sqrt(dx * dx + dz * dz + (P.y - e.cy) * (P.y - e.cy)) / ph(e, S.diveSpeed) + 0.3;
  let lx = P.vx * tHit * ph(e, S.diveLead), lz = P.vz * tHit * ph(e, S.diveLead);
  const l = Math.sqrt(lx * lx + lz * lz);
  if (l > 7) { lx *= 7 / l; lz *= 7 / l; }
  _aim.x = P.x + lx; _aim.y = P.y + 1; _aim.z = P.z + lz;
  return _aim;
}
// The sight line: from the eye through where it will pass, on beyond (the line it will dive along).
function sight(w, e) {
  const B = e.beam, Q = aimPoint(w, e);
  B.ox = eyeX(e); B.oy = eyeY(e); B.oz = eyeZ(e);
  let dx = Q.x - B.ox, dy = Q.y - B.oy, dz = Q.z - B.oz;
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  B.dx = dx / l; B.dy = dy / l; B.dz = dz / l;
  const hit = raycast(w.plats, B.ox, B.oy, B.oz, B.dx, B.dy, B.dz, l + 12);
  B.len = hit ? hit.t : l + 12;
  B.sight = true;
}

export function update(w, e, dt) {
  const A = w.level.arena, P = w.player; // (updateEnemies already advanced e.t and e.flash)
  e.flap += dt * (e.state === 'perch' ? 0.6 : e.state === 'dive' ? 0.4 : e.state === 'diveTele' || e.state === 'fanTele' ? 3.2 : 2.2);
  e.tele = Math.max(0, e.tele - dt * 3); e.coil = Math.max(0, e.coil - dt * 1.5); e.gust = Math.max(0, e.gust - dt * 2);
  e.beam.on = false; e.beam.sight = false;
  strikesTick(w, e, dt);
  if (e.state === 'dying') { dying(w, e, dt); return; }
  if (introTick(w, e, dt, 'orbit', 1.6)) { hover(w, e, e.cx, A.floor + ph(e, S.orbitH), e.cz, dt); face(e, P.x, P.z, dt); syncPose(e); return; }
  if (phaseTick(w, e)) onPhase(w, e);
  e.vuln = 1; e.surf = 'air'; e.crouch = 0;
  e.timer -= dt;

  switch (e.state) {
    case 'orbit': {
      e.oa += e.odir * ph(e, S.orbitW) * dt;
      orbitPt(w, e, e.oa, _o);
      fly(e, _o.x, _o.y, _o.z, 16, dt);
      if (e.timer <= 0) decide(w, e);
      break;
    }
    case 'fanTele': {
      hover(w, e, e.dive.tx, e.dive.ty, e.dive.tz, dt); face(e, P.x, P.z, dt);
      e.tele = 1;
      if (e.timer <= 0) {
        fan(w, e, eyeX(e), e.cy - 0.1, eyeZ(e), ph(e, S.fanSpeed), ph(e, S.fanN), ph(e, S.fanArc));
        if (e.phase === 3 && !e.fan2) { e.fan2 = true; e.timer = 0.35; } // phase 3: a second fan, offset
        else { e.fan2 = false; toOrbit(w, e, 0.9); }
      }
      break;
    }
    case 'stormTele': {
      hover(w, e, e.dive.tx, e.dive.ty, e.dive.tz, dt); face(e, P.x, P.z, dt);
      e.coil = 1;
      if (e.timer <= 0) { lightning(w, e); toOrbit(w, e, 1.0); }
      break;
    }
    case 'diveTele': {
      hover(w, e, e.dive.sx, e.dive.sy, e.dive.sz, dt); face(e, P.x, P.z, dt);
      e.tele = 1; sight(w, e);
      if (e.timer <= 0) startDive(w, e);
      break;
    }
    case 'dive': diveTick(w, e, dt); break;
    case 'rejoin': {
      e.oa = Math.atan2(e.cz - center(A).z, e.cx - center(A).x);
      orbitPt(w, e, e.oa, _o);
      if (fly(e, _o.x, _o.y, _o.z, 15, dt, 30) < 2 || e.timer <= 0) toOrbit(w, e, 0.6);
      break;
    }
    case 'land': {
      const d = fly(e, e.perch.x, A.floor + S.bodyH, e.perch.z, S.landSpeed, dt, 40, 4);
      if (d < 1.0 || e.timer <= 0) {
        e.cx = e.perch.x; e.cz = e.perch.z; e.cy = A.floor + S.bodyH; e.vx = e.vy = e.vz = 0;
        e.state = 'perch'; e.timer = ph(e, S.perchTime);
        w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: 3.5 }); // a heavy landing (no damage)
      }
      break;
    }
    case 'perch': {
      e.surf = 'floor'; e.vuln = S.perchVuln; e.crouch = 1;
      face(e, P.x, P.z, dt * 0.4);
      if (e.timer <= 0) {
        if (e.phase >= 2) { e.state = 'gust'; e.timer = S.gustTele; zone(w, e.cx, A.floor, e.cz, S.gustR, S.gustTele, { dmg: 1, knock: S.gustKnock, kind: 'gust', height: 2.4 }); w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); }
        else takeoff(w, e);
      }
      break;
    }
    case 'gust': {
      e.surf = 'floor'; e.vuln = S.perchVuln; e.gust = 1; e.crouch = 0.6;
      if (e.timer <= 0) takeoff(w, e);
      break;
    }
    case 'takeoff': {
      orbitPt(w, e, e.oa, _o);
      fly(e, e.cx + (_o.x - e.cx) * 0.4, _o.y, e.cz + (_o.z - e.cz) * 0.4, 12, dt, 30);
      if (e.timer <= 0) toOrbit(w, e, 0.5);
      break;
    }
    default: toOrbit(w, e, 1);
  }
  // inside the arena box, above the floor, under the ceiling
  e.cx = clamp(e.cx, A.x0, A.x1); e.cz = clamp(e.cz, A.z0, A.z1); e.cy = clamp(e.cy, A.floor + S.bodyH * 0.8, A.ceil);
  syncPose(e);
}

function hover(w, e, x, y, z, dt) { fly(e, x, y, z, 6, dt, 22); }
function face(e, x, z, dt) { turnTo(e, x, z, 4, dt); }

// Back to circling; the next attack comes after `extra` s plus half its thinking time.
function toOrbit(w, e, extra) {
  const A = w.level.arena, C = center(A), th = ph(e, S.think);
  e.state = 'orbit'; e.oa = Math.atan2(e.cz - C.z, e.cx - C.x);
  e.timer = extra + (th[0] + w.rng() * (th[1] - th[0])) * 0.5;
}

function decide(w, e) {
  const k = (n) => (e.last === n ? 0.35 : 1);
  const opts = [['dive', 3 * k('dive')], ['fan', 2 * k('fan')], ['storm', [2, 2.5, 3][e.phase - 1] * k('storm')]];
  let choice = pick(w, opts);
  if (choice === 'dive' && !diveSpot(w, e)) choice = 'storm'; // no clear line to you (you're under a pad): lightning finds you anyway
  e.last = choice;
  if (choice === 'dive') { e.chain = w.rng() < ph(e, S.doubleDive) ? 1 : 0; beginDiveTele(w, e, ph(e, S.diveTele)); }
  else {
    e.dive.tx = e.cx; e.dive.ty = e.cy; e.dive.tz = e.cz; // hover in place
    if (choice === 'fan') { e.state = 'fanTele'; e.timer = ph(e, S.fanTele); w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz }); }
    else { e.state = 'stormTele'; e.timer = S.stormTele; w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz }); }
  }
}

// Somewhere just ahead on its circle with a clear line to you. Sets e.dive.s*; false if none.
function diveSpot(w, e) {
  for (const k of [0, 1, 2, -1]) {
    orbitPt(w, e, e.oa + e.odir * k * 0.26, _o);
    if (clearLine(w, _o.x, _o.y + 0.35, _o.z)) { e.dive.sx = _o.x; e.dive.sy = _o.y; e.dive.sz = _o.z; return true; }
  }
  return false;
}
function beginDiveTele(w, e, t) {
  e.state = 'diveTele'; e.timer = t;
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); // the screech
}

// Lock the line: from where it is, through where you are now, on and up the far side.
function startDive(w, e) {
  const A = w.level.arena, C = center(A), D = e.dive, Q = aimPoint(w, e);
  D.sx = e.cx; D.sy = e.cy; D.sz = e.cz;
  D.tx = clamp(Q.x, A.x0 + 2, A.x1 - 2); D.tz = clamp(Q.z, A.z0 + 2, A.z1 - 2); D.ty = Math.max(Q.y, A.floor + S.bodyH * 0.85);
  let hx = D.tx - D.sx, hz = D.tz - D.sz, hl = Math.sqrt(hx * hx + hz * hz);
  if (hl < 1) { hx = C.x - D.tx; hz = C.z - D.tz; hl = Math.sqrt(hx * hx + hz * hz) || 1; } // straight down on you: out toward the middle
  hx /= hl; hz /= hl;
  D.ex = D.tx + hx * S.diveOut; D.ez = D.tz + hz * S.diveOut; D.ey = D.ty + S.diveClimb;
  const er = Math.sqrt((D.ex - C.x) * (D.ex - C.x) + (D.ez - C.z) * (D.ez - C.z)), rMax = (A.x1 - A.x0) / 2 - 2;
  if (er > rMax) { D.ex = C.x + (D.ex - C.x) * rMax / er; D.ez = C.z + (D.ez - C.z) * rMax / er; }
  D.seg = 0; D.v = Math.sqrt(e.vx * e.vx + e.vy * e.vy + e.vz * e.vz);
  e.state = 'dive'; e.timer = 6;
  w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz });
}

function diveTick(w, e, dt) {
  const D = e.dive, P = w.player;
  D.v = Math.min(ph(e, S.diveSpeed), D.v + S.diveEase * dt);
  let step = D.v * dt;
  while (step > 0) {
    const tx = D.seg === 0 ? D.tx : D.ex, ty = D.seg === 0 ? D.ty : D.ey, tz = D.seg === 0 ? D.tz : D.ez;
    const dx = tx - e.cx, dy = ty - e.cy, dz = tz - e.cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d <= step) {
      e.cx = tx; e.cy = ty; e.cz = tz; step -= d;
      if (D.seg === 0) D.seg = 1; else { endDive(w, e); return; }
    } else {
      e.vx = dx / d * D.v; e.vy = dy / d * D.v; e.vz = dz / d * D.v;
      e.cx += dx / d * step; e.cy += dy / d * step; e.cz += dz / d * step; step = 0;
    }
  }
  if (Math.abs(e.vx) + Math.abs(e.vz) > 0.1) turnTo(e, e.cx + e.vx, e.cz + e.vz, 8, dt);
  // the talons: a direct hit costs more than its body brushing you
  const dx = P.x - e.cx, dz = P.z - e.cz, rr = S.r + T.RADIUS;
  if (!P.dead && dx * dx + dz * dz < rr * rr && P.y < e.cy + S.top / 2 - 0.1 && P.y + T.HEIGHT > e.cy - S.top / 2) hurtPlayer(w, S.diveDmg, e.cx, e.cz, S.diveKnock);
  if (e.timer <= 0) endDive(w, e);
}

function endDive(w, e) {
  if (e.chain > 0 && diveSpotHere(w, e)) { e.chain--; beginDiveTele(w, e, S.diveTele2); return; }
  e.chain = 0;
  if (w.rng() < ph(e, S.perchChance) && perchSpot(w, e)) { e.state = 'land'; e.timer = 3; return; }
  e.state = 'rejoin'; e.timer = 3;
}
function diveSpotHere(w, e) {
  if (!clearLine(w, eyeX(e), eyeY(e), eyeZ(e))) return false;
  e.dive.sx = e.cx; e.dive.sy = e.cy; e.dive.sz = e.cz;
  return true;
}
// A spot on the saucer, between the drone pads, at least perchClear from you; the nearest to it.
function perchSpot(w, e) {
  const A = w.level.arena, C = center(A), P = w.player;
  let best = -1, bd = Infinity;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, x = C.x + Math.cos(a) * S.perchR, z = C.z + Math.sin(a) * S.perchR;
    const px = P.x - x, pz = P.z - z;
    if (px * px + pz * pz < S.perchClear * S.perchClear) continue;
    const g = groundBelow(w.plats, x, z, A.floor + 0.5);
    if (!g || g.h + g.oy < A.floor - 0.2) continue;
    const d = (e.cx - x) * (e.cx - x) + (e.cz - z) * (e.cz - z);
    if (d < bd) { bd = d; best = k; }
  }
  if (best < 0) return false;
  e.perch.x = C.x + Math.cos(best * Math.PI / 2) * S.perchR; e.perch.z = C.z + Math.sin(best * Math.PI / 2) * S.perchR;
  return true;
}

function takeoff(w, e) {
  e.state = 'takeoff'; e.timer = S.takeoff; e.vy = 6;
  e.odir = w.rng() < 0.5 ? -1 : 1; // and it may circle the other way now
  w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz });
}

// Lightning: one strike where you stand (or under you), the rest on pads and the saucer, ≥ 6 m apart.
function lightning(w, e) {
  const A = w.level.arena, P = w.player, n = ph(e, S.strikes), delay = ph(e, S.strikeDelay);
  const spots = [];
  const g = groundBelow(w.plats, P.x, P.z, P.y + 0.5);
  spots.push([P.x, g ? g.h + g.oy : P.y - 0.5, P.z]);
  const cands = w.plats.filter((p) => p.style === 'stormPad' || p.style === 'stormDeck');
  for (let tries = 0; spots.length < n && tries < 40; tries++) {
    const p = cands[Math.floor(w.rng() * cands.length)];
    let x = p.x + p.ox, z = p.z + p.oz;
    if (p.r > 6) { const a = w.rng() * Math.PI * 2, r = 3 + w.rng() * (p.r - 4); x += Math.cos(a) * r; z += Math.sin(a) * r; } // somewhere on the saucer
    if (spots.some((s) => (s[0] - x) * (s[0] - x) + (s[2] - z) * (s[2] - z) < 36)) continue;
    spots.push([x, p.h + p.oy, z]);
  }
  for (const [x, y, z] of spots) e.myZones.push(zone(w, x, y, z, S.strikeR, delay, { dmg: 1, knock: 8, kind: 'bolt', height: S.strikeH }));
  e.coil = 1;
}
// Strikes that just landed (for the renderer's bolts from the sky).
function strikesTick(w, e, dt) {
  let n = 0;
  for (const Z of e.myZones) { if (Z.t <= 0) e.strikes.push({ x: Z.x, y: Z.y, z: Z.z, age: 0 }); else e.myZones[n++] = Z; }
  e.myZones.length = n;
  let m = 0;
  for (const s of e.strikes) { s.age += dt; if (s.age < 0.6) e.strikes[m++] = s; }
  e.strikes.length = m;
}

function onPhase(w, e) {
  const n = ph(e, S.minions), A = w.level.arena, C = center(A);
  const alive = w.enemies.filter((x) => !x.dead && x.type === 'drone').length;
  for (let i = 0; i < n && alive + i < S.maxDrones; i++) {
    const a = e.oa + Math.PI * (0.5 + i), r = 16;
    spawn(w, { type: 'drone', x: C.x + Math.cos(a) * r, y: A.floor + 9 + i * 2, z: C.z + Math.sin(a) * r });
  }
  if (e.state === 'orbit') e.timer = Math.min(e.timer, 0.8); // it answers the hit
}

// The defeat: it drops out of the sky onto the saucer, or past it into the storm.
export function down(w, e) {
  stdDown(w, e);
  e.surf = 'fall'; e.vy = Math.min(0, e.vy); e.myZones.length = 0;
}
function dying(w, e, dt) {
  const A = w.level.arena;
  if (e.surf === 'fall') {
    e.vy -= 24 * dt; e.cy += e.vy * dt; e.cx += e.vx * dt * 0.5; e.cz += e.vz * dt * 0.5; e.vx *= 0.98; e.vz *= 0.98;
    const g = groundBelow(w.plats, e.cx, e.cz, e.cy);
    const floor = g ? g.h + g.oy + S.bodyH * 0.6 : A.floor - 18; // (into the storm's murk below the saucer)
    if (e.cy <= floor) { e.cy = floor; e.vy = 0; e.surf = g ? 'floor' : 'gone'; }
  }
  dyingTick(w, e, dt);
}

export const stompable = (e) => e.state === 'perch' || e.state === 'gust';

export default { init, update, down, stompable, tuning };
