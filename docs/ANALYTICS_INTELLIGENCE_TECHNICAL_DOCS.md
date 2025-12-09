# Documentación Técnica: Sistema de Analítica e Inteligencia

## Índice
1. [Search Logs (Registro de Búsquedas)](#1-search-logs-registro-de-búsquedas)
2. [Radar de Mercado (Solicitudes de Productos)](#2-radar-de-mercado-solicitudes-de-productos)
3. [Sistema de Recomendaciones (Recommendation Banner)](#3-sistema-de-recomendaciones-recommendation-banner)

---

## 1. Search Logs (Registro de Búsquedas)

### 1.1 Descripción General
El sistema de Search Logs captura cada búsqueda que realizan los usuarios finales en los catálogos públicos. Esta información permite al dueño del catálogo (L1) y revendedores (L2) entender qué productos buscan sus clientes, identificar demanda no satisfecha y optimizar su inventario.

### 1.2 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE SEARCH LOGS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Usuario Final                PublicCatalogContent              Supabase    │
│  (Cliente)                    (Frontend)                        (Backend)   │
│                                                                              │
│     ┌───────┐                    ┌───────────┐                 ┌──────────┐ │
│     │ Busca │ ──────────────────>│ useEffect │ ───INSERT────> │search_logs│ │
│     │"zapato│                    │ debounced │                 │  table   │ │
│     │ rojo" │                    │ (500ms)   │                 └──────────┘ │
│     └───────┘                    └───────────┘                      │       │
│                                                                     │       │
│                                                                     ▼       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      COMPONENTES QUE CONSUMEN                          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  SearchStatsWidget     │ DemandForecastWidget │ ResellerInsights       ││
│  │  (Términos agregados)  │ (Predicción IA)      │ (Vista L2)             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Tabla de Base de Datos: `search_logs`

#### Esquema
| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Identificador único del registro |
| `catalog_id` | uuid | NO | - | ID del catálogo donde se realizó la búsqueda |
| `search_term` | text | NO | - | Término buscado por el usuario |
| `results_count` | integer | YES | `0` | Cantidad de productos encontrados |
| `user_id` | uuid | YES | - | ID del dueño del catálogo (para queries) |
| `created_at` | timestamptz | YES | `now()` | Fecha y hora de la búsqueda |

#### Políticas RLS
| Política | Comando | Expresión |
|----------|---------|-----------|
| `Anyone can insert search logs` | INSERT | `true` (público) |
| `Public Insert Logs` | INSERT | `true` (público) |
| `Catalog owners can view their search logs` | SELECT | Usuario es dueño del catálogo |
| `Owner View Logs` | SELECT | `auth.uid() = user_id` |

### 1.4 Frontend: Captura de Búsquedas

#### Archivo: `src/components/catalog/public/PublicCatalogContent.tsx`
**Líneas: 280-293**

```typescript
// Efecto que se dispara cuando cambia el término de búsqueda (debounced)
useEffect(() => {
  if (debouncedSearch && debouncedSearch.length > 2) {
    const logSearch = async () => {
      await supabase.from("search_logs").insert({
        catalog_id: catalog.id,           // ID del catálogo actual
        search_term: debouncedSearch,     // Término buscado
        results_count: filteredProducts.length, // Resultados encontrados
        user_id: catalog.user_id,         // Dueño del catálogo
      });
    };
    logSearch();
    onTrackEvent("Search", { search_string: debouncedSearch }); // FB Pixel
  }
}, [debouncedSearch, filteredProducts.length, catalog.id, catalog.user_id, onTrackEvent]);
```

#### Condiciones de Disparo:
1. El término debe tener más de 2 caracteres
2. Se usa `useDebounce` para evitar spam (500ms de delay)
3. Se registra incluso si `results_count = 0` (demanda no satisfecha)

### 1.5 Componentes de Visualización

#### 1.5.1 SearchStatsWidget
**Archivo:** `src/components/dashboard/SearchStatsWidget.tsx`
**Propósito:** Mostrar términos más buscados agrupados por similitud

```typescript
// Consulta principal
const { data } = await supabase
  .from("search_logs")
  .select("search_term, results_count")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(500);
```

**Características:**
- Agrupa términos similares usando distancia de Levenshtein
- Muestra contador de búsquedas sin resultados (`results_count = 0`)
- Requiere plan con `radar_inteligente` o `recomendaciones`

#### 1.5.2 DemandForecastWidget
**Archivo:** `src/components/dashboard/analytics/DemandForecastWidget.tsx`
**Propósito:** Predicción de demanda usando regresión polinomial

```typescript
// Obtiene logs de los últimos 45 días
const { data: logs } = await supabase
  .from("search_logs")
  .select("search_term, created_at")
  .eq("user_id", userId)
  .gte("created_at", fortyFiveDaysAgo);
```

**Algoritmo de IA:**
1. Agrupa búsquedas por día para crear serie temporal
2. Aplica regresión (polinomial si >7 puntos, lineal si menos)
3. Calcula R² como nivel de confianza
4. Genera predicción para próximos días
5. Determina tendencia (up/down/flat)

#### 1.5.3 ResellerInsights
**Archivo:** `src/components/dashboard/ResellerInsights.tsx`
**Propósito:** Vista de búsquedas para revendedores (L2)

```typescript
// Primero intenta RPC optimizada
const { data } = await supabase.rpc("fn_get_reseller_search_logs", {
  p_catalog_id: catalogId,
});

// Fallback a consulta directa
const { data } = await supabase
  .from("search_logs")
  .select("search_term, results_count, created_at")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })
  .limit(20);
```

### 1.6 Funciones RPC

#### `fn_get_reseller_search_logs`
**Propósito:** Obtener logs de búsqueda agregados por catálogo

```sql
CREATE OR REPLACE FUNCTION fn_get_reseller_search_logs(p_catalog_id uuid)
RETURNS TABLE(term text, count integer, last_search timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT 
    search_term as term,
    COUNT(*) as count,
    MAX(created_at) as last_search
  FROM public.search_logs
  WHERE catalog_id = p_catalog_id
  GROUP BY search_term
  ORDER BY last_search DESC
  LIMIT 20;
$$;
```

### 1.7 Diagrama de Flujo Completo

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DE UN SEARCH LOG                      │
└────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
   ┌─────────┐              ┌──────────────┐            ┌─────────────┐
   │ CAPTURA │              │ ALMACENAMIENTO│            │ CONSUMO     │
   └─────────┘              └──────────────┘            └─────────────┘
        │                           │                           │
        │                           │                           │
   ┌────┴────┐              ┌───────┴───────┐          ┌────────┴────────┐
   │ Usuario │              │  search_logs  │          │ SearchStatsWidget│
   │ busca   │──INSERT──────│    table      │◄─SELECT──│ DemandForecast  │
   │ producto│              │               │          │ ResellerInsights│
   └─────────┘              └───────────────┘          └─────────────────┘
        │                           │                           │
        │                           │                           │
        ▼                           ▼                           ▼
   ┌─────────┐              ┌───────────────┐          ┌─────────────────┐
   │ Facebook│              │ Retención:    │          │ Insights:       │
   │ Pixel   │              │ Sin límite    │          │ - Top términos  │
   │ "Search"│              │ definido      │          │ - Zero results  │
   └─────────┘              └───────────────┘          │ - Predicciones  │
                                                       └─────────────────┘
```

---

## 2. Radar de Mercado (Solicitudes de Productos)

### 2.1 Descripción General
El Radar de Mercado permite a los usuarios finales solicitar productos que no encuentran en el catálogo. Estas solicitudes llegan tanto al fabricante (L1) como al revendedor (L2, si aplica), creando una cadena de demanda que puede escalar.

### 2.2 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUJO DEL RADAR DE MERCADO                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Cliente Final         PublicCatalogContent         solicitudes_mercado     │
│                                                                              │
│  ┌─────────────┐       ┌─────────────────┐         ┌──────────────────────┐ │
│  │ No encuentra│       │ Muestra botón   │         │     NUEVO REGISTRO   │ │
│  │ producto    │──────>│ "Solicitar      │─INSERT─>│ - fabricante_id (L1) │ │
│  │             │       │  Especial"      │         │ - revendedor_id (L2) │ │
│  └─────────────┘       └─────────────────┘         │ - datos producto     │ │
│                                                    │ - datos cliente      │ │
│                                                    └──────────────────────┘ │
│                                                              │              │
│                        ┌─────────────────────────────────────┴───────┐      │
│                        │                                             │      │
│                        ▼                                             ▼      │
│              ┌──────────────────┐                    ┌───────────────────┐  │
│              │ RadarDeMercado   │                    │ FabricanteRadar   │  │
│              │ (WordCloud L1)   │                    │ Dashboard         │  │
│              └──────────────────┘                    └───────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Tabla de Base de Datos: `solicitudes_mercado`

#### Esquema Completo
| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único de la solicitud |
| `creado_el` | timestamptz | NO | `now()` | Fecha de creación |
| `fabricante_id` | uuid | NO | - | ID del dueño del catálogo original (L1) |
| `revendedor_id` | uuid | YES | - | ID del revendedor si es catálogo replicado (L2) |
| `catalogo_id` | uuid | YES | - | ID del catálogo donde se originó |
| `cliente_final_nombre` | text | YES | - | Nombre del cliente que solicita |
| `cliente_final_email` | text | YES | - | Email/WhatsApp del cliente |
| `producto_nombre` | text | NO | - | Nombre del producto buscado |
| `producto_marca` | text | YES | - | Marca solicitada (opcional) |
| `producto_descripcion` | text | YES | - | Descripción adicional |
| `cantidad` | integer | NO | `1` | Cantidad requerida |
| `estatus_revendedor` | USER-DEFINED | NO | `'nuevo'` | Estado para el L2 |
| `estatus_fabricante` | USER-DEFINED | NO | `'nuevo'` | Estado para el L1 |

#### ENUMs de Estatus

**`status_revendedor`:**
- `nuevo` - Acaba de llegar
- `contactado` - El L2 contactó al cliente
- `consultado_proveedor` - El L2 escaló al L1
- `atendido` - Se resolvió

**`status_fabricante`:**
- `nuevo` - Acaba de llegar
- `en_analisis` - El L1 está evaluando
- `agregado_al_catalogo` - El L1 agregó el producto
- `ignorado` - El L1 descartó la solicitud

#### Políticas RLS
| Política | Comando | Expresión |
|----------|---------|-----------|
| `Public Insert` | INSERT | `true` (cualquiera puede solicitar) |
| `L1 Global View` | SELECT | `auth.uid() = fabricante_id` |
| `L2 Local View` | SELECT | `auth.uid() = revendedor_id` |
| `Fabricantes can update` | UPDATE | `fabricante_id = auth.uid()` |
| `Revendedores can update` | UPDATE | `revendedor_id = auth.uid()` |

### 2.4 Frontend: Captura de Solicitudes

#### Componente Trigger: Cuando no hay resultados
**Archivo:** `src/components/catalog/public/PublicCatalogContent.tsx`
**Líneas: 595-627**

```tsx
{filteredProducts.length === 0 ? (
  <motion.div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-6">
      <Radar className="h-10 w-10 text-indigo-500" />
    </div>
    <h3 className="text-xl font-bold">¿No encuentras lo que buscas?</h3>
    <p className="text-slate-500 max-w-md mx-auto mb-8">
      Aunque no tengamos "{searchTerm}" visible, nuestra red de proveedores podría conseguirlo.
    </p>
    <Button onClick={() => setShowRadarModal(true)}>
      Solicitar Producto Especial
    </Button>
  </motion.div>
)}
```

#### Modal de Solicitud
**Líneas: 870-951**

El modal captura:
- Producto buscado (requerido)
- Marca (opcional)
- Detalles adicionales (color, talla, modelo)
- Cantidad requerida
- Nombre del cliente
- WhatsApp/Email

#### Handler de Submit
**Líneas: 396-420**

```typescript
const handleRadarSubmit = async () => {
  const { error } = await supabase.from("solicitudes_mercado").insert({
    catalogo_id: catalog.id,
    fabricante_id: catalog.user_id,           // Siempre va al L1
    revendedor_id: catalog.resellerId || null, // Solo si es réplica
    cliente_final_nombre: radarForm.name,
    cliente_final_email: radarForm.email,
    producto_nombre: radarForm.product,
    producto_marca: radarForm.brand,
    producto_descripcion: radarForm.description,
    cantidad: parseInt(radarForm.quantity) || 1,
    estatus_fabricante: "nuevo",
    estatus_revendedor: "nuevo",
  });

  if (!error) {
    toast({ title: "Solicitud recibida" });
    onTrackEvent("Contact", { content_name: "Radar: " + radarForm.product });
  }
};
```

### 2.5 Componentes de Visualización

#### 2.5.1 RadarDeMercado (Word Cloud para L1)
**Archivo:** `src/components/dashboard/RadarDeMercado.tsx`

**Funcionalidad:**
- Visualiza las solicitudes como nube de palabras
- El tamaño de cada palabra representa la frecuencia de solicitud
- Click en palabra muestra detalles de las solicitudes
- Filtro por rango de fechas

**RPC utilizada:** `fn_get_radar_terms`
```typescript
const { data } = await supabase.rpc("fn_get_radar_terms", {
  p_user_id: user.id,
  p_date_from: dateRange.from,
  p_date_to: dateRange.to,
});
```

#### 2.5.2 FabricanteRadarDashboard
**Archivo:** `src/components/dashboard/FabricanteRadarDashboard.tsx`

**Tabs:**
1. **Radar de Mercado** - Vista agregada de solicitudes
2. **Consultas de Red** - Solicitudes escaladas por L2s

**RPC utilizada:** `get_radar_agregado`
```typescript
const { data } = await supabase.rpc("get_radar_agregado", {
  user_id_param: user.id,
});
```

**Retorna:**
```sql
RETURNS TABLE(
  producto_nombre text,
  producto_marca text,
  total_solicitudes bigint,
  total_cantidad bigint,
  estatus_fabricante status_fabricante
)
```

#### 2.5.3 MarketRadarForm (Para L2)
**Archivo:** `src/components/dashboard/MarketRadarForm.tsx`
**Propósito:** Permite a un L2 solicitar productos al L1 desde su dashboard

#### 2.5.4 RevendedorRequestsDashboard
**Archivo:** `src/components/catalog/MarketRadarForm.tsx`
**Propósito:** Panel para que L2 gestione solicitudes de sus clientes

### 2.6 Funciones RPC

#### `get_radar_agregado`
```sql
CREATE OR REPLACE FUNCTION get_radar_agregado(user_id_param uuid)
RETURNS TABLE(
  producto_nombre text,
  producto_marca text,
  total_solicitudes bigint,
  total_cantidad bigint,
  estatus_fabricante status_fabricante
)
LANGUAGE sql AS $$
  SELECT
    s.producto_nombre,
    s.producto_marca,
    COUNT(s.id) AS total_solicitudes,
    SUM(s.cantidad) AS total_cantidad,
    s.estatus_fabricante
  FROM vista_radar_fabricante AS s
  WHERE s.fabricante_id = user_id_param
  GROUP BY s.producto_nombre, s.producto_marca, s.estatus_fabricante
  ORDER BY total_solicitudes DESC;
$$;
```

#### `get_market_radar`
```sql
CREATE OR REPLACE FUNCTION get_market_radar(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT 
        sm.*,
        au.email as revendedor_email_contacto,
        COALESCE(au.phone, au.raw_user_meta_data->>'phone') as revendedor_telefono_contacto,
        COALESCE(au.raw_user_meta_data->>'full_name', 'Socio CatifyPro') as revendedor_nombre_contacto
      FROM solicitudes_mercado sm
      LEFT JOIN auth.users au ON sm.revendedor_id = au.id
      WHERE (sm.fabricante_id = p_user_id) OR (sm.revendedor_id = p_user_id)
      ORDER BY sm.creado_el DESC
      LIMIT 20
    ) t
  );
END;
$$;
```

### 2.7 Flujo de Estados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ESTADOS DE UNA SOLICITUD                        │
└─────────────────────────────────────────────────────────────────────────────┘

                          CLIENTE FINAL
                               │
                               ▼
                        ┌──────────────┐
                        │    NUEVO     │
                        │   (ambos)    │
                        └──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                                 │
              ▼                                 ▼
    ┌─────────────────┐                ┌─────────────────┐
    │   REVENDEDOR    │                │   FABRICANTE    │
    │      (L2)       │                │      (L1)       │
    └─────────────────┘                └─────────────────┘
              │                                 │
              ▼                                 ▼
    ┌─────────────────┐                ┌─────────────────┐
    │   contactado    │                │   en_analisis   │
    └─────────────────┘                └─────────────────┘
              │                                 │
              ▼                                 │
    ┌─────────────────┐                         │
    │ consultado_     │─────────────────────────┤
    │ proveedor       │                         │
    └─────────────────┘                         ▼
              │                        ┌─────────────────┐
              ▼                        │ agregado_al_    │
    ┌─────────────────┐                │ catalogo        │
    │    atendido     │                └─────────────────┘
    └─────────────────┘                         │
                                                ▼
                                       ┌─────────────────┐
                                       │    ignorado     │
                                       └─────────────────┘
```

---

## 3. Sistema de Recomendaciones (Recommendation Banner)

### 3.1 Descripción General
El sistema de recomendaciones sugiere productos complementarios basándose en el análisis de compras pasadas (Market Basket Analysis - MBA). Utiliza una estrategia de "cascada" que va desde algoritmos sofisticados hasta fallbacks simples según el plan del usuario.

### 3.2 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL SISTEMA DE RECOMENDACIONES                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Carrito Actual          useProductRecommendations        RecommendationBanner│
│                                                                              │
│  ┌──────────────┐        ┌────────────────────────┐      ┌────────────────┐ │
│  │ [Producto A] │        │  1. Verifica Plan      │      │   Carrusel     │ │
│  │ [Producto B] │───────>│  2. Consulta MBA       │─────>│   Horizontal   │ │
│  │ [Producto C] │        │  3. Fallbacks          │      │   de Productos │ │
│  └──────────────┘        └────────────────────────┘      └────────────────┘ │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                        │
│                    │               │               │                        │
│                    ▼               ▼               ▼                        │
│              ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│              │   MBA    │   │ Similares│   │ Top Sold │                     │
│              │ (Ventas) │   │  (Attr)  │   │ (Popular)│                     │
│              └──────────┘   └──────────┘   └──────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Tabla de Base de Datos: `product_associations`

#### Esquema
| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | ID único |
| `product_a_id` | uuid | NO | - | Producto origen (en carrito) |
| `product_b_id` | uuid | NO | - | Producto sugerido |
| `co_occurrence_count` | integer | NO | `1` | Veces comprados juntos |
| `confidence_score` | numeric | YES | `0.00` | Score de confianza (0-1) |
| `created_at` | timestamptz | YES | `now()` | Fecha de creación |
| `updated_at` | timestamptz | YES | `now()` | Última actualización |

#### Políticas RLS
| Política | Comando | Expresión |
|----------|---------|-----------|
| `Allow public read access` | SELECT | `true` |

**Nota:** La tabla solo permite lectura pública. La escritura se hace via triggers o procesos batch del sistema.

### 3.4 Hook Principal: `useProductRecommendations`

**Archivo:** `src/hooks/useProductRecommendations.ts`

#### Parámetros
```typescript
export const useProductRecommendations = (
  currentCartProductIds: string[] = [], // IDs de productos en carrito
  catalogOwnerId: string | null         // ID del dueño del catálogo
) => {
  // ...
}
```

#### Retorno
```typescript
{
  recommendations: RecommendedProduct[], // Productos recomendados
  loading: boolean                       // Estado de carga
}
```

#### Tipo RecommendedProduct
```typescript
type RecommendedProduct = Product & {
  reason: string;      // "5 clientes también compraron esto"
  confidence: number;  // Score 0-1
};
```

### 3.5 Estrategia de Cascada

El hook implementa una estrategia de "cascada" que intenta algoritmos más sofisticados primero y cae a fallbacks si fallan:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CASCADA DE RECOMENDACIONES                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PASO 1: Verificar Plan del Dueño                                          │
│   └─> fn_get_owner_plan_details(catalogOwnerId)                             │
│       └─> analytics_level: 'basic' | 'advanced' | 'pro'                     │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐│
│   │ SI analytics_level !== 'pro' → SALIR (sin recomendaciones)             ││
│   └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│   PASO 2: MBA (Market Basket Analysis)                                       │
│   └─> SELECT FROM product_associations                                       │
│       WHERE product_a_id IN (cartIds)                                        │
│       AND product_b_id NOT IN (cartIds)                                      │
│       ORDER BY confidence_score DESC, co_occurrence_count DESC               │
│       LIMIT 3                                                                │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐│
│   │ SI tiene resultados → RETORNAR                                         ││
│   │ Reason: "{N} clientes también compraron esto"                          ││
│   └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│   PASO 3: Verificar si es Empresarial                                        │
│   └─> SI plan.name.includes("Empresarial") = false → SALIR                  │
│                                                                              │
│   PASO 4: Productos Similares (Solo Empresarial)                             │
│   └─> fn_get_similar_products(ownerId, cartIds, limit: 3)                   │
│       └─> Busca por categoría, tags, atributos similares                    │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐│
│   │ SI tiene resultados → RETORNAR                                         ││
│   │ Reason: "Porque es similar a lo que llevas"                            ││
│   └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│   PASO 5: Top Vendidos (Fallback Final - Solo Empresarial)                   │
│   └─> fn_get_top_sold_products(ownerId, limit: 3)                           │
│       └─> Productos con más ventas del catálogo                             │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐│
│   │ SI tiene resultados → RETORNAR                                         ││
│   │ Reason: "¡Es uno de los más vendidos!"                                 ││
│   └────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│   PASO 6: Cascada Fallida                                                    │
│   └─> RETORNAR [] (sin recomendaciones)                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Consulta MBA (Market Basket Analysis)

```typescript
const { data: mbaResults } = await supabase
  .from("product_associations")
  .select(`
    product_b_id,
    confidence_score,
    co_occurrence_count,
    products!product_b_id (
      id, name, price_retail, processed_image_url, original_image_url
    )
  `)
  .in("product_a_id", currentCartProductIds)
  .not("product_b_id", "in", `(${currentCartProductIds.join(",")})`)
  .order("confidence_score", { ascending: false })
  .order("co_occurrence_count", { ascending: false })
  .limit(3);
```

### 3.7 Funciones RPC Relacionadas

#### `fn_get_owner_plan_details`
Obtiene el plan activo del dueño del catálogo.
```sql
RETURNS { name: string, analytics_level: 'basic' | 'advanced' | 'pro' }
```

#### `fn_get_similar_products`
Busca productos similares por atributos.
```sql
PARAMETERS:
  p_owner_id: uuid,
  product_ids_in_cart: uuid[],
  p_limit: integer

RETURNS: Product[]
```

#### `fn_get_top_sold_products`
Obtiene los productos más vendidos.
```sql
PARAMETERS:
  p_owner_id: uuid,
  p_limit: integer

RETURNS: Product[]
```

### 3.8 Componente Visual: RecommendationBanner

**Archivo:** `src/components/quotes/RecommendationBanner.tsx`

#### Props
```typescript
interface RecommendationBannerProps {
  recommendations: RecommendedProduct[];
  onAddToCart: (product: Product) => void;
  loading: boolean;
}
```

#### Características Visuales:
- Carrusel horizontal con scroll snap
- Skeleton loading mientras carga
- Animaciones con Framer Motion
- Badge con reason de recomendación
- Precio tachado (retail) vs precio actual
- Botón "Agregar" por producto

### 3.9 Lugares de Uso

#### 3.9.1 QuoteCartModal
**Archivo:** `src/components/public/QuoteCartModal.tsx`

```typescript
// Obtiene IDs de productos en carrito
const productIdsInCart = useMemo(() => items.map((item) => item.product.id), [items]);

// Llama al hook de recomendaciones
const { recommendations, loading: loadingRecommendations } = useProductRecommendations(
  productIdsInCart,
  catalogOwnerId,
);

// Render del banner dentro del carrito
<RecommendationBanner
  loading={loadingRecommendations}
  recommendations={recommendations}
  onAddToCart={handleAddToCartFromBanner}
/>
```

#### 3.9.2 ConsolidateOrderPage
**Archivo:** `src/pages/reseller/ConsolidateOrderPage.tsx`

Muestra recomendaciones para órdenes consolidadas de L2, sugiriendo productos adicionales que podría pedir al L1.

### 3.10 Matriz de Acceso por Plan

| Plan | MBA | Similares | Top Sold | Banner Visible |
|------|-----|-----------|----------|----------------|
| Free | ❌ | ❌ | ❌ | ❌ |
| Básico | ❌ | ❌ | ❌ | ❌ |
| Básico IA | ✅ | ❌ | ❌ | ✅ (si hay datos) |
| Pro | ✅ | ❌ | ❌ | ✅ |
| Empresarial | ✅ | ✅ | ✅ | ✅ |

### 3.11 Cómo se Puebla `product_associations`

La tabla `product_associations` se puebla automáticamente cuando:

1. **Una cotización es aceptada/pagada:**
   - Se extraen todos los pares de productos del pedido
   - Se incrementa `co_occurrence_count` para cada par
   - Se recalcula `confidence_score`

2. **Cálculo de Confidence Score:**
   ```
   confidence_score = co_occurrence_count / total_orders_with_product_a
   ```
   Representa: "De todas las órdenes que incluyen A, ¿qué % también incluye B?"

---

## 4. Archivos Clave del Sistema

### 4.1 Search Logs
| Archivo | Propósito |
|---------|-----------|
| `src/components/catalog/public/PublicCatalogContent.tsx` | Captura búsquedas |
| `src/components/dashboard/SearchStatsWidget.tsx` | Visualización agregada |
| `src/components/dashboard/analytics/DemandForecastWidget.tsx` | Predicción IA |
| `src/components/dashboard/ResellerInsights.tsx` | Vista L2 |

### 4.2 Radar de Mercado
| Archivo | Propósito |
|---------|-----------|
| `src/components/catalog/public/PublicCatalogContent.tsx` | Modal de solicitud |
| `src/components/dashboard/RadarDeMercado.tsx` | Word Cloud L1 |
| `src/components/dashboard/FabricanteRadarDashboard.tsx` | Dashboard L1 |
| `src/components/dashboard/MarketRadarForm.tsx` | Formulario L2→L1 |
| `src/components/catalog/MarketRadarForm.tsx` | Dashboard solicitudes L2 |
| `src/pages/MarketRadar.tsx` | Página contenedora |

### 4.3 Recomendaciones
| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useProductRecommendations.ts` | Hook principal |
| `src/components/quotes/RecommendationBanner.tsx` | Componente visual |
| `src/components/public/QuoteCartModal.tsx` | Integración en carrito |
| `src/pages/reseller/ConsolidateOrderPage.tsx` | Integración L2 |

---

## 5. Consultas SQL de Diagnóstico

### Ver búsquedas sin resultados (demanda no satisfecha)
```sql
SELECT search_term, COUNT(*) as count
FROM search_logs
WHERE results_count = 0
AND user_id = 'YOUR_USER_ID'
GROUP BY search_term
ORDER BY count DESC
LIMIT 20;
```

### Ver solicitudes pendientes del radar
```sql
SELECT producto_nombre, COUNT(*) as total, SUM(cantidad) as cantidad_total
FROM solicitudes_mercado
WHERE fabricante_id = 'YOUR_USER_ID'
AND estatus_fabricante = 'nuevo'
GROUP BY producto_nombre
ORDER BY total DESC;
```

### Ver asociaciones de productos más fuertes
```sql
SELECT 
  pa.id, pb.name as producto_origen, pb2.name as producto_sugerido,
  co_occurrence_count, confidence_score
FROM product_associations
JOIN products pa ON product_a_id = pa.id
JOIN products pb ON product_a_id = pb.id
JOIN products pb2 ON product_b_id = pb2.id
WHERE pa.user_id = 'YOUR_USER_ID'
ORDER BY confidence_score DESC
LIMIT 20;
```

---

## 6. Eventos de Tracking (Facebook Pixel)

| Sistema | Evento | Datos |
|---------|--------|-------|
| Search Logs | `Search` | `{ search_string }` |
| Radar | `Contact` | `{ content_name: "Radar: {producto}" }` |
| Recomendaciones | `AddToCart` | Disparo estándar al agregar |
