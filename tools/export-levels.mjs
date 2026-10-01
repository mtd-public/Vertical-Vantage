// Export every stage, bonus arena and the tuning tables as plain JSON for engine ports
// (dr-mow-godot's tools/export-levels.mjs did the same: ports read data/, never the JS).
//   node tools/export-levels.mjs           write data/levels/*.json and data/tuning.json
//   node tools/export-levels.mjs --check   exit 1 if data/ is stale (CI runs this)
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, BONUS, PACKS } from '../js/levels/index.js';
import { BOSS_KINDS } from '../js/sim/bosses/index.js';
import { T, WEAPONS, WEAPON_ORDER, OVERDRIVE_RATE, ENEMIES, ENEMY_BOLT, BOSS } from '../js/sim/tuning.js';
import { LASER } from '../js/sim/hazards.js';
import { DEEP, CARS, CONT } from '../js/levels/kit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
let stale = 0;

// Full double precision (JSON round-trips doubles exactly): a port stepping the JSON reproduces the
// golden traces bit for bit (tools/golden.mjs --check replays them from these files). Infinity → "Infinity".
const clean = (v) => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'number' && !Number.isFinite(x) ? (x > 0 ? 'Infinity' : '-Infinity') : x)));

function out(rel, data) {
  const file = join(ROOT, rel), text = JSON.stringify(clean(data), null, 1) + '\n';
  if (check) {
    const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (old !== text) { console.log(`stale: ${rel}`); stale++; }
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
  console.log(`wrote ${rel}`);
}

const level = (L) => ({
  format: 'vertical-vantage.level/1',
  id: L.id, name: L.name, sub: L.sub, theme: L.theme, music: L.song || L.music, seed: L.seed, par: L.par ?? null,
  pack: L.pack ?? null, packIdx: L.packIdx ?? null,
  bonus: !!L.bonus, time: L.time ?? null, killY: L.killY, water: L.water ?? null,
  start: L.start,
  plats: L.plats.map((p) => ({ kind: p.kind, style: p.style, x: p.x, z: p.z, h: p.h, thick: p.thick, w: p.w ?? 0, d: p.d ?? 0, r: p.r ?? 0, yaw: p.yaw || 0, tint: p.tint ?? -1, move: p.move || null, bob: p.bob || null })),
  objective: L.objective || 'drives', arena: L.arena || null, boss: L.boss || null, bossName: L.bossName || null,
  drives: L.drives || [], exit: L.exit || null, portal: L.portal || null,
  enemies: L.enemies || [], servers: L.servers || [], pickups: L.pickups || [], lasers: L.lasers || [],
});

for (const s of STAGES) out(`data/levels/${s.id}.json`, level(s));
for (const k in BONUS) out(`data/levels/${BONUS[k].id}.json`, level(BONUS[k]));
out('data/levels/index.json', { packs: PACKS.map((p) => ({ id: p.id, name: p.name, stages: p.stages.map((s) => s.id) })), stages: STAGES.map((s) => s.id), bonus: Object.fromEntries(Object.entries(BONUS).map(([k, b]) => [k, b.id])) });
// BOSSES: every boss kind's own tuning table (a boss module's `tuning`); BOSS stays ARACHNE-9's.
const BOSSES = Object.fromEntries(Object.entries(BOSS_KINDS).filter(([k, v]) => v.tuning).map(([k, v]) => [k, v.tuning]));
out('data/tuning.json', { format: 'vertical-vantage.tuning/1', T, WEAPONS, WEAPON_ORDER, OVERDRIVE_RATE, ENEMIES, ENEMY_BOLT, BOSS, BOSSES, LASER, kit: { DEEP, CARS, CONT } });

if (check) { console.log(stale ? `${stale} file(s) stale: run node tools/export-levels.mjs` : 'data/ is up to date'); process.exit(stale ? 1 : 0); }
