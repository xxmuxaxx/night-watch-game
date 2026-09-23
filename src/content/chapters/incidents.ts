// Мелкие происшествия: события с chance (src/content/events.ts), которые случаются по дороге
// или пока герой ждёт, каждое один раз. Большинство — просто жизнь крепости; следы у калитки и
// спор часовых добавляют по записи в зацепки.
import type { Scene } from '@/game/types';

const SMITH = 'img/portrait-smith.jpg';

export const incidents: Record<string, Scene> = {
  // --- Двор: драка новобранцев ---
  incident_brawl: {
    image: 'img/scene-brawl.jpg',
    title: 'Драка',
    text: 'У стены казармы двое новобранцев катаются в снегу, вцепившись друг другу в вороты. Вокруг уже собираются зеваки. Из-за чего драка, не разобрать — кажется, из-за пары сапог.',
    choices: [
      {
        text: 'Разнять их',
        minutes: 5,
        check: { stat: 'strength', difficulty: 2 },
        next: 'incident_brawl_stop',
        fail: 'incident_brawl_elbow',
      },
      { text: 'Пройти мимо', leave: true },
    ],
  },
  incident_brawl_stop: {
    image: 'img/scene-brawl.jpg',
    title: 'Разняли',
    text: 'Вы хватаете обоих за шиворот и растаскиваете в стороны. Драчуны ещё пыхтят, но уже больше для вида.\n— Да ладно, ладно, — бурчит один. — Забирай свои сапоги, подавись.\nСтаршие, кажется, ничего не заметили.',
    choices: [{ text: 'Отряхнуться', leave: true }],
  },
  incident_brawl_elbow: {
    image: 'img/scene-brawl.jpg',
    title: 'Локтем под рёбра',
    text: 'Вы лезете между ними и тут же получаете локтем под рёбра. Пока вы хватаете ртом воздух, драчунов растаскивает подоспевший старший и отвешивает каждому по подзатыльнику. Вам — заодно.',
    choices: [{ text: 'Отдышаться', leave: true }],
  },

  // --- Трапезная: кот с колбасой ---
  incident_cat: {
    // повар уже в кадре — без портрета
    image: 'img/scene-cat.jpg',
    title: 'Держи вора!',
    text: 'Из кухни с грохотом вылетает рыжий кот с колбасой в зубах. Следом — повар с половником:\n— Держи ворюгу!',
    choices: [
      {
        text: 'Поймать кота',
        check: { stat: 'agility', difficulty: 1, give: { items: ['bread'] } },
        next: 'incident_cat_caught',
        fail: 'incident_cat_gone',
      },
      { text: 'Посторониться', leave: true },
    ],
  },
  incident_cat_caught: {
    image: 'img/scene-kitchen.jpg',
    actor: 'img/portrait-cook.jpg',
    title: 'Есть!',
    text: 'Вы бросаетесь наперерез и в последний миг хватаете кота за шкирку. Колбаса шлёпается на пол. Повар, отдуваясь, забирает добычу и, подумав, отламывает вам горбушку:\n— Ловкий. Хоть кто-то тут на что-то годен.',
    choices: [{ text: 'Спрятать хлеб', leave: true }],
  },
  incident_cat_gone: {
    image: 'img/scene-kitchen.jpg',
    actor: 'img/portrait-cook.jpg',
    title: 'Ушёл',
    text: 'Кот проскальзывает у вас между ног и исчезает за дверью вместе с колбасой. Повар долго и витиевато ругается — похоже, и на вас тоже.',
    choices: [{ text: 'Сделать вид, что ни при чём', leave: true }],
  },

  // --- Двор у ворот: спор часовых ---
  incident_sentries: {
    image: 'img/scene-brazier.jpg',
    set: { heardWinterRumor: true },
    title: 'Спор у жаровни',
    text: 'У жаровни спорят двое часовых.\n— Говорю тебе, огни это были. На перевале.\n— Тебе всё огни. Прошлой зимой тоже были огни — а потом двое из дозора не вернулись. Забыл?\nЗаметив вас, оба замолкают.',
    choices: [
      {
        text: 'Сказать, что тоже видел огни',
        if: 'sawLights',
        minutes: 5,
        next: 'incident_sentries_lights',
      },
      { text: 'Отойти', leave: true },
    ],
  },
  incident_sentries_lights: {
    image: 'img/scene-brazier.jpg',
    title: 'Кто много видит',
    text: 'Часовые переглядываются. Старший сплёвывает в огонь.\n— Видел — и молчи. Кто много видит, тот недолго служит.',
    choices: [{ text: 'Отойти', leave: true }],
  },

  // --- Двор у ворот: следы у калитки ---
  incident_tracks: {
    image: 'img/scene-tracks.jpg',
    title: 'Следы',
    text: 'Ночью подсыпало снега, и двор ещё не затоптан. У калитки рядом с воротами тянется цепочка следов — одна пара сапог.',
    choices: [
      {
        text: 'Присмотреться к следам',
        minutes: 5,
        check: { stat: 'wits', difficulty: 2, set: { sawTracks: true } },
        next: 'incident_tracks_found',
        fail: 'incident_tracks_lost',
      },
      { text: 'Не обращать внимания', leave: true },
    ],
  },
  incident_tracks_found: {
    image: 'img/scene-tracks.jpg',
    title: 'От башни к калитке',
    text: 'Следы тянутся от угловой башни вдоль стены к калитке — и обратно. Кто-то ночью выходил за ворота и вернулся до рассвета. Шаг широкий, левый каблук стёрт набок.',
    choices: [{ text: 'Запомнить и отойти', leave: true }],
  },
  incident_tracks_lost: {
    image: 'img/scene-tracks.jpg',
    title: 'Затоптали',
    text: 'Пока вы присматриваетесь, через двор проходит смена караула, и следы превращаются в месиво.',
    choices: [{ text: 'Отойти', leave: true }],
  },

  // --- Келья: ворон у окна ---
  incident_raven: {
    image: 'img/scene-raven.jpg',
    title: 'Ворон',
    text: 'В слюду окна стучит клювом огромный ворон. Смотрит на вас одним глазом, склонив голову, будто чего-то ждёт. На лапе у него — обрывок красной нитки.',
    choices: [
      { text: 'Приоткрыть окно', next: 'incident_raven_open' },
      { text: 'Отогнать его', leave: true },
    ],
  },
  incident_raven_open: {
    image: 'img/scene-raven.jpg',
    title: 'К перевалу',
    text: 'Стоит вам приоткрыть створку, ворон тяжело взлетает и уходит к лесу, к перевалу. Чей-то посыльный? Здесь, где писем никто не пишет?',
    choices: [{ text: 'Закрыть окно', leave: true }],
  },

  // --- Кузница: раскалённая полоса ---
  incident_sparks: {
    // Хальвар уже в кадре — без портрета
    image: 'img/scene-sparks.jpg',
    title: 'Искры',
    text: 'Хальвар выхватывает из горна раскалённую полосу, клещи соскальзывают — и железо летит прямо в кучу промасленной ветоши.',
    choices: [
      {
        text: 'Сбить железо в бадью',
        check: { stat: 'agility', difficulty: 2, relation: { smith: 1 } },
        next: 'incident_sparks_saved',
        fail: 'incident_sparks_fire',
      },
      { text: 'Отскочить', next: 'incident_sparks_fire' },
    ],
  },
  incident_sparks_saved: {
    image: 'img/scene-smithy.jpg',
    actor: SMITH,
    title: 'Должок',
    text: 'Вы подхватываете полосу старыми клещами и швыряете в бадью. Вода взрывается паром. Хальвар долго смотрит на вас, потом кивает:\n— Спасибо. За мной должок.',
    choices: [{ text: 'Отойти от горна', leave: true }],
  },
  incident_sparks_fire: {
    image: 'img/scene-smithy.jpg',
    actor: SMITH,
    title: 'Дым',
    text: 'Ветошь вспыхивает. Хальвар накрывает её мокрой кожей, огонь шипит и гаснет, оставив чёрное пятно и едкий дым.\n— Бывает, — ворчит он. — Иди, иди, не стой в дыму.',
    choices: [{ text: 'Выйти на воздух', leave: true }],
  },
};
