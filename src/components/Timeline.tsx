import { useMemo, useState } from 'react';
import type { Saga } from '../lib/schema';
import {
  charactersById,
  describeMarker,
  gamesByRelease,
  isCharacterKnown,
  isRevealed,
  sortEvents,
  type TimelineMode,
} from '../lib/spoilers';
import { characterUrl } from '../lib/url';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

export default function Timeline({ saga }: Props) {
  const shield = useShield(saga);
  const [mode, setMode] = useState<TimelineMode>('universo');
  const [game, setGame] = useState<string>('todos');
  const [onlyMajor, setOnlyMajor] = useState(false);
  // Eventos que el usuario decidió ver aunque el escudo los oculte.
  const [forced, setForced] = useState<Set<string>>(() => new Set());

  const games = gamesByRelease(saga);
  const gameTitle = new Map(saga.games.map((g) => [g.id, g.title]));
  const people = charactersById(saga);

  const events = useMemo(
    () =>
      sortEvents(saga, mode).filter(
        (e) => (game === 'todos' || e.at.game === game) && (!onlyMajor || e.major),
      ),
    [saga, mode, game, onlyMajor],
  );

  const hiddenCount = events.filter((e) => !isRevealed(e.at, shield) && !forced.has(e.id)).length;

  return (
    <div className="timeline">
      <div className="timeline__controls" role="group" aria-label="Opciones de la línea de tiempo">
        <div className="segmented" role="group" aria-label="Orden de los eventos">
          {(
            [
              ['universo', 'Cronología interna'],
              ['lanzamiento', 'Orden de lanzamiento'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              
              onClick={() => setMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="timeline__filter">
          <select aria-label="Filtrar por juego" value={game} onChange={(e) => setGame(e.target.value)}>
            <option value="todos">Todos los juegos</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
        <label className="timeline__check">
          <input type="checkbox" checked={onlyMajor} onChange={(e) => setOnlyMajor(e.target.checked)} />
          Solo momentos clave
        </label>
      </div>

      <p className="timeline__summary muted" aria-live="polite">
        {events.length} eventos{hiddenCount > 0 ? ` · ${hiddenCount} ocultos por el escudo` : ''}
      </p>

      <ol className="timeline__list">
        {events.map((event) => {
          const visible = isRevealed(event.at, shield) || forced.has(event.id);
          const when = describeMarker(saga, event.at, shield);
          return (
            <li
              key={event.id}
              className={`timeline__item${event.major ? ' is-major' : ''}${visible ? '' : ' is-hidden'}`}
            >
              <span className="timeline__dot" aria-hidden="true" />
              {visible ? (
                <article className="timeline__card">
                  <header>
                    <p className="timeline__date">
                      {event.date}
                      {event.branch && <span className="chip chip--branch">Rama: {event.branch}</span>}
                    </p>
                    <h3>{event.title}</h3>
                  </header>
                  <p>{event.text}</p>
                  <footer className="timeline__meta">
                    <span className="chip">{gameTitle.get(event.at.game)}</span>
                    {event.characters.map((id) => {
                      const c = people.get(id);
                      if (!c) return null;
                      return isCharacterKnown(c, shield) || forced.has(event.id) ? (
                        <a key={id} className="chip" href={characterUrl(saga.id, id)}>
                          {c.name}
                        </a>
                      ) : (
                        <span key={id} className="chip chip--unknown">
                          ???
                        </span>
                      );
                    })}
                  </footer>
                </article>
              ) : (
                <div className="timeline__card timeline__card--veiled">
                  <p className="timeline__veil-text">
                    <strong>Evento oculto</strong> · se desbloquea al terminar {when}
                  </p>
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost"
                    onClick={() => setForced((prev) => new Set(prev).add(event.id))}
                  >
                    Mostrar igual
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
