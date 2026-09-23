// Журнал целей и зацепок. Он не хранится, а строится по решениям и событиям партии;
// сообщения «новая цель», «цель выполнена» получаются сравнением журнала до и после выбора.
import { JOURNAL, type JournalId } from '@/content/journal';
import { meetsCondition, resolveText, textContext } from './context';
import type { JournalEntry, Notice, Session, Translate } from './types';

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

/** Все открытые записи в порядке журнала; tr переводит тексты на язык игрока. */
export function journal(session: Session, tr: Translate = (text) => text): JournalView[] {
  const ctx = textContext(session);
  return JOURNAL_IDS.flatMap((id): JournalView[] => {
    const entry: JournalEntry = JOURNAL[id];
    if (!meetsCondition(entry, session)) return [];
    const done = entry.done !== undefined && meetsCondition(entry.done, session);
    return [
      {
        id,
        kind: entry.kind,
        title: resolveText(tr(entry.title), ctx),
        notes: entry.notes
          .filter((note) => meetsCondition(note, session))
          .map((note) => resolveText(tr(note.text), ctx)),
        done,
        // пустая строка — подсказки сейчас нет
        hint: (entry.hint && !done && resolveText(tr(entry.hint), ctx)) || null,
      },
    ];
  });
}

/** Невыполненные цели — для краткой строки «Цель: …». */
export function activeGoals(session: Session, tr?: Translate): JournalView[] {
  return journal(session, tr).filter((entry) => entry.kind === 'goal' && !entry.done);
}

/** Что изменилось в журнале: новые записи, дополнения и выполненные цели. */
export function journalNotices(before: Session | null, after: Session): Notice[] {
  const old = new Map(before ? journal(before).map((entry) => [entry.id, entry]) : []);
  return journal(after).flatMap((entry): Notice[] => {
    const prev = old.get(entry.id);
    const notice = (tone: Notice['tone'], change: 'goal' | 'lead' | 'note' | 'done'): Notice[] => [
      { tone, message: { id: 'journal', entry: entry.id, change } },
    ];
    if (!prev) return notice('info', entry.kind);
    if (entry.done && !prev.done) return notice('success', 'done');
    if (entry.notes.length > prev.notes.length) return notice('info', 'note');
    return [];
  });
}
