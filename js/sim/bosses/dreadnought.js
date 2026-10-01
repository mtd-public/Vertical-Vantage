// DREADNOUGHT: the air fortress's armoured command core, bolted to the top of the bridge tower.
// Pure (no three.js, no DOM). It never walks: it turns its eye-slit on you and runs the battle.
//
//   arm ──→ shielded ──(every flak pod down)──→ unseal ──→ open ⇄ attacks ──(health crosses a cut)──→ seal ──→ arm …
//
//   shielded  vuln 0 (shots glance off), its crown is electrified (no stomps). Its FLAK PODS are
//             ordinary 'turret' enemies it raises itself (phase 1: four on the pedestals, 2: three on
//             the flak towers, 3: two on the hover sponsons); it backs them up with a lesser attack now
//             and then. Kill every pod and the armour panels slide open.
//   open      vuln 1 and its crown is stompable. Between attacks it idles (a punish window). Attacks:
//               laser    sight line (charge), then a beam sweeping across you at your chest height:
//                        jump it, or put a pedestal / tower between you; then it VENTS (vuln 1.5)
//               salvo    launcher doors flare, then volleys of missiles fanned at you (odd/even
//                        counts alternate so the safe gaps move: strafe)
//               drones   the hangar hatch flares, then 2–3 drone fighters launch round the deck
//               bombing  it calls a bombing run: a line of red rings across the deck through you
//                        (a cross in phase 3) lands 1.25 s later, ring after ring: step out of the line
//               pulse    hug it and it charges a shock pulse round its plinth (1 s): get out or jump
//   stomp     landing on its open crown staggers it (2 s, vuln 1.5, its attack is cut short)
//   seal      crossing 62 % / 30 % health slams the panels shut: it re-arms with the next phase's pods
//   phases by health: 1 (> 62 %), 2 (> 30 %), 3 (frantic: faster, double sweeps, more of everything)
import { raycast, groundBelow } from '../plats.js';
import { initPose, phaseTick, introTick, pick, turnTo, fan, zone, spawn, down as stdDown, dyingTick, beamHit } from './common.js';

// Every number, and why.
export const tuning = {
  hp: 280, // ~42 s of blaster on target over three open windows; the pods and the dodging double that.
  r: 3.6, top: 5.6, bodyH: 2.8, // a dome 7 m across; its crown at 6.8 (plinth 1.2 + 5.6): a double jump from the deck.
  intro: 2.0, // the camera settles, then it wakes (as long as ARACHNE-9's).
  cuts: [0.62, 0.3], // phase 2 below 62 %, phase 3 below 30 % (the last window is the shortest).
  podHp: [6, 9, 12], // flak pods by phase: a second of blaster each in phase 1, tougher (and harder to reach) later.
  arm: 0.9, unseal: 1.3, seal: 1.4, // the panels: pods rise 0.9 s after it shuts, open over 1.3 s, slam shut over 1.4 s.
  turn: 1.6, // rad/s its eye-slit tracks you while it idles (you can run round it at 8.5 m/s).
  idle: [[1.8, 2.6], [1.4, 2.1], [1.0, 1.6]], // the gap between attacks while open, by phase: the punish window.
  charge: [1.2, 1.05, 0.9], // laser: the sight line shows this long (≥ 0.9 s) before the beam lights.
  sweep: 1.0, // the beam starts 1 rad to one side of you and sweeps 1 rad past you.
  sweepTime: [2.1, 1.9, 1.7], passes: [1, 1, 2], // seconds per pass; phase 3 sweeps back again.
  vent: [2.0, 1.8, 1.5], ventVuln: 1.5, // after the laser it vents heat: shots do ×1.5.
  beamLen: 80, beamUp: 0.9, // the beam's reach; the eye-slit sits 0.9 m above the core's centre.
  salvoTele: 0.8, volleys: [2, 3, 4], volleyGap: 0.42, // launcher doors flare 0.8 s; volleys 0.42 s apart.
  boltSpeed: [15, 16.5, 18], fanArc: 0.7, // missiles: slower than a turret round (20), fanned over 0.7 rad.
  bombTele: 1.25, bombStep: 0.12, bombR: 3.0, bombGap: 5.4, bombN: [6, 7, 5], // rings land 1.25 s after the call, then one every 0.12 s along the line.
  drones: [2, 2, 3], droneCap: 4, droneTele: 0.8, droneRing: 14, droneY: 7.5, // escorts launched round the deck, never more than 4 up.
  pulseR: 7.5, pulseTele: 1.0, pulseCD: 5, pulseNear: 8, // hug it and a shock pulse rings its plinth (jump it or get out).
  shieldAtk: [[6.5, 8.5], [5.5, 7], [4.5, 6]], // while shielded, a lesser attack this often (the pods do the rest).
  stagger: 2.0, staggerCD: 5, // a stomp on the open crown: 2 s stunned at ×1.5, at most once every 5 s.
  dyingTime: 2.2,
};
const S = tuning;

export function init(w, e, d) {
  initPose(w, e, d, { hp: S.hp, r: S.r, top: S.top, bodyH: S.bodyH, intro: S.intro });
  Object.assign(e, {
    vuln: 0, open: false, openK: 0, pods: [], drones: [], podDefs: d.pods || null,
    atk: 3, last: '', lockSeen: 0, stunT: 0, stunCD: 0, pulseCD: 2,
    misT: 0, misN: 0, misGap: 0, misSide: 1, misK: 0, droneT: 0, droneN: 0,
    sweepA: 0, sweepDir: 1, pass: 0, lfx: 0, lfz: 1, lp: 0,
    bombT: 0, bombMax: 1, bx0: 0, bz0: 0, bx1: 0, bz1: 0,
  });
  e.fz = 1; e.fx = 0; // looking south, at the start
}

export function update(w, e, dt) {
  const P = w.player;
  if (e.state === 'dying') { e.openK = Math.min(1, e.openK + dt); e.beam.on = e.beam.sight = false; dyingTick(w, e, dt); return; }
  if (introTick(w, e, dt, 'arm', S.arm)) return;
  if (phaseTick(w, e, S.cuts) && e.state !== 'seal' && e.state !== 'arm') seal(w, e);
  e.timer -= dt;
  e.beam.on = false; e.beam.sight = false;
  e.stunCD = Math.max(0, e.stunCD - dt); e.pulseCD = Math.max(0, e.pulseCD - dt);
  e.bombT = Math.max(0, e.bombT - dt);
  const ph = e.phase - 1;

  // a stomp on the open crown: the player's stomp lock on us was just renewed
  const fresh = P.lock === e && P.lockT > e.lockSeen + 1e-6;
  e.lockSeen = P.lock === e ? P.lockT : 0;
  if (fresh && e.open && e.stunCD <= 0 && e.state !== 'seal') {
    e.state = 'stagger'; e.timer = S.stagger; e.stunCD = S.staggerCD; e.misN = 0; e.misT = 0; e.droneT = 0;
    w.events.push({ type: 'bossCeil', x: e.cx, y: e.cy, z: e.cz });
  }

  switch (e.state) {
    case 'arm': // the panels are shut; the pods come up
      e.vuln = 0; e.open = false;
      if (e.timer <= 0) { raisePods(w, e); e.state = 'shielded'; e.atk = 2.5 + w.rng(); }
      break;
    case 'shielded':
      e.vuln = 0; e.open = false;
      track(w, e, dt, S.turn * 0.8);
      if (alive(w, e.pods) === 0) { e.state = 'unseal'; e.timer = S.unseal; w.events.push({ type: 'bossCeil', x: e.cx, y: e.cy, z: e.cz }); break; }
      if ((e.atk -= dt) <= 0) { shieldAttack(w, e); const r = S.shieldAtk[ph]; e.atk = r[0] + w.rng() * (r[1] - r[0]); }
      break;
    case 'unseal': // the armour slides back over the glowing core
      e.vuln = 0;
      if (e.timer <= 0) { e.state = 'open'; e.open = true; e.atk = 1.2; w.events.push({ type: 'bossRoar', x: e.cx, y: e.cy, z: e.cz }); }
      break;
    case 'open': // idle between attacks: shoot it, stomp it
      e.vuln = 1; e.open = true;
      track(w, e, dt, S.turn);
      if ((e.atk -= dt) <= 0 && e.misN === 0 && e.misT <= 0 && e.droneT <= 0) openAttack(w, e);
      break;
    case 'charge': { // the sight line
      e.vuln = 1;
      track(w, e, dt, 3);
      aimAtPlayer(w, e);
      e.beam.sight = true;
      if (e.timer <= 0) {
        e.lfx = e.fx; e.lfz = e.fz; e.lp = aimPitch(w, e);
        e.sweepDir = w.rng() < 0.5 ? -1 : 1; e.sweepA = -S.sweep * e.sweepDir; e.pass = 0;
        e.state = 'laser'; e.timer = S.sweepTime[ph];
        w.events.push({ type: 'bossLaser', x: e.cx, y: e.cy, z: e.cz });
      }
      break;
    }
    case 'laser': {
      e.vuln = 1;
      e.sweepA += e.sweepDir * (2 * S.sweep / S.sweepTime[ph]) * dt;
      sweepBeam(w, e, e.sweepA);
      e.beam.on = true;
      beamHit(w, e);
      if (e.timer <= 0) {
        if (++e.pass < S.passes[ph]) { e.sweepDir = -e.sweepDir; e.timer = S.sweepTime[ph]; }
        else { e.state = 'vent'; e.timer = S.vent[ph]; }
      }
      break;
    }
    case 'vent': e.vuln = S.ventVuln; e.open = true; if (e.timer <= 0) toIdle(w, e); break;
    case 'stagger': e.vuln = S.ventVuln; e.open = true; e.stunT = e.timer; if (e.timer <= 0) { e.stunT = 0; toIdle(w, e, 0.8); } break;
    case 'seal': // slamming shut: it re-arms
      e.vuln = 0; e.open = false;
      if (e.timer <= 0) { e.state = 'arm'; e.timer = S.arm; }
      break;
    default: e.state = 'arm'; e.timer = S.arm;
  }
  e.openK = e.open ? Math.min(1, e.openK + dt / S.unseal) : e.state === 'unseal' ? Math.min(1, 1 - e.timer / S.unseal) : Math.max(0, e.openK - dt / 0.5);
  launchers(w, e, dt);
  hangar(w, e, dt);
  // hug it and it pulses
  const dx = P.x - e.cx, dz = P.z - e.cz;
  if (!P.dead && e.pulseCD <= 0 && dx * dx + dz * dz < S.pulseNear * S.pulseNear && P.y < e.cy + 1 && e.state !== 'unseal' && e.state !== 'stagger' && w.zones.length < 8) {
    const A = w.level.arena;
    zone(w, e.cx, e.y, e.cz, S.r + 1.9, S.pulseTele, { kind: 'pulse', knock: 12, height: 3.2 }); // on the plinth…
    zone(w, e.cx, A ? A.floor : 0, e.cz, S.pulseR, S.pulseTele, { kind: 'pulse', knock: 12, height: 3.2 }); // …and the deck round it
    e.pulseCD = S.pulseCD;
  }
  e.x = e.cx; e.z = e.cz; e.y = e.cy - e.top / 2;
}

function toIdle(w, e, extra = 0) {
  const r = S.idle[e.phase - 1];
  e.state = 'open'; e.atk = extra + r[0] + w.rng() * (r[1] - r[0]);
}

function seal(w, e) {
  e.state = 'seal'; e.timer = S.seal; e.open = false; e.vuln = 0;
  e.misN = 0; e.misT = 0; e.droneT = 0; e.stunT = 0;
  w.events.push({ type: 'bossSlam', x: e.cx, y: e.y, z: e.cz, r: 6 });
}

// ------------------------------------------------------------------ attacks
function openAttack(w, e) {
  const ph = e.phase, n = alive(w, e.drones);
  const opts = [['laser', ph === 3 ? 3.5 : 3], ['salvo', ph === 1 ? 3 : 2.5], ['bombing', ph === 1 ? 2 : ph === 2 ? 2.5 : 3]];
  if (n < S.droneCap) opts.push(['drones', ph === 1 ? 1.2 : ph === 2 ? 1.5 : 2]);
  for (const o of opts) if (o[0] === e.last) o[1] *= 0.3; // rarely the same thing twice
  let a = pick(w, opts);
  if (a === 'bombing' && w.zones.length) a = 'salvo';
  e.last = a;
  if (a === 'laser') { e.state = 'charge'; e.timer = S.charge[ph - 1]; w.events.push({ type: 'bossCharge', x: e.cx, y: e.cy, z: e.cz }); return; }
  if (a === 'salvo') { startSalvo(w, e, S.volleys[ph - 1]); e.atk = S.salvoTele + S.volleys[ph - 1] * S.volleyGap; }
  else if (a === 'drones') { startDrones(w, e, S.drones[ph - 1]); e.atk = S.droneTele; }
  else { bombingRun(w, e, ph === 3); e.atk = S.bombTele; }
  const r = S.idle[ph - 1];
  e.atk += r[0] + w.rng() * (r[1] - r[0]);
}

function shieldAttack(w, e) {
  const ph = e.phase;
  const opts = [['salvo', 3]];
  if (ph >= 2 && !w.zones.length) opts.push(['bombing', 3]);
  if (ph >= 3 && alive(w, e.drones) < S.droneCap) opts.push(['drones', 2]);
  const a = pick(w, opts);
  if (a === 'salvo') startSalvo(w, e, ph === 1 ? 1 : 2);
  else if (a === 'bombing') bombingRun(w, e, false);
  else startDrones(w, e, 2);
}

// missiles: the launcher doors on its shoulders flare (telegraph), then volleys alternate sides
function startSalvo(w, e, volleys) {
  e.misT = S.salvoTele; e.misN = volleys; e.misGap = 0; e.misK = 0;
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy + 2, z: e.cz });
}
function launchers(w, e, dt) {
  if (e.misT > 0) { e.misT -= dt; return; }
  if (e.misN <= 0 || w.player.dead) return;
  if ((e.misGap -= dt) > 0) return;
  e.misSide = -e.misSide; e.misN--; e.misGap = S.volleyGap;
  const ph = e.phase - 1, rx = -e.fz, rz = e.fx;
  const ox = e.cx + rx * e.misSide * 2.6 + e.fx * 1.2, oy = e.cy + 2.1, oz = e.cz + rz * e.misSide * 2.6 + e.fz * 1.2;
  fan(w, e, ox, oy, oz, S.boltSpeed[ph], (ph === 2 ? 6 : 5) - (e.misK++ % 2), S.fanArc); // 5, 4, 5… (6, 5… in phase 3): the gaps move
}

// drone fighters: the hangar hatch flares, then they launch round the deck on your side
function startDrones(w, e, n) {
  e.droneT = S.droneTele; e.droneN = n;
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy + 2.5, z: e.cz });
}
function hangar(w, e, dt) {
  if (e.droneT <= 0) return;
  if ((e.droneT -= dt) > 0) return;
  e.droneT = 0;
  e.drones = e.drones.filter((id) => isAlive(w, id));
  const P = w.player, base = Math.atan2(P.z - e.cz, P.x - e.cx);
  const n = Math.min(e.droneN, S.droneCap - e.drones.length);
  for (let k = 0; k < n; k++) {
    const a = base + (k - (n - 1) / 2) * 0.8 + (w.rng() - 0.5) * 0.3;
    const x = e.cx + Math.cos(a) * S.droneRing, z = e.cz + Math.sin(a) * S.droneRing, y = S.droneY + w.rng() * 1.5;
    const m = spawn(w, { type: 'drone', x, y, z });
    e.drones.push(m.id);
    w.events.push({ type: 'impact', kind: 'shield', x, y, z, nx: 0, ny: 1, nz: 0 });
  }
}

// a bombing run: rings in a line through you (a cross in phase 3), landing one after another
export function bombingRun(w, e, cross) {
  const P = w.player, ph = e.phase - 1;
  const a0 = w.rng() * Math.PI;
  const lines = cross ? [a0, a0 + Math.PI / 2] : [a0];
  const n = S.bombN[ph], half = (n - 1) / 2;
  let k = 0;
  lines.forEach((a, li) => {
    const ux = Math.cos(a), uz = Math.sin(a);
    for (let i = 0; i < n; i++) {
      if (li > 0 && i === Math.round(half) && n % 2 === 1) continue; // the cross shares its centre
      const x = P.x + ux * (i - half) * S.bombGap, z = P.z + uz * (i - half) * S.bombGap;
      const g = groundBelow(w.plats, x, z, 60);
      if (!g || w.zones.length >= 10) continue; // over the void: nothing to hit
      zone(w, x, g.h + g.oy, z, S.bombR, S.bombTele + k++ * S.bombStep, { kind: 'bomb', height: 3, knock: 9 });
    }
    if (li === 0) { e.bx0 = P.x - ux * 70; e.bz0 = P.z - uz * 70; e.bx1 = P.x + ux * 70; e.bz1 = P.z + uz * 70; }
  });
  e.bombT = e.bombMax = S.bombTele + n * S.bombStep + 0.6; // (the renderer flies a bomber along the line)
  w.events.push({ type: 'bossTele', x: P.x, y: P.y + 2, z: P.z });
}

// ------------------------------------------------------------------ the laser
// The eye-slit: on the front of the dome, `beamUp` above its centre, facing (fx, fz).
function eyeAt(e) {
  const B = e.beam, f = S.r * 0.9;
  B.ox = e.cx + e.fx * f; B.oy = e.cy + S.beamUp; B.oz = e.cz + e.fz * f;
}
function aimPitch(w, e) {
  const P = w.player, B = e.beam;
  eyeAt(e);
  const dx = P.x - B.ox, dz = P.z - B.oz;
  return Math.atan2(P.y + 1 - B.oy, Math.sqrt(dx * dx + dz * dz) || 1);
}
function aimAtPlayer(w, e) {
  const P = w.player, B = e.beam;
  eyeAt(e);
  let dx = P.x - B.ox, dy = P.y + 1 - B.oy, dz = P.z - B.oz;
  const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  B.dx = dx / l; B.dy = dy / l; B.dz = dz / l;
  castBeam(w, e);
}
// Sweep: the heading locked at the end of the charge, turned by a round world Y; the pitch stays put
// (at your chest height where you stood), so you can jump it.
function sweepBeam(w, e, a) {
  const B = e.beam, c = Math.cos(a), s = Math.sin(a);
  const hx = e.lfx * c - e.lfz * s, hz = e.lfx * s + e.lfz * c;
  e.fx = hx; e.fz = hz; // the dome turns with its beam
  eyeAt(e);
  const cp = Math.cos(e.lp);
  B.dx = hx * cp; B.dy = Math.sin(e.lp); B.dz = hz * cp;
  castBeam(w, e);
}
function castBeam(w, e) {
  const B = e.beam, hit = raycast(w.plats, B.ox, B.oy, B.oz, B.dx, B.dy, B.dz, S.beamLen);
  B.len = hit ? hit.t : S.beamLen;
}

// ------------------------------------------------------------------ pods, minions
function raisePods(w, e) {
  const A = w.level.arena, P = w.player, ph = e.phase - 1;
  const defs = (e.podDefs && e.podDefs[Math.min(ph, e.podDefs.length - 1)]) || [[-8, -8], [8, -8], [-8, 8], [8, 8]];
  e.pods = e.pods.filter((id) => isAlive(w, id));
  for (const s of defs) {
    let x, y, z;
    if (typeof s === 'number') { const p = w.plats[s]; x = p.x + p.ox; z = p.z + p.oz; y = p.h + p.oy; } // a platform (the sponsons): wherever it is now
    else { x = s[0]; z = s[1]; const g = groundBelow(w.plats, x, z, 60); y = g ? g.h + g.oy : (A ? A.floor : 0); }
    const m = spawn(w, { type: 'turret', x, y, z });
    m.hp = m.maxHp = S.podHp[ph];
    m.yaw = Math.atan2(-(P.x - x), -(P.z - z));
    e.pods.push(m.id);
    w.events.push({ type: 'impact', kind: 'shield', x, y: y + 1, z, nx: 0, ny: 1, nz: 0 });
  }
  w.events.push({ type: 'bossTele', x: e.cx, y: e.cy, z: e.cz });
}
function isAlive(w, id) { for (const m of w.enemies) if (m.id === id) return !m.dead; return false; }
function alive(w, ids) { let n = 0; for (const id of ids) if (isAlive(w, id)) n++; return n; }

// Its eye-slit turns toward you.
function track(w, e, dt, rate) { const P = w.player; if (!P.dead) turnTo(e, P.x, P.z, rate, dt); }

// ------------------------------------------------------------------ the registry hooks
// Health ran out: the standard defeat, and every pod and drone it raised blows up with it.
export function down(w, e) {
  if (e.state === 'dying') return;
  stdDown(w, e);
  e.timer = S.dyingTime; e.open = true; e.misN = 0; e.misT = 0; e.droneT = 0; e.bombT = 0;
  for (const m of w.enemies) {
    if (m.dead || m === e || (!e.pods.includes(m.id) && !e.drones.includes(m.id))) continue;
    m.dead = true; m.deadT = 0; m.hp = 0;
    w.events.push({ type: 'explode', x: m.x, y: m.y + m.top * 0.5, z: m.z, r: 2.2 });
  }
}
// You bounce off its crown only while it's open (shut, the dome is electrified: it shoves you off).
export const stompable = (e) => !!e.open && e.state !== 'dying';

export default { init, update, down, stompable, tuning };
