// Журнал целей и зацепок. Он не хранится, а строится по решениям и событиям партии;
// сообщения «новая цель», «цель выполнена» получаются сравнением журнала до и после выбора.
import { JOURNAL, type JournalId } from '@/content/journal';
import { resolveText, textContext } from './context';
import type { Condition, JournalEntry, Notice, Session } from './types';

const JOURNAL_IDS = Object.keys(JOURNAL) as JournalId[];

/** Запись журнала в том виде, в каком её видит игрок. */
export interface JournalView {
  id: JournalId;
  kind: JournalEntry['kind'];
  title: string;
  notes: string[];
  done: boolean;
  /** Подсказка; только у невыполненных целей. */
  hint: string | null;
}

export function meets(condition: Condition, session: Session): boolean {
  return (
    (!condition.if || session.flags[condition.if] === true) &&
    (!condition.ifNot || session.flags[condition.ifNot] !== true) &&
    (!condition.event || session.events.includes(condition.event))
  );
}

/** Все открытые записи в порядке журнала. */
export function journal(session: Session): JournalView[] {
  const ctx = textContext(session);
  return JOURNAL_IDS.flatMap((id): JournalView[] => {
    const entry: JournalEntry = JOURNAL[id];
    if (!meets(entry, session)) return [];
    const done = entry.done !== undefined && meets(entry.done, session);
    return [
      {
        id,
        kind: entry.kind,
        title: entry.title,
        notes: entry.notes
          .filter((note) => meets(note, session))
          .map((note) => resolveText(note.text, ctx)),
        done,
        hint: entry.hint && !done ? resolveText(entry.hint, ctx) : null,
      },
    ];
  });
}

/** Невыполненные цели — для краткой строки «Цель: …». */
export function activeGoals(session: Session): JournalView[] {
  return journal(session).filter((entry) => entry.kind === 'goal' && !entry.done);
}

/** Что изменилось в журнале: новые записи, дополнения и выполненные цели. */
export function journalNotices(before: Session | null, after: Session): Notice[] {
  const old = new Map(before ? journal(before).map((entry) => [entry.id, entry]) : []);
  return journal(after).flatMap((entry): Notice[] => {
    const prev = old.get(entry.id);
    const title = '«' + entry.title + '»';
    if (!prev) {
      const what = entry.kind === 'goal' ? 'новая цель ' : 'новая зацепка ';
      return [{ tone: 'info', text: 'Журнал: ' + what + title }];
    }
    if (entry.done && !prev.done) return [{ tone: 'success', text: 'Цель выполнена: ' + title }];
    if (entry.notes.length > prev.notes.length) {
      return [{ tone: 'info', text: 'Журнал: новая запись в ' + title }];
    }
    return [];
  });
}
