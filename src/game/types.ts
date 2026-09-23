// Общие типы игры. Идентификаторы решений, классов, оружия и предметов задаёт контент (src/content),
// поэтому опечатка в имени решения или предмета — ошибка компиляции.
import type { ArmorId } from '@/content/armors';
import type { ClassId } from '@/content/classes';
import type { EventId } from '@/content/events';
import type { FlagId } from '@/content/flags';
import type { ItemId } from '@/content/items';
import type { JournalId } from '@/content/journal';
import type { LocationId } from '@/content/locations';
import type { NpcId } from '@/content/npcs';
import type { WeaponId } from '@/content/weapons';

export type { ArmorId, ClassId, EventId, FlagId, ItemId, JournalId, LocationId, NpcId, WeaponId };

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

/** Защита героя. */
export interface Armor {
  name: string;
  /** Столько урона снимается с каждого удара врага. */
  armor: number;
}

export interface Item {
  name: string;
  /** Короткое пояснение для сумки, например «+3 здоровья». */
  description: string;
  /** Сколько здоровья восстанавливает (не выше максимума). */
  heal?: number;
  /** Только в бою: враг пропускает ответный удар и теряет замах. */
  stun?: boolean;
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
  armorId: ArmorId;
  /** Предметы в сумке; одинаковые повторяются. */
  inventory: ItemId[];
  xp: number;
  level: number;
  /** Сколько повышений уровня ещё не выбрано (награду игрок выбирает сам). */
  levelUps: number;
}

/** Награда за новый уровень. */
export type LevelReward = { stat: StatId } | { maxHp: number };

// --- Время ---

/** Часть суток: утро 6–12, день 12–18, вечер 18–22, ночь 22–6. */
export type Period = 'morning' | 'day' | 'evening' | 'night';

/** Момент игрового времени. В состоянии время хранится числом минут от полуночи первого дня. */
export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  period: Period;
}

/** Промежуток часов [с, до); может переходить через полночь, например [22, 6]. */
export type Hours = readonly [number, number];

// --- Сюжет ---

export type SceneId = string;
export type Flags = Partial<Record<FlagId, true>>;

/** Отношение персонажей к герою: от RELATION_MIN до RELATION_MAX, по умолчанию 0. */
export type Relations = Partial<Record<NpcId, number>>;

/** Условие по отношению персонажа: не меньше min и не больше max (что указано). */
export interface RelationCondition {
  npc: NpcId;
  min?: number;
  max?: number;
}

export interface TextContext {
  hero: Hero;
  flag: (id: FlagId) => boolean;
  time: GameTime;
  /** Где сейчас герой. */
  location: LocationId;
  /** Отношение персонажа к герою (0, если оно не менялось). */
  relation: (id: NpcId) => number;
}

/** Текст сцены или варианта: строка или функция от героя и решений. `\n` — новая строка. */
export type Text = string | ((ctx: TextContext) => string);

/** Перевод текста контента на язык игрока (src/i18n); по умолчанию текст остаётся русским. */
export type Translate = (text: Text) => Text;

/**
 * Сообщение игры: итог проверки, добыча, строка боевого лога, подпись созданного движком варианта.
 * Движок не собирает строки сам — интерфейс переводит сообщение на язык игрока (src/i18n).
 * Имена врагов (enemy) — русские строки из контента, интерфейс переводит и их.
 */
export type Message =
  // итоги выбора
  | { id: 'xp'; amount: number }
  | { id: 'levelUp' }
  | { id: 'check'; stat: StatId; success: boolean }
  | { id: 'itemUsed'; item: ItemId }
  | { id: 'retry' }
  | { id: 'gotWeapon'; weapon: WeaponId }
  | { id: 'gotArmor'; armor: ArmorId }
  | { id: 'gotItem'; item: ItemId }
  | { id: 'journal'; entry: JournalId; change: 'goal' | 'lead' | 'note' | 'done' }
  | { id: 'relation'; npc: NpcId; better: boolean }
  | { id: 'slept'; hours: number; woke: boolean; healed: number }
  // варианты при свободном перемещении и причины, почему что-то недоступно
  | { id: 'move'; to: LocationId; minutes: number }
  | { id: 'travel'; to: LocationId }
  | { id: 'back' }
  | { id: 'closed' }
  | { id: 'hours'; hours: Hours }
  | { id: 'wait' }
  | { id: 'sleep' }
  | { id: 'doneToday' }
  | { id: 'forFight' }
  | { id: 'fullHealth' }
  // боевой лог
  | { id: 'defend'; parry: boolean }
  | {
      id: 'hit';
      enemy: string;
      damage: number;
      /** Приём класса (его название) или обычный удар. */
      special: ClassId | null;
      crit: boolean;
      /** Доспех врага: удержал удар или удар прошёл в щель. */
      armor: 'held' | 'pierced' | null;
    }
  | { id: 'enemyDodged'; enemy: string }
  | { id: 'stunned'; enemy: string; brokeWindup: boolean }
  | { id: 'parried'; enemy: string; damage: number }
  | { id: 'windup'; enemy: string }
  | { id: 'dodged'; heavy: boolean }
  | { id: 'enemyHit'; enemy: string; heavy: boolean; defending: boolean; damage: number }
  | { id: 'blocked' }
  | { id: 'enemyMissed'; enemy: string }
  | { id: 'debugWin' };

/** Подпись варианта: текст из контента или сообщение движка. */
export type Label = Text | Message;

/** Картинка: путь или функция — чтобы менять её от места и времени суток. */
export type Image = string | ((ctx: TextContext) => string);

export interface EnemyDef {
  name: string;
  portrait: string;
  /** По умолчанию 10. */
  hp?: number;
  /** По умолчанию 0–2. */
  damage?: Range;
  /** Шанс замахнуться вместо удара; следующий удар двойной. По умолчанию 0. */
  windup?: number;
  /** Доспех: столько урона снимается с каждого удара героя; точный удар его пробивает. По умолчанию 0. */
  armor?: number;
  /** Шанс увернуться от удара героя (не от приёма). По умолчанию 0. */
  dodge?: number;
  /** Опыт за победу. По умолчанию FIGHT_XP из src/content/progression.ts. */
  xp?: number;
}

/** Что герой получает: оружие и защита надеваются сразу, предметы кладутся в сумку. */
export interface Loot {
  weapon?: WeaponId;
  armor?: ArmorId;
  items?: readonly ItemId[];
}

export interface StatCheck {
  stat: StatId;
  difficulty: number;
  /** Решения, которые запоминаются только при успехе. */
  set?: Flags;
  /** Добыча только при успехе. */
  give?: Loot;
  /** Опыт за успех. По умолчанию CHECK_XP из src/content/progression.ts. */
  xp?: number;
  /** Изменение отношений только при успехе. */
  relation?: Relations;
}

interface ChoiceBase {
  text: Label;
  /** Запомнить решения при выборе. */
  set?: Flags;
  /** Показывать, только если решение принято. */
  if?: FlagId;
  /** Показывать, только если решение не принято. */
  ifNot?: FlagId;
  /** Показывать, только если отношение персонажа в заданных пределах. */
  ifRelation?: RelationCondition;
  /** Изменить отношения при выборе, например { vasya: 1 }. */
  relation?: Relations;
  /** Восстановить до N здоровья (не выше максимума). */
  heal?: number;
  /** Добыча при выборе. */
  give?: Loot;
  /** Показывать только в эти часы. */
  hours?: Hours;
  /** Вне часов hours не прятать, а показывать закрытым с указанием часов (занятия по расписанию). */
  showClosed?: boolean;
  /** Сколько минут занимает выбор. По умолчанию 0. */
  minutes?: number;
  /** Показать, но не давать выбрать; текст — причина (например, закрытый проход). */
  disabled?: Label;
  /** Занятие раз в день: после выбора до конца игровых суток вариант недоступен. */
  daily?: string;
  /** Опыт за выбор. */
  xp?: number;
  /**
   * Тема разговора («torvin.place»): при выборе запоминается в session.asked. Пока тема не
   * спрошена, вариант помечен «новое», а разговор с персонажем в месте — тоже.
   */
  topic?: string;
}

/** Перейти в сцену. */
export interface GoChoice extends ChoiceBase {
  next: SceneId;
}

/** Бой; победа — опыт и переход в next, поражение — конец игры. */
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

/** Закончить сцену и вернуться к свободному перемещению: в текущей локации (true) или в указанной. */
export interface LeaveChoice extends ChoiceBase {
  leave: true | LocationId;
}

/** Перейти в соседнюю локацию (варианты строятся из выходов локации). */
export interface MoveChoice extends ChoiceBase {
  move: LocationId;
}

/** Дойти до места по карте через соседние места; событие по дороге прерывает путь. */
export interface TravelChoice extends ChoiceBase {
  travel: LocationId;
}

/** Подойти к точке интереса в текущем месте (варианты строятся из точек места). */
export interface LookChoice extends ChoiceBase {
  look: SpotId;
}

/** Отойти от точки интереса обратно к месту. */
export interface BackChoice extends ChoiceBase {
  back: true;
}

/** Подождать N минут; события могут прервать ожидание. */
export interface WaitChoice extends ChoiceBase {
  wait: number;
}

/** Спать до утра, восстанавливая здоровье; события могут разбудить. */
export interface SleepChoice extends ChoiceBase {
  sleep: true;
}

/** Без действия: например, конец написанного сюжета. */
export type InertChoice = ChoiceBase;

export type Choice =
  | GoChoice
  | FightChoice
  | CheckChoice
  | GameOverChoice
  | LeaveChoice
  | MoveChoice
  | TravelChoice
  | LookChoice
  | BackChoice
  | WaitChoice
  | SleepChoice
  | InertChoice;

export interface Scene {
  image: Image;
  /** Портрет собеседника поверх картинки сцены. */
  actor?: string;
  title: string;
  text: Text;
  choices: Choice[];
  /** Где происходит сцена: вход в неё переносит героя сюда. */
  location?: LocationId;
  /** Решения, которые запоминаются при входе в сцену. */
  set?: Flags;
  /** Изменение отношений при входе в сцену. */
  relation?: Relations;
  /** Звук при входе в сцену (src/ui/audio.ts). */
  sound?: SoundCue;
}

/** Звуки, которые может заказать сцена. */
export type SoundCue = 'horn';

// --- Мир ---

/** Выход из локации в соседнюю. */
export interface Exit {
  to: LocationId;
  minutes: number;
  /** Открыт, только если решение принято; иначе показан закрытым с подсказкой locked. */
  if?: FlagId;
  /** Закрыт всегда: туда попадают только по сюжету (сцена с location). Показан с подсказкой locked. */
  closed?: boolean;
  locked?: string;
}

/** Точка интереса: то, к чему можно подойти в месте, — окно, сундук, жаровня. Ключ в месте — SpotId. */
export type SpotId = string;

export interface Spot {
  name: string;
  /** Что герой видит, подойдя. */
  text: Text;
  /** Своя картинка; без неё — картинка места. */
  image?: Image;
  /** Точка видна, только если решение принято (так открываются спрятанные места). */
  if?: FlagId;
  ifNot?: FlagId;
  /** Точка видна только в эти часы. */
  hours?: Hours;
  /** Что можно сделать у точки. «Отойти» добавляется само. */
  actions: readonly Choice[];
}

export interface Location {
  name: string;
  image: Image;
  text: Text;
  exits: readonly Exit[];
  /** Точки интереса по порядку показа. */
  spots?: Readonly<Record<SpotId, Spot>>;
  /** Здесь можно спать. */
  bed?: boolean;
  /** Положение на карте крепости (0–100 по ширине, 0–80 по высоте; подписи — ниже точки); без него места нет на карте. */
  map?: { x: number; y: number };
  /** Когда герой знает о месте: до этого его нет ни на карте, ни среди выходов. По умолчанию знает. */
  known?: Condition;
}

/** Где персонаж бывает в какие часы. */
export interface NpcShift {
  location: LocationId;
  hours: Hours;
}

export interface Npc {
  name: string;
  portrait: string;
  schedule: readonly NpcShift[];
  /** Разговор: вариант, который появляется в локации, когда персонаж там (с учётом его if / ifNot). */
  talk: GoChoice;
  /** Когда персонаж появляется в разделе «Люди» журнала. */
  known: Condition;
  /** Кто это — для журнала, от лица героя. */
  about: Text;
}

/**
 * Сюжетное событие: сцена, которая начинается сама, когда выполнены условия.
 * Срабатывает один раз. Проверяется при входе в локацию и по ходу времени.
 */
export interface StoryEvent {
  scene: SceneId;
  /** Где; без location — где угодно. */
  location?: LocationId;
  hours?: Hours;
  /** Не раньше этого дня. */
  fromDay?: number;
  if?: FlagId;
  ifNot?: FlagId;
}

// --- Журнал ---

/** Условие по решениям и случившимся событиям; должны выполняться все указанные части. */
export interface Condition {
  if?: FlagId;
  ifNot?: FlagId;
  /** Принято хотя бы одно из решений: когда к одному и тому же ведут разные пути. */
  ifAny?: readonly FlagId[];
  event?: EventId;
}

export interface JournalNote extends Condition {
  text: Text;
}

/**
 * Запись журнала: цель (что сделать) или зацепка (что удалось узнать). Появляется, когда выполнено
 * её условие; журнал не хранится в сохранении, а каждый раз строится по решениям и событиям.
 */
export interface JournalEntry extends Condition {
  kind: 'goal' | 'lead';
  title: string;
  /** Записи по порядку; видны те, чьё условие выполнено. */
  notes: readonly JournalNote[];
  /** Подсказка, пока цель не выполнена: куда идти и когда. Пустая строка — подсказки нет. */
  hint?: Text;
  /** Цель выполнена. */
  done?: Condition;
}

// --- Бой ---

/** Действие в бою: удар, защита, приём класса или предмет из сумки. */
export type FightAction = 'attack' | 'defend' | 'special' | { item: ItemId };

export interface Enemy {
  name: string;
  portrait: string;
  hp: number;
  maxHp: number;
  damage: Range;
  windup: number;
  armor: number;
  dodge: number;
  xp: number;
  /** Замахнулся: следующий удар двойной. */
  windingUp: boolean;
}

export interface FightState {
  enemy: Enemy;
  /** Сколько ходов осталось до приёма класса. */
  cooldown: number;
  log: Message[];
  result: 'win' | 'lose' | null;
  /** Куда перейти после победы. */
  winScene: SceneId;
  /** Партия перед боем: после поражения можно вернуться к ней и попробовать снова. */
  retry: Session | null;
}

// --- Состояние игры ---

/** Короткое сообщение над текстом сцены: итог проверки, добыча, опыт. */
export interface Notice {
  tone: 'success' | 'fail' | 'info';
  message: Message;
}

/** Текущая партия: герой, где он и что успел решить. */
export interface Session {
  hero: Hero;
  /** Текущая сцена; null — свободное перемещение по локации. */
  sceneId: SceneId | null;
  locationId: LocationId;
  /** Минуты от полуночи первого дня. */
  time: number;
  /** Уже случившиеся события. */
  events: EventId[];
  flags: Flags;
  relations: Relations;
  /** Режим «Одна жизнь»: смерть стирает сохранение, попробовать бой снова нельзя. */
  oneLife: boolean;
  /** Занятия раз в день (daily): в какой игровой день каждое было в последний раз. */
  daily: Record<string, number>;
  /** Точка интереса, у которой стоит герой; null — он в месте целиком. Не сохраняется. */
  spotId: SpotId | null;
  /** Где герой уже побывал: места (LocationId) и точки («место.точка»); остальное помечено новым. */
  visited: string[];
  /** Темы разговоров (topic), о которых герой уже спрашивал. */
  asked: string[];
  fight: FightState | null;
  /** Сообщения о последнем выборе; видны только в сцене сразу после него. */
  notices: Notice[];
}

export type Screen = 'menu' | 'createHero' | 'story';

export interface GameState {
  screen: Screen;
  session: Session | null;
}
