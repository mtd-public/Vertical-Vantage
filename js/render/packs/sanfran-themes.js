// NEW SAN FRANCISCO themes: Fog City after dark. The pack's palette is International Orange, sodium
// amber and a hot pink / cyan neon, under a navy sky whose fog glows rose from the lit city beneath it.
//   sfGate     the Golden Gate at 23:40: fog banks rolling in, the bridge floodlit, the moon over the Pacific
//   sfStreets  the steep streets at 21:30: a clear violet night, the Painted Ladies outlined in neon
//   sfPeaks    Twin Peaks at 01:10: only the hilltops stand out of a fog sea lit amber-rose from below
//   sfPark     the boss's hilltop park in the deep blue hour (20:20): readable, the city lighting up
//   sfBonus    SERVER CORE, San Francisco edition: a neon Summer-of-Love sunburst over a night sky
// (Fields: see render/themes.js. cover = overcast lid, cloudSea = the fog sea below the level.)
export default {
  sfGate: {
    skyTop: '#040820', skyBot: '#4a2a44', sun: '#e4ecff', sunDir: [-0.55, 0.36, -0.75], night: 1,
    fog: [70, 340], hemi: ['#6e72cc', '#2a1626', 1.3], key: ['#aabcff', 0.8],
    cloud: '#4e3a5c', cloudShade: '#2a2042', city: 0.9, arc: [0.75, 0.85], cityCol: '#140c22', windows: 1, neon: 1.3,
    water: '#0c2232', rain: 0, stars: 0.55, beams: 0.9, cover: 0.2, cityH: 0.8, pyramids: 0, haze: 0.3,
  },
  sfStreets: {
    skyTop: '#060624', skyBot: '#46264e', sun: '#e8ecff', sunDir: [-0.5, 0.5, -0.7], night: 1,
    fog: [80, 380], hemi: ['#7a76d4', '#2e1a30', 1.35], key: ['#b4c2ff', 0.85],
    cloud: '#4a3660', cloudShade: '#281e40', city: 0.9, arc: [0.9, 0.8], cityCol: '#150c24', windows: 1, neon: 1.3,
    water: '#0e1e34', rain: 0, stars: 0.7, beams: 1, cover: 0.05, cityH: 0.9, pyramids: 0, haze: 0.32,
  },
  sfPeaks: {
    skyTop: '#03061a', skyBot: '#563044', sun: '#e8eeff', sunDir: [-0.5, 0.38, -0.78], night: 1,
    fog: [55, 280], hemi: ['#6a6ec8', '#3a1e2c', 1.3], key: ['#aab8ff', 0.75],
    cloud: '#4a3654', cloudShade: '#261c38', city: 0.85, arc: [0.7, 0.9], cityCol: '#120a1e', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.75, beams: 1, cover: 0.15, cityH: 0.75, pyramids: 0, cloudSea: '#e2a8c4', haze: 0.34,
  },
  sfPark: {
    skyTop: '#0c1644', skyBot: '#6a4a78', sun: '#ffb48a', sunDir: [-0.62, 0.08, -0.62], night: 0.65,
    fog: [70, 330], hemi: ['#a4a8e8', '#3a3048', 1.55], key: ['#ffc4a0', 1.0],
    cloud: '#8a6aa0', cloudShade: '#4a3a6a', city: 0.6, arc: [1.3, 0.8], cityCol: '#241a3a', windows: 0.9, neon: 1.15,
    water: null, rain: 0, stars: 0.25, beams: 0.4, cover: 0.25, cityH: 0.7, pyramids: 0, cloudSea: '#c8b0e0', haze: 0.36,
  },
  sfBonus: {
    skyTop: '#0a0424', skyBot: '#5a1e5a', sun: '#e8ecff', sunDir: [0.4, 0.5, -0.6], night: 1, power: 1,
    fog: [70, 280], hemi: ['#a088e8', '#2a1430', 1.45], key: ['#ffc8e8', 1.0],
    cloud: '#5a3a6a', cloudShade: '#2e2040', city: 0, arc: [0, 4], cityCol: '#1a0e26', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
};
