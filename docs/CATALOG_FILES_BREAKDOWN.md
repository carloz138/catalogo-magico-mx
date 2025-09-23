# Archivos y Componentes del Sistema de Catálogos

## 🎯 COMPONENTES PRINCIPALES (Frontend)

### 1. `src/components/enhanced/TemplateSelectionEnhanced.tsx`
**Función**: Componente principal de selección de template y generación
**Qué hace**:
- Maneja la selección de productos para el catálogo
- Controla la preferencia de fondo (con/sin fondo)
- Gestiona el estado de generación
- Coordina todo el proceso de creación del catálogo
- Analiza qué productos tienen imágenes sin fondo disponibles
- Llama al generador unificado para crear el PDF

**Estados clave**:
- `selectedProducts`: Productos seleccionados
- `backgroundPreference`: 'with' | 'without' | 'auto'
- `selectedTemplate`: Template elegido
- `generating`: Estado de carga

### 2. `src/components/enhanced/BackgroundSelector.tsx`
**Función**: Selector de preferencia de tipo de imagen
**Qué hace**:
- Analiza cuántos productos tienen fondo removido
- Muestra opciones: "Con fondo", "Sin fondo", "Automático"
- Solo aparece si hay productos con imágenes sin fondo disponibles
- Emite eventos cuando el usuario cambia la preferencia

**Lógica**:
- Cuenta productos con `processed_image_url` ≠ `original_image_url`
- Determina si mostrar el selector o no
- Calcula texto descriptivo para cada opción

---

## 🏭 GENERADORES Y LÓGICA DE NEGOCIO

### 3. `src/lib/catalog/unified-generator.ts`
**Función**: Generador principal que orquesta todo el proceso
**Qué hace**:
- **Valida límites** de suscripción del usuario
- **Selecciona método** de generación (Browser vs Puppeteer)
- **Auditoria calidad** del template seleccionado
- **Prepara datos** para el generador específico
- **Guarda resultado** en la base de datos
- **Maneja errores** y reintentos

**Flujo**:
1. Verificar si el usuario puede generar catálogos
2. Auditar template (calidad, estructura, CSS)
3. Elegir: Browser PDF (rápido) vs Puppeteer (calidad)
4. Enviar a generador específico
5. Guardar PDF en storage
6. Registrar en BD y actualizar límites

### 4. `src/lib/pdf/puppeteer-service-client.ts`
**Función**: Cliente para el servicio de Puppeteer (alta calidad)
**Qué hace**:
- **Conecta** con el servicio Puppeteer externo
- **Envía datos** del catálogo (productos, template, business info)
- **Maneja timeouts** y reintentos
- **Optimiza imágenes** antes del envío
- **Retorna PDF** generado con metadatos

**Cuándo se usa**: Templates con calidad ≥ 85% (alta calidad)

### 5. `src/lib/pdf/browser-pdf-generator.ts`
**Función**: Generador de PDF en el navegador (rápido)
**Qué hace**:
- **Genera PDFs** directamente en el navegador
- **Renderiza templates** usando DOM
- **Optimiza rendimiento** para catálogos simples
- **Maneja layouts** básicos y medios

**Cuándo se usa**: Templates con calidad < 85% (velocidad)

### 6. `src/lib/pdf/dynamic-template-engine.ts`
**Función**: Motor de templates dinámicos
**Qué hace**:
- **Mapea productos** a estructura de template
- **Calcula layouts** (grids, posiciones, tamaños)
- **Genera CSS** dinámico según contenido
- **Optimiza distribución** de productos en páginas

---

## 📊 TEMPLATES Y CONFIGURACIÓN

### 7. `src/lib/templates/optimized-templates-v2.ts`
**Función**: Definiciones de templates optimizados
**Qué contiene**:
- Configuración de layouts por industria
- Estilos CSS para cada template
- Parámetros de calidad y rendimiento
- Metadatos de compatibilidad

### 8. `src/lib/templates/enhanced-config.ts`
**Función**: Configuración avanzada de templates
**Qué hace**:
- Define reglas de mapeo de productos
- Configura responsive design
- Establece límites y restricciones
- Gestiona fallbacks y errores

### 9. `src/lib/templates/css-generator.ts`
**Función**: Generador dinámico de CSS
**Qué hace**:
- **Crea estilos** basados en contenido del catálogo
- **Adapta colores** del negocio al template
- **Calcula dimensiones** según número de productos
- **Optimiza CSS** para renderizado rápido

### 10. `src/lib/templates/template-audit-system.ts`
**Función**: Sistema de auditoría de calidad
**Qué hace**:
- **Evalúa templates** antes de usar (0-100%)
- **Detecta problemas** de CSS, estructura, imágenes
- **Sugiere optimizaciones** automáticas
- **Garantiza compatibilidad** cross-browser

---

## 🗄️ SERVICIOS Y HOOKS

### 11. `src/lib/catalogService.ts`
**Función**: Servicio principal de catálogos
**Qué hace**:
- **CRUD** de catálogos en BD
- **Gestión de archivos** en Supabase Storage
- **Validaciones** de negocio
- **Historial** y versionado

### 12. `src/lib/subscriptionService.ts`
**Función**: Gestión de suscripciones y límites
**Qué hace**:
- **Verifica límites** mensuales de catálogos
- **Valida permisos** por plan de suscripción
- **Calcula costos** y créditos
- **Maneja upgrades** automáticos

### 13. `src/hooks/useCatalogLimits.ts`
**Función**: Hook para límites de catálogos
**Qué hace**:
- **Fetches límites** del usuario actual
- **Reactiva** a cambios de suscripción
- **Cachea resultados** para rendimiento
- **Expone estado** `canGenerate`, `remaining`, etc.

### 14. `src/hooks/useBusinessInfo.ts`
**Función**: Hook para información del negocio
**Qué hace**:
- **Obtiene datos** del negocio del usuario
- **Valida completitud** de la información
- **Actualiza** automáticamente en cambios
- **Maneja estados** de carga y errores

---

## 🖼️ PROCESAMIENTO DE IMÁGENES

### 15. `src/utils/imageProcessing.ts`
**Función**: Utilidades de procesamiento de imágenes
**Qué hace**:
- **Optimiza imágenes** para catálogos (resize, compress)
- **Detecta formatos** y convierte si necesario
- **Valida dimensiones** mínimas/máximas
- **Genera thumbnails** para previews

### 16. `src/components/upload/ImageAnalysis.tsx`
**Función**: Análisis de imágenes subidas
**Qué hace**:
- **Analiza contenido** de imágenes (AI/ML)
- **Detecta fondos** removibles automáticamente
- **Sugiere mejoras** de calidad
- **Extrae metadatos** (dimensiones, formato, etc.)

---

## 🎨 COMPONENTES DE UI RELACIONADOS

### 17. `src/components/products/ProductCard.tsx`
**Función**: Tarjeta individual de producto
**Qué hace**:
- **Muestra preview** del producto en el catálogo
- **Permite selección** para incluir/excluir
- **Indica estado** de imagen (con/sin fondo)
- **Botones** de acciones rápidas

### 18. `src/components/templates/TemplatePreview.tsx`
**Función**: Preview de templates disponibles
**Qué hace**:
- **Renderiza miniatura** del template
- **Muestra información** (nombre, compatibilidad)
- **Permite selección** con click
- **Indica calidad** y características

### 19. `src/components/catalog/CatalogPreview.tsx`
**Función**: Preview del catálogo antes de generar
**Qué hace**:
- **Simula resultado** final del PDF
- **Muestra distribución** de productos
- **Permite ajustes** de última hora
- **Validaciones** previas a generación

---

## 💾 EDGE FUNCTIONS (Backend)

### 20. `supabase/functions/create-payment-intent/index.ts`
**Función**: Gestión de pagos Stripe
**Qué hace**:
- **Procesa pagos** de suscripciones
- **Valida webhooks** de Stripe
- **Actualiza límites** tras pago exitoso
- **Maneja errores** de facturación

---

## 📱 PÁGINAS Y RUTAS

### 21. `src/pages/Catalogs.tsx`
**Función**: Página principal de catálogos
**Qué hace**:
- **Lista catálogos** existentes del usuario
- **Permite descarga** de PDFs previos
- **Botón** para crear nuevo catálogo
- **Gestión** de catálogos (eliminar, renombrar)

### 22. `src/pages/TemplateSelection.tsx`
**Función**: Página de selección de template (Legacy)
**Estado**: Reemplazada por `TemplateSelectionEnhanced.tsx`

---

## 🔧 UTILIDADES Y HELPERS

### 23. `src/lib/utils/subscription-helpers.ts`
**Función**: Helpers para suscripciones
**Qué hace**:
- **Calcula fechas** de vencimiento
- **Determina permisos** por plan
- **Formatea** información de suscripción
- **Validaciones** de estado

### 24. `src/lib/debug/pdf-debug-system.ts`
**Función**: Sistema de debugging para PDFs
**Qué hace**:
- **Logs detallados** del proceso de generación
- **Métricas** de rendimiento
- **Reportes** de errores estructurados
- **Herramientas** de diagnóstico

---

## 📋 TIPOS Y INTERFACES

### 25. `src/types/products.ts`
**Función**: Definiciones de tipos para productos
**Qué contiene**:
```typescript
interface Product {
  id: string;
  name: string;
  original_image_url?: string;    // Imagen original
  processed_image_url?: string;   // Sin fondo
  catalog_image_url?: string;     // Optimizada para catálogo
  hd_image_url?: string;         // Alta definición
  image_url?: string;            // URL actual (dinámica)
}
```

### 26. `src/types/business.ts`
**Función**: Tipos para información de negocio
**Qué contiene**:
```typescript
interface BusinessInfo {
  business_name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  logo_url?: string;
  primary_color?: string;
}
```

---

## 🎛️ CONFIGURACIÓN

### 27. `src/integrations/supabase/client.ts`
**Función**: Cliente de Supabase configurado
**Qué hace**:
- **Conexión** a base de datos
- **Autenticación** de usuarios
- **Storage** para PDFs e imágenes
- **Real-time** subscriptions

### 28. `tailwind.config.ts`
**Función**: Configuración de Tailwind CSS
**Qué contiene**:
- **Tokens** de diseño para templates
- **Colores** personalizables por negocio
- **Responsive breakpoints** para catálogos
- **Utilidades** específicas de PDF

---

## 🔄 FLUJO COMPLETO DE ARCHIVOS

```
Usuario selecciona productos
├── TemplateSelectionEnhanced.tsx (gestión)
├── BackgroundSelector.tsx (preferencias)
├── ProductCard.tsx (selección individual)
└── TemplatePreview.tsx (elección template)

Generación iniciada
├── unified-generator.ts (orquestador)
├── useCatalogLimits.ts (validación)
├── template-audit-system.ts (calidad)
└── subscriptionService.ts (permisos)

Procesamiento
├── puppeteer-service-client.ts (alta calidad)
├── browser-pdf-generator.ts (velocidad)
├── dynamic-template-engine.ts (layout)
└── css-generator.ts (estilos)

Resultado
├── catalogService.ts (guardado)
├── Catalogs.tsx (listado)
└── supabase/client.ts (storage)
```

---

## 📊 RESUMEN POR FUNCIÓN

**🎨 UI/UX (6 archivos)**:
- TemplateSelectionEnhanced, BackgroundSelector, ProductCard, TemplatePreview, CatalogPreview, Catalogs.tsx

**🏭 Generación (5 archivos)**:
- unified-generator, puppeteer-service-client, browser-pdf-generator, dynamic-template-engine, css-generator

**📚 Templates (4 archivos)**:
- optimized-templates-v2, enhanced-config, template-audit-system, + CSS helpers

**🔧 Servicios (4 archivos)**:
- catalogService, subscriptionService, imageProcessing, debug-system

**🪝 Hooks (3 archivos)**:
- useCatalogLimits, useBusinessInfo, + utils

**🗄️ Tipos/Config (4 archivos)**:
- products.ts, business.ts, supabase/client, tailwind.config

**📱 Páginas (2 archivos)**:
- Catalogs.tsx, TemplateSelection.tsx (legacy)

---

**Total: ~30 archivos** involucrados en el proceso completo de generación de catálogos.