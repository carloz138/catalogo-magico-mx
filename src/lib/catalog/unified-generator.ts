// src/lib/catalog/unified-generator.ts
// 🚀 GENERADOR UNIFICADO ACTUALIZADO - INTEGRA TODOS LOS ARREGLOS SIN CORTES

import { supabase } from '@/integrations/supabase/client';
import { IndustryTemplate, getTemplateById } from '@/lib/templates/industry-templates';
import { AuditedTemplate, AuditedTemplateManager } from '@/lib/templates/audited-templates-v2';
import { TemplateGenerator } from '@/lib/templates/css-generator';
import { PuppeteerServiceClient } from '@/lib/pdf/puppeteer-service-client';
import { generateBrowserCompatiblePDF } from '@/lib/pdf/browser-pdf-generator';
import { TemplateAuditSystem } from '@/lib/templates/template-audit-system';

  interface Product {
    id: string;
    name: string;
    description?: string;
    price_retail: number;
    price_wholesale?: number;  // NUEVO: Precio de mayoreo
    wholesale_min_qty?: number;  // NUEVO: Cantidad mínima para mayoreo
    image_url: string;
    sku?: string;
    category?: string;
    specifications?: string;
  }

interface BusinessInfo {
  business_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
}

interface GenerationResult {
  success: boolean;
  catalogId?: string;
  htmlContent?: string;
  error?: string;
  message?: string;
  generationMethod?: 'puppeteer' | 'dynamic' | 'classic' | 'hybrid';
  stats?: {
    totalProducts: number;
    totalPages: number;
    generationTime: number;
    templateQuality: number;
    issues?: string[];
  };
  warnings?: string[];
}

interface UsageLimits {
  canGenerate: boolean;
  catalogsUsed: number;
  catalogsLimit: number | 'unlimited';
  remainingCatalogs: number;
  message: string;
}

interface GenerationOptions {
  useDynamicEngine?: boolean;
  usePuppeteerService?: boolean;
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
  forceClassicMode?: boolean;
  qualityCheck?: boolean; // Nueva opción para verificar calidad del template
  autoFix?: boolean; // Nueva opción para auto-corregir templates
  skipAudit?: boolean; // Opción para saltar auditoría si ya fue auditado
  catalogTitle?: string; // Título personalizado del catálogo
}

export class UnifiedCatalogGenerator {
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL MEJORADA CON AUDITORÍA DE CALIDAD
   */
  static async generateCatalog(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    userId: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    
    const startTime = Date.now();
    const warnings: string[] = [];
    
    try {
      console.log('🚀 Iniciando generación con sistema mejorado:', { 
        templateId, 
        productCount: products.length,
        qualityCheck: options.qualityCheck !== false,
        autoFix: options.autoFix !== false
      });
      
      if (options.onProgress) options.onProgress(5);
      
      // 1. VALIDACIONES PREVIAS
      const limitsCheck = await this.checkCatalogLimits(userId);
      if (!limitsCheck.canGenerate) {
        return {
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: limitsCheck.message
        };
      }
      
      if (options.onProgress) options.onProgress(10);
      
      // 2. OBTENER Y AUDITAR TEMPLATE
      // 2. OBTENER Y AUDITAR TEMPLATE (NUEVO SISTEMA V2.0)
let auditedTemplate = AuditedTemplateManager.getAuditedTemplateById(templateId);
let template: IndustryTemplate;

if (auditedTemplate) {
  // Convertir AuditedTemplate a IndustryTemplate para compatibilidad
  template = this.convertAuditedToIndustryTemplate(auditedTemplate);
  console.log(`✅ Template encontrado en sistema V2.0: ${template.displayName}`);
} else {
  // Fallback al sistema viejo
  template = getTemplateById(templateId);
  if (!template) {
    return {
      success: false,
      error: 'TEMPLATE_NOT_FOUND',
      message: `Template ${templateId} no encontrado en ningún sistema`
    };
  }
  console.log(`⚠️ Template encontrado en sistema legacy: ${template.displayName}`);
}
      
      // 3. AUDITORÍA DE CALIDAD DEL TEMPLATE (NUEVA)
      let templateQuality = 100;
      if (options.qualityCheck !== false && !options.skipAudit) {
        console.log('🔍 Auditando calidad del template...');
        const auditResult = await TemplateAuditSystem.auditSingleTemplate(template);
        templateQuality = auditResult.qualityScore;
        
        if (auditResult.status === 'broken') {
          return {
            success: false,
            error: 'TEMPLATE_BROKEN',
            message: `Template ${templateId} tiene errores críticos y debe ser corregido`,
            stats: { totalProducts: 0, totalPages: 0, generationTime: 0, templateQuality }
          };
        }
        
        // Auto-corrección si está habilitada
        if (options.autoFix !== false && auditResult.status === 'needs_fix') {
          console.log('🔧 Auto-corrigiendo template...');
          const fixedTemplates = TemplateAuditSystem.generateFixedTemplates([auditResult]);
          if (fixedTemplates.length > 0) {
            template = fixedTemplates[0];
            warnings.push(`Template auto-corregido para mejor calidad (${auditResult.issues.length} issues resueltos)`);
          }
        }
        
        // Agregar warnings por issues del template
        if (auditResult.issues.length > 0) {
          const criticalIssues = auditResult.issues.filter(i => i.severity === 'critical').length;
          const highIssues = auditResult.issues.filter(i => i.severity === 'high').length;
          
          if (criticalIssues > 0) {
            warnings.push(`Template tiene ${criticalIssues} problema(s) crítico(s)`);
          }
          if (highIssues > 0) {
            warnings.push(`Template tiene ${highIssues} problema(s) de alta prioridad`);
          }
        }
      }
      
      if (options.onProgress) options.onProgress(20);
      
      // 4. VALIDAR ACCESO PREMIUM
      if (template.isPremium) {
        const hasAccess = await this.validatePremiumAccess(userId);
        if (!hasAccess) {
          return {
            success: false,
            error: 'PREMIUM_REQUIRED',
            message: 'Este template requiere plan Premium'
          };
        }
      }
      
      if (options.onProgress) options.onProgress(25);
      
      // 5. VALIDACIÓN INTELIGENTE DE PRODUCTOS
      const productValidation = this.validateProductsForTemplate(products, template);
      if (!productValidation.isValid) {
        warnings.push(...productValidation.warnings);
        
        if (productValidation.isCritical) {
          return {
            success: false,
            error: 'INVALID_PRODUCT_DATA',
            message: productValidation.message
          };
        }
      }
      
      // 6. DECIDIR MÉTODO DE GENERACIÓN INTELIGENTE
      const generationMethod = this.selectOptimalGenerationMethod(
        products.length, 
        template, 
        templateQuality, 
        options
      );
      
      console.log(`📋 Método seleccionado: ${generationMethod} (calidad template: ${templateQuality}/100)`);
      
      if (options.onProgress) options.onProgress(30);
      
      let htmlContent = '';
      let pdfGenerationSuccess = false;
      let finalMethod = generationMethod;
      let generationStats: any = {};
      
      // 7. GENERAR CONTENIDO SEGÚN MÉTODO CON FALLBACKS MEJORADOS
      try {
        if (generationMethod === 'puppeteer') {
          const result = await this.generateWithPuppeteerService(
            products, 
            businessInfo, 
            template, 
            options
          );
          
          if (result.success) {
            pdfGenerationSuccess = true;
            finalMethod = 'puppeteer';
            generationStats = result.stats || {};
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
          } else {
            console.warn('⚠️ Puppeteer falló, usando fallback dinámico');
            warnings.push('Servicio Puppeteer no disponible, usando método alternativo');
            const fallbackResult = await this.generateWithDynamicEngine(
              products, 
              businessInfo, 
              templateId, 
              options
            );
            pdfGenerationSuccess = fallbackResult.success;
            finalMethod = 'dynamic';
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
          }
          
        } else if (generationMethod === 'dynamic') {
          const result = await this.generateWithDynamicEngine(
            products, 
            businessInfo, 
            templateId, 
            options
          );
          
          if (result.success) {
            pdfGenerationSuccess = true;
            finalMethod = 'dynamic';
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
          } else {
            console.warn('⚠️ Dynamic engine falló, usando fallback clásico');
            warnings.push('Motor dinámico no disponible, usando método clásico');
            const fallbackResult = await this.generateWithClassicEngine(products, businessInfo, template, userId, options);
            return { 
              ...fallbackResult, 
              generationMethod: 'classic',
              warnings: [...warnings, ...(fallbackResult.warnings || [])]
            };
          }
          
        } else {
          // Método clásico directo
          const result = await this.generateWithClassicEngine(products, businessInfo, template, userId, options);
          return { 
            ...result, 
            generationMethod: 'classic',
            warnings: [...warnings, ...(result.warnings || [])]
          };
        }
        
      } catch (generationError) {
        console.error('❌ Error en generación primaria:', generationError);
        
        // Fallback final a método clásico
        console.log('🔄 Usando fallback final (clásico)...');
        warnings.push('Error en método primario, usando fallback clásico');
        
        const fallbackResult = await this.generateWithClassicEngine(products, businessInfo, template, userId, options);
        return { 
          ...fallbackResult, 
          generationMethod: 'classic',
          warnings: [...warnings, ...(fallbackResult.warnings || [])]
        };
      }
      
      if (options.onProgress) options.onProgress(70);
      
      // 8. GUARDAR EN BASE DE DATOS CON METADATA MEJORADA
      const catalogRecord = await this.saveCatalogRecord(
        userId,
        templateId,
        products,
        businessInfo,
        template,
        options.catalogTitle || `Catálogo ${template.displayName} - ${new Date().toLocaleDateString('es-MX')}`,
        { 
          generationMethod: finalMethod, 
          pdfSuccess: pdfGenerationSuccess,
          templateQuality,
          issues: warnings,
          ...generationStats
        }
      );
      
      if (!catalogRecord.success) {
        return {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Error guardando catálogo en base de datos'
        };
      }
      
      // 9. ACTUALIZAR CONTADOR DE USO
      await this.updateCatalogUsage(userId);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      
      console.log('✅ Catálogo generado exitosamente:', {
        catalogId: catalogRecord.catalogId,
        method: finalMethod,
        time: generationTime,
        quality: templateQuality,
        warnings: warnings.length
      });
      
      return {
        success: true,
        catalogId: catalogRecord.catalogId,
        htmlContent,
        generationMethod: finalMethod,
        message: `Catálogo ${template.displayName} generado exitosamente`,
        warnings: warnings.length > 0 ? warnings : undefined,
        stats: {
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / template.productsPerPage),
          generationTime,
          templateQuality,
          issues: warnings.length > 0 ? warnings : undefined
        }
      };
      
    } catch (error) {
      console.error('❌ Error crítico generando catálogo:', error);
      return {
        success: false,
        error: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido',
        warnings
      };
    }
  }

 /**
 * 🔄 CONVERTIR AUDITED TEMPLATE A INDUSTRY TEMPLATE PARA COMPATIBILIDAD
 */
private static convertAuditedToIndustryTemplate(auditedTemplate: AuditedTemplate): IndustryTemplate {
  // Crear objeto base con todas las propiedades requeridas
  const converted = {
    id: auditedTemplate.id,
    name: auditedTemplate.displayName,
    displayName: auditedTemplate.displayName,
    description: auditedTemplate.description,
    industry: auditedTemplate.industry,
    density: auditedTemplate.density,
    productsPerPage: auditedTemplate.productsPerPage,
    gridColumns: auditedTemplate.gridColumns,
    colors: auditedTemplate.colors,
    design: auditedTemplate.design,
    showInfo: {
  category: auditedTemplate.showInfo?.category ?? true,
  description: auditedTemplate.showInfo?.description ?? true,
  sku: auditedTemplate.showInfo?.sku ?? false,
  specifications: auditedTemplate.showInfo?.specifications ?? false,
  wholesalePrice: auditedTemplate.showInfo?.wholesalePrice ?? true,      // ✅ NUEVO: Default true
  wholesaleMinQty: auditedTemplate.showInfo?.wholesaleMinQty ?? true     // ✅ NUEVO: Default true
},
    isPremium: auditedTemplate.isPremium,
    planLevel: auditedTemplate.planLevel,
    tags: auditedTemplate.tags,
    
    // Propiedades específicas de IndustryTemplate con valores por defecto
    imageSize: { width: 200, height: 200 }, // Objeto correcto en lugar de string
    category: auditedTemplate.category,
    borderRadius: auditedTemplate.design?.borderRadius || 8,
    shadows: auditedTemplate.design?.shadows || true,
    spacing: auditedTemplate.design?.spacing || 'normal',
    typography: auditedTemplate.design?.typography || 'modern'
  };
  
  // Forzar conversión de tipo para compatibilidad
  return converted as unknown as IndustryTemplate;
}
  /**
   * 🧠 SELECCIÓN INTELIGENTE DE MÉTODO DE GENERACIÓN
   */
  private static selectOptimalGenerationMethod(
    productCount: number, 
    template: IndustryTemplate,
    templateQuality: number,
    options: GenerationOptions
  ): 'puppeteer' | 'dynamic' | 'classic' {
    
    // Forzar modo clásico si se especifica
    if (options.forceClassicMode) {
      return 'classic';
    }
    
    // Si la calidad del template es muy baja, usar clásico (más robusto)
    if (templateQuality < 60) {
      console.log('⚠️ Calidad baja del template, usando método clásico para mayor estabilidad');
      return 'classic';
    }
    
    // Usar Puppeteer por defecto si está disponible (mejor calidad)
    if (options.usePuppeteerService !== false) {
      // Para templates con alta complejidad, Puppeteer es mejor
      if (template.design?.shadows || (template.design?.borderRadius || 8) > 10) {
        return 'puppeteer';
      }
      
      // Para volúmenes grandes, Puppeteer maneja mejor el memory
      if (productCount > 100) {
        return 'puppeteer';
      }
      
      // Para templates premium, usar la mejor calidad
      if (template.isPremium) {
        return 'puppeteer';
      }
      
      return 'puppeteer';
    }
    
    // Usar dinámico como segunda opción
    if (options.useDynamicEngine !== false) {
      // Dinámico es bueno para volúmenes medianos
      if (productCount >= 10 && productCount <= 200) {
        return 'dynamic';
      }
      
      // Para templates simples, dinámico funciona bien
      if (!template.design?.shadows && (template.design?.borderRadius || 8) <= 10) {
        return 'dynamic';
      }
      
      return 'dynamic';
    }
    
    return 'classic'; // Fallback final
  }
  
  /**
   * ✅ VALIDACIÓN INTELIGENTE DE PRODUCTOS
   */
  private static validateProductsForTemplate(products: Product[], template: IndustryTemplate): {
    isValid: boolean;
    isCritical: boolean;
    warnings: string[];
    message?: string;
  } {
    const warnings: string[] = [];
    let isValid = true;
    let isCritical = false;
    
    // Validar cantidad mínima
    if (products.length === 0) {
      return {
        isValid: false,
        isCritical: true,
        warnings: [],
        message: 'No hay productos para generar catálogo'
      };
    }
    
    // Validar imágenes faltantes
    const productsWithoutImages = products.filter(p => !p.image_url || p.image_url.trim() === '').length;
    const imagePercentage = ((products.length - productsWithoutImages) / products.length) * 100;
    
    if (imagePercentage < 30) {
      warnings.push(`Solo ${imagePercentage.toFixed(1)}% de productos tienen imágenes. Considera agregar más imágenes para mejor presentación.`);
    }
    
    // Validar nombres muy largos
    const longNames = products.filter(p => p.name && p.name.length > 50).length;
    if (longNames > products.length * 0.2) {
      warnings.push(`${longNames} productos tienen nombres muy largos que podrían cortarse en el PDF.`);
    }
    
    // Validar precios
    const productsWithoutPrice = products.filter(p => !p.price_retail || p.price_retail <= 0).length;
    if (productsWithoutPrice > 0) {
      warnings.push(`${productsWithoutPrice} productos sin precio válido.`);
    }
    
    // Validar densidad vs cantidad
    if (template.density === 'alta' && products.length < 10) {
      warnings.push('Template de alta densidad con pocos productos puede verse espacioso. Considera usar densidad media o baja.');
    }
    
    if (template.density === 'baja' && products.length > 100) {
      warnings.push('Template de baja densidad con muchos productos generará muchas páginas. Considera usar densidad alta.');
    }
    
    // Validar compatibilidad con productos por página
    if (products.length < template.productsPerPage) {
      warnings.push(`Solo tienes ${products.length} productos pero el template muestra ${template.productsPerPage} por página. El diseño podría verse incompleto.`);
    }
    
    return {
      isValid,
      isCritical,
      warnings
    };
  }
  
// En tu archivo unified-generator.ts existente, busca y REEMPLAZA esta función:

/**
 // CORRECCIONES PARA unified-generator.ts
// Solo necesitas reemplazar el método generateWithPuppeteerService (línea ~340 aprox)

/**
 * 🚀 GENERACIÓN CON PUPPETEER SERVICE MEJORADA - CORREGIDA
 */
private static async generateWithPuppeteerService(
  products: Product[],
  businessInfo: BusinessInfo,
  template: IndustryTemplate,
  options: GenerationOptions
): Promise<{ success: boolean; error?: string; stats?: any }> {
  
  try {
    console.log('🚀 Generando con Puppeteer Service (mejorado)...');
    
    // Convertir template a formato Puppeteer
    const templateConfig = {
      id: template.id,
      displayName: template.displayName,
      productsPerPage: template.productsPerPage,
      colors: {
        primary: template.colors.primary,
        secondary: template.colors.secondary || template.colors.primary,
        accent: template.colors.accent || template.colors.primary,
        background: template.colors.background || '#ffffff',
        text: template.colors.text || '#2c3e50'
      },
      layout: template.design?.spacing || 'normal',
      features: template.showInfo ? 
        Object.keys(template.showInfo).filter(key => 
          template.showInfo[key as keyof typeof template.showInfo]
        ) : [],
      category: template.industry || 'general'
    };
    
    // 📏 MÁRGENES CORREGIDOS PARA MEJOR COMPATIBILIDAD
    const puppeteerOptions = {
      onProgress: options.onProgress,
      format: 'A4' as const,
      margin: {
        top: '12mm',    // CORREGIDO: de 15mm a 12mm
        right: '12mm',  // CORREGIDO: de 15mm a 12mm  
        bottom: '12mm', // CORREGIDO: de 25mm a 12mm - CRÍTICO PARA EVITAR SUPERPOSICIÓN
        left: '12mm'    // CORREGIDO: de 15mm a 12mm
      },
      quality: template.isPremium ? 'high' as const : 'medium' as const
    };
    
    const result = await PuppeteerServiceClient.generatePDF(
      products,
      businessInfo,
      templateConfig,
      puppeteerOptions,
      options.catalogTitle
    );
    
    if (result.success) {
      console.log('✅ Puppeteer Service completado exitosamente');
      return { 
        success: true, 
        stats: result.stats
      };
    } else {
      console.error('❌ Error en Puppeteer Service:', result.error);
      return { 
        success: false, 
        error: result.error 
      };
    }
    
  } catch (error) {
    console.error('❌ Excepción en Puppeteer Service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en Puppeteer'
    };
  }
}
  
  /**
   * 🚀 GENERACIÓN CON DYNAMIC ENGINE (MEJORADA)
   */
  private static async generateWithDynamicEngine(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    options: GenerationOptions
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      console.log('🚀 Generando con Dynamic Engine (mejorado)...');
      
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} no encontrado`);
      }
      
      // Configuración optimizada para dynamic engine
      const dynamicTemplate = {
        id: template.id,
        displayName: template.displayName,
        productsPerPage: template.productsPerPage,
        layout: {
          columns: template.gridColumns,
          rows: Math.ceil(template.productsPerPage / template.gridColumns),
          spacing: template.design.spacing || 'normal'
        },
        colors: {
          primary: template.colors.primary,
          secondary: template.colors.secondary || template.colors.primary,
          accent: template.colors.accent || template.colors.primary,
          background: template.colors.background || '#ffffff',
          text: template.colors.text || '#2c3e50'
        },
        typography: {
          headerSize: this.calculateFontSize('header', template.density),
          productNameSize: this.calculateFontSize('productName', template.density),
          priceSize: this.calculateFontSize('price', template.density)
        },
        quality: template.isPremium ? 'high' : 'medium'
      };
      
      const result = await generateBrowserCompatiblePDF(
        products,
        businessInfo,
        dynamicTemplate,
        {
          showProgress: options.showProgress,
          onProgress: options.onProgress,
          quality: dynamicTemplate.quality as "low" | "medium" | "high"
        }
      );
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en dynamic engine:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en dynamic engine'
      };
    }
  }
  
  /**
   * 🎨 GENERACIÓN CON CLASSIC ENGINE (MEJORADA)
   */
  private static async generateWithClassicEngine(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    userId: string,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    
    try {
      console.log('🎨 Generando con Classic Engine (mejorado)...');
      
      if (options.onProgress) options.onProgress(40);
      
      // Generar HTML con nuevo sistema robusto
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        products,
        businessInfo,
        template
      );
      
      if (options.onProgress) options.onProgress(60);
      
      // Guardar en BD
      const catalogRecord = await this.saveCatalogRecord(
        userId, 
        template.id, 
        products, 
        businessInfo, 
        template,
        options.catalogTitle || `Catálogo ${template.displayName} - ${new Date().toLocaleDateString('es-MX')}`, // Usar el título personalizado
        { generationMethod: 'classic', pdfSuccess: false, templateQuality: 80 }
      );
      
      if (!catalogRecord.success) {
        throw new Error('Error guardando catálogo en base de datos');
      }
      
      // Generar PDF con mejor compatibilidad
      if (typeof window !== 'undefined') {
        await this.downloadCatalogAsHTMLWithStyles(htmlContent, businessInfo.business_name);
      }
      
      // Actualizar uso
      await this.updateCatalogUsage(userId);
      
      if (options.onProgress) options.onProgress(100);
      
      return {
        success: true,
        catalogId: catalogRecord.catalogId,
        htmlContent,
        generationMethod: 'classic',
        message: `Catálogo ${template.displayName} generado con engine clásico mejorado`,
        warnings: ['Usando método clásico para máxima compatibilidad']
      };
      
    } catch (error) {
      console.error('❌ Error en classic engine:', error);
      return {
        success: false,
        error: 'CLASSIC_ENGINE_ERROR',
        message: error instanceof Error ? error.message : 'Error en engine clásico'
      };
    }
  }
  
  /**
   * 💾 GUARDAR REGISTRO CON METADATA MEJORADA
   */
  private static async saveCatalogRecord(
    userId: string,
    templateId: string,
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    catalogTitle: string,
    metadata: {
      generationMethod: 'puppeteer' | 'dynamic' | 'classic';
      pdfSuccess: boolean;
      templateQuality: number;
      issues?: string[];
      [key: string]: any;
    }
  ): Promise<{ success: boolean; catalogId?: string }> {
    
    try {
      const catalogData = {
        user_id: userId,
        name: catalogTitle || `Catálogo ${template.displayName} - ${new Date().toLocaleDateString('es-MX')}`,
        product_ids: products.map(p => p.id),
        template_style: templateId,
        brand_colors: {
          primary: template.colors.primary,
          secondary: template.colors.secondary,
          accent: template.colors.accent
        },
        show_retail_prices: true,
        show_wholesale_prices: false,
        total_products: products.length,
        credits_used: 0,
        currency: 'MXN',
        // METADATA MEJORADA
        generation_metadata: {
          engine: metadata.generationMethod,
          pdf_success: metadata.pdfSuccess,
          template_density: template.density,
          products_per_page: template.productsPerPage,
          template_quality_score: metadata.templateQuality,
          generated_at: new Date().toISOString(),
          puppeteer_service_used: metadata.generationMethod === 'puppeteer',
          issues_detected: metadata.issues || [],
          template_version: '2.0', // Nueva versión con arreglos
          generation_warnings: metadata.issues?.length || 0,
          estimated_pages: Math.ceil(products.length / template.productsPerPage),
          ...metadata // Incluir cualquier metadata adicional
        }
      };
      
      const { data, error } = await supabase
        .from('catalogs')
        .insert(catalogData)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error saving catalog record:', error);
        return { success: false };
      }
      
      return { 
        success: true, 
        catalogId: data.id 
      };
      
    } catch (error) {
      console.error('Error in saveCatalogRecord:', error);
      return { success: false };
    }
  }
  
  /**
   * 📄 DESCARGA MEJORADA PARA CLASSIC ENGINE
   */
  private static async downloadCatalogAsHTMLWithStyles(
    htmlContent: string, 
    businessName: string
  ): Promise<void> {
    try {
      console.log('📄 Descargando catálogo como HTML mejorado...');
      
      // Agregar meta tags para mejor visualización
      const enhancedHTML = htmlContent.replace(
        '<head>',
        `<head>
          <meta name="viewport" content="width=210mm, initial-scale=1.0">
          <meta name="description" content="Catálogo generado con CatalogoIA">
          <meta name="generator" content="CatalogoIA v2.0">`
      );
      
      const blob = new Blob([enhancedHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const filename = `catalogo-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Catálogo HTML descargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en descarga HTML:', error);
      throw new Error('Error descargando catálogo HTML');
    }
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  private static calculateFontSize(element: string, density: string): string {
    const sizes = {
      alta: { header: '20px', productName: '14px', price: '16px' },
      media: { header: '24px', productName: '16px', price: '18px' },
      baja: { header: '28px', productName: '18px', price: '20px' }
    };
    
    return sizes[density as keyof typeof sizes]?.[element as keyof (typeof sizes)['alta']] || 
           sizes.media[element as keyof (typeof sizes)['media']];
  }
  
  // ===== MÉTODOS EXISTENTES (SIN CAMBIOS) =====
  
  static async checkCatalogLimits(userId: string): Promise<UsageLimits> {
    try {
      const currentMonth = parseInt(
        new Date().getFullYear().toString() + 
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      );
      
      const { data: subscription, error: subError } = await (supabase as any)
        .from('subscriptions')
        .select(`
          package_id,
          status,
          credit_packages (
            max_catalogs,
            name
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();
      
      if (subError || !subscription) {
        return {
          canGenerate: false,
          catalogsUsed: 0,
          catalogsLimit: 0,
          remainingCatalogs: 0,
          message: 'No tienes una suscripción activa. Necesitas un plan para generar catálogos.'
        };
      }
      
      const catalogsLimit = subscription.credit_packages?.max_catalogs;
      const isUnlimited = catalogsLimit === null || catalogsLimit === 0;
      
      const { data: catalogUsage } = await (supabase as any)
        .from('catalog_usage')
        .select('catalogs_generated')
        .eq('user_id', userId)
        .eq('usage_month', currentMonth)
        .maybeSingle();
      
      const catalogsUsed = catalogUsage?.catalogs_generated || 0;
      
      if (isUnlimited) {
        return {
          canGenerate: true,
          catalogsUsed,
          catalogsLimit: 'unlimited',
          remainingCatalogs: 999,
          message: 'Catálogos ilimitados disponibles'
        };
      }
      
      const remainingCatalogs = Math.max(0, catalogsLimit - catalogsUsed);
      const canGenerate = remainingCatalogs > 0;
      
      return {
        canGenerate,
        catalogsUsed,
        catalogsLimit,
        remainingCatalogs,
        message: canGenerate 
          ? `${remainingCatalogs} catálogos restantes este mes`
          : `Límite alcanzado. Has usado ${catalogsUsed}/${catalogsLimit} catálogos este mes.`
      };
      
    } catch (error) {
      console.error('Error checking catalog limits:', error);
      return {
        canGenerate: false,
        catalogsUsed: 0,
        catalogsLimit: 0,
        remainingCatalogs: 0,
        message: 'Error verificando límites. Intenta nuevamente.'
      };
    }
  }
  
  static async validatePremiumAccess(userId: string): Promise<boolean> {
    try {
      const { data: subscription, error } = await (supabase as any)
        .from('subscriptions')
        .select(`
          status,
          credit_packages (
            package_type,
            name
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();
      
      if (error || !subscription) {
        return false;
      }
      
      const packageType = subscription.credit_packages?.package_type || 'basic';
      return packageType !== 'basic' && packageType !== 'free';
      
    } catch (error) {
      console.error('Error validating premium access:', error);
      return false;
    }
  }
  
  static async updateCatalogUsage(userId: string): Promise<void> {
    try {
      const currentMonth = parseInt(
        new Date().getFullYear().toString() + 
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      );
      
      const { data: existingUsage } = await (supabase as any)
        .from('catalog_usage')
        .select('id, catalogs_generated')
        .eq('user_id', userId)
        .eq('usage_month', currentMonth)
        .maybeSingle();
      
      if (existingUsage) {
        await (supabase as any)
          .from('catalog_usage')
          .update({
            catalogs_generated: existingUsage.catalogs_generated + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUsage.id);
      } else {
        await (supabase as any)
          .from('catalog_usage')
          .insert({
            user_id: userId,
            usage_month: currentMonth,
            catalogs_generated: 1,
            uploads_used: 0
          });
      }
      
    } catch (error) {
      console.error('Error in updateCatalogUsage:', error);
    }
  }
  
  static async getCatalogStats(userId: string) {
    return { totalCatalogs: 0, thisMonth: 0, lastMonth: 0, topTemplates: [] };
  }
}

// ===== FUNCIONES DE CONVENIENCIA MEJORADAS =====

/**
 * 🎯 FUNCIÓN PRINCIPAL CON AUDITORÍA AUTOMÁTICA
 */
export const generateCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  return UnifiedCatalogGenerator.generateCatalog(products, businessInfo, templateId, userId, {
    qualityCheck: true,
    autoFix: true,
    ...options
  });
};

/**
 * 🚀 GENERACIÓN CON PUPPETEER (MEJOR CALIDAD)
 */
export const generatePuppeteerCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void,
  catalogTitle?: string
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    usePuppeteerService: true,
    useDynamicEngine: false,
    showProgress: !!onProgress,
    onProgress,
    qualityCheck: true,
    autoFix: true,
    catalogTitle
  });
};

/**
 * 🚀 GENERACIÓN CON DYNAMIC ENGINE
 */
export const generateDynamicCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void,
  catalogTitle?: string
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    usePuppeteerService: false,
    useDynamicEngine: true,
    showProgress: !!onProgress,
    onProgress,
    qualityCheck: true,
    autoFix: true,
    catalogTitle
  });
};

/**
 * 🎨 GENERACIÓN CLÁSICA (MÁXIMA COMPATIBILIDAD)
 */
export const generateClassicCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void,
  catalogTitle?: string
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    forceClassicMode: true,
    showProgress: !!onProgress,
    onProgress,
    qualityCheck: true,
    autoFix: true,
    catalogTitle
  });
};

/**
 * 📊 VERIFICAR LÍMITES
 */
export const checkLimits = async (userId: string): Promise<UsageLimits> => {
  return UnifiedCatalogGenerator.checkCatalogLimits(userId);
};

/**
 * 📈 OBTENER ESTADÍSTICAS
 */
export const getCatalogStats = async (userId: string) => {
  return UnifiedCatalogGenerator.getCatalogStats(userId);
};