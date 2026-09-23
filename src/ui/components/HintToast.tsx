import type { Hint } from '../hints';
import { useI18n } from '../i18n';

/** Подсказка внизу экрана, поверх сцены и боя. Не мешает играть: закрывается кнопкой «Понятно». */
export function HintToast({ hint, onClose }: { hint: Hint; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div class="hint" role="status">
      <p>{t.hints[hint]}</p>
      <button class="hint__close" onClick={onClose}>
        {t.hints.gotIt}
      </button>
    </div>
  );
}
