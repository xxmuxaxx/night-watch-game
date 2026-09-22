import { STAT_NAMES } from '@/content/stats';
import { checkChance } from '@/game/checks';
import { availableChoices, getScene, resolveText, textContext } from '@/game/engine';
import type { Session } from '@/game/types';
import { Picture } from '../components/Picture';
import { useStore } from '../store';

/** Сцена: картинка, портрет собеседника, итог проверки, текст и пронумерованные варианты. */
export function SceneView({ session }: { session: Session }) {
  const store = useStore();
  const scene = getScene(session.sceneId);
  const ctx = textContext(session);
  const choices = availableChoices(session);

  return (
    <main class="event-container">
      <div class="image-container">
        {scene.actor && (
          <div class="actor-image">
            <Picture key={scene.actor} src={scene.actor} />
          </div>
        )}
        <Picture key={scene.image} src={scene.image} class="scene-image" />
      </div>

      <div class="text">
        {session.notice && (
          <p
            class={
              'check-result ' +
              (session.notice.success ? 'check-result--success' : 'check-result--fail')
            }
          >
            {session.notice.text}
          </p>
        )}
        <h1>{scene.title}</h1>
        <p class="scene-text">{resolveText(scene.text, ctx)}</p>
      </div>

      <ul class="select">
        {choices.map((choice, i) => (
          <li key={i}>
            <button class="choice" onClick={() => store.choose(choice)}>
              {'check' in choice && (
                <span class="check-tag">
                  {STAT_NAMES[choice.check.stat]}{' '}
                  {Math.round(checkChance(session.hero, choice.check) * 100)}%
                </span>
              )}
              <span>{resolveText(choice.text, ctx)}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
