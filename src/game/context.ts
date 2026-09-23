// Общее для движка и мира: доступ к сценам и контекст, от которого зависят тексты и варианты.
import { SCENES } from '@/content/story';
import { inHours, toGameTime } from './time';
import type { Choice, FlagId, Scene, SceneId, Session, Text, TextContext } from './types';

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
  };
}

export function resolveText(text: Text, ctx: TextContext): string {
  return typeof text === 'function' ? text(ctx) : text;
}

/** Показывать ли вариант: решения (if / ifNot) и часы (hours). */
export function isAvailable(choice: Choice, ctx: TextContext): boolean {
  return (
    (!choice.if || ctx.flag(choice.if)) &&
    (!choice.ifNot || !ctx.flag(choice.ifNot)) &&
    (!choice.hours || inHours(ctx.time, choice.hours))
  );
}

/** Сцена смерти: в ней есть «Конец игры». Такие сцены не сохраняются. */
export function isDeathScene(scene: Scene): boolean {
  return scene.choices.some((choice) => 'gameOver' in choice);
}
