import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Saga } from '../src/lib/schema';
import {
  completeAll,
  completeUpTo,
  completion,
  countHidden,
  describeMarker,
  isRelationVisible,
  isRevealed,
  sanitizeProgress,
  sortEvents,
  type Shield,
} from '../src/lib/spoilers';

// Saga mínima donde el orden interno no coincide con el de lanzamiento (como Red Dead).
const saga: Saga = {
  id: 'prueba',
  title: 'Saga de prueba',
  tagline: 'Una saga inventada',
  studio: 'Estudio',
  genre: 'Aventura',
  accent: '#336699',
  synopsis: 'Sin spoilers.',
  games: [
    { id: 'secuela', title: 'La secuela', year: 2010, chapters: ['Uno', 'Dos'] },
    { id: 'precuela', title: 'La precuela', year: 2018, chapters: ['Prólogo', 'Nudo', 'Final'] },
  ],
  characters: [
    { id: 'heroe', name: 'Héroe', role: 'Protagonista', intro: 'Conocido.', reveals: [] },
    {
      id: 'villano',
      name: 'Villano',
      role: 'Sorpresa',
      intro: 'Oculto.',
      appears: { game: 'precuela', chapter: 1 },
      reveals: [{ text: 'Era el hermano', at: { game: 'precuela', chapter: 2 } }],
    },
  ],
  events: [
    { id: 'a', title: 'A', date: '1911', order: 30, at: { game: 'secuela', chapter: 0 }, text: '', characters: [], major: true },
    { id: 'b', title: 'B', date: '1899', order: 10, at: { game: 'precuela', chapter: 0 }, text: '', characters: [], major: false },
    { id: 'c', title: 'C', date: '1900', order: 20, at: { game: 'precuela', chapter: 2 }, text: '', characters: [], major: true },
  ],
  relations: [
    { from: 'heroe', to: 'villano', kind: 'enemigo', detail: '', at: { game: 'precuela', chapter: 0 } },
  ],
};

const shield = (progress: Shield['progress'], enabled = true): Shield => ({ enabled, progress });

describe('isRevealed', () => {
  it('un dato de la etapa N se revela al terminar la etapa N, no antes', () => {
    const at = { game: 'precuela', chapter: 1 };
    expect(isRevealed(at, shield({ precuela: 1 }))).toBe(false);
    expect(isRevealed(at, shield({ precuela: 2 }))).toBe(true);
  });

  it('sin progreso solo se ve lo que no tiene marca', () => {
    expect(isRevealed(undefined, shield({}))).toBe(true);
    expect(isRevealed({ game: 'secuela', chapter: 0 }, shield({}))).toBe(false);
  });

  it('con el escudo apagado se ve todo', () => {
    expect(isRevealed({ game: 'precuela', chapter: 2 }, shield({}, false))).toBe(true);
  });

  it('avanzar nunca vuelve a ocultar algo ya revelado (monotonía)', () => {
    fc.assert(
      fc.property(fc.nat(5), fc.nat(5), fc.nat(5), (chapter, a, b) => {
        const at = { game: 'precuela', chapter };
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        return !isRevealed(at, shield({ precuela: lo })) || isRevealed(at, shield({ precuela: hi }));
      }),
    );
  });
});

describe('relaciones', () => {
  it('esperan a conocer la relación y a los dos personajes', () => {
    const [rel] = saga.relations;
    // La relación se marca en la etapa 0, pero el villano aparece en la etapa 1.
    expect(isRelationVisible(rel, saga, shield({ precuela: 1 }))).toBe(false);
    expect(isRelationVisible(rel, saga, shield({ precuela: 2 }))).toBe(true);
  });
});

describe('sortEvents', () => {
  it('cronología interna sigue el campo order', () => {
    expect(sortEvents(saga, 'universo').map((e) => e.id)).toEqual(['b', 'c', 'a']);
  });

  it('orden de lanzamiento sigue el año del juego y luego la etapa', () => {
    expect(sortEvents(saga, 'lanzamiento').map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('no modifica el arreglo original', () => {
    const before = saga.events.map((e) => e.id);
    sortEvents(saga, 'universo');
    expect(saga.events.map((e) => e.id)).toEqual(before);
  });
});

describe('progreso', () => {
  it('countHidden cuenta lo oculto con el progreso actual', () => {
    expect(countHidden(saga, shield({}))).toEqual({ events: 3, characters: 1, relations: 1, reveals: 1 });
    expect(countHidden(saga, shield(completeAll(saga)))).toEqual({
      events: 0,
      characters: 0,
      relations: 0,
      reveals: 0,
    });
  });

  it('completion calcula el porcentaje de etapas terminadas', () => {
    expect(completion(saga, {})).toBe(0);
    expect(completion(saga, { secuela: 2, precuela: 1 })).toBe(60);
    expect(completion(saga, completeAll(saga))).toBe(100);
  });

  it('completeUpTo marca el juego elegido y los que salieron antes', () => {
    expect(completeUpTo(saga, {}, 'secuela')).toEqual({ secuela: 2 });
    expect(completeUpTo(saga, {}, 'precuela')).toEqual({ secuela: 2, precuela: 3 });
    expect(completeUpTo(saga, { precuela: 1 }, 'no-existe')).toEqual({ precuela: 1 });
  });

  it('sanitizeProgress descarta basura y ajusta valores fuera de rango', () => {
    expect(sanitizeProgress(saga, null)).toEqual({});
    expect(sanitizeProgress(saga, 'texto')).toEqual({});
    expect(sanitizeProgress(saga, { secuela: 99, precuela: -4, otro: 2 })).toEqual({ secuela: 2 });
    expect(sanitizeProgress(saga, { secuela: 1.7, precuela: 'x' })).toEqual({ secuela: 1 });
  });

  it('sanitizeProgress siempre devuelve valores válidos (propiedad)', () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.anything()), (raw) => {
        const out = sanitizeProgress(saga, raw);
        return Object.entries(out).every(([id, v]) => {
          const game = saga.games.find((g) => g.id === id);
          return !!game && Number.isInteger(v) && v >= 1 && v <= game.chapters.length;
        });
      }),
    );
  });
});

describe('describeMarker', () => {
  it('solo nombra etapas terminadas o en curso: el nombre también puede ser spoiler', () => {
    expect(describeMarker(saga, { game: 'precuela', chapter: 1 })).toBe('La precuela · etapa 2 de 3');
    expect(describeMarker(saga, { game: 'precuela', chapter: 1 }, shield({ precuela: 1 }))).toBe('La precuela · Nudo');
    expect(describeMarker(saga, { game: 'precuela', chapter: 2 }, shield({ precuela: 1 }))).toBe('La precuela · etapa 3 de 3');
    expect(describeMarker(saga, { game: 'precuela', chapter: 2 }, shield({}, false))).toBe('La precuela · Final');
  });
});
