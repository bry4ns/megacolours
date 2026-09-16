import Fastify, { FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type Metadata } from 'sharp';
import dotenv from 'dotenv';
import { calculate } from './pricing.js';
import { Store } from './store.js';
import { DeliveryMethod, Product, RequestError, deliverySchema, loginSchema, parse, productSchema, quoteSchema, selectionSchema, statusSchema } from './schema.js';

dotenv.config({ quiet: true });

function sameSecret(a: string, b: string) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

export function buildApp() {
  const app = Fastify({ logger: false, bodyLimit: 1024 * 1024 });
  const store = new Store(process.env.DATABASE_PATH || './data/megacolours.sqlite');
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || './data/uploads');
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || '';
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const sessionSecret = process.env.SESSION_SECRET || '';
  const allowedOrigins = new Set((process.env.WEB_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim()));
  const sessions = new Map<string, { email: string; expires: number }>();
  const attempts = new Map<string, { count: number; expires: number }>();
  const sessionSeconds = 8 * 60 * 60;

  app.register(cookie, sessionSecret ? { secret: sessionSecret } : {});
  app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 0, parts: 1 } });
  app.addHook('onClose', async () => store.close());
  app.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff').header('Cache-Control', 'no-store');
  });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof RequestError) return reply.code(error.statusCode).send({ error: error.message });
    const status = typeof error === 'object' && error !== null && 'statusCode' in error ? Number(error.statusCode) : 500;
    if (status === 413) return reply.code(413).send({ error: 'El archivo o solicitud supera el tamaño permitido' });
    if (status >= 400 && status < 500) return reply.code(status).send({ error: 'La solicitud no es válida' });
    return reply.code(500).send({ error: 'No se pudo completar la operación. Vuelve a intentar.' });
  });

  const sessionId = (req: FastifyRequest) => {
    const value = req.cookies.mc_session;
    if (!value || !sessionSecret) return null;
    const unsigned = req.unsignCookie(value);
    return unsigned.valid ? unsigned.value : null;
  };
  const authorize = (req: FastifyRequest) => {
    const id = sessionId(req), session = id ? sessions.get(id) : undefined;
    if (!session || session.expires <= Date.now()) {
      if (id) sessions.delete(id);
      throw new RequestError('Inicia sesión para continuar', 401);
    }
    return session.email;
  };
  app.addHook('onRequest', async req => {
    if (!req.url.startsWith('/api/admin/')) return;
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
      throw new RequestError('El origen de la solicitud no está permitido', 403);
    }
    if (req.url.split('?')[0] !== '/api/admin/login') authorize(req);
  });

  app.get('/api/catalog', async () => ({
    products: store.list<Product>('products').filter(p => p.active).map(p => ({
      ...p, presets: p.presets.filter(preset => preset.active), options: p.options.filter(option => option.active),
    })),
    deliveryMethods: store.list<DeliveryMethod>('deliveries').filter(d => d.active),
  }));
  app.post('/api/quotes/estimate', async req => {
    const selection = parse(selectionSchema, req.body, 'Configuración inválida');
    return calculate(selection, store.get<Product>('products', selection.productId), store.get<DeliveryMethod>('deliveries', selection.deliveryMethodId));
  });
  app.post('/api/uploads', async (req, reply) => {
    const part = await req.file();
    if (!part || part.fieldname !== 'file') throw new RequestError('Selecciona un archivo de imagen');
    const mimeToFormat: Record<string, string> = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
    if (!mimeToFormat[part.mimetype]) throw new RequestError('Utiliza una imagen JPEG, PNG o WebP');
    let bytes: Buffer;
    let metadata: Metadata;
    try {
      bytes = await part.toBuffer();
      metadata = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
    } catch { throw new RequestError('No se pudo leer la imagen. Usa JPEG, PNG o WebP de hasta 15 MB'); }
    if (part.file.truncated || metadata.format !== mimeToFormat[part.mimetype] || !metadata.width || !metadata.height ||
        metadata.width * metadata.height > 40_000_000 || (metadata.pages ?? 1) > 1) {
      throw new RequestError('El contenido de la imagen no coincide con su tipo o supera los límites permitidos');
    }
    const id = randomUUID();
    const originalName = path.basename(part.filename.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) || 'imagen';
    const upload = { id, originalName, mime: part.mimetype, width: metadata.width, height: metadata.height };
    await mkdir(uploadDir, { recursive: true });
    const filename = path.join(uploadDir, id);
    await writeFile(filename, bytes, { flag: 'wx' });
    try { store.addUpload(upload); } catch (error) { await unlink(filename); throw error; }
    return reply.code(201).send({ id, url: `/api/uploads/${id}`, originalName, width: upload.width, height: upload.height });
  });
  app.get<{ Params: { id: string } }>('/api/uploads/:id', async (req, reply) => {
    const upload = store.upload(req.params.id);
    if (!upload) throw new RequestError('No se encontró la imagen', 404);
    const fallbackName = upload.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    reply.header('Content-Disposition', `inline; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(upload.originalName)}`);
    return reply.type(upload.mime).send(await readFile(path.join(uploadDir, upload.id)));
  });
  app.post('/api/quotes', async (req, reply) => {
    const input = parse(quoteSchema, req.body, 'Cotización inválida');
    const delivery = store.get<DeliveryMethod>('deliveries', input.selection.deliveryMethodId);
    const snapshot = calculate(input.selection, store.get<Product>('products', input.selection.productId), delivery);
    if (delivery?.requiresAddress && !input.customer.address) throw new RequestError('Escribe la dirección para este método de entrega');
    if (input.uploadId && !store.upload(input.uploadId)) throw new RequestError('No se encontró la imagen adjunta', 404);
    return reply.code(201).send(store.createQuote(input, snapshot));
  });

  app.post('/api/admin/login', async (req, reply) => {
    if (!adminEmail || !adminPassword || !sessionSecret) throw new RequestError('El acceso administrativo aún no está configurado', 503);
    const login = parse(loginSchema, req.body, 'Datos de acceso inválidos');
    const now = Date.now();
    for (const [key, attempt] of attempts) if (attempt.expires <= now) attempts.delete(key);
    const attempt = attempts.get(req.ip);
    if (attempt && attempt.count >= 10) throw new RequestError('Demasiados intentos. Vuelve a intentar en 15 minutos', 429);
    const emailValid = sameSecret(login.email.toLowerCase(), adminEmail.toLowerCase());
    const passwordValid = sameSecret(login.password, adminPassword);
    if (!emailValid || !passwordValid) {
      if (attempts.size > 10_000) attempts.clear();
      attempts.set(req.ip, { count: (attempt?.count ?? 0) + 1, expires: attempt?.expires ?? now + 15 * 60 * 1000 });
      throw new RequestError('Correo o contraseña incorrectos', 401);
    }
    attempts.delete(req.ip);
    for (const [key, session] of sessions) if (session.expires <= now) sessions.delete(key);
    const previous = sessionId(req);
    if (previous) sessions.delete(previous);
    if (sessions.size >= 1000) throw new RequestError('Hay demasiadas sesiones activas. Intenta más tarde', 429);
    const id = randomBytes(32).toString('hex');
    sessions.set(id, { email: adminEmail, expires: now + sessionSeconds * 1000 });
    reply.setCookie('mc_session', id, { signed: true, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionSeconds });
    return { email: adminEmail };
  });
  app.get('/api/admin/session', async req => ({ email: authorize(req) }));
  app.post('/api/admin/logout', async (req, reply) => {
    const id = sessionId(req);
    if (id) sessions.delete(id);
    reply.clearCookie('mc_session', { path: '/' });
    return { ok: true };
  });
  app.get('/api/admin/catalog', async () => ({ products: store.list<Product>('products'), deliveryMethods: store.list<DeliveryMethod>('deliveries') }));
  const checkImages = (product: Product) => {
    for (const image of [product.image, ...product.presets.map(p => p.image)]) {
      if (image && !store.upload(image.split('/').at(-1)!)) throw new RequestError('Una imagen del producto no existe. Vuelve a cargarla.');
    }
  };
  app.post('/api/admin/products', async (req, reply) => {
    const product = parse(productSchema, req.body, 'Producto inválido');
    checkImages(product); store.insert('products', product);
    return reply.code(201).send(product);
  });
  app.put<{ Params: { id: string } }>('/api/admin/products/:id', async req => {
    const product = parse(productSchema, req.body, 'Producto inválido');
    if (product.id !== req.params.id) throw new RequestError('No se puede cambiar el identificador del producto');
    checkImages(product); store.update('products', product);
    return product;
  });
  app.post('/api/admin/delivery-methods', async (req, reply) => {
    const delivery = parse(deliverySchema, req.body, 'Método de entrega inválido');
    store.insert('deliveries', delivery);
    return reply.code(201).send(delivery);
  });
  app.put<{ Params: { id: string } }>('/api/admin/delivery-methods/:id', async req => {
    const delivery = parse(deliverySchema, req.body, 'Método de entrega inválido');
    if (delivery.id !== req.params.id) throw new RequestError('No se puede cambiar el identificador del método de entrega');
    store.update('deliveries', delivery);
    return delivery;
  });
  app.get('/api/admin/quotes', async () => ({ quotes: store.quotes() }));
  app.patch<{ Params: { id: string } }>('/api/admin/quotes/:id/status', async req => {
    const { status } = parse(statusSchema, req.body, 'Estado inválido');
    return store.setStatus(req.params.id, status);
  });
  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = buildApp();
  app.listen({ port: Number(process.env.PORT || 4000), host: process.env.HOST || '127.0.0.1' }).catch(error => {
    console.error(error); process.exitCode = 1;
  });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
}
