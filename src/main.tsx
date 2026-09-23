import { render } from 'preact';
import { browserStorage } from './game/save';
import { App } from './ui/App';
import { createSettingsStore, SettingsContext } from './ui/settings';
import { createGameStore, StoreContext } from './ui/store';
import './styles/main.css';

const storage = browserStorage();
const store = createGameStore(storage);
const settings = createSettingsStore(storage);
const root = document.getElementById('app');
if (!root) throw new Error('Нет элемента #app');

render(
  <StoreContext.Provider value={store}>
    <SettingsContext.Provider value={settings}>
      <App />
    </SettingsContext.Provider>
  </StoreContext.Provider>,
  root,
);
