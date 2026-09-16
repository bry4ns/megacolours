import { z } from 'zod';

const identifier = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/, 'Identificador inválido');
const text = (limit: number) => z.string().trim().max(limit);
const money = z.number().int().safe().nonnegative();
const dimension = z.number().int().min(1).max(100_000);
const stock = z.number().int().min(0).max(100_000).nullable();
const image = z.string().regex(/^\/api\/uploads\/[a-f0-9-]{36}$/, 'Utiliza una imagen cargada').nullable();

export const presetSchema = z.object({
  id: identifier, name: text(200).min(1), width: dimension, height: dimension,
  fixedPrice: money.nullable(), stock, active: z.boolean(), image, description: text(2000),
}).strict();

export const optionSchema = z.object({
  id: identifier, name: text(200).min(1), price: money, active: z.boolean(),
}).strict();

export const productSchema = z.object({
  id: identifier, name: text(100).min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  category: text(100).min(1), description: text(2000), active: z.boolean(),
  pricingMode: z.enum(['AREA', 'FIXED']), pricePerM2: money, fixedPrice: money, minimumPrice: money,
  allowCustomDimensions: z.boolean(), minWidth: dimension, maxWidth: dimension,
  minHeight: dimension, maxHeight: dimension, dimensionStep: dimension, stock, image,
  presets: z.array(presetSchema).max(100), options: z.array(optionSchema).max(50),
}).strict().superRefine((product, ctx) => {
  if (product.minWidth > product.maxWidth || product.minHeight > product.maxHeight) {
    ctx.addIssue({ code: 'custom', message: 'Los límites mínimos no pueden superar los máximos' });
  }
  if (new Set(product.presets.map(p => p.id)).size !== product.presets.length ||
      new Set(product.options.map(o => o.id)).size !== product.options.length) {
    ctx.addIssue({ code: 'custom', message: 'Los formatos y opciones deben tener identificadores únicos' });
  }
  if (product.active && !product.allowCustomDimensions && !product.presets.some(p => p.active)) {
    ctx.addIssue({ code: 'custom', message: 'Activa al menos un formato o permite medidas personalizadas' });
  }
});

export const deliverySchema = z.object({
  id: identifier, name: text(100).min(1), description: text(1000), price: money,
  active: z.boolean(), requiresAddress: z.boolean(),
}).strict();

export const selectionSchema = z.object({
  productId: identifier, presetId: identifier.optional(), width: dimension, height: dimension,
  quantity: z.number().int().min(1).max(100_000), options: z.array(identifier).max(50), deliveryMethodId: identifier,
}).strict().refine(s => new Set(s.options).size === s.options.length, 'No repitas opciones');

export const cropSchema = z.object({
  x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1),
  zoom: z.number().finite().min(1).max(5), rotation: z.literal(0),
}).strict();

export const customerSchema = z.object({
  name: text(200).min(2), phone: text(50).min(6), email: text(254).email(),
  company: text(200).optional(), rut: text(50).optional(), comment: text(2000).optional(), address: text(500).optional(),
}).strict();

export const quoteSchema = z.object({
  selection: selectionSchema, customer: customerSchema, uploadId: z.uuid().optional(), crop: cropSchema.optional(),
}).strict().refine(q => Boolean(q.uploadId) === Boolean(q.crop), 'La imagen y su encuadre deben enviarse juntos');

export const statuses = ['PENDING', 'CONTACTED', 'APPROVED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const;
export const statusSchema = z.object({ status: z.enum(statuses) }).strict();
export const loginSchema = z.object({ email: text(254).email(), password: z.string().min(1).max(1000) }).strict();

export type Product = z.infer<typeof productSchema>;
export type Preset = z.infer<typeof presetSchema>;
export type DeliveryMethod = z.infer<typeof deliverySchema>;
export type Selection = z.infer<typeof selectionSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type Status = typeof statuses[number];

export class RequestError extends Error {
  constructor(message: string, public readonly statusCode = 400) { super(message); }
}

export function parse<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const field = result.error.issues[0]?.path.join('.');
    throw new RequestError(`${label}${field ? `: revisa ${field}` : ''}. Revisa los datos y vuelve a intentar.`);
  }
  return result.data;
}
