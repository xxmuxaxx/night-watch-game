// Строки интерфейса и сообщения движка на русском. Это образец: английский словарь (en.ts)
// должен повторять его устройство, иначе не соберётся. Тексты сюжета — не здесь, а в src/content.
import type { Period } from '@/game/types';
import type { MessageFormats } from './types';

const PERIODS: Record<Period, string> = {
  morning: 'утро',
  day: 'день',
  evening: 'вечер',
  night: 'ночь',
};

const clock = (hour: number) => hour + ':00';

/** «1 ход», «2 хода», «5 ходов». */
function turns(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return n + ' ход';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return n + ' хода';
  return n + ' ходов';
}

const messages: MessageFormats = {
  xp: (m) => '+' + m.amount + ' опыта',
  levelUp: () => 'Новый уровень!',
  check: (m, n) => 'Проверка: ' + n.stat(m.stat) + ' — ' + (m.success ? 'успех' : 'провал'),
  itemUsed: (m, n) => 'Вы используете: ' + n.item(m.item) + ' (' + n.itemInfo(m.item) + ')',
  retry: () => 'Вы собираетесь с силами. Ещё одна попытка.',
  gotWeapon: (m, n) => 'Получено оружие: ' + n.weapon(m.weapon),
  gotArmor: (m, n) => 'Получена защита: ' + n.armor(m.armor),
  gotItem: (m, n) => 'В сумке: ' + n.item(m.item),
  journal: (m, n) => {
    const title = '«' + n.journal(m.entry) + '»';
    switch (m.change) {
      case 'goal':
        return 'Журнал: новая цель ' + title;
      case 'lead':
        return 'Журнал: новая зацепка ' + title;
      case 'note':
        return 'Журнал: новая запись в ' + title;
      case 'done':
        return 'Цель выполнена: ' + title;
    }
  },
  relation: (m, n) => n.npc(m.npc) + ': отношение ' + (m.better ? 'улучшилось' : 'ухудшилось'),
  slept: (m) =>
    'Вы проспали ' +
    m.hours +
    ' ч' +
    (m.woke ? ' и проснулись' : '') +
    (m.healed > 0 ? ' (+' + m.healed + ' здоровья)' : ''),

  move: (m, n) => 'Пойти: ' + n.location(m.to) + ' (' + m.minutes + ' мин)',
  travel: (m, n) => 'Путь: ' + n.location(m.to),
  back: () => 'Отойти',
  closed: () => 'Закрыто',
  hours: (m) => 'Только с ' + clock(m.hours[0]) + ' до ' + clock(m.hours[1]),
  wait: () => 'Подождать час',
  sleep: () => 'Лечь спать до утра',
  doneToday: () => 'Сегодня вы это уже делали',
  forFight: () => 'Пригодится в бою',
  fullHealth: () => 'Здоровье и так полное',

  defend: (m) => (m.parry ? 'Вы готовитесь парировать' : 'Вы встаёте в защиту'),
  hit: (m, n) =>
    (m.special ? n.special(m.special) + '! ' : m.crit ? 'Точный удар! ' : 'Вы бьёте: ') +
    n.enemy(m.enemy) +
    ' теряет ' +
    m.damage +
    ' здоровья' +
    (m.armor === 'held' ? ' (доспех держит удар)' : '') +
    (m.armor === 'pierced' ? ' (удар в щель доспеха)' : ''),
  enemyDodged: (m, n) => n.enemy(m.enemy) + ' уходит от удара',
  stunned: (m, n) =>
    (m.brokeWindup ? 'Вы сбиваете замах: ' : '') + n.enemy(m.enemy) + ' оглушён и пропускает удар',
  parried: (m, n) =>
    'Вы парируете сильный удар и бьёте в ответ: ' +
    n.enemy(m.enemy) +
    ' теряет ' +
    m.damage +
    ' здоровья',
  windup: (m, n) => n.enemy(m.enemy) + ' замахивается для сильного удара!',
  dodged: (m) => (m.heavy ? 'Вы уворачиваетесь от сильного удара!' : 'Вы уворачиваетесь от удара'),
  enemyHit: (m, n) =>
    n.enemy(m.enemy) +
    (m.heavy ? ' обрушивает сильный удар' : ' бьёт в ответ') +
    (m.defending ? ' по вашей защите' : '') +
    ': вы теряете ' +
    m.damage +
    ' здоровья',
  blocked: () => 'Вы принимаете удар на защиту и не теряете здоровья',
  enemyMissed: (m, n) => n.enemy(m.enemy) + ' промахивается',
  debugWin: () => '[отладка] победа',
};

export const ru = {
  /** Локаль для дат и чисел. */
  locale: 'ru-RU',
  /** «День 1 · 19:05 · вечер». */
  time: (day: number, clock: string, period: Period) =>
    `День ${day} · ${clock} · ${PERIODS[period]}`,
  turns,
  msg: messages,

  close: 'Закрыть',
  closeEsc: 'Закрыть (Esc)',
  empty: 'Пусто',

  menu: {
    subtitle: 'Северный рубеж',
    continue: 'Продолжить',
    newGame: 'Начать новую игру',
    load: 'Загрузить игру',
    settings: 'Настройки',
  },

  createHero: {
    title: 'Создайте своего героя',
    name: 'Имя',
    defaultName: 'Ивар',
    looks: 'Внешний вид',
    portrait: (i: number) => 'Портрет ' + i,
    class: 'Класс',
    health: 'Здоровье',
    special: (name: string, description: string) => `Приём «${name}»: ${description}`,
    oneLife: 'Одна жизнь.',
    oneLifeInfo: 'Смерть стирает сохранение, проигранный бой нельзя начать заново.',
    nameError: 'Введите имя героя!',
    start: 'Начать',
  },

  hero: {
    settings: 'Настройки (Esc)',
    classLevel: (title: string, level: number) => `${title}, уровень ${level}`,
    journal: 'Журнал',
    openJournal: 'Открыть журнал (J)',
    weapon: 'Оружие',
    armor: 'Защита',
    armorValue: (armor: number) => '−' + armor + ' урона',
    crit: 'Точный удар',
    dodge: 'Уклонение',
    special: 'Приём',
    bag: 'Сумка',
    use: 'Использовать',
    hp: (hp: number, maxHp: number) => `Здоровье: ${hp}/${maxHp}`,
    xp: (xp: number, next: number | null) =>
      next === null ? `Опыт: ${xp} (наибольший уровень)` : `Опыт: ${xp}/${next}`,
  },

  scene: {
    here: 'Здесь: ',
    /** Заголовки групп вариантов при свободном перемещении. */
    groups: { people: 'Люди', spots: 'Осмотреться', paths: 'Пути', time: 'Время' },
    new: 'новое',
  },

  map: {
    title: 'Карта крепости',
    open: 'Карта',
    openInfo: 'Карта крепости (M)',
    here: 'вы здесь',
    minutes: (minutes: number) => minutes + ' мин',
    new: 'ещё не были',
    locked: 'закрыто',
    go: (place: string, minutes: number) => `Идти: ${place} (${minutes} мин)`,
    busy: 'Сейчас не уйти: сначала закончите сцену.',
    legend: 'Щёлкните место, чтобы дойти туда. По дороге может что-то случиться.',
  },

  fight: {
    attack: 'Ударить',
    attackInfo: 'обычный удар',
    parry: 'Парировать',
    parryInfo: 'отбить сильный удар и ударить в ответ',
    defend: 'Защищаться',
    defendInfo: 'вдвое меньше урона',
    cooldown: (n: number) => 'через ' + turns(n),
    itemStun: 'Вместо удара; враг пропустит ход',
    itemPlain: 'Вместо удара; враг ответит',
    won: 'Вы победили',
    lost: 'Вы проиграли',
    yielded: 'Вы признали поражение',
    retry: 'Попробовать снова',
    giveUp: 'Сдаться',
    continue: 'Продолжить',
    enemyArmor: (armor: number) => 'доспех ' + armor + ': точный удар пробивает',
    enemyDodge: (chance: string) => 'увёртлив (' + chance + '): от приёма не уйдёт',
    intent: 'Готовит сильный удар! Защита его парирует',
  },

  journal: {
    title: 'Журнал',
    chronicle: 'Летопись',
    chronicleInfo: 'Прочитанное в этом сеансе (H)',
    goals: 'Цели',
    noGoals: 'Сейчас целей нет.',
    leads: 'Зацепки',
    noLeads: 'Пока ничего. Смотрите по сторонам и расспрашивайте людей.',
    people: 'Люди',
    done: ' — выполнено',
  },

  chronicle: {
    title: 'Летопись',
    journalInfo: 'Цели, зацепки и люди (J)',
    empty: 'Здесь будет всё, что вы прочитаете и выберете в этом сеансе игры.',
    fight: (enemy: string) => 'Бой: ' + enemy,
    win: 'Победа',
    lose: 'Поражение',
    retry: 'Поражение, ещё одна попытка',
  },

  levelUp: {
    title: 'Новый уровень!',
    subtitle: (name: string, level: number) =>
      `${name} достигает уровня ${level}. Выберите награду — вместе с ней здоровье восстановится полностью.`,
  },

  saves: {
    auto: 'Автосохранение',
    slot: (slot: number) => 'Ячейка ' + slot,
    writeHere: 'записать сюда',
    overwrite: 'перезаписать',
    hero: (name: string, className: string, level: number) =>
      `${name}, ${className.toLowerCase()} ${level} уровня`,
    oneLife: ' · одна жизнь',
    savedAt: (date: string) => 'Сохранено ' + date,
  },

  settings: {
    title: 'Настройки',
    language: 'Язык',
    text: 'Текст',
    fontSize: 'Размер шрифта',
    fontSizes: { small: 'Мелкий', normal: 'Обычный', large: 'Крупный' },
    sound: 'Звук',
    soundInfo: 'Звук: ветер, очаг, удары и сигналы',
    volume: 'Громкость',
    hints: 'Подсказки',
    showHints: 'Показывать подсказки для новичка',
    resetHints: 'Показать подсказки заново',
    game: 'Партия',
    autosave:
      'Игра сохраняется сама после каждого выбора. В ячейку можно сохраниться, чтобы потом вернуться к этому месту.',
    savedTo: (slot: number) => 'Сохранено в ячейку ' + slot,
    noSlotsOneLife: 'В режиме «Одна жизнь» сохраняться в ячейки нельзя.',
    noSlotsFight: 'Сейчас сохраниться в ячейку нельзя: сначала закончите бой.',
    exit: 'Выйти в главное меню',
  },

  hints: {
    parry:
      'Враг замахивается! Нажмите «Парировать» (2): защита целиком отведёт сильный удар, и вы ударите в ответ.',
    retry: 'Поражение — ещё не конец: можно попробовать бой снова с того места, где он начался.',
    journal: 'Цели и зацепки записываются в журнал: клавиша J или кнопка «Журнал» в панели героя.',
    roaming:
      'Теперь вы свободно ходите по крепости. Подходите к тому, что стоит в «Осмотреться», а дальние места ищите на карте (M). Время идёт: у людей свой распорядок, события случаются в свой час, а некоторые занятия можно делать раз в день.',
    bag: 'Предметы из сумки можно использовать в панели героя, а в бою — вместо удара (клавиша 4).',
    gotIt: 'Понятно',
  },
};

export type Dict = typeof ru;
