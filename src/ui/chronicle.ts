// Летопись: что игрок прочитал и выбрал в этом сеансе, чтобы можно было вернуться и перечитать.
// Не хранится в сохранении — живёт в хранилище интерфейса (store.ts) до перезагрузки страницы.
import { location } from '@/content/locations';
import { getScene, resolveText, textContext } from '@/game/engine';
import { formatTime } from '@/game/time';
import type { Choice, Session } from '@/game/types';

/** Сколько записей хранить: старые вытесняются. */
export const CHRONICLE_LIMIT = 50;

export interface ChronicleEntry {
  /** Время в игре, например «День 1 · 18:30 · вечер». */
  time: string;
  title: string;
  /** Текст сцены; у свободного перемещения — null, чтобы не повторять описание места. */
  text: string | null;
  /** Что игрок выбрал. */
  choice: string;
  /** Сообщения, которые были над текстом (итоги проверок, добыча, опыт). */
  notices: string[];
}

/** Запись о выборе: что было на экране перед ним и что выбрано. */
export function chronicleEntry(session: Session, choice: Choice): ChronicleEntry {
  const ctx = textContext(session);
  const scene = session.sceneId === null ? null : getScene(session.sceneId);
  return {
    time: formatTime(session.time),
    title: scene ? scene.title : location(session.locationId).name,
    text: scene ? resolveText(scene.text, ctx) : null,
    choice: resolveText(choice.text, ctx),
    notices: session.notices.map((notice) => notice.text),
  };
}

/** Запись об итоге боя. */
export function fightEntry(session: Session): ChronicleEntry | null {
  const fight = session.fight;
  if (!fight?.result) return null;
  return {
    time: formatTime(session.time),
    title: 'Бой: ' + fight.enemy.name,
    text: fight.log.join('\n'),
    choice: fight.result === 'win' ? 'Победа' : 'Поражение',
    notices: [],
  };
}

export function appendEntry(chronicle: ChronicleEntry[], entry: ChronicleEntry): ChronicleEntry[] {
  return [...chronicle, entry].slice(-CHRONICLE_LIMIT);
}
