// 🎨 TEMPLATES OPTIMIZADOS PARA CATALOGOIA - V2.0
// Basados en mejores prácticas y ejemplos proporcionados

import { NewTemplateBlueprint, NewTemplateGenerator } from '@/lib/templates/audited-templates-v2';

/**
 * 🛍️ TEMPLATES DE MODA - Inspirados en catálogo MANGO
 * Layout limpio, organizado por looks, tarjetas uniformes
 */

// 1. MODA MINIMAL ELEGANTE (Inspirado en MANGO)
export const MODA_MINIMAL_ELEGANTE: NewTemplateBlueprint = {
  id: 'moda-minimal-elegante',
  displayName: 'Moda Minimal Elegante',
  description: 'Diseño limpio inspirado en MANGO, perfecto para looks organizados',
  industry: 'moda',
  category: 'minimal',
  tags: ['elegante', 'clean', 'looks', 'mango-style', 'minimal'],
  
  colors: {
    primary: '#2C3E50',    // Gris elegante
    secondary: '#34495E',   // Gris medio
    accent: '#ECF0F1'       // Gris claro
  },
  
  density: 'media',
  productsPerPage: 6,      // 3x2 como MANGO
  gridColumns: 3,
  borderRadius: 8,
  shadows: false,          // Clean como MANGO
  spacing: 'amplio',       // Mucho espacio blanco
  typography: 'modern',
  
  showInfo: {
    category: true,          // Para mostrar "CITY LIGHTS", etc.
    description: true,
    sku: false,
    specifications: false
  },
  
  isPremium: false,
  planLevel: 'basic'
};

// 2. MODA VIBRANTE MODERNA
export const MODA_VIBRANTE_MODERNA: NewTemplateBlueprint = {
  id: 'moda-vibrante-moderna',
  displayName: 'Moda Vibrante Moderna',
  description: 'Colores llamativos para moda juvenil y trendy',
  industry: 'moda',
  category: 'creative',
  tags: ['vibrante', 'juvenil', 'colorido', 'moderno', 'energy'],
  
  colors: {
    primary: '#E91E63',     // Rosa vibrante
    secondary: '#AD1457',   // Rosa oscuro
    accent: '#FCE4EC'       // Rosa suave
  },
  
  density: 'media',
  productsPerPage: 8,      // 4x2 para más variedad
  gridColumns: 4,
  borderRadius: 12,
  shadows: true,
  spacing: 'normal',
  typography: 'creative',
  
  showInfo: {
    category: true,
    description: true,
    sku: false,
    specifications: false
  },
  
  isPremium: false,
  planLevel: 'starter'
};

// 3. MODA CLASICA PREMIUM
export const MODA_CLASICA_PREMIUM: NewTemplateBlueprint = {
  id: 'moda-clasica-premium',
  displayName: 'Moda Clásica Premium',
  description: 'Elegancia tradicional para moda de alta gama',
  industry: 'moda',
  category: 'luxury',
  tags: ['clasico', 'premium', 'elegante', 'sofisticado', 'luxury'],
  
  colors: {
    primary: '#8B4513',     // Marrón elegante
    secondary: '#A0522D',   // Marrón claro
    accent: '#F5E6D3'       // Crema
  },
  
  density: 'baja',
  productsPerPage: 4,      // Menos productos para mostrar mejor
  gridColumns: 2,
  borderRadius: 15,
  shadows: true,
  spacing: 'amplio',
  typography: 'classic',
  
  showInfo: {
    category: false,         // Sin categoría para look clean
    description: true,
    sku: false,
    specifications: true     // Materiales, tallas, etc.
  },
  
  isPremium: true,
  planLevel: 'professional'
};

/**
 * 💎 TEMPLATES DE JOYERÍA - Inspirados en catálogo MAGNOLIA
 * Grid organizado, espacios limpios, focus en productos
 */

// 1. JOYERÍA MAGNOLIA CLEAN (Inspirado en la imagen)
export const JOYERIA_MAGNOLIA_CLEAN: NewTemplateBlueprint = {
  id: 'joyeria-magnolia-clean',
  displayName: 'Joyería Magnolia Clean',
  description: 'Layout limpio inspirado en catálogos profesionales de joyería',
  industry: 'joyeria',
  category: 'minimal',
  tags: ['magnolia', 'clean', 'professional', 'grid', 'minimal'],
  
  colors: {
    primary: '#2C3E50',     // Gris profesional
    secondary: '#34495E',
    accent: '#F8F9FA'       // Blanco suave
  },
  
  density: 'media',
  productsPerPage: 9,      // 3x3 como grid MAGNOLIA
  gridColumns: 3,
  borderRadius: 6,
  shadows: false,          // Clean sin sombras
  spacing: 'normal',
  typography: 'modern',
  
  showInfo: {
    category: true,          // ANILLOS, COLLARES, etc.
    description: true,
    sku: true,               // Importante en joyería
    specifications: true     // Quilates, materiales
  },
  
  isPremium: false,
  planLevel: 'basic'
};

// 2. JOYERÍA LUXURY DORADA
export const JOYERIA_LUXURY_DORADA: NewTemplateBlueprint = {
  id: 'joyeria-luxury-dorada',
  displayName: 'Joyería Luxury Dorada',
  description: 'Elegancia premium con toques dorados para joyería de lujo',
  industry: 'joyeria',
  category: 'luxury',
  tags: ['luxury', 'dorado', 'premium', 'elegante', 'gold'],
  
  colors: {
    primary: '#D4AF37',     // Dorado elegante
    secondary: '#B8860B',   // Dorado oscuro
    accent: '#FFF8DC'       // Crema dorado
  },
  
  density: 'baja',
  productsPerPage: 4,      // Pocos productos para mostrar lujo
  gridColumns: 2,
  borderRadius: 12,
  shadows: true,
  spacing: 'amplio',
  typography: 'classic',
  
  showInfo: {
    category: true,
    description: true,
    sku: false,
    specifications: true
  },
  
  isPremium: true,
  planLevel: 'professional'
};

// 3. JOYERÍA MODERN ROSEGOLD
export const JOYERIA_MODERN_ROSEGOLD: NewTemplateBlueprint = {
  id: 'joyeria-modern-rosegold',
  displayName: 'Joyería Modern Rose Gold',
  description: 'Diseño moderno con toques de oro rosa',
  industry: 'joyeria',
  category: 'modern',
  tags: ['modern', 'rose-gold', 'contemporaneo', 'trendy'],
  
  colors: {
    primary: '#E6A8A6',     // Rose gold
    secondary: '#D4989A',   // Rose gold oscuro
    accent: '#F9F2F2'       // Rosa muy suave
  },
  
  density: 'media',
  productsPerPage: 6,
  gridColumns: 3,
  borderRadius: 10,
  shadows: true,
  spacing: 'normal',
  typography: 'modern',
  
  showInfo: {
    category: true,
    description: true,
    sku: true,
    specifications: true
  },
  
  isPremium: false,
  planLevel: 'starter'
};

/**
 * ⚡ TEMPLATES DE ELECTRÓNICOS
 * Organización técnica, especificaciones claras
 */

// 1. ELECTRÓNICOS TECH BLUE
export const ELECTRONICA_TECH_BLUE: NewTemplateBlueprint = {
  id: 'electronica-tech-blue',
  displayName: 'Electrónicos Tech Blue',
  description: 'Diseño profesional para productos tecnológicos',
  industry: 'electronica',
  category: 'business',
  tags: ['tech', 'professional', 'blue', 'specifications', 'modern'],
  
  colors: {
    primary: '#3498DB',     // Azul tech
    secondary: '#2980B9',   // Azul oscuro
    accent: '#EBF4FD'       // Azul muy claro
  },
  
  density: 'alta',
  productsPerPage: 12,     // Muchos productos para catálogos técnicos
  gridColumns: 4,
  borderRadius: 6,
  shadows: false,
  spacing: 'compacto',
  typography: 'modern',
  
  showInfo: {
    category: true,
    description: false,      // Sin descripción para ahorrar espacio
    sku: true,              // SKU importante
    specifications: true     // Especificaciones técnicas cruciales
  },
  
  isPremium: false,
  planLevel: 'basic'
};

// 2. ELECTRÓNICOS GAMING RGB
export const ELECTRONICA_GAMING_RGB: NewTemplateBlueprint = {
  id: 'electronica-gaming-rgb',
  displayName: 'Electrónicos Gaming RGB',
  description: 'Estilo gaming con efectos RGB para productos gamers',
  industry: 'electronica',
  category: 'creative',
  tags: ['gaming', 'rgb', 'gamer', 'dynamic', 'neon'],
  
  colors: {
    primary: '#9B59B6',     // Morado gaming
    secondary: '#8E44AD',   // Morado oscuro
    accent: '#00FF7F'       // Verde neón
  },
  
  density: 'media',
  productsPerPage: 8,
  gridColumns: 4,
  borderRadius: 10,
  shadows: true,
  spacing: 'normal',
  typography: 'creative',
  
  showInfo: {
    category: true,
    description: true,
    sku: true,
    specifications: true
  },
  
  isPremium: true,
  planLevel: 'professional'
};

// 3. ELECTRÓNICOS MINIMAL WHITE
export const ELECTRONICA_MINIMAL_WHITE: NewTemplateBlueprint = {
  id: 'electronica-minimal-white',
  displayName: 'Electrónicos Minimal White',
  description: 'Diseño minimalista tipo Apple para productos premium',
  industry: 'electronica',
  category: 'minimal',
  tags: ['minimal', 'apple-style', 'clean', 'white', 'premium'],
  
  colors: {
    primary: '#1D1D1F',     // Gris Apple
    secondary: '#424245',   // Gris medio
    accent: '#F5F5F7'       // Blanco Apple
  },
  
  density: 'baja',
  productsPerPage: 6,
  gridColumns: 3,
  borderRadius: 12,
  shadows: false,
  spacing: 'amplio',
  typography: 'modern',
  
  showInfo: {
    category: false,         // Clean como Apple
    description: true,
    sku: false,
    specifications: true
  },
  
  isPremium: true,
  planLevel: 'professional'
};

/**
 * 🌸 TEMPLATES DE FLORES
 * Naturales, por ocasiones, colores vibrantes
 */

// 1. FLORES ROMÁNTICO PASTEL
export const FLORES_ROMANTICO_PASTEL: NewTemplateBlueprint = {
  id: 'flores-romantico-pastel',
  displayName: 'Flores Romántico Pastel',
  description: 'Colores suaves para ocasiones románticas y bodas',
  industry: 'floreria',
  category: 'luxury',
  tags: ['romantico', 'pastel', 'bodas', 'amor', 'suave'],
  
  colors: {
    primary: '#FFB6C1',     // Rosa pastel
    secondary: '#FFC0CB',   // Rosa claro
    accent: '#FFF0F5'       // Lavanda suave
  },
  
  density: 'media',
  productsPerPage: 6,
  gridColumns: 3,
  borderRadius: 15,
  shadows: true,
  spacing: 'amplio',
  typography: 'creative',
  
  showInfo: {
    category: true,          // Por ocasión: BODAS, AMOR, etc.
    description: true,
    sku: false,
    specifications: false    // Tipo de flores en descripción
  },
  
  isPremium: false,
  planLevel: 'basic'
};

// 2. FLORES VIBRANTE TROPICAL
export const FLORES_VIBRANTE_TROPICAL: NewTemplateBlueprint = {
  id: 'flores-vibrante-tropical',
  displayName: 'Flores Vibrante Tropical',
  description: 'Colores intensos para celebraciones y eventos especiales',
  industry: 'floreria',
  category: 'creative',
  tags: ['vibrante', 'tropical', 'celebracion', 'colorido', 'festival'],
  
  colors: {
    primary: '#FF6B35',     // Naranja tropical
    secondary: '#F7931E',   // Naranja claro
    accent: '#FFE4B5'       // Melocotón
  },
  
  density: 'media',
  productsPerPage: 8,
  gridColumns: 4,
  borderRadius: 12,
  shadows: true,
  spacing: 'normal',
  typography: 'creative',
  
  showInfo: {
    category: true,
    description: true,
    sku: false,
    specifications: false
  },
  
  isPremium: false,
  planLevel: 'starter'
};

// 3. FLORES NATURAL ORGÁNICO
export const FLORES_NATURAL_ORGANICO: NewTemplateBlueprint = {
  id: 'flores-natural-organico',
  displayName: 'Flores Natural Orgánico',
  description: 'Estilo natural y rústico para arreglos orgánicos',
  industry: 'floreria',
  category: 'modern',
  tags: ['natural', 'organico', 'rustico', 'verde', 'eco'],
  
  colors: {
    primary: '#228B22',     // Verde natural
    secondary: '#32CD32',   // Verde lima
    accent: '#F0FFF0'       // Verde muy claro
  },
  
  density: 'media',
  productsPerPage: 6,
  gridColumns: 3,
  borderRadius: 8,
  shadows: false,
  spacing: 'normal',
  typography: 'modern',
  
  showInfo: {
    category: true,
    description: true,
    sku: false,
    specifications: true     // Tipo de plantas, cuidados
  },
  
  isPremium: false,
  planLevel: 'basic'
};

/**
 * 🧸 TEMPLATES DE JUGUETES
 * Organizados por edades, colores alegres, certificaciones
 */

// 1. JUGUETES INFANTIL COLORES
export const JUGUETES_INFANTIL_COLORES: NewTemplateBlueprint = {
  id: 'juguetes-infantil-colores',
  displayName: 'Juguetes Infantil Colores',
  description: 'Colores primarios brillantes para diversión infantil',
  industry: 'general', // Asumiendo que no tienes 'juguetes' en el type
  category: 'creative',
  tags: ['infantil', 'colores', 'diversion', 'primarios', 'alegre'],
  
  colors: {
    primary: '#FF4444',     // Rojo brillante
    secondary: '#4444FF',   // Azul brillante
    accent: '#FFFF44'       // Amarillo brillante
  },
  
  density: 'media',
  productsPerPage: 9,
  gridColumns: 3,
  borderRadius: 15,
  shadows: true,
  spacing: 'normal',
  typography: 'creative',
  
  showInfo: {
    category: true,          // Por edad: 0-3 años, 3-6 años, etc.
    description: true,
    sku: false,
    specifications: true     // Edad recomendada, seguridad
  },
  
  isPremium: false,
  planLevel: 'basic'
};

// 2. JUGUETES EDUCATIVO SUAVE
export const JUGUETES_EDUCATIVO_SUAVE: NewTemplateBlueprint = {
  id: 'juguetes-educativo-suave',
  displayName: 'Juguetes Educativo Suave',
  description: 'Colores pasteles para juguetes pedagógicos',
  industry: 'general',
  category: 'modern',
  tags: ['educativo', 'pedagogico', 'suave', 'aprendizaje', 'pastel'],
  
  colors: {
    primary: '#87CEEB',     // Azul cielo
    secondary: '#98FB98',   // Verde menta
    accent: '#FFFACD'       // Crema suave
  },
  
  density: 'media',
  productsPerPage: 6,
  gridColumns: 3,
  borderRadius: 12,
  shadows: true,
  spacing: 'amplio',
  typography: 'modern',
  
  showInfo: {
    category: true,
    description: true,
    sku: false,
    specifications: true
  },
  
  isPremium: false,
  planLevel: 'starter'
};

// 3. JUGUETES PREMIUM ELEGANTE
export const JUGUETES_PREMIUM_ELEGANTE: NewTemplateBlueprint = {
  id: 'juguetes-premium-elegante',
  displayName: 'Juguetes Premium Elegante',
  description: 'Colores sofisticados para juguetes de alta calidad',
  industry: 'general',
  category: 'luxury',
  tags: ['premium', 'elegante', 'calidad', 'sofisticado', 'luxury'],
  
  colors: {
    primary: '#4A4A4A',     // Gris elegante
    secondary: '#6A6A6A',   // Gris medio
    accent: '#F5F5F5'       // Gris muy claro
  },
  
  density: 'baja',
  productsPerPage: 4,
  gridColumns: 2,
  borderRadius: 10,
  shadows: true,
  spacing: 'amplio',
  typography: 'classic',
  
  showInfo: {
    category: false,
    description: true,
    sku: true,
    specifications: true
  },
  
  isPremium: true,
  planLevel: 'professional'
};

/**
 * 🎃 TEMPLATE ESPECIAL DE HALLOWEEN
 * Inspirado en la imagen proporcionada - colores morado/naranja
 */

export const HALLOWEEN_FESTIVO: NewTemplateBlueprint = {
  id: 'halloween-festivo',
  displayName: 'Halloween Festivo',
  description: 'Template especial para Halloween con colores morado y naranja',
  industry: 'general',
  category: 'seasonal',
  tags: ['halloween', 'festivo', 'morado', 'naranja', 'terror', 'spooky'],
  
  colors: {
    primary: '#6A0DAD',     // Morado Halloween
    secondary: '#FF6600',   // Naranja Halloween
    accent: '#FFE4B5'       // Naranja claro
  },
  
  density: 'media',
  productsPerPage: 6,      // 3x2 para mostrar bien los productos
  gridColumns: 3,
  borderRadius: 15,        // Bordes redondeados como en la imagen
  shadows: true,
  spacing: 'normal',
  typography: 'creative',
  
  showInfo: {
    category: true,          // DISFRACES, DECORACION, etc.
    description: true,
    sku: false,
    specifications: false
  },
  
  isPremium: false,
  planLevel: 'basic'
};

/**
 * 🏭 FUNCIÓN PARA GENERAR TODOS LOS TEMPLATES
 */
export const generateAllOptimizedTemplates = async () => {
  console.log('🎨 Generando todos los templates optimizados...');
  
  const blueprints = [
    // MODA
    MODA_MINIMAL_ELEGANTE,
    MODA_VIBRANTE_MODERNA,
    MODA_CLASICA_PREMIUM,
    
    // JOYERÍA
    JOYERIA_MAGNOLIA_CLEAN,
    JOYERIA_LUXURY_DORADA,
    JOYERIA_MODERN_ROSEGOLD,
    
    // ELECTRÓNICOS
    ELECTRONICA_TECH_BLUE,
    ELECTRONICA_GAMING_RGB,
    ELECTRONICA_MINIMAL_WHITE,
    
    // FLORES
    FLORES_ROMANTICO_PASTEL,
    FLORES_VIBRANTE_TROPICAL,
    FLORES_NATURAL_ORGANICO,
    
    // JUGUETES
    JUGUETES_INFANTIL_COLORES,
    JUGUETES_EDUCATIVO_SUAVE,
    JUGUETES_PREMIUM_ELEGANTE,
    
    // ESPECIALES
    HALLOWEEN_FESTIVO
  ];
  
  const generatedTemplates = [];
  
  for (const blueprint of blueprints) {
    try {
      console.log(`Generando: ${blueprint.displayName}`);
      const template = await NewTemplateGenerator.createTemplateFromBlueprint(blueprint);
      generatedTemplates.push(template);
      
      console.log(`✅ ${blueprint.displayName} - Score: ${template.qualityScore}/100`);
    } catch (error) {
      console.error(`❌ Error generando ${blueprint.displayName}:`, error);
    }
  }
  
  console.log(`🎉 Generados ${generatedTemplates.length}/${blueprints.length} templates exitosamente`);
  
  return generatedTemplates;
};

/**
 * 📝 INSTRUCCIONES DE INTEGRACIÓN
 */

/*
PARA INTEGRAR ESTOS TEMPLATES:

1. Agregar a tu archivo audited-templates-v2.ts:

```typescript
import { 
  MODA_MINIMAL_ELEGANTE,
  JOYERIA_MAGNOLIA_CLEAN,
  HALLOWEEN_FESTIVO,
  generateAllOptimizedTemplates
  // ... otros imports
} from './optimized-templates-v2';

// Generar todos los templates al inicializar
const initializeOptimizedTemplates = async () => {
  const newTemplates = await generateAllOptimizedTemplates();
  
  // Agregar a tu array existente
  AUDITED_TEMPLATES_V2.push(...newTemplates);
};
```

2. En tu componente TemplateSelection.tsx ya tienes todo integrado!

3. Los templates están optimizados para:
   ✅ Tarjetas del mismo tamaño
   ✅ Footer correctamente posicionado
   ✅ Centrado perfecto
   ✅ 0% cortes garantizado
   ✅ Responsive design
   ✅ Colores optimizados por industria

4. Cada template incluye:
   - Configuración automática de productos por página
   - Colores generados automáticamente
   - Auditoría integrada
   - Escalabilidad calculada
   - Compatibilidad mobile
*/