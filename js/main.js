// Vertical Vantage — boot, loop, state machine, glue. (The game rules live in js/sim.)
//
//   modes: title (attract orbit) → intro → play ⇄ paused → result | over → … → ending
//          play → (portal) bonusIntro → play (bonus world) → bonusResult → play (main world again)
//   clock: fixed 1/120 s sim steps from an accumulator (dr-mow); render interpolates the player.
//   window.GAME exposes the state for the smoke test and console poking (house habit).
import './render/retro.js'; // first: patches three's shader chunks before any material compiles
import { GameRenderer } from './render/renderer.js';
import { createWorld, step, snapshot } from './sim/world.js';
import { updatePlats } from './sim/plats.js';
import { T, WEAPONS } from './sim/tuning.js';
import { STAGES, bonusFor } from './levels/index.js';
import { Input } from './input/input.js';
import { MenuNav } from './input/menu-nav.js';
import { Audio, STAGE_SONG, songFor } from './audio/audio.js';
import { Hud } from './ui/hud.js';
import { Avatar } from './ui/avatar.js';
import * as Screens from './ui/screens.js';
import { bossKind } from './sim/bosses/index.js';
import { Achievements } from './ui/achievements.js';

const SKEY = 'vertical-vantage.settings', PKEY = 'vertical-vantage.progress';
const TESTING_UNLOCK_ALL = true; // every stage of every pack is open in Stage Select (testing build)
const DEFAULTS = {
  art: 'retro', mouseSens: 1, padSens: 1, touchSens: 1, invertY: false, autoLook: true, touch: 'auto', cannon: true, quips: false,
  musicVol: 0.8, sfxVol: 0.9, fov: 96, calm: false, lowFlash: false, fireLatch: false, quality: 'auto',
};
const load = (k, d) => { try { return { ...d, ...(JSON.parse(localStorage.getItem(k)) || {}) }; } catch (_) { return { ...d }; } };
// First-run quality guess: phones and small machines start on Low / Med (overridable in Options).
function autoQuality() {
  const coarse = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  return coarse && (mem <= 4 || cores <= 4) ? 'low' : coarse ? 'med' : 'high';
}
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* private mode */ } };

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const renderer = new GameRenderer(canvas);
const input = new Input(canvas);
const nav = new MenuNav();
const audio = new Audio();
const hud = new Hud();
const avatar = new Avatar($('avatar'));

const G = {
  mode: 'boot', stageIdx: 0, world: null, main: null, acc: 0, t: 0, timer: 0, next: null,
  runScore: 0, settings: migrate(load(SKEY, DEFAULTS)), progress: load(PKEY, { unlocked: 1, best: {}, bestTotal: 0, bestTime: {}, bonusBest: {}, ach: {}, portals: {} }),
  optionsBack: 'back', touch: false, muted: false, padMode: false, lastTouchT: 0,
};

if (TESTING_UNLOCK_ALL) G.progress.unlocked = STAGES.length;
const ach = new Achievements(G.progress.ach, STAGES.filter((s) => s.portal).map((s) => s.id));

// ------------------------------------------------------------------ settings
// Older saves had music / sound on-off switches: they become volume 0.
function migrate(S) {
  if (S.music === false) S.musicVol = 0;
  if (S.sound === false) S.sfxVol = 0;
  delete S.music; delete S.sound;
  return S;
}
function applySettings() {
  const S = G.settings;
  Object.assign(input.opts, { mouseSens: S.mouseSens, padSens: S.padSens, touchSens: S.touchSens, invertY: S.invertY, fireLatch: S.fireLatch });
  if (G.world) G.world.opts.autoLook = S.autoLook;
  if (G.main) G.main.opts.autoLook = S.autoLook;
  renderer.showCannon = S.cannon;
  renderer.setOptions({ fov: S.fov, calm: S.calm, lowFlash: S.lowFlash, quality: S.quality === 'auto' ? autoQuality() : S.quality });
  document.body.classList.toggle('calm', S.calm);
  document.body.classList.toggle('low-flash', S.lowFlash);
  avatar.setTalk(S.quips);
  audio.setVolumes(S.musicVol, S.sfxVol);
  audio.setMuted(G.muted);
  setTouch(wantTouch());
}
// Touch controls: ON / OFF, or AUTO = on a touch screen, except while a controller is in use (they'd
// only cover the view); touching the screen again brings them back.
function wantTouch() {
  const S = G.settings;
  return S.touch === 'on' || (S.touch === 'auto' && !G.padMode && (G.touchSeen || matchMedia('(pointer: coarse)').matches));
}
function setPadMode(on) {
  if (G.padMode === on) return;
  G.padMode = on;
  setTouch(wantTouch());
}
function setTouch(on) {
  if (G.touch === on && document.body.classList.contains('touch') === on) { showControls(); return; }
  G.touch = on;
  input.touchOn = on;
  document.body.classList.toggle('touch', on);
  showControls();
}
function showControls() {
  const playing = G.mode === 'play' || G.mode === 'intro'; // (shown during the intro card so you see the layout first)
  $('touch-ui').classList.toggle('hidden', !(G.touch && playing));
  $('touch-zone').classList.toggle('hidden', !(G.touch && playing));
}
window.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  G.lastTouchT = performance.now();
  if (!G.touchSeen) G.touchSeen = true;
  if (G.padMode) setPadMode(false); else if (G.settings.touch === 'auto') setTouch(wantTouch());
}, { capture: true });
// a controller in use (a press or a stick push, newer than the last touch) hides the touch controls;
// unplugging the last one shows them again
window.addEventListener('gamepaddisconnected', () => { if (![...(navigator.getGamepads?.() || [])].some((p) => p && p.connected)) setPadMode(false); });

// ------------------------------------------------------------------ flow
const wopts = () => ({ autoLook: G.settings.autoLook });
function setWorld(w) {
  G.world = w; G.acc = 0;
  renderer.setWorld(w);
  hud.setWorld(w);
}

function toTitle() {
  G.mode = 'title'; G.main = null;
  input.enabled = false; input.reset(); input.releaseLock();
  $('hud').classList.add('hidden');
  showControls();
  setWorld(createWorld(STAGES[Math.floor(Math.random() * STAGES.length)], wopts()));
  audio.song = STAGE_SONG.menu;
  avatar.reset();
  Screens.title(G.progress, input.pad ? input.padId.split('(')[0].trim() : '');
}

function startStage(i, keepScore = false) {
  G.stageIdx = i;
  ach.resetStage();
  if (!keepScore) G.runScore = G.runScore || 0;
  G.main = null;
  const stage = STAGES[i];
  setWorld(createWorld(stage, wopts()));
  audio.song = songFor(stage);
  $('hud').classList.remove('hidden');
  G.mode = 'intro'; G.timer = 2.2; G.next = beginPlay;
  input.enabled = false; input.reset();
  showControls();
  Screens.intro(stage, i);
  avatar.reset();
  avatar.react('start', true);
}

function beginPlay() {
  Screens.hide();
  G.mode = 'play';
  input.enabled = true; input.reset();
  if (!G.touch && !input.pad) input.requestLock();
  showControls();
}

function pause(why) {
  if (G.mode !== 'play') return;
  G.mode = 'paused';
  audio.laserHum(false);
  input.enabled = false; input.reset(); input.releaseLock();
  showControls();
  Screens.pause();
}
function resume() {
  Screens.hide();
  G.mode = 'play';
  input.enabled = true; input.reset();
  if (!G.touch && !input.padActive) input.requestLock();
  showControls();
}

function enterBonus() {
  const main = G.world;
  main.request = null;
  const stage = STAGES[G.stageIdx];
  const B = createWorld(bonusFor(stage), wopts());
  const bp = B.player, mp = main.player;
  bp.hp = mp.hp; bp.weapon = mp.weapon; Object.assign(bp.ammo, mp.ammo); bp.hyper = mp.hyper; bp.over = mp.over;
  G.main = main;
  setWorld(B);
  audio.song = STAGE_SONG.bonus;
  G.mode = 'intro'; G.timer = 2; G.next = () => { beginPlay(); avatar.react('bonus', true); };
  input.enabled = false; input.reset();
  showControls();
  Screens.intro(B.level, 0, true);
}

function leaveBonus() {
  const B = G.world, main = G.main;
  const mp = main.player, bp = B.player;
  mp.weapon = bp.weapon; Object.assign(mp.ammo, bp.ammo); mp.hyper = bp.hyper; mp.over = bp.over;
  if (B.phase === 'bonusClear') mp.hp = T.HP_MAX;
  main.score += B.score;
  G.main = null;
  setWorld(main);
  audio.song = songFor(STAGES[G.stageIdx]);
  beginPlay();
}

function stageCleared() {
  const w = G.world, stage = STAGES[G.stageIdx];
  G.stageTotal = G.runScore + w.score; // banked into runScore when you leave the card (the HUD adds w.score until then)
  const P = G.progress;
  const prev = P.bestTime[stage.id], record = !prev || w.clear.time < prev;
  if (record) P.bestTime[stage.id] = Math.round(w.clear.time * 100) / 100;
  const got = ach.onClear(w, stage, P.portals);
  if (G.stageIdx === STAGES.length - 1) ach.onEnding(got);
  if (record && prev) avatar.react('record', true); else if (got.length) avatar.react('achieve', true);
  P.best[stage.id] = Math.max(P.best[stage.id] || 0, w.score);
  P.unlocked = Math.max(P.unlocked, Math.min(STAGES.length, G.stageIdx + 2));
  P.bestTotal = Math.max(P.bestTotal || 0, G.stageTotal);
  save(PKEY, P);
  G.mode = 'result';
  input.enabled = false; input.reset(); input.releaseLock();
  showControls();
  Screens.clear(stage, G.stageIdx, w, G.stageTotal, G.stageIdx === STAGES.length - 1, { best: P.bestTime[stage.id], record: record && !!prev, par: stage.par, got });
}
// A boss down: remember its kind; every boss in the game down → the BOSS RUSH achievement.
function bossBeaten(kind) {
  const P = G.progress;
  (P.bosses ||= {})[kind || 'arachne'] = true;
  const all = STAGES.filter((s) => s.boss).map((s) => s.boss.kind || 'arachne');
  if (all.every((k) => P.bosses[k])) { const a = ach.grant('bossAll'); if (a) hud.toast(`★ ${a.name}`, 'gold'); }
  save(PKEY, P);
}
// Bonus round over: best result per bonus arena (most servers, then most time left), achievements.
function bonusDone(ok) {
  const w = G.world, P = G.progress, id = w.level.id, b = P.bonusBest[id];
  const mine = { down: w.bonus.down, total: w.bonus.total, left: ok ? w.clear.secs : 0 };
  const record = !b || mine.down > b.down || (mine.down === b.down && mine.left > b.left);
  if (record) P.bonusBest[id] = mine;
  const got = ach.onBonus(w, ok);
  if (got.length) avatar.react('achieve', true);
  save(PKEY, P);
  G.mode = 'result'; input.releaseLock(); showControls();
  Screens.bonusResult(w, ok, { best: P.bonusBest[id], record: record && !!b, got });
}

// ------------------------------------------------------------------ menu actions
const ACTIONS = {
  play: () => { audio.unlock(); G.runScore = 0; const i = STAGES.findIndex((s) => !G.progress.best[s.id]); startStage(i < 0 ? 0 : i); fullscreen(); }, // the first stage you haven't cleared
  stages: () => Screens.stages(G.progress),
  records: () => Screens.records(G.progress),
  options: () => { G.optionsBack = 'back'; Screens.options(G.settings, 'back'); },
  pauseOptions: () => { G.optionsBack = 'pause'; Screens.options(G.settings, 'toPause'); },
  toPause: () => Screens.pause(),
  back: () => Screens.title(G.progress, input.pad ? input.padId.split('(')[0].trim() : ''),
  resume: () => resume(),
  restart: () => { const s = G.runScore; startStage(G.stageIdx); G.runScore = s; },
  title: () => toTitle(),
  next: () => { G.runScore = G.stageTotal; startStage(G.stageIdx + 1, true); },
  ending: () => { G.runScore = G.stageTotal; G.mode = 'ending'; Screens.ending(G.runScore); },
  bonusBack: () => leaveBonus(),
};
// Browser fullscreen on start, on touch devices, except iPhone / iPad: there Safari watches for
// keyboard input in element fullscreen (a hardware keyboard, or a paired controller that iPadOS
// maps to keys) and keeps showing "it looks like you're typing while in full screen". Add to Home
// Screen gives a true fullscreen app there instead (manifest + apple-mobile-web-app-capable).
const APPLE_TOUCH = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function fullscreen() { if (APPLE_TOUCH || !G.touch || !window.TouchZoomGuard?.enterFullscreen) return; try { window.TouchZoomGuard.enterFullscreen('landscape'); } catch (_) { /* ignore */ } }

$('screen').addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (!b) return;
  audio.unlock();
  audio.play('ui');
  const go = b.dataset.go;
  if (go.startsWith('stage:')) { G.runScore = 0; startStage(+go.slice(6)); fullscreen(); return; }
  if (go.startsWith('opt:')) {
    const [, key, raw] = go.split(':');
    const v = raw === 'true' ? true : raw === 'false' ? false : raw;
    G.settings[key] = v; save(SKEY, G.settings);
    if (key === 'art') { location.reload(); return; }
    applySettings();
    Screens.options(G.settings, G.optionsBack === 'pause' ? 'toPause' : 'back');
    return;
  }
  ACTIONS[go]?.();
});
$('screen').addEventListener('input', (e) => {
  const k = e.target.dataset?.opt;
  if (!k) return;
  G.settings[k] = parseFloat(e.target.value); save(SKEY, G.settings); applySettings();
  const val = e.target.closest('.opt')?.querySelector('.val');
  if (val && k === 'fov') val.textContent = `${G.settings.fov}°`;
});
$('pause-btn').addEventListener('click', () => pause('button'));
$('mute-btn').addEventListener('click', () => { G.muted = !G.muted; applySettings(); $('mute-btn').textContent = G.muted ? '×' : '♪'; });
input.onPause = () => pause('unlock');
input.onKey = (k) => {
  audio.unlock();
  if (k === 'p' || k === 'escape') { if (G.mode === 'play') pause('key'); else if (G.mode === 'paused') resume(); return true; }
  if (k === 'm') { G.muted = !G.muted; applySettings(); return true; }
  if (k === 'enter' && G.mode === 'title') { ACTIONS.play(); return true; }
  return false;
};
input.bindTouch($('touch-zone'));
input.bindButton($('btn-jump'), 'jump');
input.bindButton($('btn-fire'), 'fire');
input.bindButton($('btn-swap'), 'swap');
window.TouchZoomGuard?.init({ onZoomChange: (z) => { if (z) pause('zoom'); } });
window.addEventListener('blur', () => pause('blur'));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause('hidden'); });

// ------------------------------------------------------------------ events → sound, FX, HUD, ECHO, rumble
const PICKUP_TOAST = { health: 'REPAIR +3', healthBig: 'FULL REPAIR', hyper: 'HYPER JUMP!', overdrive: 'OVERDRIVE!', time: 'TIME +5' };
function handleEvents(w) {
  const ev = w.events;
  if (!ev.length) return;
  const P = w.player, wpx = innerWidth, hpx = innerHeight;
  audio.events(ev, (e, r) => e.x === undefined || (e.x - P.x) ** 2 + (e.y - P.y) ** 2 + (e.z - P.z) ** 2 < r * r);
  renderer.onEvents(ev, w);
  for (const a of ach.onEvents(ev, w)) { hud.toast(`★ ${a.name}`, 'gold'); avatar.react('achieve', true); save(PKEY, G.progress); }
  for (const e of ev) {
    switch (e.type) {
      case 'hit': hud.hitmark(); break;
      case 'kill': case 'serverDown': {
        if (e.kind === 'boss' && w.boss) bossBeaten(w.boss.kind);
        hud.hitmark();
        const s = renderer.project(e.x, e.y + 1, e.z, wpx, hpx);
        if (s) hud.floater(s.x, s.y, (e.stomp ? 'STOMP! ' : '') + '+' + e.pts, e.type === 'serverDown' ? '#7bff4a' : null);
        avatar.react(e.stomp ? 'stomp' : e.kind === 'guard' ? 'guard' : 'kill');
        break;
      }
      case 'stomp': input.rumble(0.4, 0.3, 90); avatar.react('stomp'); break;
      case 'drive': hud.toast(`DATA DRIVE ${e.n}/${e.of}`, 'gold'); avatar.react(e.n >= 3 ? 'drive3' : 'drive', e.n >= 3); input.rumble(0.3, 0.6, 160); break;
      case 'exitOpen': setTimeout(() => hud.toast('EXIT OPEN!', ''), 500); break;
      case 'pickup': {
        if (e.kind === 'slowmo') break; // its own toast (slowStart)
        hud.toast(PICKUP_TOAST[e.kind] || WEAPONS[e.kind]?.name || e.kind.toUpperCase(), e.kind.startsWith('health') ? '' : 'gold');
        avatar.react(e.kind.startsWith('health') ? 'health' : WEAPONS[e.kind] ? 'weapon' : 'power');
        break;
      }
      case 'hurt': input.rumble(0.7, 0.9, 220); navigator.vibrate?.(30); avatar.react(e.hp <= 2 ? 'low' : 'hurt'); break;
      case 'zap': avatar.react('zap'); break;
      case 'fall': hud.toast(e.penalty ? `FELL! −${e.penalty}s` : 'FELL! −2', 'red'); avatar.react('fall'); input.rumble(0.5, 0.5, 200); break;
      case 'empty': hud.toast(`${WEAPONS[e.weapon].name} EMPTY`, 'red'); break;
      case 'portal': hud.toast('BONUS PORTAL!', 'mag'); avatar.react('portal', true); G.progress.portals[STAGES[G.stageIdx].id] = true; save(PKEY, G.progress); break;
      case 'explode': input.rumble(0.6, 0.4, 160); break;
      case 'land': if (e.impact > 18) input.rumble(0.25, 0.1, 80); break;
      case 'fire': if (e.weapon === 'rocket') input.rumble(0.3, 0.2, 90); break;
      case 'clear': avatar.react('clear', true); break;
      case 'dead': avatar.react('dead', true); break;
      case 'bonusClear': avatar.react('bonusClear', true); break;
      case 'bonusTimeout': avatar.react('bonusTimeout', true); break;
      case 'bossRoar': hud.toast('IT\u2019S AWAKE!', 'red'); avatar.react('bossStart', true); input.rumble(0.6, 0.3, 400); break; // the intro card and the gauge already name it
      case 'bossTele': avatar.react('bossTele'); break;
      case 'bossCharge': avatar.react('bossCharge'); break;
      case 'bossSlam': input.rumble(1, 0.6, 350); break;
      case 'bossPhase': hud.toast(e.phase === 2 ? 'IT’S CLIMBING THE WALLS!' : 'ENRAGED!', 'red'); avatar.react('bossPhase', true); input.rumble(0.8, 0.5, 300); break;
      case 'bossDying': hud.toast(`${w.level.bossName || 'BOSS'} DOWN!`, 'gold'); avatar.react('bossDown', true); input.rumble(1, 1, 700); break;
      case 'spiked': hud.toast('SPIKES!', 'red'); avatar.react('spiked'); input.rumble(0.5, 0.6, 150); break;
      case 'slowStart': hud.toast('SLOW-MO', ''); avatar.react('slow'); break;
      default: break;
    }
  }
  ev.length = 0;
}

// ------------------------------------------------------------------ the loop
const IDLE = { mx: 0, my: 0, yaw: 0, pitch: 0, jump: false, fire: false, swap: 0 };
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.max(0, Math.min((now - last) / 1000, 0.1)); // clamp both ends (doc 14 #38)
  last = now;
  G.t += dt;
  const edges = input.pollPad(dt);
  if (input.padUsedT > (G.lastTouchT || 0) && !G.padMode) setPadMode(true);
  if (G.mode === 'play') { if (edges.start || edges.view) pause('pad'); }
  else if (G.mode === 'paused' && edges.start) resume();
  else if (G.mode === 'title' && edges.start) ACTIONS.play();
  else if (G.mode !== 'intro') nav.update(edges, input.pad, dt, () => { if (G.mode === 'paused') resume(); });

  const w = G.world;
  if (!w) return;
  let alpha = 1;
  if (G.mode === 'play') {
    G.acc += Math.min(dt, T.DT * T.MAX_STEPS);
    let c = null, n = 0;
    while (G.acc >= T.DT) {
      c = n === 0 ? input.control(dt) : { ...c, jump: false, swap: 0, yaw: 0, pitch: 0 };
      step(w, c); n++;
      G.acc -= T.DT;
      if (w.phase !== 'play' || w.request) break;
    }
    alpha = Math.min(1, G.acc / T.DT);
    handleEvents(w);
    if (w.request === 'bonus') enterBonus();
    else if (w.phase !== 'play' && !G.next) {
      const ph = w.phase;
      G.timer = ph === 'dead' ? 1.6 : 1.3;
      input.enabled = false; input.reset();
      G.next = ph === 'clear' ? stageCleared : ph === 'dead' ? () => { G.mode = 'over'; input.releaseLock(); showControls(); Screens.over(STAGES[G.stageIdx]); } : () => bonusDone(ph === 'bonusClear');
    }
  } else if (G.mode !== 'paused') {
    // the world keeps moving behind cards (cars bob, the result sky spins), the player stays put
    if (w.phase === 'play') { w.t += dt; updatePlats(w.plats, w.t); }
    else step(w, IDLE);
    w.events.length = 0;
  }
  if (G.next) { G.timer -= dt; if (G.timer <= 0) { const f = G.next; G.next = null; f(); } }

  const look = G.mode === 'play' ? input.peekLook() : null;
  renderer.update(G.world, alpha, dt, G.t, look);
  if (G.mode === 'title') renderer.attractCam(G.world, G.t);
  if (G.mode !== 'title') {
    const snap = snapshot(G.world);
    snap.score += G.runScore + (G.main ? G.main.score : 0);
    hud.update(G.world, snap, renderer, innerWidth, innerHeight);
  }
  renderer.render();
  audio.update(dt, G.mode !== 'boot', G.mode === 'paused', G.world.slow > 0 && G.mode === 'play');
  audio.laserHum(!!(G.world.boss && G.world.boss.beam.on && G.mode === 'play'));
  avatar.update(dt, G.mode === 'play');
  // touch stick visual
  if (G.touch && G.mode === 'play') {
    const S = input.stick, st = $('stick'), kn = $('knob');
    st.classList.toggle('on', S.active);
    if (S.active) { st.style.left = S.bx + 'px'; st.style.top = S.by + 'px'; kn.style.transform = `translate(${S.x * 34}px, ${S.y * 34}px)`; }
    else { st.style.left = ''; st.style.top = ''; kn.style.transform = ''; }
  }
}

function resize() { renderer.resize(innerWidth, innerHeight); }
window.addEventListener('resize', resize);
resize();
applySettings();
toTitle();
requestAnimationFrame(frame);

// Debug / test handle (finger-skater's SKATE, the starter's GAME)
window.GAME = {
  G, renderer, input, STAGES,
  state: () => { const w = G.world, P = w.player; return { mode: G.mode, phase: w.phase, stage: w.level.id, drives: w.drivesGot, exitOpen: w.exitOpen, hp: P.hp, x: +P.x.toFixed(2), y: +P.y.toFixed(2), z: +P.z.toFixed(2), score: w.score, enemies: w.enemies.filter((e) => !e.dead).length }; },
  start: (i = 0) => { audio.unlock(); G.runScore = 0; startStage(i); },
  killBoss: () => { const w = G.world, B = w && w.boss; if (B && !B.dead && B.state !== 'dying') bossKind(B).down(w, B); }, // (smoke tests)
  stageIndex: (id) => STAGES.findIndex((s) => s.id === id),
  skipIntro: () => { if (G.next && G.mode === 'intro') { G.timer = 0; } },
  warpTo: (o) => { const P = G.world.player; P.x = P.px = o.x; P.y = P.py = o.y; P.z = P.pz = o.z; P.vx = P.vy = P.vz = 0; },
  look: (yaw, pitch) => { const P = G.world.player; P.yaw = yaw; P.pitch = pitch; },
};
