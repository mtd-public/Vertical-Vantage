// Pack 8 — EGYPT: THE DATA DYNASTY (after NEO EURO, before AIR FORTRESS; a step harder than NEO EURO).
//   1 CAIRO          Neo-Cairo's rooftops at golden hour: the souk, the Citadel's minarets, feluccas over the
//                    Nile, the Cairo Tower's lotus lattice (the exit in its crown). Song: Nile Break.
//   2 DATA PYRAMID   the Great Pyramid as a data centre in a sandstorm: climb its courses past the scanners
//                    to the glass capstone; the Sphinx's sensor mast, a solar tower, the solar barque.
//                    Song: Nile Break.
//   3 INNER SANCTUM  inside it by torchlight: the Grand Gallery, the King's Chamber, the north air shaft up
//                    to the Star Chamber. Song: Tomb Raid.
//   4 HALL OF JUDGMENT  MECHA ANUBIS (js/sim/bosses/anubis.js) by the scales of Ma'at. Song: Weighing of
//                    the Heart.
// Shared pieces: ./egypt-kit.js; looks: js/render/packs/egypt*.js; songs: js/audio/packs/egypt.js.
// Seeds: stages 8001–8004, other rng 8101+. Every id is prefixed egypt-.
import cairo from './egypt-cairo.js';
import pyramid from './egypt-pyramid.js';
import sanctum from './egypt-sanctum.js';
import boss from './egypt-boss.js';

export default { id: 'egypt', name: 'EGYPT', sub: 'THE DATA DYNASTY', color: '#ffc53a', stages: [cairo, pyramid, sanctum, boss] };
