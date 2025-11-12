import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProductsTableEditor from "@/components/products/ProductsTableEditor"; // Asegúrate que esta ruta sea correcta
import { Button } from "@/components/ui/button";
import { Plus, Settings, BarChart3, Package, Edit, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/products";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// Componente auxiliar para vista móvil
const MobileProductCard = ({
  product,
  onEdit,
  onView,
}: {
  product: Product;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) => (
  <div className="bg-white rounded-lg border shadow-sm p-4">
    <div className="flex gap-3">
      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        {product.original_image_url ? (
          <img src={product.original_image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">SKU: {product.sku || "N/A"}</p>
        <span className="text-lg font-bold text-gray-900">
          ${product.price_retail ? (product.price_retail / 100).toFixed(2) : "0.00"}
        </span>
      </div>
    </div>
    <div className="flex gap-2 mt-3 pt-3 border-t">
      <Button variant="outline" size="sm" onClick={() => onView(product.id)} className="flex-1 h-10">
        <Eye className="w-4 h-4 mr-2" /> Ver
      </Button>
      <Button size="sm" onClick={() => onEdit(product.id)} className="flex-1 h-10">
        <Edit className="w-4 h-4 mr-2" /> Editar
      </Button>
    </div>
  </div>
);

const ProductsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para confirmación
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [productsToDelete, setProductsToDelete] = useState<string[]>([]);

  // --- DATA FETCHING ---
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Error", description: "No se pudieron cargar los productos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, fetchProducts]);

  // --- HANDLERS ---
  const handleViewProduct = (productId: string) => navigate(`/products/${productId}`);
  const handleGoToUpload = () => navigate("/upload");
  const handleGoToAnalytics = () => navigate("/analytics");
  const handleEditVariants = (id: string) =>
    toast({ title: "Próximamente", description: "Gestión de variantes en desarrollo" });

  // --- LÓGICA DE ACCIONES MASIVAS (NUEVO) ---

  // 1. Preparar eliminación
  const initiateBulkDelete = (ids: string[]) => {
    setProductsToDelete(ids);
    setShowBulkDeleteConfirm(true);
  };

  // 2. Ejecutar eliminación
  const confirmDeleteProducts = async () => {
    if (productsToDelete.length === 0 || !user) return;
    try {
      const deletePromises = productsToDelete.map((productId) =>
        supabase.rpc("soft_delete_product", {
          product_id: productId,
          requesting_user_id: user.id,
          reason: "Bulk deletion",
        }),
      );
      await Promise.all(deletePromises);

      toast({
        title: "Productos eliminados",
        description: `${productsToDelete.length} productos movidos a la papelera`,
      });
      await fetchProducts(); // Recargar
      setProductsToDelete([]);
    } catch (error) {
      console.error("Error deleting products:", error);
      toast({ title: "Error", description: "Error al eliminar productos", variant: "destructive" });
    }
  };

  // 3. Crear Catálogo desde Selección
  const handleBulkCatalog = (ids: string[]) => {
    if (ids.length === 0) return;

    const selectedData = products
      .filter((p) => ids.includes(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || p.custom_description,
        category: p.category,
        price_retail: p.price_retail || 0,
        // Usar imagen original como fallback
        image_url: p.processed_image_url || p.original_image_url,
        original_image_url: p.original_image_url,
        created_at: p.created_at,
      }));

    // Guardar en localStorage para que la página de templates los lea
    localStorage.setItem("selectedProductsData", JSON.stringify(selectedData));
    // Navegar
    navigate("/template-selection");
  };

  const actions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleGoToAnalytics} className="hidden md:flex gap-2">
        <BarChart3 className="w-4 h-4" /> Analytics
      </Button>
      <Button size="sm" onClick={handleGoToUpload} className="gap-2">
        <Plus className="w-4 h-4" /> Agregar
      </Button>
    </div>
  );

  return (
    // 👇 AGREGAMOS ESTE DIV PADRE
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header y Acciones (Asegúrate de incluir esto que estaba en el AppLayout) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-500">Administra tu inventario</p>
        </div>
        {actions}
      </div>

      {/* VISTA DESKTOP: EDITOR AVANZADO */}
      <div className="hidden lg:block bg-white rounded-xl border shadow-sm overflow-hidden">
        <ProductsTableEditor
          externalProducts={products}
          onProductsChange={setProducts}
          onEditVariants={handleEditVariants}
          onViewProduct={handleViewProduct}
          onBulkDelete={initiateBulkDelete}
          onBulkCatalog={handleBulkCatalog}
          className="border-0 shadow-none rounded-none"
        />
      </div>

      {/* VISTA MÓVIL: CARDS SIMPLES */}
      <div className="lg:hidden space-y-3">
        {products.length === 0 && !loading && <div className="text-center py-8 text-gray-500">No hay productos.</div>}
        {products.map((product) => (
          <MobileProductCard
            key={product.id}
            product={product}
            onEdit={(id) => console.log("Edit mobile", id)}
            onView={handleViewProduct}
          />
        ))}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <ConfirmationDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title="Eliminar Productos"
        description={`¿Estás seguro de que quieres eliminar ${productsToDelete.length} productos?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteProducts}
        variant="destructive"
      />
    </div> // 👈 CERRAMOS EL DIV PADRE
  );
};

export default ProductsManagement;
