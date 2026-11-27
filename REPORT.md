# Monsoon Post — v5 report

Round 3: 109 / 17,578 at 0.712530; top 50 pays and the five above sit at 0.7127–0.7135. v5 starts from `dbba013`; gameplay, flight model and sorties are unchanged.

## 1. The cover — `1-cover-sunbreak-ring.jpg`

0.21 km from the wreck ring, 424 ft AGL, banked 30°, camera 19 m back and 4.2 m up: the aircraft fills the lower left with its nose into the ridge and the ring on the right third. A squall with the sun broken low behind the ridge gives a warm peach / cool slate split, a warm fog tint and a lit valley while rain still falls. The ring is ~150 px across at 768, the wreck fire is the only hot point, the panel runs lit across the bottom, and a new plate under the IAS reads `SCORE 250` / `+250 BEACON` / `ORBIT HELD`. At 768 the aircraft, ring, ridge, fire, score and panel all read; nothing depends on 1-px detail.

## 2. The four shots

1. `1-cover-sunbreak-ring.jpg` — the flare run, above: aircraft, ring and score in one frame.
2. `2-drop-score.jpg` — the crate (still-only 3× hero scale) sits in the 40 m Tamsen ring inside a white impact burst and dust ring; `+250 MAIL · ON THE RING` is the top banner and `SCORE 250` is on the plate.
3. `3-squall-cockpit.jpg` — the lightning squall cockpit, gate 2 at 0.69 km, beads and rivulets on the glass (unchanged).
4. `4-short-final-wet.jpg` — Nimra short final, 15 ft AGL at 58 kt, gear down, rain, wheel spray, runway line and threshold bars, LOC/GS and a four-lamp PAPI strip, `SHORT FINAL · NIMRA KOT · GEAR DOWN`.

## 3. HUD payoff line

`missions.js` keeps a display-only `score` (2.5 × objective points), `awardText` / `awardNote` and a 2.6 s `awardTimer`; a new `awardFor` fires when an objective completes. `hud.js` draws a 306×56 plate under the IAS (`SCORE`, last award) and a top banner for a live award. `scoreSortie` and the postcard are untouched, so grades and balance do not move.

## 4. Budget and checks

`game/` 20 files / 162,194 B. `src/`: hud 25,642 · main 18,728 · render 16,766 · missions 12,837 · instruments 12,381 · flight-model 9,388 · aircraft 8,862 · util 8,050 · terrain 7,810 · attract 7,281 · world 6,408 · audio 5,509 · radar 4,588 · input 3,920 · hunt 3,572 · landing 3,509 · camera 2,936 · sky 2,455; `index.html` 817 · `styles.css` 735. Screenshots 4 files / 571,974 B (largest 151,022 B). Dossier text 163,487 B of 163,840, complete with no cut; room came from removing the one-line module headers and v4's unused crash-shot branch. `MAKEFUN_OUTPUT_DIR=out node main.ts` twice → 25 files, identical SHA-256. `tools/shoot.mjs` twice → the four JPEGs identical and equal to `screenshots/`. UI smoke captured title/board/brief/help/pause/debrief/crash with no boot error; the award path was exercised in Node (96% drop → `+240 MAIL · ON THE RING`, score 240, next target MARU). The 3D runway PAPI and the HUD PAPI strip are visual only.

## 5. Skipped

No weapons or enemies, no new asset, no flight-model or balance change. The final is 70 m past the Nimra threshold, so the threshold's 3D PAPI is behind the camera; the HUD PAPI strip carries the approach aid. No full live sortie was flown end-to-end: boot/UI smoke and the Node award path only.
