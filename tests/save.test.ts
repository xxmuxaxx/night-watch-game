import { describe, expect, it } from 'vitest';
import { deleteSave, readSave, SAVE_KEY, writeSave } from '@/game/save';
import type { Session } from '@/game/types';
import { createGameStore } from '@/ui/store';
import { memoryStorage, testHero } from './helpers';

function session(overrides: Partial<Session> = {}): Session {
  return {
    hero: testHero('rogue'),
    sceneId: 'st5',
    flags: { askedToLeave: true },
    fight: null,
    notice: null,
    ...overrides,
  };
}

describe('writeSave / readSave', () => {
  it('сохраняет и загружает партию', () => {
    const storage = memoryStorage();
    writeSave(storage, session());
    expect(readSave(storage)).toEqual(session());
  });

  it('не сохраняет сцену смерти', () => {
    const storage = memoryStorage();
    writeSave(storage, session({ sceneId: 'st1_1' }));
    expect(storage.data.has(SAVE_KEY)).toBe(false);
  });

  it('отбрасывает испорченные и неизвестные сохранения', () => {
    const storage = memoryStorage();
    for (const raw of [
      '{broken',
      'null',
      '{"version":99}',
      JSON.stringify({ ...session(), version: 3, sceneId: 'нет-такой' }),
    ]) {
      storage.setItem(SAVE_KEY, raw);
      expect(readSave(storage)).toBeNull();
    }
  });

  it('deleteSave удаляет сохранение', () => {
    const storage = memoryStorage();
    writeSave(storage, session());
    deleteSave(storage);
    expect(readSave(storage)).toBeNull();
  });
});

describe('миграция сохранений версии 2', () => {
  const v2 = {
    version: 2,
    stage: 'st7',
    hero: {
      name: 'Старый',
      class: 'Rogue',
      src: 'img/hero-3.jpg',
      strength: 1,
      hp: 8,
      currentHp: 5,
      crit: 0.3,
      dodge: 0.25,
      weapon: { name: 'Без оружия', min: 0, max: 2 },
    },
    flags: { ate: true },
  };

  it('переводит героя в новый формат', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify(v2));
    expect(readSave(storage)).toEqual({
      hero: {
        name: 'Старый',
        classId: 'rogue',
        portrait: 'img/hero-3.jpg',
        stats: { strength: 1, agility: 3, wits: 2 },
        hp: 5,
        maxHp: 8,
        weaponId: 'fists',
      },
      sceneId: 'st7',
      flags: { ate: true },
      fight: null,
      notice: null,
    });
  });

  it('загружает сохранение без решений', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ ...v2, flags: undefined }));
    expect(readSave(storage)?.flags).toEqual({});
  });
});

describe('автосохранение в хранилище интерфейса', () => {
  it('сохраняет новую игру и каждую новую сцену, после смерти удаляет', () => {
    const storage = memoryStorage();
    const store = createGameStore(storage, () => 0.5);
    expect(store.hasSave()).toBe(false);

    store.openHeroCreation();
    store.startNewGame({ name: 'Ивар', classId: 'warrior', portrait: 'img/hero-1.jpg' });
    expect(readSave(storage)?.sceneId).toBe('st0');

    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    expect(readSave(storage)?.sceneId).toBe('st1');

    store.choose({ text: 'Конец игры', gameOver: true });
    expect(store.getState().screen).toBe('menu');
    expect(store.hasSave()).toBe(false);
  });

  it('загрузка продолжает с сохранённой сцены', () => {
    const storage = memoryStorage();
    writeSave(storage, session());
    const store = createGameStore(storage);
    store.loadGame();
    expect(store.getState()).toMatchObject({
      screen: 'story',
      session: { sceneId: 'st5', flags: { askedToLeave: true } },
    });
  });
});
