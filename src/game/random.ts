import type { Range, Rng } from './types';

/** Целое число из диапазона включительно. */
export function randomInt(rng: Rng, range: Range): number {
  return Math.floor(rng() * (range.max - range.min + 1)) + range.min;
}

/** Случилось ли событие с вероятностью chance. */
export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}
