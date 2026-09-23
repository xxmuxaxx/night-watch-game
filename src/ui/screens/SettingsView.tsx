import { useEffect, useRef } from 'preact/hooks';
import { useSettings, type FontSize } from '../settings';

const FONT_SIZES: { id: FontSize; label: string }[] = [
  { id: 'small', label: 'Мелкий' },
  { id: 'normal', label: 'Обычный' },
  { id: 'large', label: 'Крупный' },
];

interface Props {
  onClose: () => void;
  /** Выйти в главное меню; передаётся только во время партии. */
  onExit?: () => void;
}

/** Настройки поверх игры или меню. Закрываются кнопкой или Esc. */
export function SettingsView({ onClose, onExit }: Props) {
  const [settings, update] = useSettings();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div class="menu journal settings" role="dialog" aria-label="Настройки">
      <div class="journal__inner">
        <header class="journal__header">
          <h1>Настройки</h1>
          <button ref={closeRef} class="journal__close" title="Закрыть (Esc)" onClick={onClose}>
            ✕
          </button>
        </header>

        <section>
          <h2>Текст</h2>
          <div class="settings__row" role="radiogroup" aria-label="Размер шрифта">
            {FONT_SIZES.map(({ id, label }) => (
              <button
                key={id}
                class={'settings__option' + (settings.fontSize === id ? ' is-active' : '')}
                aria-pressed={settings.fontSize === id}
                onClick={() => update({ fontSize: id })}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Подсказки</h2>
          <label class="one-life">
            <input
              type="checkbox"
              checked={settings.hints}
              onChange={(e) => update({ hints: e.currentTarget.checked })}
            />
            <span>Показывать подсказки для новичка</span>
          </label>
          <button
            class="button button--secondary settings__button"
            disabled={settings.seenHints.length === 0}
            onClick={() => update({ seenHints: [], hints: true })}
          >
            Показать подсказки заново
          </button>
        </section>

        {onExit && (
          <section>
            <h2>Партия</h2>
            <p class="journal__empty">Игра сохраняется сама после каждого выбора.</p>
            <button class="button button--secondary settings__button" onClick={onExit}>
              Выйти в главное меню
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
