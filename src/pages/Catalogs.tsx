import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Share2,
  Edit,
  Trash2,
  Plus,
  Lock,
  Globe,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  DollarSign,
  LayoutGrid,
  Search,
  Truck,
  Store,
  Rocket, // ✅ Icono para el Super Catálogo
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DigitalCatalogService } from "@/services/digital-catalog.service";
import { toast } from "@/hooks/use-toast";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { CatalogShareModal } from "@/components/catalog/CatalogShareModal";
import { DeleteCatalogDialog } from "@/components/catalog/DeleteCatalogDialog";
import { DigitalCatalog } from "@/types/digital-catalog";
import { supabase } from "@/integrations/supabase/client";
import { BusinessInfoBanner } from "@/components/dashboard/BusinessInfoBanner";

// ... (Tipos e Interfaces iguales) ...
interface PDFCatalog {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  product_ids: string[];
  template_style: string;
  brand_colors?: any;
  logo_url?: string;
  show_retail_prices: boolean;
  show_wholesale_prices: boolean;
  currency: string;
  pdf_url?: string;
  preview_image_url?: string;
  total_products: number;
  total_pages?: number;
  file_size_bytes?: number;
  credits_used: number;
  created_at: string;
  generation_metadata?: any;
}

interface ReplicatedCatalogUI extends Partial<DigitalCatalog> {
  replicatedCatalogId: string;
  replicatedSlug: string;
  originalName: string;
  originalCatalogId: string;
  isActive: boolean;
  distributorId?: string;
}

type CatalogType = "all" | "pdf" | "digital";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// ... (Componentes DigitalCatalogCard, ReplicatedCatalogCard, PDFCatalogCard, CatalogSkeleton IGUALES que antes) ...
// Para ahorrar espacio aquí, asumo que mantienes los componentes de Card que ya tenías bien hechos.
// Si necesitas que los repita, avísame, pero son idénticos al código anterior.
// Solo voy a poner el DigitalCatalogCard como referencia y luego el componente principal Catalogs.

const DigitalCatalogCard = ({
  catalog,
  onShare,
  onDelete,
}: {
  catalog: DigitalCatalog;
  onShare: (c: DigitalCatalog) => void;
  onDelete: (c: DigitalCatalog) => void;
}) => {
  // ... (Mantén tu código actual de DigitalCatalogCard)
  const navigate = useNavigate();
  const isExpired = catalog.expires_at ? new Date(catalog.expires_at) < new Date() : false;
  const isActive = catalog.is_active && !isExpired;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative overflow-hidden border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? "bg-indigo-500" : "bg-slate-300"}`} />
        <div className="relative h-32 bg-slate-100 overflow-hidden shrink-0">
          <div className="absolute top-3 left-4 right-3 flex justify-between items-start">
            <Badge variant="outline" className="bg-white/90 backdrop-blur text-indigo-700 border-indigo-100 shadow-sm">
              <Globe className="w-3 h-3 mr-1.5" /> Tienda Unificada
            </Badge>
            {catalog.is_private && (
              <div className="bg-slate-900/80 p-1.5 rounded-full text-white">
                <Lock className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="flex h-full items-center justify-center">
            <Globe className="w-12 h-12 text-indigo-200 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-500" />
          </div>
        </div>
        <CardContent className="p-4 pl-5 flex flex-col flex-1">
          <div className="mb-4 flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {catalog.name}
              </h3>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={`text-[10px] px-1.5 h-5 shrink-0 ml-2 ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {isActive ? "ACTIVO" : "INACTIVO"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{catalog.description || "Tu tienda personalizada."}</p>
          </div>
          <div className="flex items-center gap-2 pt-3 mt-auto">
            <Button
              size="sm"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
              onClick={() => window.open(`/c/${catalog.slug}`, "_blank")}
              disabled={!isActive}
            >
              Ver Tienda
            </Button>
            <div className="flex border border-slate-200 rounded-md overflow-hidden divide-x divide-slate-200">
              <button onClick={() => onShare(catalog)} className="p-2 hover:bg-slate-50 text-slate-600">
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate(`/catalogs/${catalog.id}/edit`)}
                className="p-2 hover:bg-slate-50 text-slate-600"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(catalog)}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ... (ReplicatedCatalogCard y PDFCatalogCard MANTENLOS IGUAL, ya funcionaban bien)
const ReplicatedCatalogCard = ({
  catalog,
  onShare,
}: {
  catalog: ReplicatedCatalogUI;
  onShare: (c: DigitalCatalog) => void;
}) => {
  const navigate = useNavigate();
  const shareAdapter = () =>
    onShare({
      id: catalog.replicatedCatalogId,
      slug: catalog.replicatedSlug,
      name: catalog.originalName,
      description: catalog.description,
      user_id: "",
      created_at: "",
      updated_at: "",
      is_active: true,
      is_private: false,
    } as DigitalCatalog);
  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative overflow-hidden border border-violet-100 bg-white hover:border-violet-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
        <div className="relative h-32 bg-violet-50/50 overflow-hidden shrink-0">
          <div className="absolute top-3 left-4 right-3 flex justify-between items-start">
            <Badge variant="outline" className="bg-white/90 backdrop-blur text-violet-700 border-violet-200 shadow-sm">
              <Store className="w-3 h-3 mr-1.5" /> Suscripción (L2)
            </Badge>
          </div>
          <div className="flex h-full items-center justify-center">
            <Share2 className="w-12 h-12 text-violet-200 group-hover:scale-110 group-hover:text-violet-400 transition-all duration-500" />
          </div>
        </div>
        <CardContent className="p-4 pl-5 flex flex-col flex-1">
          <div className="mb-4 flex-1">
            <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-violet-600 transition-colors">
              {catalog.originalName}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">Catálogo espejo del proveedor.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 mt-auto">
            <Button
              size="sm"
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50 h-8 text-xs w-full"
              onClick={() => navigate(`/reseller/edit-prices?catalog_id=${catalog.replicatedCatalogId}`)}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" /> Precios
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs w-full"
              onClick={() => navigate(`/reseller/consolidate/${catalog.originalCatalogId}`)}
            >
              <Truck className="w-3.5 h-3.5 mr-1" /> Surtir
            </Button>
            <div className="col-span-2 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-8 border border-slate-100 text-slate-500"
                onClick={() => window.open(`/c/${catalog.replicatedSlug}`, "_blank")}
              >
                <Eye className="w-3.5 h-3.5 mr-2" /> Ver
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-10 border border-slate-100 text-slate-500"
                onClick={shareAdapter}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PDFCatalogCard = ({ catalog, onDelete }: { catalog: PDFCatalog; onDelete: (id: string) => void }) => {
  // ... Manten el código del PDF Card
  const handleDownload = () =>
    catalog.pdf_url
      ? window.open(catalog.pdf_url, "_blank")
      : toast({ title: "No disponible", variant: "destructive" });
  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative overflow-hidden border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className="relative h-32 bg-slate-200 flex items-center justify-center shrink-0">
          <FileText className="w-12 h-12 text-slate-400" />
        </div>
        <CardContent className="p-4 pl-5 flex flex-col flex-1">
          <h3 className="font-semibold text-slate-900 mb-2">{catalog.name}</h3>
          <div className="flex gap-2 pt-2 border-t border-slate-200/60 mt-auto">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={handleDownload}
              disabled={!catalog.pdf_url}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              onClick={() => onDelete(catalog.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CatalogSkeleton = () => (
  <Card className="overflow-hidden border border-slate-100 bg-white">
    <div className="h-32 bg-slate-100 animate-pulse" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-5 w-2/3 bg-slate-100" />
      <Skeleton className="h-3 w-full bg-slate-100" />
    </CardContent>
  </Card>
);

// ==========================================
// 4. COMPONENTE PRINCIPAL (Page) - AQUÍ ESTÁ LA MAGIA
// ==========================================

const Catalogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CatalogType>("all");
  const [isCreatingSuper, setIsCreatingSuper] = useState(false);

  const [shareModalCatalog, setShareModalCatalog] = useState<DigitalCatalog | null>(null);
  const [deleteCatalog, setDeleteCatalog] = useState<DigitalCatalog | null>(null);
  const [deletePDFId, setDeletePDFId] = useState<string | null>(null);

  const { limits, loading: limitsLoading } = useCatalogLimits();

  // --- QUERY 1: Digital Catalogs (L1/Super Tiendas) ---
  const { data: digitalCatalogs = [], isLoading: loadingDigital } = useQuery({
    queryKey: ["digital-catalogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await DigitalCatalogService.getUserCatalogs(user.id);
    },
    enabled: !!user,
  });

  // --- QUERY 2: PDF Catalogs ---
  const { data: pdfCatalogs = [], isLoading: loadingPDF } = useQuery({
    queryKey: ["pdf-catalogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("catalogs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PDFCatalog[];
    },
    enabled: !!user,
  });

  // --- QUERY 3: Replicated Catalogs (Suscripciones) ---
  const { data: replicatedCatalogs = [], isLoading: loadingReplicated } = useQuery({
    queryKey: ["replicated-catalogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("replicated_catalogs")
        .select(
          `id, slug, is_active, original_catalog_id, digital_catalogs (id, name, description, is_private, view_count, user_id)`,
        )
        .eq("reseller_id", user.id)
        .order("activated_at", { ascending: false });

      if (error) throw error;

      return (data || [])
        .map((r: any) => {
          const base = r.digital_catalogs;
          if (!base) return null;
          return {
            ...base,
            originalName: base.name,
            originalCatalogId: r.original_catalog_id,
            distributorId: base.user_id,
            replicatedCatalogId: r.id,
            replicatedSlug: r.slug,
            isActive: r.is_active,
          } as ReplicatedCatalogUI;
        })
        .filter(Boolean) as ReplicatedCatalogUI[];
    },
    enabled: !!user,
  });

  // --- 🔥 FUNCIÓN MÁGICA: CREAR SUPER CATÁLOGO ---
  const handleCreateSuperCatalog = async () => {
    if (!user) return;
    setIsCreatingSuper(true);
    try {
      // 1. Obtener TODOS los productos suscritos
      const { data: subscribedProducts, error: subError } = await supabase.rpc("get_subscribed_catalog_products", {
        p_subscriber_id: user.id,
      });

      if (subError) throw subError;

      // 2. Obtener mis productos propios (opcional, pero buena práctica)
      const { data: myProducts, error: myError } = await supabase
        .from("products")
        .select("id")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (myError) throw myError;

      // 3. Juntar IDs
      const allProductIds = [
        ...(subscribedProducts || []).map((p: any) => p.product_id),
        ...(myProducts || []).map((p: any) => p.id),
      ];

      if (allProductIds.length === 0) {
        toast({
          title: "Sin inventario",
          description: "No tienes productos propios ni suscripciones activas.",
          variant: "destructive",
        });
        return;
      }

      // 4. Crear el catálogo
      const newCatalogDTO = {
        name: "Mi Super Tienda " + new Date().toLocaleDateString(),
        description: "Catálogo unificado con todos mis proveedores y productos.",
        product_ids: [...new Set(allProductIds)], // Eliminar duplicados
        web_template_id: "sidebar-detail-warm", // Default bonito
        price_display: "both",
        show_stock: true,
        is_private: false,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 meses
      };

      await DigitalCatalogService.createCatalog(user.id, newCatalogDTO as any);

      queryClient.invalidateQueries({ queryKey: ["digital-catalogs"] });
      toast({ title: "¡Super Catálogo Creado! 🚀", description: "Contiene todos tus productos y suscripciones." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreatingSuper(false);
    }
  };

  // --- MUTATIONS (Delete) ---
  const deleteDigitalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (user) await DigitalCatalogService.deleteCatalog(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-catalogs"] });
      toast({ title: "Eliminado" });
    },
  });
  const deletePDFMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("catalogs").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-catalogs"] });
      toast({ title: "Eliminado" });
    },
  });

  const handleCreateNew = () => navigate("/catalogs/new");
  const isLoading = loadingDigital || loadingPDF || loadingReplicated;
  const totalCatalogs = digitalCatalogs.length + pdfCatalogs.length + replicatedCatalogs.length;

  const actions = (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="relative flex-1 md:w-64 md:mr-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
        />
      </div>

      {/* 🔥 BOTÓN SUPER CATÁLOGO */}
      {(replicatedCatalogs.length > 0 || digitalCatalogs.length > 0) && (
        <Button
          onClick={handleCreateSuperCatalog}
          disabled={isCreatingSuper}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md border-0"
        >
          {isCreatingSuper ? (
            <Loader2 className="w-4 h-4 animate-spin md:mr-2" />
          ) : (
            <Rocket className="w-4 h-4 md:mr-2" />
          )}
          <span className="hidden md:inline">Crear Super Tienda</span>
        </Button>
      )}

      <Button onClick={handleCreateNew} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
        <Plus className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Nuevo</span>
      </Button>
    </div>
  );

  if (isLoading || limitsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {[...Array(6)].map((_, i) => (
            <CatalogSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const renderCatalogs = (type: CatalogType) => {
    const showDigital = type === "all" || type === "digital";
    const showPDF = type === "all" || type === "pdf";
    const visibleDigital = showDigital ? digitalCatalogs : [];
    const visibleReplicated = showDigital ? replicatedCatalogs : [];
    const visiblePDF = showPDF ? pdfCatalogs : [];
    const isEmpty = visibleDigital.length === 0 && visibleReplicated.length === 0 && visiblePDF.length === 0;

    if (isEmpty)
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-8"
        >
          <LayoutGrid className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Comienza tu negocio</h3>
          <p className="text-slate-500 mb-8">Crea catálogos propios o suscríbete a proveedores.</p>
          <Button size="lg" onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Crear Primer Catálogo
          </Button>
        </motion.div>
      );

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 mt-6">
        {/* SECCIÓN 1: Tiendas Unificadas (L1) */}
        {visibleDigital.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800">Mis Super Tiendas (Personalizadas)</h2>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                {visibleDigital.length}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleDigital.map((catalog) => (
                <DigitalCatalogCard
                  key={catalog.id}
                  catalog={catalog}
                  onShare={setShareModalCatalog}
                  onDelete={setDeleteCatalog}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN 2: Suscripciones (L2) */}
        {visibleReplicated.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800">Suscripciones (Proveedores)</h2>
              <Badge variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-100">
                {visibleReplicated.length}
              </Badge>
            </div>
            <div className="flex items-start gap-3 p-4 mb-6 bg-violet-50/50 border border-violet-100 rounded-xl text-sm text-violet-800">
              <Share2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Estos son los enlaces directos de tus proveedores. Para mezclar productos de varios, usa el botón "Crear
                Super Tienda".
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleReplicated.map((catalog) => (
                <ReplicatedCatalogCard
                  key={catalog.replicatedCatalogId}
                  catalog={catalog}
                  onShare={setShareModalCatalog}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN 3: PDFs */}
        {visiblePDF.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800">PDFs</h2>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                {visiblePDF.length}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePDF.map((catalog) => (
                <PDFCatalogCard key={catalog.id} catalog={catalog} onDelete={setDeletePDFId} />
              ))}
            </div>
          </section>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pb-24 font-sans text-slate-900">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Catálogos</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestiona tu inventario digital y expande tu red de ventas.</p>
        </div>
        {actions}
      </header>

      <BusinessInfoBanner />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CatalogType)} className="space-y-8 mt-8">
        <div className="border-b border-slate-200">
          <TabsList className="bg-transparent h-auto p-0 space-x-6">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-2 py-3 text-slate-500 hover:text-slate-700 transition-all"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger
              value="digital"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-2 py-3 text-slate-500 hover:text-slate-700 transition-all"
            >
              Digitales
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 px-2 py-3 text-slate-500 hover:text-slate-700 transition-all"
            >
              PDFs
            </TabsTrigger>
          </TabsList>
        </div>
        <AnimatePresence mode="wait">
          <TabsContent value="all" className="focus:outline-none mt-0">
            {renderCatalogs("all")}
          </TabsContent>
          <TabsContent value="digital" className="focus:outline-none mt-0">
            {renderCatalogs("digital")}
          </TabsContent>
          <TabsContent value="pdf" className="focus:outline-none mt-0">
            {renderCatalogs("pdf")}
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <CatalogShareModal
        catalog={shareModalCatalog}
        open={!!shareModalCatalog}
        onOpenChange={(open) => !open && setShareModalCatalog(null)}
      />
      <DeleteCatalogDialog
        catalog={deleteCatalog}
        open={!!deleteCatalog}
        onOpenChange={(open) => !open && setDeleteCatalog(null)}
        onConfirm={() => {
          if (deleteCatalog) {
            deleteDigitalMutation.mutate(deleteCatalog.id);
            setDeleteCatalog(null);
          }
        }}
      />
      <DeleteCatalogDialog
        catalog={deletePDFId ? ({ id: deletePDFId, name: "Archivo PDF" } as any) : null}
        open={!!deletePDFId}
        onOpenChange={(open) => !open && setDeletePDFId(null)}
        onConfirm={() => {
          if (deletePDFId) {
            deletePDFMutation.mutate(deletePDFId);
            setDeletePDFId(null);
          }
        }}
      />
    </div>
  );
};

export default Catalogs;
