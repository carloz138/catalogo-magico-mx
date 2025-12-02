import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Loader2, Share2, Lock, Facebook } from "lucide-react";

interface MarketingConfigurationProps {
  catalogId: string;
  initialConfig?: {
    pixelId?: string;
    accessToken?: string;
    enabled?: boolean;
  };
  onSave: (config: any) => Promise<void>;
  isL2: boolean;
  readOnly?: boolean;
}

export function MarketingConfiguration({
  catalogId,
  initialConfig = {},
  onSave,
  isL2,
  readOnly = false,
}: MarketingConfigurationProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: initialConfig.enabled ?? false,
    pixelId: initialConfig.pixelId ?? "",
    accessToken: initialConfig.accessToken ?? "",
  });

  const feedUrl = `https://ikbexcebcpmomfxraflz.supabase.co/functions/v1/generate-catalog-feed?catalog_id=${catalogId}`;

  const handleCopyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({
        title: "✅ URL Copiada",
        description: "Link del catálogo copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el link",
        variant: "destructive",
      });
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await onSave({
        meta_capi: {
          enabled: config.enabled,
          pixel_id: config.pixelId,
          access_token: config.accessToken,
        },
      });
      toast({
        title: "✅ Configuración Guardada",
        description: "Los cambios de marketing se aplicaron correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al Guardar",
        description: error.message || "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECCIÓN A: PIXEL & CAPI */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Conexión Facebook (Pixel & CAPI)</CardTitle>
            </div>
            {!isL2 && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                Plan Pro+
              </Badge>
            )}
          </div>
          <CardDescription>
            Conecta Meta Pixel y Conversions API para rastrear conversiones y optimizar tus anuncios
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Switch Principal */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Activar Rastreo</Label>
              <p className="text-sm text-muted-foreground">Habilita el tracking híbrido (Browser + Servidor)</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              disabled={readOnly}
            />
          </div>

          {/* Inputs Expandibles */}
          {config.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <Label htmlFor="pixelId">
                  Pixel ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pixelId"
                  type="text"
                  placeholder="Ej: 1234567890"
                  value={config.pixelId}
                  onChange={(e) => setConfig({ ...config, pixelId: e.target.value.replace(/\D/g, "") })}
                  disabled={readOnly}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Solo números. Encuéntralo en Meta Events Manager</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="accessToken">API Access Token (CAPI)</Label>
                  <a
                    href="https://developers.facebook.com/docs/marketing-api/conversions-api/get-started"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    ¿Cómo obtenerlo? <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAA..."
                  value={config.accessToken}
                  onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                  disabled={readOnly}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">Token de larga duración generado en Business Manager</p>
              </div>
            </div>
          )}

          {/* Botón Guardar */}
          {!readOnly && (
            <>
              <Separator />
              <Button
                onClick={handleSaveConfig}
                disabled={isSaving || !config.enabled || !config.pixelId}
                className="w-full"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN B: FEED XML DINÁMICO */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Catálogo Dinámico (Feed XML)</CardTitle>
          </div>
          <CardDescription>Sincroniza automáticamente tus productos con Facebook Commerce Manager</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm leading-relaxed">
              Copia este enlace y pégalo en <strong>Facebook Commerce Manager → Catálogos → Fuentes de datos</strong>{" "}
              para sincronizar productos y precios automáticamente.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="feedUrl">URL del Feed</Label>
            <div className="flex gap-2">
              <Input id="feedUrl" type="text" value={feedUrl} readOnly className="bg-muted font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyFeedUrl} className="shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Este feed se actualiza automáticamente cada vez que modificas tus productos
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => window.open("https://business.facebook.com/commerce", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Commerce Manager
          </Button>
        </CardContent>
      </Card>

      {/* Nota L2 */}
      {isL2 && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Nota:</strong> Esta configuración es independiente del proveedor. Tus eventos se rastrearán en tu
            propia cuenta de Facebook Ads.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
