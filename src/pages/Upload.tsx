import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { FileUploader } from '@/components/upload/FileUploader';
import { ProductForm, ProductData } from '@/components/upload/ProductForm';
import { CostCalculator } from '@/components/upload/CostCalculator';

type PriceDisplayMode = 'none' | 'retail' | 'both';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [priceDisplayMode, setPriceDisplayMode] = useState<PriceDisplayMode>('retail');

  const CREDITS_PER_PRODUCT = 15;

  useEffect(() => {
    fetchUserCredits();
  }, [user]);

  const fetchUserCredits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserCredits(data?.credits || 0);
    } catch (error) {
      console.error('Error fetching user credits:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus créditos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (files: any[]) => {
    console.log('Files uploaded:', files);
    setUploadedFiles(files);
    
    // Create product data for each successfully uploaded file
    const newProducts = files.map(file => ({
      id: file.id,
      name: '',
      sku: '',
      price_retail: 0,
      price_wholesale: undefined,
      wholesale_min_qty: 12,
      category: '',
      custom_description: '',
      original_image_url: file.url,
    }));
    
    setProducts(newProducts);
  };

  const updateProduct = (updatedProduct: ProductData) => {
    setProducts(prev => prev.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
  };

  const validateProducts = () => {
    const invalidProducts = products.filter(product => {
      // Always require name and category
      if (!product.name || !product.category) return true;
      
      // Price validation based on display mode
      if (priceDisplayMode === 'retail' && !product.price_retail) return true;
      if (priceDisplayMode === 'both') {
        if (!product.price_retail) return true;
        // Wholesale price is optional even in 'both' mode, but if provided, min qty is required
        if (product.price_wholesale && !product.wholesale_min_qty) return true;
      }
      
      return false;
    });
    
    return invalidProducts;
  };

  const getValidationMessage = () => {
    switch (priceDisplayMode) {
      case 'none':
        return 'Por favor completa el nombre y categoría de todos los productos';
      case 'retail':
        return 'Por favor completa el nombre, precio de venta y categoría de todos los productos';
      case 'both':
        return 'Por favor completa el nombre, precio de venta y categoría de todos los productos';
      default:
        return 'Por favor completa todos los campos obligatorios';
    }
  };

  const handleProcessCatalog = async () => {
    if (products.length === 0) return;

    // Validate required fields based on price display mode
    const invalidProducts = validateProducts();
    if (invalidProducts.length > 0) {
      toast({
        title: "Campos requeridos",
        description: getValidationMessage(),
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const totalCreditsNeeded = products.length * CREDITS_PER_PRODUCT;
      
      // Check credits again
      if (userCredits < totalCreditsNeeded) {
        toast({
          title: "Créditos insuficientes",
          description: `Necesitas ${totalCreditsNeeded - userCredits} créditos adicionales`,
          variant: "destructive",
        });
        return;
      }

      // Insert products into database with pricing configuration
      const productInserts = products.map(product => ({
        user_id: user!.id,
        name: product.name,
        sku: product.sku || null,
        price_retail: (priceDisplayMode !== 'none' && product.price_retail) ? Math.round(product.price_retail * 100) : null,
        price_wholesale: (priceDisplayMode === 'both' && product.price_wholesale) ? Math.round(product.price_wholesale * 100) : null,
        wholesale_min_qty: product.wholesale_min_qty || null,
        category: product.category,
        custom_description: product.custom_description || null,
        original_image_url: product.original_image_url,
        processing_status: 'pending',
        credits_used: CREDITS_PER_PRODUCT,
      }));

      const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(productInserts)
        .select('id');

      if (insertError) throw insertError;

      // Deduct credits from user
      const { error: creditError } = await supabase
        .from('users')
        .update({ credits: userCredits - totalCreditsNeeded })
        .eq('id', user!.id);

      if (creditError) throw creditError;

      // Record credit usage
      const { error: usageError } = await supabase
        .from('credit_usage')
        .insert({
          user_id: user!.id,
          credits_used: totalCreditsNeeded,
          credits_remaining: userCredits - totalCreditsNeeded,
          usage_type: 'product_processing',
          description: `Procesamiento de ${products.length} productos`,
        });

      if (usageError) throw usageError;

      toast({
        title: "¡Éxito!",
        description: "Tus productos se están procesando. Te notificaremos cuando estén listos.",
      });

      // Redirect to progress page
      navigate('/progress');

    } catch (error) {
      console.error('Error processing catalog:', error);
      toast({
        title: "Error",
        description: "Hubo un error al procesar tu catálogo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBuyCredits = () => {
    navigate('/credits');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral/60">Cargando...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Inicio</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="text-xl font-bold text-primary">Subir Productos</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-neutral/60">Créditos disponibles: </span>
                <span className="font-bold text-primary text-lg">{userCredits}</span>
              </div>
              {userCredits < 50 && (
                <Button variant="outline" size="sm" onClick={handleBuyCredits}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Comprar más
                </Button>
              )}
              <div className="text-sm text-neutral/60">
                ¡Hola {user?.email}!
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral mb-4">
              Transforma tus productos en catálogos profesionales
            </h1>
            <p className="text-xl text-neutral/70">
              Sube las fotos de tus productos y nosotros haremos la magia
            </p>
          </div>

          {/* File Upload Section */}
          <div className="mb-8">
            <FileUploader 
              onFilesUploaded={handleFilesUploaded}
              maxFiles={10}
            />
          </div>

          {/* Product Forms */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-6 mb-8">
              <h2 className="text-2xl font-bold text-center">
                Completa los datos de tus productos
              </h2>
              <div className="grid gap-6">
                {products.map((product, index) => {
                  const correspondingFile = uploadedFiles.find(f => f.id === product.id);
                  return (
                    <ProductForm
                      key={product.id}
                      product={product}
                      imageUrl={correspondingFile?.preview || correspondingFile?.url || product.original_image_url}
                      onUpdate={updateProduct}
                      priceDisplayMode={priceDisplayMode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Large CTA Button */}
          {uploadedFiles.length > 0 && (
            <div className="mb-8">
              <Button 
                size="lg" 
                className="w-full bg-primary text-white py-4 text-xl"
                disabled={userCredits < (uploadedFiles.length * 15)}
                onClick={handleProcessCatalog}
              >
                ¡Crear mi catálogo profesional! ({uploadedFiles.length * 15} créditos)
              </Button>
            </div>
          )}

          {/* Cost Calculator */}
          <CostCalculator
            productCount={products.length}
            creditsPerProduct={CREDITS_PER_PRODUCT}
            userCredits={userCredits}
            onProcessCatalog={handleProcessCatalog}
            onBuyCredits={handleBuyCredits}
            processing={processing}
          />

          {/* 3-Step Process Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-secondary">1</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">Sube tus fotos</h3>
              <p className="text-sm text-neutral/70">
                No importa si son de celular o con mala luz
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-accent">2</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">Completa los datos</h3>
              <p className="text-sm text-neutral/70">
                Nombre y precio del producto
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">¡Listo!</h3>
              <p className="text-sm text-neutral/70">
                En 10 minutos tienes tu catálogo profesional
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Upload;
