import * as XLSX from "xlsx";
import { ProductWithUI } from "@/types/products";

export const exportProductsToExcel = (products: ProductWithUI[]) => {
  // 1. Formateamos los datos para que sean legibles por humanos
  const dataToExport = products.map((p) => ({
    "ID_SISTEMA (NO TOCAR)": p.id, // 🔒 La llave maestra
    "Nombre": p.name,
    "SKU": p.sku || "",
    "Categoría": p.category || "",
    "Precio Menudeo": p.price_retail ? p.price_retail / 100 : 0, // A pesos
    "Precio Mayoreo": p.price_wholesale ? p.price_wholesale / 100 : 0, // A pesos
    "Min. Mayoreo": p.wholesale_min_qty || 0,
    "Tags": p.tags ? p.tags.join(", ") : "",
    "Descripción": p.description || ""
  }));

  // 2. Crear hoja de trabajo
  const ws = XLSX.utils.json_to_sheet(dataToExport);

  // 3. (Opcional) Ajustar ancho de columnas para que se vea bonito al abrir
  const wscols = [
    { wch: 36 }, // ID (ancho, quizas oculto visualmente)
    { wch: 40 }, // Nombre
    { wch: 15 }, // SKU
    { wch: 15 }, // Categoría
    { wch: 15 }, // Precio
    { wch: 15 }, // Precio M
    { wch: 10 }, // Min
    { wch: 30 }, // Tags
  ];
  ws['!cols'] = wscols;

  // 4. Crear libro y descargar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  
  // Generar fecha para el nombre del archivo
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Inventario_CatifyPro_${date}.xlsx`);
};
