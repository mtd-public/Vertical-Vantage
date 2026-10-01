// Procedural music (no audio files), all Web Audio. Songs are data: tempo, a 4-bar (or 8-bar) chord loop, drum
// lanes, a bass line, a chord/lead flavour and a tune: either a note-name hook (hook / hookVoice) or a written
// MIDI melody (melody / mel). Families: Y2K electronic-jazz chords over chopped breakcore-ish drums; bright,
// bouncy jungle-break day tracks with FM / detuned-saw hero leads and acid bass (Bomberman Hero-ish); sunny
// mid-90s 3D-platformer tunes (flute, chip, sax, plucks, brass); dark night techno (Ghost in the Shell PS1-ish:
// sub / reese bass, pumping pads, odd-length arps, metallic hats); hard night metal (distorted power chords).
// In slow-mo the current song speeds up (tempo + pitch, like a tape running fast) in sync with the visuals.
//   menu      lounge       mellow bossa-ish Y2K lounge, 118 bpm, soft kit, vibes hook
//   levels    lawntape     the original: 172 bpm, Dm9 · G13 · Cmaj9 · A7♯5, FM e-piano hook
//             skygarden    upbeat major-seven bounce, 164 bpm, square arp + hero-lead hook
//             jumpstart    G mixolydian jungle, 172 bpm, amen chops, acid bass, offbeat stabs, saw hero hook
//             pollenrun    E♭ major bounce, 164 bpm, rimshots, octave bass, bright FM bell hook
//             hedgerow     A mixolydian breakbeat, 168 bpm, bouncy square bass, arp, brassy FM hook
//             sprinkler    breezy B♭ flute tune, 168 bpm
//             hedgehop     swung A-major chiptune hop, 176 bpm
//             clippings    ii-V-I jazz with a sax line, swung, 160 bpm
//             sunporch     E♭ plucks and bells, chord stabs, 170 bpm
//             springheel   bright F-major brass hook over a springy octave bass, 132 bpm (Hop Scotch's song)
//             moonbounce   G-major plucks and bells, rhodes stabs, 126 bpm
//             hopgarden    swung C-major flute tune over arps, 138 bpm
//   night     nightshift   minor, half-time dub-breaks, 150 bpm, darker voicings, glass-bell hook
//             wetware      C phrygian four-on-the-floor, 138 bpm, pumping pad, reese bass, 6-step arp
//             netdive      F phrygian broken techno, 145 bpm, squelchy acid line, metallic 16ths
//             ghostline    D minor deep techno, 132 bpm, sub bass, detuned pads, 7-step arp, ghost hook
//             doomtractor  E-phrygian chug riff in distorted power chords, pounding kicks, 178 bpm
//             scrapheap    D-minor industrial: grinding stabs under a screaming saw lead, 172 bpm
//             nightraid    C♯-minor gabber-metal: kick on every beat, power-chord riff, 186 bpm
//   stencils  stencilrush  frantic amen chops, 196 bpm
//             linework     G-minor arps and stabs, 192 bpm
//             spraycan     C-minor chip hook over rolling chops, 188 bpm
//   rush      boulder      F-minor chip chase, pumping octave bass, 200 bpm
//             sprint       E-minor saw lead, driving breaks, 190 bpm
//   sports    halftime     stomp-stomp-clap stadium anthem with brass, 160 bpm
//             touchdown    marching band: snare rolls, brass stabs, piccolo, 172 bpm
//   crop      cropcircle   the Crop pack by day: F-lydian bounce, whole-tone saucer hook, drifting 7-step arp, 150 bpm
//             abductee     ...by night (and in the night set): E phrygian-dominant techno, reese bass, 136 bpm
//   boss      bossfight    Big Trouble (Frog, Cat): D-minor acid anthem, stabs, saw hero hook, 168 bpm
//             mothership   the UFO boss: B-minor sci-fi metal, grinding stabs, saw arps, 176 bpm
//   gas       gaspanic     frantic, rolling hats, rising chords, 184 bpm
//   gold      golden       Victory Lap: warm D-major flute tune over a soft kit, 140 bpm, 8 bars ending
//                          ♭VI–♭VII–I; from the moment the Golden Gas Can appears until you leave the level
// A level with several songs to choose from always gets the same one (picked by its id), unless skipped.
// A lookahead scheduler in 16th-note steps: each frame we schedule the notes due in the next ~0.2 s.
// Voices are a few oscillators each, freed as soon as they end (cheap enough for phones).
const MIDI = (m) => 440 * 2 ** ((m - 69) / 12);
const STEPS = 16;

// Song fields (all but name / bpm / chords / drums optional):
//   chords  [[bass root, [voicing]], ...] one per bar (4 or 8 bars)
//   drums   one 16-char string per bar. k kick, s snare, g ghost snare, r snare roll (32nds), h hat, o open hat,
//           m metallic hat, i rim click, c clap, . rest
//   hats / perc  extra drum lanes (same letters), a string (every bar) or one per bar
//   bass    8th-note offsets from the chord root (the classic walking bass), or
//   bassLine  16-token bars (string or array) of semitones above the chord root: '0', '12', '.', '-' (hold),
//             '!' accent, '^' slide in (acid glide); bassVoice: 'acid' | 'sub' | 'reese' | 'bounce'; bassOct
//   lead    flavour: 'bells' | 'arp' | 'vibes' (little extras over rhodes chords), 'pad' / 'darkpad' (chords as
//           pads), 'stab' (short bright chord stabs); comp: a 16-char 'x' pattern for when chords hit
//   stabs   16 chars, x = hit the chord, short, played by stabVoice ('rhodes', 'brass' or 'grind': a distorted
//           power chord on the chord's root)
//   hook    lead melody, one 16-token bar per entry ('C5', 'F#4', 'Bb5', '-' hold, '.' rest, '!' accent;
//           '' = a bar of rest), loops over its own length; hookVoice: 'hero' | 'fm' | 'brass' | 'glass' | 'vibes'
//   melody  a written tune: 8 eighth-notes per bar, MIDI numbers, 0 = rest (a note rings through the rests after
//           it); mel: 'flute' | 'chip' | 'sax' | 'pluck' | 'saw' | 'brass' | 'grind'
//   arp     { seq: voicing indices (4+ = an octave up), oct, every: steps per note, vol }: a pluck arpeggio whose
//           filter slowly breathes; an odd-length seq drifts against the bar (hypnotic)
//   swing (0..0.3 of a 16th: late off-beats), hard (night metal: a chugging distorted bass on every 16th and a
//   beater click on the kick), dark (closes the master filter to lp, default 3200), pump (pads + sub duck under
//   the kick), kick: 'deep', echo (send into a dotted-8th echo for leads), soft, frantic
export const SONGS = {
  lawntape: {
    name: 'Lawn Tape', bpm: 172, lead: 'bells', hookVoice: 'fm',
    chords: [[38, [53, 57, 60, 64]], [43, [53, 57, 59, 64]], [36, [52, 55, 59, 62]], [45, [55, 61, 65, 67]]],
    drums: ['k.h.s.hkh.ks.hsh', 'k.hks.h.hkk.s.hs', 'k.h.s.hkh.ks.hsh', 'k.hks.hkrrrrs.rr'],
    bass: [0, 3, 7, 10, 12, 10, 7, 3],
    hook: [
      'A4 . C5 . E5 - - . D5 . C5 . A4 - . .', 'B4 . D5 . E5 - - . D5 . B4 . G4 - - .',
      'E4 . G4 . B4 - D5 - - - . . B4 . G4 .', 'C#5 - - . A4 . F4 - - - G4 . A4 - . .',
      'F5 - E5 . D5 . C5 . D5 - - . A4 . C5 .', 'B4 - - . G4 . B4 . D5 . E5 - - - . .',
      'D5 . E5 . G5 - - . E5 . D5 . B4 - - .', 'C#5 . A4 . G5 - - - F5 - - - C#5 - . .',
      '', '', '', '',
    ],
  },
  skygarden: {
    name: 'Sky Garden', bpm: 164, lead: 'arp', hookVoice: 'hero',
    chords: [[41, [57, 60, 64, 67]], [40, [55, 59, 62, 67]], [38, [57, 60, 64, 65]], [36, [55, 59, 64, 62]]], // Fmaj9 · Em7 · Dm9 · Cmaj9
    drums: ['k.hhs.hkkhh.s.ho', 'k.hhs.hk.hkks.ho', 'k.hhs.hkkhh.s.hh', 'k.hks.hkk.rrs.rr'],
    bass: [0, 7, 12, 7, 0, 7, 10, 12],
    hook: [
      'C5 . A4 . C5 . E5 - G5 - E5 . C5 . A4 .', 'B4 . G4 . B4 . D5 - E5 - D5 . B4 . G4 .',
      'A4 . F4 . A4 . C5 - E5 - C5 . A4 . F4 .', 'G4 . E4 . G4 . B4 - D5 - - - . . . .',
      '', '', '', '',
    ],
  },
  jumpstart: {
    name: 'Jump Start', bpm: 172, lead: 'stab', comp: '..x...x...x...x.', hookVoice: 'hero', bassVoice: 'acid', bassOct: 0, echo: 0.22,
    chords: [[43, [59, 62, 67, 69]], [41, [57, 60, 62, 67]], [36, [55, 59, 62, 64]], [38, [54, 57, 60, 64]]], // Gadd9 · F6/9 · Cmaj9 · D9 (G mixolydian)
    drums: ['k.k.s..g.skks..g', 'k.k.s..g.s..s.kg', 'k.k.s..g.skks..g', 'k.k.s..gk.rrs.rr'],
    hats: 'h.h.h.hih.h.h.ho',
    bassLine: '0! . 12 . 0 0 12 . 0! . 12 . 10 . 7 12^',
    hook: [
      'G4 . B4 . D5 . G5 - . . F5 . D5 . B4 .', 'A4 . C5 . F5 . A5 - . . G5 . F5 . C5 .',
      'G4 . C5 . E5 . G5 - . . A5 . G5 . E5 .', 'F#5 . . D5 . . A5 . . F#5 . E5 - . D5 .',
      'B5 - . A5 . G5 . . D5 - . . G5 . A5 .', 'C6 - . A5 . F5 . . C5 - . . F5 . G5 .',
      'G5 - . E5 . C5 . . E5 . G5 . A5 . B5 .', 'A5 - - . F#5 - - . D5 - . E5 . F#5 . .',
      '', '', '', '',
    ],
  },
  pollenrun: {
    name: 'Pollen Run', bpm: 164, hookVoice: 'fm', echo: 0.2,
    chords: [[39, [55, 58, 62, 65]], [36, [51, 55, 58, 62]], [44, [51, 55, 58, 60]], [46, [53, 56, 60, 63]]], // E♭maj9 · Cm9 · A♭maj9 · B♭11
    drums: ['k.h.s.hkh.k.s.hh', 'k.hks.h.h.kks.ho', 'k.h.s.hkh.k.s.hh', 'k.h.s.hkk.rrs.rr'],
    perc: '...i..i....i..i.',
    bass: [0, 12, 0, 12, 7, 12, 10, 12],
    hook: [
      'Bb4 . Eb5 . F5 . G5 . . Bb5 . G5 . F5 Eb5 .', 'G5 . . F5 . Eb5 . . D5 - - . Bb4 . C5 .',
      'Eb5 . Ab5 . G5 . Eb5 . . C5 . Eb5 . G5 Bb5 .', 'Ab5 - - . G5 . F5 . . Eb5 - - F5 - - .',
      'Bb4 . Eb5 . F5 . G5 . . Bb5 . G5 . F5 Eb5 .', 'G5 . . F5 . Eb5 . . D5 - - . Bb4 . C5 .',
      'Eb5 . Ab5 . G5 . Eb5 . . C5 . Eb5 . G5 Bb5 .', 'Bb5 - - . G5 - - . F5 - - - Eb5 - - -',
      '', '', '', '',
    ],
  },
  hedgerow: {
    name: 'Hedgerow', bpm: 168, lead: 'arp', hookVoice: 'brass', bassVoice: 'bounce', bassOct: 0, echo: 0.18,
    chords: [[45, [55, 59, 61, 64]], [43, [55, 57, 59, 62]], [38, [54, 57, 62, 64]], [40, [57, 59, 62, 64]]], // A9 · Gadd9 · Dadd9 · E7sus4 (A mixolydian)
    drums: ['k...s..kk.k.s...', 'k...s..kk...s.kg', 'k...s..kk.k.s...', 'k...s..kk.k.rrrr'],
    hats: 'h.hoh.hih.hoh.hi',
    bassLine: '0! . 0 12 . 0 . 10 0! . 0 12 . 7 . 12',
    hook: [
      'E5 . E5 . A5 . E5 . G5 - . E5 . D5 C#5 .', 'D5 . D5 . G5 . D5 . B4 - - . A4 . B4 .',
      'F#5 . E5 . D5 . A4 . D5 . E5 . F#5 - A5 .', 'G5 - - . E5 - - . D5 - . B4 - - . .',
      'A5 . G5 . E5 . G5 . A5 - . C#6 . A5 . .', 'B5 . A5 . G5 . D5 . G5 - . B5 . D6 . .',
      'A5 . F#5 . E5 . D5 . E5 . F#5 . A5 - D6 .', 'E6 - - . D6 - - . B5 - . A5 - - . .',
      '', '', '', '',
    ],
  },
  nightshift: {
    name: 'Night Shift', bpm: 150, lead: 'pad', dark: true, kick: 'deep', hookVoice: 'glass', echo: 0.35,
    chords: [[36, [51, 55, 58, 62]], [44, [55, 60, 63, 67]], [41, [51, 56, 60, 63]], [43, [53, 56, 59, 62]]], // Cm9 · Abmaj7 · Fm9 · G7♭9
    drums: ['k.......s..k..g.', 'k..k....s...g.s.', 'k.......s..k..g.', 'k..k..k.s.rrs.rr'],
    bass: [0, 0, 12, 0, 7, 0, 10, 0],
    hook: [
      'G5 - - - . . D5 - - - Eb5 - - - . .', 'C5 - - - . . Eb5 - G5 - - - . . . .',
      'Ab5 - - - G5 - - - F5 - - - Eb5 - - -', 'D5 - - - . . B4 - - - . . . . . .',
      '', '', '', '',
    ],
  },
  wetware: {
    name: 'Wetware', bpm: 138, lead: 'darkpad', dark: true, lp: 9000, pump: true, kick: 'deep', bassVoice: 'reese', hookVoice: 'glass', echo: 0.35,
    chords: [[36, [51, 55, 58, 65]], [37, [53, 56, 60, 63]], [36, [51, 55, 58, 65]], [46, [53, 56, 58, 61]]], // Cm11 · D♭maj9 · Cm11 · B♭m7 (C phrygian)
    drums: ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k...k.kk'],
    perc: ['....c.......c...', '....c.......c..i', '....c...i...c...', '....c.......cici'],
    hats: 'h.mhh.mhh.mhh.mh',
    bassLine: '. . 0 - . . 0 - . . 0 - . . 0 1',
    arp: { seq: [0, 2, 1, 3, 2, 4], oct: 12, every: 1, vol: 0.02 },
    hook: [
      '', '', '', '',
      '. . . . . . . . G5 - - - Ab5 - - -', 'F5 - - - - - - - Eb5 - - - C5 - - -',
      '. . . . . . . . G5 - - - Bb5 - - -', 'Ab5 - - - - - - - F5 - - - Db5 - - -',
    ],
  },
  netdive: {
    name: 'Net Dive', bpm: 145, lead: 'darkpad', dark: true, lp: 11000, kick: 'deep', bassVoice: 'acid', bassOct: 0, hookVoice: 'glass', echo: 0.3,
    chords: [[41, [53, 56, 60, 63]], [42, [54, 58, 61, 65]], [41, [53, 56, 60, 63]], [39, [51, 54, 58, 61]]], // Fm7 · G♭maj7 · Fm7 · E♭m7 (F phrygian)
    drums: ['k...s..k..k.s...', 'k...s..k..k.s..g', 'k...s..k.k..s.k.', 'k...s..k..k.rrss'],
    hats: 'm.mim.m.m.mim.mm',
    bassLine: ['0! 0 12 0 . 0 3 . 0! 0 12^ 10 . 0 7 0', '0! . 0 12 0 . 1^ 0 0! 0 . 12 10^ 7 3 0'],
    hook: ['', '', 'C6 - - . . . Db6 - - . . . C6 - - .', 'Bb5 - - . . . Ab5 - - . . . Gb5 - - .'],
  },
  ghostline: {
    name: 'Ghost Line', bpm: 132, lead: 'darkpad', dark: true, lp: 7000, pump: true, kick: 'deep', bassVoice: 'sub', hookVoice: 'glass', echo: 0.4,
    chords: [[38, [53, 57, 60, 64]], [46, [50, 53, 57, 60]], [43, [50, 53, 57, 58]], [45, [50, 52, 55, 58]]], // Dm9 · B♭maj9 · Gm6/9 · A7sus♭9
    drums: ['k.....k.s.k.....', 'k.....k.s.....ki', 'k.....k.s.k.....', 'k.....k.s.k.cici'],
    perc: '........c.......',
    hats: '..m.h.m...m.h.mh',
    bassLine: '0 - - - - - 0 - - - 0 - - - 7 -',
    arp: { seq: [0, 3, 1, 2, 3, 0, 2], oct: 12, every: 2, vol: 0.024 },
    hook: [
      'A4 - - - - - . . C5 - D5 - - - - -', 'F5 - - - E5 - - - D5 - - - C5 - - -',
      'D5 - - - - - . . Bb4 - A4 - - - - -', 'G4 - - - - - . . A4 - - - - - - -',
      '', '', '', '',
    ],
  },
  lounge: {
    name: 'Lounge', bpm: 118, lead: 'vibes', soft: true, hookVoice: 'vibes',
    chords: [[43, [53, 57, 59, 64]], [36, [52, 55, 59, 62]], [45, [55, 60, 64, 67]], [38, [53, 57, 60, 64]]], // G13 · Cmaj9 · Am9 · Dm9
    drums: ['k..hg.h.k.h.g.h.', 'k..hg.hkk.h.g.hh', 'k..hg.h.k.h.g.h.', 'k..hg.hkk.hhg.ho'],
    bass: [0, 7, 0, 7, 12, 7, 5, 7],
    hook: [
      '', '', '', '',
      '. . . . B4 - D5 . E5 - - - . . . .', '. . D5 . E5 . G5 - - - B4 - - - . .',
      '. . . . C5 - B4 . A4 - - - E5 - - -', '. . F5 . E5 . D5 - - - C5 - - - . .',
    ],
  },
  stencilrush: {
    name: 'Stencil Rush', bpm: 196, lead: 'arp', frantic: true,
    chords: [[40, [55, 59, 62, 66]], [45, [55, 60, 64, 67]], [38, [54, 57, 60, 64]], [47, [57, 62, 63, 66]]], // Em9 · Am7 · D9 · B7♯9
    drums: ['krhsrkhskrhsrrss', 'kkhsrkhskrkkrrsr', 'krhsrkhskrhsrrss', 'krrrsrrrkrrrsrrr'],
    bass: [0, 12, 0, 10, 0, 12, 7, 10],
  },
  gaspanic: {
    name: 'Gas Panic', bpm: 184, lead: 'bells', frantic: true,
    chords: [[36, [52, 55, 58, 62]], [38, [53, 57, 60, 64]], [40, [55, 59, 62, 66]], [43, [53, 57, 59, 65]]], // C9 · Dm9 · Em9 · G7 (rising)
    drums: ['khhhshhhkhkhshhh', 'khkhshhhkhhhshrr', 'khhhshhhkhkhshhh', 'kkhhskhhkrrrsrrr'],
    bass: [0, 0, 12, 0, 0, 12, 10, 7],
  },
  sprinkler: {
    name: 'Sprinkler', bpm: 168, mel: 'flute',
    chords: [[34, [57, 60, 62, 65]], [43, [57, 58, 62, 65]], [39, [55, 58, 62, 65]], [41, [57, 62, 63, 67]]], // B♭maj9 · Gm9 · E♭maj9 · F13
    drums: ['k.hkg.h.k.hks.h.', 'k.h.s.hkk.h.sghs', 'k.hkg.h.k.hks.h.', 'k.h.s.hkkrrrs.rr'],
    bass: [0, 7, 12, 7, 10, 7, 12, 14],
    melody: [74, 0, 72, 70, 72, 0, 77, 0, 74, 0, 0, 72, 70, 0, 67, 0, 70, 0, 74, 0, 77, 79, 77, 0, 81, 0, 79, 0, 75, 0, 74, 0],
  },
  hedgehop: {
    name: 'Hedge Hop', bpm: 176, mel: 'chip', swing: 0.12,
    chords: [[45, [56, 59, 61, 64]], [42, [57, 61, 64, 68]], [38, [54, 57, 61, 64]], [40, [56, 61, 62, 66]]], // Amaj9 · F♯m9 · Dmaj9 · E13
    drums: ['k.h.shhkk.h.shho', 'k.hks.h.k.hks.hh', 'k.h.shhkk.h.shho', 'k.hks.hkrrrrsrrr'],
    bass: [0, 12, 7, 12, 0, 12, 10, 7],
    melody: [76, 73, 71, 73, 76, 0, 78, 76, 73, 0, 71, 69, 71, 0, 0, 0, 69, 71, 73, 76, 78, 0, 81, 0, 80, 0, 78, 0, 76, 74, 73, 71],
  },
  clippings: {
    name: 'Clippings', bpm: 160, mel: 'sax', swing: 0.2,
    chords: [[40, [55, 59, 62, 66]], [45, [55, 59, 61, 66]], [38, [54, 57, 61, 64]], [47, [54, 57, 61, 62]]], // Em9 · A13 · Dmaj9 · Bm9
    drums: ['k..hs.hkh.k.s.hg', 'k.hhs.h..hk.s.hh', 'k..hs.hkh.k.s.hg', 'k.hhs.hkk.rrsrrr'],
    bass: [0, 7, 12, 10, 7, 5, 7, 12],
    melody: [71, 0, 74, 0, 76, 74, 71, 0, 73, 0, 0, 71, 69, 0, 66, 0, 69, 0, 73, 0, 76, 0, 78, 0, 74, 0, 73, 0, 71, 0, 0, 0],
  },
  sunporch: {
    name: 'Sun Porch', bpm: 170, lead: 'bells', mel: 'pluck', stabs: 'x.....x...x..x..',
    chords: [[39, [55, 58, 62, 65]], [36, [55, 58, 62, 63]], [44, [55, 58, 60, 63]], [46, [56, 60, 62, 67]]], // E♭maj9 · Cm9 · A♭maj9 · B♭13
    drums: ['kkh.s.h.k.hks.hh', 'k.h.s.hkkkh.s.hs', 'kkh.s.h.k.hks.hh', 'k.h.s.hkrrrrrrss'],
    bass: [0, 12, 0, 7, 10, 12, 7, 5],
    melody: [79, 0, 77, 75, 0, 70, 72, 0, 75, 0, 0, 0, 72, 70, 67, 0, 72, 0, 75, 0, 77, 79, 0, 82, 80, 0, 79, 0, 77, 0, 74, 0],
  },
  linework: {
    name: 'Linework', bpm: 192, lead: 'arp', frantic: true, stabs: 'x..x..x...x..x..',
    chords: [[43, [57, 58, 62, 65]], [39, [55, 58, 62, 65]], [36, [55, 58, 62, 63]], [38, [54, 60, 65, 69]]], // Gm9 · E♭maj9 · Cm9 · D7♯9
    drums: ['k.hsrkhs.kh.srhs', 'k.hsrkhskkh.srrs', 'k.hsrkhs.kh.srhs', 'krrsrkrskrrsrrrr'],
    bass: [0, 7, 0, 12, 0, 7, 10, 7],
  },
  spraycan: {
    name: 'Spray Can', bpm: 188, mel: 'chip', frantic: true,
    chords: [[36, [51, 55, 58, 62]], [41, [51, 55, 56, 60]], [44, [51, 55, 58, 60]], [43, [53, 58, 59, 63]]], // Cm9 · Fm9 · A♭maj9 · G7♯5♯9
    drums: ['khshkhsrkhsrkrsh', 'khshkhsrkkshrrsh', 'khshkhsrkhsrkrsh', 'krsrkrsrkrrrsrrr'],
    bass: [0, 12, 10, 12, 0, 12, 7, 10],
    melody: [75, 74, 72, 0, 75, 74, 72, 67, 68, 0, 72, 0, 75, 0, 72, 0, 75, 74, 72, 0, 79, 77, 75, 74, 71, 0, 74, 0, 77, 0, 79, 0],
  },
  boulder: {
    name: 'Boulder', bpm: 200, mel: 'chip', frantic: true,
    chords: [[41, [56, 60, 63, 67]], [37, [53, 56, 60, 63]], [39, [56, 58, 61, 65]], [36, [52, 58, 63, 67]]], // Fm9 · D♭maj9 · E♭sus · C7♯9
    drums: ['khkhskhkkhkhskhr', 'khkhskhkkhkksrkr', 'khkhskhkkhkhskhr', 'krkrsrkrkrkrsrrr'],
    bass: [0, 12, 0, 12, 0, 12, 10, 12],
    melody: [72, 72, 75, 72, 77, 0, 75, 72, 72, 0, 70, 68, 70, 0, 72, 0, 70, 70, 72, 70, 73, 0, 72, 70, 67, 0, 70, 0, 72, 75, 76, 79],
  },
  sprint: {
    name: 'Sprint', bpm: 190, mel: 'saw', frantic: true,
    chords: [[40, [55, 59, 62, 66]], [36, [55, 59, 62, 64]], [45, [55, 59, 60, 64]], [47, [57, 60, 63, 66]]], // Em9 · Cmaj9 · Am9 · B7♭9
    drums: ['k.hkshhkk.hks.hh', 'k.hkshhkk.hksrrr', 'k.hkshhkk.hks.hh', 'krrks.rrk.rrsrrr'],
    bass: [0, 0, 12, 0, 7, 0, 10, 12],
    melody: [76, 0, 79, 0, 83, 0, 81, 79, 79, 0, 0, 76, 74, 0, 76, 0, 72, 0, 76, 0, 79, 0, 84, 83, 81, 0, 78, 0, 75, 0, 71, 0],
  },
  halftime: {
    name: 'Halftime', bpm: 160, mel: 'brass',
    chords: [[36, [52, 57, 62, 67]], [45, [55, 60, 64, 71]], [41, [57, 60, 64, 67]], [43, [53, 59, 64, 69]]], // C6/9 · Am9 · Fmaj9 · G13
    drums: ['k.h.k.h.c.h.hhc.', 'k.h.k.h.c.hkh.ch', 'k.h.k.h.c.h.hhc.', 'k.k.k.k.crcrrrrr'],
    bass: [0, 7, 12, 7, 0, 7, 12, 14],
    melody: [67, 0, 72, 0, 76, 0, 74, 72, 72, 0, 0, 0, 69, 0, 67, 0, 69, 0, 72, 0, 77, 0, 76, 74, 74, 0, 0, 0, 71, 0, 67, 0],
  },
  touchdown: {
    name: 'Touchdown', bpm: 172, mel: 'flute', stabs: 'x...x.x...x.x...', stabVoice: 'brass',
    chords: [[34, [55, 60, 62, 65]], [43, [57, 58, 62, 65]], [36, [55, 58, 62, 63]], [41, [57, 62, 63, 67]]], // B♭6/9 · Gm9 · Cm9 · F13
    drums: ['k.rsk.c.k.rsk.ss', 'k.rsk.c.k.rskrrr', 'k.rsk.c.k.rsk.ss', 'krrrcrrrkrrrcrrr'],
    bass: [0, 7, 12, 7, 0, 7, 12, 7],
    melody: [82, 0, 86, 0, 89, 0, 86, 0, 89, 0, 91, 89, 86, 0, 82, 0, 87, 0, 86, 0, 84, 0, 82, 84, 86, 0, 84, 0, 81, 0, 77, 0],
  },
  springheel: {
    name: 'Spring Heel', bpm: 132, mel: 'brass', stabs: '..x...x...x..x..', stabVoice: 'rhodes',
    chords: [[41, [57, 60, 64, 65]], [38, [53, 57, 60, 64]], [34, [57, 60, 62, 65]], [36, [55, 58, 62, 65]]], // Fmaj7 · Dm9 · B♭maj13 · C9sus
    drums: ['k.h.s.hkk.h.s.hh', 'k.h.s.hkk.hks.ho', 'k.h.s.hkk.h.s.hh', 'k.h.s.hkk.hksrrr'],
    bass: [0, 12, 0, 12, 7, 12, 10, 12],
    melody: [72, 0, 77, 0, 76, 74, 72, 0, 69, 0, 72, 74, 77, 0, 76, 0, 74, 0, 72, 70, 69, 0, 70, 72, 74, 0, 0, 79, 77, 0, 76, 0],
  },
  moonbounce: {
    name: 'Moon Bounce', bpm: 126, lead: 'bells', mel: 'pluck', stabs: 'x..x..x.x..x..x.', stabVoice: 'rhodes',
    chords: [[43, [54, 57, 59, 62]], [40, [54, 55, 59, 62]], [36, [55, 59, 62, 64]], [38, [54, 59, 60, 64]]], // Gmaj9 · Em9 · Cmaj9 · D13
    drums: ['k..hs.hkk.h.s.hh', 'k..hs.hkk.hks.ho', 'k..hs.hkk.h.s.hh', 'k..hs.hkkrhksrrr'],
    bass: [0, 0, 12, 0, 7, 0, 12, 10],
    melody: [79, 0, 78, 79, 0, 74, 71, 0, 76, 0, 74, 76, 0, 71, 67, 0, 72, 74, 76, 0, 79, 0, 76, 74, 78, 0, 76, 0, 74, 0, 0, 0],
  },
  hopgarden: {
    name: 'Hop Garden', bpm: 138, lead: 'arp', mel: 'flute', swing: 0.12,
    chords: [[36, [55, 59, 62, 64]], [45, [55, 61, 64, 67]], [38, [53, 57, 60, 64]], [43, [53, 59, 64, 69]]], // Cmaj9 · A7 · Dm9 · G13
    drums: ['k.hhs.hkk.hhs.hh', 'k.hhs.hkk.hks.ho', 'k.hhs.hkk.hhs.hh', 'k.hhs.hkkrrks.rr'],
    bass: [0, 7, 12, 7, 0, 7, 10, 7],
    melody: [76, 0, 79, 0, 84, 0, 79, 76, 73, 0, 76, 0, 79, 0, 81, 0, 77, 0, 76, 74, 72, 0, 74, 0, 71, 0, 74, 0, 79, 0, 0, 0],
  },
  doomtractor: {
    name: 'Doom Tractor', bpm: 178, mel: 'grind', hard: true, stabs: 'x.....x.....x...', stabVoice: 'grind',
    chords: [[40, [52, 59, 64, 67]], [41, [53, 60, 65, 68]], [38, [50, 57, 62, 65]], [40, [52, 59, 64, 68]]], // Em · F · Dm · E (phrygian)
    drums: ['k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hk', 'k.hks.hkkrrrsrrr'],
    bass: [0, 0, 12, 0, 0, 1, 0, 3],
    melody: [52, 0, 0, 52, 53, 0, 52, 0, 53, 0, 0, 55, 53, 0, 52, 0, 50, 0, 0, 50, 52, 0, 53, 0, 55, 0, 53, 0, 52, 0, 50, 52],
  },
  scrapheap: {
    name: 'Scrap Heap', bpm: 172, mel: 'saw', hard: true, stabs: '.x..x...x.x..x..', stabVoice: 'grind',
    chords: [[38, [50, 57, 62, 65]], [34, [46, 53, 58, 62]], [36, [48, 55, 60, 64]], [33, [45, 52, 57, 61]]], // Dm · B♭ · C · A
    drums: ['kkh.skh.kkh.skhh', 'kkh.skh.kkh.skhr', 'kkh.skh.kkh.skhh', 'kkh.skh.krrrsrrr'],
    bass: [0, 0, 12, 0, 0, 7, 0, 10],
    melody: [74, 0, 77, 0, 81, 0, 79, 77, 77, 0, 74, 0, 70, 0, 74, 0, 76, 0, 79, 0, 84, 0, 81, 79, 81, 0, 0, 0, 76, 0, 73, 0],
  },
  nightraid: {
    name: 'Night Raid', bpm: 186, mel: 'grind', hard: true, frantic: true,
    chords: [[37, [49, 56, 61, 64]], [33, [45, 52, 57, 61]], [35, [47, 54, 59, 63]], [32, [44, 51, 56, 60]]], // C♯m · A · B · G♯
    drums: ['k.k.skk.k.k.skkh', 'k.k.skk.k.k.skrr', 'k.k.skk.k.k.skkh', 'k.k.skk.krrrsrrr'],
    bass: [0, 0, 0, 12, 0, 0, 7, 0],
    melody: [61, 0, 61, 64, 0, 61, 66, 64, 57, 0, 57, 61, 0, 57, 64, 61, 59, 0, 59, 63, 0, 59, 66, 64, 68, 0, 67, 0, 66, 0, 64, 63],
  },
  cropcircle: { // the Crop pack by day: a floaty lydian bounce, a whole-tone "saucer" hook, a 7-step arp drifting against the bar
    name: 'Crop Circle', bpm: 150, lead: 'arp', hookVoice: 'fm', bassVoice: 'bounce', bassOct: 0, echo: 0.3, swing: 0.08,
    chords: [[41, [57, 60, 64, 71]], [43, [57, 59, 62, 65]], [45, [55, 60, 64, 71]], [40, [55, 59, 62, 66]]], // Fmaj7♯11 · G9 · Am(add9) · Em9
    drums: ['k..hs.hkk.h.s.hh', 'k..hs.hkk.hks.ho', 'k..hs.hkk.h.s.hh', 'k..hs.hkkrhksrrr'],
    bassLine: '0 . 12 . 0 . 7 . 0 . 12 . 10^ . 7 .',
    arp: { seq: [0, 2, 1, 3, 2, 4, 3], oct: 12, every: 1, vol: 0.02 },
    hook: ['C6 - - - B5 - - - A5 - - - G5 - - -', '. . . . E5 - G5 - B5 - - - - - . .', 'C6 - D6 - E6 - - - D6 - C6 - B5 - - -', 'A5 - - - - - - - . . . . . . . .'],
  },
  abductee: { // the Crop pack by night (and a night-set track): E phrygian-dominant techno, reese bass, a 9-step arp, a glassy hook
    name: 'Abductee', bpm: 136, lead: 'darkpad', dark: true, lp: 8000, pump: true, kick: 'deep', bassVoice: 'reese', hookVoice: 'glass', echo: 0.4,
    chords: [[40, [52, 56, 59, 62]], [41, [53, 57, 60, 64]], [38, [50, 53, 57, 60]], [40, [52, 56, 59, 65]]], // E7 · Fmaj7 · Dm7 · E7♭9
    drums: ['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k...kkkk'],
    perc: ['....c.......c...', '....c.......c..i', '....c...i...c...', '....c.......cici'],
    hats: 'm.hmm.hmm.hmm.hm',
    bassLine: '0 - . 0 . . 1 - . 0 . . 0 - 12 .',
    arp: { seq: [0, 1, 2, 3, 1, 2, 0, 3, 2], oct: 12, every: 1, vol: 0.02 },
    hook: ['', '', 'E5 - - - F5 - - - G#5 - - - - - . .', 'B5 - - - A5 - G#5 - F5 - - - E5 - - -', '', '', 'D6 - - - C6 - - - B5 - - - G#5 - - -', 'A5 - - - G#5 - F5 - E5 - - - - - - -'],
  },
  mothership: { // the UFO boss: B-minor sci-fi metal, grinding stabs, a saw lead arpeggiating up through ♭II
    name: 'Mothership', bpm: 176, mel: 'saw', hard: true, frantic: true, stabs: 'x..x..x...x..x..', stabVoice: 'grind',
    chords: [[35, [47, 54, 59, 62]], [36, [48, 52, 55, 60]], [33, [45, 52, 57, 60]], [34, [46, 50, 53, 58]]], // Bm · C · Am · B♭
    drums: ['k.hks.hkk.hks.hk', 'k.hks.hkk.hks.hr', 'k.hks.hkk.hks.hk', 'k.hksrrkkrrrsrrr'],
    bass: [0, 0, 12, 0, 0, 1, 0, 3],
    melody: [71, 0, 74, 0, 78, 0, 77, 74, 72, 0, 76, 0, 79, 0, 78, 76, 69, 0, 72, 0, 76, 0, 74, 72, 70, 0, 74, 0, 77, 0, 76, 74],
  },
  bossfight: { // the Frog and the Cat: a D-minor hero-in-trouble anthem, acid bass, stabbed chords, saw hero hook
    name: 'Big Trouble', bpm: 168, lead: 'stab', comp: 'x..x..x...x..x..', hookVoice: 'hero', bassVoice: 'acid', bassOct: 0, echo: 0.2,
    chords: [[38, [53, 57, 60, 64]], [34, [50, 53, 57, 62]], [36, [52, 55, 60, 62]], [33, [49, 52, 55, 57]]], // Dm9 · B♭maj7 · C(add9) · A7
    drums: ['k.h.s.hkk.hks.hh', 'k.hks.hkk.hks.ho', 'k.h.s.hkk.hks.hh', 'k.hks.hkkrrks.rr'],
    bassLine: '0! 0 12 0 . 0 12^ 10 0! 0 . 12 7 . 5 3',
    hook: ['D5 - - - F5 - A5 - - - G5 - F5 - E5 -', 'D5 - - - - - . . A4 - - - D5 - - -', 'Bb4 - C5 - D5 - F5 - - - E5 - D5 - C5 -', 'C#5 - - - E5 - - - A5 - - - - - . .'],
  },
  golden: { // 8 bars, so the victory lap doesn't loop too soon: IV V iii vi, then IV ♭VI ♭VII I (the "you did it" lift)
    name: 'Victory Lap', bpm: 140, mel: 'flute', soft: true,
    chords: [[43, [54, 57, 59, 62]], [45, [55, 59, 61, 66]], [42, [57, 61, 64, 68]], [47, [54, 57, 61, 62]], // Gmaj9 · A13 · F♯m9 · Bm9
      [43, [54, 57, 59, 62]], [46, [57, 60, 62, 65]], [48, [55, 57, 62, 64]], [38, [54, 57, 61, 64]]], //   Gmaj9 · B♭maj9 · C6/9 · Dmaj9
    drums: ['k.h.s.h.k.hks.h.', 'k.h.s.h.kkh.s.ho', 'k.h.s.h.k.hks.h.', 'k.h.s.hkk.h.sgrr'],
    bass: [0, 7, 12, 7, 0, 7, 12, 14],
    melody: [74, 0, 0, 71, 69, 0, 71, 0, 73, 0, 0, 0, 76, 0, 0, 0, 73, 0, 0, 69, 68, 0, 69, 0, 66, 0, 0, 0, 69, 0, 71, 0,
      74, 0, 0, 71, 69, 0, 74, 0, 77, 0, 0, 74, 72, 0, 74, 0, 76, 0, 0, 79, 81, 0, 0, 0, 78, 0, 0, 0, 0, 0, 0, 0],
  },
};

// Note tokens → per-step events ({ m, len, acc, slide } or null). Melody bars use note names (C4 = MIDI 60);
// bass bars use semitones above the chord root. Parsed once at load (plain data work, no audio).
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function parseBar(str, rel) {
  const out = new Array(STEPS).fill(null), toks = String(str || '').trim().split(/\s+/).filter(Boolean);
  let last = null;
  for (let i = 0; i < STEPS; i++) {
    const t = toks[i] || '.';
    if (t === '-') { if (last) last.len++; continue; }
    last = null;
    if (t === '.') continue;
    const body = t.replace(/[!^]/g, '');
    let m = NaN;
    if (rel) m = parseInt(body, 10);
    else {
      const r = /^([A-G])([#b]?)(-?\d)$/.exec(body);
      if (r) m = 12 * (+r[3] + 1) + NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
    }
    if (Number.isFinite(m)) last = out[i] = { m, len: 1, acc: t.includes('!'), slide: t.includes('^') };
  }
  return out;
}
const perBar = (p) => (p == null ? null : Array.isArray(p) ? p : [p]);
function prepSong(S) {
  S._hook = S.hook ? S.hook.map((b) => parseBar(b, false)) : null;
  S._bass = S.bassLine ? perBar(S.bassLine).map((b) => parseBar(b, true)) : null;
  S._hats = perBar(S.hats); S._perc = perBar(S.perc); S._comp = perBar(S.comp);
}
for (const S of Object.values(SONGS)) prepSong(S);

// Vertical Vantage addition: songs made of several LOOPS (sections), played in order, then round again.
//   parts: [{ name, bars, reps, chords?, drums?, hats?, perc?, bassLine?, hook?, comp?,
//             noArp, noPad, noStabs, noBass, noHook, noKick, frantic }]
// Each part inherits the song's fields and overrides what it sets. The parts are flattened into
// per-bar lanes of one common length, so the engine's `bar % length` indexing lines every lane up.
const REST = '................';
export function addSong(key, def) {
  if (!def.parts) { SONGS[key] = def; prepSong(def); return def; }
  const S = { ...def, chords: [], drums: [], hats: [], perc: [], bassLine: [], hook: [], comp: [], _sec: [] };
  const pick = (a, i) => { const l = perBar(a); return l ? l[i % l.length] : null; };
  for (const part of def.parts) {
    const P = { ...def, ...part };
    let k = 0;
    for (let r = 0; r < (part.reps || 1); r++) {
      for (let b = 0; b < part.bars; b++, k++) {
        S.chords.push(pick(P.chords, b));
        S.drums.push(P.noDrums ? REST : pick(P.drums, k) || REST);
        S.hats.push(pick(P.hats, k) || REST);
        S.perc.push(pick(P.perc, k) || REST);
        S.bassLine.push(P.noBass ? '' : pick(P.bassLine, k) || '');
        S.hook.push(P.noHook ? '' : pick(P.hook, k) || '');
        S.comp.push(pick(P.comp, k) || (P.lead === 'darkpad' ? 'x...............' : 'x.........x.....'));
        S._sec.push({ name: P.name, noArp: !!P.noArp, noPad: !!P.noPad, noStabs: !!P.noStabs, noKick: !!P.noKick, frantic: !!P.frantic });
      }
    }
  }
  delete S.parts;
  SONGS[key] = S; prepSong(S);
  return S;
}
export const sectionOf = (S, n) => (S._sec ? S._sec[Math.floor(n / STEPS) % S._sec.length] : null);

// Which song for where you are: menus → lounge; the Golden Gas Can → golden (until you leave the level);
// stencils, rush and sports get their own sets (day or night); gas → gaspanic (a night's extra "low on gas"
// threat keeps its night set; the Gas pack's own nights stay gaspanic); night → the night set; every other
// level gets one of the level songs. Where there's a choice the level's id picks it, so a level always plays
// the same song (and neighbouring levels play different ones), unless the player skipped to another one:
// picks = { [level id]: song key } (Settings › Music › skip).
export const POOLS = {
  level: ['lawntape', 'skygarden', 'sprinkler', 'hedgehop', 'clippings', 'sunporch', 'springheel', 'moonbounce', 'hopgarden', 'jumpstart', 'pollenrun', 'hedgerow'],
  stencil: ['stencilrush', 'linework', 'spraycan'],
  rush: ['boulder', 'sprint'],
  sports: ['halftime', 'touchdown'],
  night: ['nightshift', 'doomtractor', 'scrapheap', 'nightraid', 'wetware', 'netdive', 'ghostline', 'abductee'],
  alien: ['cropcircle', 'moonbounce'], // the Crop pack (751–799) by day
  alienNight: ['abductee', 'netdive'], // ...and by night
  boss: ['bossfight', 'mothership'],
};
export function poolFor(level) {
  if (level.stencil) return 'stencil';
  if (level.rush || level.side) return 'rush';
  if (level.soccerGoals || level.plats?.some((p) => p.pitch)) return 'sports';
  const day = Math.abs(Math.floor(Number(level.id) || 0)) % 1000, gasPack = day >= 400 && day < 500;
  if (level.gas && (gasPack || !level.night)) return null;
  if (level.boss) return 'boss';
  if (day > 750 && day < 800) return level.night ? 'alienNight' : 'alien';
  if (level.night) return 'night';
  return 'level';
}
export function songFor(level, menu, { gold = false, picks = {} } = {}) {
  if (menu || !level) return 'lounge';
  if (gold) return 'golden';
  if (level.music && SONGS[level.music]) return level.music; // (the level editor can pick a level's song)
  const pool = poolFor(level), list = POOLS[pool];
  if (!list) return 'gaspanic';
  const picked = picks[level.id];
  if (list.includes(picked)) return picked;
  if (list.includes(level.song)) return level.song; // (level.song: its default, still skippable)
  if (pool === 'alien' || pool === 'alienNight') return list[0]; // (the Crop pack has its own song, day and night; the other is a skip away)
  return list[Math.abs(Math.floor(Number(level.id) || 0)) % list.length];
}
// The next song in this level's set after `current` (for the skip button), or null if it has no alternatives.
export function nextSong(level, current) {
  const list = level && !level.music && POOLS[poolFor(level)];
  if (!list || list.length < 2 || !list.includes(current)) return null;
  return list[(list.indexOf(current) + 1) % list.length];
}

export class Music {
  constructor(sfx) { this.sfx = sfx; this.on = true; this.beat = 0; this.next = 0; this.bus = null; this.song = 'lawntape'; this.want = 'lawntape'; this.fade = 1; this.lastBass = 0; }

  setEnabled(on) { this.on = on; if (!on && this.bus) this.bus.gain.setTargetAtTime(0, this.sfx.ctx.currentTime, 0.1); }

  init() {
    const c = this.sfx.ctx;
    if (this.bus || !c || !this.sfx.master) return !!this.bus;
    this.bus = c.createGain(); this.bus.gain.value = 0;
    this.trackBus = c.createGain(); this.trackBus.gain.value = 1;
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000; // (dark songs close it a bit)
    this.trackBus.connect(this.lp).connect(this.bus);
    // grind: a soft-clipping waveshaper into a low-pass (a fuzz box), for the night-metal songs
    this.drive = c.createWaveShaper(); this.drive.oversample = '2x';
    const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(x * 6) / Math.tanh(6); }
    this.drive.curve = curve;
    this.driveLp = c.createBiquadFilter(); this.driveLp.type = 'lowpass'; this.driveLp.frequency.value = 3800;
    this.drive.connect(this.driveLp).connect(this.trackBus);
    this.bus.connect(this.sfx.master);
    this.pumpBus = c.createGain(); this.pumpBus.connect(this.trackBus); // pads + sub: ducked by the kick when a song pumps
    // one shared dotted-8th echo for leads, arps and stabs (darkened in its feedback loop)
    this.echoIn = c.createGain(); this.echoIn.gain.value = 0;
    this.dly = c.createDelay(1.5); this.dly.delayTime.value = 0.26;
    this.dlp = c.createBiquadFilter(); this.dlp.type = 'lowpass'; this.dlp.frequency.value = 2600;
    this.fb = c.createGain(); this.fb.gain.value = 0.38;
    this.echoIn.connect(this.dly).connect(this.dlp).connect(this.fb).connect(this.dly);
    this.dlp.connect(this.trackBus);
    return true;
  }

  // Per frame. song: a SONGS key; playing: music wanted now; fast: slow-mo is on (speed up); paused: duck it.
  update(dt, { song, playing, fast, paused }) {
    const c = this.sfx.ctx;
    if (!c || !this.init()) return;
    if (song && !SONGS[song]) song = null;
    const t = c.currentTime, want = this.on && playing && !this.sfx.muted ? (paused ? 0.3 : 1) : 0;
    if (song && song !== this.song) { // switch songs: dip out, restart the new one on its downbeat
      this.fade = Math.max(0, this.fade - dt * 4);
      if (this.fade === 0) { this.song = song; this.beat = 0; this.next = 0; }
    } else this.fade = Math.min(1, this.fade + dt * 3);
    const S = SONGS[this.song];
    const rate = fast ? 1.35 : 1; // slow-mo: the tape runs fast (tempo and pitch)
    const spb = 60 / S.bpm / 4; // seconds per 16th at normal speed
    this.bus.gain.setTargetAtTime(want * 0.55 * this.fade, t, 0.2);
    this.lp.frequency.setTargetAtTime(S.lp ?? (S.dark ? 3200 : 20000), t, 0.3);
    this.echoIn.gain.setTargetAtTime(S.echo ?? 0.12, t, 0.2);
    this.dly.delayTime.setTargetAtTime((3 * spb) / rate, t, 0.1);
    if (!want) return;
    if (this.next < this.beat) this.next = Math.ceil(this.beat);
    while (this.next < this.beat + (0.2 / spb) * rate) {
      const when = t + ((this.next - this.beat) * spb) / rate;
      this.step(S, this.next, Math.max(t, when), rate, spb / rate);
      this.next++;
    }
    this.beat += (dt * rate) / spb;
  }

  step(S, n, when, rate, d16) {
    const barN = Math.floor(n / STEPS), bar = barN % S.chords.length, s = n % STEPS, [root, voicing] = S.chords[bar];
    const soft = S.soft ? 0.55 : 1;
    const sec = S._sec ? S._sec[barN % S._sec.length] : null; // (multi-loop songs: this bar's section)
    if (S.swing && s % 2) when += S.swing * d16; // swung off-beats
    const dk = S.drums[bar % S.drums.length][s];
    if (!(sec?.noKick && dk === 'k')) this.drum(S, dk, when, rate, soft, d16);
    if (S._hats) this.drum(S, S._hats[barN % S._hats.length][s], when, rate, soft, d16);
    if (S._perc) this.drum(S, S._perc[barN % S._perc.length][s], when, rate, soft, d16);
    if ((sec ? sec.frantic : S.frantic) && s % 2 === 1) this.hat(when, 0.05, 0.03); // extra hats: frantic
    // bass
    if (S.hard) this.synth(MIDI(root + S.bass[Math.floor(s / 2) % S.bass.length] - 12) * rate, when, d16 * 0.85, { type: 'sawtooth', vol: 0.05, cut: 900, attack: 0.003, dets: [0, 1200], sweep: 0.5, out: this.drive }); // chug: every 16th
    else if (S._bass) {
      const e = S._bass[barN % S._bass.length][s];
      if (e) this.bassNote(S, MIDI(root + (S.bassOct ?? -12) + e.m) * rate, when, e.len * d16, e, d16, n);
    } else if (s % 2 === 0) this.note(MIDI(root + S.bass[(s / 2) % S.bass.length] - 12) * rate, when, d16 * (S.dark ? 3.5 : 1.8), S.dark ? 'sine' : 'triangle', S.dark ? 0.22 : 0.16);
    // chords
    if (S.stabs && !sec?.noStabs) { if (S.stabs[s] === 'x') { if (S.stabVoice === 'grind') this.grind(MIDI(voicing[0]) * rate, when, d16 * 2.5); else for (const m of voicing) (S.stabVoice === 'brass' ? this.brass(MIDI(m) * rate, when, d16 * 2.2, 0.018) : this.rhodes(MIDI(m) * rate, when, d16 * 3)); } }
    const chordAt = !S.stabs && (S._comp ? S._comp[barN % S._comp.length][s] === 'x' : S.lead === 'darkpad' ? s === 0 : S.soft ? s === 0 || s === 6 || s === 12 : s === 0 || s === 10);
    if (chordAt && !sec?.noPad) {
      const fs = voicing.map((m) => MIDI(m) * rate);
      if (S.lead === 'darkpad') this.pad(fs, when, d16 * 18, true);
      else if (S.lead === 'pad') this.pad(fs, when, d16 * 14, false);
      else if (S.lead === 'stab') this.stab(fs, when, d16 * 1.6);
      else for (const f of fs) this.rhodes(f, when, d16 * (s ? 6 : 10));
    }
    // lead flavours
    if (S.lead === 'bells' && s % 4 === 3 && (n * 7) % 5 < 2) this.note(MIDI(voicing[(n >> 2) % 4] + 24) * rate, when, d16 * 0.9, 'square', 0.025);
    if (S.lead === 'arp' && s % 2 === 1) this.note(MIDI(voicing[(n >> 1) % 4] + 12 + (bar % 2) * 12) * rate, when, d16 * 0.8, 'square', S.frantic ? 0.03 : S._hook ? 0.016 : 0.022);
    if (S.lead === 'vibes' && (s === 3 || s === 9 || s === 14)) this.vibes(MIDI(voicing[(n + bar) % 4] + 12) * rate, when, d16 * 5);
    if (S.arp && !sec?.noArp && n % (S.arp.every || 1) === 0) { // hypnotic pluck arp; its filter breathes over 8 bars
      const k = Math.floor(n / (S.arp.every || 1)), i = S.arp.seq[k % S.arp.seq.length];
      const breathe = 0.5 - 0.5 * Math.cos((n / (STEPS * 8)) * Math.PI * 2);
      this.pluck(MIDI(voicing[i % 4] + 12 * Math.floor(i / 4) + (S.arp.oct ?? 12)) * rate, when, d16 * (S.arp.every || 1) * 1.4, (500 + 2600 * breathe) * rate, S.arp.vol ?? 0.02);
    }
    if (S.melody && s % 2 === 0) { // a written tune: a note rings on through the rests after it (to the end of its bar)
      const i = bar * 8 + s / 2, m = S.melody[i % S.melody.length];
      let len = 1; while (len < 8 - s / 2 && !S.melody[(i + len) % S.melody.length]) len++;
      if (m) this.melVoice(S.mel, MIDI(m) * rate, when, d16 * 2 * len * 0.9);
    }
    // the hook
    if (S._hook) {
      const e = S._hook[barN % S._hook.length][s];
      if (e) this.lead(S.hookVoice, MIDI(e.m) * rate, when, e.len * d16, e.acc);
    }
  }

  drum(S, d, when, rate, soft, d16) {
    if (!d || d === '.') return;
    if (d === 'k') { this.kick(when, rate, soft, S); if (S.hard) this.noiseHit(when, 0.012, 3000, 'highpass', 0.12); } // (hard: a beater click)
    else if (d === 's') this.snare(when, rate, 0.35 * soft);
    else if (d === 'g') this.snare(when, rate, 0.12 * soft);
    else if (d === 'h') this.hat(when, 0.08 * soft, 0.035);
    else if (d === 'o') this.hat(when, 0.07 * soft, 0.16);
    else if (d === 'r') { this.snare(when, rate, 0.3 * soft); this.snare(when + d16 / 2, rate, 0.24 * soft); }
    else if (d === 'm') this.metal(when, rate, 0.05 * soft);
    else if (d === 'i') this.rim(when, rate, 0.09 * soft);
    else if (d === 'c') this.clap(when, rate, 0.3 * soft);
  }

  out() { return this.trackBus; }
  send(g, amt = 1) { if (amt >= 1) g.connect(this.echoIn); else { const s = this.sfx.ctx.createGain(); s.gain.value = amt; g.connect(s).connect(this.echoIn); } }
  env(g, when, vol, attack, dur) { // 0 → vol in `attack`, then an exponential fall to silence at when + dur
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + attack); g.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(dur, attack + 0.01));
  }
  osc(type, f, when, end, dest, detune = 0) {
    const o = this.sfx.ctx.createOscillator();
    o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
    o.connect(dest); o.start(when); o.stop(end);
    return o;
  }
  note(f, when, dur, type, vol) {
    const c = this.sfx.ctx, g = c.createGain();
    this.env(g, when, vol, 0.01, dur);
    g.connect(this.out()); this.osc(type, f, when, when + dur + 0.05, g);
  }
  rhodes(f, when, dur) { this.note(f, when, dur, 'sine', 0.05); this.note(f * 2, when, dur * 0.5, 'sine', 0.012); }
  vibes(f, when, dur) { this.note(f, when, dur, 'sine', 0.045); this.note(f * 4, when, dur * 0.25, 'sine', 0.008); }

  // Chords as a slow detuned-saw pad: one filter + gain per chord. Dark: wider detune, a filter that swells open
  // and closes again, routed through the pump bus.
  pad(fs, when, dur, dark) {
    const c = this.sfx.ctx, g = c.createGain(), lp = c.createBiquadFilter(), end = when + dur;
    lp.type = 'lowpass';
    if (dark) { lp.Q.value = 2; lp.frequency.setValueAtTime(380, when); lp.frequency.exponentialRampToValueAtTime(1500, when + dur * 0.45); lp.frequency.exponentialRampToValueAtTime(450, end); }
    else lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(dark ? 0.014 : 0.02, when + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, end);
    lp.connect(g).connect(dark ? this.pumpBus : this.out());
    for (const f of fs) for (const det of dark ? [-13, 11] : [-7, 7]) this.osc('sawtooth', f, when, end + 0.05, lp, det);
  }
  // Short bright chord stabs (square through a closing filter): the bouncy offbeat skank of the day tracks.
  stab(fs, when, dur) {
    const c = this.sfx.ctx, g = c.createGain(), lp = c.createBiquadFilter(), end = when + dur + 0.08;
    lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(4200, when); lp.frequency.exponentialRampToValueAtTime(700, end);
    this.env(g, when, 0.022, 0.004, end - when);
    lp.connect(g).connect(this.out()); this.send(g, 0.6);
    for (const f of fs) this.osc('square', f, when, end + 0.03, lp);
  }

  // Leads for the hook.
  lead(voice, f, when, dur, acc) {
    if (voice === 'hero') this.hero(f, when, dur, acc);
    else if (voice === 'brass') this.fm(f, when, dur, acc, 1, 3.2, 0.042, true);
    else if (voice === 'glass') this.fm(f, when, dur * 1.6 + 0.4, acc, 3.5, 1.4, 0.03, false);
    else if (voice === 'vibes') this.vibes(f, when, dur + 0.3);
    else this.fm(f, when, dur + 0.15, acc, 2, 2.4, 0.045, false); // 'fm': a bright e-piano / bell lead
  }
  // Hero lead: two detuned saws + a square through a filter that snaps open and settles, a touch of delayed
  // vibrato on long notes (the big bright N64-style lead).
  hero(f, when, dur, acc) {
    const c = this.sfx.ctx, g = c.createGain(), lp = c.createBiquadFilter(), v = acc ? 0.05 : 0.036;
    const dec = when + Math.min(0.12, dur * 0.6), hold = Math.max(dec + 0.01, when + dur), end = hold + 0.09;
    lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(Math.min(f * 10, 16000), when); lp.frequency.exponentialRampToValueAtTime(Math.min(f * 3, 12000), dec + 0.1);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(v, when + 0.006); g.gain.exponentialRampToValueAtTime(v * 0.6, dec);
    g.gain.setValueAtTime(v * 0.6, hold); g.gain.exponentialRampToValueAtTime(0.0001, end);
    lp.connect(g).connect(this.out()); this.send(g);
    const os = [this.osc('sawtooth', f, when, end + 0.02, lp, -9), this.osc('sawtooth', f, when, end + 0.02, lp, 9), this.osc('square', f / 2, when, end + 0.02, lp)];
    if (dur > 0.25) { // delayed vibrato
      const lfo = c.createOscillator(), depth = c.createGain();
      lfo.frequency.value = 5.5; depth.gain.setValueAtTime(0, when); depth.gain.linearRampToValueAtTime(0, when + 0.15); depth.gain.linearRampToValueAtTime(16, hold);
      lfo.connect(depth); for (const o of os) depth.connect(o.detune);
      lfo.start(when); lfo.stop(end + 0.02);
    }
  }
  // Two-operator FM: a sine modulating a sine. ratio 2 → e-piano / bell, 1 → brass, 3.5 → glassy inharmonic.
  // sustain: hold at a level until the note ends (brass) instead of ringing down (bells).
  fm(f, when, dur, acc, ratio, index, vol, sustain) {
    const c = this.sfx.ctx, g = c.createGain(), mg = c.createGain(), v = acc ? vol * 1.35 : vol;
    const end = when + dur + (sustain ? 0.08 : 0);
    mg.gain.setValueAtTime(f * index * (acc ? 1.4 : 1), when); mg.gain.exponentialRampToValueAtTime(f * index * 0.2, when + Math.min(dur, 0.35));
    if (sustain) { g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(v, when + 0.02); g.gain.setValueAtTime(v, when + dur); g.gain.exponentialRampToValueAtTime(0.0001, end); }
    else this.env(g, when, v, 0.005, dur);
    g.connect(this.out()); this.send(g);
    const car = this.osc('sine', f, when, end + 0.02, g);
    this.osc('sine', f * ratio, when, end + 0.02, mg); mg.connect(car.frequency);
  }
  // Written-melody voices. flute: sine + a breathy octave; chip: square; sax / pluck / saw / brass: filtered saws;
  // grind: a distorted power chord.
  melVoice(kind, f, when, dur) {
    if (kind === 'flute') { this.note(f, when, dur, 'sine', 0.06); this.note(f * 2, when, dur * 0.6, 'triangle', 0.006); }
    else if (kind === 'chip') this.note(f, when, dur, 'square', 0.028);
    else if (kind === 'sax') this.synth(f, when, dur, { type: 'sawtooth', vol: 0.035, cut: 1600, attack: 0.03, dets: [0] });
    else if (kind === 'pluck') this.synth(f, when, Math.min(dur, 0.35), { type: 'sawtooth', vol: 0.04, cut: 2400, attack: 0.004, dets: [0], sweep: 0.2 });
    else if (kind === 'saw') this.synth(f, when, dur, { type: 'sawtooth', vol: 0.022, cut: 5000, attack: 0.008, dets: [-9, 9] });
    else if (kind === 'brass') this.brass(f, when, dur, 0.03);
    else if (kind === 'grind') this.grind(f, when, dur);
  }
  // A distorted power chord (root, fifth, octave) through the fuzz: the night-metal riff voice.
  grind(f, when, dur) { for (const [m, det] of [[1, -8], [1.5, 6], [2, 0]]) this.synth(f * m, when, dur, { type: 'sawtooth', vol: 0.035, cut: 2600, attack: 0.004, dets: [det], out: this.drive }); }
  brass(f, when, dur, vol) { this.synth(f, when, dur, { type: 'sawtooth', vol, cut: 1200, attack: 0.025, dets: [-6, 6], sweep: 2.2 }); }
  // A small subtractive voice: saws (detuned by dets cents) through a low-pass; sweep > 1 opens the filter as
  // the note starts (brassy), sweep < 1 closes it (plucky).
  synth(f, when, dur, { type, vol, cut, attack, dets, sweep = 1, out = this.out() }) {
    const c = this.sfx.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(cut, when); lp.frequency.exponentialRampToValueAtTime(cut * sweep, when + Math.min(dur, 0.12));
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + attack); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    lp.connect(g).connect(out);
    for (const det of dets) { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(when); o.stop(when + dur + 0.05); }
  }
  // Arp pluck: a saw through a resonant filter that snaps shut.
  pluck(f, when, dur, cut, vol) {
    const c = this.sfx.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(Math.min(cut * 2.2, 15000), when); lp.frequency.exponentialRampToValueAtTime(Math.max(cut * 0.4, 120), when + dur);
    this.env(g, when, vol, 0.003, dur);
    lp.connect(g).connect(this.out()); this.send(g);
    this.osc('sawtooth', f, when, when + dur + 0.03, lp);
  }

  // Bass voices for bassLine songs.
  bassNote(S, f, when, dur, e, d16, n) {
    const c = this.sfx.ctx, v = S.bassVoice, prev = this.lastBass;
    this.lastBass = f;
    if (v === 'acid') { // saw through a squelchy resonant filter; accents open it wider; '^' glides in
      const g = c.createGain(), lp = c.createBiquadFilter(), end = when + Math.max(dur, d16) * 0.95;
      const sweep = 0.5 - 0.5 * Math.cos((n / (STEPS * 16)) * Math.PI * 2); // opens and closes every 16 bars
      const base = 220 + 900 * sweep;
      lp.type = 'lowpass'; lp.Q.value = 13;
      lp.frequency.setValueAtTime(Math.min(base * (e.acc ? 7 : 4), 9000), when); lp.frequency.exponentialRampToValueAtTime(base, when + d16 * 1.8);
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(e.acc ? 0.11 : 0.075, when + 0.004); g.gain.setValueAtTime(e.acc ? 0.11 : 0.075, end - 0.02); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.03);
      lp.connect(g).connect(this.out());
      const o = this.osc('sawtooth', e.slide && prev ? prev : f, when, end + 0.05, lp);
      if (e.slide && prev) o.frequency.exponentialRampToValueAtTime(f, when + d16 * 0.7);
    } else if (v === 'sub' || v === 'reese') { // deep sine (+ an octave-up triangle so phones hear it); reese adds
      const g = c.createGain(), end = when + dur;             // two beating detuned saws, darkly filtered
      g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.15, when + 0.012); g.gain.setValueAtTime(0.15, Math.max(when + 0.013, end - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.06);
      g.connect(this.pumpBus);
      this.osc('sine', f, when, end + 0.1, g);
      const h = c.createGain(); h.gain.value = 0.18; h.connect(g); this.osc('triangle', f * 2, when, end + 0.1, h);
      if (v === 'reese') {
        const lp = c.createBiquadFilter(), r = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 420 * (f > 80 ? 1.3 : 1); lp.Q.value = 1.5; r.gain.value = 0.28;
        lp.connect(r).connect(g); this.osc('sawtooth', f * 2, when, end + 0.1, lp, -14); this.osc('sawtooth', f * 2, when, end + 0.1, lp, 14);
      }
    } else { // 'bounce': a round square pluck
      const g = c.createGain(), lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.setValueAtTime(e.acc ? 2200 : 1400, when); lp.frequency.exponentialRampToValueAtTime(260, when + Math.max(dur, d16));
      this.env(g, when, e.acc ? 0.12 : 0.09, 0.004, Math.max(dur, d16) * 0.95);
      lp.connect(g).connect(this.out());
      this.osc('square', f, when, when + Math.max(dur, d16) + 0.05, lp);
    }
  }

  kick(when, rate, vol = 1, S = null) {
    const c = this.sfx.ctx, o = c.createOscillator(), g = c.createGain(), deep = S && S.kick === 'deep';
    const len = (deep ? 0.34 : 0.2) / rate;
    o.frequency.setValueAtTime((deep ? 130 : 150) * rate, when); o.frequency.exponentialRampToValueAtTime((deep ? 38 : 42) * rate, when + (deep ? 0.22 : 0.16) / rate);
    g.gain.setValueAtTime((deep ? 0.6 : 0.5) * vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + len);
    o.connect(g).connect(this.out()); o.start(when); o.stop(when + len + 0.05);
    if (S && S.pump) { const p = this.pumpBus.gain; p.setValueAtTime(0.3, when); p.setTargetAtTime(1, when + 0.03 / rate, 0.08 / rate); } // sidechain duck
  }
  noiseHit(when, dur, freq, type, vol, q = 0) {
    const c = this.sfx.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.sfx.noise; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    s.connect(f).connect(g).connect(this.out()); s.start(when, Math.random()); s.stop(when + dur + 0.02);
    return g;
  }
  snare(when, rate, vol = 0.35) { this.noiseHit(when, 0.14 / rate, 1800 * rate, 'bandpass', vol); this.note(190 * rate, when, 0.08 / rate, 'triangle', vol * 0.4); }
  hat(when, vol = 0.08, dur = 0.035) { this.noiseHit(when, dur, 8000, 'highpass', vol); }
  // Metallic hat: two detuned squares at a clangy ratio, band-passed high (a cheap 808-ish cymbal).
  metal(when, rate, vol) {
    const c = this.sfx.ctx, bp = c.createBiquadFilter(), g = c.createGain(), end = when + 0.06 / rate;
    bp.type = 'bandpass'; bp.frequency.value = 9000; bp.Q.value = 0.9;
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, end);
    bp.connect(g).connect(this.out());
    this.osc('square', 587 * rate, when, end + 0.02, bp); this.osc('square', 845 * rate, when, end + 0.02, bp);
  }
  rim(when, rate, vol) { // a dry click: a pinged triangle and a snap of noise
    const c = this.sfx.ctx, g = c.createGain();
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03 / rate);
    g.connect(this.out()); this.osc('triangle', 1750 * rate, when, when + 0.05, g);
    this.noiseHit(when, 0.018 / rate, 3200 * rate, 'bandpass', vol * 0.6, 2);
  }
  clap(when, rate, vol) { // three quick noise bursts, then a short tail
    const c = this.sfx.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), k = 1 / rate;
    s.buffer = this.sfx.noise; f.type = 'bandpass'; f.frequency.value = 1200 * rate; f.Q.value = 1.2;
    for (let i = 0; i < 3; i++) { g.gain.setValueAtTime(vol, when + i * 0.011 * k); g.gain.exponentialRampToValueAtTime(vol * 0.2, when + (i * 0.011 + 0.01) * k); }
    g.gain.setValueAtTime(vol * 0.8, when + 0.034 * k); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18 * k);
    s.connect(f).connect(g).connect(this.out()); s.start(when, Math.random()); s.stop(when + 0.2 * k);
  }
}
