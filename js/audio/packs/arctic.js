// Songs for pack 'arctic' (ARCTIC VAULT). See js/audio/songs.js for the notation.
//   permafrost  LONGYEAR, ICE SHELF, THE VAULT: glass FM bells over hard techno that breaks into amen
//               chops; a cold reese bass, a drifting 7-step arp, C♯ minor in major-seventh voicings. 168 bpm
//   polaris     COLD STORAGE: breakcore × hard techno in B minor, grinding power-chord stabs, an acid line
//               and an FM bell hook that climbs an octave for the drop. 180 bpm
import { addSong } from '../music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];
const FOUR = ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k.kk', 'k...k...k...krrr'];

// PERMAFROST — the aurora over the coal town, the whiteout on the glacier, the tunnel into the mountain.
// Glassy inharmonic FM bells (the ice) over four-on-the-floor; then the floor gives way to amen chops.
const ICE = [
  'G#5 - - . E5 - B5 - - . G#5 . F#5 - E5 -', 'C#6 - - . B5 - G#5 - - - . . E5 - F#5 -',
  'D#6 - - . B5 - F#5 - - . G#5 . B5 - D#6 -', 'C#6 - - - - - B5 - G#5 - - - . . . .',
  'G#5 - B5 - C#6 - E6 - - . D#6 . C#6 - B5 -', 'C#6 - - . E6 - - . G#6 - - - E6 - C#6 -',
  'B5 - - . D#6 - - . F#6 - - - D#6 - B5 -', 'G#5 - - - - - - - . . . . . . . .',
];
addSong('permafrost', {
  name: 'Permafrost', bpm: 168, lead: 'bells', dark: true, lp: 10000, pump: true, kick: 'deep', bassVoice: 'reese', bassOct: 0, hookVoice: 'glass', echo: 0.38,
  chords: [[37, [56, 59, 63, 64]], [33, [57, 61, 64, 68]], [40, [56, 59, 63, 66]], [35, [54, 56, 61, 63]]], // C♯m9 · Amaj7 · Emaj9 · B6/9
  arp: { seq: [0, 2, 1, 3, 4, 2, 5], oct: 12, every: 1, vol: 0.018 },
  bassLine: '0! . . 0 . . 12 . 0 . . 0 . 7 . 12',
  hook: ICE,
  parts: [
    { name: 'intro', bars: 4, noDrums: true, noBass: true, hats: '........m.......',
      hook: ['G#5 - - - - - - - . . . . . . . .', '', 'B5 - - - - - - - . . . . . . . .', 'C#6 - - - B5 - - - G#5 - - - . . . .'] },
    { name: 'A', bars: 4, reps: 2, drums: FOUR, hats: '..o...o...o...o.', perc: '....c.......c...', noHook: true },
    { name: 'B', bars: 4, reps: 2, drums: FOUR, hats: 'mmommmommmommmom', perc: 'i...c..i....c.i.', bassLine: '0! 0 12 0 . 0 12 0 0! . 12 0 10^ 0 7 0' },
    { name: 'thaw', bars: 4, noDrums: true, noBass: true, hats: '....h.......h...',
      hook: ['E6 - - - - - - - D#6 - - - - - - -', 'C#6 - - - - - - - E6 - - - - - - -', 'D#6 - - - - - - - F#6 - - - - - - -', 'G#6 - - - - - - - - - - - . . . .'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', frantic: true, bassLine: '0! 0 12 0 . 0 12 0 0! . 12 0 10^ 0 7 0',
      hook: ['G#6 . E6 . B5 . E6 . G#6 . F#6 . E6 . B5 .', 'C#6 . E6 . A6 . E6 . C#6 . E6 . G#6 . E6 .', 'D#6 . F#6 . B6 . F#6 . D#6 . F#6 . G#6 . F#6 .', 'C#6 - - - B5 - - - G#5 - - - . . . .'] },
  ],
});

// POLARIS — the warden wakes: i · ♭VI · III · V in B minor, grinding stabs over an acid line, amen chops
// against four-on-the-floor, and a cold FM-bell hook that goes up an octave when the snow comes in.
const WARDEN = ['F#5 - - - D5 - B4 - F#5 - G5 - F#5 - E5 -', 'D5 - - - B4 - G4 - D5 - E5 - D5 - B4 -', 'A4 - D5 - F#5 - A5 - - - G5 - F#5 - D5 -', 'C#5 - - - F#5 - - - A#5 - - - C#6 - . .'];
const STORM = ['B5 - - - F#5 - D6 - - - C#6 - B5 - A#5 -', 'B5 - - - G5 - D6 - E6 - D6 - B5 - G5 -', 'A5 - - - D6 - F#6 - - - E6 - D6 - A5 -', 'A#5 - - - C#6 - F#6 - - - - - . . . .'];
addSong('polaris', {
  name: 'Polaris', bpm: 180, lead: 'darkpad', dark: true, lp: 11000, pump: true, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'fm', echo: 0.24,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[35, [50, 54, 59, 62]], [31, [50, 55, 59, 62]], [38, [50, 54, 57, 62]], [42, [49, 54, 58, 61]]], // Bm · G · D · F♯
  arp: { seq: [0, 2, 1, 3, 2, 4, 3], oct: 12, every: 1, vol: 0.015 },
  bassLine: '0! 0 12 0 0! 0 12^ 10 0! 0 12 0 7 0 5 3',
  hook: WARDEN,
  parts: [
    { name: 'intro', bars: 4, drums: FOUR, hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true, noArp: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, hats: 'm.m.m.m.m.m.m.m.', noHook: true, frantic: true },
    { name: 'B', bars: 4, reps: 2, drums: FOUR, perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'whiteout', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'],
      hook: ['B5 - - - - - - - - - - - - - - -', 'F#6 - - - - - - - A#5 - - - - - - -'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', perc: '....c.......c...', frantic: true, hook: STORM,
      bassLine: '0! . 12 0 0! . 12 0 0! . 12 0 10^ 0 7 0' },
  ],
});
