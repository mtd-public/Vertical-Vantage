// Headless smoke test (house habit, from mstr-gme-dsgn-tmpt tools/ and dr-mow tools/smoke.mjs).
//   python3 -m http.server 4180 &   BASE=http://localhost:4180/ node tools/smoke.mjs
// Profiles: desktop (keyboard + mouse), phone portrait + landscape (touch controls), a fake Xbox
// controller, the bonus-portal round trip and a stage clear. Fails on any console error, any page
// scroll, or a flow that doesn't reach its state. Screenshots land in $OUT (default ./shots).
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
const pw = await import('playwright').catch(() => import(join(execSync('npm root -g').toString().trim(), 'playwright', 'index.mjs')));
const { chromium, devices } = pw;
const BASE = process.env.BASE || 'http://localhost:4180/';
const OUT = process.env.OUT || 'shots';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || (process.env.CI ? undefined : '/opt/pw-browsers/chromium'), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
let fails = 0;
const check = (ok, msg) => { console.log(`  ${ok ? '✓' : '✗'} ${msg}`); if (!ok) fails++; };

// A scriptable fake gamepad (standard mapping). window.__pad = { axes: [...], buttons: { 0: 1, 7: 1 } }
const FAKE_PAD = () => {
  window.__pad = { axes: [0, 0, 0, 0], buttons: {} };
  navigator.getGamepads = () => [{
    id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', connected: true, mapping: 'standard', index: 0, timestamp: performance.now(),
    axes: window.__pad.axes.slice(),
    buttons: Array.from({ length: 17 }, (_, i) => { const v = window.__pad.buttons[i] || 0; return { pressed: v > 0.5, value: v, touched: v > 0 }; }),
    vibrationActuator: { playEffect: () => Promise.resolve('complete') },
  }];
};

async function run(name, ctxOpts, act, { pad = false } = {}) {
  console.log(name);
  const ctx = await browser.newContext(ctxOpts);
  if (pad) await ctx.addInitScript(FAKE_PAD);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}-title.png` });
  try { await act(page); } catch (e) { errors.push('script: ' + e.message); }
  const scroll = await page.evaluate(() => ({ x: document.scrollingElement.scrollLeft, y: document.scrollingElement.scrollTop, h: document.scrollingElement.scrollHeight - innerHeight }));
  check(scroll.x === 0 && scroll.y === 0 && scroll.h <= 0, `no page scroll (${JSON.stringify(scroll)})`);
  check(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : ''));
  await ctx.close();
}
const state = (page) => page.evaluate(() => GAME.state());
const skip = async (page) => { await page.waitForTimeout(200); await page.evaluate(() => GAME.skipIntro()); await page.waitForTimeout(250); };

await run('desktop', { viewport: { width: 1280, height: 800 } }, async (page) => {
  await page.click('[data-go="play"]');
  await skip(page);
  check((await state(page)).mode === 'play', 'START begins stage 1');
  const s0 = await state(page);
  await page.keyboard.down('w'); await page.waitForTimeout(600);
  await page.keyboard.press(' '); await page.waitForTimeout(420); await page.keyboard.press(' '); await page.waitForTimeout(420); await page.keyboard.press(' ');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/desktop-air.png` });
  const s1 = await state(page);
  check(s1.z < s0.z - 4 && s1.y > s0.y + 6, `WASD + triple jump moves and climbs (z ${s0.z}→${s1.z}, y ${s0.y}→${s1.y})`);
  const aid = await page.evaluate(() => ({ txt: document.getElementById('drop').textContent, shown: !document.getElementById('drop').classList.contains('hidden'), reticle: GAME.renderer.fx.marker.visible || GAME.renderer.voidAhead, look: GAME.G.world.player.auto }));
  check(aid.shown && /m|GROUND/.test(aid.txt) && aid.reticle && aid.look > 0.3, `in the air: drop readout "${aid.txt}", landing reticle or void warning, auto look-down ${aid.look.toFixed(2)}`);
  await page.keyboard.up('w');
  await page.keyboard.down('j'); await page.waitForTimeout(500); await page.keyboard.up('j');
  check(await page.evaluate(() => GAME.G.world.stats.shots) > 2, 'J fires');
  await page.keyboard.press('p');
  await page.waitForTimeout(200);
  check((await state(page)).mode === 'paused', 'P pauses');
  await page.screenshot({ path: `${OUT}/desktop-pause.png` });
  await page.click('[data-go="resume"]');
  await page.waitForTimeout(200);
  check((await state(page)).mode === 'play', 'RESUME resumes');
  const dc = await page.evaluate(() => GAME.renderer.renderer.info.render.calls);
  console.log(`  draw calls ${dc}`);
  check(dc < 400, 'draw calls under budget');
});

const countFullscreen = (page) => page.evaluate(() => { window.__fs = 0; if (window.TouchZoomGuard) TouchZoomGuard.enterFullscreen = () => { window.__fs++; }; });
for (const [name, dev] of [['phone', devices['iPhone 13']], ['phone-land', devices['iPhone 13 landscape']]]) {
  await run(name, { ...dev }, async (page) => {
    await countFullscreen(page);
    await page.tap('[data-go="play"]');
    check(await page.evaluate(() => window.__fs === 0), 'iPhone / iPad: no element fullscreen (Safari\'s "typing in full screen" banner)');
    await skip(page);
    check(await page.evaluate(() => !document.getElementById('touch-ui').classList.contains('hidden')), 'touch controls shown');
    const s0 = await state(page);
    await page.tap('#btn-jump');
    await page.waitForTimeout(350);
    await page.tap('#btn-jump');
    await page.waitForTimeout(500);
    const s1 = await state(page);
    check(s1.y > s0.y + 2, `JUMP button jumps (y ${s0.y}→${s1.y})`);
    await page.screenshot({ path: `${OUT}/${name}-play.png` });
    await page.tap('#pause-btn');
    await page.waitForTimeout(200);
    check((await state(page)).mode === 'paused', 'pause button pauses');
    await page.screenshot({ path: `${OUT}/${name}-pause.png` });
  });
}

await run('android', { ...devices['Pixel 5'] }, async (page) => {
  await countFullscreen(page);
  await page.tap('[data-go="play"]');
  await skip(page);
  check(await page.evaluate(() => window.__fs === 1), 'Android: START still goes fullscreen');
});

// a phone with a controller paired: the touch controls step aside while it's in use, a tap brings them back
await run('phone-pad', { ...devices['iPhone 13 landscape'] }, async (page) => {
  await page.tap('[data-go="play"]');
  await skip(page);
  const vis = () => page.evaluate(() => ({ ui: !document.getElementById('touch-ui').classList.contains('hidden'), body: document.body.classList.contains('touch') }));
  const v0 = await vis();
  await page.evaluate(() => { window.__pad.buttons[0] = 1; }); await page.waitForTimeout(150); await page.evaluate(() => { window.__pad.buttons[0] = 0; }); await page.waitForTimeout(150);
  const v1 = await vis();
  await page.screenshot({ path: `${OUT}/phone-pad.png` });
  await page.touchscreen.tap(300, 200); await page.waitForTimeout(200);
  const v2 = await vis();
  check(v0.ui && !v1.ui && !v1.body && v2.ui && v2.body, `touch controls: shown → hidden on controller input → back on a tap (${JSON.stringify([v0, v1, v2])})`);
}, { pad: true });

await run('gamepad', { viewport: { width: 1280, height: 720 } }, async (page) => {
  const press = async (b, ms = 120) => { await page.evaluate((b) => { window.__pad.buttons[b] = 1; }, b); await page.waitForTimeout(ms); await page.evaluate((b) => { window.__pad.buttons[b] = 0; }, b); await page.waitForTimeout(80); };
  await press(9); // Menu on the title starts
  await skip(page);
  check((await state(page)).mode === 'play', 'Menu button starts from the title');
  const s0 = await state(page);
  await page.evaluate(() => { window.__pad.axes[1] = -1; window.__pad.axes[2] = 0.6; window.__pad.buttons[7] = 1; });
  await page.waitForTimeout(500);
  await press(0); await page.waitForTimeout(300); await press(4);
  await page.waitForTimeout(400);
  await page.evaluate(() => { window.__pad.axes[1] = 0; window.__pad.axes[2] = 0; window.__pad.buttons[7] = 0; });
  const s1 = await state(page);
  const w = await page.evaluate(() => ({ shots: GAME.G.world.stats.shots, yaw: GAME.G.world.player.yaw }));
  check(Math.hypot(s1.x - s0.x, s1.z - s0.z) > 3, 'left stick moves');
  check(s1.y > s0.y + 1 || w.shots > 0, 'A / LB jump');
  check(w.shots > 2 && Math.abs(w.yaw) > 0.1, `RT fires and right stick turns (shots ${w.shots}, yaw ${w.yaw.toFixed(2)})`);
  await press(9);
  check((await state(page)).mode === 'paused', 'Menu pauses');
  await press(13); await press(0); // D-pad down to RESTART? (menu nav) then A
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/gamepad-menu.png` });
}, { pad: true });

await run('flow', { viewport: { width: 1280, height: 720 } }, async (page) => {
  await page.evaluate(() => GAME.start(1));
  await skip(page);
  // bonus portal round trip
  await page.evaluate(() => { const o = GAME.G.world.portal; GAME.warpTo({ x: o.x, y: o.y - 0.9, z: o.z }); });
  await page.waitForTimeout(400);
  check((await state(page)).stage === 'bonus-skyway', 'the portal opens the bonus stage');
  await skip(page);
  await page.evaluate(() => GAME.look(0, -0.2));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/flow-bonus.png` });
  await page.evaluate(() => { for (const e of GAME.G.world.enemies) { e.hp = 1; const P = GAME.G.world.player; } });
  await page.evaluate(() => { const w = GAME.G.world; for (const e of w.enemies) { e.dead = true; } });
  await page.waitForTimeout(1800);
  check(await page.evaluate(() => !!document.querySelector('[data-go="bonusBack"]')), 'bonus result card');
  await page.screenshot({ path: `${OUT}/flow-bonus-result.png` });
  await page.click('[data-go="bonusBack"]');
  await page.waitForTimeout(300);
  check((await state(page)).stage === 'skyway' && (await state(page)).mode === 'play', 'back in the city after the bonus');
  // collect the drives, walk into the gate
  for (let i = 0; i < 3; i++) { await page.evaluate((i) => { const d = GAME.G.world.drives[i]; GAME.warpTo({ x: d.x, y: d.y - 0.9, z: d.z }); }, i); await page.waitForTimeout(200); }
  check((await state(page)).exitOpen, 'three drives open the exit');
  await page.evaluate(() => { const e = GAME.G.world.exit; GAME.warpTo({ x: e.x + 4, y: e.y, z: e.z + 6 }); GAME.look(0.6, 0.15); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/flow-exit-open.png` });
  await page.evaluate(() => { const e = GAME.G.world.exit; GAME.warpTo({ x: e.x, y: e.y + 0.05, z: e.z + 0.5 }); });
  await page.waitForTimeout(2000);
  check(await page.evaluate(() => !!document.querySelector('[data-go="next"]')), 'stage clear card');
  await page.screenshot({ path: `${OUT}/flow-clear.png` });
  check(await page.evaluate(() => /BEST/.test(document.getElementById('screen').textContent) && !!JSON.parse(localStorage.getItem('vertical-vantage.progress')).bestTime.skyway), 'best time recorded and shown');
  await page.click('[data-go="title"]'); await page.waitForTimeout(250);
  await page.click('[data-go="records"]'); await page.waitForTimeout(250);
  check(await page.evaluate(() => document.querySelectorAll('.ach').length >= 10 && document.querySelectorAll('.ach.on').length >= 1), 'records screen lists achievements (some unlocked)');
  await page.screenshot({ path: `${OUT}/flow-records.png` });
});

await run('boss', { viewport: { width: 1280, height: 720 } }, async (page) => {
  await page.evaluate(() => GAME.start(3));
  await skip(page);
  await page.waitForTimeout(2600);
  const b = await page.evaluate(() => ({ hp: GAME.G.world.boss.hp, state: GAME.G.world.boss.state, bar: !document.getElementById('boss-hud').classList.contains('hidden') }));
  check(b.hp > 0 && b.state !== 'intro' && b.bar, `ARACHNE-9 is up and fighting (${b.state}), boss gauge shown`);
  await page.screenshot({ path: `${OUT}/boss-fight.png` });
  // pin it, aim at it, shoot it down
  await page.evaluate(() => { const B = GAME.G.world.boss, P = GAME.G.world.player; B.hp = 1; B.state = 'recover'; B.timer = 9; P.inv = 99; P.x = 6; P.z = 8; });
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => { const B = GAME.G.world.boss, P = GAME.G.world.player; GAME.look(Math.atan2(-(B.cx - P.x), -(B.cz - P.z)), Math.atan2(B.cy - (P.y + 1.55), Math.hypot(B.cx - P.x, B.cz - P.z))); });
    await page.keyboard.down('j'); await page.waitForTimeout(60);
  }
  await page.keyboard.up('j');
  await page.waitForTimeout(3000);
  const s = await state(page);
  check(s.exitOpen, 'killing the boss opens the exit');
  await page.screenshot({ path: `${OUT}/boss-down.png` });
  await page.evaluate(() => { const e = GAME.G.world.exit; GAME.warpTo({ x: e.x, y: e.y + 0.05, z: e.z }); });
  await page.waitForTimeout(2000);
  const last = await page.evaluate(() => GAME.G.stageIdx === GAME.STAGES.length - 1);
  check(await page.evaluate((last) => !!document.querySelector(last ? '[data-go="ending"]' : '[data-go="next"]'), last), last ? 'the last stage clear leads to the ending' : 'a pack\'s boss clear leads on to the next pack');
});

// every other pack's boss: it wakes and fights with the gauge up, and going down opens the exit
await run('bosses', { viewport: { width: 1280, height: 720 } }, async (page) => {
  const list = await page.evaluate(() => GAME.STAGES.map((s, i) => ({ i, id: s.id, kind: s.boss ? (s.boss.kind || 'arachne') : null })).filter((s) => s.kind && s.kind !== 'arachne'));
  console.log(`  ${list.length} more boss stage(s)`);
  for (const b of list) {
    await page.evaluate((i) => GAME.start(i), b.i);
    await skip(page);
    // wait out the intro (bosses' intros differ: 2-3 s of game time), then give it a moment to act
    await page.waitForFunction(() => GAME.G.world.boss && GAME.G.world.boss.state !== 'intro', null, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(600);
    const st = await page.evaluate(() => ({ hp: GAME.G.world.boss.hp, state: GAME.G.world.boss.state, bar: !document.getElementById('boss-hud').classList.contains('hidden') }));
    check(st.hp > 0 && st.state !== 'intro' && st.bar, `${b.id}: ${b.kind} is up and fighting (${st.state}), gauge shown`);
    await page.screenshot({ path: `${OUT}/boss-${b.kind}.png` });
    await page.evaluate(() => GAME.killBoss());
    await page.waitForTimeout(3200);
    check((await state(page)).exitOpen, `${b.id}: ${b.kind} down → exit open`);
  }
});

await browser.close();
console.log(fails ? `\n${fails} check(s) FAILED` : '\nsmoke OK');
process.exit(fails ? 1 : 0);
