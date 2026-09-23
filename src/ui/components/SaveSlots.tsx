import { heroClass } from '@/content/classes';
import { location } from '@/content/locations';
import { MANUAL_SLOTS, SAVE_SLOTS, type SavedGame, type SaveSlot } from '@/game/save';
import { useI18n } from '../i18n';

interface Props {
  saves: (SavedGame | null)[];
  /** load — выбрать сохранение для загрузки; save — записать текущую партию в ручную ячейку. */
  mode: 'load' | 'save';
  onPick: (slot: SaveSlot) => void;
}

/** Список ячеек сохранения: кто, где, когда. */
export function SaveSlots({ saves, mode, onPick }: Props) {
  const { t } = useI18n();
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
                {slot === 'auto' ? t.saves.auto : t.saves.slot(slot)}
                {mode === 'save' && <small>{empty ? t.saves.writeHere : t.saves.overwrite}</small>}
              </span>
              {saved ? (
                <SaveSummary saved={saved} />
              ) : (
                <span class="save-slot__empty">{t.empty}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SaveSummary({ saved }: { saved: SavedGame }) {
  const { t, name, time: formatTime } = useI18n();
  const { hero, locationId, time, oneLife } = saved.session;
  return (
    <span class="save-slot__info">
      {t.saves.hero(hero.name, name(heroClass(hero.classId).title), hero.level)}
      {oneLife && t.saves.oneLife}
      <br />
      {name(location(locationId).name)} · {formatTime(time)}
      {saved.savedAt !== null && (
        <>
          <br />
          <small>{t.saves.savedAt(new Date(saved.savedAt).toLocaleString(t.locale))}</small>
        </>
      )}
    </span>
  );
}
