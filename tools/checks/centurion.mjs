// sim-check for boss 'centurion' (NEO EURO, the Colosseum). The generic boss checks run first
// (tools/sim-check.mjs); these prove the shield, the helmet stomp, the move set, the telegraphs, the
// punish windows and that its attacks can be dodged the way the tells say.
import centurion, { tuning as CT } from '../../js/sim/bosses/centurion.js';
import { pushOut } from '../../js/sim/plats.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id;
  const aimAt = (P, x, y, z) => { P.yaw = Math.atan2(-(x - P.x), -(z - P.z)); P.pitch = Math.atan2(y - (P.y + T.EYE), Math.sqrt((x - P.x) * (x - P.x) + (z - P.z) * (z - P.z))); P.auto = 0; P.lock = null; };
  const awake = () => { const w = createWorld(s); for (let i = 0; i < 120 * 3; i++) { step(w, C0); keep(w); } w.events.length = 0; return w; };
  const freeze = (B, state, shield) => { B.state = state; B.timer = 99; B.dur = 99; B.st = 0; B.shield = shield; };

  // 1. the shield: front shots glance off; flank shots, plunging shots and shots over the rim land
  {
    const B = { cx: 0, cy: CT.top / 2, cz: 0, x: 0, y: 0, z: 0, fx: 0, fz: 1, shield: 1 };
    // a blaster bolt fired from (x, y, z) at (tx, ty, tz), caught on the step it reaches the target (0.6 m short of it)
    const shot = (x, y, z, tx, ty, tz) => { const dx = tx - x, dy = ty - y, dz = tz - z, l = Math.sqrt(dx * dx + dy * dy + dz * dz); return { x: tx - dx / l * 0.6, y: ty - dy / l * 0.6, z: tz - dz / l * 0.6, vx: dx / l * 75, vy: dy / l * 75, vz: dz / l * 75 }; };
    ok(centurion.blocks(null, B, shot(0, 1.6, 10, 0, 3, 2.6)), `${id}: a shot into the raised shield from the front glances off`);
    ok(centurion.blocks(null, B, shot(6, 1.6, 8, 0, 3, 2.4)), `${id}: …and from 40° off its nose`);
    ok(!centurion.blocks(null, B, shot(-10, 1.6, -1, -2.6, 3, 0)), `${id}: a shot into its flank lands`);
    ok(!centurion.blocks(null, B, shot(0, 1.6, -10, 0, 3, -2.6)), `${id}: a shot into its back lands`);
    ok(!centurion.blocks(null, B, shot(0, 13, 9, 0, 5, 2.4)), `${id}: plunging fire from the seats clears the rim`);
    ok(!centurion.blocks(null, B, shot(0, 1.6, 10, 0, 7.4, 2.4)), `${id}: a head shot over the rim lands`);
    ok(!centurion.blocks(null, { ...B, shield: 0.2 }, shot(0, 1.6, 10, 0, 3, 2.6)), `${id}: with the shield down, front shots land`);
  }
  // …and in the sim: a stream of fire into its guarded front does nothing; from behind it hurts
  {
    const w = awake(), B = w.boss, P = w.player;
    freeze(B, 'guard', 1);
    P.x = B.cx + B.fx * 12; P.z = B.cz + B.fz * 12;
    let glance = 0;
    const hp0 = B.hp;
    for (let i = 0; i < 120; i++) { aimAt(P, B.cx, 3.5, B.cz); step(w, { ...C0, fire: true }); B.timer = 99; glance += w.events.filter((e) => e.type === 'impact' && e.kind === 'shield').length; w.events.length = 0; keep(w); }
    ok(B.hp === hp0 && glance > 3, `${id}: a second of fire into its shield: ${glance} glances, no damage (hp ${hp0}→${B.hp})`);
    const w2 = awake(), B2 = w2.boss, P2 = w2.player;
    freeze(B2, 'guard', 1);
    P2.x = B2.cx - B2.fx * 9; P2.z = B2.cz - B2.fz * 9;
    const hp1 = B2.hp;
    for (let i = 0; i < 60; i++) { aimAt(P2, B2.cx, 3.5, B2.cz); step(w2, { ...C0, fire: true }); B2.timer = 99; w2.events.length = 0; keep(w2); }
    ok(B2.hp < hp1 - 2, `${id}: half a second of fire into its back hurts it (hp ${hp1}→${B2.hp})`);
  }

  // 2. the helmet stomp: a bounce, the plain stomp plus the helmet bonus, the lock-on; it reels, then shrugs you off
  {
    const w = awake(), B = w.boss, P = w.player;
    freeze(B, 'guard', 1);
    const hp0 = B.hp;
    P.x = B.cx + 0.4; P.z = B.cz; P.y = B.y + B.top + 0.3; P.vy = -4; P.ground = null;
    step(w, C0); step(w, C0);
    ok(P.vy > 8 && P.lock === B && hp0 - B.hp >= 4 + CT.helmBonus - 0.01 && B.state === 'reel', `${id}: a helmet stomp bounces you, locks on, does ${hp0 - B.hp} and it reels (${B.state})`);
    let shrug = false, zoneHigh = false;
    for (let i = 0; i < 120 * 2; i++) { step(w, C0); keep(w); if (B.state === 'shrugTele') { shrug = true; if (w.zones.some((z) => z.kind === 'shrug' && z.y > 4)) zoneHigh = true; } }
    ok(shrug && zoneHigh, `${id}: after the reel it heaves its shield overhead (a danger ring at helmet height)`);
    ok(!centurion.stompable({ state: 'spin' }) && !centurion.stompable({ state: 'shrugTele' }) && centurion.stompable({ state: 'guard' }), `${id}: no bouncing on it while it spins or shrugs`);
  }

  // 3. over 3 minutes against a player who keeps moving between spots, it uses its whole move set;
  //    every telegraph lasts ≥ 0.5 s; every big attack is followed by a punish window; it hurts
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const spots = [[-20, 0, 0], [12, 0, 14], [0, 0, -12], [-26, 4, 13], [24, 0, -6], [0, 8, 31.5], [8, 0, 4], [-12, 0, -8]];
    const seen = new Set(), teles = {}, after = {};
    let last = B.state, enter = 0, hurt = 0, open = 0, steps = 0, bolts = 0, spawned = 0;
    const n0 = w.enemies.length;
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 7) === 0) { const [x, y, z] = spots[(i / (120 * 7)) % spots.length]; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      if (i === 120 * 40) B.hp = B.maxHp * 0.55;
      if (i === 120 * 90) B.hp = B.maxHp * 0.25;
      step(w, C0);
      for (const e of w.events) { if (e.type === 'hurt') hurt++; if (e.type === 'enemyFire' && e.from === 'boss') bolts++; }
      w.events.length = 0; keep(w); w.player.inv = 0;
      if (B.hp < 30) B.hp = 30;
      steps++;
      if (B.shield < 0.6) open++;
      if (B.state !== last) {
        if (last.endsWith('Tele')) (teles[last] ||= []).push(i - enter);
        if (['sweep', 'stomp', 'charge', 'skid', 'spin'].includes(last)) (after[last] ||= new Set()).add(B.state);
        last = B.state; enter = i; seen.add(B.state);
      }
    }
    spawned = w.enemies.length - n0;
    for (const k of ['guard', 'sweepTele', 'sweep', 'stompTele', 'stomp', 'chargeTele', 'charge', 'throwTele', 'throw', 'recover', 'roar', 'spinTele', 'spin', 'dizzy']) ok(seen.has(k), `${id}: CENTURION reaches ${k}`);
    ok(seen.has('stagger') || seen.has('skid'), `${id}: a charge ends in a stagger (wall) or a skid`);
    const shortest = Math.min(...Object.values(teles).flat()) / 120;
    ok(shortest >= 0.5 - 1e-6, `${id}: every telegraph lasts ≥ 0.5 s (shortest ${shortest.toFixed(2)} s; ${Object.entries(teles).map(([k, v]) => `${k} ×${v.length}`).join(', ')})`);
    const windows = { sweep: ['recover'], stomp: ['recover'], skid: ['recover'], spin: ['dizzy'] };
    for (const [k, want] of Object.entries(windows)) if (after[k]) ok([...after[k]].every((x) => want.includes(x)), `${id}: after ${k} it lowers its shield (${[...after[k]].join(', ')})`);
    if (after.charge) ok([...after.charge].every((x) => ['stagger', 'skid', 'dying'].includes(x)), `${id}: a charge ends in a stagger or a skid (${[...after.charge].join(', ')})`);
    ok(hurt >= 6, `${id}: it really hurts a player who doesn't dodge (${hurt} hits in 3 min)`);
    ok(bolts >= 3, `${id}: it throws javelins (${bolts})`);
    ok(spawned >= 4, `${id}: drones join at each phase change (${spawned})`);
    const share = open / steps;
    ok(share > 0.12 && share < 0.6, `${id}: its shield is down ${(share * 100).toFixed(0)} % of the time (punish windows, not a turtle)`);
  }

  // 4. the tells are honest: a hop clears the sweep; stepping out of line beats the charge
  {
    const run = (dodge) => {
      const w = awake(), B = w.boss, P = w.player;
      P.x = B.cx + B.fx * 4.5; P.z = B.cz + B.fz * 4.5;
      let hurt = 0, swept = false;
      for (let i = 0; i < 120 * 30 && !swept; i++) {
        const Z = w.zones.find((z) => z.kind === 'sweep');
        const c = { ...C0, jump: !!(dodge && Z && Z.t < 0.42 && Z.t > 0.3 && P.ground) };
        step(w, c);
        if (B.state === 'sweep') swept = true;
        if (B.state === 'guard' || B.state === 'recover') { P.x = B.cx + B.fx * 4.5; P.z = B.cz + B.fz * 4.5; } // stay close: bait the sweep
        for (const e of w.events) if (e.type === 'hurt') hurt++;
        w.events.length = 0; keep(w); if (!swept) P.inv = 0;
        if (B.state === 'stompTele' || B.state === 'chargeTele' || B.state === 'throwTele') { B.state = 'guard'; B.timer = 0.01; w.zones.length = 0; } // only the sweep, please
      }
      for (let i = 0; i < 30; i++) { step(w, C0); for (const e of w.events) if (e.type === 'hurt') hurt++; w.events.length = 0; }
      return { swept, hurt };
    };
    const stand = run(false), hop = run(true);
    ok(stand.swept && stand.hurt > 0, `${id}: standing in the sweep gets you hit`);
    ok(hop.swept && hop.hurt === 0, `${id}: a hop at the right moment clears the sweep (${hop.hurt} hits)`);
    const charge = (dodge) => {
      const w = awake(), B = w.boss, P = w.player;
      let hurt = 0, charged = false;
      P.x = B.cx + B.fx * 18; P.z = B.cz + B.fz * 18;
      for (let i = 0; i < 120 * 40 && !(charged && B.state !== 'charge'); i++) {
        if (B.state === 'sweepTele' || B.state === 'stompTele' || B.state === 'throwTele' || B.state === 'spinTele') { B.state = 'guard'; B.timer = 0.01; w.zones.length = 0; }
        if (B.state === 'guard' && B.timer < 0.05) { const dx = P.x - B.cx, dz = P.z - B.cz; if (dx * dx + dz * dz < 100) { P.x = B.cx + B.fx * 18; P.z = B.cz + B.fz * 18; } }
        if (B.state === 'charge' && !charged) { charged = true; if (dodge) { P.x += -B.fz * 5; P.z += B.fx * 5; } }
        step(w, C0);
        for (const e of w.events) if (e.type === 'hurt' && charged) hurt++;
        w.events.length = 0; keep(w); P.inv = 0;
      }
      return { charged, hurt };
    };
    const hit = charge(false), side = charge(true);
    ok(hit.charged && hit.hurt > 0, `${id}: standing in its line, the charge runs you down`);
    ok(side.charged && side.hurt === 0, `${id}: a sidestep as it launches dodges the charge`);
  }

  // 5. it never walks or charges into the columns, the ruins or the seats (3 min, phase 3 for the spin)
  {
    const w = createWorld(s), B = w.boss, A = s.arena;
    const spots = [[-17, 4.5, -10], [16, 6.2, 11], [-27, 5.6, 13], [9, 7, -15], [-20, 0, 0], [30, 0, 15], [0, 4, -26.5], [-30, 0, -16], [0, 0, 0], [25, 4, -13]];
    let worst = 0, where = '';
    B.hp = B.maxHp * 0.25;
    for (let i = 0; i < 120 * 180; i++) {
      if (i % (120 * 5) === 0) { const [x, y, z] = spots[(i / (120 * 5)) % spots.length]; const P = w.player; P.x = x; P.y = y; P.z = z; P.vx = P.vy = P.vz = 0; }
      step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1;
      if (B.dead) break;
      for (const p of w.plats) {
        const top = p.h + p.oy, x = p.x + p.ox, z = p.z + p.oz;
        if (top <= A.floor + 0.3 || x < A.x0 || x > A.x1 || z < A.z0 || z > A.z1) continue;
        const r = pushOut(p, B.cx, B.cz, CT.bodyR);
        if (r && r[2] > worst) { worst = r[2]; where = `${B.state} at (${B.cx.toFixed(1)}, ${B.cz.toFixed(1)}) in a ${p.style} at (${x.toFixed(1)}, ${z.toFixed(1)})`; }
      }
    }
    ok(worst < 0.25, `${id}: CENTURION stays out of the columns, ruins and seats (worst overlap ${worst.toFixed(2)} m${where ? ': ' + where : ''})`);
  }
}
