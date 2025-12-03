import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

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

  // Function to track custom events
  const trackSaaSEvent = useCallback((eventName: string, data?: Record<string, any>) => {
    if (!pixelId || !window.fbq) {
      console.warn('[SaaS Pixel] Not initialized, skipping event:', eventName);
      return;
    }

    // Use standard events when applicable, otherwise trackCustom
    const standardEvents = [
      'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
      'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
      'Lead', 'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication',
      'Subscribe', 'ViewContent'
    ];

    if (standardEvents.includes(eventName)) {
      window.fbq?.('track', eventName, data);
    } else {
      window.fbq?.('trackCustom', eventName, data);
    }

    console.log('[SaaS Pixel] Event tracked:', eventName, data);
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
