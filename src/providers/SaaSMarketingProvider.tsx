import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface SaaSMarketingContextValue {
  trackSaaSEvent: (eventName: string, data?: Record<string, any>) => void;
  isInitialized: boolean;
}

const SaaSMarketingContext = createContext<SaaSMarketingContextValue>({
  trackSaaSEvent: () => {},
  isInitialized: false,
});

export const useSaaSMarketing = () => useContext(SaaSMarketingContext);

interface SaaSMarketingProviderProps {
  children: React.ReactNode;
}

export const SaaSMarketingProvider: React.FC<SaaSMarketingProviderProps> = ({ children }) => {
  const location = useLocation();
  const isInitializedRef = useRef(false);
  const pixelId = import.meta.env.VITE_SAAS_PIXEL_ID;

  // Initialize Facebook Pixel once
  useEffect(() => {
    if (!pixelId || isInitializedRef.current) return;

    // Facebook Pixel base code
    (function(f: any, b: Document, e: string, v: string) {
      if (f.fbq) return;
      const n: any = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s?.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq?.('init', pixelId);
    window.fbq?.('track', 'PageView');
    
    isInitializedRef.current = true;
    console.log('[SaaS Pixel] Initialized with ID:', pixelId);
  }, [pixelId]);

  // Track PageView on route changes
  useEffect(() => {
    if (!pixelId || !isInitializedRef.current) return;
    
    window.fbq?.('track', 'PageView');
  }, [location.pathname, pixelId]);

  // Hybrid tracking function: Browser Pixel + Server CAPI
  const trackSaaSEvent = useCallback(async (eventName: string, data?: Record<string, any>) => {
    // Generate unique event ID for deduplication
    const eventId = crypto.randomUUID();

    // 1. BROWSER PIXEL (Client-side)
    if (pixelId && window.fbq) {
      const standardEvents = [
        'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
        'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
        'Lead', 'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication',
        'Subscribe', 'ViewContent'
      ];

      if (standardEvents.includes(eventName)) {
        window.fbq('track', eventName, data, { eventID: eventId });
      } else {
        window.fbq('trackCustom', eventName, data, { eventID: eventId });
      }
      console.log('[SaaS Pixel] Browser event:', eventName, eventId);
    }

    // 2. SERVER CAPI (via Edge Function)
    try {
      const { error } = await supabase.functions.invoke('fb-conversion', {
        body: {
          event_name: eventName,
          event_id: eventId,
          event_source_url: window.location.href,
          user_email: data?.email,
          user_phone: data?.phone,
          custom_data: data
        }
      });

      if (error) {
        console.warn('[SaaS CAPI] Error:', error.message);
      } else {
        console.log('[SaaS CAPI] Server event sent:', eventName, eventId);
      }
    } catch (err) {
      // Silent fail - don't break UX if CAPI fails
      console.warn('[SaaS CAPI] Failed:', err);
    }
  }, [pixelId]);

  const contextValue: SaaSMarketingContextValue = {
    trackSaaSEvent,
    isInitialized: isInitializedRef.current,
  };

  return (
    <SaaSMarketingContext.Provider value={contextValue}>
      {children}
    </SaaSMarketingContext.Provider>
  );
};

export default SaaSMarketingProvider;
