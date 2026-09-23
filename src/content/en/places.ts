// Места крепости на английском: сцены из src/content/chapters/places.ts.
import type { SceneText } from './types';

export const places: Record<string, SceneText> = {
  gate_stanley: {
    title: 'Stanley',
    text: '“Ah, fresh meat,” Stanley looks up at you and snorts. “Settling in?”\nAt your question he shrugs.\n“At night the gate stays shut. We open it only for a patrol, and only on an elder’s word. Last week we opened it, mind — Torvin himself saw the lads off to the pass.” He turns away and adds more quietly: “I never let them back in.”',
    choices: ['Thank him and step away'],
  },
  gate_board: {
    title: 'Duty lists',
    text: ({ flag }) =>
      'Guards, chores, patrols — all written out in charcoal, day by day. A week ago: “Patrol to the pass — Erik, Martin.” Both names are crossed out, and below, in a different hand, small: “ran.”\n' +
      (flag('vasyaFriend')
        ? 'The very two Vasya talked about.'
        : 'Two recruits went out on patrol, and nobody here expects them back.'),
    choices: ['Step away from the board'],
  },

  barracks_note: {
    title: 'A scrap of paper',
    text: 'You tap the boards of the bunks, and one comes loose. Under it lies a folded scrap of paper. Drawn in charcoal: the wall, the corner tower and the forest, and written at the side: “third watch — three flashes.”\nYou tuck the find inside your coat.',
    choices: ['Step away from the bunks'],
  },
  barracks_nothing: {
    title: 'Nothing',
    text: 'You feel along the bare boards and look under the bunks — nothing, only dust and mouse droppings. If there was anything here, someone took it before you.',
    choices: ['Step away from the bunks'],
  },

  smithy_lantern: {
    title: 'A shuttered lantern',
    text: 'An iron lantern with thick glass and a moving shutter: pull the little lever and the light blinks. You would not need that to light a road. This is how signals are given.',
    choices: ['Put the lantern back'],
  },
  smith_talk: {
    title: 'Halvar',
    text: ({ flag }) =>
      flag('metSmith')
        ? 'Halvar puts down his hammer: “Well?”'
        : 'The broad-shouldered smith with a singed beard does not notice you at once. Then he puts down his hammer and wipes his hands on his leather apron.\n“New one? Halvar. Broke something — bring it. Need something — ask, but I won’t give everything.”',
    choices: [
      'Ask for a tool to open the chest in your cell',
      'Ask about the shuttered lantern on the workbench',
      'Have you been smithing for the watch long?',
      'What weapon would you advise?',
      'What was Erik like?',
      'Show him the note from the barracks',
      'Ask for a whetstone for your knife',
      'Nothing, I’ll be going',
    ],
  },
  smith_chisel: {
    title: 'Chisel',
    text: '“A rusty lock?” Halvar snorts. “Strength won’t do it; you need your head.” He picks a chisel out of the pile and weighs it in his hand. “You can have it. But first work the bellows for me, since you’re here.”',
    choices: ['Work the bellows'],
  },
  smith_chisel_done: {
    title: 'A deal',
    text: 'For half an hour you work the bellows until your shoulders ache. Halvar nods at the chisel:\n“Take it. Bring it back in the morning.”',
    choices: ['Take the chisel'],
  },
  smith_lantern: {
    title: 'An order',
    text: 'Halvar frowns and looks at the lantern longer than he needs to.\n“Erik brought it, a recruit. The day before he went out on patrol. Asked me to fix the shutter, and quickly.” He lowers his voice. “Why would a patrol at the pass need a lantern that blinks? You can’t make out the pass from the wall, but from the pass you can see the wall just fine. He never picked it up. And he won’t now.”',
    choices: ['I see'],
  },

  smith_whetstone: {
    title: 'Whetstone',
    text: 'Halvar rummages in a box under the workbench and hands you a grey stone worn down to a hollow in the middle.\n“Here. Wet it, draw from heel to point, don’t press. It’s a good knife — a shame if it stays blunt.”',
    choices: ['Thank you'],
  },
  gate_torch: {
    title: 'Torch',
    text: 'Stanley snorts, takes a spare torch off its bracket and shoves it into your hands.\n“Take it. There’s pitch enough for half the night. Just don’t set my walls on fire, fresh meat.”',
    choices: ['Step away'],
  },
  wall_rope: {
    title: 'Up the rope',
    text: 'The hook catches on a merlon at the second throw. The rope cuts into your palms, your boots slip on the icy stones, but a couple of minutes later you roll over the edge. Nobody up here — only the wind.',
    choices: ['Look around'],
  },
  wall_sneak: {
    title: 'Up',
    text: 'The sentry is nodding off. You slip past and, pressing yourself against the cold stone, climb the stairs. There is nobody at the top — only the wind.',
    choices: ['Look around'],
  },
  wall_caught: {
    title: 'Caught',
    text: 'On the third step the sentry grabs you by the collar: “Where do you think you’re going?!” A couple of minutes later Torvin is standing in front of you, and there is no smile on his face.\n“I told you: stay off the wall. I won’t tell you twice.”',
    choices: ['Lower your eyes'],
  },
  wall_signal: {
    title: 'An answering light',
    text: ({ flag }) =>
      'You peer into the darkness for a long time. The forest is silent. Then, on the corner tower to your left, a light flashes briefly — once, twice, three times. Far off by the pass, in the black wall of the forest, a small light blinks in answer.\n' +
      (flag('sawLantern')
        ? 'That is how a shuttered lantern blinks — like the one on the smith’s workbench. '
        : '') +
      (flag('foundNote')
        ? 'Three flashes. “Third watch — three flashes.”'
        : 'Someone in the fortress is signalling to the forest.'),
    choices: ['Step away from the battlements'],
  },
  wall_dark: {
    title: 'Darkness',
    text: 'The forest is black and quiet. The corner tower is silent. Only the wind whistles through the battlements.',
    choices: ['Step away from the battlements'],
  },
  wall_day: {
    title: 'The valley',
    text: 'By day the whole valley is visible from the wall: white forest, grey rocks, the dark cleft of the pass. Beautiful — and far too exposed. If they spot you, there will be a talk with Torvin.',
    choices: ['Step away from the battlements'],
  },
};
