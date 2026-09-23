import { LEVEL_XP } from '@/content/progression';
import { nextLevelXp } from '@/game/progression';

interface Props {
  xp: number;
  level: number;
}

/** Полоса опыта до следующего уровня; на наибольшем уровне — полная. */
export function XpBar({ xp, level }: Props) {
  const next = nextLevelXp(level);
  const from = LEVEL_XP[level - 1] ?? 0;
  const share = next === null ? 1 : (xp - from) / (next - from);
  return (
    <div class="xp">
      <div class="xp__fill" style={{ width: Math.round(Math.min(share, 1) * 100) + '%' }} />
      <span class="xp__text">
        {next === null ? 'Опыт: ' + xp + ' (наибольший уровень)' : 'Опыт: ' + xp + '/' + next}
      </span>
    </div>
  );
}
