// Глава 1 на английском: сцены из src/content/chapters/chapter1.ts в том же порядке.
import type { SceneText } from './types';

export const chapter1: Record<string, SceneText> = {
  // --- Пролог ---
  st0: {
    title: 'So this is it...',
    text: 'Your life will soon be over. And a new one will begin...',
    choices: ['Walk up to the gate', 'Try to run'],
  },
  st1: {
    title: 'The guard at the gate looks you over',
    text: 'Guard: Fresh meat?! Open the gate, Stanley!',
    choices: ['Wait...'],
  },
  st1_1: {
    title: 'You bolt headlong for the forest',
    text: 'Clearly not the best choice. The archers on the walls earn their keep for a reason. Three arrows pierce you, and you fall to your knees. Your sight goes dark as the spirit leaves your body...',
    choices: ['Game over'],
  },

  st2: {
    title: 'An aggressive young man walks up to you...',
    text: '“Hey, what are you standing here for?”\n“Huh? What?”\n“Why, you little rat! You’re going to get it now!”',
    choices: [
      'Get ready to fight',
      'Duck under his arm and knock him down',
      'Talk your way out of it',
    ],
  },
  st2_2: {
    title: 'That didn’t work',
    text: '“Look, we’re all new here, let’s not…” you begin.\n“A smart one, eh?!” Vasya turns even redder. “I’ll smarten you up!”',
    choices: ['Fight'],
  },
  st3_talk: {
    title: 'No fight',
    text: '“Listen,” you say quietly, “if they throw us both in the cells on the first day, who gains from it? The guards on the wall are just waiting for that.”\nVasya glances at the wall, where a crowd of onlookers really has gathered, and reluctantly lowers his fists.\n“Fine… Lucky you, new boy.” He spits into the snow, but there is less anger in his voice now.\nThe gate creaks open.',
    choices: ['Head for the gate', 'Seize the moment and run for the forest'],
  },
  st2_1: {
    title: 'That didn’t work',
    text: 'You try to duck under his arm, but Vasya is quicker and shoves you into a snowdrift.\n“Oh, that’s how it is?! Brace yourself!”',
    choices: ['Fight'],
  },
  st3: {
    title: 'The young man tumbles to the ground',
    text: ({ flag }) =>
      (flag('trippedVasya')
        ? 'One quick move, and Vasya is already floundering in the snow, never quite sure what happened.'
        : 'You gave a good account of yourself in that fight.') +
      ' The guards on the wall grunt in approval: it seems people here respect those who can stand up for themselves. The gate creaks open.',
    choices: ['Head for the gate', 'Use the commotion and run for the forest'],
  },
  st4: {
    title: 'You pass through the gate into the inner courtyard.',
    text: 'A man of thirty or thirty-five in a black cloak walks up to you and asks with a good-natured smile: “Hello! What’s your name?”',
    choices: [({ hero }) => 'My name is ' + hero.name],
  },

  // --- Торвин ---
  st5: {
    title: 'Welcome to the Night Watch',
    text: ({ hero, flag }) =>
      '“' +
      hero.name +
      ', then. And I’m Torvin, in charge of the recruits.”\n' +
      (flag('talkedDownVasya')
        ? 'He nods towards the gate, where Vasya is arguing hotly with the guards.\n“I saw you talk our bully down. You’ve got a quick tongue.'
        : 'He nods towards the gate, where the guards are picking Vasya up off the ground.\n“I see you’ve already met the locals.') +
      ' Nobody here asks why you were brought: the past stays outside the gate. From today you’re a recruit of the Night Watch.”',
    choices: ['What is this place?', 'And if I don’t want to serve?', 'Where should I go?'],
  },
  torvin_talk: {
    title: 'Torvin',
    text: ({ hero, relation }) =>
      relation('torvin') >= 1
        ? 'Torvin smiles: “Anything else, ' + hero.name + '?”'
        : relation('torvin') <= -1
          ? 'Torvin looks at you without a smile: “What do you want?”'
          : '“Anything else, ' + hero.name + '?”',
    choices: [
      'What is this place?',
      'What do the recruits do here?',
      'Have you been here long?',
      'What do you make of Vasya?',
      'And if I don’t want to serve?',
      'Where do I eat and sleep?',
      'They say the nights on the wall are cold. Could you spare something warm?',
      'Tell him about the lights in the forest',
      'Tell him about the lights in the forest',
      'Ask about Erik and Martin',
      'Ask about Erik and Martin',
      'Stanley says you saw them off to the pass yourself',
      'Stanley says you saw them off to the pass yourself',
      'Show him the note from the barracks',
      'Tell him about the light on the corner tower',
      'Nothing, I’ll be going',
    ],
  },
  st5_1: {
    title: 'The edge of the world',
    text: '“The Northern March. The last fortress before the pass. Beyond it there’s only forest and mountains, and no kings at all.”\nTorvin looks at the dark strip of forest beyond the wall.\n“By day it’s quiet out there. But at night… at night you’ll see for yourself. That’s why the watch has stood here for three hundred years.”',
    choices: ['I see'],
  },
  st5_2: {
    title: 'A choice without a choice',
    text: '“The gate here only opens inwards,” Torvin smirks, without malice. “You’ve seen the archers on the wall.”\nHe claps you on the shoulder.\n“But don’t be quick to call us jailers. You’ll eat your fill here and sleep under a roof. Plenty of people where they came from couldn’t hope for even that.”',
    choices: ['I see'],
  },
  st5_3: {
    title: 'How things are done',
    text: '“Supper’s in the mess hall once it gets dark,” Torvin nods at a long building with a smoking chimney. “Come along, and after supper I’ll show you where you’ll sleep. Look around for now, just keep off the wall: only the lookouts go up there.”',
    choices: ['Look around'],
  },
  torvin_jacket: {
    title: 'Padded jacket',
    text: 'Torvin grunts, walks off and comes back with an old padded jacket: worn and patched, but thick and warm.\n“Wear it. It won’t stop an arrow, but it’ll do against a fist and the cold.”',
    choices: ['Thank you'],
  },
  torvin_lights_trust: {
    title: 'Not everything that walks in the forest',
    text: 'The smile leaves Torvin’s face. He glances around and lowers his voice.\n“So you saw them. Not everything that walks in that forest is human. And not every human out there is an enemy. Don’t tell anyone else about this, especially the elders. Understood?”',
    choices: ['Understood'],
  },
  torvin_lights_cold: {
    title: 'Seeing things',
    text: '“Lights?” Torvin shrugs. “You’re seeing things, not used to it yet: snow, moon, tiredness. Off to bed with you, recruit.”\nHe turns away a little too quickly.',
    choices: ['All right'],
  },
  torvin_late: {
    title: 'Torvin found you',
    text: '“There you are,” Torvin shakes his head. “You missed supper, the cook has already cleared everything away. Well, come on, I’ll show you where you’ll sleep. Don’t oversleep in the morning.”',
    choices: ['Follow Torvin'],
  },

  // --- Вася ---
  vasya_talk: {
    title: 'Vasya',
    text: ({ relation }) =>
      relation('vasya') >= 1
        ? '“Oh, new boy!” Vasya waves to you. “Stick close, the main thing here is not to fall behind.”'
        : relation('vasya') <= -1
          ? 'Vasya pointedly turns away, rubbing his swollen lip.\n“What do you want?”'
          : 'Vasya eyes you sullenly, rubbing his swollen lip.\n“Well?”',
    choices: [
      'Apologize for the fight at the gate',
      'Where are you from?',
      'How does a new boy survive here?',
      'Tell me about Erik and Martin',
      'What sort of man is this Halvar?',
      'Show him the note from the barracks',
      'Nothing, see you',
    ],
  },
  vasya_sorry: {
    title: 'No hard feelings',
    text: ({ flag }) =>
      'Vasya blinks in surprise, then snorts.\n“Oh, forget it, I started it. ' +
      (flag('trippedVasya')
        ? 'Just show me that trip later, deal? I never figured out how you did it.”'
        : 'You’ve got a heavy hand, I’ll tell you that.”'),
    choices: ['Deal'],
  },

  // --- Вечер ---
  st6: {
    title: 'Mess hall',
    text: ({ flag }) =>
      'In the long hall with its low, sooty ceiling, supper is already under way. Rough tables line the walls, and a fire crackles at the far end. It smells of smoke, wet wool and stew.\nTorvin spots you from the far table and nods in approval: “Right on time. Eat before it gets cold. Then I’ll show you where you’ll sleep.”' +
      (flag('askedToLeave')
        ? '\nHis wary gaze lingers on you, as if he were weighing whether he will have to catch you at the gate tonight.'
        : ''),
    choices: ['Sit by the hearth and eat', 'Refuse the food and ask to be shown where to sleep'],
  },
  st6_1: {
    title: 'An old acquaintance',
    text: 'Hot stew and the warmth of the hearth bring your strength back. You tuck a crust of bread inside your coat: it will come in handy.\nA bowl clatters down opposite you. It’s Vasya: his lip is swollen, but there seems to be no malice in his eyes.\n“Hey… no hard feelings, all right? Every new one goes through that here. I’ve been here three weeks.”',
    choices: ['Shake his hand', 'Finish eating in silence and leave'],
  },
  st6_2: {
    title: 'Rumors',
    text: 'Vasya shakes your hand firmly and leans closer.\n“Since we’re on the same side now, I’ll tell you. Five of us were brought in together. Last week two went out on night watch to the pass and never came back. The elders say they ran. But where would you run to out here?”\nHe glances at the table where Torvin sits and falls silent.',
    choices: ['Follow Torvin'],
  },

  // --- Келья ---
  st7: {
    title: 'Cell',
    text: ({ flag }) =>
      'Torvin leads you up a narrow staircase to a tiny room right under the roof: a straw mattress, a wool blanket, a chest and a narrow window facing the forest.\n“Up at dawn. Don’t be late,” he says and closes the door behind him.\n' +
      (flag('ate')
        ? 'After the hot stew you grow drowsy, and your eyes close on their own.'
        : 'Your stomach cramps with hunger. You shouldn’t have turned down the stew: falling asleep won’t be easy now.'),
    choices: ['Look around'],
  },
  window_day: {
    title: 'The view from the window',
    text: 'Beyond the wall a snowy forest stretches all the way to the pass. Crows circle above the tops of the firs. Nothing unusual — for now.',
    choices: ['Step away from the window'],
  },
  window_night: {
    title: 'The forest at night',
    text: 'The forest is drowning in darkness. The lights are gone, but you still can’t tear your eyes from the pass for a long time.',
    choices: ['Step away from the window'],
  },
  st7_1: {
    title: 'Lights in the forest',
    text: 'The forest darkens beyond the wall. At first it looks like torchlight reflected on the snow. But the lights move slowly between the trees, a dozen at least, and all of them head for the pass.\nOne after another, they go out.',
    choices: ['Look closer at the lights', 'Step away from the window'],
  },

  st7_2: {
    title: 'A find',
    text: 'The lid gives on the third heave. Under rotten rags lies an old knife with a bone handle. Someone lived here before you.\nYou tuck the knife into your belt.',
    choices: ['Step away from the chest'],
  },
  st7_3: {
    title: 'A rusty lock',
    text: 'You tug at the lid until your fingers ache, but the rusty lock holds fast. Maybe in the morning you’ll find something to pry it with.',
    choices: ['Step away from the chest'],
  },

  st7_4: {
    title: 'Dark cloaks',
    text: 'You peer into the darkness. By one of the lights a figure in a dark cloak flickers for a moment, exactly like Torvin’s.\nPeople. The watch? The light goes out, and the figure vanishes with it.',
    choices: ['Step away from the window'],
  },
  st7_5: {
    title: 'Snow and darkness',
    text: 'However hard you peer, the snow and darkness hide everything. All that remains is the unpleasant feeling that someone out there, in the forest, is watching you.',
    choices: ['Step away from the window'],
  },

  // --- Ночь ---
  st8: {
    title: 'Three blasts',
    text: ({ flag, location }) => {
      const inCell = location === 'cell';
      return (
        (inCell
          ? 'You are woken by the long call of a horn from the wall.'
          : 'The long call of a horn rings out over the fortress.') +
        ' Once. Twice. Three times.\nDoors bang, iron clatters, someone shouts: “To the gate!”\n' +
        (flag('vasyaFriend')
          ? inCell
            ? 'A fist pounds on the door. “Get up, new boy! To the gate, quick!” It’s Vasya.\n'
            : 'Vasya runs past: “New boy! What are you standing there for? To the gate, quick!”\n'
          : inCell
            ? 'Nobody comes for you: it seems they simply forgot about the new one.\n'
            : 'People run past, and nobody pays you any attention.\n') +
        (flag('sawCloaks')
          ? 'Again you see the figure in the dark cloak by the dying light. The alarm was raised for a reason.'
          : flag('sawLights')
            ? 'You remember the lights going out by the pass and understand: the alarm was raised for a reason.'
            : 'It seems the night Torvin spoke of has come sooner than you thought.') +
        (flag('torvinWarned')
          ? '\nTorvin’s words ring in your ears: “Not everything that walks in that forest is human.”'
          : '') +
        (flag('sawSignal')
          ? '\nYou remember the light on the corner tower: three flashes — and the forest answered.'
          : flag('foundNote')
            ? '\nThree blasts… “Third watch — three flashes,” you remember the scrap of paper from the barracks.'
            : '') +
        (flag('foundKnife')
          ? '\nYou feel for the old knife in your belt. Somehow it’s calmer with it.'
          : '')
      );
    },
    choices: ['Run to the gate with Vasya', 'Run to the gate alone'],
  },
  st9: {
    title: 'The end of chapter one',
    text: ({ flag }) =>
      (flag('vasyaFriend')
        ? 'You and Vasya join the stream of people with torches. “Stay close,” he tosses over his shoulder. “The main thing is not to fall behind.”'
        : 'You join the stream of people with torches. Nobody looks at you, nobody tells you where to stand.') +
      '\n\nTo be continued…',
    choices: [],
  },
};
