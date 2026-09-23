// Подсказки для новичка: каждая показывается один раз, в тот момент, когда впервые нужна.
// Условия читают состояние игры; что игрок уже видел, хранится в настройках (settings.ts).
// Тексты подсказок — в словарях (src/i18n, раздел hints).
import { canRetryFight } from '@/game/engine';
import type { GameState, Session } from '@/game/types';

/** Подсказка: её id — ключ текста в словаре и в списке увиденных. */
export type Hint = 'parry' | 'retry' | 'journal' | 'roaming' | 'bag';

interface HintRule {
  id: Hint;
  when: (session: Session) => boolean;
}

/** Порядок — приоритет: если подходят несколько, показывается первая. */
const HINTS: HintRule[] = [
  {
    id: 'parry',
    when: (s) => s.fight?.result === null && s.fight.enemy.windingUp,
  },
  {
    id: 'retry',
    when: (s) => canRetryFight(s),
  },
  {
    id: 'journal',
    when: (s) => !s.fight,
  },
  {
    id: 'roaming',
    when: (s) => !s.fight && s.sceneId === null,
  },
  {
    id: 'bag',
    when: (s) => !s.fight && s.hero.inventory.length > 0,
  },
];

/** Подсказка, которую стоит показать сейчас, или null. */
export function currentHint(state: GameState, seen: readonly string[]): Hint | null {
  const session = state.session;
  if (state.screen !== 'story' || !session || session.hero.levelUps > 0) return null;
  const hint = HINTS.find((rule) => !seen.includes(rule.id) && rule.when(session));
  return hint?.id ?? null;
}
