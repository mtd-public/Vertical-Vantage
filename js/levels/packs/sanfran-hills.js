// NEW SAN FRANCISCO · stage 2 — STEEP STREETS. A sunny afternoon on the hills: the city is a grid
// of 20 m lots terraced up and down the slopes. Hover cable cars climb the Powell Street grade, the
// crooked street switchbacks up Russian Hill, the Painted Ladies step up Steiner Street, and Coit
// Tower stands on Telegraph Hill with the exit on top. The Golden Gate is on the north-west horizon.
//
// Map (north = -z; one character per 20 m lot, x = -80 … 80, z = 0 … -200; lot height = code × 1.5 m):
//
//   bay ~~~~~~~~~~~~~~~~~~~~~~ [Pier 39 → sea-lion floats + PORTAL]
//   waterfront ─────────────────────────────────────────────
//   [Russian Hill + DRIVE 1] ← Lombard switchbacks ←  …  [Telegraph Hill: COIT TOWER + EXIT 54 m]
//                          [Nob Hill turntable]
//         houses │ POWELL ST: hover cable cars (DRIVE 2 rides one) │ houses      [Alamo park]
//                │                                                │      [Painted Ladies + DRIVE 3]
//   MARKET STREET + START ────────────────────────────────────────
import { rect, disc, bob, lane, laser } from '../kit.js';

const plats = [];
const P = (...a) => plats.push(...a);
const CELL = 20, STEP = 1.5;
// north (z = -200) first, x = -80 … 80. '.' = a feature fills the lot; letters continue the digits (a = 10).
const MAP = [
  '223322343', // j 10  the waterfront
  '357644686', // j 9
  '47a9668b9', // j 8
  '59e.8aa.a', // j 7   Russian Hill summit (e), the crooked street (.), Telegraph Hill (.)
  '58cb98bab', // j 6
  '57aa.9899', // j 5   Nob Hill (.)
  '4689.9878', // j 4   Powell Street (.) j 0–4
  '4578.86.8', // j 3   Alamo Square (.)
  '3456.6..9', // j 2   the Painted Ladies (..)
  '2345.5456', // j 1
  '1233.3322', // j 0
];
const lotH = (i, j) => { const c = MAP[10 - j][i + 4]; return c === '.' ? null : parseInt(c, 36) * STEP; };
const cx = (i) => i * CELL, cz = (j) => -j * CELL;
for (let j = 0; j <= 10; j++) for (let i = -4; i <= 4; i++) {
  const h = lotH(i, j);
  if (h !== null) P(rect(cx(i), cz(j), CELL, CELL, h, { thick: h + 6, style: 'sfLot', tint: (i * 7 + j * 3 + 40) % 6 }));
}
P(rect(0, 20, 9 * CELL, CELL, 1.5, { thick: 7.5, style: 'sfLot', tint: 6 })); // Market Street (the start)
// the city goes on: a ring of row-house blocks round the playfield (walkable roofs; the sprawl beyond is backdrop)
for (let j = -1; j <= 9; j++) for (const i of [-5, 5]) {
  const base = j < 0 ? 1.5 : lotH(i < 0 ? -4 : 4, j);
  P(rect(cx(i), cz(j), CELL, CELL, base + 9.5 + ((j * 5 + i + 20) % 3) * 1.6, { thick: base + 15.5 + ((j * 5 + i + 20) % 3) * 1.6, style: 'sfBlock', tint: (j * 3 + i + 30) % 8 }));
}
for (let i = -5; i <= 5; i++) P(rect(cx(i), 40, CELL, CELL, 11 + ((i + 9) % 3) * 1.6, { thick: 17 + ((i + 9) % 3) * 1.6, style: 'sfBlock', tint: (i + 13) % 8 }));

// ---- Victorian houses: a walkable flat roof behind a gabled false front; the front faces local -z
let paint = 0;
const ST = 3.1;
function house(x, z, base, yaw, storeys = 3, o = {}) {
  const h = base + storeys * ST + 0.6;
  P(rect(x, z, o.w ?? 6, o.d ?? 11, h, { thick: h - base, yaw, style: 'victorian', tint: (o.tint ?? paint++) % 8 }));
  return h;
}
// a row of n houses along one edge of lot (i, j), fronts facing out over that edge ('N' 'S' 'E' 'W')
const tops = {};
function row(i, j, side, n = 3) {
  const base = lotH(i, j), x0 = cx(i), z0 = cz(j), e = CELL / 2 - 5.8;
  tops[`${i},${j}`] = [];
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * 6.6, st = (i + j + k) % 2 ? 2 : 3;
    const [x, z, yaw] = side === 'W' ? [x0 - e, z0 + off, Math.PI / 2] : side === 'E' ? [x0 + e, z0 + off, -Math.PI / 2] : side === 'S' ? [x0 + off, z0 + e, Math.PI] : [x0 + off, z0 - e, 0];
    tops[`${i},${j}`].push({ x, z, top: house(x, z, base, yaw, st) });
  }
}
for (let j = 1; j <= 4; j++) { row(-1, j, 'E'); row(1, j, 'W'); } // Powell Street's canyon
row(-3, 3, 'S'); row(-2, 5, 'S', 2); row(2, 5, 'N', 2); row(-3, 8, 'N'); row(1, 8, 'S', 2); row(2, 9, 'N', 2); row(-1, 9, 'N', 2);

// ---- POWELL STREET: a 16 % grade of 0.4 m steps you can run up, Market (1.5) → Nob Hill (19.5)
const PZ0 = 8, PZ1 = -90, NSTEP = 45, RUN = (PZ0 - PZ1) / NSTEP, RISE = 0.4;
for (let k = 0; k < NSTEP; k++) P(rect(0, PZ0 - (k + 0.5) * RUN, CELL, RUN, 1.5 + k * RISE, { thick: 3 + k * RISE, style: 'sfStreet', tint: k }));
P(rect(0, 9, CELL, 2, 1.5, { thick: 3, style: 'sfStreet', tint: -1 }));
const grade = (z) => 1.5 + (PZ0 - z) * (RISE / RUN); // the step-corner line under the cars
// Nob Hill: the cable-car turntable plaza at the top
P(rect(0, cz(5), CELL, CELL, 19.5, { thick: 25.5, style: 'sfPlaza' }));
P(disc(0, cz(5) + 3, 4.5, 19.8, { thick: 0.3, style: 'sfTurntable' }));
// two hover cable cars on the grade in opposite phase; roofs 3.4 m over the steps (a double jump)
const CAR = { w: 2.6, d: 8, t: 2.6 }, zMid = ((PZ0 - 6) + (PZ1 + 6)) / 2, amp = ((PZ0 - 6) - (PZ1 + 6)) / 2;
const along = Math.sqrt(1 + (RISE / RUN) * (RISE / RUN));
for (const [x, ph] of [[-3.2, 0], [3.2, 0.5]]) {
  P(rect(x, zMid, CAR.w, CAR.d, grade(zMid) + 0.8 + CAR.t, { thick: CAR.t, style: 'cableCar', tint: ph ? 1 : 0, move: lane(0, RISE, -RUN, amp * along, 34, ph) }));
}

// ---- RUSSIAN HILL and the crooked street: six 1.5 m terraces switchbacking down to the east
const LX0 = -30, LZ = cz(7), TOPH = lotH(-2, 7);
for (let k = 0; k < 6; k++) P(rect(LX0 + 1.67 + k * 3.33, LZ, 3.33, CELL, TOPH - (k + 1) * 1.5, { thick: 10, style: 'lombard', tint: k }));
const LOOK = { x: -40, z: LZ - 2, y: TOPH + 3 };
P(rect(LOOK.x, LOOK.z, 8, 5, LOOK.y, { thick: 3, style: 'sfPlaza', tint: 1 })); // the summit lookout (DRIVE 1)
house(-44.5, LZ + 7, TOPH, -Math.PI / 2, 2);

// ---- TELEGRAPH HILL and Coit Tower (a fluted column; balconies spiral up it to the exit on top)
const TX = cx(3), TZ = cz(7), TH = 18, COIT = 54;
P(rect(TX, TZ, CELL, CELL, TH, { thick: TH + 6, style: 'sfPark', tint: 1 }));
P(disc(TX, TZ, 5.5, COIT, { thick: COIT - TH, style: 'coitTower' }));
const balconies = [];
for (let k = 0; k < 9; k++) {
  const a = Math.PI / 2 + k * 1.2, y = TH + 3.6 * (k + 1);
  balconies.push([TX + Math.cos(a) * 7.2, TZ + Math.sin(a) * 7.2, y]);
  P(rect(TX + Math.cos(a) * 7.2, TZ + Math.sin(a) * 7.2, 3.2, 3.2, y, { thick: 0.6, yaw: -a, style: 'coitLedge' }));
}

// ---- ALAMO SQUARE and the PAINTED LADIES: six houses stepping up Steiner Street, porches and bay
// windows to climb, and a turret on the top one (DRIVE 3)
P(rect(cx(3), cz(3), CELL, CELL, 10.5, { thick: 16.5, style: 'sfPark' }));
const LADY = [], LX = (k) => 36 + k * 5.6, LZZ = cz(2) + 1;
for (let k = 0; k < 6; k++) {
  const x = LX(k), base = 9 + k;
  P(rect(x, cz(2), 5.6, CELL, base, { thick: base + 6, style: 'sfLot', tint: 7 }));
  LADY.push(house(x, LZZ, base, 0, 3, { w: 5.2, d: 11, tint: k }));
  P(rect(x - 1.0, LZZ - 6.7, 3.6, 2.4, base + 3.4, { thick: 0.5, style: 'vicPorch', tint: k }));
  P(rect(x + 1.5, LZZ - 6.4, 2.4, 1.8, base + 6.8, { thick: 0.5, style: 'vicBay', tint: k }));
}
P(rect(31.6, cz(2), 3.2, CELL, 9, { thick: 15, style: 'sfLot', tint: 7 }), rect(68.4, cz(2), 3.2, CELL, 14, { thick: 20, style: 'sfLot', tint: 7 }));
P(disc(LX(5), LZZ + 2, 1.9, LADY[5] + 2.6, { thick: 2.6, style: 'vicTurret', tint: 5 }));

// ---- the waterfront: Pier 39 out into the bay, and the sea-lion floats (PORTAL on the last one)
P(rect(cx(2), -232, 14, 44, 3, { thick: 6, style: 'sfPier' }));
P(rect(cx(2) + 2, -226, 6, 10, 7.5, { thick: 4.5, style: 'sfShed', tint: 0 }), rect(cx(2) - 2, -244, 6, 8, 7, { thick: 4, style: 'sfShed', tint: 1 }));
const floats = [[cx(2) - 11, -238], [cx(2) - 17, -244], [cx(2) - 23, -250], [cx(2) - 18, -257]];
floats.forEach(([x, z], k) => P(rect(x, z, 4.4, 6, 1.1, { thick: 0.6, style: 'sfFloat', bob: bob(0.12, 3 + k * 0.4, k * 0.25) })));
P(rect(cx(-2), -230, 10, 40, 3, { thick: 6, style: 'sfPier' })); // another pier to the west

const canyon = tops['-1,3'][1];
const lasers = [
  laser(LOOK.x - 3, LOOK.y, LOOK.z, 5, 2.6, Math.PI / 2, 3, 0.5, 0.2), // across the summit lookout
  laser(0, 19.5, cz(5) - 7, 20, 2.6, 0, 3.2, 0.5, 0.5), // Nob Hill plaza, north side
  laser(TX, TH, TZ + 8.4, 14, 2.6, 0, 2.8, 0.5, 0), // Coit plaza, south of the tower
  laser(LX(3) - 1.6, LADY[3], LZZ, 9, 2.4, Math.PI / 2, 2.6, 0.5, 0.4), // along the edge of one of the ladies' roofs
];

export default {
  id: 'sanfran-hills', name: 'STEEP STREETS', sub: 'NEW SAN FRANCISCO · 21:30 · CLEAR NIGHT', theme: 'sfStreets', song: 'skygarden',
  seed: 3002, par: 300, killY: -0.6, water: 0,
  start: { x: 0, y: 1.5, z: 22, yaw: 0 },
  plats, lasers,
  drives: [
    { x: LOOK.x, y: LOOK.y + 1.1, z: LOOK.z }, // Russian Hill summit, up the crooked street
    { x: -3.2, y: grade(zMid) + 0.8 + CAR.t + 1.1, z: zMid }, // riding a cable car's roof
    { x: LX(5), y: LADY[5] + 2.6 + 1.1, z: LZZ + 2 }, // the top Painted Lady's turret
  ],
  exit: { x: TX, y: COIT, z: TZ, yaw: 0 },
  portal: { x: floats[3][0], y: 1.1 + 1.4, z: floats[3][1] },
  bonusStyle: { theme: 'sfBonus', music: 'serverRush', weapon: 'rapid', tag: 'NOB HILL' },
  enemies: [
    { type: 'walker', x: -40, y: 1.5, z: 20 },
    { type: 'guard', x: -6, y: 19.5, z: cz(5) - 4 },
    { type: 'turret', x: 7, y: 19.5, z: cz(5) + 6 },
    { type: 'guard', x: LX0 + 1.67 + 5 * 3.33, y: TOPH - 9, z: LZ + 6 },
    { type: 'guard', x: -36, y: TOPH, z: LZ - 7 },
    { type: 'spiker', x: canyon.x, y: canyon.top, z: canyon.z },
    { type: 'spiker', x: LX(3), y: LADY[3], z: LZZ },
    { type: 'walker', x: cx(3) - 4, y: 10.5, z: cz(3) + 4 },
    { type: 'turret', x: TX - 6, y: TH, z: TZ + 6 },
    { type: 'walker', x: cx(2), y: 3, z: -236 },
    { type: 'drone', x: 0, y: 20, z: -40 },
    { type: 'drone', x: -24, y: 28, z: LZ + 8 },
    { type: 'drone', x: cx(3) + 6, y: 26, z: cz(2) - 10 },
    { type: 'drone', x: TX + 10, y: 46, z: TZ },
  ],
  pickups: [
    { type: 'health', x: 6, y: 2.5, z: 18 },
    { type: 'spread', x: cx(3) + 4, y: 11.5, z: cz(3) - 4 },
    { type: 'rapid', x: -6, y: 20.5, z: cz(5) + 6 },
    { type: 'healthBig', x: -34, y: TOPH + 1, z: LZ + 6 },
    { type: 'rocket', x: TX + 6, y: TH + 1, z: TZ + 6 },
    { type: 'slowmo', x: LX(4), y: LADY[4] + 1, z: LZZ },
    { type: 'health', x: cx(2), y: 4, z: -250 },
    { type: 'hyper', x: balconies[4][0], y: balconies[4][2] + 1, z: balconies[4][1] },
  ],
  backdrops: [
    { kind: 'goldenGate', x: -360, z: -520, yaw: 0.74, s: 0.25 },
    { kind: 'sfHills', x: -500, z: -860, len: 1000, h: 70, n: 6, lights: 10, color: '#22222e' },
    { kind: 'alcatraz', x: 110, z: -500, yaw: 0.2, s: 0.5 },
    { kind: 'sfHills', x: 420, z: -700, len: 500, h: 70, n: 4, lights: 24, color: '#26262e' },
    { kind: 'sfSkyline', x: 420, z: -60, w: 140, d: 220, n: 18, hMin: 40, hMax: 130, salesforce: true },
    { kind: 'transamerica', x: 360, z: -150, s: 0.42 },
    { kind: 'sfSprawl', x: 0, z: 190, len: 640, dep: 200, n: 6, h: 40 },
    { kind: 'sfSprawl', x: -250, z: -80, yaw: Math.PI / 2, len: 520, dep: 190, n: 5, h: 55 },
    { kind: 'sfSprawl', x: 230, z: 40, yaw: -Math.PI / 2, len: 300, dep: 130, n: 3, h: 25 },
    { kind: 'sutro', x: -520, z: 260, s: 0.38, hill: false },
    { kind: 'fogBank', x: -720, z: -260, yaw: 1.3, s: 1.2 },
    { kind: 'sfBeams', x: 420, y: 0, z: -60, pts: [[0, 0, -80], [-20, 0, 40]], len: 300, r: 14, color: '#c8b8ff' },
  ],
};
