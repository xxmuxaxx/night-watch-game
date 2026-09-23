// Пошаговый бой. Раунд: действие героя, затем ответ врага.
//   attack  — обычный удар: сила + бросок оружия, удвоение при точном ударе;
//   defend  — урон врага вдвое меньше, шанс уворота вдвое выше; сильный удар (после замаха)
//             парируется целиком, и герой бьёт в ответ;
//   special — приём класса, после него ждать cooldown ходов;
//   { item } — предмет из сумки вместо удара.
// Враг с шансом windup замахивается вместо удара, и следующий его удар двойной;
// защита его парирует, оглушение (stun) сбивает. Доспех врага (armor) снимает урон с каждого
// удара героя, кроме точного; увёртливый враг (dodge) уходит от обычных ударов, но не от приёма.
// Шансы точного удара и уворота героя растут с чутьём и ловкостью (combatStats); защита героя
// (armorId) снимает урон с каждого удара врага. Предмет со stun (зола) оглушает, как приём.
import { armor } from '@/content/armors';
import { heroClass } from '@/content/classes';
import { CRIT_PER_WITS, DODGE_PER_AGILITY, MAX_CHANCE } from '@/content/combat';
import { item } from '@/content/items';
import { FIGHT_XP } from '@/content/progression';
import { weapon } from '@/content/weapons';
import { consumeItem, hasItem } from './hero';
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
    armor: def.armor ?? 0,
    dodge: def.dodge ?? 0,
    xp: def.xp ?? FIGHT_XP,
    windingUp: false,
  };
}

export function startFight(def: EnemyDef, winScene: SceneId): FightState {
  return { enemy: createEnemy(def), cooldown: 0, log: [], result: null, winScene, retry: null };
}

export function canUseSpecial(fight: FightState): boolean {
  return fight.result === null && fight.cooldown === 0;
}

/** Боевые шансы героя: у класса свои, каждое очко чутья и ловкости сверх начальных добавляет. */
export function combatStats(hero: Hero): { crit: number; dodge: number } {
  const cls = heroClass(hero.classId);
  const bonus = (stat: 'wits' | 'agility', perPoint: number) =>
    Math.max(0, hero.stats[stat] - cls.stats[stat]) * perPoint;
  return {
    crit: Math.min(MAX_CHANCE, cls.crit + bonus('wits', CRIT_PER_WITS)),
    dodge: Math.min(MAX_CHANCE, cls.dodge + bonus('agility', DODGE_PER_AGILITY)),
  };
}

interface RoundState {
  hero: Hero;
  fight: FightState;
}

/** Урон удара героя по врагу: доспех снимает свою долю, если удар не точный. */
function strikeDamage(raw: number, enemy: Enemy, isCrit: boolean): number {
  return isCrit ? raw : Math.max(0, raw - enemy.armor);
}

/**
 * Сыграть раунд. Возвращает новых героя и бой; исходные объекты не меняются.
 * Порядок бросков при ударе: оружие, точный удар, (если враг увёртлив) его уворот; затем ответ
 * врага: замах, уворот героя, урон. При парировании: только оружие для ответного удара.
 */
export function playRound(
  hero: Hero,
  fight: FightState,
  action: FightAction,
  rng: Rng,
): RoundState {
  if (fight.result !== null) return { hero, fight };
  if (action === 'special' && !canUseSpecial(fight)) return { hero, fight };
  if (typeof action === 'object' && !hasItem(hero, action.item)) return { hero, fight };

  const cls = heroClass(hero.classId);
  const stats = combatStats(hero);
  const special = cls.special;
  const enemy = { ...fight.enemy };
  const log = [...fight.log];
  let current = hero;
  let heroHp = hero.hp;
  let cooldown = fight.cooldown;
  let stun = false;
  const finish = (result: FightState['result']): RoundState => {
    if (cooldown > 0 && result === null) cooldown--;
    return {
      hero: { ...current, hp: heroHp },
      fight: { ...fight, enemy, cooldown, log, result },
    };
  };

  // Ход героя
  if (typeof action === 'object') {
    current = consumeItem(hero, action.item);
    heroHp = current.hp;
    stun = item(action.item).stun ?? false;
    log.push(
      'Вы используете: ' + item(action.item).name + ' (' + item(action.item).description + ')',
    );
  } else if (action === 'defend') {
    log.push(enemy.windingUp ? 'Вы готовитесь парировать' : 'Вы встаёте в защиту');
  } else {
    let damage = hero.stats.strength + randomInt(rng, weapon(hero.weaponId).damage);
    let isCrit = chance(rng, stats.crit);
    let label = 'Вы бьёте: ';
    if (action === 'special') {
      cooldown = special.cooldown + 1; // +1: этот ход тоже вычтется в конце раунда
      damage *= special.damage ?? 1;
      if (special.crit) isCrit = true;
      stun = special.stun ?? false;
      label = special.name + '! ';
    }
    if (isCrit && action !== 'special') label = 'Точный удар! ';
    if (isCrit) damage *= 2;
    // от приёма не увернуться
    if (enemy.dodge > 0 && action !== 'special' && chance(rng, enemy.dodge)) {
      log.push(enemy.name + ' уходит от удара');
    } else {
      const dealt = strikeDamage(damage, enemy, isCrit);
      enemy.hp -= dealt;
      log.push(
        label +
          enemy.name +
          ' теряет ' +
          dealt +
          ' здоровья' +
          (enemy.armor > 0 && !isCrit ? ' (доспех держит удар)' : '') +
          (enemy.armor > 0 && isCrit ? ' (удар в щель доспеха)' : ''),
      );
      if (enemy.hp <= 0) return finish('win');
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
    return finish(null);
  }

  const defending = action === 'defend';
  const heavy = enemy.windingUp;
  if (heavy && defending) {
    // Парирование: сильный удар виден заранее — защита отводит его и открывает врага
    enemy.windingUp = false;
    const counter = strikeDamage(
      hero.stats.strength + randomInt(rng, weapon(hero.weaponId).damage),
      enemy,
      false,
    );
    enemy.hp -= counter;
    log.push(
      'Вы парируете сильный удар и бьёте в ответ: ' +
        enemy.name +
        ' теряет ' +
        counter +
        ' здоровья',
    );
    return finish(enemy.hp <= 0 ? 'win' : null);
  }
  if (!heavy && chance(rng, enemy.windup)) {
    enemy.windingUp = true;
    log.push(enemy.name + ' замахивается для сильного удара!');
    return finish(null);
  }

  enemy.windingUp = false;
  const dodge = defending ? stats.dodge * 2 : stats.dodge;
  if (chance(rng, dodge)) {
    log.push(heavy ? 'Вы уворачиваетесь от сильного удара!' : 'Вы уворачиваетесь от удара');
    return finish(null);
  }
  // защита героя снимает свою долю, потом блок делит остаток пополам
  let damage = Math.max(
    0,
    randomInt(rng, enemy.damage) * (heavy ? 2 : 1) - armor(hero.armorId).armor,
  );
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
  return finish(heroHp <= 0 ? 'lose' : null);
}
