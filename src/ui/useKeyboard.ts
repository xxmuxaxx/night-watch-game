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

/** Окна по коду клавиши, а не по символу: так они открываются и в русской раскладке. */
const PANEL_KEYS: Record<string, 'journal' | 'chronicle' | 'map'> = {
  KeyJ: 'journal',
  KeyH: 'chronicle',
  KeyM: 'map',
};

export type Panel = 'journal' | 'chronicle' | 'map' | 'settings' | 'load';

/** Клавиши вариантов по порядку: 1–9, затем 0 для десятого; дальше — только мышью. */
const CHOICE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/** Клавиша варианта с этим номером (с нуля) или null, если клавиши нет. */
export function choiceKey(index: number): string | null {
  return CHOICE_KEYS[index] ?? null;
}

/** Окна поверх игры: какое открыто и как открыть или закрыть. */
export interface PanelControl {
  panel: Panel | null;
  toggle: (panel: Panel) => void;
  close: () => void;
}

/**
 * Клавиатура: J открывает и закрывает журнал, H — летопись, M — карту, Esc закрывает открытое окно или открывает настройки
 * (пока окно открыто, остальные клавиши не работают);
 * в сцене 1–9 и 0 выбирают вариант ответа, Backspace отходит от точки интереса или прощается
 * в разговоре (последний вариант, если он заканчивает сцену); при новом уровне 1–4 — награду;
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

      const panelKey = PANEL_KEYS[e.code];
      if (panelKey) {
        e.preventDefault();
        panels.toggle(panelKey);
        return;
      }
      if (panels.panel) return;

      const choices = availableChoices(session);
      if (e.key === 'Backspace') {
        const last = choices.at(-1);
        if (session.sceneId === null && session.spotId !== null) {
          e.preventDefault();
          store.choose({ text: { id: 'back' }, back: true });
        } else if (session.sceneId !== null && last && 'leave' in last) {
          e.preventDefault();
          store.choose(last);
        }
        return;
      }

      const choice = choices[CHOICE_KEYS.indexOf(e.key)];
      if (choice) {
        e.preventDefault();
        store.choose(choice);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store, panels]);
}
