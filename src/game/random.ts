import type { Range, Rng } from './types';

/** Целое число из диапазона включительно. */
export function randomInt(rng: Rng, range: Range): number {
  return Math.floor(rng() * (range.max - range.min + 1)) + range.min;
}

/** Случилось ли событие с вероятностью chance. */
export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

/**
 * Генератор с зерном (mulberry32): одно и то же зерно — одна и та же последовательность.
 * Нужен инструменту баланса, чтобы цифры не прыгали от запуска к запуску.
 */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
