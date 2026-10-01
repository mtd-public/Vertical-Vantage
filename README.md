# Vertical Vantage

A retro first-person platform shooter for the browser. You play a small robot in Neo-Tokyo.
Triple-jump across hover cars, floating billboards and rooftops, find 3 data drives, then reach
the exit gate's light beam. You can shoot straight down the view line at any time, even while you
look down at your feet mid-jump.

- **Gameplay:** Jumping Flash and Jumping Flash 2. Each air jump launches higher than the last, the
  camera tips down as you fall so you can line up the landing, you stomp enemies, and hidden
  portals lead to timed bonus rounds.
- **Look:** Ghost in the Shell, Blade Runner and Perfect Dark Zero, rendered like a PS1 game (as
  in dr-mow). That means 240 lines, vertex wobble and 15-bit dithering, with neon on top.

```
python3 -m http.server 4180      # then open http://localhost:4180  (a server, not file://)
```

No build step and no npm dependencies. It uses three.js r160 (vendored) through an import map.

## What's in it

| | |
|---|---|
| **Stages** | **1 HARBOR 9**: future docks by day, with container stairs, a hover barge and a crane boom. **2 SKYWAY**: Neo-Tokyo rooftops by day, with a shuttle-bus lane and an arcology. **3 NEON RAIN**: night and rain, live traffic lanes, a police cruiser, a pagoda, and a 92 m megatower. **4 WAREHOUSE 13**: the boss stage. |
| **Goal** | Collect 3 hard drives. The exit (a neon torii gate with a beam you can see from anywhere) goes from red to cyan. Walk in to finish. In stage 4, the exit opens when the boss dies. |
| **Boss** | **ARACHNE-9** is a spider mech in the middle of OmniCorp's warehouse. It chases you. It telegraphs a pounce, then lands with a slam shockwave that you jump over. It charges, then sweeps a laser that cover blocks. It climbs the long walls, crawls the ceiling and drops onto you. A turret on its back fires bursts at you. It gets more aggressive at 60 % and 30 % health, and it is stunned (taking 1.5× damage) after each slam. The warehouse has catwalks, racks, hover-pallet lifts, and respawning health, weapons, slow-mo and OVERDRIVE. |
| **Movement** | Triple jump (+2.9 m, +4.3 m, +6.1 m). Auto look-down while falling, with a landing ring under you. Hover cars bob and move, and you ride them. Air control. Coyote time and jump buffering. |
| **Stomp bounce** | Landing on a smooth head or back is a free bounce, and it refunds your air jumps. Drones and crawlers die from the bounce alone. Guards and the boss survive it: the view then snaps down onto them and fires a short volley (bounce → aim down → shoot). Spiked crawlers hurt you if you land on them, so shoot those. |
| **Hazards** | Laser walls that cycle on and off with a flicker warning: jump the short ones, time the tall ones. Falling costs 2 integrity and respawns you. |
| **Enemies** | Hover drones that telegraph, then fire slow bolts. Crawler bots that patrol their deck and ride it. Security officers in long coats with a laser-sight telegraph and a 3-round burst. Stomp any of them. |
| **Weapons** | Blaster (infinite), Spread, Pulse SMG and Rockets (splash) as pickups. Health cans. HYPER jump, OVERDRIVE and **SLOW-MO** power-ups. SLOW-MO is bullet time: enemies, bolts, the boss, lasers and movers run at 40 % speed while you don't, and the music drags like tape. |
| **Bonus stages** | Each stage hides a magenta portal. It leads to the SERVER CORE, where you destroy every server in 30 s. Inside are TIME+, HYPER and weapon power-ups, and the Jumping Flash power-up sunburst sky. |
| **Set dressing** | Satirical adverts on floating billboards, ad decks and facades, all fictional parody brands: SYNTH-COLA "now with 40% less dread", BUDGET CLONES, SPYTOAST PRO, MAYOR-BOT and others. Billboards and ad decks are also platforms. |
| **ECHO** | Your onboard AI is a small face in the corner that reacts with glowing, iris-less EVE-style eyes. At rest they are soft ovals; for anime expressions they become line shapes: ^ ^, v v, > <, \ /, O O, T T, x x, spirals, sparkles, hearts, and red "mission mode" slits. Speech-bubble quips are optional. `tools/echo-sheet.html` shows every expression. |
| **Music** | Procedural, with no audio files: breakcore, Y2K and hard techno. Every song cycles through several sections (intro, A, B, breakdown, drop). |

## Controls

| | Keyboard + mouse | Xbox / standard gamepad | Touch (optional, auto on phones) |
|---|---|---|---|
| Move | WASD | Left stick | Left thumb (a floating stick) |
| Look | Mouse (click to lock) · arrows | Right stick | Drag on the right half |
| Jump (×3 in the air) | Space · right click · X | A · LB · LT | JUMP |
| Fire (straight ahead) | Left click · J · Ctrl · Z | RT · RB | Hold FIRE (drag it to aim) |
| Swap weapon | Q / E · wheel · Tab | X / Y · D-pad ←/→ | ⇄ |
| Pause | P · Esc | Menu | II |
| Mute | M | | ♪ |

Menus work with the D-pad or stick, A and B (dr-mow's `MenuNav`). Options cover look sensitivity
per device, invert Y, auto look-down, touch on/off/auto, the arm cannon, ECHO's quips, music,
sound, and graphics (240p, 400p or smooth). You can also set graphics with `?art=retro|hd|smooth`.

## Code map

```
js/sim/        PURE game rules: no three.js, no DOM (ports translate these line by line)
  tuning.js      every number, each with the reason it has that value
  plats.js       blocks / discs / yawed hover-car boxes, movers, ray casts, push-out
  player.js      run, triple jump, auto look-down, weapons, damage, respawn
  enemies.js     drone / walker / guard / server AI, shots, bolts, stomps
  hazards.js     laser walls
  world.js       createWorld(level) · step(world, control) · events · snapshot
js/sim/boss.js  ARACHNE-9: a state machine on the inside surfaces of the warehouse (floor / walls / ceiling)
js/levels/     PURE level data built with kit.js (dr-mow's rect/disc/mv vocabulary + cars, chains, billboards, lasers)
js/render/     three.js view: retro.js (PS1 patch), sky.js (arcade sky + city skyline), level-view.js,
               models.js (cars, robots, officers, gate…), fx.js, ads.js (the satirical ad atlas), renderer.js
js/input/      keyboard/mouse (pointer lock), gamepad, touch → one control object per sim step; menu-nav.js
js/audio/      sfx-synth.js + music.js (dr-mow), songs.js (the soundtrack), audio.js (event → sound)
js/ui/         hud.js, screens.js, avatar.js (ECHO)
js/main.js     loop (fixed 1/120 s steps + interpolation), state machine, glue · window.GAME debug handle
data/          levels + tuning as JSON, golden traces (for engine ports; generated, checked in CI)
tools/         sim-check.mjs, export-levels.mjs, golden.mjs, smoke.mjs
docs/PORTING.md  how to take this to Godot or Unity
GAME_DESIGN.md   pillars, numbers, cast, art, budget, delta log
```

## Verify

```
node tools/sim-check.mjs              # every drive/exit/portal/server reachable inside the jump envelope; movement numbers; scripted play;
                                      # the boss's full move set, stomp-bounce lock-on, spikes, slow-mo, respawns
node tools/export-levels.mjs --check  # data/ matches the JS levels
node tools/golden.mjs --check         # golden traces match, and replay identically from the JSON levels
python3 -m http.server 4180 & BASE=http://localhost:4180/ node tools/smoke.mjs   # desktop, phone ×2, gamepad, bonus + clear flow, boss fight → ending
```

CI (`.github/workflows/pages.yml`) runs all of these on every push. It deploys to GitHub Pages only
from `main`.

## Lineage: what was reused

| From | Reused |
|---|---|
| **dr-mow** | The retro PS1 renderer patch (`retro.js`); the arcade sky dome with clouds, sun rays and the Jumping Flash power sunburst (`sky.js`, extended with a procedural skyline); the level vocabulary (`rect`/`disc`/`mv`); the bevelled floating-block builder (`footprintShape`/`slab`); gamepad polling and `MenuNav`; `sfx-synth.js`; the `music.js` engine (extended with multi-section songs); the fixed-step and accumulator loop; the bundled Lilita One logo font. |
| **dr-mow-godot / dr-mow-unity** | The porting architecture: pure sim, data exported as JSON, golden traces and hashes, and the determinism rules. See `docs/PORTING.md`. |
| **cosmic-calamity-assault** | Gamepad look curve and trigger hysteresis, the mouse-look spike filter after pointer lock, the neon-sign look, and weapon and enemy archetypes. |
| **mstr-gme-dsgn-tmpt** | The house rules (sim/render/UI split, clamped dt, pools, no per-projectile lights, DPR ≤ 2), `touch-zoom-guard`, the floating-stick and per-pointer hold-button patterns, the smoke-test pattern, the design-doc template, and the pitfalls list. |
