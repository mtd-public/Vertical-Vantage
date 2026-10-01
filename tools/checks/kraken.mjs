// sim-checks for KRAKEN-OS (boss 'kraken', OCEAN CORE's BRINE POOL). tools/sim-check.mjs runs the
// generic boss checks first, then this.
//   1. Over 2.5 minutes (phases forced at 50 s / 100 s) it uses its whole move set: surfaces, slams
//      tentacles, fires water-cannon volleys, charges and sweeps the eye laser, dives, comes up
//      somewhere else, calls drones from phase 2 (never more than its cap), and hurts a player who
//      stands still.
//   2. Every attack is telegraphed: each danger ring fills for ≥ 0.9 s (tentacles) / ≥ 1.4 s (where it
//      surfaces), the laser is preceded by ≥ 0.5 s of sight line, each volley by ≥ 0.5 s of vent flare,
//      and it comes up exactly where the surfacing ring was.
//   3. It can be hurt only as designed: invulnerable and untouchable under the brine, ×1 up, ×1.5 when
//      slumped after a slam or stunned by a stomp; shooting the eye from the deck takes health off.
//   4. Stomps: landing on the dome bounces you, hurts it, locks your aim on it, and stuns it (reel),
//      after which it dives; you can't stomp it while it's under.
//   5. Fair: a player who keeps running round the ring takes far fewer tentacle hits than one who
//      stands still; the rings never land on a deck you couldn't leave in time.
import { damageEnemy } from '../../js/sim/enemies.js';
import { KRAKEN } from '../../js/sim/bosses/kraken.js';

export default function ({ s, createWorld, step, ok, T, C0, keep }) {
  const id = s.id, DT = T.DT;
  const runFor = (w, secs, f) => { for (let i = 0; i < Math.round(secs / DT); i++) { step(w, C0); if (f && f(i) === false) return false; w.events.length = 0; keep(w); } return true; };
  const until = (w, cond, secs = 60) => { for (let i = 0; i < Math.round(secs / DT); i++) { if (cond()) return true; step(w, C0); w.events.length = 0; keep(w); w.player.inv = 1; } return cond(); };

  // ---- 1 + 2: the move set, its telegraphs, minions, damage
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    const seen = new Set(), ev = new Set(), zones = new Set(), droneCap = [];
    let hurt = 0, shortRing = 0, shortSurface = 0, chargeT = 0, teleT = 0, badLaser = 0, badVolley = 0, lasers = 0, volleys = 0, maxDrones = 0, surfaces = 0, wrongSpot = 0, lastSurf = null;
    let prev = B.state;
    const initialDrones = w.enemies.filter((e) => e.type === 'drone').length;
    for (let i = 0; i < Math.round(150 / DT); i++) {
      step(w, C0);
      seen.add(B.state);
      for (const Z of w.zones) if (!zones.has(Z)) {
        zones.add(Z);
        if (Z.kind === 'tentacle' && Z.max < 0.9) shortRing++;
        if (Z.kind === 'surface') { if (Z.max < 1.4) shortSurface++; lastSurf = Z; }
      }
      for (const e of w.events) { ev.add(e.type + (e.kind ? ':' + e.kind : '') + (e.from ? ':' + e.from : '')); if (e.type === 'hurt') hurt++; }
      if (B.state === 'charge') chargeT += DT;
      if (B.state === 'volleyTele') teleT += DT;
      if (B.state === 'laser' && prev !== 'laser') { lasers++; if (chargeT < 0.5) badLaser++; chargeT = 0; }
      if (B.state === 'volley' && prev !== 'volley') { volleys++; if (teleT < 0.5) badVolley++; teleT = 0; }
      if (B.state === 'rise' && prev !== 'rise') { surfaces++; if (!lastSurf || Math.abs(lastSurf.x - B.cx) > 0.5 || Math.abs(lastSurf.z - B.cz) > 0.5) wrongSpot++; }
      if (prev !== B.state && prev !== 'charge' && B.state !== 'charge') chargeT = B.state === 'charge' ? chargeT : 0;
      prev = B.state;
      const mine = (B.minions || []).filter((m) => !m.dead).length;
      maxDrones = Math.max(maxDrones, mine);
      if (mine > (KRAKEN.drones[B.phase - 1] ?? 0) + 0) droneCap.push(`${mine} in phase ${B.phase}`);
      w.events.length = 0; keep(w); P.inv = 0;
      if (i === Math.round(50 / DT)) B.hp = B.maxHp * 0.5;
      if (i === Math.round(100 / DT)) B.hp = B.maxHp * 0.25;
    }
    for (const k of ['idle', 'slam', 'recover', 'volleyTele', 'volley', 'charge', 'laser', 'dive', 'under', 'rise']) ok(seen.has(k), `${id}: KRAKEN-OS reaches ${k}`);
    ok(ev.has('zoneTele:tentacle') && ev.has('zoneHit:tentacle') && ev.has('zoneTele:surface'), `${id}: tentacle rings and surfacing rings go up and land`);
    ok(ev.has('bossLaser') && ev.has('enemyFire:boss') && ev.has('bossCharge') && ev.has('bossTele'), `${id}: eye laser, water cannon, and their telegraphs (${[...ev].filter((x) => x.startsWith('boss') || x.includes('boss')).join(', ')})`);
    ok(ev.has('bossPhase') && B.phase === 3, `${id}: it goes through its three phases`);
    ok(surfaces >= 4, `${id}: it dives and comes up somewhere else (${surfaces} surfacings)`);
    ok(wrongSpot === 0, `${id}: it always comes up where the surfacing ring was (${wrongSpot} wrong)`);
    ok(shortRing === 0 && shortSurface === 0, `${id}: every tentacle ring fills ≥ 0.9 s and every surfacing ring ≥ 1.4 s (${shortRing} / ${shortSurface} short)`);
    ok(lasers > 0 && badLaser === 0, `${id}: every laser sweep follows ≥ 0.5 s of sight line (${lasers} sweeps, ${badLaser} early)`);
    ok(volleys > 0 && badVolley === 0, `${id}: every water-cannon volley follows ≥ 0.5 s of vent flare (${volleys} volleys, ${badVolley} early)`);
    const drones = w.enemies.filter((e) => e.type === 'drone').length - initialDrones;
    ok(drones >= 2 && droneCap.length === 0 && maxDrones <= Math.max(...KRAKEN.drones), `${id}: it calls drones from phase 2, within its cap (${drones} spawned, at most ${maxDrones} alive${droneCap.length ? ', over cap: ' + droneCap[0] : ''})`);
    ok(hurt >= 4, `${id}: it hurts a player who stands still (${hurt} hits in 2.5 min)`);
  }

  // ---- 3: when it can be hurt
  {
    const w = createWorld(s), B = w.boss;
    ok(until(w, () => B.state === 'under', 60), `${id}: it dives within a minute`);
    const hp0 = B.hp;
    damageEnemy(w, B, 5);
    ok(B.vuln === 0 && B.noContact && B.hp === hp0, `${id}: under the brine it can't be hurt or touched (vuln ${B.vuln}, hp ${hp0}→${B.hp})`);
    ok(until(w, () => B.state === 'idle' && B.up >= 1, 10), `${id}: it surfaces again`);
    const hp1 = B.hp; damageEnemy(w, B, 5);
    ok(B.vuln === 1 && !B.noContact && Math.abs(hp1 - B.hp - 5) < 1e-9, `${id}: surfaced, it takes full damage (${hp1}→${B.hp})`);
    ok(until(w, () => B.state === 'recover', 90), `${id}: it slumps after a tentacle slam`);
    const hp2 = B.hp; damageEnemy(w, B, 4);
    ok(B.vuln === KRAKEN.recoverVuln && Math.abs(hp2 - B.hp - 4 * KRAKEN.recoverVuln) < 1e-9, `${id}: slumped, it takes ×${KRAKEN.recoverVuln} (${hp2}→${B.hp})`);
  }
  {
    // shooting the eye from the south deck while it's up
    const w = createWorld(s), B = w.boss, P = w.player;
    until(w, () => B.state === 'idle' && B.up >= 1, 10);
    const hp0 = B.hp;
    for (let i = 0; i < Math.round(3 / DT); i++) {
      P.yaw = Math.atan2(-(B.cx - P.x), -(B.cz - P.z)); P.pitch = Math.atan2(B.cy - (P.y + T.EYE), Math.sqrt((B.cx - P.x) * (B.cx - P.x) + (B.cz - P.z) * (B.cz - P.z))); P.auto = 0;
      step(w, { ...C0, fire: true }); w.events.length = 0; keep(w); P.inv = 1;
      if (B.state === 'dive' || B.state === 'under') break;
    }
    ok(B.hp < hp0 - 3, `${id}: shooting the eye from the deck hurts it (${hp0}→${B.hp.toFixed(0)})`);
  }

  // ---- 4: stomps
  {
    const w = createWorld(s), B = w.boss, P = w.player;
    until(w, () => B.state === 'idle' && B.up >= 1, 10);
    const hp0 = B.hp, crown = B.y + B.top;
    P.x = B.cx + 0.4; P.z = B.cz; P.y = crown + 0.3; P.vy = -4; P.ground = null;
    step(w, C0);
    ok(P.vy > 10 && B.hp < hp0 && P.lock === B, `${id}: landing on the dome bounces you, hurts it and locks on (vy ${P.vy.toFixed(1)}, hp ${hp0}→${B.hp})`);
    step(w, C0);
    ok(B.state === 'reel' && B.vuln === KRAKEN.reelVuln, `${id}: …and stuns it (${B.state}, ×${B.vuln})`);
    let dove = false;
    for (let i = 0; i < Math.round((KRAKEN.reel + 0.5) / DT); i++) { step(w, C0); w.events.length = 0; keep(w); P.inv = 1; if (B.state === 'dive') { dove = true; break; } }
    ok(dove, `${id}: after reeling it dives away`);
    // under the brine: no stomp
    until(w, () => B.state === 'under', 5);
    const hp1 = B.hp;
    P.x = B.cx; P.z = B.cz; P.y = KRAKEN.headUp + KRAKEN.top / 2 + 0.3; P.vy = -4; P.ground = null; P.lock = null; // where its crown would be
    step(w, C0);
    ok(B.hp === hp1 && P.vy < 0 && P.lock !== B, `${id}: it can't be stomped while it's under (hp ${hp1}→${B.hp}, vy ${P.vy.toFixed(1)})`);
  }

  // ---- 5: fair: running round the ring beats standing still
  {
    const tentacleHits = (run) => {
      const w = createWorld(s), P = w.player, A = s.arena, cx = (A.x0 + A.x1) / 2, cz = (A.z0 + A.z1) / 2;
      let hits = 0, unfair = 0, dir = 1, flipT = 0;
      for (let i = 0; i < Math.round(90 / DT); i++) {
        let c = C0;
        if (run) { // run round the ring at ~18 m; turn back from a ring ahead, jump one about to land on you
          const rx = P.x - cx, rz = P.z - cz, r = Math.sqrt(rx * rx + rz * rz) || 1, tx = (-rz / r) * dir, tz = (rx / r) * dir, k = (18 - r) * 0.25;
          flipT -= DT;
          let jump = false;
          for (const Z of w.zones) {
            if (Z.kind !== 'tentacle') continue;
            const zx = Z.x - P.x, zz = Z.z - P.z, d = Math.sqrt(zx * zx + zz * zz);
            if (d < Z.r + 0.6 && Z.t < 0.5 && Z.t > 0.3 && P.ground) jump = true;
            else if (d < Z.r + 4 && d > Z.r * 0.5 && zx * tx + zz * tz > 0 && flipT <= 0) { dir = -dir; flipT = 0.8; }
          }
          const dx = tx + (rx / r) * k, dz = tz + (rz / r) * k;
          P.yaw = Math.atan2(-dx, -dz); c = { ...C0, my: 1, jump };
        }
        const due = w.zones.filter((Z) => Z.kind === 'tentacle' && Z.t <= DT + 1e-9);
        step(w, c);
        for (const Z of due) if ((P.x - Z.x) * (P.x - Z.x) + (P.z - Z.z) * (P.z - Z.z) < Z.r * Z.r && P.y < Z.y + Z.height && P.y + T.HEIGHT > Z.y - 0.5) hits++;
        for (const Z of w.zones) if (Z.kind === 'tentacle' && Z.t === Z.max && Z.max * T.RUN < Z.r + 1) unfair++; // you can always run out of a ring
        w.events.length = 0; keep(w); P.inv = 0;
        if (i === Math.round(30 / DT)) w.boss.hp = w.boss.maxHp * 0.5;
      }
      return { hits, unfair };
    };
    const still = tentacleHits(false), runner = tentacleHits(true);
    ok(still.hits >= 3 && runner.hits <= still.hits * 0.5, `${id}: read the rings and keep moving, and the tentacles miss (standing still: ${still.hits} hits, running the ring: ${runner.hits})`);
    ok(still.unfair === 0 && runner.unfair === 0, `${id}: every tentacle ring can be run out of before it lands`);
  }

  // ---- down while arms are up: the rings go, the arms go limp, it sinks
  {
    const w = createWorld(s), B = w.boss;
    until(w, () => B.state === 'slam' && w.zones.length > 0, 90);
    B.hp = 1; damageEnemy(w, B, 5);
    ok(B.state === 'dying' && w.zones.length === 0 && B.arms.every((a) => !a.on || a.t <= 0), `${id}: killed mid-slam, the rings vanish and the arms go limp`);
    const y0 = B.cy;
    for (let i = 0; i < 120; i++) { step(w, C0); w.events.length = 0; keep(w); }
    ok(B.cy < y0 && Number.isFinite(B.cy), `${id}: …and it sinks into the brine as it dies`);
  }
}
