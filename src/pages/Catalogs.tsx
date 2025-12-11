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
  Truck, // ✅ Icono para Surtir
  Store,
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

// ==========================================
// 1. TIPOS & INTERFACES
// ==========================================

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

// Extensión para catálogos replicados (L2)
interface ReplicatedCatalogUI extends Partial<DigitalCatalog> {
  replicatedCatalogId: string;
  replicatedSlug: string;
  originalName: string;
  originalCatalogId: string; // Necesario para consolidar
  isActive: boolean;
  distributorId?: string; // ID del L1
}

type CatalogType = "all" | "pdf" | "digital";

// ==========================================
// 2. VARIANTES DE ANIMACIÓN
// ==========================================
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// ==========================================
// 3. COMPONENTES INTERNOS (Cards)
// ==========================================

const DigitalCatalogCard = ({
  catalog,
  onShare,
  onDelete,
}: {
  catalog: DigitalCatalog;
  onShare: (catalog: DigitalCatalog) => void;
  onDelete: (catalog: DigitalCatalog) => void;
}) => {
  const navigate = useNavigate();
  const isExpired = catalog.expires_at ? new Date(catalog.expires_at) < new Date() : false;
  const isActive = catalog.is_active && !isExpired;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative overflow-hidden border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? "bg-indigo-500" : "bg-slate-300"}`} />

        {/* Header Visual */}
        <div className="relative h-32 bg-slate-100 overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute top-3 left-4 right-3 flex justify-between items-start">
            <Badge variant="outline" className="bg-white/90 backdrop-blur text-indigo-700 border-indigo-100 shadow-sm">
              <Globe className="w-3 h-3 mr-1.5" /> Propio (L1)
            </Badge>
            {catalog.is_private && (
              <div className="bg-slate-900/80 p-1.5 rounded-full text-white" title="Privado">
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
              <h3
                className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
                title={catalog.name}
              >
                {catalog.name}
              </h3>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className={`text-[10px] px-1.5 h-5 shrink-0 ml-2 ${isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-500"}`}
              >
                {isActive ? "ACTIVO" : "INACTIVO"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2 min-h-[2.5em]">
              {catalog.description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 py-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{catalog.view_count || 0} Vistas</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(catalog.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 mt-auto">
            <Button
              size="sm"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8 text-xs"
              onClick={() => window.open(`/c/${catalog.slug}`, "_blank")}
              disabled={!isActive}
            >
              Ver Catálogo
            </Button>

            <div className="flex border border-slate-200 rounded-md overflow-hidden divide-x divide-slate-200">
              <button
                onClick={() => onShare(catalog)}
                className="p-2 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Compartir"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate(`/catalogs/${catalog.id}/edit`)}
                className="p-2 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(catalog)}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                title="Eliminar"
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

const ReplicatedCatalogCard = ({
  catalog,
  onShare,
}: {
  catalog: ReplicatedCatalogUI;
  onShare: (catalog: DigitalCatalog) => void;
}) => {
  const navigate = useNavigate();

  const shareAdapter = () => {
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
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative overflow-hidden border border-violet-100 bg-white hover:border-violet-300 hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />

        <div className="relative h-32 bg-violet-50/50 overflow-hidden shrink-0">
          <div className="absolute top-3 left-4 right-3 flex justify-between items-start">
            <Badge variant="outline" className="bg-white/90 backdrop-blur text-violet-700 border-violet-200 shadow-sm">
              <Store className="w-3 h-3 mr-1.5" /> Replicado (L2)
            </Badge>
          </div>
          <div className="flex h-full items-center justify-center">
            <Share2 className="w-12 h-12 text-violet-200 group-hover:scale-110 group-hover:text-violet-400 transition-all duration-500" />
          </div>
        </div>

        <CardContent className="p-4 pl-5 flex flex-col flex-1">
          <div className="mb-4 flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3
                className="font-semibold text-slate-900 line-clamp-1 group-hover:text-violet-600 transition-colors"
                title={catalog.originalName}
              >
                {catalog.originalName}
              </h3>
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">
              {catalog.description || "Catálogo de proveedor externo listo para venta."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 py-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{catalog.view_count || 0} Vistas</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-700 px-2">
                Tu Tienda
              </Badge>
            </div>
          </div>

          {/* --- BOTONES DE ACCIÓN L2 --- */}
          <div className="grid grid-cols-2 gap-2 pt-3 mt-auto">
            {/* 1. Gestionar Precios */}
            <Button
              size="sm"
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-50 h-8 text-xs w-full"
              onClick={() => navigate(`/reseller/edit-prices?catalog_id=${catalog.replicatedCatalogId}`)}
            >
              <DollarSign className="w-3.5 h-3.5 mr-1" /> Precios
            </Button>

            {/* 2. Surtir / Reabastecer (USAR ID ORIGINAL PARA BUSCAR EL PROVEEDOR) */}
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm h-8 text-xs w-full"
              onClick={() => navigate(`/reseller/consolidate/${catalog.originalCatalogId}`)}
            >
              <Truck className="w-3.5 h-3.5 mr-1" /> Surtir
            </Button>

            {/* 3. Botones secundarios */}
            <div className="col-span-2 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-8 border border-slate-100 text-slate-500 hover:text-slate-700"
                onClick={() => window.open(`/c/${catalog.replicatedSlug}`, "_blank")}
                title="Ver mi tienda pública"
              >
                <Eye className="w-3.5 h-3.5 mr-2" /> Ver Tienda
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-10 border border-slate-100 text-slate-500"
                onClick={shareAdapter}
                title="Compartir link"
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  };

  const handleDownload = () => {
    if (catalog.pdf_url) window.open(catalog.pdf_url, "_blank");
    else toast({ title: "PDF no disponible", description: "Aún no se genera el archivo.", variant: "destructive" });
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="group relative overflow-hidden border border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-white hover:shadow-md transition-all duration-300 h-full flex flex-col">
        <div className="relative h-32 bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          <div className="absolute top-3 left-4">
            <Badge variant="secondary" className="bg-slate-900 text-white border-none shadow-sm">
              <FileText className="w-3 h-3 mr-1.5" /> PDF
            </Badge>
          </div>
          {catalog.preview_image_url ? (
            <img
              src={catalog.preview_image_url}
              alt={catalog.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <FileText className="w-12 h-12 text-slate-400 group-hover:text-slate-600 transition-colors" />
          )}
        </div>

        <CardContent className="p-4 pl-5 flex flex-col flex-1">
          <div className="mb-4 flex-1">
            <h3
              className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors"
              title={catalog.name}
            >
              {catalog.name}
            </h3>
            <div className="flex gap-2 mt-1 text-xs text-slate-500">
              <span>{catalog.total_products} prods</span>
              <span>•</span>
              <span>{formatDate(catalog.created_at)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-200/60 mt-auto">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs bg-white border-slate-300"
              onClick={handleDownload}
              disabled={!catalog.pdf_url}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar
            </Button>
            {catalog.pdf_url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => window.open(catalog.pdf_url, "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
      <div className="flex justify-between">
        <Skeleton className="h-5 w-2/3 bg-slate-100" />
        <Skeleton className="h-5 w-16 bg-slate-100" />
      </div>
      <Skeleton className="h-3 w-full bg-slate-100" />
      <Skeleton className="h-3 w-1/2 bg-slate-100" />
      <div className="pt-4 flex gap-2">
        <Skeleton className="h-8 flex-1 bg-slate-100" />
        <Skeleton className="h-8 w-8 bg-slate-100" />
      </div>
    </CardContent>
  </Card>
);

// ==========================================
// 4. COMPONENTE PRINCIPAL (Page)
// ==========================================

const Catalogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CatalogType>("all");

  const [shareModalCatalog, setShareModalCatalog] = useState<DigitalCatalog | null>(null);
  const [deleteCatalog, setDeleteCatalog] = useState<DigitalCatalog | null>(null);
  const [deletePDFId, setDeletePDFId] = useState<string | null>(null);

  const { limits, loading: limitsLoading } = useCatalogLimits();

  // --- QUERY 1: Digital Catalogs (L1) ---
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

  // --- QUERY 3: Replicated Catalogs (L2) ---
  const { data: replicatedCatalogs = [], isLoading: loadingReplicated } = useQuery({
    queryKey: ["replicated-catalogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Consulta relajada: solo requiere que el reseller_id coincida
      const { data, error } = await supabase
        .from("replicated_catalogs")
        .select(
          `
            id, 
            slug, 
            is_active,
            original_catalog_id,
            digital_catalogs (
                id, name, description, is_private, view_count, user_id
            )
        `,
        )
        .eq("reseller_id", user.id)
        // .eq("is_active", true) // 👈 REMOVIDO: Para mostrar incluso si se desactivaron
        .order("activated_at", { ascending: false });

      if (error) throw error;

      return (data || [])
        .map((r: any) => {
          const base = r.digital_catalogs;
          if (!base) return null;

          return {
            ...base,
            originalName: base.name,
            originalCatalogId: r.original_catalog_id, // Key para consolidar
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

  // --- MUTATIONS ---
  const deleteDigitalMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      if (!user) throw new Error("No user");
      await DigitalCatalogService.deleteCatalog(catalogId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-catalogs"] });
      toast({ title: "Catálogo eliminado", description: "El catálogo digital ha sido eliminado correctamente" });
    },
    onError: () => toast({ title: "Error", description: "No se pudo eliminar el catálogo", variant: "destructive" }),
  });

  const deletePDFMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      const { error } = await supabase.from("catalogs").delete().eq("id", catalogId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-catalogs"] });
      toast({ title: "Catálogo eliminado", description: "El archivo PDF ha sido eliminado correctamente" });
    },
    onError: () => toast({ title: "Error", description: "No se pudo eliminar el archivo", variant: "destructive" }),
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
      <Button onClick={handleCreateNew} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
        <Plus className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Nuevo Digital</span>
      </Button>
      <Button
        variant="outline"
        onClick={() => navigate("/products")}
        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <FileText className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Generar PDF</span>
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

    if (isEmpty) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 mb-6 ring-8 ring-slate-50">
            <LayoutGrid className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Espacio de trabajo limpio</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
            No hay catálogos {type !== "all" ? "de este tipo" : ""} creados aún. Comienza creando una herramienta de
            venta para tu red.
          </p>
          <Button
            size="lg"
            onClick={handleCreateNew}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Catálogo
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10 mt-6">
        {/* SECCIÓN 1: Catálogos Propios (L1) */}
        {visibleDigital.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800">Catálogos Maestros (L1)</h2>
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

        {/* SECCIÓN 2: Catálogos Replicados (L2) */}
        {visibleReplicated.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-200/60">
              <h2 className="text-lg font-bold text-slate-800">Red de Distribución (L2)</h2>
              <Badge variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-100">
                {visibleReplicated.length}
              </Badge>
            </div>

            <div className="flex items-start gap-3 p-4 mb-6 bg-violet-50/50 border border-violet-100 rounded-xl text-sm text-violet-800">
              <Share2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Estos catálogos provienen de tus proveedores. Puedes cambiar los precios para tu tienda, pero los
                productos base se actualizan automáticamente.
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
              <h2 className="text-lg font-bold text-slate-800">Archivos Estáticos (PDF)</h2>
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
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-2 py-3 text-slate-500 hover:text-slate-700 transition-all"
            >
              Todos{" "}
              <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{totalCatalogs}</span>
            </TabsTrigger>
            <TabsTrigger
              value="digital"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-2 py-3 text-slate-500 hover:text-slate-700 transition-all"
            >
              Digitales
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none px-2 py-3 text-slate-500 hover:text-slate-700 transition-all"
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
