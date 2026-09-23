// Свободное перемещение: локации, персонажи по расписанию, течение времени и сюжетные события.
// Когда session.sceneId === null, герой не в сцене, а в локации; варианты строятся здесь.
import { EVENTS, type EventId } from '@/content/events';
import { location, LOCATIONS } from '@/content/locations';
import { NPCS, type NpcId } from '@/content/npcs';
import { getScene, isAvailable, textContext, withDaily } from './context';
import { heal } from './hero';
import { changeRelations } from './relations';
import { inHours, nextMorning, toGameTime } from './time';
import type { Choice, LocationId, Notice, SceneId, Session, StoryEvent } from './types';

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

/** Варианты в локации: разговоры, действия на месте, выходы, ожидание и сон. */
export function roamChoices(session: Session): Choice[] {
  const place = location(session.locationId);
  const ctx = textContext(session);
  const talks = npcsHere(session)
    .map((id): Choice => NPCS[id].talk)
    .filter((choice) => isAvailable(choice, ctx));
  const actions = (place.actions ?? [])
    .filter((choice) => isAvailable(choice, ctx))
    .map((choice) => withDaily(choice, session));
  const exits = place.exits.map((exit): Choice => {
    const open = !exit.if || ctx.flag(exit.if);
    const choice: Choice = {
      text: 'Пойти: ' + LOCATIONS[exit.to].name + ' (' + exit.minutes + ' мин)',
      move: exit.to,
      minutes: exit.minutes,
    };
    return open ? choice : { ...choice, disabled: exit.locked ?? 'Закрыто' };
  });
  const rest: Choice[] = [{ text: 'Подождать час', wait: 60 }];
  if (place.bed) rest.push({ text: 'Лечь спать до утра', sleep: true });
  return [...talks, ...actions, ...exits, ...rest];
}

/** Событие, которое должно начаться сейчас (только при свободном перемещении). */
export function dueEvent(session: Session): EventId | null {
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
        (!event.ifNot || !ctx.flag(event.ifNot))
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
    sceneId,
    locationId: scene.location ?? session.locationId,
    flags: { ...session.flags, ...scene.set },
    relations: relations.relations,
    notices: [...session.notices, ...relations.notices],
  };
}

/** Начать событие, если оно должно случиться сейчас. */
export function startDueEvent(session: Session): Session {
  const id = dueEvent(session);
  if (!id) return session;
  return enterScene({ ...session, events: [...session.events, id] }, EVENTS[id].scene);
}

/** Закончить сцену и оказаться в локации; там сразу может начаться событие. */
export function leaveScene(session: Session, to: true | LocationId): Session {
  const locationId = to === true ? session.locationId : to;
  return startDueEvent({ ...session, sceneId: null, locationId });
}

/** Перейти в соседнюю локацию (время на дорогу уже учтено выбором). */
export function moveTo(session: Session, to: LocationId): Session {
  return startDueEvent({ ...session, locationId: to });
}

/**
 * Пропустить время до момента until шагами по TIME_STEP минут; событие прерывает ожидание.
 * Возвращает новую партию и сколько минут прошло на самом деле.
 */
export function passTime(session: Session, until: number): { session: Session; elapsed: number } {
  let current = session;
  while (current.time < until && current.sceneId === null) {
    // шаги выровнены по четвертям часа, чтобы события начинались ровно в свой час
    const nextStep = (Math.floor(current.time / TIME_STEP) + 1) * TIME_STEP;
    current = startDueEvent({ ...current, time: Math.min(until, nextStep) });
  }
  return { session: current, elapsed: current.time - session.time };
}

/** Подождать; событие может прервать ожидание. */
export function wait(session: Session, minutes: number): { session: Session; notices: Notice[] } {
  const result = passTime(session, session.time + minutes);
  return { session: result.session, notices: [] };
}

/** Спать до утра: +1 здоровья за час сна; событие может разбудить. */
export function sleep(session: Session): { session: Session; notices: Notice[] } {
  const result = passTime(session, nextMorning(session.time));
  const hours = Math.floor(result.elapsed / 60);
  const hero = heal(result.session.hero, hours);
  const healed = hero.hp - result.session.hero.hp;
  const notices: Notice[] = [
    {
      tone: 'info',
      text:
        'Вы проспали ' +
        hours +
        ' ч' +
        (result.session.sceneId !== null ? ' и проснулись' : '') +
        (healed > 0 ? ' (+' + healed + ' здоровья)' : ''),
    },
  ];
  return { session: { ...result.session, hero }, notices };
}
