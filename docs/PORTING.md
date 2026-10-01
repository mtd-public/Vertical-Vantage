# Porting Vertical Vantage to Godot or Unity

This game was built so a port is mostly translation, not redesign. The recipe comes from dr-mow and
its two ports (`mtd-public/dr-mow-godot` and `mtd-public/dr-mow-unity`), which matched 466 of 466
golden traces bit for bit.

## The three layers

| Layer | Here | In a port |
|---|---|---|
| **Data** | `js/levels/*.js` → `data/levels/*.json`, `js/sim/tuning.js` → `data/tuning.json` | Load the JSON. Never re-author levels by hand. |
| **Core (rules)** | `js/sim/*` is pure JS: no three.js, no DOM, no `Math.random` | Translate line by line into a plain GDScript/C# library with no engine types. Keep the order of operations. |
| **Adapters (view, input, audio, UI)** | `js/render`, `js/input`, `js/audio`, `js/ui`, `js/main.js` | Rewrite per engine. Nothing here decides gameplay. |

## The sim contract

```
createWorld(level, { autoLook }) → world
step(world, control)            // exactly T.DT = 1/120 s; never a variable dt
control = { mx, my, yaw, pitch, jump, fire, swap }
  mx, my     move stick −1..1 (my > 0 = forward)
  yaw, pitch look deltas in radians for this step (already sensitivity-scaled by the input layer)
  jump       true on the step the button went down (edge); swap −1/0/+1 likewise
  fire       held
world.events  // { type, … } records appended during step(); the adapter drains them each frame
world.phase   // 'play' | 'dead' | 'clear' | 'bonusClear' | 'bonusTimeout'
world.request // 'bonus' when the portal is touched (the adapter swaps in the bonus world)
```

The adapter runs `N` steps per rendered frame from an accumulator, with at most `T.MAX_STEPS`. It
interpolates the player with `alpha = acc / DT` using `player.px/py/pz`. It adds look input that no
step has consumed yet (`input.peekLook()`), so the camera never lags on a frame with zero steps.

**Events the adapter reacts to:** `jump{stage}`, `land{impact}`, `bonk`, `fire{weapon}`, `empty`,
`swap`, `hit`, `kill{kind,pts,stomp}`, `serverDown`, `explode{r}`, `stomp`, `hurt{hp}`, `zap`, `fall`,
`dead`, `drive{n,of}`, `exitOpen`, `portal`, `clear`, `bonusClear`, `bonusTimeout`, `pickup{kind}`,
`enemyFire`, `aim`, `tele`, `laserOn`, `impact{nx,ny,nz,kind}`, `spiked`, `slowStart`, `slowEnd`,
`respawnPickup`, `bossRoar`, `bossTele`, `bossLeap`, `bossSlam{r}`, `bossCharge`, `bossLaser`, `bossCeil`,
`bossPhase{phase}`, `bossDying`.

**Bosses** are looked up by `level.boss.kind` in `sim/bosses/index.js` (`arachne` = `sim/boss.js` when no kind is
given). Each kind has `init` / `update` / `down` and optional `stompable` / `blocks`. Each builds on
`sim/bosses/common.js`: the standard pose, walking round solids, bolts and fans, minion spawning, and **danger
zones**. A zone `{ x, y, z, r, t, max, dmg, knock, kind, height }` sits in `world.zones`; when `t` runs out it hits
the player if they stand inside it (`zoneTele` / `zoneHit` events). Port `common.js` first, then each kind
line by line. Every kind's tuning is exported in `data/tuning.json` under `BOSSES`.

The boss (`sim/boss.js`) is a pose, not a physics body. Its state is: a body centre `(cx, cy, cz)`, a
surface normal `(nx, ny, nz)` (its "up"), a heading `(fx, fz)` and a `surf` value (floor / wall / ceil /
air). The renderer builds its orientation from those, using up = normal and forward = heading (or "up
the wall" while climbing).

It treats any platform inside `level.arena` that overlaps its body band as solid. It pushes its body
circle (`BOSS.bodyR`) out of these, and aims chases, pounces and drops at the nearest free spot
(`freeSpot`). Wall climbs stay inside `arena.climbX`. All of it is plain loops over `w.plats`, with no
generators or closures over engine state.

**Landing look-ahead:** `sim/predict.js` `predictLanding(plats, player, out, { step, maxT, killY, path })` is
pure, and the sim never calls it. The adapter calls it once a frame for the reticle, the arc dots and
the ▼ readout. It reads the player fields `steer`, `tvx` and `tvz` (what the stick asked for this
step). Port it with the core.

**Slow-mo** runs a second clock, `world.pt`, at `T.SLOW_K`. Platforms, lasers, enemies and bolts step
with it; the player and the player's shots step with `DT`. Without slow-mo, `pt === t` exactly.

## Determinism rules (from dr-mow-godot's WORK_GUIDE)

- Use doubles everywhere in the core. Use floats only for meshes.
- Use a fixed `DT`. Do bullet-time and similar effects in the adapter by scaling the accumulator,
  never `DT` itself.
- Seed all randomness: `mulberry32(level.seed)`, stored as `world.rng`. The sim never touches
  `Math.random`.
- The sim already uses `Math.sqrt` instead of `Math.hypot`, and `x*x` instead of `x**2`. Keep it that way.
- `Math.sin`, `Math.cos` and `Math.atan2` differ between V8 and .NET/GDScript on a few percent of
  inputs. dr-mow-godot's `JsMath` (a port of V8's fdlibm) fixes this. Reuse it for bit-exact hashes.
  The 0.5 s samples will match closely even without it.
- Give every runtime field a typed default. The JS objects are built complete in `make*()` functions,
  so you can copy their shapes.
- Nothing in the sim mutates level data. Levels are shared.

## Proving the port: golden traces

`data/golden/<level>.json` holds 40 s of seeded random control. The script is `controlAt()` in
`tools/golden.mjs`: every 30 steps it draws a new `mulberry32(1234)` intent. Each file records:

- `samples`: `[t, x, y, z, yaw, hp, score, drives, kills]` every 0.5 s
- `hashes`: FNV-1a over the raw float64 bits of player, enemies and movers, every 60 steps
  (`stateHash()`), and `final`

`node tools/golden.mjs --check` also replays every trace from the JSON level files. That proves the
JSON is complete. A port that loads the same JSON and runs the same control script must hit the same
numbers.

## Packs, turrets, orbit movers

- **Packs:** `data/levels/index.json` lists the packs in order (`packs: [{ id, name, stages }]`). Each stage's JSON
  carries `pack` and `packIdx` (0–2 normal, 3 the boss). Distant landmarks (`backdrops`) and themes are render-only.
- **Turret:** an enemy type that runs the guard's logic (aim telegraph, burst, cool-down) without walking.
  Its numbers are in `ENEMIES.turret`.
- **Movers:** `move.orbit` (`'xz' | 'xy' | 'zy'`) goes round a circle of radius `amp`: offset = (amp·cos a, amp·sin a)
  on the plane's two axes, with `a = 2π (t / period + phase)`.

## Coordinates

- Metres, +Y up, yaw 0 looks down −Z, pitch > 0 looks up. Yaw rotates (x, z) exactly like three.js
  `rotation.y`: `world = (lx·cos + lz·sin, −lx·sin + lz·cos)`.
- **Godot:** the same handedness and camera convention, so use positions and yaw as is.
- **Unity:** left-handed with +Z forward. Do what dr-mow-unity does: hang every view under a root
  scaled (1, 1, −1), and keep the sim in its own space.
- Platforms: `top = h + offset.y`, the box spans `[top − thick, top]`, and the footprint is `w × d`
  (local x × local z) or radius `r`. Movers are a pure function of time: `platOffset(p, t)`.

## Module → engine map

| JS | Godot | Unity |
|---|---|---|
| `sim/*.js` (incl. `predict.js`) | `core/*.gd` (RefCounted classes) or a C# library | `VerticalVantage.Core` (netstandard2.1, `noEngineReferences`) |
| `levels/*.js` | read `data/levels/*.json` | same (TextAsset / StreamingAssets) |
| `render/level-view.js` | build `MeshInstance3D`s per style; `MultiMeshInstance3D` per car kind | build `Mesh`es in code; `Graphics.RenderMeshInstanced` per car kind |
| `render/retro.js` | a spatial shader: vertex snap in `vertex()`, 15-bit dither in `fragment()`, viewport at 240 lines with nearest filtering | a URP Renderer Feature, or a low-res RenderTexture plus a vertex-snap shader |
| `render/sky.js` | a sky shader (port the GLSL nearly 1:1) | a skybox shader (HLSL) |
| `render/models.js` | `SurfaceTool` / `ArrayMesh` from the same primitives | `Mesh` from the same primitives |
| `input/input.js` | `Input` actions; pad mapping table in the README | Input System; same mapping |
| `audio/*` | `AudioStreamGenerator`, or pre-rendered stems from the same song data | `OnAudioFilterRead`, or pre-rendered stems |
| `ui/*` | `Control` scenes; ECHO's face as a 48×48 `Image` drawn per frame | UI Toolkit / uGUI; same 48×48 texture |

## What not to port 1:1

- **The DOM HUD:** rebuild it natively. It reads `snapshot(world)`.
- **Options and records:** these are adapter-side. FOV, comfort, flash, quality and volume never
  touch the sim. Achievements (`js/ui/achievements.js`) only read events and clear results, so port
  them with the UI.
- **Pointer lock and touch-zoom guard:** these are browser-only.
- **The canvas texture painters:** port them or bake them once to PNGs. They're deterministic
  apart from the font used for the ads' text.
