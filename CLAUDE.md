# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Night Watch is a browser text RPG set in an original low-fantasy north: a border fortress in snowy mountains. It began around 2019–2020 as a Game of Thrones fan game, and direct references to the show have since been removed (images, names, the Black Castle); keep new content free of them. All in-game text and code comments are in Russian; keep new player-facing text in Russian.

Stack: Vite, TypeScript (strict), Preact, Vitest, ESLint (typescript-eslint strict) and Prettier.

## Commands

```bash
npm run dev          # dev server at http://localhost:5173 (also defined in .claude/launch.json)
npm run build        # typecheck + production build into dist/
npm run check        # typecheck, lint, format check and tests: run before committing
npm test             # all tests once
npx vitest run tests/combat.test.ts   # one test file
npx vitest run -t "подлый удар"       # tests whose name matches
npm run format       # apply Prettier
```

In `npm run dev` a debug panel (`src/ui/debug/DebugPanel.tsx`, toggled by the 🛠 button or the ` key) offers a quick start, a jump to any scene (applied like entering it: its `location` and `set` take effect) or to free roaming, a jump to any location, time skips (+1 h / +6 h, events fire as in play), resetting fired events, flag toggles, hero HP/XP/stat/weapon/item edits, an instant fight win and save deletion. It is rendered only under `import.meta.env.DEV`, so it isn't in production builds. Its transitions live in `src/game/debug.ts` and go through `store.apply()`, so autosave still applies; when adding a new kind of game state (time, locations), add a matching control there.

TypeScript is pinned to 6.0 because typescript-eslint doesn't support TypeScript 7 yet. If the dev server starts failing to resolve `@/…` imports after running tests alongside it, restart `npm run dev`.

Functions whose names start with `use` are treated as hooks by the react-hooks lint rules, so name non-hook helpers otherwise (`consumeItem`, `applyItem`).

## Architecture

Three layers, each depending only on the ones before it:

- **`src/content/`: data.** The story (`chapters/*.ts`, merged in `story.ts` with `START_SCENE`), locations (`locations.ts`: `LocationId` is a hand-written union because exits reference it), NPCs with schedules (`npcs.ts`), story events (`events.ts`), the journal of goals and leads (`journal.ts`), hero classes, weapons, items, stat names, portraits, progression (`progression.ts`: XP rewards, level thresholds, level-up rewards) and the registry of decision flags (`flags.ts`). Ids for flags, classes, weapons and items are derived from these registries (`keyof typeof …`), so a typo in a flag or class id is a compile error. A new flag must be added to `FLAGS` before use.
- **`src/game/`: pure logic, no DOM.** `types.ts` holds all shared types. `engine.ts` holds state transitions (`choose`, `fightAction`, `closeFight`, `startNewGame`, …) that take a `GameState` and return a new one without mutating it. `world.ts` (locations, NPC presence, events, time passing), `journal.ts` (the journal view and its change notices), `time.ts`, `combat.ts` (`playRound`), `checks.ts`, `hero.ts` (loot, items) and `progression.ts` (XP, levels) do the same for their parts; `context.ts` holds helpers shared by the engine and the world (`getScene`, `textContext`, `isAvailable`) so they don't import each other, and `save.ts` holds the versioned save format. Anything random takes an `Rng` (`() => number`) parameter instead of calling `Math.random`, which is how tests pin outcomes.
- **`src/ui/`: Preact.** `store.ts` wraps the engine: it holds the `GameState`, applies transitions and performs side effects: it autosaves after every change while in the story and not in a fight (a fight isn't saved; reloading restarts it from the scene before), and deletes the save when the game returns to the menu after death. Components read state with `useGameState()` and call store methods; they never mutate state. `App.tsx` renders the scene and hero panel with overlays for the menu, hero creation, the fight, the level-up reward and the journal. `useKeyboard.ts` maps 1–9 to choices, 1–4 to level-up rewards, 1/2/3/4, Enter and Space to fight actions (4 is the first bag item), and J (by `e.code`, so it works in the Russian layout) / Esc to the journal; it reads `store.getState()` at key time rather than the rendered state, so fast repeated presses don't apply a stale choice.

### World and time

A session is either in a scene (`sceneId` set) or roaming a location (`sceneId === null`). Time is `session.time`, minutes since midnight of day 1 (`time.ts`: `atTime`, `toGameTime`, `inHours`; periods are morning 6–12, day 12–18, evening 18–22, night 22–6). The game starts at `START_SCENE` / `START_TIME` / `START_LOCATION` in `story.ts`.

While roaming, `roamChoices()` builds the choices: talks with NPCs whose `schedule` puts them here now, the location's `actions`, exits (an exit with `if` stays visible but disabled with its `locked` hint until the flag is set — soft unlocking), "wait an hour" and, where `bed` is set, "sleep until morning" (+1 HP per hour slept). Story events (`events.ts`) start a scene by themselves when the hero is in their `location` within their `hours` (plus `fromDay`, `if`, `ifNot`); each fires once (`session.events`) and only while roaming. Waiting and sleeping advance time in 15-minute steps aligned to the quarter hour and stop when an event starts; moving checks events on arrival. Scenes can set `location` (entering moves the hero there) and `set` (flags recorded on entering). Text functions also get `time` and `location`, so a scene can read differently by hour or place.

### Journal

The journal (`src/content/journal.ts`) lists goals and leads. It isn't stored: `journal(session)` rebuilds it from flags and fired events. An entry appears when its condition holds (`if`, `ifNot`, `event`), shows the `notes` whose conditions hold, is done when `done` holds, and a goal that isn't done shows its `hint` (also shown under the journal button in the hero panel for the first active goal). `choose` and `closeFight` compare the journal before and after and add notices ("new goal", "new lead", "new entry", "goal done"); a new game starts with one. To make progress visible in the journal, set a flag in the story and reference it from an entry; `tests/story.test.ts` checks that every flag a journal condition uses is set somewhere. Entries are written in the first person, as the hero's notes.

### Scenes

A scene is `{ image, actor?, title, text, choices }`. `text` and choice `text` are a string or a function of `{ hero, flag }`; `\n` renders as a line break. Choices are a union discriminated by which key is present (engine checks with `in`):

- `{ next }`: go to a scene.
- `{ fight: EnemyDef, next }`: fight; winning goes to `next`, losing is game over. `EnemyDef` has `hp` (default 10), `damage` (default 0–2), `xp` (default `FIGHT_XP`, 10, granted when the win is closed) and `windup` (the chance the enemy winds up instead of striking; the next strike is doubled).
- `{ check: { stat, difficulty, set?, give?, xp? }, next, fail }`: a stat check. The chance is 50% + 15% per point above `difficulty`, clamped to 5–95%, and is shown on the button. `check.set`, `check.give` and `check.xp` (default `CHECK_XP`, 5) apply only on success. Results, loot and XP gains are `session.notices`, shown above the next scene's text and cleared by the next choice.
- `{ leave: true | LocationId }`: end the scene and roam here (or at that location).
- `{ move }`, `{ wait }`, `{ sleep }`: generated for roaming; not normally written in scenes.
- `{ gameOver: true }`: game over. A scene containing one is a death scene and is never saved.
- No action: the choice does nothing (for example, the end of written content).

Any choice may also have `set` (flags recorded on pick), `if` / `ifNot` (show only when a flag is or isn't set) `heal: N` (restore up to N HP, capped at max) `give: { weapon?, items? }` (a weapon is equipped at once, items go to the bag), `minutes` (time the choice takes, default 0), `hours` (shown only within these hours) and `disabled` (shown but not selectable, with the reason). Scene ids are plain strings unique across chapters; `tests/story.test.ts` checks that every link target exists, every scene is reachable, every image file exists in `public/` and every flag used in `if` / `ifNot` (in choices, exits and events) is set somewhere, every event scene exists and exits are two-way. Reachability counts the prologue, event scenes, NPC talks and location actions as entry points.

### Combat

Each round the player attacks, uses a bag item (`{ item }`: heals, the enemy still answers), defends (halves incoming damage, doubles dodge) or uses the class special (`HeroClass.special`: a `damage` multiplier, `stun` so the enemy skips its answer and loses its wind-up, `crit` for a guaranteed crit, and a `cooldown`). Hero damage is strength plus a weapon roll, doubled on a crit. Hero HP carries over between fights; `heal` choices, items and level-ups restore it.

### Progression

XP comes from fights and successful checks; `addXp` raises `level` by the `LEVEL_XP` thresholds and adds one `levelUps` per level gained. While `levelUps > 0` (and not fighting) the story is paused behind the level-up overlay: `chooseLevelReward` applies +1 to a stat or +3 max HP from `LEVEL_REWARDS` and fully heals.

### Saves

`localStorage` key `nightwatch-save`, format version 6: `{ version, sceneId, locationId, time, events, hero, flags }`. `migrate()` upgrades step by step: version 2 (the pre-TypeScript game: `stage`, `class: 'Warrior'`, `src`, `hp`/`currentHp`) → 3 → 4 (adds `inventory`, `xp`, `level`, `levelUps`) → 5 (adds location, time and fired events, reconstructed from the scene the linear chapter stopped at) → 6 (sets the `joined` flag, which the journal's first goal needs, for saves past the prologue). Saves with an unknown scene, location, event, class, weapon or item are ignored. When the save format changes, bump `SAVE_VERSION` and add a migration step instead of breaking old saves.

## Assets and design

Images live in `public/img/` and are referenced by relative paths such as `'img/scene-hall.jpg'`; hero portraits are stored in saves this way. Images are AI-generated from the prompts in `docs/image-prompts.md`, which also defines the shared style suffix and negative prompt; keep new art consistent with it (scenes 16:9 at 1344×768, portraits 1:1). The user's full-size PNG originals are in `img-source/`, which is git-ignored. The game uses JPG copies, with portraits downscaled to 512×512. A missing image is hidden rather than shown broken (`Picture` component), so scenes can be written before their art exists.

The UI is a dark theme matching the art. Colors and fonts are CSS variables on `:root` in `src/styles/main.css` (Cormorant SC and PT Serif from Google Fonts, with Georgia as fallback). Below 760px the layout switches to one column with the hero panel as a compact bar on top.

`docs/1 глава.txt` holds the chapter 1 premise, and `docs/Структура.docx` plans the chapter's locations (outside the fortress → inner courtyard → room 1 → chamber).
