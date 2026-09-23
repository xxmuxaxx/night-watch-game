import type { LevelReward } from '@/game/types';
import { CRIT_PER_WITS, DODGE_PER_AGILITY } from './combat';

const pct = (value: number) => Math.round(value * 100) + '%';

/** Опыт за победу в бою, если у врага не задан свой. */
export const FIGHT_XP = 10;

/** Опыт за успешную проверку характеристики, если у проверки не задан свой. */
export const CHECK_XP = 5;

/**
 * Сколько всего опыта нужно для уровня: LEVEL_XP[0] — уровень 1, LEVEL_XP[1] — уровень 2 и т. д.
 * Последний элемент — наибольший уровень.
 */
export const LEVEL_XP = [0, 20, 50, 100, 170, 260];

/** Награды на выбор при новом уровне. Вместе с наградой герой полностью восстанавливает здоровье. */
export const LEVEL_REWARDS: { reward: LevelReward; label: string }[] = [
  { reward: { stat: 'strength' }, label: '+1 к силе: урон +1' },
  { reward: { stat: 'agility' }, label: '+1 к ловкости: уворот +' + pct(DODGE_PER_AGILITY) },
  { reward: { stat: 'wits' }, label: '+1 к чутью: точный удар +' + pct(CRIT_PER_WITS) },
  { reward: { maxHp: 3 }, label: '+3 к здоровью' },
];
