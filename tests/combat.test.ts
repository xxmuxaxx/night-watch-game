import { describe, expect, it } from 'vitest';
import { HERO_CLASSES } from '@/content/classes';
import { CRIT_PER_WITS, DODGE_PER_AGILITY } from '@/content/combat';
import { canUseSpecial, combatStats, playRound, startFight } from '@/game/combat';
import type { EnemyDef } from '@/game/types';
import { constant, sequence, testHero } from './helpers';

// Порядок бросков в раунде атаки: оружие, точный удар, (если враг увёртлив) его уворот,
// (враг) замах, уворот героя, урон врага.
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
    expect(fight.enemy).toMatchObject({
      hp: 10,
      maxHp: 10,
      damage: { min: 0, max: 2 },
      windup: 0,
      armor: 0,
      dodge: 0,
    });
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

  it('замах, затем защита парирует сильный удар и бьёт в ответ', () => {
    let { hero, fight } = playRound(
      testHero(),
      startFight(DUMMY, 'next'),
      'attack',
      sequence(0, 0.99, 0.1),
    );
    expect(fight.enemy.windingUp).toBe(true);
    expect(fight.log.at(-1)).toBe('Вася замахивается для сильного удара!');

    // парирование: урона нет, ответный удар — сила 2 + оружие 2
    ({ hero, fight } = playRound(hero, fight, 'defend', sequence(0.99)));
    expect(hero.hp).toBe(10);
    expect(fight.enemy.hp).toBe(30 - 2 - 4);
    expect(fight.enemy.windingUp).toBe(false);
    expect(fight.log.slice(-2)).toEqual([
      'Вы готовитесь парировать',
      'Вы парируете сильный удар и бьёте в ответ: Вася теряет 4 здоровья',
    ]);
  });

  it('ответный удар при парировании может победить', () => {
    const first = playRound(
      testHero(),
      startFight({ ...DUMMY, hp: 5 }, 'next'),
      'attack',
      sequence(0, 0.99, 0.1),
    );
    expect(playRound(first.hero, first.fight, 'defend', sequence(0.99)).fight.result).toBe('win');
  });

  it('доспех снимает урон с обычного удара, точный удар его пробивает', () => {
    const armored = startFight({ ...DUMMY, armor: 2, windup: 0 }, 'next');
    const plain = playRound(testHero(), armored, 'attack', sequence(0.99, 0.99, 0.99, 0.99, 0));
    expect(plain.fight.enemy.hp).toBe(30 - (4 - 2));
    expect(plain.fight.log[0]).toBe('Вы бьёте: Вася теряет 2 здоровья (доспех держит удар)');

    // подлый удар Разбойника всегда точный: 1 + 2 = 3, ×2 = 6, доспех не помогает
    const sneak = playRound(
      testHero('rogue'),
      armored,
      'special',
      sequence(0.99, 0.99, 0.99, 0.99, 0),
    );
    expect(sneak.fight.enemy.hp).toBe(30 - 6);
    expect(sneak.fight.log[0]).toBe('Подлый удар! Вася теряет 6 здоровья (удар в щель доспеха)');
  });

  it('увёртливый враг уходит от удара, но не от приёма', () => {
    const agile = startFight({ ...DUMMY, dodge: 0.5, windup: 0 }, 'next');
    // оружие, точный удар, уворот врага 0.1 < 0.5
    const missed = playRound(testHero(), agile, 'attack', sequence(0.99, 0.99, 0.1, 0.99, 0.99, 0));
    expect(missed.fight.enemy.hp).toBe(30);
    expect(missed.fight.log[0]).toBe('Вася уходит от удара');
    // приём: броска уворота врага нет
    const special = playRound(testHero(), agile, 'special', sequence(0.99, 0.99));
    expect(special.fight.enemy.hp).toBe(30 - 8);
  });

  it('чутьё и ловкость сверх начальных повышают шансы точного удара и уворота', () => {
    expect(combatStats(testHero('rogue'))).toEqual({ crit: 0.3, dodge: 0.25 });
    const trained = testHero('rogue', { stats: { strength: 1, agility: 5, wits: 3 } });
    // чутьё +1, ловкость +2 сверх начальных
    expect(combatStats(trained).crit).toBeCloseTo(0.3 + CRIT_PER_WITS);
    expect(combatStats(trained).dodge).toBeCloseTo(0.25 + 2 * DODGE_PER_AGILITY);
    // не больше предела
    const master = testHero('rogue', { stats: { strength: 1, agility: 20, wits: 20 } });
    expect(combatStats(master)).toEqual({ crit: 0.6, dodge: 0.6 });
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

  it('мощный удар Воина: двойной урон, оглушение сбивает замах, потом перезарядка', () => {
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
    expect(fight.cooldown).toBe(HERO_CLASSES.warrior.special.cooldown);
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
    const { cooldown } = HERO_CLASSES.warrior.special;
    for (let i = 0; i < cooldown; i++) {
      state = playRound(state.hero, state.fight, 'defend', sequence(0.99, 0.99, 0));
      cooldowns.push(state.fight.cooldown);
    }
    // каждый ход на единицу меньше, до нуля
    expect(cooldowns).toEqual(Array.from({ length: cooldown }, (_, i) => cooldown - 1 - i));
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
    expect(fight.cooldown).toBe(HERO_CLASSES.rogue.special.cooldown);
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

  it('предмет вместо удара: лечит, уходит из сумки, враг отвечает', () => {
    const hero = testHero('warrior', { hp: 4, inventory: ['bread'] });
    const { hero: after, fight } = playRound(
      hero,
      startFight({ ...DUMMY, windup: 0 }, 'next'),
      { item: 'bread' },
      sequence(0.99, 0.99, 0),
    );
    expect(after.inventory).toEqual([]);
    expect(after.hp).toBe(4 + 3 - 2);
    expect(fight.enemy.hp).toBe(30);
    expect(fight.log[0]).toBe('Вы используете: Краюха хлеба (+3 здоровья)');
  });

  it('предмета нет в сумке — раунд не играется', () => {
    const fight = startFight(DUMMY, 'next');
    expect(playRound(testHero(), fight, { item: 'bread' }, constant(0)).fight).toBe(fight);
  });

  it('оружие влияет на урон: нож 1–3 вместо 0–2', () => {
    const { fight } = playRound(
      testHero('warrior', { weaponId: 'knife' }),
      startFight(DUMMY, 'next'),
      'attack',
      sequence(0.99, 0.99, 0.99, 0.99, 0),
    );
    expect(fight.enemy.hp).toBe(30 - (2 + 3));
  });

  it('опыт за врага: по умолчанию 10, можно задать свой', () => {
    expect(startFight(DUMMY, 'next').enemy.xp).toBe(10);
    expect(startFight({ ...DUMMY, xp: 25 }, 'next').enemy.xp).toBe(25);
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
