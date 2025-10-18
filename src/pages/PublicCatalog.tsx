import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Search, Info, MessageCircleQuestion } from "lucide-react";
import { DigitalCatalogService } from "@/services/digital-catalog.service";
import { PublicCatalogView } from "@/types/digital-catalog";
import CatalogHeader from "@/components/public/CatalogHeader";
import ProductSearch from "@/components/public/ProductSearch";
import ProductFilters from "@/components/public/ProductFilters";
import PasswordModal from "@/components/public/PasswordModal";
import { PublicProductGrid } from "@/components/public/PublicProductGrid";
import { ProductsContent } from "@/components/public/ProductsContent";
import { AddToQuoteModal } from "@/components/public/AddToQuoteModal";
import { QuoteCartBadge } from "@/components/public/QuoteCartBadge";
import { QuoteCartModal } from "@/components/public/QuoteCartModal";
import { QuoteForm } from "@/components/public/QuoteForm";
import { ProductRequestForm } from "@/components/catalog/ProductRequestForm";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useProductFilters } from "@/hooks/useProductFilters";
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

  const { query, setQuery, results: searchResults } = useProductSearch(catalog?.products || [], searchFields);

  const { filteredProducts, selectedTags, setSelectedTags, priceRange, setPriceRange, clearFilters } =
    useProductFilters(searchResults);

  const availableTags = Array.from(new Set(catalog?.products.flatMap((p) => p.tags || []).filter(Boolean) || []));

  // Calculate min and max prices in currency (converting from cents)
  const prices = catalog?.products.map((p) => {
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
    if (catalog!.price_display === 'both' && product.price_wholesale) {
      setSelectedProduct(product);
      setIsAddModalOpen(true);
    } else {
      const priceConfig = {
        display: catalog!.price_display,
        adjustmentMenudeo: catalog!.price_adjustment_menudeo,
        adjustmentMayoreo: catalog!.price_adjustment_mayoreo,
      };

      let priceType: 'retail' | 'wholesale' = 'retail';
      let unitPrice = product.price_retail;

      if (priceConfig.display === 'menudeo_only') {
        priceType = 'retail';
        unitPrice = calculateAdjustedPrice(product.price_retail, priceConfig.adjustmentMenudeo);
      } else if (priceConfig.display === 'mayoreo_only') {
        priceType = 'wholesale';
        unitPrice = calculateAdjustedPrice(product.price_wholesale || product.price_retail, priceConfig.adjustmentMayoreo);
      }

      addItem(product, 1, priceType, unitPrice);
      toast.success(`${product.name} agregado a cotización`);
    }
  };
  
  const handleAddFromModal = (
    quantity: number, 
    priceType: 'retail' | 'wholesale',
    variantId?: string | null,
    variantDescription?: string | null
  ) => {
    if (!selectedProduct) return;
    
    const priceConfig = {
      display: catalog!.price_display,
      adjustmentMenudeo: catalog!.price_adjustment_menudeo,
      adjustmentMayoreo: catalog!.price_adjustment_mayoreo,
    };
    
    const unitPrice = priceType === 'retail' 
      ? calculateAdjustedPrice(selectedProduct.price_retail, priceConfig.adjustmentMenudeo)
      : calculateAdjustedPrice(selectedProduct.price_wholesale || selectedProduct.price_retail, priceConfig.adjustmentMayoreo);
    
    addItem(selectedProduct, quantity, priceType, unitPrice, variantId, variantDescription);
    
    const variantText = variantDescription ? ` (${variantDescription})` : '';
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
    toast.success('¡Cotización enviada! Te contactaremos pronto.');
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

  if (error === "Catálogo no encontrado") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Catálogo no encontrado</h2>
          <p className="text-muted-foreground">Este catálogo no existe o fue eliminado</p>
        </div>
      </div>
    );
  }

  if (error === "Catálogo expirado") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Catálogo no disponible</h2>
          <p className="text-muted-foreground mb-4">Este catálogo ya no está activo</p>
          <p className="text-sm text-muted-foreground">Contacta al vendedor para más información</p>
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

  if (!catalog) {
    return null;
  }

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

  // Cargar y aplicar template CSS
  const template = catalog.web_template_id 
    ? EXPANDED_WEB_TEMPLATES.find(t => t.id === catalog.web_template_id)
    : null;
  
  const templateCSS = template 
    ? WebTemplateAdapter.generateWebCSS(template, catalog.background_pattern)
    : "";

  return (
    <>
      <Helmet>
        <title>
          {catalog.name} - {catalog.business_info?.business_name || "Catálogo"}
        </title>
        <meta
          name="description"
          content={catalog.description || `Catálogo de productos de ${catalog.business_info?.business_name}`}
        />
        <meta property="og:title" content={catalog.name} />
        <meta property="og:description" content={catalog.description || ""} />
        {catalog.products[0]?.image_url && <meta property="og:image" content={catalog.products[0].image_url} />}
        <meta property="og:type" content="website" />
      </Helmet>

      <style>{templateCSS}</style>

      <div className="catalog-public-container min-h-screen">
        <CatalogHeader
          businessName={catalog.business_info?.business_name || "Catálogo"}
          businessLogo={catalog.business_info?.logo_url}
          catalogName={catalog.name}
          catalogDescription={catalog.description}
        />

        <div className="container mx-auto px-4 py-8">
          {/* Tabs para productos e información adicional */}
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

              <TabsContent value="productos" className="space-y-6" style={{ pointerEvents: 'auto' }}>
                <ProductsContent 
                  catalog={catalog}
                  query={query}
                  setQuery={setQuery}
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  clearFilters={clearFilters}
                  filteredProducts={filteredProducts}
                  handleAddToQuote={handleAddToQuote}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                />
              </TabsContent>

              <TabsContent value="info" style={{ pointerEvents: 'auto' }}>
                <Card className="max-w-4xl mx-auto">
                  <CardContent className="p-8">
                    <div className="prose prose-slate max-w-none">
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Info className="h-6 w-6" />
                        Información Adicional
                      </h2>
                      <div className="whitespace-pre-wrap text-base leading-relaxed">
                        {catalog.additional_info}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <ProductsContent 
              catalog={catalog}
              query={query}
              setQuery={setQuery}
              availableTags={availableTags}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              clearFilters={clearFilters}
              filteredProducts={filteredProducts}
              handleAddToQuote={handleAddToQuote}
              minPrice={minPrice}
              maxPrice={maxPrice}
            />
          )}
        </div>
        
        {/* Botón flotante para solicitar productos */}
        <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="lg"
              className="fixed bottom-4 right-4 shadow-lg z-40 gap-2"
            >
              <MessageCircleQuestion className="h-5 w-5" />
              ¿No encuentras lo que buscas?
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Solicita un Producto</DialogTitle>
            </DialogHeader>
            <ProductRequestForm 
              fabricanteId={catalog.user_id}
              catalogoId={catalog.id}
              revendedorId={null}
              onSuccess={() => setIsRequestFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

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
            
            <QuoteCartBadge onClick={() => setIsCartOpen(true)} />
            
            <QuoteCartModal
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              onRequestQuote={handleRequestQuote}
            />
            
            <QuoteForm
              catalogId={catalog.id}
              items={items}
              totalAmount={totalAmount}
              isOpen={isQuoteFormOpen}
              onClose={() => setIsQuoteFormOpen(false)}
              onSuccess={handleQuoteSuccess}
            />
          </>
        )}
      </div>
    </>
  );
}

export default function PublicCatalog() {
  return (
    <QuoteCartProvider>
      <PublicCatalogContent />
    </QuoteCartProvider>
  );
}
