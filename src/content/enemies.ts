// Бестиарий: враги, с которыми герой дерётся в сюжете ({ fight: ENEMIES.vasya, next }).
// Инструмент баланса (панель отладки) прогоняет бои со всеми врагами отсюда.
// Портреты — квадратные, как у героев; подсказки для генерации — в docs/image-prompts.md.
import type { EnemyDef } from '@/game/types';

export const ENEMIES = {
  // Глава 1: задира у ворот. Часто замахивается — хороший повод научиться парировать.
  vasya: {
    name: 'Вася',
    portrait: 'img/portrait-vasya.jpg',
    hp: 10,
    damage: { min: 0, max: 2 },
    windup: 0.3,
  },
  // Для главы 2: быстрый и вёрткий, бьёт часто, но слабо, от удара уходит.
  wolf: {
    name: 'Волк',
    portrait: 'img/portrait-wolf.jpg',
    hp: 10,
    damage: { min: 1, max: 3 },
    dodge: 0.3,
    xp: 12,
  },
  // Для главы 2: в кожаном доспехе — обычные удары вязнут, точные находят щель.
  raider: {
    name: 'Человек в тёмном плаще',
    portrait: 'img/portrait-raider.jpg',
    hp: 16,
    damage: { min: 1, max: 4 },
    armor: 1,
    windup: 0.25,
    xp: 20,
  },
} as const satisfies Record<string, EnemyDef>;

export type EnemyId = keyof typeof ENEMIES;
