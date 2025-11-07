import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Share2, Edit, Trash2, Plus, Lock, Globe, Calendar, FileText, Download, ExternalLink, DollarSign } from "lucide-react";
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
// TIPOS
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

type CatalogType = "all" | "pdf" | "digital";

// ==========================================
// COMPONENTE: CARD DE CATÁLOGO DIGITAL
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

  const handleViewCatalog = () => {
    window.open(`/c/${catalog.slug}`, "_blank");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Badge de tipo */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-blue-500 text-white">
          <Globe className="w-3 h-3 mr-1" />
          Digital
        </Badge>
      </div>

      {/* Imagen de portada */}
      <div className="aspect-video bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
        <Globe className="w-16 h-16 text-blue-500/30 group-hover:scale-110 transition-transform" />
        <div className="absolute top-2 right-2 flex gap-1">
          {catalog.is_private && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur">
              <Lock className="w-3 h-3 mr-1" />
              Privado
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1">{catalog.name}</h3>
            <Badge variant={isActive ? "default" : "destructive"} className="shrink-0">
              {isActive ? "Activo" : "Expirado"}
            </Badge>
          </div>
          {catalog.description && <p className="text-sm text-muted-foreground line-clamp-2">{catalog.description}</p>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{catalog.view_count || 0} vistas</span>
          </div>
          {catalog.is_private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
        </div>

        {/* Dates */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Creado: {formatDate(catalog.created_at)}</span>
          </div>
          {catalog.expires_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className={isExpired ? "text-destructive" : ""}>Expira: {formatDate(catalog.expires_at)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleViewCatalog} disabled={!isActive}>
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button size="sm" variant="outline" onClick={() => onShare(catalog)}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/catalogs/${catalog.id}/edit`)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(catalog)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// COMPONENTE: CARD DE CATÁLOGO REPLICADO
// ==========================================

const ReplicatedCatalogCard = ({
  catalog,
  replicatedCatalogId,
  replicatedSlug,
  onShare,
  onDelete,
}: {
  catalog: any;
  replicatedCatalogId: string;
  replicatedSlug: string;
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

  const handleViewCatalog = () => {
    window.open(`/c/${replicatedSlug}`, "_blank");
  };

  const handleEditPrices = () => {
    navigate(`/reseller/edit-prices?catalog_id=${replicatedCatalogId}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group border-teal-200">
      {/* Badge de tipo */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-teal-500 text-white">
          <Share2 className="w-3 h-3 mr-1" />
          Replicado
        </Badge>
      </div>

      {/* Imagen de portada */}
      <div className="aspect-video bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center relative overflow-hidden">
        <Share2 className="w-16 h-16 text-teal-500/30 group-hover:scale-110 transition-transform" />
        <div className="absolute top-2 right-2 flex gap-1">
          {catalog.is_private && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur">
              <Lock className="w-3 h-3 mr-1" />
              Privado
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-1">{catalog.name}</h3>
            <Badge variant={isActive ? "default" : "destructive"} className="shrink-0 bg-teal-500">
              {isActive ? "Activo" : "Expirado"}
            </Badge>
          </div>
          {catalog.description && <p className="text-sm text-muted-foreground line-clamp-2">{catalog.description}</p>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{catalog.view_count || 0} vistas</span>
          </div>
          <Badge variant="outline" className="text-xs bg-teal-50">
            Tu catálogo
          </Badge>
        </div>

        {/* Dates */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Creado: {formatDate(catalog.created_at)}</span>
          </div>
          {catalog.expires_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span className={isExpired ? "text-destructive" : ""}>Expira: {formatDate(catalog.expires_at)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1" 
            onClick={handleViewCatalog} 
            disabled={!isActive}
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-purple-600 hover:bg-purple-700" 
            onClick={handleEditPrices}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Precios
          </Button>
          <Button size="sm" variant="outline" onClick={() => onShare(catalog)}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// COMPONENTE: CARD DE CATÁLOGO PDF
// ==========================================

const PDFCatalogCard = ({ catalog, onDelete }: { catalog: PDFCatalog; onDelete: (id: string) => void }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownload = () => {
    if (catalog.pdf_url) {
      window.open(catalog.pdf_url, "_blank");
    } else {
      toast({
        title: "PDF no disponible",
        description: "Este catálogo aún no tiene PDF generado",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
      {/* Badge de tipo */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-purple-500 text-white">
          <FileText className="w-3 h-3 mr-1" />
          PDF
        </Badge>
      </div>

      {/* Imagen de portada */}
      <div className="aspect-video bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center relative overflow-hidden">
        {catalog.preview_image_url ? (
          <img
            src={catalog.preview_image_url}
            alt={catalog.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <FileText className="w-16 h-16 text-purple-500/30 group-hover:scale-110 transition-transform" />
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-1">{catalog.name}</h3>
          {catalog.description && <p className="text-sm text-muted-foreground line-clamp-2">{catalog.description}</p>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{catalog.total_products} productos</span>
          </div>
          {catalog.total_pages && (
            <div className="flex items-center gap-1">
              <span>{catalog.total_pages} páginas</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Creado: {formatDate(catalog.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleDownload} disabled={!catalog.pdf_url}>
            <Download className="w-4 h-4 mr-1" />
            Descargar
          </Button>
          {catalog.pdf_url && (
            <Button size="sm" variant="outline" onClick={() => window.open(catalog.pdf_url, "_blank")}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDelete(catalog.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ==========================================
// COMPONENTE: SKELETON
// ==========================================

const CatalogSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-video" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </CardContent>
  </Card>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

const Catalogs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CatalogType>("all");
  const [shareModalCatalog, setShareModalCatalog] = useState<DigitalCatalog | null>(null);
  const [deleteCatalog, setDeleteCatalog] = useState<DigitalCatalog | null>(null);
  const [deletePDFId, setDeletePDFId] = useState<string | null>(null);

  // Fetch catalog limits
  const { limits, loading: limitsLoading } = useCatalogLimits();

  // Fetch digital catalogs
  const { data: digitalCatalogs = [], isLoading: loadingDigital } = useQuery({
    queryKey: ["digital-catalogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await DigitalCatalogService.getUserCatalogs(user.id);
    },
    enabled: !!user,
  });

  // Fetch PDF catalogs
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

  // Fetch replicated catalogs (catálogos que el usuario activó como L2)
  const { data: replicatedCatalogs = [], isLoading: loadingReplicated } = useQuery({
    queryKey: ["replicated-catalogs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("replicated_catalogs")
        .select(`
          id,
          slug,
          digital_catalogs (
            id,
            name,
            slug,
            description,
            is_private,
            is_active,
            expires_at,
            view_count,
            created_at
          )
        `)
        .eq("reseller_id", user.id)
        .eq("is_active", true)
        .order("activated_at", { ascending: false });

      if (error) throw error;
      // Transformar a formato extendido con replicated_catalog_id
      return data.map(r => ({
        ...r.digital_catalogs,
        replicatedCatalogId: r.id, // ID del catálogo replicado
        replicatedSlug: r.slug, // Slug del catálogo replicado
      })).filter(Boolean);
    },
    enabled: !!user,
  });

  // Delete digital catalog mutation
  const deleteDigitalMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      if (!user) throw new Error("No user");
      await DigitalCatalogService.deleteCatalog(catalogId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-catalogs"] });
      toast({
        title: "Catálogo eliminado",
        description: "El catálogo digital ha sido eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el catálogo",
        variant: "destructive",
      });
    },
  });

  // Delete PDF catalog mutation
  const deletePDFMutation = useMutation({
    mutationFn: async (catalogId: string) => {
      const { error } = await supabase.from("catalogs").delete().eq("id", catalogId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-catalogs"] });
      toast({
        title: "Catálogo eliminado",
        description: "El catálogo PDF ha sido eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el catálogo",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    navigate("/catalogs/new");
  };

  const isLoading = loadingDigital || loadingPDF || loadingReplicated;
  const totalCatalogs = digitalCatalogs.length + pdfCatalogs.length + replicatedCatalogs.length;

  const actions = (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">{totalCatalogs} catálogos totales</div>
      <Button onClick={handleCreateNew}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Catálogo Digital
      </Button>
      <Button variant="outline" onClick={() => navigate("/products")}>
        <FileText className="w-4 h-4 mr-2" />
        Crear PDF
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout actions={actions}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CatalogSkeleton key={i} />
            ))}
          </div>
        </AppLayout>
    );
  }

  const renderCatalogs = (type: CatalogType) => {
    const showDigital = type === "all" || type === "digital";
    const showPDF = type === "all" || type === "pdf";

    const hasDigital = showDigital && digitalCatalogs.length > 0;
    const hasPDF = showPDF && pdfCatalogs.length > 0;
    const hasReplicated = showDigital && replicatedCatalogs.length > 0;
    const isEmpty = !hasDigital && !hasPDF && !hasReplicated;

    if (isEmpty) {
      return (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {type === "digital" && "No tienes catálogos digitales"}
            {type === "pdf" && "No tienes catálogos PDF"}
            {type === "all" && "Aún no has creado ningún catálogo"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Crea tu primer catálogo para compartir tus productos con clientes
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Catálogo Digital
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/products")}>
              <FileText className="w-4 h-4 mr-2" />
              Crear PDF
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Digital Catalogs Section */}
        {showDigital && digitalCatalogs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-500" />
              Catálogos Digitales Interactivos
              <Badge variant="secondary">{digitalCatalogs.length}</Badge>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {digitalCatalogs.map((catalog) => (
                <DigitalCatalogCard
                  key={catalog.id}
                  catalog={catalog}
                  onShare={setShareModalCatalog}
                  onDelete={setDeleteCatalog}
                />
              ))}
            </div>
          </div>
        )}

        {/* Replicated Catalogs Section */}
        {showDigital && replicatedCatalogs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-teal-500" />
              Catálogos Replicados (Como Distribuidor)
              <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                {replicatedCatalogs.length}
              </Badge>
            </h2>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-teal-800">
                💡 Estos son catálogos que activaste de otros proveedores. Puedes revenderlos con tu propia marca y precios.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {replicatedCatalogs.map((catalog: any) => (
                <ReplicatedCatalogCard
                  key={catalog.id}
                  catalog={catalog}
                  replicatedCatalogId={catalog.replicatedCatalogId}
                  replicatedSlug={catalog.replicatedSlug}
                  onShare={setShareModalCatalog}
                  onDelete={setDeleteCatalog}
                />
              ))}
            </div>
          </div>
        )}

        {/* PDF Catalogs Section */}
        {showPDF && pdfCatalogs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-500" />
              Catálogos PDF Descargables
              <Badge variant="secondary">{pdfCatalogs.length}</Badge>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pdfCatalogs.map((catalog) => (
                <PDFCatalogCard key={catalog.id} catalog={catalog} onDelete={setDeletePDFId} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout actions={actions}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mis Catálogos</h1>
            <p className="text-muted-foreground">Gestiona tus catálogos digitales interactivos y PDFs descargables</p>
          </div>

          {/* Business Info Banner */}
          <BusinessInfoBanner />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CatalogType)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">Todos ({totalCatalogs})</TabsTrigger>
              <TabsTrigger value="digital">
                <Globe className="w-4 h-4 mr-2" />
                Digitales ({digitalCatalogs.length})
              </TabsTrigger>
              <TabsTrigger value="pdf">
                <FileText className="w-4 h-4 mr-2" />
                PDF ({pdfCatalogs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {renderCatalogs("all")}
            </TabsContent>

            <TabsContent value="digital" className="mt-6">
              {renderCatalogs("digital")}
            </TabsContent>

            <TabsContent value="pdf" className="mt-6">
              {renderCatalogs("pdf")}
            </TabsContent>
          </Tabs>
        </div>

        {/* Share Modal for Digital Catalogs */}
        <CatalogShareModal
          catalog={shareModalCatalog}
          open={!!shareModalCatalog}
          onOpenChange={(open) => !open && setShareModalCatalog(null)}
        />

        {/* Delete Dialog for Digital Catalogs */}
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

        {/* Delete Dialog for PDF Catalogs */}
        <DeleteCatalogDialog
          catalog={deletePDFId ? ({ id: deletePDFId, name: "Catálogo PDF" } as any) : null}
          open={!!deletePDFId}
          onOpenChange={(open) => !open && setDeletePDFId(null)}
          onConfirm={() => {
            if (deletePDFId) {
              deletePDFMutation.mutate(deletePDFId);
              setDeletePDFId(null);
            }
          }}
        />
      </AppLayout>
  );
};

export default Catalogs;
