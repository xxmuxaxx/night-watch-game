// Правила игры на английском: классы, снаряжение, предметы, характеристики, враги, отношения
// и награды за уровень. Таблицы по идентификаторам — пропуск в них ошибка компиляции.
import type { ArmorId } from '@/content/armors';
import type { ClassId } from '@/content/classes';
import { CRIT_PER_WITS, DODGE_PER_AGILITY } from '@/content/combat';
import type { EnemyId } from '@/content/enemies';
import type { ItemId } from '@/content/items';
import type { WeaponId } from '@/content/weapons';
import type { StatId } from '@/game/types';
import type { ClassText, ItemText } from './types';

const pct = (value: number) => Math.round(value * 100) + '%';

export const CLASSES: Record<ClassId, ClassText> = {
  warrior: {
    title: 'Warrior',
    description: 'Tough and strong. Hits steadily and can take a blow.',
    special: {
      name: 'Mighty blow',
      description: 'double damage, the enemy misses its answer',
    },
  },
  rogue: {
    title: 'Rogue',
    description: 'Fragile but nimble: strikes precisely and slips away from blows.',
    special: {
      name: 'Sneak attack',
      description: 'a guaranteed precise strike',
    },
  },
};

export const WEAPONS: Record<WeaponId, string> = {
  fists: 'Bare hands',
  knife: 'Old knife',
  sharpKnife: 'Sharpened knife',
};

export const ARMORS: Record<ArmorId, string> = {
  none: 'No armor',
  jacket: 'Padded jacket',
};

export const ITEMS: Record<ItemId, ItemText> = {
  bread: { name: 'Crust of bread', description: '+3 health' },
  ash: { name: 'Handful of ash', description: 'into the enemy’s eyes: it misses a blow' },
  flask: { name: 'Flask of spirits', description: '+5 health' },
  torch: { name: 'Torch', description: 'easier to search in the dark' },
  whetstone: { name: 'Whetstone', description: 'sharpen the old knife: damage +1' },
  rope: { name: 'Rope with a hook', description: 'throw it up onto the wall' },
};

export const STATS: Record<StatId, string> = {
  strength: 'Strength',
  agility: 'Agility',
  wits: 'Wits',
};

export const ENEMIES: Record<EnemyId, string> = {
  vasya: 'Vasya',
  recruit: 'Recruit',
  vasyaSpar: 'Vasya',
  torvin: 'Torvin',
  wolf: 'Wolf',
  raider: 'Man in a dark cloak',
};

/** Уровни отношения в том же порядке, что ATTITUDES. */
export const ATTITUDES = [
  'trusts you',
  'likes you',
  'is sizing you up',
  'dislikes you',
  'is hostile',
];

/** Награды за уровень в том же порядке, что LEVEL_REWARDS. */
export const LEVEL_REWARDS = [
  '+1 Strength: damage +1',
  '+1 Agility: dodge +' + pct(DODGE_PER_AGILITY),
  '+1 Wits: precise strike +' + pct(CRIT_PER_WITS),
  '+3 health',
];
