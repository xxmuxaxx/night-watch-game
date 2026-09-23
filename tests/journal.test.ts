import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { activeGoals, journal, journalNotices } from '@/game/journal';
import type { Flags, Session } from '@/game/types';
import { sessionOf, noticeTexts } from './helpers';

function newSession(patch: Partial<Session> = {}): Session {
  const state = engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId: 'warrior',
    portrait: 'img/hero-1.jpg',
  });
  return { ...sessionOf(state), notices: [], ...patch };
}

const withFlags = (flags: Flags, patch: Partial<Session> = {}) => newSession({ flags, ...patch });

const titles = (session: Session) => journal(session).map((entry) => entry.title);

describe('журнал', () => {
  it('в начале игры одна цель — войти в крепость', () => {
    const [goal, ...rest] = journal(newSession());
    expect(rest).toEqual([]);
    expect(goal).toMatchObject({
      kind: 'goal',
      title: 'Новая жизнь',
      done: false,
      hint: 'Войти в крепость',
    });
    expect(goal?.notes).toHaveLength(1);
  });

  it('знакомство с Торвином выполняет первую цель и открывает следующую', () => {
    const session = withFlags({ joined: true });
    expect(journal(session)[0]).toMatchObject({ title: 'Новая жизнь', done: true, hint: null });
    expect(activeGoals(session).map((goal) => goal.title)).toEqual(['Первый вечер']);
  });

  it('записи зависят от решений', () => {
    const lights = (flags: Flags) =>
      journal(withFlags(flags)).find((entry) => entry.title === 'Огни в лесу')?.notes ?? [];
    expect(lights({})).toEqual([]);
    expect(lights({ sawLights: true })).toHaveLength(1);
    expect(lights({ sawLights: true, triedLook: true }).at(-1)).toContain('не удалось');
    expect(lights({ sawLights: true, triedLook: true, sawCloaks: true }).at(-1)).toContain(
      'тёмном плаще',
    );
  });

  it('цель может открыться событием', () => {
    expect(titles(withFlags({ joined: true, knowsCell: true }))).not.toContain('Тревога');
    expect(titles(withFlags({ joined: true }, { events: ['alarm'] }))).toContain('Тревога');
  });

  it('сообщения: новая цель, новая зацепка, новая запись, выполненная цель', () => {
    const before = withFlags({ joined: true });
    const texts = (flags: Flags) =>
      noticeTexts(journalNotices(before, withFlags({ joined: true, ...flags })));
    expect(texts({})).toEqual([]);
    expect(texts({ vasyaFriend: true })).toEqual(['Журнал: новая зацепка «Пропавшие новобранцы»']);
    expect(texts({ ate: true })).toEqual(['Журнал: новая запись в «Первый вечер»']);
    expect(texts({ knowsCell: true })).toEqual(['Цель выполнена: «Первый вечер»']);
  });

  it('выбор в сюжете сообщает об изменениях в журнале', () => {
    const session: Session = {
      ...newSession(),
      sceneId: null,
      locationId: 'cell',
      spotId: 'window',
      time: 22 * 60,
    };
    const state = { ...engine.initialState, screen: 'story' as const, session };
    const window = engine
      .availableChoices(session)
      .find((choice) => 'next' in choice && choice.next === 'st7_1');
    if (!window) throw new Error('Нет окна');
    const after = engine.choose(state, window, () => 0.5);
    expect(noticeTexts(sessionOf(after).notices)).toEqual(['Журнал: новая зацепка «Огни в лесу»']);
  });
});
