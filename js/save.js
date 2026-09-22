//  СОХРАНЕНИЕ ИГРЫ
//
//  Автосохранение в localStorage браузера: при создании героя и при каждом переходе
//  в новую сцену (goTo). Сохраняются герой, текущая сцена и решения игрока (flags;
//  в сохранениях, сделанных до их появления, решений нет — считаем, что их не было). Сцены смерти (где в меню
//  есть gameOver) не сохраняются, а сама смерть стирает сохранение.

const SAVE_KEY = 'nightwatch-save';

function saveGame () {
  let stage = gameStatus.stages[gameStatus.currentStage];
  if (stage.menu.some(function (option) { return option.gameOver; })) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 2,
      stage: gameStatus.currentStage,
      hero: hero,
      flags: gameStatus.flags
    }));
  } catch (e) {}  //  хранилище недоступно (приватный режим и т.п.) — играем без сохранения
  updateLoadButton();
}

function readSave () {
  try {
    let save = JSON.parse(localStorage.getItem(SAVE_KEY));
    //  сохранение от старой версии, где такой сцены или класса уже нет, не загружаем
    if (save && save.version === 2 && gameStatus.stages[save.stage] && heroClasses[save.hero.class]) {
      return save;
    }
  } catch (e) {}
  return null;
}

function deleteSave () {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
  updateLoadButton();
}

function loadGame () {
  let save = readSave();
  if (!save) return;
  Object.keys(hero).forEach(function (key) { delete hero[key]; });  //  без полей героя, который был до загрузки
  Object.assign(hero, save.hero);
  hero.weapon = weapons.find(function (w) { return w.name === hero.weapon.name; }) || weapons[0];
  //  в сохранениях до появления ловкости и чутья этих характеристик нет — берём их у класса
  Object.keys(statNames).forEach(function (stat) {
    if (hero[stat] === undefined) hero[stat] = heroClasses[hero.class][stat];
  });
  gameStatus.currentStage = save.stage;
  gameStatus.flags = save.flags || {};
  renderHeroStatus();
  updateGameField();
  newGameWindow.style.display = "none";
  createHeroWindow.style.display = "none";
}

//  КНОПКА «ЗАГРУЗИТЬ ИГРУ» ВИДНА, ТОЛЬКО ЕСЛИ ЕСТЬ СОХРАНЕНИЕ
function updateLoadButton () {
  document.getElementById('load-game-button').style.display = readSave() ? "block" : "none";
}

updateLoadButton();
