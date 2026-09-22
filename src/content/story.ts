// Весь сюжет: сцены всех глав в одном словаре. Новая глава — новый файл в chapters/ и строка здесь.
// Ключи сцен должны быть уникальны между главами; тесты (tests/story.test.ts) проверяют переходы,
// картинки и достижимость всех сцен.
import type { Scene, SceneId } from '@/game/types';
import { chapter1 } from './chapters/chapter1';

export const SCENES: Record<SceneId, Scene> = {
  ...chapter1,
};

export const START_SCENE: SceneId = 'st0';
