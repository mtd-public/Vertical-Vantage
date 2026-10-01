// Render side of pack 'seattle': overcast themes (cover, close fog, muted greens and greys, drizzle),
// the platform styles (seattle-styles.js), distant landmarks (the Needle, the port cranes, ferry
// lights) and STORMCROW's view (seattle-boss.js).
import * as THREE from 'three';
import * as S from './seattle-styles.js';
import * as WF from './seattle-waterfront.js';
import * as ST from './seattle-site.js';
import { stormcrow } from './seattle-boss.js';

const themes = {
  // NEEDLE: a grey Seattle morning. Overcast lid, soft key light, the flood a dull green.
  seaMorning: {
    skyTop: '#74838a', skyBot: '#bcc6c2', sun: '#d8ddd6', sunDir: [0.45, 0.5, 0.55], night: 0,
    fog: [60, 290], hemi: ['#e2ebe6', '#4f5b55', 1.7], key: ['#eef0e8', 1.35],
    cloud: '#d2d8d8', cloudShade: '#96a1a3', city: 0.55, arc: [1.57, 1.0], cityCol: '#76838a', windows: 0, neon: 0.45,
    water: '#4a6a63', rain: 0, stars: 0, beams: 0, cover: 0.72, cityH: 0.8, pyramids: 0, haze: 0.5,
  },
  // PIKE PLACE: drizzle over the waterfront, mid-afternoon; the market's neon already on.
  seaDrizzle: {
    skyTop: '#66767a', skyBot: '#aab5b1', sun: '#cfd6cf', sunDir: [-0.5, 0.45, 0.4], night: 0.1,
    fog: [55, 260], hemi: ['#d6e0db', '#46524c', 1.6], key: ['#e4e8de', 1.2],
    cloud: '#bcc4c4', cloudShade: '#7f8b8d', city: 0.75, arc: [0, 1.3], cityCol: '#66727a', windows: 0.25, neon: 0.7,
    water: '#3e5c58', rain: 1, stars: 0, beams: 0, cover: 0.85, cityH: 1.0, pyramids: 0, haze: 0.55,
  },
  // RAINIER RAIN: dusk in the rain, a last bruise of orange under the cloud, towers lighting up.
  seaDusk: {
    skyTop: '#2a3244', skyBot: '#7c7466', sun: '#ffb070', sunDir: [0.62, 0.14, 0.6], night: 0.55,
    fog: [48, 240], hemi: ['#a4afc0', '#2e2c30', 1.45], key: ['#ffc898', 0.95],
    cloud: '#6a6470', cloudShade: '#3e3a48', city: 0.9, arc: [0, 4], cityCol: '#2e3240', windows: 0.55, neon: 0.95,
    water: '#25363c', rain: 1, stars: 0, beams: 0.25, cover: 0.8, cityH: 1.2, pyramids: 0, haze: 0.42,
  },
  // ABOVE THE NEEDLE: the thunderstorm. Dark lid, the lit city far below, rain sheeting through.
  seaStorm: {
    skyTop: '#121823', skyBot: '#3c454c', sun: '#c8d8ff', sunDir: [-0.3, 0.7, -0.4], night: 0.85,
    fog: [45, 230], hemi: ['#8a96aa', '#1c2026', 1.4], key: ['#b0c4e0', 0.85],
    cloud: '#3a4250', cloudShade: '#1c2028', city: 0.8, arc: [0, 4], cityCol: '#141820', windows: 0.9, neon: 1.0,
    water: null, rain: 1, stars: 0, beams: 0.5, cover: 1.0, cityH: 0.7, pyramids: 0, haze: 0.5,
  },
  // the pack's SERVER CORE bonus: emerald power sky
  seaBonus: {
    skyTop: '#1f6a58', skyBot: '#a8e0c8', sun: '#f0fff0', sunDir: [-0.4, 0.6, -0.6], night: 0.1, power: 1,
    fog: [70, 280], hemi: ['#f0fff8', '#4a6a60', 1.7], key: ['#f4fff0', 2.0],
    cloud: '#e8fff4', cloudShade: '#b8dcc8', city: 0, arc: [0, 4], cityCol: '#93a9a0', windows: 0, neon: 0.9,
    water: null, rain: 0, stars: 0, beams: 0,
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

const backdrops = {
  // Mount Rainier: a ragged grey massif under a big glaciated cap (and Little Tahoma on its shoulder).
  // o.r, o.h, o.snow (cap fraction), o.glow (1: the cap is unlit — alpenglow at dusk, ghostly in a storm)
  rainier(o, th, B) {
    const K = new B.Kit(), r = o.r ?? 400, h = o.h ?? 300, s = o.snow ?? 0.5;
    const snow = o.snowColor || '#f4f6fa', key = o.glow ? 'glow' : 'solid';
    K.add('solid', crag(B, r, h, B.seg(22, 14), B.c(o.color || '#5a6470'), 0.08));
    const cap = crag(B, r * s * 1.06, h * s * 1.02, B.seg(22, 14), B.c(snow, -0.2), 0.1);
    cap.translate(0, h * (1 - s) - h * s * 0.02, 0);
    K.add(key, cap);
    const lt = crag(B, r * 0.28, h * 0.45, B.seg(10, 7), B.c(o.color || '#5a6470'), 0.12); lt.translate(r * 0.42, h * 0.25, r * 0.1); K.add('solid', lt); // Little Tahoma
    const ltc = crag(B, r * 0.1, h * 0.14, B.seg(10, 7), B.c(snow, -0.2), 0.1); ltc.translate(r * 0.42, h * 0.56, r * 0.1); K.add(key, ltc);
    return B.mesh(K);
  },
  // The Space Needle seen from across town: legs, core, saucer and spire (scale 1 = the real ~185 m).
  spaceNeedle(o, th, B) {
    const K = new B.Kit(), w = B.c('#d8dad4'), g = B.c('#9aa09c');
    for (const L of [90, 210, 330]) for (const s of [-1, 1]) {
      const a = (L + s * 7) * Math.PI / 180, aw = (L + s * 13) * Math.PI / 180;
      const pts = [[Math.cos(a) * 20, 0, Math.sin(a) * 20], [Math.cos(aw) * 5, 60, Math.sin(aw) * 5], [Math.cos(a) * 16, 150, Math.sin(a) * 16]];
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0, z0] = pts[i - 1], [x1, y1, z1] = pts[i], dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const geo = B.prep(new THREE.BoxGeometry(2.2, len, 2.2), w);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
        geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), q, new THREE.Vector3(1, 1, 1)));
        K.add('solid', geo);
      }
    }
    K.add('solid', B.cyl(4.5, 4.5, 150, 8, { y: 75, color: g }));
    K.add('solid', B.part(new THREE.CylinderGeometry(22, 9, 9, B.seg(24, 14)), { y: 152, color: w }));
    K.add('solid', B.part(new THREE.CylinderGeometry(24, 22, 4, B.seg(24, 14)), { y: 158, color: B.c('#c4c8c2') }));
    K.add('solid', B.part(new THREE.CylinderGeometry(10, 14, 6, B.seg(16, 10)), { y: 163, color: w }));
    K.add('solid', B.cyl(0.6, 2, 26, 6, { y: 179, color: w }));
    K.add('glow', B.box(2, 2, 2, { y: 193, color: '#ff3a3a' }));
    if (B.night) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; K.add('glow', B.box(1.6, 1.2, 1.6, { x: Math.cos(a) * 23.5, y: 156, z: Math.sin(a) * 23.5, color: '#fff0c8' })); }
    return B.mesh(K);
  },
  // A row of orange container gantries at the port (o.n cranes along x).
  portCranes(o, th, B) {
    const K = new B.Kit(), n = o.n ?? 4, orange = B.c('#d8642a'), white = B.c('#d8d8d0');
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 34;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add('solid', B.box(2.4, 46, 2.4, { x: x + sx * 8, y: 23, z: sz * 9, color: orange }));
      K.add('solid', B.box(20, 5, 22, { x, y: 46, color: orange }));
      K.add('solid', B.box(5, 4, 70, { x, y: 50, z: -28, color: orange }));
      K.add('solid', B.box(6, 5, 6, { x, y: 41, z: -10, color: white }));
      K.add('solid', B.box(3, 18, 3, { x, y: 61, z: 6, color: orange }));
      if (B.night) K.add('glow', B.box(1.5, 1.5, 1.5, { x, y: 71, z: 6, color: '#ff3a3a' }));
    }
    return B.mesh(K);
  },
  // Ferries out on the Sound at dusk: dark hulls picked out by their lit decks (o.n of them, scattered).
  ferryLights(o, th, B) {
    const K = new B.Kit(), n = o.n ?? 3;
    for (let i = 0; i < n; i++) {
      const x = (B.rng() - 0.5) * 300, z = (B.rng() - 0.5) * 200, yaw = B.rng() * Math.PI;
      const c = Math.cos(yaw), s = Math.sin(yaw);
      K.add('solid', B.box(14, 6, 60, { x, y: 3, z, ry: yaw, color: B.c('#d8dcd4') }));
      K.add('solid', B.box(15, 2, 62, { x, y: 0.5, z, ry: yaw, color: B.c('#2a6a4a') }));
      for (let k = -4; k <= 4; k++) K.add('glow', B.box(14.4, 0.8, 3, { x: x + s * k * 6, y: 4.5, z: z + c * k * 6, ry: yaw, color: '#ffe0a0' }));
      K.add('solid', B.box(10, 4, 20, { x, y: 8, z, ry: yaw, color: B.c('#e8ece4') }));
    }
    return B.mesh(K);
  },
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
};

export default { themes, styles, backdrops, bosses: { stormcrow } };
