
export interface TemplateConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPremium: boolean;
  productsPerPage: number;
  imageSize: {
    width: number;
    height: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    background: string;
    text: string;
  };
  layout: 'grid' | 'list' | 'magazine';
  features: string[];
  category: 'business' | 'creative' | 'seasonal' | 'lifestyle' | 'luxury';
}

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  // FREE TEMPLATES (5)
  'minimalista-gris': {
    id: 'minimalista-gris',
    name: 'minimalista-gris',
    displayName: 'Minimalista Gris',
    description: 'Diseño limpio y profesional con tonos grises elegantes',
    isPremium: false,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#6B7280',
      secondary: '#F3F4F6',
      background: '#FFFFFF',
      text: '#111827'
    },
    layout: 'grid',
    features: ['Diseño limpio', 'Tipografía moderna', 'Espacios amplios'],
    category: 'business'
  },
  'profesional-corporativo': {
    id: 'profesional-corporativo',
    name: 'profesional-corporativo',
    displayName: 'Profesional Corporativo',
    description: 'Estilo corporativo con colores azules y estructura formal',
    isPremium: false,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      background: '#F8FAFC',
      text: '#1F2937'
    },
    layout: 'list',
    features: ['Estructura formal', 'Colores corporativos', 'Información detallada'],
    category: 'business'
  },
  'naturaleza-organico': {
    id: 'naturaleza-organico',
    name: 'naturaleza-organico',
    displayName: 'Naturaleza Orgánico',
    description: 'Inspirado en la naturaleza con tonos verdes y diseño eco-friendly',
    isPremium: false,
    productsPerPage: 3,
    imageSize: { width: 420, height: 420 },
    colors: {
      primary: '#16A34A',
      secondary: '#22C55E',
      accent: '#84CC16',
      background: '#F0FDF4',
      text: '#14532D'
    },
    layout: 'grid',
    features: ['Tonos naturales', 'Diseño orgánico', 'Elementos verdes'],
    category: 'lifestyle'
  },
  'rustico-campestre': {
    id: 'rustico-campestre',
    name: 'rustico-campestre',
    displayName: 'Rústico Campestre',
    description: 'Estilo rústico con elementos de madera y colores tierra',
    isPremium: false,
    productsPerPage: 4,
    imageSize: { width: 380, height: 380 },
    colors: {
      primary: '#92400E',
      secondary: '#D97706',
      accent: '#F59E0B',
      background: '#FEF3C7',
      text: '#451A03'
    },
    layout: 'grid',
    features: ['Estilo rústico', 'Colores tierra', 'Textura natural'],
    category: 'lifestyle'
  },
  'verano-tropical': {
    id: 'verano-tropical',
    name: 'verano-tropical',
    displayName: 'Verano Tropical',
    description: 'Colores vibrantes y frescos perfectos para productos de verano',
    isPremium: false,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#0891B2',
      secondary: '#06B6D4',
      accent: '#F97316',
      background: '#CFFAFE',
      text: '#164E63'
    },
    layout: 'grid',
    features: ['Colores tropicales', 'Diseño fresco', 'Elementos playeros'],
    category: 'seasonal'
  },

  // PREMIUM TEMPLATES (25)
  'fiesta-mexicana': {
    id: 'fiesta-mexicana',
    name: 'fiesta-mexicana',
    displayName: 'Fiesta Mexicana',
    description: 'Colores vibrantes inspirados en la cultura mexicana',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#DC2626',
      secondary: '#16A34A',
      accent: '#F59E0B',
      background: '#FEF3C7',
      text: '#7C2D12'
    },
    layout: 'grid',
    features: ['Colores tradicionales', 'Elementos decorativos', 'Estilo festivo'],
    category: 'seasonal'
  },
  'halloween': {
    id: 'halloween',
    name: 'halloween',
    displayName: 'Halloween',
    description: 'Diseño temático de Halloween con colores naranjas y negros',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#EA580C',
      secondary: '#000000',
      accent: '#7C3AED',
      background: '#1F2937',
      text: '#F97316'
    },
    layout: 'magazine',
    features: ['Temática Halloween', 'Colores místicos', 'Elementos spooky'],
    category: 'seasonal'
  },
  'elegante-oro': {
    id: 'elegante-oro',
    name: 'elegante-oro',
    displayName: 'Elegante Oro',
    description: 'Lujo y elegancia con detalles dorados y tipografía refinada',
    isPremium: true,
    productsPerPage: 2,
    imageSize: { width: 500, height: 500 },
    colors: {
      primary: '#D97706',
      secondary: '#FCD34D',
      accent: '#92400E',
      background: '#FFFBEB',
      text: '#451A03'
    },
    layout: 'list',
    features: ['Detalles dorados', 'Tipografía elegante', 'Diseño premium'],
    category: 'luxury'
  },
  'tecnologico-futurista': {
    id: 'tecnologico-futurista',
    name: 'tecnologico-futurista',
    displayName: 'Tecnológico Futurista',
    description: 'Diseño moderno con elementos tech y colores neón',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#3B82F6',
      secondary: '#06B6D4',
      accent: '#10B981',
      background: '#0F172A',
      text: '#E2E8F0'
    },
    layout: 'grid',
    features: ['Elementos tech', 'Colores neón', 'Diseño futurista'],
    category: 'creative'
  },
  'dia-muertos': {
    id: 'dia-muertos',
    name: 'dia-muertos',
    displayName: 'Día de Muertos',
    description: 'Inspirado en la tradición mexicana del Día de Muertos',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#1F2937',
      text: '#F3F4F6'
    },
    layout: 'grid',
    features: ['Elementos culturales', 'Colores tradicionales', 'Diseño festivo'],
    category: 'seasonal'
  },
  'industrial': {
    id: 'industrial',
    name: 'industrial',
    displayName: 'Industrial',
    description: 'Estilo industrial con elementos metálicos y colores neutros',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 430, height: 430 },
    colors: {
      primary: '#4B5563',
      secondary: '#6B7280',
      accent: '#F97316',
      background: '#F9FAFB',
      text: '#111827'
    },
    layout: 'list',
    features: ['Estilo industrial', 'Elementos metálicos', 'Diseño robusto'],
    category: 'business'
  },
  'otono-acogedor': {
    id: 'otono-acogedor',
    name: 'otono-acogedor',
    displayName: 'Otoño Acogedor',
    description: 'Colores cálidos de otoño que transmiten comodidad',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#DC2626',
      secondary: '#F59E0B',
      accent: '#92400E',
      background: '#FEF3C7',
      text: '#451A03'
    },
    layout: 'grid',
    features: ['Colores otoñales', 'Sensación acogedora', 'Elementos cálidos'],
    category: 'seasonal'
  },
  'playero-relajado': {
    id: 'playero-relajado',
    name: 'playero-relajado',
    displayName: 'Playero Relajado',
    description: 'Inspirado en la playa con colores azules y arena',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#0891B2',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#E0F7FA',
      text: '#0F4C75'
    },
    layout: 'magazine',
    features: ['Temática playera', 'Colores marinos', 'Diseño relajante'],
    category: 'lifestyle'
  },
  'lujo-purpura': {
    id: 'lujo-purpura',
    name: 'lujo-purpura',
    displayName: 'Lujo Púrpura',
    description: 'Elegancia real con tonos púrpuras y dorados',
    isPremium: true,
    productsPerPage: 2,
    imageSize: { width: 500, height: 500 },
    colors: {
      primary: '#7C3AED',
      secondary: '#A855F7',
      accent: '#F59E0B',
      background: '#FAF5FF',
      text: '#581C87'
    },
    layout: 'list',
    features: ['Tonos púrpuras', 'Elementos de lujo', 'Diseño real'],
    category: 'luxury'
  },
  'boda-elegante': {
    id: 'boda-elegante',
    name: 'boda-elegante',
    displayName: 'Boda Elegante',
    description: 'Perfecto para productos de boda con tonos rosados y dorados',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#EC4899',
      secondary: '#F9A8D4',
      accent: '#F59E0B',
      background: '#FDF2F8',
      text: '#9D174D'
    },
    layout: 'grid',
    features: ['Temática nupcial', 'Colores románticos', 'Elementos elegantes'],
    category: 'lifestyle'
  },
  'deportivo-energetico': {
    id: 'deportivo-energetico',
    name: 'deportivo-energetico',
    displayName: 'Deportivo Energético',
    description: 'Dinámico y energético para productos deportivos',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#EF4444',
      secondary: '#F97316',
      accent: '#10B981',
      background: '#FEF2F2',
      text: '#7F1D1D'
    },
    layout: 'grid',
    features: ['Diseño dinámico', 'Colores energéticos', 'Elementos deportivos'],
    category: 'lifestyle'
  },
  'infantil-colorido': {
    id: 'infantil-colorido',
    name: 'infantil-colorido',
    displayName: 'Infantil Colorido',
    description: 'Alegre y colorido perfecto para productos infantiles',
    isPremium: true,
    productsPerPage: 6,
    imageSize: { width: 350, height: 350 },
    colors: {
      primary: '#EC4899',
      secondary: '#3B82F6',
      accent: '#10B981',
      background: '#FEF3C7',
      text: '#1F2937'
    },
    layout: 'grid',
    features: ['Colores vibrantes', 'Elementos lúdicos', 'Diseño divertido'],
    category: 'creative'
  },
  'gourmet-delicado': {
    id: 'gourmet-delicado',
    name: 'gourmet-delicado',
    displayName: 'Gourmet Delicado',
    description: 'Sofisticado y delicado para productos gastronómicos',
    isPremium: true,
    productsPerPage: 2,
    imageSize: { width: 500, height: 500 },
    colors: {
      primary: '#92400E',
      secondary: '#D97706',
      accent: '#DC2626',
      background: '#FFFBEB',
      text: '#451A03'
    },
    layout: 'list',
    features: ['Estilo gourmet', 'Tipografía elegante', 'Presentación sofisticada'],
    category: 'luxury'
  },
  'noche-estrellada': {
    id: 'noche-estrellada',
    name: 'noche-estrellada',
    displayName: 'Noche Estrellada',
    description: 'Misterioso y elegante inspirado en la noche',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#1E1B4B',
      secondary: '#3730A3',
      accent: '#F59E0B',
      background: '#0F172A',
      text: '#E2E8F0'
    },
    layout: 'magazine',
    features: ['Temática nocturna', 'Colores místicos', 'Elementos estelares'],
    category: 'creative'
  },
  'artesanal-bohemio': {
    id: 'artesanal-bohemio',
    name: 'artesanal-bohemio',
    displayName: 'Artesanal Bohemio',
    description: 'Estilo bohemio con elementos artesanales y naturales',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#92400E',
      secondary: '#DC2626',
      accent: '#16A34A',
      background: '#FEF3C7',
      text: '#451A03'
    },
    layout: 'grid',
    features: ['Estilo bohemio', 'Elementos artesanales', 'Colores terrosos'],
    category: 'creative'
  },
  'lujo-negro-oro': {
    id: 'lujo-negro-oro',
    name: 'lujo-negro-oro',
    displayName: 'Lujo Negro Oro',
    description: 'Máximo lujo con combinación negro y oro',
    isPremium: true,
    productsPerPage: 2,
    imageSize: { width: 550, height: 550 },
    colors: {
      primary: '#000000',
      secondary: '#1F2937',
      accent: '#F59E0B',
      background: '#111827',
      text: '#F9FAFB'
    },
    layout: 'list',
    features: ['Combinación premium', 'Máximo lujo', 'Diseño exclusivo'],
    category: 'luxury'
  },
  'primavera-floral': {
    id: 'primavera-floral',
    name: 'primavera-floral',
    displayName: 'Primavera Floral',
    description: 'Fresco y floral inspirado en la primavera',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#EC4899',
      secondary: '#16A34A',
      accent: '#F59E0B',
      background: '#FDF2F8',
      text: '#0F5132'
    },
    layout: 'grid',
    features: ['Elementos florales', 'Colores primaverales', 'Diseño fresco'],
    category: 'seasonal'
  },
  'cafeteria-acogedora': {
    id: 'cafeteria-acogedora',
    name: 'cafeteria-acogedora',
    displayName: 'Cafetería Acogedora',
    description: 'Cálido y acogedor perfecto para cafeterías y restaurantes',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#92400E',
      secondary: '#D97706',
      accent: '#DC2626',
      background: '#FEF3C7',
      text: '#451A03'
    },
    layout: 'list',
    features: ['Ambiente acogedor', 'Colores cálidos', 'Estilo café'],
    category: 'lifestyle'
  },
  'fitness-vibrante': {
    id: 'fitness-vibrante',
    name: 'fitness-vibrante',
    displayName: 'Fitness Vibrante',
    description: 'Energético y motivacional para productos de fitness',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#10B981',
      secondary: '#3B82F6',
      accent: '#F97316',
      background: '#F0FDF4',
      text: '#064E3B'
    },
    layout: 'grid',
    features: ['Diseño energético', 'Colores motivacionales', 'Elementos fitness'],
    category: 'lifestyle'
  },
  'viajes-aventureros': {
    id: 'viajes-aventureros',
    name: 'viajes-aventureros',
    displayName: 'Viajes Aventureros',
    description: 'Inspirado en aventuras y viajes alrededor del mundo',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#0891B2',
      secondary: '#16A34A',
      accent: '#F97316',
      background: '#ECFCCB',
      text: '#14532D'
    },
    layout: 'magazine',
    features: ['Temática viajes', 'Elementos aventureros', 'Colores naturales'],
    category: 'lifestyle'
  },
  'musica-festiva': {
    id: 'musica-festiva',
    name: 'musica-festiva',
    displayName: 'Música Festiva',
    description: 'Vibrante y festivo perfecto para eventos musicales',
    isPremium: true,
    productsPerPage: 4,
    imageSize: { width: 400, height: 400 },
    colors: {
      primary: '#7C3AED',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: '#1F2937',
      text: '#F9FAFB'
    },
    layout: 'grid',
    features: ['Colores festivos', 'Elementos musicales', 'Diseño vibrante'],
    category: 'creative'
  },
  'galactico-espacial': {
    id: 'galactico-espacial',
    name: 'galactico-espacial',
    displayName: 'Galáctico Espacial',
    description: 'Futurista y cósmico inspirado en el espacio exterior',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#1E1B4B',
      secondary: '#7C3AED',
      accent: '#06B6D4',
      background: '#0F172A',
      text: '#E2E8F0'
    },
    layout: 'grid',
    features: ['Temática espacial', 'Colores cósmicos', 'Elementos futuristas'],
    category: 'creative'
  },
  'romantico-vintage': {
    id: 'romantico-vintage',
    name: 'romantico-vintage',
    displayName: 'Romántico Vintage',
    description: 'Nostálgico y romántico con estilo vintage',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#DC2626',
      secondary: '#EC4899',
      accent: '#D97706',
      background: '#FDF2F8',
      text: '#7F1D1D'
    },
    layout: 'list',
    features: ['Estilo vintage', 'Elementos románticos', 'Colores nostálgicos'],
    category: 'creative'
  },
  'minimalista-blanco': {
    id: 'minimalista-blanco',
    name: 'minimalista-blanco',
    displayName: 'Minimalista Blanco',
    description: 'Ultra limpio y minimalista con predominio del blanco',
    isPremium: true,
    productsPerPage: 2,
    imageSize: { width: 500, height: 500 },
    colors: {
      primary: '#000000',
      secondary: '#6B7280',
      accent: '#3B82F6',
      background: '#FFFFFF',
      text: '#111827'
    },
    layout: 'list',
    features: ['Diseño ultra limpio', 'Espacios amplios', 'Tipografía moderna'],
    category: 'business'
  },
  'magazine': {
    id: 'magazine',
    name: 'magazine',
    displayName: 'Magazine Editorial',
    description: 'Estilo editorial de revista con layout sofisticado',
    isPremium: true,
    productsPerPage: 3,
    imageSize: { width: 450, height: 450 },
    colors: {
      primary: '#1F2937',
      secondary: '#6B7280',
      accent: '#DC2626',
      background: '#F9FAFB',
      text: '#111827'
    },
    layout: 'magazine',
    features: ['Layout editorial', 'Tipografía sofisticada', 'Diseño de revista'],
    category: 'creative'
  }
};

// Helper functions
export const getFreeTemplates = (): TemplateConfig[] => {
  return Object.values(TEMPLATE_CONFIGS).filter(template => !template.isPremium);
};

export const getPremiumTemplates = (): TemplateConfig[] => {
  return Object.values(TEMPLATE_CONFIGS).filter(template => template.isPremium);
};

export const getTemplatesByUserPlan = (userPlan: string = 'basic'): TemplateConfig[] => {
  if (userPlan === 'premium' || userPlan === 'pro') {
    return Object.values(TEMPLATE_CONFIGS);
  }
  return getFreeTemplates();
};

export const getTemplateById = (templateId: string): TemplateConfig | undefined => {
  return TEMPLATE_CONFIGS[templateId];
};

export const getTemplatesByCategory = (category: TemplateConfig['category']): TemplateConfig[] => {
  return Object.values(TEMPLATE_CONFIGS).filter(template => template.category === category);
};

export const getAllCategories = (): TemplateConfig['category'][] => {
  return ['business', 'creative', 'seasonal', 'lifestyle', 'luxury'];
};

// Template validation
export const isTemplateAccessible = (templateId: string, userPlan: string = 'basic'): boolean => {
  const template = getTemplateById(templateId);
  if (!template) return false;
  
  if (userPlan === 'premium' || userPlan === 'pro') {
    return true;
  }
  
  return !template.isPremium;
};

// Default template fallback
export const getDefaultTemplate = (): TemplateConfig => {
  return TEMPLATE_CONFIGS['minimalista-gris'];
};
