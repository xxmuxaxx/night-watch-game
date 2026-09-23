// Проверки контента: ловят ошибки в сюжете и мире, которые не видны TypeScript.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@/content/enemies';
import { EVENTS } from '@/content/events';
import { JOURNAL } from '@/content/journal';
import { LOCATIONS } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { HERO_PORTRAITS } from '@/content/portraits';
import { SCENES, START_SCENE } from '@/content/story';
import * as engine from '@/game/engine';
import { atTime } from '@/game/time';
import { sessionOf } from './helpers';
import type {
  Choice,
  Condition,
  FlagId,
  Image,
  JournalEntry,
  LocationId,
  Npc,
  SceneId,
  StoryEvent,
} from '@/game/types';

/**
 * Картинки, для которых уже есть промпт в docs/image-prompts.md, но ещё нет файла: игра их прячет
 * (компонент Picture). Когда файл появится в public/img, строку отсюда надо убрать.
 */
const AWAITING_ART = new Set<string>([]);

const scenes = Object.entries(SCENES);
const locations = Object.values(LOCATIONS);
const npcs: Npc[] = Object.values(NPCS);
const events: StoryEvent[] = Object.values(EVENTS);
const journal: JournalEntry[] = Object.values(JOURNAL);
/** Все условия журнала: появление записей, отдельные записи и выполнение целей. */
const journalConditions: Condition[] = journal.flatMap((entry) => [
  entry,
  ...entry.notes,
  ...(entry.done ? [entry.done] : []),
]);

/** Действия у точек интереса всех мест. */
const spotActions: { where: string; choice: Choice }[] = Object.entries(LOCATIONS).flatMap(
  ([id, place]) =>
    Object.entries(place.spots ?? {}).flatMap(([spotId, spot]) =>
      spot.actions.map((choice) => ({ where: id + '.' + spotId, choice })),
    ),
);

/** Все варианты игры: в сценах, действия у точек интереса и разговоры с персонажами. */
const choices: { where: string; choice: Choice }[] = [
  ...scenes.flatMap(([id, scene]) => scene.choices.map((choice) => ({ where: id, choice }))),
  ...spotActions,
  ...Object.entries(NPCS).map(([id, npc]) => ({ where: id, choice: npc.talk as Choice })),
];

function targets(choice: Choice): SceneId[] {
  return [
    ...('next' in choice ? [choice.next] : []),
    ...('fail' in choice ? [choice.fail] : []),
    ...('lose' in choice && choice.lose ? [choice.lose] : []),
  ];
}

describe('сюжет', () => {
  it('стартовая сцена существует', () => {
    expect(SCENES[START_SCENE]).toBeDefined();
  });

  it('все переходы и события ведут в существующие сцены', () => {
    const broken = [
      ...choices.flatMap(({ where, choice }) =>
        targets(choice)
          .filter((target) => !SCENES[target])
          .map((target) => where + ' → ' + target),
      ),
      ...events.filter((event) => !SCENES[event.scene]).map((event) => 'событие → ' + event.scene),
    ];
    expect(broken).toEqual([]);
  });

  it('все сцены достижимы: из пролога, событий, разговоров и действий у точек интереса', () => {
    const roots: SceneId[] = [
      START_SCENE,
      ...events.map((event) => event.scene),
      ...npcs.map((npc) => npc.talk.next),
      ...spotActions.flatMap(({ choice }) => targets(choice)),
    ];
    const seen = new Set<SceneId>(roots);
    const queue = [...roots];
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
    // картинка-функция проверяется во всех местах и во все части суток
    const game = engine.startNewGame(engine.initialState, {
      name: 'Тест',
      classId: 'warrior',
      portrait: 'img/hero-1.jpg',
    });
    const contexts = (Object.keys(LOCATIONS) as LocationId[]).flatMap((locationId) =>
      [3, 9, 15, 20].map((hour) =>
        engine.textContext({ ...sessionOf(game), locationId, time: atTime(1, hour) }),
      ),
    );
    const add = (image: Image) => {
      if (typeof image === 'string') images.add(image);
      else for (const ctx of contexts) images.add(image(ctx));
    };
    for (const [, scene] of scenes) {
      add(scene.image);
      if (scene.actor) images.add(scene.actor);
    }
    for (const place of locations) add(place.image);
    for (const npc of npcs) images.add(npc.portrait);
    for (const { choice } of choices) if ('fight' in choice) images.add(choice.fight.portrait);
    for (const enemy of Object.values(ENEMIES)) images.add(enemy.portrait);
    const missing = [...images].filter(
      (path) => !existsSync(resolve('public', path)) && !AWAITING_ART.has(path),
    );
    expect(missing).toEqual([]);
    // картинка уже нарисована — её пора убрать из списка ожидающих
    expect([...AWAITING_ART].filter((path) => existsSync(resolve('public', path)))).toEqual([]);
  });

  it('каждое решение, от которого что-то зависит, где-то принимается', () => {
    const setFlags = new Set<string>();
    const add = (flags: object | undefined) =>
      Object.keys(flags ?? {}).forEach((f) => setFlags.add(f));
    for (const { choice } of choices) {
      add(choice.set);
      if ('check' in choice) add(choice.check.set);
    }
    for (const [, scene] of scenes) add(scene.set);

    const required: FlagId[] = [
      ...choices.flatMap(({ choice }) => [choice.if, choice.ifNot]),
      ...locations.flatMap((place) => place.exits.map((exit) => exit.if)),
      ...events.flatMap((event) => [event.if, event.ifNot]),
      ...journalConditions.flatMap((condition) => [
        condition.if,
        condition.ifNot,
        ...(condition.ifAny ?? []),
      ]),
      ...npcs.flatMap((npc) => [npc.known.if, npc.known.ifNot, ...(npc.known.ifAny ?? [])]),
      ...locations.flatMap((place) =>
        Object.values(place.spots ?? {}).flatMap((spot) => [spot.if, spot.ifNot]),
      ),
    ].filter((f): f is FlagId => f !== undefined);
    expect(required.filter((flag) => !setFlags.has(flag))).toEqual([]);
  });

  it('темы разговоров стоят в разговоре своего персонажа: «vasya.tips» — в разговоре с Васей', () => {
    const talkOf = new Map<string, string>(
      Object.entries(NPCS).map(([id, npc]) => [npc.talk.next, id]),
    );
    const misplaced = choices
      .filter(({ choice }) => choice.topic !== undefined)
      .filter(({ where, choice }) => !choice.topic?.startsWith(talkOf.get(where) + '.'))
      .map(({ where, choice }) => where + ': ' + choice.topic);
    expect(misplaced).toEqual([]);
  });

  it('выходы из локаций ведут в существующие места и взаимны', () => {
    const oneWay = Object.entries(LOCATIONS).flatMap(([id, place]) =>
      place.exits
        .filter((exit) => !LOCATIONS[exit.to].exits.some((back) => back.to === id))
        .map((exit) => id + ' → ' + exit.to),
    );
    expect(oneWay).toEqual([]);
  });
});
