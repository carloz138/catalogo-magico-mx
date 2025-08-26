
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, UsageValidation } from '@/lib/subscriptionService';
import { Save, Zap, Loader2, Package } from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  analysis?: any;
  productData?: any;
}

interface FinalStepProps {
  files: UploadedFile[];
}

export const FinalStepComponent = ({ files }: FinalStepProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usageValidation, setUsageValidation] = useState<UsageValidation | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsageValidation();
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

  const handleSaveToLibrary = async () => {
    if (!user || files.length === 0) return;

    setSaving(true);
    try {
      console.log(`💾 Guardando ${files.length} productos en biblioteca...`);

      // Guardar cada archivo como producto sin procesamiento
      for (const file of files) {
        const productData = file.productData || {};
        
        const { error } = await supabase
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
            original_image_url: file.url || file.preview,
            processing_status: 'pending',
            is_processed: false,
            has_variants: productData.has_variants || false,
            variant_count: productData.variant_count || 0,
          });

        if (error) {
          console.error(`Error guardando producto ${file.id}:`, error);
          throw error;
        }
      }

      toast({
        title: "¡Productos guardados!",
        description: `${files.length} productos agregados a tu biblioteca`,
        variant: "default",
      });

      // Navegar a la biblioteca
      navigate('/products');

    } catch (error) {
      console.error('Error guardando productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los productos",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndProcess = async () => {
    if (!user || files.length === 0) return;

    // Validar créditos antes de procesar
    if (!usageValidation?.canProcessBackground) {
      toast({
        title: "Sin créditos disponibles",
        description: "Necesitas créditos para quitar fondos. Guarda en biblioteca y compra créditos después.",
        variant: "destructive",
      });
      return;
    }

    if (usageValidation.remainingBgCredits < files.length) {
      toast({
        title: "Créditos insuficientes",
        description: `Necesitas ${files.length} créditos, pero solo tienes ${usageValidation.remainingBgCredits}.`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Primero guardar en biblioteca
      await handleSaveToLibrary();
      
      // Luego navegar a productos para que el usuario pueda procesar
      toast({
        title: "¡Productos guardados!",
        description: `Ve a tu biblioteca para procesar las ${files.length} imágenes`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error en guardar y procesar:', error);
    } finally {
      setProcessing(false);
    }
  };

  const canProcess = usageValidation?.canProcessBackground && usageValidation.remainingBgCredits >= files.length;

  return (
    <div className="space-y-6">
      <PlanStatusBanner />
      
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              ¡{files.length} productos listos!
            </h3>
            <p className="text-gray-600">
              Elige cómo quieres continuar con tus imágenes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción 1: Guardar sin procesar */}
            <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-4 text-center">
                <Save className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Guardar en Biblioteca</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Guarda tus productos con imágenes originales. Podrás crear catálogos inmediatamente o procesar después.
                </p>
                <Button 
                  onClick={handleSaveToLibrary} 
                  disabled={saving || processing}
                  variant="outline"
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar {files.length} Productos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Opción 2: Guardar y procesar */}
            <Card className={`border-2 transition-colors ${
              canProcess 
                ? 'border-blue-200 hover:border-blue-300 bg-blue-50' 
                : 'border-gray-100 bg-gray-50'
            }`}>
              <CardContent className="p-4 text-center">
                <Zap className={`h-8 w-8 mx-auto mb-3 ${
                  canProcess ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <h4 className="font-semibold mb-2">Guardar y Procesar</h4>
                <p className="text-sm text-gray-600 mb-4">
                  {canProcess 
                    ? `Guarda y remueve fondos automáticamente (${files.length} créditos)`
                    : 'Requiere créditos para quitar fondos'
                  }
                </p>
                <Button 
                  onClick={handleSaveAndProcess}
                  disabled={!canProcess || processing || saving}
                  className="w-full"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      {canProcess ? `Procesar ${files.length} Imágenes` : 'Sin Créditos'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            💡 <strong>Tip:</strong> Puedes crear catálogos profesionales con imágenes originales o procesadas
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
