import type { Marker, Saga } from './schema';

/**
 * Comprueba lo que Zod no puede ver: que cada referencia apunte a algo que existe
 * y que ningún dato se revele en una etapa inexistente. Devuelve la lista de problemas.
 */
export function checkSaga(saga: Saga): string[] {
  const problems: string[] = [];
  const games = new Map(saga.games.map((g) => [g.id, g]));
  const characters = new Set(saga.characters.map((c) => c.id));

  const duplicates = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) problems.push(`${label} duplicado: ${id}`);
      seen.add(id);
    }
  };
  duplicates('Juego', saga.games.map((g) => g.id));
  duplicates('Personaje', saga.characters.map((c) => c.id));
  duplicates('Evento', saga.events.map((e) => e.id));

  const marker = (where: string, m: Marker) => {
    const game = games.get(m.game);
    if (!game) problems.push(`${where}: juego desconocido "${m.game}"`);
    else if (m.chapter >= game.chapters.length)
      problems.push(`${where}: "${m.game}" no tiene la etapa ${m.chapter}`);
  };

  for (const c of saga.characters) {
    if (c.appears) marker(`Personaje ${c.id}`, c.appears);
    c.reveals.forEach((r, i) => marker(`Personaje ${c.id}, dato ${i + 1}`, r.at));
  }
  for (const e of saga.events) {
    marker(`Evento ${e.id}`, e.at);
    for (const id of e.characters)
      if (!characters.has(id)) problems.push(`Evento ${e.id}: personaje desconocido "${id}"`);
  }
  for (const r of saga.relations) {
    const where = `Relación ${r.from} → ${r.to}`;
    marker(where, r.at);
    if (!characters.has(r.from)) problems.push(`${where}: personaje desconocido "${r.from}"`);
    if (!characters.has(r.to)) problems.push(`${where}: personaje desconocido "${r.to}"`);
    if (r.from === r.to) problems.push(`${where}: un personaje no puede relacionarse consigo mismo`);
  }
  return problems;
}

/** Los ids de juego se guardan por saga, pero también deben ser únicos entre sagas. */
export function checkCollection(sagas: Saga[]): string[] {
  const problems = sagas.flatMap((s) => checkSaga(s).map((p) => `[${s.id}] ${p}`));
  const owner = new Map<string, string>();
  for (const s of sagas) {
    if (owner.has(s.id)) problems.push(`Saga duplicada: ${s.id}`);
    owner.set(s.id, s.id);
    for (const g of s.games) {
      const prev = owner.get(`game:${g.id}`);
      if (prev) problems.push(`Juego "${g.id}" repetido en ${prev} y ${s.id}`);
      owner.set(`game:${g.id}`, s.id);
    }
  }
  return problems;
}
