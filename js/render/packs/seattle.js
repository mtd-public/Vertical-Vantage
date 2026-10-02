// Render side of pack 'seattle': a rainy neon night (emerald and teal neon, low cloud lit from below),
// the platform styles (seattle-styles.js), distant landmarks (the Needle, the port cranes, ferry
// lights) and STORMCROW's view (seattle-boss.js).
import * as THREE from 'three';
import * as S from './seattle-styles.js';
import * as WF from './seattle-waterfront.js';
import * as ST from './seattle-site.js';
import { stormcrow } from './seattle-boss.js';
import SF from './sanfran-backdrops.js';
import { beacons, searchlights, litHills, paint } from './sanfran-night.js';

const themes = {
  // NEEDLE, 22:10: rain over Seattle Center. A slate-teal night, the emerald city glow under the cloud,
  // the Needle ringed in light, searchlights in the rain.
  seaNeedle: {
    skyTop: '#040c18', skyBot: '#1c3c44', sun: '#d8e8ff', sunDir: [0.5, 0.42, 0.75], night: 1,
    fog: [50, 260], hemi: ['#5e90a4', '#0e1a1e', 1.35], key: ['#a8c8ff', 0.7],
    cloud: '#2a3e48', cloudShade: '#14222a', city: 0.85, arc: [1.57, 1.1], cityCol: '#0a141a', windows: 1, neon: 1.3,
    water: '#0a1e26', rain: 1, stars: 0.12, beams: 0.9, cover: 0.55, cityH: 0.9, pyramids: 0, haze: 0.36,
  },
  // PIKE PLACE, 00:20: drizzle on the waterfront. Deep blue, the market's red neon bleeding into the
  // low cloud, the wheel and the ferries lit, Rainier a moonlit ghost in the south-east.
  seaPike: {
    skyTop: '#05081c', skyBot: '#3a2a40', sun: '#dce6ff', sunDir: [0.62, 0.4, 0.68], night: 1,
    fog: [50, 250], hemi: ['#6a7cc0', '#1a1018', 1.35], key: ['#b0c4ff', 0.7],
    cloud: '#3a3450', cloudShade: '#1c1a2c', city: 0.95, arc: [0, 1.3], cityCol: '#0e0c18', windows: 1, neon: 1.3,
    water: '#0c1a28', rain: 1, stars: 0.1, beams: 0.8, cover: 0.6, cityH: 1.0, pyramids: 0, haze: 0.38,
  },
  // RAINIER RAIN, 20:50: the deep blue hour in the rain. Indigo cloud, one last ember of light behind
  // Rainier, the cranes' work lights and every tower lit.
  seaRainier: {
    skyTop: '#0e1438', skyBot: '#4a3a5a', sun: '#ff9a68', sunDir: [0.62, 0.07, 0.6], night: 0.75,
    fog: [48, 250], hemi: ['#7c8cc4', '#1a1a2a', 1.4], key: ['#ffb48c', 0.7],
    cloud: '#4a4462', cloudShade: '#262438', city: 0.95, arc: [0, 4], cityCol: '#141628', windows: 1, neon: 1.25,
    water: '#141e2e', rain: 1, stars: 0, beams: 0.6, cover: 0.7, cityH: 1.2, pyramids: 0, haze: 0.34,
  },
  // ABOVE THE NEEDLE, 23:10: the thunderstorm. Dark lid, the lit city far below, rain sheeting through.
  seaStorm: {
    skyTop: '#0a1020', skyBot: '#24364a', sun: '#c8d8ff', sunDir: [-0.3, 0.7, -0.4], night: 1,
    fog: [45, 240], hemi: ['#7c94b4', '#141c24', 1.5], key: ['#b0c8ec', 0.85],
    cloud: '#2e3a4c', cloudShade: '#141a24', city: 0.85, arc: [0, 4], cityCol: '#0a1018', windows: 1, neon: 1.3,
    water: null, rain: 1, stars: 0, beams: 0.8, cover: 1.0, cityH: 0.7, pyramids: 0, haze: 0.4,
  },
  // the pack's SERVER CORE bonus: an emerald power sky over a rainy night
  seaBonus: {
    skyTop: '#03140e', skyBot: '#14504a', sun: '#e0fff0', sunDir: [-0.4, 0.6, -0.6], night: 1, power: 0.3,
    fog: [70, 280], hemi: ['#88d8c0', '#0e2a24', 1.5], key: ['#d0fff0', 1.0],
    cloud: '#2a5a4c', cloudShade: '#143a30', city: 0, arc: [0, 4], cityCol: '#0a1c16', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.5, beams: 0,
  },
};

// A craggy cone: jittered so the silhouette is ragged (seeded by B.rng, so it's the same every time).
function crag(B, r, h, seg, color, jit) {
  const g = new THREE.ConeGeometry(r, h, seg, 4);
  const pos = g.attributes.position;
  const shift = new Map();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), key = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (y > h / 2 - 1e-3 || y < -h / 2 + 1e-3) continue; // apex and base ring stay put
    if (!shift.has(key)) shift.set(key, [1 + (B.rng() - 0.5) * jit, (B.rng() - 0.5) * jit * h * 0.5]);
    const [k, dy] = shift.get(key);
    pos.setXYZ(i, x * k, y + dy, z * k);
  }
  return B.part(g, { y: h / 2, color });
}

const lerpC = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHex();

const backdrops = {
  // Mount Rainier: a ragged grey massif under a big glaciated cap (and Little Tahoma on its shoulder).
  // o.r, o.h, o.snow (cap fraction), o.glow (1: the cap is unlit: alpenglow at dusk, moonlit at night,
  // ghostly in a storm), o.rim (night: a moonlit edge on the cap, from o.snowColor up to o.rim)
  rainier(o, th, B) {
    const K = new B.Kit(), r = o.r ?? 400, h = o.h ?? 300, s = o.snow ?? 0.5;
    const snow = o.snowColor || '#f4f6fa', key = o.glow ? 'glow' : 'solid';
    K.add('solid', crag(B, r, h, B.seg(22, 14), B.c(o.color || '#5a6470'), 0.08));
    const cap = crag(B, r * s * 1.06, h * s * 1.02, B.seg(22, 14), B.c(snow, -0.2), 0.1);
    cap.translate(0, h * (1 - s) - h * s * 0.02, 0);
    if (o.rim) paint(cap, (x, y) => B.c(lerpC(snow, o.rim, (y - h * (1 - s)) / (h * s)), -0.2)); // brighter toward the summit
    K.add(key, cap);
    const lt = crag(B, r * 0.28, h * 0.45, B.seg(10, 7), B.c(o.color || '#5a6470'), 0.12); lt.translate(r * 0.42, h * 0.25, r * 0.1); K.add('solid', lt); // Little Tahoma
    const ltc = crag(B, r * 0.1, h * 0.14, B.seg(10, 7), B.c(snow, -0.2), 0.1); ltc.translate(r * 0.42, h * 0.56, r * 0.1); K.add(key, ltc);
    return B.mesh(K);
  },
  // The Space Needle seen from across town: legs, core, saucer and spire (scale 1 = the real ~185 m).
  // Night: ringed in light: the halo and the restaurant lit, the legs strung with lamps, a blinking top.
  spaceNeedle(o, th, B) {
    const K = new B.Kit(), N = B.night >= 0.5, w = B.c(N ? '#8a8e8a' : '#d8dad4'), g = B.c('#9aa09c');
    for (const L of [90, 210, 330]) for (const s of [-1, 1]) {
      const a = (L + s * 7) * Math.PI / 180, aw = (L + s * 13) * Math.PI / 180;
      const pts = [[Math.cos(a) * 20, 0, Math.sin(a) * 20], [Math.cos(aw) * 5, 60, Math.sin(aw) * 5], [Math.cos(a) * 16, 150, Math.sin(a) * 16]];
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0, z0] = pts[i - 1], [x1, y1, z1] = pts[i], dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const geo = B.prep(new THREE.BoxGeometry(2.2, len, 2.2), w);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
        geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), q, new THREE.Vector3(1, 1, 1)));
        K.add('solid', geo);
        if (N) for (let k = 1; k < 6; k++) { const u = k / 6; K.add('glow', B.box(2.6, 2.6, 2.6, { x: x0 + dx * u, y: y0 + dy * u, z: z0 + dz * u, color: '#fff2d8' })); }
      }
    }
    K.add('solid', B.cyl(4.5, 4.5, 150, 8, { y: 75, color: g }));
    K.add('solid', B.part(new THREE.CylinderGeometry(22, 9, 9, B.seg(24, 14)), { y: 152, color: w }));
    K.add(N ? 'glow' : 'solid', B.part(new THREE.CylinderGeometry(24, 22, 4, B.seg(24, 14)), { y: 158, color: N ? '#ffd8a0' : B.c('#c4c8c2') }));
    K.add('solid', B.part(new THREE.CylinderGeometry(10, 14, 6, B.seg(16, 10)), { y: 163, color: w }));
    K.add('solid', B.cyl(0.6, 2, 26, 6, { y: 179, color: w }));
    if (N) {
      K.add('glow', B.part(new THREE.TorusGeometry(25, 0.9, 3, B.seg(32, 18)), { rx: Math.PI / 2, y: 156.5, color: '#f8f4ff' }), B.part(new THREE.TorusGeometry(22.5, 0.8, 3, B.seg(32, 18)), { rx: Math.PI / 2, y: 148, color: '#3ad88a' }));
      for (let y = 20; y < 150; y += 26) K.add('glow', B.cyl(4.8, 4.8, 1.6, 8, { y, color: '#d8f0ff' })); // the core's lit bands
    } else K.add('glow', B.box(2, 2, 2, { y: 193, color: '#ff3a3a' }));
    const m = B.mesh(K);
    if (N) m.add(beacons({ pts: [[0, 193, 0]], size: 3, rate: 0.5 }, th, B));
    return m;
  },
  // A row of orange container gantries at the port (o.n cranes along x). Night: work lights along the
  // booms, floodlights under the trolleys, red beacons blinking on the A-frames.
  portCranes(o, th, B) {
    const K = new B.Kit(), n = o.n ?? 4, N = B.night >= 0.5, orange = B.c('#d8642a'), white = B.c('#d8d8d0'), pts = [];
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 34;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('solid', B.box(2.4, 46, 2.4, { x: x + sx * 8, y: 23, z: sz * 9, color: orange }));
      K.add('solid', B.box(20, 5, 22, { x, y: 46, color: orange }));
      K.add('solid', B.box(5, 4, 70, { x, y: 50, z: -28, color: orange }));
      K.add('solid', B.box(6, 5, 6, { x, y: 41, z: -10, color: white }));
      K.add('solid', B.box(3, 18, 3, { x, y: 61, z: 6, color: orange }));
      if (N) {
        for (let z = -60; z <= 6; z += 6) K.add('glow', B.box(1.2, 1.2, 1.2, { x: x + 2.8, y: 51, z, color: '#ffd890' }), B.box(1.2, 1.2, 1.2, { x: x - 2.8, y: 51, z, color: '#ffd890' }));
        K.add('glow', B.box(4, 1, 4, { x, y: 38.2, z: -10, color: '#fff4dc' }), B.box(18, 1, 1, { x, y: 43.2, z: 11.2, color: '#ffb050' }));
        K.add('glow', B.box(5.4, 1.6, 6.4, { x, y: 41.4, z: -10, color: '#9ae8ff' })); // the cab, lit
        pts.push([x, 71, 6], [x, 53, -62]);
      }
    }
    if (N) K.add('glow', B.box(n * 34 + 20, 1, 3, { y: 1, z: 22, color: '#ffc070' })); // the quay's lamps
    const m = B.mesh(K);
    if (N) m.add(beacons({ pts, size: 2, rate: 0.6, alt: true }, th, B));
    return m;
  },
  // Ferries out on the Sound at night: dark hulls picked out by their lit decks (o.n of them, scattered).
  ferryLights(o, th, B) {
    const K = new B.Kit(), n = o.n ?? 3;
    for (let i = 0; i < n; i++) {
      const x = (B.rng() - 0.5) * 300, z = (B.rng() - 0.5) * 200, yaw = B.rng() * Math.PI;
      const c = Math.cos(yaw), s = Math.sin(yaw);
      K.add('solid', B.box(14, 6, 60, { x, y: 3, z, ry: yaw, color: B.c('#d8dcd4') }));
      K.add('solid', B.box(15, 2, 62, { x, y: 0.5, z, ry: yaw, color: B.c('#2a6a4a') }));
      for (let k = -4; k <= 4; k++) K.add('glow', B.box(14.4, 0.8, 3, { x: x + s * k * 6, y: 4.5, z: z + c * k * 6, ry: yaw, color: '#ffe0a0' }));
      K.add('solid', B.box(10, 4, 20, { x, y: 8, z, ry: yaw, color: B.c('#e8ece4') }));
      K.add('glow', B.box(10.4, 1, 20.4, { x, y: 8.4, z, ry: yaw, color: '#ffe8c0' }), B.box(1.5, 1.5, 1.5, { x, y: 12, z, color: '#ffffff' }));
      K.add('glow', B.box(15.4, 0.6, 62.4, { x, y: 1.6, z, ry: yaw, color: '#3ad88a' })); // the hull's emerald stripe
    }
    return B.mesh(K);
  },
  // the city round the stage, lit (the San Francisco pack's skyline and hills, in Seattle's colours)
  seaSkyline: (o, th, B) => SF.sfSkyline({ ...o, salesforce: false }, th, B),
  seaHills: litHills, seaBeacons: beacons, seaBeams: searchlights,
};

const styles = {
  // stage 1: Seattle Center
  seaPlaza: S.seaPlaza, seaKiosk: S.seaKiosk, monoStation: S.monoStation, monoBeam: S.monoBeam, monorail: S.monorail,
  mopop: S.mopop, fountain: S.fountain, fountainDome: S.fountainDome,
  needleBase: S.needleBase, needleCore: S.needleCore, needleRing: S.needleRing, needleLift: S.needleLift, needlePad: S.needlePad,
  needleSaucer: S.needleSaucer, needleCap: S.needleCap, glasshouse: S.glasshouse, arenaRoof: S.arenaRoof,
  // stage 2: the waterfront and the market
  seaPromenade: WF.seaPromenade, seaPier: WF.seaPier, pierShed: WF.pierShed, wheelHub: WF.wheelHub, gondola: WF.gondola, ferry: WF.ferry,
  ventiCup: WF.ventiCup, ventiGiant: WF.ventiGiant, hillclimb: WF.hillclimb, marketRoof: WF.marketRoof, marketSign: WF.marketSign,
  brickBlock: WF.brickBlock, gumAlley: WF.gumAlley, seaTower: WF.seaTower,
  // stage 3: the building site
  skelSlab: ST.skelSlab, skelCore: ST.skelCore, hoist: ST.hoist, hoistMast: ST.hoistMast, glassTower: ST.glassTower, pedestalTower: ST.pedestalTower,
  skyBridge: ST.skyBridge, bmuCradle: ST.bmuCradle, tcMast: ST.tcMast, tcDeck: ST.tcDeck, tcJib: ST.tcJib, tcCounter: ST.tcCounter,
  craneLoad: ST.craneLoad, steelLoad: ST.steelLoad,
  // the boss arena
  stormDeck: ST.stormDeck, needleStem: ST.needleStem, stormPad: ST.stormPad,
  // 'fountain', 'gondola' and 'ferry' are also EURO's / SHANGHAI's style names, and the merged table
  // keeps theirs; these pack-prefixed names draw Seattle's (a level can switch to them)
  seaFountain: S.fountain, seaGondola: WF.gondola, seaFerry: WF.ferry,
};

export default { themes, styles, backdrops, bosses: { stormcrow } };
