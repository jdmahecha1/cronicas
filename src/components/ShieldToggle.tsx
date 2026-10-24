import { setShield } from '../lib/progress-store';
import { useShieldEnabled } from '../lib/use-shield';

/** Interruptor global: con el escudo apagado se muestra todo, en todas las sagas. */
export default function ShieldToggle() {
  const enabled = useShieldEnabled();
  return (
    <button
      type="button"
      className={`shield-toggle${enabled ? '' : ' is-off'}`}
      aria-pressed={enabled}
      onClick={() => setShield(!enabled)}
      title={enabled ? 'Los spoilers se ocultan según tu progreso' : 'Se muestra toda la historia'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
        <path
          d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"
          fill={enabled ? 'currentColor' : 'none'}
          fillOpacity={0.2}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {enabled ? (
          <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="m9 9 6 6M15 9l-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
      <span>Escudo {enabled ? 'activo' : 'apagado'}</span>
    </button>
  );
}
