// TUNING: every gameplay number in one table, each with the reason it has that value.
// Pure data (no three.js, no DOM). Ports copy this table verbatim (docs/PORTING.md).
//
// Units: metres, seconds, radians. +Y up. Yaw 0 looks down -Z (three.js / Godot camera convention).

export const T = {
  // ---- clock
  DT: 1 / 120, // fixed sim step. Deterministic, so golden traces match bit for bit in ports (dr-mow lesson).
  MAX_STEPS: 12, // per rendered frame. A 10 fps hitch runs 0.1 s of sim, not a spiral of death.

  // ---- the body (a vertical cylinder; feet at y)
  RADIUS: 0.45, // narrow enough to land on a 2.2 m-wide hover car with room to spare.
  HEIGHT: 1.7, // head-bump height. The robot is squat like Robbit.
  EYE: 1.55, // camera height above the feet: low enough that the legs show when you look down.
  STEP_UP: 0.4, // kerbs and car bumpers lift you instead of stopping you.

  // ---- running
  RUN: 8.5, // m/s. Fast enough for big leaps (16 m by the third jump's apex), slow enough to aim while moving.
  GROUND_ACCEL: 70, // reaches full speed in ~0.12 s: responsive, never twitchy.
  GROUND_FRICTION: 60, // stops in ~0.14 s, so landings on small cars stick.
  AIR_ACCEL: 30, // Jumping Flash lets you steer hard in the air: platforming is mostly mid-air.
  AIR_DRAG: 1.2, // a little horizontal bleed in the air when not steering (no endless drift).

  // ---- jumping (Jumping Flash triple jump: each air jump is stronger than the last)
  GRAVITY: 21, // m/s². Floatier than Earth: big hang time to look down and line up a landing.
  FALL_MAX: 30, // terminal speed: falls stay readable and the landing marker keeps up.
  JUMP_V: [11, 13.5, 16], // launch speed per jump stage → +2.9 m, +4.3 m, +6.1 m (≈13.3 m chained at apexes).
  COYOTE: 0.1, // a ground jump still counts this long after running off an edge.
  JUMP_BUFFER: 0.14, // a press this early before landing still jumps on touchdown.
  HYPER_K: 1.22, // HYPER power-up: launch speeds × this (≈ +49 % height).

  // ---- looking (pitch < 0 = down)
  PITCH_MIN: -1.5, // nearly straight down: the signature "look at your feet" Jumping Flash view.
  PITCH_MAX: 1.2,
  AUTO_PITCH: -1.15, // ~66° down: where the camera tips while you fall, so the landing ring is in view.
  AUTO_IN: 2.4, // blend rate into the auto look-down after the apex (reaches ~90 % in ~1 s).
  AUTO_OUT: 6, // blend rate back to your own pitch after landing (fast: you want to aim again).
  AUTO_VY: 2.5, // start tipping once vertical speed drops below this (just before the apex).

  // ---- health
  HP_MAX: 8, // cells. Enemy bolts cost 1, so a careless fight costs half a bar, not the run.
  INVULN: 1.1, // seconds of blink after a hit (doc 10: 1.1–1.5 s).
  FALL_DAMAGE: 2, // falling off the world costs two cells and puts you back on the last safe ground.
  KNOCKBACK: 7, // m/s shove away from whatever hit you (contact damage only).

  // ---- stomping (land on an enemy: Jumping Flash's first verb). Damage per kind is ENEMIES[k].stomp.
  STOMP_BOUNCE: 12, // a free bounce off any smooth head or back…
  STOMP_REFUND: true, // …and the air jumps come back, so stomp chains feel great.
  STOMP_AIM: 0.8, // if it survived (or it's the boss), the view snaps down onto it for this long…
  STOMP_AIM_RATE: 12, // …turning this fast (rad/s)…
  STOMP_SHOOT: 0.45, // …and the gun fires on its own: bounce → aim down → shoot.
  SPIKE_DMG: 1, // landing on a spiked crawler hurts (shoot those),
  SPIKE_BOUNCE: 9, // and pops you back up off it.

  // ---- slow-mo (bullet time: everything but you runs slow)
  SLOW_TIME: 6, // seconds of your time.
  SLOW_K: 0.4, // the world's clock rate while it lasts: enemies, bolts, the boss, movers, lasers.

  // ---- pickups and objectives
  PICKUP_R: 1.5, // generous (doc 14 #53): a pickup you brushed should count.
  DRIVES: 3, // hard drives to collect before the exit opens.
  EXIT_R: 2.4, // walk into the open gate.
  PORTAL_R: 1.9, // the bonus-stage portal.
  HEAL_SMALL: 3,
  POWER_TIME: 10, // HYPER and OVERDRIVE last this long; a second pickup of the same kind extends (doc 14 #44).
  TIME_BONUS: 5, // seconds a TIME+ pickup adds in a bonus stage.

  // ---- bonus stage (Jumping Flash's timed bonus rounds)
  BONUS_TIME: 30, // destroy every server before this runs out.
  BONUS_FALL_PENALTY: 3, // seconds lost (instead of health) for falling off a bonus arena.

  // ---- scoring
  SCORE: { drone: 100, walker: 150, spiker: 250, guard: 200, server: 250, boss: 10000, drive: 1000, stompMul: 2, bonusClear: 5000, perSecondLeft: 100, timePar: 10 },
};

// Weapons: fire straight down the view line, always (the crosshair is the muzzle).
// rate = seconds between shots; ammo = rounds a pickup gives (blaster is infinite).
export const WEAPONS = {
  blaster: { name: 'BLASTER', rate: 0.15, dmg: 1, speed: 75, life: 1.1, pellets: 1, spread: 0, ammo: Infinity, r: 0.18 },
  spread: { name: 'SPREAD', rate: 0.42, dmg: 1, speed: 68, life: 0.75, pellets: 5, spread: 0.085, ammo: 24, r: 0.2 },
  rapid: { name: 'PULSE SMG', rate: 0.065, dmg: 1, speed: 88, life: 0.95, pellets: 1, spread: 0.018, ammo: 160, r: 0.15 },
  rocket: { name: 'ROCKETS', rate: 0.75, dmg: 4, speed: 34, life: 2.6, pellets: 1, spread: 0, ammo: 12, r: 0.3, splash: 4.5, splashDmg: 3 },
};
export const WEAPON_ORDER = ['blaster', 'spread', 'rapid', 'rocket'];
export const OVERDRIVE_RATE = 0.5; // OVERDRIVE: fire interval × this.

// Enemies. r = hit radius; top = height of the stompable top above the feet; stomp = damage a
// stomp deals (small robots die from the bounce alone); spiked = landing on it hurts you instead.
export const ENEMIES = {
  // Small hover robot: bobs at its post, telegraphs (eye flare) then lobs a slow bolt you can dodge.
  drone: { hp: 2, r: 0.75, top: 0.5, range: 34, fireMin: 1.8, fireMax: 2.8, tele: 0.5, bolt: 13, leash: 5, chase: 2.2, stomp: 99 },
  // Little crawler robot: patrols its platform, scuttles at you if you land on it. Contact damage.
  walker: { hp: 3, r: 0.85, top: 1.0, range: 14, patrol: 2.2, run: 4.0, stomp: 99 },
  // Its spiked cousin: same crawl, but its back is all spikes. Don't land on it, shoot it.
  spiker: { hp: 4, r: 0.85, top: 1.1, range: 14, patrol: 1.8, run: 3.4, stomp: 0, spiked: true },
  // Security officer in a long coat: laser-sight telegraph, then a 3-round burst. A stomp staggers him (2).
  guard: { hp: 3, r: 0.55, top: 1.85, range: 40, aim: 0.85, burst: 3, gap: 0.13, bolt: 21, cool: 2.6, stomp: 2 },
  // Bonus-stage target: a server rack. Doesn't fight back.
  server: { hp: 2, r: 0.9, top: 2.2, stomp: 2 },
  // ARACHNE-9 (numbers in BOSS). Its back is armoured but smooth: bounce off it, then shoot down.
  boss: { hp: 240, r: 2.4, top: 3.0, stomp: 4 },
};

// The warehouse boss (js/sim/boss.js). Phases by health: 1 > 60 %, 2 > 30 %, 3 below.
export const BOSS = {
  hp: 240, r: 2.4, top: 3.0, // ~36 s of blaster on target; weapons and OVERDRIVE cut that hard.
  bodyH: 1.8, margin: 3.5, // body centre above its surface; how close to the walls it walks.
  speed: [4.5, 5.6, 6.6], // m/s by phase: you outrun it (8.5) but not by much.
  crouch: [0.8, 0.65, 0.5], // pounce telegraph by phase (it squats and its eyes flare).
  slamR: 6, crushR: 2.8, recover: 1.2, // landing shockwave (jump it), direct hit, then a stunned window (×1.5 damage).
  charge: 1.0, laserTime: 1.8, sweep: 0.55, sweepRate: 0.62, beamLen: 70, // laser: sight line, then a sweep across you; cover blocks it.
  ceilTime: 3.2, dropTele: 0.6, // crawls the ceiling toward you, then flares and drops.
  turretEvery: [2.6, 3.8], turretBurst: [3, 4, 5], turretGap: 0.16, turretSpeed: 19, // the back turret's bursts.
  dyingTime: 2.2,
};
export const ENEMY_BOLT = { r: 0.28, dmg: 1, life: 4 };
