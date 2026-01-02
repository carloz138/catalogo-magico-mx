import { useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

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

interface CAPIEventPayload {
  event_name: string;
  event_id: string;
  user_data: Record<string, any>;
  custom_data: Record<string, any>;
}

export const useMetaPixel = ({ trackingConfig, isL2 = false }: UseMetaPixelProps) => {
  const pixelInitialized = useRef(false);

  const activePixelId = trackingConfig?.meta_capi?.enabled 
    ? trackingConfig.meta_capi.pixel_id 
    : trackingConfig?.pixelId;

  const capiEnabled = trackingConfig?.meta_capi?.enabled || (!!trackingConfig?.accessToken);
  const accessToken = trackingConfig?.meta_capi?.access_token || trackingConfig?.accessToken;
  const testCode = trackingConfig?.meta_capi?.test_code;

  const sendEventToCAPI = useCallback(async ({ event_name, event_id, user_data, custom_data }: CAPIEventPayload) => {
    if (!capiEnabled || !accessToken || !activePixelId) return;
    
    // Fire and Forget - don't await
    supabase.functions.invoke("tracking-events", {
      body: {
        pixel_id: activePixelId,
        access_token: accessToken,
        event_name,
        event_id,
        event_source_url: window.location.href,
        user_data: {
          ...user_data,
          fbc: getCookie('_fbc'),
          fbp: getCookie('_fbp'),
          client_user_agent: navigator.userAgent,
        },
        custom_data,
        test_event_code: testCode,
      },
    }).catch((err) => console.error('[CAPI] Error sending event:', err));
  }, [capiEnabled, accessToken, activePixelId, testCode]);

  // Initialize Pixel and send PageView once
  useEffect(() => {
    if (!activePixelId || pixelInitialized.current) return;
    
    const win = window as any;

    // Load Facebook Pixel script if not already loaded
    if (!win.fbq) {
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

    win.fbq("init", activePixelId);
    
    // Automatic PageView with Deduplication
    const pageViewEventId = uuidv4();
    win.fbq("track", "PageView", {}, { eventID: pageViewEventId });

    // Send to CAPI as well for hybrid tracking
    if (capiEnabled && accessToken) {
      sendEventToCAPI({
        event_name: "PageView",
        event_id: pageViewEventId,
        user_data: {},
        custom_data: {},
      });
    }

    console.log(`[Meta Pixel] Initialized with ID: ${activePixelId}, L2: ${isL2}`);
    pixelInitialized.current = true;
  }, [activePixelId, capiEnabled, accessToken, isL2, sendEventToCAPI]);

  const trackEvent = useCallback((eventName: string, data: Record<string, any> = {}, userData: Record<string, any> = {}) => {
    if (!activePixelId) return;
    
    const eventId = uuidv4();
    const win = window as any;

    // Browser-side tracking
    if (win.fbq) {
      win.fbq("track", eventName, data, { eventID: eventId });
    }
    
    // Server-side tracking (CAPI)
    if (capiEnabled && accessToken) {
      sendEventToCAPI({
        event_name: eventName,
        event_id: eventId,
        user_data: userData,
        custom_data: data,
      });
    }
    
    console.log(`[Meta Pixel] Event: ${eventName}`, { eventId, data });
  }, [activePixelId, capiEnabled, accessToken, sendEventToCAPI]);

  return { trackEvent };
};
