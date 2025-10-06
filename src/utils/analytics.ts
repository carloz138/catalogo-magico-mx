import { ViewMetadata } from '@/services/analyticsService';

/**
 * Hashea una IP para privacidad usando SHA-256
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Obtiene geolocalización aproximada desde IP (usando servicio gratuito)
 */
export async function getLocationFromIP(ip: string): Promise<{
  country?: string;
  city?: string;
}> {
  try {
    // Usar servicio gratuito de geolocalización
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) {
      return {};
    }
    
    const data = await response.json();
    return {
      country: data.country_name || undefined,
      city: data.city || undefined,
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {};
  }
}

/**
 * Genera metadata de vista desde un Request
 */
export async function generateViewMetadata(request: Request): Promise<ViewMetadata> {
  // Obtener IP del cliente
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              '0.0.0.0';
  
  // Hashear IP para privacidad
  const ipHash = await hashIP(ip);
  
  // Obtener geolocalización
  const location = await getLocationFromIP(ip);
  
  // Obtener otros datos
  const userAgent = request.headers.get('user-agent') || undefined;
  const referrer = request.headers.get('referer') || undefined;
  
  return {
    ipHash,
    country: location.country,
    city: location.city,
    userAgent,
    referrer,
  };
}

/**
 * Verifica si una vista está dentro del rate limit (5 minutos)
 */
export function isWithinRateLimit(lastViewTime: number | null): boolean {
  if (!lastViewTime) return true;
  
  const fiveMinutesInMs = 5 * 60 * 1000;
  const now = Date.now();
  return (now - lastViewTime) >= fiveMinutesInMs;
}
