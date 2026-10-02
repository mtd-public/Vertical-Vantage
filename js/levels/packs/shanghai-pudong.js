// SHANGHAI stage 2 — PUDONG HEIGHTS. A bright, smoggy noon among the supertalls of Lujiazui. No
// ground: the streets are lost in the haze. You climb the towers themselves:
//   * the "bottle opener" (its sky ring: window-cleaning gondolas up the face, DRIVE 1 on the top beam),
//   * the pagoda-tiered tower (stepped setbacks to its spire: DRIVE 2),
//   * an advertising blimp shuttling between them (DRIVE 3 rides it),
//   * and the twisting tower: a stack of floor plates, each turned a little more than the one below,
//     so their corners spiral up the outside. Climb the corners to the crown (EXIT).
//
//   [TWISTING TOWER + EXIT 96 m] (0, -134)  ← sky lobby 50 m ← cars from the tiered tower / sky bridge from the opener
//   [TIERED TOWER (-46,-62) DRIVE 2]  ~blimp 38 m, DRIVE 3~  [BOTTLE OPENER (48,-66): base 50, top 66 DRIVE 1]
//          ↑ cars                                              ↑ gondola from T2 (32)
//   [T4 28]  ←cars—  [T0 START 22]  —cars→  [T1 30] → sky bridge → [T2 32]
//                                [T5 10: PORTAL] (drop down, cars back up to T1)
import { tower, rect, disc, chain, link, skyline, mv, laser } from '../kit.js';

const plats = [];
const P = (...a) => plats.push(...a);

// ---- the approach: the start podium, two mid-rise roofs, a sky bridge
P(tower(0, 18, 18, 18, 22, { tint: 0 }), disc(0, 18, 6, 22.3, { thick: 0.3, style: 'helipad' })); // T0 start
const T1 = tower(28, -16, 14, 14, 30, { tint: 2 });
const T4 = tower(-28, -16, 14, 14, 28, { tint: 5 });
P(T1, T4);
P(...chain(5201, { x: 6, y: 22, z: 10 }, { x: 22, y: 30, z: -10 }, { ads: 0.3 }));
P(...chain(5202, { x: -6, y: 22, z: 10 }, { x: -22, y: 28, z: -10 }, { ads: 0.3 }));
P(rect(35, -32.5, 4, 19, 31, { thick: 2.5, style: 'skybridge' })); // T1 → T2
P(tower(41, -46, 12, 12, 32, { tint: 3 })); // T2

// ---- the bottle opener: a slab with a sky ring at the top. A gondola rides its south face from T2's
//      height to the base of the ring (50 m); another rides the east pillar up to the top beam (66 m)
const SWFC = tower(48, -66, 30, 14, 50, { style: 'swfc' });
P(SWFC);
P(rect(35.5, -66, 5, 14, 62, { thick: 12, style: 'swfcPillar' }), rect(60.5, -66, 5, 14, 62, { thick: 12, style: 'swfcPillar' }));
P(rect(48, -66, 30, 14, 66, { thick: 4, style: 'swfcTop' }));
P(rect(41, -57.4, 6, 2.8, 41, { thick: 1.2, style: 'gondola', move: mv('y', 9, 12, 0.75) })); // 32 ⇄ 50
P(rect(64.5, -66, 2.8, 6, 58, { thick: 1.2, style: 'gondola', tint: 1, move: mv('y', 7.6, 10, 0.25) })); // 50.4 ⇄ 65.6

// ---- the tiered tower: setbacks every 3.5 m up to the spire
const JM = tower(-46, -62, 22, 22, 34, { style: 'jinmao' });
P(JM);
[[18, 37.5], [14, 41], [10, 44.5], [7, 48], [4, 51.5]].forEach(([s, top], i) => P(rect(-46, -62, s, s, top, { thick: 3.5, style: 'jinmaoTier', tint: i })));
P(disc(-46, -62, 0.4, 63, { thick: 11.5, style: 'jinmaoSpire' }));
P(...link(5203, T4, JM, { ads: 0.4 }));

// ---- the blimp: an ad ship sliding between the tiered tower and T2 (DRIVE 3 on its back)
P(rect(0, -50, 20, 6, 38, { thick: 4.5, style: 'blimp', move: mv('x', 22, 30, 0) }));

// ---- the twisting tower: a base, a sky lobby, then floor plates turning 0.21 rad each, 2.8 m apart
P(tower(0, -134, 28, 28, 44, { style: 'twistBase' }));
const LOBBY_YAW = 0.15;
P(rect(0, -134, 34, 34, 50, { yaw: LOBBY_YAW, thick: 6, style: 'twistLobby' }));
for (let i = 1; i <= 15; i++) P(rect(0, -134, 28 - 0.55 * i, 28 - 0.55 * i, 50 + 2.8 * i, { yaw: LOBBY_YAW + 0.21 * i, thick: 2.8, style: 'twistPlate', tint: i }));
P(rect(0, -134, 15, 15, 96, { yaw: LOBBY_YAW + 0.21 * 16, thick: 4, style: 'twistCrown' }));
// to the lobby: a long glass sky bridge from the opener's base, or hover cars from the tiered tower
const SB2_YAW = Math.atan2(28, 50);
P(rect(22, -95, 4.2, 57.3, 50, { yaw: SB2_YAW, thick: 2.5, style: 'skybridge', tint: 1 }));
P(...chain(5204, { x: -46, y: 44.5, z: -66.5 }, { x: -12, y: 50, z: -121 }, { ads: 0.35 }));

// ---- the low roof with the PORTAL, and cars back up to T1
P(tower(34, 32, 12, 12, 10, { tint: 6 }));
P(...chain(5205, { x: 30, y: 10, z: 27 }, { x: 27, y: 30, z: -10 }, { ads: 0.3 }));

// ---- the rest of Lujiazui: towers you can still land on
P(tower(-30, 30, 12, 12, 16, { tint: 1 }), tower(70, -20, 14, 12, 40, { tint: 4 }), tower(-80, -40, 14, 14, 46, { tint: 2 }));
P(tower(-50, -120, 16, 14, 58, { tint: 7 }), tower(50, -125, 14, 16, 62, { tint: 1 }), tower(10, -60, 10, 10, 24, { tint: 6 }));
P(...skyline(5206, 0, -60, 115, 175, 26, 15, 95, [[0, -134, 30], [48, -66, 26], [-46, -62, 22]]));

// the lobby is turned: a point on it from local (lx, lz)
const onLobby = (lx, lz, up = 0) => ({ x: lx * Math.cos(LOBBY_YAW) + lz * Math.sin(LOBBY_YAW), y: 50 + up, z: -134 - lx * Math.sin(LOBBY_YAW) + lz * Math.cos(LOBBY_YAW) });
const along = (t) => ({ x: 36 - 28 * t, z: -70 - 50 * t }); // a point along the long sky bridge

const lasers = [
  laser(54, 66, -66, 14, 3, Math.PI / 2, 3, 0.5, 0), // the opener's top beam: between the gondola and the drive
  laser(along(0.35).x, 50, along(0.35).z, 4.6, 2.6, SB2_YAW, 3, 0.5, 0), // the long sky bridge: two curtains out of step
  laser(along(0.65).x, 50, along(0.65).z, 4.6, 2.6, SB2_YAW, 3, 0.5, 0.5),
  laser(41, 32, -46, 12, 2.4, 0, 3.2, 0.5, 0.25), // across T2
];

export default {
  id: 'shanghai-pudong', name: 'PUDONG HEIGHTS', sub: 'LUJIAZUI · 02:10 · NEON RAIN', theme: 'shanghaiNeon', song: 'skyway2000',
  seed: 5002, par: 330, killY: -24,
  start: { x: 0, y: 22.3, z: 22, yaw: 0 },
  plats, lasers,
  drives: [
    { x: 44, y: 67.1, z: -66 }, // the bottle opener's top beam
    { x: -44.6, y: 52.6, z: -60.6 }, // the tiered tower's last tier, by the spire
    { x: 0, y: 39.1, z: -50 }, // riding the blimp
  ],
  exit: { x: 0, y: 96, z: -134, yaw: 0 },
  portal: { x: 36, y: 11.4, z: 34 },
  bonusStyle: { theme: 'shanghaiBonusCyan', music: 'skyway2000', weapon: 'rapid', tag: 'LUJIAZUI' },
  enemies: [
    { type: 'walker', x: 28, y: 30, z: -16 },
    { type: 'guard', x: -30, y: 28, z: -18 },
    { type: 'spiker', x: 35, y: 31, z: -30 },
    { type: 'guard', x: 43, y: 32, z: -48 },
    { type: 'guard', x: 56, y: 50, z: -62 },
    { type: 'walker', x: 48, y: 50, z: -66 },
    { type: 'turret', x: 35.5, y: 66, z: -70 },
    { type: 'turret', x: -40, y: 41, z: -62 },
    { type: 'guard', x: 22, y: 50, z: -95 },
    { type: 'guard', ...onLobby(-14, 10) },
    { type: 'drone', x: 46, y: 44, z: -54 },
    { type: 'drone', x: -10, y: 44, z: -40 },
    { type: 'drone', x: 18, y: 82, z: -134 },
    { type: 'drone', x: 0, y: 30, z: -2 },
  ],
  pickups: [
    { type: 'health', x: 24, y: 31, z: -12 },
    { type: 'rapid', x: -32, y: 29, z: -12 },
    { type: 'spread', x: 37, y: 33, z: -42 },
    { type: 'rocket', x: -50.2, y: 45.5, z: -62 },
    { type: 'healthBig', x: 31, y: 11, z: 29 },
    { type: 'health', x: 41, y: 51, z: -62 },
    { type: 'hyper', ...onLobby(14, -10, 1) },
    { type: 'overdrive', x: 61, y: 67, z: -62 },
  ],
  backdrops: [
    { kind: 'pearlTower', x: 240, y: -60, z: 60, s: 1.1 },
    { kind: 'bundRow', x: -420, y: -40, z: -60, yaw: -Math.PI / 2, s: 1.3 },
    { kind: 'skyline', x: 260, y: -60, z: -200, w: 200, d: 160, n: 20, hMin: 60, hMax: 200, color: '#9aa0a8' },
    { kind: 'skyline', x: -260, y: -60, z: -300, w: 260, d: 120, n: 18, hMin: 60, hMax: 180, color: '#9aa0a8' },
    { kind: 'skyline', x: 0, y: -60, z: 300, w: 400, d: 120, n: 22, hMin: 40, hMax: 140, color: '#9aa0a8' },
  ],
};
