// Pack 2 — OCEAN CORE: a floating data haven and desalination plant in the open sea. The plant at
// sunrise, the server barges at sunset, the wind farm and the data spine in a night storm, and
// KRAKEN-OS rising out of the brine pool. Each stage lives in its own file (ocean-*.js); the shared
// floating pieces (buoys, pontoons, tanks, pipes, catwalks…) are in ocean-kit.js.
import intake from './ocean-intake.js';
import coldAisle from './ocean-coldaisle.js';
import storm from './ocean-storm.js';
import brinePool from './ocean-boss.js';

export default { id: 'ocean', name: 'OCEAN CORE', sub: 'THE FLOATING DATA HAVEN', color: '#2bd6ff', stages: [intake, coldAisle, storm, brinePool] };
