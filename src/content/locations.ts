// Локации крепости. Выходы с `if` открываются по решениям (мягкое открытие мест);
// пока решение не принято, выход виден закрытым с подсказкой `locked`.
import type { Choice, Location } from '@/game/types';
import { ROUTINE } from './chapters/routine';

/** Все места. Список задан явно: выходы ссылаются на места, и вывести тип из LOCATIONS нельзя. */
export type LocationId = 'gate' | 'courtyard' | 'hall' | 'cell';

// Сундук в келье: одна попытка.
export const OPEN_CHEST: Choice = {
  text: 'Открыть заржавевший сундук',
  ifNot: 'triedChest',
  set: { triedChest: true },
  check: {
    stat: 'strength',
    difficulty: 1,
    set: { foundKnife: true },
    give: { weapon: 'knife' },
  },
  next: 'st7_2',
  fail: 'st7_3',
};

export const LOCATIONS: Record<LocationId, Location> = {
  // Пролог: перед воротами крепости. Свободно сюда не попасть, выходов нет.
  gate: {
    name: 'Перед воротами',
    image: 'img/scene-outside-gate.jpg',
    text: 'Утоптанный снег перед закрытыми воротами крепости.',
    exits: [],
  },
  courtyard: {
    name: 'Внутренний двор',
    image: 'img/scene-courtyard.jpg',
    text: ({ time }) =>
      ({
        morning:
          'Новобранцы строятся на утреннюю поверку. Старшие в чёрных плащах выкрикивают имена, изо ртов валит пар.',
        day: 'Во дворе стучат деревянные мечи: новобранцы упражняются под окрики старших. Пахнет дымом и конским навозом.',
        evening: 'Тренировки закончились. Из трапезной тянет похлёбкой, у жаровен греются часовые.',
        night: 'Двор пуст. Только часовые ходят по стене, и снег скрипит под их сапогами.',
      })[time.period],
    exits: [
      { to: 'hall', minutes: 5 },
      {
        to: 'cell',
        minutes: 10,
        if: 'knowsCell',
        locked: 'Торвин обещал показать, где спать, после ужина',
      },
    ],
    actions: ROUTINE.courtyard,
  },
  hall: {
    name: 'Трапезная',
    image: 'img/scene-hall.jpg',
    text: ({ time }) =>
      time.hour >= 6 && time.hour < 9
        ? 'Новобранцы наскоро хлебают кашу. Повар ругается, что кто-то опять утащил хлеб.'
        : time.hour >= 18 && time.hour < 21
          ? 'Зал полон: стучат ложки, у очага спорят о чём-то старшие.'
          : 'Длинные столы пусты. На кухне гремит котлами повар, в очаге тлеют угли.',
    exits: [{ to: 'courtyard', minutes: 5 }],
    actions: ROUTINE.hall,
  },
  cell: {
    name: 'Келья',
    image: 'img/scene-cell.jpg',
    text: ({ time, flag }) =>
      'Крошечная комната под самой крышей: соломенный тюфяк, шерстяное одеяло, сундук и узкое окно, выходящее на лес.' +
      // подсказка: огни видны из окна после 21:00 (как у выбора «Выглянуть в окно»)
      (flag('sawLights')
        ? ''
        : time.hour >= 21 || time.hour < 6
          ? '\nДалеко за стеной, между деревьями, будто что-то мерцает.'
          : time.hour >= 18
            ? '\nЗа окном сгущаются сумерки. Скоро лес до самого перевала утонет в темноте.'
            : ''),
    exits: [{ to: 'courtyard', minutes: 10 }],
    bed: true,
    actions: [
      { text: 'Выглянуть в окно', hours: [6, 21], next: 'window_day' },
      {
        text: 'Выглянуть в окно',
        hours: [21, 6],
        ifNot: 'sawLights',
        set: { sawLights: true },
        next: 'st7_1',
      },
      { text: 'Выглянуть в окно', hours: [21, 6], if: 'sawLights', next: 'window_night' },
      OPEN_CHEST,
    ],
  },
};

export function location(id: LocationId): Location {
  return LOCATIONS[id];
}
