# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Night Watch is an unfinished browser text RPG (a Game of Thrones / Night's Watch fan game), written around 2019–2020 in plain HTML/CSS/JavaScript with no framework, build step, package manager, linter or tests. All in-game text and code comments are in Russian. Keep new player-facing text in Russian.

## Running

Nothing needs to be installed or built. Serve the folder with a static server; `.claude/launch.json` defines one. The game can also be opened as `index.html` directly, but some tools render `file://` pages without running the scripts.

```bash
python -m http.server 8000
```

## Architecture

Scripts are plain `<script>` tags that share one global scope. They load in this order: `main.js`, `chapter1.js`, `helloWorld.js`, `newGame_newHero.js`. Functions and variables are passed between files as globals (for example `hero` from `main.js`, `chapter1` from `chapter1.js`, `newGameWindow` from `helloWorld.js`), and many are implicit globals. That makes load order significant: `chapter1.js` must load before `helloWorld.js`, which reads `chapter1` at load time.

- **Screens.** `index.html` holds every screen: the story view (`.event-container`), the hero panel (`.right-column`), and three `.menu` overlays: `#new-game`, `#create-hero-menu` and `#fightWrapper`. Overlays start with the `hidden` attribute and are shown or hidden by setting `style.display` from JS.
- **Game flow.** Start → `newGame()` builds the portrait picker from `heroFacesArray` → `createNewHero()` fills the global `hero` object and calls `updateGameField()`.
- **Scenes are pure data (`js/chapter1.js`).** The `chapter1` object maps stage keys (`st0`, `st1`, `st1_1`, ...) to scenes with `img`, `actorImg`, `eTitle`, `description` and `menu`. Each menu option has `text` (a string, or a function for text computed at render time, such as the hero's name) plus an action: `next: 'stX'`, `fight: { name, img }` together with `next`, or `gameOver: true`. An option with no action does nothing. The format is documented at the top of `chapter1.js`. To add story content, edit only the data; engine changes are needed only for a new kind of action.
- **Scene engine (`js/helloWorld.js`).** `gameStatus.stages` points at `chapter1`. `updateGameField()` renders `gameStatus.currentStage`, and `newMenu()` attaches `choose(option)` to each option. `choose()` dispatches on the option's action, and `goTo(stage)` switches scenes and re-renders.
- **Combat.** `fight(enemy, nextStage)` opens the fight overlay. Each click on "Ударить" subtracts `hero.strength` from `enemy.currentHp`. Victory is detected by polling `!enemy.currentHp` with `setInterval`, so an enemy's HP must reach exactly 0. The enemy never attacks back. After the player closes the victory window, `goTo(nextStage)` runs.
- **Unused code.** `js/notebook.js` is fully commented out. `npc`, `locations` and `faceArr` in `main.js` and `punch` and `weapons` in `helloWorld.js` are unused stubs.

## Known issues

- `createNewHero()` returns early for any class except `Warrior`, so the Rogue class does nothing.
- "Загрузить игру" (load game) and the "Скрыть\Отобразить" debug button in the hero panel have no real function.

## Design notes

`1 глава.txt` holds the chapter 1 premise: a hero with no backstory arrives at the Black Castle under guard. `Структура.docx` plans this sequence of locations: outside the castle → inner courtyard → room 1 → chamber.
