import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { atTime } from '@/game/time';
import type { Choice, GameState } from '@/game/types';
import { npcsHere } from '@/game/world';
import { constant, sessionOf, withSession, noticeTexts, ru } from './helpers';

function newGame(): GameState {
  return engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId: 'warrior',
    portrait: 'img/hero-1.jpg',
  });
}

function choiceTexts(state: GameState): string[] {
  const session = sessionOf(state);
  const ctx = engine.textContext(session);
  return engine.availableChoices(session).map((c) => ru.label(c.text, ctx));
}

function pick(state: GameState, fragment: string): Choice {
  const session = sessionOf(state);
  const ctx = engine.textContext(session);
  const choice = engine
    .availableChoices(session)
    .find((c) => ru.label(c.text, ctx).includes(fragment));
  if (!choice)
    throw new Error('Нет варианта «' + fragment + '»: ' + choiceTexts(state).join(' | '));
  return choice;
}

/** Куда ведёт вариант (для вариантов-переходов). */
function nextOf(choice: Choice): string | undefined {
  return 'next' in choice ? choice.next : undefined;
}

function play(state: GameState, ...fragments: string[]): GameState {
  return fragments.reduce((s, f) => engine.choose(s, pick(s, f), constant(0.5)), state);
}

/** Герой свободно ходит: в локации в заданное время. */
function roaming(locationId: 'courtyard' | 'hall' | 'cell', day: number, hour: number, minute = 0) {
  return withSession(newGame(), { sceneId: null, locationId, time: atTime(day, hour, minute) });
}

describe('пролог', () => {
  it('начинается в 16:00 и заканчивается свободным перемещением во дворе', () => {
    let state = newGame();
    expect(sessionOf(state).time).toBe(atTime(1, 16));
    state = play(state, 'Подойти', 'Ждать', 'Поднырнуть');
    // проверка при 0.5 у Воина (35%) — провал, дальше драка; пропустим её
    state = withSession(state, { sceneId: 'st3', fight: null });
    state = play(state, 'Направиться', 'Меня зовут', 'Куда мне идти', 'Осмотреться');
    const session = sessionOf(state);
    expect(session).toMatchObject({ sceneId: null, locationId: 'courtyard' });
    expect(session.time).toBeGreaterThan(atTime(1, 16, 30));
    expect(session.time).toBeLessThan(atTime(1, 18));
  });
});

describe('локации', () => {
  it('во дворе днём: разговор с Торвином, выходы, закрытая башня, ожидание', () => {
    const state = roaming('courtyard', 1, 17);
    expect(choiceTexts(state)).toEqual([
      'Поговорить с Торвином',
      'Пойти: Трапезная (5 мин)',
      'Пойти: Келья (10 мин)',
      'Подождать час',
    ]);
    const cell = pick(state, 'Келья');
    expect(cell.disabled).toBe('Торвин обещал показать, где спать, после ужина');
    // закрытый выход не выбирается
    expect(engine.choose(state, cell, constant(0))).toBe(state);
  });

  it('башня открывается, когда герой знает, где келья', () => {
    const state = withSession(roaming('courtyard', 1, 17), { flags: { knowsCell: true } });
    expect(pick(state, 'Келья').disabled).toBeUndefined();
    const moved = engine.choose(state, pick(state, 'Келья'), constant(0));
    expect(sessionOf(moved)).toMatchObject({ locationId: 'cell', time: atTime(1, 17, 10) });
  });

  it('персонажи по расписанию: днём во дворе, вечером в трапезной, ночью нигде', () => {
    expect(npcsHere(sessionOf(roaming('courtyard', 1, 12)))).toEqual(['torvin', 'vasya']);
    expect(npcsHere(sessionOf(roaming('courtyard', 1, 17)))).toEqual(['torvin']);
    expect(npcsHere(sessionOf(roaming('courtyard', 1, 19)))).toEqual([]);
    expect(npcsHere(sessionOf(roaming('hall', 1, 19)))).toEqual(['torvin', 'vasya']);
    expect(npcsHere(sessionOf(roaming('hall', 1, 21)))).toEqual(['torvin']);
    expect(npcsHere(sessionOf(roaming('hall', 1, 23)))).toEqual([]);
  });

  it('окно в келье показывает разное днём и ночью', () => {
    const day = roaming('cell', 2, 12);
    expect(nextOf(pick(day, 'окно'))).toBe('window_day');
    const night = roaming('cell', 1, 23);
    expect(nextOf(pick(night, 'окно'))).toBe('st7_1');
    const seen = withSession(night, { flags: { sawLights: true } });
    expect(nextOf(pick(seen, 'окно'))).toBe('window_night');
  });
});

describe('события', () => {
  it('ужин начинается, когда герой в трапезной с 18 до 21', () => {
    let state = roaming('hall', 1, 17);
    // до ужина пусто: ожидание доводит до 18:00, и событие прерывает его
    state = play(state, 'Подождать');
    expect(sessionOf(state)).toMatchObject({
      sceneId: 'st6',
      time: atTime(1, 18),
      events: ['dinner'],
    });
  });

  it('вход в трапезную вечером сразу начинает ужин', () => {
    const state = play(roaming('courtyard', 1, 18, 30), 'Трапезная');
    expect(sessionOf(state)).toMatchObject({ sceneId: 'st6', locationId: 'hall' });
  });

  it('после ужина Торвин ведёт в келью: башня открыта, герой в келье', () => {
    let state = withSession(roaming('hall', 1, 18), { sceneId: 'st6' });
    state = play(state, 'Отказаться');
    expect(sessionOf(state)).toMatchObject({
      sceneId: 'st7',
      locationId: 'cell',
      flags: { knowsCell: true },
    });
    state = play(state, 'Осмотреться');
    expect(sessionOf(state).sceneId).toBeNull();
    expect(choiceTexts(state)).toContain('Лечь спать до утра');
  });

  it('опоздал на ужин — Торвин сам находит героя', () => {
    const state = play(roaming('courtyard', 1, 20, 30), 'Подождать');
    expect(sessionOf(state)).toMatchObject({ sceneId: 'torvin_late', time: atTime(1, 21) });
  });

  it('событие срабатывает один раз', () => {
    const state = withSession(roaming('hall', 1, 19), { events: ['dinner'] });
    expect(sessionOf(play(state, 'Подождать')).sceneId).toBeNull();
  });

  it('сон в келье лечит и прерывается тревогой в час ночи', () => {
    let state = withSession(roaming('cell', 1, 21, 30), {
      events: ['dinner'],
      flags: { knowsCell: true },
      hero: { ...sessionOf(newGame()).hero, hp: 3 },
    });
    state = play(state, 'Лечь спать');
    const session = sessionOf(state);
    expect(session).toMatchObject({ sceneId: 'st8', time: atTime(2, 1) });
    expect(session.hero.hp).toBe(3 + 3); // 21:30 → 01:00: три полных часа
    expect(noticeTexts(session.notices)).toEqual([
      'Вы проспали 3 ч и проснулись (+3 здоровья)',
      'Журнал: новая цель «Тревога»',
    ]);
    const text = engine.resolveText(engine.getScene('st8').text, engine.textContext(session));
    expect(text).toContain('Вас будит протяжный звук рога');
  });

  it('событие начинается ровно в свой час, даже если ждать начали не с ровного времени', () => {
    const state = withSession(roaming('cell', 1, 20, 55), {
      events: ['dinner'],
      flags: { knowsCell: true },
    });
    expect(sessionOf(play(state, 'Лечь спать')).time).toBe(atTime(2, 1));
  });

  it('тревога застаёт бодрствующего героя во дворе — текст другой', () => {
    const state = withSession(roaming('courtyard', 2, 0, 50), {
      events: ['dinner'],
      flags: { knowsCell: true },
    });
    const session = sessionOf(play(state, 'Подождать'));
    expect(session.sceneId).toBe('st8');
    const text = engine.resolveText(engine.getScene('st8').text, engine.textContext(session));
    expect(text).toContain('Над крепостью раздаётся протяжный звук рога');
  });
});

describe('распорядок дня', () => {
  it('тренировка: 2 часа, опыт и сцена; второй раз за день — закрыто, назавтра снова можно', () => {
    let state = roaming('courtyard', 1, 10);
    state = play(state, 'Тренироваться');
    expect(sessionOf(state)).toMatchObject({
      sceneId: 'routine_training',
      time: atTime(1, 12),
      hero: { xp: 5 },
    });
    expect(noticeTexts(sessionOf(state).notices)).toContain('+5 опыта');

    state = play(state, 'Перевести дух');
    expect(pick(state, 'Тренироваться').disabled).toEqual({ id: 'doneToday' });
    expect(engine.choose(state, pick(state, 'Тренироваться'), constant(0))).toBe(state);

    const tomorrow = withSession(state, { time: atTime(2, 10) });
    expect(pick(tomorrow, 'Тренироваться').disabled).toBeUndefined();
  });

  it('занятия — только в свои часы', () => {
    expect(choiceTexts(roaming('courtyard', 1, 20)).join()).not.toContain('Тренироваться');
    expect(choiceTexts(roaming('courtyard', 1, 20)).join()).toContain('жаровни');
    expect(choiceTexts(roaming('hall', 1, 12)).join()).toContain('на кухне');
  });

  it('кухня даёт хлеб, жаровня лечит', () => {
    const kitchen = play(roaming('hall', 1, 12), 'на кухне');
    expect(sessionOf(kitchen).hero.inventory).toEqual(['bread']);
    const cold = withSession(roaming('courtyard', 1, 20), {
      hero: { ...sessionOf(newGame()).hero, hp: 5 },
    });
    expect(sessionOf(play(cold, 'жаровни')).hero.hp).toBe(7);
  });
});
