import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVendors, useCurrentUserVendor } from "@/hooks/useVendors";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Package,
  Link as LinkIcon,
  RefreshCw,
  FileWarning,
  Download,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Componentes y Hooks
import { ColumnMapper } from "@/components/bulk-upload/ColumnMapper";
import { useBulkMatching, type BulkProduct, type BulkImage } from "@/hooks/useBulkMatching";
import { uploadImageToSupabase } from "@/utils/imageProcessing";

// Helper to parse boolean-like strings
const parseBooleanString = (val?: string): boolean => {
  if (!val) return false;
  const lower = val.toLowerCase().trim();
  return ['true', '1', 'yes', 'si', 'sí'].includes(lower);
};

// Helper to parse integer strings
const parseIntString = (val?: string, defaultVal = 0): number => {
  if (!val) return defaultVal;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

export default function BulkUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { limits } = useCatalogLimits();

  // Admin check from user metadata
  const isAdmin = user?.user_metadata?.role === "admin";

  // Vendor data
  const { data: vendors = [], isLoading: loadingVendors } = useVendors(isAdmin);
  const { data: currentUserVendor, refetch: refetchVendor } = useCurrentUserVendor();

  // Selected vendor for upload
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [autoCreatingVendor, setAutoCreatingVendor] = useState(false);

  // Auto-create vendor for non-admins if they don't have one
  useEffect(() => {
    const autoCreateVendor = async () => {
      if (isAdmin || !user || currentUserVendor || autoCreatingVendor) return;
      
      // Check if we already tried (currentUserVendor is explicitly null, not undefined/loading)
      if (currentUserVendor === undefined) return;

      setAutoCreatingVendor(true);
      try {
        // Try to get business name from business_info
        const { data: bizInfo } = await supabase
          .from("business_info")
          .select("business_name")
          .eq("user_id", user.id)
          .maybeSingle();

        const vendorName = bizInfo?.business_name || user.email?.split("@")[0] || "Mi Negocio";
        const slug = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const { data: newVendor, error } = await supabase
          .from("vendors")
          .insert({
            name: vendorName,
            slug: `${slug}-${Date.now().toString(36)}`,
            owner_id: user.id,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error("Error auto-creating vendor:", error);
          toast({ title: "Error creando vendor automático", description: error.message, variant: "destructive" });
        } else if (newVendor) {
          setSelectedVendorId(newVendor.id);
          refetchVendor();
          console.log("✅ Vendor auto-creado:", newVendor.name);
        }
      } catch (err) {
        console.error("Error in auto-create vendor:", err);
      } finally {
        setAutoCreatingVendor(false);
      }
    };

    autoCreateVendor();
  }, [isAdmin, user, currentUserVendor, autoCreatingVendor, refetchVendor, toast]);

  // Auto-set vendor for non-admins when vendor exists
  useEffect(() => {
    if (!isAdmin && currentUserVendor) {
      setSelectedVendorId(currentUserVendor.id);
    }
  }, [isAdmin, currentUserVendor]);

  // Estados del flujo
  const [step, setStep] = useState<"vendor" | "upload" | "mapping" | "matching" | "uploading" | "finished">(
    isAdmin ? "vendor" : "upload"
  );

  // Datos
  const [rawFile, setRawFile] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [images, setImages] = useState<BulkImage[]>([]);

  // Estados visuales y de reporte
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failedReport, setFailedReport] = useState<any[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  // SKU duplicates check state
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());

  // Hook de Matching
  const { matches, setManualMatch, useDefaultImage, applyDefaultToAllUnmatched } = useBulkMatching(products, images);

  // Fetch existing SKUs for the selected vendor
  useEffect(() => {
    const fetchExistingSkus = async () => {
      if (!selectedVendorId) {
        setExistingSkus(new Set());
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("sku")
        .eq("vendor_id", selectedVendorId)
        .not("sku", "is", null);

      if (!error && data) {
        setExistingSkus(new Set(data.map(p => p.sku?.toLowerCase() || "")));
      }
    };

    fetchExistingSkus();
  }, [selectedVendorId]);

  // Get selected vendor name for display
  const selectedVendorName = useMemo(() => {
    if (!isAdmin && currentUserVendor) return currentUserVendor.name;
    const vendor = vendors.find(v => v.id === selectedVendorId);
    return vendor?.name || "Sin seleccionar";
  }, [isAdmin, currentUserVendor, vendors, selectedVendorId]);

  // 1. LEER EXCEL
  const onFileDrop = useCallback(
    (acceptedFiles: File[]) => {
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
    },
    [toast],
  );

  // 2. LEER IMÁGENES (Con Feedback de Carga)
  const onImagesDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsProcessingImages(true);
      toast({
        title: `Procesando ${acceptedFiles.length} imágenes...`,
        description: "Buscando coincidencias, esto puede tardar...",
      });

      setTimeout(() => {
        const newImages = acceptedFiles.map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        }));

        setImages((prev) => [...prev, ...newImages]);
      }, 50);
    },
    [toast],
  );

  // Hook: Se dispara cuando 'useBulkMatching' termina
  useEffect(() => {
    if (isProcessingImages) {
      setIsProcessingImages(false);
      toast({
        title: "¡Coincidencias listas!",
        description: "Las imágenes se han procesado.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  // DROPZONE 1: Excel
  const { getRootProps: getFileProps, getInputProps: getFileInputProps } = useDropzone({
    onDrop: onFileDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"] },
    maxFiles: 1,
  });

  // DROPZONE 2: Imágenes Principal
  const { getRootProps: getImageProps, getInputProps: getImageInputProps } = useDropzone({
    onDrop: onImagesDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    disabled: isProcessingImages,
  });

  // DROPZONE 3: Imágenes Extra "Rescue"
  const {
    getRootProps: getExtraImageProps,
    getInputProps: getExtraImageInputProps,
    isDragActive: isExtraDragActive,
    open: openExtraFileDialog,
  } = useDropzone({
    onDrop: onImagesDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    noClick: true,
    disabled: isProcessingImages,
  });

  // 3. CONFIRMAR MAPEO (with SKU duplicate check)
  const handleMappingConfirm = (mapping: Record<string, string>) => {
    const skuDuplicates: string[] = [];
    
    const mappedProducts: BulkProduct[] = rawFile
      .map((row) => {
        const tagsRaw = row[mapping["tags"]];
        const tagsArray = tagsRaw
          ? String(tagsRaw)
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : [];

        const sku = row[mapping["sku"]] || "";
        
        // Check for SKU duplicates within vendor scope
        if (sku && existingSkus.has(sku.toLowerCase())) {
          skuDuplicates.push(sku);
        }

        return {
          id: crypto.randomUUID(),
          name: row[mapping["name"]],
          price: parseFloat(row[mapping["price"]] || "0"),
          sku: sku,
          description: row[mapping["description"]] || "",
          category: row[mapping["category"]] || "",
          tags: tagsArray,
          // Extended fields
          allow_backorder: parseBooleanString(row[mapping["allow_backorder"]]),
          lead_time_days: parseIntString(row[mapping["lead_time_days"]], 0),
          originalData: row,
        };
      })
      .filter((p) => p.name && p.price > 0);

    if (mappedProducts.length === 0) {
      toast({ title: "No se encontraron productos válidos", variant: "destructive" });
      return;
    }

    // Warn about duplicates but allow to continue
    if (skuDuplicates.length > 0) {
      toast({
        title: `⚠️ SKUs duplicados detectados`,
        description: `${skuDuplicates.length} SKU(s) ya existen para este vendor: ${skuDuplicates.slice(0, 3).join(", ")}${skuDuplicates.length > 3 ? "..." : ""}`,
        variant: "destructive",
        duration: 6000,
      });
    }

    const maxUploads = limits?.maxUploads || 50;
    if (maxUploads !== "unlimited") {
      if (mappedProducts.length > (maxUploads as number)) {
        toast({
          title: "Límite del Plan Excedido",
          description: `Tu plan permite subir máximo ${maxUploads} productos. Estás intentando subir ${mappedProducts.length}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setProducts(mappedProducts);
    setStep("matching");
  };

  // 4. SUBIDA FINAL (WITH VENDOR_ID & BACKORDER FIELDS)
  const handleFinalUpload = async () => {
    const unmatchedCount = matches.filter((m) => m.status === "unmatched").length;
    if (unmatchedCount > 0) {
      toast({
        title: `⚠️ Tienes ${unmatchedCount} productos sin imagen`,
        description: "Se omitirán de la carga. Asígnales 'Default' si quieres subirlos.",
        variant: "destructive",
        duration: 6000,
      });
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      toast({ title: "Error de sesión", description: "No se encontró usuario activo", variant: "destructive" });
      return;
    }

    // vendor_id is optional - admin can upload without a vendor

    setStep("uploading");
    const BATCH_SIZE = 3;
    const PLACEHOLDER_URL =
      "https://ikbexcebcpmomfxraflz.supabase.co/storage/v1/object/public/product-images/placeholder.png";

    let processedCount = 0;
    const total = matches.length;
    const localFailedItems: any[] = [];
    let localSuccessCount = 0;

    for (let i = 0; i < matches.length; i += BATCH_SIZE) {
      const batch = matches.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (match) => {
          try {
            if (match.status === "unmatched") {
              localFailedItems.push({
                ...match.product.originalData,
                ERROR_REASON: "No se asignó imagen y no se seleccionó Default",
              });
              return null;
            }

            let imageUrls = {
              original: PLACEHOLDER_URL,
              thumb: PLACEHOLDER_URL,
              catalog: PLACEHOLDER_URL,
              luxury: PLACEHOLDER_URL,
              print: PLACEHOLDER_URL,
            };

            if (match.status === "matched" && match.image) {
              const fileExt = match.image.file.name.split(".").pop();
              const rawFilePath = `${authUser.id}/${Date.now()}_${match.image.id}.${fileExt}`;

              await supabase.storage.from("product-images").upload(rawFilePath, match.image.file);
              const { data: rawUrlData } = supabase.storage.from("product-images").getPublicUrl(rawFilePath);
              imageUrls.original = rawUrlData.publicUrl;

              try {
                const optimizedUrls = await uploadImageToSupabase(
                  supabase,
                  match.productId,
                  match.image.file,
                  match.image.name,
                );
                imageUrls.thumb = optimizedUrls.thumbnail;
                imageUrls.catalog = optimizedUrls.catalog;
                imageUrls.luxury = optimizedUrls.luxury;
                imageUrls.print = optimizedUrls.print;
              } catch (optError) {
                console.error("Fallo optimización, usando fallback", optError);
                imageUrls.thumb = imageUrls.original;
                imageUrls.catalog = imageUrls.original;
                imageUrls.luxury = imageUrls.original;
                imageUrls.print = imageUrls.original;
              }
            }

            // Extended product with BulkProduct type
            const product = match.product as BulkProduct & { 
              allow_backorder?: boolean; 
              lead_time_days?: number; 
            };

            return {
              id: match.productId,
              user_id: authUser.id,
              vendor_id: selectedVendorId || undefined, // Optional: Multi-vendor support
              name: product.name,
              price_retail: Math.round(product.price * 100),
              sku: product.sku,
              description: product.description,
              category: product.category,
              tags: product.tags,
              // 🔥 NEW: Backorder fields
              allow_backorder: product.allow_backorder ?? false,
              lead_time_days: product.lead_time_days ?? 0,
              // Image URLs
              original_image_url: imageUrls.original,
              thumbnail_image_url: imageUrls.thumb,
              catalog_image_url: imageUrls.catalog,
              luxury_image_url: imageUrls.luxury,
              print_image_url: imageUrls.print,
              processing_status: "completed",
              _originalData: product.originalData,
            };
          } catch (e) {
            console.error(`Error procesando producto ${match.product.name}:`, e);
            localFailedItems.push({
              ...match.product.originalData,
              ERROR_REASON: "Error interno al procesar imagen",
            });
            return null;
          }
        }),
      );

      const validProductsToInsert = batchResults.filter((p) => p !== null);

      if (validProductsToInsert.length > 0) {
        const dbPayload = validProductsToInsert.map(({ _originalData, ...rest }) => rest);
        const { error: insertError } = await supabase.from("products").insert(dbPayload);

        if (insertError) {
          validProductsToInsert.forEach((p: any) => {
            localFailedItems.push({
              ...p._originalData,
              ERROR_REASON: `Error Base de Datos: ${insertError.message}`,
            });
          });
        } else {
          localSuccessCount += validProductsToInsert.length;
        }
      }
      processedCount += batch.length;
      setUploadProgress((processedCount / total) * 100);
    }

    setFailedReport(localFailedItems);
    setSuccessCount(localSuccessCount);
    setStep("finished");
  };

  const downloadErrorReport = () => {
    if (failedReport.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(failedReport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errores de Carga");
    XLSX.writeFile(wb, `reporte_errores_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Handle vendor selection (Admin only)
  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setStep("upload");
  };

  // Handle "use current user" when no vendors exist (Admin)
  const handleUseCurrentUser = () => {
    setSelectedVendorId(null); // No vendor, will upload without vendor_id
    setStep("upload");
  };

  return (
    <div className="container mx-auto py-8 px-4 relative">
      {/* OVERLAY DE PÁGINA COMPLETA */}
      {isProcessingImages && (
        <div className="absolute inset-0 bg-white/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm rounded-lg -m-8">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="font-semibold text-blue-700 text-lg">Procesando Imágenes...</p>
          <p className="text-sm text-gray-500">Creando vistas previas y buscando coincidencias...</p>
        </div>
      )}

      {step !== "finished" && (
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      )}

      <h1 className="text-3xl font-bold mb-2">Carga Masiva Inteligente</h1>

      {step !== "finished" && (
        <p className="text-gray-500 mb-8">Importa tu inventario desde Excel y nosotros organizamos las fotos.</p>
      )}

      {/* PASO 0: SELECCIÓN DE VENDOR (Solo Admin) */}
      {step === "vendor" && isAdmin && (
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-100 rounded-full">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Modo Administrador</h2>
                <p className="text-sm text-muted-foreground">
                  Selecciona el vendor al que pertenecerán estos productos
                </p>
              </div>
            </div>

            {loadingVendors ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : vendors.length === 0 ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sin vendors registrados</AlertTitle>
                  <AlertDescription>
                    No hay vendors activos en el sistema. Puedes continuar subiendo productos con tu usuario actual.
                  </AlertDescription>
                </Alert>
                <Button className="w-full" onClick={() => handleUseCurrentUser()}>
                  <Upload className="mr-2 h-4 w-4" /> Continuar con mi usuario
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Vendor destino</label>
                  <Select onValueChange={handleVendorSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un vendor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{vendor.name}</span>
                            {vendor.slug && (
                              <span className="text-xs text-muted-foreground">({vendor.slug})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vendor Badge (visible after selection) */}
      {selectedVendorId && step !== "vendor" && step !== "finished" && (
        <div className="mb-6 flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 w-fit">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vendor:</span>
          <span className="text-sm text-primary">{selectedVendorName}</span>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 px-2 text-xs"
              onClick={() => setStep("vendor")}
            >
              Cambiar
            </Button>
          )}
        </div>
      )}

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

      {/* PASO 3: MATCHING */}
      {step === "matching" && (
        <div className="space-y-6">
          <div
            {...getExtraImageProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isExtraDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            } ${isProcessingImages ? "opacity-50 cursor-not-allowed" : ""}`}
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

              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                type="button"
                onClick={openExtraFileDialog}
                disabled={isProcessingImages}
              >
                Seleccionar archivos
              </Button>
            </div>
          </div>

          {/* BARRA DE ESTADO */}
          {(() => {
            const countMatched = matches.filter((m) => m.status === "matched").length;
            const countDefault = matches.filter((m) => m.status === "default").length;
            const countUnmatched = matches.filter((m) => m.status === "unmatched").length;
            const total = matches.length;

            return (
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm sticky top-4 z-10">
                <div className="flex gap-4 text-sm items-center flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-green-700" title="Tienen foto asignada">
                    <CheckCircle className="w-4 h-4" /> {countMatched} Con Foto
                  </span>
                  <span className="flex items-center gap-1 font-bold text-gray-600" title="Usarán la imagen genérica">
                    <Package className="w-4 h-4" /> {countDefault} Default
                  </span>
                  <span
                    className={`flex items-center gap-1 font-bold ${countUnmatched > 0 ? "text-orange-600" : "text-gray-400"}`}
                  >
                    <AlertCircle className="w-4 h-4" /> {countUnmatched} Sin foto
                  </span>
                  <span className="text-xs text-gray-400 border-l pl-4 ml-2">Total: {total}</span>
                </div>

                <div className="flex gap-2">
                  {countUnmatched > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyDefaultToAllUnmatched}
                      disabled={isProcessingImages}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Usar Default en {countUnmatched}
                    </Button>
                  )}
                  <Button
                    onClick={handleFinalUpload}
                    className="bg-blue-600"
                    disabled={isProcessingImages || total === 0}
                  >
                    Subir {total} Productos
                  </Button>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Card
                key={match.productId}
                className={`overflow-hidden flex flex-col ${match.status === "unmatched" ? "border-orange-300 bg-orange-50" : "border-green-200"}`}
              >
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

                  {match.status !== "default" && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 shadow-sm"
                        title="Usar Default"
                        onClick={() => useDefaultImage(match.productId)}
                        disabled={isProcessingImages}
                      >
                        <Package className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <div className="mb-3">
                    <h4 className="font-bold truncate" title={match.product.name}>
                      {match.product.name}
                    </h4>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="font-mono">${match.product.price}</span>
                      <span className="text-gray-500 text-xs truncate max-w-[100px]">{match.product.sku}</span>
                    </div>
                    {/* Show backorder badge if enabled */}
                    {(match.product as any).allow_backorder && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                        Backorder ({(match.product as any).lead_time_days}d)
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold mb-1 block">
                      Asignar Imagen:
                    </label>
                    {images.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 max-h-28 overflow-y-auto rounded border p-1 bg-muted/30">
                        {images
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              className={`relative aspect-square rounded overflow-hidden border-2 transition-all touch-manipulation ${
                                match.image?.id === img.id
                                  ? "border-primary ring-2 ring-primary/30"
                                  : "border-transparent hover:border-primary/40"
                              }`}
                              onClick={() => setManualMatch(match.productId, img.id)}
                              disabled={isProcessingImages}
                              title={img.name}
                            >
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {match.image?.id === img.id && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-primary drop-shadow" />
                                </div>
                              )}
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">🚫 Sin imágenes disponibles</p>
                    )}

                    {match.status === "matched" && match.matchMethod === "auto" && (
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
          <div className="mb-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2 mt-10">Procesando Catálogo...</h3>
          <p className="text-sm text-gray-500 mb-6">Optimizando imágenes y generando versiones...</p>
          <Progress value={uploadProgress} className="h-4 mb-2" />
          <p className="text-xs text-gray-400">{Math.round(uploadProgress)}% completado</p>
        </Card>
      )}

      {/* PASO 5: RESULTADO FINAL */}
      {step === "finished" && (
        <Card className="max-w-2xl mx-auto mt-10 border-t-4 border-t-blue-600 shadow-lg">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-6">
            {failedReport.length === 0 ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">¡Carga Completada con Éxito!</h2>
                  <p className="text-gray-500 mt-2">Se han subido {successCount} productos correctamente.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <FileWarning className="w-10 h-10 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Carga Parcialmente Completada</h2>
                  <p className="text-gray-600 mt-2">
                    Se subieron <span className="font-bold text-green-600">{successCount} productos</span> exitosamente.
                  </p>
                  <p className="text-red-600 font-medium mt-1">
                    {failedReport.length} productos no se pudieron cargar.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 w-full text-left text-sm">
                  <p className="font-semibold text-orange-800 mb-2">¿Qué pasó?</p>
                  <p className="text-orange-700">
                    Algunos productos no tenían imagen asignada o hubo un error de conexión. Descarga el reporte, revisa
                    la columna <strong>"ERROR_REASON"</strong>, corrige el archivo y vuélvelo a subir.
                  </p>
                </div>

                <Button
                  onClick={downloadErrorReport}
                  className="w-full md:w-auto gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Download className="w-4 h-4" />
                  Descargar Reporte de Errores (.xlsx)
                </Button>
              </>
            )}

            <div className="flex gap-3 mt-6 w-full justify-center">
              <Button variant="outline" onClick={() => navigate("/products")}>
                Ir a Mis Productos
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Cargar otro archivo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
