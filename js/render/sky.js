// Arcade sky dome, from dr-mow's js/sky.js (itself "in the spirit of Super Monkey Ball, Daytona
// USA and Jumping Flash's power-up sequences"), extended into a future-city skybox:
//   * saturated gradient, a sun with turning rays (day) or a pale moon (night)
//   * hard-edged cartoon clouds racing round the horizon (day) / smog bands (night)
//   * a procedural skyline: two parallax-free layers of towers with lit windows at night,
//     arcology pyramids and needle spires with blinking aviation lights, sweeping searchlights
//   * below the horizon it melts into the fog colour, so real geometry dissolves into it
//   * `power` (0..1): Jumping Flash's spinning hue-cycling sunburst (bonus stages, power-ups)
// One sphere that follows the camera, drawn first; includes the colorspace chunk so the
// retro 15-bit dither applies to it too.
import * as THREE from 'three';
import { seg } from './retro.js';

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }`;

const FRAG = /* glsl */ `
  uniform vec3 uTop, uBot, uCloud, uShade, uSun, uCity, uSunDir;
  uniform float uTime, uPower, uCloudT, uNight, uCityK, uWin, uArcC, uArcW, uStars, uBeams;
  varying vec3 vDir;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.1 + 3.7) * 0.3 + noise(p * 4.3 + 9.1) * 0.15; }
  vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0, 4, 2), 6.0) - 3.0) - 1.0, 0.0, 1.0); }

  // One skyline layer. Returns coverage (0/1); win = lit-window mask; top = 1 near a roof line.
  float skyline(float u, float e, float N, float hmax, float sd, out float win, out float spire) {
    float x = u * N, col = floor(x), f = fract(x);
    float h = hash(vec2(col, sd));
    float bh = hmax * (0.18 + 0.82 * h * h);
    float wide = step(0.12, f) * step(f, 0.94); // a sliver of gap between towers
    float tall = step(0.93, hash(vec2(col, sd + 7.0)));
    bh *= 1.0 + tall * 1.4;
    // stepped crowns on some towers
    float crown = step(0.6, hash(vec2(col, sd + 3.0)));
    float inset = crown * step(f, 0.3) + crown * step(0.76, f);
    bh -= inset * hmax * 0.12;
    float cov = step(e, bh) * mix(1.0, wide, step(0.0, e));
    // windows: a grid in (x, e)
    vec2 wc = vec2(floor(x * 7.0), floor(e * 220.0));
    float wl = step(0.62, hash(wc + sd)) * step(0.3, fract(x * 7.0)) * step(fract(x * 7.0), 0.8) * step(0.35, fract(e * 220.0));
    win = wl * cov;
    // needle spire with a blinking red light on the tallest towers
    float needle = tall * step(abs(f - 0.5), 0.03) * step(bh, e) * step(e, bh + hmax * 0.5);
    spire = needle;
    return max(cov, needle);
  }

  void main() {
    vec3 d = normalize(vDir);
    float e = d.y;
    float az = atan(d.z, d.x); // -pi..pi
    float u = az / 6.28318 + 0.5; // 0..1 round the horizon

    vec3 col = e > 0.0 ? mix(uBot, uTop, smoothstep(-0.02, 0.32, e)) : uBot;
    col += vec3(1.0, 0.97, 0.9) * exp(-abs(e - 0.01) * 30.0) * 0.18 * (1.0 - uNight);

    // sun / moon
    float sd = dot(d, uSunDir);
    float sa = atan(dot(d, normalize(cross(uSunDir, vec3(0, 1, 0)))), dot(d, vec3(0, 1, 0)) - sd * uSunDir.y);
    float rays = step(0.5, fract(sa * 12.0 / 6.2832 + uTime * 0.04)) * smoothstep(0.6, 0.97, sd) * 0.2 * (1.0 - uNight);
    col = mix(col, uSun, rays);
    col = mix(col, uSun, smoothstep(0.985, 0.99, sd) * step(0.0, e));
    col += uSun * pow(max(sd, 0.0), 24.0) * 0.35;

    // night: a few stars above the light pollution, and a moon halo
    if (uNight > 0.01) {
      vec2 sc = vec2(az * 38.0, e * 38.0), cell = floor(sc);
      float h = hash(cell), tw = 0.6 + 0.4 * sin(uTime * (2.0 + h * 5.0) + h * 40.0);
      float star = step(0.975, h) * (1.0 - smoothstep(0.05, 0.22, length(fract(sc) - 0.5))) * tw * smoothstep(0.15, 0.4, e);
      col += vec3(1.0, 0.97, 0.85) * star * uStars;
      col += vec3(0.9, 0.95, 1.0) * pow(max(sd, 0.0), 60.0) * 0.5 * uNight;
    }

    // clouds (day: hard-edged arcade clouds; night: smog lit from below)
    for (int L = 0; L < 2; L++) {
      float fl = float(L);
      float lo = mix(0.06, 0.2, fl), hi = mix(0.3, 0.55, fl);
      float band = smoothstep(lo, lo + 0.04, e) * (1.0 - smoothstep(hi - 0.1, hi, e));
      vec2 q = vec2(az * mix(7.0, 4.0, fl) + uCloudT * mix(0.05, 0.03, fl), e * mix(14.0, 9.0, fl) + fl * 7.0);
      float n = fbm(q);
      float c = step(0.58, n) * band;
      vec3 cc = mix(uShade, uCloud, step(0.62, fbm(q + vec2(0.0, 0.12))));
      col = mix(col, cc, c * (1.0 - uPower * 0.6) * (uNight > 0.5 ? 0.5 : 1.0));
    }

    // searchlights sweeping the night sky
    if (uBeams > 0.01 && e > 0.0) {
      for (int k = 0; k < 3; k++) {
        float fk = float(k);
        float a0 = sin(uTime * (0.21 + fk * 0.07) + fk * 2.1) * 0.5 + fk * 2.1 - 2.0;
        float lean = sin(uTime * 0.3 + fk) * 0.25;
        float da = abs(mod(az - a0 - lean * e + 3.14159, 6.28318) - 3.14159);
        float beam = exp(-da * 40.0 / (0.3 + e)) * (1.0 - smoothstep(0.0, 0.9, e));
        col += vec3(0.75, 0.8, 1.0) * beam * 0.35 * uBeams;
      }
    }

    // the city skyline (two layers) — inside an arc of azimuth (the docks see it across the bay)
    if (uCityK > 0.01) {
      float da = abs(mod(az - uArcC + 3.14159, 6.28318) - 3.14159);
      float arc = 1.0 - smoothstep(uArcW - 0.25, uArcW, da);
      float w1, s1, w2, s2;
      float far = skyline(u, e, 90.0, 0.10, 3.0, w1, s1) * arc;
      float near = skyline(u + 0.37, e, 46.0, 0.16, 11.0, w2, s2) * arc;
      // megastructures: two arcology pyramids and their beacons
      for (int k = 0; k < 2; k++) {
        float fk = float(k);
        float pc = fract(0.18 + fk * 0.47 + uArcC / 6.28318);
        float dx = abs(u - pc) * 6.28318;
        float py = 0.36 - dx * 1.6;
        float pyr = step(e, py) * arc;
        float stripe = step(0.5, fract(e * 40.0)) * 0.15;
        vec3 pcol = mix(uCity * 0.85, uBot, 0.25) + stripe * uNight * vec3(1.0, 0.6, 0.3);
        col = mix(col, pcol, pyr * uCityK);
        col += vec3(1.0, 0.5, 0.2) * step(abs(e - py + 0.004), 0.004) * pyr * uNight * 0.6;
      }
      vec3 farCol = mix(uCity, uBot, 0.55 - uNight * 0.2);
      col = mix(col, farCol, far * uCityK);
      col += vec3(1.0, 0.85, 0.55) * w1 * uWin * 0.35 * far;
      vec3 nearCol = mix(uCity, uBot, 0.25 - uNight * 0.15);
      col = mix(col, nearCol, near * uCityK);
      vec3 wcol = mix(vec3(1.0, 0.82, 0.5), vec3(0.5, 0.95, 1.0), step(0.7, hash(vec2(floor(u * 300.0), floor(e * 200.0)))));
      col += wcol * w2 * uWin * 0.7 * near;
      float blink = step(0.5, fract(uTime * 0.8 + u * 13.0));
      col += vec3(1.0, 0.1, 0.1) * (s1 + s2) * blink * (0.4 + uNight);
    }

    // below the horizon: dissolve into the fog colour (the real towers fade into the same colour)
    col = mix(col, uBot, smoothstep(0.0, -0.25, e));
    if (uNight > 0.5 && e < 0.0 && uCityK > 0.01) { // the lit sprawl far below
      vec2 lc = floor(vec2(u * 900.0, e * 300.0));
      col += vec3(1.0, 0.7, 0.4) * step(0.985, hash(lc)) * smoothstep(-0.02, -0.2, e) * 0.5;
    }

    // power-up sky: full-dome two-tone sunburst spinning round the zenith, hue cycling
    if (uPower > 0.001) {
      float burst = step(0.5, fract(az * 16.0 / 6.2832 + uTime * 0.6 + e * 1.5));
      vec3 a = hue(fract(uTime * 0.15)) * 0.9 + 0.1, b = hue(fract(uTime * 0.15 + 0.12)) * 0.6 + 0.4;
      vec3 p = mix(a, b, burst);
      p = mix(p, vec3(1.0), exp(-abs(e) * 6.0) * 0.5);
      col = mix(col, p, uPower * 0.8);
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export class Sky {
  constructor(scene) {
    const C = () => ({ value: new THREE.Color() });
    this.u = {
      uTop: C(), uBot: C(), uCloud: C(), uShade: C(), uSun: C(), uCity: C(),
      uSunDir: { value: new THREE.Vector3(-0.5, 0.35, -0.8).normalize() },
      uTime: { value: 0 }, uPower: { value: 0 }, uCloudT: { value: 0 }, uNight: { value: 0 },
      uCityK: { value: 1 }, uWin: { value: 0 }, uArcC: { value: 0 }, uArcW: { value: 4 }, uStars: { value: 0 }, uBeams: { value: 0 },
    };
    const m = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(300, seg(48, 24), seg(24, 16)), m);
    this.mesh.renderOrder = -100;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.power = 0;
    this.powerTarget = 0;
  }

  setTheme(th) {
    const U = this.u;
    U.uTop.value.set(th.skyTop); U.uBot.value.set(th.skyBot);
    U.uCloud.value.set(th.cloud); U.uShade.value.set(th.cloudShade);
    U.uSun.value.set(th.sun); U.uCity.value.set(th.cityCol);
    U.uSunDir.value.set(...th.sunDir).normalize();
    U.uNight.value = th.night; U.uCityK.value = th.city; U.uWin.value = th.windows;
    U.uArcC.value = th.arc[0]; U.uArcW.value = th.arc[1];
    U.uStars.value = th.stars; U.uBeams.value = th.beams;
    this.base = th.power || 0;
  }

  update(dt, t, camera) {
    this.mesh.position.copy(camera.position);
    const target = Math.max(this.base * 0.55, this.powerTarget);
    this.power += (target - this.power) * Math.min(1, dt * 4);
    this.u.uTime.value = t;
    this.u.uPower.value = this.power;
    this.u.uCloudT.value += dt * (1 + this.power * 4) * 3;
  }
}
