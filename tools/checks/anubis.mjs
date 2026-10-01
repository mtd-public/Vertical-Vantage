// sim-check for boss 'anubis' (EGYPT, the Hall of Judgment). The generic boss checks run first
// (tools/sim-check.mjs); these prove MECHA ANUBIS's move set, that every telegraph lasts ≥ 0.5 s,
// that each big attack ends in a punish window, and that every tell can be dodged the way it says:
// hop the low sweep, stay down for the backswing, hop the shockwaves, hide from the beam behind a
// column, step out of the sand swirl. Then the head stomp, the phase-3 ankh ward, the scarabs.
import anubis, { tuning as AT } from '../../js/sim/bosses/anubis.js';
import { pushOut } from '../../js/sim/plats.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id;
  const awake = (phase = 1) => {
    const w = createWorld(s);
    for (let i = 0; i < 120 * 3; i++) { step(w, C0); keep(w); }
    const B = w.boss;
    if (phase > 1) { B.hp = B.maxHp * (phase === 2 ? 0.5 : 0.2); for (let i = 0; i < 120 * 2; i++) { step(w, C0); keep(w); } }
    w.events.length = 0; w.zones.length = 0;
    return w;
  };
  const place = (P, x, y, z) => { P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; P.ground = null; };
  // (the attack menu is the module's own: each test steers it by where it puts the player and by
  //  sending any other attack straight back to stalking)

  // 1. three minutes against a player who keeps moving between spots: the whole move set, telegraphs
  //    ≥ 0.5 s, every big attack followed by its punish window, it really hurts, it summons scarabs
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const spots = [[0, 0, 12], [-20, 0, 2], [17, 3.6, 13], [-27, 10.5, -5], [12, 0, -4], [0, 4.5, -27], [24, 0, 20], [-8, 0, -8], [27, 9.5, -17], [-14, 0, 18]];
    const seen = new Set(), teles = {}, after = {}, zoneMin = { v: 99 }, open = {};
    let last = B.state, enter = 0, hurt = 0, bolts = 0, steps = 0, waves = 0;
    const n0 = w.enemies.length;
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 6) === 0) { const [x, y, z] = spots[(i / (120 * 6)) % spots.length]; place(P, x, y, z); }
      if (i === 120 * 50) B.hp = B.maxHp * 0.55;
      if (i === 120 * 110) B.hp = B.maxHp * 0.25;
      const nz = w.zones.length;
      step(w, C0);
      for (const Z of w.zones.slice(Math.min(nz, w.zones.length))) zoneMin.v = Math.min(zoneMin.v, Z.max);
      for (const e of w.events) { if (e.type === 'hurt') hurt++; if (e.type === 'enemyFire' && e.from === 'boss') bolts++; if (e.type === 'zoneHit' && e.kind === 'wave') waves++; }
      w.events.length = 0; keep(w); w.player.inv = 0;
      if (B.hp < 30) B.hp = 30;
      steps++;
      if (B.state !== last) {
        if (/Tele$|Charge$/.test(last) || last === 'under') (teles[last] ||= []).push(i - enter);
        (after[last] ||= new Set()).add(B.state);
        last = B.state; enter = i; seen.add(B.state);
      }
      if (['recover', 'stuck', 'vent', 'shake', 'reel'].includes(B.state)) (open[B.state] ||= []).push(B.vuln);
    }
    for (const k of ['stalk', 'roar', 'sweepTele', 'sweep', 'backTele', 'backswing', 'recover', 'slamTele', 'stuck', 'beamCharge', 'beam', 'vent', 'boltTele', 'bolts', 'summonTele', 'summon', 'sinkTele', 'sinking', 'under', 'rise', 'shake']) ok(seen.has(k), `${id}: MECHA ANUBIS reaches ${k}`);
    const shortest = Math.min(...Object.values(teles).flat()) / 120;
    ok(shortest >= 0.5 - 1e-6, `${id}: every telegraph lasts ≥ 0.5 s (shortest ${shortest.toFixed(2)} s; ${Object.entries(teles).map(([k, v]) => `${k} ×${v.length}`).join(', ')})`);
    ok(zoneMin.v >= 0.5 - 1e-6, `${id}: every danger ring shows ≥ 0.5 s before it lands (shortest ${zoneMin.v.toFixed(2)} s)`);
    const windows = { sweep: ['recover', 'backTele'], backswing: ['recover'], slamTele: ['stuck'], beam: ['vent'], rise: ['shake'] };
    for (const [k, want] of Object.entries(windows)) if (after[k]) ok([...after[k]].every((x) => want.includes(x) || x === 'reel' || x === 'roar'), `${id}: after ${k} comes ${want.join(' / ')} (${[...after[k]].join(', ')})`);
    for (const k of ['recover', 'stuck', 'vent', 'shake']) ok(open[k] && open[k].every((v) => v === AT.vulnOpen), `${id}: ${k} is a punish window (vuln ×${AT.vulnOpen})`);
    ok(hurt >= 8, `${id}: it really hurts a player who doesn't dodge (${hurt} hits in 3 min)`);
    ok(bolts >= 3, `${id}: it fires ankh bolts at a player up on a perch (${bolts})`);
    ok(waves >= 4, `${id}: its slams send shockwaves across the floor (${waves})`);
    ok(w.enemies.length - n0 >= 4, `${id}: scarabs crawl out of the jars and drones join (${w.enemies.length - n0} minions)`);
  }

  // 2. the low sweep: standing in it hurts; a hop at the right moment clears it. Phase 2's backswing:
  //    hop the low ring, land and stay down → clear; still in the air (a double jump) → hit.
  //    (Only the sweep's own rings count: each lands as a 'zoneHit' of its kind.)
  {
    const run = (phase, plan) => {
      const w = awake(phase), B = w.boss, P = w.player;
      for (const m of w.enemies) if (m !== B) m.dead = true; // (no drones in the way)
      const near = () => place(P, B.cx + B.fx * 4.5, 0, B.cz + B.fz * 4.5);
      near();
      let hurt = 0, swept = false, done = false;
      for (let i = 0; i < 120 * 40 && !done; i++) {
        if (B.state === 'stalk' && !swept) near();
        if (['slamTele', 'beamCharge', 'boltTele', 'summonTele', 'sinkTele'].includes(B.state) && !swept) { B.state = 'stalk'; B.timer = 0.01; w.zones.length = 0; }
        const low = w.zones.find((z) => z.kind === 'sweep');
        let jump = false;
        if (plan !== 'stand' && low && low.t < 0.42 && low.t > 0.3 && P.ground) jump = true;
        if (plan === 'double' && !P.ground && P.jumps === 1 && P.vy < 2 && swept) jump = true;
        step(w, { ...C0, jump });
        let ring = false;
        for (const e of w.events) if (e.type === 'zoneHit' && (e.kind === 'sweep' || e.kind === 'high')) { ring = true; swept = true; }
        if (ring) for (const e of w.events) if (e.type === 'hurt') hurt++;
        if (swept && (B.state === 'recover' || B.state === 'reel')) done = true;
        w.events.length = 0; keep(w); P.inv = 0;
      }
      return { swept, hurt };
    };
    const stand = run(1, 'stand'), hop = run(1, 'hop');
    ok(stand.swept && stand.hurt > 0, `${id}: standing in the staff sweep gets you hit`);
    ok(hop.swept && hop.hurt === 0, `${id}: a hop at the right moment clears the sweep (${hop.hurt} hits)`);
    const hop2 = run(2, 'hop'), dbl = run(2, 'double');
    ok(hop2.swept && hop2.hurt === 0, `${id}: phase 2: hop the sweep, land, stay down: the backswing passes over you (${hop2.hurt} hits)`);
    ok(dbl.swept && dbl.hurt > 0, `${id}: phase 2: still in the air when the backswing comes round, it hits you (${dbl.hurt})`);
  }

  // 3. the shockwaves: on the floor in their path every ring hits you; a hop as each one reaches you
  //    clears it; up on a canopic jar they pass under you. (Only the rings' hits count.)
  {
    const run = (plan) => {
      const w = awake(3), B = w.boss, P = w.player;
      for (const m of w.enemies) if (m !== B) m.dead = true;
      B.ward = 0;
      let hurt = 0, slammed = false, crushed = 0, far = 0, launched = 0;
      for (let i = 0; i < 120 * 40; i++) {
        if (!slammed) {
          if (['sweepTele', 'beamCharge', 'boltTele', 'summonTele', 'sinkTele'].includes(B.state)) { B.state = 'stalk'; B.timer = 0.01; w.zones.length = 0; }
          if (B.state === 'stalk') { B.timer = Math.min(B.timer, 0.5); B.sinkCD = 9; B.summonCD = 9; place(P, B.cx + B.fx * 16, 0, B.cz + B.fz * 16); }
          if (B.state === 'slamTele') { slammed = true; if (plan === 'jar') { const J = B.jars[0]; place(P, J.x, 3.6, J.z); } }
        } else if (B.state !== 'stuck' && B.state !== 'slamTele') { B.state = 'stuck'; B.timer = 9; } // (hold it still: only the rings)
        let jump = false;
        if (plan === 'hop' && slammed && P.ground) for (const q of B.waves) { const d = Math.sqrt((P.x - q.x) * (P.x - q.x) + (P.z - q.z) * (P.z - q.z)); if (d - q.r > 0 && d - q.r < 3.4) jump = true; }
        step(w, { ...C0, jump });
        for (const e of w.events) {
          if (e.type === 'zoneHit' && e.kind === 'wave') launched++;
          if (e.type === 'hurt' && slammed && Math.abs(e.x - B.wx) < 0.01 && Math.abs(e.z - B.wz) < 0.01) { if (Math.sqrt((P.x - B.wx) * (P.x - B.wx) + (P.z - B.wz) * (P.z - B.wz)) < AT.slam.crushR + 1) crushed++; else hurt++; }
        }
        w.events.length = 0; keep(w); P.inv = 0;
        if (launched >= AT.slam.waves[2]) { const d = Math.sqrt((P.x - B.wx) * (P.x - B.wx) + (P.z - B.wz) * (P.z - B.wz)); if (B.waves.every((q) => q.r > d + 3)) { far++; if (far > 10) break; } }
      }
      return { slammed, hurt, crushed };
    };
    const stand = run('stand'), hop = run('hop'), jar = run('jar');
    const n = AT.slam.waves[2];
    ok(stand.slammed && stand.hurt === n, `${id}: standing in the shockwaves' path, every ring hits you (${stand.hurt} of ${n})`);
    ok(hop.slammed && hop.hurt === 0, `${id}: hopping each ring as it reaches you clears them all (${hop.hurt} hits)`);
    ok(jar.slammed && jar.hurt === 0, `${id}: up on a canopic jar the rings pass under you (${jar.hurt} hits)`);
  }

  // 4. the eye beam: in the open it burns you; behind a column it can't reach you. It turns slower
  //    than you can run across its line.
  {
    const run = (hide) => {
      const w = awake(), B = w.boss, P = w.player;
      const col = w.plats.find((p) => p.style === 'eg-column' && p.x < 0 && p.z > 0 && p.z < 10); // the west column at z 7
      let hurt = 0, fired = false, sightMin = 99, chargeT = -1, t = 0, beamT = 0;
      B.cx = 0; B.cz = 6; B.fx = -1; B.fz = 0;
      for (let i = 0; i < 120 * 40; i++) {
        t += T.DT;
        if (!fired) {
          if (['sweepTele', 'slamTele', 'boltTele', 'summonTele', 'sinkTele'].includes(B.state)) { B.state = 'stalk'; B.timer = 0.01; w.zones.length = 0; }
          if (B.state === 'stalk') { B.timer = Math.min(B.timer, 0.5); B.sinkCD = 9; B.summonCD = 9; B.cx = 0; B.cz = 6; }
          if (hide) place(P, col.x - 2.6, 0, col.z); else place(P, -20, 0, 14);
        } else if (hide) place(P, col.x - 2.6, 0, col.z);
        else place(P, -20, 0, 14);
        step(w, C0);
        for (const e of w.events) { if (e.type === 'bossCharge') chargeT = t; if (e.type === 'hurt' && fired) hurt++; }
        if (B.state === 'beam') { if (!fired) { fired = true; sightMin = Math.min(sightMin, t - chargeT); } beamT += T.DT; }
        w.events.length = 0; keep(w); P.inv = 0;
        if (fired && B.state !== 'beam') break;
      }
      return { fired, hurt, sightMin, beamT };
    };
    const open = run(false), cover = run(true);
    ok(open.fired && open.hurt > 0, `${id}: in the open, the eye beam burns you (${open.hurt} hits in ${open.beamT.toFixed(1)} s)`);
    ok(cover.fired && cover.hurt === 0, `${id}: behind a column the beam can't reach you (${cover.hurt} hits)`);
    ok(open.sightMin >= 0.85 - 1e-6, `${id}: the beam's sight line shows ≥ 0.85 s first (${open.sightMin.toFixed(2)} s)`);
    const across = AT.beam.rate[2] * 14;
    ok(across < T.RUN, `${id}: at 14 m its beam sweeps ${across.toFixed(1)} m/s at most: you outrun it (${T.RUN})`);
  }

  // 5. the sand sink: invulnerable under the floor; the swirl opens where you stood and gives you ≥ 1 s;
  //    stay and it bursts up into you, step out and it misses. Then it shakes (the punish window).
  {
    const run = (dodge) => {
      const w = awake(), B = w.boss, P = w.player;
      let hurt = 0, swirl = null, vuln0 = true, shake = false, swirlT = 0;
      place(P, -14, 0, 16);
      for (let i = 0; i < 120 * 40; i++) {
        if (!swirl) {
          if (['sweepTele', 'slamTele', 'boltTele', 'summonTele', 'beamCharge'].includes(B.state)) { B.state = 'stalk'; B.timer = 0.01; w.zones.length = 0; B.beam.sight = false; }
          if (B.state === 'stalk') { B.timer = Math.min(B.timer, 0.5); B.sinkCD = 0; B.summonCD = 9; place(P, -14, 0, 16); }
        }
        step(w, C0);
        if ((B.state === 'sinking' || B.state === 'under') && B.vuln !== 0) vuln0 = false;
        if (B.state === 'under' && !swirl) { swirl = { x: B.riseX, z: B.riseZ }; swirlT = B.timer; if (dodge) place(P, P.x + 6, 0, P.z); }
        if (swirl && B.state === 'shake') shake = true;
        for (const e of w.events) if (e.type === 'hurt' && swirl) hurt++;
        w.events.length = 0; keep(w); if (!swirl) P.inv = 0;
        if (shake) break;
      }
      return { swirl, hurt, vuln0, shake, swirlT };
    };
    const stay = run(false), step6 = run(true);
    ok(stay.swirl && Math.abs(stay.swirl.x + 14) < 1.5 && Math.abs(stay.swirl.z - 16) < 1.5, `${id}: the sand swirl opens where you stand (${stay.swirl && stay.swirl.x.toFixed(1)}, ${stay.swirl && stay.swirl.z.toFixed(1)})`);
    ok(stay.swirlT >= 1.0, `${id}: the swirl gives you ${stay.swirlT.toFixed(2)} s (≥ 1 s) to get out`);
    ok(stay.hurt > 0 && step6.hurt === 0, `${id}: stay in the swirl and it bursts up into you (${stay.hurt}); step 6 m out and it misses (${step6.hurt})`);
    ok(stay.vuln0 && stay.shake, `${id}: under the sand it can't be hurt; it comes up shaking off the sand (a punish window)`);
  }

  // 6. the head stomp: a bounce, the lock-on, the plain stomp + the head bonus; it reels, then sinks away
  {
    const w = awake(), B = w.boss, P = w.player;
    B.state = 'stalk'; B.timer = 99;
    const hp0 = B.hp;
    place(P, B.cx + 0.4, B.y + B.top + 0.3, B.cz); P.vy = -4;
    step(w, C0); step(w, C0);
    ok(P.vy > 8 && P.lock === B && hp0 - B.hp >= 4 + AT.headBonus - 0.01 && B.state === 'reel', `${id}: a head stomp bounces you, locks on, does ${hp0 - B.hp} and it reels (${B.state})`);
    let sank = false;
    for (let i = 0; i < 120 * 4 && !sank; i++) { step(w, C0); keep(w); if (B.state === 'sinking') sank = true; }
    ok(sank, `${id}: after the reel it sinks into the sand to get away`);
    ok(!anubis.stompable({ state: 'under' }) && !anubis.stompable({ state: 'sinking' }) && anubis.stompable({ state: 'stalk' }) && anubis.stompable({ state: 'stuck' }), `${id}: no bouncing on it while it's under the sand`);
  }

  // 7. phase 3's ankh ward: front fire glances off, shots into its back land; a head stomp shatters it,
  //    and it comes back later
  {
    const w = awake(3), B = w.boss, P = w.player;
    ok(B.phase === 3 && B.ward === 1, `${id}: in phase 3 it raises the ankh ward (phase ${B.phase}, ward ${B.ward})`);
    const shot = (vx, vz) => ({ x: 0, y: 4, z: 0, vx, vy: 0, vz });
    const F = { ward: 1, fx: 0, fz: 1 };
    ok(anubis.blocks(w, F, shot(0, -75)) && anubis.blocks(w, F, shot(70, -20)) && !anubis.blocks(w, F, shot(0, 75)) && !anubis.blocks(w, F, shot(20, 70)), `${id}: the ward stops shots at its face and sides, not at its back`);
    const fire = (behind) => {
      const W = awake(3), Bb = W.boss, Pp = W.player;
      Bb.state = 'recover'; Bb.timer = 99; Bb.dur = 99;
      const k = behind ? -1 : 1;
      Pp.x = Bb.cx + Bb.fx * 12 * k; Pp.z = Bb.cz + Bb.fz * 12 * k; Pp.y = 0;
      const hp = Bb.hp; let glance = 0;
      for (let i = 0; i < 90; i++) {
        Pp.yaw = Math.atan2(-(Bb.cx - Pp.x), -(Bb.cz - Pp.z)); Pp.pitch = Math.atan2(4.5 - (Pp.y + T.EYE), 12); Pp.auto = 0; Pp.lock = null;
        step(W, { ...C0, fire: true }); Bb.timer = 99; Bb.state = 'recover';
        glance += W.events.filter((e) => e.type === 'impact' && e.kind === 'shield').length; W.events.length = 0; keep(W);
      }
      return { dmg: hp - Bb.hp, glance };
    };
    const front = fire(false), back = fire(true);
    ok(front.dmg === 0 && front.glance > 3, `${id}: a second of fire into its warded face: ${front.glance} glances, no damage`);
    ok(back.dmg > 3, `${id}: the same into its back hurts it (${back.dmg.toFixed(1)})`);
    B.state = 'stalk'; B.timer = 99;
    place(P, B.cx + 0.4, B.y + B.top + 0.3, B.cz); P.vy = -4;
    step(w, C0); step(w, C0);
    ok(B.ward === 0 && B.state === 'reel', `${id}: a stomp on its head shatters the ward (ward ${B.ward}, ${B.state})`);
    let back2 = false;
    for (let i = 0; i < 120 * 30 && !back2; i++) { step(w, C0); keep(w); P.inv = 1; if (B.ward === 1) back2 = true; if (B.hp < 30) B.hp = 30; }
    ok(back2, `${id}: the ward comes back once the stomp wears off (${AT.ward.back} s)`);
  }

  // 8. the scarabs: the jars glow first, the minions crawl out by them, never more than the cap; when
  //    it dies they go with it
  {
    const w = awake(2), B = w.boss, P = w.player;
    let glowed = false, spawned = [];
    place(P, 0, 0, 14);
    for (let i = 0; i < 120 * 60; i++) {
      if (['sweepTele', 'slamTele', 'boltTele', 'beamCharge', 'sinkTele'].includes(B.state)) { B.state = 'stalk'; B.timer = 0.01; w.zones.length = 0; B.beam.sight = false; }
      if (B.state === 'stalk') { B.timer = Math.min(B.timer, 0.5); B.sinkCD = 9; B.summonCD = Math.min(B.summonCD, 0.5); }
      if (B.state === 'summonTele' && B.glow.some((g) => g > 0.5)) glowed = true;
      step(w, C0); w.events.length = 0; keep(w); P.inv = 1;
      spawned = w.enemies.filter((m) => B.minions.includes(m.id) && (m.type === 'walker' || m.type === 'spiker'));
      if (B.hp < 30) B.hp = 30;
    }
    const cap = AT.summon.cap[1];
    const aliveN = spawned.filter((m) => !m.dead).length;
    ok(glowed && spawned.length >= 2, `${id}: the jars glow, then scarabs crawl out (${spawned.length}: ${[...new Set(spawned.map((m) => m.type))].join(', ')})`);
    ok(aliveN <= cap, `${id}: never more than ${cap} alive at once in phase 2 (${aliveN})`);
    const nearJar = spawned.every((m) => B.jars.some((j) => Math.sqrt((m.ax - j.x) * (m.ax - j.x) + (m.az - j.z) * (m.az - j.z)) < 4));
    ok(nearJar, `${id}: …each by a jar`);
    anubis.down(w, B);
    ok(spawned.every((m) => m.dead), `${id}: when it falls, its scarabs blow up with it`);
  }

  // 9. it never walks into the columns, the jars, the dais or the scales (3 min, every phase)
  {
    const w = createWorld(s), B = w.boss, A = s.arena;
    const spots = [[-27, 10.5, -5], [27, 9.5, -17], [17, 3.6, 13], [-17, 3.6, -9], [0, 4.5, -27], [0, 0, 0], [-30, 0, 22], [30, 0, -24], [-9, 5, -17], [12, 0, 10]];
    let worst = 0, where = '';
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 5) === 0) { const [x, y, z] = spots[(i / (120 * 5)) % spots.length]; place(w.player, x, y, z); }
      if (i === 120 * 60) B.hp = B.maxHp * 0.5;
      if (i === 120 * 120) B.hp = B.maxHp * 0.25;
      step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1;
      if (B.hp < 30) B.hp = 30;
      if (B.sink > 0.3) continue; // (under the floor it goes where it likes)
      for (const p of w.plats) {
        const top = p.h + p.oy, bot = top - p.thick, x = p.x + p.ox, z = p.z + p.oz;
        if (top <= A.floor + 0.3 || bot > A.floor + AT.top || x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) continue;
        const r = pushOut(p, B.cx, B.cz, AT.bodyR);
        if (r && r[2] > worst) { worst = r[2]; where = `${B.state} at (${B.cx.toFixed(1)}, ${B.cz.toFixed(1)}) in a ${p.style} at (${x.toFixed(1)}, ${z.toFixed(1)})`; }
      }
    }
    ok(worst < 0.3, `${id}: MECHA ANUBIS stays out of the columns, jars, dais and scales (worst overlap ${worst.toFixed(2)} m${where ? ': ' + where : ''})`);
  }

  // 10. the scales see-saw: one pan is always within a hop of the floor, the other up at head height
  {
    const w = createWorld(s), B = w.boss;
    let lo = 99, hi = -99, both = 0;
    for (let i = 0; i < 120 * 14; i++) {
      step(w, C0); keep(w);
      const a = w.plats[B.pans[0]], b = w.plats[B.pans[1]], ta = a.h + a.oy, tb = b.h + b.oy;
      lo = Math.min(lo, ta, tb); hi = Math.max(hi, ta, tb);
      if (Math.min(ta, tb) > 5.05) both++; // (a double jump from the floor rises 7.2 m)
      w.events.length = 0;
    }
    ok(lo <= 2.2 && hi >= 7.8 && both === 0, `${id}: the scale pans see-saw ${lo.toFixed(1)}–${hi.toFixed(1)} m, one always within a double jump of the floor`);
  }
}
