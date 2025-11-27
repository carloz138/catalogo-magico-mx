import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { ProductForm, type ProductData } from "@/components/upload/ProductForm";
import { UploadedFile } from "@/components/upload/FileUploader";

interface ProductDraftCardProps {
  file: UploadedFile;
  index: number;
  initialData: ProductData;
  onUpdate: (index: number, data: ProductData) => void;
  onRemove: (index: number) => void;
}

export const ProductDraftCard = ({
  file,
  index,
  initialData,
  onUpdate,
  onRemove,
}: ProductDraftCardProps) => {
  // Estado local para evitar re-renderizados masivos en el padre al escribir
  const [localData, setLocalData] = useState<ProductData>(initialData);

  // Sincronizar si la data cambia externamente (ej: nombres automáticos)
  useEffect(() => {
    setLocalData(initialData);
  }, [initialData.name]);

  const handleChange = (newData: ProductData) => {
    setLocalData(newData);
    onUpdate(index, newData);
  };

  return (
    <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            
            {/* 1. VISUALIZADOR (Imagen y Estado) */}
            <div className="w-full md:w-64 h-64 md:h-auto bg-slate-100 relative shrink-0 border-b md:border-b-0 md:border-r border-slate-200">
              <img
                src={file.url || file.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay de estado */}
              <div className="absolute top-2 left-2">
                 <span className="bg-black/50 text-white text-xs px-2 py-1 rounded font-mono">
                    #{index + 1}
                 </span>
              </div>

              {/* Badge de estado inferior */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                 {file.uploading ? (
                    <span className="bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 backdrop-blur-md">
                      <Loader2 className="w-3 h-3 animate-spin" /> Subiendo...
                    </span>
                 ) : file.error ? (
                    <span className="bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 backdrop-blur-md">
                      <AlertCircle className="w-3 h-3" /> Error
                    </span>
                 ) : (
                    <span className="bg-emerald-500/90 text-white text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 backdrop-blur-md">
                       <CheckCircle2 className="w-3 h-3" /> 
                       {file.optimizedUrls ? "Optimizado" : "Listo"}
                    </span>
                 )}
              </div>
            </div>

            {/* 2. EDITOR (Formulario) */}
            <div className="flex-1 p-4 sm:p-6 relative">
              {/* Botón Eliminar */}
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8"
                  onClick={() => onRemove(index)}
                  title="Eliminar este producto"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Aquí insertamos tu formulario existente */}
              <div className="pr-8"> {/* Padding derecho para no chocar con el botón borrar */}
                <ProductForm 
                    product={localData}
                    imageUrl={file.url || file.preview}
                    onUpdate={handleChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
