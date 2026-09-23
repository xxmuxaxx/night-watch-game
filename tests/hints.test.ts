import { describe, expect, it } from 'vitest';
import { startFight } from '@/game/combat';
import * as engine from '@/game/engine';
import { currentHint } from '@/ui/hints';
import { createSettingsStore, DEFAULT_SETTINGS, SETTINGS_KEY } from '@/ui/settings';
import { memoryStorage, sessionOf, withSession } from './helpers';

const game = engine.startNewGame(engine.initialState, {
  name: 'Ивар',
  classId: 'warrior',
  portrait: 'img/hero-1.jpg',
});

describe('подсказки', () => {
  it('в начале игры — про журнал, потом — ничего', () => {
    expect(currentHint(game, [])?.id).toBe('journal');
    expect(currentHint(game, ['journal'])).toBeNull();
  });

  it('при свободном перемещении — про распорядок', () => {
    const roaming = withSession(game, { sceneId: null, locationId: 'courtyard' });
    expect(currentHint(roaming, ['journal'])?.id).toBe('roaming');
  });

  it('в бою при замахе врага — про парирование, и она важнее остальных', () => {
    const fight = startFight({ name: 'Вася', portrait: '' }, 'st3');
    const state = withSession(game, {
      fight: { ...fight, enemy: { ...fight.enemy, windingUp: true } },
    });
    expect(currentHint(state, [])?.id).toBe('parry');
  });

  it('не мешает выбору награды за уровень и не показывается в меню', () => {
    const levelUp = withSession(game, { hero: { ...sessionOf(game).hero, levelUps: 1 } });
    expect(currentHint(levelUp, [])).toBeNull();
    expect(currentHint(engine.initialState, [])).toBeNull();
  });
});

describe('настройки', () => {
  it('сохраняются и загружаются; недостающие поля — по умолчанию', () => {
    const storage = memoryStorage();
    createSettingsStore(storage).update({ fontSize: 'large', seenHints: ['journal'] });
    expect(createSettingsStore(storage).get()).toEqual({
      ...DEFAULT_SETTINGS,
      fontSize: 'large',
      seenHints: ['journal'],
    });
    storage.setItem(SETTINGS_KEY, '{broken');
    expect(createSettingsStore(storage).get()).toEqual(DEFAULT_SETTINGS);
  });
});
