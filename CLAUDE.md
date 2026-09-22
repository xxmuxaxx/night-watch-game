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

TypeScript is pinned to 6.0 because typescript-eslint doesn't support TypeScript 7 yet.

## Architecture

Three layers, each depending only on the ones before it:

- **`src/content/`: data.** The story (`chapters/*.ts`, merged in `story.ts` with `START_SCENE`), hero classes, weapons, stat names, portraits and the registry of decision flags (`flags.ts`). Ids for flags, classes and weapons are derived from these registries (`keyof typeof …`), so a typo in a flag or class id is a compile error. A new flag must be added to `FLAGS` before use.
- **`src/game/`: pure logic, no DOM.** `types.ts` holds all shared types. `engine.ts` holds state transitions (`choose`, `fightAction`, `closeFight`, `startNewGame`, …) that take a `GameState` and return a new one without mutating it. `combat.ts` (`playRound`), `checks.ts` and `hero.ts` do the same for their parts, and `save.ts` holds the versioned save format. Anything random takes an `Rng` (`() => number`) parameter instead of calling `Math.random`, which is how tests pin outcomes.
- **`src/ui/`: Preact.** `store.ts` wraps the engine: it holds the `GameState`, applies transitions and performs side effects (autosave when entering a new scene or starting a game, deleting the save when the game returns to the menu after death). Components read state with `useGameState()` and call store methods; they never mutate state. `App.tsx` renders the scene and hero panel with overlays for the menu, hero creation and the fight. `useKeyboard.ts` maps 1–9 to choices and 1/2/3, Enter and Space to fight actions.

### Scenes

A scene is `{ image, actor?, title, text, choices }`. `text` and choice `text` are a string or a function of `{ hero, flag }`; `\n` renders as a line break. Choices are a union discriminated by which key is present (engine checks with `in`):

- `{ next }`: go to a scene.
- `{ fight: EnemyDef, next }`: fight; winning goes to `next`, losing is game over. `EnemyDef` has `hp` (default 10), `damage` (default 0–2) and `windup` (the chance the enemy winds up instead of striking; the next strike is doubled).
- `{ check: { stat, difficulty, set? }, next, fail }`: a stat check. The chance is 50% + 15% per point above `difficulty`, clamped to 5–95%, and is shown on the button. `check.set` flags are recorded only on success. The result is shown above the next scene's text.
- `{ gameOver: true }`: game over. A scene containing one is a death scene and is never saved.
- No action: the choice does nothing (for example, the end of written content).

Any choice may also have `set` (flags recorded on pick), `if` / `ifNot` (show only when a flag is or isn't set) and `heal: N` (restore up to N HP, capped at max). Scene ids are plain strings unique across chapters; `tests/story.test.ts` checks that every link target exists, every scene is reachable, every image file exists in `public/` and every flag used in `if` / `ifNot` is set somewhere.

### Combat

Each round the player attacks, defends (halves incoming damage, doubles dodge) or uses the class special (`HeroClass.special`: a `damage` multiplier, `stun` so the enemy skips its answer and loses its wind-up, `crit` for a guaranteed crit, and a `cooldown`). Hero damage is strength plus a weapon roll, doubled on a crit. Hero HP carries over between fights; only `heal` choices restore it.

### Saves

`localStorage` key `nightwatch-save`, format version 3: `{ version, sceneId, hero, flags }`. `migrate()` converts version 2 saves (the pre-TypeScript game: `stage`, `class: 'Warrior'`, `src`, `hp`/`currentHp`) into the current format; saves with an unknown scene, class or weapon are ignored. When the save format changes, bump `SAVE_VERSION` and add a migration step instead of breaking old saves.

## Assets and design

Images live in `public/img/` and are referenced by relative paths such as `'img/scene-hall.jpg'`; hero portraits are stored in saves this way. Images are AI-generated from the prompts in `docs/image-prompts.md`, which also defines the shared style suffix and negative prompt; keep new art consistent with it (scenes 16:9 at 1344×768, portraits 1:1). The user's full-size PNG originals are in `img-source/`, which is git-ignored. The game uses JPG copies, with portraits downscaled to 512×512. A missing image is hidden rather than shown broken (`Picture` component), so scenes can be written before their art exists.

The UI is a dark theme matching the art. Colors and fonts are CSS variables on `:root` in `src/styles/main.css` (Cormorant SC and PT Serif from Google Fonts, with Georgia as fallback). Below 760px the layout switches to one column with the hero panel as a compact bar on top.

`docs/1 глава.txt` holds the chapter 1 premise, and `docs/Структура.docx` plans the chapter's locations (outside the fortress → inner courtyard → room 1 → chamber).
