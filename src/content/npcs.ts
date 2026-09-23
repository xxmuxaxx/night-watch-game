// Персонажи с расписанием: когда персонаж в локации, там появляется вариант разговора.
// Отношение персонажа к герою меняют выборы и сцены (relation), в журнале оно видно в разделе «Люди».
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
    known: { if: 'joined' },
    about: ({ flag }) =>
      'Старший над новобранцами. Улыбается добродушно, но за воротами следит строго.' +
      (flag('beatTorvin') ? ' На плацу мне удалось его одолеть — кажется, он был доволен.' : ''),
  },
  vasya: {
    name: 'Вася',
    portrait: 'img/portrait-vasya.jpg',
    schedule: [
      { location: 'courtyard', hours: [8, 17] },
      { location: 'hall', hours: [18, 21] },
      { location: 'barracks', hours: [21, 23] },
    ],
    talk: { text: 'Поговорить с Васей', next: 'vasya_talk' },
    known: { if: 'joined' },
    about: ({ flag }) =>
      'Задира-новобранец, третью неделю в крепости. ' +
      (flag('talkedDownVasya')
        ? 'Встретил меня у ворот с кулаками, но я его отговорил.'
        : 'Встретил меня у ворот кулаками.') +
      (flag('vasyaFriend') ? ' За ужином мы помирились.' : ''),
  },
  smith: {
    name: 'Хальвар',
    portrait: 'img/portrait-smith.jpg',
    schedule: [{ location: 'smithy', hours: [7, 22] }],
    talk: { text: 'Поговорить с кузнецом', next: 'smith_talk' },
    known: { if: 'metSmith' },
    about:
      'Кузнец. Руки в старых ожогах, борода опалена. Говорит мало, но замечает всё — и, кажется, знает больше, чем говорит.',
  },
  cook: {
    name: 'Ульф',
    portrait: 'img/portrait-cook.jpg',
    schedule: [{ location: 'hall', hours: [6, 21] }],
    talk: { text: 'Поговорить с поваром', next: 'cook_talk' },
    known: { if: 'metCook' },
    about: ({ flag }) =>
      'Повар. Красный от жара и вечно злой, но хлебом не обидит.' +
      (flag('returnedKey')
        ? ' Я нашёл ему ключ от кладовой — теперь он со мной почти ласков.'
        : ''),
  },
  mirko: {
    name: 'Мирко',
    portrait: 'img/portrait-recruit.jpg',
    schedule: [
      { location: 'courtyard', hours: [8, 17] },
      { location: 'hall', hours: [18, 21] },
      { location: 'barracks', hours: [21, 23] },
    ],
    // до знакомства имени не знаешь
    talk: {
      text: ({ flag }) =>
        flag('metMirko') ? 'Поговорить с Мирко' : 'Поговорить с долговязым новобранцем',
      next: 'mirko_talk',
    },
    known: { if: 'metMirko' },
    about:
      'Долговязый веснушчатый новобранец с хутора в долине. Отдан в стражу за отцовский долг и, кажется, этому даже рад: здесь кормят.',
  },
} as const satisfies Record<string, Npc>;

export type NpcId = keyof typeof NPCS;
