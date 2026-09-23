import { useState } from 'preact/hooks';
import { CLASS_IDS, HERO_CLASSES, type ClassId } from '@/content/classes';
import { HERO_PORTRAITS } from '@/content/portraits';
import { STAT_IDS, STAT_NAMES } from '@/content/stats';
import type { HeroClass } from '@/game/types';
import { percent } from '../format';
import { useStore } from '../store';

function classStats(cls: HeroClass): string {
  const stats = [
    'Здоровье ' + cls.maxHp,
    ...STAT_IDS.map((s) => STAT_NAMES[s] + ' ' + cls.stats[s]),
  ];
  if (cls.crit) stats.push('Точный удар ' + percent(cls.crit));
  if (cls.dodge) stats.push('Уклонение ' + percent(cls.dodge));
  return stats.join(' · ');
}

export function CreateHero() {
  const store = useStore();
  const [name, setName] = useState('Ивар');
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
        <h1>Создайте своего героя</h1>

        <h3>
          <label for="hero-name">Имя</label>
        </h3>
        <input
          type="text"
          id="hero-name"
          value={name}
          maxLength={24}
          onInput={(e) => setName(e.currentTarget.value)}
        />

        <h3>Внешний вид</h3>
        <div class="hero-faces">
          {HERO_PORTRAITS.map((src, i) => (
            <label key={src}>
              <input
                type="radio"
                name="portrait"
                checked={portrait === src}
                onChange={() => setPortrait(src)}
              />
              <img src={src} alt={'Портрет ' + (i + 1)} />
            </label>
          ))}
        </div>

        <h3>Класс</h3>
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
                  <h4>{cls.title}</h4>
                  <p>{cls.description}</p>
                  <div class="class-card__stats">{classStats(cls)}</div>
                  <div class="class-card__special">
                    Приём «{cls.special.name}»: {cls.special.description}
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
            <b>Одна жизнь.</b> Смерть стирает сохранение, проигранный бой нельзя начать заново.
          </span>
        </label>

        {nameError && <p class="error">Введите имя героя!</p>}
        <button class="button" onClick={start}>
          Начать
        </button>
      </div>
    </div>
  );
}
