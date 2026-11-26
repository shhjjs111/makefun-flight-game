// Every sound in the game, synthesised in WebAudio at runtime: a three-oscillator engine whose
// firing rate follows RPM, wind that rises with airspeed, the stall horn, gear motor and clunk, tyre
// chirp, rain and hail hiss, distance-delayed thunder, radio clicks and the debrief bell.
import { clamp } from './util.js';
function noiseBuffer(ctx, seconds = 2) {
const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
const data = buffer.getChannelData(0);
let last = 0;
for (let i = 0; i < data.length; i += 1) {
const white = Math.random() * 2 - 1;
last = last * 0.72 + white * 0.28;
data[i] = last;
}
return buffer;
}
export class CockpitAudio {
constructor() {
this.ctx = null;
this.ready = false;
this.muted = false;
this.master = null;
this.engine = null;
this.wind = null;
this.rain = null;
this.horn = null;
this.rpmValue = 0;
this.hornOn = false;
}
/** Called from the first click or key: browsers refuse audio before a gesture. */
unlock() {
if (this.ctx) {
if (this.ctx.state === 'suspended') this.ctx.resume();
return;
}
const AC = window.AudioContext ?? window.webkitAudioContext;
if (!AC) return;
try {
this.ctx = new AC();
} catch {
return;
}
const ctx = this.ctx;
this.master = ctx.createGain();
this.master.gain.value = 0.55;
this.master.connect(ctx.destination);
this.noise = noiseBuffer(ctx);
const engineGain = ctx.createGain();
engineGain.gain.value = 0;
const filter = ctx.createBiquadFilter();
filter.type = 'lowpass';
filter.frequency.value = 420;
filter.Q.value = 1.4;
engineGain.connect(filter);
filter.connect(this.master);
const oscs = [];
for (const [type, ratio] of [['sawtooth', 1], ['square', 1.5], ['sine', 0.5]]) {
const osc = ctx.createOscillator();
osc.type = type;
osc.frequency.value = 52 * ratio;
const gain = ctx.createGain();
gain.gain.value = ratio === 2 ? 0.12 : 0.2;
osc.connect(gain);
gain.connect(engineGain);
osc.start();
oscs.push({ osc, ratio });
}
this.engine = { gain: engineGain, filter, oscs };
const windSource = ctx.createBufferSource();
windSource.buffer = this.noise;
windSource.loop = true;
const windFilter = ctx.createBiquadFilter();
windFilter.type = 'bandpass';
windFilter.frequency.value = 700;
windFilter.Q.value = 0.6;
const windGain = ctx.createGain();
windGain.gain.value = 0;
windSource.connect(windFilter);
windFilter.connect(windGain);
windGain.connect(this.master);
windSource.start();
this.wind = { gain: windGain, filter: windFilter };
const rainSource = ctx.createBufferSource();
rainSource.buffer = this.noise;
rainSource.loop = true;
const rainFilter = ctx.createBiquadFilter();
rainFilter.type = 'highpass';
rainFilter.frequency.value = 2200;
const rainGain = ctx.createGain();
rainGain.gain.value = 0;
rainSource.connect(rainFilter);
rainFilter.connect(rainGain);
rainGain.connect(this.master);
rainSource.start();
this.rain = { gain: rainGain };
const hornOsc = ctx.createOscillator();
hornOsc.type = 'square';
hornOsc.frequency.value = 640;
const hornGain = ctx.createGain();
hornGain.gain.value = 0;
hornOsc.connect(hornGain);
hornGain.connect(this.master);
hornOsc.start();
this.horn = { osc: hornOsc, gain: hornGain };
this.ready = true;
}
setMuted(muted) {
this.muted = muted;
if (this.master) this.master.gain.value = muted ? 0 : 0.55;
}
update(flight, sky, _dt) {
if (!this.ready) return;
const ctx = this.ctx;
const now = ctx.currentTime;
const rpm = flight.rpm ?? 0;
const speed = flight.airspeed ?? 0;
const engineOn = flight.engineRunning && flight.fuel > 0;
const engineLevel = engineOn ? 0.08 + clamp(rpm / 2600, 0, 1) * 0.2 : 0;
this.engine.gain.gain.setTargetAtTime(engineLevel, now, 0.15);
for (const { osc, ratio } of this.engine.oscs) {
osc.frequency.setTargetAtTime((30 + rpm * 0.035) * ratio, now, 0.12);
}
this.engine.filter.frequency.setTargetAtTime(280 + rpm * 0.32, now, 0.2);
this.wind.gain.gain.setTargetAtTime(clamp((speed - 8) / 60, 0, 1) * 0.12, now, 0.2);
this.wind.filter.frequency.setTargetAtTime(480 + speed * 22, now, 0.2);
this.rain.gain.gain.setTargetAtTime(sky.rain * 0.11, now, 0.4);
const hornOn = flight.stalled === true;
if (hornOn !== this.hornOn) {
this.hornOn = hornOn;
this.horn.gain.gain.setTargetAtTime(hornOn ? 0.05 : 0, now, 0.03);
}
if (hornOn) {
const pulse = Math.sin(now * 12) > 0 ? 0.05 : 0.0;
this.horn.gain.gain.setTargetAtTime(pulse, now, 0.02);
}
}
blip(frequency, duration, type = 'square', volume = 0.06) {
if (!this.ready) return;
const ctx = this.ctx;
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = type;
osc.frequency.value = frequency;
gain.gain.setValueAtTime(volume, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
osc.connect(gain);
gain.connect(this.master);
osc.start();
osc.stop(ctx.currentTime + duration);
}
noiseBurst(duration, frequency, volume = 0.1, type = 'bandpass') {
if (!this.ready) return;
const ctx = this.ctx;
const source = ctx.createBufferSource();
source.buffer = this.noise;
const filter = ctx.createBiquadFilter();
filter.type = type;
filter.frequency.value = frequency;
const gain = ctx.createGain();
gain.gain.setValueAtTime(volume, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
source.connect(filter);
filter.connect(gain);
gain.connect(this.master);
source.start();
source.stop(ctx.currentTime + duration);
}
gearMotor() {
this.blip(90, 0.5, 'sawtooth', 0.035);
}
gearClunk() {
this.noiseBurst(0.16, 180, 0.16, 'lowpass');
}
touchdownThump(sink = 1.2) {
if (!this.ready) return;
const ctx = this.ctx;
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(95, ctx.currentTime);
osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.22);
gain.gain.setValueAtTime(clamp(0.12 + sink * 0.05, 0.1, 0.4), ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.34);
osc.connect(gain);
gain.connect(this.master);
osc.start();
osc.stop(ctx.currentTime + 0.35);
this.noiseBurst(0.12, 900, 0.09);
}
tyreChirp() {
this.noiseBurst(0.3, 2400, 0.07);
}
drop() {
this.blip(320, 0.08, 'square', 0.04);
this.noiseBurst(0.2, 300, 0.08, 'lowpass');
}
radio() {
this.blip(1200, 0.03, 'square', 0.025);
}
thunder(distance = 0.5) {
this.noiseBurst(1.4 + distance, 120, 0.12, 'lowpass');
}
result(grade) {
if (!this.ready) return;
const notes = grade === 'GOLD' ? [523, 659, 784] : grade === 'SILVER' ? [523, 659] : [392];
notes.forEach((frequency, index) => {
const ctx = this.ctx;
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'sine';
osc.frequency.value = frequency;
const at = ctx.currentTime + index * 0.18;
gain.gain.setValueAtTime(0, at);
gain.gain.linearRampToValueAtTime(0.08, at + 0.02);
gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
osc.connect(gain);
gain.connect(this.master);
osc.start(at);
osc.stop(at + 1.5);
});
}
}
export function engineLoop(audio, flight, sky, dt) {
audio.update(flight, sky, dt);
}
export function stallHorn(audio, on) {
if (audio && audio.horn && audio.ready) {
audio.horn.gain.gain.setTargetAtTime(on ? 0.05 : 0, audio.ctx.currentTime, 0.03);
}
}
export function touchdownThump(audio, sink) {
if (audio) audio.touchdownThump(sink);
}
