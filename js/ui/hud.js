// DOM HUD. Reads a snapshot of the world (and the renderer for projections); owns no game state.
// Throttled where it touches layout; markers and the crosshair update every frame.
import { WEAPONS, ENEMIES } from '../sim/tuning.js';
import { forward } from '../sim/util.js';
import { viewPitch } from '../sim/player.js';

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = {
      hud: $('hud'), hp: $('hp'), drives: $('drives'), objective: $('objective'), score: $('score'), clock: $('clock'),
      altFill: $('alt-fill'), altMark: $('alt-mark'), altNum: $('alt-num'), pips: $('pips'), weapon: $('weapon'), ammo: $('ammo'),
      powers: $('powers'), bonus: $('bonus-hud'), bonusTime: $('bonus-time'), bonusCount: $('bonus-count'),
      cross: $('crosshair'), hit: $('hitmark'), markers: $('markers'), floaters: $('floaters'), toasts: $('toasts'), vig: $('vignette'),
    };
    this.cache = {};
    this.markers = new Map();
    this.hpCells = [];
    this.altMax = 60;
  }

  setWorld(w) {
    const n = 8;
    this.el.hp.innerHTML = '<i></i>'.repeat(n);
    this.hpCells = [...this.el.hp.children];
    this.el.drives.innerHTML = '<i></i>'.repeat(w.drives.length);
    this.el.drives.classList.toggle('hidden', !w.drives.length);
    this.el.objective.classList.toggle('hidden', !!w.bonus);
    this.el.bonus.classList.toggle('hidden', !w.bonus);
    let top = 0;
    for (const p of w.plats) top = Math.max(top, p.h);
    this.altMax = Math.max(20, Math.min(110, top + 6));
    this.altMin = w.level.killY ?? 0;
    for (const m of this.markers.values()) m.remove();
    this.markers.clear();
    this.cache = {};
    this.el.toasts.innerHTML = ''; this.el.floaters.innerHTML = '';
  }

  set(key, el, text) { if (this.cache[key] !== text) { this.cache[key] = text; el.textContent = text; } }

  update(w, snap, R, wpx, hpx) {
    const E = this.el, P = w.player;
    // health
    const hpKey = snap.hp + '/' + snap.hpMax;
    if (this.cache.hp !== hpKey) {
      this.cache.hp = hpKey;
      this.hpCells.forEach((c, i) => c.classList.toggle('off', i >= snap.hp));
      E.hp.classList.toggle('crit', snap.hp <= 2);
      E.vig.classList.toggle('crit', snap.hp <= 2 && snap.hp > 0);
    }
    E.vig.classList.toggle('hurt', P.hurtT < 0.18);
    // drives + objective
    const dk = snap.drives + '/' + snap.exitOpen;
    if (this.cache.dr !== dk) {
      this.cache.dr = dk;
      [...E.drives.children].forEach((c, i) => c.classList.toggle('got', i < snap.drives));
      E.objective.textContent = snap.exitOpen ? 'EXIT OPEN — REACH THE GATE' : `RECOVER DATA DRIVES ${snap.drives}/${snap.drivesTotal}`;
      E.objective.classList.toggle('open', snap.exitOpen);
    }
    this.set('score', E.score, String(snap.score).padStart(6, '0'));
    const tt = Math.floor(snap.time);
    this.set('clock', E.clock, `${Math.floor(tt / 60)}:${String(tt % 60).padStart(2, '0')}`);
    // altimeter + jump pips
    const k = Math.max(0, Math.min(1, (snap.alt - this.altMin) / (this.altMax - this.altMin)));
    E.altFill.style.height = (k * 100).toFixed(1) + '%';
    E.altMark.style.bottom = (k * 100).toFixed(1) + '%';
    this.set('alt', E.altNum, Math.round(snap.alt) + 'm');
    const pk = String(snap.jumpsLeft);
    if (this.cache.pips !== pk) { this.cache.pips = pk; [...E.pips.children].forEach((c, i) => c.classList.toggle('off', 2 - i >= snap.jumpsLeft)); }
    // weapon
    this.set('wpn', E.weapon, WEAPONS[snap.weapon].name);
    this.set('ammo', E.ammo, snap.ammo === Infinity ? '∞' : String(snap.ammo));
    const pw = `${snap.hyper > 0 ? 'H' + Math.ceil(snap.hyper) : ''}|${snap.over > 0 ? 'O' + Math.ceil(snap.over) : ''}`;
    if (this.cache.pw !== pw) {
      this.cache.pw = pw;
      E.powers.innerHTML = (snap.hyper > 0 ? `<div>HYPER JUMP ${Math.ceil(snap.hyper)}</div>` : '') + (snap.over > 0 ? `<div class="over">OVERDRIVE ${Math.ceil(snap.over)}</div>` : '');
    }
    if (snap.bonus) {
      this.set('bt', E.bonusTime, snap.bonus.left.toFixed(1));
      E.bonusTime.classList.toggle('low', snap.bonus.left < 8);
      this.set('bc', E.bonusCount, `SERVERS ${snap.bonus.down}/${snap.bonus.total}`);
    }
    // crosshair turns red over an enemy (the shot goes exactly there)
    const f = forward(P.yaw, viewPitch(P)), ex = P.x, ey = P.y + 1.55, ez = P.z;
    let on = false;
    for (const e of w.enemies) {
      if (e.dead) continue;
      const dx = e.x - ex, dy = e.y + e.top * 0.5 - ey, dz = e.z - ez;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > 70 || d < 0.5) continue;
      const dot = (dx * f[0] + dy * f[1] + dz * f[2]) / d;
      if (dot > 0 && Math.sqrt(Math.max(0, 1 - dot * dot)) * d < ENEMIES[e.type].r + 0.25) { on = true; break; }
    }
    E.cross.classList.toggle('on', on);
    this.updateMarkers(w, R, wpx, hpx);
  }

  // Objective markers: on screen at the target, or pinned to the edge pointing at it.
  updateMarkers(w, R, wpx, hpx) {
    const P = w.player, want = [];
    for (const d of w.drives) if (!d.got) want.push(['drive', d, 'DATA']);
    if (w.exit && w.exitOpen) want.push(['exit', w.exit, 'EXIT']);
    if (w.portal && !w.portal.used) {
      const dx = w.portal.x - P.x, dz = w.portal.z - P.z;
      if (dx * dx + dz * dz < 25 * 25) want.push(['portal', w.portal, 'BONUS']); // a secret until you're close
    }
    const seen = new Set();
    for (const [kind, o, label] of want) {
      seen.add(o);
      let m = this.markers.get(o);
      if (!m) { m = document.createElement('div'); m.className = 'mk ' + kind; m.innerHTML = `<div class="gem"></div><span></span>`; this.el.markers.appendChild(m); this.markers.set(o, m); }
      const ty = o.y + (kind === 'exit' ? 4 : 0.8);
      const v = R.toCam(o.x, ty, o.z);
      const dist = Math.round(Math.sqrt((o.x - P.x) ** 2 + (o.y - P.y) ** 2 + (o.z - P.z) ** 2));
      const pad = 34;
      let sx, sy, edge = false;
      const s = v.z < -0.1 ? R.project(o.x, ty, o.z, wpx, hpx) : null;
      if (s && s.x > pad && s.x < wpx - pad && s.y > pad + 40 && s.y < hpx - pad) { sx = s.x; sy = s.y; }
      else {
        edge = true;
        let dx = v.x, dy = -v.y;
        if (v.z > 0 && Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) dy = 1;
        const l = Math.sqrt(dx * dx + dy * dy) || 1; dx /= l; dy /= l;
        const hx = wpx / 2 - pad, hy = hpx / 2 - pad - 20;
        const t = Math.min(Math.abs(hx / (dx || 1e-6)), Math.abs(hy / (dy || 1e-6)));
        sx = wpx / 2 + dx * t; sy = hpx / 2 + 10 + dy * t;
        m.firstChild.style.transform = `rotate(${Math.atan2(dx, -dy)}rad)`;
      }
      m.classList.toggle('edge', edge);
      if (!edge) m.firstChild.style.transform = '';
      m.style.left = sx.toFixed(0) + 'px'; m.style.top = sy.toFixed(0) + 'px';
      const txt = `${label} ${dist}m`;
      if (m._t !== txt) { m._t = txt; m.lastChild.textContent = txt; }
    }
    for (const [o, m] of this.markers) if (!seen.has(o)) { m.remove(); this.markers.delete(o); }
  }

  toast(text, cls = '') {
    const d = document.createElement('div');
    d.className = 'toast ' + cls; d.textContent = text;
    this.el.toasts.appendChild(d);
    while (this.el.toasts.children.length > 3) this.el.toasts.firstChild.remove();
    setTimeout(() => d.remove(), 1700);
  }

  floater(x, y, text, color) {
    const d = document.createElement('div');
    d.className = 'fl'; d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    if (color) d.style.color = color;
    this.el.floaters.appendChild(d);
    setTimeout(() => d.remove(), 1000);
  }

  hitmark() { const h = this.el.hit; h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); }
}
