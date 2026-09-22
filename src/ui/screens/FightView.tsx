import { useEffect, useRef } from 'preact/hooks';
import { heroClass } from '@/content/classes';
import { canUseSpecial } from '@/game/combat';
import type { FightState, Hero } from '@/game/types';
import { HpBar } from '../components/HpBar';
import { turns } from '../format';
import { useStore } from '../store';

interface Props {
  hero: Hero;
  fight: FightState;
}

export function FightView({ hero, fight }: Props) {
  const store = useStore();
  const special = heroClass(hero.classId).special;
  const { enemy, result } = fight;

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [fight.log.length]);

  return (
    <div class="menu fight">
      <div class="fight-wrapper">
        <div class="fighter fighter--hero">
          <img src={hero.portrait} alt="" />
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
              <button class="action" onClick={() => store.fightAction('defend')}>
                <span class="action__key">2</span>Защищаться<small>вдвое меньше урона</small>
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
          <img src={enemy.portrait} alt="" />
          <h2>{enemy.name}</h2>
          <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
          <p class="intent">{enemy.windingUp && result === null ? 'Готовит сильный удар!' : ''}</p>
        </div>
      </div>
    </div>
  );
}
