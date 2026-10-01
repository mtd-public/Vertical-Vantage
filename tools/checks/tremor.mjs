// sim-check for TREMOR (js/sim/bosses/tremor.js), on top of the generic boss checks:
//   1. it digs in, is invulnerable underground, and every ring it lays gives ≥ 0.7 s (emerge) / ≥ 0.5 s (any)
//   2. a player who steps out of the emerge ring isn't hit by it
//   3. the drill-spin shockwave can be jumped, and leaves it stunned (×1.5, stompable): a stomp bounces you
//   4. phase 2 adds fault cracks, phase 3 the aftershock ring
//   5. it never surfaces inside a boulder or a tree trunk
import { damageEnemy } from '../../js/sim/enemies.js';
import { pushOut } from '../../js/sim/plats.js';
import { TREMOR } from '../../js/sim/bosses/tremor.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id;
  // 1 + 4: rings and invulnerability over 2 minutes (the player stands on the west terrace, out of the drill's reach)
  {
    const w = createWorld(s), B = w.boss, kinds = new Set(), states = new Set();
    let minEmerge = 9, minAny = 9, shotUnder = 0, hpUnder = 0;
    const seen = new Set();
    for (let i = 0; i < 120 * 120; i++) {
      if (i % 600 === 0) { const P = w.player; P.x = i % 1200 ? -35.5 : 0; P.y = i % 1200 ? 4 : 0; P.z = i % 1200 ? 0 : 20; P.vx = P.vy = P.vz = 0; }
      step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1;
      states.add(B.state);
      for (const Z of w.zones) if (!seen.has(Z)) { seen.add(Z); kinds.add(Z.kind); minAny = Math.min(minAny, Z.max); if (Z.kind === 'drill') minEmerge = Math.min(minEmerge, Z.max); }
      if (B.state === 'burrow' && shotUnder < 3) { const hp = B.hp; damageEnemy(w, B, 5, false, { vx: 0, vy: 0, vz: -1 }); shotUnder++; if (B.hp < hp) hpUnder++; }
      if (i === 120 * 40) B.hp = B.maxHp * 0.5;
      if (i === 120 * 80) B.hp = B.maxHp * 0.25;
    }
    for (const k of ['digTele', 'dig', 'burrow', 'emergeTele', 'emerge', 'stuck', 'crawl', 'boltTele', 'bolts']) ok(states.has(k), `${id}: TREMOR reaches ${k}`);
    ok(shotUnder > 0 && hpUnder === 0, `${id}: underground it can't be hurt (${shotUnder} hits tried)`);
    ok(minEmerge >= 0.7 && minAny >= 0.5, `${id}: every ring is telegraphed (emerge ≥ 0.7 s: ${minEmerge.toFixed(2)}, any ≥ 0.5 s: ${minAny.toFixed(2)})`);
    ok(kinds.has('crack') && kinds.has('quake'), `${id}: phase 2 cracks the ground and phase 3 adds aftershock rings (${[...kinds].join(', ')})`);
  }
  // 2: step out of the emerge ring as soon as it appears: no hit from it
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    let dodged = 0, hitBy = 0;
    for (let i = 0; i < 120 * 90 && dodged < 3; i++) {
      step(w, C0);
      const Z = w.zones.find((z) => z.kind === 'drill' && z.t > z.max - 0.05);
      if (Z) { P.x = Z.x + (Z.x > 0 ? -Z.r - 2.5 : Z.r + 2.5); P.z = Z.z; P.vx = P.vz = 0; P.inv = 0; const hp = P.hp; for (let k = 0; k < Math.ceil(Z.max / T.DT) + 2; k++) { step(w, C0); P.inv = 0; } if (P.hp < hp && !w.events.some((e) => e.type === 'enemyFire')) hitBy++; dodged++; }
      w.events.length = 0; keep(w);
    }
    ok(dodged >= 2 && hitBy === 0, `${id}: stepping out of the emerge ring dodges it (${dodged} tries, ${hitBy} hit)`);
  }
  // 3: the spin: jump it, then it's stunned and stompable
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    for (let i = 0; i < 120 * 3; i++) { step(w, C0); keep(w); }
    B.state = 'crawl'; B.timer = 0; B.cx = 0; B.cz = 0; B.cy = TREMOR.bodyH; B.surf = 'floor'; B.depth = 0;
    P.x = 0; P.z = 5; P.y = 0;
    w.rng = () => 0.5; // (the close-range pick lands on the spin)
    let spun = false;
    for (let i = 0; i < 120 * 3 && !spun; i++) { step(w, C0); keep(w); if (B.state === 'spinTele') spun = true; }
    ok(spun, `${id}: up close it revs the drill (${B.state})`);
    const hp0 = P.hp;
    while (B.state === 'spinTele') { if (B.timer < 0.25) { P.y = 2.2; P.vy = 0; P.ground = null; } P.inv = 0; step(w, C0); }
    step(w, C0); // (vuln is set on its first stunned step)
    ok(P.hp === hp0 && B.state === 'stunned' && B.vuln === TREMOR.stunVuln, `${id}: jumping the shockwave avoids it, then TREMOR is stunned (${B.state}, ×${B.vuln})`);
    const bh = B.hp;
    P.x = B.cx; P.z = B.cz + 0.3; P.y = B.cy + B.top / 2 + 0.3; P.vy = -4; P.ground = null;
    step(w, C0);
    ok(P.vy > 10 && B.hp < bh && P.lock === B, `${id}: stomping its stunned back bounces you and hurts it (${bh.toFixed(0)} → ${B.hp.toFixed(0)})`);
  }
  // 5: it never surfaces inside a solid
  {
    const w = createWorld(s), B = w.boss, A = s.arena;
    const spots = [[-12, 2.6, 8], [13, 3, -6], [0, 0, 18], [-21, 3.2, -4], [10, 0, 0], [18, 9, -18], [-20, 0, 15], [21, 2, 5]];
    let worst = 0, where = '';
    for (let i = 0; i < 120 * 150; i++) {
      if (i % (120 * 5) === 0) { const [x, y, z] = spots[(i / (120 * 5)) % spots.length]; const P = w.player; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1;
      if (B.surf !== 'floor' || B.dead) continue;
      for (const p of w.plats) {
        const top = p.h + p.oy, x = p.x + p.ox, z = p.z + p.oz;
        if (top <= A.floor + 0.3 || top - p.thick >= B.cy + B.top / 2 || x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) continue;
        const r = pushOut(p, B.cx, B.cz, TREMOR.bodyR);
        if (r && r[2] > worst) { worst = r[2]; where = `${B.state} at (${B.cx.toFixed(1)}, ${B.cz.toFixed(1)}) in a ${p.style}`; }
      }
    }
    ok(worst < 0.3, `${id}: TREMOR stays out of boulders and trunks (worst overlap ${worst.toFixed(2)} m${where ? ': ' + where : ''})`);
  }
}
