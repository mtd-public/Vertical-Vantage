# Building a level pack

A **pack** is three stages plus a boss stage, built around one place. Neo-Tokyo (`js/levels/packs/tokyo.js`) is
the reference: HARBOR 9 → SKYWAY → NEON RAIN → WAREHOUSE 13 (ARACHNE-9). Every pack lives in its own files, so
packs never touch each other or the engine:

| File | What goes in it |
|---|---|
| `js/levels/packs/<pack>.js` | **Data only** (no three.js, no DOM): `export default { id, name, sub, color, stages: [s1, s2, s3, bossStage] }` |
| `js/sim/bosses/<kind>.js` | **Pure** boss logic: `export default { init, update, down, stompable?, blocks?, tuning }` |
| `js/render/packs/<pack>.js` | `export default { themes, styles, backdrops, bosses }`: sky/fog/light themes, platform looks, distant landmarks, the boss model + animation |
| `js/audio/packs/<pack>.js` | Songs: `addSong('<name>', {…})` from `../music.js` (see `js/audio/songs.js` for the notation) |
| `tools/checks/<kind>.mjs` | The boss's own sim-checks (the generic ones run anyway) |

Never edit shared files to add content. If you hit a genuine engine bug, make the smallest fix and say so.

## Hard rules

- **Sim purity:** everything under `js/sim` and `js/levels` is pure JS: no three.js, no DOM, no `Math.random` (use
  `w.rng()` in the sim and `mulberry32(seed)` in level builders). Deterministic: `Math.sqrt` not `hypot`, `x*x` not `x**2`.
- **Every stage must pass** `node tools/sim-check.mjs`. The reachability prover walks a graph of every walkable top
  (movers sampled over 30 s) with the real jump envelope:
  - Every drive, the portal and the exit must be reachable from the start.
  - The exit must be reachable from each drive and from the portal.
  - Laser walls must leave a gap.
  - Every enemy and pickup must sit on a deck.
- **Ids are unique across the game:** prefix them with the pack, e.g. `ocean-intake`, `ocean-boss`.
- **The retro look:** flat-shaded primitives, vertex colours, a few strong neon accents, no textures beyond the stock
  ones, PS1 at 240 lines. Merge static geometry (the level view does this for you). Keep draw calls well under 400.
- **Don't commit `data/`.** It's regenerated at integration. You may run `node tools/export-levels.mjs` and
  `node tools/golden.mjs` locally, but `git checkout -- data && git clean -fdq data` before you commit.

## Movement numbers (design inside these)

- Run 8.5 m/s. Gravity 21 m/s².
- Jumps launch at 11, 13.5 and 16 m/s (triple jump). The first rises **2.9 m**; a full triple reaches about **13 m**
  above takeoff.
- Comfortable hops: **≤ 7 m** centre to centre between stepping stones, rising **≤ 3.8 m** per hop. `chain()` /
  `link()` keep to that.
- Air control is strong; the auto look-down shows the landing reticle.
- A fall below `killY` costs 2 integrity and respawns you on your last solid footing (bonus: −3 s).

## A stage (normal)

```js
{
  id: 'ocean-intake', name: 'INTAKE', sub: 'DESAL PLANT 7 · 06:10 · CALM', theme: 'oceanDawn', song: 'tidalBreak',
  seed: 71, par: 260, killY: -0.6, water: 0,             // water: the sea plane's height (the theme gives its colour)
  start: { x, y, z, yaw },                                // y = the top you stand on
  plats: [...],                                           // see the kit below
  drives: [{ x, y, z } ×3],                               // y ≈ deck top + 1.1
  exit: { x, y, z, yaw },                                 // y = deck top (the gate stands on it)
  portal: { x, y, z },                                    // optional; y ≈ deck top + 1.4; gives the stage a SERVER CORE bonus
  bonusStyle: { theme, music, weapon, tag },              // optional look for that bonus arena
  enemies: [{ type, x, y, z }],                           // drone (hovers at y), walker, spiker, guard, turret (sit on a deck: y = its top)
  pickups: [{ type, x, y, z }],                           // health, healthBig, spread, rapid, rocket, hyper, overdrive, slowmo
  lasers: [laser(x, y, z, len, h, yaw, period, on, phase)],
  backdrops: [{ kind, x, y, z, yaw, s, … }],              // render-only distant landmarks (below)
}
```

Aim for **3 to 5 minutes** a stage, several routes and heights, and a few optional shortcuts and secrets:

- 8–14 enemies
- 5–8 pickups
- 2–6 laser walls
- a signature landmark you climb or cross

Put the drives in interesting places: the top of the landmark, on a mover, behind a laser. The exit should be visible
from far away.

## A boss stage

```js
{
  id: 'ocean-boss', name: 'BRINE POOL', sub: '… · BOSS', theme: '…', song: '…', seed, par: 220, killY,
  objective: 'boss', bossName: 'KRAKEN-OS',
  arena: { x0, x1, z0, z1, floor, ceil },   // the fight box: helpers clamp to it
  start, plats, boss: { x, y, z, kind: 'kraken' }, exit: { … },   // the exit opens when the boss dies
  drives: [], portal: null, enemies: [...], pickups: [...respawn: 25 s for health/weapons...], lasers: [],
}
```

Give it cover, height (catwalks, pillars, perches) and respawning pickups (`respawn: seconds`). See
`js/levels/warehouse.js`.

## The level kit (`js/levels/kit.js`)

- `rect(x, z, w, d, top, { thick, yaw, style, move, bob, tint })` is a box whose TOP is at `top`. `disc(x, z, r, top, …)`
  is a cylinder.
- `tower(x, z, w, d, top)` is a building rising out of the fog (thick down to −140).
- **Movers:**
  - `mv(axis, amp, period, phase)` slides along x, y or z.
  - `lane(dx, dy, dz, amp, period, phase)` slides along any direction.
  - `orbit('xz' | 'xy' | 'zy', r, period, phase)` goes round a circle (carousels, Ferris wheels).
  - `bob(amp, period, phase)` is a hover wobble. You ride all of them.
- **Stepping stones:**
  - `chain(seed, a, b, o)` makes stepping stones from point a to point b (hover cars by default).
  - `link(seed, platA, platB, o)` does the same edge to edge between two platforms, finding the edges itself.
  - Pass `o.make = (rng, x, z, top, yaw, i) => platform | [platforms]` for themed stones (boats, lanterns, crates, buoys…).
  - Use `o.maxStep` and `o.maxRise` to tighten them.
- `pad(x, z, r, top, o)` is a hover pad. `on(plat, dx, dz, up)` gives a point on a platform (drives, enemies, pickups).
- `car(kind, x, z, top, yaw)` with `CARS` sedan / coupe / taxi / police / van / truck / bus / barge.
  `stack(x, z, base, n)` makes shipping containers. `billboard(...)` and `adpad(...)` are satirical floating ads.
  `laser(...)`, `spiral(...)` and `skyline(...)` are also available.
- **Stock styles:** 'deck' (default), 'pad', 'tower', 'helipad', 'pier', 'container', 'crane…', 'hull', 'bridge',
  'control', 'billboard', 'adpad', 'sign', 'pagoda', 'floor', 'wall', 'ceiling', 'catwalk', 'rack', 'crate', 'core'.
  Your own styles are named in your render module.

## The render module (`js/render/packs/<pack>.js`)

```js
import * as THREE from 'three';
export default {
  themes: { oceanDawn: { /* see js/render/themes.js: skyTop, skyBot, sun, sunDir, night, fog, hemi, key, cloud,
            cloudShade, city, arc, cityCol, windows, neon, water, rain, stars, beams, + cover (overcast 0..1),
            cityH (skyline height ×), pyramids (0/1), cloudSea (colour of a sea of cloud at level.cloudY), haze */ } },
  styles: { desalTank(K, p, th, rng, H) { /* build in p's local frame: y = 0 at its top, footprint p.w × p.d or p.r */ } },
  backdrops: { goldenGate(o, th, B) { const K = new B.Kit(); K.add('solid', B.box(…, { color: B.c('#c0362c') })); return B.mesh(K); } },
  bosses: { kraken: { model(M, e) { … return group; }, update(R, e, g, dt, t, P) { … } } },
};
```

- **Styles:** use `H` (from `js/render/level-view.js`): `H.box / H.cyl / H.part(geometry, { x, y, z, rx, ry, rz, sx,
  sy, sz, color })`, `H.deck(K, p, th)`, `H.tower(K, p, th, rng)`, `H.faces(w, d)`, `H.seg(smooth, retro)` (segment
  counts), `H.THREE`.
  - `K.add('flat', geometry)` is vertex-coloured and flat-shaded: use it for most things.
  - `'glow'` is unlit (lights, screens). `'neon'` is unlit and dims by theme. `'glass'`, `'facade'` (tower windows,
    via `H.meterBox`) and `'concrete'` are also available.
  - The top face must sit at y = 0, because that's where you stand.
  - A style runs once per platform. Static ones are merged; moving ones become a group.
- **Backdrops:** render-only, placed far outside the play space (200–800 m), not fogged, and hazed toward the
  horizon with `B.c(hex)`.
  - `B` = `{ THREE, Kit, box, cyl, ball, part, seg, c, mesh(kit), rng, night }`. Keys: `'solid'` (lit) and
    `'glow'` (unlit, e.g. lit windows at night).
  - Stock kinds: `mountain` (`r`, `h`, `snow`, `crater`), `hills` (`len`, `h`, `n`, `color`, `houses`) and
    `skyline` (`w`, `d`, `n`, `hMin`, `hMax`, `color`).
- **Boss view:**
  - `model(M, e)` returns a `THREE.Group`. Materials: `M.paintFlat` (vertex colours), `M.glow` (unlit vertex colours).
    Build with `Kit` / `box` / `cyl` / `part` from `../geo.js` and merge per material.
  - `update(R, e, g, dt, t, P)` poses it every frame from the sim pose: `e.cx, e.cy, e.cz`, heading `e.fx, e.fz`,
    up `e.nx, e.ny, e.nz`, `e.state`, `e.timer`, `e.crouch`, your own fields.
  - Call `R.flashModel(g, e.flash > 0 || (e.state === 'dying' && Math.sin(t * 30) > 0))` for the hit flash.
  - `R.flashK` (< 1 = the reduced-flash option) and `R.motion` (0 = the calm option) are there too.
  - The renderer already draws `e.beam` (a laser) and `w.zones` (red danger rings) for you.
  - Look at `js/render/models.js` `bossModel` and `js/render/renderer.js` `updateArachne` for a full example
    (IK legs, a turret that tracks you).

## The boss module (`js/sim/bosses/<kind>.js`)

Build on `js/sim/bosses/common.js`:

| Helper | What it does |
|---|---|
| `initPose(w, e, d, { hp, r, top, bodyH, intro })` | sets the standard fields |
| `introTick` / `phaseTick` | the roar, then phases by health (emits `bossPhase`) |
| `pick(w, [[name, weight], …])` | seeded weighted choice |
| `stride(w, e, tx, tz, speed, dt, R)` | walk the floor, inside the arena, round solids |
| `turnTo` / `openSpot` | turning, and the nearest free floor spot |
| `fireAt(w, e, ox, oy, oz, speed, lead, spread)` / `fan(...)` | bolts (1 damage, blocked by geometry) |
| `zone(w, x, y, z, r, delay, { dmg, knock, kind, height })` | a telegraphed danger circle that hits when its delay runs out (slams, tentacles, lightning, drills, sweeps) |
| `aimBeam(w, e, px, py, pz, a)` + `beamHit(w, e)` | the laser (uses `e.cx`… and `e.fx`/`e.fz` as the eye) |
| `spawn(w, { type: 'drone', x, y, z })` | minions (any enemy type; the renderer adds their models) |
| `down(w, e)` → `dyingTick(w, e, dt)` | the standard defeat (explosions, score, exit opens) |
| `sees(w, ox, oy, oz)` | line of sight |

- Set `e.vuln`: 1 normally, 1.5 when stunned, 0 when shielded (shots glance off). `blocks(w, e, shot)` can refuse
  shots from some directions (a shield).
- `stompable(e)` decides whether you bounce off its back, which is the Jumping Flash move. Make stomps matter.
- `noContact = true` turns off the bump damage.
- **Events the game already reacts to** (sound, ECHO, rumble, FX): `bossRoar`, `bossTele`, `bossLeap`, `bossSlam{r}`,
  `bossCharge`, `bossLaser`, `bossCeil`, `bossPhase{phase}`, `bossDying`, `enemyFire{from:'boss'}`, `zoneTele`,
  `zoneHit`, `explode{r}`.
- **Fair and readable:** every big attack gets a telegraph (≥ 0.5 s), you can out-run it (8.5 m/s), and there's a
  window to punish. Aim for **2–4 minutes**, 3 phases and **200–320 HP** (the blaster does 1 per shot, about 6.7 a
  second).
- Export `tuning` (every number with a comment saying why). It lands in `data/tuning.json`.

## Checks you must run (all must pass)

```
node tools/sim-check.mjs                 # reachability, scripted play, generic boss checks + tools/checks/<kind>.mjs
node tools/export-levels.mjs --check     # (after a local export) data matches
node tools/golden.mjs                    # then --check: JSON replay parity (then revert data/)
python3 -m http.server <your port> & BASE=http://localhost:<your port>/ OUT=shots node tools/smoke.mjs
```

The smoke test's `bosses` run starts every boss, checks the gauge, kills it and checks the exit opens.

Look at your stages: write a small Playwright script, like `tools/smoke.mjs`, that starts a stage
(`GAME.start(GAME.stageIndex('<id>'))`, `GAME.skipIntro()`, `GAME.warpTo({x,y,z})`, `GAME.look(yaw, pitch)`) and takes
screenshots. Then actually look at them and fix what reads badly. Chromium lives at `/opt/pw-browsers/chromium`; launch
it with `--use-gl=swiftshader`.
