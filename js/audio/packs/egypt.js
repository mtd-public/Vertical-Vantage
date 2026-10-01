// Songs for pack 'egypt' (EGYPT: THE DATA DYNASTY). House style: breakcore / hard techno in
// multi-section `parts` (see js/audio/songs.js for the notation), here over Middle-Eastern modes:
// maqam Hijaz (the augmented second between the 2nd and 3rd degrees) and the double harmonic scale.
// Stages pick them by name (stage.song).
import { addSong } from '../music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];
const FLOOR = ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k.k.rrrr'];
// a darbuka-ish pattern on the rims and claps (doum-tek-tek, the maqsum rhythm)
const MAQSUM = 'i..c..i.i..c....';

// Cairo / the Data Pyramid — "Nile Break": breakcore under a D-Hijaz hook (D E♭ F♯ G A B♭ C), the
// chords walking D · E♭ · D · Cm | Gm · E♭ · D · D, maqsum claps over the amen.
addSong('nileBreak', {
  name: 'Nile Break', bpm: 172, lead: 'stab', comp: '..x...x...x...x.', hookVoice: 'fm', bassVoice: 'acid', bassOct: 0, echo: 0.26,
  chords: [[38, [50, 54, 57, 62]], [39, [51, 55, 58, 63]], [38, [50, 54, 57, 62]], [36, [48, 51, 55, 60]], [43, [50, 55, 58, 62]], [39, [51, 55, 58, 63]], [38, [50, 54, 57, 62]], [38, [50, 54, 57, 60]]],
  arp: { seq: [0, 1, 2, 3, 2, 1, 4], oct: 12, every: 1, vol: 0.017 },
  bassLine: '0! . 12 . 0 0 12 . 0! . 1^ . 0 . 7 12^',
  hook: [
    'D5 - Eb5 F#5 G5 - F#5 Eb5 D5 - - . A4 - . .', 'Eb5 - . G5 - . Bb5 - A5 - G5 - F#5 - Eb5 -',
    'D5 - Eb5 F#5 A5 - G5 F#5 G5 - A5 - Bb5 - A5 -', 'G5 - F#5 - Eb5 - C5 - D5 - - - . . . .',
    'G5 - A5 Bb5 C6 - Bb5 A5 G5 - - . D5 - . .', 'Eb5 - G5 - Bb5 - A5 - G5 - F#5 - Eb5 - D5 -',
    'F#5 - G5 - A5 - - . Bb5 A5 G5 F#5 Eb5 - D5 -', 'D5 - - - - - - - . . . . . . . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k.......s.......', 'k.......s.....g.', 'k.......s.......', 'k.......s.k.rrrr'], perc: MAQSUM, hats: 'h.h.h.h.h.h.h.h.', noBass: true, noHook: true, noPad: true },
    { name: 'A', bars: 8, drums: AMEN, perc: MAQSUM, hats: 'h.h.h.hih.h.h.ho' },
    { name: 'B', bars: 8, drums: CHOP, frantic: true, bassLine: '0! 0 12 0 1^ 0 12 0 0! 0 12 0 10 0 7 0',
      hook: ['A5 . D6 . A5 . F#5 . G5 . A5 . Bb5 . A5 .', 'Bb5 . G5 . Eb5 . G5 . Bb5 . C6 . Bb5 . G5 .', 'A5 . F#5 . D5 . F#5 . A5 . G5 . F#5 . Eb5 .', 'C5 . Eb5 . G5 . Eb5 . C5 . D5 . Eb5 . C5 .', 'G5 . Bb5 . D6 . Bb5 . G5 . A5 . Bb5 . C6 .', 'Bb5 . G5 . Eb5 . F#5 . G5 . A5 . Bb5 . G5 .', 'A5 . F#5 . Eb5 . D5 . F#5 . Eb5 . D5 . C5 .', 'D5 - - - . . . . D6 - - - . . . .'] },
    { name: 'breakdown', bars: 4, noDrums: true, noBass: true, perc: MAQSUM, hats: '........h.......',
      hook: ['D5 - - - - - - - Eb5 - - - - - - -', 'F#5 - - - - - - - G5 - - - - - - -', 'A5 - - - G5 - - - F#5 - - - Eb5 - - -', 'D5 - - - - - - - . . . . . . . .'] },
    { name: 'drop', bars: 8, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], perc: MAQSUM, frantic: true, hats: 'h.h.h.hih.h.h.ho' },
  ],
});

// The Inner Sanctum — "Tomb Raid": hard techno in the dark, D double harmonic (D E♭ F♯ G A B♭ C♯):
// four-to-the-floor, a pumping pad, an acid line that leans on the E♭, metal hats, a glass hook.
addSong('tombHard', {
  name: 'Tomb Raid', bpm: 142, lead: 'darkpad', dark: true, lp: 8500, pump: true, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'glass', echo: 0.36,
  chords: [[38, [50, 54, 57, 61]], [39, [51, 55, 58, 62]], [38, [50, 54, 57, 61]], [45, [49, 52, 57, 61]]], // D(maj7) · E♭ · D(maj7) · A — the double harmonic's two leading tones
  drums: FLOOR,
  arp: { seq: [0, 2, 1, 3, 2, 4], oct: 12, every: 1, vol: 0.02 },
  bassLine: ['0! 0 12 0 . 0 1^ 0 0! . 12 0 1^ 0 7 0', '0! 0 12 0 . 0 1^ 0 0! . 12 0 11^ 0 12 0'],
  hook: ['A5 - - - . . Bb5 - - - . . A5 - - -', 'G5 - - - F#5 - - - Eb5 - - - D5 - - -', 'A5 - - - . . C#6 - - - . . D6 - - -', 'C#6 - - - Bb5 - - - A5 - - - - - - -'],
  parts: [
    { name: 'intro', bars: 4, hats: '..o...o...o...o.', perc: MAQSUM, noBass: true, noPad: true, noHook: true, noArp: true },
    { name: 'A', bars: 4, reps: 2, perc: '....c.......c...', hats: '..o.m.o.m.o.m.om', noHook: true },
    { name: 'B', bars: 4, reps: 2, perc: MAQSUM, hats: 'mmommmommmommmom' },
    { name: 'break', bars: 4, noKick: true, noBass: true, hats: '........m.......', perc: MAQSUM },
    { name: 'peak', bars: 4, reps: 2, drums: ['k...k...k...k.kk', 'k...k...k..kk...', 'k...k...k...k.kk', 'k...k...k...krrr'], perc: 'i..ci..ci.icc.i.', hats: 'mmommmommmommmom', frantic: true },
  ],
});

// The Hall of Judgment — "Weighing of the Heart" (MECHA ANUBIS): breakcore × hard techno, grinding
// power-chord stabs, an acid line and a brass hook in E Hijaz-Kar (E F G♯ A B C D♯): E · F · Am · E.
addSong('weighingHeart', {
  name: 'Weighing of the Heart', bpm: 176, lead: 'darkpad', dark: true, lp: 11500, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'brass', echo: 0.2,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[40, [52, 56, 59, 64]], [41, [53, 57, 60, 65]], [45, [52, 57, 60, 64]], [40, [52, 56, 59, 63]]], // E · F · Am · E(maj7: the D♯)
  bassLine: '0! 0 12 0 1^ 0 12 0 0! 0 12 0 4^ 0 1 0',
  hook: [
    'E5 - - . F5 - G#5 - A5 - - . G#5 - F5 -', 'E5 - - - - - . . B4 - - - C5 - - -',
    'A5 - - . B5 - C6 - B5 - A5 - G#5 - F5 -', 'G#5 - - - F5 - - - E5 - - - - - . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k..k..k.k..k..k.', 'k..k..k.k..k..k.', 'k..k..k.k..k..k.', 'k..k..k.k.rrrrrr'], perc: MAQSUM, hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, perc: MAQSUM, hats: 'm.m.m.m.m.m.m.m.', frantic: true, noStabs: true },
    { name: 'B', bars: 4, reps: 2, drums: FLOOR, perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'break', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], perc: MAQSUM, hats: 'h.h.h.hih.h.h.ho', frantic: true,
      hook: ['E6 - - . D#6 - C6 - B5 - C6 - D#6 - E6 -', 'F6 - - . E6 - C6 - A5 - C6 - E6 - F6 -', 'E6 - - . C6 - A5 - C6 - B5 - A5 - G#5 -', 'G#5 - - - B5 - - - E6 - - - - - . .'] },
  ],
});

export default null;
