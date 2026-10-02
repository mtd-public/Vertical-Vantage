// The player's own models: the arm cannon (the viewmodel, on screen all the time) and the legs you
// see when you look down. Both are rigged: every moving part rides a bone, and each model is one
// SkinnedMesh per material sharing one skeleton, so the whole arm cannon is a handful of draw calls
// however many parts move (petals, rings, coil, recoil slide, barrel cluster, rocket loader).
// Bones are plain Object3Ds: the view (player-view.js) poses them like groups. A part is hidden by
// scaling its bone to 0 (each weapon's business end).
// Conventions as models.js: metres, +Y up, the cannon fires down -Z, the legs face -Z.
import * as THREE from 'three';
import { Kit, box, cyl, ball, part } from './geo.js';
import { seg } from './retro.js';

const R = Math.PI / 2, O8 = Math.PI / 8; // O8: turns an 8-sided cylinder so a flat face is on top
// the palette: white armour that catches the light by day and the neon at night, gunmetal
// mechanics under it, Robbit-blue inlays, orange for joints and hazard bits
export const PC = {
  white: 0xe8ecf3, white2: 0xc2c9d6, blue: 0x2a5ad8, blueDk: 0x1c3c9c, orange: 0xff8a1a, hazard: 0xffcc1a,
  gun: 0x454c5c, gunDk: 0x272b34, black: 0x121419, steel: 0x9aa6bc, chrome: 0xd0d8e4, red: 0xff3b5c,
};

// A box with every edge chamfered by b (flat-shaded, so the chamfers catch the light as thin bevels).
export function bbox(w, h, d, b, o) {
  const hw = w / 2 - b, hh = h / 2 - b, s = new THREE.Shape();
  s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return part(g, o);
}
// An armour plate: a polygon [[x, z], …] (its outline seen from above), t thick along y, edges
// chamfered by b. For tapered, angled hard-surface shapes the box can't make.
export function plate(pts, t, b, o) {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, t - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
  g.rotateX(-R); g.translate(0, -(t - 2 * b) / 2, 0);
  return part(g, o);
}
// A low-poly cable through points [[x, y, z], …].
function cable(pts, r, o) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return part(new THREE.TubeGeometry(c, seg(12, 8), r, seg(6, 4), false), o);
}
const torus = (r, tube, o, n = seg(16, 10)) => part(new THREE.TorusGeometry(r, tube, 4, n), o);
const around = (n, f) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2, i));

// A rim light for a Lambert material: faces seen edge-on glow in U.uRim's colour (the theme's neon at
// night, a sky sheen by day), so the white armour reads against any backdrop. U = { uRim, uRimPow }.
export function addRim(mat, U) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uRim = U.uRim; s.uniforms.uRimPow = U.uRimPow;
    s.fragmentShader = 'uniform vec3 uRim;\nuniform float uRimPow;\n' + s.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight += uRim * pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), uRimPow);\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => 'vv-rim';
  mat.needsUpdate = true;
  return mat;
}

// Collects parts per material on bones, then builds one SkinnedMesh per material over one skeleton.
// Build with the root at identity: a part added to a bone is given in that bone's local frame.
class Rig {
  constructor(root) { this.root = root; this.bones = []; this.kit = new Kit(); }
  bone(name, parent, o = {}) {
    const b = new THREE.Bone();
    b.name = name;
    if (o.order) b.rotation.order = o.order;
    b.position.set(o.x || 0, o.y || 0, o.z || 0); b.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    (parent || this.root).add(b);
    b.userData.i = this.bones.length; this.bones.push(b);
    b.updateWorldMatrix(true, false);
    return b;
  }
  add(key, bone, ...geos) {
    for (const g of geos) {
      g.applyMatrix4(bone.matrixWorld);
      const n = g.attributes.position.count, si = new Float32Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = bone.userData.i; sw[i * 4] = 1; }
      g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
      this.kit.add(key, g);
    }
    return this;
  }
  build(mats) {
    this.root.updateMatrixWorld(true);
    const sk = new THREE.Skeleton(this.bones), geos = this.kit.build(), out = {}, I = new THREE.Matrix4();
    for (const k in geos) {
      const m = new THREE.SkinnedMesh(geos[k], mats[k]);
      m.name = k; m.frustumCulled = false;
      this.root.add(m); m.bind(sk, I);
      out[k] = m;
    }
    return out;
  }
}

// ------------------------------------------------------------------ legs
// Armoured robot legs, seen when you look down: white armour shells (thigh, knee cap, shin guard,
// calf) over gunmetal joints and rams, blue inlays, cyan light seams, treaded boots with blue toe
// caps, and a heel jet that fires layered flames on air jumps. Set wide apart and a touch behind the
// eye, so the middle of the down view (the landing reticle) stays clear and the thighs stay thin up
// close (the hips are the nearest thing to the eye: anything wide up there fills the down view).
// Bones (userData.bones): hipL/hipR (y 0.9) → kneeL/R (0.4 lower) → footL/R (ankle, 0.38 lower) →
// jetL/R (the flame, scaled by the view; 0 = off). Materials: paint (default M.paintFlat), M.glow, M.jet.
export function legsModel(M, paint = M.paintFlat) {
  const g = new THREE.Group(), rig = new Rig(g), C = PC, cyan = 0x2be8ff;
  const bones = {};
  for (const sx of [-1, 1]) {
    const S = sx < 0 ? 'L' : 'R';
    const hip = rig.bone('hip' + S, null, { x: sx * 0.34, y: 0.9, z: 0.06 });
    const knee = rig.bone('knee' + S, hip, { y: -0.4 });
    const foot = rig.bone('foot' + S, knee, { y: -0.38 });
    const jet = rig.bone('jet' + S, foot, { y: -0.15, z: 0.07 });
    Object.assign(bones, { ['hip' + S]: hip, ['knee' + S]: knee, ['foot' + S]: foot, ['jet' + S]: jet });
    // thigh: a white shell, thin at the top, a blue front plate, a ribbed outer plate
    rig.add('paint', hip,
      cyl(0.036, 0.036, 0.07, 6, { rz: R, y: -0.02, color: C.steel }), // hip joint
      bbox(0.07, 0.05, 0.09, 0.014, { y: -0.03, color: C.white }), // hip cowl
      cyl(0.042, 0.066, 0.33, 8, { y: -0.21, ry: O8, color: C.white }), // thigh shell
      plate([[-0.035, 0], [0.035, 0], [0.03, -0.2], [-0.03, -0.2]], 0.024, 0.006, { rx: -R, y: -0.13, z: -0.058, color: C.blue }), // front plate
      bbox(0.03, 0.2, 0.08, 0.008, { x: sx * 0.06, y: -0.24, color: C.white2 }), // outer plate
      ...[-0.18, -0.24, -0.3].map((y) => box(0.034, 0.012, 0.084, { x: sx * 0.062, y, color: C.gun })), // its ribs
      cyl(0.016, 0.016, 0.2, 5, { y: -0.24, z: 0.055, color: C.gunDk }), // hamstring ram
    );
    rig.add('glow', hip, box(0.008, 0.16, 0.01, { x: sx * 0.064, y: -0.25, z: -0.035, color: cyan }));
    // knee: an axle with lit hub caps, an angled cap with an orange pad
    rig.add('paint', knee,
      cyl(0.052, 0.052, 0.12, seg(10, 8), { rz: R, color: C.gun }),
      bbox(0.11, 0.1, 0.05, 0.016, { z: -0.064, rx: -0.25, color: C.white }), // knee cap
      bbox(0.06, 0.026, 0.016, 0.005, { y: 0.004, z: -0.092, rx: -0.25, color: C.orange }),
      cyl(0.044, 0.052, 0.34, 8, { y: -0.2, ry: O8, color: C.gun }), // shin strut
      plate([[-0.06, 0], [0.06, 0], [0.055, -0.22], [0.035, -0.28], [-0.035, -0.28], [-0.055, -0.22]], 0.046, 0.014, { rx: -R, y: -0.06, z: -0.052, color: C.white }), // shin guard
      bbox(0.03, 0.2, 0.016, 0.005, { y: -0.19, z: -0.08, color: C.white2 }), // its ridge
      bbox(0.09, 0.2, 0.05, 0.012, { y: -0.17, z: 0.058, color: C.white }), // calf shell
      cyl(0.018, 0.018, 0.18, 6, { y: -0.2, z: 0.092, color: C.gunDk }), // calf ram
      cyl(0.009, 0.009, 0.1, 5, { y: -0.31, z: 0.092, color: C.chrome }),
    );
    rig.add('glow', knee,
      cyl(0.032, 0.032, 0.012, seg(8, 6), { rz: R, x: 0.066, color: cyan }), cyl(0.032, 0.032, 0.012, seg(8, 6), { rz: R, x: -0.066, color: cyan }),
      box(0.008, 0.18, 0.012, { x: 0.056, y: -0.17, z: -0.07, color: cyan }), box(0.008, 0.18, 0.012, { x: -0.056, y: -0.17, z: -0.07, color: cyan }),
    );
    // boot: ankle guards, a white upper with straps, blue toe cap, treaded sole, heel jet nozzle
    rig.add('paint', foot,
      ball(0.048, { color: C.gunDk }),
      bbox(0.022, 0.08, 0.09, 0.006, { x: 0.068, y: -0.02, color: C.white2 }), bbox(0.022, 0.08, 0.09, 0.006, { x: -0.068, y: -0.02, color: C.white2 }),
      plate([[-0.09, 0.12], [0.09, 0.12], [0.09, -0.1], [0.07, -0.17], [-0.07, -0.17], [-0.09, -0.1]], 0.09, 0.018, { y: -0.065, color: C.white }), // upper
      box(0.184, 0.018, 0.026, { y: -0.026, z: -0.04, color: C.gunDk }), box(0.184, 0.018, 0.026, { y: -0.026, z: 0.03, color: C.gunDk }), // straps
      plate([[-0.095, -0.12], [0.095, -0.12], [0.095, -0.2], [0.065, -0.25], [-0.065, -0.25], [-0.095, -0.2]], 0.07, 0.018, { y: -0.08, color: C.blue }), // toe cap
      bbox(0.17, 0.08, 0.07, 0.012, { y: -0.075, z: 0.11, color: C.gun }), // heel block
      box(0.204, 0.024, 0.39, { y: -0.124, z: -0.05, color: C.black }), // sole
      ...[-0.2, -0.12, -0.04, 0.04, 0.11].map((z) => box(0.214, 0.022, 0.03, { y: -0.13, z, color: C.gun })), // treads
      cyl(0.036, 0.05, 0.05, 8, { y: -0.12, z: 0.07, color: C.gunDk }), // heel jet nozzle
    );
    rig.add('glow', foot,
      box(0.006, 0.012, 0.2, { x: 0.092, y: -0.09, z: -0.06, color: cyan }), box(0.006, 0.012, 0.2, { x: -0.092, y: -0.09, z: -0.06, color: cyan }), // boot seams
      box(0.12, 0.01, 0.008, { y: -0.046, z: -0.254, color: cyan }), // toe line
      cyl(0.03, 0.03, 0.01, 8, { y: -0.146, z: 0.07, color: 0x9ff8ff }), // nozzle throat
    );
    // the heel jet: layered cones (dim outer, bright middle, white-hot core) and a flat glow disc;
    // additive and grey, so the layers stack to a hot core in the material's colour (cyan, gold on the
    // third jump). Hangs down from the nozzle.
    rig.add('jet', jet,
      part(new THREE.ConeGeometry(0.075, 0.55, 8, 1, true), { rx: Math.PI, y: -0.275, color: 0x3c3c3c }),
      part(new THREE.ConeGeometry(0.05, 0.36, 8, 1, true), { rx: Math.PI, y: -0.18, color: 0x707070 }),
      part(new THREE.ConeGeometry(0.03, 0.2, 6, 1, true), { rx: Math.PI, y: -0.1, color: 0xd8d8d8 }),
      part(new THREE.CircleGeometry(0.11, 8), { rx: R, y: -0.01, color: 0x5a5a5a }),
    );
  }
  M.jet.vertexColors = true; M.jet.side = THREE.DoubleSide;
  const meshes = rig.build({ paint, glow: M.glow, jet: M.jet });
  for (const k of ['jetL', 'jetR']) bones[k].scale.setScalar(0);
  g.userData.bones = bones; g.userData.meshes = meshes;
  return g;
}

// ------------------------------------------------------------------ the arm cannon
// In camera space, drawn in its own pass on top of the world. A hard-surface weapon arm: a gunmetal
// forearm under layered white armour plates with a panel gap, cables and a hydraulic ram in a channel
// along the inside, light strips in the weapon's colour, a chunky receiver with heat vents (they
// glow under sustained fire), a toothed gyro ring and a wrist collar that turn, and an iris of four
// tapered armour petals round a charge coil and glowing core. The petals open to a different spread
// per weapon (CANNON_OPEN; on a swap they close, the business end changes, they open again) and kick
// on every shot. Each weapon's business end rides a recoil slide and stands out past the petals: a
// focusing fork round a hot lens (blaster), a manifold with three flared nozzles (spread), a spinning
// six-barrel cluster (rapid), a launch tube with a warhead on a loader (rocket). A little screen on
// the forearm shows the ammo.
// userData: bones { base, collar, ringA, coil, slide, spin, warhead, blaster, spread, rapid, rocket },
// petals [bones], mz { weapon: { bone, tip } }, screen { cv, tex, key }, flash (mesh).
export const CANNON_OPEN = { blaster: 0.1, spread: 0.4, rapid: 0.2, rocket: 0.56 };
export function cannonModel(M) {
  const g = new THREE.Group(), rig = new Rig(g), C = PC;
  const base = rig.bone('base');
  const W = 0xffffff, HALF = 0x808080; // glow vertex colours: white = the weapon's colour (the material tints them)
  // ---- forearm: a gunmetal core under two white top plates (a panel gap between), a raised blue
  // spine, flank plates, a belly pan
  rig.add('paint', base,
    cyl(0.088, 0.088, 0.8, 8, { z: 0.56, rx: R, ry: O8, color: C.gun }),
    plate([[-0.08, 0.95], [0.08, 0.95], [0.08, 0.58], [-0.08, 0.58]], 0.046, 0.014, { y: 0.092, color: C.white }), // rear top plate
    plate([[-0.08, 0.55], [0.08, 0.55], [0.08, 0.27], [0.055, 0.2], [-0.055, 0.2], [-0.08, 0.27]], 0.046, 0.014, { y: 0.092, color: C.white }), // front top plate
    plate([[-0.03, 0.95], [0.03, 0.95], [0.03, 0.66], [0.012, 0.62], [-0.012, 0.62], [-0.03, 0.66]], 0.02, 0.006, { y: 0.122, color: C.blue }), // spine
    plate([[-0.02, 0.48], [0.02, 0.48], [0.02, 0.3], [0, 0.27], [-0.02, 0.3]], 0.016, 0.005, { x: 0.035, y: 0.12, color: C.white2 }), // a hatch
    bbox(0.036, 0.1, 0.66, 0.012, { x: -0.098, y: -0.03, z: 0.6, rz: -0.18, color: C.white2 }), // inner flank plate (below the channel)
    bbox(0.04, 0.13, 0.66, 0.012, { x: 0.1, y: 0.0, z: 0.6, rz: 0.3, color: C.white }), // outer flank plate
    bbox(0.012, 0.03, 0.5, 0.004, { x: -0.112, y: 0.024, z: 0.62, rz: -0.18, color: C.blue }), // its blue edge
    bbox(0.12, 0.03, 0.56, 0.01, { y: -0.09, z: 0.62, color: C.gunDk }), // belly pan
  );
  // exposed mechanics in the channel along the inner side: three cables (one hazard orange) clamped
  // down, and a hydraulic ram from the forearm into the receiver
  rig.add('paint', base,
    cable([[-0.07, 0.04, 0.96], [-0.088, 0.05, 0.64], [-0.092, 0.055, 0.36], [-0.088, 0.06, 0.12]], 0.014, { color: C.black }),
    cable([[-0.085, 0.02, 0.96], [-0.1, 0.03, 0.62], [-0.104, 0.035, 0.34], [-0.1, 0.036, 0.12]], 0.012, { color: C.orange }),
    cable([[-0.096, 0.0, 0.96], [-0.11, 0.008, 0.6], [-0.114, 0.012, 0.32], [-0.11, 0.012, 0.12]], 0.011, { color: C.black }),
    ...[0.7, 0.42].map((z) => bbox(0.05, 0.03, 0.026, 0.006, { x: -0.098, y: 0.045, z, rz: -0.7, color: C.steel })), // clamps
    cyl(0.022, 0.022, 0.22, 8, { x: -0.125, y: -0.03, z: 0.6, rx: R, color: C.gunDk }), // ram body
    cyl(0.011, 0.011, 0.26, 6, { x: -0.125, y: -0.03, z: 0.36, rx: R, color: C.chrome }), // ram rod
    box(0.03, 0.04, 0.03, { x: -0.125, y: -0.03, z: 0.22, color: C.gun }), box(0.034, 0.044, 0.04, { x: -0.125, y: -0.03, z: 0.72, color: C.gun }), // lugs
  );
  // ---- the receiver: a chunky octagonal housing with a seam, vent grilles on top and on the inner
  // shoulder, a hazard tab, status lights, a dark front lip
  rig.add('paint', base,
    cyl(0.122, 0.122, 0.05, 8, { z: 0.17, rx: R, ry: O8, color: C.gunDk }), // rear cowl
    cyl(0.14, 0.14, 0.26, 8, { z: 0.02, rx: R, ry: O8, color: C.white }),
    cyl(0.145, 0.145, 0.016, 8, { z: 0.05, rx: R, ry: O8, color: C.gunDk }), // seam band
    cyl(0.13, 0.13, 0.02, 8, { z: -0.11, rx: R, ry: O8, color: C.gunDk }), // front lip
    box(0.1, 0.024, 0.16, { y: 0.128, z: -0.03, color: C.black }), // top vent recess
    box(0.07, 0.024, 0.14, { x: -0.087, y: 0.087, z: -0.03, rz: Math.PI / 4, color: C.black }), // shoulder vent recess
    bbox(0.03, 0.03, 0.05, 0.008, { x: 0.065, y: 0.13, z: 0.1, color: C.orange }), // a hazard tab
    bbox(0.11, 0.03, 0.06, 0.01, { y: 0.128, z: 0.1, color: C.white2 }), // a cap plate behind the vents
  );
  rig.add('heat', base, // vent slats: dark, glowing orange → white under sustained fire
    ...[-0.036, -0.018, 0, 0.018, 0.036].map((x) => box(0.01, 0.026, 0.14, { x, y: 0.131, z: -0.03, color: W })),
    ...[-0.022, 0, 0.022].map((d) => box(0.01, 0.026, 0.12, { x: -0.087 - d * 0.707, y: 0.087 - d * 0.707, z: -0.03, rz: Math.PI / 4, color: W })),
  );
  // light strips in the weapon's colour: the top plates' edges, the spine, status lights, the seam
  rig.add('glow', base,
    box(0.012, 0.012, 0.3, { x: -0.084, y: 0.104, z: 0.39, color: W }), box(0.012, 0.012, 0.34, { x: -0.084, y: 0.104, z: 0.78, color: W }),
    box(0.012, 0.012, 0.3, { x: 0.084, y: 0.104, z: 0.39, color: HALF }),
    box(0.008, 0.008, 0.26, { y: 0.134, z: 0.8, color: W }), // spine line
    ...[0, 1, 2].map((k) => box(0.014, 0.008, 0.014, { x: -0.04 + k * 0.022, y: 0.144, z: 0.1, color: k ? HALF : W })), // status lights
    cyl(0.146, 0.146, 0.006, 8, { z: 0.05, rx: R, ry: O8, color: HALF }), // a lit line in the seam
  );
  // ---- the wrist collar (turns slowly, bolts and all) and the toothed gyro ring in front of the receiver
  const collar = rig.bone('collar', base, { z: 0.21 });
  rig.add('paint', collar, cyl(0.112, 0.112, 0.04, seg(12, 10), { rx: R, color: C.gun }),
    ...around(6, (a) => box(0.022, 0.022, 0.046, { x: Math.cos(a) * 0.11, y: Math.sin(a) * 0.11, rz: a, color: C.steel })));
  const ringA = rig.bone('ringA', base, { z: -0.14 });
  rig.add('paint', ringA, ...around(8, (a, i) => bbox(0.07, 0.03, 0.03, 0.006, { x: Math.cos(a + 0.39) * 0.128, y: Math.sin(a + 0.39) * 0.128, rz: a + 0.39 + R, color: i % 2 ? C.gun : C.steel })),
    cyl(0.118, 0.118, 0.022, seg(12, 8), { rx: R, color: C.gunDk }));
  rig.add('glow', ringA, ...around(4, (a) => box(0.022, 0.012, 0.034, { x: Math.cos(a + 0.39) * 0.146, y: Math.sin(a + 0.39) * 0.146, rz: a + 0.39 + R, color: W })));
  // ---- the charge coil and core (inside the iris, seen between the petals)
  const coil = rig.bone('coil', base, { z: -0.3 });
  rig.add('glow', coil, ...[0.1, 0.05, 0, -0.05, -0.1].map((z, k) => torus(0.068, 0.008, { z, color: k % 2 ? HALF : W })),
    cyl(0.04, 0.04, 0.27, seg(8, 6), { rx: R, color: 0xffffff }));
  rig.add('paint', coil, ...around(4, (a) => box(0.014, 0.014, 0.25, { x: Math.cos(a) * 0.08, y: Math.sin(a) * 0.08, color: C.gunDk }))); // coil spars (behind the petals)
  // ---- four tapered armour petals, hinged at the front of the receiver, a second plate layered on each
  const petals = [];
  const shell = [[-0.066, 0.02], [0.066, 0.02], [0.06, -0.26], [0.04, -0.36], [-0.04, -0.36], [-0.06, -0.26]];
  const over = [[-0.034, -0.02], [0.034, -0.02], [0.03, -0.22], [0.016, -0.28], [-0.016, -0.28], [-0.03, -0.22]];
  for (let k = 0; k < 4; k++) { // right, top, left, bottom: from the eye you look into the gap between the top and inner petals
    const a = k * R;
    const p = rig.bone('petal' + k, base, { x: Math.cos(a) * 0.112, y: Math.sin(a) * 0.112, z: -0.175, rz: a - R, order: 'ZYX' });
    rig.add('paint', p,
      plate(shell, 0.036, 0.011, { color: C.white }),
      plate(over, 0.016, 0.005, { y: 0.024, color: k === 1 ? C.blue : C.white2 }),
      plate([[-0.042, -0.3], [0.042, -0.3], [0.04, -0.36], [-0.04, -0.36]], 0.044, 0.01, { y: 0.002, color: C.gun }), // tip cap
      box(0.08, 0.012, 0.26, { y: -0.02, z: -0.15, color: C.gunDk }), // inner face
      cyl(0.016, 0.016, 0.08, 6, { rz: R, y: -0.004, z: 0.0, color: C.steel }), // hinge knuckle
    );
    rig.add('glow', p,
      box(0.05, 0.006, 0.22, { y: -0.027, z: -0.15, color: W }), // inner face light
      box(0.07, 0.008, 0.012, { y: -0.012, z: -0.352, color: W }), // the lip: a lit ring round the mouth
      box(0.008, 0.006, 0.18, { x: 0.046, y: 0.018, z: -0.13, color: HALF }), // a slot along the shell
    );
    petals.push(p);
  }
  // ---- the recoil slide and each weapon's business end on it, standing out past the petals
  const slide = rig.bone('slide', base);
  const mz = {};
  const end = (key, z, tip) => { const b = rig.bone(key, slide, { z }); mz[key] = { bone: b, tip }; return b; };
  // blaster: an emitter collar, a three-prong focusing fork round a hot lens and a floating lens ring
  const bl = end('blaster', -0.44, -0.72);
  rig.add('paint', bl, cyl(0.066, 0.07, 0.044, seg(10, 8), { rx: R, color: C.steel }), cyl(0.06, 0.064, 0.022, seg(10, 8), { z: -0.03, rx: R, color: C.orange }),
    ...around(3, (a) => plate([[-0.017, 0.02], [0.017, 0.02], [0.016, -0.16], [0.006, -0.23], [-0.01, -0.22]], 0.03, 0.007, { x: Math.cos(a + R) * 0.066, y: Math.sin(a + R) * 0.066, rz: a, color: C.gun })),
    ...around(3, (a) => bbox(0.026, 0.02, 0.05, 0.005, { x: Math.cos(a + R) * 0.058, y: Math.sin(a + R) * 0.058, z: -0.17, rz: a, color: C.chrome })));
  rig.add('glow', bl, cyl(0.03, 0.038, 0.05, seg(8, 6), { z: -0.05, rx: R, color: 0xffffff }), torus(0.044, 0.008, { z: -0.16, color: W }), torus(0.056, 0.006, { z: -0.026, color: HALF }),
    ...around(3, (a) => box(0.01, 0.008, 0.12, { x: Math.cos(a + R) * 0.05, y: Math.sin(a + R) * 0.05, z: -0.1, rz: a, color: HALF }))); // the fork's inner edges
  // spread: a manifold wider than the iris, a fan of three flared nozzles, hazard fins on its ends
  const sp = end('spread', -0.44, -0.64);
  const fan = (geo, k) => geo.rotateY(-k * 0.36).translate(k * 0.088, 0, -0.09); // a nozzle splayed out along the fan
  rig.add('paint', sp, bbox(0.3, 0.06, 0.08, 0.016, { color: C.gunDk }), bbox(0.22, 0.024, 0.06, 0.007, { y: 0.038, color: C.steel }),
    bbox(0.024, 0.09, 0.09, 0.007, { x: 0.16, color: C.orange }), bbox(0.024, 0.09, 0.09, 0.007, { x: -0.16, color: C.orange }),
    ...[-1, 0, 1].map((k) => fan(cyl(0.044, 0.028, 0.16, seg(8, 6), { rx: -R, color: C.gun }), k)),
    ...[-1, 0, 1].map((k) => fan(cyl(0.047, 0.047, 0.02, seg(8, 6), { z: -0.06, rx: R, color: C.orange }), k)));
  rig.add('glow', sp, ...[-1, 0, 1].map((k) => fan(cyl(0.036, 0.036, 0.01, seg(8, 6), { z: -0.079, rx: R, color: W }), k)));
  // rapid: a shroud ring and a long six-barrel cluster that spins up as you fire
  const rp = end('rapid', -0.4, -0.8);
  rig.add('paint', rp, cyl(0.07, 0.07, 0.044, seg(10, 8), { rx: R, color: C.gunDk }), cyl(0.074, 0.074, 0.016, seg(10, 8), { z: 0.022, rx: R, color: C.hazard }));
  rig.add('glow', rp, torus(0.058, 0.007, { z: -0.026, color: W }));
  const spin = rig.bone('spin', rp, { z: -0.2 });
  rig.add('paint', spin, ...around(6, (a, i) => cyl(0.017, 0.017, 0.38, 6, { x: Math.cos(a) * 0.046, y: Math.sin(a) * 0.046, rx: R, color: i % 2 ? C.gun : C.steel })),
    cyl(0.07, 0.07, 0.024, 6, { z: -0.15, rx: R, color: C.gunDk }), cyl(0.066, 0.066, 0.024, 6, { z: 0.02, rx: R, color: C.gunDk }), cyl(0.07, 0.07, 0.016, 6, { z: 0.12, rx: R, color: C.steel }),
    cyl(0.02, 0.02, 0.4, 6, { rx: R, color: C.black }));
  rig.add('glow', spin, ...around(6, (a) => cyl(0.011, 0.011, 0.004, 5, { x: Math.cos(a) * 0.046, y: Math.sin(a) * 0.046, z: -0.191, rx: R, color: HALF })));
  // rocket: a launch tube with hazard bands and four guide fins; the warhead sits on a loader (the view
  // kicks it out on a shot and slides the next one in)
  const rk = end('rocket', -0.38, -0.74);
  rig.add('paint', rk, cyl(0.084, 0.084, 0.2, seg(10, 8), { z: -0.09, rx: R, color: C.gunDk }),
    ...[0, 1, 2, 3].map((k) => cyl(0.087, 0.087, 0.024, seg(10, 8), { z: -0.02 - k * 0.036, rx: R, color: k % 2 ? C.black : C.hazard })),
    cyl(0.09, 0.09, 0.022, seg(10, 8), { z: -0.19, rx: R, color: C.steel }),
    ...around(4, (a) => plate([[-0.006, 0.02], [0.006, 0.02], [0.006, -0.1], [0.002, -0.12], [-0.006, -0.1]], 0.07, 0.006, { x: Math.cos(a + Math.PI / 4) * 0.11, y: Math.sin(a + Math.PI / 4) * 0.11, z: -0.1, rz: a + Math.PI / 4 - R, color: C.red })));
  const wh = rig.bone('warhead', rk, { z: -0.18 });
  rig.add('paint', wh, cyl(0.058, 0.058, 0.1, seg(8, 6), { rx: R, color: C.white }), cyl(0.06, 0.06, 0.02, seg(8, 6), { z: -0.04, rx: R, color: C.hazard }),
    cyl(0.005, 0.058, 0.16, seg(8, 6), { z: -0.13, rx: -R, color: C.red }));
  rig.add('glow', wh, ball(0.014, { z: -0.21, color: 0xffffff }));
  // ---- build (the view tints glow and heat per frame)
  M.vmGlow.vertexColors = true; M.vmHeat.vertexColors = true;
  const meshes = rig.build({ paint: M.vmPaint, glow: M.vmGlow, heat: M.vmHeat });
  for (const k in mz) mz[k].bone.scale.setScalar(0);
  // ---- the ammo screen on the forearm, in a housing tilted up toward the eye (a 40 × 20 LCD: about
  // one texel per pixel at 240 lines, so it stays legible)
  const cv = document.createElement('canvas'); cv.width = 40; cv.height = 20;
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  screen.position.set(-0.035, 0.19, 0.46); screen.rotation.set(-0.42, -0.36, 0.02); // faces the eye
  g.add(screen);
  const bz = new Kit().add('b', bbox(0.182, 0.1, 0.026, 0.008, { z: -0.015, color: C.gunDk }), bbox(0.186, 0.02, 0.03, 0.006, { y: 0.058, z: -0.01, color: C.white2 }),
    bbox(0.13, 0.09, 0.06, 0.012, { y: -0.075, z: -0.05, color: C.gun })).build().b;
  bz.applyMatrix4(new THREE.Matrix4().compose(screen.position, screen.quaternion, new THREE.Vector3(1, 1, 1)));
  g.add(new THREE.Mesh(bz, M.vmPaint)); // its bezel and housing (a plain mesh: it never moves)
  // ---- the muzzle flash: a star of soft glow quads facing back down the barrel and a crossed plume
  // along it (one additive mesh with the glow texture; the view scales it per weapon)
  const fk = new Kit();
  fk.add('f', part(new THREE.PlaneGeometry(0.36, 0.36)));
  for (let k = 0; k < 4; k++) fk.add('f', part(new THREE.PlaneGeometry(0.62, 0.09), { rz: k * Math.PI / 4 + O8 }));
  fk.add('f', part(new THREE.PlaneGeometry(0.16, 0.5), { rx: R, z: -0.2 }), part(new THREE.PlaneGeometry(0.16, 0.5), { rx: R, rz: R, z: -0.2 }));
  const flash = new THREE.Mesh(fk.build().f, M.vmFlash);
  flash.name = 'flash'; flash.visible = false; g.add(flash);
  // the aura in the mouth of the iris (the view tints it and turns it to face the eye)
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), M.vmFlash.clone());
  aura.position.set(0, 0, -0.42); aura.renderOrder = 1; g.add(aura);
  Object.assign(g.userData, { aura, bones: { base, collar, ringA, coil, slide, spin, warhead: wh, blaster: bl, spread: sp, rapid: rp, rocket: rk }, petals, mz, screen: { cv, tex, key: '' }, flash, meshes });
  return g;
}
