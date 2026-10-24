import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { safeExcerpt, safeResultUrl } from '../src/lib/search';

describe('safeExcerpt', () => {
  it('conserva el resaltado de Pagefind', () => {
    expect(safeExcerpt('El brujo <mark>Geralt</mark> de Rivia')).toBe('El brujo <mark>Geralt</mark> de Rivia');
  });

  it('elimina cualquier otra etiqueta', () => {
    expect(safeExcerpt('<img src=x onerror=alert(1)>hola')).toBe('hola');
    expect(safeExcerpt('<script>alert(1)</script>')).toBe('alert(1)');
    expect(safeExcerpt('<mark onclick=alert(1)>x</mark>')).toBe('x</mark>');
    expect(safeExcerpt('<svg/onload=alert(1)')).toBe('');
  });

  it('nunca deja pasar etiquetas que no sean <mark> (propiedad)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const out = safeExcerpt(input);
        return (out.match(/<[^>]*>?/g) ?? []).every((tag) => tag === '<mark>' || tag === '</mark>');
      }),
    );
  });
});

describe('safeResultUrl', () => {
  it('acepta rutas internas', () => {
    expect(safeResultUrl('/cronicas/sagas/the-witcher/')).toBe('/cronicas/sagas/the-witcher/');
  });

  it('rechaza esquemas peligrosos y dominios externos', () => {
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.example', 'https://evil.example/', '/a"onmouseover="x'])
      expect(safeResultUrl(bad)).toBeNull();
  });
});
