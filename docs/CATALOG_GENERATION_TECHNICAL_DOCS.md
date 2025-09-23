# Documentación Técnica - Sistema de Generación de Catálogos

## Resumen Ejecutivo

El sistema de generación de catálogos permite a los usuarios crear PDFs profesionales a partir de sus productos, con soporte para imágenes optimizadas con/sin fondo y múltiples templates.

## Arquitectura General

```mermaid
graph TD
    A[Usuario selecciona productos] --> B[TemplateSelectionEnhanced.tsx]
    B --> C[BackgroundSelector.tsx]
    C --> D[getCatalogImageUrl()]
    D --> E[generateCatalog()]
    E --> F[UnifiedGenerator]
    F --> G[PuppeteerServiceClient]
    G --> H[PDF Generado]
```

## Componentes Principales

### 1. TemplateSelectionEnhanced.tsx
**Ubicación**: `src/components/enhanced/TemplateSelectionEnhanced.tsx`

**Responsabilidades**:
- Gestión de productos seleccionados
- Análisis de imágenes con/sin fondo
- Configuración de preferencias de usuario
- Coordinación del proceso de generación

**Estados Clave**:
```typescript
interface ComponentState {
  selectedProducts: Product[];           // Productos a incluir
  backgroundPreference: 'with' | 'without' | 'auto'; // Preferencia de fondo
  backgroundAnalysis: BackgroundAnalysis; // Análisis de imágenes disponibles
  selectedTemplate: string;              // Template seleccionado
  generating: boolean;                   // Estado de generación
}
```

### 2. BackgroundSelector.tsx
**Ubicación**: `src/components/enhanced/BackgroundSelector.tsx`

**Función**: Permite al usuario elegir entre usar imágenes con o sin fondo.

**Lógica de Análisis**:
```typescript
interface BackgroundAnalysis {
  total: number;                    // Total de productos
  withBackground: number;           // Productos solo con fondo
  withoutBackground: number;        // Productos con fondo removido
  hasNoBackgroundOptions: boolean;  // ¿Hay opciones sin fondo?
  allHaveNoBackground: boolean;     // ¿Todos tienen sin fondo?
  mixed: boolean;                   // ¿Mezcla de ambos tipos?
}
```

## Flujo de Procesamiento de Imágenes

### Tipos de URLs de Imagen por Producto

Cada producto puede tener múltiples URLs:

1. **`original_image_url`**: Imagen original subida por el usuario
2. **`processed_image_url`**: Imagen con fondo removido (si existe)
3. **`catalog_image_url`**: Imagen optimizada para catálogos (800x800px, ~100KB)
4. **`hd_image_url`**: Imagen de alta definición
5. **`image_url`**: URL principal actual (calculada dinámicamente)

### Lógica de Selección de URLs

**Función**: `getCatalogImageUrl(product, preferNoBackground)`

```typescript
const getCatalogImageUrl = (product: Product, preferNoBackground: boolean = false): string => {
  // Si el usuario prefiere sin fondo Y existe processed_image_url
  if (preferNoBackground && product.processed_image_url) {
    return product.processed_image_url; // ✅ Imagen sin fondo
  }
  
  // Prioridad para catálogos (optimizada, con fondo)
  return product.catalog_image_url || 
         product.processed_image_url || 
         product.hd_image_url || 
         product.image_url || 
         product.original_image_url;
};
```

### Cálculo de Preferencia

```typescript
const preferNoBackground = backgroundPreference === 'without' || 
                          (backgroundPreference === 'auto' && backgroundAnalysis.allHaveNoBackground);
```

**Casos**:
- `'without'`: Forzar imágenes sin fondo siempre
- `'with'`: Forzar imágenes con fondo siempre  
- `'auto'`: Sin fondo solo si TODOS los productos lo tienen

## Sistema de Generación

### UnifiedGenerator
**Ubicación**: `src/lib/catalog/unified-generator.ts`

**Responsabilidades**:
- Validación de límites de suscripción
- Selección del método de generación (Browser PDF vs Puppeteer)
- Auditoría de calidad de templates
- Orquestación del proceso completo

### PuppeteerServiceClient
**Ubicación**: `src/lib/pdf/puppeteer-service-client.ts`

**Función**: Genera PDFs usando un servicio Puppeteer externo para mayor calidad.

**Ventajas**:
- Renderizado más preciso
- Soporte para layouts complejos
- Mejor manejo de imágenes
- PDFs más livianos y optimizados

## Sistema de Debugging y Logs

### Logs Implementados

1. **Análisis inicial de productos**:
```javascript
🔍 ANÁLISIS DE FONDOS: {
  total: 5,
  withBackground: 2,
  withoutBackground: 3,
  hasNoBackgroundOptions: true,
  allHaveNoBackground: false,
  mixed: true
}
```

2. **Selección de imágenes**:
```javascript
🔍🔍🔍 SELECCIÓN DE IMAGEN para "Producto X": {
  preferNoBackground: true,
  tiene_processed: true,
  processed_url: "https://..._processed.jpg",
  catalog_url: "https://..._catalog.jpg",
  decision: "USAR SIN FONDO"
}
```

3. **URLs enviadas al generador**:
```javascript
🔍 VERIFICACIÓN CRÍTICA - URLs de imagen antes del PDF: {
  totalProductos: 5,
  urls: [...],
  resumen: {
    conImagenSinFondo: 3,
    conImagenOptimizada: 5
  }
}
```

### Estados de Debug

- `🔥🔥🔥`: Ejecución de useEffect
- `🔍🔍🔍`: Selección de imagen por producto
- `✅✅✅`: Confirmación de uso de imagen sin fondo
- `📸📸📸`: Confirmación de uso de imagen con fondo
- `🎯`: Cálculos de preferencia
- `🔄`: Recalculación de URLs

## Problema Actual Identificado

### Síntomas
- Usuario selecciona "Usar imágenes sin fondo"
- El sistema sigue enviando URLs `_catalog.jpg` (con fondo)
- Los logs de debugging no aparecen

### Análisis Técnico

**Problema**: Los logs `🔍🔍🔍` no aparecen, indicando que:

1. El `useEffect` no se ejecuta correctamente
2. La función `getCatalogImageUrl()` no recibe `preferNoBackground=true`
3. Posible problema en las dependencias del `useEffect`

**useEffect Problemático**:
```typescript
useEffect(() => {
  // Este efecto depende de backgroundAnalysis y backgroundPreference
  // Si backgroundAnalysis es null inicialmente, no se ejecuta
}, [backgroundPreference, backgroundAnalysis]);
```

### Flujo de Debugging Actual

1. **Componente carga** → `backgroundAnalysis` = `null`
2. **Productos se cargan** → `setBackgroundAnalysis(analysis)`
3. **Usuario cambia preferencia** → `setBackgroundPreference('without')`
4. **useEffect debería ejecutarse** → ❌ **NO EJECUTA**
5. **URLs no se recalculan** → Mantiene `catalog_image_url`
6. **Generación usa URLs incorrectas** → PDFs con fondo

## Estados de Imagen por Producto

### Ejemplo de Producto Completo
```typescript
{
  id: "123",
  name: "Disfraz De Bombero",
  original_image_url: "https://.../original.jpg",     // 2MB, fondo
  processed_image_url: "https://.../processed.jpg",   // 1.5MB, sin fondo  
  catalog_image_url: "https://.../catalog.jpg",       // 100KB, con fondo optimizado
  image_url: "https://.../catalog.jpg"                // URL ACTUAL (dinámica)
}
```

### Detección de Tipo de Imagen
```typescript
const analysis = {
  tieneOriginal: !!product.original_image_url,
  tieneCatalog: !!product.catalog_image_url,
  tieneProcessed: !!product.processed_image_url,
  
  // ¿Tiene fondo removido disponible?
  esSinFondo: product.processed_image_url && 
              product.processed_image_url !== product.original_image_url
};
```

## Métricas y Optimización

### Tamaños de Archivo Típicos
- **Original**: 1-5MB por imagen
- **Processed**: 0.5-2MB por imagen  
- **Catalog**: 50-150KB por imagen (optimizado)

### Calidad vs Tamaño
- **Catalog URLs**: Mejor para PDFs (90% menos peso)
- **Processed URLs**: Mejor para fondos transparentes
- **Original URLs**: Mejor calidad, mayor tamaño

## Configuración de Templates

### Estructura de Template
```typescript
interface Template {
  id: string;
  name: string;
  category: string;
  quality: number;        // 0-100 (afecta método de generación)
  layout: LayoutConfig;
  styling: StyleConfig;
}
```

### Selección de Método de Generación
- **Quality >= 85**: Puppeteer Service (mejor calidad)
- **Quality < 85**: Browser PDF (más rápido)

## APIs y Servicios Externos

### Puppeteer Service
**Endpoint**: Edge Function `generate-pdf-puppeteer`

**Input**:
```typescript
{
  templateId: string;
  products: Product[];
  businessInfo: BusinessInfo;
  options: GenerationOptions;
}
```

**Output**:
```typescript
{
  success: boolean;
  pdfBuffer: ArrayBuffer;
  metadata: {
    pages: number;
    fileSize: number;
    generationTime: number;
  }
}
```

## Limitaciones y Restricciones

### Límites de Suscripción
- **Plan Básico**: 10 catálogos/mes
- **Plan Premium**: 50 catálogos/mes
- **Plan Profesional**: Ilimitado

### Limitaciones Técnicas
- **Máximo productos por catálogo**: 100
- **Tamaño máximo de imagen**: 10MB
- **Tiempo máximo de generación**: 2 minutos
- **Formatos soportados**: JPG, PNG, WebP

## Próximos Pasos de Optimización

1. **Fix crítico**: Resolver problema de selección de URLs
2. **Cacheo**: Implementar cache de análisis de imágenes
3. **Lazy loading**: Cargar productos bajo demanda
4. **Compresión avanzada**: Optimizar imágenes en tiempo real
5. **Preview en tiempo real**: Vista previa del catálogo antes de generar

## Estructura de Archivos Relacionados

```
src/
├── components/enhanced/
│   ├── TemplateSelectionEnhanced.tsx    # Componente principal
│   └── BackgroundSelector.tsx           # Selector de preferencia
├── lib/
│   ├── catalog/
│   │   └── unified-generator.ts         # Generador principal
│   └── pdf/
│       ├── puppeteer-service-client.ts  # Cliente Puppeteer
│       └── pdf-generator.ts             # Generador browser
└── hooks/
    └── useCatalogLimits.ts              # Hook de límites
```

---

*Documentación actualizada: 2025-09-23*
*Versión del sistema: 2.1.0*
*Estado: En debug activo*