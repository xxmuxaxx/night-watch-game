import { useState } from 'preact/hooks';
import { CLASS_IDS, HERO_CLASSES, type ClassId } from '@/content/classes';
import { HERO_PORTRAITS } from '@/content/portraits';
import { STAT_IDS, STAT_NAMES } from '@/content/stats';
import type { HeroClass } from '@/game/types';
import type { I18n } from '@/i18n';
import { percent } from '../format';
import { useI18n } from '../i18n';
import { useStore } from '../store';

function classStats(cls: HeroClass, { t, name }: I18n): string {
  const stats = [
    t.createHero.health + ' ' + cls.maxHp,
    ...STAT_IDS.map((s) => name(STAT_NAMES[s]) + ' ' + cls.stats[s]),
  ];
  if (cls.crit) stats.push(t.hero.crit + ' ' + percent(cls.crit));
  if (cls.dodge) stats.push(t.hero.dodge + ' ' + percent(cls.dodge));
  return stats.join(' · ');
}

export function CreateHero() {
  const store = useStore();
  const i18n = useI18n();
  const { t } = i18n;
  const [name, setName] = useState(t.createHero.defaultName);
  const [portrait, setPortrait] = useState(HERO_PORTRAITS[0] ?? '');
  const [classId, setClassId] = useState<ClassId>(CLASS_IDS[0] ?? 'warrior');
  const [nameError, setNameError] = useState(false);
  const [oneLife, setOneLife] = useState(false);

  function start() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    store.startNewGame({ name: trimmed, classId, portrait, oneLife });
  }

  return (
    <div class="menu create-hero-wrapper">
      <div class="menu__inner">
        <h1>{t.createHero.title}</h1>

        <h3>
          <label for="hero-name">{t.createHero.name}</label>
        </h3>
        <input
          type="text"
          id="hero-name"
          value={name}
          maxLength={24}
          onInput={(e) => setName(e.currentTarget.value)}
        />

        <h3>{t.createHero.looks}</h3>
        <div class="hero-faces">
          {HERO_PORTRAITS.map((src, i) => (
            <label key={src}>
              <input
                type="radio"
                name="portrait"
                checked={portrait === src}
                onChange={() => setPortrait(src)}
              />
              <img src={src} alt={t.createHero.portrait(i + 1)} />
            </label>
          ))}
        </div>

        <h3>{t.createHero.class}</h3>
        <div class="hero-classes">
          {CLASS_IDS.map((id) => {
            const cls = HERO_CLASSES[id];
            return (
              <label key={id}>
                <input
                  type="radio"
                  name="class"
                  checked={classId === id}
                  onChange={() => setClassId(id)}
                />
                <div class="class-card">
                  <h4>{i18n.name(cls.title)}</h4>
                  <p>{i18n.name(cls.description)}</p>
                  <div class="class-card__stats">{classStats(cls, i18n)}</div>
                  <div class="class-card__special">
                    {t.createHero.special(
                      i18n.name(cls.special.name),
                      i18n.name(cls.special.description),
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <label class="one-life">
          <input
            type="checkbox"
            checked={oneLife}
            onChange={(e) => setOneLife(e.currentTarget.checked)}
          />
          <span>
            <b>{t.createHero.oneLife}</b> {t.createHero.oneLifeInfo}
          </span>
        </label>

        {nameError && <p class="error">{t.createHero.nameError}</p>}
        <button class="button" onClick={start}>
          {t.createHero.start}
        </button>
      </div>
    </div>
  );
}
