interface TemplateConfig {
  id: string;
  displayName: string;
  description: string;
  category: string;
  isPremium: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  productsPerPage: number;
  layout: 'grid' | 'list' | 'carousel';
}

export const getTemplateById = (id: string): TemplateConfig | null => {
  return getAllTemplates().find(t => t.id === id) || null;
};

export const getFreeTemplates = (): TemplateConfig[] => {
  return getAllTemplates().filter(t => !t.isPremium);
};

export const getPremiumTemplates = (): TemplateConfig[] => {
  return getAllTemplates().filter(t => t.isPremium);
};

const getAllTemplates = (): TemplateConfig[] => {
  return [
    // FREE TEMPLATES (5)
    {
      id: 'minimalista-gris',
      displayName: 'Minimalista Gris',
      description: 'Diseño limpio y profesional con tonos grises elegantes',
      category: 'Profesional',
      isPremium: false,
      colors: {
        primary: '#6B7280',
        secondary: '#F3F4F6',
        background: '#FFFFFF',
        text: '#111827'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'profesional-corporativo',
      displayName: 'Profesional Corporativo',
      description: 'Estilo corporativo con colores azules y estructura formal',
      category: 'Profesional',
      isPremium: false,
      colors: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        background: '#F8FAFC',
        text: '#1F2937'
      },
      productsPerPage: 3,
      layout: 'list'
    },
    {
      id: 'naturaleza-organico',
      displayName: 'Naturaleza Orgánico',
      description: 'Inspirado en la naturaleza con tonos verdes y diseño eco-friendly',
      category: 'Estilo de Vida',
      isPremium: false,
      colors: {
        primary: '#16A34A',
        secondary: '#22C55E',
        background: '#F0FDF4',
        text: '#14532D'
      },
      productsPerPage: 3,
      layout: 'grid'
    },
    {
      id: 'rustico-campestre',
      displayName: 'Rústico Campestre',
      description: 'Estilo rústico con elementos de madera y colores tierra',
      category: 'Estilo de Vida',
      isPremium: false,
      colors: {
        primary: '#92400E',
        secondary: '#D97706',
        background: '#FEF3C7',
        text: '#451A03'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'verano-tropical',
      displayName: 'Verano Tropical',
      description: 'Colores vibrantes y frescos perfectos para productos de verano',
      category: 'Temporal',
      isPremium: false,
      colors: {
        primary: '#0891B2',
        secondary: '#06B6D4',
        background: '#CFFAFE',
        text: '#164E63'
      },
      productsPerPage: 4,
      layout: 'grid'
    },

    // PREMIUM TEMPLATES (25)
    {
      id: 'fiesta-mexicana',
      displayName: 'Fiesta Mexicana',
      description: 'Colores vibrantes inspirados en la cultura mexicana',
      category: 'Temporal',
      isPremium: true,
      colors: {
        primary: '#DC2626',
        secondary: '#16A34A',
        background: '#FEF3C7',
        text: '#7C2D12'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'halloween',
      displayName: 'Halloween',
      description: 'Diseño temático de Halloween con colores naranjas y negros',
      category: 'Temporal',
      isPremium: true,
      colors: {
        primary: '#EA580C',
        secondary: '#000000',
        background: '#1F2937',
        text: '#F97316'
      },
      productsPerPage: 3,
      layout: 'grid'
    },
    {
      id: 'elegante-oro',
      displayName: 'Elegante Oro',
      description: 'Lujo y elegancia con detalles dorados y tipografía refinada',
      category: 'Lujo',
      isPremium: true,
      colors: {
        primary: '#D97706',
        secondary: '#FCD34D',
        background: '#FFFBEB',
        text: '#451A03'
      },
      productsPerPage: 2,
      layout: 'list'
    },
    {
      id: 'tecnologico-futurista',
      displayName: 'Tecnológico Futurista',
      description: 'Diseño moderno con elementos tech y colores neón',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#3B82F6',
        secondary: '#06B6D4',
        background: '#0F172A',
        text: '#E2E8F0'
      },
      productsPerPage: 3,
      layout: 'grid'
    },
    {
      id: 'dia-muertos',
      displayName: 'Día de Muertos',
      description: 'Inspirado en la tradición mexicana del Día de Muertos',
      category: 'Temporal',
      isPremium: true,
      colors: {
        primary: '#7C3AED',
        secondary: '#EC4899',
        background: '#1F2937',
        text: '#F3F4F6'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'industrial',
      displayName: 'Industrial',
      description: 'Estilo industrial con elementos metálicos y colores neutros',
      category: 'Profesional',
      isPremium: true,
      colors: {
        primary: '#4B5563',
        secondary: '#6B7280',
        background: '#F9FAFB',
        text: '#111827'
      },
      productsPerPage: 3,
      layout: 'list'
    },
    {
      id: 'otono-acogedor',
      displayName: 'Otoño Acogedor',
      description: 'Colores cálidos de otoño que transmiten comodidad',
      category: 'Temporal',
      isPremium: true,
      colors: {
        primary: '#DC2626',
        secondary: '#F59E0B',
        background: '#FEF3C7',
        text: '#451A03'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'playero-relajado',
      displayName: 'Playero Relajado',
      description: 'Inspirado en la playa con colores azules y arena',
      category: 'Estilo de Vida',
      isPremium: true,
      colors: {
        primary: '#0891B2',
        secondary: '#06B6D4',
        background: '#E0F7FA',
        text: '#0F4C75'
      },
      productsPerPage: 3,
      layout: 'carousel'
    },
    {
      id: 'lujo-purpura',
      displayName: 'Lujo Púrpura',
      description: 'Elegancia real con tonos púrpuras y dorados',
      category: 'Lujo',
      isPremium: true,
      colors: {
        primary: '#7C3AED',
        secondary: '#A855F7',
        background: '#FAF5FF',
        text: '#581C87'
      },
      productsPerPage: 2,
      layout: 'list'
    },
    {
      id: 'boda-elegante',
      displayName: 'Boda Elegante',
      description: 'Perfecto para productos de boda con tonos rosados y dorados',
      category: 'Estilo de Vida',
      isPremium: true,
      colors: {
        primary: '#EC4899',
        secondary: '#F9A8D4',
        background: '#FDF2F8',
        text: '#9D174D'
      },
      productsPerPage: 3,
      layout: 'grid'
    },
    {
      id: 'deportivo-energetico',
      displayName: 'Deportivo Energético',
      description: 'Dinámico y energético para productos deportivos',
      category: 'Estilo de Vida',
      isPremium: true,
      colors: {
        primary: '#EF4444',
        secondary: '#F97316',
        background: '#FEF2F2',
        text: '#7F1D1D'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'infantil-colorido',
      displayName: 'Infantil Colorido',
      description: 'Alegre y colorido perfecto para productos infantiles',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#EC4899',
        secondary: '#3B82F6',
        background: '#FEF3C7',
        text: '#1F2937'
      },
      productsPerPage: 6,
      layout: 'grid'
    },
    {
      id: 'gourmet-delicado',
      displayName: 'Gourmet Delicado',
      description: 'Sofisticado y delicado para productos gastronómicos',
      category: 'Lujo',
      isPremium: true,
      colors: {
        primary: '#92400E',
        secondary: '#D97706',
        background: '#FFFBEB',
        text: '#451A03'
      },
      productsPerPage: 2,
      layout: 'list'
    },
    {
      id: 'noche-estrellada',
      displayName: 'Noche Estrellada',
      description: 'Misterioso y elegante inspirado en la noche',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#1E1B4B',
        secondary: '#3730A3',
        background: '#0F172A',
        text: '#E2E8F0'
      },
      productsPerPage: 3,
      layout: 'carousel'
    },
    {
      id: 'artesanal-bohemio',
      displayName: 'Artesanal Bohemio',
      description: 'Estilo bohemio con elementos artesanales y naturales',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#92400E',
        secondary: '#DC2626',
        background: '#FEF3C7',
        text: '#451A03'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'lujo-negro-oro',
      displayName: 'Lujo Negro Oro',
      description: 'Máximo lujo con combinación negro y oro',
      category: 'Lujo',
      isPremium: true,
      colors: {
        primary: '#000000',
        secondary: '#1F2937',
        background: '#111827',
        text: '#F9FAFB'
      },
      productsPerPage: 2,
      layout: 'list'
    },
    {
      id: 'primavera-floral',
      displayName: 'Primavera Floral',
      description: 'Fresco y floral inspirado en la primavera',
      category: 'Temporal',
      isPremium: true,
      colors: {
        primary: '#EC4899',
        secondary: '#16A34A',
        background: '#FDF2F8',
        text: '#0F5132'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'cafeteria-acogedora',
      displayName: 'Cafetería Acogedora',
      description: 'Cálido y acogedor perfecto para cafeterías y restaurantes',
      category: 'Estilo de Vida',
      isPremium: true,
      colors: {
        primary: '#92400E',
        secondary: '#D97706',
        background: '#FEF3C7',
        text: '#451A03'
      },
      productsPerPage: 3,
      layout: 'list'
    },
    {
      id: 'fitness-vibrante',
      displayName: 'Fitness Vibrante',
      description: 'Energético y motivacional para productos de fitness',
      category: 'Estilo de Vida',
      isPremium: true,
      colors: {
        primary: '#10B981',
        secondary: '#3B82F6',
        background: '#F0FDF4',
        text: '#064E3B'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'viajes-aventureros',
      displayName: 'Viajes Aventureros',
      description: 'Inspirado en aventuras y viajes alrededor del mundo',
      category: 'Estilo de Vida',
      isPremium: true,
      colors: {
        primary: '#0891B2',
        secondary: '#16A34A',
        background: '#ECFCCB',
        text: '#14532D'
      },
      productsPerPage: 3,
      layout: 'carousel'
    },
    {
      id: 'musica-festiva',
      displayName: 'Música Festiva',
      description: 'Vibrante y festivo perfecto para eventos musicales',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#7C3AED',
        secondary: '#EC4899',
        background: '#1F2937',
        text: '#F9FAFB'
      },
      productsPerPage: 4,
      layout: 'grid'
    },
    {
      id: 'galactico-espacial',
      displayName: 'Galáctico Espacial',
      description: 'Futurista y cósmico inspirado en el espacio exterior',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#1E1B4B',
        secondary: '#7C3AED',
        background: '#0F172A',
        text: '#E2E8F0'
      },
      productsPerPage: 3,
      layout: 'grid'
    },
    {
      id: 'romantico-vintage',
      displayName: 'Romántico Vintage',
      description: 'Nostálgico y romántico con estilo vintage',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#DC2626',
        secondary: '#EC4899',
        background: '#FDF2F8',
        text: '#7F1D1D'
      },
      productsPerPage: 3,
      layout: 'list'
    },
    {
      id: 'minimalista-blanco',
      displayName: 'Minimalista Blanco',
      description: 'Ultra limpio y minimalista con predominio del blanco',
      category: 'Profesional',
      isPremium: true,
      colors: {
        primary: '#000000',
        secondary: '#6B7280',
        background: '#FFFFFF',
        text: '#111827'
      },
      productsPerPage: 2,
      layout: 'list'
    },
    {
      id: 'magazine',
      displayName: 'Magazine Editorial',
      description: 'Estilo editorial de revista con layout sofisticado',
      category: 'Creativo',
      isPremium: true,
      colors: {
        primary: '#1F2937',
        secondary: '#6B7280',
        background: '#F9FAFB',
        text: '#111827'
      },
      productsPerPage: 3,
      layout: 'carousel'
    }
  ];
};
