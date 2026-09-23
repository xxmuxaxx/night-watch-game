import { describe, expect, it } from 'vitest';
import { SCENES, START_SCENE } from '@/content/story';
import { storyMap } from '@/game/storyMap';

describe('карта сюжета', () => {
  const nodes = storyMap();
  const node = (id: string) => nodes.find((n) => n.id === id);

  it('все сцены на карте и все достижимы', () => {
    expect(nodes.map((n) => n.id).sort()).toEqual(Object.keys(SCENES).sort());
    expect(nodes.filter((n) => n.depth === null).map((n) => n.id)).toEqual([]);
  });

  it('входы: начало игры, события, разговоры, действия в местах', () => {
    expect(node(START_SCENE)).toMatchObject({ depth: 0, entry: 'начало игры' });
    expect(node('st6')?.entry).toBe('событие dinner');
    expect(node('torvin_talk')?.entry).toBe('разговор: Торвин');
    expect(node('routine_training')?.entry).toBe('действие: Внутренний двор, Плац');
  });

  it('связи: проверка даёт успех и провал, бой — свой значок; тупик — только конец главы', () => {
    expect(node('st2')?.links.map((l) => [l.kind, l.to])).toEqual([
      ['fight', 'st3'],
      ['next', 'st3'],
      ['fail', 'st2_1'],
      ['next', 'st3_talk'],
      ['fail', 'st2_2'],
    ]);
    expect(nodes.filter((n) => n.deadEnd).map((n) => n.id)).toEqual(['st9']);
  });
});
