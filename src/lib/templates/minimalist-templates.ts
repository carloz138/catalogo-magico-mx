// src/lib/templates/minimalist-templates.ts
import { IndustryTemplate } from './industry-templates';

export const MINIMALIST_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'minimalist-white',
    name: 'Minimalista Blanco',
    displayName: 'Minimalista Blanco',
    description: 'Diseño ultra limpio con fondo blanco puro, ideal para productos de hogar, tecnología o moda',
    industry: 'decoracion',
    
    density: 'baja',
    productsPerPage: 6,
    gridColumns: 3,
    
    colors: {
      primary: '#2c3e50',
      secondary: '#34495e',
      accent: '#95a5a6',
      background: '#ffffff',
      cardBackground: '#ffffff',
      text: '#2c3e50'
    },
    
    design: {
      borderRadius: 8,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      category: false,
      description: false,
      sku: true,
      specifications: false,
      wholesalePrice: true,
      wholesaleMinQty: true
    },
    
    isPremium: false,
    
    imageSize: { width: 250, height: 250 }
  },
  
  {
    id: 'minimalist-warm',
    name: 'Minimalista Cálido',
    displayName: 'Minimalista Cálido',
    description: 'Diseño minimalista con tonos tierra y beige, perfecto para muebles, decoración y productos artesanales',
    industry: 'muebles',
    
    density: 'baja',
    productsPerPage: 6,
    gridColumns: 3,
    
    colors: {
      primary: '#8b7355',
      secondary: '#a0826d',
      accent: '#d4b5a0',
      background: '#faf8f6',
      cardBackground: '#f5f1ed',
      text: '#4a4033'
    },
    
    design: {
      borderRadius: 12,
      shadows: false,
      spacing: 'amplio'
    },
    
    showInfo: {
      category: false,
      description: false,
      sku: true,
      specifications: false,
      wholesalePrice: true,
      wholesaleMinQty: true
    },
    
    isPremium: false,
    
    imageSize: { width: 250, height: 250 }
  },
  
  {
    id: 'minimalist-nordic',
    name: 'Minimalista Nórdico',
    displayName: 'Minimalista Nórdico',
    description: 'Estilo escandinavo con tonos grises suaves y máxima simplicidad',
    industry: 'decoracion',
    
    density: 'baja',
    productsPerPage: 6,
    gridColumns: 3,
    
    colors: {
      primary: '#4a5568',
      secondary: '#718096',
      accent: '#cbd5e0',
      background: '#f7fafc',
      cardBackground: '#ffffff',
      text: '#2d3748'
    },
    
    design: {
      borderRadius: 4,
      shadows: true,
      spacing: 'amplio'
    },
    
    showInfo: {
      category: false,
      description: false,
      sku: true,
      specifications: false,
      wholesalePrice: true,
      wholesaleMinQty: true
    },
    
    isPremium: false,
    
    imageSize: { width: 250, height: 250 }
  }
];
