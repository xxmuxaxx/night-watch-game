// Проверки контента: ловят ошибки в сюжете, которые не видны TypeScript.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HERO_PORTRAITS } from '@/content/portraits';
import { SCENES, START_SCENE } from '@/content/story';
import type { Choice, FlagId, SceneId } from '@/game/types';

const scenes = Object.entries(SCENES);
const choices = scenes.flatMap(([id, scene]) => scene.choices.map((choice) => ({ id, choice })));

function targets(choice: Choice): SceneId[] {
  return [...('next' in choice ? [choice.next] : []), ...('fail' in choice ? [choice.fail] : [])];
}

describe('сюжет', () => {
  it('стартовая сцена существует', () => {
    expect(SCENES[START_SCENE]).toBeDefined();
  });

  it('все переходы ведут в существующие сцены', () => {
    const broken = choices.flatMap(({ id, choice }) =>
      targets(choice)
        .filter((target) => !SCENES[target])
        .map((target) => id + ' → ' + target),
    );
    expect(broken).toEqual([]);
  });

  it('все сцены достижимы из стартовой', () => {
    const seen = new Set<SceneId>([START_SCENE]);
    const queue = [START_SCENE];
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      for (const choice of SCENES[id]?.choices ?? []) {
        for (const target of targets(choice)) {
          if (!seen.has(target)) {
            seen.add(target);
            queue.push(target);
          }
        }
      }
    }
    expect(scenes.map(([id]) => id).filter((id) => !seen.has(id))).toEqual([]);
  });

  it('все картинки лежат в public/', () => {
    const images = new Set<string>(HERO_PORTRAITS);
    for (const [, scene] of scenes) {
      images.add(scene.image);
      if (scene.actor) images.add(scene.actor);
    }
    for (const { choice } of choices) if ('fight' in choice) images.add(choice.fight.portrait);
    const missing = [...images].filter((path) => !existsSync(resolve('public', path)));
    expect(missing).toEqual([]);
  });

  it('каждое решение, от которого что-то зависит, где-то принимается', () => {
    const setFlags = new Set<FlagId>();
    for (const { choice } of choices) {
      Object.keys(choice.set ?? {}).forEach((f) => setFlags.add(f as FlagId));
      if ('check' in choice)
        Object.keys(choice.check.set ?? {}).forEach((f) => setFlags.add(f as FlagId));
    }
    const required = choices
      .flatMap(({ choice }) => [choice.if, choice.ifNot])
      .filter((f) => f !== undefined);
    expect(required.filter((flag) => !setFlags.has(flag))).toEqual([]);
  });
});
