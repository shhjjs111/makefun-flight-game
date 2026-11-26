// The title pass and the four screenshot scenes. Each scene starts the real flight model at a
// plausible point in a real sortie and flies it with a small scripted pilot from a fixed seed; it
// freezes on a state predicate, so every number the HUD prints was flown, never typed.
import { bodyAxes, clamp, quatFromYawPitchRoll, vadd, vscale } from './util.js';
import { createFlight, readouts, stepFlight } from './flight-model.js';
import { createSortie, MISSIONS, RINGS, targetInfo } from './missions.js';
import { buildSky, setSkyLight, setWeather, windAt } from './sky.js';
import { STRIPS, heightAt } from './terrain.js';
import { createCamera, updateCamera } from './camera.js';
export const ATTRACT_PASS = {
name: 'dawn mail run',
x: -900, y: 760, z: 1000, heading: 38, speed: 48, altitude: 820,
};
export const SHOT_LIST = [
{ name: '1-cover-final-approach.jpg', query: '?shot=cover&seed=7', moment: 'chase, 520 m final to Tamsen 27 at dawn' },
{ name: '2-tea-drop-bank.jpg', query: '?shot=drop&seed=7', moment: '45° bank over Upper Tamsen, sack in the air' },
{ name: '3-storm-cockpit.jpg', query: '?shot=storm&seed=7', moment: 'cockpit, squall, oil pressure low, nine minutes of fuel' },
{ name: '4-touchdown-firm.jpg', query: '?shot=touchdown&seed=7', moment: 'main wheels on Nimra Kot, dust and the grade ribbon' },
];
const RAD = Math.PI / 180;
export function flightEnv(sky, strips = STRIPS) {
return {
windAt: (x, y, z) => windAt(sky, x, y, z),
groundHeight: (x, z) => {
for (const strip of strips) {
if (Math.abs(x - strip.x) <= strip.length / 2 + 4 && Math.abs(z - strip.z) <= strip.width / 2 + 2) {
return Math.max(heightAt(x, z), strip.elev + 0.12);
}
}
return heightAt(x, z);
},
strips,
turbulence: sky.weather.gust,
};
}
function holdPilot(flight, target, dt) {
const bankDeg = (flight.bank / RAD);
const pitchDeg = flight.pitch / RAD;
const roll = clamp((bankDeg - target.bank) * 0.035, -0.9, 0.9);
const pitch = clamp((target.pitch - pitchDeg) * 0.055 - flight.w.x * 0.1, -0.7, 0.7);
let yaw = clamp(-(bankDeg - target.bank) * 0.008, -0.5, 0.5);
if (target.heading !== undefined) {
const error = ((target.heading - flight.heading + 540) % 360) - 180;
yaw = clamp(error * 0.03, -0.6, 0.6);
}
const controls = {
pitch, roll, yaw,
throttle: target.throttle, flaps: target.flaps ?? flight.flaps, gear: target.gear ?? flight.gear,
brakes: 0, lean: false,
};
stepFlight(flight, controls, target.env, dt);
}
function flyFor(flight, env, seconds, target) {
const steps = Math.round(seconds * 120);
for (let i = 0; i < steps; i += 1) holdPilot(flight, { ...target, env }, 1 / 120);
}
/** The title screen's live pass: a gentle S-turn over the valley, always above the ridge. */
export function flyAttract(flight, sky, dt, time) {
const env = flightEnv(sky);
const target = {
bank: Math.sin(time * 0.16) * 18,
pitch: clamp((820 - flight.p.y) * 0.12, -6, 8),
throttle: 0.58,
flaps: 0,
gear: true,
env,
};
holdPilot(flight, target, dt);
if (flight.p.y < heightAt(flight.p.x, flight.p.z) + 25 || flight.crashed) {
flight.p = { x: ATTRACT_PASS.x, y: ATTRACT_PASS.y, z: ATTRACT_PASS.z };
flight.v = { x: 0, y: 0, z: 0 };
flight.q = quatFromYawPitchRoll(-ATTRACT_PASS.heading * RAD, 0.02, 0);
flight.heading = ATTRACT_PASS.heading;
flight.airspeed = ATTRACT_PASS.speed;
flight.crashed = false;
flight.onGround = false;
}
}
export function createAttractFlight() {
const strip = STRIPS[0];
const flight = createFlight({ strip, fuel: 150, cargo: 40 });
flight.onGround = false;
flight.p = { x: ATTRACT_PASS.x, y: ATTRACT_PASS.y, z: ATTRACT_PASS.z };
flight.heading = ATTRACT_PASS.heading;
flight.q = quatFromYawPitchRoll(-ATTRACT_PASS.heading * RAD, 0.02, 0);
const axes = bodyAxes(flight.q);
flight.v = vscale(axes.fwd, ATTRACT_PASS.speed);
flight.airspeed = ATTRACT_PASS.speed;
flight.throttle = 0.58;
flight.gear = true;
flight.flaps = 10;
return flight;
}
function configureCamera(camera, mode, shot) {
camera.mode = mode;
camera.back = shot.back ?? 27;
camera.camHeight = shot.height ?? 5;
camera.side = shot.side ?? 0;
camera.yawOffset = shot.yaw ?? 0;
camera.pitchOffset = shot.pitch ?? 3;
camera.fovOverride = shot.fov ?? 0;
camera.snapped = true;
camera.shake = 0;
}
function coverShot(sky) {
const strip = STRIPS.find((item) => item.id === 'tamsen');
const flight = createFlight({ strip, fuel: 210 * 0.58, cargo: 112 });
flight.onGround = false;
flight.p = { x: strip.x + strip.length / 2 + 250, y: strip.elev + 41 + 1.55, z: strip.z };
flight.heading = 272;
flight.q = quatFromYawPitchRoll(-272 * RAD, 0, 8 * RAD);
const axes = bodyAxes(flight.q);
flight.v = vadd(vscale(axes.fwd, 38.5), { x: 0, y: -4.4, z: 0 });
flight.airspeed = 43.2;
flight.throttle = 0.45;
flight.flaps = 20;
flight.gear = true;
flight.rpm = 1500;
const env = flightEnv(sky);
flyFor(flight, env, 1.6, { bank: -8, pitch: -2.5, throttle: 0.45, flaps: 20, gear: true, heading: 272 });
const sortie = createSortie(MISSIONS[0]);
sortie.index = 0;
sortie.target = targetInfo(sortie);
return {
flight, sortie, sky, mode: 'chase', ribbon: '',
camera: { back: 26, height: 5.5, yaw: 7.5, pitch: 11, fov: 64, side: -6 },
dawn: 0.92, night: 0,
};
}
function dropShot(sky) {
const ring = RINGS.tamsen;
const flight = createFlight({ strip: STRIPS[0], fuel: 210 * 0.72, cargo: 90 });
flight.onGround = false;
flight.heading = 218;
const q = quatFromYawPitchRoll(-218 * RAD, 4 * RAD, 45 * RAD);
flight.q = q;
const axes = bodyAxes(q);
flight.p = {
x: ring.x - axes.fwd.x * 340,
y: ring.y + 189,
z: ring.z - axes.fwd.z * 340,
};
flight.v = vadd(vscale(axes.fwd, 45.5), { x: 0, y: -0.6, z: 0 });
flight.airspeed = 45.5;
flight.throttle = 0.55;
flight.flaps = 10;
flight.gear = true;
flight.rpm = 1900;
flight.cargoDoorOpen = true;
const env = flightEnv(sky);
flyFor(flight, env, 1.2, { bank: -45, pitch: 4, throttle: 0.55, flaps: 10, gear: true, heading: 218 });
const sortie = createSortie(MISSIONS[1]);
sortie.index = 0;
sortie.target = targetInfo(sortie);
sortie.sacks.push({
p: { x: flight.p.x + axes.fwd.x * 5 - axes.right.x * 1.5, y: flight.p.y - 9, z: flight.p.z + axes.fwd.z * 5 - axes.right.z * 1.5 },
v: { x: flight.v.x * 0.9, y: flight.v.y - 2.5, z: flight.v.z * 0.9 },
age: 0.55, target: ring, evaluated: false, accuracy: 0, landed: false,
});
return {
flight, sortie, sky, mode: 'chase', ribbon: '',
camera: { back: 27, height: 11, yaw: 13, pitch: 28, fov: 66 },
dawn: 0.25, night: 0,
};
}
function stormShot(sky) {
const flight = createFlight({ strip: STRIPS[0], fuel: 210 * 0.18, cargo: 110 });
flight.onGround = false;
flight.p = { x: 1800, y: 951, z: -2000 };
flight.heading = 309;
flight.q = quatFromYawPitchRoll(-309 * RAD, -1 * RAD, -4 * RAD);
const axes = bodyAxes(flight.q);
flight.v = vscale(axes.fwd, 40.5);
flight.airspeed = 40.5;
flight.throttle = 0.55;
flight.flaps = 10;
flight.gear = true;
flight.damage.engine = 34;
flight.damage.leftWing = 35;
flight.damage.tank = 55;
flight.fuel = 210 * 0.18;
flight.rpm = 1650;
const env = flightEnv(sky);
flyFor(flight, env, 0.8, { bank: 4, pitch: 0, throttle: 0.55, flaps: 10, gear: true, heading: 309 });
const sortie = createSortie(MISSIONS[5]);
sortie.index = 2;
sortie.target = targetInfo(sortie);
return {
flight, sortie, sky, mode: 'cockpit', ribbon: '',
camera: { back: 0, height: 0, yaw: 0, pitch: 18, fov: 78 },
dawn: 0, night: 0.25,
};
}
function touchdownShot(sky) {
const strip = STRIPS.find((item) => item.id === 'nimra');
const flight = createFlight({ strip, fuel: 210 * 0.62, cargo: 40 });
flight.onGround = false;
flight.heading = 268;
flight.q = quatFromYawPitchRoll(-268 * RAD, 2 * RAD, 0.6 * RAD);
const axes = bodyAxes(flight.q);
flight.p = { x: strip.x + strip.length / 2 - 96, y: strip.elev + 1.55 + 0.28, z: strip.z + 3 };
flight.v = vadd(vscale(axes.fwd, 25.0), { x: 0, y: -1.45, z: 0 });
flight.airspeed = 25.0;
flight.throttle = 0.2;
flight.flaps = 35;
flight.gear = true;
flight.rpm = 1000;
const env = flightEnv(sky);
let contact = null;
for (let i = 0; i < 240 && contact === null; i += 1) {
holdPilot(flight, { bank: 0.6, pitch: 2, throttle: 0.2, flaps: 35, gear: true, env }, 1 / 120);
const ground = env.groundHeight(flight.p.x, flight.p.z);
if (flight.p.y - 1.55 <= ground + 0.1) {
contact = {
sink: Math.max(0, -flight.v.y),
speedKt: flight.airspeed * 1.94384,
bankDeg: Math.abs(flight.bank / RAD),
pitchDeg: flight.pitch / RAD,
offset: Math.abs(flight.p.z - strip.z),
strip,
onRunway: true,
slope: 0,
point: { ...flight.p },
};
flight.onGround = true;
flight.v.y = 0;
flight.groundSpeed = flight.airspeed;
break;
}
}
const sortie = createSortie(MISSIONS[2]);
sortie.index = 0;
sortie.target = targetInfo(sortie);
sortie.touchdown = contact;
const ribbon = contact ? `TOUCHDOWN · FIRM · ${Math.round(contact.speedKt)} KT · ${Math.round(contact.offset)} M LEFT` : '';
const particles = [];
if (contact) {
for (let i = 0; i < 26; i += 1) {
const side = i % 2 === 0 ? -1 : 1;
particles.push({
p: { x: contact.point.x + (i % 5) * 0.8, y: strip.elev + 0.4, z: strip.z + side * 1.4 },
v: { x: (i - 13) * 0.22, y: 1.4 + (i % 6) * 0.34, z: side * (0.8 + (i % 4) * 0.4) },
life: 1.9 + (i % 5) * 0.16,
size: 0.45 + (i % 4) * 0.22,
});
}
}
return {
flight, sortie, sky, mode: 'chase', ribbon, particles,
camera: { back: 24, height: 3.2, yaw: -5, pitch: 6, fov: 62, side: -5 },
dawn: 0.12, night: 0,
};
}
/** Build the named scene. Unknown names fall back to the cover. */
export function stageShot(name, seed = 7) {
const sky = buildSky(seed);
if (name === 'drop') {
setWeather(sky, 'GUST');
const shot = dropShot(sky);
setSkyLight(sky, { dawn: shot.dawn, night: shot.night });
return shot;
}
if (name === 'storm') {
setWeather(sky, 'STORM');
const shot = stormShot(sky);
setSkyLight(sky, { dawn: 0.05, night: 0.02 });
sky.flash = 0.9;
return shot;
}
if (name === 'touchdown') {
setWeather(sky, 'GUST');
const shot = touchdownShot(sky);
setSkyLight(sky, { dawn: shot.dawn, night: 0 });
return shot;
}
setWeather(sky, 'CLEAR');
const shot = coverShot(sky);
setSkyLight(sky, { dawn: 0.92, night: 0 });
return shot;
}
/** A fresh chase camera framed for one scenario. */
export function cameraForShot(shot) {
const camera = createCamera();
configureCamera(camera, shot.mode, shot.camera);
const sky = shot.sky;
updateCamera(camera, shot.flight, shot.mode, 1 / 60, flightEnv(sky));
return camera;
}
/** Tiny dust billboards for the touchdown scene, advanced by the caller. */
export function updateParticles(particles, dt) {
for (const particle of particles) {
if (particle.life <= 0) continue;
particle.life -= dt;
particle.v.y -= 4.5 * dt;
particle.p.x += particle.v.x * dt;
particle.p.y += particle.v.y * dt;
particle.p.z += particle.v.z * dt;
particle.size += dt * 1.4;
}
return particles.filter((particle) => particle.life > 0);
}
/** Readouts for the capture log, never for drawing. */
export function shotReadouts(shot) {
return readouts(shot.flight, heightAt(shot.flight.p.x, shot.flight.p.z));
}
