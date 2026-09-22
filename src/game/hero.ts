import { heroClass } from '@/content/classes';
import type { ClassId, Hero } from './types';

export interface NewHero {
  name: string;
  classId: ClassId;
  portrait: string;
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
  };
}

export function heal(hero: Hero, amount: number): Hero {
  return { ...hero, hp: Math.min(hero.maxHp, hero.hp + amount) };
}
