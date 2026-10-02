// Neon glow: a cheap bloom for the night stages, added on top of the finished world pass.
//
// The world still renders straight to the canvas (so the retro 15-bit dither and colours are untouched).
// Then: copy the frame into a texture → keep only its brightest, most saturated pixels at ½ resolution →
// blur (and, on High, again at ¼ for a wider halo) → add back onto the canvas. It works in display space
// on a ~240-line frame, so it costs a handful of tiny passes and the glow comes out as chunky as the
// pixels around it. Day themes skip it entirely (theme.bloom, default: theme.night).
import * as THREE from 'three';

const VERT = 'varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';

// bright pass: the strongest channel decides, weighted by saturation (neon glows; white and grey barely), soft knee
const BRIGHT = `
  uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uLo, uHi; varying vec2 vUv;
  vec3 pick(vec2 uv) { // saturated neon glows most; pale lit windows and white signs much less
    vec3 c = texture2D(tSrc, uv).rgb; float m = max(c.r, max(c.g, c.b)), n = min(c.r, min(c.g, c.b));
    float sat = (m - n) / max(m, 1e-3);
    return c * smoothstep(uLo, uHi, m) * (0.25 + 0.75 * sat);
  }
  void main() { // 4 taps: a box-filtered ½-res downsample
    vec2 d = uTexel * 0.5;
    gl_FragColor = vec4((pick(vUv + vec2(-d.x, -d.y)) + pick(vUv + vec2(d.x, -d.y)) + pick(vUv + vec2(-d.x, d.y)) + pick(vUv + vec2(d.x, d.y))) * 0.25, 1.0);
  }`;
// separable 9-tap gaussian (linear sampling between taps)
const BLUR = `
  uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
    c += (texture2D(tSrc, vUv + uDir * 1.384615).rgb + texture2D(tSrc, vUv - uDir * 1.384615).rgb) * 0.316216;
    c += (texture2D(tSrc, vUv + uDir * 3.230769).rgb + texture2D(tSrc, vUv - uDir * 3.230769).rgb) * 0.070270;
    gl_FragColor = vec4(c, 1.0);
  }`;
const COPY = 'uniform sampler2D tSrc; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tSrc, vUv).rgb, 1.0); }';
const ADD = `
  uniform sampler2D tA, tB; uniform float uA, uB; varying vec2 vUv;
  void main() { gl_FragColor = vec4(texture2D(tA, vUv).rgb * uA + texture2D(tB, vUv).rgb * uB, 1.0); }`;

const rt = () => new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

export class Glow {
  constructor(renderer) {
    this.r = renderer;
    this.k = 0; this.levels = 2; this.w = 0; this.h = 0;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    const mat = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, ...extra });
    this.mBright = mat(BRIGHT, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uLo: { value: 0.6 }, uHi: { value: 1.0 } });
    this.mBlur = mat(BLUR, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.mCopy = mat(COPY, { tSrc: { value: null } });
    this.mAdd = mat(ADD, { tA: { value: null }, tB: { value: null }, uA: { value: 1 }, uB: { value: 0 } }, { blending: THREE.AdditiveBlending, transparent: true });
    this.a = rt(); this.b = rt(); this.c = rt(); this.d = rt();
    this.src = null;
    this._v = new THREE.Vector2();
  }

  // strength: 0 = off (the pass is skipped). levels: 1 (½ res only) or 2 (+ a wider ¼-res halo).
  set(strength, levels = 2) { this.k = strength; this.levels = levels; }

  _size() {
    const s = this.r.getDrawingBufferSize(this._v), w = Math.max(2, s.x | 0), h = Math.max(2, s.y | 0);
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    if (this.src) this.src.dispose();
    this.src = new THREE.FramebufferTexture(w, h);
    this.src.minFilter = this.src.magFilter = THREE.LinearFilter;
    const w2 = Math.max(1, w >> 1), h2 = Math.max(1, h >> 1), w4 = Math.max(1, w >> 2), h4 = Math.max(1, h >> 2);
    this.a.setSize(w2, h2); this.b.setSize(w2, h2); this.c.setSize(w4, h4); this.d.setSize(w4, h4);
  }

  _pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.scene, this.cam); }

  // After the world pass, before the viewmodel. Leaves the canvas bound.
  apply() {
    if (this.k <= 0.001) return;
    this._size();
    const r = this.r;
    r.copyFramebufferToTexture(this._v.set(0, 0), this.src);
    this.mBright.uniforms.tSrc.value = this.src;
    this.mBright.uniforms.uTexel.value.set(1 / this.w, 1 / this.h);
    this._pass(this.mBright, this.a);
    const blur = (from, via, w, h) => {
      this.mBlur.uniforms.tSrc.value = from.texture; this.mBlur.uniforms.uDir.value.set(1 / w, 0); this._pass(this.mBlur, via);
      this.mBlur.uniforms.tSrc.value = via.texture; this.mBlur.uniforms.uDir.value.set(0, 1 / h); this._pass(this.mBlur, from);
    };
    blur(this.a, this.b, this.a.width, this.a.height);
    const wide = this.levels > 1;
    if (wide) {
      this.mCopy.uniforms.tSrc.value = this.a.texture; this._pass(this.mCopy, this.c);
      blur(this.c, this.d, this.c.width, this.c.height);
    }
    const U = this.mAdd.uniforms;
    U.tA.value = this.a.texture; U.tB.value = (wide ? this.c : this.a).texture;
    U.uA.value = this.k * 0.55; U.uB.value = wide ? this.k * 0.7 : 0;
    this._pass(this.mAdd, null);
  }

  dispose() {
    for (const t of [this.a, this.b, this.c, this.d]) t.dispose();
    if (this.src) this.src.dispose();
    for (const m of [this.mBright, this.mBlur, this.mCopy, this.mAdd]) m.dispose();
    this.quad.geometry.dispose();
  }
}
