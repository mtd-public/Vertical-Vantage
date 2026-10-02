// The renderer: reads the world every frame, owns no game state (docs: sim / render / UI split).
//   resize(w, h) · setWorld(world) · update(world, alpha, dt, t, look) · render() · onEvents(events)
// Two passes: the world, then the arm cannon on top (its own scene and camera, depth cleared).
import * as THREE from 'three';
import { RETRO, RETRO_LINES } from './retro.js';
import { Glow } from './post.js';
import { Sky } from './sky.js';
import { THEMES } from './themes.js';
import { FX } from './fx.js';
import { buildLevelView } from './level-view.js';
import * as MD from './models.js';
import { facadeTextures, signAtlas, containerTex, concreteTex, hazardTex, deckTex, waterTex, helipadTex, serverTex, driveLabelTex, glowTex, canvasTex } from './textures.js';
import { adAtlas } from './ads.js';
import { T } from '../sim/tuning.js';
import { viewPitch } from '../sim/player.js';
import { groundBelow } from '../sim/plats.js';
import { predictLanding } from '../sim/predict.js';
import { cloudSeaTex } from './textures.js';
import { BOSS_VIEWS } from './bosses.js';
import { buildBackdrop } from './backdrops.js';
import { box, Kit } from './geo.js';
import { makeEnemyModel, poseEnemy } from './enemy-view.js';
import { PlayerView } from './player-view.js';

const DEG = Math.PI / 180;
const _v = new THREE.Vector3(), _c = new THREE.Color();
const _up = new THREE.Vector3(), _fw = new THREE.Vector3(), _bk = new THREE.Vector3(), _rt = new THREE.Vector3(), _ft = new THREE.Vector3(), _kn = new THREE.Vector3(), _d = new THREE.Vector3();
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0);
// Stretch a unit box between a and b (in the parent's frame), thickness th.
// A unit segment stretched a → b with a stable roll: local y along the segment, local x across the
// leg's plane (so a knee hub's axle lines up), local z on the outer side of the bend (rams sit there).
const _sx = new THREE.Vector3(), _sz = new THREE.Vector3(), _sm = new THREE.Matrix4(), _Z = new THREE.Vector3(0, 0, 1);
function limb(mesh, a, b, tx, tz) {
  _d.subVectors(b, a);
  const len = _d.length() || 1e-3;
  mesh.position.copy(a).addScaledVector(_d, 0.5);
  _d.multiplyScalar(1 / len);
  _sx.crossVectors(_d, _Y);
  if (_sx.lengthSq() < 1e-6) _sx.crossVectors(_d, _Z);
  _sx.normalize();
  _sz.crossVectors(_sx, _d);
  _sm.makeBasis(_sx, _d, _sz);
  mesh.quaternion.setFromRotationMatrix(_sm);
  mesh.scale.set(tx, len, tz);
}

export class GameRenderer {
  constructor(canvas) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !RETRO, powerPreference: 'high-performance' }));
    r.setPixelRatio(RETRO ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.autoClear = false;
    if (RETRO) canvas.classList.add('retro');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.2, 900); // near 0.2: depth precision far away (less z-fight flicker), still clear of walls at the 0.45 m body radius
    this.camera.rotation.order = 'YXZ';
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    this.sun = new THREE.DirectionalLight(0xffffff, 2);
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.sky = new Sky(this.scene);
    this.M = makeMaterials();
    this.fx = new FX(this.scene);
    // you: the legs (in the world) and the arm cannon's own pass, its scene, camera and lights (player-view.js)
    this.pv = new PlayerView(this);
    this.legs = this.pv.legs; this.cannon = this.pv.cannon; this.vmScene = this.pv.scene; this.vmCam = this.pv.cam;
    this.jumpKick = 0; this.rollK = 0; this.baseFov = 75; // jump / fall feedback
    this.showCannon = true;
    this._land = {}; this._path = []; this.landing = null; this.voidAhead = false; this.dropH = 0; // the landing look-ahead (HUD reads these)
    this.hfov = 96; this.motion = 1; this.flashK = 1; this.beamsK = 1; this.size = [1, 1]; // Options: FOV, reduced motion / flash, quality
    this.glow = new Glow(r); this.glowLevels = 2; // neon glow on night themes (post.js); Low quality turns it off
    this.level = null;
    this.aspect = 1;
    this.lastHp = T.HP_MAX;
  }

  resize(wpx, hpx) {
    if (!wpx || !hpx) return;
    this.size = [wpx, hpx];
    if (RETRO) { // ~240 lines on the shorter side; CSS stretches the canvas with hard pixels (dr-mow)
      const k = Math.min(wpx, hpx) / RETRO_LINES;
      this.renderer.setSize(Math.round(wpx / k), Math.round(hpx / k), false);
    } else this.renderer.setSize(wpx, hpx, false);
    const aspect = (this.aspect = wpx / hpx);
    // a wide, Jumping-Flash-ish view: 96° across in landscape by default (Options: 80–110°); portrait
    // keeps a sane vertical FOV
    const vf = 2 * Math.atan(Math.tan((this.hfov * DEG) / 2) / aspect);
    this.camera.fov = this.baseFov = Math.min(this.hfov - 8, Math.max(58, vf / DEG));
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.vmCam.aspect = aspect;
    this.vmCam.fov = aspect < 1 ? 70 : 55;
    this.vmCam.updateProjectionMatrix();
  }

  // Options. fov: horizontal degrees. calm: no shake, bob, landing dip or gun sway. lowFlash: dimmer
  // muzzle flashes, power sunburst and beam flicker. quality: 'low' | 'med' | 'high'.
  setOptions({ fov = 96, calm = false, lowFlash = false, quality = 'high' } = {}) {
    if (fov !== this.hfov) { this.hfov = fov; this.resize(...this.size); }
    this.motion = calm ? 0 : 1;
    this.flashK = lowFlash ? 0.35 : 1;
    const Q = { low: [0.5, 0.35, 0, 1], med: [0.75, 0.65, 1, 1.5], high: [1, 1, 1, 2] }[quality] || [1, 1, 1, 2];
    this.fx.k = Q[0]; this.fx.rainK = Q[1]; this.beamsK = Q[2];
    this.glowLevels = { low: 0, med: 1 }[quality] ?? 2;
    this.setGlow();
    if (this.theme) this.sky.u.uBeams.value = this.theme.beams * this.beamsK;
    if (!RETRO) { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q[3])); this.resize(...this.size); }
  }

  // The neon glow's strength: the theme's bloom (default: how night it is), a little less with the
  // reduced-flash option, off on Low quality.
  setGlow() {
    const th = this.theme, k = th ? (th.bloom ?? th.night ?? 0) : 0;
    this.glow.set(this.glowLevels ? k * (0.7 + 0.3 * this.flashK) : 0, this.glowLevels);
  }

  // ------------------------------------------------------------------ stage setup
  setWorld(w) {
    if (this.level) { this.level.root.removeFromParent(); disposeTree(this.level.root); }
    const th = THEMES[w.level.theme] || THEMES.cityDay;
    this.theme = th;
    const root = new THREE.Group();
    this.scene.add(root);
    const L = { root, th, view: buildLevelView(w, th, this.M, root), enemies: new Map(), pickups: new Map(), drives: new Map(), lasers: new Map(), exit: null, portal: null, water: null };
    const M = this.M;
    this.level = L;
    for (const e of w.enemies) this.addEnemy(e);
    for (const o of w.pickups) { const g = MD.pickupModel(M, o.type); root.add(g); L.pickups.set(o, g); }
    for (const o of w.drives) { const g = MD.driveModel(M); root.add(g); L.drives.set(o, g); }
    if (w.exit) { L.exit = MD.exitModel(M); root.add(L.exit); }
    if (w.portal) { L.portal = MD.portalModel(M); root.add(L.portal); }
    for (const o of w.lasers) { const g = laserModel(o, M); root.add(g); L.lasers.set(o, g); }
    if (th.water) {
      const tex = waterTex(); tex.repeat.set(220, 220);
      L.water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshLambertMaterial({ map: tex, color: th.water }));
      L.water.rotation.x = -Math.PI / 2; L.water.position.y = w.level.water ?? 0;
      root.add(L.water);
    }
    if (th.cloudSea) { // a sea of cloud far below (the air fortress): fog melts its far edge into the sky
      const tex = cloudSeaTex(); tex.repeat.set(26, 26);
      L.clouds = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ map: tex, color: th.cloudSea }));
      L.clouds.rotation.x = -Math.PI / 2; L.clouds.position.y = w.level.cloudY ?? -40;
      root.add(L.clouds);
    }
    for (const o of w.level.backdrops || []) { const b = buildBackdrop(o, th, M); if (b) root.add(b); } // distant landmarks
    // theme
    this.sky.setTheme(th);
    this.sky.u.uBeams.value = th.beams * this.beamsK;
    this.scene.fog = new THREE.Fog(th.skyBot, th.fog[0], th.fog[1]);
    this.hemi.color.set(th.hemi[0]); this.hemi.groundColor.set(th.hemi[1]); this.hemi.intensity = th.hemi[2];
    this.sun.color.set(th.key[0]); this.sun.intensity = th.key[1];
    this.sun.position.set(...th.sunDir).multiplyScalar(100);
    M.facade.emissive.setScalar(th.windows * 1.1);
    M.glass.emissive.set(th.night ? 0x1a2c48 : 0x0a1420);
    M.glass.color.set(th.night ? 0x223040 : 0x6a88a8);
    M.neon.color.setScalar(Math.min(1, th.neon));
    this.setGlow();
    M.signs.color.setScalar(Math.min(1, 0.55 + th.neon * 0.45));
    M.ads.color.setScalar(th.night ? 1 : 0.9);
    this.fx.setRain(!!th.rain, this.scene);
    this.pv.setTheme(th);
    this.lastHp = w.player.hp;
  }

  // ------------------------------------------------------------------ per frame
  update(w, alpha, dt, t, look) {
    const L = this.level, P = w.player, cam = this.camera;
    if (!L) return;
    const x = P.px + (P.x - P.px) * alpha, y = P.py + (P.y - P.py) * alpha, z = P.pz + (P.z - P.pz) * alpha;
    const yaw = P.yaw + (look?.yaw || 0);
    let pitch = viewPitch(P) + (look?.pitch || 0);
    pitch = Math.max(T.PITCH_MIN, Math.min(T.PITCH_MAX, pitch));
    // head bob + landing dip
    const sp = Math.sqrt(P.vx * P.vx + P.vz * P.vz);
    const bob = P.ground ? Math.sin(P.stride * 2.4) * 0.05 * Math.min(1, sp / T.RUN) * this.motion : 0;
    const dip = P.landT < 0.22 ? -0.16 * Math.sin((P.landT / 0.22) * Math.PI) * this.motion : 0;
    const sh = this.fx.shake * this.motion;
    cam.position.set(x + (Math.random() - 0.5) * sh, y + T.EYE + bob + dip + (Math.random() - 0.5) * sh, z + (Math.random() - 0.5) * sh);
    // jump / fall feedback (scaled by the comfort option): a small FOV punch and dip on takeoff, a roll
    // wobble on the third jump, and the view widening as a fall picks up speed
    this.jumpKick = Math.max(0, this.jumpKick - dt * 3.5); this.rollK = Math.max(0, this.rollK - dt * 2.2);
    const fallK = P.ground || P.dead ? 0 : Math.max(0, Math.min(1, (-P.vy - 10) / 18));
    const fov = this.baseFov + (this.jumpKick * 5 + fallK * 7) * this.motion;
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.rotation.set(pitch - this.jumpKick * 0.035 * this.motion, yaw, Math.sin(t * 16) * this.rollK * 0.035 * this.motion);
    cam.updateMatrixWorld();
    this.fx.wind(fallK * (this.motion ? 1 : 0.5), t, cam);
    this.sky.powerTarget = (P.hyper > 0 || P.over > 0 ? 0.55 : w.phase === 'clear' || w.phase === 'bonusClear' ? 1 : 0) * this.flashK;
    this.sky.update(dt, t, cam);
    L.view.update(t);
    if (L.water) L.water.material.map.offset.set(t * 0.012, t * 0.02);

    // your legs, posed from the jump / fall state, and the heel jets (player-view.js)
    const below = P.ground ? null : groundBelow(w.plats, x, z, y - 0.01);
    this.pv.updateLegs(P, x, y, z, yaw, below, bob, sp, dt, t);

    // enemies (regular ones: enemy-view.js; bosses: their pack's view)
    if (L.enemies.size !== w.enemies.length) for (const e of w.enemies) if (!L.enemies.has(e)) this.addEnemy(e); // spawned mid-fight
    this.fx.enemy.begin(cam, this);
    for (const [e, g] of L.enemies) {
      if (e.type === 'boss') { this.updateBoss(e, g, dt, t, P); continue; }
      poseEnemy(this, e, g, dt, t, w);
    }
    // pickups, drives
    for (const [o, g] of L.pickups) {
      g.visible = !o.got;
      if (o.got) continue;
      g.position.set(o.x, o.y + Math.sin(t * 2.4 + o.id) * 0.15, o.z);
      g.getObjectByName('spin').rotation.y = t * 2.2 + o.id;
      g.getObjectByName('icon').quaternion.copy(cam.quaternion);
    }
    for (const [o, g] of L.drives) {
      g.visible = !o.got;
      if (o.got) continue;
      g.position.set(o.x, o.y + Math.sin(t * 2 + o.id) * 0.2, o.z);
      g.getObjectByName('spin').rotation.y = t * 1.8;
      g.getObjectByName('halo').quaternion.copy(cam.quaternion);
    }
    if (L.exit && w.exit) {
      const g = L.exit, open = w.exitOpen;
      g.position.set(w.exit.x, w.exit.y, w.exit.z); g.rotation.y = w.exit.yaw;
      const pulse = 0.75 + Math.sin(t * (open ? 3 : 6)) * 0.25;
      this.M.exitTube.color.set(open ? 0x2bffd8 : 0xff2a3a).multiplyScalar(pulse);
      this.M.exitBeam.color.set(open ? 0x2bffd8 : 0xff2a3a);
      this.M.exitBeam.opacity = open ? 0.38 : 0.2;
      const portal = g.getObjectByName('portal'); portal.visible = open;
      this.M.exitPortal.map.rotation = t * 0.8; this.M.exitPortal.map.center.set(0.5, 0.5);
      const lock = g.getObjectByName('lock'); lock.visible = !open;
    }
    if (L.portal && w.portal) {
      const g = L.portal, o = w.portal;
      g.visible = !o.used;
      g.position.set(o.x, o.y - 1.6 + 1.0, o.z);
      g.getObjectByName('ring').rotation.set(Math.PI / 2 + Math.sin(t) * 0.2, t * 1.5, 0);
      g.getObjectByName('ring2').rotation.set(Math.PI / 2, -t * 2.5, Math.cos(t) * 0.3);
      const disc = g.getObjectByName('disc'); disc.quaternion.copy(cam.quaternion);
      this.M.portalSwirl.map.rotation = -t * 2; this.M.portalSwirl.map.center.set(0.5, 0.5);
    }
    for (const [o, g] of L.lasers) {
      g.position.set(o.x, o.y, o.z);
      const beams = g.getObjectByName('beams'), sheet = g.getObjectByName('sheet');
      if (o.state === 'on') { beams.visible = sheet.visible = true; sheet.material.opacity = 0.18 + Math.sin(t * 50) * 0.04; }
      else if (o.state === 'warn') { const f = Math.sin(t * 45) > 0; beams.visible = f; sheet.visible = false; }
      else { beams.visible = sheet.visible = false; }
    }
    // where you are: a soft shadow straight under you (on the deck you stand on, or the one below)
    const fx = this.fx, under = P.ground || below;
    fx.shadow.visible = !!under && !P.dead;
    if (under) {
      const top = under.h + under.oy, hgt = Math.max(0, y - top);
      fx.shadow.position.set(x, top + 0.03, z);
      fx.shadow.scale.setScalar(0.85 + Math.min(0.9, hgt * 0.03));
      fx.shadow.material.opacity = 0.5 - Math.min(0.25, hgt * 0.01);
    }
    // where you'll land: the look-ahead's touchdown point, a ring closing on it as touchdown nears,
    // and dots along the way. Gold over a long drop, red when the path ends in the void.
    const air = !P.ground && !P.dead;
    const land = air ? predictLanding(w.plats, P, this._land, { killY: w.level.killY ?? -Infinity, path: this._path, maxT: 5 }) : null;
    this.landing = land; this.voidAhead = air && !land; this.dropH = land ? y - land.y : below ? y - (below.h + below.oy) : 0;
    const mk = fx.marker, cl = fx.close;
    const doomed = this.voidAhead && P.jumps >= T.JUMP_V.length; // out of air jumps, heading for the void
    const spot = land || (doomed && below ? { x, y: below.h + below.oy, z, t: 0 } : null);
    const col = this.voidAhead ? 0xff3a4a : this.dropH > 12 ? 0xffd23a : 0x7ff6ff;
    mk.visible = cl.visible = !!spot;
    if (spot) {
      mk.position.set(spot.x, spot.y + 0.05, spot.z);
      mk.scale.setScalar(0.85 + Math.min(0.6, Math.hypot(spot.x - x, spot.z - z, spot.y - y) * 0.015));
      mk.material.color.set(col); mk.rotation.z = t * (this.voidAhead ? 6 : 2);
      cl.position.set(spot.x, spot.y + 0.06, spot.z);
      cl.scale.setScalar(mk.scale.x * (0.8 + Math.min(2.4, (spot.t || 0) * 2.2)));
      cl.material.color.set(col); cl.material.opacity = this.voidAhead ? 0.5 + 0.4 * Math.sin(t * 20) : 0.85;
    }
    fx.setArc(land && this._path.length > 15 ? this._path : null, col);
    fx.zones(w.zones || [], t);
    if (L.clouds) L.clouds.material.map.offset.set(t * 0.004, t * 0.009);
    this.fx.update(dt, w, cam, t);

    // the arm cannon (player-view.js)
    this.pv.updateCannon(w, P, yaw, pitch, bob, dt, t);
  }

  // Bosses: each kind's view (render/bosses.js) poses its model; the laser beam and danger zones
  // are drawn here for all of them.
  updateBoss(e, g, dt, t, P) {
    const L = this.level;
    if (e.dead) { g.visible = false; if (L.beam) L.beam.visible = false; return; }
    g.visible = true;
    (BOSS_VIEWS[e.kind] || BOSS_VIEWS.arachne).update(this, e, g, dt, t, P);
    // the beam (sight line while charging, the real thing while firing)
    const B = e.beam, bm = L.beam;
    if (!B || !bm) return;
    bm.visible = B.on || (B.sight && (this.flashK < 1 || Math.sin(t * 35) > -0.3)); // (low flash: a steady sight line)
    if (bm.visible) {
      bm.position.set(B.ox, B.oy, B.oz);
      bm.lookAt(B.ox + B.dx, B.oy + B.dy, B.oz + B.dz);
      const th = B.on ? 0.42 + Math.sin(t * 50) * 0.06 * this.flashK : 0.05;
      bm.scale.set(th, th, B.len);
      this.M.beam.opacity = (B.on ? 0.9 : 0.55) * (this.flashK < 1 ? 0.7 : 1);
    }
  }

  // Build and register an enemy's model (at stage start, or when a boss spawns one).
  addEnemy(e) {
    const L = this.level, M = this.M;
    let g;
    if (e.type === 'boss') {
      g = (BOSS_VIEWS[e.kind] || BOSS_VIEWS.arachne).model(M, e);
      if (!L.beam) { // the laser beam lives in world space (unit box along +Z, lookAt'd and stretched)
        L.beam = new THREE.Mesh(box(1, 1, 1, { z: 0.5 }), M.beam);
        L.beam.visible = false; L.beam.frustumCulled = false;
        L.root.add(L.beam);
      }
    } else g = makeEnemyModel(this, e);
    L.root.add(g); L.enemies.set(e, g);
  }

  // ARACHNE-9's electrics: a few jagged arcs between the coil, the capacitors, the hip insulators and
  // the antennae, re-rolled ~18 times a second; a storm of them while it telegraphs or dies.
  sparkArcs(g, e, dt) {
    const arcs = g.getObjectByName('arcs');
    if (!arcs) return;
    const U = arcs.userData;
    U.t -= dt;
    if (U.t > 0) return;
    U.t = 0.055;
    const A = MD.ARC_ANCHORS, pos = arcs.geometry.attributes.position.array, S = U.segs;
    const angry = e.state === 'charge' || e.state === 'crouch' || e.state === 'dropTele' || e.state === 'dying' || e.flash > 0;
    const n = Math.min(U.max, (angry ? 6 : 2) + (Math.random() < 0.5 ? 1 : 0));
    const pickOf = (l) => l[Math.floor(Math.random() * l.length)];
    let o = 0;
    for (let k = 0; k < n; k++) {
      const r = Math.random();
      const a = r < 0.45 ? A.coil : r < 0.75 ? pickOf(A.caps) : pickOf(A.hips);
      const b = r < 0.45 ? pickOf(A.caps) : r < 0.75 ? pickOf(A.hips) : r < 0.9 ? pickOf(A.antennae) : A.coil;
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], j = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.14;
      let px = a[0], py = a[1], pz = a[2];
      for (let s = 1; s <= S; s++) {
        const f = s / S, end = s === S;
        const qx = a[0] + dx * f + (end ? 0 : (Math.random() - 0.5) * j * 2), qy = a[1] + dy * f + (end ? 0 : (Math.random() - 0.3) * j * 2), qz = a[2] + dz * f + (end ? 0 : (Math.random() - 0.5) * j * 2);
        pos[o++] = px; pos[o++] = py; pos[o++] = pz; pos[o++] = qx; pos[o++] = qy; pos[o++] = qz;
        px = qx; py = qy; pz = qz;
      }
    }
    arcs.geometry.setDrawRange(0, n * S * 2);
    arcs.geometry.attributes.position.needsUpdate = true;
    arcs.material.opacity = 0.95 * this.flashK + (1 - this.flashK) * 0.4;
  }

  // Swap a model to the white hit-flash material and back (boss views use this too).
  flashModel(g, on) { if (on !== !!g.userData.flashing) setFlash(g, on, this.M.flash); }

  // ARACHNE-9: stand it on its surface (up = the surface normal), pose eight legs, aim the turret.
  // Orientation is smoothed so wall / ceiling transitions swing rather than snap.
  updateArachne(e, g, dt, t, P) {
    const up = _up.set(e.nx, e.ny, e.nz);
    let fw = _fw.set(e.fx, 0, e.fz);
    if (Math.abs(up.y) < 0.5) fw.set(0, 1, 0); // on a wall it faces up the wall
    fw.addScaledVector(up, -fw.dot(up)).normalize();
    const back = _bk.copy(fw).negate(), right = _rt.crossVectors(up, back).normalize();
    _m4.makeBasis(right, up, back);
    _q.setFromRotationMatrix(_m4);
    g.quaternion.slerp(_q, Math.min(1, dt * 9));
    const crouch = e.crouch * 0.55;
    g.position.set(e.cx - up.x * crouch, e.cy - up.y * crouch, e.cz - up.z * crouch);
    if (e.state === 'dying') g.position.x += Math.sin(t * 60) * 0.12;
    const flash = e.flash > 0 || e.state === 'dying' && Math.sin(t * 30) > 0;
    if (flash !== !!g.userData.flashing) setFlash(g, flash, this.M.flash);
    // eyes flare on every telegraph
    const tele = e.state === 'crouch' || e.state === 'charge' || e.state === 'dropTele';
    g.getObjectByName('eye').scale.setScalar(tele ? 1.3 + Math.sin(t * 40) * 0.25 : 1);
    this.sparkArcs(g, e, dt);
    // turret tracks you (barrels along +Z: lookAt aims them)
    const tur = g.getObjectByName('turret');
    tur.lookAt(P.x, P.y + 1, P.z);
    // legs: tetrapod gait in the body frame; feet lift in two alternating groups of four
    const ph = e.gait * 1.6, bodyH = 1.8 - crouch;
    for (const l of g.userData.legs) {
      const grp = (l.i + (l.side > 0 ? 1 : 0)) % 2, s = Math.sin(ph + grp * Math.PI);
      const lift = e.state === 'leap' || e.state === 'drop' ? 0.9 : Math.max(0, s) * 0.75;
      const swing = Math.cos(ph + grp * Math.PI) * 0.45;
      const foot = _ft.set(l.rest.x, -bodyH + lift, l.rest.z + swing);
      if (e.state === 'leap' || e.state === 'drop') foot.set(l.rest.x * 0.8, -bodyH * 0.5, l.rest.z * 1.2); // legs splay mid-air
      const knee = _kn.copy(l.hip).add(foot).multiplyScalar(0.5);
      knee.y += 1.5; knee.x += l.side * 0.4;
      limb(l.thigh, l.hip, knee, 0.36, 0.42); // (children of g: body frame)
      l.knee.position.copy(knee); l.knee.quaternion.copy(l.thigh.quaternion);
      limb(l.shin, knee, foot, 0.26, 0.3);
    }
  }

  onEvents(events, w) {
    const fx = this.fx;
    for (const e of events) {
      switch (e.type) {
        case 'fire': this.pv.fire(e); fx.pfx.fire(e); break;
        case 'impact': if (fx.pfx.impact(e)) break; fx.burst(e.x, e.y, e.z, e.kind === 'bolt' ? 5 : 6, e.kind === 'bolt' ? 0xff3a8a : 0xbff8ff, 5, 0.09, 0.35, 10); break;
        case 'hit': if (e.kind === 'boss') fx.burst(e.x, e.y, e.z, 8, 0xffb040, 6, 0.1, 0.4); else fx.enemy.hit(e, w); break;
        case 'kill': if (e.kind === 'boss') { fx.boom(e.x, e.y, e.z, 7); fx.burst(e.x, e.y, e.z, 16, 0xe0313a, 8, 0.22, 1.2, 14); } else fx.enemy.kill(e, w, this.level); break;
        case 'serverDown': fx.boom(e.x, e.y, e.z, 3, 0x7bff4a); fx.burst(e.x, e.y, e.z, 24, 0x2bff7a, 10, 0.16, 1, 12); break;
        case 'explode': fx.boom(e.x, e.y, e.z, e.r); fx.enemy.blast(e.x, e.y, e.z, e.r); break;
        case 'stomp': fx.burst(e.x, e.y, e.z, 12, 0xffffff, 7, 0.14, 0.5); fx.shake = Math.max(fx.shake, 0.18); break;
        case 'jump':
          this.jumpKick = [0.45, 0.7, 1][e.stage] || 0.5; this.pv.jump(e);
          if (e.stage > 0) { this.rollK = e.stage === 2 ? 1 : 0; fx.pfx.jumpRing(e.x, e.y, e.z, e.stage); }
          if (e.stage > 0) fx.burst(e.x, e.y, e.z, 10 + e.stage * 4, e.stage === 2 ? 0xffd23a : 0x7ff6ff, 5 + e.stage * 2, 0.12, 0.45, 2); break;
        case 'land': if (e.impact > 11) fx.shockwave(e.x, e.y + 0.06, e.z, 0.5 + Math.min(0.9, e.impact * 0.035), 0.4 * this.flashK);
          fx.burst(e.x, e.y + 0.1, e.z, Math.min(16, 4 + e.impact * 0.6), 0xd8dce8, 3 + e.impact * 0.15, 0.14, 0.4, 4); fx.shake = Math.max(fx.shake, Math.min(0.2, e.impact * 0.008)); break;
        case 'hurt': fx.shake = Math.max(fx.shake, 0.35); break;
        case 'pickup': fx.burst(e.x, e.y, e.z, 16, MD.PICKUP_COL[e.kind] || 0xffffff, 6, 0.12, 0.6, 4); break;
        case 'drive': fx.burst(e.x, e.y, e.z, 30, 0xffd23a, 9, 0.16, 0.9, 6); fx.shake = Math.max(fx.shake, 0.1); break;
        case 'exitOpen': if (w?.exit) fx.burst(w.exit.x, w.exit.y + 4, w.exit.z, 40, 0x2bffd8, 14, 0.25, 1.4, 4); break;
        case 'zap': fx.burst(e.x, e.y, e.z, 10, 0xff2a3a, 7, 0.1, 0.4); break;
        case 'portal': fx.burst(e.x, e.y, e.z, 30, 0xff2bd6, 10, 0.18, 0.8, 0); break;
        case 'enemyFire': fx.burst(e.x, e.y, e.z, 3, 0xff3a8a, 2, 0.12, 0.2, 0); if (e.from === 'drone') fx.enemy.muzzle(e.x, e.y, e.z); break;
        case 'bossSlam': fx.shockwave(e.x, e.y + 0.05, e.z, e.r); fx.burst(e.x, e.y + 0.3, e.z, 26, 0xc8c4bc, 9, 0.3, 0.9, 10); fx.shake = Math.max(fx.shake, 0.6); break;
        case 'bossLeap': fx.burst(e.x, e.y - 1.6, e.z, 18, 0xc8c4bc, 6, 0.25, 0.6, 8); fx.shake = Math.max(fx.shake, 0.25); break;
        case 'bossDying': fx.shake = Math.max(fx.shake, 0.5); break;
        case 'zoneHit': fx.shockwave(e.x, e.y + 0.08, e.z, e.r * 1.1, 0.7 * this.flashK); fx.burst(e.x, e.y + 0.3, e.z, 14, e.kind === 'bolt' ? 0x9fd8ff : 0xffb070, 8, 0.2, 0.7, 10); fx.shake = Math.max(fx.shake, 0.3); break;
        case 'bossPhase': case 'bossRoar': fx.shake = Math.max(fx.shake, 0.3); break;
        case 'spiked': fx.burst(e.x, e.y, e.z, 10, 0xff2a3a, 6, 0.12, 0.4); fx.shake = Math.max(fx.shake, 0.25); break;
        case 'respawnPickup': fx.burst(e.x, e.y, e.z, 12, MD.PICKUP_COL[e.kind] || 0xffffff, 3, 0.1, 0.5, -2); break;
        default: break;
      }
    }
  }

  // Title-screen attract mode: a slow orbit round the stage (doc 02: the first frame is the game).
  attractCam(w, t) {
    const cam = this.camera;
    if (!this._ac || this._ac.w !== w) {
      let x = 0, y = 0, z = 0, n = 0;
      for (const o of [...w.drives, w.exit, w.level.start].filter(Boolean)) { x += o.x; y += o.y; z += o.z; n++; }
      this._ac = { w, x: x / n, y: y / n, z: z / n };
    }
    const A = this._ac, a = t * 0.05;
    cam.position.set(A.x + Math.sin(a) * 75, A.y + 32 + Math.sin(t * 0.13) * 6, A.z + Math.cos(a) * 75);
    cam.lookAt(A.x, A.y + 4, A.z);
    cam.updateMatrixWorld();
    this.sky.update(0, t, cam);
    this.legs.visible = false; this.cannon.visible = false; this.fx.marker.visible = this.fx.close.visible = this.fx.shadow.visible = false; this.fx.setArc(null);
  }

  // world → screen (CSS px) for floating text and target markers; null if behind
  project(x, y, z, wpx, hpx) {
    _v.set(x, y, z).project(this.camera);
    if (_v.z > 1) return null;
    return { x: (_v.x * 0.5 + 0.5) * wpx, y: (-_v.y * 0.5 + 0.5) * hpx, behind: false, ndcX: _v.x, ndcY: _v.y };
  }
  // direction to a point in camera space (for off-screen arrows)
  toCam(x, y, z) { _v.set(x, y, z).applyMatrix4(this.camera.matrixWorldInverse); return _v; }

  render() {
    const r = this.renderer;
    r.info.autoReset = false; r.info.reset(); // count both passes (smoke test reads draw calls)
    r.clear();
    r.render(this.scene, this.camera);
    this.glow.apply(); // neon glow (night themes): after the world, before the arm cannon
    r.clearDepth();
    r.render(this.vmScene, this.vmCam);
  }
}

// ------------------------------------------------------------------ materials
export const ON_TOP = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };
function makeMaterials() {
  const fac = facadeTextures(4);
  const swirl = canvasTex(64, 64, (g) => {
    for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? 'rgba(43,255,216,0.9)' : 'rgba(43,120,255,0.6)'; g.beginPath(); g.moveTo(32, 32); g.arc(32, 32, 32, (k / 6) * Math.PI * 2, ((k + 0.6) / 6) * Math.PI * 2); g.fill(); }
  }, false);
  const swirlPink = canvasTex(64, 64, (g) => {
    for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? 'rgba(255,43,214,0.95)' : 'rgba(43,232,255,0.7)'; g.beginPath(); g.moveTo(32, 32); g.arc(32, 32, 32, (k / 8) * Math.PI * 2, ((k + 0.5) / 8) * Math.PI * 2); g.fill(); }
  }, false);
  const icons = canvasTex(512, 32, MD.iconAtlasPaint, false);
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false };
  return {
    paint: new THREE.MeshLambertMaterial({ vertexColors: true }),
    paintFlat: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
    // lights, trims and lit panels often sit flush on a surface: a nudge toward the camera makes them win
    // that depth tie every frame instead of flickering against it (z-fighting) as you move
    glow: new THREE.MeshBasicMaterial({ vertexColors: true, ...ON_TOP }),
    neon: new THREE.MeshBasicMaterial({ vertexColors: true, ...ON_TOP }),
    glass: new THREE.MeshLambertMaterial({ color: 0x6a88a8, emissive: 0x0a1420 }),
    facade: new THREE.MeshLambertMaterial({ map: fac.map, emissiveMap: fac.emissive, emissive: 0x000000, vertexColors: true }),
    concrete: new THREE.MeshLambertMaterial({ map: concreteTex(), vertexColors: true }),
    container: new THREE.MeshLambertMaterial({ map: containerTex(), vertexColors: true }),
    deck: new THREE.MeshLambertMaterial({ map: deckTex(), vertexColors: true }),
    hazard: new THREE.MeshLambertMaterial({ map: hazardTex() }),
    helipad: new THREE.MeshLambertMaterial({ map: helipadTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    ads: new THREE.MeshBasicMaterial({ map: adAtlas(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    signs: new THREE.MeshBasicMaterial({ map: signAtlas(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    server: new THREE.MeshBasicMaterial({ map: serverTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    driveLabel: new THREE.MeshLambertMaterial({ map: driveLabelTex(), side: THREE.DoubleSide }),
    icons: new THREE.MeshBasicMaterial({ map: icons, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: false, depthWrite: false }),
    ghost: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }),
    flash: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    beamGold: new THREE.MeshBasicMaterial({ color: 0xffd23a, opacity: 0.32, ...add }),
    beamPink: new THREE.MeshBasicMaterial({ color: 0xff2bd6, opacity: 0.22, ...add }),
    haloGold: new THREE.MeshBasicMaterial({ map: glowTex(), color: 0xffd23a, ...add }),
    exitTube: new THREE.MeshBasicMaterial({ color: 0xff2a3a }),
    exitBeam: new THREE.MeshBasicMaterial({ color: 0xff2a3a, opacity: 0.2, ...add }),
    exitPortal: new THREE.MeshBasicMaterial({ map: swirl, opacity: 0.85, ...add }),
    portalSwirl: new THREE.MeshBasicMaterial({ map: swirlPink, opacity: 0.9, ...add }),
    laser: new THREE.MeshBasicMaterial({ color: 0xff2a3a, fog: false }),
    beam: new THREE.MeshBasicMaterial({ color: 0xff3a4a, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    laserSheet: new THREE.MeshBasicMaterial({ color: 0xff2a3a, opacity: 0.18, ...add }),
    jet: new THREE.MeshBasicMaterial({ color: 0x8ff8ff, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }),
    arc: new THREE.LineBasicMaterial({ color: 0xc8f6ff, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }),
    vmPaint: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false }),
    vmGlow: new THREE.MeshBasicMaterial({ color: 0x2be8ff, fog: false }),
    vmHeat: new THREE.MeshBasicMaterial({ color: 0x3a3e48, fog: false }),
    vmFlash: new THREE.MeshBasicMaterial({ map: glowTex(), color: 0x2be8ff, ...add }),
  };
}

function laserModel(o, M) {
  const g = new THREE.Group();
  g.rotation.y = o.yaw;
  const K = new Kit();
  for (const sx of [-1, 1]) {
    K.add('p', box(0.3, o.h + 0.3, 0.3, { x: sx * o.len / 2, y: (o.h + 0.3) / 2, color: 0x2a2c34 }));
    K.add('p', box(0.36, 0.2, 0.36, { x: sx * o.len / 2, y: o.h + 0.35, color: 0xffcc1a }));
  }
  g.add(new THREE.Mesh(K.build().p, M.paintFlat));
  const B = new Kit();
  for (let y = 0.3; y < o.h; y += 0.45) B.add('b', box(o.len, 0.05, 0.05, { y }));
  const beams = new THREE.Mesh(B.build().b, M.laser);
  beams.name = 'beams'; g.add(beams);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(o.len, o.h), M.laserSheet.clone());
  sheet.position.y = o.h / 2; sheet.name = 'sheet'; g.add(sheet);
  return g;
}

function setFlash(g, on, flashMat) {
  g.userData.flashing = on;
  g.traverse((m) => {
    if (!m.isMesh || m.name === 'sight') return;
    if (on) { m.userData.mat = m.material; m.material = flashMat; } else if (m.userData.mat) { m.material = m.userData.mat; }
  });
}

function disposeTree(root) {
  root.traverse((m) => {
    if (m.geometry) m.geometry.dispose();
    if (m.material && m.material.userData?.own) m.material.dispose();
  });
}

