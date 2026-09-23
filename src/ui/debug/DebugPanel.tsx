// Панель отладки: только в режиме разработки (npm run dev), в сборку для игроков не попадает.
// Открывается кнопкой в левом нижнем углу или клавишей ` (Ё).
import { useEffect, useState } from 'preact/hooks';
import { CLASS_IDS, HERO_CLASSES } from '@/content/classes';
import { FLAGS, type FlagId } from '@/content/flags';
import { ITEMS, type ItemId } from '@/content/items';
import { LOCATIONS, type LocationId } from '@/content/locations';
import { NPCS, type NpcId } from '@/content/npcs';
import { STAT_IDS, STAT_NAMES } from '@/content/stats';
import { SCENES } from '@/content/story';
import { WEAPONS, type WeaponId } from '@/content/weapons';
import * as debug from '@/game/debug';
import { heal } from '@/game/hero';
import { addXp } from '@/game/progression';
import { attitude, relationOf } from '@/game/relations';
import { formatTime } from '@/game/time';
import type { GameState, StatId } from '@/game/types';
import { useStore } from '../store';

const SCENE_IDS = Object.keys(SCENES);
const FLAG_IDS = Object.keys(FLAGS) as FlagId[];
const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[];
const LOCATION_IDS = Object.keys(LOCATIONS) as LocationId[];
const NPC_IDS = Object.keys(NPCS) as NpcId[];

export function DebugPanel({ state }: { state: GameState }) {
  const store = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Backquote' || (e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      e.preventDefault();
      setOpen((value) => !value);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) {
    return (
      <button class="debug-toggle" title="Панель отладки (`)" onClick={() => setOpen(true)}>
        🛠
      </button>
    );
  }

  const session = state.session;
  const hero = session?.hero;
  const stat = (id: StatId, delta: number) =>
    store.apply((s) =>
      debug.updateHero(s, (h) => ({
        ...h,
        stats: { ...h.stats, [id]: Math.max(0, h.stats[id] + delta) },
      })),
    );

  return (
    <div class="debug-panel">
      <div class="debug-panel__header">
        <strong>Отладка</strong>
        <button onClick={() => setOpen(false)}>✕</button>
      </div>

      <section>
        <h5>Быстрый старт</h5>
        {CLASS_IDS.map((id) => (
          <button key={id} onClick={() => store.apply((s) => debug.quickStart(s, id))}>
            {HERO_CLASSES[id].title}
          </button>
        ))}
      </section>

      {session && hero && (
        <>
          <section>
            <h5>Сцена</h5>
            <select
              value={session.sceneId ?? ''}
              onChange={(e) => {
                const id = e.currentTarget.value;
                store.apply((s) =>
                  id ? debug.jumpToScene(s, id) : debug.goToLocation(s, session.locationId),
                );
              }}
            >
              <option value="">— свободное перемещение —</option>
              {SCENE_IDS.map((id) => (
                <option key={id} value={id}>
                  {id} — {SCENES[id]?.title}
                </option>
              ))}
            </select>
            {session.fight && !session.fight.result && (
              <button onClick={() => store.apply(debug.winFight)}>Победить в бою</button>
            )}
          </section>

          <section>
            <h5>Мир: {formatTime(session.time)}</h5>
            <div class="debug-row">
              <span>Место</span>
              <select
                value={session.locationId}
                onChange={(e) =>
                  store.apply((s) => debug.goToLocation(s, e.currentTarget.value as LocationId))
                }
              >
                {LOCATION_IDS.map((id) => (
                  <option key={id} value={id}>
                    {LOCATIONS[id].name}
                  </option>
                ))}
              </select>
            </div>
            <div class="debug-row">
              <button onClick={() => store.apply((s) => debug.passHours(s, 1))}>+1 ч</button>
              <button onClick={() => store.apply((s) => debug.passHours(s, 6))}>+6 ч</button>
              <button onClick={() => store.apply(debug.resetEvents)}>Сбросить события</button>
            </div>
            <div>События: {session.events.length ? session.events.join(', ') : 'нет'}</div>
          </section>

          <section>
            <h5>
              Герой: {hero.hp}/{hero.maxHp} здоровья, {hero.xp} опыта, уровень {hero.level}
            </h5>
            <div class="debug-row">
              <button
                onClick={() =>
                  store.apply((s) => debug.updateHero(s, (h) => ({ ...h, hp: h.hp - 1 })))
                }
              >
                −1 здоровье
              </button>
              <button
                onClick={() => store.apply((s) => debug.updateHero(s, (h) => heal(h, h.maxHp)))}
              >
                Вылечить
              </button>
              <button onClick={() => store.apply((s) => debug.updateHero(s, (h) => addXp(h, 5)))}>
                +5 опыта
              </button>
              <button onClick={() => store.apply((s) => debug.updateHero(s, (h) => addXp(h, 20)))}>
                +20 опыта
              </button>
            </div>
            {STAT_IDS.map((id) => (
              <div class="debug-row" key={id}>
                <span>
                  {STAT_NAMES[id]}: {hero.stats[id]}
                </span>
                <button onClick={() => stat(id, -1)}>−</button>
                <button onClick={() => stat(id, 1)}>+</button>
              </div>
            ))}
            <div class="debug-row">
              <span>Оружие</span>
              <select
                value={hero.weaponId}
                onChange={(e) =>
                  store.apply((s) =>
                    debug.updateHero(s, (h) => ({
                      ...h,
                      weaponId: e.currentTarget.value as WeaponId,
                    })),
                  )
                }
              >
                {WEAPON_IDS.map((id) => (
                  <option key={id} value={id}>
                    {WEAPONS[id].name}
                  </option>
                ))}
              </select>
            </div>
            <div class="debug-row">
              {ITEM_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() =>
                    store.apply((s) =>
                      debug.updateHero(s, (h) => ({ ...h, inventory: [...h.inventory, id] })),
                    )
                  }
                >
                  + {ITEMS[id].name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h5>Отношения</h5>
            {NPC_IDS.map((id) => {
              const value = relationOf(session.relations, id);
              return (
                <div class="debug-row" key={id}>
                  <span>
                    {NPCS[id].name}: {value} ({attitude(value)})
                  </span>
                  <button onClick={() => store.apply((s) => debug.changeRelation(s, id, -1))}>
                    −
                  </button>
                  <button onClick={() => store.apply((s) => debug.changeRelation(s, id, 1))}>
                    +
                  </button>
                </div>
              );
            })}
          </section>

          <section>
            <h5>Решения</h5>
            {FLAG_IDS.map((id) => (
              <label key={id} class="debug-flag" title={FLAGS[id]}>
                <input
                  type="checkbox"
                  checked={session.flags[id] === true}
                  onChange={() => store.apply((s) => debug.toggleFlag(s, id))}
                />
                {id}
              </label>
            ))}
          </section>
        </>
      )}

      <section>
        <h5>Сохранение</h5>
        <button onClick={() => store.deleteSave()}>Удалить сохранение</button>
      </section>
    </div>
  );
}
