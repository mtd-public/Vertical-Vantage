// OCEAN CORE's songs (notation: js/audio/songs.js and music.js). Two new tracks; COLD AISLE and
// STORM SURGE use the stock night-techno tracks 'netdive' and 'wetware'.
//   tidalBreak  INTAKE: bright Y2K breakcore at sunrise. D-major sevenths and ninths, a bouncing
//               bass, glass-bell hook (sea glass), amen chops → frantic chops → a long breath → drop.
//   krakenOS    BRINE POOL: E-phrygian hard techno × breakcore. Grinding power-chord stabs, a reese
//               rumble, a saw hero hook, and a drop of amen and chop on top of the four-to-the-floor.
import { addSong } from '../music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];
const FOUR = ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k.kk', 'k...k...k...krrr'];

addSong('tidalBreak', {
  name: 'Tidal Break', bpm: 172, lead: 'stab', comp: '..x...x...x..x..', hookVoice: 'glass', bassVoice: 'bounce', bassOct: 0, echo: 0.32,
  chords: [[38, [54, 57, 61, 64]], [35, [54, 57, 61, 62]], [43, [54, 59, 61, 62]], [45, [54, 57, 59, 64]]], // Dmaj9 · Bm9 · Gmaj7♯11 · A6/9
  arp: { seq: [0, 2, 4, 1, 3, 5], oct: 12, every: 1, vol: 0.018 },
  bassLine: '0! . 12 . 0 . 12 0 . 0 12 . 7 . 12 .',
  hook: [
    'F#5 . A5 . D6 - . . C#6 . A5 . F#5 - . .', 'D5 . F#5 . B5 - . . A5 - . . F#5 . E5 .',
    'D5 . G5 . B5 - . . C#6 . B5 . G5 - . .', 'E5 - - . A5 - - . C#6 - . B5 . A5 . .',
    'F#5 . A5 . D6 - . . E6 . D6 . A5 - . .', 'F#5 . B5 . D6 - . . C#6 - . . B5 . A5 .',
    'B5 - . G5 . D5 . . C#6 - . . D6 . E6 .', 'C#6 - - - . . . . . . . . . . . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k.......s.......', 'k.......s.....g.', 'k.......s.......', 'k.......s.k.rrrr'], hats: 'h.h.h.h.h.h.h.h.', noBass: true, noHook: true },
    { name: 'A', bars: 4, reps: 2, drums: AMEN, hats: 'h.h.h.hih.h.h.ho' },
    { name: 'B', bars: 4, reps: 2, drums: CHOP, frantic: true, bassLine: '0! 0 12 0 0! 0 12 0 0! 0 12 0 10 0 7 0',
      hook: ['A5 . D6 . F#6 . D6 . A5 . D6 . E6 . D6 .', 'F#5 . B5 . D6 . B5 . F#5 . B5 . C#6 . B5 .', 'G5 . B5 . D6 . B5 . G5 . C#6 . D6 . C#6 .', 'A5 . C#6 . E6 . C#6 . A5 . E6 . F#6 . E6 .'] },
    { name: 'breakdown', bars: 4, noDrums: true, noBass: true, noArp: true, hats: '........h.......',
      hook: ['F#5 - - - - - - - A5 - - - - - - -', 'D6 - - - - - - - C#6 - - - - - - -', 'B5 - - - - - - - G5 - - - - - - -', 'A5 - - - C#6 - - - E6 - - - - - - -'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], frantic: true, hats: 'h.h.h.hih.h.h.ho' },
  ],
});

addSong('krakenOS', {
  name: 'Kraken OS', bpm: 178, lead: 'darkpad', dark: true, lp: 11000, kick: 'deep', bassVoice: 'reese', bassOct: 0, hookVoice: 'hero', echo: 0.22,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[40, [52, 55, 59, 64]], [41, [53, 57, 60, 65]], [43, [55, 59, 62, 67]], [41, [53, 57, 60, 64]]], // Em · F · G · Fmaj7 (E phrygian)
  arp: { seq: [0, 3, 1, 4, 2], oct: 12, every: 1, vol: 0.016 },
  bassLine: '0! 0 12 0 0! 1^ 0 12 0! 0 12 0 3 0 1 0',
  hook: ['E5 - - - G5 - B5 - - - A5 - G5 - F5 -', 'E5 - - - - - . . B4 - - - E5 - - -', 'F5 - G5 - A5 - C6 - - - B5 - A5 - G5 -', 'F5 - - - E5 - - - D#5 - - - E5 - . .'],
  parts: [
    { name: 'intro', bars: 4, drums: FOUR, hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true, noArp: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, hats: 'm.m.m.m.m.m.m.m.', noHook: true, frantic: true },
    { name: 'B', bars: 4, reps: 2, drums: FOUR, perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'surface', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', frantic: true },
  ],
});

export default null;
