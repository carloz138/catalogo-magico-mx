import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/types/products";

interface EditableCellProps {
  getValue: () => any;
  row: any;
  column: any;
  table: any;
  type?: "text" | "number" | "currency" | "select" | "tags";
  className?: string; // Permitir clases personalizadas
}

export const EditableCell = ({
  getValue,
  row,
  column,
  table,
  type = "text",
  className,
}: EditableCellProps) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Manejo del guardado
  const handleSave = (newValue: any) => {
    setIsEditing(false);
    
    // Validación simple para no disparar updates si no cambió nada
    const isValuesDifferent = JSON.stringify(newValue) !== JSON.stringify(initialValue);
    
    if (isValuesDifferent) {
      // Llamamos a la función meta que definimos en la tabla principal
      table.options.meta?.updateData(row.original.id, column.id, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
       // Para tags, procesamos el string a array al dar enter
       if (type === "tags" && typeof value === 'string') {
          const tagsArray = value.split(',').map(t => t.trim()).filter(Boolean);
          handleSave(tagsArray);
       } else {
          handleSave(value);
       }
    }
    if (e.key === "Escape") {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  // --- MODO EDICIÓN ---
  if (isEditing) {
    if (type === "select") {
      return (
        <Select
          open={true}
          onOpenChange={(open) => !open && setIsEditing(false)}
          value={value as string}
          onValueChange={(val) => handleSave(val)}
        >
          <SelectTrigger className="h-8 w-full border-indigo-500 bg-white ring-2 ring-indigo-200 z-50">
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        ref={inputRef}
        value={type === "tags" && Array.isArray(value) ? value.join(", ") : value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
            if (type === "tags") {
                // Al perder el foco en tags, guardamos lo que haya escrito como array
                const tagsArray = (typeof value === 'string' ? value : (Array.isArray(value) ? value.join(", ") : ""))
                    .split(',')
                    .map((t: string) => t.trim())
                    .filter(Boolean);
                handleSave(tagsArray);
            } else {
                handleSave(value);
            }
        }}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn(
          "h-8 text-sm shadow-sm border-indigo-500 ring-2 ring-indigo-200",
          (type === "number" || type === "currency") && "text-right font-mono",
          className
        )}
        type={type === "number" || type === "currency" ? "number" : "text"}
      />
    );
  }

  // --- MODO LECTURA ---
  let displayValue = value;

  if (type === "currency") {
    // Lógica: Base de datos está en centavos (integer), Frontend muestra pesos
    const amount = value ? value / 100 : 0;
    displayValue = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  } else if (type === "select") {
    displayValue = PRODUCT_CATEGORIES.find((c) => c.value === value)?.label || value || <span className="text-slate-300 italic text-xs">--</span>;
  } else if (type === "tags") {
    const tags = (value as string[]) || [];
    if (tags.length === 0) return <div onClick={() => setIsEditing(true)} className="h-8 w-full cursor-pointer hover:bg-slate-100/50 rounded" title="Clic para agregar tags" />;
    
    return (
      <div onClick={() => setIsEditing(true)} className="flex flex-wrap gap-1 cursor-pointer min-h-[32px] items-center">
        {tags.slice(0, 2).map((tag, i) => (
          <Badge key={i} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal text-slate-600 bg-slate-100 border-slate-200">
            {tag}
          </Badge>
        ))}
        {tags.length > 2 && <span className="text-[10px] text-slate-400">+{tags.length - 2}</span>}
      </div>
    );
  } else if ((value === null || value === undefined || value === "") && value !== 0) {
     displayValue = <span className="text-slate-300 italic text-xs">--</span>;
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer px-2 py-1.5 rounded hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all min-h-[32px] flex items-center truncate text-sm",
        (type === "number" || type === "currency") && "justify-end font-mono",
        className
      )}
      title="Clic para editar"
    >
      {displayValue}
    </div>
  );
};
