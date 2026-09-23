// Сохранение партии в localStorage. Формат версионирован: старые сохранения переводятся
// в текущий формат (migrate), а сохранения со сценой или классом, которых больше нет, отбрасываются.
import { HERO_CLASSES } from '@/content/classes';
import { EVENTS } from '@/content/events';
import { ITEMS } from '@/content/items';
import { LOCATIONS } from '@/content/locations';
import { START_TIME } from '@/content/story';
import { WEAPONS } from '@/content/weapons';
import { getScene, hasScene, isDeathScene } from './context';
import { atTime } from './time';
import type {
  ClassId,
  EventId,
  Flags,
  Hero,
  ItemId,
  LocationId,
  SceneId,
  Session,
  WeaponId,
} from './types';

export const SAVE_KEY = 'nightwatch-save';
export const SAVE_VERSION = 6;

/** Хранилище с интерфейсом localStorage — в тестах подменяется. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface SaveData {
  version: typeof SAVE_VERSION;
  /** null — свободное перемещение по локации. */
  sceneId: SceneId | null;
  locationId: LocationId;
  time: number;
  events: EventId[];
  hero: Hero;
  flags: Flags;
}

/** Формат версии 5: до журнала (решения joined). */
type SaveV5 = Omit<SaveData, 'version'> & { version: 5 };

/** Формат версии 4: до локаций, времени и событий. */
interface SaveV4 {
  version: 4;
  sceneId: SceneId;
  hero: Hero;
  flags: Flags;
}

/** Формат версии 3: до опыта, уровней и сумки. */
interface SaveV3 {
  version: 3;
  sceneId: SceneId;
  hero: Omit<Hero, 'inventory' | 'xp' | 'level' | 'levelUps'>;
  flags: Flags;
}

/** Формат версии 2 (игра до перехода на TypeScript). */
interface SaveV2 {
  version: 2;
  stage: string;
  hero: {
    name: string;
    class: string;
    src: string;
    strength: number;
    agility?: number;
    wits?: number;
    hp: number;
    currentHp: number;
    weapon?: { name: string };
  };
  flags?: Flags;
}

const LEGACY_CLASS_IDS: Record<string, ClassId> = { Warrior: 'warrior', Rogue: 'rogue' };

function isClassId(id: unknown): id is ClassId {
  return typeof id === 'string' && id in HERO_CLASSES;
}

function isItemId(id: unknown): id is ItemId {
  return typeof id === 'string' && id in ITEMS;
}

function isWeaponId(id: unknown): id is WeaponId {
  return typeof id === 'string' && id in WEAPONS;
}

function migrateV2(save: SaveV2): SaveV3 | null {
  const classId = LEGACY_CLASS_IDS[save.hero.class];
  if (!classId) return null;
  const cls = HERO_CLASSES[classId];
  const weaponId =
    (Object.keys(WEAPONS) as WeaponId[]).find(
      (id) => WEAPONS[id].name === save.hero.weapon?.name,
    ) ?? 'fists';
  return {
    version: 3,
    sceneId: save.stage,
    hero: {
      name: save.hero.name,
      classId,
      portrait: save.hero.src,
      stats: {
        strength: save.hero.strength,
        // ловкости и чутья в ранних сохранениях не было — берём у класса
        agility: save.hero.agility ?? cls.stats.agility,
        wits: save.hero.wits ?? cls.stats.wits,
      },
      hp: save.hero.currentHp,
      maxHp: save.hero.hp,
      weaponId,
    },
    flags: save.flags ?? {},
  };
}

function migrateV3(save: SaveV3): SaveV4 {
  return {
    ...save,
    version: 4,
    hero: { ...save.hero, inventory: [], xp: 0, level: 1, levelUps: 0 },
  };
}

/**
 * До версии 5 глава была линейной. Место, время и случившиеся события восстанавливаем
 * по сцене, на которой остановился игрок.
 */
function migrateV4(save: SaveV4): SaveV5 {
  const id = save.sceneId;
  const base = { ...save, version: 5 } as const;
  if (id.startsWith('st6')) {
    return { ...base, locationId: 'hall', time: atTime(1, 18, 30), events: ['dinner'] };
  }
  if (id.startsWith('st7')) {
    return {
      ...base,
      locationId: 'cell',
      time: atTime(1, 21, 30),
      events: ['dinner'],
      flags: { ...save.flags, knowsCell: true },
    };
  }
  if (id === 'st8' || id === 'st9') {
    return {
      ...base,
      locationId: 'cell',
      time: atTime(2, 1),
      events: ['dinner', 'alarm'],
      flags: { ...save.flags, knowsCell: true },
    };
  }
  const beforeGate = ['st0', 'st1', 'st2', 'st2_1', 'st3'].includes(id);
  return {
    ...base,
    locationId: beforeGate ? 'gate' : 'courtyard',
    time: START_TIME + (beforeGate ? 15 : 45),
    events: [],
  };
}

/** Сцены до знакомства с Торвином: решение joined ещё не принято. */
const PROLOGUE_SCENES: readonly SceneId[] = ['st0', 'st1', 'st1_1', 'st2', 'st2_1', 'st3', 'st4'];

/** В версии 6 появился журнал: его первая цель выполняется решением joined (сцена st5). */
function migrateV5(save: SaveV5): SaveData {
  const joined = save.sceneId === null || !PROLOGUE_SCENES.includes(save.sceneId);
  return {
    ...save,
    version: SAVE_VERSION,
    flags: joined ? { ...save.flags, joined: true } : save.flags,
  };
}

/** Перевести сохранение любой известной версии в текущий формат: шаг за шагом, 2 → … → 6. */
export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object' || !('version' in raw)) return null;
  let save = raw as SaveV2 | SaveV3 | SaveV4 | SaveV5 | SaveData;
  if (save.version === 2) {
    const v3 = migrateV2(save);
    if (!v3) return null;
    save = v3;
  }
  if (save.version === 3) save = migrateV3(save);
  if (save.version === 4) save = migrateV4(save);
  if (save.version === 5) save = migrateV5(save);
  return save.version === SAVE_VERSION ? save : null;
}

function isValid(save: SaveData): boolean {
  return (
    (save.sceneId === null || hasScene(save.sceneId)) &&
    save.locationId in LOCATIONS &&
    typeof save.time === 'number' &&
    save.events.every((id) => id in EVENTS) &&
    isClassId(save.hero.classId) &&
    isWeaponId(save.hero.weaponId) &&
    save.hero.inventory.every(isItemId)
  );
}

export function readSave(storage: SaveStorage): Session | null {
  try {
    const save = migrate(JSON.parse(storage.getItem(SAVE_KEY) ?? 'null'));
    if (!save || !isValid(save)) return null;
    return {
      hero: save.hero,
      sceneId: save.sceneId,
      locationId: save.locationId,
      time: save.time,
      events: save.events,
      flags: save.flags,
      fight: null,
      notices: [],
    };
  } catch {
    return null;
  }
}

/** Сохранить партию. Сцены смерти не сохраняются. */
export function writeSave(storage: SaveStorage, session: Session): void {
  if (session.sceneId !== null && isDeathScene(getScene(session.sceneId))) return;
  const save: SaveData = {
    version: SAVE_VERSION,
    sceneId: session.sceneId,
    locationId: session.locationId,
    time: session.time,
    events: session.events,
    hero: session.hero,
    flags: session.flags,
  };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // хранилище недоступно (приватный режим и т.п.) — играем без сохранения
  }
}

export function deleteSave(storage: SaveStorage): void {
  try {
    storage.removeItem(SAVE_KEY);
  } catch {
    // см. writeSave
  }
}

/** localStorage, если он доступен, иначе хранилище в памяти. */
export function browserStorage(): SaveStorage {
  try {
    const probe = '__nightwatch__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
    };
  }
}
