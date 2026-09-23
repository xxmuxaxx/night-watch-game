import { useEffect } from 'preact/hooks';
import { LEVEL_REWARDS } from '@/content/progression';
import { canUseSpecial } from '@/game/combat';
import { availableChoices, isChoosingLevelReward } from '@/game/engine';
import type { FightAction, GameState } from '@/game/types';
import type { GameStore } from './store';

const FIGHT_KEYS: Record<string, 'attack' | 'defend' | 'special' | 'item'> = {
  Enter: 'attack',
  ' ': 'attack',
  '1': 'attack',
  '2': 'defend',
  '3': 'special',
  '4': 'item',
};

/**
 * Клавиатура: в сцене 1–9 выбирают вариант ответа; при новом уровне 1–4 — награду;
 * в бою 1/Enter/пробел — удар, 2 — защита, 3 — приём, 4 — первый предмет из сумки;
 * после боя Enter/пробел/1 — «Продолжить». В меню и при вводе имени клавиши не перехватываются.
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
      const n = Number.parseInt(e.key, 10);

      if (session.fight) {
        const key = FIGHT_KEYS[e.key];
        if (!key) return;
        e.preventDefault();
        const fight = session.fight;
        const hero = session.hero;
        if (fight.result !== null) {
          if (key === 'attack') store.closeFight();
          return;
        }
        let action: FightAction | null = key === 'item' ? null : key;
        const firstItem = hero.inventory[0];
        if (key === 'item' && firstItem && hero.hp < hero.maxHp) action = { item: firstItem };
        if (key === 'special' && !canUseSpecial(fight)) action = null;
        if (action) store.fightAction(action);
        return;
      }

      if (isChoosingLevelReward(session)) {
        const reward = LEVEL_REWARDS[n - 1];
        if (reward) {
          e.preventDefault();
          store.chooseLevelReward(reward.reward);
        }
        return;
      }

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
