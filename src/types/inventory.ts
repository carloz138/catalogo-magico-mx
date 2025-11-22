// src/types/inventory.ts

export interface DeadStockItem {
  product_name: string;
  variant_name: string; // Será 'N/A' si es producto simple
  sku: string | null;
  current_stock: number;
  last_sale_date: string | null;
  days_since_last_sale: number | null;
  potential_loss_value: number; // Viene en centavos
}
