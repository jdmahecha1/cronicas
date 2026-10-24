import { expect, test } from '@playwright/test';

test.describe('escudo de spoilers', () => {
  test('sin progreso, la historia de Red Dead queda oculta', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await expect(page.getByRole('heading', { level: 1, name: 'Red Dead Redemption' })).toBeVisible();
    await expect(page.locator('.timeline__card--veiled').first()).toBeVisible();
    await expect(page.getByText('Ocultando', { exact: false })).toBeVisible();
    // El texto de un evento oculto no está en el DOM, ni siquiera escondido con CSS.
    await expect(page.locator('body')).not.toContainText('Hosea es ejecutado');
  });

  test('al marcar progreso se revela lo vivido y nada más', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await page.getByRole('combobox', { name: 'Red Dead Redemption 2', exact: true }).selectOption('3');
    await expect(page.getByRole('heading', { name: 'El fallido golpe del ferry de Blackwater' })).toBeVisible();
    // El banco de Saint Denis ocurre en el capítulo 4: debe seguir oculto.
    await expect(page.locator('body')).not.toContainText('Hosea es ejecutado');

    // El progreso persiste al recargar.
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Red Dead Redemption 2', exact: true })).toHaveValue('3');
    await expect(page.getByRole('heading', { name: 'El fallido golpe del ferry de Blackwater' })).toBeVisible();
  });

  test('apagar el escudo muestra toda la historia', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
    await page.getByRole('button', { name: /Escudo activo/ }).click();
    await expect(page.getByRole('button', { name: /Escudo apagado/ })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.timeline__card--veiled')).toHaveCount(0);
    await expect(page.locator('body')).toContainText('Hosea es ejecutado');
  });

  test('"Mostrar igual" revela un solo evento', async ({ page }) => {
    await page.goto('sagas/red-dead-redemption/');
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
  // "tuberculosis" solo aparece en un dato oculto de Arthur Morgan.
  await page.getByLabel('Busca una saga, un personaje o un lugar').fill('tuberculosis');
  await expect(page.getByText('0 resultados', { exact: false })).toBeVisible();
});
