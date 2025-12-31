# Meta Pixel & Conversions API (CAPI) - Documentación Técnica Completa

> **Versión**: 2.0  
> **Última actualización**: 2025-01-01  
> **Estado**: Producción

---

## 📋 Resumen Ejecutivo

CatifyPro implementa un **sistema dual de tracking de Meta (Facebook)** que sirve a dos propósitos distintos:

| Propósito | Beneficiario | Estado |
|-----------|--------------|--------|
| **Marketing SaaS** | CatifyPro (Nosotros) | ⚠️ Parcialmente configurado |
| **Marketing de Catálogos** | Usuarios (L1/L2) | ✅ Funcional |

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE TRACKING META                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌───────────────────────┐         ┌───────────────────────────────┐   │
│   │  🏢 TRACKING SAAS     │         │  👤 TRACKING USUARIOS        │   │
│   │  (Para nosotros)      │         │  (Para clientes L1/L2)       │   │
│   └───────────┬───────────┘         └───────────────┬───────────────┘   │
│               │                                     │                    │
│   ┌───────────▼───────────┐         ┌───────────────▼───────────────┐   │
│   │ SaaSMarketingProvider │         │      useMetaPixel.tsx        │   │
│   │ + fb-conversion EF    │         │ + useMetaTracking.ts (legacy)│   │
│   └───────────┬───────────┘         │ + tracking-events EF         │   │
│               │                     └───────────────┬───────────────┘   │
│               │                                     │                    │
│   ┌───────────▼───────────┐         ┌───────────────▼───────────────┐   │
│   │ Eventos: Registros,   │         │ Eventos: PageView, AddToCart,│   │
│   │ Suscripciones, Compras│         │ Purchase, Search, Lead, etc. │   │
│   └───────────────────────┘         └───────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Mapa de Archivos Completo

### Para CatifyPro (SaaS Marketing)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/providers/SaaSMarketingProvider.tsx` | React Provider | Contexto global para tracking SaaS |
| `supabase/functions/fb-conversion/index.ts` | Edge Function | CAPI server-side para eventos SaaS |
| `.env` | Config | Variable `VITE_SAAS_PIXEL_ID` |

### Para Usuarios (Tracking de Catálogos)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/hooks/useMetaPixel.tsx` | React Hook | Hook principal (híbrido browser+server) |
| `src/hooks/useMetaTracking.ts` | React Hook | Hook legacy (se sigue usando) |
| `src/hooks/useCatalogTracking.ts` | React Hook | Hook alternativo con múltiples providers |
| `supabase/functions/tracking-events/index.ts` | Edge Function | CAPI dinámico (recibe pixel_id del frontend) |
| `src/components/catalog/marketing/MarketingConfiguration.tsx` | React Component | UI para configurar Pixel/CAPI |
| `src/pages/DigitalCatalogForm.tsx` | React Page | Formulario donde se guarda tracking_config |
| `src/pages/PublicCatalog.tsx` | React Page | Donde se ejecuta el tracking en catálogos públicos |

### Auxiliares y Utilidades

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/utils/analytics.ts` | Utility | Funciones de hash IP y geolocalización |
| `supabase/functions/track-catalog-view/index.ts` | Edge Function | Tracking de vistas (sin FB, solo DB) |
| `supabase/config.toml` | Config | Configuración JWT de Edge Functions |

---

## 🔵 PARTE 1: TRACKING PARA CATIFYPRO (NOSOTROS)

### 1.1 Propósito
Rastrear el comportamiento de **visitantes y usuarios de CatifyPro** para optimizar campañas de marketing y medir conversiones de la plataforma.

### 1.2 Componentes

#### 1.2.1 SaaSMarketingProvider.tsx

```typescript
// Ubicación: src/providers/SaaSMarketingProvider.tsx

// Usa variable de entorno para el Pixel ID
const pixelId = import.meta.env.VITE_SAAS_PIXEL_ID;

// Eventos estándar soportados
const standardEvents = [
  'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
  'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
  'Lead', 'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication',
  'Subscribe', 'ViewContent'
];
```

**Funcionalidades:**
- Inicializa Facebook Pixel al cargar la app
- Trackea `PageView` automáticamente en cada cambio de ruta
- Expone `trackSaaSEvent()` vía Context
- Envía eventos tanto al Browser como al CAPI (via `fb-conversion`)

#### 1.2.2 fb-conversion (Edge Function)

```typescript
// Ubicación: supabase/functions/fb-conversion/index.ts

// SECRETS REQUERIDOS (en Supabase Dashboard > Edge Functions > Secrets):
const PIXEL_ID = Deno.env.get('FB_PIXEL_ID')      // ⚠️ NO CONFIGURADO
const ACCESS_TOKEN = Deno.env.get('FB_ACCESS_TOKEN')  // ⚠️ NO CONFIGURADO
```

**Características:**
- Versión: `FB_CAPI_V3_IP_FIX`
- Hashea automáticamente email y teléfono
- Limpia IP (fix para Facebook)
- Usa Graph API v19.0
- **JWT**: `verify_jwt = false`

### 1.3 Configuración Necesaria

#### Variables de Entorno (.env)
```bash
# Ya existe pero vacío
VITE_SAAS_PIXEL_ID="TU_PIXEL_ID_AQUI"
```

#### Secrets de Supabase
```bash
# Agregar en Dashboard > Edge Functions > Secrets
FB_PIXEL_ID=123456789012345
FB_ACCESS_TOKEN=EAAxxxxxxxxxx...
```

### 1.4 Eventos Trackeados

| Evento | Página/Acción | Archivo |
|--------|---------------|---------|
| `PageView` | Cada cambio de ruta | SaaSMarketingProvider.tsx |
| `Purchase` | Pago exitoso | PaymentSuccess.tsx |
| `CompleteRegistration` | (Por implementar) | - |
| `StartTrial` | (Por implementar) | - |

### 1.5 Uso en Código

```tsx
import { useSaaSMarketing } from '@/providers/SaaSMarketingProvider';

function MyComponent() {
  const { trackSaaSEvent } = useSaaSMarketing();
  
  const handlePurchase = () => {
    trackSaaSEvent('Purchase', {
      value: 299.00,
      currency: 'MXN',
      content_type: 'subscription',
      content_name: 'Plan Pro'
    });
  };
}
```

---

## 🟢 PARTE 2: TRACKING PARA USUARIOS (CATÁLOGOS L1/L2)

### 2.1 Propósito
Permitir que los **dueños de catálogos** (L1) y **revendedores** (L2) rastreen conversiones en sus propios catálogos usando su propio Pixel de Facebook.

### 2.2 Flujo de Datos

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐
│ Usuario config  │───>│ digital_catalogs │───>│ PublicCatalog.tsx       │
│ su Pixel ID     │    │ tracking_config  │    │ (Lee config y trackea)  │
└─────────────────┘    └──────────────────┘    └───────────┬─────────────┘
                                                           │
                          ┌────────────────────────────────┴───────┐
                          │                                        │
                 ┌────────▼─────────┐                    ┌─────────▼──────────┐
                 │ Browser Pixel    │                    │ tracking-events EF │
                 │ (window.fbq)     │                    │ (CAPI server-side) │
                 └──────────────────┘                    └────────────────────┘
```

### 2.3 Componentes

#### 2.3.1 useMetaPixel.tsx (Principal)

```typescript
// Ubicación: src/hooks/useMetaPixel.tsx

interface MetaPixelConfig {
  pixelId?: string;
  accessToken?: string;
  meta_capi?: {
    enabled: boolean;
    pixel_id?: string;
    access_token?: string;
    test_code?: string;  // Para Test Events de FB
  };
}
```

**Características:**
- Estrategia híbrida: Browser + Server simultáneo
- Deduplicación con `event_id` único (uuid)
- Soporta Test Events Code para debugging
- Inicializa automáticamente con PageView

#### 2.3.2 useMetaTracking.ts (Legacy - Aún en uso)

```typescript
// Ubicación: src/hooks/useMetaTracking.ts

interface MetaConfig {
  pixelId?: string;
  accessToken?: string;
  enabled: boolean;
  isEnterprise: boolean;  // Solo Enterprise usa CAPI
}
```

**Nota:** Este hook se sigue usando en `PublicCatalog.tsx`. Considerar migrar a `useMetaPixel.tsx`.

#### 2.3.3 tracking-events (Edge Function)

```typescript
// Ubicación: supabase/functions/tracking-events/index.ts

// NO USA SECRETS GLOBALES - Recibe todo del frontend:
const { 
  pixel_id,       // Dinámico por catálogo
  access_token,   // Dinámico por catálogo
  event_name, 
  event_id,       // Para deduplicación
  test_event_code // Opcional para testing
} = body;
```

**Características:**
- Versión: `INIT_CAPI_V1`
- Hashea: email, phone, firstName, lastName
- Normaliza datos antes de hashear
- Graph API v16.0
- **JWT**: `verify_jwt = false`
- Fail-safe: Devuelve 200 aunque FB falle (para no romper UX)

### 2.4 Estructura de Datos en DB

```sql
-- Tabla: digital_catalogs
-- Columna: tracking_config (JSONB)

{
  "pixelId": "123456789012345",        -- Legacy
  "accessToken": "EAAxxxxx...",        -- Legacy
  "meta_capi": {
    "enabled": true,
    "pixel_id": "123456789012345",     -- Nuevo formato
    "access_token": "EAAxxxxx...",     -- Nuevo formato
    "test_code": "TEST12345"           -- Opcional
  }
}
```

### 2.5 UI de Configuración

```tsx
// Ubicación: src/components/catalog/marketing/MarketingConfiguration.tsx

// Permite configurar:
// 1. Toggle para activar/desactivar tracking
// 2. Input para Pixel ID
// 3. Input para Access Token (CAPI)
// 4. URL del Feed XML dinámico
```

### 2.6 Eventos Trackeados en Catálogos Públicos

| Evento | Trigger | Datos |
|--------|---------|-------|
| `PageView` | Al cargar catálogo | - |
| `ViewContent` | Al cargar catálogo | `content_name`, `content_ids`, `content_type` |
| `Search` | Búsqueda en catálogo | `search_string` |
| `UnlockContent` | Desbloquear catálogo privado | - |
| `AddToCart` | Agregar al carrito de cotización | (Por implementar) |
| `Lead` | Enviar cotización | (Por implementar) |

### 2.7 Uso del Tracking en PublicCatalog

```tsx
// Ubicación: src/pages/PublicCatalog.tsx

const trackingConfig = (catalog?.tracking_config as any) || {};
const { trackEvent } = useMetaTracking({
  enabled: true,
  pixelId: trackingConfig.pixelId,
  accessToken: trackingConfig.accessToken,
  isEnterprise: !!trackingConfig.accessToken,
});

// Tracking automático al cargar
useEffect(() => {
  if (catalog) {
    trackEvent("PageView");
    trackEvent("ViewContent", {
      content_name: catalog.name,
      content_ids: [catalog.id],
      content_type: "product_group",
    });
  }
}, [catalog?.id]);

// Tracking manual en acciones
const handleUnlock = () => {
  if (accessPassword === catalog.access_password) {
    setIsAuthenticated(true);
    trackEvent("UnlockContent");  // <-- Evento custom
  }
};
```

---

## 🔧 PARTE 3: DIFERENCIAS CLAVE ENTRE EDGE FUNCTIONS

| Característica | fb-conversion | tracking-events |
|----------------|---------------|-----------------|
| **Propósito** | SaaS (nosotros) | Usuarios (catálogos) |
| **Pixel ID** | De Secrets globales | Del request body |
| **Access Token** | De Secrets globales | Del request body |
| **Graph API** | v19.0 | v16.0 |
| **Hashing** | email, phone | email, phone, firstName, lastName |
| **Test Events** | ❌ No soporta | ✅ Soporta `test_event_code` |
| **Fail behavior** | Devuelve error 400/500 | Devuelve 200 siempre |

---

## 📊 PARTE 4: DEDUPLICACIÓN DE EVENTOS

### Problema
Facebook puede recibir el mismo evento dos veces (browser + server). Esto infla métricas.

### Solución Implementada
Ambos lados envían el mismo `event_id`:

```typescript
// En useMetaPixel.tsx
const eventId = uuidv4();

// Browser
win.fbq("track", eventName, data, { eventID: eventId });

// Server (mismo ID)
sendEventToCAPI({
  event_name: eventName,
  event_id: eventId,  // <-- Mismo ID!
  user_data: userData,
  custom_data: data,
});
```

Facebook deduplica automáticamente eventos con el mismo `event_id` en una ventana de 48 horas.

---

## 🚨 PARTE 5: ESTADO ACTUAL Y ACCIONES PENDIENTES

### Para SaaS (Nosotros)

| Item | Estado | Acción |
|------|--------|--------|
| `VITE_SAAS_PIXEL_ID` | ⚠️ Vacío | Agregar Pixel ID en `.env` |
| `FB_PIXEL_ID` Secret | ⚠️ No existe | Agregar en Supabase Secrets |
| `FB_ACCESS_TOKEN` Secret | ⚠️ No existe | Agregar en Supabase Secrets |
| Eventos de registro | ❌ No implementado | Agregar `trackSaaSEvent('CompleteRegistration')` |
| Eventos de trial | ❌ No implementado | Agregar `trackSaaSEvent('StartTrial')` |

### Para Usuarios (Catálogos)

| Item | Estado | Acción |
|------|--------|--------|
| Configuración UI | ✅ Funcional | - |
| Browser Pixel | ✅ Funcional | - |
| CAPI Server-side | ✅ Funcional | - |
| Evento `AddToCart` | ⚠️ No implementado | Agregar en QuoteCartContext |
| Evento `Lead` (Quote) | ⚠️ No implementado | Agregar en QuoteForm submit |
| Evento `Purchase` | ⚠️ No implementado | Agregar cuando se acepte cotización |
| Migrar a useMetaPixel | ⚠️ Pendiente | PublicCatalog usa useMetaTracking (legacy) |

---

## 🔒 PARTE 6: SEGURIDAD Y PRIVACIDAD

### Hashing de Datos Sensibles
Tanto `fb-conversion` como `tracking-events` hashean datos con SHA-256:

```typescript
async function hashData(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Datos Hasheados
- ✅ Email (`em`)
- ✅ Teléfono (`ph`)
- ✅ Nombre (`fn`) - Solo en tracking-events
- ✅ Apellido (`ln`) - Solo en tracking-events
- ✅ IP Address (hasheada en track-catalog-view, no en CAPI)

### Datos NO Hasheados (Enviados en texto plano a FB)
- IP Address (requerido por FB CAPI)
- User Agent
- URL de origen

---

## 📋 PARTE 7: CHECKLIST DE IMPLEMENTACIÓN

### Para Activar Tracking SaaS Completo

```bash
# 1. Configurar .env
VITE_SAAS_PIXEL_ID="123456789012345"

# 2. Agregar Secrets en Supabase Dashboard
FB_PIXEL_ID=123456789012345
FB_ACCESS_TOKEN=EAAxxxxxxxxxxxxx

# 3. Re-deployar Edge Functions
# (Automático al hacer push)

# 4. Verificar en Facebook Events Manager
# - Usar Test Events para debugging
# - Verificar deduplicación
```

### Para Mejorar Tracking de Catálogos

1. **Migrar de `useMetaTracking` a `useMetaPixel`** en PublicCatalog.tsx
2. **Agregar eventos faltantes:**
   - `AddToCart` al agregar productos al carrito de cotización
   - `Lead` al enviar cotización
   - `Purchase` cuando el cliente acepta cotización
3. **Implementar tracking de L2:**
   - Actualmente L2 hereda config de L1
   - Considerar permitir que L2 tenga su propio Pixel

---

## 📚 Referencias

- [Meta Conversions API Documentation](https://developers.facebook.com/docs/marketing-api/conversions-api/)
- [Event Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Standard Events Reference](https://developers.facebook.com/docs/meta-pixel/reference#standard-events)
- [Graph API Versioning](https://developers.facebook.com/docs/graph-api/changelog)

---

## 📞 Soporte

Para problemas con el tracking:
1. Verificar Console Logs (buscar prefijos `📊`, `✅`, `❌`)
2. Revisar Edge Function Logs en Supabase Dashboard
3. Usar Facebook Events Manager > Test Events
4. Verificar que `event_id` coincida entre browser y server
