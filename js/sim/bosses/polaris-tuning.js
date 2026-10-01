// POLARIS's tuning table (js/sim/bosses/polaris.js): pure data with no imports, so the render side
// (js/render/packs/arctic-boss.js) can read the ring radii and the breath's cone without pulling in the sim.
// Every number, and why it has that value. (Exported: it lands in data/tuning.json as BOSSES.polaris.)
export const tuning = {
  hp: 320, // the blaster does ~6.7/s: with the plates shut (×0.25) most of the time and open (×1.5) in the windows, ~90 s of
  //           perfect aim that never dodges; dodging, the blizzard (visor-only) and stomps make it a 2.5–3.5 min fight.
  r: 3.0, // hit / stomp radius: its body is 7 m long, the capsule covers the chest and back.
  top: 4.2, rearTop: 8.6, lowTop: 2.4, // its back on all fours (a double jump, or a hop from a stump); reared up; flat on its belly (a single jump).
  bodyR: 2.6, // what it can't walk or slide through (the columns, stumps, crates).
  intro: 2.4, // it shakes the frost off before the roar.
  margin: 4.5, // how close to the cavern walls its body comes.
  cuts: [0.62, 0.3], // phase 2 below 62 %, phase 3 below 30 %.
  speed: [3.6, 4.3, 5.0], // prowling speed by phase: you outrun it easily (8.5).
  turn: [1.8, 2.2, 2.6], // rad/s: circle it close and you get round to its flank.
  keep: 6.5, // it stops closing in here and squares up.
  prowl: [[1.8, 2.6], [1.4, 2.1], [1.0, 1.6]], // seconds of prowling between attacks, by phase.
  swipe: {
    tele: [0.85, 0.72, 0.62], // rearing up: the first claw ring fills in front of it (≥ 0.6 s).
    reach: 3.4, r: 4.0, // the first ring's centre ahead of it and its radius: back off 8 m, or jump it.
    second: 0.55, reach2: 5.0, r2: 3.4, // the second ring lands where you went (no further than 5 m ahead), 0.55 s after the first.
    height: 2.4, knock: 11, // a hop over the claws (a single jump clears 2.4 m near its top); a big shove if they connect.
    winded: [1.8, 1.6, 1.4], // dropped back on all fours, panting: the punish window.
  },
  breath: {
    tele: [1.0, 0.85, 0.75], // it inhales and the cone shows where the sweep starts.
    time: [1.8, 1.7, 1.6], sweep: 1.3, // the cone sweeps 1.3 rad (75°) through you in this long: 0.7–0.8 rad/s (a run round it outpaces that within 11 m).
    half: 0.2, range: 24, // a 23° cone, 24 m long; geometry blocks it (sees from the mouth): stand behind a column.
    mouth: 3.4, mouthY: 3.0, // the mouth: this far ahead of its centre, this high off the floor.
    knock: 4, // a cold shove (1 damage per hit; the blink after a hit stops it chaining).
    vent: [1.8, 1.6, 1.4], // after the breath its frost vents open (×1.5): the punish window.
  },
  slide: {
    tele: [0.95, 0.82, 0.72], lock: 0.35, // flat on its belly; the last 0.35 s its aim is locked (the lane goes solid): your cue.
    speed: [20, 22, 24], // launch speed (m/s), decelerating to a stop: over twice your run, so jump it or sidestep, don't outrun it.
    overshoot: 9, minRun: 12, maxRun: 40, // it slides to where you were plus 9 m (overshoots: exposed, far from you).
    nose: 2.6, hitR: 2.2, height: 2.2, dmg: 2, knock: 13, // its head-first front (this far ahead, this wide) runs you down below 2.2 m: a single jump as it
    //                                                       arrives clears it (you come down behind it, or on its back: a stomp); caught, 2 cells.
    beached: [2.6, 2.3, 2.0], crash: [3.2, 2.8, 2.4], // it stops on its belly / slams into a column or the wall: the punish windows.
    ricochet: [0, 0, 1], bounce: 0.8, after: 14, // phase 3: it glances off the first thing it hits at 80 % speed and slides on 14 m.
    getUp: 0.5, // scrambling back onto its feet.
  },
  pound: {
    tele: [1.0, 0.9, 0.8], // reared up high, both paws raised: the shock ring and the spike rings show.
    r: 4.8, height: 1.4, knock: 10, // the shock ring round its feet: jump it or be clear.
    rings: [0, 2, 3], // spike rings by phase (phase 1: just the pound).
    band: [[5.5, 8.5], [11, 14], [16.5, 19.5]], // each ring's inner and outer radius: the gaps between are safe ground.
    delay: [0.55, 0.95, 1.35], // after the pound, each ring bursts this much later (outward, one after another).
    spikeH: 1.6, // spikes reach 1.6 m up: a hop as one bursts under you clears it.
    linger: 0.9, // the spikes stand this long before they shatter (scenery: they hit as they burst).
    recover: [1.6, 1.4, 1.2], // it shakes its paws after the pound: the punish window.
  },
  hurl: {
    tele: [0.8, 0.7, 0.6], // it rips up a block of ice and raises it.
    n: [1, 2, 3], gap: 0.45, // blocks per attack by phase, this far apart.
    flight: 1.15, r: 2.4, lead: 0.5, // each lands this long after the throw on a red ring where you'll be (leading you 0.5 s): change direction.
    dmg: 2, knock: 10, height: 2.5,
    after: 0.5, // a beat after the last throw.
  },
  blizzard: {
    tele: 1.2, // it roars and the snow whips up (not stompable).
    time: 12, // seconds of blizzard: it's out of the snow after this…
    breakDmg: 14, // …or as soon as you've hurt it this much in it (shoot the visor): then it's dazed.
    cd: 32, // seconds before the next blizzard (phase 3).
    circleR: 13, speed: 8, // it circles you this far out, about as fast as you run.
    every: [2.0, 2.8], // seconds of stalking between lunges.
    lungeTele: 0.75, flight: 0.5, // the visor flares and a ring lands on you; it pounces 0.75 s later and lands 0.5 s after that (1.25 s to get out of a 3.2 m ring).
    lungeR: 3.2, dmg: 2, knock: 12, height: 2.6, leap: 3.2, // the pounce's ring; how high it arcs.
    maul: 0.85, // it lands and mauls the spot: stompable, a beat to punish.
    dazed: 2.2, // the blizzard broken: dazed (×1.5, stompable).
  },
  stomp: {
    bonus: 4, bonusOpen: 10, cd: 3.5, // extra damage for a stomp on its back (the stomp itself does 4): more while it's down.
    reel: 1.3, reelCD: 6, // a stomp while it prowls or winds up staggers it (×1.5), at most once per 6 s…
    shakeTele: 0.6, shakeR: 4.6, shakeH: 4, shakeKnock: 12, // …then it shakes like a wet dog: anyone on (or over) its back is thrown off.
  },
  vulnOpen: 1.5, // damage × in every punish window (its plates lifted off the chassis).
  plates: 0.25, // damage × the rest of the time: the white plates soak most of a shot (the stomp bonus still bites). The windows
  //               (19 % of the fight) and stomps are where it really gets hurt.
  visorR: 1.4, // in the blizzard only shots passing this close to its visor land (the rest are lost in the snow).
  minions: [0, 2, 2], // drones that join as phases 2 and 3 begin.
};
