import { DeliveryMethod, Product, RequestError, Selection } from './schema.js';

export interface PriceSnapshot {
  productName: string; presetName: string | null; width: number; height: number; quantity: number;
  unitPrice: number; subtotal: number; extras: number; shipping: number; total: number;
  currency: 'CLP'; rules: string[];
}

function asMoney(amount: bigint): number {
  if (amount < 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RequestError('El monto supera el límite permitido; reduce las medidas o la cantidad');
  }
  return Number(amount);
}

export function calculate(selection: Selection, product: Product | undefined, delivery: DeliveryMethod | undefined): PriceSnapshot {
  if (!product?.active) throw new RequestError('El producto no está disponible');
  if (!delivery?.active) throw new RequestError('El método de entrega no está disponible');
  const { width, height, quantity } = selection;
  const preset = selection.presetId ? product.presets.find(p => p.id === selection.presetId && p.active) : undefined;
  if (selection.presetId && !preset) throw new RequestError('El formato seleccionado no está disponible');
  if (preset && (width !== preset.width || height !== preset.height)) throw new RequestError('Las medidas no coinciden con el formato seleccionado');
  if (!preset) {
    if (!product.allowCustomDimensions) throw new RequestError('Selecciona un formato disponible');
    if (width < product.minWidth || width > product.maxWidth || height < product.minHeight || height > product.maxHeight ||
      (width - product.minWidth) % product.dimensionStep !== 0 || (height - product.minHeight) % product.dimensionStep !== 0) {
      throw new RequestError('Las medidas están fuera de los límites o incrementos permitidos');
    }
  }
  if ((product.stock !== null && quantity > product.stock) || (preset && preset.stock !== null && quantity > preset.stock)) {
    throw new RequestError('La cantidad supera el stock disponible');
  }
  const options = selection.options.map(id => {
    const option = product.options.find(o => o.id === id && o.active);
    if (!option) throw new RequestError('Una de las opciones seleccionadas ya no está disponible');
    return option;
  });
  const rules: string[] = [];
  let unit: bigint;
  if (preset?.fixedPrice !== null && preset?.fixedPrice !== undefined) {
    unit = BigInt(preset.fixedPrice);
    rules.push(`Formato ${preset.name}: ${preset.fixedPrice} CLP por unidad`);
  } else if (product.pricingMode === 'FIXED') {
    unit = BigInt(product.fixedPrice);
    rules.push(`Precio fijo: ${product.fixedPrice} CLP por unidad`);
  } else {
    const areaPrice = (BigInt(width) * BigInt(height) * BigInt(product.pricePerM2) + 9999n) / 10000n;
    unit = areaPrice > BigInt(product.minimumPrice) ? areaPrice : BigInt(product.minimumPrice);
    rules.push(`Superficie: ${width} × ${height} cm; tarifa ${product.pricePerM2} CLP/m²; redondeo superior al peso`,
      `Mínimo por unidad: ${product.minimumPrice} CLP`);
  }
  const subtotal = unit * BigInt(quantity);
  const extras = options.reduce((sum, option) => sum + BigInt(option.price), 0n) * BigInt(quantity);
  const shipping = BigInt(delivery.price);
  rules.push(...options.map(option => `${option.name}: ${option.price} CLP por unidad × ${quantity}`));
  rules.push(`Cantidad: ${quantity}`, `${delivery.name}: ${delivery.price} CLP por cotización`);
  return {
    productName: product.name, presetName: preset?.name ?? null, width, height, quantity,
    unitPrice: asMoney(unit), subtotal: asMoney(subtotal), extras: asMoney(extras), shipping: asMoney(shipping),
    total: asMoney(subtotal + extras + shipping), currency: 'CLP', rules,
  };
}
