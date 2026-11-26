// Maths for Monsoon Post: scalars, noise, vectors, quaternions, matrices and a tiny flat-shaded
// mesh builder. Nothing here knows what a game is; every other module builds on it.
export function clamp(value, low, high) {
return value < low ? low : value > high ? high : value;
}
export function lerp(a, b, t) {
return a + (b - a) * t;
}
export function smoothstep(edge0, edge1, x) {
const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
return t * t * (3 - 2 * t);
}
/** Mulberry32: a small seeded generator, so a shot seed always flies the same pass. */
export function makeRng(seed) {
let a = seed | 0;
return function random() {
a = (a + 0x6d2b79f5) | 0;
let t = Math.imul(a ^ (a >>> 15), 1 | a);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
function hash2(ix, iy) {
let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + 0x9e3779b9;
h = Math.imul(h ^ (h >>> 13), 1274126177);
return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth value noise in 0..1. */
export function noise2(x, y) {
const ix = Math.floor(x);
const iy = Math.floor(y);
const fx = x - ix;
const fy = y - iy;
const u = fx * fx * (3 - 2 * fx);
const v = fy * fy * (3 - 2 * fy);
const a = hash2(ix, iy);
const b = hash2(ix + 1, iy);
const c = hash2(ix, iy + 1);
const d = hash2(ix + 1, iy + 1);
return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
/** Fractal Brownian motion, 0..1. */
export function fbm2(x, y, octaves) {
let sum = 0;
let amp = 0.5;
let total = 0;
let fx = x;
let fy = y;
for (let i = 0; i < octaves; i += 1) {
sum += noise2(fx, fy) * amp;
total += amp;
fx = fx * 2.03 + 17.1;
fy = fy * 2.01 - 9.7;
amp *= 0.5;
}
return sum / total;
}
/** Ridged fractal noise, 0..1, for the highland spines. */
export function ridge2(x, y, octaves) {
let sum = 0;
let amp = 0.55;
let total = 0;
let fx = x;
let fy = y;
for (let i = 0; i < octaves; i += 1) {
const n = 1 - Math.abs(noise2(fx, fy) * 2 - 1);
sum += n * n * amp;
total += amp;
fx = fx * 2.07 - 5.3;
fy = fy * 2.03 + 8.9;
amp *= 0.5;
}
return sum / total;
}
export function hex(ch) {
const n = Number.parseInt(ch.slice(1), 16);
return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function mixColor(a, b, t) {
return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
export function vec(x = 0, y = 0, z = 0) {
return { x, y, z };
}
export function vadd(a, b) {
return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
export function vsub(a, b) {
return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
export function vscale(a, s) {
return { x: a.x * s, y: a.y * s, z: a.z * s };
}
export function vdot(a, b) {
return a.x * b.x + a.y * b.y + a.z * b.z;
}
export function vcross(a, b) {
return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}
export function vlen(a) {
return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
}
export function vnorm(a) {
const l = vlen(a);
return l > 1e-6 ? { x: a.x / l, y: a.y / l, z: a.z / l } : { x: 0, y: 0, z: 0 };
}
export function vlerp(a, b, t) {
return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}
export function quatIdentity() {
return [0, 0, 0, 1];
}
export function quatAxisAngle(ax, ay, az, angle) {
const s = Math.sin(angle / 2);
return [ax * s, ay * s, az * s, Math.cos(angle / 2)];
}
export function quatMul(a, b) {
return [
a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
}
export function quatNormalize(q) {
const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}
export function quatRotate(q, v) {
const [x, y, z, w] = q;
const ix = w * v.x + y * v.z - z * v.y;
const iy = w * v.y + z * v.x - x * v.z;
const iz = w * v.z + x * v.y - y * v.x;
const iw = -x * v.x - y * v.y - z * v.z;
return {
x: ix * w + iw * -x + iy * -z - iz * -y,
y: iy * w + iw * -y + iz * -x - ix * -z,
z: iz * w + iw * -z + ix * -y - iy * -x,
};
}
export function quatFromYawPitchRoll(yaw, pitch, roll) {
const qy = quatAxisAngle(0, 1, 0, yaw);
const qp = quatAxisAngle(1, 0, 0, pitch);
const qr = quatAxisAngle(0, 0, 1, roll);
return quatNormalize(quatMul(quatMul(qy, qp), qr));
}
/** Local axes of a body with this quaternion: forward -Z, right +X, up +Y. */
export function bodyAxes(q) {
return {
fwd: quatRotate(q, { x: 0, y: 0, z: -1 }),
right: quatRotate(q, { x: 1, y: 0, z: 0 }),
up: quatRotate(q, { x: 0, y: 1, z: 0 }),
};
}
export function mat4Perspective(fovy, aspect, near, far) {
const f = 1 / Math.tan(fovy / 2);
const nf = 1 / (near - far);
return new Float32Array([
f / aspect, 0, 0, 0,
0, f, 0, 0,
0, 0, (far + near) * nf, -1,
0, 0, 2 * far * near * nf, 0,
]);
}
export function mat4LookAt(eye, target, up) {
const z = vnorm(vsub(eye, target));
const x = vnorm(vcross(up, z));
const y = vcross(z, x);
return new Float32Array([
x.x, y.x, z.x, 0,
x.y, y.y, z.y, 0,
x.z, y.z, z.z, 0,
-vdot(x, eye), -vdot(y, eye), -vdot(z, eye), 1,
]);
}
export function mat4Multiply(a, b) {
const out = new Float32Array(16);
for (let c = 0; c < 4; c += 1) {
for (let r = 0; r < 4; r += 1) {
out[c * 4 + r] =
a[r] * b[c * 4] +
a[4 + r] * b[c * 4 + 1] +
a[8 + r] * b[c * 4 + 2] +
a[12 + r] * b[c * 4 + 3];
}
}
return out;
}
/** Model matrix from position, quaternion and uniform scale. */
export function mat4Model(position, q, scale = 1) {
const [x, y, z, w] = q;
const xx = x * x;
const yy = y * y;
const zz = z * z;
const xy = x * y;
const xz = x * z;
const yz = y * z;
const wx = w * x;
const wy = w * y;
const wz = w * z;
return new Float32Array([
(1 - 2 * (yy + zz)) * scale, 2 * (xy + wz) * scale, 2 * (xz - wy) * scale, 0,
2 * (xy - wz) * scale, (1 - 2 * (xx + zz)) * scale, 2 * (yz + wx) * scale, 0,
2 * (xz + wy) * scale, 2 * (yz - wx) * scale, (1 - 2 * (xx + yy)) * scale, 0,
position.x, position.y, position.z, 1,
]);
}
export function createMeshBuilder() {
const data = [];
function vert(p, n, c) {
data.push(p.x, p.y, p.z, n.x, n.y, n.z, c[0], c[1], c[2]);
}
function tri(a, b, c, color) {
const n = vnorm(vcross(vsub(b, a), vsub(c, a)));
vert(a, n, color);
vert(b, n, color);
vert(c, n, color);
}
function quad(a, b, c, d, color) {
quad4(a, b, c, d, [color, color, color, color]);
}
function quad4(a, b, c, d, colors) {
const n = vnorm(vcross(vsub(b, a), vsub(d, a)));
vert(a, n, colors[0]);
vert(b, n, colors[1]);
vert(c, n, colors[2]);
vert(a, n, colors[0]);
vert(c, n, colors[2]);
vert(d, n, colors[3]);
}
function transformPoint(p, center, yaw, pitch, roll) {
let x = p.x;
let y = p.y;
let z = p.z;
if (roll) {
const cy = Math.cos(roll);
const sy = Math.sin(roll);
const nx = x * cy - y * sy;
y = x * sy + y * cy;
x = nx;
}
if (pitch) {
const cp = Math.cos(pitch);
const sp = Math.sin(pitch);
const ny = y * cp - z * sp;
z = y * sp + z * cp;
y = ny;
}
if (yaw) {
const cy = Math.cos(yaw);
const sy = Math.sin(yaw);
const nx = x * cy + z * sy;
z = -x * sy + z * cy;
x = nx;
}
return { x: x + center.x, y: y + center.y, z: z + center.z };
}
function box(center, size, color, yaw = 0, pitch = 0, roll = 0) {
const hx = size.x / 2;
const hy = size.y / 2;
const hz = size.z / 2;
const p = [];
for (let i = 0; i < 8; i += 1) {
p.push(transformPoint({
x: i & 1 ? hx : -hx,
y: i & 2 ? hy : -hy,
z: i & 4 ? hz : -hz,
}, center, yaw, pitch, roll));
}
quad(p[0], p[2], p[3], p[1], color); // -Z
quad(p[4], p[5], p[7], p[6], color); // +Z
quad(p[0], p[1], p[5], p[4], color); // -Y
quad(p[2], p[6], p[7], p[3], color); // +Y
quad(p[0], p[4], p[6], p[2], color); // -X
quad(p[1], p[3], p[7], p[5], color); // +X
}
/** A pitched roof: ridge runs along Z, eaves at +-width/2. */
function prism(center, width, height, length, color) {
const hw = width / 2;
const hl = length / 2;
const eL = { x: -hw, y: 0, z: -hl };
const eR = { x: hw, y: 0, z: -hl };
const eR2 = { x: hw, y: 0, z: hl };
const eL2 = { x: -hw, y: 0, z: hl };
const r1 = { x: 0, y: height, z: -hl };
const r2 = { x: 0, y: height, z: hl };
const off = (v) => ({ x: v.x + center.x, y: v.y + center.y, z: v.z + center.z });
tri(off(eL), off(eR), off(r1), color);
quad(off(eL), off(r1), off(r2), off(eL2), color);
quad(off(eR2), off(r2), off(r1), off(eR), color);
tri(off(eL), off(eL2), off(r2), color);
tri(off(eR), off(r1), off(r2), color);
}
function cylinderBetween(a, b, radius, color, segments = 8) {
const axis = vnorm(vsub(b, a));
const helper = Math.abs(axis.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
const u = vnorm(vcross(helper, axis));
const v = vcross(axis, u);
const ringA = [];
const ringB = [];
for (let i = 0; i < segments; i += 1) {
const t = (i / segments) * Math.PI * 2;
const off = {
x: (u.x * Math.cos(t) + v.x * Math.sin(t)) * radius,
y: (u.y * Math.cos(t) + v.y * Math.sin(t)) * radius,
z: (u.z * Math.cos(t) + v.z * Math.sin(t)) * radius,
};
ringA.push({ x: a.x + off.x, y: a.y + off.y, z: a.z + off.z });
ringB.push({ x: b.x + off.x, y: b.y + off.y, z: b.z + off.z });
}
for (let i = 0; i < segments; i += 1) {
const j = (i + 1) % segments;
quad(ringA[i], ringA[j], ringB[j], ringB[i], color);
tri(a, ringA[j], ringA[i], color);
tri(b, ringB[i], ringB[j], color);
}
}
function coneBetween(a, b, radius, color, segments = 8) {
const axis = vnorm(vsub(b, a));
const helper = Math.abs(axis.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
const u = vnorm(vcross(helper, axis));
const v = vcross(axis, u);
for (let i = 0; i < segments; i += 1) {
const t = (i / segments) * Math.PI * 2;
const t2 = ((i + 1) / segments) * Math.PI * 2;
const p1 = {
x: a.x + (u.x * Math.cos(t) + v.x * Math.sin(t)) * radius,
y: a.y + (u.y * Math.cos(t) + v.y * Math.sin(t)) * radius,
z: a.z + (u.z * Math.cos(t) + v.z * Math.sin(t)) * radius,
};
const p2 = {
x: a.x + (u.x * Math.cos(t2) + v.x * Math.sin(t2)) * radius,
y: a.y + (u.y * Math.cos(t2) + v.y * Math.sin(t2)) * radius,
z: a.z + (u.z * Math.cos(t2) + v.z * Math.sin(t2)) * radius,
};
tri(p1, p2, b, color);
tri(a, p2, p1, color);
}
}
function build() {
return new Float32Array(data);
}
return { box, prism, cylinderBetween, coneBetween, quad, quad4, tri, build };
}
