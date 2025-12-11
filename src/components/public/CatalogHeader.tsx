import { ShoppingCart, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// ✅ IMPORTANTE: Importamos la fuente de la verdad de los diseños
import { EXPANDED_WEB_TEMPLATES } from "@/lib/web-catalog/expanded-templates-catalog";

interface CatalogHeaderProps {
  businessName: string;
  businessLogo?: string | null;
  catalogName: string;
  catalogDescription?: string | null;
  quoteItemCount?: number;
  // ✅ Recibimos el color directo O el ID del template para buscarlo
  primaryColor?: string;
  templateId?: string;
}

export default function CatalogHeader({
  businessName,
  businessLogo,
  catalogName,
  catalogDescription,
  quoteItemCount = 0,
  primaryColor,
  templateId,
}: CatalogHeaderProps) {
  // 1. Lógica Inteligente de Color:
  // Si no me das un color explícito, lo busco en la lista de templates usando el ID.
  const activeTemplate = templateId ? EXPANDED_WEB_TEMPLATES.find((t) => t.id === templateId) : null;

  const bgColor = primaryColor || activeTemplate?.colorScheme.primary;

  // 2. Lógica de Contraste (Accesibilidad):
  // Si el color de fondo es muy claro (ej. Amarillo), usamos texto oscuro.
  // Si es oscuro (ej. Azul, Negro), usamos texto blanco.
  // Nota: Si el template define un 'text' específico para el header, podríamos usarlo,
  // pero por seguridad visual, invertiremos basado en el theme.
  const isDarkTheme =
    activeTemplate?.colorScheme.background === "#000000" || activeTemplate?.colorScheme.background === "#09090b";

  // Si tenemos un color de fondo definido, asumimos que queremos texto blanco
  // SALVO que sea un tema muy claro. Por simplicidad y elegancia,
  // la mayoría de tus templates usan colores fuertes en "primary", así que blanco va bien.
  const hasCustomColor = !!bgColor;

  return (
    <header
      className={cn(
        "sticky top-0 border-b shadow-sm z-40 transition-all duration-500",
        // Mobile First: Padding ajustado para dedos
        "py-3 md:py-4",
        !hasCustomColor && "bg-background/95 backdrop-blur-md",
      )}
      style={
        hasCustomColor
          ? {
              backgroundColor: bgColor,
              color: "#ffffff", // Por defecto texto blanco sobre color primario
              borderColor: "rgba(255,255,255,0.1)",
            }
          : undefined
      }
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
          {/* --- BLOQUE IZQUIERDO: BRANDING --- */}
          <div className="flex items-center gap-3 min-w-0">
            {businessLogo ? (
              <img
                src={businessLogo}
                alt={businessName}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover flex-shrink-0 bg-white shadow-sm border border-white/20"
              />
            ) : (
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
                {businessName.substring(0, 2)}
              </div>
            )}

            <div className="min-w-0 flex flex-col justify-center">
              <h2
                className={cn(
                  "text-xs md:text-sm font-medium tracking-wide opacity-90 truncate uppercase",
                  hasCustomColor ? "text-white/90" : "text-muted-foreground",
                )}
              >
                {businessName}
              </h2>
              <h1
                className={cn(
                  "text-lg md:text-xl font-bold truncate leading-tight",
                  hasCustomColor ? "text-white" : "text-foreground",
                )}
              >
                {catalogName}
              </h1>
            </div>
          </div>

          {/* --- BLOQUE DERECHO: CARRITO (Mobile Optimized) --- */}
          {quoteItemCount > 0 && (
            <button
              className={cn(
                "relative p-3 rounded-full transition-transform active:scale-95",
                hasCustomColor
                  ? "bg-white/20 hover:bg-white/30 text-white shadow-inner"
                  : "bg-secondary hover:bg-secondary/80 text-foreground",
              )}
              aria-label="Ver carrito"
            >
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />

              <Badge
                className={cn(
                  "absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px] font-bold border-2",
                  hasCustomColor
                    ? "bg-white text-black border-transparent" // Badge blanco sobre fondo color
                    : "bg-black text-white border-white", // Badge negro sobre fondo blanco
                )}
              >
                {quoteItemCount}
              </Badge>
            </button>
          )}
        </div>

        {/* --- DESCRIPCIÓN (Opcional, se oculta en scroll si quisieras animarlo después) --- */}
        {catalogDescription && (
          <div className="mt-3 hidden md:block animate-in fade-in slide-in-from-top-1 duration-500">
            <p
              className={cn(
                "text-sm md:text-base line-clamp-1 opacity-80",
                hasCustomColor ? "text-white" : "text-muted-foreground",
              )}
            >
              {catalogDescription}
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
