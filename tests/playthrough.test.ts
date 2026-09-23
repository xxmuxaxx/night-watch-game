// Проход главы целиком: много партий делают случайные выборы от пролога, пока не дойдут до конца
// первой главы. Ловит тупики, в которых время не идёт, и падения движка на редких сочетаниях, а
// заодно выводит каждый экран по-русски и по-английски: в английском не должно быть кириллицы.
import { describe, expect, it } from 'vitest';
import { LEVEL_REWARDS } from '@/content/progression';
import * as engine from '@/game/engine';
import { journal } from '@/game/journal';
import { seededRng } from '@/game/random';
import type { GameState, Rng, Session } from '@/game/types';
import { i18n } from '@/i18n';

const END = 'st9';
const MAX_STEPS = 3000;
const ru = i18n('ru');
const en = i18n('en');
const CYRILLIC = /[а-яё]/i;

/** Всё, что игрок видит сейчас: сцена или место, варианты, сообщения, журнал. */
function screenTexts(session: Session, lang: typeof ru): string[] {
  const ctx = engine.textContext(session);
  const scene = session.sceneId === null ? null : engine.getScene(session.sceneId);
  return [
    ...(scene ? [lang.text(scene.title, ctx), lang.text(scene.text, ctx)] : []),
    ...engine.availableChoices(session).map((choice) => lang.label(choice.text, ctx)),
    ...engine
      .availableChoices(session)
      .flatMap((choice) => (choice.disabled ? [lang.label(choice.disabled, ctx)] : [])),
    ...session.notices.map((notice) => lang.msg(notice.message)),
    ...journal(session, lang.tr).flatMap((entry) => [
      entry.title,
      ...entry.notes,
      entry.hint ?? '',
    ]),
  ];
}

/** Один шаг случайного игрока: бой — ударами, новый уровень — первая награда, иначе любой вариант. */
function step(state: GameState, rng: Rng): GameState {
  const session = state.session;
  if (!session) throw new Error('Нет партии');
  if (session.fight) {
    if (session.fight.result === null) return engine.fightAction(state, 'attack', rng);
    return engine.canRetryFight(session) ? engine.retryFight(state) : engine.closeFight(state);
  }
  if (engine.isChoosingLevelReward(session)) {
    return engine.chooseLevelReward(state, LEVEL_REWARDS[0]?.reward ?? { maxHp: 3 });
  }
  const choices = engine.availableChoices(session).filter((choice) => !choice.disabled);
  const choice = choices[Math.floor(rng() * choices.length)];
  if (!choice) throw new Error('Некуда идти: ' + (session.sceneId ?? session.locationId));
  return engine.choose(state, choice, rng);
}

function newGame(classId: 'warrior' | 'rogue'): GameState {
  // имя латиницей: иначе оно одно дало бы кириллицу в английском тексте
  return engine.startNewGame(engine.initialState, {
    name: 'Ivar',
    classId,
    portrait: 'img/hero-1.jpg',
  });
}

describe('проход главы', () => {
  it('случайные партии доходят до конца главы; английский экран — без кириллицы', () => {
    const untranslated = new Set<string>();
    const endings: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const rng = seededRng(seed);
      let state = newGame(seed % 2 ? 'warrior' : 'rogue');
      let steps = 0;
      while (state.session?.sceneId !== END && steps < MAX_STEPS) {
        // смерть (побег у ворот) — начать заново
        if (state.screen !== 'story') state = newGame('warrior');
        const session = state.session;
        if (session) {
          for (const text of screenTexts(session, en)) {
            if (CYRILLIC.test(text)) untranslated.add(text.slice(0, 80));
          }
          screenTexts(session, ru);
        }
        state = step(state, rng);
        steps++;
      }
      expect(state.session?.sceneId, 'зерно ' + seed).toBe(END);
      endings.push(state.session?.time ?? 0);
    }
    expect([...untranslated]).toEqual([]);
    // тревога — во вторую ночь: конец главы наступает на третий игровой день
    for (const time of endings) expect(Math.floor(time / (24 * 60)) + 1).toBe(3);
  });
});
