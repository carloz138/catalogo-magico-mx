import { useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

interface MetaPixelConfig {
  pixelId?: string;
  accessToken?: string;
  meta_capi?: {
    enabled: boolean;
    pixel_id?: string;
    access_token?: string;
    test_code?: string;
  };
}

interface UseMetaPixelProps {
  trackingConfig: MetaPixelConfig | null;
  isL2?: boolean;
}

interface EventData {
  currency?: string;
  value?: number;
  [key: string]: any;
}

interface UserData {
  email?: string;
  phone?: string;
  fn?: string; // first name
  ln?: string; // last name
  ct?: string; // city
  st?: string; // state
  zp?: string; // zip
  country?: string;
}

/**
 * Hook unificado para Meta (Facebook) Pixel + Conversions API (CAPI)
 * Estrategia híbrida: Dispara eventos al navegador y servidor simultáneamente
 */
export const useMetaPixel = ({ trackingConfig, isL2 = false }: UseMetaPixelProps) => {
  const pixelInitialized = useRef(false);

  // Determinar qué pixel usar (legacy vs CAPI)
  const activePixelId = trackingConfig?.meta_capi?.enabled 
    ? trackingConfig.meta_capi.pixel_id 
    : trackingConfig?.pixelId;

  const capiEnabled = trackingConfig?.meta_capi?.enabled || false;
  const accessToken = trackingConfig?.meta_capi?.access_token || trackingConfig?.accessToken;
  const testCode = trackingConfig?.meta_capi?.test_code;

  /**
   * Inicializar el script de Facebook Pixel (Browser-Side)
   */
  useEffect(() => {
    if (!activePixelId || pixelInitialized.current) return;

    const win = window as any;

    // Verificar si el script ya existe
    if (!win.fbq) {
      // Inyectar el script estándar de Facebook
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

    // Inicializar el pixel
    win.fbq("init", activePixelId);

    // Disparar PageView automático con event_id para deduplicación
    const pageViewEventId = uuidv4();
    win.fbq("track", "PageView", {}, { eventID: pageViewEventId });

    // Si CAPI está habilitado, enviar también al servidor
    if (capiEnabled && accessToken) {
      sendEventToCAPI({
        event_name: "PageView",
        event_id: pageViewEventId,
        user_data: {},
        custom_data: {},
      });
    }

    pixelInitialized.current = true;

    console.log("✅ Meta Pixel inicializado:", {
      pixelId: activePixelId,
      capiEnabled,
      isL2,
    });
  }, [activePixelId, capiEnabled, accessToken, isL2]);

  /**
   * Enviar evento a la Edge Function (CAPI - Server-Side)
   */
  const sendEventToCAPI = async ({
    event_name,
    event_id,
    user_data,
    custom_data,
  }: {
    event_name: string;
    event_id: string;
    user_data: UserData;
    custom_data: EventData;
  }) => {
    if (!capiEnabled || !accessToken) {
      console.log("⏭️ CAPI deshabilitado o sin access_token, saltando envío server-side");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("tracking-events", {
        body: {
          provider: "meta",
          event_name,
          event_id,
          user_data,
          custom_data,
          pixel_id: activePixelId,
          access_token: accessToken,
          test_code: testCode,
        },
      });

      if (error) {
        console.error("❌ Error enviando evento a CAPI:", error);
      } else {
        console.log("✅ Evento enviado a CAPI:", { event_name, event_id, response: data });
      }
    } catch (error) {
      console.error("❌ Error al invocar tracking-events:", error);
    }
  };

  /**
   * Función principal para trackear eventos (Híbrido: Browser + Server)
   */
  const trackEvent = useCallback(
    (eventName: string, data: EventData = {}, userData: UserData = {}) => {
      if (!activePixelId) {
        console.warn("⚠️ Meta Pixel no configurado, saltando tracking");
        return;
      }

      // Generar event_id único para deduplicación
      const eventId = uuidv4();

      const win = window as any;

      // 1. DISPARAR AL NAVEGADOR (Browser Pixel)
      if (win.fbq) {
        win.fbq("track", eventName, data, { eventID: eventId });
        console.log("📊 Evento enviado al navegador:", { eventName, eventId, data });
      }

      // 2. DISPARAR AL SERVIDOR (CAPI) - SIMULTÁNEAMENTE
      if (capiEnabled && accessToken) {
        sendEventToCAPI({
          event_name: eventName,
          event_id: eventId,
          user_data: userData,
          custom_data: data,
        });
      }
    },
    [activePixelId, capiEnabled, accessToken, testCode]
  );

  return {
    trackEvent,
    pixelId: activePixelId,
    isInitialized: pixelInitialized.current,
    capiEnabled,
  };
};
