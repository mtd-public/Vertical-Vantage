// Menu and result cards, rendered into #screen. Buttons carry data-go="action"; main.js handles them.
// #screen has data-touch-allow, so normal clicks work there with the touch-zoom guard on.
import { STAGES, PACKS, packOf } from '../levels/index.js';
import { ACHIEVEMENTS } from './achievements.js';

const el = () => document.getElementById('screen');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function show(html, { dim = true } = {}) {
  const s = el();
  s.innerHTML = html;
  s.classList.remove('hidden');
  s.classList.toggle('dim', dim);
}
export function hide() { const s = el(); s.classList.add('hidden'); s.innerHTML = ''; }

const HOW = `
  <div class="how">
    <b>Move</b> WASD · <b>Look</b> mouse (click to lock) or arrows · <b>Jump</b> Space / right-click — press again in the air: <b>triple jump</b><br>
    <b>Fire</b> click / J · <b>Swap</b> Q E / wheel · <b>Pause</b> P / Esc · <b>Mute</b> M<br>
    <b>Xbox pad</b> L-stick move · R-stick look · A or LB jump · RT/RB fire · X/Y swap · Menu pause<br>
    <b>Touch</b> left thumb moves · drag right to look · JUMP · hold FIRE (drag it to aim)<br>
    Stomp enemies by landing on them. Look down to land: the ring shows where you'll come down.
  </div>`;

export function title(progress, padName) {
  show(`<div class="card">
    <div class="jp">垂直 ・ ヴァンテージ</div>
    <div class="logo">VERTICAL<br><span>VANTAGE</span></div>
    <p class="tag">Triple-jump across hover cars and billboards above Neo-Tokyo. Recover 3 data drives, then reach the exit gate.</p>
    <div class="btns">
      <button class="btn primary" data-go="play" data-pad-first>${Object.keys(progress.best || {}).length ? 'CONTINUE' : 'START'}</button>
      <button class="btn" data-go="stages">STAGE SELECT</button>
      <button class="btn" data-go="records">RECORDS</button>
      <button class="btn" data-go="options">OPTIONS</button>
    </div>
    ${HOW}
    ${padName ? `<div class="pad-hint">🎮 ${esc(padName)} connected — D-pad / stick + A to choose</div>` : ''}
    <div class="small-print">All adverts are fictional. No real brands were harmed. Best ${String(progress.bestTotal || 0).padStart(6, '0')}</div>
  </div>`, { dim: false });
}

// Stage select, pack by pack: three stages and the boss stage in each row.
export function stages(progress) {
  let i = 0;
  const packs = PACKS.map((pk, n) => {
    const tiles = pk.stages.map((s, k) => {
      const idx = i++;
      return `<button class="stage ${s.boss ? 'boss' : ''}" data-go="stage:${idx}" title="${esc(s.sub)}" ${idx < progress.unlocked ? '' : 'disabled'}>
      <b>${s.boss ? '☠ ' : `${k + 1}. `}${esc(s.name)}</b><small>${String(progress.best?.[s.id] || 0).padStart(6, '0')} · ${progress.bestTime?.[s.id] ? fmtTime(progress.bestTime[s.id]) : '-:--'} <span class="par">/ PAR ${fmtTime(s.par)}</span></small></button>`;
    }).join('');
    return `<div class="pack" style="--pk:${pk.color || '#2be8ff'}"><div class="pack-h">PACK ${n + 1} · ${esc(pk.name)}</div><div class="stages">${tiles}</div></div>`;
  }).join('');
  show(`<div class="card wide stage-card"><div class="big" style="font-size:30px">STAGE SELECT</div>
    <div class="packs">${packs}</div>
    <div class="btns"><button class="btn" data-go="back">◀ BACK</button></div><div class="more-cue"></div></div>`);
  el().querySelector('.stage-card').addEventListener('scroll', moreCue, { passive: true });
  moreCue(); requestAnimationFrame(moreCue);
}
// A stage list taller than the screen (phones, tablets): say so at the bottom until you've scrolled there.
function moreCue() {
  const c = el().querySelector('.stage-card');
  if (c) c.classList.toggle('more', c.scrollTop + c.clientHeight < c.scrollHeight - 8);
}
addEventListener('resize', moreCue, { passive: true });

// Records: best time / score per stage, best bonus rounds, and the achievement wall.
export function records(progress) {
  const rows = STAGES.map((s) => `<div class="row"><span>${esc(s.name)}</span><b>${progress.bestTime?.[s.id] ? fmtTime(progress.bestTime[s.id]) : '-:--'} <small class="par">par ${fmtTime(s.par)}</small> · ${String(progress.best?.[s.id] || 0).padStart(6, '0')}</b></div>`).join('');
  const bonus = Object.entries(progress.bonusBest || {}).map(([id, b]) => `<div class="row"><span>${esc(id.replace('bonus-', 'SERVER CORE · ').toUpperCase())}</span><b>${b.down}/${b.total}${b.left ? ` · ${b.left}s left` : ''}</b></div>`).join('');
  const got = progress.ach || {}, n = ACHIEVEMENTS.filter((a) => got[a.id]).length;
  const wall = ACHIEVEMENTS.map((a) => `<div class="ach ${got[a.id] ? 'on' : ''}"><b>${got[a.id] ? '★' : '☆'} ${esc(a.name)}</b><small>${esc(a.desc)}</small></div>`).join('');
  show(`<div class="card"><div class="big" style="font-size:30px">RECORDS</div>
    <div class="result">${rows}${bonus}<div class="row"><span>BEST RUN</span><b>${String(progress.bestTotal || 0).padStart(6, '0')}</b></div></div>
    <div class="opt-h">ACHIEVEMENTS ${n}/${ACHIEVEMENTS.length}</div>
    <div class="achs">${wall}</div>
    <div class="btns"><button class="btn" data-go="back" data-pad-first>◀ BACK</button></div></div>`);
}

export function options(S, back = 'back') {
  const seg = (key, vals) => `<div class="seg">${vals.map(([v, l]) => `<button data-go="opt:${key}:${v}" class="${String(S[key]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const range = (key, min, max, step) => `<input type="range" min="${min}" max="${max}" step="${step}" value="${S[key]}" data-opt="${key}">`;
  const head = (t) => `<div class="opt-h">${t}</div>`;
  show(`<div class="card"><div class="big" style="font-size:30px">OPTIONS</div>
    <div class="opts">
      ${head('CONTROLS')}
      <div class="opt"><span>Look: mouse</span>${range('mouseSens', 0.3, 3, 0.05)}</div>
      <div class="opt"><span>Look: controller</span>${range('padSens', 0.3, 3, 0.05)}</div>
      <div class="opt"><span>Look: touch</span>${range('touchSens', 0.3, 3, 0.05)}</div>
      <div class="opt"><span>Invert Y</span>${seg('invertY', [[false, 'OFF'], [true, 'ON']])}</div>
      <div class="opt"><span>Auto look-down (Jumping Flash)</span>${seg('autoLook', [[true, 'ON'], [false, 'OFF']])}</div>
      <div class="opt"><span>Fire (touch FIRE / trigger)</span>${seg('fireLatch', [[false, 'HOLD'], [true, 'TAP ON/OFF']])}</div>
      <div class="opt"><span>Touch controls <small class="par">(AUTO hides them while a controller is in use)</small></span>${seg('touch', [['auto', 'AUTO'], ['on', 'ON'], ['off', 'OFF']])}</div>
      ${head('VIEW + COMFORT')}
      <div class="opt"><span>Field of view <b class="val">${S.fov}°</b></span>${range('fov', 80, 110, 1)}</div>
      <div class="opt"><span>Screen shake, bob + gun sway</span>${seg('calm', [[false, 'ON'], [true, 'OFF']])}</div>
      <div class="opt"><span>Flashes (hits, sunburst, beams)</span>${seg('lowFlash', [[false, 'FULL'], [true, 'REDUCED']])}</div>
      <div class="opt"><span>Arm cannon</span>${seg('cannon', [[true, 'SHOW'], [false, 'HIDE']])}</div>
      <div class="opt"><span>AI quips (speech bubble)</span>${seg('quips', [[false, 'OFF'], [true, 'ON']])}</div>
      ${head('AUDIO')}
      <div class="opt"><span>Music volume</span>${range('musicVol', 0, 1, 0.05)}</div>
      <div class="opt"><span>Sound volume</span>${range('sfxVol', 0, 1, 0.05)}</div>
      ${head('GRAPHICS')}
      <div class="opt"><span>Quality (particles, rain, sky)</span>${seg('quality', [['auto', 'AUTO'], ['low', 'LOW'], ['med', 'MED'], ['high', 'HIGH']])}</div>
      <div class="opt"><span>Resolution (reloads)</span>${seg('art', [['retro', '240p'], ['hd', '400p'], ['smooth', 'SMOOTH']])}</div>
      <div class="opt"><span>PS1 vertex wobble (reloads)</span>${seg('wobble', [[false, 'OFF'], [true, 'ON']])}</div>
    </div>
    <div class="btns"><button class="btn" data-go="${back}">◀ BACK</button></div></div>`);
}

export function pause() {
  show(`<div class="card"><div class="big" style="font-size:34px">PAUSED</div>
    <div class="btns">
      <button class="btn primary" data-go="resume" data-pad-first>RESUME</button>
      <button class="btn" data-go="restart">RESTART STAGE</button>
      <button class="btn" data-go="pauseOptions">OPTIONS</button>
      <button class="btn" data-go="title">QUIT TO TITLE</button>
    </div>${HOW}</div>`);
}

export function intro(stage, i, bonus = false) {
  const pk = bonus ? null : packOf(stage);
  show(`<div class="intro">
    <div class="sub">${bonus ? 'BONUS STAGE' : `${esc(pk.name)} · ${stage.boss ? 'BOSS' : `STAGE ${stage.packIdx + 1}`}`}</div>
    <div class="big ${bonus ? 'mag' : ''}">${esc(stage.name)}</div>
    <div class="sub">${esc(stage.sub)}</div>
    <div class="sub" style="margin-top:10px;color:#fff">${bonus ? 'DESTROY EVERY SERVER IN 30 SECONDS' : stage.boss ? `DESTROY ${esc(stage.bossName || 'THE BOSS')}` : 'RECOVER 3 DATA DRIVES · REACH THE EXIT'}</div>
  </div>`, { dim: false });
}

const gotList = (got) => (got?.length ? `<div class="got">${got.map((a) => `<div>★ ${esc(a.name)} <small>${esc(a.desc)}</small></div>`).join('')}</div>` : '');

export function clear(stage, i, w, total, last, rec = {}) {
  const c = w.clear, pk = packOf(stage), packDone = !!stage.boss;
  show(`<div class="card"><div class="sub" style="letter-spacing:.3em;color:#2be8ff">${esc(pk.name)} · ${esc(stage.name)}</div>
    <div class="big">${packDone ? 'PACK CLEAR!' : 'STAGE CLEAR!'}</div>
    <div class="result">
      <div class="row"><span>TIME${rec.record ? ' <i class="rec">NEW RECORD!</i>' : ''}</span><b>${fmtTime(c.time)}</b></div>
      <div class="row"><span>BEST · PAR</span><b>${rec.best ? fmtTime(rec.best) : '-:--'} · ${fmtTime(rec.par || stage.par)}</b></div>
      <div class="row"><span>TIME BONUS</span><b>+${c.timeBonus}</b></div>
      <div class="row"><span>INTEGRITY BONUS</span><b>+${c.hpBonus}</b></div>
      <div class="row"><span>ENEMIES</span><b>${w.stats.kills} (${w.stats.stomps} stomped)</b></div>
      <div class="row"><span>SCORE</span><b>${String(total).padStart(6, '0')}</b></div>
    </div>
    ${gotList(rec.got)}
    <div class="btns">
      <button class="btn primary" data-go="${last ? 'ending' : 'next'}" data-pad-first>${last ? 'FINISH' : packDone ? 'NEXT PACK ▶' : 'NEXT STAGE ▶'}</button>
      <button class="btn" data-go="title">TITLE</button>
    </div></div>`);
}

export function bonusResult(w, ok, rec = {}) {
  show(`<div class="card"><div class="big mag">${ok ? 'ALL SERVERS DOWN!' : 'TIME UP!'}</div>
    <div class="result">
      <div class="row"><span>SERVERS</span><b>${w.bonus.down}/${w.bonus.total}</b></div>
      ${ok ? `<div class="row"><span>CLEAR BONUS</span><b>+${w.clear.bonus}</b></div><div class="row"><span>REWARD</span><b>FULL INTEGRITY</b></div>` : ''}
      <div class="row"><span>BONUS SCORE</span><b>+${w.score}</b></div>
      ${rec.best ? `<div class="row"><span>BEST${rec.record ? ' <i class="rec">NEW RECORD!</i>' : ''}</span><b>${rec.best.down}/${rec.best.total}${rec.best.left ? ` · ${rec.best.left}s left` : ''}</b></div>` : ''}
    </div>
    ${gotList(rec.got)}
    <div class="btns"><button class="btn primary" data-go="bonusBack" data-pad-first>BACK TO THE CITY ▶</button></div></div>`);
}

export function over(stage) {
  show(`<div class="card"><div class="big red">SHELL OFFLINE</div>
    <p class="tag">${esc(stage.name)} — the city wins this round.</p>
    <div class="btns">
      <button class="btn primary" data-go="restart" data-pad-first>RETRY STAGE</button>
      <button class="btn" data-go="title">TITLE</button>
    </div></div>`);
}

export function ending(total) {
  show(`<div class="card"><div class="logo" style="font-size:44px">ALL DATA<br><span>RECOVERED</span></div>
    <p class="tag">${PACKS.length > 1 ? 'From Neo-Tokyo to the air fortress, every' : 'Neo-Tokyo\'s'} secret is safe in your little robot hands. OmniCorp has been notified (they already knew).</p>
    <div class="result"><div class="row"><span>FINAL SCORE</span><b>${String(total).padStart(6, '0')}</b></div></div>
    <div class="btns"><button class="btn primary" data-go="title" data-pad-first>TITLE</button></div></div>`);
}
