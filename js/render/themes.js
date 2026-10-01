// Visual themes. Render-only: the sim never reads these.
//   sky: top / horizon colours (fog = horizon, so geometry dissolves into the skyline)
//   fog: [near, far] linear N64-style distance fog
//   city: skyline density 0..1; arc: [centre azimuth, half-width] of the city band (docks: across the bay)
//   neon: emissive strength of signs / trims; windows: lit-window glow; rain; power (bonus sunburst sky)
export const THEMES = {
  docks: {
    skyTop: '#2f7fe6', skyBot: '#cfe8ff', sun: '#fff3c4', sunDir: [-0.45, 0.55, -0.7], night: 0,
    fog: [90, 360], hemi: ['#eaf4ff', '#5a6a7e', 1.7], key: ['#fff1d8', 2.3],
    cloud: '#ffffff', cloudShade: '#d8e8fa', city: 0.8, arc: [-1.9, 1.3], cityCol: '#93a9c8', windows: 0.0, neon: 0.45,
    water: '#2a7fb8', rain: 0, stars: 0, beams: 0,
  },
  cityDay: {
    skyTop: '#4b8fe0', skyBot: '#f3d7bd', sun: '#fff0c0', sunDir: [0.5, 0.62, -0.45], night: 0,
    fog: [70, 300], hemi: ['#f4ecff', '#6d6a78', 1.6], key: ['#fff0dc', 2.2],
    cloud: '#ffffff', cloudShade: '#f0dccc', city: 1, arc: [0, 4], cityCol: '#a49fb0', windows: 0.0, neon: 0.55,
    water: null, rain: 0, stars: 0, beams: 0,
  },
  cityNight: {
    skyTop: '#07061a', skyBot: '#3c1c4c', sun: '#e8ecff', sunDir: [-0.3, 0.5, -0.8], night: 1,
    fog: [40, 240], hemi: ['#6a62b8', '#1a0f26', 1.15], key: ['#a8b8ff', 0.7],
    cloud: '#4a3460', cloudShade: '#2a1c3c', city: 1, arc: [0, 4], cityCol: '#1a1026', windows: 1, neon: 1.25,
    water: null, rain: 1, stars: 0.35, beams: 1,
  },
  bonusDay: {
    skyTop: '#2a6cff', skyBot: '#bfe8ff', sun: '#fff3c4', sunDir: [-0.4, 0.6, -0.6], night: 0, power: 1,
    fog: [80, 300], hemi: ['#ffffff', '#6a7aa0', 1.8], key: ['#fff6e0', 2.2],
    cloud: '#ffffff', cloudShade: '#dfe8ff', city: 0, arc: [0, 4], cityCol: '#93a9c8', windows: 0, neon: 0.8,
    water: null, rain: 0, stars: 0, beams: 0,
  },
  bonusDusk: {
    skyTop: '#5a2ad8', skyBot: '#ffb48a', sun: '#ffd0a0', sunDir: [0.6, 0.25, -0.6], night: 0.4, power: 1,
    fog: [70, 280], hemi: ['#ffe0f0', '#4a3a6a', 1.6], key: ['#ffc8a0', 1.8],
    cloud: '#ffe6f0', cloudShade: '#e8a8c8', city: 0, arc: [0, 4], cityCol: '#6a5a90', windows: 0.4, neon: 1,
    water: null, rain: 0, stars: 0.2, beams: 0,
  },
  bonusNight: {
    skyTop: '#06051a', skyBot: '#2a1a5a', sun: '#e8ecff', sunDir: [-0.3, 0.5, -0.8], night: 1, power: 1,
    fog: [60, 260], hemi: ['#7a72c8', '#1a0f26', 1.3], key: ['#b0c0ff', 0.9],
    cloud: '#4a3460', cloudShade: '#2a1c3c', city: 0, arc: [0, 4], cityCol: '#1a1026', windows: 1, neon: 1.3,
    water: null, rain: 0, stars: 0.6, beams: 0,
  },
};

// Body paint for hover cars, indexed by plat.tint (0..7): police and taxi override.
export const CAR_PAINT = ['#e8e4dc', '#d8343c', '#2a5ad8', '#1a1a22', '#f0b81a', '#20a8a0', '#8a3ad8', '#c8ccd4'];
export const CONTAINER_PAINT = ['#c8402e', '#2a6ab8', '#e8a020', '#3a8a4a', '#8a3a7a', '#d8d4cc', '#2a8aa0', '#b85a20'];
// Facade tints for towers (multiplied over the facade texture).
export const TOWER_TINT = ['#c8ccd8', '#d8c8b8', '#a8b8d0', '#c0d0c4', '#d0c0d0', '#b8b8c0', '#e0d8c8', '#a8a8b8'];
export const NEON = ['#ff2bd6', '#2be8ff', '#ffe52b', '#ff5a2b', '#7bff4a', '#b45bff', '#ff3b5c', '#4a8bff'];
