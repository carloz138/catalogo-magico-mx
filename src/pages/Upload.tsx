import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileUploader, type UploadedFile } from "@/components/upload/FileUploader";
import { ProductDraftCard } from "@/components/upload/ProductDraftCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PackageCheck, Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { FinalStepComponent } from "@/components/upload/FinalStepComponent";
import { type ProductData } from "@/components/upload/ProductForm";

const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledName = searchParams.get("name");

  // --- ESTADO UNIFICADO ---
  // Mantenemos sincronizados los archivos (progreso) y los datos (texto)
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [productsData, setProductsData] = useState<ProductData[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // --- 1. AL RECIBIR ARCHIVOS NUEVOS ---
  const handleFilesUploaded = (newFiles: UploadedFile[]) => {
    // Filtramos para no agregar duplicados si el usuario arrastra los mismos
    const currentIds = new Set(files.map((f) => f.id));
    const distinctNewFiles = newFiles.filter((f) => !currentIds.has(f.id));

    if (distinctNewFiles.length === 0) return;

    // Generamos la data inicial para cada nuevo archivo
    const newProductsData: ProductData[] = distinctNewFiles.map((file, i) => {
      // Lógica de nombre inteligente
      let initialName = "";

      // Si venimos del Radar (prefilledName) y es la primera carga
      if (prefilledName && files.length === 0 && i === 0) {
        initialName = prefilledName;
      } else {
        // Limpieza del nombre de archivo: "zapatos_rojos_v2.jpg" -> "Zapatos rojos v2"
        const cleanName = file.file.name.split(".")[0].replace(/[-_]/g, " ");
        initialName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }

      return {
        id: file.id, // Enlace clave entre archivo y datos
        name: initialName,
        sku: "",
        price_retail: 0,
        price_wholesale: 0,
        wholesale_min_qty: 12,
        category: "",
        custom_description: "",
        original_image_url: file.url || file.preview,
        tags: [],
        // Inicializamos análisis vacío, si el componente FileUploader lo genera después, lo actualizaremos
        smart_analysis: undefined,
      };
    });

    setFiles((prev) => [...prev, ...distinctNewFiles]);
    setProductsData((prev) => [...prev, ...newProductsData]);

    toast({
      title: "Productos agregados",
      description: `Se han añadido ${distinctNewFiles.length} borrador(es) a la lista.`,
    });
  };

  // --- 2. MANEJO DE CAMBIOS ---

  // Actualizar datos del formulario
  const handleProductUpdate = (index: number, newData: ProductData) => {
    setProductsData((prev) => {
      const next = [...prev];
      next[index] = newData;
      return next;
    });
  };

  // Actualizar datos que vienen del FileUploader (ej: URLs finales, Analysis)
  // Esto es un truco para mantener sincronizado si el uploader termina tarde
  useEffect(() => {
    if (files.length === 0) return;

    setProductsData((currentData) => {
      return currentData.map((prod) => {
        const matchingFile = files.find((f) => f.id === prod.id);
        if (matchingFile && matchingFile.url && matchingFile.url !== prod.original_image_url) {
          // Si la URL cambió (se terminó de subir), actualizamos la data
          return { ...prod, original_image_url: matchingFile.url };
        }
        return prod;
      });
    });
  }, [files]);

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setProductsData((prev) => prev.filter((_, i) => i !== index));
  };

  // --- 3. GUARDADO FINAL ---
  const handleSaveAll = async () => {
    // Validación: Nombres obligatorios
    const invalidCount = productsData.filter((p) => !p.name.trim()).length;
    if (invalidCount > 0) {
      toast({
        title: "Faltan datos",
        description: `Asigna un nombre a los ${invalidCount} productos marcados antes de guardar.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Aquí normalmente harías el POST a tu API.
    // Como tu `FinalStepComponent` maneja la lógica final, pasamos al estado "Finished"
    // Simulamos un pequeño delay para feedback visual
    setTimeout(() => {
      setIsSaving(false);
      setIsFinished(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1000);
  };

  // --- VISTA: FINALIZADO ---
  if (isFinished) {
    // Fusionamos archivo + data para el componente final
    const mergedFiles = files.map((f, i) => ({ ...f, productData: productsData[i] }));

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setIsFinished(false)} className="mb-6 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a editar
        </Button>
        <FinalStepComponent files={mergedFiles} />
      </div>
    );
  }

  // --- VISTA: DASHBOARD DE CARGA ---
  const totalFiles = files.length;
  const pendingUploads = files.filter((f) => f.uploading).length;
  // Calculamos progreso global visual
  const globalProgress =
    totalFiles > 0 ? Math.round((files.reduce((acc, f) => acc + f.progress, 0) / (totalFiles * 100)) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {" "}
      {/* Padding extra abajo para el footer */}
      {/* 1. HEADER & UPLOADER */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30 transition-all">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {prefilledName ? `Cargando: ${prefilledName}` : "Carga Rápida"}
                {totalFiles > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-sm px-2 py-0.5 rounded-full">{totalFiles}</span>
                )}
              </h1>
              <p className="text-sm text-slate-500">
                {totalFiles === 0
                  ? "Arrastra tus fotos para empezar."
                  : pendingUploads > 0
                    ? `Subiendo ${pendingUploads} imágenes...`
                    : "Todo listo para publicar."}
              </p>
            </div>

            {/* Barra de progreso global (Solo desktop) */}
            {totalFiles > 0 && (
              <div className="hidden md:block w-64">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progreso de carga</span>
                  <span>{globalProgress}%</span>
                </div>
                <Progress value={globalProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* AREA DE DROP (Siempre visible pero discreta si ya hay archivos) */}
          <div
            className={`transition-all duration-500 ${totalFiles > 0 ? "scale-95 opacity-90" : "scale-100 opacity-100"}`}
          >
            <FileUploader
              onFilesUploaded={handleFilesUploaded}
              maxFiles={50} // Límite generoso
            />
          </div>
        </div>
      </div>
      {/* 2. MURO DE TRABAJO (GRID) */}
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {totalFiles > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {files.map((file, index) => (
              <ProductDraftCard
                key={file.id}
                index={index}
                file={file}
                initialData={productsData[index]}
                onUpdate={handleProductUpdate}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          // Estado vacío ilustrativo
          <div className="text-center py-20 opacity-40 select-none">
            <PackageCheck className="w-24 h-24 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-medium text-slate-400">Tus productos aparecerán aquí</p>
          </div>
        )}
      </div>
      {/* 3. STICKY FOOTER (BARRA FLOTANTE INFERIOR) */}
      {totalFiles > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {/* Info Izquierda (Oculta en móvil muy pequeño) */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              {pendingUploads > 0 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Esperando que terminen de subir {pendingUploads} fotos...</span>
                </>
              ) : (
                <span>✨ Todo listo para guardar</span>
              )}
            </div>

            {/* Botones Derecha */}
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm("¿Borrar todo y empezar de cero?")) {
                    setFiles([]);
                    setProductsData([]);
                  }
                }}
                className="flex-1 sm:flex-none border-slate-300 text-slate-600"
              >
                Limpiar
              </Button>

              <Button
                onClick={handleSaveAll}
                disabled={isSaving || pendingUploads > 0}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none min-w-[200px] shadow-lg shadow-blue-200"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" /> Publicar {totalFiles} Productos
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
