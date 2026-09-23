// Строки интерфейса и сообщения движка на английском. Устройство задаёт русский словарь (ru.ts):
// пропущенная строка — ошибка компиляции.
import type { Period } from '@/game/types';
import type { Dict } from './ru';
import type { MessageFormats } from './types';

const PERIODS: Record<Period, string> = {
  morning: 'morning',
  day: 'afternoon',
  evening: 'evening',
  night: 'night',
};

const clock = (hour: number) => hour + ':00';

function turns(n: number): string {
  return n === 1 ? '1 turn' : n + ' turns';
}

const messages: MessageFormats = {
  xp: (m) => '+' + m.amount + ' XP',
  levelUp: () => 'Level up!',
  check: (m, n) => n.stat(m.stat) + ' check: ' + (m.success ? 'success' : 'failure'),
  itemUsed: (m, n) => 'You use: ' + n.item(m.item) + ' (' + n.itemInfo(m.item) + ')',
  retry: () => 'You gather your strength. One more try.',
  gotWeapon: (m, n) => 'New weapon: ' + n.weapon(m.weapon),
  gotArmor: (m, n) => 'New armor: ' + n.armor(m.armor),
  gotItem: (m, n) => 'In your bag: ' + n.item(m.item),
  journal: (m, n) => {
    const title = '“' + n.journal(m.entry) + '”';
    switch (m.change) {
      case 'goal':
        return 'Journal: new goal ' + title;
      case 'lead':
        return 'Journal: new lead ' + title;
      case 'note':
        return 'Journal: new entry in ' + title;
      case 'done':
        return 'Goal complete: ' + title;
    }
  },
  relation: (m, n) => n.npc(m.npc) + ' thinks ' + (m.better ? 'better' : 'worse') + ' of you',
  slept: (m) =>
    'You slept ' +
    m.hours +
    ' h' +
    (m.woke ? ' and woke up' : '') +
    (m.healed > 0 ? ' (+' + m.healed + ' health)' : ''),

  move: (m, n) => 'Go to: ' + n.location(m.to) + ' (' + m.minutes + ' min)',
  travel: (m, n) => 'Walk to: ' + n.location(m.to),
  back: () => 'Step back',
  closed: () => 'Closed',
  hours: (m) => 'Only from ' + clock(m.hours[0]) + ' to ' + clock(m.hours[1]),
  wait: () => 'Wait an hour',
  sleep: () => 'Sleep until morning',
  doneToday: () => 'You have already done this today',
  forFight: () => 'Useful in a fight',
  fullHealth: () => 'Your health is already full',

  defend: (m) => (m.parry ? 'You get ready to parry' : 'You raise your guard'),
  hit: (m, n) =>
    (m.special ? n.special(m.special) + '! ' : m.crit ? 'Precise strike! ' : 'You strike: ') +
    n.enemy(m.enemy) +
    ' loses ' +
    m.damage +
    ' health' +
    (m.armor === 'held' ? ' (the armor takes the blow)' : '') +
    (m.armor === 'pierced' ? ' (through a gap in the armor)' : ''),
  enemyDodged: (m, n) => n.enemy(m.enemy) + ' dodges the blow',
  stunned: (m, n) =>
    (m.brokeWindup ? 'You break the swing: ' : '') +
    n.enemy(m.enemy) +
    ' is stunned and misses a turn',
  parried: (m, n) =>
    'You parry the heavy blow and strike back: ' +
    n.enemy(m.enemy) +
    ' loses ' +
    m.damage +
    ' health',
  windup: (m, n) => n.enemy(m.enemy) + ' winds up for a heavy blow!',
  dodged: (m) => (m.heavy ? 'You dodge the heavy blow!' : 'You dodge the blow'),
  enemyHit: (m, n) =>
    n.enemy(m.enemy) +
    (m.heavy ? ' brings down a heavy blow' : ' strikes back') +
    (m.defending ? ' on your guard' : '') +
    ': you lose ' +
    m.damage +
    ' health',
  blocked: () => 'You take the blow on your guard and lose no health',
  enemyMissed: (m, n) => n.enemy(m.enemy) + ' misses',
  debugWin: () => '[debug] victory',
};

export const en: Dict = {
  locale: 'en-GB',
  time: (day, clock, period) => `Day ${day} · ${clock} · ${PERIODS[period]}`,
  turns,
  msg: messages,

  close: 'Close',
  closeEsc: 'Close (Esc)',
  empty: 'Empty',

  menu: {
    subtitle: 'The Northern March',
    continue: 'Continue',
    newGame: 'New game',
    load: 'Load game',
    settings: 'Settings',
  },

  createHero: {
    title: 'Create your hero',
    name: 'Name',
    defaultName: 'Ivar',
    looks: 'Appearance',
    portrait: (i) => 'Portrait ' + i,
    class: 'Class',
    health: 'Health',
    special: (name, description) => `Technique “${name}”: ${description}`,
    oneLife: 'One life.',
    oneLifeInfo: 'Death erases the save, and a lost fight cannot be retried.',
    nameError: 'Enter the hero’s name!',
    start: 'Begin',
  },

  hero: {
    settings: 'Settings (Esc)',
    classLevel: (title, level) => `${title}, level ${level}`,
    journal: 'Journal',
    openJournal: 'Open the journal (J)',
    weapon: 'Weapon',
    armor: 'Armor',
    armorValue: (armor) => '−' + armor + ' damage',
    crit: 'Precise strike',
    dodge: 'Dodge',
    special: 'Technique',
    bag: 'Bag',
    use: 'Use',
    hp: (hp, maxHp) => `Health: ${hp}/${maxHp}`,
    xp: (xp, next) => (next === null ? `XP: ${xp} (highest level)` : `XP: ${xp}/${next}`),
  },

  scene: {
    here: 'Here: ',
    groups: { people: 'People', spots: 'Look around', paths: 'Paths', time: 'Time' },
    new: 'new',
  },

  map: {
    title: 'Map of the fortress',
    open: 'Map',
    openInfo: 'Map of the fortress (M)',
    here: 'you are here',
    minutes: (minutes) => minutes + ' min',
    new: 'not visited yet',
    locked: 'closed',
    go: (place, minutes) => `Walk to: ${place} (${minutes} min)`,
    busy: 'You cannot leave right now: finish the scene first.',
    legend: 'Click a place to walk there. Something may happen on the way.',
  },

  fight: {
    attack: 'Strike',
    attackInfo: 'a plain blow',
    parry: 'Parry',
    parryInfo: 'turn the heavy blow aside and strike back',
    defend: 'Defend',
    defendInfo: 'half the damage',
    cooldown: (n) => 'in ' + turns(n),
    itemStun: 'Instead of a blow; the enemy misses a turn',
    itemPlain: 'Instead of a blow; the enemy strikes back',
    won: 'You won',
    lost: 'You lost',
    retry: 'Try again',
    yielded: 'You yield',
    giveUp: 'Give up',
    continue: 'Continue',
    enemyArmor: (armor) => 'armor ' + armor + ': precise strikes pierce it',
    enemyDodge: (chance) => 'nimble (' + chance + '): cannot dodge a technique',
    intent: 'Winding up a heavy blow! Defending will parry it',
  },

  journal: {
    title: 'Journal',
    chronicle: 'Chronicle',
    chronicleInfo: 'What you read this session (H)',
    goals: 'Goals',
    noGoals: 'No goals right now.',
    leads: 'Leads',
    noLeads: 'Nothing yet. Keep your eyes open and ask around.',
    people: 'People',
    done: ' — done',
  },

  chronicle: {
    title: 'Chronicle',
    journalInfo: 'Goals, leads and people (J)',
    empty: 'Everything you read and choose this session will be here.',
    fight: (enemy) => 'Fight: ' + enemy,
    win: 'Victory',
    lose: 'Defeat',
    retry: 'Defeat, one more try',
  },

  levelUp: {
    title: 'Level up!',
    subtitle: (name, level) =>
      `${name} reaches level ${level}. Choose a reward; your health will be fully restored along with it.`,
  },

  saves: {
    auto: 'Autosave',
    slot: (slot) => 'Slot ' + slot,
    writeHere: 'save here',
    overwrite: 'overwrite',
    hero: (name, className, level) => `${name}, level ${level} ${className.toLowerCase()}`,
    oneLife: ' · one life',
    savedAt: (date) => 'Saved ' + date,
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    text: 'Text',
    fontSize: 'Font size',
    fontSizes: { small: 'Small', normal: 'Normal', large: 'Large' },
    sound: 'Sound',
    soundInfo: 'Sound: wind, hearth, blows and horns',
    volume: 'Volume',
    hints: 'Hints',
    showHints: 'Show hints for new players',
    resetHints: 'Show hints again',
    game: 'Game',
    autosave:
      'The game saves itself after every choice. Save to a slot to come back to this moment later.',
    savedTo: (slot) => 'Saved to slot ' + slot,
    noSlotsOneLife: 'Slots are not available in One life mode.',
    noSlotsFight: 'You cannot save to a slot right now: finish the fight first.',
    exit: 'Exit to main menu',
  },

  hints: {
    parry:
      'The enemy is winding up! Press “Parry” (2): your guard will turn the heavy blow aside completely, and you will strike back.',
    retry: 'Defeat is not the end: you can retry the fight from where it began.',
    journal:
      'Goals and leads go into the journal: press J or the “Journal” button on the hero panel.',
    roaming:
      'You can now move freely around the fortress. Walk up to whatever is under “Look around”, and find farther places on the map (M). Time passes: people keep their own routine, events happen at their hour, and some activities can be done once a day.',
    bag: 'Items in your bag can be used from the hero panel, and in a fight instead of a blow (key 4).',
    gotIt: 'Got it',
  },
};
