import { describe, expect, it } from 'vitest';
import { deleteSave, listSaves, readSave, SAVE_KEY, slotKey, writeSave } from '@/game/save';
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
    relations: { torvin: -1 },
    oneLife: false,
    daily: {},
    spotId: null,
    visited: ['courtyard', 'courtyard.drill'],
    asked: ['torvin.place'],
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

  it('точка интереса не сохраняется: после загрузки герой в месте целиком', () => {
    const storage = memoryStorage();
    writeSave(storage, session({ sceneId: null, spotId: 'drill' }));
    expect(readSave(storage)).toMatchObject({ sceneId: null, spotId: null });
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
        armorId: 'none',
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
      flags: { ate: true, knowsCell: true, joined: true },
      // v7: отношения восстанавливаются по решениям — ужинал вовремя, но не помирился с Васей
      relations: { torvin: 1, vasya: -1 },
      // v8: старые партии — в обычном режиме
      oneLife: false,
      daily: {},
      // v11: из посещённых известно только текущее место
      spotId: null,
      visited: ['cell'],
      // v12: ни о чём ещё не спрашивал
      asked: [],
      fight: null,
      notices: [],
    });
  });

  it('версия 10: посещённым считается только текущее место', () => {
    const storage = memoryStorage();
    const saved = { ...session(), version: 10 } as Record<string, unknown>;
    delete saved['visited'];
    delete saved['spotId'];
    delete saved['fight'];
    delete saved['notices'];
    storage.setItem(SAVE_KEY, JSON.stringify(saved));
    expect(readSave(storage)?.visited).toEqual(['courtyard']);
  });

  it('версия 11: о темах разговоров герой ещё не спрашивал', () => {
    const storage = memoryStorage();
    const saved = { ...session(), version: 11 } as Record<string, unknown>;
    delete saved['asked'];
    delete saved['spotId'];
    delete saved['fight'];
    delete saved['notices'];
    storage.setItem(SAVE_KEY, JSON.stringify(saved));
    expect(readSave(storage)?.asked).toEqual([]);
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

  it('версия 5: после пролога добавляется решение joined (журнал)', () => {
    const storage = memoryStorage();
    const v5 = (sceneId: string | null) => ({
      version: 5,
      sceneId,
      locationId: 'courtyard',
      time: atTime(1, 17),
      events: [],
      hero: testHero(),
      flags: { ate: true },
    });
    storage.setItem(SAVE_KEY, JSON.stringify(v5(null)));
    expect(readSave(storage)?.flags).toEqual({ ate: true, joined: true });
    storage.setItem(SAVE_KEY, JSON.stringify(v5('st4')));
    expect(readSave(storage)?.flags).toEqual({ ate: true });
  });

  it('версия 6: отношения восстанавливаются по решениям и событиям', () => {
    const storage = memoryStorage();
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 6,
        sceneId: null,
        locationId: 'cell',
        time: atTime(1, 22),
        events: ['dinner'],
        hero: testHero(),
        flags: { joined: true, askedToLeave: true, ate: true, vasyaFriend: true },
      }),
    );
    expect(readSave(storage)?.relations).toEqual({ vasya: 2 });
  });

  it('загружает сохранение без решений', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ ...v2, stage: 'st3', flags: undefined }));
    expect(readSave(storage)?.flags).toEqual({});
  });
});

describe('ячейки сохранения', () => {
  it('автосохранение и три ручные ячейки, со временем записи', () => {
    const storage = memoryStorage();
    writeSave(storage, session(), 'auto', 1000);
    writeSave(storage, session({ sceneId: 'st6' }), 2, 2000);
    expect(storage.data.has(SAVE_KEY)).toBe(true);
    expect(storage.data.has(slotKey(2))).toBe(true);
    const saves = listSaves(storage);
    expect(saves.map((save) => save?.slot ?? null)).toEqual(['auto', null, 2, null]);
    expect(saves[2]).toMatchObject({ savedAt: 2000, session: { sceneId: 'st6' } });
    expect(readSave(storage, 2)?.sceneId).toBe('st6');
  });

  it('старое сохранение без времени записи читается', () => {
    const storage = memoryStorage();
    writeSave(storage, session());
    const raw = JSON.parse(storage.getItem(SAVE_KEY) ?? '{}') as Record<string, unknown>;
    delete raw['savedAt'];
    storage.setItem(SAVE_KEY, JSON.stringify(raw));
    expect(listSaves(storage)[0]?.savedAt).toBeNull();
  });

  it('интерфейс: сохранить в ячейку и загрузить из неё; в режиме «Одна жизнь» — нельзя', () => {
    const storage = memoryStorage();
    const store = createGameStore(storage, () => 0.5);
    store.openHeroCreation();
    store.startNewGame({ name: 'Ивар', classId: 'warrior', portrait: 'img/hero-1.jpg' });
    expect(store.canSaveToSlot()).toBe(true);
    store.saveToSlot(1);
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    store.loadGame(1);
    expect(store.getState().session?.sceneId).toBe('st0');

    store.startNewGame({
      name: 'Ивар',
      classId: 'warrior',
      portrait: 'img/hero-1.jpg',
      oneLife: true,
    });
    expect(store.canSaveToSlot()).toBe(false);
    store.saveToSlot(3);
    expect(readSave(storage, 3)).toBeNull();
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

  it('сохраняет новую игру и каждую новую сцену; после смерти остаётся последний выбор', () => {
    const storage = memoryStorage();
    const store = createGameStore(storage, () => 0.5);
    expect(store.hasSave()).toBe(false);

    store.openHeroCreation();
    store.startNewGame({ name: 'Ивар', classId: 'warrior', portrait: 'img/hero-1.jpg' });
    expect(readSave(storage)?.sceneId).toBe('st0');

    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    expect(readSave(storage)?.sceneId).toBe('st1');

    // сцена смерти не сохраняется: загрузка вернёт к выбору перед ней
    store.choose({ text: 'Попытаться убежать', next: 'st1_1' });
    store.choose({ text: 'Конец игры', gameOver: true });
    expect(store.getState().screen).toBe('menu');
    expect(readSave(storage)?.sceneId).toBe('st1');
  });

  it('выход в меню посреди партии не стирает сохранение даже в режиме «Одна жизнь»', () => {
    const storage = memoryStorage();
    const store = createGameStore(storage, () => 0.5);
    store.openHeroCreation();
    store.startNewGame({
      name: 'Ивар',
      classId: 'warrior',
      portrait: 'img/hero-1.jpg',
      oneLife: true,
    });
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    store.exitToMenu();
    expect(store.getState().screen).toBe('menu');
    expect(readSave(storage)?.sceneId).toBe('st1');
  });

  it('в режиме «Одна жизнь» смерть стирает сохранение', () => {
    const storage = memoryStorage();
    const store = createGameStore(storage, () => 0.5);
    store.openHeroCreation();
    store.startNewGame({
      name: 'Ивар',
      classId: 'warrior',
      portrait: 'img/hero-1.jpg',
      oneLife: true,
    });
    expect(readSave(storage)?.oneLife).toBe(true);
    store.choose({ text: 'Конец игры', gameOver: true });
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
