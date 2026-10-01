// Songs for the final pack, AIR FORTRESS (see js/audio/songs.js for the notation).
//   finalAscent  FLIGHT DECK: Y2K trance-breakcore at sunrise, a soaring supersaw hook, 178 bpm
//   dreadnought  the final boss: breakcore × hard techno in F♯ minor, reese bass, grinding stabs, 182 bpm
// HULL BREACH and BOMB BAY use stock tracks ('sprint', 'netdive').
import { addSong } from '../music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];
const FOUR = ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k.kk', 'k...k...k...krrr'];
const ROLL = ['k...s...k...s...', 'k...s...k.s.s.s.', 'k.s.s.s.s.s.s.s.', 'rrrrrrrrrrrrrrrr'];

// FLIGHT DECK — sunrise over the cloud sea: bright E♭ chords, chopped amens, an acid line, and a hero
// hook that keeps climbing (it peaks on the drop, a whole octave up).
addSong('finalAscent', {
  name: 'Final Ascent', bpm: 178, lead: 'stab', comp: '..x...x...x..x..', hookVoice: 'hero', bassVoice: 'acid', bassOct: 0, echo: 0.26,
  chords: [[36, [51, 55, 58, 62]], [44, [55, 58, 60, 63]], [39, [55, 58, 63, 65]], [46, [53, 58, 62, 67]]], // Cm9 · A♭maj9 · E♭add9 · B♭6
  arp: { seq: [0, 1, 2, 3, 4, 2, 3], oct: 12, every: 1, vol: 0.02 },
  bassLine: '0! . 12 . 0 0 12 . 0! . 12 . 10 . 7 12^',
  hook: [
    'G5 . C6 . Eb6 - . . D6 . C6 . Bb5 - . .', 'C6 . Ab5 . Eb5 - . . F5 . G5 . Ab5 - . .',
    'Bb5 . G5 . Eb6 - . . F6 . Eb6 . D6 - . .', 'D6 - - . C6 - - . Bb5 - . G5 . F5 . .',
    'G5 . C6 . Eb6 - . . G6 . F6 . Eb6 - . .', 'Eb6 . C6 . Ab5 - . . Bb5 . C6 . Eb6 - . .',
    'F6 - . Eb6 . D6 . . Bb5 - . . D6 . Eb6 .', 'F6 - - - - - . . . . . . . . . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k...............', 'k.......k.......', 'k...k...k...k...', 'k...k...k.k.rrrr'], hats: '..h...h...h...h.', noBass: true, noHook: true, noArp: true },
    { name: 'A', bars: 4, reps: 2, drums: AMEN, hats: 'h.h.h.hih.h.h.ho', noHook: true },
    { name: 'B', bars: 4, reps: 2, drums: CHOP, hats: 'h.h.h.hih.h.h.ho', frantic: true },
    { name: 'breakdown', bars: 4, noDrums: true, noBass: true, hats: '........h.......',
      hook: ['Eb6 - - - - - - - D6 - - - - - - -', 'C6 - - - - - - - Ab5 - - - - - - -', 'Bb5 - - - - - - - G6 - - - - - - -', 'F6 - - - D6 - - - Bb5 - - - F5 - - -'] },
    { name: 'riser', bars: 2, drums: [ROLL[2], ROLL[3]], noBass: true, noHook: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', perc: '....c.......c...', frantic: true,
      hook: ['G6 . C6 . Eb6 . G6 . F6 . Eb6 . D6 . C6 .', 'Ab6 . Eb6 . C6 . Eb6 . F6 . G6 . Ab6 - . .', 'G6 . Eb6 . Bb5 . Eb6 . F6 . G6 . Bb6 - . .', 'Bb6 - - . Ab6 - - . G6 - . F6 . D6 . .'] },
  ],
});

// DREADNOUGHT — the last fight: i · ♭VI · ♭VII · V in F♯ minor, a reese bass pumping under grinding
// power-chord stabs, four-on-the-floor colliding with amen chops, and a hero hook that goes up
// another octave for the finale.
const HERO = ['F#5 - - - A5 - C#6 - - - B5 - A5 - G#5 -', 'F#5 - - - - - . . D6 - - - C#6 - B5 -', 'B5 - - - G#5 - E5 - - - G#5 - B5 - E6 -', 'F6 - - - - - E6 - - - C#6 - - - . .'];
const HIGH = ['C#6 - - - F#6 - E6 - C#6 - A5 - B5 - C#6 -', 'D6 - - - F#6 - A6 - - - F#6 - D6 - A5 -', 'E6 - - - G#6 - B6 - - - G#6 - E6 - B5 -', 'F6 - - - G#6 - C#7 - - - - - . . . .'];
addSong('dreadnought', {
  name: 'Dreadnought', bpm: 182, lead: 'darkpad', dark: true, lp: 11000, pump: true, kick: 'deep', bassVoice: 'reese', bassOct: 0, hookVoice: 'hero', echo: 0.22,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[42, [54, 57, 61, 66]], [38, [54, 57, 62, 66]], [40, [56, 59, 64, 68]], [37, [53, 56, 61, 65]]], // F♯m · D · E · C♯
  arp: { seq: [0, 2, 1, 3, 2, 4, 3, 5, 4], oct: 12, every: 1, vol: 0.016 },
  bassLine: '0! 0 12 0 0! 0 12 0 0! 0 12 0 10^ 0 7 0',
  hook: HERO,
  parts: [
    { name: 'intro', bars: 4, drums: FOUR, hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true, noArp: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, hats: 'm.m.m.m.m.m.m.m.', noHook: true, frantic: true },
    { name: 'B', bars: 4, reps: 2, drums: FOUR, perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'break', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'], hook: ['F#5 - - - - - - - - - - - - - - -', 'C#6 - - - - - - - F6 - - - - - - -'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', perc: '....c.......c...', frantic: true, hook: HIGH },
    { name: 'bridge', bars: 4, drums: ['k.......s.......', 'k.......s.....g.', 'k.......s.......', 'k.......s.k.rrrr'], noStabs: true, hats: '..o...o...o...o.',
      hook: ['A5 - - - - - - - C#6 - - - - - - -', 'D6 - - - - - - - F#6 - - - - - - -', 'E6 - - - - - - - G#6 - - - B6 - - -', 'C#7 - - - - - - - - - - - . . . .'] },
    { name: 'finale', bars: 4, reps: 2, drums: [CHOP[0], CHOP[1], AMEN[2], CHOP[3]], hats: 'mmommmommmommmom', perc: 'i...c..i....c.i.', frantic: true, hook: HIGH },
  ],
});
