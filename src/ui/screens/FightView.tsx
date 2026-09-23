import { useEffect, useRef } from 'preact/hooks';
import { heroClass } from '@/content/classes';
import { item } from '@/content/items';
import { canUseSpecial } from '@/game/combat';
import { canRetryFight } from '@/game/engine';
import { inventoryCounts, itemBlocked } from '@/game/hero';
import type { FightState, Session } from '@/game/types';
import { HpBar } from '../components/HpBar';
import { Picture } from '../components/Picture';
import { percent } from '../format';
import { useI18n } from '../i18n';
import { useStore } from '../store';

interface Props {
  /** Партия с идущим боем. */
  session: Session & { fight: FightState };
}

export function FightView({ session }: Props) {
  const { hero } = session;
  const fight = session.fight;
  const store = useStore();
  const { t, name, msg } = useI18n();
  const special = heroClass(hero.classId).special;
  const { enemy, result } = fight;
  const bag = inventoryCounts(hero);
  const parry = enemy.windingUp && result === null;
  const traits = [
    enemy.armor > 0 && t.fight.enemyArmor(enemy.armor),
    enemy.dodge > 0 && t.fight.enemyDodge(percent(enemy.dodge)),
  ].filter((trait): trait is string => typeof trait === 'string');

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [fight.log.length]);

  return (
    <div class="menu fight">
      <div class="fight-wrapper">
        <div class="fighter fighter--hero">
          <Picture key={hero.portrait} src={hero.portrait} />
          <h2>{hero.name}</h2>
          <HpBar hp={hero.hp} maxHp={hero.maxHp} />
        </div>

        <div class="fight-center">
          <div class="vs">VS</div>
          {result === null ? (
            <div class="fight-actions">
              <button class="action" onClick={() => store.fightAction('attack')}>
                <span class="action__key">1</span>
                {t.fight.attack}
                <small>{t.fight.attackInfo}</small>
              </button>
              <button
                class={'action' + (parry ? ' action--hint' : '')}
                onClick={() => store.fightAction('defend')}
              >
                <span class="action__key">2</span>
                {parry ? t.fight.parry : t.fight.defend}
                <small>{parry ? t.fight.parryInfo : t.fight.defendInfo}</small>
              </button>
              <button
                class="action action--special"
                title={name(special.name) + ': ' + name(special.description)}
                disabled={!canUseSpecial(fight)}
                onClick={() => store.fightAction('special')}
              >
                <span class="action__key">3</span>
                {name(special.name)}
                <small>
                  {fight.cooldown > 0
                    ? t.fight.cooldown(fight.cooldown)
                    : name(special.description)}
                </small>
              </button>
              {bag.map(({ id, count }, i) => {
                const blocked = itemBlocked(hero, id, true);
                return (
                  <button
                    key={id}
                    class="action action--item"
                    disabled={blocked !== null}
                    title={
                      blocked ? msg(blocked) : item(id).stun ? t.fight.itemStun : t.fight.itemPlain
                    }
                    onClick={() => store.fightAction({ item: id })}
                  >
                    {i === 0 && <span class="action__key">4</span>}
                    {name(item(id).name)}
                    {count > 1 && ' ×' + count}
                    <small>{name(item(id).description)}</small>
                  </button>
                );
              })}
            </div>
          ) : null}
          {fight.log.length > 0 && (
            <div class="fight-log" ref={logRef}>
              {fight.log.map((line, i) => (
                <p key={i}>{msg(line)}</p>
              ))}
            </div>
          )}
          {result !== null && (
            <div class="fight-outcome">
              <p class="fight-result">
                {result === 'win' ? t.fight.won : fight.loseScene ? t.fight.yielded : t.fight.lost}
              </p>
              {canRetryFight(session) ? (
                <>
                  <button class="button" onClick={() => store.retryFight()}>
                    {t.fight.retry}
                  </button>
                  <button class="button button--secondary" onClick={() => store.closeFight()}>
                    {t.fight.giveUp}
                  </button>
                </>
              ) : (
                <button class="button" onClick={() => store.closeFight()}>
                  {t.fight.continue}
                </button>
              )}
            </div>
          )}
        </div>

        <div class="fighter fighter--enemy">
          <Picture key={enemy.portrait} src={enemy.portrait} />
          <h2>{name(enemy.name)}</h2>
          <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
          {traits.length > 0 && <p class="enemy-traits">{traits.join(' · ')}</p>}
          <p class="intent">{parry ? t.fight.intent : ''}</p>
        </div>
      </div>
    </div>
  );
}
