// sim-check for POLARIS (ARCTIC VAULT, COLD STORAGE). The generic boss checks run first
// (tools/sim-check.mjs); these prove its move set, the telegraph lengths, the punish windows after every
// big attack, that each tell can be dodged the way it says (step back from the claws, a column against
// the breath, a jump over the slide, a gap between the spike rings, off the block's ring, out of the
// pounce), the stomps (bounce, bonus, reel, shake-off), the blizzard, a body that never ends up inside
// a column, and an aimbot fight that lasts as long as a boss fight should.
import { tuning as PT } from '../../js/sim/bosses/polaris.js';
import { bossKind } from '../../js/sim/bosses/index.js';
import { pushOut, raycast } from '../../js/sim/plats.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id, A = s.arena, dt = T.DT;
  const awake = () => { const w = createWorld(s); for (let i = 0; i < 120 * 3; i++) { step(w, C0); keep(w); } w.events.length = 0; return w; };
  const alone = (w) => { for (const m of w.enemies) if (m !== w.boss) m.dead = true; }; // (no drones or spikers: only the bear's hits count)
  const hurts = (w) => w.events.filter((e) => e.type === 'hurt').length;
  // Hold it in one attack: whenever it's about to choose, make it choose `kind` (by rerolling the state).
  const only = (w, B, kind) => { if (B.state === 'prowl' && B.timer < dt * 1.5) { B.last = ''; forceAttack(w, B, kind); } };
  const K = bossKind({ kind: 'polaris' });
  // the module's attack() isn't exported: drive it through decide() by placing the player where only that attack is offered
  function forceAttack(w, B, kind) {
    const P = w.player;
    const put = (d, high = false) => { // the player d m in front of it, on the floor (or "high")
      P.x = B.cx + B.fx * d; P.z = B.cz + B.fz * d; P.y = high ? A.floor + 4 : A.floor; P.vx = P.vy = P.vz = 0;
    };
    for (let tries = 0; tries < 60; tries++) {
      if (kind === 'swipe') put(6); else if (kind === 'breath' || kind === 'hurl') put(12, true); else if (kind === 'slide' || kind === 'pound') put(14);
      B.state = 'prowl'; B.timer = 0; B.last = '';
      const snap = { zones: w.zones.length, rings: B.rings.length };
      step(w, C0); keep(w);
      if ((kind === 'swipe' && B.state === 'rearTele') || (kind === 'breath' && B.state === 'breathTele') || (kind === 'hurl' && B.state === 'hurlTele') || (kind === 'slide' && B.state === 'slideTele') || (kind === 'pound' && B.state === 'poundTele')) return true;
      // wrong pick: undo it and try again (the rng moves on)
      w.zones.length = snap.zones; B.rings.length = snap.rings;
    }
    return false;
  }

  // 1. three minutes against a player who keeps moving between spots (floor, stumps, ledges): it uses its
  //    whole move set; every telegraph lasts ≥ 0.5 s; every big attack ends in a punish window; it hurts
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const spots = [[-20, 0, 0], [12, 0, 14], [0, 0, -12], [-24, 4.5, 5], [24, 0, -6], [-33.5, 6, 10], [8, 0, 4], [-12, 0, -8], [22, 6.5, -15], [18, 12, -26]];
    const seen = new Set(), teles = {}, after = {}, zoneMin = { v: 99 }, ringMin = { v: 99 };
    let last = B.state, enter = 0, hurt = 0, open = 0, steps = 0, spawned = 0, maxZones = 0;
    const n0 = w.enemies.length, seenZ = new Set(), seenR = new Set();
    for (let i = 0; i < 120 * 200; i++) {
      if (i % (120 * 6) === 0) { const [x, y, z] = spots[(i / (120 * 6)) % spots.length]; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      if (i === 120 * 50) B.hp = B.maxHp * 0.55;
      if (i === 120 * 110) B.hp = B.maxHp * 0.25;
      step(w, C0);
      hurt += hurts(w);
      w.events.length = 0; keep(w);
      if (B.hp < 30) B.hp = 30;
      steps++;
      if (B.vuln > 1) open++;
      maxZones = Math.max(maxZones, w.zones.length);
      for (const Z of w.zones) if (!seenZ.has(Z)) { seenZ.add(Z); zoneMin.v = Math.min(zoneMin.v, Z.max); }
      for (const R of B.rings) if (!seenR.has(R)) { seenR.add(R); ringMin.v = Math.min(ringMin.v, R.max); }
      if (B.state !== last) {
        if (last.endsWith('Tele')) (teles[last] ||= []).push(i - enter);
        if (['swipe2', 'breath', 'slide', 'pound', 'lunge'].includes(last)) (after[last] ||= new Set()).add(B.state);
        last = B.state; enter = i; seen.add(B.state);
      }
    }
    spawned = w.enemies.length - n0;
    for (const k of ['prowl', 'rearTele', 'swipe1', 'swipe2', 'winded', 'breathTele', 'breath', 'vent', 'slideTele', 'slide', 'poundTele', 'pound', 'recover', 'hurlTele', 'hurl', 'blizzardTele', 'stalk', 'lungeTele', 'lunge', 'maul']) ok(seen.has(k), `${id}: POLARIS reaches ${k}`);
    ok(seen.has('beached') || seen.has('crash'), `${id}: a slide ends beached or crashed (${['beached', 'crash'].filter((k) => seen.has(k)).join(', ')})`);
    const shortest = Math.min(...Object.values(teles).flat()) / 120;
    ok(shortest >= 0.5 - 1e-6, `${id}: every telegraph state lasts ≥ 0.5 s (shortest ${shortest.toFixed(2)} s; ${Object.entries(teles).map(([k, v]) => `${k} ×${v.length}`).join(', ')})`);
    ok(zoneMin.v >= 0.5 - 1e-6 && ringMin.v >= 0.5, `${id}: every danger ring shows ≥ 0.5 s before it lands (rings ${zoneMin.v.toFixed(2)} s, spike rings ${ringMin.v.toFixed(2)} s)`);
    ok(maxZones <= 10, `${id}: never more danger rings than the renderer draws (${maxZones} ≤ 10)`);
    const windows = { swipe2: ['winded'], breath: ['vent'], pound: ['recover'], slide: ['beached', 'crash', 'slide'] };
    for (const [k, want] of Object.entries(windows)) if (after[k]) ok([...after[k]].every((x) => want.includes(x) || x === 'reel'), `${id}: after ${k} comes a punish window (${[...after[k]].join(', ')})`);
    if (after.lunge) ok([...after.lunge].every((x) => x === 'maul'), `${id}: every pounce ends in a maul you can stomp (${[...after.lunge].join(', ')})`);
    ok(hurt >= 8, `${id}: it really hurts a player who doesn't dodge (${hurt} hits in 200 s)`);
    ok(spawned >= 4, `${id}: drones join at the phase changes (${spawned})`);
    const share = open / steps;
    ok(share > 0.12 && share < 0.55, `${id}: it's open to punishment ${(share * 100).toFixed(0)} % of the time (windows, not a turtle)`);
    console.log(`  polaris: ${Object.entries(teles).map(([k, v]) => `${k} ${(Math.min(...v) / 120).toFixed(2)}`).join(', ')}; ${hurt} hits; open ${(share * 100).toFixed(0)} %`);
  }

  // 2. the claws: standing in front gets you hit; backing off 9 m as it rears up clears both swipes
  {
    const run = (dodge) => {
      const w = awake(), B = w.boss, P = w.player;
      ok(forceAttack(w, B, 'swipe'), `${id}: (test) it rears up to swipe`);
      if (dodge) { P.x = B.cx + B.fx * 9.5; P.z = B.cz + B.fz * 9.5; }
      let hurt = 0;
      for (let i = 0; i < 120 * 2.2; i++) { alone(w); step(w, C0); hurt += hurts(w); w.events.length = 0; keep(w); if (B.state === 'prowl') B.timer = 9; }
      return { hurt, state: B.state };
    };
    const stand = run(false), back = run(true);
    ok(stand.hurt > 0, `${id}: standing at its claws gets you hit (${stand.hurt})`);
    ok(back.hurt === 0 && back.state === 'winded', `${id}: backing off 9.5 m clears both swipes, and it's left winded (${back.hurt} hits, ${back.state})`);
  }

  // 3. the frost breath: in the open it hits; behind a column it can't
  {
    const run = (cover) => {
      const w = awake(), B = w.boss, P = w.player;
      const col = w.plats.find((p) => p.style === 'arc-icecolumn');
      // stand 12 m from it, either in the clear or with a column between
      B.cx = col.x + 8; B.cz = col.z; B.fx = -1; B.fz = 0;
      const px = cover ? col.x - col.r - 1.2 : col.x + 8, pz = cover ? col.z : col.z - 12;
      let hurt = 0, breathed = false;
      for (let tries = 0; tries < 40 && !breathed; tries++) {
        P.x = px; P.z = pz; P.y = A.floor;
        B.state = 'prowl'; B.timer = 0; B.last = '';
        step(w, C0); keep(w); w.zones.length = 0;
        if (B.state === 'breathTele') breathed = true;
      }
      for (let i = 0; i < 120 * 3.2 && breathed; i++) { alone(w); P.x = px; P.z = pz; P.y = A.floor; P.vx = P.vz = 0; step(w, C0); hurt += hurts(w); w.events.length = 0; keep(w); P.inv = 0; if (B.state === 'prowl') B.timer = 9; }
      return { breathed, hurt, state: B.state };
    };
    const open = run(false), hid = run(true);
    ok(open.breathed && open.hurt > 0, `${id}: in the open the frost breath hits you (${open.hurt} hits)`);
    ok(hid.breathed && hid.hurt === 0, `${id}: behind an ice column it can't (${hid.hurt} hits)`);
    ok(open.state === 'vent' || hid.state === 'vent', `${id}: …and after the breath its vents are open (${open.state})`);
  }

  // 4. the belly slide: standing in its lane gets you run over; a hop as it arrives clears it (or lands on it)
  {
    const run = (jump) => {
      const w = awake(), B = w.boss, P = w.player;
      let slid = false;
      for (let tries = 0; tries < 60 && !slid; tries++) { P.x = 6; P.z = 5; P.y = A.floor; B.cx = -14; B.cz = 5; B.fx = 1; B.fz = 0; B.state = 'prowl'; B.timer = 0; B.last = ''; step(w, C0); keep(w); w.zones.length = 0; if (B.state === 'slideTele') slid = true; }
      let hurt = 0, jumped = false, stomp = 0, end = '';
      for (let i = 0; i < 120 * 5; i++) {
        alone(w);
        const fx = B.cx + B.sx * PT.slide.nose, fz = B.cz + B.sz * PT.slide.nose, d = Math.sqrt((P.x - fx) * (P.x - fx) + (P.z - fz) * (P.z - fz));
        const go = jump && !jumped && B.state === 'slide' && d < PT.slide.hitR + T.RADIUS + B.slideV * 0.28 && P.ground;
        if (go) jumped = true;
        step(w, { ...C0, jump: go });
        hurt += hurts(w); stomp += w.events.filter((e) => e.type === 'stomp').length;
        w.events.length = 0; keep(w);
        if (['beached', 'crash'].includes(B.state)) { end = B.state; break; }
      }
      return { slid, hurt, stomp, end };
    };
    const stand = run(false), hop = run(true);
    ok(stand.slid && stand.hurt > 0, `${id}: standing in the lane, the slide runs you over (${stand.hurt})`);
    ok(hop.slid && hop.hurt === 0 && hop.end, `${id}: a hop as it arrives clears the slide (${hop.hurt} hits${hop.stomp ? ', landed on its back' : ''}; it ends ${hop.end})`);
  }

  // 5. the pound (phase 2+): the spike rings burst outward; in a gap between them you're safe, in a band you're hit, a hop clears it
  {
    const run = (r, jump) => {
      const w = awake(), B = w.boss, P = w.player;
      B.hp = B.maxHp * 0.5; step(w, C0); keep(w); w.events.length = 0; B.roarDue = false;
      B.cx = 0; B.cz = 0;
      let ok2 = false;
      for (let tries = 0; tries < 80 && !ok2; tries++) { P.x = 0; P.z = 14; P.y = A.floor; B.cx = 0; B.cz = 0; B.state = 'prowl'; B.timer = 0; B.last = ''; step(w, C0); keep(w); if (B.state === 'poundTele') ok2 = true; else { w.zones.length = 0; B.rings.length = 0; } }
      let hurt = 0;
      const R = B.rings.slice();
      for (let i = 0; i < 120 * 3; i++) {
        alone(w);
        P.x = r; P.z = 0; P.vx = P.vz = 0;
        const due = R.find((q) => !q.burst && q.t < 0.32 && q.t > 0.2);
        step(w, { ...C0, jump: !!(jump && due && P.ground) });
        if (P.ground) P.y = A.floor;
        hurt += hurts(w); w.events.length = 0; keep(w); P.inv = 0;
      }
      return { ok2, hurt, rings: R.length };
    };
    const gap = run((PT.pound.band[0][1] + PT.pound.band[1][0]) / 2, false), band = run((PT.pound.band[1][0] + PT.pound.band[1][1]) / 2, false), hop = run((PT.pound.band[1][0] + PT.pound.band[1][1]) / 2, true);
    ok(gap.ok2 && gap.rings >= 2, `${id}: in phase 2 the pound raises ${gap.rings} spike rings`);
    ok(gap.hurt === 0, `${id}: standing in the gap between two rings is safe (${gap.hurt} hits)`);
    ok(band.hurt > 0, `${id}: standing in a ring's band gets you spiked (${band.hurt})`);
    ok(hop.hurt === 0, `${id}: a hop as the ring bursts clears it (${hop.hurt} hits)`);
  }

  // 6. the hurled blocks: standing still they land on you; moving on after the throw they miss
  {
    const run = (moveAway) => {
      const w = awake(), B = w.boss, P = w.player;
      ok(forceAttack(w, B, 'hurl'), `${id}: (test) it rips up a block to throw`);
      let hurt = 0;
      const z0 = P.z;
      for (let i = 0; i < 120 * 3; i++) {
        alone(w);
        const block = w.zones.find((z) => z.kind === 'block');
        if (moveAway && block) { const dx = P.x - block.x, dz = P.z - block.z; if (dx * dx + dz * dz < (block.r + 1.2) * (block.r + 1.2)) { P.z = block.z + block.r + 1.6; P.x = block.x; } }
        step(w, C0); hurt += hurts(w); w.events.length = 0; keep(w); P.inv = 0;
        P.vx = P.vz = 0;
        if (B.state === 'prowl') B.timer = 9;
      }
      return { hurt, z0 };
    };
    const stand = run(false), dodge = run(true);
    ok(stand.hurt > 0, `${id}: a block lands on a player who stands still (${stand.hurt})`);
    ok(dodge.hurt === 0, `${id}: stepping out of its red ring dodges it (${dodge.hurt})`);
  }

  // 7. stomps: a stomp while it prowls bounces you, does the stomp plus the bonus, and staggers it; then it
  //    shakes you off (a ring at its back's height). Down on its belly a stomp does the bigger bonus.
  {
    const w = awake(), B = w.boss, P = w.player;
    B.state = 'prowl'; B.timer = 99; B.dur = 99;
    step(w, C0); keep(w);
    const hp0 = B.hp;
    P.x = B.cx + 0.4; P.z = B.cz; P.y = B.y + B.top + 0.3; P.vy = -4; P.ground = null;
    step(w, C0); step(w, C0);
    ok(P.vy > 8 && P.lock === B && hp0 - B.hp >= 4 * PT.plates * PT.plates + PT.stomp.bonus - 0.01 && B.state === 'reel', `${id}: a stomp on its back bounces you, locks on, does ${(hp0 - B.hp).toFixed(1)} and it reels (${B.state})`);
    let shake = false, high = false;
    for (let i = 0; i < 120 * 2; i++) { step(w, C0); keep(w); if (B.state === 'shakeTele') { shake = true; if (w.zones.some((z) => z.kind === 'shake' && z.y > 1.5)) high = true; } }
    ok(shake && high, `${id}: after the reel it shakes like a wet dog (a ring at its back's height)`);
    const w2 = awake(), B2 = w2.boss, P2 = w2.player;
    B2.state = 'beached'; B2.timer = 99; B2.dur = 99; step(w2, C0); keep(w2);
    const hp1 = B2.hp;
    P2.x = B2.cx; P2.z = B2.cz + 0.3; P2.y = B2.y + B2.top + 0.3; P2.vy = -4; P2.ground = null;
    step(w2, C0); step(w2, C0);
    ok(hp1 - B2.hp >= 4 * PT.vulnOpen * PT.vulnOpen + PT.stomp.bonusOpen - 1e-6, `${id}: beached, a stomp does ×${PT.vulnOpen} plus the big bonus (${(hp1 - B2.hp).toFixed(1)})`);
    ok(!K.stompable({ state: 'rearTele' }) && !K.stompable({ state: 'stalk' }) && !K.stompable({ state: 'lunge' }) && !K.stompable({ state: 'shakeTele' }) && K.stompable({ state: 'prowl' }) && K.stompable({ state: 'slide' }) && K.stompable({ state: 'maul' }), `${id}: no bouncing on it while it's reared up, hidden in the snow, in the air or shaking`);
  }

  // 8. the blizzard (phase 3): the snow comes in, it circles you and pounces on red rings; step out of the
  //    ring and the pounce misses; hurt it enough in the snow and the blizzard breaks (dazed)
  {
    const w = awake(), B = w.boss, P = w.player;
    B.hp = B.maxHp * 0.25;
    let bliz = false, lunges = 0, dodged = 0, hurt = 0, prev = B.state, dazed = false, snow = 0;
    for (let i = 0; i < 120 * 30; i++) {
      for (const m of w.enemies) if (m !== B) m.dead = true; // (no drones: only the bear's hits count)
      if (B.state === 'lungeTele' && prev !== 'lungeTele') lunges++;
      if (B.state === 'lungeTele' && B.st > 0.3) { // step out of the ring, sideways to its pounce
        const Z = w.zones.find((z) => z.kind === 'lunge');
        if (Z) {
          const dx = P.x - Z.x, dz = P.z - Z.z;
          if (dx * dx + dz * dz < (Z.r + 1) * (Z.r + 1)) {
            const ax = Z.x - B.cx, az = Z.z - B.cz, l = Math.sqrt(ax * ax + az * az) || 1;
            let px = -az / l, pz = ax / l;
            if (Math.abs(Z.x + px * 6) > 28 || Math.abs(Z.z + pz * 6) > 20) { px = -px; pz = -pz; }
            P.x = Z.x + px * (Z.r + 2.2); P.z = Z.z + pz * (Z.r + 2.2); P.y = A.floor; dodged++;
          }
        }
      }
      prev = B.state;
      step(w, C0); hurt += hurts(w); w.events.length = 0; keep(w); P.inv = 0;
      if (B.state === 'stalk') { bliz = true; snow = Math.max(snow, B.bliz); }
      if (B.state === 'dazed') { dazed = true; break; }
      if (lunges >= 2 && B.state === 'stalk') B.hp -= 0.2; // then shoot it (the visor) in the snow
    }
    ok(bliz && snow > 0.8, `${id}: in phase 3 it calls the blizzard and stalks you through it (snow ${snow.toFixed(2)})`);
    ok(lunges >= 2 && hurt === 0, `${id}: its pounces (${lunges}) all miss a player who steps out of the ring (${hurt} hits)`);
    ok(dazed, `${id}: hurt it ${PT.blizzard.breakDmg} in the snow and the blizzard breaks: it's dazed`);
  }

  // 9. it never walks or slides into the columns, stumps or crates (3 min in phase 3)
  {
    const w = createWorld(s), B = w.boss;
    const spots = [[-24, 4.5, 5], [22, 6.5, -15], [12, 4.8, 19], [-20, 0, 0], [26, 7.4, 12], [-11, 3.6, -19], [0, 0, 0], [24, 0, -6], [-24, 5.6, -14], [10, 0, 10]];
    let worst = 0, where = '';
    B.hp = B.maxHp * 0.28;
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 5) === 0) { const [x, y, z] = spots[(i / (120 * 5)) % spots.length]; const P = w.player; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1;
      if (B.dead) break;
      for (const p of w.plats) {
        const top = p.h + p.oy, x = p.x + p.ox, z = p.z + p.oz;
        if (top <= A.floor + 0.3 || top <= B.y + 0.3 || top - p.thick >= A.floor + PT.rearTop || x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) continue; // (a pounce sails over a crate)
        const r = pushOut(p, B.cx, B.cz, PT.bodyR);
        if (r && r[2] > worst) { worst = r[2]; where = `${B.state} at (${B.cx.toFixed(1)}, ${B.cz.toFixed(1)}) in a ${p.style} at (${x.toFixed(1)}, ${z.toFixed(1)})`; }
      }
    }
    ok(worst < 0.25, `${id}: POLARIS stays out of the columns, stumps and crates (worst overlap ${worst.toFixed(2)} m${where ? ': ' + where : ''})`);
  }

  // 10. an aimbot that hops between spots it can see the bear from (the floor, stumps, ledges), shooting
  //     whenever it can and never dodging: even that perfect aim takes 80 s – 5 min, and it costs real health
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const spots = [];
    for (let k = 0; k < 12; k++) for (const r of [12, 18]) spots.push([Math.cos(k / 12 * Math.PI * 2) * r * 1.3, A.floor, Math.sin(k / 12 * Math.PI * 2) * r * 0.9]);
    for (const p of w.plats) if (['arc-icestump', 'arc-iceledge'].includes(p.style)) spots.push([p.x, p.h, p.z]);
    const free = spots.filter(([x, y, z]) => !w.plats.some((p) => p.h > y + 0.3 && p.h - p.thick < y + 1.7 && pushOut(p, x, z, 0.5)));
    const sees = (x, y, z, tx, ty, tz) => !raycast(w.plats, x, y + T.EYE, z, tx - x, ty - y - T.EYE, tz - z, 0.97);
    let t = 0, dmg = 0, k = 0, next = 0;
    while (!B.dead && t < 400) {
      if (t >= next) {
        for (let n = 0; n < free.length; n++) { const q = free[(k + n) % free.length]; const dd = (q[0] - B.cx) * (q[0] - B.cx) + (q[2] - B.cz) * (q[2] - B.cz); if (dd > 64 && sees(q[0], q[1], q[2], B.cx, B.cy, B.cz)) { k = (k + n + 1) % free.length; P.x = q[0]; P.y = q[1]; P.z = q[2]; P.vx = P.vz = 0; P.ground = null; break; } }
        next = t + 2.5;
      }
      P.yaw = Math.atan2(-(B.cx - P.x), -(B.cz - P.z)); P.pitch = Math.atan2(B.cy - (P.y + T.EYE), Math.sqrt((B.cx - P.x) * (B.cx - P.x) + (B.cz - P.z) * (B.cz - P.z))); P.auto = 0;
      step(w, { ...C0, fire: true });
      for (const e of w.events) if (e.type === 'hurt') dmg += e.dmg;
      w.events.length = 0; keep(w);
      t += dt;
    }
    console.log(`  aimbot fight: ${B.dead ? t.toFixed(0) + ' s' : 'unfinished'}, ${dmg} damage taken`);
    ok(B.dead && t > 80 && t < 300, `${id}: an aimbot takes 80 s – 5 min to bring POLARIS down (${t.toFixed(0)} s)`);
    ok(dmg >= 8, `${id}: …and it costs it (${dmg} damage taken)`);
  }
}
