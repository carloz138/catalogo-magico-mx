// src/lib/catalog/unified-generator.ts
// 🚀 GENERADOR UNIFICADO COMPLETAMENTE CORREGIDO - TODOS LOS ERRORES TS2698 ARREGLADOS

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
  price_wholesale?: number;
  wholesale_min_qty?: number;
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
  social_media?: {
    whatsapp?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
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
  qualityCheck?: boolean;
  autoFix?: boolean;
  skipAudit?: boolean;
  catalogTitle?: string;
}

export class UnifiedCatalogGenerator {
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL CORREGIDA - FLUJO: CREAR REGISTRO → GENERAR PDF → ACTUALIZAR
   */
  static async generateCatalog(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    userId: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    
    console.log('🔍 DEBUG - generateCatalog recibió options:', options);
    console.log('🔍 DEBUG - catalogTitle en options:', options.catalogTitle);
    console.log('🔍 DEBUG - generateCatalog businessInfo recibido:', JSON.stringify(businessInfo, null, 2));
    
    // 🔍 LOG CRÍTICO: Verificar URLs de imagen que llegan al generador
    console.log('🔍 DEBUG - URLs DE IMAGEN RECIBIDAS EN GENERATOR:', {
      totalProductos: products.length,
      productos: products.map((p, index) => ({
        posicion: index + 1,
        nombre: p.name,
        image_url: p.image_url,
        es_processed: p.image_url?.includes('processed-images') && p.image_url?.includes('_catalog.jpg') ? 'NO (es catalog)' : 
                     p.image_url?.includes('processed-images') && !p.image_url?.includes('_catalog.jpg') ? 'SÍ (sin fondo)' : 'NO',
        url_tipo: p.image_url?.includes('_catalog.jpg') ? 'CATALOG (con fondo optimizada)' : 
                  p.image_url?.includes('processed-images') ? 'PROCESSED (sin fondo)' : 
                  'ORIGINAL u OTRA',
        urlLength: p.image_url?.length || 0
      })),
      resumen: {
        conImagenesSinFondo: products.filter(p => p.image_url?.includes('processed-images') && !p.image_url?.includes('_catalog.jpg')).length,
        conImagenesOptimizadas: products.filter(p => p.image_url?.includes('_catalog.jpg')).length,
        conImagenesOriginales: products.filter(p => !p.image_url?.includes('processed-images')).length
      }
    });
    
    const startTime = Date.now();
    const warnings: string[] = [];
    
    try {
      console.log('🚀 Iniciando generación con flujo corregido:', { 
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
      let auditedTemplate = AuditedTemplateManager.getAuditedTemplateById(templateId);
      let template: IndustryTemplate;

      if (auditedTemplate) {
        template = this.convertAuditedToIndustryTemplate(auditedTemplate);
        console.log(`✅ Template encontrado en sistema V2.0: ${template.displayName}`);
      } else {
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
      
      // 3. AUDITORÍA DE CALIDAD DEL TEMPLATE
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
        
        if (options.autoFix !== false && auditResult.status === 'needs_fix') {
          console.log('🔧 Auto-corrigiendo template...');
          const fixedTemplates = TemplateAuditSystem.generateFixedTemplates([auditResult]);
          if (fixedTemplates.length > 0) {
            template = fixedTemplates[0];
            warnings.push(`Template auto-corregido para mejor calidad (${auditResult.issues.length} issues resueltos)`);
          }
        }
        
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
      
      // 📋 ORDENAMIENTO ALFABÉTICO DE PRODUCTOS
      console.log('📋 Ordenando productos alfabéticamente...');
      const originalOrder = products.map(p => p.name).slice(0, 3);
      products.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase().trim();
        const nameB = (b.name || '').toLowerCase().trim();
        return nameA.localeCompare(nameB, 'es', { numeric: true });
      });
      const sortedOrder = products.map(p => p.name).slice(0, 3);
      console.log('✅ Productos ordenados alfabéticamente:', { 
        antes: originalOrder, 
        después: sortedOrder,
        total: products.length 
      });
      
      if (options.onProgress) options.onProgress(22);
      
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
      
      // 🎯 NUEVO FLUJO CORREGIDO: CREAR REGISTRO PRIMERO
      console.log('💾 Creando registro de catálogo inicial...');
      const catalogRecord = await this.saveCatalogRecord(
        userId,
        templateId,
        products,
        businessInfo,
        template,
        options.catalogTitle || `Catálogo ${template.displayName} - ${new Date().toLocaleDateString('es-MX')}`,
        { 
          generationMethod: 'pending', 
          pdfSuccess: false,
          templateQuality,
          issues: warnings,
          status: 'generating'
        }
      );
      
      if (!catalogRecord.success || !catalogRecord.catalogId) {
        return {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Error creando registro inicial de catálogo'
        };
      }
      
      const catalogId = catalogRecord.catalogId;
      console.log('✅ Registro inicial creado con ID:', catalogId);
      
      if (options.onProgress) options.onProgress(35);
      
      // 7. GENERAR PDF CON CATALOG ID DISPONIBLE
      let htmlContent = '';
      let pdfGenerationSuccess = false;
      let finalMethod = generationMethod;
      let generationStats: any = {};
      
      try {
        if (generationMethod === 'puppeteer') {
          console.log('🚀 Generando con Puppeteer + Storage...');
          const result = await this.generateWithPuppeteerService(
            products, 
            businessInfo, 
            template, 
            catalogId, // 🎯 AHORA TENEMOS EL ID
            options
          );
          
          if (result.success) {
            pdfGenerationSuccess = true;
            finalMethod = 'puppeteer';
            generationStats = result.stats || {};
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
            
            console.log('✅ PDF generado y subido a storage exitosamente');
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
            
            // Actualizar registro con resultado del fallback
            await this.updateCatalogStatus(catalogId, 'completed', {
              generationMethod: 'classic',
              pdfSuccess: false,
              fallback_used: true
            });
            
            return { 
              ...fallbackResult, 
              catalogId,
              generationMethod: 'classic',
              warnings: [...warnings, ...(fallbackResult.warnings || [])]
            };
          }
          
        } else {
          // Classic method
          const result = await this.generateWithClassicEngine(products, businessInfo, template, userId, options);
          
          await this.updateCatalogStatus(catalogId, 'completed', {
            generationMethod: 'classic',
            pdfSuccess: false,
            html_generated: true
          });
          
          return { 
            ...result, 
            catalogId,
            generationMethod: 'classic',
            warnings: [...warnings, ...(result.warnings || [])]
          };
        }
        
      } catch (generationError) {
        console.error('❌ Error en generación primaria:', generationError);
        
        // Marcar catálogo como fallido
        await this.updateCatalogStatus(catalogId, 'failed', {
          error: generationError instanceof Error ? generationError.message : 'Error desconocido',
          failed_at: new Date().toISOString()
        });
        
        return {
          success: false,
          error: 'GENERATION_ERROR',
          message: generationError instanceof Error ? generationError.message : 'Error en generación',
          catalogId,
          warnings
        };
      }
      
      if (options.onProgress) options.onProgress(90);
      
      // 8. ACTUALIZAR REGISTRO CON RESULTADO FINAL
      const finalUpdateResult = await this.updateCatalogStatus(catalogId, 'completed', {
        generationMethod: finalMethod,
        pdfSuccess: pdfGenerationSuccess,
        templateQuality,
        issues: warnings,
        completed_at: new Date().toISOString(),
        ...(generationStats && typeof generationStats === 'object' ? generationStats : {})
      });
      
      if (!finalUpdateResult.success) {
        console.warn('⚠️ PDF generado pero falló actualización final del registro');
      }
      
      // 9. ACTUALIZAR CONTADOR DE USO
      await this.updateCatalogUsage(userId);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      
      console.log('✅ Catálogo generado exitosamente:', {
        catalogId,
        method: finalMethod,
        time: generationTime,
        quality: templateQuality,
        warnings: warnings.length
      });
      
      return {
        success: true,
        catalogId,
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
        wholesalePrice: auditedTemplate.showInfo?.wholesalePrice ?? true,
        wholesaleMinQty: auditedTemplate.showInfo?.wholesaleMinQty ?? true
      },
      isPremium: auditedTemplate.isPremium,
      planLevel: auditedTemplate.planLevel,
      tags: auditedTemplate.tags,
      
      imageSize: { width: 200, height: 200 },
      category: auditedTemplate.category,
      borderRadius: auditedTemplate.design?.borderRadius || 8,
      shadows: auditedTemplate.design?.shadows || true,
      spacing: auditedTemplate.design?.spacing || 'normal',
      typography: auditedTemplate.design?.typography || 'modern'
    };
    
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
    
    if (options.forceClassicMode) {
      return 'classic';
    }
    
    if (templateQuality < 60) {
      console.log('⚠️ Calidad baja del template, usando método clásico para mayor estabilidad');
      return 'classic';
    }
    
    if (options.usePuppeteerService !== false) {
      if (template.design?.shadows || (template.design?.borderRadius || 8) > 10) {
        return 'puppeteer';
      }
      
      if (productCount > 100) {
        return 'puppeteer';
      }
      
      if (template.isPremium) {
        return 'puppeteer';
      }
      
      return 'puppeteer';
    }
    
    if (options.useDynamicEngine !== false) {
      if (productCount >= 10 && productCount <= 200) {
        return 'dynamic';
      }
      
      if (!template.design?.shadows && (template.design?.borderRadius || 8) <= 10) {
        return 'dynamic';
      }
      
      return 'dynamic';
    }
    
    return 'classic';
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
    
    if (products.length === 0) {
      return {
        isValid: false,
        isCritical: true,
        warnings: [],
        message: 'No hay productos para generar catálogo'
      };
    }
    
    const productsWithoutImages = products.filter(p => !p.image_url || p.image_url.trim() === '').length;
    const imagePercentage = ((products.length - productsWithoutImages) / products.length) * 100;
    
    if (imagePercentage < 30) {
      warnings.push(`Solo ${imagePercentage.toFixed(1)}% de productos tienen imágenes. Considera agregar más imágenes para mejor presentación.`);
    }
    
    const longNames = products.filter(p => p.name && p.name.length > 50).length;
    if (longNames > products.length * 0.2) {
      warnings.push(`${longNames} productos tienen nombres muy largos que podrían cortarse en el PDF.`);
    }
    
    const productsWithoutPrice = products.filter(p => !p.price_retail || p.price_retail <= 0).length;
    if (productsWithoutPrice > 0) {
      warnings.push(`${productsWithoutPrice} productos sin precio válido.`);
    }
    
    if (template.density === 'alta' && products.length < 10) {
      warnings.push('Template de alta densidad con pocos productos puede verse espacioso. Considera usar densidad media o baja.');
    }
    
    if (template.density === 'baja' && products.length > 100) {
      warnings.push('Template de baja densidad con muchos productos generará muchas páginas. Considera usar densidad alta.');
    }
    
    if (products.length < template.productsPerPage) {
      warnings.push(`Solo tienes ${products.length} productos pero el template muestra ${template.productsPerPage} por página. El diseño podría verse incompleto.`);
    }
    
    return {
      isValid,
      isCritical,
      warnings
    };
  }
  
  /**
   * 🚀 GENERACIÓN CON PUPPETEER SERVICE CORREGIDA - CON CATALOG ID
   */
  private static async generateWithPuppeteerService(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    catalogId: string, // 🎯 PARÁMETRO CORRECTO
    options: GenerationOptions
  ): Promise<{ success: boolean; error?: string; stats?: any }> {
    
    try {
      console.log('🚀 Generando con Puppeteer Service + Storage...', { catalogId });
      console.log('🔍 DEBUG - UnifiedGenerator businessInfo antes de PuppeteerServiceClient:', businessInfo);
      
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
      
      const puppeteerOptions = {
        onProgress: options.onProgress,
        catalogId, // 🎯 PASAR EL CATALOG ID
        format: 'A4' as const,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm'
        },
        quality: template.isPremium ? 'high' as const : 'medium' as const,
        catalogTitle: options.catalogTitle
      };
      
      console.log('🔍 DEBUG - Pasando businessInfo a PuppeteerServiceClient:', JSON.stringify(businessInfo, null, 2));
      
      const result = await PuppeteerServiceClient.generatePDF(
        products,
        businessInfo,
        templateConfig,
        puppeteerOptions
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
   * 🚀 GENERACIÓN CON DYNAMIC ENGINE (SIN CAMBIOS)
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
   * 🎨 GENERACIÓN CON CLASSIC ENGINE (SIN CAMBIOS)
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
      
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        products,
        businessInfo,
        template
      );
      
      if (options.onProgress) options.onProgress(60);
      
      if (typeof window !== 'undefined') {
        await this.downloadCatalogAsHTMLWithStyles(htmlContent, businessInfo.business_name);
      }
      
      if (options.onProgress) options.onProgress(100);
      
      return {
        success: true,
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
   * 💾 GUARDAR REGISTRO INICIAL (SIN PDF_URL)
   */
  private static async saveCatalogRecord(
    userId: string,
    templateId: string,
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    catalogTitle: string,
    metadata: {
      generationMethod: string;
      pdfSuccess: boolean;
      templateQuality: number;
      issues?: string[];
      [key: string]: any;
    }
  ): Promise<{ success: boolean; catalogId?: string }> {
    
    try {
      console.log('🔍 DEBUG - Guardando registro inicial con título:', catalogTitle);
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
        pdf_url: null, // Se actualizará cuando el PDF esté listo
        generation_metadata: {
          engine: metadata.generationMethod,
          pdf_success: metadata.pdfSuccess,
          template_density: template.density,
          products_per_page: template.productsPerPage,
          template_quality_score: metadata.templateQuality,
          generated_at: new Date().toISOString(),
          puppeteer_service_used: metadata.generationMethod === 'puppeteer',
          issues_detected: metadata.issues || [],
          template_version: '2.0',
          generation_warnings: metadata.issues?.length || 0,
          estimated_pages: Math.ceil(products.length / template.productsPerPage),
          products_sorted_alphabetically: true,
          status: metadata.status || 'generating',
          ...(metadata as Record<string, unknown>) // ✅ CORREGIDO TS2698
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
      
      console.log('✅ Registro inicial guardado con ID:', data.id);
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
   * 🔄 ACTUALIZAR STATUS DEL CATÁLOGO
   */
  private static async updateCatalogStatus(
    catalogId: string,
    status: 'generating' | 'completed' | 'failed',
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      console.log('🔄 Actualizando status del catálogo:', { catalogId, status });
      
      const { data: currentCatalog } = await supabase
        .from('catalogs')
        .select('generation_metadata')
        .eq('id', catalogId)
        .single();
      
      const updateData = {
        generation_metadata: {
          ...(currentCatalog?.generation_metadata as Record<string, unknown> || {}),
          ...(metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {}),
          status,
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('catalogs')
        .update(updateData)
        .eq('id', catalogId);
      
      if (error) {
        console.error('❌ Error actualizando status:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Status actualizado correctamente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en updateCatalogStatus:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error actualizando status' 
      };
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
      
      const enhancedHTML = htmlContent.replace(
        '<head>',
        `<head>
          <meta name="viewport" content="width=210mm, initial-scale=1.0">
          <meta name="description" content="Catálogo generado con CatifyPro">
          <meta name="generator" content="CatifyPro v2.0">`
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
 * 🎯 FUNCIÓN PRINCIPAL CON AUDITORÍA AUTOMÁTICA Y ORDENAMIENTO ALFABÉTICO
 */
export const generateCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  
  // 🎯 LOG CRÍTICO: Verificar URLs de imagen antes de generar PDF
  console.log('🔍 VERIFICACIÓN CRÍTICA - URLs de imagen antes del PDF:', {
    totalProductos: products.length,
    urls: products.map((product, index) => ({
      nombre: product.name,
      posicion: index + 1,
      image_url: product.image_url?.substring(0, 100) + '...',
      
      // Detección mejorada del tipo de imagen
      tipoImagen: product.image_url?.includes('processed-images') && product.image_url?.includes('_catalog.jpg') ? 'OPTIMIZADA_CON_FONDO' :
                  product.image_url?.includes('processed-images') && !product.image_url?.includes('_catalog.jpg') ? 'SIN_FONDO' :
                  product.image_url?.includes('product-images') ? 'ORIGINAL' : 'OTRO_TIPO',
      
      esOptimizada: product.image_url?.includes('catalog') || false,
      esSinFondo: product.image_url?.includes('processed-images') && !product.image_url?.includes('_catalog.jpg'),
      tieneOriginal: !!(product as any).original_image_url,
      tieneCatalog: !!(product as any).catalog_image_url,
      tieneProcessed: !!(product as any).processed_image_url,
      urlLength: product.image_url?.length || 0
    })),
    resumen: {
      conURLOptimizada: products.filter(p => p.image_url?.includes('_catalog.jpg')).length,
      conImagenSinFondo: products.filter(p => p.image_url?.includes('processed-images') && !p.image_url?.includes('_catalog.jpg')).length,
      conImagenOriginal: products.filter(p => p.image_url?.includes('product-images')).length,
      urlsLargas: products.filter(p => (p.image_url?.length || 0) > 200).length,
      pesoEstimado: products.filter(p => (p.image_url?.length || 0) > 200).length > 0 ? 'ALTO (>50MB)' : 'BAJO (<5MB)'
    }
  });
  
  return UnifiedCatalogGenerator.generateCatalog(products, businessInfo, templateId, userId, {
    qualityCheck: true,
    autoFix: true,
    ...(options as Record<string, unknown>) // ✅ CORREGIDO TS2698
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
  console.log('🔍 DEBUG - generatePuppeteerCatalog recibió catalogTitle:', catalogTitle);
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