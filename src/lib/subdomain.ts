/**
 * Subdomain Detection Utility for CatifyPro
 * Enables automatic subdomains like: mi-tienda.catifypro.com
 */

import { supabase } from "@/integrations/supabase/client";

// Subdominios del sistema que no son catálogos
const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'staging',
  'dev',
  'test',
  'mail',
  'smtp',
  'ftp',
];

/**
 * Extrae el subdominio desde la URL actual
 * @returns El subdominio si existe, null si es dominio base
 * 
 * Ejemplos:
 * - mi-tienda.catifypro.com → "mi-tienda"
 * - catifypro.com → null
 * - www.catifypro.com → null
 * - localhost:5173 → null
 */
export function getSubdomainFromUrl(): string | null {
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
 * Busca el catálogo asociado a un subdominio
 * @returns El slug del catálogo principal del usuario con ese subdominio
 */
export async function getCatalogBySubdomain(subdomain: string): Promise<{
  userId: string;
  catalogSlug: string | null;
} | null> {
  // 1. Buscar usuario por subdominio en business_info
  const { data: businessInfo, error } = await supabase
    .from('business_info')
    .select('user_id')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (error || !businessInfo) {
    return null;
  }

  // 2. Buscar el catálogo activo más reciente del usuario
  const { data: catalog } = await supabase
    .from('digital_catalogs')
    .select('slug')
    .eq('user_id', businessInfo.user_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    userId: businessInfo.user_id,
    catalogSlug: catalog?.slug || null,
  };
}

/**
 * Verifica si la URL actual es un acceso por subdominio
 */
export function isSubdomainAccess(): boolean {
  return getSubdomainFromUrl() !== null;
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
