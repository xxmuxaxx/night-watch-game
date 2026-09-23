import { describe, expect, it } from 'vitest';
import { deleteSave, readSave, SAVE_KEY, writeSave } from '@/game/save';
import type { Session } from '@/game/types';
import { atTime } from '@/game/time';
import { createGameStore } from '@/ui/store';
import { memoryStorage, testHero } from './helpers';

function session(overrides: Partial<Session> = {}): Session {
  return {
    hero: testHero('rogue'),
    sceneId: 'st5',
    locationId: 'courtyard',
    time: atTime(1, 16, 30),
    events: [],
    flags: { askedToLeave: true },
    fight: null,
    notices: [],
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

describe('миграция старых сохранений', () => {
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
        inventory: [],
        xp: 0,
        level: 1,
        levelUps: 0,
      },
      sceneId: 'st7',
      // до версии 5 глава была линейной: место, время и события восстанавливаются по сцене
      locationId: 'cell',
      time: atTime(1, 21, 30),
      events: ['dinner'],
      flags: { ate: true, knowsCell: true },
      fight: null,
      notices: [],
    });
  });

  it('версия 3: герой получает пустую сумку, нулевой опыт и уровень 1', () => {
    const storage = memoryStorage();
    const hero = testHero('warrior');
    const heroV3 = {
      name: hero.name,
      classId: hero.classId,
      portrait: hero.portrait,
      stats: hero.stats,
      hp: hero.hp,
      maxHp: hero.maxHp,
      weaponId: hero.weaponId,
    };
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 3, sceneId: 'st5', hero: heroV3, flags: {} }),
    );
    expect(readSave(storage)?.hero).toEqual(testHero('warrior'));
  });

  it('отбрасывает сохранение с неизвестным предметом', () => {
    const storage = memoryStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 4,
        sceneId: 'st5',
        hero: { ...testHero(), inventory: ['нет-такого'] },
        flags: {},
      }),
    );
    expect(readSave(storage)).toBeNull();
  });

  it('версия 4: тревога — ночь второго дня, ужин и тревога уже были', () => {
    const storage = memoryStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 4, sceneId: 'st8', hero: testHero(), flags: { ate: true } }),
    );
    expect(readSave(storage)).toMatchObject({
      sceneId: 'st8',
      locationId: 'cell',
      time: atTime(2, 1),
      events: ['dinner', 'alarm'],
      flags: { ate: true, knowsCell: true },
    });
  });

  it('загружает сохранение без решений', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ ...v2, stage: 'st5', flags: undefined }));
    expect(readSave(storage)?.flags).toEqual({});
  });
});

describe('автосохранение в хранилище интерфейса', () => {
  it('сохраняет использованный предмет, не дожидаясь новой сцены', () => {
    const storage = memoryStorage();
    writeSave(storage, session({ hero: testHero('rogue', { hp: 2, inventory: ['bread'] }) }));
    const store = createGameStore(storage);
    store.loadGame();
    store.applyItem('bread');
    expect(readSave(storage)?.hero).toMatchObject({ hp: 5, inventory: [] });
  });

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

  it('сохраняет свободное перемещение: место и время', () => {
    const storage = memoryStorage();
    const roaming = session({ sceneId: null, locationId: 'hall', time: atTime(1, 17) });
    writeSave(storage, roaming);
    expect(readSave(storage)).toEqual(roaming);
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
