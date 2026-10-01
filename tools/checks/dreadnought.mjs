// sim-checks for DREADNOUGHT (tools/sim-check.mjs runs the generic boss checks first).
// Shield and pods, opening up, every attack telegraphed and dodgeable, stomps, re-arming by phase,
// the minions dying with it, and an aimbot fight that lasts as long as a boss fight should.
import { damageEnemy } from '../../js/sim/enemies.js';
import { raycast } from '../../js/sim/plats.js';
import { bossKind } from '../../js/sim/bosses/index.js';
import { tuning as S, bombingRun } from '../../js/sim/bosses/dreadnought.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id;
  const tick = (w, n, c = C0, f = null) => { for (let i = 0; i < n; i++) { step(w, c); if (f) f(w); w.events.length = 0; keep(w); w.player.inv = 1; } };
  const podsOf = (w, B) => w.enemies.filter((m) => B.pods.includes(m.id) && !m.dead);
  const killPods = (w, B) => { for (const m of podsOf(w, B)) damageEnemy(w, m, 99); };
  const openUp = (w, B) => { tick(w, 120 * 4); killPods(w, B); tick(w, 120 * (S.unseal + 0.3)); };

  // 1. it raises its four flak pods on decks and is shielded while they live
  {
    const w = createWorld(s), B = w.boss, K = bossKind(B);
    tick(w, 120 * 4);
    const pods = podsOf(w, B);
    ok(pods.length === 4 && pods.every((m) => m.type === 'turret' && m.host && m.hp === S.podHp[0]), `${id}: DREADNOUGHT raises 4 flak pods on decks (${pods.length}, hp ${pods.map((m) => m.hp)})`);
    const hp0 = B.hp; damageEnemy(w, B, 10);
    ok(B.state === 'shielded' && B.vuln === 0 && B.hp === hp0 && !K.stompable(B), `${id}: shielded while its pods live: shots glance off, no stomps (${B.state}, hp ${hp0}→${B.hp})`);
    // a shielded crown shoves you off instead of bouncing you
    const P = w.player; P.x = B.cx; P.z = B.cz + 0.3; P.y = B.y + B.top + 0.3; P.vy = -4; P.ground = null; P.inv = 0;
    let hurt = 0; for (let i = 0; i < 30; i++) { step(w, C0); hurt += w.events.filter((e) => e.type === 'hurt').length; w.events.length = 0; }
    ok(hurt > 0 && P.lock !== B && B.hp === hp0, `${id}: landing on the shut dome hurts and shoves you off`);
  }
  // 2. the pods down → it opens: vulnerable, stompable
  {
    const w = createWorld(s), B = w.boss, K = bossKind(B);
    openUp(w, B);
    ok(B.open && B.vuln >= 1 && K.stompable(B), `${id}: every pod down → the armour opens (${B.state}, vuln ${B.vuln})`);
    const hp0 = B.hp; damageEnemy(w, B, 5);
    ok(B.hp < hp0, `${id}: …and shots now hurt it (hp ${hp0}→${B.hp})`);
  }
  // 3. open for 70 s with you moving round the deck: it uses everything, all telegraphed, within limits
  {
    const w = createWorld(s), B = w.boss;
    openUp(w, B);
    const spots = [[0, 15.5], [-13, 6], [13, -2], [0, -15], [-4.5, 2.5], [9, 12], [-15, -8], [4.6, -1.5]];
    const used = new Set(); let chargeT = -1, minSight = 99, minZone = 99, maxZones = 0, maxDrones = 0, t = 0, hurt = 0;
    for (let i = 0; i < 120 * 70; i++) {
      if (i % (120 * 4) === 0) { const [x, z] = spots[(i / (120 * 4)) % spots.length]; const P = w.player; P.x = x; P.z = z; P.y = x * x + z * z < 30 ? 1.2 : 0; P.vx = P.vz = 0; }
      step(w, C0); t += T.DT;
      for (const e of w.events) {
        if (e.type === 'bossCharge') { chargeT = t; used.add('laser'); }
        if (e.type === 'enemyFire' && e.from === 'boss') used.add('salvo');
        if (e.type === 'zoneTele') used.add(e.kind);
        if (e.type === 'hurt') hurt++;
      }
      if (B.beam.on && chargeT >= 0) { minSight = Math.min(minSight, t - chargeT); chargeT = -1; }
      for (const Z of w.zones) minZone = Math.min(minZone, Z.max);
      maxZones = Math.max(maxZones, w.zones.length);
      const drones = w.enemies.filter((m) => m.type === 'drone' && !m.dead && B.drones.includes(m.id));
      if (drones.length) used.add('drones');
      maxDrones = Math.max(maxDrones, drones.length);
      w.events.length = 0; keep(w); w.player.inv = 0;
      if (B.hp < B.maxHp * 0.7) B.hp = B.maxHp * 0.7; // (stay in phase 1)
    }
    for (const k of ['laser', 'salvo', 'bomb', 'drones', 'pulse']) ok(used.has(k), `${id}: open, it uses its ${k} (${[...used].join(', ')})`);
    ok(minSight >= 0.85, `${id}: the laser's sight line shows ≥ 0.85 s before the beam (${minSight.toFixed(2)} s)`);
    ok(minZone >= 0.5, `${id}: every danger zone is telegraphed ≥ 0.5 s (${minZone.toFixed(2)} s)`);
    ok(maxZones <= 10, `${id}: never more than 10 zones at once (the renderer draws 10): ${maxZones}`);
    ok(maxDrones <= S.droneCap, `${id}: never more than ${S.droneCap} of its drones up (${maxDrones})`);
    ok(hurt >= 3, `${id}: and it hurts (${hurt} hits in 70 s)`);
  }
  // 4. the sweep is a jump: stand still and it cuts you; jump as it comes and it passes under
  {
    const run = (jumpAt) => {
      const w = createWorld(s), B = w.boss, P = w.player;
      openUp(w, B);
      P.x = 0; P.z = 14; P.y = 0; P.vx = P.vy = P.vz = 0;
      tick(w, 30);
      B.state = 'charge'; B.timer = S.charge[0]; B.misN = 0; B.misT = 0; B.droneT = 0; w.zones.length = 0; B.pulseCD = 99;
      let hits = 0, lt = -1, jumped = false;
      for (let i = 0; i < 120 * 5; i++) {
        if (B.state === 'laser' && lt < 0) lt = 0;
        if (lt >= 0) lt += T.DT;
        const jump = jumpAt !== null && !jumped && lt >= jumpAt;
        if (jump) jumped = true;
        step(w, { ...C0, jump });
        hits += w.events.filter((e) => e.type === 'zap').length; w.events.length = 0;
        P.hp = T.HP_MAX; B.pulseCD = 99;
        for (const m of w.enemies) if (m.type === 'drone') m.dead = true;
        w.bolts.length = 0;
      }
      return hits;
    };
    const still = run(null), half = S.sweepTime[0] / 2;
    const hop = run(half - 0.35);
    ok(still > 0, `${id}: the laser sweep cuts a player who stands still (${still})`);
    ok(hop === 0, `${id}: …and a single jump as it comes passes over it (${hop})`);
  }
  // 5. a bombing run is a line through you (a cross in phase 3): ≥ 1.25 s to react, a 5 m step clears it
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    openUp(w, B);
    let clear = true, n = 0;
    const spots = [[-6, 14], [8, 10], [0, 16], [-12, -8], [12, -6], [3, -16], [-16, 4], [16, 4]];
    spots.forEach(([x, z], k) => {
      w.zones.length = 0; P.x = x; P.z = z; P.y = 0;
      B.phase = 1 + (k % 3);
      bombingRun(w, B, B.phase === 3);
      const Z = w.zones.filter((q) => q.kind === 'bomb');
      if (Z.length < 3) return;
      n++;
      if (Math.min(...Z.map((q) => q.max)) < 1.2) clear = false;
      // a spot 5 m off the line (either side, and for a cross: diagonally off both)
      const ux = Z[1].x - Z[0].x, uz = Z[1].z - Z[0].z, l = Math.sqrt(ux * ux + uz * uz) || 1;
      const outs = B.phase === 3 ? [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [x + (ux / l * a - uz / l * b) * 5, z + (uz / l * a + ux / l * b) * 5]) : [[x - uz / l * 5, z + ux / l * 5], [x + uz / l * 5, z - ux / l * 5]];
      const safe = ([sx, sz]) => Z.every((q) => (q.x - sx) * (q.x - sx) + (q.z - sz) * (q.z - sz) > (q.r + T.RADIUS) * (q.r + T.RADIUS));
      if (!outs.some(safe)) clear = false;
    });
    w.zones.length = 0;
    ok(n >= 6 && clear, `${id}: bombing runs land ≥ 1.2 s after the call and a 5 m step out of the line clears them (${n} runs)`);
  }
  // 6. a stomp on the open crown: bounce, damage, lock-on, and it staggers (×1.5, attack cut short)
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    openUp(w, B);
    B.state = 'charge'; B.timer = 5;
    const hp0 = B.hp;
    P.x = B.cx; P.z = B.cz + 0.3; P.y = B.y + B.top + 0.3; P.vy = -4; P.ground = null;
    step(w, C0); step(w, C0);
    ok(P.vy > 9 && B.hp < hp0 && P.lock === B, `${id}: stomping the open crown bounces you and locks on (hp ${hp0}→${B.hp})`);
    ok(B.state === 'stagger' && B.vuln === S.ventVuln && !B.beam.sight, `${id}: …and staggers it out of its laser (${B.state}, vuln ${B.vuln})`);
    const shots0 = w.stats.shots;
    for (let i = 0; i < 40; i++) step(w, C0);
    ok(w.stats.shots > shots0, `${id}: …the view swings down onto it and the gun fires on its own`);
  }
  // 7. crossing 62 % seals it and re-arms 3 pods on the towers; 30 %: 2 pods on the circling sponsons
  {
    const w = createWorld(s), B = w.boss;
    openUp(w, B);
    B.hp = B.maxHp * 0.6;
    tick(w, 120 * (S.seal + S.arm + 0.3));
    let pods = podsOf(w, B);
    ok(B.phase === 2 && B.vuln === 0 && pods.length === 3 && pods.every((m) => m.y > 5 && m.hp === S.podHp[1]), `${id}: phase 2: it seals and raises 3 tougher pods on the flak towers (${pods.length}, y ${pods.map((m) => m.y.toFixed(1))})`);
    killPods(w, B); tick(w, 120 * (S.unseal + 0.3));
    B.hp = B.maxHp * 0.28;
    tick(w, 120 * (S.seal + S.arm + 0.3));
    pods = podsOf(w, B);
    const x0 = pods.map((m) => m.x);
    tick(w, 120 * 2);
    ok(B.phase === 3 && pods.length === 2 && pods.every((m) => m.host && m.host.move) && pods.every((m, i) => Math.abs(m.x - x0[i]) > 0.5), `${id}: phase 3: 2 pods ride the circling sponsons (${pods.length})`);
  }
  // 8. when it dies, every pod and drone it raised goes with it
  {
    const w = createWorld(s), B = w.boss;
    tick(w, 120 * 4);
    bossKind(B).down(w, B);
    tick(w, 120 * 3);
    ok(B.dead && podsOf(w, B).length === 0 && w.exitOpen, `${id}: it dies, its pods blow up with it, the exit opens`);
  }
  // 9. an aimbot that shoots what the fight asks for (the pods, then the core), moving every 2.5 s to a
  //    spot round the deck (or up on a pedestal / tower / mast) it can see that from, like a player
  //    would: the fight runs 1.5–5 minutes and it costs real health
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const spots = [];
    for (let k = 0; k < 16; k++) for (const r of [16.5, 21]) spots.push([Math.cos(k / 16 * Math.PI * 2) * r, 0, Math.sin(k / 16 * Math.PI * 2) * r]);
    for (const p of w.plats) if (['fortress-pedestal', 'fortress-flaktower', 'fortress-antenna'].includes(p.style)) spots.push([p.x + 1.1, p.h, p.z - 1.1]);
    const sees = (x, y, z, tx, ty, tz) => !raycast(w.plats, x, y + T.EYE, z, tx - x, ty - y - T.EYE, tz - z, 0.97);
    let t = 0, dmg = 0, k = 0, next = 0;
    while (!B.dead && t < 400) {
      const pods = podsOf(w, B);
      let tg = B;
      if (B.vuln === 0) { let best = 1e9; for (const m of pods) { const d = (m.x - P.x) * (m.x - P.x) + (m.z - P.z) * (m.z - P.z); if (d < best) { best = d; tg = m; } } }
      const ty = tg === B ? B.cy : tg.y + 1.1;
      if (t >= next) { // hop to the next spot round the deck that sees the target
        for (let n = 0; n < spots.length; n++) { const q = spots[(k + n) % spots.length]; if (sees(q[0], q[1], q[2], tg.x, ty, tg.z)) { k = (k + n + 1) % spots.length; P.x = q[0]; P.y = q[1]; P.z = q[2]; P.vx = P.vz = 0; P.ground = null; break; } }
        next = t + 2.5;
      }
      P.yaw = Math.atan2(-(tg.x - P.x), -(tg.z - P.z)); P.pitch = Math.atan2(ty - (P.y + T.EYE), Math.sqrt((tg.x - P.x) * (tg.x - P.x) + (tg.z - P.z) * (tg.z - P.z))); P.auto = 0;
      step(w, { ...C0, fire: tg !== B || B.vuln > 0 });
      for (const e of w.events) if (e.type === 'hurt') dmg += e.dmg;
      w.events.length = 0; keep(w);
      t += T.DT;
    }
    console.log(`  aimbot fight: ${B.dead ? t.toFixed(0) + ' s' : 'unfinished'}, ${dmg} damage taken`);
    ok(B.dead && t > 90 && t < 300, `${id}: an aimbot takes 1.5–5 min to bring DREADNOUGHT down (${t.toFixed(0)} s)`);
    ok(dmg >= 8, `${id}: …and it costs it (${dmg} damage taken)`);
  }
}
