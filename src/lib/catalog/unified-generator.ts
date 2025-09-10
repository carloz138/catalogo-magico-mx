// src/lib/catalog/unified-generator.ts
// 🚀 GENERADOR UNIFICADO DE CATÁLOGOS CON TRACKING INTEGRADO

import { supabase } from '@/integrations/supabase/client';
import { IndustryTemplate, getTemplateById } from '@/lib/templates/industry-templates';
import { TemplateGenerator } from '@/lib/templates/css-generator';

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
}

interface UsageLimits {
  canGenerate: boolean;
  catalogsUsed: number;
  catalogsLimit: number | 'unlimited';
  remainingCatalogs: number;
  message: string;
}

export class UnifiedCatalogGenerator {
  
  /**
   * 🎯 FUNCIÓN PRINCIPAL - GENERA CATÁLOGO CON TRACKING COMPLETO
   */
  static async generateCatalog(
    products: Product[],
    businessInfo: BusinessInfo,
    templateId: string,
    userId: string
  ): Promise<GenerationResult> {
    
    try {
      console.log('🚀 Iniciando generación de catálogo:', { templateId, productCount: products.length });
      
      // 1. VALIDAR LÍMITES ANTES DE GENERAR
      const limitsCheck = await this.checkCatalogLimits(userId);
      if (!limitsCheck.canGenerate) {
        return {
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: limitsCheck.message
        };
      }
      
      // 2. VALIDAR TEMPLATE
      const template = getTemplateById(templateId);
      if (!template) {
        return {
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
          message: `Template ${templateId} no encontrado`
        };
      }
      
      // 3. VALIDAR PLAN PARA TEMPLATES PREMIUM
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
      
      // 4. GENERAR HTML DEL CATÁLOGO
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        products,
        businessInfo,
        template
      );
      
      // 5. GUARDAR EN BASE DE DATOS
      const catalogRecord = await this.saveCatalogRecord(
        userId,
        templateId,
        products,
        businessInfo,
        template
      );
      
      if (!catalogRecord.success) {
        return {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Error guardando catálogo en base de datos'
        };
      }
      
      // 6. ACTUALIZAR CONTADOR DE USO
      await this.updateCatalogUsage(userId);
      
      // 7. TRIGGER DESCARGA DEL PDF (opcional - solo en frontend)
      if (typeof window !== 'undefined') {
        this.downloadCatalogAsPDF(htmlContent, `catalogo-${businessInfo.business_name}`);
      }
      
      console.log('✅ Catálogo generado exitosamente:', catalogRecord.catalogId);
      
      return {
        success: true,
        catalogId: catalogRecord.catalogId,
        htmlContent,
        message: `Catálogo ${template.displayName} generado exitosamente`
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
   * 📊 VERIFICAR LÍMITES DE CATÁLOGOS DEL USUARIO
   */
  static async checkCatalogLimits(userId: string): Promise<UsageLimits> {
    try {
      const currentMonth = parseInt(
        new Date().getFullYear().toString() + 
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      );
      
      // Obtener suscripción activa y límites
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
      
      // Obtener uso actual del mes
      const { data: catalogUsage, error: usageError } = await (supabase as any)
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
  
  /**
   * 👑 VALIDAR ACCESO A TEMPLATES PREMIUM
   */
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
      
      // Asumir que packages que no son 'basic' o 'free' son premium
      const packageType = subscription.credit_packages?.package_type || 'basic';
      return packageType !== 'basic' && packageType !== 'free';
      
    } catch (error) {
      console.error('Error validating premium access:', error);
      return false;
    }
  }
  
  /**
   * 💾 GUARDAR REGISTRO DEL CATÁLOGO EN BASE DE DATOS
   */
  static async saveCatalogRecord(
    userId: string,
    templateId: string,
    products: Product[],
    businessInfo: BusinessInfo,
    template: IndustryTemplate
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
        credits_used: 0, // No usa créditos, solo cuenta hacia límite de catálogos
        currency: 'MXN'
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
   * 📈 ACTUALIZAR CONTADOR DE USO DE CATÁLOGOS
   */
  static async updateCatalogUsage(userId: string): Promise<void> {
    try {
      const currentMonth = parseInt(
        new Date().getFullYear().toString() + 
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      );
      
      // Intentar actualizar registro existente
      const { data: existingUsage, error: fetchError } = await (supabase as any)
        .from('catalog_usage')
        .select('id, catalogs_generated')
        .eq('user_id', userId)
        .eq('usage_month', currentMonth)
        .maybeSingle();
      
      if (existingUsage) {
        // Actualizar registro existente
        const { error: updateError } = await (supabase as any)
          .from('catalog_usage')
          .update({
            catalogs_generated: existingUsage.catalogs_generated + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUsage.id);
        
        if (updateError) {
          console.error('Error updating catalog usage:', updateError);
        }
      } else {
        // Crear nuevo registro para este mes
        const { error: insertError } = await (supabase as any)
          .from('catalog_usage')
          .insert({
            user_id: userId,
            usage_month: currentMonth,
            catalogs_generated: 1,
            uploads_used: 0
          });
        
        if (insertError) {
          console.error('Error creating catalog usage record:', insertError);
        }
      }
      
    } catch (error) {
      console.error('Error in updateCatalogUsage:', error);
    }
  }
  
  /**
   * 📄 DESCARGAR CATÁLOGO COMO PDF (SOLO FRONTEND)
   */
  static downloadCatalogAsPDF(htmlContent: string, filename: string): void {
    try {
      // Crear blob con el HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Crear link de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.html`;
      link.style.display = 'none';
      
      // Trigger descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      URL.revokeObjectURL(url);
      
      console.log('📄 Catálogo descargado como HTML');
      
    } catch (error) {
      console.error('Error downloading catalog:', error);
    }
  }
  
  /**
   * 📊 OBTENER ESTADÍSTICAS DE USO
   */
  static async getCatalogStats(userId: string): Promise<{
    totalCatalogs: number;
    thisMonth: number;
    lastMonth: number;
    topTemplates: Array<{ templateId: string; count: number; templateName: string }>;
  }> {
    
    try {
      const currentMonth = parseInt(
        new Date().getFullYear().toString() + 
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      );
      
      const lastMonth = parseInt(
        new Date().getFullYear().toString() + 
        (new Date().getMonth()).toString().padStart(2, '0')
      );
      
      // Obtener todos los catálogos del usuario
      const { data: catalogs, error } = await supabase
        .from('catalogs')
        .select('template_style, created_at')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching catalog stats:', error);
        return { totalCatalogs: 0, thisMonth: 0, lastMonth: 0, topTemplates: [] };
      }
      
      const totalCatalogs = catalogs?.length || 0;
      
      // Contar por mes
      const thisMonthCount = catalogs?.filter(c => {
        const catalogMonth = parseInt(new Date(c.created_at).toISOString().slice(0, 7).replace('-', ''));
        return catalogMonth === currentMonth;
      }).length || 0;
      
      const lastMonthCount = catalogs?.filter(c => {
        const catalogMonth = parseInt(new Date(c.created_at).toISOString().slice(0, 7).replace('-', ''));
        return catalogMonth === lastMonth;
      }).length || 0;
      
      // Top templates
      const templateCounts = catalogs?.reduce((acc, catalog) => {
        const templateId = catalog.template_style;
        acc[templateId] = (acc[templateId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const topTemplates = Object.entries(templateCounts)
        .map(([templateId, count]) => {
          const template = getTemplateById(templateId);
          return {
            templateId,
            count,
            templateName: template?.displayName || templateId
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      return {
        totalCatalogs,
        thisMonth: thisMonthCount,
        lastMonth: lastMonthCount,
        topTemplates
      };
      
    } catch (error) {
      console.error('Error getting catalog stats:', error);
      return { totalCatalogs: 0, thisMonth: 0, lastMonth: 0, topTemplates: [] };
    }
  }
}

// ===== FUNCIONES DE CONVENIENCIA =====

/**
 * 🎯 FUNCIÓN PRINCIPAL PARA USAR EN COMPONENTES
 */
export const generateCatalog = async (
  products: Product[],
  businessInfo: BusinessInfo,
  templateId: string,
  userId: string
): Promise<GenerationResult> => {
  return UnifiedCatalogGenerator.generateCatalog(products, businessInfo, templateId, userId);
};

/**
 * 📊 VERIFICAR LÍMITES (PARA USAR EN UI)
 */
export const checkLimits = async (userId: string): Promise<UsageLimits> => {
  return UnifiedCatalogGenerator.checkCatalogLimits(userId);
};

/**
 * 📈 OBTENER ESTADÍSTICAS (PARA DASHBOARD)
 */
export const getCatalogStats = async (userId: string) => {
  return UnifiedCatalogGenerator.getCatalogStats(userId);
};