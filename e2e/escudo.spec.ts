import { expect, test, type Page } from '@playwright/test';

/** Espera a que todas las islas de React estén hidratadas antes de interactuar. */
async function hydrated(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
}

/** El camino de puntos de un juego en la partida guardada. */
const savePath = (page: Page, game: string) => page.getByRole('radiogroup', { name: game, exact: true });

test.describe('escudo de spoilers', () => {
  test('sin partida, la historia de Red Dead queda en la niebla', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Red Dead Redemption' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '¿Hasta dónde jugaste?' })).toBeVisible();
    // Los eventos ocultos se agrupan en un solo banco de niebla, no en una tarjeta cada uno.
    await expect(page.locator('.timeline__fog')).toHaveCount(1);
    await expect(page.locator('.timeline__fog')).toContainText('19 eventos en la niebla');
    // El texto de un evento oculto no está en el DOM, ni siquiera escondido con CSS.
    await expect(page.locator('body')).not.toContainText('Hosea es ejecutado');
  });

  test('al guardar la partida se revela lo vivido y nada más', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await savePath(page, 'Red Dead Redemption 2').getByRole('radio').nth(3).check();
    await expect(page.getByRole('heading', { name: 'El fallido golpe del ferry de Blackwater' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tu partida' })).toBeVisible();
    // El banco de Saint Denis ocurre en el capítulo 4: debe seguir oculto.
    await expect(page.locator('body')).not.toContainText('Hosea es ejecutado');

    // La partida persiste al recargar.
    await page.reload();
    await hydrated(page);
    await expect(savePath(page, 'Red Dead Redemption 2').getByRole('radio').nth(3)).toBeChecked();
    await expect(page.getByRole('heading', { name: 'El fallido golpe del ferry de Blackwater' })).toBeVisible();
  });

  test('los nombres de capítulos futuros no se muestran', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    const radios = savePath(page, 'Red Dead Redemption 2').getByRole('radio');
    await expect(radios.nth(5)).toHaveAccessibleName('Terminé: etapa 5 de 8');
    await radios.nth(4).check();
    await expect(radios.nth(4)).toHaveAccessibleName('Terminé: Capítulo 4: Saint Denis');
  });

  test('apagar el escudo muestra toda la historia', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await page.getByRole('button', { name: /Escudo activo/ }).click();
    await expect(page.getByRole('button', { name: /Escudo apagado/ })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.timeline__fog')).toHaveCount(0);
    await expect(page.locator('body')).toContainText('Hosea es ejecutado');
  });

  test('"Ver spoilers" despeja un banco de niebla', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await page.locator('.timeline__fog').getByRole('button', { name: 'Ver spoilers' }).click();
    await expect(page.locator('.timeline__fog')).toHaveCount(0);
    await expect(page.locator('body')).toContainText('Hosea es ejecutado');
  });

  test('los personajes por conocer se agrupan y se pueden revelar', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    const group = page.locator('#personajes [data-fog-group]');
    await expect(group.locator('[data-fog-count]')).toHaveText('2 personajes por conocer');
    await expect(page.locator('#personajes')).not.toContainText('Edgar Ross');
    await group.getByRole('button', { name: 'Ver spoilers' }).click();
    await expect(page.locator('#personajes')).toContainText('Edgar Ross');
    await expect(group.locator('[data-fog-summary]')).toBeHidden();
  });

  test('la página de un personaje oculto no revela su nombre', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/personajes/edgar-ross/');
    await expect(page).toHaveTitle(/Personaje oculto/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver spoiler', exact: true }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Edgar Ross' })).toBeVisible();
  });

  test('el mapa de relaciones también se puede leer como lista', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await page.getByRole('button', { name: /Escudo activo/ }).click();
    await page.getByRole('button', { name: 'Ver como lista' }).click();
    await expect(page.locator('.graph__list li').first()).toBeVisible();
    await expect(page.locator('.graph__list')).toContainText('Arthur Morgan');
  });
});

test('la búsqueda encuentra personajes públicos', async ({ page }) => {
  await page.goto('buscar/');
  await hydrated(page);
  await page.getByLabel('Busca una saga, un personaje o un lugar').fill('Geralt');
  await expect(page.locator('.search__results a').first()).toContainText('Geralt');
});

test('la portada no tiene scroll horizontal', async ({ page }) => {
  await page.goto('');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('el índice de búsqueda no contiene texto protegido', async ({ page }) => {
  await page.goto('buscar/');
  await hydrated(page);
  // "tuberculosis" solo aparece en un dato oculto de Arthur Morgan.
  await page.getByLabel('Busca una saga, un personaje o un lugar').fill('tuberculosis');
  await expect(page.getByText('0 resultados', { exact: false })).toBeVisible();
});

test.describe('seguridad', () => {
  for (const path of ['', 'sagas/the-witcher/', 'sagas/the-witcher/personajes/geralt/', 'buscar/?q=Geralt', 'acerca/']) {
    test(`sin violaciones de la CSP ni errores en /${path}`, async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (msg) => msg.type() === 'error' && problems.push(msg.text()));
      page.on('pageerror', (err) => problems.push(err.message));
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) =>
          console.error(`CSP: ${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      if (path.startsWith('buscar')) await expect(page.locator('.search__results a').first()).toBeVisible();
      expect(problems).toEqual([]);
    });
  }

  test('la página declara una CSP sin unsafe-inline ni unsafe-eval en scripts', async ({ page }) => {
    await page.goto('');
    const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
    const scriptSrc = csp?.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(csp).toContain("object-src 'none'");
  });

  test('un ?q= malicioso no ejecuta código', async ({ page }) => {
    let dialog = false;
    page.on('dialog', async (d) => {
      dialog = true;
      await d.dismiss();
    });
    await page.goto('buscar/?q=' + encodeURIComponent('"><img src=x onerror=alert(1)><script>alert(2)</script>'));
    await page.waitForLoadState('networkidle');
    expect(dialog).toBe(false);
    await expect(page.locator('#buscar')).toHaveValue(/onerror/);
  });
});
