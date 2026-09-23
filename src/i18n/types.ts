// Языки игры и типы словарей. Русский — основной: контент пишется на нём, английский — перевод.
import type {
  ArmorId,
  ClassId,
  ItemId,
  JournalId,
  LocationId,
  Message,
  NpcId,
  StatId,
  WeaponId,
} from '@/game/types';

export const LANGS = ['ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'ru';

/** Названия языков — каждое на своём языке, чтобы его узнал тот, кто его читает. */
export const LANG_NAMES: Record<Lang, string> = { ru: 'Русский', en: 'English' };

export function isLang(value: unknown): value is Lang {
  return LANGS.some((lang) => lang === value);
}

/** Названия из контента на языке игрока — для сообщений движка. */
export interface Names {
  item(id: ItemId): string;
  /** Короткое пояснение предмета, например «+3 здоровья». */
  itemInfo(id: ItemId): string;
  weapon(id: WeaponId): string;
  armor(id: ArmorId): string;
  stat(id: StatId): string;
  npc(id: NpcId): string;
  journal(id: JournalId): string;
  /** Название приёма класса. */
  special(id: ClassId): string;
  location(id: LocationId): string;
  /** Имя врага: в бою хранится русское имя из бестиария. */
  enemy(name: string): string;
}

/** Как показать каждое сообщение движка: словарь обязан описать все. */
export type MessageFormats = {
  [K in Message['id']]: (message: Extract<Message, { id: K }>, names: Names) => string;
};
