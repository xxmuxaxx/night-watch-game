import { useEffect } from 'preact/hooks';
import { canUseSpecial } from '@/game/combat';
import { availableChoices } from '@/game/engine';
import type { FightAction, GameState } from '@/game/types';
import type { GameStore } from './store';

const FIGHT_KEYS: Record<string, FightAction> = {
  Enter: 'attack',
  ' ': 'attack',
  '1': 'attack',
  '2': 'defend',
  '3': 'special',
};

/**
 * Клавиатура: в сцене 1–9 выбирают вариант ответа; в бою 1/Enter/пробел — удар, 2 — защита,
 * 3 — приём; после боя Enter/пробел/1 — «Продолжить». В меню и при вводе имени клавиши не перехватываются.
 */
export function useKeyboard(store: GameStore, state: GameState) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || e.ctrlKey || e.altKey || e.metaKey) return;
      // кнопку в фокусе браузер нажмёт сам
      if (target?.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;

      const session = state.session;
      if (state.screen !== 'story' || !session) return;

      if (session.fight) {
        const action = FIGHT_KEYS[e.key];
        if (!action) return;
        e.preventDefault();
        if (session.fight.result !== null) {
          if (action === 'attack') store.closeFight();
        } else if (action !== 'special' || canUseSpecial(session.fight)) {
          store.fightAction(action);
        }
        return;
      }

      const n = Number.parseInt(e.key, 10);
      const choice = availableChoices(session)[n - 1];
      if (choice) {
        e.preventDefault();
        store.choose(choice);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store, state]);
}
