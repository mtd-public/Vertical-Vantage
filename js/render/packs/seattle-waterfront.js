// SEATTLE pack styles, stage 2 (PIKE PLACE): the promenade and piers, pier sheds, the Great Wheel and
// its gondolas, the car ferries, VENTI CORP's hover cups, the market roofs, the big neon sign, the
// brick blocks, the gum-wall alley and the downtown towers. Local frame: y = 0 at the top you stand on.
import * as THREE from 'three';
import { strut, text } from './seattle-kit.js';
import { EMERALD, TEAL, N_AMBER, N_PINK, N_RED, WARM, PUDDLE, CONCRETE, DARK, STEEL, ring, circle, torus, tree, lamp, railing, slab } from './seattle-styles.js';
import { edgeRect, edgeDisc, pool, paint, dots, quad, windowGrid, puddle } from './sanfran-night.js';

const TAU = Math.PI * 2;
const WOOD = 0x7a6a58, PILE = 0x3e342a;

export function seaPromenade(K, p, th, rng, H) {
  const { w, d } = p;
  slab(K, H, p, 0xaeb2a8);
  K.add('flat', H.box(1.6, 0.02, d - 1, { x: w / 2 - 2.2, y: 0.012, color: 0x3e7a52 })); // the bike lane
  for (let z = -d / 2 + 2; z < d / 2; z += 6) K.add('flat', H.box(0.6, 0.02, 2.4, { x: w / 2 - 2.2, y: 0.016, z, color: 0xe8e8e0 }));
  railing(K, H, w, d, [3], 0x2e5a44, 1.05); // the seawall rail (west)
  for (let z = -d / 2 + 5; z < d / 2; z += 14) { lamp(K, H, -w / 2 + 0.7, z, 4.2, [1.8, 0]); K.add('flat', H.box(0.6, 0.45, 2.2, { x: w / 2 - 0.8, y: 0.22, z: z + 7, color: 0x4a6a58 })); }
  for (let z = -d / 2 + 9; z < d / 2; z += 22) tree(K, H, w / 2 - 0.9, z, 4.6);
  K.add('flat', H.box(w + 0.1, 0.8, d + 0.1, { y: -p.h + 0.3, color: 0x34443a }));
  // night: the rail's lit top, puddles full of neon, the seawall's emerald light line
  K.add('neon', H.box(0.06, 0.06, d, { x: -w / 2 + 0.05, y: 1.1, color: TEAL }));
  for (let i = 0; i < Math.round(d / 9); i++) puddle(K, H, (rng() - 0.5) * (w - 4), (rng() - 0.5) * (d - 4), 0.9 + rng() * 1.4, 0.6 + rng() * 1, rng() * 3, PUDDLE[i % 4]);
  edgeRect(K, H, w, d, EMERALD, { y: -0.3, faces: [2, 3] });
}

export function seaPier(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, 0.5, d, { y: -0.25, color: WOOD }));
  for (let z = -d / 2 + 0.5; z < d / 2; z += 1.0) K.add('flat', H.box(w - 0.1, 0.02, 0.06, { y: 0.012, z, color: 0x5e5244 }));
  for (let x = -w / 2 + 1; x <= w / 2; x += 4) for (let z = -d / 2 + 1; z <= d / 2; z += 4) K.add('flat', H.cyl(0.28, 0.32, thick, 5, { x, y: -thick / 2 - 0.3, z, color: PILE }));
  railing(K, H, w, d, [0, 1, 3], 0x5a4a3a, 1.0); // (the east end meets the promenade)
  for (const sz of [-1, 1]) for (let x = -w / 2 + 3; x < w / 2 - 4; x += 10) lamp(K, H, x, sz * (d / 2 - 0.5), 3.8, [0, -sz * 1.4]);
  // string lights along the rails, a lit edge at the water
  for (const sz of [-1, 1]) dots(K, H, [-w / 2 + 0.5, 1.08, sz * (d / 2 - 0.05)], [w / 2 - 0.5, 1.08, sz * (d / 2 - 0.05)], Math.round(w / 1.3), 0.15, [WARM, TEAL, WARM, N_PINK]);
  edgeRect(K, H, w, d, TEAL, { y: -0.3, t: 0.08, faces: [0, 1, 3] });
  for (const sz of [-1, 1]) K.add('flat', H.cyl(0.35, 0.35, 0.5, 6, { x: -w / 2 + 0.6, y: 0.25, z: sz * (d / 2 - 1.5), color: 0x2a2a2a })); // bollards
}

const SHEDS = [['ACRES OF SPAM', 0xffd23a, 0x2e6a4a], ['AQUARIUM', 0x7ff6ff, 0x2a4a6a], ['PIER 66', 0xff6a3a, 0x5a3a3a]];
export function pierShed(K, p, th, rng, H) {
  const { w, d, thick } = p, [name, neon, trim] = SHEDS[(p.tint >= 0 ? p.tint : 0) % SHEDS.length];
  K.add('flat', H.box(w, thick, d, { y: -thick / 2, color: 0xd8dcd4 }));
  K.add('flat', H.box(w + 0.3, 0.4, d + 0.3, { y: -0.2, color: trim }));
  for (const f of H.faces(w, d)) {
    for (let k = 0; k < Math.floor(f.width / 2.5); k++) {
      const off = -f.width / 2 + 1.25 + k * 2.5;
      const lit = rng() < 0.75;
      K.add(lit ? 'glow' : 'glass', H.box(f.tx ? 1.4 : 0.06, 1.4, f.tz ? 1.4 : 0.06, { x: f.nx * (f.half + 0.02) + f.tx * off, y: -thick * 0.45, z: f.nz * (f.half + 0.02) + f.tz * off, color: lit ? (rng() < 0.3 ? 0x9ae8ff : WARM) : undefined }));
    }
  }
  K.add('flat', H.box(0.2, 1.4, w * 0.9, { x: 0, y: -1.3, z: d / 2 + 0.12, ry: Math.PI / 2, color: 0x15181c }));
  K.add('glow', ...text(name, { px: Math.min(0.18, (w * 0.85) / (name.length * 6)), depth: 0.05, y: -1.3, z: d / 2 + 0.25, color: neon }));
  edgeRect(K, H, w + 0.3, d + 0.3, neon, { y: -0.38 });
}

// The Great Wheel: drawn round its hub (the platform at the hub: y = 0 is its top, the wheel's centre
// is 0.7 below). Rim, spokes, LED rings, and an A-frame down to the pier deck.
export function wheelHub(K, p, th, rng, H) {
  const c = -0.7, R = 14, white = 0xe8eae6, pierY = 2 - p.h; // the pier deck, local
  K.add('flat', H.cyl(p.r, p.r, p.thick, 10, { y: -p.thick / 2, color: STEEL }));
  K.add('flat', H.part(new THREE.TorusGeometry(R, 0.32, 4, H.seg(48, 28)), { y: c, z: -0.9, color: white }), H.part(new THREE.TorusGeometry(R, 0.32, 4, H.seg(48, 28)), { y: c, z: 0.9, color: white }));
  K.add('glow', H.part(new THREE.TorusGeometry(R + 0.4, 0.1, 3, H.seg(48, 28)), { y: c, color: 0xbff8ff }));
  for (const z of [-1.0, 1.0]) K.add('glow', paint(H.part(new THREE.TorusGeometry(R - 0.45, 0.07, 3, H.seg(48, 28)), { y: c, z }), (x, y) => (Math.atan2(y - c, x) > 0 ? EMERALD : N_PINK))); // the LED rims
  K.add('glow', H.cyl(1.2, 1.2, 0.3, 10, { y: c, z: -1.7, rx: Math.PI / 2, color: TEAL }));
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * TAU, x = Math.cos(a) * R, y = c + Math.sin(a) * R;
    for (const z of [-0.9, 0.9]) K.add('flat', strut([0, c, z * 0.4], [x, y, z], 0.14, 0xd0d4d0));
    K.add('flat', strut([x, y, -0.9], [x, y, 0.9], 0.18, white));
    if (k % 4 === 1) for (const z of [-0.9, 0.9]) K.add('glow', strut([0, c, z * 0.5], [x * 0.95, c + Math.sin(a) * R * 0.95, z], 0.08, 0xd8f8ff)); // lit spokes
    if (k % 2 === 0) K.add('glow', H.box(0.4, 0.4, 0.4, { x: x * 1.03, y: c + Math.sin(a) * R * 1.03, color: k % 4 ? 0x7ff6ff : 0xff6ad8 }));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add('flat', strut([sx * 7, pierY, sz * 4.2], [0, c, sz * 1.2], 0.6, 0xc8ccc8));
  K.add('flat', H.cyl(0.6, 0.6, 3.2, 8, { y: c, rx: Math.PI / 2, color: 0x8a9096 }));
}
const GONDOLA = [0xd84a3a, 0x3a8ad8, 0xe8b03a, 0x3ad88a, 0xb84ad8];
export function gondola(K, p, th, rng, H) {
  const { w, d, thick } = p, col = GONDOLA[(p.tint >= 0 ? p.tint : 0) % GONDOLA.length];
  K.add('flat', H.box(w, 0.2, d, { y: -0.1, color: 0xeef0ec }));
  K.add('glow', H.box(w * 0.9, thick - 0.6, d * 0.9, { y: -0.2 - (thick - 0.6) / 2, color: 0x6a5a48 })); // lit inside
  K.add('flat', H.box(w, 0.4, d, { y: -thick + 0.2, color: col }));
  K.add('glow', H.box(w * 0.5, 0.06, d * 0.5, { y: -0.24, color: 0xfff0c8 }));
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width + 0.06 : 0.06, 0.06, f.tz ? f.width + 0.06 : 0.06, { x: f.nx * (f.half + 0.02), y: -0.12, z: f.nz * (f.half + 0.02), color: TEAL }));
  for (const sx of [-1, 1]) K.add('flat', H.box(0.12, thick - 0.6, 0.12, { x: sx * w * 0.45, y: -0.2 - (thick - 0.6) / 2, z: d * 0.45, color: col }));
}

// A car ferry (long axis local x): green hull, white superstructure; the sun deck on top is where you stand.
const FERRY_NAMES = ['M/V DRIZZLE', 'M/V OVERCAST'];
export function ferry(K, p, th, rng, H) {
  const { w, d, thick } = p, name = FERRY_NAMES[(p.tint >= 0 ? p.tint : 0) % 2];
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: 0xc8ccc6 })); // sun deck
  for (let x = -w / 2 + 2; x < w / 2 - 1; x += 3) K.add('flat', H.box(0.06, 0.02, d - 1, { x, y: 0.012, color: 0x9a9e98 }));
  K.add('flat', H.box(w - 2, 2.2, d - 0.6, { y: -1.4, color: 0xeef0ea })); // passenger cabin
  K.add('glow', H.box(w - 2.2, 0.8, d - 0.5, { y: -1.25, color: 0xffe0a8 })); // the cabin, lit
  K.add('flat', H.box(w + 1.5, 2.6, d + 0.2, { y: -3.8, color: 0xe4e6e0 })); // car deck
  for (const sx of [-1, 1]) K.add('flat', H.box(0.1, 1.8, d * 0.7, { x: sx * (w / 2 + 0.78), y: -4.0, color: 0x1a1c20 })); // the car-deck mouths at both ends
  K.add('flat', H.box(w + 2.5, 1.4, d + 0.4, { y: -thick + 0.7, color: 0x1e6a46 })); // green hull
  K.add('flat', H.box(w + 2.6, 0.18, d + 0.42, { y: -thick + 1.45, color: 0xf0f2ec }));
  for (const sx of [-1, 1]) K.add('glow', H.box(2.25, 0.5, d * 0.52, { x: sx * (w / 2 - 1.6), y: -0.7, color: 0x9ae8ff })); // wheelhouse windows at both ends (double-ended)
  for (const f of H.faces(w, d)) K.add('glow', H.box(f.tx ? f.width : 0.08, 0.08, f.tz ? f.width : 0.08, { x: f.nx * (f.half + 0.02), y: -0.04, z: f.nz * (f.half + 0.02), color: WARM })); // the sun deck's rail lights
  K.add('glow', H.box(0.3, 0.3, 0.3, { y: 1.65, color: 0xffffff }), H.box(0.3, 0.3, 0.3, { x: -w / 2 - 1.2, y: -3.2, z: -d / 2 - 0.1, color: N_RED }), H.box(0.3, 0.3, 0.3, { x: -w / 2 - 1.2, y: -3.2, z: d / 2 + 0.1, color: 0x2aff6a }));
  K.add('flat', H.box(1.6, 1.4, 2.4, { y: 0.7, z: 0, color: 0xeef0ea }), H.box(1.7, 0.3, 2.5, { y: 1.3, color: 0x1e6a46 })); // the funnel
  for (const sz of [-1, 1]) K.add('glow', ...text(name, { px: 0.18, depth: 0.05, y: -thick + 0.75, z: sz * (d / 2 + 0.23), ry: sz > 0 ? 0 : Math.PI, color: 0xf0f4ee }));
  for (let x = -w / 2 + 2; x < w / 2 - 1; x += 2.5) for (const sz of [-1, 1]) K.add('glow', H.box(0.9, 0.35, 0.06, { x, y: -3.6, z: sz * (d / 2 + 0.12), color: 0xffe6b0 }));
}

// VENTI CORP hover cups: a tapered paper cup, a sleeve with the logo, a lid you land on, thrusters.
const SLEEVE = [0x1e7a4a, 0x8a5a3a, 0xd86a8a];
function cupGeo(K, H, r, h, sleeve, big) {
  const n = H.seg(16, 9);
  K.add('flat', H.cyl(r, r * 0.74, h, n, { y: -h / 2 - 0.2, color: 0xf2f0ea }));
  K.add('flat', H.cyl(r * 1.04, r * 1.04, 0.24, n, { y: -0.12, color: 0x2a1e18 })); // the lid
  K.add('flat', H.cyl(r * 0.94, r * 0.96, 0.06, n, { y: 0.02, color: 0x3a2a22 }));
  K.add('flat', H.cyl(r * 0.94, r * 0.87, h * 0.34, n, { y: -h * 0.42, color: sleeve }));
  for (const a of [0, Math.PI]) { // the round logo on both sides
    const x = Math.sin(a) * r * 0.93, z = Math.cos(a) * r * 0.93;
    K.add('flat', H.part(new THREE.CircleGeometry(r * 0.3, 10), { x, y: -h * 0.42, z, ry: a, color: 0xf2f0ea }));
    K.add('flat', H.part(new THREE.CircleGeometry(r * 0.22, 10), { x: x * 1.004, y: -h * 0.42, z: z * 1.004, ry: a, color: sleeve }));
    if (big) K.add('glow', ...text('VENTI', { px: r * 0.07, depth: 0.05, x: x * 1.01, y: -h * 0.18, z: z * 1.01, ry: a, color: 0x3ad88a }));
  }
  K.add('flat', H.cyl(r * 0.4, r * 0.5, 0.4, 8, { y: -h - 0.4, color: DARK }));
  K.add('glow', H.cyl(r * 0.38, r * 0.38, 0.05, 8, { y: -h - 0.62, color: 0x7ff6d0 }));
  K.add('glow', H.part(new THREE.TorusGeometry(r * 1.05, 0.06, 3, n), { rx: Math.PI / 2, y: -0.2, color: big ? EMERALD : sleeve === 0x1e7a4a ? EMERALD : sleeve === 0x8a5a3a ? N_AMBER : N_PINK })); // the lid's lit rim
}
export function ventiCup(K, p, th, rng, H) { cupGeo(K, H, p.r, p.thick, SLEEVE[(p.tint >= 0 ? p.tint : 0) % 3], false); }
export function ventiGiant(K, p, th, rng, H) {
  cupGeo(K, H, p.r, p.thick, SLEEVE[0], true);
  K.add('glow', ...text("WORLD'S LARGEST", { px: 0.09, depth: 0.04, y: -p.thick * 0.66, z: p.r * 0.86, color: 0xffffff }));
  K.add('neon', torus(H, p.r * 1.05, 0.08, { y: -0.3, color: EMERALD }));
}

export function hillclimb(K, p, th, rng, H) {
  const { w, d, thick } = p;
  slab(K, H, p, 0xb0b4aa);
  for (let x = -w / 2 + 0.6; x < w / 2; x += 1.2) K.add('flat', H.box(0.08, 0.02, d - 0.4, { x, y: 0.012, color: 0xd8b03a }));
  railing(K, H, w, d, [0, 1], 0x3a4a40, 1.0);
  tree(K, H, -w / 2 + 1, -d / 2 + 1.2, 3.5); tree(K, H, w / 2 - 1, d / 2 - 1.2, 3.8);
  edgeRect(K, H, w, d, N_AMBER, { y: -0.12 });
  for (const sz of [-1, 1]) K.add('neon', H.box(w - 0.2, 0.05, 0.05, { y: 1.06, z: sz * (d / 2 - 0.05), color: TEAL }));
}

// The market's main arcade: a long flat roof with skylights and vents, brick and glass down to the street.
export function marketRoof(K, p, th, rng, H) {
  const { w, d, thick } = p;
  K.add('flat', H.box(w, 0.4, d, { y: -0.2, color: 0x6a6e6a }));
  for (let z = -d / 2 + 4; z < d / 2 - 2; z += 8) K.add('glow', H.box(w * 0.3, 0.14, 3, { x: w * 0.18, y: 0.05, z, color: 0x5a4a30 })); // skylights, lit from the stalls
  for (let k = 0; k < 6; k++) K.add('flat', H.box(1.2, 0.9, 1.2, { x: (rng() - 0.5) * w * 0.6, y: 0.45, z: (rng() - 0.5) * (d - 6), color: 0x8a8e8a }));
  for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width : 0.4, 0.6, f.tz ? f.width : 0.4, { x: f.nx * (f.half - 0.2), y: 0.3, z: f.nz * (f.half - 0.2), color: 0x7a3a2e })); // parapet
  const g = H.meterBox(w, thick, d, 12, { faces: ['px', 'nx', 'pz', 'nz'], color: 0x9a5444 }); g.translate(0, -thick / 2 - 0.4, 0); K.add('facade', g);
  for (let z = -d / 2 + 3; z < d / 2; z += 6) K.add('glow', H.box(0.1, 1.2, 3.6, { x: -w / 2 - 0.06, y: -thick + 3.4, z, color: 0xffd890 })); // shopfronts at street level
  K.add('flat', H.box(0.6, 0.3, d, { x: -w / 2 - 0.4, y: -thick + 4.6, color: 0x2e5a44 })); // the awning
  K.add('neon', H.box(0.08, 0.1, d, { x: -w / 2 - 0.72, y: -thick + 4.5, color: EMERALD }));
  // neon in the windows along the street: little shop signs, and the parapet's light line
  const SH = ['FISH', 'FLOWERS', 'DONUTS', 'CHEESE', 'TEA', 'PIES', 'RECORDS'], SC = [0xff3a2e, N_PINK, TEAL, N_AMBER, EMERALD];
  for (let z = -d / 2 + 6, i = 0; z < d / 2 - 3; z += 12, i++) K.add('glow', ...text(SH[i % SH.length], { px: 0.14, depth: 0.04, x: -w / 2 - 0.2, y: -thick + 6.2, z, ry: -Math.PI / 2, color: SC[i % SC.length] }));
  edgeRect(K, H, w, d, 0xff3a2e, { y: -0.42 });
}

// The big neon sign on the arcade's west edge: a catwalk on top, red letters both ways, a clock.
export function marketSign(K, p, th, rng, H) {
  const { w, d, thick } = p, red = 0xff3a2e;
  K.add('flat', H.box(w, 0.2, d, { y: -0.1, color: 0x3a3e42 })); // the catwalk
  for (let z = -d / 2; z < d / 2; z += 1) K.add('flat', H.box(w - 0.2, 0.02, 0.05, { y: 0.012, z, color: 0x22262a }));
  for (const sx of [-1, 1]) K.add('flat', H.box(0.06, 0.06, d, { x: sx * (w / 2 - 0.05), y: 1.0, color: 0xc8302a }));
  for (let z = -d / 2; z <= d / 2; z += 2) for (const sx of [-1, 1]) K.add('flat', H.box(0.06, 1.0, 0.06, { x: sx * (w / 2 - 0.05), y: 0.5, z, color: 0xc8302a }));
  K.add('flat', H.box(0.3, thick - 0.4, d, { y: -thick / 2, color: 0x1a1c20 })); // the backing frame
  for (let z = -d / 2 + 1; z < d / 2; z += 4) K.add('flat', H.box(0.3, 2.2, 0.3, { y: -thick - 1.1, z, color: 0x2a2c30 })); // posts down to the roof
  for (const sx of [-1, 1]) {
    const ry = sx < 0 ? -Math.PI / 2 : Math.PI / 2, x = sx * 0.2;
    K.add('glow', ...text('PRIVATE MARKET', { px: 0.3, depth: 0.12, x, y: -1.9, z: 0, ry, color: red }));
    K.add('glow', ...text('MEET THE SHAREHOLDER', { px: 0.16, depth: 0.1, x, y: -4.2, z: 0, ry, color: 0xf4f0e0 }));
    K.add('neon', H.box(0.1, 0.12, d - 0.4, { x: sx * 0.24, y: -0.5, color: red }), H.box(0.1, 0.12, d - 0.4, { x: sx * 0.24, y: -thick + 0.6, color: red }));
    for (const z of [-d / 2 + 0.25, d / 2 - 0.25]) K.add('neon', H.box(0.1, thick - 1.1, 0.12, { x: sx * 0.24, y: -thick / 2 + 0.05, z, color: red })); // the frame's ends
    for (let z = -d / 2 + 1; z < d / 2 - 0.5; z += 1.2) K.add('glow', H.box(0.1, 0.18, 0.18, { x: sx * 0.26, y: -3.1, z, color: z % 2.4 < 1.2 ? 0xfff0d0 : 0xffd23a })); // the chaser bulbs
  }
  for (const sx of [-1, 1]) K.add('glow', H.box(0.08, 0.06, d, { x: sx * (w / 2 + 0.02), y: -0.08, color: N_AMBER })); // the catwalk's edges
  // the clock, hung under the north end
  K.add('flat', H.cyl(1.5, 1.5, 0.4, 16, { y: -thick + 0.6, z: -d / 2 - 1.2, rz: Math.PI / 2, color: 0x2a2c30 }));
  for (const sx of [-1, 1]) {
    K.add('glow', H.part(new THREE.CircleGeometry(1.3, 16), { x: sx * 0.22, y: -thick + 0.6, z: -d / 2 - 1.2, ry: sx * Math.PI / 2, color: 0xf8f4e4 }));
    K.add('flat', H.box(0.04, 0.9, 0.1, { x: sx * 0.26, y: -thick + 0.95, z: -d / 2 - 1.2, color: 0x111111 }), H.box(0.04, 0.1, 0.7, { x: sx * 0.26, y: -thick + 0.6, z: -d / 2 - 0.95, color: 0x111111 }));
  }
  K.add('glow', ...text('VENTI', { px: 0.12, depth: 0.05, x: -0.24, y: -thick - 0.6, z: -d / 2 - 1.2, ry: -Math.PI / 2, color: EMERALD }));
}

// Brick blocks: red (0) or tan (1) brick, rows of windows, a parapet, a rooftop water tank.
export function brickBlock(K, p, th, rng, H) {
  const { w, d, thick } = p, brick = p.tint === 1 ? 0xb08a64 : 0x8e4a3a;
  K.add('flat', H.box(w, 0.4, d, { y: -0.2, color: 0x5e625e }));
  const g = H.meterBox(w, thick, d, 12, { faces: ['px', 'nx', 'pz', 'nz'], color: brick }); g.translate(0, -thick / 2 - 0.4, 0); K.add('facade', g);
  for (const f of H.faces(w, d)) K.add('flat', H.box(f.tx ? f.width + 0.3 : 0.5, 0.7, f.tz ? f.width + 0.3 : 0.5, { x: f.nx * (f.half - 0.1), y: 0.3, z: f.nz * (f.half - 0.1), color: 0x5a2e24 }));
  const tx = w / 2 - 2.5, tz = d / 2 - 2.5;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('flat', H.box(0.15, 2.4, 0.15, { x: tx + sx * 0.8, y: 1.2, z: tz + sz * 0.8, color: 0x3a2a20 }));
  K.add('flat', H.cyl(1.2, 1.2, 2.2, 8, { x: tx, y: 3.4, z: tz, color: 0x6a4a32 }), H.part(new THREE.ConeGeometry(1.3, 0.9, 8), { x: tx, y: 4.95, z: tz, color: 0x3a2a20 }));
  if (p.tint === 1) K.add('glow', ...text('HOTEL', { px: 0.4, depth: 0.1, x: -w / 2 - 0.3, y: -3, z: 0, ry: -Math.PI / 2, color: 0xff4a3a }));
  edgeRect(K, H, w + 0.3, d + 0.3, p.tint === 1 ? 0xff4a3a : TEAL, { y: -0.12 });
  K.add('glow', H.box(0.3, 0.3, 0.3, { x: tx, y: 5.5, z: tz, color: N_RED })); // the water tank's light
}

// Post Alley: cobbles between two brick walls caked in decades of gum.
export function gumAlley(K, p, th, rng, H) {
  const { w, d } = p, GUM = [0xff6ad8, 0x7bff4a, 0xffe52b, 0x4ad8ff, 0xff8a3a, 0xf4f4f4, 0xb45bff];
  K.add('flat', H.box(w, 0.3, d, { y: -0.15, color: 0x3e3a38 }));
  for (let z = -d / 2 + 0.5; z < d / 2; z += 1) K.add('flat', H.box(w - 0.2, 0.02, 0.06, { y: 0.012, z, color: 0x2a2624 }));
  for (const sx of [-1, 1]) {
    K.add('flat', H.box(0.1, 7.5, d, { x: sx * (w / 2 - 0.08), y: 3.75, color: 0x6a3a30 }));
    for (let k = 0; k < 140; k++) {
      const s = 0.12 + rng() * 0.22;
      K.add(k % 3 ? 'flat' : 'glow', H.box(0.08, s, s, { x: sx * (w / 2 - 0.16), y: 0.4 + rng() * 6.4, z: (rng() - 0.5) * (d - 1), color: GUM[Math.floor(rng() * GUM.length)] })); // (some of it glows: smart gum)
    }
  }
  for (let z = -d / 2 + 4; z < d / 2; z += 6) for (let k = 0; k < 6; k++) K.add('glow', H.box(0.14, 0.14, 0.14, { x: -w / 2 + (k + 0.5) * (w / 6), y: 5.4 - Math.sin(((k + 0.5) / 6) * Math.PI) * 0.6, z, color: 0xffe0a0 })); // string lights
  K.add('glow', ...text('GUM WALL', { px: 0.12, depth: 0.04, x: 0, y: 6.6, z: d / 2 - 0.3, ry: Math.PI, color: 0xff6ad8 }));
}

// Downtown towers: the stock tower with a Seattle roof (a green roof patch, a mechanical penthouse).
export function seaTower(K, p, th, rng, H) {
  H.tower(K, p, th, rng);
  K.add('flat', H.box(p.w * 0.45, 0.06, p.d * 0.4, { x: -p.w * 0.18, y: 0.04, z: p.d * 0.2, color: 0x3e6a40 }));
  K.add('flat', H.box(p.w * 0.25, 2.2, p.d * 0.25, { x: p.w * 0.28, y: 1.1, z: -p.d * 0.28, color: 0x6a6e70 }));
  edgeRect(K, H, p.w, p.d, EMERALD, { y: -0.2 });
}
