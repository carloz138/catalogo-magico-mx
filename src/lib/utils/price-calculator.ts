/**
 * Calcula el precio ajustado según el % configurado en el catálogo
 * @param basePrice - Precio base del producto
 * @param adjustmentPercentage - Porcentaje de ajuste (ej: -10 = 10% descuento, +10 = 10% incremento)
 * @returns Precio ajustado redondeado
 */
export function calculateAdjustedPrice(
  basePrice: number,
  adjustmentPercentage: number
): number {
  const multiplier = 1 + (adjustmentPercentage / 100);
  return Math.round(basePrice * multiplier);
}

/**
 * Formatea precio a moneda MXN
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

/**
 * Calcula el total de una cotización
 */
export function calculateQuoteTotal(items: Array<{ subtotal: number }>): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Calcula el descuento o incremento aplicado
 */
export function calculateDiscountAmount(
  basePrice: number,
  adjustmentPercentage: number
): number {
  return Math.round((basePrice * adjustmentPercentage) / 100);
}

/**
 * Formatea porcentaje de ajuste para display
 */
export function formatAdjustment(percentage: number): string {
  if (percentage === 0) return 'Sin ajuste';
  if (percentage > 0) return `+${percentage}%`;
  return `${percentage}%`;
}
