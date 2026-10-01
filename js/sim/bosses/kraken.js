// KRAKEN-OS: the tentacled sea-mech of the brine pool (OCEAN CORE's boss). Pure (no three.js, no DOM).
//
// It lives IN the pool (arena.pool = its radius, centred on the arena) and only its armoured dome
// head ever comes up, at a spot on the rim (arena.rim from the centre) or, later, in the middle.
//
//   under ──(bubbles + a red ring where it will come up)──→ rise → idle ─┬─ slam → recover ─┐
//     ↑                                                                   ├─ volleyTele → volley ┤
//     └──────────── dive ←─ (attacks used up, or a phase change) ←──────────┴─ charge → laser ───┘
//   a stomp on the dome (any time it's up) → reel (stunned, ×1.5) → dive
//
//   slam    tentacles rise out of the brine beside the deck and slam down on red rings: the first on
//           you, the rest staggered round you (2 / 3 / 4 by phase). Then it slumps (recover, ×1.5).
//   volley  water-cannon fans from its jaw (after a flare of its vents).
//   laser   the eye charges (a sight line on you), then sweeps a beam across where you stood, at
//           chest height there: jump it, or put a pump stack between you.
//   drones  from phase 2 it calls patrol drones while it's under (2, then 3 alive at most).
//   Phases by health: 1 (> 60 %), 2 (> 30 %), 3. Under water it can't be hurt (vuln 0) or touched.
import { clamp } from '../util.js';
import { raycast, groundBelow } from '../plats.js';
import { initPose, phaseTick, pick, turnTo, fan, zone, spawn, down as stdDown, dyingTick, beamHit } from './common.js';

// Every number, and why.
export const KRAKEN = {
  hp: 280, // ~42 s of blaster on the eye; it's up ~60 % of the fight, so 2.5–3.5 min with dodging.
  r: 2.6, // hit / stomp radius of the dome.
  top: 4.4, // the collision column when it's up: 3.4 m → the crown at 7.8 m (the neck below is armoured and out of reach).
  headUp: 5.6, // the dome's centre when surfaced: crown 3.8 m above the 4 m decks (a double jump onto it), jaw and eye above the deck edge.
  sink: 9, // how far down it goes to hide.
  intro: 2.0, // it rises out of the pool before the roar (as long as ARACHNE-9's).
  riseT: 0.75, diveT: 0.8, // coming up / going down.
  underT: [2.0, 1.7, 1.45], // submerged by phase: the surfacing ring is on the water all that time (≥ 1.4 s).
  idleT: [0.95, 0.75, 0.6], // a beat between attacks: the punish window to shoot the eye.
  attacks: [2, 3, 3], // attacks per surfacing.
  centre: [0, 0.25, 0.35], // chance it surfaces in the middle of the pool (out of stomp reach: use the gantry).
  slamTele: [1.25, 1.05, 0.9], // a tentacle's red ring fills this long before it lands (≥ 0.9 s: walk out of it).
  slamR: [3.0, 3.1, 3.3], slamArms: [2, 3, 4], slamGap: [0.5, 0.42, 0.34], // ring size, strikes, stagger.
  slamDmg: 1, slamKnock: 10, slamHeight: 2.6, // a jump over 2.6 m dodges it.
  recover: 1.15, // after a slam it slumps, tentacles pinned: ×1.5 damage.
  volleyTele: 0.8, // its jaw vents flare before the cannon fires.
  volleyN: [3, 5, 5], volleyArc: [0.45, 0.7, 0.85], volleyShots: [2, 2, 3], volleyGap: 0.55, boltSpeed: [14, 16, 18], // slow enough to strafe.
  charge: 1.05, // the eye's sight line tracks you this long before the beam.
  laserTime: [1.8, 2.1, 2.7], sweep: 0.55, sweepRate: [0.62, 0.72, 0.82], beamLen: 60, // phase 3 sweeps back again.
  eyeF: 3.1, eyeY: 0.3, // the eye (its lens on a housing standing out of the dome's front).
  jawF: 2.9, jawY: -1.2, // the water-cannon nozzles under it (above the deck tops, so bolts clear the rim).
  reel: 1.5, reelVuln: 1.5, // stomped: stunned (×1.5), then it dives.
  recoverVuln: 1.5,
  drones: [0, 2, 3], droneY: 11.5, // minions alive at most, by phase, and their hover height.
  turn: 2.4, // rad/s: it turns to face you.
};
const S = KRAKEN;
const ARMS = 6;

export function init(w, e, d) {
  const A = w.level.arena;
  initPose(w, e, d, { hp: S.hp, r: S.r, top: S.top, bodyH: S.headUp, intro: S.intro });
  const c = centre(A);
  e.up = 0; e.cx = d.x; e.cz = d.z; e.cy = S.headUp - S.sink;
  e.sx = d.x; e.sz = d.z; // where it is (or will come up)
  const dx = (w.level.start?.x ?? 0) - e.cx, dz = (w.level.start?.z ?? 0) - e.cz, l = Math.sqrt(dx * dx + dz * dz) || 1;
  e.fx = dx / l; e.fz = dz / l;
  e.left = S.attacks[0]; e.next = 0; e.queue = 0; e.dir = 1; e.locked = false; e.surfZ = null;
  e.cxA = c[0]; e.czA = c[1];
  e.arms = [];
  for (let i = 0; i < ARMS; i++) e.arms.push({ on: 0, bx: 0, bz: 0, tx: 0, ty: 0, tz: 0, t: 0, max: 1, hit: 0 });
  e.minions = [];
  e.noContact = true;
  e.vuln = 0;
  e.aimX = 0; e.aimY = 0; e.aimZ = 0;
  sync(e);
}

const centre = (A) => (A && A.x0 !== undefined ? [(A.x0 + A.x1) / 2, (A.z0 + A.z1) / 2] : [0, 0]);
function sync(e) { e.cy = S.headUp + (e.up - 1) * S.sink; e.x = e.cx; e.z = e.cz; e.y = e.cy - e.top / 2; }

export function update(w, e, dt) {
  const P = w.player;
  armsTick(e, dt);
  if (e.state === 'dying') { e.up = Math.max(0, e.up - dt * 0.35); sync(e); e.beam.on = e.beam.sight = false; dyingTick(w, e, dt); e.vuln = 0; return; }
  if (e.state === 'intro') {
    e.timer -= dt; e.up = clamp(1 - e.timer / S.intro, 0, 1);
    if (e.timer <= 0) { e.state = 'idle'; e.timer = S.idleT[0]; e.up = 1; w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); }
    sync(e); e.vuln = 0; e.noContact = true;
    return;
  }
  if (phaseTick(w, e)) e.left = Math.min(e.left, 0); // a phase change: it finishes what it's doing, then dives
  const ph = e.phase - 1;
  e.timer -= dt;
  e.beam.on = false; e.beam.sight = false;
  // a stomp on the dome (the contact code bounced you and locked your aim on it): it reels
  if (P.lock === e && !e.locked) { e.locked = true; if (e.up > 0.9 && e.state !== 'reel') { e.state = 'reel'; e.timer = S.reel; w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); } }
  if (P.lock !== e) e.locked = false;
  if (e.up > 0.5 && e.state !== 'dive') turnTo(e, P.x, P.z, S.turn * (e.state === 'laser' ? 0.25 : 1), dt);

  switch (e.state) {
    case 'idle':
      if (e.timer <= 0) decide(w, e);
      break;
    case 'slam': {
      e.next -= dt;
      while (e.queue > 0 && e.next <= 0) { strike(w, e, S.slamArms[ph] - e.queue); e.queue--; e.next += S.slamGap[ph]; }
      if (e.queue <= 0 && !e.arms.some((a) => a.on && a.t > 0)) { e.state = 'recover'; e.timer = S.recover; }
      break;
    }
    case 'recover': if (e.timer <= 0) after(w, e); break;
    case 'volleyTele': if (e.timer <= 0) { e.state = 'volley'; e.timer = 0; e.queue = S.volleyShots[ph]; } break;
    case 'volley':
      if (e.timer <= 0) {
        const mx = e.cx + e.fx * S.jawF, my = e.cy + S.jawY, mz = e.cz + e.fz * S.jawF; // the jaw
        fan(w, e, mx, my, mz, S.boltSpeed[ph], S.volleyN[ph], S.volleyArc[ph] * (e.queue % 2 ? 1 : 0.8));
        e.queue--; e.timer = S.volleyGap;
        if (e.queue <= 0) { e.state = 'idle'; e.timer = S.idleT[ph]; e.left--; }
      }
      break;
    case 'charge':
      e.beam.sight = true; aimEye(w, e, P.x, P.y + 1, P.z, 0);
      e.aimX = P.x; e.aimY = P.y + 1; e.aimZ = P.z;
      if (e.timer <= 0) { // lock where you stood; the beam sweeps across it
        e.state = 'laser'; e.timer = S.laserTime[ph]; e.dir = w.rng() < 0.5 ? -1 : 1; e.beam.a = -S.sweep * e.dir;
        w.events.push({ type: 'bossLaser', x: e.cx, y: e.cy, z: e.cz });
      }
      break;
    case 'laser': {
      e.beam.a += e.dir * S.sweepRate[ph] * dt;
      if (Math.abs(e.beam.a) > S.sweep) { e.beam.a = clamp(e.beam.a, -S.sweep, S.sweep); e.dir = -e.dir; } // phase 3 comes back
      e.beam.on = true;
      aimEye(w, e, e.aimX, e.aimY, e.aimZ, e.beam.a);
      beamHit(w, e);
      if (e.timer <= 0) { e.state = 'idle'; e.timer = S.idleT[ph]; e.left--; }
      break;
    }
    case 'reel': if (e.timer <= 0) startDive(w, e); break;
    case 'dive':
      e.up = Math.max(0, e.up - dt / S.diveT);
      if (e.up <= 0) startUnder(w, e);
      break;
    case 'under':
      if (e.timer <= 0) { e.state = 'rise'; e.timer = S.riseT; w.events.push({ type: 'bossLeap', x: e.cx, y: 0, z: e.cz }); }
      break;
    case 'rise':
      e.up = Math.min(1, e.up + dt / S.riseT);
      if (e.up >= 1) { e.state = 'idle'; e.timer = S.idleT[ph]; e.left = S.attacks[ph]; w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); }
      break;
    default: e.state = 'idle'; e.timer = 0.5;
  }
  e.vuln = e.up < 0.6 ? 0 : e.state === 'reel' ? S.reelVuln : e.state === 'recover' ? S.recoverVuln : 1;
  e.noContact = e.up < 0.85;
  e.crouch = e.state === 'recover' || e.state === 'reel' ? 1 : 0;
  sync(e);
}

// The next attack (or a dive when this surfacing's attacks are used up).
function decide(w, e) {
  if (e.left <= 0) { startDive(w, e); return; }
  const P = w.player, ph = e.phase - 1, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz, dist = Math.sqrt(dx * dx + dz * dz);
  const high = P.y > (A.floor ?? 4) + 4; // up on a pump stack or the gantry
  const opts = [['slam', dist < 30 ? 3 : 1.5], ['volley', 2], ['laser', high ? 3 : 2]];
  if (e.last) for (const o of opts) if (o[0] === e.last) o[1] *= 0.4; // rarely the same twice
  const k = pick(w, opts);
  e.last = k;
  if (k === 'slam') { e.state = 'slam'; e.queue = S.slamArms[ph]; e.next = 0; }
  else if (k === 'volley') { e.state = 'volleyTele'; e.timer = S.volleyTele; w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); }
  else { e.state = 'charge'; e.timer = S.charge; w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz }); }
}
function after(w, e) { e.state = 'idle'; e.timer = S.idleT[e.phase - 1]; e.left--; }

// One tentacle strike: a red ring on the deck (on you first, then round you), an arm rising out of
// the brine beside it, landing when the ring fills.
function strike(w, e, i) {
  const P = w.player, A = w.level.arena, ph = e.phase - 1;
  let tx = P.x, tz = P.z;
  if (i > 0) { // the rest: where you're heading, or a step either side of you along the ring
    const k = i % 3;
    if (k === 1) { tx = P.x + P.vx * S.slamTele[ph] * 0.8; tz = P.z + P.vz * S.slamTele[ph] * 0.8; }
    else {
      const rx = P.x - e.cxA, rz = P.z - e.czA, rl = Math.sqrt(rx * rx + rz * rz) || 1, side = (k === 2 ? 1 : -1) * (i > 2 ? 1.6 : 1);
      tx = P.x - (rz / rl) * 4.6 * side; tz = P.z + (rx / rl) * 4.6 * side;
    }
  }
  const g = groundBelow(w.plats, tx, tz, Math.max(P.y, A.floor ?? 4) + 0.5);
  const ty = g && g.h + g.oy > (A.water ?? 0) ? g.h + g.oy : (A.water ?? 0) + 0.2; // (on the brine: just above its surface)
  const Z = zone(w, tx, ty, tz, S.slamR[ph], S.slamTele[ph], { dmg: S.slamDmg, knock: S.slamKnock, kind: 'tentacle', height: S.slamHeight });
  const arm = e.arms.find((a) => !a.on) || e.arms[i % ARMS];
  // its root: in the brine at the rim nearest the target (or right under it, over the pool)
  const rx = tx - e.cxA, rz = tz - e.czA, rl = Math.sqrt(rx * rx + rz * rz) || 1, R = Math.min(rl, (A.pool ?? 14) - 1.2);
  Object.assign(arm, { on: 1, bx: e.cxA + (rx / rl) * R, bz: e.czA + (rz / rl) * R, tx, ty, tz, t: Z.max, max: Z.max, hit: 0 });
}

function armsTick(e, dt) {
  for (const a of e.arms) {
    if (!a.on) continue;
    if (a.t > 0) a.t -= dt;
    else if ((a.hit += dt) > 1.4) a.on = 0; // it lies there a moment, then slides back into the brine
  }
}

function startDive(w, e) {
  e.state = 'dive'; e.beam.on = e.beam.sight = false;
  w.events.push({ type: 'bossCeil', x: e.cx, y: e.cy, z: e.cz });
}

// Under: it moves (hidden) to its next spot, the ring goes up where it'll surface, minions come.
function startUnder(w, e) {
  const P = w.player, A = w.level.arena, ph = e.phase - 1, rim = A.rim ?? 10.5;
  e.state = 'under'; e.timer = S.underT[ph]; e.up = 0;
  if (w.rng() < S.centre[ph]) { e.sx = e.cxA; e.sz = e.czA; }
  else {
    const cur = Math.atan2(e.cz - e.czA, e.cx - e.cxA);
    let a = Math.atan2(P.z - e.czA, P.x - e.cxA) + (w.rng() - 0.5) * 1.9; // near you, never quite the same place
    let d = a - cur; d -= Math.round(d / (Math.PI * 2)) * Math.PI * 2;
    if (Math.abs(d) < 0.6) a += d < 0 ? -0.9 : 0.9;
    e.sx = e.cxA + Math.cos(a) * rim; e.sz = e.czA + Math.sin(a) * rim;
  }
  e.cx = e.sx; e.cz = e.sz;
  e.surfZ = zone(w, e.sx, (A.water ?? 0) + 0.2, e.sz, S.r + 0.6, S.underT[ph], { dmg: 1, knock: 12, kind: 'surface', height: 7 }); // (just above the brine, so its ring shows)
  // minions: top them up to this phase's count
  e.minions = e.minions.filter((m) => !m.dead);
  const want = S.drones[ph];
  for (let n = 0; e.minions.length < want && n < 2; n++) {
    const a = w.rng() * Math.PI * 2, r = 17 + w.rng() * 3;
    e.minions.push(spawn(w, { type: 'drone', x: e.cxA + Math.cos(a) * r, y: S.droneY, z: e.czA + Math.sin(a) * r }));
  }
}

// The eye's beam: from the eye toward (px, py, pz) turned by a round world Y; stopped by geometry.
function aimEye(w, e, px, py, pz, a) {
  const B = e.beam;
  B.ox = e.cx + e.fx * S.eyeF; B.oy = e.cy + S.eyeY; B.oz = e.cz + e.fz * S.eyeF;
  let dx = px - B.ox, dy = py - B.oy, dz = pz - B.oz;
  const c = Math.cos(a), s = Math.sin(a), rx = dx * c - dz * s, rz = dx * s + dz * c;
  dx = rx; dz = rz;
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  B.dx = dx / l; B.dy = dy / l; B.dz = dz / l;
  const hit = raycast(w.plats, B.ox, B.oy, B.oz, B.dx, B.dy, B.dz, S.beamLen);
  B.len = hit ? hit.t : S.beamLen;
}

export function down(w, e) {
  stdDown(w, e); // (clears the pending rings)
  for (const a of e.arms) if (a.on && a.t > 0) { a.t = 0; a.hit = 1.0; } // the arms go limp and slide back
}

export default {
  init, update, down,
  stompable: (e) => e.up > 0.9 && e.state !== 'dying' && e.state !== 'intro',
  tuning: KRAKEN,
};
