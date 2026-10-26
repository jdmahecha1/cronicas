import { FloppyDiskIcon } from '@phosphor-icons/react/dist/ssr';
import type { Saga } from '../lib/schema';
import { completion } from '../lib/spoilers';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

/** Barra fija en móvil: tu partida siempre a mano, sin volver arriba. */
export default function SaveBar({ saga }: Props) {
  const shield = useShield(saga);
  const percent = completion(saga, shield.progress);
  return (
    <div className="savebar">
      <div className="savebar__meter" aria-hidden="true">
        <span style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <p className="savebar__text">
        <FloppyDiskIcon className="icon" aria-hidden="true" weight="duotone" />
        {shield.enabled ? `Partida: ${percent}%` : 'Escudo apagado'}
      </p>
      <a className="btn btn--sm btn--primary" href="#partida">
        Cambiar
      </a>
    </div>
  );
}
