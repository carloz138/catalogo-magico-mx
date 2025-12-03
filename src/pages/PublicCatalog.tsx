import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DigitalCatalog } from "@/types/digital-catalog";
import { Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useMetaTracking } from "@/hooks/useMetaTracking";
import { QuoteCartProvider } from "@/contexts/QuoteCartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

import { PublicCatalogContent } from "@/components/catalog/public/PublicCatalogContent";

// Tipos locales
interface Product {
  id: string;
  name: string;
  price_retail: number;
  price_wholesale?: number | null;
  image_url?: string;
  original_image_url?: string | null;
  has_variants?: boolean;
  variants?: Array<{
    id: string;
    price_retail: number;
    attributes: Record<string, string>;
  }>;
  is_reseller_product?: boolean;
}

const ScriptInjector = ({ headScripts, bodyScripts }: { headScripts?: string | null; bodyScripts?: string | null }) => {
  useEffect(() => {
    const injectedNodes: Node[] = [];
    if (headScripts) {
      const range = document.createRange();
      const fragment = range.createContextualFragment(headScripts);
      fragment.childNodes.forEach((node) => {
        const clone = node.cloneNode(true);
        document.head.appendChild(clone);
        injectedNodes.push(clone);
      });
    }
    if (bodyScripts) {
      const range = document.createRange();
      const fragment = range.createContextualFragment(bodyScripts);
      fragment.childNodes.forEach((node) => {
        const clone = node.cloneNode(true);
        document.body.appendChild(clone);
        injectedNodes.push(clone);
      });
    }
    return () => {
      injectedNodes.forEach((node) => {
        if (node.parentNode) node.parentNode.removeChild(node);
      });
    };
  }, [headScripts, bodyScripts]);
  return null;
};

export default function PublicCatalog() {
  const { slug } = useParams();
  const [accessPassword, setAccessPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    data: catalog,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-catalog", slug],
    queryFn: async () => {
      console.log(`--- DEBUG: Fetching Slug ${slug} ---`);

      let catalogIdToFetch: string | null = null;
      let isReplicated = false;
      let replicatedCatalogId: string | undefined = undefined;
      let resellerId: string | undefined = undefined;
      let catalogHeader: any | null = null;

      // 1. Intentar buscar como Catálogo Original (L1)
      let { data, error: errL1 } = await supabase.from("digital_catalogs").select(`*`).eq("slug", slug).maybeSingle();

      // 2. Si no existe, buscar como Réplica (L2)
      if (!data) {
        const { data: replica } = await supabase
          .from("replicated_catalogs")
          .select(`*, digital_catalogs (*)`)
          .eq("slug", slug)
          .maybeSingle();

        if (replica && replica.digital_catalogs) {
          // AQUI ESTA LA CLAVE: Heredamos TODO el objeto del catálogo original (Template, Configuración, Scripts)
          catalogHeader = { ...replica.digital_catalogs };

          isReplicated = true;
          replicatedCatalogId = replica.id;
          resellerId = replica.reseller_id || undefined;
          catalogIdToFetch = catalogHeader.id || null;
        }
      } else {
        // Es un catálogo original
        catalogHeader = data;
        catalogIdToFetch = data.id;
      }

      if (!catalogHeader || !catalogIdToFetch) return null;

      // --- LOGICA DE BRANDING (Solo para Revendedores) ---
      // Si es L2, consultamos SU tabla de business_info para "vestir" el catálogo
      if (isReplicated && resellerId) {
        const { data: businessInfo } = await supabase
          .from("business_info")
          .select("*")
          .eq("user_id", resellerId)
          .maybeSingle();

        if (businessInfo) {
          // 1. Sobrescribimos Identidad Visual (Header y Metaetiquetas)
          if (businessInfo.business_name) catalogHeader.name = businessInfo.business_name;
          if (businessInfo.description) catalogHeader.description = businessInfo.description;
          if (businessInfo.logo_url) catalogHeader.logo_url = businessInfo.logo_url;

          // 2. Sobrescribimos Colores (Respetando el Template L1, solo cambiamos la paleta)
          if (businessInfo.primary_color) {
            catalogHeader.brand_colors = {
              primary: businessInfo.primary_color,
              secondary: businessInfo.secondary_color || catalogHeader.brand_colors?.secondary || "#000000",
            };
          }

          // 3. Sobrescribimos Datos de Contacto (Para el Footer/Botones de contacto)
          // Esto llena la prop 'business_info' que espera tu componente PublicCatalogContent
          catalogHeader.business_info = {
            business_name: businessInfo.business_name,
            logo_url: businessInfo.logo_url,
            phone: businessInfo.phone,
            email: businessInfo.email,
            website: businessInfo.website,
            address: businessInfo.address,
            social_media: businessInfo.social_media, // Si tu componente lo usa
          };
        }
      }
      // ----------------------------------------------------

      // --- FETCH DE PRODUCTOS (Híbrido) ---

      // A) Productos L1 (Originales)
      const { data: rawL1Products, error: prodError } = await supabase
        .from("catalog_products")
        .select(`product_id, products!catalog_products_product_id_fkey (*)`)
        .eq("catalog_id", catalogIdToFetch);

      if (prodError) throw prodError;

      let l1Products = rawL1Products?.map((cp: any) => cp.products).filter(Boolean) || [];

      // HIDRATACIÓN DE PRECIOS (Si el revendedor cambió precios)
      if (isReplicated && replicatedCatalogId) {
        const { data: customPrices } = await supabase
          .from("reseller_product_prices")
          .select("product_id, custom_price_retail, custom_price_wholesale")
          .eq("replicated_catalog_id", replicatedCatalogId);

        if (customPrices && customPrices.length > 0) {
          const priceMap = new Map(customPrices.map((p) => [p.product_id, p]));
          l1Products = l1Products.map((p: any) => {
            const override = priceMap.get(p.id);
            if (override) {
              return {
                ...p,
                price_retail: override.custom_price_retail ?? p.price_retail,
                price_wholesale: override.custom_price_wholesale ?? p.price_wholesale,
              };
            }
            return p;
          });
        }
      }

      // B) Productos L2 (Propios del Revendedor)
      let l2Products: any[] = [];
      if (isReplicated && resellerId) {
        const { data: rawL2Products, error: l2Error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", resellerId)
          .is("deleted_at", null);

        if (!l2Error && rawL2Products) {
          l2Products = rawL2Products.map((p) => ({
            ...p,
            is_reseller_product: true,
          }));
        }
      }

      // MEZCLA FINAL
      const allProducts = [...l1Products, ...l2Products];

      supabase.rpc("increment_view_count" as any, { row_id: catalogIdToFetch }).then();

      // RETORNO
      // Notarás que 'catalogHeader' ya trae el 'web_template_id' correcto del original
      return {
        ...catalogHeader,
        products: allProducts as Product[],
        isReplicated,
        replicatedCatalogId,
        resellerId,
      } as DigitalCatalog & {
        isReplicated?: boolean;
        replicatedCatalogId?: string;
        resellerId?: string;
        products: Product[];
      };
    },
    retry: false,
  });

  // Tracking
  const trackingConfig = (catalog?.tracking_config as any) || {};
  const { trackEvent } = useMetaTracking({
    enabled: true,
    pixelId: trackingConfig.pixelId,
    accessToken: trackingConfig.accessToken,
    isEnterprise: !!trackingConfig.accessToken,
  });

  useEffect(() => {
    if (catalog) {
      trackEvent("PageView");
      trackEvent("ViewContent", {
        content_name: catalog.name,
        content_ids: [catalog.id],
        content_type: "product_group",
      });
    }
  }, [catalog?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="h-64 w-full bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="h-8 w-8 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Enlace no disponible</h1>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </div>
    );
  }

  if (catalog.is_private && !isAuthenticated) {
    const handleUnlock = () => {
      if (accessPassword === catalog.access_password) {
        setIsAuthenticated(true);
        trackEvent("UnlockContent");
      } else {
        toast({ title: "Acceso denegado", description: "Credenciales inválidas.", variant: "destructive" });
      }
    };
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
        <Card className="z-10 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Catálogo Protegido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              placeholder="Contraseña"
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            <Button onClick={handleUnlock} className="w-full">
              Desbloquear
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <QuoteCartProvider>
      <Helmet>
        <title>{catalog.name}</title>
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={catalog.name} />
        <meta
          property="og:description"
          content={catalog.description || `Mira el catálogo digital de ${catalog.name}.`}
        />
        {catalog.logo_url && <meta property="og:image" content={catalog.logo_url} />}
        {catalog.brand_colors?.primary && <meta name="theme-color" content={catalog.brand_colors.primary} />}
      </Helmet>

      <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />

      <PublicCatalogContent catalog={catalog} onTrackEvent={trackEvent} />
    </QuoteCartProvider>
  );
}
