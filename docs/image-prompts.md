# Промпты для картинок

Промпты на английском: большинство локальных моделей понимают его лучше русского.
Каждый промпт = описание + **общий стиль** в конце. Для моделей с негативным промптом
(Stable Diffusion / SDXL) добавь **общий негатив**; Flux и похожие его не используют.

Модель выдаёт PNG. Оригиналы лежат в `img-source/` (в гит не попадают), а игра использует
их JPG-копии в `public/img/` с тем же именем: сцены в исходном размере, портреты уменьшены до 512×512.
Главное при генерации — соотношение сторон: сцены 16:9, портреты 1:1.

## Общий стиль

```
dark fantasy digital painting, gritty low-fantasy medieval north, muted cold palette of slate blue and grey with warm torchlight accents, painterly brushwork, cinematic lighting, highly detailed, no text
```

## Общий негатив

```
text, watermark, logo, signature, frame, border, blurry, lowres, jpeg artifacts, deformed, extra fingers, extra limbs, modern clothing, giant ice wall, glacier wall, photograph of a celebrity
```

Отдельно просим «без гигантской ледяной стены»: это самый узнаваемый образ сериала.
Вместо неё — каменная крепость в заснеженных горах на северной границе.

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
