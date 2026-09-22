// 1 глава
//
// Сцена: img, actorImg (портрет собеседника, '' — нет), eTitle, description, menu.
// Пункт меню: text (строка или функция, возвращающая строку) и действие:
//   next: 'stX'                      — перейти в сцену stX
//   fight: { name, img, hp, damage: { min, max } }, next: 'stX'
//                                    — бой, после победы переход в stX, поражение — конец игры
//                                      (hp и damage необязательны: по умолчанию 10 и 0–2)
//   gameOver: true                   — конец игры, возврат в главное меню
// Пункт без действия ничего не делает (например, конец написанного сюжета).

let chapter1 = {
  st0: {
    img: 'img/scene-arrival.jpg',
    actorImg: '',
    eTitle: 'Вот и всё..',
    description: 'Ваша жизнь скоро закончится. И начнется новая...',
    menu: [
      { text: 'Подойти к воротам', next: 'st1' },
      { text: 'Попытаться убежать', next: 'st1_1' }]},
  st1: {
    img: 'img/scene-gate-guard.jpg',
    actorImg: '',
    eTitle: 'Стражник у ворот взглянул на вас',
    description: 'Стражник: Свежее мясо?! Открывай ворота, Стенли!',
    menu: [
      { text: 'Ждать...', next: 'st2' }]},
  st1_1: {
    img: 'img/scene-death.jpg',
    actorImg: '',
    eTitle: 'Вы ринулись, сломя голову, в сторону леса',
    description: 'очевидно, что это был не лучший выбор. Лучники на стенах не просто так получают свой пай. Вас пронзило 3 стрелы и вы упали на колени. В глазах темнело, дух покидал ваше тело...',
    menu: [
      { text: 'GameOver', gameOver: true }]},
  st2: {
    img: 'img/scene-outside-gate.jpg',
    actorImg: 'img/portrait-vasya.jpg',
    eTitle: 'К вам подошел агрессивно настроеный молодой человек...',
    description: 'МЧ: Слыш, ты что тут стоишь? ГГ: А, что? МЧ: Ах ты, щельмец! Сейчас ты у меня получишь!',
    menu: [
      { text: 'Приготовиться к драке', fight: { name: 'Вася', img: 'img/portrait-vasya.jpg', hp: 10, damage: { min: 0, max: 2 } }, next: 'st3' }]},
  st3: {
    img: 'img/scene-outside-gate.jpg',
    actorImg: '',
    eTitle: 'Молодой человек повалился на земь',
    description: 'Вы неплохо показали себя в этой драке, возможно будет круто всем люле давать. А-ХИ-ХИ-ХА-ХИ. Вы видите, что ворота открываются',
    menu: [
      { text: 'Направится к воротам', next: 'st4' },
      { text: 'Пук', next: 'st1_1' }]},
  st4: {
    img: 'img/scene-courtyard.jpg',
    actorImg: 'img/portrait-mentor.jpg',
    eTitle: 'Вы проходите ворота и попадаете во внутренний двор.',
    description: 'К вам подходит мужчина, с виду лет 30-35, в черном плаще и, добро улыбаясь, спрашивает: "Привет! Как тебя зовут?"',
    menu: [
      { text: () => 'Меня зовут <strong>' + hero.name + '</strong>' }]}
};
