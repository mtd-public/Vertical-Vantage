// NEW SAN FRANCISCO: numbers shared by the stage data and the render styles (pure, no three.js).
// The playable Golden Gate of stage 1: the deck, the two towers and the main cables all hang off
// these, so the cable the render draws is the cable the catwalk planks sit on.
//
//   z (north = -z):  +10 south anchorage · -60 south tower · -130 midspan · -200 north tower · -270 north anchorage
//   y:               0 the bay · 20 the deck · 34 / 48 the portal struts · 62 the tower tops
export const GG = {
  D: 20, // deck top above the water
  TT: 62, // tower tops (the top strut and the leg tops)
  struts: [34, 48], // the portal struts between the legs (walkable)
  zS: -60, zN: -200, // tower centres
  zA: 10, zB: -270, // anchorages: where the side-span cables come down to the deck
  legX: 13.5, legW: 4.6, legD: 6, // a tower leg: centre x = ±legX, footprint legW × legD
  deckW: 22, // the roadway, x = ±11
  sag: 3.2, // the main cable's low point above the deck at midspan
  ride: 1.6, // the cable centre sits this far above the tower top, in the saddle
  r: 0.55, // cable radius
};

// The main cable's centre height at world z (both cables, every span). null off the bridge.
export function cableY(z) {
  const { D, TT, zS, zN, zA, zB, sag, ride } = GG;
  const top = TT + ride;
  if (z <= zS && z >= zN) { // main span: a parabola from saddle to saddle
    const zm = (zS + zN) / 2, half = (zS - zN) / 2, u = (z - zm) / half;
    return D + sag + (top - D - sag) * u * u;
  }
  const anch = D + 1.4;
  if (z > zS && z <= zA) { const t = (zA - z) / (zA - zS); return anch + (top - anch) * Math.pow(t, 1.35); }
  if (z < zN && z >= zB) { const t = (z - zB) / (zN - zB); return anch + (top - anch) * Math.pow(t, 1.35); }
  return null;
}
