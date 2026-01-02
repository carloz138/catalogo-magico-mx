import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DigitalCatalog } from "@/types/digital-catalog";
import { Lock, AlertCircle, Loader2, Sparkles, Store, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useMetaPixel } from "@/hooks/useMetaPixel";
import { QuoteCartProvider } from "@/contexts/QuoteCartContext";
import { Helmet } from "react-helmet-async";
import { useUserRole } from "@/contexts/RoleContext";

import { PublicCatalogContent } from "@/components/catalog/public/PublicCatalogContent";
import { MarginModal } from "@/components/marketplace/MarginModal";

// --- TIPOS ---

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

interface PublicCatalogProps {
  subdomainSlug?: string;
}

// --- UTILIDAD: FORMATEAR DIRECCIÓN ---
// Convierte el objeto JSON nuevo a texto plano para que no rompa la UI
const formatAddress = (addr: any): string | null => {
  if (!addr) return null;
  if (typeof addr === "string") return addr; // Formato viejo
  if (typeof addr === "object") {
    // Formato nuevo (JSON)
    const parts = [addr.street, addr.colony, addr.city, addr.state, addr.zip_code ? `CP ${addr.zip_code}` : null];
    return parts.filter(Boolean).join(", ");
  }
  return null;
};

// --- COMPONENTES AUXILIARES ---

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

// --- COMPONENTE PRINCIPAL ---

export default function PublicCatalog({ subdomainSlug }: PublicCatalogProps = {}) {
  const { slug: pathSlug } = useParams();
  const navigate = useNavigate();
  const { refreshRole } = useUserRole();

  const slug = subdomainSlug || pathSlug;

  const [accessPassword, setAccessPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isMarginModalOpen, setIsMarginModalOpen] = useState(false);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

      // 1. Intentar buscar en digital_catalogs (L1)
      let { data, error: errL1 } = await supabase.from("digital_catalogs").select(`*`).eq("slug", slug).maybeSingle();

      if (!data) {
        // 2. Si no, buscar en replicated_catalogs (L2)
        const { data: replica } = await supabase
          .from("replicated_catalogs")
          .select(`*, digital_catalogs (*)`)
          .eq("slug", slug)
          .maybeSingle();

        if (replica && replica.digital_catalogs) {
          catalogHeader = { ...replica.digital_catalogs };
          isReplicated = true;
          replicatedCatalogId = replica.id;
          resellerId = replica.reseller_id || undefined;
          catalogIdToFetch = catalogHeader.id || null;
        }
      } else {
        catalogHeader = data;
        catalogIdToFetch = data.id;
      }

      if (!catalogHeader || !catalogIdToFetch) return null;

      // 3. Si es replicado, sobreescribir branding con datos del Reseller
      if (isReplicated && resellerId) {
        const { data: businessInfo } = await supabase
          .from("business_info")
          .select("*")
          .eq("user_id", resellerId)
          .maybeSingle();

        if (businessInfo) {
          if (businessInfo.business_name) catalogHeader.name = businessInfo.business_name;
          if (businessInfo.description) catalogHeader.description = businessInfo.description;
          if (businessInfo.logo_url) catalogHeader.logo_url = businessInfo.logo_url;

          if (businessInfo.primary_color) {
            catalogHeader.brand_colors = {
              primary: businessInfo.primary_color,
              secondary: businessInfo.secondary_color || catalogHeader.brand_colors?.secondary || "#000000",
            };
          }

          catalogHeader.business_info = {
            business_name: businessInfo.business_name,
            logo_url: businessInfo.logo_url,
            phone: businessInfo.phone,
            email: businessInfo.email,
            website: businessInfo.website,
            // ✅ APLICAMOS EL FORMATEADOR AQUÍ
            address: formatAddress(businessInfo.address),
            social_media: businessInfo.social_media,
          };
        }
      } else if (!isReplicated) {
        // Si es L1, también necesitamos buscar su Business Info para mostrar la dirección correcta en el catálogo
        // (Antes tal vez lo tomaba de otro lado, pero ahora es buena práctica unificarlo)
        const { data: l1Info } = await supabase
          .from("business_info")
          .select("*")
          .eq("user_id", catalogHeader.user_id)
          .maybeSingle();

        if (l1Info) {
          // Inyectamos la info estructurada también para el L1
          catalogHeader.business_info = {
            business_name: l1Info.business_name || catalogHeader.name,
            logo_url: l1Info.logo_url || catalogHeader.logo_url,
            phone: l1Info.phone,
            email: l1Info.email,
            website: l1Info.website,
            address: formatAddress(l1Info.address),
            social_media: l1Info.social_media,
          };
        }
      }

      // 4. Fetch Products (L1 Original)
      const { data: rawL1Products, error: prodError } = await supabase
        .from("catalog_products")
        .select(`product_id, products!catalog_products_product_id_fkey (*)`)
        .eq("catalog_id", catalogIdToFetch);

      if (prodError) throw prodError;

      let l1Products = rawL1Products?.map((cp: any) => cp.products).filter(Boolean) || [];

      // 5. Si es replicado, aplicar precios personalizados (Overlay Prices)
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

      // 6. Si el Reseller tiene productos propios, agregarlos (Hybrid Catalog)
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

      const allProducts = [...l1Products, ...l2Products];

      // Incrementar contador de visitas
      supabase.rpc("increment_view_count" as any, { row_id: catalogIdToFetch }).then();

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

  const { data: subscribedVendorIds = [] } = useQuery({
    queryKey: ["subscribed-vendors", catalog?.resellerId],
    queryFn: async () => {
      if (!catalog?.resellerId) return [];

      const { data: subscriptions } = await supabase
        .from("catalog_subscriptions")
        .select("original_catalog_id, digital_catalogs!catalog_subscriptions_original_catalog_id_fkey(user_id)")
        .eq("subscriber_id", catalog.resellerId)
        .eq("is_active", true);

      if (!subscriptions) return [];

      return subscriptions
        .map((s: any) => s.digital_catalogs?.user_id)
        .filter((id: string | null): id is string => id != null);
    },
    enabled: !!catalog?.resellerId,
  });

  const trackingConfig = (catalog?.tracking_config as any) || null;
  const { trackEvent } = useMetaPixel({
    trackingConfig,
    isL2: catalog?.isReplicated,
  });

  // ViewContent tracking after catalog loads
  useEffect(() => {
    if (catalog) {
      trackEvent("ViewContent", {
        content_name: catalog.name,
        content_ids: [catalog.id],
        content_type: "product_group",
      });
    }
  }, [catalog?.id]);

  const handleSellNowClick = () => {
    if (!catalog) return;

    if (!currentUser) {
      localStorage.setItem("pending_replication_catalog_id", catalog.id);
      toast({
        title: "Inicia sesión para vender",
        description: "Crea una cuenta GRATIS para importar estos productos.",
      });
      navigate("/login?intent=replicate");
      return;
    }

    setIsMarginModalOpen(true);
  };

  const handleConfirmSubscription = async (marginPercentage: number) => {
    if (!catalog || !currentUser) return;

    setIsProcessingSubscription(true);
    try {
      const { data, error } = await supabase.rpc("subscribe_with_margin", {
        p_catalog_id: catalog.id,
        p_margin_percentage: marginPercentage,
      });

      if (error) throw error;

      toast({
        title: "¡Catálogo Importado!",
        description: `Productos agregados con ${marginPercentage}% de margen.`,
        className: "bg-green-50 border-green-200 text-green-800",
      });

      await refreshRole();
      
      // Disparar evento de "Nuevo Distribuidor" para el L1 (dueño original)
      if (catalog.user_id) {
        trackEvent("CompleteRegistration", { 
          content_name: "Nuevo Distribuidor",
          currency: "MXN",
          value: 0 
        });
      }
      
      navigate("/products");
    } catch (err: any) {
      console.error("Error subscribing:", err);
      toast({
        title: "Error al importar",
        description: err.message || "Intenta de nuevo más tarde",
        variant: "destructive",
      });
    } finally {
      setIsProcessingSubscription(false);
      setIsMarginModalOpen(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Catálogo no encontrado</h1>
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

  const canReplicate =
    catalog.enable_distribution && (!currentUser || currentUser.id !== catalog.user_id) && !catalog.isReplicated;

  return (
    <QuoteCartProvider catalogId={catalog.id}>
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

      <PublicCatalogContent catalog={catalog} onTrackEvent={trackEvent} subscribedVendorIds={subscribedVendorIds} />

      {canReplicate && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:left-8 md:bottom-8 md:right-auto md:w-auto animate-in slide-in-from-bottom-4 duration-700 fade-in">
          <div className="bg-white/90 backdrop-blur-md border border-purple-100 shadow-2xl rounded-2xl p-1 flex items-center gap-3 pr-2 md:max-w-sm ring-1 ring-black/5">
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
              <Store className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 pl-1 min-w-0 py-1">
              <h3 className="font-bold text-sm text-gray-900 leading-tight flex items-center gap-1">
                Vende esto <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-gray-500 truncate leading-tight">Gana comisiones sin stock.</p>
            </div>

            <Button
              onClick={handleSellNowClick}
              size="sm"
              className="bg-gray-900 hover:bg-black text-white font-medium rounded-lg px-3 py-4 shadow-lg hover:shadow-xl transition-all active:scale-95 shrink-0 group ml-2"
            >
              <span className="mr-1 text-emerald-400 font-bold">$</span>
              Vender
              <ChevronRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      <MarginModal
        open={isMarginModalOpen}
        onOpenChange={setIsMarginModalOpen}
        onConfirm={handleConfirmSubscription}
        isLoading={isProcessingSubscription}
        catalogName={catalog?.name || "Catálogo"}
      />
    </QuoteCartProvider>
  );
}
