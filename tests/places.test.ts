// Места крепости первой главы: двор у ворот, казарма, кузница и стена — и как они продолжают
// зацепки журнала о пропавших новобранцах и огнях в лесу.
import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { journal } from '@/game/journal';
import { atTime } from '@/game/time';
import type { Choice, Flags, GameState, LocationId, SpotId } from '@/game/types';
import { constant, noticeTexts, ru, sessionOf, withSession } from './helpers';

function newGame(): GameState {
  return engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId: 'rogue',
    portrait: 'img/hero-1.jpg',
  });
}

/**
 * У точки интереса в месте, в заданный час первого дня, с решениями. Герой уже знает свою келью:
 * иначе после 21:00 его перехватит событие «Торвин нашёл вас» (опоздал на ужин).
 */
function at(locationId: LocationId, spotId: SpotId | null, hour: number, flags: Flags = {}) {
  return withSession(newGame(), {
    sceneId: null,
    locationId,
    spotId,
    time: atTime(1, hour),
    flags: { joined: true, knowsCell: true, ...flags },
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

const notes = (state: GameState, title: string) =>
  journal(sessionOf(state)).find((entry) => entry.title === title)?.notes ?? [];

describe('двор у ворот', () => {
  it('доска нарядов открывает зацепку о пропавших и без Васи', () => {
    const state = play(at('gateyard', 'board', 12), 0.5, 'Прочитать наряды');
    expect(sessionOf(state).sceneId).toBe('gate_board');
    expect(noticeTexts(sessionOf(state).notices)).toContain(
      'Журнал: новая зацепка «Пропавшие новобранцы»',
    );
    expect(notes(state, 'Пропавшие новобранцы')).toEqual([
      expect.stringContaining('Эрик и Мартин'),
    ]);
    // второй раз не читается
    expect(texts(withSession(play(state, 0.5, 'Отойти'), { spotId: 'board' }))).toEqual(['Отойти']);
  });

  it('Стенли: тот дозор провожал Торвин', () => {
    const state = play(
      at('gateyard', 'guardhouse', 22, { readBoard: true }),
      0.5,
      'Спросить Стенли',
    );
    expect(notes(state, 'Пропавшие новобранцы').at(-1)).toContain('провожал сам Торвин');
  });
});

describe('казарма', () => {
  it('пустые нары: записка при удачной проверке чутья, второй попытки нет', () => {
    const found = play(at('barracks', 'emptyBunks', 22, { readBoard: true }), 0.1, 'Обыскать');
    expect(sessionOf(found)).toMatchObject({
      sceneId: 'barracks_note',
      flags: { foundNote: true },
    });
    expect(notes(found, 'Пропавшие новобранцы').at(-1)).toContain('три вспышки');

    const empty = play(at('barracks', 'emptyBunks', 22), 0.99, 'Обыскать');
    expect(sessionOf(empty)).toMatchObject({ sceneId: 'barracks_nothing' });
    expect(sessionOf(empty).flags.foundNote).toBeUndefined();
    expect(texts(withSession(play(empty, 0.5, 'Отойти'), { spotId: 'emptyBunks' }))).toEqual([
      'Отойти',
    ]);
  });

  it('вечером в казарме Вася', () => {
    const session = sessionOf(at('barracks', null, 22));
    expect(texts(at('barracks', null, 22))).toContain('Поговорить с Васей');
    expect(session.locationId).toBe('barracks');
  });
});

describe('кузница', () => {
  it('кузнец по расписанию; знакомство — в журнале', () => {
    expect(texts(at('smithy', null, 23))).not.toContain('Поговорить с кузнецом');
    let state = play(at('smithy', null, 20), 0.5, 'Поговорить с кузнецом');
    expect(sessionOf(state).sceneId).toBe('smith_talk');
    state = play(state, 0.5, 'Ничего, пойду');
    expect(sessionOf(state).flags.metSmith).toBe(true);
  });

  it('зубило вскрывает сундук, который не поддался силой', () => {
    let state = play(
      at('smithy', null, 19, { chestStuck: true, triedChest: true }),
      0.5,
      'Поговорить с кузнецом',
    );
    state = play(state, 0.5, 'Попросить инструмент', 'Покачать мехи', 'Взять зубило');
    expect(sessionOf(state)).toMatchObject({
      sceneId: 'smith_talk',
      time: atTime(1, 19, 35),
      flags: { gotChisel: true },
    });
    expect(texts(state)).not.toContain('Попросить инструмент, чтобы вскрыть сундук в келье');

    const cell = withSession(state, { sceneId: null, locationId: 'cell', spotId: 'chest' });
    const opened = play(cell, 0.5, 'Поддеть замок');
    expect(sessionOf(opened)).toMatchObject({
      sceneId: 'st7_2',
      flags: { foundKnife: true },
      hero: { weaponId: 'knife' },
    });
    expect(notes(opened, 'Нож из сундука').at(-1)).toContain('зубилом');
  });

  it('фонарь на верстаке, потом рассказ кузнеца', () => {
    let state = play(at('smithy', 'bench', 20), 0.5, 'Рассмотреть фонарь');
    expect(sessionOf(state).flags.sawLantern).toBe(true);
    state = withSession(state, {
      sceneId: null,
      spotId: null,
      flags: { ...sessionOf(state).flags, readBoard: true },
    });
    state = play(state, 0.5, 'Поговорить с кузнецом', 'Спросить про фонарь');
    expect(sessionOf(state).sceneId).toBe('smith_lantern');
    expect(notes(state, 'Пропавшие новобранцы').at(-1)).toContain('фонарь со шторкой');
  });
});

describe('стена', () => {
  it('днём не пускают, ночью можно проскользнуть', () => {
    expect(texts(at('courtyard', 'stairs', 12))).toEqual(['Подняться на стену', 'Отойти']);
    expect(texts(at('courtyard', 'stairs', 22))).toEqual([
      'Проскользнуть наверх, пока часовой дремлет',
      'Отойти',
    ]);
    // выход на стену закрыт всегда
    const exit = pick(at('courtyard', null, 22), 'Стена');
    expect(exit.disabled).toBe('Наверх пускают только дозорных');
  });

  it('удачно — герой на стене и видит сигнал с башни; зацепка об огнях открывается', () => {
    let state = play(at('courtyard', 'stairs', 22, { foundNote: true }), 0.1, 'Проскользнуть');
    expect(sessionOf(state)).toMatchObject({ sceneId: 'wall_sneak', locationId: 'wall' });
    state = play(state, 0.5, 'Осмотреться', 'Дозорная площадка', 'Смотреть на перевал');
    expect(sessionOf(state)).toMatchObject({ sceneId: 'wall_signal', flags: { sawSignal: true } });
    const text = ru.text(engine.getScene('wall_signal').text, engine.textContext(sessionOf(state)));
    expect(text).toContain('«Третья стража — три вспышки»');
    expect(noticeTexts(sessionOf(state).notices)).toContain('Журнал: новая зацепка «Огни в лесу»');
    // во второй раз — темнота
    state = play(state, 0.5, 'Отойти от зубцов', 'Дозорная площадка', 'Смотреть на перевал');
    expect(sessionOf(state).sceneId).toBe('wall_dark');
    // спуститься можно всегда
    state = play(state, 0.5, 'Отойти от зубцов', 'Пойти: Внутренний двор');
    expect(sessionOf(state).locationId).toBe('courtyard');
  });

  it('неудачно — ловит часовой, Торвин недоволен, больше не пробраться', () => {
    const caught = play(at('courtyard', 'stairs', 22), 0.99, 'Проскользнуть');
    expect(sessionOf(caught)).toMatchObject({
      sceneId: 'wall_caught',
      relations: { torvin: -1 },
      flags: { caughtOnWall: true },
    });
    const later = withSession(caught, { sceneId: null, spotId: 'stairs', time: atTime(2, 22) });
    expect(texts(later)).toEqual(['Отойти']);
  });

  it('тревога вспоминает сигнал со стены', () => {
    const session = { ...sessionOf(newGame()), flags: { sawSignal: true as const } };
    const text = ru.text(engine.getScene('st8').text, engine.textContext(session));
    expect(text).toContain('три вспышки — и лес ответил');
  });
});
