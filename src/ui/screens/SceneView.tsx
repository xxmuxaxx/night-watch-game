import type { ComponentChildren } from 'preact';
import { location } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { STAT_NAMES } from '@/content/stats';
import { checkChance } from '@/game/checks';
import { availableChoices, getScene, resolveImage, textContext } from '@/game/engine';
import type { Choice, Session, TextContext } from '@/game/types';
import { peopleAt } from '@/game/map';
import { currentSpot, isNew, npcsHere, roamGroups, type RoamGroup } from '@/game/world';
import { Picture } from '../components/Picture';
import { useI18n } from '../i18n';
import { useStore } from '../store';
import { choiceKey } from '../useKeyboard';

/**
 * Экран истории: сцена (картинка, собеседник, текст, варианты) или, когда сцены нет,
 * локация — описание, кто рядом и варианты по группам: люди, точки интереса, пути, время.
 * У точки интереса — её описание и действия.
 */
export function SceneView({ session }: { session: Session }) {
  const { t, name, text: tx, msg, time } = useI18n();
  const ctx = textContext(session);
  const place = location(session.locationId);

  const scene = session.sceneId === null ? null : getScene(session.sceneId);
  const spot = scene ? null : currentSpot(session);
  const npcs = scene || spot ? [] : npcsHere(session).map((id) => NPCS[id]);
  // по имени — только знакомые: кузнеца до разговора с ним не назвать
  const known = scene || spot ? [] : peopleAt(session.locationId, session).map((id) => NPCS[id]);
  const image = resolveImage(scene?.image ?? spot?.image ?? place.image, ctx);
  const actor = scene ? scene.actor : npcs[0]?.portrait;
  const title = name(scene?.title ?? spot?.name ?? place.name);
  const text = tx(scene?.text ?? spot?.text ?? place.text, ctx);
  // смена ключа перезапускает анимацию появления: новая сцена, новое место или точка
  const view = session.sceneId ?? 'place:' + session.locationId + ':' + (session.spotId ?? '');

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
          {name(place.name)}
          {spot && ' · ' + name(spot.name)} · {time(session.time)}
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
        {known.length > 0 && (
          <p class="scene-npcs">
            {t.scene.here}
            {known.map((npc) => name(npc.name)).join(', ')}
          </p>
        )}
      </div>

      <div class="select fade-in fade-in--late" key={'choices:' + view}>
        {scene ? (
          <ChoiceList session={session} ctx={ctx} choices={availableChoices(session)} />
        ) : (
          roamGroups(session).map((group, i, groups) => (
            <ChoiceGroup key={group.kind} group={group}>
              <ChoiceList
                session={session}
                ctx={ctx}
                choices={group.choices}
                // номера сквозные через все группы — как клавиши
                start={groups.slice(0, i).reduce((sum, g) => sum + g.choices.length, 0)}
              />
            </ChoiceGroup>
          ))
        )}
      </div>
    </main>
  );
}

/** Группа вариантов с заголовком; у точки интереса заголовка нет — он уже над текстом. */
function ChoiceGroup({ group, children }: { group: RoamGroup; children: ComponentChildren }) {
  const { t } = useI18n();
  return (
    <section class={'choice-group choice-group--' + group.kind}>
      {group.kind !== 'spot' && <h2 class="choice-group__title">{t.scene.groups[group.kind]}</h2>}
      {children}
    </section>
  );
}

interface ListProps {
  session: Session;
  ctx: TextContext;
  choices: Choice[];
  /** Номер первого варианта списка среди всех вариантов экрана (с нуля). */
  start?: number;
}

function ChoiceList({ session, ctx, choices, start = 0 }: ListProps) {
  const store = useStore();
  const { t, name, label } = useI18n();
  return (
    <ul>
      {choices.map((choice, i) => (
        <li key={i}>
          <button
            class="choice"
            disabled={choice.disabled !== undefined}
            onClick={() => store.choose(choice)}
          >
            <span class="choice__key" aria-hidden="true">
              {choiceKey(start + i)}
            </span>
            {'check' in choice && (
              <span class="check-tag">
                {name(STAT_NAMES[choice.check.stat])}{' '}
                {Math.round(checkChance(session.hero, choice.check) * 100)}%
              </span>
            )}
            <span>
              {label(choice.text, ctx)}
              {isNew(session, choice) && <span class="new-tag">{t.scene.new}</span>}
              {choice.disabled && (
                <small class="choice__locked">{label(choice.disabled, ctx)}</small>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
