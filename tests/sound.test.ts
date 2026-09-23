import { describe, expect, it } from 'vitest';
import { startFight } from '@/game/combat';
import * as engine from '@/game/engine';
import { atTime } from '@/game/time';
import type { GameState } from '@/game/types';
import { ambienceFor, cuesBetween } from '@/ui/soundCues';
import { sessionOf, withSession } from './helpers';

const game = engine.startNewGame(engine.initialState, {
  name: 'Ивар',
  classId: 'warrior',
  portrait: 'img/hero-1.jpg',
});

function inFight(patch: { enemyHp?: number; heroHp?: number; windingUp?: boolean }): GameState {
  const fight = startFight({ name: 'Вася', portrait: '', hp: 10, windup: 0.3 }, 'st3');
  return withSession(game, {
    hero: { ...sessionOf(game).hero, hp: patch.heroHp ?? 10 },
    fight: {
      ...fight,
      enemy: { ...fight.enemy, hp: patch.enemyHp ?? 10, windingUp: patch.windingUp ?? false },
    },
  });
}

describe('фон', () => {
  it('ветер снаружи, ночью сильнее; очаг в трапезной; тишина в меню', () => {
    expect(ambienceFor(withSession(game, { locationId: 'courtyard', time: atTime(1, 12) }))).toBe(
      'wind',
    );
    expect(ambienceFor(withSession(game, { locationId: 'courtyard', time: atTime(1, 23) }))).toBe(
      'storm',
    );
    expect(ambienceFor(withSession(game, { locationId: 'hall' }))).toBe('hearth');
    expect(ambienceFor(withSession(game, { locationId: 'cell' }))).toBe('room');
    expect(ambienceFor(engine.initialState)).toBeNull();
  });
});

describe('звуки', () => {
  it('в бою: удар, рана, замах, парирование', () => {
    expect(cuesBetween(inFight({}), inFight({ enemyHp: 6, heroHp: 8 }))).toEqual(['hit', 'hurt']);
    expect(cuesBetween(inFight({}), inFight({ windingUp: true }))).toEqual(['windup']);
    expect(cuesBetween(inFight({ windingUp: true }), inFight({ enemyHp: 6 }))).toEqual(['parry']);
  });

  it('рог тревоги при входе в сцену со звуком', () => {
    expect(cuesBetween(game, withSession(game, { sceneId: 'st8' }))).toEqual(['horn']);
  });

  it('итог проверки и новый уровень', () => {
    const checked = withSession(game, {
      notices: [{ tone: 'success', text: 'Проверка: Ловкость — успех' }],
      hero: { ...sessionOf(game).hero, levelUps: 1 },
    });
    expect(cuesBetween(game, checked)).toEqual(['success', 'levelup']);
  });

  it('без изменений — тишина', () => {
    expect(cuesBetween(game, game)).toEqual([]);
  });
});
