import type { Character, Game, LoreEvent, Marker, Relation, Saga } from './schema';

/**
 * Progreso del jugador en una saga: por cada juego, cuántas etapas ha terminado
 * (0 = sin jugar, chapters.length = juego terminado).
 */
export type SagaProgress = Record<string, number>;

export interface Shield {
  /** Con el escudo apagado se muestra todo. */
  enabled: boolean;
  progress: SagaProgress;
}

const characterIndex = new WeakMap<Saga, Map<string, Character>>();

export function charactersById(saga: Saga): Map<string, Character> {
  let index = characterIndex.get(saga);
  if (!index) {
    index = new Map(saga.characters.map((c) => [c.id, c]));
    characterIndex.set(saga, index);
  }
  return index;
}

/** Un dato descubierto durante la etapa N es visible cuando el jugador terminó esa etapa. */
export function isRevealed(marker: Marker | undefined, shield: Shield): boolean {
  if (!shield.enabled || !marker) return true;
  return (shield.progress[marker.game] ?? 0) > marker.chapter;
}

export function isCharacterKnown(character: Character, shield: Shield): boolean {
  return isRevealed(character.appears, shield);
}

/** Una relación solo se muestra si se conocen la relación y los dos personajes. */
export function isRelationVisible(relation: Relation, saga: Saga, shield: Shield): boolean {
  if (!isRevealed(relation.at, shield)) return false;
  const byId = charactersById(saga);
  const from = byId.get(relation.from);
  const to = byId.get(relation.to);
  return !!from && !!to && isCharacterKnown(from, shield) && isCharacterKnown(to, shield);
}

/**
 * Nombre de una etapa. Los nombres también pueden ser spoilers ("La batalla de…"),
 * así que solo se muestran los de etapas terminadas y la que se está jugando.
 * Sin escudo conocido (HTML estático) se usa siempre la forma genérica.
 */
export function chapterLabel(game: Game, index: number, shield?: Shield): string {
  const known = shield && (!shield.enabled || index <= (shield.progress[game.id] ?? 0));
  const name = game.chapters[index];
  return known && name ? name : `etapa ${index + 1} de ${game.chapters.length}`;
}

/** "The Witcher 3: Wild Hunt · etapa 3 de 5" — para decirle al jugador cuándo se desbloquea algo. */
export function describeMarker(saga: Saga, marker: Marker, shield?: Shield): string {
  const game = saga.games.find((g) => g.id === marker.game);
  if (!game) return marker.game;
  return `${game.title} · ${chapterLabel(game, marker.chapter, shield)}`;
}

export function gamesByRelease(saga: Saga) {
  return [...saga.games].sort((a, b) => a.year - b.year);
}

export type TimelineMode = 'universo' | 'lanzamiento';

/**
 * Orden de la línea de tiempo. "universo" sigue la cronología interna de la saga;
 * "lanzamiento" sigue el orden en que un jugador la habría descubierto.
 */
export function sortEvents(saga: Saga, mode: TimelineMode): LoreEvent[] {
  const release = new Map(gamesByRelease(saga).map((g, i) => [g.id, i]));
  const byRelease = (a: LoreEvent, b: LoreEvent) =>
    (release.get(a.at.game) ?? 0) - (release.get(b.at.game) ?? 0) ||
    a.at.chapter - b.at.chapter ||
    a.order - b.order;
  const byUniverse = (a: LoreEvent, b: LoreEvent) => a.order - b.order || byRelease(a, b);
  return [...saga.events].sort(mode === 'universo' ? byUniverse : byRelease);
}

export type FogRun<T> = { kind: 'visible'; item: T } | { kind: 'fog'; items: T[] };

/**
 * Agrupa los elementos ocultos consecutivos en un solo "banco de niebla", para no
 * mostrar una tarjeta de candado por cada evento que el jugador aún no vio.
 */
export function groupFog<T>(items: T[], visible: (item: T) => boolean): FogRun<T>[] {
  const runs: FogRun<T>[] = [];
  for (const item of items) {
    if (visible(item)) runs.push({ kind: 'visible', item });
    else {
      const last = runs[runs.length - 1];
      if (last?.kind === 'fog') last.items.push(item);
      else runs.push({ kind: 'fog', items: [item] });
    }
  }
  return runs;
}

export interface HiddenCount {
  events: number;
  characters: number;
  relations: number;
  reveals: number;
}

export function countHidden(saga: Saga, shield: Shield): HiddenCount {
  return {
    events: saga.events.filter((e) => !isRevealed(e.at, shield)).length,
    characters: saga.characters.filter((c) => !isCharacterKnown(c, shield)).length,
    relations: saga.relations.filter((r) => !isRelationVisible(r, saga, shield)).length,
    reveals: saga.characters.flatMap((c) => c.reveals).filter((r) => !isRevealed(r.at, shield))
      .length,
  };
}

/** Porcentaje de etapas terminadas en toda la saga. */
export function completion(saga: Saga, progress: SagaProgress): number {
  const total = saga.games.reduce((n, g) => n + g.chapters.length, 0);
  const done = saga.games.reduce((n, g) => n + clampChapter(progress[g.id], g.chapters.length), 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** Marca como terminado ese juego y todos los que salieron antes. */
export function completeUpTo(saga: Saga, progress: SagaProgress, gameId: string): SagaProgress {
  const target = saga.games.find((g) => g.id === gameId);
  if (!target) return progress;
  const next = { ...progress };
  for (const g of saga.games) if (g.year <= target.year) next[g.id] = g.chapters.length;
  return next;
}

export function completeAll(saga: Saga): SagaProgress {
  return Object.fromEntries(saga.games.map((g) => [g.id, g.chapters.length]));
}

function clampChapter(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), max);
}

/**
 * Limpia el progreso leído de localStorage: descarta juegos que ya no existen
 * y ajusta valores fuera de rango, para que datos viejos o manipulados no rompan nada.
 */
export function sanitizeProgress(saga: Saga, raw: unknown): SagaProgress {
  if (!raw || typeof raw !== 'object') return {};
  const out: SagaProgress = {};
  for (const g of saga.games) {
    const v = clampChapter((raw as Record<string, unknown>)[g.id], g.chapters.length);
    if (v > 0) out[g.id] = v;
  }
  return out;
}
