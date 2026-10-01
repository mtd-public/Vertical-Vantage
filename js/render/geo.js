// Geometry helpers: build models out of primitives with per-vertex colour, then merge them per
// material so a whole stage is a handful of draw calls (doc 07: bakeStatic). The bevelled block
// builder (footprintShape + slab) is dr-mow's (js/scene.js), used for the floating decks.
import * as THREE from 'three';
import { mergeGeometries } from '../vendor/addons/BufferGeometryUtils.js';
import { seg } from './retro.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();

// Normalise a geometry for merging: non-indexed, position + normal + uv + color.
export function prep(geo, color = 0xffffff) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.position.count;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  if (!g.attributes.color) {
    _c.set(color);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}

// Place a primitive: o = { x, y, z, rx, ry, rz, sx, sy, sz, color }
export function part(geo, o = {}) {
  const g = prep(geo, o.color ?? 0xffffff);
  _e.set(o.rx || 0, o.ry || 0, o.rz || 0);
  _q.setFromEuler(_e);
  _s.set(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1);
  _p.set(o.x || 0, o.y || 0, o.z || 0);
  _m.compose(_p, _q, _s);
  g.applyMatrix4(_m);
  return g;
}

export const box = (w, h, d, o) => part(new THREE.BoxGeometry(w, h, d), o);
export const cyl = (rt, rb, h, n, o) => part(new THREE.CylinderGeometry(rt, rb, h, n), o);
export const ball = (r, o, detail = 0) => part(new THREE.IcosahedronGeometry(r, detail), o);

export function merge(list) {
  const ok = list.filter(Boolean);
  if (!ok.length) return null;
  const g = mergeGeometries(ok, false);
  for (const x of ok) x.dispose();
  return g;
}

// Collects parts per material key, then merges: kit.add('paint', box(...)); kit.build() → { paint: geo, ... }
export class Kit {
  constructor() { this.parts = {}; }
  add(key, ...geos) { (this.parts[key] ||= []).push(...geos.filter(Boolean)); return this; }
  build() { const out = {}; for (const k in this.parts) out[k] = merge(this.parts[k]); return out; }
}

// Translate/rotate an already-prepped geometry in place (used when placing into a world kit).
export function placeGeo(g, x, y, z, yaw = 0) {
  _e.set(0, yaw, 0); _q.setFromEuler(_e); _s.set(1, 1, 1); _p.set(x, y, z);
  _m.compose(_p, _q, _s);
  g.applyMatrix4(_m);
  return g;
}
export const cloneGeo = (g) => g.clone();

// Box with UVs in world metres (u along the face's horizontal, v up), scaled by 1/tile.
// faces: which faces to emit ('px','nx','py','ny','pz','nz'). Returns a prepped geometry
// centred on (0,0,0) sized w × h × d.
export function meterBox(w, h, d, tile, o = {}) {
  const faces = o.faces || ['px', 'nx', 'py', 'pz', 'nz'];
  const pos = [], nor = [], uv = [];
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const ou = o.u0 || 0, ov = o.v0 || 0;
  const quad = (a, b, c, d2, n, ua, va, ub, vb) => {
    // a b c d counter-clockwise seen from outside
    for (const [p, t] of [[a, [ua, va]], [b, [ub, va]], [c, [ub, vb]], [a, [ua, va]], [c, [ub, vb]], [d2, [ua, vb]]]) {
      pos.push(...p); nor.push(...n); uv.push((t[0] + ou) / tile, (t[1] + ov) / tile);
    }
  };
  const yb = o.vBase ?? -hh; // v measured from this height (so stacked boxes line up)
  if (faces.includes('pz')) quad([-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd], [0, 0, 1], 0, -hh - yb, w, hh - yb);
  if (faces.includes('nz')) quad([hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd], [0, 0, -1], 0, -hh - yb, w, hh - yb);
  if (faces.includes('px')) quad([hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd], [1, 0, 0], 0, -hh - yb, d, hh - yb);
  if (faces.includes('nx')) quad([-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd], [-1, 0, 0], 0, -hh - yb, d, hh - yb);
  if (faces.includes('py')) quad([-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd], [0, 1, 0], 0, 0, w, d);
  if (faces.includes('ny')) quad([-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd], [0, -1, 0], 0, 0, w, d);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return prep(g, o.color ?? 0xffffff);
}

// A flat quad facing +Z with UVs set to a rect [u0, v0, u1, v1] (atlas cells: ads, signs).
export function atlasQuad(w, h, r, o = {}) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? r[2] : r[0], uv.getY(i) ? r[3] : r[1]);
  return part(g, o);
}

// ------------------------------------------------------------------ dr-mow blocks
const CORNER = 0.35;
export function footprintShape(p, grow, bevel) {
  const s = new THREE.Shape();
  if (p.kind === 'disc') { s.absarc(0, 0, p.r + grow, 0, Math.PI * 2, false); return s; }
  const hw = p.w / 2 + grow, hd = p.d / 2 + grow, r = Math.max(0.05, Math.min(CORNER - bevel, hw, hd));
  s.moveTo(-hw + r, -hd);
  s.lineTo(hw - r, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + r);
  s.lineTo(hw, hd - r); s.quadraticCurveTo(hw, hd, hw - r, hd);
  s.lineTo(-hw + r, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - r);
  s.lineTo(-hw, -hd + r); s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  return s;
}
// Bevelled extrusion stood upright; place(x, z, yRelToTop, isUpperHalf, yRelToBottom) sets each vertex height.
export function slab(shape, depth, bevel, place, steps = 1, curveSegments = 10) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, steps, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg(2, 1), curveSegments: seg(curveSegments, Math.max(6, Math.round(curveSegments / 2.5))) });
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const maxY = depth + bevel, minY = -bevel, mid = (maxY + minY) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    pos.setY(i, place(x, z, y - maxY, y >= mid, y - minY));
  }
  geo.computeVertexNormals();
  return geo;
}

// Colour a geometry's vertices by height bands: bands = [[fromTop (m), color], ...] sorted.
export function bandColors(g, topY, bands) {
  const pos = g.attributes.position, col = g.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const dy = topY - pos.getY(i);
    let c = bands[bands.length - 1][1];
    for (const [d, cc] of bands) if (dy <= d) { c = cc; break; }
    _c.set(c);
    col.setXYZ(i, _c.r, _c.g, _c.b);
  }
  col.needsUpdate = true;
  return g;
}
