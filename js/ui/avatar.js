// "ECHO", the robot's onboard AI: just a face on a little CRT plate in the HUD corner. It reacts to
// what happens with big glowing eyes and stock anime expressions (^ ^, > <, sparkle eyes, sweat
// drops, anger marks, spirals, tears), with the chaotic, sugar-rush energy of a small cartoon robot
// sidekick, plus a speech bubble of quips and non-sequiturs. An original character: no borrowed
// designs or catchphrases. Drawn on a 48×48 canvas, upscaled with hard pixels.
//
//   const av = new Avatar(rootEl); av.react('drive'); av.update(dt);   // react() takes a reaction key
// Pure UI: it only reads the reaction keys main.js hands it.

const LINES = {
  start: ['Systems green! Let’s go UP!', 'Three drives. One exit. Many lasers. Yay!', 'Uplink stable. Mostly. Probably.', 'Remember: look down before you land!'],
  drive: ['DATA GET!', 'Ooh, it’s warm. Is data supposed to be warm?', 'That’s one less secret in the city!', 'I’m gonna name it Gerald.', 'Drive secured! Contents: spicy.'],
  drive3: ['ALL THREE! Exit’s open — follow the beam!', 'Full set! Big beam! GO GO GO!'],
  stomp: ['BOING!', 'Do it again! DO IT AGAIN!', 'Feet: one. Robots: zero.', 'Hee hee! Squish!'],
  kill: ['Target down.', 'Ka-BLAM!', 'Scrap metal!', 'I named that drone Kevin. RIP Kevin.'],
  guard: ['Sorry, officer!', 'He’s on his lunch break now. Forever.'],
  hurt: ['OW! Chassis breach!', 'Hey! That’s rented armour!', 'Ack! My face is on the inside!', 'Rude!!'],
  low: ['Integrity critical! Find a health can!', 'We’re held together by tape and ad revenue!'],
  fall: ['WAAAAAH—!', 'Gravity: still undefeated.', 'Wheeeee— oh no.', 'Let’s pretend that didn’t happen.'],
  health: ['Ahh, patched!', 'Mmm, fresh nanites.', 'Tastes like batteries!'],
  weapon: ['NEW TOY!', 'Ooooh shiny.', 'Upgrade installed! Warranty void!'],
  power: ['POWER UP!!', 'I feel FLOATY!', 'Turbo mode, baby!'],
  zap: ['Laser! Bad laser!', 'Time the gaps!', 'Zzzt! That tickled. It did NOT tickle.'],
  portal: ['A secret portal?! BONUS!', 'Ooh, hidden server farm!'],
  bonus: ['Mission mode. Destroy. Every. Server.', 'Thirty seconds. Wreck the racks.'],
  bonusClear: ['ALL CLEAR! PERFECT!', 'Server farm: deleted! Hee!'],
  bonusTimeout: ['Time! Close enough!', 'Aww, so close!'],
  clear: ['Stage clear! You’re a natural!', 'Extraction complete! Snack time?'],
  dead: ['Signal lost…', 'Shell offline… again?'],
  exitHint: ['The exit’s the big beam. Can’t miss it!'],
  idle: [
    'That cola ad says “40% less dread”. I measured. It’s 38%.',
    'Budget Clones is hiring. Both of me applied.',
    'Can we get noodles after this? Robot noodles?',
    'Mayor-Bot promised “fewer lasers”. LIES.',
    'Hover cars make great platforms. Their owners disagree.',
    'Triple jump, then look down. Trust me!',
    'If you see a magenta ring, jump in. Bonus!',
    'My toaster keeps asking about you.',
    'I just counted every window in the city. Then I forgot.',
    'Do you think the clouds are lonely? …Me neither.',
    'Air+ Premium. Imagine paying to breathe. Wait, I don’t breathe!',
    'BEEP. That was me. I just wanted to say beep.',
  ],
};

// reaction → [expression, line set, priority]. Some reactions pick from several faces.
const REACT = {
  drive: [['love', 'excited'], 'drive', 3], drive3: ['manic', 'drive3', 5], stomp: [['manic', 'happy'], 'stomp', 1], kill: [['smug', 'happy'], 'kill', 1],
  hurt: ['hurt', 'hurt', 3], low: ['cry', 'low', 4], fall: ['shock', 'fall', 4], health: ['happy', 'health', 2], weapon: [['sparkle', 'love'], 'weapon', 2],
  power: ['manic', 'power', 2], zap: ['angry', 'zap', 3], portal: ['sparkle', 'portal', 5], bonus: ['serious', 'bonus', 5], bonusClear: ['manic', 'bonusClear', 6],
  bonusTimeout: ['worried', 'bonusTimeout', 6], clear: ['sparkle', 'clear', 6], dead: ['dead', 'dead', 7], start: ['happy', 'start', 2],
  idle: [['idle', 'derp', 'happy', 'smug'], 'idle', 0], guard: ['smug', 'guard', 1], exitHint: ['idle', 'exitHint', 1],
};

const COL = { plate: '#0a0d1c', rim: '#2a3450', eye: '#5ff0ff', red: '#ff2a3a', gold: '#ffd23a', pink: '#ff7ab8', white: '#ffffff', tear: '#7fd8ff', mouth: '#1a0f20', tongue: '#ff5a8a', vein: '#ff3b5c' };

export class Avatar {
  constructor(root, { talk = false } = {}) {
    this.root = root;
    this.talk = talk; // expressions only by default; Options › AI quips turns the speech bubble on
    root.innerHTML = '<canvas width="48" height="48"></canvas><div class="av-say"></div>';
    this.cv = root.querySelector('canvas');
    this.g = this.cv.getContext('2d');
    this.say = root.querySelector('.av-say');
    this.expr = 'idle'; this.exprT = 0; this.prio = 0;
    this.text = ''; this.shown = 0; this.sayT = 0;
    this.blink = 2; this.t = 0; this.idleT = 14; this.glitch = 0; this.after = null;
    this.last = {};
    this.draw();
  }

  react(kind, force = false) {
    const r = REACT[kind];
    if (!r) return;
    const [faces, set, prio] = r;
    const expr = Array.isArray(faces) ? faces[Math.floor(Math.random() * faces.length)] : faces;
    if (!force && (this.talk ? this.sayT > 0 : this.exprT > 0) && prio < this.prio) return; // small stuff never interrupts big moments
    if (!force && this.last[kind] && this.t - this.last[kind] < (prio <= 1 ? 6 : 1.2)) { this.setExpr(expr, prio); return; }
    this.last[kind] = this.t;
    this.setExpr(expr, prio);
    const list = LINES[set];
    this.text = list[Math.floor(Math.random() * list.length)];
    this.shown = 0;
    this.sayT = this.talk ? 2.2 + this.text.length * 0.035 : 0;
    if (!this.talk) this.prio = prio;
    this.idleT = 18 + Math.random() * 14;
    if (expr === 'hurt' || expr === 'shock' || expr === 'dead' || expr === 'angry') this.glitch = 0.35;
    this.after = expr === 'shock' ? 'dizzy' : null; // shock, then the spirals
  }

  setExpr(e, prio) { this.expr = e; this.exprT = e === 'dead' ? 1e9 : 1.7; this.prio = prio; }
  setTalk(on) { this.talk = on; if (!on) { this.sayT = 0; this.say.classList.remove('on'); } }
  reset() { this.expr = 'idle'; this.exprT = 0; this.prio = 0; this.sayT = 0; this.after = null; this.say.classList.remove('on'); }

  update(dt, playing = true) {
    this.t += dt;
    if (this.exprT > 0) {
      this.exprT -= dt;
      if (this.exprT <= 0) {
        if (this.after) { this.expr = this.after; this.after = null; this.exprT = 1.4; }
        else { this.expr = 'idle'; this.prio = 0; }
      }
    }
    if (this.sayT > 0) {
      this.sayT -= dt;
      this.shown = Math.min(this.text.length, this.shown + dt * 45);
      this.say.textContent = this.text.slice(0, Math.floor(this.shown));
      this.say.classList.add('on');
      if (this.sayT <= 0) { this.say.classList.remove('on'); this.prio = 0; }
    }
    if (!this.talk && this.exprT <= 0) this.prio = 0;
    if (playing) { this.idleT -= dt; if (this.idleT <= 0) this.react('idle'); }
    this.blink -= dt;
    if (this.blink < -0.12) this.blink = 1.8 + Math.random() * 3.2;
    this.glitch = Math.max(0, this.glitch - dt);
    this.draw();
  }

  // ------------------------------------------------------------------ drawing (face only)
  draw() {
    const g = this.g, t = this.t, e = this.expr;
    const talking = this.sayT > 0 && this.shown < this.text.length;
    const open = talking && Math.floor(t * 14) % 2 === 0;
    g.clearRect(0, 0, 48, 48);
    // the CRT plate the face lives on
    g.fillStyle = COL.rim; rrect(g, 1, 1, 46, 46, 9); g.fill();
    g.fillStyle = e === 'serious' ? '#1a0508' : COL.plate; rrect(g, 3, 3, 42, 42, 7); g.fill();
    g.fillStyle = 'rgba(95,240,255,0.07)';
    for (let y = 3 + (Math.floor(t * 10) % 3); y < 45; y += 3) g.fillRect(3, y, 42, 1);
    // bounce: manic faces vibrate, everything else bobs gently
    const shake = e === 'manic' || e === 'angry' ? Math.round(Math.sin(t * 60) * 1) : 0;
    const bob = Math.round(Math.sin(t * 2.4) * 1);
    g.save(); g.translate(shake, bob);
    const ec = e === 'serious' || e === 'angry' ? COL.red : COL.eye;
    const blinking = this.blink < 0 && ['idle', 'happy', 'worried', 'derp'].includes(e);
    if (blinking) { line(g, 12, 20, 20, 20, ec, 2); line(g, 28, 20, 36, 20, ec, 2); } else this.eyes(g, e, ec);
    this.mouth(g, e, ec, open);
    this.marks(g, e);
    g.restore();
    if (this.glitch > 0) { // shear a few rows sideways
      for (let k = 0; k < 4; k++) {
        const y = Math.floor(Math.random() * 44), h = 2 + Math.floor(Math.random() * 3), dx = Math.floor((Math.random() - 0.5) * 8);
        g.putImageData(g.getImageData(0, y, 48, h), dx, y);
      }
    }
  }

  eyes(g, e, c) {
    const L = 16, R = 32, Y = 20, t = this.t;
    const round = (x, r, pr, px = 0, py = 0) => { circle(g, x, Y, r, c); circle(g, x + px, Y + py, pr, COL.plate); circle(g, x + px - 1.5, Y + py - 1.5, 1.2, COL.white); };
    switch (e) {
      case 'happy': arc(g, L, Y + 2, 4, Math.PI, 0, c, 2); arc(g, R, Y + 2, 4, Math.PI, 0, c, 2); break; // ^ ^
      case 'manic': // huge eyes, tiny pupils, darting: pure sugar rush
        round(L, 7, 1.6, Math.sin(t * 9) * 2, Math.cos(t * 7) * 2); round(R, 7, 1.6, Math.cos(t * 8) * 2, Math.sin(t * 11) * 2); break;
      case 'sparkle': // anime shoujo eyes
        circle(g, L, Y, 6, c); circle(g, R, Y, 6, c); circle(g, L, Y + 1, 3.5, '#1a4a8a'); circle(g, R, Y + 1, 3.5, '#1a4a8a');
        star(g, L - 2, Y - 2, 2.2, COL.white); star(g, R - 2, Y - 2, 2.2, COL.white); circle(g, L + 2, Y + 3, 1, COL.white); circle(g, R + 2, Y + 3, 1, COL.white); break;
      case 'love': heart(g, L, Y, 5.5, COL.pink); heart(g, R, Y, 5.5, COL.pink); break;
      case 'hurt': line(g, L - 4, Y - 4, L + 3, Y, c, 2); line(g, L + 3, Y, L - 4, Y + 4, c, 2); line(g, R + 4, Y - 4, R - 3, Y, c, 2); line(g, R - 3, Y, R + 4, Y + 4, c, 2); break; // > <
      case 'angry': // slanted, glaring
        g.fillStyle = c; g.beginPath(); g.moveTo(L - 6, Y - 4); g.lineTo(L + 5, Y); g.lineTo(L + 4, Y + 4); g.lineTo(L - 5, Y + 3); g.fill();
        g.beginPath(); g.moveTo(R + 6, Y - 4); g.lineTo(R - 5, Y); g.lineTo(R - 4, Y + 4); g.lineTo(R + 5, Y + 3); g.fill(); break;
      case 'serious': // mission mode: narrow red slits
        g.fillStyle = c; g.fillRect(L - 6, Y - 1, 12, 3); g.fillRect(R - 6, Y - 1, 12, 3); g.fillStyle = 'rgba(255,42,58,0.25)'; g.fillRect(L - 7, Y - 3, 14, 7); g.fillRect(R - 7, Y - 3, 14, 7); break;
      case 'smug': // half-lidded
        g.fillStyle = c; g.fillRect(L - 5, Y, 10, 4); g.fillRect(R - 5, Y, 10, 4); g.fillStyle = COL.plate; g.fillRect(L - 1, Y + 1, 4, 3); g.fillRect(R - 1, Y + 1, 4, 3);
        line(g, L - 6, Y - 1, L + 5, Y - 1, c, 1); line(g, R - 5, Y - 1, R + 6, Y - 1, c, 1); break;
      case 'shock': circle(g, L, Y, 7, COL.white); circle(g, R, Y, 7, COL.white); circle(g, L, Y, 1.5, COL.plate); circle(g, R, Y, 1.5, COL.plate); break;
      case 'dizzy': spiral(g, L, Y, 6, t * 8, c); spiral(g, R, Y, 6, t * 8 + 1, c); break;
      case 'worried': round(L, 6, 2, 0, 1); round(R, 6, 2, 0, 1); line(g, L - 5, Y - 9, L + 3, Y - 7, c, 1); line(g, R + 5, Y - 9, R - 3, Y - 7, c, 1); break;
      case 'cry': line(g, L - 5, Y - 2, L + 5, Y - 2, c, 2); line(g, L, Y - 2, L, Y + 3, c, 2); line(g, R - 5, Y - 2, R + 5, Y - 2, c, 2); line(g, R, Y - 2, R, Y + 3, c, 2); break; // T T
      case 'derp': round(L, 7, 2.5, 2, -1); round(R, 4, 1.5, -1, 2); break; // one big, one small
      case 'dead': for (const x of [L, R]) { line(g, x - 4, Y - 4, x + 4, Y + 4, '#556', 2); line(g, x + 4, Y - 4, x - 4, Y + 4, '#556', 2); } break;
      default: { // idle: big round glowing eyes that glance around
        const lx = Math.round(Math.sin(t * 0.7) * 2), ly = Math.round(Math.sin(t * 0.43) * 1);
        round(L, 6, 2.6, lx, ly); round(R, 6, 2.6, lx, ly);
      }
    }
  }

  mouth(g, e, c, open) {
    const X = 24, Y = 34;
    switch (e) {
      case 'happy': case 'sparkle': case 'love':
        g.fillStyle = COL.mouth; g.beginPath(); g.arc(X, Y - 2, open ? 6 : 5, 0, Math.PI); g.fill(); arc(g, X, Y - 2, open ? 6 : 5, 0, Math.PI, c, 1); break;
      case 'manic': // giant grin, tongue out
        g.fillStyle = COL.mouth; g.beginPath(); g.arc(X, Y - 4, 9, 0.1, Math.PI - 0.1); g.fill(); arc(g, X, Y - 4, 9, 0.1, Math.PI - 0.1, c, 1);
        circle(g, X + 3, Y + 3, 3, COL.tongue); break;
      case 'derp': g.fillStyle = COL.mouth; g.beginPath(); g.arc(X - 2, Y - 2, 5, 0, Math.PI); g.fill(); circle(g, X + 1, Y + 2, 2.5, COL.tongue); break;
      case 'smug': line(g, X - 5, Y, X + 4, Y - 2, c, 1); line(g, X + 4, Y - 2, X + 6, Y - 3, c, 1); break;
      case 'hurt': case 'worried': wave(g, X - 7, Y, 14, c); if (open) circle(g, X, Y + 1, 2, COL.mouth); break;
      case 'cry': wave(g, X - 7, Y, 14, c); break;
      case 'angry': g.fillStyle = COL.white; g.fillRect(X - 7, Y - 2, 14, 5); g.fillStyle = COL.mouth; for (let k = -5; k <= 5; k += 3) g.fillRect(X + k, Y - 2, 1, 5); break; // gritted teeth
      case 'serious': g.fillStyle = c; g.fillRect(X - 6, Y, 12, 1); break;
      case 'shock': circle(g, X, Y, open ? 4 : 3.5, COL.mouth); arc(g, X, Y, 4, 0, Math.PI * 2, c, 1); break;
      case 'dizzy': wave(g, X - 6, Y, 12, c); break;
      case 'dead': g.fillStyle = '#556'; g.fillRect(X - 5, Y, 10, 1); break;
      default: if (open) { g.fillStyle = COL.mouth; g.fillRect(X - 4, Y - 1, 8, 3); g.fillStyle = c; g.fillRect(X - 4, Y - 2, 8, 1); } else arc(g, X, Y - 3, 4, 0.4, Math.PI - 0.4, c, 1);
    }
  }

  marks(g, e) { // anime marks
    if (e === 'happy' || e === 'love' || e === 'sparkle' || e === 'manic') { for (const x of [8, 34]) { line(g, x, 28, x + 2, 26, COL.pink, 1); line(g, x + 3, 28, x + 5, 26, COL.pink, 1); } }
    if (e === 'worried' || e === 'shock') { g.fillStyle = COL.tear; g.beginPath(); g.moveTo(40, 8); g.quadraticCurveTo(44, 14, 40, 16); g.quadraticCurveTo(36, 14, 40, 8); g.fill(); }
    if (e === 'angry') { const x = 38, y = 9; for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { line(g, x + a, y + b, x + a * 3, y + b, COL.vein, 1); line(g, x + a, y + b, x + a, y + b * 3, COL.vein, 1); } }
    if (e === 'cry') { const y = 22 + ((this.t * 20) % 12); g.fillStyle = COL.tear; g.fillRect(14, 22, 2, y - 22); g.fillRect(30, 22, 2, y - 22); }
    if (e === 'sparkle' || e === 'manic') { const k = Math.floor(this.t * 6) % 2; star(g, k ? 6 : 41, k ? 8 : 39, 2, COL.gold); }
    if (e === 'serious') { g.fillStyle = COL.red; g.font = 'bold 6px monospace'; g.fillText('!!', 38, 10); }
  }
}

// ------------------------------------------------------------------ tiny canvas helpers
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function circle(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
function arc(g, x, y, r, a0, a1, c, w) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); }
function line(g, x0, y0, x1, y1, c, w) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function wave(g, x, y, w, c) { g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); for (let i = 0; i <= w; i++) g[i ? 'lineTo' : 'moveTo'](x + i, y + Math.sin(i * 1.2) * 1.5); g.stroke(); }
function star(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2, rr = k % 2 ? r * 0.35 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
function heart(g, x, y, s, c) { g.fillStyle = c; g.beginPath(); g.moveTo(x, y + s * 0.8); g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35); g.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.8); g.fill(); }
function spiral(g, x, y, r, rot, c) { g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 40; i++) { const a = rot + i * 0.45, rr = (i / 40) * r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
