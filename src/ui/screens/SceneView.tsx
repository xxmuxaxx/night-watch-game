import { location } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { STAT_NAMES } from '@/content/stats';
import { checkChance } from '@/game/checks';
import { availableChoices, getScene, resolveImage, textContext } from '@/game/engine';
import type { Session } from '@/game/types';
import { npcsHere } from '@/game/world';
import { Picture } from '../components/Picture';
import { useI18n } from '../i18n';
import { useStore } from '../store';

/**
 * Экран истории: сцена (картинка, собеседник, текст, варианты) или, когда сцены нет,
 * локация — описание, кто рядом, разговоры, действия, выходы, ожидание и сон.
 */
export function SceneView({ session }: { session: Session }) {
  const store = useStore();
  const { t, name, text: tx, label, msg, time } = useI18n();
  const ctx = textContext(session);
  const choices = availableChoices(session);
  const place = location(session.locationId);

  const scene = session.sceneId === null ? null : getScene(session.sceneId);
  const npcs = scene ? [] : npcsHere(session).map((id) => NPCS[id]);
  const image = resolveImage(scene ? scene.image : place.image, ctx);
  const actor = scene ? scene.actor : npcs[0]?.portrait;
  const title = name(scene ? scene.title : place.name);
  const text = tx(scene ? scene.text : place.text, ctx);
  // смена ключа перезапускает анимацию появления: новая сцена или новое место
  const view = session.sceneId ?? 'place:' + session.locationId;

  return (
    <main class="event-container">
      <div class="image-container">
        {actor && (
          <div class="actor-image">
            <Picture key={actor} src={actor} />
          </div>
        )}
        <Picture key={image} src={image} class="scene-image" />
      </div>

      <div class="text fade-in" key={'text:' + view}>
        <p class="scene-meta">
          {name(place.name)} · {time(session.time)}
        </p>
        {session.notices.length > 0 && (
          <div class="notices">
            {session.notices.map((notice, i) => (
              <p key={i} class={'notice notice--' + notice.tone}>
                {msg(notice.message)}
              </p>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        <p class="scene-text">{text}</p>
        {npcs.length > 0 && (
          <p class="scene-npcs">
            {t.scene.here}
            {npcs.map((npc) => name(npc.name)).join(', ')}
          </p>
        )}
      </div>

      <ul class="select fade-in fade-in--late" key={'choices:' + view}>
        {choices.map((choice, i) => (
          <li key={i}>
            <button
              class="choice"
              disabled={choice.disabled !== undefined}
              onClick={() => store.choose(choice)}
            >
              {'check' in choice && (
                <span class="check-tag">
                  {name(STAT_NAMES[choice.check.stat])}{' '}
                  {Math.round(checkChance(session.hero, choice.check) * 100)}%
                </span>
              )}
              <span>
                {label(choice.text, ctx)}
                {choice.disabled && (
                  <small class="choice__locked">{label(choice.disabled, ctx)}</small>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
