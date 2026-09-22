import type { Weapon } from '@/game/types';

export const WEAPONS = {
  fists: { name: 'Без оружия', damage: { min: 0, max: 2 } },
} as const satisfies Record<string, Weapon>;

export type WeaponId = keyof typeof WEAPONS;

export function weapon(id: WeaponId): Weapon {
  return WEAPONS[id];
}
