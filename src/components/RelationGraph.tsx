import { GraphIcon, ListBulletsIcon } from '@phosphor-icons/react/dist/ssr';
import { useMemo, useState } from 'react';
import { layoutGraph } from '../lib/graph-layout';
import { RELATION_KINDS, type RelationKind } from '../lib/kinds';
import type { Saga } from '../lib/schema';
import { charactersById, isCharacterKnown, isRelationVisible } from '../lib/spoilers';
import { characterUrl } from '../lib/url';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

/*
 * Tres colores validados para daltonismo (todos contra todos, sobre las siete
 * superficies del sitio) y el trazo como segunda pista dentro de cada familia.
 */
const BLUE = '#3987e5';
const ORANGE = '#d95926';
const AQUA = '#199e70';

export const KIND_STYLE: Record<RelationKind, { color: string; dash?: string; label: string; family: string }> = {
  aliado: { color: BLUE, label: 'Aliados', family: 'Vínculos' },
  mentor: { color: BLUE, dash: '12 5 2 5', label: 'Mentor', family: 'Vínculos' },
  enemigo: { color: ORANGE, label: 'Enemigos', family: 'Conflictos' },
  rival: { color: ORANGE, dash: '9 7', label: 'Rivales', family: 'Conflictos' },
  familia: { color: AQUA, label: 'Familia', family: 'Afectos' },
  romance: { color: AQUA, dash: '1 7', label: 'Romance', family: 'Afectos' },
};

const ORDER: RelationKind[] = ['aliado', 'mentor', 'enemigo', 'rival', 'familia', 'romance'];

export default function RelationGraph({ saga }: Props) {
  const shield = useShield(saga);
  const layout = useMemo(() => layoutGraph(saga), [saga]);
  const people = charactersById(saga);
  const [active, setActive] = useState<string | null>(null);
  const [kinds, setKinds] = useState<Set<RelationKind>>(() => new Set(RELATION_KINDS));
  const [asList, setAsList] = useState(false);

  const visible = saga.relations.filter((r) => kinds.has(r.kind) && isRelationVisible(r, saga, shield));
  const hiddenRelations = saga.relations.filter((r) => !isRelationVisible(r, saga, shield)).length;
  const neighbours = new Set<string>();
  if (active)
    for (const r of visible) {
      if (r.from === active) neighbours.add(r.to);
      if (r.to === active) neighbours.add(r.from);
    }
  const activeName = active ? people.get(active)?.name : null;

  const toggleKind = (kind: RelationKind) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  return (
    <div className="graph">
      <div className="graph__bar">
        <div className="graph__legend" role="group" aria-label="Tipos de relación">
          {ORDER.map((kind) => {
            const style = KIND_STYLE[kind];
            return (
              <button
                key={kind}
                type="button"
                className="graph__kind"
                aria-pressed={kinds.has(kind)}
                onClick={() => toggleKind(kind)}
              >
                <svg width="30" height="10" aria-hidden="true">
                  <line x1="2" y1="5" x2="28" y2="5" stroke={style.color} strokeWidth="3" strokeDasharray={style.dash} strokeLinecap="round" />
                </svg>
                {style.label}
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn--sm" aria-pressed={asList} onClick={() => setAsList((v) => !v)}>
          {asList ? <GraphIcon className="icon" aria-hidden="true" /> : <ListBulletsIcon className="icon" aria-hidden="true" />}
          {asList ? 'Ver como mapa' : 'Ver como lista'}
        </button>
      </div>

      {asList ? (
        <ul className="graph__list">
          {visible.length === 0 && <li className="muted">Aún no conoces ninguna relación de esta saga.</li>}
          {visible.map((r) => {
            const a = people.get(r.from)!;
            const b = people.get(r.to)!;
            const style = KIND_STYLE[r.kind];
            return (
              <li key={`${r.from}-${r.to}-${r.kind}`}>
                <svg width="30" height="10" aria-hidden="true">
                  <line x1="2" y1="5" x2="28" y2="5" stroke={style.color} strokeWidth="3" strokeDasharray={style.dash} strokeLinecap="round" />
                </svg>
                <span>
                  <a href={characterUrl(saga.id, a.id)}>{a.name}</a> y{' '}
                  <a href={characterUrl(saga.id, b.id)}>{b.name}</a>
                  <span className="graph__kind-name">: {style.label.toLowerCase()}.</span> {r.detail}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="graph__canvas">
          {visible.length === 0 && shield.enabled && (
            <p className="graph__empty fog-card">
              <strong>Todas las relaciones siguen en la niebla.</strong> Aparecen a medida que guardas tu partida.
            </p>
          )}
          {/* role="group" y no "img": "img" volvería invisibles los enlaces a cada personaje. */}
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="group"
            aria-label={`Mapa de relaciones de ${saga.title}${activeName ? `, resaltando a ${activeName}` : ''}`}
          >
            <g aria-hidden="true">
              {visible.map((r) => {
                const a = layout.nodes.get(r.from);
                const b = layout.nodes.get(r.to);
                if (!a || !b) return null;
                const style = KIND_STYLE[r.kind];
                const dim = active && r.from !== active && r.to !== active;
                return (
                  <line
                    key={`${r.from}-${r.to}-${r.kind}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={style.color}
                    strokeWidth={dim ? 1.5 : 3}
                    strokeDasharray={style.dash}
                    strokeLinecap="round"
                    opacity={dim ? 0.18 : 0.95}
                  />
                );
              })}
            </g>
            {saga.characters.map((c) => {
              const node = layout.nodes.get(c.id);
              if (!node) return null;
              const known = isCharacterKnown(c, shield);
              const radius = 16 + Math.min(node.degree, 8) * 1.6;
              const dim = active && active !== c.id && !neighbours.has(c.id);
              const body = (
                <>
                  <circle r={radius} className={known ? 'graph__node' : 'graph__node is-fog'} />
                  <text className="graph__initial" dy="0.35em" aria-hidden="true">
                    {known ? initials(c.name) : '?'}
                  </text>
                  {known && (
                    <text className="graph__label" y={radius + 18}>
                      {c.name}
                    </text>
                  )}
                </>
              );
              return (
                <g
                  key={c.id}
                  transform={`translate(${node.x} ${node.y})`}
                  opacity={dim ? 0.25 : 1}
                  onMouseEnter={() => known && setActive(c.id)}
                  onMouseLeave={() => setActive(null)}
                >
                  {known ? (
                    <a
                      href={characterUrl(saga.id, c.id)}
                      onFocus={() => setActive(c.id)}
                      onBlur={() => setActive(null)}
                    >
                      {/* Sin aria-label: el nombre accesible es el visible (necesario para el control por voz). */}
                      {body}
                    </a>
                  ) : (
                    <g role="img" aria-label="Personaje en la niebla">
                      {body}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <p className="graph__note muted">
        {visible.length} {visible.length === 1 ? 'conexión a la vista' : 'conexiones a la vista'}
        {shield.enabled && hiddenRelations > 0 ? `, ${hiddenRelations} en la niebla` : ''}. Pasa el cursor
        o usa Tab para resaltar a alguien.
      </p>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
