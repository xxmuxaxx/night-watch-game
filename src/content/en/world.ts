// Места и персонажи на английском: src/content/locations.ts и src/content/npcs.ts.
import { ROUTINE } from './routine';
import type { LocationId } from '@/content/locations';
import type { NpcId } from '@/content/npcs';
import type { LocationText, NpcText } from './types';

const SNEAK = 'Slip upstairs while the sentry dozes';

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
    locked: {
      cell: 'Torvin promised to show you where to sleep after supper',
      wall: 'Only the lookouts are allowed up there',
    },
    spots: {
      drill: {
        name: 'Drill ground',
        text: ({ time }) =>
          'A trampled patch by the barracks. On the rack stand shields and wooden swords hacked to splinters.' +
          (time.hour >= 8 && time.hour < 17
            ? ' Recruits spar in pairs while the elders shout at them.'
            : ' It is empty now; only the wind chases the snow.'),
        actions: [
          ROUTINE.training,
          ROUTINE.sparRecruit,
          ROUTINE.sparVasya,
          ROUTINE.sparTorvinFirst,
          ROUTINE.sparTorvin,
          'Clean the shields and practice swords (1 h, duty)',
        ],
      },
      stairs: {
        name: 'Stairs to the wall',
        text: ({ time }) =>
          'A steep stone staircase leads up to the wall. ' +
          (time.hour >= 21 || time.hour < 6
            ? 'The sentry at its foot is nodding off, slumped against the wall and hugging his spear.'
            : 'At its foot a sentry shifts from foot to foot and eyes you.'),
        actions: [
          { text: 'Climb the wall', disabled: 'Only the lookouts are allowed up there' },
          SNEAK,
        ],
      },
    },
  },
  gateyard: {
    name: 'Gate yard',
    text: ({ time }) =>
      time.hour >= 6 && time.hour < 21
        ? 'A cramped yard between the gate and the barracks. Guards idle under the gate arch, and horses snort at the hitching post.'
        : 'The gate is shut with a heavy bar. A torch smokes under the arch; in the guardhouse dice rattle and someone swears under his breath.',
    spots: {
      guardhouse: {
        name: 'Guardhouse',
        text: 'A low door beside the gate arch. On a bench by the winch sits Stanley, the one who opened the gate for you.',
        actions: [
          'Ask Stanley whether the gate is ever opened at night',
          'Stand a watch at the gate with Stanley (2 h, duty)',
        ],
      },
      board: {
        name: 'Duty board',
        text: 'A darkened board under a lean-to. Sheets are nailed to it: who stands guard when, who goes on watch to the pass.',
        actions: ['Read the duty lists', 'Find out your duty for today'],
      },
      brazier: {
        name: 'Brazier by the gate',
        text: 'An iron brazier under a lean-to by the gate. In the evenings the sentries warm themselves beside it.',
      },
    },
  },
  hall: {
    name: 'Mess hall',
    text: ({ time }) =>
      time.hour >= 6 && time.hour < 9
        ? 'The recruits gulp down their porridge in a hurry. The cook grumbles that someone has pinched the bread again.'
        : time.hour >= 18 && time.hour < 21
          ? 'The hall is full: spoons clatter, and the elders argue about something by the hearth.'
          : 'The long tables are empty. The cook bangs pots in the kitchen, and embers smoulder in the hearth.',
    spots: {
      kitchen: {
        name: 'Kitchen',
        text: 'Behind the partition: cauldrons, sacks of turnips and a cook red from the heat.',
        actions: [ROUTINE.kitchen, 'Chop firewood for the kitchen (1 h, duty)'],
      },
      hearth: {
        name: 'Hearth',
        text: 'A big hearth at the far end of the hall. Under the grate lies a thick layer of ash.',
      },
    },
  },
  barracks: {
    name: 'Barracks',
    text: ({ time }) =>
      (time.hour >= 21 || time.hour < 6
        ? 'A long dark hut. Snoring, the smell of wet wool and smoke; someone mutters in his sleep.'
        : 'A long hut with two rows of bunks. By day it is empty: everyone is at drill or at work.') +
      ' The new one was not placed here: Torvin put you apart, in the cell.',
    spots: {
      vasyaBunk: {
        name: 'Vasya’s bunk',
        text: ({ relation }) =>
          'The bunk right by the stove, the best spot, and Vasya is clearly proud of it. A rolled-up jacket lies at the head, a wooden spoon on top.' +
          (relation('vasya') >= 1 ? ' Vasya said to drop by any time.' : ''),
        actions: ['Sweep the barracks and shake out the mattresses (1 h, duty)'],
      },
      emptyBunks: {
        name: 'Empty bunks',
        text: ({ flag }) =>
          'In the far corner two bunks stand bare: no straw, no blankets. ' +
          (flag('vasyaFriend') || flag('readBoard')
            ? 'This must be where the two who never came back from the pass slept.'
            : 'As if the owners moved out in a hurry — or someone took their things.'),
        actions: ['Search the bunks'],
      },
    },
  },
  smithy: {
    name: 'Smithy',
    text: ({ time }) =>
      time.hour >= 7 && time.hour < 22
        ? 'The heat of the forge hits your face from the doorway. A hammer rings, water hisses in the tub.'
        : 'The forge has burned down to crimson embers. The smith is gone; only cooling metal ticks quietly.',
    spots: {
      bench: {
        name: 'Workbench',
        text: 'Tongs, chisels, files, scraps of iron. An unfinished lantern lies at the edge.',
        actions: ['Examine the lantern', 'Haul coal for Halvar (1.5 h, duty)'],
      },
    },
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
    spots: {
      window: {
        name: 'Window',
        text: 'A narrow window glazed with cloudy mica. Beyond it lie the wall and the forest all the way to the pass.',
        actions: ['Look out of the window', 'Look out of the window', 'Look out of the window'],
      },
      chest: {
        name: 'Chest',
        text: ({ flag }) =>
          flag('foundKnife')
            ? 'The chest is open. Nothing is left in it but rotten rags.'
            : flag('triedChest')
              ? 'The rusty lock holds fast. You cannot pry it open without a tool.'
              : 'An old iron-bound chest. The lock is covered with red rust.',
        actions: ['Open the rusty chest', 'Pry the lock open with the chisel'],
      },
    },
  },
  wall: {
    name: 'Wall',
    text: ({ time }) =>
      time.hour >= 21 || time.hour < 6
        ? 'The wind on the wall nearly knocks you down. Below, the fortress sleeps; ahead lies the black forest all the way to the pass. The sentry on the far tower is looking the other way.'
        : 'A grey day, wind and snow. From here you can see the whole valley up to the pass — and everyone can see you.',
    spots: {
      lookout: {
        name: 'Lookout platform',
        text: 'A jutting stretch of battlements. From here the forest is visible much farther than from the cell window — all the way to the pass. To the left looms the corner tower.',
        actions: ['Watch the pass', 'Watch the pass', 'Watch the pass'],
      },
      horn: {
        name: 'Watch horn',
        text: 'A huge copper-bound horn on an iron stand. Three blasts mean a general muster: so they explained at drill.',
      },
    },
  },
};

export const NPCS: Record<NpcId, NpcText> = {
  torvin: {
    name: 'Torvin',
    talk: 'Talk to Torvin',
    about: ({ flag }) =>
      'In charge of the recruits. His smile is good-natured, but he keeps a strict eye on the gate.' +
      (flag('beatTorvin') ? ' On the drill yard I managed to beat him — he seemed pleased.' : ''),
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
  smith: {
    name: 'Halvar',
    talk: 'Talk to the smith',
    about:
      'The smith. His hands are covered in old burns, his beard singed. He says little but notices everything — and seems to know more than he says.',
  },
};
