// Отношения персонажей к герою: пределы и названия уровней для журнала.

export const RELATION_MIN = -5;
export const RELATION_MAX = 5;

/** Уровни отношения: первый, чей порог не выше значения, считая сверху. */
export const ATTITUDES: readonly { from: number; name: string }[] = [
  { from: 3, name: 'доверяет' },
  { from: 1, name: 'симпатизирует' },
  { from: 0, name: 'присматривается' },
  { from: -2, name: 'недолюбливает' },
  { from: RELATION_MIN, name: 'враждебен' },
];
