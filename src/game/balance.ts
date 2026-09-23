// Инструмент баланса: прогоняет много боёв героя с врагом и считает, как часто герой побеждает,
// сколько длится бой и сколько здоровья остаётся. Работает на тех же правилах, что и игра
// (playRound), так что любая правка боя или врага сразу видна в цифрах.
// Таблица — в панели отладки («Баланс боя»), проверки порогов — в tests/balance.test.ts.
import { ENEMIES, type EnemyId } from '@/content/enemies';
import { LEVEL_XP } from '@/content/progression';
import { canUseSpecial, playRound, startFight } from './combat';
import { createHero } from './hero';
import { addXp, applyLevelReward } from './progression';
import { seededRng } from './random';
import type {
  ClassId,
  EnemyDef,
  FightAction,
  FightState,
  Hero,
  ItemId,
  LevelReward,
  WeaponId,
} from './types';

/** Как игрок выбирает действие в бою. */
export type Strategy = (hero: Hero, fight: FightState) => FightAction;

export const STRATEGIES = {
  /** Внимательный игрок: парирует замах, лечится при малом здоровье, не забывает про приём. */
  smart: (hero, fight) => {
    if (fight.enemy.windingUp) return 'defend';
    const food = hero.inventory[0];
    if (food && hero.hp <= hero.maxHp * 0.4) return { item: food };
    return canUseSpecial(fight) ? 'special' : 'attack';
  },
  /** Игрок, который только бьёт. */
  attack: () => 'attack',
} satisfies Record<string, Strategy>;

export type StrategyId = keyof typeof STRATEGIES;

export const STRATEGY_NAMES: Record<StrategyId, string> = {
  smart: 'с умом',
  attack: 'только удары',
};

/** Бой не бесконечен: столько раундов без исхода считаем поражением. */
const MAX_ROUNDS = 100;

export interface FightOutcome {
  win: boolean;
  rounds: number;
  /** Сколько здоровья осталось у героя. */
  hpLeft: number;
}

export function simulateFight(
  hero: Hero,
  enemy: EnemyDef,
  strategy: Strategy,
  rng: () => number,
): FightOutcome {
  let state = { hero, fight: startFight(enemy, '') };
  let rounds = 0;
  while (state.fight.result === null && rounds < MAX_ROUNDS) {
    state = playRound(state.hero, state.fight, strategy(state.hero, state.fight), rng);
    rounds++;
  }
  return { win: state.fight.result === 'win', rounds, hpLeft: Math.max(0, state.hero.hp) };
}

export interface BalanceResult {
  /** Доля побед, 0–1. */
  winRate: number;
  /** Средняя длина боя в раундах. */
  rounds: number;
  /** Сколько здоровья в среднем теряет герой в победном бою. */
  hpLost: number;
}

/** Прогнать runs боёв; при одном и том же seed результат одинаковый. */
export function simulate(
  hero: Hero,
  enemy: EnemyDef,
  strategy: Strategy,
  runs = 1000,
  seed = 1,
): BalanceResult {
  const rng = seededRng(seed);
  let wins = 0;
  let rounds = 0;
  let lost = 0;
  for (let i = 0; i < runs; i++) {
    const outcome = simulateFight(hero, enemy, strategy, rng);
    rounds += outcome.rounds;
    if (outcome.win) {
      wins++;
      lost += hero.hp - outcome.hpLeft;
    }
  }
  return { winRate: wins / runs, rounds: rounds / runs, hpLost: wins ? lost / wins : 0 };
}

// --- Типовые герои для таблицы ---

export interface HeroPreset {
  label: string;
  hero: Hero;
}

/** Герой нужного уровня с выбранными наградами за уровни, оружием и сумкой. */
export function buildHero(
  classId: ClassId,
  options: { weapon?: WeaponId; rewards?: LevelReward[]; items?: ItemId[] } = {},
): Hero {
  const rewards = options.rewards ?? [];
  let hero = createHero({ name: 'Тест', classId, portrait: '' });
  hero = addXp(hero, LEVEL_XP[rewards.length] ?? 0);
  for (const reward of rewards) hero = applyLevelReward(hero, reward);
  return {
    ...hero,
    weaponId: options.weapon ?? 'fists',
    inventory: [...(options.items ?? [])],
  };
}

export const HERO_PRESETS: HeroPreset[] = [
  { label: 'Воин 1, кулаки', hero: buildHero('warrior') },
  { label: 'Разбойник 1, кулаки', hero: buildHero('rogue') },
  { label: 'Воин 1, нож', hero: buildHero('warrior', { weapon: 'knife' }) },
  { label: 'Разбойник 1, нож', hero: buildHero('rogue', { weapon: 'knife' }) },
  {
    label: 'Воин 3: сила, здоровье; нож',
    hero: buildHero('warrior', {
      weapon: 'knife',
      rewards: [{ stat: 'strength' }, { maxHp: 3 }],
    }),
  },
  {
    label: 'Разбойник 3: ловкость, чутьё; нож',
    hero: buildHero('rogue', {
      weapon: 'knife',
      rewards: [{ stat: 'agility' }, { stat: 'wits' }],
    }),
  },
];

export const ENEMY_IDS = Object.keys(ENEMIES) as EnemyId[];

/** Таблица: каждый герой против каждого врага. */
export function balanceTable(
  heroes: HeroPreset[],
  strategy: StrategyId,
  runs = 1000,
): { label: string; results: Record<EnemyId, BalanceResult> }[] {
  return heroes.map(({ label, hero }) => ({
    label,
    results: Object.fromEntries(
      ENEMY_IDS.map((id) => [id, simulate(hero, ENEMIES[id], STRATEGIES[strategy], runs)]),
    ) as Record<EnemyId, BalanceResult>,
  }));
}
