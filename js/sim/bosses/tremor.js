// TREMOR: NEW SAN FRANCISCO's boss, a drilling mole mech loose on a hilltop park. Pure (no three.js,
// no DOM, no Math.random: w.rng only).
//
//   crawl ──┬─ digTele (drill spins up, nose down) → dig → burrow (under the lawn: invulnerable, a dust
//           │   mound crawls toward you) → emergeTele (a ring fills under you) → emerge (bursts up)
//           │   → stuck (dizzy, nose in the dirt: punish it, stomp its back)
//           │     phase 2: fault cracks run out from the hole; phase 3: an aftershock ring round the hole,
//           │     and it dives straight back in once (two burrows back to back)
//           ├─ spinTele (the drill revs; a shockwave ring round it: run, or jump it; the spinning drill
//           │   deflects shots from the front) → stunned (overheated: ×1.5 damage, stomp its back)
//           └─ boltTele (claws up) → bolts (a fan of rock bolts; more fans in later phases) → cool
//   phases by health: 1 (> 60 %), 2 (> 30 %: cracks, faster, drones), 3 (ring, double burrows, faster)
// Pose (bosses/common.js): cx cy cz, heading fx fz, surf 'floor' | 'under', depth 0 (up) … 1 (buried).
import { initPose, introTick, phaseTick, pick, stride, turnTo, openSpot, fan, zone, spawn, down as stdDown, dyingTick, syncPose } from './common.js';
import { clamp } from '../util.js';

// Every number, and why it has that value.
export const TREMOR = {
  hp: 320, // ~48 s of blaster on target; it's underground (unhittable) about a third of the time, so 2–3 minutes.
  r: 2.6, top: 3.2, bodyH: 1.7, // hit capsule; its back (the stomp target) is 3.3 m up, a single jump.
  bodyR: 2.4, margin: 3.5, // what it can't crawl through (boulders, tree trunks); how close to the arena edge it goes.
  intro: 2.2, // it idles, headlamps on, then roars.
  walk: [3.6, 4.4, 5.2], // crawl speed by phase: you outrun it (8.5 m/s).
  crawl: [1.6, 2.6], // seconds it crawls at you between moves (random in this range).
  digTele: [1.0, 0.85, 0.7], // the drill spins up and the nose dips before it burrows (still hittable).
  digTime: 0.6, // sinking into the lawn; hittable for the first half.
  under: 3.9, // how far down its centre goes (its back is well below the turf).
  burrowSpeed: [7, 8.5, 10], // underground, it gains on you: it's coming wherever you run.
  burrowMax: [4.5, 4, 3.5], // it surfaces after this long even if it never caught up.
  emergeTele: [1.0, 0.85, 0.72], // the red ring fills under you: ≥ 0.7 s to get out of a 3.4 m circle (0.4 s of running).
  emergeR: 3.4, emergeDmg: 2, emergeKnock: 13, emergeH: 3, // the burst: 2 cells, a big shove; perches above 3 m are safe.
  rise: 0.45, // bursting up out of the hole (invulnerable for the first half).
  stuck: [1.6, 1.35, 1.15], // dizzy after surfacing: the punish window…
  stuckVuln: 1.25, // …at ×1.25 damage.
  spinTele: [0.95, 0.85, 0.75], spinR: 7, spinDmg: 1, spinKnock: 12, spinH: 1.6, // the drill-spin shockwave: run 7 m or just jump it.
  spinStun: [2.2, 1.9, 1.6], stunVuln: 1.5, // overheated after a spin: the big punish window (stomp: 4 × 1.5 = 6).
  frontBlock: -0.4, // while it revs, shots whose direction meets its facing below this cosine bounce off the drill.
  boltTele: [0.7, 0.6, 0.55], // claws up, headlamps flare.
  boltN: [5, 7, 7], boltArc: [0.8, 1.0, 1.1], boltSpeed: 16, // a fan of rock bolts: dodge sideways.
  volleys: [1, 2, 3], volleyGap: 0.45, // fans per attack by phase.
  cracks: [0, 2, 3], crackN: [0, 4, 3], crackGap: 3.6, crackR: 2.0, crackDelay: 0.75, crackStep: 0.16, crackH: 2.2, // fault cracks after it surfaces (≤ 9 rings at once: the renderer draws 10).
  ringN: 6, ringR: 5.6, ringZoneR: 2.1, ringDelay: 0.25, // phase 3: aftershocks round the hole, landing just after the burst.
  chain: [1, 1, 2], // burrows per dive: phase 3 goes straight back under once.
  minions: [0, 2, 2], // drones that join at phases 2 and 3.
};
const S = TREMOR;
const _o = [0, 0];

function init(w, e, d) {
  initPose(w, e, d, { hp: S.hp, r: S.r, top: S.top, bodyH: S.bodyH, intro: S.intro });
  Object.assign(e, { depth: 0, chain: 0, volleys: 0, vgap: 0, tx: e.cx, tz: e.cz, last: '', fx: 0, fz: 1 }); // faces the start (south)
  e.floorY = w.level.arena ? w.level.arena.floor : d.y ?? 0; // the lawn (the view puts the dust mound on it)
}

const surfY = (A) => A.floor + S.bodyH;
const deepY = (A) => A.floor + S.bodyH - S.under;
function clampArena(A, x, z, out) {
  out[0] = clamp(x, A.x0 + S.margin, A.x1 - S.margin); out[1] = clamp(z, A.z0 + S.margin, A.z1 - S.margin);
  return out;
}

function update(w, e, dt) {
  const A = w.level.arena, P = w.player;
  if (e.state === 'dying') { dyingTick(w, e, dt); return; }
  e.crouch = Math.max(0, e.crouch - dt * 3);
  if (introTick(w, e, dt, 'crawl', 1.6)) { syncPose(e); return; }
  if (phaseTick(w, e)) onPhase(w, e);
  const ph = e.phase - 1;
  e.timer -= dt;
  e.vuln = 1; e.noContact = false;
  switch (e.state) {
    case 'crawl':
      stride(w, e, P.x, P.z, S.walk[ph], dt, S.bodyR, S.margin);
      if (e.timer <= 0) decide(w, e);
      break;
    case 'digTele': // the drill winds up, the nose dips
      turnTo(e, P.x, P.z, 1.5, dt); e.crouch = 1;
      if (e.timer <= 0) { e.state = 'dig'; e.timer = S.digTime; w.events.push({ type: 'bossLeap', x: e.cx, y: A.floor + 1.6, z: e.cz }); }
      break;
    case 'dig': { // sinking into the turf
      e.depth = clamp(1 - e.timer / S.digTime, 0, 1);
      e.cy = surfY(A) + (deepY(A) - surfY(A)) * e.depth;
      if (e.depth > 0.5) e.vuln = 0;
      if (e.depth > 0.3) e.noContact = true;
      if (e.timer <= 0) { e.state = 'burrow'; e.surf = 'under'; e.depth = 1; e.cy = deepY(A); e.timer = S.burrowMax[ph]; }
      break;
    }
    case 'burrow': { // under the lawn, gaining on you; the renderer draws the dust mound over it
      e.vuln = 0; e.noContact = true;
      clampArena(A, P.x, P.z, _o);
      const dx = _o[0] - e.cx, dz = _o[1] - e.cz, d = Math.sqrt(dx * dx + dz * dz);
      turnTo(e, _o[0], _o[1], 5, dt);
      if (d > 0.05) { const s = Math.min(d, S.burrowSpeed[ph] * dt); e.cx += (dx / d) * s; e.cz += (dz / d) * s; }
      e.gait += S.burrowSpeed[ph] * dt;
      if (d < 1.2 || e.timer <= 0) startEmerge(w, e);
      break;
    }
    case 'emergeTele': { // the ring fills under you; it slides under the spot
      e.vuln = 0; e.noContact = true;
      const dx = e.tx - e.cx, dz = e.tz - e.cz, d = Math.sqrt(dx * dx + dz * dz);
      if (d > 0.01) { const s = Math.min(d, 30 * dt); e.cx += (dx / d) * s; e.cz += (dz / d) * s; }
      if (e.timer <= 0) { e.cx = e.tx; e.cz = e.tz; e.state = 'emerge'; e.surf = 'floor'; e.timer = S.rise; w.events.push({ type: 'bossLeap', x: e.cx, y: A.floor + 1.6, z: e.cz }); }
      break;
    }
    case 'emerge': { // bursting up out of the hole
      e.depth = clamp(e.timer / S.rise, 0, 1);
      e.cy = surfY(A) + (deepY(A) - surfY(A)) * e.depth;
      e.noContact = true;
      if (e.depth > 0.5) e.vuln = 0;
      if (e.timer <= 0) {
        e.depth = 0; e.cy = surfY(A);
        if (S.cracks[ph]) cracks(w, e, ph);
        e.state = 'stuck'; e.timer = S.stuck[ph]; e.crouch = 0.8;
      }
      break;
    }
    case 'stuck': // dizzy, nose in the dirt
      e.vuln = S.stuckVuln; e.crouch = Math.max(e.crouch, 0.6);
      if (e.timer <= 0) {
        if (e.chain > 0) { e.chain--; startDig(w, e, 0.6); }
        else toCrawl(w, e);
      }
      break;
    case 'spinTele': // revving: the ring round it fills; the drill deflects frontal shots (blocks)
      turnTo(e, P.x, P.z, 2, dt);
      if (e.timer <= 0) { e.state = 'stunned'; e.timer = S.spinStun[ph]; e.crouch = 1; w.events.push({ type: 'bossSlam', x: e.cx, y: A.floor, z: e.cz, r: S.spinR }); }
      break;
    case 'stunned': // overheated
      e.vuln = S.stunVuln; e.crouch = Math.max(e.crouch, 0.9);
      if (e.timer <= 0) toCrawl(w, e);
      break;
    case 'boltTele':
      turnTo(e, P.x, P.z, 3, dt);
      if (e.timer <= 0) { e.state = 'bolts'; e.vgap = 0; }
      break;
    case 'bolts':
      turnTo(e, P.x, P.z, 3, dt);
      e.vgap -= dt;
      if (e.volleys > 0 && e.vgap <= 0) {
        fan(w, e, e.cx + e.fx * 1.8, e.cy + 1.3, e.cz + e.fz * 1.8, S.boltSpeed, S.boltN[ph], S.boltArc[ph]);
        e.volleys--; e.vgap = S.volleyGap;
      }
      if (e.volleys <= 0 && e.vgap <= 0) { e.state = 'cool'; e.timer = 0.7; }
      break;
    case 'cool':
      if (e.timer <= 0) toCrawl(w, e);
      break;
    default: toCrawl(w, e);
  }
  syncPose(e);
}

function toCrawl(w, e) { e.state = 'crawl'; e.timer = S.crawl[0] + w.rng() * (S.crawl[1] - S.crawl[0]); }

function decide(w, e) {
  const P = w.player, A = w.level.arena;
  const dx = P.x - e.cx, dz = P.z - e.cz, dist = Math.sqrt(dx * dx + dz * dz);
  const high = P.y > A.floor + 2.8; // up on a terrace, a tree or a boulder: the drill can't reach you there
  const opts = [['burrow', high ? 1.5 : 3]];
  if (dist < 10 && !high) opts.push(['spin', dist < 6 ? 4 : 2]);
  opts.push(['bolts', high || dist > 16 ? 3.5 : 1.6]);
  for (const o of opts) if (o[0] === e.last) o[1] *= 0.4; // rarely the same move three times running
  const k = pick(w, opts);
  e.last = k;
  if (k === 'burrow') { e.chain = S.chain[e.phase - 1] - 1; startDig(w, e, 1); }
  else if (k === 'spin') startSpin(w, e);
  else startBolts(w, e);
}

function startDig(w, e, k) {
  e.state = 'digTele'; e.timer = S.digTele[e.phase - 1] * k;
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
}
function startEmerge(w, e) {
  const A = w.level.arena, P = w.player, ph = e.phase - 1;
  clampArena(A, P.x, P.z, _o);
  openSpot(w, _o[0], _o[1], S.bodyR, _o, A.floor, A.floor + 3); // beside a boulder you stand on, never inside it
  clampArena(A, _o[0], _o[1], _o);
  e.tx = _o[0]; e.tz = _o[1];
  const tele = S.emergeTele[ph];
  zone(w, e.tx, A.floor, e.tz, S.emergeR, tele, { dmg: S.emergeDmg, knock: S.emergeKnock, kind: 'drill', height: S.emergeH });
  if (ph >= 2) for (let i = 0; i < S.ringN; i++) {
    const a = (i / S.ringN) * Math.PI * 2 + w.rng();
    zone(w, clamp(e.tx + Math.cos(a) * S.ringR, A.x0 + 1, A.x1 - 1), A.floor, clamp(e.tz + Math.sin(a) * S.ringR, A.z0 + 1, A.z1 - 1), S.ringZoneR, tele + S.ringDelay, { dmg: 1, knock: 9, kind: 'quake', height: 2.4 });
  }
  e.state = 'emergeTele'; e.timer = tele;
}
// fault cracks: lines of aftershocks running out from the hole, the first one at you
function cracks(w, e, ph) {
  const A = w.level.arena, P = w.player;
  const a0 = Math.atan2(P.z - e.cz, P.x - e.cx);
  for (let l = 0; l < S.cracks[ph]; l++) {
    const a = a0 + (l * 2 * Math.PI) / S.cracks[ph];
    for (let i = 0; i < S.crackN[ph]; i++) {
      const r = S.emergeR + 1.2 + i * S.crackGap, x = e.cx + Math.cos(a) * r, z = e.cz + Math.sin(a) * r;
      if (x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) break;
      zone(w, x, A.floor, z, S.crackR, S.crackDelay + i * S.crackStep, { dmg: 1, knock: 8, kind: 'crack', height: S.crackH });
    }
  }
}
function startSpin(w, e) {
  const A = w.level.arena, ph = e.phase - 1;
  e.state = 'spinTele'; e.timer = S.spinTele[ph];
  zone(w, e.cx, A.floor, e.cz, S.spinR, S.spinTele[ph], { dmg: S.spinDmg, knock: S.spinKnock, kind: 'spin', height: S.spinH });
  w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz });
}
function startBolts(w, e) {
  e.state = 'boltTele'; e.timer = S.boltTele[e.phase - 1]; e.volleys = S.volleys[e.phase - 1];
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
}

// a new phase: drones join, and if it's up top it dives at once
function onPhase(w, e) {
  const A = w.level.arena, n = S.minions[e.phase - 1];
  for (let i = 0; i < n; i++) spawn(w, { type: 'drone', x: i % 2 ? A.x1 - 6 : A.x0 + 6, y: A.floor + 7 + i, z: (i % 2 ? A.z0 + 8 : A.z1 - 8) * (e.phase === 3 ? -1 : 1) });
  if (['crawl', 'stuck', 'stunned', 'cool'].includes(e.state)) { e.chain = S.chain[e.phase - 1] - 1; startDig(w, e, 0.8); }
}

function down(w, e) {
  const A = w.level.arena;
  if (e.surf === 'under' || e.depth > 0) { e.cy = surfY(A); e.depth = 0; e.surf = 'floor'; } // it bursts out to die
  e.noContact = true;
  stdDown(w, e);
}

// You bounce off its armoured back whenever it's up on the lawn and not mid-burst.
const BACK = new Set(['crawl', 'stuck', 'stunned', 'spinTele', 'boltTele', 'bolts', 'cool', 'digTele']);
const stompable = (e) => e.surf === 'floor' && e.depth < 0.2 && BACK.has(e.state);
// While it revs the drill, shots that hit it from the front glance off the spinning cone.
function blocks(w, e, shot) {
  if (e.state !== 'spinTele') return false;
  const l = Math.sqrt(shot.vx * shot.vx + shot.vz * shot.vz) || 1;
  return (shot.vx * e.fx + shot.vz * e.fz) / l < S.frontBlock;
}

export default { init, update, down, stompable, blocks, tuning: TREMOR };
