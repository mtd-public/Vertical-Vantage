// Enemy effects, all pooled and instanced (a handful of draw calls for every enemy on the stage):
//   halos    additive camera-facing glow sprites: eyes, exhausts, muzzle flares, charge orbs, death
//            flashes, the bolts' halos. Requested every frame by the enemy views (enemy-view.js).
//   rings    additive camera-facing rings: the drone's converging charge ring, death shock rings
//   jets     additive cones: drone thrusters
//   sights   laser sights: a hot core line and a glow sheath (guards, turrets)
//   bolts    enemy bolts: a white-hot core in a spinning magenta caltrop, a halo and a short trail —
//            nothing like your own cyan darts
//   chunks   a pool of debris meshes: a dying enemy breaks into its own pieces, which tumble, bounce
//            once and shrink away, trailing embers
//   flashes  short-lived halos and rings (deaths, hits, muzzle flashes)
// Sparks and smoke reuse FX.burst (the shared cube particles).
import * as THREE from 'three';
import { canvasTex } from './textures.js';
import { groundBelow } from '../sim/plats.js';
import { enemyMaterial, EC } from './enemy-models.js';

const _o = new THREE.Object3D(), _c = new THREE.Color(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0);
const PINK = new THREE.Color(0xff2a7a), HOT = new THREE.Color(0xfff0f6);
// Death colours per type (the guard's comes from its trim).
export const KIND_COL = { drone: EC.pink, walker: EC.amber, spiker: EC.red, guard: 0x2be8ff, turret: EC.haz, server: 0x2bff7a };

function flareTex() { // a soft glow with a hot core (blocky in retro: fine)
  return canvasTex(32, 32, (g) => {
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.18, 'rgba(255,255,255,0.85)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.28)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  }, false);
}
function ringTex() {
  return canvasTex(32, 32, (g) => {
    const grd = g.createRadialGradient(16, 16, 9, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.55, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  }, false);
}
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false };
function inst(geo, mat, n) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  m.frustumCulled = false; m.count = 0; m.visible = false;
  return m;
}

export class EnemyFX {
  constructor(scene, fx) {
    this.fx = fx; this.cam = null; this.flashK = 1; this.night = 0; this.fogFar = 300; this.fogNear = 60;
    // sprites
    this.halos = inst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: flareTex(), ...ADD }), 220);
    this.rings = inst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), ...ADD }), 40);
    this.halos.renderOrder = this.rings.renderOrder = 6;
    this.nh = 0; this.nr = 0;
    // thruster cones: base at the origin, pointing +Y, length 1, bright at the nozzle → dark at the tip
    const jg = new THREE.ConeGeometry(1, 1, 6, 1, true).translate(0, 0.5, 0);
    { const p = jg.attributes.position, col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = 1 - p.getY(i); col.set([k, k, k], i * 3); } jg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    this.jets = inst(jg, new THREE.MeshBasicMaterial({ vertexColors: true, ...ADD, side: THREE.DoubleSide }), 48);
    this.nj = 0;
    // laser sights: unit boxes along +Z (lookAt'd and stretched)
    const sg = new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5);
    const hg = sg.clone(); // the sheath fades out along its length (additive: dark = gone)
    { const p = hg.attributes.position, col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = 1 - 0.8 * p.getZ(i); col.set([k, k, k], i * 3); } hg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    this.sights = inst(sg, new THREE.MeshBasicMaterial({ fog: false }), 24);
    this.sheaths = inst(hg, new THREE.MeshBasicMaterial({ vertexColors: true, ...ADD }), 24);
    this.ns = 0;
    // bolts
    const N = 64;
    this.boltCore = inst(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), N);
    const star = [];
    for (const [x, y, z] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
      const c = new THREE.ConeGeometry(0.09, 0.34, 4).translate(0, 0.27, 0);
      c.applyQuaternion(_q.setFromUnitVectors(_Y, _v.set(x, y, z)));
      star.push(c.toNonIndexed());
    }
    star.push(new THREE.OctahedronGeometry(0.16, 0));
    this.boltShell = inst(mergeSimple(star), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), N);
    const tg = new THREE.ConeGeometry(0.17, 1, 6, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5); // apex at +Z
    { const p = tg.attributes.position, col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { const k = Math.max(0, 1 - p.getZ(i)); col.set([k, k * 0.35, k * 0.6], i * 3); } tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    this.boltTrail = new THREE.InstancedMesh(tg, new THREE.MeshBasicMaterial({ vertexColors: true, ...ADD, side: THREE.DoubleSide }), N);
    this.boltTrail.frustumCulled = false; this.boltTrail.count = 0;
    this.boltN = N;
    // debris chunks (enemy material: their lights stay lit as they tumble)
    this.chunkMat = enemyMaterial();
    this.chunkMat.userData.own = false;
    this.chunkMat.userData.u.uEye.value.set(EC.red);
    this.chunks = [];
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(undefined, this.chunkMat);
      m.visible = false; m.frustumCulled = false; m.matrixAutoUpdate = true;
      m.userData = { vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, life: 0, max: 1, floor: -1e9, bounce: 0, ember: 0, col: 0 };
      scene.add(m); this.chunks.push(m);
    }
    this.ci = 0;
    // flashes: { kind 0 halo / 1 ring, life, max, x, y, z, s0, s1, r, g, b, pow }
    this.tr = [];
    for (let i = 0; i < 48; i++) this.tr.push({ on: false, kind: 0, life: 0, max: 1, x: 0, y: 0, z: 0, s0: 0, s1: 1, r: 1, g: 1, b: 1, pow: 1 });
    this.ti = 0;
    scene.add(this.halos, this.rings, this.jets, this.sights, this.sheaths, this.boltCore, this.boltShell, this.boltTrail);
  }

  setTheme(th) {
    this.night = th.night || 0;
    this.fogNear = th.fog ? th.fog[0] : 60; this.fogFar = th.fog ? th.fog[1] : 300;
  }

  // Called by the renderer before the enemy views run (they request sprites as they pose).
  begin(cam, R) { this.cam = cam; this.flashK = R ? R.flashK : 1; }

  // ---- per-frame requests
  // A glow sprite at (x, y, z), size metres, colour × k. Pulled toward the camera so the model's own
  // surface doesn't clip it; never smaller than a few pixels (lights read at any distance), faded out
  // by the theme's fog (additive sprites can't fog toward a colour).
  halo(x, y, z, size, color, k = 1, pull = 0.3, minPx = 0.03) {
    if (this.nh >= 220 || !this.cam || k <= 0.01) return;
    const c = this.cam.position;
    _d.set(c.x - x, c.y - y, c.z - z);
    const dist = _d.length() || 1;
    const fade = Math.min(1, Math.max(0, (this.fogFar - dist) / Math.max(1, this.fogFar - this.fogNear)));
    if (fade <= 0) return;
    _o.position.set(x, y, z).addScaledVector(_d, Math.min(pull, dist * 0.5) / dist);
    _o.quaternion.copy(this.cam.quaternion);
    _o.scale.setScalar(Math.max(size, dist * minPx));
    _o.updateMatrix();
    this.halos.setMatrixAt(this.nh, _o.matrix);
    this.halos.setColorAt(this.nh, _c.set(color).multiplyScalar(k * fade));
    this.nh++;
  }
  ring(x, y, z, size, color, k = 1) {
    if (this.nr >= 40 || !this.cam || k <= 0.01) return;
    _o.position.set(x, y, z);
    _o.quaternion.copy(this.cam.quaternion);
    _o.scale.setScalar(size);
    _o.updateMatrix();
    this.rings.setMatrixAt(this.nr, _o.matrix);
    this.rings.setColorAt(this.nr, _c.set(color).multiplyScalar(k));
    this.nr++;
  }
  // A thruster flame from (x, y, z) along unit (dx, dy, dz).
  jet(x, y, z, dx, dy, dz, len, width, color, k = 1) {
    if (this.nj >= 48) return;
    _o.position.set(x, y, z);
    _o.quaternion.setFromUnitVectors(_Y, _v.set(dx, dy, dz));
    _o.scale.set(width, len, width);
    _o.updateMatrix();
    this.jets.setMatrixAt(this.nj, _o.matrix);
    this.jets.setColorAt(this.nj, _c.set(color).multiplyScalar(k));
    this.nj++;
  }
  // A laser sight from a to b; k 0..1 = how close the shot is (thicker, hotter).
  sight(ax, ay, az, bx, by, bz, k, color = 0xff2238) {
    if (this.ns >= 24) return;
    _o.position.set(ax, ay, az);
    _o.lookAt(bx, by, bz);
    // it stops short of you (a line that ends in your face is just a smear)
    const len = Math.max(0.5, Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az)) - 1.1);
    const th = 0.022 + 0.018 * k;
    _o.scale.set(th, th, len); _o.updateMatrix();
    this.sights.setMatrixAt(this.ns, _o.matrix);
    this.sights.setColorAt(this.ns, _c.set(color).lerp(HOT, 0.2 + 0.55 * k));
    _o.scale.set(th * 3.2, th * 3.2, len); _o.updateMatrix();
    this.sheaths.setMatrixAt(this.ns, _o.matrix);
    this.sheaths.setColorAt(this.ns, _c.set(color).multiplyScalar(0.3 + 0.5 * k));
    this.ns++;
  }

  // ---- events
  flash(kind, x, y, z, s0, s1, max, color, pow = 1) {
    const f = this.tr[this.ti]; this.ti = (this.ti + 1) % this.tr.length;
    _c.set(color);
    f.on = true; f.kind = kind; f.life = 0; f.max = max; f.x = x; f.y = y; f.z = z; f.s0 = s0; f.s1 = s1; f.r = _c.r; f.g = _c.g; f.b = _c.b; f.pow = pow;
  }
  // A bolt leaves a muzzle.
  muzzle(x, y, z) {
    const k = this.flashK;
    this.flash(0, x, y, z, 0.5, 1.6, 0.09, PINK, k);
    this.flash(0, x, y, z, 0.2, 0.7, 0.06, HOT, k);
  }
  // A shot lands on an enemy: a white pop on the side facing you, sparks in its colour.
  hit(e, w) {
    const P = w && w.player;
    let x = e.x, y = e.y, z = e.z;
    if (P) { _d.set(P.x - x, P.y + 1.2 - y, P.z - z).normalize(); x += _d.x * 0.5; y += _d.y * 0.5; z += _d.z * 0.5; }
    const col = KIND_COL[e.kind] || 0xffb040;
    this.flash(0, x, y, z, 0.3, 1.3, 0.1, HOT, this.flashK);
    this.fx.burst(x, y, z, 6, 0xfff0c0, 7, 0.07, 0.3, 12);
    this.fx.burst(x, y, z, 5, col, 5, 0.1, 0.45, 12);
  }
  // A regular enemy dies: a flash, a shock ring, sparks, embers, smoke — and its model in pieces.
  kill(ev, w, L) {
    let found = null, g = null;
    if (L) for (const [en, gg] of L.enemies) {
      if (en.dead && gg.visible && en.type === ev.kind && Math.abs(en.x - ev.x) < 0.05 && Math.abs(en.z - ev.z) < 0.05) { found = en; g = gg; break; }
    }
    const col = (g && g.userData.trim) || KIND_COL[ev.kind] || 0xffffff;
    const big = ev.kind === 'turret' ? 1.25 : ev.kind === 'drone' ? 0.85 : 1;
    this.burst(ev.x, ev.y, ev.z, col, big);
    if (found) { this.shatter(found, g, !!ev.stomp, w); g.visible = false; }
  }
  burst(x, y, z, col, s = 1) {
    const k = this.flashK, fx = this.fx;
    this.flash(0, x, y, z, 0.6 * s, 3.4 * s, 0.13, HOT, k);
    this.flash(0, x, y, z, 1.2 * s, 4.6 * s, 0.34, col, 0.85 * k);
    this.flash(1, x, y, z, 0.4 * s, 3.6 * s, 0.32, col, k);
    fx.boom(x, y, z, 1.25 * s, 0xffc070);
    fx.burst(x, y, z, 12, 0xfff2b0, 11, 0.08, 0.45, 16);
    fx.burst(x, y, z, 10, col, 7, 0.12, 0.8, 9);
    fx.burst(x, y + 0.3, z, 6, 0x24242c, 2.4, 0.36, 1.3, -2.5);
  }
  // Rockets, boss blasts: a flash and a ring on top of the fireball.
  blast(x, y, z, r) {
    const k = this.flashK;
    this.flash(0, x, y, z, r * 0.4, r * 1.3, 0.14, HOT, 0.8 * k);
    this.flash(1, x, y, z, r * 0.3, r * 1.1, 0.3, 0xffa040, 0.8 * k);
  }
  // Throw the model's chunks: from where each piece was drawn, outward and up (a stomp squashes
  // them out sideways), spinning.
  shatter(e, g, stomp, w) {
    const U = g.userData;
    if (!U.chunks || !U.chunks.length) return;
    g.updateMatrixWorld(true);
    const cx = e.x, cy = e.y + (e.top || 1) * 0.5, cz = e.z;
    const under = w ? groundBelow(w.plats, cx, cz, e.y + 0.3) : null;
    const floor = under ? under.h + under.oy : -1e9;
    const col = U.trim || KIND_COL[e.type] || 0xffffff;
    for (const c of U.chunks) {
      const m = this.chunks[this.ci]; this.ci = (this.ci + 1) % this.chunks.length;
      m.geometry = c.geo; m.visible = true;
      m.position.set(c.x, c.y, c.z).applyMatrix4(c.mesh.matrixWorld);
      c.mesh.getWorldQuaternion(m.quaternion);
      m.scale.setScalar(1);
      let dx = m.position.x - cx, dy = m.position.y - cy, dz = m.position.z - cz;
      const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      dx /= l; dy /= l; dz /= l;
      const sp = (stomp ? 4.5 : 2.5) + Math.random() * 2.5;
      const u = m.userData;
      u.vx = dx * sp + (Math.random() - 0.5) * 1.5; u.vz = dz * sp + (Math.random() - 0.5) * 1.5;
      u.vy = stomp ? 1 + Math.random() * 1.5 : 3.2 + dy * 2 + Math.random() * 2.2;
      u.wx = (Math.random() - 0.5) * 14; u.wy = (Math.random() - 0.5) * 14; u.wz = (Math.random() - 0.5) * 14;
      u.life = 0; u.max = 1.1 + Math.random() * 0.6; u.floor = floor; u.bounce = 0; u.ember = Math.random() * 0.05; u.col = col;
    }
  }

  // ---- per frame (after the enemy views have posed and requested)
  update(dt, w, camera, t) {
    this.cam = camera;
    // bolts
    let n = 0;
    const tr = this.boltTrail;
    for (const b of w.bolts) {
      if (n >= this.boltN) break;
      _o.position.set(b.x, b.y, b.z);
      _o.rotation.set(t * 7 + n, t * 9, 0); _o.scale.setScalar(1); _o.updateMatrix();
      this.boltCore.setMatrixAt(n, _o.matrix);
      this.boltCore.setColorAt(n, _c.copy(HOT));
      _o.rotation.set(-t * 5, t * 3 + n, t * 4); _o.scale.setScalar(1 + 0.14 * Math.sin(t * 31 + n * 2)); _o.updateMatrix();
      this.boltShell.setMatrixAt(n, _o.matrix);
      this.boltShell.setColorAt(n, _c.copy(PINK));
      _o.rotation.set(0, 0, 0); _o.lookAt(b.x - b.vx, b.y - b.vy, b.z - b.vz); _o.scale.set(1, 1, 1.7); _o.updateMatrix();
      tr.setMatrixAt(n, _o.matrix);
      this.halo(b.x, b.y, b.z, 1.5 + 0.3 * Math.sin(t * 24 + n), PINK, 0.9, 0.35, 0.04);
      this.halo(b.x, b.y, b.z, 0.55, HOT, 0.7, 0.4, 0.012);
      n++;
    }
    for (const m of [this.boltCore, this.boltShell]) { m.count = n; m.visible = n > 0; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
    tr.count = n; tr.visible = n > 0; tr.instanceMatrix.needsUpdate = true;
    // debris
    for (const m of this.chunks) {
      if (!m.visible) continue;
      const u = m.userData;
      u.life += dt;
      if (u.life >= u.max) { m.visible = false; continue; }
      u.vy -= 16 * dt;
      m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt;
      if (m.position.y < u.floor + 0.08 && u.vy < 0 && !u.bounce) { // one bounce off the deck it fell on
        m.position.y = u.floor + 0.08; u.vy = -u.vy * 0.35; u.vx *= 0.5; u.vz *= 0.5; u.wx *= 0.4; u.wz *= 0.4; u.bounce = 1;
      }
      m.rotation.x += u.wx * dt; m.rotation.y += u.wy * dt; m.rotation.z += u.wz * dt;
      const k = u.life / u.max;
      m.scale.setScalar(k > 0.75 ? Math.max(0.001, 1 - (k - 0.75) / 0.25) : 1);
      u.ember -= dt;
      if (u.ember <= 0 && u.life < 0.7) { u.ember = 0.07; this.fx.burst(m.position.x, m.position.y, m.position.z, 1, u.life < 0.25 ? 0xffd070 : u.col, 0.8, 0.09, 0.4, -1); }
    }
    // flashes
    for (const f of this.tr) {
      if (!f.on) continue;
      f.life += dt;
      const k = f.life / f.max;
      if (k >= 1) { f.on = false; continue; }
      const s = f.s0 + (f.s1 - f.s0) * (1 - (1 - k) * (1 - k)), a = (1 - k) * f.pow;
      _c.setRGB(f.r * a, f.g * a, f.b * a);
      if (f.kind === 0) this.halo(f.x, f.y, f.z, s, _c, 1, 0.2, 0); else this.ring(f.x, f.y, f.z, s, _c, 1);
    }
    // flush the sprite batches (the enemy views filled them earlier this frame)
    for (const [m, c] of [[this.halos, this.nh], [this.rings, this.nr], [this.jets, this.nj], [this.sights, this.ns], [this.sheaths, this.ns]]) {
      m.count = c; m.visible = c > 0;
      if (c) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
    }
    this.nh = this.nr = this.nj = this.ns = 0;
  }
}

// Merge plain (non-indexed, position + normal + uv) geometries without the vendored utils' checks.
function mergeSimple(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}
