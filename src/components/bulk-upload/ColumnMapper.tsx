import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

interface ColumnMapperProps {
  headers: string[];
  previewData: any[];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export const ColumnMapper = ({ headers, previewData, onConfirm, onCancel }: ColumnMapperProps) => {
  // Campos requeridos por tu sistema
  const requiredFields = [
    { key: 'name', label: 'Nombre del Producto *', required: true },
    { key: 'price', label: 'Precio (Menudeo) *', required: true },
    { key: 'sku', label: 'SKU', required: false },
    { key: 'description', label: 'Descripción', required: false },
    { key: 'category', label: 'Categoría', required: false },
    { key: 'wholesale_price', label: 'Precio Mayoreo', required: false },
  ];

  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleMapChange = (fieldKey: string, header: string) => {
    setMapping(prev => ({ ...prev, [fieldKey]: header }));
  };

  const isValid = requiredFields
    .filter(f => f.required)
    .every(f => mapping[f.key]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mapeo de Columnas</CardTitle>
        <p className="text-sm text-gray-500">Conecta las columnas de tu Excel con nuestros campos.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulario de Mapeo */}
            <div className="space-y-4">
                {requiredFields.map((field) => (
                    <div key={field.key} className="flex flex-col space-y-1.5">
                        <label className="text-sm font-medium">
                            {field.label}
                        </label>
                        <Select 
                            onValueChange={(val) => handleMapChange(field.key, val)}
                            // Intentar auto-detectar si el header se llama igual
                            defaultValue={headers.find(h => h.toLowerCase().includes(field.key.split('_')[0]))}
                        >
                            <SelectTrigger className={!mapping[field.key] && field.required ? "border-red-300" : ""}>
                                <SelectValue placeholder="Selecciona columna..." />
                            </SelectTrigger>
                            <SelectContent>
                                {headers.map(h => (
                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </div>

            {/* Previsualización de Datos */}
            <div className="border rounded-md overflow-hidden bg-gray-50">
                <div className="p-3 bg-gray-100 text-xs font-bold text-gray-500 border-b">
                    Vista previa de tu archivo (Primeras 3 filas)
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.slice(0, 3).map(h => <TableHead key={h} className="text-xs">{h}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {previewData.slice(0, 3).map((row, i) => (
                                <TableRow key={i}>
                                    {headers.slice(0, 3).map(h => (
                                        <TableCell key={h} className="text-xs text-gray-600 truncate max-w-[100px]">
                                            {String(row[h] || '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>Atrás</Button>
            <Button onClick={() => onConfirm(mapping)} disabled={!isValid} className="bg-blue-600">
                Confirmar Mapeo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};
