// MECHA ANUBIS: the jackal-headed judge of the Duat (EGYPT's boss). Pure (no three.js, no DOM).
//
// A 9.6 m black-and-gold mech with a was-sceptre. It stalks you round the Hall of Judgment and picks
// an attack by where you are; every big one ends in a punish window (vuln 1.5). It never charges or
// burrows to chase: it SINKS into the sand and rises where you stood.
//
//   stalk ─┬─ sweepTele → sweep (a ring at ankle height: hop it) ─ phase 2+: → backswing (a ring at
//          │              head height 0.9 s later: be back on the floor) → recover
//          ├─ slamTele → slam (crush under the sceptre's head) → waves (1/2/3 shockwave rings run out
//          │              across the floor: jump each as it reaches you) ; stuck (sceptre wedged)
//          ├─ beamCharge (sight line) → beam (its eyes burn a beam that turns after you slower than you
//          │              run; pillars, jars and the dais block it) → vent
//          ├─ boltTele → bolts (fans of ankh bolts, mostly for players up on a perch)
//          ├─ summonTele (the canopic jars glow) → scarabs crawl out (walkers; spikers from phase 2)
//          └─ sinkTele → sinking (invulnerable) → under (a sand swirl where you stood: get out) →
//                         rise (it bursts up through it) → shake
//   a head stomp: bonus damage, it reels (vuln 1.5), then sinks away and rises somewhere else
//   phase 3: the ANKH WARD. A golden shield covers its front and sides (shots glance off); its back
//   is open, and a stomp on its head shatters the ward (it comes back 14 s later).
import { T } from '../tuning.js';
import { clamp } from '../util.js';
import { raycast } from '../plats.js';
import { hurtPlayer } from '../player.js';
import { initPose, introTick, phaseTick, pick, turnTo, pushSolids, openSpot, fan, zone, spawn, down as stdDown, dyingTick, beamHit, syncPose } from './common.js';

// Every number, and why it has that value. (Exported: it lands in data/tuning.json as BOSSES.anubis.)
export const tuning = {
  hp: 320, // ~48 s of blaster on target; a perfect aimbot needs ~70 s (it sinks, the ward eats front fire): 2–4 min for a player.
  r: 2.6, top: 9.6, bodyR: 2.3, // hit capsule (shots, contact, stomps on the head at 9.6 m); its body against columns and jars.
  eyeUp: 8.5, eyeFwd: 1.4, // the eyes: 8.5 m up, 1.4 m in front of its centre (the beam and the bolts start here).
  intro: 2.4, // the hold before it howls.
  cuts: [0.6, 0.3], // phase 2 below 60 %, phase 3 (the ward) below 30 %.
  margin: 6, // how far inside the arena box it walks (the columns stand 7 m in from the walls).
  speed: [3.0, 3.6, 4.2], // stalking speed by phase: well under your 8.5 m/s.
  turn: [1.4, 1.7, 2.0], // rad/s: circle it inside ~5 m and you get behind it (you need its back in phase 3).
  keep: 7, // it stops closing in here: the sweep's reach is 8.5, so standing your ground is a choice.
  stalk: [[2.2, 3.0], [1.7, 2.4], [1.3, 1.9]], // seconds between attacks, by phase.
  vulnOpen: 1.5, // damage × in the punish windows (recover, stuck, vent, shake, reel).
  sweep: { tele: [0.9, 0.8, 0.7], r: 8.5, height: 1.3, swing: 0.35, back: [0, 0.9, 0.9], backY: 2.6, backH: 7.5, recover: [1.4, 1.2, 1.0] },
  //       the low ring hits below 1.3 m (a hop clears it); from phase 2 a high ring 2.6 m up lands 0.9 s later and hits anyone
  //       0.4–10 m off the floor (on a jar, still in the air): a single hop has come down by then. Hop, land, stay down.
  slam: { tele: [1.0, 0.9, 0.8], reach: 4.6, crushR: 3.4, crushDmg: 2, waves: [1, 2, 3], gap: 1.2, speed: 13, band: 0.9, height: 0.9, maxR: 44, stuck: [1.8, 1.5, 1.25] },
  //       the sceptre comes down 4.6 m in front (the crush ring shows the spot); rings run out at 13 m/s, 1.8 m thick and
  //       0.9 m tall, 1.2 s apart (15.6 m): hop each as it reaches you (a single hop is 1.05 s in the air, so you're down
  //       again for the next). The sceptre sticks in the floor while the aftershocks run on.
  beam: { charge: [1.1, 0.95, 0.85], time: [2.2, 2.6, 3.0], rate: [0.42, 0.5, 0.58], vent: [2.0, 1.7, 1.4], len: 90 },
  //       the sight line shows ≥ 0.85 s; the beam turns at most 0.42–0.58 rad/s (at 15 m that's 6–9 m/s: run across it,
  //       or put a column between you); it vents afterwards.
  bolts: { tele: [0.7, 0.6, 0.55], n: [3, 5, 5], arc: [0.5, 0.7, 0.8], speed: [16, 17.5, 19], volleys: [1, 2, 2], gap: 0.5 },
  //       ankh bolts (1 damage, blocked by geometry) fanned at you: slower than a turret round (20), the gaps move.
  summon: { tele: 1.0, n: [2, 2, 3], cap: [3, 4, 5], cd: [15, 12, 10], out: 2.6 },
  //       the jars glow for 1 s, then scarabs crawl out of the two nearest you (never more than `cap` alive).
  sink: { tele: 0.6, down: 0.7, swirl: [1.25, 1.15, 1.05], rise: 0.55, r: 4.2, dmg: 2, knock: 14, shake: [1.4, 1.2, 1.0], cd: [9, 8, 7], depth: 10 },
  //       crouch 0.6 s, sink 0.7 s (invulnerable), then a swirl ring where you stand: ≥ 1.05 s to step out of 4.2 m before it
  //       bursts up through it (2 damage). It shakes off the sand afterwards (the punish window). depth: how far it sinks
  //       (more than its height: nothing shows above the floor).
  reel: 1.4, // a head stomp staggers it (vuln 1.5), then it sinks away.
  headBonus: 8, // extra damage for a head stomp (the stomp itself does 4): about 4 % of its health.
  headCD: 3.5, // the bonus comes once per this long.
  ward: { cos: 0.5, back: 14 }, // phase 3: shots arriving within 120° of its face glance off; a head stomp breaks it for 14 s.
  minions: 1, // a drone joins at each phase change.
};
const C = tuning;
const _spot = [0, 0];
const OPEN = new Set(['recover', 'stuck', 'vent', 'shake', 'reel']); // the punish windows (vuln ×1.5)
const UNDER = new Set(['sinking', 'under', 'rise']); // under the sand: invulnerable, no contact
const ph1 = (e) => e.phase - 1;
const byPh = (a, e) => a[Math.min(a.length - 1, e.phase - 1)];

function set(e, state, dur) { e.state = state; e.timer = dur; e.dur = dur; e.st = 0; }

export function init(w, e, d) {
  initPose(w, e, d, { hp: C.hp, r: C.r, top: C.top, bodyH: C.top / 2, intro: C.intro });
  Object.assign(e, {
    st: 0, dur: C.intro, last: '', roarDue: false, ward: 0, wardK: 0, wardCD: 0, headCD: 0, stompN: w.stats.stomps,
    sinkCD: 4, summonCD: 6, minions: [], jars: (d.jars || []).map(([x, z]) => ({ x, z })), glow: [],
    pans: d.pans || null, tilt: 0, scale: d.scale || null,
    waves: [], waveQ: 0, waveT: 0, wx: 0, wz: 0, // shockwave rings: { x, z, r, hit }
    riseX: 0, riseZ: 0, swirl: null, sink: 0, // sink: 0 standing … 1 under the floor
    left: 0, dropT: 0, back: null, sceptre: 0, // sceptre: 0 held … 1 raised (render)
  });
  e.fx = 0; e.fz = 1; // faces the gate you come in by (south)
  syncPose(e);
}

// Did your stomp land on its head last step? (contact() runs after update, so we see it now.)
function headStomp(w, e, dt) {
  e.headCD = Math.max(0, e.headCD - dt);
  const n = w.stats.stomps;
  if (n === e.stompN) return;
  e.stompN = n;
  if (w.player.lock !== e || e.state === 'dying') return;
  if (e.headCD <= 0) {
    e.headCD = C.headCD;
    e.hp -= C.headBonus; e.flash = 0.2;
    w.events.push({ type: 'hit', kind: 'boss', x: e.cx, y: e.cy + C.top / 2, z: e.cz });
    if (e.hp <= 0) { down(w, e); return; }
  }
  if (e.ward > 0) { // the stomp shatters the ankh ward
    e.ward = 0; e.wardCD = C.ward.back;
    w.events.push({ type: 'impact', kind: 'shield', x: e.cx, y: e.cy + 2, z: e.cz, nx: 0, ny: 1, nz: 0 });
  }
  if (!['reel', 'sinkTele', 'sinking', 'under', 'rise', 'shake'].includes(e.state)) {
    set(e, 'reel', C.reel); e.waveQ = 0; w.zones.length = 0; e.beam.on = e.beam.sight = false;
    w.events.push({ type: 'bossCeil', x: e.cx, y: e.cy, z: e.cz });
  }
}

export function update(w, e, dt) { // (updateEnemies has already advanced e.t and e.flash)
  const A = w.level.arena, P = w.player;
  if (e.pans && w.plats[e.pans[0]] && w.plats[e.pans[1]]) e.tilt = (w.plats[e.pans[0]].oy - w.plats[e.pans[1]].oy) / 2; // (the scales' beam, for the view)
  waves(w, e, dt);
  e.wardK += ((e.ward > 0 ? 1 : 0) - e.wardK) * Math.min(1, dt * 6);
  for (let i = 0; i < e.glow.length; i++) e.glow[i] = Math.max(0, e.glow[i] - dt * 0.8);
  if (e.state === 'dying') { e.sink = Math.max(0, e.sink - dt * 2); e.ward = 0; dyingTick(w, e, dt); return; }
  if (e.state === 'intro') {
    e.st += dt;
    if (introTick(w, e, dt, 'stalk', 1.4)) { if (e.state !== 'intro') { e.dur = e.timer; e.st = 0; } syncPose(e); return; }
  }
  headStomp(w, e, dt);
  if (e.state === 'dying') return;
  if (phaseTick(w, e, C.cuts)) {
    for (let i = 0; i < C.minions; i++) { const a = w.rng() * Math.PI * 2; e.minions.push(spawn(w, { type: 'drone', x: Math.cos(a) * 20, y: 11, z: Math.sin(a) * 14 }).id); }
    e.roarDue = true;
    if (e.phase === 3) { e.ward = 1; e.wardCD = 0; }
  }
  if (e.phase === 3 && e.ward === 0) { e.wardCD -= dt; if (e.wardCD <= 0 && e.state === 'stalk') { e.ward = 1; w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz }); } }
  e.sinkCD = Math.max(0, e.sinkCD - dt); e.summonCD = Math.max(0, e.summonCD - dt);
  e.st += dt; e.timer -= dt;
  e.beam.on = false; e.beam.sight = false;
  let raise = 0;
  switch (e.state) {
    case 'stalk': {
      if (e.roarDue) { e.roarDue = false; set(e, 'roar', 1.2); w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); break; }
      const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz);
      openSpot(w, P.x, P.z, C.bodyR, _spot, A.floor, A.floor + C.top);
      walk(w, e, _spot[0], _spot[1], d > C.keep ? C.speed[ph1(e)] : 0, C.turn[ph1(e)], dt);
      if (e.timer <= 0) decide(w, e);
      break;
    }
    case 'roar': turnTo(e, P.x, P.z, 1, dt); if (e.timer <= 0) set(e, 'stalk', 0.8); break;
    // ---- the staff sweep (and the backswing)
    case 'sweepTele': raise = -0.4; turnTo(e, P.x, P.z, C.turn[ph1(e)] * 0.5, dt); if (e.timer <= 0) set(e, 'sweep', C.sweep.swing); break;
    case 'sweep': if (e.timer <= 0) { if (e.back) set(e, 'backTele', e.back.t - C.sweep.swing); else set(e, 'recover', byPh(C.sweep.recover, e)); } break;
    case 'backTele': raise = 0.6; if (e.timer <= 0) set(e, 'backswing', C.sweep.swing); break;
    case 'backswing': raise = 0.6; if (e.timer <= 0) { e.back = null; set(e, 'recover', byPh(C.sweep.recover, e)); } break;
    // ---- the sceptre slam and its shockwaves
    case 'slamTele': raise = Math.min(1, e.st / (e.dur * 0.6)); turnTo(e, P.x, P.z, C.turn[ph1(e)] * 0.4, dt); if (e.timer <= 0) slam(w, e); break;
    case 'stuck': raise = -1; if (e.timer <= 0) next(w, e); break; // (the aftershocks keep coming after it pulls free)
    // ---- the eye beam
    case 'beamCharge': {
      turnTo(e, P.x, P.z, C.turn[ph1(e)], dt);
      eyeAt(w, e); aimAt(w, e, P.x, P.y + 1, P.z, 99); castBeam(w, e);
      e.beam.sight = true;
      if (e.timer <= 0) { set(e, 'beam', byPh(C.beam.time, e)); w.events.push({ type: 'bossLaser', x: e.cx, y: e.cy, z: e.cz }); }
      break;
    }
    case 'beam': {
      eyeAt(w, e); aimAt(w, e, P.x, P.y + 1, P.z, byPh(C.beam.rate, e) * dt); castBeam(w, e);
      const hl = Math.sqrt(e.beam.dx * e.beam.dx + e.beam.dz * e.beam.dz);
      if (hl > 0.05) { e.fx = e.beam.dx / hl; e.fz = e.beam.dz / hl; } // the head turns with its gaze
      e.beam.on = true;
      beamHit(w, e);
      if (e.timer <= 0) set(e, 'vent', byPh(C.beam.vent, e));
      break;
    }
    case 'vent': if (e.timer <= 0) next(w, e); break;
    // ---- ankh bolts
    case 'boltTele': raise = 0.5; turnTo(e, P.x, P.z, C.turn[ph1(e)] * 1.5, dt); if (e.timer <= 0) { set(e, 'bolts', 0.4); e.left = byPh(C.bolts.volleys, e); e.dropT = 0; } break;
    case 'bolts': {
      raise = 0.5;
      turnTo(e, P.x, P.z, C.turn[ph1(e)], dt);
      e.dropT -= dt;
      if (e.left > 0 && e.dropT <= 0) {
        e.left--; e.dropT = C.bolts.gap; e.timer = Math.max(e.timer, C.bolts.gap + 0.1);
        eyeAt(w, e);
        const n = byPh(C.bolts.n, e) + (e.left % 2); // odd/even counts alternate: the safe gaps move
        fan(w, e, e.beam.ox, e.beam.oy, e.beam.oz, byPh(C.bolts.speed, e), n, byPh(C.bolts.arc, e));
      }
      if (e.left <= 0 && e.timer <= 0) next(w, e);
      break;
    }
    // ---- scarabs from the canopic jars
    case 'summonTele': raise = -1; if (e.timer <= 0) { scarabs(w, e); set(e, 'summon', 0.6); } break;
    case 'summon': raise = -1; if (e.timer <= 0) next(w, e); break;
    // ---- the sand-sink teleport
    case 'sinkTele': e.sink = Math.min(0.15, e.sink + dt * 0.25); turnTo(e, P.x, P.z, 1, dt); if (e.timer <= 0) { set(e, 'sinking', C.sink.down); w.events.push({ type: 'bossLeap', x: e.cx, y: A.floor + 1.6, z: e.cz }); } break;
    case 'sinking': {
      e.sink = Math.min(1, 0.15 + 0.85 * (e.st / e.dur));
      if (e.timer <= 0) { // the swirl opens where you stand
        openSpot(w, clamp(P.x, A.x0 + C.margin, A.x1 - C.margin), clamp(P.z, A.z0 + C.margin, A.z1 - C.margin), C.bodyR, _spot, A.floor, A.floor + C.top);
        e.riseX = _spot[0]; e.riseZ = _spot[1];
        const t = byPh(C.sink.swirl, e);
        e.swirl = zone(w, e.riseX, A.floor, e.riseZ, C.sink.r, t, { dmg: C.sink.dmg, knock: C.sink.knock, kind: 'swirl', height: 4 });
        set(e, 'under', t);
        w.events.push({ type: 'bossTele', x: e.riseX, y: A.floor + 1, z: e.riseZ });
      }
      break;
    }
    case 'under': {
      e.sink = 1;
      if (e.timer <= 0) {
        e.cx = e.riseX; e.cz = e.riseZ; e.swirl = null;
        const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz) || 1;
        e.fx = dx / d; e.fz = dz / d;
        set(e, 'rise', C.sink.rise);
        w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: C.sink.r });
      }
      break;
    }
    case 'rise': e.sink = Math.max(0, 1 - e.st / e.dur); if (e.timer <= 0) { e.sink = 0; set(e, 'shake', byPh(C.sink.shake, e)); } break;
    case 'shake': if (e.timer <= 0) next(w, e); break;
    // ---- punish windows
    case 'recover': if (e.timer <= 0) next(w, e); break;
    case 'reel': move(w, e, -e.fx * 1.2 * dt, -e.fz * 1.2 * dt); if (e.timer <= 0) { set(e, 'sinkTele', C.sink.tele); e.sinkCD = byPh(C.sink.cd, e); } break;
    default: set(e, 'stalk', 1);
  }
  e.sceptre += (raise - e.sceptre) * Math.min(1, dt * 8);
  e.noContact = UNDER.has(e.state);
  e.vuln = UNDER.has(e.state) ? 0 : OPEN.has(e.state) ? C.vulnOpen : 1;
  // the body: sunk into the floor while it travels under it
  e.cy = A.floor + C.top / 2 - e.sink * C.sink.depth;
  syncPose(e);
}

// Walk toward (tx, tz): turn at `rate`, step forward only as far as it faces the way (no sideways
// skating), kept inside the arena and out of the columns, jars and the scales.
function walk(w, e, tx, tz, speed, rate, dt) {
  turnTo(e, tx, tz, rate, dt);
  if (speed <= 0) return;
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1.2) return;
  const k = Math.max(0, (e.fx * dx + e.fz * dz) / d), s = speed * (0.35 + 0.65 * k) * dt;
  move(w, e, e.fx * s, e.fz * s, dx / d, dz / d);
  e.gait += s;
}
function move(w, e, mx, mz, gx = 0, gz = 0) {
  const A = w.level.arena;
  e.cx = clamp(e.cx + mx, A.x0 + C.margin, A.x1 - C.margin); e.cz = clamp(e.cz + mz, A.z0 + C.margin, A.z1 - C.margin);
  pushSolids(w, e, C.bodyR, gx, gz, (gx || gz) ? Math.sqrt(mx * mx + mz * mz) * 0.7 : 0);
}

// After an attack: back to stalking (it picks the next one when the stalk timer runs out).
function next(w, e) { const g = C.stalk[ph1(e)]; set(e, 'stalk', g[0] + w.rng() * (g[1] - g[0])); }

function alive(w, ids) { let n = 0; for (const m of w.enemies) if (!m.dead && ids.includes(m.id)) n++; return n; }

function decide(w, e) {
  const P = w.player, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  const high = P.y > A.floor + 2.5; // up on a jar, a column, a pan or the dais: out of the sweep's and the waves' reach
  const opts = [];
  const add = (k, wt) => { if (wt > 0) opts.push([k, k === e.last ? wt * 0.35 : wt]); };
  if (!high && d < 9) add('sweep', 4);
  if (!high) add('slam', d < 14 ? 3 : 2);
  if (d > 7) add('beam', high ? 4 : 2.5);
  if (d > 10 || high) add('bolts', high ? 3 : 1.5);
  if (e.sinkCD <= 0 && (d > 14 || high)) add('sink', high ? 2 : 3);
  if (e.summonCD <= 0 && e.jars.length && alive(w, e.minions) < byPh(C.summon.cap, e)) add('summon', 2 + ph1(e));
  if (!opts.length) add('bolts', 1);
  attack(w, e, pick(w, opts));
}

function attack(w, e, kind) {
  const A = w.level.arena, f = A.floor;
  e.last = kind;
  if (kind === 'sweep') {
    const t = byPh(C.sweep.tele, e);
    set(e, 'sweepTele', t);
    zone(w, e.cx, f, e.cz, C.sweep.r, t, { height: C.sweep.height, kind: 'sweep', knock: 10 });
    const gap = byPh(C.sweep.back, e);
    e.back = gap > 0 ? { t: gap } : null;
    if (e.back) zone(w, e.cx, f + C.sweep.backY, e.cz, C.sweep.r, t + gap, { height: C.sweep.backH, kind: 'high', knock: 10 });
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'slam') {
    const t = byPh(C.slam.tele, e);
    set(e, 'slamTele', t);
    e.wx = e.cx + e.fx * C.slam.reach; e.wz = e.cz + e.fz * C.slam.reach;
    zone(w, e.wx, f, e.wz, C.slam.crushR, t, { height: 3, dmg: C.slam.crushDmg, knock: 12, kind: 'crush' });
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'beam') {
    set(e, 'beamCharge', byPh(C.beam.charge, e));
    w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'bolts') {
    set(e, 'boltTele', byPh(C.bolts.tele, e));
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'summon') {
    set(e, 'summonTele', C.summon.tele);
    e.summonCD = byPh(C.summon.cd, e);
    const P = w.player;
    e.pickJars = e.jars.map((j, i) => [i, (j.x - P.x) * (j.x - P.x) + (j.z - P.z) * (j.z - P.z)]).sort((a, b) => a[1] - b[1]).slice(0, 2).map((q) => q[0]);
    e.glow = e.jars.map((j, i) => (e.pickJars.includes(i) ? 1.2 : 0));
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'sink') {
    set(e, 'sinkTele', C.sink.tele);
    e.sinkCD = byPh(C.sink.cd, e);
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  }
}

// The sceptre comes down: the crush lands (its zone), the first shockwave sets off, more follow.
function slam(w, e) {
  const A = w.level.arena;
  set(e, 'stuck', byPh(C.slam.stuck, e));
  e.waveQ = byPh(C.slam.waves, e); e.waveT = 0;
  w.events.push({ type: 'bossSlam', x: e.wx, y: A.floor, z: e.wz, r: C.slam.crushR });
}
// Shockwave rings: launched from the slam point every `gap` s; each grows at `speed` and hits a
// player on the floor (below `height`) as its 1.8 m band passes them (once per ring).
function waves(w, e, dt) {
  const P = w.player, A = w.level.arena, S = C.slam;
  if (e.waveQ > 0 && e.state !== 'dying') {
    e.waveT -= dt;
    if (e.waveT <= 0) { e.waveQ--; e.waveT = S.gap; e.waves.push({ x: e.wx, z: e.wz, r: S.crushR * 0.6, hit: false }); w.events.push({ type: 'zoneHit', kind: 'wave', x: e.wx, y: A.floor, z: e.wz, r: S.crushR }); }
  }
  let n = 0;
  for (const q of e.waves) {
    q.r += S.speed * dt;
    if (q.r > S.maxR) continue;
    e.waves[n++] = q;
    if (q.hit || P.dead) continue;
    const dx = P.x - q.x, dz = P.z - q.z, d = Math.sqrt(dx * dx + dz * dz);
    if (Math.abs(d - q.r) < S.band + T.RADIUS && P.y < A.floor + S.height) { q.hit = true; hurtPlayer(w, 1, q.x, q.z, 8); }
  }
  e.waves.length = n;
}

// Scarabs crawl out of the two glowing jars (walkers; spikers from phase 2), toward the hall's middle.
function scarabs(w, e) {
  const A = w.level.arena, cx = (A.x0 + A.x1) / 2, cz = (A.z0 + A.z1) / 2;
  let k = byPh(C.summon.n, e);
  for (const i of e.pickJars || []) {
    if (k <= 0 || alive(w, e.minions) >= byPh(C.summon.cap, e)) break;
    const j = e.jars[i], dx = cx - j.x, dz = cz - j.z, l = Math.sqrt(dx * dx + dz * dz) || 1;
    const x = j.x + (dx / l) * C.summon.out, z = j.z + (dz / l) * C.summon.out;
    const type = e.phase >= 2 && (e.minions.length % 2 === 1) ? 'spiker' : 'walker';
    e.minions.push(spawn(w, { type, x, y: A.floor, z }).id);
    w.events.push({ type: 'impact', kind: 'shield', x, y: A.floor + 1, z, nx: 0, ny: 1, nz: 0 });
    k--;
    if (k > 0 && e.phase === 3 && alive(w, e.minions) < byPh(C.summon.cap, e)) { // a third from the same jar, the other side
      e.minions.push(spawn(w, { type: 'walker', x: j.x - (dz / l) * C.summon.out, y: A.floor, z: j.z + (dx / l) * C.summon.out }).id);
      k--;
    }
  }
}

// ------------------------------------------------------------------ the eyes
function eyeAt(w, e) {
  const B = e.beam, A = w.level.arena;
  B.ox = e.cx + e.fx * C.eyeFwd; B.oy = A.floor + C.eyeUp - e.sink * C.sink.depth; B.oz = e.cz + e.fz * C.eyeFwd;
}
// Turn the gaze (B.dx, dy, dz) toward (tx, ty, tz) by at most maxA radians (a slerp on the sphere).
function aimAt(w, e, tx, ty, tz, maxA) {
  const B = e.beam;
  let ax = tx - B.ox, ay = ty - B.oy, az = tz - B.oz;
  const l = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
  ax /= l; ay /= l; az /= l;
  const cl = Math.sqrt(B.dx * B.dx + B.dy * B.dy + B.dz * B.dz);
  if (cl < 0.5) { B.dx = ax; B.dy = ay; B.dz = az; return; }
  const dot = clamp(B.dx * ax + B.dy * ay + B.dz * az, -1, 1), ang = Math.acos(dot);
  if (ang <= maxA || ang < 1e-6) { B.dx = ax; B.dy = ay; B.dz = az; return; }
  const f = maxA / ang, s = Math.sin(ang), a = Math.sin((1 - f) * ang) / s, b = Math.sin(f * ang) / s;
  let nx = B.dx * a + ax * b, ny = B.dy * a + ay * b, nz = B.dz * a + az * b;
  const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  B.dx = nx / nl; B.dy = ny / nl; B.dz = nz / nl;
}
function castBeam(w, e) {
  const B = e.beam, hit = raycast(w.plats, B.ox, B.oy, B.oz, B.dx, B.dy, B.dz, C.beam.len);
  B.len = hit ? hit.t : C.beam.len;
}

// ------------------------------------------------------------------ the registry hooks
// Health ran out: the standard defeat; it climbs out of the sand to die, and its scarabs and drones
// blow up with it.
export function down(w, e) {
  if (e.state === 'dying') return;
  const under = e.sink > 0.05;
  stdDown(w, e);
  if (under) { e.surf = 'air'; e.vy = 0; } // (dyingTick lifts it back onto the floor)
  e.waves.length = 0; e.waveQ = 0; e.ward = 0; e.swirl = null; e.noContact = false;
  for (const m of w.enemies) {
    if (m.dead || m === e || !e.minions.includes(m.id)) continue;
    m.dead = true; m.deadT = 0; m.hp = 0;
    w.events.push({ type: 'explode', x: m.x, y: m.y + m.top * 0.5, z: m.z, r: 2 });
  }
}

// The ankh ward: shots arriving within 120° of its face glance off (its back is open).
export function blocks(w, e, s) {
  if (!(e.ward > 0)) return false;
  const hs = Math.sqrt(s.vx * s.vx + s.vz * s.vz);
  if (hs < 1e-6) return true; // straight down onto it: the dome of the ward takes it
  return (s.vx * e.fx + s.vz * e.fz) / hs < C.ward.cos; // a shot travelling along its facing came from behind
}

// You bounce off its head unless it's under the sand (or getting there, or coming out).
export const stompable = (e) => !['intro', 'dying', 'sinking', 'under', 'rise'].includes(e.state);

export default { init, update, down, stompable, blocks, tuning };
