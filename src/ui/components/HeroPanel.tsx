import { Fragment } from 'preact';
import { heroClass } from '@/content/classes';
import { STAT_IDS, STAT_NAMES } from '@/content/stats';
import { weapon } from '@/content/weapons';
import type { Hero } from '@/game/types';
import { percent } from '../format';
import { HpBar } from './HpBar';

export function HeroPanel({ hero }: { hero: Hero }) {
  const cls = heroClass(hero.classId);
  const heroWeapon = weapon(hero.weaponId);
  const rows: [string, string | number][] = [
    ...STAT_IDS.map((stat): [string, number] => [STAT_NAMES[stat], hero.stats[stat]]),
    ['Оружие', `${heroWeapon.name} (${heroWeapon.damage.min}–${heroWeapon.damage.max})`],
    ['Точный удар', percent(cls.crit)],
    ['Уклонение', percent(cls.dodge)],
    ['Приём', cls.special.name],
  ];

  return (
    <aside class="right-column">
      <div class="hero-status">
        <img class="hero-status__portrait" src={hero.portrait} alt="" />
        <h3 class="hero-status__name">{hero.name}</h3>
        <div class="hero-status__class">{cls.title}</div>
        <HpBar hp={hero.hp} maxHp={hero.maxHp} />
        <dl class="stats">
          {rows.map(([label, value]) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </aside>
  );
}
