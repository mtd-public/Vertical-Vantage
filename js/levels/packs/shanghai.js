// Pack 6 — SHANGHAI: the Bund at golden dusk, the Pudong supertalls in the smog, the lantern-lit
// old town by night, and the JADE DRAGON round the Pearl Tower. Stages: ./shanghai-*.js
import bund from './shanghai-bund.js';
import pudong from './shanghai-pudong.js';
import lanterns from './shanghai-lanterns.js';
import pearl from './shanghai-pearl.js';

export default {
  id: 'shanghai', name: 'SHANGHAI', sub: 'PEARL OF THE ORIENT', color: '#ff2b5a',
  stages: [bund, pudong, lanterns, pearl],
};
