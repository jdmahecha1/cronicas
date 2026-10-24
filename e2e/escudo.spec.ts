import { expect, test, type Page } from '@playwright/test';

/** Espera a que todas las islas de React estén hidratadas antes de interactuar. */
async function hydrated(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
}

test.describe('escudo de spoilers', () => {
  test('sin progreso, la historia de Red Dead queda oculta', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Red Dead Redemption' })).toBeVisible();
    await expect(page.locator('.timeline__card--veiled').first()).toBeVisible();
    await expect(page.getByText('Ocultando', { exact: false })).toBeVisible();
    // El texto de un evento oculto no está en el DOM, ni siquiera escondido con CSS.
    await expect(page.locator('body')).not.toContainText('Hosea es ejecutado');
  });

  test('al marcar progreso se revela lo vivido y nada más', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await page.getByRole('combobox', { name: 'Red Dead Redemption 2', exact: true }).selectOption('3');
    await expect(page.getByRole('heading', { name: 'El fallido golpe del ferry de Blackwater' })).toBeVisible();
    // El banco de Saint Denis ocurre en el capítulo 4: debe seguir oculto.
    await expect(page.locator('body')).not.toContainText('Hosea es ejecutado');

    // El progreso persiste al recargar.
    await page.reload();
    await hydrated(page);
    await expect(page.getByRole('combobox', { name: 'Red Dead Redemption 2', exact: true })).toHaveValue('3');
    await expect(page.getByRole('heading', { name: 'El fallido golpe del ferry de Blackwater' })).toBeVisible();
  });

  test('apagar el escudo muestra toda la historia', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    await page.getByRole('button', { name: /Escudo activo/ }).click();
    await expect(page.getByRole('button', { name: /Escudo apagado/ })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.timeline__card--veiled')).toHaveCount(0);
    await expect(page.locator('body')).toContainText('Hosea es ejecutado');
  });

  test('"Mostrar igual" revela un solo evento', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await hydrated(page);
    const veiled = page.locator('.timeline__card--veiled');
    const before = await veiled.count();
    await veiled.first().getByRole('button', { name: 'Mostrar igual' }).click();
    await expect(veiled).toHaveCount(before - 1);
  });

  test('la página de un personaje oculto no revela su nombre', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/personajes/edgar-ross/');
    await expect(page).toHaveTitle(/Personaje oculto/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    await page.getByRole('button', { name: 'Mostrar igual' }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Edgar Ross' })).toBeVisible();
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
