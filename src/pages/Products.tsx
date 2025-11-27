import React, { useState, useEffect, useMemo } from "react";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  X,
  Filter,
} from "lucide-react";

// Componentes modulares
import { ProductCard } from "@/components/products/ProductCard";
import { BusinessInfoBanner, isBusinessInfoCompleteForCatalog } from "@/components/products/BusinessInfoBanner";
import { ProductModals } from "@/components/products/ProductModals";
import { useProductsLogic } from "@/hooks/useProductsLogic";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useDebounce } from "@/hooks/useDebounce";

type FilterType = "all" | "no-background" | "with-background";

const Products = () => {
  const {
    products,
    selectedProducts,
    loading,
    processing,
    // setSearchTerm ya no lo usamos del hook para tener control total local
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
    showBusinessInfoBanner,
    setShowBusinessInfoBanner,
    showViewModal,
    setShowViewModal,
    showCatalogPreview,
    setShowCatalogPreview,
    selectedProduct,
  } = useProductsLogic();

  // --- ESTADOS LOCALES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // --- FILTRADO INTELIGENTE ---
  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Filtro por Estado (Tabs antiguos convertidos a lógica)
    if (activeFilter === "no-background") {
      result = result.filter((p) => !!p.processed_image_url && p.processed_image_url !== p.original_image_url);
    } else if (activeFilter === "with-background") {
      // Consideramos "con fondo" si no tiene procesada O si son iguales
      result = result.filter((p) => !p.processed_image_url || p.processed_image_url === p.original_image_url);
    }

    // 2. Filtro por Búsqueda
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lowerTerm));
    }

    return result;
  }, [products, activeFilter, searchTerm]);

  // Contadores para los filtros
  const counts = useMemo(() => {
    const noBg = products.filter(
      (p) => !!p.processed_image_url && p.processed_image_url !== p.original_image_url,
    ).length;
    const withBg = products.length - noBg;
    return { all: products.length, noBg, withBg };
  }, [products]);

  const { limits, canGenerate, catalogsUsed } = useCatalogLimits();
  const { businessInfo, loading: businessInfoLoading } = useBusinessInfo();
  const isBusinessInfoComplete = isBusinessInfoCompleteForCatalog(businessInfo);

  // --- Detección de Nuevo Producto (Redirect) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true" && params.get("name")) {
      navigate(`/upload?name=${encodeURIComponent(params.get("name")!)}`);
    }
  }, []);

  // --- ALERTAS ---
  const LimitsAlert = () => {
    if (!limits || canGenerate) return null;
    return (
      <Card className="mb-6 border-red-200 bg-red-50 shadow-sm animate-in slide-in-from-top-2">
        <CardContent className="p-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Límite de catálogos alcanzado ({catalogsUsed}/{limits.catalogsLimit})
            </span>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/analytics")}
              className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-100"
            >
              <BarChart3 className="w-3 h-3 mr-1.5" /> Uso
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/checkout")}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Mejorar Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Cargando tu galería...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 pb-32 min-h-screen bg-slate-50/30">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Biblioteca Visual</h1>
            <p className="text-gray-500 text-sm">Gestiona todas tus imágenes en un solo lugar.</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={() => navigate("/upload")}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm flex-1 md:flex-none"
            >
              <Plus className="h-4 w-4 mr-2" /> Subir Fotos
            </Button>
            <Button
              onClick={() => navigate("/products/bulk-upload")}
              variant="outline"
              className="flex-1 md:flex-none"
              title="Carga Masiva"
            >
              <Upload className="h-4 w-4 mr-2" /> Excel
            </Button>
          </div>
        </div>

        {/* TOOLBAR: SEARCH & FILTERS */}
        {products.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="hidden md:block w-px h-6 bg-gray-200"></div>

            {/* Filters (Pills) */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeFilter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Todos{" "}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === "all" ? "bg-slate-700" : "bg-slate-200"}`}
                >
                  {counts.all}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter("no-background")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeFilter === "no-background"
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Sin Fondo
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === "no-background" ? "bg-emerald-200" : "bg-slate-200"}`}
                >
                  {counts.noBg}
                </span>
              </button>
              <button
                onClick={() => setActiveFilter("with-background")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeFilter === "with-background"
                    ? "bg-orange-100 text-orange-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Originales
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === "with-background" ? "bg-orange-200" : "bg-slate-200"}`}
                >
                  {counts.withBg}
                </span>
              </button>
            </div>

            <div className="flex-1"></div>

            {/* Selection Info */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                <span className="text-sm font-medium text-slate-700">{selectedProducts.length} seleccionados</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllProducts}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  {selectedProducts.length === filteredProducts.length ? "Deseleccionar" : "Todos"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <LimitsAlert />

      {!businessInfoLoading && !isBusinessInfoComplete && showBusinessInfoBanner && (
        <BusinessInfoBanner onDismiss={() => setShowBusinessInfoBanner(false)} />
      )}

      {/* --- GRID DE PRODUCTOS --- */}
      {products.length === 0 ? (
        // EMPTY STATE GLOBAL
        <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Package className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Tu galería está vacía</h3>
          <p className="text-slate-500 max-w-md mb-8">Sube tus primeras fotos y nosotros nos encargamos del resto.</p>
          <Button onClick={() => navigate("/upload")} size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            <Upload className="h-5 w-5 mr-2" /> Subir Fotos
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        // EMPTY STATE BÚSQUEDA/FILTRO
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No encontramos productos con ese filtro.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchTerm("");
              setActiveFilter("all");
            }}
          >
            Limpiar filtros
          </Button>
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
              processing={processing} // Puedes ajustar lógica si ya no procesas visualmente
            />
          ))}
        </div>
      )}

      {/* --- FLOATING ACTION BAR (MOBILE & DESKTOP) --- */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
          <div className="bg-slate-900/95 backdrop-blur text-white p-3 rounded-full shadow-2xl flex items-center gap-4 border border-slate-700 animate-in slide-in-from-bottom-10">
            <div className="flex items-center gap-3 pl-2 border-r border-slate-700 pr-4">
              <span className="bg-white text-slate-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                {selectedProducts.length}
              </span>
              <span className="text-sm font-medium hidden sm:inline">Seleccionados</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold h-8 rounded-full px-4"
                onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
                disabled={!canGenerate}
              >
                Crear Catálogo
              </Button>

              {/* Solo mostrar Quitar Fondo si hay alguno con fondo seleccionado, o siempre si prefieres */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full"
                onClick={handleRemoveBackground}
                title="Quitar Fondo"
              >
                <Scissors className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full"
                onClick={() => (productToDelete ? confirmDeleteProduct() : null)} // Ajustar lógica de borrado masivo si existe
                title="Eliminar Selección"
              >
                {/* Nota: Tu hook usa `handleDeleteProduct` individual. 
                     Si quieres borrado masivo, necesitarás una función `handleBulkDelete` en el hook */}
                <span className="text-xs">🗑️</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
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
