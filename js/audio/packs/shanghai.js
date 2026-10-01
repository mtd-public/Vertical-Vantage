// Songs for pack SHANGHAI (notation: js/audio/songs.js / music.js). Pentatonic hooks over the house style.
import { addSong } from '../music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];

// THE BUND — Y2K breakcore at golden dusk: lush minor-nine chords, an acid line, a D-minor-pentatonic FM hook.
addSong('bundBreak', {
  name: 'Bund Break', bpm: 170, lead: 'stab', comp: '..x...x...x...x.', hookVoice: 'fm', bassVoice: 'acid', bassOct: 0, echo: 0.28,
  chords: [[38, [53, 57, 60, 64]], [46, [53, 57, 58, 62]], [43, [53, 58, 62, 65]], [45, [55, 60, 64, 67]]], // Dm9 · B♭maj7 · Gm9 · A7sus
  arp: { seq: [0, 2, 1, 3, 4, 2], oct: 12, every: 1, vol: 0.018 },
  bassLine: '0! . 12 . 0 0 12 . 0! . 10 . 7 . 12 10^',
  hook: [
    'D5 . F5 . A5 - . . G5 . F5 . D5 - . .', 'C5 . D5 . F5 - . . A5 - . . G5 . F5 .',
    'D5 . F5 . G5 - . . A5 . C6 . A5 - . .', 'G5 - - . F5 - - . D5 - . C5 . D5 . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k.......s.......', 'k.......s.....g.', 'k.......s.......', 'k.......s.k.rrrr'], hats: 'h.h.h.h.h.h.h.h.', noBass: true, noHook: true },
    { name: 'A', bars: 4, reps: 2, drums: AMEN, hats: 'h.h.h.hih.h.h.ho' },
    { name: 'B', bars: 4, reps: 2, drums: CHOP, frantic: true, hook: ['A5 . C6 . D6 . C6 . A5 . G5 . A5 . C6 .', 'F5 . A5 . C6 . A5 . F5 . D5 . F5 . A5 .', 'G5 . A5 . C6 . D6 . F6 . D6 . C6 . A5 .', 'G5 - - - A5 - - - . . . . . . . .'] },
    { name: 'breakdown', bars: 4, noDrums: true, noBass: true, hats: '........h.......', hook: ['D5 - - - - - - - F5 - - - - - - -', 'A5 - - - - - - - G5 - - - - - - -', 'C6 - - - A5 - - - G5 - - - F5 - - -', 'D5 - - - - - - - . . . . . . . .'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], frantic: true, hats: 'h.h.h.hih.h.h.ho' },
  ],
});

// PEARL TOWER — the JADE DRAGON: hard techno × breakcore, grinding stabs, an E-minor-pentatonic hero hook.
addSong('jadeDragon', {
  name: 'Jade Dragon', bpm: 176, lead: 'darkpad', dark: true, lp: 11000, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'hero', echo: 0.22,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[40, [52, 59, 64, 67]], [36, [48, 55, 60, 64]], [38, [50, 57, 62, 66]], [35, [47, 54, 59, 62]]], // Em · C · D · Bm
  bassLine: '0! 0 12 0 0! 0 12^ 10 0! 0 12 0 7 0 5 3',
  hook: ['E5 - - - G5 - A5 - - - B5 - D6 - B5 -', 'A5 - - - - - . . G5 - - - E5 - - -', 'D5 - E5 - G5 - A5 - - - G5 - E5 - D5 -', 'E5 - - - B4 - - - E5 - - - - - . .'],
  parts: [
    { name: 'intro', bars: 4, drums: ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k...krrr'], hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, hats: 'm.m.m.m.m.m.m.m.', noHook: true, frantic: true },
    { name: 'B', bars: 4, reps: 2, drums: ['k...k...k...k...', 'k...k...k..kk...', 'k...k...k...k.kk', 'k...k...k...krrr'], perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'break', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', frantic: true },
  ],
});

export default null;
