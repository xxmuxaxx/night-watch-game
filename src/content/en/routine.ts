// Распорядок крепости на английском: занятия (ROUTINE) и сцены после них.
import type { RoutineId } from '@/content/chapters/routine';
import type { SceneText } from './types';

export const ROUTINE: Record<RoutineId, string> = {
  training: 'Train with the recruits (2 h, +5 XP)',
  brazier: 'Warm up by the brazier with the sentries (1 h, +2 health)',
  kitchen: 'Help the cook in the kitchen (1.5 h, food for your bag)',
  sparRecruit: 'Practice bout with a recruit (20 min)',
  sparVasya: 'Call Vasya for a practice bout (20 min)',
  sparTorvinFirst: 'Ask Torvin for a practice bout (20 min)',
  sparTorvin: 'Ask Torvin for a practice bout (20 min)',
  ash: 'Scoop up ash from the hearth (in a fight — into the enemy’s eyes)',
};

/** Байки у жаровни: в том же порядке, что по-русски. */
const BRAZIER_RUMORS = [
  'Someone tells a tale about a bear that once wandered right up to the gate and left with the cook’s cauldron.',
  'The sentries argue in low voices whether last spring a laden sledge was really found at the pass, with no horses and no driver.',
  'An old sentry grumbles that Captain the cat eats better than the recruits, and nobody argues.',
];

export const routine: Record<string, SceneText> = {
  spar_recruit_win: {
    title: 'Practice bout',
    text: 'The lanky, freckled recruit huffs and presses on, but soon runs out of breath. You knock the sword out of his hand, and he raises his hands, panting.\n“All right, all right! You win.”',
    choices: ['Catch your breath'],
  },
  spar_recruit_lose: {
    title: 'In the snow',
    text: 'The lanky recruit turns out to be quicker than he looks. A blow to the ribs — and you are in the snow, gasping for air.\n“Still alive?” He holds out a hand. “You’ll get even tomorrow.”',
    choices: ['Get up'],
  },
  spar_vasya_win: {
    title: 'Well, look at you',
    text: ({ flag }) =>
      '“Well, look at you!” Vasya sits in the snow laughing, rubbing his shoulder. ' +
      (flag('trippedVasya')
        ? '“That trip of yours again? Never mind, I’ll figure it out yet.”'
        : '“Fine, you win today. Tomorrow’s mine.”'),
    choices: ['Help him up'],
  },
  spar_vasya_lose: {
    title: 'No hard feelings',
    text: 'Vasya, terribly pleased with himself, helps you up.\n“Don’t take it badly, new boy. When you wind up, you open yourself right up — I can see it straight away. Again tomorrow?”',
    choices: ['Get up'],
  },
  spar_torvin_first: {
    title: 'Now that’s something',
    text: 'Torvin steps back, lowers his sword and looks at you anew.\n“Now that’s starting to look like something.” He claps you on the shoulder so hard you nearly sit down in the snow. “Who taught you? Never mind, don’t answer: the past stays outside the gate.”\nThe recruits around have gone quiet: Torvin doesn’t often end up on the ground in the drill yard.',
    choices: ['Catch your breath'],
  },
  spar_torvin_win: {
    title: 'Not bad',
    text: 'Torvin lowers his sword and nods in approval.\n“Not bad. But don’t get cocky: in the forest the enemy won’t stop just because you’ve won.”',
    choices: ['Catch your breath'],
  },
  spar_torvin_lose: {
    title: 'Face in the snow',
    text: 'The world turns over, and you end up face down in the snow. Torvin stands over you, not even out of breath.\n“You wait for the blow, but you should wait for the wind-up. See how I draw my shoulder back? That’s when you cover yourself — and strike back.” He holds out a hand. “Again tomorrow.”',
    choices: ['Get up'],
  },
  routine_training: {
    title: 'Training',
    text: ({ hero, relation }) =>
      'Two hours of wooden swords, shouting elders and wet snow down your collar. ' +
      (hero.classId === 'rogue'
        ? 'You dodge more than you strike, and one of the elders grunts in approval.'
        : 'Your arms ache, but each blow lands a little surer.') +
      (relation('vasya') >= 1
        ? '\nVasya pairs up with you and honestly tries not to hit you in the face.'
        : ''),
    choices: ['Catch your breath'],
  },
  routine_kitchen: {
    title: 'Kitchen',
    text: 'For an hour and a half you peel turnips and haul water. The cook, red-faced and cross, still slips you a crust of bread at the end:\n“You earned it. Don’t tell the others.”',
    choices: ['Go back to the hall'],
  },
  routine_ash: {
    title: 'Ash',
    text: 'You scoop a handful of cold ash into a rag. An old tavern trick: throw it in someone’s eyes, and they go blind for a moment.',
    choices: ['Step away from the hearth'],
  },
  routine_brazier: {
    title: 'By the brazier',
    text: ({ flag, time }) =>
      'The sentries silently make room for you by the fire. The coals crackle, and warmth spreads through your hands.\n' +
      (flag('sawLights') && time.day === 2
        ? 'One of the sentries, noticing how you look at the forest, says quietly: “Don’t stare out there too long. Whoever looks gets seen.”'
        : (BRAZIER_RUMORS[time.day % BRAZIER_RUMORS.length] ?? '')),
    choices: ['Move on'],
  },
};
