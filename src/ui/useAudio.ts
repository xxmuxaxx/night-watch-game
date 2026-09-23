import { useEffect, useRef, useState } from 'preact/hooks';
import type { GameState } from '@/game/types';
import { createAudioEngine } from './audio';
import type { Settings } from './settings';
import { ambienceFor, cuesBetween } from './soundCues';

/** Звук игры: фон по месту и короткие звуки при изменениях состояния. */
export function useAudio(state: GameState, settings: Settings) {
  // один движок на всё время работы приложения
  const [engine] = useState(createAudioEngine);
  const prevRef = useRef(state);

  useEffect(() => {
    engine.setVolume(settings.volume, settings.sound);
  }, [engine, settings.volume, settings.sound]);

  const ambience = ambienceFor(state);
  useEffect(() => {
    engine.setAmbience(ambience);
  }, [engine, ambience]);

  useEffect(() => {
    for (const cue of cuesBetween(prevRef.current, state)) engine.play(cue);
    prevRef.current = state;
  }, [engine, state]);
}
