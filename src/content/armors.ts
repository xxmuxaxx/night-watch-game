import type { Armor } from '@/game/types';

/** Защита героя: снимает свою долю урона с каждого удара врага. Надевается сразу при получении. */
export const ARMORS = {
  none: { name: 'Без защиты', armor: 0 },
  jacket: { name: 'Стёганка', armor: 1 },
} as const satisfies Record<string, Armor>;

export type ArmorId = keyof typeof ARMORS;

export function armor(id: ArmorId): Armor {
  return ARMORS[id];
}
