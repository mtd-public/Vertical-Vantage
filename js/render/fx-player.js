// The player's shots and what they do to the world (fx.js creates this as fx.pfx). Pooled and
// instanced, bounded counts, no per-frame allocation:
//   core     a bright stretched crystal per shot                  (instanced, unlit)
//   halo     camera-facing glow: shot halos, impact flashes, jet sparks
//   trail    axial-billboard streaks: shot trails, rocket flames, impact sparks
//   rocket   the rocket's body, rolling as it flies               (instanced, lit)
//   smoke    rocket exhaust puffs that grow and fade              (instanced soft sprites, per-instance alpha)
//   ring     flat expanding rings: impact rings, the air-jump disc
//   spot     a hot glow left on the surface a shot hit
// Shots leave from the arm cannon's muzzle on screen and converge on the true line (the sim fires
// down the view line) over the first metres. Kinds: blaster (cyan bolt), spread (orange flak),
// rapid (green tracer), rocket (body, flame, smoke).
import * as THREE from 'three';
import { glowTex, canvasTex } from './textures.js';
import { seg } from './retro.js';
import { WEAPONS } from '../sim/tuning.js';
import { Kit, cyl, box } from './geo.js';

const N_SHOT = 96, N_HALO = 192, N_TRAIL = 320, N_ROCKET = 16, N_SMOKE = 96, N_RING = 12, N_SPOT = 24;
const N_SPARK = 120, N_GLOW = 72;
const CONVERGE = 9; // metres over which a shot slides from the muzzle onto the view line

// per kind: core [width, length] and colour mix toward white; halo size; trails [width, length, white mix, gain]
const STYLE = {
  blaster: { col: 0x2be8ff, core: [0.1, 0.62], coreW: 0.7, halo: 1.15, haloK: 0.9, trails: [[0.26, 3.0, 0, 0.9], [0.08, 1.7, 0.8, 0.9]], spark: 8 },
  spread: { col: 0xff7a2b, core: [0.13, 0.24], coreW: 0.65, halo: 0.85, haloK: 0.85, trails: [[0.16, 1.3, 0.1, 0.9]], spark: 4 },
  rapid: { col: 0x9fff6a, core: [0.055, 0.8], coreW: 0.75, halo: 0.55, haloK: 0.6, trails: [[0.09, 4.6, 0.25, 0.85]], spark: 4 },
  rocket: { col: 0xff3b5c, halo: 1.5, haloK: 0.9 },
};
const COL = {}, COREC = {};
for (const k in STYLE) { COL[k] = new THREE.Color(STYLE[k].col); COREC[k] = new THREE.Color(STYLE[k].col).lerp(new THREE.Color(0xffffff), STYLE[k].coreW ?? 0.6); }
const FLAME = new THREE.Color(0xffa040), FLAME_HOT = new THREE.Color(0xfff0c0), WHITE = new THREE.Color(0xffffff);

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const _dir = new THREE.Vector3(), _side = new THREE.Vector3(), _nrm = new THREE.Vector3(), _toCam = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
const _right = new THREE.Vector3(), _up = new THREE.Vector3(), _Z = new THREE.Vector3(0, 0, 1), _q2 = new THREE.Quaternion(), _c2 = new THREE.Color();

// soft streak: bright at the head (v = 0), fading to the tail, soft across
function trailTex() {
  return canvasTex(16, 64, (g) => {
    const img = g.createImageData(16, 64);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 16; x++) {
      const v = 1 - (y + 0.5) / 64, u = (x + 0.5) / 16, au = Math.max(0, 1 - Math.abs(u * 2 - 1)) ** 1.2, av = (1 - v) ** 1.5;
      const i = (y * 16 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(255 * Math.min(1, au * av * 1.3));
    }
    g.putImageData(img, 0, 0);
  }, false);
}
function softRingTex() {
  return canvasTex(32, 32, (g) => {
    const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.62, 'rgba(255,255,255,0.15)'); grd.addColorStop(0.82, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
  }, false);
}
// a puff: a few overlapping soft blobs, so it isn't a perfect disc
export function puffTex() {
  return canvasTex(32, 32, (g) => {
    for (const [x, y, r, a] of [[16, 17, 13, 0.55], [11, 13, 8, 0.5], [21, 12, 8, 0.45], [20, 21, 8, 0.4], [12, 21, 7, 0.4]]) {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(255,255,255,${a})`); grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
    }
  }, false);
}
// per-instance alpha for a transparent instanced material (smoke)
export function withAlpha(mat) {
  mat.onBeforeCompile = (s) => {
    s.vertexShader = 'attribute float aAlpha;\nvarying float vAlpha;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvAlpha = aAlpha;');
    s.fragmentShader = 'varying float vAlpha;\n' + s.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n\tdiffuseColor.a *= vAlpha;');
  };
  return mat;
}
function inst(geo, mat, n, color = true) {
  const m = new THREE.InstancedMesh(geo, mat, n);
  if (color) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  m.frustumCulled = false; m.count = 0; m.visible = false;
  return m;
}
const pool = (n, make) => Array.from({ length: n }, make);

export class PlayerFX {
  constructor(scene, fx) {
    this.fx = fx; // quality: fx.k scales particle counts
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false };
    this.core = inst(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), N_SHOT);
    this.halo = inst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(), ...add }), N_HALO);
    const tg = new THREE.PlaneGeometry(1, 1); tg.rotateX(Math.PI / 2); tg.translate(0, 0, 0.5); // x across, z 0 (head) → 1 (tail)
    this.trail = inst(tg, new THREE.MeshBasicMaterial({ map: trailTex(), side: THREE.DoubleSide, ...add }), N_TRAIL);
    // the rocket: a white body with a red nose, a yellow band and four fins, its length along +z (nose at -z)
    const K = new Kit(), R = Math.PI / 2;
    K.add('r', cyl(0.09, 0.09, 0.5, seg(8, 6), { rx: R, color: 0xe8ecf3 }), cyl(0.012, 0.09, 0.22, seg(8, 6), { rx: -R, z: -0.36, color: 0xff3b5c }),
      cyl(0.094, 0.094, 0.06, seg(8, 6), { rx: R, z: -0.12, color: 0xffcc1a }), cyl(0.08, 0.06, 0.08, seg(8, 6), { rx: R, z: 0.29, color: 0x3a404e }),
      ...[0, 1, 2, 3].map((k) => box(0.02, 0.16, 0.16, { x: Math.cos(k * R) * 0.12, y: Math.sin(k * R) * 0.12, z: 0.2, rz: k * R, color: k % 2 ? 0xff3b5c : 0x3a404e })));
    this.rocket = inst(K.build().r, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), N_ROCKET, false);
    const sg = new THREE.PlaneGeometry(1, 1);
    sg.setAttribute('aAlpha', (this.smokeA = new THREE.InstancedBufferAttribute(new Float32Array(N_SMOKE), 1)));
    this.smoke = inst(sg, withAlpha(new THREE.MeshBasicMaterial({ map: puffTex(), transparent: true, depthWrite: false })), N_SMOKE);
    this.smokeCol = new THREE.Color(0xb8bcc4); // set per stage (setTheme)
    this.ring = inst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: softRingTex(), side: THREE.DoubleSide, ...add }), N_RING);
    this.spot = inst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, ...add }), N_SPOT);
    this.halo.renderOrder = this.trail.renderOrder = this.ring.renderOrder = this.spot.renderOrder = 6;
    this.group = new THREE.Group();
    this.meshes = [this.core, this.halo, this.trail, this.rocket, this.smoke, this.ring, this.spot];
    this.group.add(...this.meshes);
    scene.add(this.group);
    // particle pools
    this.sparks = pool(N_SPARK, () => ({ life: 1, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, w: 0.04, len: 0.04, c: new THREE.Color() }));
    this.glows = pool(N_GLOW, () => ({ life: 1, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: 1, s1: 0, k: 1, c: new THREE.Color() }));
    this.puffs = pool(N_SMOKE, () => ({ life: 1, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s0: 0.1, s1: 0.6, shade: 0.7, rot: 0 }));
    this.rings = pool(N_RING, () => ({ life: 1, max: 1, x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, s0: 0.2, s1: 1, k: 1, c: new THREE.Color() }));
    this.spots = pool(N_SPOT, () => ({ life: 1, max: 1, x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, s: 0.5, c: new THREE.Color() }));
    this.iSpark = this.iGlow = this.iPuff = this.iRing = this.iSpot = 0;
    this.mx = 0.45; this.my = -0.35; this.mOn = false; // the muzzle on screen (NDC), set by the view
    this.cam = null; this.rx = this.ry = 0; this.nt = this.nh = 0;
    this.flashK = 1; // the reduced-flash option (< 1): dimmer impact flashes and jump rings
  }

  setMuzzle(x, y, on) { this.mx = x; this.my = y; this.mOn = on; }
  // Smoke takes the stage's light: pale grey by day, a dim violet-grey at night.
  setTheme(th) { this.smokeCol.set(0xb8bcc4).lerp(_c.set(th.hemi[0]), 0.35).multiplyScalar(th.night > 0.5 ? 0.5 : 1); }

  // ---- spawners
  spark(x, y, z, vx, vy, vz, col, life, w = 0.035) {
    const s = this.sparks[this.iSpark]; this.iSpark = (this.iSpark + 1) % N_SPARK;
    s.life = 0; s.max = life; s.x = x; s.y = y; s.z = z; s.vx = vx; s.vy = vy; s.vz = vz; s.w = w; s.c.copy(col);
  }
  glow(x, y, z, s0, s1, life, col, k = 1, vx = 0, vy = 0, vz = 0) {
    const g = this.glows[this.iGlow]; this.iGlow = (this.iGlow + 1) % N_GLOW;
    g.life = 0; g.max = life; g.x = x; g.y = y; g.z = z; g.vx = vx; g.vy = vy; g.vz = vz; g.s0 = s0; g.s1 = s1; g.k = k; g.c.copy(col);
  }
  puff(x, y, z, s0, s1, life, shade, vx = 0, vy = 0.4, vz = 0) {
    const p = this.puffs[this.iPuff]; this.iPuff = (this.iPuff + 1) % N_SMOKE;
    p.life = 0; p.max = life; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.s0 = s0; p.s1 = s1; p.shade = shade; p.rot = Math.random() * 6;
  }
  ringAt(x, y, z, nx, ny, nz, s0, s1, life, col, k = 1) {
    const r = this.rings[this.iRing]; this.iRing = (this.iRing + 1) % N_RING;
    r.life = 0; r.max = life; r.x = x; r.y = y; r.z = z; r.nx = nx; r.ny = ny; r.nz = nz; r.s0 = s0; r.s1 = s1; r.k = k; r.c.copy(col);
  }

  // A heel-jet spark left behind as you rise (k: how hot the jet still is).
  jetPuff(x, y, z, col, k) {
    this.glow(x, y, z, 0.32 * (0.5 + k * 0.5), 0.04, 0.22 + Math.random() * 0.1, col, 0.8 * k, (Math.random() - 0.5) * 0.6, -2.5 - Math.random() * 2, (Math.random() - 0.5) * 0.6);
  }
  // The air-jump disc: a flat ring that bursts out under your feet (gold on the third jump).
  jumpRing(x, y, z, stage) {
    _c.set(stage === 2 ? 0xffd23a : 0x7ff6ff);
    this.ringAt(x, y, z, 0, 1, 0, 0.3, 1.5 + stage * 0.5, 0.28, _c, 0.8 * this.flashK);
  }
  // Rocket and spread shots: a puff of smoke at the muzzle.
  fire(e) {
    if ((e.weapon !== 'rocket' && e.weapon !== 'spread') || !this.cam) return;
    this.muzzleWorld(_a, 1.5);
    const n = Math.max(1, Math.round((e.weapon === 'rocket' ? 3 : 2) * this.fx.k));
    for (let i = 0; i < n; i++) this.puff(_a.x + (Math.random() - 0.5) * 0.15, _a.y + (Math.random() - 0.5) * 0.15, _a.z + (Math.random() - 0.5) * 0.15, 0.05, 0.16 + Math.random() * 0.08, 0.3 + Math.random() * 0.15, 0.85, _right.x * 1.2 + (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.4, _right.z * 1.2 + (Math.random() - 0.5) * 0.6);
  }
  // A player shot hit the world: a flash, a ring on the surface, a hot spot, sparks off the normal.
  // Returns false for anything that isn't one of the player's shots (the renderer handles those).
  impact(e) {
    const S = STYLE[e.kind];
    if (!S || e.kind === 'rocket') return false;
    const col = COL[e.kind], k = this.fx.k, nx = e.nx, ny = e.ny, nz = e.nz;
    const x = e.x + nx * 0.06, y = e.y + ny * 0.06, z = e.z + nz * 0.06;
    const fk = this.flashK;
    this.glow(x, y, z, (e.kind === 'rapid' ? 0.9 : 1.4) * (0.5 + fk * 0.5), 0.3, 0.12, _c.copy(col).lerp(WHITE, 0.4), fk);
    this.glow(x, y, z, 0.5, 0.2, 0.08, WHITE, fk);
    this.ringAt(e.x + nx * 0.03, e.y + ny * 0.03, e.z + nz * 0.03, nx, ny, nz, 0.15, e.kind === 'spread' ? 0.9 : 1.2, 0.2, col, 0.9);
    const sp = this.spots[this.iSpot]; this.iSpot = (this.iSpot + 1) % N_SPOT;
    sp.life = 0; sp.max = 0.7; sp.x = e.x + nx * 0.02; sp.y = e.y + ny * 0.02; sp.z = e.z + nz * 0.02; sp.nx = nx; sp.ny = ny; sp.nz = nz; sp.s = 0.55 + Math.random() * 0.2; sp.c.copy(col).lerp(FLAME, 0.4);
    const n = Math.max(2, Math.round(S.spark * k));
    for (let i = 0; i < n; i++) {
      // a random direction in the hemisphere off the surface, biased along the normal
      let dx = Math.random() * 2 - 1, dy = Math.random() * 2 - 1, dz = Math.random() * 2 - 1;
      const d = dx * nx + dy * ny + dz * nz;
      if (d < 0) { dx -= 2 * d * nx; dy -= 2 * d * ny; dz -= 2 * d * nz; }
      const sp2 = 4 + Math.random() * 7;
      dx += nx * 0.8; dy += ny * 0.8; dz += nz * 0.8;
      const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      this.spark(x, y, z, dx / l * sp2, dy / l * sp2 + 1.5, dz / l * sp2, i % 3 ? col : WHITE, 0.18 + Math.random() * 0.25, 0.03 + Math.random() * 0.02);
    }
    return true;
  }

  // the muzzle in the world: along its screen ray at depth d (camera space → world)
  muzzleWorld(out, d) {
    const cam = this.cam, P = cam.projectionMatrix.elements;
    const rx = this.mOn ? this.mx / P[0] : 0, ry = this.mOn ? this.my / P[5] : 0;
    return out.set(rx * d, ry * d, -d).applyMatrix4(cam.matrixWorld);
  }

  // ---- per frame
  // A point along a shot's visual path: its true position `back` metres behind the head, pulled
  // toward the muzzle's screen ray the nearer it is to where it left.
  pathAt(out, s, travel, back) {
    const tr = Math.max(0.3, travel - back), along = travel - tr, cv = Math.max(0, 1 - tr / CONVERGE);
    out.set(s.x - _dir.x * along, s.y - _dir.y * along, s.z - _dir.z * along);
    return out.addScaledVector(_right, this.rx * tr * cv).addScaledVector(_up, this.ry * tr * cv);
  }
  // An axial billboard from a (head) to b (tail), turned to face the camera.
  streak(a, b, wdt, col, gain) {
    if (this.nt >= N_TRAIL) return;
    _nrm.subVectors(b, a);
    if (_nrm.lengthSq() < 1e-8) return;
    _toCam.subVectors(this.cam.position, a);
    _side.crossVectors(_nrm, _toCam);
    if (_side.lengthSq() < 1e-8) return;
    _side.normalize().multiplyScalar(wdt);
    _s.crossVectors(_side, _nrm).normalize();
    _m.makeBasis(_side, _s, _nrm).setPosition(a);
    this.trail.setMatrixAt(this.nt, _m); this.trail.setColorAt(this.nt, _c.copy(col).multiplyScalar(gain)); this.nt++;
  }
  billboard(x, y, z, size, col, gain) {
    if (this.nh >= N_HALO) return;
    _m.compose(_p.set(x, y, z), this.cam.quaternion, _s.set(size, size, size));
    this.halo.setMatrixAt(this.nh, _m); this.halo.setColorAt(this.nh, _c.copy(col).multiplyScalar(gain)); this.nh++;
  }

  update(dt, w, camera, t) {
    this.cam = camera;
    const P = camera.projectionMatrix.elements, cp = camera.position, k = this.fx.k;
    this.rx = this.mOn ? this.mx / P[0] : 0; this.ry = this.mOn ? this.my / P[5] : 0;
    _right.setFromMatrixColumn(camera.matrixWorld, 0); _up.setFromMatrixColumn(camera.matrixWorld, 1);
    this.nt = 0; this.nh = 0;
    let nc = 0, nr = 0;
    const shots = w.shots;
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i], S = STYLE[s.kind];
      if (!S || nc >= N_SHOT) continue;
      const W = WEAPONS[s.kind], speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz) || 1;
      _dir.set(s.vx / speed, s.vy / speed, s.vz / speed);
      const travel = 0.4 + Math.max(0, (W ? W.life : 1) - s.life) * speed;
      const near = Math.min(1, 0.4 + travel / 6); // small as it leaves the barrel
      this.pathAt(_a, s, travel, 0);
      const col = COL[s.kind];
      if (s.kind === 'rocket') {
        if (nr < N_ROCKET) { // body along the flight line, rolling
          _q.setFromUnitVectors(_Z, _nrm.set(-_dir.x, -_dir.y, -_dir.z)).multiply(_q2.setFromAxisAngle(_Z, t * 9 + s.id));
          _m.compose(_a, _q, _s.setScalar(near));
          this.rocket.setMatrixAt(nr++, _m);
        }
        this.pathAt(_b, s, travel, 0.32 * near); // the nozzle
        const fl = 0.8 + Math.random() * 0.4;
        this.pathAt(_p, s, travel, (0.32 + 2.2 * fl) * near); this.streak(_b, _p, 0.34 * near, FLAME, 0.75); // the flame: an outer plume,
        this.pathAt(_p, s, travel, (0.32 + 1.1 * fl) * near); this.streak(_b, _p, 0.16 * near, FLAME_HOT, 1); // a hot core
        this.billboard(_b.x, _b.y, _b.z, S.halo * near * fl, FLAME, 0.85);
        this.billboard(_b.x, _b.y, _b.z, 0.45 * near, WHITE, 0.8); // and a white-hot nozzle
        this.billboard(_a.x, _a.y, _a.z, 0.9 * near, col, 0.3);
        // exhaust smoke along the last frame's path (density independent of frame rate)
        if (travel > 5) {
          const n = Math.min(3, Math.max(1, Math.round(dt * 55 * k)));
          for (let j = 0; j < n; j++) {
            const u = Math.random() * dt * speed;
            this.puff(_b.x - _dir.x * u + (Math.random() - 0.5) * 0.1, _b.y - _dir.y * u + (Math.random() - 0.5) * 0.1, _b.z - _dir.z * u + (Math.random() - 0.5) * 0.1,
              0.12, 0.45 + Math.random() * 0.35 + Math.min(0.3, travel * 0.02), 0.8 + Math.random() * 0.6, 0.65 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 0.4, (Math.random() - 0.5) * 0.5);
          }
        }
        continue;
      }
      // core crystal along the flight line
      _nrm.copy(_dir).multiplyScalar(S.core[1] * near);
      _toCam.subVectors(cp, _a);
      const dist = _toCam.length();
      _side.crossVectors(_dir, _toCam);
      if (_side.lengthSq() < 1e-8) _side.set(1, 0, 0);
      _side.normalize();
      _s.crossVectors(_side, _dir).normalize().multiplyScalar(S.core[0] * near);
      _side.multiplyScalar(S.core[0] * near);
      _m.makeBasis(_side, _s, _nrm).setPosition(_a);
      this.core.setMatrixAt(nc, _m); this.core.setColorAt(nc, COREC[s.kind]); nc++;
      // (far shots keep a minimum size on screen, so a bolt stays readable all the way out)
      this.billboard(_a.x, _a.y, _a.z, Math.max(S.halo * near, dist * 0.035), col, S.haloK);
      for (let j = 0; j < S.trails.length; j++) {
        const T = S.trails[j];
        this.pathAt(_b, s, travel, T[1] * Math.min(1, travel / 3));
        this.streak(_a, _b, T[0] * near, T[2] ? _c2.copy(col).lerp(WHITE, T[2]) : col, T[3]);
      }
    }
    // sparks: streaks along their velocity, falling
    for (let i = 0; i < N_SPARK; i++) {
      const p = this.sparks[i];
      if (p.life >= p.max) continue;
      p.life += dt; p.vy -= 16 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const f = 1 - p.life / p.max;
      if (f <= 0) continue;
      _a.set(p.x, p.y, p.z); _b.set(p.x - p.vx * 0.035, p.y - p.vy * 0.035, p.z - p.vz * 0.035);
      this.streak(_a, _b, p.w * (0.5 + f * 0.5), p.c, 0.4 + f * 0.9);
    }
    // glows: flashes and jet sparks
    for (let i = 0; i < N_GLOW; i++) {
      const g = this.glows[i];
      if (g.life >= g.max) continue;
      g.life += dt; g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt;
      const f = g.life / g.max;
      if (f >= 1) continue;
      this.billboard(g.x, g.y, g.z, g.s0 + (g.s1 - g.s0) * f, g.c, g.k * (1 - f));
    }
    this.core.count = nc; this.halo.count = this.nh; this.trail.count = this.nt; this.rocket.count = nr;
    // smoke: soft sprites, growing, drifting, fading (warm for an instant as they leave the flame)
    let ns = 0;
    const drag = Math.exp(-dt * 2.2);
    for (let i = 0; i < N_SMOKE; i++) {
      const p = this.puffs[i];
      if (p.life >= p.max) continue;
      p.life += dt;
      const f = p.life / p.max;
      if (f >= 1) continue;
      p.vx *= drag; p.vz *= drag; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const sz = p.s0 + (p.s1 - p.s0) * Math.sqrt(f);
      _m.compose(_p.set(p.x, p.y, p.z), _q.copy(camera.quaternion).multiply(_q2.setFromAxisAngle(_Z, p.rot + f * 0.8)), _s.setScalar(sz * 1.6));
      this.smoke.setMatrixAt(ns, _m);
      _c2.copy(this.smokeCol).multiplyScalar(p.shade * 1.3);
      this.smoke.setColorAt(ns, f < 0.12 ? _c.copy(FLAME).lerp(_c2, f / 0.12) : _c2);
      this.smokeA.array[ns] = 0.7 * (1 - f) * Math.min(1, f * 10 + 0.3);
      ns++;
    }
    this.smoke.count = ns;
    // rings and hot spots, flat on their surface
    let ng = 0;
    for (let i = 0; i < N_RING; i++) {
      const r = this.rings[i];
      if (r.life >= r.max) continue;
      r.life += dt;
      const f = r.life / r.max;
      if (f >= 1) continue;
      _q.setFromUnitVectors(_Z, _nrm.set(r.nx, r.ny, r.nz));
      _m.compose(_p.set(r.x, r.y, r.z), _q, _s.setScalar(r.s0 + (r.s1 - r.s0) * Math.sqrt(f)));
      this.ring.setMatrixAt(ng, _m); this.ring.setColorAt(ng, _c.copy(r.c).multiplyScalar(r.k * (1 - f))); ng++;
    }
    this.ring.count = ng;
    let np = 0;
    for (let i = 0; i < N_SPOT; i++) {
      const s = this.spots[i];
      if (s.life >= s.max) continue;
      s.life += dt;
      const f = s.life / s.max;
      if (f >= 1) continue;
      _q.setFromUnitVectors(_Z, _nrm.set(s.nx, s.ny, s.nz));
      _m.compose(_p.set(s.x, s.y, s.z), _q, _s.setScalar(s.s * (1 - f * 0.4)));
      this.spot.setMatrixAt(np, _m); this.spot.setColorAt(np, _c.copy(s.c).multiplyScalar(0.8 * (1 - f) * (1 - f))); np++;
    }
    this.spot.count = np;
    for (let i = 0; i < this.meshes.length; i++) {
      const m = this.meshes[i];
      m.visible = m.count > 0;
      if (!m.visible) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    if (ns) this.smokeA.needsUpdate = true;
  }
}
