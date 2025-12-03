import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DigitalCatalog } from "@/types/digital-catalog";
import { Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PublicCatalogContent } from "@/components/catalog/public/PublicCatalogContent";
import { toast } from "@/hooks/use-toast";
import { useMetaTracking } from "@/hooks/useMetaTracking";
import { QuoteCartProvider } from "@/contexts/QuoteCartContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

// DEFINICIÓN LOCAL DE PRODUCT (Mantenemos consistencia)
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
  catalog_products?: any;
  user_id?: string; // Agregado para distinguir dueño
}

// --- COMPONENTE: INYECTOR DE SCRIPTS ---
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
export default function PublicCatalog() {
  const { slug } = useParams();
  const [accessPassword, setAccessPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 1. FETCH DE DATOS (HÍBRIDO: L1 + L2)
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

      // 1.1 Buscar L1 (Catálogo Original)
      let { data, error: errL1 } = await supabase.from("digital_catalogs").select(`*`).eq("slug", slug).maybeSingle();

      // 1.2 Buscar L2 (Si no es L1, buscamos en Réplicas)
      if (!data) {
        const { data: replica } = await supabase
          .from("replicated_catalogs")
          .select(`*, digital_catalogs (*)`)
          .eq("slug", slug)
          .maybeSingle();

        if (replica && replica.digital_catalogs) {
          catalogHeader = replica.digital_catalogs as Partial<DigitalCatalog>;
          isReplicated = true;
          replicatedCatalogId = replica.id;
          resellerId = replica.reseller_id || undefined;
          catalogIdToFetch = catalogHeader.id || null;
        }
      } else {
        catalogHeader = data;
        catalogIdToFetch = data.id;
      }

      // 2. Fail Check
      if (!catalogHeader || !catalogIdToFetch) return null;

      // 3. Fetch Productos L1 (Dropshipping)
      const { data: rawProducts, error: prodError } = await supabase
        .from("catalog_products")
        .select(
          `
            product_id, 
            products!catalog_products_product_id_fkey (*)
        `,
        )
        .eq("catalog_id", catalogIdToFetch);

      if (prodError) {
        console.error("Error loading catalog products:", prodError);
        throw prodError;
      }

      let products = rawProducts?.map((cp: any) => cp.products).filter(Boolean) || [];

      // ✅ 4. Fetch Productos L2 (Propios) - LA FUSIÓN
      // Solo si es una réplica y tiene un revendedor asignado
      if (isReplicated && resellerId) {
        console.log(`--- DEBUG: Fetching owned products for L2: ${resellerId} ---`);

        const { data: l2Products, error: l2Error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", resellerId) // Son del revendedor
          .eq("origin", "owned") // Son creados por él
          .eq("is_active", true); // Están activos

        if (!l2Error && l2Products && l2Products.length > 0) {
          // Mezclamos los productos del L1 con los del L2
          // Usamos un Map por si acaso hubiera IDs duplicados (seguridad)
          const productsMap = new Map();

          // Primero ponemos L1
          products.forEach((p: any) => productsMap.set(p.id, p));

          // Luego ponemos L2 (y si hubiera conflicto, L2 gana por ser el dueño de la tienda)
          l2Products.forEach((p: any) => productsMap.set(p.id, p));

          products = Array.from(productsMap.values());
        }
      }

      // View Count (Fire & Forget)
      supabase.rpc("increment_view_count" as any, { row_id: catalogIdToFetch }).then();

      // RETORNAMOS EL OBJETO COMPLETO
      return {
        ...catalogHeader,
        products: products as Product[],
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

  // 2. SEO TITLE UPDATE
  useEffect(() => {
    if (catalog?.name) {
      document.title = `${catalog.name} | Catálogo Digital`;
    } else {
      document.title = "CatifyPro | Catálogo Digital";
    }
    return () => {
      document.title = "CatifyPro";
    };
  }, [catalog?.name]);

  // 3. TRACKING CONFIG
  const trackingConfig = (catalog?.tracking_config as any) || {};
  const { trackEvent } = useMetaTracking({
    enabled: true,
    pixelId: trackingConfig.pixelId,
    accessToken: trackingConfig.accessToken,
    isEnterprise: !!trackingConfig.accessToken,
  });

  // 4. PAGE VIEW TRACKING
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

  // --- ESTADOS DE INTERFAZ ---

  // A) LOADING: Skeleton Screen "Premium"
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Banner Skeleton */}
        <div className="h-64 w-full bg-slate-200 animate-pulse" />

        <div className="container mx-auto px-4 -mt-8 z-10">
          {/* Toolbar Skeleton */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-slate-100 h-24 w-full animate-pulse" />

          {/* Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden h-80">
                <Skeleton className="h-48 w-full rounded-none bg-slate-100" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-100" />
                  <Skeleton className="h-4 w-1/2 bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // B) ERROR: Diseño Industrial Limpio
  if (error || !catalog) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
          <AlertCircle className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Enlace no disponible</h1>
        <p className="text-slate-500 max-w-md">
          Es posible que el catálogo haya expirado, haya sido eliminado por el proveedor o el enlace sea incorrecto.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </div>
    );
  }

  // C) LOCK SCREEN: Diseño "Vault" (Caja Fuerte)
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
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border-t-4 border-t-indigo-600 shadow-2xl bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white shadow-sm">
                <Lock className="h-7 w-7 text-indigo-600" />
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">Catálogo Protegido</CardTitle>
              <CardDescription className="text-slate-500">
                Este contenido es exclusivo. Ingresa tu clave de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Ingresa la contraseña..."
                  className="text-center text-lg tracking-widest h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  autoFocus
                />
              </div>
              <Button
                className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                onClick={handleUnlock}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Desbloquear Acceso
              </Button>

              <div className="pt-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Secured by CatifyPro</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />
      </div>
    );
  }

  // D) RENDER FINAL: Catálogo Abierto
  return (
    <QuoteCartProvider>
      <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />
      {/* catalog.replicatedCatalogId es la clave para que la venta sea viral.
          PublicCatalogContent se encargará de pasarlo al QuoteForm.
      */}
      <PublicCatalogContent catalog={catalog} onTrackEvent={trackEvent} />
    </QuoteCartProvider>
  );
}
