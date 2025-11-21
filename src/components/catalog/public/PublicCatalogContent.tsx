// src/components/catalog/public/PublicCatalogContent.tsx
// (CORREGIDO: BUSCADOR VISIBLE + LÓGICA "SMART ADD" EN BOTÓN MAS)

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Search, ShoppingCart, Radar, DollarSign, Plus, ChevronDown, Minus, X, Eye, Filter, Check } from "lucide-react";
import { DigitalCatalog } from "@/types/digital-catalog";
import { QuoteCartModal } from "@/components/public/QuoteCartModal";
import { QuoteForm } from "@/components/public/QuoteForm";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuoteCart } from "@/contexts/QuoteCartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ProductFilters from "@/components/public/ProductFilters";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import { WebTemplateAdapter } from "@/lib/templates/web-css-adapter";

// --- TIPOS ---
interface Product {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  price_retail: number;
  price_wholesale?: number | null;
  wholesale_min_qty?: number | null;
  category?: string | null;
  tags?: string[];
  image_url?: string;
  original_image_url?: string | null;
  has_variants?: boolean;
  variants?: Array<{
    id: string;
    price_retail: number;
    attributes: Record<string, string>;
  }>;
}

interface PublicCatalogContentProps {
  catalog: DigitalCatalog & { isReplicated?: boolean; resellerId?: string };
  onTrackEvent: (event: string, data?: any) => void;
}

// --- ANIMACIONES ---
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// --- COMPONENTE: MODAL IMAGEN GRANDE ---
const ProductImageZoomModal = ({
  product,
  isOpen,
  onClose,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!product) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
        <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
          <div className="w-full md:w-2/3 bg-slate-100 flex items-center justify-center relative aspect-square md:aspect-auto">
            <img
              src={product.image_url || product.original_image_url || "/placeholder.png"}
              alt={product.name}
              className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh]"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/50 text-white hover:bg-black/70 rounded-full backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="w-full md:w-1/3 p-6 bg-white flex flex-col justify-center">
            <h3 className="text-xl font-bold text-slate-900 leading-tight">{product.name}</h3>
            {product.sku && <span className="text-xs font-mono text-slate-400 mt-1">SKU: {product.sku}</span>}
            <div className="my-4 w-full h-px bg-slate-100" />
            <p className="text-slate-600 text-sm leading-relaxed">
              {product.description || "Sin descripción detallada."}
            </p>
            <div className="mt-6">
              <span className="text-2xl font-bold text-slate-900 block">
                ${(product.price_retail / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENTE: TARJETA DE PRODUCTO (Lógica "Smart Add" Aplicada) ---
const PublicProductCard = ({
  product,
  onAdd,
  onView,
  onZoomImage,
}: {
  product: Product;
  onAdd: () => void;
  onView: () => void;
  onZoomImage: () => void;
}) => {
  const price = product.price_retail ? product.price_retail / 100 : 0;
  const hasVariants = product.has_variants || (product.variants && product.variants.length > 0);

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer h-full select-none"
      onClick={onView} // 👈 Un solo clic AHORA SOLO ABRE DETALLE (Ver)
      onDoubleClick={(e) => {
        // 👈 Doble clic AGREGA (Acción Rápida)
        e.stopPropagation();
        onAdd();
      }}
    >
      {/* Imagen Container */}
      <div className="aspect-[4/3] md:aspect-square bg-slate-50 relative overflow-hidden">
        {product.image_url || product.original_image_url ? (
          <img
            src={product.image_url || product.original_image_url || ""}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

        {/* Acciones Rápidas (Overlay) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoomImage();
          }}
          className="absolute top-3 right-3 h-8 w-8 bg-white/90 backdrop-blur text-slate-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 transition-all duration-300 hover:text-indigo-600 z-20"
          title="Ampliar imagen"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Botón Add (EL BOTÓN + MÁGICO) */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita que se abra el detalle al dar clic en +
            onAdd(); // Ejecuta la "Venta Inteligente"
          }}
          className="absolute bottom-3 right-3 h-10 w-10 md:h-11 md:w-11 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-slate-200/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-300 hover:bg-indigo-600 hover:text-white z-20 active:scale-95"
          title="Agregar al carrito"
        >
          <Plus className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* Info Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          {product.category && (
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">
              {product.category}
            </span>
          )}
          <h3 className="font-medium text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900">${price.toFixed(2)}</span>
          </div>
          {hasVariants && (
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-600 font-normal text-[10px] px-2 hover:bg-slate-200"
            >
              + Opciones
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export function PublicCatalogContent({ catalog, onTrackEvent }: PublicCatalogContentProps) {
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [radarForm, setRadarForm] = useState({ name: "", email: "", product: "", quantity: "1" });

  // Contexto Carrito
  const { addItem, items, clearCart, totalAmount } = useQuoteCart();

  // Estados Selección
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [productToZoom, setProductToZoom] = useState<Product | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // --- LÓGICA TEMPLATES ---
  const activeTemplate = useMemo(
    () => EXPANDED_WEB_TEMPLATES.find((t) => t.id === catalog.web_template_id) || EXPANDED_WEB_TEMPLATES[0],
    [catalog.web_template_id],
  );

  const templateCSS = useMemo(() => {
    let css = WebTemplateAdapter.generateWebCSS(activeTemplate, catalog.background_pattern);
    if (catalog.brand_colors?.primary) {
      css += `
            :root {
                --primary: ${catalog.brand_colors.primary} !important;
                --primary-foreground: #ffffff !important;
                --radius: ${activeTemplate.config.cardRadius === "full" ? "1.5rem" : "0.75rem"};
            }
            .bg-primary { background-color: var(--primary) !important; }
            .text-primary { color: var(--primary) !important; }
            .border-primary { border-color: var(--primary) !important; }
            .ring-primary { --tw-ring-color: var(--primary) !important; }
        `;
    }
    return css;
  }, [activeTemplate, catalog.background_pattern, catalog.brand_colors]);

  const gridColumnsClass = useMemo(() => {
    const cols = activeTemplate.config.columnsDesktop || 3;
    return `lg:grid-cols-${cols}`;
  }, [activeTemplate]);

  const { allTags, minPrice, maxPrice } = useMemo(() => {
    const prods = (catalog.products || []) as unknown as Product[];
    const tagsSet = new Set<string>();
    const prices: number[] = [];

    prods.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) product.tags.forEach((tag) => tagsSet.add(tag));
      const price = product.price_retail ? product.price_retail / 100 : 0;
      if (price > 0) prices.push(price);
    });

    return {
      allTags: Array.from(tagsSet).sort(),
      minPrice: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
      maxPrice: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 100,
    };
  }, [catalog.products]);

  const filteredProducts = useMemo(() => {
    const prods = (catalog.products || []) as unknown as Product[];
    return prods.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? product.category === selectedCategory : true;

      let matchesTags = true;
      if (selectedTags.length > 0) {
        const productTags = (product.tags || []) as string[];
        matchesTags = selectedTags.some((tag) => productTags.includes(tag));
      }

      const price = product.price_retail ? product.price_retail / 100 : 0;
      const min = priceRange.min ? parseFloat(priceRange.min) : 0;
      const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      const matchesPrice = price >= min && price <= max;

      return matchesSearch && matchesCategory && matchesPrice && matchesTags;
    });
  }, [catalog.products, searchTerm, selectedCategory, priceRange, selectedTags]);

  const categories = Array.from(new Set(catalog.products?.map((p) => p.category).filter(Boolean) as string[]));

  // --- SEARCH LOGS ---
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 2) {
      const logSearch = async () => {
        await supabase.from("search_logs").insert({
          catalog_id: catalog.id,
          search_term: debouncedSearch,
          results_count: filteredProducts.length,
          user_id: catalog.user_id,
        });
      };
      logSearch();
      onTrackEvent("Search", { search_string: debouncedSearch });
    }
  }, [debouncedSearch, filteredProducts.length, catalog.id, catalog.user_id, onTrackEvent]);

  // --- HANDLERS (NUEVA LÓGICA SEPARADA) ---

  // 1. Solo Ver Detalle (Clic en tarjeta)
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariantId(null);
    setQuantity(1);
    onTrackEvent("ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      value: (product.price_retail || 0) / 100,
      currency: "MXN",
    });
  };

  // 2. Agregar Inteligente (Botón + o Doble Clic)
  const handleSmartAdd = (product: Product) => {
    const hasVariants = product.has_variants || (product.variants && product.variants.length > 0);

    if (hasVariants) {
      // Si tiene variantes, no podemos adivinar, hay que abrir el modal
      handleViewProduct(product);
      toast({ description: "Selecciona una opción para agregar", duration: 2000 });
    } else {
      // Si es producto simple, va directo al carrito
      addToCartSimple(product);
    }
  };

  const addToCartSimple = (product: Product) => {
    const productForContext = {
      id: product.id,
      name: product.name,
      price_retail: product.price_retail,
      price_wholesale: product.price_wholesale || null,
      wholesale_min_qty: product.wholesale_min_qty || null,
      processed_image_url: product.image_url || null,
      original_image_url: product.original_image_url || "",
      sku: product.sku || null,
    };

    addItem(
      productForContext, 
      1, 
      "retail", 
      product.price_retail || 0, 
      null, 
      null
    );
    toast({
      title: "¡Agregado!",
      description: (
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-500" />
          <span>{product.name} añadido al carrito</span>
        </div>
      ),
    });
    // onTrackEvent se maneja en addItem si fuera necesario, pero aquí es explícito
    onTrackEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      value: (product.price_retail || 0) / 100,
      currency: "MXN",
    });
  };

  const handleAddVariantToCart = () => {
    if (!selectedProduct) return;
    const variant = selectedProduct.variants?.find((v) => v.id === selectedVariantId);

    if (!variant && selectedProduct.variants && selectedProduct.variants.length > 0) {
      toast({ title: "Selecciona una opción", description: "Por favor elige una variante.", variant: "destructive" });
      return;
    }

    const productForContext = {
      id: selectedProduct.id,
      name: selectedProduct.name,
      price_retail: selectedProduct.price_retail,
      price_wholesale: selectedProduct.price_wholesale || null,
      wholesale_min_qty: selectedProduct.wholesale_min_qty || null,
      processed_image_url: selectedProduct.image_url || null,
      original_image_url: selectedProduct.original_image_url || "",
      sku: selectedProduct.sku || null,
    };

    const priceToUse = variant ? variant.price_retail || 0 : selectedProduct.price_retail || 0;
    const variantDescription = variant ? Object.values(variant.attributes || {}).join(", ") : null;
    const nameToUse = variant ? `${selectedProduct.name} (${variantDescription})` : selectedProduct.name;

    addItem(
      productForContext, 
      quantity, 
      "retail", 
      priceToUse, 
      variant?.id || null, 
      variantDescription
    );
    toast({ title: "Agregado", description: `${quantity}x ${nameToUse} al carrito.` });
    setSelectedProduct(null);
    onTrackEvent("AddToCart", {
      content_ids: [selectedProduct.id],
      content_name: nameToUse,
      value: (priceToUse / 100) * quantity,
      currency: "MXN",
    });
  };

  const handleSubmitQuote = () => {
    setIsCartOpen(false);
    setIsQuoteFormOpen(true);
  };
  const handleQuoteSuccess = () => {
    setIsQuoteFormOpen(false);
    clearCart();
    onTrackEvent("Lead", { currency: "MXN", value: totalAmount / 100 });
    toast({ title: "¡Cotización enviada!", description: "Hemos recibido tu pedido. Te contactaremos pronto." });
  };

  const handleRadarSubmit = async () => {
    try {
      const { error: insertError } = await supabase.from("solicitudes_mercado").insert({
        catalogo_id: catalog.id, // ✅ CORREGIDO: era 'catalog_id'
        fabricante_id: catalog.user_id,
        revendedor_id: catalog.resellerId || null,
        cliente_final_nombre: radarForm.name,
        cliente_final_email: radarForm.email,
        producto_nombre: radarForm.product,
        cantidad: parseInt(radarForm.quantity),
        estatus_fabricante: "nuevo" as const,
      });
      
      if (insertError) {
        console.error("Error al insertar solicitud radar:", insertError);
        throw insertError;
      }
      toast({ title: "Solicitud recibida", description: "Buscaremos este producto para ti." });
      setShowRadarModal(false);
      setRadarForm({ name: "", email: "", product: "", quantity: "1" });
    } catch (e) {
      toast({ title: "Error", description: "Intenta nuevamente", variant: "destructive" });
    }
  };

  // --- RENDER ---
  return (
    <div className="catalog-public-container min-h-screen bg-slate-50/50 pb-24 md:pb-20 font-sans">
      <style>{templateCSS}</style>

      {/* BANNER HERO */}
      <div className="relative bg-slate-900 overflow-hidden shadow-lg">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: catalog.background_pattern
              ? `url(${catalog.background_pattern})`
              : "linear-gradient(to bottom right, #1e293b, #334155)",
            backgroundColor: catalog.brand_colors?.primary || "#1e293b",
          }}
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 flex flex-col items-center text-center">
          {catalog.logo_url && (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white p-2 rounded-2xl shadow-xl mb-6 flex items-center justify-center overflow-hidden">
              <img src={catalog.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg mb-3">
            {catalog.name}
          </h1>
          {catalog.description && (
            <p className="text-white/90 text-sm md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-md">
              {catalog.description}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        {/* TOOLBAR (Buscador CORREGIDO) */}
        <div className="bg-white rounded-xl shadow-xl shadow-slate-200/40 p-4 mb-8 border border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                {/* 👇 AQUI ESTÁ LA CORRECCIÓN DEL TEXTO BLANCO */}
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg text-base bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 gap-2 px-4 rounded-lg shrink-0"
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filtros</span>
                      {selectedTags.length > 0 && (
                        <Badge className="h-5 px-1.5 ml-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                          {selectedTags.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85vw] sm:w-[400px] overflow-y-auto">
                    <SheetHeader className="mb-6 text-left">
                      <SheetTitle className="text-xl font-bold">Filtrar Catálogo</SheetTitle>
                    </SheetHeader>
                    <ProductFilters
                      tags={allTags}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      selectedTags={selectedTags}
                      onTagsChange={setSelectedTags}
                      priceRange={[
                        priceRange.min ? parseFloat(priceRange.min) : minPrice,
                        priceRange.max ? parseFloat(priceRange.max) : maxPrice,
                      ]}
                      onPriceRangeChange={(range) =>
                        setPriceRange({ min: range[0].toString(), max: range[1].toString() })
                      }
                      onClearAll={() => {
                        setSelectedTags([]);
                        setPriceRange({ min: "", max: "" });
                      }}
                      resultCount={filteredProducts.length}
                      showTags={allTags.length > 0}
                    />
                  </SheetContent>
                </Sheet>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0 rounded-lg"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Precio
                      <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 shadow-xl border-slate-100" align="end">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900">Rango de Precio</h4>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        />
                        <span className="text-slate-400">-</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-500 hover:bg-red-50"
                        onClick={() => setPriceRange({ min: "", max: "" })}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-linear-fade">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "whitespace-nowrap px-5 py-2 text-sm font-medium rounded-full transition-all border",
                    selectedCategory === null
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={cn(
                      "whitespace-nowrap px-5 py-2 text-sm font-medium rounded-full transition-all border",
                      selectedCategory === cat
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* GRID DE PRODUCTOS */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{filteredProducts.length} productos encontrados</p>
        </div>

        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-6">
              <Radar className="h-10 w-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿No encuentras lo que buscas?</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Aunque no tengamos "{searchTerm}" visible, nuestra red de proveedores podría conseguirlo.
            </p>
            <Button
              onClick={() => setShowRadarModal(true)}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
              Solicitar Producto Especial
            </Button>
            <div className="mt-6">
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                }}
                className="text-slate-500"
              >
                Limpiar búsqueda
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className={cn("grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4", gridColumnsClass)}>
            {filteredProducts.map((product: Product) => (
              <PublicProductCard
                key={product.id}
                product={product}
                onView={() => handleViewProduct(product)} // Clic normal = Ver detalle
                onAdd={() => handleSmartAdd(product)} // Botón + o Doble Clic = Agregar (o modal si es complejo)
                onZoomImage={() => setProductToZoom(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FLOATING CART */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-8 md:right-8 z-50"
          >
            <Button
              size="lg"
              onClick={() => setIsCartOpen(true)}
              className="w-full md:w-auto rounded-xl md:rounded-full shadow-2xl h-14 md:h-16 px-6 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-between md:justify-center gap-4 border border-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                    {items.length}
                  </span>
                </div>
                <span className="font-medium text-base">Ver Pedido</span>
              </div>
              <span className="font-bold text-lg">${(totalAmount / 100).toFixed(2)}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALES (Mantienen la lógica y diseño) */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
          {selectedProduct && (
            <>
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription>Personaliza tu pedido</DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6 space-y-6">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                    <img
                      src={selectedProduct.image_url || "/placeholder.png"}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 line-clamp-3">{selectedProduct.description}</p>
                  </div>
                </div>

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-slate-900 font-medium">Opciones disponibles</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {selectedProduct.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                            selectedVariantId === variant.id
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                          )}
                          onClick={() => setSelectedVariantId(variant.id)}
                        >
                          <span className="text-sm font-medium">
                            {Object.values(variant.attributes || {}).join(" / ")}
                          </span>
                          <span className="font-bold">${((variant.price_retail || 0) / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="font-medium text-slate-900">Cantidad</span>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md bg-white shadow-sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-bold text-slate-900">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md bg-white shadow-sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base bg-slate-900 hover:bg-slate-800"
                  onClick={handleAddVariantToCart}
                >
                  Agregar al Carrito - $
                  {(
                    ((selectedProduct.variants?.find((v) => v.id === selectedVariantId)?.price_retail ||
                      selectedProduct.price_retail) *
                      quantity) /
                    100
                  ).toFixed(2)}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ProductImageZoomModal product={productToZoom} isOpen={!!productToZoom} onClose={() => setProductToZoom(null)} />

      <QuoteCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onRequestQuote={handleSubmitQuote}
        catalogOwnerId={catalog.user_id}
        freeShippingThreshold={catalog.free_shipping_min_amount || null}
      />

      <QuoteForm
        catalogId={catalog.id}
        replicatedCatalogId={catalog.isReplicated ? catalog.id : undefined}
        items={items}
        totalAmount={totalAmount}
        isOpen={isQuoteFormOpen}
        onClose={() => setIsQuoteFormOpen(false)}
        onSuccess={handleQuoteSuccess}
        businessAddress={null}
      />

      <Dialog open={showRadarModal} onOpenChange={setShowRadarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Radar className="w-6 h-6 text-indigo-600" />
            </div>
            <DialogTitle className="text-center text-xl">Radar de Búsqueda</DialogTitle>
            <DialogDescription className="text-center">
              Activa nuestra red de proveedores. Cuéntanos qué necesitas y te avisaremos si lo conseguimos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>¿Qué producto buscas?</Label>
              <Input
                value={radarForm.product}
                onChange={(e) => setRadarForm({ ...radarForm, product: e.target.value })}
                placeholder="Ej: Válvula de bola 2 pulgadas..."
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad requerida</Label>
              <Input
                type="number"
                value={radarForm.quantity}
                onChange={(e) => setRadarForm({ ...radarForm, quantity: e.target.value })}
                className="bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={radarForm.name}
                  onChange={(e) => setRadarForm({ ...radarForm, name: e.target.value })}
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp / Email</Label>
                <Input
                  value={radarForm.email}
                  onChange={(e) => setRadarForm({ ...radarForm, email: e.target.value })}
                  className="bg-slate-50"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRadarSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Activar Radar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
