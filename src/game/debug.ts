// Переходы для панели отладки (только в режиме разработки). Как и движок — чистые функции,
// но без игровых правил: прыгают в любую сцену и меняют героя напрямую.
import { startNewGame } from './engine';
import { changeRelations } from './relations';
import type { ClassId, FlagId, Flags, GameState, Hero, LocationId, NpcId, SceneId } from './types';
import { enterScene, passTime } from './world';

/** Сразу начать игру, минуя меню и создание героя. */
export function quickStart(state: GameState, classId: ClassId): GameState {
  return startNewGame(state, { name: 'Тест', classId, portrait: 'img/hero-1.jpg' });
}

/** Перейти в сцену как по сюжету: сцена переносит героя (location) и запоминает решения (set). */
export function jumpToScene(state: GameState, sceneId: SceneId): GameState {
  if (!state.session) return state;
  return {
    ...state,
    screen: 'story',
    session: enterScene({ ...state.session, fight: null, notices: [] }, sceneId),
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

/** Изменить отношение персонажа (в пределах, без сообщений). */
export function changeRelation(state: GameState, id: NpcId, delta: number): GameState {
  if (!state.session) return state;
  const { relations } = changeRelations(state.session.relations, { [id]: delta });
  return { ...state, session: { ...state.session, relations } };
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

/** Оказаться в локации (свободное перемещение) без событий и затрат времени. */
export function goToLocation(state: GameState, locationId: LocationId): GameState {
  if (!state.session) return state;
  return {
    ...state,
    session: { ...state.session, sceneId: null, locationId, fight: null, notices: [] },
  };
}

/** Промотать время; при свободном перемещении события срабатывают как в игре. */
export function passHours(state: GameState, hours: number): GameState {
  const session = state.session;
  if (!session || session.fight) return state;
  const until = session.time + hours * 60;
  if (session.sceneId !== null) return { ...state, session: { ...session, time: until } };
  return { ...state, session: passTime(session, until).session };
}

/** Забыть случившиеся события, чтобы они сработали снова. */
export function resetEvents(state: GameState): GameState {
  if (!state.session) return state;
  return { ...state, session: { ...state.session, events: [] } };
}
