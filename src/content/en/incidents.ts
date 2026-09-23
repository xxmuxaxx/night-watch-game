// Мелкие происшествия на английском: сцены из src/content/chapters/incidents.ts.
import type { SceneText } from './types';

export const incidents: Record<string, SceneText> = {
  incident_brawl: {
    title: 'A brawl',
    text: 'By the barracks wall two recruits are rolling in the snow, clutching each other’s collars. Onlookers are already gathering. What the fight is about is hard to tell — a pair of boots, it seems.',
    choices: ['Pull them apart', 'Walk past'],
  },
  incident_brawl_stop: {
    title: 'Broken up',
    text: 'You grab both by the scruff and drag them apart. The brawlers are still huffing, but mostly for show now.\n“All right, all right,” one grumbles. “Take your boots and choke on them.”\nThe elders don’t seem to have noticed a thing.',
    choices: ['Dust yourself off'],
  },
  incident_brawl_elbow: {
    title: 'An elbow in the ribs',
    text: 'You get between them and at once take an elbow in the ribs. While you gasp for air, an elder arrives, drags the brawlers apart and gives each a clip round the ear. You get one too, for good measure.',
    choices: ['Catch your breath'],
  },

  incident_cat: {
    title: 'Stop, thief!',
    text: 'A ginger cat bursts out of the kitchen with a clatter, a sausage in its teeth. Behind it comes the cook with a ladle:\n“Catch that thief!”',
    choices: ['Catch the cat', 'Step aside'],
  },
  incident_cat_caught: {
    title: 'Got him',
    text: 'You throw yourself in its path and at the last moment grab the cat by the scruff. The sausage slaps onto the floor. The cook, puffing, takes back the spoils and, after a moment’s thought, breaks off a heel of bread for you:\n“Quick one. At least somebody here is good for something.”',
    choices: ['Hide the bread'],
  },
  incident_cat_gone: {
    title: 'Gone',
    text: 'The cat slips between your legs and vanishes out of the door, sausage and all. The cook swears long and elaborately — at you as well, it seems.',
    choices: ['Pretend it wasn’t you'],
  },

  incident_sentries: {
    title: 'An argument by the brazier',
    text: 'Two sentries are arguing by the brazier.\n“I’m telling you, those were lights. At the pass.”\n“You and your lights. Last winter there were lights too — and then two from the patrol never came back. Forgotten?”\nNoticing you, both fall silent.',
    choices: ['Say you saw the lights too', 'Step away'],
  },
  incident_sentries_lights: {
    title: 'Whoever sees too much',
    text: 'The sentries exchange glances. The older one spits into the fire.\n“You saw — so keep quiet. Whoever sees too much doesn’t serve for long.”',
    choices: ['Step away'],
  },

  incident_tracks: {
    title: 'Tracks',
    text: 'Fresh snow fell in the night, and the yard hasn’t been trampled yet. By the wicket next to the gate runs a line of tracks — a single pair of boots.',
    choices: ['Look at the tracks closely', 'Pay no attention'],
  },
  incident_tracks_found: {
    title: 'From the tower to the wicket',
    text: 'The tracks run from the corner tower along the wall to the wicket — and back. Someone went out through the gate at night and returned before dawn. A long stride, the left heel worn down at the side.',
    choices: ['Remember it and step away'],
  },
  incident_tracks_lost: {
    title: 'Trampled',
    text: 'While you are looking, the changing guard crosses the yard, and the tracks turn into slush.',
    choices: ['Step away'],
  },

  incident_raven: {
    title: 'A raven',
    text: 'A huge raven is tapping its beak against the window’s mica. It looks at you with one eye, head cocked, as if waiting for something. On its leg is a scrap of red thread.',
    choices: ['Open the window a crack', 'Shoo it away'],
  },
  incident_raven_open: {
    title: 'Towards the pass',
    text: 'The moment you open the casement, the raven heavily takes off and flies towards the forest, towards the pass. Someone’s messenger? Here, where nobody writes letters?',
    choices: ['Close the window'],
  },

  incident_sparks: {
    title: 'Sparks',
    text: 'Halvar pulls a red-hot bar from the forge, the tongs slip — and the iron flies straight into a heap of oily rags.',
    choices: ['Knock the iron into the tub', 'Jump back'],
  },
  incident_sparks_saved: {
    title: 'I owe you',
    text: 'You catch the bar with an old pair of tongs and fling it into the tub. The water explodes into steam. Halvar looks at you for a long moment, then nods:\n“Thank you. I owe you one.”',
    choices: ['Step away from the forge'],
  },
  incident_sparks_fire: {
    title: 'Smoke',
    text: 'The rags flare up. Halvar smothers them with a wet hide; the fire hisses and dies, leaving a black patch and acrid smoke.\n“It happens,” he grumbles. “Go on, go on, don’t stand in the smoke.”',
    choices: ['Go out for some air'],
  },
};
