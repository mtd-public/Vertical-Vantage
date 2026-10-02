// NEW SAN FRANCISCO backdrops: render-only landmarks 300–800 m out, unfogged and hazed toward the
// horizon with B.c(hex). Each is built in real-world-ish metres; the level scales it with `s`.
// After dark (theme night ≥ 0.5) they light up: the city is the show.
//   goldenGate    the bridge: two art-deco towers, main cables swooping between them, suspenders,
//                 the deck and its truss, side spans, anchorages and approach viaducts (along local x).
//                 Night: floodlit towers, a necklace of cable lights, sodium deck lamps, the traffic's
//                 light streams, blinking aviation beacons
//   alcatraz      the island: cliffs, the cellhouse, the lighthouse, the water tower, the dock (night:
//                 lit windows, the lighthouse beam turning)
//   fogBank       Karl the Fog: a bank of cloud rolling over the water / the hills (night: lit rose and
//                 amber from the city underneath)
//   sutro         Sutro Tower: the red-and-white three-legged mast on its hill (night: blinking red)
//   transamerica  the pyramid and its spire (night: lit floors, its edges traced in light)
//   sfSprawl      the city's hills of little houses (night: lit windows and a glowing street grid)
//   sfSkyline     downtown (night: lit floors, neon crowns, beacons, the Salesforce tower's LED crown)
//   sfHills / sfBeacons / sfBeams   lit hills, blinking beacons, sweeping searchlights (sanfran-night.js)
import { beacons, searchlights, litHills, paint } from './sanfran-night.js';

const isNight = (B) => B.night >= 0.5;

// A rod from a to b (backdrop units), radius r.
function rod(B, a, b, r, color, n = 5) {
  const T = B.THREE, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-3;
  const g = B.prep(new T.CylinderGeometry(r, r, len, n), color);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx / len, dy / len, dz / len)));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}
const lerpC = (B, a, b, t) => new B.THREE.Color(a).lerp(new B.THREE.Color(b), Math.max(0, Math.min(1, t))).getHex();

function goldenGate(o, th, B) {
  const K = new B.Kit(), T = B.THREE, N = isNight(B);
  const k = o.orange ?? -0.14; // the bridge cuts through the haze a little better than the hills
  const or = B.c('#c0362c', k), orHi = B.c('#d8503a', k), orDk = B.c(N ? '#3a120e' : '#8c2820', k), con = B.c('#d6cec0', k);
  const DECK = 67, TOP = 227, X = 640, SIDE = 345, ZL = 16, END = X + SIDE;
  // floodlit orange: unlit, brightest at the water, fading up the towers (hazed like the rest)
  const flood = (y) => B.c(lerpC(B, '#ff8040', '#8a2a18', y / (TOP + 10)), k);
  const lit = (g) => (N ? paint(g, (x, y) => flood(y)) : g);
  const towerKey = N ? 'glow' : 'solid';
  // the deck and its stiffening truss, out to both shores
  K.add('solid', B.box(2 * (END + 260), 3.5, 27, { y: DECK - 1.75, color: orHi }));
  K.add('solid', B.box(2 * (END + 260), 7.6, 24, { y: DECK - 7.3, color: orDk }));
  for (let x = -END - 240; x <= END + 240; x += 24) K.add('solid', B.box(2, 7.6, 25, { x, y: DECK - 7.3, color: or }));
  // the approach viaducts: concrete piers, and the steel arch over Fort Point at the south end
  for (let x = END + 30; x < END + 260; x += 45) for (const sx of [-1, 1]) K.add('solid', B.box(8, DECK - 8, 8, { x: sx * x, y: (DECK - 8) / 2, color: con }));
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI, a1 = ((i + 1) / 12) * Math.PI, R = 110, cx = END + 120, y0 = DECK - 52;
    for (const sz of [-10, 10]) K.add('solid', rod(B, [cx + Math.cos(a0) * R, y0 + Math.sin(a0) * 42, sz], [cx + Math.cos(a1) * R, y0 + Math.sin(a1) * 42, sz], 3, or));
  }
  // the towers: four stepped sections per leg, five portal struts, a fender at the waterline
  const beaconPts = [];
  for (const tx of [-X, X]) {
    for (const sz of [-1, 1]) {
      for (const [y0, y1, w, d] of [[0, 75, 13, 19], [75, 135, 12, 17], [135, 185, 11, 15], [185, TOP, 10, 13]]) {
        K.add(towerKey, lit(B.box(w, y1 - y0, d, { x: tx, y: (y0 + y1) / 2, z: sz * ZL, color: or })));
        K.add('solid', B.box(w + 1, 2.5, d + 1, { x: tx, y: y1 - 1.2, z: sz * ZL, color: N ? orDk : orHi }));
      }
      K.add('solid', B.box(13.4, TOP - 30, 2.2, { x: tx, y: TOP / 2, z: sz * (ZL + 9.6), color: orDk })); // the fluting on the outer faces
      if (N) beaconPts.push([tx, TOP + 3, sz * ZL], [tx + 7, 150, sz * (ZL + 10)], [tx - 7, 150, sz * (ZL + 10)]);
      else K.add('glow', B.box(3, 3, 3, { x: tx, y: TOP + 2, z: sz * ZL, color: '#ff4030' }));
    }
    for (const [y, h] of [[DECK - 10, 9], [116, 10], [162, 9], [204, 9], [TOP - 7, 14]]) {
      K.add(towerKey, lit(B.box(9, h, 2 * ZL - 10, { x: tx, y, color: or })));
      K.add('solid', B.box(9.4, h * 0.45, 2 * ZL - 14, { x: tx, y: y - h * 0.5 - h * 0.2, color: orDk })); // the stepped art-deco portal under it
    }
    K.add('solid', B.box(44, 14, 70, { x: tx, y: 3, color: con }));
    if (N) K.add('glow', B.box(46, 2, 72, { x: tx, y: 10.5, color: '#ffb060' })); // the fender's floodlights
  }
  // main cables and suspenders: the main span is a parabola saddle to saddle; the side spans sag to the anchorages
  const yMain = (x) => DECK + 6 + (TOP + 2 - DECK - 6) * (x / X) * (x / X);
  const ySide = (x) => { const t = (END - Math.abs(x)) / SIDE; return DECK + 6 + (TOP + 2 - DECK - 6) * Math.pow(t, 1.35); };
  const yAt = (x) => (Math.abs(x) <= X ? yMain(x) : ySide(x));
  for (const sz of [-1, 1]) {
    const z = sz * ZL;
    const N2 = 48;
    for (let i = 0; i < N2; i++) { const xa = -END + (2 * END * i) / N2, xb = -END + (2 * END * (i + 1)) / N2; K.add('solid', rod(B, [xa, yAt(xa), z], [xb, yAt(xb), z], 3.6, or)); }
    for (let x = -END + 20; x < END - 10; x += 22) {
      if (Math.abs(Math.abs(x) - X) < 14) continue;
      const top = yAt(x) - 3;
      if (top - DECK < 6) continue;
      K.add('solid', B.box(1.6, top - DECK, 1.6, { x, y: (top + DECK) / 2, z, color: orHi }));
    }
    if (N) { // the cable lights, and the deck's sodium lamps
      for (let x = -END + 11; x < END; x += 22) if (Math.abs(Math.abs(x) - X) > 10) K.add('glow', B.box(5, 5, 5, { x, y: yAt(x) + 3.5, z: z + sz * 2, color: '#fff2d0' }));
      for (let x = -END - 240; x <= END + 240; x += 30) K.add('glow', B.box(6, 3, 3, { x, y: DECK + 4, z: sz * 13.5, color: '#ffb860' }));
    }
  }
  if (N) { // the traffic: long-exposure streams of headlights one way and tail lights the other
    for (const [z, c] of [[-6, '#fff4e0'], [-3, '#ffe6c0'], [3, '#ff3a2a'], [6, '#ff5a3a']]) K.add('glow', B.box(2 * (END + 250), 1.2, 1.4, { y: DECK + 1.2, z, color: c }));
  }
  for (const sx of [-1, 1]) { // anchorages
    K.add('solid', B.box(48, 34, 60, { x: sx * (END + 18), y: 17, color: con }), B.box(52, 4, 64, { x: sx * (END + 18), y: 35, color: B.c('#b8ae9c', k) }));
  }
  const g = B.mesh(K);
  if (N) g.add(beacons({ pts: beaconPts, size: 6, rate: 0.6, phase: (o.x || 0) * 0.01 }, th, B));
  return g;
}

function alcatraz(o, th, B) {
  const K = new B.Kit(), T = B.THREE, N = isNight(B);
  const rock = B.c('#7a6c58'), cliff = B.c('#94846a'), green = B.c('#5e6c3e'), wall = B.c('#e6dece'), dark = B.c('#4a4a52');
  K.add('solid', B.part(new T.SphereGeometry(1, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { sx: 150, sy: 34, sz: 60, color: cliff }));
  K.add('solid', B.part(new T.SphereGeometry(1, B.seg(10, 7), B.seg(5, 3), 0, Math.PI * 2, 0, Math.PI / 2), { x: 40, y: 8, sx: 90, sy: 32, sz: 42, color: rock }));
  K.add('solid', B.part(new T.SphereGeometry(1, B.seg(10, 7), B.seg(5, 3), 0, Math.PI * 2, 0, Math.PI / 2), { x: -70, y: 2, sx: 60, sy: 22, sz: 40, color: green }));
  K.add('solid', B.box(110, 20, 26, { x: 10, y: 44, color: wall }), B.box(112, 3, 28, { x: 10, y: 55, color: dark }));
  for (let x = -40; x <= 60; x += 9) {
    const on = N && B.rng() < 0.6;
    for (const zz of [13.3, -13.3]) K.add(on ? 'glow' : 'solid', B.box(4, 6, 0.6, { x, y: 46, z: zz, color: on ? '#ffd890' : dark }));
  }
  K.add('solid', B.box(7, 36, 7, { x: -52, y: 52, color: wall }), B.box(5, 5, 5, { x: -52, y: 72, color: dark }));
  K.add('glow', B.box(4, 3, 4, { x: -52, y: 72, color: '#fff2b0' }));
  K.add('solid', B.cyl(9, 9, 12, B.seg(10, 7), { x: 80, y: 62, z: -12, color: wall }));
  for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) K.add('solid', B.box(1.5, 26, 1.5, { x: 80 + dx, y: 43, z: -12 + dz, color: dark }));
  K.add('solid', B.box(50, 14, 20, { x: 110, y: 7, z: 30, color: wall }), B.box(40, 2, 18, { x: -120, y: 6, z: 36, color: dark }));
  if (N) {
    K.add('glow', B.box(52, 2, 22, { x: 110, y: 15, z: 30, color: '#ffb060' }), B.box(42, 1.5, 2, { x: -120, y: 7.5, z: 46, color: '#ffb060' })); // the dock lamps
    for (let x = -100; x <= 120; x += 22) K.add('glow', B.box(3, 3, 3, { x, y: 30 + B.rng() * 8, z: 30, color: '#ffc070' })); // path lights up the slope
  }
  const g = B.mesh(K);
  if (N) {
    g.add(searchlights({ pts: [[-52, 72, 0]], mode: 'spin', len: 420, r: 26, color: '#fff2c0', opacity: 0.16, speed: 0.4 }, th, B));
    g.add(beacons({ pts: [[80, 70, -12]], size: 4, rate: 0.5 }, th, B));
  }
  return g;
}

// Karl the Fog. By night it glows from underneath: rose and sodium amber where the city lights it,
// fading to a moonlit violet on top (unlit vertex colours, hazed like the rest).
function fogBank(o, th, B) {
  const K = new B.Kit(), T = B.THREE, N = isNight(B);
  const n = o.n ?? 9, len = o.len ?? 520;
  const lo = o.glowLo || '#c87884', mid = o.glowMid || '#7a5070', hi = o.glowHi || '#3e3456';
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1) - 0.5) * len + (B.rng() - 0.5) * 30, rx = 50 + B.rng() * 60, ry = 14 + B.rng() * 22, rz = 40 + B.rng() * 40;
    const g = B.part(new T.SphereGeometry(1, B.seg(12, 8), B.seg(7, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: o.y0 ?? 0, z: (B.rng() - 0.5) * 60, sx: rx, sy: ry, sz: rz, color: B.c(B.rng() < 0.4 ? '#e6e8ec' : '#f8f6f2', -0.25) });
    if (N) {
      const y0 = o.y0 ?? 0, warm = B.rng() < 0.5;
      K.add('glow', paint(g, (px, py) => { const t = (py - y0) / ry; return B.c(t < 0.45 ? lerpC(B, warm ? lo : '#b07898', mid, t / 0.45) : lerpC(B, mid, hi, (t - 0.45) / 0.55), -0.1); }));
    } else K.add('solid', g);
  }
  return B.mesh(K);
}

function sutro(o, th, B) {
  const K = new B.Kit(), N = isNight(B);
  const red = B.c('#d23a2e', -0.1), white = B.c('#f0ece6', -0.1), hill = B.c(o.hill || (N ? '#2a2a3a' : '#6a7a4c'));
  if (o.hill !== false) K.add('solid', B.part(new B.THREE.SphereGeometry(1, B.seg(12, 8), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { y: -20, sx: 170, sy: 70, sz: 140, color: hill }));
  const legAt = (i, r, y) => { const a = (i / 3) * Math.PI * 2 + Math.PI / 2; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const prof = [[44, 40], [30, 110], [18, 170], [22, 220], [30, 290]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < prof.length - 1; j++) {
    const [r0, y0] = prof[j], [r1, y1] = prof[j + 1], steps = 4;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      K.add('solid', rod(B, legAt(i, r0 + (r1 - r0) * t0, y0 + (y1 - y0) * t0), legAt(i, r0 + (r1 - r0) * t1, y0 + (y1 - y0) * t1), 3.2, (j * steps + s) % 2 ? white : red));
    }
  }
  for (const [r, y] of [[30, 110], [18, 170], [22, 220], [30, 290]]) for (let i = 0; i < 3; i++) K.add('solid', rod(B, legAt(i, r, y), legAt((i + 1) % 3, r, y), 1.8, white));
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const t = legAt(i, 30, 290);
    K.add('solid', rod(B, t, [t[0], 330, t[2]], 2, red));
    if (N) { pts.push([t[0], 333, t[2]]); for (const [r, y] of [[30, 110], [22, 220]]) pts.push(legAt(i, r + 3, y)); }
    else K.add('glow', B.box(4, 4, 4, { x: t[0], y: 332, z: t[2], color: '#ff3a2a' }));
  }
  if (N && o.hill !== false) for (let j = 0; j < 40; j++) { // the houses round the hill's foot
    const a = B.rng() * Math.PI * 2, d = 0.55 + B.rng() * 0.4;
    K.add('glow', B.box(3, 2.4, 3, { x: Math.cos(a) * 170 * d, y: -20 + 70 * Math.sqrt(1 - d * d) + 1, z: Math.sin(a) * 140 * d, color: ['#ffd890', '#ffc070', '#fff0d0'][j % 3] }));
  }
  const g = B.mesh(K);
  if (N) g.add(beacons({ pts, size: 7, rate: 0.55, alt: true }, th, B));
  return g;
}

function transamerica(o, th, B) {
  const K = new B.Kit(), T = B.THREE, N = isNight(B);
  const white = B.c('#ece8de', -0.05), shade = B.c('#c8c4bc', -0.05);
  K.add('solid', B.part(new T.ConeGeometry(48 * Math.SQRT2, 250, 4, 1), { y: 125, ry: Math.PI / 4, color: white }));
  for (const sx of [-1, 1]) K.add('solid', B.box(12, 200, 16, { x: sx * 26, y: 100, color: shade }));
  K.add('solid', B.part(new T.ConeGeometry(7, 70, 4, 1), { y: 278, ry: Math.PI / 4, color: white }));
  if (N) {
    for (let y = 20; y < 220; y += 12) K.add('glow', B.box(Math.max(2, (1 - y / 250) * 92), 1.4, Math.max(2, (1 - y / 250) * 92) + 0.4, { y, color: B.rng() < 0.7 ? '#ffe0a0' : '#c8d8ff' }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.add('glow', rod(B, [sx * 48, 0, sz * 48], [0, 250, 0], 1.6, '#fff4e0', 4)); // the edges traced in light
    K.add('glow', B.part(new T.ConeGeometry(7.4, 70, 4, 1, true), { y: 278, ry: Math.PI / 4, color: '#ff8a5a' })); // the spire, lit
  }
  if (!N) K.add('glow', B.box(3, 3, 3, { y: 314, color: '#ff3a2a' }));
  const g = B.mesh(K);
  if (N) g.add(beacons({ pts: [[0, 316, 0]], size: 4, rate: 0.5 }, th, B));
  return g;
}

// the rest of the city: rolling hills carpeted with little pastel houses in rows (o.len along x, o.dep
// along z, o.n hills of height o.h), on a low ground slab so no water shows through. At night: dark
// roofs, lit windows, and the street grid strung with sodium lamps.
const SPRAWL = ['#f2c8d4', '#c8e2ee', '#f4e6b0', '#d0e8c4', '#dcd0f0', '#f6d2b4', '#e8e4dc', '#c8d4e8'];
const LIT = ['#ffd890', '#ffc070', '#fff0d0', '#ffb0d8', '#a8f0ff'];
function sfSprawl(o, th, B) {
  const K = new B.Kit(), T = B.THREE, len = o.len ?? 600, dep = o.dep ?? 200, n = o.n ?? 5, h = o.h ?? 40, N = isNight(B);
  K.add('solid', B.box(len + 40, 2, dep + 40, { y: 0.2, color: B.c('#9a968a') }));
  const hills = [];
  for (let i = 0; i < n; i++) hills.push({ x: (i / Math.max(1, n - 1) - 0.5) * len * 0.9, z: (B.rng() - 0.5) * dep * 0.4, r: len / n * (0.7 + B.rng() * 0.5), h: h * (0.5 + B.rng() * 0.6) });
  const ground = (x, z) => { let y = 0; for (const H of hills) { const u = ((x - H.x) * (x - H.x)) / (H.r * H.r) + ((z - H.z) * (z - H.z)) / (H.r * H.r * 0.36); if (u < 1) y = Math.max(y, H.h * Math.sqrt(1 - u)); } return y; };
  for (const H of hills) K.add('solid', B.part(new T.SphereGeometry(1, B.seg(14, 9), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x: H.x, z: H.z, sx: H.r, sy: H.h, sz: H.r * 0.6, color: B.c('#8a9a6a') }));
  for (let z = -dep / 2 + 6; z < dep / 2; z += 15) for (let x = -len / 2 + 5; x < len / 2; x += 9) {
    if (B.rng() < 0.12) continue;
    const y = ground(x, z), hgt = 7 + B.rng() * 5;
    K.add('solid', B.box(7, hgt, 10, { x, y: y + hgt / 2 - 1, z, color: B.c(SPRAWL[Math.floor(B.rng() * SPRAWL.length)]) }));
    if (N) {
      for (const sz of [-1, 1]) if (B.rng() < 0.65) K.add('glow', B.box(2.4, 2, 0.6, { x: x + (B.rng() - 0.5) * 3, y: y + hgt * 0.55, z: z + sz * 5.1, color: LIT[Math.floor(B.rng() * LIT.length)] }));
      K.add('glow', B.box(1.3, 1.3, 1.3, { x: x + 4.5, y: ground(x + 4.5, z + 7.5) + 2, z: z + 7.5, color: '#ffb050' })); // the street's lamps
    }
  }
  if (N) for (let x = -len / 2 + 50; x < len / 2; x += 63) for (let z = -dep / 2; z < dep / 2; z += 5) K.add('glow', B.box(1.3, 1.3, 1.3, { x, y: ground(x, z) + 2, z, color: '#ffc070' })); // the avenues
  return B.mesh(K);
}

// downtown: office towers striped with glass and spandrel bands (lit at night), optionally the
// Salesforce tower's rounded crown; footprint o.w × o.d, o.n towers between o.hMin and o.hMax
const TOWER = ['#d8dce4', '#c8ccd4', '#e4e0d8', '#b8c2d0', '#d4ccc0'];
const CROWN = ['#ff2bd6', '#2be8ff', '#ffb040', '#b45bff', '#ff5a2a'];
function sfSkyline(o, th, B) {
  const K = new B.Kit(), n = o.n ?? 16, W = o.w ?? 160, D = o.d ?? 80, N = isNight(B);
  const glass = B.c(N ? '#1c2234' : '#5a6a84'), pts = [];
  const tower = (x, z, w, d, hh, col, crown) => {
    K.add('solid', B.box(w, hh, d, { x, y: hh / 2, z, color: B.c(N ? '#4a4c5a' : col) }));
    for (let y = 4; y < hh - 2; y += 4.5) {
      K.add('solid', B.box(w + 0.6, 2, d + 0.6, { x, y, z, color: glass }));
      if (N && B.rng() < 0.62) K.add('glow', B.box(w * (0.3 + B.rng() * 0.6), 1.4, d + 0.8, { x: x + (B.rng() - 0.5) * w * 0.25, y, z, color: LIT[Math.floor(B.rng() * (B.rng() < 0.8 ? 3 : 5))] }));
    }
    if (crown) {
      K.add(N ? 'glow' : 'solid', N ? paint(B.part(new B.THREE.SphereGeometry(w * 0.62, B.seg(10, 7), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: hh, z, sy: 1.4 }), (px, py) => lerpC(B, '#e8f0ff', '#8a5aff', (py - hh) / (w * 0.85)))
        : B.part(new B.THREE.SphereGeometry(w * 0.62, B.seg(10, 7), B.seg(6, 4), 0, Math.PI * 2, 0, Math.PI / 2), { x, y: hh, z, sy: 1.4, color: B.c(col) }));
      if (N) pts.push([x, hh + w * 0.9, z]);
    } else {
      K.add('solid', B.box(w * 0.6, 3, d * 0.6, { x, y: hh + 1.5, z, color: B.c('#8a8e98') }));
      if (N && B.rng() < 0.5) { const c = CROWN[Math.floor(B.rng() * CROWN.length)]; K.add('glow', B.box(w + 1, 1, 1, { x, y: hh - 0.5, z: z + d / 2, color: c }), B.box(w + 1, 1, 1, { x, y: hh - 0.5, z: z - d / 2, color: c }), B.box(1, 1, d + 1, { x: x + w / 2, y: hh - 0.5, z, color: c }), B.box(1, 1, d + 1, { x: x - w / 2, y: hh - 0.5, z, color: c })); }
      if (N && hh > 85) pts.push([x, hh + 4, z]);
    }
  };
  for (let i = 0; i < n; i++) {
    const x = (B.rng() - 0.5) * W, z = (B.rng() - 0.5) * D, w = 12 + B.rng() * 12;
    tower(x, z, w, w * (0.7 + B.rng() * 0.5), (o.hMin ?? 40) + B.rng() * ((o.hMax ?? 120) - (o.hMin ?? 40)), TOWER[i % TOWER.length], false);
  }
  if (o.salesforce) tower(0, 0, 18, 18, (o.hMax ?? 120) * 1.5, '#d8d4cc', true);
  const g = B.mesh(K);
  if (N && pts.length) g.add(beacons({ pts, size: 3, rate: 0.7, alt: true }, th, B));
  return g;
}

export default {
  goldenGate, alcatraz, fogBank, sutro, transamerica, sfSprawl, sfSkyline,
  sfHills: litHills, sfBeacons: beacons, sfBeams: searchlights,
};
