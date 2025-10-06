import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CatalogHeaderProps {
  businessName: string;
  businessLogo?: string | null;
  catalogName: string;
  catalogDescription?: string | null;
  quoteItemCount?: number;
}

export default function CatalogHeader({
  businessName,
  businessLogo,
  catalogName,
  catalogDescription,
  quoteItemCount = 0,
}: CatalogHeaderProps) {
  return (
    <header className="sticky top-0 bg-background border-b shadow-sm z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Business Branding */}
          <div className="flex items-center gap-3 min-w-0">
            {businessLogo && (
              <img
                src={businessLogo}
                alt={businessName}
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2 className="text-sm md:text-base font-semibold text-foreground truncate">
                {businessName}
              </h2>
            </div>
          </div>

          {/* Mobile Quote Button */}
          {quoteItemCount > 0 && (
            <button className="md:hidden relative p-2 rounded-full hover:bg-accent transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {quoteItemCount}
              </Badge>
            </button>
          )}
        </div>

        {/* Catalog Info */}
        <div className="mt-4">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {catalogName}
          </h1>
          {catalogDescription && (
            <p className="text-sm md:text-base text-muted-foreground line-clamp-2">
              {catalogDescription}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
