import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Search, Info, ShoppingCart, ArrowRight, Radar } from "lucide-react";
import { DigitalCatalogService } from "@/services/digital-catalog.service";
import { PublicCatalogView } from "@/types/digital-catalog";
import CatalogHeader from "@/components/public/CatalogHeader";
import { ProductsContent } from "@/components/public/ProductsContent";
import PasswordModal from "@/components/public/PasswordModal";
import { AddToQuoteModal } from "@/components/public/AddToQuoteModal";
import { QuoteCartBadge } from "@/components/public/QuoteCartBadge";
import { QuoteCartModal } from "@/components/public/QuoteCartModal";
import { QuoteForm } from "@/components/public/QuoteForm";
import { MarketRadarForm } from "@/components/dashboard/MarketRadarForm";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useDebounce } from "@/hooks/useDebounce";
import { QuoteCartProvider, useQuoteCart } from "@/contexts/QuoteCartContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateAdjustedPrice } from "@/lib/utils/price-calculator";
import { toast } from "sonner";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import { WebTemplateAdapter } from "@/lib/templates/web-css-adapter";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogTracking } from "@/hooks/useCatalogTracking";

// --- COMPONENTE DE CERO RESULTADOS CON RADAR ---
const ZeroResultsWithRadar = ({ query, onOpenRadar }: { query: string; onOpenRadar: () => void }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
      <Search className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No encontramos "{query}"</h3>
    <p className="text-gray-500 max-w-md mx-auto mb-8">
      No tenemos este producto en el catálogo actualmente, pero podemos conseguirlo para ti.
    </p>

    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100 max-w-lg mx-auto">
      <h4 className="font-semibold text-purple-900 mb-2 flex items-center justify-center gap-2">
        <Radar className="w-5 h-5" />
        Radar de Mercado
      </h4>
      <p className="text-sm text-purple-700 mb-4">Regístralo en nuestro Radar y te notificaremos cuando lo tengamos.</p>
      <Button onClick={onOpenRadar} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
        Solicitar "{query}"
      </Button>
    </div>
  </div>
);

// --- BARRA MÓVIL OPTIMIZADA ---
const MobileStickyBar = ({
  itemCount,
  total,
  onOpenCart,
  onOpenRadar,
}: {
  itemCount: number;
  total: number;
  onOpenCart: () => void;
  onOpenRadar: () => void;
}) => {
  if (itemCount === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-50">
        <Button variant="outline" onClick={onOpenRadar} className="w-full shadow-sm h-12 text-base">
          <Search className="mr-2 h-4 w-4" /> ¿Buscas algo especial?
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-3 md:hidden z-50 safe-area-bottom flex gap-3 items-center">
      <Button
        variant="secondary"
        size="icon"
        onClick={onOpenRadar}
        className="h-12 w-12 flex-shrink-0 bg-gray-100 border border-gray-200"
      >
        <Search className="h-5 w-5 text-gray-600" />
      </Button>

      <Button
        onClick={onOpenCart}
        className="flex-1 h-12 flex justify-between items-center px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
      >
        <div className="flex items-center gap-2">
          <div className="bg-black/20 px-2 py-0.5 rounded-full text-xs font-bold min-w-[1.5rem] text-center">
            {itemCount}
          </div>
          <span className="font-medium">Ver Carrito</span>
        </div>
        <div className="flex items-center gap-1 font-bold">
          ${(total / 100).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          <ArrowRight className="h-4 w-4 opacity-80 ml-1" />
        </div>
      </Button>
    </div>
  );
};

function PublicCatalogContent() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<PublicCatalogView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("productos");
  const { addItem, items, totalAmount, clearCart } = useQuoteCart();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteFormOpen, setIsQuoteFormOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // Debounce para optimizar búsqueda
  const debouncedQuery = useDebounce(localSearchTerm, 500);

  // Asumimos que 'tracking_config' vendrá en el objeto catalog desde Supabase
  // Si aún no tienes la columna, pasará undefined y no hará nada (seguro)
  useCatalogTracking(catalog?.id || "", (catalog as any)?.tracking_config || null, catalog?.products || []);

  useEffect(() => {
    if (slug) {
      const auth = sessionStorage.getItem(`catalog_${slug}`);
      if (auth === "authenticated") {
        setIsAuthenticated(true);
      }
    }
  }, [slug]);

  useEffect(() => {
    async function loadCatalog() {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await DigitalCatalogService.getPublicCatalog(slug);
        if (data.is_private && !isAuthenticated) {
          setCatalog(data);
          setLoading(false);
          return;
        }
        setCatalog(data);
        await DigitalCatalogService.trackView(data.id, {
          referrer: document.referrer,
          user_agent: navigator.userAgent,
        });
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading catalog:", err);
        setError(err.message || "Error al cargar el catálogo");
        setLoading(false);
      }
    }
    if (isAuthenticated || !catalog?.is_private) {
      loadCatalog();
    }
  }, [slug, isAuthenticated]);

  const searchFields = ["name"];
  if (catalog?.show_description) searchFields.push("description");
  if (catalog?.show_sku) searchFields.push("sku");

  const { results: searchResults } = useProductSearch(catalog?.products || [], searchFields, debouncedQuery);
  const { filteredProducts, selectedTags, setSelectedTags, priceRange, setPriceRange, clearFilters } =
    useProductFilters(searchResults);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3 || !catalog) return;
    const timer = setTimeout(async () => {
      try {
        await supabase.from("search_logs" as any).insert({
          catalog_id: catalog.id,
          search_term: debouncedQuery,
          results_count: filteredProducts.length,
        });
      } catch (e) {
        console.error("Error logueando búsqueda", e);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [debouncedQuery, catalog, filteredProducts.length]); // Agregué filteredProducts.length a dependencias

  const availableTags = Array.from(new Set(catalog?.products.flatMap((p) => p.tags || []).filter(Boolean) || []));

  const prices = catalog?.products.map((p) => {
    if (!catalog) return 0;
    if (catalog.price_display === "both" || catalog.price_display === "menudeo_only") {
      return (p.price_retail || 0) / 100;
    }
    return (p.price_wholesale || 0) / 100;
  }) || [0];

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const handlePasswordSuccess = () => {
    if (slug) {
      sessionStorage.setItem(`catalog_${slug}`, "authenticated");
      setIsAuthenticated(true);
    }
  };

  const handleAddToQuote = (product: any) => {
    if (!catalog) return;
    if (catalog.isReplicated && catalog.purchasedProductIds) {
      const isProductPurchased = catalog.purchasedProductIds.includes(product.id);
      if (!isProductPurchased) {
        handleRequestSpecialQuote(product);
        return;
      }
    }

    if (catalog.price_display === "both" && product.price_wholesale) {
      setSelectedProduct(product);
      setIsAddModalOpen(true);
    } else {
      const priceConfig = {
        display: catalog.price_display,
        adjustmentMenudeo: catalog.price_adjustment_menudeo,
        adjustmentMayoreo: catalog.price_adjustment_mayoreo,
      };
      let priceType: "retail" | "wholesale" = "retail";
      let unitPrice = product.price_retail;
      if (priceConfig.display === "menudeo_only") {
        priceType = "retail";
        unitPrice = calculateAdjustedPrice(product.price_retail, priceConfig.adjustmentMenudeo);
      } else if (priceConfig.display === "mayoreo_only") {
        priceType = "wholesale";
        unitPrice = calculateAdjustedPrice(
          product.price_wholesale || product.price_retail,
          priceConfig.adjustmentMayoreo,
        );
      }
      addItem(product, 1, priceType as any, unitPrice);
      toast.success(`${product.name} agregado a cotización`);
    }
  };

  const handleRequestSpecialQuote = (product?: any) => {
    setIsRequestFormOpen(true);
    if (product) {
      toast.info(`Solicita "${product.name}" en el formulario`);
    }
  };

  const handleAddFromModal = (
    quantity: number,
    priceType: "retail" | "wholesale",
    variantId?: string | null,
    variantDescription?: string | null,
  ) => {
    if (!selectedProduct || !catalog) return;
    const priceConfig = {
      display: catalog.price_display,
      adjustmentMenudeo: catalog.price_adjustment_menudeo,
      adjustmentMayoreo: catalog.price_adjustment_mayoreo,
    };
    const unitPrice =
      priceType === "retail"
        ? calculateAdjustedPrice(selectedProduct.price_retail, priceConfig.adjustmentMenudeo)
        : calculateAdjustedPrice(
            selectedProduct.price_wholesale || selectedProduct.price_retail,
            priceConfig.adjustmentMayoreo,
          );
    addItem(selectedProduct, quantity, priceType as any, unitPrice, variantId, variantDescription);
    const variantText = variantDescription ? ` (${variantDescription})` : "";
    toast.success(`${selectedProduct.name}${variantText} agregado a cotización`);
    setIsAddModalOpen(false);
    setSelectedProduct(null);
  };

  const handleRequestQuote = () => {
    setIsCartOpen(false);
    setIsQuoteFormOpen(true);
  };

  const handleQuoteSuccess = () => {
    clearCart();
    toast.success("¡Cotización enviada! Te contactaremos pronto.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-24 w-full mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!catalog) return null;

  if (catalog.is_private && !isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>{catalog.name} - Catálogo Privado</title>
        </Helmet>
        <PasswordModal slug={slug!} isOpen={true} onSuccess={handlePasswordSuccess} />
      </>
    );
  }

  // --- 👇 LÓGICA DE CÁLCULO DE ENVÍO (NUEVO) ---
  let currentShippingThreshold: number | null = null;

  // Usamos 'as any' para acceder a las nuevas columnas sin errores de TS
  // hasta que se regeneren los tipos
  const rawCatalog = catalog as any;

  // REGLA DE NEGOCIO: El envío gratis solo aplica para catálogos ORIGINALES (L1).
  // Si es una réplica (L2), ignoramos la configuración para proteger su margen.
  if (!catalog.isReplicated && rawCatalog.enable_free_shipping) {
    currentShippingThreshold = rawCatalog.free_shipping_min_amount;
  }
  // ---------------------------------------------

  const template = catalog.web_template_id
    ? EXPANDED_WEB_TEMPLATES.find((t) => t.id === catalog.web_template_id)
    : null;

  const templateCSS = template ? WebTemplateAdapter.generateWebCSS(template, catalog.background_pattern) : "";

  const renderProducts = () => {
    if (filteredProducts.length === 0 && localSearchTerm) {
      return <ZeroResultsWithRadar query={localSearchTerm} onOpenRadar={() => setIsRequestFormOpen(true)} />;
    }

    return (
      <ProductsContent
        catalog={catalog}
        query={localSearchTerm}
        setQuery={setLocalSearchTerm}
        availableTags={availableTags}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        clearFilters={clearFilters}
        filteredProducts={filteredProducts}
        handleAddToQuote={handleAddToQuote}
        handleRequestSpecialQuote={handleRequestSpecialQuote}
        minPrice={minPrice}
        maxPrice={maxPrice}
        purchasedProductIds={catalog.purchasedProductIds || []}
        purchasedVariantIds={catalog.purchasedVariantIds || []}
      />
    );
  };

  return (
    <>
      <Helmet>
        <title>
          {catalog.name} - {catalog.business_info?.business_name || "Catálogo"}
        </title>
        <meta name="description" content={catalog.description || `Catálogo de productos`} />
        {catalog.products[0]?.image_url && <meta property="og:image" content={catalog.products[0].image_url} />}
      </Helmet>

      {catalog.tracking_head_scripts && <div dangerouslySetInnerHTML={{ __html: catalog.tracking_head_scripts }} />}
      {catalog.tracking_body_scripts && <div dangerouslySetInnerHTML={{ __html: catalog.tracking_body_scripts }} />}

      <style>{templateCSS}</style>

      <div className="catalog-public-container min-h-screen pb-24 md:pb-0">
        <CatalogHeader
          businessName={catalog.business_info?.business_name || "Catálogo"}
          businessLogo={catalog.business_info?.logo_url}
          catalogName={catalog.name}
          catalogDescription={catalog.description}
        />

        <div className="container mx-auto px-4 py-8">
          {/* Desktop Actions */}
          <div className="hidden md:flex justify-end gap-3 mb-6">
            <Button variant="outline" onClick={() => setIsRequestFormOpen(true)} className="gap-2">
              <Search className="h-4 w-4" />
              Radar de Mercado
            </Button>

            {catalog.enable_quotation && items.length > 0 && (
              <Button
                onClick={() => setIsCartOpen(true)}
                className="gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <ShoppingCart className="h-4 w-4" />
                Ver Cotización ({items.length}) - $
                {(totalAmount / 100).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </Button>
            )}
          </div>

          {catalog.additional_info ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <TabsTrigger value="productos" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Información
                </TabsTrigger>
              </TabsList>

              <TabsContent value="productos" className="space-y-6" style={{ pointerEvents: "auto" }}>
                {renderProducts()}
              </TabsContent>

              <TabsContent value="info" style={{ pointerEvents: "auto" }}>
                <Card className="max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <div className="prose prose-slate max-w-none">
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Info className="h-6 w-6" />
                        Información Adicional
                      </h2>
                      <div className="whitespace-pre-wrap text-base leading-relaxed">{catalog.additional_info}</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            renderProducts()
          )}
        </div>

        <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Solicita un Producto</DialogTitle>
            </DialogHeader>
            <MarketRadarForm
              fabricanteId={catalog.originalOwnerId || catalog.user_id}
              catalogoId={catalog.id}
              revendedorId={catalog.isReplicated ? catalog.user_id : null}
            />
          </DialogContent>
        </Dialog>

        {catalog.enable_quotation && (
          <MobileStickyBar
            itemCount={items.length}
            total={totalAmount}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenRadar={() => setIsRequestFormOpen(true)}
          />
        )}

        {catalog.enable_quotation && (
          <>
            <AddToQuoteModal
              product={selectedProduct}
              priceConfig={{
                display: catalog.price_display,
                adjustmentMenudeo: catalog.price_adjustment_menudeo,
                adjustmentMayoreo: catalog.price_adjustment_mayoreo,
              }}
              catalog={catalog}
              isOpen={isAddModalOpen}
              onClose={() => {
                setIsAddModalOpen(false);
                setSelectedProduct(null);
              }}
              onAdd={handleAddFromModal}
            />

            <QuoteCartModal
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              onRequestQuote={handleRequestQuote}
              catalogOwnerId={catalog?.user_id || null}
              // 👇 AQUÍ SE PASA LA NUEVA PROP
              freeShippingThreshold={currentShippingThreshold}
            />

            <QuoteForm
              catalogId={catalog.id}
              replicatedCatalogId={catalog.replicatedCatalogId}
              items={items}
              totalAmount={totalAmount}
              isOpen={isQuoteFormOpen}
              onClose={() => setIsQuoteFormOpen(false)}
              onSuccess={handleQuoteSuccess}
              businessAddress={(catalog.business_info as any)?.address || null}
            />
          </>
        )}
      </div>
    </>
  );
}

export default function PublicCatalog() {
  return (
    <HelmetProvider>
      <QuoteCartProvider>
        <PublicCatalogContent />
      </QuoteCartProvider>
    </HelmetProvider>
  );
}
