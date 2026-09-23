import { hasLight } from './hero';
import { chance } from './random';
import type { Hero, Notice, Rng, StatCheck } from './types';

/** Проверка в темноте, а у героя есть свет: она на 1 легче. */
export function lightHelps(hero: Hero, check: StatCheck): boolean {
  return check.dark === true && hasLight(hero);
}

/**
 * 50% + 15% за каждое очко характеристики сверх сложности, от 5% до 95%. Свет в темноте
 * снижает сложность на 1.
 */
export function checkChance(hero: Hero, check: StatCheck): number {
  const difficulty = check.difficulty - (lightHelps(hero, check) ? 1 : 0);
  const value = 0.5 + 0.15 * (hero.stats[check.stat] - difficulty);
  return Math.min(0.95, Math.max(0.05, value));
}

export function rollCheck(
  hero: Hero,
  check: StatCheck,
  rng: Rng,
): { success: boolean; notice: Notice } {
  const success = chance(rng, checkChance(hero, check));
  return {
    success,
    notice: {
      tone: success ? 'success' : 'fail',
      message: { id: 'check', stat: check.stat, success },
    },
  };
}
