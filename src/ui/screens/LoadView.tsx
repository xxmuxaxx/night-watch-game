import { useEffect, useRef } from 'preact/hooks';
import { SaveSlots } from '../components/SaveSlots';
import { useStore } from '../store';

/** Загрузка из главного меню: автосохранение и ручные ячейки. */
export function LoadView({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <div class="menu journal settings" role="dialog" aria-label="Загрузить игру">
      <div class="journal__inner">
        <header class="journal__header">
          <h1>Загрузить игру</h1>
          <button ref={closeRef} class="journal__close" title="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>
        <SaveSlots
          saves={store.listSaves()}
          mode="load"
          onPick={(slot) => {
            onClose();
            store.loadGame(slot);
          }}
        />
      </div>
    </div>
  );
}
