import type { Hint } from '../hints';

/** Подсказка внизу экрана, поверх сцены и боя. Не мешает играть: закрывается кнопкой «Понятно». */
export function HintToast({ hint, onClose }: { hint: Hint; onClose: () => void }) {
  return (
    <div class="hint" role="status">
      <p>{hint.text}</p>
      <button class="hint__close" onClick={onClose}>
        Понятно
      </button>
    </div>
  );
}
