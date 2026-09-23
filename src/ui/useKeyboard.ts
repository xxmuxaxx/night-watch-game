import { useEffect } from 'preact/hooks';
import { LEVEL_REWARDS } from '@/content/progression';
import { canUseSpecial } from '@/game/combat';
import { itemBlocked } from '@/game/hero';
import { availableChoices, canRetryFight, isChoosingLevelReward } from '@/game/engine';
import type { FightAction } from '@/game/types';
import type { GameStore } from './store';

const FIGHT_KEYS: Record<string, 'attack' | 'defend' | 'special' | 'item'> = {
  Enter: 'attack',
  ' ': 'attack',
  '1': 'attack',
  '2': 'defend',
  '3': 'special',
  '4': 'item',
};

export type Panel = 'journal' | 'settings';

/** Окна поверх игры: какое открыто и как открыть или закрыть. */
export interface PanelControl {
  panel: Panel | null;
  toggle: (panel: Panel) => void;
  close: () => void;
}

/**
 * Клавиатура: J открывает и закрывает журнал, Esc закрывает открытое окно или открывает настройки
 * (пока окно открыто, остальные клавиши не работают);
 * в сцене 1–9 выбирают вариант ответа; при новом уровне 1–4 — награду;
 * в бою 1/Enter/пробел — удар, 2 — защита, 3 — приём, 4 — первый предмет из сумки;
 * после боя Enter/пробел/1 — «Продолжить» (после поражения — «Попробовать снова», 2 — «Сдаться»). В меню и при вводе имени клавиши не перехватываются.
 */
export function useKeyboard(store: GameStore, panels: PanelControl) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || e.ctrlKey || e.altKey || e.metaKey) return;
      // кнопку в фокусе браузер нажмёт сам
      if (target?.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;

      // состояние берём в момент нажатия, а не из отрисовки: при двух быстрых нажатиях
      // второе иначе применило бы вариант прошлой сцены к новой
      const state = store.getState();
      const session = state.session;
      if (state.screen !== 'story' || !session) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (panels.panel) panels.close();
        else panels.toggle('settings');
        return;
      }
      if (panels.panel === 'settings') return;
      const n = Number.parseInt(e.key, 10);

      if (session.fight) {
        const key = FIGHT_KEYS[e.key];
        if (!key) return;
        e.preventDefault();
        const fight = session.fight;
        const hero = session.hero;
        if (fight.result !== null) {
          // после поражения Enter — «Попробовать снова», 2 — «Сдаться»
          if (canRetryFight(session)) {
            if (key === 'attack') store.retryFight();
            if (key === 'defend') store.closeFight();
          } else if (key === 'attack') {
            store.closeFight();
          }
          return;
        }
        let action: FightAction | null = key === 'item' ? null : key;
        const firstItem = hero.inventory[0];
        if (key === 'item' && firstItem && !itemBlocked(hero, firstItem, true)) {
          action = { item: firstItem };
        }
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

      // по коду клавиши, а не по символу: J работает и в русской раскладке
      if (e.code === 'KeyJ') {
        e.preventDefault();
        panels.toggle('journal');
        return;
      }
      if (panels.panel) return;

      const choice = availableChoices(session)[n - 1];
      if (choice) {
        e.preventDefault();
        store.choose(choice);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store, panels]);
}
