// Предметы этапа снаряжения: фляга лечит, камень точит нож, факел помогает в темноте,
// верёвка открывает путь на стену. Инструменты не тратятся и в бою не показываются.
import { describe, expect, it } from 'vitest';
import { LOCATIONS } from '@/content/locations';
import { checkChance, lightHelps } from '@/game/checks';
import * as engine from '@/game/engine';
import { fightItems, itemBlocked } from '@/game/hero';
import { atTime } from '@/game/time';
import type { Choice, GameState, Session, StatCheck } from '@/game/types';
import { constant, noticeTexts, ru, sessionOf, testHero, withSession } from './helpers';

function game(patch: Partial<Session> = {}): GameState {
  const state = engine.startNewGame(engine.initialState, {
    name: 'Ивар',
    classId: 'warrior',
    portrait: 'img/hero-1.jpg',
  });
  return withSession(state, {
    sceneId: null,
    time: atTime(2, 10),
    flags: { joined: true, knowsCell: true },
    ...patch,
  });
}

function texts(state: GameState): string[] {
  const session = sessionOf(state);
  const ctx = engine.textContext(session);
  return engine.availableChoices(session).map((c) => ru.label(c.text, ctx));
}

function pick(state: GameState, fragment: string): Choice {
  const ctx = engine.textContext(sessionOf(state));
  const choice = engine
    .availableChoices(sessionOf(state))
    .find((c) => ru.label(c.text, ctx).includes(fragment));
  if (!choice) throw new Error('Нет варианта «' + fragment + '»: ' + texts(state).join(' | '));
  return choice;
}

describe('предметы', () => {
  it('фляга лечит на 5', () => {
    const hero = testHero('warrior', { hp: 2, maxHp: 20, inventory: ['flask'] });
    const after = sessionOf(engine.applyItem(game({ hero }), 'flask')).hero;
    expect(after).toMatchObject({ hp: 7, inventory: [] });
  });

  it('точильный камень превращает старый нож в наточенный; без ножа и в бою — нельзя', () => {
    const withKnife = testHero('warrior', { weaponId: 'knife', inventory: ['whetstone'] });
    const state = engine.applyItem(game({ hero: withKnife }), 'whetstone');
    expect(sessionOf(state).hero).toMatchObject({ weaponId: 'sharpKnife', inventory: [] });
    expect(noticeTexts(sessionOf(state).notices)).toContain('Получено оружие: Наточенный нож');
    const bare = testHero('warrior', { inventory: ['whetstone'] });
    expect(itemBlocked(bare, 'whetstone', false)).toEqual({ id: 'nothingToSharpen' });
    expect(itemBlocked(withKnife, 'whetstone', true)).toEqual({ id: 'notInFight' });
  });

  it('факел и верёвка не тратятся и в бою не показываются', () => {
    const hero = testHero('warrior', { inventory: ['torch', 'bread', 'rope', 'whetstone'] });
    expect(itemBlocked(hero, 'torch', false)).toEqual({ id: 'passive' });
    expect(fightItems(hero).map(({ id }) => id)).toEqual(['bread']);
  });

  it('факел облегчает проверки в темноте на одно очко', () => {
    const search = LOCATIONS.barracks.spots?.['emptyBunks']?.actions[0];
    if (!search || !('check' in search)) throw new Error('Нет обыска нар');
    const check: StatCheck = search.check;
    const hero = testHero('warrior');
    const lit = { ...hero, inventory: ['torch' as const] };
    expect(lightHelps(lit, check)).toBe(true);
    expect(checkChance(lit, check) - checkChance(hero, check)).toBeCloseTo(0.15);
    // при свете дня фонарь не нужен: проверка без dark
    expect(lightHelps(lit, { ...check, dark: false })).toBe(false);
  });

  it('с верёвкой — путь на стену с задворок кузницы, ночью и без проверки', () => {
    const noRope = game({ locationId: 'smithy', time: atTime(2, 22) });
    expect(texts(noRope)).not.toContain('Задворки кузницы');
    const hero = testHero('warrior', { inventory: ['rope'] });
    const yard = game({
      locationId: 'smithy',
      time: atTime(2, 22),
      hero,
      flags: { gotRope: true },
    });
    const atYard = engine.choose(yard, pick(yard, 'Задворки'), constant(0.5));
    const climbed = engine.choose(atYard, pick(atYard, 'Забросить крюк'), constant(0.99));
    expect(sessionOf(climbed)).toMatchObject({ sceneId: 'wall_rope', locationId: 'wall' });
    expect(sessionOf(climbed).hero.inventory).toEqual(['rope']);
    // днём на стену не полезешь
    const day = withSession(atYard, { time: atTime(2, 12) });
    expect(pick(day, 'Забросить крюк').disabled).toEqual({ id: 'hours', hours: [21, 6] });
  });
});
