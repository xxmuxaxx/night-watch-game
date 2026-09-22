// Хранилище состояния игры для интерфейса: держит GameState, применяет переходы из движка
// и выполняет побочные эффекты — автосохранение при входе в новую сцену и удаление
// сохранения после смерти.
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import * as engine from '@/game/engine';
import type { NewHero } from '@/game/hero';
import { deleteSave, readSave, writeSave, type SaveStorage } from '@/game/save';
import type { Choice, FightAction, GameState, Rng } from '@/game/types';

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
}

export function createGameStore(storage: SaveStorage, rng: Rng = Math.random): GameStore {
  let state = engine.initialState;
  const listeners = new Set<() => void>();

  function update(next: GameState) {
    const prev = state;
    if (next === prev) return;
    state = next;

    const prevSession = prev.session;
    const session = next.session;
    if (prev.screen === 'story' && next.screen === 'menu') {
      deleteSave(storage); // смерть
    } else if (
      session &&
      next.screen === 'story' &&
      (prev.screen !== 'story' || prevSession?.sceneId !== session.sceneId)
    ) {
      writeSave(storage, session); // новая игра или новая сцена
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
