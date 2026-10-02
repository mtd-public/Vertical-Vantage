// What you see of yourself: the arm cannon (its own scene, camera and lights, drawn on top of the
// world) and your legs (in the world, seen when you look down). Render-only: reads the player and
// the renderer's events, owns no game state. The renderer calls
//   setTheme(th) · fire(e) · jump(e) · updateLegs(…) · updateCannon(…) · reset()
// Options it respects: R.motion (0 = calm: no bob, sway or recoil shake), R.flashK (< 1 = reduced
// flash: smaller muzzle flash, softer light), R.showCannon.
import * as THREE from 'three';
import { legsModel, cannonModel, CANNON_OPEN, addRim } from './player-models.js';
import { T } from '../sim/tuning.js';
import { puffTex, withAlpha } from './fx-player.js';

export const WEAPON_COL = { blaster: 0x2be8ff, spread: 0xff7a2b, rapid: 0x9fff6a, rocket: 0xff3b5c };
const LABEL = { blaster: 'BLSTR', spread: 'SPRD', rapid: 'PULSE', rocket: 'RCKT' };
const AMMO_MAX = { spread: 24, rapid: 160, rocket: 12 }; // a full pickup (the screen's bar)
const JET_COL = [0x7ff6ff, 0x7ff6ff, 0xffd23a];
// per weapon: how hard a shot kicks, how much heat it adds, how big its muzzle flash is
const KICK = { blaster: 1, spread: 1.5, rapid: 0.45, rocket: 2.2 }, HEAT = { blaster: 0.07, spread: 0.22, rapid: 0.045, rocket: 0.4 };
const FLASH = { blaster: 1, spread: 1.15, rapid: 0.7, rocket: 1.3 }, TUCK = [1, 1, 1.18, 1.35];
const _c = new THREE.Color(), _c2 = new THREE.Color(), _white = new THREE.Color(0xffffff), _dim = new THREE.Color(0x101418);
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();
const N_WISP = 24;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// A theme's neon, for the rim light at night: its horizon colour pushed to full saturation.
function neonOf(hex, l = 0.6) {
  const hsl = {};
  _c.set(hex).getHSL(hsl);
  return _c2.setHSL(hsl.h, 1, l).getHex();
}

export class PlayerView {
  constructor(R) {
    this.R = R;
    const M = R.M;
    // legs (world)
    this.rimLegs = { uRim: { value: new THREE.Color(0) }, uRimPow: { value: 2.5 } };
    this.rimVm = { uRim: { value: new THREE.Color(0) }, uRimPow: { value: 2.6 } };
    this.legs = legsModel(M, addRim(M.paintFlat.clone(), this.rimLegs)); // (their own material: the world's has no rim)
    R.scene.add(this.legs);
    this.lb = this.legs.userData.bones;
    this.jetMat = M.jet;
    // the arm cannon's pass: a fill from the theme's sky and ground, a key from above-left, a rim from
    // in front on the right that picks up the night's neon, a kicker from below (the city's glow), and
    // the core's own light in the mouth of the iris (it flares on every shot)
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(55, 1, 0.01, 10);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 2.0);
    this.key = new THREE.DirectionalLight(0xffffff, 1.6); this.key.position.set(-1, 2, 1);
    this.rim = new THREE.DirectionalLight(0xffffff, 0.8); this.rim.position.set(1.4, 0.7, -1.2);
    this.kicker = new THREE.DirectionalLight(0x2be8ff, 0.4); this.kicker.position.set(-0.8, -1.2, 0.2);
    this.scene.add(this.hemi, this.key, this.rim, this.kicker);
    addRim(M.vmPaint, this.rimVm);
    this.cannon = cannonModel(M);
    this.scene.add(this.cannon);
    this.cb = this.cannon.userData.bones;
    this.coreLight = new THREE.PointLight(0x2be8ff, 0.5, 0.9, 1.4);
    this.coreLight.position.set(0, 0, -0.36);
    this.cannon.add(this.coreLight);
    // heat haze: wisps of vapour that curl off the vents under sustained fire (cannon space, one draw)
    const wg = new THREE.PlaneGeometry(1, 1);
    wg.setAttribute('aAlpha', (this.wispA = new THREE.InstancedBufferAttribute(new Float32Array(N_WISP), 1)));
    this.wisps = new THREE.InstancedMesh(wg, withAlpha(new THREE.MeshBasicMaterial({ map: puffTex(), transparent: true, depthWrite: false, fog: false })), N_WISP);
    this.wisps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N_WISP * 3), 3);
    this.wisps.frustumCulled = false; this.wisps.count = 0; this.wisps.visible = false;
    this.cannon.add(this.wisps);
    this.wispData = Array.from({ length: N_WISP }, () => ({ life: 1, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.1 }));
    this.iWisp = 0; this.wispAcc = 0;
    this.M = M;
    this.pose = { x: 0.37, xp: 0.24, y: -0.31, z: -0.95, yaw: 0.26, pitch: 0, roll: 0.06, s: 0.64 }; // where the cannon sits (landscape x, portrait xp)
    this.reset();
  }

  reset() {
    this.recoil = 0; this.flashT = 0; this.kick = 1; this.heat = 0; this.spinV = 0; this.swapT = 0;
    this.held = this.held || 'blaster'; this.shown = this.shown || '';
    this.swayX = 0; this.swayY = 0; this.lastYaw = 0; this.lastPitch = 0;
    this.ringA = 0; this.fireSpin = 0; this.loadT = 9; this.side = 0;
    this.jumpT = 9; this.jumpStage = 0; this.jetT = 0; this.puffT = 0;
  }

  // Light the cannon for the stage. Packs may set th.vmRim / th.vmFill (hex) to choose the neon it
  // picks up; otherwise night themes take their horizon's hue, day themes the sun.
  setTheme(th) {
    const night = th.night || 0;
    this.hemi.color.set(th.hemi[0]).lerp(_white, 0.55 - night * 0.15);
    this.hemi.groundColor.set(th.hemi[1]).lerp(_c2.set(0x5a6070), 0.5);
    this.hemi.intensity = 2.0 - night * 0.55;
    this.key.color.set(th.key[0]).lerp(_white, 0.35);
    this.key.intensity = 1.25 + Math.min(0.6, th.key[1] * 0.2) - night * 0.25;
    this.rim.color.set(th.vmRim ?? (night > 0.5 ? neonOf(th.skyBot) : th.sun));
    this.rim.intensity = night > 0.5 ? 2.6 : 0.9;
    this.kicker.color.set(th.vmFill ?? (night > 0.5 ? 0x2be8ff : th.hemi[1]));
    this.kicker.intensity = night > 0.5 ? 1.3 : 0.5;
    // the rim: the night's neon on the edges, a faint sky sheen by day
    const rc = th.vmRim ?? (night > 0.5 ? neonOf(th.skyBot, 0.62) : th.skyBot);
    this.rimVm.uRim.value.set(rc).multiplyScalar(night > 0.5 ? 0.8 : 0.3);
    this.rimLegs.uRim.value.set(rc).multiplyScalar(night > 0.5 ? 0.7 : 0.2);
    this.R.fx.pfx.setTheme(th);
  }

  fire(e) {
    this.kick = KICK[e.weapon] ?? 1; this.recoil = 1; this.flashT = e.weapon === 'rocket' ? 0.08 : e.weapon === 'rapid' ? 0.04 : 0.05;
    this.heat = Math.min(1.6, this.heat + (HEAT[e.weapon] ?? 0.07));
    this.fireSpin = Math.min(1, this.fireSpin + 0.35);
    this.side = e.side || 0;
    this.flashRot = Math.random() * Math.PI;
    if (e.weapon === 'rapid') this.spinV = Math.min(60, this.spinV + 18);
    if (e.weapon === 'rocket') this.loadT = 0;
  }

  jump(e) {
    this.jumpT = 0; this.jumpStage = e.stage;
    if (e.stage > 0) { this.jetT = 1; this.jetMat.color.set(JET_COL[e.stage] || JET_COL[1]); }
  }

  // ------------------------------------------------------------------ legs
  // Ground: a run cycle with flat feet, a squash on landing. Takeoff: a quick push-off with the toes
  // pointed; an air jump kicks both legs down as the heel jets fire. Rising: a springy tuck (deeper on
  // the 2nd and 3rd jump) that folds back, clear of the view, and eases open toward the apex.
  // Falling: they dangle and splay (wider when falling fast), reach for the deck in the last 1.6 m,
  // and point straight down while you bounce off something's head.
  updateLegs(P, x, y, z, yaw, below, bob, sp, dt, t) {
    const lg = this.legs, B = this.lb, R = this.R;
    lg.position.set(x, y + bob * 0.3, z);
    lg.rotation.y = yaw;
    const fwd = -(P.vx * Math.sin(yaw) + P.vz * Math.cos(yaw)); // forward speed
    this.jumpT += dt; this.jetT = Math.max(0, this.jetT - dt * 3.6);
    const fall = clamp01((-P.vy - 6) / 18); // 0 … 1 as the fall gets fast
    let hl, hr, kl, kr, ftL, ftR, spread = 0.03, squash = 0, ease = Math.min(1, dt * 16);
    if (P.ground) {
      const run = Math.min(1, sp / T.RUN), ph = P.stride * 2.4, s = Math.sin(ph) * 0.72 * run;
      hl = s; hr = -s;
      kl = -Math.max(0, -s) * 1.25 - Math.max(0, Math.cos(ph)) * 0.25 * run - 0.06; // the trailing leg folds, the passing one lifts
      kr = -Math.max(0, s) * 1.25 - Math.max(0, -Math.cos(ph)) * 0.25 * run - 0.06;
      if (P.landT < 0.28) { const q = 1 - P.landT / 0.28, k = q * q * (3 - 2 * q); hl += 0.62 * k; hr += 0.56 * k; kl -= 1.05 * k; kr -= 0.98 * k; squash = 0.13 * k; ease = Math.min(1, dt * 30); }
      ftL = -(hl + kl); ftR = -(hr + kr); // feet flat on the deck
    } else if (P.lockT > 0) { hl = hr = -0.06; kl = kr = 0; ftL = ftR = -0.85; spread = 0.02; ease = Math.min(1, dt * 24); } // stomp
    else if (this.jumpT < (this.jumpStage ? 0.14 : 0.09)) { // push-off / air kick: legs snap straight, toes pointed
      hl = hr = this.jumpStage ? -0.2 : -0.04; kl = kr = 0; ftL = ftR = -0.7; spread = this.jumpStage ? 0.1 : 0.05; ease = Math.min(1, dt * 30);
    } else if (P.vy > 0) {
      const k = TUCK[Math.min(3, P.jumps)], open = clamp01(1 - P.vy / 5) * 0.45; // eases open toward the apex
      hl = 0.58 * k * (1 - open); hr = 0.44 * k * (1 - open); kl = -1.3 * k * (1 - open * 0.8); kr = -1.08 * k * (1 - open * 0.8);
      ftL = ftR = -0.4 + open * 0.3; spread = 0.08 + open * 0.04; ease = Math.min(1, dt * 12);
    } else if (below && y - (below.h + below.oy) < 1.6) { // reach for the deck: legs out, toes up, ready to take it
      const r = clamp01(1 - (y - (below.h + below.oy)) / 1.6);
      hl = 0.16 + r * 0.1; hr = 0.08 + r * 0.1; kl = -0.22 - r * 0.15; kr = -0.15 - r * 0.15; ftL = ftR = 0.04 + r * 0.1; spread = 0.07; ease = Math.min(1, dt * 20);
    } else {
      const sw = Math.sin(t * 3.2 + fall * t * 6) * (0.07 + fall * 0.05), trail = Math.max(-0.3, Math.min(0.3, -fwd * 0.03));
      hl = 0.22 + sw + trail; hr = 0.1 - sw + trail; kl = -0.38 - sw; kr = -0.22 + sw; ftL = ftR = -0.45 + fall * 0.2; spread = 0.08 + fall * 0.14; ease = Math.min(1, dt * 10);
    }
    poseLeg(B.hipL, B.kneeL, B.footL, hl, kl, ftL, -spread, ease);
    poseLeg(B.hipR, B.kneeR, B.footR, hr, kr, ftR, spread, ease);
    lg.scale.y += (1 - squash - lg.scale.y) * Math.min(1, dt * 22);
    lg.visible = !P.dead;
    // heel jets: layered flames that flare on the air jump, flicker and shrink away, with a short trail
    // of sparks left behind in the world
    const j = this.jetT, on = j > 0.02 && !P.dead;
    this.jetPose(B.jetL, on, j); this.jetPose(B.jetR, on, j);
    if (on) {
      this.puffT -= dt;
      if (this.puffT <= 0) {
        this.puffT = 0.022;
        lg.updateMatrixWorld(true);
        this.jetPuff(B.jetL, j); this.jetPuff(B.jetR, j);
      }
    }
  }
  jetPose(jet, on, j) {
    if (!on) { jet.scale.setScalar(0); return; }
    const fl = 0.85 + Math.random() * 0.3;
    jet.scale.set((0.75 + j * 0.45) * fl, (0.3 + j * 1.25) * (0.8 + Math.random() * 0.4), (0.75 + j * 0.45) * fl);
  }
  jetPuff(jet, j) {
    _v.set(0, -0.12, 0).applyMatrix4(jet.matrixWorld);
    this.R.fx.pfx.jetPuff(_v.x, _v.y, _v.z, this.jetMat.color, j);
  }

  // ------------------------------------------------------------------ the arm cannon
  // Bob, sway, per-weapon recoil (the slide kicks back), the petals (close on a swap, re-open in the
  // new colour, kick on each shot), the gyro ring and coil, the barrel spin and rocket loader, the
  // heat vents, the core light, the ammo screen; drops away when you look at your feet.
  updateCannon(w, P, yaw, pitch, bob, dt, t) {
    const R = this.R, c = this.cannon, U = c.userData, B = this.cb, MZ = U.mz, motion = R.motion;
    if (P.weapon !== this.held) { this.held = P.weapon; this.swapT = 1; }
    this.swapT = Math.max(0, this.swapT - dt * 3.2);
    const show = this.swapT > 0.5 ? this.shown || this.held : this.held; // the new weapon appears as the petals reopen
    this.shown = show;
    this.recoil = Math.max(0, this.recoil - dt * (this.kick > 1.5 ? 5 : 9));
    this.flashT = Math.max(0, this.flashT - dt);
    this.heat = Math.max(0, this.heat - dt * 0.55);
    this.spinV *= Math.exp(-dt * 2.5);
    this.fireSpin = Math.max(0, this.fireSpin - dt * 1.5);
    // sway: the gun lags your look and leans with strafing
    let dyw = yaw - this.lastYaw; dyw -= Math.round(dyw / (Math.PI * 2)) * Math.PI * 2;
    const dpt = pitch - this.lastPitch; this.lastYaw = yaw; this.lastPitch = pitch;
    const side = P.vx * Math.cos(yaw) - P.vz * Math.sin(yaw), idt = 1 / Math.max(dt, 1 / 240);
    const tx = Math.max(-0.05, Math.min(0.05, -dyw * idt * 0.006 - side * 0.0035)), ty = Math.max(-0.04, Math.min(0.04, -dpt * idt * 0.006));
    this.swayX += (tx * motion - this.swayX) * Math.min(1, dt * 10); this.swayY += (ty * motion - this.swayY) * Math.min(1, dt * 10);
    const low = pitch < -0.45 ? (-0.45 - pitch) * 0.35 : 0;
    const port = R.aspect < 1, rk = this.recoil * this.kick, sdip = Math.sin(this.swapT * Math.PI);
    const shake = this.held === 'rapid' ? (Math.random() - 0.5) * this.recoil * 0.08 * motion : 0;
    const idle = Math.sin(t * 1.3) * 0.004 * motion; // a slow breathing drift
    const Q = this.pose;
    c.position.set((port ? Q.xp : Q.x) + this.swayX, Q.y + bob * 0.5 - low + (P.ground ? 0 : 0.02) + this.swayY - sdip * 0.06 + idle, Q.z + Math.min(0.1, rk * 0.06) * (0.4 + 0.6 * motion));
    c.scale.setScalar(Q.s);
    c.rotation.set(Q.pitch + Math.min(0.22, rk * 0.15) * (0.4 + 0.6 * motion) + low * 0.6 - sdip * 0.25, Q.yaw - this.swayX * 2, Q.roll + this.swayX * 3 + shake + sdip * 0.5);
    c.visible = R.showCannon && !P.dead;
    // petals: closed at the middle of a swap, open to the weapon's spread, kicked by each shot
    const f = this.swapT > 0.5 ? (this.swapT - 0.5) * 2 : 1 - this.swapT * 2;
    const open = (CANNON_OPEN[show] ?? 0.1) * f + rk * 0.07;
    for (let k = 0; k < 4; k++) { const pg = U.petals[k]; pg.rotation.x += (open + (show === 'rapid' ? Math.sin(this.spinV * 0.2 + k) * 0.01 * this.spinV / 30 : 0) - pg.rotation.x) * Math.min(1, dt * 24); }
    // the business end: the shown weapon's, shrinking away as the petals close and growing back as they open
    for (const k in MZ) MZ[k].bone.scale.setScalar(k === show ? Math.max(0.001, f) : 0);
    // the recoil slide, the gyro ring and wrist collar, the coil (spins up and pulses on a shot)
    B.slide.position.z = Math.min(0.08, rk * 0.045);
    this.ringA += dt * (0.5 + this.fireSpin * 7 + sdip * 14);
    B.ringA.rotation.z = this.ringA; B.collar.rotation.z = -this.ringA * 0.35;
    B.coil.rotation.z += dt * (1.2 + this.fireSpin * 9 + this.spinV * 0.15);
    const pulse = 1 + Math.min(1, this.flashT * 14) * 0.16 + Math.sin(t * 5) * 0.015;
    B.coil.scale.set(pulse, pulse, 1);
    B.spin.rotation.z += this.spinV * dt;
    // rocket loader: the warhead leaves with the shot, the next one slides in from behind
    this.loadT += dt;
    const L = this.loadT;
    B.warhead.scale.setScalar(L < 0.14 ? 0 : 1);
    B.warhead.position.z = -0.1 + (L < 0.14 ? 0 : 0.16 * Math.max(0, 1 - (L - 0.14) / 0.36) ** 2);
    // colours: the core and strips in the weapon's colour (flaring white on a shot, dimmed while the
    // iris is shut mid-swap), the vents dark → orange → white with heat
    const wcol = WEAPON_COL[show] || 0xffffff;
    this.M.vmGlow.color.set(wcol).lerp(_dim, (1 - f) * 0.65).lerp(_white, Math.min(1, this.flashT * 10) * 0.7);
    this.M.vmHeat.color.set(0x2a2e36).lerp(_c.set(0xff5a14), Math.min(1, this.heat * 1.2)).lerp(_white, Math.max(0, this.heat - 0.9) * 0.6);
    this.coreLight.color.set(wcol);
    this.coreLight.intensity = (0.35 + 0.25 * f + Math.min(1, this.flashT * 16) * 2.6 * R.flashK) * (c.visible ? 1 : 0);
    // the aura: a soft glow in the mouth of the iris, breathing, flaring on a shot (it faces the eye)
    const au = U.aura, ak = (0.55 + 0.45 * f) * (1 + Math.min(1, this.flashT * 14) * 0.8) * (0.92 + Math.sin(t * 6) * 0.08);
    au.visible = c.visible && f > 0.05;
    au.quaternion.copy(c.quaternion).invert();
    au.scale.setScalar(ak);
    au.material.color.set(wcol).multiplyScalar(0.55 * (R.flashK < 1 ? 0.8 : 1));
    this.updateWisps(dt);
    this.drawScreen(P, show, wcol);
    // the muzzle flash: a star facing back down the barrel and a plume along it, per weapon
    const fl = U.flash, tip = MZ[show]?.tip ?? -0.5;
    fl.visible = this.flashT > 0 && c.visible;
    if (fl.visible) {
      const s = (FLASH[this.held] ?? 1) * (R.flashK < 1 ? 0.55 : 1) * (0.85 + Math.random() * 0.3);
      fl.position.set(0, 0, tip - 0.04);
      fl.rotation.set(0, 0, this.flashRot + Math.random() * 0.4);
      fl.scale.set(s * (this.held === 'spread' ? 1.4 : 1), s, s * (this.held === 'rocket' ? 1.6 : 1));
      this.M.vmFlash.color.set(wcol).lerp(_white, 0.35);
    }
    // where the muzzle is on screen, for the shots to leave from (fx-player.js)
    c.updateMatrixWorld();
    _v.set(0, 0, tip).applyMatrix4(c.matrixWorld).project(this.cam);
    R.fx.pfx.setMuzzle(_v.x, _v.y, c.visible);
    R.fx.pfx.flashK = R.flashK;
  }

  // Vapour off the vents once the cannon runs hot: spawned faster the hotter it is, rising and drifting
  // back, warm-tinted when white-hot.
  updateWisps(dt) {
    const c = this.cannon, hot = this.heat;
    if (hot > 0.35 && c.visible) {
      this.wispAcc += dt * (hot - 0.25) * 24;
      while (this.wispAcc >= 1) {
        this.wispAcc -= 1;
        const w = this.wispData[this.iWisp]; this.iWisp = (this.iWisp + 1) % N_WISP;
        const top = Math.random() < 0.7;
        w.life = 0; w.max = 0.45 + Math.random() * 0.35; w.s = 0.05 + Math.random() * 0.04;
        w.x = top ? (Math.random() - 0.5) * 0.07 : -0.1; w.y = top ? 0.15 : 0.11; w.z = -0.09 + Math.random() * 0.12;
        w.vx = (top ? 0 : -0.12) + (Math.random() - 0.5) * 0.08; w.vy = 0.22 + Math.random() * 0.18; w.vz = 0.12 + Math.random() * 0.1;
      }
    } else this.wispAcc = 0;
    let n = 0;
    _q.copy(c.quaternion).invert(); // face the eye (the cannon's pass has its camera at the origin, unturned)
    _c2.setRGB(1, 0.75, 0.55).lerp(_white, clamp01(1.4 - hot));
    for (let i = 0; i < N_WISP; i++) {
      const w = this.wispData[i];
      if (w.life >= w.max) continue;
      w.life += dt;
      const f = w.life / w.max;
      if (f >= 1) continue;
      w.x += w.vx * dt; w.y += w.vy * dt; w.z += w.vz * dt;
      _m.compose(_v.set(w.x, w.y, w.z), _q, _s.setScalar(w.s * (0.6 + f * 1.8)));
      this.wisps.setMatrixAt(n, _m); this.wisps.setColorAt(n, _c2);
      this.wispA.array[n] = 0.4 * (1 - f) * Math.min(1, f * 6);
      n++;
    }
    this.wisps.count = n; this.wisps.visible = n > 0;
    if (n) { this.wisps.instanceMatrix.needsUpdate = true; this.wisps.instanceColor.needsUpdate = true; this.wispA.needsUpdate = true; }
  }

  // The ammo screen (a 40 × 20 LCD in a 3 × 5 pixel font): the weapon's name on a bar in its colour,
  // the rounds left, a gauge of the magazine, a heat bar along the bottom. Redrawn only on a change.
  drawScreen(P, show, wcol) {
    const U = this.cannon.userData, scr = U.screen;
    const n = P.ammo[show] ?? 0, inf = show === 'blaster', hot = Math.min(10, Math.round(this.heat * 6));
    if (scr.show === show && scr.n === n && scr.hot === hot) return;
    scr.show = show; scr.n = n; scr.hot = hot;
    const x = scr.cv.getContext('2d'), col = '#' + _c.set(wcol).getHexString(), bg = '#04060b';
    x.fillStyle = bg; x.fillRect(0, 0, 40, 20);
    x.fillStyle = col; x.fillRect(0, 0, 40, 7);
    x.fillStyle = bg; pixText(x, LABEL[show] || '', 2, 1, 1);
    x.fillStyle = col;
    if (inf) pixText(x, '~', 3, 10, 2);
    else pixText(x, String(Math.min(999, n)).padStart(3, '0'), 2, 8, 2);
    const lit = inf ? 5 : Math.ceil(Math.min(1, n / (AMMO_MAX[show] || 1)) * 5);
    for (let k = 0; k < 5; k++) { x.fillStyle = 4 - k < lit ? col : '#1a2230'; x.fillRect(30, 8 + k * 2, 8, 1); }
    x.fillStyle = hot > 7 ? '#ffe0c0' : '#ff6a1a'; x.fillRect(0, 19, hot * 4, 1);
    scr.tex.needsUpdate = true;
  }
}

// Ease a leg toward a pose: hip swing and splay, knee bend, ankle; the sole stays level-ish when splayed.
function poseLeg(hip, knee, foot, h, k, f, splay, ease) {
  hip.rotation.x += (h - hip.rotation.x) * ease;
  hip.rotation.z += (splay - hip.rotation.z) * ease;
  knee.rotation.x += (k - knee.rotation.x) * ease;
  foot.rotation.x += (f - foot.rotation.x) * ease;
  foot.rotation.z = -hip.rotation.z * 0.6;
}

// 3 × 5 pixel glyphs (rows top to bottom), and '~' for ∞ (7 × 3).
const GLYPH = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
  B: '110101110101110', L: '100100100100111', S: '111100111001111', T: '111010010010010', R: '110101110101101',
  P: '110101110100100', D: '110101101101110', U: '101101101101111', E: '111100110100111', C: '111100100100111', K: '101101110101101',
};
function pixText(x, str, px, py, s) {
  for (const ch of str) {
    if (ch === '~') { for (const [i, j] of [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [3, 1], [6, 1], [1, 2], [2, 2], [4, 2], [5, 2]]) x.fillRect(px + i * s, py + j * s, s, s); px += 8 * s; continue; }
    const g = GLYPH[ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') x.fillRect(px + (i % 3) * s, py + Math.floor(i / 3) * s, s, s);
    px += 4 * s;
  }
}
