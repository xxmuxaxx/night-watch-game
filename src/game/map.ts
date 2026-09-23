// Карта крепости: какие места герой знает, какие дороги между ними открыты, кратчайший путь
// и то, что показывает карта (где герой, где кто из знакомых, куда можно дойти и за сколько).
// Дороги — это выходы мест (src/content/locations.ts); место без `map` на карте не рисуется.
import { LOCATIONS, type LocationId } from '@/content/locations';
import { NPCS, type NpcId } from '@/content/npcs';
import { meetsCondition } from './context';
import { inHours, toGameTime } from './time';
import type { Exit, Session, Text } from './types';

const LOCATION_IDS = Object.keys(LOCATIONS) as LocationId[];
const NPC_IDS = Object.keys(NPCS) as NpcId[];

/** Знает ли герой о месте: до этого его нет ни на карте, ни среди выходов. */
export function isKnown(id: LocationId, session: Session): boolean {
  const known = LOCATIONS[id].known;
  return !known || meetsCondition(known, session);
}

/** Открыт ли выход: место известно, и решение, которое его открывает, принято. */
export function isOpen(exit: Exit, session: Session): boolean {
  return isKnown(exit.to, session) && (!exit.if || session.flags[exit.if] === true);
}

/** Кто из знакомых герою персонажей сейчас в месте (по расписанию). */
export function peopleAt(id: LocationId, session: Session): NpcId[] {
  const time = toGameTime(session.time);
  return NPC_IDS.filter(
    (npc) =>
      meetsCondition(NPCS[npc].known, session) &&
      NPCS[npc].schedule.some((shift) => shift.location === id && inHours(time, shift.hours)),
  );
}

export interface Route {
  /** Места по дороге, без начального; последнее — цель. */
  path: LocationId[];
  minutes: number;
}

/** Самый быстрый путь по открытым дорогам; null — не дойти (или герой уже там). */
export function route(session: Session, to: LocationId): Route | null {
  const from = session.locationId;
  if (from === to) return null;
  // Дейкстра на маленьком графе: мест единицы, так что без очереди с приоритетом
  const best = new Map<LocationId, Route>([[from, { path: [], minutes: 0 }]]);
  const done = new Set<LocationId>();
  for (;;) {
    let current: LocationId | null = null;
    for (const [id, found] of best) {
      if (
        !done.has(id) &&
        (current === null || found.minutes < (best.get(current)?.minutes ?? 0))
      ) {
        current = id;
      }
    }
    if (current === null) return null;
    if (current === to) return best.get(to) ?? null;
    done.add(current);
    const here = best.get(current);
    if (!here) return null;
    for (const exit of LOCATIONS[current].exits) {
      if (!isOpen(exit, session)) continue;
      const minutes = here.minutes + exit.minutes;
      const known = best.get(exit.to);
      if (!known || minutes < known.minutes) {
        best.set(exit.to, { path: [...here.path, exit.to], minutes });
      }
    }
  }
}

export interface MapPlace {
  id: LocationId;
  x: number;
  y: number;
  here: boolean;
  /** Герой здесь уже бывал; нет — место помечено новым. */
  visited: boolean;
  /** Сколько идти отсюда; null — не дойти (закрыто) или герой уже здесь. */
  minutes: number | null;
  /** Почему не дойти: подсказка закрытого выхода, ведущего сюда. */
  locked: Text | null;
  people: NpcId[];
}

export interface MapRoad {
  from: LocationId;
  to: LocationId;
  open: boolean;
}

export interface FortressMap {
  places: MapPlace[];
  roads: MapRoad[];
}

/** Что показывает карта крепости сейчас. */
export function fortressMap(session: Session): FortressMap {
  const shown = LOCATION_IDS.filter((id) => LOCATIONS[id].map && isKnown(id, session));
  const places = shown.map((id): MapPlace => {
    const position = LOCATIONS[id].map ?? { x: 0, y: 0 };
    const way = route(session, id);
    const lockedExit = shown
      .flatMap((from) => LOCATIONS[from].exits)
      .find((exit) => exit.to === id && !isOpen(exit, session) && exit.locked);
    return {
      id,
      x: position.x,
      y: position.y,
      here: id === session.locationId,
      visited: session.visited.includes(id),
      minutes: way?.minutes ?? null,
      locked: way || id === session.locationId ? null : (lockedExit?.locked ?? null),
      people: peopleAt(id, session),
    };
  });
  // дорога рисуется один раз на пару мест; открыта, только если открыта в обе стороны:
  // из кельи во двор выйти можно всегда, но пока туда не пускают, дорога показана закрытой
  const roads: MapRoad[] = [];
  for (const from of shown) {
    for (const exit of LOCATIONS[from].exits) {
      if (!shown.includes(exit.to)) continue;
      const open = isOpen(exit, session);
      const same = roads.find((road) => road.from === exit.to && road.to === from);
      if (same) same.open &&= open;
      else roads.push({ from, to: exit.to, open });
    }
  }
  return { places, roads };
}
