// NEW SAN FRANCISCO · stage 1 — GOLDEN GATE. Morning, fog banks rolling in off the Pacific. You
// cross the bridge itself: the deck with its hover traffic, the art-deco towers you climb ledge by
// ledge, and the main cable you can walk from tower top to tower top.
//
// Map (north = -z, up the page; the bay is at y = 0, the deck at 20, the tower tops at 62):
//
//                 [Marin cliff]
//            ═══ north side span ═══
//   [NORTH TOWER + EXIT 62 m] ← ledges up the east leg, or the west cable from midspan
//        ║           ║                   ~yachts~ → [lighthouse + PORTAL]
//   main span: deck + traffic, laser at midspan; the west main cable is a catwalk (slowmo at its low point)
//        ║           ║
//   [container ship ⇄ under the span, DRIVE 2 on its bridge] → south tower fender → ledges back up
//   [SOUTH TOWER: DRIVE 1 on the west saddle] ← ledges up the west leg, struts at 34 / 48
//            ═══ south side span ═══   (turret, laser)
//   [Fort Point: DRIVE 3 in the courtyard] ← rocks down from the plaza
//   [TOLL PLAZA + START]
import { rect, disc, car, chain, bob, mv, laser, yawTo } from '../kit.js';
import { GG, cableY } from './sanfran-shared.js';

const { D, TT, zS, zN, zA, zB, legX, legW, legD } = GG;
const plats = [];
const P = (...a) => plats.push(...a);
const zm = (zS + zN) / 2;

// ---- the roadway: approach viaduct, side spans, main span, north approach (style draws cables + truss)
P(rect(0, 28, GG.deckW, 36, D, { thick: 1.6, style: 'ggDeck' })); // south approach (z 46 → 10)
P(rect(0, (zA + zS) / 2, GG.deckW, zA - zS, D, { thick: 1.6, style: 'ggDeck' })); // south side span
P(rect(0, zm, GG.deckW, zS - zN, D, { thick: 1.6, style: 'ggDeck' })); // main span
P(rect(0, (zN + zB) / 2, GG.deckW, zN - zB, D, { thick: 1.6, style: 'ggDeck' })); // north side span
P(rect(0, -280, GG.deckW, 20, D, { thick: 1.6, style: 'ggDeck' })); // north approach
// guard rails along both edges (hop them to leave the deck)
for (const [z0, z1] of [[46, zS + legD / 2], [zS - legD / 2, zN + legD / 2], [zN - legD / 2, -290]]) {
  for (const sx of [-1, 1]) P(rect(sx * 11.2, (z0 + z1) / 2, 0.3, z0 - z1, D + 1.1, { thick: 1.1, style: 'ggRail' }));
}

// ---- the toll plaza (start) on the Presidio headland, and the rocks down to Fort Point
P(rect(0, 61, 56, 30, D, { thick: 26, style: 'ggPlaza' }));
for (const x of [-16, -8, 8, 16]) P(rect(x, 54, 2.4, 4.4, D + 3, { thick: 3, style: 'ggBooth' }));
P(rect(-33, 52, 8, 10, 16.5, { thick: 20, style: 'sfRock' }), rect(-36.5, 44, 6, 6, 13.5, { thick: 17, style: 'sfRock' }));
P(rect(-46, 66, 26, 20, 12, { thick: 16, style: 'sfRock' }), rect(26, 34, 16, 18, 12, { thick: 16, style: 'sfRock' })); // headland scenery either side of the approach
// Fort Point: a brick square under the south approach; the courtyard holds DRIVE 3
const FX = -52, FZ = 30, FW = 26, FD = 22, WALL = 11;
P(rect(FX, FZ - FD / 2 + 1.5, FW, 3, WALL, { thick: 13, style: 'fortPoint' }), rect(FX, FZ + FD / 2 - 1.5, FW, 3, WALL, { thick: 13, style: 'fortPoint' }));
P(rect(FX - FW / 2 + 1.5, FZ, 3, FD - 6, WALL, { thick: 13, style: 'fortPoint' }), rect(FX + FW / 2 - 1.5, FZ, 3, FD - 6, WALL, { thick: 13, style: 'fortPoint' }));
P(rect(FX, FZ, FW - 6, FD - 6, 4, { thick: 6, style: 'fortYard' }));
P(rect(FX + 7, FZ + 5, 5, 4, 7.5, { thick: 3.5, style: 'fortPoint', tint: 1 })); // the stair block inside
P(rect(FX, FZ + FD / 2 + 4, FW + 8, 6, 2.2, { thick: 5, style: 'sfRock' })); // the seawall rocks

// ---- the towers: two legs, the portal struts, the top strut and the cable saddles; a fender at the waterline
for (const zT of [zS, zN]) {
  for (const sx of [-1, 1]) {
    P(rect(sx * legX, zT, legW, legD, TT, { thick: TT + 2, style: 'ggLeg' }));
    P(rect(sx * legX, zT, 3.2, 5.2, TT + 2.6, { thick: 2.6, style: 'ggSaddle' }));
  }
  for (const y of GG.struts) P(rect(0, zT, (legX - legW / 2) * 2, 3.6, y, { thick: 3, style: 'ggStrut' }));
  P(rect(0, zT, (legX - legW / 2) * 2, 4.4, TT, { thick: 4, style: 'ggStrut', tint: 1 }));
  P(rect(0, zT, 44, 16, 6, { thick: 8, style: 'ggFender' }));
}
// maintenance ledges round one leg of each tower: south (S), outer (O) and north (N) faces in turn,
// 3.5 m apart, with the struts as landings. From the fender (6) or the deck (20) to the top (62).
function ledges(zT, sx, ys, faces) {
  const lx = sx * legX;
  ys.forEach((y, i) => {
    const f = faces[i % faces.length];
    if (f === 'S') P(rect(lx, zT + legD / 2 + 1.25, 3.2, 2.5, y, { thick: 0.5, style: 'ggLedge' }));
    else if (f === 'N') P(rect(lx, zT - legD / 2 - 1.25, 3.2, 2.5, y, { thick: 0.5, style: 'ggLedge', tint: 1 }));
    else P(rect(lx + sx * (legW / 2 + 1.25), zT, 2.5, 3.2, y, { thick: 0.5, style: 'ggLedge', tint: 2 + (sx > 0 ? 1 : 0) }));
  });
}
ledges(zS, -1, [9.5, 13, 16.5], ['S', 'O', 'N']); // up from the fender (the way back from the ship)
ledges(zS, -1, [23.5, 27, 30.5, 37.5, 41, 44.5, 51.5, 55, 58.5], ['S', 'O', 'N', 'N', 'O', 'S', 'S', 'O', 'N']);
ledges(zN, 1, [23.5, 27, 30.5, 37.5, 41, 44.5, 51.5, 55, 58.5], ['S', 'O', 'N', 'N', 'O', 'S', 'S', 'O', 'N']);

// ---- the west main cable: catwalk planks clamped on top of it, saddle to saddle (steep near the
// towers, a ladder of planks; almost flat at midspan). Rises ≤ 3.2 m and steps ≤ 5.8 m.
const cable = [];
{
  let z = zS - legD / 2 - 1.5;
  for (;;) {
    cable.push(z);
    let step = 2.8;
    while (step < 5.8 && cableY(z) - cableY(z - step - 0.2) < 3.2) step += 0.2;
    z -= step;
    if (z < zm + 1.5) break;
  }
  if (zm - cable[cable.length - 1] < -3) cable.push(zm);
  const half = cable.slice();
  for (const z of half.reverse()) if (Math.abs(z - zm) > 1) cable.push(2 * zm - z);
}
for (const z of cable) P(rect(-legX, z, 2.2, 2.4, cableY(z) + GG.r + 0.25, { thick: 0.35, style: 'ggCable' }));
const lowPlank = cable.reduce((a, z) => (Math.abs(z - zm) < Math.abs(a - zm) ? z : a), cable[0]);

// ---- hover traffic over the deck (lanes at x = ±5.5; roofs at D + 3.9, clear of your head)
const LANE = D + 3.9;
P(car('sedan', -5.5, zm, LANE, 0, { move: mv('z', 54, 15, 0), bob: bob(0.1, 3, 0) }));
P(car('bus', 5.5, zm, LANE + 1.2, Math.PI, { move: mv('z', 50, 19, 0.5), bob: bob(0.08, 4, 0.3) }));
P(car('taxi', -5.5, (zA + zS) / 2, LANE, 0, { move: mv('z', 26, 9, 0.25), bob: bob(0.1, 3, 0.6) }));
P(car('van', 5.5, (zA + zS) / 2, LANE + 0.4, Math.PI, { move: mv('z', 24, 11, 0.7), bob: bob(0.1, 3.4, 0.1) }));
P(car('coupe', -5.5, (zN + zB) / 2, LANE, 0, { move: mv('z', 24, 10, 0.4), bob: bob(0.1, 2.8, 0.2) }));
P(car('truck', 5.5, (zN + zB) / 2, LANE + 0.8, Math.PI, { move: mv('z', 22, 13, 0.1), bob: bob(0.08, 3.6, 0.5) }));

// ---- a container ship passing under the main span, next to the south tower's fender (DRIVE 2)
const SHIP = mv('x', 46, 30, 0), SZ = -77;
P(rect(0, SZ, 56, 12, 5, { thick: 7, style: 'hull', move: SHIP }));
P(rect(20, SZ, 8, 10, 11, { thick: 6, style: 'sfShipBridge', move: SHIP }));
for (const [x, z, n] of [[-18, -3.4, 2], [-18, 0, 1], [-4, 3.4, 1], [-4, 0, 2], [8, -3.4, 1]]) {
  for (let k = 0; k < n; k++) P(rect(x, SZ + z, 12.2, 2.44, 5 + 2.6 * (k + 1), { thick: 2.6, style: 'container', tint: (x + k * 3 + 16) % 8, move: SHIP }));
}

// ---- hover yachts out to the fog-signal lighthouse (the PORTAL), east of the main span
P(disc(60, -175, 5.5, 6, { thick: 8, style: 'sfRock' }));
P(disc(60, -175, 3.4, 10, { thick: 4, style: 'sfLighthouse' }), disc(60, -175, 2.1, 13.5, { thick: 3.5, style: 'sfLighthouse', tint: 1 }));
const yacht = (rng, x, z, top, yaw, i) => rect(x, z, 3.4, 7.5, top, { thick: 1.2, yaw, style: 'sfYacht', tint: i, bob: bob(0.18, 3 + rng(), rng()) });
P(...chain(3101, { x: 12, y: D, z: -150 }, { x: 55, y: 6, z: -172 }, { make: yacht, maxStep: 7 }));

// ---- the Marin side: north approach onto the cliffs
P(rect(0, -312, 64, 44, 24, { thick: 30, style: 'sfRock' }));
P(rect(-18, -300, 8, 8, 27, { thick: 3, style: 'sfRock' }));

const lasers = [
  laser(0, D, 30, 22, 2.4, 0, 3, 0.5, 0), // across the approach: jump it or time it
  laser(0, D, -40, 22, 2.4, 0, 3.2, 0.5, 0.5), // the south side span
  laser(0, D, zm, 22, 2.4, 0, 2.8, 0.5, 0.25), // midspan (the cable route skips it)
  laser(0, GG.struts[1], zS, 3.6, 3, Math.PI / 2, 2.6, 0.5, 0), // across the south tower's upper strut
  laser(-6, TT, zN, 4.4, 3, Math.PI / 2, 3, 0.5, 0), // the north tower top, between the cable and the gate
];

export default {
  id: 'sanfran-gate', name: 'GOLDEN GATE', sub: 'NEW SAN FRANCISCO · 07:10 · FOG BANKS', theme: 'sfMorning', song: 'jumpstart',
  seed: 3001, par: 300, killY: -0.6, water: 0,
  start: { x: 0, y: D, z: 66, yaw: 0 },
  plats, lasers,
  drives: [
    { x: -legX, y: TT + 2.6 + 1.1, z: zS }, // the south tower's west saddle
    { x: 20, y: 11 + 1.1, z: SZ }, // on the ship's bridge, passing under the span
    { x: FX, y: 4 + 1.1, z: FZ - 3 }, // Fort Point's courtyard
  ],
  exit: { x: 0, y: TT, z: zN, yaw: 0 },
  portal: { x: 60, y: 13.5 + 1.4, z: -175 },
  bonusStyle: { theme: 'sfBonus', music: 'serverRush', weapon: 'spread', tag: 'GOLDEN GATE' },
  enemies: [
    { type: 'guard', x: -10, y: D, z: 58 },
    { type: 'guard', x: 12, y: D, z: 50 },
    { type: 'turret', x: 0, y: D, z: 14 },
    { type: 'walker', x: -4, y: D, z: -30 },
    { type: 'spiker', x: 4, y: GG.struts[0], z: zS },
    { type: 'walker', x: 5, y: D, z: -105 },
    { type: 'walker', x: -5, y: D, z: -165 },
    { type: 'guard', x: FX - 6, y: WALL, z: FZ - FD / 2 + 1.5 },
    { type: 'walker', x: 12, y: 5, z: SZ + 3.5 },
    { type: 'turret', x: -6, y: GG.struts[0], z: zN },
    { type: 'drone', x: -22, y: 50, z: -80 },
    { type: 'drone', x: 14, y: 28, z: zm },
    { type: 'drone', x: 34, y: 15, z: -163 },
    { type: 'drone', x: 8, y: 68, z: zN + 8 },
  ],
  pickups: [
    { type: 'health', x: 6, y: D + 1, z: 60 },
    { type: 'spread', x: -6, y: GG.struts[0] + 1, z: zS },
    { type: 'healthBig', x: 6, y: TT + 1, z: zS },
    { type: 'slowmo', x: -legX, y: cableY(lowPlank) + GG.r + 1.25, z: lowPlank },
    { type: 'rocket', x: 6, y: 6, z: SZ },
    { type: 'rapid', x: FX - 5, y: 5, z: FZ + 2 },
    { type: 'health', x: 6, y: GG.struts[1] + 1, z: zN },
    { type: 'overdrive', x: 60, y: 7, z: -170 },
  ],
  backdrops: [
    { kind: 'sfSkyline', x: 560, z: 420, w: 300, d: 110, n: 18, hMin: 30, hMax: 100, salesforce: true },
    { kind: 'sfSprawl', x: 140, z: 330, yaw: -0.5, len: 520, dep: 160, n: 5, h: 45 },
    { kind: 'hills', x: -120, z: 360, len: 640, h: 60, n: 7, houses: 6, color: '#7c8a5c' },
    { kind: 'hills', x: 40, z: -560, len: 980, h: 120, n: 6, color: '#9a8a58' },
    { kind: 'hills', x: 560, z: -420, len: 420, h: 80, n: 4, color: '#6a7a52' },
    { kind: 'alcatraz', x: 430, z: -250, yaw: -0.4, s: 0.55 },
    { kind: 'fogBank', x: -480, z: -160, yaw: 1.4, s: 1.2 },
    { kind: 'fogBank', x: -360, z: 160, yaw: 1.9, s: 1 },
    { kind: 'fogBank', x: 120, z: -640, yaw: 0, s: 1.4 },
  ],
};
