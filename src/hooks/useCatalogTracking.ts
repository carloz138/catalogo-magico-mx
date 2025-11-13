import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

interface TrackingConfig {
  meta_capi?: {
    enabled: boolean;
    pixel_id: string;
  };
  // tiktok, google, etc...
}

export const useCatalogTracking = (catalogId: string, trackingConfig: TrackingConfig | null, products: any[]) => {
  const eventIdRef = useRef(uuidv4());

  useEffect(() => {
    if (!trackingConfig) return;

    const eventID = eventIdRef.current;
    const userAgent = navigator.userAgent;

    // -----------------------------
    // 1. META (FACEBOOK) TRACKING
    // -----------------------------
    if (trackingConfig.meta_capi?.enabled && trackingConfig.meta_capi.pixel_id) {
      // A. Browser Side (Pixel Clásico)
      const win = window as any; // Casting a any para evitar errores de TS con fbq

      if (typeof window !== "undefined" && !win.fbq) {
        // Lógica estándar de inicialización de FB corregida para TS (sin el !)
        (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = true;
          n.version = "2.0";
          n.queue = [];
          t = b.createElement(e);
          t.async = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      }

      // Inicializar
      win.fbq("init", trackingConfig.meta_capi.pixel_id);

      // Track PageView CON EventID
      win.fbq("track", "PageView", {}, { eventID: eventID });

      // B. Server Side (CAPI)
      sendEventToCAPI("meta", {
        event_name: "PageView",
        event_id: eventID,
        user_agent: userAgent,
        catalog_id: catalogId,
        url: window.location.href,
      });
    }
  }, [catalogId, trackingConfig]);

  const sendEventToCAPI = async (provider: string, payload: any) => {
    try {
      // Nota: Asegúrate de tener esta Edge Function creada en Supabase más adelante
      await supabase.functions.invoke("tracking-events", {
        body: { provider, ...payload },
      });
    } catch (error) {
      console.error(`Error enviando evento CAPI a ${provider}:`, error);
    }
  };
};
