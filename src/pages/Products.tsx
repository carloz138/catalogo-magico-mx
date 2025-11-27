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
} from "lucide-react";

import { ProductCard } from "@/components/products/ProductCard";
import { BusinessInfoBanner, isBusinessInfoCompleteForCatalog } from "@/components/products/BusinessInfoBanner";
import { ProductModals } from "@/components/products/ProductModals";
import { useProductsLogic } from "@/hooks/useProductsLogic";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type FilterType = "all" | "no-background" | "with-background";

const Products = () => {
  const {
    products,
    selectedProducts,
    loading,
    processing,
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

    if (activeFilter === "no-background") {
      result = result.filter((p) => !!p.processed_image_url && p.processed_image_url !== p.original_image_url);
    } else if (activeFilter === "with-background") {
      result = result.filter((p) => !p.processed_image_url || p.processed_image_url === p.original_image_url);
    }

    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lowerTerm));
    }

    return result;
  }, [products, activeFilter, searchTerm]);

  // Contadores
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true" && params.get("name")) {
      navigate(`/upload?name=${encodeURIComponent(params.get("name")!)}`);
    }
  }, []);

  // --- COMPONENTES UI OPTIMIZADOS ---

  const LimitsAlert = () => {
    if (!limits || canGenerate) return null;
    return (
      <div className="mb-4 px-4 md:px-0">
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                Límite alcanzado ({catalogsUsed}/{limits.catalogsLimit})
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/checkout")}
              className="w-full sm:w-auto h-8 text-xs bg-red-600 hover:bg-red-700 text-white border-0 ml-auto"
            >
              Mejorar Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // --- STATS HEADER (SCROLLABLE EN MÓVIL) ---
  const StatsHeader = () => (
    <div className="flex overflow-x-auto pb-4 gap-3 px-4 md:px-0 snap-x scrollbar-hide">
      {/* Card 1 */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-3 min-w-[160px] snap-center">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-orange-900 leading-none">{counts.withBg}</p>
          <p className="text-[10px] text-orange-700 font-medium uppercase mt-1">Originales</p>
        </div>
      </div>
      {/* Card 2 */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 min-w-[160px] snap-center">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-emerald-900 leading-none">{counts.noBg}</p>
          <p className="text-[10px] text-emerald-700 font-medium uppercase mt-1">Listos</p>
        </div>
      </div>
      {/* Card 3 (Procesando - Solo si hay) */}
      {stats.processing > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3 min-w-[160px] snap-center animate-pulse">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <p className="text-xl font-bold text-blue-900 leading-none">{stats.processing}</p>
            <p className="text-[10px] text-blue-700 font-medium uppercase mt-1">Procesando</p>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* 1. TOP BAR (FIXED ON MOBILE) */}
      <div className="bg-white border-b sticky top-0 z-30 pt-safe-top">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">Biblioteca</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/upload")}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm h-9 px-3 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Subir Fotos</span>
              <span className="sm:hidden">Subir</span>
            </Button>
            <Button
              onClick={() => navigate("/products/bulk-upload")}
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              title="Excel"
            >
              <Upload className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* 2. STICKY SEARCH & FILTERS BAR */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 px-4 md:px-8 overflow-x-auto scrollbar-hide">
          <div className="container mx-auto flex flex-col sm:flex-row gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  activeFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Todos ({counts.all})
              </button>
              <button
                onClick={() => setActiveFilter("no-background")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  activeFilter === "no-background"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="w-3 h-3" /> Listos ({counts.noBg})
              </button>
              <button
                onClick={() => setActiveFilter("with-background")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  activeFilter === "with-background"
                    ? "bg-orange-100 text-orange-800 border-orange-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ImageIcon className="w-3 h-3" /> Originales ({counts.withBg})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-6">
        {/* 3. STATS (SCROLLABLE) */}
        <StatsHeader />

        <div className="px-4 md:px-0 mt-4">
          <LimitsAlert />

          {!businessInfoLoading && !isBusinessInfoComplete && showBusinessInfoBanner && (
            <BusinessInfoBanner onDismiss={() => setShowBusinessInfoBanner(false)} />
          )}

          {/* 4. PRODUCT GRID (ADAPTIVE GAP) */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center mx-4 md:mx-0">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sin imágenes</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs">Sube tus fotos para empezar.</p>
              <Button onClick={() => navigate("/upload")} className="bg-indigo-600 hover:bg-indigo-700">
                <Upload className="h-4 w-4 mr-2" /> Subir Fotos
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay resultados.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
                className="text-indigo-600"
              >
                Ver todo
              </Button>
            </div>
          ) : (
            <>
              {/* Selection Helper Text */}
              {selectedProducts.length > 0 && (
                <div className="flex items-center justify-between mb-3 text-sm animate-in fade-in">
                  <span className="text-indigo-600 font-medium">{selectedProducts.length} seleccionados</span>
                  <button
                    onClick={selectAllProducts}
                    className="text-slate-500 hover:text-slate-800 underline decoration-dotted"
                  >
                    {selectedProducts.length === filteredProducts.length ? "Deseleccionar" : "Seleccionar todo"}
                  </button>
                </div>
              )}

              {/* THE GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
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
        </div>
      </div>

      {/* 5. FLOATING ACTION BAR (THUMB FRIENDLY) */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900/95 backdrop-blur text-white pl-4 pr-2 py-2 rounded-full shadow-2xl flex items-center justify-between gap-3 w-full max-w-md border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="bg-white text-slate-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">
                {selectedProducts.length}
              </div>
              <span className="text-sm font-medium">Items</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Botón Principal Grande */}
              <Button
                size="sm"
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-medium h-9 rounded-full px-4 shadow-lg shadow-indigo-500/20"
                onClick={() => handleCreateCatalog(isBusinessInfoComplete)}
                disabled={!canGenerate}
              >
                Crear Catálogo
              </Button>

              {/* Acciones Secundarias (Iconos) */}
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-slate-300 hover:text-white hover:bg-white/10 rounded-full"
                onClick={handleRemoveBackground}
                title="Quitar Fondo"
              >
                <Scissors className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-full"
                onClick={() => (productToDelete ? confirmDeleteProduct() : null)}
              >
                <span className="text-sm">🗑️</span>
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
