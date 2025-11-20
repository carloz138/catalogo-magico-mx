import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DigitalCatalog, Product } from "@/types/digital-catalog";
import { Loader2, Lock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PublicCatalogContent } from "@/components/catalog/public/PublicCatalogContent";
import { toast } from "@/hooks/use-toast";
import { useMetaTracking } from "@/hooks/useMetaTracking";
import { QuoteCartProvider } from "@/contexts/QuoteCartContext";

// Componente para inyectar scripts crudos (Head/Body)
const ScriptInjector = ({ headScripts, bodyScripts }: { headScripts?: string | null; bodyScripts?: string | null }) => {
  useEffect(() => {
    const injectedNodes: Node[] = [];

    // 1. Inyectar Head Scripts
    if (headScripts) {
      const range = document.createRange();
      const fragment = range.createContextualFragment(headScripts);
      fragment.childNodes.forEach((node) => {
        const clone = node.cloneNode(true);
        document.head.appendChild(clone);
        injectedNodes.push(clone);
      });
    }

    // 2. Inyectar Body Scripts (al final del body)
    if (bodyScripts) {
      const range = document.createRange();
      const fragment = range.createContextualFragment(bodyScripts);
      fragment.childNodes.forEach((node) => {
        const clone = node.cloneNode(true);
        document.body.appendChild(clone);
        injectedNodes.push(clone);
      });
    }

    // Cleanup: Remover scripts al salir de la página
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

  // 1. Cargar el Catálogo (Lógica de Replicación L1/L2)
  const {
    data: catalog,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-catalog", slug],
    queryFn: async () => {
      console.log(`--- DEBUG START: Checking Slug ${slug} ---`);

      let catalogHeader: Partial<DigitalCatalog> | null = null;
      let catalogIdToFetch: string | null = null;
      let isReplicated = false;
      let resellerId: string | undefined = undefined;

      // 1.1 Intentar buscar en catálogos originales (L1)
      let { data, error } = await supabase
        .from("digital_catalogs")
        // 👇 SOLUCIÓN PGRST201: Especificar la relación para el JOIN
        .select(
          `
            *, 
            catalog_products (
                product_id, 
                products!catalog_products_product_id_fkey (*)
            )
        `,
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("DEBUG ERROR L1 Query:", error);
        throw error;
      }

      // 2. Si no encuentra en L1, buscar en replicados (L2)
      if (!data) {
        console.log("DEBUG L1 NOT FOUND. Checking L2 replicas...");
        const { data: replica, error: errL2 } = await supabase
          .from("replicated_catalogs")
          // 👇 SOLUCIÓN PGRST201: Especificar la relación en el JOIN ANIDADO
          .select(
            `
            *, 
            digital_catalogs (*, 
                catalog_products (
                    product_id, 
                    products!catalog_products_product_id_fkey (*)
                )
            )
          `,
          )
          .eq("slug", slug)
          .maybeSingle();

        if (errL2) console.error("DEBUG ERROR L2 Query:", errL2);

        if (replica && replica.digital_catalogs) {
          // Fusionar data del L1 con metadata de L2
          data = {
            ...(replica.digital_catalogs as any),
            isReplicated: true,
            resellerId: replica.reseller_id,
          } as any;
          console.log("DEBUG L2 SUCCESS: Found and merged replica data.");
        }
      }

      // 3. Verificación Final de Datos
      if (!data) {
        console.log("DEBUG FINAL FAILURE: Data is null after all attempts.");
        return null; // Retorna null si no se encuentra en ningún lado
      }

      console.log(`DEBUG DATA FOUND. ID: ${data.id}. Processing joins...`);

      // 4. Transformar los productos del join a un array plano
      const products = data.catalog_products?.map((cp: any) => cp.products).filter(Boolean) || [];

      // 5. Contar visita (fire and forget)
      try {
        await supabase.rpc("increment_view_count" as any, { row_id: data.id }).then();
      } catch {}

      console.log(`DEBUG PRODUCT COUNT: ${products.length}`);
      console.log("--- DEBUG END: Returning Catalog Object ---");

      // Retorno Final
      return { ...data, products } as DigitalCatalog & {
        isReplicated?: boolean;
        resellerId?: string;
        products: Product[];
      };
    },
    retry: false,
  });

  // ... (Resto del componente: Tracking, Password, Renderizado) ...

  // 2. Configurar Tracking CAPI
  const trackingConfig = (catalog?.tracking_config as any) || {};
  const { trackEvent } = useMetaTracking({
    enabled: true,
    pixelId: trackingConfig.pixelId,
    accessToken: trackingConfig.accessToken,
    isEnterprise: !!trackingConfig.accessToken,
  });

  // 3. Rastrear "PageView" al cargar
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

  // Manejo de carga, error y contraseña
  if (isLoading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (error || !catalog)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Catálogo no disponible</h1>
        <p className="text-gray-500">Es posible que el enlace haya expirado o no exista.</p>
      </div>
    );

  // Pantalla de Bloqueo (Password) - (Se mantiene igual)
  if (catalog.is_private && !isAuthenticated) {
    const handleUnlock = () => {
      if (accessPassword === catalog.access_password) {
        setIsAuthenticated(true);
        trackEvent("UnlockContent");
      } else {
        toast({ title: "Acceso denegado", description: "La contraseña es incorrecta", variant: "destructive" });
      }
    };

    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle>Catálogo Privado</CardTitle>
            <CardDescription>Ingresa la contraseña para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Contraseña"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            <Button className="w-full" onClick={handleUnlock}>
              Ver Catálogo
            </Button>
          </CardContent>
        </Card>
        <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />
      </div>
    );
  }

  // Renderizado Final
  return (
    <QuoteCartProvider>
      <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />
      <PublicCatalogContent catalog={catalog} onTrackEvent={trackEvent} />
    </QuoteCartProvider>
  );
}
