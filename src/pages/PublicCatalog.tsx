import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DigitalCatalog } from "@/types/digital-catalog";
import { Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PublicCatalogContent } from "@/components/catalog/public/PublicCatalogContent";
import { toast } from "@/hooks/use-toast";
// 👇 IMPORTAMOS EL HOOK DE CAPI
import { useMetaTracking } from "@/hooks/useMetaTracking";

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
      // Usamos createContextualFragment para que ejecute scripts si los hay
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
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [headScripts, bodyScripts]);

  return null; // Este componente no renderiza nada visual
};

export default function PublicCatalog() {
  const { slug } = useParams();
  const [accessPassword, setAccessPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 1. Cargar el Catálogo
  const {
    data: catalog,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-catalog", slug],
    queryFn: async () => {
      // Buscar primero en catálogos originales (L1)
      let { data, error } = await supabase
        .from("digital_catalogs")
        .select("*") // Trae tracking_config, head_scripts, etc.
        .eq("slug", slug)
        .maybeSingle();

      // Si no, buscar en replicados (L2)
      if (!data) {
        const { data: replica } = await supabase
          .from("replicated_catalogs")
          .select(
            `
            *,
            digital_catalogs (*)
          `,
          )
          .eq("slug", slug)
          .maybeSingle();

        if (replica) {
          // Fusionar datos: El L2 usa SU propio slug, pero el contenido base del L1
          // IMPORTANTE: Aquí decidimos qué tracking usar.
          // Normalmente el L2 quiere SU propio tracking, no el del L1.
          // Asumiremos que el 'replicated_catalogs' podría tener sus propios campos de tracking en el futuro.
          // Por ahora, usamos el del catálogo original.
          data = {
            ...replica.digital_catalogs,
            isReplicated: true, // Flag interno
            resellerId: replica.reseller_id,
          };
        }
      }

      if (error) throw error;
      if (!data) throw new Error("Catálogo no encontrado");

      // Contar visita (Incrementar view_count)
      // Lo hacemos "fire and forget" para no bloquear la carga
      supabase.rpc("increment_view_count", { row_id: data.id }).then();

      return data as DigitalCatalog & { isReplicated?: boolean; resellerId?: string };
    },
    retry: false,
  });

  // 2. Configurar Tracking CAPI (Servidor)
  // Extraemos la config del JSONB
  const trackingConfig = (catalog?.tracking_config as any) || {};

  const { trackEvent } = useMetaTracking({
    enabled: true, // Siempre intentamos rastrear si hay config
    pixelId: trackingConfig.pixelId,
    accessToken: trackingConfig.accessToken, // Solo si es Enterprise tendrá esto
    // Detectamos si es enterprise si tiene token (o podrías checar el plan del dueño)
    isEnterprise: !!trackingConfig.accessToken,
  });

  // 3. Rastrear "PageView" al cargar
  useEffect(() => {
    if (catalog) {
      trackEvent("PageView");
      // También podemos rastrear "ViewContent" específico del catálogo
      trackEvent("ViewContent", {
        content_name: catalog.name,
        content_ids: [catalog.id],
        content_type: "product_group",
      });
    }
  }, [catalog?.id]); // Solo cuando carga el catálogo

  // Manejo de contraseña
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Catálogo no disponible</h1>
        <p className="text-gray-500">Es posible que el enlace haya expirado o no exista.</p>
      </div>
    );
  }

  // Pantalla de Bloqueo (Password)
  if (catalog.is_private && !isAuthenticated) {
    const handleUnlock = () => {
      if (accessPassword === catalog.access_password) {
        setIsAuthenticated(true);
        trackEvent("UnlockContent"); // Evento opcional: Alguien desbloqueó el catálogo
      } else {
        toast({
          title: "Acceso denegado",
          description: "La contraseña es incorrecta",
          variant: "destructive",
        });
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
            <CardDescription>Este catálogo está protegido. Ingresa la contraseña para continuar.</CardDescription>
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

        {/* Inyectamos scripts incluso en la pantalla de bloqueo para medir intentos */}
        <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />
      </div>
    );
  }

  return (
    <>
      {/* 👇 4. INYECCIÓN DE SCRIPTS DEL USUARIO (Pixel, GTM, Chat, etc.) */}
      <ScriptInjector headScripts={catalog.tracking_head_scripts} bodyScripts={catalog.tracking_body_scripts} />

      {/* Contenido del Catálogo */}
      <PublicCatalogContent
        catalog={catalog}
        // Pasamos la función de trackEvent hacia abajo para usarla en "AddToCart"
        onTrackEvent={trackEvent}
      />
    </>
  );
}
