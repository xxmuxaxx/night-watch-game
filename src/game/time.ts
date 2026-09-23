// Игровое время: число минут от полуночи первого дня. Части суток считаются из часов.
import type { GameTime, Hours, Period } from './types';

export const MINUTES_PER_DAY = 24 * 60;

export function periodOf(hour: number): Period {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function toGameTime(minutes: number): GameTime {
  const day = Math.floor(minutes / MINUTES_PER_DAY) + 1;
  const ofDay = minutes % MINUTES_PER_DAY;
  const hour = Math.floor(ofDay / 60);
  return { day, hour, minute: ofDay % 60, period: periodOf(hour) };
}

/** Минуты от полуночи первого дня для дня и часа. */
export function atTime(day: number, hour: number, minute = 0): number {
  return (day - 1) * MINUTES_PER_DAY + hour * 60 + minute;
}

/** Попадает ли время в промежуток часов [с, до); промежуток может переходить через полночь. */
export function inHours(time: GameTime, [from, to]: Hours): boolean {
  const hour = time.hour + time.minute / 60;
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

/** Ближайшие 6:00 после этого момента. */
export function nextMorning(minutes: number): number {
  const { day, hour } = toGameTime(minutes);
  return hour < 6 ? atTime(day, 6) : atTime(day + 1, 6);
}
