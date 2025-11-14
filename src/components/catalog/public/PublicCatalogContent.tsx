import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Filter, X } from "lucide-react";
import { DigitalCatalog } from "@/types/digital-catalog";
// Usamos PublicProductCard para la vista pública
import { PublicProductCard } from "@/components/public/PublicProductCard"; 
import { QuoteCartModal } from "@/components/public/QuoteCartModal";
import { useDebounce } from "@/hooks/useDebounce";

interface PublicCatalogContentProps {
  catalog: DigitalCatalog & { isReplicated?: boolean; resellerId?: string };
  onTrackEvent: (event: string, data?: any) => void;
}

export function PublicCatalogContent({ catalog, onTrackEvent }: PublicCatalogContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Filtrado de productos
  const filteredProducts = catalog.products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }) || [];

  // Obtener categorías únicas
  const categories = Array.from(new Set(catalog.products?.map(p => p.category).filter(Boolean) as string[]));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Banner del Catálogo */}
      <div 
        className="h-48 md:h-64 bg-cover bg-center relative"
        style={{ 
            backgroundImage: catalog.background_pattern ? `url(${catalog.background_pattern})` : undefined,
            backgroundColor: catalog.brand_colors?.primary || '#1e293b'
        }}
      >
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
            {catalog.logo_url && (
                <img src={catalog.logo_url} alt="Logo" className="h-16 w-16 object-contain mb-4 rounded-full bg-white p-1" />
            )}
            <h1 className="text-3xl md:text-4xl font-bold">{catalog.name}</h1>
            {catalog.description && <p className="mt-2 max-w-xl text-white/90">{catalog.description}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        {/* Barra de Herramientas */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Buscador */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Buscar productos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filtros y Carrito */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <Badge 
                            key={cat}
                            variant={selectedCategory === cat ? "default" : "outline"}
                            className="cursor-pointer whitespace-nowrap px-3 py-1"
                            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>

        {/* Grid de Productos */}
        {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron productos.</p>
                <Button variant="link" onClick={() => {setSearchTerm(''); setSelectedCategory(null);}}>
                    Limpiar filtros
                </Button>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id}
                        onClick={() => onTrackEvent('AddToCart', { 
                            content_ids: [product.id],
                            content_name: product.name,
                            value: product.price_retail,
                            currency: 'MXN'
                        })}
                    >
                        <PublicProductCard 
                            product={product}
                            priceConfig={{
                                display: catalog.price_display,
                                adjustmentMenudeo: catalog.price_adjustment_menudeo,
                                adjustmentMayoreo: catalog.price_adjustment_mayoreo
                            }}
                            visibilityConfig={{
                                showSku: catalog.show_sku,
                                showTags: catalog.show_tags,
                                showDescription: catalog.show_description,
                                showStock: catalog.show_stock
                            }}
                            enableVariants={catalog.enable_variants}
                            purchasedProductIds={[]}
                            purchasedVariantIds={[]}
                            isReplicatedCatalog={catalog.isReplicated || false}
                        />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Botón Flotante del Carrito */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
            size="lg" 
            className="rounded-full shadow-xl h-14 w-14 p-0 bg-primary hover:bg-primary/90"
            onClick={() => setIsCartOpen(true)}
        >
            <ShoppingCart className="h-6 w-6 text-white" />
            {/* Aquí podrías poner un badge con la cantidad del carrito */}
        </Button>
      </div>

      {/* Modal del Carrito */}
      <QuoteCartModal 
        {...{
          open: isCartOpen,
          isOpen: isCartOpen,
          onClose: () => setIsCartOpen(false),
          catalog: catalog,
          onSubmitQuote: () => onTrackEvent('Lead', { currency: 'MXN', value: 0 })
        } as any}
      />
    </div>
  );
}
