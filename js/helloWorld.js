// 1 глава
image = document.querySelector ('.image-container');
actorImage = document.querySelector ('.actor-image');
var text = document.querySelector ('.text');
img = new Image();
let createHeroWindow = document.querySelector("#create-hero-menu");
let newGameWindow = document.querySelector("#new-game");


var gameStatus = {
  currentStage: 'st0',
  stages: {
    st0: {
      img: 'img/img-1.jpg',
      actorImg: '',
      eTitle: 'Вот и всё..',
      description: 'Ваша жизнь скоро закончится. И начнется новая...',
      menu: ['Подойти к воротам', 'Попытаться убежать']},
    st1: {
      img: 'img/img-2.jpg',
      actorImg: '',
      eTitle: 'Стражник у ворот взглянул на вас',
      description: 'Стражник: Свежее мясо?! Открывай ворота, Стенли!',
      menu: ['Ждать...']},
    st1_1: {
      img: 'img/img-3.jpg',
      actorImg: '',
      eTitle: 'Вы ринулись, сломя голову, в сторону леса',
      description: 'очевидно, что это был не лучший выбор. Лучники на стенах не просто так получают свой пай. Вас пронзило 3 стрелы и вы упали на колени. В глазах темнело, дух покидал ваше тело...',
      menu: ['GameOver']},
    st2: {
      img: 'img/blackCastle.jpg',
      actorImg: 'img/enemy-1.jpg',
      eTitle: 'К вам подошел агрессивно настроеный молодой человек...',
      description: 'МЧ: Слыш, ты что тут стоишь? ГГ: А, что? МЧ: Ах ты, щельмец! Сейчас ты у меня получишь!',
      menu: ["Приготовиться к драке"]},
    st3: {
      img: 'img/blackCastle.jpg',
      actorImg: '',
      eTitle: 'Молодой человек повалился на земь',
      description: 'Вы неплохо показали себя в этой драке, возможно будет круто всем люле давать. А-ХИ-ХИ-ХА-ХИ. Вы видите, что ворота открываются',
      menu: ['Направится к воротам', 'Пук']},
    st4: {
      img: 'img/blackCastleOutdoors.jpg',
      actorImg: 'img/actor-sam.jpg',
      eTitle: 'Вы проходите ворота и попадаете во внутренний двор.',
      description: 'К вам подходит мужчина, с виду лет 30-35, в черном плаще и, добро улыбаясь, спрашивает: "Привет! Как тебя зовут?"',
      menu: ["Меня зовут..."]}
  }};

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
      gameStatus.currentStage = stage;
      updateGameField ();
    }}}, 100);
  }}

function newMenu (arr) {
	ul = document.getElementById('select');
  ul.innerHTML = null;
  for (i=0; i<arr.length; i++) {
    li = document.createElement('li');
    li.innerHTML = arr[i];
    ul.appendChild(li);
    li.id = 'select-'+(i+1);
  }
}

function getLiFunc() {
  if ( gameStatus.currentStage === 'st0' ) {
    document.getElementById('select-1').onclick = function() {
      gameStatus.currentStage = 'st1';
      updateGameField ();
    }
    document.getElementById('select-2').onclick = function() {
      gameStatus.currentStage = 'st1_1';
      updateGameField ();
    }
  }
  if ( gameStatus.currentStage === 'st1' ) {
    document.getElementById('select-1').onclick = function() {
      gameStatus.currentStage = 'st2';
      updateGameField ();
    }
  }
  if ( gameStatus.currentStage === 'st1_1' ) {
    document.getElementById('select-1').onclick = function() {
      gameStatus.currentStage = 'st0';
      newGameWindow.style.display = "block";
    }
  }
  if ( gameStatus.currentStage === 'st2' ) {
    document.getElementById('select-1').onclick = function() {
      var vasya = new enemy('Вася', 'img/enemy-1.jpg')
      fight (vasya, 'st3')
    }
  }
  if ( gameStatus.currentStage === 'st3' ) {
    gameStatus.stages.st4.menu[0] = 'Меня зовут <strong>' + hero.name + '</strong>';
    document.getElementById('select-1').onclick = function() {
      gameStatus.currentStage = 'st4';
      updateGameField ();
    }
    document.getElementById('select-2').onclick = function() {
      gameStatus.currentStage = 'st1_1';
      updateGameField ();
    }
  }
}

//  updateGameField ();

function updateGameField () {
  let newStage = gameStatus.currentStage;  //  ПОЛУЧАЕМ ПЕРЕМЕННУЮ С ТЕКУЩИМ ИГРОВЫМ ЭТАПОМ
  img.src = gameStatus.stages[newStage].img;  //  ВСТАВЛЯЕМ КАРТИНКУ ТЕКУЩЕГО ЭТАПА
  image.appendChild(img);
  // img2.src = gameStatus.stages[newStage].actorImg;
  if (gameStatus.stages[newStage].actorImg != '') {
    actorImage.firstElementChild.src = gameStatus.stages[newStage].actorImg;
    actorImage.firstElementChild.style.display = 'block';
  } else if (gameStatus.stages[newStage].actorImg == '') {
    actorImage.firstElementChild.style.display = 'none';
  }
  text.childNodes[1].textContent = gameStatus.stages[newStage].eTitle;
  text.childNodes[3].textContent = gameStatus.stages[newStage].description;
  newMenu (gameStatus.stages[newStage].menu);
  getLiFunc();

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