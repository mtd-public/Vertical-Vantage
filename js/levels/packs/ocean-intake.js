// OCEAN CORE · Stage 1 — INTAKE. Desalination Plant 7 at sunrise: the on-ramp of the pack. Hop
// pontoons and buoys onto the plant, run the membrane-hall roofs, ride the work boat, climb the
// tanks, run the intake pipe and spiral up the intake tower to the exit on its lantern roof.
//
// Map (north = -Z, up the page):
//
//                           [INTAKE TOWER: gallery 41 m, EXIT on the lantern roof 45.5 m]
//                                ↑ service landings spiral up from the tower base (7.2 m)
//            [T2 brine tank 21 m: DRIVE 1]      ↑ intake pipe (7.25 m)
//      [T1 fresh tank 12 m]  [T3 tank 8 m]→pipe  [pump]     [H2 membrane hall 12.6 m: DRIVE 3 between lasers]
//         ↑ valve pads     [C plant deck 3.2 m + H1 hall roof 9.6 m] ══catwalk══↗
//   (weather buoy:          [quay 3.2 m]   ~~~ work boat lane: DRIVE 2 ~~~
//      PORTAL) ← buoys      pontoons
//                        [START landing stage 2.2 m]
import { rect, disc, chain, link, mv, bob, laser, stack } from '../kit.js';
import { deck, buoy, pontoon, tank, block, pipe, walk, valve, landings, buoyField, makeBuoy, makeValve, away } from './ocean-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);

// ---- the start: a landing stage, pontoons across to the quay, and a pipe run along the east side
const S0 = deck(-9, 9, -5, 14, 2.2, { thick: 3.2 });
P(S0);
P(pontoon(-1, -10.5, 5, 4, 1.4, 0.15), pontoon(1.5, -16.5, 5, 4, 1.7, -0.1));
P(pipe(13, 3, 13, -27, 4.2)); // the outfall pipe: no jumping needed, but it's the long way round

// ---- the quay: pump houses and a container of membrane cartridges
const QUAY = 3.2;
P(deck(-24, 24, -40, -22, QUAY));
P(block(-16, -30, 6, 5, 6.6, QUAY, 'oc-pump'), block(17, -34, 5, 6, 6.2, QUAY, 'oc-pump', { tint: 1 }));
P(...stack(-4, -36, QUAY, 1, { yaw: Math.PI / 2, tint: 1 }), ...stack(5, -25, QUAY, 1, { yaw: Math.PI / 2, tint: 2 }));
// quay → plant deck: a catwalk over the gap (a laser sweeps it)
P(walk(0, -39, 0, -47, QUAY - 0.05, 3));

// ---- C: the plant deck and the long reverse-osmosis hall H1 on it (roof 9.6 m)
const C = deck(-13, 13, -106, -46, QUAY);
const H1 = block(0, -76, 13, 40, 9.6, QUAY, 'oc-hall');
P(C, H1);
P(block(-9.5, -58, 4, 4, 6.4, QUAY, 'oc-skid'), block(9.5, -92, 4, 4, 6.4, QUAY, 'oc-skid', { tint: 1 })); // skids: steps onto the roof
P(block(0, -101, 6, 5, 6.0, QUAY, 'oc-pump', { tint: 2 })); // the intake pump house at the hall's north end
P(...stack(-10, -82, QUAY, 2, { tint: 5 }), block(10, -70, 4, 7, 5.6, QUAY, 'oc-skid', { tint: 2 })); // cover on the walkways

// ---- west: the tank farm
const T1 = tank(-30, -64, 9, 12, 0), T2 = tank(-46, -88, 6.5, 21, 1), T3 = tank(-24, -98, 9, 8, 2);
P(T1, T2, T3);
P(valve(-17.5, -64, 6.8)); // plant deck → T1
P(...link(1001, T1, T2, { make: makeValve({ tint: 1 }), maxStep: 6.5, maxRise: 3.6 })); // T1 → brine tank (DRIVE 1)
P(...chain(1002, { x: -22, y: QUAY, z: -38.5 }, { x: -28, y: 12, z: -55.5 }, { make: makeValve(), maxStep: 6.5, maxRise: 3.6, wobble: 0.6 })); // quay → T1
P(pipe(-22, -108, -9, -147, 8.6)); // the west pipe run: T3 → tower base

// ---- east: the second membrane hall H2 on its own pontoon (roof 12.6 m), DRIVE 3 between its lasers
const H2 = block(34, -80, 13, 46, 12.6, -1, 'oc-hall', { tint: 1 });
P(H2);
P(walk(6.5, -64, 27.5, -64, 9.65, 2.2)); // cable catwalk H1 roof → H2's wall (jump the last 3 m)
P(block(34, -51, 8, 6, 6.6, 3.6, 'oc-pump', { tint: 1 })); // a pump hung on H2's south end
// the work boat: shuttles up the east side between the quay and H2 (DRIVE 2 rides it)
P(rect(33, -35, 4.5, 10, 2.0, { thick: 1.4, style: 'oc-boat', move: mv('z', 7, 13, 0), bob: bob(0.15, 3.1, 0) }));

// ---- north: the intake pipe and the intake tower
const TB = deck(-14, 14, -174, -146, 7.2);
P(TB);
P(pipe(0, -103, 0, -147, 7.25));
P(pipe(30, -104, 17, -141, 10.2, 2.4)); // the brine outfall: a high road from H2's north end to the tower base
const TOWER = disc(0, -160, 7.5, 41, { thick: 34, style: 'oc-tower' });
P(TOWER, disc(0, -160, 4.2, 45.5, { thick: 4.5, style: 'oc-lantern' }));
P(...landings(0, -160, 10.6, 7.2, 38, Math.PI * 0.5, 1.0, { rise: 3.1 }));

// ---- the weather buoy out west (the PORTAL), buoys out to it
const WB = disc(-52, -6, 3.6, 2.6, { thick: 3.4, style: 'oc-buoy', tint: 2, bob: bob(0.22, 4.2, 0.3) });
P(WB);
P(...chain(1003, { x: -9.5, y: 2.2, z: 2 }, { x: -48.5, y: 2.6, z: -5 }, { make: makeBuoy(), maxStep: 6.4, wobble: 1.6 }));
// drifting buoys: scenery, and a way round if you miss a hop
P(...buoyField(1004, -40, 28, -20, -9, 5, [[0, -13, 6], [13, -8, 4], [13, -16, 4]]));
P(...buoyField(1005, 46, 66, -110, -40, 4, []));

const lasers = [
  laser(0, QUAY - 0.05, -43, 3, 2.3, 0, 3, 0.5, 0), // the quay catwalk: one hop clears it
  laser(0, 9.6, -70, 13, 2.4, 0, 3.2, 0.5, 0), // H1 roof: two curtains out of step
  laser(0, 9.6, -82, 13, 2.4, 0, 3.2, 0.5, 0.5),
  laser(0, 7.25, -125, 2.6, 2.4, 0, 2.6, 0.5, 0.25), // across the intake pipe
  laser(34, 12.6, -73, 13, 2.6, 0, 3, 0.5, 0), // H2 roof: DRIVE 3 sits between these two
  laser(34, 12.6, -87, 13, 2.6, 0, 3, 0.5, 0.5),
];

export default {
  id: 'ocean-intake', name: 'INTAKE', sub: 'DESAL PLANT 7 · 06:10 · CALM', theme: 'oceanDawn', song: 'tidalBreak',
  seed: 1011, par: 270, killY: -0.6, water: 0,
  start: { x: 0, y: 2.2, z: 9, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -46, y: 22.1, z: -88 }, // on top of the brine tank
    { x: 33, y: 3.1, z: -35 }, // riding the work boat
    { x: 34, y: 13.7, z: -80 }, // H2's roof, between two laser walls
  ],
  exit: { x: 0, y: 45.5, z: -160, yaw: 0 },
  portal: { x: -52, y: 4.0, z: -6 },
  bonusStyle: { theme: 'oceanBonus', music: 'serverRush', weapon: 'spread', tag: 'INTAKE' },
  enemies: [
    { type: 'guard', x: -12, y: QUAY, z: -26 },
    { type: 'walker', x: 14, y: QUAY, z: -27 },
    { type: 'walker', x: 0, y: 9.6, z: -62 },
    { type: 'turret', x: 0, y: 9.6, z: -92 },
    { type: 'spiker', x: -24, y: 8, z: -98 },
    { type: 'drone', x: -26, y: 17, z: -68 },
    { type: 'drone', x: -40, y: 25, z: -78 },
    { type: 'turret', x: 34, y: 12.6, z: -61 },
    { type: 'guard', x: 37, y: 12.6, z: -99 },
    { type: 'drone', x: 36, y: 9, z: -42 },
    { type: 'drone', x: 5, y: 13, z: -126 },
    { type: 'guard', x: 8, y: 7.2, z: -150 },
    { type: 'drone', x: 12, y: 33, z: -166 },
  ],
  pickups: [
    { type: 'health', x: 0, y: QUAY + 1, z: -29 },
    { type: 'spread', x: 0, y: 10.6, z: -76 },
    { type: 'rapid', x: -30, y: 13, z: -66 },
    { type: 'healthBig', x: -24, y: 9, z: -94 },
    { type: 'rocket', x: 31, y: 13.6, z: -97 },
    { type: 'health', x: -8, y: 8.2, z: -152 },
    { type: 'slowmo', x: 0, y: 8.2, z: -136 },
    { type: 'overdrive', x: -54.5, y: 3.6, z: -4.5 },
  ],
  backdrops: [
    { kind: 'oc-windfarm', x: 560, y: 0, z: -260, yaw: away(560, -260, 0, -80), n: 12 },
    { kind: 'oc-ship', x: -380, y: 0, z: 240, yaw: 1.1, s: 1.2 },
    { kind: 'oc-plant', x: -520, y: 0, z: -420, yaw: 0.6 },
    { kind: 'oc-spire', x: 120, y: 0, z: -800, s: 0.75 },
    { kind: 'oc-ship', x: 420, y: 0, z: 320, yaw: -0.4, s: 0.9 },
  ],
};
