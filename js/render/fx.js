// Effects: pooled and instanced (doc 14 #17: no per-projectile lights; pools, not churn).
//   shots / bolts   one InstancedMesh each, rebuilt from the sim lists every frame
//   bits            sparks + debris: one InstancedMesh of little cubes with CPU physics
//   booms           a few flat-shaded fireball shells, scaled and faded
//   rain            line streaks moved in the vertex shader around the camera (night)
//   marker          the landing ring projected onto whatever is under you (Jumping Flash's shadow)
import * as THREE from 'three';
import { ringTex, glowTex } from './textures.js';
import { seg } from './retro.js';

const _o = new THREE.Object3D(), _c = new THREE.Color(), HOT = new THREE.Color(0xfff0a0), COOL = new THREE.Color(0xff4020);
const SHOT_COL = { blaster: 0x7ff6ff, spread: 0xffa04a, rapid: 0x9fff6a, rocket: 0xff5a3a };

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.shake = 0;
    // projectiles
    const shotGeo = new THREE.BoxGeometry(0.2, 0.2, 1.8);
    this.shots = new THREE.InstancedMesh(shotGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), 96);
    this.shots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(96 * 3), 3);
    this.shots.frustumCulled = false; this.shots.count = 0;
    const boltGeo = new THREE.OctahedronGeometry(0.32, 0);
    this.bolts = new THREE.InstancedMesh(boltGeo, new THREE.MeshBasicMaterial({ color: 0xff3a8a, fog: false }), 64);
    this.bolts.frustumCulled = false; this.bolts.count = 0;
    const halo = new THREE.MeshBasicMaterial({ map: glowTex(), color: 0xff3a8a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.boltHalo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 1.6), halo, 64);
    this.boltHalo.frustumCulled = false; this.boltHalo.count = 0;
    scene.add(this.shots, this.bolts, this.boltHalo);
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
    // landing marker
    this.marker = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: ringTex(), color: 0x7ff6ff, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: false }));
    this.marker.rotation.x = -Math.PI / 2; this.marker.renderOrder = 5;
    scene.add(this.marker);
    this.rain = null;
  }

  // ---- spawners
  burst(x, y, z, n, color, speed = 6, size = 0.12, life = 0.6, grav = 12) {
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
    n = 0;
    for (const b of w.bolts) {
      if (n >= 64) break;
      _o.position.set(b.x, b.y, b.z); _o.rotation.set(t * 7, t * 9, 0); _o.scale.setScalar(1); _o.updateMatrix();
      this.bolts.setMatrixAt(n, _o.matrix);
      _o.quaternion.copy(camera.quaternion); _o.updateMatrix();
      this.boltHalo.setMatrixAt(n, _o.matrix);
      n++;
    }
    this.bolts.count = this.boltHalo.count = n;
    this.bolts.instanceMatrix.needsUpdate = true; this.boltHalo.instanceMatrix.needsUpdate = true;
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
    if (this.rain) { this.rain.material.uniforms.uT.value = t; this.rain.material.uniforms.uCam.value.copy(camera.position); }
  }
}
