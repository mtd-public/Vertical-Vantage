// Golden traces for engine ports (dr-mow-godot's tools/parity-js.mjs + trace-js.mjs recipe).
// Each stage and bonus arena is driven by a fixed, seeded control script for 40 s of sim time.
// We record a sample every 0.5 s and an FNV-1a hash of the raw float bits of the whole world state
// after every step. A port that steps the same JSON level with the same controls must reproduce
// the samples (and, with fdlibm-exact sin/cos/atan2, the hashes) bit for bit.
//   node tools/golden.mjs           write data/golden/*.json
//   node tools/golden.mjs --check   exit 1 if the sim no longer matches the stored traces
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, BONUS } from '../js/levels/index.js';
import { createWorld, step } from '../js/sim/world.js';
import { T } from '../js/sim/tuning.js';
import { mulberry32 } from '../js/sim/util.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const SECONDS = 40, STEPS = Math.round(SECONDS / T.DT);

// The control script: a pure function of the step index (ports implement the same function).
// Every 0.25 s a new seeded intent: move, turn a little, maybe jump, maybe fire.
export function controlAt(rng, i, prev) {
  if (i % 30 !== 0) return { ...prev, jump: false, swap: 0, yaw: 0, pitch: 0 };
  const r = [rng(), rng(), rng(), rng(), rng(), rng(), rng()];
  return { mx: r[0] * 2 - 1, my: r[1] * 1.4 - 0.4, yaw: (r[2] - 0.5) * 0.25, pitch: (r[3] - 0.5) * 0.08, jump: r[4] < 0.35, fire: r[5] < 0.6, swap: r[6] < 0.04 ? 1 : 0 };
}

// FNV-1a over the float64 bits of the state that matters.
const buf = new DataView(new ArrayBuffer(8));
function fnv(h, x) {
  buf.setFloat64(0, x);
  for (let i = 0; i < 8; i++) { h ^= buf.getUint8(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function stateHash(w, h) {
  const P = w.player;
  for (const v of [P.x, P.y, P.z, P.vx, P.vy, P.vz, P.yaw, P.pitch, P.auto, P.hp, P.cool, w.score, w.drivesGot, w.shots.length, w.bolts.length]) h = fnv(h, v);
  for (const e of w.enemies) { h = fnv(h, e.x); h = fnv(h, e.y); h = fnv(h, e.z); h = fnv(h, e.hp); }
  for (const p of w.plats) if (p.move || p.bob) { h = fnv(h, p.ox); h = fnv(h, p.oy); h = fnv(h, p.oz); }
  return h;
}

function trace(level) {
  const w = createWorld(level), rng = mulberry32(1234);
  let c = { mx: 0, my: 0, yaw: 0, pitch: 0, jump: false, fire: false, swap: 0 }, h = 2166136261, hashes = [];
  const samples = [];
  for (let i = 0; i < STEPS; i++) {
    c = controlAt(rng, i, c);
    step(w, c);
    w.events.length = 0;
    h = stateHash(w, h);
    if ((i + 1) % 60 === 0) {
      const P = w.player;
      samples.push([+(w.t).toFixed(3), P.x, P.y, P.z, P.yaw, P.hp, w.score, w.drivesGot, w.enemies.filter((e) => e.dead).length]);
      hashes.push(h.toString(16).padStart(8, '0'));
    }
    if (w.phase !== 'play') break;
  }
  return { format: 'vertical-vantage.golden/1', level: level.id, dt: T.DT, seconds: SECONDS, controlSeed: 1234, phase: w.phase,
    sampleCols: ['t', 'x', 'y', 'z', 'yaw', 'hp', 'score', 'drives', 'kills'], samples, hashEvery: 60, hashes, final: h.toString(16).padStart(8, '0'), stats: w.stats };
}

let bad = 0;
for (const L of [...STAGES, ...Object.values(BONUS)]) {
  const g = trace(L), file = join(ROOT, `data/golden/${L.id}.json`);
  const text = JSON.stringify(g) + '\n';
  if (check) {
    const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
    // parity: the exported JSON level (what ports load) must replay to the same hash
    const jl = join(ROOT, `data/levels/${L.id}.json`);
    const fromJson = existsSync(jl) ? trace(JSON.parse(readFileSync(jl, 'utf8'))).final : 'missing';
    const ok = old === text && fromJson === g.final;
    if (!ok) bad++;
    console.log(`${ok ? '✓' : '✗'} ${L.id} ${g.final}${fromJson !== g.final ? `  (JSON replay ${fromJson})` : ''}`);
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
    console.log(`wrote data/golden/${L.id}.json  final ${g.final}  phase ${g.phase}  ${g.samples.length} samples`);
  }
}
if (check) { console.log(bad ? `${bad} trace(s) differ — if the change was intended, run node tools/golden.mjs` : 'golden traces match'); process.exit(bad ? 1 : 0); }
