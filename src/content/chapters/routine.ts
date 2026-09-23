// Распорядок крепости: занятия раз в день (daily), которые не относятся к одной главе.
// Варианты лежат в действиях локаций (src/content/locations.ts: ROUTINE), здесь — сцены после них.
import type { Choice, Scene } from '@/game/types';

/** Занятия по локациям: вставляются в actions двора и трапезной. */
export const ROUTINE = {
  courtyard: [
    {
      text: 'Тренироваться с новобранцами (2 ч, +5 опыта)',
      hours: [8, 17],
      daily: 'training',
      minutes: 120,
      xp: 5,
      next: 'routine_training',
    },
    {
      text: 'Погреться у жаровни с часовыми (1 ч, +2 здоровья)',
      hours: [19, 23],
      daily: 'brazier',
      minutes: 60,
      heal: 2,
      next: 'routine_brazier',
    },
  ],
  hall: [
    {
      text: 'Помочь повару на кухне (1,5 ч, еда в сумку)',
      hours: [9, 17],
      daily: 'kitchen',
      minutes: 90,
      give: { items: ['bread'] },
      next: 'routine_kitchen',
    },
    {
      text: 'Набрать золы из очага (в бою — в глаза врагу)',
      daily: 'ash',
      minutes: 10,
      give: { items: ['ash'] },
      next: 'routine_ash',
    },
  ],
} satisfies Record<string, Choice[]>;

export const routine: Record<string, Scene> = {
  routine_training: {
    image: 'img/scene-courtyard.jpg',
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
  routine_kitchen: {
    image: 'img/scene-hall.jpg',
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
    image: 'img/scene-courtyard.jpg',
    title: 'У жаровни',
    text: ({ flag }) =>
      'Часовые молча подвигаются, пуская вас к огню. Угли потрескивают, по рукам разливается тепло.\n' +
      (flag('sawLights')
        ? 'Один из часовых, заметив, как вы смотрите на лес, негромко говорит: «Не гляди туда подолгу. Кто глядит — того и видят».'
        : 'Кто-то рассказывает байку про медведя, который однажды забрёл к самым воротам и ушёл с поварским котлом.'),
    choices: [{ text: 'Пойти дальше', leave: true }],
  },
};
