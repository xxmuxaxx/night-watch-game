// Карта сюжета для автора: все сцены, связи между ними и входы в сюжет (пролог, события,
// разговоры, действия в локациях). Показывается в панели отладки; тупики и сцены без входа
// подсвечиваются. Чистые функции — без DOM.
import { EVENTS } from '@/content/events';
import { LOCATIONS } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { SCENES, START_SCENE } from '@/content/story';
import type { Choice, SceneId } from './types';

export type LinkKind = 'next' | 'fail' | 'fight' | 'leave' | 'gameOver';

export interface MapLink {
  /** Куда ведёт: сцена или, для leave, место свободного перемещения. */
  to: string;
  kind: LinkKind;
  /** Текст варианта (функции показываются как «…»). */
  label: string;
}

export interface MapNode {
  id: SceneId;
  title: string;
  /** Шагов от ближайшего входа; null — сцена недостижима. */
  depth: number | null;
  links: MapLink[];
  /** Сколько переходов ведёт сюда. */
  incoming: number;
  /** Откуда можно попасть без перехода из другой сцены: пролог, событие, разговор, действие. */
  entry: string | null;
  /** Нет ни одного варианта, ведущего дальше (кроме конца игры). */
  deadEnd: boolean;
}

function links(choice: Choice): MapLink[] {
  const label = typeof choice.text === 'string' ? choice.text : '…';
  if ('fight' in choice) return [{ to: choice.next, kind: 'fight', label }];
  if ('check' in choice) {
    return [
      { to: choice.next, kind: 'next', label: label + ' (успех)' },
      { to: choice.fail, kind: 'fail', label: label + ' (провал)' },
    ];
  }
  if ('next' in choice) return [{ to: choice.next, kind: 'next', label }];
  if ('leave' in choice) {
    return [{ to: choice.leave === true ? 'место' : choice.leave, kind: 'leave', label }];
  }
  if ('gameOver' in choice) return [{ to: 'конец', kind: 'gameOver', label }];
  return [];
}

/** Входы в сюжет, кроме переходов между сценами. */
function entries(): Map<SceneId, string> {
  const result = new Map<SceneId, string>([[START_SCENE, 'начало игры']]);
  for (const [id, event] of Object.entries(EVENTS)) result.set(event.scene, 'событие ' + id);
  for (const npc of Object.values(NPCS)) result.set(npc.talk.next, 'разговор: ' + npc.name);
  for (const place of Object.values(LOCATIONS)) {
    for (const action of place.actions ?? []) {
      for (const link of links(action)) {
        if (link.to in SCENES) result.set(link.to, 'действие: ' + place.name);
      }
    }
  }
  return result;
}

export function storyMap(): MapNode[] {
  const entryOf = entries();
  const nodes = new Map<SceneId, MapNode>(
    Object.entries(SCENES).map(([id, scene]) => {
      const out = scene.choices.flatMap(links);
      return [
        id,
        {
          id,
          title: scene.title,
          depth: null,
          links: out,
          incoming: 0,
          entry: entryOf.get(id) ?? null,
          deadEnd: out.length === 0,
        },
      ];
    }),
  );
  for (const node of nodes.values()) {
    for (const link of node.links) {
      const target = nodes.get(link.to);
      if (target) target.incoming++;
    }
  }
  // глубина — обход в ширину от всех входов сразу
  const queue: SceneId[] = [];
  for (const id of entryOf.keys()) {
    const node = nodes.get(id);
    if (node) {
      node.depth = 0;
      queue.push(id);
    }
  }
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const node = nodes.get(id);
    if (!node) continue;
    for (const link of node.links) {
      const target = nodes.get(link.to);
      if (target && target.depth === null) {
        target.depth = (node.depth ?? 0) + 1;
        queue.push(link.to);
      }
    }
  }
  return [...nodes.values()];
}
