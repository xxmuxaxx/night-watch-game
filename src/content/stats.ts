import type { StatId } from '@/game/types';

/** Характеристики для проверок. Сила ещё и прибавляется к урону в бою. */
export const STAT_NAMES: Record<StatId, string> = {
  strength: 'Сила',
  agility: 'Ловкость',
  wits: 'Чутьё',
};

export const STAT_IDS = Object.keys(STAT_NAMES) as StatId[];
