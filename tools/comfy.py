"""Картинки игры через локальный ComfyUI (docs/image-prompts.md, раздел «Как генерируются картинки»).

Промпт берётся из docs/image-prompts.md по имени файла, граф — из tools/comfy-graph.json.

    python tools/comfy.py portrait-recruit                 # варианты с seed 101 202 303
    python tools/comfy.py scene-wall --seeds 7 8           # свои seed
    python tools/comfy.py portrait-recruit --pick 202      # выбранный вариант — в public/img/
    python tools/comfy.py portrait-recruit --prompt        # только показать собранный промпт

Варианты и лист для сравнения складываются в img-source/candidates/ (в гит не попадает).
Нужны Python 3 с Pillow и запущенный ComfyUI (по умолчанию http://127.0.0.1:8188, иначе COMFY_URL).
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / 'docs' / 'image-prompts.md'
GRAPH = ROOT / 'tools' / 'comfy-graph.json'
CANDIDATES = ROOT / 'img-source' / 'candidates'
PUBLIC = ROOT / 'public' / 'img'
HOST = os.environ.get('COMFY_URL', 'http://127.0.0.1:8188')

# Узлы графа, которые подставляются: промпт, сэмплер (seed), размер, имя файла в выходной папке
NODE_TEXT, NODE_SAMPLER, NODE_LATENT, NODE_SAVE = '3', '2', '9', '13'

# Размеры: генерация и копия для игры
SIZES = {
    'scene': ((1344, 768), None),
    'background': ((1536, 768), None),
    'portrait': ((1024, 1024), (512, 512)),
}


def section(doc: str, title: str) -> str:
    """Первый блок кода после заголовка, в котором есть title."""
    match = re.search(r'^#+ [^\n]*' + re.escape(title) + r'[^\n]*\n.*?```\n(.*?)\n```', doc,
                      re.MULTILINE | re.DOTALL)
    if not match:
        sys.exit('В docs/image-prompts.md нет промпта для ' + title)
    return match.group(1).strip()


def kind_of(name: str) -> str:
    if name.startswith(('portrait-', 'hero-')):
        return 'portrait'
    return 'background' if name == 'background' else 'scene'


def build_prompt(name: str) -> str:
    """Описание из документа + общий стиль; портретам без своей компоновки — общее начало."""
    doc = PROMPTS.read_text(encoding='utf-8')
    style = section(doc, 'Общий стиль')
    text = section(doc, '`' + name + '.jpg`')
    # в старых промптах стиль уже вписан в конец — второй раз не добавляем
    if text.endswith(style):
        text = text[: -len(style)].rstrip(', \n')
    if kind_of(name) == 'portrait' and not text.lower().startswith('head and shoulders'):
        text = section(doc, 'Портреты') + ' ' + text
    return text + '\n\n' + style


def call(path: str, data: object = None) -> bytes:
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(HOST + path, data=body,
                                     headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request) as response:
        return response.read()


def generate(name: str, seeds: list[int]) -> None:
    graph = json.loads(GRAPH.read_text(encoding='utf-8'))
    prompt = build_prompt(name)
    (width, height), _ = SIZES[kind_of(name)]
    graph[NODE_TEXT]['inputs']['text'] = prompt
    graph[NODE_LATENT]['inputs'].update(width=width, height=height)
    graph[NODE_SAVE]['inputs']['filename_prefix'] = 'nightwatch/' + name
    CANDIDATES.mkdir(parents=True, exist_ok=True)
    print(prompt, end='\n\n')
    paths = []
    for seed in seeds:
        graph[NODE_SAMPLER]['inputs']['seed'] = seed
        prompt_id = json.loads(call('/prompt', {'prompt': graph}))['prompt_id']
        while True:
            history = json.loads(call('/history/' + prompt_id))
            if prompt_id in history:
                break
            time.sleep(1)
        outputs = history[prompt_id]['outputs'].values()
        image = next(img for node in outputs for img in node.get('images', []))
        query = urllib.parse.urlencode({k: image[k] for k in ('filename', 'subfolder', 'type')})
        path = CANDIDATES / f'{name}-{seed}.png'
        path.write_bytes(call('/view?' + query))
        paths.append(path)
        print(path)
    sheet(name, seeds, paths)


def sheet(name: str, seeds: list[int], paths: list[Path]) -> None:
    """Все варианты рядом, с seed в углу, чтобы выбрать один."""
    thumbs = [Image.open(p).convert('RGB') for p in paths]
    height = 512
    thumbs = [t.resize((round(t.width * height / t.height), height)) for t in thumbs]
    gap = 10
    result = Image.new('RGB', (sum(t.width for t in thumbs) + gap * (len(thumbs) - 1), height))
    x = 0
    draw = ImageDraw.Draw(result)
    for thumb, seed in zip(thumbs, seeds):
        result.paste(thumb, (x, 0))
        draw.text((x + 10, 10), str(seed), fill='yellow')
        x += thumb.width + gap
    path = CANDIDATES / f'{name}-sheet.jpg'
    result.save(path, quality=85)
    print(path)


def pick(name: str, seed: int) -> None:
    source = CANDIDATES / f'{name}-{seed}.png'
    if not source.exists():
        sys.exit('Нет варианта ' + str(source))
    image = Image.open(source).convert('RGB')
    _, size = SIZES[kind_of(name)]
    if size:
        image = image.resize(size, Image.LANCZOS)
    target = PUBLIC / (name + '.jpg')
    image.save(target, quality=85, optimize=True, progressive=True)
    print(target)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('name', help='имя файла без .jpg, например portrait-recruit')
    parser.add_argument('--seeds', type=int, nargs='+', default=[101, 202, 303])
    parser.add_argument('--pick', type=int, help='seed варианта, который пойдёт в игру')
    parser.add_argument('--prompt', action='store_true', help='только показать промпт')
    args = parser.parse_args()
    if args.prompt:
        print(build_prompt(args.name))
    elif args.pick is not None:
        pick(args.name, args.pick)
    else:
        generate(args.name, args.seeds)


main()
