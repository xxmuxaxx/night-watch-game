// Наряды: работа на день с доски у ворот. Утром герой узнаёт у доски свой наряд (он выбирается
// случайно из тех, что герой ещё не выполнял), днём делает работу у нужной точки интереса —
// вариант с duty в src/content/locations.ts, награда в самом варианте. Невыполненный к концу дня
// наряд портит отношение Торвина. Сцены нарядов — в src/content/chapters/duties.ts.
import type { Duty } from '@/game/types';

export const DUTIES = {
  firewood: { scene: 'duty_firewood' },
  smithy: { scene: 'duty_smithy' },
  weapons: { scene: 'duty_weapons' },
  barracks: { scene: 'duty_barracks' },
  gate: { scene: 'duty_gate' },
} as const satisfies Record<string, Duty>;

export type DutyId = keyof typeof DUTIES;

export const DUTY_IDS = Object.keys(DUTIES) as DutyId[];

/** Сцена у доски, когда все наряды уже выполнены. */
export const NO_DUTY_SCENE = 'duty_none';

/** Кто спрашивает с героя за пропущенный наряд. */
export const DUTY_MISSED_RELATION = { torvin: -1 } as const;
