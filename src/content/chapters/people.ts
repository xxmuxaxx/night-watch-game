// Люди крепости без сюжетной роли: повар Ульф и новобранец Мирко (src/content/npcs.ts), их
// темы разговоров и маленькие дела — ключ от кладовой, кости в казарме, угощение для часового.
// Каждый из них добавляет по детали к пропавшим новобранцам, но сюжет дальше не двигает.
// Отношения: вернувший ключ нравится повару (+1), один раз — ключ находится один.
import type { Image, Scene } from '@/game/types';

const COOK = 'img/portrait-cook.jpg';
const MIRKO = 'img/portrait-recruit.jpg';
const KITCHEN = 'img/scene-kitchen.jpg';

/** Где сейчас Мирко: днём на плацу, вечером в трапезной, перед сном в казарме. */
const MIRKO_PLACE: Image = ({ location }) =>
  location === 'hall'
    ? 'img/scene-hall.jpg'
    : location === 'barracks'
      ? 'img/scene-barracks.jpg'
      : 'img/scene-drill.jpg';

/** Что на ужин: каждый день своё. */
const SUPPERS = [
  'Похлёбка с репой. Вчера была похлёбка с репой, и завтра будет. Кто недоволен — ешь снег.',
  'Каша с салом. Сала мало, каши много. Радуйся.',
  'Рыба. Солёная, с прошлой осени. Пить потом будешь до утра — вот тебе и занятие.',
];

export const people: Record<string, Scene> = {
  // --- Ульф, повар ---
  // metCook ставят варианты, а не сцена: иначе первая встреча читалась бы как повторная
  cook_talk: {
    image: KITCHEN,
    actor: COOK,
    title: 'Повар',
    text: ({ flag }) =>
      flag('metCook')
        ? '— Чего тебе? — Ульф не отрывается от котла.'
        : 'Повар, красный от жара, оборачивается от котла и тычет в вас половником.\n— Ульф. Кухня моя, котлы мои, хлеб мой. Руки мыл?',
    choices: [
      {
        text: 'Что сегодня на ужин?',
        topic: 'cook.supper',
        set: { metCook: true },
        minutes: 5,
        next: 'cook_supper',
      },
      {
        text: 'Что это за рыжий ворюга?',
        topic: 'cook.cat',
        if: 'sawCat',
        set: { metCook: true },
        minutes: 5,
        next: 'cook_cat',
      },
      {
        text: 'Может, помочь чем?',
        topic: 'cook.help',
        ifNot: 'cookAskedKey',
        set: { metCook: true, cookAskedKey: true },
        minutes: 5,
        next: 'cook_key',
      },
      {
        text: 'Вот ваш ключ от кладовой',
        topic: 'cook.key',
        if: 'foundKey',
        ifNot: 'returnedKey',
        set: { returnedKey: true },
        relation: { cook: 1 },
        give: { items: ['bread', 'bread'] },
        xp: 10,
        minutes: 5,
        next: 'cook_key_return',
      },
      {
        text: 'Эрик ничего у тебя не брал перед дозором?',
        topic: 'cook.erik',
        if: 'returnedKey',
        set: { cookErik: true },
        minutes: 10,
        next: 'cook_erik',
      },
      { text: 'Ничего, не буду мешать', set: { metCook: true }, leave: true },
    ],
  },
  cook_supper: {
    image: KITCHEN,
    actor: COOK,
    title: 'Ужин',
    text: ({ time }) =>
      '— На ужин? — Ульф хмыкает. — ' + (SUPPERS[time.day % SUPPERS.length] ?? ''),
    choices: [{ text: 'Понятно', next: 'cook_talk' }],
  },
  cook_cat: {
    image: KITCHEN,
    actor: COOK,
    title: 'Сотник',
    text: '— Рыжий? Это Сотник. — Ульф почти улыбается. — Главный тут он, а не старшие. Мышей ловит, колбасу ворует. Равновесие. Прогонишь его — мыши сожрут всю крупу к весне.',
    choices: [{ text: 'Понятно', next: 'cook_talk' }],
  },
  cook_key: {
    image: KITCHEN,
    actor: COOK,
    title: 'Ключ от кладовой',
    text: '— Помочь? — Ульф смотрит на вас с подозрением, потом машет половником. — А помоги. Ключ от кладовой пропал. Вешал на гвоздь у очага, как всегда, а утром гвоздь пустой. Кто взял — голову оторву. Найдёшь — не обижу.',
    choices: [{ text: 'Поищу', next: 'cook_talk' }],
  },
  cook_key_return: {
    image: KITCHEN,
    actor: COOK,
    title: 'Нашёлся',
    text: '— В золе? — Ульф вертит ключ, сдувает с него пепел. — Сотник, паршивец, опять по полкам лазил. — Он прячет ключ за пазуху и отламывает вам две краюхи. — Держи. И заходи, если что. Для тебя, может, и сало найдётся.',
    choices: [{ text: 'Спасибо', next: 'cook_talk' }],
  },
  cook_erik: {
    image: KITCHEN,
    actor: COOK,
    title: 'Сухари',
    text: '— Эрик? — Ульф перестаёт мешать. — Брал. За день до дозора выпросил сухарей — на троих, на три дня. Я ещё посмеялся: на одну ночь столько не берут. А он говорит: мало ли, заплутаем.\nОн снова берётся за половник.\n— Заплутали, значит.',
    choices: [{ text: 'Понятно', next: 'cook_talk' }],
  },

  // --- Очаг в трапезной: ключ в золе ---
  hearth_key: {
    image: 'img/scene-hall.jpg',
    title: 'В золе',
    text: 'Вы разгребаете остывшую золу под решёткой, и пальцы натыкаются на что-то холодное: большой железный ключ с кольцом. Видно, упал с гвоздя — или ему помогли.',
    choices: [{ text: 'Отряхнуть руки', leave: true }],
  },
  hearth_nothing: {
    image: 'img/scene-hall.jpg',
    title: 'Одна зола',
    text: 'Вы перебираете золу, пока руки не становятся серыми по локоть, но находите только гвозди да обгорелую кость. Может, стоит поискать внимательнее.',
    choices: [{ text: 'Отряхнуть руки', leave: true }],
  },

  // --- Мирко, новобранец с плаца ---
  mirko_talk: {
    image: MIRKO_PLACE,
    actor: MIRKO,
    title: 'Мирко',
    text: ({ flag }) =>
      flag('metMirko')
        ? 'Мирко расплывается в щербатой улыбке: — О, это ты!'
        : 'Долговязый веснушчатый новобранец с плаца протягивает вам руку.\n— Мирко. А ты новенький, я видел, как тебя привезли. Ничего, тут привыкают.',
    choices: [
      {
        text: 'Откуда ты?',
        topic: 'mirko.self',
        set: { metMirko: true },
        minutes: 5,
        next: 'mirko_self',
      },
      {
        text: 'Чем тут вечерами занимаются?',
        topic: 'mirko.dice',
        set: { metMirko: true },
        minutes: 5,
        next: 'mirko_dice',
      },
      // о пропавших можно узнать с доски нарядов или от Васи
      {
        text: 'Ты знал Эрика и Мартина?',
        topic: 'mirko.missing',
        if: 'readBoard',
        set: { metMirko: true, mirkoMartin: true },
        minutes: 10,
        next: 'mirko_martin',
      },
      {
        text: 'Ты знал Эрика и Мартина?',
        topic: 'mirko.missing',
        if: 'vasyaFriend',
        ifNot: 'readBoard',
        set: { metMirko: true, mirkoMartin: true },
        minutes: 10,
        next: 'mirko_martin',
      },
      { text: 'Бывай', set: { metMirko: true }, leave: true },
    ],
  },
  mirko_self: {
    image: MIRKO_PLACE,
    actor: MIRKO,
    title: 'Из долины',
    text: '— Из долины, с хутора у мельницы. — Мирко пожимает плечами. — Отец задолжал лорду, а платить нечем. Брату жениться, мне — в стражу. — Он улыбается шире. — Зато кормят. Дома зимой не каждый день кормили.',
    choices: [{ text: 'Ясно', next: 'mirko_talk' }],
  },
  mirko_dice: {
    image: MIRKO_PLACE,
    actor: MIRKO,
    title: 'Кости',
    text: '— Вечерами? В казарме кости мечут, после ужина, пока старшие не разгонят. Банкует Хромой Йорген, играют на хлеб. — Мирко понижает голос. — Только следи за его руками. Кто следит — тот иногда и выигрывает.',
    choices: [{ text: 'Ясно', next: 'mirko_talk' }],
  },
  mirko_martin: {
    image: MIRKO_PLACE,
    actor: MIRKO,
    title: 'Письма',
    text: 'Улыбка Мирко гаснет.\n— Мартин обещал научить меня грамоте. Мы начали даже — буквы на снегу палкой. — Он молчит. — Он всё кому-то писал. Вечерами, при лучине. Я спросил кому, а он: «Тем, кто ждёт». Отсюда ведь писем не шлют, гонец раз в месяц, и тот не ходит зимой.',
    choices: [{ text: 'Ясно', next: 'mirko_talk' }],
  },

  // --- Казарма: кости на хлеб ---
  dice_win: {
    image: 'img/scene-dice.jpg',
    title: 'Шестёрки',
    text: 'Вы не сводите глаз с рук Хромого Йоргена, и на третьем броске он не успевает подменить кости. Две шестёрки. Йорген кривится, но отодвигает к вам две краюхи: при свидетелях не отопрёшься.',
    choices: [{ text: 'Спрятать выигрыш', leave: true }],
  },
  dice_lose: {
    image: 'img/scene-dice.jpg',
    title: 'Единицы',
    text: 'Кости катятся, стукаются о край ящика и ложатся единицами вверх. Хромой Йорген с довольным видом сгребает вашу краюху.\n— Бывает, новенький. Завтра отыграешься.',
    choices: [{ text: 'Отойти', leave: true }],
  },

  // --- Лестница на стену: часовой за настойку пускает наверх ---
  wall_bribe: {
    image: 'img/scene-wall.jpg',
    location: 'wall',
    title: 'Угощение',
    text: 'Часовой долго смотрит на флягу, потом на вас, потом снова на флягу.\n— Ну… ненадолго. И я тебя не видел.\nОн отхлёбывает и отворачивается к стене. Вы поднимаетесь по лестнице. Наверху никого — только ветер.',
    choices: [{ text: 'Осмотреться', leave: true }],
  },
};
