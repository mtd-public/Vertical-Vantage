// JADE DRAGON: the boss of the Pearl Tower (pack SHANGHAI). Pure (no three.js, no DOM).
//
// A serpentine mech-dragon flying round the Oriental Pearl's spire. Its HEAD is the boss entity
// (w.boss: the gauge and the weak point you shoot and stomp). Its BODY is a chain of segment
// entities (type 'boss', kind 'dragon', seg = 1..N, spawned by the head's init) that follow the
// head's flight path: the head lays a trail of points behind it at a fixed spacing, and every
// segment sits on that trail, so the body always goes exactly where the head has been.
// Segments are armour (vuln 0): shots glance off, a stomp only bounces you (with your air jumps
// back, so you can run up its back) and swings your aim onto the head; touching one from the
// side hurts.
//
//   intro → fly: round the tower on a smooth looping path, outside the ring of pads
//     ├─ breathTele (hovers off the deck, its mouth glows, a sight line on you)
//     │    → breath (a fire sweep across where you stood: jump it, or hide behind a column) → fly
//     ├─ diveTele (rears up over the deck you're on; the impact ring fills) → dive (it crashes in)
//     │    → stunned (lies on the deck: ×1.5 damage, its head is stompable)
//     │    → recoil (backs out the way it came, along its own body) → fly
//     │    (phase 3: sometimes a second dive straight after a short stun)
//     └─ (phase 2+, while flying) a pearl volley: the mouth flares, then a fan of pearl bolts
//   phases by health: 1 (> 60 %), 2 (> 30 %: faster, pearl volleys, two drones), 3 (frantic, double
//   dives, two volleys at a time, two more drones). It only dives at low decks (the main deck, the
//   pads): up on the spire's rings or the high perches it breathes and spits pearls instead.
import { clamp } from '../util.js';
import { groundBelow, inside } from '../plats.js';
import { phaseTick, pick, fan, zone, spawn, down as downStd, dyingTick, aimBeam, beamHit, sees } from './common.js';

// Every number, and why (exported to data/tuning.json as BOSSES.dragon).
export const DRAGON = {
  hp: 300, // ~45 s of blaster on target: most of it lands while it's stunned on the deck (×1.5) or hovering to breathe.
  headR: 1.9, headTop: 2.6, // the head's hit capsule: snout to horns is ~4 m, so a generous target.
  restH: 1.2, // the head's centre above the deck when it lies stunned (its crown is ~2.5 m up: a stomp lands there).
  segs: 16, gap: 2.1, // body segments and their spacing along the trail: a 34 m serpent.
  segR: [1.45, 0.6], // segment radius at the neck → at the tail (also the contact / shot radius).
  intro: 3.0, // it circles the tower while the stage name shows, then roars.
  orbitR: 31, orbitRa: 2.5, // the flight path: 28.5–33.5 m from the tower axis. The pads end at 25.4 m, so a
  //                            passing body never clips someone standing on one (contact reach is ≤ 1.9 m).
  orbitY: 11, orbitYa: 5, // 6–16 m above the deck: above the low pads, under the spire's rings.
  lead: 0.42, // it steers at a point this far (radians) ahead on the loop: smooth arcs, no corners.
  highY: 19, // coming back out from a dive it keeps this high until it's past the pads (the perches top out at 11.2 m with you on one).
  speed: [10, 12, 13.5], // m/s by phase (you run 8.5: it's faster, but it has to go the long way round).
  steer: 2.6, // velocity blend (1/s): how tightly it turns. Lower = lazier, wider curves.
  flyTime: [[3.0, 4.6], [2.4, 3.8], [1.8, 3.0]], // seconds of flight between attacks, by phase.
  breathTele: [1.1, 0.9, 0.75], // the mouth glows and a sight line tracks you this long (≥ 0.5 s, always).
  breathTime: [1.8, 2.0, 2.3], sweep: [0.55, 0.65, 0.75], // then the fire sweeps ±sweep rad across where you stood.
  hoverR: 29, hoverY: [8, 17], // where it hovers to breathe: off the deck, outside the pads, 7 m above you.
  hoverAhead: 9, // …that far ahead on its loop: about its stopping distance, so it glides in without backing up.
  diveTele: [1.0, 0.85, 0.7], diveTime: [0.45, 0.42, 0.4], // rear-up, then the plunge: the ring fills for their sum (≥ 1.1 s).
  diveR: 5.5, // the impact ring's radius: you clear it in ~0.6 s from its middle.
  diveUp: 18, diveOut: 9, // the rear-up point: this far above the target and out from the tower (so it never crosses the spire).
  diveMinR: 5.6, // it won't crash closer than this to the tower axis (the columns stand at 1.3–3.9 m).
  diveMaxH: 6, // it only dives at decks up to this high (the deck, the pads); higher up it breathes instead.
  stun: [2.8, 2.4, 2.0], stun2: 1.1, // the punish window after a crash (×1.5 damage, stompable); the short one before a 2nd dive.
  recoil2: 8, recoilSpeed: 15, // it backs out along its own body (all the way up the plunge; 8 m before a 2nd dive), this fast: it never sweeps new space.
  diveSide: 1.35, divePend: 4.5, // it only dives at you within this angle (rad) of its side of the tower (never rearing up across the
  //                                 spire): a dive it wants waits up to divePend s of flight for that, then it breathes instead.
  orbTele: [0, 0.65, 0.55], orbs: [0, 5, 7], orbArc: [0, 0.8, 1.0], orbSpeed: 15, orbEvery: [4.5, 6.5], // pearl volleys (phase 2+).
  minions: [0, 2, 2], // drones it calls in when a phase starts.
  rageTime: 1.6, // the phase-change flourish: it climbs and roars, then breathes.
  dyingTime: 2.6, // it spirals down onto the deck in flames.
};

const _o = [0, 0, 0];

// ------------------------------------------------------------------ setup
export function init(w, e, d) {
  if (d.seg) { initSeg(e, d); return; }
  const A = w.level.arena, D = DRAGON;
  e.ox = d.cx ?? 0; e.oz = d.cz ?? 0; e.oy = A ? A.floor : 0; // the tower axis and the deck height
  e.ph1 = 0.7; e.ph2 = 1.9; e.dir = 1; // the loop's shape and which way round it flies
  e.th = Math.atan2(d.z - e.oz, d.x - e.ox);
  orbitAt(e, e.th, _o);
  Object.assign(e, {
    hp: D.hp, maxHp: D.hp, r: D.headR, top: D.headTop, bodyH: D.restH,
    cx: _o[0], cy: _o[1], cz: _o[2], nx: 0, ny: 1, nz: 0, surf: 'air',
    fx: -Math.sin(e.th), fz: Math.cos(e.th), fp: 0,
    state: 'intro', timer: D.intro, phase: 1, lastPhase: 1, vuln: 1, crouch: 0, boomT: 0,
    beam: { on: false, sight: false, dx: 0, dy: 0, dz: 0, len: 0, ox: 0, oy: 0, oz: 0, a: 0, rate: 0 },
    orbT: D.orbEvery[0], orbN: 0, orbTele: 0, // pearl volleys
    lastAtk: '', lastN: 0, second: false, again: false, rageQ: false, pend: 0, diveLen: 0, // attack bookkeeping
    tA: 0, tB: 0, // telegraph / attack lengths of the current move (render reads them)
    p0: [0, 0, 0], p1: [0, 0, 0], p2: [0, 0, 0], p3: [0, 0, 0], hover: [0, 0, 0], aim: [0, 0, 0], recoilLeft: 0,
  });
  e.vx = e.fx * 6; e.vy = 0; e.vz = e.fz * 6;
  // the trail, laid back along the loop at exactly `gap` apart: point 0 is the newest (where the head is now)
  const n = D.segs + 2;
  e.tx = new Array(n); e.ty = new Array(n); e.tz = new Array(n);
  e.tx[0] = e.cx; e.ty[0] = e.cy; e.tz[0] = e.cz;
  let th = e.th;
  for (let i = 1; i < n; i++) {
    for (let guard = 0; guard < 4000; guard++) {
      th -= e.dir * 0.0005;
      orbitAt(e, th, _o);
      const dx = _o[0] - e.tx[i - 1], dy = _o[1] - e.ty[i - 1], dz = _o[2] - e.tz[i - 1];
      if (dx * dx + dy * dy + dz * dz >= D.gap * D.gap) break;
    }
    e.tx[i] = _o[0]; e.ty[i] = _o[1]; e.tz[i] = _o[2];
  }
  e.segs = [];
  for (let k = 1; k <= D.segs; k++) { const s = spawn(w, { type: 'boss', kind: 'dragon', seg: k, x: e.cx, y: e.cy, z: e.cz }); s.head = e; e.segs.push(s); }
  placeSegs(e);
  sync(e);
}

function initSeg(e, d) {
  const D = DRAGON, k = d.seg, f = (k - 1) / Math.max(1, D.segs - 1);
  const r = D.segR[0] + (D.segR[1] - D.segR[0]) * f;
  Object.assign(e, {
    seg: k, head: null, hp: 1, maxHp: 1, r, top: 2 * r, rr: r, vuln: 0, // armour: shots glance off, stomps just bounce
    cx: d.x, cy: d.y, cz: d.z, hx: 0, hy: 0, hz: -1, nx: 0, ny: 1, nz: 0, surf: 'air',
    state: 'intro', timer: 0, phase: 1, crouch: 0,
  });
  e.x = e.cx; e.z = e.cz; e.y = e.cy - r;
}

// The loop round the tower at angle th: radius and height breathe as it goes round.
function orbitAt(e, th, out) {
  const D = DRAGON, r = D.orbitR + D.orbitRa * Math.sin(2 * th + e.ph1);
  out[0] = e.ox + Math.cos(th) * r; out[1] = e.oy + D.orbitY + D.orbitYa * Math.sin(3 * th + e.ph2); out[2] = e.oz + Math.sin(th) * r;
  return out;
}

// ------------------------------------------------------------------ the step
export function update(w, e, dt) {
  if (e.seg) { segTick(e); return; }
  const P = w.player, D = DRAGON;
  e.crouch = Math.max(0, e.crouch - dt * 3);
  e.beam.on = false; e.beam.sight = false;
  // a stomp on its back locks your aim on that segment: swing it onto the head (bounce → aim → shoot the head)
  if (P.lock && P.lock.seg && P.lock.head === e && !e.dead) P.lock = e;
  if (e.state === 'dying') { dying(w, e, dt); return; }
  const pcx = e.cx, pcy = e.cy, pcz = e.cz;
  if (e.state === 'intro') {
    e.timer -= dt;
    flyLoop(e, 6, dt);
    if (e.timer <= 0) { toFly(w, e, 1.2); w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); }
  } else {
    if (phaseTick(w, e)) e.rageQ = true;
    e.vuln = 1;
    e.timer -= dt;
    const ph = e.phase - 1, spd = D.speed[ph];
    switch (e.state) {
      case 'fly': {
        flyLoop(e, e.orbTele > 0 ? spd * 0.75 : spd, dt);
        volley(w, e, dt);
        if (e.rageQ && e.orbTele <= 0) { e.pend = 0; rage(w, e); }
        else if (e.pend > 0) { // a dive waiting for you to come round to its side
          e.pend -= dt;
          if (e.orbTele <= 0 && !tryDive(w, e) && e.pend <= 0) startBreath(w, e);
        } else if (e.timer <= 0 && e.orbTele <= 0 && e.orbN <= 0) decide(w, e);
        break;
      }
      case 'rage': { // the phase-change flourish: climb, roar, call the drones, then breathe at you
        orbitAt(e, e.th + e.dir * D.lead, _o);
        e.th += e.dir * spd / D.orbitR * dt;
        steer(e, _o[0], _o[1] + 10, _o[2], spd, D.steer, dt);
        faceVel(e);
        if (e.timer <= 0) startBreath(w, e);
        break;
      }
      case 'breathTele': {
        steer(e, e.hover[0], e.hover[1], e.hover[2], spd, 3.6, dt, 0.9);
        faceTo(e, P.x, P.y + 1, P.z, 5, dt);
        e.beam.sight = true; aimBeam(w, e, P.x, P.y + 1, P.z, 0);
        if (e.timer <= 0) {
          // lock the sweep on where you stand now (chest high above your footing): jump it as it passes
          e.aim[0] = P.x; e.aim[1] = (P.ground ? P.y : Math.min(P.y, e.cy - 2)) + 1; e.aim[2] = P.z;
          e.beam.rate = w.rng() < 0.5 ? -1 : 1;
          e.beam.a = -D.sweep[ph] * e.beam.rate;
          e.state = 'breath'; e.timer = e.tB = D.breathTime[ph];
          w.events.push({ type: 'bossLaser', x: e.cx, y: e.cy, z: e.cz });
        }
        break;
      }
      case 'breath': {
        steer(e, e.hover[0], e.hover[1], e.hover[2], spd * 0.3, 3.6, dt, 0.9);
        e.beam.a += e.beam.rate * (2 * D.sweep[ph] / D.breathTime[ph]) * dt;
        e.beam.on = true;
        aimBeam(w, e, e.aim[0], e.aim[1], e.aim[2], e.beam.a);
        faceDir(e, e.beam.dx, e.beam.dy, e.beam.dz, 6, dt);
        beamHit(w, e);
        if (e.timer <= 0) toFly(w, e, 0.9 + w.rng() * 0.8);
        break;
      }
      case 'diveTele': { // rears up over the target (ease-out into the apex: a beat of stillness), eyes on you
        const u = clamp(1 - e.timer / e.tA, 0, 1), k = 1 - (1 - u) * (1 - u);
        bez(e.p0, e.p1, e.p2, k, _o); e.cx = _o[0]; e.cy = _o[1]; e.cz = _o[2];
        faceTo(e, e.p3[0], e.p3[1], e.p3[2], 8, dt);
        if (e.timer <= 0) { e.state = 'dive'; e.timer = e.tB = D.diveTime[ph]; w.events.push({ type: 'bossLeap', x: e.cx, y: e.cy, z: e.cz }); }
        break;
      }
      case 'dive': { // the plunge: accelerating straight down onto the ring
        const u = clamp(1 - e.timer / e.tB, 0, 1), k = u * u;
        e.cx = e.p2[0] + (e.p3[0] - e.p2[0]) * k; e.cy = e.p2[1] + (e.p3[1] - e.p2[1]) * k; e.cz = e.p2[2] + (e.p3[2] - e.p2[2]) * k;
        faceTo(e, e.p3[0], e.p3[1], e.p3[2], 8, dt);
        if (e.timer <= 0) crash(w, e);
        break;
      }
      case 'stunned': { // lies on the deck, dazed: the punish window
        e.vuln = 1.5; e.crouch = 1;
        e.fp += (0 - e.fp) * Math.min(1, dt * 8);
        if (e.timer <= 0) { e.state = 'recoil'; e.recoilLeft = e.again ? D.recoil2 : e.diveLen; }
        break;
      }
      case 'recoil': { // backs out along its own body, the way it came in
        const step = Math.min(e.recoilLeft, D.recoilSpeed * dt);
        trailBack(e, step);
        e.recoilLeft -= step;
        e.fp += (0.35 - e.fp) * Math.min(1, dt * 3);
        if (e.recoilLeft <= 1e-6) {
          // back at the rear-up point it lifts off up and directly away from its body (never back along
          // it, which would fold it), then swings round onto its loop
          const s1 = e.segs[0], bx = e.cx - s1.cx, bz = e.cz - s1.cz, bl = Math.sqrt(bx * bx + bz * bz) || 1;
          e.vx = bx / bl * 4; e.vy = 7; e.vz = bz / bl * 4;
          if (e.again) { e.again = false; e.second = true; if (!startDive(w, e)) toFly(w, e); }
          else toFly(w, e);
        }
        break;
      }
      default: toFly(w, e);
    }
  }
  if (e.state !== 'recoil') trailForward(e);
  if (dt > 0 && (e.state === 'diveTele' || e.state === 'dive' || e.state === 'stunned' || (e.state === 'recoil' && e.recoilLeft > 1e-6))) {
    e.vx = (e.cx - pcx) / dt; e.vy = (e.cy - pcy) / dt; e.vz = (e.cz - pcz) / dt; // kinematic moves: keep a velocity for the hand-off back to flight
  }
  placeSegs(e);
  sync(e);
}

function segTick(e) {
  const H = e.head;
  if (!H) return;
  e.state = H.state === 'intro' || H.state === 'dying' ? H.state : 'body';
  e.phase = H.phase;
  // while the head lies on the deck (and as it backs out) the neck stands right behind it: it mustn't
  // swallow the stomp you're aiming at the head, or hurt you for making it
  e.noContact = e.seg <= 2 && (H.state === 'stunned' || H.state === 'recoil');
}

// ------------------------------------------------------------------ flight
function flyLoop(e, spd, dt) {
  const D = DRAGON;
  e.th += e.dir * spd / D.orbitR * dt;
  orbitAt(e, e.th + e.dir * D.lead, _o);
  // inside the ring of pads (coming back from a dive) it stays high until it's out past them
  const rx = e.cx - e.ox, rz = e.cz - e.oz;
  if (rx * rx + rz * rz < (D.orbitR - 4) * (D.orbitR - 4)) _o[1] = Math.max(_o[1], e.oy + D.highY);
  steer(e, _o[0], _o[1], _o[2], spd, D.steer, dt);
  faceVel(e);
}

// Blend the velocity toward (target − pos) at `spd`, slowing as it arrives (speed ≤ arrive × distance:
// with arrive ≤ rate / 4 it settles without overshooting, which would fold its body), then move.
function steer(e, tx, ty, tz, spd, rate, dt, arrive = 2.2) {
  const dx = tx - e.cx, dy = ty - e.cy, dz = tz - e.cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const s = Math.min(spd, d * arrive), k = Math.min(1, rate * dt);
  e.vx += (dx / d * s - e.vx) * k; e.vy += (dy / d * s - e.vy) * k; e.vz += (dz / d * s - e.vz) * k;
  e.cx += e.vx * dt; e.cy += e.vy * dt; e.cz += e.vz * dt;
}

function faceVel(e) {
  const hs = Math.sqrt(e.vx * e.vx + e.vz * e.vz);
  if (hs > 0.5) { e.fx = e.vx / hs; e.fz = e.vz / hs; }
  e.fp = Math.atan2(e.vy, Math.max(hs, 0.5));
}
// Turn the heading (and pitch) toward a point at `rate` rad/s.
function faceTo(e, x, y, z, rate, dt) {
  const dx = x - e.cx, dz = z - e.cz, hs = Math.sqrt(dx * dx + dz * dz);
  faceDir(e, dx, y - e.cy, dz, rate, dt, hs);
}
function faceDir(e, dx, dy, dz, rate, dt, hs = Math.sqrt(dx * dx + dz * dz)) {
  if (hs > 1e-6) {
    const wx = dx / hs, wz = dz / hs;
    const cross = e.fx * wz - e.fz * wx, dot = e.fx * wx + e.fz * wz;
    const step = clamp(Math.atan2(cross, dot), -rate * dt, rate * dt), c = Math.cos(step), s = Math.sin(step);
    const nfx = e.fx * c - e.fz * s, nfz = e.fx * s + e.fz * c, l = Math.sqrt(nfx * nfx + nfz * nfz) || 1;
    e.fx = nfx / l; e.fz = nfz / l;
  }
  const want = Math.atan2(dy, Math.max(hs, 0.3));
  e.fp += clamp(want - e.fp, -rate * dt, rate * dt);
}

function toFly(w, e, t) {
  const D = DRAGON, ph = e.phase - 1;
  e.state = 'fly';
  e.timer = t ?? D.flyTime[ph][0] + w.rng() * (D.flyTime[ph][1] - D.flyTime[ph][0]);
  e.th = Math.atan2(e.cz - e.oz, e.cx - e.ox); // rejoin the loop where it is
  e.second = false; e.again = false;
}

// ------------------------------------------------------------------ choosing an attack
function decide(w, e) {
  const tgt = diveTarget(w, e, _t);
  const opts = [];
  const wb = e.lastAtk === 'breath' && e.lastN >= 2 ? 0 : 3;
  const wd = !tgt || (e.lastAtk === 'dive' && e.lastN >= 2) ? 0 : e.phase === 1 ? 3.5 : 4.5;
  if (wb > 0) opts.push(['breath', wb]);
  if (wd > 0) opts.push(['dive', wd]);
  const k = opts.length ? pick(w, opts) : 'breath';
  e.lastN = k === e.lastAtk ? e.lastN + 1 : 1; e.lastAtk = k;
  if (k === 'dive') { e.pend = DRAGON.divePend; if (tryDive(w, e)) return; e.timer = 0; return; } // (keeps flying round to your side)
  startBreath(w, e);
}

// A dive it has chosen: only once you're on its side of the tower (so it never rears up across the
// spire); it flies on round for up to divePend s, then breathes instead.
function tryDive(w, e) {
  const t = diveTarget(w, e, _t);
  if (t) {
    const ah = Math.atan2(e.cz - e.oz, e.cx - e.ox), ap = Math.atan2(t.z - e.oz, t.x - e.ox);
    if (Math.abs(Math.atan2(Math.sin(ap - ah), Math.cos(ap - ah))) <= DRAGON.diveSide && startDive(w, e)) { e.pend = 0; return true; }
  }
  return false;
}

function rage(w, e) {
  const D = DRAGON;
  e.rageQ = false;
  e.state = 'rage'; e.timer = D.rageTime;
  w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz });
  // drones come up on the far side of the tower from it, at perch height
  const base = Math.atan2(e.cz - e.oz, e.cx - e.ox) + Math.PI;
  for (let i = 0; i < D.minions[e.phase - 1]; i++) {
    const a = base + (i - 0.5) * 1.2;
    spawn(w, { type: 'drone', x: e.ox + Math.cos(a) * 17, y: e.oy + 8 + i * 1.5, z: e.oz + Math.sin(a) * 17 });
  }
}

function startBreath(w, e) {
  const D = DRAGON, P = w.player, ph = e.phase - 1;
  // a little ahead on its loop, so it glides to a stop rather than backing up (which would fold its body)
  const a = Math.atan2(e.cz - e.oz, e.cx - e.ox) + e.dir * D.hoverAhead / D.hoverR;
  e.hover[0] = e.ox + Math.cos(a) * D.hoverR; e.hover[2] = e.oz + Math.sin(a) * D.hoverR;
  e.hover[1] = clamp(clamp(P.y + 7, e.cy - 5, e.cy + 5), e.oy + D.hoverY[0], e.oy + D.hoverY[1]); // (no steep drops: it glides in)
  e.state = 'breathTele'; e.timer = e.tA = D.breathTele[ph];
  w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
}

// Where it would crash: under you, on a low deck (not the spire's rings, not the high perches),
// kept off the tower's columns. Returns null when you're somewhere it won't dive.
const _t = { x: 0, y: 0, z: 0, ux: 0, uz: 0 };
export function diveTarget(w, e, out) {
  const P = w.player, D = DRAGON;
  const g = P.ground || groundBelow(w.plats, P.x, P.z, P.y + 0.3);
  if (!g || P.dead) return null;
  const top = g.h + g.oy;
  if (top > e.oy + D.diveMaxH) return null;
  let rx = P.x - e.ox, rz = P.z - e.oz, r = Math.sqrt(rx * rx + rz * rz);
  if (r < 1e-3) { rx = e.cx - e.ox; rz = e.cz - e.oz; r = Math.sqrt(rx * rx + rz * rz) || 1; }
  const ux = rx / r, uz = rz / r;
  r = Math.max(r, D.diveMinR);
  out.x = e.ox + ux * r; out.y = top; out.z = e.oz + uz * r; out.ux = ux; out.uz = uz;
  return out;
}

function startDive(w, e) {
  const D = DRAGON, ph = e.phase - 1;
  const t = diveTarget(w, e, _t);
  if (!t) return false;
  const tele = D.diveTele[ph] * (e.second ? 0.85 : 1);
  e.p0[0] = e.cx; e.p0[1] = e.cy; e.p0[2] = e.cz;
  if (e.second) { // from low on its own body: up and sideways first, never back along itself
    const a = Math.atan2(e.cz - e.oz, e.cx - e.ox);
    e.p1[0] = e.cx - Math.sin(a) * e.dir * 5; e.p1[1] = e.cy + 4; e.p1[2] = e.cz + Math.cos(a) * e.dir * 5;
  } else { e.p1[0] = e.cx + e.vx * tele * 0.35; e.p1[2] = e.cz + e.vz * tele * 0.35; }
  e.p3[0] = t.x; e.p3[1] = t.y + D.restH; e.p3[2] = t.z;
  if (!e.second) e.p1[1] = Math.max(e.cy + 4, t.y + D.diveUp); // it rears up early, well above the pads it crosses
  // the rear-up point: out from the tower and up, turned round the target until neither the rear-up
  // nor the plunge passes through a deck, pad or column someone could be standing on (so its body,
  // lying along that line while it's stunned, never does either)
  const g = groundBelow(w.plats, t.x, t.z, t.y + 0.1);
  let found = false;
  for (const turn of DIVE_TURNS) {
    const c = Math.cos(turn), s = Math.sin(turn), ox = t.ux * c - t.uz * s, oz = t.ux * s + t.uz * c;
    e.p2[0] = t.x + ox * D.diveOut; e.p2[1] = t.y + D.diveUp; e.p2[2] = t.z + oz * D.diveOut;
    if (pathClear(w, e, g)) { found = true; break; }
  }
  if (!found) return false;
  e.diveLen = Math.sqrt((e.p2[0] - e.p3[0]) ** 2 + (e.p2[1] - e.p3[1]) ** 2 + (e.p2[2] - e.p3[2]) ** 2); // it backs out exactly this far
  e.state = 'diveTele'; e.timer = e.tA = tele;
  zone(w, t.x, t.y, t.z, D.diveR, tele + D.diveTime[ph], { dmg: 1, knock: 11, kind: 'dive', height: 3 });
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  return true;
}

const DIVE_TURNS = [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8];
// Does the dive (rear-up curve p0 → p1 → p2, then the plunge p2 → p3) stay clear of every platform's
// standing space (its top up to a body height above it, grown by the body's radius)? `skip` is the
// target's own deck: the plunge ends there.
function pathClear(w, e, skip) {
  const R = DRAGON.segR[0] + 0.5, H = 2.2, N = 32;
  for (let i = 1; i <= 2 * N; i++) {
    if (i <= N) bez(e.p0, e.p1, e.p2, i / N, _o);
    else { const k = (i - N) / N; _o[0] = e.p2[0] + (e.p3[0] - e.p2[0]) * k; _o[1] = e.p2[1] + (e.p3[1] - e.p2[1]) * k; _o[2] = e.p2[2] + (e.p3[2] - e.p2[2]) * k; }
    for (const p of w.plats) {
      if (p === skip) continue;
      const top = p.h + p.oy;
      if (_o[1] - R > top + H || _o[1] + R < top - p.thick) continue;
      if (inside(p, _o[0], _o[2], R + 0.5)) return false;
    }
  }
  return true;
}

function crash(w, e) {
  const D = DRAGON;
  e.cx = e.p3[0]; e.cy = e.p3[1]; e.cz = e.p3[2];
  w.events.push({ type: 'bossSlam', x: e.cx, y: e.p3[1] - D.restH, z: e.cz, r: D.diveR });
  e.state = 'stunned'; e.crouch = 1;
  e.again = e.phase === 3 && !e.second && w.rng() < 0.5; // phase 3: sometimes straight into a second dive
  e.timer = e.tB = e.again ? D.stun2 : D.stun[e.phase - 1];
}

// Pearl volleys while it flies (phase 2+): a flare (≥ 0.5 s), then a fan of bolts from the mouth.
function volley(w, e, dt) {
  const D = DRAGON, ph = e.phase - 1;
  if (e.orbTele > 0) {
    e.orbTele -= dt;
    if (e.orbTele <= 0) {
      mouth(e, _o);
      fan(w, e, _o[0], _o[1], _o[2], D.orbSpeed, D.orbs[ph], D.orbArc[ph]);
      if (--e.orbN > 0) e.orbTele = 0.4; // phase 3: a second fan right behind the first
    }
    return;
  }
  if (e.phase < 2) return;
  e.orbT -= dt;
  if (e.orbT > 0) return;
  mouth(e, _o);
  if (!sees(w, _o[0], _o[1], _o[2])) { e.orbT = 0.5; return; }
  e.orbT = D.orbEvery[0] + w.rng() * (D.orbEvery[1] - D.orbEvery[0]);
  e.orbN = e.phase === 3 ? 2 : 1;
  e.orbTele = D.orbTele[ph];
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
}

function mouth(e, out) {
  const c = Math.cos(e.fp);
  out[0] = e.cx + e.fx * c * 2.4; out[1] = e.cy + Math.sin(e.fp) * 2.4 - 0.3; out[2] = e.cz + e.fz * c * 2.4;
  return out;
}

// ------------------------------------------------------------------ the body: a trail of points
// e.tx/ty/tz[0] is the newest trail point; consecutive points are exactly `gap` apart. The head is
// d0 (< gap) beyond point 0, and segment k sits k·gap behind the head along the trail.
function trailForward(e) {
  const G = DRAGON.gap, n = e.tx.length;
  for (let guard = 0; guard < 16; guard++) {
    const dx = e.cx - e.tx[0], dy = e.cy - e.ty[0], dz = e.cz - e.tz[0], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < G) return;
    for (let i = n - 1; i > 0; i--) { e.tx[i] = e.tx[i - 1]; e.ty[i] = e.ty[i - 1]; e.tz[i] = e.tz[i - 1]; }
    e.tx[0] += dx / d * G; e.ty[0] += dy / d * G; e.tz[0] += dz / d * G;
  }
}
// Move the head back along its own trail by `dist` (the recoil): the body slides back the way it came.
function trailBack(e, dist) {
  const n = e.tx.length;
  for (let guard = 0; guard < 16 && dist > 1e-9; guard++) {
    const dx = e.tx[0] - e.cx, dy = e.ty[0] - e.cy, dz = e.tz[0] - e.cz, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > dist) { e.cx += dx / d * dist; e.cy += dy / d * dist; e.cz += dz / d * dist; return; }
    e.cx = e.tx[0]; e.cy = e.ty[0]; e.cz = e.tz[0]; dist -= d;
    for (let i = 0; i < n - 1; i++) { e.tx[i] = e.tx[i + 1]; e.ty[i] = e.ty[i + 1]; e.tz[i] = e.tz[i + 1]; }
    e.tx[n - 1] = 2 * e.tx[n - 2] - e.tx[n - 3]; e.ty[n - 1] = 2 * e.ty[n - 2] - e.ty[n - 3]; e.tz[n - 1] = 2 * e.tz[n - 2] - e.tz[n - 3]; // the tail end runs straight on
  }
}
function placeSegs(e) {
  const G = DRAGON.gap;
  const dx = e.cx - e.tx[0], dy = e.cy - e.ty[0], dz = e.cz - e.tz[0];
  const f = clamp(1 - Math.sqrt(dx * dx + dy * dy + dz * dz) / G, 0, 1);
  let px = e.cx, py = e.cy, pz = e.cz;
  for (let k = 1; k <= e.segs.length; k++) {
    const s = e.segs[k - 1];
    s.cx = e.tx[k - 1] + (e.tx[k] - e.tx[k - 1]) * f; s.cy = e.ty[k - 1] + (e.ty[k] - e.ty[k - 1]) * f; s.cz = e.tz[k - 1] + (e.tz[k] - e.tz[k - 1]) * f;
    const hx = px - s.cx, hy = py - s.cy, hz = pz - s.cz, l = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
    s.hx = hx / l; s.hy = hy / l; s.hz = hz / l;
    s.x = s.cx; s.z = s.cz; s.y = s.cy - s.rr;
    px = s.cx; py = s.cy; pz = s.cz;
  }
}

function bez(a, b, c, u, out) {
  const v = 1 - u;
  for (let i = 0; i < 3; i++) out[i] = v * v * a[i] + 2 * v * u * b[i] + u * u * c[i];
  return out;
}

function sync(e) { e.x = e.cx; e.z = e.cz; e.y = e.cy - e.top / 2; }

// ------------------------------------------------------------------ defeat
export function down(w, e) {
  if (e.seg) return; // (segments never take damage)
  if (e.state === 'dying') return;
  downStd(w, e);
  e.surf = 'floor'; // it doesn't drop like a stone: it spirals down onto the deck (dying() below)
  e.timer = DRAGON.dyingTime;
  let rx = e.cx - e.ox, rz = e.cz - e.oz, r = Math.sqrt(rx * rx + rz * rz);
  if (r < 1e-3) { rx = 1; rz = 0; r = 1; }
  const rr = clamp(r, 7, 11);
  e.p2[0] = e.cx; e.p2[1] = e.cy; e.p2[2] = e.cz;
  e.p3[0] = e.ox + rx / r * rr; e.p3[1] = e.oy + DRAGON.restH; e.p3[2] = e.oz + rz / r * rr;
}

function dying(w, e, dt) {
  const u = clamp(1 - e.timer / DRAGON.dyingTime, 0, 1), k = 1 - (1 - u) * (1 - u);
  const pcx = e.cx, pcz = e.cz;
  e.cx = e.p2[0] + (e.p3[0] - e.p2[0]) * k + Math.sin(u * 19) * (1 - u) * 1.5;
  e.cy = e.p2[1] + (e.p3[1] - e.p2[1]) * k;
  e.cz = e.p2[2] + (e.p3[2] - e.p2[2]) * k + Math.cos(u * 17) * (1 - u) * 1.5;
  const hs = Math.sqrt((e.cx - pcx) * (e.cx - pcx) + (e.cz - pcz) * (e.cz - pcz));
  if (hs > 1e-4) { e.fx = (e.cx - pcx) / hs; e.fz = (e.cz - pcz) / hs; }
  e.fp += (-0.4 * (1 - u) - e.fp) * Math.min(1, dt * 4);
  trailForward(e);
  placeSegs(e);
  // the body bursts along its length as it comes down
  if (e.boomT - dt <= 0 && e.segs.length) {
    const s = e.segs[Math.floor(w.rng() * e.segs.length)];
    w.events.push({ type: 'explode', x: s.cx, y: s.cy, z: s.cz, r: 1.8 });
  }
  dyingTick(w, e, dt); // the head's explosions, then score, the kill and the exit
  if (e.dead) for (const s of e.segs) { s.dead = true; s.deadT = 0; }
}

// ------------------------------------------------------------------ the registry entry
// Stomps: the head whenever it isn't plunging (stunned is the easy one); the body always (a bounce).
const STOMPABLE = { fly: 1, rage: 1, breathTele: 1, breath: 1, stunned: 1, recoil: 1, body: 1 };
export default {
  init, update, down,
  stompable: (e) => !!STOMPABLE[e.state],
  tuning: DRAGON,
};
