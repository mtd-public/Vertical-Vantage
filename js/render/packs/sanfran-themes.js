// NEW SAN FRANCISCO themes: morning fog on the bay, a sunny afternoon on the hills, dusk with the fog
// rolling over Twin Peaks, golden hour on the boss's hilltop park, and a Summer-of-Love bonus sky.
// (Fields: see render/themes.js. cover = overcast lid, cloudSea = the fog sea below the level.)
export default {
  sfMorning: { // stage 1: the Golden Gate at 07:10, low fog banks, the sun just over the East Bay
    skyTop: '#6a9ad8', skyBot: '#e6e0d6', sun: '#fff0c8', sunDir: [0.62, 0.32, 0.5], night: 0,
    fog: [70, 360], hemi: ['#f4f0ea', '#5c6672', 1.65], key: ['#ffe4bc', 2.1],
    cloud: '#ffffff', cloudShade: '#d6d8dc', city: 0.55, arc: [0.75, 0.75], cityCol: '#a6aebc', windows: 0, neon: 0.4,
    water: '#3b7593', rain: 0, stars: 0, beams: 0, cover: 0.42, cityH: 0.7, pyramids: 0, haze: 0.42,
  },
  sfAfternoon: { // stage 2: the steep streets at 15:30, deep blue sky, puffy clouds
    skyTop: '#3d86ea', skyBot: '#d6ecfa', sun: '#fff6d6', sunDir: [-0.42, 0.7, 0.32], night: 0,
    fog: [90, 400], hemi: ['#ffffff', '#6c7a68', 1.75], key: ['#fff2dc', 2.3],
    cloud: '#ffffff', cloudShade: '#dfe8f6', city: 0.6, arc: [0.9, 0.7], cityCol: '#a8b4c8', windows: 0, neon: 0.45,
    water: '#2f7cab', rain: 0, stars: 0, beams: 0, cover: 0.08, cityH: 0.8, pyramids: 0, haze: 0.38,
  },
  sfDusk: { // stage 3: Twin Peaks at 19:50, the fog pouring over the hills, the city lights coming on
    skyTop: '#2c2660', skyBot: '#f2a47e', sun: '#ffc690', sunDir: [-0.72, 0.1, -0.45], night: 0.35,
    fog: [45, 250], hemi: ['#ffe2d6', '#4a4062', 1.7], key: ['#ffbc96', 1.75],
    cloud: '#ffd6cc', cloudShade: '#b48aa6', city: 0.8, arc: [0.7, 0.9], cityCol: '#5a4a6c', windows: 0.75, neon: 0.95,
    water: null, rain: 0, stars: 0.12, beams: 0, cover: 0.55, cityH: 0.75, pyramids: 0, cloudSea: '#fff6f4', haze: 0.48,
  },
  sfPark: { // the boss: a hilltop park at golden hour, the fog sea below, the bridge on the horizon
    skyTop: '#3e6cc8', skyBot: '#f4cfa6', sun: '#ffe0a0', sunDir: [-0.62, 0.24, -0.62], night: 0.08,
    fog: [70, 330], hemi: ['#fff0e2', '#4c5a42', 1.6], key: ['#ffd6a0', 2.0],
    cloud: '#fff4ea', cloudShade: '#e8b8a2', city: 0.5, arc: [1.3, 0.8], cityCol: '#8c8ea4', windows: 0.2, neon: 0.6,
    water: null, rain: 0, stars: 0, beams: 0, cover: 0.3, cityH: 0.7, pyramids: 0, cloudSea: '#f0e0d4', haze: 0.4,
  },
  sfBonus: { // SERVER CORE, San Francisco edition: a psychedelic Summer-of-Love sunburst
    skyTop: '#c03ad8', skyBot: '#ffd27a', sun: '#fff0c0', sunDir: [0.4, 0.5, -0.6], night: 0.1, power: 1,
    fog: [80, 300], hemi: ['#fff0f8', '#5a3a6a', 1.7], key: ['#ffe0c0', 2.0],
    cloud: '#fff0f6', cloudShade: '#f0a8d0', city: 0, arc: [0, 4], cityCol: '#8a6aa0', windows: 0.3, neon: 1.1,
    water: null, rain: 0, stars: 0, beams: 0,
  },
};
