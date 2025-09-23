import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, UsageValidation } from '@/lib/subscriptionService';
import { Save, Zap, Loader2, Package, CheckCircle, Palette } from 'lucide-react';

    export interface UploadedFile {
      id: string;
      file: File;
      preview: string;
      url?: string;
      analysis?: any;
      productData?: any;
      // 🎯 NUEVO: URLs optimizadas
      optimizedUrls?: {
        thumbnail: string;
        catalog: string;
        luxury: string;
        print: string;
      };
    }

interface FinalStepProps {
  files: UploadedFile[];
}

export const FinalStepComponent = ({ files }: FinalStepProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usageValidation, setUsageValidation] = useState<UsageValidation | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadUsageValidation();
      // Auto-guardar al montar el componente
      handleAutoSave();
    }
  }, [user]);

  const loadUsageValidation = async () => {
    if (!user) return;
    
    try {
      const validation = await subscriptionService.validateUsage(user.id);
      setUsageValidation(validation);
    } catch (error) {
      console.error('Error loading usage validation:', error);
    }
  };

// FUNCIÓN ACTUALIZADA: Auto-guardado con URLs optimizadas
const handleAutoSave = async () => {
  if (!user || files.length === 0 || autoSaved) return;

  setAutoSaving(true);
  try {
    console.log(`💾 Auto-guardando ${files.length} productos con URLs optimizadas...`);

    const savedProductsData = [];

    for (const file of files) {
      const productData = file.productData || {};
      
      console.log(`💾 Guardando producto con URLs:`, {
        original: file.url,
        optimized: file.optimizedUrls,
        hasOptimizedUrls: !!file.optimizedUrls,
        originalUrl: file.url?.substring(0, 50) + '...',
        thumbnailUrl: file.optimizedUrls?.thumbnail?.substring(0, 50) + '...',
        catalogUrl: file.optimizedUrls?.catalog?.substring(0, 50) + '...',
        luxuryUrl: file.optimizedUrls?.luxury?.substring(0, 50) + '...',
        printUrl: file.optimizedUrls?.print?.substring(0, 50) + '...',
        willUseCatalogForPDF: !!file.optimizedUrls?.catalog
      });
      
      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: productData.name || `Producto ${file.id.slice(-6)}`,
          description: productData.description || '',
          custom_description: productData.custom_description || '',
          price_retail: productData.price_retail ? Math.round(productData.price_retail * 100) : null,
          price_wholesale: productData.price_wholesale ? Math.round(productData.price_wholesale * 100) : null,
          category: productData.category || '',
          brand: productData.brand || '',
          // URLs originales y optimizadas
          original_image_url: file.url || file.preview,
          thumbnail_image_url: file.optimizedUrls?.thumbnail || null,
          catalog_image_url: file.optimizedUrls?.catalog || null,
          luxury_image_url: file.optimizedUrls?.luxury || null,
          print_image_url: file.optimizedUrls?.print || null,
          processing_status: 'pending',
          is_processed: false,
          has_variants: productData.has_variants || false,
          variant_count: productData.variant_count || 0,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error guardando producto ${file.id}:`, error);
        throw error;
      }

      // 🎯 VALIDACIÓN CRÍTICA POST-GUARDADO
      console.log(`✅ PRODUCT SAVED SUCCESSFULLY - ${insertedProduct.name}:`, {
        id: insertedProduct.id,
        catalog_image_url: insertedProduct.catalog_image_url ? '✅ SAVED' : '❌ NULL',
        thumbnail_image_url: insertedProduct.thumbnail_image_url ? '✅ SAVED' : '❌ NULL',
        luxury_image_url: insertedProduct.luxury_image_url ? '✅ SAVED' : '❌ NULL',
        print_image_url: insertedProduct.print_image_url ? '✅ SAVED' : '❌ NULL',
        optimizationStatus: insertedProduct.catalog_image_url ? 'READY FOR LIGHT PDF' : 'WILL USE HEAVY IMAGES',
        estimatedPDFWeight: insertedProduct.catalog_image_url ? '~100KB per product' : '~5MB per product'
      });

      // 🎯 ACTUALIZADO: Usar catalog_image_url si existe, sino original
      savedProductsData.push({
        ...insertedProduct,
        image_url: insertedProduct.catalog_image_url || insertedProduct.original_image_url
      });
    }

    setSavedProducts(savedProductsData);
    setAutoSaved(true);

    // 🎯 RESUMEN FINAL DE OPTIMIZACIÓN
    const optimizedCount = files.filter(f => f.optimizedUrls).length;
    const totalWithCatalogUrls = savedProductsData.filter(p => p.catalog_image_url).length;
    
    console.log(`🎊 AUTO-SAVE COMPLETED:`, {
      totalProducts: files.length,
      productsWithOptimizedUrls: optimizedCount,
      productsWithCatalogUrls: totalWithCatalogUrls,
      percentageOptimized: `${Math.round((totalWithCatalogUrls / files.length) * 100)}%`,
      expectedPDFWeight: totalWithCatalogUrls > 0 ? `LIGHT (~${totalWithCatalogUrls * 100}KB)` : `HEAVY (~${files.length * 5}MB)`,
      optimizationSuccess: totalWithCatalogUrls === files.length
    });
    
    toast({
      title: "¡Productos guardados!",
      description: `${files.length} productos agregados - ${optimizedCount} con versiones optimizadas para PDFs súper ligeros`,
      variant: "default",
    });

  } catch (error) {
    console.error('Error en auto-guardado:', error);
    toast({
      title: "Error guardando productos",
      description: "Hubo un problema al guardar automáticamente. Intenta de nuevo.",
      variant: "destructive",
    });
  } finally {
    setAutoSaving(false);
  }
};

  const handleProcessImages = async () => {
    if (!autoSaved || savedProducts.length === 0) {
      toast({
        title: "Productos no guardados",
        description: "Espera a que se complete el guardado automático",
        variant: "destructive",
      });
      return;
    }

    // Validar créditos
    if (!usageValidation?.canProcessBackground) {
      toast({
        title: "Sin créditos disponibles",
        description: "Necesitas comprar créditos para quitar fondos",
        variant: "destructive",
      });
      return;
    }

    if (usageValidation.remainingBgCredits < savedProducts.length) {
      toast({
        title: "Créditos insuficientes",
        description: `Necesitas ${savedProducts.length} créditos, pero solo tienes ${usageValidation.remainingBgCredits}`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      toast({
        title: "Productos guardados",
        description: `Ve a tu biblioteca para procesar las ${savedProducts.length} imágenes cuando quieras`,
        variant: "default",
      });

      // Navegar a productos con tab de "Por Procesar"
      navigate('/products?tab=pending');

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateCatalog = async () => {
    if (!autoSaved || savedProducts.length === 0) {
      toast({
        title: "Productos no guardados",
        description: "Espera a que se complete el guardado automático",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📋 Creando catálogo con productos guardados:', savedProducts);

      // Navegar directamente a template-selection
      navigate('/template-selection', {
        state: {
          products: savedProducts,
          businessInfo: {
            business_name: 'Mi Empresa'
          },
          skipProcessing: true
        }
      });

    } catch (error) {
      console.error('Error preparando catálogo:', error);
      toast({
        title: "Error",
        description: "No se pudo preparar el catálogo",
        variant: "destructive",
      });
    }
  };

  const canProcess = usageValidation?.canProcessBackground && usageValidation.remainingBgCredits >= files.length;

  // Banner de estado de plan
  const PlanStatusBanner = () => {
    if (!usageValidation) return null;

    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">
                📋 {usageValidation.currentPlan}
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>📤 Subidas restantes: {usageValidation.remainingUploads}</p>
                <p>✨ Créditos para fondos: {usageValidation.remainingBgCredits}</p>
                <p>📋 Catálogos restantes: {usageValidation.remainingCatalogs}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PlanStatusBanner />
      
      {/* Banner de guardado automático */}
      {autoSaving && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">
                  Guardando productos automáticamente...
                </h4>
                <p className="text-sm text-blue-700">
                  Agregando {files.length} productos a tu biblioteca
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de guardado exitoso */}
      {autoSaved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-semibold text-green-900">
                  ¡{files.length} productos guardados en tu biblioteca!
                </h4>
                <p className="text-sm text-green-700">
                  Ahora puedes procesarlos o crear catálogos directamente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              ¿Qué quieres hacer ahora?
            </h3>
            <p className="text-gray-600">
              Tus productos están guardados. Elige tu siguiente paso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opción 1: Ver biblioteca */}
            <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4 text-center">
                <Save className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Ver Biblioteca</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Administra tus productos, agregar más información o procesar después
                </p>
                <Button 
                  onClick={() => navigate('/products?tab=pending')} 
                  disabled={!autoSaved}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Ver Productos
                </Button>
              </CardContent>
            </Card>

            {/* Opción 2: Procesar ahora */}
            <Card className={`border-2 transition-colors ${
              canProcess && autoSaved
                ? 'border-blue-200 hover:border-blue-300 bg-blue-50' 
                : 'border-gray-100 bg-gray-50'
            }`}>
              <CardContent className="p-4 text-center">
                <Zap className={`h-8 w-8 mx-auto mb-3 ${
                  canProcess && autoSaved ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <h4 className="font-semibold mb-2">Procesar Ahora</h4>
                <p className="text-sm text-gray-600 mb-4">
                  {canProcess 
                    ? `Quitar fondos inmediatamente (${files.length} créditos)`
                    : 'Requiere créditos para quitar fondos'
                  }
                </p>
                <Button 
                  onClick={handleProcessImages}
                  disabled={!canProcess || !autoSaved || processing}
                  className="w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirigiendo...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {canProcess && autoSaved ? 'Ir a Procesar' : 'Sin Créditos'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Opción 3: Crear catálogo directo */}
            <Card className={`border-2 transition-colors ${
              autoSaved
                ? 'border-purple-200 hover:border-purple-300 bg-purple-50'
                : 'border-gray-100 bg-gray-50'
            }`}>
              <CardContent className="p-4 text-center">
                <Palette className={`h-8 w-8 mx-auto mb-3 ${
                  autoSaved ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <h4 className="font-semibold mb-2">Crear Catálogo</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Usa las imágenes originales para crear un catálogo profesional ahora mismo
                </p>
                <Button 
                  onClick={handleCreateCatalog}
                  disabled={!autoSaved}
                  variant="default"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Crear Catálogo
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            💡 <strong>Tip:</strong> Los catálogos se ven profesionales tanto con imágenes originales como procesadas
          </div>
        </CardContent>
      </Card>
    </div>
  );
};