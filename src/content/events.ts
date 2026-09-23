// Сюжетные события: сцена начинается сама, когда герой в нужном месте в нужное время.
// Каждое срабатывает один раз; если подходят несколько, срабатывает первое в списке.
import type { StoryEvent } from '@/game/types';

export const EVENTS = {
  // Глава 1
  dinner: { scene: 'st6', location: 'hall', hours: [18, 21] },
  lateForDinner: { scene: 'torvin_late', hours: [21, 6], ifNot: 'knowsCell' },
  alarm: { scene: 'st8', hours: [1, 6], fromDay: 2 },
} as const satisfies Record<string, StoryEvent>;

export type EventId = keyof typeof EVENTS;
