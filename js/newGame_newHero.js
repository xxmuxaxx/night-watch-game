let flag = true;

function newGame () {
  newGameWindow.style.display = "none";

  let tetx = document.querySelector("#tempN1");

  if (flag) {
    for (var i = 0; i < heroFacesArray.length; i++) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      var img = document.createElement('img');
      label.setAttribute('for', 'char' + i);
      input.setAttribute('type', 'radio');
      input.setAttribute('name','heroSelector');
      input.setAttribute('id','char'+i);
      img.setAttribute('src', heroFacesArray[i]);
      tetx.appendChild(label);
      label.appendChild(input);
      label.appendChild(img);
      flag = false;
  
      if (i == 0) {
        input.setAttribute('checked', '');
      }
    }
  }
  document.querySelector("#create-hero-menu").style.display = "block";
}

function createNewHero () {
    //  Устанавливаем для нашего героя характеристики
    hero.name = document.querySelector("input[name='setHeroName']").value;
    hero.class = isCheck("class-select").id;
    hero.src = isCheck("heroSelector").parentElement.lastChild.src;

    if (hero.class == 'Warrior') {
        hero.strength = 2;
        hero.hp = 10;
    }
      else return false;
    
    hero.currentHp = hero.hp;
    hero.weapon = weapons[0];  //  Без оружия

    //  Отрисовываем меню героя
    document.querySelector(".hero-status__name").firstElementChild.innerHTML = hero.name;
    document.querySelector("#hero-status_img").firstElementChild.src = hero.src;
    document.querySelector("#hero-status_hp").innerHTML = 'Здоровье: ' + hero.currentHp + '/' + hero.hp;
    document.querySelector("#hero-status_class").innerHTML = 'Класс: ' + hero.class;

    if (hero.name) {
        createHeroWindow.style.display = "none";
        updateGameField ();
    } else if (!hero.name) {
        document.querySelector("#create-hero-menu").lastElementChild.style.display = "block";
    }
}