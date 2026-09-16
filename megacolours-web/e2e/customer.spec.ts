import { test, expect } from '@playwright/test';

test('cotización completa desde móvil con imagen y confirmación', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Haz que');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.getByRole('link', { name: /Empieza a cotizar/i }).click();
  await expect(page.getByLabel('Producto', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Producto', { exact: true }).locator('option')).not.toHaveCount(0);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1sAAAAASUVORK5CYII=', 'base64');
  await page.locator('input[type=file]').setInputFiles({ name: 'muestra.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('muestra.png', { exact: true })).toBeVisible();
  await page.getByLabel('Nombre', { exact: true }).fill('Cliente de prueba');
  await page.getByLabel('Teléfono', { exact: true }).fill('+56912345678');
  await page.getByLabel('Email', { exact: true }).fill('cliente@example.invalid');
  const submit = page.getByRole('button', { name: /Solicitar cotización/ });
  await expect(submit).toBeEnabled();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/quote-mobile.png', fullPage: true });
  await submit.click();
  await expect(page.getByText('Cotización recibida', { exact: true })).toBeVisible();
  await expect(page.getByText(/MC-\d{4}-\d{6}/)).toBeVisible();
});

test('landing de escritorio y acceso administrativo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.goto('/admin');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('test-admin@megacolours.invalid');
  await page.getByLabel('Contraseña', { exact: true }).fill('Isolated-browser-test-password-2026!');
  await page.getByRole('button', { name: /Entrar al panel/ }).click();
  await expect(page.getByRole('button', { name: /Nuevo producto/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
});
