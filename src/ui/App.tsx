import { HeroPanel } from './components/HeroPanel';
import { CreateHero } from './screens/CreateHero';
import { FightView } from './screens/FightView';
import { MainMenu } from './screens/MainMenu';
import { SceneView } from './screens/SceneView';
import { useGameState, useStore } from './store';
import { useKeyboard } from './useKeyboard';

/** Окно игры: сцена и панель героя, поверх них — меню, создание героя или бой. */
export function App() {
  const store = useStore();
  const state = useGameState();
  useKeyboard(store, state);
  const session = state.session;

  return (
    <div class="wrapper">
      {session && (
        <>
          <SceneView session={session} />
          <HeroPanel hero={session.hero} />
        </>
      )}
      {state.screen === 'menu' && <MainMenu />}
      {state.screen === 'createHero' && <CreateHero />}
      {state.screen === 'story' && session?.fight && (
        <FightView hero={session.hero} fight={session.fight} />
      )}
    </div>
  );
}
