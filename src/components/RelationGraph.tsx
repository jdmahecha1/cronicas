import { useMemo, useState } from 'react';
import { layoutGraph } from '../lib/graph-layout';
import { RELATION_KINDS, type RelationKind } from '../lib/kinds';
import type { Saga } from '../lib/schema';
import { isCharacterKnown, isRelationVisible } from '../lib/spoilers';
import { characterUrl } from '../lib/url';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

/** Color y trazo por tipo: el trazo distingue los tipos también sin percibir el color. */
export const KIND_STYLE: Record<RelationKind, { color: string; dash?: string; label: string }> = {
  aliado: { color: '#5cc489', label: 'Aliados' },
  enemigo: { color: '#e2635b', dash: '7 5', label: 'Enemigos' },
  familia: { color: '#e6b450', label: 'Familia' },
  romance: { color: '#e57fb8', dash: '2 5', label: 'Romance' },
  mentor: { color: '#6aa8f0', dash: '12 4 2 4', label: 'Mentor' },
  rival: { color: '#b28cf0', dash: '4 3', label: 'Rivales' },
};

export default function RelationGraph({ saga }: Props) {
  const shield = useShield(saga);
  const layout = useMemo(() => layoutGraph(saga), [saga]);
  const [active, setActive] = useState<string | null>(null);
  const [kinds, setKinds] = useState<Set<RelationKind>>(() => new Set(RELATION_KINDS));

  const visible = saga.relations.filter(
    (r) => kinds.has(r.kind) && isRelationVisible(r, saga, shield),
  );
  const neighbours = new Set<string>();
  if (active)
    for (const r of visible) {
      if (r.from === active) neighbours.add(r.to);
      if (r.to === active) neighbours.add(r.from);
    }
  const hiddenRelations = saga.relations.filter((r) => !isRelationVisible(r, saga, shield)).length;

  const toggleKind = (kind: RelationKind) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const activeName = active ? saga.characters.find((c) => c.id === active)?.name : null;

  return (
    <div className="graph">
      <div className="graph__legend" role="group" aria-label="Tipos de relación">
        {RELATION_KINDS.map((kind) => {
          const style = KIND_STYLE[kind];
          return (
            <button
              key={kind}
              type="button"
              className="graph__kind"
              aria-pressed={kinds.has(kind)}
              onClick={() => toggleKind(kind)}
            >
              <svg width="28" height="10" aria-hidden="true">
                <line x1="0" y1="5" x2="28" y2="5" stroke={style.color} strokeWidth="3" strokeDasharray={style.dash} />
              </svg>
              {style.label}
            </button>
          );
        })}
      </div>

      <div className="graph__canvas">
        {/* role="group" y no "img": "img" volvería invisibles los enlaces a cada personaje. */}
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label={`Mapa de relaciones de ${saga.title}${activeName ? `, resaltando a ${activeName}` : ''}`}
        >
          <g className="graph__edges" aria-hidden="true">
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
                  strokeWidth={dim ? 1.5 : 2.5}
                  strokeDasharray={style.dash}
                  strokeLinecap="round"
                  opacity={dim ? 0.15 : 0.85}
                >
                  <title>{r.detail}</title>
                </line>
              );
            })}
          </g>
          <g className="graph__nodes">
            {saga.characters.map((c) => {
              const node = layout.nodes.get(c.id);
              if (!node) return null;
              const known = isCharacterKnown(c, shield);
              const radius = 14 + Math.min(node.degree, 8) * 1.6;
              const dim = active && active !== c.id && !neighbours.has(c.id);
              const label = known ? c.name : '???';
              const body = (
                <>
                  <circle
                    r={radius}
                    className={known ? 'graph__node' : 'graph__node graph__node--unknown'}
                  />
                  <text className="graph__initial" dy="0.35em" aria-hidden="true">
                    {known ? initials(c.name) : '?'}
                  </text>
                  <text className="graph__label" y={radius + 16}>
                    {label}
                  </text>
                </>
              );
              return (
                <g
                  key={c.id}
                  transform={`translate(${node.x} ${node.y})`}
                  opacity={dim ? 0.3 : 1}
                  onMouseEnter={() => known && setActive(c.id)}
                  onMouseLeave={() => setActive(null)}
                >
                  {known ? (
                    <a
                      href={characterUrl(saga.id, c.id)}
                      onFocus={() => setActive(c.id)}
                      onBlur={() => setActive(null)}
                      aria-label={`${c.name}: ${c.role}`}
                    >
                      {body}
                    </a>
                  ) : (
                    <g role="img" aria-label="Personaje oculto">{body}</g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="graph__note muted">
        {visible.length} conexiones visibles
        {shield.enabled && hiddenRelations > 0 ? ` · ${hiddenRelations} ocultas hasta que avances` : ''}.
        Pasa el cursor o navega con Tab para resaltar a un personaje.
      </p>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
