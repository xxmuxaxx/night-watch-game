import { render } from 'preact';
import { browserStorage } from './game/save';
import { App } from './ui/App';
import { createGameStore, StoreContext } from './ui/store';
import './styles/main.css';

const store = createGameStore(browserStorage());
const root = document.getElementById('app');
if (!root) throw new Error('Нет элемента #app');

render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  root,
);
