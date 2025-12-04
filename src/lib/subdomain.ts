/**
 * Subdomain Detection Utility for CatifyPro
 * Enables automatic subdomains like: mi-tienda.catifypro.com
 */

// Dominios base que NO son subdominios de catálogo
const BASE_DOMAINS = [
  'localhost',
  'catifypro.com',
  'www.catifypro.com',
  'lovable.app',
  'lovable.dev',
];

// Subdominios del sistema que no son catálogos
const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'staging',
  'dev',
  'test',
];

/**
 * Extrae el slug del catálogo desde el subdominio
 * @returns El slug del catálogo si existe, null si es dominio base
 * 
 * Ejemplos:
 * - mi-tienda.catifypro.com → "mi-tienda"
 * - catifypro.com → null
 * - www.catifypro.com → null
 * - localhost:5173 → null
 */
export function getSubdomainSlug(): string | null {
  const hostname = window.location.hostname;
  
  // Localhost nunca tiene subdominio de catálogo
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }
  
  // Obtener partes del dominio
  const parts = hostname.split('.');
  
  // Si solo hay 2 partes (ej: catifypro.com), no hay subdominio
  if (parts.length <= 2) {
    return null;
  }
  
  // El subdominio es la primera parte
  const subdomain = parts[0].toLowerCase();
  
  // Verificar si es un subdominio reservado
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return null;
  }
  
  // Para dominios de lovable (*.lovable.app), necesitamos más lógica
  // El formato es: project-id.lovable.app o subdomain.project-id.lovable.app
  if (hostname.includes('lovable.app') || hostname.includes('lovable.dev')) {
    // Si hay 4+ partes, la primera es el subdominio del catálogo
    // Ej: mi-tienda.abc123.lovable.app
    if (parts.length >= 4) {
      return subdomain;
    }
    return null;
  }
  
  // Para catifypro.com o cualquier dominio custom
  // mi-tienda.catifypro.com → mi-tienda
  return subdomain;
}

/**
 * Verifica si la URL actual es un acceso por subdominio
 */
export function isSubdomainAccess(): boolean {
  return getSubdomainSlug() !== null;
}

/**
 * Construye la URL del catálogo para un slug dado
 * @param slug - El slug del catálogo
 * @param useSubdomain - Si true, usa subdominio; si false, usa path
 */
export function getCatalogUrl(slug: string, useSubdomain: boolean = false): string {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  if (useSubdomain && hostname !== 'localhost') {
    // Construir URL con subdominio
    const parts = hostname.split('.');
    const baseDomain = parts.slice(-2).join('.');
    return `${protocol}//${slug}.${baseDomain}${port}`;
  }
  
  // URL con path (default)
  return `${protocol}//${hostname}${port}/c/${slug}`;
}
