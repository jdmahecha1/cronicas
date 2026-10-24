import { resetSaga, setSagaProgress } from '../lib/progress-store';
import type { Saga } from '../lib/schema';
import {
  chapterLabel,
  completeAll,
  completeUpTo,
  completion,
  countHidden,
  gamesByRelease,
} from '../lib/spoilers';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

/** "¿Hasta dónde has llegado?": define qué partes de la saga se pueden mostrar. */
export default function ProgressPanel({ saga }: Props) {
  const shield = useShield(saga);
  const hidden = countHidden(saga, shield);
  const percent = completion(saga, shield.progress);
  const totalHidden = hidden.events + hidden.characters + hidden.relations + hidden.reveals;

  const update = (gameId: string, value: number) =>
    setSagaProgress(saga.id, { ...shield.progress, [gameId]: value });

  return (
    <section className="progress card" aria-labelledby="progreso-titulo">
      <div className="progress__head">
        <h2 id="progreso-titulo">Tu progreso</h2>
        <span className="progress__percent" aria-label={`${percent}% de la saga recorrida`}>
          {percent}%
        </span>
      </div>
      <div
        className="progress__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Saga recorrida"
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <p className="progress__hint muted">
        Marca la última etapa que terminaste en cada juego. Todo lo que pase después queda oculto.
      </p>

      <ol className="progress__games">
        {gamesByRelease(saga).map((game) => {
          const value = shield.progress[game.id] ?? 0;
          const id = `progreso-${game.id}`;
          return (
            <li key={game.id}>
              <label htmlFor={id}>
                <span className="progress__game">{game.title}</span>
                <span className="progress__year" aria-hidden="true">{game.year}</span>
              </label>
              <div className="progress__row">
                <select id={id} value={value} onChange={(e) => update(game.id, Number(e.target.value))}>
                  <option value={0}>Sin jugar</option>
                  {game.chapters.map((_, i) => {
                    const label = chapterLabel(game, i, shield);
                    return (
                      <option key={i} value={i + 1}>
                        {i + 1 === game.chapters.length ? `Terminado (${label})` : `Terminé: ${label}`}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => setSagaProgress(saga.id, completeUpTo(saga, shield.progress, game.id))}
                  title="Marca como terminado este juego y todos los anteriores"
                >
                  Hasta aquí
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="progress__status" aria-live="polite">
        {!shield.enabled
          ? 'Escudo apagado: se muestra toda la historia.'
          : totalHidden === 0
            ? 'Has visto toda la saga: no queda nada oculto.'
            : `Ocultando ${hidden.events} eventos, ${hidden.characters} personajes, ${hidden.relations} relaciones y ${hidden.reveals} datos.`}
      </p>

      <div className="progress__actions">
        <button type="button" className="btn btn--sm" onClick={() => setSagaProgress(saga.id, completeAll(saga))}>
          Lo jugué todo
        </button>
        <button type="button" className="btn btn--sm btn--ghost" onClick={() => resetSaga(saga.id)}>
          Reiniciar
        </button>
      </div>
    </section>
  );
}
