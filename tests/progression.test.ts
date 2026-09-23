import { describe, expect, it } from 'vitest';
import { LEVEL_XP } from '@/content/progression';
import { addXp, applyLevelReward, levelForXp, MAX_LEVEL, nextLevelXp } from '@/game/progression';
import { testHero } from './helpers';

describe('levelForXp', () => {
  it('уровень по порогам LEVEL_XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(19)).toBe(1);
    expect(levelForXp(20)).toBe(2);
    expect(levelForXp(49)).toBe(2);
    expect(levelForXp(50)).toBe(3);
  });

  it('не выше наибольшего уровня', () => {
    expect(levelForXp(1_000_000)).toBe(MAX_LEVEL);
    expect(nextLevelXp(MAX_LEVEL)).toBeNull();
    expect(nextLevelXp(1)).toBe(LEVEL_XP[1]);
  });
});

describe('addXp', () => {
  it('копит опыт без нового уровня', () => {
    expect(addXp(testHero(), 5)).toMatchObject({ xp: 5, level: 1, levelUps: 0 });
  });

  it('несколько уровней сразу — несколько невыбранных наград', () => {
    expect(addXp(testHero(), 55)).toMatchObject({ xp: 55, level: 3, levelUps: 2 });
  });

  it('ноль опыта ничего не меняет', () => {
    const hero = testHero();
    expect(addXp(hero, 0)).toBe(hero);
  });
});

describe('applyLevelReward', () => {
  it('без невыбранной награды ничего не делает', () => {
    const hero = testHero();
    expect(applyLevelReward(hero, { stat: 'wits' })).toBe(hero);
  });

  it('+1 к характеристике и полное лечение', () => {
    const hero = testHero('rogue', { hp: 1, levelUps: 2, level: 3 });
    expect(applyLevelReward(hero, { stat: 'wits' })).toMatchObject({
      stats: { strength: 1, agility: 3, wits: 3 },
      hp: 8,
      levelUps: 1,
    });
  });
});
