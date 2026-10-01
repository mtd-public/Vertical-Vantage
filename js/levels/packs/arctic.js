// Pack 9 — ARCTIC VAULT: Svalbard, 2099. The polar night over Longyearbyen, a blizzard on the glacier
// front, the long tunnel into the permafrost where the world's seeds and data are kept, and POLARIS,
// the vault's polar-bear warden, in the cold-storage cavern under the mountain.
import town from './arctic-town.js';
import shelf from './arctic-shelf.js';
import vault from './arctic-vault.js';
import boss from './arctic-boss.js';

export default { id: 'arctic', name: 'ARCTIC VAULT', sub: 'PERMAFROST ARCHIVE', color: '#9ff3ff', stages: [town, shelf, vault, boss] };
