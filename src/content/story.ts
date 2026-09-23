// Весь сюжет: сцены всех глав в одном словаре. Новая глава — новый файл в chapters/ и строка здесь.
// Ключи сцен должны быть уникальны между главами; тесты (tests/story.test.ts) проверяют переходы,
// картинки и достижимость всех сцен.
import { atTime } from '@/game/time';
import type { LocationId, Scene, SceneId } from '@/game/types';
import { chapter1 } from './chapters/chapter1';
import { duties } from './chapters/duties';
import { places } from './chapters/places';
import { routine } from './chapters/routine';
import { talks } from './chapters/talks';

export const SCENES: Record<SceneId, Scene> = {
  ...chapter1,
  ...places,
  ...routine,
  ...talks,
  ...duties,
};

/** Начало игры: первая сцена пролога, 16:00 первого дня, перед воротами крепости. */
export const START_SCENE: SceneId = 'st0';
export const START_TIME = atTime(1, 16);
export const START_LOCATION: LocationId = 'gate';
