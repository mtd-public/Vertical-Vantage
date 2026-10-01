// Input: keyboard + mouse (pointer lock), Xbox / standard gamepads, optional touch controls.
// Everything folds into ONE control object per sim step (see js/sim/player.js):
//   { mx, my, yaw, pitch, jump, fire, swap }
// Look arrives as radians already scaled by sensitivity; edges (jump, swap) are latched until a
// sim step consumes them, so a press is never lost on a frame that runs zero sim steps.
//
// Patterns reused:
//   * floating thumbstick + per-pointer hold buttons, reset on blur / visibility / pagehide /
//     lostpointercapture (gig-ambulance via mstr-gme-dsgn-tmpt starters/vanilla-three-toy)
//   * gamepad polling with a radial deadzone (dr-mow js/input.js pollPad), quadratic look curve and
//     trigger hysteresis (cosmic-calamity-assault site/play/gamepad.js), button names (dr-mow pad.js)
//   * mouse-look spike filter after a pointer-lock change (cosmic-calamity-assault play.js)

const PAD = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
export const PAD_NAMES = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'L-stick', 'R-stick', 'D-pad ↑', 'D-pad ↓', 'D-pad ←', 'D-pad →'];

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.opts = { mouseSens: 1, padSens: 1, touchSens: 1, invertY: false };
    this.keys = new Set();
    this.mouseFire = false;
    this.lookYaw = 0; this.lookPitch = 0; // pending look (rad), consumed by control()
    this.jumpEdge = false; this.swapEdge = 0;
    this.locked = false; this.lockT = 0;
    this.enabled = false; // gameplay input on (off in menus)
    this.onPause = null; this.onKey = null;
    // gamepad
    this.pad = null; this.padPrev = {}; this.padId = ''; this.trig = false; this.padActive = false;
    // touch
    this.touchOn = false;
    this.stick = { id: null, bx: 0, by: 0, tx: 0, ty: 0, x: 0, y: 0, active: false };
    this.lookId = null; this.lookX = 0; this.lookY = 0;
    this.held = { fire: false, jump: false };
    this._buttons = [];
    this._bind();
  }

  // ------------------------------------------------------------------ keyboard + mouse
  _bind() {
    const el = this.canvas;
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
      if (!e.repeat) {
        if (this.onKey && this.onKey(k, e)) return;
        if (this.enabled) {
          if (k === ' ' || k === 'x') this.jumpEdge = true;
          if (k === 'q') this.swapEdge = -1;
          if (k === 'e' || k === 'tab') { this.swapEdge = 1; e.preventDefault(); }
        }
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    el.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (!this.locked && !this.touchOn) { this.requestLock(); return; }
      if (e.button === 0) this.mouseFire = true;
      if (e.button === 2) this.jumpEdge = true; // right click jumps (handy on a trackpad)
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseFire = false; });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', (e) => { if (this.enabled && this.locked) this.swapEdge = e.deltaY > 0 ? 1 : -1; }, { passive: true });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      if (performance.now() - this.lockT < 120) return; // first move after locking spikes in Chromium
      const dx = e.movementX || 0, dy = e.movementY || 0;
      if (Math.abs(dx) > 300 || Math.abs(dy) > 300) return;
      const k = 0.0022 * this.opts.mouseSens;
      this.lookYaw -= dx * k;
      this.lookPitch -= dy * k * (this.opts.invertY ? -1 : 1);
    });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === el;
      this.lockT = performance.now();
      if (was && !this.locked && this.enabled && this.onPause) this.onPause('unlock');
    });
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
    window.addEventListener('pagehide', () => this.reset());
  }

  requestLock() {
    if (this.touchOn || !this.canvas.requestPointerLock) return;
    try {
      const r = this.canvas.requestPointerLock({ unadjustedMovement: true });
      if (r && r.catch) r.catch(() => { try { this.canvas.requestPointerLock(); } catch (_) { /* ignore */ } });
    } catch (_) { try { this.canvas.requestPointerLock(); } catch (_) { /* ignore */ } }
  }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  // Drop everything held (pause, blur, app switch): a stuck stick or fire is the classic bug.
  reset() {
    this.keys.clear(); this.mouseFire = false;
    this.lookYaw = this.lookPitch = 0; this.jumpEdge = false; this.swapEdge = 0;
    this.stick.id = null; this.stick.active = false; this.stick.x = this.stick.y = 0;
    this.lookId = null;
    this.held.fire = this.held.jump = false;
    for (const b of this._buttons) b.classList.remove('down');
    this.trig = false;
  }

  // ------------------------------------------------------------------ gamepad
  // Call once per frame. Returns this frame's button presses (for menus); held state on this.pad.
  pollPad(dt) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected && (!gp || p.mapping === 'standard')) gp = p;
    if (!gp) { this.pad = null; this.padPrev = {}; return {}; }
    this.padId = gp.id;
    const down = (i) => { const q = gp.buttons[i]; return !!q && (q.pressed || q.value > 0.5); };
    const dz = (x, y, d) => { const m = Math.sqrt(x * x + y * y); if (m < d) return [0, 0, 0]; const k = Math.min(1, (m - d) / (1 - d)); return [x / m, y / m, k]; };
    const [lx, ly, lm] = dz(gp.axes[0] || 0, gp.axes[1] || 0, 0.2);
    const [rx, ry, rm] = dz(gp.axes[2] || 0, gp.axes[3] || 0, 0.12);
    // right trigger: analog with hysteresis (fire on ≥ 0.35, release under 0.2)
    const rt = gp.buttons[PAD.RT]?.value ?? 0;
    this.trig = this.trig ? rt > 0.2 : rt >= 0.35;
    const now = {
      a: down(PAD.A), b: down(PAD.B), x: down(PAD.X), y: down(PAD.Y), lb: down(PAD.LB), rb: down(PAD.RB), lt: (gp.buttons[PAD.LT]?.value ?? 0) > 0.5,
      start: down(PAD.START), view: down(PAD.VIEW), up: down(PAD.UP), down: down(PAD.DOWN), left: down(PAD.LEFT), right: down(PAD.RIGHT),
    };
    const was = this.padPrev, edges = {};
    for (const k in now) if (now[k] && !was[k]) edges[k] = true;
    this.padPrev = now;
    this.pad = { lx: lx * lm, ly: ly * lm, lm, rx, ry, rm, fire: this.trig || now.rb, ...now };
    if (lm > 0.4 || rm > 0.4 || Object.keys(edges).length) this.padActive = true;
    if (this.enabled) {
      if (edges.a || edges.lb || edges.lt) this.jumpEdge = true;
      if (edges.y || edges.right) this.swapEdge = 1;
      if (edges.x || edges.left) this.swapEdge = -1;
      // right stick: quadratic response, capped turn rate (rad/s)
      if (rm > 0) {
        const k = rm * rm * this.opts.padSens;
        this.lookYaw -= rx * k * 3.4 * dt;
        this.lookPitch -= ry * k * 2.4 * dt * (this.opts.invertY ? -1 : 1);
      }
    }
    return edges;
  }

  rumble(strong = 0.5, weak = 0.5, ms = 120) {
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.connected && p.vibrationActuator) p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
    } catch (_) { /* not supported */ }
  }

  // ------------------------------------------------------------------ touch
  // zone: the full-screen layer under the HUD. Left 45 % = floating move stick, right = drag to look.
  bindTouch(zone, ui) {
    this.ui = ui;
    zone.style.touchAction = 'none';
    zone.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      const r = zone.getBoundingClientRect(), x = e.clientX - r.left;
      if (x < r.width * 0.45) { // a new touch always takes the stick over (gig-ambulance fix)
        Object.assign(this.stick, { id: e.pointerId, bx: e.clientX, by: e.clientY, tx: e.clientX, ty: e.clientY, x: 0, y: 0, active: true });
      } else { this.lookId = e.pointerId; this.lookX = e.clientX; this.lookY = e.clientY; }
      try { zone.setPointerCapture(e.pointerId); } catch (_) { /* synthetic */ }
    }, { passive: false });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && e.buttons === 0) { this._end(e); return; }
      if (e.pointerId === this.stick.id) { e.preventDefault(); this._moveStick(e.clientX, e.clientY); }
      else if (e.pointerId === this.lookId) { e.preventDefault(); this._dragLook(e.clientX, e.clientY); }
    }, { passive: false });
    const end = (e) => this._end(e);
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end); zone.addEventListener('lostpointercapture', end);
  }
  _end(e) {
    if (e.pointerId === this.stick.id) { this.stick.id = null; this.stick.active = false; this.stick.x = this.stick.y = 0; }
    if (e.pointerId === this.lookId) this.lookId = null;
  }
  _moveStick(x, y) {
    const S = this.stick, R = 60;
    let dx = x - S.bx, dy = y - S.by;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > R) { S.bx += (dx / d) * (d - R); S.by += (dy / d) * (d - R); dx = x - S.bx; dy = y - S.by; } // the base follows the thumb
    S.tx = x; S.ty = y;
    const dd = Math.sqrt(dx * dx + dy * dy), dead = 8;
    if (dd > dead) { const k = Math.min(1, (dd - dead) / (R * 0.8 - dead)); S.x = (dx / dd) * k; S.y = (dy / dd) * k; } else { S.x = S.y = 0; }
  }
  _dragLook(x, y) {
    const k = 0.0062 * this.opts.touchSens;
    this.lookYaw -= (x - this.lookX) * k;
    this.lookPitch -= (y - this.lookY) * k * (this.opts.invertY ? -1 : 1);
    this.lookX = x; this.lookY = y;
  }
  // Hold buttons with their own pointer owner. FIRE also aims while you drag it (thumb never leaves).
  bindButton(el, name) {
    this._buttons.push(el);
    el.style.touchAction = 'none';
    let owner = null, lx = 0, ly = 0;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      owner = e.pointerId; lx = e.clientX; ly = e.clientY;
      if (name === 'jump') this.jumpEdge = true;
      else if (name === 'swap') this.swapEdge = 1;
      else this.held[name] = true;
      el.classList.add('down');
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    }, { passive: false });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== owner || name !== 'fire') return;
      const k = 0.0062 * this.opts.touchSens;
      this.lookYaw -= (e.clientX - lx) * k; this.lookPitch -= (e.clientY - ly) * k * (this.opts.invertY ? -1 : 1);
      lx = e.clientX; ly = e.clientY;
    });
    const off = (e) => { if (owner !== null && e.pointerId !== owner) return; owner = null; if (name in this.held) this.held[name] = false; el.classList.remove('down'); };
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ------------------------------------------------------------------ per step
  // Look not yet consumed by a sim step (the renderer adds it so the camera never lags).
  peekLook() { return { yaw: this.lookYaw, pitch: this.lookPitch }; }

  control(dt) {
    const k = this.keys, pad = this.pad;
    let mx = 0, my = 0;
    if (k.has('a')) mx -= 1; if (k.has('d')) mx += 1;
    if (k.has('w')) my += 1; if (k.has('s')) my -= 1;
    if (!mx && !my && this.stick.active) { mx = this.stick.x; my = -this.stick.y; }
    if (!mx && !my && pad && pad.lm > 0) { mx = pad.lx; my = -pad.ly; }
    // arrow keys turn (keyboard-only play)
    if (k.has('arrowleft')) this.lookYaw += 2.4 * dt;
    if (k.has('arrowright')) this.lookYaw -= 2.4 * dt;
    if (k.has('arrowup')) this.lookPitch += 1.6 * dt;
    if (k.has('arrowdown')) this.lookPitch -= 1.6 * dt;
    const c = {
      mx, my, yaw: this.lookYaw, pitch: this.lookPitch,
      jump: this.jumpEdge,
      fire: this.mouseFire || k.has('j') || k.has('control') || k.has('z') || this.held.fire || !!(pad && pad.fire) || this.autoFire,
      swap: this.swapEdge,
    };
    this.lookYaw = this.lookPitch = 0; this.jumpEdge = false; this.swapEdge = 0;
    return c;
  }
}
