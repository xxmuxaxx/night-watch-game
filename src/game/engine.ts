// Переходы состояния игры. Все функции чистые: получают состояние и возвращают новое.
// Побочные эффекты (сохранение, отрисовка) — в src/ui/store.ts.
import { item } from '@/content/items';
import { CHECK_XP } from '@/content/progression';
import { SCENES, START_SCENE } from '@/content/story';
import { rollCheck } from './checks';
import { playRound, startFight } from './combat';
import { consumeItem, createHero, giveLoot, hasItem, heal, type NewHero } from './hero';
import { addXp, applyLevelReward } from './progression';
import type {
  Choice,
  FightAction,
  FlagId,
  GameState,
  Hero,
  ItemId,
  LevelReward,
  Notice,
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

/** Нужно выбрать награду за новый уровень (окно поверх сцены; не во время боя). */
export function isChoosingLevelReward(session: Session): boolean {
  return session.hero.levelUps > 0 && !session.fight;
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
    notices: [],
  };
  return { ...state, screen: 'story', session };
}

export function resumeSession(state: GameState, session: Session): GameState {
  return { ...state, screen: 'story', session: { ...session, fight: null, notices: [] } };
}

export function gameOver(): GameState {
  return { screen: 'menu', session: null };
}

// --- Опыт ---

/** Начислить опыт и добавить сообщения «+N опыта» и «Новый уровень!». */
function gainXp(hero: Hero, amount: number, notices: Notice[]): Hero {
  if (amount <= 0) return hero;
  const next = addXp(hero, amount);
  notices.push({ tone: 'info', text: '+' + amount + ' опыта' });
  if (next.level > hero.level) notices.push({ tone: 'success', text: 'Новый уровень!' });
  return next;
}

// --- Сюжет ---

/** Выбрать вариант ответа в текущей сцене. */
export function choose(state: GameState, choice: Choice, rng: Rng): GameState {
  const current = state.session;
  if (!current || current.fight || isChoosingLevelReward(current)) return state;

  const notices: Notice[] = [];
  const flags = { ...current.flags, ...choice.set };
  let hero = current.hero;
  if (choice.heal) hero = heal(hero, choice.heal);
  const loot = giveLoot(hero, choice.give);
  hero = loot.hero;
  notices.push(...loot.notices);

  if ('check' in choice) {
    const { success, notice } = rollCheck(hero, choice.check, rng);
    notices.unshift(notice);
    if (success) {
      Object.assign(flags, choice.check.set);
      const checkLoot = giveLoot(hero, choice.check.give);
      hero = gainXp(checkLoot.hero, choice.check.xp ?? CHECK_XP, notices);
      notices.push(...checkLoot.notices);
    }
    const sceneId = success ? choice.next : choice.fail;
    return { ...state, session: { ...current, hero, flags, sceneId, notices } };
  }
  if ('fight' in choice) {
    const fight = startFight(choice.fight, choice.next);
    return { ...state, session: { ...current, hero, flags, fight, notices: [] } };
  }
  if ('gameOver' in choice) {
    return gameOver();
  }
  if ('next' in choice) {
    return { ...state, session: { ...current, hero, flags, sceneId: choice.next, notices } };
  }
  return { ...state, session: { ...current, hero, flags } };
}

/** Использовать предмет из сумки вне боя. */
export function applyItem(state: GameState, id: ItemId): GameState {
  const session = state.session;
  if (!session || session.fight || !hasItem(session.hero, id)) return state;
  const hero = consumeItem(session.hero, id);
  const notices: Notice[] = [
    { tone: 'info', text: 'Вы используете: ' + item(id).name + ' (' + item(id).description + ')' },
  ];
  return { ...state, session: { ...session, hero, notices } };
}

/** Выбрать награду за новый уровень. */
export function chooseLevelReward(state: GameState, reward: LevelReward): GameState {
  const session = state.session;
  if (!session || !isChoosingLevelReward(session)) return state;
  return { ...state, session: { ...session, hero: applyLevelReward(session.hero, reward) } };
}

// --- Бой ---

export function fightAction(state: GameState, action: FightAction, rng: Rng): GameState {
  const session = state.session;
  if (!session?.fight) return state;
  const { hero, fight } = playRound(session.hero, session.fight, action, rng);
  return { ...state, session: { ...session, hero, fight } };
}

/** Закрыть окно итога боя: победа даёт опыт и ведёт дальше по сюжету, поражение — конец игры. */
export function closeFight(state: GameState): GameState {
  const session = state.session;
  const fight = session?.fight;
  if (!session || !fight?.result) return state;
  if (fight.result === 'lose') return gameOver();
  const notices: Notice[] = [];
  const hero = gainXp(session.hero, fight.enemy.xp, notices);
  return { ...state, session: { ...session, hero, fight: null, sceneId: fight.winScene, notices } };
}
