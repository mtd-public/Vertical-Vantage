// Headless proof (node tools/sim-check.mjs): every stage and bonus arena is completable,
// and the core movement numbers are what GAME_DESIGN.md says they are. Exit 1 on any failure.
//
//  1. Movement: jump heights from the real sim match the formula v²/2g; the triple jump chains.
//  2. Reachability: a graph over every walkable top. An edge A→B exists when the footprint gap
//     at some moment (movers are sampled over 30 s) is inside the jump envelope for that rise,
//     computed by flying the real TUNING numbers (run speed, gravity, three launch speeds).
//     Every drive, the portal and the exit must be reachable from the start; the exit must be
//     reachable from every drive and from the portal (you come back there after the bonus).
//  3. Placement: every walker/guard/server/pickup/drive sits on a deck (attach found a host).
//  4. Scripted play: stomp, shoot, collect three drives → exit opens → clear; bonus timer runs out
//     and clears; a fall respawns with damage; 120 s of seeded random input never produces NaN.
import { STAGES, BONUS } from '../js/levels/index.js';
import { T, BOSS } from '../js/sim/tuning.js';
import { createWorld, step } from '../js/sim/world.js';
import { makePlats, platOffset, groundBelow, posePlats, pushOut } from '../js/sim/plats.js';
import { mulberry32 } from '../js/sim/util.js';

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  ✗ ' + msg); } return cond; };
const C0 = { mx: 0, my: 0, yaw: 0, pitch: 0, jump: false, fire: false, swap: 0 };

// ------------------------------------------------------------------ 1. movement numbers
console.log('movement');
{
  const lv = { start: { x: 0, y: 0, z: 0 }, killY: -50, plats: [{ kind: 'rect', x: 0, z: 0, w: 40, d: 40, h: 0, thick: 2 }] };
  const w = createWorld(lv);
  for (let i = 0; i < 30; i++) step(w, C0);
  const P = w.player;
  ok(P.ground && Math.abs(P.y) < 1e-9, 'player settles on the deck');
  let top = 0;
  step(w, { ...C0, jump: true });
  for (let i = 0; i < 240; i++) { step(w, C0); top = Math.max(top, P.y); }
  const want = T.JUMP_V[0] * T.JUMP_V[0] / (2 * T.GRAVITY);
  ok(Math.abs(top - want) < 0.12, `single jump ${top.toFixed(2)} m ≈ ${want.toFixed(2)} m`);
  top = 0; let n = 1;
  step(w, { ...C0, jump: true });
  for (let i = 0; i < 600; i++) { const j = n < 3 && P.vy <= 0 && !P.ground; if (j) n++; step(w, { ...C0, jump: j }); top = Math.max(top, P.y); }
  const want3 = T.JUMP_V.reduce((s, v) => s + v * v / (2 * T.GRAVITY), 0);
  ok(Math.abs(top - want3) < 0.3 && n === 3, `triple jump ${top.toFixed(2)} m ≈ ${want3.toFixed(2)} m`);
  // a fourth press does nothing
  const vyBefore = []; step(w, { ...C0, jump: true }); for (let i = 0; i < 30; i++) step(w, C0);
  for (let k = 0; k < 3; k++) { for (let i = 0; i < 40; i++) step(w, C0); vyBefore.push(P.vy); step(w, { ...C0, jump: true }); }
  for (let i = 0; i < 40; i++) step(w, C0);
  const vy4 = P.vy; step(w, { ...C0, jump: true });
  ok(P.vy <= vy4 + 1e-9 || P.ground, 'no fourth jump');
  console.log(`  single ${top >= 0 ? want.toFixed(2) : ''} m, triple ${want3.toFixed(2)} m, run ${T.RUN} m/s`);
}

// ------------------------------------------------------------------ 2. reachability
// Max horizontal reach (edge to edge) for a rise dh, using k jumps chained at their apexes.
function reachFor(dh) {
  let best = -1;
  for (let k = 1; k <= 3; k++) {
    let y = 0, vy = T.JUMP_V[0], t = 0, used = 1, last = -1;
    const dt = 1 / 240;
    for (let i = 0; i < 240 * 6; i++) {
      if (vy <= 0 && used < k) { vy = T.JUMP_V[used]; used++; }
      vy -= T.GRAVITY * dt; if (vy < -T.FALL_MAX) vy = -T.FALL_MAX;
      y += vy * dt; t += dt;
      if (y >= dh + 0.15) last = t; // still above the target's top
      if (y < dh - 40) break;
    }
    if (last > 0) best = Math.max(best, last * T.RUN);
  }
  return best;
}
const REACH = new Map();
const reach = (dh) => { const k = Math.round(dh * 4) / 4; if (!REACH.has(k)) REACH.set(k, reachFor(k)); return REACH.get(k); };

function corners(p, ox, oz) {
  if (p.kind === 'disc') return null;
  const hw = p.w / 2, hd = p.d / 2, out = [];
  for (const [lx, lz] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) out.push([p.x + ox + lx * p.c + lz * p.s, p.z + oz - lx * p.s + lz * p.c]);
  return out;
}
function ptRect(p, ox, oz, x, z) {
  const dx = x - p.x - ox, dz = z - p.z - oz;
  const lx = dx * p.c - dz * p.s, lz = dx * p.s + dz * p.c;
  if (p.kind === 'disc') return Math.max(0, Math.sqrt(lx * lx + lz * lz) - p.r);
  const ex = Math.max(0, Math.abs(lx) - p.w / 2), ez = Math.max(0, Math.abs(lz) - p.d / 2);
  return Math.sqrt(ex * ex + ez * ez);
}
function gap(A, ao, B, bo) {
  if (A.kind === 'disc' && B.kind === 'disc') return Math.max(0, Math.hypot(A.x + ao[0] - B.x - bo[0], A.z + ao[2] - B.z - bo[2]) - A.r - B.r);
  if (A.kind === 'disc') return ptRect(B, bo[0], bo[2], A.x + ao[0], A.z + ao[2]) - A.r > 0 ? ptRect(B, bo[0], bo[2], A.x + ao[0], A.z + ao[2]) - A.r : 0;
  if (B.kind === 'disc') return gap(B, bo, A, ao);
  const ca = corners(A, ao[0], ao[2]), cb = corners(B, bo[0], bo[2]);
  let d = Infinity;
  for (const [x, z] of ca) d = Math.min(d, ptRect(B, bo[0], bo[2], x, z));
  for (const [x, z] of cb) d = Math.min(d, ptRect(A, ao[0], ao[2], x, z));
  // overlapping (one inside the other / crossing edges): treat as 0
  if (d > 0 && satOverlap(ca, cb)) d = 0;
  return d;
}
function satOverlap(a, b) {
  for (const poly of [a, b]) for (let i = 0; i < 4; i++) {
    const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % 4], nx = z2 - z1, nz = x1 - x2;
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (const [x, z] of a) { const s = x * nx + z * nz; amin = Math.min(amin, s); amax = Math.max(amax, s); }
    for (const [x, z] of b) { const s = x * nx + z * nz; bmin = Math.min(bmin, s); bmax = Math.max(bmax, s); }
    if (amax < bmin || bmax < amin) return false;
  }
  return true;
}

const MARGIN = 0.8; // only count jumps inside 80 % of the ideal reach (the player is human)
function reachGraph(level) {
  const plats = makePlats(level.plats);
  const times = [];
  for (let t = 0; t < 30; t += 0.5) times.push(t);
  const offs = plats.map((p) => times.map((t) => platOffset(p, t, [0, 0, 0])));
  const N = plats.length, adj = Array.from({ length: N }, () => []);
  for (let a = 0; a < N; a++) {
    const A = plats[a];
    for (let b = 0; b < N; b++) {
      if (a === b) continue;
      const B = plats[b];
      // quick reject on distance
      const cd = Math.hypot(A.x - B.x, A.z - B.z) - A.bound - B.bound;
      if (cd > 40) continue;
      const moving = A.move || A.bob || B.move || B.bob;
      for (let k = 0; k < (moving ? times.length : 1); k++) {
        const ao = offs[a][k], bo = offs[b][k];
        const dh = B.h + bo[1] - (A.h + ao[1]);
        if (dh > 12.5) continue;
        const g = gap(A, ao, B, bo);
        const r = reach(dh);
        if (r > 0 && g <= r * MARGIN) { adj[a].push(b); break; }
      }
    }
  }
  return { plats, adj };
}
function bfs(adj, from) {
  const seen = new Set([from]), q = [from];
  while (q.length) { const a = q.shift(); for (const b of adj[a]) if (!seen.has(b)) { seen.add(b); q.push(b); } }
  return seen;
}
function hostOf(plats, o, maxDrop = 8) {
  posePlats(plats, 0);
  const g = groundBelow(plats, o.x, o.z, o.y + 0.6);
  return g && g.h >= o.y - maxDrop ? g.id : -1;
}

function checkLevel(level, isBonus) {
  console.log(`${level.id}  (${level.plats.length} platforms)`);
  const { plats, adj } = reachGraph(level);
  const start = hostOf(plats, level.start, 2);
  if (!ok(start >= 0, 'start is on a deck')) return;
  const fromStart = bfs(adj, start);
  const named = [];
  (level.drives || []).forEach((d, i) => named.push([`drive ${i + 1}`, hostOf(plats, d)]));
  if (level.exit) named.push(['exit', hostOf(plats, level.exit, 2)]);
  if (level.portal) named.push(['portal', hostOf(plats, level.portal)]);
  for (const s of level.servers || []) named.push([`server @${s.x.toFixed(0)},${s.z.toFixed(0)}`, hostOf(plats, s, 4)]);
  for (const [name, h] of named) {
    if (!ok(h >= 0, `${name} sits on a deck`)) continue;
    ok(fromStart.has(h), `${name} reachable from the start`);
  }
  if (level.exit) {
    const ex = hostOf(plats, level.exit, 2);
    for (const [name, h] of named) if (h >= 0 && name !== 'exit') ok(bfs(adj, h).has(ex), `exit reachable from ${name}`);
  }
  for (const e of level.enemies || []) if (e.type !== 'drone') ok(hostOf(plats, e, 1) >= 0, `${e.type} at ${e.x},${e.z} stands on a deck`);
  for (const p of level.pickups || []) if (!p.fly) ok(hostOf(plats, p, 3) >= 0, `${p.type} at ${p.x},${p.z} is over a deck`);
  for (const L of level.lasers || []) {
    ok(hostOf(plats, L, 1) >= 0, `laser at ${L.x},${L.z} stands on a deck`);
    ok(L.on <= 0.6 && L.period * (1 - L.on) >= 1, `laser at ${L.x},${L.z} leaves a gap of ≥ 1 s`);
    // never fence in a drive, the exit or the portal
    const c = Math.cos(L.yaw || 0), s = Math.sin(L.yaw || 0);
    for (const o of [...(level.drives || []), level.exit, level.portal].filter(Boolean)) {
      const dx = o.x - L.x, dz = o.z - L.z, along = dx * c - dz * s, across = dx * s + dz * c;
      ok(!(Math.abs(along) < L.len / 2 + 0.5 && Math.abs(across) < 1.6 && o.y < L.y + L.h + 1.5 && o.y > L.y - 1), `laser at ${L.x},${L.z} clear of the objective at ${o.x},${o.z}`);
    }
  }
  console.log(`  reachable decks ${fromStart.size}/${plats.length}`);
}
console.log('reachability');
for (const s of STAGES) checkLevel(s, false);
for (const k in BONUS) checkLevel(BONUS[k], true);

// ------------------------------------------------------------------ 4. scripted play
console.log('scripted play');
for (const s of STAGES) {
  if (s.boss) { bossChecks(s); continue; }
  const w = createWorld(s);
  // teleport onto each drive in turn (the reachability proof covers getting there)
  for (const d of w.drives) {
    for (let i = 0; i < 4; i++) { const P = w.player; P.x = d.x; P.z = d.z; P.y = d.y - 0.9; P.vy = 0; step(w, C0); }
  }
  ok(w.drivesGot === 3 && w.exitOpen, `${s.id}: three drives open the exit`);
  const P = w.player, e = w.exit;
  P.x = e.x; P.z = e.z + 0.5; P.y = e.y + 0.05; P.vy = 0;
  for (let i = 0; i < 10; i++) step(w, C0);
  ok(w.phase === 'clear', `${s.id}: walking into the open gate clears the stage`);
  // the portal requests the bonus
  const w2 = createWorld(s), o = w2.portal;
  w2.player.x = o.x; w2.player.z = o.z; w2.player.y = o.y - 0.9;
  step(w2, C0);
  ok(w2.request === 'bonus', `${s.id}: the portal requests the bonus stage`);
  // falling costs health and respawns
  const w3 = createWorld(s);
  for (let i = 0; i < 60; i++) step(w3, C0);
  w3.player.y = (s.killY ?? -30) - 1; step(w3, C0);
  ok(w3.player.hp === T.HP_MAX - T.FALL_DAMAGE && w3.player.y > s.killY, `${s.id}: a fall costs ${T.FALL_DAMAGE} and respawns`);
  // a lit laser hurts once, then the blink protects
  if ((s.lasers || []).length) {
    const w5 = createWorld(s), L = w5.lasers[0];
    for (let i = 0; i < 30; i++) step(w5, C0);
    let hurt = 0;
    for (let i = 0; i < Math.round(L.period / T.DT) * 2; i++) {
      const P = w5.player; P.x = L.x; P.z = L.z; P.y = L.y; P.vx = P.vy = P.vz = 0; P.inv = 0;
      step(w5, C0);
      hurt += w5.events.filter((e) => e.type === 'zap').length; w5.events.length = 0;
    }
    ok(hurt > 0, `${s.id}: a lit laser wall hurts`);
  }
  // 120 s of seeded random play: nothing goes NaN, the player is somewhere sane
  const w4 = createWorld(s), rng = mulberry32(7);
  let c = { ...C0 };
  for (let i = 0; i < 120 * 120; i++) {
    if (i % 30 === 0) c = { mx: rng() * 2 - 1, my: rng() * 1.4 - 0.4, yaw: (rng() - 0.5) * 0.06, pitch: (rng() - 0.5) * 0.02, jump: rng() < 0.3, fire: rng() < 0.6, swap: rng() < 0.05 ? 1 : 0 };
    else c = { ...c, jump: false, swap: 0 };
    step(w4, c);
    w4.events.length = 0;
    if (w4.phase === 'dead') break;
  }
  const Q = w4.player;
  ok([Q.x, Q.y, Q.z, Q.vx, Q.vy, Q.vz, Q.yaw, Q.pitch].every(Number.isFinite), `${s.id}: 120 s random play stays finite`);
}
// ------------------------------------------------------------------ the boss stage
function bossChecks(s) {
  const keep = (w) => { const P = w.player; P.hp = T.HP_MAX; P.dead = false; if (w.phase === 'dead') w.phase = 'play'; };
  // 1. it chases a player who stands still
  {
    const w = createWorld(s), B = w.boss;
    for (let i = 0; i < 120 * 2.2; i++) { step(w, C0); keep(w); }
    const d0 = Math.hypot(B.cx - w.player.x, B.cz - w.player.z);
    for (let i = 0; i < 120 * 1.2; i++) { step(w, C0); keep(w); }
    const d1 = Math.hypot(B.cx - w.player.x, B.cz - w.player.z);
    ok(d1 < d0 - 2 || B.state !== 'chase', `${s.id}: ARACHNE-9 chases (${d0.toFixed(1)} → ${d1.toFixed(1)} m, ${B.state})`);
  }
  // 2. over 90 s it uses its whole move set, hits you, and its turret fires
  {
    const w = createWorld(s), B = w.boss, seen = new Set(), ev = new Set();
    let hurt = 0;
    for (let i = 0; i < 120 * 90; i++) {
      step(w, C0);
      seen.add(B.state); seen.add('surf:' + B.surf);
      for (const e of w.events) { ev.add(e.type + (e.from ? ':' + e.from : '')); if (e.type === 'hurt') hurt++; }
      w.events.length = 0;
      keep(w); w.player.inv = 0;
      if (i === 120 * 30) B.hp = B.maxHp * 0.5; // into phase 2: it starts climbing
    }
    for (const k of ['crouch', 'leap', 'recover', 'charge', 'laser', 'toWall', 'climb', 'ceil', 'drop', 'surf:wall', 'surf:ceil']) ok(seen.has(k), `${s.id}: boss reaches ${k}`);
    ok(ev.has('bossSlam') && ev.has('enemyFire:boss') && ev.has('bossPhase'), `${s.id}: slam, turret fire, phase change (${[...ev].filter((x) => x.startsWith('boss') || x.includes(':boss')).join(', ')})`);
    ok(hurt > 3, `${s.id}: it can actually hurt you (${hurt} hits in 90 s)`);
  }
  // 3. a stomp on its back: free bounce, damage, aim lock, and the gun fires on its own
  {
    const w = createWorld(s), B = w.boss;
    for (let i = 0; i < 30; i++) step(w, C0);
    const P = w.player, hp0 = B.hp;
    B.state = 'recover'; B.timer = 5;
    P.x = B.cx; P.z = B.cz + 0.3; P.y = B.cy + B.top / 2 + 0.3; P.vy = -4; P.ground = null;
    step(w, C0);
    ok(P.vy > 10 && B.hp < hp0 && P.lock === B, `${s.id}: stomping its back bounces you and locks on (hp ${hp0}→${B.hp})`);
    const shots0 = w.stats.shots;
    for (let i = 0; i < 40; i++) step(w, C0);
    ok(w.stats.shots > shots0 && P.auto > 0.5 && P.autoPitch < -0.6, `${s.id}: …the view swings down onto it and fires (${w.stats.shots - shots0} shots, pitch ${P.autoPitch.toFixed(2)})`);
  }
  // 4. kill it → dying → dead → exit opens → clear
  {
    const w = createWorld(s), B = w.boss;
    for (let i = 0; i < 120 * 2.5; i++) step(w, C0);
    B.hp = 1; B.state = 'chase';
    const P = w.player; P.x = 8; P.z = 4;
    let ev = [];
    for (let i = 0; i < 120 * 4; i++) {
      P.yaw = Math.atan2(-(B.cx - P.x), -(B.cz - P.z)); P.pitch = Math.atan2(B.cy - (P.y + T.EYE), Math.hypot(B.cx - P.x, B.cz - P.z)); P.auto = 0;
      step(w, { ...C0, fire: true }); ev.push(...w.events.map((e) => e.type)); w.events.length = 0; keep(w);
    }
    ok(B.dead && w.exitOpen && ev.includes('bossDying'), `${s.id}: killing ARACHNE-9 opens the exit`);
    P.x = w.exit.x; P.z = w.exit.z; P.y = w.exit.y + 0.05; P.vy = 0;
    for (let i = 0; i < 10; i++) step(w, C0);
    ok(w.phase === 'clear', `${s.id}: then the gate clears the stage`);
  }
  // 5. it never walks, lands or climbs through the racks, crates or lifts. You hop between perches,
  //    crate tops and the floor beside them for 3 minutes, in phase 2 so it climbs and drops too.
  {
    const w = createWorld(s), B = w.boss, A = s.arena, lane = A.climbX || [A.x0 + 8, A.x1 - 8];
    const spots = [[-23, 11, -21.5], [23, 11, 21.5], [-11, 2.4, 9], [12, 2.4, 12], [-24.6, 4.8, -11.5], [17, 0, -21.5], [-17, 0, 21.5], [-11, 0, 12], [0, 0, 18], [21, 0, -2], [-27.6, 8, 0], [10, 0, -13]];
    let worst = 0, where = '', laneBad = 0, floorT = 0, wallT = 0;
    B.hp = B.maxHp * 0.5;
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 6) === 0) { const [x, y, z] = spots[(i / (120 * 6)) % spots.length]; const P = w.player; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1;
      if (B.dead) break;
      if (B.surf === 'floor') {
        floorT++;
        for (const p of w.plats) {
          const top = p.h + p.oy, x = p.x + p.ox, z = p.z + p.oz;
          if (top <= A.floor + 0.3 || top - p.thick >= A.floor + BOSS.bodyH + 1.2 || x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) continue;
          const r = pushOut(p, B.cx, B.cz, BOSS.bodyR);
          if (r && r[2] > worst) { worst = r[2]; where = `${B.state} at (${B.cx.toFixed(1)}, ${B.cz.toFixed(1)}) in a ${p.style} at (${x}, ${z})`; }
        }
      } else if (B.surf === 'wall') { wallT++; if (B.cx < lane[0] - 0.01 || B.cx > lane[1] + 0.01) laneBad++; }
    }
    ok(worst < 0.25, `${s.id}: ARACHNE-9 stays out of racks, crates and lifts (worst overlap ${worst.toFixed(2)} m${where ? ': ' + where : ''})`);
    ok(wallT > 0 && laneBad === 0, `${s.id}: it climbs only in the lane clear of the racks (${wallT} wall steps, ${laneBad} outside)`);
    ok(floorT > 120 * 60, `${s.id}: …and still spends most of the fight on the floor (${(floorT / 120).toFixed(0)} s)`);
  }
}

// ------------------------------------------------------------------ stomps, spikes, slow-mo, respawns
{
  const base = { start: { x: 0, y: 0, z: 0 }, killY: -50, plats: [{ kind: 'rect', x: 0, z: 0, w: 40, d: 40, h: 0, thick: 2 }] };
  // a guard survives a stomp (2 of 3): bounce, lock-on, auto-fire
  let w = createWorld({ ...base, enemies: [{ type: 'guard', x: 0, y: 0, z: -6 }] });
  for (let i = 0; i < 10; i++) step(w, C0);
  let P = w.player, g = w.enemies[0];
  P.x = g.x; P.z = g.z; P.y = g.y + g.top + 0.3; P.vy = -3; P.ground = null;
  step(w, C0);
  ok(g.hp === 1 && P.lock === g && P.vy > 10, 'a stomp staggers a guard, bounces you and locks on');
  const sh = w.stats.shots;
  for (let i = 0; i < 50; i++) step(w, C0);
  ok(w.stats.shots > sh, 'bounce → aim down → the gun fires on its own');
  // drones and walkers die from the bounce alone
  for (const type of ['walker', 'drone']) {
    w = createWorld({ ...base, enemies: [{ type, x: 0, y: type === 'drone' ? 3 : 0, z: -6 }] });
    for (let i = 0; i < 10; i++) step(w, C0);
    P = w.player; g = w.enemies[0];
    P.x = g.x; P.z = g.z; P.y = g.y + g.top + 0.3; P.vy = -3; P.ground = null;
    step(w, C0);
    ok(g.dead && P.vy > 10, `a ${type} dies from the bounce alone`);
  }
  // a spiker hurts you instead
  w = createWorld({ ...base, enemies: [{ type: 'spiker', x: 0, y: 0, z: -6 }] });
  for (let i = 0; i < 10; i++) step(w, C0);
  P = w.player; g = w.enemies[0];
  P.x = g.x; P.z = g.z; P.y = g.y + g.top + 0.3; P.vy = -3; P.ground = null; P.inv = 0;
  step(w, C0);
  ok(!g.dead && P.hp === T.HP_MAX - T.SPIKE_DMG && P.vy > 5, 'landing on a spiker hurts and pops you up');
  // slow-mo: the world clock runs slow, yours doesn't; it ends
  w = createWorld({ ...base, pickups: [{ type: 'slowmo', x: 0, y: 1, z: 0 }, { type: 'health', x: 0, y: 1, z: 0, respawn: 2 }] });
  step(w, C0);
  ok(w.slow > 0, 'slow-mo pickup starts bullet time');
  const t0 = w.t, p0 = w.pt;
  for (let i = 0; i < 120; i++) step(w, C0);
  ok(Math.abs((w.pt - p0) / (w.t - t0) - T.SLOW_K) < 1e-6, `the world runs at ${T.SLOW_K}× while you run at 1×`);
  for (let i = 0; i < 120 * T.SLOW_TIME; i++) step(w, C0);
  ok(w.slow === 0, 'slow-mo runs out');
  // respawning pickup
  w.player.hp = 3; const hpk = w.pickups[1]; hpk.got = false; step(w, C0);
  ok(hpk.got, 'health picked up'); w.player.hp = T.HP_MAX; for (let i = 0; i < 120 * 2.1; i++) step(w, C0);
  ok(!hpk.got, 'a respawning pickup comes back');
}

for (const k in BONUS) {
  const B = BONUS[k];
  const w = createWorld(B);
  ok(w.bonus.total === B.servers.length && w.bonus.total >= 10, `${B.id}: ${w.bonus.total} servers`);
  for (let i = 0; i < Math.round((T.BONUS_TIME + 1) / T.DT); i++) step(w, C0);
  ok(w.phase === 'bonusTimeout', `${B.id}: the timer runs out after ${T.BONUS_TIME} s`);
  const w2 = createWorld(B);
  for (const e of w2.enemies) { e.hp = 1; }
  for (const e of w2.enemies) { const P = w2.player; P.x = e.x; P.z = e.z; P.y = e.y + e.top + 0.3; P.vy = -3; step(w2, C0); }
  for (let i = 0; i < 5; i++) step(w2, C0);
  ok(w2.phase === 'bonusClear', `${B.id}: stomping every server clears it`);
}

console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
process.exit(fails ? 1 : 0);
