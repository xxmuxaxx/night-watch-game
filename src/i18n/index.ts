// Язык игрока: строки интерфейса (ru.ts, en.ts), сообщения движка и перевод контента (content.ts).
// Движок не знает о языках: он отдаёт тексты контента и сообщения, а переводятся они здесь.
import { armor } from '@/content/armors';
import { heroClass } from '@/content/classes';
import { item } from '@/content/items';
import { JOURNAL } from '@/content/journal';
import { location } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { STAT_NAMES } from '@/content/stats';
import { weapon } from '@/content/weapons';
import { toGameTime } from '@/game/time';
import type { Label, Message, Text, TextContext, Translate } from '@/game/types';
import { contentTranslator } from './content';
import { en } from './en';
import { ru, type Dict } from './ru';
import type { Lang, Names } from './types';

export * from './types';
export type { Dict };

const DICTS: Record<Lang, Dict> = { ru, en };

export interface I18n {
  lang: Lang;
  /** Строки интерфейса. */
  t: Dict;
  /** Перевод текста контента (ещё не вычисленного). */
  tr: Translate;
  /** Строка из контента на языке игрока: имя, название. */
  name(text: string): string;
  /** Текст контента на языке игрока, вычисленный в контексте. */
  text(text: Text, ctx: TextContext): string;
  msg(message: Message): string;
  /** Подпись варианта: текст контента или сообщение движка. */
  label(label: Label, ctx: TextContext): string;
  /** «День 1 · 19:05 · вечер». */
  time(minutes: number): string;
}

function createI18n(lang: Lang): I18n {
  const t = DICTS[lang];
  const tr = contentTranslator(lang);
  const name = (text: string): string => {
    const translated = tr(text);
    return typeof translated === 'string' ? translated : text;
  };
  const text = (value: Text, ctx: TextContext): string => {
    const translated = tr(value);
    return typeof translated === 'function' ? translated(ctx) : translated;
  };
  const names: Names = {
    item: (id) => name(item(id).name),
    itemInfo: (id) => name(item(id).description),
    weapon: (id) => name(weapon(id).name),
    armor: (id) => name(armor(id).name),
    stat: (id) => name(STAT_NAMES[id]),
    npc: (id) => name(NPCS[id].name),
    journal: (id) => name(JOURNAL[id].title),
    special: (id) => name(heroClass(id).special.name),
    location: (id) => name(location(id).name),
    enemy: name,
  };
  const msg = (message: Message): string => {
    // сообщение и его формат выбираются по одному id
    const format = t.msg[message.id] as (m: Message, n: Names) => string;
    return format(message, names);
  };
  return {
    lang,
    t,
    tr,
    name,
    text,
    msg,
    label: (label, ctx) => (typeof label === 'object' ? msg(label) : text(label, ctx)),
    time: (minutes) => {
      const { day, hour, minute, period } = toGameTime(minutes);
      const clock = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
      return t.time(day, clock, period);
    },
  };
}

const cache = new Map<Lang, I18n>();

/** Всё для перевода на язык lang; один объект на язык. */
export function i18n(lang: Lang): I18n {
  let result = cache.get(lang);
  if (!result) {
    result = createI18n(lang);
    cache.set(lang, result);
  }
  return result;
}
