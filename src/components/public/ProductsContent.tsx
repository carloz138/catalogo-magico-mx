import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import ProductSearch from "./ProductSearch";
import ProductFilters from "./ProductFilters";
import { PublicProductGrid } from "./PublicProductGrid";
import type { PublicCatalogView } from "@/types/digital-catalog";

interface ProductsContentProps {
  catalog: PublicCatalogView;
  query: string;
  setQuery: (query: string) => void;
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  clearFilters: () => void;
  filteredProducts: any[];
  handleAddToQuote: (product: any) => void;
  minPrice: number;
  maxPrice: number;
}

export function ProductsContent({
  catalog,
  query,
  setQuery,
  availableTags,
  selectedTags,
  setSelectedTags,
  priceRange,
  setPriceRange,
  clearFilters,
  filteredProducts,
  handleAddToQuote,
  minPrice,
  maxPrice,
}: ProductsContentProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <ProductFilters
          tags={availableTags}
          minPrice={minPrice}
          maxPrice={maxPrice}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          onClearAll={clearFilters}
          resultCount={filteredProducts.length}
          showTags={catalog.show_tags}
        />
      </aside>

      <main className="flex-1">
        <div className="mb-6">
          <ProductSearch query={query} onQueryChange={setQuery} placeholder="Buscar productos..." />
        </div>

        <div className="lg:hidden mb-6">
          <Button variant="outline" className="w-full" onClick={() => {}}>
            <Search className="mr-2 h-4 w-4" />
            Filtros ({selectedTags.length > 0 ? selectedTags.length : "Ninguno"})
          </Button>
        </div>

        <div className="mb-4 text-sm text-muted-foreground">
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "producto encontrado" : "productos encontrados"}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-4">Intenta ajustar los filtros o buscar algo diferente</p>
            <Button onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        )}

        {filteredProducts.length > 0 && (
          <PublicProductGrid
            products={filteredProducts}
            priceConfig={{
              display: catalog.price_display,
              adjustmentMenudeo: catalog.price_adjustment_menudeo,
              adjustmentMayoreo: catalog.price_adjustment_mayoreo,
            }}
            visibilityConfig={{
              showSku: catalog.show_sku,
              showTags: catalog.show_tags,
              showDescription: catalog.show_description,
            }}
            enableVariants={catalog.enable_variants}
            onAddToQuote={catalog.enable_quotation ? handleAddToQuote : undefined}
          />
        )}
      </main>
    </div>
  );
}
