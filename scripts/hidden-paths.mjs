import { readdirSync, readFileSync } from 'node:fs';

/** Rutas de personajes con `appears`: su nombre en la URL ya sería un spoiler. */
export function hiddenCharacterPaths(dir = new URL('../src/content/sagas/', import.meta.url)) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const saga = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
      return saga.characters
        .filter((c) => c.appears)
        .map((c) => `/sagas/${saga.id}/personajes/${c.id}/`);
    });
}
