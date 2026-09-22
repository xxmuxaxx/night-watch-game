import { useStore } from '../store';

export function MainMenu() {
  const store = useStore();
  return (
    <div class="menu main-menu">
      <div class="menu__inner">
        <h1 class="ng-title">Night Watch</h1>
        <p class="ng-subtitle">Северный рубеж</p>
        <div class="buttons-wrapper">
          <button class="button" onClick={() => store.openHeroCreation()}>
            Начать новую игру
          </button>
          {store.hasSave() && (
            <button class="button button--secondary" onClick={() => store.loadGame()}>
              Загрузить игру
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
