// The world: createWorld(level, opts) + step(w, control). Pure (no three.js, no DOM).
//
//   * fixed step T.DT (1/120 s); the caller runs N steps per rendered frame from an accumulator
//   * everything the outside world needs to react to is pushed to w.events ({ type, ... });
//     the caller drains it once per frame (sfx, particles, toasts, haptics)
//   * phases: 'play' → 'dead' | 'clear' (main stage) | 'bonusClear' | 'bonusTimeout' (bonus stage)
//   * w.request = 'bonus' when the player steps into the bonus portal (main.js swaps worlds)
import { T, WEAPONS } from './tuning.js';
import { mulberry32 } from './util.js';
import { makePlats, posePlats, updatePlats } from './plats.js';
import { makePlayer, updatePlayer, hurtPlayer, respawn } from './player.js';
import { makeEnemy, updateEnemies, updateShots, updateBolts, attach, place } from './enemies.js';
import { makeLaser, updateLasers } from './hazards.js';

export function createWorld(level, opts = {}) {
  const w = {
    level, opts: { autoLook: true, ...opts },
    t: 0, time: 0, rng: mulberry32(level.seed || 1), nextId: 1,
    plats: makePlats(level.plats),
    player: null, enemies: [], shots: [], bolts: [], pickups: [], drives: [], lasers: [], exit: null, portal: null,
    events: [], score: 0, drivesGot: 0, exitOpen: false, phase: 'play', request: null,
    bonus: null, clear: null,
    stats: { kills: 0, stomps: 0, shots: 0, hits: 0, damage: 0, falls: 0 },
  };
  posePlats(w.plats, 0);
  w.player = makePlayer(level.start);
  for (const d of level.enemies || []) w.enemies.push(makeEnemy(w, d));
  for (const d of level.servers || []) w.enemies.push(makeEnemy(w, { ...d, type: 'server' }));
  for (const d of level.pickups || []) w.pickups.push(thing(w, d, d.type));
  for (const d of level.lasers || []) w.lasers.push(makeLaser(w, d));
  for (const d of level.drives || []) w.drives.push(thing(w, d, 'drive'));
  if (level.exit) { w.exit = thing(w, level.exit, 'exit'); w.exit.yaw = level.exit.yaw || 0; }
  if (level.portal) w.portal = thing(w, level.portal, 'portal');
  if (level.bonus) w.bonus = { left: level.time || T.BONUS_TIME, total: (level.servers || []).length, down: 0 };
  // land the player on the deck under the start point
  w.player.y += 0.02;
  return w;
}

function thing(w, d, type) {
  const o = { id: w.nextId++, type, x: d.x, y: d.y, z: d.z, got: false, used: false, t: 0, host: null, lx: 0, ly: 0, lz: 0 };
  if (!d.fly) { attach(w.plats, o, 8); place(o); }
  return o;
}

export function step(w, c) {
  const dt = T.DT;
  w.t += dt;
  updatePlats(w.plats, w.t);
  if (w.phase !== 'play') { // the world keeps moving under the result card, but nothing happens
    for (const o of w.pickups) place(o);
    for (const o of w.drives) place(o);
    if (w.exit) place(w.exit);
    for (const o of w.lasers) place(o);
    return;
  }
  w.time += dt;
  updatePlayer(w, c, dt);
  updateLasers(w);
  updateEnemies(w, dt);
  updateShots(w, dt);
  updateBolts(w, dt);
  pickups(w, dt);
  objectives(w, dt);
  falls(w);
}

// ------------------------------------------------------------------ pickups
function near(P, o, r) {
  const dx = P.x - o.x, dy = (P.y + 0.9 - o.y) * 0.6, dz = P.z - o.z;
  return dx * dx + dy * dy + dz * dz < r * r;
}

function pickups(w, dt) {
  const P = w.player;
  for (const o of w.pickups) {
    o.t += dt;
    place(o);
    if (o.got || P.dead || !near(P, o, T.PICKUP_R)) continue;
    if (!collect(w, P, o)) continue;
    o.got = true;
    w.events.push({ type: 'pickup', kind: o.type, x: o.x, y: o.y, z: o.z });
  }
  for (const o of w.drives) {
    o.t += dt;
    place(o);
    if (o.got || P.dead || !near(P, o, T.PICKUP_R + 0.3)) continue;
    o.got = true;
    w.drivesGot++;
    w.score += T.SCORE.drive;
    w.events.push({ type: 'drive', n: w.drivesGot, of: w.drives.length, x: o.x, y: o.y, z: o.z });
    if (w.drivesGot >= Math.min(T.DRIVES, w.drives.length) && !w.exitOpen) {
      w.exitOpen = true;
      w.events.push({ type: 'exitOpen', x: w.exit?.x, y: w.exit?.y, z: w.exit?.z });
    }
  }
}

// Apply a pickup. Returns false to leave it there (health at full health).
function collect(w, P, o) {
  switch (o.type) {
    case 'health': if (P.hp >= T.HP_MAX) return false; P.hp = Math.min(T.HP_MAX, P.hp + T.HEAL_SMALL); return true;
    case 'healthBig': if (P.hp >= T.HP_MAX) return false; P.hp = T.HP_MAX; return true;
    case 'spread': case 'rapid': case 'rocket': {
      const W = WEAPONS[o.type];
      P.ammo[o.type] = Math.min(W.ammo * 2, P.ammo[o.type] + W.ammo);
      if (P.weapon !== o.type) { P.weapon = o.type; P.cool = Math.max(P.cool, 0.1); }
      return true;
    }
    case 'hyper': P.hyper = Math.min(T.POWER_TIME * 2, P.hyper + T.POWER_TIME); return true;
    case 'overdrive': P.over = Math.min(T.POWER_TIME * 2, P.over + T.POWER_TIME); return true;
    case 'time': if (!w.bonus) return false; w.bonus.left += T.TIME_BONUS; return true;
    default: return true;
  }
}

// ------------------------------------------------------------------ objectives
function objectives(w, dt) {
  const P = w.player;
  if (w.exit) {
    const e = w.exit;
    place(e);
    e.t += dt;
    if (w.exitOpen && !P.dead) {
      const dx = P.x - e.x, dz = P.z - e.z;
      if (dx * dx + dz * dz < T.EXIT_R * T.EXIT_R && P.y > e.y - 1.5 && P.y < e.y + 4) finish(w);
    }
  }
  if (w.portal) {
    const o = w.portal;
    place(o);
    o.t += dt;
    if (!o.used && !P.dead && near(P, o, T.PORTAL_R)) {
      o.used = true;
      w.request = 'bonus';
      w.events.push({ type: 'portal', x: o.x, y: o.y, z: o.z });
    }
  }
  if (w.bonus) {
    const B = w.bonus;
    B.down = w.enemies.filter((e) => e.type === 'server' && e.dead).length;
    B.left = Math.max(0, B.left - dt);
    if (B.down >= B.total && B.total > 0) {
      const secs = Math.floor(B.left);
      const pts = T.SCORE.bonusClear + secs * T.SCORE.perSecondLeft;
      w.score += pts;
      w.clear = { bonus: pts, secs };
      w.phase = 'bonusClear';
      w.events.push({ type: 'bonusClear', pts });
    } else if (B.left <= 0) {
      w.phase = 'bonusTimeout';
      w.events.push({ type: 'bonusTimeout' });
    }
  }
}

function finish(w) {
  const P = w.player, par = w.level.par || 180;
  const timeBonus = Math.max(0, Math.round((par - w.time) * T.SCORE.timePar));
  const hpBonus = P.hp * 250;
  w.score += timeBonus + hpBonus;
  w.clear = { timeBonus, hpBonus, time: w.time };
  w.phase = 'clear';
  w.events.push({ type: 'clear', timeBonus, hpBonus });
}

function falls(w) {
  const P = w.player;
  if (P.y > (w.level.killY ?? -30) || P.dead) return;
  w.stats.falls++;
  if (w.bonus) {
    w.bonus.left = Math.max(0, w.bonus.left - T.BONUS_FALL_PENALTY);
    w.events.push({ type: 'fall', penalty: T.BONUS_FALL_PENALTY });
    respawn(w);
    return;
  }
  P.inv = 0;
  w.events.push({ type: 'fall' });
  hurtPlayer(w, T.FALL_DAMAGE);
  if (!P.dead) { respawn(w); P.inv = T.INVULN; }
}

// Things the HUD wants without reaching into the sim's internals.
export function snapshot(w) {
  const P = w.player;
  return {
    hp: P.hp, hpMax: T.HP_MAX, weapon: P.weapon, ammo: P.weapon === 'blaster' ? Infinity : P.ammo[P.weapon],
    drives: w.drivesGot, drivesTotal: w.drives.length, exitOpen: w.exitOpen, score: w.score, time: w.time,
    jumpsLeft: P.ground ? T.JUMP_V.length : Math.max(0, T.JUMP_V.length - P.jumps), alt: P.y,
    hyper: P.hyper, over: P.over, bonus: w.bonus ? { left: w.bonus.left, down: w.bonus.down, total: w.bonus.total } : null,
    phase: w.phase,
  };
}
