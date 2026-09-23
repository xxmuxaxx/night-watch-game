// Устройство английского перевода контента. Перевод повторяет русский контент по идентификаторам
// и порядку: тексты сцены, её варианты по порядку, записи журнала по порядку. Проверяет это
// tests/i18n.test.ts; текст без перевода показывается по-русски.
import type { Text } from '@/game/types';

export interface SceneText {
  title: string;
  text: Text;
  /** Тексты вариантов в том же порядке, что в сцене. */
  choices: Text[];
}

/** Действие у точки интереса: текст или текст с причиной, почему оно закрыто. */
export type ActionText = Text | { text: Text; disabled: string };

export interface SpotText {
  name: string;
  text: Text;
  /** Действия в том же порядке, что у точки (занятия распорядка переводятся в routine.ts). */
  actions?: ActionText[];
}

export interface LocationText {
  name: string;
  text: Text;
  /** Подсказки закрытых выходов, по месту назначения. */
  locked?: Partial<Record<string, string>>;
  /** Точки интереса по их ключам. */
  spots?: Record<string, SpotText>;
}

export interface NpcText {
  name: string;
  talk: Text;
  about: Text;
}

export interface JournalText {
  title: string;
  /** Записи в том же порядке, что в журнале. */
  notes: Text[];
  hint?: Text;
}

export interface ClassText {
  title: string;
  description: string;
  special: { name: string; description: string };
}

export interface ItemText {
  name: string;
  description: string;
}
