import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, AlertTriangle, Image as ImageIcon, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { FileUploader } from '@/components/upload/FileUploader';
import { ProductForm, ProductData } from '@/components/upload/ProductForm';
import { analyzeImageQuality, ImageAnalysis } from '@/components/upload/ImageAnalysis';

type PriceDisplayMode = 'none' | 'retail' | 'both';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userCredits, setUserCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [priceDisplayMode, setPriceDisplayMode] = useState<PriceDisplayMode>('retail');
  
  // Estados para análisis de complejidad
  const [imageAnalyses, setImageAnalyses] = useState<Map<string, ImageAnalysis>>(new Map());
  const [totalEstimatedCredits, setTotalEstimatedCredits] = useState(0);

  // Smart validation function
  const getProductStatus = (product: ProductData, priceConfig: PriceDisplayMode) => {
    const hasName = product.name?.trim();
    const hasCategory = product.category?.trim();
    const hasRetail = product.price_retail && product.price_retail > 0;
    
    switch(priceConfig) {
      case 'none':
        return (hasName && hasCategory) ? 'complete' : 'incomplete';
      case 'retail':
        return (hasName && hasCategory && hasRetail) ? 'complete' : 'incomplete';
      case 'both':
        return (hasName && hasCategory && hasRetail) ? 'complete' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  const getPriceConfigLabel = () => {
    switch(priceDisplayMode) {
      case 'none': return 'Sin precios (solo productos)';
      case 'retail': return 'Solo precio de venta';
      case 'both': return 'Precio de venta + mayoreo';
      default: return '';
    }
  };

  const getConfigHelp = () => {
    switch(priceDisplayMode) {
      case 'none': return 'Perfecto para catálogos "Solicitar cotización"';
      case 'retail': return 'Ideal para venta directa al público';
      case 'both': return 'Completo para distribuidores B2B';
      default: return '';
    }
  };

  const getMissingFields = () => {
    switch(priceDisplayMode) {
      case 'none': return 'nombre y categoría';
      case 'retail': return 'nombre, categoría y precio de venta';
      case 'both': return 'nombre, categoría y precio de venta';
      default: return 'campos requeridos';
    }
  };

  // Status counts
  const completeCount = products.filter(p => getProductStatus(p, priceDisplayMode) === 'complete').length;
  const incompleteCount = products.length - completeCount;

  const StatusIcon = ({ status }: { status: string }) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'incomplete': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const canSaveToLibrary = () => {
    return products.length > 0 && products.every(product => 
      getProductStatus(product, priceDisplayMode) === 'complete'
    );
  };

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

  const handleFilesUploaded = async (files: any[]) => {
    console.log('Files uploaded:', files);
    setUploadedFiles(files);
    
    // Analizar complejidad de cada imagen
    const analyses = new Map<string, ImageAnalysis>();
    let totalCredits = 0;
    
    for (const file of files) {
      try {
        const analysis = await analyzeImageQuality(file.file, file.name, 'Ropa y Textiles');
        analyses.set(file.id, analysis);
        totalCredits += analysis.estimatedCredits;
      } catch (error) {
        console.error(`Error analyzing ${file.name}:`, error);
        // Fallback analysis con todas las propiedades requeridas
        const fallbackAnalysis: ImageAnalysis = {
          complexityScore: 50,
          confidence: 60,
          recommendedApi: 'pixelcut',
          estimatedCredits: 1,
          estimatedCost: 0.20,
          reasoning: 'Análisis simplificado aplicado por precaución',
          tips: ['📸 Use fondo uniforme para mejores resultados'],
          breakdown: { 
            category: 50, 
            semantic: 50, 
            visual: 50, 
            context: 50 
          },
          savingsVsRemoveBg: 95
        };
        analyses.set(file.id, fallbackAnalysis);
        totalCredits += 1;
      }
    }
    
    setImageAnalyses(analyses);
    setTotalEstimatedCredits(totalCredits);
    
    // Crear productos con análisis incluido
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
      smart_analysis: analyses.get(file.id)
    }));
    
    setProducts(newProducts);
  };

  const updateProduct = (updatedProduct: ProductData) => {
    setProducts(prev => prev.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
  };

  const saveToLibrary = async () => {
    if (!canSaveToLibrary()) {
      toast({
        title: "Productos incompletos",
        description: `Por favor completa los ${incompleteCount} productos marcados en rojo`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Validate products before insertion
      const validateProduct = (product: ProductData) => {
        if (!user?.id) return 'Missing user_id';
        if (!product.name || product.name.trim() === '') return 'Missing product name';
        if (!product.original_image_url) return 'Missing image URL';
        return null;
      };

      const validationErrors = products.map(validateProduct).filter(Boolean);
      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors);
        toast({
          title: "Error de validación",
          description: "Algunos productos tienen campos faltantes",
          variant: "destructive",
        });
        return;
      }

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
        credits_used: 0,
        service_type: 'basic',
        // Guardar análisis inteligente
        smart_analysis: product.smart_analysis ? JSON.stringify(product.smart_analysis) : null,
        estimated_credits: product.smart_analysis?.estimatedCredits || 1,
        estimated_cost_mxn: product.smart_analysis?.estimatedCost || 0.20
      }));

      console.log('Inserting products:', productInserts);

      const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(productInserts)
        .select('id, name, original_image_url');

      if (insertError) {
        console.error('Detailed Supabase error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      toast({
        title: "¡Éxito!",
        description: `✅ ${products.length} productos guardados en tu biblioteca`,
      });

      // Clear the form
      setProducts([]);
      setUploadedFiles([]);
      setImageAnalyses(new Map());
      setTotalEstimatedCredits(0);

    } catch (error) {
      console.error('Error saving products to library:', error);
      toast({
        title: "Error",
        description: "Hubo un error al guardar tus productos. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBuyCredits = () => {
    navigate('/checkout');
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-2"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Inicio</span>
                  <span className="sm:hidden">Volver</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">C</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-primary">Subir Productos</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="text-sm">
                  <span className="text-neutral/60">Créditos: </span>
                  <span className="font-bold text-primary text-lg">{userCredits}</span>
                </div>
                {userCredits < 50 && (
                  <Button variant="outline" size="sm" onClick={handleBuyCredits} className="flex-shrink-0">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Comprar más</span>
                    <span className="sm:hidden">Comprar</span>
                  </Button>
                )}
                {/* ✅ BOTÓN CENTRO DE IMÁGENES */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/image-review')}
                  className="border-secondary text-secondary hover:bg-secondary/10 flex-shrink-0"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Centro de Imágenes</span>
                  <span className="sm:hidden">Centro</span>
                </Button>
                {/* ✅ BOTÓN PRODUCTOS */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/products')}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 flex-shrink-0"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Productos</span>
                  <span className="sm:hidden">Productos</span>
                </Button>
                <div className="text-sm text-neutral/60 hidden lg:block">
                  ¡Hola {user?.email?.split('@')[0]}!
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral mb-4">
              Agrega productos a tu biblioteca
            </h1>
            <p className="text-lg sm:text-xl text-neutral/70">
              Sube las fotos de tus productos y guárdalos gratis. Después podrás crear catálogos con tus productos guardados.
            </p>
          </div>

          {/* Pricing Configuration */}
          <Card className="p-4 mb-6 bg-blue-50">
            <CardContent className="p-0">
              <h3 className="font-semibold mb-3">Configuración de Catálogo</h3>
              <div className="space-y-2 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="priceDisplay" 
                    value="none"
                    checked={priceDisplayMode === 'none'}
                    onChange={(e) => setPriceDisplayMode(e.target.value as PriceDisplayMode)}
                    className="mr-2"
                  />
                  <span>Sin precios (solo productos)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="priceDisplay" 
                    value="retail"
                    checked={priceDisplayMode === 'retail'}
                    onChange={(e) => setPriceDisplayMode(e.target.value as PriceDisplayMode)}
                    className="mr-2"
                  />
                  <span>Solo precio de venta</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="priceDisplay" 
                    value="both"
                    checked={priceDisplayMode === 'both'}
                    onChange={(e) => setPriceDisplayMode(e.target.value as PriceDisplayMode)}
                    className="mr-2"
                  />
                  <span>Precio de venta + mayoreo</span>
                </label>
              </div>
              <p className="text-sm text-blue-700 italic">{getConfigHelp()}</p>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <div className="mb-8">
            <FileUploader 
              onFilesUploaded={handleFilesUploaded}
              maxFiles={10}
            />
          </div>

          {/* Análisis de Complejidad Summary */}
          {imageAnalyses.size > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">🧠 Análisis de Complejidad</h3>
              <div className="grid grid-cols-2 gap-4 text-center mb-3">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalEstimatedCredits}</div>
                  <div className="text-sm text-gray-600">Créditos estimados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    Optimizado
                  </div>
                  <div className="text-sm text-gray-600">Procesamiento inteligente</div>
                </div>
              </div>
              
              {/* Lista de productos con análisis */}
              <div className="space-y-2">
                {uploadedFiles.map(file => {
                  const analysis = imageAnalyses.get(file.id);
                  return analysis ? (
                    <div key={file.id} className="flex justify-between items-center bg-white rounded p-2 text-sm">
                      <span className="truncate">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          analysis.complexityScore >= 75 ? 'bg-red-100 text-red-700' :
                          analysis.complexityScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {analysis.complexityScore}/100
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {analysis.recommendedApi === 'removebg' ? 'Premium' : 'Estándar'}
                          </span>
                          <span className="text-gray-600">{analysis.estimatedCredits} crédito{analysis.estimatedCredits > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
              
              {/* Resumen por tipo de procesamiento */}
              {uploadedFiles.length > 1 && (
                <div className="mt-4 pt-3 border-t border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded p-2">
                      <div className="font-medium text-green-700">💰 Procesamiento Estándar</div>
                      <div className="text-gray-600">
                        {Array.from(imageAnalyses.values()).filter(a => a.recommendedApi === 'pixelcut').length} productos
                        · {Array.from(imageAnalyses.values()).filter(a => a.recommendedApi === 'pixelcut').reduce((sum, a) => sum + a.estimatedCredits, 0)} créditos
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="font-medium text-blue-700">🎯 Procesamiento Premium</div>
                      <div className="text-gray-600">
                        {Array.from(imageAnalyses.values()).filter(a => a.recommendedApi === 'removebg').length} productos
                        · {Array.from(imageAnalyses.values()).filter(a => a.recommendedApi === 'removebg').reduce((sum, a) => sum + a.estimatedCredits, 0)} créditos
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2 text-sm text-gray-600">
                    <strong>Total: {totalEstimatedCredits} créditos</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Summary */}
          {products.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                Estado de los Productos
                {canSaveToLibrary() ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                )}
              </h4>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {completeCount} productos completos
                </p>
                {incompleteCount > 0 && (
                  <p className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {incompleteCount} productos necesitan: {getMissingFields()}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Configuración: {getPriceConfigLabel()}
                </p>
              </div>
            </div>
          )}

          {/* Product Forms */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-6 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-center">
                Completa los datos de tus productos
              </h2>
              <div className="grid gap-6">
                {products.map((product, index) => {
                  const correspondingFile = uploadedFiles.find(f => f.id === product.id);
                  const status = getProductStatus(product, priceDisplayMode);
                  
                  return (
                    <div key={product.id} className="relative">
                      <div className="absolute -top-2 -right-2 z-10">
                        <StatusIcon status={status} />
                      </div>
                      <ProductForm
                        product={product}
                        imageUrl={correspondingFile?.preview || correspondingFile?.url || product.original_image_url}
                        onUpdate={updateProduct}
                        priceDisplayMode={priceDisplayMode}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save to Library Button */}
          {uploadedFiles.length > 0 && (
            <div className="mb-8 space-y-4">
              <Button 
                size="lg" 
                className={`w-full py-4 text-lg sm:text-xl ${
                  canSaveToLibrary() 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                disabled={!canSaveToLibrary() || saving}
                onClick={saveToLibrary}
              >
                {saving ? (
                  'Guardando...'
                ) : canSaveToLibrary() ? (
                  `Guardar ${uploadedFiles.length} productos en mi biblioteca (Gratis)`
                ) : (
                  'Completa productos marcados en rojo'
                )}
              </Button>
              
              {canSaveToLibrary() && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate('/products')}>
                    <Users className="w-4 h-4 mr-2" />
                    Ver mis productos
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/image-review')}
                    className="border-secondary text-secondary hover:bg-secondary/10"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Centro de Imágenes
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Subir más productos
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 3-Step Process Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <h3 className="font-semibold text-neutral mb-2">Guarda en biblioteca</h3>
              <p className="text-sm text-neutral/70">
                Gratis y sin límites para organizar tus productos
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-neutral mb-2">Crea catálogos</h3>
              <p className="text-sm text-neutral/70">
                Selecciona productos y crea catálogos profesionales
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Upload;
