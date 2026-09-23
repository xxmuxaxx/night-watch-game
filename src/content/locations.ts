// Локации крепости. Выходы с `if` открываются по решениям (мягкое открытие мест);
// пока решение не принято, выход виден закрытым с подсказкой `locked`.
// У места есть точки интереса (spots): к ним подходят, и там свои действия. Место с `map` видно
// на карте крепости (src/game/map.ts); место с `known` появляется, только когда герой о нём узнал.
import type { Choice, Location } from '@/game/types';
import { ROUTINE } from './chapters/routine';

/** Все места. Список задан явно: выходы ссылаются на места, и вывести тип из LOCATIONS нельзя. */
export type LocationId =
  'gate' | 'courtyard' | 'gateyard' | 'hall' | 'barracks' | 'smithy' | 'cell' | 'wall';

// Сундук в келье: одна попытка силой; если не вышло — можно поддеть зубилом кузнеца.
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

/**
 * Стена закрыта (`closed`): туда пробираются мимо часового, пока он дремлет — только ночью,
 * раз за ночь и пока не поймали.
 */
export const WALL_SNEAK: Choice = {
  text: 'Проскользнуть наверх, пока часовой дремлет',
  hours: [21, 6],
  ifNot: 'caughtOnWall',
  daily: 'wall',
  minutes: 5,
  check: { stat: 'agility', difficulty: 2 },
  next: 'wall_sneak',
  fail: 'wall_caught',
};

export const LOCATIONS: Record<LocationId, Location> = {
  // Пролог: перед воротами крепости. Свободно сюда не попасть, выходов нет, на карте его нет.
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
      { to: 'gateyard', minutes: 3 },
      { to: 'barracks', minutes: 3 },
      { to: 'smithy', minutes: 4 },
      {
        to: 'cell',
        minutes: 10,
        if: 'knowsCell',
        locked: 'Торвин обещал показать, где спать, после ужина',
      },
      { to: 'wall', minutes: 5, closed: true, locked: 'Наверх пускают только дозорных' },
    ],
    spots: {
      drill: {
        name: 'Плац',
        image: 'img/scene-drill.jpg',
        text: ({ time }) =>
          'Утоптанная площадка у казармы. На стойке — щиты и деревянные мечи, иссечённые до щепы.' +
          (time.hour >= 8 && time.hour < 17
            ? ' Новобранцы бьются парами, старшие покрикивают.'
            : ' Сейчас здесь пусто, только ветер гоняет снег.'),
        actions: [
          ROUTINE.training,
          ROUTINE.sparRecruit,
          ROUTINE.sparVasya,
          ROUTINE.sparTorvinFirst,
          ROUTINE.sparTorvin,
          {
            text: 'Вычистить щиты и учебные мечи (1 ч, наряд)',
            duty: 'weapons',
            hours: [6, 21],
            showClosed: true,
            minutes: 60,
            xp: 5,
            relation: { torvin: 1 },
            next: 'duty_weapons_done',
          },
        ],
      },
      stairs: {
        name: 'Лестница на стену',
        text: ({ time }) =>
          'Крутая каменная лестница ведёт на стену. ' +
          (time.hour >= 21 || time.hour < 6
            ? 'Часовой внизу клюёт носом, привалившись к стене и обняв копьё.'
            : 'Внизу переминается с ноги на ногу часовой и косится на вас.'),
        actions: [
          {
            text: 'Подняться на стену',
            hours: [6, 21],
            disabled: 'Наверх пускают только дозорных',
          },
          WALL_SNEAK,
          {
            text: 'Угостить часового настойкой',
            pay: 'flask',
            hours: [21, 6],
            ifNot: 'caughtOnWall',
            daily: 'wall',
            minutes: 10,
            next: 'wall_bribe',
          },
        ],
      },
    },
    map: { x: 50, y: 40 },
  },
  gateyard: {
    name: 'Двор у ворот',
    image: 'img/scene-gateyard.jpg',
    text: ({ time }) =>
      time.hour >= 6 && time.hour < 21
        ? 'Тесный двор между воротами и казармой. Под сводом ворот скучают стражники, у коновязи фыркают лошади.'
        : 'Ворота заперты на тяжёлый засов. Под сводом чадит факел, в караулке стучат кости и кто-то вполголоса ругается.',
    exits: [{ to: 'courtyard', minutes: 3 }],
    spots: {
      guardhouse: {
        name: 'Караулка',
        image: 'img/scene-guardhouse.jpg',
        text: 'Низкая дверь рядом со сводом ворот. На лавке у ворота сидит Стенли — тот, кто открывал вам ворота.',
        actions: [
          {
            text: 'Спросить Стенли, открывают ли ворота ночью',
            ifNot: 'talkedStanley',
            set: { talkedStanley: true },
            minutes: 10,
            next: 'gate_stanley',
          },
          {
            text: 'Попросить у Стенли факел',
            if: 'talkedStanley',
            ifNot: 'gotTorch',
            set: { gotTorch: true },
            give: { items: ['torch'] },
            minutes: 5,
            next: 'gate_torch',
          },
          {
            text: 'Отстоять смену у ворот со Стенли (2 ч, наряд)',
            duty: 'gate',
            hours: [8, 20],
            showClosed: true,
            minutes: 120,
            xp: 8,
            give: { items: ['flask'] },
            next: 'duty_gate_done',
          },
        ],
      },
      board: {
        name: 'Доска нарядов',
        image: 'img/scene-duty-board.jpg',
        text: 'Потемневшая доска под навесом. К ней прибиты листы: кто когда в карауле, кто в дозоре на перевале.',
        actions: [
          {
            text: 'Прочитать наряды',
            ifNot: 'readBoard',
            set: { readBoard: true },
            minutes: 5,
            next: 'gate_board',
          },
          {
            text: 'Узнать свой наряд на сегодня',
            takeDuty: true,
            hours: [6, 12],
            showClosed: true,
            daily: 'duty',
            minutes: 5,
          },
        ],
      },
      brazier: {
        name: 'Жаровня у ворот',
        image: 'img/scene-brazier.jpg',
        text: 'Железная жаровня под навесом у ворот. Вечерами возле неё греются часовые.',
        actions: [ROUTINE.brazier],
      },
    },
    map: { x: 50, y: 64 },
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
    spots: {
      kitchen: {
        name: 'Кухня',
        image: 'img/scene-kitchen.jpg',
        text: 'За перегородкой — котлы, мешки с репой и красный от жара повар.',
        actions: [
          ROUTINE.kitchen,
          {
            text: 'Наколоть дров для кухни (1 ч, наряд)',
            duty: 'firewood',
            hours: [6, 21],
            showClosed: true,
            minutes: 60,
            xp: 5,
            give: { items: ['bread'] },
            next: 'duty_firewood_done',
          },
        ],
      },
      hearth: {
        name: 'Очаг',
        text: 'Большой очаг в дальнем конце зала. Под решёткой — толстый слой золы.',
        actions: [
          ROUTINE.ash,
          {
            text: 'Поискать в золе ключ от кладовой',
            if: 'cookAskedKey',
            ifNot: 'foundKey',
            minutes: 10,
            check: { stat: 'wits', difficulty: 1, set: { foundKey: true } },
            next: 'hearth_key',
            fail: 'hearth_nothing',
          },
        ],
      },
    },
    map: { x: 20, y: 28 },
  },
  barracks: {
    name: 'Казарма',
    image: 'img/scene-barracks.jpg',
    text: ({ time }) =>
      (time.hour >= 21 || time.hour < 6
        ? 'Длинный тёмный барак. Храп, запах мокрой шерсти и дыма, кто-то бормочет во сне.'
        : 'Длинный барак с двумя рядами нар. Днём здесь пусто: все на плацу или на работах.') +
      ' Новенького сюда не определили: Торвин поселил вас отдельно, в келье.',
    exits: [{ to: 'courtyard', minutes: 3 }],
    spots: {
      vasyaBunk: {
        name: 'Нары Васи',
        text: ({ relation }) =>
          'Нары у самой печки — лучшее место, и Вася явно им гордится. Под изголовьем свёрнута куртка, сверху лежит деревянная ложка.' +
          (relation('vasya') >= 1 ? ' Вася говорил: если что, заходи.' : ''),
        actions: [
          {
            text: 'Вымести казарму и вытряхнуть тюфяки (1 ч, наряд)',
            duty: 'barracks',
            hours: [6, 21],
            showClosed: true,
            minutes: 60,
            xp: 5,
            set: { gotRope: true },
            give: { items: ['rope'] },
            next: 'duty_barracks_done',
          },
        ],
      },
      emptyBunks: {
        name: 'Пустые нары',
        text: ({ flag }) =>
          'В дальнем углу двое нар стоят голые: ни соломы, ни одеял. ' +
          (flag('vasyaFriend') || flag('readBoard')
            ? 'Похоже, здесь спали те двое, что не вернулись с перевала.'
            : 'Будто хозяева съехали в спешке — или их вещи кто-то забрал.'),
        actions: [
          {
            text: 'Обыскать нары',
            ifNot: 'searchedBunks',
            set: { searchedBunks: true },
            minutes: 15,
            // в дальнем углу темно: с факелом искать легче
            check: { stat: 'wits', difficulty: 2, dark: true, set: { foundNote: true } },
            next: 'barracks_note',
            fail: 'barracks_nothing',
          },
        ],
      },
      dice: {
        name: 'Игра в кости',
        image: 'img/scene-dice.jpg',
        hours: [21, 23],
        text: 'На перевёрнутом ящике между нарами мечут кости. Банкует Хромой Йорген, и кучка хлебных краюх у его локтя всё растёт.',
        actions: [
          {
            text: 'Сыграть на краюху хлеба',
            pay: 'bread',
            daily: 'dice',
            minutes: 20,
            check: { stat: 'wits', difficulty: 1, give: { items: ['bread', 'bread'] }, xp: 2 },
            next: 'dice_win',
            fail: 'dice_lose',
          },
        ],
      },
    },
    map: { x: 22, y: 54 },
  },
  smithy: {
    name: 'Кузница',
    image: 'img/scene-smithy.jpg',
    text: ({ time }) =>
      time.hour >= 7 && time.hour < 22
        ? 'Жар от горна бьёт в лицо ещё с порога. Звенит молот, шипит вода в бадье.'
        : 'Горн прогорел до багровых углей. Кузнеца нет, только остывающий металл тихо потрескивает.',
    exits: [{ to: 'courtyard', minutes: 4 }],
    spots: {
      bench: {
        name: 'Верстак',
        image: 'img/scene-lantern.jpg',
        text: 'Клещи, зубила, напильники, обрезки железа. С краю лежит недоделанный фонарь.',
        actions: [
          {
            text: 'Рассмотреть фонарь',
            ifNot: 'sawLantern',
            set: { sawLantern: true },
            minutes: 5,
            next: 'smithy_lantern',
          },
          {
            text: 'Перетаскать уголь для Хальвара (1,5 ч, наряд)',
            duty: 'smithy',
            hours: [7, 22],
            showClosed: true,
            minutes: 90,
            xp: 5,
            set: { metSmith: true },
            relation: { smith: 1 },
            next: 'duty_smithy_done',
          },
        ],
      },
      yard: {
        name: 'Задворки кузницы',
        if: 'gotRope',
        text: 'Узкий проход между кузницей и стеной, заваленный углём и ржавым ломом. Стена здесь ниже, чем у ворот, и часовых не видно.',
        actions: [
          {
            text: 'Забросить крюк на стену и влезть',
            needs: 'rope',
            hours: [21, 6],
            showClosed: true,
            ifNot: 'caughtOnWall',
            daily: 'wall',
            minutes: 15,
            next: 'wall_rope',
          },
        ],
      },
    },
    map: { x: 80, y: 54 },
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
    spots: {
      window: {
        name: 'Окно',
        text: 'Узкое окно, затянутое мутной слюдой. За ним — стена и лес до самого перевала.',
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
        ],
      },
      chest: {
        name: 'Сундук',
        text: ({ flag }) =>
          flag('foundKnife')
            ? 'Сундук открыт. Кроме истлевшего тряпья, в нём ничего не осталось.'
            : flag('triedChest')
              ? 'Ржавый замок держит намертво. Без инструмента его не поддеть.'
              : 'Старый сундук, окованный железом. Замок покрыт рыжей ржавчиной.',
        actions: [
          OPEN_CHEST,
          {
            text: 'Поддеть замок зубилом',
            if: 'gotChisel',
            ifNot: 'foundKnife',
            minutes: 10,
            set: { foundKnife: true },
            give: { weapon: 'knife' },
            next: 'st7_2',
          },
        ],
      },
    },
    map: { x: 80, y: 22 },
  },
  wall: {
    name: 'Стена',
    image: 'img/scene-wall.jpg',
    text: ({ time }) =>
      time.hour >= 21 || time.hour < 6
        ? 'Ветер на стене сбивает с ног. Внизу спит крепость, впереди — чёрный лес до самого перевала. Часовой на дальней башне смотрит в другую сторону.'
        : 'Серый день, ветер и снег. Отсюда видно всю долину до перевала — и вас отсюда видно всем.',
    exits: [{ to: 'courtyard', minutes: 5 }],
    spots: {
      lookout: {
        name: 'Дозорная площадка',
        text: 'Выступ стены с зубцами. Отсюда лес видно куда дальше, чем из окна кельи, — до самого перевала. Левее темнеет угловая башня.',
        actions: [
          {
            text: 'Смотреть на перевал',
            hours: [21, 6],
            ifNot: 'sawSignal',
            set: { sawSignal: true },
            minutes: 30,
            next: 'wall_signal',
          },
          {
            text: 'Смотреть на перевал',
            hours: [21, 6],
            if: 'sawSignal',
            minutes: 30,
            next: 'wall_dark',
          },
          { text: 'Смотреть на перевал', hours: [6, 21], next: 'wall_day' },
        ],
      },
      horn: {
        name: 'Сторожевой рог',
        text: 'Огромный рог на железной подставке, окованный медью. Три сигнала — общий сбор: так объясняли на плацу.',
        actions: [],
      },
    },
    map: { x: 50, y: 8 },
  },
};

export function location(id: LocationId): Location {
  return LOCATIONS[id];
}
