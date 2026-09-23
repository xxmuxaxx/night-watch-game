// Сюжетные события: сцена начинается сама, когда герой в нужном месте в нужное время.
// Каждое срабатывает один раз; если подходят несколько, срабатывает первое в списке.
import type { StoryEvent } from '@/game/types';

export const EVENTS = {
  // Глава 1
  dinner: { scene: 'st6', location: 'hall', hours: [18, 21] },
  lateForDinner: { scene: 'torvin_late', hours: [21, 6], ifNot: 'knowsCell' },
  alarm: { scene: 'st8', hours: [1, 6], fromDay: 3 },
  // Мелкие происшествия (src/content/chapters/incidents.ts): случаются не всегда, а с вероятностью
  // chance при каждой проверке — по приходе в место и на каждом шаге ожидания
  brawl: {
    scene: 'incident_brawl',
    location: 'courtyard',
    hours: [8, 17],
    fromDay: 2,
    chance: 0.2,
  },
  cat: { scene: 'incident_cat', location: 'hall', hours: [9, 17], chance: 0.2 },
  sentries: { scene: 'incident_sentries', location: 'gateyard', hours: [18, 23], chance: 0.25 },
  tracks: {
    scene: 'incident_tracks',
    location: 'gateyard',
    hours: [6, 9],
    fromDay: 2,
    chance: 0.3,
  },
  raven: { scene: 'incident_raven', location: 'cell', hours: [6, 10], fromDay: 2, chance: 0.25 },
  sparks: {
    scene: 'incident_sparks',
    location: 'smithy',
    hours: [8, 20],
    if: 'metSmith',
    chance: 0.2,
  },
} as const satisfies Record<string, StoryEvent>;

export type EventId = keyof typeof EVENTS;
