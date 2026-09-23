// Переходы для панели отладки (только в режиме разработки). Как и движок — чистые функции,
// но без игровых правил: прыгают в любую сцену и меняют героя напрямую.
import { startNewGame } from './engine';
import type { ClassId, FlagId, Flags, GameState, Hero, SceneId } from './types';

/** Сразу начать игру, минуя меню и создание героя. */
export function quickStart(state: GameState, classId: ClassId): GameState {
  return startNewGame(state, { name: 'Тест', classId, portrait: 'img/hero-1.jpg' });
}

export function jumpToScene(state: GameState, sceneId: SceneId): GameState {
  if (!state.session) return state;
  return {
    ...state,
    screen: 'story',
    session: { ...state.session, sceneId, fight: null, notices: [] },
  };
}

export function toggleFlag(state: GameState, id: FlagId): GameState {
  if (!state.session) return state;
  const current = state.session.flags;
  const flags: Flags = current[id]
    ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== id))
    : { ...current, [id]: true };
  return { ...state, session: { ...state.session, flags } };
}

export function updateHero(state: GameState, change: (hero: Hero) => Hero): GameState {
  if (!state.session) return state;
  return { ...state, session: { ...state.session, hero: change(state.session.hero) } };
}

/** Мгновенная победа в текущем бою: остаётся нажать «Продолжить». */
export function winFight(state: GameState): GameState {
  const fight = state.session?.fight;
  if (!state.session || !fight || fight.result) return state;
  return {
    ...state,
    session: {
      ...state.session,
      fight: {
        ...fight,
        enemy: { ...fight.enemy, hp: 0 },
        log: [...fight.log, '[отладка] победа'],
        result: 'win',
      },
    },
  };
}
