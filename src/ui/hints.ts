// Подсказки для новичка: каждая показывается один раз, в тот момент, когда впервые нужна.
// Условия читают состояние игры; что игрок уже видел, хранится в настройках (settings.ts).
import { canRetryFight } from '@/game/engine';
import type { GameState, Session } from '@/game/types';

export interface Hint {
  id: string;
  text: string;
}

interface HintRule extends Hint {
  when: (session: Session) => boolean;
}

/** Порядок — приоритет: если подходят несколько, показывается первая. */
const HINTS: HintRule[] = [
  {
    id: 'parry',
    text: 'Враг замахивается! Нажмите «Парировать» (2): защита целиком отведёт сильный удар, и вы ударите в ответ.',
    when: (s) => s.fight?.result === null && s.fight.enemy.windingUp,
  },
  {
    id: 'retry',
    text: 'Поражение — ещё не конец: можно попробовать бой снова с того места, где он начался.',
    when: (s) => canRetryFight(s),
  },
  {
    id: 'journal',
    text: 'Цели и зацепки записываются в журнал: клавиша J или кнопка «Журнал» в панели героя.',
    when: (s) => !s.fight,
  },
  {
    id: 'roaming',
    text: 'Теперь вы свободно ходите по крепости. Время идёт: у людей свой распорядок, события случаются в свой час, а некоторые занятия можно делать раз в день.',
    when: (s) => !s.fight && s.sceneId === null,
  },
  {
    id: 'bag',
    text: 'Предметы из сумки можно использовать в панели героя, а в бою — вместо удара (клавиша 4).',
    when: (s) => !s.fight && s.hero.inventory.length > 0,
  },
];

/** Подсказка, которую стоит показать сейчас, или null. */
export function currentHint(state: GameState, seen: readonly string[]): Hint | null {
  const session = state.session;
  if (state.screen !== 'story' || !session || session.hero.levelUps > 0) return null;
  const hint = HINTS.find((rule) => !seen.includes(rule.id) && rule.when(session));
  return hint ? { id: hint.id, text: hint.text } : null;
}
