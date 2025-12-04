import { useEffect, useState } from 'react';
import { getSubdomainFromUrl, getCatalogBySubdomain } from '@/lib/subdomain';
import PublicCatalog from '@/pages/PublicCatalog';
import { QuoteCartProvider } from '@/contexts/QuoteCartContext';
import { Loader2 } from 'lucide-react';

interface SubdomainRouterProps {
  /** Componente a renderizar si NO hay subdominio de catálogo */
  fallback: React.ReactNode;
}

/**
 * Router que detecta subdominios de catálogo y renderiza el catálogo público
 * Si no hay subdominio, renderiza el fallback (normalmente la landing page)
 */
export function SubdomainRouter({ fallback }: SubdomainRouterProps) {
  const [state, setState] = useState<{
    checked: boolean;
    catalogSlug: string | null;
    loading: boolean;
  }>({
    checked: false,
    catalogSlug: null,
    loading: true,
  });

  useEffect(() => {
    const checkSubdomain = async () => {
      const subdomain = getSubdomainFromUrl();
      
      if (!subdomain) {
        setState({ checked: true, catalogSlug: null, loading: false });
        return;
      }

      // Buscar catálogo asociado al subdominio
      const result = await getCatalogBySubdomain(subdomain);
      
      if (result?.catalogSlug) {
        setState({ checked: true, catalogSlug: result.catalogSlug, loading: false });
      } else {
        // Subdominio no encontrado, mostrar fallback
        setState({ checked: true, catalogSlug: null, loading: false });
      }
    };

    checkSubdomain();
  }, []);

  // Mientras verificamos, mostrar loading
  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Si hay catálogo, mostrar el catálogo público
  if (state.catalogSlug) {
    return (
      <QuoteCartProvider>
        <PublicCatalog subdomainSlug={state.catalogSlug} />
      </QuoteCartProvider>
    );
  }

  // Si no hay subdominio o no se encontró, mostrar el fallback (landing page)
  return <>{fallback}</>;
}
