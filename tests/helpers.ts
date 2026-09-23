import { createHero } from '@/game/hero';
import type { ClassId, GameState, Hero, Message, Notice, Rng, Session } from '@/game/types';
import { i18n } from '@/i18n';

/** Русский перевод: тесты сверяют тексты так, как их видит игрок. */
export const ru = i18n('ru');

/** Сообщения по-русски. */
export function lines(messages: readonly Message[]): string[] {
  return messages.map(ru.msg);
}

/** Тексты сообщений над сценой по-русски. */
export function noticeTexts(notices: readonly Notice[]): string[] {
  return notices.map((notice) => ru.msg(notice.message));
}

/** Генератор, выдающий заданные числа по очереди; если они кончились — тест упадёт. */
export function sequence(...values: number[]): Rng {
  const queue = [...values];
  return () => {
    const next = queue.shift();
    if (next === undefined) throw new Error('В sequence() кончились случайные числа');
    return next;
  };
}

/** Всегда одно и то же число. */
export function constant(value: number): Rng {
  return () => value;
}

export function testHero(classId: ClassId = 'warrior', overrides: Partial<Hero> = {}): Hero {
  return { ...createHero({ name: 'Ивар', classId, portrait: 'img/hero-1.jpg' }), ...overrides };
}

/** Хранилище в памяти вместо localStorage. */
export function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

/** Текущая партия; падает, если её нет. */
export function sessionOf(state: GameState): Session {
  if (!state.session) throw new Error('Нет партии');
  return state.session;
}

/** Состояние с изменённой партией — чтобы перенести героя в нужную сцену или с нужным здоровьем. */
export function withSession(state: GameState, patch: Partial<Session>): GameState {
  return { ...state, session: { ...sessionOf(state), ...patch } };
}
