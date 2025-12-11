import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Asegúrate de tener cn importado, si no, quítalo y usa strings normales

interface CatalogHeaderProps {
  businessName: string;
  businessLogo?: string | null;
  catalogName: string;
  catalogDescription?: string | null;
  quoteItemCount?: number;
  // ✅ NUEVO: Recibimos el color de la marca
  primaryColor?: string;
}

export default function CatalogHeader({
  businessName,
  businessLogo,
  catalogName,
  catalogDescription,
  quoteItemCount = 0,
  primaryColor,
}: CatalogHeaderProps) {
  // Lógica simple: Si hay un color primario definido, asumimos que es un color fuerte
  // y ponemos el texto en blanco. Si no, usamos los colores por defecto (fondo blanco, texto negro).
  const hasCustomColor = !!primaryColor;

  return (
    <header
      className={cn(
        "sticky top-0 border-b shadow-sm z-40 transition-colors duration-300",
        // Si NO hay color personalizado, usa el fondo default
        !hasCustomColor && "bg-background",
      )}
      style={
        hasCustomColor
          ? {
              backgroundColor: primaryColor,
              color: "#ffffff", // Forzamos texto blanco para contraste
              borderColor: "rgba(255,255,255,0.1)",
            }
          : undefined
      }
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Business Branding */}
          <div className="flex items-center gap-3 min-w-0">
            {businessLogo && (
              <img
                src={businessLogo}
                alt={businessName}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover flex-shrink-0 bg-white/10"
              />
            )}
            <div className="min-w-0">
              <h2
                className={cn(
                  "text-sm md:text-base font-semibold truncate",
                  hasCustomColor ? "text-white" : "text-foreground",
                )}
              >
                {businessName}
              </h2>
            </div>
          </div>

          {/* Mobile Quote Button */}
          {quoteItemCount > 0 && (
            <button
              className={cn(
                "md:hidden relative p-2 rounded-full transition-colors",
                hasCustomColor ? "hover:bg-white/20 text-white" : "hover:bg-accent text-foreground",
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              <Badge
                className={cn(
                  "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs",
                  hasCustomColor ? "bg-white text-black hover:bg-white/90" : "", // Badge invertido si hay fondo
                )}
              >
                {quoteItemCount}
              </Badge>
            </button>
          )}
        </div>

        {/* Catalog Info */}
        <div className="mt-4">
          <h1
            className={cn(
              "text-xl md:text-2xl lg:text-3xl font-bold mb-2",
              hasCustomColor ? "text-white" : "text-foreground",
            )}
          >
            {catalogName}
          </h1>
          {catalogDescription && (
            <p
              className={cn(
                "text-sm md:text-base line-clamp-2",
                hasCustomColor ? "text-white/80" : "text-muted-foreground",
              )}
            >
              {catalogDescription}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
