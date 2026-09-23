// Наряды (src/content/duties.ts): выдать наряд у доски, отметить выполненным, а когда день
// кончился, а наряд не сделан, — отметить пропущенным и испортить отношение Торвина.
import { DUTIES, DUTY_IDS, DUTY_MISSED_RELATION, NO_DUTY_SCENE } from '@/content/duties';
import { changeRelations } from './relations';
import { toGameTime } from './time';
import type { DutyId, DutyRecord, Rng, SceneId, Session } from './types';

/**
 * Выдать наряд на сегодня: случайный из тех, что герой ещё не выполнял (пропущенный может
 * выпасть снова). Возвращает партию и сцену у доски; если делать нечего — сцену без наряда.
 */
export function takeDuty(session: Session, rng: Rng): { session: Session; scene: SceneId } {
  const done = new Set(session.duties.filter((d) => d.status === 'done').map((d) => d.id));
  const left = DUTY_IDS.filter((id) => !done.has(id));
  const id = left[Math.floor(rng() * left.length)];
  if (!id) return { session, scene: NO_DUTY_SCENE };
  const record: DutyRecord = { id, day: toGameTime(session.time).day, status: 'active' };
  return { session: { ...session, duties: [...session.duties, record] }, scene: DUTIES[id].scene };
}

/** Отметить наряд выполненным. */
export function finishDuty(duties: DutyRecord[], id: DutyId): DutyRecord[] {
  return duties.map((duty) =>
    duty.id === id && duty.status === 'active' ? { ...duty, status: 'done' } : duty,
  );
}

/** Наряды прошлых дней, так и не выполненные, — пропущены: Торвин это запомнит. */
export function settleDuties(session: Session): Session {
  const today = toGameTime(session.time).day;
  const missed = session.duties.filter((duty) => duty.status === 'active' && duty.day < today);
  if (missed.length === 0) return session;
  let { relations } = session;
  const notices = [...session.notices];
  for (let i = 0; i < missed.length; i++) {
    const change = changeRelations(relations, DUTY_MISSED_RELATION);
    relations = change.relations;
    notices.push({ tone: 'fail', message: { id: 'dutyMissed' } }, ...change.notices);
  }
  return {
    ...session,
    relations,
    notices,
    duties: session.duties.map((duty) =>
      missed.includes(duty) ? { ...duty, status: 'missed' } : duty,
    ),
  };
}
