import { useI18n } from '../i18n';

interface Props {
  hp: number;
  maxHp: number;
}

/** Полоса здоровья; при трети и меньше становится ярче. */
export function HpBar({ hp, maxHp }: Props) {
  const { t } = useI18n();
  const current = Math.max(hp, 0);
  const share = current / maxHp;
  return (
    <div class={'hp' + (share <= 0.34 ? ' hp--low' : '')}>
      <div class="hp__fill" style={{ width: Math.round(share * 100) + '%' }} />
      <span class="hp__text">{t.hero.hp(current, maxHp)}</span>
    </div>
  );
}
