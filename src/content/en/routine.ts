// Распорядок крепости на английском: занятия (ROUTINE) и сцены после них.
import type { RoutineId } from '@/content/chapters/routine';
import type { SceneText } from './types';

export const ROUTINE: Record<RoutineId, string> = {
  training: 'Train with the recruits (2 h, +5 XP)',
  brazier: 'Warm up by the brazier with the sentries (1 h, +2 health)',
  kitchen: 'Help the cook in the kitchen (1.5 h, food for your bag)',
  ash: 'Scoop up ash from the hearth (in a fight — into the enemy’s eyes)',
};

export const routine: Record<string, SceneText> = {
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
    text: ({ flag }) =>
      'The sentries silently make room for you by the fire. The coals crackle, and warmth spreads through your hands.\n' +
      (flag('sawLights')
        ? 'One of the sentries, noticing how you look at the forest, says quietly: “Don’t stare out there too long. Whoever looks gets seen.”'
        : 'Someone tells a tale about a bear that once wandered right up to the gate and left with the cook’s cauldron.'),
    choices: ['Move on'],
  },
};
