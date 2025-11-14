import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { DigitalCatalogService } from "@/services/digital-catalog.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductSelector } from "@/components/catalog/ProductSelector";
import { PriceAdjustmentInput } from "@/components/catalog/PriceAdjustmentInput";
import { CatalogFormPreview } from "@/components/catalog/CatalogFormPreview";
import { WebTemplateSelector } from "@/components/templates/WebTemplateSelector";
import { BackgroundPatternSelector } from "@/components/catalog/BackgroundPatternSelector";
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Lock,
  AlertCircle,
  Palette,
  Check,
  ChevronRight,
  Package,
  DollarSign,
  Eye,
  Settings,
  ExternalLink,
  AlertTriangle,
  Layers,
  Truck,
  Radar,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import { getUserPlanTier, getPlanFeatures, PlanTier } from "@/lib/web-catalog/plan-restrictions";
import { getAvailableTemplatesForPlan, getTemplateStatsByPlan } from "@/lib/web-catalog/template-filters";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import type { WebCatalogTemplate } from "@/lib/web-catalog/types";

// --- 1. SCHEMA ACTUALIZADO CON TRACKING_CONFIG ---
const catalogSchema = z
  .object({
    name: z.string().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
    description: z.string().max(500, "Máximo 500 caracteres").optional(),
    additional_info: z.string().max(5000, "Máximo 5000 caracteres").optional(),
    expires_at: z.date().min(new Date(), "La fecha debe ser futura"),

    web_template_id: z.string().min(1, "Selecciona un template"),
    background_pattern: z.string().nullable().optional(),
    price_display: z.enum(["menudeo_only", "mayoreo_only", "both"]),
    price_adjustment_menudeo: z.number().min(-90, "Mínimo -90%").max(100, "Máximo 100%"),
    price_adjustment_mayoreo: z.number().min(-90, "Mínimo -90%").max(100, "Máximo 100%"),
    show_sku: z.boolean(),
    show_tags: z.boolean(),
    show_description: z.boolean(),
    show_stock: z.boolean(),
    is_private: z.boolean(),
    access_password: z.string().optional(),
    product_ids: z.array(z.string()).min(1, "Selecciona al menos 1 producto"),

    enable_quotation: z.boolean().optional(),
    enable_variants: z.boolean().optional(),
    enable_distribution: z.boolean().optional(),
    enable_free_shipping: z.boolean().optional(),
    free_shipping_min_amount: z.coerce.number().min(0).optional(),

    // Scripts Legacy
    tracking_head_scripts: z.string().optional().nullable(),
    tracking_body_scripts: z.string().optional().nullable(),
    pixelId: z.string().optional(),
    accessToken: z.string().optional(), // Solo para CAPI

    // Configuración CAPI Nueva
    tracking_config: z
      .object({
        meta_capi: z
          .object({
            enabled: z.boolean().default(false),
            pixel_id: z.string().optional(),
            access_token: z.string().optional(),
            test_code: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.is_private && !data.access_password) {
        return false;
      }
      return true;
    },
    {
      message: "La contraseña es requerida para catálogos privados",
      path: ["access_password"],
    },
  );

type CatalogFormData = z.infer<typeof catalogSchema>;

export default function DigitalCatalogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { businessInfo } = useBusinessInfo();
  const { limits, loading: limitsLoading } = useCatalogLimits();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogData, setCatalogData] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [userPlanTier, setUserPlanTier] = useState<PlanTier>("free");
  const [userPlanId, setUserPlanId] = useState<string | undefined>();
  const [userPlanName, setUserPlanName] = useState<string | undefined>();

  const isEditing = !!id;
  const canCreatePrivate = limits?.planName !== "Básico" && limits?.planName !== "Starter";

  // --- 2. LÓGICA PARA HABILITAR CAPI ---
  const canUseCAPI = userPlanTier === "professional" || userPlanTier === "enterprise";

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: "",
      description: "",
      additional_info: "",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      web_template_id: "",
      background_pattern: null,
      price_display: "both",
      price_adjustment_menudeo: 0,
      price_adjustment_mayoreo: 0,
      show_sku: true,
      show_tags: true,
      show_description: true,
      show_stock: true,
      is_private: false,
      access_password: "",
      product_ids: [],
      enable_quotation: false,
      enable_variants: true,
      enable_distribution: false,
      enable_free_shipping: false,
      free_shipping_min_amount: 0,
      tracking_head_scripts: "",
      tracking_body_scripts: "",
      // Valores por defecto para tracking config
      tracking_config: {
        meta_capi: {
          enabled: false,
          pixel_id: "",
          access_token: "",
          test_code: "",
        },
      },
    },
  });

  const watchedValues = {
    name: useWatch({ control: form.control, name: "name" }),
    description: useWatch({ control: form.control, name: "description" }),
    price_display: useWatch({ control: form.control, name: "price_display" }),
    price_adjustment_menudeo: useWatch({ control: form.control, name: "price_adjustment_menudeo" }),
    price_adjustment_mayoreo: useWatch({ control: form.control, name: "price_adjustment_mayoreo" }),
    show_sku: useWatch({ control: form.control, name: "show_sku" }),
    show_tags: useWatch({ control: form.control, name: "show_tags" }),
    show_description: useWatch({ control: form.control, name: "show_description" }),
    is_private: useWatch({ control: form.control, name: "is_private" }),
  };

  // Detectar plan del usuario
  useEffect(() => {
    if (user) {
      loadUserPlan();
    }
  }, [user]);

  const loadUserPlan = async () => {
    if (!user) return;

    try {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select(
          `
          status,
          package_id,
          credit_packages (
            id,
            name,
            package_type
          )
        `,
        )
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (subscription?.credit_packages) {
        const pkg = subscription.credit_packages as any;
        setUserPlanId(pkg.id);
        setUserPlanName(pkg.name);

        // Determinar tier usando el sistema de web-catalog
        const tier = getUserPlanTier(pkg.id, pkg.name);
        setUserPlanTier(tier);

        console.log("📊 Plan del usuario detectado:", {
          id: pkg.id,
          name: pkg.name,
          tier,
          features: getPlanFeatures(tier),
        });
      } else {
        setUserPlanTier("free");
      }
    } catch (error) {
      console.error("Error loading user plan:", error);
      setUserPlanTier("free");
    }
  };

  // Establecer valor por defecto de enable_quotation basado en el plan
  useEffect(() => {
    if (!isEditing && userPlanTier) {
      const hasQuotation = getPlanFeatures(userPlanTier).hasQuotation;
      form.setValue("enable_quotation", hasQuotation);

      // Si tiene cotizaciones, habilitar variantes por defecto
      if (hasQuotation) {
        form.setValue("enable_variants", true);
      }
    }
  }, [userPlanTier, isEditing]);

  useEffect(() => {
    if (isEditing && user && id) {
      loadCatalog();
    }
  }, [isEditing, user, id]);

  const productsWithoutWholesaleMin = useMemo(() => {
    const priceDisplay = watchedValues.price_display;
    if (priceDisplay !== "mayoreo_only" && priceDisplay !== "both") {
      return [];
    }

    return selectedProducts.filter((product) => {
      const hasWholesalePrice = product.price_wholesale && product.price_wholesale > 0;
      const hasWholesaleMin = product.wholesale_min_qty && product.wholesale_min_qty > 0;
      return hasWholesalePrice && !hasWholesaleMin;
    });
  }, [selectedProducts, watchedValues.price_display]);

  const loadCatalog = async () => {
    if (!user || !id) return;

    setIsLoading(true);
    try {
      const catalog = await DigitalCatalogService.getCatalogById(id, user.id);
      setCatalogData(catalog);

      form.reset({
        name: catalog.name,
        description: catalog.description || "",
        additional_info: catalog.additional_info || "",
        expires_at: catalog.expires_at ? new Date(catalog.expires_at) : new Date(),

        web_template_id: catalog.web_template_id || "",
        background_pattern: catalog.background_pattern || null,
        price_display: catalog.price_display,
        price_adjustment_menudeo: Number(catalog.price_adjustment_menudeo),
        price_adjustment_mayoreo: Number(catalog.price_adjustment_mayoreo),
        show_sku: catalog.show_sku,
        show_tags: catalog.show_tags,
        show_description: catalog.show_description,
        is_private: catalog.is_private,
        access_password: "",
        product_ids: catalog.products?.map((p) => p.id) || [],
        enable_quotation: catalog.enable_quotation || false,
        enable_variants: catalog.enable_variants ?? true,
        enable_distribution: catalog.enable_distribution || false,
        show_stock: catalog.show_stock || false,
        enable_free_shipping: catalog.enable_free_shipping || false,
        free_shipping_min_amount: catalog.free_shipping_min_amount ? catalog.free_shipping_min_amount / 100 : 0,
        tracking_head_scripts: catalog.tracking_head_scripts || "",
        tracking_body_scripts: catalog.tracking_body_scripts || "",
        pixelId: (catalog.tracking_config as any)?.pixelId || "",
        accessToken: (catalog.tracking_config as any)?.accessToken || "",
        // Carga la configuración CAPI o usa default
        tracking_config: (catalog as any).tracking_config || {
          meta_capi: { enabled: false, pixel_id: "", access_token: "", test_code: "" },
        },
      });

      setSelectedProducts(catalog.products || []);
    } catch (error) {
      console.error("Error loading catalog:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el catálogo",
        variant: "destructive",
      });
      navigate("/catalogs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CatalogFormData) => {
    if (!user) return;

    if (!isEditing) {
      if (!limits?.canGenerate) {
        toast({
          title: "Límite alcanzado",
          description: limits?.message || "Has alcanzado el límite de catálogos",
          variant: "destructive",
        });
        return;
      }
    }

    if (data.is_private && !canCreatePrivate) {
      toast({
        title: "Plan requerido",
        description: "Los catálogos privados requieren Plan Medio o Premium",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const catalogDTO = {
        name: data.name,
        description: data.description,
        additional_info: data.additional_info,
        web_template_id: data.web_template_id,
        background_pattern: data.background_pattern,
        price_display: data.price_display,
        price_adjustment_menudeo: data.price_adjustment_menudeo,
        price_adjustment_mayoreo: data.price_adjustment_mayoreo,
        show_sku: data.show_sku,
        show_tags: data.show_tags,
        show_description: data.show_description,
        show_stock: data.show_stock,
        is_private: data.is_private,
        access_password: data.is_private ? data.access_password : undefined,
        expires_at: data.expires_at.toISOString(),
        product_ids: data.product_ids,
        enable_quotation: getPlanFeatures(userPlanTier).hasQuotation && data.enable_quotation,
        enable_variants: data.enable_variants ?? true,
        enable_distribution: data.enable_distribution ?? false,
        enable_free_shipping: data.enable_free_shipping ?? false,
        free_shipping_min_amount:
          data.enable_free_shipping && data.free_shipping_min_amount
            ? Math.round(data.free_shipping_min_amount * 100)
            : 0,
        tracking_head_scripts: data.tracking_head_scripts || null,
        tracking_body_scripts: data.tracking_body_scripts || null,
        // Enviamos la configuración JSON
        tracking_config: {
          pixelId: data.pixelId,
          accessToken: data.accessToken,
        },
      };

      if (isEditing && id) {
        await DigitalCatalogService.updateCatalog(id, user.id, catalogDTO);
        toast({
          title: "Catálogo actualizado",
          description: "Los cambios se guardaron correctamente",
        });
      } else {
        await DigitalCatalogService.createCatalog(user.id, catalogDTO);
        toast({
          title: "Catálogo publicado",
          description: "Tu catálogo está disponible para compartir",
        });
      }

      navigate("/catalogs");
    } catch (error: any) {
      console.error("Error saving catalog:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el catálogo",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDERIZADO DE SECCIÓN CAPI (Para reutilizar) ---
  const renderTrackingSection = () => (
    <div className="space-y-6">
      {/* SECCIÓN CAPI DE META - Solo para Pro/Enterprise */}
      <div
        className={cn(
          "border rounded-lg p-4 space-y-4 transition-all",
          canUseCAPI ? "bg-blue-50/50 border-blue-100" : "bg-gray-50 opacity-75 relative",
        )}
      >
        {!canUseCAPI && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg text-center p-4">
            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-semibold text-gray-900">Tracking Server-Side (CAPI)</h4>
            <p className="text-sm text-gray-600 mb-3 max-w-xs">
              Mejora tu ROAS enviando eventos directamente desde el servidor. Evita bloqueos de iOS 14+.
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/checkout")}>
              Actualizar a Profesional
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-base flex items-center gap-2">
              Meta (Facebook) CAPI
              {userPlanTier === "enterprise" && (
                <Badge variant="secondary" className="text-xs">
                  Full Sales Tracking
                </Badge>
              )}
            </h4>
            <p className="text-sm text-muted-foreground">Conexión directa servidor-a-servidor.</p>
          </div>
          <FormField
            control={form.control}
            name="tracking_config.meta_capi.enabled"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={!canUseCAPI} />
            )}
          />
        </div>

        {/* Inputs de CAPI (Solo visibles si está habilitado) */}
        {form.watch("tracking_config.meta_capi.enabled") && (
          <div className="grid gap-4 pl-1 border-l-2 border-blue-200 ml-1">
            <FormField
              control={form.control}
              name="tracking_config.meta_capi.pixel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Pixel ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 1234567890" {...field} className="bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tracking_config.meta_capi.access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
                    Access Token (CAPI)
                    <a
                      href="https://developers.facebook.com/docs/marketing-api/conversions-api/get-started"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-normal normal-case flex items-center"
                    >
                      ¿Cómo obtenerlo? <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="EAA..." {...field} className="bg-white font-mono text-xs" />
                  </FormControl>
                  <FormDescription>Token de larga duración generado en el Business Manager.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tracking_config.meta_capi.test_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                    Test Event Code (Opcional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: TEST1234" {...field} className="bg-white" />
                  </FormControl>
                  <FormDescription>Úsalo solo para probar eventos en tiempo real.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* NUEVOS CAMPOS: Pixel ID y Access Token */}
      <div className="pt-4 border-t space-y-4">
        <FormField
          control={form.control}
          name="pixelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook Pixel ID</FormLabel>
              <FormControl>
                <Input placeholder="Ej: 1234567890" {...field} />
              </FormControl>
              <FormDescription>
                El ID numérico de tu Pixel. Necesario para el rastreo básico y CAPI.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accessToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Access Token (Opcional)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Token de conversión (CAPI)" {...field} />
              </FormControl>
              <FormDescription>
                Requerido para enviar eventos servidor-servidor (Plan Empresarial).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="my-4 border-t border-border" />
      </div>

      {/* SECCIÓN CLÁSICA (Fallback) */}
      <div className="pt-4">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          Scripts personalizados
          <Badge variant="outline" className="text-[10px] h-5">
            Legacy
          </Badge>
        </h4>
        <FormField
          control={form.control}
          name="tracking_head_scripts"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="text-xs">Head Scripts (Google Analytics, Chat, etc.)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder=""
                  {...field}
                  value={field.value || ""}
                  rows={4}
                  className="font-mono text-xs resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tracking_body_scripts"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Body Scripts</FormLabel>
              <FormControl>
                <Textarea
                  placeholder=""
                  {...field}
                  value={field.value || ""}
                  rows={4}
                  className="font-mono text-xs resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  if (isLoading || limitsLoading) {
    return (
      <div className="container mx-auto py-4 md:py-8 px-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const productIds = form.watch("product_ids") || [];
  const webTemplateId = form.watch("web_template_id");

  return (
    <div className="p-4 md:p-8">
      {/* Header Responsive */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          onClick={() => navigate("/catalogs")}
          className="mb-3 md:mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isMobile ? "Volver" : "Volver a catálogos"}
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold">{isEditing ? "Editar Catálogo" : "Crear Catálogo Digital"}</h1>
        {!isMobile && (
          <p className="text-muted-foreground mt-2">
            {isEditing ? "Actualiza la configuración de tu catálogo" : "Configura y publica tu catálogo de productos"}
          </p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={cn(isMobile && "pb-24")}>
          {isMobile ? (
            /* ================ MOBILE LAYOUT: TABS ================ */
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
                <TabsTrigger value="form" className="text-base">
                  Configuración
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-base">
                  Vista Previa
                </TabsTrigger>
              </TabsList>

              {/* Tab: Form (Mobile Accordion) */}
              <TabsContent value="form" className="mt-0">
                <Accordion type="single" collapsible className="space-y-3">
                  {/* Accordion Item 1: Productos */}
                  <AccordionItem value="products" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all",
                            productIds.length > 0 ? "bg-green-100 text-green-700" : "bg-muted",
                          )}
                        >
                          {productIds.length > 0 ? <Check className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">Productos</div>
                          <div className="text-sm text-muted-foreground">
                            {productIds.length > 0 ? `${productIds.length} seleccionados` : "Selecciona productos"}
                          </div>
                        </div>
                        {productIds.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {productIds.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <FormField
                        control={form.control}
                        name="product_ids"
                        render={({ field }) => (
                          <FormItem>
                            <ProductSelector
                              selectedIds={field.value}
                              onChange={(ids, products) => {
                                field.onChange(ids);
                                setSelectedProducts(products);
                              }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 2: Diseño */}
                  <AccordionItem value="design" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all",
                            webTemplateId ? "bg-green-100 text-green-700" : "bg-muted",
                          )}
                        >
                          {webTemplateId ? <Check className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">Diseño</div>
                          <div className="text-sm text-muted-foreground">
                            {webTemplateId ? "Template seleccionado" : "Elige el diseño"}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-6">
                      <FormField
                        control={form.control}
                        name="web_template_id"
                        render={({ field }) => (
                          <FormItem>
                            <WebTemplateSelector
                              selectedTemplate={field.value}
                              onTemplateSelect={field.onChange}
                              userPlanId={userPlanId}
                              userPlanName={userPlanName}
                              productCount={selectedProducts.length}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="background_pattern"
                        render={({ field }) => (
                          <FormItem>
                            <BackgroundPatternSelector
                              selectedPattern={field.value}
                              onPatternChange={field.onChange}
                              webTemplateId={form.watch("web_template_id")}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 3: Información Básica */}
                  <AccordionItem value="info" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 transition-all",
                            form.watch("name") ? "bg-green-100 text-green-700" : "bg-muted",
                          )}
                        >
                          {form.watch("name") ? <Check className="h-5 w-5" /> : "3"}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">Información</div>
                          <div className="text-sm text-muted-foreground">Nombre y descripción</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="catalog-name" className="text-base">
                              Nombre del catálogo *
                            </FormLabel>
                            <FormControl>
                              <Input
                                id="catalog-name"
                                placeholder="Ej: Catálogo Primavera 2025"
                                className="h-12 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="catalog-description" className="text-base">
                              Descripción (opcional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                id="catalog-description"
                                placeholder="Describe tu catálogo..."
                                className="min-h-[120px] resize-none text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>{field.value?.length || 0}/500 caracteres</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 4: Precios */}
                  <AccordionItem value="pricing" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">Precios</div>
                          <div className="text-sm text-muted-foreground">Configuración de precios</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-6">
                      <FormField
                        control={form.control}
                        name="price_display"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Tipo de precios a mostrar</FormLabel>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-col space-y-2"
                            >
                              <label
                                htmlFor="menudeo_only"
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]",
                                  field.value === "menudeo_only" && "border-primary bg-primary/5",
                                )}
                              >
                                <RadioGroupItem value="menudeo_only" id="menudeo_only" className="h-5 w-5" />
                                <div className="flex-1">
                                  <div className="font-medium">Solo precio menudeo</div>
                                </div>
                              </label>

                              <label
                                htmlFor="mayoreo_only"
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]",
                                  field.value === "mayoreo_only" && "border-primary bg-primary/5",
                                )}
                              >
                                <RadioGroupItem value="mayoreo_only" id="mayoreo_only" className="h-5 w-5" />
                                <div className="flex-1">
                                  <div className="font-medium">Solo precio mayoreo</div>
                                </div>
                              </label>

                              <label
                                htmlFor="both"
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]",
                                  field.value === "both" && "border-primary bg-primary/5",
                                )}
                              >
                                <RadioGroupItem value="both" id="both" className="h-5 w-5" />
                                <div className="flex-1">
                                  <div className="font-medium">Ambos precios</div>
                                </div>
                              </label>
                            </RadioGroup>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Alerta de productos sin cantidad mínima de mayoreo */}
                      {productsWithoutWholesaleMin.length > 0 && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="flex flex-col gap-2">
                            <span>
                              {productsWithoutWholesaleMin.length}{" "}
                              {productsWithoutWholesaleMin.length === 1 ? "producto tiene" : "productos tienen"} precio
                              de mayoreo pero no {productsWithoutWholesaleMin.length === 1 ? "tiene" : "tienen"}{" "}
                              cantidad mínima asignada.
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-fit"
                              onClick={() => window.open("https://catifypro.com/products-management", "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ir a Gestión de Productos
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                      {(watchedValues.price_display === "menudeo_only" || watchedValues.price_display === "both") && (
                        <FormField
                          control={form.control}
                          name="price_adjustment_menudeo"
                          render={({ field }) => (
                            <FormItem>
                              <PriceAdjustmentInput
                                label="Ajuste de precio menudeo"
                                value={field.value}
                                onChange={field.onChange}
                                basePrice={100}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {(watchedValues.price_display === "mayoreo_only" || watchedValues.price_display === "both") && (
                        <FormField
                          control={form.control}
                          name="price_adjustment_mayoreo"
                          render={({ field }) => (
                            <FormItem>
                              <PriceAdjustmentInput
                                label="Ajuste de precio mayoreo"
                                value={field.value}
                                onChange={field.onChange}
                                basePrice={100}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 4.5: Envíos */}
                  <AccordionItem value="shipping" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">Envíos</div>
                          <div className="text-sm text-muted-foreground">Configuración de envío gratis</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="enable_free_shipping"
                        render={({ field }) => (
                          <div
                            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-base">Habilitar Envío Gratis</div>
                              <div className="text-sm text-muted-foreground">
                                Ofrece envío gratis sobre un monto mínimo
                              </div>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="pointer-events-none"
                            />
                          </div>
                        )}
                      />

                      {form.watch("enable_free_shipping") && (
                        <FormField
                          control={form.control}
                          name="free_shipping_min_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor="free-shipping-min" className="text-base">
                                Monto mínimo ($MXN)
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                  <Input
                                    id="free-shipping-min"
                                    type="number"
                                    min="0"
                                    step="100"
                                    placeholder="5000"
                                    className="h-12 text-base pl-10"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Los clientes obtendrán envío gratis en compras superiores a este monto
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 5: Visibilidad */}
                  <AccordionItem value="visibility" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Eye className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base">Información a Mostrar</div>
                          <div className="text-sm text-muted-foreground">Qué datos mostrar</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-3">
                      <FormField
                        control={form.control}
                        name="show_sku"
                        render={({ field }) => (
                          <div
                            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-base">Mostrar SKU</div>
                              <div className="text-sm text-muted-foreground">Código de producto visible</div>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="pointer-events-none"
                            />
                          </div>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="show_tags"
                        render={({ field }) => (
                          <div
                            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-base">Mostrar Tags</div>
                              <div className="text-sm text-muted-foreground">Etiquetas del producto</div>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="pointer-events-none"
                            />
                          </div>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="show_description"
                        render={({ field }) => (
                          <div
                            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-base">Mostrar Descripción</div>
                              <div className="text-sm text-muted-foreground">Descripción completa del producto</div>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="pointer-events-none"
                            />
                          </div>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="show_stock"
                        render={({ field }) => (
                          <div
                            className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                            onClick={() => field.onChange(!field.value)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-base">Mostrar Stock</div>
                              <div className="text-sm text-muted-foreground">
                                Mostrar cantidad disponible de variantes
                              </div>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="pointer-events-none"
                            />
                          </div>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 6: Configuración Avanzada */}
                  <AccordionItem value="advanced" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Settings className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Avanzado
                          </div>
                          <div className="text-sm text-muted-foreground">Privacidad y expiración</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="expires_at"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel htmlFor="expires-at" className="text-base">
                              Fecha de expiración *
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    id="expires-at"
                                    variant="outline"
                                    className={cn(
                                      "w-full h-12 justify-start text-left font-normal text-base",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Selecciona una fecha</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="center" side="top">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Después de esta fecha el catálogo no será accesible</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!canCreatePrivate && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Los catálogos privados requieren Plan Medio o Premium.{" "}
                            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/checkout")}>
                              Ver planes
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={form.control}
                        name="is_private"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base">Tipo de catálogo</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={(value) => field.onChange(value === "private")}
                                value={field.value ? "private" : "public"}
                                className="flex flex-col space-y-2"
                                disabled={!canCreatePrivate}
                              >
                                <label
                                  htmlFor="public"
                                  className={cn(
                                    "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all active:scale-[0.98]",
                                    !field.value && "border-primary bg-primary/5",
                                    !canCreatePrivate && "opacity-50",
                                  )}
                                >
                                  <RadioGroupItem value="public" id="public" className="h-5 w-5" />
                                  <div className="flex-1">
                                    <div className="font-medium">Público</div>
                                    <div className="text-sm text-muted-foreground">
                                      Cualquiera con el link puede verlo
                                    </div>
                                  </div>
                                </label>

                                <label
                                  htmlFor="private"
                                  className={cn(
                                    "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                                    field.value && "border-primary bg-primary/5",
                                    canCreatePrivate
                                      ? "cursor-pointer active:scale-[0.98]"
                                      : "opacity-50 cursor-not-allowed",
                                  )}
                                >
                                  <RadioGroupItem
                                    value="private"
                                    id="private"
                                    disabled={!canCreatePrivate}
                                    className="h-5 w-5"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium flex items-center gap-2 flex-wrap">
                                      Privado - Requiere contraseña
                                      {!canCreatePrivate && <Badge variant="secondary">Plan Medio/Premium</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Solo con contraseña</div>
                                  </div>
                                </label>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchedValues.is_private && canCreatePrivate && (
                        <FormField
                          control={form.control}
                          name="access_password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor="access-password" className="text-base">
                                Contraseña de acceso *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  id="access-password"
                                  type="password"
                                  placeholder="Ingresa una contraseña"
                                  className="h-12 text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Los clientes necesitarán esta contraseña para ver el catálogo
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accordion Item 7: Cotización (condicional) */}
                  {getPlanFeatures(userPlanTier).hasQuotation ? (
                    <AccordionItem value="quotation" className="border rounded-lg overflow-hidden">
                      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-base">Sistema de Cotización</div>
                            <div className="text-sm text-muted-foreground">Solicitudes de clientes</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <FormField
                          control={form.control}
                          name="enable_quotation"
                          render={({ field }) => (
                            <div
                              className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all mb-3"
                              onClick={() => field.onChange(!field.value)}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-base">Habilitar cotizaciones</div>
                                <div className="text-sm text-muted-foreground">
                                  Los clientes podrán seleccionar productos y solicitar cotización
                                </div>
                              </div>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="pointer-events-none"
                              />
                            </div>
                          )}
                        />

                        {form.watch("enable_quotation") && (
                          <FormField
                            control={form.control}
                            name="enable_variants"
                            render={({ field }) => (
                              <FormItem>
                                <div
                                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all"
                                  onClick={() => field.onChange(!field.value)}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-base">Permitir selección de variantes</div>
                                    <div className="text-sm text-muted-foreground">
                                      Los clientes podrán elegir variantes específicas al cotizar
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {form.watch("enable_quotation") && (
                          <FormField
                            control={form.control}
                            name="enable_distribution"
                            render={({ field }) => (
                              <FormItem>
                                <div
                                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer active:scale-[0.98] transition-all bg-indigo-50 border-indigo-200 mt-3"
                                  onClick={() => field.onChange(!field.value)}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-base flex items-center gap-2">
                                      Permitir que mis clientes creen catálogos
                                      <Badge variant="secondary">Nuevo</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Al aceptar cotizaciones, tus clientes podrán activar su propio catálogo GRATIS
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <Alert>
                      <Lock className="h-4 w-4" />
                      <AlertDescription>
                        El sistema de cotización está disponible en Plan Profesional y Empresarial.
                        <Button variant="link" className="p-0 h-auto ml-1" onClick={() => navigate("/checkout")}>
                          Actualizar plan
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Accordion Item 8: Tracking y Píxeles (Mobile) */}
                  <AccordionItem value="tracking" className="border rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted flex-shrink-0">
                          <Radar className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-base flex items-center gap-2">
                            Tracking Avanzado
                            {canUseCAPI ? (
                              <Badge variant="default" className="bg-green-600 h-5 text-[10px]">
                                Pro
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="h-5 text-[10px]">
                                <Lock className="w-3 h-3 mr-1" /> Pro
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">Pixel y API</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">{renderTrackingSection()}</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              {/* Tab: Preview (Mobile) */}
              <TabsContent value="preview" className="mt-0">
                <CatalogFormPreview
                  name={watchedValues.name}
                  description={watchedValues.description}
                  webTemplateId={form.watch("web_template_id")}
                  products={selectedProducts}
                  priceConfig={{
                    display: watchedValues.price_display,
                    adjustmentMenudeo: watchedValues.price_adjustment_menudeo,
                    adjustmentMayoreo: watchedValues.price_adjustment_mayoreo,
                  }}
                  visibilityConfig={{
                    showSku: watchedValues.show_sku,
                    showTags: watchedValues.show_tags,
                    showDescription: watchedValues.show_description,
                  }}
                  backgroundPattern={form.watch("background_pattern")}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* ================ DESKTOP LAYOUT: 2 COLUMNS ================ */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* 1. Selección de Productos */}
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-xl">1. Selecciona tus Productos</CardTitle>
                    <CardDescription>Elige los productos que aparecerán en el catálogo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="product_ids"
                      render={({ field }) => (
                        <FormItem>
                          <ProductSelector
                            selectedIds={field.value}
                            onChange={(ids, products) => {
                              field.onChange(ids);
                              setSelectedProducts(products);
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 2. Template de Diseño Web */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      2. Elige el Diseño
                    </CardTitle>
                    <CardDescription>Selecciona cómo se verá tu catálogo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="web_template_id"
                      render={({ field }) => (
                        <FormItem>
                          <WebTemplateSelector
                            selectedTemplate={field.value}
                            onTemplateSelect={field.onChange}
                            userPlanId={userPlanId}
                            userPlanName={userPlanName}
                            productCount={selectedProducts.length}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="background_pattern"
                      render={({ field }) => (
                        <FormItem>
                          <BackgroundPatternSelector
                            selectedPattern={field.value}
                            onPatternChange={field.onChange}
                            webTemplateId={form.watch("web_template_id")}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 3. Información Básica */}
                <Card>
                  <CardHeader>
                    <CardTitle>3. Información del Catálogo</CardTitle>
                    <CardDescription>Nombre y descripción</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del catálogo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Catálogo Primavera 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción (opcional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe tu catálogo..." className="resize-none" {...field} />
                          </FormControl>
                          <FormDescription>{field.value?.length || 0}/500 caracteres</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additional_info"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Información Adicional (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Preguntas frecuentes, términos y condiciones, información importante..."
                              className="resize-none min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/5000 caracteres - Aparecerá en una pestaña separada
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 4. Configuración de Precios */}
                <Card>
                  <CardHeader>
                    <CardTitle>4. Configuración de Precios</CardTitle>
                    <CardDescription>Define qué precios mostrar y ajustes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="price_display"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de precios a mostrar</FormLabel>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="menudeo_only" id="menudeo_only" />
                              <label htmlFor="menudeo_only" className="font-normal text-sm cursor-pointer">
                                Solo precio menudeo
                              </label>
                            </div>
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="mayoreo_only" id="mayoreo_only" />
                              <label htmlFor="mayoreo_only" className="font-normal text-sm cursor-pointer">
                                Solo precio mayoreo
                              </label>
                            </div>
                            <div className="flex items-center space-x-3 space-y-0">
                              <RadioGroupItem value="both" id="both" />
                              <label htmlFor="both" className="font-normal text-sm cursor-pointer">
                                Ambos precios
                              </label>
                            </div>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Alerta de productos sin cantidad mínima de mayoreo */}
                    {productsWithoutWholesaleMin.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex flex-col gap-2">
                          <span>
                            {productsWithoutWholesaleMin.length}{" "}
                            {productsWithoutWholesaleMin.length === 1 ? "producto tiene" : "productos tienen"} precio de
                            mayoreo pero no {productsWithoutWholesaleMin.length === 1 ? "tiene" : "tienen"} cantidad
                            mínima asignada.
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-fit"
                            onClick={() => window.open("https://catifypro.com/products-management", "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ir a Gestión de Productos
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {(watchedValues.price_display === "menudeo_only" || watchedValues.price_display === "both") && (
                      <FormField
                        control={form.control}
                        name="price_adjustment_menudeo"
                        render={({ field }) => (
                          <FormItem>
                            <PriceAdjustmentInput
                              label="Ajuste de precio menudeo"
                              value={field.value}
                              onChange={field.onChange}
                              basePrice={100}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {(watchedValues.price_display === "mayoreo_only" || watchedValues.price_display === "both") && (
                      <FormField
                        control={form.control}
                        name="price_adjustment_mayoreo"
                        render={({ field }) => (
                          <FormItem>
                            <PriceAdjustmentInput
                              label="Ajuste de precio mayoreo"
                              value={field.value}
                              onChange={field.onChange}
                              basePrice={100}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* 4.5. Configuración de Envíos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Configuración de Envíos
                    </CardTitle>
                    <CardDescription>Define las opciones de envío gratis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="enable_free_shipping"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Habilitar Envío Gratis</FormLabel>
                            <FormDescription>Ofrece envío gratis sobre un monto mínimo</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("enable_free_shipping") && (
                      <FormField
                        control={form.control}
                        name="free_shipping_min_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto mínimo ($MXN)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  min="0"
                                  step="100"
                                  placeholder="5000"
                                  className="pl-9"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Los clientes obtendrán envío gratis en compras superiores a este monto
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* 5. Configuración de Visibilidad */}
                <Card>
                  <CardHeader>
                    <CardTitle>5. Información a Mostrar</CardTitle>
                    <CardDescription>Qué datos mostrar de cada producto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="show_sku"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mostrar SKU</FormLabel>
                            <FormDescription>Código de producto visible</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_tags"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mostrar Tags</FormLabel>
                            <FormDescription>Etiquetas del producto</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_description"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mostrar Descripción</FormLabel>
                            <FormDescription>Descripción completa del producto</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="show_stock"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mostrar Stock</FormLabel>
                            <FormDescription>Mostrar cantidad disponible de variantes</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* 6. Configuración Avanzada */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      6. Configuración Avanzada
                    </CardTitle>
                    <CardDescription>Privacidad y fecha de expiración</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="expires_at"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de expiración *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Selecciona una fecha</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>Después de esta fecha el catálogo no será accesible</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!canCreatePrivate && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Los catálogos privados requieren Plan Medio o Premium.{" "}
                          <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/checkout")}>
                            Ver planes
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={form.control}
                      name="is_private"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de catálogo</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => field.onChange(value === "private")}
                              value={field.value ? "private" : "public"}
                              className="flex flex-col space-y-1"
                              disabled={!canCreatePrivate}
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="public" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Público - Cualquiera con el link puede verlo
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="private" disabled={!canCreatePrivate} />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-2">
                                  Privado - Requiere contraseña
                                  {!canCreatePrivate && <Badge variant="secondary">Plan Medio/Premium</Badge>}
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedValues.is_private && canCreatePrivate && (
                      <FormField
                        control={form.control}
                        name="access_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña de acceso *</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Ingresa una contraseña" {...field} />
                            </FormControl>
                            <FormDescription>
                              Los clientes necesitarán esta contraseña para ver el catálogo
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* 7. Sistema de Cotización */}
                {getPlanFeatures(userPlanTier).hasQuotation ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sistema de Cotización</CardTitle>
                      <CardDescription>Permite que los clientes soliciten cotizaciones directamente</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="enable_quotation"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Habilitar cotizaciones</FormLabel>
                              <FormDescription>
                                Los clientes podrán seleccionar productos y solicitar cotización
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {form.watch("enable_quotation") && (
                        <FormField
                          control={form.control}
                          name="enable_variants"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5 flex items-start gap-2">
                                <Layers className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div>
                                  <FormLabel className="text-base">Permitir selección de variantes</FormLabel>
                                  <FormDescription>
                                    Los clientes podrán elegir variantes específicas (talla, color, etc.) al cotizar
                                  </FormDescription>
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch("enable_quotation") && (
                        <FormField
                          control={form.control}
                          name="enable_distribution"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-indigo-50 border-indigo-200">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center gap-2">
                                  Permitir que mis clientes creen catálogos
                                  <Badge variant="secondary">Nuevo</Badge>
                                </FormLabel>
                                <FormDescription>
                                  Al aceptar una cotización, tu cliente recibirá un link para activar su propio catálogo
                                  GRATIS y empezar a vender estos productos
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      El sistema de cotización está disponible en Plan Profesional y Empresarial.
                      <Button variant="link" className="p-0 h-auto ml-1" onClick={() => navigate("/checkout")}>
                        Actualizar plan
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* 8. Tracking y Píxeles (Desktop) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Radar className="h-5 w-5" />
                      Tracking Avanzado y Píxeles
                      {canUseCAPI ? (
                        <Badge variant="default" className="bg-green-600">
                          Pro
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Lock className="w-3 h-3 mr-1" /> Pro
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Conecta tus herramientas de analítica y conversión (Meta CAPI, Pixel, GTM).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderTrackingSection()}</CardContent>
                </Card>

                {/* Botones de Acción Desktop */}
                <div className="flex gap-4 sticky bottom-0 bg-background py-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/catalogs")}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Guardar Cambios" : "Publicar Catálogo"}
                  </Button>
                </div>
              </div>

              {/* Preview Desktop */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <CatalogFormPreview
                  name={watchedValues.name}
                  description={watchedValues.description}
                  webTemplateId={form.watch("web_template_id")}
                  products={selectedProducts}
                  priceConfig={{
                    display: watchedValues.price_display,
                    adjustmentMenudeo: watchedValues.price_adjustment_menudeo,
                    adjustmentMayoreo: watchedValues.price_adjustment_mayoreo,
                  }}
                  visibilityConfig={{
                    showSku: watchedValues.show_sku,
                    showTags: watchedValues.show_tags,
                    showDescription: watchedValues.show_description,
                  }}
                  backgroundPattern={form.watch("background_pattern")}
                />
              </div>
            </div>
          )}

          {/* Sticky Bottom Action Bar (Solo Mobile) */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/catalogs")}
                  disabled={isSaving}
                  className="flex-1 h-12 text-base"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving} className="flex-1 h-12 text-base">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Guardar" : "Publicar"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
