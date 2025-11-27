import "@tanstack/react-table";

// Aquí extendemos los tipos oficiales de TanStack Table
// para que reconozca nuestras funciones personalizadas en "meta"
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    // Función para actualizar una celda (ProductTable -> Supabase)
    updateData?: (rowIndex: string, columnId: string, value: unknown) => void;
    
    // Función para abrir el modal de variantes
    onOpenVariants?: (product: any) => void;
  }
}
