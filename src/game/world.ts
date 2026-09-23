// Свободное перемещение: локации, точки интереса, персонажи по расписанию, течение времени
// и сюжетные события. Когда session.sceneId === null, герой не в сцене, а в локации (или у одной
// из её точек интереса, session.spotId); варианты строятся здесь, по группам.
import { EVENTS, type EventId } from '@/content/events';
import { location } from '@/content/locations';
import { NPCS, type NpcId } from '@/content/npcs';
import { getScene, isAvailable, textContext, withLimits } from './context';
import { heal } from './hero';
import { isKnown, isOpen, route } from './map';
import { changeRelations } from './relations';
import { inHours, nextMorning, toGameTime } from './time';
import type {
  Choice,
  LocationId,
  Notice,
  Rng,
  SceneId,
  Session,
  Spot,
  SpotId,
  StoryEvent,
} from './types';

/** Шаг, с которым идёт время при ожидании и сне: события проверяются после каждого шага. */
const TIME_STEP = 15;

const EVENT_IDS = Object.keys(EVENTS) as EventId[];
const NPC_IDS = Object.keys(NPCS) as NpcId[];

/** Кто из персонажей сейчас в локации героя. */
export function npcsHere(session: Session): NpcId[] {
  const time = toGameTime(session.time);
  return NPC_IDS.filter((id) =>
    NPCS[id].schedule.some(
      (shift) => shift.location === session.locationId && inHours(time, shift.hours),
    ),
  );
}

/** Ключ точки интереса в session.visited: «место.точка». */
export function spotKey(locationId: LocationId, spotId: SpotId): string {
  return locationId + '.' + spotId;
}

/** Точки интереса, видные сейчас в месте героя (по решениям и часам), по порядку. */
export function spotsHere(session: Session): [SpotId, Spot][] {
  const ctx = textContext(session);
  return Object.entries(location(session.locationId).spots ?? {}).filter(
    ([, spot]) =>
      (!spot.if || ctx.flag(spot.if)) &&
      (!spot.ifNot || !ctx.flag(spot.ifNot)) &&
      (!spot.hours || inHours(ctx.time, spot.hours)),
  );
}

/** Точка, у которой стоит герой, если она сейчас видна. */
export function currentSpot(session: Session): Spot | null {
  if (session.spotId === null) return null;
  return spotsHere(session).find(([id]) => id === session.spotId)?.[1] ?? null;
}

/** Группа вариантов при свободном перемещении; порядок групп — порядок клавиш 1–9. */
export interface RoamGroup {
  /** people — разговоры, spots — точки интереса, paths — выходы, time — ожидание и сон, spot — действия у точки. */
  kind: 'people' | 'spots' | 'paths' | 'time' | 'spot';
  choices: Choice[];
}

/** Варианты в локации по группам; у точки интереса — её действия и «Отойти». */
export function roamGroups(session: Session): RoamGroup[] {
  const place = location(session.locationId);
  const ctx = textContext(session);
  const spot = currentSpot(session);
  if (spot) {
    const actions = spot.actions
      .filter((choice) => isAvailable(choice, ctx))
      .map((choice) => withLimits(choice, session));
    return [{ kind: 'spot', choices: [...actions, { text: { id: 'back' }, back: true }] }];
  }
  const talks = npcsHere(session)
    .map((id): Choice => NPCS[id].talk)
    .filter((choice) => isAvailable(choice, ctx));
  const spots = spotsHere(session).map(([id, found]): Choice => ({ text: found.name, look: id }));
  const exits = place.exits
    .filter((exit) => isKnown(exit.to, session))
    .map((exit): Choice => {
      const choice: Choice = {
        text: { id: 'move', to: exit.to, minutes: exit.minutes },
        move: exit.to,
        minutes: exit.minutes,
      };
      return isOpen(exit, session)
        ? choice
        : { ...choice, disabled: exit.locked ?? { id: 'closed' } };
    });
  const rest: Choice[] = [{ text: { id: 'wait' }, wait: 60 }];
  if (place.bed) rest.push({ text: { id: 'sleep' }, sleep: true });
  const groups: RoamGroup[] = [
    { kind: 'people', choices: talks },
    { kind: 'spots', choices: spots },
    { kind: 'paths', choices: exits },
    { kind: 'time', choices: rest },
  ];
  return groups.filter((group) => group.choices.length > 0);
}

/** Варианты в локации подряд, в порядке групп. */
export function roamChoices(session: Session): Choice[] {
  return roamGroups(session).flatMap((group) => group.choices);
}

/** Есть ли в разговоре с персонажем тема, о которой герой ещё не спрашивал и может спросить сейчас. */
export function hasNewTopics(session: Session, id: NpcId): boolean {
  const ctx = textContext(session);
  return getScene(NPCS[id].talk.next).choices.some(
    (choice) =>
      choice.topic !== undefined &&
      !session.asked.includes(choice.topic) &&
      isAvailable(choice, ctx),
  );
}

/**
 * Помечать ли вариант «новое»: точка интереса, у которой герой не был, тема, о которой не
 * спрашивал, и разговор с персонажем, у которого есть такая тема.
 */
export function isNew(session: Session, choice: Choice): boolean {
  if ('look' in choice) return !session.visited.includes(spotKey(session.locationId, choice.look));
  if (choice.topic !== undefined) return !session.asked.includes(choice.topic);
  if (session.sceneId !== null || !('next' in choice)) return false;
  const npc = NPC_IDS.find((id) => NPCS[id].talk.next === choice.next);
  return npc !== undefined && hasNewTopics(session, npc);
}

/** Отметить, что герой здесь побывал (место или «место.точка»). */
function visit(session: Session, key: string): Session {
  return session.visited.includes(key)
    ? session
    : { ...session, visited: [...session.visited, key] };
}

/** Подойти к точке интереса. */
export function lookAt(session: Session, spotId: SpotId): Session {
  if (!spotsHere(session).some(([id]) => id === spotId)) return session;
  return visit({ ...session, spotId }, spotKey(session.locationId, spotId));
}

/** Отойти от точки интереса. */
export function stepBack(session: Session): Session {
  return { ...session, spotId: null };
}

/** Перейти в место: оно отмечается посещённым, точка интереса сбрасывается. */
function arrive(session: Session, locationId: LocationId): Session {
  return visit({ ...session, locationId, spotId: null }, locationId);
}

/**
 * Событие, которое должно начаться сейчас (только при свободном перемещении). Происшествия
 * (chance) бросают кубик rng; без rng (во сне, в отладке) они не случаются.
 */
export function dueEvent(session: Session, rng?: Rng): EventId | null {
  if (session.sceneId !== null) return null;
  const ctx = textContext(session);
  return (
    EVENT_IDS.find((id) => {
      const event: StoryEvent = EVENTS[id];
      return (
        !session.events.includes(id) &&
        (!event.location || event.location === session.locationId) &&
        (!event.hours || inHours(ctx.time, event.hours)) &&
        (!event.fromDay || ctx.time.day >= event.fromDay) &&
        (!event.if || ctx.flag(event.if)) &&
        (!event.ifNot || !ctx.flag(event.ifNot)) &&
        // кубик — последним, чтобы бросать его только за подходящие происшествия
        (event.chance === undefined || (rng !== undefined && rng() < event.chance))
      );
    }) ?? null
  );
}

/** Войти в сцену: сцена может перенести героя (location), запомнить решения (set) и изменить отношения. */
export function enterScene(session: Session, sceneId: SceneId): Session {
  const scene = getScene(sceneId);
  const relations = changeRelations(session.relations, scene.relation);
  return {
    ...session,
    ...arrive(session, scene.location ?? session.locationId),
    sceneId,
    flags: { ...session.flags, ...scene.set },
    relations: relations.relations,
    notices: [...session.notices, ...relations.notices],
  };
}

/** Начать событие, если оно должно случиться сейчас. */
export function startDueEvent(session: Session, rng?: Rng): Session {
  const id = dueEvent(session, rng);
  if (!id) return session;
  return enterScene({ ...session, events: [...session.events, id] }, EVENTS[id].scene);
}

/** Закончить сцену и оказаться в локации; там сразу может начаться событие. */
export function leaveScene(session: Session, to: true | LocationId, rng?: Rng): Session {
  const locationId = to === true ? session.locationId : to;
  return startDueEvent(arrive({ ...session, sceneId: null }, locationId), rng);
}

/** Перейти в соседнюю локацию (время на дорогу уже учтено выбором). */
export function moveTo(session: Session, to: LocationId, rng?: Rng): Session {
  return startDueEvent(arrive(session, to), rng);
}

/**
 * Дойти до места по карте: по самому быстрому пути, место за местом. Время идёт по дороге,
 * и событие в промежуточном месте прерывает путь. Недостижимое место — партия не меняется.
 */
export function travel(session: Session, to: LocationId, rng?: Rng): Session {
  const way = route(session, to);
  if (!way || session.sceneId !== null) return session;
  let current = session;
  for (const step of way.path) {
    const exit = location(current.locationId).exits.find((found) => found.to === step);
    current = moveTo({ ...current, time: current.time + (exit?.minutes ?? 0) }, step, rng);
    if (current.sceneId !== null) break;
  }
  return current;
}

/**
 * Пропустить время до момента until шагами по TIME_STEP минут; событие прерывает ожидание.
 * Возвращает новую партию и сколько минут прошло на самом деле.
 */
export function passTime(
  session: Session,
  until: number,
  rng?: Rng,
): { session: Session; elapsed: number } {
  let current = session;
  while (current.time < until && current.sceneId === null) {
    // шаги выровнены по четвертям часа, чтобы события начинались ровно в свой час
    const nextStep = (Math.floor(current.time / TIME_STEP) + 1) * TIME_STEP;
    current = startDueEvent({ ...current, time: Math.min(until, nextStep) }, rng);
  }
  return { session: current, elapsed: current.time - session.time };
}

/** Подождать; событие или происшествие может прервать ожидание. */
export function wait(
  session: Session,
  minutes: number,
  rng?: Rng,
): { session: Session; notices: Notice[] } {
  const result = passTime(session, session.time + minutes, rng);
  return { session: result.session, notices: [] };
}

/** Спать до утра: +1 здоровья за час сна; событие может разбудить, происшествие — нет. */
export function sleep(session: Session): { session: Session; notices: Notice[] } {
  const result = passTime(session, nextMorning(session.time));
  const hours = Math.floor(result.elapsed / 60);
  const hero = heal(result.session.hero, hours);
  const healed = hero.hp - result.session.hero.hp;
  const notices: Notice[] = [
    {
      tone: 'info',
      message: { id: 'slept', hours, woke: result.session.sceneId !== null, healed },
    },
  ];
  return { session: { ...result.session, hero }, notices };
}
