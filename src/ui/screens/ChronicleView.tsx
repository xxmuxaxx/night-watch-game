import { useEffect, useRef } from 'preact/hooks';
import { chronicleLine, type ChronicleEntry } from '../chronicle';
import { useI18n } from '../i18n';

interface Props {
  entries: ChronicleEntry[];
  onClose: () => void;
  /** Перейти к журналу. */
  onSwitch: () => void;
}

/** Летопись: прочитанное в этом сеансе, последнее — внизу. Закрывается H или Esc. */
export function ChronicleView({ entries, onClose, onSwitch }: Props) {
  const i18n = useI18n();
  const { t } = i18n;
  const closeRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    endRef.current?.scrollIntoView({ block: 'end' });
  }, []);

  return (
    <div class="menu journal" role="dialog" aria-label={t.chronicle.title}>
      <div class="journal__inner">
        <header class="journal__header">
          <h1>{t.chronicle.title}</h1>
          <button class="journal__tab" title={t.chronicle.journalInfo} onClick={onSwitch}>
            {t.journal.title} <kbd>J</kbd>
          </button>
          <button ref={closeRef} class="journal__close" title={t.closeEsc} onClick={onClose}>
            ✕
          </button>
        </header>
        {entries.length === 0 && <p class="journal__empty">{t.chronicle.empty}</p>}
        {entries
          .map((entry) => chronicleLine(entry, i18n))
          .map((entry, i) => (
            <article key={i} class="chronicle-entry">
              <p class="chronicle-entry__time">{entry.time}</p>
              <h3>{entry.title}</h3>
              {entry.notices.length > 0 && (
                <p class="chronicle-entry__notices">{entry.notices.join(' · ')}</p>
              )}
              {entry.text && <p class="chronicle-entry__text">{entry.text}</p>}
              <p class="chronicle-entry__choice">{entry.choice}</p>
            </article>
          ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
