import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Calendar, Search } from "lucide-react";
import { DigitalCatalogService } from "@/services/digital-catalog.service";
import { PublicCatalogView } from "@/types/digital-catalog";
import { getTemplateById } from "@/lib/templates/industry-templates";
import CatalogHeader from "@/components/public/CatalogHeader";
import ProductSearch from "@/components/public/ProductSearch";
import ProductFilters from "@/components/public/ProductFilters";
import PasswordModal from "@/components/public/PasswordModal";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useProductFilters } from "@/hooks/useProductFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Generador de CSS adaptado para web
const generateWebCSS = (templateId: string): string => {
  const template = getTemplateById(templateId);
  if (!template) return "";

  return `
    :root {
      --catalog-primary: ${template.colors.primary};
      --catalog-secondary: ${template.colors.secondary};
      --catalog-accent: ${template.colors.accent};
      --catalog-background: ${template.colors.background};
      --catalog-card-bg: ${template.colors.cardBackground || "#ffffff"};
      --catalog-border-radius: ${template.design?.borderRadius || 8}px;
    }

    .catalog-public-container {
      background: var(--catalog-background);
      min-height: 100vh;
    }

    .catalog-public-header {
      background: linear-gradient(135deg, var(--catalog-primary), var(--catalog-secondary));
      color: white;
    }

    .catalog-product-card {
      background: var(--catalog-card-bg);
      border: 1px solid ${template.colors.accent}40;
      border-radius: var(--catalog-border-radius);
      ${template.design?.shadows ? "box-shadow: 0 2px 8px rgba(0,0,0,0.1);" : ""}
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .catalog-product-card:hover {
      transform: translateY(-4px);
      ${template.design?.shadows ? "box-shadow: 0 4px 12px rgba(0,0,0,0.15);" : ""}
    }

    .catalog-product-name {
      color: var(--catalog-primary);
      font-weight: 600;
    }

    .catalog-product-price {
      background: linear-gradient(135deg, var(--catalog-secondary), var(--catalog-primary));
      color: white;
      padding: 0.5rem 1rem;
      border-radius: calc(var(--catalog-border-radius) / 2);
      font-weight: 700;
      display: inline-block;
    }

    .catalog-product-tag {
      background: ${template.colors.accent}20;
      color: var(--catalog-accent);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .catalog-add-button {
      background: var(--catalog-accent);
      color: white;
      border-radius: var(--catalog-border-radius);
      transition: all 0.2s;
    }

    .catalog-add-button:hover {
      background: var(--catalog-primary);
      transform: scale(1.05);
    }
  `;
};

export default function PublicCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<PublicCatalogView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const prices = catalog?.products.map((p) => {
    if (catalog.price_display === "both" || catalog.price_display === "menudeo_only") {
      return p.price_retail || 0;
    }
    return p.price_wholesale || 0;
  }) || [0];

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const handlePasswordSuccess = () => {
    if (slug) {
      sessionStorage.setItem(`catalog_${slug}`, "authenticated");
      setIsAuthenticated(true);
    }
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

  const templateCSS = catalog.template_id ? generateWebCSS(catalog.template_id) : "";

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
          className="catalog-public-header"
        />

        <div className="container mx-auto px-4 py-8">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="catalog-product-card p-4">
                      <div className="aspect-square bg-muted rounded-md mb-4 overflow-hidden">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <h3 className="catalog-product-name text-lg mb-2">{product.name}</h3>

                      {catalog.show_sku && product.sku && (
                        <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>
                      )}

                      {catalog.show_tags && product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.tags.map((tag) => (
                            <span key={tag} className="catalog-product-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {catalog.show_description && product.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                      )}

                      <div className="mt-auto">
                        <div className="catalog-product-price mb-3">
                          ${((product.price_retail || 0) / 100).toFixed(2)}
                        </div>

                        <button className="catalog-add-button w-full py-2 px-4 font-medium">
                          Agregar a cotización
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
