# Documentación Técnica: Sistema de Templates de Catálogos Digitales

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Tipos y Interfaces](#tipos-y-interfaces)
4. [Templates Web (Catálogos Digitales)](#templates-web)
5. [Templates PDF (Catálogos Físicos)](#templates-pdf)
6. [Sistema de Planes y Restricciones](#sistema-de-planes)
7. [Catálogos L1 (Originales) vs L2 (Replicados)](#catalogos-l1-vs-l2)
8. [Recomendador de Templates](#recomendador)
9. [Generación de CSS Dinámico](#generacion-css)
10. [Flujo de Creación de Catálogo](#flujo-creacion)
11. [Rendering Público](#rendering-publico)
12. [Reglas de Diseño](#reglas-diseño)

---

## 1. Arquitectura General {#arquitectura-general}

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE CATÁLOGOS DIGITALES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌───────────────────────────┐    │
│  │ Fabricante   │────▶│ Catálogo L1  │────▶│ Vista Pública             │    │
│  │ (L1 Owner)   │     │ (Original)   │     │ /c/{slug}                 │    │
│  └──────────────┘     └──────┬───────┘     └───────────────────────────┘    │
│                              │                                               │
│                              │ enable_distribution=true                      │
│                              ▼                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌───────────────────────────┐    │
│  │ Revendedor   │────▶│ Catálogo L2  │────▶│ Vista Pública (Híbrida)   │    │
│  │ (L2 Owner)   │     │ (Réplica)    │     │ /c/{slug-replica}         │    │
│  └──────────────┘     └──────────────┘     └───────────────────────────┘    │
│                                                                              │
│  Componentes:                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Templates │ CSS Adapter │ Plan Restrictions │ Catalog Service          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura de Archivos {#estructura-de-archivos}

### Templates Web (Catálogos Digitales)
```
src/lib/web-catalog/
├── types.ts                      # Interfaces principales
├── expanded-templates-catalog.ts # 16+ templates visuales
├── plan-restrictions.ts          # Control de acceso por plan
└── template-filters.ts           # Filtrado y estadísticas

src/lib/templates/
├── web-css-adapter.ts            # Generador de CSS dinámico
├── audited-templates-v2.ts       # Templates PDF auditados (30+)
├── industry-templates.ts         # Templates por industria
├── professional-generator.ts     # Generador HTML profesional
└── templates.ts                  # Config legacy
```

### Componentes UI
```
src/components/templates/
├── WebTemplateSelector.tsx       # Selector para catálogos web
├── SmartTemplateSelector.tsx     # Selector para PDFs
├── TemplatePreview.tsx           # Preview de templates
└── ProductsPerPageSelector.tsx   # Config de densidad

src/components/catalog/
├── public/PublicCatalogContent.tsx  # Rendering del catálogo
├── CatalogFormPreview.tsx           # Preview en formulario
├── ProductSelector.tsx              # Selector de productos
└── BackgroundPatternSelector.tsx    # Patrones de fondo
```

### Servicios
```
src/services/
├── digital-catalog.service.ts    # CRUD catálogos digitales
├── replication.service.ts        # Sistema de réplicas L2
└── reseller-price.service.ts     # Precios personalizados

src/lib/
└── catalogService.ts             # Generación de PDFs via n8n
```

### Páginas
```
src/pages/
├── DigitalCatalogForm.tsx        # Crear/editar catálogo
├── PublicCatalog.tsx             # Vista pública (/c/{slug})
└── Catalogs.tsx                  # Listado de catálogos
```

---

## 3. Tipos y Interfaces {#tipos-y-interfaces}

### WebCatalogTemplate (Principal)
```typescript
// src/lib/web-catalog/types.ts

interface WebCatalogTemplate {
  id: string;                    // Identificador único
  name: string;                  // Nombre display
  description: string;           // Descripción corta
  longDescription?: string;      // Descripción extendida
  thumbnail: string;             // URL preview imagen
  
  // Categorización
  layout: WebCatalogLayout;      // modern-grid | masonry | carousel | magazine | etc
  style: WebCatalogStyle;        // modern | elegant | minimal | bold | luxury | playful
  category: TemplateCategory;    // basic | standard | seasonal
  isPremium: boolean;            // Requiere plan superior
  
  // Recomendación
  bestFor: IndustryMatch[];      // joyeria | moda | tecnologia | etc (60+ industrias)
  idealProductCount: { min: number; max?: number };
  
  // Configuración técnica
  config: WebTemplateConfig;
  colorScheme: WebTemplateColors;
  
  // Metadatos
  popularity: number;            // 0-100
  isNew?: boolean;
  tags: string[];
}

// Configuración del template
interface WebTemplateConfig {
  columnsDesktop: 2 | 3 | 4 | 5;
  columnsMobile: 1 | 2 | 3;
  gap: "tight" | "normal" | "loose";
  cardStyle: "flat" | "elevated" | "outlined" | "glass" | "neumorphic" | "soft";
  cardRadius: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  imageRatio: "square" | "portrait" | "landscape" | "auto";
  hoverEffect: "none" | "lift" | "zoom" | "glow" | "tilt" | "bounce" | "scale";
  clickAction: "modal" | "expand" | "sidebar" | "navigate";
  
  // Features toggleables
  hasSearch: boolean;
  hasFilters: boolean;
  hasCart: boolean;
  hasFavorites: boolean;
  hasShareButtons: boolean;
  hasZoom: boolean;
  
  // Animaciones
  entranceAnimation: "none" | "fade" | "slide" | "scale" | "stagger";
  transitionSpeed: "fast" | "normal" | "slow";
  
  // Branding
  showLogo: boolean;
  showWatermark: boolean;
  customFonts?: string[];
}

// Esquema de colores
interface WebTemplateColors {
  primary: string;       // Color principal (botones, acentos)
  secondary: string;     // Color secundario
  accent: string;        // Color de énfasis
  background: string;    // Fondo de página
  cardBackground: string;// Fondo de tarjetas
  text: string;          // Color de texto principal
  textMuted: string;     // Color de texto secundario
  border: string;        // Color de bordes
  gradient?: {           // Gradiente opcional
    from: string;
    to: string;
    direction: "to-r" | "to-br" | "to-b";
  };
}
```

### Tipos de Layout
```typescript
type WebCatalogLayout =
  | "modern-grid"       // Grid estándar responsivo
  | "masonry"           // Tipo Pinterest
  | "horizontal-scroll" // Scroll horizontal (Netflix)
  | "magazine"          // Layout editorial con sidebar
  | "minimal-list"      // Lista compacta
  | "showcase"          // Fullscreen individual
  | "carousel";         // Slider de productos
```

### Industrias Soportadas
```typescript
type IndustryMatch =
  | "joyeria" | "moda" | "electronica" | "tecnologia"
  | "ferreteria" | "floreria" | "cosmeticos" | "skincare"
  | "decoracion" | "muebles" | "hogar" | "alimentos"
  | "postres" | "artesania" | "niños" | "juguetes"
  | "mascotas" | "regalos" | "eventos" | "licores"
  | "arte" | "fotografia" | "lenceria" | "calzado"
  | "accesorios" | "oficina" | "arquitectura" | "vip"
  | "gala" | "relojes" | "navidad" | "fiestas"
  | "salud" | "deportes" | "gaming" | "autos"
  | "propiedades" | "general" | "marca" | "corporativo"
  | "retail" | "impacto" | "app" | "tech"
  | "servicios" | "entretenimiento";
```

---

## 4. Templates Web (Catálogos Digitales) {#templates-web}

### Ubicación: `src/lib/web-catalog/expanded-templates-catalog.ts`

### Categorías de Templates

| Categoría   | Plan Mínimo | Cantidad | Descripción |
|-------------|-------------|----------|-------------|
| `basic`     | Free        | 1        | Template básico con marca de agua |
| `standard`  | Basic IA    | 9        | Templates profesionales sin marca |
| `seasonal`  | Pro IA      | 7+       | Templates premium (luxury, editorial) |

### Templates Disponibles

#### BASIC (Plan Gratis)
```typescript
{
  id: "basic-catalog-free",
  name: "Tienda Minimalista",
  style: "minimal",
  category: "basic",
  config: { 
    showWatermark: true,
    hasFilters: false, 
    hasCart: false 
  }
}
```

#### STANDARD (Plan Básico+)
```typescript
// Tech Blue - E-commerce clásico
{ id: "modern-grid-clean", style: "modern", bestFor: ["tecnologia", "servicios"] }

// Nature Green - Productos orgánicos
{ id: "masonry-fashion-elegant", style: "elegant", bestFor: ["floreria", "alimentos"] }

// Berry Pop - Juvenil/Colorido
{ id: "grid-colorful", style: "playful", bestFor: ["juguetes", "regalos"] }

// Sunset Orange - Hogar/Decoración
{ id: "sidebar-detail-warm", style: "modern", bestFor: ["muebles", "decoracion"] }

// Social Feed - Estilo Instagram
{ id: "instagram-feed", style: "modern", bestFor: ["moda", "cosmeticos"] }

// Vintage Sepia - Artesanías
{ id: "polaroid-vintage", style: "playful", bestFor: ["artesania", "regalos"] }

// Red Dynamic - Carousel promocional
{ id: "carousel-dynamic", style: "playful", bestFor: ["deportes", "alimentos"] }
```

#### SEASONAL/PREMIUM (Plan Profesional+)
```typescript
// Midnight Luxury - Negro y Dorado
{ id: "masonry-fashion-dark-premium", style: "luxury", bestFor: ["joyeria", "vip"] }

// Frozen Blue - Cristal/Vidrio  
{ id: "frozen-blue-glass", style: "elegant", cardStyle: "glass" }

// Deep Violet Tech - Cyberpunk
{ id: "bento-modern-pro", style: "modern", bestFor: ["gaming", "tecnologia"] }

// Royal Navy & Gold - Corporativo premium
{ id: "sidebar-detail-luxury", style: "luxury", bestFor: ["joyeria", "corporativo"] }

// Vogue Red - Editorial de moda
{ id: "magazine-editorial-pro", style: "bold", bestFor: ["moda", "arte"] }

// Cinema Dark - Estilo Netflix
{ id: "netflix-carousel-pro", layout: "horizontal-scroll" }

// Showcase Gold - Fullscreen productos
{ id: "showcase-fullscreen-pro", layout: "showcase", bestFor: ["autos", "propiedades"] }
```

---

## 5. Templates PDF (Catálogos Físicos) {#templates-pdf}

### Ubicación: `src/lib/templates/audited-templates-v2.ts`

### Interface AuditedTemplate
```typescript
interface AuditedTemplate {
  id: string;
  displayName: string;
  version: '2.0';
  qualityScore: number;           // 90-100
  
  industry: IndustryType;
  category: 'luxury' | 'modern' | 'minimal' | 'creative' | 'business' | 'seasonal';
  
  density: 'alta' | 'media' | 'baja';
  productsPerPage: number;        // 4, 6, 8, 9, 12
  gridColumns: number;            // 2, 3, 4
  
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardBackground: string;
  };
  
  design: {
    borderRadius: number;         // max 15px
    shadows: boolean;
    spacing: 'compacto' | 'normal' | 'amplio';
    typography: 'modern' | 'classic' | 'creative';
  };
  
  showInfo: {
    category: boolean;
    description: boolean;
    sku: boolean;
    specifications: boolean;
    wholesalePrice: boolean;      // Precio de mayoreo
    wholesaleMinQty: boolean;     // Cantidad mínima
  };
  
  isPremium: boolean;
  planLevel: 'free' | 'starter' | 'basic' | 'professional' | 'enterprise';
  
  auditResults: {
    layoutIssues: number;
    colorIssues: number;
    performanceIssues: number;
    compatibilityIssues: number;
    totalIssues: number;          // Debe ser 0
  };
}
```

### Templates PDF por Industria

```
JOYERÍA:
├── luxury-jewelry (Premium, 4 prods/página, dorado)
└── modern-jewelry (Básico, 6 prods/página, rosa)

MODA:
├── fashion-vibrant (Básico, 8 prods/página, colorido)
└── fashion-minimal (Premium, 6 prods/página, neutro)

ELECTRÓNICOS:
├── tech-pro (Básico, 12 prods/página, azul corporativo)
└── tech-gaming (Premium, 9 prods/página, violeta RGB)

FERRETERÍA:
├── hardware-industrial (Básico, alta densidad)
└── hardware-compact (Premium, muy compacto)

DECORACIÓN/MUEBLES:
├── minimalist-white (Free, limpio)
├── minimalist-warm (Free, tonos tierra)
└── minimalist-nordic (Free, escandinavo)
```

---

## 6. Sistema de Planes y Restricciones {#sistema-de-planes}

### Ubicación: `src/lib/web-catalog/plan-restrictions.ts`

### Niveles de Plan
```typescript
type PlanTier = 'free' | 'catalogs' | 'basic' | 'professional' | 'enterprise';

const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    allowedTemplateCategories: ['basic'],
    hasWatermark: true,
    maxActiveCatalogs: 1,
    hasQuotation: false,
    canCustomizeColors: false,
    maxProductsPerCatalog: 50,
  },
  
  catalogs: { // $4.95 USD
    allowedTemplateCategories: ['basic'],
    hasWatermark: true,
    maxActiveCatalogs: 1,
    hasQuotation: true,
    maxProductsPerCatalog: 30,
  },
  
  basic: { // $14.95 USD
    allowedTemplateCategories: ['basic', 'standard'],
    hasWatermark: false,
    maxActiveCatalogs: 5,
    hasQuotation: true,
    maxProductsPerCatalog: 100,
  },
  
  professional: { // $29.95 USD
    allowedTemplateCategories: ['basic', 'standard', 'seasonal'],
    canAccessAllTemplates: true,
    maxActiveCatalogs: 30,
    canCustomizeColors: true,
    canUsePrivateCatalogs: true,
    maxProductsPerCatalog: 300,
  },
  
  enterprise: { // $64.95 USD
    canAccessAllTemplates: true,
    maxActiveCatalogs: 0, // Ilimitados
    maxProductsPerCatalog: 1000,
    analyticsLevel: 'pro',
  }
};
```

### Mapeo de IDs de Planes (Supabase)
```typescript
const PLAN_ID_TO_TIER: Record<string, PlanTier> = {
  '8d9c9971-53a4-4dfb-abe3-df531e31b1a3': 'free',
  '43fae58b-bb42-4752-8722-36be3fc863c8': 'catalogs',
  '7f4ea9f7-2ea4-4dd6-bfc0-b9ee7df1ae53': 'basic',
  'b4fd4d39-8225-46c6-904f-20815e7c0b4e': 'professional',
  '0bacec4c-1316-4890-a309-44ebd357552b': 'enterprise'
};
```

### Filtrado de Templates
```typescript
// src/lib/web-catalog/template-filters.ts

function getAvailableTemplatesForPlan(
  allTemplates: WebCatalogTemplate[], 
  userTier: PlanTier
): WebCatalogTemplate[] {
  const features = PLAN_FEATURES[userTier];
  
  if (features.canAccessAllTemplates) {
    return allTemplates;
  }
  
  return allTemplates.filter(t => 
    features.allowedTemplateCategories.includes(t.category)
  );
}

function isTemplateAvailable(
  template: WebCatalogTemplate, 
  userTier: PlanTier
): boolean {
  return canUseTemplate(template.category, userTier);
}
```

---

## 7. Catálogos L1 (Originales) vs L2 (Replicados) {#catalogos-l1-vs-l2}

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CATÁLOGO L1 (ORIGINAL)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Owner: Fabricante/Mayorista                                                  │
│ Tabla: digital_catalogs                                                      │
│                                                                              │
│ Campos clave:                                                                │
│ ├── id, slug, user_id                                                        │
│ ├── web_template_id (template visual)                                        │
│ ├── price_display: 'menudeo_only' | 'mayoreo_only' | 'both'                 │
│ ├── price_adjustment_menudeo, price_adjustment_mayoreo                       │
│ ├── enable_distribution: boolean (permite réplicas)                          │
│ ├── enable_quotation: boolean                                                │
│ └── background_pattern, brand_colors                                         │
│                                                                              │
│ Productos: catalog_products → products                                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               │ enable_distribution = true
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CATÁLOGO L2 (RÉPLICA)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Owner: Revendedor                                                            │
│ Tabla: replicated_catalogs                                                   │
│                                                                              │
│ Campos clave:                                                                │
│ ├── id, slug, reseller_id                                                    │
│ ├── original_catalog_id (FK → digital_catalogs)                              │
│ ├── activation_token, is_active                                              │
│ └── Hereda configuración del L1 automáticamente                              │
│                                                                              │
│ SOBREESCRITURAS:                                                             │
│ ├── Branding: business_info del reseller                                     │
│ ├── Precios: reseller_product_prices (overlay)                               │
│ └── Productos propios: products WHERE user_id = reseller_id                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Lógica de Fusión en PublicCatalog

```typescript
// src/pages/PublicCatalog.tsx - Flujo de carga

async function loadCatalog(slug: string) {
  // 1. Buscar en L1 (digital_catalogs)
  let { data } = await supabase
    .from("digital_catalogs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    // 2. Si no existe, buscar en L2 (replicated_catalogs)
    const { data: replica } = await supabase
      .from("replicated_catalogs")
      .select("*, digital_catalogs (*)")
      .eq("slug", slug)
      .maybeSingle();
    
    if (replica) {
      catalogHeader = replica.digital_catalogs; // Hereda config L1
      isReplicated = true;
      resellerId = replica.reseller_id;
    }
  }

  // 3. Si es réplica, aplicar branding del Reseller
  if (isReplicated && resellerId) {
    const { data: businessInfo } = await supabase
      .from("business_info")
      .select("*")
      .eq("user_id", resellerId)
      .maybeSingle();
    
    // Sobrescribir nombre, logo, colores
    if (businessInfo.business_name) catalogHeader.name = businessInfo.business_name;
    if (businessInfo.logo_url) catalogHeader.logo_url = businessInfo.logo_url;
    if (businessInfo.primary_color) {
      catalogHeader.brand_colors = { primary: businessInfo.primary_color };
    }
  }

  // 4. Cargar productos del L1
  const { data: l1Products } = await supabase
    .from("catalog_products")
    .select("product_id, products (*)")
    .eq("catalog_id", catalogIdToFetch);

  // 5. Aplicar precios personalizados (Overlay)
  if (isReplicated && replicatedCatalogId) {
    const { data: customPrices } = await supabase
      .from("reseller_product_prices")
      .select("product_id, custom_price_retail, custom_price_wholesale")
      .eq("replicated_catalog_id", replicatedCatalogId);
    
    // Merge precios
    l1Products = l1Products.map(p => {
      const override = priceMap.get(p.id);
      return override ? { ...p, price_retail: override.custom_price_retail } : p;
    });
  }

  // 6. Agregar productos propios del Reseller (Catálogo Híbrido)
  if (isReplicated && resellerId) {
    const { data: l2Products } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", resellerId)
      .is("deleted_at", null);
    
    allProducts = [...l1Products, ...l2Products.map(p => ({
      ...p, 
      is_reseller_product: true
    }))];
  }
}
```

### Tabla de Precios Personalizados
```sql
-- reseller_product_prices
CREATE TABLE reseller_product_prices (
  id UUID PRIMARY KEY,
  replicated_catalog_id UUID REFERENCES replicated_catalogs(id),
  product_id UUID REFERENCES products(id),
  custom_price_retail INTEGER,      -- Centavos
  custom_price_wholesale INTEGER,   -- Centavos
  margin_percentage DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Recomendador de Templates {#recomendador}

### Ubicación: `src/components/templates/SmartTemplateSelector.tsx`

### Lógica de Recomendación
```typescript
// Ordenar por calidad y relevancia
const allTemplates = useMemo(() => {
  const baseTemplates = AuditedTemplateManager.getAllAuditedTemplates();
  
  return baseTemplates
    .sort((a, b) => b.qualityScore - a.qualityScore) // Mayor calidad primero
    .map(convertToIndustryTemplate);
}, []);

// Recomendaciones por industria y cantidad
function getRecommendedTemplates(
  industry?: IndustryType, 
  productCount?: number
): IndustryTemplate[] {
  let templates = Object.values(INDUSTRY_TEMPLATES);
  
  // Filtrar por industria si aplica
  if (industry) {
    templates = templates.filter(t => t.industry === industry);
  }
  
  // Filtrar por rango óptimo de productos
  if (productCount) {
    templates = templates.filter(t => {
      const { min, max } = t.scalability?.optimalRange || [0, 999];
      return productCount >= min && productCount <= max;
    });
  }
  
  // Priorizar nuevos
  return templates.sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return b.qualityScore - a.qualityScore;
  });
}
```

### Densidad por Cantidad de Productos
```typescript
const DENSITY_CONFIG = {
  alta: { productsPerPage: 12, gridColumns: 4, imageSize: 'sm', spacing: 'tight' },
  media: { productsPerPage: 6, gridColumns: 3, imageSize: 'md', spacing: 'normal' },
  baja: { productsPerPage: 4, gridColumns: 2, imageSize: 'lg', spacing: 'loose' }
};

// Selección automática
function getDensityForProductCount(count: number): 'alta' | 'media' | 'baja' {
  if (count > 50) return 'alta';
  if (count > 20) return 'media';
  return 'baja';
}
```

---

## 9. Generación de CSS Dinámico {#generacion-css}

### Ubicación: `src/lib/templates/web-css-adapter.ts`

### Clase WebTemplateAdapter
```typescript
class WebTemplateAdapter {
  static generateWebCSS(
    template: WebCatalogTemplate, 
    backgroundPattern?: string | null
  ): string {
    const colors = template.colorScheme;
    const config = template.config;
    
    // 1. FUENTES (Google Fonts)
    let fontImport = "";
    switch (template.style) {
      case "luxury":
        fontImport = `@import url('...Playfair+Display...');`;
        fontFamily = "'Playfair Display', serif";
        break;
      case "elegant":
        fontImport = `@import url('...Raleway...');`;
        break;
      case "playful":
        fontImport = `@import url('...Quicksand...');`;
        break;
      // ... más estilos
    }
    
    // 2. VARIABLES CSS
    return `
      ${fontImport}
      
      .catalog-public-container {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --background-color: ${colors.background};
        --card-background: ${colors.cardBackground};
        --text-color: ${colors.text};
        --border-radius: ${borderRadiusMap[config.cardRadius]};
        --grid-gap: ${gapMap[config.gap]};
        --font-family: ${fontFamily};
        
        font-family: var(--font-family) !important;
        background-color: var(--background-color) !important;
      }
      
      /* Estilos de tarjeta */
      .catalog-product-card {
        border-radius: var(--border-radius) !important;
        ${cardStylesCSS}
      }
      
      .catalog-product-card:hover {
        ${hoverCSS}
      }
      
      /* Patrones de fondo */
      ${patternUrl ? `
        .catalog-public-container::before {
          background-image: url('${patternUrl}');
          opacity: 0.04;
        }
      ` : ''}
    `;
  }
}
```

### Estilos de Tarjeta
```typescript
const cardStylesMap = {
  elevated: `box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);`,
  outlined: `border: 1px solid var(--border-color);`,
  flat: `border: none; box-shadow: none;`,
  soft: `box-shadow: 0 10px 15px var(--primary-color-alpha);`,
  glass: `
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `
};

const hoverEffectsMap = {
  lift: `transform: translateY(-5px); box-shadow: 0 20px 25px rgba(0,0,0,0.1);`,
  scale: `transform: scale(1.02);`,
  glow: `box-shadow: 0 0 15px var(--primary-color);`,
  bounce: `transform: scale(0.98);`,
  tilt: `transform: rotate(1deg) scale(1.02);`
};
```

---

## 10. Flujo de Creación de Catálogo {#flujo-creacion}

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUJO: CREAR CATÁLOGO DIGITAL                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SELECCIÓN DE PRODUCTOS                                                   │
│     └── ProductSelector.tsx                                                  │
│         ├── Carga products del usuario                                       │
│         ├── Filtros por categoría/búsqueda                                   │
│         └── product_ids[] → form state                                       │
│                                                                              │
│  2. SELECCIÓN DE TEMPLATE                                                    │
│     └── WebTemplateSelector.tsx                                              │
│         ├── Filtra por plan (plan-restrictions.ts)                           │
│         ├── Tabs: Todos | Tu Marca | Premium                                 │
│         └── web_template_id → form state                                     │
│                                                                              │
│  3. CONFIGURACIÓN DE PRECIOS                                                 │
│     └── PriceAdjustmentInput.tsx                                             │
│         ├── price_display: menudeo_only | mayoreo_only | both                │
│         ├── price_adjustment_menudeo: -90% a +100%                           │
│         └── price_adjustment_mayoreo: -90% a +100%                           │
│                                                                              │
│  4. OPCIONES AVANZADAS                                                       │
│     ├── Información visible (SKU, tags, descripción, stock)                  │
│     ├── Cotizaciones (enable_quotation)                                      │
│     ├── Distribución (enable_distribution)                                   │
│     ├── Envío gratis (enable_free_shipping + min_amount)                     │
│     ├── Solo mayoreo (is_wholesale_only + MOQ/MOV)                           │
│     └── Privado (is_private + access_password)                               │
│                                                                              │
│  5. MARKETING (Plan Pro+)                                                    │
│     └── MarketingConfiguration.tsx                                           │
│         ├── Meta Pixel ID                                                    │
│         ├── Meta CAPI Access Token (Conversions API)                         │
│         └── Scripts personalizados (head/body)                               │
│                                                                              │
│  6. GUARDAR                                                                  │
│     └── DigitalCatalogService.createCatalog()                                │
│         ├── Genera slug único                                                │
│         ├── INSERT digital_catalogs                                          │
│         ├── INSERT catalog_products (FK)                                     │
│         └── Retorna URL: /c/{slug}                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Schema del Formulario (Zod)
```typescript
// src/pages/DigitalCatalogForm.tsx

const catalogSchema = z.object({
  // Básicos
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  expires_at: z.date().min(new Date()),
  
  // Template
  web_template_id: z.string().min(1),
  background_pattern: z.string().nullable().optional(),
  
  // Precios
  price_display: z.enum(["menudeo_only", "mayoreo_only", "both"]),
  price_adjustment_menudeo: z.number().min(-90).max(100),
  price_adjustment_mayoreo: z.number().min(-90).max(100),
  
  // Visibilidad
  show_sku: z.boolean(),
  show_tags: z.boolean(),
  show_description: z.boolean(),
  show_stock: z.boolean(),
  
  // Features
  enable_quotation: z.boolean(),
  enable_variants: z.boolean(),
  enable_distribution: z.boolean(),
  enable_free_shipping: z.boolean(),
  free_shipping_min_amount: z.number().min(0).optional(),
  
  // Mayoreo
  is_wholesale_only: z.boolean(),
  min_order_quantity: z.number().min(1).optional(),
  min_order_amount: z.number().min(0).optional(),
  
  // Privacidad
  is_private: z.boolean(),
  access_password: z.string().optional(),
  
  // Productos
  product_ids: z.array(z.string()).min(1),
  
  // Tracking
  tracking_config: z.object({
    meta_capi: z.object({
      enabled: z.boolean(),
      pixel_id: z.string().optional(),
      access_token: z.string().optional(),
    }).optional()
  }).optional()
});
```

---

## 11. Rendering Público {#rendering-publico}

### Ubicación: `src/components/catalog/public/PublicCatalogContent.tsx`

### Flujo de Rendering

```typescript
function PublicCatalogContent({ catalog, onTrackEvent }) {
  // 1. Obtener template activo
  const activeTemplate = useMemo(() => 
    EXPANDED_WEB_TEMPLATES.find(t => t.id === catalog.web_template_id) 
    || EXPANDED_WEB_TEMPLATES[0],
  [catalog.web_template_id]);

  // 2. Generar CSS dinámico
  const templateCSS = useMemo(() => {
    let css = WebTemplateAdapter.generateWebCSS(
      activeTemplate, 
      catalog.background_pattern
    );
    
    // Sobrescribir con colores de marca si existen
    if (catalog.brand_colors?.primary) {
      css += `
        :root {
          --primary: ${catalog.brand_colors.primary} !important;
        }
      `;
    }
    return css;
  }, [activeTemplate, catalog.background_pattern, catalog.brand_colors]);

  // 3. Calcular grid dinámico
  const gridColumnsClass = `lg:grid-cols-${activeTemplate.config.columnsDesktop}`;

  return (
    <div className="catalog-public-container">
      <style>{templateCSS}</style>
      
      {/* Header con branding */}
      <CatalogHeader catalog={catalog} />
      
      {/* Barra de búsqueda y filtros */}
      {activeTemplate.config.hasSearch && <SearchBar />}
      {activeTemplate.config.hasFilters && <ProductFilters />}
      
      {/* Grid de productos */}
      <div className={`grid ${gridColumnsClass} gap-[var(--grid-gap)]`}>
        {filteredProducts.map(product => (
          <PublicProductCard 
            key={product.id}
            product={product}
            onAdd={() => handleSmartAdd(product)}
          />
        ))}
      </div>
      
      {/* Carrito flotante */}
      {activeTemplate.config.hasCart && <QuoteCartModal />}
    </div>
  );
}
```

### Componente de Tarjeta de Producto
```typescript
const PublicProductCard = ({ product, onAdd, onView }) => {
  return (
    <motion.div 
      className="catalog-product-card group"
      variants={fadeIn}
      onClick={onView}
    >
      {/* Imagen */}
      <div className="aspect-square overflow-hidden">
        <img 
          src={product.image_url || product.original_image_url}
          className="catalog-product-image group-hover:scale-105"
        />
        
        {/* Botón agregar */}
        <button 
          onClick={e => { e.stopPropagation(); onAdd(); }}
          className="catalog-add-button absolute bottom-3 right-3"
        >
          <Plus />
        </button>
      </div>
      
      {/* Info */}
      <div className="p-4">
        <span className="text-muted">{product.category}</span>
        <h3 className="catalog-product-name">{product.name}</h3>
        <span className="catalog-product-price">
          ${(product.price_retail / 100).toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
};
```

---

## 12. Reglas de Diseño {#reglas-diseño}

### Reglas Generales

1. **Calidad Score**: Todos los templates deben tener `qualityScore >= 90`
2. **Sin Cortes**: `auditResults.totalIssues === 0`
3. **Compatibilidad**: Todos deben soportar `puppeteer`, `dynamic`, `classic`, `browserPrint`
4. **Mobile First**: `columnsMobile` debe estar definido (1 o 2)

### Reglas de Colores

```typescript
// Garantizar contraste legible
const colorRules = {
  // Texto sobre fondo claro
  lightBackground: { text: '#0f172a', textMuted: '#64748b' },
  
  // Texto sobre fondo oscuro
  darkBackground: { text: '#f8fafc', textMuted: '#94a3b8' },
  
  // Accent siempre contrasta con primary
  accentRule: (primary) => getComplementaryColor(primary),
  
  // Glass solo en fondos oscuros
  glassCard: { minBackgroundDarkness: 0.6 }
};
```

### Reglas de Densidad

```typescript
const densityRules = {
  alta: {
    productsPerPage: [9, 12, 16],
    maxImageSize: 150, // px
    minGap: 8, // px
    industries: ['ferreteria', 'electronica', 'general']
  },
  media: {
    productsPerPage: [6, 8, 9],
    maxImageSize: 200,
    minGap: 16,
    industries: ['moda', 'cosmeticos', 'decoracion']
  },
  baja: {
    productsPerPage: [4, 6],
    maxImageSize: 300,
    minGap: 24,
    industries: ['joyeria', 'arte', 'muebles', 'autos']
  }
};
```

### Reglas de Tipografía

```typescript
const typographyRules = {
  luxury: {
    heading: 'Playfair Display',
    body: 'Lato',
    weight: { heading: 700, body: 300 }
  },
  modern: {
    heading: 'DM Sans',
    body: 'DM Sans',
    weight: { heading: 700, body: 400 }
  },
  creative: {
    heading: 'Quicksand',
    body: 'Quicksand',
    weight: { heading: 700, body: 400 }
  }
};
```

---

## Anexo: Tablas de Base de Datos

### digital_catalogs
```sql
CREATE TABLE digital_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Template
  web_template_id TEXT,
  template_config JSONB,
  background_pattern TEXT,
  
  -- Precios
  price_display TEXT DEFAULT 'both', -- menudeo_only | mayoreo_only | both
  price_adjustment_menudeo DECIMAL DEFAULT 0,
  price_adjustment_mayoreo DECIMAL DEFAULT 0,
  
  -- Visibilidad
  show_sku BOOLEAN DEFAULT true,
  show_tags BOOLEAN DEFAULT true,
  show_description BOOLEAN DEFAULT true,
  show_stock BOOLEAN DEFAULT false,
  
  -- Features
  enable_quotation BOOLEAN DEFAULT false,
  enable_variants BOOLEAN DEFAULT true,
  enable_distribution BOOLEAN DEFAULT false, -- Permite réplicas L2
  
  -- Envío
  enable_free_shipping BOOLEAN DEFAULT false,
  free_shipping_min_amount INTEGER, -- Centavos
  
  -- Mayoreo
  is_wholesale_only BOOLEAN DEFAULT false,
  min_order_quantity INTEGER DEFAULT 1,
  min_order_amount INTEGER, -- Centavos
  
  -- Privacidad
  is_private BOOLEAN DEFAULT false,
  access_password TEXT,
  
  -- Tracking
  tracking_config JSONB,
  tracking_head_scripts TEXT,
  tracking_body_scripts TEXT,
  
  -- Metadata
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### replicated_catalogs
```sql
CREATE TABLE replicated_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_catalog_id UUID NOT NULL REFERENCES digital_catalogs(id),
  reseller_id UUID REFERENCES auth.users(id),
  slug TEXT UNIQUE NOT NULL,
  
  activation_token TEXT UNIQUE,
  is_active BOOLEAN DEFAULT false,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### reseller_product_prices
```sql
CREATE TABLE reseller_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replicated_catalog_id UUID NOT NULL REFERENCES replicated_catalogs(id),
  product_id UUID NOT NULL REFERENCES products(id),
  
  custom_price_retail INTEGER,    -- Centavos
  custom_price_wholesale INTEGER, -- Centavos
  margin_percentage DECIMAL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(replicated_catalog_id, product_id)
);
```

---

## Conclusión

El sistema de catálogos digitales implementa una arquitectura modular con:

1. **Templates configurables** con 16+ diseños web y 30+ diseños PDF
2. **Sistema de planes** con restricciones granulares por categoría
3. **Catálogos híbridos** L1 (originales) + L2 (réplicas) con overlay de precios
4. **CSS dinámico** generado en runtime basado en configuración del template
5. **Recomendador inteligente** por industria, cantidad de productos y plan

La arquitectura permite escalar tanto horizontalmente (más templates) como verticalmente (más features por plan).
