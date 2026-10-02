// The regular enemies' views: build a model (enemy-models.js) and pose it every frame from the sim
// (read-only). States read at a glance:
//   eyes / visors   amber while it hasn't seen you, red once it has, a white-hot strobe while it
//                   telegraphs (drone wind-up, guard / turret aim)
//   drone           bobs (sim), banks into its drift and turns, nacelles vector, the lens tracks you;
//                   winding up it rears back while a charge gathers in front of the lens
//   walker/spiker   a trotting four-leg gait with a body bob, faster when it chases; the spiker's
//                   crown spins (faster when it chases)
//   guard           idle sway at low-ready, raises the carbine to aim (laser sight), kicks per round,
//                   the coat swings with turns and rides
//   turret          the head sweeps while idle, snaps to track you, barrels pitch and recoil in turn
//   all             hit: a white flash and a shove away from you; death: pieces (fx-enemy.js)
import * as THREE from 'three';
import { droneModel, walkerModel, spikerModel, guardModel, turretModel, ENEMY_SHARED, GUARD, TURRET, EC } from './enemy-models.js';
import { serverModel } from './models.js';
import { ENEMIES } from '../sim/tuning.js';

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _d = new THREE.Vector3(), _col = new THREE.Color();
const NIGHT_RIM = new THREE.Color(0x9a7aff);
const AMBER = new THREE.Color(0xffa21a), RED = new THREE.Color(0xff1f3a), WHITE = new THREE.Color(0xffffff), PINK = new THREE.Color(0xff2a7a);
// Eye palettes [unaware, alert]: shooters go amber → red; walkers stay warm (safe to stomp: never
// red); spikers are red whatever they do.
const EYES = { walker: [AMBER, new THREE.Color(0xffe060)], spiker: [new THREE.Color(0xff3a2a), new THREE.Color(0xff1030)] };
const EYES_DEFAULT = [AMBER, RED];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

// Build (and remember the theme for) one regular enemy's view.
export function makeEnemyModel(R, e) {
  const M = R.M, t = e.type;
  const g = t === 'drone' ? droneModel(M) : t === 'walker' ? walkerModel(M) : t === 'spiker' ? spikerModel(M) : t === 'guard' ? guardModel(M, e.id) : t === 'turret' ? turretModel(M) : serverModel(M);
  if (g.userData.mat) {
    g.userData.a = { init: false, px: 0, py: 0, pz: 0, pyaw: 0, vx: 0, vy: 0, vz: 0, yawRate: 0, lastFlash: 0, kick: 0, kx: 0, kz: 1, alert: 0, fire: 0, lastState: '', lastBurst: 0,
      bank: 0, pitch: 0, eyeYaw: 0, eyePitch: 0, phase: e.id * 1.3, aim: 0, recoil: 0, cx: 0, cvx: 0, cz: 0, cvz: 0, headYaw: e.yaw, gunPitch: 0, rec: [0, 0], nb: 0, baseYaw: e.yaw, seed: (e.id * 0.618) % 1 * 6.283 };
  }
  if (R.theme) setEnemyTheme(R.theme);
  return g;
}

// Per stage: the rim light that lifts silhouettes out of the dark (strong at night, a faint sky
// sheen by day).
export function setEnemyTheme(th) {
  const n = th.night || 0;
  ENEMY_SHARED.uRim.value.set(th.skyBot || '#808080').lerp(NIGHT_RIM, 0.6 * n).multiplyScalar(0.16 + 0.8 * n);
  ENEMY_SHARED.uFar.value = 0.55 * n;
}

// The alert colour: amber → red as it notices you; a strobe toward white while it telegraphs.
function eyeColor(out, a, tele, t, R, type) {
  const P = EYES[type] || EYES_DEFAULT;
  out.copy(P[0]).lerp(P[1], a.alert);
  if (tele > 0) {
    const s = R.flashK < 1 ? 0.55 : 0.5 + 0.5 * Math.sin(t * (28 + 40 * tele));
    out.lerp(WHITE, tele * (0.35 + 0.6 * s));
  }
  return out;
}

export function poseEnemy(R, e, g, dt, t, w) {
  const D = g.userData, a = D.a, P = w.player, efx = R.fx.enemy;
  if (!a) return poseServer(R, e, g, t);
  if (e.dead) { // the kill event normally shatters it first (it knows about stomps)
    if (g.visible && e.deadT < 0.5) efx.shatter(e, g, false, w);
    g.visible = false;
    return;
  }
  g.visible = true;
  // motion estimates (drift, deck rides, turning) for banking and the coat
  const idt = dt > 1e-4 ? 1 / dt : 0, ease = Math.min(1, dt * 8);
  if (!a.init) { a.init = true; a.px = e.x; a.py = e.y; a.pz = e.z; a.pyaw = e.yaw; }
  a.vx += (clamp((e.x - a.px) * idt, -12, 12) - a.vx) * ease; a.vy += (clamp((e.y - a.py) * idt, -12, 12) - a.vy) * ease; a.vz += (clamp((e.z - a.pz) * idt, -12, 12) - a.vz) * ease;
  a.yawRate += (clamp(wrap(e.yaw - a.pyaw) * idt, -8, 8) - a.yawRate) * ease;
  a.px = e.x; a.py = e.y; a.pz = e.z; a.pyaw = e.yaw;
  // hit: a shove away from you
  if (e.flash > a.lastFlash + 0.01) {
    a.kick = 1;
    const dx = e.x - P.x, dz = e.z - P.z, l = Math.sqrt(dx * dx + dz * dz) || 1;
    a.kx = dx / l; a.kz = dz / l;
  }
  a.lastFlash = e.flash;
  a.kick = Math.max(0, a.kick - dt * 5);
  const kick = a.kick * a.kick;
  const alert = e.seen || e.state === 'chase' || e.state === 'tele' || e.state === 'aim' || e.state === 'burst';
  a.alert += ((alert ? 1 : 0) - a.alert) * Math.min(1, dt * (alert ? 10 : 1.5));
  const u = D.mat.userData.u;
  u.uFlash.value = clamp(e.flash / 0.12, 0, 1) * (R.flashK < 1 ? 0.55 : 0.92);
  const push = kick * (e.type === 'turret' ? 0.06 : 0.22);
  g.position.set(e.x + a.kx * push, e.y, e.z + a.kz * push);
  g.rotation.y = e.yaw;
  const sin = Math.sin(e.yaw), cos = Math.cos(e.yaw);
  const fwd = -(a.vx * sin + a.vz * cos), side = a.vx * cos - a.vz * sin; // local velocity
  if (e.type === 'drone') poseDrone(R, e, g, a, u, dt, t, P, efx, kick, fwd, side);
  else if (e.type === 'walker' || e.type === 'spiker') poseCrawler(R, e, g, a, u, dt, t, efx, kick);
  else if (e.type === 'guard') poseGuard(R, e, g, a, u, dt, t, efx, kick, fwd, side);
  else if (e.type === 'turret') poseTurret(R, e, g, a, u, dt, t, efx, kick);
  a.lastState = e.state;
}

// ------------------------------------------------------------------ drone
function poseDrone(R, e, g, a, u, dt, t, P, efx, kick, fwd, side) {
  const S = ENEMIES.drone, { body, pods, eye } = parts(g);
  const tele = e.state === 'tele' ? clamp(1 - e.timer / S.tele, 0, 1) : 0;
  if (a.lastState === 'tele' && e.state === 'idle' && e.timer > 1.2) { a.fire = 1; } // it fired
  a.fire = Math.max(0, a.fire - dt * 4);
  // bank into the drift and the turn, pitch with speed; rear back while winding up, kick on firing
  const ease = Math.min(1, dt * 5);
  a.bank += (clamp(-side * 0.14 - a.yawRate * 0.3, -0.5, 0.5) - a.bank) * ease;
  a.pitch += (clamp(-fwd * 0.1, -0.35, 0.35) + tele * 0.32 - a.fire * 0.3 - (1 - a.alert) * 0.12 - a.pitch) * ease;
  const wob = Math.sin(t * 2.3 + a.seed) * 0.05, wob2 = Math.sin(t * 1.7 + a.seed * 2) * 0.04;
  body.rotation.set(a.pitch + wob2 - kick * 0.5, 0, a.bank + wob + kick * a.kx * 0.4, 'XYZ');
  body.position.set(0, Math.sin(t * 9 + a.seed) * 0.015 * tele, a.fire * 0.12 + tele * 0.06);
  // nacelles vector against the drift (and brace while charging)
  pods.rotation.x = clamp(fwd * 0.12, -0.45, 0.45) - tele * 0.35 + Math.sin(t * 3.1 + a.seed) * 0.05;
  g.updateMatrixWorld(true);
  // the lens: tracks your eye when it has seen you, scans when it hasn't
  let ty = Math.sin(t * 0.9 + a.seed) * 0.6, tp = -0.18 + Math.sin(t * 0.6 + a.seed) * 0.1;
  if (a.alert > 0.3) {
    _v.set(P.x, P.y + 1.5, P.z);
    body.worldToLocal(_v).sub(eye.position);
    ty = clamp(Math.atan2(-_v.x, -_v.z), -0.7, 0.7);
    tp = clamp(Math.atan2(_v.y, Math.sqrt(_v.x * _v.x + _v.z * _v.z)), -0.7, 0.6);
  }
  const ee = Math.min(1, dt * (a.alert > 0.3 ? 12 : 3));
  a.eyeYaw += (ty - a.eyeYaw) * ee; a.eyePitch += (tp - a.eyePitch) * ee;
  eye.rotation.set(a.eyePitch, a.eyeYaw, 0, 'YXZ');
  eye.updateMatrixWorld();
  const col = eyeColor(u.uEye.value, a, tele, t, R, e.type);
  // sprites: the lens glow, the charge (an orb gathering in front of the lens, a ring closing on it),
  // and the thrusters
  eye.localToWorld(_v.set(0, 0, -0.1));
  efx.halo(_v.x, _v.y, _v.z, 0.7 + tele * 0.9, col, 0.55 + 0.45 * a.alert + tele);
  if (tele > 0) {
    eye.localToWorld(_v.set(0, 0, -0.32 - tele * 0.1));
    efx.halo(_v.x, _v.y, _v.z, 0.25 + tele * 1.1, PINK, 0.6 + tele * 0.8, 0.1);
    efx.halo(_v.x, _v.y, _v.z, 0.12 + tele * 0.4, WHITE, tele, 0.12);
    efx.ring(_v.x, _v.y, _v.z, 0.35 + (1 - tele) * 2.4, PINK, tele * 1.2);
  }
  const jets = g.userData.jets, boost = 0.15 * Math.min(1, Math.sqrt(a.vx * a.vx + a.vz * a.vz) / 3);
  _d.set(0, -1, 0).transformDirection(pods.matrixWorld);
  for (let i = 0; i < jets.length; i++) {
    const j = jets[i];
    pods.localToWorld(_v.set(j[0], j[1], j[2]));
    const fl = 0.85 + 0.15 * Math.sin(t * 47 + i * 2.1 + a.seed);
    efx.jet(_v.x, _v.y, _v.z, _d.x, _d.y, _d.z, (0.42 + boost + tele * 0.2) * fl, 0.1, 0xff6ad0, 0.9);
    efx.halo(_v.x + _d.x * 0.12, _v.y + _d.y * 0.12, _v.z + _d.z * 0.12, 0.6, 0xff4ab8, 0.5 + 0.2 * fl, 0.15);
  }
}

// ------------------------------------------------------------------ walker / spiker
function poseCrawler(R, e, g, a, u, dt, t, efx, kick) {
  const { body, legs, crown } = parts(g), run = e.state === 'chase';
  a.phase += dt * (run ? 15 : 9.5);
  const ph = a.phase;
  body.position.y = 0.035 * (1 - Math.cos(ph * 2)) * 0.5 + kick * 0.12;
  body.rotation.set((run ? -0.08 : -0.02) - kick * 0.35, 0, Math.sin(ph) * 0.04 + kick * 0.2 * a.kx);
  for (let i = 0; i < 4; i++) {
    const L = legs[i], ld = L.userData;
    const f = ph + (i % 2 ? Math.PI : 0); // diagonal pairs: FR + BL, FL + BR
    L.rotation.y = ld.yaw + ld.side * Math.sin(f) * (run ? 0.38 : 0.3);
    L.rotation.z = Math.max(0, Math.cos(f)) * (run ? 0.42 : 0.3) + kick * 0.2;
  }
  if (crown) crown.rotation.y += dt * (run ? 10 : 2.4);
  g.updateMatrixWorld(true);
  const col = eyeColor(u.uEye.value, a, 0, t, R, e.type);
  body.localToWorld(_v.set(0, 0.67, -0.64));
  efx.halo(_v.x, _v.y, _v.z, 0.6, col, 0.4 + 0.35 * a.alert, 0.2);
  if (crown) { crown.localToWorld(_v.set(0, 0.55, 0)); efx.halo(_v.x, _v.y, _v.z, 0.7, EC.red, 0.35 + 0.25 * Math.sin(t * 6 + a.seed), 0.1); }
  else { body.localToWorld(_v.set(0, 1.06, 0)); efx.halo(_v.x, _v.y, _v.z, 0.9, EC.amber, 0.22 * (0.4 + 0.6 * ((R.theme && R.theme.night) || 0)), 0.05, 0.012); }
}

// ------------------------------------------------------------------ guard
function poseGuard(R, e, g, a, u, dt, t, efx, kick, fwd, side) {
  const S = ENEMIES.guard, { body, coat, arms } = parts(g);
  const aiming = e.state === 'aim', firing = e.state === 'burst';
  const tele = aiming ? clamp(1 - e.timer / S.aim, 0, 1) : 0;
  // shots: the burst counter drops once per round
  let shot = false;
  if (e.burst < a.lastBurst) shot = true;
  a.lastBurst = e.burst;
  if (shot) a.recoil = 1;
  a.recoil = Math.max(0, a.recoil - dt * 9);
  const want = aiming || firing ? 1 : e.state === 'cool' ? 0.45 : 0;
  a.aim += (want - a.aim) * Math.min(1, dt * (want > a.aim ? 10 : 2.2));
  // body: weight shift and breathing at ease, leaning into the aim, rocked by hits
  const ease = 1 - a.aim;
  body.rotation.set(-0.06 * a.aim + Math.sin(t * 1.2 + a.seed) * 0.012 * ease + kick * 0.3 + a.recoil * 0.03, Math.sin(t * 0.5 + a.seed) * 0.06 * ease, Math.sin(t * 0.9 + a.seed) * 0.02 * ease + kick * 0.15 * a.kx);
  // arms: low-ready (barrel down) → level, kicked up by each round
  arms.rotation.set(-0.62 * ease + a.recoil * 0.22 + Math.sin(t * 1.4 + a.seed) * 0.02 * ease - kick * 0.2, 0.12 * ease, 0);
  arms.position.z = a.recoil * 0.07;
  // the coat: a damped pendulum driven by the guard's own motion (deck rides, turning) plus a flutter
  const tx = clamp(fwd * 0.06, -0.35, 0.35) - kick * 0.25, tz = clamp(side * 0.06 + a.yawRate * 0.1, -0.35, 0.35);
  a.cvx += ((tx - a.cx) * 70 - a.cvx * 6) * dt; a.cx += a.cvx * dt;
  a.cvz += ((tz - a.cz) * 70 - a.cvz * 6) * dt; a.cz += a.cvz * dt;
  coat.rotation.set(a.cx + Math.sin(t * 2.3 + a.seed) * 0.025 + a.recoil * 0.03, 0, a.cz + Math.sin(t * 1.9 + a.seed * 1.7) * 0.018);
  g.updateMatrixWorld(true);
  const col = eyeColor(u.uEye.value, a, tele, t, R, e.type);
  // visor glow, the sight (aim: brighter and hotter as the shot nears), muzzle flashes
  body.localToWorld(_v.set(0, 1.765, -0.2));
  efx.halo(_v.x, _v.y, _v.z, 0.6 + tele * 0.4, col, 0.45 + 0.45 * a.alert + tele * 0.6, 0.15);
  arms.localToWorld(_w.set(GUARD.muzzle[0], GUARD.muzzle[1], GUARD.muzzle[2]));
  if (aiming) {
    const k = R.flashK < 1 ? 0.6 : 0.65 + 0.35 * Math.sin(t * (24 + 40 * tele));
    efx.sight(_w.x, _w.y, _w.z, e.aimX, e.aimY, e.aimZ, tele * k);
    efx.halo(_w.x, _w.y, _w.z, 0.45 + tele * 0.9, RED, 0.6 + 0.6 * tele * k, 0.1);
  }
  if (shot) efx.muzzle(_w.x, _w.y, _w.z);
}

// ------------------------------------------------------------------ turret
function poseTurret(R, e, g, a, u, dt, t, efx, kick) {
  const S = ENEMIES.turret, { head, gun, barrels } = parts(g);
  const aiming = e.state === 'aim', tele = aiming ? clamp(1 - e.timer / S.aim, 0, 1) : 0;
  g.position.set(e.x, e.y, e.z); // bolted down: hits jolt the head, not the base
  g.rotation.y = a.baseYaw;
  // head: sweeps while it hasn't seen you, snaps round to track you once it has
  const tracking = a.alert > 0.5 || e.state !== 'idle';
  const target = tracking ? e.yaw : a.baseYaw + Math.sin(t * 0.55 + a.seed) * 0.8;
  a.headYaw += clamp(wrap(target - a.headYaw), -dt * (tracking ? 7 : 1.2), dt * (tracking ? 7 : 1.2));
  head.rotation.set(-kick * 0.25, wrap(a.headYaw - a.baseYaw), kick * 0.2 * a.kx);
  // barrels: pitch toward you (a slow nod while sweeping), recoil in turn per round
  let pt = -0.06 + Math.sin(t * 0.8 + a.seed) * 0.06;
  if (tracking) { const dx = e.aimX - e.x, dz = e.aimZ - e.z; pt = clamp(Math.atan2(e.aimY - (e.y + TURRET.headY + TURRET.gunY), Math.sqrt(dx * dx + dz * dz)), -0.5, 0.75); }
  a.gunPitch += (pt - a.gunPitch) * Math.min(1, dt * 6);
  gun.rotation.x = a.gunPitch;
  let shot = -1;
  if (e.burst < a.lastBurst) { shot = a.nb; a.rec[a.nb] = 1; a.nb ^= 1; }
  a.lastBurst = e.burst;
  for (let i = 0; i < 2; i++) { a.rec[i] = Math.max(0, a.rec[i] - dt * 7); barrels[i].position.z = a.rec[i] * a.rec[i] * 0.24; }
  g.updateMatrixWorld(true);
  const col = eyeColor(u.uEye.value, a, tele, t, R, e.type);
  head.localToWorld(_v.set(0, 0.44, -0.42));
  efx.halo(_v.x, _v.y, _v.z, 0.75 + tele * 0.5, col, 0.45 + 0.45 * a.alert + tele * 0.6, 0.15);
  if (aiming) {
    gun.localToWorld(_w.set(0, 0, TURRET.muzzleZ - 0.06));
    const k = R.flashK < 1 ? 0.6 : 0.65 + 0.35 * Math.sin(t * (24 + 40 * tele));
    efx.sight(_w.x, _w.y, _w.z, e.aimX, e.aimY, e.aimZ, tele * k);
    efx.halo(_w.x, _w.y, _w.z, 0.5 + tele * 1.0, RED, 0.6 + 0.6 * tele * k, 0.1);
  }
  if (shot >= 0) { barrels[shot].localToWorld(_w.set(0, 0, TURRET.muzzleZ - 0.08)); efx.muzzle(_w.x, _w.y, _w.z); }
}

// ------------------------------------------------------------------ the bonus-stage server rack
function poseServer(R, e, g, t) {
  if (e.dead) { g.visible = false; return; }
  g.visible = true;
  g.position.set(e.x, e.y, e.z); g.rotation.y = e.yaw;
  R.flashModel(g, e.flash > 0);
  const eye = g.getObjectByName('eye');
  if (eye) eye.visible = Math.sin(t * 8 + e.id) > -0.3;
}

const parts = (g) => g.userData.parts;
