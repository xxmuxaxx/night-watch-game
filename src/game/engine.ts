// Переходы состояния игры. Все функции чистые: получают состояние и возвращают новое.
// Побочные эффекты (сохранение, отрисовка) — в src/ui/store.ts. Локации, время и события — в world.ts.
import { CHECK_XP } from '@/content/progression';
import { START_LOCATION, START_SCENE, START_TIME } from '@/content/story';
import { rollCheck } from './checks';
import { playRound, startFight } from './combat';
import { getScene, isAvailable, textContext, withLimits } from './context';
import {
  consumeItem,
  createHero,
  giveLoot,
  hasItem,
  heal,
  itemBlocked,
  type NewHero,
} from './hero';
import { journalNotices } from './journal';
import { addXp, applyLevelReward } from './progression';
import { changeRelations } from './relations';
import { toGameTime } from './time';
import type {
  Choice,
  FightAction,
  GameState,
  Hero,
  ItemId,
  LevelReward,
  Notice,
  Rng,
  Session,
} from './types';
import {
  enterScene,
  leaveScene,
  lookAt,
  moveTo,
  roamChoices,
  sleep,
  stepBack,
  travel,
  wait,
} from './world';

export {
  getScene,
  hasScene,
  isAvailable,
  isDeathScene,
  resolveImage,
  resolveText,
  textContext,
} from './context';

export const initialState: GameState = { screen: 'menu', session: null };

/** Варианты сейчас: в сцене — её варианты, в локации — разговоры, точки интереса, выходы, ожидание. */
export function availableChoices(session: Session): Choice[] {
  if (session.sceneId === null) return roamChoices(session);
  const ctx = textContext(session);
  return getScene(session.sceneId)
    .choices.filter((choice) => isAvailable(choice, ctx))
    .map((choice) => withLimits(choice, session));
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
    locationId: START_LOCATION,
    time: START_TIME,
    events: [],
    flags: {},
    relations: {},
    oneLife: newHero.oneLife ?? false,
    daily: {},
    spotId: null,
    visited: [],
    asked: [],
    fight: null,
    notices: [],
  };
  return {
    ...state,
    screen: 'story',
    session: { ...session, notices: journalNotices(null, session) },
  };
}

export function resumeSession(state: GameState, session: Session): GameState {
  return {
    ...state,
    screen: 'story',
    session: { ...session, spotId: null, fight: null, notices: [] },
  };
}

export function gameOver(): GameState {
  return { screen: 'menu', session: null };
}

// --- Опыт ---

/** Начислить опыт и добавить сообщения «+N опыта» и «Новый уровень!». */
function gainXp(hero: Hero, amount: number, notices: Notice[]): Hero {
  if (amount <= 0) return hero;
  const next = addXp(hero, amount);
  notices.push({ tone: 'info', message: { id: 'xp', amount } });
  if (next.level > hero.level) notices.push({ tone: 'success', message: { id: 'levelUp' } });
  return next;
}

// --- Сюжет и перемещение ---

/** Добавить сообщения об изменениях в журнале (новые цели, зацепки, выполненные цели). */
function withJournalNotices(before: Session | null, state: GameState): GameState {
  const session = state.session;
  // в бою сообщения не видны: итог боя начинает их заново
  if (!before || !session || session === before || session.fight) return state;
  const notices = journalNotices(before, session);
  if (notices.length === 0) return state;
  return { ...state, session: { ...session, notices: [...session.notices, ...notices] } };
}

/** Выбрать вариант: в сцене или в локации. */
export function choose(state: GameState, choice: Choice, rng: Rng): GameState {
  return withJournalNotices(state.session, applyChoice(state, choice, rng));
}

function applyChoice(state: GameState, choice: Choice, rng: Rng): GameState {
  const current = state.session;
  if (!current || current.fight || isChoosingLevelReward(current) || choice.disabled) return state;

  const notices: Notice[] = [];
  let hero = current.hero;
  if (choice.heal) hero = heal(hero, choice.heal);
  const loot = giveLoot(hero, choice.give);
  hero = loot.hero;
  notices.push(...loot.notices);
  const relations = changeRelations(current.relations, choice.relation);
  notices.push(...relations.notices);
  if (choice.xp) hero = gainXp(hero, choice.xp, notices);
  const daily = choice.daily
    ? { ...current.daily, [choice.daily]: toGameTime(current.time).day }
    : current.daily;

  // Общие последствия любого выбора: решения, отношения, лечение, добыча, потраченное время
  let session: Session = {
    ...current,
    hero,
    flags: { ...current.flags, ...choice.set },
    relations: relations.relations,
    daily,
    asked:
      choice.topic && !current.asked.includes(choice.topic)
        ? [...current.asked, choice.topic]
        : current.asked,
    time: current.time + (choice.minutes ?? 0),
    notices,
  };

  if ('check' in choice) {
    const { success, notice } = rollCheck(session.hero, choice.check, rng);
    notices.unshift(notice);
    if (success) {
      const checkLoot = giveLoot(session.hero, choice.check.give);
      const checkRelations = changeRelations(session.relations, choice.check.relation);
      session = {
        ...session,
        flags: { ...session.flags, ...choice.check.set },
        relations: checkRelations.relations,
        hero: gainXp(checkLoot.hero, choice.check.xp ?? CHECK_XP, notices),
      };
      notices.push(...checkLoot.notices, ...checkRelations.notices);
    }
    return { ...state, session: enterScene(session, success ? choice.next : choice.fail) };
  }
  if ('fight' in choice) {
    // перед боем запоминаем партию как была до выбора: после поражения можно попробовать снова
    const fight = { ...startFight(choice.fight, choice.next, choice.lose), retry: current };
    return { ...state, session: { ...session, fight, notices: [] } };
  }
  if ('gameOver' in choice) return gameOver();
  if ('leave' in choice) return { ...state, session: leaveScene(session, choice.leave) };
  if ('move' in choice) return { ...state, session: moveTo(session, choice.move) };
  if ('travel' in choice) return { ...state, session: travel(session, choice.travel) };
  if ('look' in choice) return { ...state, session: lookAt(session, choice.look) };
  if ('back' in choice) return { ...state, session: stepBack(session) };
  if ('wait' in choice) {
    const result = wait(session, choice.wait);
    return {
      ...state,
      session: { ...result.session, notices: [...result.session.notices, ...result.notices] },
    };
  }
  if ('sleep' in choice) {
    const result = sleep(session);
    return {
      ...state,
      session: { ...result.session, notices: [...result.session.notices, ...result.notices] },
    };
  }
  if ('next' in choice) return { ...state, session: enterScene(session, choice.next) };
  return { ...state, session: { ...session, notices: current.notices } };
}

/** Использовать предмет из сумки вне боя. */
export function applyItem(state: GameState, id: ItemId): GameState {
  const session = state.session;
  if (!session || session.fight || !hasItem(session.hero, id)) return state;
  if (itemBlocked(session.hero, id, false)) return state;
  const hero = consumeItem(session.hero, id);
  const notices: Notice[] = [{ tone: 'info', message: { id: 'itemUsed', item: id } }];
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

/** Можно ли попробовать проигранный бой снова (не в режиме «Одна жизнь» и не в учебном бою). */
export function canRetryFight(session: Session): boolean {
  const fight = session.fight;
  return (
    fight?.result === 'lose' && fight.loseScene === null && fight.retry !== null && !session.oneLife
  );
}

/** Попробовать снова: вернуться к сцене перед боем с тем здоровьем, что было до него. */
export function retryFight(state: GameState): GameState {
  const session = state.session;
  const retry = session?.fight?.retry;
  if (!session || !retry || !canRetryFight(session)) return state;
  const notices: Notice[] = [{ tone: 'info', message: { id: 'retry' } }];
  return { ...state, session: { ...retry, fight: null, notices } };
}

/**
 * Закрыть окно итога боя: победа даёт опыт и ведёт дальше по сюжету, поражение — конец игры,
 * а в учебном бою — в его сцену поражения с 1 здоровьем.
 */
export function closeFight(state: GameState): GameState {
  const session = state.session;
  const fight = session?.fight;
  if (!session || !fight?.result) return state;
  if (fight.result === 'lose') {
    if (fight.loseScene === null) return gameOver();
    const hero = { ...session.hero, hp: Math.max(1, session.hero.hp) };
    const next = enterScene({ ...session, hero, fight: null, notices: [] }, fight.loseScene);
    return withJournalNotices({ ...session, fight: null }, { ...state, session: next });
  }
  const notices: Notice[] = [];
  const hero = gainXp(session.hero, fight.enemy.xp, notices);
  const next = enterScene({ ...session, hero, fight: null, notices }, fight.winScene);
  return withJournalNotices({ ...session, fight: null }, { ...state, session: next });
}
