// src/lib/templates/dynamic-mapper.ts
// 🔄 MAPPER SIMPLE ENTRE TEMPLATES EXISTENTES Y FORMATO PDF

import { IndustryTemplate, INDUSTRY_TEMPLATES } from './industry-templates';

// Interfaz simplificada para PDF
interface SimpleDynamicTemplate {
  id: string;
  displayName: string;
  productsPerPage: number;
  layout: {
    columns: number;
    rows: number;
    spacing: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headerSize: string;
    productNameSize: string;
    priceSize: string;
  };
}

/**
 * 🎯 CONVERTIR TEMPLATE EXISTENTE A FORMATO PDF
 */
export const getDynamicTemplate = (templateId: string): SimpleDynamicTemplate | null => {
  const existingTemplate = INDUSTRY_TEMPLATES[templateId];
  if (!existingTemplate) {
    console.warn(`Template ${templateId} no encontrado`);
    return null;
  }
  
  return {
    id: existingTemplate.id,
    displayName: existingTemplate.displayName,
    productsPerPage: existingTemplate.productsPerPage,
    layout: {
      columns: existingTemplate.gridColumns,
      rows: Math.ceil(existingTemplate.productsPerPage / existingTemplate.gridColumns),
      spacing: existingTemplate.design.spacing
    },
    colors: {
      primary: existingTemplate.colors.primary,
      secondary: existingTemplate.colors.secondary,
      accent: existingTemplate.colors.accent,
      background: existingTemplate.colors.background,
      text: existingTemplate.colors.text
    },
    typography: {
      headerSize: existingTemplate.productsPerPage <= 3 ? '32px' : existingTemplate.productsPerPage <= 6 ? '28px' : '24px',
      productNameSize: existingTemplate.productsPerPage <= 3 ? '18px' : existingTemplate.productsPerPage <= 6 ? '16px' : '14px',
      priceSize: existingTemplate.productsPerPage <= 3 ? '20px' : existingTemplate.productsPerPage <= 6 ? '18px' : '16px'
    }
  };
};

/**
 * 📊 OBTENER TODOS LOS TEMPLATES DISPONIBLES
 */
export const getAllDynamicTemplates = (): SimpleDynamicTemplate[] => {
  return Object.values(INDUSTRY_TEMPLATES).map(template => getDynamicTemplate(template.id)!).filter(Boolean);
};

export default { getDynamicTemplate, getAllDynamicTemplates };