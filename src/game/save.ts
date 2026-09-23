// Сохранение партии в localStorage. Формат версионирован: старые сохранения переводятся
// в текущий формат (migrate), а сохранения со сценой или классом, которых больше нет, отбрасываются.
import { ARMORS } from '@/content/armors';
import { HERO_CLASSES } from '@/content/classes';
import { DUTIES } from '@/content/duties';
import { EVENTS } from '@/content/events';
import { ITEMS } from '@/content/items';
import { LOCATIONS } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { START_TIME } from '@/content/story';
import { WEAPONS } from '@/content/weapons';
import { getScene, hasScene, isDeathScene } from './context';
import { atTime } from './time';
import type {
  ClassId,
  DutyRecord,
  EventId,
  Flags,
  Hero,
  Relations,
  ItemId,
  LocationId,
  SceneId,
  Session,
  WeaponId,
} from './types';

export const SAVE_KEY = 'nightwatch-save';

/** Ячейки: автосохранение и три ручные. */
export type SaveSlot = 'auto' | 1 | 2 | 3;
export const SAVE_SLOTS: readonly SaveSlot[] = ['auto', 1, 2, 3];
export const MANUAL_SLOTS: readonly SaveSlot[] = [1, 2, 3];

/** Ключ ячейки в хранилище: автосохранение — под старым ключом, ручные — с номером. */
export function slotKey(slot: SaveSlot): string {
  return slot === 'auto' ? SAVE_KEY : SAVE_KEY + '-' + slot;
}

/** Сохранение в ячейке: партия и когда она записана (для списка сохранений). */
export interface SavedGame {
  slot: SaveSlot;
  session: Session;
  /** Время записи, мс с 1970 года; у старых сохранений его нет. */
  savedAt: number | null;
}
export const SAVE_VERSION = 13;

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
  relations: Relations;
  oneLife: boolean;
  daily: Record<string, number>;
  /** Где герой побывал (места и точки интереса). */
  visited: string[];
  /** О чём герой уже спрашивал (темы разговоров). */
  asked: string[];
  /** Выданные наряды. */
  duties: DutyRecord[];
  /** Когда записано; необязательное поле, читается и без него. */
  savedAt?: number;
}

/** Формат версии 12: до нарядов. */
type SaveV12 = Omit<SaveData, 'version' | 'duties'> & { version: 12 };

/** Формат версии 11: до тем разговоров. */
type SaveV11 = Omit<SaveV12, 'version' | 'asked'> & { version: 11 };

/** Формат версии 10: до отметок о посещённых местах. */
type SaveV10 = Omit<SaveV11, 'version' | 'visited'> & { version: 10 };

/** Герой до версии 10: без защиты. */
type HeroV9 = Omit<Hero, 'armorId'>;

/** Формат версии 9: до защиты героя. */
type SaveV9 = Omit<SaveV10, 'version' | 'hero'> & { version: 9; hero: HeroV9 };

/** Формат версии 8: до занятий раз в день. */
type SaveV8 = Omit<SaveV9, 'version' | 'daily'> & { version: 8 };

/** Формат версии 7: до режима «Одна жизнь». */
type SaveV7 = Omit<SaveV8, 'version' | 'oneLife'> & { version: 7 };

/** Формат версии 6: до отношений с персонажами. */
type SaveV6 = Omit<SaveV7, 'version' | 'relations'> & { version: 6 };

/** Формат версии 5: до журнала (решения joined). */
type SaveV5 = Omit<SaveV6, 'version'> & { version: 5 };

/** Формат версии 4: до локаций, времени и событий. */
interface SaveV4 {
  version: 4;
  sceneId: SceneId;
  hero: HeroV9;
  flags: Flags;
}

/** Формат версии 3: до опыта, уровней и сумки. */
interface SaveV3 {
  version: 3;
  sceneId: SceneId;
  hero: Omit<HeroV9, 'inventory' | 'xp' | 'level' | 'levelUps'>;
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
function migrateV5(save: SaveV5): SaveV6 {
  const joined = save.sceneId === null || !PROLOGUE_SCENES.includes(save.sceneId);
  return {
    ...save,
    version: 6,
    flags: joined ? { ...save.flags, joined: true } : save.flags,
  };
}

/** В версии 7 появились отношения: восстанавливаем их по решениям и событиям главы 1. */
function migrateV6(save: SaveV6): SaveV7 {
  const flag = (id: keyof Flags) => save.flags[id] === true;
  const fired = (id: EventId) => save.events.includes(id);
  const torvin =
    (fired('dinner') ? 1 : 0) - (fired('lateForDinner') ? 1 : 0) - (flag('askedToLeave') ? 1 : 0);
  // поел, но не помирился и ужин уже позади — значит, молча ушёл от Васи
  const leftVasya = flag('ate') && !flag('vasyaFriend') && save.sceneId !== 'st6_1';
  const vasya =
    (flag('trippedVasya') ? -1 : 0) + (flag('vasyaFriend') ? 2 : 0) - (leftVasya ? 1 : 0);
  const relations: Relations = {};
  if (torvin !== 0) relations.torvin = torvin;
  if (vasya !== 0) relations.vasya = vasya;
  return { ...save, version: 7, relations };
}

/** В версии 8 появился режим «Одна жизнь»; старые партии играются в обычном режиме. */
function migrateV7(save: SaveV7): SaveV8 {
  return { ...save, version: 8, oneLife: false };
}

/** В версии 9 появились занятия раз в день; старые партии их ещё не делали. */
function migrateV8(save: SaveV8): SaveV9 {
  return { ...save, version: 9, daily: {} };
}

/** В версии 10 у героя появилась защита; до неё защиты не было. */
function migrateV9(save: SaveV9): SaveV10 {
  return { ...save, version: 10, hero: { ...save.hero, armorId: 'none' } };
}

/** В версии 11 появились отметки о посещённых местах: хотя бы текущее место герой видел. */
function migrateV10(save: SaveV10): SaveV11 {
  return { ...save, version: 11, visited: [save.locationId] };
}

/** В версии 12 появились темы разговоров; одноразовые вопросы и так закрыты решениями. */
function migrateV11(save: SaveV11): SaveV12 {
  return { ...save, version: 12, asked: [] };
}

/** В версии 13 появились наряды; старым партиям их ещё не выдавали. */
function migrateV12(save: SaveV12): SaveData {
  return { ...save, version: SAVE_VERSION, duties: [] };
}

/** Перевести сохранение любой известной версии в текущий формат: шаг за шагом, 2 → … → 13. */
export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object' || !('version' in raw)) return null;
  let save = raw as
    | SaveV2
    | SaveV3
    | SaveV4
    | SaveV5
    | SaveV6
    | SaveV7
    | SaveV8
    | SaveV9
    | SaveV10
    | SaveV11
    | SaveV12
    | SaveData;
  if (save.version === 2) {
    const v3 = migrateV2(save);
    if (!v3) return null;
    save = v3;
  }
  if (save.version === 3) save = migrateV3(save);
  if (save.version === 4) save = migrateV4(save);
  if (save.version === 5) save = migrateV5(save);
  if (save.version === 6) save = migrateV6(save);
  if (save.version === 7) save = migrateV7(save);
  if (save.version === 8) save = migrateV8(save);
  if (save.version === 9) save = migrateV9(save);
  if (save.version === 10) save = migrateV10(save);
  if (save.version === 11) save = migrateV11(save);
  if (save.version === 12) save = migrateV12(save);
  return save.version === SAVE_VERSION ? save : null;
}

function isValid(save: SaveData): boolean {
  return (
    (save.sceneId === null || hasScene(save.sceneId)) &&
    save.locationId in LOCATIONS &&
    typeof save.time === 'number' &&
    save.events.every((id) => id in EVENTS) &&
    Object.entries(save.relations).every(
      ([id, value]) => id in NPCS && typeof value === 'number',
    ) &&
    isClassId(save.hero.classId) &&
    isWeaponId(save.hero.weaponId) &&
    save.hero.armorId in ARMORS &&
    save.hero.inventory.every(isItemId) &&
    Array.isArray(save.visited) &&
    save.visited.every((key) => typeof key === 'string') &&
    Array.isArray(save.asked) &&
    save.asked.every((key) => typeof key === 'string') &&
    Array.isArray(save.duties) &&
    save.duties.every(
      (duty) =>
        duty.id in DUTIES &&
        typeof duty.day === 'number' &&
        ['active', 'done', 'missed'].includes(duty.status),
    )
  );
}

export function readSave(storage: SaveStorage, slot: SaveSlot = 'auto'): Session | null {
  return readSavedGame(storage, slot)?.session ?? null;
}

/** Все ячейки по порядку: автосохранение, затем ручные; пустые и испорченные — null. */
export function listSaves(storage: SaveStorage): (SavedGame | null)[] {
  return SAVE_SLOTS.map((slot) => readSavedGame(storage, slot));
}

export function readSavedGame(storage: SaveStorage, slot: SaveSlot): SavedGame | null {
  try {
    const save = migrate(JSON.parse(storage.getItem(slotKey(slot)) ?? 'null'));
    if (!save || !isValid(save)) return null;
    return { slot, session: toSession(save), savedAt: save.savedAt ?? null };
  } catch {
    return null;
  }
}

function toSession(save: SaveData): Session {
  return {
    hero: save.hero,
    sceneId: save.sceneId,
    locationId: save.locationId,
    time: save.time,
    events: save.events,
    flags: save.flags,
    relations: save.relations,
    oneLife: save.oneLife,
    daily: save.daily,
    spotId: null,
    visited: save.visited,
    asked: save.asked,
    duties: save.duties,
    fight: null,
    notices: [],
  };
}

/** Сохранить партию в ячейку (по умолчанию — автосохранение). Сцены смерти не сохраняются. */
export function writeSave(
  storage: SaveStorage,
  session: Session,
  slot: SaveSlot = 'auto',
  now = Date.now(),
): void {
  if (session.sceneId !== null && isDeathScene(getScene(session.sceneId))) return;
  const save: SaveData = {
    version: SAVE_VERSION,
    sceneId: session.sceneId,
    locationId: session.locationId,
    time: session.time,
    events: session.events,
    hero: session.hero,
    flags: session.flags,
    relations: session.relations,
    oneLife: session.oneLife,
    daily: session.daily,
    visited: session.visited,
    asked: session.asked,
    duties: session.duties,
    savedAt: now,
  };
  try {
    storage.setItem(slotKey(slot), JSON.stringify(save));
  } catch {
    // хранилище недоступно (приватный режим и т.п.) — играем без сохранения
  }
}

export function deleteSave(storage: SaveStorage, slot: SaveSlot = 'auto'): void {
  try {
    storage.removeItem(slotKey(slot));
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
