// Общие типы игры. Идентификаторы решений, классов и оружия задаёт контент (src/content),
// поэтому опечатка в имени решения или класса — ошибка компиляции.
import type { ClassId } from '@/content/classes';
import type { FlagId } from '@/content/flags';
import type { WeaponId } from '@/content/weapons';

export type { ClassId, FlagId, WeaponId };

/** Случайное число в [0, 1). В игре — Math.random, в тестах — заранее заданная последовательность. */
export type Rng = () => number;

export interface Range {
  min: number;
  max: number;
}

// --- Герой ---

export type StatId = 'strength' | 'agility' | 'wits';
export type Stats = Record<StatId, number>;

export interface Special {
  name: string;
  description: string;
  /** Сколько ходов ждать после использования. */
  cooldown: number;
  /** Множитель урона. */
  damage?: number;
  /** Враг пропускает ответный удар (и сбивает замах). */
  stun?: boolean;
  /** Гарантированный точный удар. */
  crit?: boolean;
}

export interface HeroClass {
  title: string;
  description: string;
  maxHp: number;
  stats: Stats;
  /** Шанс двойного урона. */
  crit: number;
  /** Шанс увернуться от удара врага. */
  dodge: number;
  special: Special;
}

export interface Weapon {
  name: string;
  damage: Range;
}

export interface Hero {
  name: string;
  classId: ClassId;
  /** Путь к портрету относительно корня сайта, например 'img/hero-1.jpg'. */
  portrait: string;
  stats: Stats;
  hp: number;
  maxHp: number;
  weaponId: WeaponId;
}

// --- Сюжет ---

export type SceneId = string;
export type Flags = Partial<Record<FlagId, true>>;

export interface TextContext {
  hero: Hero;
  flag: (id: FlagId) => boolean;
}

/** Текст сцены или варианта: строка или функция от героя и решений. `\n` — новая строка. */
export type Text = string | ((ctx: TextContext) => string);

export interface EnemyDef {
  name: string;
  portrait: string;
  /** По умолчанию 10. */
  hp?: number;
  /** По умолчанию 0–2. */
  damage?: Range;
  /** Шанс замахнуться вместо удара; следующий удар двойной. По умолчанию 0. */
  windup?: number;
}

export interface StatCheck {
  stat: StatId;
  difficulty: number;
  /** Решения, которые запоминаются только при успехе. */
  set?: Flags;
}

interface ChoiceBase {
  text: Text;
  /** Запомнить решения при выборе. */
  set?: Flags;
  /** Показывать, только если решение принято. */
  if?: FlagId;
  /** Показывать, только если решение не принято. */
  ifNot?: FlagId;
  /** Восстановить до N здоровья (не выше максимума). */
  heal?: number;
}

/** Перейти в сцену. */
export interface GoChoice extends ChoiceBase {
  next: SceneId;
}

/** Бой; победа — переход в next, поражение — конец игры. */
export interface FightChoice extends ChoiceBase {
  fight: EnemyDef;
  next: SceneId;
}

/** Проверка характеристики; успех — next, провал — fail. */
export interface CheckChoice extends ChoiceBase {
  check: StatCheck;
  next: SceneId;
  fail: SceneId;
}

/** Конец игры, возврат в главное меню. */
export interface GameOverChoice extends ChoiceBase {
  gameOver: true;
}

/** Без действия: например, конец написанного сюжета. */
export type InertChoice = ChoiceBase;

export type Choice = GoChoice | FightChoice | CheckChoice | GameOverChoice | InertChoice;

export interface Scene {
  image: string;
  /** Портрет собеседника поверх картинки сцены. */
  actor?: string;
  title: string;
  text: Text;
  choices: Choice[];
}

// --- Бой ---

export type FightAction = 'attack' | 'defend' | 'special';

export interface Enemy {
  name: string;
  portrait: string;
  hp: number;
  maxHp: number;
  damage: Range;
  windup: number;
  /** Замахнулся: следующий удар двойной. */
  windingUp: boolean;
}

export interface FightState {
  enemy: Enemy;
  /** Сколько ходов осталось до приёма класса. */
  cooldown: number;
  log: string[];
  result: 'win' | 'lose' | null;
  /** Куда перейти после победы. */
  winScene: SceneId;
}

// --- Состояние игры ---

export interface CheckNotice {
  success: boolean;
  text: string;
}

/** Текущая партия: герой, где он и что успел решить. */
export interface Session {
  hero: Hero;
  sceneId: SceneId;
  flags: Flags;
  fight: FightState | null;
  /** Итог последней проверки; показывается в сцене сразу после неё. */
  notice: CheckNotice | null;
}

export type Screen = 'menu' | 'createHero' | 'story';

export interface GameState {
  screen: Screen;
  session: Session | null;
}
