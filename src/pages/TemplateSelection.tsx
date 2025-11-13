// src/pages/TemplateSelection.tsx
// TEMPLATE SELECTION CON PRODUCTOS POR PÁGINA DINÁMICOS

import React, { useState, useEffect, useCallback } from "react";
import "@/styles/template-selection-mobile.css";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessInfo } from "@/hooks/useBusinessInfo";
import { supabase } from "@/integrations/supabase/client";
import { initializeOptimizedTemplates } from "@/lib/templates/audited-templates-v2";

// Importar nuevos sistemas integrados
import { SmartTemplateSelector } from "@/components/templates/SmartTemplateSelector";
import { CatalogPreview } from "@/components/catalog/CatalogPDFPreview";
import {
  generateCatalog,
  generateDynamicCatalog,
  generateClassicCatalog,
  generatePuppeteerCatalog,
  checkLimits,
} from "@/lib/catalog/unified-generator";
import { getDynamicTemplate } from "@/lib/templates/dynamic-mapper";
import { getTemplateById } from "@/lib/templates/industry-templates";
import { TemplateGenerator } from "@/lib/templates/css-generator";
import { TemplateAuditSystem } from "@/lib/templates/template-audit-system";
import { IndustryType } from "@/lib/templates/industry-templates";
import { getUserPlanTier, getPlanFeatures, PlanTier } from "@/lib/web-catalog/plan-restrictions";
import { getAvailableTemplatesForPlan, getTemplateStatsByPlan } from "@/lib/web-catalog/template-filters";
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";
import type { WebCatalogTemplate } from "@/lib/web-catalog/types";

// 🆕 IMPORTAR SELECTOR DE PRODUCTOS POR PÁGINA
import { ProductsPerPageSelector } from "@/components/templates/ProductsPerPageSelector";

import {
  ArrowLeft,
  ArrowRight,
  Palette,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Package,
  Zap,
  Info,
  Rocket,
  Clock,
  Eye,
  Shield,
  Star,
  AlertCircle,
  Settings,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  custom_description?: string;
  category?: string;
  brand?: string;
  model?: string;
  color?: string;
  price_retail: number;
  price_wholesale?: number;
  wholesale_min_qty?: number;
  features?: string[];
  tags?: string[];
  image_url: string;
  original_image_url?: string;
  processed_image_url?: string;
  hd_image_url?: string;
  video_url?: string;
  social_media_urls?: any;
  processing_status?: string;
  ai_description?: string;
  ai_tags?: string[];
  has_variants?: boolean;
  variant_count?: number;
  created_at?: string;
  updated_at?: string;
  specifications?: string;
}

interface UsageLimits {
  canGenerate: boolean;
  catalogsUsed: number;
  catalogsLimit: number | "unlimited";
  remainingCatalogs: number;
  message: string;
}

type GenerationMethod = "auto" | "puppeteer" | "dynamic" | "classic";

interface TemplateQuality {
  score: number;
  status: "perfect" | "good" | "needs_fix" | "broken";
  issues: string[];
  recommendations: string[];
}

const TemplateSelection = () => {
  const { user } = useAuth();
  const { businessInfo } = useBusinessInfo();
  const navigate = useNavigate();

  // Estados principales
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [catalogTitle, setCatalogTitle] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMethod, setGenerationMethod] = useState<GenerationMethod>("auto");

  // 🆕 ESTADO PARA PRODUCTOS POR PÁGINA
  const [productsPerPage, setProductsPerPage] = useState<4 | 6 | 9>(6);
  const [showWholesalePrices, setShowWholesalePrices] = useState(true);

  // Estados de límites y calidad
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [templateQuality, setTemplateQuality] = useState<TemplateQuality | null>(null);

  // Estados de UX
  const [userIndustry, setUserIndustry] = useState<IndustryType | undefined>();
  const [userPlan, setUserPlan] = useState<"basic" | "premium">("basic");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [autoFix, setAutoFix] = useState(true);
  const [userPlanTier, setUserPlanTier] = useState<PlanTier>("free");
  const [availableTemplates, setAvailableTemplates] = useState<WebCatalogTemplate[]>([]);
  const [templateStats, setTemplateStats] = useState<any>(null);

  // Estados del sistema de preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    initializeComponent();
  }, [user]);

  const initializeComponent = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await initializeOptimizedTemplates();

      await Promise.all([loadSelectedProducts(), detectUserIndustry(), loadUserPlan(), loadCatalogLimits()]);
    } catch (error) {
      console.error("Error initializing template selection:", error);
      toast({
        title: "Error de inicialización",
        description: "Hubo un problema cargando la información",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedProducts = async () => {
    const productsData = localStorage.getItem("selectedProductsData");
    const productsIds = localStorage.getItem("selectedProducts");
    const catalogTitleFromStorage = localStorage.getItem("catalogTitle");

    if (catalogTitleFromStorage) {
      console.log("🔍 DEBUG - Título cargado del localStorage:", catalogTitleFromStorage);
      setCatalogTitle(catalogTitleFromStorage);
    }

    if (productsData) {
      const products = JSON.parse(productsData);
      setSelectedProducts(products);
      console.log("Productos cargados:", products.length);

      // 🆕 SUGERIR PRODUCTOS POR PÁGINA BASADO EN CANTIDAD
      if (products.length <= 12) {
        setProductsPerPage(4); // Pocos productos, usar layout grande
      } else if (products.length >= 50) {
        setProductsPerPage(9); // Muchos productos, usar layout compacto
      } else {
        setProductsPerPage(6); // Cantidad media, usar layout estándar
      }
    } else if (productsIds) {
      const ids = JSON.parse(productsIds);
      console.log("Solo IDs disponibles, redirigiendo a productos");
      toast({
        title: "Datos incompletos",
        description: "Regresa a seleccionar productos",
        variant: "destructive",
      });
      navigate("/products");
      return;
    } else {
      console.log("No hay productos seleccionados");
      toast({
        title: "No hay productos seleccionados",
        description: "Selecciona productos primero",
        variant: "destructive",
      });
      navigate("/products");
      return;
    }
  };

  const detectUserIndustry = async () => {
    if (selectedProducts.length > 0) {
      const categories = selectedProducts.map((p) => p.category?.toLowerCase()).filter(Boolean);

      const industryKeywords = {
        joyeria: ["joyeria", "jewelry", "anillo", "collar", "pulsera", "oro", "plata"],
        moda: ["ropa", "clothing", "vestido", "blusa", "pantalon", "fashion"],
        electronica: ["electronico", "electronic", "smartphone", "laptop", "tech"],
        ferreteria: ["ferreteria", "hardware", "herramienta", "tool", "tornillo"],
        floreria: ["flor", "flower", "planta", "plant", "jardin", "ramo"],
        cosmeticos: ["cosmetico", "cosmetic", "maquillaje", "makeup", "belleza"],
        decoracion: ["decoracion", "decoration", "hogar", "home", "mueble"],
        muebles: ["mueble", "furniture", "silla", "mesa", "sofa"],
      };

      for (const [industry, keywords] of Object.entries(industryKeywords)) {
        if (categories.some((c) => keywords.some((k) => c?.includes(k)))) {
          setUserIndustry(industry as IndustryType);
          break;
        }
      }
    }

    if (!userIndustry && businessInfo?.business_name) {
      const businessName = businessInfo.business_name.toLowerCase();

      if (businessName.includes("joyeria") || businessName.includes("jewelry")) {
        setUserIndustry("joyeria");
      } else if (businessName.includes("moda") || businessName.includes("fashion")) {
        setUserIndustry("moda");
      }
    }
  };

  const loadUserPlan = async () => {
    if (!user) return;

    try {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select(
          `
              status,
              credit_packages (
                id,
                name,
                package_type,
                price_usd
              )
            `,
        )
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (subscription?.credit_packages) {
        const pkg = subscription.credit_packages as any;
        const planId = pkg.id;
        const planName = pkg.name;

        // Obtener tier del plan
        const tier = getUserPlanTier(planId, planName);
        const features = getPlanFeatures(tier);

        setUserPlanTier(tier);

        // Obtener templates disponibles para este plan
        const templates = getAvailableTemplatesForPlan(EXPANDED_WEB_TEMPLATES, tier);
        setAvailableTemplates(templates);

        // Obtener estadísticas
        const stats = getTemplateStatsByPlan(EXPANDED_WEB_TEMPLATES, tier);
        setTemplateStats(stats);

        console.log("Plan tier:", tier);
        console.log("Templates disponibles:", templates.length);
        console.log("Stats:", stats);
      }
    } catch (error) {
      console.error("Error loading user plan:", error);
    }
  };

  const loadCatalogLimits = async () => {
    if (!user) return;

    try {
      const limitsData = await checkLimits(user.id);
      setLimits(limitsData);
    } catch (error) {
      console.error("Error loading catalog limits:", error);
    }
  };

  // NUEVA FUNCIÓN: Auditar template al seleccionarlo
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    setSelectedTemplate(templateId);
    setTemplateQuality(null);

    console.log("Template seleccionado:", templateId);

    try {
      const template = getTemplateById(templateId);
      if (template) {
        console.log("Auditando calidad del template...");
        const auditResult = await TemplateAuditSystem.auditSingleTemplate(template);

        setTemplateQuality({
          score: auditResult.qualityScore,
          status: auditResult.status,
          issues: auditResult.issues.map((i) => i.description),
          recommendations: auditResult.recommendations,
        });

        if (auditResult.status === "broken") {
          toast({
            title: "Template con problemas críticos",
            description: "Este template requiere corrección antes de usarse",
            variant: "destructive",
          });
        } else if (auditResult.status === "needs_fix") {
          toast({
            title: "Template con problemas menores",
            description: `Calidad: ${auditResult.qualityScore}/100. Se aplicarán correcciones automáticas`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error("Error auditando template:", error);
    }
  }, []);

  // 🆕 FUNCIÓN: Manejar cambio de productos por página
  const handleProductsPerPageChange = (count: 4 | 6 | 9) => {
    setProductsPerPage(count);
    console.log(`📋 Productos por página cambiado a: ${count}`);

    // Mostrar información útil
    const pages = Math.ceil(selectedProducts.length / count);
    toast({
      title: `Layout actualizado: ${count} productos/página`,
      description: `Tu catálogo tendrá ${pages} página${pages !== 1 ? "s" : ""} con este layout`,
    });
  };

  // FUNCIÓN MEJORADA: Generar preview HTML
  const handlePreviewCatalog = async () => {
    if (!selectedTemplate || !user || !businessInfo) {
      toast({
        title: "Información faltante",
        description: "Selecciona un template y asegúrate de tener la información del negocio completa",
        variant: "destructive",
      });
      return;
    }

    setPreviewLoading(true);

    try {
      console.log(`Generando preview HTML con ${productsPerPage} productos/página...`);

      const businessData = {
        business_name: businessInfo.business_name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        website: businessInfo.website,
        address: businessInfo.address,
        social_media: businessInfo.social_media,
        logo_url: businessInfo.logo_url,
        primary_color: businessInfo.primary_color,
        secondary_color: businessInfo.secondary_color,
      };

      const template = getTemplateById(selectedTemplate);
      if (!template) {
        throw new Error(`Template ${selectedTemplate} no encontrado`);
      }

      // 🆕 GENERAR HTML CON PRODUCTOS POR PÁGINA DINÁMICOS
      const htmlContent = TemplateGenerator.generateCatalogHTML(
        selectedProducts,
        businessData,
        template,
        productsPerPage,
        showWholesalePrices,
      );

      setPreviewHTML(htmlContent);
      setShowPreview(true);

      console.log(`Preview HTML generado con ${productsPerPage} productos/página:`, htmlContent.length, "caracteres");
    } catch (error) {
      console.error("Error generando preview:", error);
      toast({
        title: "Error generando preview",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // FUNCIÓN MEJORADA: Generar catálogo con productos por página dinámicos
  const handleGenerateCatalog = async () => {
    if (!selectedTemplate || !user || !businessInfo) {
      toast({
        title: "Información faltante",
        description: "Selecciona un template y asegúrate de tener la información del negocio completa",
        variant: "destructive",
      });
      return;
    }

    if (!limits?.canGenerate) {
      toast({
        title: "Límite alcanzado",
        description: limits?.message || "No puedes generar más catálogos",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGenerationProgress(0);

    try {
      console.log(`🚀 Iniciando generación con ${productsPerPage} productos/página...`);

      const onProgress = (progress: number) => {
        setGenerationProgress(progress);
        console.log(`Progreso: ${progress}%`);
      };

      const businessData = {
        business_name: businessInfo.business_name,
        email: businessInfo.email,
        phone: businessInfo.phone,
        website: businessInfo.website,
        address: businessInfo.address,
        social_media: businessInfo.social_media,
        logo_url: businessInfo.logo_url,
        primary_color: businessInfo.primary_color,
        secondary_color: businessInfo.secondary_color,
      };

      if (!businessInfo || !businessInfo.business_name) {
        console.warn("⚠️ No hay business_info, usando datos por defecto de CatifyPro");
        businessData.business_name = "CatifyPro";
        businessData.phone = "Contact us for pricing";
        businessData.address = "Professional Catalog Service";
        businessData.social_media = { whatsapp: "+1-800-CATIFY" };
      }

      let result;

      // 🆕 SELECCIONAR MÉTODO DE GENERACIÓN CON PRODUCTOS POR PÁGINA
      switch (generationMethod) {
        case "puppeteer":
          console.log(`🚀 Usando Puppeteer Service (${productsPerPage}/página)`);
          result = await generatePuppeteerCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress,
            catalogTitle,
            productsPerPage,
            showWholesalePrices,
          );
          break;

        case "dynamic":
          console.log(`⚡ Usando Dynamic Engine (${productsPerPage}/página)`);
          result = await generateDynamicCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress,
            catalogTitle,
            productsPerPage,
            showWholesalePrices,
          );
          break;

        case "classic":
          console.log(`🎨 Usando Classic Engine (${productsPerPage}/página)`);
          result = await generateClassicCatalog(
            selectedProducts,
            businessData,
            selectedTemplate,
            user.id,
            onProgress,
            catalogTitle,
            productsPerPage,
            showWholesalePrices,
          );
          break;

        case "auto":
        default:
          console.log(`🧠 Usando selección automática inteligente (${productsPerPage}/página)`);
          result = await generateCatalog(selectedProducts, businessData, selectedTemplate, user.id, {
            usePuppeteerService: true,
            useDynamicEngine: true,
            showProgress: true,
            onProgress,
            qualityCheck: true,
            autoFix: true,
            catalogTitle: catalogTitle,
            productsPerPage: productsPerPage,
            showWholesalePrices: showWholesalePrices,
          });
          break;
      }

      if (result.success) {
        const methodEmoji = {
          puppeteer: "🚀",
          dynamic: "⚡",
          classic: "🎨",
          hybrid: "🧠",
        }[result.generationMethod || "auto"];

        const methodName = {
          puppeteer: "Puppeteer Service",
          dynamic: "Dynamic Engine",
          classic: "Classic Engine",
          hybrid: "Hybrid System",
        }[result.generationMethod || "auto"];

        toast({
          title: `${methodEmoji} ¡Catálogo generado exitosamente!`,
          description: `${result.message || "Completado"} (${result.stats?.generationTime}ms con ${methodName}, ${productsPerPage}/página)`,
        });

        if (result.warnings && result.warnings.length > 0) {
          toast({
            title: "Generación completada con advertencias",
            description: `${result.warnings.length} advertencia(s) detectada(s). Ver detalles en el dashboard.`,
            variant: "default",
          });
        }

        console.log(`Estadísticas de generación (${productsPerPage}/página):`, {
          productos: result.stats?.totalProducts,
          páginas: result.stats?.totalPages,
          método: result.generationMethod,
          tiempo: result.stats?.generationTime,
          calidad: result.stats?.templateQuality,
          productsPerPage: result.stats?.productsPerPage,
        });

        localStorage.removeItem("selectedTemplate");
        localStorage.removeItem("selectedProducts");
        localStorage.removeItem("selectedProductsData");

        await loadCatalogLimits();
        setShowPreview(false);
        navigate("/catalogs");
      } else {
        const errorMessages = {
          LIMIT_EXCEEDED: "Has alcanzado tu límite de catálogos",
          PREMIUM_REQUIRED: "Este template requiere plan Premium",
          TEMPLATE_NOT_FOUND: "Template no encontrado",
          TEMPLATE_BROKEN: "Template tiene errores críticos",
          GENERATION_ERROR: "Error durante la generación",
          DATABASE_ERROR: "Error guardando en base de datos",
          CLASSIC_ENGINE_ERROR: "Error en engine clásico",
          INVALID_PRODUCT_DATA: "Datos de productos inválidos",
        };

        const userMessage =
          errorMessages[result.error as keyof typeof errorMessages] || result.message || "Error desconocido";

        toast({
          title: "Error al generar catálogo",
          description: userMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generando catálogo:", error);
      toast({
        title: "Error inesperado",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Obtener información del template mejorada
  const getTemplateInfo = (templateId: string) => {
    const dynamicTemplate = getDynamicTemplate(templateId);

    if (dynamicTemplate) {
      return {
        supportsDynamic: dynamicTemplate.supportsDynamic,
        productsPerPage: dynamicTemplate.productsPerPage,
        recommendedFor: dynamicTemplate.recommendedFor,
        layout: `${dynamicTemplate.layout.columns}×${dynamicTemplate.layout.rows}`,
        spacing: dynamicTemplate.layout.spacing,
        isPremium: dynamicTemplate.isPremium,
      };
    }

    return {
      supportsDynamic: false,
      productsPerPage: 6,
      recommendedFor: "catálogos estándar",
      layout: "3×2",
      spacing: "normal",
      isPremium: false,
    };
  };

  // Recomendar método de generación inteligente
  const getRecommendedMethod = (): GenerationMethod => {
    const productCount = selectedProducts.length;
    const templateScore = templateQuality?.score || 100;

    if (templateScore < 60) return "classic";

    // 🆕 CONSIDERAR PRODUCTOS POR PÁGINA EN LA RECOMENDACIÓN
    if (productsPerPage === 4 || productsPerPage === 9) {
      return "puppeteer"; // Layouts especiales son mejores con Puppeteer
    }

    if (productCount > 50 || templateScore >= 90) return "puppeteer";
    if (productCount >= 10 && productCount <= 50) return "dynamic";

    return "auto";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando sistema de templates v2.0...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Header actions simplificado con jerarquía visual clara
  const actions = (
    <div className="hidden lg:flex items-center gap-3">
      {/* Información contextual clara */}
      <div className="flex items-center gap-3 border-r pr-3">
        <Badge variant="outline" className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {selectedProducts.length} productos
        </Badge>

        <Badge variant="default" className="bg-blue-600">
          {productsPerPage}/página
        </Badge>

        {limits && (
          <span className="text-sm text-gray-600">
            {limits.catalogsLimit === "unlimited" ? "Ilimitados" : `${limits.remainingCatalogs} restantes`}
          </span>
        )}
      </div>

      {/* Acciones principales - orden de importancia */}
      <Button
        onClick={handlePreviewCatalog}
        disabled={!selectedTemplate || generating || previewLoading}
        variant="outline"
        size="sm"
      >
        {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
        Preview
      </Button>

      <Button
        onClick={handleGenerateCatalog}
        disabled={!selectedTemplate || generating || !limits?.canGenerate}
        className="bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {generationProgress}%
          </>
        ) : (
          <>
            <Palette className="h-4 w-4 mr-2" />
            Generar PDF
          </>
        )}
      </Button>
    </div>
  );

  return (
    <AppLayout actions={actions}>
      <div className="space-y-6">
        {/* Header con información mejorada */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/products")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Productos
              </Button>
              <Badge variant="secondary" className="text-xs">
                Sistema v2.0 - Layouts Dinámicos
              </Badge>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Selecciona tu Template
              <Shield className="w-5 h-5 text-green-500" />
            </h1>
            <p className="text-gray-600">
              Elige el diseño perfecto para tu catálogo de {selectedProducts.length} productos (
              {Math.ceil(selectedProducts.length / productsPerPage)} página
              {Math.ceil(selectedProducts.length / productsPerPage) !== 1 ? "s" : ""} con {productsPerPage}/página)
            </p>
          </div>

          {/* Info del plan en móvil */}
          <div className="sm:hidden w-full">
            <Card>
              <CardContent className="p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{selectedProducts.length} productos seleccionados</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600">
                      {productsPerPage}/pág
                    </Badge>
                    {limits && (
                      <Badge variant="outline">
                        {limits.catalogsLimit === "unlimited" ? "Ilimitados" : `${limits.remainingCatalogs} restantes`}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Alert de límites */}
        {limits && !limits.canGenerate && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Límite alcanzado:</strong> {limits.message}
              <Button variant="link" className="h-auto p-0 ml-2 text-red-600" onClick={() => navigate("/pricing")}>
                Ver planes
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 🆕 SELECTOR DE PRODUCTOS POR PÁGINA */}
        <ProductsPerPageSelector
          selectedCount={productsPerPage}
          onCountChange={handleProductsPerPageChange}
          totalProducts={selectedProducts.length}
          disabled={generating || previewLoading}
        />

        {/* Selector de Precios */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                Opciones de Precios
                <Badge variant="outline" className="text-xs">
                  {selectedProducts.filter((p) => p.price_wholesale).length} con mayoreo
                </Badge>
              </Label>
              <p className="text-xs text-gray-600 mt-1">Elige qué precios mostrar en tu catálogo</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowWholesalePrices(true)}
                disabled={generating || previewLoading}
                className={`
                    relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                    ${
                      showWholesalePrices
                        ? "border-purple-600 bg-purple-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                    ${generating || previewLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${showWholesalePrices ? "bg-purple-100" : "bg-gray-100"}
                  `}
                >
                  <Package className={`w-5 h-5 ${showWholesalePrices ? "text-purple-600" : "text-gray-600"}`} />
                </div>
                <div className="text-sm font-medium text-center">Mayoreo</div>
                <div className="text-xs text-gray-500 mt-1 text-center">Con precios al por mayor</div>
                {showWholesalePrices && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowWholesalePrices(false)}
                disabled={generating || previewLoading}
                className={`
                    relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
                    ${
                      !showWholesalePrices
                        ? "border-purple-600 bg-purple-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                    ${generating || previewLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${!showWholesalePrices ? "bg-purple-100" : "bg-gray-100"}
                  `}
                >
                  <Zap className={`w-5 h-5 ${!showWholesalePrices ? "text-purple-600" : "text-gray-600"}`} />
                </div>
                <div className="text-sm font-medium text-center">Retail</div>
                <div className="text-xs text-gray-500 mt-1 text-center">Solo precio al público</div>
                {!showWholesalePrices && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar mejorada */}
        {generating && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Generando catálogo con sistema v2.0...</h4>
                  <p className="text-sm text-blue-700">
                    Método:{" "}
                    {generationMethod === "auto"
                      ? "Selección Automática"
                      : generationMethod === "puppeteer"
                        ? "🚀 Puppeteer Service"
                        : generationMethod === "dynamic"
                          ? "⚡ Dynamic Engine"
                          : "🎨 Classic Engine"}{" "}
                    | Layout: {productsPerPage} productos/página | Auto-corrección: {autoFix ? "Activa" : "Inactiva"}
                  </p>
                </div>
              </div>
              <Progress value={generationProgress} className="h-2" />
              <div className="flex justify-between text-xs text-blue-600 mt-1">
                <span>{generationProgress}% completado</span>
                <span>
                  {selectedProducts.length} productos | {Math.ceil(selectedProducts.length / productsPerPage)} páginas |
                  Layout {productsPerPage}/página
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selector de templates */}
        <SmartTemplateSelector
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          userPlan={userPlan}
          userIndustry={userIndustry}
          productCount={selectedProducts.length}
        />

        {/* Información del template seleccionado mejorada */}
        {selectedTemplate && (
          <Card
            className={`border-2 ${
              templateQuality?.status === "broken"
                ? "border-red-200 bg-red-50"
                : templateQuality?.status === "needs_fix"
                  ? "border-yellow-200 bg-yellow-50"
                  : "border-green-200 bg-green-50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {templateQuality?.status === "broken" ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : templateQuality?.status === "needs_fix" ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      templateQuality?.status === "broken"
                        ? "text-red-900"
                        : templateQuality?.status === "needs_fix"
                          ? "text-yellow-900"
                          : "text-green-900"
                    }`}
                  >
                    Template seleccionado
                    {templateQuality && (
                      <Badge variant="outline" className="ml-2">
                        {templateQuality.score}/100
                      </Badge>
                    )}
                  </h4>
                  <p
                    className={`text-sm ${
                      templateQuality?.status === "broken"
                        ? "text-red-700"
                        : templateQuality?.status === "needs_fix"
                          ? "text-yellow-700"
                          : "text-green-700"
                    }`}
                  >
                    Layout actual: {productsPerPage} productos/página •
                    {Math.ceil(selectedProducts.length / productsPerPage)} páginas totales •
                    {getTemplateInfo(selectedTemplate).recommendedFor}
                    {templateQuality && templateQuality.status === "broken" && (
                      <span className="font-semibold"> • REQUIERE CORRECCIÓN</span>
                    )}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className={`${
                    templateQuality?.status === "broken"
                      ? "text-red-700 hover:bg-red-100"
                      : templateQuality?.status === "needs_fix"
                        ? "text-yellow-700 hover:bg-yellow-100"
                        : "text-green-700 hover:bg-green-100"
                  }`}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>

              {/* Mostrar issues si los hay */}
              {templateQuality && templateQuality.issues.length > 0 && (
                <div className="mb-3 p-3 bg-white rounded border">
                  <h5 className="text-sm font-medium mb-2">Issues detectados:</h5>
                  <ul className="text-xs space-y-1">
                    {templateQuality.issues.slice(0, 3).map((issue, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                    {templateQuality.issues.length > 3 && (
                      <li className="text-gray-500 italic">+{templateQuality.issues.length - 3} más...</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Opciones avanzadas */}
              {showAdvancedOptions && (
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-800">Método de Generación</label>
                      <select
                        value={generationMethod}
                        onChange={(e) => setGenerationMethod(e.target.value as GenerationMethod)}
                        className="w-full mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={generating || previewLoading}
                      >
                        <option value="auto">🧠 Auto (Recomendado: {getRecommendedMethod()})</option>
                        <option value="puppeteer">🚀 Puppeteer (Mejor calidad)</option>
                        <option value="dynamic">⚡ Dynamic (Rápido)</option>
                        <option value="classic">🎨 Classic (Compatible)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-800">Auto-corrección</label>
                      <div className="mt-1">
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={autoFix}
                            onChange={(e) => setAutoFix(e.target.checked)}
                            className="mr-2"
                            disabled={generating || previewLoading}
                          />
                          Corregir automáticamente
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-800">Layout Dinámico</label>
                      <div className="text-sm text-gray-700 mt-1">
                        {productsPerPage === 4
                          ? "2×2 - Cards Grandes"
                          : productsPerPage === 6
                            ? "3×2 - Balanceado"
                            : "3×3 - Compacto"}{" "}
                        • {getTemplateInfo(selectedTemplate).spacing}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-800">Compatibilidad</label>
                      <div className="text-sm text-gray-700 mt-1">
                        {getTemplateInfo(selectedTemplate).supportsDynamic ? (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            Avanzado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-500" />
                            Estándar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo para el título del catálogo */}
              <div className="mt-4 space-y-2">
                <Label htmlFor="catalogTitle" className="text-sm font-medium text-gray-800">
                  Nombre del catálogo (opcional)
                </Label>
                <Input
                  id="catalogTitle"
                  value={catalogTitle}
                  onChange={(e) => setCatalogTitle(e.target.value)}
                  placeholder="Ej: Catálogo Primavera 2024, Productos Nuevos..."
                  className="bg-white border-gray-300 focus:border-green-500 text-base h-12"
                  disabled={generating || previewLoading}
                  style={{ fontSize: "16px" }}
                />
                <p className="text-xs text-gray-600">Si no especificas un nombre, se generará automáticamente</p>
              </div>

              {/* Botones de acción */}
              {limits?.canGenerate && templateQuality?.status !== "broken" && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Listo para generar {selectedProducts.length} productos (
                    {Math.ceil(selectedProducts.length / productsPerPage)} páginas con {productsPerPage}/página)
                    {templateQuality && autoFix && templateQuality.status === "needs_fix" && (
                      <span className="text-blue-600"> • Con auto-corrección</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePreviewCatalog}
                      disabled={generating || previewLoading}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      {previewLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Preview
                    </Button>

                    <Button
                      onClick={handleGenerateCatalog}
                      disabled={generating || previewLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generando...
                        </>
                      ) : (
                        <>
                          {generationMethod === "puppeteer" ? (
                            <Rocket className="w-4 h-4 mr-2" />
                          ) : generationMethod === "dynamic" ? (
                            <Zap className="w-4 h-4 mr-2" />
                          ) : generationMethod === "classic" ? (
                            <Palette className="w-4 h-4 mr-2" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Generar PDF v2.0
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <CatalogPreview
          htmlContent={previewHTML}
          templateId={selectedTemplate || ""}
          productCount={selectedProducts.length}
          onGeneratePDF={handleGenerateCatalog}
          onClose={() => setShowPreview(false)}
          loading={generating}
        />
      )}

      {/* 📱 BOTTOM ACTION BAR - SOLO MÓVIL/TABLET */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Preview Button */}
            <Button
              onClick={handlePreviewCatalog}
              disabled={!selectedTemplate || generating || previewLoading}
              variant="outline"
              className="flex-1 h-12 text-base font-medium"
            >
              {previewLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Cargando...
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Preview
                </>
              )}
            </Button>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateCatalog}
              disabled={!selectedTemplate || generating || !limits?.canGenerate}
              className="flex-[2] h-12 text-base font-medium bg-purple-600 hover:bg-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {generationProgress > 0 ? `${generationProgress}%` : "Generando..."}
                </>
              ) : (
                <>
                  <Palette className="h-5 w-5 mr-2" />
                  Generar PDF
                </>
              )}
            </Button>
          </div>

          {/* Info contextual compacta */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {selectedProducts.length} productos
            </span>
            <span className="flex items-center gap-1">
              <Settings className="w-3 h-3" />
              {productsPerPage}/página
            </span>
            {limits && (
              <span>{limits.catalogsLimit === "unlimited" ? "∞ catálogos" : `${limits.remainingCatalogs} rest.`}</span>
            )}
          </div>
        </div>
      </div>

      {/* Spacer para evitar que contenido quede detrás de bottom bar */}
      <div className="lg:hidden h-28" />
    </AppLayout>
  );
};

export default TemplateSelection;
