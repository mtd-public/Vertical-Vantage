// POLARIS: the ARCTIC VAULT's boss, the seed vault's polar-bear warden mech, loose in the cold-storage
// cavern. Pure (no three.js, no DOM, no Math.random: w.rng only).
//
// A 9 m bear of white armour plates over a frosted chassis. It prowls on all fours and fights like a
// bear: it rears up and swipes, breathes frost, belly-slides across the ice, pounds the floor so ice
// spikes burst up in rings, rips up blocks of ice and lobs them, and when it's badly hurt it whips up
// a blizzard and stalks you through it, only its visor showing (shots land on the visor, nowhere else).
// Its plates soak most of a shot; after every big attack they lift off the chassis (the punish window,
// ×1.5). Its back is the stomp target: a stomp while it's winding up knocks it off its stride (it
// reels, then shakes you off).
//
//   prowl ─┬─ rearTele (rears up: claw ring in front) → swipe1 → swipe2 (a second ring where you went)
//          │      → winded (punish)
//          ├─ breathTele (inhales; the cone shows where the sweep starts) → breath (a frost cone sweeps
//          │      across you: get a column between you, or outrun it) → vent (punish: frost vents open)
//          ├─ slideTele (flat on its belly, the lane locks) → slide (low and fast: jump it, or stomp it)
//          │      → beached (punish) | crash into a column or wall (a longer punish)
//          │      phase 3: one ricochet off whatever it hits before it stops
//          ├─ poundTele (rears up high; the shock ring and the spike rings show) → pound (phase 2+: rings
//          │      of ice spikes burst outward one after another: stand in a gap or jump) → recover (punish)
//          ├─ hurlTele (rips up a block of ice) → hurl (1–3 blocks lobbed onto red rings where you'll be)
//          └─ blizzardTele (phase 3) → stalk (circles you in the snow, only the visor shows)
//                 → lungeTele (the visor flares, a ring on you) → lunge → maul (stompable) → stalk …
//                 → dazed (hurt it enough in the blizzard: it ends) or out of the snow (time's up)
//   a stomp while it prowls or winds up → reel (punish) → shakeTele (it shakes; a ring at back height)
//   phases by health: 1 (> 62 %), 2 (> 30 %: the pound and its spike rings, two drones),
//   3 (the blizzard, three spike rings, ricochet slides, three blocks, two more drones)
import { T } from '../tuning.js';
import { clamp } from '../util.js';
import { groundBelow } from '../plats.js';
import { hurtPlayer } from '../player.js';
import { initPose, introTick, phaseTick, pick, turnTo, pushSolids, openSpot, zone, spawn, down, dyingTick, syncPose, sees } from './common.js';

// Every number, and why it has that value. (Exported: it lands in data/tuning.json as BOSSES.polaris.)
export const tuning = {
  hp: 320, // the blaster does ~6.7/s: with the plates shut (×0.25) most of the time and open (×1.5) in the windows, ~90 s of
  //           perfect aim that never dodges; dodging, the blizzard (visor-only) and stomps make it a 2.5–3.5 min fight.
  r: 3.0, // hit / stomp radius: its body is 7 m long, the capsule covers the chest and back.
  top: 4.2, rearTop: 8.6, lowTop: 2.4, // its back on all fours (a double jump, or a hop from a stump); reared up; flat on its belly (a single jump).
  bodyR: 2.6, // what it can't walk or slide through (the columns, stumps, crates).
  intro: 2.4, // it shakes the frost off before the roar.
  margin: 4.5, // how close to the cavern walls its body comes.
  cuts: [0.62, 0.3], // phase 2 below 62 %, phase 3 below 30 %.
  speed: [3.6, 4.3, 5.0], // prowling speed by phase: you outrun it easily (8.5).
  turn: [1.8, 2.2, 2.6], // rad/s: circle it close and you get round to its flank.
  keep: 6.5, // it stops closing in here and squares up.
  prowl: [[1.8, 2.6], [1.4, 2.1], [1.0, 1.6]], // seconds of prowling between attacks, by phase.
  swipe: {
    tele: [0.85, 0.72, 0.62], // rearing up: the first claw ring fills in front of it (≥ 0.6 s).
    reach: 3.4, r: 4.0, // the first ring's centre ahead of it and its radius: back off 8 m, or jump it.
    second: 0.55, reach2: 5.0, r2: 3.4, // the second ring lands where you went (no further than 5 m ahead), 0.55 s after the first.
    height: 2.4, knock: 11, // a hop over the claws (a single jump clears 2.4 m near its top); a big shove if they connect.
    winded: [1.8, 1.6, 1.4], // dropped back on all fours, panting: the punish window.
  },
  breath: {
    tele: [1.0, 0.85, 0.75], // it inhales and the cone shows where the sweep starts.
    time: [1.8, 1.7, 1.6], sweep: 1.3, // the cone sweeps 1.3 rad (75°) through you in this long: 0.7–0.8 rad/s (a run round it outpaces that within 11 m).
    half: 0.2, range: 24, // a 23° cone, 24 m long; geometry blocks it (sees from the mouth): stand behind a column.
    mouth: 3.4, mouthY: 3.0, // the mouth: this far ahead of its centre, this high off the floor.
    knock: 4, // a cold shove (1 damage per hit; the blink after a hit stops it chaining).
    vent: [1.8, 1.6, 1.4], // after the breath its frost vents open (×1.5): the punish window.
  },
  slide: {
    tele: [0.95, 0.82, 0.72], lock: 0.35, // flat on its belly; the last 0.35 s its aim is locked (the lane goes solid): your cue.
    speed: [20, 22, 24], // launch speed (m/s), decelerating to a stop: over twice your run, so jump it or sidestep, don't outrun it.
    overshoot: 9, minRun: 12, maxRun: 40, // it slides to where you were plus 9 m (overshoots: exposed, far from you).
    nose: 2.6, hitR: 2.2, height: 2.2, dmg: 2, knock: 13, // its head-first front (this far ahead, this wide) runs you down below 2.2 m: a single jump as it
    //                                                       arrives clears it (you come down behind it, or on its back: a stomp); caught, 2 cells.
    beached: [2.6, 2.3, 2.0], crash: [3.2, 2.8, 2.4], // it stops on its belly / slams into a column or the wall: the punish windows.
    ricochet: [0, 0, 1], bounce: 0.8, after: 14, // phase 3: it glances off the first thing it hits at 80 % speed and slides on 14 m.
    getUp: 0.5, // scrambling back onto its feet.
  },
  pound: {
    tele: [1.0, 0.9, 0.8], // reared up high, both paws raised: the shock ring and the spike rings show.
    r: 4.8, height: 1.4, knock: 10, // the shock ring round its feet: jump it or be clear.
    rings: [0, 2, 3], // spike rings by phase (phase 1: just the pound).
    band: [[5.5, 8.5], [11, 14], [16.5, 19.5]], // each ring's inner and outer radius: the gaps between are safe ground.
    delay: [0.55, 0.95, 1.35], // after the pound, each ring bursts this much later (outward, one after another).
    spikeH: 1.6, // spikes reach 1.6 m up: a hop as one bursts under you clears it.
    linger: 0.9, // the spikes stand this long before they shatter (scenery: they hit as they burst).
    recover: [1.6, 1.4, 1.2], // it shakes its paws after the pound: the punish window.
  },
  hurl: {
    tele: [0.8, 0.7, 0.6], // it rips up a block of ice and raises it.
    n: [1, 2, 3], gap: 0.45, // blocks per attack by phase, this far apart.
    flight: 1.15, r: 2.4, lead: 0.5, // each lands this long after the throw on a red ring where you'll be (leading you 0.5 s): change direction.
    dmg: 2, knock: 10, height: 2.5,
    after: 0.5, // a beat after the last throw.
  },
  blizzard: {
    tele: 1.2, // it roars and the snow whips up (not stompable).
    time: 12, // seconds of blizzard: it's out of the snow after this…
    breakDmg: 14, // …or as soon as you've hurt it this much in it (shoot the visor): then it's dazed.
    cd: 32, // seconds before the next blizzard (phase 3).
    circleR: 13, speed: 8, // it circles you this far out, about as fast as you run.
    every: [2.0, 2.8], // seconds of stalking between lunges.
    lungeTele: 0.75, flight: 0.5, // the visor flares and a ring lands on you; it pounces 0.75 s later and lands 0.5 s after that (1.25 s to get out of a 3.2 m ring).
    lungeR: 3.2, dmg: 2, knock: 12, height: 2.6, leap: 3.2, // the pounce's ring; how high it arcs.
    maul: 0.85, // it lands and mauls the spot: stompable, a beat to punish.
    dazed: 2.2, // the blizzard broken: dazed (×1.5, stompable).
  },
  stomp: {
    bonus: 4, bonusOpen: 10, cd: 3.5, // extra damage for a stomp on its back (the stomp itself does 4): more while it's down.
    reel: 1.3, reelCD: 6, // a stomp while it prowls or winds up staggers it (×1.5), at most once per 6 s…
    shakeTele: 0.6, shakeR: 4.6, shakeH: 4, shakeKnock: 12, // …then it shakes like a wet dog: anyone on (or over) its back is thrown off.
  },
  vulnOpen: 1.5, // damage × in every punish window (its plates lifted off the chassis).
  plates: 0.25, // damage × the rest of the time: the white plates soak most of a shot (the stomp bonus still bites). The windows
  //               (19 % of the fight) and stomps are where it really gets hurt.
  visorR: 1.4, // in the blizzard only shots passing this close to its visor land (the rest are lost in the snow).
  minions: [0, 2, 2], // drones that join as phases 2 and 3 begin.
};
const C = tuning;
const _spot = [0, 0];

const OPEN = new Set(['winded', 'vent', 'beached', 'crash', 'recover', 'reel', 'dazed', 'maul']);
const INTERRUPT = new Set(['prowl', 'breathTele', 'hurlTele', 'slideTele', 'roar']);
const NOSTOMP = new Set(['intro', 'dying', 'rearTele', 'swipe1', 'swipe2', 'poundTele', 'pound', 'blizzardTele', 'stalk', 'lungeTele', 'lunge', 'shakeTele']);

const ph = (a, e) => a[Math.min(a.length - 1, e.phase - 1)];
function set(e, state, dur) { e.state = state; e.timer = dur; e.dur = dur; e.st = 0; }

export function init(w, e, d) {
  initPose(w, e, d, { hp: C.hp, r: C.r, top: C.top, bodyH: C.top / 2, intro: C.intro });
  const A = w.level.arena;
  Object.assign(e, {
    st: 0, dur: C.intro, floorY: A ? A.floor : d.y ?? 0, last: '', stompN: w.stats.stomps, bonusCD: 0, reelCD: 0,
    roarDue: false, blizDue: false, blizCD: 0, bliz: 0, blizOn: 0, blizT: 0, blizHp: 0, lungeT: 0,
    lx0: 0, lz0: 0, lx1: 0, lz1: 0, hpMark: 0,
    breathA: 0, breathDir: 1, breathA0: 0, breathPitch: 0, breathOn: false,
    sx: 1, sz: 0, slideV: 0, slideA: 0, slideD: 0, ricochets: 0, hitP: false, laneLen: 0,
    left: 0, dropT: 0, rings: [], lobs: [], vent: 0, gait: 0,
  });
  e.fx = -1; e.fz = 0; // faces the way you come in (west)
  syncPose(e);
}

// ------------------------------------------------------------------ helpers
// Its height: on all fours, reared up, or flat on its belly. Feet on the floor; the centre follows.
function stance(e, s) {
  e.top = s === 'rear' ? C.rearTop : s === 'low' ? C.lowTop : C.top;
  e.bodyH = e.top / 2;
  e.cy = e.floorY + e.bodyH;
}
// Move by (mx, mz): kept in the arena, pushed out of the columns, stumps and crates. Returns the push
// (ox, oz) when something stopped it (else null).
function move(w, e, mx, mz, gx = 0, gz = 0) {
  const A = w.level.arena, m = C.margin;
  const wx = e.cx + mx, wz = e.cz + mz;
  e.cx = clamp(wx, A.x0 + m, A.x1 - m); e.cz = clamp(wz, A.z0 + m, A.z1 - m);
  pushSolids(w, e, C.bodyR, gx, gz, (gx || gz) ? Math.sqrt(mx * mx + mz * mz) * 0.7 : 0);
  const ox = e.cx - wx, oz = e.cz - wz;
  return ox * ox + oz * oz > 0.0025 ? [ox, oz] : null;
}
// Walk toward (tx, tz): turn at `rate`, step forward only as far as it faces the way (a bear doesn't strafe).
function walk(w, e, tx, tz, speed, rate, dt) {
  turnTo(e, tx, tz, rate, dt);
  if (speed <= 0) return;
  const dx = tx - e.cx, dz = tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
  if (d < 1.2) return;
  const k = Math.max(0, (e.fx * dx + e.fz * dz) / d);
  const s = speed * (0.35 + 0.65 * k) * dt;
  move(w, e, e.fx * s, e.fz * s, dx / d, dz / d);
  e.gait += s;
}
const distTo = (e, P) => { const dx = P.x - e.cx, dz = P.z - e.cz; return Math.sqrt(dx * dx + dz * dz); };
// The deck under a point (for the block rings: they land on the ledge you stand on).
function deckY(w, x, z, y) { const g = groundBelow(w.plats, x, z, y); return g ? g.h + g.oy : w.level.arena.floor; }
function mouth(e) { return [e.cx + e.fx * C.breath.mouth, e.floorY + C.breath.mouthY, e.cz + e.fz * C.breath.mouth]; }

// Did your stomp land on its back last step? (contact() runs after update, so we see it now.)
function stomped(w, e, dt) {
  e.bonusCD = Math.max(0, e.bonusCD - dt); e.reelCD = Math.max(0, e.reelCD - dt);
  const n = w.stats.stomps;
  if (n === e.stompN) return;
  e.stompN = n;
  if (w.player.lock !== e || e.state === 'dying') return;
  const open = OPEN.has(e.state);
  if (e.bonusCD <= 0) {
    e.bonusCD = C.stomp.cd;
    e.hp -= open ? C.stomp.bonusOpen : C.stomp.bonus; e.flash = 0.2;
    w.events.push({ type: 'hit', kind: 'boss', x: e.cx, y: e.floorY + e.top, z: e.cz });
    if (e.hp <= 0) { down(w, e); return; }
  }
  if (e.state === 'maul') { endBlizzard(w, e, true); return; } // found it in the snow and landed on it
  if (INTERRUPT.has(e.state) && e.reelCD <= 0) { e.reelCD = C.stomp.reelCD; set(e, 'reel', C.stomp.reel); }
}

// ------------------------------------------------------------------ the step
export function update(w, e, dt) { // (updateEnemies has already advanced e.t and e.flash)
  const A = w.level.arena, P = w.player;
  e.bliz += (e.blizOn - e.bliz) * Math.min(1, dt * 1.6);
  tickRings(w, e, dt);
  for (const L of e.lobs) L.t -= dt;
  if (e.lobs.length && e.lobs[0].t <= 0) e.lobs = e.lobs.filter((L) => L.t > 0);
  if (e.state === 'dying') { dyingTick(w, e, dt); e.blizOn = 0; e.breathOn = false; e.vent = Math.max(0, e.vent - dt); e.rings.length = 0; e.lobs.length = 0; return; }
  if (e.state === 'intro') {
    e.st += dt;
    if (introTick(w, e, dt, 'prowl', 1.2)) { if (e.state !== 'intro') { e.dur = e.timer; e.st = 0; } syncPose(e); return; }
  }
  stomped(w, e, dt);
  if (e.state === 'dying') return;
  if (phaseTick(w, e, C.cuts)) { // reinforcements; phase 3 calls the blizzard
    for (let i = 0; i < ph(C.minions, e); i++) {
      const a = w.rng() * Math.PI * 2;
      spawn(w, { type: 'drone', x: Math.cos(a) * 22, y: 11, z: Math.sin(a) * 15 });
    }
    if (e.phase === 3) { e.blizDue = true; e.blizCD = 0; } else e.roarDue = true;
  }
  e.blizCD = Math.max(0, e.blizCD - dt);
  e.st += dt; e.timer -= dt;
  if (e.blizOn) e.blizHp = e.hpMark - e.hp; // what it has taken in the snow (shots and stomps)
  let vuln = C.plates, height = 'stand', contact = true;
  e.breathOn = false;
  e.vent = Math.max(0, e.vent - dt * 0.8);
  switch (e.state) {
    case 'prowl': {
      if (e.roarDue) { e.roarDue = false; set(e, 'roar', 1.2); w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); break; }
      if (e.blizDue && e.blizCD <= 0) { startBlizzard(w, e); break; }
      const d = distTo(e, P);
      openSpot(w, P.x, P.z, C.bodyR, _spot, A.floor, A.floor + C.top);
      walk(w, e, _spot[0], _spot[1], d > C.keep ? ph(C.speed, e) : 0, ph(C.turn, e), dt);
      if (e.timer <= 0) decide(w, e);
      break;
    }
    case 'roar': height = 'rear'; if (e.timer <= 0) set(e, 'prowl', 0.6); break;
    // ---- the swipe combo
    case 'rearTele': height = 'rear'; turnTo(e, P.x, P.z, ph(C.turn, e) * 0.4, dt); if (e.timer <= 0) secondSwipe(w, e); break;
    case 'swipe1': height = 'rear'; turnTo(e, P.x, P.z, ph(C.turn, e), dt); if (e.timer <= 0) set(e, 'swipe2', 0.3); break;
    case 'swipe2': height = 'rear'; if (e.timer <= 0) set(e, 'winded', ph(C.swipe.winded, e)); break;
    // ---- the frost breath
    case 'breathTele': {
      const t = e.breathA0; // turn the head to where the sweep starts
      turnTo(e, e.cx + Math.cos(t), e.cz + Math.sin(t), 3, dt);
      if (e.timer <= 0) { set(e, 'breath', ph(C.breath.time, e)); w.events.push({ type: 'bossLaser', x: e.cx, y: e.cy, z: e.cz }); }
      break;
    }
    case 'breath': {
      const k = Math.min(1, e.st / e.dur);
      e.breathA = e.breathA0 + e.breathDir * C.breath.sweep * k;
      e.fx = Math.cos(e.breathA); e.fz = Math.sin(e.breathA);
      e.breathOn = true;
      breathHit(w, e);
      if (e.timer <= 0) { set(e, 'vent', ph(C.breath.vent, e)); e.vent = 1; }
      break;
    }
    // ---- the belly slide
    case 'slideTele': {
      height = 'low';
      if (e.timer > C.slide.lock) turnTo(e, P.x, P.z, 3.2, dt);
      else if (!e.laneLen) lockSlide(w, e);
      if (e.timer <= 0) { if (!e.laneLen) lockSlide(w, e); launch(e); set(e, 'slide', 9); w.events.push({ type: 'bossLeap', x: e.cx, y: A.floor + 1, z: e.cz }); }
      break;
    }
    case 'slide': height = 'low'; slide(w, e, dt); break;
    case 'getUp': height = 'low'; if (e.timer <= 0) next(w, e); break;
    // ---- the ground pound
    case 'poundTele': height = 'rear'; if (e.timer <= 0) { set(e, 'pound', 0.35); w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: C.pound.r }); } break;
    case 'pound': if (e.timer <= 0) set(e, 'recover', ph(C.pound.recover, e)); break;
    // ---- the hurled blocks
    case 'hurlTele': turnTo(e, P.x, P.z, ph(C.turn, e) * 1.4, dt); if (e.timer <= 0) { set(e, 'hurl', 0.5); e.left = ph(C.hurl.n, e); e.dropT = 0; } break;
    case 'hurl': {
      turnTo(e, P.x, P.z, ph(C.turn, e), dt);
      e.dropT -= dt;
      if (e.left > 0 && e.dropT <= 0) { e.left--; e.dropT = C.hurl.gap; e.timer = Math.max(e.timer, C.hurl.gap + 0.1); throwBlock(w, e); }
      if (e.left <= 0 && e.timer <= 0) set(e, 'hurlEnd', C.hurl.after);
      break;
    }
    case 'hurlEnd': if (e.timer <= 0) next(w, e); break;
    // ---- the blizzard
    case 'blizzardTele': height = 'rear'; if (e.timer <= 0) { set(e, 'stalk', 0); e.lungeT = C.blizzard.every[0] + w.rng() * (C.blizzard.every[1] - C.blizzard.every[0]); } break;
    case 'stalk': {
      e.blizT -= dt;
      // circle the player at circleR (the side it's on), a little ahead each step
      const dx = e.cx - P.x, dz = e.cz - P.z, d = Math.sqrt(dx * dx + dz * dz) || 1;
      const a = Math.atan2(dz, dx) + 0.5;
      const tx = P.x + Math.cos(a) * C.blizzard.circleR, tz = P.z + Math.sin(a) * C.blizzard.circleR;
      walk(w, e, tx, tz, C.blizzard.speed, 3.4, dt);
      e.lungeT -= dt;
      if (e.blizHp >= C.blizzard.breakDmg) { endBlizzard(w, e, true); break; }
      if (e.blizT <= 0) { endBlizzard(w, e, false); break; }
      if (e.lungeT <= 0 && d < C.blizzard.circleR + 8) {
        set(e, 'lungeTele', C.blizzard.lungeTele);
        e.lx1 = P.x; e.lz1 = P.z;
        zone(w, P.x, deckY(w, P.x, P.z, P.y + 0.6), P.z, C.blizzard.lungeR, C.blizzard.lungeTele + C.blizzard.flight, { dmg: C.blizzard.dmg, knock: C.blizzard.knock, height: C.blizzard.height, kind: 'lunge' });
        w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
      }
      break;
    }
    case 'lungeTele': turnTo(e, e.lx1, e.lz1, 4, dt); if (e.timer <= 0) { set(e, 'lunge', C.blizzard.flight); e.lx0 = e.cx; e.lz0 = e.cz; w.events.push({ type: 'bossLeap', x: e.cx, y: A.floor + 1, z: e.cz }); } break;
    case 'lunge': {
      contact = false;
      const k = Math.min(1, e.st / e.dur);
      const dx = e.lx1 - e.lx0, dz = e.lz1 - e.lz0, d = Math.sqrt(dx * dx + dz * dz) || 1;
      const stop = Math.max(0, d - 2.2) / d; // it lands with its paws on the ring, not on top of it
      const nx = e.lx0 + dx * stop * k, nz = e.lz0 + dz * stop * k;
      e.cy = e.floorY + C.top / 2 + C.blizzard.leap * 4 * k * (1 - k); // (its height first: it sails over a crate, lands clear of it)
      move(w, e, nx - e.cx, nz - e.cz);
      e.surf = 'air'; // (if it's shot down mid-pounce it falls)
      if (e.timer <= 0) { set(e, 'maul', C.blizzard.maul); e.surf = 'floor'; w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: 3 }); }
      break;
    }
    case 'maul': vuln = 1; move(w, e, 0, 0); if (e.timer <= 0) { if (e.blizT > 0 && e.blizHp < C.blizzard.breakDmg) { set(e, 'stalk', 0); e.lungeT = C.blizzard.every[0] + w.rng() * (C.blizzard.every[1] - C.blizzard.every[0]); } else endBlizzard(w, e, e.blizHp >= C.blizzard.breakDmg); } break;
    // ---- punish windows
    case 'winded': case 'vent': case 'recover': case 'dazed': vuln = C.vulnOpen; if (e.timer <= 0) next(w, e); break;
    case 'beached': case 'crash': height = 'low'; vuln = C.vulnOpen; if (e.timer <= 0) set(e, 'getUp', C.slide.getUp); break;
    case 'reel': {
      vuln = C.vulnOpen;
      move(w, e, -e.fx * 1.4 * dt, -e.fz * 1.4 * dt); // staggers back a step
      if (e.timer <= 0) {
        set(e, 'shakeTele', C.stomp.shakeTele);
        w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
        zone(w, e.cx, A.floor + C.top - 1.6, e.cz, C.stomp.shakeR, C.stomp.shakeTele, { height: C.stomp.shakeH, knock: C.stomp.shakeKnock, kind: 'shake' });
      }
      break;
    }
    case 'shakeTele': if (e.timer <= 0) set(e, 'prowl', 0.9); break;
    default: set(e, 'prowl', 1);
  }
  if (e.state !== 'lunge') { stance(e, height); pushSolids(w, e, C.bodyR); } // (standing up under a ledge: it's shoved clear)
  else { e.top = C.top; e.bodyH = C.top / 2; }
  e.vuln = vuln;
  e.noContact = !contact;
  syncPose(e);
}

// ------------------------------------------------------------------ choosing
function next(w, e) {
  const g = ph(C.prowl, e);
  set(e, 'prowl', g[0] + w.rng() * (g[1] - g[0]));
}
function decide(w, e) {
  const P = w.player, A = w.level.arena;
  const d = distTo(e, P), high = P.y > A.floor + 3.2; // up on a stump, a crate or a ledge
  const opts = [];
  const add = (k, wt) => opts.push([k, k === e.last ? wt * 0.35 : wt]);
  if (!high && d < 10) add('swipe', 4);
  if (d > 5 && d < C.breath.range - 2) add('breath', high ? 3.5 : 2.5);
  if (!high && d > 9) add('slide', e.phase === 1 ? 2.5 : 3);
  if (e.phase >= 2 && d < 18) add('pound', high ? 1.5 : 3);
  if (d > 9 || high) add('hurl', high ? 3.5 : 2);
  if (!opts.length) add('hurl', 1);
  attack(w, e, pick(w, opts));
}
function attack(w, e, kind) {
  const A = w.level.arena, P = w.player, f = A.floor;
  e.last = kind;
  if (kind === 'swipe') {
    const t = ph(C.swipe.tele, e);
    set(e, 'rearTele', t);
    zone(w, e.cx + e.fx * C.swipe.reach, f, e.cz + e.fz * C.swipe.reach, C.swipe.r, t, { height: C.swipe.height, knock: C.swipe.knock, kind: 'swipe' });
    w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'breath') {
    set(e, 'breathTele', ph(C.breath.tele, e));
    const [mx, my, mz] = mouth(e);
    const dx = P.x - e.cx, dz = P.z - e.cz, hd = Math.sqrt(dx * dx + dz * dz) || 1;
    const aim = Math.atan2(dz, dx);
    e.breathDir = w.rng() < 0.5 ? -1 : 1;
    e.breathA0 = aim - e.breathDir * C.breath.sweep / 2;
    e.breathA = e.breathA0;
    e.breathPitch = clamp(Math.atan2(P.y + 1 - my, Math.max(1, hd - C.breath.mouth)), -0.3, 0.7);
    w.events.push({ type: 'bossTele', x: mx, y: my, z: mz });
  } else if (kind === 'slide') {
    set(e, 'slideTele', ph(C.slide.tele, e));
    e.laneLen = 0;
    w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
  } else if (kind === 'pound') {
    const t = ph(C.pound.tele, e);
    set(e, 'poundTele', t);
    zone(w, e.cx, f, e.cz, C.pound.r, t, { height: C.pound.height, knock: C.pound.knock, kind: 'wave' });
    for (let k = 0; k < ph(C.pound.rings, e); k++) {
      const [r0, r1] = C.pound.band[k], tt = t + C.pound.delay[k];
      e.rings.push({ x: e.cx, y: f, z: e.cz, r0, r1, t: tt, max: tt, h: C.pound.spikeH, burst: false, life: C.pound.linger });
    }
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
    w.events.push({ type: 'zoneTele', kind: 'spikes', x: e.cx, y: f, z: e.cz, r: C.pound.band[0][1] });
  } else if (kind === 'hurl') {
    set(e, 'hurlTele', ph(C.hurl.tele, e));
    w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
  }
}

// ------------------------------------------------------------------ the moves
function secondSwipe(w, e) {
  const P = w.player, A = w.level.arena;
  set(e, 'swipe1', 0.3);
  // the second claw lands where you went: on you, but no further than reach2 ahead of its chest
  let dx = P.x - e.cx, dz = P.z - e.cz;
  const d = Math.sqrt(dx * dx + dz * dz) || 1;
  const k = Math.min(d, C.swipe.reach2) / d;
  dx *= k; dz *= k;
  zone(w, e.cx + dx, A.floor, e.cz + dz, C.swipe.r2, C.swipe.second, { height: C.swipe.height, knock: C.swipe.knock, kind: 'swipe' });
}

// The frost cone: you're in it if you're within its half-angle of the axis, in range, and nothing
// solid stands between its mouth and you.
function breathHit(w, e) {
  const P = w.player;
  if (P.dead || P.inv > 0) return;
  const [mx, my, mz] = mouth(e);
  const dx = P.x - mx, dy = P.y + 1 - my, dz = P.z - mz;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d > C.breath.range || d < 0.01) return;
  const cp = Math.cos(e.breathPitch);
  const ax = Math.cos(e.breathA) * cp, ay = Math.sin(e.breathPitch), az = Math.sin(e.breathA) * cp;
  const cos = (dx * ax + dy * ay + dz * az) / d;
  const widen = Math.atan2(T.RADIUS + 0.4, d); // your body's own width
  if (cos < Math.cos(C.breath.half + widen) && d > 2.2) return;
  if (!sees(w, mx, my, mz)) return; // a column (or a ledge, a crate) is in the way
  if (hurtPlayer(w, 1, mx, mz, C.breath.knock)) w.events.push({ type: 'zap', x: P.x, y: P.y + 1, z: P.z });
}

// Lock the slide's line: where you are now, plus the overshoot, inside the run limits.
function lockSlide(w, e) {
  const P = w.player;
  const d = distTo(e, P);
  e.sx = e.fx; e.sz = e.fz;
  e.slideD = clamp(d + C.slide.overshoot, C.slide.minRun, C.slide.maxRun);
  e.laneLen = e.slideD;
  e.ricochets = 0;
}
function launch(e) {
  const v = ph(C.slide.speed, e);
  e.slideV = v; e.slideA = v * v / (2 * e.slideD); e.hitP = false;
}
function slide(w, e, dt) {
  const P = w.player, A = w.level.arena;
  e.slideV = Math.max(0, e.slideV - e.slideA * dt);
  const s = e.slideV * dt;
  e.fx = e.sx; e.fz = e.sz;
  const hit = move(w, e, e.sx * s, e.sz * s);
  e.gait += s;
  if (!e.hitP && !P.dead) { // low and fast, head first: jump it
    const fx = e.cx + e.sx * C.slide.nose, fz = e.cz + e.sz * C.slide.nose;
    const dx = P.x - fx, dz = P.z - fz, rr = C.slide.hitR + T.RADIUS;
    if (dx * dx + dz * dz < rr * rr && P.y < A.floor + C.slide.height && P.y + T.HEIGHT > A.floor) { e.hitP = true; hurtPlayer(w, C.slide.dmg, e.cx, e.cz, C.slide.knock); }
  }
  if (hit && e.slideV > 6) {
    if (e.ricochets < ph(C.slide.ricochet, e)) { // glance off it like a puck
      const l = Math.sqrt(hit[0] * hit[0] + hit[1] * hit[1]) || 1, nx = hit[0] / l, nz = hit[1] / l;
      const dot = e.sx * nx + e.sz * nz;
      if (dot < 0) { e.sx -= 2 * dot * nx; e.sz -= 2 * dot * nz; }
      const sl = Math.sqrt(e.sx * e.sx + e.sz * e.sz) || 1; e.sx /= sl; e.sz /= sl;
      e.ricochets++; e.slideV *= C.slide.bounce; e.slideA = e.slideV * e.slideV / (2 * C.slide.after); e.laneLen = C.slide.after; e.hitP = false;
      w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: 2.5 });
      return;
    }
    set(e, 'crash', ph(C.slide.crash, e));
    w.events.push({ type: 'bossSlam', x: e.cx + e.sx * 2, y: A.floor, z: e.cz + e.sz * 2, r: 4 });
    return;
  }
  if (e.slideV <= 0.05 || e.timer <= 0) set(e, 'beached', ph(C.slide.beached, e));
}

function throwBlock(w, e) {
  const P = w.player, A = w.level.arena, H = C.hurl;
  const tx = clamp(P.x + P.vx * H.lead, A.x0 + 1.5, A.x1 - 1.5), tz = clamp(P.z + P.vz * H.lead, A.z0 + 1.5, A.z1 - 1.5);
  const ty = deckY(w, tx, tz, P.y + 1.2);
  const hx = e.cx + e.fx * 1.6, hz = e.cz + e.fz * 1.6, hy = A.floor + C.rearTop - 0.6;
  zone(w, tx, ty, tz, H.r, H.flight, { dmg: H.dmg, knock: H.knock, height: H.height, kind: 'block' });
  e.lobs.push({ x0: hx, y0: hy, z0: hz, x: tx, y: ty, z: tz, t: H.flight, max: H.flight });
  w.events.push({ type: 'enemyFire', from: 'boss', x: hx, y: hy, z: hz });
}

// The spike rings: each bursts once (hurting you if you stand in its band, low enough), then stands a moment.
function tickRings(w, e, dt) {
  if (!e.rings.length) return;
  const P = w.player;
  let n = 0;
  for (const R of e.rings) {
    R.t -= dt;
    if (!R.burst && R.t <= 0) {
      R.burst = true;
      const dx = P.x - R.x, dz = P.z - R.z, d = Math.sqrt(dx * dx + dz * dz);
      if (!P.dead && d >= R.r0 - T.RADIUS && d <= R.r1 + T.RADIUS && P.y < R.y + R.h && P.y + T.HEIGHT > R.y - 0.5) hurtPlayer(w, 1, R.x, R.z, 8);
      w.events.push({ type: 'zoneHit', kind: 'spikes', x: R.x, y: R.y, z: R.z, r: R.r1 });
    }
    if (R.burst) R.life -= dt;
    if (!R.burst || R.life > 0) e.rings[n++] = R;
  }
  e.rings.length = n;
}

function startBlizzard(w, e) {
  e.blizDue = false;
  set(e, 'blizzardTele', C.blizzard.tele);
  e.blizOn = 1; e.blizT = C.blizzard.time; e.blizHp = 0; e.hpMark = e.hp;
  w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz });
}
function endBlizzard(w, e, broken) {
  e.blizOn = 0; e.blizCD = C.blizzard.cd; e.blizDue = true;
  if (broken) { set(e, 'dazed', C.blizzard.dazed); w.events.push({ type: 'bossPhase', phase: e.phase, x: e.cx, y: e.cy, z: e.cz }); }
  else next(w, e);
}

// You can bounce off its back unless it's reared up, in the air, hidden in the snow, or shaking.
export const stompable = (e) => !NOSTOMP.has(e.state);

// In the blizzard you can only hit what you can see: shots that don't pass close to its visor are lost.
export function blocks(w, e, s) {
  if (!e.blizOn || !(e.state === 'stalk' || e.state === 'lungeTele')) return false;
  const vx = e.cx + e.fx * C.breath.mouth - s.x, vy = e.floorY + C.breath.mouthY + 0.4 - s.y, vz = e.cz + e.fz * C.breath.mouth - s.z;
  const sx = s.vx * T.DT, sy = s.vy * T.DT, sz = s.vz * T.DT, L2 = sx * sx + sy * sy + sz * sz || 1;
  const t = clamp((vx * sx + vy * sy + vz * sz) / L2, 0, 1); // closest approach of this step's flight to the visor
  const dx = vx - sx * t, dy = vy - sy * t, dz = vz - sz * t;
  return dx * dx + dy * dy + dz * dz > C.visorR * C.visorR;
}

export default { init, update, down, stompable, blocks, tuning };
