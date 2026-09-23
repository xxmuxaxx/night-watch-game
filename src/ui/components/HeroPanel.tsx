import { Fragment } from 'preact';
import { heroClass } from '@/content/classes';
import { item } from '@/content/items';
import { STAT_IDS, STAT_NAMES } from '@/content/stats';
import { weapon } from '@/content/weapons';
import { armor } from '@/content/armors';
import { combatStats } from '@/game/combat';
import { inventoryCounts, itemBlocked } from '@/game/hero';
import type { JournalView } from '@/game/journal';
import type { Hero, ItemId } from '@/game/types';
import { percent } from '../format';
import { HpBar } from './HpBar';
import { XpBar } from './XpBar';

interface Props {
  hero: Hero;
  /** Использовать предмет из сумки; не передаётся, когда предметы использовать нельзя (бой). */
  onUseItem?: (id: ItemId) => void;
  /** Текущая цель из журнала. */
  goal?: JournalView | undefined;
  /** Открыть журнал; не передаётся, когда журнал открыть нельзя (бой). */
  onOpenJournal?: () => void;
  onOpenSettings?: () => void;
}

export function HeroPanel({ hero, onUseItem, goal, onOpenJournal, onOpenSettings }: Props) {
  const cls = heroClass(hero.classId);
  const heroWeapon = weapon(hero.weaponId);
  const chances = combatStats(hero);
  const rows: [string, string | number][] = [
    ...STAT_IDS.map((stat): [string, number] => [STAT_NAMES[stat], hero.stats[stat]]),
    ['Оружие', `${heroWeapon.name} (${heroWeapon.damage.min}–${heroWeapon.damage.max})`],
    [
      'Защита',
      armor(hero.armorId).name +
        (hero.armorId === 'none' ? '' : ' (−' + armor(hero.armorId).armor + ' урона)'),
    ],
    ['Точный удар', percent(chances.crit)],
    ['Уклонение', percent(chances.dodge)],
    ['Приём', cls.special.name],
  ];
  const bag = inventoryCounts(hero);

  return (
    <aside class="right-column">
      {onOpenSettings && (
        <button class="settings-button" title="Настройки (Esc)" onClick={onOpenSettings}>
          ⚙
        </button>
      )}
      <div class="hero-status">
        <img class="hero-status__portrait" src={hero.portrait} alt="" />
        <h3 class="hero-status__name">{hero.name}</h3>
        <div class="hero-status__class">
          {cls.title}, уровень {hero.level}
        </div>
        <HpBar hp={hero.hp} maxHp={hero.maxHp} />
        <XpBar xp={hero.xp} level={hero.level} />
        <button
          class="journal-button"
          disabled={!onOpenJournal}
          title="Открыть журнал (J)"
          onClick={() => onOpenJournal?.()}
        >
          <span class="journal-button__label">
            Журнал <kbd>J</kbd>
          </span>
          {goal && (
            <small>
              {goal.title}
              {goal.hint && ': ' + goal.hint}
            </small>
          )}
        </button>
        <dl class="stats">
          {rows.map(([label, value]) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
        <div class="bag">
          <h4>Сумка</h4>
          {bag.length === 0 ? (
            <p class="bag__empty">Пусто</p>
          ) : (
            <ul>
              {bag.map(({ id, count }) => {
                const blocked = itemBlocked(hero, id, false);
                return (
                  <li key={id}>
                    <button
                      class="bag__item"
                      disabled={!onUseItem || blocked !== null}
                      title={blocked ?? 'Использовать'}
                      onClick={() => onUseItem?.(id)}
                    >
                      <span>
                        {item(id).name}
                        {count > 1 && ' ×' + count}
                      </span>
                      <small>{item(id).description}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
