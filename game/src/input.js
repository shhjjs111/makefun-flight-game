// Keyboard and mouse to aircraft controls: the mouse is an absolute virtual stick with a dead zone
// and expo curve, every action also has a key, and one-shot presses are queued as flags so nothing
// is lost between frames. The cursor is hidden while flying, so the stick and the horizon are the
// only pointers the pilot needs.
import { clamp } from './util.js';
export const ACTION_DROP = 1;
export const ACTION_FLAP = 2;
export const ACTION_GEAR = 4;
export const ACTION_MIXTURE = 8;
export const ACTION_CAMERA = 16;
export const ACTION_LIGHT = 32;
export const ACTION_MUTE = 64;
export const ACTION_PAUSE = 128;
export const ACTION_HELP = 256;
export const ACTION_CONFIRM = 512;
export const ACTION_BACK = 1024;
export const ACTION_RETRY = 2048;
export const ACTION_INVERT = 4096;
export const ACTION_SENS_DOWN = 8192;
export const ACTION_SENS_UP = 16384;
/** The keys, printed in the help card and the pause menu. */
export const CONTROLS = [
['Mouse / arrows', 'virtual stick: pitch and roll'],
['W / S', 'throttle up / down'],
['A / D', 'rudder, crosswind and ground steering'],
['F', 'flaps: up, 10°, 20°, 35°'],
['G', 'landing gear'],
['B', 'brakes on the ground'],
['Space', 'drop the mail sack'],
['M', 'lean the mixture'],
['C', 'chase / cockpit view'],
['L', 'panel flood'],
['K', 'mute'],
['P / H', 'pause / help'],
];
const DEAD_ZONE = 0.08;
const EXPO = 1.3;
function shape(value) {
const sign = value < 0 ? -1 : 1;
const magnitude = Math.abs(value);
if (magnitude < DEAD_ZONE) return 0;
return sign * ((magnitude - DEAD_ZONE) / (1 - DEAD_ZONE)) ** EXPO;
}
export function createInput(target) {
const keys = new Set();
const state = {
keyX: 0,
keyY: 0,
mouseX: 0,
mouseY: 0,
mouseActive: false,
throttle: 0,
throttleUp: false,
throttleDown: false,
brake: false,
actions: 0,
wheel: 0,
};
window.addEventListener('keydown', (event) => {
if (event.repeat) {
if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyB'].includes(event.code)) event.preventDefault();
return;
}
const oneShots = {
Space: ACTION_DROP,
KeyF: ACTION_FLAP,
KeyG: ACTION_GEAR,
KeyM: ACTION_MIXTURE,
KeyC: ACTION_CAMERA,
KeyL: ACTION_LIGHT,
KeyK: ACTION_MUTE,
KeyP: ACTION_PAUSE,
KeyH: ACTION_HELP,
Enter: ACTION_CONFIRM,
KeyB: ACTION_BACK,
KeyR: ACTION_RETRY,
KeyI: ACTION_INVERT,
BracketLeft: ACTION_SENS_DOWN,
BracketRight: ACTION_SENS_UP,
Escape: ACTION_BACK,
};
if (oneShots[event.code]) state.actions |= oneShots[event.code];
if (event.code === 'KeyW') state.throttleUp = true;
if (event.code === 'KeyS') state.throttleDown = true;
if (event.code === 'KeyB') state.brake = true;
if (event.code === 'KeyA') state.rudder = -1;
if (event.code === 'KeyD') state.rudder = 1;
keys.add(event.code);
state.keyX = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
state.keyY = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
if (event.code === 'Space' || event.code === 'Enter' || event.code.startsWith('Arrow')) event.preventDefault();
});
window.addEventListener('keyup', (event) => {
keys.delete(event.code);
if (event.code === 'KeyW') state.throttleUp = false;
if (event.code === 'KeyS') state.throttleDown = false;
if (event.code === 'KeyB') state.brake = false;
if (event.code === 'KeyA' || event.code === 'KeyD') state.rudder = 0;
state.keyX = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
state.keyY = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
});
target.addEventListener('pointermove', (event) => {
const rect = target.getBoundingClientRect();
state.mouseX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
state.mouseY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
state.mouseActive = true;
});
target.addEventListener('pointerdown', () => {
state.actions |= ACTION_CONFIRM;
});
target.addEventListener('wheel', (event) => {
state.wheel += event.deltaY > 0 ? -0.05 : 0.05;
event.preventDefault();
}, { passive: false });
window.addEventListener('blur', () => {
keys.clear();
state.throttleUp = false;
state.throttleDown = false;
state.brake = false;
state.keyX = 0;
state.keyY = 0;
});
state.rudder = 0;
return state;
}
/** The stick in -1..1: the mouse when it has moved, otherwise the arrow keys. */
export function readRudder(input) {
return input.rudder ?? 0;
}
export function readStick(input) {
const x = input.mouseActive ? shape(input.mouseX) : input.keyX;
const y = input.mouseActive ? shape(input.mouseY) : input.keyY;
return { x, y };
}
/** Throttle in 0..1, moved by held keys and the wheel; the caller keeps it between frames. */
export function readThrottle(input, throttle, dt) {
let next = throttle + input.wheel;
input.wheel = 0;
if (input.throttleUp) next += dt * 0.45;
if (input.throttleDown) next -= dt * 0.45;
return clamp(next, 0, 1);
}
export function takeActions(input) {
const taken = input.actions;
input.actions = 0;
return taken;
}
