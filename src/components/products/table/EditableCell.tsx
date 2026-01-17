import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/types/products";

interface EditableCellProps {
  getValue: () => any;
  row: any;
  column: any;
  table: any;
  type?: "text" | "number" | "currency" | "select" | "tags" | "boolean";
  className?: string;
  disabled?: boolean;
}

export const EditableCell = ({ getValue, row, column, table, type = "text", className, disabled = false }: EditableCellProps) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = (newValue: any, isCurrency: boolean = false) => {
    setIsEditing(false);
    
    // Para currency: convertir el valor ingresado (en pesos) a centavos para la BD
    let valueToSave = newValue;
    if (isCurrency && newValue !== null && newValue !== undefined && newValue !== "") {
      const numericValue = parseFloat(newValue);
      if (!isNaN(numericValue)) {
        valueToSave = Math.round(numericValue * 100); // Convertir pesos a centavos
      }
    }
    
    const isValuesDifferent = JSON.stringify(valueToSave) !== JSON.stringify(initialValue);
    if (isValuesDifferent) {
      table.options.meta?.updateData(row.original.id, column.id, valueToSave);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (type === "tags") {
        // Si es string, lo convertimos a array. Si ya es array, lo dejamos.
        const valToProcess = typeof value === "string" ? value : "";
        const tagsArray = valToProcess
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        handleSave(tagsArray);
      } else if (type === "currency") {
        handleSave(value, true);
      } else {
        handleSave(value);
      }
    }
    if (e.key === "Escape") {
      setValue(type === "currency" ? (initialValue ? initialValue / 100 : "") : initialValue);
      setIsEditing(false);
    }
  };

  // --- BOOLEAN TYPE (Switch) - No editing mode needed ---
  if (type === "boolean") {
    const boolValue = Boolean(value);
    return (
      <div className={cn("flex items-center justify-center", disabled && "opacity-50", className)}>
        <Switch
          checked={boolValue}
          disabled={disabled}
          onCheckedChange={(checked) => {
            setValue(checked);
            table.options.meta?.updateData(row.original.id, column.id, checked);
          }}
        />
      </div>
    );
  }

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

    // Preparar valor para el input
    // - Para tags: array -> string
    // - Para currency: centavos -> pesos (dividir entre 100)
    let inputValue: string | number = "";
    if (type === "tags" && Array.isArray(value)) {
      inputValue = value.join(", ");
    } else if (type === "currency") {
      // Mostrar valor en pesos para edición (el valor almacenado está en centavos)
      inputValue = initialValue ? (initialValue / 100).toString() : "";
    } else {
      inputValue = value || "";
    }

    return (
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (type === "tags") {
            // Lógica robusta al guardar tags
            const rawVal = typeof value === "string" ? value : inputValue;
            const tagsArray = rawVal
              .toString()
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean);
            handleSave(tagsArray);
          } else if (type === "currency") {
            handleSave(value, true);
          } else {
            handleSave(value);
          }
        }}
        onKeyDown={handleKeyDown}
        autoFocus
        step={type === "currency" ? "0.01" : undefined}
        placeholder={type === "currency" ? "Ej: 150.00" : undefined}
        className={cn(
          "h-8 text-sm shadow-sm border-indigo-500 ring-2 ring-indigo-200",
          (type === "number" || type === "currency") && "text-right font-mono",
          className,
        )}
        type={type === "number" || type === "currency" ? "number" : "text"}
      />
    );
  }

  // --- MODO LECTURA ---
  let displayValue = value;

  if (type === "currency") {
    const amount = value ? value / 100 : 0;
    displayValue = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  } else if (type === "select") {
    displayValue = PRODUCT_CATEGORIES.find((c) => c.value === value)?.label || value || (
      <span className="text-slate-300 italic text-xs">--</span>
    );
  } else if (type === "tags") {
    // 🔥 CORRECCIÓN DEL CRASH AQUÍ 🔥
    // Verificamos explícitamente si es un array. Si no, usamos array vacío.
    const tags = Array.isArray(value) ? value : [];

    if (tags.length === 0) {
      return (
        <div
          onClick={() => setIsEditing(true)}
          className="h-8 w-full cursor-pointer hover:bg-slate-100/50 rounded flex items-center"
          title="Clic para agregar tags"
        >
          <span className="text-slate-300 italic text-[10px] px-2 opacity-0 hover:opacity-100 transition-opacity">
            + tags
          </span>
        </div>
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="flex flex-wrap gap-1 cursor-pointer min-h-[32px] items-center py-1"
      >
        {tags.slice(0, 2).map((tag: string, i: number) => (
          <Badge
            key={i}
            variant="secondary"
            className="px-1.5 py-0 text-[10px] font-normal text-slate-600 bg-slate-100 border-slate-200 whitespace-nowrap"
          >
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
        className,
      )}
      title="Clic para editar"
    >
      {displayValue}
    </div>
  );
};
