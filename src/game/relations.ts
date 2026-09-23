// Отношения персонажей к герою: числа от RELATION_MIN до RELATION_MAX, меняются выборами и сценами.
import { NPCS, type NpcId } from '@/content/npcs';
import { ATTITUDES, RELATION_MAX, RELATION_MIN } from '@/content/relations';
import { meetsCondition, resolveText, textContext } from './context';
import type { Notice, Relations, Session } from './types';

const NPC_IDS = Object.keys(NPCS) as NpcId[];

export function relationOf(relations: Relations, id: NpcId): number {
  return relations[id] ?? 0;
}

/** Название уровня отношения, например «симпатизирует». */
export function attitude(value: number): string {
  // последний уровень начинается с RELATION_MIN, так что уровень найдётся всегда
  return ATTITUDES.find((level) => value >= level.from)?.name ?? '';
}

/** Изменить отношения (в пределах) и сообщить, кто стал относиться лучше или хуже. */
export function changeRelations(
  relations: Relations,
  change: Relations | undefined,
): { relations: Relations; notices: Notice[] } {
  if (!change) return { relations, notices: [] };
  const next: Relations = { ...relations };
  const notices: Notice[] = [];
  for (const id of NPC_IDS) {
    const delta = change[id];
    if (!delta) continue;
    const before = relationOf(relations, id);
    const after = Math.min(RELATION_MAX, Math.max(RELATION_MIN, before + delta));
    next[id] = after;
    if (after === before) continue;
    const better = after > before;
    notices.push({
      tone: better ? 'success' : 'fail',
      text: NPCS[id].name + ': отношение ' + (better ? 'улучшилось' : 'ухудшилось'),
    });
  }
  return { relations: next, notices };
}

/** Персонаж в разделе «Люди» журнала. */
export interface PersonView {
  id: NpcId;
  name: string;
  portrait: string;
  value: number;
  attitude: string;
  about: string;
}

/** Знакомые герою персонажи. */
export function people(session: Session): PersonView[] {
  const ctx = textContext(session);
  return NPC_IDS.filter((id) => meetsCondition(NPCS[id].known, session)).map((id) => {
    const npc = NPCS[id];
    const value = relationOf(session.relations, id);
    return {
      id,
      name: npc.name,
      portrait: npc.portrait,
      value,
      attitude: attitude(value),
      about: resolveText(npc.about, ctx),
    };
  });
}
