import { useEffect, useRef } from 'preact/hooks';
import type { JournalView } from '@/game/journal';

interface Props {
  entries: JournalView[];
  onClose: () => void;
}

/** Журнал поверх игры: сначала текущие цели, затем выполненные, затем зацепки. Закрывается J или Esc. */
export function Journal({ entries, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  const goals = entries.filter((entry) => entry.kind === 'goal');
  const active = goals.filter((entry) => !entry.done);
  const done = goals.filter((entry) => entry.done);
  const leads = entries.filter((entry) => entry.kind === 'lead');

  return (
    <div class="menu journal" role="dialog" aria-label="Журнал">
      <div class="journal__inner">
        <header class="journal__header">
          <h1>Журнал</h1>
          <button ref={closeRef} class="journal__close" title="Закрыть (Esc)" onClick={onClose}>
            ✕
          </button>
        </header>

        <section>
          <h2>Цели</h2>
          {active.length === 0 && <p class="journal__empty">Сейчас целей нет.</p>}
          {active.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
          {done.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </section>

        <section>
          <h2>Зацепки</h2>
          {leads.length === 0 && (
            <p class="journal__empty">Пока ничего. Смотрите по сторонам и расспрашивайте людей.</p>
          )}
          {leads.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </section>
      </div>
    </div>
  );
}

function Entry({ entry }: { entry: JournalView }) {
  return (
    <article class={'journal-entry' + (entry.done ? ' journal-entry--done' : '')}>
      <h3>
        {entry.title}
        {entry.done && <small> — выполнено</small>}
      </h3>
      {entry.notes.map((note, i) => (
        <p key={i}>{note}</p>
      ))}
      {entry.hint && <p class="journal-entry__hint">{entry.hint}</p>}
    </article>
  );
}
