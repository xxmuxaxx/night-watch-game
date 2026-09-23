// Настройки игрока: не часть партии, а предпочтения на этом устройстве (localStorage,
// отдельный ключ от сохранения). Хранятся и применяются так же, как состояние игры в store.ts:
// компоненты читают их через useSettings() и меняют через update().
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import type { SaveStorage } from '@/game/save';
import { DEFAULT_LANG, isLang, type Lang } from '@/i18n';

export const SETTINGS_KEY = 'nightwatch-settings';

export type FontSize = 'small' | 'normal' | 'large';

export interface Settings {
  /** Язык интерфейса и сюжета. */
  language: Lang;
  fontSize: FontSize;
  /** Звук включён. */
  sound: boolean;
  /** Громкость 0–1. */
  volume: number;
  /** Показывать подсказки для новичка. */
  hints: boolean;
  /** Подсказки, которые игрок уже закрыл. */
  seenHints: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  language: DEFAULT_LANG,
  fontSize: 'normal',
  sound: true,
  volume: 0.6,
  hints: true,
  seenHints: [],
};

export interface SettingsStore {
  get(): Settings;
  update(patch: Partial<Settings>): void;
  subscribe(listener: () => void): () => void;
}

function read(storage: SaveStorage): Settings {
  try {
    const raw: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? 'null');
    // неизвестные и недостающие поля заменяются значениями по умолчанию
    if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
    const settings: Settings = { ...DEFAULT_SETTINGS, ...raw };
    return isLang(settings.language) ? settings : { ...settings, language: DEFAULT_LANG };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function createSettingsStore(storage: SaveStorage): SettingsStore {
  let settings = read(storage);
  const listeners = new Set<() => void>();
  return {
    get: () => settings,
    update(patch) {
      settings = { ...settings, ...patch };
      try {
        storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // хранилище недоступно — настройки живут до перезагрузки
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const SettingsContext = createContext<SettingsStore | null>(null);

/** Текущие настройки и способ их изменить; компонент перерисовывается при изменении. */
export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const store = useContext(SettingsContext);
  if (!store) throw new Error('useSettings вне SettingsContext');
  const [settings, setSettings] = useState(store.get());
  useEffect(() => {
    setSettings(store.get());
    return store.subscribe(() => setSettings(store.get()));
  }, [store]);
  return [settings, store.update];
}
