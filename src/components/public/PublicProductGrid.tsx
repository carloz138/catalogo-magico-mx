import { useState, useEffect } from "react";
import { PublicProductCard } from "./PublicProductCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  products: any[];
  priceConfig: any;
  visibilityConfig: any;
  enableVariants?: boolean;
  onAddToQuote?: (product: any) => void;
  purchasedProductIds: string[];
  purchasedVariantIds?: string[]; // ✅ NUEVO
  onRequestSpecialQuote?: (product: any) => void;
  isReplicatedCatalog: boolean;
}

const PRODUCTS_PER_PAGE = 12;

export function PublicProductGrid({
  products,
  priceConfig,
  visibilityConfig,
  enableVariants = true,
  onAddToQuote,
  purchasedProductIds,
  purchasedVariantIds = [], // ✅ NUEVO
  onRequestSpecialQuote,
  isReplicatedCatalog,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when products change (search/filter applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProducts.map((product) => (
          <PublicProductCard
            key={product.id}
            product={product}
            priceConfig={priceConfig}
            visibilityConfig={visibilityConfig}
            enableVariants={enableVariants}
            purchasedProductIds={purchasedProductIds}
            purchasedVariantIds={purchasedVariantIds} // ✅ NUEVO
            isReplicatedCatalog={isReplicatedCatalog}
            onAddToQuote={onAddToQuote ? () => onAddToQuote(product) : undefined}
            onRequestSpecialQuote={onRequestSpecialQuote ? () => onRequestSpecialQuote(product) : undefined}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
