import { describe, expect, it } from 'vitest';
import { canUseSpecial, playRound, startFight } from '@/game/combat';
import type { EnemyDef } from '@/game/types';
import { constant, sequence, testHero } from './helpers';

// Порядок бросков в раунде атаки: оружие, точный удар, (враг) замах, уворот, урон врага.
// Числа 0.0 — «минимум / событие случилось», 0.99 — «максимум / не случилось».

const DUMMY: EnemyDef = {
  name: 'Вася',
  portrait: 'img/portrait-vasya.jpg',
  hp: 30,
  damage: { min: 2, max: 2 },
  windup: 0.3,
};

describe('startFight', () => {
  it('подставляет значения врага по умолчанию', () => {
    const fight = startFight({ name: 'Тень', portrait: 'x.jpg' }, 'next');
    expect(fight.enemy).toMatchObject({ hp: 10, maxHp: 10, damage: { min: 0, max: 2 }, windup: 0 });
    expect(fight).toMatchObject({ cooldown: 0, result: null, winScene: 'next', log: [] });
  });
});

describe('playRound', () => {
  it('обычный удар: сила + оружие, враг отвечает', () => {
    const { hero, fight } = playRound(
      testHero(),
      startFight(DUMMY, 'next'),
      'attack',
      sequence(0.99, 0.99, 0.99, 0.99, 0),
    );
    expect(fight.enemy.hp).toBe(30 - (2 + 2));
    expect(hero.hp).toBe(10 - 2);
    expect(fight.log).toEqual([
      'Вы бьёте: Вася теряет 4 здоровья',
      'Вася бьёт в ответ: вы теряете 2 здоровья',
    ]);
  });

  it('не меняет исходные объекты', () => {
    const hero = testHero();
    const fight = startFight(DUMMY, 'next');
    playRound(hero, fight, 'attack', constant(0));
    expect(hero.hp).toBe(10);
    expect(fight.enemy.hp).toBe(30);
    expect(fight.log).toEqual([]);
  });

  it('замах, затем защита ополовинивает сильный удар', () => {
    let { hero, fight } = playRound(
      testHero(),
      startFight(DUMMY, 'next'),
      'attack',
      sequence(0, 0.99, 0.1),
    );
    expect(fight.enemy.windingUp).toBe(true);
    expect(fight.log.at(-1)).toBe('Вася замахивается для сильного удара!');

    // защита: уворот (у Воина 0), урон 2 × 2 = 4, пополам = 2
    ({ hero, fight } = playRound(hero, fight, 'defend', sequence(0.99, 0)));
    expect(hero.hp).toBe(8);
    expect(fight.enemy.windingUp).toBe(false);
    expect(fight.log.at(-1)).toBe(
      'Вася обрушивает сильный удар по вашей защите: вы теряете 2 здоровья',
    );
  });

  it('сильный удар без защиты — двойной', () => {
    const first = playRound(
      testHero(),
      startFight(DUMMY, 'next'),
      'attack',
      sequence(0, 0.99, 0.1),
    );
    const { hero } = playRound(first.hero, first.fight, 'attack', sequence(0, 0.99, 0.99, 0));
    expect(hero.hp).toBe(10 - 4);
  });

  it('мощный удар Воина: двойной урон, оглушение сбивает замах, перезарядка 3 хода', () => {
    const first = playRound(
      testHero(),
      startFight(DUMMY, 'next'),
      'attack',
      sequence(0, 0.99, 0.1),
    );
    const { hero, fight } = playRound(first.hero, first.fight, 'special', sequence(0, 0.99));
    expect(fight.enemy.hp).toBe(30 - 2 - 4);
    expect(hero.hp).toBe(10);
    expect(fight.enemy.windingUp).toBe(false);
    expect(fight.log.at(-1)).toBe('Вы сбиваете замах: Вася оглушён и пропускает удар');
    expect(fight.cooldown).toBe(3);
    expect(canUseSpecial(fight)).toBe(false);
  });

  it('приём на перезарядке не срабатывает', () => {
    const { fight } = playRound(
      testHero(),
      startFight(DUMMY, 'next'),
      'special',
      sequence(0, 0.99),
    );
    const again = playRound(testHero(), fight, 'special', constant(0));
    expect(again.fight).toBe(fight);
  });

  it('перезарядка уменьшается каждый ход до нуля', () => {
    let state = playRound(
      testHero(),
      startFight({ ...DUMMY, windup: 0 }, 'next'),
      'special',
      sequence(0, 0.99),
    );
    const cooldowns = [];
    for (let i = 0; i < 3; i++) {
      state = playRound(state.hero, state.fight, 'defend', sequence(0.99, 0.99, 0));
      cooldowns.push(state.fight.cooldown);
    }
    expect(cooldowns).toEqual([2, 1, 0]);
    expect(canUseSpecial(state.fight)).toBe(true);
  });

  it('подлый удар Разбойника всегда точный', () => {
    const { fight } = playRound(
      testHero('rogue'),
      startFight({ ...DUMMY, windup: 0 }, 'next'),
      'special',
      sequence(0, 0.99, 0.99, 0.99, 0),
    );
    expect(fight.log[0]).toBe('Подлый удар! Вася теряет 2 здоровья');
    expect(fight.cooldown).toBe(2);
  });

  it('в защите Разбойник уворачивается вдвое чаще', () => {
    // уворот 25% × 2 = 50%: бросок 0.4 — увернулся, без защиты — нет
    const defended = playRound(
      testHero('rogue'),
      startFight({ ...DUMMY, windup: 0 }, 'next'),
      'defend',
      sequence(0.99, 0.4),
    );
    expect(defended.fight.log.at(-1)).toBe('Вы уворачиваетесь от удара');
    const attacked = playRound(
      testHero('rogue'),
      startFight({ ...DUMMY, windup: 0 }, 'next'),
      'attack',
      sequence(0, 0.99, 0.99, 0.4, 0),
    );
    expect(attacked.hero.hp).toBe(8 - 2);
  });

  it('победа: враг не отвечает, бой окончен', () => {
    const { hero, fight } = playRound(
      testHero(),
      startFight({ ...DUMMY, hp: 3 }, 'next'),
      'attack',
      sequence(0.99, 0.99),
    );
    expect(fight.result).toBe('win');
    expect(hero.hp).toBe(10);
    expect(playRound(hero, fight, 'attack', constant(0)).fight).toBe(fight);
  });

  it('поражение, когда здоровье падает до нуля и ниже', () => {
    const { fight } = playRound(
      testHero('warrior', { hp: 1 }),
      startFight({ ...DUMMY, windup: 0 }, 'next'),
      'attack',
      sequence(0, 0.99, 0.99, 0.99, 0),
    );
    expect(fight.result).toBe('lose');
  });
});
