// Хранилище состояния игры для интерфейса: держит GameState, применяет переходы из движка
// и выполняет побочные эффекты — автосохранение при каждом изменении партии вне боя
// (новая сцена, предмет из сумки, награда за уровень) и удаление сохранения после смерти
// в режиме «Одна жизнь».
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import * as engine from '@/game/engine';
import type { NewHero } from '@/game/hero';
import { deleteSave, readSave, writeSave, type SaveStorage } from '@/game/save';
import type { Choice, FightAction, GameState, ItemId, LevelReward, Rng } from '@/game/types';

export interface GameStore {
  getState(): GameState;
  subscribe(listener: () => void): () => void;
  hasSave(): boolean;
  openHeroCreation(): void;
  startNewGame(hero: NewHero): void;
  loadGame(): void;
  choose(choice: Choice): void;
  fightAction(action: FightAction): void;
  closeFight(): void;
  retryFight(): void;
  /** Выйти в главное меню посреди партии; сохранение остаётся. */
  exitToMenu(): void;
  applyItem(id: ItemId): void;
  chooseLevelReward(reward: LevelReward): void;
  /** Применить произвольный переход (панель отладки); сохранение работает как обычно. */
  apply(transition: (state: GameState) => GameState): void;
  deleteSave(): void;
}

export function createGameStore(storage: SaveStorage, rng: Rng = Math.random): GameStore {
  let state = engine.initialState;
  const listeners = new Set<() => void>();

  /** leaving: выход в меню по желанию игрока, а не смерть — сохранение не трогаем. */
  function update(next: GameState, leaving = false) {
    const prev = state;
    if (next === prev) return;
    state = next;

    const session = next.session;
    if (leaving) {
      // ничего не сохраняем и не удаляем: последний выбор уже сохранён
    } else if (prev.screen === 'story' && next.screen === 'menu') {
      // смерть: в режиме «Одна жизнь» сохранение стирается, иначе в нём остаётся последний выбор
      // перед гибелью (сцены смерти и бои не сохраняются) — «Загрузить игру» вернёт туда
      if (prev.session?.oneLife) deleteSave(storage);
    } else if (session && next.screen === 'story' && !session.fight) {
      writeSave(storage, session); // бой не сохраняется: после перезагрузки он начнётся заново
    }

    listeners.forEach((listener) => listener());
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hasSave: () => readSave(storage) !== null,
    openHeroCreation: () => update(engine.openHeroCreation(state)),
    startNewGame: (hero) => update(engine.startNewGame(state, hero)),
    loadGame() {
      const session = readSave(storage);
      if (session) update(engine.resumeSession(state, session));
    },
    choose: (choice) => update(engine.choose(state, choice, rng)),
    fightAction: (action) => update(engine.fightAction(state, action, rng)),
    closeFight: () => update(engine.closeFight(state)),
    retryFight: () => update(engine.retryFight(state)),
    exitToMenu: () => update(engine.gameOver(), true),
    applyItem: (id) => update(engine.applyItem(state, id)),
    chooseLevelReward: (reward) => update(engine.chooseLevelReward(state, reward)),
    apply: (transition) => update(transition(state)),
    deleteSave() {
      deleteSave(storage);
      listeners.forEach((listener) => listener());
    },
  };
}

export const StoreContext = createContext<GameStore | null>(null);

export function useStore(): GameStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore вне StoreContext');
  return store;
}

/** Текущее состояние игры; компонент перерисовывается при каждом его изменении. */
export function useGameState(): GameState {
  const store = useStore();
  const [state, setState] = useState(store.getState());
  useEffect(() => {
    setState(store.getState());
    return store.subscribe(() => setState(store.getState()));
  }, [store]);
  return state;
}
