import { armor } from '@/content/armors';
import { heroClass } from '@/content/classes';
import { item } from '@/content/items';
import { weapon } from '@/content/weapons';
import type { ClassId, Hero, ItemId, Loot, Notice } from './types';

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

/** Выдать добычу: оружие и защиту сразу на героя, предметы в сумку. Возвращает героя и сообщения «Получено: …». */
export function giveLoot(hero: Hero, loot: Loot | undefined): { hero: Hero; notices: Notice[] } {
  if (!loot) return { hero, notices: [] };
  const notices: Notice[] = [];
  let next = hero;
  if (loot.weapon) {
    next = { ...next, weaponId: loot.weapon };
    notices.push({ tone: 'info', text: 'Получено оружие: ' + weapon(loot.weapon).name });
  }
  if (loot.armor) {
    next = { ...next, armorId: loot.armor };
    notices.push({ tone: 'info', text: 'Получена защита: ' + armor(loot.armor).name });
  }
  for (const id of loot.items ?? []) {
    next = { ...next, inventory: [...next.inventory, id] };
    notices.push({ tone: 'info', text: 'В сумке: ' + item(id).name });
  }
  return { hero: next, notices };
}

export function hasItem(hero: Hero, id: ItemId): boolean {
  return hero.inventory.includes(id);
}

/** Использовать предмет из сумки. Если его нет, герой не меняется. */
export function consumeItem(hero: Hero, id: ItemId): Hero {
  const index = hero.inventory.indexOf(id);
  if (index < 0) return hero;
  const inventory = [...hero.inventory.slice(0, index), ...hero.inventory.slice(index + 1)];
  return heal({ ...hero, inventory }, item(id).heal ?? 0);
}

/** Почему предмет сейчас нельзя использовать, или null, если можно. */
export function itemBlocked(hero: Hero, id: ItemId, inFight: boolean): string | null {
  const def = item(id);
  if (def.stun && !inFight) return 'Пригодится в бою';
  if (!def.stun && hero.hp >= hero.maxHp) return 'Здоровье и так полное';
  return null;
}

/** Уникальные предметы сумки с количеством, в порядке получения. */
export function inventoryCounts(hero: Hero): { id: ItemId; count: number }[] {
  const counts = new Map<ItemId, number>();
  for (const id of hero.inventory) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].map(([id, count]) => ({ id, count }));
}
