import type { Item } from '@/game/types';

/**
 * Предметы для сумки. Лечащие и оглушающие используются вместо удара в бою (враг отвечает, если
 * не оглушён), лечащие — ещё и из панели героя. Точильный камень улучшает оружие вне боя, а факел
 * и верёвка не тратятся: факел облегчает проверки в темноте, верёвка открывает путь на стену.
 */
export const ITEMS = {
  bread: { name: 'Краюха хлеба', description: '+3 здоровья', heal: 3 },
  ash: { name: 'Горсть золы', description: 'в глаза врагу: пропустит удар', stun: true },
  flask: { name: 'Фляга с настойкой', description: '+5 здоровья', heal: 5 },
  torch: { name: 'Факел', description: 'в темноте искать легче', light: true },
  whetstone: {
    name: 'Точильный камень',
    description: 'наточить старый нож: урон +1',
    sharpen: { from: 'knife', to: 'sharpKnife' },
  },
  rope: { name: 'Верёвка с крюком', description: 'забросить на стену' },
} as const satisfies Record<string, Item>;

export type ItemId = keyof typeof ITEMS;

export function item(id: ItemId): Item {
  return ITEMS[id];
}
