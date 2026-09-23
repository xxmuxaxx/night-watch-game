import type { Item } from '@/game/types';

/** Предметы для сумки. Используются из панели героя или в бою (вместо удара, враг отвечает). */
export const ITEMS = {
  bread: { name: 'Краюха хлеба', description: '+3 здоровья', heal: 3 },
} as const satisfies Record<string, Item>;

export type ItemId = keyof typeof ITEMS;

export function item(id: ItemId): Item {
  return ITEMS[id];
}
