import { useEffect, useRef } from 'preact/hooks';
import { heroClass } from '@/content/classes';
import { item } from '@/content/items';
import { canUseSpecial } from '@/game/combat';
import { inventoryCounts } from '@/game/hero';
import type { FightState, Hero } from '@/game/types';
import { HpBar } from '../components/HpBar';
import { Picture } from '../components/Picture';
import { percent, turns } from '../format';
import { useStore } from '../store';

interface Props {
  hero: Hero;
  fight: FightState;
}

export function FightView({ hero, fight }: Props) {
  const store = useStore();
  const special = heroClass(hero.classId).special;
  const { enemy, result } = fight;
  const bag = inventoryCounts(hero);
  const parry = enemy.windingUp && result === null;
  const traits = [
    enemy.armor > 0 && 'доспех ' + enemy.armor + ': точный удар пробивает',
    enemy.dodge > 0 && 'увёртлив (' + percent(enemy.dodge) + '): от приёма не уйдёт',
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
                <span class="action__key">1</span>Ударить<small>обычный удар</small>
              </button>
              <button
                class={'action' + (parry ? ' action--hint' : '')}
                onClick={() => store.fightAction('defend')}
              >
                <span class="action__key">2</span>
                {parry ? 'Парировать' : 'Защищаться'}
                <small>
                  {parry ? 'отбить сильный удар и ударить в ответ' : 'вдвое меньше урона'}
                </small>
              </button>
              <button
                class="action action--special"
                title={special.name + ': ' + special.description}
                disabled={!canUseSpecial(fight)}
                onClick={() => store.fightAction('special')}
              >
                <span class="action__key">3</span>
                {special.name}
                <small>
                  {fight.cooldown > 0 ? 'через ' + turns(fight.cooldown) : special.description}
                </small>
              </button>
              {bag.map(({ id, count }, i) => (
                <button
                  key={id}
                  class="action action--item"
                  disabled={hero.hp >= hero.maxHp}
                  title={
                    hero.hp >= hero.maxHp ? 'Здоровье и так полное' : 'Вместо удара; враг ответит'
                  }
                  onClick={() => store.fightAction({ item: id })}
                >
                  {i === 0 && <span class="action__key">4</span>}
                  {item(id).name}
                  {count > 1 && ' ×' + count}
                  <small>{item(id).description}</small>
                </button>
              ))}
            </div>
          ) : null}
          {fight.log.length > 0 && (
            <div class="fight-log" ref={logRef}>
              {fight.log.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          {result !== null && (
            <div>
              <p class="fight-result">{result === 'win' ? 'Вы победили' : 'Вы проиграли'}</p>
              <button class="button" onClick={() => store.closeFight()}>
                Продолжить
              </button>
            </div>
          )}
        </div>

        <div class="fighter fighter--enemy">
          <Picture key={enemy.portrait} src={enemy.portrait} />
          <h2>{enemy.name}</h2>
          <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
          {traits.length > 0 && <p class="enemy-traits">{traits.join(' · ')}</p>}
          <p class="intent">{parry ? 'Готовит сильный удар! Защита его парирует' : ''}</p>
        </div>
      </div>
    </div>
  );
}
