import { LEVEL_REWARDS } from '@/content/progression';
import type { Hero } from '@/game/types';
import { useStore } from '../store';

/** Окно нового уровня: награда на выбор (клавиши 1–4), вместе с ней — полное лечение. */
export function LevelUp({ hero }: { hero: Hero }) {
  const store = useStore();
  return (
    <div class="menu level-up">
      <div class="menu__inner">
        <h1>Новый уровень!</h1>
        <p class="level-up__subtitle">
          {hero.name} достигает уровня {hero.level - hero.levelUps + 1}. Выберите награду — вместе с
          ней здоровье восстановится полностью.
        </p>
        <div class="level-up__rewards">
          {LEVEL_REWARDS.map(({ reward, label }, i) => (
            <button key={label} class="action" onClick={() => store.chooseLevelReward(reward)}>
              <span class="action__key">{i + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
