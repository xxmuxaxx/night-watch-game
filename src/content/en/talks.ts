// Темы разговоров на английском: сцены из src/content/chapters/talks.ts.
import type { SceneText } from './types';

export const talks: Record<string, SceneText> = {
  // --- Торвин ---
  torvin_duties: {
    title: 'The routine',
    text: '“From dawn it’s the drill yard: wooden swords till your arms fall off. Whoever isn’t drilling is in the kitchen or chopping wood. Duties are chalked on the board by the gate — reading it is your job.”\nHe counts on his fingers.\n“There’s always work in Halvar’s smithy. In the evening the sentries warm themselves at the brazier, don’t chase them off. And at night — sleep. Whoever wanders about at night answers to me.”',
    choices: ['I see'],
  },
  torvin_self: {
    title: 'Twenty winters',
    text: ({ hero, relation }) =>
      '“How long?” Torvin smirks. “Twenty winters. I was brought in a cart just like yours, and asked my name just the same.”\n' +
      (relation('torvin') >= 1
        ? 'He falls silent, looking at the gate.\n“There were seven of us in that group. I’m the only one left. Not from swords — the forest takes you one at a time. So keep close to the fire, ' +
          hero.name +
          '.”'
        : '“The past stays outside the gate. Mine too.”'),
    choices: ['I see'],
  },
  torvin_vasya: {
    title: 'About Vasya',
    text: ({ flag }) =>
      '“Vasya?” Torvin snorts. “Loud, quick with his fists and kind, though he’d never admit it. ' +
      (flag('vasyaFriend')
        ? 'Good that you two got along: a friend is worth more here than a sword.”'
        : flag('talkedDownVasya')
          ? 'You talked him down neatly at the gate. He doesn’t forget that sort of thing — neither harm nor kindness.”'
          : 'You spoiled his lip, he’ll remember that. Or he’ll respect you for it — you never can tell with him.”'),
    choices: ['I see'],
  },
  torvin_missing: {
    title: 'Erik and Martin',
    text: ({ hero }) =>
      'Torvin’s smile fades.\n“They ran. It happens: something itches in your head, and freedom seems to lie beyond the pass.” He looks at the forest. “The forest swallows fools. Don’t look for them, ' +
      hero.name +
      '. And don’t go asking — not me, not anyone.”',
    choices: ['I see'],
  },
  torvin_escort_trust: {
    title: 'As far as the old fir',
    text: 'Torvin is silent for a long time, then nods.\n“I did. As far as the old fir at the fork; past that there’s only one path — to the pass. Told them to be back by dawn.” He rubs the bridge of his nose. “They didn’t come back. I stood at the gate till morning.”\nHe gives you a heavy look.\n“I said they ran because it’s easier for everyone that way. It’ll be easier for you too.”',
    choices: ['I see'],
  },
  torvin_escort_cold: {
    title: 'None of your business',
    text: 'Torvin’s face turns to stone.\n“Stanley talks too much. Yes, I saw them off — that’s what I’m in charge for.” He takes a step towards you. “And you listen too much, recruit. Find something to do.”',
    choices: ['All right'],
  },
  torvin_note: {
    title: 'The note',
    text: ({ relation }) =>
      'Torvin takes the scrap of paper, and for a moment his face turns grey.\n' +
      (relation('torvin') >= 1
        ? '“Where did you get this? Under the bunks…” He gives the note back and squeezes your hand around it. “Burn it. Today. And not a word to anyone, you hear? No one.”'
        : '“Scribbles,” he snaps, shoving the note back at you. “Throw it away and don’t fill your head with it.”\nBut his fingers are trembling.'),
    choices: ['I see'],
  },
  torvin_signal: {
    title: 'The corner tower',
    text: ({ relation }) =>
      '“On the wall? At night?” Torvin looks at you in a way that makes you want to step back.\n' +
      (relation('torvin') >= 1
        ? '“Flashing, you say…” He lowers his voice. “The corner tower is not your concern. You weren’t there, you saw nothing. That’s best for everyone — and for you first of all.”'
        : '“You weren’t there,” he says, spacing out the words. “And if you were, pray the elders don’t find out. The corner tower is not your concern.”'),
    choices: ['I see'],
  },

  // --- Вася ---
  vasya_self: {
    title: 'From the south',
    text: ({ relation }) =>
      '“From the south, near the Fords.” Vasya shrugs. “Stole horses. Well, one. Well, not mine.”' +
      (relation('vasya') >= 1
        ? '\nHe laughs.\n“The judge said: the rope or the watch. I figured the rope isn’t going anywhere.”'
        : '\n“What’s it to you?”'),
    choices: ['Got it'],
  },
  vasya_tips: {
    title: 'How to survive',
    text: ({ relation }) =>
      'Vasya counts on his fingers.\n“One: help in the kitchen. The cook’s mean, but he won’t grudge you bread. Two: ash from the hearth. Laughing? Throw it in their eyes and any brute is yours. Three: keep off the wall at night, the sentries will tell Torvin.”' +
      (relation('vasya') >= 1
        ? '\nHe winks.\n“And four: stick with me. You won’t go wrong with me.”'
        : ''),
    choices: ['Got it'],
  },
  vasya_missing: {
    title: 'Erik and Martin',
    text: 'Vasya’s face darkens.\n“Erik was handy, always tinkering with bits of iron: fixing a lock, bending a buckle. Spent his evenings at Halvar’s. Martin was quiet, could read and write, wrote letters for everyone.”\nHe shakes his head.\n“And they didn’t run. Erik owed me three coppers and swore he’d pay after the patrol. Erik kept his word.”',
    choices: ['Got it'],
  },
  vasya_smith: {
    title: 'About Halvar',
    text: '“Halvar?” Vasya lowers his voice. “Even Torvin is wary of him. They say he’s been here longer than anyone, longer than the elders. Erik spent his evenings with him — learning, he said. What’s there to learn besides working the bellows?”',
    choices: ['Got it'],
  },
  vasya_note: {
    title: 'The handwriting',
    text: 'Vasya turns the scrap of paper over, his lips moving.\n“Martin wrote this! See how he does his “t”, with a little tail? He’s the only one who writes like that.” Vasya looks up at you. “Where did you get it? Under his bunk?”\nHe hands the note back as if it burns.\n“Listen, hide that somewhere safe.”',
    choices: ['Got it'],
  },

  // --- Хальвар ---
  smith_self: {
    title: 'Thirty years at the forge',
    text: ({ flag }) =>
      '“Thirty years at this forge.” Halvar runs his palm over the anvil. “Elders change, recruits change, but iron stays the same: it rusts, it breaks, and someone has to mend it.”' +
      (flag('smithTold') ? '\nHe glances at the lantern on the workbench and falls silent.' : ''),
    choices: ['I see'],
  },
  smith_weapons: {
    title: 'Advice',
    text: ({ flag }) =>
      (flag('foundKnife')
        ? 'Halvar takes your knife, tests the edge with his thumb and snorts.\n“Northern work, old. Good steel, but no edge to speak of. It wants a proper sharpening.”'
        : 'Halvar looks over your empty hands.\n“Nobody will give you a sword till you’ve earned it. Until then anything beats fists: a knife, a stick, a handful of ash.”') +
      '\n“And remember: it isn’t the iron that strikes, it’s whoever holds it. When the other man winds up — cover yourself and strike back. Not before.”',
    choices: ['I see'],
  },
  smith_erik: {
    title: 'Erik',
    text: '“A handy lad, he was,” Halvar stares into the fire. “Came in the evenings, helped out, asked questions: how a lock works, how to fit a shutter so it doesn’t stick. I thought he had a feel for the trade.”\nHe strikes the blank harder than he needs to.\n“Now I think: he knew why he was asking.”',
    choices: ['I see'],
  },
  smith_note: {
    title: 'The third watch',
    text: 'Halvar reads it, squinting, and hands the note back.\n“The third watch is from midnight till dawn. When the sentries sleep hardest.” He leans towards you, smelling of soot. “I didn’t see this. And you never showed it to me. Understood?”',
    choices: ['I see'],
  },
};
