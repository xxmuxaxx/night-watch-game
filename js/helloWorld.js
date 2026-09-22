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

function enemy(name, src) {
  this.name = name;
  this.src = src;
  this.hp = 10;
  this.currentHp = 10;
}


function isCheck (name) {
  return document.querySelector('input[name="' + name + '"]:checked');
}

function fight (enemy, stage) {
  document.querySelector("#fightWrapper").style.display = "block";
  document.querySelector("#winAlert").style.display = "none";
  document.querySelector("#fightHeroImg").firstElementChild.src = hero.src;
  document.querySelector("#heroFightName").innerHTML = hero.name;
  document.querySelector("#heroFightHP").innerHTML = 'Здоровье: ' + hero.currentHp + '/' + hero.hp;
  document.querySelector("#enemyFightName").innerHTML = enemy.name;
  document.querySelector("#fightEnemyImg").firstElementChild.src = enemy.src;
  document.querySelector("#enemyFightHP").innerHTML = 'Здоровье: ' + enemy.currentHp + '/' + enemy.hp;

  document.getElementById('push').onclick = function() {
    if (enemy.currentHp) {
      enemy.currentHp = enemy.currentHp - hero.strength;
      document.querySelector("#enemyFightHP").innerHTML = 'Здоровье: ' + enemy.currentHp + '/' + enemy.hp;
    }
    let checkHealthEnemy = setInterval(function() {
      if (!enemy.currentHp) {
      document.querySelector("#winAlert").style.display = "block";
      document.getElementById('closeFight').onclick = function() {
      document.querySelector("#fightWrapper").style.display = "none";
      clearInterval(checkHealthEnemy);
      goTo (stage);
    }}}, 100);
  }}

//  ДВИЖОК СЦЕН

//  ПЕРЕЙТИ В СЦЕНУ И ОТРИСОВАТЬ ЕЁ
function goTo (stage) {
  gameStatus.currentStage = stage;
  updateGameField ();
}

//  ВЫПОЛНИТЬ ДЕЙСТВИЕ ВЫБРАННОГО ПУНКТА МЕНЮ (формат пунктов — см. js/chapter1.js)
function choose (option) {
  if (option.fight) {
    fight (new enemy(option.fight.name, option.fight.img), option.next);
  } else if (option.gameOver) {
    gameStatus.currentStage = 'st0';
    newGameWindow.style.display = "block";
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


//  abilities

let punch = (weapon, enemy) => {
  let dmg = Math.floor(Math.random() * (weapon.max - weapon.min + 1)) + weapon.min

}

//  weapons

const weapons = [
  {
    name: 'Без оружия',
    min: 0,
    max: 2
  }
]