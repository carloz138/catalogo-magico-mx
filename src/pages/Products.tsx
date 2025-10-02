// /src/pages/Products.tsx - Componente Principal con Buscador Mejorado
import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useCatalogLimits } from '@/hooks/useCatalogLimits';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Componentes modulares
import { ProductCard } from '@/components/products/ProductCard';
import { BusinessInfoBanner, isBusinessInfoCompleteForCatalog } from '@/components/products/BusinessInfoBanner';
import { ProductModals } from '@/components/products/ProductModals';
import { useProductsLogic } from '@/hooks/useProductsLogic';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

import { 
  Package, 
  Search, 
  Scissors,
  Upload,
  Plus,
  Loader2,
  CheckCircle,
  Palette,
  AlertTriangle,
  BarChart3,
  ImageIcon,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';

const Products = () => {
  const {
    products,
    selectedProducts,
    loading,
    processing,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    showCatalogPreview,
    setShowCatalogPreview,
    showViewModal,
    setShowViewModal,
    selectedProduct,
    showBusinessInfoBanner,
    setShowBusinessInfoBanner,
    activeTab,
    filteredProducts,
    categories,
    stats,
    handleTabChange,
    toggleProductSelection,
    selectAllProducts,
    handleViewProduct,
    handleRemoveBackground,
    resetProcessingProducts,
    handleCreateCatalog,
    confirmCreateCatalog,
    handleDeleteProduct,
    confirmDeleteProduct,
    navigate,
    showDeleteConfirm,
    setShowDeleteConfirm,
    productToDelete
  } = useProductsLogic();

  const { 
    validation, 
    canGenerate,
    catalogsUsed,
    catalogsLimit 
  } = useCatalogLimits();

  const { businessInfo, loading: businessInfoLoading } = useBusinessInfo();
  const isBusinessInfoComplete = isBusinessInfoCompleteForCatalog(businessInfo);

  // Banner compacto de límites SOLO cuando sea crítico
  const LimitsAlert = () => {
    if (!validation) return null;
    const isAtCatalogLimit = !canGenerate;

    if (isAtCatalogLimit) {
      return (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900">
                  Límite de catálogos alcanzado ({catalogsUsed}/{catalogsLimit})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/checkout')}
                  className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                >
                  Upgrade
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/analytics')}
                  className="text-red-600 text-xs"
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Ver uso
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // Header explicativo
  const PageHeader = () => (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Mi Biblioteca de Productos
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              Gestiona tus productos, quita fondos automáticamente y crea catálogos profesionales
            </p>
            
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <Upload className="w-3 h-3 md:w-4 md:h-4" />
                <span>Subir fotos</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <div className="flex items-center gap-1">
                <Scissors className="w-3 h-3 md:w-4 md:h-4" />
                <span>Quitar fondo</span>
              </div>
              <ArrowRight className="w-3 h-3 text-gray-400" />
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
                <span>Crear catálogo</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Actions con buscador restaurado en el header
  const actions = (
    <div className="flex items-center gap-2">
      <div className={`items-center gap-2 ${selectedProducts.length > 0 ? 'hidden lg:flex' : 'flex'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, marca, categoría o etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-32 sm:w-40 lg:w-64"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="hidden md:block border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white min-w-[100px]"
        >
          <option value="all">Todas las categorías</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline"
            onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
            size="sm"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
            disabled={!canGenerate}
          >
            <BookOpen className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Crear Catálogo</span>
            <span className="sm:hidden">Catálogo</span>
            <span className="ml-1">({selectedProducts.length})</span>
          </Button>

          {activeTab === 'with-background' && (
            <Button 
              onClick={handleRemoveBackground} 
              disabled={processing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Scissors className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Quitar Fondo</span>
                  <span className="sm:hidden">Sin Fondo</span>
                  <span className="ml-1">({selectedProducts.length})</span>
                </>
              )}
            </Button>
          )}
          
          {activeTab === 'processing' && stats.processing > 0 && (
            <Button 
              onClick={resetProcessingProducts} 
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Resetear ({stats.processing})</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          )}
        </div>
      )}
      
      <Button onClick={() => navigate('/upload')} variant="outline" size="sm">
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Subir Fotos</span>
        <span className="sm:hidden">Subir</span>
      </Button>
      
      <Button 
        onClick={() => navigate('/products/bulk-upload')} 
        variant="outline" 
        size="sm"
        className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-600 text-green-700 hover:bg-green-100"
      >
        <Upload className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Carga Masiva</span>
        <span className="sm:hidden">Masiva</span>
      </Button>

      <Button 
        onClick={() => navigate('/analytics')} 
        variant="ghost" 
        size="sm"
        className="hidden lg:flex"
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Analytics
      </Button>

      <Button 
        onClick={() => navigate('/deleted-products')} 
        variant="ghost" 
        size="sm"
        className="hidden lg:flex"
      >
        <Package className="h-4 w-4 mr-2" />
        Papelera
      </Button>
    </div>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout actions={actions}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral/60">Cargando tu biblioteca...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout actions={actions}>
        <PageHeader />
        <LimitsAlert />
        
        {/* Banner de información del negocio */}
        {!businessInfoLoading && !isBusinessInfoComplete && showBusinessInfoBanner && (
          <BusinessInfoBanner onDismiss={() => setShowBusinessInfoBanner(false)} />
        )}

        {/* NUEVA SECCIÓN DE BÚSQUEDA removida - Buscador regresó al header */}
        
        
        {products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 md:py-12">
              <Package className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                Tu biblioteca está vacía
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-6">
                Comienza subiendo fotos de tus productos para crear catálogos increíbles
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => navigate('/upload')} className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Mis Productos
                </Button>
                <Button onClick={() => navigate('/analytics')} variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="with-background" className="relative px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Con Fondo</span>
                    <span className="sm:hidden">Con Fondo</span>
                    {stats.withBackground > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-orange-500">
                        {stats.withBackground}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="processing" className="relative px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Procesando</span>
                    {stats.processing > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-blue-500">
                        {stats.processing}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="no-background" className="relative px-2 py-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Sin Fondo</span>
                    <span className="sm:hidden">Sin Fondo</span>
                    {stats.noBackground > 0 && (
                      <Badge className="h-4 w-4 p-0 text-xs flex items-center justify-center bg-green-500">
                        {stats.noBackground}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="with-background" className="space-y-4">
                {stats.withBackground === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        Todos tus productos están listos
                      </h3>
                      <p className="text-sm text-gray-600">
                        No hay productos pendientes de quitar fondo
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-4">
                            <Button
                              variant={filteredProducts.length > 0 && selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length === filteredProducts.length ? "default" : "outline"}
                              size="sm"
                              onClick={selectAllProducts}
                              disabled={processing}
                              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {filteredProducts.length > 0 && selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length === filteredProducts.length
                                ? 'Deseleccionar Todo'
                                : 'Seleccionar Todo'
                              }
                            </Button>
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-gray-700">
                                <span className="font-semibold text-orange-700">
                                  {selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length} de {filteredProducts.length} seleccionados
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <HelpCircle className="w-3 h-3" />
                            <span>Productos con imagen original</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          handleViewProduct={handleViewProduct}
                          processing={processing}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="processing" className="space-y-4">
                {stats.processing === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Scissors className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        No hay productos procesándose
                      </h3>
                      <p className="text-sm text-gray-600">
                        Selecciona productos "Con Fondo" para quitar el fondo automáticamente
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex items-center gap-3">
                          <Scissors className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-blue-900 text-sm md:text-base">
                              {stats.processing} productos quitando fondo
                            </h4>
                            <p className="text-xs md:text-sm text-blue-700">
                              Nuestro sistema está trabajando automáticamente
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          handleViewProduct={handleViewProduct}
                          processing={true}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="no-background" className="space-y-4">
                {stats.noBackground === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">
                        Aún no tienes productos sin fondo
                      </h3>
                      <p className="text-sm text-gray-600">
                        Procesa algunos productos para verlos aquí con fondo transparente
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 md:gap-4">
                            <Button
                              variant={filteredProducts.length > 0 && selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length === filteredProducts.length ? "default" : "outline"}
                              size="sm"
                              onClick={selectAllProducts}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {filteredProducts.length > 0 && selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length === filteredProducts.length
                                ? 'Deseleccionar Todo'
                                : 'Seleccionar Todo'
                              }
                            </Button>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-700">
                                <span className="font-semibold text-green-700">
                                  {selectedProducts.filter(id => filteredProducts.map(p => p.id).includes(id)).length} de {filteredProducts.length} seleccionados
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                            <HelpCircle className="w-3 h-3" />
                            <span>Perfectos para crear catálogos profesionales</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          selectedProducts={selectedProducts}
                          toggleProductSelection={toggleProductSelection}
                          handleDeleteProduct={handleDeleteProduct}
                          handleViewProduct={handleViewProduct}
                          processing={false}
                        />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Modales */}
        <ProductModals 
          showViewModal={showViewModal}
          setShowViewModal={setShowViewModal}
          showCatalogPreview={showCatalogPreview}
          setShowCatalogPreview={setShowCatalogPreview}
          selectedProduct={selectedProduct}
          selectedProducts={selectedProducts}
          products={products}
          confirmCreateCatalog={confirmCreateCatalog}
        />

        {/* Modal de Confirmación de Eliminación */}
        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Eliminar Producto"
          description={productToDelete ? `¿Estás seguro de que quieres eliminar "${productToDelete.name}"? Esta acción no se puede deshacer.` : ''}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDeleteProduct}
          variant="destructive"
        />
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Products;