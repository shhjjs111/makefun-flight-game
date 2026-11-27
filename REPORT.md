# Monsoon Post — v4 report

Round 3: 109 / 17,578 (0.712530). v3's worst frame was its cover — a grey wisp of smoke in a ring, nothing happening. v4 gives that ring an event and puts feedback on every other frame, without turning the mail run into a shooter.

## 1. The cover — `1-cover-wreck-fire.jpg`

Chase view 0.31 km short of the wreck, 176 ft above the ridge, banked 22°: five signal cells lit, `FUEL 10 MIN` on the red plate. The wreck is a new mesh on Tamsen's north shoulder (fuselage, propped wing, tail, cowl, bent strut) with a fire at its engine — flame puffs, a 9 m halo, a 110 m smoke column leaning with the 235/9 wind, and a warm bloom under the glass that lights the ring's floor. At 768 it reads because the ring is ~230 px of red on a dark ridge, the fire is the only saturated point in a desaturated frame, the column gives the eye a vertical, the aircraft is large in the lower left, and every number is one line of 22–54 px type on dark glass.

## 2. The four shots

Cover: the hunt's find beat. `2-tea-drop-bank.jpg` (sortie 02): 45° bank over the terraces, the sack falling into the ring, `OIL PRESS` lit. `3-squall-cockpit.jpg` (sortie 05): `GATE 2 · DZONG SPUR 0.69 KM`, forked lightning, beads and rivulets on the glass. `4-touchdown-wet.jpg` (sortie 03): spray off the wheels on the wet Nimra strip, `TOUCHDOWN · FIRM · 64 KT · 3 M LEFT`. The hunt's flare and escort beats are harness-verified but not a fifth shot: four sorties show four goals, and two frames of one wreck blur together at 250 px.

## 3. New feedback and depth

A flare inside the 55 m ring ignites (flame, column, light on the wreck, `FLARE LIT · LEAD THEM DOWN`, panel lamp `FLARE`); a wide flare is refused with `FLARE WIDE · DROP AGAIN` and the survivors hold — the sortie carries 60 kg, so the second throw is the last, and a wide *last* flare is followed at 0 points so there is no dead end. They walk only while the flare burns (90 s) and KP-04 is within 900 m: 7.2 m/s, 5.2 m/s once it dies, so where the flare lands now matters.

A wet strip throws spray, not dust (64 fine droplets, slower swell, a white mist under the wheels); a damaged engine smokes denser (36 puffs/s, larger, longer); cockpit glass gains beads with runs and two rivulets; lightning is forked and clear of the ring and plates; `main.js` draws the live and the shot frame through one `scenePass` instead of two copies.

## 4. Budget and checks

`game/` 20 files / 161,933 B. `src/`: hud 24,651 · main 18,887 · render 16,859 · instruments 12,381 · missions 12,350 · flight-model 9,485 · aircraft 8,986 · util 8,147 · terrain 7,781 · attract 7,314 · world 6,532 · audio 5,614 · radar 4,588 · input 4,015 · landing 3,608 · hunt 3,572 · camera 3,056 · sky 2,555; `index.html` 817 · `styles.css` 735. Dossier text 163,228 B of 163,840, complete (no cut line): room came from one-line module headers (−1.6 kB) and dead code (`SHOT_LIST`, `cameraView`, `contactStrip`, `setPhase`, two audio wrappers), plus a denser `audio.js`.

`MAKEFUN_OUTPUT_DIR=out node main.ts` twice → 25 files, identical SHA-256; `tools/shoot.mjs` twice → the four JPEGs byte-identical and equal to `screenshots/`. Harness, sortie 07: orbit → lock, wide flare refused, on-ring flare lit, escort starts, party walks 650 m in range / holds at 4 km / slows to 5.2 m/s after 90 s, FIRM landing through `groundContact` → GOLD 137.5. Live page: sortie 07 to a lit flare and a walking party, 0 console errors; `--ui` screens reviewed. `main.ts` and `vendor/makefun-game.ts` unchanged; static modules, no network, no build step.

## 5. Skipped

No weapons, enemies or new sortie; no new asset; audio unchanged in kind; the flare/escort has no shot of its own (§2).
