// Персонажи с расписанием: когда персонаж в локации, там появляется вариант разговора.
import type { Npc } from '@/game/types';

export const NPCS = {
  torvin: {
    name: 'Торвин',
    portrait: 'img/portrait-mentor.jpg',
    schedule: [
      { location: 'courtyard', hours: [6, 18] },
      { location: 'hall', hours: [18, 22] },
    ],
    talk: { text: 'Поговорить с Торвином', next: 'torvin_talk' },
  },
} as const satisfies Record<string, Npc>;

export type NpcId = keyof typeof NPCS;
