# Промпты для картинок

Промпты на английском: модель понимает его лучше русского.

## Как генерируются картинки

Картинки генерирует Claude через API локального ComfyUI скриптом `tools/comfy.py`; от автора
нужно только запустить ComfyUI (Comfy Desktop, порт 8188) с моделями из графа. Граф —
`tools/comfy-graph.json`, экспорт в API-формате: Krea 2 turbo (`krea2_turbo_fp8_scaled`),
текстовый энкодер Qwen3-VL 4B, VAE `qwen_image_vae`, 8 шагов, euler / simple, cfg 1, без LoRA.

```bash
python tools/comfy.py portrait-recruit             # три варианта (seed 101, 202, 303) и лист для сравнения
python tools/comfy.py portrait-recruit --pick 202  # выбранный — в public/img/portrait-recruit.jpg
```

Скрипт берёт промпт из этого файла по имени картинки (первый блок кода после заголовка с
`` `имя.jpg` ``), добавляет **общий стиль** в конец, а портрету без своей компоновки — общее
начало из раздела «Портреты». Варианты и лист складываются в `img-source/candidates/` (в гит не
попадает). Игре нужны только JPG в `public/img/`: сцены 1344×768, фон 1536×768, портреты
уменьшаются до 512×512; оригиналы не хранятся.

Как писать промпт для этой модели:

- **Связными фразами, а не списком тегов.** Текст читает языковая модель (Qwen3-VL): важное —
  в начале и отдельным предложением («He grins widely…»), тогда оно не теряется.
- **Всё нужное — в позитивном промпте.** При cfg 1 негативный промпт не действует, поэтому не
  «no steel», а «a crude wooden training sword, plain pale wood, no metal at all».
- **Без противоречий.** Не смешивай общий фон портретов со своим («snowy drill yard behind»):
  модель выберет одно из двух. Если нужен другой фон, напиши компоновку портрета целиком сам,
  начав с «Head and shoulders portrait», — тогда общее начало не добавляется.
- **Слова тянут за собой образ.** «Sword» модель рисует стальным, даже если рядом написано
  «wooden»; учебное оружие вышло только как «thick brown wooden sticks». Гербовые накидки
  появляются, если не сказать «plain jackets with no emblems». Если деталь не выходит, опиши
  предмет другими словами, а не повторяй запрет.
- LoRA не нужна: она меняет стиль, а не послушность, и новая картинка выбьется из набора.

## Общий стиль

```
dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Общий негатив

Вписан в граф; при cfg 1 почти не влияет, но пригодится, если граф сменится на модель с cfg выше 1.

```
text, watermark, logo, signature, frame, border, blurry, lowres, jpeg artifacts, deformed, extra fingers, extra limbs, modern clothing, giant ice wall, glacier wall, photograph of a celebrity
```

Отдельно просим «без гигантской ледяной стены»: это самый узнаваемый образ сериала.
Вместо неё — каменная крепость в заснеженных горах на северной границе. Раз негатив не действует,
в самих промптах крепость всегда каменная.

---

## Фон страницы — `background.jpg` (2:1, например 1536×768)

Лежит за игровым окном, поэтому картинка тёмная и спокойная, без мелких деталей в центре.

```
vast snowy mountain valley at night, a lonely stone border fortress with a few lit windows far in the distance on a cliff, dark pine forests, heavy falling snow, flock of crows in a stormy sky, calm and empty composition, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Вот и всё..» (st0) — `scene-arrival.jpg` (16:9, 1344×768)

Героя под охраной привозят к воротам крепости. Жизнь заканчивается, начинается служба.

```
a condemned young man with bound hands walking through deep snow, seen from behind, escorted by two armed riders in dark cloaks on horseback, approaching the massive wooden gate of a grim dark stone fortress built into a snowy mountainside, wooden watchtowers, overcast dusk, light snowfall, sense of doom and a new beginning, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Стражник у ворот» (st1) — `scene-gate-guard.jpg` (16:9)

Стражник: «Свежее мясо?! Открывай ворота, Стенли!»

```
a grizzled middle-aged gate guard in worn black scale armor and a fur-trimmed cloak leaning over the stone parapet above a fortress gate, looking down at the viewer with a mocking grin, holding a crossbow, low angle view, another guard pulling a gate winch in the background, snow on the stones, torchlight, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Побег» (st1_1, смерть) — `scene-death.jpg` (16:9)

Герой бежит к лесу, лучники со стен стреляют ему в спину.

```
a man in ragged clothes falling to his knees in the snow at the edge of a dark pine forest, three arrows in his back, seen from behind, blurred archers on the distant fortress walls behind him, snow falling, vision darkening at the edges, tragic and quiet mood, no gore, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Перед воротами» (st2 и st3) — `scene-outside-gate.jpg` (16:9)

Площадка перед воротами, где героя задирает Вася. Персонажей в кадре нет: портрет Васи показывается поверх картинки.

```
muddy snow-covered yard in front of the closed gate of a dark stone fortress, wooden carts, barrels, a smoking campfire, a few blurred recruits in shabby clothes waiting in the distance, stone walls and wooden watchtowers above, grey daylight, empty foreground, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Внутренний двор» (st4) — `scene-courtyard.jpg` (16:9)

Герой прошёл ворота. К нему подходит мужчина в чёрном плаще, его портрет тоже показывается поверх.

```
inner courtyard of a grim stone fortress seen from a high wall, wooden stairs and galleries along dark stone buildings, recruits training with wooden swords in the trampled snow, men in black cloaks watching, smoke from chimneys, braziers, overcast sky, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Трапезная» (st6, st6_1, st6_2) — `scene-hall.jpg` (16:9)

Длинный зал с низким закопчённым потолком, грубые столы, очаг в дальнем конце. В st6_1 и st6_2 поверх показывается портрет Васи, поэтому левый верхний угол лучше оставить спокойным.

```
long low-ceilinged mess hall inside a stone fortress, soot-blackened wooden beams, rough wooden tables and benches, tired recruits in shabby clothes eating from wooden bowls, a large roaring hearth at the far end, steam rising from a cauldron of stew, warm firelight against cold blue shadows, cozy but grim atmosphere, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Келья» (st7) — `scene-cell.jpg` (16:9)

Крошечная комната под крышей: соломенный тюфяк, одеяло, сундук, узкое окно на лес.

```
tiny cramped attic cell in a stone fortress at night, straw mattress on the floor with a rough wool blanket, an old wooden chest, a single candle, a narrow arrow-slit window showing a dark snowy forest under a pale moon, bare stone walls, sloped wooden roof beams, lonely and quiet mood, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Сцена «Огни в лесу» (st7_1) — `scene-forest-lights.jpg` (16:9)

Вид из окна кельи: за крепостной стеной в тёмном лесу движутся огни и один за другим гаснут.

```
view from a high fortress window at night over a snow-covered stone wall to a vast dark pine forest, a dozen small pale bluish lights moving between the trees in a line toward a mountain pass, some of the lights fading out, eerie and ominous, cold moonlight, falling snow, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

Финал главы (st8, «Три сигнала») пока использует `background.jpg`: ночная крепость в горах подходит к сцене.

## Места крепости

Картинки мест, по которым герой ходит сам; сцены в этих местах используют их же. Новую картинку,
пока её нет, игра прячет, а `tests/story.test.ts` держит её в списке `AWAITING_ART` — когда файл
появится в `public/img/`, строку оттуда нужно убрать. Над картинкой бывает портрет собеседника
(Вася, кузнец), поэтому левый верхний угол лучше оставить спокойным.

### Двор у ворот — `scene-gateyard.jpg` (16:9)

Тесный двор за воротами: караулка, доска нарядов под навесом, жаровня, коновязь. Чаще всего сюда
приходят вечером и ночью.

```
cramped yard just inside the massive barred wooden gate of a dark stone fortress at night, a torch smoking under the gate arch, a low guardhouse door with warm light spilling out, a weathered wooden notice board under a small lean-to with sheets of paper nailed to it, an iron brazier with glowing coals, horses at a hitching post, trampled snow, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

### Казарма — `scene-barracks.jpg` (16:9)

Длинный барак с двумя рядами нар, печка; в дальнем углу двое голых нар без соломы и одеял.

```
long dark wooden barracks inside a stone fortress at night, two rows of rough bunk beds with sleeping recruits under wool blankets, a small iron stove glowing red, wet cloaks hanging on pegs, in the far corner two bare bunks stripped of straw and blankets, dim candlelight, cold drafts, grim and lonely mood, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

### Кузница — `scene-smithy.jpg` (16:9)

Горн, наковальня, верстак с инструментом; на краю верстака — фонарь со шторкой.

```
interior of a fortress smithy at evening, a glowing stone forge with leather bellows, an anvil, a water tub with steam, a cluttered workbench with tongs, chisels, files and scraps of iron, an unfinished iron lantern with a sliding shutter lying at the edge of the bench, orange forge glow against cold blue shadows, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

### Стена — `scene-wall.jpg` (16:9)

Ночь на крепостной стене: зубцы, ветер, внизу чёрный лес до перевала, левее — угловая башня.
Та же картинка у сцен «Ответный огонь» и «Темнота», поэтому огонёк у перевала можно оставить.

```
top of a snow-covered stone fortress wall at night, battlements in the foreground, strong wind blowing snow, below a vast black pine forest stretching to a distant mountain pass, a dark corner tower to the left with a faint light in its window, a tiny answering light far away at the pass, a huge copper-bound horn on an iron stand, cold moonlight, tense and secret mood, dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Ситуации в крепости

Картинки отдельных занятий, точек интереса и происшествий, чтобы не показывать всюду общий вид
места. Все 16:9, 1344×768, промпты — связными фразами.

### Плац, учебный бой — `scene-drill.jpg` (16:9)

Учебные бои, тренировка, точка «Плац».

```
A trampled, snowy drill yard inside a grim stone fortress on a grey winter morning. In the foreground two young recruits in padded gambesons spar with battered round shields and thick brown wooden sticks, each stick as long as an arm, blunt, chipped and dull, like a rough club. Nobody holds anything made of metal. Behind them more recruits drill in pairs with the same wooden sticks, and a rack by the wall is full of splintered wooden sticks. An older man in a heavy black wool cloak watches with his arms folded. Breath steams in the cold air, wet snow falls lightly.
```

### Кухня — `scene-kitchen.jpg` (16:9)

Помощь на кухне, дрова по наряду, кот с колбасой, точка «Кухня».

```
A cramped, smoky fortress kitchen lit by a roaring hearth fire. Huge blackened cauldrons hang over the flames, sacks of turnips and onions are piled against the stone walls, strings of sausages and dried herbs hang from the low beams, and a heap of split firewood lies by the door. A chopping block with a cleaver stands in the foreground. Warm orange firelight, steam and smoke, cold blue daylight from a small window.
```

### Кот с колбасой — `scene-cat.jpg` (16:9)

Происшествие на кухне: кот удирает с колбасой, повар гонится за ним.

```
A scrawny ginger cat is running away with a stolen sausage in its mouth: a long red sausage dangles from its jaws on both sides. It is a chaotic moment in a smoky fortress kitchen; the cat bolts across the stone floor straight towards the viewer, ears flat, mid-leap. Right behind it a stout, red-faced, red-bearded cook with rolled-up sleeves and a stained apron charges after it, shouting, a big wooden ladle raised high. A knocked-over bowl and scattered onions lie on the floor; cauldrons steam over the hearth fire and strings of sausages hang from the low beams. Warm orange firelight, a sense of motion.
```

### Искры в кузнице — `scene-sparks.jpg` (16:9)

Происшествие в кузнице: раскалённая полоса выскальзывает из клещей и летит в ветошь.

```
A glowing red-hot iron bar is flying through the air, just slipped out of a pair of blacksmith's tongs, trailing sparks, about to land in a heap of oily rags on the floor. A broad-shouldered blacksmith with a singed reddish-grey beard and a heavy leather apron lunges after it with open tongs, his face tense. A dark smithy lit by the orange glow of the forge, a water tub nearby, an anvil, tools on the walls, sparks and smoke everywhere, a sense of sudden danger.
```

### Жаровня у ворот — `scene-brazier.jpg` (16:9)

Вечер у жаровни, спор часовых, точка «Жаровня у ворот».

```
Night in a narrow snowy yard by a massive fortress gate. Three sentries in dark cloaks and iron caps huddle around an iron brazier full of glowing coals, holding their hands to the heat, spears leaning against the wall. The warm orange glow lights their tired faces from below, while the gate arch behind them is lost in blue darkness and falling snow.
```

### Караулка у ворот — `scene-guardhouse.jpg` (16:9)

Разговор со Стенли, смена у ворот по наряду, точка «Караулка».

```
Inside a small cramped guardhouse built into a fortress gate. A low stone vault, a narrow bench, a heavy wooden winch with a thick chain that raises the gate, a lantern on a hook, a spear and a round shield propped in the corner, a pair of dice and a tin mug on a barrel used as a table. Through a small barred window snow and grey daylight are visible. Cold, dim and lived-in.
```

### Доска нарядов — `scene-duty-board.jpg` (16:9)

Доска нарядов у ворот, сцены нарядов.

```
Close view of a weathered wooden notice board under a small snow-covered lean-to roof, nailed to a stone wall by a fortress gate. Several sheets of rough paper and wooden tablets are pinned to it, covered with dense lines of illegible charcoal scribbles, some crossed out; a stub of charcoal hangs on a string. Snowflakes drift past, grey morning light.
```

### Следы у калитки — `scene-tracks.jpg` (16:9)

Происшествие: утренние следы от угловой башни к калитке.

```
Early morning in a fortress yard after fresh snowfall. A single line of boot prints crosses the untouched snow, running along the foot of a tall dark stone wall from a distant corner tower to a small wooden wicket door set beside the main gate. The low sun casts long blue shadows into each footprint. Quiet, cold and suspicious.
```

### Ворон у окна — `scene-raven.jpg` (16:9)

Происшествие: ворон стучит в окно кельи.

```
Seen from inside a tiny attic cell under a sloping roof, a narrow window of cloudy mica panes. On the outer sill sits a huge black raven, head cocked, one eye staring into the room; a scrap of red thread is tied around its leg. Beyond it a snowy pine forest stretches to distant mountains in cold dawn light. The dark cell interior frames the window.
```

### Фонарь на верстаке — `scene-lantern.jpg` (16:9)

Фонарь со шторкой у кузнеца, точка «Верстак».

```
Close view of a cluttered blacksmith's workbench lit by the orange glow of a forge. In the centre stands an iron signal lantern with thick glass and a hinged metal shutter over its window, a small lever on its side. Around it lie tongs, chisels, files and scraps of iron. Sparks and soft smoke drift in the background.
```

### Записка из-под нар — `scene-note.jpg` (16:9)

Находка в казарме: клочок бумаги с рисунком стены, башни и леса.

```
Close view of a crumpled scrap of old paper lying on rough wooden planks in dim candlelight. On it is a crude charcoal sketch without any writing: a line of fortress wall, a tall corner tower, a row of small pine trees, and three little star-shaped marks drawn between the tower and the trees. Dust and straw around it.
```

### Драка новобранцев — `scene-brawl.jpg` (16:9)

Происшествие: двое новобранцев дерутся в снегу.

```
Two scruffy young recruits wrestle in the trampled snow by a wooden barracks wall, clutching each other's collars; one of them has lost a boot and fights in a grey wool sock. They wear plain, patched, faded grey padded jackets with no emblems, no heraldry and no colours, and neither carries any weapon. A small ring of other shabby recruits in the same plain grey jackets watches, some laughing, some shouting. Grey daylight inside a grim stone fortress, light snow falling.
```

---

## Портреты

Общее для всех портретов: 1:1, 1024×1024, одинаковая компоновка, чтобы они смотрелись одним набором.
Добавляй в начало каждого промпта:

```
head and shoulders portrait, centered, facing the viewer, plain dark stone background, soft side torchlight,
```

### Вася (враг) — `portrait-vasya.jpg`

«Агрессивно настроенный молодой человек».

```
aggressive young man around 20 years old, crooked broken nose, sneering, clenched jaw, messy short hair, stubble, rough patched wool tunic, a bruise on the cheek, looking for a fight
```

### Волк (враг, глава 2) — `portrait-wolf.jpg`

«Быстрый и вёрткий, бьёт часто, но слабо».

```
lean grey northern wolf, snarling, bared fangs, yellow eyes, frost on its fur, crouched to lunge, snowy pine forest at night behind
```

### Человек в тёмном плаще (враг, глава 2) — `portrait-raider.jpg`

«В кожаном доспехе, из тех, кто ходит с огнями в лесу». Плащ — такой же тёмный, как у стражи.

```
grim man in his thirties, dark hooded cloak like a border guard's, worn leather armor with iron studs, scarred face half in shadow, cold stare, torchlight, snowy night
```

### Наставник во дворе — `portrait-mentor.jpg`

«Мужчина лет 30–35, в чёрном плаще, добро улыбается».

```
friendly man in his early thirties, kind warm smile, short dark beard, tired but gentle eyes, wearing a heavy black wool cloak with a simple iron clasp
```

### Хальвар, кузнец — `portrait-smith.jpg`

«Широкоплечий кузнец с опалённой бородой»: руки в ожогах, кожаный фартук. Говорит мало, замечает всё.

```
broad-shouldered blacksmith in his fifties, singed reddish-grey beard, soot-streaked face, burn scars on thick forearms, heavy leather apron over a sweat-stained shirt, wary appraising gaze, orange forge glow from one side
```

### Новобранец на плацу — `portrait-recruit.jpg`

Противник в учебных боях: долговязый веснушчатый парень, проворнее, чем выглядит. Добродушный, после боя подаёт руку.

```
Head and shoulders portrait of a lanky, freckled nineteen-year-old recruit, centered and facing the viewer. He grins widely, showing a gap between his front teeth; his cheeks are flushed from the cold and messy straw-coloured hair sticks out over his big ears. He wears a patched grey padded gambeson and rests a crude, chipped wooden training sword on his shoulder: plain pale wood, no metal at all. Behind him is a plain dark stone wall, lit by soft torchlight from one side.
```

### Повар — `portrait-cook.jpg`

Красный от жара, злой, но хлебом не обидит.

```
Head and shoulders portrait of a stout, red-faced fortress cook in his forties, centered and facing the viewer. He scowls under bushy eyebrows, his cheeks flushed from the heat of the hearth; his sleeves are rolled up over thick forearms and a stained apron hangs from his neck. He holds a big wooden ladle. Behind him is a plain dark stone wall, lit by warm firelight from one side.
```

### Стенли, привратник — `portrait-stanley.jpg`

Скучающий стражник у ворот, насмешливый, но честный.

```
Head and shoulders portrait of a weathered gate guard in his late forties, centered and facing the viewer. He has a lean face, a crooked grey stubble, a mocking half-smile and tired, watchful eyes; he wears a dented iron cap and a heavy dark cloak over a padded coat, a spear shaft resting against his shoulder. Behind him is a plain dark stone wall, lit by soft torchlight from one side.
```

### Лица героя — `hero-1.jpg` … `hero-6.jpg`

Шесть вариантов на выбор при создании героя. Все — новобранцы, которых привезли служить.

```
hero-1: young man with long dark wavy hair, pale skin, serious brooding look, worn dark leather jacket
hero-2: young woman with short cropped red hair, freckles, scar across the eyebrow, defiant look, simple grey wool clothes
hero-3: broad-shouldered man in his forties, shaved head, thick grey beard, calm heavy gaze, battered leather armor
hero-4: lean young man with long blond hair tied back, sharp cunning face, faint smirk, dark hooded cloak
hero-5: woman in her thirties with dark braided hair, weathered tanned skin, stern expression, fur-lined cloak
hero-6: young man with tanned skin, short black curly hair, thin moustache, alert eyes, patched travelling clothes
```
