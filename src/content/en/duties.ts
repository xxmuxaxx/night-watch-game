// Наряды на английском: сцены из src/content/chapters/duties.ts.
import type { SceneText } from './types';

/** Сцена у доски: что написано против имени героя. */
function board(task: string): SceneText {
  return {
    title: 'Duty',
    text:
      'You find your name on the board. Next to it, in charcoal: “' +
      task +
      '.”\nBelow, in Torvin’s hand: “Not done by nightfall — I’ll ask.”',
    choices: ['Step away from the board'],
  };
}

export const duties: Record<string, SceneText> = {
  duty_firewood: board('Firewood for the kitchen'),
  duty_smithy: board('Smithy — help Halvar'),
  duty_weapons: board('Drill ground: shields and practice swords'),
  duty_barracks: board('Barracks: sweep and shake out'),
  duty_gate: board('Watch at the gate with Stanley'),
  duty_none: {
    title: 'Duty',
    text: 'Next to your name there is nothing today. It seems you have already done all the work there was.',
    choices: ['Step away from the board'],
  },

  duty_firewood_done: {
    title: 'Firewood',
    text: 'For an hour you split logs in the kitchen’s back yard and carry armfuls to the hearth until you can no longer feel your back. The cook eyes the woodpile critically and grunts:\n“It’ll do. Here, you’ve earned it.”\nHe shoves a crust of bread at you.',
    choices: ['Go back to the hall'],
  },
  duty_smithy_done: {
    title: 'Coal',
    text: ({ flag }) =>
      (flag('metSmith')
        ? 'For an hour and a half'
        : 'The smith grunts that his name is Halvar and sets you to hauling coal. For an hour and a half') +
      ' you carry baskets from the shed to the forge until your face is as black as a chimney sweep’s. Halvar nods silently — from him that seems to be high praise.\n“Come again. Your hands are in the right place.”',
    choices: ['Wipe your face'],
  },
  duty_weapons_done: {
    title: 'Shields and swords',
    text: 'For an hour you scrape mud and rust off the bosses, tighten the straps and sand down the hacked practice swords. Torvin, passing by, picks up a shield, turns it over critically and claps you on the shoulder in approval.',
    choices: ['Catch your breath'],
  },
  duty_barracks_done: {
    title: 'Barracks',
    text: ({ relation }) =>
      'For an hour you sweep the earthen floor, carry the ash out of the stove and shake the mattresses out in the snow. Dust rises in clouds, mice scatter into the corners.\nUnder the far bunks your broom catches on something heavy: a coil of strong rope with an iron hook. Who in the barracks needed a hook? You take the find.' +
      (relation('vasya') >= 1
        ? '\nVasya, looking in for a minute, whistles: “Look at that, clean as the elders’ quarters!”'
        : ''),
    choices: ['Dust yourself off'],
  },
  duty_gate_done: {
    title: 'Watch at the gate',
    text: ({ flag }) =>
      'For two hours you stand with Stanley under the gate arch, stamping against the cold. He turns out to be a decent storyteller: about the bear that once carried off the cook’s cauldron, about the merchants who used to come over the pass before the road was buried.\n' +
      (flag('talkedStanley')
        ? '“And don’t ask about those two,” he says at the end, not looking at you. “I’ve said my piece.”'
        : '“It’s duller here at night,” he yawns. “We open only for a patrol, on an elder’s word. Otherwise you sit and listen to the forest.”') +
      '\nAs you part, he shoves a dented flask at you: “It’ll warm you up. They’ll pour me more.”',
    choices: ['Hand over the watch'],
  },
};
