import { LEVEL_REWARDS } from '@/content/progression';
import type { Hero } from '@/game/types';
import { useI18n } from '../i18n';
import { useStore } from '../store';

/** Окно нового уровня: награда на выбор (клавиши 1–4), вместе с ней — полное лечение. */
export function LevelUp({ hero }: { hero: Hero }) {
  const store = useStore();
  const { t, name } = useI18n();
  return (
    <div class="menu level-up">
      <div class="menu__inner">
        <h1>{t.levelUp.title}</h1>
        <p class="level-up__subtitle">
          {t.levelUp.subtitle(hero.name, hero.level - hero.levelUps + 1)}
        </p>
        <div class="level-up__rewards">
          {LEVEL_REWARDS.map(({ reward, label }, i) => (
            <button key={label} class="action" onClick={() => store.chooseLevelReward(reward)}>
              <span class="action__key">{i + 1}</span>
              {name(label)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
