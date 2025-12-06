# Documentación Técnica: Ciclo de Vida Completo de Cotizaciones

## Índice
1. [Resumen del Flujo](#resumen-del-flujo)
2. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
3. [Fases del Proceso](#fases-del-proceso)
4. [Tablas de Base de Datos](#tablas-de-base-de-datos)
5. [Edge Functions (Supabase)](#edge-functions-supabase)
6. [Funciones RPC de Base de Datos](#funciones-rpc-de-base-de-datos)
7. [Archivos Frontend](#archivos-frontend)
8. [Estados y Transiciones](#estados-y-transiciones)
9. [Políticas RLS (Row Level Security)](#políticas-rls)
10. [Flujos de Notificación](#flujos-de-notificación)

---

## Resumen del Flujo

El sistema de cotizaciones soporta dos modelos de negocio:
- **L1 (Fabricante/Proveedor)**: Vende directamente desde su catálogo digital
- **L2 (Revendedor)**: Vende usando un catálogo replicado del L1

### Ciclo Completo
```
Cliente → Catálogo Público → Carrito → Formulario Cotización → Quote Creada (pending)
→ Vendedor Negocia Flete → Cliente Notificado (negotiation) → Cliente Acepta (accepted)
→ Cliente Paga → Pago Registrado → Inventario Descontado → Vendedor Envía (shipped)
```

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  PublicCatalog.tsx → QuoteForm.tsx → QuoteService.createQuote()             │
│                                              ↓                               │
│  /quotes (Dashboard) ← QuoteDetail.tsx ← useQuoteDetail.ts                  │
│         ↓                    ↓                                               │
│  QuoteService.updateShippingAndNegotiate()  QuoteService.markAsPaidManually()│
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ ↑
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE EDGE FUNCTIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  create-quote          → Crea quote + items, determina owner (L1/L2)        │
│  send-quote-notification → Email/WhatsApp al vendedor                        │
│  send-quote-update     → Email al cliente con flete y fecha                  │
│  accept-quote-public   → Cliente acepta vía token público                    │
│  create-quote-payment  → Genera intent de pago SPEI/Openpay                  │
│  openpay-webhook       → Procesa confirmación de pago                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ ↑
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE DATABASE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  quotes                 → Cabecera de cotización                             │
│  quote_items            → Líneas de productos                                │
│  quote_tracking_tokens  → Tokens para acceso público                         │
│  payment_transactions   → Historial de pagos                                 │
│  products               → Inventario L1 (stock se descuenta)                 │
│  product_variants       → Variantes con stock independiente                  │
│  reseller_product_prices → Precios/stock personalizados L2                   │
│  reseller_variant_prices → Precios/stock variantes L2                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fases del Proceso

### FASE 1: Creación de Cotización (Cliente → Sistema)

#### Paso 1.1: Cliente navega catálogo público
**Archivos involucrados:**
- `src/pages/PublicCatalog.tsx` - Página principal del catálogo público
- `src/components/public/PublicProductGrid.tsx` - Grid de productos
- `src/components/public/PublicProductCard.tsx` - Tarjeta de producto
- `src/components/public/AddToQuoteModal.tsx` - Modal para agregar al carrito
- `src/contexts/QuoteCartContext.tsx` - Estado del carrito

**Datos que se obtienen:**
```typescript
// Desde digital_catalogs
{
  id, name, slug, enable_quotation, enable_variants,
  price_display, price_adjustment_menudeo, price_adjustment_mayoreo,
  enable_free_shipping, free_shipping_min_amount
}

// Productos con precios ajustados
// Si es catálogo replicado (L2), se aplican precios de reseller_product_prices
```

#### Paso 1.2: Cliente completa formulario de cotización
**Archivo:** `src/components/public/QuoteForm.tsx`

**Datos del formulario:**
```typescript
interface QuoteFormData {
  name: string;              // customer_name
  email: string;             // customer_email
  company?: string;          // customer_company
  phone?: string;            // customer_phone
  delivery_method: 'pickup' | 'shipping';
  shipping_address?: string;
  notes?: string;
}
```

**Validación (Zod):**
```typescript
const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  delivery_method: z.enum(['pickup', 'shipping']),
  shipping_address: z.string().optional()
}).refine((data) => {
  if (data.delivery_method === 'shipping') {
    return data.shipping_address && data.shipping_address.length > 10;
  }
  return true;
});
```

#### Paso 1.3: Envío a Edge Function
**Archivo Frontend:** `src/services/quote.service.ts`

```typescript
static async createQuote(quoteData: CreateQuoteDTO): Promise<Quote> {
  const { data, error } = await supabase.functions.invoke('create-quote', {
    body: quoteData
  });
  return { id: data.quote_id };
}
```

**Payload enviado:**
```typescript
{
  catalog_id: string;
  replicated_catalog_id?: string;  // Solo si es venta L2
  customer_name: string;
  customer_email: string;
  customer_company?: string;
  customer_phone?: string;
  delivery_method: 'pickup' | 'shipping';
  shipping_address?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    variant_id?: string;
    product_name: string;
    product_sku: string;
    product_image_url: string;
    quantity: number;
    unit_price: number;           // En centavos
    price_type: 'menudeo' | 'mayoreo';
    variant_description?: string;
  }>;
}
```

#### Paso 1.4: Edge Function crea la cotización
**Archivo:** `supabase/functions/create-quote/index.ts`

**Lógica de determinación de owner (CRÍTICO):**
```typescript
let saleOwnerUserId = null;

if (payload.replicated_catalog_id) {
  // CASO L2: Venta a través de Revendedor
  const { data: replica } = await supabaseAdmin
    .from('replicated_catalogs')
    .select('reseller_id')
    .eq('id', payload.replicated_catalog_id)
    .single();
  
  saleOwnerUserId = replica.reseller_id;  // L2 es el dueño
} else {
  // CASO L1: Venta directa del fabricante
  const { data: catalog } = await supabaseAdmin
    .from('digital_catalogs')
    .select('user_id')
    .eq('id', payload.catalog_id)
    .single();
  
  saleOwnerUserId = catalog.user_id;  // L1 es el dueño
}
```

**Inserción en BD:**
```sql
-- 1. Insertar cabecera (quotes)
INSERT INTO quotes (
  catalog_id,
  user_id,                    -- saleOwnerUserId (L1 o L2)
  replicated_catalog_id,      -- NULL si L1, ID si L2
  customer_name, customer_email, customer_company, customer_phone,
  delivery_method, shipping_address, notes,
  total_amount, items_count,
  status                      -- 'pending'
) VALUES (...);

-- 2. Insertar items (quote_items)
INSERT INTO quote_items (
  quote_id, product_id, variant_id,
  product_name, product_sku, product_image_url,
  quantity, unit_price, price_type, subtotal, variant_description
) VALUES (...);
```

#### Paso 1.5: Notificación al vendedor
**Archivo:** `supabase/functions/send-quote-notification/index.ts`

**Canales de notificación:**
1. **Email (Resend)** - Siempre disponible
2. **WhatsApp (Twilio)** - Solo planes Medio/Profesional/Premium

**Template de email:**
```html
- Header con gradiente morado
- Datos del cliente (nombre, email, teléfono)
- Tabla de productos con subtotales
- Total en MXN
- Botón CTA: "Gestionar Venta en Dashboard"
- Link: {SITE_URL}/quotes/{quote_id}
```

---

### FASE 2: Negociación (Vendedor → Cliente)

#### Paso 2.1: Vendedor revisa cotización
**Archivos:**
- `src/pages/quotes/index.tsx` - Lista de cotizaciones
- `src/pages/quotes/QuoteDetail.tsx` - Detalle de cotización
- `src/hooks/useQuotes.ts` - Hook para lista
- `src/hooks/useQuoteDetail.ts` - Hook para detalle

**Query de lista:**
```typescript
// QuoteService.getUserQuotes()
const selectQuery = `
  *,
  quote_items (count),
  digital_catalogs (name, enable_distribution),
  payment_transactions (status)
`;

// Combina quotes propias + quotes de catálogos replicados
let ownQuery = supabase.from('quotes')
  .select(selectQuery)
  .eq('user_id', userId)
  .is('replicated_catalog_id', null);  // Ventas L1

let replicatedQuery = supabase.from('quotes')
  .select(selectQuery)
  .eq('user_id', userId)
  .not('replicated_catalog_id', 'is', null);  // Ventas L2
```

#### Paso 2.2: Vendedor agrega flete y fecha estimada
**Archivo:** `src/pages/quotes/QuoteDetail.tsx`

**Inputs requeridos:**
- `shippingCostInput` - Costo de envío en pesos
- `deliveryDateInput` - Fecha estimada de entrega

**Handler:**
```typescript
const handleNegotiateQuote = async () => {
  const itemsSubtotal = quote.items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingInCents = Math.round(costValue * 100);
  const newTotalInCents = itemsSubtotal + shippingInCents;

  await QuoteService.updateShippingAndNegotiate(
    quote.id,
    user.id,
    shippingInCents,
    newTotalInCents,
    deliveryDateInput
  );
};
```

**Service method:**
```typescript
// QuoteService.updateShippingAndNegotiate()
const { data } = await supabase.from('quotes')
  .update({
    shipping_cost: shippingCost,
    total_amount: newTotal,
    estimated_delivery_date: deliveryDate,
    status: 'negotiation'  // CAMBIO DE ESTADO
  })
  .eq('id', quoteId)
  .eq('user_id', userId);

// Disparar notificación al cliente
await supabase.functions.invoke('send-quote-update', {
  body: { quoteId }
});
```

#### Paso 2.3: Notificación al cliente
**Archivo:** `supabase/functions/send-quote-update/index.ts`

**Email enviado:**
- Subject: "⚠️ Acción Requerida: Cotización #{order_number}"
- Contenido: Costo de envío, fecha estimada, total a pagar
- CTA: "Ver y Aceptar Cotización" → Link de tracking

**Generación de link de tracking:**
```typescript
const { data: tokenData } = await supabaseAdmin
  .from('quote_tracking_tokens')
  .select('token')
  .eq('quote_id', quoteId)
  .single();

const trackingLink = tokenData 
  ? `${SITE_URL}/track/${tokenData.token}` 
  : `${SITE_URL}/track/order/${quote.order_number}`;
```

---

### FASE 3: Aceptación (Cliente → Sistema)

#### Paso 3.1: Cliente accede al link de tracking
**Archivos:**
- `src/pages/TrackQuotePage.tsx` - Página pública de tracking
- `src/services/quote-tracking.service.ts` - Service para tracking

**Validación de token:**
```typescript
// quote_tracking_tokens tiene expires_at
// RLS permite lectura pública si token no ha expirado
```

#### Paso 3.2: Cliente acepta la cotización
**Archivo Edge Function:** `supabase/functions/accept-quote-public/index.ts`

**Flujo:**
```typescript
// 1. Validar token
const { data: trackingToken } = await supabaseAdmin
  .from('quote_tracking_tokens')
  .select('quote_id, expires_at')
  .eq('token', token)
  .maybeSingle();

// 2. Verificar estado actual (idempotencia)
if (quote.status === 'accepted' || quote.status === 'shipped') {
  return { success: true, message: 'Ya estaba aceptada' };
}

// 3. Actualizar estado
await supabaseAdmin.from('quotes')
  .update({ status: 'accepted' })
  .eq('id', quote.id);
```

---

### FASE 4: Pago

#### Opción A: Pago SPEI (Automático)
**Archivos:**
- `supabase/functions/create-quote-payment/index.ts` - Genera CLABE virtual
- `supabase/functions/openpay-webhook/index.ts` - Recibe confirmación

**Flujo:**
```
Cliente solicita pagar → create-quote-payment genera CLABE
→ Cliente transfiere → Banco notifica a Openpay
→ openpay-webhook recibe → Marca payment_transactions.status = 'paid'
→ Llama process_inventory_deduction() → Stock descontado
```

#### Opción B: Pago Manual
**Archivo:** `src/pages/quotes/QuoteDetail.tsx`

```typescript
const handleManualPayment = async () => {
  await QuoteService.markAsPaidManually(quote.id, user.id, total);
};
```

**Service method:**
```typescript
// QuoteService.markAsPaidManually()

// 1. Crear transacción manual
await supabase.from('payment_transactions').insert({
  quote_id: quoteId,
  amount_total: amount,
  commission_saas: 0,
  net_to_merchant: amount,
  payment_method: 'manual',
  status: 'paid',
  paid_at: new Date().toISOString()
});

// 2. Descontar inventario
await supabase.rpc('process_inventory_deduction', {
  quote_id: quoteId
});
```

---

### FASE 5: Despacho y Cierre

#### Paso 5.1: Vendedor marca como enviado
**Archivo:** `src/pages/quotes/QuoteDetail.tsx`

```typescript
const handleMarkAsShipped = async () => {
  await QuoteService.updateFulfillmentStatus(
    quote.id, 
    user.id, 
    'shipped',
    { code: trackingCode, carrier: carrierName }
  );
};
```

**Update en BD:**
```sql
UPDATE quotes SET
  fulfillment_status = 'shipped',
  tracking_code = 'ABC123',
  carrier_name = 'DHL'
WHERE id = quote_id;
```

---

## Tablas de Base de Datos

### `quotes` - Cabecera de Cotización
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  catalog_id UUID REFERENCES digital_catalogs(id),
  user_id UUID,  -- DUEÑO DE LA VENTA (L1 o L2)
  replicated_catalog_id UUID REFERENCES replicated_catalogs(id),
  
  -- Datos del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  
  -- Entrega
  delivery_method delivery_method_enum,  -- 'pickup' | 'shipping'
  shipping_address TEXT,
  shipping_cost INTEGER DEFAULT 0,  -- En centavos
  estimated_delivery_date DATE,
  
  -- Totales
  total_amount INTEGER DEFAULT 0,  -- En centavos
  items_count INTEGER,
  
  -- Estados
  status TEXT DEFAULT 'pending',  -- pending|negotiation|accepted|rejected|shipped
  fulfillment_status TEXT DEFAULT 'unfulfilled',  -- unfulfilled|shipped|delivered
  
  -- Tracking
  order_number TEXT UNIQUE,  -- Generado por trigger: CTF-XXXXX
  tracking_code TEXT,
  carrier_name TEXT,
  tracking_token TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_catalog_id ON quotes(catalog_id);
CREATE INDEX idx_quotes_status ON quotes(status);
```

### `quote_items` - Líneas de Producto
```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Producto
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  variant_description TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,  -- En centavos
  subtotal INTEGER NOT NULL,    -- quantity * unit_price
  price_type TEXT,              -- 'menudeo' | 'mayoreo'
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `quote_tracking_tokens` - Tokens de Acceso Público
```sql
CREATE TABLE quote_tracking_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

-- Generado automáticamente al crear quote
```

### `payment_transactions` - Historial de Pagos
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) NOT NULL,
  merchant_id UUID REFERENCES merchants(id),
  
  -- Montos (centavos)
  amount_total INTEGER NOT NULL,
  commission_saas INTEGER NOT NULL,
  cost_gateway INTEGER DEFAULT 0,
  net_to_merchant INTEGER NOT NULL,
  
  -- Método
  payment_method TEXT DEFAULT 'SPEI',  -- SPEI|manual|card
  clabe_virtual_in TEXT,
  provider_transaction_id TEXT,
  
  -- Estado
  status TEXT DEFAULT 'pending',  -- pending|paid|failed
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Edge Functions (Supabase)

| Función | Descripción | Trigger |
|---------|-------------|---------|
| `create-quote` | Crea quote + items, determina owner L1/L2 | `QuoteService.createQuote()` |
| `send-quote-notification` | Email/WhatsApp al vendedor | Automático post-create |
| `send-quote-update` | Email al cliente con flete | `updateShippingAndNegotiate()` |
| `accept-quote-public` | Cliente acepta vía token | TrackQuotePage |
| `create-quote-payment` | Genera CLABE virtual SPEI | Botón "Pagar" |
| `openpay-webhook` | Webhook de confirmación pago | Openpay POST |
| `get-quote-by-token` | Obtiene quote por token | TrackQuotePage |

---

## Funciones RPC de Base de Datos

### `process_inventory_deduction(quote_id UUID)`
```sql
-- Descuenta stock según origen de venta
-- Si replicated_catalog_id IS NOT NULL → Descuenta de reseller_*_prices
-- Si NULL → Descuenta de products/product_variants

FOR v_item IN SELECT * FROM quote_items WHERE quote_id = quote_id LOOP
  IF v_quote.replicated_catalog_id IS NOT NULL THEN
    -- L2: Descontar de reseller tables
    UPDATE reseller_variant_prices SET stock = stock - v_item.quantity...
  ELSE
    -- L1: Descontar de products/variants
    UPDATE product_variants SET stock_quantity = stock_quantity - v_item.quantity...
  END IF;
END LOOP;
```

### `generate_order_number()`
```sql
-- Genera código legible: CTF-XXXXX
RETURN 'CTF-' || random_alphanumeric(5);
```

### `assign_order_number()` (Trigger)
```sql
-- Trigger BEFORE INSERT en quotes
-- Asigna order_number automáticamente
```

---

## Archivos Frontend

### Services
| Archivo | Responsabilidad |
|---------|-----------------|
| `src/services/quote.service.ts` | CRUD de cotizaciones |
| `src/services/quote-tracking.service.ts` | Tracking público |

### Hooks
| Archivo | Responsabilidad |
|---------|-----------------|
| `src/hooks/useQuotes.ts` | Lista de cotizaciones |
| `src/hooks/useQuoteDetail.ts` | Detalle de una cotización |

### Páginas
| Archivo | Ruta | Descripción |
|---------|------|-------------|
| `src/pages/quotes/index.tsx` | `/quotes` | Dashboard de cotizaciones |
| `src/pages/quotes/QuoteDetail.tsx` | `/quotes/:id` | Detalle y gestión |
| `src/pages/TrackQuotePage.tsx` | `/track/:token` | Tracking público |

### Componentes
| Archivo | Descripción |
|---------|-------------|
| `src/components/public/QuoteForm.tsx` | Formulario de solicitud |
| `src/components/public/QuoteCartModal.tsx` | Carrito de productos |
| `src/components/quotes/WhatsAppShareButton.tsx` | Compartir por WA |

---

## Estados y Transiciones

```
                    ┌──────────┐
                    │ PENDING  │ ← Cotización creada
                    └────┬─────┘
                         │
         Vendedor agrega flete
                         ▼
                 ┌──────────────┐
                 │ NEGOTIATION  │ ← Esperando cliente
                 └───────┬──────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Cliente acepta   Cliente rechaza   Timeout
        │                │                │
        ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ ACCEPTED │    │ REJECTED │    │ REJECTED │
   └────┬─────┘    └──────────┘    └──────────┘
        │
   Pago confirmado
        │
        ▼
   ┌──────────────┐
   │ PAID (tx)    │ ← payment_transactions.status = 'paid'
   └──────┬───────┘
          │
   Vendedor despacha
          │
          ▼
   ┌──────────┐
   │ SHIPPED  │ ← fulfillment_status = 'shipped'
   └──────────┘
```

---

## Políticas RLS

### `quotes`
```sql
-- Lectura: Dueño o token válido
Policy: public_read_quotes_with_valid_token
USING: user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM quote_tracking_tokens
  WHERE quote_id = quotes.id AND expires_at > now()
)

-- Inserción: Pública (clientes sin auth)
Policy: allow_public_quote_creation
WITH CHECK: true

-- Actualización: Solo dueño
Policy: users_update_own_quotes
USING: auth.uid() = user_id
```

### `quote_items`
```sql
-- Lectura: Dueño de la quote o catálogo replicado activo
Policy: allow_read_quote_items_for_active_catalogs
USING: EXISTS (SELECT 1 FROM replicated_catalogs rc
  WHERE rc.quote_id = quote_items.quote_id AND rc.is_active = true)
  OR EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id AND q.user_id = auth.uid())

-- Inserción: Pública
Policy: allow_public_quote_items_creation
WITH CHECK: true
```

### `payment_transactions`
```sql
-- Inserción/Actualización: Dueño de la quote
Policy: Users can insert/update transactions for own quotes
USING/WITH CHECK: EXISTS (
  SELECT 1 FROM quotes WHERE id = quote_id AND user_id = auth.uid()
)
```

---

## Flujos de Notificación

### 1. Nueva Cotización (→ Vendedor)
```
Trigger: create-quote finaliza exitosamente
Canal: Email (siempre) + WhatsApp (planes premium)
Template: Datos cliente + productos + total + CTA dashboard
```

### 2. Cotización Actualizada (→ Cliente)
```
Trigger: updateShippingAndNegotiate() exitoso
Canal: Email
Template: Costo envío + fecha entrega + total + CTA aceptar
```

### 3. Cotización Aceptada (→ Vendedor)
```
Trigger: accept-quote-public exitoso
Canal: Silenciado (prioriza modal viral en frontend)
```

### 4. Pago Confirmado (→ Ambos)
```
Trigger: openpay-webhook con status 'completed'
Canal: Email a cliente + Notificación push a vendedor
```

---

## Variables de Entorno Requeridas

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Notificaciones
RESEND_API_KEY=re_xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15551234567

# URLs
SITE_URL=https://catifypro.com

# Pagos
OPENPAY_ID=xxx
OPENPAY_PRIVATE_KEY=sk_xxx
```

---

## Consideraciones de Performance

1. **Batch inserts**: Los items se insertan en una sola operación
2. **Rollback manual**: Si falla insert de items, se elimina la quote
3. **Notificaciones async**: No bloquean el response al cliente
4. **Índices optimizados**: user_id, catalog_id, status
5. **Paginación**: getUserQuotes soporta filtros para grandes volúmenes

---

## Troubleshooting Común

### Quote no aparece en dashboard
- Verificar `user_id` de la quote coincide con usuario logueado
- Si es L2, verificar que `replicated_catalog_id` tiene `reseller_id` correcto

### Notificaciones no llegan
- Verificar RESEND_API_KEY en secrets
- Revisar logs de Edge Function en Supabase Dashboard

### Pago no descuenta stock
- Verificar que `process_inventory_deduction` se ejecutó
- Revisar si es L1/L2 y tablas correspondientes

### Cliente no puede aceptar
- Token expirado (quote_tracking_tokens.expires_at)
- Quote ya estaba en status 'accepted' o 'shipped'
