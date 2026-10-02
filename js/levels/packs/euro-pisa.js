// NEO EURO · stage 1 — PISA. The Field of Miracles at noon, 2099: a green lawn of white marble,
// tourists' selfie-drones everywhere and hover-Vespas parked in the air. The on-ramp of the pack.
//
// Map (north = -Z, up the page):
//
//   [NW wall tower + PORTAL]══ city wall walk (11 m) ══════[tower]════[tower]═══════
//    ║            [CAMPOSANTO roof 10 m · hover tour-bus with DRIVE 3 rides over it]
//    ║                                   [north transept]
//   [BAPTISTERY]  [facade]══ NAVE 17 m (EXIT) ══[DOME 21→28]══[apse 15]  ⟋ LEANING TOWER
//    drum 12 → dome steps → lantern     [south transept]          ⟋  ledges spiral up;
//    DRIVE 2 (23.4 m)                                           ⟋   DRIVE 1 on the belfry (38 m)
//                         lawn               START
import { rect, disc, box, car, chain, link, bob, mv, laser, yawTo } from '../kit.js';
import { vespa, makeVespa } from './euro-kit.js';

const plats = [];
const P = (...a) => plats.push(...a);

// ---- the ground: the paved town under everything, the lawn of the Campo on it
P(rect(0, -10, 560, 520, -0.4, { thick: 3, style: 'euroStreet' }));
P(box(-100, 100, -82, 60, 0, { thick: 2, style: 'lawn' }));

// ---- the medieval walls along the north and west (walkable 11 m walks, square towers)
const WALL = 11;
const wall = (x0, x1, z0, z1) => box(x0, x1, z0, z1, WALL, { thick: WALL + 0.4, style: 'cityWall' });
const wtower = (x, z, s, top) => rect(x, z, s, s, top, { thick: top + 0.4, style: 'wallTower' });
P(wtower(-98, -80, 10, 18)); // the NW corner tower: the PORTAL
P(wall(-93, -42, -82, -78), wtower(-38, -80, 8, 15), wall(-34, 20, -82, -78), wtower(24, -80, 8, 15), wall(28, 64, -82, -78));
P(wall(-100, -96, -75, -28), wtower(-98, -24, 8, 15), wall(-100, -96, -20, 24), wtower(-98, 28, 8, 15), wall(-100, -96, 32, 44));
// hover-Vespas up to the corner tower from the walks
P(vespa(-86, -73, 14.6, Math.PI / 2, { tint: 2 }), vespa(-91, -66, 14.2, 0, { tint: 4 }));

// ---- the BAPTISTERY: an arcaded drum, its upper gallery, a stepped dome and the lantern (DRIVE 2)
const BX = -56, BZ = -16;
P(disc(BX, BZ, 10, 12, { thick: 12.4, style: 'baptistery' }));
P(disc(BX, BZ, 8, 16, { thick: 4, style: 'baptisteryUpper' }));
P(disc(BX, BZ, 6.2, 19, { thick: 3, style: 'dome', tint: 0 }));
P(disc(BX, BZ, 4.1, 21.4, { thick: 2.4, style: 'dome', tint: 0 }));
P(disc(BX, BZ, 1.9, 23.4, { thick: 2, style: 'lantern' }));
// Vespas spiral up to the drum from the lawn (south-east of it)
P(vespa(-41, -2, 3.2, yawTo(-1, -0.3), { tint: 1 }), vespa(-45, 4, 6.4, yawTo(-1, 0), { tint: 3 }), vespa(-52, 1.5, 9.4, yawTo(-0.4, -1), { tint: 5 }));

// ---- the DUOMO: nave (17 m, the EXIT), aisles (11), transept arms (15), facade (21), dome, apse
P(box(-36, 12, -23, -9, 17, { thick: 17.4, style: 'duomo' }));
P(box(-36, -6, -9, -3, 11, { thick: 11.4, style: 'duomoAisle' }), box(8, 12, -9, -3, 11, { thick: 11.4, style: 'duomoAisle' }));
P(box(-36, -6, -29, -23, 11, { thick: 11.4, style: 'duomoAisle' }), box(8, 12, -29, -23, 11, { thick: 11.4, style: 'duomoAisle' }));
P(box(-6, 8, -42, -23, 15, { thick: 15.4, style: 'transept' }), box(-6, 8, -9, 10, 15, { thick: 15.4, style: 'transept' }));
P(box(-39, -36, -29, -3, 21, { thick: 21.4, style: 'duomoFacade' }));
P(disc(1, -16, 6.5, 21, { thick: 4, style: 'domeDrum' }));
P(disc(1, -16, 5.2, 24, { thick: 3, style: 'dome', tint: 1 }), disc(1, -16, 3.3, 26.4, { thick: 2.4, style: 'dome', tint: 1 }), disc(1, -16, 1.4, 28.4, { thick: 2, style: 'lantern' }));
P(disc(12, -16, 7, 15, { thick: 15.4, style: 'apse' }));
// Vespas from the lawn to the south aisle roof
P(...chain(6011, { x: -26, y: 0, z: 14 }, { x: -24, y: 11, z: -4 }, { make: makeVespa, wobble: 2.5, maxRise: 3.4 }));

// ---- the CAMPOSANTO: the long cloister along the north (10 m), a hover tour-bus over it (DRIVE 3)
const CAMPO = 10;
P(box(-52, 26, -66, -50, CAMPO, { thick: CAMPO + 0.4, style: 'camposanto' }));
P(car('bus', -14, -58, CAMPO + 5.2, Math.PI / 2, { move: mv('x', 24, 16, 0), bob: bob(0.12, 4, 0) }));
P(...chain(6012, { x: -44, y: 0, z: -30 }, { x: -44, y: CAMPO, z: -51 }, { make: makeVespa, wobble: 2, maxRise: 3.4 })); // lawn → roof
P(...chain(6013, { x: -20, y: 11, z: -29 }, { x: -20, y: CAMPO, z: -50 }, { make: makeVespa })); // north aisle → roof

// ---- the LEANING TOWER: eight storeys, each a little further out toward the south-east.
// Gallery ledges (and a few parked Vespas) spiral up round it to the belfry (DRIVE 1).
const TB = { x: 52, z: -22 }, LEAN = [0.8, 0.6], SHIFT = 0.8; // metres per storey along LEAN
export const PISA_STOREYS = [];
for (let k = 0; k <= 7; k++) {
  const r = k === 0 ? 7.2 : k === 7 ? 4.4 : 6.6;
  const top = k === 0 ? 7 : k === 7 ? 38 : 7 + 4.4 * k;
  const thick = k === 0 ? 7.4 : k === 7 ? 4.6 : 4.4;
  PISA_STOREYS.push({ x: TB.x + LEAN[0] * SHIFT * k, z: TB.z + LEAN[1] * SHIFT * k, r, top, thick, k });
}
// tint carries the lean to the render style: the arcades lean by tint / 100 metres per metre of height
for (const S of PISA_STOREYS) P(disc(S.x, S.z, S.r, S.top, { thick: S.thick, style: S.k === 7 ? 'pisaBelfry' : 'pisa', tint: Math.round((SHIFT / 4.4) * 100) }));
const storeyAt = (y) => PISA_STOREYS.find((S) => y <= S.top) || PISA_STOREYS[7];
function nearestOnRect(cx, cz, ux, uz, hw, hd, px, pz) { // distance from a point to a rect (axes u = tangent, v = radial)
  const dx = px - cx, dz = pz - cz, lu = dx * ux + dz * uz, lv = dx * uz - dz * ux;
  const qu = Math.max(-hw, Math.min(hw, lu)), qv = Math.max(-hd, Math.min(hd, lv));
  return Math.sqrt((lu - qu) * (lu - qu) + (lv - qv) * (lv - qv));
}
const LEDGES = [];
{
  const a0 = (125 * Math.PI) / 180, da = (48 * Math.PI) / 180;
  for (let k = 0; k <= 12; k++) {
    const y = 2.8 + 2.7 * k, a = a0 + da * k, S = storeyAt(y);
    const rx = Math.cos(a), rz = Math.sin(a), ux = -rz, uz = rx; // radial and tangent
    let R = S.r + 1.4;
    for (let it = 0; it < 60; it++, R += 0.1) { // clear of every storey this ledge (and you on it) overlaps in height
      const cx = S.x + rx * R, cz = S.z + rz * R;
      const clear = PISA_STOREYS.every((T) => T.top < y - 0.7 || T.top - T.thick > y + 2.0 || nearestOnRect(cx, cz, ux, uz, 1.9, 1.2, T.x, T.z) >= T.r + 0.25);
      if (clear) break;
    }
    const x = S.x + rx * R, z = S.z + rz * R;
    LEDGES.push({ x, z, y, a });
    if (k % 4 === 3) P(vespa(x, z, y, yawTo(ux, uz), { tint: k % 6 })); // a parked Vespa on the way up
    else P(rect(x, z, 3.4, 2.4, y, { thick: 0.7, yaw: yawTo(rx, rz), style: 'pisaLedge' }));
  }
}
// a Vespa run from the apse roof to the tower's west ledges (a shortcut from the cathedral)
P(...chain(6014, { x: 18.5, y: 15, z: -16 }, { x: LEDGES[8].x - 2, y: LEDGES[8].y, z: LEDGES[8].z }, { make: makeVespa, wobble: 1.6 }));

// ---- dressing you can stand on: souvenir kiosks and a fountain on the lawn
P(rect(-22, 30, 6, 4, 3, { thick: 3.4, style: 'kiosk', tint: 0 }), rect(24, 28, 6, 4, 3, { thick: 3.4, style: 'kiosk', tint: 1 }), rect(30, 2, 6, 4, 3, { thick: 3.4, style: 'kiosk', tint: 2 }));
P(disc(-30, -44, 3.2, 1.4, { thick: 1.8, style: 'fountain' }));

const T1 = PISA_STOREYS[7];
const lasers = [
  laser(-10, 17, -16, 14, 2.6, Math.PI / 2, 3.2, 0.5, 0), // two curtains out of step across the nave
  laser(-15, 17, -16, 14, 2.6, Math.PI / 2, 3.2, 0.5, 0.5),
  laser(-26, CAMPO, -58, 16, 2.6, Math.PI / 2, 3, 0.5, 0.25), // across the Camposanto roof
  laser(-78, WALL, -80, 4, 2.4, Math.PI / 2, 2.6, 0.5, 0), // the north walk, before the corner tower
  laser(-98, WALL, -50, 4, 2.4, 0, 2.6, 0.5, 0.5), // the west walk
];

export default {
  id: 'euro-pisa', name: 'PISA', sub: 'CAMPO DEI MIRACOLI · 22:10 · PROJECTION SHOW', theme: 'euroPisa', song: 'grandTour',
  seed: 6001, par: 300, killY: -12,
  start: { x: 0, y: 0, z: 46, yaw: 0 },
  plats, lasers,
  drives: [
    { x: T1.x, y: T1.top + 1.1, z: T1.z }, // the top of the Leaning Tower
    { x: BX, y: 23.4 + 1.1, z: BZ }, // the Baptistery's lantern
    { x: -14, y: CAMPO + 5.2 + 1.1, z: -58 }, // riding the tour-bus over the Camposanto
  ],
  exit: { x: -24, y: 17, z: -16, yaw: Math.PI / 2 },
  portal: { x: -98, y: 18 + 1.4, z: -80 },
  bonusStyle: { theme: 'euroBonusPisa', weapon: 'spread', tag: 'TORRE' },
  enemies: [
    { type: 'guard', x: -14, y: 0, z: 14 },
    { type: 'guard', x: 1, y: 15, z: 4 },
    { type: 'guard', x: 20, y: CAMPO, z: -56 },
    { type: 'guard', x: -60, y: WALL, z: -80 },
    { type: 'turret', x: 10, y: 17, z: -11 },
    { type: 'turret', x: -37.5, y: 21, z: -24 },
    { type: 'walker', x: -21, y: 11, z: -6 },
    { type: 'walker', x: -24, y: CAMPO, z: -58 },
    { type: 'spiker', x: -8, y: WALL, z: -80 },
    { type: 'drone', x: 40, y: 14, z: -8 },
    { type: 'drone', x: 66, y: 24, z: -26 },
    { type: 'drone', x: 48, y: 33, z: -34 },
    { type: 'drone', x: -42, y: 9, z: 6 },
    { type: 'drone', x: 8, y: 27, z: -4 },
  ],
  pickups: [
    { type: 'health', x: -36, y: 1, z: 14 },
    { type: 'spread', x: -28, y: 12, z: -6 },
    { type: 'rapid', x: -40, y: CAMPO + 1, z: -58 },
    { type: 'rocket', x: 1, y: 29.4, z: -16 },
    { type: 'healthBig', x: -95, y: 19, z: -77 },
    { type: 'health', x: LEDGES[6].x, y: LEDGES[6].y + 1, z: LEDGES[6].z },
    { type: 'slowmo', x: BX, y: 17, z: BZ + 7 },
    { type: 'overdrive', x: 16, y: 16, z: -16 },
  ],
  backdrops: [
    { kind: 'tuscanHills', x: 0, y: -1, z: -560, s: 1 },
    { kind: 'tuscanHills', x: 520, y: -1, z: 80, yaw: Math.PI / 2, s: 0.9 },
    { kind: 'mountain', x: 380, y: -2, z: -620, r: 260, h: 170, snow: 0.22, color: '#8a9298' }, // the Apuan Alps (marble country)
    { kind: 'mountain', x: -160, y: -2, z: -700, r: 220, h: 120, snow: 0.15, color: '#7e8a8e' },
    { kind: 'euroRoofs', x: 0, y: -0.4, z: 0, r0: 150, r1: 250, n: 70, seed: 61 },
  ],
};
