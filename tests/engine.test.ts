import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { itemBlocked } from '@/game/hero';
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

/** Выиграть текущий бой обычными ударами (враг промахивается) и закрыть окно итога. */
function winFight(state: GameState): GameState {
  let s = state;
  while (s.session?.fight?.result === null) {
    s = engine.fightAction(s, 'attack', sequence(0.99, 0.99, 0.99, 0.99, 0));
  }
  return engine.closeFight(s);
}

const texts = (state: GameState) => sessionOf(state).notices.map((n) => n.text);

describe('новая игра', () => {
  it('начинается с первой сцены без решений, опыта и добычи', () => {
    const state = newGame();
    expect(state.screen).toBe('story');
    expect(state.session).toMatchObject({ sceneId: 'st0', flags: {}, fight: null });
    expect(texts(state)).toEqual(['Журнал: новая цель «Новая жизнь»']);
    expect(state.session?.hero).toMatchObject({
      name: 'Ивар',
      classId: 'warrior',
      hp: 10,
      maxHp: 10,
      weaponId: 'fists',
      inventory: [],
      xp: 0,
      level: 1,
      levelUps: 0,
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

  it('запоминает решения, лечит и выдаёт добычу', () => {
    let state = withSession(newGame(), { sceneId: 'st6' });
    state = withSession(state, { hero: { ...sessionOf(state).hero, hp: 3 } });
    state = play(state, 'поесть');
    expect(state.session?.flags).toEqual({ ate: true });
    expect(state.session?.hero).toMatchObject({ hp: 8, inventory: ['bread'] });
    expect(texts(state)).toEqual(['В сумке: Краюха хлеба']);
  });

  it('лечение не выше максимума', () => {
    const state = withSession(newGame(), { sceneId: 'st6' });
    expect(play(state, 'поесть').session?.hero.hp).toBe(10);
  });

  it('if / ifNot показывают варианты по решениям', () => {
    let state = withSession(newGame(), { sceneId: 'st8' });
    const choiceTexts = (s: GameState) => engine.availableChoices(sessionOf(s)).map((c) => c.text);
    expect(choiceTexts(state)).toEqual(['Бежать к воротам одному']);
    state = withSession(state, { flags: { vasyaFriend: true } });
    expect(choiceTexts(state)).toEqual(['Бежать к воротам вместе с Васей']);
  });

  it('проверка: успех ведёт в next, запоминает check.set и даёт опыт', () => {
    const state = play(newGame('rogue'), 'Подойти', 'Ждать');
    const success = engine.choose(state, pick(state, 'Поднырнуть'), constant(0.1));
    expect(success.session).toMatchObject({ sceneId: 'st3', flags: { trippedVasya: true } });
    // сбить Васю с ног — опыт как за победу в бою
    expect(success.session?.hero.xp).toBe(10);
    expect(texts(success)).toEqual([
      'Проверка: Ловкость — успех',
      '+10 опыта',
      'Вася: отношение ухудшилось',
      'Журнал: новая запись в «Новая жизнь»',
    ]);
    // следующий переход убирает сообщения
    expect(play(success, 'Направиться').session?.notices).toEqual([]);
  });

  it('чутьё: Васю можно отговорить от драки — он запомнит это, Торвин тоже заметит', () => {
    const state = play(newGame('rogue'), 'Подойти', 'Ждать');
    const talked = engine.choose(state, pick(state, 'Заговорить'), constant(0.1));
    expect(talked.session).toMatchObject({
      sceneId: 'st3_talk',
      flags: { talkedDownVasya: true },
      relations: { vasya: 1 },
      hero: { xp: 10 },
    });
    const joined = play(talked, 'Направиться', 'Меня зовут');
    const text = engine.resolveText(
      engine.getScene('st5').text,
      engine.textContext(sessionOf(joined)),
    );
    expect(text).toContain('уболтал нашего задиру');

    const failed = engine.choose(state, pick(state, 'Заговорить'), constant(0.9));
    expect(failed.session?.sceneId).toBe('st2_2');
  });

  it('проверка: провал ведёт в fail без check.set и без опыта', () => {
    const state = play(newGame(), 'Подойти', 'Ждать');
    const fail = engine.choose(state, pick(state, 'Поднырнуть'), constant(0.9));
    expect(fail.session).toMatchObject({ sceneId: 'st2_1', flags: {}, hero: { xp: 0 } });
    expect(sessionOf(fail).notices).toEqual([
      { tone: 'fail', text: 'Проверка: Ловкость — провал' },
    ]);
  });

  it('сундук: при успехе нож в руки, при провале второй попытки нет', () => {
    const inCell = withSession(newGame(), {
      sceneId: null,
      locationId: 'cell',
      flags: { knowsCell: true },
    });
    const opened = engine.choose(inCell, pick(inCell, 'сундук'), constant(0.1));
    expect(opened.session).toMatchObject({ sceneId: 'st7_2', hero: { weaponId: 'knife', xp: 5 } });
    expect(texts(opened)).toContain('Получено оружие: Старый нож');

    let failed = engine.choose(inCell, pick(inCell, 'сундук'), constant(0.99));
    expect(failed.session).toMatchObject({ sceneId: 'st7_3', flags: { triedChest: true } });
    expect(failed.session?.hero.weaponId).toBe('fists');
    failed = play(failed, 'Отойти');
    expect(failed.session?.sceneId).toBeNull();
    expect(() => pick(failed, 'сундук')).toThrow();
  });
});

describe('опыт и уровни', () => {
  it('новый уровень: награда на выбор, до выбора сюжет стоит', () => {
    let state = withSession(newGame(), {
      sceneId: null,
      locationId: 'cell',
      hero: { ...sessionOf(newGame()).hero, xp: 15, hp: 4 },
    });
    state = engine.choose(state, pick(state, 'сундук'), constant(0.1)); // +5 → 20 опыта
    expect(state.session?.hero).toMatchObject({ xp: 20, level: 2, levelUps: 1 });
    expect(texts(state)).toContain('Новый уровень!');
    expect(engine.isChoosingLevelReward(sessionOf(state))).toBe(true);
    // пока награда не выбрана, варианты сцены не работают
    expect(engine.choose(state, pick(state, 'Отойти'), constant(0))).toBe(state);

    state = engine.chooseLevelReward(state, { stat: 'agility' });
    expect(state.session?.hero).toMatchObject({
      stats: { strength: 2, agility: 2, wits: 1 },
      hp: 10,
      levelUps: 0,
    });
    expect(engine.isChoosingLevelReward(sessionOf(state))).toBe(false);
  });

  it('награда здоровьем поднимает максимум и лечит полностью', () => {
    const state = withSession(newGame(), {
      hero: { ...sessionOf(newGame()).hero, hp: 2, levelUps: 1, level: 2 },
    });
    expect(engine.chooseLevelReward(state, { maxHp: 3 }).session?.hero).toMatchObject({
      hp: 13,
      maxHp: 13,
    });
  });
});

describe('предметы', () => {
  it('вне боя: хлеб лечит и исчезает из сумки', () => {
    let state = withSession(newGame(), {
      hero: { ...sessionOf(newGame()).hero, hp: 5, inventory: ['bread', 'bread'] },
    });
    state = engine.applyItem(state, 'bread');
    expect(state.session?.hero).toMatchObject({ hp: 8, inventory: ['bread'] });
    expect(texts(state)).toEqual(['Вы используете: Краюха хлеба (+3 здоровья)']);
  });

  it('нельзя использовать предмет, которого нет', () => {
    const state = newGame();
    expect(engine.applyItem(state, 'bread')).toBe(state);
  });

  it('золу вне боя не использовать — она пригодится в бою', () => {
    const state = withSession(newGame(), {
      hero: { ...sessionOf(newGame()).hero, hp: 3, inventory: ['ash'] },
    });
    expect(itemBlocked(sessionOf(state).hero, 'ash', false)).toBe('Пригодится в бою');
    expect(itemBlocked(sessionOf(state).hero, 'ash', true)).toBeNull();
    expect(engine.applyItem(state, 'ash')).toBe(state);
  });
});

describe('бой', () => {
  it('победа: опыт и «Продолжить» ведёт в сцену после боя', () => {
    let state = play(newGame(), 'Подойти', 'Ждать', 'драке');
    expect(state.session?.fight?.enemy.name).toBe('Вася');
    // пока идёт бой, варианты сцены не выбираются
    expect(engine.choose(state, { text: 'x', next: 'st0' }, constant(0))).toBe(state);
    state = winFight(state);
    expect(state.session).toMatchObject({ sceneId: 'st3', fight: null, hero: { xp: 10 } });
    expect(texts(state)).toEqual(['+10 опыта']);
  });

  it('поражение: «Продолжить» возвращает в меню', () => {
    let state = play(newGame(), 'Подойти', 'Ждать', 'драке');
    state = withSession(state, { hero: { ...sessionOf(state).hero, hp: 1 } });
    state = engine.fightAction(state, 'defend', sequence(0.99, 0.99, 0.99));
    expect(state.session?.fight?.result).toBe('lose');
    expect(engine.closeFight(state)).toEqual({ screen: 'menu', session: null });
  });

  it('поражение: можно попробовать снова — сцена перед боем, здоровье как до боя', () => {
    const before = play(newGame(), 'Подойти', 'Ждать');
    let state = play(before, 'драке');
    state = withSession(state, { hero: { ...sessionOf(state).hero, hp: 1 } });
    state = engine.fightAction(state, 'defend', sequence(0.99, 0.99, 0.99));
    expect(engine.canRetryFight(sessionOf(state))).toBe(true);
    const retried = engine.retryFight(state);
    expect(retried.session).toMatchObject({
      sceneId: 'st2',
      fight: null,
      time: sessionOf(before).time,
      hero: { hp: 10 },
    });
    expect(texts(retried)).toEqual(['Вы собираетесь с силами. Ещё одна попытка.']);
  });

  it('в режиме «Одна жизнь» второй попытки нет', () => {
    let state = engine.startNewGame(engine.initialState, {
      name: 'Ивар',
      classId: 'warrior',
      portrait: 'img/hero-1.jpg',
      oneLife: true,
    });
    state = play(state, 'Подойти', 'Ждать', 'драке');
    state = withSession(state, { hero: { ...sessionOf(state).hero, hp: 1 } });
    state = engine.fightAction(state, 'defend', sequence(0.99, 0.99, 0.99));
    expect(engine.canRetryFight(sessionOf(state))).toBe(false);
    expect(engine.retryFight(state)).toBe(state);
  });
});
