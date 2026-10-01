# Vertical Vantage: Game Design Document

**Pitch:** Jumping Flash in Ghost in the Shell's Neo-Tokyo. A small robot triple-jumps across hover
cars and billboards, looks down at its own feet to land, and shoots straight ahead at all times.
It has to grab 3 data drives and reach the exit beam.

**Classic it riffs on:** Jumping Flash! (1995) and Jumping Flash! 2 (1996). The aesthetic is Ghost in
the Shell, Blade Runner and Perfect Dark Zero, rendered like a PS1 game (as dr-mow does).

## 1. Pillars

1. **Up is the game.** Every stage is vertical: 0 to 92 m of islands. The triple jump is the verb, and
   you are always choosing which height to aim for.
2. **Look at your feet.** The camera tips down as you fall, a ring marks your landing spot, and you
   can see your legs. You can always shoot where you look, including straight down.
3. **A city made of ads.** Floating billboards and ad decks are both platforms and set dressing. The
   satire is on screen all the time (parody brands only).
4. **Arcade-short, readable, fair.** Three drives and one exit. Every hazard is telegraphed: a drone's
   eye flares, an officer shows a laser sight, a laser wall flickers before it lights.

## 2. Core loop

Land → scan for the next island (drive markers clamp to the screen edge) → triple-jump → look down →
land or stomp → shoot what shoots back → grab drive → … → 3 drives → the exit's beam turns cyan →
reach the gate → score card (time and integrity bonus) → next stage. Optional: find the portal →
a 30-second server-smash bonus round → back where you left off with full integrity if you cleared it.

## 3. Controls

The verb count is move, look, jump, fire and swap, which means a stick plus a button pad
(template doc 04). Full table in the README.

- Keyboard and mouse use pointer lock. Arrow keys also look, for keyboard-only play.
- Gamepad (Xbox standard mapping): LB and LT also jump, so you can triple-jump without taking your
  right thumb off the look stick. RT has hysteresis (fires at 0.35, releases at 0.2). There is
  rumble on hits, stomps, explosions and drives.
- Touch: a floating stick on the left 45 %, drag-to-look on the right, JUMP / FIRE / ⇄ buttons, and
  FIRE also aims while you drag it. The touch-zoom guard is on.
- Touch on AUTO: the touch controls hide while a controller is in use (any press or stick push newer
  than the last touch) and come back on the next touch, or when the controller disconnects.
- Fullscreen on START happens on Android only. iOS Safari's element fullscreen shows a "typing in
  full screen" banner on key input, including from controllers, so iOS uses the Home Screen web
  app (`apple-mobile-web-app-capable`) instead.

## 4. Numbers (from `js/sim/tuning.js`, every value has its reason there)

| Thing | Value | Why |
|---|---|---|
| Sim step | 1/120 s fixed | Deterministic, so golden traces match in ports (dr-mow). |
| Run speed | 8.5 m/s | Big leaps (16 m by the third jump's apex), but slow enough to aim while moving. |
| Gravity | 21 m/s² | Floaty: hang time to look down and line up a landing. |
| Jump launch speeds | 11, 13.5, 16 m/s | +2.9, +4.3, +6.1 m: each air jump is stronger (Jumping Flash). |
| Coyote / buffer | 0.10 s / 0.14 s | Edge-forgiving. |
| Auto look-down | to −66° once you've lost half of this jump's launch speed (mid-rise on every jump), blend 3.2/s in, 6/s out | The landing reticle is already in view at the apex. A deliberate look (> 0.06 rad) takes over until you land. |
| Landing look-ahead | `predictLanding`: 1/30 s steps for up to 5 s, following the stick (AIR_ACCEL) or drag, stopping at walls | Matches the real touchdown on 156 of 160 random jumps (sim-check). It drives the reticle, the arc dots and the ▼ readout. |
| Integrity | 8 cells; bolt −1, fall −2, laser −1 | Careless fights cost half a bar, not the run. |
| Invulnerability | 1.1 s blink | Doc 10. |
| Stomp | Free 12 m/s bounce that refunds the air jumps. Drones and walkers die (they're small); guards take 2; the boss takes 4 (× 1.5 when stunned). | Stomp chains feel great. |
| Stomp lock | If it survives: the view swings onto it at 12 rad/s for 0.8 s and auto-fires for 0.45 s | Bounce → aim down → shoot, in one move. |
| Spiker | Landing on it costs 1 cell and pops you up 9 m/s | Some enemies you must shoot, not stomp. |
| Slow-mo | 6 s; the world clock runs at 0.4×, you at 1× | Bullet time for the boss's laser and turret. |
| Pickup radius | 1.5 m (drives 1.8) | Generous (doc 14 #53). |
| Blaster | 0.15 s, 1 dmg, 75 m/s, ∞ | Always something to shoot with. |
| Spread | 5 pellets in a fixed fan, 0.42 s, 24 shots | Close-range crowd clearing. |
| Pulse SMG | 0.065 s, 160 shots | Hose drones. |
| Rockets | 0.75 s, 4 dmg + 3 splash in 4.5 m, 12 shots | Groups and servers. |
| Drone | 2 HP, 34 m range, 0.5 s eye flare, 13 m/s bolt every 1.8–2.8 s | A slow bolt you can dodge in the air. |
| Walker | 3 HP, patrol 2.2 m/s, chase 4 m/s on its own deck | A platform hazard you stomp. |
| Guard | 3 HP, 40 m, 0.85 s laser sight, 3 × 21 m/s bolts, 2.6 s cooldown | Fair, readable, dangerous. |
| Laser walls | lit ≤ 60 % of a 2.2–4.4 s cycle, 0.6 s flicker warning | Always a ≥ 1 s gap (sim-check proves it). |
| Bonus | 30 s, 12–17 servers, TIME+ adds 5 s, falling costs 3 s | Jumping Flash bonus-round pressure. |
| ARACHNE-9 | 240 HP; speed 4.5 / 5.6 / 6.6 m/s by phase (you run 8.5) | About 36 s of blaster on target; pickups and OVERDRIVE cut that hard. |
| Pounce | 0.8 / 0.65 / 0.5 s squat telegraph, a leap that leads you by 0.35 s, a 6 m shockwave (jump it) or a 2.8 m crush (2 cells), then 1.2 s stunned | Readable, punishable, then a reward window. |
| Laser | 1.0 s sight line, then a 1.8 s sweep through you (cover blocks it) | Teaches using crates and catwalks. |
| Climb | Phase 2+: up a long wall, a 3.2 s ceiling crawl toward you, a 0.6 s flare, then a drop | Up and down change everything (Jumping Flash's vertical theme, aimed at you). |
| Turret | 3 / 4 / 5-bolt bursts every 2.6–3.8 s at 19 m/s, leading you by 0.25 s | Keeps you moving between the big attacks. |
| Boss footprint | Body radius 2.2 m; pushed out of crates, racks and low lifts; it aims chases, pounces and drops at the nearest open floor; it climbs only in the wall lane x ∈ [−14, 14] | Cover stays cover; it never lands inside a crate. |

**Reachability:** `tools/sim-check.mjs` builds a graph over every walkable top and samples the movers
over 30 s. An edge exists when the gap is inside 80 % of the real jump envelope for that rise. Every
drive, the portal, the exit and every server must be reachable from the start, and the exit must be
reachable from each drive and from the portal.

## 5. Cast

- **The player:** a small white-and-blue robot.
  - **Legs:** white armour with blue guards, orange knee axles, cyan light strips, and boots with
    orange toe caps and heel jets. They are set wide and a touch behind the eye, so the middle of
    the down view stays clear. Poses:
    - a run cycle with flat feet
    - a push-off on takeoff, and a kick with the jets firing on air jumps
    - a tuck that folds back (deeper on the 2nd and 3rd jump)
    - a dangle and splay as you fall
    - a reach for the deck just before landing, then a squash
    - toes pointed during a stomp
  - **Arm cannon:** a rounded forearm running in from off-screen, with a blue plate and an orange
    band, plus a different muzzle per weapon. It sways with your look, recoils per weapon, and dips
    on a swap.
- **ECHO:** the onboard AI, a face on a little CRT plate. It has 15 expressions (idle glance, ^ ^,
  manic grin with tongue out, sparkle eyes, heart eyes, > <, angry with an anger mark, red-slit
  mission mode, half-lidded smug, shock, spirals, worried with a sweat drop, T T crying, derp, x x).
  Its chaotic, sugar-rush sidekick energy is original, with no borrowed designs. Speech bubbles are
  off by default.
- **Drone:** a white orb with a dark ring, side rotors and a red eye.
- **Walker:** an orange dome on four legs with a cyan eye-bar.
- **Guard:** a long-coated security officer with a cyan visor and a rifle.
- **Server:** a black rack with blinking LEDs.
- **Spiker:** a red-domed crawler covered in spikes. Shoot it; don't land on it.
- **ARACHNE-9:** an industrial spider mech in OmniCorp red.
  - Faceted armour plates with dark seams and rivets over a gunmetal chassis.
  - Hip actuators, a hazard band on the front plate, and a segmented rear section with glowing heat
    vents and exhaust stacks.
  - A wedge sensor head with an amber lens cluster (so it reads against the red), mandibles and the
    laser emitter.
  - Legs with armoured thighs and shins, hydraulic rams on the outside of each bend, steel knee
    joints and claw feet.
  - A red twin-barrel turret on its back.

## 6. HUD

Health cells (top left, red pulse at ≤ 2), drive slots and the objective (top centre), score and
time (top right), the altimeter with jump pips (left edge: how many air jumps remain), weapon and
ammo (bottom right). Objective markers sit on screen at the target or pin to the edge as an arrow
with the distance. The crosshair turns red over an enemy. There are a hit marker, floating score
numbers, toasts for moments, and a damage vignette. ECHO sits in the bottom-left corner (top-right
on touch). Bonus stages add a big timer and a server count.

## 7. Art direction

- **Retro:** PS1 at 240 lines (or 400p / smooth), vertex snapping, 15-bit dither, point-sampled
  canvas textures, linear distance fog in the horizon colour, and Lambert / flat shading.
- **Palette:**
  - Day: saturated blue sky with hard-edged cartoon clouds and a warm, hazy horizon.
  - Night: deep indigo with a purple light-pollution horizon, lit windows, searchlights and rain.
  - Neon: magenta, cyan, yellow and a few hot oranges.
  - Reserved colours: red = danger, green = health, gold = drives and the primary action,
    magenta = bonus.
- **City:**
  - Real towers drop into the fog.
  - A procedural skyline in the sky dome has two layers, arcology pyramids, and needle spires with
    blinking aviation lights.
  - Blade-Runner blade signs carry pseudo-kanji (procedural glyphs, so no CJK font is needed).
  - Poster ads cover the facades.
- **Ads:** 18 original parody brands painted into one atlas (`js/render/ads.js`).

## 8. Progression

Three stages, then the boss stage, unlock in order (Stage Select remembers them). Score carries
across a run. Each stage has a hidden bonus portal. localStorage stores the following (wrapped in
try/catch):

- best score per stage
- best clear time per stage (shown against par)
- best result per bonus arena
- best run
- portals found
- 12 achievements, read from the sim's events by `js/ui/achievements.js`

The RECORDS screen shows all of them.

## 9. Juice (in build order)

1. Triple-jump boings rise in pitch.
2. Air-jump puffs (gold on the third).
3. Landing dust, a camera dip and a leg squash.
4. Stomp burst, shake and bounce.
5. Hit marker and enemy hit-flash.
6. Explosions bigger than the thing that died.
7. The drive's beam and halo, and a 30-particle burst on pickup.
8. Exit-open burst and sound; the beam flips red → cyan.
9. The power sunburst sky during HYPER / OVERDRIVE, bonus stages and the clear card.
10. ECHO's reactions.
11. Rumble and haptics.

## 10. Performance budget

| | Target | Measured |
|---|---|---|
| Draw calls | ≤ 400 | ~40–120 (static geometry is merged per material, hover cars are instanced per kind, FX are instanced) |
| Render resolution | 240 lines (retro) | cheap fill on phones |
| DPR | ≤ 2 (smooth mode) | |
| Lights | hemisphere + one directional | no per-projectile lights |
| Sim | 120 Hz, ~100 platforms brute force | trivial |

## 11. Reuse plan

See the README's lineage table. New and reusable pieces worth copying back into
mstr-gme-dsgn-tmpt `kits/`:
- the multi-section song extension to `music.js`
- the yawed-box platform physics with riding (`plats.js` + `player.js`)
- the reachability prover in `sim-check.mjs`
- the satirical ad atlas painter
- the ECHO face
- golden traces with JSON replay parity

## 12. Open questions

- Should a boss cap each set of stages, as in Jumping Flash? This could be a giant hover-tank on a
  barge.
- Should there be a level editor (dr-mow's "pure `compile(design) → level`" idea)?
- Do we want shadow maps on desktop? Today it's landing rings and fog only. Quality presets exist
  now (LOW / MED / HIGH), so shadows could be HIGH-only.
- Should there be a real-device check on iPhone or iPad for pointer and gamepad focus quirks?

## Since the initial build (delta log)

### claude/wizardly-hopper-ftczx9 (first build)

- Everything above.
- Mid-build requests that were folded in:
  - the dr-mow retro look
  - dr-mow's level vocabulary and blocks for platforms
  - satirical floating billboards as platforms
  - on/off laser walls
  - breakcore, Y2K and hard-techno music with multiple loops per song
  - the reacting AI face: expressions only, with GIR-like energy but an original design

### claude/wizardly-hopper-ftczx9 (boss update)

- ECHO's eyes are now EVE-style shapes with no iris; expressions are mostly lines (^ ^, v v, > <, \ /, O O, T T).
- Stage 4, WAREHOUSE 13, with the ARACHNE-9 spider mech. It chases, pounces with a telegraph and a
  slam shockwave, sweeps a laser, climbs walls and the ceiling, and fires a back turret.
- Stomp bounces: a free bounce, then lock-on and auto-fire if the enemy survives. Small robots die
  from the bounce alone. New spiked crawlers you must shoot.
- A SLOW-MO bullet-time power-up, and respawning pickups in the boss arena.
- A new boss track, "Arachne": breakcore × hard techno with grind stabs.

### claude/red-mech-boss-and-work-items (polish pass)

- ARACHNE-9 is a red industrial mech with armour plates, hydraulic rams, an amber sensor head,
  heat vents and a red turret.
- Its body no longer passes through racks, crates or lifts. A new sim-check proves it over a
  3-minute hop-around fight (issue 3).
- HUD (issue 9):
  - stacked objective markers fan apart
  - edge arrows stay clear of the controls, the altimeter and ECHO
  - tighter landscape-phone layout; the objective wraps on narrow portrait
  - no duplicate boss-name toast
- A muzzle per weapon, plus sway, per-weapon recoil and a swap dip. New leg poses: deeper tucks,
  dangle, a landing reach, the stomp pose and a landing squash (issue 4).
- New options (issues 5, 6, 10):
  - field of view
  - shake/bob/sway off
  - reduced flashes
  - tap-on/off FIRE
  - music and sound volume sliders
  - quality presets
  - a limiter on the mix
  - shape-coded markers and an X crosshair on targets
- Best times, bonus bests, 12 achievements and a RECORDS screen (issue 11).

### claude/wizardly-hopper-ftczx9 (landing readability pass)

- The auto look-down starts mid-rise on every jump (AUTO_RISE 0.5 of the launch speed) and blends
  in faster.
- New where-am-I and where-will-I-land aids:
  - a soft shadow straight under you
  - a landing reticle at the predicted touchdown, with a ring closing on it
  - arc dots along the predicted path
  - a ▼ drop readout under the crosshair
  - NO GROUND warnings: gold while you have air jumps, red when you're out
- Jump and fall feel:
  - takeoff FOV punch and dip; a roll wobble on the third jump
  - fall-speed FOV and wind streaks
  - heel jets on air jumps
  - push-off, kick, tuck, dangle and reach poses
  - a soft ring on hard landings
  - all camera effects scale with the comfort option
- Player art: new legs (tapered thighs, guards, boots, jets) and a rounded forearm cannon.
