/**
 * Cart Validation Utilities
 * Validates wholesale rules (MOQ/MOV) for catalog orders
 */

export interface WholesaleRules {
  is_wholesale_only: boolean;
  min_order_quantity: number;
  min_order_amount: number; // In cents
}

export interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number; // In cents
  subtotal: number; // In cents
}

export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a cart against catalog wholesale rules
 * @param items - Array of cart items
 * @param rules - Wholesale rules from the catalog
 * @returns Validation result with errors and warnings
 */
export function validateCartRules(
  items: CartItem[],
  rules: WholesaleRules
): CartValidationResult {
  const result: CartValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // If wholesale only mode is disabled, cart is always valid
  if (!rules.is_wholesale_only) {
    return result;
  }

  // Calculate totals
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  // Check MOQ (Minimum Order Quantity)
  if (rules.min_order_quantity > 1 && totalQuantity < rules.min_order_quantity) {
    result.isValid = false;
    result.errors.push(
      `El pedido mínimo es de ${rules.min_order_quantity} piezas. Tienes ${totalQuantity}.`
    );
  }

  // Check MOV (Minimum Order Value)
  if (rules.min_order_amount > 0 && totalAmount < rules.min_order_amount) {
    const minAmountFormatted = formatCurrency(rules.min_order_amount);
    const currentAmountFormatted = formatCurrency(totalAmount);
    result.isValid = false;
    result.errors.push(
      `El pedido mínimo para este catálogo es de ${minAmountFormatted}. Tu carrito suma ${currentAmountFormatted}.`
    );
  }

  return result;
}

/**
 * Calculates how much more is needed to meet MOV
 * @param currentAmount - Current cart total in cents
 * @param minAmount - Minimum order amount in cents
 * @returns Amount needed in cents, or 0 if already met
 */
export function calculateAmountNeeded(
  currentAmount: number,
  minAmount: number
): number {
  const difference = minAmount - currentAmount;
  return difference > 0 ? difference : 0;
}

/**
 * Calculates how many more items are needed to meet MOQ
 * @param currentQuantity - Current total quantity
 * @param minQuantity - Minimum order quantity
 * @returns Quantity needed, or 0 if already met
 */
export function calculateQuantityNeeded(
  currentQuantity: number,
  minQuantity: number
): number {
  const difference = minQuantity - currentQuantity;
  return difference > 0 ? difference : 0;
}

/**
 * Formats cents to currency string
 */
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(cents / 100);
}

/**
 * Gets a user-friendly message about progress towards minimums
 */
export function getProgressMessage(
  items: CartItem[],
  rules: WholesaleRules
): string | null {
  if (!rules.is_wholesale_only) {
    return null;
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const messages: string[] = [];

  if (rules.min_order_quantity > 1) {
    const qtyNeeded = calculateQuantityNeeded(totalQuantity, rules.min_order_quantity);
    if (qtyNeeded > 0) {
      messages.push(`Faltan ${qtyNeeded} piezas para el mínimo`);
    }
  }

  if (rules.min_order_amount > 0) {
    const amtNeeded = calculateAmountNeeded(totalAmount, rules.min_order_amount);
    if (amtNeeded > 0) {
      messages.push(`Faltan ${formatCurrency(amtNeeded)} para el mínimo`);
    }
  }

  return messages.length > 0 ? messages.join(' • ') : null;
}
