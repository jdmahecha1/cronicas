import { ArrowCounterClockwiseIcon, ChecksIcon, FloppyDiskIcon } from '@phosphor-icons/react/dist/ssr';
import { resetSaga, setSagaProgress } from '../lib/progress-store';
import type { Saga } from '../lib/schema';
import {
  chapterLabel,
  completeAll,
  completion,
  countHidden,
  gamesByRelease,
} from '../lib/spoilers';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

/**
 * "Partida guardada": por cada juego, un camino de puntos (uno por etapa). Por
 * dentro son radios nativos, así que se recorren con las flechas del teclado.
 */
export default function SavePanel({ saga }: Props) {
  const shield = useShield(saga);
  const hidden = countHidden(saga, shield);
  const percent = completion(saga, shield.progress);
  const remaining = hidden.events + hidden.characters + hidden.relations + hidden.reveals;
  const fresh = shield.enabled && percent === 0;

  const update = (gameId: string, value: number) =>
    setSagaProgress(saga.id, { ...shield.progress, [gameId]: value });

  return (
    <section className={`save${fresh ? ' is-fresh' : ''}`} aria-labelledby="partida-titulo" id="partida">
      <header className="save__head">
        <FloppyDiskIcon className="icon save__icon" aria-hidden="true" weight="duotone" />
        <div>
          <h2 id="partida-titulo">{fresh ? '¿Hasta dónde jugaste?' : 'Tu partida'}</h2>
          <p className="save__hint">
            {fresh
              ? 'Toca el último capítulo que terminaste en cada juego. Lo que viene después seguirá en la niebla.'
              : `${percent}% de la saga recorrida`}
          </p>
        </div>
      </header>

      <ol className="save__games">
        {gamesByRelease(saga).map((game) => {
          const value = shield.progress[game.id] ?? 0;
          const name = `partida-${saga.id}-${game.id}`;
          const current =
            value === 0
              ? 'Aún no lo juegas'
              : value === game.chapters.length
                ? 'Terminado'
                : `Último terminado: ${chapterLabel(game, value - 1, shield)}`;
          return (
            <li key={game.id} className="save__game">
              <div className="save__title">
                <span>{game.title}</span>
                <span className="save__year" aria-hidden="true">
                  {game.year}
                </span>
              </div>
              <div role="radiogroup" aria-label={game.title} className="save__path">
                {[0, ...game.chapters.map((_, i) => i + 1)].map((n) => {
                  const label =
                    n === 0
                      ? 'Sin jugar'
                      : `Terminé: ${chapterLabel(game, n - 1, shield)}`;
                  const state = n === 0 ? 'start' : n <= value ? 'lit' : 'dark';
                  return (
                    <label key={n} className={`save__node is-${state}`} title={label}>
                      <input
                        type="radio"
                        name={name}
                        value={n}
                        checked={value === n}
                        onChange={() => update(game.id, n)}
                        aria-label={label}
                      />
                      <span aria-hidden="true" />
                    </label>
                  );
                })}
              </div>
              <p className="save__current" aria-live="polite">
                {current}
              </p>
            </li>
          );
        })}
      </ol>

      <p className="save__status" aria-live="polite">
        {!shield.enabled
          ? 'Escudo apagado: estás viendo toda la historia.'
          : remaining === 0
            ? 'Ya viste toda la saga. No queda niebla.'
            : `Te quedan ${remaining} cosas por descubrir.`}
      </p>

      <div className="save__actions">
        <button type="button" className="btn btn--sm" onClick={() => setSagaProgress(saga.id, completeAll(saga))}>
          <ChecksIcon className="icon" aria-hidden="true" weight="bold" />
          Lo jugué todo
        </button>
        <button type="button" className="btn btn--sm" onClick={() => resetSaga(saga.id)}>
          <ArrowCounterClockwiseIcon className="icon" aria-hidden="true" weight="bold" />
          Reiniciar
        </button>
      </div>
    </section>
  );
}
