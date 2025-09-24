// src/lib/storage/pdf-uploader.ts
import { supabase } from '@/integrations/supabase/client';

export class PDFStorageManager {
  
  /**
   * 🎯 SUBIR PDF A SUPABASE STORAGE
   */
  static async uploadPDFToStorage(
    pdfBlob: Blob, 
    catalogId: string, 
    businessName: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    
    try {
      const filename = `catalog-${catalogId}-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const filePath = `catalogs/${catalogId}/${filename}`;
      
      console.log('📤 Subiendo PDF a Supabase Storage:', { 
        catalogId, 
        filename, 
        size: pdfBlob.size 
      });
      
      // 1. SUBIR ARCHIVO A STORAGE
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('catalogs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        console.error('❌ Error subiendo PDF:', uploadError);
        return { success: false, error: uploadError.message };
      }
      
      // 2. OBTENER URL PÚBLICA
      const { data: urlData } = supabase.storage
        .from('catalogs')
        .getPublicUrl(filePath);
      
      if (!urlData?.publicUrl) {
        return { success: false, error: 'No se pudo obtener URL pública' };
      }
      
      console.log('✅ PDF subido correctamente:', urlData.publicUrl);
      return { success: true, url: urlData.publicUrl };
      
    } catch (error) {
      console.error('❌ Error en uploadPDFToStorage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }
  
  /**
   * 🔄 ACTUALIZAR REGISTRO CON URL DEL PDF (SIMPLIFICADO)
   */
  static async updateCatalogWithPDFUrl(
    catalogId: string, 
    pdfUrl: string, 
    additionalMetadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    
    console.log('🔄 [CRITICO] Actualizando catálogo con PDF URL:', { 
      catalogId, 
      pdfUrl: pdfUrl.substring(0, 50) + '...',
      hasMetadata: !!additionalMetadata 
    });
    
    try {
      // Preparar datos de actualización de forma más directa
      const updateData: any = {
        pdf_url: pdfUrl,
        file_size_bytes: additionalMetadata?.pdf_size_bytes || null,
        total_pages: additionalMetadata?.total_pages || 1,
        generation_metadata: {
          pdf_uploaded_at: new Date().toISOString(),
          pdf_upload_success: true,
          generation_method: additionalMetadata?.generation_method || 'fallback',
          ...additionalMetadata
        }
      };
      
      console.log('💾 [CRITICO] Ejecutando UPDATE con datos:', {
        catalogId,
        pdf_url_set: !!updateData.pdf_url,
        file_size: updateData.file_size_bytes,
        total_pages: updateData.total_pages
      });
      
      // Actualización directa más simple
      const { data, error } = await supabase
        .from('catalogs')
        .update(updateData)
        .eq('id', catalogId)
        .select();
      
      if (error) {
        console.error('❌ [CRITICO] Error en UPDATE Supabase:', error);
        return { success: false, error: error.message };
      }
      
      if (!data || data.length === 0) {
        console.error('❌ [CRITICO] No se encontró el catálogo para actualizar:', catalogId);
        return { success: false, error: 'Catálogo no encontrado' };
      }
      
      console.log('✅ [CRITICO] Catálogo actualizado exitosamente:', {
        id: data[0].id,
        pdf_url_updated: !!data[0].pdf_url,
        pdf_url_preview: data[0].pdf_url?.substring(0, 50) + '...'
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ [CRITICO] Exception en updateCatalogWithPDFUrl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error actualizando catálogo' 
      };
    }
  }
  
  /**
   * 🎯 PROCESO COMPLETO: SUBIR Y ACTUALIZAR
   */
  static async saveAndLinkPDF(
    pdfBlob: Blob,
    catalogId: string, 
    businessName: string,
    additionalMetadata?: any
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    
    // 1. SUBIR PDF
    const uploadResult = await this.uploadPDFToStorage(pdfBlob, catalogId, businessName);
    
    if (!uploadResult.success || !uploadResult.url) {
      return uploadResult;
    }
    
    // 2. ACTUALIZAR REGISTRO
    const updateResult = await this.updateCatalogWithPDFUrl(
      catalogId, 
      uploadResult.url,
      additionalMetadata
    );
    
    if (!updateResult.success) {
      return { 
        success: false, 
        error: `PDF subido pero falló actualización: ${updateResult.error}` 
      };
    }
    
    return { success: true, url: uploadResult.url };
  }
  
  /**
   * 📱 DESCARGA LOCAL (MANTENER FUNCIONALIDAD EXISTENTE)
   */
  static async downloadPDFLocally(pdfBlob: Blob, businessName: string): Promise<void> {
    try {
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const filename = `catalogo-${businessName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
      
      console.log('✅ PDF descargado localmente:', filename);
      
    } catch (error) {
      console.error('❌ Error descargando PDF:', error);
      throw new Error('Error descargando PDF');
    }
  }
}