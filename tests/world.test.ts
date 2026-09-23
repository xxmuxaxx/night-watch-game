import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { atTime } from '@/game/time';
import type { Choice, GameState, LocationId } from '@/game/types';
import { fortressMap, route } from '@/game/map';
import { isNew, npcsHere, roamGroups } from '@/game/world';
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

const ctxOf = (state: GameState) => engine.textContext(sessionOf(state));

/** Куда ведёт вариант (для вариантов-переходов). */
function nextOf(choice: Choice): string | undefined {
  return 'next' in choice ? choice.next : undefined;
}

function play(state: GameState, ...fragments: string[]): GameState {
  return fragments.reduce((s, f) => engine.choose(s, pick(s, f), constant(0.5)), state);
}

/** Герой свободно ходит: в локации в заданное время. */
function roaming(locationId: LocationId, day: number, hour: number, minute = 0) {
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
      'Плац',
      'Лестница на стену',
      'Пойти: Трапезная (5 мин)',
      'Пойти: Двор у ворот (3 мин)',
      'Пойти: Казарма (3 мин)',
      'Пойти: Кузница (4 мин)',
      'Пойти: Келья (10 мин)',
      'Пойти: Стена (5 мин)',
      'Подождать час',
    ]);
    expect(roamGroups(sessionOf(state)).map((group) => group.kind)).toEqual([
      'people',
      'spots',
      'paths',
      'time',
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
    const day = withSession(roaming('cell', 2, 12), { spotId: 'window' });
    expect(nextOf(pick(day, 'окно'))).toBe('window_day');
    const night = withSession(roaming('cell', 1, 23), { spotId: 'window' });
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
    state = play(state, 'Плац', 'Тренироваться');
    expect(sessionOf(state)).toMatchObject({
      sceneId: 'routine_training',
      time: atTime(1, 12),
      hero: { xp: 5 },
    });
    expect(noticeTexts(sessionOf(state).notices)).toContain('+5 опыта');

    state = play(state, 'Перевести дух', 'Плац');
    expect(pick(state, 'Тренироваться').disabled).toEqual({ id: 'doneToday' });
    expect(engine.choose(state, pick(state, 'Тренироваться'), constant(0))).toBe(state);

    const tomorrow = withSession(state, { time: atTime(2, 10) });
    expect(pick(tomorrow, 'Тренироваться').disabled).toBeUndefined();
  });

  it('занятия — только в свои часы; вне их видны закрытыми с часами', () => {
    const evening = play(roaming('courtyard', 1, 20), 'Плац');
    expect(pick(evening, 'Тренироваться').disabled).toEqual({ id: 'hours', hours: [8, 17] });
    expect(ru.label({ id: 'hours', hours: [8, 17] }, ctxOf(evening))).toBe(
      'Только с 8:00 до 17:00',
    );
    expect(engine.choose(evening, pick(evening, 'Тренироваться'), constant(0))).toBe(evening);
    expect(pick(play(roaming('gateyard', 1, 20), 'Жаровня'), 'жаровни').disabled).toBeUndefined();
    expect(pick(play(roaming('hall', 1, 12), 'Кухня'), 'на кухне').disabled).toBeUndefined();
  });

  it('кухня даёт хлеб, жаровня лечит', () => {
    const kitchen = play(roaming('hall', 1, 12), 'Кухня', 'на кухне');
    expect(sessionOf(kitchen).hero.inventory).toEqual(['bread']);
    const cold = withSession(roaming('gateyard', 1, 20), {
      hero: { ...sessionOf(newGame()).hero, hp: 5 },
    });
    expect(sessionOf(play(cold, 'Жаровня', 'жаровни')).hero.hp).toBe(7);
  });
});

describe('точки интереса', () => {
  it('подойти и отойти; у точки — её действия и «Отойти», без разговоров и выходов', () => {
    const state = roaming('courtyard', 1, 10);
    const drill = play(state, 'Плац');
    expect(sessionOf(drill)).toMatchObject({ spotId: 'drill', time: atTime(1, 10) });
    expect(choiceTexts(drill)).toEqual([
      'Тренироваться с новобранцами (2 ч, +5 опыта)',
      'Учебный бой с новобранцем (20 мин)',
      'Отойти',
    ]);
    expect(roamGroups(sessionOf(drill)).map((group) => group.kind)).toEqual(['spot']);
    expect(sessionOf(play(drill, 'Отойти')).spotId).toBeNull();
  });

  it('отмечает, где герой побывал: места и точки', () => {
    let state = withSession(roaming('courtyard', 1, 10), { visited: [] });
    state = play(state, 'Плац', 'Отойти', 'Трапезная');
    expect(sessionOf(state).visited).toEqual(['courtyard.drill', 'hall']);
  });

  it('закрытое действие у точки показывает причину и не выбирается', () => {
    const stairs = play(roaming('courtyard', 1, 10), 'Лестница');
    const climb = pick(stairs, 'Подняться');
    expect(climb.disabled).toBe('Наверх пускают только дозорных');
    expect(engine.choose(stairs, climb, constant(0))).toBe(stairs);
  });

  it('уход в другое место или в сцену сбрасывает точку', () => {
    const state = withSession(roaming('cell', 1, 12), { spotId: 'window' });
    expect(sessionOf(play(state, 'Выглянуть'))).toMatchObject({
      sceneId: 'window_day',
      spotId: null,
    });
  });
});

describe('учебные бои', () => {
  /** Начать бой на плацу и сразу закончить его с нужным итогом. */
  function spar(state: GameState, fragment: string, result: 'win' | 'lose'): GameState {
    const fighting = sessionOf(play(state, 'Плац', fragment));
    const fight = fighting.fight;
    if (!fight) throw new Error('Бой не начался');
    const hero = result === 'lose' ? { ...fighting.hero, hp: 0 } : fighting.hero;
    return engine.closeFight(
      withSession(state, { ...fighting, hero, fight: { ...fight, result } }),
    );
  }

  it('поражение не конец игры: сцена поражения, 1 здоровья, попробовать снова нельзя', () => {
    const state = roaming('courtyard', 1, 10);
    const fight = sessionOf(play(state, 'Плац', 'Учебный бой с новобранцем')).fight;
    expect(fight?.loseScene).toBe('spar_recruit_lose');
    const lost = withSession(state, { fight: fight && { ...fight, result: 'lose' } });
    expect(engine.canRetryFight(sessionOf(lost))).toBe(false);
    const after = sessionOf(spar(state, 'Учебный бой с новобранцем', 'lose'));
    expect(after).toMatchObject({ sceneId: 'spar_recruit_lose', fight: null });
    expect(after.hero.hp).toBe(1);
  });

  it('победа даёт опыт; второй раз за день нельзя', () => {
    const won = spar(roaming('courtyard', 1, 10), 'Учебный бой с новобранцем', 'win');
    expect(sessionOf(won)).toMatchObject({ sceneId: 'spar_recruit_win', hero: { xp: 3 } });
    const again = play(play(won, 'Перевести дух'), 'Плац');
    expect(pick(again, 'Учебный бой').disabled).toEqual({ id: 'doneToday' });
  });

  it('Торвин соглашается, только если расположен; первая победа поднимает его отношение', () => {
    expect(choiceTexts(play(roaming('courtyard', 1, 10), 'Плац'))).not.toContain(
      'Попросить Торвина об учебном бое (20 мин)',
    );
    const state = withSession(roaming('courtyard', 1, 10), { relations: { torvin: 1 } });
    const first = sessionOf(spar(state, 'Попросить Торвина', 'win'));
    expect(first).toMatchObject({
      sceneId: 'spar_torvin_first',
      relations: { torvin: 2 },
      flags: { beatTorvin: true },
    });
    // назавтра — обычная сцена, отношение больше не растёт
    const nextDay = withSession(state, { ...first, sceneId: null, time: atTime(2, 10) });
    const second = sessionOf(spar(nextDay, 'Попросить Торвина', 'win'));
    expect(second).toMatchObject({ sceneId: 'spar_torvin_win', relations: { torvin: 2 } });
  });
});

describe('темы разговоров', () => {
  it('неспрошенные темы помечены; спрошенная запоминается, а ответ ведёт обратно к вопросам', () => {
    const state = roaming('courtyard', 1, 10);
    expect(isNew(sessionOf(state), pick(state, 'Поговорить с Торвином'))).toBe(true);
    const talk = play(state, 'Поговорить с Торвином');
    expect(isNew(sessionOf(talk), pick(talk, 'Давно ты здесь'))).toBe(true);
    const answer = play(talk, 'Давно ты здесь');
    expect(sessionOf(answer)).toMatchObject({ sceneId: 'torvin_self', asked: ['torvin.self'] });
    const back = play(answer, 'Понятно');
    expect(sessionOf(back).sceneId).toBe('torvin_talk');
    expect(isNew(sessionOf(back), pick(back, 'Давно ты здесь'))).toBe(false);
    expect(isNew(sessionOf(back), pick(back, 'Что это за место'))).toBe(true);
    // повторный вопрос не дублирует тему
    expect(sessionOf(play(back, 'Давно ты здесь')).asked).toEqual(['torvin.self']);
  });

  it('когда спрашивать не о чем, разговор не помечен; находка открывает новую тему', () => {
    const asked = ['torvin.place', 'torvin.duties', 'torvin.self', 'torvin.vasya', 'torvin.leave'];
    const state = withSession(roaming('courtyard', 1, 10), {
      asked: [...asked, 'torvin.bed'],
    });
    expect(isNew(sessionOf(state), pick(state, 'Поговорить с Торвином'))).toBe(false);
    const found = withSession(state, { flags: { readBoard: true } });
    expect(isNew(sessionOf(found), pick(found, 'Поговорить с Торвином'))).toBe(true);
  });

  it('допытываться у Торвина можно раз; без симпатии он злится', () => {
    const state = play(
      withSession(roaming('courtyard', 1, 10), { flags: { talkedStanley: true } }),
      'Поговорить с Торвином',
    );
    const pressed = play(state, 'Стенли говорит');
    expect(sessionOf(pressed)).toMatchObject({
      sceneId: 'torvin_escort_cold',
      relations: { torvin: -1 },
      flags: { talkedStanley: true, pressedTorvin: true },
    });
    expect(choiceTexts(play(pressed, 'Ладно')).some((t) => t.includes('Стенли'))).toBe(false);
  });

  it('обиженный Вася говорить не хочет', () => {
    const state = withSession(roaming('courtyard', 1, 10), {
      relations: { vasya: -1 },
      flags: { apologizedVasya: true },
    });
    expect(choiceTexts(play(state, 'Поговорить с Васей'))).toEqual(['Ничего, бывай']);
  });
});

describe('карта крепости', () => {
  it('известные места, где герой, сколько идти и почему закрыто', () => {
    const state = withSession(roaming('hall', 1, 12), { flags: { joined: true } });
    const map = fortressMap(sessionOf(state));
    expect(map.places.map((place) => place.id)).toEqual([
      'courtyard',
      'gateyard',
      'hall',
      'barracks',
      'smithy',
      'cell',
      'wall',
    ]);
    expect(map.places.find((place) => place.id === 'hall')).toMatchObject({
      here: true,
      minutes: null,
    });
    expect(map.places.find((place) => place.id === 'courtyard')).toMatchObject({
      minutes: 5,
      people: ['torvin', 'vasya'],
    });
    expect(map.places.find((place) => place.id === 'cell')).toMatchObject({
      minutes: null,
      locked: 'Торвин обещал показать, где спать, после ужина',
    });
    expect(map.places.find((place) => place.id === 'wall')).toMatchObject({
      minutes: null,
      locked: 'Наверх пускают только дозорных',
    });
    expect(map.roads.filter((road) => !road.open)).toEqual([
      { from: 'courtyard', to: 'cell', open: false },
      { from: 'courtyard', to: 'wall', open: false },
    ]);
  });

  it('незнакомые персонажи на карте не отмечены', () => {
    const state = withSession(roaming('hall', 1, 12), { flags: {} });
    const courtyard = fortressMap(sessionOf(state)).places.find((p) => p.id === 'courtyard');
    expect(courtyard?.people).toEqual([]);
  });

  it('путь через несколько мест: время суммируется, места отмечаются посещёнными', () => {
    const state = withSession(roaming('hall', 1, 12), { flags: { knowsCell: true }, visited: [] });
    expect(route(sessionOf(state), 'cell')).toEqual({ path: ['courtyard', 'cell'], minutes: 15 });
    const walked = engine.choose(
      state,
      { text: { id: 'travel', to: 'cell' }, travel: 'cell' },
      constant(0),
    );
    expect(sessionOf(walked)).toMatchObject({
      locationId: 'cell',
      time: atTime(1, 12, 15),
      visited: ['courtyard', 'cell'],
    });
  });

  it('в закрытое место пути нет', () => {
    const state = roaming('hall', 1, 12);
    expect(route(sessionOf(state), 'cell')).toBeNull();
    const travel: Choice = { text: { id: 'travel', to: 'cell' }, travel: 'cell' };
    expect(sessionOf(engine.choose(state, travel, constant(0))).locationId).toBe('hall');
  });

  it('событие по дороге прерывает путь', () => {
    const state = withSession(roaming('cell', 2, 0, 55), {
      events: ['dinner'],
      flags: { knowsCell: true },
    });
    const travel: Choice = { text: { id: 'travel', to: 'hall' }, travel: 'hall' };
    const session = sessionOf(engine.choose(state, travel, constant(0)));
    // келья → двор (10 мин, 1:05): тревога начинается во дворе, до трапезной герой не доходит
    expect(session).toMatchObject({
      locationId: 'courtyard',
      sceneId: 'st8',
      time: atTime(2, 1, 5),
    });
  });
});
