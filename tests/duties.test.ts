// Наряды: доска у ворот выдаёт работу на день, работа у точки интереса её выполняет,
// невыполненная к ночи портит отношение Торвина.
import { describe, expect, it } from 'vitest';
import { DUTY_IDS } from '@/content/duties';
import * as engine from '@/game/engine';
import { journal } from '@/game/journal';
import { atTime } from '@/game/time';
import type { Choice, GameState, LocationId, Session, SpotId } from '@/game/types';
import { constant, noticeTexts, ru, sessionOf, withSession } from './helpers';

function at(
  locationId: LocationId,
  spotId: SpotId | null,
  hour: number,
  patch: Partial<Session> = {},
) {
  const state = engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId: 'warrior',
    portrait: 'img/hero-1.jpg',
  });
  return withSession(state, {
    sceneId: null,
    locationId,
    spotId,
    time: atTime(2, hour),
    flags: { joined: true, knowsCell: true },
    ...patch,
  });
}

function texts(state: GameState): string[] {
  const session = sessionOf(state);
  const ctx = engine.textContext(session);
  return engine.availableChoices(session).map((c) => ru.label(c.text, ctx));
}

function pick(state: GameState, fragment: string): Choice {
  const ctx = engine.textContext(sessionOf(state));
  const choice = engine
    .availableChoices(sessionOf(state))
    .find((c) => ru.label(c.text, ctx).includes(fragment));
  if (!choice) throw new Error('Нет варианта «' + fragment + '»: ' + texts(state).join(' | '));
  return choice;
}

/** rng = 0 — первый из оставшихся нарядов. */
function play(state: GameState, ...fragments: string[]): GameState {
  return fragments.reduce((s, f) => engine.choose(s, pick(s, f), constant(0)), state);
}

const dutyEntry = (state: GameState) =>
  journal(sessionOf(state)).find((entry) => entry.title === 'Наряд на сегодня');

describe('наряды', () => {
  it('у доски — наряд на день: сцена, цель в журнале, работа видна только там, где её делать', () => {
    const taken = play(at('gateyard', 'board', 8), 'Узнать свой наряд');
    expect(sessionOf(taken)).toMatchObject({
      sceneId: 'duty_firewood',
      duties: [{ id: 'firewood', day: 2, status: 'active' }],
    });
    expect(noticeTexts(sessionOf(taken).notices)).toContain(
      'Журнал: новая цель «Наряд на сегодня»',
    );
    expect(dutyEntry(taken)).toMatchObject({
      done: false,
      notes: [expect.stringContaining('Дрова на кухню')],
    });
    // второй раз за день доска наряд не даёт
    const board = withSession(taken, { sceneId: null, spotId: 'board' });
    expect(pick(board, 'Узнать свой наряд').disabled).toEqual({ id: 'doneToday' });
    // чужой работы нет, своя — у кухни
    const drill = withSession(taken, { sceneId: null, locationId: 'courtyard', spotId: 'drill' });
    expect(texts(drill).some((text) => text.includes('наряд'))).toBe(false);
    const kitchen = withSession(taken, { sceneId: null, locationId: 'hall', spotId: 'kitchen' });
    expect(texts(kitchen)).toContain('Наколоть дров для кухни (1 ч, наряд)');
  });

  it('работа выполняет наряд: награда, цель выполнена, второй раз не видна', () => {
    const taken = play(at('gateyard', 'board', 8), 'Узнать свой наряд');
    const kitchen = withSession(taken, { sceneId: null, locationId: 'hall', spotId: 'kitchen' });
    const done = play(kitchen, 'Наколоть дров');
    const session = sessionOf(done);
    expect(session).toMatchObject({
      sceneId: 'duty_firewood_done',
      duties: [{ id: 'firewood', status: 'done' }],
      hero: { xp: 5 },
    });
    expect(session.hero.inventory).toContain('bread');
    expect(noticeTexts(session.notices)).toContain('Цель выполнена: «Наряд на сегодня»');
    const again = withSession(done, { sceneId: null, spotId: 'kitchen' });
    expect(texts(again).some((text) => text.includes('Наколоть'))).toBe(false);
    // назавтра выполненный наряд ничем не грозит, запись из журнала уходит
    const nextDay = play(
      withSession(done, { sceneId: null, time: atTime(2, 23, 30) }),
      'Подождать',
    );
    expect(sessionOf(nextDay).relations.torvin).toBeUndefined();
    expect(dutyEntry(nextDay)).toBeUndefined();
  });

  it('невыполненный к ночи наряд пропущен: Торвин недоволен', () => {
    const taken = play(at('gateyard', 'board', 8), 'Узнать свой наряд');
    const late = withSession(taken, { sceneId: null, spotId: null, time: atTime(2, 23, 30) });
    const after = sessionOf(play(late, 'Подождать'));
    expect(after.duties).toEqual([{ id: 'firewood', day: 2, status: 'missed' }]);
    expect(after.relations.torvin).toBe(-1);
    expect(noticeTexts(after.notices)).toEqual(
      expect.arrayContaining(['Вчерашний наряд так и не выполнен', 'Торвин: отношение ухудшилось']),
    );
    // пропуск засчитывается один раз
    expect(sessionOf(play(withSession(late, after), 'Подождать')).relations.torvin).toBe(-1);
  });

  it('выполненные наряды не повторяются; когда всё сделано, доска пуста', () => {
    const doneAll = DUTY_IDS.map((id, day) => ({ id, day: -day, status: 'done' as const }));
    const lastLeft = at('gateyard', 'board', 8, { duties: doneAll.slice(1) });
    expect(sessionOf(play(lastLeft, 'Узнать свой наряд')).sceneId).toBe('duty_firewood');
    const nothing = at('gateyard', 'board', 8, { duties: doneAll });
    expect(sessionOf(play(nothing, 'Узнать свой наряд'))).toMatchObject({
      sceneId: 'duty_none',
      duties: doneAll,
    });
  });

  it('наряд узнают утром; позже доска показывает часы', () => {
    const noon = at('gateyard', 'board', 14);
    expect(pick(noon, 'Узнать свой наряд').disabled).toEqual({ id: 'hours', hours: [6, 12] });
  });
});
