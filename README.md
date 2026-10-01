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
| **Stages** | **8 level packs**, each 3 stages and a boss stage around one theme, played in order (for testing, every stage is unlocked right now: `TESTING_UNLOCK_ALL` in `js/main.js`). **NEO-TOKYO**: HARBOR 9 (future docks by day), SKYWAY (rooftops, a shuttle-bus lane, an arcology), NEON RAIN (night traffic lanes and a 92 m megatower), WAREHOUSE 13 (ARACHNE-9). **OCEAN CORE**: a floating data haven and desalination plant in the open sea: INTAKE, COLD AISLE, STORM SURGE, BRINE POOL (KRAKEN-OS). **NEO CHICAGO**: THE LOOP, LAKESHORE, SKYDECK, BULL PEN (TAURUS-312). **NEW SAN FRANCISCO**: hills, fog and the Golden Gate in the sky: GOLDEN GATE (a playable bridge), STEEP STREETS, TWIN PEAKS, FAULT LINE (TREMOR). **SEATTLE**: hazy, overcast and drizzly, with Rainier in the haze: NEEDLE, PIKE PLACE, RAINIER RAIN, ABOVE THE NEEDLE (STORMCROW). **SHANGHAI**: THE BUND, PUDONG HEIGHTS, LANTERN NIGHT, PEARL TOWER (JADE DRAGON). **NEO EURO**: PISA (climb the Leaning Tower), AMALFI, VENEZIA, COLOSSEUM (CENTURION). **AIR FORTRESS**: on and around a gigantic bomber helicarrier: FLIGHT DECK, HULL BREACH, BOMB BAY, COMMAND BRIDGE (DREADNOUGHT). |
| **Goal** | Collect 3 hard drives. The exit (a neon torii gate with a beam you can see from anywhere) goes from red to cyan. Walk in to finish. On a boss stage, the exit opens when the boss dies. Clearing a pack's boss leads on to the next pack. |
| **Boss** | **ARACHNE-9** is a red industrial spider mech in the middle of OmniCorp's warehouse: armour plates over a gunmetal chassis, hydraulic rams on every leg, an amber sensor head with mandibles, and a heat-vented rear section. It is wired like it runs on raw power: a Tesla coil on its back, capacitor banks, porcelain insulators, copper windings, cyan circuit traces, and live arcs crackling between them (a storm of them when it's about to strike). It chases you, working round crates and racks rather than through them. It telegraphs a pounce, then lands with a slam shockwave that you jump over. It charges, then sweeps a laser that cover blocks. It climbs the long walls, crawls the ceiling and drops onto you. A turret on its back fires bursts at you. It gets more aggressive at 60 % and 30 % health, and it is stunned (taking 1.5× damage) after each slam. The warehouse has catwalks, racks, hover-pallet lifts, and respawning health, weapons, slow-mo and OVERDRIVE. |
| **Pack bosses** | **KRAKEN-OS** surfaces at the rim of a brine pool, slams tentacles on red rings, sweeps an eye laser and dives to move; stomp its dome. **TAURUS-312** is a bull mech: it paws, paints a lane and charges, so put a pylon behind you and sidestep, then stomp its back while it's stunned. **TREMOR** is a drilling mole mech that burrows under you (a ring fills first), spins up shockwaves and cracks the ground. **STORMCROW** is a bird drone circling the Space Needle in a thunderstorm: it dives along a red sight line, calls lightning and perches to rest. **JADE DRAGON** is a serpentine mech flying round the Pearl Tower: its armoured body follows its head, it breathes fire sweeps and dives onto your deck, and its head is the weak point. **CENTURION** is a gladiator mech with a tower shield that blocks frontal shots: flank it, shoot over the rim, or stomp the helmet. **DREADNOUGHT** is the fortress's command core: kill its flak pods to open its armour, then dodge laser sweeps, missile salvos and bombing runs. Every boss telegraphs its attacks and has punish windows. |
| **Movement** | Triple jump (+2.9 m, +4.3 m, +6.1 m). The auto look-down starts mid-rise on every jump. Hover cars bob and move, and you ride them. Air control. Coyote time and jump buffering. The camera punches out a little on each jump (a roll wobble on the third) and widens as a fall speeds up, with wind streaks. Your heel jets fire on air jumps. |
| **Where am I, where will I land** | A soft shadow sits straight under you. A landing reticle sits where your current arc will come down (the look-ahead follows your stick and stops at walls), and a ring closes on it as touchdown nears. Dots trace the arc. Under the crosshair, **▼ 8.2 m** shows how far down the landing is: gold over a long drop. **NO GROUND · JUMP!** appears when the arc ends in the void and you still have air jumps; **⚠ NO GROUND**, with a red ring, when you don't. |
| **Stomp bounce** | Landing on a smooth head or back is a free bounce, and it refunds your air jumps. Drones and crawlers die from the bounce alone. Guards and the boss survive it: the view then snaps down onto them and fires a short volley (bounce → aim down → shoot). Spiked crawlers hurt you if you land on them, so shoot those. |
| **Hazards** | Laser walls that cycle on and off with a flicker warning: jump the short ones, time the tall ones. Falling costs 2 integrity and respawns you. |
| **Enemies** | Hover drones that telegraph, then fire slow bolts. Crawler bots that patrol their deck and ride it. Security officers in long coats with a laser-sight telegraph and a 3-round burst. Stomp any of them. |
| **Weapons** | Blaster (infinite), Spread, Pulse SMG and Rockets (splash) as pickups. The arm cannon is an iris of four armour petals round a glowing core. The petals open to a different spread per weapon. On a swap they close, the core changes colour and they open again, and each shot kicks them open. Each weapon has its own business end in the chamber: a lens, three nozzles, a spinning barrel cluster, or a warhead. Heat fins glow after sustained fire, and a little screen on the forearm shows your ammo. Health cans. HYPER jump, OVERDRIVE and **SLOW-MO** power-ups. SLOW-MO is bullet time: enemies, bolts, the boss, lasers and movers run at 40 % speed while you don't, and the music drags like tape. |
| **Bonus stages** | Each stage hides a magenta portal. It leads to the SERVER CORE, where you destroy every server in 30 s. Inside are TIME+, HYPER and weapon power-ups, and the Jumping Flash power-up sunburst sky. |
| **Set dressing** | Satirical adverts on floating billboards, ad decks and facades, all fictional parody brands: SYNTH-COLA "now with 40% less dread", BUDGET CLONES, SPYTOAST PRO, MAYOR-BOT and others. Billboards and ad decks are also platforms. |
| **ECHO** | Your onboard AI is a small face in the corner that reacts with glowing, iris-less EVE-style eyes. At rest they are soft ovals; for anime expressions they become line shapes: ^ ^, v v, > <, \ /, O O, T T, x x, spirals, sparkles, hearts, and red "mission mode" slits. Speech-bubble quips are optional. `tools/echo-sheet.html` shows every expression. |
| **Music** | Procedural, with no audio files: breakcore, Y2K and hard techno. Every song cycles through several sections (intro, A, B, breakdown, drop). A limiter sits last in the mix. |
| **Records** | Best score and best clear time per stage (against par), best result per bonus arena, and 13 achievements, all on the title's RECORDS screen. Examples: CLOUD WALKER (5 stomps without landing), UNTOUCHED, PACIFIST PROTOCOL, BOOT TO THE HEAD (stomp a boss five times in one fight), BOSS RUSH (beat every pack's boss). |

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

On a phone or tablet, the touch controls step aside while a controller is in use, and the HUD
switches to the controller layout. Touch the screen and they come back. Android goes fullscreen when
you press START. iPhone and iPad don't, because Safari keeps showing "it looks like you're typing in
full screen" in element fullscreen whenever it gets key input (a keyboard, or a paired controller).
Add the game to the Home Screen for a true fullscreen app there.

Menus work with the D-pad or stick, A and B (dr-mow's `MenuNav`). The Options screen is grouped:

- **Controls:** look sensitivity per device, invert Y, auto look-down, FIRE as HOLD or TAP ON/OFF
  (for the touch button and the trigger), and touch controls on/off/auto.
- **View and comfort:** field of view (80–110°); screen shake, head bob and gun sway on or off
  (off also stops the HUD's pulsing); flashes FULL or REDUCED (hurt vignette, muzzle flash, power
  sunburst, beam strobe); the arm cannon; ECHO's quips.
- **Audio:** music and sound volume.
- **Graphics:** quality AUTO/LOW/MED/HIGH (particles, rain, sky searchlights, pixel-ratio cap) and
  resolution (240p, 400p or smooth). You can also set resolution with `?art=retro|hd|smooth`.

The HUD doesn't rely on colour alone. Objective markers differ by shape (drive = diamond,
exit = ring, bonus = star), and the crosshair turns into an X on a target.

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
js/sim/bosses/ the boss registry (index.js: kind → module), the toolkit every boss builds on (common.js), one file per boss
js/sim/predict.js  predictLanding(): the pure landing look-ahead the HUD and reticle use (ports reuse it)
js/levels/     PURE level data built with kit.js (dr-mow's rect/disc/mv vocabulary + cars, chains, billboards, lasers,
               link(), orbit movers); packs/: one file per level pack (3 stages + a boss stage), index.js lists them in order
js/render/     three.js view: retro.js (PS1 patch), sky.js (arcade sky + city skyline), level-view.js,
               models.js (cars, robots, officers, gate…), fx.js, ads.js (the satirical ad atlas), renderer.js
               backdrops.js (distant landmarks), bosses.js (boss views by kind); packs/: each pack's themes, platform styles,
               backdrops and boss views
js/input/      keyboard/mouse (pointer lock), gamepad, touch → one control object per sim step; menu-nav.js
js/audio/      sfx-synth.js + music.js (dr-mow), songs.js (the soundtrack), audio.js (event → sound); packs/: each pack's songs
js/ui/         hud.js, screens.js, avatar.js (ECHO), achievements.js (records from the event stream)
js/main.js     loop (fixed 1/120 s steps + interpolation), state machine, glue · window.GAME debug handle
data/          levels + tuning as JSON, golden traces (for engine ports; generated, checked in CI)
tools/         sim-check.mjs, export-levels.mjs, golden.mjs, smoke.mjs; checks/: each boss's own sim-checks
docs/PACK_GUIDE.md  how to build a level pack (files, rules, kit, render module, boss toolkit, checks)
docs/PORTING.md  how to take this to Godot or Unity
GAME_DESIGN.md   pillars, numbers, cast, art, budget, delta log
```

## Verify

```
node tools/sim-check.mjs              # every drive/exit/portal/server reachable inside the jump envelope; movement numbers; scripted play;
                                      # the look-down starts mid-rise; the landing look-ahead matches 160 random jumps;
                                      # the boss's full move set (and it never walks through racks or crates), stomp-bounce lock-on,
                                      # spikes, slow-mo, respawns
node tools/export-levels.mjs --check  # data/ matches the JS levels
node tools/golden.mjs --check         # golden traces match, and replay identically from the JSON levels
python3 -m http.server 4180 & BASE=http://localhost:4180/ node tools/smoke.mjs   # desktop, phone ×2, gamepad, bonus + clear flow + records, boss fight → ending
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
