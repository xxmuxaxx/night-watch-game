// Переходы состояния игры. Все функции чистые: получают состояние и возвращают новое.
// Побочные эффекты (сохранение, отрисовка) — в src/ui/store.ts.
import { SCENES, START_SCENE } from '@/content/story';
import { rollCheck } from './checks';
import { playRound, startFight } from './combat';
import { createHero, heal, type NewHero } from './hero';
import type {
  Choice,
  FightAction,
  FlagId,
  GameState,
  Rng,
  Scene,
  SceneId,
  Session,
  Text,
  TextContext,
} from './types';

export const initialState: GameState = { screen: 'menu', session: null };

export function getScene(id: SceneId): Scene {
  const scene = SCENES[id];
  if (!scene) throw new Error('Нет сцены ' + id);
  return scene;
}

export function hasScene(id: SceneId): boolean {
  return id in SCENES;
}

export function textContext(session: Session): TextContext {
  return {
    hero: session.hero,
    flag: (id: FlagId) => session.flags[id] === true,
  };
}

export function resolveText(text: Text, ctx: TextContext): string {
  return typeof text === 'function' ? text(ctx) : text;
}

export function isAvailable(choice: Choice, ctx: TextContext): boolean {
  return (!choice.if || ctx.flag(choice.if)) && (!choice.ifNot || !ctx.flag(choice.ifNot));
}

export function availableChoices(session: Session): Choice[] {
  const ctx = textContext(session);
  return getScene(session.sceneId).choices.filter((choice) => isAvailable(choice, ctx));
}

/** Сцена смерти: в ней есть «Конец игры». Такие сцены не сохраняются. */
export function isDeathScene(scene: Scene): boolean {
  return scene.choices.some((choice) => 'gameOver' in choice);
}

// --- Экраны ---

export function openHeroCreation(state: GameState): GameState {
  return { ...state, screen: 'createHero' };
}

export function startNewGame(state: GameState, newHero: NewHero): GameState {
  const session: Session = {
    hero: createHero(newHero),
    sceneId: START_SCENE,
    flags: {},
    fight: null,
    notice: null,
  };
  return { ...state, screen: 'story', session };
}

export function resumeSession(state: GameState, session: Session): GameState {
  return { ...state, screen: 'story', session: { ...session, fight: null, notice: null } };
}

export function gameOver(): GameState {
  return { screen: 'menu', session: null };
}

// --- Сюжет ---

function goTo(session: Session, sceneId: SceneId): Session {
  return { ...session, sceneId, notice: null };
}

/** Выбрать вариант ответа в текущей сцене. */
export function choose(state: GameState, choice: Choice, rng: Rng): GameState {
  const current = state.session;
  if (!current || current.fight) return state;

  let session: Session = { ...current, flags: { ...current.flags, ...choice.set } };
  if (choice.heal) session = { ...session, hero: heal(session.hero, choice.heal) };

  if ('check' in choice) {
    const notice = rollCheck(session.hero, choice.check, rng);
    if (notice.success) session = { ...session, flags: { ...session.flags, ...choice.check.set } };
    session = goTo(session, notice.success ? choice.next : choice.fail);
    return { ...state, session: { ...session, notice } };
  }
  if ('fight' in choice) {
    return { ...state, session: { ...session, fight: startFight(choice.fight, choice.next) } };
  }
  if ('gameOver' in choice) {
    return gameOver();
  }
  if ('next' in choice) {
    return { ...state, session: goTo(session, choice.next) };
  }
  return { ...state, session };
}

// --- Бой ---

export function fightAction(state: GameState, action: FightAction, rng: Rng): GameState {
  const session = state.session;
  if (!session?.fight) return state;
  const { hero, fight } = playRound(session.hero, session.fight, action, rng);
  return { ...state, session: { ...session, hero, fight } };
}

/** Закрыть окно итога боя: победа ведёт дальше по сюжету, поражение — конец игры. */
export function closeFight(state: GameState): GameState {
  const session = state.session;
  if (!session?.fight?.result) return state;
  if (session.fight.result === 'lose') return gameOver();
  return { ...state, session: goTo({ ...session, fight: null }, session.fight.winScene) };
}
