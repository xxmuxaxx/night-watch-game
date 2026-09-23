import type { Item } from '@/game/types';

/**
 * Предметы для сумки. Используются вместо удара в бою (враг отвечает, если не оглушён),
 * а лечащие — ещё и из панели героя.
 */
export const ITEMS = {
  bread: { name: 'Краюха хлеба', description: '+3 здоровья', heal: 3 },
  ash: { name: 'Горсть золы', description: 'в глаза врагу: пропустит удар', stun: true },
} as const satisfies Record<string, Item>;

export type ItemId = keyof typeof ITEMS;

export function item(id: ItemId): Item {
  return ITEMS[id];
}
