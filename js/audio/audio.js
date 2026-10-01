// Game audio: dr-mow's synth (sfx-synth.js) and procedural music (music.js), plus this game's
// sound vocabulary and the event → sound table. No sample files.
import { Sfx, SFX } from './sfx-synth.js';
import { Music } from './music.js';
import { STAGE_SONG } from './songs.js';
export { STAGE_SONG };

Object.assign(SFX, {
  blaster: (s) => { s.tone(980, 0.07, 'square', 0.03, -620); s.burst(0.05, 3200, { q: 3, vol: 0.04, f1: 900 }); },
  spread: (s) => { s.burst(0.16, 1600, { q: 1, vol: 0.16, f1: 280 }); s.tone(200, 0.12, 'sawtooth', 0.06, -110); },
  rapid: (s) => s.tone(1250, 0.045, 'square', 0.022, -650),
  rocket: (s) => { s.burst(0.4, 280, { q: 2, vol: 0.12, f1: 1900 }); s.tone(140, 0.3, 'sawtooth', 0.05, 90); },
  jump0: (s) => s.tone(300, 0.2, 'triangle', 0.07, 380), // Jumping Flash: each stage boings higher
  jump1: (s) => { s.tone(420, 0.24, 'triangle', 0.07, 620); s.tone(840, 0.12, 'sine', 0.03, 300, 0.05); },
  jump2: (s) => { s.tone(540, 0.3, 'triangle', 0.08, 900); s.arp([1047, 1319, 1568], 0.04, 0.1, 'sine', 0.03); },
  stomp: (s) => { s.tone(180, 0.15, 'square', 0.1, -90); s.burst(0.12, 900, { vol: 0.25 }); s.tone(660, 0.12, 'triangle', 0.06, 500, 0.05); },
  enemyHit: (s) => { s.tone(760, 0.05, 'square', 0.04, -320); s.burst(0.05, 2400, { q: 3, vol: 0.05 }); },
  kill: (s) => { s.burst(0.45, 1300, { type: 'lowpass', vol: 0.3, f1: 70 }); s.tone(110, 0.35, 'sine', 0.2, -60); s.tone(880, 0.08, 'square', 0.03, 400, 0.04); },
  serverDown: (s) => { s.burst(0.5, 1600, { type: 'lowpass', vol: 0.3, f1: 80 }); s.arp([1319, 988, 1568], 0.04, 0.08, 'square', 0.035); },
  drive: (s) => { s.arp([784, 988, 1175, 1568, 1976], 0.07, 0.2, 'triangle', 0.09); s.tone(2637, 0.5, 'sine', 0.03, 0, 0.35); },
  exitOpen: (s) => { s.arp([392, 523, 659, 784, 1047, 1319], 0.08, 0.22, 'square', 0.05); s.tone(80, 1.4, 'sawtooth', 0.08, 300); },
  health: (s) => s.arp([523, 784, 1047], 0.05, 0.12, 'sine', 0.08),
  weapon: (s) => { s.tone(220, 0.08, 'square', 0.06, 0); s.arp([440, 660, 880], 0.04, 0.08, 'square', 0.04); },
  powerup: (s) => s.arp([523, 659, 784, 1047, 1319, 1568], 0.045, 0.1, 'triangle', 0.08),
  time: (s) => s.arp([1047, 1319, 1568, 2093], 0.04, 0.1, 'square', 0.04),
  laserOn: (s) => s.tone(1700, 0.09, 'sawtooth', 0.016, -900),
  zap: (s) => { s.burst(0.22, 4200, { q: 4, vol: 0.12 }); s.tone(110, 0.22, 'sawtooth', 0.1, 40); },
  aim: (s) => s.tone(1500, 0.3, 'sine', 0.025, 300),
  tele: (s) => s.tone(520, 0.35, 'square', 0.02, 700),
  empty: (s) => s.tone(200, 0.08, 'square', 0.04, -50),
  swap: (s) => s.tone(520, 0.05, 'triangle', 0.04, 260),
  fall: (s) => s.tone(700, 0.7, 'sine', 0.06, -560),
  bonusGo: (s) => { s.arp([523, 659, 784, 1047], 0.06, 0.14, 'square', 0.06); s.tone(1568, 0.5, 'triangle', 0.04, 0, 0.25); },
  bonusClear: (s) => s.arp([523, 659, 784, 1047, 1319, 1568, 2093], 0.07, 0.18, 'square', 0.06),
  stageClear: (s) => { s.arp([392, 523, 659, 784, 1047], 0.1, 0.2, 'square', 0.06); s.arp([784, 1047, 1319, 1568], 0.1, 0.3, 'triangle', 0.05); },
  // ARACHNE-9
  bossRoar: (s) => { s.tone(70, 1.1, 'sawtooth', 0.16, -30); s.tone(105, 0.9, 'square', 0.06, -50, 0.05); s.burst(1.0, 400, { type: 'lowpass', vol: 0.25, f1: 90 }); },
  bossTele: (s) => { s.tone(220, 0.35, 'sawtooth', 0.08, 440); s.burst(0.3, 3000, { q: 3, vol: 0.06, f1: 6000 }); },
  bossLeap: (s) => { s.burst(0.5, 300, { q: 1, vol: 0.2, f1: 2400 }); s.tone(90, 0.4, 'sawtooth', 0.08, 120); },
  bossSlam: (s) => { s.burst(1.2, 900, { type: 'lowpass', vol: 0.5, f1: 40 }); s.tone(55, 1.0, 'sine', 0.4, -30); s.tone(200, 0.2, 'square', 0.06, -150); },
  bossCharge: (s) => { s.tone(180, 1.0, 'sawtooth', 0.05, 1400); s.tone(360, 1.0, 'square', 0.025, 2800); },
  bossLaser: (s) => { s.tone(1400, 0.15, 'sawtooth', 0.06, -900); s.burst(0.3, 5000, { q: 5, vol: 0.1, f1: 2000 }); },
  bossCeil: (s) => { s.tone(300, 0.12, 'square', 0.06, -120); s.tone(240, 0.12, 'square', 0.06, -100, 0.15); },
  bossPhase: (s) => { s.tone(60, 1.4, 'sawtooth', 0.18, -20); s.burst(1.2, 600, { type: 'lowpass', vol: 0.3, f1: 60 }); s.arp([880, 660, 440], 0.12, 0.2, 'square', 0.04); },
  bossDying: (s) => [0, 0.25, 0.5, 0.75, 1.0].forEach((d) => { s.tone(980, 0.12, 'square', 0.05, -200, d); }),
  spiked: (s) => { s.tone(240, 0.2, 'sawtooth', 0.1, -160); s.tone(2400, 0.06, 'square', 0.04); },
});

// Event → sound. Returns the sfx name (or null).
const EVENT_SFX = {
  jump: (e) => 'jump' + e.stage, land: (e) => (e.impact > 14 ? 'land' : null), bonk: () => 'bonk',
  fire: (e) => e.weapon, empty: () => 'empty', swap: () => 'swap',
  hit: () => 'enemyHit', kill: () => 'kill', serverDown: () => 'serverDown', explode: () => 'boom', stomp: () => 'stomp',
  hurt: () => 'hurt', zap: () => 'zap', fall: () => 'fall', dead: () => 'gameOver',
  drive: () => 'drive', exitOpen: () => 'exitOpen', portal: () => 'portal', clear: () => 'stageClear', bonusClear: () => 'bonusClear', bonusTimeout: () => 'fail',
  pickup: (e) => (e.kind === 'health' || e.kind === 'healthBig' ? 'health' : e.kind === 'time' ? 'time' : e.kind === 'hyper' || e.kind === 'overdrive' ? 'powerup' : 'weapon'),
  enemyFire: () => 'enemyShot', aim: () => 'aim', tele: () => 'tele', laserOn: () => 'laserOn',
  bossRoar: () => 'bossRoar', bossTele: () => 'bossTele', bossLeap: () => 'bossLeap', bossSlam: () => 'bossSlam', bossCharge: () => 'bossCharge',
  bossLaser: () => 'bossLaser', bossCeil: () => 'bossCeil', bossPhase: () => 'bossPhase', bossDying: () => 'bossDying', spiked: () => 'spiked',
  slowStart: () => 'slowIn', slowEnd: () => 'slowOut',
};

export class Audio {
  constructor() {
    this.sfx = new Sfx({ volume: 0.75 });
    this.music = new Music(this.sfx);
    this.song = STAGE_SONG.menu;
    this.musicOn = true;
  }
  unlock() { this.sfx.unlock(); }
  setMuted(m) { this.sfx.setMuted(m); }
  setMusic(on) { this.musicOn = on; this.music.setEnabled(on); }
  // Options: music and sound-effect levels, 0..1 (0 = off; music stops scheduling notes)
  setVolumes(music, sfx) { this.music.setVolume(music); this.setMusic(music > 0); this.sfx.setFxVolume(sfx); }
  play(name) { this.sfx.play(name); }
  // Lasers and enemy noises only when near, so a stage full of curtains isn't a wall of beeps.
  events(list, near) {
    for (const e of list) {
      const f = EVENT_SFX[e.type];
      if (!f) continue;
      if ((e.type === 'laserOn' || e.type === 'aim' || e.type === 'tele' || (e.type === 'enemyFire' && e.from !== 'boss')) && !near(e, 30)) continue;
      const n = f(e);
      if (n) this.sfx.play(n);
    }
  }
  update(dt, playing, paused, slow = false) { this.music.update(dt, { song: this.song, playing: playing && this.musicOn, paused, slow }); }
  // the boss laser's hum: a looped narrow-band scrape while the beam is on
  laserHum(on) { this.sfx.setScrape(on); }
}
