// Pack 5 — SEATTLE: hazy, overcast, drizzly; Mount Rainier looming through the haze.
//   NEEDLE (Seattle Center, grey morning) → PIKE PLACE (the waterfront in the drizzle) →
//   RAINIER RAIN (cranes over downtown at dusk) → ABOVE THE NEEDLE (STORMCROW, in a thunderstorm)
// Data only: each stage lives in its own file (seattle-*.js).
import needle from './seattle-needle.js';
import pike from './seattle-pike.js';
import rainier from './seattle-rainier.js';
import boss from './seattle-boss.js';

export default { id: 'seattle', name: 'SEATTLE', sub: 'EMERALD DRIZZLE', color: '#3ad88a', stages: [needle, pike, rainier, boss] };
