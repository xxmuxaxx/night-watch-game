import { describe, expect, it } from 'vitest';
import * as debug from '@/game/debug';
import { initialState } from '@/game/engine';
import { playRound, startFight } from '@/game/combat';
import { constant, sessionOf, testHero } from './helpers';

describe('панель отладки', () => {
  it('быстрый старт и прыжок в сцену', () => {
    let state = debug.quickStart(initialState, 'rogue');
    expect(sessionOf(state).hero.classId).toBe('rogue');
    state = debug.jumpToScene(state, 'st7');
    // как при обычном входе в сцену: келья и решение «знает, где келья»
    expect(sessionOf(state)).toMatchObject({
      sceneId: 'st7',
      locationId: 'cell',
      flags: { knowsCell: true },
      fight: null,
      notices: [],
    });
  });

  it('решения включаются и выключаются', () => {
    let state = debug.quickStart(initialState, 'warrior');
    state = debug.toggleFlag(state, 'ate');
    expect(sessionOf(state).flags).toEqual({ ate: true });
    state = debug.toggleFlag(state, 'ate');
    expect(sessionOf(state).flags).toEqual({});
  });

  it('мгновенная победа в бою', () => {
    let state = debug.quickStart(initialState, 'warrior');
    state = {
      ...state,
      session: { ...sessionOf(state), fight: startFight({ name: 'Вася', portrait: 'x' }, 'st3') },
    };
    state = debug.winFight(state);
    expect(sessionOf(state).fight).toMatchObject({ result: 'win', enemy: { hp: 0 } });
    // бой после победы не продолжается
    const fight = sessionOf(state).fight;
    if (!fight) throw new Error('нет боя');
    expect(playRound(testHero(), fight, 'attack', constant(0)).fight).toBe(fight);
  });
});
