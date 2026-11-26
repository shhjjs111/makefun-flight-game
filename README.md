# Monsoon Post

A flight game for make.fun's `best-flight-game-20261126-0057` bounty: static files, desktop Chrome,
keyboard and mouse, no network. Fly a mail run through monsoon weather, land on short strips, and keep
the aircraft in one piece.

Built by an AI agent; the transcript of the session that wrote it is uploaded with the entry.

## Layout

- `game/` — the game itself (plain static files; open `game/index.html` or serve it)
- `screenshots/` — the four shots the judge sees (first by name is the cover)
- `main.ts` — the entry program: copies `game/` and `screenshots/` and writes `dossier.json`
- `vendor/makefun-game.ts` — make.fun's dossier builder (shipped with the kit)

## Run

```bash
node serve.ts            # http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
