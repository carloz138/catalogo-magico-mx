import React, { useState, useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  RowSelectionState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; // ✅ IMPORTANTE
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, Edit2, Eye, ArrowUpDown, Package, Layers, Archive, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/products";
import { useCatalogLimits } from "@/hooks/useCatalogLimits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- TIPOS ---
type EditorProduct = Product & {
  processing_status?: string;
  stock_quantity?: number;
  allow_backorder?: boolean;
};

// --- COMPONENTE DE CELDA EDITABLE ---
const EditableCell = ({ getValue, row, column, table, type = "text" }: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    if (value != initialValue) {
      table.options.meta?.updateData(row.index, column.id, value);
    }
  };

  if (isEditing) {
    return (
      <Input
        type={type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") onBlur();
        }}
        autoFocus
        className="h-8 text-sm bg-white shadow-sm border-blue-500 w-full min-w-[60px]"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded flex items-center min-h-[32px] group w-full"
      title="Clic para editar"
    >
      <span className="truncate block w-full text-sm">
        {value !== null && value !== undefined ? value : <span className="text-gray-300 text-xs">-</span>}
      </span>
      <Edit2 className="w-3 h-3 ml-auto text-gray-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
    </div>
  );
};

// --- COMPONENTE DE SELECCIÓN DE CATEGORÍA ---
const CategoryCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const categories = ["ropa", "calzado", "electronica", "joyeria", "fiestas", "floreria", "general"];

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
    table.options.meta?.updateData(row.index, column.id, e.target.value);
  };

  return (
    <select
      value={value || ""}
      onChange={onChange}
      className="h-8 text-sm bg-transparent border-none hover:bg-gray-100 rounded cursor-pointer w-full focus:ring-0 text-slate-600"
    >
      <option value="">Sin categoría</option>
      {categories.map((c) => (
        <option key={c} value={c}>
          {c.charAt(0).toUpperCase() + c.slice(1)}
        </option>
      ))}
    </select>
  );
};

// --- COMPONENTE PRINCIPAL ---
interface ProductsTableEditorProps {
  externalProducts: EditorProduct[];
  onProductsChange: (products: EditorProduct[]) => void;
  onEditVariants: (id: string) => void;
  onViewProduct: (id: string) => void;
  className?: string;
  onBulkDelete?: (ids: string[]) => void;
  onBulkCatalog?: (ids: string[]) => void;
}

export default function ProductsTableEditor({
  externalProducts = [],
  onProductsChange,
  onEditVariants,
  onViewProduct,
  onBulkDelete,
  onBulkCatalog,
  className,
}: ProductsTableEditorProps) {
  const [data, setData] = useState(externalProducts);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const { canGenerate } = useCatalogLimits();

  useEffect(() => {
    setData(externalProducts);
  }, [externalProducts]);

  // Función para guardar cambios (Optimistic UI + Supabase)
  const updateData = async (rowIndex: number, columnId: string, value: any) => {
    const oldData = [...data];
    const product = data[rowIndex];

    // 1. Optimistic Update
    setData((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return { ...old[rowIndex], [columnId]: value };
        }
        return row;
      }),
    );

    // 2. Notificar al padre
    onProductsChange?.(data);

    // 3. Guardar en Supabase
    try {
      let dbValue = value;

      // Conversiones de tipo
      if (columnId === "price_retail" || columnId === "price_wholesale") {
        dbValue = Math.round(parseFloat(value) * 100); // Centavos
      } else if (columnId === "wholesale_min_qty" || columnId === "stock_quantity") {
        dbValue = parseInt(value) || 0;
      }
      // allow_backorder es boolean, pasa directo

      const { error } = await supabase
        .from("products")
        .update({ [columnId]: dbValue })
        .eq("id", product.id);

      if (error) throw error;
      toast({ title: "Guardado", description: "Actualizado correctamente", duration: 1000 });
    } catch (error) {
      console.error(error);
      setData(oldData); // Revertir
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" });
    }
  };

  const columnHelper = createColumnHelper<EditorProduct>();

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }: any) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.accessor("original_image_url", {
        header: "Img",
        cell: (info) => (
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-50 border shrink-0">
            {info.getValue() ? (
              <img src={info.getValue() || ""} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package size={16} />
              </div>
            )}
          </div>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8"
          >
            Producto <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        ),
        cell: EditableCell,
      }),
      columnHelper.accessor("category", {
        header: "Categoría",
        cell: CategoryCell,
      }),
      // ✅ NUEVO: STOCK (Inventario)
      columnHelper.accessor("stock_quantity", {
        header: "Stock",
        cell: ({ row, getValue, column, table }) => (
          <EditableCell getValue={getValue} row={row} column={column} table={table} type="number" />
        ),
      }),
      // ✅ NUEVO: BACKORDER (Preventa)
      columnHelper.accessor("allow_backorder", {
        header: () => (
          <div className="flex items-center gap-1 cursor-help" title="¿Permitir vender cuando el stock llegue a 0?">
            Preventa
            <AlertCircle className="w-3 h-3 text-slate-400" />
          </div>
        ),
        cell: ({ row, getValue, column, table }) => {
          const val = getValue();
          return (
            <div className="flex justify-center">
              <Switch
                checked={!!val}
                onCheckedChange={(checked) => table.options.meta?.updateData(row.index, column.id, checked)}
                className="scale-75 data-[state=checked]:bg-indigo-600"
              />
            </div>
          );
        },
      }),
      columnHelper.accessor("price_retail", {
        header: "P. Público",
        cell: ({ row, getValue, column, table }) => {
          const val = getValue();
          const displayVal = val ? (val / 100).toFixed(2) : "0.00";
          return <EditableCell getValue={() => displayVal} row={row} column={column} table={table} type="number" />;
        },
      }),
      columnHelper.accessor("price_wholesale", {
        header: "P. Mayoreo",
        cell: ({ row, getValue, column, table }) => {
          const val = getValue();
          const displayVal = val ? (val / 100).toFixed(2) : "0.00";
          return <EditableCell getValue={() => displayVal} row={row} column={column} table={table} type="number" />;
        },
      }),
      {
        id: "actions",
        header: "",
        cell: ({ row }: any) => {
          const product = row.original;
          return (
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onViewProduct?.(product.id)}>
                <Eye className="w-4 h-4 text-gray-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditVariants?.(product.id)}>
                <Layers className="w-4 h-4 text-blue-500" />
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      rowSelection,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    meta: {
      updateData,
    } as any,
  });

  const selectedIds = Object.keys(rowSelection).map((index) => data[parseInt(index)].id);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de Herramientas */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, SKU..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-gray-500">{table.getFilteredRowModel().rows.length} productos</div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium align-middle whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-blue-50/30 transition-colors group ${row.getIsSelected() ? "bg-blue-50" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <span className="text-xs text-gray-500 mr-4">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Siguiente
        </Button>
      </div>

      {/* Barra Flotante de Acciones */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 border border-gray-700">
          <div className="flex items-center gap-2 pl-2 border-r border-gray-700 pr-4">
            <span className="bg-white text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium">items</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={`h-8 hover:bg-gray-800 ${!canGenerate ? "opacity-50 cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-white"}`}
              onClick={() => canGenerate && onBulkCatalog?.(selectedIds)}
              disabled={!canGenerate}
            >
              <Package className="w-3.5 h-3.5 mr-1.5" />
              {canGenerate ? "Crear Catálogo" : "Límite"}
            </Button>

            <div className="w-px h-4 bg-gray-700 mx-1"></div>

            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 h-8"
              onClick={() => onBulkDelete?.(selectedIds)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Eliminar
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-gray-800 text-gray-400"
            onClick={() => table.toggleAllRowsSelected(false)}
          >
            <alert-circle className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
