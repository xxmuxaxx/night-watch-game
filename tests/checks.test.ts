import { describe, expect, it } from 'vitest';
import { checkChance, rollCheck } from '@/game/checks';
import { constant, testHero } from './helpers';

describe('checkChance', () => {
  it('50% при характеристике, равной сложности, и ±15% за очко', () => {
    const rogue = testHero('rogue'); // сила 1, ловкость 3, чутьё 2
    expect(checkChance(rogue, { stat: 'wits', difficulty: 2 })).toBeCloseTo(0.5);
    expect(checkChance(rogue, { stat: 'agility', difficulty: 2 })).toBeCloseTo(0.65);
    expect(checkChance(rogue, { stat: 'strength', difficulty: 2 })).toBeCloseTo(0.35);
  });

  it('не выходит за 5–95%', () => {
    const hero = testHero();
    expect(checkChance(hero, { stat: 'strength', difficulty: -10 })).toBe(0.95);
    expect(checkChance(hero, { stat: 'strength', difficulty: 10 })).toBe(0.05);
  });
});

describe('rollCheck', () => {
  it('успех, когда бросок меньше шанса', () => {
    expect(rollCheck(testHero(), { stat: 'strength', difficulty: 2 }, constant(0.49))).toEqual({
      success: true,
      notice: { tone: 'success', message: { id: 'check', stat: 'strength', success: true } },
    });
    expect(rollCheck(testHero(), { stat: 'strength', difficulty: 2 }, constant(0.5)).success).toBe(
      false,
    );
  });
});
