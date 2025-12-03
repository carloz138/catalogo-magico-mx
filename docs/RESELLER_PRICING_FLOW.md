# Flujo de Precios de Revendedor (L2)

## Documentación Técnica v1.0

---

## 1. Resumen Ejecutivo

Este documento describe el flujo completo de cómo se gestionan los precios personalizados de los revendedores (usuarios L2) en CatifyPro. Los revendedores pueden establecer sus propios márgenes sobre los precios del fabricante (L1) sin modificar los datos originales.

---

## 2. Arquitectura de Datos

### 2.1 Tablas Involucradas

| Tabla | Propósito | Relación |
|-------|-----------|----------|
| `products` | Productos maestros del fabricante (L1) | Fuente de verdad |
| `product_variants` | Variantes maestras (tallas, colores) | FK → products |
| `replicated_catalogs` | Catálogos replicados para L2 | FK → digital_catalogs |
| `reseller_product_prices` | **Precios custom de L2 para productos** | FK → replicated_catalogs, products |
| `reseller_variant_prices` | **Precios custom de L2 para variantes** | FK → replicated_catalogs, product_variants |

### 2.2 Estructura de `reseller_product_prices`

```sql
CREATE TABLE reseller_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID NOT NULL REFERENCES replicated_catalogs(id),
  product_id UUID NOT NULL REFERENCES products(id),
  custom_price_retail INTEGER,      -- Precio menudeo en centavos (nullable = usa original)
  custom_price_wholesale INTEGER,   -- Precio mayoreo en centavos
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(replicated_catalog_id, product_id)
);
```

### 2.3 Estructura de `reseller_variant_prices`

```sql
CREATE TABLE reseller_variant_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID NOT NULL REFERENCES replicated_catalogs(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  custom_price_retail NUMERIC,
  custom_price_wholesale NUMERIC,
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(replicated_catalog_id, variant_id)
);
```

---

## 3. Flujo de Datos

### 3.1 Diagrama de Secuencia

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│  Usuario L2 │     │ ProductPriceEditor   │     │ ResellerPriceService    │     │   Supabase   │
└──────┬──────┘     └──────────┬───────────┘     └────────────┬────────────┘     └──────┬───────┘
       │                       │                              │                         │
       │ 1. Navega a          │                              │                         │
       │ /reseller/prices/:id │                              │                         │
       │──────────────────────>│                              │                         │
       │                       │                              │                         │
       │                       │ 2. getProductsWithPrices()  │                         │
       │                       │─────────────────────────────>│                         │
       │                       │                              │                         │
       │                       │                              │ 3. SELECT products      │
       │                       │                              │    + custom_prices      │
       │                       │                              │────────────────────────>│
       │                       │                              │                         │
       │                       │                              │<────────────────────────│
       │                       │<─────────────────────────────│                         │
       │                       │                              │                         │
       │ 4. Renderiza tabla   │                              │                         │
       │<──────────────────────│                              │                         │
       │                       │                              │                         │
       │ 5. Edita precio/stock│                              │                         │
       │──────────────────────>│                              │                         │
       │                       │                              │                         │
       │ 6. Click "Guardar"   │                              │                         │
       │──────────────────────>│                              │                         │
       │                       │                              │                         │
       │                       │ 7. batchUpdatePrices()      │                         │
       │                       │─────────────────────────────>│                         │
       │                       │                              │                         │
       │                       │                              │ 8. UPSERT              │
       │                       │                              │ reseller_*_prices      │
       │                       │                              │────────────────────────>│
       │                       │                              │                         │
       │                       │                              │<────────────────────────│
       │                       │<─────────────────────────────│                         │
       │                       │                              │                         │
       │ 9. Toast "Guardado"  │                              │                         │
       │<──────────────────────│                              │                         │
```

### 3.2 Trigger de Escritura

**¿Qué detona la inserción/actualización?**

| Acción | Ubicación | Método | Resultado |
|--------|-----------|--------|-----------|
| L2 guarda precios | `ProductPriceEditor.tsx` | `handleSaveChanges()` | UPSERT en tablas |

**Código del trigger:**

```typescript
// src/pages/reseller/ProductPriceEditor.tsx (línea ~330)
const handleSaveChanges = async () => {
  const updates = Array.from(changes.entries()).map(([key, data]) => ({
    product_id: data.type === 'product' ? key : undefined,
    variant_id: data.type === 'variant' ? key : undefined,
    ...data.values
  }));

  await ResellerPriceService.batchUpdatePrices(catalogId, user.id, updates);
};
```

---

## 4. Servicio Principal

### 4.1 Archivo: `src/services/reseller-price.service.ts`

#### Métodos Públicos

| Método | Propósito | Parámetros |
|--------|-----------|------------|
| `getProductsWithPrices()` | Carga productos con precios L2 | `replicatedCatalogId`, `userId` |
| `updateProductPrice()` | Actualiza precio de producto | `catalogId`, `productId`, `userId`, `data` |
| `updateVariantPrice()` | Actualiza precio de variante | `catalogId`, `variantId`, `userId`, `data` |
| `batchUpdatePrices()` | Actualización masiva | `catalogId`, `userId`, `updates[]` |

#### Validación de Negocio

```typescript
// El L2 NO puede bajar precios por debajo del fabricante
if (data.custom_price_retail < originalProduct.price_retail) {
  throw new Error(`No puedes bajar el precio. Mínimo: $${originalProduct.price_retail / 100}`);
}
```

---

## 5. Consumidores de Datos

### 5.1 Catálogo Público (`digital-catalog.service.ts`)

Cuando un cliente visita el catálogo de un L2, se mezclan los precios:

```typescript
// Línea ~286-294
const { data: customProductPrices } = await supabase
  .from("reseller_product_prices")
  .select("*")
  .eq("replicated_catalog_id", replicatedCatalog.id);

// Luego se aplican al renderizar productos
product.displayPrice = customPrice ?? originalPrice;
```

### 5.2 Servicio de Cotizaciones (`quote.service.ts`)

Al crear una cotización, se valida el stock del L2:

```typescript
// Línea ~168-175
const { data: productPrices } = await supabase
  .from("reseller_product_prices")
  .select("product_id, is_in_stock")
  .eq("replicated_catalog_id", replicatedCatalogId);

// Filtrar productos sin stock
const availableProducts = products.filter(p => 
  productPrices.find(pp => pp.product_id === p.id)?.is_in_stock
);
```

---

## 6. Políticas de Seguridad (RLS)

### 6.1 `reseller_product_prices`

```sql
-- Solo el dueño del catálogo replicado puede ver/editar
CREATE POLICY "reseller_own_prices" ON reseller_product_prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM replicated_catalogs rc
      WHERE rc.id = replicated_catalog_id
      AND rc.reseller_id = auth.uid()
    )
  );
```

### 6.2 Lectura Pública (Catálogos Activos)

```sql
-- Cualquiera puede leer precios de catálogos activos (para mostrar en público)
CREATE POLICY "public_read_active" ON reseller_product_prices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM replicated_catalogs rc
      WHERE rc.id = replicated_catalog_id
      AND rc.is_active = true
    )
  );
```

---

## 7. Casos de Uso

### 7.1 Caso: L2 Configura Margen del 20%

1. L2 navega a `/reseller/prices/abc123`
2. Sistema carga productos con precios originales de L1
3. L2 usa "Margen Masivo" → ingresa 20%
4. Sistema calcula: `nuevo_precio = precio_original * 1.20`
5. L2 guarda cambios
6. Sistema hace UPSERT en `reseller_product_prices`
7. Catálogo público ahora muestra precios +20%

### 7.2 Caso: Cliente Crea Cotización en Catálogo L2

1. Cliente visita `/catalogo/r-abc123`
2. `digital-catalog.service.ts` carga productos
3. Cruza con `reseller_product_prices` para obtener precios custom
4. Cliente agrega productos al carrito
5. Al enviar cotización, `quote.service.ts` valida stock L2
6. Cotización se crea con precios del L2

---

## 8. Consideraciones de Performance

| Aspecto | Implementación |
|---------|----------------|
| Índices | `UNIQUE(replicated_catalog_id, product_id)` |
| Batch Updates | Un solo `batchUpdatePrices()` en lugar de N llamadas |
| Lazy Loading | Precios se cargan solo al abrir editor |
| Cache | No implementado (evaluar si hay alta carga) |

---

## 9. Troubleshooting

### Error: "No puedes bajar el precio"
**Causa:** L2 intentó poner precio menor al del fabricante  
**Solución:** Validación de negocio intencional

### Error: "Catálogo no encontrado o no autorizado"
**Causa:** L2 intenta acceder a catálogo de otro usuario  
**Solución:** Verificar `reseller_id` en `replicated_catalogs`

### Precios no aparecen en catálogo público
**Causa:** Registro no existe en `reseller_product_prices`  
**Solución:** L2 debe guardar al menos una vez en el editor

---

## 10. Historial de Cambios

| Fecha | Versión | Cambio |
|-------|---------|--------|
| 2025-12-03 | 1.0 | Documentación inicial |

---

*Generado para CatifyPro - Sistema de Catálogos B2B*
