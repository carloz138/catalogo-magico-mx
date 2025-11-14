import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Package,
  Link as LinkIcon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Componentes y Hooks
import { ColumnMapper } from "@/components/bulk-upload/ColumnMapper";
import { useBulkMatching, type BulkProduct, type BulkImage } from "@/hooks/useBulkMatching";

export default function BulkUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { limits } = useCatalogLimits();

  const [step, setStep] = useState<"upload" | "mapping" | "matching" | "uploading">("upload");
  const [rawFile, setRawFile] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [images, setImages] = useState<BulkImage[]>([]);

  // Hook de Matching
  const { matches, setManualMatch, useDefaultImage, applyDefaultToAllUnmatched, stats } = useBulkMatching(
    products,
    images,
  );
  const [uploadProgress, setUploadProgress] = useState(0);

  // 1. LEER EXCEL
  const onFileDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        toast({ title: "Archivo vacío", variant: "destructive" });
        return;
      }
      const headersRow = jsonData[0] as string[];
      const dataRows = jsonData.slice(1).map((row: any) => {
        const obj: any = {};
        headersRow.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
      setHeaders(headersRow);
      setRawFile(dataRows);
      setStep("mapping");
    };
    reader.readAsBinaryString(file);
  }, []);

  // 2. LEER IMÁGENES (Función reutilizable para Paso 1 y Paso 3)
  const onImagesDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setImages((prev) => {
      const updated = [...prev, ...newImages];
      toast({
        title: "Imágenes agregadas",
        description: `Se añadieron ${newImages.length} imágenes. Buscando coincidencias...`,
      });
      return updated;
    });
  }, []);

  const { getRootProps: getFileProps, getInputProps: getFileInputProps } = useDropzone({
    onDrop: onFileDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] },
    maxFiles: 1,
  });

  // Dropzone principal (Paso 1)
  const { getRootProps: getImageProps, getInputProps: getImageInputProps } = useDropzone({
    onDrop: onImagesDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
  });

  // Dropzone secundario (Paso 3 - "Rescue Dropzone")
  const {
    getRootProps: getExtraImageProps,
    getInputProps: getExtraImageInputProps,
    isDragActive: isExtraDragActive,
  } = useDropzone({
    onDrop: onImagesDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    noClick: true, // Para que solo funcione el botón, no toda el área si no quieres
  });

  // 3. CONFIRMAR MAPEO
  const handleMappingConfirm = (mapping: Record<string, string>) => {
    const mappedProducts: BulkProduct[] = rawFile
      .map((row) => {
        const tagsRaw = row[mapping["tags"]];
        const tagsArray = tagsRaw
          ? String(tagsRaw)
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : [];

        return {
          id: crypto.randomUUID(),
          name: row[mapping["name"]],
          price: parseFloat(row[mapping["price"]] || "0"),
          sku: row[mapping["sku"]] || "",
          description: row[mapping["description"]] || "",
          category: row[mapping["category"]] || "",
          tags: tagsArray,
          originalData: row,
        };
      })
      .filter((p) => p.name && p.price > 0);

    const limitMax = (limits as any)?.maxUploads || 50;
    if (limits && mappedProducts.length > limitMax) {
      toast({
        title: "Límite excedido",
        description: `Tu plan permite subir ${limitMax} productos por lote.`,
        variant: "destructive",
      });
    }
    setProducts(mappedProducts);
    setStep("matching");
  };

  // 4. SUBIDA FINAL
  const handleFinalUpload = async () => {
    setStep("uploading");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let processed = 0;
    const total = matches.length;

    for (const match of matches) {
      try {
        let imageUrl = null;
        if (match.status === "default") {
          imageUrl = "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/product-images/placeholder.png";
        } else if (match.status === "matched" && match.image) {
          const fileExt = match.image.file.name.split(".").pop();
          const filePath = `${user.id}/${Date.now()}_${match.image.id}.${fileExt}`;
          await supabase.storage.from("product-images").upload(filePath, match.image.file);
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
          imageUrl = urlData.publicUrl;
        }

        if (imageUrl || match.status === "default") {
          await supabase.from("products").insert({
            user_id: user.id,
            name: match.product.name,
            price_retail: Math.round(match.product.price * 100),
            sku: match.product.sku,
            description: match.product.description,
            category: match.product.category,
            tags: match.product.tags,
            original_image_url: imageUrl,
            processing_status: "completed",
          });
        }
        processed++;
        setUploadProgress((processed / total) * 100);
      } catch (e) {
        console.error("Error subiendo producto", e);
      }
    }
    toast({ title: "¡Carga completada!", description: `Se procesaron ${processed} productos.` });
    setTimeout(() => navigate("/products"), 1000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate("/products")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <h1 className="text-3xl font-bold mb-2">Carga Masiva Inteligente</h1>
      <p className="text-gray-500 mb-8">Importa tu inventario desde Excel y nosotros organizamos las fotos.</p>

      {/* PASO 1: SUBIDA */}
      {step === "upload" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card
            {...getFileProps()}
            className="border-dashed border-2 hover:border-blue-500 cursor-pointer transition-colors"
          >
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <input {...getFileInputProps()} />
              <FileSpreadsheet className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold text-lg">Sube tu Excel o CSV</h3>
              <p className="text-sm text-gray-500 mt-2">Arrastra tu archivo aquí</p>
            </CardContent>
          </Card>

          <Card
            {...getImageProps()}
            className="border-dashed border-2 hover:border-blue-500 cursor-pointer transition-colors"
          >
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <input {...getImageInputProps()} />
              <div className="relative">
                <ImageIcon className="h-12 w-12 text-blue-600 mb-4" />
                {images.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {images.length}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg">Sube tus Fotos</h3>
              <p className="text-sm text-gray-500 mt-2">Arrastra todas las fotos juntas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PASO 2: MAPEO */}
      {step === "mapping" && (
        <ColumnMapper
          headers={headers}
          previewData={rawFile}
          onConfirm={handleMappingConfirm}
          onCancel={() => setStep("upload")}
        />
      )}

      {/* PASO 3: MATCHING CON SELECTOR MANUAL Y UPLOAD EXTRA */}
      {step === "matching" && (
        <div className="space-y-6">
          {/* 👇 ZONA DE CARGA DE IMÁGENES EXTRA (RESCUE DROPZONE) */}
          <div
            {...getExtraImageProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${isExtraDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
          >
            <input {...getExtraImageInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900">
                {images.length === 0 ? "¿Olvidaste las fotos? Súbelas aquí" : "¿Faltan imágenes? Agrega más"}
              </h3>
              <p className="text-sm text-gray-500">
                Arrastra las fotos aquí y el sistema intentará unirlas automáticamente.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Seleccionar archivos
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm sticky top-4 z-10">
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 font-bold text-green-700">
                <CheckCircle className="w-4 h-4" /> {stats.matched} Listos
              </span>
              <span className="flex items-center gap-1 font-bold text-orange-600">
                <AlertCircle className="w-4 h-4" /> {stats.unmatched} Sin foto
              </span>
            </div>
            <div className="flex gap-2">
              {stats.unmatched > 0 && (
                <Button variant="outline" size="sm" onClick={applyDefaultToAllUnmatched}>
                  <Package className="w-4 h-4 mr-2" />
                  Usar Default para todos
                </Button>
              )}
              <Button onClick={handleFinalUpload} className="bg-blue-600">
                Subir {matches.length} Productos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Card
                key={match.productId}
                className={`overflow-hidden flex flex-col ${match.status === "unmatched" ? "border-orange-300 bg-orange-50" : "border-green-200"}`}
              >
                {/* Área de Imagen */}
                <div className="h-48 bg-gray-100 relative flex items-center justify-center group">
                  {match.status === "matched" && match.image ? (
                    <img src={match.image.preview} className="w-full h-full object-contain" />
                  ) : match.status === "default" ? (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Package className="w-12 h-12 mb-2" />
                      <span className="text-xs">Imagen Default</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-orange-400 p-4 text-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-sm font-medium">Sin coincidencia</span>
                    </div>
                  )}

                  {/* Botón Flotante: Usar Default */}
                  {match.status !== "default" && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 shadow-sm"
                        title="Usar Default"
                        onClick={() => useDefaultImage(match.productId)}
                      >
                        <Package className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Área de Datos y Selector Manual */}
                <div className="p-3 flex-1 flex flex-col">
                  <div className="mb-3">
                    <h4 className="font-bold truncate" title={match.product.name}>
                      {match.product.name}
                    </h4>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="font-mono">${match.product.price}</span>
                      <span className="text-gray-500 text-xs truncate max-w-[100px]">{match.product.sku}</span>
                    </div>
                  </div>

                  {/* 👇 SELECTOR MANUAL DE IMAGEN 👇 */}
                  <div className="mt-auto">
                    <select
                      className="w-full text-xs border rounded p-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={match.image?.id || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setManualMatch(match.productId, e.target.value);
                        }
                      }}
                      disabled={images.length === 0} // Deshabilitado si no hay fotos
                    >
                      <option value="">
                        {images.length === 0 ? "🚫 Sube imágenes primero" : "-- Seleccionar imagen manual --"}
                      </option>
                      {images.map((img) => (
                        <option key={img.id} value={img.id}>
                          {img.name.length > 25 ? img.name.substring(0, 22) + "..." : img.name}
                        </option>
                      ))}
                    </select>

                    {match.matchMethod === "auto" && match.status === "matched" && (
                      <div className="mt-1 text-[10px] text-green-600 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Match automático
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PASO 4: PROGRESO */}
      {step === "uploading" && (
        <Card className="max-w-md mx-auto mt-20 p-8 text-center">
          <h3 className="text-xl font-bold mb-4">Subiendo Productos...</h3>
          <Progress value={uploadProgress} className="h-4 mb-2" />
          <p className="text-gray-500">{Math.round(uploadProgress)}% completado</p>
        </Card>
      )}
    </div>
  );
}
