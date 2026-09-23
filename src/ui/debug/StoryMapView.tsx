// Карта сюжета (только в режиме разработки): сцены по столбцам глубины от входов в сюжет.
// Щелчок по сцене переносит в неё, как выбор сцены в панели отладки.
import { useMemo } from 'preact/hooks';
import { storyMap, type MapNode } from '@/game/storyMap';

const KIND_MARK = { next: '→', fail: '✗', fight: '⚔', leave: '⇥', gameOver: '☠' } as const;

interface Props {
  current: string | null;
  onJump: (sceneId: string) => void;
  onClose: () => void;
}

export function StoryMapView({ current, onJump, onClose }: Props) {
  const nodes = useMemo(storyMap, []);
  const columns = useMemo(() => {
    const byDepth = new Map<number, MapNode[]>();
    for (const node of nodes) {
      const depth = node.depth ?? -1; // недостижимые — в отдельном столбце слева
      byDepth.set(depth, [...(byDepth.get(depth) ?? []), node]);
    }
    return [...byDepth].sort(([a], [b]) => a - b);
  }, [nodes]);
  const problems = nodes.filter((node) => node.deadEnd || node.depth === null).length;

  return (
    <div class="balance story-map">
      <div class="debug-panel__header">
        <strong>
          Карта сюжета: {nodes.length} сцен{problems > 0 && `, проблем: ${problems}`}
        </strong>
        <button onClick={onClose}>✕</button>
      </div>
      <p class="balance__legend">
        Столбцы — шаги от входов в сюжет (начало, события, разговоры, действия в местах). → переход,
        ✗ провал проверки, ⚔ бой, ⇥ выход к свободному перемещению, ☠ конец игры. Красным — тупики и
        недостижимые сцены.
      </p>
      <div class="story-map__columns">
        {columns.map(([depth, column]) => (
          <div key={depth} class="story-map__column">
            <h5>{depth < 0 ? 'недостижимые' : 'шаг ' + depth}</h5>
            {column.map((node) => (
              <button
                key={node.id}
                class={
                  'story-map__node' +
                  (node.deadEnd || node.depth === null ? ' is-problem' : '') +
                  (node.id === current ? ' is-current' : '')
                }
                onClick={() => onJump(node.id)}
              >
                <b>{node.id}</b> {node.title}
                {node.entry && <em>вход: {node.entry}</em>}
                {node.links.map((link, i) => (
                  <small key={i}>
                    {KIND_MARK[link.kind]} {link.to} — {link.label}
                  </small>
                ))}
                {node.deadEnd && <small>тупик: нет вариантов</small>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
