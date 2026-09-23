import { useStore } from '../store';

interface Props {
  onOpenSettings: () => void;
  onOpenLoad: () => void;
}

export function MainMenu({ onOpenSettings, onOpenLoad }: Props) {
  const store = useStore();
  return (
    <div class="menu main-menu">
      <div class="menu__inner">
        <h1 class="ng-title">Night Watch</h1>
        <p class="ng-subtitle">Северный рубеж</p>
        <div class="buttons-wrapper">
          {store.listSaves()[0] && (
            <button class="button" onClick={() => store.loadGame()}>
              Продолжить
            </button>
          )}
          <button
            class={store.listSaves()[0] ? 'button button--secondary' : 'button'}
            onClick={() => store.openHeroCreation()}
          >
            Начать новую игру
          </button>
          {store.hasSave() && (
            <button class="button button--secondary" onClick={onOpenLoad}>
              Загрузить игру
            </button>
          )}
          <button class="button button--secondary" onClick={onOpenSettings}>
            Настройки
          </button>
        </div>
      </div>
    </div>
  );
}
