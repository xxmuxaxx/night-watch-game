# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Night Watch is an unfinished browser text RPG set in an original low-fantasy north: a border fortress in snowy mountains. It began around 2019–2020 as a Game of Thrones fan game, and direct references to the show have since been removed (images, names, the Black Castle); keep new content free of them. It is written in plain HTML/CSS/JavaScript with no framework, build step, package manager, linter or tests. All in-game text and code comments are in Russian. Keep new player-facing text in Russian.

## Running

Nothing needs to be installed or built. Serve the folder with a static server; `.claude/launch.json` defines one. The game can also be opened as `index.html` directly, but some tools render `file://` pages without running the scripts.

```bash
python -m http.server 8000
```

## Architecture

Scripts are plain `<script>` tags that share one global scope. They load in this order: `main.js`, `chapter1.js`, `helloWorld.js`, `newGame_newHero.js`, `save.js`. Functions and variables are passed between files as globals (for example `hero` from `main.js`, `chapter1` from `chapter1.js`, `newGameWindow` from `helloWorld.js`), and many are implicit globals. That makes load order significant: `chapter1.js` must load before `helloWorld.js`, which reads `chapter1` at load time.

- **Screens.** `index.html` holds every screen: the story view (`.event-container`), the hero panel (`.right-column`), and three `.menu` overlays: `#new-game`, `#create-hero-menu` and `#fightWrapper`. Overlays start with the `hidden` attribute and are shown or hidden by setting `style.display` from JS.
- **Game flow.** Start → `newGame()` builds the portrait picker from `heroFacesArray` → `createNewHero()` fills the global `hero` object from `heroClasses` in `main.js` and calls `updateGameField()`. `heroClasses` is keyed by the class radio button's `id` in `index.html` (`Warrior`, `Rogue`) and holds `title`, `hp`, `strength`, `crit` (chance of double damage) and `dodge` (chance to avoid the enemy's hit). A new class needs an entry there and a matching radio button.
- **Scenes are pure data (`js/chapter1.js`).** The `chapter1` object maps stage keys (`st0`, `st1`, `st1_1`, ...) to scenes with `img`, `actorImg`, `eTitle`, `description` and `menu`. Each menu option has `text` (a string, or a function for text computed at render time, such as the hero's name) plus an action: `next: 'stX'`, `fight: { name, img }` together with `next`, or `gameOver: true`. An option with no action does nothing. The format is documented at the top of `chapter1.js`. To add story content, edit only the data; engine changes are needed only for a new kind of action.
- **Scene engine (`js/helloWorld.js`).** `gameStatus.stages` points at `chapter1`. `updateGameField()` renders `gameStatus.currentStage`, and `newMenu()` attaches `choose(option)` to each option. `choose()` dispatches on the option's action, and `goTo(stage)` switches scenes and re-renders.
- **Combat.** `fight(enemy, nextStage)` opens the fight overlay and runs a turn-based fight with no timers. Each click on "Ударить" is one round: the hero deals `hero.strength` plus a roll in `hero.weapon.min`–`max` (weapons come from the `weapons` array), doubled on a `hero.crit` roll, then, if the enemy survives and the hero doesn't dodge (`hero.dodge`), the enemy deals a roll in its `damage.min`–`max`. Both HP checks use `<= 0`. Messages go to `#fightLog`. On victory, `goTo(nextStage)` runs; on defeat, `gameOver()` runs, in both cases after the player closes the result window (`endFight()`). The hero's HP carries over after a fight; there's no healing yet.
- **Saving (`js/save.js`).** The game autosaves `{ version, stage, hero }` to `localStorage` under `nightwatch-save` on hero creation and on every `goTo()`. Scenes whose menu contains a `gameOver` option are never saved, and `gameOver()` deletes the save. `readSave()` rejects saves whose `version` (currently 2), stage key or hero class no longer exists, so renaming a stage or class invalidates old saves; bump `version` if the save format changes. `hero` is stored as plain JSON, so `loadGame()` re-links `hero.weapon` to the matching `weapons` entry. Any new hero field that holds a function or an object shared with game data needs the same treatment. `hero.src` is a relative path so saves don't depend on the site's address. The "Загрузить игру" button is shown only when a valid save exists.
- **Unused code.** `js/notebook.js` is fully commented out. `npc`, `locations` and `faceArr` in `main.js` are unused stubs.

## Design notes

Images are AI-generated from the prompts in `image-prompts.md`, which also defines the shared style suffix and negative prompt. Keep new images consistent with it: scenes 16:9 (1344×768), portraits 1:1. The game uses JPG files in `img/`; the user's full-size PNG originals live in `img-source/`, which is git-ignored. Portraits are downscaled to 512×512 on conversion.

`1 глава.txt` holds the chapter 1 premise: a hero with no backstory arrives at a border fortress under guard. `Структура.docx` plans this sequence of locations: outside the fortress → inner courtyard → room 1 → chamber.
