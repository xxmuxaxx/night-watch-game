import type { HeroClass } from '@/game/types';

/** Классы героя. Карточки на экране создания героя строятся из этой таблицы. */
export const HERO_CLASSES = {
  warrior: {
    title: 'Воин',
    description: 'Крепкий и сильный. Бьёт стабильно и держит удар.',
    maxHp: 10,
    stats: { strength: 2, agility: 1, wits: 1 },
    crit: 0,
    dodge: 0,
    special: {
      name: 'Мощный удар',
      description: 'двойной урон, враг пропускает ответный удар',
      cooldown: 3,
      damage: 2,
      stun: true,
    },
  },
  rogue: {
    title: 'Разбойник',
    description: 'Хрупкий, но ловкий: бьёт точно и уходит от ударов.',
    maxHp: 8,
    stats: { strength: 1, agility: 3, wits: 2 },
    crit: 0.3,
    dodge: 0.25,
    special: {
      name: 'Подлый удар',
      description: 'гарантированный точный удар',
      cooldown: 2,
      crit: true,
    },
  },
} as const satisfies Record<string, HeroClass>;

export type ClassId = keyof typeof HERO_CLASSES;

export const CLASS_IDS = Object.keys(HERO_CLASSES) as ClassId[];

export function heroClass(id: ClassId): HeroClass {
  return HERO_CLASSES[id];
}
