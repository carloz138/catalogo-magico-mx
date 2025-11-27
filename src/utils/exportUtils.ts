import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const handleExportFullInventory = async (userId: string) => {
  try {
    toast({ title: "Generando archivo...", description: "Esto puede tardar unos segundos." });

    // 1. Obtener productos activos
    const { data: products, error: prodError } = await supabase
      .from("active_products")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (prodError) throw prodError;

    // 2. Obtener todas las variantes de este usuario
    const { data: variants, error: varError } = await supabase
      .from("product_variants")
      .select("*")
      .eq("user_id", userId);

    if (varError) throw varError;

    const rows: any[] = [];

    // 3. Cruzar datos y aplanar (Flatten)
    products.forEach((p) => {
      if (!p.has_variants) {
        // CASO A: Producto Simple (1 Fila)
        rows.push({
          TIPO_FILA: "producto",
          ID_SISTEMA: p.id,
          ID_VARIANTE: "", // Vacío
          Nombre: p.name,
          "Variante (Detalle)": "General", // Texto informativo
          SKU: p.sku || "",
          Categoría: p.category || "",
          "Precio Menudeo": p.price_retail ? p.price_retail / 100 : 0,
          "Precio Mayoreo": p.price_wholesale ? p.price_wholesale / 100 : 0,
          "Min. Mayoreo": p.wholesale_min_qty || 0,
          Stock: p.stock_quantity, // Puede ser null (infinito)
          Tags: p.tags ? p.tags.join(", ") : "",
          Descripción: p.description || "",
        });
      } else {
        // CASO B: Producto con Variantes (Multiples Filas)
        // Primero buscamos sus variantes
        const productVariants = variants.filter((v) => v.product_id === p.id);

        if (productVariants.length === 0) {
          // Edge case: Tiene flag de variantes pero no variantes creadas. Exportamos como padre.
          rows.push({
            TIPO_FILA: "producto",
            ID_SISTEMA: p.id,
            ID_VARIANTE: "",
            Nombre: p.name,
            "Variante (Detalle)": "SIN VARIANTES DEFINIDAS",
            SKU: p.sku || "",
            Categoría: p.category || "",
            "Precio Menudeo": p.price_retail ? p.price_retail / 100 : 0,
            // ... resto igual
          });
        } else {
          // Generamos una fila por cada variante
          productVariants.forEach((v) => {
            // Parseamos la combinación JSON para que sea legible (ej: "Rojo / M")
            let variantName = "Variante";
            try {
              const combo =
                typeof v.variant_combination === "string" ? JSON.parse(v.variant_combination) : v.variant_combination;
              variantName = Object.values(combo).join(" / ");
            } catch (e) {
              variantName = "Opción";
            }

            rows.push({
              TIPO_FILA: "variante",
              ID_SISTEMA: p.id, // ID del padre para referencia
              ID_VARIANTE: v.id, // ID real para update
              Nombre: p.name, // Solo informativo
              "Variante (Detalle)": variantName,
              SKU: v.sku || "",
              Categoría: p.category || "", // Informativo
              "Precio Menudeo": v.price_retail ? v.price_retail / 100 : p.price_retail ? p.price_retail / 100 : 0,
              "Precio Mayoreo": v.price_wholesale
                ? v.price_wholesale / 100
                : p.price_wholesale
                  ? p.price_wholesale / 100
                  : 0,
              "Min. Mayoreo": "", // Las variantes no suelen manejar min qty propio, heredan del padre, lo dejamos vacío
              Stock: v.stock_quantity,
              Tags: "", // Tags van al padre
              Descripción: "", // Descripción va al padre
            });
          });
        }
      }
    });

    // 4. Generar Excel
    const ws = XLSX.utils.json_to_sheet(rows);
    // Ajustar anchos
    ws["!cols"] = [{ wch: 10 }, { wch: 36 }, { wch: 36 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario Detallado");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Inventario_Completo_${date}.xlsx`);

    toast({ title: "Descarga iniciada", description: `Se exportaron ${rows.length} filas.` });
  } catch (error) {
    console.error(error);
    toast({ title: "Error al exportar", variant: "destructive" });
  }
};
