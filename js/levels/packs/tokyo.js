// Pack 1 — NEO-TOKYO: the docks by day, the rooftops, the neon rain, and ARACHNE-9's warehouse.
import docks from '../docks.js';
import skyway from '../city-day.js';
import neon from '../city-night.js';
import warehouse from '../warehouse.js';

export default { id: 'tokyo', name: 'NEO-TOKYO', sub: 'DOCKS · SKYWAY · NEON RAIN · WAREHOUSE 13', color: '#ff2bd6', stages: [docks, skyway, neon, warehouse] };
