// Effects: pooled and instanced (doc 14 #17: no per-projectile lights; pools, not churn).
//   shots / bolts   one InstancedMesh each, rebuilt from the sim lists every frame
//   bits            sparks + debris: one InstancedMesh of little cubes with CPU physics
//   booms           a few flat-shaded fireball shells, scaled and faded
//   rain            line streaks moved in the vertex shader around the camera (night)
//   shadow          a soft dark blob straight under you (where you are)
//   marker + close  the landing reticle at the look-ahead's touchdown point, and a ring that closes
//                   on it as the moment arrives (where you'll land, and when)
//   arc             dots along the predicted path down to the reticle
import * as THREE from 'three';
import { ringTex, glowTex } from './textures.js';
import { seg } from './retro.js';
import { EnemyFX } from './fx-enemy.js';

const _o = new THREE.Object3D(), _c = new THREE.Color(), HOT = new THREE.Color(0xfff0a0), COOL = new THREE.Color(0xff4020);
const SHOT_COL = { blaster: 0x7ff6ff, spread: 0xffa04a, rapid: 0x9fff6a, rocket: 0xff5a3a };

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.shake = 0;
    this.k = 1; this.rainK = 1; // quality preset: particle count and rain density multipliers
    // projectiles
    const shotGeo = new THREE.BoxGeometry(0.2, 0.2, 1.8);
    this.shots = new THREE.InstancedMesh(shotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), 96);
    this.shots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(96 * 3), 3);
    this.shots.frustumCulled = false; this.shots.count = 0;
    this.enemy = new EnemyFX(scene, this); // enemy bolts, sprites, sights and debris (fx-enemy.js)
    scene.add(this.shots);
    // bits
    this.N = 260;
    this.bits = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), this.N);
    this.bits.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.N * 3), 3);
    this.bits.frustumCulled = false;
    this.bitData = [];
    for (let i = 0; i < this.N; i++) this.bitData.push({ life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.1, g: 9, spin: 0 });
    this.next = 0;
    scene.add(this.bits);
    // fireballs
    this.booms = [];
    const bgeo = new THREE.IcosahedronGeometry(1, seg(1, 0));
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(bgeo, new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, depthWrite: false }));
      m.visible = false; m.userData = { life: 0, max: 0.5, r: 2 };
      scene.add(m); this.booms.push(m);
    }
    // shadow, landing reticle, closing ring, arc dots
    const decal = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: false };
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x000000, opacity: 0.6, ...decal }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = 4;
    this.marker = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: ringTex(), color: 0x7ff6ff, ...decal }));
    this.marker.rotation.x = -Math.PI / 2; this.marker.renderOrder = 5;
    this.close = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, seg(40, 20)), new THREE.MeshBasicMaterial({ color: 0x7ff6ff, side: THREE.DoubleSide, ...decal }));
    this.close.rotation.x = -Math.PI / 2; this.close.renderOrder = 5;
    this.arc = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.07, 0), new THREE.MeshBasicMaterial({ color: 0x7ff6ff, transparent: true, opacity: 0.85, depthWrite: false, fog: false }), 28);
    this.arc.frustumCulled = false; this.arc.count = 0; this.arc.renderOrder = 5;
    scene.add(this.shadow, this.marker, this.close, this.arc);
    // boss danger zones: a red ring with a disc that fills in as the hit nears
    this.zoneMeshes = [];
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, seg(40, 20)), new THREE.MeshBasicMaterial({ color: 0xff2a3a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, ...decal }));
      const fill = new THREE.Mesh(new THREE.CircleGeometry(1, seg(40, 20)), new THREE.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: 0.35, side: THREE.DoubleSide, ...decal }));
      ring.rotation.x = fill.rotation.x = -Math.PI / 2; ring.renderOrder = fill.renderOrder = 5;
      g.add(ring, fill); g.visible = false; g.userData = { ring, fill };
      scene.add(g); this.zoneMeshes.push(g);
    }
    // wind streaks rushing up past you in a fast fall (a cylinder of lines around the camera)
    {
      const N = 160, pos = new Float32Array(N * 6), seed = new Float32Array(N * 2), end = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2, r = 1.4 + Math.random() * 5;
        pos.set([Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(a) * r, 0, Math.sin(a) * r], i * 6);
        const s = Math.random(); seed.set([s, s], i * 2); end.set([0, 1], i * 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
      g.setAttribute('end', new THREE.BufferAttribute(end, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uK: { value: 0 }, uCam: { value: new THREE.Vector3() } },
        vertexShader: /* glsl */ `
          attribute float seed; attribute float end; uniform float uT; uniform float uK; uniform vec3 uCam; varying float vA;
          void main() {
            float y = mod(seed * 16.0 + uT * (14.0 + 26.0 * uK) * (0.8 + seed * 0.4), 16.0) - 8.0;
            vec3 p = vec3(position.x, y + end * (0.6 + 1.6 * uK), position.z) + uCam;
            vA = (1.0 - abs(y) / 8.0) * uK;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */ `varying float vA; void main() { gl_FragColor = vec4(0.85, 0.95, 1.0, vA * 0.4); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      });
      this.windLines = new THREE.LineSegments(g, mat);
      this.windLines.frustumCulled = false; this.windLines.visible = false;
      scene.add(this.windLines);
    }
    this.rain = null;
    // shockwave rings (boss slams)
    this.waves = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, seg(40, 20)), new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2; m.visible = false; m.userData = { life: 0, r: 6 };
      scene.add(m); this.waves.push(m);
    }
  }

  // Arc dots along a flat [x, y, z, …] path (one point per 1/30 s), skipping the first few (they'd
  // sit in your face) and spacing the rest out.
  setArc(path, color) {
    let n = 0;
    if (path) {
      const pts = path.length / 3;
      for (let i = 4; i < pts - 1 && n < 28; i += 2) {
        _o.position.set(path[i * 3], path[i * 3 + 1], path[i * 3 + 2]);
        _o.rotation.set(0, 0, 0); _o.scale.setScalar(1 - 0.4 * (i / pts)); _o.updateMatrix();
        this.arc.setMatrixAt(n++, _o.matrix);
      }
      this.arc.material.color.set(color);
    }
    this.arc.count = n;
    this.arc.instanceMatrix.needsUpdate = true;
  }

  zones(list, t) {
    for (let i = 0; i < this.zoneMeshes.length; i++) {
      const g = this.zoneMeshes[i], Z = list[i];
      g.visible = !!Z;
      if (!Z) continue;
      const k = 1 - Math.max(0, Z.t) / (Z.max || 1);
      g.position.set(Z.x, Z.y + 0.07, Z.z);
      g.userData.ring.scale.setScalar(Z.r);
      g.userData.fill.scale.setScalar(Math.max(0.05, Z.r * k));
      g.userData.ring.material.opacity = 0.6 + 0.4 * Math.sin(t * (12 + k * 30));
    }
  }

  wind(k, t, camera) {
    const W = this.windLines;
    W.visible = k > 0.02;
    if (!W.visible) return;
    W.material.uniforms.uK.value = k; W.material.uniforms.uT.value = t; W.material.uniforms.uCam.value.copy(camera.position);
  }

  shockwave(x, y, z, r, alpha = 1) {
    const m = this.waves.find((q) => !q.visible) || this.waves[0];
    m.visible = true; m.position.set(x, y, z); m.userData.life = 0; m.userData.r = r; m.userData.a = alpha;
  }

  // ---- spawners
  burst(x, y, z, n, color, speed = 6, size = 0.12, life = 0.6, grav = 12) {
    n = Math.max(1, Math.round(n * this.k));
    _c.set(color);
    for (let k = 0; k < n; k++) {
      const b = this.bitData[this.next], i = this.next;
      this.next = (this.next + 1) % this.N;
      const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, r = Math.sqrt(1 - u * u), s = speed * (0.4 + Math.random() * 0.8);
      Object.assign(b, { life: 0, max: life * (0.6 + Math.random() * 0.8), x, y, z, vx: Math.cos(a) * r * s, vy: u * s + speed * 0.3, vz: Math.sin(a) * r * s, s: size * (0.6 + Math.random() * 0.8), g: grav, spin: Math.random() * 10 });
      this.bits.setColorAt(i, _c);
    }
    this.bits.instanceColor.needsUpdate = true;
  }

  boom(x, y, z, r = 2, color = 0xffa040) {
    const m = this.booms.find((b) => !b.visible) || this.booms[0];
    m.visible = true; m.position.set(x, y, z);
    m.userData.life = 0; m.userData.max = 0.45 + r * 0.05; m.userData.r = r;
    m.material.color.set(color);
    this.burst(x, y, z, 14, 0xffd060, 9, 0.2, 0.7, 10);
    this.burst(x, y, z, 10, 0x3a3a44, 6, 0.28, 1.1, 14);
    this.shake = Math.max(this.shake, Math.min(0.5, r * 0.08));
  }

  setRain(on, scene) {
    if (on && !this.rain) {
      const N = 1400, pos = new Float32Array(N * 6), seed = new Float32Array(N * 6);
      for (let i = 0; i < N; i++) {
        const x = Math.random() * 60 - 30, y = Math.random() * 40, z = Math.random() * 60 - 30;
        pos.set([x, y, z, x + 0.05, y - 0.9, z + 0.02], i * 6);
        const s = Math.random();
        seed.set([s, s, s, s, s, s], i * 6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uCam: { value: new THREE.Vector3() } },
        vertexShader: /* glsl */ `
          attribute float seed; uniform float uT; uniform vec3 uCam; varying float vA;
          void main() {
            vec3 p = position;
            p.y = mod(p.y - uT * (22.0 + seed * 8.0), 40.0) - 20.0;
            p.x = mod(p.x - uCam.x + 30.0, 60.0) - 30.0 + uCam.x;
            p.z = mod(p.z - uCam.z + 30.0, 60.0) - 30.0 + uCam.z;
            p.y += uCam.y;
            vA = 0.35 + seed * 0.35;
            gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */ `varying float vA; void main() { gl_FragColor = vec4(0.7, 0.8, 1.0, vA); }`,
        transparent: true, depthWrite: false,
      });
      this.rain = new THREE.LineSegments(g, mat);
      this.rain.frustumCulled = false;
      scene.add(this.rain);
    } else if (!on && this.rain) { this.rain.removeFromParent(); this.rain.geometry.dispose(); this.rain.material.dispose(); this.rain = null; }
  }

  // ---- per frame
  update(dt, w, camera, t) {
    this.shake = Math.max(0, this.shake - dt * 1.8);
    // shots: oriented along velocity
    let n = 0;
    for (const s of w.shots) {
      if (n >= 96) break;
      _o.position.set(s.x, s.y, s.z);
      _o.lookAt(s.x + s.vx, s.y + s.vy, s.z + s.vz);
      const k = s.kind === 'rocket' ? 2.2 : s.kind === 'spread' ? 0.8 : 1;
      _o.scale.set(k, k, k * (s.kind === 'rocket' ? 0.7 : 1));
      _o.updateMatrix();
      this.shots.setMatrixAt(n, _o.matrix);
      this.shots.setColorAt(n, _c.set(SHOT_COL[s.kind] || 0xffffff));
      n++;
    }
    this.shots.count = n;
    this.shots.instanceMatrix.needsUpdate = true;
    if (this.shots.instanceColor) this.shots.instanceColor.needsUpdate = true;
    this.enemy.update(dt, w, camera, t);
    // bits
    for (let i = 0; i < this.N; i++) {
      const b = this.bitData[i];
      if (b.life >= b.max) { _o.scale.setScalar(0); _o.position.set(0, -9999, 0); _o.updateMatrix(); this.bits.setMatrixAt(i, _o.matrix); continue; }
      b.life += dt;
      b.vy -= b.g * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      const k = 1 - b.life / b.max;
      _o.position.set(b.x, b.y, b.z); _o.rotation.set(b.spin * b.life, b.spin * 0.7 * b.life, 0); _o.scale.setScalar(Math.max(0.001, b.s * k));
      _o.updateMatrix(); this.bits.setMatrixAt(i, _o.matrix);
    }
    this.bits.instanceMatrix.needsUpdate = true;
    for (const m of this.booms) {
      if (!m.visible) continue;
      const u = m.userData; u.life += dt;
      const k = u.life / u.max;
      if (k >= 1) { m.visible = false; continue; }
      m.scale.setScalar(u.r * (0.3 + 0.9 * Math.sqrt(k)));
      m.material.opacity = 1 - k;
      m.material.color.lerpColors(HOT, COOL, k);
      m.rotation.set(t * 3, t * 2, 0);
    }
    for (const m of this.waves) {
      if (!m.visible) continue;
      const u = m.userData; u.life += dt;
      const k = u.life / 0.4;
      if (k >= 1) { m.visible = false; continue; }
      m.scale.setScalar(0.3 + u.r * k);
      m.material.opacity = (1 - k) * (u.a ?? 1);
    }
    if (this.rain) { this.rain.material.uniforms.uT.value = t; this.rain.material.uniforms.uCam.value.copy(camera.position); this.rain.geometry.setDrawRange(0, Math.round(1400 * this.rainK) * 2); }
  }
}
