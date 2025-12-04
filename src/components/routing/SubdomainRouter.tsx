import { useEffect, useState } from 'react';
import { getSubdomainSlug } from '@/lib/subdomain';
import PublicCatalog from '@/pages/PublicCatalog';
import { QuoteCartProvider } from '@/contexts/QuoteCartContext';

interface SubdomainRouterProps {
  /** Componente a renderizar si NO hay subdominio de catálogo */
  fallback: React.ReactNode;
}

/**
 * Router que detecta subdominios de catálogo y renderiza el catálogo público
 * Si no hay subdominio, renderiza el fallback (normalmente la landing page)
 */
export function SubdomainRouter({ fallback }: SubdomainRouterProps) {
  const [subdomainSlug, setSubdomainSlug] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const slug = getSubdomainSlug();
    setSubdomainSlug(slug);
    setChecked(true);
  }, []);

  // Mientras verificamos, no renderizar nada para evitar flash
  if (!checked) {
    return null;
  }

  // Si hay subdominio, mostrar el catálogo público
  if (subdomainSlug) {
    return (
      <QuoteCartProvider>
        <PublicCatalog subdomainSlug={subdomainSlug} />
      </QuoteCartProvider>
    );
  }

  // Si no hay subdominio, mostrar el fallback (landing page)
  return <>{fallback}</>;
}
