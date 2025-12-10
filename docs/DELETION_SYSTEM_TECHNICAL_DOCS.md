# Sistema de Eliminación - Documentación Técnica

## Resumen General

El sistema de eliminación en CatifyPro maneja dos entidades principales:
1. **Productos**: Sistema de **Soft Delete** con papelera y archivado automático
2. **Catálogos Digitales**: Eliminación **permanente** (Hard Delete)

---

## 1. ELIMINACIÓN DE PRODUCTOS

### 1.1 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DEL PRODUCTO                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [ACTIVO]  ──soft_delete──▶  [PAPELERA]  ──30 días──▶  [ARCHIVO]   │
│     │                            │                         │        │
│     │                            │ restore_product         │        │
│     │                            ▼                         │        │
│     │◀────────────────────── [ACTIVO]                     │        │
│     │                                                      │        │
│     │                     permanently_delete               │        │
│     │                            ▼                         │        │
│     │                      [ELIMINADO]◀────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Estados del Producto

| Estado | Campo `deleted_at` | Ubicación | Descripción |
|--------|-------------------|-----------|-------------|
| **Activo** | `NULL` | Tabla `products` | Producto visible y usable |
| **En Papelera** | `timestamp` | Tabla `products` | Soft deleted, recuperable |
| **Archivado** | N/A | Tabla `product_archive` | Archivado permanentemente (>30 días) |
| **Eliminado** | N/A | Ninguna | Borrado permanentemente |

### 1.3 Base de Datos

#### Tabla: `products`
```sql
-- Campos relevantes para eliminación
deleted_at          TIMESTAMP WITHOUT TIME ZONE  -- NULL = activo, valor = en papelera
cleanup_scheduled_at TIMESTAMP WITH TIME ZONE    -- Fecha programada para archivado
cleanup_grace_period INTEGER DEFAULT 30          -- Días de gracia antes de archivar
```

#### Tabla: `product_archive`
```sql
CREATE TABLE product_archive (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id UUID NOT NULL,           -- ID original del producto
  user_id             UUID NOT NULL,           -- Propietario
  product_data        JSONB NOT NULL,          -- Snapshot completo del producto
  deleted_at          TIMESTAMP NOT NULL,      -- Cuándo se eliminó originalmente
  archived_at         TIMESTAMP DEFAULT now(), -- Cuándo se archivó
  deletion_reason     TEXT DEFAULT 'User deletion'
);
```

#### Vista: `active_products`
```sql
-- Vista que filtra productos activos (deleted_at IS NULL)
CREATE VIEW active_products AS
SELECT * FROM products
WHERE deleted_at IS NULL;
```

### 1.4 Funciones RPC (PostgreSQL)

#### `soft_delete_product`
Mueve un producto a la papelera estableciendo `deleted_at`.

```sql
-- Signatura
soft_delete_product(
  product_id UUID,
  requesting_user_id UUID,
  reason TEXT DEFAULT 'User deletion'
) RETURNS BOOLEAN

-- Lógica:
-- 1. Verifica que el usuario sea propietario del producto
-- 2. Establece deleted_at = NOW()
-- 3. Programa cleanup_scheduled_at = NOW() + 30 días
-- 4. Retorna TRUE si exitoso
```

#### `restore_product`
Restaura un producto desde la papelera.

```sql
-- Signatura
restore_product(
  product_id UUID,
  requesting_user_id UUID
) RETURNS BOOLEAN

-- Lógica:
-- 1. Verifica que el usuario sea propietario
-- 2. Establece deleted_at = NULL
-- 3. Limpia cleanup_scheduled_at
-- 4. Retorna TRUE si exitoso
```

#### `permanently_delete_product`
Elimina permanentemente un producto.

```sql
-- Signatura
permanently_delete_product(
  product_id UUID,
  requesting_user_id UUID
) RETURNS BOOLEAN

-- Lógica:
-- 1. Verifica que el usuario sea propietario
-- 2. Elimina variantes asociadas (product_variants)
-- 3. Elimina referencias en catalog_products
-- 4. DELETE FROM products
-- 5. Retorna TRUE si exitoso
```

#### `get_deleted_products`
Obtiene productos en papelera para un usuario.

```sql
-- Signatura
get_deleted_products(
  requesting_user_id UUID
) RETURNS TABLE(
  id UUID,
  name TEXT,
  sku TEXT,
  category TEXT,
  deleted_at TIMESTAMP,
  original_image_url TEXT,
  processed_image_url TEXT
)

-- Lógica:
-- SELECT productos WHERE user_id = requesting_user_id AND deleted_at IS NOT NULL
```

#### `archive_old_deleted_products`
Job automático para archivar productos antiguos.

```sql
-- Signatura
archive_old_deleted_products() RETURNS INTEGER

-- Lógica:
-- 1. Selecciona productos con deleted_at > 30 días
-- 2. Inserta snapshot en product_archive
-- 3. DELETE FROM products
-- 4. Retorna cantidad archivada
```

### 1.5 Frontend - Hooks

#### `useDeletedProducts` 
**Ubicación**: `src/hooks/useDeletedProducts.ts`

```typescript
interface DeletedProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  deleted_at: string;
  original_image_url: string;
  processed_image_url: string;
}

export const useDeletedProducts = () => {
  // Estado
  const [deletedProducts, setDeletedProducts] = useState<DeletedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos eliminados
  const loadDeletedProducts = async () => {
    const { data } = await supabase.rpc('get_deleted_products', {
      requesting_user_id: user.id
    });
    setDeletedProducts(data || []);
  };

  // Restaurar producto
  const restoreProduct = async (productId: string) => {
    await supabase.rpc('restore_product', {
      product_id: productId,
      requesting_user_id: user.id
    });
    toast({ title: "Producto restaurado" });
    await loadDeletedProducts();
  };

  // Eliminar permanentemente
  const permanentlyDeleteProduct = async (productId: string) => {
    await supabase.rpc('permanently_delete_product', {
      product_id: productId,
      requesting_user_id: user.id
    });
    toast({ title: "Producto eliminado permanentemente" });
    await loadDeletedProducts();
  };

  return {
    deletedProducts,
    loading,
    restoreProduct,
    permanentlyDeleteProduct,
    loadDeletedProducts
  };
};
```

#### `useProductsLogic`
**Ubicación**: `src/hooks/useProductsLogic.ts`

```typescript
// Eliminación soft desde la lista de productos
const confirmDeleteProduct = async () => {
  const { data, error } = await supabase.rpc("soft_delete_product", {
    product_id: productToDelete.id,
    requesting_user_id: user.id,
    reason: "User deletion",
  });

  if (data) {
    toast({
      title: "Producto eliminado",
      description: `${productToDelete.name} se movió a la papelera`,
    });
    await loadProducts();
  }
};
```

### 1.6 Frontend - Páginas y Componentes

#### Página: `DeletedProducts`
**Ubicación**: `src/pages/DeletedProducts.tsx`
**Ruta**: `/deleted-products`

```typescript
// Funcionalidades:
// - Lista productos en papelera con cards visuales
// - Botón "Restaurar" → llama restoreProduct()
// - Botón "Eliminar permanentemente" → llama permanentlyDeleteProduct()
// - Muestra tiempo desde eliminación con date-fns
// - Información de 30 días de retención
```

#### Componente: `ConfirmationDialog`
**Ubicación**: `src/components/ui/confirmation-dialog.tsx`

```typescript
// Modal genérico de confirmación usado para:
// - Confirmar restauración
// - Confirmar eliminación permanente
// - Variante "destructive" para acciones peligrosas
```

### 1.7 Flujo de Eliminación Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO: ELIMINAR PRODUCTO                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuario en /products                                               │
│       │                                                             │
│       ▼                                                             │
│  Click "Eliminar" en ProductCard                                    │
│       │                                                             │
│       ▼                                                             │
│  ConfirmationDialog aparece                                         │
│       │                                                             │
│       ▼                                                             │
│  Usuario confirma                                                   │
│       │                                                             │
│       ▼                                                             │
│  useProductsLogic.confirmDeleteProduct()                            │
│       │                                                             │
│       ▼                                                             │
│  supabase.rpc('soft_delete_product')                                │
│       │                                                             │
│       ▼                                                             │
│  PostgreSQL:                                                        │
│    - UPDATE products SET deleted_at = NOW()                         │
│    - SET cleanup_scheduled_at = NOW() + 30 days                     │
│       │                                                             │
│       ▼                                                             │
│  Toast: "Producto movido a papelera"                                │
│       │                                                             │
│       ▼                                                             │
│  Lista se recarga sin el producto                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. ELIMINACIÓN DE CATÁLOGOS DIGITALES

### 2.1 Diferencia con Productos

| Aspecto | Productos | Catálogos Digitales |
|---------|-----------|---------------------|
| Tipo | Soft Delete | **Hard Delete** |
| Recuperable | Sí (30 días) | **No** |
| Papelera | Sí | **No** |
| Acción | Marca `deleted_at` | DELETE FROM tabla |

### 2.2 Base de Datos

#### Tabla: `digital_catalogs`
```sql
-- No tiene campo deleted_at
-- La eliminación es permanente (DELETE)

-- Campos relacionados con estado:
is_active   BOOLEAN DEFAULT true    -- Catálogo activo/inactivo
expires_at  TIMESTAMP               -- Fecha de expiración opcional
```

#### Tabla: `catalogs` (PDFs legados)
```sql
-- Catálogos PDF generados (sistema anterior)
-- También eliminación permanente
```

### 2.3 Servicio de Eliminación

#### `DigitalCatalogService.deleteCatalog`
**Ubicación**: `src/services/digital-catalog.service.ts`

```typescript
static async deleteCatalog(catalogId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("digital_catalogs")
    .delete()
    .eq("id", catalogId)
    .eq("user_id", userId);  // Verifica ownership

  if (error) throw error;
}
```

### 2.4 Efectos Cascada

Cuando se elimina un catálogo digital:

```sql
-- 1. Se eliminan productos asociados en catalog_products
DELETE FROM catalog_products WHERE catalog_id = ?;

-- 2. Se eliminan vistas del catálogo
DELETE FROM catalog_views WHERE catalog_id = ?;

-- 3. Quotes asociados pierden referencia (catalog_id queda huérfano)
-- Los quotes NO se eliminan automáticamente

-- 4. Replicated catalogs pierden referencia al original
-- Los catálogos replicados NO se eliminan automáticamente
```

### 2.5 Frontend - Componentes

#### `DeleteCatalogDialog`
**Ubicación**: `src/components/catalog/DeleteCatalogDialog.tsx`

```typescript
interface DeleteCatalogDialogProps {
  catalog: DigitalCatalog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

// Características:
// - Muestra nombre del catálogo
// - Advertencia de acción irreversible
// - Muestra contador de vistas si > 0
// - Botón destructivo rojo
```

### 2.6 Página de Catálogos

**Ubicación**: `src/pages/Catalogs.tsx`

```typescript
// Mutation para eliminar catálogo digital
const deleteDigitalMutation = useMutation({
  mutationFn: async (catalogId: string) => {
    if (!user) throw new Error("No user");
    await DigitalCatalogService.deleteCatalog(catalogId, user.id);
  },
  onSuccess: () => {
    toast({ title: "Catálogo eliminado" });
    refetchDigitalCatalogs();
  },
});

// Mutation para eliminar PDF legado
const deletePDFMutation = useMutation({
  mutationFn: async (catalogId: string) => {
    const { error } = await supabase
      .from("catalogs")
      .delete()
      .eq("id", catalogId);
    if (error) throw error;
  },
  onSuccess: () => {
    toast({ title: "PDF eliminado" });
    refetchPDFCatalogs();
  },
});
```

### 2.7 Flujo de Eliminación de Catálogo

```
┌─────────────────────────────────────────────────────────────────────┐
│                  FLUJO: ELIMINAR CATÁLOGO                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Usuario en /catalogs                                               │
│       │                                                             │
│       ▼                                                             │
│  Click icono Trash en CatalogCard                                   │
│       │                                                             │
│       ▼                                                             │
│  setDeleteCatalog(catalog) → abre DeleteCatalogDialog               │
│       │                                                             │
│       ▼                                                             │
│  DeleteCatalogDialog muestra:                                       │
│    - "¿Eliminar catálogo?"                                          │
│    - Nombre del catálogo                                            │
│    - "Esta acción no se puede deshacer"                             │
│    - Contador de vistas (si aplica)                                 │
│       │                                                             │
│       ▼                                                             │
│  Usuario confirma                                                   │
│       │                                                             │
│       ▼                                                             │
│  deleteDigitalMutation.mutate(catalogId)                            │
│       │                                                             │
│       ▼                                                             │
│  DigitalCatalogService.deleteCatalog()                              │
│       │                                                             │
│       ▼                                                             │
│  PostgreSQL:                                                        │
│    - DELETE FROM digital_catalogs WHERE id = ? AND user_id = ?      │
│    - CASCADE: catalog_products se eliminan                          │
│    - CASCADE: catalog_views se eliminan                             │
│       │                                                             │
│       ▼                                                             │
│  Toast: "Catálogo eliminado"                                        │
│       │                                                             │
│       ▼                                                             │
│  refetchDigitalCatalogs() → lista se actualiza                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. ELIMINACIÓN DE CATÁLOGOS REPLICADOS (L2)

### 3.1 Servicio

**Ubicación**: `src/services/replication.service.ts`

```typescript
static async deleteReplica(catalogId: string): Promise<void> {
  // Verificar que no esté activo
  const { data: catalog } = await supabase
    .from("replicated_catalogs")
    .select("is_active")
    .eq("id", catalogId)
    .single();

  if (catalog?.is_active) {
    throw new Error("No se puede eliminar un catálogo activo");
  }

  const { error } = await supabase
    .from("replicated_catalogs")
    .delete()
    .eq("id", catalogId);

  if (error) throw error;
}
```

### 3.2 Restricciones

- Solo se pueden eliminar catálogos replicados **inactivos**
- Los catálogos activos deben desactivarse primero

---

## 4. POLÍTICAS RLS

### Productos

```sql
-- Usuarios solo pueden eliminar sus propios productos
CREATE POLICY "Users can delete own products" ON products
FOR DELETE USING (auth.uid() = user_id);

-- Vista de productos activos filtra deleted_at
CREATE POLICY "Users can view own active products" ON products
FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
```

### Catálogos Digitales

```sql
-- Usuarios solo pueden eliminar sus propios catálogos
CREATE POLICY "Users can delete own catalogs" ON digital_catalogs
FOR DELETE USING (auth.uid() = user_id);
```

### Product Archive

```sql
-- Solo sistema puede insertar en archivo
CREATE POLICY "System can insert archived products" ON product_archive
FOR INSERT WITH CHECK (true);

-- Usuarios pueden ver sus productos archivados
CREATE POLICY "Users can view own archived products" ON product_archive
FOR SELECT USING (auth.uid() = user_id);

-- Usuarios NO pueden modificar ni eliminar el archivo
-- (No hay políticas UPDATE/DELETE)
```

---

## 5. ARCHIVOS DEL SISTEMA

### Productos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/DeletedProducts.tsx` | Página de papelera de productos |
| `src/pages/Products.tsx` | Lista de productos con botón eliminar |
| `src/hooks/useDeletedProducts.ts` | Hook para gestionar papelera |
| `src/hooks/useProductsLogic.ts` | Lógica de eliminación soft |
| `src/components/ui/confirmation-dialog.tsx` | Modal de confirmación |

### Catálogos

| Archivo | Descripción |
|---------|-------------|
| `src/pages/Catalogs.tsx` | Lista de catálogos con eliminación |
| `src/components/catalog/DeleteCatalogDialog.tsx` | Modal de confirmación |
| `src/services/digital-catalog.service.ts` | Servicio de eliminación |
| `src/services/replication.service.ts` | Eliminación de réplicas |

---

## 6. QUERIES DE DIAGNÓSTICO

```sql
-- Productos en papelera
SELECT id, name, deleted_at, cleanup_scheduled_at
FROM products
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Productos próximos a archivarse (menos de 7 días)
SELECT id, name, deleted_at, cleanup_scheduled_at
FROM products
WHERE deleted_at IS NOT NULL
  AND cleanup_scheduled_at < NOW() + INTERVAL '7 days';

-- Productos archivados
SELECT original_product_id, 
       product_data->>'name' as name,
       deleted_at,
       archived_at,
       deletion_reason
FROM product_archive
ORDER BY archived_at DESC;

-- Catálogos con más vistas (para advertir antes de eliminar)
SELECT id, name, view_count, created_at
FROM digital_catalogs
WHERE view_count > 0
ORDER BY view_count DESC;

-- Catálogos inactivos candidatos a limpieza
SELECT id, name, is_active, expires_at, updated_at
FROM digital_catalogs
WHERE is_active = false
   OR expires_at < NOW();
```

---

## 7. CONSIDERACIONES IMPORTANTES

### 7.1 Productos

1. **30 días de retención**: Los productos eliminados permanecen en papelera 30 días
2. **Archivado automático**: Job `archive_old_deleted_products` mueve a `product_archive`
3. **Datos preservados**: El snapshot JSONB guarda todo el estado del producto
4. **Variantes incluidas**: Se eliminan con CASCADE al producto principal

### 7.2 Catálogos

1. **Sin recuperación**: La eliminación es permanente e irreversible
2. **Advertencia de vistas**: UI muestra contador antes de eliminar
3. **Enlaces rotos**: El slug/URL pública deja de funcionar inmediatamente
4. **Quotes huérfanos**: Los quotes recibidos mantienen histórico pero sin catálogo

### 7.3 Mejores Prácticas

- Mostrar confirmación clara antes de eliminar
- Indicar consecuencias (pérdida de vistas, enlaces rotos)
- Para catálogos populares, sugerir desactivar en vez de eliminar
- Los productos siempre van a papelera primero (soft delete)
