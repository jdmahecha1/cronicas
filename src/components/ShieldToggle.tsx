import { ShieldCheckIcon, ShieldSlashIcon } from '@phosphor-icons/react/dist/ssr';
import { setShield } from '../lib/progress-store';
import { useShieldEnabled } from '../lib/use-shield';

/** Interruptor global: con el escudo apagado se muestra todo, en todas las sagas. */
export default function ShieldToggle() {
  const enabled = useShieldEnabled();
  const Icon = enabled ? ShieldCheckIcon : ShieldSlashIcon;
  return (
    <button
      type="button"
      className={`shield-toggle${enabled ? '' : ' is-off'}`}
      aria-pressed={enabled}
      onClick={() => setShield(!enabled)}
      title={enabled ? 'Los spoilers se ocultan según tu partida' : 'Se muestra toda la historia'}
    >
      <Icon className="icon" aria-hidden="true" weight="duotone" />
      <span>
        Escudo<span className="shield-toggle__state"> {enabled ? 'activo' : 'apagado'}</span>
      </span>
    </button>
  );
}
