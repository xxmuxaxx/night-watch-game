// Журнал на английском: src/content/journal.ts, записи в том же порядке. Пишется от лица героя.
import type { JournalId } from '@/content/journal';
import type { JournalText } from './types';

export const JOURNAL: Record<JournalId, JournalText> = {
  newLife: {
    title: 'A new life',
    notes: [
      'I was brought to the gate of a northern fortress. The past is behind me, and there is nowhere to run.',
      'At the gate a bully named Vasya picked on me. I knocked him down without even getting into a fight.',
      'At the gate a bully named Vasya picked on me. I talked him out of fighting — in front of the guards we would both have paid for it.',
      'The gate opened. Torvin, in charge of the recruits, told me that I am now a recruit of the Night Watch.',
    ],
    hint: 'Enter the fortress',
  },
  firstEvening: {
    title: 'The first evening',
    notes: [
      'I need to settle in: eat and find out where I will sleep. Supper is in the mess hall once it gets dark, and Torvin will show me where to sleep.',
      'Ate in the mess hall. Hid a crust of bread inside my coat — it will come in handy.',
      'Torvin showed me a cell right under the roof. Up at dawn.',
      'I missed supper, and my stomach keeps reminding me.',
    ],
    hint: 'The mess hall is across the courtyard, supper from 18:00',
  },
  alarm: {
    title: 'Alarm',
    notes: [
      'In the middle of the night a horn sounded three times from the wall. Everyone is running to the gate.',
      'Vasya calls me along: the main thing is to stay close and not fall behind.',
    ],
    hint: 'To the gate!',
  },

  lights: {
    title: 'Lights in the forest',
    notes: [
      'At night, from the window of my cell, I saw lights in the forest: a dozen at least. They moved towards the pass and went out one after another.',
      'By one of the lights a figure flickered in a dark cloak — exactly like Torvin’s. The watch?',
      'I couldn’t make out who carried them. All that remained was the feeling that someone in the forest was watching.',
      'I told Torvin about the lights. He grew grim and told me to keep quiet: “Not everything that walks in that forest is human. And not every human out there is an enemy.”',
      'Torvin brushed it off: I was seeing things, not used to it yet. But he turned away a little too quickly.',
    ],
    hint: ({ flag }) =>
      flag('toldTorvinLights')
        ? ''
        : 'Tell Torvin? In the evenings he is in the mess hall, until 22:00',
  },
  missing: {
    title: 'The missing recruits',
    notes: [
      'Vasya told me: two of his group went out on night watch to the pass and never came back. The elders say they ran. But where would you run to out here?',
    ],
  },
  knife: {
    title: 'The knife from the chest',
    notes: [
      'In the chest in my cell, under rotten rags, lay an old knife with a bone handle. Who lived here before me, and where did he go?',
    ],
  },
};
