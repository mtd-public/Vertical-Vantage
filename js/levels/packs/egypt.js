// Pack 8 — EGYPT: THE DATA DYNASTY. Neo-Cairo's rooftops at golden hour, the Great Pyramid turned
// data centre in a midday sandstorm, its torch-lit inner sanctum, and MECHA ANUBIS in the Hall of
// Judgment. Stages: ./egypt-*.js
import cairo from './egypt-cairo.js';
import pyramid from './egypt-pyramid.js';
import sanctum from './egypt-sanctum.js';
import boss from './egypt-boss.js';

export default { id: 'egypt', name: 'EGYPT', sub: 'THE DATA DYNASTY', color: '#ffc53a', stages: [cairo, pyramid, sanctum, boss] };
