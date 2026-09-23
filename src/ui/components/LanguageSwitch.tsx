import { LANG_NAMES, LANGS } from '@/i18n';
import { useI18n } from '../i18n';
import { useSettings } from '../settings';

/** Выбор языка: в меню и в настройках. */
export function LanguageSwitch() {
  const [settings, update] = useSettings();
  const { t } = useI18n();
  return (
    <div class="settings__row language-switch" role="radiogroup" aria-label={t.settings.language}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          lang={lang}
          class={'settings__option' + (settings.language === lang ? ' is-active' : '')}
          aria-pressed={settings.language === lang}
          onClick={() => update({ language: lang })}
        >
          {LANG_NAMES[lang]}
        </button>
      ))}
    </div>
  );
}
