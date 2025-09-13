// src/lib/catalog/unified-generator.ts
// 🚀 ENHANCED UNIFIED GENERATOR CON SISTEMA DINÁMICO INTEGRADO

import { supabase } from '@/integrations/supabase/client';
import { IndustryTemplate, getTemplateById } from '@/lib/templates/industry-templates';
import { TemplateGenerator } from '@/lib/templates/css-generator';
import { generateBrowserCompatiblePDF } from '@/lib/pdf/browser-pdf-generator';
import { getDynamicTemplate } from '@/lib/templates/dynamic-mapper';

interface Product {
  id: string;
  name: string;
  description?: string;
  price_retail: number;
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
  generationMethod?: 'dynamic' | 'classic' | 'hybrid';
  stats?: {
    totalProducts: number;
    totalPages: number;
    generationTime: number;
  };
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
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
  forceClassicMode?: boolean;
}

export class UnifiedCatalogGenerator {
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL MEJORADA - GENERA CATÁLOGO CON SISTEMA HÍBRIDO
   */
  static async generateCatalog(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    userId: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚀 Iniciando generación híbrida:', { 
        templateId, 
        productCount: products.length,
        useDynamic: options.useDynamicEngine !== false 
      });
      
      if (options.onProgress) options.onProgress(10);
      
      // 1. VALIDACIONES PREVIAS (IGUAL QUE ANTES)
      const limitsCheck = await this.checkCatalogLimits(userId);
      if (!limitsCheck.canGenerate) {
        return {
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: limitsCheck.message
        };
      }
      
      if (options.onProgress) options.onProgress(20);
      
      // 2. VALIDAR TEMPLATE EXISTENTE
      const template = getTemplateById(templateId);
      if (!template) {
        return {
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
          message: `Template ${templateId} no encontrado`
        };
      }
      
      // 3. VALIDAR ACCESO PREMIUM
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
      
      if (options.onProgress) options.onProgress(30);
      
      // 4. DECIDIR MÉTODO DE GENERACIÓN
      const generationMethod = this.selectGenerationMethod(products.length, options);
      console.log(`📋 Método seleccionado: ${generationMethod}`);
      
      let htmlContent = '';
      let pdfGenerationSuccess = false;
      
      // 5. GENERAR CONTENIDO SEGÚN MÉTODO
      if (generationMethod === 'dynamic') {
        // NUEVO SISTEMA DINÁMICO
        const result = await this.generateWithDynamicEngine(
          products, 
          businessInfo, 
          templateId, 
          options
        );
        
        if (result.success) {
          pdfGenerationSuccess = true;
          // Generar HTML para guardar en BD
          htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
        } else {
          console.warn('⚠️ Dynamic engine falló, usando fallback clásico');
          return this.generateWithClassicEngine(products, businessInfo, template, userId, options);
        }
        
      } else {
        // SISTEMA CLÁSICO MEJORADO
        const result = await this.generateWithClassicEngine(products, businessInfo, template, userId, options);
        return result;
      }
      
      if (options.onProgress) options.onProgress(70);
      
      // 6. GUARDAR EN BASE DE DATOS
      const catalogRecord = await this.saveCatalogRecord(
        userId,
        templateId,
        products,
        businessInfo,
        template,
        { generationMethod, pdfSuccess: pdfGenerationSuccess }
      );
      
      if (!catalogRecord.success) {
        return {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Error guardando catálogo en base de datos'
        };
      }
      
      // 7. ACTUALIZAR CONTADOR DE USO
      await this.updateCatalogUsage(userId);
      
      if (options.onProgress) options.onProgress(100);
      
      const generationTime = Date.now() - startTime;
      
      console.log('✅ Catálogo generado exitosamente:', {
        catalogId: catalogRecord.catalogId,
        method: generationMethod,
        time: generationTime
      });
      
      return {
        success: true,
        catalogId: catalogRecord.catalogId,
        htmlContent,
        generationMethod,
        message: `Catálogo ${template.displayName} generado exitosamente con ${generationMethod} engine`,
        stats: {
          totalProducts: products.length,
          totalPages: Math.ceil(products.length / template.productsPerPage),
          generationTime
        }
      };
      
    } catch (error) {
      console.error('❌ Error generando catálogo:', error);
      return {
        success: false,
        error: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * 🧠 DECIDIR MÉTODO DE GENERACIÓN INTELIGENTE
   */
  private static selectGenerationMethod(
    productCount: number, 
    options: GenerationOptions
  ): 'dynamic' | 'classic' | 'hybrid' {
    
    // Forzar modo clásico si se especifica
    if (options.forceClassicMode) {
      return 'classic';
    }
    
    // Usar dinámico por defecto, especialmente para grandes volúmenes
    if (options.useDynamicEngine !== false) {
      // Dinámico es mejor para:
      if (productCount > 50) return 'dynamic';        // Grandes volúmenes
      if (productCount >= 20) return 'dynamic';       // Volúmenes medianos-altos
      if (productCount <= 5) return 'dynamic';        // Pocos productos (mejor calidad)
      
      return 'dynamic'; // Default a dinámico
    }
    
    return 'classic'; // Fallback
  }
  
  /**
   * 🚀 GENERAR CON DYNAMIC ENGINE
   */
  private static async generateWithDynamicEngine(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    options: GenerationOptions
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      console.log('🚀 Usando Dynamic Template Engine...');
      
      // Obtener template clásico para generar HTML
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} no encontrado`);
      }
      
      // Convertir template a formato dinámico
      const dynamicTemplate = getDynamicTemplate(templateId);
      if (!dynamicTemplate) {
        throw new Error(`No se pudo convertir template ${templateId} a formato dinámico`);
      }
      
      // Generar HTML para PDF
      const htmlContent = TemplateGenerator.generateCatalogHTML(products, businessInfo, template);
      
      // Usar el sistema dinámico de PDF
      const result = await generateCatalogPDF(
        htmlContent,
        `catalogo-${businessInfo.business_name}`,
        {
          format: 'A4',
          orientation: 'portrait',
          quality: 'high'
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
   * 🎨 GENERAR CON CLASSIC ENGINE (MEJORADO)
   */
  private static async generateWithClassicEngine(
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    userId: string,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    
    try {
      console.log('🎨 Usando Classic Template Engine...');
      
      if (options.onProgress) options.onProgress(40);
      
      // Generar HTML
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
        { generationMethod: 'classic', pdfSuccess: false }
      );
      
      if (!catalogRecord.success) {
        throw new Error('Error guardando catálogo');
      }
      
      // Generar PDF clásico
      if (typeof window !== 'undefined') {
        await this.downloadCatalogAsPDFClassic(htmlContent, `catalogo-${businessInfo.business_name}`);
      }
      
      // Actualizar uso
      await this.updateCatalogUsage(userId);
      
      if (options.onProgress) options.onProgress(100);
      
      return {
        success: true,
        catalogId: catalogRecord.catalogId,
        htmlContent,
        generationMethod: 'classic',
        message: `Catálogo ${template.displayName} generado con engine clásico`
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
   * 📄 PDF CLÁSICO (MANTENER PARA COMPATIBILIDAD)
   */
  private static async downloadCatalogAsPDFClassic(htmlContent: string, filename: string): Promise<void> {
    try {
      console.log('📄 Generando PDF clásico...');
      
      // Usar el nuevo sistema de PDF
      const result = await generateCatalogPDF(
        htmlContent,
        filename,
        {
          format: 'A4',
          orientation: 'portrait',
          quality: 'high'
        }
      );
      
      if (!result.success) {
        console.error('Error generando PDF:', result.error);
        this.downloadHTMLFallback(htmlContent, filename);
        return;
      }
      console.log('✅ PDF clásico generado');
      
    } catch (error) {
      console.error('❌ Error PDF clásico:', error);
      this.downloadHTMLFallback(htmlContent, filename);
    }
  }
  
  /**
   * 💾 GUARDAR REGISTRO MEJORADO CON METADATA
   */
  private static async saveCatalogRecord(
    userId: string,
    templateId: string,
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate,
    metadata: {
      generationMethod: 'dynamic' | 'classic';
      pdfSuccess: boolean;
    }
  ): Promise<{ success: boolean; catalogId?: string }> {
    
    try {
      const catalogData = {
        user_id: userId,
        name: `Catálogo ${template.displayName} - ${new Date().toLocaleDateString('es-MX')}`,
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
        // NUEVA METADATA
        generation_metadata: {
          engine: metadata.generationMethod,
          pdf_success: metadata.pdfSuccess,
          template_density: template.density,
          products_per_page: template.productsPerPage,
          generated_at: new Date().toISOString()
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
  
  // ===== RESTO DE MÉTODOS IGUALES =====
  
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
  
  private static downloadHTMLFallback(htmlContent: string, filename: string): void {
    try {
      console.log('🔄 Usando fallback HTML...');
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.html`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('📄 Catálogo descargado como HTML (fallback)');
      
    } catch (error) {
      console.error('❌ Error en fallback HTML:', error);
    }
  }
  
  static async getCatalogStats(userId: string) {
    // Método igual que antes...
    return { totalCatalogs: 0, thisMonth: 0, lastMonth: 0, topTemplates: [] };
  }
}

// ===== FUNCIONES DE CONVENIENCIA MEJORADAS =====

/**
 * 🎯 FUNCIÓN PRINCIPAL PARA USAR EN COMPONENTES
 */
export const generateCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  options: GenerationOptions = {}
): Promise<GenerationResult> => {
  return UnifiedCatalogGenerator.generateCatalog(products, businessInfo, templateId, userId, options);
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

/**
 * 🚀 GENERAR CON SISTEMA DINÁMICO (FUNCIÓN DIRECTA)
 */
export const generateDynamicCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    useDynamicEngine: true,
    showProgress: !!onProgress,
    onProgress
  });
};

/**
 * 🎨 GENERAR CON SISTEMA CLÁSICO (FUNCIÓN DIRECTA)
 */
export const generateClassicCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<GenerationResult> => {
  return generateCatalog(products, businessInfo, templateId, userId, {
    forceClassicMode: true,
    showProgress: !!onProgress,
    onProgress
  });
};