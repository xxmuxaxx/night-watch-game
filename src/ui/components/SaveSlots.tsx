import { heroClass } from '@/content/classes';
import { location } from '@/content/locations';
import { MANUAL_SLOTS, SAVE_SLOTS, type SavedGame, type SaveSlot } from '@/game/save';
import { formatTime } from '@/game/time';

interface Props {
  saves: (SavedGame | null)[];
  /** load — выбрать сохранение для загрузки; save — записать текущую партию в ручную ячейку. */
  mode: 'load' | 'save';
  onPick: (slot: SaveSlot) => void;
}

/** Список ячеек сохранения: кто, где, когда. */
export function SaveSlots({ saves, mode, onPick }: Props) {
  const slots = mode === 'save' ? MANUAL_SLOTS : SAVE_SLOTS;
  return (
    <ul class="save-slots">
      {slots.map((slot) => {
        const saved = saves[SAVE_SLOTS.indexOf(slot)] ?? null;
        const empty = saved === null;
        return (
          <li key={slot}>
            <button
              class="save-slot"
              disabled={mode === 'load' && empty}
              onClick={() => onPick(slot)}
            >
              <span class="save-slot__title">
                {slot === 'auto' ? 'Автосохранение' : 'Ячейка ' + slot}
                {mode === 'save' && <small>{empty ? 'записать сюда' : 'перезаписать'}</small>}
              </span>
              {saved ? <SaveSummary saved={saved} /> : <span class="save-slot__empty">Пусто</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SaveSummary({ saved }: { saved: SavedGame }) {
  const { hero, locationId, time, oneLife } = saved.session;
  return (
    <span class="save-slot__info">
      {hero.name}, {heroClass(hero.classId).title.toLowerCase()} {hero.level} уровня
      {oneLife && ' · одна жизнь'}
      <br />
      {location(locationId).name} · {formatTime(time)}
      {saved.savedAt !== null && (
        <>
          <br />
          <small>Сохранено {new Date(saved.savedAt).toLocaleString('ru-RU')}</small>
        </>
      )}
    </span>
  );
}
