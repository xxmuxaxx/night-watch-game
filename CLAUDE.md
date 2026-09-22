# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Night Watch is an unfinished browser text RPG (a Game of Thrones / Night's Watch fan game), written around 2019–2020 in plain HTML/CSS/JavaScript with no framework, build step, package manager, linter or tests. All in-game text and code comments are in Russian. Keep new player-facing text in Russian.

## Running

Open `index.html` directly in a browser. Nothing needs to be installed or built. If `file://` causes trouble, any static server works, for example:

```bash
python -m http.server 8000
```

## Architecture

Scripts are plain `<script>` tags that share one global scope. They load in this order: `main.js`, `helloWorld.js`, `newGame_newHero.js`, `chapter1.js`. Functions and variables are passed between files as globals (for example `hero` from `main.js`, `newGameWindow` from `helloWorld.js`), and many are implicit globals. That makes load order significant.

- **Screens.** `index.html` holds every screen: the story view (`.event-container`), the hero panel (`.right-column`), and three `.menu` overlays: `#new-game`, `#create-hero-menu` and `#fightWrapper`. Overlays start with the `hidden` attribute and are shown or hidden by setting `style.display` from JS.
- **Game flow.** Start → `newGame()` builds the portrait picker from `heroFacesArray` → `createNewHero()` fills the global `hero` object and calls `updateGameField()`.
- **Scene engine (`js/helloWorld.js`).** Scenes are data in `gameStatus.stages`, keyed `st0`, `st1`, `st1_1`, and so on. Each scene has `img`, `actorImg`, `eTitle`, `description` and `menu`, an array of label strings. `updateGameField()` renders `gameStatus.currentStage`, and `newMenu()` creates `<li id="select-N">` items. Transitions are **not** part of the scene data. They are hard-coded per stage in `getLiFunc()`, which attaches `onclick` handlers to `select-1`, `select-2` and so on. A new scene therefore needs both an entry in `stages` and a branch in `getLiFunc()`.
- **Text rendering.** `updateGameField()` writes the scene title and description through `text.childNodes[1]` and `[3]`. These indices depend on the whitespace text nodes inside `.text` in `index.html`, so reformatting that markup breaks rendering.
- **Combat.** `fight(enemy, nextStage)` opens the fight overlay. Each click on "Ударить" subtracts `hero.strength` from `enemy.currentHp`. Victory is detected by polling `!enemy.currentHp` with `setInterval`, so an enemy's HP must reach exactly 0. The enemy never attacks back.
- **Unused code.** `js/chapter1.js` and `js/notebook.js` are fully commented out; `chapter1.js` is an old copy of the scenes. `npc`, `locations` and `faceArr` in `main.js` and `punch` and `weapons` in `helloWorld.js` are unused stubs.

## Known issues

- `createNewHero()` returns early for any class except `Warrior`, so the Rogue class does nothing.
- "Загрузить игру" (load game) and the "Скрыть\Отобразить" debug button in the hero panel have no real function.

## Design notes

`1 глава.txt` holds the chapter 1 premise: a hero with no backstory arrives at the Black Castle under guard. `Структура.docx` plans this sequence of locations: outside the castle → inner courtyard → room 1 → chamber.
