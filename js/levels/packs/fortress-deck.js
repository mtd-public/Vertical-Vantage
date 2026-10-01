// AIR FORTRESS · stage 1 — FLIGHT DECK. The carrier's runway, 12 km up, at sunrise: run the deck from
// the stern to the bow and climb the control island. Parked VTOLs and deck tugs are stepping stones,
// two giant lift-fan rings sit in the deck (run their rims, cross their grilles), the deck elevators
// ride up and down, the catapult shuttles race along the bow, and deck cannons cover all of it.
//
// Map (north = −Z, up the page; deck top y = 0):
//
//              [bow tip · DRIVE 3 behind the catapult curtains]   (z −196)
//          ═══ catapult shuttles (DRIVE 1 rides one) ═══  [deck cannon]
//     [lift fan 2]        [VTOL]                                   (z −126)
//   [cannon]    [VTOLs]        [CONTROL ISLAND: tiers 10 / 17 / 24 m, EXIT on top, DRIVE 2 on its mast]
//   ◄elevator 1 ↕ to the hangar gallery (−14 m, PORTAL)            ↕ elevator 2 (deck ↔ tier 1)
//     [lift fan 1]                 [VTOLs]   [deck cannon]
//   ═══ arresting wires (low laser curtains) ═══
//                       START (stern, z +36)
import { rect, box, mv, laser } from '../kit.js';
import { vtol, ring, tug, ammo, VTOL } from './fortress-kit.js';

// deck marking flags (tint): the style draws these on each deck piece
const RUN = 1, WIRES = 2, SPOTS = 4, CAT = 8, EW = 16, EE = 32, EN = 64, ES = 128;
const D = { thick: 6, style: 'fortress-runway' };
const deck = (x0, x1, z0, z1, tint) => box(x0, x1, z0, z1, 0, { ...D, tint });

const plats = [];
const P = (...a) => plats.push(...a);

// ---- the flight deck (top 0): pieces round the two lift-fan wells, the stern to the bow
P(deck(-26, 26, 6, 44, WIRES | RUN | EW | EE | ES)); // stern: arresting wires, the touchdown zone
P(deck(-26, -20, -24, 6, EW), deck(-20, 0, -4, 6, 0), deck(0, 26, -24, 6, RUN | EE));
P(box(-20, 0, -24, -4, 0, { thick: 6, style: 'fortress-fanwell' })); // lift fan 1 (−10, −14)
P(deck(-26, 26, -64, -24, RUN | SPOTS | EW | EE));
P(deck(-26, 26, -104, -64, RUN | EW | EE));
P(deck(-26, -22, -150, -104, EW), deck(-22, -2, -116, -104, 0), deck(-22, -2, -150, -136, 0), deck(-2, 26, -150, -104, RUN | EE));
P(box(-22, -2, -136, -116, 0, { thick: 6, style: 'fortress-fanwell' })); // lift fan 2 (−12, −126)
P(deck(-22, 22, -178, -150, CAT | EW | EE), deck(-12, 12, -196, -178, CAT | EW | EE | EN)); // the bow
// the hull under the deck (the flight deck overhangs it by 8 m each side)
P(box(-18, 18, -188, 40, -6, { thick: 44, style: 'fortress-hullside' }));

// ---- the lift-fan rims: a ring you hop onto and run round (the grille inside is walkable too)
P(...ring(-10, -14, 8.6, 12, 1.0), ...ring(-12, -126, 8.6, 12, 1.0));

// ---- port: deck-edge elevator 1, down to the hangar gallery under the deck (−14) and back
P(rect(-33, -44, 14, 14, -7, { thick: 1.2, style: 'fortress-elevator', move: mv('y', 7, 12, 0.25) })); // top −14 … 0
const GAL = -14;
P(box(-40, -19, -76, -51.5, GAL, { thick: 1, style: 'fortress-catwalk', tint: 2 })); // north gallery
P(box(-40, -19, -36.5, -12, GAL, { thick: 1, style: 'fortress-catwalk', tint: 2 })); // south gallery
P(box(-25.5, -19, -51.5, -36.5, GAL, { thick: 1, style: 'fortress-catwalk', tint: 2 })); // inboard of the shaft
// sponson ladder back up at the gallery's south end
P(rect(-33, -8, 5, 4, -10.5, { thick: 1, style: 'fortress-gantry' }), rect(-33, -2, 5, 4, -7, { thick: 1, style: 'fortress-gantry' }), rect(-29, 4, 5, 4, -3.5, { thick: 1, style: 'fortress-gantry' }));

// ---- deck cannons on their sponsons (turrets)
const gun = (x, z) => rect(x, z, 7, 7, 1.2, { thick: 5, style: 'fortress-gunmount' });
P(gun(29.5, -14), gun(-29.5, -100), gun(25.5, -160));

// ---- parked VTOLs (wings 2.4, fuselage 3.2) and deck tugs
P(...vtol(19, -34, 2.3, 0), ...vtol(19, -53, 2.3, 1), ...vtol(-14, -80, -2.3, 2), ...vtol(-15, -97, -2.2, 0));
P(...vtol(15, -124, 2.5, 1), ...vtol(-14, -164, 0.35, 2));
P(tug(10, -30, 0.4), tug(-17, -60, 1.2), tug(4, -112, -0.3), tug(-4, -142, 0.9));
// munitions crates by the island: a stair to tier 1 (2.6 · 5.2 · 7.8)
P(...ammo(8.5, -103, 0, 1, { tint: 0 }), ...ammo(11.8, -103, 0, 2, { tint: 1 }), ...ammo(15, -103.2, 0, 3, { tint: 2 }));
P(...ammo(-20, 2, 0, 1, { tint: 3 }), ...ammo(-22.4, -1, 0, 2, { tint: 1 }), ...ammo(18, -66, 0, 1, { tint: 2, w: 5.2 }));

// ---- the CONTROL ISLAND (starboard, 8 m outboard): tier 1 10 m, tier 2 (the bridge) 17 m, PRI-FLY 24 m
P(box(16, 34, -100, -70, 10, { thick: 16, style: 'fortress-island', tint: 0 }));
P(box(19, 31, -96, -76, 17, { thick: 7, style: 'fortress-island', tint: 1 }));
P(box(21, 31, -92, -82, 24, { thick: 7, style: 'fortress-island', tint: 2 }));
// elevator 2: the deck ↔ tier 1, on the island's west face
P(rect(12.5, -85, 7, 7, 5.25, { thick: 1, style: 'fortress-elevator', tint: 1, move: mv('y', 5, 10, 0) })); // top 0.25 … 10.25
// tier 1 → tier 2: crates on the south ledge; tier 2 → PRI-FLY: an antenna block on the west ledge
P(...ammo(22, -73, 10, 1, { tint: 3 }), ...ammo(25, -73, 10, 2, { tint: 0 }));
P(rect(20, -88, 2, 4, 20.5, { thick: 3.5, style: 'fortress-gantry' }));
// the radar platform and the mast perch (DRIVE 2)
P(rect(29.5, -84, 3, 3, 28, { thick: 4, style: 'fortress-mast', tint: 0 }), rect(29.5, -90.5, 2.6, 2.6, 33, { thick: 9, style: 'fortress-mast', tint: 1 }));

// ---- the bow: blast deflectors behind the catapults, the shuttles racing along the tracks
P(rect(4, -137, 7, 1.6, 2.6, { thick: 2.6, style: 'fortress-jbd' }), rect(14, -137, 7, 1.6, 2.6, { thick: 2.6, style: 'fortress-jbd' }));
P(rect(4, -165, 2.4, 3.6, 0.6, { thick: 0.55, style: 'fortress-shuttle', move: mv('z', 21, 12, 0) })); // z −186 … −144
P(rect(14, -160, 2.4, 3.6, 0.6, { thick: 0.55, style: 'fortress-shuttle', move: mv('z', 14, 9, 0.5) })); // z −174 … −146
// a crew-station sponson on the port bow
P(rect(-25.5, -168, 7, 8, -1.2, { thick: 1, style: 'fortress-gantry' }));

const lasers = [
  laser(0, 0, 20, 40, 1.2, 0, 2.8, 0.5, 0), // electrified arresting wires: hop them (or round the ends)
  laser(0, 0, 12, 40, 1.2, 0, 2.8, 0.5, 0.5),
  laser(25, 17, -79, 12, 2.6, 0, 3.4, 0.5, 0), // the bridge roof, in front of the stair to PRI-FLY
  laser(0, 0, -180, 24, 2.6, 0, 3.2, 0.5, 0), // the bow tip: two catapult curtains out of step
  laser(0, 0, -186, 24, 2.6, 0, 3.2, 0.5, 0.5),
];

export default {
  id: 'fortress-deck', name: 'FLIGHT DECK', sub: 'AIR FORTRESS · 12 000 M · 06:40 · CLEAR', theme: 'fortressDay', song: 'finalAscent',
  seed: 7001, par: 280, killY: -24, cloudY: -150,
  start: { x: 0, y: 0, z: 36, yaw: 0 },
  plats, lasers,
  drives: [
    { x: 4, y: 1.7, z: -165 }, // riding catapult shuttle 1
    { x: 29.5, y: 34.1, z: -90.5 }, // the top of the island's mast
    { x: -6, y: 1.1, z: -191 }, // the bow tip, behind the catapult curtains
  ],
  exit: { x: 26, y: 24, z: -87, yaw: Math.PI / 2 }, // on PRI-FLY, facing the deck
  portal: { x: -33, y: GAL + 1.4, z: -70 }, // the hangar gallery under the port deck edge
  bonusStyle: { theme: 'fortressBonus', music: 'serverRush', weapon: 'rapid', tag: 'Ω-1' },
  enemies: [
    { type: 'turret', x: 29.5, y: 1.2, z: -14 },
    { type: 'turret', x: -29.5, y: 1.2, z: -100 },
    { type: 'turret', x: 25.5, y: 1.2, z: -160 },
    { type: 'turret', x: 26, y: 17, z: -94 }, // on the bridge roof, covering the climb
    { type: 'guard', x: 8, y: 0, z: -44 },
    { type: 'guard', x: 24, y: 10, z: -98 },
    { type: 'guard', x: -6, y: 0, z: -158 },
    { type: 'walker', x: 12, y: 0, z: 28 }, // patrolling the touchdown zone
    { type: 'walker', x: -25.5, y: -1.2, z: -168 }, // on the bow crew sponson
    { type: 'spiker', x: -30, y: GAL, z: -24 },
    { type: 'drone', x: -10, y: 6, z: -14 },
    { type: 'drone', x: 14, y: 30, z: -86 },
    { type: 'drone', x: 2, y: 7, z: -172 },
    { type: 'drone', x: -12, y: 7, z: -126 },
  ],
  pickups: [
    { type: 'health', x: -4, y: 1, z: 0 },
    { type: 'spread', x: -10, y: 1, z: -14 }, // the middle of lift fan 1's grille
    { type: 'rapid', x: 19, y: VTOL.body + 1, z: -53 },
    { type: 'rocket', x: -8, y: 1, z: -154 },
    { type: 'healthBig', x: -36, y: GAL + 1, z: -62 },
    { type: 'health', x: 32, y: 11, z: -74 },
    { type: 'slowmo', x: 12, y: 1, z: -146 },
  ],
  backdrops: [
    { kind: 'fortress-wing', x: -32, y: -64, z: -70, side: -1 }, // the carrier's own wings, far below the deck edges
    { kind: 'fortress-wing', x: 32, y: -64, z: -70, side: 1 },
    { kind: 'fortress-fan', x: -10, y: -0.9, z: -14, r: 7.7 }, // the lift fans turning under their grilles
    { kind: 'fortress-fan', x: -12, y: -0.9, z: -126, r: 7.7 },
    { kind: 'fortress-radar', x: 29.5, y: 36.5, z: -90.5, s: 1 },
    { kind: 'fortress-carrier', x: -560, y: -40, z: -420, yaw: 0.5, s: 1.3, haze: 0.55 }, // a sister ship
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: 46, z: -70, r: 210, period: 70, phase: 0 }, // escorts circling the deck
    { kind: 'fortress-gunship', haze: 0.15, x: 0, y: 24, z: -70, r: 280, period: 95, phase: 0.45, dir: -1 },
    { kind: 'fortress-escorts', x: 420, y: 110, z: -480, yaw: -0.7, s: 1.2 },
    { kind: 'fortress-cumulus', x: 700, y: -170, z: 120, s: 1.4 }, // towering cloud far off
    { kind: 'fortress-cumulus', x: -650, y: -170, z: -650, s: 1.8 },
    { kind: 'fortress-cumulus', x: 200, y: -170, z: 800, s: 1.1 },
  ],
};
