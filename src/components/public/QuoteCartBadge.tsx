import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useQuoteCart } from '@/contexts/QuoteCartContext';

interface Props {
  onClick: () => void;
}

export function QuoteCartBadge({ onClick }: Props) {
  const { totalItems } = useQuoteCart();

  if (totalItems === 0) return null;

  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-full px-6 py-6"
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        <Badge 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-destructive text-destructive-foreground"
        >
          {totalItems}
        </Badge>
      </div>
      <span className="ml-2 hidden sm:inline">Ver Cotización</span>
    </Button>
  );
}
