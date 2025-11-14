import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

interface MetaConfig {
  pixelId?: string;
  accessToken?: string; // Solo para Enterprise
  enabled: boolean;
  isEnterprise: boolean;
}

export const useMetaTracking = (config: MetaConfig) => {
  
  // 1. Inicializar el Pixel en el navegador (Solo si no está ya)
  useEffect(() => {
    if (config.enabled && config.pixelId && typeof window !== 'undefined') {
      // Código estándar de inicialización de Facebook Pixel
      if (!(window as any).fbq) {
        (function(f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
            n.queue = []; t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s)
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      }
      // Inicializar con el ID del cliente
      (window as any).fbq('init', config.pixelId);
      (window as any).fbq('track', 'PageView');
    }
  }, [config.pixelId, config.enabled]);

  // 2. Función para rastrear eventos (Híbrida: Pixel + CAPI)
  const trackEvent = async (eventName: string, data: any = {}, userData: any = {}) => {
    if (!config.enabled || !config.pixelId) return;

    // A. Lado Cliente (Pixel) - Para Pro y Enterprise
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, data);
    }

    // B. Lado Servidor (CAPI) - Solo Enterprise (y si hay token)
    if (config.isEnterprise && config.accessToken) {
      try {
        // Datos técnicos del navegador para deduplicación
        const fbc = getCookie('_fbc');
        const fbp = getCookie('_fbp');
        
        await supabase.functions.invoke('meta-capi', {
          body: {
            pixelId: config.pixelId,
            accessToken: config.accessToken,
            eventName,
            eventData: data,
            userData: {
              ...userData, // email, phone, etc.
              userAgent: navigator.userAgent,
              ip: 'auto', // La Edge Function puede inferir la IP
              fbc,
              fbp
            }
          }
        });
      } catch (error) {
        console.error("Error enviando evento CAPI:", error);
      }
    }
  };

  return { trackEvent };
};

// Helper para leer cookies de FB
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}
