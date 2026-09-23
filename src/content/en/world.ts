// Места и персонажи на английском: src/content/locations.ts и src/content/npcs.ts.
import type { LocationId } from '@/content/locations';
import type { NpcId } from '@/content/npcs';
import type { LocationText, NpcText } from './types';

export const LOCATIONS: Record<LocationId, LocationText> = {
  gate: {
    name: 'Before the gate',
    text: 'Trampled snow before the closed gate of the fortress.',
  },
  courtyard: {
    name: 'Inner courtyard',
    text: ({ time }) =>
      ({
        morning:
          'The recruits line up for the morning roll call. Elders in black cloaks shout out names, breath steaming from every mouth.',
        day: 'Wooden swords clack in the courtyard: the recruits drill while the elders shout at them. It smells of smoke and horse dung.',
        evening:
          'Training is over. The smell of stew drifts from the mess hall, and sentries warm themselves by the braziers.',
        night:
          'The courtyard is empty. Only the sentries walk the wall, the snow creaking under their boots.',
      })[time.period],
    locked: { cell: 'Torvin promised to show you where to sleep after supper' },
  },
  hall: {
    name: 'Mess hall',
    text: ({ time }) =>
      time.hour >= 6 && time.hour < 9
        ? 'The recruits gulp down their porridge in a hurry. The cook grumbles that someone has pinched the bread again.'
        : time.hour >= 18 && time.hour < 21
          ? 'The hall is full: spoons clatter, and the elders argue about something by the hearth.'
          : 'The long tables are empty. The cook bangs pots in the kitchen, and embers smoulder in the hearth.',
  },
  cell: {
    name: 'Cell',
    text: ({ time, flag }) =>
      'A tiny room right under the roof: a straw mattress, a wool blanket, a chest and a narrow window facing the forest.' +
      (flag('sawLights')
        ? ''
        : time.hour >= 21 || time.hour < 6
          ? '\nFar beyond the wall, between the trees, something seems to flicker.'
          : time.hour >= 18
            ? '\nDusk is gathering outside. Soon the forest will sink into darkness all the way to the pass.'
            : ''),
    actions: [
      'Look out of the window',
      'Look out of the window',
      'Look out of the window',
      'Open the rusty chest',
    ],
  },
};

export const NPCS: Record<NpcId, NpcText> = {
  torvin: {
    name: 'Torvin',
    talk: 'Talk to Torvin',
    about:
      'In charge of the recruits. His smile is good-natured, but he keeps a strict eye on the gate.',
  },
  vasya: {
    name: 'Vasya',
    talk: 'Talk to Vasya',
    about: ({ flag }) =>
      'A bully of a recruit, three weeks in the fortress. ' +
      (flag('talkedDownVasya')
        ? 'He met me at the gate with his fists, but I talked him out of it.'
        : 'He met me at the gate with his fists.') +
      (flag('vasyaFriend') ? ' We made peace over supper.' : ''),
  },
};
