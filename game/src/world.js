// What stands on the terrain: eight villages of whitewashed houses and tin roofs, tea shade trees,
// stone walls, prayer flags at the thresholds, the Nimra Needle, the Maru waterfall, the broken
// bridge and the Dzong tower. One merged mesh, one draw call, all built from the same palette.
import { createMeshBuilder, hex, makeRng } from './util.js';
import { SETTLEMENTS, STRIPS, heightAt } from './terrain.js';
export const VILLAGES = SETTLEMENTS.map((village) => ({ ...village, houses: 7 + (village.id.length % 5) }));
const WHITEWASH = hex('#E8DFC8');
const TIN = hex('#8C6B4F');
const RUST = hex('#A6533A');
const INK = hex('#22201B');
const STONE = hex('#7C7368');
const TEA = hex('#3C5233');
const TEA_LIT = hex('#5C7A45');
const VERMILION = hex('#C2452D');
const BRASS = hex('#C9A24A');
const WATER = hex('#A9C6C7');
function house(builder, x, z, yaw, size, rng) {
const ground = heightAt(x, z);
const width = 6 + rng() * 4;
const depth = 5 + rng() * 3;
const height = 3 + rng() * 1.8;
builder.box({ x, y: ground + height / 2, z }, { x: width, y: height, z: depth }, WHITEWASH, yaw);
const roof = rng() > 0.35 ? TIN : RUST;
builder.prism({ x, y: ground + height, z }, width + 1.2, 1.8 + rng(), depth + 1.2, roof);
builder.box({ x: x + 1.2, y: ground + height + 0.4, z: z - 1.2 }, { x: 0.5, y: 1.4, z: 0.5 }, INK, yaw);
builder.box({ x, y: ground + 1.0, z: z + depth / 2 + 0.02 }, { x: 1.0, y: 1.8, z: 0.08 }, INK, yaw);
builder.box({ x: x - width / 2 - 0.02, y: ground + height / 2 + 0.6, z }, { x: 0.08, y: 0.9, z: 1.2 }, INK, yaw);
builder.box({ x, y: ground + height - 0.1, z }, { x: width + 1.4, y: 0.15, z: depth + 1.4 }, STONE, yaw);
}
function tree(builder, x, z, scale, rng) {
const ground = heightAt(x, z);
const height = (7 + rng() * 5) * scale;
builder.cylinderBetween({ x, y: ground, z }, { x, y: ground + height * 0.42, z }, 0.24 * scale, INK, 5);
builder.coneBetween({ x, y: ground + height * 0.32, z }, { x, y: ground + height, z }, 2.6 * scale, rng() > 0.5 ? TEA : TEA_LIT, 7);
}
function wall(builder, x, z, length, yaw) {
const ground = heightAt(x, z);
builder.box({ x, y: ground + 0.55, z }, { x: length, y: 1.1, z: 0.8 }, STONE, yaw);
}
function prayerFlags(builder, x, z, yaw, count = 12) {
const ground = heightAt(x, z);
const span = 14;
const dirX = Math.cos(yaw);
const dirZ = Math.sin(yaw);
const poleA = { x: x - dirX * span / 2, y: ground, z: z - dirZ * span / 2 };
const poleB = { x: x + dirX * span / 2, y: ground, z: z + dirZ * span / 2 };
builder.cylinderBetween(poleA, { x: poleA.x, y: poleA.y + 6, z: poleA.z }, 0.09, INK, 5);
builder.cylinderBetween(poleB, { x: poleB.x, y: poleB.y + 6, z: poleB.z }, 0.09, INK, 5);
const colors = [VERMILION, BRASS, WHITEWASH, hex('#4E7C86'), hex('#6FA36A')];
for (let i = 0; i < count; i += 1) {
const t = (i + 0.5) / count;
const px = poleA.x + (poleB.x - poleA.x) * t;
const pz = poleA.z + (poleB.z - poleA.z) * t;
const py = poleA.y + 5.6 - Math.sin(t * Math.PI) * 0.7;
builder.box({ x: px, y: py, z: pz }, { x: 0.9, y: 0.7, z: 0.05 }, colors[i % colors.length], yaw);
}
}
function dzongTower(builder, x, z) {
const ground = heightAt(x, z);
builder.box({ x, y: ground + 7, z }, { x: 11, y: 14, z: 11 }, WHITEWASH);
builder.box({ x, y: ground + 14.2, z }, { x: 12, y: 1.2, z: 12 }, RUST);
builder.box({ x, y: ground + 15.4, z }, { x: 7, y: 2.2, z: 7 }, WHITEWASH);
for (let i = 0; i < 3; i += 1) {
builder.box({ x: x - 3.4, y: ground + 8 + i * 3.2, z: z + 5.55 }, { x: 1.1, y: 1.7, z: 0.1 }, INK);
builder.box({ x: x + 3.4, y: ground + 8 + i * 3.2, z: z + 5.55 }, { x: 1.1, y: 1.7, z: 0.1 }, INK);
}
builder.cylinderBetween({ x, y: ground + 16.5, z }, { x, y: ground + 22, z }, 0.12, INK, 5);
builder.box({ x: x + 2.6, y: ground + 21.5, z }, { x: 3.4, y: 1.6, z: 0.06 }, VERMILION);
}
function needle(builder, x, z) {
const ground = heightAt(x, z);
builder.coneBetween({ x, y: ground, z }, { x: x + 6, y: ground + 95, z: z - 3 }, 17, STONE, 7);
builder.coneBetween({ x: x + 4, y: ground + 20, z }, { x: x + 8, y: ground + 48, z: z - 4 }, 6, hex('#9A9084'), 6);
}
function waterfall(builder, x, z) {
const ground = heightAt(x, z);
builder.box({ x, y: ground + 30, z }, { x: 9, y: 60, z: 1.5 }, WATER);
builder.box({ x, y: ground + 2, z: z + 5 }, { x: 22, y: 2, z: 14 }, hex('#4E7C86'));
builder.box({ x: x - 4, y: ground + 28, z: z + 1.5 }, { x: 2, y: 50, z: 0.6 }, WHITEWASH);
builder.box({ x: x + 4, y: ground + 28, z: z + 1.5 }, { x: 2, y: 50, z: 0.6 }, WHITEWASH);
}
function bridge(builder, x, z, broken) {
const ground = heightAt(x, z);
const deckY = ground + 9;
builder.box({ x: x - 28, y: deckY, z }, { x: 30, y: 0.8, z: 5 }, STONE, 0.05);
if (!broken) builder.box({ x: x + 28, y: deckY, z }, { x: 30, y: 0.8, z: 5 }, STONE, -0.03);
else {
builder.box({ x: x + 24, y: deckY - 5, z }, { x: 24, y: 0.8, z: 5 }, STONE, 0.28);
builder.box({ x: x + 8, y: deckY - 12, z }, { x: 8, y: 0.7, z: 4 }, STONE, 0.62);
}
for (const side of [-1, 1]) {
builder.cylinderBetween({ x: x - 46, y: ground, z: z + side * 4 }, { x: x - 46, y: deckY + 13, z: z + side * 4 }, 0.4, RUST, 6);
builder.cylinderBetween({ x: x + 4, y: ground, z: z + side * 4 }, { x: x + 4, y: deckY + 13, z: z + side * 4 }, 0.4, RUST, 6);
builder.cylinderBetween({ x: x - 46, y: deckY + 12, z: z + side * 4 }, { x: x + 4, y: deckY + 12, z: z + side * 4 }, 0.09, INK, 4);
}
}
export function buildWorld() {
const builder = createMeshBuilder();
const rng = makeRng(31);
for (const village of VILLAGES) {
for (let i = 0; i < village.houses; i += 1) {
const angle = rng() * Math.PI * 2;
const radius = 26 + rng() * (village.radius * 0.7);
const x = village.x + Math.cos(angle) * radius;
const z = village.z + Math.sin(angle) * radius;
house(builder, x, z, rng() * Math.PI, { width: 6, depth: 5 }, rng);
}
for (let i = 0; i < 12; i += 1) {
const angle = rng() * Math.PI * 2;
const radius = 60 + rng() * village.radius * 1.4;
tree(builder, village.x + Math.cos(angle) * radius, village.z + Math.sin(angle) * radius, 0.8 + rng() * 0.6, rng);
}
wall(builder, village.x + village.radius * 0.4, village.z - village.radius * 0.2, 34, rng() * Math.PI);
wall(builder, village.x - village.radius * 0.3, village.z + village.radius * 0.35, 24, rng() * Math.PI);
}
const teaA = hex('#4E6B3B');
const teaB = hex('#6E8A4A');
const teaC = hex('#8FA35B');
for (let row = 0; row < 15; row += 1) {
const z = -1000 - row * 5.6;
const x0 = 690 + (row % 3) * 18;
const x1 = 1240 - (row % 4) * 14;
const y = heightAt((x0 + x1) / 2, z) + 0.08;
const color = row % 3 === 0 ? teaA : row % 3 === 1 ? teaB : teaC;
builder.quad4(
{ x: x0, y, z: z - 2.2 }, { x: x0, y, z: z + 2.2 },
{ x: x1, y, z: z + 2.2 }, { x: x1, y, z: z - 2.2 },
[color, color, color, color],
);
if (row % 2 === 0) {
for (let i = 0; i < 18; i += 1) {
const bx = x0 + 8 + i * 28;
builder.coneBetween({ x: bx, y, z }, { x: bx, y: y + 1.1, z }, 1.1, teaB, 6);
}
}
}
for (let i = 0; i < 8; i += 1) {
const x = 790 + i * 42;
const z = -905 - (i % 2) * 34;
house(builder, x, z, (i % 2) * 0.08, { width: 6, depth: 5 }, rng);
}
prayerFlags(builder, 1010, -950, Math.PI / 2, 10);
const track = hex('#A87B4F');
builder.box({ x: 780, y: 655.18, z: -1020 }, { x: 420, y: 0.12, z: 3.4 }, track, 0.22);
builder.box({ x: 1000, y: 655.18, z: -1082 }, { x: 180, y: 0.12, z: 3.0 }, track, 0.6);
prayerFlags(builder, 1210 - 20, -1100 - 30, 0, 14);
prayerFlags(builder, -1950 + 420 / 2 - 18, -50 + 26, 0, 10);
dzongTower(builder, 470, -2480);
needle(builder, -2320, -380);
waterfall(builder, 2360, 620);
bridge(builder, 2020, 520, true);
bridge(builder, -760, 780, false);
for (let i = 0; i < 10; i += 1) {
const x = -2200 + rng() * 4200;
const z = -2000 + rng() * 4000;
if (heightAt(x, z) < 900) house(builder, x, z, rng() * Math.PI, { width: 5, depth: 4 }, rng);
}
return { mesh: builder.build(), villages: VILLAGES, strips: STRIPS };
}
/** The world is static; the clock only moves birds and the windsock's mood, so this is cheap. */
export function updateWorld(world, dt, time) {
world.time = time;
return world;
}
