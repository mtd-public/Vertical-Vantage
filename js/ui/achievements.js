// Meta progression: achievements, read from the sim's event stream (no rules live here).
// The adapter feeds it every event list plus the stage-clear / bonus-result moments; it returns the
// ones that just unlocked so the HUD can toast them and ECHO can react. State is saved by main.js
// in the progress blob (localStorage, wrapped in try/catch there).

export const ACHIEVEMENTS = [
  { id: 'chain5', name: 'CLOUD WALKER', desc: 'Stomp 5 enemies in a row without landing' },
  { id: 'untouched', name: 'UNTOUCHED', desc: 'Clear a stage without taking damage' },
  { id: 'underPar', name: 'EXPRESS DELIVERY', desc: 'Clear a stage under its par time' },
  { id: 'pacifist', name: 'PACIFIST PROTOCOL', desc: 'Clear a stage without firing a shot' },
  { id: 'portals', name: 'BACKDOOR ACCESS', desc: 'Find every bonus portal' },
  { id: 'bonus', name: 'SERVER FARM FIRE', desc: 'Clear a bonus round' },
  { id: 'bonusFast', name: 'SPEEDRUN.EXE', desc: 'Clear a bonus round with 10 s to spare' },
  { id: 'highRise', name: 'STRATOSPHERE', desc: 'Land on something 80 m up' },
  { id: 'slowStomp', name: 'BULLET-TIME BOOT', desc: 'Stomp an enemy in slow-mo' },
  { id: 'bossStomp', name: 'BOOT TO THE HEAD', desc: 'Stomp a boss five times in one fight' },
  { id: 'boss', name: 'PEST CONTROL', desc: 'Defeat a boss' },
  { id: 'bossAll', name: 'BOSS RUSH', desc: 'Defeat every boss in every pack' },
  { id: 'allClear', name: 'VANTAGE POINT', desc: 'Clear the final stage' },
];

export class Achievements {
  constructor(store, portalStages) {
    this.got = store; // { id: unix ms }
    this.portalStages = portalStages; // ids of the stages that hide a bonus portal
    this.resetStage();
  }

  has(id) { return !!this.got[id]; }
  // Unlock by id from outside (returns the achievement if it's new, else null).
  grant(id) { const out = []; this.unlock(id, out); return out[0] || null; }

  // per stage attempt (the bonus round counts as part of its stage)
  resetStage() { this.chain = 0; this.hurt = 0; this.bossStomps = 0; }

  unlock(id, out) {
    if (this.got[id]) return;
    this.got[id] = Date.now();
    out.push(ACHIEVEMENTS.find((a) => a.id === id));
  }

  // events: one step batch from the sim. w: the world they came from.
  onEvents(events, w, out = []) {
    for (const e of events) {
      switch (e.type) {
        case 'stomp':
          if (++this.chain >= 5) this.unlock('chain5', out);
          if (w.slow > 0) this.unlock('slowStomp', out);
          if (e.kind === 'boss' && ++this.bossStomps >= 5) this.unlock('bossStomp', out);
          break;
        case 'land':
          this.chain = 0;
          if (e.y >= 80) this.unlock('highRise', out);
          break;
        case 'hurt': case 'fall': this.hurt++; break;
        case 'kill': if (e.kind === 'boss') this.unlock('boss', out); break;
        default: break;
      }
    }
    return out;
  }

  // a main stage just cleared. portalsFound: { stageId: true } across saves.
  onClear(w, stage, portalsFound, out = []) {
    if (!this.hurt) this.unlock('untouched', out);
    if (stage.par && w.clear.time <= stage.par) this.unlock('underPar', out);
    if (!w.stats.shots) this.unlock('pacifist', out);
    if (this.portalStages.every((id) => portalsFound[id])) this.unlock('portals', out);
    return out;
  }

  onBonus(w, ok, out = []) {
    if (ok) this.unlock('bonus', out);
    if (ok && w.clear.secs >= 10) this.unlock('bonusFast', out);
    return out;
  }

  onEnding(out = []) { this.unlock('allClear', out); return out; }
}
