import { useEffect, useRef, useState } from 'preact/hooks';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { SaveSlots } from '../components/SaveSlots';
import { useI18n } from '../i18n';
import { useSettings, type FontSize } from '../settings';
import { useStore } from '../store';

const FONT_SIZES: FontSize[] = ['small', 'normal', 'large'];

interface Props {
  onClose: () => void;
  /** Выйти в главное меню; передаётся только во время партии. */
  onExit?: () => void;
}

/** Настройки поверх игры или меню. Закрываются кнопкой или Esc. */
export function SettingsView({ onClose, onExit }: Props) {
  const [settings, update] = useSettings();
  const store = useStore();
  const { t } = useI18n();
  const [saved, setSaved] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div class="menu journal settings" role="dialog" aria-label={t.settings.title}>
      <div class="journal__inner">
        <header class="journal__header">
          <h1>{t.settings.title}</h1>
          <button ref={closeRef} class="journal__close" title={t.closeEsc} onClick={onClose}>
            ✕
          </button>
        </header>

        <section>
          <h2>{t.settings.language}</h2>
          <LanguageSwitch />
        </section>

        <section>
          <h2>{t.settings.text}</h2>
          <div class="settings__row" role="radiogroup" aria-label={t.settings.fontSize}>
            {FONT_SIZES.map((id) => (
              <button
                key={id}
                class={'settings__option' + (settings.fontSize === id ? ' is-active' : '')}
                aria-pressed={settings.fontSize === id}
                onClick={() => update({ fontSize: id })}
              >
                {t.settings.fontSizes[id]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>{t.settings.sound}</h2>
          <label class="one-life">
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(e) => update({ sound: e.currentTarget.checked })}
            />
            <span>{t.settings.soundInfo}</span>
          </label>
          <label class="settings__volume">
            <span>{t.settings.volume}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              disabled={!settings.sound}
              onInput={(e) => update({ volume: Number(e.currentTarget.value) })}
            />
          </label>
        </section>

        <section>
          <h2>{t.settings.hints}</h2>
          <label class="one-life">
            <input
              type="checkbox"
              checked={settings.hints}
              onChange={(e) => update({ hints: e.currentTarget.checked })}
            />
            <span>{t.settings.showHints}</span>
          </label>
          <button
            class="button button--secondary settings__button"
            disabled={settings.seenHints.length === 0}
            onClick={() => update({ seenHints: [], hints: true })}
          >
            {t.settings.resetHints}
          </button>
        </section>

        {onExit && (
          <section>
            <h2>{t.settings.game}</h2>
            <p class="journal__empty">{t.settings.autosave}</p>
            {store.canSaveToSlot() ? (
              <SaveSlots
                saves={store.listSaves()}
                mode="save"
                onPick={(slot) => {
                  store.saveToSlot(slot);
                  if (slot !== 'auto') setSaved(slot);
                }}
              />
            ) : (
              <p class="journal__empty">
                {store.getState().session?.oneLife
                  ? t.settings.noSlotsOneLife
                  : t.settings.noSlotsFight}
              </p>
            )}
            {saved !== null && <p class="save-slots__done">{t.settings.savedTo(saved)}</p>}
            <button class="button button--secondary settings__button" onClick={onExit}>
              {t.settings.exit}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
