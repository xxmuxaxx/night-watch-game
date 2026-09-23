import { heroClass } from '@/content/classes';
import { item } from '@/content/items';
import type { ClassId, Hero, ItemId, Loot, Message, Notice } from './types';

export interface NewHero {
  name: string;
  classId: ClassId;
  portrait: string;
  /** Режим «Одна жизнь» (см. Session.oneLife). */
  oneLife?: boolean;
}

export function createHero({ name, classId, portrait }: NewHero): Hero {
  const cls = heroClass(classId);
  return {
    name,
    classId,
    portrait,
    stats: { ...cls.stats },
    hp: cls.maxHp,
    maxHp: cls.maxHp,
    weaponId: 'fists',
    armorId: 'none',
    inventory: [],
    xp: 0,
    level: 1,
    levelUps: 0,
  };
}

export function heal(hero: Hero, amount: number): Hero {
  return { ...hero, hp: Math.min(hero.maxHp, hero.hp + amount) };
}

/** Выдать добычу: оружие и защиту сразу на героя, предметы в сумку. Возвращает героя и сообщения о полученном. */
export function giveLoot(hero: Hero, loot: Loot | undefined): { hero: Hero; notices: Notice[] } {
  if (!loot) return { hero, notices: [] };
  const notices: Notice[] = [];
  let next = hero;
  if (loot.weapon) {
    next = { ...next, weaponId: loot.weapon };
    notices.push({ tone: 'info', message: { id: 'gotWeapon', weapon: loot.weapon } });
  }
  if (loot.armor) {
    next = { ...next, armorId: loot.armor };
    notices.push({ tone: 'info', message: { id: 'gotArmor', armor: loot.armor } });
  }
  for (const id of loot.items ?? []) {
    next = { ...next, inventory: [...next.inventory, id] };
    notices.push({ tone: 'info', message: { id: 'gotItem', item: id } });
  }
  return { hero: next, notices };
}

export function hasItem(hero: Hero, id: ItemId): boolean {
  return hero.inventory.includes(id);
}

/** Убрать один такой предмет из сумки, ничего с ним не делая (отдать, проиграть). */
export function removeItem(hero: Hero, id: ItemId): Hero {
  const index = hero.inventory.indexOf(id);
  if (index < 0) return hero;
  return {
    ...hero,
    inventory: [...hero.inventory.slice(0, index), ...hero.inventory.slice(index + 1)],
  };
}

/** Использовать предмет из сумки: лечит, точит оружие. Если его нет, герой не меняется. */
export function consumeItem(hero: Hero, id: ItemId): Hero {
  const index = hero.inventory.indexOf(id);
  if (index < 0) return hero;
  const inventory = [...hero.inventory.slice(0, index), ...hero.inventory.slice(index + 1)];
  const def = item(id);
  const weaponId =
    def.sharpen && hero.weaponId === def.sharpen.from ? def.sharpen.to : hero.weaponId;
  return heal({ ...hero, inventory, weaponId }, def.heal ?? 0);
}

/** Предмет, который можно пустить в ход в бою: лечит или оглушает. */
export function usableInFight(id: ItemId): boolean {
  const def = item(id);
  return def.heal !== undefined || def.stun === true;
}

/** Почему предмет сейчас нельзя использовать, или null, если можно. */
export function itemBlocked(hero: Hero, id: ItemId, inFight: boolean): Message | null {
  const def = item(id);
  if (def.sharpen) {
    if (inFight) return { id: 'notInFight' };
    return hero.weaponId === def.sharpen.from ? null : { id: 'nothingToSharpen' };
  }
  if (!usableInFight(id)) return { id: 'passive' };
  if (def.stun && !inFight) return { id: 'forFight' };
  if (!def.stun && hero.hp >= hero.maxHp) return { id: 'fullHealth' };
  return null;
}

/** Есть ли в сумке свет (факел): проверки в темноте легче. */
export function hasLight(hero: Hero): boolean {
  return hero.inventory.some((id) => item(id).light === true);
}

/** Уникальные предметы сумки с количеством, в порядке получения. */
export function inventoryCounts(hero: Hero): { id: ItemId; count: number }[] {
  const counts = new Map<ItemId, number>();
  for (const id of hero.inventory) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, count }));
}

/** Предметы сумки, которые можно пустить в ход в бою; первый — на клавише 4. */
export function fightItems(hero: Hero): { id: ItemId; count: number }[] {
  return inventoryCounts(hero).filter(({ id }) => usableInFight(id));
}
