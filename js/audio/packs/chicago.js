// NEO CHICAGO's soundtrack (procedural: see js/audio/music.js for the notation).
//   chiJuke      THE LOOP and LAKESHORE: Chicago footwork at 160 — 3-3-2 kicks, clap on the back
//                beat, rolling 16th hats, house-piano stabs, a squelching 303 and a Y2K FM hook in F minor.
//   chiBullRush  SKYDECK and the BULL PEN: ghetto house into hard acid techno into amen breakcore at 168,
//                distorted power-chord stabs in E phrygian, a screaming hero lead.
import { addSong } from '../music.js';

const FOOT = ['k..k..k...k..k..', 'k..k..k.k..k..k.', 'k..k..k...k..k..', 'k..k..k.k.k.k.kk'];
const JUKE = ['k..k..k.s..k..s.', 'k..k.sk.k..k.s..', 'k..k..k.s..k..s.', 'k..k.sk.k.rrsrrr'];
const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];

addSong('chiJuke', {
  name: 'Windy Grid', bpm: 160, lead: 'stab', comp: 'x..x..x...x..x..', stabs: '..x..x....x..x..', stabVoice: 'rhodes',
  hookVoice: 'fm', bassVoice: 'acid', bassOct: 0, echo: 0.26, swing: 0.04,
  chords: [[41, [56, 60, 63, 67]], [37, [53, 56, 60, 65]], [39, [55, 58, 60, 63]], [36, [55, 58, 63, 67]]], // Fm9 · D♭maj7 · E♭6 · Cm7
  arp: { seq: [0, 2, 1, 3, 2, 4, 3], oct: 12, every: 1, vol: 0.016 },
  bassLine: ['0! . 12 . . 0 12^ . 0! . 10 . 7 . 12^ .', '0! . 12 . . 0 12^ . 0! . 3^ . 5 . 7^ .'],
  hook: [
    'C6 . . Ab5 . . F5 . Ab5 . C6 . Eb6 - C6 .', 'Db6 . . Ab5 . . F5 . Ab5 . C6 - . . . .',
    'Bb5 . . G5 . . Eb5 . G5 . Bb5 . C6 - Bb5 .', 'G5 - - . Bb5 - . . Eb6 - - - . . . .',
    'F6 . . Eb6 . . C6 . Eb6 . F6 . Ab6 - F6 .', 'F6 . . Db6 . . Ab5 . C6 . Db6 - . . . .',
    'Eb6 . . Bb5 . . G5 . Bb5 . C6 . Eb6 - C6 .', 'Bb5 - - . G5 - . . C6 - - - . . . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['................', '................', '................', '........k..k..k.'], hats: 'h.hhh.hhh.hhh.hh', perc: '....c.......c...', noBass: true, noHook: true, noStabs: true },
    { name: 'footwork', bars: 4, reps: 2, drums: FOOT, hats: 'h.hhh.hhh.hhh.hh', perc: '....c.......c..c', noHook: true },
    { name: 'A', bars: 4, reps: 2, drums: JUKE, hats: 'hhhhhhhhhhhhhhho', perc: '....c.......c...' },
    { name: 'break', bars: 4, noDrums: true, noBass: true, noStabs: true, hats: '........h.......', perc: '....c.......c...',
      hook: ['Ab5 - - - - - - - C6 - - - - - - -', 'F5 - - - - - - - Ab5 - - - - - - -', 'G5 - - - - - - - Bb5 - - - - - - -', 'Eb6 - - - C6 - - - Bb5 - - - G5 - - -'] },
    { name: 'drop', bars: 4, reps: 2, drums: [FOOT[0], CHOP[0], FOOT[2], CHOP[3]], hats: 'hhhhhhhhhhhhhhho', perc: '....c.......c.cc', frantic: true },
    { name: 'outro', bars: 4, drums: AMEN, hats: 'h.h.h.hih.h.h.ho', perc: '....c.......c...' },
  ],
});

addSong('chiBullRush', {
  name: 'Bull Rush', bpm: 168, lead: 'darkpad', dark: true, lp: 11000, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'hero', echo: 0.2,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[40, [52, 55, 59, 64]], [41, [53, 57, 60, 64]], [43, [55, 59, 62, 65]], [41, [53, 57, 60, 64]]], // Em · Fmaj7 · G7 · Fmaj7 (E phrygian)
  arp: { seq: [0, 3, 1, 4, 2], oct: 12, every: 1, vol: 0.018 },
  bassLine: ['0! 0 12 0 0! 0 13^ 12 0! 0 12 0 7 0 1^ 0', '0! 0 12 0 0! 0 12^ 10 0! 0 12 0 3^ 0 1^ 0'],
  hook: ['E5 - - . G5 - B5 - - - A5 - G5 - F5 -', 'E5 - - - - - . . B4 - - - E5 - - -', 'D5 - E5 - F5 - G5 - - - F5 - E5 - D5 -', 'F5 - - - E5 - - - B4 - - - - - . .'],
  parts: [
    { name: 'intro', bars: 4, drums: ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k.k.rrrr'], hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true, noArp: true },
    { name: 'ghetto', bars: 4, reps: 2, drums: ['k..k..k.k..k..k.', 'k..k..k.k..k.kk.', 'k..k..k.k..k..k.', 'k..k..k.k.k.rrrr'], perc: '....c.......c...', hats: 'h.hhh.hhh.hhh.hh', noHook: true },
    { name: 'acid', bars: 4, reps: 2, drums: ['k...k...k...k...', 'k...k...k..kk...', 'k...k...k...k.kk', 'k...k...k...krrr'], perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'riser', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'stampede', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', perc: '....c.......c...', frantic: true },
  ],
});

export default null;
