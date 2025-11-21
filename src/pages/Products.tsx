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
    // Variables recuperadas del hook
    showBusinessInfoBanner,
    setShowBusinessInfoBanner,
    showViewModal,
    setShowViewModal,
    showCatalogPreview,
    setShowCatalogPreview,
    selectedProduct,
  } = useProductsLogic();

  // --- Lógica de Búsqueda Optimizada ---
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  useEffect(() => {
    setHookSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setHookSearchTerm]);

  const { limits, canGenerate, catalogsUsed } = useCatalogLimits();
  const { businessInfo, loading: businessInfoLoading } = useBusinessInfo();
  const isBusinessInfoComplete = isBusinessInfoCompleteForCatalog(businessInfo);

  // --- Detección de Nuevo Producto (Redirect) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isNew = params.get("new");
    const name = params.get("name");

    if (isNew === "true" && name) {
      navigate(`/upload?name=${encodeURIComponent(name)}`);
    }
  }, []);

  // --- COMPONENTE: ALERTA DE LÍMITES ---
  const LimitsAlert = () => {
    if (!limits) return null;
    const isAtCatalogLimit = !canGenerate;

    if (isAtCatalogLimit) {
      return (
        <Card className="mb-4 border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Límite de catálogos alcanzado ({catalogsUsed}/{limits.catalogsLimit})
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/analytics")}
                className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 h-8 text-xs"
              >
                <BarChart3 className="w-3 h-3 mr-1.5" /> Uso
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/checkout")}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white border-0 h-8 text-xs"
              >
                Mejorar Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  // --- COMPONENTE: HEADER CON KPIS ---
  const PageHeader = () => (
    <div className="mb-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Biblioteca Visual</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tus imágenes y procesa fondos con IA.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI: Con Fondo */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-900 leading-none">{stats.withBackground}</p>
            <p className="text-xs text-orange-700 font-medium uppercase mt-1">Originales</p>
          </div>
        </div>

        {/* KPI: Procesando */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900 leading-none">{stats.processing}</p>
            <p className="text-xs text-blue-700 font-medium uppercase mt-1">Procesando</p>
          </div>
        </div>

        {/* KPI: Sin Fondo */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-900 leading-none">{stats.noBackground}</p>
            <p className="text-xs text-emerald-700 font-medium uppercase mt-1">Listos</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- ACTIONS TOOLBAR ---
  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
      {/* Mobile Search */}
      <div className="md:hidden flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
        <Button
          onClick={() => navigate("/upload")}
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 shrink-0"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Search & Actions */}
      <div className="hidden md:flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar producto..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="pl-9 bg-white border-gray-200 focus:border-indigo-500"
          />
        </div>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3 ml-1">
          {selectedProducts.length > 0 && (
            <>
              <Badge
                variant="secondary"
                className="h-9 px-3 flex items-center justify-center bg-slate-100 text-slate-700 border-slate-200"
              >
                {selectedProducts.length} selec.
              </Badge>

              <Button
                onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9"
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
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 h-9"
                >
                  <Scissors className="h-4 w-4 mr-2" />
                  Quitar Fondo
                </Button>
              )}
            </>
          )}

          <Button onClick={() => navigate("/upload")} size="sm" className="bg-slate-900 hover:bg-slate-800 h-9">
            <Plus className="h-4 w-4 mr-2" />
            Subir
          </Button>

          <Button
            onClick={() => navigate("/products/bulk-upload")}
            size="sm"
            variant="outline"
            className="h-9"
            title="Carga Masiva"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Cargando tu galería...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 pb-24 min-h-screen bg-slate-50/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
        <PageHeader />
        {actions}
      </div>

      <LimitsAlert />

      {!businessInfoLoading && !isBusinessInfoComplete && showBusinessInfoBanner && (
        <BusinessInfoBanner onDismiss={() => setShowBusinessInfoBanner(false)} />
      )}

      {products.length === 0 ? (
        // EMPTY STATE GENERAL
        <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Package className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Tu galería está vacía</h3>
          <p className="text-slate-500 max-w-md mb-8">
            Comienza subiendo las fotos de tus productos. Nosotros nos encargamos de quitarles el fondo automáticamente.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/upload")}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            >
              <Upload className="h-5 w-5 mr-2" /> Subir Fotos
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur pt-2 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
              <TabsList className="w-full h-auto p-1 bg-slate-200/50 rounded-xl grid grid-cols-3">
                <TabsTrigger
                  value="with-background"
                  className="py-2.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    Con Fondo
                    {stats.withBackground > 0 && (
                      <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                        {stats.withBackground}
                      </span>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="processing"
                  className="py-2.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    Procesando
                    {stats.processing > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                        {stats.processing}
                      </span>
                    )}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="no-background"
                  className="py-2.5 rounded-lg text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    Listos
                    {stats.noBackground > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                        {stats.noBackground}
                      </span>
                    )}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[400px]">
              {/* TAB 1: CON FONDO */}
              <TabsContent value="with-background" className="mt-0">
                {stats.withBackground === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-500">Todo limpio. No hay imágenes pendientes.</p>
                  </div>
                ) : (
                  <>
                    {/* Selection Header (Inline) */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllProducts}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -ml-2"
                        >
                          {filteredProducts.length > 0 &&
                          selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length ===
                            filteredProducts.length
                            ? "Deseleccionar todo"
                            : "Seleccionar todo"}
                        </Button>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-500">
                          {selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length}{" "}
                          seleccionados
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

              {/* TAB 2: PROCESANDO */}
              <TabsContent value="processing" className="mt-0">
                {stats.processing === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay tareas en proceso.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                )}
              </TabsContent>

              {/* TAB 3: SIN FONDO */}
              <TabsContent value="no-background" className="mt-0">
                {stats.noBackground === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Procesa tus imágenes para verlas aquí.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllProducts}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 -ml-2"
                        >
                          {filteredProducts.length > 0 &&
                          selectedProducts.filter((id) => filteredProducts.map((p) => p.id).includes(id)).length ===
                            filteredProducts.length
                            ? "Deseleccionar todo"
                            : "Seleccionar todo"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            </div>
          </Tabs>

          {/* STICKY ACTION BAR (MOBILE) */}
          <div
            className={`md:hidden fixed bottom-4 left-4 right-4 z-50 transition-transform duration-300 ${selectedProducts.length > 0 ? "translate-y-0" : "translate-y-[150%]"}`}
          >
            <div className="bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
              <div className="flex-1 flex items-center gap-3">
                <div className="bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedProducts.length}
                </div>
                <span className="text-sm font-medium">Seleccionados</span>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "with-background" && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                    onClick={handleRemoveBackground}
                    disabled={processing}
                  >
                    <Scissors className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-white text-slate-900 hover:bg-slate-100 font-semibold"
                  onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
                  disabled={!canGenerate}
                >
                  Crear Catálogo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES & DIALOGOS */}
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

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="¿Eliminar imagen?"
        description={productToDelete ? `Se eliminará permanentemente "${productToDelete.name}".` : ""}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteProduct}
        variant="destructive"
      />
    </div>
  );
};

export default Products;
