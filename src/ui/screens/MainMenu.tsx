import { LanguageSwitch } from '../components/LanguageSwitch';
import { useI18n } from '../i18n';
import { useStore } from '../store';

interface Props {
  onOpenSettings: () => void;
  onOpenLoad: () => void;
}

export function MainMenu({ onOpenSettings, onOpenLoad }: Props) {
  const store = useStore();
  const { t } = useI18n();
  return (
    <div class="menu main-menu">
      <div class="menu__inner">
        <h1 class="ng-title">Night Watch</h1>
        <p class="ng-subtitle">{t.menu.subtitle}</p>
        <div class="buttons-wrapper">
          {store.listSaves()[0] && (
            <button class="button" onClick={() => store.loadGame()}>
              {t.menu.continue}
            </button>
          )}
          <button
            class={store.listSaves()[0] ? 'button button--secondary' : 'button'}
            onClick={() => store.openHeroCreation()}
          >
            {t.menu.newGame}
          </button>
          {store.hasSave() && (
            <button class="button button--secondary" onClick={onOpenLoad}>
              {t.menu.load}
            </button>
          )}
          <button class="button button--secondary" onClick={onOpenSettings}>
            {t.menu.settings}
          </button>
        </div>
        <LanguageSwitch />
      </div>
    </div>
  );
}
