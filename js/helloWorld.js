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

//  ВРАГ: hp, урон { min, max } и windup (шанс замахнуться вместо удара) необязательны
function enemy(name, src, hp, damage, windup) {
  this.name = name;
  this.src = src;
  this.hp = hp || 10;
  this.currentHp = this.hp;
  this.damage = damage || { min: 0, max: 2 };
  this.windup = windup || 0;
  this.windingUp = false;  //  замахнулся: следующий удар двойной
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

//  ПОЛОСА ЗДОРОВЬЯ С ТЕКСТОМ; при трети здоровья и меньше полоса краснеет сильнее
function hpHtml (unit) {
  let share = Math.max(unit.currentHp, 0) / unit.hp;
  return '<div class="hp' + (share <= 0.34 ? ' hp--low' : '') + '">' +
    '<div class="hp__fill" style="width: ' + Math.round(share * 100) + '%"></div>' +
    '<span class="hp__text">' + hpText(unit) + '</span></div>';
}

function renderHeroHp () {
  document.querySelector("#hero-status_hp").innerHTML = hpHtml(hero);
}

function fightLog (message) {
  let p = document.createElement('p');
  p.textContent = message;
  let log = document.querySelector("#fightLog");
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

function renderFightHp (enemy) {
  document.querySelector("#heroFightHP").innerHTML = hpHtml(hero);
  document.querySelector("#enemyFightHP").innerHTML = hpHtml(enemy);
  renderHeroHp();
}

//  ЗАКОНЧИТЬ БОЙ: показать итог, по кнопке закрыть окно боя и вызвать then
function endFight (message, then) {
  document.querySelector(".fight-actions").style.display = "none";
  document.querySelector("#enemyIntent").textContent = '';
  document.querySelector("#fightResult").textContent = message;
  document.querySelector("#winAlert").style.display = "block";
  document.getElementById('closeFight').onclick = function() {
    document.querySelector("#fightWrapper").style.display = "none";
    then();
  }
}

//  ПОШАГОВЫЙ БОЙ. Раунд: действие героя, затем ответ врага.
//  Действия: attack — обычный удар; defend — урон врага вдвое меньше, шанс уворота вдвое выше;
//  special — приём класса (heroClasses[..].special), после него ждать cooldown ходов.
//  Враг с шансом enemy.windup замахивается вместо удара, и следующий его удар двойной.
//  Победа — переход в stage, поражение — конец игры.
function fight (enemy, stage) {
  let special = heroClasses[hero.class].special;
  let cooldown = 0;  //  сколько ходов осталось до приёма

  document.querySelector("#fightWrapper").style.display = "block";
  document.querySelector("#winAlert").style.display = "none";
  document.querySelector(".fight-actions").style.display = "";
  document.querySelector("#fightLog").innerHTML = null;
  document.querySelector("#fightHeroImg").firstElementChild.src = hero.src;
  document.querySelector("#heroFightName").textContent = hero.name;
  document.querySelector("#enemyFightName").textContent = enemy.name;
  document.querySelector("#fightEnemyImg").firstElementChild.src = enemy.src;
  document.querySelector("#special-name").textContent = special.name;
  document.getElementById('special').title = special.name + ': ' + special.description;
  renderFightState();

  function renderFightState () {
    renderFightHp(enemy);
    let button = document.getElementById('special');
    button.disabled = cooldown > 0;
    document.querySelector("#special-note").textContent = cooldown > 0
      ? 'через ' + cooldown + (cooldown == 1 ? ' ход' : cooldown < 5 ? ' хода' : ' ходов')
      : special.description;
    document.querySelector("#enemyIntent").textContent = enemy.windingUp ? 'Готовит сильный удар!' : '';
  }

  function enemyTurn (defending) {
    let heavy = enemy.windingUp;
    if (!heavy && Math.random() < enemy.windup) {
      enemy.windingUp = true;
      fightLog(enemy.name + ' замахивается для сильного удара!');
      return;
    }
    enemy.windingUp = false;
    let dodge = defending ? hero.dodge * 2 : hero.dodge;
    if (Math.random() < dodge) {
      fightLog(heavy ? 'Вы уворачиваетесь от сильного удара!' : 'Вы уворачиваетесь от удара');
      return;
    }
    let dmg = randomInt(enemy.damage.min, enemy.damage.max) * (heavy ? 2 : 1);
    if (defending) dmg = Math.floor(dmg / 2);
    hero.currentHp -= dmg;
    if (dmg) {
      fightLog((heavy ? enemy.name + ' обрушивает сильный удар' : enemy.name + ' бьёт в ответ') +
        (defending ? ' по вашей защите' : '') + ': вы теряете ' + dmg + ' здоровья');
    } else {
      fightLog(defending ? 'Вы принимаете удар на защиту и не теряете здоровья' : enemy.name + ' промахивается');
    }
  }

  function round (action) {
    let stun = false;
    if (action === 'defend') {
      fightLog('Вы встаёте в защиту');
    } else {
      let dmg = hero.strength + randomInt(hero.weapon.min, hero.weapon.max);
      let isCrit = Math.random() < hero.crit;
      let label = 'Вы бьёте: ';
      if (action === 'special') {
        cooldown = special.cooldown + 1;  //  +1: этот ход тоже вычтется в конце раунда
        dmg *= special.damage || 1;
        if (special.crit) isCrit = true;
        stun = !!special.stun;
        label = special.name + '! ';
      }
      if (isCrit) {
        dmg *= 2;
        if (action !== 'special') label = 'Точный удар! ';
      }
      enemy.currentHp -= dmg;
      fightLog(label + enemy.name + ' теряет ' + dmg + ' здоровья');
      if (enemy.currentHp <= 0) {
        renderFightState();
        endFight('Вы победили', function() { goTo (stage); });
        return;
      }
    }

    if (stun) {
      fightLog(enemy.windingUp ? 'Вы сбиваете замах: ' + enemy.name + ' оглушён и пропускает удар'
                               : enemy.name + ' оглушён и пропускает удар');
      enemy.windingUp = false;
    } else {
      enemyTurn(action === 'defend');
    }
    if (cooldown > 0) cooldown--;
    renderFightState();
    if (hero.currentHp <= 0) {
      endFight('Вы проиграли', gameOver);
    }
  }

  document.getElementById('push').onclick = function() { round('attack'); };
  document.getElementById('defend').onclick = function() { round('defend'); };
  document.getElementById('special').onclick = function() { if (cooldown == 0) round('special'); };
}

//  ДВИЖОК СЦЕН

//  ПЕРЕЙТИ В СЦЕНУ И ОТРИСОВАТЬ ЕЁ
function goTo (stage) {
  gameStatus.currentStage = stage;
  updateGameField ();
  saveGame ();
}

//  КОНЕЦ ИГРЫ: ВОЗВРАТ В ГЛАВНОЕ МЕНЮ
function gameOver () {
  deleteSave ();
  gameStatus.currentStage = 'st0';
  newGameWindow.style.display = "block";
}

//  ВЫПОЛНИТЬ ДЕЙСТВИЕ ВЫБРАННОГО ПУНКТА МЕНЮ (формат пунктов — см. js/chapter1.js)
function choose (option) {
  if (option.heal) {
    hero.currentHp = Math.min(hero.hp, hero.currentHp + option.heal);
    renderHeroHp();
  }
  if (option.fight) {
    let f = option.fight;
    fight (new enemy(f.name, f.img, f.hp, f.damage, f.windup), option.next);
  } else if (option.gameOver) {
    gameOver ();
  } else if (option.next) {
    goTo (option.next);
  }
}

//  ТЕКСТ СЦЕНЫ ИЛИ ПУНКТА: СТРОКА ИЛИ ФУНКЦИЯ, ВОЗВРАЩАЮЩАЯ СТРОКУ
function textOf (value) {
  return typeof value === 'function' ? value() : value;
}

function newMenu (options) {
  let ul = document.getElementById('select');
  ul.innerHTML = null;
  options.forEach(function (option) {
    let li = document.createElement('li');
    let button = document.createElement('button');
    button.className = 'choice';
    button.innerHTML = textOf(option.text);
    button.onclick = function() {
      choose (option);
    }
    li.appendChild(button);
    ul.appendChild(li);
  });
}

function isShown (element) {
  return getComputedStyle(element).display !== 'none';
}

//  КЛАВИАТУРА: 1–9 — варианты ответа.
//  В бою: 1/Enter/пробел — удар, 2 — защита, 3 — приём; после боя Enter/пробел/1 — «Продолжить»
document.addEventListener('keydown', function (e) {
  if (e.target.tagName === 'INPUT' || e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;  //  кнопку в фокусе браузер нажмёт сам
  if (isShown(newGameWindow) || isShown(createHeroWindow)) return;

  if (isShown(document.querySelector("#fightWrapper"))) {
    let fighting = isShown(document.querySelector(".fight-actions"));
    let keys = fighting
      ? { 'Enter': 'push', ' ': 'push', '1': 'push', '2': 'defend', '3': 'special' }
      : { 'Enter': 'closeFight', ' ': 'closeFight', '1': 'closeFight' };
    if (!keys[e.key]) return;
    e.preventDefault();
    let button = document.getElementById(keys[e.key]);
    if (!button.disabled) button.click();
    return;
  }

  let n = parseInt(e.key, 10);
  let choices = document.querySelectorAll('#select .choice');
  if (n >= 1 && n <= choices.length) {
    e.preventDefault();
    choices[n - 1].click();
  }
});

function updateGameField () {
  let stage = gameStatus.stages[gameStatus.currentStage];  //  ТЕКУЩАЯ СЦЕНА
  img.onerror = function() { img.style.display = 'none'; };  //  картинки ещё нет — просто не показываем
  if (img.getAttribute('src') !== stage.img) {  //  при той же картинке оставляем как есть: браузер не перезагрузит её и не вызовет onerror
    img.style.display = '';
    img.src = stage.img;  //  ВСТАВЛЯЕМ КАРТИНКУ ТЕКУЩЕЙ СЦЕНЫ
  }
  image.appendChild(img);
  if (stage.actorImg) {
    actorImage.firstElementChild.src = stage.actorImg;
    actorImage.firstElementChild.style.display = 'block';
  } else {
    actorImage.firstElementChild.style.display = 'none';
  }
  text.querySelector('h1').textContent = stage.eTitle;
  text.querySelector('span').textContent = textOf(stage.description);
  newMenu (stage.menu);
}


//  weapons

const weapons = [
  {
    name: 'Без оружия',
    min: 0,
    max: 2
  }
]
