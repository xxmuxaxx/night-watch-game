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
import { useI18n } from '../i18n';
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
  /** Открыть карту крепости; не передаётся, когда её открыть нельзя (бой). */
  onOpenMap?: () => void;
  onOpenSettings?: () => void;
}

export function HeroPanel({
  hero,
  onUseItem,
  goal,
  onOpenJournal,
  onOpenMap,
  onOpenSettings,
}: Props) {
  const { t, name, msg } = useI18n();
  const cls = heroClass(hero.classId);
  const heroWeapon = weapon(hero.weaponId);
  const heroArmor = armor(hero.armorId);
  const chances = combatStats(hero);
  const rows: [string, string | number][] = [
    ...STAT_IDS.map((stat): [string, number] => [name(STAT_NAMES[stat]), hero.stats[stat]]),
    [t.hero.weapon, `${name(heroWeapon.name)} (${heroWeapon.damage.min}–${heroWeapon.damage.max})`],
    [
      t.hero.armor,
      name(heroArmor.name) +
        (hero.armorId === 'none' ? '' : ' (' + t.hero.armorValue(heroArmor.armor) + ')'),
    ],
    [t.hero.crit, percent(chances.crit)],
    [t.hero.dodge, percent(chances.dodge)],
    [t.hero.special, name(cls.special.name)],
  ];
  const bag = inventoryCounts(hero);

  return (
    <aside class="right-column">
      {onOpenSettings && (
        <button class="settings-button" title={t.hero.settings} onClick={onOpenSettings}>
          ⚙
        </button>
      )}
      <div class="hero-status">
        <img class="hero-status__portrait" src={hero.portrait} alt="" />
        <h3 class="hero-status__name">{hero.name}</h3>
        <div class="hero-status__class">{t.hero.classLevel(name(cls.title), hero.level)}</div>
        <HpBar hp={hero.hp} maxHp={hero.maxHp} />
        <XpBar xp={hero.xp} level={hero.level} />
        <button
          class="journal-button"
          disabled={!onOpenJournal}
          title={t.hero.openJournal}
          onClick={() => onOpenJournal?.()}
        >
          <span class="journal-button__label">
            {t.hero.journal} <kbd>J</kbd>
          </span>
          {goal && (
            <small>
              {goal.title}
              {goal.hint && ': ' + goal.hint}
            </small>
          )}
        </button>
        <button
          class="journal-button map-button"
          disabled={!onOpenMap}
          title={t.map.openInfo}
          onClick={() => onOpenMap?.()}
        >
          <span class="journal-button__label">
            {t.map.open} <kbd>M</kbd>
          </span>
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
          <h4>{t.hero.bag}</h4>
          {bag.length === 0 ? (
            <p class="bag__empty">{t.empty}</p>
          ) : (
            <ul>
              {bag.map(({ id, count }) => {
                const blocked = itemBlocked(hero, id, false);
                return (
                  <li key={id}>
                    <button
                      class="bag__item"
                      disabled={!onUseItem || blocked !== null}
                      title={blocked ? msg(blocked) : t.hero.use}
                      onClick={() => onUseItem?.(id)}
                    >
                      <span>
                        {name(item(id).name)}
                        {count > 1 && ' ×' + count}
                      </span>
                      <small>{name(item(id).description)}</small>
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
