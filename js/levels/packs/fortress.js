// The final pack — AIR FORTRESS: a flying-wing helicarrier the size of a city district, 12 km up
// over a sea of cloud. Its flight deck at sunrise, under its wing at sunset, its bomb bay at night,
// and DREADNOUGHT, the armoured command core on top of the bridge tower. Pure data.
import deck from './fortress-deck.js';
import hull from './fortress-hull.js';
import bay from './fortress-bay.js';
import boss from './fortress-boss.js';

export default { id: 'fortress', name: 'AIR FORTRESS', sub: 'THE FINAL ASCENT', color: '#b45bff', stages: [deck, hull, bay, boss] };
