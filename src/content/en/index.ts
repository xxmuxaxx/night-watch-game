// Английский перевод контента. Русский контент — основной; как перевод сопоставляется с ним,
// описано в src/i18n/content.ts.
import { chapter1 } from './chapter1';
import { routine, ROUTINE } from './routine';
import { ARMORS, ATTITUDES, CLASSES, ENEMIES, ITEMS, LEVEL_REWARDS, STATS, WEAPONS } from './rules';
import { JOURNAL } from './journal';
import type { SceneText } from './types';
import { LOCATIONS, NPCS } from './world';

const scenes: Record<string, SceneText> = { ...chapter1, ...routine };

export const EN = {
  scenes,
  routine: ROUTINE,
  locations: LOCATIONS,
  npcs: NPCS,
  journal: JOURNAL,
  classes: CLASSES,
  weapons: WEAPONS,
  armors: ARMORS,
  items: ITEMS,
  stats: STATS,
  enemies: ENEMIES,
  attitudes: ATTITUDES,
  levelRewards: LEVEL_REWARDS,
};
