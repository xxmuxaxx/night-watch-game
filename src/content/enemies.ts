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
  // Учебные бои на плацу (src/content/chapters/routine.ts): поражение не убивает.
  // Новобранец — разминка для любого героя.
  recruit: {
    name: 'Новобранец',
    portrait: 'img/portrait-recruit.jpg',
    hp: 8,
    damage: { min: 0, max: 2 },
    windup: 0.2,
    xp: 3,
  },
  // Вася на плацу злее, чем у ворот: бьёт сильнее и держит удар дольше.
  vasyaSpar: {
    name: 'Вася',
    portrait: 'img/portrait-vasya.jpg',
    hp: 12,
    damage: { min: 1, max: 3 },
    windup: 0.3,
    dodge: 0.1,
    xp: 6,
  },
  // Торвин учит парировать: кто только бьёт, почти не побеждает, кто ловит замах — побеждает чаще.
  torvin: {
    name: 'Торвин',
    portrait: 'img/portrait-mentor.jpg',
    hp: 22,
    damage: { min: 2, max: 4 },
    windup: 0.35,
    dodge: 0.2,
    xp: 15,
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
