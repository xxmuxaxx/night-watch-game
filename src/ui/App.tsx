import { useEffect, useState } from 'preact/hooks';
import { isChoosingLevelReward } from '@/game/engine';
import { activeGoals, journal } from '@/game/journal';
import { people } from '@/game/relations';
import { HeroPanel } from './components/HeroPanel';
import { HintToast } from './components/HintToast';
import { DebugPanel } from './debug/DebugPanel';
import { CreateHero } from './screens/CreateHero';
import { FightView } from './screens/FightView';
import { Journal } from './screens/Journal';
import { LevelUp } from './screens/LevelUp';
import { MainMenu } from './screens/MainMenu';
import { SceneView } from './screens/SceneView';
import { SettingsView } from './screens/SettingsView';
import { currentHint } from './hints';
import { useSettings } from './settings';
import { useGameState, useStore } from './store';
import { useKeyboard, type Panel } from './useKeyboard';

/** Окно игры: сцена и панель героя, поверх них — меню, создание героя, бой, новый уровень или журнал. */
export function App() {
  const store = useStore();
  const state = useGameState();
  const [settings, updateSettings] = useSettings();
  const session = state.session;
  const inStory = state.screen === 'story' && session;
  // журнал открывается вне боя и выбора награды за уровень
  const canOpenJournal =
    state.screen === 'story' &&
    session !== null &&
    !session.fight &&
    !isChoosingLevelReward(session);
  const [panel, setPanel] = useState<Panel | null>(null);
  const showJournal = canOpenJournal && panel === 'journal';
  // после смерти или выхода в меню новая партия начинается с закрытым журналом
  useEffect(() => {
    if (!canOpenJournal) setPanel((open) => (open === 'journal' ? null : open));
  }, [canOpenJournal]);
  // размер шрифта из настроек — на корневом элементе: от него считаются все rem
  useEffect(() => {
    document.documentElement.dataset['font'] = settings.fontSize;
  }, [settings.fontSize]);
  const hint = settings.hints && !panel ? currentHint(state, settings.seenHints) : null;
  useKeyboard(store, {
    panel,
    toggle: (next) => setPanel((open) => (open === next ? null : next)),
    close: () => setPanel(null),
  });

  return (
    <div class="wrapper">
      {session && (
        <>
          <SceneView session={session} />
          <HeroPanel
            hero={session.hero}
            {...(session.fight ? {} : { onUseItem: (id) => store.applyItem(id) })}
            goal={activeGoals(session)[0]}
            {...(canOpenJournal ? { onOpenJournal: () => setPanel('journal') } : {})}
            onOpenSettings={() => setPanel('settings')}
          />
        </>
      )}
      {state.screen === 'menu' && <MainMenu onOpenSettings={() => setPanel('settings')} />}
      {state.screen === 'createHero' && <CreateHero />}
      {inStory && session.fight && <FightView session={{ ...session, fight: session.fight }} />}
      {inStory && isChoosingLevelReward(session) && <LevelUp hero={session.hero} />}
      {showJournal && (
        <Journal
          entries={journal(session)}
          people={people(session)}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'settings' && (
        <SettingsView
          onClose={() => setPanel(null)}
          {...(inStory
            ? {
                onExit: () => {
                  setPanel(null);
                  store.exitToMenu();
                },
              }
            : {})}
        />
      )}
      {hint && (
        <HintToast
          hint={hint}
          onClose={() => updateSettings({ seenHints: [...settings.seenHints, hint.id] })}
        />
      )}
      {import.meta.env.DEV && <DebugPanel state={state} />}
    </div>
  );
}
