import { describe, expect, it } from 'vitest';
import * as engine from '@/game/engine';
import { attitude, changeRelations, people } from '@/game/relations';
import { atTime } from '@/game/time';
import type { Choice, GameState, Relations, Session } from '@/game/types';
import { constant, sessionOf, withSession } from './helpers';

function newGame(): GameState {
  return engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId: 'warrior',
    portrait: 'img/hero-1.jpg',
  });
}

/** Свободное перемещение; место, время, решения и отношения — из patch. */
function roaming(patch: Partial<Session>): GameState {
  return withSession(newGame(), { sceneId: null, notices: [], ...patch });
}

function choicesTo(state: GameState, next: string): Choice[] {
  return engine
    .availableChoices(sessionOf(state))
    .filter((choice) => 'next' in choice && choice.next === next);
}

function go(state: GameState, next: string): GameState {
  const [choice] = choicesTo(state, next);
  if (!choice) throw new Error('Нет перехода в ' + next);
  return engine.choose(state, choice, constant(0.5));
}

const notices = (state: GameState) => sessionOf(state).notices.map((n) => n.text);

describe('отношения', () => {
  it('меняются в пределах −5…5 и сообщают, стало лучше или хуже', () => {
    expect(changeRelations({ vasya: 4 }, { vasya: 3, torvin: -1 })).toEqual({
      relations: { vasya: 5, torvin: -1 },
      notices: [
        // в порядке персонажей в NPCS
        { tone: 'fail', text: 'Торвин: отношение ухудшилось' },
        { tone: 'success', text: 'Вася: отношение улучшилось' },
      ],
    });
    // упёрлось в предел — сообщения нет
    expect(changeRelations({ vasya: 5 }, { vasya: 1 }).notices).toEqual([]);
  });

  it('уровни отношения', () => {
    expect([-5, -3, -1, 0, 1, 2, 3, 5].map(attitude)).toEqual([
      'враждебен',
      'враждебен',
      'недолюбливает',
      'присматривается',
      'симпатизирует',
      'симпатизирует',
      'доверяет',
      'доверяет',
    ]);
  });

  it('ужин вовремя — Торвину нравится', () => {
    const before = roaming({ locationId: 'courtyard', time: atTime(1, 17, 55) });
    const [toHall] = engine
      .availableChoices(sessionOf(before))
      .filter((choice) => 'move' in choice && choice.move === 'hall');
    if (!toHall) throw new Error('Нет выхода в трапезную');
    const state = engine.choose(before, toHall, constant(0.5));
    expect(sessionOf(state)).toMatchObject({ sceneId: 'st6', relations: { torvin: 1 } });
    expect(notices(state)).toContain('Торвин: отношение улучшилось');
  });

  it('про огни Торвин говорит честно, только если симпатизирует', () => {
    const talk = (relations: Relations) =>
      withSession(newGame(), {
        sceneId: 'torvin_talk',
        flags: { joined: true, sawLights: true },
        relations,
      });
    expect(choicesTo(talk({ torvin: 1 }), 'torvin_lights_trust')).toHaveLength(1);
    expect(choicesTo(talk({ torvin: 1 }), 'torvin_lights_cold')).toHaveLength(0);
    expect(choicesTo(talk({}), 'torvin_lights_trust')).toHaveLength(0);
    expect(choicesTo(talk({}), 'torvin_lights_cold')).toHaveLength(1);

    const trusted = go(talk({ torvin: 1 }), 'torvin_lights_trust');
    expect(sessionOf(trusted).flags).toMatchObject({ toldTorvinLights: true, torvinWarned: true });
    // рассказать можно один раз
    expect(choicesTo(go(trusted, 'torvin_talk'), 'torvin_lights_trust')).toHaveLength(0);
  });

  it('симпатия Торвина — стёганка, один раз', () => {
    const talk = (relations: Relations) =>
      withSession(newGame(), { sceneId: 'torvin_talk', flags: { joined: true }, relations });
    expect(choicesTo(talk({}), 'torvin_jacket')).toEqual([]);
    const jacket = go(talk({ torvin: 1 }), 'torvin_jacket');
    expect(sessionOf(jacket).hero.armorId).toBe('jacket');
    expect(notices(jacket)).toContain('Получена защита: Стёганка');
    expect(choicesTo(go(jacket, 'torvin_talk'), 'torvin_jacket')).toEqual([]);
  });

  it('с Васей можно помириться по его расписанию, извиниться — один раз', () => {
    const state = roaming({
      locationId: 'courtyard',
      time: atTime(1, 16, 45),
      flags: { joined: true, trippedVasya: true },
      relations: { vasya: -1 },
    });
    const talk = go(state, 'vasya_talk');
    const ctx = engine.textContext(sessionOf(talk));
    expect(engine.resolveText(engine.getScene('vasya_talk').text, ctx)).toContain('Чего надо?');

    const sorry = go(talk, 'vasya_sorry');
    expect(sessionOf(sorry).relations.vasya).toBe(0);
    expect(notices(sorry)).toEqual(['Вася: отношение улучшилось']);
    expect(choicesTo(go(sorry, 'vasya_talk'), 'vasya_sorry')).toEqual([]);
  });

  it('в журнале — знакомые персонажи и их отношение', () => {
    expect(people(sessionOf(newGame()))).toEqual([]);
    const known = people({
      ...sessionOf(newGame()),
      flags: { joined: true, vasyaFriend: true },
      relations: { vasya: 2 },
    });
    expect(known.map(({ name, attitude }) => [name, attitude])).toEqual([
      ['Торвин', 'присматривается'],
      ['Вася', 'симпатизирует'],
    ]);
    expect(known[1]?.about).toContain('помирились');
  });
});
