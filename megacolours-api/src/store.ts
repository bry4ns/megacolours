import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DeliveryMethod, Product, QuoteInput, RequestError, Status } from './schema.js';
import { PriceSnapshot } from './pricing.js';

type Table = 'products' | 'deliveries';
type DataRow = { data: string };
export type Upload = { id: string; originalName: string; mime: string; width: number; height: number };
interface QuoteRow {
  id: string; reference: string; status: Status; createdAt: string; customer: string;
  selection: string; snapshot: string; uploadId: string | null; crop: string | null;
}

const base: Product = {
  id: 'pvc', name: 'Tela PVC', slug: 'tela-pvc', category: 'Gran formato', description: 'Lienzos para comunicar a gran escala.',
  active: true, pricingMode: 'AREA', pricePerM2: 12000, fixedPrice: 0, minimumPrice: 5000,
  allowCustomDimensions: true, minWidth: 20, maxWidth: 500, minHeight: 20, maxHeight: 500,
  dimensionStep: 1, stock: null, image: null, presets: [], options: [],
};
const pvcPresets = [[50, 70], [100, 100], [100, 200]].map(([width, height]) => ({
  id: `pvc-${width}-${height}`, name: `${width} × ${height} cm`, width, height, fixedPrice: null,
  stock: null, active: true, image: null, description: 'Formato de demostración',
}));
const seeds: Product[] = [
  { ...base, presets: pvcPresets, options: [{ id: 'ojales', name: 'Ojales metálicos', price: 1500, active: true }] },
  { ...base, id: 'adhesivos', name: 'Adhesivos', slug: 'adhesivos', category: 'Adhesivos', description: 'Gráfica para vitrinas, muros y superficies.', pricePerM2: 15000, minimumPrice: 3000, minWidth: 5, minHeight: 5 },
  { ...base, id: 'impresion-digital', name: 'Impresión digital', slug: 'impresion-digital', category: 'Impresión digital', description: 'Piezas impresas para presentar tu marca.', pricePerM2: 18000, minWidth: 10, minHeight: 10 },
  { ...base, id: 'paloma', name: 'Paloma publicitaria', slug: 'paloma', category: 'Publicidad', description: 'Un soporte para darle presencia a tu negocio.',
    pricingMode: 'FIXED', pricePerM2: 0, fixedPrice: 35000, minimumPrice: 0, allowCustomDimensions: false,
    minWidth: 80, maxWidth: 80, minHeight: 180, maxHeight: 180, stock: 20,
    presets: [{ id: 'std', name: 'Estándar', width: 80, height: 180, fixedPrice: 35000, stock: 20, active: true, image: null, description: 'Formato de demostración' }] },
  { ...base, id: 'cartel-poste', name: 'Cartel para Poste', slug: 'cartel-poste', category: 'Vía pública',
    description: 'Letreros rígidos y pendones para postes de alumbrado con abrazaderas metálicas.',
    pricingMode: 'FIXED', pricePerM2: 0, fixedPrice: 22000, minimumPrice: 0, allowCustomDimensions: true,
    minWidth: 30, maxWidth: 80, minHeight: 60, maxHeight: 150, stock: 50,
    presets: [
      { id: 'poste-40-80', name: '40 × 80 cm', width: 40, height: 80, fixedPrice: 18000, stock: 50, active: true, image: null, description: 'Formato estándar para postes' },
      { id: 'poste-50-100', name: '50 × 100 cm', width: 50, height: 100, fixedPrice: 22000, stock: 50, active: true, image: null, description: 'Alta visibilidad para esquinas' },
      { id: 'poste-60-120', name: '60 × 120 cm', width: 60, height: 120, fixedPrice: 28000, stock: 50, active: true, image: null, description: 'Impacto vehicular para avenidas' },
    ],
    options: [{ id: 'abrazaderas', name: 'Juego de abrazaderas metálicas para poste', price: 3500, active: true }] },
];

export class Store {
  readonly db: DatabaseSync;
  constructor(filename: string) {
    if (filename !== ':memory:') mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec(`
      PRAGMA journal_mode=WAL;
      PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS deliveries (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS uploads (id TEXT PRIMARY KEY, originalName TEXT, mime TEXT, width INTEGER, height INTEGER);
      CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, reference TEXT UNIQUE, status TEXT, createdAt TEXT, customer TEXT, selection TEXT, snapshot TEXT, uploadId TEXT, crop TEXT);
      CREATE TABLE IF NOT EXISTS quote_history (quoteId TEXT, status TEXT, createdAt TEXT);
      CREATE TABLE IF NOT EXISTS counters (year INTEGER PRIMARY KEY, value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY);
      CREATE INDEX IF NOT EXISTS history_quote ON quote_history(quoteId);
    `);
    this.seed();
  }
  private seed() {
    // Initial demo migration runs once; later edits or deactivations are preserved.
    if (!this.db.prepare('SELECT id FROM migrations WHERE id=?').get('demo-v1')) {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        for (const product of seeds) {
          const existing = this.get<Product>('products', product.id);
          if (!existing) this.insert('products', product);
          else if (existing.id === 'paloma' && existing.maxWidth === 0 && existing.maxHeight === 0) {
            this.update('products', { ...existing, minWidth: 80, maxWidth: 80, minHeight: 180, maxHeight: 180 });
          } else if (existing.id === 'pvc' && existing.presets.length === 0) {
            this.update('products', { ...existing, presets: pvcPresets });
          }
        }
        const deliveries: DeliveryMethod[] = [
          { id: 'pickup', name: 'Retiro en local', description: 'Coordina el retiro con el equipo.', price: 0, active: true, requiresAddress: false },
          { id: 'santiago', name: 'Despacho en Santiago', description: 'Tarifa de demostración; cobertura sujeta a confirmación.', price: 5000, active: true, requiresAddress: true },
        ];
        for (const delivery of deliveries) if (!this.get('deliveries', delivery.id)) this.insert('deliveries', delivery);
        this.db.prepare('INSERT INTO migrations VALUES (?)').run('demo-v1');
        this.db.exec('COMMIT');
      } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    }

    // Migration for v2-poste
    try {
      if (!this.db.prepare('SELECT id FROM migrations WHERE id=?').get('v2-poste')) {
        const existing = this.get<Product>('products', 'cartel-poste');
        if (!existing) {
          const poste = seeds.find(s => s.id === 'cartel-poste');
          if (poste) this.insert('products', poste);
        }
        this.db.prepare('INSERT OR IGNORE INTO migrations (id) VALUES (?)').run('v2-poste');
      }
    } catch {}
  }
  list<T>(table: Table): T[] {
    return (this.db.prepare(`SELECT data FROM ${table} ORDER BY rowid`).all() as DataRow[]).map(row => JSON.parse(row.data) as T);
  }
  get<T>(table: Table, id: string): T | undefined {
    const row = this.db.prepare(`SELECT data FROM ${table} WHERE id=?`).get(id) as DataRow | undefined;
    return row ? JSON.parse(row.data) as T : undefined;
  }
  insert<T extends { id: string }>(table: Table, value: T) {
    if (this.get(table, value.id)) throw new RequestError('Este identificador ya existe', 409);
    this.db.prepare(`INSERT INTO ${table} (id,data) VALUES (?,?)`).run(value.id, JSON.stringify(value));
  }
  update<T extends { id: string }>(table: Table, value: T) {
    if (!this.get(table, value.id)) throw new RequestError('No se encontró el registro', 404);
    this.db.prepare(`UPDATE ${table} SET data=? WHERE id=?`).run(JSON.stringify(value), value.id);
  }
  upload(id: string): Upload | undefined {
    return this.db.prepare('SELECT * FROM uploads WHERE id=?').get(id) as Upload | undefined;
  }
  addUpload(upload: Upload) {
    this.db.prepare('INSERT INTO uploads VALUES (?,?,?,?,?)').run(upload.id, upload.originalName, upload.mime, upload.width, upload.height);
  }
  createQuote(input: QuoteInput, snapshot: PriceSnapshot) {
    const id = randomUUID(), now = new Date().toISOString(), year = new Date().getFullYear();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO counters(year,value) VALUES (?,1) ON CONFLICT(year) DO UPDATE SET value=value+1').run(year);
      const count = (this.db.prepare('SELECT value FROM counters WHERE year=?').get(year) as { value: number }).value;
      const reference = `MC-${year}-${String(count).padStart(6, '0')}`;
      this.db.prepare('INSERT INTO quotes VALUES (?,?,?,?,?,?,?,?,?)').run(id, reference, 'PENDING', now,
        JSON.stringify(input.customer), JSON.stringify(input.selection), JSON.stringify(snapshot), input.uploadId ?? null,
        input.crop ? JSON.stringify(input.crop) : null);
      this.db.prepare('INSERT INTO quote_history VALUES (?,?,?)').run(id, 'PENDING', now);
      this.db.exec('COMMIT');
      return { id, reference, status: 'PENDING' as const, snapshot };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  quotes() {
    return (this.db.prepare('SELECT * FROM quotes ORDER BY createdAt DESC, rowid DESC').all() as unknown as QuoteRow[]).map(q => ({
      ...q, customer: JSON.parse(q.customer) as QuoteInput['customer'], selection: JSON.parse(q.selection) as QuoteInput['selection'],
      snapshot: JSON.parse(q.snapshot) as PriceSnapshot, crop: q.crop ? JSON.parse(q.crop) as QuoteInput['crop'] : null,
      history: this.db.prepare('SELECT status,createdAt FROM quote_history WHERE quoteId=? ORDER BY rowid').all(q.id) as { status: Status; createdAt: string }[],
    }));
  }
  setStatus(id: string, status: Status) {
    const quote = this.db.prepare('SELECT status FROM quotes WHERE id=?').get(id) as { status: Status } | undefined;
    if (!quote) throw new RequestError('No se encontró la cotización', 404);
    if (quote.status === status) return { status };
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('UPDATE quotes SET status=? WHERE id=?').run(status, id);
      this.db.prepare('INSERT INTO quote_history VALUES (?,?,?)').run(id, status, new Date().toISOString());
      this.db.exec('COMMIT');
      return { status };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close() { this.db.close(); }
}
