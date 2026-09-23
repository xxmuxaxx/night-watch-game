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
      'At night I sneaked onto the wall and saw a lantern flash three times on the corner tower, and the forest answered. Someone in the fortress is giving signals.',
      'I told Torvin about the signal from the corner tower. He told me to forget it: “You weren’t there.”',
    ],
    hint: ({ flag }) =>
      flag('toldTorvinLights') || !flag('sawLights')
        ? ''
        : 'Tell Torvin? In the evenings he is in the mess hall, until 22:00',
  },
  missing: {
    title: 'The missing recruits',
    notes: [
      'Vasya told me: two of his group went out on night watch to the pass and never came back. The elders say they ran. But where would you run to out here?',
      'On the duty board by the gate: a week ago, a patrol to the pass — Erik and Martin. Both names are crossed out, and someone else added: “ran.”',
      'Stanley at the gate said the gate is opened at night only for a patrol, on an elder’s word. Torvin himself saw that patrol off, and nobody ever let them back in.',
      'Under a board of their bunk in the barracks lay a scrap of paper: the wall, the corner tower, the forest, and a note, “third watch — three flashes.”',
      'Vasya recognized the handwriting: Martin wrote the note.',
      'I showed the note to Torvin. His face went grey, and he told me to get rid of it.',
      'Halvar the smith: the day before the patrol, Erik brought in a shuttered lantern to be fixed — the kind used for signals. He never picked it up.',
      'Torvin admitted it: he saw them off as far as the old fir at the fork and told them to be back by dawn. He says they “ran” because it’s easier for everyone that way.',
      'I asked Torvin whether he really saw that patrol off. He admitted it through gritted teeth and told me to find something to do.',
    ],
    hint: ({ flag }) =>
      !flag('readBoard')
        ? 'Who goes on patrol is written on the duty board in the gate yard'
        : !flag('searchedBunks')
          ? 'Their bunks in the barracks must still be empty'
          : !flag('talkedStanley')
            ? 'Stanley in the guardhouse knows who was let out at night'
            : '',
  },
  knife: {
    title: 'The knife from the chest',
    notes: [
      'In the chest in my cell, under rotten rags, lay an old knife with a bone handle. Who lived here before me, and where did he go?',
      'I had to pry the rusty lock open with Halvar’s chisel.',
    ],
  },
};
