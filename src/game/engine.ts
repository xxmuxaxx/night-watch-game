// Переходы состояния игры. Все функции чистые: получают состояние и возвращают новое.
// Побочные эффекты (сохранение, отрисовка) — в src/ui/store.ts. Локации, время и события — в world.ts.
import { item } from '@/content/items';
import { CHECK_XP } from '@/content/progression';
import { START_LOCATION, START_SCENE, START_TIME } from '@/content/story';
import { rollCheck } from './checks';
import { playRound, startFight } from './combat';
import { getScene, isAvailable, textContext } from './context';
import { consumeItem, createHero, giveLoot, hasItem, heal, type NewHero } from './hero';
import { addXp, applyLevelReward } from './progression';
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
import { enterScene, leaveScene, moveTo, roamChoices, sleep, wait } from './world';

export { getScene, hasScene, isAvailable, isDeathScene, resolveText, textContext } from './context';

export const initialState: GameState = { screen: 'menu', session: null };

/** Варианты сейчас: в сцене — её варианты, в локации — разговоры, действия, выходы, ожидание. */
export function availableChoices(session: Session): Choice[] {
  if (session.sceneId === null) return roamChoices(session);
  const ctx = textContext(session);
  return getScene(session.sceneId).choices.filter((choice) => isAvailable(choice, ctx));
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

// --- Сюжет и перемещение ---

/** Выбрать вариант: в сцене или в локации. */
export function choose(state: GameState, choice: Choice, rng: Rng): GameState {
  const current = state.session;
  if (!current || current.fight || isChoosingLevelReward(current) || choice.disabled) return state;

  const notices: Notice[] = [];
  let hero = current.hero;
  if (choice.heal) hero = heal(hero, choice.heal);
  const loot = giveLoot(hero, choice.give);
  hero = loot.hero;
  notices.push(...loot.notices);

  // Общие последствия любого выбора: решения, лечение, добыча, потраченное время
  let session: Session = {
    ...current,
    hero,
    flags: { ...current.flags, ...choice.set },
    time: current.time + (choice.minutes ?? 0),
    notices,
  };

  if ('check' in choice) {
    const { success, notice } = rollCheck(session.hero, choice.check, rng);
    notices.unshift(notice);
    if (success) {
      const checkLoot = giveLoot(session.hero, choice.check.give);
      session = {
        ...session,
        flags: { ...session.flags, ...choice.check.set },
        hero: gainXp(checkLoot.hero, choice.check.xp ?? CHECK_XP, notices),
      };
      notices.push(...checkLoot.notices);
    }
    return { ...state, session: enterScene(session, success ? choice.next : choice.fail) };
  }
  if ('fight' in choice) {
    const fight = startFight(choice.fight, choice.next);
    return { ...state, session: { ...session, fight, notices: [] } };
  }
  if ('gameOver' in choice) return gameOver();
  if ('leave' in choice) return { ...state, session: leaveScene(session, choice.leave) };
  if ('move' in choice) return { ...state, session: moveTo(session, choice.move) };
  if ('wait' in choice) {
    const result = wait(session, choice.wait);
    return { ...state, session: { ...result.session, notices: [...notices, ...result.notices] } };
  }
  if ('sleep' in choice) {
    const result = sleep(session);
    return { ...state, session: { ...result.session, notices: [...notices, ...result.notices] } };
  }
  if ('next' in choice) return { ...state, session: enterScene(session, choice.next) };
  return { ...state, session: { ...session, notices: current.notices } };
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
  return {
    ...state,
    session: enterScene({ ...session, hero, fight: null, notices }, fight.winScene),
  };
}
