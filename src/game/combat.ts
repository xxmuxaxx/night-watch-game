// Пошаговый бой. Раунд: действие героя, затем ответ врага.
//   attack  — обычный удар: сила + бросок оружия, удвоение при точном ударе (crit класса);
//   defend  — урон врага вдвое меньше, шанс уворота вдвое выше;
//   special — приём класса, после него ждать cooldown ходов.
// Враг с шансом windup замахивается вместо удара, и следующий его удар двойной;
// защита его ополовинивает, оглушение (stun) сбивает.
import { heroClass } from '@/content/classes';
import { weapon } from '@/content/weapons';
import { chance, randomInt } from './random';
import type { Enemy, EnemyDef, FightAction, FightState, Hero, Rng, SceneId } from './types';

export function createEnemy(def: EnemyDef): Enemy {
  const hp = def.hp ?? 10;
  return {
    name: def.name,
    portrait: def.portrait,
    hp,
    maxHp: hp,
    damage: def.damage ?? { min: 0, max: 2 },
    windup: def.windup ?? 0,
    windingUp: false,
  };
}

export function startFight(def: EnemyDef, winScene: SceneId): FightState {
  return { enemy: createEnemy(def), cooldown: 0, log: [], result: null, winScene };
}

export function canUseSpecial(fight: FightState): boolean {
  return fight.result === null && fight.cooldown === 0;
}

interface RoundState {
  hero: Hero;
  fight: FightState;
}

/** Сыграть раунд. Возвращает новых героя и бой; исходные объекты не меняются. */
export function playRound(
  hero: Hero,
  fight: FightState,
  action: FightAction,
  rng: Rng,
): RoundState {
  if (fight.result !== null) return { hero, fight };
  if (action === 'special' && !canUseSpecial(fight)) return { hero, fight };

  const cls = heroClass(hero.classId);
  const special = cls.special;
  const enemy = { ...fight.enemy };
  const log = [...fight.log];
  let heroHp = hero.hp;
  let cooldown = fight.cooldown;
  let stun = false;

  // Ход героя
  if (action === 'defend') {
    log.push('Вы встаёте в защиту');
  } else {
    let damage = hero.stats.strength + randomInt(rng, weapon(hero.weaponId).damage);
    let isCrit = chance(rng, cls.crit);
    let label = 'Вы бьёте: ';
    if (action === 'special') {
      cooldown = special.cooldown + 1; // +1: этот ход тоже вычтется в конце раунда
      damage *= special.damage ?? 1;
      if (special.crit) isCrit = true;
      stun = special.stun ?? false;
      label = special.name + '! ';
    }
    if (isCrit) {
      damage *= 2;
      if (action !== 'special') label = 'Точный удар! ';
    }
    enemy.hp -= damage;
    log.push(label + enemy.name + ' теряет ' + damage + ' здоровья');
    if (enemy.hp <= 0) {
      return { hero, fight: { ...fight, enemy, cooldown, log, result: 'win' } };
    }
  }

  // Ответ врага
  if (stun) {
    log.push(
      enemy.windingUp
        ? 'Вы сбиваете замах: ' + enemy.name + ' оглушён и пропускает удар'
        : enemy.name + ' оглушён и пропускает удар',
    );
    enemy.windingUp = false;
  } else {
    const defending = action === 'defend';
    const heavy = enemy.windingUp;
    if (!heavy && chance(rng, enemy.windup)) {
      enemy.windingUp = true;
      log.push(enemy.name + ' замахивается для сильного удара!');
    } else {
      enemy.windingUp = false;
      const dodge = defending ? cls.dodge * 2 : cls.dodge;
      if (chance(rng, dodge)) {
        log.push(heavy ? 'Вы уворачиваетесь от сильного удара!' : 'Вы уворачиваетесь от удара');
      } else {
        let damage = randomInt(rng, enemy.damage) * (heavy ? 2 : 1);
        if (defending) damage = Math.floor(damage / 2);
        heroHp -= damage;
        if (damage > 0) {
          log.push(
            (heavy ? enemy.name + ' обрушивает сильный удар' : enemy.name + ' бьёт в ответ') +
              (defending ? ' по вашей защите' : '') +
              ': вы теряете ' +
              damage +
              ' здоровья',
          );
        } else {
          log.push(
            defending
              ? 'Вы принимаете удар на защиту и не теряете здоровья'
              : enemy.name + ' промахивается',
          );
        }
      }
    }
  }

  if (cooldown > 0) cooldown--;
  return {
    hero: { ...hero, hp: heroHp },
    fight: { ...fight, enemy, cooldown, log, result: heroHp <= 0 ? 'lose' : null },
  };
}
