// NEW SAN FRANCISCO · stage 3 — TWIN PEAKS. Dusk, and the fog has poured in: only the hilltops stand
// out of it, linked by floating street lamps and hover traffic. Climb Sutro Tower (three legs, two beam
// levels, a lift up the middle) to the exit on its crown; the Transamerica pyramid rises out of the fog
// downtown, and Mount Davidson's cross hides the portal. Alcatraz and the Golden Gate's towers poke out
// of the fog on the horizon.
//
//          [SUTRO TOWER: lift, beams (DRIVE 2), EXIT 112 m]               [TRANSAMERICA pyramid, DRIVE 1 on top]
//               ↑ lamps                                                         ↑ hover cars
//          [Buena Vista park] ←───────── hover cars ─────────── [Corona Heights + hover gondola (DRIVE 3)]
//               ↑ lamps                                                ↑ cars
//          [NORTH TWIN + START] ── Twin Peaks Blvd ── [SOUTH TWIN lookout]
//               ↘ lamps
//          [Mount Davidson: the cross + PORTAL]
import { rect, disc, chain, bob, mv, orbit, laser, yawTo } from '../kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const FOG = 6; // the fog sea (level.cloudY): fall into it and you're back on your last footing

// ---- the twin peaks and the boulevard between them
P(disc(0, 0, 20, 36, { thick: 36, style: 'sfPeak' }), disc(3, -3, 9, 41, { thick: 6, style: 'sfPeak', tint: 1 }));
P(disc(38, -32, 16, 38, { thick: 38, style: 'sfPeak' }), disc(40, -34, 8, 44, { thick: 6, style: 'sfPeak', tint: 3 }));
const ROAD = { x: 20.5, z: -17.3, yaw: yawTo(0.765, -0.644) }; // north twin's edge → south twin's edge
P(rect(ROAD.x, ROAD.z, 6, 20, 37, { thick: 3, yaw: ROAD.yaw, style: 'sfRoad' }));
P(rect(ROAD.x + 7, ROAD.z + 7.5, 6, 5, 37, { thick: 2.5, yaw: ROAD.yaw, style: 'sfRoad', tint: 1 })); // a pull-out with a view

// ---- Buena Vista park and Corona Heights
const BV = { x: -30, z: -104, r: 18, y: 28 }, CH = { x: 78, z: -78, r: 15, y: 30 };
P(disc(BV.x, BV.z, BV.r, BV.y, { thick: BV.y, style: 'sfPeak', tint: 2 }));
P(disc(CH.x, CH.z, CH.r, CH.y, { thick: CH.y, style: 'sfPeak', tint: 4 }), rect(CH.x + 3, CH.z + 2, 6, 5, CH.y + 3.5, { thick: 5, style: 'sfRock' }));
// a hover gondola circling Corona Heights (DRIVE 3 rides it)
const POD = { r: 21, y: CH.y + 5.5, period: 24 }; // (flies above the hover traffic that docks at the island)
P(disc(CH.x, CH.z, 3, POD.y, { thick: 1.2, style: 'sfPod', move: orbit('xz', POD.r, POD.period, 0) }));

// ---- SUTRO TOWER on its hill: three legs, beams at 60 and 86, a lift in the middle, a crown deck at 112
const SX = -104, SZ = -160, SH = 34, L1 = 60, L2 = 86, TOP = 112, LEGR = 13;
P(disc(SX, SZ, 26, SH, { thick: SH, style: 'sfPeak', tint: 2 }));
const legs = [0, 1, 2].map((k) => { const a = Math.PI / 2 + (k * 2 * Math.PI) / 3; return [SX + Math.cos(a) * LEGR, SZ + Math.sin(a) * LEGR]; });
for (const [x, z] of legs) P(rect(x, z, 3, 3, TOP, { thick: TOP - SH, style: 'sutroLeg' }));
for (const y of [L1, L2]) for (let k = 0; k < 3; k++) {
  const [ax, az] = legs[k], [bx, bz] = legs[(k + 1) % 3], len = Math.sqrt((bx - ax) * (bx - ax) + (bz - az) * (bz - az));
  P(rect((ax + bx) / 2, (az + bz) / 2, 2.4, len - 3, y, { thick: 1.4, yaw: yawTo(bx - ax, bz - az), style: 'sutroBeam' }));
}
P(disc(SX, SZ, 12, TOP, { thick: 2.2, style: 'sutroDeck' }));
P(disc(SX, SZ, 2.4, (36 + 84) / 2, { thick: 0.6, style: 'sutroLift', move: mv('y', 24, 18, 0) })); // 36 ⇄ 84
// maintenance ledges up the south leg from the upper beams to the crown (never under the deck)
const [lx0, lz0] = legs[0];
[[2.6, 0], [0, 2.6], [-2.6, 0], [0, 2.6], [2.6, 0], [0, 2.6]].forEach(([dx, dz], k) => P(rect(lx0 + dx, lz0 + dz, 2.2, 2.2, L2 + 3.7 * (k + 1), { thick: 0.5, style: 'sutroLedge' })));

// ---- the TRANSAMERICA pyramid downtown: a plaza block, eight 2 m setbacks, the spire; hover cars spiral round it
const TX = 132, TZ = -168, TBASE = 18;
P(rect(TX, TZ, 48, 48, TBASE, { thick: TBASE, style: 'sfDowntown' }));
const PYR = [];
for (let k = 0; k < 10; k++) { const w = 32 - 3 * k, top = TBASE + 3.6 * (k + 1); PYR.push({ w, top }); P(rect(TX, TZ, w, w, top, { thick: 3.6, style: 'transamerica', tint: k })); }
const PTOP = PYR[PYR.length - 1].top;
P(rect(TX, TZ, 1.6, 1.6, PTOP + 30, { thick: 30, style: 'taSpire' }));

// ---- MOUNT DAVIDSON and its cross (the PORTAL on top), reached by lamps down from the north twin
const MX = -70, MZ = 62;
P(disc(MX, MZ, 10, 20, { thick: 20, style: 'sfPeak', tint: 2 }));
P(rect(MX, MZ, 2.6, 2.6, 44, { thick: 24, style: 'sfCross' }), rect(MX, MZ, 14, 2.6, 37, { thick: 2.6, style: 'sfCross', tint: 1 }));
const lamp = (x, z, top, ph = 0) => disc(x, z, 1.7, top, { thick: 0.6, style: 'sfLamp', bob: bob(0.18, 3.4, ph) });
P(lamp(MX + 3.5, MZ + 7, 23.4, 0.1), lamp(MX - 2.5, MZ + 8, 26.8, 0.5), lamp(MX + 2.5, MZ + 4.5, 30.2, 0.3), lamp(MX - 3, MZ + 4.2, 33.6, 0.8), lamp(MX + 4, MZ + 4.5, 40.5, 0.6));

// ---- the links: floating Victorian street lamps (west), hover traffic (east)
const lamps = (rng, x, z, top, yaw, i) => disc(x, z, 1.9, top, { thick: 0.6, style: 'sfLamp', tint: i, bob: bob(0.16 + rng() * 0.1, 3 + rng(), rng()) });
P(...chain(3301, { x: -8, y: 36, z: -18 }, { x: -24, y: BV.y, z: BV.z + 16 }, { make: lamps }));
P(...chain(3302, { x: BV.x - 13, y: BV.y, z: BV.z - 12 }, { x: SX + 16, y: SH, z: SZ + 18 }, { make: lamps }));
P(...chain(3304, { x: 48, y: 38, z: -42 }, { x: CH.x - 10, y: CH.y, z: CH.z + 10 }));
P(...chain(3305, { x: CH.x + 6, y: CH.y, z: CH.z - 13 }, { x: TX - 18, y: TBASE, z: TZ + 20 }));
P(...chain(3306, { x: CH.x - 14, y: CH.y, z: CH.z - 5 }, { x: BV.x + 17, y: BV.y, z: BV.z + 4 }, { maxStep: 7 }));
P(...chain(3307, { x: -14, y: 36, z: 13 }, { x: MX + 7, y: 20, z: MZ - 6 }, { make: lamps }));

const lasers = [
  laser(ROAD.x, 37, ROAD.z, 6, 2.4, ROAD.yaw, 3, 0.5, 0), // across Twin Peaks Blvd
  laser(TX, TBASE, TZ + 20, 30, 2.6, 0, 3.4, 0.5, 0.3), // the pyramid's south plaza
  laser((legs[1][0] + legs[2][0]) / 2, L1, (legs[1][1] + legs[2][1]) / 2, 2.4, 2.4, yawTo(legs[2][0] - legs[1][0], legs[2][1] - legs[1][1]), 2.6, 0.5, 0.5), // across a lower beam
  laser(SX - 6, TOP, SZ, 10, 3, Math.PI / 2, 3, 0.5, 0.2), // the crown, west of the gate
];
const beam2 = { x: (legs[0][0] + legs[1][0]) / 2, z: (legs[0][1] + legs[1][1]) / 2 };

export default {
  id: 'sanfran-peaks', name: 'TWIN PEAKS', sub: 'NEW SAN FRANCISCO · 19:50 · FOG ROLLING IN', theme: 'sfDusk', song: 'ghostline',
  seed: 3003, par: 320, killY: FOG - 1, cloudY: FOG,
  start: { x: 4, y: 41, z: 2, yaw: 0.3 }, // on the north twin's summit, looking out over the fog to Sutro Tower
  plats, lasers,
  drives: [
    { x: TX + 1.5, y: PTOP + 1.1, z: TZ + 1.5 }, // the pyramid's top setback, beside the spire
    { x: beam2.x, y: L2 + 1.1, z: beam2.z }, // Sutro Tower's upper beam
    { x: CH.x + POD.r, y: POD.y + 1.1, z: CH.z }, // on the hover gondola round Corona Heights
  ],
  exit: { x: SX, y: TOP, z: SZ, yaw: 0 },
  portal: { x: MX, y: 44 + 1.4, z: MZ },
  bonusStyle: { theme: 'sfBonus', music: 'serverRush', weapon: 'rocket', tag: 'SUTRO' },
  enemies: [
    { type: 'guard', x: 42, y: 44, z: -36 },
    { type: 'walker', x: 22, y: 37, z: -16 },
    { type: 'turret', x: BV.x - 4, y: BV.y, z: BV.z - 6 },
    { type: 'spiker', x: BV.x + 6, y: BV.y, z: BV.z + 2 },
    { type: 'walker', x: CH.x - 4, y: CH.y, z: CH.z - 4 },
    { type: 'guard', x: TX - 20, y: TBASE, z: TZ + 12 },
    { type: 'turret', x: TX + 15.2, y: PYR[0].top, z: TZ },
    { type: 'turret', x: SX + 12, y: SH, z: SZ + 14 },
    { type: 'walker', x: (legs[1][0] + legs[2][0]) / 2 - 6, y: L1, z: (legs[1][1] + legs[2][1]) / 2 },
    { type: 'drone', x: -16, y: 38, z: -60 },
    { type: 'drone', x: 100, y: 34, z: -120 },
    { type: 'drone', x: TX + 6, y: 58, z: TZ + 10 },
    { type: 'drone', x: SX + 8, y: 104, z: SZ + 12 },
  ],
  pickups: [
    { type: 'health', x: -4, y: 37, z: 8 },
    { type: 'spread', x: CH.x - 6, y: CH.y + 1, z: CH.z + 4 },
    { type: 'rapid', x: BV.x + 2, y: BV.y + 1, z: BV.z - 8 },
    { type: 'rocket', x: TX + 19, y: TBASE + 1, z: TZ + 12 },
    { type: 'healthBig', x: SX - 14, y: SH + 1, z: SZ + 10 },
    { type: 'slowmo', x: beam2.x - 2.5, y: L2 + 1, z: beam2.z - 4.33 },
    { type: 'health', x: MX + 5, y: 21, z: MZ + 3 },
    { type: 'overdrive', x: TX - 1.5, y: PTOP + 1, z: TZ - 1.5 },
  ],
  backdrops: [
    { kind: 'goldenGate', x: -200, y: -10, z: -640, yaw: 0.25, s: 0.32, orange: -0.2 },
    { kind: 'alcatraz', x: 260, y: -6, z: -620, yaw: -0.3, s: 0.6 },
    { kind: 'sfSkyline', x: 330, y: -10, z: -280, w: 180, d: 120, n: 18, hMin: 40, hMax: 120 },
    { kind: 'hills', x: -420, y: -20, z: 160, len: 600, h: 60, n: 5, houses: 8, color: '#6a6a58' },
    { kind: 'hills', x: 120, y: -20, z: -900, len: 1100, h: 110, n: 6, color: '#7a6a5a' },
    { kind: 'fogBank', x: -420, y: 4, z: -260, yaw: 1.2, s: 1.4 },
    { kind: 'fogBank', x: 120, y: 2, z: -480, yaw: 0.1, s: 1.6 },
    { kind: 'fogBank', x: 360, y: 2, z: 120, yaw: -1.1, s: 1.2 },
  ],
};
