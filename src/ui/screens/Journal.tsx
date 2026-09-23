import { useEffect, useRef } from 'preact/hooks';
import type { JournalView } from '@/game/journal';
import type { PersonView } from '@/game/relations';
import { useI18n } from '../i18n';

interface Props {
  entries: JournalView[];
  people: PersonView[];
  onClose: () => void;
  /** Перейти к летописи. */
  onSwitch: () => void;
}

/**
 * Журнал поверх игры: текущие и выполненные цели, зацепки и знакомые люди с их отношением к герою.
 * Закрывается J или Esc.
 */
export function Journal({ entries, people, onClose, onSwitch }: Props) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  const goals = entries.filter((entry) => entry.kind === 'goal');
  const active = goals.filter((entry) => !entry.done);
  const done = goals.filter((entry) => entry.done);
  const leads = entries.filter((entry) => entry.kind === 'lead');

  return (
    <div class="menu journal" role="dialog" aria-label={t.journal.title}>
      <div class="journal__inner">
        <header class="journal__header">
          <h1>{t.journal.title}</h1>
          <button class="journal__tab" title={t.journal.chronicleInfo} onClick={onSwitch}>
            {t.journal.chronicle} <kbd>H</kbd>
          </button>
          <button ref={closeRef} class="journal__close" title={t.closeEsc} onClick={onClose}>
            ✕
          </button>
        </header>

        <section>
          <h2>{t.journal.goals}</h2>
          {active.length === 0 && <p class="journal__empty">{t.journal.noGoals}</p>}
          {active.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
          {done.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </section>

        <section>
          <h2>{t.journal.leads}</h2>
          {leads.length === 0 && <p class="journal__empty">{t.journal.noLeads}</p>}
          {leads.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </section>

        {people.length > 0 && (
          <section>
            <h2>{t.journal.people}</h2>
            {people.map((person) => (
              <Person key={person.id} person={person} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

/** Тон отношения для цвета метки: хорошее, плохое или никакое. */
function tone(value: number): string {
  return value > 0 ? 'good' : value < 0 ? 'bad' : 'neutral';
}

function Person({ person }: { person: PersonView }) {
  return (
    <article class="journal-person">
      <img class="journal-person__portrait" src={person.portrait} alt="" />
      <div>
        <h3>
          {person.name}{' '}
          <span class={'attitude attitude--' + tone(person.value)}>{person.attitude}</span>
        </h3>
        <p>{person.about}</p>
      </div>
    </article>
  );
}

function Entry({ entry }: { entry: JournalView }) {
  const { t } = useI18n();
  return (
    <article class={'journal-entry' + (entry.done ? ' journal-entry--done' : '')}>
      <h3>
        {entry.title}
        {entry.done && <small>{t.journal.done}</small>}
      </h3>
      {entry.notes.map((note, i) => (
        <p key={i}>{note}</p>
      ))}
      {entry.hint && <p class="journal-entry__hint">{entry.hint}</p>}
    </article>
  );
}
