import { describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { CHRONICLE_LIMIT, chronicleLine } from '@/ui/chronicle';
import { createGameStore, type GameStore } from '@/ui/store';
import { memoryStorage, ru } from './helpers';

function newStore() {
  const store = createGameStore(memoryStorage(), () => 0.5);
  store.openHeroCreation();
  store.startNewGame({ name: 'Ивар', classId: 'warrior', portrait: 'img/hero-1.jpg' });
  return store;
}

/** Летопись так, как её видит игрок на языке lang. */
function read(store: GameStore, lang: 'ru' | 'en' = 'ru') {
  return store.getChronicle().map((entry) => chronicleLine(entry, lang === 'ru' ? ru : i18n(lang)));
}

describe('летопись', () => {
  it('записывает сцену, её текст и выбор', () => {
    const store = newStore();
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    expect(read(store)).toEqual([
      {
        time: 'День 1 · 16:00 · день',
        title: 'Вот и всё...',
        text: 'Ваша жизнь скоро закончится. И начнется новая...',
        choice: 'Подойти к воротам',
        notices: ['Журнал: новая цель «Новая жизнь»'],
      },
    ]);
  });

  it('не записывает невозможный выбор и начинается заново с новой партией', () => {
    const store = newStore();
    store.choose({ text: 'закрыто', next: 'st1', disabled: 'нельзя' });
    expect(store.getChronicle()).toEqual([]);
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    store.startNewGame({ name: 'Ивар', classId: 'rogue', portrait: 'img/hero-1.jpg' });
    expect(store.getChronicle()).toEqual([]);
  });

  it(`хранит не больше ${CHRONICLE_LIMIT} записей`, () => {
    const store = newStore();
    for (let i = 0; i < CHRONICLE_LIMIT + 5; i++) store.choose({ text: 'Ждать...', next: 'st1' });
    expect(store.getChronicle()).toHaveLength(CHRONICLE_LIMIT);
  });

  it('записывает итог боя', () => {
    const store = newStore();
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    store.choose({ text: 'Ждать...', next: 'st2' });
    store.choose({ text: 'Драться', fight: { name: 'Тень', portrait: '', hp: 1 }, next: 'st3' });
    store.fightAction('attack');
    store.closeFight();
    expect(read(store).at(-1)).toMatchObject({ title: 'Бой: Тень', choice: 'Победа' });
  });

  it('переводится вместе с языком игры', () => {
    const store = newStore();
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    expect(read(store, 'en')).toEqual([
      {
        time: 'Day 1 · 16:00 · afternoon',
        title: 'So this is it...',
        text: 'Your life will soon be over. And a new one will begin...',
        choice: 'Walk up to the gate',
        notices: ['Journal: new goal “A new life”'],
      },
    ]);
  });
});
