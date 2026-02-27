import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  RowSelectionState,
  ColumnDef,
} from "@tanstack/react-table";
import { ProductWithUI, PRODUCT_CATEGORIES } from "@/types/products";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Search, Trash2, X, Loader2, GitBranch, Layers, Tag, Hash, Clock, DollarSign } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { motion, AnimatePresence } from "framer-motion";


// --- COMPONENTE INTERNO: TARJETA MÓVIL ---
const MobileProductRow = ({ row, table }: { row: any; table: any }) => {
  const product = row.original;
  const isSelected = row.getIsSelected();

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
        isSelected ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10" : "border-slate-200"
      }`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-3">
          <Checkbox checked={isSelected} onCheckedChange={(val) => row.toggleSelected(!!val)} />
          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 shrink-0">
            <img
              src={product.processed_image_url || product.original_image_url || ""}
              className="w-full h-full object-cover mix-blend-multiply"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <EditableCell
              row={row}
              table={table}
              column={{ id: "name" }}
              getValue={() => product.name}
              className="font-semibold text-slate-900 mb-1 h-auto py-0 px-0 hover:bg-transparent"
            />
            <div className="flex gap-2 mt-1">
              <div className="bg-slate-50 rounded px-1 flex items-center">
                <span className="text-[10px] text-slate-400 mr-1">#</span>
                <EditableCell
                  row={row}
                  table={table}
                  column={{ id: "sku" }}
                  getValue={() => product.sku}
                  className="text-xs font-mono text-slate-500 h-6 p-0 bg-transparent hover:bg-transparent"
                />
              </div>
              <EditableCell
                row={row}
                table={table}
                column={{ id: "category" }}
                type="select"
                getValue={() => product.category}
                className="text-xs text-indigo-600 bg-indigo-50 w-auto px-2 rounded-full h-6"
              />
            </div>
          </div>
          <div>
            <EditableCell row={row} table={table} column={{ id: "tags" }} type="tags" getValue={() => product.tags} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Menudeo</label>
              <EditableCell
                row={row}
                table={table}
                column={{ id: "price_retail" }}
                type="currency"
                getValue={() => product.price_retail}
                className="bg-white border border-slate-200 h-8 font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mayoreo</label>
              <EditableCell
                row={row}
                table={table}
                column={{ id: "price_wholesale" }}
                type="currency"
                getValue={() => product.price_wholesale}
                className="bg-white border border-slate-200 h-8 font-medium text-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const columnHelper = createColumnHelper<ProductWithUI>();

// Base columns (used by all users)
const getBaseColumns = () => [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
  }),
  columnHelper.accessor("original_image_url", {
    header: "Img",
    cell: (info) => (
      <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group">
        {info.getValue() && (
          <img
            src={info.row.original.processed_image_url || info.getValue() || ""}
            className="w-full h-full object-cover mix-blend-multiply transition-transform group-hover:scale-110"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
      </div>
    ),
  }),
  columnHelper.accessor("sku", {
    header: "SKU",
    cell: (props) => <EditableCell {...props} type="text" className="font-mono text-xs text-slate-500" />,
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4 h-8 text-xs font-semibold text-slate-500 hover:text-indigo-600"
      >
        Nombre <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    ),
    cell: (props) => (
      <div className="min-w-[180px] max-w-[300px]">
        <EditableCell {...props} className="font-medium text-slate-900" />
      </div>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Categoría",
    cell: (props) => <EditableCell {...props} type="select" className="w-[140px]" />,
    filterFn: (row, columnId, filterValue) => {
      const category = row.getValue(columnId) as string;
      if (!category) return false;
      const term = filterValue.toLowerCase();
      return (
        category.toLowerCase().includes(term) ||
        PRODUCT_CATEGORIES.find((c) => c.value === category)
          ?.label.toLowerCase()
          .includes(term) ||
        false
      );
    },
  }),
  columnHelper.accessor((row) => (row.tags || []).join(" "), {
    id: "tags",
    header: "Tags",
    cell: (props) => (
      <EditableCell {...props} type="tags" getValue={() => props.row.original.tags} className="max-w-[200px]" />
    ),
  }),
  columnHelper.accessor("price_retail", {
    header: () => <div className="text-right">Menudeo</div>,
    cell: (props) => <EditableCell {...props} type="currency" />,
  }),
  columnHelper.accessor("price_wholesale", {
    header: () => <div className="text-right">Mayoreo</div>,
    cell: (props) => <EditableCell {...props} type="currency" className="text-emerald-600" />,
  }),
  columnHelper.accessor("wholesale_min_qty", {
    header: () => <div className="text-center text-xs">Min Qty</div>,
    cell: (props) => <EditableCell {...props} type="number" className="text-center" />,
  }),
  // --- BACKORDER COLUMNS ---
  columnHelper.accessor("allow_backorder", {
    header: () => <div className="text-center text-xs">S/Stock</div>,
    cell: (props) => <EditableCell {...props} type="boolean" />,
  }),
  columnHelper.accessor("lead_time_days", {
    header: () => (
      <div className="text-center text-xs flex items-center justify-center gap-1">
        <Clock className="w-3 h-3" /> Días
      </div>
    ),
    cell: (props) => {
      const allowBackorder = props.row.original.allow_backorder;
      return (
        <EditableCell 
          {...props} 
          type="number" 
          className={`text-center ${!allowBackorder ? "opacity-40" : ""}`}
          disabled={!allowBackorder}
        />
      );
    },
  }),
  columnHelper.display({
    id: "variants",
    header: "",
    cell: ({ row, table }) => (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
          onClick={() => table.options.meta?.onOpenVariants(row.original)}
        >
          <GitBranch className="w-3.5 h-3.5" />
          {row.original.has_variants && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-slate-200 text-slate-600">
              {row.original.variant_count}
            </Badge>
          )}
        </Button>
      </div>
    ),
  }),
];

// Admin-only vendor column
const getVendorColumn = () => columnHelper.accessor((row) => (row as any).vendor_name, {
  id: "vendor",
  header: "Vendor",
  cell: (props) => {
    const vendorName = (props.row.original as any).vendor_name || (props.row.original as any).vendor_id;
    return (
      <div className="text-xs text-slate-500 truncate max-w-[100px]" title={vendorName}>
        {vendorName || <span className="text-slate-300 italic">--</span>}
      </div>
    );
  },
});

interface ProductTableProps {
  data: ProductWithUI[];
  isLoading: boolean;
  onUpdateProduct: (id: string, field: string, value: any) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkCatalog: (ids: string[]) => void;
  onOpenVariants: (product: ProductWithUI) => void;
  onBulkAction: (action: "category" | "tags" | "min_qty" | "price_retail" | "price_wholesale", ids: string[]) => void;
  isAdmin?: boolean;
}

export function ProductTable({
  data,
  isLoading,
  onUpdateProduct,
  onBulkDelete,
  onBulkCatalog,
  onOpenVariants,
  onBulkAction,
  isAdmin = false,
}: ProductTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Build columns dynamically based on role
  const columns = (() => {
    const baseColumns = getBaseColumns();
    if (isAdmin) {
      // Insert vendor column after select checkbox
      const vendorCol = getVendorColumn();
      return [baseColumns[0], vendorCol, ...baseColumns.slice(1)] as ColumnDef<ProductWithUI, any>[];
    }
    return baseColumns as ColumnDef<ProductWithUI, any>[];
  })();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    state: { sorting, globalFilter, rowSelection },
    meta: {
      updateData: (productId: string, columnId: string, value: any) => onUpdateProduct(productId, columnId, value),
      onOpenVariants: (product: ProductWithUI) => onOpenVariants(product),
    } as any,
  });

  const selectedIds = Object.keys(rowSelection);

  return (
    <div className="space-y-4">
      {/* HEADER & FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-20 md:static">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, SKU, tags, categoría..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
          />
        </div>
        <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
          {table.getFilteredRowModel().rows.length} productos
        </div>
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-semibold h-12 align-middle whitespace-nowrap">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <span className="text-slate-400">Cargando inventario...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-32 text-center text-slate-400">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`group hover:bg-slate-50 transition-colors ${row.getIsSelected() ? "bg-indigo-50/40" : ""}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {table.getRowModel().rows.length > 0 && (
          <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="bg-white"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="bg-white"
              >
                Siguiente
              </Button>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
          </div>
        )}
      </div>

      {/* VISTA MÓVIL */}
      <div className="md:hidden space-y-3 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          table.getRowModel().rows.map((row) => <MobileProductRow key={row.id} row={row} table={table} />)
        )}
      </div>

      {/* BARRA FLOTANTE ACCIONES MASIVAS */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className="bg-slate-900 text-white shadow-xl rounded-full px-5 py-3 flex flex-wrap items-center justify-center gap-4 border border-slate-700 pointer-events-auto max-w-[95vw]">
              <div className="flex items-center gap-3 border-r border-slate-700 pr-4">
                <span className="bg-indigo-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedIds.length}
                </span>
                <span className="text-sm font-medium text-slate-200 hidden md:inline">Seleccionados</span>
              </div>

              <div className="flex items-center gap-1">
                {/* BOTONES DE ACCIÓN */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-indigo-200 hover:text-white hover:bg-slate-800"
                  onClick={() => onBulkAction("category", selectedIds)}
                  title="Cambiar Categoría"
                >
                  <Layers className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Categoría</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-indigo-200 hover:text-white hover:bg-slate-800"
                  onClick={() => onBulkAction("tags", selectedIds)}
                  title="Editar Tags"
                >
                  <Tag className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Tags</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-indigo-200 hover:text-white hover:bg-slate-800"
                  onClick={() => onBulkAction("price_retail", selectedIds)}
                  title="Precio Menudeo"
                >
                  <DollarSign className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Menudeo</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-indigo-200 hover:text-white hover:bg-slate-800"
                  onClick={() => onBulkAction("price_wholesale", selectedIds)}
                  title="Precio Mayoreo"
                >
                  <DollarSign className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Mayoreo</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-indigo-200 hover:text-white hover:bg-slate-800"
                  onClick={() => onBulkAction("min_qty", selectedIds)}
                  title="Min. Mayoreo"
                >
                  <Hash className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Min.</span>
                </Button>

                <div className="w-px h-4 bg-slate-700 mx-1"></div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                  onClick={() => onBulkDelete(selectedIds)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 ml-1 rounded-full hover:bg-slate-800 text-slate-400"
                onClick={() => setRowSelection({})}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
