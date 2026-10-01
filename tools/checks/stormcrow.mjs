// sim-check for STORMCROW (the SEATTLE pack's boss, js/sim/bosses/stormcrow.js). The generic boss
// checks have already run (roar, hurts a still player, finite pose, random play, death → exit).
import { groundBelow } from '../../js/sim/plats.js';
import K, { tuning as S } from '../../js/sim/bosses/stormcrow.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const DT = T.DT, A = s.arena;
  const hyp = (x, z) => Math.sqrt(x * x + z * z);

  // 1. Three minutes against a player who stands still (healed every step), pushed into phases 2 and 3:
  //    it uses its whole move set, every telegraph is long enough, it stays in the box, and it only ever
  //    perches on solid deck, away from you.
  {
    const w = createWorld(s), B = w.boss, seen = new Set(), ev = new Set();
    let hurt = 0, prev = B.state, held = 0, shortTele = [], bad = '', zonesMax = 0, shortZone = 1e9, perchBad = '', diveTeles = 0, dives = 0, maxR = 0, low = '';
    for (let i = 0; i < 120 * 180; i++) {
      step(w, C0);
      for (const e of w.events) {
        ev.add(e.type + (e.kind ? ':' + e.kind : '') + (e.from ? ':' + e.from : ''));
        if (e.type === 'hurt') hurt++;
      }
      w.events.length = 0;
      for (const Z of w.zones) shortZone = Math.min(shortZone, Z.max);
      zonesMax = Math.max(zonesMax, w.zones.length);
      keep(w); w.player.inv = 0;
      seen.add(B.state);
      if (B.state !== prev) {
        // how long did each telegraph last before it acted?
        const need = { diveTele: Math.min(...S.diveTele, S.diveTele2) - 0.02, fanTele: Math.min(...S.fanTele) - 0.02, stormTele: S.stormTele - 0.02, gust: S.gustTele - 0.02 }[prev];
        if (need !== undefined && held * DT < need && !(prev === 'fanTele' && B.state === 'fanTele')) shortTele.push(`${prev} ${(held * DT).toFixed(2)} s`);
        if (prev === 'diveTele') diveTeles++;
        if (B.state === 'dive') { dives++; if (prev !== 'diveTele') bad = `dive straight from ${prev}`; }
        if (B.state === 'perch') {
          const g = groundBelow(w.plats, B.cx, B.cz, B.cy);
          if (!g || Math.abs(B.cy - S.bodyH - (g.h + g.oy)) > 0.05) perchBad = `perched over ${g ? g.style : 'nothing'} at (${B.cx.toFixed(1)}, ${B.cy.toFixed(1)}, ${B.cz.toFixed(1)})`;
        }
        prev = B.state; held = 0;
      }
      held++;
      maxR = Math.max(maxR, hyp(B.cx, B.cz));
      if (hyp(B.cx, B.cz) < 13 && B.cy - S.bodyH < A.floor - 0.3) low = `inside the saucer at y ${B.cy.toFixed(2)} (${B.state})`;
      if (i === 120 * 60) B.hp = B.maxHp * 0.5; // phase 2: double dives, gusts
      if (i === 120 * 120) B.hp = B.maxHp * 0.25; // phase 3
    }
    for (const k of ['orbit', 'diveTele', 'dive', 'land', 'perch', 'gust', 'takeoff', 'rejoin', 'fanTele', 'stormTele']) ok(seen.has(k), `${s.id}: STORMCROW reaches ${k}`);
    ok(ev.has('enemyFire:boss') && ev.has('zoneTele:bolt') && ev.has('zoneHit:bolt') && ev.has('zoneTele:gust') && ev.has('bossPhase') && ev.has('bossTele'), `${s.id}: feathers, lightning, gusts, screeches and phase changes all happen (${[...ev].filter((x) => /boss|zone/.test(x)).join(', ')})`);
    ok(!shortTele.length && !bad, `${s.id}: every dive, fan, strike and gust is telegraphed long enough${shortTele.length ? ': ' + shortTele.slice(0, 4).join(', ') : ''}${bad ? ' — ' + bad : ''}`);
    ok(shortZone >= 0.7 - 1e-9, `${s.id}: lightning and gust rings give ≥ 0.7 s to step out (shortest ${shortZone.toFixed(2)} s)`);
    ok(zonesMax <= 10, `${s.id}: never more danger rings at once than the renderer draws (${zonesMax} ≤ 10)`);
    ok(!perchBad, `${s.id}: it only perches on solid deck${perchBad ? ': ' + perchBad : ''}`);
    ok(!low, `${s.id}: it never flies through the saucer${low ? ': ' + low : ''}`);
    ok(maxR < 32, `${s.id}: it stays over the arena (widest ${maxR.toFixed(1)} m from the middle)`);
    ok(dives >= 8 && diveTeles >= dives, `${s.id}: it dives often (${dives} dives in 3 min), each after a screech`);
    ok(hurt >= 8, `${s.id}: a player who stands still really gets hurt (${hurt} hits in 3 min)`);
  }

  // 2. Dodge a dive: the moment it commits, step 3.5 m sideways off its line. It must miss (and the
  //    line it dives along is the one its sight showed). Lightning is cleared so only the dive can hit.
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    let dives = 0, hits = 0, onLine = 0;
    for (let i = 0; i < 120 * 150 && dives < 10; i++) {
      const was = B.state;
      step(w, C0);
      w.zones.length = 0; w.bolts.length = 0; keep(w); P.inv = 0;
      if (was === 'diveTele' && B.state === 'dive') {
        dives++;
        const D = B.dive, hx = D.tx - D.sx, hz = D.tz - D.sz, l = hyp(hx, hz) || 1;
        if (Math.abs((P.x - D.sx) * hz / l - (P.z - D.sz) * hx / l) < 0.6) onLine++; // you were on the line it locked
        // run sideways off the line (toward the middle of the saucer when that's possible)
        let nx = -hz / l, nz = hx / l;
        if (nx * -P.x + nz * -P.z < 0) { nx = -nx; nz = -nz; }
        P.x += nx * 3.5; P.z += nz * 3.5;
        const g = groundBelow(w.plats, P.x, P.z, P.y + 0.5); if (g) P.y = g.h + g.oy;
      }
      if (B.state === 'dive') for (const e of w.events) if (e.type === 'hurt') hits++;
      w.events.length = 0;
      if (B.state !== 'dive' && B.state !== 'diveTele' && i % 240 === 0) { P.x = 0; P.z = 6; P.y = A.floor; } // back to the middle between attacks
    }
    ok(dives >= 5 && hits === 0, `${s.id}: a 3.5 m side-step after the lock dodges every dive (${dives} dives, ${hits} hits)`);
    ok(onLine === dives, `${s.id}: each dive follows the line its sight showed (${onLine}/${dives})`);
  }

  // 3. Its back is only stompable when it perches; a stomp then bounces you, hurts ×1.5 and locks on.
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    for (let i = 0; i < 120 * 3; i++) { step(w, C0); keep(w); }
    // in the air: you pass through, no bounce
    B.state = 'orbit'; B.timer = 9;
    P.x = B.cx; P.z = B.cz; P.y = B.cy + S.top / 2 + 0.2; P.vy = -4; P.ground = null;
    const hp0 = B.hp; step(w, C0);
    ok(B.hp === hp0 && P.vy < 0, `${s.id}: you can't stomp it in flight (hp ${hp0} → ${B.hp})`);
    // perched: a stomp
    B.state = 'perch'; B.timer = 5; B.cx = 6; B.cz = 0; B.cy = A.floor + S.bodyH; B.vx = B.vy = B.vz = 0;
    step(w, C0);
    P.x = B.cx; P.z = B.cz + 0.3; P.y = B.cy + S.top / 2 + 0.3; P.vy = -4; P.ground = null; P.inv = 0;
    const hp1 = B.hp; step(w, C0);
    ok(P.vy > 10 && hp1 - B.hp >= 4 * S.perchVuln - 1e-9 && P.lock === B, `${s.id}: stomping its back while it perches bounces you and hurts it ×1.5 (hp ${hp1} → ${B.hp})`);
    const shots0 = w.stats.shots;
    for (let i = 0; i < 40; i++) step(w, C0);
    ok(w.stats.shots > shots0, `${s.id}: …and the gun swings down onto it and fires (${w.stats.shots - shots0} shots)`);
  }

  // 4. Shooting it: shots hurt it in flight and ×1.5 while it perches.
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    for (let i = 0; i < 120 * 2.5; i++) { step(w, C0); keep(w); }
    const aim = () => { const dx = B.cx - P.x, dz = B.cz - P.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(B.cy - (P.y + T.EYE), hyp(dx, dz)); P.auto = 0; };
    B.state = 'perch'; B.timer = 99; B.cx = 0; B.cz = -6; B.cy = A.floor + S.bodyH; B.vx = B.vy = B.vz = 0;
    P.x = 0; P.z = 8; P.y = A.floor; P.vx = P.vy = P.vz = 0;
    const hp0 = B.hp;
    for (let i = 0; i < 120 * 2; i++) { aim(); B.timer = 99; step(w, { ...C0, fire: true }); keep(w); P.inv = 1; }
    const dmg = hp0 - B.hp;
    ok(dmg > 12, `${s.id}: two seconds of blaster into a perched STORMCROW does real damage (${dmg.toFixed(1)})`);
  }

  // 5. Phases call in the seagull drones, and killing it mid-dive drops it out of the sky.
  {
    const w = createWorld(s), B = w.boss;
    const n0 = w.enemies.length;
    for (let i = 0; i < 120 * 3; i++) { step(w, C0); keep(w); }
    B.hp = B.maxHp * 0.55; for (let i = 0; i < 10; i++) { step(w, C0); keep(w); }
    const n2 = w.enemies.length;
    B.hp = B.maxHp * 0.25; for (let i = 0; i < 10; i++) { step(w, C0); keep(w); }
    const drones = w.enemies.filter((e) => e.type === 'drone' && !e.dead).length;
    ok(n2 - n0 === S.minions[1] && drones <= S.maxDrones, `${s.id}: phase 2 calls in a drone, and never more than ${S.maxDrones} are up (${n0} → ${n2} → ${w.enemies.length}, ${drones} drones)`);
    for (let i = 0; i < 120 * 30 && B.state !== 'dive'; i++) { step(w, C0); keep(w); w.zones.length = 0; }
    const wasDiving = B.state === 'dive', y0 = B.cy;
    K.down(w, B);
    let n = 0, lowest = y0;
    while (!B.dead && n++ < 120 * 5) { step(w, C0); keep(w); w.player.inv = 1; lowest = Math.min(lowest, B.cy); }
    ok(wasDiving && B.dead && w.exitOpen && lowest < y0 - 0.5, `${s.id}: shot down mid-dive it falls (${y0.toFixed(1)} → ${lowest.toFixed(1)} m), dies, and the exit opens`);
  }
}
