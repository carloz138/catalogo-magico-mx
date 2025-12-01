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

// --- 1. SCHEMA ROBUSTO ---
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
    tracking_head_scripts: z.string().optional().nullable(),
    tracking_body_scripts: z.string().optional().nullable(),
    pixelId: z.string().optional(),
    accessToken: z.string().optional(),
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
      if (data.is_private && !data.access_password) return false;
      return true;
    },
    { message: "Contraseña requerida", path: ["access_password"] },
  );

type CatalogFormData = z.infer<typeof catalogSchema>;

export default function DigitalCatalogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { businessInfo } = useBusinessInfo();
  const { limits, loading: limitsLoading } = useCatalogLimits();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [catalogData, setCatalogData] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [userPlanTier, setUserPlanTier] = useState<PlanTier>("free");
  const [userPlanId, setUserPlanId] = useState<string | undefined>();
  const [userPlanName, setUserPlanName] = useState<string | undefined>();

  const isEditing = !!id;
  const canCreatePrivate = limits?.planName !== "Básico" && limits?.planName !== "Starter";
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
      tracking_config: { meta_capi: { enabled: false, pixel_id: "", access_token: "", test_code: "" } },
    },
  });

  // Watchers seguros
  const watchedValues = form.watch();

  // Helpers derivados del watch
  const productIds = watchedValues.product_ids || [];
  const webTemplateId = watchedValues.web_template_id;

  // --- EFECTOS ESTABILIZADOS ---

  useEffect(() => {
    if (user) loadUserPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // FIX: Este efecto causaba el bucle infinito. Lo simplificamos y protegemos.
  useEffect(() => {
    if (!isEditing && userPlanTier && userPlanTier !== "free") {
      const features = getPlanFeatures(userPlanTier);
      // Solo actualizamos si es absolutamente necesario para evitar bucles
      const currentQuotation = form.getValues("enable_quotation");
      if (features.hasQuotation && currentQuotation === false) {
        // No forzamos el setValue aquí para evitar el loop #185
        // Dejamos que el usuario lo active o que el valor por defecto actúe
      }
    }
  }, [userPlanTier, isEditing]); // Quitamos 'form' de las dependencias

  useEffect(() => {
    if (isEditing && user && id) loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, user, id]);

  const productsWithoutWholesaleMin = useMemo(() => {
    const display = watchedValues.price_display;
    if (display !== "mayoreo_only" && display !== "both") return [];
    return selectedProducts.filter((p) => {
      return p.price_wholesale > 0 && (!p.wholesale_min_qty || p.wholesale_min_qty <= 0);
    });
  }, [selectedProducts, watchedValues.price_display]);

  const loadUserPlan = async () => {
    if (!user) return;
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select(`status, package_id, credit_packages (id, name, package_type)`)
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (sub?.credit_packages) {
        const pkg = sub.credit_packages as any;
        setUserPlanId(pkg.id);
        setUserPlanName(pkg.name);
        setUserPlanTier(getUserPlanTier(pkg.id, pkg.name));
      } else {
        setUserPlanTier("free");
      }
    } catch (e) {
      console.error("Error plan:", e);
    }
  };

  const loadCatalog = async () => {
    if (!user || !id) return;
    setIsLoading(true);
    try {
      const catalog = await DigitalCatalogService.getCatalogById(id, user.id);
      setCatalogData(catalog);
      // Reseteo seguro
      form.reset({
        name: catalog.name,
        description: catalog.description || "",
        additional_info: catalog.additional_info || "",
        expires_at: catalog.expires_at ? new Date(catalog.expires_at) : new Date(),
        web_template_id: catalog.web_template_id || "",
        background_pattern: catalog.background_pattern || null,
        price_display: catalog.price_display as any,
        price_adjustment_menudeo: Number(catalog.price_adjustment_menudeo),
        price_adjustment_mayoreo: Number(catalog.price_adjustment_mayoreo),
        show_sku: catalog.show_sku,
        show_tags: catalog.show_tags,
        show_description: catalog.show_description,
        show_stock: catalog.show_stock || false,
        is_private: catalog.is_private,
        access_password: "",
        product_ids: catalog.products?.map((p) => p.id) || [],
        enable_quotation: catalog.enable_quotation || false,
        enable_variants: catalog.enable_variants ?? true,
        enable_distribution: catalog.enable_distribution || false,
        enable_free_shipping: catalog.enable_free_shipping || false,
        free_shipping_min_amount: catalog.free_shipping_min_amount ? catalog.free_shipping_min_amount / 100 : 0,
        tracking_head_scripts: catalog.tracking_head_scripts || "",
        tracking_body_scripts: catalog.tracking_body_scripts || "",
        pixelId: (catalog.tracking_config as any)?.pixelId || "",
        accessToken: (catalog.tracking_config as any)?.accessToken || "",
        tracking_config: (catalog as any).tracking_config || { meta_capi: { enabled: false } },
      });
      setSelectedProducts(catalog.products || []);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo cargar", variant: "destructive" });
      navigate("/catalogs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CatalogFormData) => {
    if (!user) return;
    if (!isEditing && !limits?.canGenerate) {
      toast({ title: "Límite alcanzado", description: limits?.message, variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const dto = {
        ...data,
        access_password: data.is_private ? data.access_password : undefined,
        expires_at: data.expires_at.toISOString(),
        free_shipping_min_amount:
          data.enable_free_shipping && data.free_shipping_min_amount
            ? Math.round(data.free_shipping_min_amount * 100)
            : 0,
        // Limpieza de tracking config
        tracking_config: {
          ...data.tracking_config,
          pixelId: data.pixelId,
          accessToken: data.accessToken,
        },
      };

      if (isEditing && id) {
        await DigitalCatalogService.updateCatalog(id, user.id, dto as any);
        toast({ title: "Guardado", description: "Catálogo actualizado" });
      } else {
        await DigitalCatalogService.createCatalog(user.id, dto as any);
        toast({ title: "Publicado", description: "Catálogo creado exitosamente" });
      }
      navigate("/catalogs");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || limitsLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // --- RENDERIZADO MONOLÍTICO SEGURO ---
  // JSX explícito para evitar re-montajes y pérdida de foco

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/catalogs")} className="mb-3 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{isEditing ? "Editar Catálogo" : "Crear Catálogo"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={cn(isMobile && "pb-24")}>
          {/* LAYOUT ADAPTATIVO */}
          {isMobile ? (
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
                <TabsTrigger value="form">Configuración</TabsTrigger>
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              </TabsList>

              <TabsContent value="form">
                <Accordion type="single" collapsible className="space-y-3">
                  {/* 1. PRODUCTOS */}
                  <AccordionItem value="products" className="border rounded-lg">
                    <AccordionTrigger className="px-4">
                      <div className="flex gap-3 items-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        Productos
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4">
                      <FormField
                        control={form.control}
                        name="product_ids"
                        render={({ field }) => (
                          <FormItem>
                            <ProductSelector
                              selectedIds={field.value}
                              onChange={(ids, prods) => {
                                field.onChange(ids);
                                setSelectedProducts(prods);
                              }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* 2. DISEÑO */}
                  <AccordionItem value="design" className="border rounded-lg">
                    <AccordionTrigger className="px-4">
                      <div className="flex gap-3 items-center">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                        Diseño
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-6">
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
                              webTemplateId={watchedValues.web_template_id}
                            />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* 3. INFO */}
                  <AccordionItem value="info" className="border rounded-lg">
                    <AccordionTrigger className="px-4">
                      <div className="flex gap-3 items-center">
                        <Check className="h-5 w-5 text-muted-foreground" />
                        Información
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre *</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  {/* 4. PRECIOS */}
                  <AccordionItem value="pricing" className="border rounded-lg">
                    <AccordionTrigger className="px-4">
                      <div className="flex gap-3 items-center">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        Precios
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-4">
                      <FormField
                        control={form.control}
                        name="price_display"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mostrar precios</FormLabel>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="both" id="both" />
                                <label htmlFor="both">Ambos</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="menudeo_only" id="men" />
                                <label htmlFor="men">Solo Menudeo</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mayoreo_only" id="may" />
                                <label htmlFor="may">Solo Mayoreo</label>
                              </div>
                            </RadioGroup>
                          </FormItem>
                        )}
                      />
                      {/* Ajustes de precio */}
                      {watchedValues.price_display !== "mayoreo_only" && (
                        <FormField
                          control={form.control}
                          name="price_adjustment_menudeo"
                          render={({ field }) => (
                            <FormItem>
                              <PriceAdjustmentInput
                                label="Ajuste Menudeo"
                                value={field.value}
                                onChange={field.onChange}
                                basePrice={100}
                              />
                            </FormItem>
                          )}
                        />
                      )}
                      {watchedValues.price_display !== "menudeo_only" && (
                        <FormField
                          control={form.control}
                          name="price_adjustment_mayoreo"
                          render={({ field }) => (
                            <FormItem>
                              <PriceAdjustmentInput
                                label="Ajuste Mayoreo"
                                value={field.value}
                                onChange={field.onChange}
                                basePrice={100}
                              />
                            </FormItem>
                          )}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 5. COTIZACION (PROBLEMATICO ANTES) */}
                  <AccordionItem value="quotation" className="border rounded-lg">
                    <AccordionTrigger className="px-4">
                      <div className="flex gap-3 items-center">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        Cotización
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-4">
                      {getPlanFeatures(userPlanTier).hasQuotation ? (
                        <>
                          <FormField
                            control={form.control}
                            name="enable_quotation"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Habilitar Cotizaciones</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          {watchedValues.enable_quotation && (
                            <>
                              <FormField
                                control={form.control}
                                name="enable_variants"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel>Permitir Variantes</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="enable_distribution"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-blue-50">
                                    <div className="space-y-0.5">
                                      <FormLabel>Permitir Réplica (Viral)</FormLabel>
                                      <FormDescription>Tus clientes podrán vender esto</FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>Mejora tu plan para habilitar cotizaciones.</AlertDescription>
                        </Alert>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 6. TRACKING / CAPI */}
                  <AccordionItem value="tracking" className="border rounded-lg">
                    <AccordionTrigger className="px-4">
                      <div className="flex gap-3 items-center">
                        <Radar className="h-5 w-5 text-muted-foreground" />
                        Tracking
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-2 pb-4 space-y-4">
                      <div className={cn("border p-4 rounded-lg", !canUseCAPI && "opacity-50 pointer-events-none")}>
                        <div className="flex justify-between items-center mb-4">
                          <label className="font-semibold">Meta CAPI</label>
                          <FormField
                            control={form.control}
                            name="tracking_config.meta_capi.enabled"
                            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                          />
                        </div>
                        {watchedValues.tracking_config?.meta_capi?.enabled && (
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name="tracking_config.meta_capi.pixel_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pixel ID</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="tracking_config.meta_capi.access_token"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Access Token</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                      {!canUseCAPI && (
                        <div className="text-center text-sm text-muted-foreground">Requiere Plan Profesional</div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="preview">
                <CatalogFormPreview
                  name={watchedValues.name}
                  description={watchedValues.description}
                  webTemplateId={watchedValues.web_template_id}
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
                  backgroundPattern={watchedValues.background_pattern}
                />
              </TabsContent>
            </Tabs>
          ) : (
            // --- DESKTOP LAYOUT (Simplificado para estabilidad) ---
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Desktop: Productos */}
                <Card>
                  <CardHeader>
                    <CardTitle>1. Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="product_ids"
                      render={({ field }) => (
                        <ProductSelector
                          selectedIds={field.value}
                          onChange={(ids, prods) => {
                            field.onChange(ids);
                            setSelectedProducts(prods);
                          }}
                        />
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Desktop: Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>2. Información</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Desktop: Cotización */}
                <Card>
                  <CardHeader>
                    <CardTitle>3. Cotización</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getPlanFeatures(userPlanTier).hasQuotation ? (
                      <>
                        <FormField
                          control={form.control}
                          name="enable_quotation"
                          render={({ field }) => (
                            <FormItem className="flex justify-between items-center border p-3 rounded">
                              <FormLabel>Habilitar</FormLabel>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {watchedValues.enable_quotation && (
                          <FormField
                            control={form.control}
                            name="enable_distribution"
                            render={({ field }) => (
                              <FormItem className="flex justify-between items-center border p-3 rounded bg-blue-50">
                                <div>
                                  <FormLabel>Permitir Réplica</FormLabel>
                                  <FormDescription>Clientes crean su propio catálogo</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>No disponible en tu plan.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Botones Desktop */}
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/catalogs")}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : "Guardar"}
                  </Button>
                </div>
              </div>

              {/* Desktop Preview */}
              <div>
                <div className="sticky top-4">
                  <CatalogFormPreview
                    name={watchedValues.name}
                    description={watchedValues.description}
                    webTemplateId={watchedValues.web_template_id}
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
                    backgroundPattern={watchedValues.background_pattern}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones Mobile Sticky */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/catalogs")}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : "Guardar"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
