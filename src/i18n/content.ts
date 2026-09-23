// Перевод контента. Русские тексты лежат в src/content, английские — в src/content/en по тем же
// идентификаторам и в том же порядке. Здесь они сопоставляются попарно, и перевод ищется по самому
// русскому тексту: строке или функции. Так переводятся и тексты, которые движок копирует или
// передаёт дальше (варианты, закрытые выходы, имена врагов в бою). Одинаковые русские строки
// переводятся одинаково; расхождения и пропуски ловит tests/i18n.test.ts.
import { ARMORS } from '@/content/armors';
import { CLASS_IDS, HERO_CLASSES } from '@/content/classes';
import { EN } from '@/content/en';
import { ENEMIES, type EnemyId } from '@/content/enemies';
import { ITEMS, type ItemId } from '@/content/items';
import { JOURNAL, type JournalId } from '@/content/journal';
import { LOCATIONS, type LocationId } from '@/content/locations';
import { NPCS, type NpcId } from '@/content/npcs';
import { LEVEL_REWARDS } from '@/content/progression';
import { ATTITUDES } from '@/content/relations';
import { ROUTINE } from '@/content/chapters/routine';
import { SCENES } from '@/content/story';
import { STAT_IDS, STAT_NAMES } from '@/content/stats';
import { WEAPONS, type WeaponId } from '@/content/weapons';
import type { ArmorId, Label, Text, Translate } from '@/game/types';
import type { Lang } from './types';

/** Русский текст и его перевод (undefined — перевода нет); where — где он, для отчёта о пропусках. */
export interface TextPair {
  ru: Text;
  en: Text | undefined;
  where: string;
}

const keys = <K extends string>(record: Record<K, unknown>) => Object.keys(record) as K[];

/** Все тексты контента с переводами, по порядку. */
export function contentPairs(): TextPair[] {
  const pairs: TextPair[] = [];
  const add = (ru: Label | undefined, en: Text | undefined, where: string) => {
    // сообщения движка переводит словарь, а не контент
    if (ru !== undefined && typeof ru !== 'object') pairs.push({ ru, en, where });
  };

  for (const [id, scene] of Object.entries(SCENES)) {
    const en = EN.scenes[id];
    add(scene.title, en?.title, id + '.title');
    add(scene.text, en?.text, id + '.text');
    scene.choices.forEach((choice, i) => {
      add(choice.text, en?.choices[i], `${id}.choices[${i}]`);
    });
  }
  for (const place of ['courtyard', 'hall'] as const) {
    ROUTINE[place].forEach((choice, i) => {
      add(choice.text, EN.routine[place][i], `ROUTINE.${place}[${i}]`);
    });
  }
  for (const id of keys<LocationId>(LOCATIONS)) {
    const place = LOCATIONS[id];
    const en = EN.locations[id];
    add(place.name, en.name, id + '.name');
    add(place.text, en.text, id + '.text');
    for (const exit of place.exits)
      add(exit.locked, en.locked?.[exit.to], `${id}.exits.${exit.to}`);
    place.actions?.forEach((choice, i) => {
      add(choice.text, en.actions?.[i], `${id}.actions[${i}]`);
    });
  }
  for (const id of keys<NpcId>(NPCS)) {
    const npc = NPCS[id];
    const en = EN.npcs[id];
    add(npc.name, en.name, id + '.name');
    add(npc.talk.text, en.talk, id + '.talk');
    add(npc.about, en.about, id + '.about');
  }
  for (const id of keys<JournalId>(JOURNAL)) {
    const entry = JOURNAL[id];
    const en = EN.journal[id];
    add(entry.title, en.title, id + '.title');
    entry.notes.forEach((note, i) => {
      add(note.text, en.notes[i], `${id}.notes[${i}]`);
    });
    if ('hint' in entry) add(entry.hint, en.hint, id + '.hint');
  }
  for (const id of CLASS_IDS) {
    const cls = HERO_CLASSES[id];
    const en = EN.classes[id];
    add(cls.title, en.title, id + '.title');
    add(cls.description, en.description, id + '.description');
    add(cls.special.name, en.special.name, id + '.special.name');
    add(cls.special.description, en.special.description, id + '.special.description');
  }
  for (const id of keys<WeaponId>(WEAPONS)) add(WEAPONS[id].name, EN.weapons[id], 'weapon ' + id);
  for (const id of keys<ArmorId>(ARMORS)) add(ARMORS[id].name, EN.armors[id], 'armor ' + id);
  for (const id of keys<ItemId>(ITEMS)) {
    add(ITEMS[id].name, EN.items[id].name, 'item ' + id);
    add(ITEMS[id].description, EN.items[id].description, `item ${id}.description`);
  }
  for (const id of STAT_IDS) add(STAT_NAMES[id], EN.stats[id], 'stat ' + id);
  for (const id of keys<EnemyId>(ENEMIES)) add(ENEMIES[id].name, EN.enemies[id], 'enemy ' + id);
  ATTITUDES.forEach((level, i) => {
    add(level.name, EN.attitudes[i], `ATTITUDES[${i}]`);
  });
  LEVEL_REWARDS.forEach((reward, i) => {
    add(reward.label, EN.levelRewards[i], `LEVEL_REWARDS[${i}]`);
  });
  return pairs;
}

/** Перевод по русскому тексту; первый перевод одинаковой строки главный. */
function buildTable(pairs: TextPair[]): Map<Text, Text> {
  const table = new Map<Text, Text>();
  for (const { ru, en } of pairs) if (en !== undefined && !table.has(ru)) table.set(ru, en);
  return table;
}

const same: Translate = (text) => text;
let english: Translate | null = null;

/** Перевод текстов контента на язык; для русского — сами тексты. Без перевода — русский текст. */
export function contentTranslator(lang: Lang): Translate {
  if (lang === 'ru') return same;
  if (!english) {
    const table = buildTable(contentPairs());
    english = (text) => table.get(text) ?? text;
  }
  return english;
}
