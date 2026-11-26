# Monsoon Post — hand-in report

Final tree (game/, 18 files, 159,339 bytes; no vendor, no assets):
- `index.html` 817 — two stacked canvases, one module script, data: favicon.
- `styles.css` 735 — letterboxed 1280×800 stage, hidden cursor.
- `src/main.js` 15,773 — boot, phase machine (title/board/brief/flight/pause/help/debrief), fixed 1/120 s loop, `?shot` capture.
- `src/flight-model.js` 9,537 — forces, 16° wing stall, thrust lapse, fuel burn/mixture, wind/ridge lift, six damage zones, `readouts()`.
- `src/terrain.js` 10,762 — 320² height grid, river and stream, terraces, four flattened airstrips, runway markings, `heightAt`.
- `src/aircraft.js` 7,580 — Koel KP-04 from boxes/cylinders/cones, hinged surfaces, prop blur, gear and damage tells.
- `src/camera.js` 5,636 — chase spring and cockpit eye, bank-damped horizon, shake, world-to-screen projection.
- `src/world.js` 7,980 — villages, tea gardens, stone walls, prayer flags, waterfall, broken bridge, Dzong tower, Nimra Needle.
- `src/sky.js` 3,500 — sky/weather state, cloud decks, storm, `windAt` with ridge lift and lee sink.
- `src/render.js` 14,927 — WebGL2 world/sky/cloud programs, buffers, one frame in ~10 draw calls.
- `src/hud.js` 20,020 — reflector-sight speed/altitude/heading tape, reticle, FPM, target ring, localiser, warnings, dust, paper screens.
- `src/instruments.js` 14,624 — brass/ivory panel, six main gauges, fuel kg/%/minutes, lamps, lagged needles, damage schematic.
- `src/missions.js` 9,728 — six sorties, land/drop/gate objectives, sacks, scoring, postmark grades.
- `src/landing.js` 4,610 — contact measurement, GREASED/FIRM/HEAVY/CRASH grade, rollout, crash cause.
- `src/input.js` 4,865 — absolute mouse stick, keys for every action, queued one-shot actions, wheel throttle.
- `src/audio.js` 7,218 — WebAudio engine loop, wind, stall horn, gear, thud, rain, thunder, radio, debrief bell.
- `src/attract.js` 10,868 — live title pass and the four deterministic shot scenes.
- `src/util.js` 10,159 — scalar/vector/quaternion/matrix maths, value noise, mesh builder.

Flight: lift/drag/thrust integrate velocity each 1/120 s; bank turns the lift vector, the wing stalls above 16° AoA, elevator softens and the camera buffets; wind subtracts from velocity so airspeed and ground track differ. Missions: six sorties in three kinds (land, ring drop, photo gate) with weather, fuel reserve, par time, objectives and Gold/Silver/Bronze scoring. Fuel: 210 kg burns 0.012+0.110·throttle kg/s, lean saves 15% and costs 10% power; the panel reads kg, %, and minutes left. Damage: engine, both wings, tail, gear, tank each degrade thrust, roll trim, pitch authority, drag/gear and fuel leak; a hard landing bends the gear and the debrief names the cause.

Screenshots (1280×800 JPEG, all real `?shot` captures, first is cover):
1. `1-cover-final-approach.jpg` — chase final to Tamsen 27 at dawn: aircraft, runway, tea fields, village, river, SPD 84 / ALT 2,264 / HDG 268 / AGL 110 / VSI −942, lit panel.
2. `2-tea-drop-bank.jpg` — 45° bank over Upper Tamsen, sack inside the vermilion ring, SPD 98 / ALT 2,787 / HDG 213, wind 240/6.
3. `3-storm-cockpit.jpg` — cockpit, storm, rain and lightning, SPD 87 / ALT 3,114 / HDG 301, fuel 18% · 9 MIN, oil pressure red.
4. `4-touchdown-firm.jpg` — Nimra Kot wheels-down with dust and ribbon `TOUCHDOWN · FIRM · 59 KT · 3 M LEFT`, ALT 1,905 / HDG 268.

Hand-in: `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice → byte-identical tree (fresh run re-checked against `out/`), `dossier.json` 745,533 bytes, source text 160,548 bytes and complete (no truncation); four screenshots ≤118 KiB each.

Not built / cut: route-board campaign total (per-sortie postmarks only); birds; rendered smoke/torn-fabric/bent-prop visuals (flags exist, no particles); crash hitstop/desaturation; 3% Tamsen runway slope (pad is flat); render interpolation (fixed-step state drawn directly); night bench shot (only the four specified files). No network, no external assets, no build step; `main.ts` and `vendor/makefun-game.ts` unchanged.
