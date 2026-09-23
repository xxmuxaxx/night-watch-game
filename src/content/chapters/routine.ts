// Распорядок крепости: занятия раз в день (daily), которые не относятся к одной главе.
// Варианты стоят у точек интереса (src/content/locations.ts: ROUTINE), здесь — сцены после них.
// Вне своих часов занятие видно закрытым с часами (showClosed).
import type { Choice, Scene } from '@/game/types';
import { ENEMIES } from '../enemies';

/**
 * Занятия: плац и жаровня во дворе, кухня и очаг в трапезной. На плацу ещё учебные бои (lose):
 * поражение не убивает, а ведёт в свою сцену. Васю и Торвина можно позвать, когда они расположены
 * к герою; первая победа над Торвином поднимает его отношение (дальше — обычная сцена).
 */
export const ROUTINE = {
  training: {
    text: 'Тренироваться с новобранцами (2 ч, +5 опыта)',
    hours: [8, 17],
    showClosed: true,
    daily: 'training',
    minutes: 120,
    xp: 5,
    next: 'routine_training',
  },
  brazier: {
    text: 'Погреться у жаровни с часовыми (1 ч, +2 здоровья)',
    hours: [19, 23],
    showClosed: true,
    daily: 'brazier',
    minutes: 60,
    heal: 2,
    next: 'routine_brazier',
  },
  kitchen: {
    text: 'Помочь повару на кухне (1,5 ч, еда в сумку)',
    hours: [9, 17],
    showClosed: true,
    daily: 'kitchen',
    minutes: 90,
    give: { items: ['bread'] },
    next: 'routine_kitchen',
  },
  sparRecruit: {
    text: 'Учебный бой с новобранцем (20 мин)',
    hours: [8, 17],
    showClosed: true,
    daily: 'sparRecruit',
    minutes: 20,
    fight: ENEMIES.recruit,
    next: 'spar_recruit_win',
    lose: 'spar_recruit_lose',
  },
  sparVasya: {
    text: 'Позвать Васю на учебный бой (20 мин)',
    hours: [8, 17],
    ifRelation: { npc: 'vasya', min: 1 },
    daily: 'sparVasya',
    minutes: 20,
    fight: ENEMIES.vasyaSpar,
    next: 'spar_vasya_win',
    lose: 'spar_vasya_lose',
  },
  sparTorvinFirst: {
    text: 'Попросить Торвина об учебном бое (20 мин)',
    hours: [8, 17],
    ifRelation: { npc: 'torvin', min: 1 },
    ifNot: 'beatTorvin',
    daily: 'sparTorvin',
    minutes: 20,
    fight: ENEMIES.torvin,
    next: 'spar_torvin_first',
    lose: 'spar_torvin_lose',
  },
  sparTorvin: {
    text: 'Попросить Торвина об учебном бое (20 мин)',
    hours: [8, 17],
    ifRelation: { npc: 'torvin', min: 1 },
    if: 'beatTorvin',
    daily: 'sparTorvin',
    minutes: 20,
    fight: ENEMIES.torvin,
    next: 'spar_torvin_win',
    lose: 'spar_torvin_lose',
  },
  ash: {
    text: 'Набрать золы из очага (в бою — в глаза врагу)',
    daily: 'ash',
    minutes: 10,
    give: { items: ['ash'] },
    next: 'routine_ash',
  },
} satisfies Record<string, Choice>;

export type RoutineId = keyof typeof ROUTINE;

/** Байки у жаровни: каждый вечер своя. */
const BRAZIER_RUMORS = [
  'Кто-то рассказывает байку про медведя, который однажды забрёл к самым воротам и ушёл с поварским котлом.',
  'Часовые вполголоса спорят, правда ли прошлой весной на перевале нашли сани с грузом, но без лошадей и без возницы.',
  'Старый часовой ворчит, что кот Сотник ест лучше новобранцев, и никто с ним не спорит.',
];

export const routine: Record<string, Scene> = {
  routine_training: {
    image: 'img/scene-drill.jpg',
    title: 'Тренировка',
    text: ({ hero, relation }) =>
      'Два часа деревянных мечей, окриков старших и мокрого снега за шиворотом. ' +
      (hero.classId === 'rogue'
        ? 'Вы больше уворачиваетесь, чем бьёте, и один из старших одобрительно хмыкает.'
        : 'Руки гудят, но удар с каждым разом ложится увереннее.') +
      (relation('vasya') >= 1
        ? '\nВася встаёт с вами в пару и честно пытается не бить в лицо.'
        : ''),
    choices: [{ text: 'Перевести дух', leave: true }],
  },
  // --- Учебные бои на плацу ---
  spar_recruit_win: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-recruit.jpg',
    title: 'Учебный бой',
    text: 'Долговязый веснушчатый новобранец пыхтит, наседает, но быстро выдыхается. Вы выбиваете у него меч, и он, отдуваясь, поднимает руки.\n— Всё, всё! Твоя взяла.',
    choices: [{ text: 'Перевести дух', leave: true }],
  },
  spar_recruit_lose: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-recruit.jpg',
    title: 'На снегу',
    text: 'Долговязый новобранец оказывается проворнее, чем выглядит. Удар по рёбрам — и вы на снегу, хватаете ртом воздух.\n— Живой? — Он протягивает руку. — Завтра отыграешься.',
    choices: [{ text: 'Подняться', leave: true }],
  },
  spar_vasya_win: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-vasya.jpg',
    title: 'Ну ты даёшь',
    text: ({ flag }) =>
      '— Ну ты даёшь! — Вася сидит в снегу и смеётся, потирая плечо. ' +
      (flag('trippedVasya')
        ? '— Опять эта твоя подсечка? Ничего, я её ещё раскушу.'
        : '— Ладно, сегодня твоя взяла. Завтра — моя.'),
    choices: [{ text: 'Помочь ему встать', leave: true }],
  },
  spar_vasya_lose: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-vasya.jpg',
    title: 'Без обид',
    text: 'Вася, страшно довольный, помогает вам подняться.\n— Не обижайся, новенький. Ты, когда замахиваешься, весь открываешься — я сразу вижу. Завтра ещё раз?',
    choices: [{ text: 'Подняться', leave: true }],
  },
  spar_torvin_first: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-mentor.jpg',
    set: { beatTorvin: true },
    relation: { torvin: 1 },
    title: 'На что-то похоже',
    text: 'Торвин отступает на шаг, опускает меч и смотрит на вас по-новому.\n— Вот это уже на что-то похоже. — Он хлопает вас по плечу так, что вы едва не садитесь в снег. — Кто учил? Ладно, не отвечай: прошлое за воротами.\nНовобранцы вокруг притихли: Торвина на плацу валят нечасто.',
    choices: [{ text: 'Перевести дух', leave: true }],
  },
  spar_torvin_win: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-mentor.jpg',
    title: 'Неплохо',
    text: 'Торвин опускает меч и одобрительно кивает.\n— Неплохо. Но не зазнавайся: в лесу противник не остановится оттого, что ты победил.',
    choices: [{ text: 'Перевести дух', leave: true }],
  },
  spar_torvin_lose: {
    image: 'img/scene-drill.jpg',
    actor: 'img/portrait-mentor.jpg',
    title: 'Лицом в снег',
    text: 'Мир переворачивается, и вы оказываетесь лицом в снегу. Торвин стоит над вами и даже не запыхался.\n— Ждёшь удара, а надо ждать замаха. Видишь, как я отвожу плечо? Тогда закрывайся — и бей в ответ. — Он протягивает руку. — Завтра ещё раз.',
    choices: [{ text: 'Подняться', leave: true }],
  },
  routine_kitchen: {
    image: 'img/scene-kitchen.jpg',
    actor: 'img/portrait-cook.jpg',
    title: 'Кухня',
    text: 'Полтора часа вы чистите репу и таскаете воду. Повар, красный и злой, под конец всё-таки суёт вам краюху хлеба:\n— Заслужил. Остальным не говори.',
    choices: [{ text: 'Вернуться в зал', leave: true }],
  },
  routine_ash: {
    image: 'img/scene-hall.jpg',
    title: 'Зола',
    text: 'Вы набираете в тряпицу горсть остывшей золы. Старый трактирный приём: швырни её в глаза — и противник на миг ослепнет.',
    choices: [{ text: 'Отойти от очага', leave: true }],
  },
  routine_brazier: {
    image: 'img/scene-brazier.jpg',
    title: 'У жаровни',
    text: ({ flag, time }) =>
      'Часовые молча подвигаются, пуская вас к огню. Угли потрескивают, по рукам разливается тепло.\n' +
      (flag('sawLights') && time.day === 2
        ? 'Один из часовых, заметив, как вы смотрите на лес, негромко говорит: «Не гляди туда подолгу. Кто глядит — того и видят».'
        : (BRAZIER_RUMORS[time.day % BRAZIER_RUMORS.length] ?? '')),
    choices: [{ text: 'Пойти дальше', leave: true }],
  },
};
