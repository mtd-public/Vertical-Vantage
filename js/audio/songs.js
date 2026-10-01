// Vertical Vantage's soundtrack: breakcore, Y2K and hard techno, written for dr-mow's procedural
// engine (music.js) with the multi-loop `parts` extension: every song walks through several
// sections (intro → A → B → breakdown → drop …) before it comes round again.
// Notation (see music.js): drums k kick, s snare, g ghost, r roll, h hat, o open hat, m metal,
// i rim, c clap, . rest; hook/bass bars are 16 tokens ('-' holds, '!' accents, '^' slides).
import { addSong } from './music.js';

const AMEN = ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'];
const CHOP = ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'];

// Stage 1 — Y2K breakcore under a blue sky: bright minor-nine chords, amen chops, an acid line.
addSong('harborBreak', {
  name: 'Harbor Break', bpm: 174, lead: 'stab', comp: '..x...x...x...x.', hookVoice: 'fm', bassVoice: 'acid', bassOct: 0, echo: 0.24,
  chords: [[40, [55, 59, 62, 66]], [36, [55, 59, 62, 64]], [43, [57, 59, 62, 67]], [38, [54, 57, 59, 64]]], // Em9 · Cmaj9 · Gadd9 · D6/9
  arp: { seq: [0, 2, 1, 3, 4, 3, 2], oct: 12, every: 1, vol: 0.018 },
  bassLine: '0! . 12 . 0 0 12 . 0! . 12 . 10 . 7 12^',
  hook: [
    'E5 . G5 . B5 - . . A5 . G5 . E5 - . .', 'G5 . E5 . D5 - . . B4 - . . D5 . E5 .',
    'B4 . D5 . G5 - . . F#5 . E5 . D5 . B4 .', 'A4 - - . F#5 - - . E5 - . D5 . A4 . .',
    'E5 . G5 . B5 - . . D6 . B5 . A5 - . .', 'G5 . A5 . B5 - . . G5 - . . E5 . G5 .',
    'D6 - . B5 . G5 . . A5 - . . G5 . F#5 .', 'E5 - - - . . . . . . . . . . . .',
  ],
  parts: [
    { name: 'intro', bars: 4, drums: ['k.......s.......', 'k.......s.....g.', 'k.......s.......', 'k.......s.k.rrrr'], hats: 'h.h.h.h.h.h.h.h.', noBass: true, noHook: true, noPad: true },
    { name: 'A', bars: 4, reps: 2, drums: AMEN, hats: 'h.h.h.hih.h.h.ho' },
    { name: 'B', bars: 4, reps: 2, drums: CHOP, frantic: true, bassLine: '0! 0 12 0 0! 0 12 0 0! 0 12 0 10 0 7 0',
      hook: ['B5 . E6 . B5 . G5 . B5 . E6 . F#6 . E6 .', 'C6 . E6 . C6 . G5 . C6 . E6 . G6 . E6 .', 'B5 . D6 . B5 . G5 . A5 . D6 . E6 . D6 .', 'A5 . D6 . F#6 . D6 . A5 . F#5 . D5 . A5 .'] },
    { name: 'breakdown', bars: 4, noDrums: true, noBass: true, hats: '........h.......',
      hook: ['E5 - - - - - - - G5 - - - - - - -', 'B5 - - - - - - - A5 - - - - - - -', 'G5 - - - - - - - D6 - - - - - - -', 'C6 - - - B5 - - - A5 - - - F#5 - - -'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], frantic: true, hats: 'h.h.h.hih.h.h.ho' },
  ],
});

// Stage 2 — Y2K trance-breaks over the rooftops: offbeat stabs, a bouncing bass, a supersaw hero hook.
addSong('skyway2000', {
  name: 'Skyway 2000', bpm: 160, lead: 'stab', comp: 'x..x..x...x..x..', hookVoice: 'hero', bassVoice: 'bounce', bassOct: 0, echo: 0.28,
  chords: [[45, [57, 61, 64, 71]], [42, [57, 61, 64, 68]], [38, [57, 61, 64, 66]], [40, [56, 59, 61, 64]]], // A(add9) · F♯m9 · Dmaj9 · E6
  arp: { seq: [0, 1, 2, 3, 2, 1], oct: 12, every: 1, vol: 0.02 },
  bassLine: '0 . 12 . 0 . 12 . 0 . 12 . 7 . 12 .',
  hook: [
    'E5 - . A5 - . C#6 - . B5 - . A5 - E5 -', 'F#5 - . A5 - . C#6 - . E6 - . C#6 - B5 -',
    'D6 - . C#6 - . A5 - . F#5 - . A5 - B5 -', 'B5 - - - G#5 - - - E5 - - - . . . .',
    'E5 - . A5 - . C#6 - . E6 - . F#6 - E6 -', 'C#6 - . A5 - . F#5 - . A5 - . C#6 - E6 -',
    'F#6 - . E6 - . D6 - . C#6 - . A5 - F#5 -', 'G#5 - - - B5 - - - E6 - - - - - . .',
  ],
  parts: [
    { name: 'intro', bars: 4, noDrums: true, hats: 'h.h.h.h.h.h.h.h.', noBass: true, noHook: true, noPad: true },
    { name: 'build', bars: 4, drums: ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k.k.rrrr'], perc: '....c.......c...', hats: '..o...o...o...o.', noHook: true },
    { name: 'A', bars: 4, reps: 2, drums: ['k..hs.hkk.h.s.hh', 'k..hs.hkk.hks.ho', 'k..hs.hkk.h.s.hh', 'k..hs.hkkrhksrrr'], hats: '..o...o...o...o.' },
    { name: 'break', bars: 4, noDrums: true, noBass: true, noPad: true, hats: '....h.......h...', hook: ['C#6 - - - - - - - B5 - - - - - - -', 'A5 - - - - - - - C#6 - - - - - - -', 'F#6 - - - E6 - - - D6 - - - C#6 - - -', 'B5 - - - - - - - . . . . . . . .'] },
    { name: 'drop', bars: 4, reps: 2, drums: ['k...k...k...k...', 'k..hk.hkk...k.hh', 'k...k...k...k...', 'k...k...krrrsrrr'], perc: '....c.......c...', hats: '..o...o...o...om', frantic: true },
  ],
});

// Stage 3 — hard techno in the rain: four-to-the-floor, an acid rumble, metallic 16ths, a glass hook.
addSong('neonHard', {
  name: 'Neon Hard', bpm: 148, lead: 'darkpad', dark: true, lp: 9000, pump: true, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'glass', echo: 0.35,
  chords: [[36, [51, 55, 58, 63]], [37, [53, 56, 60, 65]], [36, [51, 55, 58, 63]], [34, [53, 56, 58, 61]]], // Cm · D♭maj7 · Cm · B♭m7 (C phrygian)
  drums: ['k...k...k...k...'],
  arp: { seq: [0, 2, 1, 3, 2, 4], oct: 12, every: 1, vol: 0.02 },
  bassLine: ['0! 0 12 0 . 0 1^ 0 0! . 12 0 10^ 0 7 0', '0! 0 12 0 . 0 3^ 0 0! . 12 0 1^ 0 12 0'],
  hook: ['G5 - - - . . Ab5 - - - . . G5 - - -', 'F5 - - - . . Eb5 - - - . . C5 - - -', 'G5 - - - . . Bb5 - - - . . Ab5 - - -', 'F5 - - - Eb5 - - - Db5 - - - C5 - - -'],
  parts: [
    { name: 'intro', bars: 4, hats: '..o...o...o...o.', noBass: true, noPad: true, noHook: true, noArp: true },
    { name: 'A', bars: 4, reps: 2, perc: '....c.......c...', hats: '..o.m.o.m.o.m.om', noHook: true, noArp: true },
    { name: 'B', bars: 4, reps: 2, perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'break', bars: 4, noKick: true, noBass: true, hats: '........m.......', perc: '....c.......c...' },
    { name: 'peak', bars: 4, reps: 2, drums: ['k...k...k...k.kk', 'k...k...k..kk...', 'k...k...k...k.kk', 'k...k...k...krrr'], perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom', frantic: true },
  ],
});

// Bonus stages — breakcore at full tilt: 30 seconds, every server must go.
addSong('serverRush', {
  name: 'Server Rush', bpm: 188, lead: 'arp', hookVoice: 'hero', bassVoice: 'acid', bassOct: 0, echo: 0.18,
  chords: [[41, [56, 60, 63, 67]], [37, [53, 56, 60, 63]], [39, [56, 58, 61, 65]], [36, [52, 58, 63, 67]]], // Fm9 · D♭maj9 · E♭sus · C7♯9
  bassLine: '0! . 12 0 0! . 12 0 0! . 12 0 10^ 0 7 0',
  hook: ['C6 . C6 . Eb6 . C6 . F6 - . Eb6 . C6 . .', 'Ab5 . Ab5 . C6 . Ab5 . Db6 - . C6 . Ab5 . .', 'Bb5 . Bb5 . Eb6 . Bb5 . F6 - . Eb6 . Bb5 .', 'G5 - . Bb5 - . E6 - . G6 - - - . . . .'],
  parts: [
    { name: 'A', bars: 4, reps: 2, drums: AMEN, hats: 'h.h.h.hih.h.h.ho', frantic: true },
    { name: 'B', bars: 4, reps: 2, drums: CHOP, frantic: true },
    { name: 'riser', bars: 2, noDrums: true, noBass: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
  ],
});

// Menus — a Y2K chill breakbeat: glass bells over a swung kit and a sub bass.
addSong('bootSeq', {
  name: 'Boot Sequence', bpm: 128, lead: 'pad', hookVoice: 'glass', bassVoice: 'sub', swing: 0.06, echo: 0.4, soft: true,
  chords: [[41, [57, 60, 64, 67]], [40, [55, 59, 62, 64]], [38, [53, 57, 60, 64]], [36, [52, 55, 59, 62]]], // Fmaj9 · Em7 · Dm9 · Cmaj9
  arp: { seq: [0, 3, 1, 2, 3, 0, 2], oct: 12, every: 2, vol: 0.022 },
  bassLine: '0 - - - . . 0 - . . 7 - . . 0 -',
  hook: ['E5 - - . G5 - - . C6 - - - B5 - . .', 'D5 - - . E5 - - . G5 - - - . . . .', 'F5 - - . A5 - - . D6 - - - C6 - . .', 'B4 - - . C5 - - . E5 - - - G5 - . .'],
  parts: [
    { name: 'A', bars: 4, reps: 2, drums: ['k..h..h.s..h.kh.', 'k..h..hks..h..ho'], noHook: true },
    { name: 'B', bars: 4, reps: 2, drums: ['k..h..h.s..h.kh.', 'k.kh..h.s..hkkho'], hats: '..h...h...h...h.' },
    { name: 'drift', bars: 4, noDrums: true, hats: '........h.......' },
  ],
});

// Stage 4 boss — ARACHNE-9: breakcore × hard techno, distorted power-chord stabs, an acid line, a hero hook.
addSong('arachne', {
  name: 'Arachne', bpm: 176, lead: 'darkpad', dark: true, lp: 12000, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'hero', echo: 0.2,
  stabs: 'x..x..x...x.x...', stabVoice: 'grind',
  chords: [[38, [50, 57, 62, 65]], [34, [46, 53, 58, 62]], [36, [48, 55, 60, 64]], [33, [45, 52, 57, 61]]], // Dm · B♭ · C · A
  bassLine: '0! 0 12 0 0! 0 12^ 10 0! 0 12 0 7 0 5 3',
  hook: ['D5 - - - F5 - A5 - - - G5 - F5 - E5 -', 'D5 - - - - - . . A4 - - - D5 - - -', 'Bb4 - C5 - D5 - F5 - - - E5 - D5 - C5 -', 'C#5 - - - E5 - - - A5 - - - - - . .'],
  parts: [
    { name: 'intro', bars: 4, drums: ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k...krrr'], hats: '..o...o...o...o.', noHook: true, noStabs: true, noBass: true },
    { name: 'A', bars: 4, reps: 2, drums: CHOP, hats: 'm.m.m.m.m.m.m.m.', noHook: true, frantic: true },
    { name: 'B', bars: 4, reps: 2, drums: ['k...k...k...k...', 'k...k...k..kk...', 'k...k...k...k.kk', 'k...k...k...krrr'], perc: 'i...c..i....c.i.', hats: 'mmommmommmommmom' },
    { name: 'break', bars: 2, noDrums: true, noBass: true, noStabs: true, hats: 'hhhhhhhhhhhhhhhh', perc: ['....c.......c...', 'c.c.c.c.cccccccc'] },
    { name: 'drop', bars: 4, reps: 2, drums: [AMEN[0], CHOP[0], AMEN[2], CHOP[3]], hats: 'h.h.h.hih.h.h.ho', frantic: true },
  ],
});

export const STAGE_SONG = { docks: 'harborBreak', skyway: 'skyway2000', neon: 'neonHard', warehouse: 'arachne', bonus: 'serverRush', menu: 'bootSeq' };
