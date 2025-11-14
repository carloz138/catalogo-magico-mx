import React, { useState, useEffect } from "react";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Componentes modulares
import { ProductCard } from "@/components/products/ProductCard";
import { BusinessInfoBanner, isBusinessInfoCompleteForCatalog } from "@/components/products/BusinessInfoBanner";
import { ProductModals } from "@/components/products/ProductModals";
import { useProductsLogic } from "@/hooks/useProductsLogic";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDebounce } from "@/hooks/useDebounce";

import {
  Package,
  Search,
  Scissors,
  Upload,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ImageIcon,
  Sparkles,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

const Products = () => {
  const {
    products,
    selectedProducts,
    loading,
    processing,
    setSearchTerm: setHookSearchTerm,
    activeTab,
    filteredProducts,
    stats,
    handleTabChange,
    toggleProductSelection,
    selectAllProducts,
    handleViewProduct,
    handleRemoveBackground,
    handleCreateCatalog,
    confirmCreateCatalog,
    handleDeleteProduct,
    confirmDeleteProduct,
    navigate,
    showDeleteConfirm,
    setShowDeleteConfirm,
    productToDelete,
  } = useProductsLogic();

  // --- Lógica de Búsqueda ---
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  useEffect(() => {
    setHookSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setHookSearchTerm]);

  // 👇 CORRECCIÓN AQUÍ: Solo traemos 'limits', 'canGenerate' y 'catalogsUsed'
  // Ya no pedimos 'validation' ni 'catalogsLimit' por separado
  const { limits, canGenerate, catalogsUsed } = useCatalogLimits();

  const { businessInfo, loading: businessInfoLoading } = useBusinessInfo();
  const isBusinessInfoComplete = isBusinessInfoCompleteForCatalog(businessInfo);

  // --- Detección de Nuevo Producto ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isNew = params.get("new");
    const name = params.get("name");

    if (isNew === "true" && name) {
      navigate(`/upload?name=${encodeURIComponent(name)}`);
    }
  }, []);

  // Banner de Límites
  const LimitsAlert = () => {
    // 👇 CORRECCIÓN: Usamos 'limits' en lugar de 'validation'
    if (!limits) return null;
    const isAtCatalogLimit = !canGenerate;

    if (isAtCatalogLimit) {
      return (
        <Card className="mb-3 sm:mb-4 border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-900">
                  {/* 👇 CORRECCIÓN: Accedemos a catalogsLimit a través de limits */}
                  Límite alcanzado ({catalogsUsed}/{limits.catalogsLimit})
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/checkout")}
                  className="flex-1 sm:flex-none border-red-300 text-red-700 hover:bg-red-100 text-xs h-9"
                >
                  Upgrade
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/analytics")}
                  className="flex-1 sm:flex-none text-red-600 text-xs h-9"
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

  // Header
  const PageHeader = () => (
    <div className="mb-4 sm:mb-6">
      <div className="mb-3 sm:mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Biblioteca de Productos</h1>
        <p className="text-sm sm:text-base text-gray-600">{products.length} productos en total</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-semibold text-orange-900">{stats.withBackground}</p>
                <p className="text-xs sm:text-sm text-orange-700 truncate">Con fondo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-semibold text-blue-900">{stats.processing}</p>
                <p className="text-xs sm:text-sm text-blue-700 truncate">Procesando</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-xl font-semibold text-green-900">{stats.noBackground}</p>
                <p className="text-xs sm:text-sm text-green-700 truncate">Sin fondo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Actions
  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="md:hidden flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="pl-8 h-10 text-sm"
          />
        </div>
        <Button onClick={() => navigate("/upload")} size="sm" className="bg-blue-600 hover:bg-blue-700 h-10 w-10 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="hidden md:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar productos..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="pl-9 w-64"
        />
      </div>

      {selectedProducts.length > 0 && (
        <div className="hidden md:flex items-center gap-2 border-l pl-2">
          <Badge variant="secondary" className="text-sm">
            {selectedProducts.length} seleccionados
          </Badge>

          <Button
            onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!canGenerate}
          >
            <Package className="h-4 w-4 mr-2" />
            Crear Catálogo
          </Button>

          {activeTab === "with-background" && (
            <Button
              onClick={handleRemoveBackground}
              disabled={processing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Quitar Fondo
            </Button>
          )}
        </div>
      )}

      <div className="hidden md:flex items-center gap-2 border-l pl-2">
        <Button onClick={() => navigate("/upload")} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Subir
        </Button>

        <Button
          onClick={() => navigate("/products/bulk-upload")}
          size="sm"
          variant="outline"
          className="border-green-600 text-green-700 hover:bg-green-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Masiva
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral/60">Cargando tu biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <PageHeader />
        {actions}
      </div>

      <LimitsAlert />

      {!businessInfoLoading && !isBusinessInfoComplete && showBusinessInfoBanner && (
        <BusinessInfoBanner onDismiss={() => setShowBusinessInfoBanner(false)} />
      )}

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6 sm:py-8">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Tu biblioteca está vacía</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Comienza subiendo fotos de tus productos</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <Button
                onClick={() => navigate("/upload")}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-11"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Productos
              </Button>
              <Button onClick={() => navigate("/analytics")} variant="outline" className="w-full sm:w-auto h-11">
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 h-auto mb-4">
              <TabsTrigger
                value="with-background"
                className="relative px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm min-h-[44px]"
              >
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Con Fondo</span>
                  {stats.withBackground > 0 && (
                    <Badge className="h-4 min-w-[16px] px-1 text-[10px] sm:text-xs bg-orange-500">
                      {stats.withBackground}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="processing"
                className="relative px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm min-h-[44px]"
              >
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Loader2 className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Procesando</span>
                  {stats.processing > 0 && (
                    <Badge className="h-4 min-w-[16px] px-1 text-[10px] sm:text-xs bg-blue-500">
                      {stats.processing}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="no-background"
                className="relative px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm min-h-[44px]"
              >
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Sparkles className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Sin Fondo</span>
                  {stats.noBackground > 0 && (
                    <Badge className="h-4 min-w-[16px] px-1 text-[10px] sm:text-xs bg-green-500">
                      {stats.noBackground}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="with-background" className="space-y-4">
              {stats.withBackground === 0 ? (
                <Card>
                  <CardContent className="text-center py-6 sm:py-8">
                    <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      Todos tus productos están listos
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">No hay productos pendientes de quitar fondo</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 sm:justify-between">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                          <Button
                            variant={
                              filteredProducts.length > 0 &&
                              selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length ===
                                filteredProducts.length
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={selectAllProducts}
                            disabled={processing}
                            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 h-11 w-full sm:w-auto text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {filteredProducts.length > 0 &&
                            selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length ===
                              filteredProducts.length
                              ? "Deseleccionar"
                              : "Seleccionar"}
                          </Button>

                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <ImageIcon className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-700">
                              <span className="font-semibold text-orange-700">
                                {selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length}{" "}
                                de {filteredProducts.length}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
                          <HelpCircle className="w-3 h-3" />
                          <span>Productos con imagen original</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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

            <TabsContent value="processing" className="space-y-4">
              {stats.processing === 0 ? (
                <Card>
                  <CardContent className="text-center py-6 sm:py-8">
                    <Scissors className="h-10 w-10 sm:h-12 sm:w-12 text-blue-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      No hay productos procesándose
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
                  <CardContent className="text-center py-6 sm:py-8">
                    <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-green-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      Aún no tienes productos sin fondo
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Procesa algunos productos para verlos aquí con fondo transparente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 sm:justify-between">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                          <Button
                            variant={
                              filteredProducts.length > 0 &&
                              selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length ===
                                filteredProducts.length
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={selectAllProducts}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 text-white border-green-600 h-11 w-full sm:w-auto text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {filteredProducts.length > 0 &&
                            selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length ===
                              filteredProducts.length
                              ? "Deseleccionar"
                              : "Seleccionar"}
                          </Button>
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-700">
                              <span className="font-semibold text-green-700">
                                {selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length}{" "}
                                de {filteredProducts.length}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
                          <HelpCircle className="w-3 h-3" />
                          <span>Perfectos para crear catálogos profesionales</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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

          {/* Action Bar Sticky Móvil */}
          {selectedProducts.length > 0 && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-40 safe-bottom">
              <div className="flex items-center gap-2 max-w-7xl mx-auto">
                <Badge variant="secondary" className="text-sm flex-shrink-0">
                  {selectedProducts.length}
                </Badge>

                <Button
                  onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 h-11"
                  disabled={!canGenerate}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Catálogo
                </Button>

                {activeTab === "with-background" && (
                  <Button
                    onClick={handleRemoveBackground}
                    disabled={processing}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 h-11"
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    Quitar Fondo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Spacer para action bar móvil */}
          {selectedProducts.length > 0 && <div className="md:hidden h-20" />}
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
        description={
          productToDelete
            ? `¿Estás seguro de que quieres eliminar "${productToDelete.name}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteProduct}
        variant="destructive"
      />
    </div>
  );
};

export default Products;
