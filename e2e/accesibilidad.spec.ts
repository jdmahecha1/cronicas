import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Auditoría WCAG 2.1 AA automática (axe-core) de las páginas principales.
const pages = [
  ['portada', ''],
  ['saga sin partida', 'sagas/red-dead-redemption/'],
  ['saga de otro tema', 'sagas/mass-effect/'],
  ['personaje', 'sagas/the-witcher/personajes/geralt/'],
  ['búsqueda', 'buscar/'],
  ['cómo funciona', 'acerca/'],
];

for (const [name, path] of pages) {
  test(`sin fallos WCAG 2.1 AA: ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
}
