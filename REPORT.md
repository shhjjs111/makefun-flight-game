# Monsoon Post — polish pass v2 report

## What changed, by item
1. **Rendered damage** — the cowling now trails smoke whose emission and density rise with `damage.engine` (dark puffs, fire puffs when crashed); a damaged wing gets a jagged dark tear, a stitched canvas patch and two fluttering fabric strips (both wings independently); a crash shows a bent prop, a detached gear/wheel/debris and a lopsided collapsed stance. Same damage values as the HUD schematic.
2. **Crash / touchdown** — a crash starts a 1.05 s hitstop (simulation frozen), world desaturation, camera shake, fire/dust puffs and a full-screen `CRASH · AIRCRAFT LOST` card with the cause; the postcard follows after the hitstop. Touchdown keeps the dust, thump, chirp and grade ribbon.
3. **Ambient life** — four bird flocks circle the valley, 34 prayer flags and valley grass tufts sway with the live wind; all are rebuilt cheaply into the existing dynamic particle buffer (no assets).
4. **Render interpolation** — the 1/120 s simulation is untouched; a previous-state snapshot and quaternion nlerp give the renderer interpolated position/orientation at `accumulator/STEP`. `?shot` now advances a fixed 1/60 s visual step, so scenes and JPEGs are repeatable.
5. **Runway slope** — Tamsen 27 now has its 3% uphill grade (18.6 m over 620 m): terrain pad, runway mesh, spawn, target and approach read `stripSurfaceY`, while Suli/Nimra/Dzong stay level; a Tamsen contact still grades normally.
6. **Campaign route board** — the title screen draws six route nodes with their postmarks (`OPEN` / `GOLD` …), campaign points out of 726, postmarks earned and the next sortie; results store best points per sortie.
7. **Cover** — `1-cover-final-approach.jpg` is a closer, lower final-to-Tamsen 27 at dawn: aircraft, runway/target brackets, tea terraces, village, valley and the lit brass panel all read at 768×480. The other three shots were re-captured after the visual changes.

## Final tree (game/, 18 files, 159,738 bytes)
`index.html` 817 · `styles.css` 735 · `src/main.js` 18,854 · `src/hud.js` 23,088 · `src/render.js` 17,418 · `src/instruments.js` 14,626 · `src/util.js` 10,431 · `src/missions.js` 9,778 · `src/flight-model.js` 9,537 · `src/aircraft.js` 8,979 · `src/attract.js` 7,850 · `src/terrain.js` 7,781 · `src/audio.js` 7,218 · `src/world.js` 6,328 · `src/input.js` 4,865 · `src/landing.js` 4,610 · `src/sky.js` 3,500 · `src/camera.js` 3,323

## Hand-in checks
- `MAKEFUN_OUTPUT_DIR=out node main.ts` twice → `diff -r out out2` clean, byte-identical (dossier included).
- Dossier: 744,040 bytes; source text 160,942 bytes, complete (under 163,840); 18 source files, 0 vendored, 0 assets.
- Screenshots: 4 files, all 1280×800 JPEG — cover 102,340 B; tea drop 117,383 B; storm 114,072 B; touchdown 100,259 B (all ≤512 KiB; first name is the cover).
- `main.ts` and `vendor/makefun-game.ts` unchanged; no network, no build step, static ES modules.

## Screenshots
All four changed: the cover was recomposed; the tea drop now shows the damaged left/right wings and engine smoke; the storm cockpit shows the engine-smoke haze plus the existing oil/fuel warnings; the touchdown shot uses the new soft dust and ribbon. A fifth `?shot=crash` scene (hitstop, bent prop, fire, CRASH card) exists for verification but was not submitted because the dossier cap is four images.

## Skipped
No separate crash still in the submitted four (cap/priority: keep the approach, drop, storm and touchdown shots); night bench shot still omitted; no external assets, audio files or build tooling added. The remaining linter hints are minifier style artefacts, not runtime errors.
