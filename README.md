# TURKEY RUN: the great Thanksgiving escape — 5 zones, 3 chase bosses, 12 upgrades, 40+ obstacles, endless corn

You have been invited to Thanksgiving dinner. As dinner. Play a scarf-wearing turkey with an urgent change of plans: leap fences, duck laundry, outwit three persistent pursuers, and follow the corn through five illustrated places into Chef Marcel’s kitchen. A clean run opens the chase gap; stumbles bring dinner dangerously close. Spend your haul on a permanent escape kit, clear the Kitchen for an ESCAPED result, then choose another, faster lap. Every picture is drawn on a 2D canvas and every sound comes from a small WebAudio synthesizer. The playable game needs no network, assets, fonts, libraries, installation, or build step.

[![make.fun competition](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![make.fun rank](https://make.fun/badge/turkey-run-game-01/didinska21/turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![make.fun reward](https://make.fun/badge/turkey-run-game-01/didinska21/turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

## Play

Run `node serve.ts --port 8080` with Node 22 or newer, then open `http://localhost:8080/`. The server is a development convenience; a static host can serve the contents of `game/` directly. The logical canvas is 1280 × 720 and scales to the window. Click LET’S GOBBLE or press Space to begin. Touch buttons appear on devices with a coarse pointer.

Three damaging hits or an exhausted chase gap ends the run. Mud and puddles slow you and reduce the gap without taking a heart. A feather blocks a hit; a gravy boat grants a 3.5-second invincible speed boost. Each 400-metre zone clear awards a score bonus, and the 2,000-metre Kitchen clear opens the ESCAPED screen. Continue restores one heart and starts a harder lap with more speed and quicker boss attacks. R starts a fresh run.

Corn is added to your bank at CAUGHT and ESCAPED, including when you continue through several laps. Buy upgrades from the title or result screen; pause lets you inspect your kit. Purchases apply to the next fresh run. Bank, upgrades, best distance, high score, escape count, and mute preference persist in localStorage when the browser allows it, with an in-memory fallback for the current session.

## Controls

| Input | Action |
| --- | --- |
| Space / Up / W | Jump; press again in the air with Double Jump |
| Down / S (hold) | Slide; in the air, dive toward the ground |
| Left / Right, or A / D | Steer a little within the running lane |
| Canvas click | Jump while running; start or restart on title/results |
| Esc / P | Pause, resume, or close the kit view |
| M | Toggle synthesized sound |
| R | Restart from the Farmyard |
| Mouse | Click every menu, shop card, pause, and sound button |
| Touch | Left/right, jump, slide, and pause buttons |

## Five zones

1. **Farmyard — dawn:** barns, a windmill, hay, fences, and a farmer with unusually long arms.
2. **Cornfield — sunset:** golden stalks, a suspicious scarecrow, and Brutus taking over the chase while Jed is still in view.
3. **Forest — dusk:** layered pines and oaks, mossy hurdles, bogs, lamps, and a storm front.
4. **Town — night:** lit windows, street lamps, market awnings, the mayor’s laundry, and more rain, lightning, and gusts.
5. **Kitchen — firelight:** glowing oven doors, copper pans, flour, gravy, and airborne cutlery.

Each zone lasts 400 metres. Palettes change with the route; Forest and Town storms add wind drift and speed drag. The route repeats at a higher difficulty when you choose the next lap.

## Three chase bosses

- **Farmer Jed:** winds up a reaching grab. Slide under the hand. He chases in the Farmyard and returns with the Town patrol.
- **Brutus the Dog:** crouches, then lunges from behind. Jump his charge. He follows through the Cornfield and Forest.
- **Chef Marcel:** telegraphs a carving-knife throw from the front. Slide below the blade and keep out of the ovens.

The chase-pressure bar rises when the gap shrinks. Clean running rebuilds the gap. Two stumbles within 4.8 seconds trigger four seconds of cornering: the boss closes in and prepares attacks faster. Bosses defer attacks that would force incompatible jump and slide responses to nearby course obstacles.

## Twelve upgrades

| Upgrade | Corn | Gameplay effect |
| --- | ---: | --- |
| Double Jump | 30 | A second jump before landing |
| Feather Shield | 25 | Begin each run with one shield charge |
| Gravy Slide | 40 | Starting a slide grants a 1.1-second invincible boost; 8-second recharge |
| Corn Magnet | 35 | Attract corn within 175 pixels |
| Sprint Boots | 45 | 12% faster running |
| Sturdy Beak | 30 | Break one fence or hedge per run without a hit |
| Night Vision | 25 | Brighten Forest and Town scenery |
| Storm Cloak | 35 | Ignore storm speed drag and wind drift |
| Lucky Feather | 65 | One rescue heart and restored chase gap when otherwise caught |
| Big Gobble | 60 | Double all score earnings; corn currency stays one per ear |
| Soft Landing | 30 | Remove the gap penalty from hard landings |
| Dog Whistle | 40 | 65% longer intervals between Brutus’s lunges |

## 45 obstacle variants

`OBSTACLES` in `game/src/config.js` contains **45 named entries**, nine per zone, with individual dimensions, collision insets, material/detail drawings, and motion. The course visits all nine entries in each zone. Movement includes rolling, drifting, wobbling, swaying, swinging, pulsing, snapping, falling, and slowing surfaces. Boss projectiles are additional hazards.

- **Farmyard:** Split-rail fence; Round hay bale; Cider rolling pumpkin; Boot-stealing mud; Flapping scarecrow; Runaway milk cart; Chicken-feed crate; Long-john clothesline; Apple cider barrel.
- **Cornfield:** Corn-stalk hurdle; Double-twine bale; Tiger-stripe pumpkin; Irrigation puddle; King of the crows; Overloaded corn wagon; Toppling seed sacks; Low bird net; Surprise rake.
- **Forest:** Mossy forest fence; Fallen oak log; Ghost rolling pumpkin; Bubbling bog; Swinging dead branch; Too-large mushrooms; Suspicious fox crate; Thorny hedge; Woodland snare.
- **Town:** White garden gate; Overdue mail pile; Festival runaway pumpkin; Lamp-lit street puddle; Market-stall awning; Midnight bread cart; Fishmonger box; The mayor’s laundry; Rattling trash can.
- **Kitchen:** Glowing oven door; Bursting flour sacks; Soup-bound rolling pumpkin; Catastrophic gravy spill; Swinging carving knife; Falling carving knife; Precarious plate stack; Low copper pot rack; Spring-loaded chopping board.

Collect **corn** for score and shop currency, **feathers** to refill a one-hit shield, and **gravy boats** for timed invincibility and speed. Score, metres, three hearts, corn, zone, chase pressure, route progress, and active ability timers remain on the running HUD.

## Deterministic shots

The root `shots.json` lists four capture URLs. Open them through the same static server:

| File | Query | Real simulation action |
| --- | --- | --- |
| `1-cover.jpg` | `?shot=cover&seed=7` | A fence leap in the sunset Cornfield, with Jed, Brutus, a rolling pumpkin, corn, and the HUD |
| `2-chef.jpg` | `?shot=chef&seed=7` | A Kitchen slide beneath Marcel’s thrown knife, with glowing ovens and a visible gravy boat |
| `3-title.jpg` | `?shot=title&seed=7` | The title screen: giant TURKEY RUN type, LET’S GOBBLE, the escape-kit shop, and the 5-zones / 3-bosses / 12-upgrades / 45-obstacles banner |
| `4-end.jpg` | `?shot=end&seed=7` | The first actual run result; seed 7 clears the Kitchen at 2,000 m and shows the ESCAPED screen |

`game/src/shots.js` supplies only ordinary jump and slide inputs to the real 60 Hz fixed-step game. Each scene starts at metre zero with the same fresh, unupgraded profile. It runs forward until an action predicate matches, draws through the normal renderer, and freezes. There are no entity inserts, teleports, alternate scene renderers, health grants, or distance skips. Decorative noise is independent of the seeded gameplay RNG. Saved upgrades cannot affect a shot.

After the selected frame is drawn, `document.documentElement.dataset.ready` is `"true"`, and `data-shot-ready` holds the shot name on the root and canvas. `window.turkeyrun.getState()` exposes the seed, tick, distance, zone, boss, counts, player, weather, obstacles, collectibles, stats, and result. The same seed and shot yield the same frozen state. A failed action predicate reports `data-shot-error` and does not claim readiness.

**Screenshots verified 27 November 2026.** All four captures in `screenshots/` are real
renders of these exact URLs in headless Chromium (1280 × 720, JPEG, no console or page
errors, viewed and approved by the builder): `1-cover.jpg` 141,340 bytes
(sha256 `03be876d…b3a8ee`), `2-chef.jpg` 156,564 bytes (`52a3f79c…bd63ef`),
`3-title.jpg` 125,186 bytes (`2d274477…297816a`), `4-end.jpg` 105,343 bytes
(`a462e4df…fb54c0d`). Same seed and shot yield the same frozen state: cover freezes at
tick 887 (449 m, Cornfield, Brutus chasing), chef at tick 3212 (1,749 m, Kitchen,
Marcel attacking), end at tick 3559 (2,000 m, ESCAPED). The Town storm scene
(`?shot=zones&seed=7`, tick 2392, lightning, rain, night) still runs in the game and is
documented here, but the title screen takes its screenshot slot: the judging reads the
title screen, a run in play, and an end screen as the complete set.

## Packaging

`main.ts` uses only the Node standard library and the supplied `vendor/makefun-game.ts`. It copies the sibling `game/` and, when present, `screenshots/` into `MAKEFUN_OUTPUT_DIR` (default `/output`), then writes `dossier.json` using `buildDossier` and these competition caps:

```json
{
  "text_max_bytes": 163840,
  "screenshots": { "max": 4, "max_bytes": 262144 },
  "game_max_files": 993,
  "game_max_bytes": 50331648,
  "game_path_max_bytes": 1000
}
```

For a local packaging check, use `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
Verified 27 November 2026: two runs write byte-identical output
(`dossier.json`, schema `makefun/dossier/v1`, 810,037 bytes; dossier text 102,806 bytes,
under the 163,840 cap; 4 images in order, cover first). The game itself runs
independently of the packager. No submission is performed by either entry point.

The license is MIT, including the literal SPDX identifier in `LICENSE`. The kit library, license, and development server are the supplied infrastructure; all game modules, canvas artwork, sound synthesis, and packaging entry code are original to this entry.
