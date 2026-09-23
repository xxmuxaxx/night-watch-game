// Общее для движка и мира: доступ к сценам и контекст, от которого зависят тексты и варианты.
import { SCENES } from '@/content/story';
import { inHours, toGameTime } from './time';
import type {
  Choice,
  Condition,
  FlagId,
  Image,
  NpcId,
  RelationCondition,
  Scene,
  SceneId,
  Session,
  Text,
  TextContext,
} from './types';

export function getScene(id: SceneId): Scene {
  const scene = SCENES[id];
  if (!scene) throw new Error('Нет сцены ' + id);
  return scene;
}

export function hasScene(id: SceneId): boolean {
  return id in SCENES;
}

export function textContext(session: Session): TextContext {
  return {
    hero: session.hero,
    flag: (id: FlagId) => session.flags[id] === true,
    time: toGameTime(session.time),
    location: session.locationId,
    relation: (id: NpcId) => session.relations[id] ?? 0,
  };
}

/** Условие по решениям и событиям (журнал, знакомые персонажи). */
export function meetsCondition(condition: Condition, session: Session): boolean {
  return (
    (!condition.if || session.flags[condition.if] === true) &&
    (!condition.ifNot || session.flags[condition.ifNot] !== true) &&
    (!condition.ifAny || condition.ifAny.some((flag) => session.flags[flag] === true)) &&
    (!condition.event || session.events.includes(condition.event))
  );
}

/** Отношение персонажа в пределах min–max. */
export function meetsRelation(condition: RelationCondition, ctx: TextContext): boolean {
  const value = ctx.relation(condition.npc);
  return (
    (condition.min === undefined || value >= condition.min) &&
    (condition.max === undefined || value <= condition.max)
  );
}

export function resolveText(text: Text, ctx: TextContext): string {
  return typeof text === 'function' ? text(ctx) : text;
}

export function resolveImage(image: Image, ctx: TextContext): string {
  return typeof image === 'function' ? image(ctx) : image;
}

/**
 * Показывать ли вариант: решения (if / ifNot), отношения (ifRelation) и часы (hours).
 * Вариант с showClosed вне своих часов показывается — закрытым (см. withLimits).
 */
export function isAvailable(choice: Choice, ctx: TextContext): boolean {
  return (
    (!choice.if || ctx.flag(choice.if)) &&
    (!choice.ifNot || !ctx.flag(choice.ifNot)) &&
    (!choice.ifRelation || meetsRelation(choice.ifRelation, ctx)) &&
    (!choice.hours || choice.showClosed === true || inHours(ctx.time, choice.hours))
  );
}

/**
 * Закрыть вариант, который сейчас нельзя выбрать, с причиной: занятие раз в день, которое сегодня
 * уже было, или занятие по расписанию вне своих часов.
 */
export function withLimits(choice: Choice, session: Session): Choice {
  const time = toGameTime(session.time);
  if (choice.daily && session.daily[choice.daily] === time.day) {
    return { ...choice, disabled: { id: 'doneToday' } };
  }
  if (choice.hours && choice.showClosed && !inHours(time, choice.hours)) {
    return { ...choice, disabled: { id: 'hours', hours: choice.hours } };
  }
  return choice;
}

/** Сцена смерти: в ней есть «Конец игры». Такие сцены не сохраняются. */
export function isDeathScene(scene: Scene): boolean {
  return scene.choices.some((choice) => 'gameOver' in choice);
}
