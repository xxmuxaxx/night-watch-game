import { describe, expect, it } from 'vitest';
import { CHRONICLE_LIMIT } from '@/ui/chronicle';
import { createGameStore } from '@/ui/store';
import { memoryStorage } from './helpers';

function newStore() {
  const store = createGameStore(memoryStorage(), () => 0.5);
  store.openHeroCreation();
  store.startNewGame({ name: 'Ивар', classId: 'warrior', portrait: 'img/hero-1.jpg' });
  return store;
}

describe('летопись', () => {
  it('записывает сцену, её текст и выбор', () => {
    const store = newStore();
    store.choose({ text: 'Подойти к воротам', next: 'st1' });
    expect(store.getChronicle()).toEqual([
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
    expect(store.getChronicle().at(-1)).toMatchObject({ title: 'Бой: Тень', choice: 'Победа' });
  });
});
