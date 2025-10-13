import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar media queries
 * @param query - Media query string (ej: '(max-width: 768px)')
 * @returns boolean - true si la media query coincide
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set inicial
    setMatches(media.matches);

    // Listener para cambios
    const listener = () => setMatches(media.matches);
    
    // Modern API (Safari 14+, Chrome 45+, Firefox 55+)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // Fallback para navegadores antiguos
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * Hooks preconfigurados para breakpoints comunes
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)');
}
