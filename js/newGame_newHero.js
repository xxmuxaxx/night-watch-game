let pickersBuilt = false;  //  выбор внешности и класса строится один раз

//  «30%» ИЗ 0.3
function percent (value) {
  return Math.round(value * 100) + '%';
}

//  СТРОКА ХАРАКТЕРИСТИК ДЛЯ КАРТОЧКИ КЛАССА
function classStatsText (heroClass) {
  let stats = ['Здоровье ' + heroClass.hp, 'Сила ' + heroClass.strength];
  if (heroClass.crit) stats.push('Точный удар ' + percent(heroClass.crit));
  if (heroClass.dodge) stats.push('Уклонение ' + percent(heroClass.dodge));
  return stats.join(' · ');
}

function newGame () {
  newGameWindow.style.display = "none";

  if (!pickersBuilt) {
    //  Внешность: радиокнопки heroSelector с портретами из heroFacesArray
    let faces = document.querySelector("#hero-faces");
    for (let i = 0; i < heroFacesArray.length; i++) {
      let label = document.createElement('label');
      let input = document.createElement('input');
      let img = document.createElement('img');
      input.type = 'radio';
      input.name = 'heroSelector';
      input.id = 'char' + i;
      input.checked = i == 0;
      img.src = heroFacesArray[i];
      img.alt = 'Портрет ' + (i + 1);
      label.appendChild(input);
      label.appendChild(img);
      faces.appendChild(label);
    }

    //  Класс: карточки из heroClasses, id радиокнопки = ключ класса
    let classes = document.querySelector("#hero-classes");
    Object.keys(heroClasses).forEach(function (key, i) {
      let heroClass = heroClasses[key];
      let label = document.createElement('label');
      let input = document.createElement('input');
      let card = document.createElement('div');
      input.type = 'radio';
      input.name = 'class-select';
      input.id = key;
      input.checked = i == 0;
      card.className = 'class-card';
      card.innerHTML = '<h4>' + heroClass.title + '</h4><p>' + heroClass.description + '</p>' +
        '<div class="class-card__stats">' + classStatsText(heroClass) + '</div>' +
        '<div class="class-card__special">Приём «' + heroClass.special.name + '»: ' + heroClass.special.description + '</div>';
      label.appendChild(input);
      label.appendChild(card);
      classes.appendChild(label);
    });
    pickersBuilt = true;
  }
  createHeroWindow.style.display = "block";
}

//  Отрисовываем меню героя
function renderHeroStatus () {
  document.querySelector(".hero-status__name").firstElementChild.textContent = hero.name;
  document.querySelector("#hero-status_img").firstElementChild.src = hero.src;
  document.querySelector("#hero-status_class").textContent = heroClasses[hero.class].title;
  renderHeroHp();
  let stats = [
    ['Сила', hero.strength],
    ['Оружие', hero.weapon.name + ' (' + hero.weapon.min + '–' + hero.weapon.max + ')'],
    ['Точный удар', percent(hero.crit)],
    ['Уклонение', percent(hero.dodge)],
    ['Приём', heroClasses[hero.class].special.name]
  ];
  document.querySelector("#hero-status_stats").innerHTML = stats.map(function (row) {
    return '<dt>' + row[0] + '</dt><dd>' + row[1] + '</dd>';
  }).join('');
}

function createNewHero () {
  let name = document.querySelector("input[name='setHeroName']").value.trim();
  if (!name) {
    document.getElementById('name-error').hidden = false;
    return;
  }
  document.getElementById('name-error').hidden = true;

  //  Устанавливаем для нашего героя характеристики
  hero.name = name;
  hero.class = isCheck("class-select").id;
  hero.src = isCheck("heroSelector").parentElement.lastChild.getAttribute('src');  //  относительный путь, чтобы сохранение не зависело от адреса сайта

  let heroClass = heroClasses[hero.class];
  hero.strength = heroClass.strength;
  hero.hp = heroClass.hp;
  hero.crit = heroClass.crit;
  hero.dodge = heroClass.dodge;
  hero.currentHp = hero.hp;
  hero.weapon = weapons[0];  //  Без оружия

  gameStatus.currentStage = 'st0';  //  новая игра всегда с начала
  gameStatus.flags = {};            //  и решения прошлого героя не в счёт
  renderHeroStatus();
  createHeroWindow.style.display = "none";
  updateGameField ();
  saveGame();
}
