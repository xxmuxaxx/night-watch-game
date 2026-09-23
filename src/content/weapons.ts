import type { Weapon } from '@/game/types';

export const WEAPONS = {
  fists: { name: 'Без оружия', damage: { min: 0, max: 2 } },
  knife: { name: 'Старый нож', damage: { min: 1, max: 3 } },
  // старый нож после точильного камня
  sharpKnife: { name: 'Наточенный нож', damage: { min: 2, max: 4 } },
} as const satisfies Record<string, Weapon>;

export type WeaponId = keyof typeof WEAPONS;

export function weapon(id: WeaponId): Weapon {
  return WEAPONS[id];
}
