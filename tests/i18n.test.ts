import { describe, expect, it } from 'vitest';
import { EN } from '@/content/en';
import { FLAGS, type FlagId } from '@/content/flags';
import { JOURNAL, type JournalId } from '@/content/journal';
import { LOCATIONS, type LocationId } from '@/content/locations';
import { SCENES } from '@/content/story';
import * as engine from '@/game/engine';
import { atTime } from '@/game/time';
import type { Message, TextContext } from '@/game/types';
import { i18n, LANGS } from '@/i18n';
import { contentPairs } from '@/i18n/content';
import { sessionOf } from './helpers';

const CYRILLIC = /[А-Яа-яЁё]/;
const pairs = contentPairs();
const game = engine.startNewGame(engine.initialState, {
  name: 'Ivar',
  classId: 'warrior',
  portrait: 'img/hero-1.jpg',
});

/** Контексты для текстов-функций: без решений и со всеми, в разное время, в разных местах. */
function contexts(): TextContext[] {
  const allFlags = Object.fromEntries(Object.keys(FLAGS).map((id) => [id as FlagId, true]));
  const result: TextContext[] = [];
  for (const flags of [{}, allFlags]) {
    for (const relation of [-2, 0, 2]) {
      for (const hour of [7, 13, 19, 23]) {
        for (const locationId of Object.keys(LOCATIONS) as LocationId[]) {
          for (const classId of ['warrior', 'rogue'] as const) {
            result.push(
              engine.textContext({
                ...sessionOf(game),
                hero: { ...sessionOf(game).hero, classId },
                flags,
                relations: { torvin: relation, vasya: relation },
                time: atTime(1, hour),
                locationId,
              }),
            );
          }
        }
      }
    }
  }
  return result;
}

describe('перевод контента', () => {
  it('у каждого текста контента есть английский перевод', () => {
    const table = new Set(pairs.filter((pair) => pair.en !== undefined).map((pair) => pair.ru));
    const missing = pairs.filter((pair) => !table.has(pair.ru)).map((pair) => pair.where);
    expect(missing).toEqual([]);
  });

  it('одинаковые русские строки переводятся одинаково', () => {
    const seen = new Map<unknown, unknown>();
    const conflicts: string[] = [];
    for (const { ru, en, where } of pairs) {
      if (en === undefined || typeof ru !== 'string') continue;
      if (seen.has(ru) && seen.get(ru) !== en) conflicts.push(where + ': ' + ru);
      else seen.set(ru, en);
    }
    expect(conflicts).toEqual([]);
  });

  it('перевод повторяет устройство контента: те же сцены, столько же вариантов и записей', () => {
    const problems: string[] = [];
    for (const [id, scene] of Object.entries(EN.scenes)) {
      const ru = SCENES[id];
      if (!ru) problems.push('лишняя сцена ' + id);
      else if (ru.choices.length !== scene.choices.length) problems.push('варианты ' + id);
    }
    for (const id of Object.keys(JOURNAL) as JournalId[]) {
      if (JOURNAL[id].notes.length !== EN.journal[id].notes.length) problems.push('записи ' + id);
    }
    for (const id of Object.keys(LOCATIONS) as LocationId[]) {
      const spots = LOCATIONS[id].spots ?? {};
      for (const [spotId, spot] of Object.entries(EN.locations[id].spots ?? {})) {
        const ru = spots[spotId];
        if (!ru) problems.push('лишняя точка ' + id + '.' + spotId);
        else if (spot.actions && spot.actions.length !== ru.actions.length) {
          problems.push('действия ' + id + '.' + spotId);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('английские тексты без кириллицы и не пустые при любых решениях, времени и месте', () => {
    const ctxs = contexts();
    const bad: string[] = [];
    for (const { en, where } of pairs) {
      if (en === undefined) continue;
      const texts = typeof en === 'function' ? ctxs.map(en) : [en];
      // пустая строка — законная «подсказки нет» у журнала
      if (texts.some((text) => CYRILLIC.test(text))) bad.push(where);
      if (!where.endsWith('.hint') && texts.some((text) => text.trim() === '')) bad.push(where);
    }
    expect(bad).toEqual([]);
  });
});

/** По одному сообщению каждого вида. */
const MESSAGES: Message[] = [
  { id: 'xp', amount: 5 },
  { id: 'levelUp' },
  { id: 'check', stat: 'wits', success: true },
  { id: 'itemUsed', item: 'bread' },
  { id: 'retry' },
  { id: 'gotWeapon', weapon: 'knife' },
  { id: 'gotArmor', armor: 'jacket' },
  { id: 'gotItem', item: 'ash' },
  { id: 'journal', entry: 'lights', change: 'lead' },
  { id: 'relation', npc: 'vasya', better: false },
  { id: 'slept', hours: 3, woke: true, healed: 2 },
  { id: 'move', to: 'hall', minutes: 5 },
  { id: 'closed' },
  { id: 'wait' },
  { id: 'sleep' },
  { id: 'doneToday' },
  { id: 'forFight' },
  { id: 'fullHealth' },
  { id: 'defend', parry: true },
  { id: 'hit', enemy: 'Вася', damage: 3, special: 'rogue', crit: true, armor: 'pierced' },
  { id: 'enemyDodged', enemy: 'Волк' },
  { id: 'stunned', enemy: 'Вася', brokeWindup: true },
  { id: 'parried', enemy: 'Вася', damage: 2 },
  { id: 'windup', enemy: 'Вася' },
  { id: 'dodged', heavy: true },
  { id: 'enemyHit', enemy: 'Человек в тёмном плаще', heavy: true, defending: true, damage: 1 },
  { id: 'blocked' },
  { id: 'enemyMissed', enemy: 'Вася' },
  { id: 'debugWin' },
];

describe('сообщения движка', () => {
  it('переводятся на оба языка; по-английски — без кириллицы, с переводом имён', () => {
    for (const lang of LANGS) {
      for (const message of MESSAGES) expect(i18n(lang).msg(message)).not.toBe('');
    }
    const english = MESSAGES.map(i18n('en').msg);
    expect(english.filter((text) => CYRILLIC.test(text))).toEqual([]);
    expect(i18n('en').msg(MESSAGES[19] as Message)).toBe(
      'Sneak attack! Vasya loses 3 health (through a gap in the armor)',
    );
  });

  it('время и склонение по-русски, время по-английски', () => {
    expect(i18n('ru').time(atTime(1, 19, 5))).toBe('День 1 · 19:05 · вечер');
    expect(i18n('en').time(atTime(2, 7))).toBe('Day 2 · 07:00 · morning');
    expect(['1', '2', '5', '11', '21'].map((n) => i18n('ru').t.turns(Number(n)))).toEqual([
      '1 ход',
      '2 хода',
      '5 ходов',
      '11 ходов',
      '21 ход',
    ]);
  });

  it('варианты при свободном перемещении переводятся', () => {
    const session = { ...sessionOf(game), sceneId: null, locationId: 'courtyard' as const };
    const ctx = engine.textContext(session);
    const labels = engine.availableChoices(session).map((c) => i18n('en').label(c.text, ctx));
    expect(labels).toContain('Go to: Mess hall (5 min)');
    expect(labels).toContain('Wait an hour');
  });
});
