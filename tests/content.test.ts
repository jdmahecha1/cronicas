import { describe, expect, it } from 'vitest';
import { loadSagas } from '../src/lib/data';
import { checkSaga } from '../src/lib/integrity';
import { sagaSchema } from '../src/lib/schema';

const files = import.meta.glob('../src/content/sagas/*.json', { eager: true, import: 'default' });

describe('contenido de las sagas', () => {
  it('hay al menos seis sagas', () => {
    expect(Object.keys(files).length).toBeGreaterThanOrEqual(6);
  });

  for (const [path, raw] of Object.entries(files)) {
    const name = path.split('/').pop();

    it(`${name} cumple el esquema y no tiene referencias rotas`, () => {
      const saga = sagaSchema.parse(raw);
      expect(checkSaga(saga)).toEqual([]);
    });

    it(`${name} no revela spoilers en los textos públicos`, () => {
      const saga = sagaSchema.parse(raw);
      // Los textos públicos no deben nombrar personajes ocultos.
      const hidden = saga.characters.filter((c) => c.appears).map((c) => c.name);
      const publicTexts = [
        saga.tagline,
        saga.synopsis,
        ...saga.characters.filter((c) => !c.appears).flatMap((c) => [c.role, c.intro]),
      ];
      for (const name of hidden)
        for (const text of publicTexts) expect(text, `"${name}" aparece en: ${text}`).not.toContain(name);
    });
  }

  it('la colección completa carga sin errores', () => {
    expect(() => loadSagas(files)).not.toThrow();
  });
});
