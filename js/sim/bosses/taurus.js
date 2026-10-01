// TAURUS-312: the bull mech of NEO CHICAGO's BULL PEN. Pure (no three.js, no DOM).
//
// A matador fight. It stalks you, then PAWS the deck (telegraph: it faces you, its nostrils flare and
// a red lane paints the deck ahead; the lane goes solid when its aim locks) and CHARGES down that
// lane at more than twice your speed. Get something solid behind you — a floodlight pylon, a crate,
// the stands — and sidestep once the lane locks: it CRASHES, it's STUNNED (×1.5 damage, its back
// vents open), and a stomp on its back then does big damage. A charge that hits nothing skids to a
// stop; in phases 2 and 3 it turns and charges again at once.
//
//   stalk ──┬─ paw (telegraph) → charge ─┬─ crash → stun (punish) → shake → stalk
//           │                            └─ skid ─┬─ paw again (phase 2+: chained charges)
//           │                                     └─ snort → stalk
//           ├─ toss    (you're close: head down, horns up — a ring in front of it)
//           ├─ crouch → leap → slam (you're far: a ring where it will land; jump the shockwave)
//           └─ pods    (shoulder missile pods: fans of bolts, more when you're up high)
//   phases by health: 1 (> 66 %), 2 (> 33 %: faster, chains one charge), 3 (chains two).
//   Each new phase: it rears up and roars (shots glance off for a moment) and the jumbotron
//   drops a security drone.
import { T } from '../tuning.js';
import { clamp } from '../util.js';
import { pushOut } from '../plats.js';
import { hurtPlayer } from '../player.js';
import { initPose, phaseTick, pick, stride, turnTo, solidAt, pushSolids, openSpot, fan, fireAt, zone, spawn, down as stdDown, dyingTick, syncPose } from './common.js';

// Every number, and why. (Exported to data/tuning.json as BOSSES.taurus.)
export const TAURUS = {
  hp: 280, // ~42 s of blaster on target; stun windows (×1.5) and stun stomps make it ~2.5 min of play
  r: 2.6, top: 3.4, // hit radius; its back is 3.4 m up: a double jump (or a crate) gets you onto it
  bodyR: 2.3, // what it can't walk or charge through (pylons, crates)
  margin: 3.4, // body centre ↔ arena edge: its horns stop short of the stands
  walk: [3.6, 4.4, 5.2], // stalking speed by phase (m/s): you outwalk it easily (8.5)
  stalk: [1.6, 1.3, 1.0], // seconds of stalking between attacks (plus a seeded 0..0.8 s)
  paw: [1.1, 0.9, 0.75], // the charge telegraph by phase (≥ 0.5 s): it turns to face you as it paws
  chainPaw: 0.6, // the shorter paw before a chained charge (still ≥ 0.5 s)
  lock: 0.35, // the last 0.35 s of a paw its aim is locked (the lane goes solid): that's your cue to sidestep
  charge: [16, 18, 20], // charge speed (m/s): ~2× your run, so dodge sideways, don't run ahead of it
  overshoot: 8, minRun: 10, maxRun: 42, // it charges to where you were plus 8 m, unless something stops it first
  skid: 0.7, // braking time after a charge that hit nothing
  chains: [0, 1, 2], // extra charges it chains after a skid, by phase
  stun: [3.0, 2.6, 2.2], // seconds stunned after a crash: the punish window (vuln 1.5)
  stunVuln: 1.5,
  stunStomp: 14, // bonus damage for a stomp while it's stunned (on top of the 4 × 1.5 every stomp does)
  shake: 0.6, // getting back up after a stun
  trample: 2, trampleKnock: 13, trampleToss: 9, // caught by a charge: 2 cells and thrown aside
  tossRange: 7.5, tossCone: 0.65, // close and in front of it (cos of the half-angle)…
  toss: [0.7, 0.6, 0.55], // …the horn toss telegraph: a ring in front of it fills in
  tossR: 4.2, tossReach: 3.6, tossDmg: 2, tossKnock: 15, tossHeight: 2.2, tossCool: 0.55, // jump above 2.2 m or step out
  crouch: [0.85, 0.7, 0.6], // leap telegraph (it squats, the landing ring appears as it jumps)
  slamR: 6.5, slamHeight: 1.2, crushR: 3.0, recover: 1.1, // the shockwave ring (jump it), a direct hit, then a breather
  leapMin: 10, // it only leaps at you from farther than this
  podTele: 0.7, // the pods rise and glow before they fire
  volleys: [2, 3, 4], podN: [3, 4, 5], podArc: 0.55, podSpeed: 17, podGap: 0.5, // fans of slow bolts (dodge or take cover)
  high: 3.0, // you're "up high" (stands, pylons, jumbotron) above this: it favours its pods, and charges the stands
  rage: 1.3, // rearing up at a new phase: shots glance off (vuln 0) while it roars
  intro: 1.5, // the roar comes quickly: the stage intro card already announced it
  dyingTime: 1.8, // explosions, then the exit opens
};
const S = TAURUS;
const G = 30; // its own gravity: a heavy, fast leap
const _o = [0, 0];

export function init(w, e, d) {
  initPose(w, e, d, { hp: S.hp, r: S.r, top: S.top, bodyH: S.top / 2, intro: S.intro });
  Object.assign(e, {
    fx: 0, fz: 1, v: 0, lane: 0, locked: false, runLeft: 0, chainLeft: 0, crashT: 0,
    headK: 0, pawK: 0, pods: 0, podsLeft: 0, podT: 0, podSide: 1, stunK: 0, rearK: 0,
    last: '', rageQ: false, stompN: 0, stunStomps: 0, solids: [],
  });
  // the solids in its way (pylons, crates): fixed for the fight, so look them up once
  const A = w.level.arena;
  for (const p of w.plats) if (solidAt(w, p, A.floor, A.floor + S.top)) e.solids.push(p.id);
  syncPose(e);
}

export function stompable(e) { return e.surf === 'floor' && e.state !== 'charge' && e.state !== 'leap' && e.state !== 'intro'; }

export function update(w, e, dt) {
  const A = w.level.arena, P = w.player;
  e.crouch = Math.max(0, e.crouch - dt * 3);
  e.crashT = Math.max(0, e.crashT - dt);
  if (e.state === 'dying') { e.v = 0; e.lane = 0; dyingTick(w, e, dt); return; }
  if (e.state === 'intro') { e.timer -= dt; if (e.timer <= 0) { e.state = 'stalk'; e.timer = 1.2; w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); } syncPose(e); return; }
  stunStompBonus(w, e);
  if (e.state === 'dying') return;
  if (phaseTick(w, e, [0.66, 0.33])) e.rageQ = true;
  const ph = e.phase - 1;
  e.timer -= dt;
  let head = 0, paw = 0, pods = 0, stun = 0, rear = 0;

  switch (e.state) {
    case 'stalk': {
      openSpot(w, P.x, P.z, S.bodyR, _o, A.floor, A.floor + S.top);
      const d = stride(w, e, _o[0], _o[1], S.walk[ph], dt, S.bodyR, S.margin);
      e.v = d > 1.2 ? S.walk[ph] : 0;
      if (e.timer <= 0) decide(w, e);
      break;
    }
    case 'paw': { // face you while pawing; the last moments the aim is locked
      paw = 1; head = -0.6;
      if (e.timer > S.lock) { turnTo(e, P.x, P.z, 4.5, dt); e.locked = false; } else e.locked = true;
      e.lane = laneLength(w, e);
      if (e.timer <= 0) { e.state = 'charge'; e.runLeft = e.lane; e.v = S.charge[ph]; e.locked = true; w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz }); }
      break;
    }
    case 'charge': case 'skid': {
      head = -1;
      if (e.state === 'skid') { e.v = Math.max(0, e.v - (S.charge[ph] / S.skid) * dt); head = -0.4; }
      const step = e.v * dt;
      e.cx += e.fx * step; e.cz += e.fz * step; e.gait += step;
      e.runLeft -= step; e.lane = Math.max(0, e.runLeft);
      if (e.v > 5) trample(w, e);
      if (hitSomething(w, e)) { crash(w, e); break; }
      if (e.state === 'charge' && e.runLeft <= 0) { e.state = 'skid'; e.timer = S.skid; }
      else if (e.state === 'skid' && e.timer <= 0) {
        e.v = 0; e.lane = 0;
        if (e.chainLeft > 0) { e.chainLeft--; startPaw(w, e, S.chainPaw); }
        else { e.state = 'snort'; e.timer = 0.7; }
      }
      break;
    }
    case 'stun': stun = 1; e.v = 0; head = -0.8; if (e.timer <= 0) { e.state = 'shake'; e.timer = S.shake; } break;
    case 'shake': stun = 0.4; head = 0.2; if (e.timer <= 0) next(w, e); break;
    case 'snort': head = -0.3; turnTo(e, P.x, P.z, 2, dt); if (e.timer <= 0) next(w, e); break;
    case 'toss': { // head down: the ring in front of it fills in; then the horns sweep up
      head = e.timer > 0.12 ? -1 : 1;
      if (e.timer <= 0) { e.state = 'tossed'; e.timer = S.tossCool; w.events.push({ type: 'bossSlam', x: e.cx + e.fx * S.tossReach, y: A.floor, z: e.cz + e.fz * S.tossReach, r: S.tossR }); }
      break;
    }
    case 'tossed': head = 1; if (e.timer <= 0) next(w, e); break;
    case 'crouch': {
      e.crouch = 1; head = -0.5;
      turnTo(e, P.x, P.z, 3, dt);
      if (e.timer <= 0) leap(w, e);
      break;
    }
    case 'leap': {
      e.vy -= G * dt;
      e.cx += e.vx * dt; e.cy += e.vy * dt; e.cz += e.vz * dt;
      e.cx = clamp(e.cx, A.x0 + S.margin, A.x1 - S.margin); e.cz = clamp(e.cz, A.z0 + S.margin, A.z1 - S.margin);
      if (e.cy <= A.floor + e.bodyH && e.vy < 0) land(w, e);
      break;
    }
    case 'recover': e.crouch = 0.5; if (e.timer <= 0) next(w, e); break;
    case 'pods': {
      pods = 1; turnTo(e, P.x, P.z, 1.8, dt);
      if (e.timer > 0) break; // still rising and glowing
      e.podT -= dt;
      if (e.podT <= 0 && e.podsLeft > 0) {
        e.podsLeft--; e.podT = S.podGap; e.podSide = -e.podSide;
        const lx = -e.fz * e.podSide, lz = e.fx * e.podSide;
        const ox = e.cx + lx * 1.5 + e.fx * 0.4, oy = e.cy + S.top * 0.5 + 0.9, oz = e.cz + lz * 1.5 + e.fz * 0.4;
        if (e.phase === 3 && e.podsLeft === 0) fireAt(w, e, ox, oy, oz, S.podSpeed + 3, 0.35, 0);
        else fan(w, e, ox, oy, oz, S.podSpeed, S.podN[ph], S.podArc);
      }
      if (e.podsLeft <= 0 && e.podT <= 0) { e.state = 'snort'; e.timer = 0.5; }
      break;
    }
    case 'rage': {
      rear = 1; e.v = 0; head = 1;
      if (e.timer <= 0) { e.state = 'stalk'; e.timer = 0.6; }
      break;
    }
    default: e.state = 'stalk'; e.timer = 1;
  }
  e.vuln = e.state === 'stun' ? S.stunVuln : e.state === 'rage' ? 0 : 1; // (from the state it ends the step in)
  if (e.state !== 'charge' && e.state !== 'skid' && e.state !== 'paw') e.lane = 0;
  if (e.surf === 'floor' && e.state !== 'charge' && e.state !== 'skid') pushSolids(w, e, S.bodyR);
  if (e.surf === 'floor') { e.cx = clamp(e.cx, A.x0 + S.margin, A.x1 - S.margin); e.cz = clamp(e.cz, A.z0 + S.margin, A.z1 - S.margin); }
  // eased pose channels for the renderer
  const k = Math.min(1, dt * 8);
  e.headK += (head - e.headK) * Math.min(1, dt * (e.state === 'tossed' ? 22 : 8));
  e.pawK += (paw - e.pawK) * k; e.pods += (pods - e.pods) * Math.min(1, dt * 5);
  e.stunK += (stun - e.stunK) * k; e.rearK += (rear - e.rearK) * Math.min(1, dt * 6);
  syncPose(e);
}

// After an action: a queued phase change rears it up first; otherwise back to stalking.
function next(w, e) {
  if (e.rageQ) {
    e.rageQ = false; e.state = 'rage'; e.timer = S.rage;
    w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz });
    if (e.phase >= 2) spawn(w, { type: 'drone', x: 0, y: 11, z: 0 }); // the jumbotron lets loose a security drone
    return;
  }
  e.state = 'stalk'; e.timer = S.stalk[e.phase - 1] + w.rng() * 0.8;
}

function decide(w, e) {
  if (e.rageQ) { next(w, e); return; }
  const P = w.player, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz) || 1;
  const high = P.y > A.floor + S.high;
  const ahead = (dx * e.fx + dz * e.fz) / d;
  const opts = [];
  if (!high && d < S.tossRange && ahead > S.tossCone) opts.push(['toss', 6]);
  opts.push(['paw', high ? 2.5 : d > 9 ? 5 : 2]);
  if (!high && d > S.leapMin && e.last !== 'leap') opts.push(['leap', e.phase === 1 ? 1.4 : 2.4]);
  if (e.last !== 'pods') opts.push(['pods', high ? 4 : 1.4]);
  const k = pick(w, opts);
  e.last = k;
  if (k === 'toss') startToss(w, e);
  else if (k === 'paw') { e.chainLeft = S.chains[e.phase - 1]; startPaw(w, e, S.paw[e.phase - 1]); }
  else if (k === 'leap') { e.state = 'crouch'; e.timer = S.crouch[e.phase - 1]; w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); }
  else { e.state = 'pods'; e.timer = S.podTele; e.podsLeft = S.volleys[e.phase - 1] + (high ? 1 : 0); e.podT = 0; w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz }); }
}

function startPaw(w, e, t) {
  e.state = 'paw'; e.timer = t; e.locked = false; e.v = 0;
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
}

function startToss(w, e) {
  const A = w.level.arena;
  e.state = 'toss'; e.timer = S.toss[e.phase - 1]; e.v = 0;
  zone(w, e.cx + e.fx * S.tossReach, A.floor, e.cz + e.fz * S.tossReach, S.tossR, e.timer, { dmg: S.tossDmg, knock: S.tossKnock, kind: 'horn', height: S.tossHeight });
}

// How far the coming charge runs: to where you are plus the overshoot, cut short by the first solid
// (or the stands at the arena's edge) in its path. The renderer paints this lane on the deck.
function laneLength(w, e) {
  const P = w.player, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz;
  const along = Math.max(0, dx * e.fx + dz * e.fz);
  const run = clamp(along + S.overshoot, S.minRun, S.maxRun);
  let s = 0;
  for (; s < run; s += 0.5) {
    const x = e.cx + e.fx * s, z = e.cz + e.fz * s;
    if (x < A.x0 + S.margin || x > A.x1 - S.margin || z < A.z0 + S.margin || z > A.z1 - S.margin) break;
    if (solidHit(w, e, x, z)) break;
  }
  return Math.min(s, run);
}

function solidHit(w, e, x, z) {
  for (const id of e.solids) if (pushOut(w.plats[id], x, z, S.bodyR)) return true;
  return false;
}

// Did the charge just run into something? (pushes it back out of whatever it hit)
function hitSomething(w, e) {
  const A = w.level.arena;
  let hit = false;
  const x0 = A.x0 + S.margin, x1 = A.x1 - S.margin, z0 = A.z0 + S.margin, z1 = A.z1 - S.margin;
  if (e.cx < x0 || e.cx > x1 || e.cz < z0 || e.cz > z1) { e.cx = clamp(e.cx, x0, x1); e.cz = clamp(e.cz, z0, z1); hit = true; }
  for (const id of e.solids) {
    const r = pushOut(w.plats[id], e.cx, e.cz, S.bodyR);
    if (r) { e.cx += r[0] * r[2]; e.cz += r[1] * r[2]; hit = true; }
  }
  return hit;
}

function crash(w, e) {
  const A = w.level.arena;
  e.state = 'stun'; e.timer = S.stun[e.phase - 1]; e.v = 0; e.lane = 0; e.chainLeft = 0; e.crashT = 0.5; e.stunStomps = 0;
  const hx = e.cx + e.fx * S.bodyR, hz = e.cz + e.fz * S.bodyR;
  w.events.push({ type: 'bossSlam', x: hx, y: A.floor, z: hz, r: 3 });
  w.events.push({ type: 'explode', x: hx, y: A.floor + 2.2, z: hz, r: 2.2 });
}

// Caught in its path: two cells, and you're thrown clear of the lane.
function trample(w, e) {
  const P = w.player, A = w.level.arena;
  if (P.dead || P.inv > 0 || P.y > A.floor + 2.2) return;
  const dx = P.x - e.cx, dz = P.z - e.cz, rr = S.r + T.RADIUS;
  if (dx * dx + dz * dz > rr * rr) return;
  const lx = -e.fz, lz = e.fx, side = dx * lx + dz * lz >= 0 ? 1 : -1;
  if (hurtPlayer(w, S.trample, P.x - lx * side, P.z - lz * side, S.trampleKnock)) {
    P.vx += e.fx * 4; P.vz += e.fz * 4; P.vy = S.trampleToss;
    w.events.push({ type: 'bossSlam', x: P.x, y: A.floor, z: P.z, r: 2 });
  }
}

function leap(w, e) {
  const P = w.player, A = w.level.arena;
  openSpot(w, clamp(P.x + P.vx * 0.3, A.x0 + S.margin, A.x1 - S.margin), clamp(P.z + P.vz * 0.3, A.z0 + S.margin, A.z1 - S.margin), S.bodyR, _o, A.floor, A.floor + S.top);
  const dx = _o[0] - e.cx, dz = _o[1] - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  const Tf = clamp(d / 15, 0.75, 1.25);
  e.vx = dx / Tf; e.vz = dz / Tf; e.vy = 0.5 * G * Tf;
  e.state = 'leap'; e.surf = 'air';
  zone(w, _o[0], A.floor, _o[1], S.slamR, Tf, { dmg: 1, knock: 10, kind: 'slam', height: S.slamHeight });
  w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz });
}

function land(w, e) {
  const P = w.player, A = w.level.arena;
  e.cy = A.floor + e.bodyH; e.vx = e.vy = e.vz = 0; e.surf = 'floor';
  pushSolids(w, e, S.bodyR);
  w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: S.slamR });
  const dx = P.x - e.cx, dz = P.z - e.cz;
  if (dx * dx + dz * dz < S.crushR * S.crushR && P.y < e.cy + S.top * 0.5) hurtPlayer(w, 2, e.cx, e.cz, 12); // landed on you
  e.state = 'recover'; e.timer = S.recover;
}

// A stomp on its back while it's stunned: the generic stomp did 4 × 1.5; add the bonus. (The stomp
// itself happens in enemies.js after this module's update; we see it on the next step: the stomp
// count went up, the lock-on is us and you're still on the way up off the bounce.)
function stunStompBonus(w, e) {
  const n = w.stats.stomps;
  if (n === e.stompN) return;
  e.stompN = n;
  const P = w.player;
  if (P.lock !== e || P.vy < T.STOMP_BOUNCE - 2 || e.state !== 'stun') return;
  e.stunStomps++;
  e.hp -= S.stunStomp; e.flash = 0.2; w.stats.hits++;
  w.events.push({ type: 'explode', x: e.cx, y: e.cy + S.top * 0.5, z: e.cz, r: 1.6 });
  if (e.hp <= 0) down(w, e);
  else w.events.push({ type: 'hit', kind: 'boss', x: e.cx, y: e.cy + S.top * 0.5, z: e.cz });
}

function down(w, e) { if (e.state === 'dying') return; e.v = 0; e.lane = 0; stdDown(w, e); e.timer = S.dyingTime; }

export default { init, update, down, stompable, tuning: TAURUS };
