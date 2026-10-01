// Songs for pack 'euro' (NEO EURO). House style: breakcore / Y2K / hard techno in multi-section `parts`
// (see js/audio/songs.js for the notation). Stages pick them by name (stage.song).
import { addSong } from '../music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];
const FLOOR = ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k.k.rrrr'];

// Pisa / Amalfi — "Grand Tour": Eurobeat × breakcore. Four-on-the-floor with offbeat open hats and an
// octave-bouncing bass (Italo-disco), then amen chops under the same supersaw hook. B minor.
addSong('grandTour', {
  name: 'Grand Tour', bpm: 158, lead: 'stab', comp: '..x...x...x...x.', hookVoice: 'hero', bassVoice: 'bounce', bassOct: 0, echo: 0.26,
  chords: [[47, [54, 57, 62, 66]], [43, [55, 59, 62, 66]], [45, [57, 61, 64, 69]], [42, [54, 57, 61, 64]]], // Bm7 · Gmaj7 · A · F♯m7
  arp: { seq: [0, 2, 1, 3, 2, 4], oct: 12, every: 1, vol: 0.017 },
  bassLine: '0 12 0 12 0 12 0 12 0 12 0 12 0 12 0 12',
  hook: [
    'B5 - - . A5 - F#5 - . D5 - E5 - F#5 - .', 'G5 - - . F#5 - D5 - . B4 - D5 - E5 - .',
    'E5 - - . C#5 - E5 - . A5 - G5 - F#5 - E5', 'F#5 - - - - - . . C#5 - E5 - F#5 - A5 -',
    'B5 - - . D6 - C#6 - B5 - A5 - F#5 - . .', 'G5 - A5 - B5 - - . D6 - - . B5 - A5 -',
    'A5 - - . C#6 - - . E6 - - . C#6 - A5 -', 'F#5 - - - - - - - . . . . . . . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: FLOOR, hats: '..o...o...o...o.', noBass: true, noHook: true, noPad: true },
    { name: 'A', bars: 4, reps: 2, drums: FLOOR, perc: '....c.......c...', hats: '..o...o...o...o.' },
    { name: 'B', bars: 4, reps: 2, drums: AMEN, hats: 'h.h.h.hih.h.h.ho', frantic: true, bassLine: '0! . 12 . 0 0 12 . 0! . 12 . 10 . 7 12^',
      hook: ['F#6 - D6 - B5 - D6 - F#6 - D6 - B5 - A5 -', 'G5 - B5 - D6 - B5 - G5 - B5 - D6 - E6 -', 'E6 - C#6 - A5 - C#6 - E6 - F#6 - E6 - C#6 -', 'F#5 - A5 - C#6 - E6 - F#6 - - - . . . .'] },
    { name: 'breakdown', bars: 4, noDrums: true, noBass: true, hats: '........h.......',
      hook: ['B5 - - - - - - - F#5 - - - - - - -', 'G5 - - - - - - - D6 - - - - - - -', 'C#6 - - - - - - - A5 - - - - - - -', 'F#5 - - - - - - - . . . . . . . .'] },
    { name: 'drop', bars: 4, reps: 2, drums: [FLOOR[0], CHOP[0], FLOOR[2], CHOP[3]], perc: '....c.......c...', hats: '..o...o...o...om', frantic: true },
  ],
});

// The Colosseum — "Gladiator": hard techno × breakcore under a brass fanfare, grinding power-chord
// stabs and an acid line. C minor with a major V (the arena's harmonic minor).
addSong('gladiator', {
  name: 'Gladiator', bpm: 172, lead: 'darkpad', dark: true, lp: 11000, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'brass', echo: 0.2,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[36, [48, 55, 60, 63]], [44, [48, 56, 60, 63]], [46, [50, 58, 62, 65]], [43, [50, 55, 59, 62]]], // Cm · A♭/C · B♭ · G
  bassLine: '0! 0 12 0 0! 0 12 0 0! 0 12 0 10^ 0 7 0',
  hook: [
    'G4 - - . C5 - - . Eb5 - D5 - C5 - G4 -', 'Ab4 - - . C5 - - . Eb5 - F5 - Eb5 - C5 -',
    'Bb4 - - . D5 - - . F5 - G5 - F5 - D5 -', 'B4 - - - D5 - - - G5 - - - - - . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k..k..k.k..k..k.', 'k..k..k.k..k..k.', 'k..k..k.k..k..k.', 'k..k..k.k.rrrrrr'], hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, hats: 'm.m.m.m.m.m.m.m.', frantic: true, noStabs: true },
    { name: 'B', bars: 4, reps: 2, drums: FLOOR, perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'break', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', frantic: true,
      hook: ['C6 - - . G5 - Eb5 - C6 - D6 - Eb6 - D6 -', 'C6 - - . Ab5 - Eb5 - C6 - Eb6 - F6 - Eb6 -', 'D6 - - . Bb5 - F5 - D6 - F6 - G6 - F6 -', 'D6 - - - B5 - - - G5 - - - - - . .'] },
  ],
});
