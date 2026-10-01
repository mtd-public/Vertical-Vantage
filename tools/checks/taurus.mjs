// sim-check for TAURUS-312 (NEO CHICAGO's BULL PEN). The generic boss checks run first (roar, hurts,
// stays in its arena, random play, down → exit). These are the bull's own:
//   telegraphs are long enough · every charge is preceded by a paw · it uses its whole move set and
//   chains charges in its later phases · a charge into a pylon stuns it (×1.5) · a stomp while it's
//   stunned does big damage · a player left in the lane is trampled · a player who sidesteps when the
//   lane locks gets away · a new phase rears it up (shots glance off) and drops a drone · it never
//   walks or charges into a pylon or a crate.
import { TAURUS as S } from '../../js/sim/bosses/taurus.js';
import { pushOut } from '../../js/sim/plats.js';
import { damageEnemy } from '../../js/sim/enemies.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id;
  const tele = [...S.paw, S.chainPaw, ...S.toss, ...S.crouch, S.podTele];
  ok(tele.every((t) => t >= 0.5) && S.lock >= 0.3 && S.lock < Math.min(...S.paw, S.chainPaw), `${id}: every TAURUS-312 telegraph is ≥ 0.5 s, with a ${S.lock} s locked lane at the end of each paw`);
  ok(Math.max(...S.charge) > T.RUN * 1.8 && Math.max(...S.walk) < T.RUN * 0.7, `${id}: it stalks slower than you run (${S.walk.join('/')}) and charges ~2× faster (${S.charge.join('/')} m/s)`);

  // 1. three minutes against a player hopping between spots: the whole move set, fair telegraphs, no clipping
  {
    const w = createWorld(s), B = w.boss, A = s.arena;
    const spots = [[0, 0, 18], [15, 0, 6], [-15, 0, -16], [-36.5, 6.6, 0], [0, 0, 0], [22, 0, 10], [15, 12, -11], [0, 13, 0], [-20, 0, 18], [10, 2.2, -26.5], [-8, 0, -4], [6, 0, -18]];
    const seen = new Set(), zones = new Set();
    let prev = B.state, pawT = 0, shortPaw = 0, charges = 0, chains = 0, crashes = 0, skids = 0, hurt = 0, worst = 0, where = '', badZone = 0, enemies0 = w.enemies.length, rageVuln = true;
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 6) === 0) { const [x, y, z] = spots[(i / (120 * 6)) % spots.length]; const P = w.player; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      if (i === 120 * 60) B.hp = B.maxHp * 0.6;
      if (i === 120 * 120) B.hp = B.maxHp * 0.3;
      step(w, C0);
      for (const e of w.events) if (e.type === 'hurt') hurt++;
      w.events.length = 0; keep(w); w.player.inv = 0;
      for (const Z of w.zones) if (!zones.has(Z)) { zones.add(Z); if (Z.max < 0.5) badZone++; }
      if (B.state === 'paw') pawT += T.DT; // (world clock = step clock: no slow-mo here)
      if (B.state !== prev) {
        if (B.state === 'charge') { charges++; if (pawT < 0.5 - 1e-6) shortPaw++; }
        if (prev === 'skid' && B.state === 'paw') chains++;
        if (B.state === 'stun') crashes++;
        if (B.state === 'skid') skids++;
        if (B.state !== 'charge') pawT = 0;
        prev = B.state;
      }
      if (B.state === 'rage' && B.vuln !== 0) rageVuln = false;
      seen.add(B.state);
      if (B.surf === 'floor') for (const pid of B.solids) {
        const p = w.plats[pid], r = pushOut(p, B.cx, B.cz, S.bodyR);
        if (r && r[2] > worst) { worst = r[2]; where = `${B.state} at (${B.cx.toFixed(1)}, ${B.cz.toFixed(1)}) in a ${p.style} at (${p.x}, ${p.z})`; }
      }
      if (B.cx < A.x0 || B.cx > A.x1 || B.cz < A.z0 || B.cz > A.z1) worst = Math.max(worst, 9);
    }
    for (const k of ['stalk', 'paw', 'charge', 'stun', 'shake', 'skid', 'crouch', 'leap', 'recover', 'pods', 'rage']) ok(seen.has(k), `${id}: TAURUS-312 reaches ${k}`);
    ok(charges >= 8 && shortPaw === 0, `${id}: every charge comes after a paw of ≥ 0.5 s (${charges} charges, ${shortPaw} short)`);
    ok(crashes >= 3 && skids >= 2 && chains >= 1, `${id}: charges crash (${crashes}), skid (${skids}) and chain in later phases (${chains})`);
    ok(badZone === 0 && zones.size > 0, `${id}: every danger ring gives ≥ 0.5 s warning (${zones.size} rings)`);
    ok(rageVuln && w.enemies.length >= enemies0 + 2, `${id}: a new phase rears it up (shots glance off) and drops a drone (${w.enemies.length - enemies0} spawned)`);
    ok(hurt > 5, `${id}: it can actually hurt you (${hurt} hits in 3 min)`);
    ok(worst < 0.3, `${id}: it never walks or charges into a pylon or a crate (worst overlap ${worst.toFixed(2)} m${where ? ': ' + where : ''})`);
  }

  // a fresh fight with the intro done, the bull at (x, z) facing +Z and pawing at a player standing at (px, pz)
  const setup = (x, z, px, pz) => {
    const w = createWorld(s), B = w.boss, P = w.player;
    for (let i = 0; i < 120 * 2.5; i++) { step(w, C0); keep(w); }
    for (const e of w.enemies) if (e !== B) e.dead = true; // just the two of you
    w.bolts.length = 0; w.zones.length = 0;
    B.cx = x; B.cz = z; B.fx = 0; B.fz = 1; B.state = 'paw'; B.timer = S.paw[0]; B.chainLeft = 0; B.v = 0;
    P.x = px; P.y = 0; P.z = pz; P.vx = P.vy = P.vz = 0; P.inv = 0; P.hp = T.HP_MAX; P.yaw = 0;
    return { w, B, P };
  };

  // 2. lure it into a pylon: you stand in front of one, sidestep as it charges; it crashes and is stunned
  {
    const { w, B, P } = setup(15, -8, 15, 4);
    let n = 0;
    while (B.state === 'paw' && n++ < 300) step(w, C0);
    P.x = 25; P.z = 0; // out of the lane
    n = 0;
    while (B.state === 'charge' && n++ < 600) step(w, C0);
    step(w, C0);
    ok(B.state === 'stun' && B.vuln === S.stunVuln && B.cz < 9.5 - S.bodyR + 0.3, `${id}: a charge into a floodlight pylon stuns it (${B.state}, vuln ${B.vuln}, stopped at z ${B.cz.toFixed(1)})`);
    // 3. …and a stomp on its back now does big damage, bounces you and locks on
    const hp0 = B.hp;
    P.x = B.cx; P.z = B.cz + 0.3; P.y = B.y + B.top + 0.3; P.vy = -4; P.ground = null; P.inv = 0;
    step(w, C0); step(w, C0); step(w, C0);
    const dmg = hp0 - B.hp, want = 4 * S.stunVuln + S.stunStomp;
    ok(dmg >= want - 0.01 && P.vy > 8 && P.lock === B, `${id}: a stomp while it's stunned does ${dmg.toFixed(1)} (≥ ${want}), bounces you and locks on`);
  }

  // 4. stand in the lane and you're trampled: two cells, thrown clear
  {
    const { w, B, P } = setup(0, -10, 0, 6);
    let hurtDmg = 0, thrown = false;
    for (let i = 0; i < 120 * 3 && B.state !== 'stun' && B.state !== 'snort'; i++) {
      step(w, C0);
      for (const e of w.events) if (e.type === 'hurt') { hurtDmg = Math.max(hurtDmg, e.dmg); thrown ||= P.vy > 5 && !P.ground; }
      w.events.length = 0;
    }
    ok(hurtDmg === S.trample && thrown, `${id}: a player left in its lane is trampled for ${hurtDmg} and thrown`);
  }

  // 5. sidestep once the lane locks (or even once the charge starts) and it misses you
  for (const cue of ['locked', 'charge']) {
    const { w, B, P } = setup(0, -10, 0, 4);
    let hurt = 0, go = false;
    for (let i = 0; i < 120 * 3 && B.state !== 'stun' && B.state !== 'snort'; i++) {
      go ||= cue === 'locked' ? B.locked : B.state === 'charge';
      step(w, { ...C0, mx: go ? 1 : 0 });
      for (const e of w.events) if (e.type === 'hurt') hurt++;
      w.events.length = 0;
    }
    ok(hurt === 0, `${id}: sidestepping when ${cue === 'locked' ? 'the lane locks' : 'the charge starts'} (14 m away) gets you clear (${hurt} hits)`);
  }

  // 5b. close in front of it, it tosses its horns: a ring in front of it, ≥ 0.5 s to get out
  {
    let tossed = false, ring = 0;
    for (let k = 0; k < 12 && !tossed; k++) {
      const { w, B } = setup(0, -10, 0, -5);
      B.state = 'stalk'; B.timer = 0.01 + k * 0.013; // (a different seeded pick each try)
      for (let i = 0; i < 120 * 1.5 && !tossed; i++) { step(w, C0); keep(w); if (B.state === 'toss') { tossed = true; ring = w.zones.length ? w.zones[0].max : 0; } }
    }
    ok(tossed && ring >= 0.5, `${id}: up close it tosses its horns (a ring with ${ring.toFixed(2)} s warning)`);
  }

  // 6. while it rears up at a new phase, shots glance off
  {
    const { w, B } = setup(0, -10, 0, 18);
    B.state = 'stalk'; B.timer = 0; B.hp = B.maxHp * 0.6;
    let n = 0;
    while (B.state !== 'rage' && n++ < 120 * 4) { step(w, C0); keep(w); }
    const hp0 = B.hp;
    damageEnemy(w, B, 5, false, { x: 0, y: 1, z: 0 });
    ok(B.state === 'rage' && B.hp === hp0, `${id}: rearing up at phase ${B.phase}, it shrugs off shots (${B.state}, hp ${hp0.toFixed(0)} → ${B.hp.toFixed(0)})`);
  }
}
