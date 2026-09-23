// Летопись: что игрок прочитал и выбрал в этом сеансе, чтобы можно было вернуться и перечитать.
// Не хранится в сохранении — живёт в хранилище интерфейса (store.ts) до перезагрузки страницы.
// Записи хранят тексты и сообщения невычисленными, поэтому при смене языка летопись переводится.
import { location } from '@/content/locations';
import { getScene, textContext } from '@/game/engine';
import type { Choice, Label, Message, Session, Text, TextContext } from '@/game/types';
import type { I18n } from '@/i18n';

/** Сколько записей хранить: старые вытесняются. */
export const CHRONICLE_LIMIT = 50;

export type ChronicleEntry =
  | {
      kind: 'choice';
      /** Время в игре, минуты. */
      time: number;
      /** Контекст текстов на момент выбора. */
      ctx: TextContext;
      title: string;
      /** Текст сцены; у свободного перемещения — null, чтобы не повторять описание места. */
      text: Text | null;
      /** Что игрок выбрал. */
      choice: Label;
      /** Сообщения, которые были над текстом (итоги проверок, добыча, опыт). */
      notices: Message[];
    }
  | {
      kind: 'fight';
      time: number;
      enemy: string;
      log: Message[];
      /** retry — поражение, после которого игрок пробует снова. */
      result: 'win' | 'lose' | 'retry';
    };

/** Запись летописи на языке игрока. */
export interface ChronicleLine {
  /** Например «День 1 · 18:30 · вечер». */
  time: string;
  title: string;
  text: string | null;
  choice: string;
  notices: string[];
}

/** Запись о выборе: что было на экране перед ним и что выбрано. */
export function chronicleEntry(session: Session, choice: Choice): ChronicleEntry {
  const scene = session.sceneId === null ? null : getScene(session.sceneId);
  return {
    kind: 'choice',
    time: session.time,
    ctx: textContext(session),
    title: scene ? scene.title : location(session.locationId).name,
    text: scene ? scene.text : null,
    choice: choice.text,
    notices: session.notices.map((notice) => notice.message),
  };
}

/** Запись об итоге боя; retried — игрок проиграл и пробует снова. */
export function fightEntry(session: Session, retried = false): ChronicleEntry | null {
  const fight = session.fight;
  if (!fight?.result) return null;
  return {
    kind: 'fight',
    time: session.time,
    enemy: fight.enemy.name,
    log: fight.log,
    result: retried ? 'retry' : fight.result,
  };
}

export function appendEntry(chronicle: ChronicleEntry[], entry: ChronicleEntry): ChronicleEntry[] {
  return [...chronicle, entry].slice(-CHRONICLE_LIMIT);
}

/** Запись на языке игрока. */
export function chronicleLine(
  entry: ChronicleEntry,
  { t, name, text, label, msg, time }: I18n,
): ChronicleLine {
  if (entry.kind === 'fight') {
    return {
      time: time(entry.time),
      title: t.chronicle.fight(name(entry.enemy)),
      text: entry.log.map(msg).join('\n'),
      choice: t.chronicle[entry.result],
      notices: [],
    };
  }
  return {
    time: time(entry.time),
    title: name(entry.title),
    text: entry.text === null ? null : text(entry.text, entry.ctx),
    choice: label(entry.choice, entry.ctx),
    notices: entry.notices.map(msg),
  };
}
