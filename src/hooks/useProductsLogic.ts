import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { processImagesOnly } from "@/lib/catalogService";
import { Product, getDisplayImageUrl, getCatalogImageUrl, getProcessingStatus } from "@/types/products";

// 1. Definimos la URL del placeholder (¡ACTUALIZADA!)
const PLACEHOLDER_URL = "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/business-logos/Package.png";

// 2. Helper para identificar productos "Default"
const isDefaultImage = (product: Product) => {
  return (
    product.original_image_url === PLACEHOLDER_URL ||
    product.catalog_image_url === PLACEHOLDER_URL ||
    product.thumbnail_image_url === PLACEHOLDER_URL
  );
};

export const useProductsLogic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCatalogPreview, setShowCatalogPreview] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBusinessInfoBanner, setShowBusinessInfoBanner] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null); // 3. Estado activo de pestaña: Cambiado a 'all' por defecto
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "all"; // Default a "Todos"
  });

  useEffect(() => {
    if (user) {
      loadProducts();
      const interval = setInterval(loadProducts, 10000);
      return () => clearInterval(interval);
    }
  }, [user]); // 4. Sincronizar pestaña activa con URL (incluye 'all' y 'default')

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && ["all", "with-background", "processing", "no-background", "default"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id, user_id, name, description, custom_description, 
          price_retail, price_wholesale, wholesale_min_qty, category, brand,
          original_image_url, processed_image_url, hd_image_url, image_url,
          catalog_image_url, thumbnail_image_url, luxury_image_url, print_image_url,
          processing_status, processing_progress, is_processed, processed_at,
          credits_used, service_type, error_message,
          has_variants, variant_count, tags,
          created_at, updated_at, deleted_at
        `,
        )
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }; // 5. Filtrar productos por pestaña activa (Lógica actualizada)

  const getProductsForTab = (tab: string) => {
    let statusFilter: string[];
    switch (tab) {
      case "all":
        statusFilter = ["pending", "processing", "completed", "failed"]; // Todos los estados
        break;
      case "with-background":
        statusFilter = ["pending"];
        break;
      case "processing":
        statusFilter = ["processing"];
        break;
      case "no-background":
        statusFilter = ["completed"];
        break;
      case "default":
        statusFilter = []; // No aplica estado, solo el helper
        break;
      default:
        statusFilter = ["pending"];
    }

    return products.filter((product) => {
      const isDefault = isDefaultImage(product);
      const status = getProcessingStatus(product); // Búsqueda

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        (product.tags &&
          Array.isArray(product.tags) &&
          product.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
      const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      const baseFilters = matchesSearch && matchesCategory;

      // Lógica de filtrado por pestaña
      if (tab === "default") {
        // Solo productos default que pasen el filtro
        return isDefault && baseFilters;
      }

      if (tab === "all") {
        // Todos los productos MENOS los default que pasen el filtro
        return !isDefault && baseFilters;
      }

      // Para el resto de pestañas ('with-background', 'processing', 'no-background')
      // Excluimos los default y filtramos por estado
      if (isDefault) return false;

      const matchesStatus = statusFilter.includes(status);
      return matchesStatus && baseFilters;
    });
  };

  const filteredProducts = getProductsForTab(activeTab);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("tab", newTab);
    setSearchParams(newSearchParams);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const selectAllProducts = () => {
    const currentTabProductIds = filteredProducts.map((p) => p.id);
    const currentTabSelectedCount = selectedProducts.filter((id) => currentTabProductIds.includes(id)).length;
    if (currentTabSelectedCount === currentTabProductIds.length && currentTabProductIds.length > 0) {
      // Deseleccionar todos los de esta pestaña
      setSelectedProducts((prev) => prev.filter((id) => !currentTabProductIds.includes(id)));
    } else {
      // Seleccionar todos los de esta pestaña
      setSelectedProducts((prev) => [...new Set([...prev, ...currentTabProductIds])]);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleRemoveBackground = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para quitar el fondo",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const selectedProductsData = products.filter((p) => selectedProducts.includes(p.id));
      const productsForWebhook = selectedProductsData.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description || product.custom_description,
        category: product.category,
        price_retail: product.price_retail || 0,
        original_image_url: product.original_image_url,
        estimated_credits: 1,
        estimated_cost_mxn: 2.0,
      }));

      await Promise.all(
        selectedProductsData.map((product) =>
          supabase
            .from("products")
            .update({
              processing_status: "processing",
              processing_progress: 0,
            })
            .eq("id", product.id),
        ),
      );

      const result = await processImagesOnly(productsForWebhook, {
        business_name: "Mi Empresa",
        primary_color: "#3B82F6",
        secondary_color: "#1F2937",
      });

      if (result.success) {
        toast({
          title: "¡Proceso iniciado!",
          description: `Quitando fondo a ${selectedProducts.length} productos`,
          variant: "default",
        });

        handleTabChange("processing");
      } else {
        throw new Error(result.error || "Error en el procesamiento");
      }
    } catch (error) {
      console.error("Error procesando imágenes:", error);
      toast({
        title: "Error en procesamiento",
        description: error instanceof Error ? error.message : "No se pudieron procesar las imágenes",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      await loadProducts();
    }
  };

  const resetProcessingProducts = async () => {
    try {
      const { data: processingProducts, error } = await supabase
        .from("products")
        .select("id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("processing_status", "processing");

      if (error) throw error;

      if (processingProducts && processingProducts.length > 0) {
        const { error: updateError } = await supabase
          .from("products")
          .update({
            processing_status: "pending",
            processing_progress: 0,
          })
          .in(
            "id",
            processingProducts.map((p) => p.id),
          );

        if (updateError) throw updateError;

        toast({
          title: "Productos restaurados",
          description: `${processingProducts.length} productos han vuelto a "Con Fondo"`,
          variant: "default",
        });

        await loadProducts();
      } else {
        toast({
          title: "No hay productos procesando",
          description: "No se encontraron productos en estado de procesamiento",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error resetting processing products:", error);
      toast({
        title: "Error",
        description: "No se pudieron resetear los productos",
        variant: "destructive",
      });
    }
  };

  const handleCreateCatalog = async (isBusinessInfoComplete: boolean) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Selecciona productos",
        description: "Debes seleccionar al menos un producto para crear un catálogo",
        variant: "destructive",
      });
      return;
    }

    if (!isBusinessInfoComplete) {
      toast({
        title: "Información del negocio incompleta",
        description: "Para crear catálogos profesionales necesitas completar los datos de tu empresa",
        variant: "default",
      });
      setShowBusinessInfoBanner(true);
      return;
    }

    setShowCatalogPreview(true);
  };

  const confirmCreateCatalog = async (catalogTitle: string) => {
    try {
      const selectedProductsData = products
        .filter((p) => selectedProducts.includes(p.id))
        .map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description || product.custom_description,
          custom_description: product.custom_description,
          category: product.category,
          brand: product.brand,
          model: product.model,
          color: product.color,
          price_retail: product.price_retail || 0,
          price_wholesale: product.price_wholesale || 0,
          wholesale_min_qty: product.wholesale_min_qty,
          features: product.features,
          tags: product.tags,
          image_url: getCatalogImageUrl(product),
          original_image_url: product.original_image_url,
          processed_image_url: product.processed_image_url,
          hd_image_url: product.hd_image_url,
          catalog_image_url: product.catalog_image_url,
          thumbnail_image_url: product.thumbnail_image_url,
          luxury_image_url: product.luxury_image_url,
          print_image_url: product.print_image_url,
          video_url: product.video_url,
          social_media_urls: product.social_media_urls,
          processing_status: product.processing_status,
          ai_description: product.ai_description,
          ai_tags: product.ai_tags,
          has_variants: product.has_variants,
          variant_count: product.variant_count,
          created_at: product.created_at,
          updated_at: product.updated_at,
        }));

      localStorage.setItem("selectedProductsData", JSON.stringify(selectedProductsData));
      localStorage.setItem("catalogTitle", catalogTitle);
      localStorage.setItem(
        "businessInfo",
        JSON.stringify({
          business_name: "Mi Empresa",
        }),
      );

      navigate("/template-selection");
    } catch (error) {
      console.error("Error en confirmCreateCatalog:", error);
      toast({
        title: "Error",
        description: "No se pudo preparar el catálogo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete || !user) return;

    try {
      const { data, error } = await supabase.rpc("soft_delete_product", {
        product_id: productToDelete.id,
        requesting_user_id: user.id,
        reason: "User deletion",
      });

      if (error) throw error;

      if (!data) {
        toast({
          title: "Error",
          description: "No tienes permisos para eliminar este producto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} se movió a la papelera`,
      });

      await loadProducts();
      setSelectedProducts((prev) => prev.filter((id) => id !== productToDelete.id));
      setProductToDelete(null);
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    }
  }; // 6. Cálculo de estadísticas (Actualizado)

  const getStats = () => {
    const productsWithRealImages = products.filter((p) => !isDefaultImage(p));
    const defaultProducts = products.filter((p) => isDefaultImage(p));

    return {
      total: products.length, // Total real de todos los productos
      all: productsWithRealImages.length, // Total de productos REALES (no default)
      withBackground: productsWithRealImages.filter((p) => getProcessingStatus(p) === "pending").length,
      processing: productsWithRealImages.filter((p) => getProcessingStatus(p) === "processing").length,
      noBackground: productsWithRealImages.filter((p) => getProcessingStatus(p) === "completed").length,
      failed: productsWithRealImages.filter((p) => getProcessingStatus(p) === "failed").length,
      default: defaultProducts.length, // Total de productos "Default"
    };
  };

  return {
    products,
    selectedProducts,
    loading,
    processing,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    showCatalogPreview,
    setShowCatalogPreview,
    showViewModal,
    setShowViewModal,
    selectedProduct,
    showBusinessInfoBanner,
    setShowBusinessInfoBanner,
    activeTab,
    showDeleteConfirm,
    setShowDeleteConfirm,
    productToDelete,
    filteredProducts,
    categories,
    stats: getStats(),
    handleTabChange,
    toggleProductSelection,
    selectAllProducts,
    handleViewProduct,
    handleRemoveBackground,
    resetProcessingProducts,
    handleCreateCatalog,
    confirmCreateCatalog,
    handleDeleteProduct,
    confirmDeleteProduct,
    navigate,
  };
};
