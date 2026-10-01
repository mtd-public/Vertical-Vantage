// sim-check for the JADE DRAGON (js/sim/bosses/dragon.js): its moves and their telegraphs, a smooth
// flight with a body that keeps together, a body that never sweeps through where you stand, stomps
// on the head and on the body, dives at the deck you're on (and never at the high perches), and a
// body that goes down with the head.
import { DRAGON } from '../../js/sim/bosses/dragon.js';

export default function dragonChecks({ s, createWorld, step, ok, T, C0, keep }) {
  const D = DRAGON, dt = T.DT;
  const solids = (w) => w.plats.filter((p) => p.style !== 'pearlColumn'); // (the columns stand inside its loop's hole)

  // 1. 150 s against a player standing on the deck: its whole move set, telegraphs, a smooth path, a whole body,
  //    and a body that never touches a deck or pad while it flies.
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const seen = new Set(), ev = new Set(), seenZ = new Set();
    let jump = 0, gapLo = Infinity, gapHi = 0, clip = '', stuns = 0, shortZone = Infinity, teleRun = 0, teleMin = Infinity, prev = B.state;
    let px = B.cx, py = B.cy, pz = B.cz, orbTeleMin = Infinity, orbRun = 0, stunMin = Infinity, stunRun = 0, hurt = 0;
    const plats = solids(w);
    for (let i = 0; i < 120 * 150; i++) {
      if (i === 120 * 50) B.hp = B.maxHp * 0.5;
      if (i === 120 * 95) B.hp = B.maxHp * 0.25;
      step(w, C0);
      seen.add(B.state);
      for (const e of w.events) { ev.add(e.type + (e.from ? ':' + e.from : '')); if (e.type === 'hurt') hurt++; }
      w.events.length = 0; keep(w);
      P.x = s.start.x; P.y = s.start.y; P.z = s.start.z; P.vx = P.vy = P.vz = 0; // stands still (the blink keeps it there)
      for (const Z of w.zones) if (!seenZ.has(Z)) { seenZ.add(Z); shortZone = Math.min(shortZone, Z.max); }
      // telegraph lengths actually spent before the fire and the pearls
      if (B.state === 'breathTele') teleRun += dt; else { if (prev === 'breathTele' && B.state === 'breath') teleMin = Math.min(teleMin, teleRun); teleRun = 0; }
      if (B.orbTele > 0 && B.orbN > 0) orbRun += dt; else orbRun = 0;
      if (B.orbTele > 0 && B.orbTele <= dt && B.orbN === (B.phase === 3 ? 2 : 1)) orbTeleMin = Math.min(orbTeleMin, orbRun);
      if (B.state === 'stunned') stunRun += dt; else { if (prev === 'stunned') { stuns++; stunMin = Math.min(stunMin, stunRun); } stunRun = 0; }
      prev = B.state;
      const d = Math.sqrt((B.cx - px) ** 2 + (B.cy - py) ** 2 + (B.cz - pz) ** 2);
      jump = Math.max(jump, d); px = B.cx; py = B.cy; pz = B.cz;
      let ax = B.cx, ay = B.cy, az = B.cz;
      for (const g of B.segs) {
        const L = Math.sqrt((g.cx - ax) ** 2 + (g.cy - ay) ** 2 + (g.cz - az) ** 2);
        gapLo = Math.min(gapLo, L); gapHi = Math.max(gapHi, L); ax = g.cx; ay = g.cy; az = g.cz;
      }
      // in flight (and while it breathes) no part of it is inside a deck or pad, or close enough above one to touch you
      if (!clip && ['fly', 'rage', 'breathTele', 'breath', 'intro'].includes(B.state)) {
        for (const g of [B, ...B.segs]) {
          const r = g.seg ? g.rr : D.headR;
          for (const p of plats) {
            const top = p.h + p.oy, hd = Math.sqrt((g.cx - p.x) ** 2 + (g.cz - p.z) ** 2);
            if (hd < p.r + r + T.RADIUS * 0.8 && g.cy - r < top + T.HEIGHT + 0.2 && g.cy + r > top - p.thick) { clip = `${g.seg ? 'segment ' + g.seg : 'head'} by the ${p.style} at (${p.x.toFixed(1)}, ${top}, ${p.z.toFixed(1)}) while ${B.state}`; break; }
          }
          if (clip) break;
        }
      }
    }
    for (const k of ['fly', 'breathTele', 'breath', 'diveTele', 'dive', 'stunned', 'recoil', 'rage']) ok(seen.has(k), `${s.id}: the dragon reaches ${k}`);
    for (const k of ['bossCharge', 'bossLaser', 'bossTele', 'bossSlam', 'zoneTele', 'zoneHit', 'enemyFire:boss', 'bossPhase']) ok(ev.has(k), `${s.id}: the dragon's fight emits ${k}`);
    ok(shortZone >= 0.5 && teleMin >= 0.5 && orbTeleMin >= 0.5, `${s.id}: every telegraph lasts ≥ 0.5 s (dive ring ${shortZone.toFixed(2)} s, breath ${teleMin.toFixed(2)} s, pearls ${orbTeleMin.toFixed(2)} s)`);
    ok(jump < 1.2, `${s.id}: the head flies a smooth path (largest step ${jump.toFixed(2)} m in 1/120 s)`);
    ok(gapLo > D.gap * 0.28 && gapHi < D.gap * 1.05, `${s.id}: the body keeps together, never folding on itself (segment spacing ${gapLo.toFixed(2)}–${gapHi.toFixed(2)} m, ideal ${D.gap})`);
    ok(!clip, `${s.id}: in flight the body never sweeps through a deck or pad you could stand on${clip ? ' (' + clip + ')' : ''}`);
    ok(stuns >= 5 && stunMin >= D.stun2 - 0.02, `${s.id}: it crashes and lies stunned often (${stuns} punish windows in 150 s, shortest ${stunMin.toFixed(2)} s)`);
    console.log(`  dragon: ${stuns} stuns in 150 s, ${hurt} hits on a player who stands still, dive ring ≥ ${shortZone.toFixed(2)} s, breath tele ≥ ${teleMin.toFixed(2)} s, pearls ≥ ${orbTeleMin.toFixed(2)} s, spacing ${gapLo.toFixed(2)}–${gapHi.toFixed(2)} m`);
  }

  // 2. stomps: the stunned head (×1.5), a body segment (a bounce, no damage, aim swings to the head); side contact hurts
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    let n = 0;
    while (B.state !== 'stunned' && n++ < 120 * 60) { step(w, C0); keep(w); P.inv = 1; w.events.length = 0; }
    ok(B.state === 'stunned', `${s.id}: the dragon dives at a player on the deck and lies stunned (${(n / 120).toFixed(1)} s)`);
    B.timer = 99; // hold it there for the tests
    for (let i = 0; i < 150; i++) { step(w, C0); keep(w); P.inv = 1; }
    const hp0 = B.hp;
    P.x = B.x; P.z = B.z + 0.3; P.y = B.y + B.top + 0.2; P.vy = -4; P.vx = P.vz = 0; P.ground = null; P.inv = 0;
    step(w, C0);
    const want = 4 * 1.5 * 1.5;
    ok(P.vy > 10 && Math.abs(hp0 - B.hp - want) < 1e-6 && P.lock === B, `${s.id}: stomping the stunned head bounces you and deals ×1.5 (${(hp0 - B.hp).toFixed(1)} of ${want})`);
    // a body segment, up the dive line
    const g = B.segs[6], hp1 = B.hp;
    P.x = g.x; P.z = g.z; P.y = g.y + g.top + 0.2; P.vy = -4; P.vx = P.vz = 0; P.ground = null; P.inv = 0; P.lock = null;
    step(w, C0);
    const bounced = P.vy > 10;
    step(w, C0);
    ok(bounced && B.hp === hp1 && g.hp > 0 && P.lock === B, `${s.id}: stomping its back bounces you, does no damage, and swings your aim onto the head`);
    P.x = g.x + g.r * 0.5; P.z = g.z; P.y = g.y + 0.2; P.vy = 0; P.vx = P.vz = 0; P.inv = 0; P.lock = null;
    const hpP = P.hp;
    step(w, C0);
    ok(P.hp < hpP, `${s.id}: touching its body from the side hurts`);
    keep(w);
    // shots at the body glance off
    const hp2 = B.hp;
    w.events.length = 0;
    w.shots.push({ x: g.x - 6, y: g.y + g.top * 0.5, z: g.z, vx: 75, vy: 0, vz: 0, life: 1, dmg: 1, r: 0.18, kind: 'blaster', splash: 0, splashDmg: 0, id: 99999 });
    let shield = false;
    for (let i = 0; i < 20; i++) { step(w, C0); keep(w); P.inv = 1; if (w.events.some((e) => e.type === 'impact' && e.kind === 'shield')) shield = true; w.events.length = 0; }
    ok(shield && B.hp === hp2, `${s.id}: shots at the body glance off its armour`);
  }

  // 3. it dives at the deck you're on: an outer pad → the ring lands on that pad; a high perch → no dive, it breathes
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const pad = w.plats.filter((p) => p.style === 'pearlPad' && p.r > 3 && p.h > 3)[0];
    const perch = w.plats.filter((p) => p.style === 'pearlPad' && p.h > 8)[0];
    const stand = (p) => { P.x = p.x; P.z = p.z; P.y = p.h + p.oy; P.vx = P.vy = P.vz = 0; };
    let onPad = 0, offPad = 0;
    for (let i = 0; i < 120 * 40; i++) {
      stand(pad); step(w, C0); keep(w); P.inv = 1;
      for (const Z of w.zones) if (Z.max - Z.t < dt * 1.5) { if (Math.abs(Z.y - pad.h) < 1e-6 && Math.hypot(Z.x - pad.x, Z.z - pad.z) < pad.r) onPad++; else offPad++; }
      w.events.length = 0;
    }
    ok(onPad > 0 && offPad === 0, `${s.id}: on an outer pad, its dives land on that pad (${onPad} dives, ${offPad} elsewhere)`);
    let dives = 0, breaths = 0, prev = B.state;
    for (let i = 0; i < 120 * 40; i++) {
      stand(perch); step(w, C0); keep(w); P.inv = 1;
      if (B.state === 'diveTele' && prev !== 'diveTele') dives++;
      if (B.state === 'breath' && prev !== 'breath') breaths++;
      prev = B.state; w.events.length = 0;
    }
    ok(dives === 0 && breaths > 0, `${s.id}: up on a high perch it never dives, it breathes (${breaths} breaths)`);
  }

  // 4. its body goes down with it
  {
    const w = createWorld(s), B = w.boss;
    let n0 = 0;
    while (B.state !== 'stunned' && n0++ < 120 * 60) { step(w, C0); keep(w); w.player.inv = 1; }
    B.hp = 1; B.timer = 99;
    w.shots.push({ x: B.x - 3, y: B.y + B.top * 0.5, z: B.z, vx: 75, vy: 0, vz: 0, life: 1, dmg: 2, r: 0.18, kind: 'blaster', splash: 0, splashDmg: 0, id: 99998 });
    let n = 0;
    while (!B.dead && n++ < 120 * 8) { step(w, C0); keep(w); w.player.inv = 1; }
    ok(B.dead && B.segs.every((g) => g.dead) && w.exitOpen, `${s.id}: shot down, the dragon and its whole body die and the exit opens`);
  }
}
