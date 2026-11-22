# CRIMSON VAULT — The Meridian Job

[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Ahmadmukafi/best-heist-game-20261122-0559-r1/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Ahmadmukafi/best-heist-game-20261122-0559-r1/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down night heist inside the Meridian Bank vault — a make.fun bounty entry.
One thief, Ren "Sable" Voss, against two patrolling guards, two sweeping
cameras and a laser grid over the Meridian Diamond. Grab all three prizes and
reach the getaway door.

## The job

- **Three prizes:** Gold Bars in the vault, the Meridian Diamond behind the
  laser grid, the Black Ledger in the records office.
- **Signature gadget — the PULSE:** Space freezes every laser and camera for
  3 seconds, but the burst feeds the alarm (+12). Three charges a run.
- **Loot has weight:** every prize in the bag slows Sable down, so the
  getaway gets tighter the richer she is.
- **The alarm meter:** guards and cameras that see her raise it; lasers trip
  it by 25. At 100% the vault locks down and a life is lost.
- **Sneak (Shift):** half speed, half the detection range — read the cones
  before you move.

## Controls

WASD / arrows move · Shift sneak · Space pulse · E grab loot · mouse click
pings a planning marker. Grab all three prizes, then reach GETAWAY.

## Play it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Static files only — `game/index.html` opens in desktop Chrome and plays
offline, no network. Sound is synthesised with WebAudio; nothing is
downloaded.

## Layout

- `game/src/config.js` — constants, palette, level layout
- `game/src/level.js` — level state, walls, lasers, alarm
- `game/src/vision.js` — vision cones and line of sight
- `game/src/guard.js` — guard patrol, suspicion, chase, search
- `game/src/camera.js` — sweeping cameras and lock-on
- `game/src/player.js` — the thief, loot weight, the pulse gadget
- `game/src/audio.js` — synthesised sound
- `game/src/render.js` — canvas drawing and HUD
- `game/src/shots.js` — staged screenshot scenes (real simulation)
- `game/src/main.js` — game loop and world
- `main.ts` — hands the game in (copies game/ + screenshots/, writes dossier.json)
