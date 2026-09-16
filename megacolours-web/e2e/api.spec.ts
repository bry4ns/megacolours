import { test, expect } from '@playwright/test';

test('precio autoritativo, acceso administrativo e historial inmutable', async ({ request }) => {
  const unauthorized = await request.get('/api/admin/quotes');
  expect(unauthorized.status()).toBe(401);

  const catalog = await (await request.get('/api/catalog')).json();
  const product = catalog.products.find((p: { pricingMode: string; allowCustomDimensions: boolean }) => p.pricingMode === 'AREA' && p.allowCustomDimensions);
  expect(product).toBeTruthy();
  const selection = { productId: product.id, width: 100, height: 100, quantity: 2, options: [], deliveryMethodId: catalog.deliveryMethods[0].id };
  const estimateResponse = await request.post('/api/quotes/estimate', { data: selection });
  expect(estimateResponse.ok()).toBeTruthy();
  const estimate = await estimateResponse.json();
  expect(Number.isSafeInteger(estimate.total)).toBeTruthy();
  expect(estimate.subtotal).toBe(Math.max(product.minimumPrice, product.pricePerM2) * 2);
  for (const bad of [{ ...selection, finalPrice: 1 }, { ...selection, quantity: -1 }, { ...selection, width: 0.1 }, { ...selection, productId: 'nonexistent' }]) {
    expect((await request.post('/api/quotes/estimate', { data: bad })).status()).toBe(400);
  }

  const customer = { name: 'Prueba de integración', phone: '+56912345678', email: 'integration@example.invalid' };
  const created = await request.post('/api/quotes', { data: { selection, customer } });
  expect(created.status()).toBe(201);
  const quote = await created.json();
  expect(quote.reference).toMatch(/^MC-\d{4}-\d{6,}$/);
  expect(quote.snapshot.total).toBe(estimate.total);

  const login = await request.post('/api/admin/login', { data: { email: 'test-admin@megacolours.invalid', password: 'Isolated-browser-test-password-2026!' } });
  expect(login.ok()).toBeTruthy();
  const oldProduct = (await (await request.get('/api/admin/catalog')).json()).products.find((p: { id: string }) => p.id === product.id);
  expect((await request.put(`/api/admin/products/${product.id}`, { data: { ...oldProduct, pricePerM2: -1 } })).status()).toBe(400);
  expect((await request.put(`/api/admin/products/${product.id}`, { data: { ...oldProduct, dimensionStep: 0 } })).status()).toBe(400);
  expect((await request.put(`/api/admin/products/${product.id}`, { data: { ...oldProduct, image: 'javascript:alert(1)' } })).status()).toBe(400);
  expect((await request.put(`/api/admin/products/${product.id}`, { data: oldProduct, headers: { Origin: 'https://untrusted.invalid' } })).status()).toBe(403);
  const changed = await request.put(`/api/admin/products/${product.id}`, { data: { ...oldProduct, pricePerM2: oldProduct.pricePerM2 + 1000 } });
  expect(changed.ok()).toBeTruthy();
  const updatedPrice = await (await request.post('/api/quotes/estimate', { data: selection })).json();
  expect(updatedPrice.total).toBeGreaterThan(estimate.total);
  expect((await request.patch(`/api/admin/quotes/${quote.id}/status`, { data: { status: 'CONTACTED' } })).ok()).toBeTruthy();
  const stored = (await (await request.get('/api/admin/quotes')).json()).quotes.find((q: { id: string }) => q.id === quote.id);
  expect(stored.snapshot.total).toBe(estimate.total);
  expect(stored.history.map((h: { status: string }) => h.status)).toEqual(['PENDING', 'CONTACTED']);
  expect((await request.put(`/api/admin/products/${product.id}`, { data: oldProduct })).ok()).toBeTruthy();
  expect((await request.post('/api/admin/logout')).ok()).toBeTruthy();
  expect((await request.get('/api/admin/catalog')).status()).toBe(401);
});

test('conserva el archivo original y rechaza archivos o encuadres inválidos', async ({ request }) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1sAAAAASUVORK5CYII=', 'base64');
  const upload = await request.post('/api/uploads', { multipart: { file: { name: 'original.png', mimeType: 'image/png', buffer: png } } });
  expect(upload.ok()).toBeTruthy();
  const image = await upload.json();
  expect(image.width).toBe(1);
  expect(image.height).toBe(1);
  const original = await request.get(image.url);
  expect(original.ok()).toBeTruthy();
  expect(await original.body()).toEqual(png);
  expect(original.headers()['x-content-type-options']).toBe('nosniff');
  expect((await request.post('/api/uploads', { multipart: { file: { name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('<script>alert(1)</script>') } } })).status()).toBe(400);
  expect((await request.post('/api/uploads', { multipart: { file: { name: 'mismatch.jpg', mimeType: 'image/jpeg', buffer: png } } })).status()).toBe(400);
  const catalog = await (await request.get('/api/catalog')).json();
  const product = catalog.products.find((p: { allowCustomDimensions: boolean }) => p.allowCustomDimensions);
  const selection = { productId: product.id, width: 100, height: 100, quantity: 1, options: [], deliveryMethodId: catalog.deliveryMethods[0].id };
  const data = { selection, customer: { name: 'Imagen prueba', email: 'image@example.invalid', phone: '+56912345678' }, uploadId: image.id, crop: { x: 0.5, y: 0.5, zoom: 1.5, rotation: 0 } };
  expect((await request.post('/api/quotes', { data: { ...data, finalPrice: 1 } })).status()).toBe(400);
  expect((await request.post('/api/quotes', { data: { ...data, crop: { ...data.crop, y: 2 } } })).status()).toBe(400);
  expect((await request.post('/api/quotes', { data: { ...data, customer: { ...data.customer, email: 'invalid' } } })).status()).toBe(400);
  expect((await request.post('/api/quotes', { data })).status()).toBe(201);
});
