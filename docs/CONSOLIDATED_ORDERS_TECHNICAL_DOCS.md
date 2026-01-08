# Sistema de Órdenes Consolidadas - Documentación Técnica Completa

## Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Tablas de Base de Datos](#tablas-de-base-de-datos)
4. [Funciones RPC (PostgreSQL)](#funciones-rpc-postgresql)
5. [Triggers](#triggers)
6. [Frontend - Páginas](#frontend---páginas)
7. [Frontend - Hooks](#frontend---hooks)
8. [Frontend - Servicios](#frontend---servicios)
9. [Frontend - Componentes](#frontend---componentes)
10. [Flujos de Usuario](#flujos-de-usuario)
11. [Diagrama de Flujo](#diagrama-de-flujo)
12. [Políticas RLS](#políticas-rls)

---

## Resumen Ejecutivo

El **Sistema de Órdenes Consolidadas** permite a un **Revendedor (L2)** agrupar productos de múltiples cotizaciones aceptadas de sus clientes finales y generar un único pedido hacia su **Proveedor (L1)**. 

### Problema que resuelve:
- L2 vende productos del catálogo de L1 a clientes finales (C)
- Cuando C acepta una cotización, L2 necesita esos productos
- L2 acumula deuda de inventario (stock negativo)
- Este sistema agrupa toda esa demanda y genera un pedido consolidado al proveedor L1

### Actores:
| Actor | Rol | Descripción |
|-------|-----|-------------|
| L1 (Supplier) | Proveedor/Fabricante | Dueño del catálogo original |
| L2 (Distributor/Reseller) | Distribuidor/Revendedor | Replica el catálogo y vende a clientes finales |
| C (Customer) | Cliente Final | Compra desde el catálogo replicado de L2 |

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE ÓRDENES CONSOLIDADAS                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐     Replica      ┌──────────┐      Vende     ┌──────────┐    │
│   │    L1    │ ──────────────▶  │    L2    │ ──────────────▶│    C     │    │
│   │ Proveedor│   Catálogo       │Revendedor│   Productos    │ Cliente  │    │
│   └──────────┘                  └──────────┘                └──────────┘    │
│        ▲                              │                          │          │
│        │                              │                          │          │
│        │    Pedido Consolidado        │      Quote Accepted      │          │
│        └──────────────────────────────┤◀─────────────────────────┘          │
│                                       │                                      │
│                              ┌────────▼────────┐                             │
│                              │ Consolidated    │                             │
│                              │ Orders System   │                             │
│                              └─────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Existen DOS flujos paralelos:

#### Flujo 1: RPC-Based (Backorder Rápido)
- **Ruta**: `/reseller/consolidate/:supplierId`
- **Uso**: Creación rápida de pedidos basados en stock negativo
- **RPCs**: `get_consolidation_preview`, `create_consolidated_order`
- **Archivo**: `ConsolidateOrderPage.tsx`

#### Flujo 2: Service-Based (Gestión Completa)
- **Ruta**: `/reseller/consolidated-orders`
- **Uso**: Historial, borradores, gestión de pedidos por proveedor
- **Servicio**: `ConsolidatedOrderService`
- **Archivos**: `ConsolidatedOrdersListPage.tsx`, `useConsolidatedOrders.ts`

---

## Tablas de Base de Datos

### Tabla: `consolidated_orders`

Almacena los pedidos consolidados (headers).

```sql
CREATE TABLE public.consolidated_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID NOT NULL,           -- L2 que crea el pedido
    supplier_id UUID NOT NULL,              -- L1 proveedor destino
    original_catalog_id UUID REFERENCES digital_catalogs(id),
    replicated_catalog_id UUID REFERENCES replicated_catalogs(id),
    status TEXT NOT NULL DEFAULT 'draft',   -- draft | sent | accepted | rejected
    quote_id UUID REFERENCES quotes(id),    -- Quote generado al enviar
    source_quote_id UUID REFERENCES quotes(id),
    total_amount BIGINT DEFAULT 0,          -- Total en centavos
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Estados del pedido consolidado:
| Status | Descripción |
|--------|-------------|
| `draft` | Borrador editable, no enviado |
| `sent` | Enviado al proveedor L1 |
| `accepted` | L1 aceptó el pedido |
| `rejected` | L1 rechazó el pedido |

### Tabla: `consolidated_order_items`

Almacena los productos/variantes de cada pedido consolidado.

```sql
CREATE TABLE public.consolidated_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consolidated_order_id UUID NOT NULL REFERENCES consolidated_orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name TEXT NOT NULL,
    product_sku TEXT,
    product_image_url TEXT,
    variant_description TEXT,
    quantity INTEGER NOT NULL,
    unit_price BIGINT NOT NULL,             -- En centavos
    subtotal BIGINT DEFAULT 0,              -- quantity * unit_price
    sku TEXT,
    source_quote_ids UUID[] DEFAULT '{}',   -- IDs de quotes origen
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tablas relacionadas:

| Tabla | Relación |
|-------|----------|
| `quotes` | El pedido consolidado genera una quote para L1 |
| `quote_items` | Items de la quote generada |
| `replicated_catalogs` | Catálogo replicado de L2 |
| `digital_catalogs` | Catálogo original de L1 |
| `products` | Productos del catálogo |
| `product_variants` | Variantes de productos |
| `reseller_product_prices` | Stock de L2 para productos simples |
| `reseller_variant_prices` | Stock de L2 para variantes |
| `business_info` | Info del negocio (nombre, dirección) |

---

## Funciones RPC (PostgreSQL)

### 1. `get_consolidation_preview`

Obtiene la vista previa de productos con stock negativo que necesitan reposición.

```sql
CREATE OR REPLACE FUNCTION public.get_consolidation_preview(
    p_distributor_id UUID,  -- ID del L2
    p_catalog_id UUID       -- ID del catálogo original
)
RETURNS TABLE(
    product_id UUID,
    variant_id UUID,
    product_name TEXT,
    sku TEXT,
    image_url TEXT,
    variant_description TEXT,
    total_demand BIGINT,        -- Demanda en tránsito
    current_stock INTEGER,      -- Stock actual (negativo)
    quantity_to_order INTEGER   -- Cantidad sugerida a pedir
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_reseller_email TEXT;
BEGIN
    -- Obtener email del L2 para buscar quotes
    SELECT email INTO v_reseller_email FROM auth.users WHERE id = p_distributor_id;

    RETURN QUERY
    WITH StockData AS (
        -- A. Productos Simples con stock negativo
        SELECT 
            rpp.replicated_catalog_id,
            p.id as prod_id,
            NULL::uuid as var_id,
            p.name,
            p.sku,
            p.image_url,
            NULL::text as var_desc,
            rpp.stock_quantity
        FROM reseller_product_prices rpp
        JOIN products p ON rpp.product_id = p.id
        WHERE rpp.stock_quantity < 0

        UNION ALL

        -- B. Variantes con stock negativo
        SELECT 
            rvp.replicated_catalog_id,
            p.id as prod_id,
            rvp.variant_id as var_id,
            p.name,
            COALESCE(v.sku, p.sku) as sku,
            p.image_url, 
            (SELECT string_agg(value, ' / ') 
             FROM jsonb_each_text(v.variant_combination)) as var_desc,
            rvp.stock_quantity
        FROM reseller_variant_prices rvp
        JOIN product_variants v ON rvp.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        WHERE rvp.stock_quantity < 0
    ),
    InTransit AS (
        -- Cantidad ya pedida (en quotes pendientes/en negociación/aceptadas)
        SELECT 
            qi.product_id,
            qi.variant_id,
            SUM(qi.quantity) as qty
        FROM quotes q
        JOIN quote_items qi ON q.id = qi.quote_id
        WHERE q.customer_email = v_reseller_email
        AND q.original_catalog_id = p_catalog_id
        AND q.status IN ('pending', 'negotiation', 'accepted')
        GROUP BY qi.product_id, qi.variant_id
    )
    SELECT 
        sd.prod_id,
        sd.var_id,
        sd.name,
        sd.sku,
        sd.image_url,
        sd.var_desc,
        COALESCE(it.qty, 0)::BIGINT,     -- Demanda en tránsito
        sd.stock_quantity,                -- Stock negativo
        -- Cantidad a pedir = |stock negativo| - en tránsito
        (ABS(sd.stock_quantity) - COALESCE(it.qty, 0))::INTEGER
    FROM StockData sd
    JOIN replicated_catalogs rc ON sd.replicated_catalog_id = rc.id
    LEFT JOIN InTransit it ON 
        sd.prod_id = it.product_id AND 
        (sd.var_id IS NOT DISTINCT FROM it.variant_id)
    WHERE rc.reseller_id = p_distributor_id
    AND rc.original_catalog_id = p_catalog_id 
    AND (ABS(sd.stock_quantity) - COALESCE(it.qty, 0)) > 0;
END;
$function$;
```

### 2. `create_consolidated_order`

Crea un pedido consolidado y lo convierte inmediatamente en una quote para L1.

```sql
CREATE OR REPLACE FUNCTION public.create_consolidated_order(
    p_distributor_id UUID,      -- ID del L2
    p_supplier_id UUID,         -- ID del L1
    p_catalog_id UUID,          -- ID del catálogo original
    p_items JSONB,              -- Array de {product_id, variant_id, quantity}
    p_shipping_address TEXT,
    p_notes TEXT,
    p_delivery_method TEXT      -- 'shipping' | 'pickup'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_quote_id UUID;
    v_item JSONB;
    v_total_amount BIGINT := 0;
    v_unit_price BIGINT;
BEGIN
    -- 1. Crear Quote para L1
    INSERT INTO quotes (
        user_id,                    -- L1 es dueño de la quote
        catalog_id, 
        customer_name, 
        customer_email, 
        customer_phone,
        shipping_address, 
        notes, 
        status, 
        total_amount, 
        delivery_method,
        is_from_replicated, 
        original_catalog_id
    )
    SELECT 
        p_supplier_id,              -- L1 recibe la cotización
        p_catalog_id, 
        bi.business_name,           -- Nombre del L2
        u.email, 
        bi.phone,
        p_shipping_address, 
        p_notes, 
        'pending',                  -- Status inicial
        0, 
        p_delivery_method, 
        true,                       -- Marca que viene de catálogo replicado
        p_catalog_id
    FROM auth.users u
    LEFT JOIN business_info bi ON bi.user_id = u.id
    WHERE u.id = p_distributor_id
    RETURNING id INTO v_quote_id;

    -- 2. Insertar Items de la quote
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Obtener precio mayoreo del producto/variante
        IF (v_item->>'variant_id') IS NOT NULL THEN
            SELECT price_wholesale INTO v_unit_price 
            FROM product_variants 
            WHERE id = (v_item->>'variant_id')::UUID;
        ELSE
            SELECT price_wholesale INTO v_unit_price 
            FROM products 
            WHERE id = (v_item->>'product_id')::UUID;
        END IF;

        IF v_unit_price IS NULL THEN 
            v_unit_price := 0; 
        END IF;

        INSERT INTO quote_items (
            quote_id, 
            product_id, 
            variant_id, 
            quantity, 
            unit_price, 
            total_price, 
            price_type
        ) VALUES (
            v_quote_id, 
            (v_item->>'product_id')::UUID, 
            (v_item->>'variant_id')::UUID,
            (v_item->>'quantity')::INTEGER, 
            v_unit_price, 
            v_unit_price * (v_item->>'quantity')::INTEGER, 
            'wholesale'
        );
        
        v_total_amount := v_total_amount + (v_unit_price * (v_item->>'quantity')::INTEGER);
    END LOOP;

    -- 3. Actualizar total de la quote
    UPDATE quotes SET total_amount = v_total_amount WHERE id = v_quote_id;

    -- 4. Retornar resultado
    RETURN json_build_object(
        'success', true, 
        'quote_id', v_quote_id, 
        'total_amount', v_total_amount
    );
END;
$function$;
```

### 3. `update_consolidated_orders_updated_at`

Trigger function para actualizar automáticamente `updated_at`.

```sql
CREATE OR REPLACE FUNCTION public.update_consolidated_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
```

---

## Triggers

### Trigger 1: `update_consolidated_orders_updated_at_trigger`

```sql
CREATE TRIGGER update_consolidated_orders_updated_at_trigger 
BEFORE UPDATE ON public.consolidated_orders 
FOR EACH ROW 
EXECUTE FUNCTION update_consolidated_orders_updated_at();
```

### Trigger 2: `update_consolidated_order_items_updated_at_trigger`

```sql
CREATE TRIGGER update_consolidated_order_items_updated_at_trigger 
BEFORE UPDATE ON public.consolidated_order_items 
FOR EACH ROW 
EXECUTE FUNCTION update_consolidated_orders_updated_at();
```

---

## Frontend - Páginas

### 1. `ConsolidateOrderPage.tsx`
**Ruta**: `/reseller/consolidate/:supplierId`

**Propósito**: Crear pedidos de reposición rápida basados en stock negativo.

**Flujo**:
1. Llama a RPC `get_consolidation_preview` para obtener productos con deuda
2. Muestra lista seleccionable de productos a pedir
3. Permite elegir método de entrega (envío/recoger)
4. Al confirmar, llama a RPC `create_consolidated_order`
5. Redirige a `/orders`

**Código clave**:
```typescript
// Llamar RPC para vista previa
const { data: consolidationData } = await supabase.rpc("get_consolidation_preview", {
    p_distributor_id: user?.id,
    p_catalog_id: supplierId,
});

// Crear orden consolidada
const { data } = await supabase.rpc("create_consolidated_order", {
    p_distributor_id: user.id,
    p_supplier_id: catalogInfo.user_id,
    p_catalog_id: supplierId,
    p_items: orderPayload,
    p_shipping_address: deliveryMethod === "shipping" ? address : "Recoger en Tienda",
    p_notes: `[REPOSICIÓN] Pedido consolidado...`,
    p_delivery_method: deliveryMethod,
});
```

### 2. `ConsolidatedOrdersListPage.tsx`
**Ruta**: `/reseller/consolidated-orders`

**Propósito**: Gestionar historial de pedidos consolidados por proveedor.

**Flujo**:
1. Al cargar, busca catálogos replicados con cotizaciones aceptadas
2. Crea/sincroniza borradores automáticamente
3. Muestra lista con tabs por estado (draft/sent/accepted/rejected)
4. Permite sincronizar borradores con nuevas cotizaciones
5. Click en tarjeta navega a detalle

**Código clave**:
```typescript
// Inicializar borradores
const initializeConsolidatedOrders = async () => {
    // Buscar catálogos replicados activos
    const { data: replicatedCatalogs } = await supabase
        .from("replicated_catalogs")
        .select("id, original_catalog_id, distributor_id")
        .eq("reseller_id", user.id)
        .eq("is_active", true);

    for (const rc of replicatedCatalogs) {
        // Verificar si tiene quotes aceptadas
        const { data: acceptedQuotes } = await supabase
            .from("quotes")
            .select("id")
            .eq("replicated_catalog_id", rc.id)
            .eq("status", "accepted")
            .limit(1);

        if (acceptedQuotes?.length > 0) {
            await getOrCreateDraft(rc.distributor_id, rc.original_catalog_id, rc.id);
        }
    }
};
```

---

## Frontend - Hooks

### `useConsolidatedOrders.ts`

Hook para gestionar pedidos consolidados con el servicio.

**Estados**:
```typescript
const [orders, setOrders] = useState<ConsolidatedOrderWithDetails[]>([]);
const [currentDraft, setCurrentDraft] = useState<ConsolidatedOrderWithDetails | null>(null);
const [loading, setLoading] = useState(false);
const [syncing, setSyncing] = useState(false);
const [sending, setSending] = useState(false);
```

**Acciones disponibles**:

| Función | Descripción |
|---------|-------------|
| `loadOrders()` | Cargar lista de pedidos consolidados |
| `getOrCreateDraft(supplierId, originalCatalogId, replicatedCatalogId)` | Obtener o crear borrador |
| `loadDraft(supplierId)` | Cargar borrador específico |
| `syncDraft(consolidatedOrderId, replicatedCatalogId)` | Sincronizar borrador con nuevas quotes |
| `updateItemQuantity(itemId, quantity)` | Actualizar cantidad de item |
| `removeItem(itemId)` | Eliminar item del borrador |
| `addProduct(productData)` | Agregar producto manualmente |
| `sendOrder(consolidatedOrderId, notes)` | Enviar pedido (convierte a quote) |
| `updateNotes(consolidatedOrderId, notes)` | Actualizar notas |

---

## Frontend - Servicios

### `ConsolidatedOrderService.ts`

Clase con métodos estáticos para operaciones CRUD.

**Métodos principales**:

#### `getOrCreateDraft`
```typescript
static async getOrCreateDraft(
    distributorId: string,
    supplierId: string,
    originalCatalogId: string,
    replicatedCatalogId: string
): Promise<CreateDraftResponse>
```
- Busca borrador existente
- Si no existe, crea uno nuevo
- Sincroniza con cotizaciones aceptadas

#### `syncDraftWithQuotes`
```typescript
static async syncDraftWithQuotes(
    consolidatedOrderId: string,
    distributorId: string,
    replicatedCatalogId: string
): Promise<void>
```
- Obtiene quotes aceptadas del catálogo replicado
- Agrupa productos por product_id + variant_id
- Inserta solo items nuevos (evita duplicados)

#### `aggregateProducts` (privado)
```typescript
private static aggregateProducts(quotes: any[]): ProductAggregation[]
```
- Agrupa productos de múltiples quotes
- Suma cantidades de duplicados
- Trackea IDs de quotes origen

#### `sendOrder`
```typescript
static async sendOrder(
    data: SendConsolidatedOrderDTO, 
    distributorId: string
): Promise<string>
```
- Obtiene borrador con items
- Crea quote para L1 con status "pending"
- Crea quote_items correspondientes
- Actualiza consolidated_order a status "sent"
- Retorna ID de la quote generada

---

## Frontend - Componentes

### `ConsolidatedOrderCard.tsx`

Tarjeta para mostrar resumen de un pedido consolidado.

**Props**:
```typescript
interface ConsolidatedOrderCardProps {
    order: ConsolidatedOrderWithDetails;
    onSync?: (orderId: string) => void;
    onClick?: (orderId: string) => void;
    syncing?: boolean;
}
```

**Muestra**:
- Nombre del proveedor
- Nombre del catálogo
- Badge de estado (con icono y color)
- Cantidad de productos
- Cantidad de cotizaciones origen
- Total en MXN
- Fecha de creación
- Notas (si existen)
- Botones de acción (Sincronizar, Ver detalle)

---

## Flujos de Usuario

### Flujo A: Creación Rápida de Pedido (RPC)

```
1. L2 va a /reseller/consolidate/:supplierId
2. Sistema llama get_consolidation_preview(distributor_id, catalog_id)
3. Sistema muestra productos con stock negativo
4. L2 selecciona productos y método de entrega
5. L2 confirma → sistema llama create_consolidated_order(...)
6. Sistema crea quote para L1 con status "pending"
7. L2 es redirigido a /orders
8. L1 recibe la quote y puede aceptar/rechazar
```

### Flujo B: Gestión de Borradores (Service)

```
1. L2 va a /reseller/consolidated-orders
2. Sistema busca catálogos replicados con quotes aceptadas
3. Para cada uno, llama getOrCreateDraft(...)
4. Sistema muestra lista de pedidos por proveedor
5. L2 puede:
   a. Sincronizar borrador (agregar nuevas quotes aceptadas)
   b. Editar cantidades
   c. Eliminar items
   d. Agregar productos manualmente
   e. Enviar pedido (convierte a quote)
6. Al enviar, se crea quote para L1
```

### Flujo C: L1 Procesa el Pedido

```
1. L1 ve quote en su lista de cotizaciones recibidas
2. L1 puede ver items, notas, método de entrega
3. L1 acepta → quote.status = 'accepted'
4. L1 rechaza → quote.status = 'rejected'
5. L2 ve el cambio de estado en su lista
```

---

## Diagrama de Flujo

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO COMPLETO DE ÓRDENES CONSOLIDADAS                │
└────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                             ┌──────────┐
    │    L1    │                                             │    C     │
    │ Proveedor│                                             │ Cliente  │
    └────┬─────┘                                             └────┬─────┘
         │                                                        │
         │ 1. Crea catálogo                                       │
         ▼                                                        │
    ┌──────────┐                                                  │
    │ digital  │                                                  │
    │ catalogs │                                                  │
    └────┬─────┘                                                  │
         │                                                        │
         │ 2. L2 replica                                          │
         ▼                                                        │
    ┌──────────┐         ┌──────────┐                            │
    │replicated│ ◄────── │    L2    │                            │
    │ catalogs │         │Revendedor│                            │
    └────┬─────┘         └────┬─────┘                            │
         │                    │                                   │
         │                    │ 3. L2 comparte catálogo          │
         │                    ├────────────────────────────────►│
         │                    │                                   │
         │                    │                       4. C cotiza │
         │                    │◄──────────────────────────────────┤
         │                    │                                   │
         │                    │ 5. L2 acepta quote                │
         │                    ▼                                   │
         │               ┌──────────┐                             │
         │               │  quotes  │ ◄─── quote de C a L2        │
         │               │(accepted)│                             │
         │               └────┬─────┘                             │
         │                    │                                   │
         │                    │ 6. Stock L2 se vuelve negativo    │
         │                    ▼                                   │
         │               ┌──────────┐                             │
         │               │ reseller │                             │
         │               │ _prices  │ (stock_quantity < 0)        │
         │               └────┬─────┘                             │
         │                    │                                   │
         │                    │ 7. Sistema detecta deuda          │
         │                    ▼                                   │
         │          ┌──────────────────┐                          │
         │          │  consolidated    │                          │
         │          │     orders       │ (draft)                  │
         │          └────────┬─────────┘                          │
         │                   │                                    │
         │                   │ 8. L2 envía pedido                 │
         │                   ▼                                    │
         │          ┌──────────────────┐                          │
         │          │     quotes       │ ◄─── quote de L2 a L1    │
         │          │   (pending)      │                          │
         │          └────────┬─────────┘                          │
         │                   │                                    │
    ◄────┴───────────────────┤                                    │
         │                   │                                    │
    9. L1 recibe quote       │                                    │
         │                   │                                    │
    10. L1 acepta/rechaza    │                                    │
         │                   │                                    │
         ▼                   │                                    │
    ┌──────────┐             │                                    │
    │  quotes  │─────────────┘                                    │
    │(accepted)│                                                  │
    └──────────┘                                                  │
```

---

## Políticas RLS

### Tabla: `consolidated_orders`

```sql
-- L2 puede crear sus pedidos
CREATE POLICY "Distributors can create consolidated orders" 
ON consolidated_orders FOR INSERT 
WITH CHECK (distributor_id = auth.uid());

-- L2 puede ver sus pedidos
CREATE POLICY "Distributors can view their consolidated orders" 
ON consolidated_orders FOR SELECT 
USING (distributor_id = auth.uid());

-- L2 puede editar solo borradores
CREATE POLICY "Distributors can update their draft consolidated orders" 
ON consolidated_orders FOR UPDATE 
USING (distributor_id = auth.uid() AND status = 'draft')
WITH CHECK (distributor_id = auth.uid());

-- L1 puede ver pedidos enviados (no drafts)
CREATE POLICY "Suppliers can view consolidated orders sent to them" 
ON consolidated_orders FOR SELECT 
USING (supplier_id = auth.uid() AND status <> 'draft');
```

### Tabla: `consolidated_order_items`

```sql
-- L2 puede gestionar items de sus pedidos
CREATE POLICY "Distributors can manage items of their consolidated orders" 
ON consolidated_order_items FOR ALL 
USING (EXISTS (
    SELECT 1 FROM consolidated_orders 
    WHERE id = consolidated_order_items.consolidated_order_id 
    AND distributor_id = auth.uid()
));

-- L1 puede ver items de pedidos enviados
CREATE POLICY "Suppliers can view items of orders sent to them" 
ON consolidated_order_items FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM consolidated_orders 
    WHERE id = consolidated_order_items.consolidated_order_id 
    AND supplier_id = auth.uid() 
    AND status <> 'draft'
));
```

---

## Tipos TypeScript

### `src/types/consolidated-order.ts`

```typescript
export type ConsolidatedOrderStatus = "draft" | "sent" | "accepted" | "rejected";

export interface ConsolidatedOrder {
    id: string;
    distributor_id: string;
    supplier_id: string;
    original_catalog_id: string;
    replicated_catalog_id: string;
    status: ConsolidatedOrderStatus;
    quote_id: string | null;
    notes: string | null;
    created_at: string;
    sent_at: string | null;
    updated_at: string;
}

export interface ConsolidatedOrderItem {
    id: string;
    consolidated_order_id: string;
    product_id: string;
    variant_id: string | null;
    product_name: string;
    product_sku: string | null;
    variant_description: string | null;
    product_image_url: string | null;
    quantity: number;
    unit_price: number;        // en centavos
    subtotal: number;          // en centavos
    source_quote_ids: string[];
    created_at: string;
    updated_at: string;
}

export interface ConsolidatedOrderWithDetails extends ConsolidatedOrder {
    items: ConsolidatedOrderItem[];
    items_count: number;
    total_amount: number;
    supplier_name: string;
    supplier_business_name: string | null;
    catalog_name: string;
    source_quotes_count: number;
}

export interface ConsolidatedOrderItemInput {
    product_id: string;
    variant_id?: string | null;
    product_name: string;
    product_sku?: string | null;
    variant_description?: string | null;
    product_image_url?: string | null;
    quantity: number;
    unit_price: number;
    source_quote_ids?: string[];
}

export interface ProductAggregation {
    product_id: string;
    variant_id: string | null;
    product_name: string;
    product_sku: string | null;
    variant_description: string | null;
    product_image_url: string | null;
    total_quantity: number;
    unit_price: number;
    source_quote_ids: string[];
}

export interface SendConsolidatedOrderDTO {
    consolidated_order_id: string;
    notes?: string;
}

export interface CreateDraftResponse {
    consolidated_order: ConsolidatedOrder;
    is_new: boolean;
    items: ConsolidatedOrderItem[];
}

export interface CreateConsolidatedOrderResponse {
    success: boolean;
    consolidated_order_id: string;
    quote_id: string;
    total_amount: number;
}
```

---

## Acceso desde el Sidebar

El sistema es accesible desde:

1. **Sidebar** → "Pedidos a Proveedores" (solo L2/BOTH)
   - Ruta: `/reseller/consolidated-orders`
   - Icono: `PackageCheck`

2. **Página de Órdenes** → Tab "Mis Compras" → "Gestionar Borradores"
   - Ruta: `/reseller/consolidated-orders`

---

## Resumen de Archivos

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `src/types/consolidated-order.ts` | Tipos | Definiciones TypeScript |
| `src/services/consolidated-order.service.ts` | Servicio | Operaciones CRUD con Supabase |
| `src/hooks/useConsolidatedOrders.ts` | Hook | Estado y acciones para React |
| `src/pages/reseller/ConsolidateOrderPage.tsx` | Página | Creación rápida de pedidos (RPC) |
| `src/pages/reseller/ConsolidatedOrdersListPage.tsx` | Página | Lista y gestión de pedidos |
| `src/components/consolidated/ConsolidatedOrderCard.tsx` | Componente | Tarjeta de resumen |
| DB Function: `get_consolidation_preview` | RPC | Vista previa de backorders |
| DB Function: `create_consolidated_order` | RPC | Crear pedido y quote |
| DB Trigger: `update_*_updated_at_trigger` | Trigger | Auto-update timestamps |
