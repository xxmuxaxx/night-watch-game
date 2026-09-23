import { LEVEL_XP } from '@/content/progression';
import type { Hero, LevelReward } from './types';

export const MAX_LEVEL = LEVEL_XP.length;

/** Уровень, которого достигает герой с таким опытом. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= (LEVEL_XP[level] ?? Infinity)) level++;
  return level;
}

/** Опыт для следующего уровня или null на наибольшем уровне. */
export function nextLevelXp(level: number): number | null {
  return LEVEL_XP[level] ?? null;
}

/** Начислить опыт. Каждое повышение уровня добавляет одну невыбранную награду (levelUps). */
export function addXp(hero: Hero, amount: number): Hero {
  if (amount <= 0) return hero;
  const xp = hero.xp + amount;
  const level = levelForXp(xp);
  return { ...hero, xp, level, levelUps: hero.levelUps + (level - hero.level) };
}

/** Выбрать награду за уровень: +1 к характеристике или к максимуму здоровья, плюс полное лечение. */
export function applyLevelReward(hero: Hero, reward: LevelReward): Hero {
  if (hero.levelUps <= 0) return hero;
  const stats =
    'stat' in reward ? { ...hero.stats, [reward.stat]: hero.stats[reward.stat] + 1 } : hero.stats;
  const maxHp = 'maxHp' in reward ? hero.maxHp + reward.maxHp : hero.maxHp;
  return { ...hero, stats, maxHp, hp: maxHp, levelUps: hero.levelUps - 1 };
}
