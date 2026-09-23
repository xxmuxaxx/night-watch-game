// Сохранение партии в localStorage. Формат версионирован: старые сохранения переводятся
// в текущий формат (migrate), а сохранения со сценой или классом, которых больше нет, отбрасываются.
import { HERO_CLASSES } from '@/content/classes';
import { ITEMS } from '@/content/items';
import { WEAPONS } from '@/content/weapons';
import { getScene, hasScene, isDeathScene } from './engine';
import type { ClassId, Flags, Hero, ItemId, SceneId, Session, WeaponId } from './types';

export const SAVE_KEY = 'nightwatch-save';
export const SAVE_VERSION = 4;

/** Хранилище с интерфейсом localStorage — в тестах подменяется. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface SaveData {
  version: typeof SAVE_VERSION;
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

function migrateV3(save: SaveV3): SaveData {
  return {
    ...save,
    version: SAVE_VERSION,
    hero: { ...save.hero, inventory: [], xp: 0, level: 1, levelUps: 0 },
  };
}

/** Перевести сохранение любой известной версии в текущий формат: шаг за шагом, 2 → 3 → 4. */
export function migrate(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object' || !('version' in raw)) return null;
  let save = raw as SaveV2 | SaveV3 | SaveData;
  if (save.version === 2) {
    const v3 = migrateV2(save);
    if (!v3) return null;
    save = v3;
  }
  if (save.version === 3) save = migrateV3(save);
  return save.version === SAVE_VERSION ? save : null;
}

function isValid(save: SaveData): boolean {
  return (
    hasScene(save.sceneId) &&
    isClassId(save.hero.classId) &&
    isWeaponId(save.hero.weaponId) &&
    save.hero.inventory.every(isItemId)
  );
}

export function readSave(storage: SaveStorage): Session | null {
  try {
    const save = migrate(JSON.parse(storage.getItem(SAVE_KEY) ?? 'null'));
    if (!save || !isValid(save)) return null;
    return { hero: save.hero, sceneId: save.sceneId, flags: save.flags, fight: null, notices: [] };
  } catch {
    return null;
  }
}

/** Сохранить партию. Сцены смерти не сохраняются. */
export function writeSave(storage: SaveStorage, session: Session): void {
  if (isDeathScene(getScene(session.sceneId))) return;
  const save: SaveData = {
    version: SAVE_VERSION,
    sceneId: session.sceneId,
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
