// Инструмент баланса (только в режиме разработки): типовые герои и текущий герой против всех
// врагов бестиария. Цифры считаются тем же кодом боя, что и в игре (src/game/balance.ts).
import { useMemo, useState } from 'preact/hooks';
import { ENEMIES } from '@/content/enemies';
import {
  balanceTable,
  ENEMY_IDS,
  HERO_PRESETS,
  STRATEGIES,
  STRATEGY_NAMES,
  type BalanceResult,
  type StrategyId,
} from '@/game/balance';
import type { EnemyDef, Hero } from '@/game/types';

const STRATEGY_IDS = Object.keys(STRATEGIES) as StrategyId[];
const RUNS = [200, 1000, 5000];

interface Props {
  /** Текущий герой партии, если игра начата. */
  hero: Hero | undefined;
  onClose: () => void;
}

export function BalanceView({ hero, onClose }: Props) {
  const [strategy, setStrategy] = useState<StrategyId>('smart');
  const [runs, setRuns] = useState(1000);
  const presets = useMemo(
    () => (hero ? [{ label: 'Текущий: ' + hero.name, hero }, ...HERO_PRESETS] : HERO_PRESETS),
    [hero],
  );
  const table = useMemo(() => balanceTable(presets, strategy, runs), [presets, strategy, runs]);

  return (
    <div class="balance">
      <div class="debug-panel__header">
        <strong>Баланс боя</strong>
        <button onClick={onClose}>✕</button>
      </div>
      <div class="debug-row">
        <span>Игрок</span>
        {STRATEGY_IDS.map((id) => (
          <label key={id}>
            <input type="radio" checked={strategy === id} onChange={() => setStrategy(id)} />
            {STRATEGY_NAMES[id]}
          </label>
        ))}
        <span>Боёв</span>
        <select value={runs} onChange={(e) => setRuns(Number(e.currentTarget.value))}>
          {RUNS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <p class="balance__legend">
        В клетке: доля побед · средняя длина боя в раундах · сколько здоровья герой теряет в
        победном бою. «С умом» — парирует замах, ест при здоровье ≤ 40%, бьёт приёмом, когда он
        готов.
      </p>
      <table>
        <thead>
          <tr>
            <th />
            {ENEMY_IDS.map((id) => (
              <th key={id}>
                {ENEMIES[id].name}
                <small>{enemySummary(ENEMIES[id])}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              {ENEMY_IDS.map((id) => (
                <Cell key={id} result={row.results[id]} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ result }: { result: BalanceResult }) {
  const win = Math.round(result.winRate * 100);
  const tone = win >= 90 ? 'easy' : win >= 60 ? 'fair' : 'hard';
  return (
    <td class={'balance__cell balance__cell--' + tone}>
      <b>{win}%</b> · {result.rounds.toFixed(1)} · −{result.hpLost.toFixed(1)}
    </td>
  );
}

/** Коротко о враге: здоровье, урон и особенности. */
function enemySummary(enemy: EnemyDef): string {
  const damage = enemy.damage ?? { min: 0, max: 2 };
  return [
    (enemy.hp ?? 10) + ' зд.',
    'урон ' + damage.min + '–' + damage.max,
    enemy.armor ? 'доспех ' + enemy.armor : '',
    enemy.dodge ? 'уворот ' + Math.round(enemy.dodge * 100) + '%' : '',
    enemy.windup ? 'замах ' + Math.round(enemy.windup * 100) + '%' : '',
  ]
    .filter(Boolean)
    .join(', ');
}
