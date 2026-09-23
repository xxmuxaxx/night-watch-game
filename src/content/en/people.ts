// Люди крепости на английском: сцены из src/content/chapters/people.ts.
import type { SceneText } from './types';

/** Что на ужин: в том же порядке, что по-русски. */
const SUPPERS = [
  'Turnip stew. Yesterday it was turnip stew, and tomorrow it will be too. Don’t like it — eat snow.',
  'Porridge with lard. Little lard, lots of porridge. Be glad.',
  'Fish. Salted, from last autumn. You’ll be drinking till morning after — there’s something to keep you busy.',
];

export const people: Record<string, SceneText> = {
  cook_talk: {
    title: 'The cook',
    text: ({ flag }) =>
      flag('metCook')
        ? '“What do you want?” Ulf doesn’t look up from the cauldron.'
        : 'The cook, red from the heat, turns from his cauldron and jabs a ladle at you.\n“Ulf. The kitchen’s mine, the cauldrons are mine, the bread is mine. Washed your hands?”',
    choices: [
      'What’s for supper today?',
      'Who’s that ginger thief?',
      'Can I help with anything?',
      'Here’s your pantry key',
      'Did Erik take anything from you before the patrol?',
      'Nothing, I won’t get in your way',
    ],
  },
  cook_supper: {
    title: 'Supper',
    text: ({ time }) =>
      '“Supper?” Ulf snorts. “' + (SUPPERS[(time.day - 1) % SUPPERS.length] ?? '') + '”',
    choices: ['I see'],
  },
  cook_cat: {
    title: 'Captain',
    text: '“The ginger one? That’s Captain.” Ulf almost smiles. “He’s the one in charge here, not the elders. Catches mice, steals sausage. Balance. Chase him off, and the mice will eat all the grain by spring.”',
    choices: ['I see'],
  },
  cook_key: {
    title: 'The pantry key',
    text: '“Help?” Ulf eyes you suspiciously, then waves his ladle. “All right, help. The pantry key’s gone. I hang it on the nail by the hearth, same as always, and this morning the nail was empty. Whoever took it — I’ll tear his head off. Find it, and I won’t forget.”',
    choices: ['I’ll look'],
  },
  cook_key_return: {
    title: 'Found',
    text: '“In the ash?” Ulf turns the key over and blows the soot off it. “Captain, the rascal, was climbing the shelves again.” He tucks the key inside his shirt and breaks off two crusts for you. “Here. And drop by if you need anything. Might even find some lard for you.”',
    choices: ['Thank you'],
  },
  cook_erik: {
    title: 'Hardtack',
    text: '“Erik?” Ulf stops stirring. “He did. The day before the patrol he begged hardtack off me — for three, for three days. I laughed at him: nobody takes that much for one night. And he says: you never know, we might get lost.”\nHe picks the ladle up again.\n“Got lost, then.”',
    choices: ['I see'],
  },

  hearth_key: {
    title: 'In the ash',
    text: 'You rake through the cold ash under the grate, and your fingers hit something cold: a big iron key on a ring. It must have fallen off the nail — or been helped off it.',
    choices: ['Brush off your hands'],
  },
  hearth_nothing: {
    title: 'Only ash',
    text: 'You sift through the ash until your arms are grey to the elbow, but find only nails and a charred bone. Maybe you should look more carefully.',
    choices: ['Brush off your hands'],
  },

  mirko_talk: {
    title: 'Mirko',
    text: ({ flag }) =>
      flag('metMirko')
        ? 'Mirko breaks into a gap-toothed grin: “Oh, it’s you!”'
        : 'The lanky, freckled recruit from the drill ground holds out his hand.\n“Mirko. And you’re the new one, I saw them bring you in. Never mind, you get used to it here.”',
    choices: [
      'Where are you from?',
      'What do people do here in the evenings?',
      'Did you know Erik and Martin?',
      'Did you know Erik and Martin?',
      'See you',
    ],
  },
  mirko_self: {
    title: 'From the valley',
    text: '“From the valley, a farmstead by the mill.” Mirko shrugs. “Father owed the lord, and there was nothing to pay with. My brother’s to marry, and me — into the watch.” His grin widens. “But they feed you. At home in winter we didn’t eat every day.”',
    choices: ['Got it'],
  },
  mirko_dice: {
    title: 'Dice',
    text: '“Evenings? They throw dice in the barracks after supper, until the elders break it up. Lame Jorgen runs the game, they play for bread.” Mirko lowers his voice. “Just watch his hands. Whoever watches sometimes even wins.”',
    choices: ['Got it'],
  },
  mirko_martin: {
    title: 'Letters',
    text: 'Mirko’s grin fades.\n“Martin promised to teach me my letters. We even started — letters in the snow with a stick.” He falls silent. “He was always writing to someone. In the evenings, by a splinter light. I asked who to, and he said: ‘To those who are waiting.’ But nobody sends letters from here — a messenger once a month, and not even that in winter.”',
    choices: ['Got it'],
  },

  dice_win: {
    title: 'Sixes',
    text: 'You don’t take your eyes off Lame Jorgen’s hands, and on the third throw he doesn’t manage to swap the dice. Two sixes. Jorgen grimaces but pushes two crusts over to you: with witnesses around, there’s no wriggling out of it.',
    choices: ['Hide your winnings'],
  },
  dice_lose: {
    title: 'Ones',
    text: 'The dice roll, knock against the edge of the crate and land ones up. Lame Jorgen, looking pleased, rakes in your crust.\n“It happens, new one. You’ll win it back tomorrow.”',
    choices: ['Step away'],
  },

  wall_bribe: {
    title: 'A treat',
    text: 'The sentry looks at the flask for a long time, then at you, then at the flask again.\n“Well… not for long. And I never saw you.”\nHe takes a swig and turns to the wall. You climb the stairs. Nobody up here — only the wind.',
    choices: ['Look around'],
  },
};
