// Люди крепости: повар Ульф и его ключ, Мирко, кости на хлеб и угощение для часового.
import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { journal } from '@/game/journal';
import { atTime } from '@/game/time';
import type { Choice, Flags, GameState, LocationId, Session, SpotId } from '@/game/types';
import { constant, noticeTexts, ru, sessionOf, testHero, withSession } from './helpers';

function at(
  locationId: LocationId,
  spotId: SpotId | null,
  hour: number,
  flags: Flags = {},
  patch: Partial<Session> = {},
): GameState {
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
    flags: { joined: true, knowsCell: true, ...flags },
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

function play(state: GameState, rng: number, ...fragments: string[]): GameState {
  return fragments.reduce((s, f) => engine.choose(s, pick(s, f), constant(rng)), state);
}

describe('повар Ульф', () => {
  it('ключ от кладовой: поручение, поиск в золе, награда и рассказ про Эрика', () => {
    let state = play(at('hall', null, 10), 0.99, 'Поговорить с поваром', 'Может, помочь');
    expect(sessionOf(state).sceneId).toBe('cook_key');
    expect(noticeTexts(sessionOf(state).notices)).toContain(
      'Журнал: новая цель «Ключ от кладовой»',
    );
    // в золе ключ находится проверкой чутья
    state = play(state, 0.99, 'Поищу', 'Ничего, не буду мешать', 'Очаг');
    state = play(state, 0.1, 'Поискать в золе');
    expect(sessionOf(state)).toMatchObject({ sceneId: 'hearth_key', flags: { foundKey: true } });
    state = play(state, 0.99, 'Отряхнуть руки', 'Поговорить с поваром', 'Вот ваш ключ');
    const session = sessionOf(state);
    expect(session).toMatchObject({ sceneId: 'cook_key_return', relations: { cook: 1 } });
    expect(session.hero.inventory).toEqual(['bread', 'bread']);
    expect(journal(session).find((e) => e.title === 'Ключ от кладовой')?.done).toBe(true);
    state = play(state, 0.99, 'Спасибо', 'Эрик ничего');
    expect(sessionOf(state).sceneId).toBe('cook_erik');
  });

  it('знакомство: до разговора повара не называют по имени', () => {
    expect(texts(at('hall', null, 10))).toContain('Поговорить с поваром');
    const met = play(at('hall', null, 10), 0.99, 'Поговорить с поваром', 'Ничего, не буду мешать');
    expect(sessionOf(met).flags.metCook).toBe(true);
  });
});

describe('Мирко', () => {
  it('до знакомства — «долговязый новобранец», потом по имени', () => {
    const state = at('courtyard', null, 10);
    expect(texts(state)).toContain('Поговорить с долговязым новобранцем');
    const met = play(state, 0.99, 'Поговорить с долговязым', 'Бывай');
    expect(texts(met)).toContain('Поговорить с Мирко');
  });
});

describe('кости в казарме', () => {
  it('ставка — краюха: выигрыш две, проигрыш — ничего; только вечером и раз в день', () => {
    const hero = testHero('warrior', { inventory: ['bread'] });
    const state = at('barracks', 'dice', 21, {}, { hero });
    const won = sessionOf(play(state, 0.1, 'Сыграть на краюху'));
    expect(won).toMatchObject({ sceneId: 'dice_win', hero: { inventory: ['bread', 'bread'] } });
    expect(noticeTexts(won.notices)).toContain('Отдано: Краюха хлеба');
    const lost = sessionOf(play(state, 0.99, 'Сыграть на краюху'));
    expect(lost).toMatchObject({ sceneId: 'dice_lose', hero: { inventory: [] } });
    // без хлеба не сыграть
    expect(texts(at('barracks', 'dice', 21))).not.toContain('Сыграть на краюху хлеба');
    // днём игры нет
    expect(texts(at('barracks', null, 12))).not.toContain('Игра в кости');
  });
});

describe('часовой у лестницы', () => {
  it('за флягу пускает на стену ночью', () => {
    const hero = testHero('warrior', { inventory: ['flask'] });
    const state = at('courtyard', 'stairs', 22, {}, { hero });
    const up = sessionOf(play(state, 0.99, 'Угостить часового'));
    expect(up).toMatchObject({
      sceneId: 'wall_bribe',
      locationId: 'wall',
      hero: { inventory: [] },
    });
  });
});
