// SEATTLE · Stage 1 — NEEDLE. Seattle Center on a grey morning, the plazas half-drowned by the
// risen Sound. Ride the monorail, climb the swoopy music-museum blobs, then climb the Space Needle
// itself: the lift or the service pads up to the waist ring, the pad spiral round the core, and the
// saucer's halo deck where the exit gate stands.
//
//   [arena roof] (-46,-152) 13 m                     NEEDLE (0,-112): saucer 54 m + EXIT, cap 58.5 m
//        ↑ kiosks                                     waist ring 22 m (DRIVE 3 between two lasers)
//   [glass house + PORTAL] ← kiosks ← [base 3 m] ← kiosks ← [Center station 8 m] → MoPOP blobs → DRIVE 2 (23 m)
//                                       ↑ kiosks                  ↑ the monorail (DRIVE 1 rides its roof)
//   [fountain island] ← kiosks ← [START plaza 2 m] → kiosk → [Westlake station 8 m]
import { rect, disc, box, link, bob, mv, laser } from '../kit.js';

const W = 2; // plaza decks above the flood
const N = { x: 0, z: -112 }; // the Needle's axis
const plats = [];
const P = (...a) => { plats.push(...a); return a[0]; };
// hover kiosks: the themed stepping stones over the flood (souvenir stalls on thrusters)
const kiosk = (rng, x, z, top, yaw) => rect(x, z, 2.8, 2.8, top, { thick: 2.2, yaw, style: 'seaKiosk', tint: Math.floor(rng() * 4), bob: bob(0.16, 2.8 + rng() * 1.2, rng()) });
// polar helper round the Needle (a = angle from +x toward +z)
const at = (a, r) => ({ x: N.x + Math.cos(a) * r, z: N.z + Math.sin(a) * r });
const D = Math.PI / 180;

// ---- the start plaza and the Westlake monorail station
const plaza = P(box(-14, 14, 14, 40, W, { thick: 6, style: 'seaPlaza' }));
P(rect(17, 27, 2.8, 2.8, 5, { thick: 2.2, style: 'seaKiosk', tint: 1, bob: bob(0.12, 3.2, 0.3) })); // a kiosk step up to the station
const westlake = P(rect(24, 24, 8, 16, 8, { thick: 9, style: 'monoStation', tint: 0 }));

// ---- the monorail: the beam north to Seattle Center, and the train shuttling along it
P(rect(24, -22, 1.8, 76, 8, { thick: 1.4, style: 'monoBeam' }));
const TRAIN = { amp: 30, period: 34 };
P(rect(24, -22, 3.2, 14, 11.4, { thick: 3.4, style: 'monorail', move: mv('z', TRAIN.amp, TRAIN.period, 0.25) })); // waits at Westlake at t = 0
const center = P(rect(24, -68, 8, 14, 8, { thick: 9, style: 'monoStation', tint: 1 }));

// ---- MoPOP: the music museum's swoopy blobs, stepping up to DRIVE 2
const blobs = [[35, -64, 4.5, 10.5, 0], [42, -72, 5, 13.5, 1], [50, -63, 4, 16.5, 2], [54, -76, 5, 19.5, 3], [44, -86, 4.5, 23, 4]];
const blob = blobs.map(([x, z, r, h, t]) => P(disc(x, z, r, h, { thick: h + 1, style: 'mopop', tint: t })));
P(disc(36, -50, 3.6, 5.5, { thick: 6.5, style: 'mopop', tint: 3 })); // a low swoop by the station (cover, a perch)
const top5 = blob[4];

// ---- the International Fountain, west
const fountain = P(disc(-28, -58, 10, W, { thick: 6, style: 'fountain' }));
P(disc(-28, -58, 3.2, 4.4, { thick: 2.4, style: 'fountainDome' }));

// ---- THE SPACE NEEDLE
const base = P(disc(N.x, N.z, 12, 3, { thick: 7, style: 'needleBase' }));
P(disc(N.x, N.z, 2.6, 49.5, { thick: 46.5, style: 'needleCore' })); // the core (its legs are drawn by the style)
const ring = P(disc(N.x, N.z, 6.2, 22, { thick: 1.3, style: 'needleRing' })); // the waist ring
// the exterior lift: base ↕ waist ring (bottom at t = 0)
P(rect(N.x + 8.9, N.z, 2.6, 2.6, 12.9, { thick: 0.5, style: 'needleLift', move: mv('y', 9.25, 14, 0.75) }));
// service pads, south → west: base → waist ring (they arrive outside the fenced north quadrant)
for (let i = 0; i < 5; i++) { const p = at((60 + i * 37) * D, 10.4); P(disc(p.x, p.z, 1.8, 6.4 + i * 3.4, { thick: 0.7, style: 'needlePad' })); }
// the pad spiral round the core: waist ring → saucer, widening so the last pads clear the saucer's
// rim; ~6.6 m centre to centre whatever the radius
for (let i = 1, a = -60 * D; i <= 9; i++) {
  const k = i / 9, R = 8.8 + 7.4 * Math.pow(k, 0.8);
  a += 2 * Math.asin(3.3 / R);
  const p = at(a, R);
  P(disc(p.x, p.z, 1.8, 22 + i * 3.45, { thick: 0.7, style: 'needlePad' }));
}
const saucer = P(disc(N.x, N.z, 12, 54, { thick: 4.5, style: 'needleSaucer' }));
P(disc(N.x, N.z, 5, 58.5, { thick: 4.5, style: 'needleCap' })); // the halo roof, its spire above
// a skybridge of drone pads from the top of MoPOP straight to the waist ring (skip the lower climb)
P(...link(4011, top5, ring, { make: (rng, x, z, top) => disc(x, z, 1.9, top, { thick: 0.7, style: 'needlePad' }), maxStep: 7 }));

// ---- kiosk chains over the flood
const glass = P(rect(-42, -112, 14, 10, 6, { thick: 6, style: 'glasshouse' }));
const arena = P(rect(-46, -152, 26, 18, 13, { thick: 13, style: 'arenaRoof' }));
P(...link(4012, plaza, fountain, { make: kiosk }));
P(...link(4013, fountain, base, { make: kiosk }));
P(...link(4014, center, base, { make: kiosk }));
P(...link(4015, base, glass, { make: kiosk }));
P(...link(4016, glass, arena, { make: kiosk, maxRise: 3.4 }));

const ringPt = (a, r = 4.4, up = 0) => ({ x: N.x + Math.cos(a * D) * r, y: 22 + up, z: N.z + Math.sin(a * D) * r });
const radial = (a, period, phase) => { const p = ringPt(a); return laser(p.x, 22, p.z, 3.6, 2.4, -a * D, period, 0.5, phase); };

export default {
  id: 'seattle-needle', name: 'NEEDLE', sub: 'SEATTLE CENTER · 22:10 · RAIN', theme: 'seaNeedle', song: 'emeraldDrizzle',
  seed: 4001, par: 270, killY: -0.6, water: 0,
  start: { x: 0, y: W, z: 32, yaw: 0 },
  plats,
  lasers: [
    laser(24, 8, 19, 8, 2.4, 0, 3, 0.5, 0), // Westlake platform, by the train doors: jump it or time it
    radial(-45, 3.2, 0), radial(-135, 3.2, 0.5), // the waist ring: DRIVE 3 sits between two radial curtains
    laser(44, 23, -82.6, 8, 2.4, 0, 2.8, 0.5, 0.25), // the top blob, in front of DRIVE 2
    laser(-28, W, -66, 14, 2.4, 0, 3.4, 0.5, 0.6), // across the fountain
  ],
  drives: [
    { x: 24, y: 11.4 + 1.1, z: -22 + TRAIN.amp + 3 }, // riding the monorail's roof
    { x: 44, y: 23 + 1.1, z: -87 }, // top of MoPOP
    { ...ringPt(-90, 4.4, 1.1) }, // the Needle's waist ring
  ],
  exit: { x: N.x, y: 54, z: N.z - 9, yaw: 0 }, // on the saucer's halo deck
  portal: { x: -44, y: 6 + 1.4, z: -112 },
  bonusStyle: { theme: 'seaBonus', music: 'serverRush', weapon: 'spread', tag: 'EMERALD α' },
  enemies: [
    { type: 'walker', x: 8, y: W, z: 18 },
    { type: 'guard', x: 26, y: 8, z: 28 },
    { type: 'walker', x: 24, y: 11.4, z: -22 + TRAIN.amp - 3 }, // rides the train
    { type: 'drone', x: 30, y: 16, z: -28 },
    { type: 'spiker', x: 42, y: 13.5, z: -72 },
    { type: 'guard', x: 55, y: 19.5, z: -76 },
    { type: 'drone', x: 34, y: 28, z: -94 },
    { type: 'walker', x: -22, y: W, z: -54 },
    { type: 'turret', x: -6, y: 3, z: -103 },
    { type: 'turret', ...ringPt(125) },
    { type: 'drone', x: 13, y: 38, z: -102 },
    { type: 'drone', x: -12, y: 50, z: -124 },
    { type: 'guard', x: 6, y: 54, z: -106 },
    { type: 'turret', x: -52, y: 13, z: -156 },
  ],
  pickups: [
    { type: 'health', x: 22, y: 9, z: 28 },
    { type: 'spread', x: -34, y: W + 1, z: -54 },
    { type: 'rapid', x: 50, y: 17.5, z: -63 },
    { type: 'rocket', x: -40, y: 14, z: -148 },
    { type: 'healthBig', x: -38, y: 7, z: -112 },
    { type: 'health', ...ringPt(30, 4.4, 1) },
    { type: 'overdrive', x: N.x + 2.6, y: 59.5, z: N.z },
    { type: 'slowmo', x: 24, y: 9, z: -72 },
  ],
  backdrops: [
    { kind: 'rainier', x: 430, y: -30, z: 560, r: 380, h: 270, snow: 0.5, color: '#56626a' }, // Rainier, south-east, through the haze
    { kind: 'skyline', x: 60, y: -2, z: 430, w: 320, d: 90, n: 22, hMin: 30, hMax: 120, color: '#8a9496', haze: 0.62 }, // downtown, south
    { kind: 'hills', x: -260, y: -6, z: -360, len: 520, h: 60, n: 6, color: '#4e6450', houses: 4 }, // Queen Anne
    { kind: 'mountain', x: -720, y: -20, z: -120, r: 170, h: 110, snow: 0.5, color: '#5e6a72' }, // the Olympics, west over the Sound
    { kind: 'mountain', x: -700, y: -20, z: 120, r: 150, h: 90, snow: 0.5, color: '#5e6a72' },
    { kind: 'mountain', x: -760, y: -20, z: -330, r: 140, h: 95, snow: 0.45, color: '#5e6a72' },
  ],
};
