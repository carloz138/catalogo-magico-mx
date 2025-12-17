# Sistema de Cotizaciones, Órdenes y Pagos - Documentación Técnica Completa

> **Versión:** 2.0  
> **Última Actualización:** Diciembre 2024  
> **Plataforma:** CatifyPro - B2B Catalog SaaS

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Base de Datos](#2-base-de-datos)
3. [Flujo de Creación de Cotizaciones](#3-flujo-de-creación-de-cotizaciones)
4. [Sistema de Tracking](#4-sistema-de-tracking)
5. [Integración con Envío (Envia.com)](#5-integración-con-envío-enviacom)
6. [Integración con Pagos (Openpay)](#6-integración-con-pagos-openpay)
7. [Replicación de Catálogos](#7-replicación-de-catálogos)
8. [Gestión de Órdenes](#8-gestión-de-órdenes)
9. [Órdenes Consolidadas](#9-órdenes-consolidadas)
10. [Archivos del Sistema](#10-archivos-del-sistema)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Diagramas de Flujo](#12-diagramas-de-flujo)

---

## 1. Arquitectura General

### 1.1 Modelo de Negocio Multi-Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    JERARQUÍA DE USUARIOS                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1 (FABRICANTE/PROVEEDOR)                                  │
│  └── Crea catálogos digitales                               │
│  └── Gestiona productos e inventario                        │
│  └── Recibe cotizaciones directas                           │
│  └── Habilita distribución viral                            │
│                                                             │
│  L2 (REVENDEDOR/DISTRIBUIDOR)                               │
│  └── Replica catálogos de L1                                │
│  └── Personaliza precios y márgenes                         │
│  └── Recibe cotizaciones de clientes finales                │
│  └── Consolida órdenes hacia L1                             │
│                                                             │
│  L3 (CLIENTE FINAL)                                         │
│  └── Navega catálogos públicos                              │
│  └── Solicita cotizaciones                                  │
│  └── Acepta y paga órdenes                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI Framework | Tailwind CSS + shadcn/ui |
| State Management | React Context + TanStack Query |
| Backend | Supabase Edge Functions (Deno) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Pagos | Openpay (SPEI) |
| Envíos | Envia.com API |
| Notificaciones | Resend (Email) + Meta WhatsApp Cloud API |

---

## 2. Base de Datos

### 2.1 Tablas Principales

#### `quotes` - Cotizaciones
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                              -- Dueño de la venta (L1 o L2)
  catalog_id UUID,                           -- Catálogo de origen de productos
  replicated_catalog_id UUID,                -- Si viene de catálogo replicado
  
  -- Datos del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  notes TEXT,
  
  -- Entrega
  delivery_method delivery_method_enum,      -- 'pickup' | 'shipping'
  shipping_address JSONB,                    -- Dirección estructurada
  shipping_cost INTEGER DEFAULT 0,           -- Centavos
  estimated_delivery_date DATE,
  
  -- Estado
  status TEXT DEFAULT 'pending',             -- pending|negotiation|accepted|rejected|shipped
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  tracking_code TEXT,
  carrier_name TEXT,
  order_number TEXT,
  
  -- Montos (en centavos)
  total_amount INTEGER DEFAULT 0,
  items_count INTEGER,
  
  -- Control
  is_from_replicated BOOLEAN DEFAULT FALSE,
  original_catalog_id UUID,
  tracking_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `quote_items` - Items de Cotización
```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  product_id UUID,
  variant_id UUID,
  
  -- Snapshot del producto
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  variant_description TEXT,
  
  -- Precios (centavos)
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  price_type TEXT,                          -- 'menudeo' | 'mayoreo'
  
  -- Producción (backorder)
  production_status TEXT DEFAULT 'ready',   -- ready|waiting_for_supplier|ready_to_ship
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `quote_tracking_tokens` - Tokens de Seguimiento
```sql
CREATE TABLE quote_tracking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  token TEXT NOT NULL UNIQUE,               -- Token aleatorio para URL pública
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `payment_transactions` - Transacciones de Pago
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  merchant_id UUID REFERENCES merchants(id),
  
  -- Montos (centavos)
  amount_total INTEGER NOT NULL,
  commission_saas INTEGER NOT NULL,
  cost_gateway INTEGER DEFAULT 0,
  net_to_merchant INTEGER NOT NULL,
  
  -- Openpay
  payment_method TEXT DEFAULT 'SPEI',
  clabe_virtual_in TEXT,                    -- CLABE generada para este pago
  provider_transaction_id TEXT,             -- ID de Openpay
  
  status TEXT DEFAULT 'pending',            -- pending|paid|failed
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `replicated_catalogs` - Catálogos Replicados (L2)
```sql
CREATE TABLE replicated_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_catalog_id UUID NOT NULL REFERENCES digital_catalogs(id),
  distributor_id UUID NOT NULL,             -- L1 dueño del catálogo original
  reseller_id UUID,                         -- L2 que activó la réplica
  quote_id UUID,                            -- Cotización que generó esta réplica (si aplica)
  
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  activation_token TEXT,
  
  -- Personalización L2
  custom_name TEXT,
  custom_description TEXT,
  custom_logo_url TEXT,
  tracking_config JSONB DEFAULT '{}',
  
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `merchants` - Datos Bancarios de Vendedores
```sql
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  clabe_deposit TEXT NOT NULL,              -- CLABE de depósito del vendedor
  rfc TEXT,
  openpay_id TEXT,                          -- ID del comercio en Openpay
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Funciones RPC Importantes

```sql
-- Descontar inventario tras pago
CREATE FUNCTION process_inventory_deduction(quote_id UUID) RETURNS JSONB;

-- Obtener cola de producción (backorders)
CREATE FUNCTION get_production_queue(p_vendor_user_id UUID) RETURNS TABLE(...);

-- Asignar stock a backorders
CREATE FUNCTION allocate_stock_to_backorders(...) RETURNS JSON;

-- Vista previa de consolidación
CREATE FUNCTION get_consolidation_preview(p_distributor_id UUID, p_catalog_id UUID) RETURNS TABLE(...);

-- Obtener KPIs del dashboard
CREATE FUNCTION fn_get_dashboard_kpis(p_user_id UUID) RETURNS JSON;

-- Conteos de sidebar
CREATE FUNCTION get_sidebar_counts(p_user_id UUID) RETURNS TABLE(pending_quotes, orders_to_ship);
```

### 2.3 Triggers

```sql
-- Auto-crear réplica de catálogo cuando se acepta cotización viral
CREATE TRIGGER on_quote_insert
AFTER INSERT ON quotes
FOR EACH ROW EXECUTE FUNCTION handle_new_quote_replication();

-- Actualizar timestamps
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Flujo de Creación de Cotizaciones

### 3.1 Diagrama de Secuencia

```
┌──────────┐    ┌────────────────┐    ┌──────────────────┐    ┌────────────┐
│ Cliente  │    │  QuoteForm.tsx │    │  create-quote    │    │  Supabase  │
│  (L3)    │    │   (Frontend)   │    │ (Edge Function)  │    │    DB      │
└────┬─────┘    └───────┬────────┘    └────────┬─────────┘    └─────┬──────┘
     │                  │                      │                    │
     │ 1. Agregar al carrito                   │                    │
     │─────────────────>│                      │                    │
     │                  │                      │                    │
     │ 2. Completar formulario                 │                    │
     │─────────────────>│                      │                    │
     │                  │                      │                    │
     │                  │ 3. POST /create-quote│                    │
     │                  │─────────────────────>│                    │
     │                  │                      │                    │
     │                  │                      │ 4. Determinar dueño│
     │                  │                      │ (L1 o L2)          │
     │                  │                      │───────────────────>│
     │                  │                      │<───────────────────│
     │                  │                      │                    │
     │                  │                      │ 5. INSERT quotes   │
     │                  │                      │───────────────────>│
     │                  │                      │                    │
     │                  │                      │ 6. INSERT items    │
     │                  │                      │───────────────────>│
     │                  │                      │                    │
     │                  │                      │ 7. Invoke notif    │
     │                  │                      │───────────────────>│
     │                  │                      │                    │
     │                  │<─────────────────────│                    │
     │                  │    { quote_id }      │                    │
     │<─────────────────│                      │                    │
     │  ✅ Confirmación │                      │                    │
```

### 3.2 Frontend: Carrito de Cotización

**Archivo:** `src/contexts/QuoteCartContext.tsx`

```typescript
interface QuoteItem {
  product: CartProduct;
  quantity: number;
  priceType: 'retail' | 'wholesale';
  unitPrice: number;           // Centavos
  variantId?: string | null;
  variantDescription?: string | null;
  isBackorder?: boolean;       // Para productos bajo pedido
  leadTimeDays?: number;       // Días de fabricación
}

// Funcionalidades principales:
// - addItem(): Agregar producto al carrito
// - updateQuantity(): Modificar cantidad
// - removeItem(): Eliminar del carrito
// - clearCart(): Vaciar carrito
// - Computed: backorderItems, readyItems, hasBackorderItems
```

### 3.3 Frontend: Formulario de Cotización

**Archivo:** `src/components/public/QuoteForm.tsx`

```typescript
// Schema de validación (Zod)
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  delivery_method: z.enum(['pickup', 'shipping']),
  notes: z.string().max(500).optional(),
  // Campos de dirección (requeridos si delivery_method === 'shipping')
  street: z.string().optional(),
  colony: z.string().optional(),
  zip_code: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  references: z.string().optional(),
});
```

### 3.4 Backend: Edge Function `create-quote`

**Archivo:** `supabase/functions/create-quote/index.ts`

```typescript
// LÓGICA CRÍTICA: Determinar dueño de la venta

// CASO 1: Venta a través de Revendedor (L2)
if (payload.replicated_catalog_id) {
  const replica = await supabaseAdmin
    .from('replicated_catalogs')
    .select('reseller_id')
    .eq('id', payload.replicated_catalog_id)
    .single();
  
  saleOwnerUserId = replica.reseller_id;  // ← La venta es del L2
}

// CASO 2: Venta Directa del Fabricante (L1)
else {
  const catalogOwner = await supabaseAdmin
    .from('digital_catalogs')
    .select('user_id')
    .eq('id', payload.catalog_id)
    .single();
  
  saleOwnerUserId = catalogOwner.user_id;  // ← La venta es del L1
}
```

### 3.5 Service Layer

**Archivo:** `src/services/quote.service.ts`

```typescript
export class QuoteService {
  // Crear cotización via Edge Function
  static async createQuote(data: CreateQuoteDTO): Promise<Quote>
  
  // Obtener cotizaciones del usuario (L1 o L2)
  static async getUserQuotes(userId: string, filters?): Promise<QuoteWithMetadata[]>
  
  // Obtener detalle completo
  static async getQuoteDetail(quoteId: string, userId: string): Promise<QuoteDetail>
  
  // Actualizar envío y pasar a negociación
  static async updateShippingAndNegotiate(
    quoteId: string,
    userId: string,
    shippingCost: number,
    newTotal: number,
    deliveryDate: string
  ): Promise<Quote>
  
  // Cambiar estado
  static async updateQuoteStatus(quoteId: string, userId: string, status: QuoteStatus): Promise<Quote>
  
  // Actualizar fulfillment (logística)
  static async updateFulfillmentStatus(
    quoteId: string, userId: string, 
    status: FulfillmentStatus, 
    trackingData?: { code?: string; carrier?: string }
  ): Promise<void>
  
  // Marcar como pagado manualmente
  static async markAsPaidManually(quoteId: string, userId: string, amount: number): Promise<void>
}
```

---

## 4. Sistema de Tracking

### 4.1 Generación de Token

El token de tracking se genera automáticamente vía trigger o al crear la cotización. Se almacena en `quote_tracking_tokens`.

```sql
-- Estructura del token
token = encode(gen_random_bytes(16), 'hex')  -- 32 caracteres hex
```

### 4.2 Página de Tracking Pública

**Archivo:** `src/pages/TrackQuotePage.tsx`

**URL:** `/track/:token`

**Funcionalidades:**
1. Mostrar estado actual de la cotización
2. Permitir aceptar cotización (si está en negociación)
3. Generar pago SPEI (si está aceptada)
4. Ver detalles de envío/logística
5. **Flujo Viral:** Ofrecer activación de negocio propio

### 4.3 Edge Function: `get-quote-by-token`

**Archivo:** `supabase/functions/get-quote-by-token/index.ts`

```typescript
// Soporta dos tipos de tokens:
// 1. quote_tracking_tokens.token (tracking normal)
// 2. replicated_catalogs.activation_token (activación viral)

// Retorna:
{
  success: true,
  quote: {
    ...quoteData,
    quote_items: [...],
    digital_catalogs: { name, slug, user_id },
    replicated_catalogs: { id, is_active }  // Si aplica
  }
}
```

### 4.4 Service Layer

**Archivo:** `src/services/quote-tracking.service.ts`

```typescript
export class QuoteTrackingService {
  // Obtener cotización por token (vía Edge Function)
  static async getQuoteByToken(token: string): Promise<TrackingQuoteData>
  
  // Obtener URL de tracking para compartir
  static async getTrackingLink(quoteId: string): Promise<string>
}
```

---

## 5. Integración con Envío (Envia.com)

### 5.1 Edge Function: `get-shipping-rates`

**Archivo:** `supabase/functions/get-shipping-rates/index.ts`

**Endpoint API:** `https://api.envia.com/ship/rate/`

### 5.2 Flujo de Cotización de Envío

```
1. Vendedor abre modal de tarifas en QuoteDetail
2. Frontend llama a get-shipping-rates con quoteId
3. Edge Function:
   a. Obtiene cotización (destino)
   b. Obtiene business_info del vendedor (origen)
   c. Construye payload para Envia.com
   d. Llama API de Envia
   e. Aplica markup ($20 default)
   f. Retorna tarifas procesadas
4. Vendedor selecciona tarifa
5. Se actualiza shipping_cost en la cotización
```

### 5.3 Payload de Envia.com

```typescript
const enviaPayload = {
  origin: {
    name: business.business_name,
    company: business.business_name,
    email: business.email,
    phone: business.phone,
    street: originSplit.street,
    number: originSplit.number,
    district: originAddr.colony,
    city: originAddr.city,
    state_code: originAddr.state.substring(0, 2).toUpperCase(),
    country_code: "MX",
    postal_code: originAddr.zip_code,
    type: "business"
  },
  destination: {
    name: quote.customer_name,
    company: quote.customer_company,
    email: quote.customer_email,
    phone: quote.customer_phone,
    street: destSplit.street,
    number: destSplit.number,
    district: destinationAddr.colony,
    city: destinationAddr.city,
    state_code: destinationAddr.state.substring(0, 2).toUpperCase(),
    country_code: "MX",
    postal_code: destinationAddr.zip_code,
    type: "residential",
    references: destinationAddr.references
  },
  shipment: {
    carrier: "fedex",
    type: 1,
    parcels: [{
      quantity: 1,
      weight: estimatedWeight,  // Calculado por items
      weight_unit: "KG",
      length: 20,
      height: 20,
      width: 20,
      dimension_unit: "CM"
    }]
  },
  settings: { currency: "MXN" }
};
```

### 5.4 Respuesta Procesada

```typescript
interface ShippingRate {
  carrier: string;        // "fedex", "estafeta", etc.
  service: string;        // "express", "ground", etc.
  deliveryEstimate: string;
  originalPrice: number;
  finalPrice: number;     // originalPrice + markup
  currency: "MXN";
}
```

---

## 6. Integración con Pagos (Openpay)

### 6.1 Configuración

```typescript
// Helpers en create-quote-payment/index.ts
const getOpenpayUrl = () => {
  const isSandbox = Deno.env.get('OPENPAY_SANDBOX_MODE') === 'true';
  const merchantId = Deno.env.get('OPENPAY_MERCHANT_ID');
  return isSandbox 
    ? `https://sandbox-api.openpay.mx/v1/${merchantId}`
    : `https://api.openpay.mx/v1/${merchantId}`;
};

const getAuthHeader = () => {
  const privateKey = Deno.env.get('OPENPAY_PRIVATE_KEY');
  return `Basic ${btoa(privateKey + ':')}`;
};
```

### 6.2 Edge Function: `create-quote-payment`

**Archivo:** `supabase/functions/create-quote-payment/index.ts`

**Flujo:**
1. Verificar cotización existe
2. Verificar datos bancarios del vendedor (merchants)
3. **Idempotencia:** Si ya hay transacción pendiente, retornarla
4. Calcular comisiones SaaS
5. Generar cargo SPEI en Openpay
6. Guardar en payment_transactions
7. Retornar CLABE al cliente

### 6.3 Cálculo de Comisiones

```typescript
// Obtener regla de comisión activa
const { data: rule } = await supabaseAdmin
  .from('commission_rules')
  .select('*')
  .eq('is_active', true)
  .single();

const commissionPercent = rule?.percentage_fee || 1.0;  // 1%
const commissionMin = rule?.fixed_fee_min || 1500;      // $15.00 MXN

// Cálculo: Max( (Total * %), Mínimo )
const percentageAmount = Math.round(totalCents * (commissionPercent / 100));
const commissionSaas = Math.max(percentageAmount, commissionMin);
const netToMerchant = totalCents - commissionSaas;
```

### 6.4 Edge Function: `openpay-webhook`

**Archivo:** `supabase/functions/openpay-webhook/index.ts`

**Eventos procesados:**
- `charge.succeeded`: Pago exitoso vía SPEI
- `payout.succeeded`: Dispersión exitosa

**Flujo post-pago:**
1. Buscar transacción local por `provider_transaction_id`
2. Actualizar estado a 'paid'
3. **Descontar inventario** via `process_inventory_deduction()`
4. Enviar notificaciones (Email + WhatsApp)

### 6.5 Función RPC: `process_inventory_deduction`

```sql
CREATE FUNCTION process_inventory_deduction(quote_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Obtener cotización
  SELECT * INTO v_quote FROM quotes WHERE id = quote_id;
  
  FOR v_item IN SELECT * FROM quote_items WHERE quote_id = quote_id LOOP
    
    -- CASO 1: Venta de Revendedor (L2)
    IF v_quote.replicated_catalog_id IS NOT NULL THEN
      -- Descontar de reseller_variant_prices / reseller_product_prices
      IF v_item.variant_id IS NOT NULL THEN
        UPDATE reseller_variant_prices
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE replicated_catalog_id = v_quote.replicated_catalog_id
          AND variant_id = v_item.variant_id;
      ELSE
        UPDATE reseller_product_prices
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE replicated_catalog_id = v_quote.replicated_catalog_id
          AND product_id = v_item.product_id;
      END IF;
    
    -- CASO 2: Venta Directa de Fábrica (L1)
    ELSE
      -- Descontar de products / product_variants
      IF v_item.variant_id IS NOT NULL THEN
        UPDATE product_variants
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE id = v_item.variant_id;
      ELSE
        UPDATE products 
        SET stock_quantity = stock_quantity - v_item.quantity
        WHERE id = v_item.product_id;
      END IF;
    END IF;
    
  END LOOP;
  
  -- Actualizar estado logístico
  UPDATE quotes SET fulfillment_status = 'unfulfilled' WHERE id = quote_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;
```

---

## 7. Replicación de Catálogos

### 7.1 Métodos de Replicación

#### A. Replicación Viral (Post-Compra)

**Trigger:** `handle_new_quote_replication()`

Cuando un cliente hace una compra en un catálogo con `enable_distribution = true`, se crea automáticamente un catálogo replicado inactivo.

```sql
-- Verificar si permite viralidad
IF v_catalog_record.enable_distribution = true THEN
  -- Generar slug único
  v_new_slug := 'r-' || substring(md5(random()::text) from 1 for 8) 
                || '-' || v_catalog_record.slug;
  
  -- Insertar réplica inactiva
  INSERT INTO replicated_catalogs (
    original_catalog_id, distributor_id, quote_id,
    reseller_id, is_active, slug, activation_token
  ) VALUES (
    NEW.catalog_id, v_catalog_record.user_id, NEW.id,
    NULL, false, v_new_slug, encode(gen_random_bytes(16), 'hex')
  );
END IF;
```

#### B. Replicación One-Click (Sin Compra)

**RPC:** `clone_catalog_direct(p_original_catalog_id UUID)`

```sql
CREATE FUNCTION clone_catalog_direct(p_original_catalog_id UUID) 
RETURNS JSON AS $$
BEGIN
  -- Validaciones
  v_user_id := auth.uid();
  
  -- Idempotencia: verificar si ya replicó
  SELECT id, slug INTO v_existing FROM replicated_catalogs
  WHERE original_catalog_id = p_original_catalog_id AND reseller_id = v_user_id;
  
  IF FOUND THEN
    RETURN json_build_object('success', true, 'slug', v_existing_slug, 'is_new', false);
  END IF;
  
  -- Crear réplica activa inmediatamente
  INSERT INTO replicated_catalogs (
    original_catalog_id, distributor_id, reseller_id,
    is_active, slug, activated_at
  ) VALUES (
    p_original_catalog_id, v_original_catalog.user_id, v_user_id,
    true, v_new_slug, now()
  );
  
  RETURN json_build_object('success', true, 'slug', v_new_slug, 'is_new', true);
END;
$$;
```

### 7.2 Activación de Catálogo Replicado

**Edge Function:** `supabase/functions/activate-replicated-catalog/index.ts`

**Flujo:**
1. Recibe token (activation_token o quote_tracking_token)
2. Identifica catálogo replicado
3. Asigna `reseller_id` al usuario actual
4. Marca como `is_active = true`

### 7.3 Service Layer

**Archivo:** `src/services/replication.service.ts`

```typescript
export class ReplicationService {
  // Obtener info de catálogo por token
  static async getCatalogByToken(token: string): Promise<CatalogByTokenResponse>
  
  // Activar catálogo (legacy)
  static async activateCatalog(data: ActivateReplicatedCatalogDTO): Promise<boolean>
  
  // Obtener catálogos replicados del revendedor
  static async getResellerCatalogs(resellerId: string): Promise<ReplicatedCatalog[]>
  
  // Obtener red de distribución (para L1)
  static async getDistributionNetwork(distributorId: string): Promise<NetworkResellerView[]>
  
  // Estadísticas de red
  static async getNetworkStats(distributorId: string): Promise<NetworkStats>
}
```

---

## 8. Gestión de Órdenes

### 8.1 Estados de Cotización

```typescript
type QuoteStatus = 
  | 'pending'      // Solicitud nueva, esperando revisión del vendedor
  | 'negotiation'  // Vendedor definió envío, esperando aceptación del cliente
  | 'accepted'     // Cliente aceptó, esperando pago
  | 'rejected'     // Rechazada por cliente o vendedor
  | 'shipped';     // Enviado/entregado (cierre)
```

### 8.2 Estados de Fulfillment

```typescript
type FulfillmentStatus = 
  | 'unfulfilled'      // Pagado, listo para preparar
  | 'processing'       // En preparación
  | 'ready_for_pickup' // Listo para recoger
  | 'shipped'          // Enviado con paquetería
  | 'delivered';       // Entregado
```

### 8.3 Página de Detalle (Vendedor)

**Archivo:** `src/pages/quotes/QuoteDetail.tsx`

**Acciones disponibles:**

| Estado | Acciones |
|--------|----------|
| `pending` | Cotizar envío → Definir costo y fecha → Enviar a negociación |
| `negotiation` | Esperar cliente / Cerrar venta manualmente |
| `accepted` | Registrar pago manual / Esperar pago SPEI |
| `accepted` + `paid` | Marcar como enviado |
| `shipped` | Ver tracking / Orden cerrada |

### 8.4 Hooks

**Archivo:** `src/hooks/useQuoteDetail.ts`
```typescript
export function useQuoteDetail(quoteId: string | null) {
  const { quote, loading, refetch } = ...
  return { quote, loading, refetch };
}
```

**Archivo:** `src/hooks/useQuotes.ts`
```typescript
export function useQuotes(options: UseQuotesOptions = {}) {
  const { quotes, stats, loading, loadQuotes, updateStatus, refetch } = ...
  return { quotes, stats, loading, loadQuotes, updateStatus, refetch };
}
```

---

## 9. Órdenes Consolidadas

### 9.1 Concepto

Los **pedidos consolidados** permiten a un L2 (revendedor) agrupar múltiples cotizaciones de sus clientes y enviar un solo pedido al L1 (proveedor).

### 9.2 Base de Datos

```sql
-- Cabecera del pedido consolidado
CREATE TABLE consolidated_orders (
  id UUID PRIMARY KEY,
  distributor_id UUID NOT NULL,        -- L2 que consolida
  supplier_id UUID NOT NULL,           -- L1 proveedor
  original_catalog_id UUID NOT NULL,
  replicated_catalog_id UUID,
  status TEXT DEFAULT 'draft',         -- draft|sent|confirmed|shipped
  sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Items del pedido consolidado
CREATE TABLE consolidated_order_items (
  id UUID PRIMARY KEY,
  consolidated_order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  variant_id UUID,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  variant_description TEXT,
  quantity INTEGER NOT NULL,
  unit_price BIGINT NOT NULL,
  subtotal BIGINT NOT NULL,
  source_quote_ids UUID[],             -- Cotizaciones de origen
  created_at TIMESTAMPTZ
);
```

### 9.3 Service Layer

**Archivo:** `src/services/consolidated-order.service.ts`

```typescript
export class ConsolidatedOrderService {
  // Obtener o crear borrador
  static async getOrCreateDraft(
    distributorId: string,
    supplierId: string,
    originalCatalogId: string,
    replicatedCatalogId: string
  ): Promise<CreateDraftResponse>
  
  // Sincronizar con cotizaciones aceptadas
  static async syncDraftWithQuotes(
    consolidatedOrderId: string,
    distributorId: string,
    replicatedCatalogId: string
  ): Promise<void>
  
  // Listar órdenes consolidadas
  static async getConsolidatedOrders(
    distributorId: string,
    filters?: { status?: string; supplier_id?: string }
  ): Promise<ConsolidatedOrderWithDetails[]>
  
  // Enviar pedido al proveedor
  static async sendOrder(
    consolidatedOrderId: string,
    distributorId: string,
    sendData: SendConsolidatedOrderDTO
  ): Promise<{ quote_id: string }>
}
```

### 9.4 Agregación de Productos

La agregación evita duplicados sumando cantidades:

```typescript
private static aggregateProducts(quotes: any[]): ProductAggregation[] {
  const aggregationMap = new Map<string, ProductAggregation>();
  
  quotes.forEach(quote => {
    quote.quote_items.forEach(item => {
      // Key única: product_id + variant_id
      const key = `${item.product_id}-${item.variant_id || 'null'}`;
      
      if (aggregationMap.has(key)) {
        // Sumar cantidad
        const existing = aggregationMap.get(key)!;
        existing.total_quantity += item.quantity;
        existing.source_quote_ids.push(quote.id);
      } else {
        // Nuevo producto
        aggregationMap.set(key, {
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product_name,
          total_quantity: item.quantity,
          unit_price: item.unit_price,
          source_quote_ids: [quote.id]
        });
      }
    });
  });
  
  return Array.from(aggregationMap.values());
}
```

---

## 10. Archivos del Sistema

### 10.1 Frontend - Páginas

| Archivo | Descripción |
|---------|-------------|
| `src/pages/quotes/index.tsx` | Lista de cotizaciones del vendedor |
| `src/pages/quotes/QuoteDetail.tsx` | Detalle y gestión de cotización |
| `src/pages/TrackQuotePage.tsx` | Página pública de tracking |
| `src/pages/PublicCatalog.tsx` | Catálogo público con carrito |
| `src/pages/reseller/ConsolidateOrderPage.tsx` | Crear pedido consolidado |
| `src/pages/reseller/ConsolidatedOrdersListPage.tsx` | Lista de pedidos consolidados |

### 10.2 Frontend - Componentes

| Archivo | Descripción |
|---------|-------------|
| `src/components/public/QuoteForm.tsx` | Formulario de cotización |
| `src/components/public/QuoteCartModal.tsx` | Modal del carrito |
| `src/components/public/QuoteCartBadge.tsx` | Badge contador del carrito |
| `src/components/quotes/WhatsAppShareButton.tsx` | Botón compartir WhatsApp |
| `src/components/consolidated/ConsolidatedOrderCard.tsx` | Card de orden consolidada |

### 10.3 Frontend - Contexts

| Archivo | Descripción |
|---------|-------------|
| `src/contexts/QuoteCartContext.tsx` | Estado del carrito de cotización |

### 10.4 Frontend - Services

| Archivo | Descripción |
|---------|-------------|
| `src/services/quote.service.ts` | Operaciones de cotizaciones |
| `src/services/quote-tracking.service.ts` | Tracking público |
| `src/services/replication.service.ts` | Replicación de catálogos |
| `src/services/consolidated-order.service.ts` | Pedidos consolidados |
| `src/services/merchant.service.ts` | Datos bancarios |

### 10.5 Frontend - Hooks

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useQuotes.ts` | Lista y stats de cotizaciones |
| `src/hooks/useQuoteDetail.ts` | Detalle de cotización |
| `src/hooks/useConsolidatedOrders.ts` | Pedidos consolidados |

### 10.6 Backend - Edge Functions

| Función | Descripción |
|---------|-------------|
| `create-quote` | Crear cotización (L1 o L2) |
| `get-quote-by-token` | Obtener cotización por token público |
| `accept-quote-public` | Cliente acepta cotización |
| `send-quote-notification` | Notificar vendedor (Email + WhatsApp) |
| `send-quote-update` | Notificar cliente de actualización |
| `get-shipping-rates` | Cotizar envío con Envia.com |
| `create-quote-payment` | Generar pago SPEI en Openpay |
| `openpay-webhook` | Procesar pagos y descontar inventario |
| `activate-replicated-catalog` | Activar catálogo replicado |

---

## 11. Variables de Entorno

### 11.1 Supabase

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 11.2 Openpay

```bash
OPENPAY_MERCHANT_ID=xxx
OPENPAY_PRIVATE_KEY=sk_xxx
OPENPAY_SANDBOX_MODE=false
```

### 11.3 Envia.com

```bash
ENVIA_API_KEY=xxx
```

### 11.4 Notificaciones

```bash
RESEND_API_KEY=re_xxx
META_ACCESS_TOKEN=EAAx...
META_PHONE_ID=1234567890
```

---

## 12. Diagramas de Flujo

### 12.1 Ciclo de Vida de una Cotización

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA - COTIZACIÓN                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [CLIENTE]                                                           │
│      │                                                               │
│      ▼                                                               │
│  ┌─────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────┐   │
│  │ PENDING │───▶│ NEGOTIATION   │───▶│ ACCEPTED │───▶│ SHIPPED  │   │
│  └─────────┘    └───────────────┘    └──────────┘    └──────────┘   │
│      │                │                   │               │          │
│      │                │                   │               │          │
│      ▼                ▼                   ▼               ▼          │
│   Solicitud      Vendedor            Cliente          Pagado y       │
│   recibida       definió             aceptó           enviado        │
│                  envío                                               │
│      │                │                   │                          │
│      ▼                ▼                   ▼                          │
│  ┌──────────────────────────────────────────┐                        │
│  │              REJECTED                     │                        │
│  │  (Rechazado por vendedor o cliente)      │                        │
│  └──────────────────────────────────────────┘                        │
│                                                                      │
│  [VENDEDOR ACCIONES]                                                 │
│  ● pending → Cotizar envío → negotiation                             │
│  ● negotiation → Cerrar venta manual → accepted                      │
│  ● accepted → Registrar pago → accepted (paid)                       │
│  ● accepted (paid) → Marcar enviado → shipped                        │
│                                                                      │
│  [CLIENTE ACCIONES]                                                  │
│  ● negotiation → Aceptar cotización → accepted                       │
│  ● accepted → Pagar SPEI → accepted (paid)                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.2 Flujo de Pago SPEI

```
┌────────────────────────────────────────────────────────────────────┐
│                      FLUJO DE PAGO SPEI                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. Cliente acepta cotización                                      │
│      │                                                             │
│      ▼                                                             │
│  2. Cliente hace clic en "Pagar con Transferencia"                 │
│      │                                                             │
│      ▼                                                             │
│  ┌──────────────────────────────────────────────┐                  │
│  │  Edge Function: create-quote-payment         │                  │
│  │  ● Verifica merchant configurado             │                  │
│  │  ● Calcula comisiones                        │                  │
│  │  ● Genera cargo SPEI en Openpay              │                  │
│  │  ● Guarda payment_transaction                │                  │
│  │  ● Retorna CLABE                             │                  │
│  └──────────────────────────────────────────────┘                  │
│      │                                                             │
│      ▼                                                             │
│  3. Cliente copia CLABE y transfiere desde su banco               │
│      │                                                             │
│      ▼                                                             │
│  ┌──────────────────────────────────────────────┐                  │
│  │  [BANCO DEL CLIENTE] → [STP] → [OPENPAY]     │                  │
│  └──────────────────────────────────────────────┘                  │
│      │                                                             │
│      ▼                                                             │
│  ┌──────────────────────────────────────────────┐                  │
│  │  Openpay Webhook: charge.succeeded           │                  │
│  │  ● Busca transacción local                   │                  │
│  │  ● Actualiza status = 'paid'                 │                  │
│  │  ● Ejecuta process_inventory_deduction()    │                  │
│  │  ● Envía notificaciones                      │                  │
│  └──────────────────────────────────────────────┘                  │
│      │                                                             │
│      ▼                                                             │
│  4. ✅ Pago completado, inventario descontado                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 12.3 Flujo Viral de Replicación

```
┌────────────────────────────────────────────────────────────────────┐
│                   FLUJO VIRAL DE REPLICACIÓN                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. L1 crea catálogo con enable_distribution = true                │
│      │                                                             │
│      ▼                                                             │
│  2. Cliente compra en el catálogo                                  │
│      │                                                             │
│      ▼                                                             │
│  ┌──────────────────────────────────────────────┐                  │
│  │  Trigger: handle_new_quote_replication()     │                  │
│  │  ● Crea replicated_catalog (is_active=false) │                  │
│  │  ● Genera activation_token                   │                  │
│  └──────────────────────────────────────────────┘                  │
│      │                                                             │
│      ▼                                                             │
│  3. Cliente va a /track/:token y ve oferta viral                  │
│      │                                                             │
│      ▼                                                             │
│  4. Cliente hace clic en "Iniciar mi Negocio"                     │
│      │                                                             │
│      ├─── [No logueado] ──▶ Modal de Auth (Registro/Login)        │
│      │                          │                                  │
│      └─── [Logueado] ──────────┘                                   │
│                                 │                                  │
│                                 ▼                                  │
│  ┌──────────────────────────────────────────────┐                  │
│  │  Edge Function: activate-replicated-catalog  │                  │
│  │  ● Asigna reseller_id = usuario actual       │                  │
│  │  ● Marca is_active = true                    │                  │
│  │  ● activated_at = now()                      │                  │
│  └──────────────────────────────────────────────┘                  │
│      │                                                             │
│      ▼                                                             │
│  5. ✅ Cliente ahora es L2 con su propio catálogo replicado       │
│      │                                                             │
│      ▼                                                             │
│  6. L2 puede personalizar precios, márgenes y branding            │
│      │                                                             │
│      ▼                                                             │
│  7. L2 recibe cotizaciones de SUS clientes                        │
│      │                                                             │
│      ▼                                                             │
│  8. L2 consolida pedidos y los envía al L1                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Notas Adicionales

### Seguridad

- **RLS (Row Level Security):** Todas las tablas tienen políticas que filtran por `user_id` o relaciones.
- **Edge Functions:** Usan `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS cuando es necesario.
- **Tokens:** Generados con `gen_random_bytes(16)` y almacenados hasheados en algunos casos.

### Performance

- **Batch Inserts:** Los items se insertan en batch, no uno por uno.
- **Async Notifications:** Las notificaciones no bloquean el flujo principal.
- **Índices:** Las tablas tienen índices en campos frecuentemente consultados.

### Monitoreo

- Todas las Edge Functions tienen logging estructurado con `DEPLOY_VERSION`.
- Los errores se capturan y se retornan al cliente con mensajes útiles.

---

*Documentación generada para CatifyPro - Sistema de Cotizaciones B2B*
