import { useEffect, useState } from 'preact/hooks';
import { isChoosingLevelReward } from '@/game/engine';
import { activeGoals, journal } from '@/game/journal';
import { people } from '@/game/relations';
import { HeroPanel } from './components/HeroPanel';
import { DebugPanel } from './debug/DebugPanel';
import { CreateHero } from './screens/CreateHero';
import { FightView } from './screens/FightView';
import { Journal } from './screens/Journal';
import { LevelUp } from './screens/LevelUp';
import { MainMenu } from './screens/MainMenu';
import { SceneView } from './screens/SceneView';
import { useGameState, useStore } from './store';
import { useKeyboard } from './useKeyboard';

/** Окно игры: сцена и панель героя, поверх них — меню, создание героя, бой, новый уровень или журнал. */
export function App() {
  const store = useStore();
  const state = useGameState();
  const session = state.session;
  const inStory = state.screen === 'story' && session;
  // журнал открывается вне боя и выбора награды за уровень
  const canOpenJournal =
    state.screen === 'story' &&
    session !== null &&
    !session.fight &&
    !isChoosingLevelReward(session);
  const [journalOpen, setJournalOpen] = useState(false);
  const showJournal = canOpenJournal && journalOpen;
  // после смерти или выхода в меню новая партия начинается с закрытым журналом
  useEffect(() => {
    if (!canOpenJournal) setJournalOpen(false);
  }, [canOpenJournal]);
  useKeyboard(store, { open: showJournal, toggle: () => setJournalOpen((open) => !open) });

  return (
    <div class="wrapper">
      {session && (
        <>
          <SceneView session={session} />
          <HeroPanel
            hero={session.hero}
            {...(session.fight ? {} : { onUseItem: (id) => store.applyItem(id) })}
            goal={activeGoals(session)[0]}
            {...(canOpenJournal ? { onOpenJournal: () => setJournalOpen(true) } : {})}
          />
        </>
      )}
      {state.screen === 'menu' && <MainMenu />}
      {state.screen === 'createHero' && <CreateHero />}
      {inStory && session.fight && <FightView hero={session.hero} fight={session.fight} />}
      {inStory && isChoosingLevelReward(session) && <LevelUp hero={session.hero} />}
      {showJournal && (
        <Journal
          entries={journal(session)}
          people={people(session)}
          onClose={() => setJournalOpen(false)}
        />
      )}
      {import.meta.env.DEV && <DebugPanel state={state} />}
    </div>
  );
}
