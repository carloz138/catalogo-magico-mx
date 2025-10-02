// src/components/templates/SmartTemplateSelector.tsx
// 🧠 SELECTOR SIMPLIFICADO - MUESTRA TODOS LOS TEMPLATES

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

// ✅ NUEVO SISTEMA DE TEMPLATES AUDITADOS
import { 
  AuditedTemplate,
  AuditedTemplateManager
} from '@/lib/templates/audited-templates-v2';

import { TemplateGallery } from './TemplatePreview';

// Tipos actualizados
type IndustryType = AuditedTemplate['industry'];

interface SmartTemplateSelectorProps {
  selectedTemplate?: string;
  onTemplateSelect: (templateId: string) => void;
  userPlan?: 'basic' | 'premium';
  userIndustry?: IndustryType;
  productCount?: number;
}

// Helper para convertir AuditedTemplate a formato compatible con TemplateGallery
const convertToIndustryTemplate = (auditedTemplate: AuditedTemplate): any => {
  return {
    id: auditedTemplate.id,
    name: auditedTemplate.displayName,
    displayName: auditedTemplate.displayName,  // ✅ AGREGAR displayName
    description: auditedTemplate.description || 'Template optimizado V2.0',
    industry: auditedTemplate.industry || 'general',
    density: auditedTemplate.density || 'media',
    isPremium: auditedTemplate.isPremium || false,
    planLevel: auditedTemplate.planLevel || 'free',
    colors: auditedTemplate.colors || {
      primary: '#007BFF',
      secondary: '#0056B3', 
      accent: '#CCE5FF',
      background: '#FFFFFF',
      text: '#2C3E50',
      cardBackground: '#F8F9FA'
    },
    productsPerPage: auditedTemplate.productsPerPage || 6,
    gridColumns: auditedTemplate.gridColumns || 3,
    tags: auditedTemplate.tags || [],
    qualityScore: auditedTemplate.qualityScore || 95,
    previewUrl: `/templates/${auditedTemplate.id}/preview.png`,
    category: auditedTemplate.category || 'modern',
    
    // Propiedades adicionales
    borderRadius: auditedTemplate.design?.borderRadius || 8,
    shadows: auditedTemplate.design?.shadows || true,
    spacing: auditedTemplate.design?.spacing || 'normal',
    typography: auditedTemplate.design?.typography || 'modern',
    
    showInfo: {
      category: auditedTemplate.showInfo?.category ?? true,
      description: auditedTemplate.showInfo?.description ?? true,
      sku: auditedTemplate.showInfo?.sku ?? false,
      specifications: auditedTemplate.showInfo?.specifications ?? false,
      wholesalePrice: auditedTemplate.showInfo?.wholesalePrice ?? true,
      wholesaleMinQty: auditedTemplate.showInfo?.wholesaleMinQty ?? true
    }
  };
};

export const SmartTemplateSelector: React.FC<SmartTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  userPlan = 'basic',
  userIndustry,
  productCount = 6
}) => {
  // Obtener todos los templates directamente
  const allTemplates = useMemo(() => {
    const baseTemplates = AuditedTemplateManager.getAllAuditedTemplates();
    
    // Convertir a formato compatible y ordenar por calidad
    return baseTemplates
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .map(convertToIndustryTemplate);
  }, []);

  return (
    <div className="smart-template-selector space-y-6">
      {/* Header simple */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            Templates Disponibles
          </h3>
          <p className="text-sm text-gray-600">
            Elige el diseño perfecto para tu catálogo de {productCount} productos
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{allTemplates.length} templates</span>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            V2.0 Optimizados
          </Badge>
        </div>
      </div>

      {/* Gallery de todos los templates */}
      <TemplateGallery
        templates={allTemplates}
        selectedTemplate={selectedTemplate}
        onTemplateSelect={onTemplateSelect}
      />
    </div>
  );
};

export default SmartTemplateSelector;