// Пороги баланса: если правка боя, класса или врага сделает бой слишком лёгким или
// непроходимым, эти проверки упадут. Цифры можно посмотреть в панели отладки («Баланс боя»).
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/content/enemies';
import { SCENES } from '@/content/story';
import { buildHero, HERO_PRESETS, simulate, simulateFight, STRATEGIES } from '@/game/balance';
import { seededRng } from '@/game/random';
import type { EnemyDef } from '@/game/types';

const warrior = buildHero('warrior');
const rogue = buildHero('rogue');
const level1 = [warrior, rogue];

/** Все враги, с которыми герой дерётся в написанном сюжете. */
const storyEnemies: EnemyDef[] = Object.values(SCENES).flatMap((scene) =>
  scene.choices.flatMap((choice) => ('fight' in choice ? [choice.fight] : [])),
);

describe('инструмент баланса', () => {
  it('одно и то же зерно — одни и те же цифры', () => {
    const run = () => simulate(warrior, ENEMIES.raider, STRATEGIES.smart, 200, 7);
    expect(run()).toEqual(run());
  });

  it('бой заканчивается победой или поражением', () => {
    const outcome = simulateFight(rogue, ENEMIES.vasya, STRATEGIES.smart, seededRng(3));
    expect(outcome.rounds).toBeGreaterThan(0);
    expect(outcome.hpLeft).toBeGreaterThanOrEqual(0);
  });

  it('внимательная игра (парирование, приём, еда) выигрывает чаще, чем одни удары', () => {
    for (const { label, hero } of HERO_PRESETS) {
      const smart = simulate(hero, ENEMIES.raider, STRATEGIES.smart, 500);
      const attack = simulate(hero, ENEMIES.raider, STRATEGIES.attack, 500);
      expect(smart.winRate, label).toBeGreaterThanOrEqual(attack.winRate);
    }
  });
});

describe('пороги баланса', () => {
  it('бои первой главы проходит герой 1 уровня без оружия, даже если только бьёт', () => {
    for (const hero of level1) {
      for (const enemy of storyEnemies) {
        const result = simulate(hero, enemy, STRATEGIES.attack);
        expect(result.winRate, hero.classId + ' — ' + enemy.name).toBeGreaterThanOrEqual(0.9);
      }
    }
  });

  it('враги второй главы: с ножом и умом герой 1 уровня почти всегда побеждает', () => {
    for (const classId of ['warrior', 'rogue'] as const) {
      const hero = buildHero(classId, { weapon: 'knife' });
      for (const enemy of [ENEMIES.wolf, ENEMIES.raider]) {
        const result = simulate(hero, enemy, STRATEGIES.smart);
        expect(result.winRate, classId + ' — ' + enemy.name).toBeGreaterThanOrEqual(0.85);
      }
    }
  });

  it('человек в плаще опасен для того, кто не парирует', () => {
    for (const classId of ['warrior', 'rogue'] as const) {
      const hero = buildHero(classId, { weapon: 'knife' });
      const result = simulate(hero, ENEMIES.raider, STRATEGIES.attack);
      expect(result.winRate, classId).toBeLessThan(0.6);
    }
  });

  it('классы не слишком расходятся: разница побед над каждым врагом не больше 15%', () => {
    for (const enemy of Object.values(ENEMIES)) {
      const rate = (classId: 'warrior' | 'rogue') =>
        simulate(buildHero(classId, { weapon: 'knife' }), enemy, STRATEGIES.smart).winRate;
      expect(Math.abs(rate('warrior') - rate('rogue')), enemy.name).toBeLessThanOrEqual(0.15);
    }
  });
});
