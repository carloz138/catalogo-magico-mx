# 📚 Sistema de Catálogos Digitales - Documentación Técnica Completa

> **Última actualización:** Enero 2026  
> **Versión:** 3.0 (Sistema Híbrido con Super Tiendas)

---

## 📑 Índice

1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Tipos de Catálogos](#2-tipos-de-catálogos)
3. [Roles de Usuario](#3-roles-de-usuario)
4. [Arquitectura de Base de Datos](#4-arquitectura-de-base-de-datos)
5. [Servicios (Backend/Frontend)](#5-servicios-backendfrontend)
6. [Páginas del Frontend](#6-páginas-del-frontend)
7. [Componentes](#7-componentes)
8. [Hooks Personalizados](#8-hooks-personalizados)
9. [Edge Functions (Supabase)](#9-edge-functions-supabase)
10. [Flujos de Creación de Catálogos](#10-flujos-de-creación-de-catálogos)
11. [Sistema de Replicación (L2)](#11-sistema-de-replicación-l2)
12. [Super Tiendas (Híbridas)](#12-super-tiendas-híbridas)
13. [Sistema de Precios Personalizados](#13-sistema-de-precios-personalizados)
14. [Sistema de Cotizaciones](#14-sistema-de-cotizaciones)
15. [Templates y Estilos](#15-templates-y-estilos)
16. [Límites y Suscripciones](#16-límites-y-suscripciones)

---

## 1. Visión General del Sistema

El sistema de catálogos digitales permite a usuarios crear tiendas online donde los clientes pueden navegar productos y generar cotizaciones. Soporta tres modelos de negocio:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DEL SISTEMA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ FABRICANTE  │────▶│ REVENDEDOR  │────▶│  CLIENTE    │       │
│  │    (L1)     │     │    (L2)     │     │   FINAL     │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│        │                   │                   │               │
│        ▼                   ▼                   ▼               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  Catálogo   │     │  Catálogo   │     │   Envía     │       │
│  │  Original   │     │  Replicado  │     │ Cotización  │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            USUARIO HÍBRIDO (L1 + L2)                     │   │
│  │  • Tiene productos propios (L1)                          │   │
│  │  • Tiene suscripciones a catálogos de otros (L2)        │   │
│  │  • Puede crear Super Tiendas (combinación de ambos)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Tipos de Catálogos

### 2.1 Catálogo Original (L1)
- **Creado por:** Fabricante/Marca (usuario L1)
- **Tabla principal:** `digital_catalogs`
- **Contiene:** Productos propios del usuario
- **URL formato:** `/c/{slug}` (ej: `/c/mi-tienda-xyz`)
- **Identificador:** `slug` generado automáticamente

### 2.2 Catálogo Replicado (L2)
- **Creado por:** Sistema (cuando L2 se suscribe o compra)
- **Tabla principal:** `replicated_catalogs`
- **Contiene:** Referencia al catálogo original + precios personalizados
- **URL formato:** `/c/r-{slug}` (prefijo `r-`)
- **Identificador:** `slug` con prefijo, `activation_token`

### 2.3 Super Tienda (Híbrida)
- **Creado por:** Usuario Híbrido (L1+L2)
- **Tabla principal:** `digital_catalogs`
- **Contiene:** Productos propios + productos de suscripciones
- **Característica especial:** Combina múltiples fuentes de inventario

### 2.4 Catálogo PDF (Legacy)
- **Tabla principal:** `catalogs`
- **Uso:** Generación de PDFs para descarga/impresión
- **Procesamiento:** vía webhook a n8n

---

## 3. Roles de Usuario

### 3.1 Definición de Roles

| Rol | Código | Descripción |
|-----|--------|-------------|
| **Fabricante** | `L1` | Tiene productos propios, puede crear catálogos originales |
| **Revendedor** | `L2` | Tiene catálogos replicados/suscripciones activas |
| **Híbrido** | `BOTH` | Combina L1 y L2 simultáneamente |
| **Sin Rol** | `NONE` | Usuario nuevo sin productos ni suscripciones |

### 3.2 Determinación del Rol

**Archivo:** `src/contexts/RoleContext.tsx`

```typescript
// Lógica de determinación:
const fetchRole = async () => {
  // 1. Verificar suscripción activa → puede ser L1
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  // 2. Verificar catálogos replicados activos → L2
  const { data: replicatedCatalogs } = await supabase
    .from("replicated_catalogs")
    .select("*")
    .eq("reseller_id", user.id)
    .eq("is_active", true);

  // 3. Determinar rol final
  const hasL1 = subscription && subscription.length > 0;
  const hasL2 = replicatedCatalogs && replicatedCatalogs.length > 0;

  if (hasL1 && hasL2) return "BOTH";
  if (hasL2) return "L2";
  if (hasL1) return "L1";
  return "NONE";
};
```

### 3.3 Permisos por Rol

| Acción | L1 | L2 | BOTH |
|--------|----|----|------|
| Crear catálogo original | ✅ | ❌ | ✅ |
| Ver catálogos replicados | ❌ | ✅ | ✅ |
| Editar precios personalizados | ❌ | ✅ | ✅ |
| Crear Super Tienda | ❌ | ❌ | ✅ |
| Ver red de distribución | ✅ | ❌ | ✅ |
| Consolidar órdenes | ❌ | ✅ | ✅ |

---

## 4. Arquitectura de Base de Datos

### 4.1 Tablas Principales

```sql
-- ═══════════════════════════════════════════════════════════
-- TABLA: digital_catalogs (Catálogos Originales)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE digital_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- Identificador público
  description TEXT,
  
  -- Template y diseño
  web_template_id TEXT,
  template_config JSONB,
  background_pattern TEXT,
  
  -- Configuración de precios
  price_display TEXT DEFAULT 'both',  -- 'menudeo_only', 'mayoreo_only', 'both'
  price_adjustment_menudeo NUMERIC DEFAULT 0,
  price_adjustment_mayoreo NUMERIC DEFAULT 0,
  
  -- Opciones de visualización
  show_sku BOOLEAN DEFAULT true,
  show_tags BOOLEAN DEFAULT true,
  show_description BOOLEAN DEFAULT true,
  show_stock BOOLEAN DEFAULT true,
  
  -- Configuración de acceso
  is_private BOOLEAN DEFAULT false,
  access_password TEXT,  -- Hash bcrypt
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Funcionalidades
  enable_quotation BOOLEAN DEFAULT false,
  enable_variants BOOLEAN DEFAULT true,
  enable_distribution BOOLEAN DEFAULT false,  -- Permite replicación
  enable_free_shipping BOOLEAN DEFAULT false,
  free_shipping_min_amount BIGINT DEFAULT 0,
  
  -- Reglas de compra
  is_wholesale_only BOOLEAN DEFAULT false,
  min_order_quantity INTEGER DEFAULT 1,
  min_order_amount NUMERIC DEFAULT 0,
  
  -- Tracking/Analytics
  tracking_head_scripts TEXT,
  tracking_body_scripts TEXT,
  tracking_config JSONB,  -- Meta CAPI config
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLA: catalog_products (Relación Catálogo-Productos)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID REFERENCES digital_catalogs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLA: replicated_catalogs (Catálogos L2)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE replicated_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_catalog_id UUID REFERENCES digital_catalogs(id),
  distributor_id UUID NOT NULL,  -- Dueño del catálogo original
  reseller_id UUID,              -- Usuario L2 (NULL hasta activación)
  quote_id UUID,                 -- Cotización que originó la réplica
  
  slug TEXT UNIQUE,              -- r-{random} formato
  activation_token TEXT UNIQUE,  -- Token para activar
  
  is_active BOOLEAN DEFAULT false,
  activation_paid BOOLEAN DEFAULT false,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Personalización (opcional)
  custom_name TEXT,
  custom_description TEXT,
  custom_logo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLA: reseller_product_prices (Precios Personalizados L2)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE reseller_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID REFERENCES replicated_catalogs(id),
  product_id UUID REFERENCES products(id),
  
  custom_price_retail INTEGER,    -- Precio menudeo (centavos)
  custom_price_wholesale INTEGER, -- Precio mayoreo (centavos)
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(replicated_catalog_id, product_id)
);

-- ═══════════════════════════════════════════════════════════
-- TABLA: reseller_variant_prices (Precios Variantes L2)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE reseller_variant_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID REFERENCES replicated_catalogs(id),
  variant_id UUID REFERENCES product_variants(id),
  
  custom_price_retail INTEGER,
  custom_price_wholesale INTEGER,
  is_in_stock BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(replicated_catalog_id, variant_id)
);

-- ═══════════════════════════════════════════════════════════
-- TABLA: catalog_subscriptions (Suscripciones a Catálogos)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE catalog_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_catalog_id UUID REFERENCES digital_catalogs(id),
  subscriber_id UUID NOT NULL,  -- Usuario L2
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- TABLA: distribution_network (Red de Distribución)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE distribution_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL,  -- L1
  reseller_id UUID,              -- L2
  replicated_catalog_id UUID REFERENCES replicated_catalogs(id),
  
  total_quotes_generated INTEGER DEFAULT 0,
  total_quotes_accepted INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  last_quote_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Diagrama de Relaciones

```
┌─────────────────────┐
│   digital_catalogs  │
│   (Catálogo L1)     │
├─────────────────────┤
│ • id                │
│ • user_id           │◄────┐
│ • slug              │     │
│ • web_template_id   │     │
│ • enable_distribution│    │
└─────────┬───────────┘     │
          │                 │
          │ 1:N             │
          ▼                 │
┌─────────────────────┐     │
│  catalog_products   │     │
├─────────────────────┤     │
│ • catalog_id ───────┼─────┘
│ • product_id ───────┼────────────────┐
│ • sort_order        │                │
└─────────────────────┘                │
                                       ▼
┌─────────────────────┐      ┌─────────────────────┐
│ replicated_catalogs │      │      products       │
├─────────────────────┤      ├─────────────────────┤
│ • id                │      │ • id                │
│ • original_catalog_id│     │ • user_id           │
│ • reseller_id       │      │ • name, sku, etc.   │
│ • slug (r-...)      │      │ • has_variants      │
│ • activation_token  │      └─────────┬───────────┘
└─────────┬───────────┘                │
          │                            │ 1:N
          │ 1:N                        ▼
          ▼                  ┌─────────────────────┐
┌─────────────────────┐      │  product_variants   │
│reseller_product_prices│    ├─────────────────────┤
├─────────────────────┤      │ • id                │
│ • replicated_catalog_id│   │ • product_id        │
│ • product_id        │      │ • variant_combination│
│ • custom_price_*    │      │ • price_retail      │
│ • stock_quantity    │      └─────────────────────┘
└─────────────────────┘
```

---

## 5. Servicios (Backend/Frontend)

### 5.1 DigitalCatalogService

**Archivo:** `src/services/digital-catalog.service.ts`

**Responsabilidades:**
- Crear, actualizar, eliminar catálogos digitales
- Verificar límites de catálogos por plan
- Obtener catálogos públicos (L1 y L2)
- Validar acceso a catálogos privados
- Registrar vistas

**Métodos principales:**

```typescript
class DigitalCatalogService {
  // Verificar si usuario puede crear más catálogos
  static async checkCatalogLimit(userId: string): Promise<CatalogLimitInfo>
  
  // Crear nuevo catálogo digital
  static async createCatalog(userId: string, data: CreateDigitalCatalogDTO): Promise<DigitalCatalog>
  
  // Obtener catálogos del usuario
  static async getUserCatalogs(userId: string): Promise<DigitalCatalog[]>
  
  // Obtener catálogo por ID (para edición)
  static async getCatalogById(catalogId: string, userId: string): Promise<DigitalCatalog & { products: any[] }>
  
  // Actualizar catálogo
  static async updateCatalog(catalogId: string, userId: string, updates: UpdateDigitalCatalogDTO): Promise<DigitalCatalog>
  
  // Eliminar catálogo
  static async deleteCatalog(catalogId: string, userId: string): Promise<void>
  
  // ⭐ CRÍTICO: Obtener catálogo público (maneja L1 y L2)
  static async getPublicCatalog(slugOrToken: string): Promise<PublicCatalogView>
  
  // Verificar contraseña de catálogo privado
  static async verifyPrivateAccess(slug: string, password: string): Promise<boolean>
  
  // Registrar vista del catálogo
  static async trackView(catalogId: string, metadata: {...}): Promise<void>
}
```

**Flujo de `getPublicCatalog`:**

```
┌────────────────────────────────────────────────────────────────┐
│                   getPublicCatalog(slug)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ¿Slug empieza con "r-"?                                       │
│      │                                                         │
│      ├── SÍ (Catálogo L2) ────────────────────────────────┐   │
│      │   1. Buscar en replicated_catalogs por slug        │   │
│      │   2. Obtener original_catalog de digital_catalogs  │   │
│      │   3. Obtener productos del catálogo original       │   │
│      │   4. Obtener precios custom de reseller_*_prices   │   │
│      │   5. Merge: producto.price = custom ?? original    │   │
│      │   6. Obtener business_info del RESELLER            │   │
│      │   7. Retornar con isReplicated: true               │   │
│      │                                                     │   │
│      └── NO (Catálogo L1) ────────────────────────────────┘   │
│          1. Buscar en digital_catalogs por slug               │
│          2. Verificar is_active y expires_at                  │
│          3. Obtener productos via catalog_products            │
│          4. Obtener business_info del OWNER                   │
│          5. Retornar con isReplicated: false                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 ReplicationService

**Archivo:** `src/services/replication.service.ts`

**Responsabilidades:**
- Gestionar catálogos replicados
- Activar catálogos para usuarios L2
- Obtener red de distribución
- Estadísticas de revendedores

**Métodos principales:**

```typescript
class ReplicationService {
  // Crear catálogo replicado (automático al aceptar cotización)
  static async createReplica(data: CreateReplicatedCatalogDTO): Promise<ReplicatedCatalog>
  
  // Obtener info de catálogo por token de activación
  static async getCatalogByToken(token: string): Promise<CatalogByTokenResponse>
  
  // Activar catálogo para usuario L2
  static async activateCatalog(data: ActivateReplicatedCatalogDTO): Promise<boolean>
  
  // Activación con solo email (flujo moderno)
  static async activateWithEmail(data: ActivateWithEmailDTO): Promise<ActivationResponse>
  
  // Completar activación post-confirmación
  static async completeActivation(token: string, userId: string): Promise<any>
  
  // Obtener red de distribución (para dashboard L1)
  static async getDistributionNetwork(distributorId: string): Promise<NetworkResellerView[]>
  
  // Estadísticas de red
  static async getNetworkStats(distributorId: string): Promise<NetworkStats>
  
  // Catálogos del revendedor
  static async getResellerCatalogs(resellerId: string): Promise<ReplicatedCatalog[]>
  
  // Dashboard del revendedor
  static async getResellerDashboard(catalogId: string, userId: string): Promise<ResellerDashboardData>
}
```

### 5.3 ResellerPriceService

**Archivo:** `src/services/reseller-price.service.ts`

**Responsabilidades:**
- Gestionar precios personalizados del revendedor
- Validar que precios no bajen del original
- Manejar inventario L2

**Métodos principales:**

```typescript
class ResellerPriceService {
  // Obtener productos con precios personalizados
  static async getProductsWithPrices(replicatedCatalogId: string, userId: string): Promise<ProductWithCustomPrice[]>
  
  // Actualizar precio de producto
  static async updateProductPrice(replicatedCatalogId: string, productId: string, userId: string, data: {...}): Promise<void>
  
  // Actualizar precio de variante
  static async updateVariantPrice(replicatedCatalogId: string, variantId: string, userId: string, data: {...}): Promise<void>
  
  // Actualización masiva
  static async batchUpdatePrices(replicatedCatalogId: string, userId: string, updates: Array<{...}>): Promise<void>
}
```

**Regla de negocio importante:**
```typescript
// El L2 NO puede vender por debajo del precio del fabricante
if (data.custom_price_retail < originalProduct.price_retail) {
  throw new Error(`No puedes bajar el precio. Mínimo: $${originalProduct.price_retail / 100}`);
}
```

### 5.4 CatalogService (PDF Legacy)

**Archivo:** `src/lib/catalogService.ts`

**Responsabilidades:**
- Crear catálogos PDF
- Enviar a webhook n8n para procesamiento
- Validar límites de generación

---

## 6. Páginas del Frontend

### 6.1 Listado de Páginas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/catalogs` | `src/pages/Catalogs.tsx` | Lista todos los catálogos del usuario |
| `/catalogs/new` | `src/pages/DigitalCatalogForm.tsx` | Crear nuevo catálogo |
| `/catalogs/:id/edit` | `src/pages/DigitalCatalogForm.tsx` | Editar catálogo existente |
| `/c/:slug` | `src/pages/PublicCatalog.tsx` | Vista pública del catálogo |
| `/activate` | `src/pages/ActivateCatalog.tsx` | Activar catálogo replicado |
| `/complete-activation` | `src/pages/CompleteActivation.tsx` | Completar activación post-email |
| `/reseller/edit-prices` | `src/pages/reseller/ProductPriceEditor.tsx` | Editar precios L2 |
| `/reseller/consolidate/:id` | `src/pages/reseller/ConsolidateOrderPage.tsx` | Consolidar pedidos para proveedor |

### 6.2 Catalogs.tsx - Página Principal

**Funcionalidades:**
- Tabs para filtrar: Todos, Digitales, PDF
- Tarjetas para cada tipo de catálogo
- Botón "Crear Super Catálogo" (usuarios híbridos)
- Acciones: Ver, Compartir, Editar, Eliminar

**Componentes internos:**
- `DigitalCatalogCard`: Catálogos L1
- `ReplicatedCatalogCard`: Catálogos L2
- `PDFCatalogCard`: Catálogos PDF legacy

**Función Super Catálogo:**
```typescript
const handleCreateSuperCatalog = async () => {
  // 1. Obtener productos suscritos (de otros proveedores)
  const { data: subscribedProducts } = await supabase.rpc(
    "get_subscribed_catalog_products",
    { p_subscriber_id: user.id }
  );

  // 2. Obtener productos propios
  const { data: myProducts } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id);

  // 3. Combinar todos los IDs
  const allProductIds = [
    ...subscribedProducts.map(p => p.product_id),
    ...myProducts.map(p => p.id),
  ];

  // 4. Crear catálogo con TODOS los productos
  await DigitalCatalogService.createCatalog(user.id, {
    name: "Mi Super Tienda",
    product_ids: [...new Set(allProductIds)],
    // ...config
  });
};
```

### 6.3 DigitalCatalogForm.tsx - Creación/Edición

**Secciones del formulario (Accordion):**
1. **Productos**: Selector de productos a incluir
2. **Diseño**: Template, patrón de fondo
3. **Precios**: Ajustes de precio, tipo de display
4. **Configuración**: SKU, tags, stock, variantes
5. **Acceso**: Privado/público, contraseña, expiración
6. **Distribución**: Permitir replicación
7. **Reglas de Compra**: MOQ, MOV, solo mayoreo
8. **Marketing**: Scripts de tracking, Meta CAPI

**Validación Zod:**
```typescript
const catalogSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  expires_at: z.date().min(new Date()),
  web_template_id: z.string().min(1),
  price_display: z.enum(["menudeo_only", "mayoreo_only", "both"]),
  product_ids: z.array(z.string()).min(1),
  is_private: z.boolean(),
  access_password: z.string().optional(),
  // ... más campos
}).refine(data => {
  if (data.is_private && !data.access_password) return false;
  return true;
}, { message: "Contraseña requerida para catálogos privados" });
```

### 6.4 PublicCatalog.tsx - Vista Pública

**Flujo de carga:**
```typescript
const { data: catalog } = useQuery({
  queryKey: ["public-catalog", slug],
  queryFn: async () => {
    let catalogData;
    let isReplicated = false;
    
    // 1. Buscar en digital_catalogs (L1)
    const { data: l1 } = await supabase
      .from("digital_catalogs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    
    if (l1) {
      catalogData = l1;
    } else {
      // 2. Buscar en replicated_catalogs (L2)
      const { data: l2 } = await supabase
        .from("replicated_catalogs")
        .select("*, digital_catalogs (*)")
        .eq("slug", slug)
        .maybeSingle();
      
      if (l2) {
        catalogData = l2.digital_catalogs;
        isReplicated = true;
        // Aplicar precios personalizados...
        // Aplicar branding del reseller...
      }
    }
    
    // 3. Cargar productos
    const products = await loadProducts(catalogData.id);
    
    // 4. Si es L2, agregar productos propios del reseller
    if (isReplicated) {
      const resellerProducts = await loadResellerProducts(l2.reseller_id);
      products.push(...resellerProducts);
    }
    
    return { ...catalogData, products, isReplicated };
  }
});
```

**Características:**
- Búsqueda y filtros de productos
- Carrito de cotización
- Botón "Vender esto" (para distribución)
- Inyección de scripts de tracking
- Meta tags dinámicos (SEO)

### 6.5 ProductPriceEditor.tsx - Editor de Precios L2

**Para:** Usuarios L2 que quieren personalizar precios

**Funcionalidades:**
- Ver precio original (costo) del fabricante
- Establecer precio de venta propio
- Calcular margen automáticamente
- Manejar inventario L2 (stock propio)
- Marcar productos como agotados o "por pedir"

---

## 7. Componentes

### 7.1 Árbol de Componentes de Catálogo

```
src/components/
├── catalog/
│   ├── BackgroundPatternSelector.tsx    # Selector de patrones de fondo
│   ├── CatalogFormPreview.tsx           # Preview en tiempo real del formulario
│   ├── CatalogPDFPreview.tsx            # Preview de catálogo PDF
│   ├── CatalogShareModal.tsx            # Modal para compartir catálogo
│   ├── DeleteCatalogDialog.tsx          # Confirmación de eliminación
│   ├── MarketRadarForm.tsx              # Formulario de solicitud de producto
│   ├── PriceAdjustmentInput.tsx         # Input para ajustar precios %
│   ├── ProductSelector.tsx              # Selector de productos para catálogo
│   ├── marketing/
│   │   └── MarketingConfiguration.tsx   # Config de Meta Pixel/CAPI
│   ├── preview/
│   │   └── CatalogProductCard.tsx       # Tarjeta producto en preview
│   └── public/
│       └── PublicCatalogContent.tsx     # Contenido principal catálogo público
│
├── public/                              # Componentes de vista pública
│   ├── AddToQuoteModal.tsx              # Modal agregar a cotización
│   ├── CatalogHeader.tsx                # Header del catálogo
│   ├── PasswordModal.tsx                # Modal contraseña catálogo privado
│   ├── ProductFilters.tsx               # Filtros de productos
│   ├── ProductSearch.tsx                # Barra de búsqueda
│   ├── ProductsContent.tsx              # Grid de productos
│   ├── PublicProductCard.tsx            # Tarjeta de producto pública
│   ├── PublicProductGrid.tsx            # Grid responsivo
│   ├── QuoteCartBadge.tsx               # Badge contador carrito
│   ├── QuoteCartModal.tsx               # Modal del carrito
│   ├── QuoteForm.tsx                    # Formulario de cotización
│   └── VariantSelector.tsx              # Selector de variantes
│
├── reseller/
│   ├── BulkPriceMarginModal.tsx         # Modal aplicar margen masivo
│   └── ResellerCatalogsSection.tsx      # Sección catálogos L2
│
└── templates/
    ├── ProductsPerPageSelector.tsx       # Selector productos por página
    ├── SmartTemplateSelector.tsx         # Selector inteligente de templates
    ├── TemplatePreview.tsx               # Preview de template
    └── WebTemplateSelector.tsx           # Selector de templates web
```

### 7.2 PublicCatalogContent.tsx

**El componente más importante para la vista pública.**

**Props:**
```typescript
interface PublicCatalogContentProps {
  catalog: DigitalCatalog & {
    isReplicated?: boolean;
    resellerId?: string;
    replicatedCatalogId?: string;
    business_info?: {...};
  };
  onTrackEvent: (event: string, data?: any) => void;
  subscribedVendorIds?: string[];
}
```

**Características:**
- Renderiza productos según template seleccionado
- Maneja búsqueda con debounce + logging a `search_logs`
- Integra carrito de cotización
- Modal de "Radar de Mercado" para productos no encontrados
- Estilos CSS dinámicos según template

### 7.3 QuoteCartModal.tsx

**Gestiona el carrito de cotización:**
- Lista items agregados
- Modificar cantidades
- Eliminar productos
- Mostrar subtotales
- Botón "Solicitar Cotización"

---

## 8. Hooks Personalizados

### 8.1 useCatalogLimits

**Archivo:** `src/hooks/useCatalogLimits.ts`

**Propósito:** Verificar límites de catálogos según plan del usuario.

```typescript
const { limits, loading, canGenerate, catalogsUsed, maxUploads } = useCatalogLimits();

// limits contiene:
interface CatalogLimits {
  canGenerate: boolean;       // ¿Puede crear más catálogos?
  catalogsUsed: number;       // Catálogos creados este mes
  catalogsLimit: number;      // Límite según plan
  remainingCatalogs: number;  // Cuántos le quedan
  maxUploads: number;         // Límite de productos
  planName: string;           // Nombre del plan
}
```

### 8.2 useSubscribedProducts

**Archivo:** `src/hooks/useSubscribedProducts.ts`

**Propósito:** Obtener productos de catálogos a los que está suscrito el usuario.

```typescript
const { 
  products,           // Lista plana de productos
  productsByVendor,   // Agrupados por proveedor
  loading, 
  error,
  refetch,
  totalCount,
  vendorCount 
} = useSubscribedProducts();
```

**Usa RPC:** `get_subscribed_catalog_products`

### 8.3 useQuoteCart (Context)

**Archivo:** `src/contexts/QuoteCartContext.tsx`

**Propósito:** Estado global del carrito de cotización.

```typescript
const {
  items,              // Items en el carrito
  addItem,            // Agregar producto
  updateQuantity,     // Modificar cantidad
  removeItem,         // Eliminar item
  clearCart,          // Vaciar carrito
  totalItems,         // Total de items
  totalAmount,        // Monto total (centavos)
  backorderItems,     // Items por pedir
  readyItems,         // Items disponibles
  hasBackorderItems,  // ¿Tiene backorders?
  maxLeadTimeDays     // Tiempo máximo de entrega
} = useQuoteCart();
```

**Persistencia:** LocalStorage por `catalogId`

### 8.4 useProductFilters

**Archivo:** `src/hooks/useProductFilters.ts`

**Propósito:** Lógica de filtrado de productos en catálogos.

### 8.5 useCatalogTracking

**Archivo:** `src/hooks/useCatalogTracking.ts`

**Propósito:** Registrar vistas y eventos del catálogo.

### 8.6 useMetaPixel

**Archivo:** `src/hooks/useMetaPixel.tsx`

**Propósito:** Integración con Meta Pixel y CAPI.

```typescript
const { trackEvent } = useMetaPixel({
  trackingConfig: catalog.tracking_config,
  isL2: catalog.isReplicated
});

// Uso:
trackEvent("ViewContent", { content_name: "Producto X" });
trackEvent("AddToCart", { value: 100, currency: "MXN" });
trackEvent("Lead", { value: totalAmount });
```

---

## 9. Edge Functions (Supabase)

### 9.1 activate-replicated-catalog

**Archivo:** `supabase/functions/activate-replicated-catalog/index.ts`

**Propósito:** Vincular usuario L2 a un catálogo replicado.

**Flujo:**
```
1. Recibe: { token, userId }
2. Estrategia 1: Buscar por activation_token en replicated_catalogs
3. Estrategia 2: Si no, buscar por quote_tracking_token → quote_id → replicated_catalog
4. Validar que no esté ya activo
5. UPDATE replicated_catalogs SET reseller_id = userId, is_active = true
6. Retornar éxito
```

### 9.2 get-quote-by-token

**Propósito:** Obtener información de cotización/catálogo por token.

### 9.3 check-catalog-limits

**Propósito:** Verificar límites de catálogos antes de crear.

### 9.4 track-catalog-view

**Propósito:** Registrar vista de catálogo con geolocalización.

### 9.5 create-quote

**Propósito:** Crear cotización desde catálogo público.

### 9.6 accept-quote-public

**Propósito:** Aceptar cotización y disparar creación de réplica.

---

## 10. Flujos de Creación de Catálogos

### 10.1 Flujo L1: Crear Catálogo Original

```
┌─────────────────────────────────────────────────────────────────┐
│                CREAR CATÁLOGO ORIGINAL (L1)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuario L1 ──► /catalogs/new                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────┐                           │
│  │  DigitalCatalogForm.tsx         │                           │
│  │  • Seleccionar productos        │                           │
│  │  • Elegir template              │                           │
│  │  • Configurar precios           │                           │
│  │  • Opciones de acceso           │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  useCatalogLimits.checkLimits() │ ──► ¿Puede crear?         │
│  └───────────────┬─────────────────┘                           │
│                  │ ✓                                            │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  DigitalCatalogService          │                           │
│  │  .createCatalog()               │                           │
│  │  • Generar slug único           │                           │
│  │  • Hash password (si privado)   │                           │
│  │  • INSERT digital_catalogs      │                           │
│  │  • INSERT catalog_products      │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  Catálogo creado                │                           │
│  │  URL: /c/{slug}                 │                           │
│  └─────────────────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Flujo L2: Activar Catálogo Replicado

```
┌─────────────────────────────────────────────────────────────────┐
│              ACTIVAR CATÁLOGO REPLICADO (L2)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  L1 acepta cotización ──► Se crea replicated_catalog            │
│       │                   (is_active: false)                    │
│       ▼                                                         │
│  Email con link: /activate?token=xxx                            │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────┐                           │
│  │  ActivateCatalog.tsx            │                           │
│  │  • Mostrar info del catálogo    │                           │
│  │  • Login o Signup               │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  Edge Function:                 │                           │
│  │  activate-replicated-catalog    │                           │
│  │  • Buscar por token             │                           │
│  │  • Vincular reseller_id         │                           │
│  │  • SET is_active = true         │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  L2 tiene acceso a:             │                           │
│  │  • Ver catálogo: /c/r-{slug}    │                           │
│  │  • Editar precios               │                           │
│  │  • Consolidar pedidos           │                           │
│  └─────────────────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Flujo Suscripción Directa (Botón "Vender Esto")

```
┌─────────────────────────────────────────────────────────────────┐
│              SUSCRIPCIÓN DIRECTA (Marketplace)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuario ve catálogo público (enable_distribution: true)        │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────┐                           │
│  │  Botón "Vender esto" visible    │                           │
│  │  (si no es dueño)               │                           │
│  └───────────────┬─────────────────┘                           │
│                  │ Click                                        │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  MarginModal.tsx                │                           │
│  │  • Seleccionar % de margen      │                           │
│  └───────────────┬─────────────────┘                           │
│                  │ Confirmar                                    │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  RPC: subscribe_with_margin     │                           │
│  │  • Crear catalog_subscription   │                           │
│  │  • Aplicar margen a precios     │                           │
│  │  • Crear replicated_catalog     │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  Usuario ahora es L2            │                           │
│  │  Productos importados           │                           │
│  │  Redirige a /products           │                           │
│  └─────────────────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Sistema de Replicación (L2)

### 11.1 Concepto

La replicación permite que un usuario L2 "venda" los productos de un L1 sin tener inventario propio. El L2:
- Ve los productos del L1
- Puede subir sus propios precios (nunca bajar)
- Recibe cotizaciones de clientes finales
- Consolida pedidos al L1

### 11.2 Estructura de Datos

```sql
-- Catálogo replicado (espejo del original)
replicated_catalogs:
  - id: uuid
  - original_catalog_id: (FK digital_catalogs) → Catálogo L1
  - distributor_id: uuid → Usuario L1 (dueño original)
  - reseller_id: uuid → Usuario L2 (revendedor)
  - slug: "r-abc123" → URL única
  - is_active: boolean

-- Precios personalizados
reseller_product_prices:
  - replicated_catalog_id → Catálogo L2
  - product_id → Producto original
  - custom_price_retail → Precio de venta L2
  - stock_quantity → Inventario L2 (opcional)
```

### 11.3 Flujo de Precios

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE PRECIOS L1 → L2                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Producto del L1:                                               │
│  ┌─────────────────────┐                                        │
│  │ price_retail: 10000 │  ($100.00)                             │
│  │ price_wholesale: 8000│  ($80.00)                             │
│  └─────────────────────┘                                        │
│           │                                                     │
│           ▼                                                     │
│  L2 edita precios en /reseller/edit-prices                      │
│  ┌─────────────────────┐                                        │
│  │ custom_price_retail:│                                        │
│  │   12000 ($120.00)   │  ✓ Válido (subió precio)               │
│  │   8000 ($80.00)     │  ✗ Inválido (bajó precio)              │
│  └─────────────────────┘                                        │
│           │                                                     │
│           ▼                                                     │
│  Cliente final ve en catálogo L2:                               │
│  ┌─────────────────────┐                                        │
│  │ Precio: $120.00     │                                        │
│  └─────────────────────┘                                        │
│           │                                                     │
│           ▼                                                     │
│  Margen L2: $120 - $100 = $20 (16.67%)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Super Tiendas (Híbridas)

### 12.1 Concepto

Una Super Tienda es un catálogo digital que combina:
- Productos propios del usuario (L1)
- Productos de catálogos a los que está suscrito (L2)

**Solo disponible para usuarios HÍBRIDOS (isL1 && isL2).**

### 12.2 Creación

```typescript
// En Catalogs.tsx
const handleCreateSuperCatalog = async () => {
  // 1. Obtener productos de suscripciones
  const { data: subscribedProducts } = await supabase.rpc(
    "get_subscribed_catalog_products",
    { p_subscriber_id: user.id }
  );

  // 2. Obtener productos propios
  const { data: myProducts } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  // 3. Combinar IDs únicos
  const allProductIds = [
    ...subscribedProducts.map(p => p.product_id),
    ...myProducts.map(p => p.id),
  ];
  const uniqueIds = [...new Set(allProductIds)];

  // 4. Crear catálogo digital con todos los productos
  await DigitalCatalogService.createCatalog(user.id, {
    name: `Mi Super Tienda ${new Date().toLocaleDateString()}`,
    description: "Catálogo unificado con todos mis proveedores y productos.",
    product_ids: uniqueIds,
    web_template_id: "sidebar-detail-warm",
    price_display: "both",
    show_stock: true,
    is_private: false,
  });
};
```

### 12.3 RPC: get_subscribed_catalog_products

```sql
CREATE OR REPLACE FUNCTION get_subscribed_catalog_products(p_subscriber_id UUID)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  price_retail INTEGER,
  price_wholesale INTEGER,
  category TEXT,
  image_url TEXT,
  vendor_id UUID,
  vendor_name TEXT,
  catalog_id UUID,
  catalog_name TEXT,
  is_subscribed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as product_id,
    p.name as product_name,
    p.sku as product_sku,
    p.price_retail,
    p.price_wholesale,
    p.category,
    COALESCE(p.processed_image_url, p.original_image_url) as image_url,
    dc.user_id as vendor_id,
    bi.business_name as vendor_name,
    dc.id as catalog_id,
    dc.name as catalog_name,
    true as is_subscribed
  FROM catalog_subscriptions cs
  JOIN digital_catalogs dc ON dc.id = cs.original_catalog_id
  JOIN catalog_products cp ON cp.catalog_id = dc.id
  JOIN products p ON p.id = cp.product_id
  LEFT JOIN business_info bi ON bi.user_id = dc.user_id
  WHERE cs.subscriber_id = p_subscriber_id
    AND cs.is_active = true
    AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## 13. Sistema de Precios Personalizados

### 13.1 Tablas Involucradas

```sql
-- Para productos
reseller_product_prices (
  replicated_catalog_id,
  product_id,
  custom_price_retail,     -- Precio menudeo L2
  custom_price_wholesale,  -- Precio mayoreo L2
  is_in_stock,            -- Disponibilidad
  stock_quantity          -- Inventario L2
)

-- Para variantes
reseller_variant_prices (
  replicated_catalog_id,
  variant_id,
  custom_price_retail,
  custom_price_wholesale,
  is_in_stock,
  stock_quantity
)
```

### 13.2 Lógica de Merge

Cuando se carga un catálogo L2:

```typescript
// En digital-catalog.service.ts → getPublicCatalog

// 1. Cargar productos del catálogo original
const products = await loadOriginalProducts(original_catalog_id);

// 2. Cargar precios personalizados
const { data: customPrices } = await supabase
  .from("reseller_product_prices")
  .select("*")
  .eq("replicated_catalog_id", replicatedCatalogId);

// 3. Crear mapa para lookup O(1)
const priceMap = new Map(customPrices.map(p => [p.product_id, p]));

// 4. Merge: custom ?? original
const mergedProducts = products.map(product => {
  const custom = priceMap.get(product.id);
  return {
    ...product,
    // Si hay precio custom, usarlo. Si no, usar original.
    price_retail: custom?.custom_price_retail ?? product.price_retail,
    price_wholesale: custom?.custom_price_wholesale ?? product.price_wholesale,
    stock_quantity: custom?.stock_quantity ?? product.stock_quantity,
  };
});
```

### 13.3 Validación de Precios

```typescript
// En reseller-price.service.ts

// REGLA: L2 no puede vender por debajo del precio L1
if (data.custom_price_retail < originalProduct.price_retail) {
  throw new Error(
    `No puedes bajar el precio. Mínimo: $${(originalProduct.price_retail / 100).toFixed(2)}`
  );
}
```

---

## 14. Sistema de Cotizaciones

### 14.1 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUJO DE COTIZACIÓN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente Final                                                  │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────┐                           │
│  │  Navega catálogo (/c/slug)      │                           │
│  │  Agrega productos al carrito    │                           │
│  │  (QuoteCartContext)             │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  QuoteCartModal.tsx             │                           │
│  │  • Revisa items                 │                           │
│  │  • Modifica cantidades          │                           │
│  │  • Click "Solicitar Cotización" │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  QuoteForm.tsx                  │                           │
│  │  • Nombre, email, teléfono      │                           │
│  │  • Método de entrega            │                           │
│  │  • Dirección (si envío)         │                           │
│  │  • Notas                        │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  Edge Function: create-quote    │                           │
│  │  • INSERT quotes                │                           │
│  │  • INSERT quote_items           │                           │
│  │  • Generar tracking_token       │                           │
│  │  • Enviar email notificación    │                           │
│  └───────────────┬─────────────────┘                           │
│                  │                                              │
│                  ▼                                              │
│  ┌─────────────────────────────────┐                           │
│  │  Dueño del catálogo recibe:     │                           │
│  │  • Notificación en dashboard    │                           │
│  │  • Email con detalles           │                           │
│  │  • Puede aceptar/rechazar       │                           │
│  └─────────────────────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 14.2 Contexto del Carrito

```typescript
// QuoteCartContext.tsx

interface QuoteItem {
  product: CartProduct;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  unitPrice: number;        // Centavos
  variantId?: string;
  variantDescription?: string;
  isBackorder?: boolean;
  leadTimeDays?: number;
}

// Acciones disponibles
const context = {
  items: QuoteItem[];
  addItem: (...) => void;
  updateQuantity: (...) => void;
  removeItem: (...) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  backorderItems: QuoteItem[];  // Items por pedir
  readyItems: QuoteItem[];      // Items disponibles
};
```

---

## 15. Templates y Estilos

### 15.1 Sistema de Templates

**Archivo principal:** `src/lib/web-catalog/expanded-templates-catalog.ts`

**Estructura de un template:**
```typescript
interface WebCatalogTemplate {
  id: string;                    // Identificador único
  name: string;                  // Nombre display
  description: string;
  category: 'basic' | 'standard' | 'seasonal';
  layout: 'modern-grid' | 'masonry' | 'sidebar-detail' | ...;
  style: 'modern' | 'elegant' | 'warm' | 'tropical' | ...;
  config: {
    columnsDesktop: number;
    columnsMobile: number;
    cardPadding: 'none' | 'sm' | 'md' | 'lg';
    cardRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    cardShadow: 'none' | 'sm' | 'md' | 'lg';
    imageAspect: 'square' | '4:3' | '3:4' | '16:9';
    showHeader: boolean;
    headerStyle: 'minimal' | 'banner' | 'hero';
    animations: 'none' | 'subtle' | 'playful';
    // ...más opciones
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    cardBackground: string;
    text: string;
    textMuted: string;
    accent: string;
  };
}
```

### 15.2 Restricciones por Plan

**Archivo:** `src/lib/web-catalog/plan-restrictions.ts`

```typescript
type PlanTier = 'free' | 'starter' | 'professional' | 'enterprise';

// Templates disponibles por plan
const PLAN_TEMPLATE_ACCESS = {
  free: ['basic'],
  starter: ['basic', 'standard'],
  professional: ['basic', 'standard', 'seasonal'],
  enterprise: ['basic', 'standard', 'seasonal'],
};

// Función para verificar acceso
function isTemplateAvailable(template: WebCatalogTemplate, tier: PlanTier): boolean {
  return PLAN_TEMPLATE_ACCESS[tier].includes(template.category);
}
```

### 15.3 Generación de CSS

**Archivo:** `src/lib/templates/web-css-adapter.ts`

```typescript
class WebTemplateAdapter {
  static generateWebCSS(template: WebCatalogTemplate, backgroundPattern?: string): string {
    return `
      :root {
        --primary: ${template.colors.primary};
        --secondary: ${template.colors.secondary};
        --background: ${template.colors.background};
        --card-radius: ${getRadiusValue(template.config.cardRadius)};
        --card-shadow: ${getShadowValue(template.config.cardShadow)};
      }
      
      .catalog-public-container {
        background: var(--background);
        ${backgroundPattern ? `background-image: url(${backgroundPattern});` : ''}
      }
      
      .product-card {
        border-radius: var(--card-radius);
        box-shadow: var(--card-shadow);
      }
      
      /* ... más estilos dinámicos */
    `;
  }
}
```

---

## 16. Límites y Suscripciones

### 16.1 Sistema de Límites

**RPC:** `can_generate_catalog`

```sql
CREATE OR REPLACE FUNCTION can_generate_catalog(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_plan_name TEXT;
  v_catalogs_limit INTEGER;
  v_catalogs_used INTEGER;
  v_can_generate BOOLEAN;
  v_message TEXT;
BEGIN
  -- 1. Obtener plan del usuario
  SELECT cp.name, cp.max_catalogs
  INTO v_plan_name, v_catalogs_limit
  FROM subscriptions s
  JOIN credit_packages cp ON cp.id = s.package_id
  WHERE s.user_id = p_user_id AND s.status = 'active';
  
  -- 2. Contar catálogos del mes actual
  SELECT catalogs_generated
  INTO v_catalogs_used
  FROM catalog_usage
  WHERE user_id = p_user_id 
    AND usage_month = EXTRACT(YEAR FROM now()) * 100 + EXTRACT(MONTH FROM now());
  
  -- 3. Determinar si puede generar
  v_can_generate := v_catalogs_used < v_catalogs_limit;
  
  -- 4. Mensaje informativo
  IF NOT v_can_generate THEN
    v_message := 'Has alcanzado el límite de catálogos para este mes. Actualiza tu plan.';
  ELSE
    v_message := format('Puedes crear %s catálogos más este mes.', v_catalogs_limit - v_catalogs_used);
  END IF;
  
  RETURN json_build_object(
    'can_generate', v_can_generate,
    'catalogs_used', v_catalogs_used,
    'catalogs_limit', v_catalogs_limit,
    'remaining', v_catalogs_limit - v_catalogs_used,
    'plan_name', v_plan_name,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql;
```

### 16.2 Tabla catalog_usage

```sql
CREATE TABLE catalog_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  usage_month INTEGER NOT NULL,  -- Formato: YYYYMM (ej: 202601)
  catalogs_generated INTEGER DEFAULT 0,
  uploads_used INTEGER DEFAULT 0,
  subscription_plan_id UUID REFERENCES credit_packages(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, usage_month)
);
```

### 16.3 Reset Mensual

El contador se resetea al inicio de cada mes calendario:
1. **Automático:** Hook `useUploadTracking` detecta nuevo mes y crea nuevo registro
2. **Por renovación:** Stripe webhook puede resetear al procesar pago

---

## 📎 Archivos de Referencia Rápida

| Categoría | Archivo | Descripción |
|-----------|---------|-------------|
| **Servicios** | `src/services/digital-catalog.service.ts` | CRUD catálogos |
| | `src/services/replication.service.ts` | Replicación L2 |
| | `src/services/reseller-price.service.ts` | Precios personalizados |
| **Páginas** | `src/pages/Catalogs.tsx` | Lista catálogos |
| | `src/pages/DigitalCatalogForm.tsx` | Crear/editar |
| | `src/pages/PublicCatalog.tsx` | Vista pública |
| **Hooks** | `src/hooks/useCatalogLimits.ts` | Límites |
| | `src/hooks/useSubscribedProducts.ts` | Productos suscritos |
| **Contextos** | `src/contexts/QuoteCartContext.tsx` | Carrito |
| | `src/contexts/RoleContext.tsx` | Roles L1/L2 |
| **Edge Functions** | `supabase/functions/activate-replicated-catalog/` | Activación |
| | `supabase/functions/create-quote/` | Crear cotización |
| **Templates** | `src/lib/web-catalog/expanded-templates-catalog.ts` | Catálogo templates |
| | `src/lib/web-catalog/plan-restrictions.ts` | Restricciones plan |

---

## 🔄 Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 3.0 | Ene 2026 | Sistema híbrido, Super Tiendas, documentación completa |
| 2.0 | Nov 2025 | Replicación L2, precios personalizados |
| 1.0 | Sep 2025 | Sistema básico de catálogos digitales |

---

*Documentación generada para CatifyPro - Sistema de Catálogos Digitales*
