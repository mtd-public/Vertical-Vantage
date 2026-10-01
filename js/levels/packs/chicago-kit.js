// NEO CHICAGO's own level pieces (pure data, like js/levels/kit.js): the L, its trains, city blocks,
// brick and limestone buildings, water towers, art-deco setbacks, boats. Every style named here is
// drawn by js/render/packs/chicago.js. Coordinates: metres, +Y up, yaw 0 faces -Z (north).
import { rect, disc, mv, bob } from '../kit.js';

// The L: an elevated steel deck carrying two tracks (8.5 m wide), `len` long along its yaw
// (0 = north-south). Its top is the walkway between the rails. style 'chiTruss' for a river span.
export const track = (x, z, len, top, yaw = 0, style = 'chiTrack') => rect(x, z, 8.5, len, top, { thick: 1.2, yaw, style });
// An L train: two stainless cars coupled on one lane, sliding together along `along` ('x' | 'z').
// (cx, cz) is the train's middle; the roofs are at `top` (3.1 m above the rails it rides).
// tint picks the line colour (0 red, 1 blue, 2 brown, 3 green, 4 orange, 5 pink).
export function train(cx, cz, top, along, amp, period, phase, tint = 0) {
  const out = [];
  for (const s of [-1, 1]) {
    const x = along === 'x' ? cx + s * 7.6 : cx, z = along === 'z' ? cz + s * 7.6 : cz;
    out.push(rect(x, z, 3, 14.6, top, { thick: 3.1, yaw: along === 'x' ? Math.PI / 2 : 0, style: 'chiTrain', tint, move: mv(along, amp, period, phase), bob: null }));
  }
  return out;
}
// An L station platform beside a track (lamp posts, railings, a line-colour sign).
export const station = (x, z, w, d, top, tint = 0) => rect(x, z, w, d, top, { thick: 0.8, style: 'chiStation', tint });

// A city block: a sidewalk island standing out of the canal (the streets of the drowned grid).
// A riverwalk's tint says which side the river is on (0 north, 1 south): its railing goes there.
export const block = (x0, x1, z0, z1, top = 2, style = 'chiBlock', tint = 0) => rect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, top, { thick: top + 3, style, tint });
// Buildings standing on a block (base) with their roof at `top`. tint picks the variant.
export const brick = (x, z, w, d, top, tint = 0, base = 0) => rect(x, z, w, d, top, { thick: top - base, style: 'chiBrick', tint });
export const stone = (x, z, w, d, top, tint = 0, base = 0) => rect(x, z, w, d, top, { thick: top - base, style: 'chiStone', tint });
// A rooftop water tower: a wooden tank on four legs, standing on a roof at `roof` (walk under it).
export const waterTower = (x, z, roof, r = 2.3) => disc(x, z, r, roof + 6.2, { thick: 3.4, style: 'chiWaterTower', tint: 2.8 });
// Art-deco setbacks: a stack of tiers (each [w, d, top]) — the green-and-gold tower of the Loop.
export const deco = (x, z, tiers, base = 0) => tiers.map(([w, d, top], i) => rect(x, z, w, d, top, { thick: top - (i ? tiers[i - 1][2] - 0.5 : base), style: i === tiers.length - 1 ? 'chiDecoCrown' : 'chiDeco', tint: i }));

// Boats: a river cruiser / speedboat whose deck is at `top` (on the water at 0).
export const boat = (x, z, len, wid, top, yaw, o = {}) => rect(x, z, wid, len, top, { thick: top + 0.3, yaw, style: o.style || 'chiBoat', tint: o.tint ?? 0, move: o.move || null, bob: o.bob === undefined ? bob(0.12, 3.4, (x * 0.05 + z * 0.03) % 1) : o.bob });
