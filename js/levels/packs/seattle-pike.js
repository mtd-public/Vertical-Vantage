// SEATTLE · Stage 2 — PIKE PLACE. The waterfront in the drizzle, mid-afternoon. Piers on the Sound,
// the Great Wheel turning (DRIVE 1 rides a gondola), car ferries crossing the bay (DRIVE 2 on the
// far one), and up the hillclimb onto the market roofs, where the big neon sign stands (DRIVE 3 on
// its catwalk). VENTI CORP's hover cups lead up to the exit on the tower north of the market. The
// gum-wall alley hides the portal.
//
//   bay (west)            piers          promenade   hillclimb   market roofs                downtown
//                       [pier 66]            |                    [corner market 19 m]
//   <~~ ferry B ~~>     [pier 62]            |                    [arcade 15 m + SIGN 23 m (DRIVE 3)]  [gum alley 8 m + PORTAL]
//                       [pier 57 + GREAT WHEEL (DRIVE 1)]   ← cups from the wheel's top → arcade
//   <~~ ferry A ~~>       (slip)              |   steps 5.5 / 9 / 12.5 →
//                       [pier 54 START]       |                     EXIT tower (32, -142) 38 m ← cups
import { rect, disc, box, tower, link, chain, bob, mv, orbit, laser } from '../kit.js';

const W = 2; // pier and promenade decks above the water
const plats = [];
const P = (...a) => { plats.push(...a); return a[0]; };
const cup = (rng, x, z, top) => disc(x, z, 1.5, top, { thick: 2.8, style: 'ventiCup', tint: Math.floor(rng() * 3), bob: bob(0.18, 2.8 + rng(), rng()) });

// ---- the waterfront: promenade, piers and their sheds
const prom = P(box(-10, 2, -126, 46, W, { thick: 7, style: 'seaPromenade' }));
P(box(-44, -10, 24, 40, W, { thick: 7, style: 'seaPier' })); // pier 54 (start)
const p57 = P(box(-46, -10, -20, -2, W, { thick: 7, style: 'seaPier' })); // pier 57 (the wheel)
const p62 = P(box(-44, -10, -66, -52, W, { thick: 7, style: 'seaPier' }));
P(box(-40, -10, -112, -98, W, { thick: 7, style: 'seaPier' }));
P(rect(-22, 32, 10, 8, 6.5, { thick: 4.5, style: 'pierShed', tint: 0 })); // ACRES OF SPAM
P(rect(-27, -59, 12, 8, 7, { thick: 5, style: 'pierShed', tint: 1 })); // the aquarium
P(rect(-24, -105, 10, 8, 7.5, { thick: 5.5, style: 'pierShed', tint: 2 }));

// ---- the Great Wheel on pier 57: ten gondolas round a 15 m wheel (you ride their roofs)
const HUB = { x: -30, y: 21, z: -11 }, WR = 15, WP = 36;
P(disc(HUB.x, HUB.z, 1.4, HUB.y + 0.7, { thick: 1.4, style: 'wheelHub' }));
for (let i = 0; i < 10; i++) P(rect(HUB.x, HUB.z, 2.4, 2.4, HUB.y, { thick: 2.2, style: 'seaGondola', tint: i, move: orbit('xy', WR, WP, i / 10) })); // (gondola 0 is at three o'clock at t = 0)
// from the wheel's one o'clock, a skyway of VENTI cups down to the market roof
const arcade = P(box(20, 40, -90, -20, 15, { thick: 22, style: 'marketRoof' }));
P(...chain(4021, { x: HUB.x + WR * 0.5, y: HUB.y + WR * 0.87, z: HUB.z }, { x: 20.5, y: 15, z: -26 }, { make: cup, maxStep: 7 }));

// ---- the ferries crossing Elliott Bay (long axis along x, travelling in x)
const FA = { x: -90, z: 13, amp: 34, period: 64, phase: 0 }, FB = { x: -96, z: -42, amp: 34, period: 70, phase: 0 }; // both head for the piers first
for (const F of [FA, FB]) P(rect(F.x, F.z, 30, 12, 7, { thick: 6.5, style: 'seaFerry', tint: F === FA ? 0 : 1, move: mv('x', F.amp, F.period, F.phase), bob: bob(0.12, 5, F.phase) }));
const fx = (F) => F.x + F.amp * Math.sin(2 * Math.PI * F.phase); // where a ferry is at t = 0

// ---- the hillclimb up the bluff, the market, the sign
P(box(2, 8, -42, -26, 5.5, { thick: 12, style: 'hillclimb' }), box(8, 14, -42, -26, 9, { thick: 16, style: 'hillclimb' }), box(14, 20, -42, -26, 12.5, { thick: 20, style: 'hillclimb' }));
const sign = P(rect(22, -56, 2.4, 28, 23, { thick: 6, style: 'marketSign' })); // stands on the arcade's west edge
P(disc(28, -61, 1.5, 19, { thick: 2.8, style: 'ventiCup', tint: 0, bob: bob(0.15, 3.2, 0.2) })); // cups up onto the sign
P(disc(27.5, -50, 1.5, 19.6, { thick: 2.8, style: 'ventiCup', tint: 1, bob: bob(0.15, 2.9, 0.6) }));
const corner = P(box(20, 36, -112, -94, 19, { thick: 26, style: 'brickBlock', tint: 0 }));
P(box(40, 46, -72, -40, 8, { thick: 15, style: 'gumAlley' })); // Post Alley: the gum wall
P(box(46, 66, -98, -28, 21, { thick: 28, style: 'brickBlock', tint: 1 }));
P(disc(32, -38, 4, 26, { thick: 8, style: 'ventiGiant', bob: bob(0.25, 4.5, 0) })); // the world's largest VENTI, hovering over the market
P(...chain(4022, { x: 25, y: 15, z: -24 }, { x: 29.6, y: 26, z: -35 }, { make: cup, maxRise: 3.6 }));

// ---- north: the exit tower, reached by cups from the corner market or the sign
const exitT = P(tower(32, -142, 16, 16, 38, { tint: 6, style: 'seaTower' }));
P(...link(4023, corner, exitT, { make: cup, maxRise: 3.5 }));
P(...chain(4024, { x: 22, y: 23, z: -69 }, { x: 30, y: 19, z: -93 }, { make: cup }));

// ---- downtown east of the market (scenery you can still land on)
for (const [x, z, w, d, h, t] of [[84, -40, 18, 18, 46, 2], [90, -90, 16, 20, 58, 4], [80, 10, 16, 16, 34, 1], [112, -132, 20, 16, 72, 3], [122, -58, 18, 18, 64, 5],
  [116, 2, 16, 16, 52, 0], [74, -168, 14, 14, 44, 6], [104, 44, 20, 16, 40, 7], [146, -100, 18, 18, 90, 2], [150, -20, 20, 20, 76, 5], [60, 60, 16, 14, 26, 3]]) P(tower(x, z, w, d, h, { tint: t, style: 'seaTower' }));

export default {
  id: 'seattle-pike', name: 'PIKE PLACE', sub: 'WATERFRONT · 00:20 · DRIZZLE', theme: 'seaPike', song: 'emeraldDrizzle',
  seed: 4002, par: 300, killY: -0.6, water: 0,
  start: { x: -34, y: W, z: 34, yaw: 0.25 },
  plats,
  lasers: [
    laser(-4, W, -32, 12, 2.4, 0, 3, 0.5, 0), // across the promenade by the hillclimb
    laser(22, 23, -60, 2.4, 2.6, 0, 2.8, 0.5, 0.3), // on the sign's catwalk, in front of DRIVE 3
    laser(30, 15, -70, 20, 2.6, 0, 3.4, 0.5, 0.6), // across the arcade roof
    laser(28, 19, -103, 16, 2.6, 0, 3, 0.5, 0.15), // the corner market roof
  ],
  drives: [
    { x: HUB.x + WR, y: HUB.y + 1.1, z: HUB.z }, // riding gondola 0 round the wheel
    { x: fx(FB) + 6, y: 7 + 1.1, z: FB.z }, // ferry B, out in the bay
    { x: 22, y: 23 + 1.1, z: -66 }, // the market sign's catwalk
  ],
  exit: { x: 32, y: 38, z: -142, yaw: 0 },
  portal: { x: 43, y: 8 + 1.4, z: -56 },
  bonusStyle: { theme: 'seaBonus', music: 'serverRush', weapon: 'rapid', tag: 'EMERALD β' },
  enemies: [
    { type: 'walker', x: -38, y: W, z: 36 },
    { type: 'drone', x: -30, y: 10, z: 12 },
    { type: 'guard', x: -4, y: W, z: 0 },
    { type: 'drone', x: -16, y: 27, z: -8 },
    { type: 'walker', x: fx(FA) + 6, y: 7, z: FA.z }, // rides ferry A
    { type: 'guard', x: fx(FB) - 6, y: 7, z: FB.z }, // rides ferry B
    { type: 'drone', x: -66, y: 14, z: -30 },
    { type: 'walker', x: -36, y: W, z: -55 },
    { type: 'turret', x: 36, y: 15, z: -26 },
    { type: 'spiker', x: 30, y: 15, z: -80 },
    { type: 'guard', x: 32, y: 19, z: -108 },
    { type: 'drone', x: 40, y: 30, z: -122 },
    { type: 'turret', x: 27, y: 38, z: -147 },
  ],
  pickups: [
    { type: 'health', x: -14, y: W + 1, z: -6 },
    { type: 'spread', x: -4, y: W + 1, z: -62 },
    { type: 'rapid', x: fx(FA) - 6, y: 8, z: FA.z }, // on ferry A's deck
    { type: 'rocket', x: 24, y: 20, z: -108 },
    { type: 'healthBig', x: 43, y: 9, z: -68 },
    { type: 'slowmo', x: 36, y: 16, z: -50 },
    { type: 'health', x: 32, y: 27, z: -38 }, // on the giant cup
  ],
  backdrops: [
    { kind: 'rainier', x: 520, y: -30, z: 600, r: 400, h: 280, snow: 0.5, color: '#161a28', glow: 1, snowColor: '#3a4462', rim: '#a4b0d0', haze: 0.3 }, // Rainier, a moonlit ghost
    { kind: 'spaceNeedle', x: 70, y: -8, z: -640, s: 0.6 }, // the Needle, north over Belltown
    { kind: 'portCranes', x: -40, y: 0, z: 330, n: 4, haze: 0.5 }, // the port, south
    { kind: 'seaHills', x: -420, y: -4, z: -40, len: 520, h: 46, n: 7, lights: 18, color: '#141c22' }, // Bainbridge, across the Sound
    { kind: 'mountain', x: -760, y: -20, z: -200, r: 170, h: 120, snow: 0.5, color: '#5e6a72' }, // the Olympics
    { kind: 'mountain', x: -740, y: -20, z: 60, r: 160, h: 100, snow: 0.5, color: '#5e6a72' },
    { kind: 'seaSkyline', x: 300, y: -2, z: -40, w: 160, d: 300, n: 20, hMin: 40, hMax: 140 }, // downtown, east, lit
    { kind: 'seaBeams', x: 300, y: 0, z: -40, pts: [[0, 0, -120], [-20, 0, 60]], len: 300, r: 14, color: '#ffc8d8', opacity: 0.18 },
  ],
};
