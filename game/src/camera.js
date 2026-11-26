// Both cameras: the chase view that trails the aircraft with a spring (only translation is smoothed,
// so it never fights the pilot) and the cockpit eye behind the windscreen. Also the world-to-screen
// projection the HUD uses to pin the target ring onto the village below it.
import { bodyAxes, clamp, lerp, mat4LookAt, mat4Multiply, mat4Perspective, quatAxisAngle, quatRotate, vnorm } from './util.js';
const CHASE_BACK = 27;
const CHASE_UP = 5.0;
const COCKPIT_EYE = { x: 0, y: 0.42, z: -1.25 };
export function createCamera() {
return {
eye: { x: 0, y: 700, z: 0 },
fwd: { x: 0, y: 0, z: -1 },
right: { x: 1, y: 0, z: 0 },
up: { x: 0, y: 1, z: 0 },
fov: 64,
mode: 'chase',
shake: 0,
time: 0,
viewProj: new Float32Array(16),
width: 1280,
height: 800,
snapped: false,
back: CHASE_BACK,
camHeight: CHASE_UP,
yawOffset: 0,
pitchOffset: 3.2,
fovOverride: 0,
side: 0,
};
}
function lookBasis(eye, fwd, upHint) {
const right = vnorm({
x: fwd.y * upHint.z - fwd.z * upHint.y,
y: fwd.z * upHint.x - fwd.x * upHint.z,
z: fwd.x * upHint.y - fwd.y * upHint.x,
});
const up = vnorm({
x: right.y * fwd.z - right.z * fwd.y,
y: right.z * fwd.x - right.x * fwd.z,
z: right.x * fwd.y - right.y * fwd.x,
});
return { right, up };
}
export function updateCamera(camera, flight, view, dt, env) {
camera.time += dt;
camera.mode = view;
const axes = bodyAxes(flight.q);
if (view === 'cockpit') {
const offset = quatRotate(flight.q, COCKPIT_EYE);
camera.eye = { x: flight.p.x + offset.x, y: flight.p.y + offset.y, z: flight.p.z + offset.z };
camera.fwd = axes.fwd;
camera.up = axes.up;
if (camera.pitchOffset) {
const pitch = camera.pitchOffset * (Math.PI / 180);
camera.fwd = vnorm({
x: camera.fwd.x * Math.cos(pitch) - camera.up.x * Math.sin(pitch),
y: camera.fwd.y * Math.cos(pitch) - camera.up.y * Math.sin(pitch),
z: camera.fwd.z * Math.cos(pitch) - camera.up.z * Math.sin(pitch),
});
}
camera.fov = camera.fovOverride || 78;
const basis = lookBasis(camera.eye, camera.fwd, camera.up);
camera.right = basis.right;
camera.up = basis.up;
} else {
const roll = flight.bank * 0.35;
const rollUp = quatRotate(quatAxisAngle(axes.fwd.x, axes.fwd.y, axes.fwd.z, roll), { x: 0, y: 1, z: 0 });
const back = { x: -axes.fwd.x, y: -axes.fwd.y, z: -axes.fwd.z };
const backDist = camera.back ?? CHASE_BACK;
const upDist = camera.camHeight ?? CHASE_UP;
const sideDist = camera.side ?? 0;
const desired = {
x: flight.p.x + back.x * backDist + rollUp.x * upDist + axes.right.x * sideDist,
y: flight.p.y + back.y * backDist + rollUp.y * upDist + axes.right.y * sideDist,
z: flight.p.z + back.z * backDist + rollUp.z * upDist + axes.right.z * sideDist,
};
const ground = env.groundHeight(desired.x, desired.z);
desired.y = Math.max(desired.y, ground + 3.2);
const lag = camera.snapped ? 1 : clamp(dt * 8, 0, 1);
camera.eye = {
x: lerp(camera.eye.x, desired.x, lag),
y: lerp(camera.eye.y, desired.y, lag),
z: lerp(camera.eye.z, desired.z, lag),
};
camera.eye.y = Math.max(camera.eye.y, env.groundHeight(camera.eye.x, camera.eye.z) + 2.6);
camera.fwd = axes.fwd;
camera.up = rollUp;
if (camera.yawOffset) {
const yaw = camera.yawOffset * (Math.PI / 180);
const right0 = vnorm({ x: camera.fwd.y * camera.up.z - camera.fwd.z * camera.up.y, y: camera.fwd.z * camera.up.x - camera.fwd.x * camera.up.z, z: camera.fwd.x * camera.up.y - camera.fwd.y * camera.up.x });
camera.fwd = vnorm({ x: camera.fwd.x * Math.cos(yaw) + right0.x * Math.sin(yaw), y: camera.fwd.y * Math.cos(yaw) + right0.y * Math.sin(yaw), z: camera.fwd.z * Math.cos(yaw) + right0.z * Math.sin(yaw) });
}
if (camera.pitchOffset) {
const pitch = camera.pitchOffset * (Math.PI / 180);
camera.fwd = vnorm({ x: camera.fwd.x * Math.cos(pitch) - camera.up.x * Math.sin(pitch), y: camera.fwd.y * Math.cos(pitch) - camera.up.y * Math.sin(pitch), z: camera.fwd.z * Math.cos(pitch) - camera.up.z * Math.sin(pitch) });
}
const speed = flight.airspeed ?? 0;
camera.fov = camera.fovOverride || (62 + clamp((speed - 38) * 0.22, 0, 10));
const basis = lookBasis(camera.eye, camera.fwd, camera.up);
camera.right = basis.right;
camera.up = basis.up;
}
const shakeAmount = (flight.buffet ?? 0) * 0.6 + camera.shake;
if (shakeAmount > 0.001) {
const t = camera.time * 41;
camera.eye.x += Math.sin(t * 1.7) * shakeAmount * 0.12;
camera.eye.y += Math.sin(t * 2.3 + 1.1) * shakeAmount * 0.1;
camera.fwd = vnorm({
x: camera.fwd.x + Math.sin(t * 1.9) * shakeAmount * 0.004,
y: camera.fwd.y + Math.sin(t * 2.7 + 0.7) * shakeAmount * 0.004,
z: camera.fwd.z,
});
}
camera.shake = Math.max(0, camera.shake - dt * 6);
const aspect = camera.width / camera.height;
const view4 = mat4LookAt(camera.eye, {
x: camera.eye.x + camera.fwd.x,
y: camera.eye.y + camera.fwd.y,
z: camera.eye.z + camera.fwd.z,
}, camera.up);
const proj = mat4Perspective((camera.fov * Math.PI) / 180, aspect, 0.35, 14000);
camera.viewProj = mat4Multiply(proj, view4);
return camera;
}
/** Screen position of a world point, for the HUD's target ring and damage callouts. */
export function projectPoint(camera, point) {
const m = camera.viewProj;
const x = point.x;
const y = point.y;
const z = point.z;
const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
if (cw <= 0.01) return { x: 0, y: 0, visible: false, distance: 0 };
const ndcX = cx / cw;
const ndcY = cy / cw;
return {
x: (ndcX * 0.5 + 0.5) * camera.width,
y: (1 - (ndcY * 0.5 + 0.5)) * camera.height,
visible: ndcX > -1.2 && ndcX < 1.2 && ndcY > -1.2 && ndcY < 1.2,
distance: cw,
scale: 1 / Math.max(0.35, cw),
};
}
export function shake(camera, amount) {
camera.shake = Math.max(camera.shake, amount);
}
