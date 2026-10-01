// CENTURION: the Colosseum's gladiator mech (NEO EURO's boss). Pure (no three.js, no DOM).
//
// An 8 m legionary with a tower shield and a gladius. While the shield is up, shots that hit its
// front below the shield's rim glance off: flank it (it turns slower than you can circle it close
// in), shoot down on it from the seats or a column, or stomp its crested helmet (big damage, and it
// reels). After every big attack it lowers the shield: that is the punish window.
//
//   guard (advance, shield up) ─┬─ sweepTele → sweep (a ring at shin height: jump it) → recover
//                               ├─ stompTele → stomp (crush under the foot + a shockwave: jump it) → recover
//                               ├─ chargeTele → charge (a straight dash; sidestep) → stagger (hit a wall) | skid → recover
//                               ├─ throwTele → throw (1–3 javelins, leading you)
//                               └─ spinTele → spin (phase 3: a whirlwind that trails blade rings) → dizzy
//   a helmet stomp → reel (shield down) → shrugTele (it heaves the shield overhead: get off its head)
//   phases by health: 1 (> 60 %), 2 (> 30 %: faster, combos, two drones join), 3 (the spin, two more drones)
import { T } from '../tuning.js';
import { clamp } from '../util.js';
import { hurtPlayer } from '../player.js';
import { initPose, introTick, phaseTick, pick, turnTo, pushSolids, openSpot, fireAt, zone, spawn, down, dyingTick, syncPose } from './common.js';

// Every number, and why it has that value. (Exported: it lands in data/tuning.json as BOSSES.centurion.)
export const tuning = {
  hp: 280, // ~42 s of blaster on target; the shield halves what lands outside the punish windows: a 2–4 min fight.
  r: 2.6, top: 8.2, bodyR: 2.4, // hit capsule (shots, contact, stomps on the crest at 8.2 m); its body for walls and columns.
  intro: 2.2, // the hold before the roar.
  margin: 6, // how far inside the arena box it walks (the podium's curve pushes it in further).
  speed: [3.4, 4.2, 5.0], // guarded advance by phase: you outrun it easily (8.5).
  turn: [1.3, 1.6, 2.0], // rad/s: circle it inside ~6 m (phase 1) or ~4 m (phase 3) and you get behind the shield.
  keep: 5.5, // it stops closing in here and pivots to face you.
  guard: [[2.0, 2.8], [1.5, 2.2], [1.1, 1.7]], // seconds of guarded advance between attacks, by phase.
  combo: [0, 0.4, 0.6], // after a punish window, the chance it chains straight into another attack.
  shieldTop: 6.2, // shots meeting it above this (helmet, shoulders) get past the shield.
  shieldCos: 0.34, // the shield covers ±70° of its front.
  dive: 0.42, // shots dropping steeper than ~25° clear the shield's rim (shoot down from the seats).
  vulnOpen: 1.5, // damage × while the shield is down (recover, stagger, dizzy, reel).
  sweep: { tele: [0.9, 0.75, 0.6], r: 7, height: 1.5, swing: 0.35, recover: [1.6, 1.4, 1.2] }, // blade at shin height: a hop clears it.
  stomp: { tele: [0.85, 0.72, 0.6], r: 11, height: 1.2, crushR: 3.4, reach: 2.6, crushDmg: 2, recover: [1.4, 1.2, 1.0] }, // step out from under the foot, hop the wave.
  charge: { tele: [1.0, 0.85, 0.7], speed: [17, 19, 21], time: 1.4, hitR: 1.2, dmg: 2, knock: 14, stagger: [2.4, 2.0, 1.7], skid: 0.6, recover: 0.9 }, // the dash locks its line at the end of the tele: sidestep; bait it into a wall for a long stagger.
  throw: { tele: [0.75, 0.62, 0.5], n: [1, 2, 3], gap: 0.3, speed: [24, 27, 30], lead: 0.55 }, // javelins lead you: change direction as it throws.
  spin: { tele: 0.9, time: 3.2, speed: 5.4, turn: 2.5, r: 5.5, every: 0.3, delay: 0.5, height: 2.0, dizzy: 2.4, cd: 9 }, // rings drop 0.5 s before they bite; it's slower than you.
  reel: 1.2, // a helmet stomp staggers it (shield down)…
  shrug: { tele: 0.6, r: 4.2, height: 5.5, knock: 12 }, // …then it heaves the shield overhead: anyone on its head is thrown off.
  helmBonus: 10, // extra damage for a helmet stomp (the stomp itself does 4): about 10 % with the follow-up shots.
  helmCD: 3.5, // the bonus comes once per this long (bouncing on it during the reel still does the plain stomp).
  minions: 2, // drones that join at each phase change.
};
const C = tuning;
const _spot = [0, 0];

function set(e, state, dur) { e.state = state; e.timer = dur; e.dur = dur; e.st = 0; }
const lerpPh = (a, e) => a[Math.min(a.length - 1, e.phase - 1)];

export function init(w, e, d) {
  initPose(w, e, d, { hp: C.hp, r: C.r, top: C.top, bodyH: C.top / 2, intro: C.intro });
  Object.assign(e, { st: 0, dur: C.intro, shield: 1, spinA: 0, spinCD: 4, helmCD: 0, stompN: w.stats.stomps, left: 0, hitP: false, dropT: 0, roarDue: false, crashed: false });
  e.fx = -1; e.fz = 0; // faces the gate you come in by (west)
  syncPose(e);
}

// Did your stomp land on its helmet last step? (contact() runs after update, so we see it now.)
function helmet(w, e, dt) {
  e.helmCD = Math.max(0, e.helmCD - dt);
  const n = w.stats.stomps;
  if (n === e.stompN) return;
  e.stompN = n;
  if (w.player.lock !== e || e.state === 'dying') return;
  if (e.helmCD <= 0) {
    e.helmCD = C.helmCD;
    e.hp -= C.helmBonus; e.flash = 0.2;
    w.events.push({ type: 'hit', kind: 'boss', x: e.cx, y: e.cy + C.top / 2, z: e.cz });
    if (e.hp <= 0) { down(w, e); return; }
  }
  if (!['reel', 'shrugTele', 'stagger', 'dizzy'].includes(e.state)) set(e, 'reel', C.reel);
}

export function update(w, e, dt) { // (updateEnemies has already advanced e.t and e.flash)
  if (e.state === 'dying') { dyingTick(w, e, dt); e.shield = Math.max(0, e.shield - dt * 2); return; }
  if (e.state === 'intro') {
    e.st += dt;
    if (introTick(w, e, dt, 'guard', 1.4)) { if (e.state !== 'intro') { e.dur = e.timer; e.st = 0; } syncPose(e); return; }
  }
  helmet(w, e, dt);
  if (e.state === 'dying') return;
  if (phaseTick(w, e)) { // reinforcements, and a roar once it's free
    for (let i = 0; i < C.minions; i++) {
      const a = w.rng() * Math.PI * 2;
      spawn(w, { type: 'drone', x: Math.cos(a) * 26, y: 10, z: Math.sin(a) * 17 });
    }
    e.roarDue = true;
  }
  const P = w.player, A = w.level.arena, ph = e.phase - 1;
  e.spinCD = Math.max(0, e.spinCD - dt);
  e.st += dt; e.timer -= dt;
  let shieldT = 1, vuln = 1;
  switch (e.state) {
    case 'guard': {
      if (e.roarDue) { e.roarDue = false; set(e, 'roar', 1.2); w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); break; }
      const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz);
      openSpot(w, P.x, P.z, C.bodyR, _spot, A.floor, A.floor + C.top);
      walk(w, e, _spot[0], _spot[1], d > C.keep ? C.speed[ph] : 0, C.turn[ph], dt, C.margin);
      if (e.timer <= 0) decide(w, e);
      break;
    }
    case 'roar': if (e.timer <= 0) set(e, 'guard', 0.6); break;
    case 'sweepTele': turnTo(e, P.x, P.z, C.turn[ph] * 0.5, dt); if (e.timer <= 0) set(e, 'sweep', C.sweep.swing); break;
    case 'sweep': shieldT = 0.4; if (e.timer <= 0) set(e, 'recover', lerpPh(C.sweep.recover, e)); break;
    case 'stompTele': if (e.timer <= 0) { set(e, 'stomp', 0.3); w.events.push({ type: 'bossSlam', x: e.cx + e.fx * C.stomp.reach, y: A.floor, z: e.cz + e.fz * C.stomp.reach, r: C.stomp.r }); } break;
    case 'stomp': if (e.timer <= 0) set(e, 'recover', lerpPh(C.stomp.recover, e)); break;
    case 'chargeTele': {
      turnTo(e, P.x, P.z, 3.2, dt);
      if (e.timer <= 0) { set(e, 'charge', C.charge.time); e.hitP = false; w.events.push({ type: 'bossLeap', x: e.cx, y: A.floor + 1, z: e.cz }); }
      break;
    }
    case 'charge': {
      const sp = lerpPh(C.charge.speed, e);
      const hit = move(w, e, e.fx * sp * dt, e.fz * sp * dt, 3);
      e.gait += sp * dt;
      if (!e.hitP) { // it runs you down
        const dx = P.x - e.cx, dz = P.z - e.cz;
        if (dx * dx + dz * dz < (C.r + C.charge.hitR) * (C.r + C.charge.hitR) && P.y < e.cy + 1) { e.hitP = true; hurtPlayer(w, C.charge.dmg, e.cx, e.cz, C.charge.knock); }
      }
      if (hit) { set(e, 'stagger', lerpPh(C.charge.stagger, e)); w.events.push({ type: 'bossSlam', x: e.cx + e.fx * 2, y: A.floor, z: e.cz + e.fz * 2, r: 4 }); }
      else if (e.timer <= 0) set(e, 'skid', C.charge.skid);
      break;
    }
    case 'skid': {
      const sp = lerpPh(C.charge.speed, e) * 0.5 * Math.max(0, 1 - e.st / e.dur);
      move(w, e, e.fx * sp * dt, e.fz * sp * dt, 3);
      if (e.timer <= 0) set(e, 'recover', C.charge.recover);
      break;
    }
    case 'throwTele': turnTo(e, P.x, P.z, C.turn[ph] * 1.5, dt); if (e.timer <= 0) { set(e, 'throw', 0.5); e.left = lerpPh(C.throw.n, e); e.dropT = 0; } break;
    case 'throw': {
      turnTo(e, P.x, P.z, C.turn[ph], dt);
      e.dropT -= dt;
      if (e.left > 0 && e.dropT <= 0) {
        e.left--; e.dropT = C.throw.gap; e.timer = Math.max(e.timer, C.throw.gap + 0.2); e.st = 0;
        const hx = e.cx - e.fz * 1.9 + e.fx * 0.8, hz = e.cz + e.fx * 1.9 + e.fz * 0.8;
        fireAt(w, e, hx, A.floor + 7.2, hz, lerpPh(C.throw.speed, e), C.throw.lead, 0.004);
      }
      if (e.left <= 0 && e.timer <= 0) next(w, e, 'guard');
      break;
    }
    case 'spinTele': shieldT = 0.3; turnTo(e, P.x, P.z, C.turn[ph], dt); if (e.timer <= 0) { set(e, 'spin', C.spin.time); e.dropT = 0; } break;
    case 'spin': {
      shieldT = 0.3;
      e.spinA += 9 * dt;
      walk(w, e, P.x, P.z, C.spin.speed, C.spin.turn, dt, C.margin);
      e.dropT -= dt;
      if (e.dropT <= 0) { e.dropT = C.spin.every; zone(w, e.cx, A.floor, e.cz, C.spin.r, C.spin.delay, { height: C.spin.height, kind: 'sweep', knock: 10 }); }
      if (e.timer <= 0) { set(e, 'dizzy', C.spin.dizzy); e.spinCD = C.spin.cd; }
      break;
    }
    case 'recover': case 'stagger': case 'dizzy':
      shieldT = 0; vuln = C.vulnOpen;
      if (e.timer <= 0) next(w, e, 'combo');
      break;
    case 'reel': {
      shieldT = 0; vuln = C.vulnOpen;
      move(w, e, -e.fx * 1.4 * dt, -e.fz * 1.4 * dt, C.margin); // staggers back a step
      if (e.timer <= 0) { set(e, 'shrugTele', C.shrug.tele); w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); zone(w, e.cx, A.floor + C.top - 2, e.cz, C.shrug.r, C.shrug.tele, { height: C.shrug.height, knock: C.shrug.knock, kind: 'shrug' }); }
      break;
    }
    case 'shrugTele': shieldT = 0.2; if (e.timer <= 0) set(e, 'guard', 0.9); break;
    default: set(e, 'guard', 1);
  }
  e.shield += (shieldT - e.shield) * Math.min(1, dt * 7);
  e.vuln = vuln;
  syncPose(e);
}

// Walk toward (tx, tz): turn at `rate`, step forward only as far as it's facing the way (no
// sideways skating), kept inside the arena and out of the columns, ruins and seats.
function walk(w, e, tx, tz, speed, rate, dt, margin) {
  turnTo(e, tx, tz, rate, dt);
  if (speed <= 0) return;
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1.2) return;
  const k = Math.max(0, (e.fx * dx + e.fz * dz) / d);
  const s = speed * (0.35 + 0.65 * k) * dt;
  move(w, e, e.fx * s, e.fz * s, margin, dx / d, dz / d);
  e.gait += s;
}
// Move by (mx, mz); returns true when a wall, a column or the seats stopped it.
function move(w, e, mx, mz, margin, gx = 0, gz = 0) {
  const A = w.level.arena;
  const wx = e.cx + mx, wz = e.cz + mz;
  e.cx = clamp(wx, A.x0 + margin, A.x1 - margin); e.cz = clamp(wz, A.z0 + margin, A.z1 - margin);
  pushSolids(w, e, C.bodyR, gx, gz, (gx || gz) ? Math.sqrt(mx * mx + mz * mz) * 0.7 : 0);
  const ox = e.cx - wx, oz = e.cz - wz;
  return ox * ox + oz * oz > 0.0025;
}

// After a punish window: maybe chain straight into another attack (phases 2–3), else guard.
function next(w, e, why) {
  if (why === 'combo' && w.rng() < C.combo[e.phase - 1]) { decide(w, e); return; }
  const g = C.guard[e.phase - 1];
  set(e, 'guard', g[0] + w.rng() * (g[1] - g[0]));
}

function decide(w, e) {
  const P = w.player, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  const high = P.y > A.floor + 3; // up on the seats, a column or the emperor's box: out of the blade's reach
  const opts = [];
  if (!high && d < 9) opts.push(['sweep', 4]);
  if (!high && d < 13) opts.push(['stomp', 3]);
  if (d > 8) opts.push(['charge', high ? 1.5 : 2.5]);
  if (d > 6 || high) opts.push(['throw', high ? 4 : 2]);
  if (e.phase === 3 && e.spinCD <= 0 && !high) opts.push(['spin', 3]);
  if (!opts.length) opts.push(['throw', 1]);
  attack(w, e, pick(w, opts));
}

function attack(w, e, kind) {
  const A = w.level.arena, f = A.floor;
  const tele = (a) => lerpPh(a, e);
  if (kind === 'sweep') {
    const t = tele(C.sweep.tele);
    set(e, 'sweepTele', t);
    zone(w, e.cx, f, e.cz, C.sweep.r, t, { height: C.sweep.height, kind: 'sweep', knock: 10 });
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'stomp') {
    const t = tele(C.stomp.tele);
    set(e, 'stompTele', t);
    zone(w, e.cx + e.fx * C.stomp.reach, f, e.cz + e.fz * C.stomp.reach, C.stomp.crushR, t, { height: 3, dmg: C.stomp.crushDmg, knock: 12, kind: 'crush' });
    zone(w, e.cx, f, e.cz, C.stomp.r, t, { height: C.stomp.height, kind: 'wave' });
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'charge') {
    set(e, 'chargeTele', tele(C.charge.tele));
    w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'throw') {
    set(e, 'throwTele', tele(C.throw.tele));
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'spin') {
    set(e, 'spinTele', C.spin.tele);
    zone(w, e.cx, f, e.cz, C.spin.r, C.spin.tele, { height: C.spin.height, kind: 'sweep', knock: 10 });
    w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
  }
}

// The shield: shots into its front below the rim glance off while it's raised.
export function blocks(w, e, s) {
  if (e.shield < 0.6) return false;
  const sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz) || 1;
  if (-s.vy / sp > C.dive) return false; // plunging fire clears the rim
  if (s.y + s.vy * T.DT * 0.5 > e.y + C.shieldTop) return false; // over the shield: the helmet's exposed
  const hs = Math.sqrt(s.vx * s.vx + s.vz * s.vz) || 1;
  return -(s.vx * e.fx + s.vz * e.fz) / hs > C.shieldCos; // coming at its front
}

// You can bounce off its crest unless the blades are spinning or it's heaving the shield overhead.
export const stompable = (e) => e.state !== 'intro' && e.state !== 'dying' && e.state !== 'spin' && e.state !== 'spinTele' && e.state !== 'shrugTele';

export default { init, update, down, stompable, blocks, tuning };
