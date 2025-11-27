import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Importamos nuestros nuevos componentes
import { ProductTable } from "@/components/products/table/ProductTable";
import { ExcelImporter } from "@/components/products/ExcelImporter";
import { VariantManagementModal } from "@/components/products/VariantManagementModal";
import { ProductWithUI } from "@/types/products";

const ProductsManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados
  const [products, setProducts] = useState<ProductWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [variantModalProduct, setVariantModalProduct] = useState<ProductWithUI | null>(null);

  // --- 1. CARGA DE DATOS ---
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("active_products") // Usamos la vista 'active_products' o la tabla 'products' según prefieras
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null) // Aseguramos no traer borrados
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Error cargando productos", variant: "destructive" });
    } else {
      // Agregamos la propiedad de UI 'isSaving'
      const formattedProducts: ProductWithUI[] = (data || []).map((p) => ({
        ...p,
        isSaving: false,
        // Aseguramos que tags sea un array siempre
        tags: Array.isArray(p.tags) ? p.tags : [],
      }));
      setProducts(formattedProducts);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchProducts();
  }, [user, fetchProducts]);

  // --- 2. ACTUALIZACIÓN OPTIMISTA (Inline Edit) ---
  const handleUpdateProduct = async (id: string, field: string, value: any) => {
    // A. Actualizamos la UI inmediatamente (Feedback instantáneo)
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: value, isSaving: true };
        }
        return p;
      }),
    );

    // B. Actualizamos en Base de Datos
    try {
      const { error } = await supabase
        .from("products")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      // Quitamos el estado de carga
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isSaving: false } : p)));

      // Opcional: Feedback visual sutil (console log o toast muy discreto)
    } catch (err) {
      console.error(err);
      toast({ title: "Error al guardar", description: "Verifica tu conexión", variant: "destructive" });
      fetchProducts(); // Revertimos cambios recargando
    }
  };

  // --- 3. IMPORTACIÓN MASIVA ---
  const handleImportExcel = async (data: any[], category: string) => {
    if (!user) return;
    setIsImporting(true);

    try {
      // Preparamos los datos añadiendo campos de sistema
      const productsToInsert = data.map((p) => ({
        ...p,
        user_id: user.id,
        category: category, // La categoría seleccionada en el modal
        has_variants: false,
        variant_count: 0,
        // Supabase generará los timestamps automáticos, pero si falla:
        // created_at: new Date().toISOString(),
        // updated_at: new Date().toISOString()
      }));

      // Insertamos (Supabase maneja batch inserts automáticamente)
      const { error } = await supabase.from("products").insert(productsToInsert);

      if (error) throw error;

      toast({
        title: "Importación completada",
        description: `Se han creado ${productsToInsert.length} productos correctamente.`,
      });

      fetchProducts(); // Recargar tabla
    } catch (error: any) {
      console.error("Error import:", error);
      toast({
        title: "Error en la importación",
        description: error.message || "Revisa el formato de tu Excel",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // --- 4. ACCIONES MASIVAS (Eliminar) ---
  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`¿Estás seguro de eliminar ${ids.length} productos?`)) return;

    try {
      // Usamos la función RPC que ya tienes 'soft_delete_product'
      // Ojo: Si el RPC recibe un solo ID, hay que iterar.
      // Si tienes un RPC masivo mejor, si no, hacemos Promise.all
      const promises = ids.map((id) =>
        supabase.rpc("soft_delete_product", {
          product_id: id,
          requesting_user_id: user?.id,
          reason: "Bulk delete from table",
        }),
      );

      await Promise.all(promises);

      toast({ title: "Productos eliminados" });
      // Actualizamos UI filtrando los eliminados
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    } catch (err) {
      console.error(err);
      toast({ title: "Error al eliminar", variant: "destructive" });
      fetchProducts();
    }
  };

  // --- 5. CREACIÓN DE CATÁLOGO (Placeholder) ---
  const handleBulkCatalog = (ids: string[]) => {
    // Aquí conectas tu lógica de creación de catálogos
    console.log("Crear catálogo con IDs:", ids);
    // Ejemplo: navigate(`/catalogs/create?products=${ids.join(',')}`);
    toast({ title: "Próximamente", description: `Crear catálogo con ${ids.length} productos` });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER SUPERIOR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
              {products.length} productos
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Importador de Excel */}
            <ExcelImporter onImport={handleImportExcel} isImporting={isImporting} />

            <Button
              onClick={() => navigate("/upload")}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Producto</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="container mx-auto p-4 md:p-6">
        <ProductTable
          data={products}
          isLoading={loading}
          onUpdateProduct={handleUpdateProduct}
          onBulkDelete={handleBulkDelete}
          onBulkCatalog={handleBulkCatalog}
          onOpenVariants={(product) => setVariantModalProduct(product)}
        />
      </div>

      {/* MODAL DE VARIANTES */}
      {variantModalProduct && (
        <VariantManagementModal
          open={!!variantModalProduct}
          onOpenChange={(open) => {
            if (!open) {
              setVariantModalProduct(null);
              fetchProducts(); // Refrescar para actualizar contadores de variantes
            }
          }}
          productId={variantModalProduct.id}
          productName={variantModalProduct.name}
          productCategory={variantModalProduct.category || undefined}
          basePrice={variantModalProduct.price_retail || 0}
          basePriceWholesale={variantModalProduct.price_wholesale || undefined}
        />
      )}
    </div>
  );
};

export default ProductsManagement;
