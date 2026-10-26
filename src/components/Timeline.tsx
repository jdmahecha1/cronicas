import { CloudIcon, EyeIcon } from '@phosphor-icons/react/dist/ssr';
import { useMemo, useState } from 'react';
import type { Saga } from '../lib/schema';
import {
  charactersById,
  describeMarker,
  gamesByRelease,
  groupFog,
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

const MODES: [TimelineMode, string][] = [
  ['universo', 'Cronología interna'],
  ['lanzamiento', 'Orden de lanzamiento'],
];

export default function Timeline({ saga }: Props) {
  const shield = useShield(saga);
  const [mode, setMode] = useState<TimelineMode>('universo');
  const [game, setGame] = useState<string>('todos');
  const [onlyMajor, setOnlyMajor] = useState(false);
  // Eventos que el usuario decidió ver aunque el escudo los oculte.
  const [forced, setForced] = useState<Set<string>>(() => new Set());

  const gameTitle = new Map(saga.games.map((g) => [g.id, g.title]));
  const people = charactersById(saga);

  const events = useMemo(
    () =>
      sortEvents(saga, mode).filter(
        (e) => (game === 'todos' || e.at.game === game) && (!onlyMajor || e.major),
      ),
    [saga, mode, game, onlyMajor],
  );

  const visible = (id: string, at: Parameters<typeof isRevealed>[0]) =>
    isRevealed(at, shield) || forced.has(id);
  const runs = groupFog(events, (e) => visible(e.id, e.at));
  const hiddenCount = events.filter((e) => !visible(e.id, e.at)).length;

  return (
    <div className="timeline">
      <div className="timeline__controls">
        <div className="segmented" role="group" aria-label="Orden de los eventos">
          {MODES.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>
              {label}
            </button>
          ))}
        </div>
        <select aria-label="Filtrar por juego" value={game} onChange={(e) => setGame(e.target.value)}>
          <option value="todos">Todos los juegos</option>
          {gamesByRelease(saga).map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={onlyMajor} onChange={(e) => setOnlyMajor(e.target.checked)} />
          Solo momentos clave
        </label>
      </div>

      <p className="timeline__summary muted" aria-live="polite">
        {events.length - hiddenCount} de {events.length} eventos a la vista
      </p>

      <ol className="timeline__path">
        {runs.map((run) => {
          if (run.kind === 'fog') {
            const first = run.items[0];
            const n = run.items.length;
            return (
              <li key={`fog-${first.id}`} className="timeline__stop is-fog">
                <span className="timeline__dot" aria-hidden="true" />
                <div className="fog-card timeline__fog">
                  <CloudIcon className="icon timeline__fog-icon" aria-hidden="true" weight="duotone" />
                  <p>
                    <strong>
                      {n === 1 ? '1 evento' : `${n} eventos`} en la niebla
                    </strong>
                    <span>Se despeja al terminar {describeMarker(saga, first.at, shield)}</span>
                  </p>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() =>
                      setForced((prev) => {
                        const next = new Set(prev);
                        for (const e of run.items) next.add(e.id);
                        return next;
                      })
                    }
                  >
                    <EyeIcon className="icon" aria-hidden="true" weight="bold" />
                    Ver {n === 1 ? 'spoiler' : 'spoilers'}
                  </button>
                </div>
              </li>
            );
          }
          const event = run.item;
          return (
            <li key={event.id} className={`timeline__stop${event.major ? ' is-major' : ''}`}>
              <span className="timeline__dot" aria-hidden="true" />
              <article className="timeline__card reveal-in">
                <p className="timeline__date">
                  {event.date}
                  {event.branch && <span className="chip">Rama: {event.branch}</span>}
                </p>
                <h3>{event.title}</h3>
                <p className="timeline__text">{event.text}</p>
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
                        Alguien que aún no conoces
                      </span>
                    );
                  })}
                </footer>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
