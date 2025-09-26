// src/lib/catalog/unified-generator.ts
// 🚀 GENERADOR UNIFICADO CON PRODUCTOS POR PÁGINA DINÁMICOS

import { supabase } from '@/integrations/supabase/client';
import { IndustryTemplate, getTemplateById } from '@/lib/templates/industry-templates';
import { AuditedTemplate, AuditedTemplateManager } from '@/lib/templates/audited-templates-v2';
import { TemplateGenerator } from '@/lib/templates/css-generator';
import { PDFStorageManager } from '@/lib/storage/pdf-uploader';
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
  generationMethod?: 'puppeteer' | 'dynamic' | 'classic' | 'hybrid' | 'fallback';
  stats?: {
    totalProducts: number;
    totalPages: number;
    generationTime: number;
    templateQuality: number;
    issues?: string[];
    // 🆕 NUEVAS ESTADÍSTICAS DINÁMICAS
    productsPerPage?: 4 | 6 | 9;
    layoutOptimization?: string;
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
  // 🆕 NUEVA OPCIÓN: Productos por página dinámicos
  productsPerPage?: 4 | 6 | 9;
}

export class UnifiedCatalogGenerator {
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL CON PRODUCTOS POR PÁGINA DINÁMICOS
   */
  static async generateCatalog(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    userId: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    
    console.log('🔍 DEBUG - generateCatalog recibió options:', options);
    console.log('🔍 DEBUG - productsPerPage:', options.productsPerPage);
    console.log('🔍 DEBUG - catalogTitle en options:', options.catalogTitle);
    
    const startTime = Date.now();
    const warnings: string[] = [];
    
    // 🆕 VALIDAR Y ESTABLECER PRODUCTOS POR PÁGINA
    const productsPerPage = options.productsPerPage || 6;
    console.log(`🎯 Generando catálogo con ${productsPerPage} productos por página`);
    
    try {
      console.log('🚀 Iniciando generación con flujo dinámico:', { 
        templateId, 
        productCount: products.length,
        productsPerPage,
        expectedPages: Math.ceil(products.length / productsPerPage),
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
      
      // 🚀 APLICAR OPTIMIZACIONES DINÁMICAS AL TEMPLATE
      template = this.applyDynamicOptimizations(template, productsPerPage);
      console.log(`✅ Template optimizado para ${productsPerPage} productos por página`);
      
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
      console.log(`✅ Productos ordenados alfabéticamente (${productsPerPage}/página):`, { 
        antes: originalOrder, 
        después: sortedOrder,
        total: products.length,
        páginas: Math.ceil(products.length / productsPerPage)
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
      
      // 5. VALIDACIÓN DINÁMICA DE PRODUCTOS
      const productValidation = this.validateProductsForDynamicTemplate(products, template, productsPerPage);
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
      
      // 6. DECISIÓN INTELIGENTE DE MÉTODO DE GENERACIÓN
      const generationMethod = this.selectOptimalGenerationMethodDynamic(
        products.length, 
        template, 
        templateQuality, 
        productsPerPage,
        options
      );
      
      console.log(`📋 Método seleccionado: ${generationMethod} para ${productsPerPage} productos/página (calidad template: ${templateQuality}/100)`);
      
      if (options.onProgress) options.onProgress(30);
      
      // 7. CREAR REGISTRO INICIAL CON METADATA DINÁMICA
      console.log('💾 Creando registro de catálogo con configuración dinámica...');
      const catalogRecord = await this.saveDynamicCatalogRecord(
        userId,
        templateId,
        products,
        businessInfo,
        template,
        productsPerPage,
        options.catalogTitle || `Catálogo ${template.displayName} (${productsPerPage}/pág) - ${new Date().toLocaleDateString('es-MX')}`,
        { 
          generationMethod: 'pending', 
          pdfSuccess: false,
          templateQuality,
          issues: warnings,
          status: 'generating',
          layoutOptimization: this.getLayoutOptimization(productsPerPage)
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
      console.log(`✅ Registro dinámico creado con ID: ${catalogId} (${productsPerPage}/página)`);
      
      if (options.onProgress) options.onProgress(35);
      
      // 8. GENERAR PDF CON CONFIGURACIÓN DINÁMICA
      let htmlContent = '';
      let pdfGenerationSuccess = false;
      let finalMethod = generationMethod;
      let generationStats: any = {};
      
      console.log(`🔄 INICIANDO generación de PDF dinámico: ${generationMethod} (${productsPerPage}/página)`);
      
      try {
        if (generationMethod === 'puppeteer') {
          console.log(`🚀 Generando con Puppeteer (${productsPerPage} productos/página)...`);
          const result = await this.generateWithDynamicPuppeteer(
            products, 
            businessInfo, 
            template, 
            catalogId,
            productsPerPage,
            options
          );
          
          if (result.success) {
            pdfGenerationSuccess = true;
            finalMethod = 'puppeteer';
            generationStats = result.stats || {};
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template, productsPerPage);
            
            console.log(`✅ PDF generado y subido con ${productsPerPage} productos/página`);
          } else {
            console.warn(`⚠️ Puppeteer falló para ${productsPerPage}/página, usando fallback dinámico`);
            warnings.push(`Servicio Puppeteer no disponible para ${productsPerPage}/página, usando método alternativo`);
            
            const fallbackResult = await this.generateWithDynamicEngine(
              products, 
              businessInfo, 
              templateId, 
              productsPerPage,
              options,
              catalogId
            );
            pdfGenerationSuccess = fallbackResult.success;
            finalMethod = 'dynamic';
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template, productsPerPage);
          }
          
        } else if (generationMethod === 'dynamic') {
          const result = await this.generateWithDynamicEngine(
            products, 
            businessInfo, 
            templateId, 
            productsPerPage,
            options,
            catalogId
          );
          
          if (result.success) {
            pdfGenerationSuccess = true;
            finalMethod = 'dynamic';
            htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template, productsPerPage);
          } else {
            console.warn(`⚠️ Dynamic engine falló para ${productsPerPage}/página, usando fallback clásico`);
            warnings.push(`Motor dinámico no disponible para ${productsPerPage}/página, usando método clásico`);
            
            const fallbackResult = await this.generateWithDynamicClassicEngine(
              products, 
              businessInfo, 
              template, 
              userId, 
              productsPerPage, 
              options
            );
            
            await this.updateDynamicCatalogStatus(catalogId, 'completed', {
              generationMethod: 'classic',
              pdfSuccess: false,
              fallback_used: true,
              productsPerPage,
              layoutOptimization: this.getLayoutOptimization(productsPerPage)
            });
            
            return { 
              ...fallbackResult, 
              catalogId,
              generationMethod: 'classic',
              warnings: [...warnings, ...(fallbackResult.warnings || [])],
              stats: {
                ...fallbackResult.stats,
                productsPerPage,
                layoutOptimization: this.getLayoutOptimization(productsPerPage)
              }
            };
          }
          
        } else {
          // Classic method optimizado dinámicamente
          const result = await this.generateWithDynamicClassicEngine(
            products, 
            businessInfo, 
            template, 
            userId, 
            productsPerPage, 
            options
          );
          
          await this.updateDynamicCatalogStatus(catalogId, 'completed', {
            generationMethod: 'classic',
            pdfSuccess: false,
            html_generated: true,
            productsPerPage,
            layoutOptimization: this.getLayoutOptimization(productsPerPage)
          });
          
          return { 
            ...result, 
            catalogId,
            generationMethod: 'classic',
            warnings: [...warnings, ...(result.warnings || [])],
            stats: {
              ...result.stats,
              productsPerPage,
              layoutOptimization: this.getLayoutOptimization(productsPerPage)
            }
          };
        }
        
      } catch (generationError) {
        console.error(`❌ Error en generación primaria (${productsPerPage}/página):`, generationError);
        
        // Intentar generar un PDF básico como fallback
        console.log(`🚨 [CRITICO] Iniciando fallback para ${productsPerPage} productos/página...`);
        try {
          const { jsPDF } = await import('jspdf');
          const doc = new (jsPDF as any)();
          
          doc.setFontSize(16);
          doc.text(businessInfo.business_name || 'Catálogo', 20, 30);
          doc.setFontSize(12);
          doc.text(`Catálogo con ${products.length} productos (${productsPerPage}/página)`, 20, 50);
          doc.text('Generado el ' + new Date().toLocaleDateString('es-MX'), 20, 60);
          doc.text(`LAYOUT OPTIMIZADO: ${this.getLayoutOptimization(productsPerPage)}`, 20, 70);
          
          const pdfBlob = doc.output('blob');
          
          const storageResult = await PDFStorageManager.saveAndLinkPDF(
            pdfBlob,
            catalogId,
            businessInfo.business_name || 'Catalogo',
            {
              pdf_size_bytes: pdfBlob.size,
              total_pages: 1,
              generation_method: 'fallback_dynamic',
              error_recovery: true,
              original_error: generationError instanceof Error ? generationError.message : 'Error desconocido',
              productsPerPage,
              layoutOptimization: this.getLayoutOptimization(productsPerPage)
            }
          );
          
          if (storageResult.success && storageResult.url) {
            console.log(`✅ [CRITICO] Fallback PDF dinámico vinculado: ${storageResult.url}`);
            pdfGenerationSuccess = true;
            finalMethod = 'fallback' as any;
          } else {
            console.error(`❌ [CRITICO] Falló vinculación del fallback PDF dinámico:`, storageResult.error);
          }
        } catch (fallbackError) {
          console.error(`❌ [CRITICO] Error en fallback dinámico completo:`, fallbackError);
        }
        
        if (!pdfGenerationSuccess) {
          await this.updateDynamicCatalogStatus(catalogId, 'failed', {
            error: generationError instanceof Error ? generationError.message : 'Error desconocido',
            failed_at: new Date().toISOString(),
            productsPerPage,
            layoutOptimization: this.getLayoutOptimization(productsPerPage)
          });
          
          return {
            success: false,
            error: 'GENERATION_ERROR',
            message: generationError instanceof Error ? generationError.message : 'Error en generación',
            catalogId,
            warnings
          };
        }
      }
      
      if (options.onProgress) options.onProgress(90);
      
      // 9. ACTUALIZAR REGISTRO CON RESULTADO FINAL DINÁMICO
      console.log(`🔄 ACTUALIZANDO STATUS FINAL del catálogo dinámico (${productsPerPage}/página)...`, {
        catalogId,
        finalMethod,
        pdfGenerationSuccess
      });
      
      const finalUpdateResult = await this.updateDynamicCatalogStatus(catalogId, 'completed', {
        generationMethod: finalMethod,
        pdfSuccess: pdfGenerationSuccess,
        templateQuality,
        issues: warnings,
        completed_at: new Date().toISOString(),
        productsPerPage,
        layoutOptimization: this.getLayoutOptimization(productsPerPage),
        ...(generationStats && typeof generationStats === 'object' ? generationStats : {})
      });
      
      console.log('📊 Resultado actualización final dinámica:', finalUpdateResult);
      
      // 10. ACTUALIZAR CONTADOR DE USO
      await this.updateCatalogUsage(userId);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      
      console.log(`✅ Catálogo DINÁMICO generado exitosamente (${productsPerPage}/página):`, {
        catalogId,
        method: finalMethod,
        time: generationTime,
        quality: templateQuality,
        warnings: warnings.length,
        layout: this.getLayoutOptimization(productsPerPage)
      });
      
      return {
        success: true,
        catalogId,
        htmlContent,
        generationMethod: finalMethod,
        message: `Catálogo ${template.displayName} generado exitosamente (${productsPerPage} productos/página)`,
        warnings: warnings.length > 0 ? warnings : undefined,
        stats: {
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / productsPerPage),
          generationTime,
          templateQuality,
          issues: warnings.length > 0 ? warnings : undefined,
          productsPerPage,
          layoutOptimization: this.getLayoutOptimization(productsPerPage)
        }
      };
      
    } catch (error) {
      console.error('❌ Error crítico generando catálogo dinámico:', error);
      return {
        success: false,
        error: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido',
        warnings
      };
    }
  }

  /**
   * 🚀 APLICAR OPTIMIZACIONES DINÁMICAS AL TEMPLATE
   */
  private static applyDynamicOptimizations(
    template: IndustryTemplate, 
    productsPerPage: 4 | 6 | 9
  ): IndustryTemplate {
    // Clonar el template para no modificar el original
    const optimizedTemplate = JSON.parse(JSON.stringify(template));
    
    // 🔧 AJUSTAR PRODUCTOS POR PÁGINA DINÁMICAMENTE
    optimizedTemplate.productsPerPage = productsPerPage;
    
    // 🔧 AJUSTAR COLUMNAS DINÁMICAMENTE
    if (productsPerPage === 4) {
      optimizedTemplate.gridColumns = 2; // 2x2 para 4 productos
    } else if (productsPerPage === 6) {
      optimizedTemplate.gridColumns = 3; // 3x2 para 6 productos
    } else if (productsPerPage === 9) {
      optimizedTemplate.gridColumns = 3; // 3x3 para 9 productos
    }
    
    // 🔧 AJUSTAR DENSIDAD SEGÚN PRODUCTOS POR PÁGINA
    if (productsPerPage === 4) {
      optimizedTemplate.density = 'baja'; // Más espacio para 4 productos
    } else if (productsPerPage === 6) {
      optimizedTemplate.density = template.density || 'media'; // Mantener densidad original
    } else if (productsPerPage === 9) {
      optimizedTemplate.density = 'alta'; // Más compacto para 9 productos
    }
    
    // 🔧 OPTIMIZAR DISEÑO DINÁMICAMENTE
    if (optimizedTemplate.design) {
      if (productsPerPage === 4) {
        optimizedTemplate.design.spacing = 'spacious';
        optimizedTemplate.design.borderRadius = Math.min(optimizedTemplate.design.borderRadius || 8, 12);
      } else if (productsPerPage === 9) {
        optimizedTemplate.design.spacing = 'compact';
        optimizedTemplate.design.borderRadius = Math.min(optimizedTemplate.design.borderRadius || 8, 6);
      } else {
        optimizedTemplate.design.spacing = 'normal';
      }
    }
    
    console.log(`✅ Template optimizado dinámicamente:`, {
      productsPerPage,
      columns: optimizedTemplate.gridColumns,
      density: optimizedTemplate.density,
      spacing: optimizedTemplate.design?.spacing
    });
    
    return optimizedTemplate;
  }

  /**
   * 🧠 SELECCIÓN INTELIGENTE DE MÉTODO DINÁMICO
   */
  private static selectOptimalGenerationMethodDynamic(
    productCount: number, 
    template: IndustryTemplate,
    templateQuality: number,
    productsPerPage: 4 | 6 | 9,
    options: GenerationOptions
  ): 'puppeteer' | 'dynamic' | 'classic' {
    
    if (options.forceClassicMode) {
      return 'classic';
    }
    
    // 🚀 PRIORIZAR PUPPETEER PARA LAYOUTS COMPLEJOS
    if (options.usePuppeteerService !== false) {
      // Para 4 productos/página (layout grande), Puppeteer es ideal
      if (productsPerPage === 4) {
        console.log('🎯 Seleccionando Puppeteer para layout grande (4/página)');
        return 'puppeteer';
      }
      
      // Para 9 productos/página (layout compacto), también Puppeteer
      if (productsPerPage === 9) {
        console.log('🎯 Seleccionando Puppeteer para layout compacto (9/página)');
        return 'puppeteer';
      }
      
      // Para 6 productos/página (estándar), cualquier método funciona
      console.log('🎯 Seleccionando Puppeteer para layout estándar (6/página)');
      return 'puppeteer';
    }
    
    if (templateQuality < 60) {
      console.log('⚠️ Calidad baja del template, usando método clásico dinámico');
      return 'classic';
    }
    
    if (options.useDynamicEngine !== false) {
      // Para pocos productos, dynamic engine funciona bien
      if (productCount <= 20 && productsPerPage <= 6) {
        return 'dynamic';
      }
      
      // Para muchos productos compactos, también dynamic
      if (productCount >= 50 && productsPerPage === 9) {
        return 'dynamic';
      }
      
      return 'dynamic';
    }
    
    return 'classic';
  }
  
  /**
   * ✅ VALIDACIÓN DINÁMICA DE PRODUCTOS
   */
  private static validateProductsForDynamicTemplate(
    products: Product[], 
    template: IndustryTemplate, 
    productsPerPage: 4 | 6 | 9
  ): {
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
    
    // Validaciones específicas por productos por página
    if (productsPerPage === 4 && products.length > 100) {
      warnings.push(`Con ${productsPerPage} productos/página y ${products.length} productos, tendrás ${Math.ceil(products.length / productsPerPage)} páginas. Considera usar 6 o 9 productos/página para menos páginas.`);
    }
    
    if (productsPerPage === 9 && products.length < 20) {
      warnings.push(`Con solo ${products.length} productos, el layout de 9/página puede verse muy espacioso. Considera usar 4 o 6 productos/página.`);
    }
    
    if (products.length < productsPerPage) {
      warnings.push(`Solo tienes ${products.length} productos pero elegiste ${productsPerPage}/página. La última página se verá incompleta.`);
    }
    
    // Validaciones de contenido
    const productsWithoutImages = products.filter(p => !p.image_url || p.image_url.trim() === '').length;
    const imagePercentage = ((products.length - productsWithoutImages) / products.length) * 100;
    
    if (imagePercentage < 30) {
      warnings.push(`Solo ${imagePercentage.toFixed(1)}% de productos tienen imágenes. ${productsPerPage === 4 ? 'Con 4 productos/página las imágenes vacías serán muy notorias.' : productsPerPage === 9 ? 'Con 9 productos/página las imágenes son críticas para buena presentación.' : 'Considera agregar más imágenes.'}`);
    }
    
    const longNames = products.filter(p => p.name && p.name.length > (productsPerPage === 9 ? 30 : productsPerPage === 4 ? 80 : 50)).length;
    if (longNames > 0) {
      warnings.push(`${longNames} productos tienen nombres muy largos para el layout de ${productsPerPage}/página. ${productsPerPage === 9 ? 'Con 9 productos/página es crítico tener nombres cortos.' : 'Podrían cortarse en el PDF.'}`);
    }
    
    const productsWithoutPrice = products.filter(p => !p.price_retail || p.price_retail <= 0).length;
    if (productsWithoutPrice > 0) {
      warnings.push(`${productsWithoutPrice} productos sin precio válido.`);
    }
    
    return {
      isValid,
      isCritical,
      warnings
    };
  }
  
  /**
   * 🚀 GENERACIÓN CON PUPPETEER DINÁMICO
   */
  private static async generateWithDynamicPuppeteer(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    catalogId: string,
    productsPerPage: 4 | 6 | 9,
    options: GenerationOptions
  ): Promise<{ success: boolean; error?: string; stats?: any }> {
    
    try {
      console.log(`🚀 Generando con Puppeteer dinámico (${productsPerPage}/página)...`, { catalogId });
      
      const templateConfig = {
        id: template.id,
        displayName: template.displayName,
        productsPerPage: productsPerPage, // 🆕 USAR PRODUCTOS POR PÁGINA DINÁMICOS
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
        catalogId,
        format: 'A4' as const,
        margin: {
          top: '12mm',
          right: '12mm',
          bottom: '12mm',
          left: '12mm'
        },
        quality: 'high' as const,
        catalogTitle: options.catalogTitle,
        productsPerPage: productsPerPage // 🆕 PASAR PRODUCTOS POR PÁGINA AL PUPPETEER
      };
      
      const result = await PuppeteerServiceClient.generatePDF(
        products,
        businessInfo,
        templateConfig,
        puppeteerOptions
      );
      
      if (result.success) {
        console.log(`✅ Puppeteer dinámico completado exitosamente (${productsPerPage}/página)`);
        return { 
          success: true, 
          stats: {
            ...result.stats,
            productsPerPage,
            layoutOptimization: this.getLayoutOptimization(productsPerPage)
          }
        };
      } else {
        console.error(`❌ Error en Puppeteer dinámico (${productsPerPage}/página):`, result.error);
        return { 
          success: false, 
          error: result.error 
        };
      }
      
    } catch (error) {
      console.error(`❌ Excepción en Puppeteer dinámico (${productsPerPage}/página):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en Puppeteer dinámico'
      };
    }
  }
  
  /**
   * 🚀 GENERACIÓN CON DYNAMIC ENGINE 
   */
  private static async generateWithDynamicEngine(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    productsPerPage: 4 | 6 | 9,
    options: GenerationOptions,
    catalogId?: string
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      console.log(`🚀 Generando con Dynamic Engine (${productsPerPage}/página)...`, { catalogId });
      
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} no encontrado`);
      }
      
      // 🔧 APLICAR OPTIMIZACIONES DINÁMICAS
      const optimizedTemplate = this.applyDynamicOptimizations(template, productsPerPage);
      
      const dynamicTemplate = {
        id: optimizedTemplate.id,
        displayName: optimizedTemplate.displayName,
        productsPerPage: productsPerPage, // 🆕 USAR PRODUCTOS POR PÁGINA DINÁMICOS
        layout: {
          columns: optimizedTemplate.gridColumns,
          rows: Math.ceil(productsPerPage / optimizedTemplate.gridColumns),
          spacing: optimizedTemplate.design?.spacing || 'normal'
        },
        colors: {
          primary: optimizedTemplate.colors.primary,
          secondary: optimizedTemplate.colors.secondary || optimizedTemplate.colors.primary,
          accent: optimizedTemplate.colors.accent || optimizedTemplate.colors.primary,
          background: optimizedTemplate.colors.background || '#ffffff',
          text: optimizedTemplate.colors.text || '#2c3e50'
        },
        typography: {
          headerSize: this.calculateDynamicFontSize('header', optimizedTemplate.density, productsPerPage),
          productNameSize: this.calculateDynamicFontSize('productName', optimizedTemplate.density, productsPerPage),
          priceSize: this.calculateDynamicFontSize('price', optimizedTemplate.density, productsPerPage)
        },
        quality: 'high'
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
      
      if (!result.success) {
        return result;
      }
      
      // 2. 🎯 GUARDAR PDF EN STORAGE DINÁMICO
      if (result.success && catalogId) {
        console.log(`📤 INICIANDO guardado de PDF dinámico en storage (${productsPerPage}/página)...`, { catalogId });
        
        try {
          const { jsPDF } = await import('jspdf');
          const doc = new (jsPDF as any)({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          doc.setFontSize(20);
          doc.text(businessInfo.business_name || 'Catálogo', 20, 30);
          
          doc.setFontSize(12);
          doc.text(`Catálogo con ${products.length} productos (${productsPerPage}/página)`, 20, 50);
          doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')}`, 20, 60);
          doc.text(`Layout: ${this.getLayoutOptimization(productsPerPage)}`, 20, 70);
          
          // Agregar lista de productos con formato optimizado
          let yPos = 90;
          const productsToShow = productsPerPage === 4 ? 8 : productsPerPage === 6 ? 12 : 20;
          products.slice(0, productsToShow).forEach((product, index) => {
            if (yPos > 250) return;
            doc.text(`${index + 1}. ${product.name}`, 20, yPos);
            if (product.price_retail) {
              doc.text(`$${product.price_retail.toLocaleString()}`, 150, yPos);
            }
            yPos += productsPerPage === 9 ? 6 : 8; // Espaciado más compacto para 9/página
          });
          
          const pdfBlob = doc.output('blob');
          console.log(`📄 PDF blob dinámico generado (${productsPerPage}/página), tamaño:`, pdfBlob.size, 'bytes');
          
          const storageResult = await PDFStorageManager.saveAndLinkPDF(
            pdfBlob,
            catalogId,
            businessInfo.business_name || 'Catalogo',
            {
              pdf_size_bytes: pdfBlob.size,
              generation_completed_at: new Date().toISOString(),
              generation_method: 'dynamic_engine',
              total_products: products.length,
              productsPerPage,
              layoutOptimization: this.getLayoutOptimization(productsPerPage)
            }
          );
          
          if (storageResult.success) {
            console.log(`✅ PDF del Dynamic Engine dinámico guardado: ${storageResult.url}`);
          } else {
            console.error(`❌ Error guardando PDF del Dynamic Engine dinámico:`, storageResult.error);
          }
          
        } catch (storageError) {
          console.error(`❌ Error en almacenamiento de PDF dinámico:`, storageError);
        }
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error en dynamic engine (${productsPerPage}/página):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en dynamic engine'
      };
    }
  }
  
  /**
   * 🎨 GENERACIÓN CON CLASSIC ENGINE DINÁMICO
   */
  private static async generateWithDynamicClassicEngine(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    userId: string,
    productsPerPage: 4 | 6 | 9,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    
    try {
      console.log(`🎨 Generando con Classic Engine dinámico (${productsPerPage}/página)...`);
      
      if (options.onProgress) options.onProgress(40);
      
      // 🔧 APLICAR OPTIMIZACIONES DINÁMICAS
      const optimizedTemplate = this.applyDynamicOptimizations(template, productsPerPage);
      
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        products,
        businessInfo,
        optimizedTemplate,
        productsPerPage // 🆕 PASAR PRODUCTOS POR PÁGINA
      );
      
      if (options.onProgress) options.onProgress(60);
      
      if (typeof window !== 'undefined') {
        await this.downloadCatalogAsHTMLDynamic(htmlContent, businessInfo.business_name, productsPerPage);
      }
      
      if (options.onProgress) options.onProgress(100);
      
      return {
        success: true,
        htmlContent,
        generationMethod: 'classic',
        message: `Catálogo ${optimizedTemplate.displayName} generado con engine clásico dinámico (${productsPerPage}/página)`,
        warnings: [`Usando método clásico dinámico para ${productsPerPage} productos/página con máxima compatibilidad`],
        stats: {
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / productsPerPage),
          generationTime: 0,
          templateQuality: 100,
          productsPerPage,
          layoutOptimization: this.getLayoutOptimization(productsPerPage)
        }
      };
      
    } catch (error) {
      console.error(`❌ Error en classic engine dinámico (${productsPerPage}/página):`, error);
      return {
        success: false,
        error: 'CLASSIC_ENGINE_ERROR',
        message: error instanceof Error ? error.message : 'Error en engine clásico dinámico'
      };
    }
  }
  
  /**
   * 💾 GUARDAR REGISTRO DINÁMICO
   */
  private static async saveDynamicCatalogRecord(
    userId: string,
    templateId: string,
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    productsPerPage: 4 | 6 | 9,
    catalogTitle: string,
    metadata: {
      generationMethod: string;
      pdfSuccess: boolean;
      templateQuality: number;
      issues?: string[];
      layoutOptimization?: string;
      [key: string]: any;
    }
  ): Promise<{ success: boolean; catalogId?: string }> {
    
    try {
      console.log(`🔍 DEBUG - Guardando registro dinámico (${productsPerPage}/página) con título:`, catalogTitle);
      const catalogData = {
        user_id: userId,
        name: catalogTitle || `Catálogo ${template.displayName} (${productsPerPage}/pág) - ${new Date().toLocaleDateString('es-MX')}`,
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
        pdf_url: null,
        generation_metadata: {
          engine: metadata.generationMethod,
          pdf_success: metadata.pdfSuccess,
          template_density: template.density,
          products_per_page: productsPerPage, // 🆕 PRODUCTOS POR PÁGINA
          layout_columns: template.gridColumns,
          layout_optimization: metadata.layoutOptimization || this.getLayoutOptimization(productsPerPage),
          template_quality_score: metadata.templateQuality,
          generated_at: new Date().toISOString(),
          puppeteer_service_used: metadata.generationMethod === 'puppeteer',
          issues_detected: metadata.issues || [],
          template_version: '2.0_dynamic',
          generation_warnings: metadata.issues?.length || 0,
          estimated_pages: Math.ceil(products.length / productsPerPage),
          products_sorted_alphabetically: true,
          status: metadata.status || 'generating',
          dynamic_layout: {
            productsPerPage,
            columns: template.gridColumns,
            rows: Math.ceil(productsPerPage / template.gridColumns),
            cardSize: productsPerPage === 4 ? 'large' : productsPerPage === 6 ? 'medium' : 'small',
            optimization: this.getLayoutOptimization(productsPerPage)
          },
          ...(metadata as Record<string, unknown>)
        }
      };
      
      const { data, error } = await supabase
        .from('catalogs')
        .insert(catalogData)
        .select('id')
        .single();
      
      if (error) {
        console.error('Error saving dynamic catalog record:', error);
        return { success: false };
      }
      
      console.log(`✅ Registro dinámico guardado con ID: ${data.id} (${productsPerPage}/página)`);
      return { 
        success: true, 
        catalogId: data.id 
      };
      
    } catch (error) {
      console.error('Error in saveDynamicCatalogRecord:', error);
      return { success: false };
    }
  }

  /**
   * 🔄 ACTUALIZAR STATUS DINÁMICO
   */
  private static async updateDynamicCatalogStatus(
    catalogId: string,
    status: 'generating' | 'completed' | 'failed',
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      console.log(`🔄 Actualizando status del catálogo dinámico:`, { catalogId, status, productsPerPage: metadata.productsPerPage });
      
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
          updated_at: new Date().toISOString(),
          dynamic_layout_final: {
            productsPerPage: metadata.productsPerPage,
            layoutOptimization: metadata.layoutOptimization,
            finalMethod: metadata.generationMethod
          }
        },
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('catalogs')
        .update(updateData)
        .eq('id', catalogId);
      
      if (error) {
        console.error('❌ Error actualizando status dinámico:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Status dinámico actualizado correctamente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error en updateDynamicCatalogStatus:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error actualizando status dinámico' 
      };
    }
  }
  
  /**
   * 📄 DESCARGA HTML DINÁMICA
   */
  private static async downloadCatalogAsHTMLDynamic(
    htmlContent: string, 
    businessName: string,
    productsPerPage: 4 | 6 | 9
  ): Promise<void> {
    try {
      console.log(`📄 Descargando catálogo como HTML dinámico (${productsPerPage}/página)...`);
      
      const enhancedHTML = htmlContent.replace(
        '<head>',
        `<head>
          <meta name="viewport" content="width=210mm, initial-scale=1.0">
          <meta name="description" content="Catálogo dinámico (${productsPerPage}/página) generado con CatifyPro">
          <meta name="generator" content="CatifyPro v2.0 - Layout Dinámico">
          <meta name="products-per-page" content="${productsPerPage}">
          <meta name="layout-optimization" content="${this.getLayoutOptimization(productsPerPage)}">
          <meta name="optimization" content="dynamic-layout,responsive-sizing,adaptive-spacing">`
      );
      
      const blob = new Blob([enhancedHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const filename = `catalogo-dinamico-${productsPerPage}pp-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`✅ Catálogo HTML dinámico descargado exitosamente (${productsPerPage}/página)`);
      
    } catch (error) {
      console.error(`❌ Error en descarga HTML dinámico (${productsPerPage}/página):`, error);
      throw new Error('Error descargando catálogo HTML dinámico');
    }
  }
  
  // ===== UTILITY FUNCTIONS DINÁMICAS =====
  
  private static calculateDynamicFontSize(element: string, density: string, productsPerPage: 4 | 6 | 9): string {
    const baseSizes = {
      alta: { header: '20px', productName: '14px', price: '16px' },
      media: { header: '24px', productName: '16px', price: '18px' },
      baja: { header: '28px', productName: '18px', price: '20px' }
    };
    
    const scaleMap = {
      4: 1.3,  // Más grande para 4 productos
      6: 1.0,  // Estándar para 6 productos
      9: 0.8   // Más pequeño para 9 productos
    };
    
    const baseSize = baseSizes[density as keyof typeof baseSizes]?.[element as keyof (typeof baseSizes)['alta']] || baseSizes.media[element as keyof (typeof baseSizes)['media']];
    const scale = scaleMap[productsPerPage];
    
    const numericSize = parseInt(baseSize.replace('px', ''));
    const scaledSize = Math.round(numericSize * scale);
    
    return `${scaledSize}px`;
  }
  
  private static getLayoutOptimization(productsPerPage: 4 | 6 | 9): string {
    const optimizations = {
      4: 'Large Cards (2x2) - Maximum Detail',
      6: 'Balanced Layout (3x2) - Standard',
      9: 'Compact Grid (3x3) - Maximum Content'
    };
    
    return optimizations[productsPerPage];
  }
  
  private static convertAuditedToIndustryTemplate(auditedTemplate: AuditedTemplate): IndustryTemplate {
    const converted = {
      id: auditedTemplate.id,
      name: auditedTemplate.displayName,
      displayName: auditedTemplate.displayName,
      description: auditedTemplate.description,
      industry: auditedTemplate.industry,
      density: auditedTemplate.density,
      productsPerPage: auditedTemplate.productsPerPage, // Se ajustará dinámicamente
      gridColumns: auditedTemplate.gridColumns, // Se ajustará dinámicamente
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

// ===== FUNCIONES DE CONVENIENCIA CON PRODUCTOS POR PÁGINA DINÁMICOS =====

/**
 * 🎯 FUNCIÓN PRINCIPAL CON PRODUCTOS POR PÁGINA DINÁMICOS
 */
export const generateCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  
  const productsPerPage = options.productsPerPage || 6;
  
  console.log(`🔍 VERIFICACIÓN CRÍTICA - Generando catálogo dinámico (${productsPerPage}/página):`, {
    totalProductos: products.length,
    productsPerPage,
    expectedPages: Math.ceil(products.length / productsPerPage),
    layoutOptimization: UnifiedCatalogGenerator['getLayoutOptimization'](productsPerPage)
  });
  
  return UnifiedCatalogGenerator.generateCatalog(products, businessInfo, templateId, userId, {
    qualityCheck: true,
    autoFix: true,
    usePuppeteerService: true,
    productsPerPage, // 🆕 PASAR PRODUCTOS POR PÁGINA
    ...(options as Record<string, unknown>)
  });
};

/**
 * 🚀 GENERACIÓN CON PUPPETEER DINÁMICO
 */
export const generatePuppeteerCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void,
  catalogTitle?: string,
  productsPerPage: 4 | 6 | 9 = 6 // 🆕 PARÁMETRO DINÁMICO
): Promise<GenerationResult> => {
  console.log(`🔍 DEBUG - generatePuppeteerCatalog dinámico recibió: ${productsPerPage}/página, título: ${catalogTitle}`);
  return generateCatalog(products, businessInfo, templateId, userId, {
    usePuppeteerService: true,
    useDynamicEngine: false,
    showProgress: !!onProgress,
    onProgress,
    qualityCheck: true,
    autoFix: true,
    catalogTitle,
    productsPerPage // 🆕 PASAR PRODUCTOS POR PÁGINA
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
  catalogTitle?: string,
  productsPerPage: 4 | 6 | 9 = 6 // 🆕 PARÁMETRO DINÁMICO
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    usePuppeteerService: false,
    useDynamicEngine: true,
    showProgress: !!onProgress,
    onProgress,
    qualityCheck: true,
    autoFix: true,
    catalogTitle,
    productsPerPage // 🆕 PASAR PRODUCTOS POR PÁGINA
  });
};

/**
 * 🎨 GENERACIÓN CLÁSICA DINÁMICA
 */
export const generateClassicCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void,
  catalogTitle?: string,
  productsPerPage: 4 | 6 | 9 = 6 // 🆕 PARÁMETRO DINÁMICO
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    forceClassicMode: true,
    showProgress: !!onProgress,
    onProgress,
    qualityCheck: true,
    autoFix: true,
    catalogTitle,
    productsPerPage // 🆕 PASAR PRODUCTOS POR PÁGINA
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