import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";

// Tipos para tu configuración (ajustaremos esto cuando veamos tus planes)
interface TrackingConfig {
  meta?: {
    enabled: boolean;
    pixel_id: string;
  };
  tiktok?: {
    enabled: boolean;
    pixel_id: string;
  };
  // Futuros: Google, LinkedIn, etc.
}

export const useCatalogTracking = (
  catalogId: string,
  trackingConfig: TrackingConfig | null,
  products: any[] // Para enviar info del contenido si es necesario
) => {
  const eventIdRef = useRef(uuidv4()); // Generamos un ID único por carga de página

  useEffect(() => {
    if (!trackingConfig) return;

    const eventID = eventIdRef.current;
    const userAgent = navigator.userAgent;
    
    // -----------------------------
    // 1. META (FACEBOOK) TRACKING
    // -----------------------------
    if (trackingConfig.meta?.enabled && trackingConfig.meta.pixel_id) {
      // A. Browser Side (Pixel Clásico)
      // Iniciamos el pixel si no existe
      if (typeof window !== 'undefined' && !(window as any).fbq) {
         // Lógica estándar de inicialización de FB
         !function(f,b,e,v,n,t,s)
         {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
         n.callMethod.apply(n,arguments):n.queue.push(arguments)};
         if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
         n.queue=[];t=b.createElement(e);t.async=!0;
         t.src=v;s=b.getElementsByTagName(e)[0];
         s.parentNode.insertBefore(t,s)}(window, document,'script',
         'https://connect.facebook.net/en_US/fbevents.js');
      }

      // Inicializar con el ID del usuario
      (window as any).fbq('init', trackingConfig.meta.pixel_id);
      
      // Track PageView CON el EventID para deduplicación
      (window as any).fbq('track', 'PageView', {}, { eventID: eventID });

      // B. Server Side (CAPI) - Llamada a Supabase Edge Function
      // Esto se hace en "segundo plano" sin bloquear la UI
      sendEventToCAPI('meta', {
        event_name: 'PageView',
        event_id: eventID,
        user_agent: userAgent,
        catalog_id: catalogId,
        url: window.location.href
      });
    }

    // -----------------------------
    // 2. TIKTOK TRACKING (Estructura lista)
    // -----------------------------
    if (trackingConfig.tiktok?.enabled && trackingConfig.tiktok.pixel_id) {
       // Lógica similar para TikTok...
    }

  }, [catalogId, trackingConfig]);

  // Función auxiliar para hablar con tu Edge Function
  const sendEventToCAPI = async (provider: string, payload: any) => {
    try {
      // Asumimos que crearás una Edge Function llamada 'tracking-events'
      await supabase.functions.invoke('tracking-events', {
        body: { provider, ...payload }
      });
    } catch (error) {
      console.error(`Error enviando evento CAPI a ${provider}:`, error);
    }
  };
};
