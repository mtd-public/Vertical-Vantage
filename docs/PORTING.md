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
`enemyFire`, `aim`, `tele`, `laserOn`, `impact{nx,ny,nz,kind}`.

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
| `sim/*.js` | `core/*.gd` (RefCounted classes) or a C# library | `VerticalVantage.Core` (netstandard2.1, `noEngineReferences`) |
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
- **Pointer lock and touch-zoom guard:** these are browser-only.
- **The canvas texture painters:** port them or bake them once to PNGs. They're deterministic
  apart from the font used for the ads' text.
