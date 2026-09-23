// Какой звук и когда: фон по месту и времени и короткие звуки по изменению состояния игры.
// Чистые функции без Web Audio — их проверяют тесты; синтез звука — в audio.ts.
import { getScene } from '@/game/engine';
import { toGameTime } from '@/game/time';
import type { GameState, SoundCue } from '@/game/types';

/** Фон: ветер снаружи (ночью — сильнее), очаг в трапезной, тихий ветер в келье. */
export type Ambience = 'wind' | 'storm' | 'hearth' | 'room' | null;

/** Короткие звуки. */
export type Cue =
  SoundCue | 'hit' | 'hurt' | 'parry' | 'windup' | 'win' | 'lose' | 'success' | 'fail' | 'levelup';

export function ambienceFor(state: GameState): Ambience {
  const session = state.session;
  if (state.screen !== 'story' || !session) return null;
  const { period } = toGameTime(session.time);
  switch (session.locationId) {
    case 'hall':
      return 'hearth';
    case 'cell':
      return 'room';
    default:
      return period === 'night' ? 'storm' : 'wind';
  }
}

/** Звуки перехода от prev к next. */
export function cuesBetween(prev: GameState, next: GameState): Cue[] {
  const before = prev.session;
  const after = next.session;
  if (!after || before === after) return [];
  const cues: Cue[] = [];

  // сцена со своим звуком (рог тревоги)
  if (after.sceneId !== null && after.sceneId !== before?.sceneId) {
    const sound = getScene(after.sceneId).sound;
    if (sound) cues.push(sound);
  }

  // бой
  const was = before?.fight;
  const fight = after.fight;
  if (fight && was) {
    const enemyHit = fight.enemy.hp < was.enemy.hp;
    const heroHit = after.hero.hp < (before?.hero.hp ?? after.hero.hp);
    // замах сбит без потери здоровья: парирование или оглушение
    if (was.enemy.windingUp && !fight.enemy.windingUp && !heroHit) cues.push('parry');
    else if (enemyHit) cues.push('hit');
    if (heroHit) cues.push('hurt');
    if (!was.enemy.windingUp && fight.enemy.windingUp) cues.push('windup');
    if (!was.result && fight.result) cues.push(fight.result === 'win' ? 'win' : 'lose');
  }

  // итоги проверок и новый уровень — по сообщениям
  if (after.notices !== before?.notices) {
    for (const notice of after.notices) {
      if (notice.message.id === 'check') cues.push(notice.tone === 'success' ? 'success' : 'fail');
    }
  }
  if (after.hero.levelUps > (before?.hero.levelUps ?? 0)) cues.push('levelup');
  return cues;
}
