# Sistema de Productos, Variantes y Precios - Documentación Técnica

## 1. Resumen General

El sistema de productos y variantes de CatifyPro permite a los usuarios (L1 - Fabricantes) gestionar su inventario completo con soporte para:

- **Productos Simples**: Un producto = un SKU, un precio
- **Productos con Variantes**: Un producto = múltiples combinaciones (color + talla = N variantes)
- **Precios Dual**: Precio menudeo (retail) y precio mayoreo (wholesale)
- **Categorías Dinámicas**: Cada categoría define qué tipos de variantes están disponibles
- **Precios Personalizados (L2)**: Los revendedores pueden ajustar precios sobre los del fabricante

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTOS (L1)                                │
├─────────────────────────────────────────────────────────────────────┤
│  products (tabla maestra)                                            │
│     ├── product_variants (1:N variantes)                             │
│     └── catalog_products (N:M relación con catálogos)                │
├─────────────────────────────────────────────────────────────────────┤
│                        TIPOS DE VARIANTES                            │
├─────────────────────────────────────────────────────────────────────┤
│  variant_types (definición: "color", "talla_ropa")                   │
│     └── variant_values (valores: "Rojo", "M", "L")                   │
├─────────────────────────────────────────────────────────────────────┤
│                     PRECIOS REVENDEDOR (L2)                          │
├─────────────────────────────────────────────────────────────────────┤
│  reseller_product_prices (precios custom de productos simples)       │
│  reseller_variant_prices (precios custom de variantes)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tablas de Base de Datos

### 3.1 `products` - Tabla Maestra de Productos

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Información básica
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  custom_description TEXT,
  category TEXT,
  brand TEXT,
  model TEXT,
  color TEXT,
  features TEXT[],
  tags TEXT[] DEFAULT '{}',
  
  -- Precios (en CENTAVOS para evitar errores de punto flotante)
  price_retail INTEGER,        -- Precio menudeo: $100.00 = 10000 centavos
  price_wholesale INTEGER,     -- Precio mayoreo
  wholesale_min_qty INTEGER,   -- Cantidad mínima para precio mayoreo
  
  -- Inventario
  stock_quantity INTEGER DEFAULT 0,
  last_sale_at TIMESTAMPTZ,
  
  -- Imágenes (múltiples resoluciones)
  original_image_url TEXT NOT NULL,
  processed_image_url TEXT,        -- Sin fondo
  image_url TEXT,                  -- Imagen display actual
  thumbnail_image_url TEXT,        -- 300x300px
  catalog_image_url TEXT,          -- 800x800px para PDFs
  luxury_image_url TEXT,           -- 1200x1200px premium
  print_image_url TEXT,            -- 2400x2400px para impresión
  hd_image_url TEXT,
  
  -- Procesamiento IA
  processing_status TEXT DEFAULT 'pending',
  processing_progress INTEGER DEFAULT 0,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  ai_description TEXT,
  ai_tags TEXT[],
  ai_confidence_score NUMERIC,
  smart_analysis JSONB,
  
  -- Variantes
  has_variants BOOLEAN DEFAULT false,
  variant_count INTEGER DEFAULT 0,
  
  -- Sistema
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMP,  -- Soft delete
  
  CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id)
);
```

**Campos Clave:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `price_retail` | INTEGER | Precio menudeo en **centavos** (10000 = $100.00 MXN) |
| `price_wholesale` | INTEGER | Precio mayoreo en **centavos** |
| `wholesale_min_qty` | INTEGER | Cantidad mínima para aplicar precio mayoreo |
| `has_variants` | BOOLEAN | Si el producto tiene variantes activas |
| `variant_count` | INTEGER | Contador de variantes activas (trigger automático) |
| `deleted_at` | TIMESTAMP | Soft delete - no se elimina físicamente |

### 3.2 `product_variants` - Variantes de Productos

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id UUID NOT NULL,
  
  -- Combinación de variantes (JSONB flexible)
  variant_combination JSONB NOT NULL,
  -- Ejemplo: {"color": "rojo", "talla_ropa": "M"}
  
  -- Identificador único
  sku VARCHAR,
  
  -- Precios específicos de la variante (override del producto padre)
  price_retail NUMERIC,
  price_wholesale NUMERIC,
  
  -- Inventario por variante
  stock_quantity INTEGER DEFAULT 0,
  last_sale_at TIMESTAMPTZ,
  
  -- Imágenes específicas de la variante
  variant_images JSONB,
  
  -- Control
  is_default BOOLEAN DEFAULT false,  -- Variante mostrada por defecto
  is_active BOOLEAN DEFAULT true,    -- Soft delete
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para mantener variant_count actualizado
CREATE TRIGGER update_product_variant_count
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_product_variant_count();
```

**Ejemplo de `variant_combination`:**
```json
{
  "color": "rojo",
  "talla_ropa": "M"
}
```

### 3.3 `variant_types` - Tipos de Variantes por Categoría

```sql
CREATE TABLE variant_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,           -- Identificador interno: "color", "talla_ropa"
  display_name VARCHAR NOT NULL,   -- Nombre UI: "Color", "Talla"
  category VARCHAR,                -- Categoría asociada: "ropa", "calzado"
  input_type VARCHAR DEFAULT 'select',  -- Tipo de input UI
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tipos de input soportados:
-- 'select' (dropdown)
-- 'color_picker' (selector de color)
-- 'number_input' (campo numérico)
-- 'text_input' (texto libre)
```

### 3.4 `variant_values` - Valores Predefinidos de Variantes

```sql
CREATE TABLE variant_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_type_id UUID REFERENCES variant_types(id),
  value VARCHAR NOT NULL,          -- Valor interno: "rojo"
  display_value VARCHAR,           -- Valor UI: "Rojo"
  hex_color VARCHAR,               -- Color HEX para color_picker: "#FF0000"
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 `reseller_product_prices` - Precios Personalizados L2 (Productos)

```sql
CREATE TABLE reseller_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID NOT NULL REFERENCES replicated_catalogs(id),
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Precios personalizados (pueden ser mayores o iguales al original)
  custom_price_retail INTEGER,
  custom_price_wholesale INTEGER,
  
  -- Control de inventario L2
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(replicated_catalog_id, product_id)
);
```

### 3.6 `reseller_variant_prices` - Precios Personalizados L2 (Variantes)

```sql
CREATE TABLE reseller_variant_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID NOT NULL REFERENCES replicated_catalogs(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  
  custom_price_retail INTEGER,
  custom_price_wholesale INTEGER,
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(replicated_catalog_id, variant_id)
);
```

---

## 4. Categorías del Sistema

### 4.1 Categorías Disponibles

```typescript
// src/types/variants.ts
export type ProductCategory = 
  | 'ropa' 
  | 'calzado' 
  | 'electronica' 
  | 'joyeria' 
  | 'fiestas' 
  | 'floreria' 
  | 'general';

export const PRODUCT_CATEGORIES: CategoryConfig[] = [
  { value: 'ropa', label: 'Ropa', icon: '👕', description: 'Camisetas, pantalones, vestidos' },
  { value: 'calzado', label: 'Calzado', icon: '👟', description: 'Zapatos, tenis, botas' },
  { value: 'electronica', label: 'Electrónicos', icon: '📱', description: 'Celulares, tablets, laptops' },
  { value: 'joyeria', label: 'Joyería', icon: '💍', description: 'Anillos, collares, pulseras' },
  { value: 'fiestas', label: 'Fiestas', icon: '🎉', description: 'Decoración, globos, piñatas' },
  { value: 'floreria', label: 'Florería', icon: '🌺', description: 'Ramos, arreglos, plantas' },
  { value: 'general', label: 'General', icon: '📦', description: 'Otros productos' }
];
```

### 4.2 Mapeo Categoría → Variantes

```typescript
// src/types/variants.ts
export const CATEGORY_VARIANT_MAPPING: Record<ProductCategory, string[]> = {
  ropa: ['color', 'talla_ropa', 'material'],
  calzado: ['color_calzado', 'talla_calzado', 'marca'],
  electronica: ['color_electronico', 'capacidad', 'version'],
  joyeria: ['material_joya', 'talla_anillo'],
  fiestas: ['color_fiesta', 'tamano'],
  floreria: ['tipo_flor', 'color_flor', 'tamano_arreglo'],
  general: ['general']
};
```

### 4.3 ¿Por Qué Existen las Categorías?

1. **Variantes Contextuales**: Cada categoría define qué variantes son relevantes
   - Ropa → Color + Talla (S/M/L/XL)
   - Calzado → Color + Talla (22-30)
   - Electrónicos → Capacidad (64GB/128GB)
   
2. **Valores Predefinidos**: Los `variant_values` están asociados a cada tipo
   - Tallas de ropa: XS, S, M, L, XL, XXL
   - Tallas de calzado: 22, 23, 24, 25, 26, 27, 28, 29, 30
   
3. **UI Dinámica**: El formulario de variantes se adapta según la categoría seleccionada

---

## 5. Funciones RPC de Base de Datos

### 5.1 `get_variant_types_by_category`

```sql
CREATE FUNCTION get_variant_types_by_category(category_name TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  display_name VARCHAR,
  input_type VARCHAR,
  is_required BOOLEAN,
  variant_values JSONB
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vt.id,
    vt.name,
    vt.display_name,
    vt.input_type,
    vt.is_required,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', vv.id,
          'value', vv.value,
          'display_value', vv.display_value,
          'hex_color', vv.hex_color
        ) ORDER BY vv.sort_order
      ) FILTER (WHERE vv.id IS NOT NULL),
      '[]'::jsonb
    ) as variant_values
  FROM variant_types vt
  LEFT JOIN variant_values vv ON vt.id = vv.variant_type_id AND vv.is_active = true
  WHERE vt.category = category_name
  GROUP BY vt.id
  ORDER BY vt.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Uso**: Obtiene los tipos de variantes disponibles para una categoría con sus valores predefinidos.

### 5.2 `get_product_variants`

```sql
CREATE FUNCTION get_product_variants(product_uuid UUID)
RETURNS TABLE (
  variant_id UUID,
  combination JSONB,
  sku VARCHAR,
  price_retail NUMERIC,
  price_wholesale NUMERIC,
  stock_quantity INTEGER,
  is_default BOOLEAN,
  variant_images JSONB
)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.id,
    pv.variant_combination,
    pv.sku,
    pv.price_retail,
    pv.price_wholesale,
    pv.stock_quantity,
    pv.is_default,
    pv.variant_images
  FROM product_variants pv
  JOIN products p ON pv.product_id = p.id
  WHERE pv.product_id = product_uuid
    AND pv.is_active = true
    AND (p.user_id = auth.uid() OR 'admin' = auth.jwt() ->> 'role')
  ORDER BY pv.is_default DESC, pv.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 `create_default_variant_for_product`

```sql
CREATE FUNCTION create_default_variant_for_product(product_uuid UUID)
RETURNS UUID
AS $$
DECLARE
  variant_id UUID;
  product_record RECORD;
  default_combination JSONB;
BEGIN
  SELECT * INTO product_record FROM products WHERE id = product_uuid;
  
  -- Crear combinación según categoría
  CASE product_record.category
    WHEN 'ropa' THEN
      default_combination := '{"color": "general", "talla_ropa": "M"}';
    WHEN 'calzado' THEN
      default_combination := '{"color_calzado": "general", "talla_calzado": "25"}';
    WHEN 'electronica' THEN
      default_combination := '{"color_electronico": "general", "capacidad": "64gb"}';
    -- ... más casos
    ELSE
      default_combination := '{"general": "estandar"}';
  END CASE;
  
  INSERT INTO product_variants (
    product_id, user_id, variant_combination, sku,
    price_retail, price_wholesale, stock_quantity,
    is_default, is_active
  ) VALUES (
    product_record.id, product_record.user_id, default_combination,
    COALESCE(product_record.sku, 'PROD-') || '-DEFAULT',
    product_record.price_retail, product_record.price_wholesale,
    0, true, true
  ) RETURNING id INTO variant_id;
  
  UPDATE products SET has_variants = true, variant_count = 1 
  WHERE id = product_uuid;
  
  RETURN variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 `update_product_field`

```sql
CREATE FUNCTION update_product_field(
  product_id UUID,
  field_name TEXT,
  field_value TEXT
)
RETURNS BOOLEAN
AS $$
BEGIN
  -- Verificar propiedad
  IF NOT EXISTS (
    SELECT 1 FROM products WHERE id = product_id AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;
  
  CASE field_name
    WHEN 'name' THEN UPDATE products SET name = field_value WHERE id = product_id;
    WHEN 'sku' THEN UPDATE products SET sku = field_value WHERE id = product_id;
    WHEN 'price_retail' THEN UPDATE products SET price_retail = field_value::INTEGER WHERE id = product_id;
    WHEN 'price_wholesale' THEN UPDATE products SET price_wholesale = field_value::INTEGER WHERE id = product_id;
    WHEN 'category' THEN UPDATE products SET category = field_value WHERE id = product_id;
    -- ... más campos
    ELSE RETURN FALSE;
  END CASE;
  
  UPDATE products SET updated_at = NOW() WHERE id = product_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.5 `soft_delete_product`

```sql
CREATE FUNCTION soft_delete_product(
  product_id UUID,
  requesting_user_id UUID,
  reason TEXT DEFAULT 'User deletion'
)
RETURNS BOOLEAN
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM products 
    WHERE id = product_id AND user_id = requesting_user_id AND deleted_at IS NULL
  ) THEN
    RETURN FALSE;
  END IF;
  
  UPDATE products SET deleted_at = NOW() 
  WHERE id = product_id AND user_id = requesting_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Hooks de React

### 6.1 `useProductVariants`

**Ubicación**: `src/hooks/useProductVariants.ts`

```typescript
export function useProductVariants(productId: string) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantTypes, setVariantTypes] = useState<VariantTypeWithValues[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar variantes del producto
  const loadVariants = useCallback(async () => {
    const { data } = await supabase.rpc('get_product_variants', { 
      product_uuid: productId 
    });
    setVariants(formatVariants(data));
  }, [productId]);

  // Cargar tipos de variantes por categoría
  const loadVariantTypes = useCallback(async (category: string) => {
    const { data } = await supabase.rpc('get_variant_types_by_category', { 
      category_name: category 
    });
    setVariantTypes(formatVariantTypes(data));
  }, []);

  // CRUD de variantes
  const createVariant = async (data: CreateVariantData) => { /* ... */ };
  const updateVariant = async (variantId: string, data: UpdateVariantData) => { /* ... */ };
  const deleteVariant = async (variantId: string) => { /* ... */ };
  const setDefaultVariant = async (variantId: string) => { /* ... */ };

  return {
    variants,
    variantTypes,
    loading,
    loadVariants,
    loadVariantTypes,
    createVariant,
    updateVariant,
    deleteVariant,
    setDefaultVariant
  };
}
```

**Funciones Expuestas:**
| Función | Descripción |
|---------|-------------|
| `loadVariants()` | Carga variantes activas de un producto |
| `loadVariantTypes(category)` | Carga tipos de variantes según categoría |
| `createVariant(data)` | Crea nueva variante |
| `updateVariant(id, data)` | Actualiza variante existente |
| `deleteVariant(id)` | Soft delete (is_active = false) |
| `setDefaultVariant(id)` | Marca variante como predeterminada |

### 6.2 `useProductsLogic`

**Ubicación**: `src/hooks/useProductsLogic.ts`

Hook principal para la página de productos. Maneja:
- Carga de productos del usuario
- Filtrado por categoría/búsqueda
- Selección múltiple
- Eliminación (soft delete)
- Procesamiento de imágenes

---

## 7. Servicios

### 7.1 `ResellerPriceService`

**Ubicación**: `src/services/reseller-price.service.ts`

Servicio para gestión de precios personalizados de revendedores (L2).

```typescript
export class ResellerPriceService {
  // Obtener productos con precios custom y variantes
  static async getProductsWithPrices(
    replicatedCatalogId: string, 
    userId: string
  ): Promise<ProductWithCustomPrice[]>;

  // Actualizar precio de producto simple
  static async updateProductPrice(
    replicatedCatalogId: string,
    productId: string,
    userId: string,
    data: {
      custom_price_retail?: number;
      custom_price_wholesale?: number;
      is_in_stock?: boolean;
      stock_quantity?: number;
    }
  ): Promise<void>;

  // Actualizar precio de variante
  static async updateVariantPrice(
    replicatedCatalogId: string,
    variantId: string,
    userId: string,
    data: { /* mismo que arriba */ }
  ): Promise<void>;

  // Batch update
  static async batchUpdatePrices(
    replicatedCatalogId: string,
    userId: string,
    updates: Array<{ product_id?, variant_id?, ...prices }>
  ): Promise<void>;
}
```

**Reglas de Negocio:**
- L2 **NO puede bajar** precios por debajo del original de L1
- Precios se guardan en tablas separadas (`reseller_product_prices`, `reseller_variant_prices`)
- Los precios originales permanecen intactos

---

## 8. Componentes de UI

### 8.1 Páginas

| Página | Ruta | Descripción |
|--------|------|-------------|
| `ProductsManagement.tsx` | `/productos` | Tabla editable de inventario |
| `Products.tsx` | `/products` | Vista alternativa de productos |
| `Upload.tsx` | `/upload` | Carga de productos nuevos |
| `BulkUpload.tsx` | `/products/bulk-upload` | Carga masiva |

### 8.2 Componentes de Productos

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `ProductTable` | `src/components/products/table/ProductTable.tsx` | Tabla editable con TanStack Table |
| `EditableCell` | `src/components/products/table/EditableCell.tsx` | Celda editable inline |
| `VariantManagementModal` | `src/components/products/VariantManagementModal.tsx` | Modal gestión variantes |
| `VariantForm` | `src/components/products/VariantForm.tsx` | Formulario crear variantes |
| `VariantList` | `src/components/products/VariantList.tsx` | Lista de variantes existentes |
| `ExcelImporter` | `src/components/products/ExcelImporter.tsx` | Importador Excel/CSV |
| `BulkVariantCreationModal` | `src/components/products/BulkVariantCreationModal.tsx` | Creación masiva de variantes |

### 8.3 Componentes Públicos (Catálogo)

| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `VariantSelector` | `src/components/public/VariantSelector.tsx` | Selector de variantes en catálogo público |
| `PublicProductCard` | `src/components/public/PublicProductCard.tsx` | Tarjeta de producto con variantes |

---

## 9. Flujo de Precios

### 9.1 Sistema de Centavos

**CRÍTICO**: Todos los precios se almacenan en **centavos** (INTEGER) para evitar errores de punto flotante.

```typescript
// Conversión
$100.00 MXN = 10000 centavos
$99.99 MXN = 9999 centavos

// Helpers
export const centsToPrice = (cents: number): string => (cents / 100).toFixed(2);
export const priceToCents = (price: number): number => Math.round(price * 100);
```

### 9.2 Jerarquía de Precios

```
┌───────────────────────────────────────────────────────────────┐
│                    PRODUCTO PADRE (products)                   │
│         price_retail: 10000 | price_wholesale: 8000            │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                VARIANTE (product_variants)                     │
│   price_retail: 10500 (override) | price_wholesale: 8500       │
│   Si es NULL → usa precio del padre                            │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│           PRECIO L2 (reseller_variant_prices)                  │
│   custom_price_retail: 12000 (margen L2)                       │
│   Regla: custom_price >= original_price                        │
└───────────────────────────────────────────────────────────────┘
```

### 9.3 Cálculo de Precio Ajustado

```typescript
// src/lib/utils/price-calculator.ts
export function calculateAdjustedPrice(
  basePrice: number,
  adjustmentPercentage: number
): number {
  const multiplier = 1 + (adjustmentPercentage / 100);
  return Math.round(basePrice * multiplier);
}

// Uso: Catálogo con +10% en menudeo
calculateAdjustedPrice(10000, 10);  // → 11000 centavos
```

---

## 10. Tipos TypeScript

### 10.1 `src/types/products.ts`

```typescript
export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku?: string;
  description?: string;
  custom_description?: string;
  
  // Precios en centavos
  price_retail?: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  features?: string[];
  tags?: string[] | null;
  
  // Imágenes
  original_image_url: string;
  processed_image_url?: string;
  thumbnail_image_url?: string;
  catalog_image_url?: string;
  luxury_image_url?: string;
  print_image_url?: string;
  
  // Variantes
  has_variants?: boolean;
  variant_count?: number;
  
  // Sistema
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  user_id: string;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  stock_quantity?: number;
  variant_combination: Record<string, string>;
  variant_images?: any;
  is_active?: boolean;
  is_default?: boolean;
}
```

### 10.2 `src/types/variants.ts`

```typescript
export interface VariantType {
  id: string;
  name: string;           // "color", "talla_ropa"
  display_name: string;   // "Color", "Talla"
  category: ProductCategory | null;
  input_type: VariantInputType;
  is_required: boolean;
  sort_order: number;
}

export interface VariantValue {
  id: string;
  variant_type_id: string;
  value: string;          // "rojo"
  display_value: string;  // "Rojo"
  hex_color?: string;     // "#FF0000"
  sort_order: number;
  is_active: boolean;
}

export interface VariantTypeWithValues extends VariantType {
  variant_values: VariantValue[];
}

export interface CreateVariantData {
  product_id: string;
  variant_combination: Record<string, string>;
  sku?: string;
  price_retail?: number;
  price_wholesale?: number;
  stock_quantity?: number;
  is_default?: boolean;
}
```

---

## 11. Vistas de Base de Datos

### 11.1 `active_products`

Vista que filtra productos no eliminados:

```sql
CREATE VIEW active_products AS
SELECT * FROM products
WHERE deleted_at IS NULL;
```

### 11.2 `products_with_variants`

Vista que une productos con sus variantes:

```sql
CREATE VIEW products_with_variants AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.category,
  p.has_variants,
  p.variant_count,
  p.user_id,
  pv.id as variant_id,
  pv.variant_combination,
  pv.sku as variant_sku,
  pv.price_retail as variant_price_retail,
  pv.price_wholesale as variant_price_wholesale,
  pv.stock_quantity,
  pv.is_default,
  pv.is_active as variant_active
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id;
```

---

## 12. Triggers Importantes

### 12.1 `update_product_variant_count`

Mantiene sincronizado `products.variant_count`:

```sql
CREATE FUNCTION update_product_variant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET 
      variant_count = (SELECT COUNT(*) FROM product_variants 
                       WHERE product_id = NEW.product_id AND is_active = true),
      has_variants = true
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE products SET 
      variant_count = (SELECT COUNT(*) FROM product_variants 
                       WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
                       AND is_active = true),
      has_variants = (SELECT COUNT(*) > 0 FROM product_variants 
                      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
                      AND is_active = true)
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 12.2 `handle_stock_change`

Registra cambios de inventario en `inventory_logs`:

```sql
CREATE FUNCTION handle_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity THEN
    INSERT INTO inventory_logs (
      product_id, variant_id, previous_stock, new_stock,
      change_amount, change_reason, user_id
    ) VALUES (
      NEW.id, NULL, OLD.stock_quantity, NEW.stock_quantity,
      NEW.stock_quantity - OLD.stock_quantity, 'Update / Import', NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 13. Archivos del Sistema

### Tipos
- `src/types/products.ts` - Interfaces de productos
- `src/types/variants.ts` - Interfaces de variantes y categorías

### Hooks
- `src/hooks/useProductVariants.ts` - CRUD de variantes
- `src/hooks/useProductsLogic.ts` - Lógica página productos

### Servicios
- `src/services/reseller-price.service.ts` - Precios personalizados L2

### Utilidades
- `src/lib/utils/price-calculator.ts` - Cálculos de precios

### Componentes
- `src/components/products/table/ProductTable.tsx` - Tabla principal
- `src/components/products/table/EditableCell.tsx` - Celdas editables
- `src/components/products/VariantManagementModal.tsx` - Modal variantes
- `src/components/products/VariantForm.tsx` - Formulario variantes
- `src/components/products/VariantList.tsx` - Lista variantes
- `src/components/products/ExcelImporter.tsx` - Importador Excel
- `src/components/public/VariantSelector.tsx` - Selector público

### Páginas
- `src/pages/ProductsManagement.tsx` - Gestión de inventario
- `src/pages/Upload.tsx` - Carga individual
- `src/pages/BulkUpload.tsx` - Carga masiva
- `src/pages/reseller/ProductPriceEditor.tsx` - Editor precios L2

---

## 14. Diagrama de Flujo: Creación de Variantes

```
┌─────────────────┐
│ Usuario abre    │
│ producto en     │
│ inventario      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Clic en botón   │
│ "Variantes" 🔀  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────────────────────┐
│ ¿Producto tiene │────▶│ loadVariantTypes(category)      │
│ categoría?      │ Sí  │ RPC: get_variant_types_by_category│
└────────┬────────┘     └────────────────┬────────────────┘
         │ No                            │
         ▼                               ▼
┌─────────────────┐     ┌─────────────────────────────────┐
│ Mostrar mensaje │     │ Mostrar VariantForm con tipos   │
│ "Asigna una     │     │ y valores disponibles           │
│ categoría"      │     └────────────────┬────────────────┘
└─────────────────┘                      │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ Usuario selecciona valores      │
                        │ Ej: Color=Rojo,Azul | Talla=M,L │
                        └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ generateCombinations()          │
                        │ → [{color:"Rojo",talla:"M"},    │
                        │    {color:"Rojo",talla:"L"},    │
                        │    {color:"Azul",talla:"M"},    │
                        │    {color:"Azul",talla:"L"}]    │
                        │ = 4 variantes                   │
                        └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ createVariant() × 4             │
                        │ INSERT INTO product_variants    │
                        └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │ Trigger: variant_count = 4      │
                        │         has_variants = true     │
                        └─────────────────────────────────┘
```

---

## 15. Consultas SQL de Diagnóstico

```sql
-- Ver productos con variantes de un usuario
SELECT 
  p.id, p.name, p.category, p.has_variants, p.variant_count,
  (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active) as real_count
FROM products p
WHERE p.user_id = 'UUID_USUARIO'
AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;

-- Ver variantes de un producto específico
SELECT 
  pv.id, pv.variant_combination, pv.sku,
  pv.price_retail/100.0 as precio_menudeo,
  pv.price_wholesale/100.0 as precio_mayoreo,
  pv.stock_quantity, pv.is_default
FROM product_variants pv
WHERE pv.product_id = 'UUID_PRODUCTO'
AND pv.is_active = true;

-- Ver tipos de variantes por categoría
SELECT * FROM get_variant_types_by_category('ropa');

-- Ver precios personalizados L2
SELECT 
  rpp.product_id,
  p.name,
  p.price_retail as original_retail,
  rpp.custom_price_retail as custom_retail,
  rpp.stock_quantity as l2_stock
FROM reseller_product_prices rpp
JOIN products p ON rpp.product_id = p.id
WHERE rpp.replicated_catalog_id = 'UUID_CATALOGO';
```
