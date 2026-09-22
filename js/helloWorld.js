// 1 глава
image = document.querySelector ('.image-container');
actorImage = document.querySelector ('.actor-image');
var text = document.querySelector ('.text');
img = new Image();
let createHeroWindow = document.querySelector("#create-hero-menu");
let newGameWindow = document.querySelector("#new-game");


var gameStatus = {
  currentStage: 'st0',
  stages: chapter1  //  СЦЕНЫ ГЛАВЫ, СМ. js/chapter1.js
};

//  ВРАГ: hp и урон { min, max } необязательны
function enemy(name, src, hp, damage) {
  this.name = name;
  this.src = src;
  this.hp = hp || 10;
  this.currentHp = this.hp;
  this.damage = damage || { min: 0, max: 2 };
}


function isCheck (name) {
  return document.querySelector('input[name="' + name + '"]:checked');
}

//  БОЙ

function randomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hpText (unit) {
  return 'Здоровье: ' + Math.max(unit.currentHp, 0) + '/' + unit.hp;
}

function fightLog (message) {
  let p = document.createElement('p');
  p.textContent = message;
  let log = document.querySelector("#fightLog");
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function renderFightHp (enemy) {
  document.querySelector("#heroFightHP").innerHTML = hpText(hero);
  document.querySelector("#enemyFightHP").innerHTML = hpText(enemy);
  document.querySelector("#hero-status_hp").innerHTML = hpText(hero);
}

//  ЗАКОНЧИТЬ БОЙ: показать итог, по кнопке закрыть окно боя и вызвать then
function endFight (message, then) {
  document.getElementById('push').style.display = "none";
  document.querySelector("#fightResult").textContent = message;
  document.querySelector("#winAlert").style.display = "block";
  document.getElementById('closeFight').onclick = function() {
    document.querySelector("#fightWrapper").style.display = "none";
    then();
  }
}

//  ПОШАГОВЫЙ БОЙ: герой бьёт первым, враг отвечает. Победа — переход в stage, поражение — конец игры
function fight (enemy, stage) {
  document.querySelector("#fightWrapper").style.display = "block";
  document.querySelector("#winAlert").style.display = "none";
  document.querySelector("#fightLog").innerHTML = null;
  document.querySelector("#fightHeroImg").firstElementChild.src = hero.src;
  document.querySelector("#heroFightName").innerHTML = hero.name;
  document.querySelector("#enemyFightName").innerHTML = enemy.name;
  document.querySelector("#fightEnemyImg").firstElementChild.src = enemy.src;
  renderFightHp(enemy);

  let push = document.getElementById('push');
  push.style.display = "inline-block";
  push.onclick = function() {
    let heroDmg = hero.strength + randomInt(hero.weapon.min, hero.weapon.max);
    let isCrit = Math.random() < hero.crit;
    if (isCrit) heroDmg *= 2;
    enemy.currentHp -= heroDmg;
    fightLog((isCrit ? 'Точный удар! ' : 'Вы бьёте: ') + enemy.name + ' теряет ' + heroDmg + ' здоровья');
    renderFightHp(enemy);
    if (enemy.currentHp <= 0) {
      endFight('Вы победили', function() { goTo (stage); });
      return;
    }

    if (Math.random() < hero.dodge) {
      fightLog('Вы уворачиваетесь от удара');
      return;
    }
    let enemyDmg = randomInt(enemy.damage.min, enemy.damage.max);
    hero.currentHp -= enemyDmg;
    fightLog(enemyDmg ? enemy.name + ' бьёт в ответ: вы теряете ' + enemyDmg + ' здоровья' : enemy.name + ' промахивается');
    renderFightHp(enemy);
    if (hero.currentHp <= 0) {
      endFight('Вы проиграли', gameOver);
    }
  }
}

//  ДВИЖОК СЦЕН

//  ПЕРЕЙТИ В СЦЕНУ И ОТРИСОВАТЬ ЕЁ
function goTo (stage) {
  gameStatus.currentStage = stage;
  updateGameField ();
}

//  КОНЕЦ ИГРЫ: ВОЗВРАТ В ГЛАВНОЕ МЕНЮ
function gameOver () {
  gameStatus.currentStage = 'st0';
  newGameWindow.style.display = "block";
}

//  ВЫПОЛНИТЬ ДЕЙСТВИЕ ВЫБРАННОГО ПУНКТА МЕНЮ (формат пунктов — см. js/chapter1.js)
function choose (option) {
  if (option.fight) {
    let f = option.fight;
    fight (new enemy(f.name, f.img, f.hp, f.damage), option.next);
  } else if (option.gameOver) {
    gameOver ();
  } else if (option.next) {
    goTo (option.next);
  }
}

function newMenu (options) {
  let ul = document.getElementById('select');
  ul.innerHTML = null;
  options.forEach(function (option) {
    let li = document.createElement('li');
    li.innerHTML = typeof option.text === 'function' ? option.text() : option.text;
    li.onclick = function() {
      choose (option);
    }
    ul.appendChild(li);
  });
}

function updateGameField () {
  let stage = gameStatus.stages[gameStatus.currentStage];  //  ТЕКУЩАЯ СЦЕНА
  img.src = stage.img;  //  ВСТАВЛЯЕМ КАРТИНКУ ТЕКУЩЕЙ СЦЕНЫ
  image.appendChild(img);
  if (stage.actorImg) {
    actorImage.firstElementChild.src = stage.actorImg;
    actorImage.firstElementChild.style.display = 'block';
  } else {
    actorImage.firstElementChild.style.display = 'none';
  }
  text.querySelector('h1').textContent = stage.eTitle;
  text.querySelector('span').textContent = stage.description;
  newMenu (stage.menu);
}

// СКРЫТЬ ИЛИ ОТОБРАЗИТЬ ЭЛЕМЕНТ
function showHide(id, display) {
  elem = document.getElementById(id);
  if (elem.style.display == display || elem.style.display == '' ) {
    elem.style.display = 'none';
  } else {
    elem.style.display = display;
  }
}


//  weapons

const weapons = [
  {
    name: 'Без оружия',
    min: 0,
    max: 2
  }
]
