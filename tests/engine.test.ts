import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import type { Choice, GameState } from '@/game/types';
import { constant, sequence, sessionOf, withSession } from './helpers';

function newGame(classId: 'warrior' | 'rogue' = 'warrior'): GameState {
  return engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId,
    portrait: 'img/hero-1.jpg',
  });
}

/** Вариант ответа текущей сцены по фрагменту текста. */
function pick(state: GameState, fragment: string): Choice {
  const session = sessionOf(state);
  const ctx = engine.textContext(session);
  const choice = engine
    .availableChoices(session)
    .find((c) => engine.resolveText(c.text, ctx).includes(fragment));
  if (!choice) throw new Error('Нет варианта «' + fragment + '» в сцене ' + session.sceneId);
  return choice;
}

function play(state: GameState, ...fragments: string[]): GameState {
  return fragments.reduce(
    (s, fragment) => engine.choose(s, pick(s, fragment), constant(0.5)),
    state,
  );
}

describe('новая игра', () => {
  it('начинается с первой сцены без решений', () => {
    const state = newGame();
    expect(state.screen).toBe('story');
    expect(state.session).toMatchObject({ sceneId: 'st0', flags: {}, fight: null, notice: null });
    expect(state.session?.hero).toMatchObject({
      name: 'Ивар',
      classId: 'warrior',
      hp: 10,
      maxHp: 10,
      weaponId: 'fists',
    });
  });
});

describe('choose', () => {
  it('переходит в следующую сцену', () => {
    expect(play(newGame(), 'Подойти').session?.sceneId).toBe('st1');
  });

  it('«Конец игры» возвращает в меню', () => {
    const state = play(newGame(), 'убежать', 'Конец игры');
    expect(state).toEqual({ screen: 'menu', session: null });
  });

  it('запоминает решения и лечит', () => {
    let state = play(newGame(), 'Подойти', 'Ждать');
    state = withSession(state, { sceneId: 'st6', hero: { ...sessionOf(state).hero, hp: 3 } });
    state = play(state, 'поесть');
    expect(state.session?.flags).toEqual({ ate: true });
    expect(state.session?.hero.hp).toBe(8);
  });

  it('лечение не выше максимума', () => {
    let state = newGame();
    state = withSession(state, { sceneId: 'st6' });
    expect(play(state, 'поесть').session?.hero.hp).toBe(10);
  });

  it('if / ifNot показывают варианты по решениям', () => {
    let state = newGame();
    state = withSession(state, { sceneId: 'st8' });
    const texts = (s: GameState) => engine.availableChoices(sessionOf(s)).map((c) => c.text);
    expect(texts(state)).toEqual(['Выбежать к воротам одному']);
    state = withSession(state, { flags: { vasyaFriend: true } });
    expect(texts(state)).toEqual(['Выбежать вместе с Васей']);
  });

  it('проверка: успех ведёт в next и запоминает check.set, итог виден в следующей сцене', () => {
    const state = play(newGame('rogue'), 'Подойти', 'Ждать');
    const success = engine.choose(state, pick(state, 'Поднырнуть'), constant(0.1));
    expect(success.session).toMatchObject({
      sceneId: 'st3',
      flags: { trippedVasya: true },
      notice: { success: true, text: 'Проверка: Ловкость — успех' },
    });
    // следующий переход убирает итог
    expect(play(success, 'Направиться').session?.notice).toBeNull();
  });

  it('проверка: провал ведёт в fail без check.set', () => {
    const state = play(newGame(), 'Подойти', 'Ждать');
    const fail = engine.choose(state, pick(state, 'Поднырнуть'), constant(0.9));
    expect(fail.session).toMatchObject({ sceneId: 'st2_1', flags: {}, notice: { success: false } });
  });

  it('сундук: set варианта запоминается всегда, второй попытки нет', () => {
    let state = newGame();
    state = withSession(state, { sceneId: 'st7' });
    state = engine.choose(state, pick(state, 'сундук'), constant(0.99));
    expect(state.session).toMatchObject({ sceneId: 'st7_3', flags: { triedChest: true } });
    state = play(state, 'окно');
    expect(() => pick(state, 'сундук')).toThrow();
  });
});

describe('бой', () => {
  it('победа: «Продолжить» ведёт в сцену после боя', () => {
    let state = play(newGame(), 'Подойти', 'Ждать', 'драке');
    expect(state.session?.fight?.enemy.name).toBe('Вася');
    // пока идёт бой, варианты сцены не выбираются
    expect(engine.choose(state, { text: 'x', next: 'st0' }, constant(0))).toBe(state);
    while (state.session?.fight?.result === null) {
      state = engine.fightAction(state, 'attack', sequence(0.99, 0.99, 0.99, 0.99, 0));
    }
    expect(state.session?.fight?.result).toBe('win');
    state = engine.closeFight(state);
    expect(state.session).toMatchObject({ sceneId: 'st3', fight: null });
  });

  it('поражение: «Продолжить» возвращает в меню', () => {
    let state = play(newGame(), 'Подойти', 'Ждать', 'драке');
    state = withSession(state, { hero: { ...sessionOf(state).hero, hp: 1 } });
    state = engine.fightAction(state, 'defend', sequence(0.99, 0.99, 0.99));
    expect(state.session?.fight?.result).toBe('lose');
    expect(engine.closeFight(state)).toEqual({ screen: 'menu', session: null });
  });
});
