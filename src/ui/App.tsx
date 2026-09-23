import { isChoosingLevelReward } from '@/game/engine';
import { HeroPanel } from './components/HeroPanel';
import { CreateHero } from './screens/CreateHero';
import { FightView } from './screens/FightView';
import { LevelUp } from './screens/LevelUp';
import { MainMenu } from './screens/MainMenu';
import { SceneView } from './screens/SceneView';
import { useGameState, useStore } from './store';
import { useKeyboard } from './useKeyboard';

/** Окно игры: сцена и панель героя, поверх них — меню, создание героя, бой или новый уровень. */
export function App() {
  const store = useStore();
  const state = useGameState();
  useKeyboard(store, state);
  const session = state.session;
  const inStory = state.screen === 'story' && session;

  return (
    <div class="wrapper">
      {session && (
        <>
          <SceneView session={session} />
          <HeroPanel
            hero={session.hero}
            {...(session.fight ? {} : { onUseItem: (id) => store.applyItem(id) })}
          />
        </>
      )}
      {state.screen === 'menu' && <MainMenu />}
      {state.screen === 'createHero' && <CreateHero />}
      {inStory && session.fight && <FightView hero={session.hero} fight={session.fight} />}
      {inStory && isChoosingLevelReward(session) && <LevelUp hero={session.hero} />}
    </div>
  );
}
